import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCatalog, localKey, matchModel, resolveSource, planModel, searchModels, compareIds } from '../src/core.js';

const canonicalId = 'openai/gpt-6.1-sol';
const fullModel = (name = 'GPT-6.1 Sol') => ({ name, limit: { context: 1050000, output: 128000 }, modalities: { input: ['text', 'image', 'pdf'] }, reasoning: true });
const serviceModel = (body = canonicalId, extra = {}) => ({ canonical_model_id: body, limit: { context: 200000, output: 64000 }, modalities: { input: ['text'] }, reasoning: true, reasoning_options: [{ type: 'effort', values: ['none', 'low', 'high'] }], ...extra });
function fixture() {
  return buildCatalog({ [canonicalId]: fullModel() }, {
    openai: { name: 'OpenAI', models: { 'gpt-6.1-sol': serviceModel() } },
    relay: { name: '第三方', models: { custom: serviceModel(canonicalId, { limit: { context: 32000, output: 16000 }, modalities: { input: ['image'] }, reasoning_options: [{ type: 'effort', values: ['high', 'max'] }] }) } },
  });
}
const relationsFor = (provider, modelId) => ({ sources: { [canonicalId]: { provider, modelId } } });
const fieldsOf = (plan) => Object.fromEntries(plan.changes.map((change) => [change.field, change.after]));

// 目录推断、固定排序与显式身份关联。
test('目录保留远端字段，以目录键确保本体 ID，服务键区分具体记录', () => {
  const raw = { [canonicalId]: { ...fullModel(), id: 'wrong', custom: '保留' } };
  const catalog = buildCatalog(raw, { openai: { models: { first: serviceModel(), second: serviceModel(), unrelated: { id: 'gpt-6.1-sol' }, unknown: serviceModel('unknown/model') } } });
  assert.equal(catalog.models[canonicalId].id, canonicalId);
  assert.equal(catalog.models[canonicalId].custom, '保留');
  assert.equal(raw[canonicalId].id, 'wrong');
  assert.equal(Object.keys(catalog.services).length, 2);
  assert.equal(catalog.services[localKey('openai', 'second')].modelId, 'second');
  assert.equal(catalog.services[localKey('openai', 'first')].id, undefined);
  assert.deepEqual(JSON.parse(JSON.stringify(catalog)), catalog);
});

test('完整归属优于左前缀，none 不自动采用，同级固定排序', () => {
  const models = { 'google/m': fullModel(), 'anthropic/m': fullModel(), 'amazon/nova': fullModel(), 'moonshotai/kimi': fullModel(), 'zhipuai/glm': fullModel() };
  const api = {
    'google-vertex': { models: { z: serviceModel('google/m') } },
    google: { models: { z: serviceModel('google/m'), A: serviceModel('google/m'), a: serviceModel('google/m') } },
    'google-vertex-anthropic': { models: { claude: serviceModel('anthropic/m'), gemini: serviceModel('google/m') } },
    'amazon-bedrock': { models: { nova: serviceModel('amazon/nova') } },
    'moonshotai-cn': { models: { kimi: serviceModel('moonshotai/kimi') } },
    zai: { models: { glm: serviceModel('zhipuai/glm') } },
  };
  const catalog = buildCatalog(models, api);
  const reversed = buildCatalog(models, Object.fromEntries(Object.entries(api).reverse()));
  assert.deepEqual(catalog.candidates, reversed.candidates);
  assert.deepEqual(catalog.automatic, reversed.automatic);
  assert.equal(catalog.automatic['google/m'], localKey('google', 'A'));
  assert.equal(catalog.services[localKey('google-vertex-anthropic', 'claude')].match, 'none');
  assert.equal(catalog.services[localKey('google-vertex-anthropic', 'gemini')].match, 'prefix');
  assert.equal(catalog.services[localKey('amazon-bedrock', 'nova')].match, 'prefix');
  assert.equal(catalog.services[localKey('moonshotai-cn', 'kimi')].match, 'prefix');
  assert.equal(catalog.automatic['zhipuai/glm'], null);
});

