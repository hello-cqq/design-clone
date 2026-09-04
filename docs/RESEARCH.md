# RESEARCH — 调研结论存档（2026-09，7 路并行 + 补研）

> 只记结论与出处，过程不存。许可信息以本表为准再复核。

## 1. GUI 执行层

| 项目 | 结论 | 许可 |
|---|---|---|
| **Midscene**(web-infra-dev) | 选定为执行层：Android(adb)/iOS(WDA)/桌面(nut.js fork)/Web(Playwright)/鸿蒙；`npx @midscene/*` 单命令可被任意 agent 调用；官方 midscene-skills 验证了"宿主当大脑+CLI 当手脚"架构；MIDSCENE_MODEL_* 接任意 OpenAI 兼容 VLM | MIT |
| MAI-UI(Qwen-UI-Agent, 通义) | 是**模型**不是框架：ScreenSpot-Pro/AndroidWorld SOTA；无执行层/CLI/MCP；2B/8B 权重 Apache-2.0，本地需 vLLM0.11+GPU → 仅作可选大脑 | Apache-2.0 |
| Mobile-Agent v3 / Agent TARS | 链路与 Midscene 重叠，只参考不引入 | — |
| AppCrawler / Fastbot | 全量遍历策略参考（黑名单/深度/回溯）；不作为依赖 | — |

## 2. 设备控制（实测+文档）

- Android：`screencap` 多屏设备需 `-d <SurfaceFlinger长id>` 且警告污染 stdout；`screenrecord` ≤180s 无声且**输出路径必须设备端**；`input text` 不支持中文（yadb）；`pm grant` 自动授权；小米需「USB调试(安全设置)」；Linux 需 udev 规则；Win 需 USB 驱动
- iOS：simctl(screenshot/recordVideo/openurl) 一等公民；真机 WDA 免费签名 7 天过期；pymobiledevice3 是 **GPL**（只能子进程隔离）；midscene-ios 走 iPhone Mirroring
- 桌面：mac screencapture/辅助功能授权；Win ffmpeg gdigrab；Wayland 下 nut.js 不可用

## 3. 链接取材矩阵（源码级核实）

| 平台 | 首选 | 兜底 | 备注 |
|---|---|---|---|
| 抖音 | lux(视频+图集) | yt-dlp(需新鲜cookie,不支持图文) → Evil0scal API(Apache-2.0) | 短链 HEAD 重定向解析 |
| B站 | yt-dlp | lux | 高清需 cookie |
| 小红书视频 | yt-dlp | lux | 必须 cookie+xsec_token |
| 小红书图文 | 网页模拟提取 `__INITIAL_STATE__.imageList` | ReaJason/xhs(MIT,14个月未更新) | yt-dlp 只给缩略图 |
| 快手 | you-get | 网页模拟 | yt-dlp **不支持** |
| 转录 | faster-whisper large-v3-turbo int8（中文；vad_filter） | whisper.cpp | 均 MIT，离线免费 |
| 抽帧 | ffmpeg 场景检测 0.4 + 1fps | — | 短视频足够 |

## 4. 生成/迭代层

- screenshot-to-code(MIT)：HTML+Tailwind 一等公民；Playwright 渲染自检闭环 → 借鉴
- Design2Code(NoviScl, 代码 MIT；数据 research-only)：评分=Block-Match(文本/位置/色彩)+CLIP → 验证环借用
- 动效：GSAP 2025-04 起全免费含商用；motion/anime.js MIT；react-bits(MIT+CommonsClause) 仅灵感
- Tailwind Play CDN 仅限开发期；交付用 @tailwindcss/cli
- token 提取：Color Thief v3(MIT, CLI 出 CSS 变量)；本项目自实现量化脚本(tokens.mjs)

## 5. 规格驱动与预设

- **laowangba-pmprototype-skill**(MIT)：page.ui.schema.json 全文已研读——闸门数据化(anti_slop 唯一合法值)、nodeId 回填定向 patch、布局意图非像素、页型约束；增量修改协议(先改文档再 patch) → 我们的 spec.yaml 母体
- **open-design**(nexu-io, Apache-2.0)：151 个设计系统包三件套 manifest+DESIGN.md+tokens.css；skills/ 含 figma 官方执行层 → 风格预设库底座
- awesome-design-md：74 品牌 DESIGN.md（本机已装）→ 预设库叠加

## 6. Figma 路线

- REST API **无写入端点**（唯一可 POST 的是 Comments）
- 官方远程 MCP(mcp.figma.com)：免费账号、write-to-canvas、beta 免费（将来按量）→ 主路线
- talk-to-figma-mcp(grab, MIT)：全原语含 set_image_fill，链路 bun+WS+插件 → 降级
- Framelink 只读 → 验收用；react-figma(MIT) → 未来自建备选

## 7. 工艺三项目（2026-09 补研，均 MIT）

