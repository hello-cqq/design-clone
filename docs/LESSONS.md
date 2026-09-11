# LESSONS — 实战经验账本（M0 Web + M1 Android 真跑沉淀）

> 每条标注"已沉淀到"的位置，避免只存在于聊天记录。

## Web（M0）
1. Playwright 装包后还需 `npx playwright install chromium`，且 headless shell 可能漏装报错 → doctor 检测+提示（doctor.mjs）
2. 端口 4173 常被占 → serve.mjs 自动 +1（serve.mjs）
3. 自定义 CSS 写进 `type="text/tailwindcss"` 块会被丢弃 → 普通 `<style>`（prototype-spec）
4. serve 根目录限制使 `../knowledge/tokens.css` 404 → serve 服务 run 根目录，开 /prototype/（serve.mjs+SKILL.md）
5. tokens 128px 下采样把细文字平均掉、文字色提取错误 → 512px 统计（tokens.mjs）
6. HN 同构页被感知哈希正确去重 → 原型只为原始屏建视图（directory-spec）
7. jsdelivr 在部分网络不稳 → 原型降级说明待补（README 已知限制）

## Android（M1 真机 Xiaomi 折叠屏 Android 17）
8. brew 的 adb 带 quarantine → 命令无输出挂起；`xattr -cr` 解（install-guide+doctor）
9. Android Studio 占 5037 → 版本不一致先 `adb kill-server`（install-guide）
10. 折叠屏多屏：`exec-out screencap -p` 警告污染 PNG；`-d 0` 无效；要 SurfaceFlinger 长 id → capture.sh 封装缓存（capture.sh+action-protocol）
11. `screenrecord` 写 Mac 路径空转 100+ 段 → 设备端录+回拉+失败熔断（record.sh）
12. 启动后首 tap 落空（微信"我"）→ 等双次 dump 一致再动作+动作后哈希验证重试（action-protocol 稳健性规则）
13. 截图 >1MB/2K 宿主读不了 → 先 sharp resize ~540 宽（action-protocol）
14. 后台进程随宿主 shell 超时被杀 → nohup+disown；pkill 用精确特征（action-protocol）
15. 灭屏/锁屏/授权/厂商安全开关等无法自动化 → human-takeover 四段式 + prepare.sh（A0 总控）
16. 录屏/截图含隐私 → 交付提醒检查 capture/；原型金额/ID 匿名化（safety-rules §7/§9）

## Inspector（S1-S6）
19. 视图内联脚本在 innerHTML 注入后不会执行 → loadView 里 replaceWith 重建 script 并以 module 作用域注入（防 const 重声明）；redraw 需延后一拍等脚本渲染（inspector.js）
20. 批注/编辑/测量全依赖 data-dc 锚点，视图漏标=批注消失 → 生成规范强制 + 回归截图核对 pin 数（prototype-spec）

## Link 模式（M2 真链实测，10/10 通过）
22. 抖音图文短链跳 **iesdouyin.com/share/note** 老页，headless 直接挂 → 规范化为 `www.douyin.com/note/<id>`（web-sim 短链规范化）
23. 抖音详情页 RENDER_DATA 无播放地址（异步加载）→ 拦截 `/aweme/v1/web/aweme/detail` API 响应取 play_addr/images；图集轮播懒加载 → 翻 `playswitch-next` 收集 `aweme-images` URL
24. B 站对 lux/yt-dlp 全 412 风控 → 只能 web-sim：浏览器内读 `__playinfo__` dash 流，video+audio m4s 用 ffmpeg 合流
25. b23.tv 的 HEAD Location 是**相对路径**，要按短域映射目标 origin（b23→bilibili.com）
26. CDN 瞬时空响应 curl exit 52 → dl 加 3 次重试+体积校验
27. bash 多字节坑再现：`$TH）` 的中文括号被吞进变量名 → 一律 `${var}`；ffmpeg9 用 `-fps_mode vfr` 替代 `-vsync`
28. 抖音/B站/小红书登录态用 **Playwright 持久化 profile**：扫码一次，后续 headless 全免登

## 国际平台与梯级（T8 实测）
29. intent `success()` 只认 mp4 会误判 webm/根目录图 → 媒体扩展全量匹配；ladder 显示 L1 成功却报全梯失败的坑
30. TikTok photo 帖：yt-dlp L1 需 impersonation 常失败、headless L2 登录墙 → L3 headed 或 **L5 真机横滑**（国内手机网络打不开 TikTok → app 报"无网络"，deeplink-capture 已加无网检测提示回落）
31. FB 公开帖 og:image 可免登 L2 直取；被墙差异=系统代理，proxy-env 拉齐后 curl 也活；代理 URL scheme 写 http:// 不是 https://
32. YouTube shorts yt-dlp 稳；标题含 `/` 等字符 yt-dlp 自动sanitize，无需处理

## Remix 管线（M3）
33. hash-only 导航（同 URL 只改 #x）不重载页面 → review.mjs 逐屏截屏必须 reload；inspector 补 hashchange 监听
34. `min-height:100%` 百分比链在 auto 高度父级上不成立（深色视图露底）→ #dc-stage 用 flex column + 子 flex:1 撑满
35. 完整 inspector 塞进小 iframe 会挤黑 → embed 模式（隐工具栏+按容器宽自适应缩放）
36. 变体只覆盖部分 token 会露馅（CTA 用 --color-cta 不在映射里仍金色）→ variants 生成时先扫视图里实际用到的 var()

## 全量遍历（M4）
37. HN 式列表站 aHash 判重极狠（20 屏 17 重）——预算按"发现 URL/coverage"评估价值，别按屏数焦虑
38. 续跑校验三件套：seq 连续、首节点 first_seen_at 不变、stop_reason 符合预期；state.json 每屏原子写才敢被杀

## iOS/桌面（M5）
39. `xcrun` 在 ≠ simctl 在：CLT 只给 xcrun 壳，模拟器运行时随 Xcode；探测必须 `xcrun simctl help`
40. simctl 没有 tap/swipe——别假装能自动操作；人接管默认+AppleScript click 可选才是老实设计
41. mac 截屏权限"成功≠有内容"：无屏幕录制授权时 screencapture 仍 exit0 给空白壁纸，check 子命令要提示这点

## 导出管线（P4）
21. 内嵌小 http server 漏掉"目录路径补 index.html"→ /prototype/ 404、页面空白、演示不启动，表现为 waitForFunction 超时（webm 只有 70KB）。凡 serve 逻辑必须统一目录处理；验收看视频体积/时长而非"文件存在"（export-walkthrough.mjs）

## 流程/组织
17. 长调研分 6-7 路并行子代理，效率与覆盖兼得（本次做法）
18. 计划模式与执行模式切换时，先落盘 docs/ 再动手，防止上下文丢失（本文件存在的原因）

