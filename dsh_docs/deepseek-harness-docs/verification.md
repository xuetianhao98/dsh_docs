# 验证与测试

本文记录本插件的自动化测试、手工验证方法与已知限制。

## 1. 自动化测试

```bash
npm test
# 等价于
node --test
```

测试文件：[`test/tools.test.mjs`](../../test/tools.test.mjs)。它不安装 bundle、不访问网络、不修改真实 DSH profile。

### 测试方式

- 用 `node:test` + `node:assert/strict`。
- 用 `node:fs/promises` 在 `os.tmpdir()` 下建临时项目，实现一个最小 `fs` 假实现（`resolve` / `stat` / `readText` / `listDir` / `writeText`），再调用 `apply(ctx)` 捕获注册的 `ToolDefinition`。
- 以 `{ agent: {}, signal, deferContext(){}, concludeTurn(){} }` 作为 `exec` 调用 `execute`，断言返回的规范化 JSON 值。
- 每个用例结束删除临时目录。

### 覆盖场景

| 用例 | 断言重点 |
| --- | --- |
| 初始化 | 首次创建三个固定文件；DSHD.md 含当前版本 `1.1.0`；第二次只重写 DSHD.md，跳过两个占位文件 |
| 未初始化 | `status: "not_initialized"`、`MISSING_DSH_DOCS`、工作单提示调用 `dsh_docs_init` |
| 结构问题 | DSHD 版本不一致、OVERVIEW 占位与缺段、INDEX 占位与缺模块条目、相对链接失效、`documents` 包含模块文档 |
| DSHD 内容漂移 | 版本号正确但模板内容被改动时返回 `DSHD_CONTENT_DRIFT`，不误报版本不一致 |
| 缺失固定文件 | 删除 OVERVIEW.md 后返回 `MISSING_REQUIRED_FILE` |
| 问题数量上限 | 205 个失效链接时问题列表被截断，并出现 `ISSUE_LIMIT_REACHED` |
| 合法文档树 + `directory` 参数 | 子目录项目返回 `status: "ok"`、无 issues、绝对 `projectRoot`、文档路径带 `project/` 前缀；行内代码、HTML 注释与围栏代码块中的链接示例不被误判 |
| 本仓库自检 | 仓库自身的 `dsh_docs/` 通过结构校验，`status: "ok"`、无 issues |

## 2. 手工验证

### 2.1 语法与导入

```bash
node --check index.js
node -e "import('./index.js').then(m => console.log(Object.keys(m)))"
```

预期导出 `apply`、`inject`。

### 2.2 在 DSH 中验证

安装或更新 bundle 后，在目标项目会话中让 agent 执行：

```text
校验并更新本项目的 dsh_docs
```

预期过程：

1. agent 调用 `dsh_docs_update`，得到文档清单、结构问题与工作单；
2. 未初始化时先调用 `dsh_docs_init`；
3. agent 阅读代码并修正文档；
4. 再次调用 `dsh_docs_update`，直到 `status` 为 `ok`。

### 2.3 校验本仓库自身的 dsh_docs

本仓库已包含 `dsh_docs/`。在仓库根目录运行 `dsh_docs_update`（或让 agent 调用），预期：

- `status: "ok"`；
- `documents` 包含 `dsh_docs/DSHD.md`、`dsh_docs/OVERVIEW.md`、`dsh_docs/INDEX.md` 以及 `dsh_docs/deepseek-harness-docs/` 下的三份文档；
- `issues` 为空。

## 3. 已知限制

- **只校验结构，不判断内容真伪**：`dsh_docs_update` 无法理解“文档描述是否仍与代码一致”。`status: "ok"` 只表示固定文件、结构、索引与链接通过；内容必须由 agent 对照代码逐份核实。
- **只检查内联链接**：`[text](target)` 与 `![alt](target)`；引用式链接 `[text][ref]`、自动链接 `<https://...>` 不检查。围栏代码块、行内代码与 HTML 注释会先被屏蔽，因此其中的链接示例不会被当作真实链接。
- **跳过部分目标**：`#anchor`、`/absolute`、`//protocol-relative`、带协议前缀（`http:`、`mailto:` 等）的目标不检查；`?query` 与 `#fragment` 会被剥离后检查路径部分。
- **未检查非 Markdown 文件内容**：资产文件不会进入 `documents` 清单，也不会被读取或校验；目录枚举只用于结构判断。
- **索引覆盖是启发式**：顶层目录/文件只要被索引链接指向，或在 INDEX 文本中按相对路径出现，就算已覆盖；可能漏报“提到了但链接错误”之外的情况。
- **规模边界**：最多 400 个条目、8 层目录、单文档 512 KiB、单次最多列出 200 条问题；超出时给出 `INVENTORY_TRUNCATED` / `DOC_TOO_LARGE` / `ISSUE_LIMIT_REACHED`，不保证完整覆盖。
- **链接检查受文件系统能力限制**：沙箱、远程后端或权限限制导致 `stat` 失败时，只报 `LINK_CHECK_FAILED` warning，不能确定链接是否真的失效。
- **`other` 类型条目被忽略**：符号链接等非 `file`/`directory` 条目不会进入 `documents`/`directories`，也不会被检查。
- **没有“新鲜度”判断**：不比较文档与代码的 mtime/commit，不会自动判断“代码改过但文档未更新”。
- **路径展示与 `directory` 有关**：传相对目录时输出相对路径（如 `project/dsh_docs/...`），传绝对目录时输出绝对路径；`dsh_docs_init` 的 `created`/`skipped` 则固定使用 `dsh_docs/` 前缀。

## 4. 当前验证结果

- `npm test`：8 个用例全部通过。
- `node --check index.js`：通过。
- 本仓库 `dsh_docs/`：已通过 `dsh_docs_update` 的结构校验。
- 未在自动化测试中安装或修改真实 DSH profile；bundle 的实际安装需通过 `plugin_manager install_bundle` 单独完成。
