import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import { apply } from '../index.js';

/** A minimal in-process filesystem provider backed by the real local disk. */
function createFs() {
  return {
    async resolve(path, options = {}) {
      const base = options.cwd ?? process.cwd();
      const targetKey = join(base, path);
      return { targetKey, displayPath: targetKey };
    },
    processPath(target) {
      return target.targetKey;
    },
    async stat(target) {
      try {
        const info = await stat(target.targetKey);
        return {
          version: String(info.mtimeMs),
          type: info.isDirectory() ? 'directory' : info.isFile() ? 'file' : 'other',
          size: info.size,
        };
      } catch (error) {
        if (error !== null && typeof error === 'object' && error.code === 'ENOENT') return undefined;
        throw error;
      }
    },
    async readText(target, signal) {
      if (signal?.aborted) throw new Error('aborted');
      return readFile(target.targetKey, 'utf8');
    },
    async listDir(target, signal) {
      if (signal?.aborted) throw new Error('aborted');
      const entries = await readdir(target.targetKey, { withFileTypes: true });
      entries.sort((left, right) => (left.name < right.name ? -1 : left.name > right.name ? 1 : 0));
      const values = [];
      for (const entry of entries) {
        const targetKey = join(target.targetKey, entry.name);
        const info = await stat(targetKey);
        values.push({
          name: entry.name,
          type: entry.isDirectory() ? 'directory' : entry.isFile() ? 'file' : 'other',
          target: { targetKey, displayPath: targetKey },
          size: info.size,
        });
      }
      return values;
    },
    async writeText(target, content) {
      await mkdir(dirname(target.targetKey), { recursive: true });
      await writeFile(target.targetKey, content, 'utf8');
      return { operation: 'update', version: 'v1', before: null, after: content };
    },
  };
}

function setup(cwd) {
  const registered = new Map();
  const ctx = {
    fs: createFs(),
    workingDirectory: { async ensure() { return cwd; } },
    systemPrompt: { section() { return () => {}; } },
    tools: {
      register(definition) {
        registered.set(definition.name, definition);
        return () => {};
      },
    },
  };
  apply(ctx);
  return registered;
}

async function invoke(tool, args = {}) {
  return tool.execute(args, {
    agent: {},
    signal: new AbortController().signal,
    deferContext() {},
    concludeTurn() {},
  });
}

async function makeProject() {
  const directory = await mkdtemp(join(tmpdir(), 'deepseek-harness-docs-'));
  after(async () => {
    await rm(directory, { recursive: true, force: true });
  });
  return directory;
}

async function read(path) {
  return readFile(path, 'utf8');
}

test('dsh_docs_init creates the fixed DSHD.md and skeleton files once', async () => {
  const directory = await makeProject();
  const tools = setup(directory);
  const init = tools.get('dsh_docs_init');

  const first = await invoke(init);
  assert.equal(first.root, join(directory, 'dsh_docs'));
  assert.deepEqual([...first.created].sort(), [
    'dsh_docs/DSHD.md',
    'dsh_docs/INDEX.md',
    'dsh_docs/OVERVIEW.md',
  ]);
  assert.deepEqual(first.skipped, []);
  assert.match(await read(join(directory, 'dsh_docs/DSHD.md')), /插件版本：1\.1\.0/);

  const second = await invoke(init);
  assert.deepEqual([...second.skipped].sort(), ['dsh_docs/INDEX.md', 'dsh_docs/OVERVIEW.md']);
  assert.deepEqual(second.created, ['dsh_docs/DSHD.md']);
});

test('dsh_docs_update reports an uninitialized project', async () => {
  const directory = await makeProject();
  const update = setup(directory).get('dsh_docs_update');

  const result = await invoke(update);
  assert.equal(result.status, 'not_initialized');
  assert.deepEqual(result.documents, []);
  assert.equal(result.issues[0].code, 'MISSING_DSH_DOCS');
  assert.ok(result.workOrder.some((step) => step.includes('dsh_docs_init')));
});

test('dsh_docs_update reports structural and link problems', async () => {
  const directory = await makeProject();
  await mkdir(join(directory, 'dsh_docs/module'), { recursive: true });
  await writeFile(
    join(directory, 'dsh_docs/DSHD.md'),
    '# stale\n\n> 插件版本：0.9.0。\n',
    'utf8',
  );
  await writeFile(
    join(directory, 'dsh_docs/OVERVIEW.md'),
    '<!-- 项目背景、目标、功能；技术选型；开发环境、运行环境 -->\n',
    'utf8',
  );
  await writeFile(
    join(directory, 'dsh_docs/INDEX.md'),
    '<!-- 在此逐条列出：模块名 → 对应细分文档目录 -->\n',
    'utf8',
  );
  await writeFile(join(directory, 'dsh_docs/module/a.md'), '[missing](./missing.md)\n', 'utf8');

  const result = await invoke(setup(directory).get('dsh_docs_update'));
  const codes = new Set(result.issues.map((issue) => issue.code));
  assert.equal(result.status, 'update_required');
  assert.ok(codes.has('DSHD_VERSION_MISMATCH'));
  assert.ok(codes.has('OVERVIEW_PLACEHOLDER'));
  assert.ok(codes.has('OVERVIEW_MISSING_SECTIONS'));
  assert.ok(codes.has('INDEX_PLACEHOLDER'));
  assert.ok(codes.has('INDEX_MISSING_ENTRY'));
  assert.ok(codes.has('BROKEN_LINK'));
  assert.ok(result.documents.includes('dsh_docs/module/a.md'));
  assert.ok(result.workOrder.some((step) => step.includes('DSHD.md')));

  const brokenLink = result.issues.find((issue) => issue.code === 'BROKEN_LINK');
  assert.equal(brokenLink.path, 'dsh_docs/module/a.md');
});