## 外壳与保真（M7/M8）
42. 静态服务器对"目录路径无尾斜杠"直接返 index.html = 坑：浏览器按 /prototype 为文件解析相对资源→css/js 全 404→裸奔页（用户报障截图）。目录必须 301 到尾斜杠；html 加 no-store
43. 模板注释里别放占位符字面量：`String.replace` 只换第一处，会把替换打进注释、真占位符落空，产物半新半旧极难排查。同步脚本必须 replaceAll + 注释用描述性措辞；sync 后要 grep 占位符残留断言
44. views 内容注入到 prototype 根 DOM，相对路径以 /prototype/ 为基：素材写 `assets/x.png` 而非 `../assets/x.png`（后者解析到 run 根 404）
45. 存量 run 的 index.html 是"唯一数据载体"（DC JSON/标题/视图 CSS 都在内），换壳同步前必须三件全提取并校验，历史生成脚本的残次文件（双 document 拼接、占位符残留）会让正则串档——提取锚点要逐 run 实测
46. pollinations 匿名档 1req/15s 且可能水印；flux 文生图免费可用、kontext 图生图匿名实测 500。生图脚本节流+缓存是硬需求；素材量小（每 run <10 张）匿名档足够

## QA 首轮（M9）
47. Tailwind v4 的 @theme 块在浏览器裸 <link> 下不生效：tokens.css 必须 :root 镜像（或只写 :root）。dy1 主按钮曾因此白字透明
48. view 多根节点会被 `#dc-stage > * {flex:1}` 拉伸出空白：prototype-spec 必须强制单根包裹；壳侧 #dc-stage 字体要走 var(--font-body) 否则壳字体栈泄漏进原型
49. intent.mjs 对"本地视频路径"全梯失败=缺 L0 本地直拷档；不带 --run 不落 ladder.json 与注释承诺不符。路由梯脚本的"全程留痕"必须覆盖 analysis-only 档
50. live-high 文本重排屏的 pixelmatch 噪声约 0.11（换行/字距差异），阈值 0.08 过严；校准为 pixel<0.05 / live-high<0.15，视觉以 VLM 对照为准、分数只做回归哨兵
51. 验收开始后发现真机掉线是常态

## Inspector v3（M11）
52. graph 的 duplicate_of 节点不能简单丢弃：边要 remap 到原始节点再去自环，否则场景树 0 边（qa-hn 首跑全断）
53. 导航树渲染必须带 visited 集合：原型图天然有环（返回首页），裸递归=栈溢出
54. 播放/演示的 setTimeout 闭包必须捕获会话对象并判等（play!==my 即弃），endPlay 后 pending timer 触发 null.i 是典型崩点
55. 导出"页面"必须元素级截 #dc-stage 且 chrome=0：用户明确"导出原型本体而非带外壳的 web 截图"；iframe embed 复用让流程卡零额外渲染代码
56. Tailwind @theme 裸 link 不生效的坑第二次踩（qa-hn）：tokens.mjs 模板应默认双写 :root+@theme，待修脚本根因：H 链路要设计成"可续跑"（prepare 守卫+留证+用户重插后从步骤 2 续），不把环境阻塞当技能失败