test('多个研发方候选按最长完整左前缀确定唯一归属', () => {
  const models = { 'a/m': fullModel(), 'a-b/m': fullModel(), 'a-b-c/m': fullModel() };
  const catalog = buildCatalog(models, {
    'a-b-cloud': { models: { short: serviceModel('a/m'), long: serviceModel('a-b/m') } },
    'a-b-c': { models: { prefix: serviceModel('a-b/m'), exact: serviceModel('a-b-c/m') } },
    'ab-cloud': { models: { no: serviceModel('a/m') } },
  });
  assert.equal(catalog.services[localKey('a-b-cloud', 'short')].match, 'none');
  assert.equal(catalog.services[localKey('a-b-cloud', 'long')].match, 'prefix');
  assert.equal(catalog.services[localKey('a-b-c', 'prefix')].match, 'none');
  assert.equal(catalog.services[localKey('a-b-c', 'exact')].match, 'exact');
  assert.equal(catalog.services[localKey('ab-cloud', 'no')].match, 'none');
});

test('排序按稳定码点，不调用 localeCompare，记录 ID 原样保留', () => {
  assert.ok(compareIds('A', 'a') < 0);
  assert.ok(compareIds('\uE000', '😀') < 0);
  const catalog = buildCatalog({ [canonicalId]: fullModel() }, { openai: { models: { ' GPT ': serviceModel(), GPT: serviceModel() } } });
  assert.deepEqual(catalog.candidates[canonicalId], [localKey('openai', ' GPT '), localKey('openai', 'GPT')]);
  assert.notEqual(localKey('a/b', 'c'), localKey('a', 'b/c'));
});

test('同供应商多个服务 ID 均保留，自动仅选择固定排序首条', () => {
  const catalog = buildCatalog({ 'deepseek/v4': fullModel() }, { deepseek: { models: { 'v4-vision': serviceModel('deepseek/v4'), flash: serviceModel('deepseek/v4'), 'v4-flash': serviceModel('deepseek/v4') } } });
  assert.equal(catalog.candidates['deepseek/v4'].length, 3);
  assert.equal(catalog.automatic['deepseek/v4'], localKey('deepseek', 'flash'));
  assert.equal(resolveSource(catalog, 'deepseek/v4').status, 'automatic');
});

// 本体匹配与来源映射是两个独立阶段。
test('完整本体 ID 优先于同名或相同末段，忽略大小写后仍完整优先', () => {
  const catalog = buildCatalog({ [canonicalId]: fullModel(), 'other/gpt-6.1-sol': fullModel() }, {});
  assert.equal(matchModel(catalog, 'jf', { id: canonicalId }).canonicalId, canonicalId);
  assert.equal(matchModel(catalog, 'jf', { id: canonicalId.toUpperCase() }).canonicalId, canonicalId);
  assert.equal(matchModel(catalog, 'jf', { id: 'gpt-6.1-sol' }).status, 'ambiguous');
});

test('网关后保留研发方的完整身份优先于其他研发方同名末段', () => {
  const catalog = buildCatalog({ [canonicalId]: fullModel(), 'other/gpt-6.1-sol': fullModel() }, {});
  assert.equal(matchModel(catalog, 'jf', { id: 'gateway/openai/gpt-6.1-sol' }).canonicalId, canonicalId);
  assert.equal(matchModel(catalog, 'jf', { id: 'gateway/gpt-6.1-sol' }).status, 'ambiguous');
});

test('归一化支持 NFKC、空格、下划线、横线及网关路径', () => {
  const catalog = fixture();
  for (const id of ['jf/GPT-6.1 Sol', 'GPT_6.1_SOL', ' ＧＰＴ－６.１ Ｓｏｌ ', 'gateway/openai/gpt-6.1-sol']) {
    assert.equal(matchModel(catalog, 'jf', { id }).canonicalId, canonicalId, id);
  }
});