test('dsh_docs_update reports a missing required file', async () => {
  const directory = await makeProject();
  const tools = setup(directory);
  await invoke(tools.get('dsh_docs_init'));
  await rm(join(directory, 'dsh_docs/OVERVIEW.md'));

  const result = await invoke(tools.get('dsh_docs_update'));
  assert.equal(result.status, 'update_required');
  assert.ok(result.issues.some((issue) => issue.code === 'MISSING_REQUIRED_FILE'));
});

test('dsh_docs_update distinguishes DSHD content drift from a version mismatch', async () => {
  const directory = await makeProject();
  const tools = setup(directory);
  await invoke(tools.get('dsh_docs_init'));
  const dshdPath = join(directory, 'dsh_docs/DSHD.md');
  const original = await read(dshdPath);
  await writeFile(dshdPath, `${original}\n\n额外内容。\n`, 'utf8');

  const result = await invoke(tools.get('dsh_docs_update'));
  const codes = new Set(result.issues.map((issue) => issue.code));
  assert.ok(codes.has('DSHD_CONTENT_DRIFT'));
  assert.ok(!codes.has('DSHD_VERSION_MISMATCH'));
});

test('dsh_docs_update caps the reported issue list', async () => {
  const directory = await makeProject();
  const tools = setup(directory);
  await invoke(tools.get('dsh_docs_init'));
  await mkdir(join(directory, 'dsh_docs/many'));
  const links = Array.from({ length: 205 }, (_, index) => `[missing ${index}](./missing-${index}.md)`);
  await writeFile(join(directory, 'dsh_docs/many/links.md'), links.join('\n'), 'utf8');

  const result = await invoke(tools.get('dsh_docs_update'));
  assert.equal(result.status, 'update_required');
  assert.ok(result.issues.length <= 201);
  assert.ok(result.issues.some((issue) => issue.code === 'ISSUE_LIMIT_REACHED'));
});

test('dsh_docs_update accepts a well-formed tree and honours directory', async () => {
  const directory = await makeProject();
  const tools = setup(directory);
  const init = tools.get('dsh_docs_init');
  const update = tools.get('dsh_docs_update');

  await invoke(init, { directory: 'project' });
  await writeFile(
    join(directory, 'project/dsh_docs/OVERVIEW.md'),
    [
      '# OVERVIEW',
      '',
      '## 1. 概述',
      '一个用于测试的项目。',
      '',
      '## 2. 项目结构',
      '- `module/tools.md`：工具说明。',
      '',
      '## 3. 开发规则',
      '使用 Node.js 内置测试运行器。',
      '',
      '## 4. 禁止行为',
      '不引入外部依赖。',
      '',
    ].join('\n'),
    'utf8',
  );
  await mkdir(join(directory, 'project/dsh_docs/module'), { recursive: true });
  await writeFile(
    join(directory, 'project/dsh_docs/INDEX.md'),
    '# INDEX\n\n| 模块 | 文档 |\n| --- | --- |\n| 工具 | [`module/tools.md`](./module/tools.md) |\n',
    'utf8',
  );
  await writeFile(
    join(directory, 'project/dsh_docs/module/tools.md'),
    [
      '# 工具',
      '',
      '[返回概述](../OVERVIEW.md)',
      '',
      '示例：`[text](missing.md)` 不是真实链接。',
      '',
      '<!-- [comment](missing-comment.md) -->',
      '',
      '```md',
      '[fenced](missing-fenced.md)',
      '```',
      '',
    ].join('\n'),
    'utf8',
  );

  const result = await invoke(update, { directory: 'project' });
  assert.equal(result.status, 'ok');
  assert.deepEqual(result.issues, []);
  assert.equal(result.projectRoot, join(directory, 'project'));
  assert.ok(result.documents.includes('project/dsh_docs/module/tools.md'));
  assert.ok(result.workOrder.some((step) => step.includes('code is the source of truth')));
});

test('the repository dsh_docs passes structural validation', async () => {
  const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
  const update = setup(repositoryRoot).get('dsh_docs_update');

  const result = await invoke(update);
  assert.equal(result.status, 'ok');
  assert.deepEqual(result.issues, []);
});
