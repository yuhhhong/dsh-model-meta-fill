// 纯目录与差异计算，不访问网络、配置或宿主运行时。
const effortLevels = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'];
const matchRanks = { exact: 0, prefix: 1, none: 2 };
const owns = (value, key) => Object.hasOwn(value ?? {}, key);
const recordOf = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

// 按 Unicode 码点比较，不依赖机器的区域设置。
export function compareIds(left, right) {
  const leftPoints = Array.from(left, (value) => value.codePointAt(0));
  const rightPoints = Array.from(right, (value) => value.codePointAt(0));
  for (let index = 0; index < Math.min(leftPoints.length, rightPoints.length); index += 1) {
    if (leftPoints[index] !== rightPoints[index]) {
      return leftPoints[index] - rightPoints[index];
    }
  }
  return leftPoints.length - rightPoints.length;
}

const folded = (value) => String(value).normalize('NFKC').trim().toLowerCase();
export function normalizeModelName(value) {
  return folded(value).replace(/[\s_\p{Dash_Punctuation}]+/gu, '-');
}
const wordsOf = (value) => folded(value).split(/[^\p{Letter}\p{Number}]+/u).filter(Boolean);

// 必须先对所有研发方归属，避免短研发方抢占更长的完整左前缀。
function providerOwner(provider, labs) {
  const exact = labs.find((lab) => folded(lab) === folded(provider));
  if (exact !== undefined) {
    return { lab: exact, match: 'exact' };
  }
  const providerWords = wordsOf(provider);
  const prefixes = labs.filter((lab) => {
    const labWords = wordsOf(lab);
    return labWords.length > 0 && labWords.length <= providerWords.length && labWords.every((word, index) => providerWords[index] === word);
  }).sort((left, right) => wordsOf(right).length - wordsOf(left).length || compareIds(left, right));
  return { lab: prefixes[0], match: prefixes.length > 0 ? 'prefix' : 'none' };
}

export function localKey(provider, id) {
  return JSON.stringify([provider, id]);
}

export function buildCatalog(modelsJson, apiJson) {
  const models = Object.fromEntries(Object.entries(modelsJson).filter(([, model]) => recordOf(model)).map(([id, model]) => [id, { ...model, id }]));
  const labs = [...new Set(Object.keys(models).map((id) => id.split('/')[0]))].sort(compareIds);
  const services = {};
  const candidates = Object.fromEntries(Object.keys(models).map((id) => [id, []]));
  const automatic = Object.fromEntries(Object.keys(models).map((id) => [id, null]));
  for (const [provider, entry] of Object.entries(apiJson)) {
    const owner = providerOwner(provider, labs);
    for (const [modelId, model] of Object.entries(entry.models ?? {})) {
      if (!recordOf(model) || !owns(models, model.canonical_model_id)) {
        continue;
      }
      const canonicalId = model.canonical_model_id;
      const key = localKey(provider, modelId);
      const match = canonicalId.split('/')[0] === owner.lab ? owner.match : 'none';
      services[key] = { ...model, key, provider, providerName: entry.name ?? provider, modelId, canonicalId, match };
      candidates[canonicalId].push(key);
    }
  }
  for (const [canonicalId, keys] of Object.entries(candidates)) {
    keys.sort((left, right) => {
      const first = services[left];
      const second = services[right];
      return matchRanks[first.match] - matchRanks[second.match] || compareIds(first.provider, second.provider) || compareIds(first.modelId, second.modelId);
    });
    automatic[canonicalId] = keys.find((key) => services[key].match !== 'none') ?? null;
  }
  return { models, services, candidates, automatic };
}

function matchedResult(ids, rule, requiresChoice = false) {
  const candidates = [...new Set(ids)].sort(compareIds);
  if (candidates.length === 0) {
    return null;
  }
  if (candidates.length === 1 && !requiresChoice) {
    return { status: 'matched', canonicalId: candidates[0], candidates, rule };
  }
  return { status: 'ambiguous', candidates, rule, message: requiresChoice ? '移除冒号后缀后的候选需要手动确认。' : '匹配到多个模型本体，请手动选择。' };
}

