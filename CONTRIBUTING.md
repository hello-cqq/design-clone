# Contributing

Thanks for helping make clones honest and gates meaningful. This file is the executable version of our house rules; the *why* lives in `docs/VISION.md`, `docs/DECISIONS.md`, `docs/LESSONS.md`.

## Before you write code

1. Read `docs/VISION.md` (what this is for), `docs/DECISIONS.md` (ADRs — deviate only by amending an ADR first), `docs/LESSONS.md` (127 ways we got bitten).
2. Reproduce with a gate, not an anecdote. If no gate catches your bug, **the gate is part of the bug**: add/extend one (`qa/ui-smoke.mjs` for shell behavior, `qa/inspect.mjs` gates for artifacts, `node:test` unit tests for pure logic).
3. skill-first discipline: fix the skill (scripts/protocols/templates) first, then propagate to existing runs via `scripts/sync-shell.mjs` or `gen/wire.mjs`; never hand-patch a run into looking right.

## House rules (AGENTS.md, enforced in review)

- `SKILL.md` frontmatter: only `name, description, license, compatibility, metadata`; `name` must equal the directory name; no platform-private fields (keeps the skill portable across agent CLIs).
- Every script is a standalone entry point invocable with bare bash (`node scripts/x.mjs --help`) and depends only on `scripts/package.json`-declared packages plus system tools (adb/ffmpeg/…). No paid APIs, no GPU runtime deps.
- Workflow changes land in the same commit as their doc sync: `SKILL.md` → relevant `references/*.md` → `schema/` when artifact shapes change.
- Relative paths only in skill files; artifact layout per `skills/design-clone/references/directory-spec.md`.
- IP/privacy: no third-party brand assets, fonts, screenshots or faces in tracked files; captures stay in gitignored runs with `knowledge/consent.json` + `knowledge/privacy.json`. See `docs/PROVENANCE.md`, `SECURITY.md`.
- Styling discipline in the inspector: JS writes **geometry only** (positions/sizes/transforms); typography & color live in `inspector.css` classes + theme vars. A static gate (`ui-smoke → no-inline-typography`) fails violations.
- No silent failures in UI code: every user action produces progress, a result, or an explanatory toast/modal (including "what is missing and which command fixes it").

## Dev environment

```bash
cd skills/design-clone/scripts && npm install && npx playwright install chromium
node doctor.mjs
# full regression over all runs (starts a server per run, ~minutes)
node regress.mjs [--runs a,b] [--full]
# unit tests (node:test, zero new runtime deps)  [Phase 2]
npm test --prefix scripts
```

Editor: `.editorconfig` (LF, utf-8, 2 spaces, final newline). Lint/typecheck config arrives with the Phase-2 hardening; until then the gates above are the contract.

## Commit & PR

- Small, revertible commits; message states run/milestone context (e.g. `M44k: export downloads to local + ui-smoke gate`).
- PR body uses `.github/PULL_REQUEST_TEMPLATE.md` and includes gate output lines (`dead=`, `inspectFail=`, `smokeFail=`, `warnFail=`).
- Record a lesson in `docs/LESSONS.md` for every non-obvious failure you fix, with the skill location that now prevents it; add a `docs/ROADMAP.md` row for milestone-sized work.
- Releases: bump `SKILL.md metadata.version` + `CHANGELOG.md` together; CI packages `dist/*.zip` (never commit the zip).

## Good first contributions

- Harden a gate against a failure you hit (see `docs/LESSONS.md` for templates of past fixes).
- Extend `templates/components/*` contracts + snippets for a control kind missing from `controls.md`.
- Improve `references/recovery.md` rows for gate failures you had to diagnose by hand.

## Lint/type tightening roadmap (M45 baseline)

Day-one state (kept green on purpose): eslint **0 errors / ~19 warnings**, `tsc --noEmit` over the three pure modules only.
Tighten in small PRs, never in drive-bys:

1. Convert remaining `no-unused-vars` warnings: either use the value, prefix `_`, or delete dead code (cross-fragment false positives in `templates/prototype/ins/*` are exempt — the whole IIFE is checked via `inspector.built.js`).
2. Promote `eqeqeq` and `no-var` warnings to errors once their counts hit 0.
3. Extend `tsconfig.json` include one module at a time (next candidates: `serve/static.mjs`, `serve/write.mjs`, `gen/utility-css.mjs`), fixing real type bugs as they surface.
4. Add a `complexity`/`max-lines` budget for new files only (legacy sections are being shrunk via extraction, not rewrites).
