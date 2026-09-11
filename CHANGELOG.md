# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/); versioning is SemVer and mirrors `SKILL.md → metadata.version`.

## [0.6.0-snapshot.20260911] - 2026-09-11

Snapshot build（prerelease）。覆盖自上一 tag 的全部变更；正式版手动发车（--minor）。

### M54.1
- : release.mjs ROOT 路径修正（scripts→repo 三级）

### M54(D-F)
- : 三 agent 真装验证 + headless 端到端实证（opencode/codex 全绿、claude 账号资格 403 如实记录）+ report/agent-e2e.md + LESSONS 149-150/ROADMAP M54

### M55(A-C)
- : 官网 site/（EN 默认+中文切换、archify 式五页、画廊+proto 详情 iframe+贡献者/版本/zip）+ pages.yml（含画廊 fallback 快照）+ publish.mjs（--app/--flavor 发布器：门强验/白名单剥离/PII/80MB/meta+version.json+PROVENANCE/gh PR）+ SKILL §F Publish 模式 + references/publish-guide.md

### M54(A-C)
- : install.sh 一键安装器 + release.mjs/release.yml 发布车 + version-sync 门 + doctor 版本打印 + npx skills 实测 + README/SKILL/install-guide 安装与发布文档

### M53
- : 宠物乐园 2.5D 萌宠 demo 替换 orbit（自研原创 run + 源站）

### M51.1
- : collect-design 宽松解析旧 run 的 window.DC（JS 对象字面量键未加引号 → JSON.parse 失败，link-dy1/xhs2 导出门假红根因）

### M51
- : 设计产物链——生成期初始 spec/figma 源 + 导出=编辑后重导出

### M52
- : 圆周轨迹探索页按参考图精细化重建（矢量地图+组件层，根除贴图）+ 普适防复发门

### M50
- : 双 id 空间归一(白卡/双根根除)+树=BFS 层级树(毛发球/组合爆炸根除)+giant-chain 改评 paths

### M49.1
- : parity 选择器 tag-agnostic（漏 data-act/span-goto 致覆盖假低）+ 存量保真债校准（新 run 硬拦/存量 warn+report/parity-debt.md 公示）+ sly/wechat 补接线一轮；LESSONS 143

### M49
- : 缓存根治(文件名哈希+boot自愈)+数据线/标注定稿+树/路径职责定稿+sly探索页重建+demo全门

### M48.4
- : unstyled-view-classes 门改 computed 视觉处理判定（后代选择器/inline style/hook 类不再误报，wb 49/50 误报修复）；xhs5 卡片接线（dead 4→0）

### M48.3
- : link-xhs5 三视图补样式表（此前整 run 无 CSS=静默坏块）；inspect 新门 unstyled-view-classes（带类元素 >50% 无规则=缺样式表，杜绝此类静默全绿）

### M48.2
- : utilities preflight 封顶裸 b/strong=600（link-dy1/xhs2 的 <b> 默认 700 被新门拦，根治到生成器）；全 run 重生成

### M48.1
- : utility-css 字重封顶 600（bold/extrabold/black→600，CJK 黑粗根治到生成器）+ 任意值 shadow-[…]/drop-shadow-[…] 编译支持（此前 9 个 unknown 令牌丢阴影）；全 run utilities 重生成

### M48
- : 排版预算+路径方向化+overlay 保真（用户四图打回后全量清）

### M47.3
- : regress insBroken/smkBroken 改 summary 判定（门失败 exit 2 带 summary 是有效结果，此前被误标 BROKEN；M47.1 只修了 iaBroken）

### M47.2
- : slytherin emoji 字形清零；regress 子门超时 900s→2400s

### M47.1
- : regress 重试只认无 summary 的瞬态崩溃；placeholder-blocks 豁免模态 scrim

### M47
- : 选中回退链+壳缓存废+hub 画布不空+门解耦

### M46
- : 五 run 视觉重修+门加严（用户逐图打回后）

### Other
- docs: 仓库地址指向实际 GitHub 账号 hello-cqq/design-clone
- design-clone skill M0-M20: capture→live-prototype pipeline with quality gates (live-views/asset-qa/fidelity/privacy), 16 validated runs excluded via .gitignore, CI+packaging, MIT

### M45(repo)
- : 开源工程面——双语文档/许可边界/CI/lint/ts/自证扫描/单测入口

### M44k+M45(skill)
- : 外壳功能修复+冒烟门+serve 加固拆分+inspector 分段源+utility 本地编译

### M44c-h
- : interactive+privacy+paths-logic+appicon+entry+regress ultimate pass

### M41
- : 照猫画猫 principle (per-capture inventory, no app-specific convention, no approximation); wechat 09/11/13 avatars fixed as transcription outputs; 19 views audit bad=[]

### M40
- : general faithful-regen pipeline as sole generation path (app-agnostic, no special-casing); wechat 13/15/17 regenerated faithfully (5 real member avatars, bottom tabbar, local-life miniprogram); 19 views audit bad=[]

### M39
- : autonomous per-view regen loop (one-command, agent self-iterates to fidelity<=0.15/truncated=0, no user prompting); fix 04-me header+avatar, 12 right-strip; wechat 19 views audit bad=[]

### M38
- : s2c-effect via host-agent-as-generator (zero-key, cross-agent); vendor s2c prompt (s2c-prompt.md); wechat 01/02/03/04/12 faithful rebuild (colored SVG icons/avatars, block name/sub, tabbar pin); audit bad=[]

### M35-37
- finish: doctor prompt table (unlock/foreground/s2c-opt/chromium/visual-consent); s2c-adapter+s2c_gen+translate (opt-in no-key-assume); spec2view hierarchical rewrite; 16 runs fail:0 eval 17 PASS

### M36/37
- : qa/audit.mjs per-view render+label-recall+truncated+side-by-side (capture-time id mapping); verify-page + capture.sh snap awake/foreground guard; mobile-im tabbar pin; slytherin component rebuild; wechat 11/12/13 capture-waive (phone off/DingTalk, need recapture)

### M30/31
- : rebuild wechat broken compiled views as component views (01/02/03/04/05/11/13) with real cropped icons/avatars; add truncated-text hard gate; s2c deep-research (self-render loop/VLM asset extraction) + decision hybrid; R1-R3

### M29
- : SKILL.md gen-pipeline section + ROADMAP M24-M28; interaction link-up (wechat 01 inter .45/04 .5); compile 11-single-chat .021; spec2view --width for web/desktop; restore web hand homes + parity-log; gates green

### M28c
- : unlock-phone re-dump wechat 02/05/12/13 (full trees); compile 02/05/13 (0.02-0.05); fidelity --waive for anonymized views; eval respects waive; gates green

### M28
- neuro-symbolic pipeline: measurement adapters (ui-tree/DOM/AX) + annotate SoM + spec2view compile (bounds->%, pixel-sample, bbox-crop, overlay layers); wechat trees dumped w/ page-verify; wechat01=0.08 slytherin01=0.055; meta/semantic-pass; A46+LESSONS102-105; all runs PASS

### M23
- final: 1:1 audit rebuild (apple DESIGN.md tokens, aliyun/lark/workbuddy/wechat/slytherin parity), parity.mjs per-control/interaction gates, capture snap settle+dump, asset-qa waive, critique 9-dim, tokens 3-layer; 17 runs PASS

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
