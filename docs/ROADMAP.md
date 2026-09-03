# ROADMAP — 里程碑与状态

| 里程碑 | 状态 | 产物/验证 |
|---|---|---|
| M0 骨架+Web 克隆 E2E | ✅ 2026-09-01 | HN 4 屏+去重+录屏→tokens→spec→原型，逐屏+交互验证（/tmp/dc-e2e 样例；report/notes.md） |
| M1 Android 场景克隆 | ✅ 2026-09-01 | 微信支付路径 4 屏+录屏+安全拦截边；手机壳原型四页验证；真机踩坑全沉淀 |
| 硬化（人接管+跨平台安装） | ✅ 2026-09-01 | human-takeover/install-guide/prepare.sh/doctor 增强/serve+1/A0 总控，真机回归 |
| **Inspector 五模式** | ✅ 2026-09-01 | 微信+HN 双原型验收：批注折线/inspector 面板/故事板/播放/拖拽导出/缩放平移全通（截图存证见会话） |
| 设计工艺注入（baoyu/huashu/effective-html） | ✅ 2026-09-01 | P1-P6：规范三模+状态+a11y+handoff；brand-protocol；DOM tokens；Tweaks+演示模式+变体；walkthrough 导出；文档+回归 |
| M2 链接模式 | ✅ 2026-09-01 | 10 链全通（抖音 4=1 视频+3 图集 / B站 3 视频 / 小红书 3 图文）；xhs2 Moor AI 移动原型+演示视频、bili2 DeskBox 桌面原型、dy2 转风格预设；抽帧去重 tokens 全跑通 |
| M3 Remix | ✅ 2026-09-01 | 三变体并排画布+apply-patch 落回+review.mjs 五维评审（Moor AI 8/8/8/9/7，Fix×2 当轮修）；GUI 拖拽 layout-overrides 持久化 |
| M4 全量遍历 | ✅ 2026-09-01 | 预算制 BFS（pages/seconds/depth 三档实测）+state.json 断点续跑（seq 连续/不重拍）+coverage.json→DESIGN.md 深化段（hn-m4 样例） |
| M5 iOS 模拟器+桌面 | ✅ 2026-09-01 | sim-capture.sh（list/shot/launch/openurl/loop；本机无 Xcode→exit3 三档回落验证）+desktop/capture.sh 实测截屏有效+click/type 门控+WDA 真机引导+win 模板（ios-desktop.md） |
| M6 Figma 导出 | ✅ 2026-09-01 | export.mjs figma-plan.json（4 页 19 节点 14 variables，hex→0-1 抽检通过）+ --apply-nodeids 回填往返验证；MCP 执行侧由宿主按 figma-export.md 两路线走 |
| M7 Inspector 外壳 v2 | ✅ 2026-09-01 | Figma 风格壳（icon rail/Pages/属性面板/缩放 pill/点阵画布）+ --sh-* 双主题跟随系统可记忆；serve.mjs 目录 301 修复用户报障的裸奔页；sync-shell.mjs 五 run 换壳；三原型×双主题截图验收无 JS 错误 |
| M8 一比一保真 | ✅ 2026-09-01 | 三档 pixel/live-high/live-low + fidelity 徽标；extract-assets/tokens-sample/genimg（flux 免费档+缓存节流）/fidelity（pixelmatch）四脚本；微信钱包 pixel 档差异率 3.7%（仅缩放噪声）；xhs 水獭 3D 吉祥物+dy1 黏土机器人替换 emoji |
| M11 Inspector v3 | ✅ 2026-09-02 | Figma IA 重构（页面\|场景+树\|路径+三看板+底栏 pill+灯带）；编辑持久化/撤销/还原；导出六档元素级（原型本体 DPR2）+路径录屏；paths-gen 图驱动；products.json 三要素+再生成提示词；vlm-analysis.md 协议；四 run 回归 16/16×4，导出/持久化 E2E PASS |
| M14 Inspector 质量专项+OD 借鉴 | ✅ 2026-09-02 | 17 项用户反馈全修：URL 状态同步+面包屑联动；paths-gen 正向序（fwd/back，场景永不反转）；场景整卡 iframe 缩放+auto-fit+flowZoom；标注无边框无填充+计数；底栏全图标双模式+边框开关（默认关，开=iOS 灵动岛/设备 bezel）；详情单看板（产品+设计合并，调参降级折叠节）；导出分组+录视频并入+分享/截图；modal 替换原生弹窗；播放器条；预览\|代码 toggle；设备下拉；对照回退链（source-map.json→screens→frames）。OD 借鉴 A–G：移动壳组件模式（references/mobile-shell-patterns.md：状态栏/渐变字符头像/列表行红badge/tabbar/资产梯 crop→matte→pixar-3d）；extract-assets --matte/--erase 亮度抠图；inspect v4 21 硬+5 软检查（emoji/overlap/contrast/overflow/url）；dy-qa2 retrofit 打样。九端口回归 21 硬×9 全过 0 consoleErrors |
| M14c 五连修+巡检 | ✅ 2026-09-02 | 路径点击闪白→iframe load 淡入+chip no-op；连线 elabel 去粗黑改 mut 500、树序号改白底描边圆、流光 2.2/22-78 更醒目；播放钮错位的真因=inline span 基线对齐→#bb-scene display:contents；状态栏图标空心发胖的真因=CSS svg{} 覆盖 fill 表现属性→三处根改 inline style（views×2+SB_ICONS+patterns 种子）；标注重设计：实心 pin 贴目标、引线从 pin 必要一刀穿出、卡片锚定目标+碰撞下移+workspace clamp；巡检顺带修：电池改 60% 电平显缺口、path 基线 1.4/.8。验收：21 硬检查全过×2 轮+逐张截图复核（状态栏/标注/树/路径/底栏/连线放大两帧流光位移） |
| M17 深层完整+隐私+闭环点击 | ✅ 2026-09-03 | settle.mjs 稳定检测/gesture.sh/mask.mjs+privacy-rects/privacy-scan 入 inspect；clickv CGEvent 闭环+DC_FRONT+AXRaise；web --seeds；微信深层 9 屏（单聊/群聊/群设置/好友资料/长按/托盘/小程序/搜索/loading 对，隐私帧 blur 后入原型）wechat-full 19 视图 88 分；Lark 深层 4 屏 mac-lark 14 视图；WorkBuddy 人工 loop 重建 10 视图升 full 93 分；web-apple/web-aliyun 96/96；A45；17 端口回归 |
| M16 完整应用原型+warn 清零 | ✅ 2026-09-03 | 9 run warn retrofit 全清（emoji→内联 SVG、低对比色映射、oklab/alpha 合成/渐变背景三类 contrast 误判根治入 inspect）；completeness-protocol+eval 完整性维度；四完整原型：slytherin 圆周轨迹（10 视图 96 分）、wechat-full（10 视图 93）、mac-lark（10 视图 92）、mac-workbuddy（Electron 不可代操降级 demo 96，A44/LESSONS 88）；desktop/capture.sh 增 wheel；13 端口回归 |
| M15 评测系统+有界自修复 | ✅ 2026-09-02 | scripts/eval/eval.mjs：三维评分（perf=goto 双均+体积；ux=21 硬通过率−warn 罚+覆盖加成；stab=零错误+双跑幂等），total=.3/.4/.3；verdict PASS/FIX；--all 聚合 docs/EVAL-REPORT.md；--diff 看修复增量。references/eval-protocol.md：零容忍清单+warn/perf playbook+循环纪律（≤3 轮、不回退、超限交人工）。SKILL.md §A/§E 挂载"生成后必评"。M14 收尾：恢复 wechat-pay/qa-hn 快照 run（顶层 prototype 空、真身在带日期子目录；补 knowledge/tokens.css 消 requestfailed）+ 9 端口×双跑全绿 |
| M14b 工艺闭环+OD 深读二档 | ✅ 2026-09-02 | 六项反馈根治：场景卡 boot 竞态（applyHash await）；对照左右同尺度+同步滚动；树=思维导图带箭头+选中流光（失选即停/reduced-motion 降级）；路径=chips+单链+流光；导出恰两项+录视频入播放器条；底栏图标对齐；标注线走空白边距。质量闭环：dedup 帧体检（blank/black/blurry）+extract-assets 清晰度守卫+shotdiff.mjs 对照拼图+critique-loop 六维必审≤2 轮；状态栏 OD 填充式 SVG 入种子并 retrofit dy-qa2；promo 素材改源帧真裁剪。验收：9 端口回归（export 两项/path chips/流光断言）+逐项截图复核+dy-qa2 shotdiff 三视图 |
| M13 平台矩阵+检测询问 | ✅ 2026-09-02 | lib-index v2 五平台矩阵（web.form/desktop.os 子档+design_resources 官方链接含 Apple Resources+detection_signals）；vlm-analysis §2 平台检测协议（low/冲突必 question 询问）+knowledge/platform.json；inspector 四档框（c_mobile/c_tablet/c_browser/c_desktop，框顶 chrome 注入）；schema shell enum 扩；qa-web 桌面 demo（HN 浏览器框）16/16；存量 8 run 回填 platform.json；九端口回归 16/16×9；三档框带壳截图验收；Android 真机补拍+dedup 判重通过 |
| M12 抖音三链 E2E+薄索引 | ✅ 2026-09-02 | 三链全 L2 取材（两图文一视频 ffmpeg 抽帧）；缩略图读帧协议；lib-index.json 薄索引（A39）+extract-assets --icon（Iconify 免 key 缓存）；genimg 13 张吉祥物；dy-qa1 六页/dy-qa2 三页/dy-qa3 六状态页原型全 live-high；Android 真机续跑 qa-android 16/16；七 run inspect 全 16/16；18 脚本 --help 补齐+meta.mjs 存量语法修复；标注卡 chromeless 收边 |
| M9 全链路 QA | ✅ 2026-09-01 | 首轮 47✅/6⛔env：web 全链路 16/16、三 demo inspect 全绿、P0×3+P1×7+P2 修复闭环；脚本缺陷 5 项修复（intent L0/dedup frames/budgets null/sync --help/inspect chooser）；⛔=真机掉线待重插、iOS 待装 Xcode、win 无真机、代理不回环 |

