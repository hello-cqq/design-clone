# DECISIONS — 架构决策记录（ADR 摘要）

| # | 决策 | 理由 | 代价/对冲 |
|---|---|---|---|
| A1 | 执行层=Midscene CLI + 原生工具兜底(adb/simctl/Playwright) | 唯一跨平台成熟件、MIT、裸命令跨 agent；官方 skills 验证架构 | Midscene 模型需自配 → 默认不用它也能跑(原生 adb 循环) |
| A2 | 大脑=宿主 VLM 默认；MAI-UI-2B/GUI-Owl 可选本地 | 零额外消费硬约束；强 VLM 直接 prompting 已超微调小模型(Design2Code 结论) | 定位精度弱于专用模型 → 控件树优先于纯视觉点击 |
| A3 | 生成=规格驱动(spec.yaml + tokens.css)，非一次性截图转代码 | Remix/批注/导出都依赖可编辑中间层；laowangba 验证 | 生成多一步 → agent 成本可接受 |
| A4 | tokens 外置：页面 spec 不出现 hex，颜色全在 tokens.css | 换风格=换变量文件，整站零代码生效 | — |
| A5 | 闸门数据化 + anti-slop：schema 里 anti_slop 只允许 "pass" | 校验即门禁，防 AI 默认审美 | 继承 laowangba 清单 |
| A6 | 产物三同构：Clone/Link 两通道产出同一 capture/knowledge/prototype 结构 | 一套生成与 Inspector 服务所有来源 | — |
| A7 | 安全：支付确认/凭证/验证码永不自动；权限分级(可自动/问用户/永不) | 操作真机真账号 | human-takeover 协议兜底 |
| A8 | 系统改动恢复义务：stayon/timeout/勿扰等结束必还原 | 改动用户设备须可逆 | prepare.sh --restore |
| A9 | 分发：skills/ 容器 + 6 字段 frontmatter + dist zip 兜底 | 7 端最严交集 | WorkBuddy 只能 GUI 上传 |
| A10 | Inspector 五模式(普通/产品/设计/编辑/路径) 内置于每个原型 | 用户诉求：活 PRD 而非 demo | inspector.js 单文件零依赖随模板下发 |
| A11 | 路径 v1=故事板(真机截图+bounds 高亮)+原型内播放；流程图 v2 | 证据零成本复用、覆盖评审+演示 | 对话框 v1 标注卡、有证据才生成真弹窗 |
| A12 | 编辑模式 v1=拖拽+导出 layout-patch.json，agent 落回 | 实时写回 HTML 易破坏结构 | GUI 直写留 v2 |
| A13 | 批注/编辑锚点=视图元素 data-dc 属性(对齐 spec region/component id) | 稳定选择器，跨 zoom/重生成 | 生成规范强制 |
| A14 | Figma 主=官方远程 MCP，降级=talk-to-figma-mcp，REST 只读验收 | 写入端点只有这两条官方通道 | 官方将来按量 → talk-to-figma 常驻兜底 |
| A15 | 验证环=Playwright 渲染截图 + Design2Code 指标(Block-Match+CLIP) + VLM 三重检查(意图/结构守恒/anti-slop) | 量化+语义双保险 | 指标代码 MIT 可用、数据不分发 |
| A16 | Web 捕获同时提取 DOM computed tokens，与像素提取互校、DOM 优先 | 读真实样式表 > 眯眼看截图(baoyu) | — |
| A17 | Inspector 增 模式6 Tweaks + 演示模式（自动播放/字幕/模拟弹窗/总结卡），演示入口面向观看者独立于调试播放 | 原型=活 PRD，需评审/演示两种消费方式 | 调试播放保留在路径模式 |
| A18 | Remix 模糊需求=三真实变体并排选；指牌无预设=品牌五步硬流程；交付前五维评审 | 不文字盲选、不记忆猜色、评审清单化(huashu) | 三变体成本=3 次 tokens 覆盖，非整站重生成 |
| A19 | 原型生成先选保真模+状态先列后建+handoff 声明排除项(effective-html) | 结构/视觉/行为问题分开评审 | — |
| A20 | 演示视频导出=Playwright 驱动演示模式录屏，ffmpeg 可选降级 webm | 零额外依赖出 PRD 演示片 | 无 ffmpeg 时仅 webm |
| A21 | Link 取材=六级路由梯（CLI→headless→登录→Web GUI→手机深链→回落），ladder.json 全程留痕 | 任何平台/风控/登录墙都有下一档；用户诉求"多种方案兜底" | 每级失败原因可复盘 |
| A22 | 被墙平台走系统代理自动感知（proxy-env），终端与浏览器拉齐 | FB 实测 curl 死/浏览器活，差在系统代理 | 代理 URL scheme 一律 http:// |
| A23 | 关键区域截录：全录后裁（ffmpeg crop / sharp extract），bbox 三档=显式>VLM 归一化>设备常量 | 零平台差异；用户诉求"只录关键区域" | VLM bbox 由宿主给 |
| A24 | 二级源路由：desc/置顶评论/画面内嵌的 GitHub·官网 URL 自动追加为 Web Clone 源；画面内嵌地址 VLM 读帧 | 博主常把项目地址放文案/评论/画面里 | tesseract 仅可选 |
| A25 | 原型壳双向滚动+自然内容高度+演示/批注 scrollIntoView；捕获侧 fullPage 证据+全量控件树 | 用户诉求"一屏放不下要能滑动" | — |
| A26 | Remix 三变体=variants.json + variants.html 三 iframe 并排真实渲染（embed 模式隐藏工具栏自适应宽），点选后 apply-patch 落回 tokens.css | 模糊需求"看着选"不文字盲选（huashu） | 浏览器不写文件，落回走 agent |
| A27 | 五维评审=review.mjs 出逐屏截屏+tokens 对比度(WCAG)+anti-slop grep → agent 读图打分 Keep/Fix/QuickWins 写 report/notes.md，Fix 当轮修 | 评审要证据不要品味 | — |
| A28 | GUI 拖拽持久化=layout-overrides.json（inspector 每次视图加载后 apply），tokens 侧=patch 直写 tokens.css 覆盖块 | GUI 版 Remix 闭环 | 结构级改动仍需 agent 落 views |
| A29 | Web 遍历=预算制 BFS（max-pages/budget-seconds/max-depth 先到先停）+每屏增量 state.json 续跑；coverage.json（前缀分布/未发现 top30/深度/去重）作 DESIGN.md 深化输入 | 大站不可一次爬完；被杀不丢进度；深化要证据 | 列表同构站去重后有效屏少属预期 |
| A30 | iOS=simctl 一等（shot/launch/openurl/loop）但承认 simctl 无 tap：默认人接管点击，辅助功能权限下 desktop click 兜底；无 Xcode 环境 exit3 三档回落（WDA/人接管/Link） | 零付费；环境差异大，脚本必须自报回落 | 真机 WDA 需自签编译，首次走人接管 |
| A31 | Figma 导出先过 export.mjs 生成 figma-plan.json（playwright 读真实计算样式→0-1 浮点，MCP 无关），官方 MCP/talk-to-figma 只按 plan 执行；nodeId 经 --apply-nodeids 回填做增量 patch | 两套 MCP 方言共享一份确定性计划；无 Figma 环境也能验计划本身 | 写能力永远在宿主 MCP 侧 |
| A32 | Inspector 外壳 Figma 化：左 icon rail（六模式竖排）+左 Pages 面板+右属性/路径面板+右下缩放 pill+点阵画布；壳色全走 --sh-* 变量，暗/亮双主题跟随系统+手动记忆（localStorage dc-theme） | 用户诉求"做成 Figma 的简约优雅+暗色切换"；壳与原型内容 tokens 严格分离 | sync-shell.mjs 保留各 run 的 DC/标题/视图 CSS 换壳 |
| A33 | 保真三档：pixel（原截图底+data-dc 热点，1:1 恒等）/ live-high（真素材裁剪+采样色+平台字体栈重绘）/ live-low（推断占位）；DC.pages[].fidelity 标注+Pages 面板徽标；fidelity.mjs（pixelmatch）出差异率入 report/fidelity.json | 用户诉求"和原图一模一样"；重绘永远有差，pixel 档给验收恒等、live 档给可编辑 | pixel 档不可 Remix tokens，混合策略默认核心屏 pixel 其余 live-high |
| A36 | Inspector v3 IA：左 rail 页面\|场景 两菜单（Figma 浅色默认）；场景画布 树\|路径 双模（iframe 流程卡+实心圆序号+关系标签+一次性灯带）；右看板 产品(功能/目标/再生成提示词)\|设计(Figma 分段,编辑可改)\|调参；底栏 pill 阅读\|编辑+标注+播放/视频+撤销/还原；弹窗/状态=独立页节点 | 用户 Figma 截图对齐+场景路径可视化诉求 | 六模式快捷键重映射 1/2/E/A/D |
| A37 | 编辑持久化=serve.mjs `/__dc_write__`（loopback+白名单）落 edit-overrides.json，重启生效；Ctrl+Z 会话撤销栈；⟲ 一键还原回克隆原件；无 serve 降级 localStorage。导出=`/__dc_export__` headless 元素级截屏（chrome=0 只出原型本体，DPR2）六档上下文菜单+看板 JSON+路径录屏 webm | "原型即应用"：修改必须跨会话生效；导出拒绝外壳像素 | 白名单五文件，safety-rules §10 |
| A38 | VLM 分析协议独立成 references/vlm-analysis.md：读帧/GUI 决策先读再输出 JSON（三要素+regen_prompt+边标签+弹窗即节点+bbox）；products.json 运行时读、schema meta.product 同源 | 新增 IA/三要素概念必须进 VLM 提示链，否则宿主产出挂不上数据模型 | A4 必产 products.json+paths.json |
| A35 | 全链路验收固化为 §E QA 模式：qa-protocol 四阶段（基线矩阵→PM→设计→测试→修复闭环）+ inspect.mjs 常驻回归器；每次触发必跑、新缺陷必补 case；设备路由 真机>模拟器>env-blocked | 用户诉求"每次验收都按此流程"，交付他人前自证 | 阈值随首轮校准（live-high<0.15），矩阵只增不减 |
| A34 | 生图多引擎兜底链：crop 证据→iconify/simple-icons 矢量→genimg（pollinations flux 免费匿名档，15s 节流+sha1 缓存+退避）→VLM 重画 SVG（clay 配方模板填参省 token）→CSS clay→emoji；质感靠"风格锚预设+两段式 VLM 写词+seeds 评判闭环"而非手写 | 用户诉求"有质感的卡通而非 emoji"且零付费省 token；收费/断网都有下一档 | Pixar 剧照级只在线档能给，本地兜底到 clay/插画级 |
| A39 | 组件/图标/字体走"薄索引"：presets/lib-index.json 只存命名与结构知识（icon_sets 平台映射+中文语义→Iconify id+字体栈/OFL 镜像+component_patterns 命名规范），运行时按需 Iconify 免费免 key 抓取并缓存 assets/.cache，离线回退 emoji；不打包 antd 等组件库运行时 | 完整库塞包=体积/许可/过时三杀；VLM 输出需要规范命名挂接 data-dc 与 regen prompt | 品牌矢量 simple-icons 兜底；字体走平台栈优先 |
| A40 | 平台矩阵 v2：顶层 5 类 web/android/ios/ipad/desktop，web 带 form(mobile\|desktop)、desktop 带 os(mac\|win)；shell 四档框 c_mobile/c_tablet/c_browser/c_desktop（浏览器窗=tab+地址栏，OS 窗=mac 红绿灯/win caption，框顶 chrome 由 inspector 注入且 chromeless 导出隐藏）；web 与 desktop 必须区分（设计语言/组件库/字体/框体皆异）。平台检测=vlm-analysis §2：detection_signals 命中出 confidence，low/冲突必须 question 询问用户，结论落 knowledge/platform.json | 用户诉求全平台覆盖+不确定就问；网站 vs 原生 app 视觉语言差异大于屏幅差异 | SF Symbols 仅命名（许可）抓取回退 lucide；win 桌面走 Iconify fluent 集 |
| A41 | M14 质量专项：① 场景路径只沿 fwd 边（BFS 正向序，back 边仅数据不渲染），顺序永远从前往后；② 边框默认关、开=设备 bezel+iOS 灵动岛（视图自带状态栏，不双重）；③ 产品+设计合并「详情」单看板、调参降级为折叠节（编辑模式可改）；④ 录视频并入导出菜单「更多」，底栏只留高频；⑤ 资产梯：源帧裁剪→亮度抠图（extract-assets --matte light/--erase）→genimg pixar-3d→渐变字符头像，UI 图标禁 emoji；⑥ 借鉴 open-design 壳组件模式入 references/mobile-shell-patterns.md，生成先查模板再动手 | 用户 17 项反馈+OD 对照打样；标准感来自壳组件模板化而非生图 | 模式借鉴 Apache-2.0 已存档 RESEARCH.md；warn 级检查（emoji/overlap/contrast/overflow）不阻断回归、驱动 retrofit |
| A42 | M14b 工艺闭环：① applyHash 异步化并 await（场景卡 boot 竞态根治，fallback 仅兜底）；② 对照=左右同尺度（原图宽=手机宽×缩放）+双向同步滚动+workspace 右留白，真左右对照；③ 树=思维导图连线带箭头，选中边持续流光（环境动效纪律：失选即停、hover 预亮、prefers-reduced-motion 降级）；④ 路径=chips 选择+单链渲染+箭头流光，多分支靠 chips 不靠平铺；⑤ 导出恰两项（固定全部+随选中一项），录视频入播放器条；⑥ 标注线只走手机右缘外空白边距（pin 留控件、线不穿内容）；⑦ 截图质量门禁（dedup 帧体检 blank/black/blurry + extract-assets 清晰度守卫）与生成后必审闭环（shotdiff 拼图+critique-loop 六维打分≤2 轮）；⑧ 状态栏 OD 式填充 SVG 入种子 | 用户六项反馈+OD 深读二档；截图质量决定下限、审查决定上限 | 流光/脉冲属环境动效，按 OD 动画纪律自动停；sharp 阈值首跑校准（blur<12/blank stddev<6） |
| A43 | M15 评测系统：三维评分 perf(.3)=goto(networkidle)双均≤1200ms 满分/5000ms 零 + prototype 体积≤600KB 满分；ux(.4)=inspect 21 硬通过率 −5×warnFail + paths/annotations/products/journeys 覆盖各 5；stab(.3)=100−30×错误数−20×双跑不一致。判通过=hard0+错误0+幂等+total≥80。自修复有界：≤3 轮、单轮修一类、分数回退即回滚、超限写 LESSONS 交人工（不无限循环）。inspect stdout 只给 summary、完整 R 落 qa/inspect.json，eval 读磁盘不解析 stdout | 用户要"评性能/体验/稳定性好不好、不好就自动改再评、直到满意"；满意需可量化且循环需有界，否则 agent 死循环 | 双跑幂等复用 inspect 两次 spawn；goto 用独立 playwright 实例避免污染 inspect 计时 |
| A44 | M16 完整应用原型：手机/桌面 app 克隆默认 scope=full——先写 ia-plan.json（tabs+entries）再 sweep（预算屏数/时长先到先停），每去重屏一视图；保真分层=核心屏 live-high（≤6）+其余 pixel 档（截图底+data-goto 热点，jpg q70-72 长边≤800/1400）；eval 增 completeness 维度（scope=full 时 views≥10 且 ia_coverage≥0.8 否则 warn）。桌面 click 坐标=预览×(物理/预览)/2（Retina 逻辑点）；Electron accessory 应用不受理外部 click/a11y 时降级 demo 单屏+热点并 handoff 声明（LESSONS 87/88） | 用户明确"要完整应用原型不是两三个页面"；完整性需可量化门槛，pixel 档是完整与效率的平衡点 | ia_coverage 用 graph 节点 title 文本匹配 ia-plan 条目，捕获中 discovered 追加 |
| A45 | M17 深层完整+隐私四防线+闭环点击：① IM 深层清单入 completeness（单聊/群聊/群设置/好友设置/长按菜单/小程序托盘+小程序/搜索含输入/状态对），full 预算≥25 屏、web≥8；② 隐私四防线（capture 仅本机 / pixel 必 mask+privacy-rects.json / 文本虚构+privacy-scan 清零 / handoff 声明）；③ 桌面点击改 CGEvent 真实 HID（System Events click at 对 Electron 自绘与跨窗 Z-order 不可靠），clickv 点前后 diff 闭环+DC_FRONT/AXRaise 预备；④ settle.mjs 稳定检测替代 fixed sleep；⑤ web SPA 用 --seeds 补入口；⑥ 三指/捏合 adb 不支持，如实声明 | 用户 7 条反馈：深层页缺失/加载态/手势/输入/隐私；隐私与体验同等重要 | mask 用 sharp extract+blur 合成；privacy-scan 正则扫手机号/wxid/微信号/邮箱/身份证 |
| A46 | M28 神经符号管线：测量适配(ui-tree/DOM/AX)→annotate(SoM)→VLM 语义 pass(只语义不测量)→spec2view 编译(bounds→%、像素采色、bbox 真裁、overlay 成层)→硬门。模型从"誊写像素"降维为"对齐+裁决"，任何模型都稳；GUI 专用模型仅锦上添花。微信热启动不假设启动态，snap 后必须特征文本验页（verify） | 用户质问"截图好成品差"=重建环节让 VLM 做不擅长的像素测量；更多原始信息(dom/tree/meta)应帮语义而非让模型测像素 | uitree2spec/webtree2spec/ax2spec/meta/annotate/spec2view 六工具+semantic-pass.md；试点 wechat01=0.08/slytherin01=0.055 |
| A47 | M44k 外壳冒烟门一等公民：`qa/ui-smoke.mjs` 真点外壳（播放/导出下载/分享/设备/标注·产品·变体写回/画布排版/?chrome=0/筛选/帮助/代码），inspect 跑 --fast、regress 跑全量含真实 zip 下载；写盘类检查自动还原 | 用户连报外壳 bug 而内容门全绿=门没盖住用户实际按的按钮；代理指标替代不了冒烟 | 单 run 门时长 +10~40s（导出档） |
| A48 | M44k 导出必须落到用户机器：serve `returnFiles` 回传 base64（48MB 上限）+ 前端零依赖 store-only zip（zipstore.js，UMD-lite 可 node 单测）触发浏览器下载；File System Access 可用时提供选目录档；服务端 `export/<ts>/` 保留为 CLI 口径 | "导出"的验收标准是用户下载目录里真有文件；只写服务端目录=没导出 | 超大导出回落服务端并在 UI 明示 |
| A49 | M45 inspector 源码分段+concat：`templates/prototype/ins/*.js`（17 段，数字前缀定序）经 `scripts/build-shell.mjs` 拼为单文件 `prototype/inspector.js`（同一 IIFE 闭包）；不用 bundler/ESM | 原型要 zip 解压双击即开与 file:// 直开，ESM 被 CORS 打死；零构建=零供应链面；分段让职责可审、可定位（产物保留分段头注释） | 跨段耦合仍同闭包（靠分段头注释声明职责）；改外壳必须经 sync-shell/clone 重新拼接 |
| A50 | M45 样式纪律入硬门：JS 只写几何/状态（translate/scale/坐标），排版与配色一律 inspector.css 类 + `--sh-*` 主题变量；`ui-smoke → no-inline-typography` 静态禁 `font:600|font-weight:600|fill:var(--sh-line)`，并对 `.wires .elabel/.wnum` 断言 computed 亮度/字重/字号 | "画布字太黑太粗"四次复发的根因是 inline 样式压过 CSS 且随 zoom 放大；调一色值治标，纪律+门才治本 | 状态栏/toast 等壳组件改用双类提特异性保防御性 |
| A51 | M45 移除唯一运行时 CDN：`gen/utility-css.mjs` 扫描视图真实用到的 utility 子集编译为 `prototype/utilities.css`（含 scoped preflight：`:where(#dc-stage…)` 归零特异性，组件库类仍可覆盖），index.html 不再引 @tailwindcss/browser；sync-shell/clone 自动生成；"长得像 utility 但任何样式源都没定义"的 token 报 unknown（--strict 阻断，抓过 gap8 笔误） | 离线/file:// / zip 分发完整性 + 供应链面 + 首屏少一个网络往返；像素级验证 wechat/aliyun/lark 与 CDN 版 diff=0 | 新增 utility 语法需扩编译器；未知语法=unknown 报警而非静默 |
| A52 | M45 可测叶子 UMD-lite：zipstore.js 浏览器挂 window.DCZip、Node 走 module.exports（node:test 直测 CRC32 向量与 zip 容器自洽）；templates/prototype/package.json 钉 type=commonjs（根 package.json 为 type=module，否则 .js 被当 ESM，UMD 的 module 分支失效） | 纯逻辑必须能在 Node 里被测，而不是只靠浏览器冒烟 | 该目录禁止再用 ESM 语法 |
| A53 | M45 serve 拆模块：serve/{policy,static,write,export}.mjs，serve.mjs 只做路由/生命周期；policy 全纯函数并有单测（白名单/分隔符前缀/8MB 上限/JSON 响应），makeInsideRoot 自带 normalize 兜底 | 安全承诺要能被单测钉住；回归即违约 | 新增端点必须落在四个模块之一并补测 |
| A54 | M45 开源工程面：根 package.json 仅 devDeps（eslint/typescript/@types/node，不进 zip）；eslint flat config 错误级只留故障类规则（首日 0 error），风格类 warn 逐步收紧；tsc --noEmit 只覆盖纯模块（policy/build-shell/zipstore）；CI=tests+lint+typecheck+ip/secret scan+build 确定性+zip 内容审计；qa/ip-scan（跟踪文件零二进制/零 run 产物/权利头人工确认）+qa/secret-scan（凭据/手机/身份证/wxid，md 豁免 PII 不豁免凭据） | "不被挑战"要靠可复跑的自证，而不是口头声明 | warn 债显式记录在 CONTRIBUTING 收紧路线 |
| A55 | M45 回归完整性：regress 对 serve 做就绪轮询；inspect/interact/ui-smoke 的输出不可解析、exit 异常或 serve 未就绪一律 BROKEN=fail；interact 要求 views>0；报告行显式标注 BROKEN 原因 | 假绿比红危险（LESSONS 132）；"全绿"必须等价于"真的测过且过" | 单 run 回归时长 +就绪等待（≤30s） |
| A56 | M46 视觉重修协议：每 run 四步（配对+缺口清单 → 资产补齐 autocrop/extract → 逐视图重誊 → viewshot 闭环），视图来源三分类（直誊/忠实空态/同壳 extrapolation）写入 critique notes；placeholder-blocks 硬门抓空色块顶替；critique 桌面/网页 full 及格线 4+全视图+证据；重修前物理备份 <run>-v1（runs 不在 git） | 用户逐图打回五 run；"像"需要资产覆盖+状态忠实+可审计来源 | extrapolation 页不得声称直誊；-v1 快照不进回归 |

## ADR-M99-video：生成视频进原型 hero/idle 层（2026-09-16）
- **决定**：撤销「原型内不嵌生成视频」旧红线；允许 `<video muted loop playsinline>` 作 `.far` 远景或角色 idle 层。
- **约束**：poster 静帧必备；`prefers-reduced-motion` 下 pause+poster；单文件 ≤2MB（webm 优先）；禁整屏视频当 UI（同层必须有活控件或 data-act 热点）；入 assets-manifest（source=genvideo/agent-native）。
- **理由**：brief 承诺的动态虚拟人（动物乐园/星海对话）静帧立绘无法兑现；门禁口径同步 M99-3（video 不计 img 覆盖门但受热点门约束）。
- **后果**：genvideo.mjs/media.mjs 成为一等公民；无 key 环境走 agent-native 履约协议（references/media-engine.md §2）。