test('显示名可匹配但不跨模型变体、版本或日期', () => {
  const catalog = fixture();
  assert.equal(matchModel(catalog, 'jf', { id: 'custom', name: 'GPT-6.1 Sol' }).canonicalId, canonicalId);
  for (const id of ['gpt-6.1-sol-pro', 'gpt-6.2-sol', 'gpt-6.1-sol-20261117', 'gpt-6.1-sol-thinking']) {
    assert.equal(matchModel(catalog, 'jf', { id }).status, 'unmatched');
  }
});

test('冒号后缀即使只有单候选也要求选择，显示名不可绕过', () => {
  const catalog = fixture();
  const match = matchModel(catalog, 'jf', { id: 'jf/gpt-6.1-sol:free', name: 'GPT-6.1 Sol' });
  assert.equal(match.status, 'ambiguous');
  assert.equal(match.rule, 'colon');
  assert.deepEqual(match.candidates, [canonicalId]);
  const exact = buildCatalog({ 'lab/m:thinking': fullModel() }, {});
  assert.equal(matchModel(exact, 'jf', { id: 'lab/m:thinking' }).status, 'matched');
  assert.equal(matchModel(exact, 'jf', { id: 'gateway/lab/m:thinking' }).status, 'matched');
  assert.equal(matchModel(exact, 'jf', { id: 'm:thinking' }).status, 'matched');
});

test('人工本体映射优先，失效不回退，临时 choices 不能覆盖人工失效', () => {
  const catalog = fixture();
  const key = localKey('jf', 'gpt-6.1-sol');
  assert.equal(matchModel(catalog, 'jf', { id: 'gpt-6.1-sol' }, { bodies: { [key]: canonicalId } }).rule, 'manual');
  const relations = { bodies: { [key]: 'gone/model' } };
  assert.equal(matchModel(catalog, 'jf', { id: 'gpt-6.1-sol' }, relations).status, 'invalid');
  const plan = planModel(catalog, 'jf', { id: 'gpt-6.1-sol' }, relations, 'missing', { [key]: canonicalId });
  assert.equal(plan.match.status, 'invalid');
  assert.deepEqual(plan.changes, []);
});

test('本次 choices 可确认冒号候选，不修改关系配置', () => {
  const catalog = fixture();
  const model = { id: 'gpt-6.1-sol:free' };
  const relations = { bodies: {}, sources: {} };
  const plan = planModel(catalog, 'jf', model, relations, 'missing', { [localKey('jf', model.id)]: canonicalId });
  assert.equal(plan.match.rule, 'choice');
  assert.equal(plan.skipped, false);
  assert.deepEqual(relations, { bodies: {}, sources: {} });
});

test('人工服务映射可以指定第三方，但失效和错关联均不能回退', () => {
  const catalog = fixture();
  assert.equal(resolveSource(catalog, canonicalId, relationsFor('relay', 'custom')).status, 'manual');
  assert.equal(resolveSource(catalog, canonicalId, relationsFor('openai', 'gone')).status, 'invalid');
  const other = buildCatalog({ [canonicalId]: fullModel(), 'other/model': fullModel() }, { relay: { models: { custom: serviceModel('other/model') } } });
  assert.equal(resolveSource(other, canonicalId, relationsFor('relay', 'custom')).status, 'invalid');
  assert.equal(planModel(catalog, 'jf', { id: canonicalId }, relationsFor('relay', 'gone'), 'overwrite').skipped, true);
});

test('none 服务候选不会自动采用，但仍可人工指定', () => {
  const catalog = buildCatalog({ 'zhipuai/glm': fullModel() }, { zai: { models: { glm: serviceModel('zhipuai/glm') } } });
  assert.equal(resolveSource(catalog, 'zhipuai/glm').status, 'missing');
  assert.equal(resolveSource(catalog, 'zhipuai/glm', { sources: { 'zhipuai/glm': { provider: 'zai', modelId: 'glm' } } }).status, 'manual');
});

