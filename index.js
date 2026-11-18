/**
 * DeepSeek Harness Docs
 *
 * 在项目中创建并维护专属的 dsh_docs 文档目录，向 DeepSeek Harness（DSH）
 * 注入该文档规范，并提供 dsh_docs_init 与 dsh_docs_update 两个工具：
 * - dsh_docs_init：一键生成文档骨架。
 * - dsh_docs_update：校验文档结构并生成更新工作单，由 DSH 以代码为准修正文档。
 */

import { dirname, join, normalize } from 'node:path';

const PLUGIN_VERSION = '1.1.0';

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
4. 完成任务后，若代码有改动，同步更新 dsh_docs 中受影响的文档，保证文档实时、准确。

## 四、手动校验与更新（dsh_docs_update）

当用户要求“更新/校验 dsh_docs”时，调用 **dsh_docs_update** 工具。工具会返回当前文档清单、结构问题与更新工作单；随后必须以代码为唯一事实来源，逐份核对文档，修改其中不准确、过时或不完整的内容（不能只修结构问题），只修改 dsh_docs 中的文档而不得为迁就文档改动代码，再次调用工具确认结构状态为 \`ok\`，并向用户报告哪些文档被修改、哪些已准确。该工具只做校验与工作单生成，不修改文件。`;

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

const DOCS_DIR_NAME = 'dsh_docs';
const FIXED_DOC_FILES = ['DSHD.md', 'OVERVIEW.md', 'INDEX.md'];
const REQUIRED_OVERVIEW_SECTIONS = ['概述', '项目结构', '开发规则', '禁止行为'];

/** Bounds keep one validation pass cheap even for an unexpectedly large dsh_docs tree. */
const MAX_DOC_ENTRIES = 400;
const MAX_DOC_DEPTH = 8;
const MAX_DOC_BYTES = 512 * 1024;
const MAX_PROJECT_ENTRIES = 80;
const MAX_ISSUES = 200;

const PROJECT_ENTRY_SKIP = new Set([DOCS_DIR_NAME, '.git', 'node_modules']);

const STATUS_TEXT = {
  ok: 'ok (structure only; content still needs code verification)',
  update_required: 'update_required',
  not_initialized: 'not_initialized',
};

export const inject = ['tools', 'fs', 'workingDirectory', 'systemPrompt'];

function renderInitResult(_args, value) {
  const lines = [`Initialized ${value.root}`];
  for (const file of value.created) lines.push(`created: ${file}`);
  for (const file of value.skipped) lines.push(`skipped (already exists): ${file}`);
  return [{ type: 'text', text: lines.join('\n') }];
}

/** Render paths with forward slashes in model-facing text, including on Windows. */
function displayPath(path) {
  return path.split('\\').join('/');
}