function suffixesOf(id) {
  const parts = id.split('/');
  return parts.map((_, index) => parts.slice(index).join('/'));
}

export function matchModel(catalog, provider, model, relations = {}) {
  const key = localKey(provider, model.id);
  if (owns(relations.bodies, key)) {
    const canonicalId = relations.bodies[key];
    if (!owns(catalog.models, canonicalId)) {
      return { status: 'invalid', candidates: [], rule: 'manual', message: '已保存的本体映射已失效，请修改或移除关系。' };
    }
    return { status: 'matched', canonicalId, candidates: [canonicalId], rule: 'manual' };
  }
  const entries = Object.entries(catalog.models);
  const id = typeof model.id === 'string' ? model.id : '';
  if (id.length === 0) {
    return { status: 'unmatched', candidates: [], rule: 'none', message: '本地模型 ID 为空。' };
  }
  // 完整模型身份必须优先，不能被同名模型或路径末段覆盖。
  if (owns(catalog.models, id)) {
    return { status: 'matched', canonicalId: id, candidates: [id], rule: 'exact' };
  }
  const full = matchedResult(entries.filter(([canonicalId]) => folded(canonicalId) === folded(id)).map(([canonicalId]) => canonicalId), 'exact');
  if (full !== null) {
    return full;
  }
  const normalizedFull = matchedResult(entries.filter(([canonicalId]) => normalizeModelName(canonicalId) === normalizeModelName(id)).map(([canonicalId]) => canonicalId), 'normalized');
  if (normalizedFull !== null) {
    return normalizedFull;
  }
  const suffixes = suffixesOf(id);
  // 网关前缀之后仍包含研发方的完整身份时，不能退化为跨研发方的末段比较。
  for (const suffix of suffixes.slice(1).filter((value) => value.includes('/'))) {
    const qualified = matchedResult(entries.filter(([canonicalId]) => normalizeModelName(canonicalId) === normalizeModelName(suffix)).map(([canonicalId]) => canonicalId), 'gateway');
    if (qualified !== null) {
      return qualified;
    }
  }
  const normalized = new Set(suffixes.map(normalizeModelName));
  const byId = matchedResult(entries.filter(([canonicalId]) => normalized.has(normalizeModelName(canonicalId)) || normalized.has(normalizeModelName(canonicalId.slice(canonicalId.indexOf('/') + 1)))).map(([canonicalId]) => canonicalId), id.includes('/') ? 'gateway' : 'normalized');
  if (byId !== null) {
    return byId;
  }
  if (!id.includes(':')) {
    const names = new Set([...suffixes, ...(typeof model.name === 'string' ? [model.name] : [])].map(normalizeModelName));
    const byName = matchedResult(entries.filter(([, entry]) => typeof entry.name === 'string' && names.has(normalizeModelName(entry.name))).map(([canonicalId]) => canonicalId), 'name');
    if (byName !== null) {
      return byName;
    }
  } else {
    const withoutVariant = new Set(suffixes.map((value) => normalizeModelName(value.slice(0, value.indexOf(':')))));
    const colon = matchedResult(entries.filter(([canonicalId, entry]) => withoutVariant.has(normalizeModelName(canonicalId)) || withoutVariant.has(normalizeModelName(canonicalId.slice(canonicalId.indexOf('/') + 1))) || (typeof entry.name === 'string' && withoutVariant.has(normalizeModelName(entry.name)))).map(([canonicalId]) => canonicalId), 'colon', true);
    if (colon !== null) {
      return colon;
    }
  }
  return { status: 'unmatched', candidates: [], rule: 'none', message: '未匹配到模型本体，可搜索并指定本体映射。' };
}