// 字段取值、缺失定义和不可写值。
test('自动基础信息只取模型本体，思考取自动服务', () => {
  const plan = planModel(fixture(), 'jf', { id: 'jf/GPT-6.1 Sol' }, {}, 'missing');
  assert.deepEqual(fieldsOf(plan), { contextWindow: 1050000, maxTokens: 128000, input: ['text', 'image'], reasoningEfforts: { off: 'none', low: 'low', high: 'high' } });
  assert.ok(plan.changes.filter((change) => change.field !== 'reasoningEfforts').every((change) => change.origin === `models.json:${canonicalId}`));
  assert.equal(plan.changes.find((change) => change.field === 'reasoningEfforts').origin, `api.json:${localKey('openai', 'gpt-6.1-sol')}`);
  assert.ok(plan.changes.every((change) => change.before === null));
  assert.deepEqual(plan.warnings, []);
});

test('人工服务来源四项全部取服务，不混用本体或其他服务', () => {
  const catalog = fixture();
  const plan = planModel(catalog, 'jf', { id: canonicalId }, relationsFor('relay', 'custom'), 'missing');
  assert.deepEqual(fieldsOf(plan), { contextWindow: 32000, maxTokens: 16000, input: ['image'], reasoningEfforts: { high: 'high', max: 'max' } });
  assert.ok(plan.changes.every((change) => change.origin === `api.json:${localKey('relay', 'custom')}`));
  const sparse = buildCatalog({ [canonicalId]: fullModel() }, { relay: { models: { custom: serviceModel(canonicalId, { limit: {}, modalities: {}, reasoning_options: [] }) } } });
  const local = { id: canonicalId, contextWindow: 7, maxTokens: 5, input: ['text'], reasoningEfforts: false };
  assert.deepEqual(planModel(sparse, 'jf', local, relationsFor('relay', 'custom'), 'overwrite').changes, []);
});

test('只有人工本体映射不切换基础字段为服务来源', () => {
  const model = { id: 'alias' };
  const relations = { bodies: { [localKey('jf', model.id)]: canonicalId } };
  assert.equal(fieldsOf(planModel(fixture(), 'jf', model, relations, 'missing')).contextWindow, 1050000);
});

test('缺少自动服务仍填基础信息，不用本体 reasoning 布尔值推导等级', () => {
  const catalog = buildCatalog({ [canonicalId]: fullModel() }, {});
  const plan = planModel(catalog, 'jf', { id: canonicalId }, {}, 'missing');
  assert.deepEqual(fieldsOf(plan), { contextWindow: 1050000, maxTokens: 128000, input: ['text', 'image'] });
  assert.equal(plan.source.status, 'missing');
  assert.ok(plan.warnings.some((message) => message.includes('思考资料暂缺')));
});

test('自动填入按字段补缺失，保留显式输出上限、仅文本及关闭思考', () => {
  const model = { id: canonicalId, maxTokens: 64000, input: ['text'], reasoningEfforts: false, name: '本地名称', untouched: 10 };
  const original = structuredClone(model);
  assert.deepEqual(fieldsOf(planModel(fixture(), 'jf', model, {}, 'missing')), { contextWindow: 1050000 });
  assert.deepEqual(model, original);
  const overwritten = fieldsOf(planModel(fixture(), 'jf', model, {}, 'overwrite'));
  assert.equal(overwritten.maxTokens, 128000);
  assert.deepEqual(overwritten.input, ['text', 'image']);
  assert.deepEqual(overwritten.reasoningEfforts, { off: 'none', low: 'low', high: 'high' });
  assert.equal(ownsField(overwritten, 'name'), false);
});
function ownsField(object, key) {
  return Object.hasOwn(object, key);
}

test('空输入数组可填，继承默认文本不构成已有输入声明', () => {
  const catalog = fixture();
  assert.deepEqual(fieldsOf(planModel(catalog, 'jf', { id: canonicalId, input: [] }, {}, 'missing')).input, ['text', 'image']);
  assert.deepEqual(fieldsOf(planModel(catalog, 'jf', { id: canonicalId }, {}, 'missing')).input, ['text', 'image']);
});

