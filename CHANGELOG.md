# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/); versioning is SemVer and mirrors `SKILL.md → metadata.version`.

## [0.5.0] - 2026-09-06

### Added
- `qa/ui-smoke.mjs` — shell smoke gate: real clicks on play / export download / share / device switch / annotation-product-variant writes / canvas label typography / `?chrome=0` / left-rail filter / shortcut help / code view. Wired into `inspect` (fast) and `regress` (full, incl. a real zip download).
- Export to the user's machine: zero-dependency store-only zip builder in the inspector, `showDirectoryPicker` directory export, export concurrency lock + busy state; server returns file payloads via `returnFiles`.
- Writable living-PRD: annotation editor (click element in annotate mode), product-note editor in the detail board, "save as variant" persisting `prototype/variants/<name>/` + `variants-index.json` (same contract as `apply-patch.mjs --variant`), all with offline localStorage fallback and explicit toasts when only local.
- Left-rail page/scene filter, `?` shortcut help overlay, share dropdown (state link / clean embed / card view / fullscreen demo), device dropdown rendered from a single `DEVICES` source with persistence + URL sync.
- `docs/PROVENANCE.md`, `docs/THIRD-PARTY.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`, `.editorconfig`, issue/PR templates; English-first `README.md` + `README.zh.md`.

### Fixed
- Exported `+ann` PNGs were byte-identical to unannotated ones (annotation overlay is a sibling of `#dc-stage`): annotation exports now clip-capture the device box.
- Path PNG export always 500s (selector `data-pathrow` never rendered) — rendered + server-side fallback.
- Play button was scene-only and silently no-op in pages mode; play now resolves from the current page/roots, falls back to demo journeys, and reports missing `paths.json`/`journeys.json` with the fix command. Play-chain crashes (`null.edges`) after a session ended mid-await are guarded.
- Canvas wire labels/numbers rendered near-black and scaled with canvas zoom: typography moved out of JS inline styles into CSS (`--sh-mark`, `.wbadge/.wnum/.elabel`) with `1/z` counter-scaling.
- Mobile IM rows rendered name+sub on one line (`display:block` on `.mi-row .name/.sub`); desktop conversation rows gained a proper `.da-conv` definition.
- Stale annotations (target renamed/removed) no longer vanish silently — surfaced in the detail board and excluded from the count badge.
- `serve.mjs`: path prefix check now separator-aware, malformed POST JSON returns 400 instead of crashing, 8 MB body cap, handler-level error catch, unhandled-rejection guards, variants added to the write whitelist.
- Variant index name mismatch (`variants.json` vs `variants-index.json`) made CLI-created variants unreachable via `?variant=`.
- Demo captions rendered literal `undefined` for journey steps lacking `result.kind`.
- `critique` gate accepts placeholder `TODO:` notes as passing — now a hard fail for required views.

### Changed
- Device labels normalized to 手机 / 平板 / 桌面 / 网页 across UI, prompts and docs.
- Status bar and toast styling moved from JS inline `cssText` into `inspector.css` (`.dc-sb-injected`, `#dc-toast`).

## [0.4.0] - 2026-09-05..06

M44 series: full-control interactivity (`runtime.js` + `qa/interact.mjs`, dead=0 gate), one-command `clone.mjs`, generic privacy gate + asset provenance, structural critique gate, adaptive genimg with self-check loops, geometry gates (layout-sanity), unified entry router, app icons + showcase contract, regression/autofix infrastructure. See `docs/ROADMAP.md` and `docs/LESSONS.md` 106–121.

## [0.1.0] - 2026-09-03

Initial public shape: capture (web/android/desktop/link), spec-driven generation, inspector v4 shell, fidelity/eval gates, MIT license.
