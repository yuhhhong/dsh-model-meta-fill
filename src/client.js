window.__ModuleLoader__.load({
  id: 'dsh-model-meta-fill',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore } = React;
    const namespace = 'model-meta-fill';
    const dictionaries = {
      zh: {
        modelTab: '模型映射', sourceTab: '来源映射', addBody: '新增模型映射', editBody: '编辑模型映射', addSource: '新增来源映射', editSource: '编辑来源映射', edit: '编辑', listBack: '返回关系列表', deferSource: '暂不指定', emptyBodies: '还没有保存的模型映射。自动匹配不会列在这里。', emptySources: '还没有保存的来源映射。自动推断的来源不会列在这里。', localGone: '本地模型已不存在，只能移除这条映射。', canonicalGone: '该模型已不在 models.dev 目录中。', unverified: '资料不可用，暂无法校验', chooseSourceNext: '模型映射已保存。没有可用的默认来源，你可以指定一条服务记录，也可以暂不指定。', noSourceToChoose: '没有关联的服务记录。仍可填入模型本体提供的基础资料，暂不能填入思考等级。', noSourceToRepair: '没有可替换的服务记录。失效的来源映射仍会阻止填入；可在「来源映射」中移除它。',
        maxTokens: '最大输出 token 数',
        reasoningToggle: '支持开关', reasoningBudget: 'Token 预算', budgetMin: '最少', budgetMax: '最多',
        reloadAfterSave: '映射已保存，但刷新失败。无需再次保存。', reloadAfterRemove: '映射已移除，但刷新失败。无需再次移除。',
        reopenMappings: '请关闭窗口后重新进入关系管理。',
        reopenPreview: '请关闭窗口，再从此供应商卡片重新打开填入预览。',
        title: '模型元数据填入', missing: '自动填入', overwrite: '覆盖填入', manage: '关系管理', refresh: '刷新资料', retry: '重试', close: '关闭', back: '返回填入预览', loading: '正在加载…', working: '处理中…', ready: '资料已就绪', noCache: '暂无可用资料，请先刷新', updated: '资料更新时间', unknown: '未知', preview: '填入预览', confirm: '确认填入', noChanges: '没有可填入的字段', changes: '待填字段', models: '模型', fields: '字段', before: '当前值', after: '填入值', origin: '资料来源', absent: '未配置', none: '无', automatic: '自动推断', manual: '人工指定', invalid: '人工关系失效', missingSource: '无自动来源', matched: '已匹配', ambiguous: '本体有歧义，需指定', unmatched: '未匹配，需指定', skipped: '本次跳过', unchanged: '保留现有配置或没有可用资料', source: '服务来源', body: '模型本体', local: '本地模型', localSearch: '筛选本地模型', modelSearch: '搜索模型 ID、名称或研发方', serviceSearch: '筛选关联供应商或服务模型 ID', pickLocal: '选择本地模型', pickBody: '选择模型本体', bodyMapping: '本地模型 → 模型本体', sourceMapping: '模型本体 → 服务记录', saveBody: '保存本体映射', removeBody: '移除本体映射', saveSource: '保存来源映射', removeSource: '移除来源映射，恢复自动', saved: '关系已保存；未写入模型配置', deleted: '关系已移除；未写入模型配置', previewUpdated: '关系已保存并重新生成填入预览，请返回预览确认', useOnce: '仅本次选择', onceHelp: '仅本次选择只更新预览，不保存关系。保存关系请进入关系管理。', shared: '服务来源映射由整个模型本体共享：所有匹配到此本体的本地模型，四项元数据都会采用该服务记录。保存关系不会自动填入。', separate: '两类映射分别保存、分别移除。仅保存本体映射不会将服务来源改成人工指定。', currentBody: '已保存的本体映射', currentSource: '已保存的来源映射', effectiveSource: '当前来源状态', bodyMetadata: '模型本体资料', serviceMetadata: '关联服务资料', contextWindow: '上下文窗口', input: '输入类型', reasoningEfforts: '思考等级', reasoning: '思考控制', noResults: '没有匹配结果', noServices: '没有关联的服务记录；自动路径仍可填本体基础资料', selectService: '选择一条服务记录', inferred: '名称推断并非官方认证', exact: '完整匹配', prefix: '前缀匹配', unrecognized: '未推断归属', automaticDefault: '自动默认', selected: '已指定', choose: '查看 / 选择', manageRow: '指定 / 管理关系', conflict: '检测到已知插件冲突', failure: '操作失败', stale: '当前预览已失效。', applied: '填入完成', missingHelp: '按字段补缺失；已有声明会保留。', overwriteHelp: '允许覆盖已有值；来源缺少的字段不清空。', countBodies: '本体映射', countSources: '来源映射', raw: '详情', selectBodyHelp: '先选择模型本体，再比较具体服务来源。', currentInvalid: '当前人工目标不存在或不再关联本体，请重新指定或移除。', relationsError: '保存前请重新加载关系，避免覆盖其他修改。', text: '文本', image: '图片', noReasoning: '明确不支持思考', supportedReasoning: '支持思考，未列出等级', noSelection: '尚未选择', removeOnce: '清除本次选择', relationSavedNoApply: '保存关系不是确认填入；写入仍需返回差异预览。', refreshFailed: '资料刷新失败，已有缓存仍可使用', requestFailed: '请求未成功', manualBody: '人工本体映射', autoBody: '自动本体匹配', status: '状态', searchLimited: '搜索结果已限量，请输入关键词缩小范围。', focusBody: '在模型目录中查找'
      },
      en: {
        modelTab: 'Model mappings', sourceTab: 'Source mappings', addBody: 'Add model mapping', editBody: 'Edit model mapping', addSource: 'Add source mapping', editSource: 'Edit source mapping', edit: 'Edit', listBack: 'Back to mappings', deferSource: 'Not now', emptyBodies: 'No saved model mappings. Automatic matches are not listed here.', emptySources: 'No saved source mappings. Automatically inferred sources are not listed here.', localGone: 'The local model no longer exists. This mapping can only be removed.', canonicalGone: 'This model is no longer in the models.dev catalog.', unverified: 'Catalog unavailable; validity not checked', chooseSourceNext: 'Model mapping saved. There is no usable default source. Choose a service record or skip this step.', noSourceToChoose: 'No linked service records. Basic metadata can still come from the canonical model, but reasoning levels cannot be filled.', noSourceToRepair: 'No replacement service records. The invalid source mapping still blocks fill. You can remove it under Source mappings.',
        maxTokens: 'Maximum output tokens',
        reasoningToggle: 'Supports toggle', reasoningBudget: 'Token budget', budgetMin: 'min', budgetMax: 'max',
        reloadAfterSave: 'Mapping saved, but the view did not refresh. Do not save again.', reloadAfterRemove: 'Mapping removed, but the view did not refresh. Do not remove it again.',
        reopenMappings: 'Close this window and reopen Manage relations.',
        reopenPreview: 'Close this window, then reopen the fill preview from this provider card.',
        title: 'Model metadata fill', missing: 'Fill missing', overwrite: 'Overwrite', manage: 'Manage relations', refresh: 'Refresh catalog', retry: 'Retry', close: 'Close', back: 'Back to preview', loading: 'Loading…', working: 'Working…', ready: 'Catalog ready', noCache: 'No catalog available. Refresh first.', updated: 'Catalog updated', unknown: 'Unknown', preview: 'Fill preview', confirm: 'Confirm fill', noChanges: 'No fields to fill', changes: 'Fields to fill', models: 'Models', fields: 'Fields', before: 'Current value', after: 'Proposed value', origin: 'Metadata origin', absent: 'Not configured', none: 'None', automatic: 'Automatically inferred', manual: 'Manually selected', invalid: 'Invalid manual relation', missingSource: 'No automatic source', matched: 'Matched', ambiguous: 'Ambiguous model; choose one', unmatched: 'Unmatched; choose a model', skipped: 'Skipped this time', unchanged: 'Existing settings preserved or metadata unavailable', source: 'Service source', body: 'Canonical model', local: 'Local model', localSearch: 'Filter local models', modelSearch: 'Search model ID, name or lab', serviceSearch: 'Filter provider or service model ID', pickLocal: 'Select local model', pickBody: 'Select canonical model', bodyMapping: 'Local model → canonical model', sourceMapping: 'Canonical model → service record', saveBody: 'Save model mapping', removeBody: 'Remove model mapping', saveSource: 'Save source mapping', removeSource: 'Remove source mapping; use automatic', saved: 'Relation saved; model settings unchanged', deleted: 'Relation removed; model settings unchanged', previewUpdated: 'Relation saved and preview rebuilt. Return to review it.', useOnce: 'Use this time only', onceHelp: 'A one-time choice only updates this preview. Use relation management to save a mapping.', shared: 'Source mappings are shared by the entire canonical model: all local models matching it use this service record for all four metadata fields. Saving does not fill model settings.', separate: 'The two mapping types are saved and removed independently. Saving a model mapping does not make its service source manual.', currentBody: 'Saved model mapping', currentSource: 'Saved source mapping', effectiveSource: 'Current source status', bodyMetadata: 'Canonical model metadata', serviceMetadata: 'Linked service metadata', contextWindow: 'Context window', input: 'Input types', reasoningEfforts: 'Reasoning levels', reasoning: 'Reasoning controls', noResults: 'No matching results', noServices: 'No linked service records. The automatic path can still fill base model metadata.', selectService: 'Select a service record', inferred: 'Name inference is not official certification', exact: 'Exact match', prefix: 'Prefix match', unrecognized: 'No inferred affiliation', automaticDefault: 'Automatic default', selected: 'Selected', choose: 'Inspect / select', manageRow: 'Choose / manage relations', conflict: 'Known plugin conflict detected', failure: 'Operation failed', stale: 'This preview is no longer valid.', applied: 'Fill completed', missingHelp: 'Fill missing fields only; existing declarations are preserved.', overwriteHelp: 'Replace existing values; missing source fields are not cleared.', countBodies: 'Model mappings', countSources: 'Source mappings', raw: 'Details', selectBodyHelp: 'Choose a canonical model, then compare its service sources.', currentInvalid: 'The manual target is missing or no longer linked. Choose another or remove the mapping.', relationsError: 'Reload relations before saving to avoid overwriting changes.', text: 'Text', image: 'Image', noReasoning: 'Explicitly does not support reasoning', supportedReasoning: 'Supports reasoning; no levels listed', noSelection: 'Nothing selected', removeOnce: 'Clear one-time choice', relationSavedNoApply: 'Saving a relation does not confirm filling. Return to the diff preview to apply.', refreshFailed: 'Refresh failed; the previous catalog remains usable', requestFailed: 'Request failed', manualBody: 'Manual model mapping', autoBody: 'Automatic model match', status: 'Status', searchLimited: 'Results are limited. Enter a query to narrow them.', focusBody: 'Find in model catalog'
      }
    };
    const css = `
.mmf-root{font:inherit;color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.5}.mmf-root *{box-sizing:border-box}.mmf-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.mmf-btn{font:inherit;border:1px solid var(--dsw-alias-border-l3);border-radius:9px;background:var(--dsw-alias-button-elevated-fill);color:var(--dsw-alias-label-primary);padding:7px 12px;cursor:pointer}.mmf-btn:hover:not(:disabled){background:var(--dsw-alias-button-floating-hover)}.mmf-btn:disabled{opacity:.5;cursor:not-allowed}.mmf-btn:focus-visible,.mmf-root input:focus-visible,.mmf-root select:focus-visible{outline:2px solid var(--dsw-alias-border-selected);outline-offset:2px}.mmf-primary{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-inverted)}.mmf-btn.mmf-primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}.mmf-footer{padding:16px 0;border-top:1px solid var(--dsw-alias-border-l2);margin-top:16px}.mmf-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.mmf-title{font-size:15px;font-weight:600;margin:0}.mmf-muted{color:var(--dsw-alias-label-tertiary);font-size:12px}.mmf-note{margin:10px 0;white-space:pre-wrap;overflow-wrap:anywhere}.mmf-alert{padding:10px 12px;border:1px solid var(--dsw-alias-border-l4);border-radius:9px;background:var(--dsw-alias-bg-module-platform);margin:10px 0;overflow-wrap:anywhere}.mmf-dialog{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l3);border-radius:16px;width:min(1000px,calc(100vw - 32px));max-height:calc(100dvh - 40px);padding:0;overflow:hidden}.mmf-dialog::backdrop{background:var(--dsw-alias-bg-mask-1)}.mmf-dialog-shell{display:flex;flex-direction:column;max-height:calc(100dvh - 42px)}.mmf-dialog-head,.mmf-dialog-foot{padding:16px 20px;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;gap:10px;border-bottom:1px solid var(--dsw-alias-border-l2)}.mmf-dialog-foot{border-bottom:0;border-top:1px solid var(--dsw-alias-border-l2);flex-wrap:wrap}.mmf-dialog-body{padding:16px 20px;overflow:auto;min-height:160px}.mmf-row{border:1px solid var(--dsw-alias-border-l2);border-radius:10px;padding:12px;margin:10px 0}.mmf-row h3{font-size:13px;margin:0 0 5px}.mmf-id{font-family:ui-monospace,monospace;overflow-wrap:anywhere;font-size:12px}.mmf-tag{display:inline-block;padding:2px 7px;border-radius:6px;background:var(--dsw-alias-bg-module-platform);font-size:11px;margin:3px 5px 3px 0}.mmf-diff{display:grid;grid-template-columns:130px minmax(0,1fr) 20px minmax(0,1fr);gap:8px;padding:9px 0;border-bottom:1px solid var(--dsw-alias-border-l1);align-items:start}.mmf-value{white-space:pre-wrap;overflow-wrap:anywhere;margin:0;font:12px/1.5 ui-monospace,monospace}.mmf-origin{grid-column:2/-1}.mmf-input{width:100%;font:inherit;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l3);border-radius:8px;padding:8px 10px;min-width:0}.mmf-label{display:block;font-size:12px;font-weight:600;margin:10px 0 5px}.mmf-item:hover,.mmf-meta{display:grid;grid-template-columns:110px minmax(0,1fr);gap:6px;margin:8px 0}.mmf-meta dt{color:var(--dsw-alias-label-tertiary)}.mmf-meta dd{margin:0;overflow-wrap:anywhere}.mmf-root summary{cursor:pointer}.mmf-break{overflow-wrap:anywhere}@media(max-width:680px){.mmf-diff{grid-template-columns:1fr 20px 1fr}.mmf-diff>strong{grid-column:1/-1}.mmf-origin{grid-column:1/-1}.mmf-dialog-head,.mmf-dialog-foot,.mmf-dialog-body{padding:12px}}
.mmf-dialog-foot>.mmf-btn{margin-inline-start:auto}
.mmf-tabs{display:flex;gap:12px;border-bottom:1px solid var(--dsw-alias-border-l2)}.mmf-tabs .mmf-btn{border:0;border-bottom:2px solid transparent;border-radius:0;background:none;color:var(--dsw-alias-label-secondary)}.mmf-tabs .mmf-btn[aria-selected=true]{color:var(--dsw-alias-label-primary);border-bottom-color:var(--dsw-alias-border-selected)}.mmf-mappings{list-style:none;margin:0;padding:0}.mmf-mapping-row{display:flex;align-items:center;justify-content:space-between;gap:12px}.mmf-mapping-row>div:first-child{min-width:0}.mmf-row-actions{justify-content:flex-end;flex-shrink:0;max-width:60%}
.mmf-combo{margin:10px 0}.mmf-combo-field{position:relative}.mmf-combo-field>.mmf-input{padding-inline-end:36px}.mmf-combo-toggle{position:absolute;inset-inline-end:1px;inset-block:1px;width:34px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}.mmf-combo-popup{position:fixed;inset:auto;margin:0;padding:0;overflow:auto;color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l3);border-radius:8px;background:var(--dsw-alias-bg-layer-1)}.mmf-combo-popup ul{list-style:none;padding:0;margin:0}.mmf-combo-popup li,.mmf-combo-status{padding:8px 10px;overflow-wrap:anywhere}.mmf-combo-popup li{cursor:pointer}.mmf-combo-popup li:not([aria-disabled=true]):is(:hover,[data-active=true]){background:var(--dsw-alias-button-floating-hover)}.mmf-combo-popup li[aria-selected=true]{box-shadow:inset 2px 0 var(--dsw-alias-border-selected)}.mmf-combo-popup li[aria-disabled=true]{color:var(--dsw-alias-label-tertiary);cursor:not-allowed}
`;

    function localKey(provider, id) {
      return JSON.stringify([provider, id]);
    }

    function serviceKey(service) {
      return service.key || JSON.stringify([service.provider, service.modelId]);
    }

    function localLabel(local) {
      const identity = `${local.provider} / ${local.id}`;
      return local.name && local.name !== local.id ? `${local.name} · ${identity}` : identity;
    }

    function serviceLabel(service) {
      const provider = service.providerName && service.providerName !== service.provider ? `${service.providerName} (${service.provider})` : service.provider;
      return `${provider} / ${service.modelId}`;
    }

    function usableSource(detail) {
      return ['automatic', 'manual'].includes(detail.sourceStatus.status);
    }

    function sourceUnavailable(detail) {
      return detail.sourceStatus.status === 'invalid' ? 'noSourceToRepair' : 'noSourceToChoose';
    }

    // 供应商按钮与页脚共享状态，所有业务操作只走同一 Host API。
    function createController() {
      let snapshot = { status: null, statusError: '', busy: false, error: '', notice: '', dialog: null };
      const listeners = new Set();
      const requests = new Set();
      let alive = true;
      let statusPromise = null;
      let generation = 0;
      const controller = {
        getSnapshot: () => snapshot,
        subscribe(listener) {
          listeners.add(listener);
          return () => { listeners.delete(listener); };
        },
        update(patch) {
          if (!alive) { 
            return; 
          }
          snapshot = { ...snapshot, ...patch };
          for (const listener of listeners) { 
            listener(); 
          }
        },
        async api(action, params = {}) {
          const abort = new AbortController();
          requests.add(abort);
          try {
            const response = await fetch('/plugins/model-meta-fill/action', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-DSH-Model-Meta': '1' }, body: JSON.stringify({ action, ...params }), signal: abort.signal });
            const payload = await response.json();
            if (!response.ok || !payload.ok) {
              const error = new Error(payload.error?.message || `HTTP ${response.status}`);
              error.code = payload.error?.code || 'REQUEST_FAILED';
              throw error;
            }
            return payload.value;
          } finally {
            requests.delete(abort);
          }
        },
        async loadStatus(force = false) {
          if (statusPromise) { 
            return statusPromise; 
          }
          if (snapshot.status && !force) { 
            return snapshot.status; 
          }
          statusPromise = controller.api('status').then(value => {
            controller.update({ status: value, statusError: '' });
            return value;
          }).catch(error => {
            if (error.name !== 'AbortError') { 
              controller.update({ statusError: error.message }); 
            }
            return null;
          }).finally(() => { statusPromise = null; });
          return statusPromise;
        },
        async refresh() {
          controller.update({ busy: true, error: '', notice: '' });
          try {
            const value = await controller.api('refresh');
            controller.update({ status: value, statusError: '' });
          } catch (error) {
            controller.update({ error: error.message });
            await controller.loadStatus(true);
          } finally {
            controller.update({ busy: false });
          }
        },
        async openPreview(provider, mode) {
          generation += 1;
          const current = generation;
          controller.update({ error: '', notice: '', busy: true, dialog: { view: 'preview', provider, mode, choices: {}, preview: null, stale: false } });
          try {
            const preview = await controller.api('preview', { provider, mode, choices: {} });
            if (generation === current) { 
              controller.update({ dialog: { ...snapshot.dialog, preview } }); 
            }
          } catch (error) {
            if (generation === current) { 
              controller.update({ error: error.message }); 
            }
          } finally {
            if (generation === current) { 
              controller.update({ busy: false }); 
            }
          }
        },
        async rebuild(choices) {
          const dialog = snapshot.dialog;
          if (!dialog?.provider) { 
            return; 
          }
          const nextChoices = choices || dialog.choices;
          controller.update({ busy: true, error: '', dialog: { ...dialog, choices: nextChoices, stale: true } });
          try {
            const preview = await controller.api('preview', { provider: dialog.provider, mode: dialog.mode, choices: nextChoices });
            controller.update({ dialog: { ...snapshot.dialog, choices: nextChoices, preview, stale: false } });
          } catch (error) {
            controller.update({ error: error.message });
          } finally {
            controller.update({ busy: false });
          }
        },
        patchDialog(patch) {
          controller.update({ dialog: { ...snapshot.dialog, ...patch } });
        },
        async readRelations() {
          const relationsData = await controller.api('relations');
          const { preview, stale } = snapshot.dialog;
          controller.patchDialog({ relationsData, stale: stale || Boolean(preview && relationsData.relationsRevision !== preview.relationsRevision) });
          return relationsData;
        },
        async loadCanonical(canonicalId) {
          controller.patchDialog({ canonicalId, detail: null, canonicalProblem: '', selectedService: '' });
          if (!canonicalId) {
            return;
          }
          try {
            const { detail } = await controller.api('catalog', { canonicalId });
            controller.patchDialog({ detail, selectedService: detail.manual ? serviceKey(detail.manual) : '' });
          } catch (error) {
            if (error.code === 'MODEL_NOT_FOUND' || error.code === 'CATALOG_UNAVAILABLE') {
              controller.patchDialog({ canonicalProblem: error.code === 'MODEL_NOT_FOUND' ? 'canonicalGone' : 'unverified' });
              return;
            }
            throw error;
          }
        },
        async manage(task) {
          controller.update({ busy: true, error: '', notice: '' });
          try {
            await task();
          } catch (error) {
            controller.update({ error: error.code === 'STALE_RELATIONS' ? error.code : error.message });
          } finally {
            controller.update({ busy: false });
          }
        },
        openManager(local) {
          controller.patchDialog({ view: 'relations', tab: 'body', editor: null, focusKey: '', relationsData: null, contextLocal: local });
          return controller.manage(async () => {
            await controller.readRelations();
            if (!local) {
              return;
            }
            await controller.loadContextBody();
            const { detail, canonicalId } = snapshot.dialog;
            if (detail && !usableSource(detail)) {
              if (detail.candidates.length || detail.sourceStatus.status === 'invalid') {
                controller.patchDialog({ tab: 'source', editor: { kind: 'source', key: canonicalId, contextual: true } });
              } else {
                controller.update({ notice: sourceUnavailable(detail) });
              }
            }
          });
        },
        async loadContextBody() {
          const { contextLocal, relationsData, choices } = snapshot.dialog;
          const { locals, relations } = relationsData;
          const key = localKey(contextLocal.provider, contextLocal.id);
          const local = locals.find(item => localKey(item.provider, item.id) === key);
          const canonicalId = relations.bodies[key] || (local && (choices[key] || local.canonicalId)) || '';
          controller.patchDialog({ tab: 'body', editor: { kind: 'body', key, label: localLabel(local || contextLocal), contextual: true }, selectedLocalKey: key, contextCanonicalId: canonicalId });
          await controller.loadCanonical(canonicalId);
        },
        openEditor(kind, key = '', label = '', fromBody = '') {
          const { relationsData } = snapshot.dialog;
          controller.patchDialog({ tab: kind, editor: { kind, key, label, fromBody }, selectedLocalKey: kind === 'body' ? key : '', focusKey: '' });
          return controller.manage(() => controller.loadCanonical(kind === 'body' ? relationsData.relations.bodies[key] || '' : key));
        },
        chooseLocal(key) {
          const { locals, relations } = snapshot.dialog.relationsData;
          const local = locals.find(item => localKey(item.provider, item.id) === key);
          controller.patchDialog({ selectedLocalKey: key });
          return controller.chooseCanonical(relations.bodies[key] || local?.canonicalId || '');
        },
        chooseCanonical(id) {
          return controller.manage(() => controller.loadCanonical(id));
        },
        showMappings(tab, focusKey = null, focusSource = false) {
          controller.patchDialog({ tab, focusKey, focusSource, editor: null });
        },
        async refreshMappingsCatalog() {
          await controller.refresh();
          if (!snapshot.error) {
            await controller.manage(() => controller.readRelations());
          }
        },
        adjustContext(kind) {
          if (kind === 'body') {
            return controller.manage(() => controller.loadContextBody());
          }
          const { canonicalId } = snapshot.dialog;
          controller.update({ error: '', notice: '' });
          controller.patchDialog({ tab: 'source', editor: { kind: 'source', key: canonicalId, contextual: true } });
        },
        leaveEditor() {
          const { editor } = snapshot.dialog;
          controller.update({ error: '', notice: editor.afterBody ? 'saved' : '' });
          const bodyKey = editor.afterBody || editor.fromBody;
          controller.showMappings(bodyKey ? 'body' : editor.kind, bodyKey || editor.key, Boolean(editor.fromBody));
        },
        async useBodyOnce() {
          const { choices, selectedLocalKey, canonicalId } = snapshot.dialog;
          await controller.rebuild({ ...choices, [selectedLocalKey]: canonicalId });
          if (!snapshot.error) {
            controller.patchDialog({ view: 'preview' });
          }
        },
        backToPreview() {
          controller.update({ error: '', notice: '' });
          controller.patchDialog({ view: 'preview' });
          if (snapshot.dialog.stale) {
            return controller.rebuild();
          }
        },
        saveRelation(kind, key, target) {
          const dialog = snapshot.dialog;
          return controller.manage(async () => {
            await controller.api('saveRelation', { kind, key, target, expectedRevision: dialog.relationsData.relationsRevision });
            controller.showMappings(kind, target === null ? '' : key);
            const choices = { ...dialog.choices };
            if (kind === 'body' && target !== null) {
              delete choices[key];
            }
            const followSource = kind === 'body' && target !== null && dialog.editor?.contextual;
            controller.patchDialog({ relationsData: null, choices, stale: Boolean(dialog.provider) });
            await controller.loadStatus(true);
            await controller.refreshAfterSave(key, target, followSource);
          });
        },
        async refreshAfterSave(key, target, followSource) {
          try {
            const { relations } = await controller.readRelations();
            let notice = target === null ? 'deleted' : 'saved';
            if (followSource && relations.bodies[key] === target) {
              await controller.loadCanonical(target);
              const { detail, canonicalProblem } = snapshot.dialog;
              if (canonicalProblem) {
                notice = ['saved', canonicalProblem];
              } else if (!usableSource(detail)) {
                if (detail.candidates.length) {
                  controller.patchDialog({ tab: 'source', editor: { kind: 'source', key: target, afterBody: key, contextual: true } });
                  notice = 'chooseSourceNext';
                } else {
                  notice = ['saved', sourceUnavailable(detail)];
                }
              }
            }
            controller.update({ notice });
          } catch {
            controller.patchDialog({ relationsData: null });
            controller.update({ notice: target === null ? 'reloadAfterRemove' : 'reloadAfterSave' });
          }
        },
        async apply() {
          const dialog = snapshot.dialog;
          if (!dialog?.preview || dialog.stale) { 
            return; 
          }
          controller.update({ busy: true, error: '', notice: '' });
          try {
            const result = await controller.api('apply', { token: dialog.preview.token });
            await controller.loadStatus(true);
            controller.update({ busy: false, dialog: null, notice: { type: 'applied', ...result } });
          } catch (error) {
            controller.update({ error: error.code === 'STALE_PREVIEW' ? 'STALE_PREVIEW' : error.message, dialog: { ...snapshot.dialog, stale: true } });
          } finally {
            controller.update({ busy: false });
          }
        },
        close() {
          if (snapshot.busy) { 
            return; 
          }
          generation += 1;
          controller.update({ dialog: null, error: '', notice: '' });
        },
        dispose() {
          alive = false;
          for (const request of requests) { 
            request.abort(); 
          }
          requests.clear();
          listeners.clear();
        }
      };
      return controller;
    }

    function makeComponents(ctx, controller) {
      const translate = ctx.locale.bind(namespace);
      const subscribeLocale = callback => ctx.locale.subscribe(callback);
      const getLocale = () => ctx.locale.getSnapshot();
      function useText() {
        useSyncExternalStore(subscribeLocale, getLocale, getLocale);
        return translate;
      }
      function useData() {
        return useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
      }
      function button(label, onClick, disabled, primary, extra = {}) {
        return h('button', { type: 'button', className: `mmf-btn${primary ? ' mmf-primary' : ''}`, onClick, disabled, ...extra }, label);
      }
      function format(value, t) {
        if (value === null || value === undefined) { 
          return t('absent'); 
        }
        if (Array.isArray(value)) { 
          return value.map(item => item === 'text' || item === 'image' ? t(item) : String(item)).join(', '); 
        }
        if (typeof value === 'object') { 
          return JSON.stringify(value, null, 2); 
        }
        return String(value);
      }
      function statusText(value, t) {
        const status = typeof value === 'string' ? value : value?.status;
        const key = { automatic: 'automatic', manual: 'manual', invalid: 'invalid', missing: 'missingSource', ambiguous: 'ambiguous', unmatched: 'unmatched', matched: 'matched' }[status];
        return key ? t(key) : status || t('unknown');
      }
      function Alerts({ data }) {
        const t = useText();
        const notice = Array.isArray(data.notice) ? data.notice.map(t).join(' ') : typeof data.notice === 'string' ? data.notice && t(data.notice) : data.notice?.type === 'applied' ? `${t('applied')} · ${data.notice.models} ${t('models')} / ${data.notice.fields} ${t('fields')}` : '';
        return h(React.Fragment, null,
          data.error ? h('div', { role: 'alert', className: 'mmf-alert' }, data.error === 'STALE_PREVIEW' ? t('stale') : data.error === 'STALE_RELATIONS' ? t('reopenMappings') : `${t('failure')}: ${data.error}`) : null,
          notice ? h('p', { role: 'status', className: 'mmf-note' }, notice) : null);
      }
      function formatReasoning(record, t) {
        if (record.reasoning_options?.length) {
          return record.reasoning_options.map(option => {
            if (option.type === 'toggle') {
              return t('reasoningToggle');
            }
            if (option.type === 'effort') {
              return `${t('reasoningEfforts')}: ${option.values.join(', ')}`;
            }
            if (option.type === 'budget_tokens') {
              const min = option.min == null ? '' : `${t('budgetMin')} ${option.min}`;
              const max = option.max == null ? '' : `${t('budgetMax')} ${option.max}`;
              const bounds = [min, max].filter(Boolean).join(', ');
              return bounds ? `${t('reasoningBudget')}: ${bounds}` : t('reasoningBudget');
            }
            return JSON.stringify(option);
          }).join('\n');
        }
        return t(record.reasoning === false ? 'noReasoning' : record.reasoning === true ? 'supportedReasoning' : 'absent');
      }
      function Metadata({ record }) {
        const t = useText();
        return h('dl', { className: 'mmf-meta' },
          h('dt', null, t('contextWindow')), h('dd', null, format(record.limit?.context, t)),
          h('dt', null, t('maxTokens')), h('dd', null, format(record.limit?.output, t)),
          h('dt', null, t('input')), h('dd', null, format(record.modalities?.input, t)),
          h('dt', null, t('reasoning')), h('dd', null, h('pre', { className: 'mmf-value' }, formatReasoning(record, t))));
      }
      // 弹窗保留在插槽树内；切换关系视图而不创建嵌套模态层。
      function Dialog({ data }) {
        const t = useText();
        const dialogRef = useRef(null);
        const focusRef = useRef(null);
        const busyRef = useRef(data.busy);
        const titleId = useId();
        busyRef.current = data.busy;
        useEffect(() => {
          const dialog = dialogRef.current;
          focusRef.current = document.activeElement;
          dialog.showModal();
          return () => {
            if (dialog.open) { 
              dialog.close(); 
            }
            const target = focusRef.current;
            if (target?.isConnected && typeof target.focus === 'function') { 
              target.focus(); 
            }
          };
        }, []);
        function handleKeys(event) {
          if (event.key !== 'Tab') { 
            return; 
          }
          const nodes = [...dialogRef.current.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex="0"]')].filter(node => node.tabIndex >= 0 && node.getClientRects().length > 0);
          if (!nodes.length) { 
            event.preventDefault(); dialogRef.current.focus(); return; 
          }
          const first = nodes[0];
          const last = nodes[nodes.length - 1];
          if (event.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) { 
            event.preventDefault(); last.focus(); 
          }
          if (!event.shiftKey && document.activeElement === last) { 
            event.preventDefault(); first.focus(); 
          }
        }
        return h('dialog', { ref: dialogRef, className: 'mmf-dialog mmf-root', 'aria-labelledby': titleId, 'aria-busy': data.busy, tabIndex: -1, onKeyDown: handleKeys, onCancel: event => { event.preventDefault(); if (!busyRef.current) { 
          controller.close(); 
        } } },
          h('div', { className: 'mmf-dialog-shell' },
            h('header', { className: 'mmf-dialog-head' }, h('h2', { id: titleId, className: 'mmf-title' }, t(data.dialog.view === 'relations' ? 'manage' : 'preview')), button(t('close'), () => controller.close(), data.busy, false, { autoFocus: true })),
            h('div', { className: 'mmf-dialog-body' }, h(Alerts, { data }), data.dialog.view === 'relations' ? h(Relations, { data }) : h(Preview, { data })),
            data.busy || data.dialog.provider ? h('footer', { className: 'mmf-dialog-foot' },
              data.busy ? h('span', { className: 'mmf-muted', role: 'status' }, t('working')) : null,
              data.dialog.view === 'preview'
                ? button(t('confirm'), () => controller.apply(), data.busy || !data.dialog.preview?.fieldCount || data.dialog.stale, true, { key: 'apply' })
                : data.dialog.provider ? button(t('back'), () => controller.backToPreview(), data.busy) : null) : null));
      }
      function Preview({ data }) {
        const t = useText();
        const dialog = data.dialog;
        const preview = dialog.preview;
        const contextRow = useRef(null);
        useEffect(() => {
          if (!data.busy) {
            contextRow.current?.focus();
          }
        }, [data.busy]);
        function chooseOnce(row, canonicalId) {
          const choices = { ...dialog.choices };
          if (canonicalId) { 
            choices[localKey(dialog.provider, row.id)] = canonicalId; 
          } else { 
            delete choices[localKey(dialog.provider, row.id)]; 
          }
          void controller.rebuild(choices);
        }
        return h(React.Fragment, null,
          h('div', { className: 'mmf-head' }, h('strong', { className: 'mmf-break' }, `${dialog.provider} · ${t(dialog.mode === 'overwrite' ? 'overwrite' : 'missing')}`), preview ? h('span', { className: 'mmf-tag' }, `${preview.fieldCount} ${t('changes')}`) : null),
          h('p', { className: 'mmf-muted' }, t(dialog.mode === 'overwrite' ? 'overwriteHelp' : 'missingHelp')),
          !preview && data.busy ? h('p', { role: 'status' }, t('loading')) : null,
          !data.busy && (!preview || dialog.stale) ? h('p', { role: 'status', className: 'mmf-note' }, t('reopenPreview')) : null,
          preview?.fieldCount === 0 ? h('p', { className: 'mmf-alert' }, t('noChanges')) : null,
          (preview?.rows || []).map(row => h('section', { className: 'mmf-row', key: row.id },
            h('div', { className: 'mmf-head' }, h('h3', { className: 'mmf-id' }, row.name && row.name !== row.id ? `${row.name} · ${row.id}` : row.id), button(t('manageRow'), () => controller.openManager({ provider: dialog.provider, id: row.id, name: row.name }), data.busy, false, { ref: dialog.contextLocal?.id === row.id ? contextRow : null, 'aria-label': `${t('manageRow')} · ${localLabel({ ...row, provider: dialog.provider })}` })),
            h('span', { className: 'mmf-tag' }, statusText(row.match, t)), row.source ? h('span', { className: 'mmf-tag' }, statusText(row.source, t)) : null,
            row.canonicalId ? h('div', { className: 'mmf-id mmf-muted' }, row.canonicalId) : null,
            row.source?.serviceKey ? h('div', { className: 'mmf-id mmf-muted' }, `${t('source')}: ${JSON.parse(row.source.serviceKey).join(' / ')}`) : null,
            row.match?.rule ? h('span', { className: 'mmf-tag' }, row.match.rule) : null,
            row.match?.message ? h('p', { className: 'mmf-note' }, row.match.message) : null,
            row.source?.message ? h('p', { className: 'mmf-note' }, row.source.message) : null,
            row.match?.status === 'ambiguous' ? h('div', null,
              h('label', { className: 'mmf-label' }, t('useOnce'), h('select', { className: 'mmf-input', disabled: data.busy, value: dialog.choices[localKey(dialog.provider, row.id)] || '', onChange: event => chooseOnce(row, event.target.value) }, h('option', { value: '' }, t('noSelection')), (row.match.candidates || []).map(id => h('option', { key: id, value: id }, id)))),
              h('p', { className: 'mmf-muted' }, t('onceHelp'))) : null,
            dialog.choices[localKey(dialog.provider, row.id)] ? h('div', { className: 'mmf-actions' }, h('span', { className: 'mmf-muted' }, `${t('useOnce')}: ${dialog.choices[localKey(dialog.provider, row.id)]}`), button(t('removeOnce'), () => chooseOnce(row, ''), data.busy)) : null,
            (row.changes || []).map(change => h('div', { className: 'mmf-diff', key: change.field }, h('strong', null, t(change.field)), h('pre', { className: 'mmf-value', 'aria-label': t('before') }, format(change.before, t)), h('span', { 'aria-hidden': true }, '→'), h('pre', { className: 'mmf-value', 'aria-label': t('after') }, format(change.after, t)), h('span', { className: 'mmf-origin mmf-muted mmf-break' }, `${t('origin')}: ${change.origin}`))),
            !(row.changes || []).length ? h('p', { className: 'mmf-muted' }, t(row.skipped ? 'skipped' : 'unchanged')) : null,
            (row.warnings || []).map((warning, index) => h('p', { key: index, className: 'mmf-alert' }, warning)))));
      }
      function Relations({ data }) {
        const t = useText();
        const { tab, editor, relationsData, focusKey, focusSource } = data.dialog;
        const ids = useId();
        const selectedRow = useRef(null);
        const panel = useRef(null);
        useEffect(() => {
          if (!data.busy && !editor && focusKey !== null) {
            (selectedRow.current || panel.current)?.focus();
          }
        }, [editor, focusKey, focusSource, data.busy]);
        if (!relationsData) {
          return data.busy ? h('p', { role: 'status' }, t('loading')) : h('p', { className: 'mmf-note' }, t('reopenMappings'));
        }
        if (editor) {
          return h(RelationEditor, { key: `${editor.kind}:${editor.key}`, data });
        }
        const { relations, locals, sourceStatuses } = relationsData;
        const collection = tab === 'body' ? relations.bodies : relations.sources;
        const rows = Object.entries(collection).map(([key, target]) => {
          const local = tab === 'body' ? locals.find(item => localKey(item.provider, item.id) === key) : null;
          const invalid = tab === 'body' ? !local || local.status === 'invalid' : sourceStatuses?.[key] === 'invalid';
          const label = tab === 'body' && local ? localLabel(local) : key;
          const value = tab === 'body' ? target : serviceLabel(target);
          const sourceAction = tab === 'body' && Object.hasOwn(relations.sources, target) ? 'editSource' : 'addSource';
          return h('li', { className: 'mmf-row mmf-mapping-row', key },
            h('div', null,
              h('strong', { className: 'mmf-break' }, label),
              h('div', { className: 'mmf-muted mmf-break' }, `→ ${value}`),
              invalid || sourceStatuses === null ? h('span', { className: 'mmf-tag' }, t(invalid ? 'invalid' : 'unverified')) : null),
            h('div', { className: 'mmf-actions mmf-row-actions' },
              button(t('edit'), () => controller.openEditor(tab, key, label), data.busy, false,
                { ref: focusKey === key && !focusSource ? selectedRow : null, 'aria-label': `${t('edit')} · ${label}` }),
              tab === 'body' ? button(t(sourceAction), () => controller.openEditor('source', target, label, key), data.busy || (sourceStatuses === null && sourceAction === 'addSource'), false,
                { ref: focusKey === key && focusSource ? selectedRow : null, 'aria-label': `${t(sourceAction)} · ${label}` }) : null));
        });
        function switchTab(event, kind) {
          if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
            event.preventDefault();
            const next = event.key === 'Home' ? 'body' : event.key === 'End' ? 'source' : kind === 'body' ? 'source' : 'body';
            controller.showMappings(next);
            event.currentTarget.parentElement.querySelector(`[data-kind="${next}"]`).focus();
          }
        }
        return h(React.Fragment, null,
          h('div', { role: 'tablist', className: 'mmf-tabs', 'aria-label': t('manage') },
            ['body', 'source'].map(kind => button(t(kind === 'body' ? 'modelTab' : 'sourceTab'), () => controller.showMappings(kind), data.busy, false, {
              key: kind, id: `${ids}-${kind}`, role: 'tab', 'aria-selected': tab === kind, 'aria-controls': `${ids}-panel`, tabIndex: tab === kind ? 0 : -1,
              'data-kind': kind, onKeyDown: event => switchTab(event, kind),
            }))),
          h('section', { ref: panel, id: `${ids}-panel`, tabIndex: -1, role: 'tabpanel', 'aria-labelledby': `${ids}-${tab}` },
            h('div', { className: 'mmf-head mmf-note' },
              h('strong', null, t(tab === 'body' ? 'bodyMapping' : 'sourceMapping')),
              button(t(tab === 'body' ? 'addBody' : 'addSource'), () => controller.openEditor(tab), data.busy || sourceStatuses === null, true)),
            sourceStatuses === null ? h('div', { className: 'mmf-alert mmf-actions' }, t('noCache'), button(t('refresh'), () => controller.refreshMappingsCatalog(), data.busy)) : null,
            rows.length ? h('ul', { className: 'mmf-mappings' }, rows) : h('p', { className: 'mmf-muted' }, t(tab === 'body' ? 'emptyBodies' : 'emptySources'))));
      }
      function SearchCombo({ label, hint, selectedLabel, selected, disabled, options, loadOptions, onSelect }) {
        const t = useText();
        const listId = useId();
        const input = useRef(null);
        const popup = useRef(null);
        const [composing, setComposing] = useState(false);
        const [open, setOpen] = useState(false);
        const [query, setQuery] = useState(null);
        const [navigation, setNavigation] = useState(null);
        const [result, setResult] = useState(null);
        const expanded = open && !disabled;
        const needle = query?.trim() || '';
        const searching = Boolean(loadOptions && result?.query !== needle);
        const searchError = !composing && !searching && result?.error;
        const matches = composing ? [] : loadOptions ? (!searching && result?.options || [])
          : options.filter(option => (option.search || option.label).toLowerCase().includes(needle.toLowerCase()));
        const activeIndex = navigation === 'first' ? matches.findIndex(option => !option.disabled)
          : navigation === 'last' ? matches.findLastIndex(option => !option.disabled) : navigation ?? -1;
        const active = matches[activeIndex];
        useEffect(() => {
          if (!expanded || !loadOptions || composing) {
            return;
          }
          let active = true;
          const timer = setTimeout(async () => {
            try {
              const options = await loadOptions(needle);
              if (active) {
                setResult({ query: needle, options });
              }
            } catch (error) {
              if (active && error.name !== 'AbortError') {
                setResult({ query: needle, error: error.message });
              }
            }
          }, 250);
          return () => { active = false; clearTimeout(timer); };
        }, [expanded, needle, loadOptions, composing]);
        useLayoutEffect(() => {
          if (!expanded) {
            return;
          }
          const field = input.current;
          const layer = popup.current;
          const win = field.ownerDocument.defaultView;
          const scrollPort = field.closest('.mmf-dialog-body');
          function position() {
            const box = field.getBoundingClientRect();
            const bounds = scrollPort.getBoundingClientRect();
            layer.style.visibility = box.bottom > bounds.top && box.top < bounds.bottom ? 'visible' : 'hidden';
            const below = win.innerHeight - box.bottom - 8;
            const above = box.top - 8;
            const placeAbove = below < 210 && above > below;
            layer.style.width = `${box.width}px`;
            layer.style.left = `${box.left}px`;
            layer.style.top = placeAbove ? 'auto' : `${box.bottom + 4}px`;
            layer.style.bottom = placeAbove ? `${win.innerHeight - box.top + 4}px` : 'auto';
            layer.style.maxHeight = `${Math.min(224, Math.max(0, placeAbove ? above : below))}px`;
          }
          position();
          layer.showPopover();
          win.addEventListener('scroll', position, true);
          win.addEventListener('resize', position);
          return () => {
            layer.hidePopover();
            win.removeEventListener('scroll', position, true);
            win.removeEventListener('resize', position);
          };
        }, [expanded]);
        useEffect(() => {
          if (expanded && active) {
            const layer = popup.current;
            const option = layer.querySelectorAll('[role="option"]')[activeIndex].getBoundingClientRect();
            const bounds = layer.getBoundingClientRect();
            if (option.bottom > bounds.bottom) {
              layer.scrollTop += option.bottom - bounds.bottom;
            } else if (option.top < bounds.top) {
              layer.scrollTop += option.top - bounds.top;
            }
          }
        }, [expanded, activeIndex, active?.id, listId]);
        function close() {
          setOpen(false);
          setQuery(null);
          setNavigation(null);
          setComposing(false);
          setResult(null);
        }
        function choose(option) {
          if (!option.disabled) {
            close();
            onSelect(option.id);
          }
        }
        function handleKeys(event) {
          if (composing || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229 || disabled) {
            return;
          }
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
            const step = event.key === 'ArrowDown' ? 1 : -1;
            if (!matches.length) {
              setNavigation(step === 1 ? 'first' : 'last');
              return;
            }
            let index = activeIndex === -1 && step === -1 ? matches.length - 1 : activeIndex + step;
            while (index >= 0 && index < matches.length && matches[index].disabled) {
              index += step;
            }
            if (index >= 0 && index < matches.length) {
              setNavigation(index);
            }
          } else if (expanded && event.key === 'Enter') {
            event.preventDefault();
            if (active) {
              choose(active);
            }
          } else if (expanded && event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            close();
          }
        }
        return h('div', { className: 'mmf-combo' },
          h('label', { className: 'mmf-label', htmlFor: `${listId}-input` }, label),
          h('div', { className: 'mmf-combo-field' },
            h('input', { id: `${listId}-input`, ref: input, type: 'text', className: 'mmf-input', role: 'combobox', autoComplete: 'off',
              'aria-expanded': expanded, 'aria-controls': expanded ? listId : undefined, 'aria-autocomplete': 'list',
              'aria-activedescendant': expanded && active ? `${listId}-${activeIndex}` : undefined, 'aria-disabled': disabled, readOnly: disabled,
              value: query ?? selectedLabel, placeholder: hint, onFocus: event => event.target.select(), onBlur: close, onKeyDown: handleKeys,
              onClick: event => {
                if (!disabled && !expanded) {
                  event.target.select();
                  setOpen(true);
                }
              },
              onCompositionStart: () => setComposing(true), onCompositionEnd: event => { setComposing(false); setQuery(event.currentTarget.value); },
              onChange: event => { setOpen(true); setQuery(event.target.value); setNavigation(null); } }),
            h('button', { type: 'button', className: 'mmf-combo-toggle', tabIndex: -1, 'aria-label': label, disabled,
              onMouseDown: event => event.preventDefault(), onClick: () => {
                input.current?.focus();
                if (expanded) {
                  close();
                } else {
                  setOpen(true);
                }
              } }, expanded ? '▴' : '▾')),
          expanded ? h('div', { ref: popup, popover: 'manual', className: 'mmf-combo-popup' },
            h('ul', { id: listId, role: 'listbox', 'aria-label': label, 'aria-busy': searching }, matches.map((option, index) =>
              h('li', { key: option.id, id: `${listId}-${index}`, role: 'option', 'aria-selected': selected === option.id,
                'aria-disabled': option.disabled || undefined, 'data-active': index === activeIndex,
                onMouseDown: event => event.preventDefault(), onClick: () => choose(option) }, option.label,
                option.note ? h('span', { className: 'mmf-tag' }, option.note) : option.noteKey ? h('span', { className: 'mmf-tag' }, t(option.noteKey)) : null))),
            composing ? null : searchError ? h('div', { className: 'mmf-combo-status', role: 'alert' }, searchError)
              : searching || !matches.length ? h('div', { className: 'mmf-combo-status mmf-muted', role: 'status' }, t(searching ? 'loading' : 'noResults')) : null) : null);
      }
      function CanonicalPicker({ selected, selectedModel, disabled, onSelect, savedSources }) {
        const t = useText();
        const formatModel = model => model.name && model.name !== model.id ? `${model.name} · ${model.id}` : model.id;
        const loadOptions = useCallback(async query => {
          const { models } = await controller.api('catalog', { query });
          return models.map(model => {
            const saved = Object.hasOwn(savedSources || {}, model.id);
            return { id: model.id, label: formatModel(model), disabled: saved, noteKey: saved ? 'currentSource' : '' };
          });
        }, [savedSources]);
        return h(React.Fragment, null,
          h(SearchCombo, { label: t('pickBody'), hint: t('modelSearch'), selected, selectedLabel: selectedModel ? formatModel(selectedModel) : selected,
            disabled, onSelect, loadOptions }),
          h('p', { className: 'mmf-muted' }, t('searchLimited')));
      }
      function RelationEditor({ data }) {
        const t = useText();
        const { editor, relationsData, selectedLocalKey, canonicalId, detail, canonicalProblem, selectedService } = data.dialog;
        const { relations, locals, sourceStatuses } = relationsData;
        const heading = useRef(null);
        const canBrowse = sourceStatuses !== null;
        useEffect(() => { heading.current?.focus(); }, []);
        const isBody = editor.kind === 'body';
        const key = isBody ? selectedLocalKey : canonicalId;
        const currentLocal = isBody ? locals.find(item => localKey(item.provider, item.id) === key) : null;
        const saved = isBody ? relations.bodies[key] : relations.sources[key];
        const targetService = detail?.candidates.find(item => serviceKey(item) === selectedService);
        const effective = detail?.candidates.find(item => serviceKey(item) === detail.sourceStatus.serviceKey);
        const localOptions = isBody && !editor.key ? locals.flatMap(item => {
          const id = localKey(item.provider, item.id);
          return Object.hasOwn(relations.bodies, id) ? [] : [{ id, label: localLabel(item) }];
        }) : [];
        const candidates = detail?.candidates ?? [];
        const serviceOptions = !isBody ? candidates.map(service => {
          const id = serviceKey(service);
          const label = serviceLabel(service);
          const tags = [t(service.match === 'exact' ? 'exact' : service.match === 'prefix' ? 'prefix' : 'unrecognized')];
          if (detail.automatic === id) {
            tags.push(t('automaticDefault'));
          }
          if (saved && serviceKey(saved) === id) {
            tags.push(t('manual'));
          }
          return { id, label, search: `${label} ${service.name || ''}`, note: tags.join(' · ') };
        }) : [];
        const canSave = Boolean(detail && canBrowse && (isBody ? currentLocal && saved !== canonicalId : targetService && (!saved || serviceKey(saved) !== selectedService)));
        const canChooseCanonical = canBrowse && (isBody ? Boolean(currentLocal) : !editor.key);
        function save() {
          const target = isBody ? canonicalId : { provider: targetService.provider, modelId: targetService.modelId };
          return controller.saveRelation(editor.kind, key, target);
        }
        return h(React.Fragment, null,
          h('div', { className: 'mmf-head' },
            h('h3', { ref: heading, tabIndex: -1, className: 'mmf-title' }, t(isBody ? saved ? 'editBody' : 'addBody' : saved ? 'editSource' : 'addSource')),
            h('div', { className: 'mmf-actions' },
              editor.contextual && !editor.afterBody && !isBody ? button(t('editBody'), () => controller.adjustContext('body'), data.busy) : null,
              editor.contextual && isBody && detail?.candidates.length > 0 && canonicalId === data.dialog.contextCanonicalId ? button(t(relations.sources[canonicalId] ? 'editSource' : 'addSource'), () => controller.adjustContext('source'), data.busy) : null,
              !editor.afterBody ? button(t('listBack'), () => controller.leaveEditor(), data.busy) : null)),
          isBody && !editor.key ? h(SearchCombo, { label: t('pickLocal'), hint: t('localSearch'), selected: key,
            selectedLabel: currentLocal ? localLabel(currentLocal) : '', disabled: data.busy || !canBrowse, options: localOptions, onSelect: id => controller.chooseLocal(id) }) : null,
          isBody && editor.key ? h('p', { className: 'mmf-note mmf-break' }, `${t('local')}: ${editor.label}`) : null,
          isBody && editor.key && !currentLocal ? h('p', { className: 'mmf-alert' }, t('localGone')) : null,
          !isBody && (editor.contextual || editor.fromBody) ? h('p', { className: 'mmf-note mmf-break' }, `${t('local')}: ${editor.fromBody ? editor.label : localLabel(data.dialog.contextLocal)}`) : null,
          !isBody ? h('p', { className: 'mmf-alert' }, t('shared')) : null,
          isBody && saved ? h('p', { className: 'mmf-muted mmf-break' }, `${t('currentBody')}: ${saved}`) : null,
          !isBody && saved ? h('p', { className: 'mmf-muted mmf-break' }, `${t('currentSource')}: ${serviceLabel(saved)}`) : null,
          canChooseCanonical ? h(CanonicalPicker, { selected: canonicalId, selectedModel: detail?.model, disabled: data.busy, onSelect: id => controller.chooseCanonical(id), savedSources: isBody ? null : relations.sources }) : null,
          canonicalId && !canChooseCanonical ? h('p', { className: 'mmf-note mmf-id' }, `${t('body')}: ${canonicalId}`) : null,
          canonicalProblem ? h('p', { className: 'mmf-alert' }, t(canonicalProblem)) : !canBrowse ? h('p', { className: 'mmf-alert' }, t('unverified')) : null,
          detail ? h('p', { className: 'mmf-note mmf-break' }, `${t('effectiveSource')}: ${statusText(detail.sourceStatus, t)}${effective ? ` · ${serviceLabel(effective)}` : ''}`) : null,
          detail?.sourceStatus.status === 'invalid' ? h('p', { className: 'mmf-alert' }, t('currentInvalid')) : null,
          detail && isBody ? h('details', null, h('summary', null, t('bodyMetadata')), h(Metadata, { record: detail.model })) : null,
          detail && !isBody && !candidates.length ? h('p', { className: 'mmf-note' }, t(sourceUnavailable(detail))) : null,
          !isBody && candidates.length > 0 ? h(React.Fragment, null,
            h(SearchCombo, { key: canonicalId, label: t('selectService'), hint: t('serviceSearch'), selected: selectedService,
              selectedLabel: targetService ? serviceLabel(targetService) : '', disabled: data.busy, options: serviceOptions,
              onSelect: id => controller.patchDialog({ selectedService: id }) }),
            (targetService || effective) ? h('section', null,
              h('h4', { className: 'mmf-title' }, t('serviceMetadata')),
              h(Metadata, { record: targetService || effective })) : null,
            h('p', { className: 'mmf-muted' }, t('inferred'))) : null,
          h('div', { className: 'mmf-actions mmf-note' },
            button(t(isBody ? 'saveBody' : 'saveSource'), save, data.busy || !canSave, true),
            saved ? button(t(isBody ? 'removeBody' : 'removeSource'), () => controller.saveRelation(editor.kind, key, null), data.busy) : null,
            editor.afterBody ? button(t('deferSource'), () => controller.leaveEditor(), data.busy) : null,
            isBody && editor.contextual && !saved ? button(t('useOnce'), () => controller.useBodyOnce(), data.busy || !detail || !currentLocal) : null),
          isBody && editor.contextual && !saved ? h('p', { className: 'mmf-muted' }, t('onceHelp')) : null);
      }
      function ProviderCard({ provider, configured }) {
        const t = useText();
        const data = useData();
        const route = provider.provider;
        useEffect(() => { void controller.loadStatus(true); }, [route, configured]);
        const available = configured && data.status?.providers?.some(item => item.id === route && item.count > 0);
        if (!available) { 
          return null; 
        }
        return h('div', { className: 'mmf-root' }, h('style', null, css), h('div', { className: 'mmf-actions' }, button(t('missing'), () => controller.openPreview(route, 'missing'), data.busy || !data.status.cache.ready), button(t('overwrite'), () => controller.openPreview(route, 'overwrite'), data.busy || !data.status.cache.ready)));
      }
      function Footer() {
        const t = useText();
        const data = useData();
        useEffect(() => { void controller.loadStatus(); }, []);
        const cache = data.status?.cache;
        return h('section', { className: 'mmf-root mmf-footer', 'aria-label': t('title') }, h('style', null, css),
          h('div', { className: 'mmf-head' }, h('h2', { className: 'mmf-title' }, t('title')), h('div', { className: 'mmf-actions' }, button(t('manage'), () => controller.openManager(), data.busy), button(t('refresh'), () => controller.refresh(), data.busy))),
          h('p', { className: 'mmf-muted' }, cache ? `${t(cache.refreshing ? 'working' : cache.ready ? 'ready' : 'noCache')} · ${t('updated')}: ${cache.updatedAt ? new Date(cache.updatedAt).toLocaleString() : t('unknown')}` : t(data.statusError ? 'failure' : 'loading')),
          data.status ? h('p', { className: 'mmf-muted' }, `${t('countBodies')}: ${data.status.relationCounts.bodies} · ${t('countSources')}: ${data.status.relationCounts.sources}`) : null,
          data.statusError ? h('div', { role: 'alert', className: 'mmf-alert' }, data.statusError, ' ', button(t('retry'), () => controller.loadStatus(true), data.busy)) : null,
          cache?.error ? h('p', { role: 'status', className: 'mmf-alert' }, `${t('refreshFailed')}: ${cache.error}`) : null,
          (data.status?.conflicts || []).map((conflict, index) => h('p', { key: index, role: 'alert', className: 'mmf-alert' }, `${t('conflict')}: ${conflict}`)),
          !data.dialog ? h(Alerts, { data }) : null,
          data.dialog ? h(Dialog, { data }) : null);
      }
      return { ProviderCard, Footer };
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        const controller = createController();
        ctx.effect(() => ctx.locale.register(namespace, { zh: dictionaries.zh, en: dictionaries.en }), 'model-meta-fill: locale');
        const { ProviderCard, Footer } = makeComponents(ctx, controller);
        ctx.effect(() => () => controller.dispose(), 'model-meta-fill: requests');
        ctx.slots.inject('settings.models.provider-card', () => ctx.slots.register({ name: 'settings.models.provider-card', key: 'llm-pi-ai' }, ProviderCard));
        ctx.slots.inject('settings.models.footer', () => ctx.slots.register({ name: 'settings.models.footer', id: 'model-meta-fill', order: 25, label: () => ctx.locale.bind(namespace)('title') }, Footer));
      }
    };
  }
});