test('明确不支持思考产生 false，但不覆盖自动模式已有等级', () => {
  const catalog = buildCatalog({ [canonicalId]: fullModel() }, { openai: { models: { model: serviceModel(canonicalId, { reasoning: false, reasoning_options: [] }) } } });
  assert.equal(fieldsOf(planModel(catalog, 'jf', { id: canonicalId }, {}, 'missing')).reasoningEfforts, false);
  const model = { id: canonicalId, reasoningEfforts: { high: 'custom' } };
  assert.equal(ownsField(fieldsOf(planModel(catalog, 'jf', model, {}, 'missing')), 'reasoningEfforts'), false);
  assert.equal(fieldsOf(planModel(catalog, 'jf', model, {}, 'overwrite')).reasoningEfforts, false);
});

test('开关、预算、default 以及仅 none 都不推导为可写等级', () => {
  for (const reasoning_options of [[{ type: 'toggle' }], [{ type: 'budget_tokens', min: 1024 }], [{ type: 'effort', values: ['default'] }], [{ type: 'effort', values: ['none'] }], []]) {
    const catalog = buildCatalog({ [canonicalId]: fullModel() }, { openai: { models: { model: serviceModel(canonicalId, { reasoning_options }) } } });
    const plan = planModel(catalog, 'jf', { id: canonicalId }, {}, 'missing');
    assert.equal(ownsField(fieldsOf(plan), 'reasoningEfforts'), false);
    assert.ok(plan.warnings.some((message) => message.includes('思考等级')));
  }
});

test('可识别 effort 保留原值，未知值警告但不造等级', () => {
  const catalog = buildCatalog({ [canonicalId]: fullModel() }, { openai: { models: { model: serviceModel(canonicalId, { reasoning_options: [{ type: 'effort', values: ['low', 'default', 'ultra', 'xhigh'] }] }) } } });
  const plan = planModel(catalog, 'jf', { id: canonicalId }, {}, 'missing');
  assert.deepEqual(fieldsOf(plan).reasoningEfforts, { low: 'low', xhigh: 'xhigh' });
  assert.ok(plan.warnings.some((message) => message.includes('default、ultra')));
});

test('非法已有思考声明自动模式警告跳过，覆盖模式有明确来源可替换', () => {
  for (const reasoningEfforts of [{}, null, { off: null }, { low: '' }, { strange: 'high' }]) {
    for (const mode of ['missing', 'overwrite']) {
      const plan = planModel(fixture(), 'jf', { id: canonicalId, reasoningEfforts }, {}, mode);
      if (mode === 'missing') {
        assert.equal(ownsField(fieldsOf(plan), 'reasoningEfforts'), false);
      } else {
        assert.deepEqual(fieldsOf(plan).reasoningEfforts, { off: 'none', low: 'low', high: 'high' });
      }
      assert.ok(plan.warnings.some((message) => message.includes('本地 reasoningEfforts 声明无效')));
    }
  }
});

test('覆盖模式来源无等级时也不删除或修复非法思考声明', () => {
  const catalog = buildCatalog({ [canonicalId]: fullModel() }, { openai: { models: { model: serviceModel(canonicalId, { reasoning_options: [{ type: 'toggle' }] }) } } });
  const plan = planModel(catalog, 'jf', { id: canonicalId, reasoningEfforts: {} }, {}, 'overwrite');
  assert.equal(ownsField(fieldsOf(plan), 'reasoningEfforts'), false);
  assert.ok(plan.warnings.some((message) => message.includes('本地 reasoningEfforts 声明无效')));
});

test('非法已有容量和输入自动模式不修复，覆盖模式有有效来源时替换并警告', () => {
  const model = { id: canonicalId, contextWindow: 0, input: null };
  const missing = planModel(fixture(), 'jf', model, {}, 'missing');
  assert.equal(ownsField(fieldsOf(missing), 'contextWindow'), false);
  assert.equal(ownsField(fieldsOf(missing), 'input'), false);
  const overwrite = planModel(fixture(), 'jf', model, {}, 'overwrite');
  assert.equal(fieldsOf(overwrite).contextWindow, 1050000);
  assert.deepEqual(fieldsOf(overwrite).input, ['text', 'image']);
  assert.equal(overwrite.warnings.filter((message) => message.includes('本地')).length, 2);
});

