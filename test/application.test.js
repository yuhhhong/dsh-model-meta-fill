import test from 'node:test';
import assert from 'node:assert/strict';
import { createApplication } from '../src/application.js';

const models = {
  'openai/gpt-test': { id: 'openai/gpt-test', name: 'GPT Test', limit: { context: 100000, output: 128000 }, modalities: { input: ['text', 'image'] }, reasoning: true },
};
const api = { openai: { name: 'OpenAI', models: { 'gpt-test': { id: 'gpt-test', canonical_model_id: 'openai/gpt-test', reasoning: true, reasoning_options: [{ type: 'effort', values: ['low', 'high'] }], limit: { context: 80000 }, modalities: { input: ['text'] } } } } };

function fixture(overrides = {}) {
  let relations = { bodies: {}, sources: {} };
  let description = { ns: 'llm-pi-ai', revision: 1, value: { providers: { relay: { displayName: '测试中转', api: 'openai-responses', apiKeyEnv: 'SECRET_REF', headers: { Authorization: 'PRIVATE' }, models: [{ id: 'gpt-test', privateField: 'KEEP' }] } } } };
  const writes = [];
  const cacheWrites = [];
  const app = createApplication({
    cache: { models, api, version: 'v1', updatedAt: new Date().toISOString() },
    readRelations: () => structuredClone(relations),
    saveRelations: async value => { relations = value; },
    describeModels: () => structuredClone(description),
    mutateModels: async (ns, operations, revision) => { writes.push({ ns, operations, revision }); description.revision += 1; },
    conflicts: () => [],
    fetchJson: async url => url.endsWith('/models.json') ? models : api,
    writeCache: async value => { cacheWrites.push(value); },
    ...overrides,
  });
  return { app, writes, cacheWrites, setRelations: value => { relations = value; }, setRevision: value => { description.revision = value; } };
}

test('状态和关系不泄露凭据或供应商完整配置', async () => {
  const { app } = fixture();
  const status = await app.execute({ action: 'status' });
  assert.deepEqual(status.providers, [{ id: 'relay', name: '测试中转', count: 1, hasCustom: false }]);
  const all = JSON.stringify([status, await app.execute({ action: 'relations' }), await app.execute({ action: 'preview', provider: 'relay', mode: 'missing' })]);
  assert.ok(!all.includes('SECRET_REF'));
  assert.ok(!all.includes('PRIVATE'));
  assert.ok(!all.includes('privateField'));
});

test('保存关系独立持久化，不写模型配置且保留另一类映射', async () => {
  const { app, writes } = fixture();
  let revision = (await app.execute({ action: 'relations' })).relationsRevision;
  await app.execute({ action: 'saveRelation', kind: 'body', key: '["relay","gpt-test"]', target: 'openai/gpt-test', expectedRevision: revision });
  revision = (await app.execute({ action: 'relations' })).relationsRevision;
  await app.execute({ action: 'saveRelation', kind: 'source', key: 'openai/gpt-test', target: { provider: 'openai', modelId: 'gpt-test' }, expectedRevision: revision });
  const value = await app.execute({ action: 'relations' });
  assert.equal(value.relations.bodies['["relay","gpt-test"]'], 'openai/gpt-test');
  assert.deepEqual(value.relations.sources['openai/gpt-test'], { provider: 'openai', modelId: 'gpt-test' });
  assert.equal(writes.length, 0);
  await assert.rejects(app.execute({ action: 'saveRelation', kind: 'source', key: 'openai/gpt-test', target: null, expectedRevision: revision }), { code: 'STALE_RELATIONS' });
});

test('确认后只写四个目标字段并使用逐字段设置操作，token 只能提交一次', async () => {
  const { app, writes } = fixture();
  const plan = await app.execute({ action: 'preview', provider: 'relay', mode: 'missing' });
  assert.equal(plan.fieldCount, 4);
  assert.deepEqual(plan.rows[0].changes.find(value => value.field === 'maxTokens'), { field: 'maxTokens', before: null, after: 128000, origin: 'models.json:openai/gpt-test' });
  assert.equal(writes.length, 0);
  assert.deepEqual(await app.execute({ action: 'apply', token: plan.token }), { models: 1, fields: 4 });
  assert.deepEqual(writes[0].operations.map(value => value.path), [
    ['providers', 'relay', 'models', '0', 'contextWindow'],
    ['providers', 'relay', 'models', '0', 'maxTokens'],
    ['providers', 'relay', 'models', '0', 'input'],
    ['providers', 'relay', 'models', '0', 'reasoningEfforts'],
  ]);
  assert.equal(writes[0].operations.find(value => value.path.at(-1) === 'maxTokens').value, 128000);
  await assert.rejects(app.execute({ action: 'apply', token: plan.token }), { code: 'STALE_PREVIEW' });
});

