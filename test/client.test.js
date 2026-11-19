import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createApplication } from '../src/application.js';

function findElement(tree, predicate) {
  if (!tree || typeof tree !== 'object') {
    return null;
  }
  if (predicate(tree)) {
    return tree;
  }
  for (const child of tree.children?.flat(Infinity) ?? []) {
    const found = findElement(child, predicate);
    if (found) {
      return found;
    }
  }
  return null;
}

test('Client 插槽、精简预览、失效后的重新打开与关系切换', async () => {
  let plugin;
  let settingsRevision = 1;
  let writes = 0;
  let relations = { bodies: {}, sources: {} };
  let relationWrites = 0;
  let failRelationRead = false;
  const effects = [];
  const slots = new Map();
  const app = createApplication({
    cache: {
      version: 'v1', updatedAt: new Date().toISOString(),
      models: {
        'openai/gpt-test': { name: 'GPT Test', limit: { context: 100000, output: 128000 }, modalities: { input: ['text', 'pdf'] } },
        'lab/manual': { name: 'Manual source', limit: { output: 1000 } },
        'lab/no-service': { name: 'No service', limit: { output: 2000 } },
      },
      api: {
        openai: { models: { 'gpt-test': { canonical_model_id: 'openai/gpt-test', reasoning: false } } },
        relay: { models: { manual: { canonical_model_id: 'lab/manual', limit: { output: 900 },
          reasoning: true, reasoning_options: [{ type: 'toggle' }, { type: 'effort', values: ['low', 'high', 'max'] }, { type: 'budget_tokens', min: 1024 }] } } },
      },
    },
    readRelations: () => structuredClone(relations),
    saveRelations: async value => {
      relations = value;
      relationWrites += 1;
    },
    describeModels: () => ({ ns: 'llm-pi-ai', revision: settingsRevision, value: { providers: { relay: { models: [{ id: 'gpt-test' }, { id: 'unknown-model' }] } } } }),
    mutateModels: () => { writes += 1; },
    conflicts: () => [],
  });
  const React = {
    Fragment: Symbol('Fragment'),
    createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }),
    useCallback: callback => callback,
    useEffect: effect => { effects.push(effect); },
    useLayoutEffect: effect => { effects.push(effect); },
    useId: () => 'test-id',
    useRef: value => ({ current: value }),
    useState: value => [value, () => {}],
    useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot(),
  };
  vm.runInNewContext(await readFile(new URL('../src/client.js', import.meta.url), 'utf8'), {
    window: { __ModuleLoader__: { load(value) { plugin = value.factory(name => { assert.equal(name, 'react'); return React; }); } } },
    AbortController,
    fetch: async (_url, options) => {
      try {
        const request = JSON.parse(options.body);
        if (request.action === 'relations' && failRelationRead) {
          throw new Error('测试：重载失败');
        }
        const value = await app.execute(request);
        return { ok: true, async json() { return { ok: true, value }; } };
      } catch (error) {
        return { ok: false, async json() { return { ok: false, error: { code: error.code, message: error.message } }; } };
      }
    },
    setTimeout,
    clearTimeout,
  });
  const dictionaries = {};
  const disposers = [];
  plugin.apply({
    effect(effect) { disposers.push(effect()); },
    locale: { register(ns, value) { dictionaries[ns] = value; return () => {}; }, bind: ns => key => dictionaries[ns].zh[key], subscribe: () => () => {}, getSnapshot: () => 'zh' },
    slots: { inject(_name, callback) { callback(); }, register(slot, component) { slots.set(slot.name, component); return () => {}; } },
  });
  const Footer = slots.get('settings.models.footer');
  const ProviderCard = slots.get('settings.models.provider-card');
  Footer();
  await effects.shift()();
  // loadStatus 的 effect 不等待 promise；排空本地异步链，不启动浏览器。
  await new Promise(resolve => setImmediate(resolve));
  const card = ProviderCard({ provider: { provider: 'relay' }, configured: true });
  const missing = findElement(card, item => item.type === 'button' && item.children[0] === '自动填入');
  const overwrite = findElement(card, item => item.type === 'button' && item.children[0] === '覆盖填入');
  assert.ok(missing && overwrite);
  assert.equal(missing.props.disabled, false);
  await overwrite.props.onClick();
  function dialogElement() {
    return findElement(Footer(), item => item.type?.name === 'Dialog');
  }
  function renderDialog() {
    const dialog = dialogElement();
    return dialog.type(dialog.props);
  }
  function renderPreview(dialog) {
    const preview = findElement(dialog, item => item.type?.name === 'Preview');
    return preview.type(preview.props);
  }
  assert.equal(dialogElement().props.data.dialog.mode, 'overwrite');
  assert.ok(dialogElement().props.data.dialog.preview.fieldCount > 0);
  const dialog = renderDialog();
  const previewTree = renderPreview(dialog);
  assert.equal(findElement(previewTree, item => item.children.some(child => typeof child === 'string' && /资料版本|不参与填入|重新打开填入预览/.test(child))), null);
  const footer = findElement(dialog, item => item.type === 'footer');
  const confirm = findElement(footer, item => item.type === 'button' && item.children[0] === '确认填入');
  assert.deepEqual(Array.from(footer.children.filter(Boolean)), [confirm]);
  assert.equal(confirm.props.disabled, false);
  settingsRevision += 1;
  await confirm.props.onClick();
  assert.equal(writes, 0);
  const stale = renderDialog();
  assert.equal(findElement(stale, item => item.type === 'button' && item.children[0] === '确认填入').props.disabled, true);
  assert.ok(findElement(renderPreview(stale), item => item.props.role === 'status' && item.children[0].includes('重新打开填入预览')));
  findElement(stale, item => item.type === 'button' && item.children[0] === '关闭').props.onClick();
  await missing.props.onClick();
  assert.equal(dialogElement().props.data.dialog.mode, 'missing');
  assert.equal(findElement(renderDialog(), item => item.type === 'button' && item.children[0] === '确认填入').props.disabled, false);
  assert.ok(findElement(previewTree, item => item.type === 'strong' && item.children[0] === '最大输出 token 数'));
  assert.ok(findElement(previewTree, item => item.type === 'pre' && item.children[0] === '128000'));
  const manage = findElement(previewTree, item => item.type === 'button' && item.children[0] === '指定 / 管理关系');
  await manage.props.onClick();

  function relationsElement() {
    return findElement(renderDialog(), item => item.type?.name === 'Relations');
  }
  function managerState() {
    return relationsElement().props.data;
  }
  function managerTree() {
    const manager = relationsElement();
    return manager.type(manager.props);
  }
  function editorTree() {
    const editor = findElement(managerTree(), item => item.type?.name === 'RelationEditor');
    return editor.type(editor.props);
  }
  function action(tree, label) {
    const item = findElement(tree, node => node.type === 'button' && node.children[0] === label);
    assert.ok(item, label);
    return item;
  }
  async function chooseCanonical(id) {
    const picker = findElement(editorTree(), item => item.type?.name === 'CanonicalPicker');
    await picker.props.onSelect(id);
  }
  function manageModel(id) {
    const row = findElement(renderPreview(renderDialog()), item => item.type === 'section' && item.props.key === id);
    return action(row, '指定 / 管理关系').props.onClick();
  }

  const modelKey = '["relay","unknown-model"]';
  assert.equal(managerState().dialog.canonicalId, 'openai/gpt-test');
  assert.equal(managerState().dialog.editor.kind, 'body');
  assert.equal(managerState().dialog.detail.sourceStatus.status, 'automatic');
  action(editorTree(), '返回关系列表').props.onClick();
  assert.equal(findElement(managerTree(), item => item.type === 'li'), null);
  action(managerTree(), '来源映射').props.onClick();
  assert.equal(findElement(managerTree(), item => item.type === 'li'), null);
  await action(renderDialog(), '返回填入预览').props.onClick();

  await manageModel('unknown-model');
  assert.equal(managerState().dialog.editor.key, modelKey);
  assert.equal(action(editorTree(), '保存本体映射').props.disabled, true);
  await chooseCanonical('lab/manual');
  await action(editorTree(), '保存本体映射').props.onClick();
  assert.equal(relationWrites, 1);
  assert.equal(managerState().dialog.editor.kind, 'source');
  assert.equal(relations.bodies[modelKey], 'lab/manual');
  action(editorTree(), '暂不指定').props.onClick();
  assert.equal(managerState().dialog.tab, 'body');
  assert.equal(managerState().dialog.focusKey, modelKey);
  assert.deepEqual(relations.sources, {});
  assert.equal(findElement(managerTree(), item => item.type === 'button' && item.children[0] === '重新加载关系'), null);
  await action(managerTree(), '新增来源映射').props.onClick();
  assert.equal(managerState().dialog.editor.key, 'lab/manual');
  assert.equal(managerState().dialog.canonicalId, 'lab/manual');
  action(editorTree(), '返回关系列表').props.onClick();
  assert.equal(managerState().dialog.focusKey, modelKey);
  assert.equal(managerState().dialog.focusSource, true);
  assert.ok(action(managerTree(), '新增来源映射').props.ref);
  await action(managerTree(), '新增来源映射').props.onClick();
  const service = findElement(editorTree(), item => item.type?.name === 'SearchCombo' && item.props.label === '选择一条服务记录');
  const serviceCombo = service.type(service.props);
  assert.ok(findElement(serviceCombo, item => item.type === 'input' && item.props.role === 'combobox'));
  assert.equal(findElement(serviceCombo, item => item.type === 'select'), null);
  service.props.onSelect(service.props.options[0].id);
  const metadata = findElement(editorTree(), item => item.type?.name === 'Metadata');
  const reasoning = findElement(metadata.type(metadata.props), item => item.type === 'pre');
  assert.equal(reasoning.children[0], '支持开关\n思考等级: low, high, max\nToken 预算: 最少 1024');
  await action(editorTree(), '保存来源映射').props.onClick();
  assert.equal(managerState().dialog.tab, 'source');
  assert.deepEqual(relations.sources['lab/manual'], { provider: 'relay', modelId: 'manual' });
  await action(renderDialog(), '返回填入预览').props.onClick();
  assert.equal(dialogElement().props.data.dialog.preview.rows[1].source.status, 'manual');

  await manageModel('unknown-model');
  assert.equal(managerState().dialog.editor.kind, 'body');
  await chooseCanonical('lab/no-service');
  await action(editorTree(), '保存本体映射').props.onClick();
  assert.equal(managerState().dialog.editor, null);
  assert.ok(managerState().notice.includes('noSourceToChoose'));
  await action(managerTree(), '编辑').props.onClick();
  await chooseCanonical('openai/gpt-test');
  await action(editorTree(), '保存本体映射').props.onClick();
  assert.equal(managerState().dialog.editor, null);
  assert.equal(managerState().dialog.tab, 'body');
  assert.equal(relations.bodies[modelKey], 'openai/gpt-test');

  await action(managerTree(), '编辑').props.onClick();
  await chooseCanonical('lab/manual');
  await action(editorTree(), '保存本体映射').props.onClick();
  await action(managerTree(), '编辑来源映射').props.onClick();
  assert.equal(managerState().dialog.editor.key, 'lab/manual');
  assert.equal(managerState().dialog.selectedService, '["relay","manual"]');
  action(editorTree(), '返回关系列表').props.onClick();

  // 已保存但刷新失败：显示保存结果，不提供重载按钮，也不重复写入。
  await action(managerTree(), '编辑').props.onClick();
  await chooseCanonical('lab/no-service');
  const previousWrites = relationWrites;
  failRelationRead = true;
  await action(editorTree(), '保存本体映射').props.onClick();
  assert.equal(relationWrites, previousWrites + 1);
  assert.equal(managerState().notice, 'reloadAfterSave');
  assert.equal(managerState().error, '');
  assert.equal(findElement(managerTree(), item => item.type === 'button'), null);
  failRelationRead = false;
  await action(renderDialog(), '返回填入预览').props.onClick();

  relations.sources['lab/no-service'] = { provider: 'retired', modelId: 'gone' };
  await manageModel('unknown-model');
  action(editorTree(), '返回关系列表').props.onClick();
  assert.equal(managerState().dialog.relationsData.sourceStatuses['lab/no-service'], 'invalid');
  const invalidRow = findElement(managerTree(), item => item.type === 'li' && item.props.key === 'lab/no-service');
  assert.ok(findElement(invalidRow, item => item.children[0] === '人工关系失效'));
  await action(invalidRow, '编辑').props.onClick();
  await action(editorTree(), '移除来源映射，恢复自动').props.onClick();
  assert.equal(Object.hasOwn(relations.sources, 'lab/no-service'), false);
  assert.deepEqual(relations.sources['lab/manual'], { provider: 'relay', modelId: 'manual' });
  assert.equal(writes, 0);
  assert.deepEqual(Object.keys(dictionaries['model-meta-fill'].zh).sort(), Object.keys(dictionaries['model-meta-fill'].en).sort());
  for (const dispose of disposers.reverse()) {
    if (dispose) {
      await dispose();
    }
  }
  await app.dispose();
});