test('最大输出只采用来源中的有效正整数，非法本地声明仅允许显式覆盖', () => {
  const model = { id: canonicalId, maxTokens: 0 };
  const missing = planModel(fixture(), 'jf', model, {}, 'missing');
  assert.equal(ownsField(fieldsOf(missing), 'maxTokens'), false);
  assert.ok(missing.warnings.some((message) => message.includes('本地 最大输出 token 数 声明无效')));
  assert.equal(fieldsOf(planModel(fixture(), 'jf', model, {}, 'overwrite')).maxTokens, 128000);
  for (const output of [0, -1, 1.5, '128000']) {
    const catalog = buildCatalog({ [canonicalId]: { ...fullModel(), limit: { context: 1050000, output } } }, {});
    assert.equal(ownsField(fieldsOf(planModel(catalog, 'jf', { id: canonicalId, maxTokens: 64000 }, {}, 'overwrite')), 'maxTokens'), false);
  }
});

test('MIME 图片合并去重，PDF 音视频不当成图片，无可写类型不写空数组', () => {
  const catalog = buildCatalog({ [canonicalId]: { ...fullModel(), modalities: { input: ['image/png', 'image/jpeg', 'text', 'audio', 'video', 'application/pdf'] } } }, {});
  const plan = planModel(catalog, 'jf', { id: canonicalId }, {}, 'missing');
  assert.deepEqual(fieldsOf(plan).input, ['text', 'image']);
  assert.deepEqual(plan.warnings, [plan.source.message]);
  const none = buildCatalog({ [canonicalId]: { ...fullModel(), modalities: { input: ['pdf', 'audio'] } } }, {});
  const noUsableInput = planModel(none, 'jf', { id: canonicalId, input: ['text'] }, {}, 'overwrite');
  assert.equal(ownsField(fieldsOf(noUsableInput), 'input'), false);
  assert.deepEqual(noUsableInput.warnings, [noUsableInput.source.message, '所选来源没有可填入的输入类型。']);
});

test('相同值不产生差异，只允许四个目标字段，结果 JSON 可序列化', () => {
  const model = { id: canonicalId, name: '本地', maxTokens: 128000, contextWindow: 1050000, input: ['text', 'image'], reasoningEfforts: { off: 'none', low: 'low', high: 'high' } };
  const plan = planModel(fixture(), 'jf', model, {}, 'overwrite');
  assert.equal(plan.skipped, true);
  assert.deepEqual(plan.changes, []);
  assert.deepEqual(JSON.parse(JSON.stringify(plan)), plan);
  assert.throws(() => planModel(fixture(), 'jf', model, {}, 'other'), TypeError);
});

test('相同等级映射仅键顺序不同不产生覆盖差异', () => {
  const plan = planModel(fixture(), 'jf', { id: canonicalId, reasoningEfforts: { high: 'high', low: 'low', off: 'none' } }, {}, 'overwrite');
  assert.equal(ownsField(fieldsOf(plan), 'reasoningEfforts'), false);
});

test('搜索匹配 ID、显示名和研发方，空查询限量且稳定排序', () => {
  const models = Object.fromEntries(Array.from({ length: 100 }, (_, index) => [`lab/model-${String(index).padStart(3, '0')}`, { name: `模型 ${index}` }]));
  models[canonicalId] = fullModel();
  const catalog = buildCatalog(models, {});
  assert.equal(searchModels(catalog, '').length, 80);
  assert.equal(searchModels(catalog, '', 3).length, 3);
  assert.equal(searchModels(catalog, 'openai')[0].id, canonicalId);
  assert.equal(searchModels(catalog, 'GPT_6.1_SOL')[0].id, canonicalId);
  assert.equal(searchModels(catalog, '模型 98')[0].id, 'lab/model-098');
  assert.deepEqual(searchModels(catalog, '', 0), []);
});
