/**
 * DeepSeek Harness Docs
 *
 * 在项目中创建并维护专属的 dsh_docs 文档目录，向 DeepSeek Harness（DSH）
 * 注入该文档规范，并提供 dsh_docs_init 工具一键生成文档骨架。
 */

import { join } from 'node:path';

const PLUGIN_VERSION = '1.0.0';

const DSHD_TEMPLATE = `# DSHD — DeepSeek Harness Docs

> 本文件由 DeepSeek Harness Docs 插件创建并维护，插件版本：${PLUGIN_VERSION}。
> 本文件与具体项目无关：任何使用该插件创建和维护 DSH 文档的项目都会包含一份相同的 DSHD.md。

## 什么是 dsh_docs

**dsh_docs/** 是当前项目专属的、供 DeepSeek Harness（DSH）参考的文档目录。它汇总了该项目的背景知识、技术架构、开发规则与禁止行为，帮助 DSH 在开发、维护该项目时快速建立上下文，减少对代码的盲目阅读与误判。

目录结构固定为：

- **DSHD.md** —— 本文件，说明 dsh_docs 的使用方法并记录插件版本。
- **OVERVIEW.md**（概述文档）—— 项目的总体介绍。
- **INDEX.md**（索引文档）—— 各模块到细分目录的查找索引。
- 若干细分文档目录 —— 按项目模块划分的详细文档。

## 如何使用本目录

### 一、新建 DSH 文档

当项目尚未建立 dsh_docs，或需要从零重建时，按以下流程执行：

1. 正常浏览、阅读项目已有的代码与文档（README、配置、目录结构等）。
2. 依据“概述文档”“索引文档”“细分文档”的编写规则，在 **dsh_docs/** 下创建 **DSHD.md**、**OVERVIEW.md**、**INDEX.md** 以及对应的细分文档目录与文档。

### 二、参考已有的 DSH 文档

当项目已经存在 dsh_docs 时，按以下顺序使用：

1. 先阅读 **OVERVIEW.md**（概述文档），建立对项目的整体认识。
2. 再阅读 **INDEX.md**（索引文档），定位到需要了解的模块对应的细分目录。
3. 按需读取各个细分目录下的文档。
4. 最后再阅读代码，与文档内容交叉验证后执行任务。

### 三、持续维护

在项目进展过程中，每当代码发生改动，都应同步修改 dsh_docs 中对应的文档内容，确保文档的实时性与准确性。文档与代码不一致时，以代码为准并及时修正文档。

## 给 DSH 的建议

DSH 在收到任务后，应先从 dsh_docs 文档着手（概述 → 索引 → 细分文档），而不是直接阅读代码。这能显著减少理解成本与出错概率。

## 概述文档（OVERVIEW.md）编写规则

概述文档包含以下四部分：

1. **概述**：大致介绍项目情况，包括项目背景、目标、功能，技术选型，以及开发环境、运行环境等。
2. **项目结构**：介绍项目的目录结构，描述每一个子目录及重要单个文件所覆盖的功能；无需逐一列举每个文件。
3. **开发规则**：描述代码开发规则，如编程语言版本、代码风格，以及测试方法、编译或发布方法（如有）。
4. **禁止行为**：基于项目需要列明不允许做的事，例如不能引入的依赖、不允许使用的工具等。

## 索引文档（INDEX.md）编写规则

索引文档让 DSH 知道 dsh_docs 下各个细分目录分别包含什么内容——即想知道哪个模块的内容，应去哪个对应的细分目录查找。

## 细分文档编写规则

- 细分目录原则上按项目目录结构划分，再根据每个目录下的代码内容进一步划分为各个文档。
- 项目存在多级目录时，允许建立对等的多级文档目录。
- 划分文档的核心要素是项目的模块与代码逻辑，而非死板地建立代码文件到文档文件的一一映射。`;

const METHODOLOGY = `# DeepSeek Harness Docs —— 项目文档规范

你已启用 "DeepSeek Harness Docs" 插件（版本 ${PLUGIN_VERSION}）。在为本项目开发、维护代码时，你必须遵循下面的文档规范：在项目根目录创建并维护一个名为 **dsh_docs** 的文档目录，并在项目进展中持续保持其与代码一致。

## 一、dsh_docs 目录的固定结构

dsh_docs 目录内固定包含：

- **DSHD.md** —— 与具体项目无关的使用说明文档（内容固定，见下文模板）。
- **OVERVIEW.md** —— 概述文档。
- **INDEX.md** —— 索引文档。
- 若干细分文档目录 —— 按项目模块划分的详细文档。

## 二、DSHD.md 的固定内容（创建 dsh_docs 时原样写入）

${DSHD_TEMPLATE}

## 三、执行要点

1. 处理任何涉及本项目开发、维护、理解的任务前，先检查 **dsh_docs** 是否存在。
2. 若不存在，可按上文 DSHD.md 模板新建完整目录，或调用 **dsh_docs_init** 工具生成骨架。
3. 若已存在，按“概述 → 索引 → 细分文档 → 代码交叉验证”的顺序使用。
4. 完成任务后，若代码有改动，同步更新 dsh_docs 中受影响的文档，保证文档实时、准确。`;

