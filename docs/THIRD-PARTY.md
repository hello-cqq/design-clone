# Third-party notices

Code in this repository is MIT (see `LICENSE`). The following third-party components are used at **runtime or build time**; none of their code is vendored into this repo. Third-party *assets* are absent except one **registered exception**: four curated official brand icons (`skills/design-clone/references/official-icons/`), listed below with source and trademark notice.

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

## Curated official icons (registered exception, M98)

| File | Source | Trademark | Used for |
|---|---|---|---|
| `official-icons/aliyun.png` / `aliyun-mark.png` | `img.alicdn.com` official brand CDN (URL pinned in `scripts/gen/probe-icon.mjs`) | Alibaba Cloud | gallery icon curation fallback; republished as `aliyun-console/icon.png` in the prototype repo |
| `official-icons/lark.png` | `p1-hera.feishucdn.com` official brand CDN (URL pinned in `probe-icon.mjs`); local vector counterpart `lark.svg` | ByteDance / Feishu | same; republished as `lark/icon.png` |
| `official-icons/wechat.png` | WeChat official brand asset (curated 2026-09; local vector counterpart `wechat.svg`) | Tencent | same; republished as `wechat/icon.png` |

These are **study-replica curation assets**: the gallery labels every brand clone with `brand_disclaimer` and `ip_attestation=public-material`; trademarks remain property of their owners; no logo is modified beyond resize. `qa/ip-scan.mjs` REGISTERED list pins exactly this directory — any other binary asset fails the gate.

## Iconography & status-bar glyphs

Shell glyphs (signal/wifi/battery in the injected status bar) are hand-drawn SVG paths in `templates/prototype/ins/` (built to `inspector.built.js`), following the *filled* style convention; they are original geometry, not extracted from any platform asset. Platform brand icons inside runs are cropped from **the user's own captures** with a consent receipt, or generated; see `docs/PROVENANCE.md`.

## Fonts

No font files are shipped. Prototypes reference platform font stacks (SF/PingFang/Inter/system-ui); `presets/lib-index.json` maps families to OFL alternatives by *name only* and never downloads proprietary fonts.
