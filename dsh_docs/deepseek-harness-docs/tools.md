# 工具契约：dsh_docs_init 与 dsh_docs_update

本插件的全部工具都注册在 [`index.js`](../../index.js) 的 `apply(ctx)` 中，通过 DSH 的 `tools` 服务提供给模型。两个工具共用可选的 `directory` 参数：相对路径按当前会话工作目录解析，省略时使用会话工作目录；返回中的 `root`、`projectRoot` 为 Host 视角的绝对路径。

## 1. `dsh_docs_init`

### 参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `directory` | `string` | 否 | 项目根目录；`dsh_docs/` 创建在该目录下。 |

### 行为

1. 解析项目根目录下的 `dsh_docs/`。
2. **无条件**写入 `dsh_docs/DSHD.md`，内容为 `DSHD_TEMPLATE`，其中版本号为当前 `PLUGIN_VERSION`。
3. 仅在文件不存在时创建 `dsh_docs/OVERVIEW.md`（四段骨架）与 `dsh_docs/INDEX.md`（索引占位）；已存在则跳过，不覆盖用户内容。
4. 通过 `ctx.fs.writeText` 写文件；仅新建文件在写入前用 `ctx.fs.stat` 检查存在性；写操作传递 `exec.signal`。

### 返回

```json
{
  "root": "/abs/project/dsh_docs",
  "created": ["dsh_docs/DSHD.md", "dsh_docs/OVERVIEW.md", "dsh_docs/INDEX.md"],
  "skipped": ["dsh_docs/OVERVIEW.md"]
}
```

`created` / `skipped` 使用 `dsh_docs/` 前缀展示文档约定路径（与传入的 `directory` 无关）。`DSHD.md` 每次都会出现在 `created` 中，因为它是固定文件、允许重写。

## 2. `dsh_docs_update`

### 参数

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `directory` | `string` | 否 | 包含 `dsh_docs/` 的项目根目录。 |

### 只读保证

`dsh_docs_update` **不写任何文件**。它只做结构校验、链接校验并生成工作单；文档内容与代码是否一致由调用它的 agent 负责判断和修正。这是该工具与 `dsh_docs_init` 的关键边界。

### 校验项

1. **目录与固定文件**
   - `dsh_docs/` 是否存在且为目录；不存在时状态为 `not_initialized`。
   - `DSHD.md`、`OVERVIEW.md`、`INDEX.md` 是否齐全（仅当目录枚举未被截断时检查）。
2. **`DSHD.md`**
   - 与当前 `DSHD_TEMPLATE` 做换行归一化后的比较。
   - 版本号不等于 `PLUGIN_VERSION` → `DSHD_VERSION_MISMATCH`；版本相同但内容有差异 → `DSHD_CONTENT_DRIFT`。
3. **`OVERVIEW.md`**
   - 是否还残留骨架注释 → `OVERVIEW_PLACEHOLDER`。
   - 标题中是否包含四个必需部分（概述、项目结构、开发规则、禁止行为）→ `OVERVIEW_MISSING_SECTIONS`。
4. **`INDEX.md`**
   - 是否还残留索引占位注释 → `INDEX_PLACEHOLDER`。
   - 模块覆盖：所有“包含至少一个 `.md` 的顶层目录”和“顶层 `.md` 文件”（固定三个文件除外）是否被索引链接覆盖或按相对路径提及 → `INDEX_MISSING_ENTRY`。
5. **相对链接**
   - 读取 `dsh_docs` 下所有 `.md` 文件（超过 512 KiB 的跳过读取并告警），先屏蔽围栏代码块、行内代码与 HTML 注释，再提取内联 Markdown 链接 `[text](target)`；文档示例中的链接不会被误判。
   - 跳过 `#anchor`、`/absolute`、`//protocol-relative` 与带协议前缀（`http:`、`mailto:` 等）的目标；去掉 `?query`、`#fragment` 后按文档所在目录解析。
   - 目标不存在 → `BROKEN_LINK`；检查过程抛错（如沙箱/远程限制）→ `LINK_CHECK_FAILED`。
   - 不处理引用式链接（`[text][ref]`）与自动链接（`<https://...>`）。