export function resolveSource(catalog, canonicalId, relations = {}) {
  if (owns(relations.sources, canonicalId)) {
    const target = relations.sources[canonicalId];
    const serviceKey = recordOf(target) ? localKey(target.provider, target.modelId) : undefined;
    const service = catalog.services[serviceKey];
    if (!service || service.canonicalId !== canonicalId || !owns(catalog.models, canonicalId)) {
      return { status: 'invalid', message: '已保存的服务来源映射已失效，请修改或移除关系。' };
    }
    return { status: 'manual', serviceKey };
  }
  const serviceKey = catalog.automatic[canonicalId];
  const service = catalog.services[serviceKey];
  if (service && service.canonicalId === canonicalId && service.match !== 'none') {
    return { status: 'automatic', serviceKey };
  }
  return { status: 'missing', message: '没有可自动推断的服务来源，可手动指定；思考资料暂缺。' };
}

function sourceInput(record, warnings) {
  const input = record?.modalities?.input;
  if (!Array.isArray(input)) {
    warnings.push('所选基础来源缺少输入类型资料，保留本地值。');
    return undefined;
  }
  const supported = new Set();
  for (const value of input) {
    if (value === 'text' || value.startsWith('text/')) {
      supported.add('text');
    } else if (value === 'image' || value.startsWith('image/')) {
      supported.add('image');
    }
  }
  const result = ['text', 'image'].filter((value) => supported.has(value));
  if (result.length === 0) {
    warnings.push('所选来源没有可填入的输入类型。');
    return undefined;
  }
  return result;
}

function sourceEfforts(service, warnings) {
  if (service === undefined) {
    return undefined;
  }
  if (service.reasoning === false) {
    return false;
  }
  const options = Array.isArray(service.reasoning_options) ? service.reasoning_options : [];
  const values = options.filter((option) => option.type === 'effort').flatMap((option) => option.values ?? []);
  const efforts = {};
  const unsupported = [];
  for (const value of values) {
    const level = value === 'none' ? 'off' : value;
    if (effortLevels.includes(level)) {
      efforts[level] = value;
    } else {
      unsupported.push(value);
    }
  }
  if (unsupported.length > 0) {
    warnings.push(`思考等级 ${[...new Set(unsupported)].join('、')} 没有明确映射，不推测档位。`);
  }
  if (!Object.keys(efforts).some((level) => level !== 'off')) {
    warnings.push('所选服务没有可填入的明确思考等级；开关或 token 预算不推导为等级。');
    return undefined;
  }
  return Object.fromEntries(effortLevels.filter((level) => owns(efforts, level)).map((level) => [level, efforts[level]]));
}

function validLocalEfforts(value) {
  if (value === false) {
    return true;
  }
  if (!recordOf(value) || Object.keys(value).length === 0) {
    return false;
  }
  return Object.keys(value).some((level) => level !== 'off') && Object.entries(value).every(([level, wire]) => effortLevels.includes(level) && ((level === 'off' && wire === null) || (typeof wire === 'string' && wire.length > 0)));
}

function localFieldState(model, field) {
  const value = model[field];
  if (!owns(model, field) || value === undefined) {
    return 'missing';
  }
  if (field === 'contextWindow' || field === 'maxTokens') {
    return Number.isSafeInteger(value) && value > 0 ? 'existing' : 'invalid';
  }
  if (field === 'input') {
    if (Array.isArray(value) && value.length === 0) {
      return 'missing';
    }
    return Array.isArray(value) && value.every((item) => item === 'text' || item === 'image') ? 'existing' : 'invalid';
  }
  return validLocalEfforts(value) ? 'existing' : 'invalid';
}

function sameValue(left, right) {
  if (left === right) {
    return true;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => sameValue(value, right[index]));
  }
  if (recordOf(left) && recordOf(right)) {
    const keys = Object.keys(left);
    return keys.length === Object.keys(right).length && keys.every((key) => owns(right, key) && sameValue(left[key], right[key]));
  }
  return false;
}

