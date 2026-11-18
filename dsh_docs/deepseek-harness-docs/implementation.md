# 实现结构：index.js

插件全部实现在单文件 [`index.js`](../../index.js) 中，保持零运行时依赖、零构建步骤。本文说明常量、函数划分与关键处理逻辑；工具行为契约见 [`tools.md`](./tools.md)。

## 1. 注入的服务

```js
export const inject = ['tools', 'fs', 'workingDirectory', 'systemPrompt'];
```

- `systemPrompt`：注册名为 `deepseek-harness-docs`、`order: 550` 的提示词段落，内容为 `METHODOLOGY`。
- `tools`：注册 `dsh_docs_init`、`dsh_docs_update`。
- `fs`：`resolve` / `stat` / `listDir` / `readText` / `writeText`。
- `workingDirectory`：通过 `ctx.workingDirectory.ensure(exec.agent, exec.signal)` 取得会话工作目录，作为相对 `directory` 的解析基准。

## 2. 内容常量和边界常量

| 名称 | 值/作用 |
| --- | --- |
| `PLUGIN_VERSION` | `1.1.0`；同时写入 `DSHD_TEMPLATE` 和 `METHODOLOGY` |
| `DSHD_TEMPLATE` | `DSHD.md` 的固定模板；`dsh_docs_init` 原样写入，`dsh_docs_update` 据此校验 |
| `METHODOLOGY` | 注入系统提示词的文档规范，内嵌固定模板 |
| `OVERVIEW_SKELETON` / `INDEX_SKELETON` | `dsh_docs_init` 的占位内容 |
| `DOCS_DIR_NAME` | `'dsh_docs'` |
| `FIXED_DOC_FILES` | `DSHD.md`、`OVERVIEW.md`、`INDEX.md` |
| `REQUIRED_OVERVIEW_SECTIONS` | 概述、项目结构、开发规则、禁止行为 |
| `MAX_DOC_ENTRIES` | 400；枚举文件+目录条目上限 |
| `MAX_DOC_DEPTH` | 8；目录递归深度上限 |
| `MAX_DOC_BYTES` | 512 KiB；单文档内容检查上限 |
| `MAX_PROJECT_ENTRIES` | 80；返回给模型的顶层代码条目上限 |
| `MAX_ISSUES` | 200；单次校验最多列出的问题数，超出追加 `ISSUE_LIMIT_REACHED` |
| `PROJECT_ENTRY_SKIP` | 跳过 `dsh_docs/`、`.git`、`node_modules` |
| `STATUS_TEXT` | `dsh_docs_update` 渲染状态文案 |

`DSHD_TEMPLATE` 中包含 `${PLUGIN_VERSION}` 插值，因此升级版本后，旧项目中的 `DSHD.md` 会被校验为版本不一致，工作单会要求按新模板重写。

## 3. 工具注册与执行

### `dsh_docs_init`

- 参数：可选 `directory`。
- 计算 `docsDirRel = join(base, DOCS_DIR_NAME)`。
- 内部 `writeFile(rel, content, createOnly)`：
  - 先用 `ctx.fs.resolve` 得到目标，再按需 `ctx.fs.stat`；
  - `createOnly` 且目标存在时记入 `skipped`，不写；
  - 否则调用 `ctx.fs.writeText` 并记入 `created`。
- 写入顺序：`DSHD.md`（可覆盖）→ `OVERVIEW.md`（仅新建）→ `INDEX.md`（仅新建）。
- 返回 Host 绝对路径 `root` 以及文档约定路径列表。

### `dsh_docs_update`

执行流程：

1. 解析 `base`，并用 `ctx.fs.resolve` + `ctx.fs.stat` 确认项目根存在且为目录；不存在或不是目录时抛出明确错误（属于工具调用失败，不是文档问题码）。
2. 解析 `dsh_docs` 目标并 `stat`；缺失或非目录的结果交给 `inspectDshDocs` 转成问题码。
3. `listProjectEntries` 列出项目根顶层条目，作为 agent 阅读代码的入口。
4. `inspectDshDocs` 完成全部只读校验并生成工作单。
5. 返回 `{ projectRoot, root, status, documents, directories, projectEntries, issues, workOrder }`。

`dsh_docs_update` 在整条路径上只调用 `resolve`、`stat`、`listDir`、`readText`，不调用 `writeText`。

## 4. 校验函数 `inspectDshDocs`

`inspectDshDocs(ctx, options)` 接收 `docsDirRel`、`docsDirTarget`、`docsDirInfo`、`projectRoot`、`resolveOptions`、`signal`，分阶段执行：

1. **早退**：`docsDirInfo === undefined` → 返回 `not_initialized` + `MISSING_DSH_DOCS`；不是目录 → 返回 `update_required` + `DSH_DOCS_NOT_DIRECTORY`。两种情况都生成对应工作单。
2. **枚举**：`collectDocs` 递归 `listDir`，记录 `.md` 与其他文件、子目录；超过边界置 `truncated`。
3. **固定文件**：未截断时检查 `FIXED_DOC_FILES` 是否齐全。
4. **读取**：对 `.md` 文件调用 `readText`；过大或读取失败记 warning，不中断其余检查。
5. **DSHD.md**：换行归一化并 `trim` 后与模板比较；用正则提取 `插件版本：X` 区分版本不一致与内容漂移。
6. **OVERVIEW.md**：占位注释正则 + 标题行提取（`/^#{1,6}\s+(.+)$/gm`）后的四段包含检查。
7. **INDEX.md**：占位注释检查；提取索引链接得到 `indexedTargets`；计算“包含 `.md` 的顶层目录 + 顶层 `.md` 文件”集合，逐个判断是否被链接覆盖或被 INDEX 文本按相对路径提及。
8. **链接**：对每份已读取文档，先由 `maskMarkdownCode` 屏蔽围栏代码块、行内代码与 HTML 注释，再逐个解析内联链接目标并 `stat`；同一文档内相同解析目标去重。
9. **状态与工作单**：`issues.length === 0` → `ok`，否则 `update_required`；`buildUpdateWorkOrder` 根据问题码追加针对性步骤。

`documents` 的排序规则：Markdown 文档中三个固定文件按固定顺序在前，其余文件按相对路径字典序。

## 5. 路径与错误处理约定

- 路径拼接使用 `node:path` 的 `join`/`dirname`/`normalize`；`displayPath` 把反斜杠转成 `/`，保证模型看到的路径可读、可复制。
- 所有相对路径先按 `resolveOptions.cwd`（会话工作目录）解析；`directory` 传入绝对路径时输出也使用绝对路径。
- 读文件、列目录、写文件的失败向上抛出；单个文档读取失败、单个链接 `stat` 失败则降级为 warning，避免一个坏文档阻断整次校验。
- `exec.signal` 传给每个 `ctx.fs` 调用，支持取消。
- `renderUpdateResult`/`renderInitResult` 是纯函数，只依赖参数与校验结果，不读文件、不修改状态。

## 6. 与测试的关系

内部辅助函数没有单独导出；测试通过 `apply(ctx)` 捕获注册的 `ToolDefinition`，再用假 `ctx.fs` 调用 `execute`，覆盖初始化、未初始化、结构问题、缺失固定文件和合法文档树。测试细节见 [`verification.md`](./verification.md)。
