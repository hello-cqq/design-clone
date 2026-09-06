# Design Clone（设计克隆）

> 英文版（参考语言）见 [README.md](README.md)。

一个跨 Agent 的通用技能：自动捕获真实应用的界面与交互路径，一比一复刻为**可用于生产的"活 PRD"**——不只是能点的原型，而是带产品批注、设计 inspect、功能路径故事板/播放、可编辑、可导出的完整设计交付物。

> 面向没有产品设计经验的创作者和开发者：不再从零设计原型，而是"站在优秀产品的肩膀上"，把成熟产品的设计思维、交互路径、视觉语言变成你项目的起点。**克隆是起点，不是终点。**

## 原型外壳（inspector）实测能力

| 能力 | 入口 / 快捷键 | 内容 |
|---|---|---|
| 页面 / 场景 | `1` / `2` | 页面列表与场景树/路径双画布（连线编号与标签恒定为浅细字） |
| 预览 / 代码 | 顶栏 | 视图 HTML 实时查看、复制、新标签打开 |
| 标注 | `A` | 折线批注：**点元素即新增/编辑/删除**，写回 `annotations.json`；失效标注红字提示 |
| 播放 | `P` / 底栏 | 页面模式从当前页起播、场景模式播所选路径；无路径回退演示旅程，缺什么会明说 |
| 演示 | `D` | 自动播放 + 字幕 + 模拟弹窗 + 安全边界卡 + 总结卡 |
| 编辑 | `E` | 拖拽元素、右栏改样式 → `edit-overrides.json`，`Ctrl/⌘+Z` 撤销、一键还原 |
| 调参 | 右栏折叠节 | tokens 实时改；**存为变体**落 `prototype/variants/<名>/`，`?variant=` 复现 |
| 导出 | 顶栏 | **默认浏览器下载 zip**；可选"选目录导出"或"仅存服务端 `export/<ts>/`"；含页面 ±标注、场景树、board.json |
| 分享 | 顶栏 | 状态链接 / 纯净版(`?embed`) / 卡片版(`?card=1`) / 全屏演示 |
| 设备 | 顶栏下拉 | 手机 / 平板 / 桌面 / 网页；选择持久化并进分享链接 |
| 对照 | 顶栏 | 与原截图同尺度并排 + 同步滚动（缺源图自动回退链并明示） |
| 帮助 | `?` | 全部快捷键清单 |

视图主体必须是 **live 控件**（`templates/components/` 三套组件库 + `runtime.js` 交互运行时，截图当视图会被硬门拦下）；样式为自带组件库 + `knowledge/tokens.css`，无运行时 CDN 依赖。

## 四大模式

| 模式 | 说明 | 示例指令 |
|---|---|---|
| **Clone** | 自动操作 Android 手机 / 浏览器 / macOS 桌面，逐页截图、录屏、记录交互路径，复刻整个应用或指定场景 | "帮我把微信支付场景的设计原型克隆出来" |
| **Link** | 从抖音 / B站 / 小红书等链接（或本地视频/图片）提取设计素材：下载→抽帧→转录→识别页面 | "复刻这个 B站视频里展示的记账 App 设计" |
| **Remix** | 在复刻的原型上按你的想法调整：字体、配色、风格、动效、布局，最小层修改+自动验证 | "保留布局，整体改成暗黑赛博风，卡片加弹性动效" |
| **Export** | 可选：接入 Figma MCP 时，把原型导出为可编辑的高保真设计稿 | "把这个原型导出到 Figma" |

## 核心能力

- **自动捕获**：截图 + 控件树 + 录屏 + 动作日志，权限弹窗自动处理，支付/密码/验证码强制暂停等人确认
- **结构化资产**：屏幕按原子功能/场景/旅程组织，输出 `paths.json`（交互路径，按真实交互逻辑分类）、`tokens.css`（色彩/字体/间距）、`DESIGN.md`（设计理念）
- **可交互原型**：纯静态 HTML，浏览器直接打开即可点击交互，屏幕间按真实路径跳转
- **规格驱动**：每页一份 spec 布局规格，改色/换字/加动效只动最小层，支持增量修改与回滚
- **零额外消费**：除你已有的大模型 API 外，全部使用开源免费工具

## 质量门（"绿"是有含义的）

`node scripts/regress.mjs` 对全部 run 跑所有门并写 `report/regress-<ts>.md`：
doctor（环境）→ interact（**真点每个控件**，dead=0）→ inspect（live-views / placeholder-scan / asset-qa / layout-sanity / privacy-anon / paths-sanity / appicon-present / structural-critique / **ui-smoke 外壳冒烟**）→ fidelity（按 source-map 正确配对的像素+风格差）→ critique（VLM 结构对照）→ eval（总分）。
外壳功能（播放/导出/分享/设备/标注写回/画布排版）由 `qa/ui-smoke.mjs` 真点验证——用户按的按钮就是门。

## 安装

适用于所有支持 Agent Skills 的客户端（opencode / Claude Code / Codex / Qoder / Qwen Code / Trae 等）：