test('应用层预览保留本地显式输出上限，覆盖模式显示原值', async () => {
  const describeModels = () => ({ ns: 'llm-pi-ai', revision: 1, value: { providers: { relay: { models: [{ id: 'gpt-test', maxTokens: 64000 }] } } } });
  const { app } = fixture({ describeModels });
  const missing = await app.execute({ action: 'preview', provider: 'relay', mode: 'missing' });
  assert.ok(!missing.rows[0].changes.some(value => value.field === 'maxTokens'));
  const overwrite = await app.execute({ action: 'preview', provider: 'relay', mode: 'overwrite' });
  assert.deepEqual(overwrite.rows[0].changes.find(value => value.field === 'maxTokens'), { field: 'maxTokens', before: 64000, after: 128000, origin: 'models.json:openai/gpt-test' });
});

test('并发设置变化拒绝旧预览，人工关系变化也拒绝', async () => {
  const { app, setRevision, setRelations, writes } = fixture();
  const plan = await app.execute({ action: 'preview', provider: 'relay', mode: 'overwrite' });
  setRevision(2);
  await assert.rejects(app.execute({ action: 'apply', token: plan.token }), { code: 'STALE_PREVIEW' });
  const next = await app.execute({ action: 'preview', provider: 'relay', mode: 'overwrite' });
  setRelations({ bodies: {}, sources: { 'openai/gpt-test': { provider: 'openai', modelId: 'gpt-test' } } });
  await assert.rejects(app.execute({ action: 'apply', token: next.token }), { code: 'STALE_PREVIEW' });
  assert.equal(writes.length, 0);
});

test('后台刷新不改变既有预览的目标值', async () => {
  const { app, writes, cacheWrites } = fixture({ fetchJson: async url => url.endsWith('/models.json') ? { ...models, 'openai/gpt-test': { ...models['openai/gpt-test'], limit: { context: 200000 } } } : api });
  const plan = await app.execute({ action: 'preview', provider: 'relay', mode: 'missing' });
  await app.execute({ action: 'refresh' });
  assert.equal(cacheWrites.length, 1);
  await app.execute({ action: 'apply', token: plan.token });
  assert.equal(writes[0].operations.find(value => value.path.at(-1) === 'contextWindow').value, 100000);
});

test('任一目录刷新失败保留完整旧缓存并显式记录错误', async () => {
  const { app, cacheWrites } = fixture({ fetchJson: async url => { if (url.endsWith('/api.json')) { throw new Error('HTTP 403'); } return models; } });
  await assert.rejects(app.execute({ action: 'refresh' }), /HTTP 403/);
  const status = await app.execute({ action: 'status' });
  assert.equal(status.cache.ready, true);
  assert.equal(status.cache.version, 'v1');
  assert.equal(status.cache.error, 'HTTP 403');
  assert.equal(cacheWrites.length, 0);
  assert.equal((await app.execute({ action: 'preview', provider: 'relay', mode: 'missing' })).fieldCount, 4);
});

test('规范化工具传入的本体关系身份键，避免保存后无法匹配', async () => {
  const { app } = fixture();
  const { relationsRevision } = await app.execute({ action: 'relations' });
  await app.execute({ action: 'saveRelation', kind: 'body', key: '[ "relay", "gpt-test" ]', target: 'openai/gpt-test', expectedRevision: relationsRevision });
  const result = await app.execute({ action: 'relations' });
  assert.equal(result.relations.bodies['["relay","gpt-test"]'], 'openai/gpt-test');
  assert.equal(result.relations.bodies['[ "relay", "gpt-test" ]'], undefined);
  assert.equal(result.locals[0].canonicalId, 'openai/gpt-test');
});

