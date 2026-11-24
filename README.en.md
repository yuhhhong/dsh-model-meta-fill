# dsh-model-meta-fill

[中文](<./README.md>) | English

A model metadata fill plugin for DeepSeek Harness (DSH). On **Settings → Models**, it matches explicit local models configured under `llm-pi-ai` against [models.dev](https://models.dev) metadata, then fills or overwrites four settings after a per-model, per-field diff preview: context window, maximum output tokens, input types, and reasoning levels.

When maintaining custom gateways, relays, or third-party providers by hand, looking up and typing model specs one by one is tedious, and wire values for reasoning levels are especially easy to get wrong. This plugin adds **Fill missing** and **Overwrite** buttons to eligible provider cards and only updates those four metadata fields. It never alters a model's original request ID, and never exposes provider credentials or custom headers to the client.

## Highlights

### Two catalogs: canonical models for matching, service records for provider capabilities

The plugin fetches both `models.dev/models.json` (canonical models) and `models.dev/api.json` (provider service records), linking them only on an exact `canonical_model_id` match.

Searching and matching run against deduplicated canonical models rather than repeated entries across hosts, while linked service records supply service-level fields such as reasoning controls. Under automatic source inference, context window, maximum output tokens, and input types come from the canonical model while reasoning levels come from the inferred service record. Once you manually select a service source, all four fields come solely from that service record without mixing fallback data.

### Conservative matching without altering request IDs

Local models are matched in order by exact ID, normalized name (Unicode NFKC, case, whitespace, underscores, and hyphens), gateway path suffixes, and display names. Version numbers, dates, and variant tokens such as `pro`, `mini`, and `thinking` are kept intact so distinct models are not conflated.

Model IDs with colon suffixes are never stripped into an automatic match; if full matching fails, stripped candidates are shown for manual confirmation only. When multiple canonical models match, the plugin asks you to choose instead of taking the first hit. Matching and saved mappings only determine where metadata is read from. The original request ID sent to your provider is never changed.

### Automatic source inference with two independent manual mappings

When building the catalog, the plugin reads the lab prefix from each canonical model ID and infers provider affiliation from service provider IDs: exact match (`exact`) first, then longest left word-prefix match (`prefix`). Providers that do not match by name prefix (`none`, such as third-party hosts or differently named channels) are never selected automatically.

When automatic matching or default inference does not fit, **Manage relations** lets you save two separate mappings:

- **Model mappings**: local provider + original model ID → canonical model ID
- **Source mappings**: canonical model ID → provider ID + service model ID (shared by every local model that resolves to the same canonical model)

Both mapping types are saved and removed independently. Catalog refreshes retain saved mappings. When a target disappears or loses its link, the plugin marks the relation as invalid. That model needs a corrected relation or custom parameters before it can be filled.

### Key design decisions

**Custom parameters take priority.** They match the original model ID exactly, including case and path prefixes. Providers with the same ID share one saved set. A match uses all four fields from that set and bypasses canonical model and service source mappings. This also works for models outside the catalog.

When adding a set, select a local model to copy its current mapping results, including saved model and source mappings. You can also enter the original model ID and fill in the form manually. Missing context window, maximum output tokens, and input types start blank. The reasoning switch defaults to off when the template has no reasoning levels. The saved values stay fixed when the catalog or mappings change.

### Separate fill-missing and overwrite modes, with locked diff previews

Each eligible provider card provides two actions. **Fill missing** only fills undeclared fields and keeps existing valid values (including explicit text-only `["text"]` and explicitly disabled reasoning `false`). **Overwrite** replaces local fields where the selected source provides an explicit valid value, leaving local values intact when the source omits a field.

Both buttons open **Fill preview**, listing every model's match state, source state, proposed `Current value → Proposed value` changes, metadata origin, and warnings. Ambiguous matches can also be resolved with a one-time pick right inside the preview without saving a persistent mapping.

Each preview locks the catalog snapshot and configuration revisions used to build it, issuing a single-use confirmation token valid for 30 minutes. If relations or local model settings change before you confirm, applying is rejected so you can review the updated diff.

### Strict field boundaries and no guessed reasoning levels

Input types are checked against each model's saved declaration rather than UI fallback checkboxes. Only `text` and `image` supported by DSH are written; PDF, audio, and video are ignored, and empty arrays are never written.

Reasoning levels only map explicit `effort` enums (`off / minimal / low / medium / high / xhigh / max`, mapping `none` to DSH `off` while preserving wire value `none`), or write `false` when a service explicitly declares `reasoning: false`. Records that only define a boolean toggle, a token budget, or unmapped values such as `default` are displayed with a notice rather than fabricating effort levels. For `google-generative-ai` providers, reasoning levels are written only if every mapped level matches its four supported names (`minimal / low / medium / high`). Existing invalid local fields are warned and skipped in **Fill missing** mode instead of being silently repaired.

### Offline-resilient cache and bilingual UI

Catalog data is cached in local storage, automatically refreshed on startup when missing or older than 7 days, and refreshable manually at any time. If a refresh fails while a complete cache already exists, the cached catalog remains usable.

The UI includes both Chinese and English copy synced to DSH's locale and runs without a frontend build step.

## Installation

Method 1. Install from npm in the DSH web profile:

```sh
dsh plugin --profile web add dsh-model-meta-fill
```

Method 2. Install directly from GitHub:

```sh
dsh plugin --profile web add github:yuhhhong/dsh-model-meta-fill
```

Method 3. On DSH's Plugins page, click Add Plugin and enter the npm package name: `dsh-model-meta-fill`

After installation, restart DSH and refresh the page, then open **Settings → Models**. Provider cards with an explicit model list show **Fill missing** and **Overwrite**, and the bottom of the page displays the **Model metadata fill** status bar and **Manage relations** button.

To uninstall:

```sh
dsh plugin --profile web remove dsh-model-meta-fill
```

The current plugin version is `0.2.0`. The supported DSH range is `>=0.2.2-rc.2 <0.3.0`.

## Usage

### Catalog cache and refresh

The **Model metadata fill** section at the bottom of **Settings → Models** shows cache readiness, last update time, and counts of saved relations. Click **Refresh catalog** to pull updates from `models.dev`. A failed refresh keeps any existing cache. Models with saved custom parameters can be filled even before a catalog is available.

### Previewing and confirming updates

Click **Fill missing** or **Overwrite** on any provider card with an explicit model list to open **Fill preview**. Each row shows the model's match state, source state, proposed `Current value → Proposed value` diffs, metadata origin (`models.json:<canonicalId>` or `api.json:["<provider>","<modelId>"]`), and any warnings or skip notices.

- For ambiguous or colon-suffixed candidates, pick a canonical model in the row's **Use this time only** selector to update the current preview without saving a mapping; click **Clear one-time choice** to reset it.
- To resolve an unmatched model, fix an invalid relation, or pick a different service source, click **Choose / manage relations** on that row to jump directly to the relevant editor. When entering the model-mapping form from a preview for an unsaved model, you can also click **Use this time only**.
- Click **Confirm fill** to apply the previewed changes, or **Close** to leave model settings unchanged.

### Managing relations

Click **Manage relations** in the footer to view saved entries in **Model mappings**, **Source mappings**, and **Custom parameters**.

- Local model, canonical model, and service record fields each use a single searchable dropdown input.
- From any saved row in **Model mappings**, click **Add source mapping** or **Edit source mapping** to configure the service record for that canonical model directly.
- After saving a model mapping opened from a preview, if no usable automatic source exists and linked candidates are available, the dialog lets you pick a service source next, or click **Not now** to keep only the model mapping.
- In **Custom parameters**, add, edit, or remove a complete set. Saving and removing a set only updates the relation. After removal, future fills use mappings again. Use **Overwrite** to update values that were already written.
- Clicking **Back to preview** after editing relations recalculates the diff. Click **Confirm fill** to write the model settings.

## Scope and limitations

- Operates only on non-empty explicit `models` lists under `llm-pi-ai`. It does not create overrides for built-in automatic catalogs, the direct DeepSeek adapter, or account catalogs.
- Maps only explicit `effort` enums. Records that only define a boolean toggle or token budget do not produce effort levels, and the plugin does not alter protocol compatibility flags or provider budget settings.
- Metadata from `models.dev` describes upstream models and services; it cannot verify whether a proxy or gateway actually supports those capabilities at runtime.
- There is no background polling interval while running; if DSH stays open for an extended period without restarting, click **Refresh catalog** manually.

## Local development

This project has no install scripts and no frontend bundler step. The host declares `@deepseek-ai/schemastery` and `zod` directly, and the client runs directly through DSH's browser module loader.

Install dependencies and run syntax checks and unit tests:

```sh
npm ci
npm run check
npm test
```

When installing this directory locally via the DSH Plugin Manager, run `npm ci` here first, then fully quit and reopen the linked DSH desktop app and confirm the plugin is enabled.

Inside a DSH session, you can also test real JSON storage initialization and cache reloading using the bundled desktop Node runtime (writes only to temporary directories):

```sh
ELECTRON_RUN_AS_NODE=1 "$DSH_NODE_EXECUTABLE" --test test/host.test.js
```

| File | Purpose |
| --- | --- |
| [src/core.js](<./src/core.js>) | Catalog building, provider affiliation inference, conservative matching, source resolution, and per-field diff planning |
| [src/application.js](<./src/application.js>) | Catalog cache refresh, relation persistence and revision checks, preview snapshots, and single-use token apply |
| [src/index.js](<./src/index.js>) | Host service injection, storage domain setup, and HTTP action route |
| [src/client.js](<./src/client.js>) | Provider card actions, settings footer, diff preview dialog, and relation management UI |
| [locale/](<./locale>) | Chinese and English plugin title and description for the Plugin Manager |

## License

Licensed under the MIT License. Copyright (c) 2026 yuhong.
