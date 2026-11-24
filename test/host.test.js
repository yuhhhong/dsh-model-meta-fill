import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempDisposable, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

async function request(handler, value, options = {}) {
  const encoded = Buffer.from(JSON.stringify(value));
  const chunks = Array.from(encoded, value => Buffer.from([value]));
  const req = {
    method: options.method ?? 'POST',
    headers: options.headers ?? { 'x-dsh-model-meta': '1', 'content-type': 'application/json' },
    async *[Symbol.asyncIterator]() { yield* chunks; },
  };
  const res = { writeHead(status) { this.status = status; }, end(body) { this.body = JSON.parse(body); } };
  await handler(req, res);
  return res;
}

test('Host 入口在桌面插件加载时没有 DSH_INSTALL_DIR 也能导入', () => {
  const env = { ...process.env };
  delete env.DSH_INSTALL_DIR;
  const entry = new URL('../src/index.js', import.meta.url).href;
  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', `await import(${JSON.stringify(entry)})`], { env, encoding: 'utf8' });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
});

test('Host 使用 DSH JSON 存储初始化并在重新打开时读取缓存', {
  skip: !process.versions.electron || !process.env.DSH_INSTALL_DIR,
}, async t => {
  const load = createRequire(join(process.env.DSH_INSTALL_DIR, 'package.json'));
  const { DomainFacility } = await import(pathToFileURL(load.resolve('@deepseek-ai/dsh-storage-domain')));
  const { JsonStorageBackend } = await import(pathToFileURL(load.resolve('@deepseek-ai/dsh-storage-json')));
  const { apply, Config } = await import('../src/index.js');
  const root = await mkdtempDisposable(join(tmpdir(), 'dsh-model-meta-fill-'));
  const backend = new JsonStorageBackend(root.path);
  const storageDomain = new DomainFacility({ storage: { backend: { get: () => backend } }, emit() {} }, { backend: 'json' });
  const disposers = [];
  t.after(async () => {
    await storageDomain.closeAll();
    await backend.close();
    await root.remove();
  });

  const models = { 'openai/gpt-test': { name: 'GPT Test' } };
  const api = { openai: { models: { 'gpt-test': { canonical_model_id: 'openai/gpt-test' } } } };
  let fetchCount = 0;
  t.mock.method(globalThis, 'fetch', async url => {
    fetchCount += 1;
    return Response.json(url.endsWith('/models.json') ? models : api);
  });
  let handler;
  const ctx = {
    storageDomain,
    fiber: {},
    effect(register) { disposers.push(register()); },
    settings: { describe: () => [] },
    configEditor: { entries: () => [] },
    webServer: { register(route) { handler = route.handler; return () => {}; } },
    connection: { requestRejection() {} },
    logger: { warn: t.mock.fn() },
  };

  await apply(ctx, Config({}));
  const refresh = await request(handler, { action: 'refresh' });
  assert.equal(refresh.status, 200);
  const { cache } = refresh.body.value;
  assert.equal(cache.ready, true);
  assert.equal(fetchCount, 2);
  const stored = JSON.parse(await readFile(join(root.path, 'model_meta_fill.json'), 'utf8'));
  assert.equal(stored.global.cache.version, cache.version);

  while (disposers.length) {
    await disposers.pop()();
  }
  await apply(ctx, Config({}));
  const status = await request(handler, { action: 'status' });
  assert.equal(status.status, 200);
  assert.deepEqual(status.body.value.cache, cache);
  assert.equal(fetchCount, 2);
  while (disposers.length) {
    await disposers.pop()();
  }
});

test('Host 注册、鉴权、中文流分片和继承关系并发校验', async () => {
  const { apply, Config } = await import('../src/index.js');
  assert.equal(typeof Config({}).relations.get, 'function');
  let relations = { bodies: { '["本地","模型"]': 'openai/gpt-test' }, sources: {} };
  let handler;
  let rejected = false;
  let saved;
  const disposers = [];
  const entry = { options: { name: 'dsh-model-meta-fill', config: {} } };
  const models = { 'openai/gpt-test': { name: 'GPT Test', limit: { context: 100000 }, modalities: { input: ['text'] } } };
  const api = { openai: { models: { 'gpt-test': { canonical_model_id: 'openai/gpt-test', reasoning: false } } } };
  const ctx = {
    fiber: { entry },
    effect(fn) { disposers.push(fn()); },
    settings: {
      describe: () => [{ ns: 'include:llm-pi-ai', revision: 7, value: { providers: { '本地': { models: [{ id: '模型' }] } } } }],
      mutate: async () => {},
    },
    configEditor: {
      entries: () => [],
      async edit(target, callback) {
        assert.equal(target, entry);
        // raw 层没有 relations；有效关系来自 inherited 层。
        saved = callback({}, { relations });
        relations = saved.relations;
      },
    },
    storageDomain: { async open(spec) {
      assert.equal(spec.name, 'model_meta_fill');
      return { global: { get: () => ({ cache: { models, api, updatedAt: new Date().toISOString(), version: 'v1' } }), set: async () => {} }, close: async () => {} };
    } },
    webServer: { register(route) { handler = route.handler; return () => {}; } },
    connection: { requestRejection(request) { assert.ok(request.headers); return rejected ? 403 : undefined; } },
    logger: { warn() {} },
  };
  await apply(ctx, { relations: { get: () => structuredClone(relations) } });

  let result = await request(handler, { action: 'catalog', query: '模型' });
  assert.equal(result.status, 200);
  assert.equal(result.body.ok, true);
  const relationsResult = await request(handler, { action: 'relations' });
  assert.equal(relationsResult.status, 200);
  const { relationsRevision } = relationsResult.body.value;
  result = await request(handler, { action: 'saveRelation', kind: 'body', key: '["本地","模型"]', target: 'openai/gpt-test', expectedRevision: relationsRevision });
  assert.equal(result.status, 200);
  assert.deepEqual(saved.relations.bodies, relations.bodies);
  result = await request(handler, { action: 'customTemplate', provider: '本地', id: '模型' });
  assert.deepEqual(result.body.value.parameters, { contextWindow: 100000, input: ['text'], reasoningEfforts: false });
  const custom = { contextWindow: 100000, maxTokens: 8192, input: ['text'], reasoningEfforts: { high: 'high', off: null } };
  const { relationsRevision: currentRevision } = (await request(handler, { action: 'relations' })).body.value;
  result = await request(handler, { action: 'saveRelation', kind: 'custom', key: '模型', target: custom, expectedRevision: currentRevision });
  assert.equal(result.status, 200);
  const reloaded = Config({ relations: saved.relations }).relations.get();
  assert.deepEqual(reloaded.custom['模型'], custom);
  assert.deepEqual(reloaded.bodies, relations.bodies);
  result = await request(handler, { action: 'saveRelation', kind: 'custom', key: '模型', target: null, expectedRevision: currentRevision });
  assert.equal(result.body.error.code, 'STALE_RELATIONS');
  rejected = true;
  result = await request(handler, { action: 'status' });
  assert.equal(result.status, 403);
  assert.equal(result.body.error.code, 'ACCESS_DENIED');
  rejected = false;
  result = await request(handler, { action: 'status' }, { headers: { 'content-type': 'application/json' } });
  assert.equal(result.status, 400);
  for (const dispose of disposers.reverse()) {
    if (dispose) {
      await dispose();
    }
  }
});
