# Provenance & IP boundary

This document answers one question with evidence: **what in this repository is original, what is derived, and what is deliberately absent?** It exists so contributors and reviewers can audit claims instead of trusting them.

## 1. What is original (written for this repo)

- All scripts under `skills/design-clone/scripts/` (capture orchestration, generators, gates, exporter, server).
- The inspector shell (`templates/prototype/index.html` + `templates/prototype/ins/` 17 segments, built to the gitignored `inspector.built.js`; plus `runtime.js`/`inspector.css`/`zipstore.js`) and the three component libraries (`templates/components/{mobile-im,desktop-app,web-marketing}.css` + their `.md` contracts).
- The schema (`schema/page.spec.schema.json`), presets (`presets/*`: genimg styles, style-pick index, component pattern index), and all docs.
- Status-bar/shell SVG glyphs: hand-drawn paths (see `docs/THIRD-PARTY.md`).

Verification aids: `git log` shows incremental authoring; no bulk imports of foreign UI code exist; component files carry internal milestone comments (`M18`, `M44f`, …) matching `docs/ROADMAP.md`.

## 2. What is derived (ideas, not code or assets)

Methodology patterns studied from MIT-licensed projects and re-implemented from scratch — listed with what was taken in `docs/RESEARCH.md`: baoyu-design, huashu-design, plannotator/effective-html, laowangba-pmprototype-skill, open-design, Design2Code. **No source files, CSS or assets were copied from them.**

`presets/lib-index.json` is a *thin index*: it names third-party component libraries (Ant Design, MUI, shadcn/ui, …), icon sets and font stacks, and records official URLs and structural patterns **only**. It never bundles their code, and SF Symbols is referenced by name with an explicit "no scraping" rule (fallback: lucide, by name).

## 3. What is user-captured (and therefore absent from this repo)

Runs (`design-clone-runs/`, gitignored) contain captures of real products: screenshots, ui-trees, recordings, cropped brand assets, anonymized mock text. Per run:

- `knowledge/consent.json` — receipt that the operator owns/consents to the capture (required before GUI capture; hard gate).
- `knowledge/privacy.json` — anonymization map; real personal names/faces replaced (generated fictional portraits), kinship terms kept.
- `prototype/assets-manifest.json` — per-asset provenance (`source-original` / `crop` / `genimg`), written automatically by `extract-assets.mjs` / `genimg.mjs`.
- Gates: `qa/privacy.mjs` (PII/real-name/face), `img/asset-qa.mjs` (quality), `qa/critique.mjs` (structure).

Because runs are gitignored, **this repository ships zero third-party screenshots, faces or fonts**, and zero third-party logos except the four curated official icons registered in `docs/THIRD-PARTY.md` §Curated official icons (M98). CI never uploads runs; `dist/*.zip` contains skill code plus the registered icon directory only.

## 4. Rules enforced in code (not just in prose)

1. GUI capture refuses to start without `knowledge/consent.json`.
2. Payments, passwords and CAPTCHAs pause for a human; never automated.
3. Personal text is anonymized; `qa/privacy.mjs` fails runs containing phone/ID/email/wxid patterns or known real names from the anon map.
4. Personal real faces must be genimg-replaced; official/merchant marks may be kept only as `keep_brands` with provenance.
5. Cloned output is labeled a clone: handoff docs declare coverage/exclusions; showcase entries carry `source` metadata.
6. Exports never embed the inspector chrome (`?chrome=0`) so downstream consumers get prototype pixels only.

## 5. Enforcement (implemented, M45+; CI-wired)

- `qa/ip-scan.mjs` (CI, `npm run scan`): fails on any tracked binary outside the REGISTERED list (site brand assets, README figures, curated official icons), on foreign copyright headers, and on tracked run/dist artifacts.
- `qa/secret-scan.mjs` (CI): fails on key/token/phone/ID patterns in tracked files.
- README/gallery visuals come from self-authored demo scenes (`site/assets/demo-anim.js`) and original-concept runs (`gen-*`), never from cloned third-party UI pixels.

## 5b. Brand assets of this project (self-authored chain)

- `site/assets/ident-{light,dark}.*.mp4`: user-provided AI-generated videos (Doubao) → per-frame corner-watermark inpaint → H.264 + faststart + delogo → dark variant hflip; posters inlined base64 in `ident.*.js`.
- `site/assets/logo-anim-{light,dark}.webp` + `docs/img/logo-anim-*.gif` + `logo-mark{,-dark}.png`/favicons: M95 green-screen re-key of the user-provided day/night source videos (`archive/logo-source-{day,night}.mp4`, outside this repo) — plane-fit background key + despill; dark variant = three-band ice posterize.
- All above carry no third-party likeness; character designs originate from the user's own generation tools.

## 6. If you believe something here infringes your rights

Open an issue with the specific path and right concerned, or contact the maintainers per `SECURITY.md`. Takedowns of user-captured material are the operator's responsibility per the consent receipt; repo-side material will be removed or re-licensed promptly when a valid claim is shown.