6. **规模边界**
   - 最多枚举 400 个文件/目录条目、8 层目录；超出时 `INVENTORY_TRUNCATED`。
   - 单文档超过 512 KiB 时 `DOC_TOO_LARGE`。
   - 读取失败时 `DOC_READ_FAILED`。

### 问题码

| 问题码 | 严重级别 | 含义 |
| --- | --- | --- |
| `MISSING_DSH_DOCS` | error | `dsh_docs/` 不存在，状态为 `not_initialized` |
| `DSH_DOCS_NOT_DIRECTORY` | error | 同名路径存在但不是目录 |
| `MISSING_REQUIRED_FILE` | error | 固定文件缺失 |
| `DSHD_VERSION_MISMATCH` | error | DSHD.md 记录的版本不是当前插件版本 |
| `DSHD_CONTENT_DRIFT` | warning | 版本正确但内容偏离固定模板 |
| `OVERVIEW_PLACEHOLDER` | warning | OVERVIEW.md 仍含骨架占位注释 |
| `OVERVIEW_MISSING_SECTIONS` | warning | OVERVIEW.md 缺少四个必需部分之一 |
| `INDEX_PLACEHOLDER` | warning | INDEX.md 仍含占位注释 |
| `INDEX_MISSING_ENTRY` | warning | 模块目录/顶层文档未被 INDEX.md 覆盖 |
| `BROKEN_LINK` | error | 相对链接目标不存在 |
| `LINK_CHECK_FAILED` | warning | 链接检查无法完成（如沙箱限制） |
| `DOC_READ_FAILED` | warning | Markdown 文档读取失败 |
| `DOC_TOO_LARGE` | warning | 文档超过 512 KiB，跳过内容检查 |
| `INVENTORY_TRUNCATED` | warning | 文档树过大，枚举被截断 |
| `ISSUE_LIMIT_REACHED` | warning | 问题超过 200 条，后续问题未列出 |

### 返回

```json
{
  "projectRoot": "/abs/project",
  "root": "/abs/project/dsh_docs",
  "status": "update_required",
  "documents": ["dsh_docs/DSHD.md", "dsh_docs/OVERVIEW.md", "dsh_docs/INDEX.md", "dsh_docs/module/a.md"],
  "directories": ["dsh_docs/module"],
  "projectEntries": ["index.js", "locale/", "package.json", "test/"],
  "issues": [
    {
      "code": "BROKEN_LINK",
      "severity": "error",
      "path": "dsh_docs/module/a.md",
      "message": "Link \"./missing.md\" resolves to dsh_docs/module/missing.md, which does not exist."
    }
  ],
  "workOrder": ["..."]
}
```

- `status`：`ok`（无结构问题）、`update_required`（存在 error/warning）、`not_initialized`（没有 `dsh_docs/`）。
- `status: "ok"` **只代表结构校验通过**，不代表文档内容与代码一致；工作单仍要求 agent 读取代码逐份核对。
- `documents` 是 Markdown 文档清单（固定文件在前、其余字典序），非 Markdown 资产不会列入；`projectEntries` 为项目根目录的顶层条目（跳过 `dsh_docs/`、`.git`、`node_modules`，目录带 `/`）。
- `workOrder` 是面向 agent 的更新步骤：读取代码、逐份核对、只修改 `dsh_docs/` 下的文档（不得为迁就文档改动代码）、按问题码修复结构、复查到 `ok`、报告改动。

### 典型流程

1. 用户要求“更新/校验 dsh_docs”。
2. agent 调用 `dsh_docs_update`。
3. 若状态为 `not_initialized`，先调用 `dsh_docs_init`，再按工作单补全文档。
4. agent 阅读 `projectEntries` 指向的代码与 `documents` 中每份文档，修正不准确、过时、不完整的内容；只改 `dsh_docs/`，不为迁就文档而改代码。
5. 再次调用 `dsh_docs_update`，直到 `status` 为 `ok`。
6. 向用户报告哪些文档被修改、哪些已准确。
