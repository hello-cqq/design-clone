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