test('无缓存仍可移除已有失效关系', async () => {
  let relation = { bodies: { '["removed","model"]': 'gone/model' }, sources: {} };
  const app = createApplication({
    cache: null,
    readRelations: () => relation,
    saveRelations: async value => { relation = structuredClone(value); },
    describeModels: () => ({ ns: 'llm-pi-ai', revision: 1, value: { providers: {} } }),
    conflicts: () => [],
  });
  const { relationsRevision } = await app.execute({ action: 'relations' });
  await app.execute({ action: 'saveRelation', kind: 'body', key: '["removed","model"]', target: null, expectedRevision: relationsRevision });
  assert.deepEqual(relation.bodies, {});
});

test('Gemini 在预览阶段跳过不能表达的等级，合法关闭保持预览提交一致', async () => {
  const describeModels = () => ({ ns: 'llm-pi-ai', revision: 1, value: { providers: { relay: { api: 'google-generative-ai', models: [{ id: 'gpt-test', contextWindow: 100000, maxTokens: 128000, input: ['text', 'image'] }] } } } });
  const incompatibleApi = structuredClone(api);
  incompatibleApi.openai.models['gpt-test'].reasoning_options = [{ type: 'effort', values: ['none', 'high'] }];
  const h = fixture({ describeModels, cache: { models, api: incompatibleApi, version: 'v1', updatedAt: new Date().toISOString() } });
  const preview = await h.app.execute({ action: 'preview', provider: 'relay', mode: 'missing' });
  assert.equal(preview.rows[0].changes.some(item => item.field === 'reasoningEfforts'), false);
  assert.equal(preview.rows[0].skipped, true);
  assert.ok(preview.rows[0].warnings.some(item => item.includes('Gemini')));
  const closedApi = structuredClone(api);
  closedApi.openai.models['gpt-test'].reasoning = false;
  closedApi.openai.models['gpt-test'].reasoning_options = [];
  const closed = fixture({ describeModels, cache: { models, api: closedApi, version: 'v1', updatedAt: new Date().toISOString() } });
  const result = await closed.app.execute({ action: 'preview', provider: 'relay', mode: 'missing' });
  assert.equal(result.rows[0].changes.find(item => item.field === 'reasoningEfforts').after, false);
  await closed.app.execute({ action: 'apply', token: result.token });
  assert.equal(closed.writes[0].operations.find(item => item.path.at(-1) === 'reasoningEfforts').value, false);
});

const custom = { contextWindow: 64000, maxTokens: 8192, input: ['text'], reasoningEfforts: false };

async function saveCustom(app, key, target) {
  const { relationsRevision } = await app.execute({ action: 'relations' });
  return app.execute({ action: 'saveRelation', kind: 'custom', key, target, expectedRevision: relationsRevision });
}

test('自定义模板读取当前人工映射，缺项留空，无匹配时可从空白填写', async () => {
  const { app, setRelations } = fixture();
  const request = { action: 'customTemplate', provider: 'relay', id: 'gpt-test' };
  assert.deepEqual((await app.execute(request)).parameters, { contextWindow: 100000, maxTokens: 128000, input: ['text', 'image'], reasoningEfforts: { low: 'low', high: 'high' } });
  const bodies = { '["relay","gpt-test"]': 'openai/gpt-test' };
  setRelations({ bodies, sources: { 'openai/gpt-test': { provider: 'openai', modelId: 'gpt-test' } } });
  assert.deepEqual((await app.execute(request)).parameters, { contextWindow: 80000, input: ['text'], reasoningEfforts: { low: 'low', high: 'high' } });
  setRelations({ bodies: { '["relay","gpt-test"]': 'gone/model' } });
  assert.deepEqual(await app.execute(request), { parameters: {} });
});