function compareText(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Blank out code blocks, inline code spans, and HTML comments so documentation
 * examples such as `[text](target)` are not mistaken for real links.
 */
function maskMarkdownCode(text) {
  const blank = (match) => match.replace(/[^\n]/g, ' ');
  return text
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/^([ \t]*)(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]*\2[ \t]*$/gm, blank)
    .replace(/`[^`\n]*`/g, blank);
}

/**
 * Extract the destination of every inline Markdown link. Image links count too.
 * Reference-style links are out of scope for this lightweight structural check.
 */
function extractMarkdownLinks(text) {
  const links = [];
  const pattern = /!?\[[^\]]*\]\(([^)]+)\)/g;
  const searchable = maskMarkdownCode(text);
  let match;
  while ((match = pattern.exec(searchable)) !== null) {
    let target = match[1].trim();
    if (target.startsWith('<')) {
      const close = target.indexOf('>');
      if (close > 0) target = target.slice(1, close);
    } else {
      const space = target.search(/\s/);
      if (space > 0) target = target.slice(0, space);
    }
    target = target.trim();
    if (target.length > 0) links.push(target);
  }
  return links;
}

/** Only project-relative link destinations are checked; URLs and anchors are ignored. */
function isCheckableLink(target) {
  if (target.startsWith('#') || target.startsWith('/') || target.startsWith('//')) return false;
  return !/^[a-z][a-z0-9+.-]*:/i.test(target);
}

/** Strip an anchor/query and percent-decoding from one link destination. */
function linkPath(target) {
  let path = target.split('#')[0].split('?')[0].trim();
  if (path.length === 0) return undefined;
  try {
    path = decodeURIComponent(path);
  } catch {
    // Keep the raw path when it contains malformed percent escapes.
  }
  if (path.startsWith('/')) return undefined;
  return path.length > 0 ? path : undefined;
}

/** Recursively collect the dsh_docs inventory, with bounded depth and entry counts. */
async function collectDocs(ctx, docsDirTarget, signal) {
  const files = [];
  const directories = [];
  let truncated = false;

  const walk = async (target, prefix, depth) => {
    if (truncated) return;
    if (depth > MAX_DOC_DEPTH) {
      truncated = true;
      return;
    }
    const entries = await ctx.fs.listDir(target, signal);
    for (const entry of entries) {
      if (files.length + directories.length >= MAX_DOC_ENTRIES) {
        truncated = true;
        return;
      }
      const rel = prefix.length === 0 ? entry.name : `${prefix}/${entry.name}`;
      if (entry.type === 'directory') {
        directories.push(rel);
        await walk(entry.target, rel, depth + 1);
      } else if (entry.type === 'file') {
        files.push({ rel, target: entry.target, size: entry.size });
      }
    }
  };

  await walk(docsDirTarget, '', 0);
  files.sort((a, b) => compareText(a.rel, b.rel));
  directories.sort(compareText);
  return { files, directories, truncated };
}

/** Top-level code entries give the agent a starting point for the code review. */
async function listProjectEntries(ctx, projectTarget, signal) {
  const entries = await ctx.fs.listDir(projectTarget, signal);
  const names = [];
  for (const entry of entries) {
    if (PROJECT_ENTRY_SKIP.has(entry.name)) continue;
    names.push(entry.type === 'directory' ? `${entry.name}/` : entry.name);
  }
  names.sort((a, b) => {
    const left = a.endsWith('/') ? a.slice(0, -1) : a;
    const right = b.endsWith('/') ? b.slice(0, -1) : b;
    return compareText(left, right);
  });
  return names.slice(0, MAX_PROJECT_ENTRIES);
}

function buildUpdateWorkOrder({ status, docsDirRel, projectRoot, issues, documentCount }) {
  const docsLabel = displayPath(docsDirRel);

  if (status === 'not_initialized') {
    return [
      `Create the dsh_docs tree by calling dsh_docs_init with directory "${projectRoot}".`,
      `Read the project code at ${projectRoot}, then write OVERVIEW.md, INDEX.md, and the module documents from it.`,
      'Only create or edit files under dsh_docs/; do not change the project code to match the documentation.',
      'Call dsh_docs_update again and resolve every reported structure issue.',
      'Report which documents you created and which parts of the code they describe.',
    ];
  }

  const codes = new Set(issues.map((issue) => issue.code));
  const steps = [
    `Read the project code at ${projectRoot}; code is the source of truth for every document.`,
    `Review the ${documentCount} document(s) under ${docsLabel}/ listed above and rewrite any statement that is inaccurate, outdated, or incomplete.`,
    `Only edit files under ${docsLabel}/; do not change the project code to match the documentation.`,
  ];

  if (codes.has('DSH_DOCS_NOT_DIRECTORY')) {
    steps.push(`Replace the non-directory ${docsLabel} path with a directory, then call dsh_docs_init to rebuild the tree.`);
  }
  if (codes.has('MISSING_REQUIRED_FILE')) {
    steps.push(`Create the missing required files under ${docsLabel}/; DSHD.md must be exactly the fixed template.`);
  }
  if (codes.has('DSHD_VERSION_MISMATCH') || codes.has('DSHD_CONTENT_DRIFT')) {
    steps.push(`Rewrite ${docsLabel}/DSHD.md from the fixed DSHD template for plugin version ${PLUGIN_VERSION}.`);
  }
  if (codes.has('OVERVIEW_PLACEHOLDER') || codes.has('OVERVIEW_MISSING_SECTIONS')) {
    steps.push(`Bring ${docsLabel}/OVERVIEW.md to the four-section form (概述 / 项目结构 / 开发规则 / 禁止行为) and replace template placeholders.`);
  }
  if (codes.has('INDEX_PLACEHOLDER') || codes.has('INDEX_MISSING_ENTRY')) {
    steps.push(`Update ${docsLabel}/INDEX.md so every module document directory or Markdown file is listed with a working relative link.`);
  }
  if (codes.has('BROKEN_LINK')) {
    steps.push('Repair or remove every broken relative link reported above.');
  }
  if (codes.has('ISSUE_LIMIT_REACHED')) {
    steps.push(`Only the first ${MAX_ISSUES} issues were reported; fix them and call dsh_docs_update again for the remainder.`);
  }
  if (codes.has('DOC_READ_FAILED') || codes.has('DOC_TOO_LARGE') || codes.has('INVENTORY_TRUNCATED')) {
    steps.push('Open the unreadable, oversized, or excess documents manually and keep the dsh_docs tree small enough to validate.');
  }

  steps.push('Keep DSHD.md equal to the fixed template, keep OVERVIEW.md to its four required sections, and keep every INDEX.md module link working.');
  steps.push('After editing, call dsh_docs_update again; the structural status must become "ok".');
  steps.push('Report which documents changed and which were already accurate.');
  return steps;
}

/**
 * Validate the dsh_docs tree and return a work order. This function is read-only:
 * every correction is left to the agent that called the tool.
 */
async function inspectDshDocs(ctx, options) {
  const { docsDirRel, docsDirTarget, docsDirInfo, projectRoot, resolveOptions, signal } = options;
  const issues = [];
  const docsLabel = displayPath(docsDirRel);
  let issueLimitReported = false;
  const addIssue = (severity, code, path, message) => {
    if (issues.length >= MAX_ISSUES) {
      if (!issueLimitReported) {
        issueLimitReported = true;
        issues.push({
          severity: 'warning',
          code: 'ISSUE_LIMIT_REACHED',
          path: docsLabel,
          message: `Stopped after ${MAX_ISSUES} issues; fix the reported ones and run dsh_docs_update again for the rest.`,
        });
      }
      return;
    }
    issues.push({ severity, code, path, message });
  };

  if (docsDirInfo === undefined) {
    addIssue(
      'error',
      'MISSING_DSH_DOCS',
      docsLabel,
      'dsh_docs does not exist; initialize it with dsh_docs_init before refreshing the documentation.',
    );
    return {
      status: 'not_initialized',
      documents: [],
      directories: [],
      issues,
      workOrder: buildUpdateWorkOrder({
        status: 'not_initialized',
        docsDirRel,
        projectRoot,
        issues,
        documentCount: 0,
      }),
    };
  }

  if (docsDirInfo.type !== 'directory') {
    addIssue(
      'error',
      'DSH_DOCS_NOT_DIRECTORY',
      docsLabel,
      'dsh_docs exists but is not a directory; the documentation tree cannot be inspected.',
    );
    return {
      status: 'update_required',
      documents: [],
      directories: [],
      issues,
      workOrder: buildUpdateWorkOrder({
        status: 'update_required',
        docsDirRel,
        projectRoot,
        issues,
        documentCount: 0,
      }),
    };
  }

  const { files, directories, truncated } = await collectDocs(ctx, docsDirTarget, signal);

  if (truncated) {
    addIssue(
      'warning',
      'INVENTORY_TRUNCATED',
      docsLabel,
      `Stopped after ${MAX_DOC_ENTRIES} entries or ${MAX_DOC_DEPTH} levels; some documents were not checked.`,
    );
  }

  const fileByRel = new Map(files.map((file) => [file.rel, file]));

  // Fixed files are mandatory unless the inventory itself was truncated.
  if (!truncated) {
    for (const name of FIXED_DOC_FILES) {
      if (!fileByRel.has(name)) {
        addIssue('error', 'MISSING_REQUIRED_FILE', `${docsLabel}/${name}`, `${name} is required by the fixed dsh_docs structure.`);
      }
    }
  }

  const texts = new Map();
  for (const file of files) {
    if (!/\.md$/i.test(file.rel)) continue;
    const fileLabel = `${docsLabel}/${file.rel}`;
    if (typeof file.size === 'number' && file.size > MAX_DOC_BYTES) {
      addIssue('warning', 'DOC_TOO_LARGE', fileLabel, `Larger than ${MAX_DOC_BYTES} bytes; content checks were skipped.`);
      continue;
    }
    try {
      texts.set(file.rel, await ctx.fs.readText(file.target, signal));
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      addIssue('warning', 'DOC_READ_FAILED', fileLabel, `Could not read the document: ${reason}`);
    }
  }

  // DSHD.md is fixed content; report version drift separately from content drift.
  const dshdText = texts.get('DSHD.md');
  if (dshdText !== undefined) {
    const expected = DSHD_TEMPLATE.replace(/\r\n/g, '\n').trim();
    const actual = dshdText.replace(/\r\n/g, '\n').trim();
    if (actual !== expected) {
      const versionMatch = /插件版本[：:]\s*([0-9][^\s。]*)/.exec(dshdText);
      const foundVersion = versionMatch === null ? undefined : versionMatch[1];
      if (foundVersion !== PLUGIN_VERSION) {
        addIssue(
          'error',
          'DSHD_VERSION_MISMATCH',
          `${docsLabel}/DSHD.md`,
          `Records plugin version ${foundVersion === undefined ? '(missing)' : foundVersion} but the current plugin version is ${PLUGIN_VERSION}.`,
        );
      } else {
        addIssue(
          'warning',
          'DSHD_CONTENT_DRIFT',
          `${docsLabel}/DSHD.md`,
          'Content differs from the fixed DSHD.md template; restore the template exactly.',
        );
      }
    }
  }

  // OVERVIEW.md must keep the four required sections and lose the skeleton comments.
  const overviewText = texts.get('OVERVIEW.md');
  if (overviewText !== undefined) {
    if (/<!--\s*(项目背景|项目目录结构|编程语言版本|不允许做的事)/.test(overviewText)) {
      addIssue(
        'warning',
        'OVERVIEW_PLACEHOLDER',
        `${docsLabel}/OVERVIEW.md`,
        'Template placeholder comments remain; fill the overview from the project code.',
      );
    }
    const headings = [...overviewText.matchAll(/^#{1,6}\s+(.+)$/gm)].map((match) => match[1]);
    const missing = REQUIRED_OVERVIEW_SECTIONS.filter(
      (section) => !headings.some((heading) => heading.includes(section)),
    );
    if (missing.length > 0) {
      addIssue(
        'warning',
        'OVERVIEW_MISSING_SECTIONS',
        `${docsLabel}/OVERVIEW.md`,
        `Missing or unlabeled required section(s): ${missing.join(', ')}.`,
      );
    }
  }

  // INDEX.md must be filled and must point at every module document directory.
  const indexText = texts.get('INDEX.md');
  if (indexText !== undefined) {
    if (/<!--\s*在此逐条列出/.test(indexText)) {
      addIssue(
        'warning',
        'INDEX_PLACEHOLDER',
        `${docsLabel}/INDEX.md`,
        'Template placeholder comment remains; list the project modules and their document directories.',
      );
    }

    const indexedTargets = new Set();
    for (const raw of extractMarkdownLinks(indexText)) {
      if (!isCheckableLink(raw)) continue;
      const path = linkPath(raw);
      if (path === undefined) continue;
      indexedTargets.add(displayPath(normalize(join(docsDirRel, path))));
    }

    const topLevelDirs = new Set();
    const topLevelMarkdownFiles = [];
    for (const file of files) {
      if (!/\.md$/i.test(file.rel)) continue;
      const slash = file.rel.indexOf('/');
      if (slash > 0) topLevelDirs.add(file.rel.slice(0, slash));
      else if (!FIXED_DOC_FILES.includes(file.rel)) topLevelMarkdownFiles.push(file.rel);
    }

    const entries = [
      ...[...topLevelDirs].sort(compareText).map((rel) => ({ rel, suffix: '/' })),
      ...topLevelMarkdownFiles.sort(compareText).map((rel) => ({ rel, suffix: '' })),
    ];

    for (const entry of entries) {
      const entryProjectPath = displayPath(normalize(join(docsDirRel, entry.rel)));
      const covered =
        [...indexedTargets].some(
          (target) => target === entryProjectPath || target.startsWith(`${entryProjectPath}/`),
        ) ||
        indexText.includes(entry.rel) ||
        indexText.includes(`${entry.rel}/`);
      if (!covered) {
        addIssue(
          'warning',
          'INDEX_MISSING_ENTRY',
          `${entryProjectPath}${entry.suffix}`,
          'Not referenced from INDEX.md; add a module index entry with a relative link.',
        );
      }
    }
  }

  // Every inline relative link in every Markdown document must resolve.
  for (const [rel, text] of texts) {
    const docLabel = `${docsLabel}/${rel}`;
    const docDirRel = dirname(join(docsDirRel, rel));
    const seen = new Set();
    for (const raw of extractMarkdownLinks(text)) {
      if (!isCheckableLink(raw)) continue;
      const path = linkPath(raw);
      if (path === undefined) continue;
      const targetRel = normalize(join(docDirRel, path));
      const targetLabel = displayPath(targetRel);
      if (seen.has(targetLabel)) continue;
      seen.add(targetLabel);

      let targetInfo;
      try {
        const target = await ctx.fs.resolve(targetRel, resolveOptions);
        targetInfo = await ctx.fs.stat(target, signal);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        addIssue('warning', 'LINK_CHECK_FAILED', docLabel, `Could not check link "${raw}": ${reason}`);
        continue;
      }
      if (targetInfo === undefined) {
        addIssue('error', 'BROKEN_LINK', docLabel, `Link "${raw}" resolves to ${targetLabel}, which does not exist.`);
      }
    }
  }

  const status = issues.length === 0 ? 'ok' : 'update_required';
  const orderedFiles = [...files].sort((left, right) => {
    const leftFixed = FIXED_DOC_FILES.indexOf(left.rel);
    const rightFixed = FIXED_DOC_FILES.indexOf(right.rel);
    if (leftFixed !== -1 || rightFixed !== -1) {
      if (leftFixed === -1) return 1;
      if (rightFixed === -1) return -1;
      return leftFixed - rightFixed;
    }
    return compareText(left.rel, right.rel);
  });

  const markdownFiles = orderedFiles.filter((file) => /\.md$/i.test(file.rel));

  return {
    status,
    documents: markdownFiles.map((file) => `${docsLabel}/${file.rel}`),
    directories: directories.map((directory) => `${docsLabel}/${directory}`),
    issues,
    workOrder: buildUpdateWorkOrder({
      status,
      docsDirRel,
      projectRoot,
      issues,
      documentCount: markdownFiles.length,
    }),
  };
}

function renderUpdateResult(_args, value) {
  const lines = [
    `dsh_docs: ${value.root}`,
    `project: ${value.projectRoot}`,
    `status: ${STATUS_TEXT[value.status] ?? value.status}`,
  ];

  if (value.documents.length === 0) {
    lines.push('documents: none');
  } else {
    lines.push(`documents (${value.documents.length}):`);
    for (const document of value.documents) lines.push(`- ${document}`);
  }

  if (value.directories.length > 0) {
    lines.push(`directories (${value.directories.length}): ${value.directories.join(', ')}`);
  }

  if (value.issues.length === 0) {
    lines.push('structural issues: none');
  } else {
    lines.push(`structural issues (${value.issues.length}):`);
    for (const issue of value.issues) {
      const location = issue.path === undefined ? '' : ` (${issue.path})`;
      lines.push(`- [${issue.severity}] ${issue.code}${location}: ${issue.message}`);
    }
  }

  if (value.projectEntries.length > 0) {
    lines.push(`project top-level: ${value.projectEntries.join(', ')}`);
  }

  lines.push('work order:');
  value.workOrder.forEach((step, index) => lines.push(`${index + 1}. ${step}`));
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
      const docsDirRel = join(base, DOCS_DIR_NAME);

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

  ctx.tools.register({
    name: 'dsh_docs_update',
    description:
      'Validate the project dsh_docs tree and return the documents to review plus an update work order. Call this when the user asks to update, verify, or refresh dsh_docs, or when code changes may have made the documentation stale. It checks required files, DSHD.md against the fixed template, OVERVIEW.md sections, INDEX.md coverage and links, and relative links. It does not edit files: use the returned document list and issues to verify each document against the current code and correct inaccurate or incomplete documents, not the code.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        directory: {
          type: 'string',
          description:
            'Optional project root directory that contains dsh_docs/. Relative paths resolve against the session working directory; omit to use the session working directory.',
        },
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          projectRoot: { type: 'string' },
          root: { type: 'string' },
          status: { type: 'string', enum: ['ok', 'update_required', 'not_initialized'] },
          documents: { type: 'array', items: { type: 'string' } },
          directories: { type: 'array', items: { type: 'string' } },
          projectEntries: { type: 'array', items: { type: 'string' } },
          issues: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                code: { type: 'string' },
                severity: { type: 'string', enum: ['error', 'warning'] },
                path: { type: 'string' },
                message: { type: 'string' },
              },
              required: ['code', 'severity', 'message'],
            },
          },
          workOrder: { type: 'array', items: { type: 'string' } },
        },
        required: [
          'projectRoot',
          'root',
          'status',
          'documents',
          'directories',
          'projectEntries',
          'issues',
          'workOrder',
        ],
      },
      render: renderUpdateResult,
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
      const docsDirRel = join(base, DOCS_DIR_NAME);

      const projectTarget = await ctx.fs.resolve(base, resolveOptions);
      const projectInfo = await ctx.fs.stat(projectTarget, exec.signal);
      if (projectInfo === undefined) {
        throw new Error(`Project directory does not exist: ${ctx.fs.processPath(projectTarget)}`);
      }
      if (projectInfo.type !== 'directory') {
        throw new Error(`Project path is not a directory: ${ctx.fs.processPath(projectTarget)}`);
      }

      const docsDirTarget = await ctx.fs.resolve(docsDirRel, resolveOptions);
      const docsDirInfo = await ctx.fs.stat(docsDirTarget, exec.signal);
      const projectRoot = ctx.fs.processPath(projectTarget);
      const projectEntries = await listProjectEntries(ctx, projectTarget, exec.signal);
      const inspection = await inspectDshDocs(ctx, {
        docsDirRel,
        docsDirTarget,
        docsDirInfo,
        projectRoot,
        resolveOptions,
        signal: exec.signal,
      });

      return {
        projectRoot,
        root: ctx.fs.processPath(docsDirTarget),
        status: inspection.status,
        documents: inspection.documents,
        directories: inspection.directories,
        projectEntries,
        issues: inspection.issues,
        workOrder: inspection.workOrder,
      };
    },
  });
}