const OVERVIEW_SKELETON = `# OVERVIEW —— 项目概述

> 本文件是 dsh_docs 的概述文档，包含以下四部分。填写后随代码改动保持同步。

## 1. 概述

<!-- 项目背景、目标、功能；技术选型；开发环境、运行环境 -->

## 2. 项目结构

<!-- 项目目录结构：每个子目录及重要单个文件所覆盖的功能，无需逐一列举 -->

## 3. 开发规则

<!-- 编程语言版本、代码风格；测试方法；编译或发布方法（如有） -->

## 4. 禁止行为

<!-- 不允许做的事：不能引入的依赖、不允许使用的工具等 -->`;

const INDEX_SKELETON = `# INDEX —— 文档索引

> 本文件是 dsh_docs 的索引文档：维护“模块 → 细分文档目录”的查找表，让 DSH 快速定位文档。

<!-- 在此逐条列出：模块名 → 对应细分文档目录（相对 dsh_docs/ 的路径） -->`;

export const inject = ['tools', 'fs', 'workingDirectory', 'systemPrompt'];

function renderInitResult(_args, value) {
  const lines = [`Initialized ${value.root}`];
  for (const file of value.created) lines.push(`created: ${file}`);
  for (const file of value.skipped) lines.push(`skipped (already exists): ${file}`);
  return [{ type: 'text', text: lines.join('\n') }];
}

export function apply(ctx) {
  ctx.systemPrompt.section({
    name: 'deepseek-harness-docs',
    order: 550,
    text: METHODOLOGY,
  });

  ctx.tools.register({
    name: 'dsh_docs_init',
    description:
      'Initialize the dsh_docs documentation directory in a project: always writes the fixed DSHD.md (recording the plugin version) and creates OVERVIEW.md and INDEX.md skeletons only when they do not already exist.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        directory: {
          type: 'string',
          description:
            'Optional project root directory to create dsh_docs under. Relative paths resolve against the session working directory; omit to use the session working directory.',
        },
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          root: { type: 'string' },
          created: { type: 'array', items: { type: 'string' } },
          skipped: { type: 'array', items: { type: 'string' } },
        },
        required: ['root', 'created', 'skipped'],
      },
      render: renderInitResult,
    },
    async execute(args, exec) {
      const input = args && typeof args === 'object' ? args : {};
      const requested =
        typeof input.directory === 'string' && input.directory.length > 0
          ? input.directory
          : undefined;
      const cwd =
        exec.agent === undefined
          ? undefined
          : await ctx.workingDirectory.ensure(exec.agent, exec.signal);
      const resolveOptions = {
        ...(cwd !== undefined ? { cwd } : {}),
        signal: exec.signal,
      };
      const base = requested === undefined ? '.' : requested;
      const docsDirRel = join(base, 'dsh_docs');

      const created = [];
      const skipped = [];

      const writeFile = async (rel, content, createOnly) => {
        const target = await ctx.fs.resolve(join(docsDirRel, rel), resolveOptions);
        if (createOnly) {
          const info = await ctx.fs.stat(target, exec.signal);
          if (info !== undefined) {
            skipped.push(`dsh_docs/${rel}`);
            return;
          }
        }
        await ctx.fs.writeText(
          target,
          content,
          createOnly ? { kind: 'createIfAbsent' } : undefined,
          exec.signal,
        );
        created.push(`dsh_docs/${rel}`);
      };

      await writeFile('DSHD.md', DSHD_TEMPLATE, false);
      await writeFile('OVERVIEW.md', OVERVIEW_SKELETON, true);
      await writeFile('INDEX.md', INDEX_SKELETON, true);

      const docsDirTarget = await ctx.fs.resolve(docsDirRel, resolveOptions);
      return {
        root: ctx.fs.processPath(docsDirTarget),
        created,
        skipped,
      };
    },
  });
}
