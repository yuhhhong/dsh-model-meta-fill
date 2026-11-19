import { randomUUID } from 'node:crypto';
import { buildCatalog, localKey, matchModel, planModel, resolveSource, searchModels } from './core.js';

const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const PREVIEW_MAX_AGE = 30 * 60 * 1000;
const MODES = new Set(['missing', 'overwrite']);

export class ApplicationError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function reject(code, message) {
  throw new ApplicationError(code, message);
}

function copy(value) {
  return structuredClone(value);
}

function relationsValue(value) {
  return { bodies: { ...(value?.bodies ?? {}) }, sources: { ...(value?.sources ?? {}) } };
}

// 本对象只暴露模型字段，绝不将供应商凭据或自定义请求头传给客户端。
function localModel(model) {
  return { id: model.id, name: model.name, contextWindow: model.contextWindow, maxTokens: model.maxTokens, input: model.input, reasoningEfforts: model.reasoningEfforts };
}

export function createApplication(adapters) {
  let cache = adapters.cache ?? null;
  let catalog = cache ? buildCatalog(cache.models, cache.api) : null;
  let refreshing = null;
  let refreshError = null;
  let relationQueue = Promise.resolve();
  let disposed = false;
  const previews = new Map();
  const now = adapters.now ?? Date.now;

  function relations() {
    return relationsValue(adapters.readRelations());
  }

  function revision() {
    return JSON.stringify(relations());
  }

  function descriptor() {
    const value = adapters.describeModels();
    if (!value) {
      reject('MODELS_UNAVAILABLE', '当前配置中没有可编辑的 llm-pi-ai 模型列表。');
    }
    return value;
  }

  function providerOf(description, provider) {
    const profile = description.value?.providers?.[provider];
    if (!profile || !Array.isArray(profile.models) || profile.models.length === 0) {
      reject('NO_EXPLICIT_MODELS', '该供应商没有显式配置的模型列表，首版不修改自动目录。');
    }
    return profile;
  }

  function ready() {
    if (!catalog) {
      reject('CATALOG_UNAVAILABLE', '尚无可用资料，请先刷新模型资料。');
    }
  }

  function status() {
    const description = adapters.describeModels();
    const providers = Object.entries(description?.value?.providers ?? {}).flatMap(([id, profile]) => {
      if (!Array.isArray(profile.models) || profile.models.length === 0) {
        return [];
      }
      return [{ id, name: profile.displayName || id, count: profile.models.length }];
    });
    const current = relations();
    return {
      cache: { ready: catalog !== null, updatedAt: cache?.updatedAt ?? null, refreshing: refreshing !== null, error: refreshError, version: cache?.version ?? null },
      relationsRevision: revision(),
      relationCounts: { bodies: Object.keys(current.bodies).length, sources: Object.keys(current.sources).length },
      providers,
      conflicts: adapters.conflicts(),
    };
  }

  async function refresh() {
    if (refreshing) {
      return refreshing;
    }
    refreshing = (async () => {
      try {
        const [models, api] = await Promise.all([
          adapters.fetchJson('https://models.dev/models.json'),
          adapters.fetchJson('https://models.dev/api.json'),
        ]);
        if (!models || typeof models !== 'object' || Array.isArray(models) || Object.keys(models).length === 0 || !api || typeof api !== 'object' || Array.isArray(api) || Object.keys(api).length === 0) {
          reject('INVALID_CATALOG', '资料接口返回了空目录或未知结构，已保留原有缓存。');
        }
        const nextCatalog = buildCatalog(models, api);
        if (Object.keys(nextCatalog.models).length === 0) {
          reject('INVALID_CATALOG', '资料中没有有效模型，已保留原有缓存。');
        }
        if (disposed) {
          reject('DISPOSED', '插件已停止，未保存刷新结果。');
        }
        const next = { models, api, updatedAt: new Date(now()).toISOString(), version: randomUUID() };
        await adapters.writeCache(next);
        cache = next;
        catalog = nextCatalog;
        refreshError = null;
      } catch (error) {
        refreshError = error.message;
        throw error;
      } finally {
        refreshing = null;
      }
      return status();
    })();
    return refreshing;
  }

  function catalogView(request) {
    ready();
    let detail = null;
    if (request.canonicalId) {
      const model = catalog.models[request.canonicalId];
      if (!model) {
        reject('MODEL_NOT_FOUND', '模型本体不在当前目录中。');
      }
      const current = relations();
      detail = {
        model,
        candidates: (catalog.candidates[model.id] ?? []).map(key => catalog.services[key]),
        automatic: catalog.automatic[model.id] ?? null,
        manual: current.sources[model.id] ?? null,
        sourceStatus: resolveSource(catalog, model.id, current),
      };
    }
    return { models: searchModels(catalog, String(request.query ?? ''), 100), detail, relationsRevision: revision() };
  }

  function relationView() {
    const current = relations();
    const description = adapters.describeModels();
    const locals = Object.entries(description?.value?.providers ?? {}).flatMap(([provider, profile]) => {
      return (profile.models ?? []).map(model => {
        const match = catalog ? matchModel(catalog, provider, model, current) : { status: 'unmatched' };
        return { provider, id: model.id, name: model.name || model.id, canonicalId: match.canonicalId, status: match.status };
      });
    });
    const sourceStatuses = catalog ? Object.fromEntries(Object.keys(current.sources).map(id => [id, resolveSource(catalog, id, current).status])) : null;
    return { relations: current, relationsRevision: revision(), locals, sourceStatuses };
  }

  function saveRelation(request) {
    const operation = relationQueue.then(async () => {
      if (request.target !== null) {
        ready();
      }
      if (request.expectedRevision !== revision()) {
        reject('STALE_RELATIONS', '关系已经被修改，请刷新关系管理后重试。');
      }
      if (!['body', 'source'].includes(request.kind) || typeof request.key !== 'string' || !request.key) {
        reject('INVALID_RELATION', '关系类型或标识无效。');
      }
      const current = relations();
      const collection = request.kind === 'body' ? current.bodies : current.sources;
      if (request.target === null) {
        delete collection[request.key];
      } else if (request.kind === 'body') {
        let identity;
        try {
          identity = JSON.parse(request.key);
        } catch {
          reject('INVALID_RELATION', '本体映射需要本地供应商和原始模型 ID。');
        }
        if (!Array.isArray(identity) || identity.length !== 2 || identity.some(value => typeof value !== 'string' || !value)) {
          reject('INVALID_RELATION', '本体映射标识无效。');
        }
        const local = providerOf(descriptor(), identity[0]).models.some(model => model.id === identity[1]);
        if (!local || typeof request.target !== 'string' || !catalog.models[request.target]) {
          reject('INVALID_RELATION', '本地模型或目标模型本体已不存在。');
        }
        collection[localKey(identity[0], identity[1])] = request.target;
      } else {
        const target = request.target;
        if (!target || typeof target.provider !== 'string' || typeof target.modelId !== 'string') {
          reject('INVALID_RELATION', '请选择具体供应商模型记录。');
        }
        const service = catalog.services[JSON.stringify([target.provider, target.modelId])];
        if (!catalog.models[request.key] || service?.canonicalId !== request.key) {
          reject('INVALID_RELATION', '该服务记录没有关联到当前模型本体。');
        }
        collection[request.key] = { provider: target.provider, modelId: target.modelId };
      }
      await adapters.saveRelations(current, request.expectedRevision);
      return { relationsRevision: revision() };
    });
    relationQueue = operation.catch(() => {});
    return operation;
  }

  function preview(request) {
    ready();
    if (!MODES.has(request.mode) || typeof request.provider !== 'string') {
      reject('INVALID_PREVIEW', '请选择供应商以及自动填入或覆盖填入模式。');
    }
    const description = descriptor();
    const profile = providerOf(description, request.provider);
    const current = relations();
    const rows = profile.models.map(model => {
      const row = planModel(catalog, request.provider, localModel(model), current, request.mode, request.choices ?? {});
      // Gemini 只接受自己的四个等级及同名值，不能把 OpenAI 等级硬套到该协议。
      if (profile.api === 'google-generative-ai') {
        const change = row.changes.find(item => item.field === 'reasoningEfforts' && item.after !== false);
        if (change && Object.entries(change.after).some(([level, value]) => !['minimal', 'low', 'medium', 'high'].includes(level) || value !== level)) {
          row.changes = row.changes.filter(item => item !== change);
          row.warnings.push('当前 Gemini 协议无法表达来源的全部思考等级，已跳过该字段。');
          row.skipped = row.changes.length === 0;
        }
      }
      return row;
    });
    for (const [key, value] of previews) {
      if (value.expiresAt <= now()) {
        previews.delete(key);
      }
    }
    const token = randomUUID();
    const fieldCount = rows.reduce((sum, row) => sum + row.changes.length, 0);
    const value = { token, provider: request.provider, mode: request.mode, cacheVersion: cache.version, relationsRevision: revision(), rows, fieldCount };
    previews.set(token, { value: copy(value), ns: description.ns, settingsRevision: description.revision, expiresAt: now() + PREVIEW_MAX_AGE });
    return value;
  }

  async function applyPreview(request) {
    const saved = previews.get(request.token);
    if (!saved || saved.expiresAt <= now()) {
      reject('STALE_PREVIEW', '预览已失效，请重新生成差异并确认。');
    }
    previews.delete(request.token);
    const description = descriptor();
    if (description.ns !== saved.ns || description.revision !== saved.settingsRevision || revision() !== saved.value.relationsRevision) {
      reject('STALE_PREVIEW', '模型配置或人工关系已经改变，请更新预览后重新确认。');
    }
    if (!saved.value.fieldCount) {
      reject('NO_CHANGES', '没有可填入的字段。');
    }
    const profile = providerOf(description, saved.value.provider);
    const operations = [];
    let modelCount = 0;
    saved.value.rows.forEach((row, index) => {
      if (row.id !== profile.models[index]?.id) {
        reject('STALE_PREVIEW', '模型列表已改变，请重新生成预览。');
      }
      if (row.changes.length) {
        modelCount += 1;
      }
      for (const change of row.changes) {
        operations.push({ op: 'set', path: ['providers', saved.value.provider, 'models', String(index), change.field], value: copy(change.after) });
      }
    });
    try {
      await adapters.mutateModels(saved.ns, operations, saved.settingsRevision);
    } catch (error) {
      if (/conflict/i.test(String(error.code)) || /conflict/i.test(error.message)) {
        reject('STALE_PREVIEW', '模型配置已经被其他操作修改，请重新预览后确认。');
      }
      throw error;
    }
    return { models: modelCount, fields: saved.value.fieldCount };
  }

  return {
    status,
    async start() {
      if (!cache || now() - Date.parse(cache.updatedAt) > CACHE_MAX_AGE) {
        await refresh();
      }
    },
    async execute(request) {
      if (disposed) {
        reject('DISPOSED', '插件已停止。');
      }
      switch (request.action) {
        case 'status': return status();
        case 'refresh': return refresh();
        case 'catalog': return catalogView(request);
        case 'relations': return relationView();
        case 'saveRelation': return saveRelation(request);
        case 'preview': return preview(request);
        case 'apply': {
          const operation = relationQueue.then(() => applyPreview(request));
          relationQueue = operation.catch(() => {});
          return operation;
        }
        default: return reject('UNKNOWN_ACTION', '未知操作。');
      }
    },
    async dispose() {
      disposed = true;
      previews.clear();
      await relationQueue;
      if (refreshing) {
        await refreshing.catch(() => {});
      }
    },
  };
}
