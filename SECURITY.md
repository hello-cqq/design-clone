# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| 0.5.x | ✅ |
| < 0.5 | ❌ (pre-audit; upgrade) |

## Reporting

Email the maintainers via the contact in the repo owner profile, or open a **private** issue if the platform offers it. Please do not file public issues for unexploited vulnerabilities. Include: affected script/version, reproduction steps, and whether you observed exploitation beyond your own machine. We aim to acknowledge within 7 days.

## Threat model & built-in controls

design-clone runs a local HTTP server (`scripts/serve.mjs`) and shell-outs to adb/ffmpeg/Playwright. The controls below are regression-tested where feasible (`qa/ui-smoke.mjs`, code review checklist in `CONTRIBUTING.md`):

- **Loopback-only writes.** `POST /__dc_write__` and `/__dc_export__` reject non-loopback peers (403). The server is a local preview/orchestration tool, not a network service; do not expose it (no TLS, no auth).
- **Write whitelist.** Only `prototype/{edit-overrides,layout-overrides,annotations,products,paths,variants-index}.json` and `prototype/variants/<name>/{tokens.json,tokens-override.css,layout-overrides.json}` are writable; anything else is 400.
- **Path containment.** Static reads and whitelist writes resolve through `path.normalize` and are compared against `root + path.sep` (separator-aware prefix check, so sibling directories like `<root>-secret` cannot be reached).
- **Body limits & crash safety.** POST bodies are capped at 8 MB; malformed JSON returns 400; the request handler has a catch-all 500; `unhandledRejection`/`uncaughtException` are logged instead of killing the server.
- **Export payloads.** `returnFiles` caps base64 payloads at 48 MB per request; larger exports stay server-side and the UI says so.
- **No secrets in artifacts.** Gates (`qa/privacy.mjs`, CI secret scan) fail runs containing phone numbers, IDs, emails, wxids or key-like strings; captures and runs are gitignored and never published by tooling.
- **Consent before GUI capture.** Capturing a real device/app requires `knowledge/consent.json`; the tool pauses on payments, passwords and CAPTCHAs instead of automating them.

## Known non-goals

- The inspector trusts the run directory it serves (it is your own artifact tree). Do not serve untrusted directories.
- `file://` usage of exported prototypes has no script-isolation guarantees beyond the browser's own; the served mode is the supported one.
- Third-party dependencies (Playwright, sharp, pixelmatch) are tracked in `docs/THIRD-PARTY.md`; their vulnerabilities are theirs to fix and ours to bump.

## Disclosure coordination

If a report affects a dependency, we coordinate upstream first and ship a version bump + `CHANGELOG` note. Credit is given unless you ask otherwise.
