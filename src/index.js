import schema from '@deepseek-ai/schemastery';
import { z } from 'zod';
import { createApplication, relationsValue } from './application.js';
import { effortLevels } from './core.js';

const sourceTarget = schema.object({ provider: schema.string().required(), modelId: schema.string().required() });
const tokenCount = schema.number().step(1).min(1).max(Number.MAX_SAFE_INTEGER).required();
const effortMapping = schema.dict(schema.union([schema.string().min(1), schema.const(null)]), schema.union(effortLevels));
const customParameters = schema.object({
  contextWindow: tokenCount,
  maxTokens: tokenCount,
  input: schema.array(schema.union(['text', 'image']).required()).min(1).required(),
  reasoningEfforts: schema.union([schema.const(false), effortMapping]).required(),
}).required();
export const Config = schema.object({
  relations: schema.object({ bodies: schema.dict(schema.string()), sources: schema.dict(sourceTarget), custom: schema.dict(customParameters) }).default(relationsValue()).volatile(),
});
export const inject = ['settings', 'configEditor', 'storageDomain', 'webServer', 'connection'];

const ACTION_PATH = '/plugins/model-meta-fill/action';
const ACTIONS = ['status', 'refresh', 'catalog', 'relations', 'customTemplate', 'saveRelation', 'preview', 'apply'];

function validateRequest(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !ACTIONS.includes(value.action)) {
    throw Object.assign(new Error('请提供有效的操作。'), { code: 'INVALID_REQUEST' });
  }
  return value;
}

function send(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(value));
}

async function readBody(req) {
  const chunks = [];
  let byteLength = 0;
  for await (const chunk of req) {
    byteLength += chunk.length;
    if (byteLength > 262144) {
      throw Object.assign(new Error('操作请求过大。'), { code: 'REQUEST_TOO_LARGE' });
    }
    chunks.push(chunk);
  }
  try {
    return validateRequest(JSON.parse(Buffer.concat(chunks).toString('utf8')));
  } catch (error) {
    if (error.code) {
      throw error;
    }
    throw Object.assign(new Error('请求需要有效 JSON。'), { code: 'INVALID_REQUEST' });
  }
}

export async function apply(ctx, config) {
  const domain = await ctx.storageDomain.open({
    name: 'model_meta_fill',
    version: 1,
    layout: 'single',
    global: {
      schema: z.object({ cache: z.object({ models: z.record(z.string(), z.unknown()), api: z.record(z.string(), z.unknown()), updatedAt: z.string(), version: z.string() }).nullable() }),
      initial: { cache: null },
    },
    tables: {},
  });
  const entry = ctx.fiber.entry;
  const getRelations = () => config.relations.get();
  const description = () => ctx.settings.describe({ redactSecrets: true }).find(item => item.ns === 'llm-pi-ai' || String(item.ns).endsWith(':llm-pi-ai'));
  const conflicts = () => {
    return ctx.configEditor.entries().filter(item => item.options?.name === 'dsh-model-info-fill' && !item.options?.disabled).map(() => '检测到旧 dsh-model-info-fill 配置：它与本插件使用同一个供应商插槽，请停用或卸载旧插件。');
  };
  const application = createApplication({
    cache: domain.global.get().cache,
    readRelations: getRelations,
    async saveRelations(relations, expectedRevision) {
      if (!entry) {
        throw new Error('当前 profile 无法保存插件关系配置。');
      }
      await ctx.configEditor.edit(entry, current => {
        if (JSON.stringify(relationsValue(getRelations())) !== expectedRevision) {
          throw Object.assign(new Error('关系已被其他操作修改，请刷新后重试。'), { code: 'STALE_RELATIONS' });
        }
        return { ...current, relations };
      });
    },
    describeModels: description,
    mutateModels: (ns, operations, revision) => ctx.settings.mutate(ns, operations, revision),
    conflicts,
    async fetchJson(url) {
      const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(60000) });
      if (!response.ok) {
        throw new Error(`资料下载失败：HTTP ${response.status}（${url}）`);
      }
      return response.json();
    },
    writeCache: cache => domain.global.set({ cache }),
  });
  ctx.effect(() => async () => {
    await application.dispose();
    await domain.close();
  });
  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: ACTION_PATH,
    async handler(req, res) {
      const rejection = ctx.connection.requestRejection({ headers: req.headers });
      if (rejection) {
        send(res, rejection, { ok: false, error: { code: 'ACCESS_DENIED', message: '请从已登录的 DSH 页面操作。' } });
        return;
      }
      if (req.method !== 'POST' || req.headers['x-dsh-model-meta'] !== '1' || !req.headers['content-type']?.startsWith('application/json')) {
        send(res, 400, { ok: false, error: { code: 'INVALID_REQUEST', message: '操作需要带标识的 JSON POST 请求。' } });
        return;
      }
      try {
        const value = await application.execute(await readBody(req));
        send(res, 200, { ok: true, value });
      } catch (error) {
        send(res, 400, { ok: false, error: { code: error.code || 'ACTION_FAILED', message: error.message } });
      }
    },
  }));
  void application.start().catch(error => {
    ctx.logger.warn('模型资料刷新失败，保留已有缓存：%s', error.message);
  });
}
