# OVERVIEW —— 项目概述

> 本文件是 dsh_docs 的概述文档，随代码改动保持同步。

## 1. 概述

DeepSeek Harness Docs 是一个 DeepSeek Harness（DSH）Host 插件。它在项目中建立并维护 `dsh_docs/` 文档目录，向 DSH 注入文档规范，并提供两个模型可调用的工具：

- **`dsh_docs_init`**：生成 `dsh_docs/` 骨架。始终写入固定的 `DSHD.md`（记录插件版本），仅在缺失时创建 `OVERVIEW.md`、`INDEX.md` 占位文件。
- **`dsh_docs_update`**：用户手动触发文档校验与更新。工具只读地检查固定文件、DSHD.md 版本与内容、OVERVIEW.md 四段结构、INDEX.md 模块覆盖与链接、各文档相对链接，返回文档清单、结构问题和更新工作单；随后由 agent 以代码为唯一事实来源修正文档。

**技术选型**：纯 Node.js ESM 单文件实现，无运行时第三方依赖、无构建步骤。插件通过 DSH/Cordis 的 `systemPrompt` 服务注入规范，通过 `tools` 服务注册工具；文件操作使用 `ctx.fs`，工作目录使用 `ctx.workingDirectory`，因此适配 Host 的文件系统抽象、沙箱与远程后端。插件以 DSH bundle 形式安装，`package.json` 中的 `dsh.bundle.patch` 指向 `cordis.patch.yml`。

**开发与运行环境**：运行于 DSH Host（当前 profile 为 bundle 安装）；Node.js 版本跟随 DSH 运行时（开发环境为 Node.js 24）。测试使用 Node.js 内置的 `node:test`，不依赖网络或真实 DSH profile。

## 2. 项目结构

```text
deepseek-harness-docs/
├── index.js                 # 插件唯一实现：规范注入 + 两个工具 + 校验逻辑
├── package.json             # 包清单：版本、exports、dsh.bundle.patch、test 脚本
├── cordis.patch.yml         # Loader 补丁：插入 deepseek-harness-docs 插件行
├── locale/
│   ├── en.json              # 英文标题与描述
│   └── zh.json              # 中文标题与描述
├── icon.svg                  # 插件图标
├── README.md                 # 面向使用者的功能、安装与测试说明
├── test/
│   └── tools.test.mjs        # 基于假 fs 的两个工具自动化测试
├── .gitignore                # 忽略 node_modules、日志等
└── dsh_docs/                 # 本项目的 DSH 文档
    ├── DSHD.md               # 固定说明文档（与具体项目无关）
    ├── OVERVIEW.md           # 本文件
    ├── INDEX.md              # 模块索引
    └── deepseek-harness-docs/
        ├── tools.md          # 工具契约与校验规则
        ├── implementation.md # 实现结构与关键逻辑
        └── verification.md   # 测试、验证方法与已知边界
```

## 3. 开发规则

- **语言与模块**：Node.js ESM（`"type": "module"`），使用 `import`/`export`；不引入构建器、打包器或运行时依赖。
- **版本管理**：遵循语义化版本。新增或修改工具行为时同时更新 `index.js` 的 `PLUGIN_VERSION`、`package.json` 的 `version` 与 `README.md` 的版本说明；`DSHD.md` 中的版本由模板插值自动生成。
- **工具定义**：工具名保持稳定；`parameters` 与 `output.schema` 必须落在 DSH 支持的 JSON Schema 子集内（标量 `type`、`enum`、对象属性、数组 `items` 等）。`output.render` 必须是只依赖入参与返回值的纯函数，输出简洁、有界。
- **文件访问**：插件运行时代码必须通过 `ctx.fs.resolve`/`stat`/`readText`/`listDir`/`writeText` 访问文件，并传递 `exec.signal`；路径用 `node:path` 拼接，模型可见路径统一用 `/` 展示。不得在运行时直接使用 `node:fs`。
- **只读约束**：`dsh_docs_update` 不得写文件；只有 `dsh_docs_init` 允许写 `DSHD.md`、`OVERVIEW.md`、`INDEX.md`。
- **测试**：新增或修改行为时补充 `test/tools.test.mjs` 用例，运行 `npm test`。测试用假 `fs` 在临时目录中驱动，不安装插件、不修改 profile；覆盖初始化、未初始化、结构问题、DSHD 内容漂移、缺失固定文件、问题数量上限、合法文档树与仓库 `dsh_docs` 自检。
- **文档同步**：代码改动后同步更新 `dsh_docs` 中受影响文档；可用 `dsh_docs_update` 自查结构，再人工核对内容。
- **代码风格**：2 空格缩进、单引号、尾逗号；用户文档使用中文，代码内辅助注释以英文为主。没有独立 lint 配置，以现有代码风格为准。

## 4. 禁止行为

- **禁止引入运行时依赖或构建步骤**：插件应保持纯 ESM、零依赖，不新增 `dependencies`、打包器或编译产物。
- **禁止让 `dsh_docs_update` 产生写操作**：它必须只做校验与工作单生成，不能修改、创建或删除任何文档。
- **禁止在未同步版本与文档的情况下修改固定模板**：`DSHD_TEMPLATE`/`METHODOLOGY` 变更必须与 `PLUGIN_VERSION`、`package.json`、`README.md` 及本目录文档一起更新。
- **禁止绕过 `ctx.fs`**：运行时代码不得直接调用 `node:fs`、`child_process` 或假设本地绝对路径；测试中的假 `fs` 可以使用 `node:fs`。
- **禁止用放宽校验的方式消除报错**：不得为了得到 `status: "ok"` 而删除必需检查或忽略 `error`/`warning`；应修正文档本身。
- **禁止在测试中改动真实 DSH profile**：不得调用 `plugin_manager`、写入 `$DSH_PROFILE_DIR` 或依赖已安装的插件副本。
- **禁止提交密钥、用户数据或 `.env` 等敏感文件**。