```bash
# 一条命令安装到你的 agent（按需选择 -a 参数，可多个）
npx skills add tt-a1i/design-clone -a opencode
npx skills add tt-a1i/design-clone -a claude-code
npx skills add tt-a1i/design-clone -a codex
npx skills add tt-a1i/design-clone -a qoder -a qwen-code -a trae

# 全局安装
npx skills add tt-a1i/design-clone -g -a opencode
```

WorkBuddy 等无 CLI 的平台：下载 `dist/design-clone.zip`，在"添加技能 → 上传技能"中导入。

安装后在 agent 里说一句 **"运行 design-clone doctor"** 完成环境自检与依赖初始化。

## 平台支持

| 平台 | 捕获方式 | 状态 |
|---|---|---|
| Web 应用 | Playwright（截图/录屏/DOM 快照） | ✅ |
| Android | adb + Midscene CLI（截图/控件树/输入/录屏） | ✅ |
| 抖音 | web-sim（登录 profile 持久化 + aweme API 拦截 + 轮播翻页） | ✅ |
| B站 | web-sim（__playinfo__ dash 流 + ffmpeg 合流；CLI 被 412 风控） | ✅ |
| 小红书 | xhs.mjs（__INITIAL_STATE__ 匿名可取图文原图/视频） | ✅ |
| YouTube | intent 梯级 L1 yt-dlp（shorts/长视频） | ✅ |
| TikTok | L1 yt-dlp 视频；photo 帖 L3 headless/L5 真机横滑 | ✅ |
| Facebook | 系统代理感知 + L2 og 提取（公开帖免登）；登录帖 L3 | ✅ |
| 手机 app 深链 | L5：am start + 横滑 + 长按保存 + 关键区域裁剪；无网/无设备自动回落 | ✅ |
| iOS | 模拟器（simctl）优先；真机引导配置 WebDriverAgent | 🚧 |
| macOS / Windows | Midscene computer / screencapture / ffmpeg | 🚧 |

## 使用示例

```
帮我把 Hacker News 的设计原型克隆出来
克隆小红书"发布笔记"场景的设计原型，只要这条路径
这个抖音视频里展示了一个很好的音乐播放器设计，帮我复刻：https://v.douyin.com/xxxx
在复刻的基础上，主色换成墨绿，字体改成衬线体，整体更杂志感一些
```

## 依赖（全部免费，doctor 会自动检查）

必需：Node.js ≥ 20.19、npm
按需：adb（Android）、Playwright Chromium、ffmpeg、lux、yt-dlp、you-get、scrcpy

## Quick Start（一条链）

```bash
# 1) 依赖
cd skills/design-clone/scripts && npm install && npx playwright install chromium
node doctor.mjs                      # 环境探针（adb/权限/点击通道）

# 2) 抓一个网站并起服务
node web/capture.mjs --url https://news.ycombinator.com --out ../../demo-run/capture --max-pages 5 --assets 6
# 3) 生成原型后
node serve.mjs ../../demo-run --port 4210
open http://localhost:4210/prototype/

# 4) 质量门
node qa/inspect.mjs http://localhost:4210 <run> --run ../../demo-run
node qa/ui-smoke.mjs --run ../../demo-run --base http://localhost:4210
node eval/eval.mjs --run ../../demo-run --base http://localhost:4210
```

## 零 IP 风险试跑

`demo/` 自带自研原创示例站（Orbit Tasks，原创设计、无任何第三方资产）：

```bash
python3 -m http.server 8099 --directory demo
node skills/design-clone/scripts/clone.mjs --target orbit --platform web --url http://127.0.0.1:8099/ --serve
```

## 致谢与许可溯源

本 skill 的工艺借鉴自以下 MIT 开源项目（借鉴方法论与模式，代码为自研实现）：
- [baoyu-design](https://github.com/JimLiu/baoyu-design)（Claude Design 封装）— 读真实样式表、设计系统绑定契约、Tweaks、starter components
- [huashu-design](https://github.com/alchaincyf/huashu-design) — 品牌资产五步协议、三逻辑变体顾问、五维评审、反 slop 细则、HTML→视频导出
- [plannotator/effective-html](https://github.com/plannotator/effective-html) — 保真度分模、状态先列后建、a11y 交互完整性、handoff 契约
- 另有 laowangba-pmprototype-skill（规格 schema）、open-design（预设三件套）、Design2Code（评分）等，见 `docs/RESEARCH.md`

## 许可与合规

- 代码：MIT
- 捕获的应用截图/视频版权归原作者与平台所有，**仅限个人学习与内部设计参考**，不得将复刻产物冒充原创发布或商用
- 仓库不随附任何第三方 App 截图/logo/字体；`design-clone-runs/` 已 gitignore，内置 demo 目标为自研原创
- 内置安全红线：不自动执行支付、不输入密码、遇验证码暂停；GUI 采集需 `knowledge/consent.json` 收据
- 详见 [PRIVACY.md](PRIVACY.md)、[docs/PROVENANCE.md](docs/PROVENANCE.md)、[SECURITY.md](SECURITY.md)