| 项目 | 借鉴 |
|---|---|
| **baoyu-design**（Claude Design 封装） | 读真实样式表而非眯眼看截图；设计系统绑定=契约（_d_meta.json、primary/auxiliary、版本钉死）；Tweaks 实时调参(localStorage)；starter-components(设备壳/并排变体画布)；预览 localhost+指哪改哪 |
| **huashu-design** | 品牌资产协议 5 步硬流程（问→搜品牌页→三条兜底下载→grep #hex 频率→固化 brand-spec；A/B 测方差低 5 倍）；模糊需求三逻辑并行出真实视觉（秒数轮盘/获奖站参照/最佳设计师），不文字盲选；60 风格库按大胆/中性/安静分级；5 维评审(Keep/Fix/QuickWins)；反 slop 细则(text-wrap:pretty/oklch/禁 emoji 图标/Inter display/左 border accent)；Junior Designer 早 show；HTML→MP4/GIF 管线(Playwright+ffmpeg) |
| **effective-html** | 保真度分模 wireframe/mockup/prototype；wireframe"故意的未完成"+结构性方向同文件选择器；状态先列后建、省略态显式声明；a11y 交互完整性契约(键盘/focus/dialog Esc/reduced-motion/死按钮解释边界)；handoff 返回保真模/场景/状态/排除项；验证要算每表面 fg/bg 对比 |

## 8. 分发

- Agent Skills(agentskills.io) 为 7 端共同标准；`npx skills add`(vercel-labs, MIT) 映射表含全部目标端
- frontmatter 最严交集=6 字段（Claude 上传校验白名单）；opencode name 正则最严
- WorkBuddy 无公开规范 → dist/*.zip GUI 上传兜底

## 素材与生图许可存档（M8，2026-09-01）
- **pollinations.ai**：官方 APIDOCS（MIT 文档）确认匿名免费 1req/15s、注册 Seed 免费 1req/5s、付费档不碰；2025-03-31 起免费档可能带水印（nologo 需注册）；flux 文生图匿名实测可用，kontext 图生图匿名 500
- **iconify**（api.iconify.design）：免 key CDN，聚合 200+ 图标套，逐套许可多为 MIT/Apache/ISC；Android 系优先 material-symbols
- **Simple Icons**：CC0，品牌 logo（wechat/tiktok/xiaohongshu 均在库）
- **pixelmatch**：MIT（Playwright 同款），已入 scripts/package.json
- **字体**：PingFang SC（系统）/Noto Sans SC、Inter、Space Grotesk（OFL）/MiSans、HarmonyOS Sans（厂商免费商用）；国内 webfont 走 loli 镜像避 jsdelivr 墙
- 许可纪律：落地新包时 doctor 断言 license 白名单（MIT/ISC/Apache-2.0/OFL/CC0/BSD），存档于此再入 package.json

## open-design（nexu-io/open-design，Apache-2.0）— 2026-09-02 借鉴存档
- 形态：开源 Claude Design 替代；agent-native，DESIGN.md 品牌契约 + 151 design systems + skills/plugins/templates 四层可组合；沙箱 iframe 预览；HTML/PDF/PPTX/MP4 导出
- 借鉴（仅设计模式，不抄代码，M14 落地）：移动壳组件模板化（状态栏/渐变字符头像/列表行+红 badge/搜索栏/tabbar）是「一句话生成也标准」的根因——标准感来自壳组件不来自生图；预览|代码 toggle；设备类型下拉；分享=状态链接；自检三件（交互流程/对比度/布局溢出）；导出黑主按钮
- 许可：Apache-2.0，模式借鉴无需 attribution，存档备查

## open-design 深读二档（M14b，2026-09-02）：它怎么把原型做好
- **craft/ 规则库**（动画纪律/状态覆盖/anti-ai-slop/排版层级/a11y 基线…）：把「品味」写成可 lint 的规则。关键条目：
  - 动画：150ms 默认确认、200-300ms 入场、300-500ms 跨屏；微交互≤500ms、高频≤200ms；循环/环境动效必须有暂停或自动停（>5s 违反 WCAG 2.2.2）；transform 类必须尊重 prefers-reduced-motion
  - 状态：每表面五态（loading/empty/error/满/极值）；「只画满态」是 AI 生成 UI 最可靠的失败模式；spinner 60s 必须升级为错误/取消
  - anti-slop P0：默认 indigo、hero 紫蓝渐变、emoji 图标、占位 CDN、虚构指标、lorem 文案——linter 直接挡
- **mobile-app 种子制**：设备壳+状态栏 SVG 画一次在 template.html，agent 只许复制；checklist.md「anti-fake-device」清单（外圆角>内圆角、状态栏全浓度、home 条最后可见、tabbar 顶边+blur、tap≥44、accent≤2、数字等宽）
- **借鉴落地（M14b）**：状态栏填充式三件 SVG 入种子与 dy-qa2；inspector 流光按环境动效纪律（仅选中流动/失选即停/reduced-motion 降级）；导出恰两项；新增 references/capture-quality.md（截图质量门禁）+ critique-loop.md + scripts/shotdiff.mjs（生成后必审闭环）；patterns 增 anti-fake-device 与 P0/P1/P2 自查；vlm-analysis §7 增地基体检与产出后必审

## M23 外部优秀 AI 设计项目借鉴（2026-09-03）
- awesome-design-md（74 品牌 DESIGN.md）：apple 为 web-apple 风格真源（#0066cc/#0071e3/#2997ff、parchment #f5f5f7、SF 负字距阶、44px 吸顶半透明 nav）；aliyun 借 stripe/clickhouse 云类纪律+源橙。
- ui-ux-pro-max：motion.csv（120-160ms 曲线）/google-fonts 配对/app-interface 布局基线 → 组件库交互态与字号阶。
- 借鉴落点：web-marketing.css / desktop-app.css / mobile-im.css 交互态库；prototype-spec tokens 三层（primitive→semantic→component）。