## Inspector 切片验收标准
- 微信原型按 5 选"微信支付入口"播放：逐屏脉冲高亮 我→服务→钱包，收付款给 blocked 卡
- 故事板抽屉：真机截图+目标高亮框+动作/结果标签横滑
- 按 3 点任意行：右侧面板 hex/字体/字重/行高/圆角/尺寸；Alt+hover 出测量线
- 按 2：投票/长按/条目点击等批注 pin+折线+事件表
- 按 4 拖拽行元素→导出 layout-patch.json
- 缩放 25–400%+抓手平移全模式可用
| M18 质量重建+丝滑沉淀 | ✅ 2026-09-03 | skill-first：inspect live-views 硬检查+eval live_ratio+prototype-spec/completeness fidelity 改写（交付必须 live，pixel 仅 compare/状态帧）；templates/components/ 三套组件库（mobile-im/desktop-app/web-marketing）；63 截图视图全 live 重建（mac-lark 14/mac-workbuddy 10/wechat-full 15/slytherin 7/web×2 13/xhs5 3，三原型用户验收通过）；老线标 demo；link-video 源覆盖门槛原则修正；桌面 click 默认 CGEvent+clickv/sweep/raise/windowid+doctor 三探针；pitfalls-index（LESSONS 64-95 分类）；action-protocol 桌面决策树+ios-desktop Electron 节；WorkBuddy CGEvent 验证推翻"人接管"结论 |
| M19b 图标与布局对位 | ✅ 2026-09-03 | lark rail 15+应用 11 真图标裁剪；全视图 rail 换真图标+选中白 pill；02-calendar 按源重画（tabs/mini 月历/周时间格/GMT+8/红 now 线/蓝绿勾选）fidelity 0.0905；05-workbench 真彩色应用图标；prototype-spec+critique-loop 增第7维 |
| M19 原版一致+资产质量门 | ✅ 2026-09-03 | 目标重写 live-high=真控件+近1:1；img/asset-qa.mjs（blur/blank/截断启发+VLM sheet+assets-qa.json）；inspect 增 placeholder-scan+asset-qa 硬检查；inspector c_mobile 自动注入状态栏；web/capture.mjs --assets 源原图；qa/viewshot.mjs+fidelity 门（校准 app≤0.20/web≤0.15，2× hard）；七 run 资产 uplift（微信真头像+genimg 朋友圈、lark clay 头像/banner、slytherin pixar 吉祥物/城景、web 源原图替 .fig、workbuddy/xhs5 genimg）；safety-rules 3b 真视觉+文本匿名；fidelity 实测 0.07-0.17 全达标 |