test('自定义参数按原始 ID 跨供应商共享，跳过失效映射并区分补缺与覆盖', async () => {
  const describeModels = () => ({ ns: 'llm-pi-ai', revision: 1, value: { providers: {
    relay: { models: [{ id: 'gpt-test', maxTokens: 4096 }, { id: 'GPT-TEST' }, { id: 'openai/gpt-test' }] },
    mirror: { models: [{ id: 'gpt-test', name: '另外的显示名' }] },
  } } });
  const { app, setRelations, writes } = fixture({ describeModels });
  setRelations({ bodies: { '["relay","gpt-test"]': 'gone/model' }, sources: { 'openai/gpt-test': { provider: 'gone', modelId: 'model' } } });
  await saveCustom(app, 'gpt-test', custom);
  const missing = await app.execute({ action: 'preview', provider: 'relay', mode: 'missing' });
  assert.deepEqual(missing.rows[0].source, { status: 'custom' });
  assert.equal(missing.rows[0].match, null);
  assert.deepEqual(missing.rows[0].changes.map(change => change.field), ['contextWindow', 'input', 'reasoningEfforts']);
  assert.ok(missing.rows.slice(1).every(row => row.source.status !== 'custom'));
  const overwrite = await app.execute({ action: 'preview', provider: 'relay', mode: 'overwrite' });
  assert.deepEqual(overwrite.rows[0].changes.find(change => change.field === 'maxTokens'), { field: 'maxTokens', before: 4096, after: 8192, origin: 'custom' });
  const shared = await app.execute({ action: 'preview', provider: 'mirror', mode: 'missing' });
  assert.deepEqual(Object.fromEntries(shared.rows[0].changes.map(change => [change.field, change.after])), custom);
  assert.equal(writes.length, 0);
  await app.execute({ action: 'apply', token: overwrite.token });
  assert.equal(writes[0].operations.find(op => op.path.at(-1) === 'maxTokens').value, custom.maxTokens);
  await saveCustom(app, 'gpt-test', null);
  const restored = await app.execute({ action: 'preview', provider: 'mirror', mode: 'overwrite' });
  assert.equal(restored.rows[0].source.status, 'invalid');
  assert.equal(writes.length, 1);
});

test('没有目录也可新建、编辑和移除关系，关系变化使旧预览失效', async () => {
  const { app, writes } = fixture({ cache: null });
  assert.deepEqual(await app.execute({ action: 'customTemplate', provider: 'relay', id: 'gpt-test' }), { parameters: {} });
  await saveCustom(app, 'gpt-test', custom);
  const status = await app.execute({ action: 'status' });
  assert.equal(status.providers[0].hasCustom, true);
  assert.equal(status.relationCounts.custom, 1);
  const plan = await app.execute({ action: 'preview', provider: 'relay', mode: 'missing' });
  assert.equal(plan.fieldCount, 4);
  assert.equal(plan.cacheVersion, null);
  const edited = { ...custom, reasoningEfforts: { off: null, high: 'high' } };
  await saveCustom(app, 'gpt-test', edited);
  await assert.rejects(app.execute({ action: 'apply', token: plan.token }), { code: 'STALE_PREVIEW' });
  const next = await app.execute({ action: 'preview', provider: 'relay', mode: 'overwrite' });
  assert.deepEqual(next.rows[0].changes.find(change => change.field === 'reasoningEfforts').after, edited.reasoningEfforts);
  await saveCustom(app, 'gpt-test', null);
  assert.deepEqual((await app.execute({ action: 'relations' })).relations.custom, {});
  assert.equal(writes.length, 0);
});

test('自定义关系仅接受四项完整且有效的模型元数据', async () => {
  const { app } = fixture();
  for (const values of [{ ...custom, maxTokens: undefined }, { ...custom, contextWindow: 1.5 }, { ...custom, input: [] }, { ...custom, reasoningEfforts: { off: null } }, { ...custom, reasoningEfforts: { high: null } }, { ...custom, temperature: 1 }]) {
    await assert.rejects(saveCustom(app, 'gpt-test', values), { code: 'INVALID_RELATION' });
  }
  await saveCustom(app, 'not-in-catalog', custom);
  assert.deepEqual((await app.execute({ action: 'relations' })).relations.custom['not-in-catalog'], custom);
});

test('拒绝任意服务身份和不存在的本地模型关系', async () => {
  const { app } = fixture();
  const expectedRevision = (await app.execute({ action: 'relations' })).relationsRevision;
  await assert.rejects(app.execute({ action: 'saveRelation', kind: 'source', key: 'openai/gpt-test', target: { provider: 'unknown', modelId: 'gpt-test' }, expectedRevision }), { code: 'INVALID_RELATION' });
  await assert.rejects(app.execute({ action: 'saveRelation', kind: 'body', key: '["relay","missing"]', target: 'openai/gpt-test', expectedRevision }), { code: 'INVALID_RELATION' });
});