export function planModel(catalog, provider, model, relations = {}, mode, choices = {}) {
  if (mode !== 'missing' && mode !== 'overwrite') {
    throw new TypeError('填入模式必须为 missing 或 overwrite。');
  }
  const key = localKey(provider, model.id);
  let match = matchModel(catalog, provider, model, relations);
  if (match.rule !== 'manual' && owns(choices, key)) {
    const canonicalId = choices[key];
    match = owns(catalog.models, canonicalId)
      ? { status: 'matched', canonicalId, candidates: [canonicalId], rule: 'choice' }
      : { status: 'invalid', candidates: [], rule: 'choice', message: '本次选择的模型本体已失效。' };
  }
  const result = { id: model.id, name: model.name ?? model.id, match, source: { status: 'missing' }, changes: [], warnings: [], skipped: true };
  if (match.status !== 'matched') {
    result.warnings.push(match.message);
    return result;
  }
  const canonicalId = match.canonicalId;
  result.canonicalId = canonicalId;
  const source = resolveSource(catalog, canonicalId, relations);
  result.source = source;
  if (source.status === 'invalid') {
    result.warnings.push(source.message);
    return result;
  }
  if (source.status === 'missing') {
    result.warnings.push(source.message);
  }
  const service = catalog.services[source.serviceKey];
  const base = source.status === 'manual' ? service : catalog.models[canonicalId];
  const baseOrigin = source.status === 'manual' ? `api.json:${source.serviceKey}` : `models.json:${canonicalId}`;
  const contextWindow = base?.limit?.context;
  const maxTokens = base?.limit?.output;
  const proposed = {
    contextWindow: Number.isSafeInteger(contextWindow) && contextWindow > 0 ? contextWindow : undefined,
    maxTokens: Number.isSafeInteger(maxTokens) && maxTokens > 0 ? maxTokens : undefined,
    input: sourceInput(base, result.warnings),
    reasoningEfforts: sourceEfforts(service, result.warnings),
  };
  if (proposed.contextWindow === undefined) {
    result.warnings.push('所选基础来源没有有效上下文窗口，保留本地值。');
  }
  if (proposed.maxTokens === undefined) {
    result.warnings.push('所选来源未提供有效的最大输出 token 数，本次不填入该字段。');
  }
  for (const field of ['contextWindow', 'maxTokens', 'input', 'reasoningEfforts']) {
    const state = localFieldState(model, field);
    if (state === 'invalid') {
      const fieldLabel = field === 'maxTokens' ? '最大输出 token 数' : field;
      result.warnings.push(`本地 ${fieldLabel} 声明无效；${mode === 'missing' ? '自动填入不静默修复。' : '仅在所选来源提供明确值时覆盖，请核对差异。'}`);
      if (mode === 'missing') {
        continue;
      }
    }
    const after = proposed[field];
    if (after === undefined || (mode === 'missing' && state === 'existing')) {
      continue;
    }
    const before = model[field] === undefined ? null : model[field];
    if (sameValue(before, after)) {
      continue;
    }
    result.changes.push({ field, before, after, origin: field === 'reasoningEfforts' ? `api.json:${source.serviceKey}` : baseOrigin });
  }
  result.skipped = result.changes.length === 0;
  return result;
}

export function searchModels(catalog, query, limit = 80) {
  const text = folded(query ?? '');
  const normalized = normalizeModelName(query ?? '');
  const models = Object.values(catalog.models).filter((model) => text.length === 0 || folded(model.id).includes(text) || folded(model.name ?? '').includes(text) || normalizeModelName(model.id).includes(normalized) || normalizeModelName(model.name ?? '').includes(normalized));
  models.sort((left, right) => compareIds(left.id, right.id));
  return models.slice(0, Math.max(0, Math.floor(limit)));
}
