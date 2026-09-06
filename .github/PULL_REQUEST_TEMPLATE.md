## What & why
<!-- one paragraph; link the issue -->

## Type of change
- [ ] Fix (user-visible bug)
- [ ] Gate/QA (new or hardened check)
- [ ] Workflow change (SKILL.md ↔ references ↔ schema synced in this PR)
- [ ] Architecture (ADR in `docs/DECISIONS.md` included)
- [ ] Docs only

## Checklist (repo rules, AGENTS.md)
- [ ] `SKILL.md` frontmatter still only `name, description, license, compatibility, metadata`; `name` == directory name
- [ ] scripts remain bare-bash invocable (`node scripts/x.mjs --help`) and use only declared deps + system tools
- [ ] workflow changes synced: SKILL.md → relevant `references/*.md` → `schema/` if artifact shape changed
- [ ] new failure modes recorded in `docs/LESSONS.md`; milestone row in `docs/ROADMAP.md`
- [ ] no third-party brand assets/fonts/screenshots added to tracked files (`docs/PROVENANCE.md`)
- [ ] no secrets/PII in tracked files or fixtures

## Verification
```bash
node skills/design-clone/scripts/doctor.mjs
node skills/design-clone/scripts/regress.mjs --runs <affected>   # or full
node skills/design-clone/scripts/qa/ui-smoke.mjs --run <run> --base <url>
```
Paste the summary lines (dead / inspectFail / smokeFail / warnFail) here.

## Rollback plan
<!-- which sync-shell/flag restores prior behavior, if any -->
