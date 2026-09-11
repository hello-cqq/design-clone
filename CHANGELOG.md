# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/); versioning is SemVer and mirrors `SKILL.md → metadata.version`.

## [0.6.0-snapshot.20260911.1] - 2026-09-11

Snapshot build（prerelease）。覆盖自上一 tag 的全部变更；正式版手动发车（--minor）。

### M69
- : 双联图织入动画——seam 循环片尾定格卡(hold 1.4s 兼循环缝合)+bridge 主题转场桥(昼夜之门)；移除首页静态 mark；相位机+__ident.phase() 钩子；LESSONS 161/ROADMAP M69

### M68
- : 定制 SVG 字标——design+克隆对连字符+渐变clone+回声残影(hover微交互)，CSS变量主题自适应，导航+footer单源注入；LESSONS 160/ROADMAP M68

### M67
- : 定稿 logo 羽毛融合（女昼/男夜导航+双联主 logo/favicon）+安装单命令化+删三处副标题

### M62
- : 画廊就绪三件套+petpark 3D 萌宠重建+README 重设计+站点适配
- : 首页片头 ident——设计师坐水面→躺下→铅笔描云→水镜倒映背影（9s 单时间轴连续骨骼动画、零切帧）；genimg anime 镜湖背景+圆框眼镜静态头像(nav/favicon)；播放一次定格+点击重播+reduced-motion 终帧；LESSONS 154/ROADMAP M62

### M66
- : 生成式干净头像 logo（女左/男右）——genimg 肖像+rembg 抠像+裁水印+主题渐变底合成，替换视频帧裁切；LESSONS 158/ROADMAP M66

### M65
- : ident 循环播放(片尾冻结1.4s+dip缝合)+双video/halo主题交叉淡化转场+页面token过渡+去lockup/replay文字+头像logo(男右女左)

### M64
- : 视频 ident（用户 AI 视频终源）+灵宠浮景去矩形+新海诚质感双主题+logo 主题联动

### M61
- : 圆框眼镜设计师+水镜微电影首页（抱膝坐→镜头缓移→躺下→水面镜像=克隆隐喻，14s 单时间轴 loop、reduced-motion 静态水镜帧）；favicon/导航=静态头像 logo-head.svg；M60 位图吉祥物下线

### M60
- : 吉祥物升级 genimg pixar-3d 生图版（与 3D 萌宠同管线）——seed22 选定、裁水印/头切 favicon、CSS 分身薄荷虚影+烟雾环+星点+接地投影装配、reduced-motion 静止；旧手写 SVG 吉祥物下线；prompt 存档 mascot-prompt.md

### M59
- : 原创 Q 版设计师吉祥物（影分身概念、零 IP 参照）——针织帽+橙卫衣+stylus 画笔+薄荷分身；favicon.svg 头部标 16px 可辨 + logo-static.svg 导航态 + 首页动态（弹跳/分身错时弹出/烟雾环/火花画线框/眨眼/帽球摆）；reduced-motion 静止

### M58
- docs: report/site-perf.md（并发/性能/功能测试报告：千并发零错误 p95<200ms、E2E 20 轮全绿、CI site job）
- : logo 影分身结印重画+首行动画组/火焰热度/封面底直角/footer 链接移除/头像真实 login(index API)/star 内嵌快照/iframe 重试；测试三件套 e2e(20轮)+loadtest+CI site job

### M57
- : 官网三轮打磨——hero 三行居中+灵动 logo v3(蹲姿结印+分身)/功能演示全宽真实场景动画/精选 3:2 封面+名称行+头像/详情一屏+面包屑+看板五项+免责脚注/导航 GitHub 按钮同款 pill+star/对齐统一

### M56
- docs: LESSONS 153 + ROADMAP M56
- : 官网 v2 —— 影分身忍者 logo+光感滑动 nav+star 徽章+Home(hero/安装/体验位/四tab步骤动画/Top4 按下载)+Gallery(tags 筛选/搜索)+详情左交互右看板(下载量按钮/跳转源码)；契约 v2 配套（publish 去 flavor、meta 双语）；proto 仓 SPEC v2+平铺迁移+cover 修复

### M55(D-E)
- : 官网挂入口+LESSONS 151-152+ROADMAP M55（平台全链路：建仓→publish→PR→Release→索引→官网 E2E 全绿）

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
