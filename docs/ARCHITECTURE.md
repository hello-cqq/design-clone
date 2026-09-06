# Architecture

How design-clone is put together, why, and where each guarantee is enforced. Companion docs: `docs/VISION.md` (what/why), `docs/DECISIONS.md` (ADRs), `docs/LESSONS.md` (failure history), `skills/design-clone/references/directory-spec.md` (artifact layout).

## 1. System overview

```
                 ┌──────────────────────────── capture plane ────────────────────────────┐
   intent ──► entry.mjs ──► clone.mjs ──► android/ web/ desktop/ link/  (adb·Playwright·HID·yt-dlp)
        (route)      (orchestrate)            │  screenshots · ui-trees · recordings · events.jsonl
                                              ▼
                 ┌──────────────────────────── structure plane ───────────────────────────┐
                 │ dedup · tokens(.mjs) · uitree2spec/webtree2spec/ax2spec · annotate(SoM) │
                 │ semantic pass (host VLM, zero-key) · spec2view · paths-gen · flows-*     │
                 │ privacy.mjs / extract-assets / genimg(+gen-loop) · appicon.mjs           │
                 └───────────────────────────────┬────────────────────────────────────────┘
                                                 ▼
                 ┌──────────────────────────── artifact plane (per run) ──────────────────┐
                 │ capture/ · knowledge/{tokens.css,source-map,privacy,scope,showcase}     │
                 │ prototype/{views/*.html live · index.html shell · runtime.js ·          │
                 │            zipstore.js · annotations/products/paths/journeys · appicon} │
                 │ qa/ · report/ · export/                                                 │
                 └───────────────────────────────┬────────────────────────────────────────┘
                                                 ▼
                 ┌──────────────────────────── verify plane ──────────────────────────────┐
                 │ doctor · interact(dead=0) · inspect(hard gates incl. ui-smoke --fast)   │
                 │ ui-smoke(full, incl. real zip download) · fidelity-all · critique(VLM)  │
                 │ privacy · eval · regress(all runs → report/regress-*.md) · autofix(≤3)  │
                 └────────────────────────────────────────────────────────────────────────┘
```

Everything is **scripts-first**: each capability is a standalone `node scripts/x.mjs --help` entry point; the agent orchestrates, gates decide. No MCP is required (Figma export is optional and plan-driven, ADR A31).

## 2. The prototype shell (inspector)

Source of truth: `templates/prototype/ins/` — 17 numbered sections concatenated by `scripts/build-shell.mjs` into one classic-script IIFE (`prototype/inspector.js` per run). ADR A49 explains why concat instead of ESM/bundler (file:// + unzip-and-open distribution, zero build, zero supply-chain surface).

| Section | Responsibility |
|---|---|
| `00-head` | IIFE entry, DOM helpers, element refs `W`, state `S`, query `Q` |
| `10-config` | single-source truth: `DEVICES`, `SHELL_ALIAS`, `SHORTCUTS`, `EXPORT_MODES`, `TOKEN_KEYS`, edge-kind tables |
| `20-ui` | `modal` (incl. multi-field forms), `notify`, `writeFile`/`readJSON` (serve whitelist + localStorage fallback) |
| `30-edit-state` | edit overrides persistence, undo stack, restore, layout-overrides apply |
| `40-url` | hash/query state, breadcrumbs |
| `50-view` | view injection, script revival, fade, annotation count, compare source |
| `60-canvas` | zoom/pan/fit + overlay drawing (annotations/selection/measure) — **geometry only** |
| `70-nav` | IA switch, page list, scene tree, left-rail filter, a11y pass |
| `80-flow` | scene canvas cards/wires/path chain — wires draw geometry; typography lives in CSS |
| `90-board` | detail board (product/design/prompts), product editor entry, tweaks/variants, drag-edit |
| `100-play` | path playback with fallback chain + session guards; demo mode (captions/sim dialogs/summary) |
| `110-export` | export modes (zip download / directory picker / server), concurrency lock, share menu |
| `120-compare-code` | source-compare fallback chain + synced scroll; code view |
| `130-shell` | device shells, status/frame bar injection, device dropdown + persistence |
| `140-events` | mode toggles, pan, tooltip; **annotation editor (writable)**; **product editor (writable)** |
| `150-bind` | help overlay + all event bindings |
| `160-boot` | boot sequence, data loading, a11y MutationObserver |

Leaves that must stay pure and unit-tested: `templates/prototype/zipstore.js` (UMD-lite: `window.DCZip` in browser, `module.exports` in Node; CRC-32 + store-only zip).

**Invariants (enforced by gates, not honor system):**
- JS writes geometry/state only; typography & color come from `inspector.css` classes + `--sh-*` vars (`ui-smoke → no-inline-typography`, ADR A50).
- Views are live controls; screenshot-as-view is hard-blocked (`inspect → live-views`).
- Every user action yields progress, result, or an explanatory toast/modal — silence is a test failure (`ui-smoke → play-reacts`).
- Shell state travels in URLs (`#pages/<id>`, `?device=`, `?variant=`) so links reproduce what you saw.

## 3. Server (`scripts/serve.mjs`)

Loopback-only orchestration for the shell: static file serving (separator-aware path containment), whitelisted writes (`/__dc_write__`), export jobs (`/__dc_export__`, headless element screenshots, optional base64 payload for browser-side zip). 8 MB body cap, crash-safe handlers. ADRs A37/A48; hardening in `SECURITY.md`. Planned split into `scripts/serve/{index,static,write,export}.mjs` keeps `node serve.mjs` as the stable entry.

## 4. Gates & testing strategy

Three layers, each with a different failure class:

1. **Unit (`npm test`, `node:test`, zero new deps)** — pure logic: zip container math, build determinism; growing to serve policy + path classification + privacy regexes as those modules are extracted.
2. **Artifact gates (`qa/inspect.mjs`)** — properties of a built run: live views, asset quality, geometry sanity, privacy, path logic, app icons, VLM structural critique, plus `ui-smoke --fast`.
3. **Shell smoke (`qa/ui-smoke.mjs`)** — behavior of the inspector as a user experiences it, including a real export download and write-back round trips (auto-restored).

`scripts/regress.mjs` runs 2+3 over every run and fails the build on any regression; `autofix.mjs` may attempt ≤3 bounded repair rounds (ADR A43). Pixel metrics are deliberately *not* trusted alone (structurally blind on sparse UIs) — `critique.mjs` provides the "looks right" gate.

## 5. Extension points

- **New control kind**: `templates/components/controls.md` snippet + `runtime.js` `data-act` case + `interact.mjs` observable-change signature.
- **New gate**: a check inside `qa/inspect.mjs` (artifact property) or `qa/ui-smoke.mjs` (shell behavior); register in both docs (`references/qa-protocol.md`) and `SKILL.md` in the same commit.
- **New platform/shell**: `10-config` `DEVICES`/`SHELL_ALIAS` + `inspector.css` shell rules + `presets/lib-index.json` platform entry.
- **New visual style**: `presets/genimg-styles.md` + `gen/style-pick.mjs` scene mapping.

## 6. Distribution

- Agent-Skills clients: `npx skills add tt-a1i/design-clone`.
- CLI-less platforms: CI packages `dist/design-clone.zip` via `scripts/package.mjs` (excludes node_modules, runs, tests); never hand-edited.
- Prototypes themselves: static bundle, offline-openable, no runtime CDN (Tailwind browser build is being replaced by a generated local utility CSS, see `docs/THIRD-PARTY.md`).