## 薄索引与抖音三链（M12）
57. view 内资源相对路径以 prototype/ 为基：本目录 `assets/...`、跨层 `../capture/...`；dy-qa1 主视觉初写 `../assets` 直接 404
58. 脚本 `--out` 等路径按调用 cwd 解析：编排时先确认 workdir 再写相对路径，genimg 曾落进 skill 内嵌套目录（需 mv+rm 清理）
59. `adb exec-out screencap -p` 的 PNG 会被 multi-display 警告污染（sharp 报 unsupported format）；改 `adb shell screencap -p /sdcard/x.png && adb pull`；小米 subscreen launcher 驻留需 keyevent 224+swipe 解锁
60. 大图先 sharp 缩 340px 缩略图再读：11 帧抖音图文原图（1536×2728）直读会挤爆上下文，用户明确要求防循环压缩
61. 抖音图文/视频 L1 CLI 直下必败（风控），L2 headless web-sim 三连稳定；视频型 frames 为空属预期，ffprobe 取时长后 `ffmpeg -vf fps=12/duration` 匀 12 帧
62. 全仓 18 个脚本缺 `--help`（AGENTS.md 入口约定）一次性注入修补；顺带发现 meta.mjs 69 行 `[...new Set(` 外层括号未闭合的存量语法炸弹
63. 标注卡在 chromeless 导出时裁切（卡默认手机右外侧）：导出态收进手机右缘内，shell 态保持外侧不挡内容
64. SF Symbols 有许可限制不能免 key 抓取分发：薄索引里只做命名知识（house.fill 等），实际拉取回退 lucide/tabler 相似形；win 桌面图标 Iconify 有 fluent 集可直拉
65. 导出是 chromeless（原型本体）所以观察外壳四档框必须截带壳整页，别用 /__dc_export__ 产物验框——两通道用途不同
66. sync-shell 扫描发生在目录创建之前会静默漏新 run（qa-web 首跑 inspect 5/16 全是 inspector.css/js 404）：新建 run 后必须显式再 sync 一次
67. body 模式类与组件类同名会灾难：`body.dc-card`（场景卡 embed 模式）命中了标注卡 `.dc-card{position:absolute;width:200px}`，body 直接变 200px 宽绝对定位；模式类一律加 view/mode 后缀（dc-cardview）
68. 缩放百分比文案被两个缩放系统（pages scale / scene fzoom）共享时，切 IA 后显示的是对方系统的旧值，zoom-in 读数反而变小；setIA 里必须同步 pct 文案
69. 场景卡 iframe 被 innerHTML 替换时子资源 abort 会刷 requestfailed：QA 零容忍应只统计主帧（r.frame()!==mainFrame 忽略）
70. 全局 `svg{stroke:currentColor}` 会覆盖 svg 根上的 stroke 表现属性（CSS>表现属性），内联 SVG 换色要写 style="stroke:#xxx" 或把 stroke 放到子 path 上
71. 状态栏别双重：视图内容自带状态栏时，边框档只注入灵动岛/打孔，不注入整行时间+图标
72. 场景卡「全是一样的页」是 boot 竞态：applyHash 里 loadView 不 await，fallback 又抢载首页，两 loadView 谁后完成谁赢；hash 加载必须 await 后再决定是否兜底
73. 对照面板原图 width:100% 看着是拉伸/错位：左右对照必须同尺度（原图宽=手机宽×当前缩放）+滚动同步，否则永远对不齐
74. 平铺所有路径行=信息灾难：一节点多子路径时 chips 选择+单链渲染，画布一次只讲一条故事
75. 环境动效（流光/循环）不按 OD 动画纪律做就是骚扰：仅选中流动、失选即停、prefers-reduced-motion 降级为静态
76. 生成质量的天花板在截图地基：blank/黑屏/模糊帧进 source-map 或裁剪源，后面全错；先 dedup 体检再谈审美
77. 全局 svg stroke 规则下填充式状态栏图标必须显式 stroke="none"，否则填充路径被描边显脏（OD 种子同款坑）
78. 画布 drawer 必须按 mode 分发：setFZoom/fitFlow 里硬编码 rAF(drawWires)，会在 path 模式画完后用 tree 逻辑重画（0 边）把流光全擦掉；缩放类回调一律 `path? drawPathWires : drawWires`
79. 与 70/77 同族但反向：CSS `svg{fill:none;stroke:currentColor}` 同样覆盖 fill 表现属性——填充式图标根上写属性必变空心描边；一律 inline style（`style="fill:currentColor;stroke:none"`）才赢 CSS
80. inline span 包按钮进 flex 底栏会按基线对齐把按钮顶歪（播放钮错位）：分组容器 `display:contents` 让子按钮直接做 flex item，hidden 态靠 `[hidden]!important` 兜住
81. 画布 innerHTML 整体重建→所有场景卡 iframe 重载闪白，点击即闪：iframe 默认 opacity 0、load 后 .25s 淡入，卡片底色用 canvas 承托；重点已选中 chip no-op 不重渲
82. 标注引线"完全避让内容"会指向不清（线从手机边缘凭空起）：pin 实心贴目标右缘，引线从 pin 出发保留"必要一刀"水平穿出右缘，边距内垂直折到卡；卡片 y 锚定目标附近、仅碰撞下移，并用 workspace 高 clamp 防底栏遮挡
83. 老 run 的产物可能只活在带日期快照子目录（wechat-pay 顶层 prototype/ 只剩 paths.json，真身在 20260901-m1/）：serve 404 + inspect 每步 3s 超时叠加，整轮看着像"挂死"实为慢；恢复老 run=拷回快照 prototype + sync-shell + 补 knowledge/（platform.json、tokens.css——缺 tokens.css 会 requestfailed 触发零容忍），且 inspect 的 consoleErrors 过滤只挡 "Failed to load resource"，requestfailed 通道另算
84. macOS 无 GNU timeout；后台长跑回归用脚本文件 + `nohup bash /tmp/x.sh >/dev/null 2>&1 </dev/null &`，引号嵌套和 `set -- $pair` 在 zsh 下都不分词，循环回归一律显式 bash
85. contrast 检查的 lum() 只认 rgb()：Tailwind v4 背景序列化成 oklab()，半透明白底被算成 lum=0，黑字判 ratio 1 全假阳性；颜色一律 canvas 1×1 fillStyle 归一再算（顺带把 alpha 合成到白底）
86. 直接 Read 原截图（手机 1080×2400 / QA 全尺寸 PNG）频繁触发宿主上下文压缩：读图前必经 img/view.mjs（≤1000/q82），多图 --grid 合一，结论立即文字化；取证 viewport 1280×800
87. macOS Retina：screencapture 出物理像素（3024×1964）但 System Events `click at` 用逻辑点（1512×982）；桌面 click 坐标=截图预览坐标×(物理/预览)/2，漏除 2 会点到隔壁窗口且无报错
88. Electron accessory 类应用（WorkBuddy）：System Events frontmost/activate 都切不真正 raise 主窗、a11y 树仅 4 个无名元素、坐标 click 全被上层窗吸收；可用 `screencapture -l <CGWindowID>`（swift 查 kCGWindowNumber）旁路截窗，但无法代操 → 此类 app 克隆降级 demo 档单屏+热点，handoff 声明限制
89. System Events `click at` 两坑：发给坐标处最顶层窗（隔壁 app 挡窗就点错），且 Electron 自绘内容无 a11y 元素时常无效；真 HID 用 CoreGraphics CGEventCreateMouseEvent+CGEventPost(kCGHIDEventTap)，wheel/click 同通道才稳
90. 跨进程 Z-order 不由 frontmost/AXRaise 完全决定：挡窗应用（微信盖飞书）最稳是临时移走其窗（set position {-2200,400}），完事恢复
91. 会话列表"看着没有群"先怀疑叠窗：M17 把微信窗的群行当成飞书列表误判"飞书无群"，用户一截图打脸；多窗环境每步都 fresh shot 再决策
92. fixed sleep 截图中招率极高（骨架/转圈进原型）：settle.mjs 连拍差值稳定才落盘，loading 帧单独留作状态对视图
93. adb input 无多点触控：三指/捏合不可模拟，协议里如实标不支持，别承诺
94. 把 pixel 档（截图+热点）当交付主体=交付"可点击截图集"，用户验收直接打回："都是截图、不能交互、没有控件"；完整性指标只数视图数不数交互密度是帮凶。修正：交付视图主体必须 live（inspect live-views 硬检查+eval live_ratio=1），pixel 仅限 compare/状态帧；组件库 templates/components/ 让 live 成为便宜路径。落地：inspect.mjs/eval.mjs/prototype-spec.md/completeness-protocol.md
95. WorkBuddy"必须人接管"是错结论：当时用 System Events 通道 miss 就放弃；换 CGEvent 真实 HID 后 clickv 首次即命中（diff≈9/11）。Electron 桌面 app 默认自动路径=raise+fresh shot+clickv，人接管 loop 仅作兜底。验证留 /tmp/wb-now*；协议已改 completeness-protocol §8/ios-desktop §Electron
96. M19 资产质量门实测：asset-qa 拦住空白头像 crop（bbox 错）与 blurry 产品图，换源/换图即过；fidelity 校准 wechat 01=0.1315、群聊 0.073、群设置 0.083、lark 0.14-0.17、apple 0.09、workbuddy 0.08——真头像/原图+精确色可稳定 <0.15，纯 CSS  wireframe 必 >0.25。占位/渲染位文本会被 placeholder-scan 抓，"示例占位"措辞也算
97. web --assets 在 --resume 下不跑（resume 跳过已访页）；抓原图需不带 resume 小批量重抓。genimg photorealistic 风格慢易超时，风景用 flat/pixar-3d 更快
98. M19b 用户二次打回："图标是通用线稿、页面是简化布局，咋这么丑"。根因：资产阶梯跳过真图标裁剪档 + 布局没逐块对位（卡片宫格代替日历周视图）。修：rail/应用图标全部 extract-assets 真裁（44-60px 物理=2x 显示，asset-qa too-small 对图标仅 flag）；日历按源重画 tabs+mini 月历+周时间格+GMT+8+红 now 线；fidelity 02-calendar 重测 0.0905。prototype-spec/critique-loop 增"图标与布局对位"硬维
99. M19c 图标灰条根因：rail 图标 bbox 偏左吃到窗边阴影（trim 删不掉非均匀渐变），且预览目测坐标不可靠；正解=bbox 右移到 glyph 列[298,t-20,84,60]+trim+icon≥56。inspect icon-render 门须除以 #dc-stage 画布缩放（getBoundingClientRect 是缩放后像素，offsetWidth 比 rect 得 scale），否则 22px 图标在 fit-zoom 下误判 <14px
100. 微信会话列表曾照抄真昵称/消息预览（违反文本匿名）：M23 全虚构化+parity-log 盘点；根因=重建时直接誊了 capture 文案。规则：chrome 照准、个人文本必虚构
101. wechat sweep 只 settle 截图漏了 uiautomator dump → 无控件树、逐控件比对只能人工盘点。修：android/capture.sh snap 模式绑定 settle+shot+dump；无树 run 须 parity-log.md
102. 微信热启动回上次页（"我"/发现），dump 前假设启动态=拿错页。修：snap 后特征文本验页，不匹配重导航
103. spec2view 文本色在 bbox 左缘采样命中背景→白字隐形。修：取 bbox 内 4×6 网格最暗像素作文字色
104. spec2view 裁剪写错目录(views/assets)致 asset-refs 全红。修：assetsDir=views/../assets
105. 加号菜单不暗化、长按要暗化：spec2view --dim 可选；容器底色由 box 节点采样渲染（否则菜单/卡片无底）
106. M44 用户三连打回："控件不支持交互，像放了张图片"。根因：交互运行时只有 `data-goto` 导航（inspector.js），开关/单选/多选/下拉/折叠/弹层全是静态 span；且 QA 只"数"控件（parity.mjs DOM 计数）**从不点击**，全静态页能过所有门。修：① `templates/prototype/runtime.js` 事件委托运行时，`data-act` 全控件目录（toggle/radio/checkbox/select/accordion/tab/sheet/dialog/toast/step/slider/input/back/goto/noop），自动补 role/tabindex/aria+键盘可达；② `qa/interact.mjs` 真点每个控件断言可观测变化（aria/class/hash/弹层/值），dead=0 门；③ inspect `interactive-controls` 硬阻断 + `no-h-overflow` 由 warn 升 hard 且逐页量；④ eval 计 interactivity。教训：**"完整"指标只数视图数/控件数不验交互=帮凶**（同 LESSONS 94 的截图集教训，交互版）。微信只是控件子集，别假设别的 app 也只有开关——目录要含下拉/面包屑/单选/多选/stepper。
107. M44 13 群设置成员区单行 `flex`（7×56+6×16≈488px）>390 溢出，头像被压成高矩形、+/− 被裁：改 `flex-wrap`（5+2 两行）即方。教训：横向装不下要换行/收缩，`no-h-overflow` 必须逐页量 stage+screen 的 scrollWidth-clientWidth 且硬阻断（软 warn 时溢出页一直蒙混过关）。
108. M44 interact.mjs 两坑：① 仅 hash 变化的 `page.goto` 不可靠替换 #dc-stage（hashchange→loadView 异步竞态），要带 cache-buster query 强制整文档加载 + waitForFunction 验 stage 已换；② 点击"已选中的 radio/已激活的 tab"是合法 no-op，不能算未响应——按 aria-checked/class 豁免，否则 act_pass 永远 <1。
109. M44 perf 分被产物体积拖垮（wechat-full prototype 2.6M→eval perf=14→total=74 FIX）：156 个 gen-*.png 是早期 genimg 管线遗留、视图改用真裁 ava-*.png 后全是死文件；清死资产 + mm-cover.png(672K)转 jpg(41K) → 716K，perf 升到 65、total 90 PASS。教训：run 内未被任何 view/index 引用的资产要清（grep assets/ 引用对账），fidelity 高的匿名页按 M28 政策 --waive anonymized-personal-content（虚构文本必然像素差大，不是不保真）。
110. M44/P3 fidelity 假分数根因：**view id ≠ capture 文件名**时按 id 配对会错配（wechat 14-friend-settings↔16-friend-settings、web-apple 01-home↔01-index-full），旧 report 里有的分是错配的、有的视图根本没测到（16/17/19 从未入 report）。修：`knowledge/source-map.json`（view→capture）+ `qa/fidelity-all.mjs` 按 map/`-full`/词干回退配对复测。一上正确配对立刻暴露 wechat 17-miniprogram 0.86 的真缺口（此前"绿"是假绿）。教训：**门禁的"过"若建立在错配对/未测量上，比不过更危险**；配对表是 fidelity 的前置数据，不是可选项。
111. M44/P3 viewshot 长页截屏渗壳：playwright 元素截屏对超高元素滚动拼接，position:fixed 的外壳（底栏/缩放条）被拼进图 → fidelity 源是干净全页、原型图带壳，ratio 虚高到 0.8。修：viewshot/fidelity-all 统一走 `?chrome=0`。教训：任何"元素级截屏"都要先确认页面不高于一屏，或去壳。
112. M44/P2 全案例达标不能靠手抄 70 个视图：写 `gen/wire.mjs`（playwright 真 DOM 跑接线函数）把死控件按契约兜底（开关→toggle、tab→tab、其余→toast 占位），幂等；18 个 run 一键 dead=0。教训：**"通用能力"要落成可复跑的工具**，靠agent逐页手抄既慢又漂移；兜底 toast 是契约允许的"解释边界"，不是造假，但高价值真控件仍需手工升级。
113. M44/P3 inspect 两个硬检查（detail-design-section/edit-toggle）假设视图必有"可点且非导航"的 data-dc；ios demo run（intl-yt3）的 data-dc 全在导航元素上→无可选元素→硬 fail。修：无 `[data-dc]:not([data-goto])` 时降为 warn 跳过（标注是可选能力），有却不填充才硬 fail。教训：**硬门要区分"能力缺失(可选)"与"能力坏了(必修)"**，否则可选特性缺席会把回归全打红。
114. M44c 用户指出"微信用户名字没改假名"+朋友圈头像"没对齐"。查：`孙志江`(第三方全名)/`鹿非`(owner 昵称) 漏进 views；`ava-lu.png` 是 2×3 照片墙拼贴（裁错 bbox）导致封面头像看起来错位（昵称/头像定位本身是对的，是素材内容错）。根因同 106/110：**手猜 bbox + 隐私只靠正则扫手机/ID 扫不到真名**。修（通用化，非微信特例）：每 run `knowledge/privacy.json`(anon_map/face_assets/keep_assets/keep_brands)+`qa/privacy.mjs` 硬门（真键/PII/真人脸未 genimg 即 fail，--discover 从 ui-tree XML+web/AX JSON 起草）；`assets-manifest.json` 溯源（extract-assets/genimg 自动写）；asset-qa collage 检测（细浅缝且两侧有内容才判，避免官方 logo 浅底误报）；个人真人脸 genimg 虚构同名覆盖、官方/商家保留；姓名→可爱假名、称呼保留。19 个 run 全配 privacy.json 且门绿。教训：**隐私门必须查"真名/真脸"而不只查格式化 PII**；头像"错位"先怀疑素材内容（拼贴/裁错）再怀疑布局。
115. M44d 用户点出"飞书/workbuddy/阿里云/apple/圆周轨迹 似乎有很多问题"，而门禁全绿。根因：①pixelmatch 对浅色稀疏 UI **结构失明**（slytherin 错页/缺栏仍 0.05-0.17"达标"）；②recall 只查标签文字在不在；③desktop run 从未做视觉核对（fidelity 虽有但阈值下全"过"）；④desktop capture 含 OS chrome，stage-only ratio 虚高不可比。修：`fidelity-all` 增 struct 墨度网格分（**仅作辅助信号**——实测它对匿名化聊天页也误低，不能当硬门）；新增 `qa/viewsheet.mjs` 全视图拼图 + `qa/critique.mjs` 结构 critique 硬门（VLM 对可疑视图+前3 打 layout≥3）；audit/viewshot 统一 chrome=0；重修 slytherin 02(地图页)/05(待计划/备注)、mac-lark 01(带标签侧栏+富会话行+标题栏)、workbuddy 标题栏、aliyun 03(nav/footer)。教训：**像素+文字两类代理指标都过≠看起来对**；结构正确性必须有一个"看"的门（VLM critique），且桌面 run 的 fidelity 要和窗口区比对或降权。
116. M44e 用户："生成的头像太 AI 化，别限 3D，按产品场景自主选风格（二次元/迪士尼/插画/赛博/古风…），假名和生图场景也是，并要循环自检"。根因：genimg 只有 4 锚点且默认 pixar-3d，flux 人像=塑料对称灰底=AI 味。修：STYLES 扩 anime/disney/illustration/cyberpunk/guofeng/photographic/flat-corporate（各带 NOT photoreal/3d 防串味）+ 全局反 AI 味后缀（非对称光/自然不完美/禁灰底，--no-anti 可关）；`gen/style-pick.mjs` 场景→风格（IM→anime、旅行→anime/illustration、办公→flat-corporate、电商→photographic、游戏→cyberpunk、文化→guofeng）；`gen/fakename.mjs` 场景化假名池；`img/gen-loop.mjs` 生成→自检(blank/blur/collage/头像禁纯灰底)→变异重试≤N 轮→manifest 记 style/rounds/checks。实测：plain-gray 检查逼出彩色底、anime 锚点去掉仿真塑料感。教训：**生图质量门要检"AI 味特征"（灰底/对称/塑料肌）而不只检 blank/blur**；风格选择是产品决策，应随场景而非全局常量。

