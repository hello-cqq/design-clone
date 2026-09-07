# design-clone

**Clone any app's design into a production-grade "living PRD"** — an interactive local web prototype plus structured design assets (screenshots, state captures, design tokens, design-rationale docs), captured automatically from real apps, websites, desktop apps, or video/link sources.

> Clone is the starting point, not the destination. design-clone rebuilds a mature product's visual language, interaction paths and product rationale as *your* project's baseline: inspectable, annotatable, editable, exportable — and honest about what it is (a clone, with provenance and consent rules baked in).

- **License:** MIT (code). Captured app screenshots/videos remain the property of their owners; see [Privacy & IP boundary](#privacy--ip-boundary).
- **Runs as:** an [Agent Skill](https://agentskills.io) for any compatible agent CLI (opencode, Claude Code, Codex, Qoder, Qwen Code, Trae, …). No proprietary MCP or paid API is required — visual decisions are made by *your* agent's own VLM.

---

## What you get per run

```
<run>/
├── capture/        source evidence: screenshots, ui-trees, screen recordings, action logs
├── knowledge/      tokens.css · source-map.json · privacy.json · scope.json · showcase.json · DESIGN.md
├── prototype/      the deliverable (see below)
├── qa/             gate results: interact.json · inspect.json · ui-smoke.json · critique.json …
├── report/         fidelity/eval/audit reports + regression evidence
└── export/         timestamped PNG/webm/board exports produced by the inspector
```

`prototype/` is a **static, offline-openable** bundle:

| Piece | What it is |
|---|---|
| `index.html` + `inspector.{js,css}` | the inspector shell: pages/scene IA, preview/code view, device shells, zoom/pan, compare-with-source, share links |
| `views/*.html` | **live views** — real HTML controls from `templates/components/` (never screenshot-as-view; hard-gated) |
| `runtime.js` | interaction runtime: `data-act` catalogue (toggle/radio/checkbox/select/accordion/tab/sheet/dialog/toast/step/slider/input/back/goto) with a11y roles + keyboard support |
| `annotations.json` / `products.json` | product annotations & per-screen product notes — editable in-app, written back to disk |
| `paths.json` / `journeys.json` | interaction paths (classified by real app logic) & demo journeys for playback |
| `appicon/` | 16–512 + maskable icons (cloned from source when possible, generated otherwise, `--regen` to tune) |

### Inspector capabilities (all covered by the `ui-smoke` gate)

- **Play paths** (`P`): page mode plays from the current screen, scene mode plays the selected path; falls back to a demo journey with captions/simulated dialogs/safety-boundary cards, and tells you exactly what is missing when neither exists.
- **Annotate** (`A`): click any element to create/edit/delete product annotations → written to `annotations.json`. Stale annotations (target renamed/removed) are surfaced, never silently dropped.
- **Inspect / edit**: computed-style readout, Alt+hover measuring, drag-to-nudge and style edits → `edit-overrides.json` (Ctrl/⌘+Z undo, one-click restore).
- **Tweaks & variants**: live token editing; "save as variant" persists `prototype/variants/<name>/` + `variants-index.json` (same contract as `apply-patch.mjs --variant`), reproducible via `?variant=<name>`.
- **Export**: browser zip download (default), File-System-Access directory export, or server-side `export/<ts>/`; includes pages ± annotations, scene trees, path boards and `board.json`.
- **Device shells**: 手机 / 平板 / 桌面 / 网页 (mobile 390×844, tablet 834×1194, desktop/browser 1280×800) with optional bezel + status/frame bars; choice persists and travels in share links.
- **Compare** with the original capture, side-by-side at matched scale with synced scrolling.
- `?` lists every shortcut.

## Four modes

| Mode | What it does | Example prompt |
|---|---|---|
| **Clone** | drives Android (adb) / headless Chromium / macOS HID to capture every screen, ui-tree, recording and interaction path of an app or site | "clone the WeChat Pay flow as a design prototype" |
| **Link** | pulls design material from Douyin/Bilibili/Xiaohongshu links or local video/images: download → frame extract → transcribe → identify screens | "rebuild the bookkeeping app shown in this Bilibili video" |
| **Remix** | minimal-layer restyle of a cloned prototype (palette/type/motion/layout) with automatic re-validation | "keep the layout, make it dark cyberpunk with springy cards" |
| **Export** | optional Figma MCP bridge to turn the prototype into editable hi-fi design files | "export this prototype to Figma" |

## Quality gates (why "green" here means something)

Every gate is a script you can run yourself; `scripts/regress.mjs` runs all of them over every run and writes `report/regress-<ts>.md`:

- `doctor.mjs` — environment probes (adb/permissions/click channels) before anything else.
- `qa/interact.mjs` — **clicks every control** in every view and asserts an observable change (`dead=0`).
- `qa/inspect.mjs` — hard gates: live-views (no screenshot-as-view), placeholder-scan, asset-qa (blur/blank/truncated/collage), layout-sanity (clipped/empty-slot/broken-img), privacy-anon, paths-sanity, appicon-present, structural-critique, **ui-smoke** (shell smoke, see below).
- `qa/ui-smoke.mjs` — clicks the *shell*: play/export-download/share/device/annotate-write/product-write/variant-write/canvas-label typography/`?chrome=0`/filter/help/code view.
- `fidelity.mjs` / `qa/fidelity-all.mjs` — pixel diff vs source with correct view↔capture pairing (`knowledge/source-map.json`), plus style-parity.
- `qa/critique.mjs` — VLM structural critique on suspicious views (pixel metrics are structurally blind on sparse light UIs).
- `qa/privacy.mjs` — real names/faces/PII must be anonymized or genimg-replaced; brand assets require `knowledge/consent.json`.
- `eval.mjs` — aggregate score (fidelity/interactivity/perf/ux/stability/privacy).

## Install

```bash
# any Agent-Skills client
npx skills add hello-cqq/design-clone
# or clone / or dist/*.zip for CLI-less platforms
git clone https://github.com/hello-cqq/design-clone && cd design-clone
cd skills/design-clone/scripts && npm install && npx playwright install chromium
node doctor.mjs
```

## Quick start (one command)

```bash
# website → prototype → gates → local server
node skills/design-clone/scripts/clone.mjs --target hn --platform web \
  --url https://news.ycombinator.com --serve

# or step by step
node skills/design-clone/scripts/web/capture.mjs --url https://news.ycombinator.com \
  --out ./demo-run/capture --max-pages 5 --assets 6
node skills/design-clone/scripts/serve.mjs ./demo-run --port 4210
open http://localhost:4210/prototype/

# gates
node skills/design-clone/scripts/qa/inspect.mjs http://localhost:4210 hn --run ./demo-run
node skills/design-clone/scripts/qa/ui-smoke.mjs --run ./demo-run --base http://localhost:4210
node skills/design-clone/scripts/eval/eval.mjs --run ./demo-run --base http://localhost:4210
```

GUI capture of a real device/app requires an explicit consent receipt (`knowledge/consent.json`) — see [safety-rules](skills/design-clone/references/safety-rules.md).

## Privacy & IP boundary

- Captures never leave your machine; the local server binds loopback only and write APIs are whitelisted.
- Personal text is anonymized and personal faces are replaced with generated, style-matched fictional portraits (`knowledge/privacy.json`, hard-gated).
- Brand assets (logos/icons/illustrations) are copied **only from your own captures** and only with a consent receipt; generated runs declare provenance in `assets-manifest.json`.
- Cloned output must not be published or sold as original work. This repo ships **no third-party app screenshots, logos or fonts** — `design-clone-runs/` is gitignored and the built-in demo target is self-authored.
- Details: [PRIVACY.md](PRIVACY.md), [docs/PROVENANCE.md](docs/PROVENANCE.md), [SECURITY.md](SECURITY.md).

## Repo layout & docs

- `skills/design-clone/` — the skill (SKILL.md + scripts/ + references/ + schema/ + presets/ + templates/)
- `docs/` — [VISION](docs/VISION.md) (the living PRD for this repo), [DECISIONS](docs/DECISIONS.md) (ADRs), [RESEARCH](docs/RESEARCH.md), [LESSONS](docs/LESSONS.md) (127 field lessons), [ROADMAP](docs/ROADMAP.md)
- `dist/` — CI-packaged zip for CLI-less platforms (never hand-edited)

English is the reference language for code comments and docs; [README.zh.md](README.zh.md) is the Chinese edition.

## Try it without touching anyone's IP

`demo/` ships a self-authored sample app (Orbit Tasks, original design, no third-party assets):

```bash
python3 -m http.server 8099 --directory demo
node skills/design-clone/scripts/clone.mjs --target orbit --platform web --url http://127.0.0.1:8099/ --serve
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Short version: read `docs/VISION.md` + `docs/DECISIONS.md` first, keep `SKILL.md` frontmatter to the 6 portable fields, scripts must be bare-bash-invocable with zero paid/GPU deps, and every workflow change lands with its gate + docs update in the same commit.
