# DeepSeek Harness Docs

一个 DeepSeek Harness（DSH）插件：在项目中创建并维护专属的 `dsh_docs` 文档目录，为 DSH 开发、维护项目提供背景知识与技术架构参考。

## 功能

1. **规范注入**：插件激活后，向 DSH 的系统提示词注入 `dsh_docs` 文档规范（目录结构、DSHD.md 固定模板、概述/索引/细分文档编写规则，以及“先读文档再读代码”的建议）。
2. **初始化工具 `dsh_docs_init`**：可被 DSH 调用，一键在项目中生成 `dsh_docs/` 骨架：
   - 始终写入固定的 `dsh_docs/DSHD.md`（记录插件版本）；
   - 仅在不存在时创建 `dsh_docs/OVERVIEW.md`、`dsh_docs/INDEX.md` 占位文件。

## dsh_docs 目录结构

```
dsh_docs/
├── DSHD.md        # 固定说明文档，记录插件版本
├── OVERVIEW.md    # 概述文档（概述 / 项目结构 / 开发规则 / 禁止行为）
├── INDEX.md       # 索引文档（模块 → 细分目录的查找索引）
└── <模块目录>/    # 按项目模块划分的细分文档
```

## 安装

本插件是一个 DSH bundle 包（`package.json` 声明了 `dsh.bundle.patch`）。在 DSH 中通过 Bundle 安装：

```
plugin_manager install_bundle <本仓库绝对路径或包名>
```

或在 DSH 的插件管理界面安装。

## 文件说明

| 文件 | 说明 |
| --- | --- |
| `package.json` | 包清单，声明 `dsh.bundle.patch`、`exports` 与图标 |
| `cordis.patch.yml` | Loader 补丁，插入插件行 |
| `index.js` | 插件实现：注入系统提示词规范 + 注册 `dsh_docs_init` 工具 |
| `locale/en.json` / `locale/zh.json` | 插件标题与描述（英文 / 中文） |
| `icon.svg` | 插件图标 |

## 版本

当前版本：`1.0.0`
