---
name: Bug report
about: A gate passed but something is broken, or a script crashes
title: "[bug] "
labels: bug
---

## What happened
<!-- one paragraph -->

## Reproduction
```bash
# exact commands, including run dir shape (web/android/desktop/link) and OS
```

## Expected vs actual

## Evidence
<!-- qa/*.json, report/*.md, screenshots of YOUR OWN demo target preferred; do not attach third-party app captures you lack rights to -->

## Gates already run
- [ ] `node scripts/doctor.mjs`
- [ ] `node scripts/qa/interact.mjs --run <run> --base <url>`
- [ ] `node scripts/qa/inspect.mjs <url> <name> --run <run>`
- [ ] `node scripts/qa/ui-smoke.mjs --run <run> --base <url>`

## Notes
Which lesson in `docs/LESSONS.md` does this resemble, if any?