117. M44f 用户贴 7 张图："排版/布局/裁切/生图/裁剪还是很多问题，再全面回归"。逐一定位：①desktop run 崩坏根因是 **shell 尺寸被视图 css 级联压成手机宽**（#dc-phone 1280 规则失效→主栏 85px→模态溢出）→ inspector applyShellClasses 用 inline 尺寸兜底（通用，四档 shell）；②视图自带标题栏违反库契约（da-root 是 flex-row，标题栏被挤成竖列）→ 回撤并改由 shell .dc-framebar 提供，desktop-app.md 立硬契约+inspect 查"视图内重复窗口 chrome"；③flex 子项 min-width:auto 让宽图把信息卡挤出容器（aliyun 右卡被裁）→ 库加 .wm-prod>*{min-width:0}+img{max-width:100%}；④元素级裁切/空槽/坏图此前无门 → inspect 新硬门 layout-sanity（clipped-element/empty-slot/broken-img，full 硬、demo warn；豁免透明 tap-catcher/模态 scrim/装饰 orb）；⑤no-emoji 升 full 硬门并扩到"标签内 emoji"，23 个视图 emoji→inline SVG（教训：codemod 替换 emoji 时会注入 data-msg 属性值炸标签——替换必须只作用于文本节点或事后修复属性）；⑥sync-shell 改为以组件库为唯一源重建 __VIEW_CSS__（库更新可传播存量 run），run 额外 css 在前库在后。19 run 全量 sweep+回归：interact dead=0、inspect fail=0、eval 全 PASS。教训：**"看起来对"需要元素级几何门（clip/empty/broken）+ shell 尺寸确定性**，像素/文字/交互三类代理指标都替代不了几何检查。
118. M44g 用户四连问："阿里云控件不可交互？apple 生图低俗？workbuddy/飞书太素不复制品牌资产？你真的对比评测了吗？"根因：①interact 门的候选 SEL 不含"库样式按钮"（.wm-cta .pri 等有 cursor:pointer 但非 a/button）→ 未接线还漏检 → SEL 扩到 computed cursor:pointer，wire.mjs 同口径并改为在带真 CSS 的 shell 内接线；②genimg 无内容安全约束 → 加不可关闭 SAFETY 后缀（family-safe/fully-clothed/no suggestive）+ cover/scene 默认 no-people + 从 run tokens 注入 palette；apple hero 重生成为深蓝 keynote 抽象光效；③"太素"=缺品牌资产与风格丰富度门 → 新增 img/autocrop-icons.mjs（饱和色块连通域自动裁图标/tile，通用不靠手猜坐标）复制飞书真实 app tile，genimg 生成风格匹配插画/吉祥物/卡通头像补 workbuddy；新增 fidelity style-parity（Hasler-Susstrunk colorfulness+饱和占比 Δ）进 eval warn；④标注/覆盖层文字太黑太粗 → inspector.css 减重减黑。教训：**交互门必须和"可点"的视觉定义同口径（computed cursor）**；**生图必须带内容安全与风格一致约束**；**"质感/层次"要靠真品牌资产+丰富度指标度量，否则门禁全绿也能很丑**。119. M44j 用户："路径要根据实际应用的交互逻辑决策"。根因：paths-gen v1 机械 DFS 全图，把**全局导航边当场景步**（飞书全边是"tap·侧栏X"），roots 取 indeg=0 得单怪根，SCENES 显示一条嵌套全链。修：v2 边四分类（module=持久chrome/hub≥60%、drill=back-pair 父子、task=内容CTA、modal=sheet/dialog、back 仅校验），场景树/路径仅沿 content 边；flows.json 优先（capture/events.jsonl 录制归纳=ground-truth；存量 run 用 flows-skeleton+agent 目视修正）；nav 在节点下平铺、画布淡虚线；qa/paths-qa 禁 hub-chain/giant-chain。教训：**路径=交互逻辑，不是图遍历**；hub-and-spoke 应用的"场景"是模块内任务流，导航只是切换。
120. M44i/用户嫌 workbuddy 丑：genimg 糊的"机器人照片 tile"≠品牌资产。正解=**能裁真资产就裁**（autocrop 饱和块裁 logo/彩色 tile；线稿插画 capture 里没有时用手写 SVG 线稿而非 genimg 糊图；技能 icon 用彩色 letter-tile 贴近原版式）。另：cloned app-icon 在"无 launcher 的 capture"（手机屏/dock 多图标）会裁错（微信裁到红花、飞书裁到橙色笔）→ 回落 generated 时必须 --prompt 品牌匹配，或显式 --src/--bbox。教训：**"复制品牌资产"要有来源判别；无来源时品牌匹配生成优于盲裁**。
121. M44h 为原型展示网站铺路：每 run 根目录 `prototype/appicon/`(16..512+maskable+icon-spec.json 用户可 --regen 调整) + `knowledge/showcase.json`(id/title/platform/shell/tags/icon/cover/views) 作为站点契约；inspect `appicon-present` 硬门(full)。统一入口 entry.mjs 把"一句话/链接/图片/app名"路由到 clone/link/remix/export；GUI 采集前需 knowledge/consent.json 收据（红线）。教训：**展示/分发需求要提前定义清单契约，而不是事后补图标**。
122. 用户连报"播放没反应/导出没下载到本地/设备名不对/画布字太粗"，而 interact/inspect/fidelity 全绿——**门只覆盖了原型内容，没覆盖外壳本身**。修：`qa/ui-smoke.mjs` 真点外壳关键控件并断言"有反应且正确"（播放推进或明确提示、导出菜单三档+真实 zip 下载、分享四入口、设备名=手机/平板/桌面/网页且切换+URL+刷新持久化、标注/产品/变体真写盘、画布标签 computed 排版、`?chrome=0` 无壳、左栏筛选、? 帮助、代码视图），inspect 硬门跑 --fast、regress 跑全量含下载。教训：**代理指标（像素/计数/交互）替代不了"用户实际按的按钮"的冒烟**；外壳是产品的一半。
123. "导出没下载"两层根因：①serve 只把截屏写进 `run/export/<ts>/`，浏览器里点导出没有任何下载 → `/__dc_export__` 增 `returnFiles`（base64 回传，48MB 上限）+ 前端零依赖 store-zip（自写 CRC32，`unzip -t` 全 OK）+ `showDirectoryPicker` 选目录档 + 导出并发锁与 busy 态；②**`+ann` 图与无标注图逐字节相同**：标注层 `#dc-overlay` 是 `#dc-stage` 的兄弟节点，locator 截屏整层漏掉 → 改按 `#dc-phone` boundingBox 做 clip 像素截屏（captureBeyondViewport），ui-smoke 增 annotate-render-export（?chrome=0&ann=1 必须渲染 pin+card）与 annotate-stale-notice（视图改版后失效标注必须红字提示，不再静默消失）。教训：**"导出"要在用户机器上验证真有一个文件**（download 事件+zip 魔数+unzip 校验）；服务端目录里有文件≠用户拿到了。
124. "画布字太黑太粗"提了 4 次才根治：根因不是色值，而是**排版写在 JS inline style 且复用 `--sh-line`(#111)**——inline 压过 inspector.css 一切后续调整，画布 `zoom` 又把 9px 放大成视觉粗黑。修：JS 只写几何（`translate + scale(1/z)` 反向缩放保持屏幕恒定小字），排版/配色全部进 CSS 类（`.wbadge/.wnum/.elabel` + 新 `--sh-mark` 主题变量）；ui-smoke 断言 computed fill 相对亮度>0.08、weight≤500、size≤10px，并静态禁 JS 内 `font:600|font-weight:600|fill:var(--sh-line)`（状态栏/toast 的 inline cssText 一并收进 CSS，用 `.dc-sb-injected` 双类保特异性）。教训：**"改了没生效"的样式问题先查 inline/特异性/缩放，而不是再调一次色值**；门断言 computed style，不断言源码字符串。
125. 播放/演示"静默 no-op"三连同源：①播放按钮曾被 `#bb-scene` 包着只在场景模式显示，pages 模式点了没按钮；②`playPath` 依赖场景选中节点，pages 模式 selNode=null → 无路径；③0 journeys 时演示 `if (!j) return` 静默；④播放链异步间隙被 endPlay 后 `playRender` 解引用 `S.play===null` 崩（null.edges）。修：按钮常显；playPath 按"当前页/roots"解析节点、无出向路径回退 journeys 演示、两者皆无 `notify` 给出缺失项与修复命令；startPlay 先干净 endPlay 旧会话；playStep/scheduleNext/playRender 全加"会话仍活跃"守卫（`S.play !== pl` 直接 return）。教训：**任何用户动作都必须有可观测反馈（推进/提示/弹窗三选一）**，"没反应"本身就是 bug；门禁把"无反应"当 fail。
126. "活 PRD"只读不算活：annotations/products 此前 UI 只读（只能手改 JSON），tweaks 变体只进 localStorage（换机即丢），且与 apply-patch 写的 `variants-index.json` 不同名（inspector 读 `variants.json`）→ CLI 建的变体 `?variant=` 永远读不到。修：标注模式点元素=编辑器并写回 `annotations.json`；详情看板"功能/目标"可编辑写回 `products.json`；存变体落 `prototype/variants/<n>/{tokens.json,tokens-override.css}` 并登记 `variants-index.json`（与 CLI 同契约），读侧改读 index∪localStorage；写失败回退 localStorage 并 toast 说明"仅浏览器"。教训：**读路径与写路径必须同契约、同测试**（ui-smoke 真写盘+断言落盘+还原），只读 UI 会让"可编辑"停留在宣传文案。
127. serve 三个安全洞（开源前自查发现）：静态读用 `file.startsWith(root)` 缺分隔符（`/a/run-secret` 会被判为 `/a/run` 内）、POST `JSON.parse` 无 try（畸形 body 直接崩进程）、请求体无上限。修：`root+path.sep` 包含校验、parse 失败回 400、8MB 上限、handler 级 catch→500、`unhandledRejection/uncaughtException` 兜底、写白名单扩 `variants/<n>/{tokens.json,tokens-override.css,layout-overrides.json}` 正则。教训：**本地 loopback 工具也按"会被外部审计"的标准写服务端**；路径校验必须按分隔符比较前缀。
128. inspector 1020 行上帝文件拆 17 段：不选 bundler/ESM（file:// 与 zip 解压即开被 CORS 打死），选"分段源 + build-shell.mjs concat 成单 IIFE"——拼接产物与拆分前逐字节等价（去掉分段头后 diff=0）才允许换壳；分段文件名数字前缀定序，**字典序排序会把 100-play 排到 20-ui 前面**（首版拼接直接乱序，靠"构建=原文件"对拍抓到）。教训：重构的安全网是"产物对拍+ui-smoke 全绿"，不是眼睛。
129. 移除 Tailwind CDN 的两个真坑：①视图依赖 **preflight**（margin/box-sizing/border 重置），只编译 utility 会整体漂移（实测 diff 2.3%）→ 生成物必须带 scoped preflight，且用 `:where()` 归零特异性，否则 `#dc-stage *{border-width:0}` 的 ID 特异性会吃掉组件库的 `.mi-row{border-top:1px}`；②"unknown utility"不能用语法白名单预筛（`mt-2` 的字母后缀过不了 `[-:/[]` 后缀类）→ 改为"编译不出且任何样式源都没定义"才报（抓过真笔误 gap8）。像素对拍（CDN 版 vs 本地版 diff=0）是唯一可信验收。
130. 根 package.json 加 `"type":"module"` 后，templates/prototype/*.js 在 Node 里被当 ESM：UMD 叶子（zipstore）的 `module` 分支失效、`this` 为 undefined → require 即崩。修：该目录钉 `{"type":"commonjs"}`。教训：**加根级 type 字段是全仓解析语义变更**，动之前先跑全量单测；UMD 双环境模块要同时测 require 与浏览器两条路。
131. 开源自证三件套落地：ip-scan（git ls-files 为事实源：跟踪二进制=0、runs/dist 不入库、权利头人工确认）+ secret-scan（凭据全扫、md 只豁免 PII 不豁免凭据）+ CI zip 内容审计（zip -r 对**已存在的归档是更新不是重建**，本地复跑会残留旧条目误判，先 rm 或 -FS）。扫描器自身必含关键字 → 自匹配误报，要把扫描器文件从权利头检查里豁免。
132. **regress 曾长期"假绿"**：真根因=**契约错位**：inspect/ui-smoke 的 stdout 是扁平 summary（{pass,fail,warnFail}），regress 却读 `insj.summary.*` → 恒 undefined → fail 恒 0、pass 恒 0（报告里 `inspect pass0` 即证据，历轮回归全中招）；叠加 serve 就绪只 sleep 1.4s，慢机上子门打到未监听端口空转也照样"绿"。比红更危险的是假绿：它让"已验证"失去含义。修：①serve 就绪轮询（60×500ms）；②stdout 不可解析/exit 异常/serve 未就绪一律记 BROKEN 并判 fail；③interact 必须 views>0（0 视图=没测，不是 dead=0）。教训：**回归器的第一职责是证明自己真的测了**；任何"拿不到结果"的路径都必须是失败路径。
133. inspect 的状态依赖步骤（scene-path/play/demo）在"默认 root 无出向路径"的 hub 型 run（aliyun）上必红：旧检查假设选中节点有路径、且假设上一步没把演示跑到总结卡。修：步骤自包含（先 Escape 清模态/演示态；按 paths.json 选真有路径的节点 goto；反应判定含 dc-demo/summary/caption/modal 四种；全 run 无路径无 journeys 才降级 warn）。教训：**门里的每一步都要能从任意前态起步**，否则门测的是步骤顺序而不是产品。
134. M46 用户逐图打回："除微信外全部不及格——布局/排版/图片/图标/字体全不一样"。根因 trio：①非微信 run 的资产裁剪极少（aliyun 20 屏只裁 2 资产、slytherin 12 屏 4 资产），视图用占位色块/灰方块顶替图标与插图；②部分 capture 本身是 skeleton/空态（lark 03-docs/09-bitable、workbuddy 全程只抓到任务屏），旧视图却"脑补"了富内容 → 与原版反而不像；③门禁太松：critique 及格 3 + 模板 notes + 无"空色块"门，简陋页全绿。修：autocrop 增 --region/--mode ink（灰 glyph 也能裁）；逐 run 按 capture 重誊（含忠实 skeleton 态与同壳 extrapolation 并注明）；新硬门 placeholder-blocks（≥28px 无文本/无图/无背景图的实底色块=fail，data-placeholder-ok/data-state=loading 豁免源忠实空态）；critique 桌面/网页 full 及格线 4+全视图+证据 notes。教训：**"像不像"的第一杀手是资产覆盖率与对 capture 状态（loading/空态）的忠实度，不是 CSS 技巧**；门必须能抓"空色块顶替真图"。
135. 重修时要区分三种视图来源并显式标注：capture 直誊（最高优先）、capture 为 skeleton/空态时的忠实空态复刻、capture 未覆盖页的同壳 extrapolation（notes 写明"capture 仅 X 屏"）。把 extrapolation 当直誊报分=造假；把直誊当 extrapolation=浪费。critique notes 现在强制带资产名/区块名/状态，模板句判不达标。
136. 服务缓存头也能造成"修了没生效"的错觉：serve 只给 .html 发 no-store，.css/.js 无缓存头 → 用户浏览器连吃几天旧外壳，门禁（无缓存上下文）却全绿。修：全部 no-store + serve-http 单测钉住。教训：**任何"用户看到旧版而门全绿"的报告，先查缓存与分发路径，再查代码**。
137. M47 用户四连报：小控件"能点有反应但选不中/不进看板"、画布标签"依旧黑粗"、某页"变空白"。根因分别=①选中只认 data-dc 而接线认 data-act/data-goto（两套路由不同源）→ 选中回退链+[data-dc-auto] 合成 id，看板/标注/测量全打通；②"依旧黑粗"实为浏览器启发式缓存旧壳 css/js（no-store 后加，旧缓存不自动失效）→ 壳资源加构建哈希 ?v=__BUILD__（sync/clone 替换）；③"空白"=场景画布：hub 型 run 的 capture graph 只爬到 3 页且 v2 分类把 nav 全归 module → 树孤根、路径空 → 画布近似空白。修：paths-gen 合并视图 data-goto 与 capture graph；树渲染 nav 叶（淡虚线）；路径/播放无内容路径时 nav 巡游兜底；ui-smoke 加 scene-tree-not-empty 与 board-select-fallback 门。教训：**两套路由（选中 vs 交互）不同源必出"能点不能选"；缓存与图数据陈旧都是"修了没生效/变空白"的隐形根因**。
138. perNode[].nav 的契约是**目标节点 id**（70-nav 渲染用），不是边索引；M47 首版按边索引读 → nav 叶全滤掉、门照红。修：统一 map 回 findIndex(from&&to)。教训：跨段数据结构契约要写在分段头注释里，改一侧必查全部消费方（grep .nav）。
139. 门禁自身也会"假红"：code-view/compare-chain 依赖前置步骤留下的页面状态（播放/巡游把当前页带到无 capture 配对的视图）→ 与产品无关的假失败。修：门先落到"列表首页"再验 + waitForFunction 等回退链走完；layout-sanity empty-slot 尊重 data-placeholder-ok（源忠实空态，如未选会话的空主区）。教训：**门必须与执行顺序解耦**，否则门红 ≠ 产品坏，消耗信任。
140. M49 用户三连报："数据线/标注永远修不好"。真根因有二：①破缓存一直用 ?v= 查询串，而启发式缓存/代理忽略查询串 → 用户浏览器永远跑旧 inspector.css（探针实测服务端 computed 已正确）→ 改文件名哈希（inspector.<build>.css）+ boot 自愈（校验 DC_BUILD 不匹配 cache:reload 强刷一次）；②"丑线"主体是播放 band（蓝 1.6px）与 nav 灰虚线混在数据线里。修：--sh-wire（亮浅黑/暗灰白）统一 wire/band/箭头，width≤1.2；标注/序号 --sh-wiremark 400 字重；ui-smoke 新门 wire-ink/wire-label-lite 亮暗双主题锁死。教训：**"修了没生效"先查交付链路（缓存/分发），再查代码；查询串破缓存不可靠，文件名哈希才是真破缓存**。
141. 树/路径两模式的职责被用户最终定稿：左栏=纯节点目录（删 tr-nav 胶囊海）；树模式=以选中节点为根的纯前向子树（nav 叶移除，M47 的"画布不空白"改由路径模式兜底）；路径模式=列出所选根全部路径行（行点选供播放/导出）。M47 的 scene-tree-not-empty 门随之改语义：树≥2 卡 或 路径行≥1。教训：**同一画布的多种模式要先定义各自职责边界，门的语义跟着职责走，否则门与需求互斥**。
142. demo 靶站全门验证暴露链路缺口：crawl 型 capture 无 ui-tree/无多页配对时 parity 全 mode=none 假红 → parity 增 mode=na（无 capture 配对=范围外，门跳过）；视图 id 必须与 capture id 对齐（01-index vs 01-index-html）否则配对全失。demo-orbit 最终 interact dead=0、inspect 40/0、ui-smoke 22/0、fidelity hard=[]、critique 5×4——"一步到位"有了可复跑证据。
143. M49 把 parity 控件覆盖<0.8/交互<0.9 提为硬门后，sly/wechat 存量 run 全红——债一直存在，只是旧门只看 mode。处置不藏债：M49 后新建 run 硬拦（demo-orbit 证明新管线一步达标），存量 run=warn+report/parity-debt.md 公示清债清单；另修 parity 探针自身两处偏差：proto 控件计数漏 [data-act]/span[data-goto]（选择器改 tag-agnostic）。教训：**新门照亮存量债是好事；处置要"新账硬拦、旧账公示限期"，既不放水也不把历史债冒充当轮失败**。
144. M50 用户报 apple"全白卡+两个01+树空"。根因=**双 id 空间**：capture graph 节点 id（01-index/02-us-shop-goto-store）与视图文件 id（01-home/02-store）并存于 paths.json——无视图文件的节点渲染白卡、两套根并立、树/路径各说各话。修：paths-gen 别名归一（数字前缀别名+标题词重叠消歧→重映射边→合并重复边→删旧节点）；根改按前向入边（nav 入边也算）→hub 站唯一真根。教训：**图数据与视图文件必须单一 id 空间；任何"合并多来源边"的改动都要先做 id 归一，否则静默双图**。
145. 树语义三轮迭代终稿：M47 nav 叶淡虚线（用户嫌乱）→ M49 纯内容子树（用户报"树空"）→ M50 **BFS 层级树**：子边仅取 depth+1 一层（hub 完全图的前向树=80 卡毛发球/8660 卡组合爆炸两连坑：预算封顶要放在 mk 入口第一句否则深度cap叶绕过；同层横跳不进树）。目录与画布树同语义；完整旅程归路径模式（列全部路径行）。giant-chain 门改评 paths 不评 tree（树含 nav 是设计而非病）。教训：**"树"的产品定义=层级概览（每层只下一层），"路径"=旅程枚举；两者职责混用必反复打回**。
146. M51 用户定稿导出心智："初始 figma 和 json 生成时就该有；导出=编辑后重导出"。此前导出只有 PNG/board.json，设计产物链（schema 早已定稿 page.spec.schema.json、figma-plan 生成器早已存在）从没在生成期跑过=链路断点。修：collect-design.mjs 采集器（live computed 真值）生成期自动产 pages/*.spec.json + design/figma-source.json；导出按钮对 live 重采集（edit-overrides 运行时已作用 → 天然含编辑）入 zip；门双保险。教训：**schema/工具存在≠链路存在；产物必须在生成期落地并被门盯住，否则"导出"永远缺胳膊少腿**。
147. collect-design 首版两处浏览器闭包坑：page.evaluate 只序列化单个函数体，外部 const（ACT_KIND/regionType）在页内 undefined（demo 侥幸过=其 regions 无 data-act 走到分支前返回）；serve 进程改代码后不重启=旧模块继续服务（导出空 files 假象）。教训：**evaluate 闭包必须自包含；改 serve/export 代码必重启服务再验**。
148. M53 用户："demo 好丑，做一个宠物乐园 2.5D 质感萌宠原型"，并定稿替换 orbit。执行要点：①genimg clay-icon 首 prompt 出"猫耳女孩"（人形）→ prompt 必须显式 "animal only, no human" 且换 seeds 重试；②生成图带灰底 ≠ 透明 → 不抠图，改"陶土相框"设计（圆角+白边+落地投影），灰底变构图元素；③自研 run 无 capture：parity 全 na、compare-chain 走 miss 分支、tokens.css 需手写（否则 index 404 噪音+figma variables 空）；④装饰性绝对定位溢出（会员卡大爪印）会触发 layout-sanity clipped → 用 overflow:hidden 包裹层收口而非删装饰。替换动作：demo/ 源站与 demo-orbit run 下线，petpark 上位（源站五页由 run 视图脚本化镜像，保 clone 靶连续性）。
149. M54 安装器首跑两坑：①bash UTF-8 locale 下 `$VAR（中文括号` 会把多字节字符吞进变量名 → "unbound variable" 假象，所有插值必须 `${VAR}`；②`--agent all` 忘了展开成三家列表。另 macOS 无 `timeout` 命令（agent 自发使用会失败，prompt 里别示范）。教训：**安装器是用户第一接触点，任何 locale/平台假设都要在真机零交互跑通**。
150. 三 agent headless 实证（M54-E）差异巨大：opencode `run` 非交互可用但**外部目录自动拒**（/tmp 全禁，e2e 必须 cwd 内相对路径）；claude `-p` 在本机账号 403 "Access to model denied"（账号/模型资格问题，与 skill 无关，如实记录不硬绕）；codex exec 旗标随版本漂移（--ask-for-approval 已删、用户 config.toml 的 model_reasoning_effort="max" 与 ~ 路径 model_catalog_json 在 0.134 直接启动失败）需 `-c` 覆盖。教训：**"支持某 agent"必须以该 agent 的 headless 模式真跑一条端到端为准，CLI 旗标与权限模型都是移动靶**。
