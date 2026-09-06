# Third-party notices

Code in this repository is MIT (see `LICENSE`). The following third-party components are used at **runtime or build time**; none of their code is vendored into this repo, and none of their *assets* (icons, fonts, logos, screenshots) are redistributed here.

## Runtime / dev dependencies (`skills/design-clone/scripts/package.json`)

| Package | License | Used for |
|---|---|---|
| `playwright` | Apache-2.0 | headless Chromium: capture, view screenshots, QA gates, export orchestration |
| `sharp` | Apache-2.0 (links prebuilt libvips, LGPL) | image crop/resize/trim in asset extraction and asset QA |
| `pixelmatch` | MIT (Mapbox) | pixel-diff fidelity gate |

System tools invoked when present (never bundled): `adb`, `ffmpeg`, `yt-dlp`, `lux`, `you-get`, `scrcpy`, `simctl`. Each is used under its own license; `doctor.mjs` reports what is available.

## Browser-side

| Component | License | Notes |
|---|---|---|
| ~~Tailwind CSS browser build~~ | MIT | **Removed in 0.5.0 (ADR-051).** The utility-class subset used by views is now compiled locally by `scripts/gen/utility-css.mjs` into `prototype/utilities.css` (incl. scoped preflight); parity vs the CDN build verified pixel-identical. No Tailwind code or assets ship in this repo. |

Generated prototypes depend on **no runtime CDN**: views use `templates/components/*.css` + `knowledge/tokens.css` + per-run `utilities.css`, all shipped inside the run.

## Methodology inspirations (no code copied)

Design/process patterns were studied from MIT-licensed projects and re-implemented from scratch: `baoyu-design`, `huashu-design`, `plannotator/effective-html`, `laowangba-pmprototype-skill`, `open-design`, `Design2Code`. See `docs/RESEARCH.md` for what was taken (ideas, checklists) and what was deliberately not (code, assets).

## Iconography & status-bar glyphs

Shell glyphs (signal/wifi/battery in the injected status bar) are hand-drawn SVG paths in `templates/prototype/inspector.js`, following the *filled* style convention; they are original geometry, not extracted from any platform asset. Platform brand icons inside runs are cropped from **the user's own captures** with a consent receipt, or generated; see `docs/PROVENANCE.md`.

## Fonts

No font files are shipped. Prototypes reference platform font stacks (SF/PingFang/Inter/system-ui); `presets/lib-index.json` maps families to OFL alternatives by *name only* and never downloads proprietary fonts.
