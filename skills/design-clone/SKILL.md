---
name: design-clone
description: >-
  设计克隆：自动捕获真实应用（Android/网页，后续支持 iOS/桌面）或视频/图文链接中的界面与交互路径，
  一比一复刻为可交互的本地 Web 原型（静态 HTML）+ 结构化设计资产（截图、状态图、设计 tokens、设计理念文档），
  并支持按用户想法在原型上增量调整（配色/字体/风格/动效/布局）。
  Use when 用户说"克隆/复刻/复现某应用的设计原型"、"把 XX app 的界面搞出来"、"抓取应用所有页面"、
  "从这个视频/链接里复刻设计"、"在复刻的原型上改成某种风格"、"帮我把微信支付场景的设计搞出来"。
  不适用：从零原创设计（无参考对象）、仅要一张设计图（用画图类工具即可）。
license: MIT
compatibility: opencode, claude-code, codex, qoder, qwen-code, trae
metadata:
  version: "0.5.0"
  homepage: https://github.com/hello-cqq/design-clone
---

# Design Clone（设计克隆）

把真实应用的设计"克隆"成**可用于生产的活 PRD**：自动捕获 → 结构化 → 复刻为可交互原型 →
内置五模式 inspector（普通/产品批注/设计 inspect/编辑/路径故事板与播放）→ 按需 Remix 改造 → 可选导出 Figma。
克隆是起点，不是终点。

## 第 0 步：环境自检（每个新会话首次使用前必做）

```bash
node {SKILL_DIR}/scripts/doctor.mjs
```

`{SKILL_DIR}` = 本 SKILL.md 所在目录。若有 `[需要安装]` 项，先按提示安装再继续。
首次使用 Web 捕获还需：`cd {SKILL_DIR}/scripts && npm install && npx playwright install chromium`。

## 模式路由

| 用户意图 | 模式 | 跳转 |
|---|---|---|
| 克隆某 app / 网站的**全部或指定场景**原型 | Clone | §A |
| 给一个**视频/图文链接**或本地视频/图片，要复刻其中的设计 | Link | §B |
| 在**已有复刻产物**上按想法调整（改色/换字/风格/动效/布局） | Remix | §C |
| 把原型导出为 **Figma** 设计稿 | Export | §D |
| **全链路验收 / QA / 回归**（产品+设计+测试三角色） | QA | §E |

先与用户确认三件事再动手：**①目标（应用名+平台 或 链接）②范围（全量 / 指定场景路径）③产物位置**（默认 `./design-clone-runs/<目标名>/<run-id>/`）。

---

## §A Clone 模式（自动捕获 + 复刻）

### A-一键（推荐入口，M44）

一条命令编排「抓取→结构化→可交互原型→门禁→起服务」：

```bash
# 统一入口（M44h）：一句话 / 几张图片 / 网页链接 / 视频图文链接 / app 名 皆可
node {SKILL_DIR}/scripts/clone.mjs --entry "复刻微信朋友圈和聊天，安卓，全量"
node {SKILL_DIR}/scripts/clone.mjs --entry "https://v.douyin.com/xxx 这个视频里的界面"
node {SKILL_DIR}/scripts/clone.mjs --entry "/tmp/a.png,/tmp/b.png 做成可点原型"
# 或显式参数：
node {SKILL_DIR}/scripts/clone.mjs --target <名> --platform <web|android|ios|desktop> \
  [--url <网址>] [--images a.png,b.png] [--scope full|scene] [--out <run目录>] [--port 4200] [--serve] [--resume]
```

- **entry.mjs 路由**：视频/图文宿主(douyin/xhs/bili/tiktok…)→Link 六级梯；普通站点→web crawl；app 词典(微信/抖音/相机/圆周轨迹/飞书/workbuddy…)→device；本地图片→capture/screens；歧义只问一次。
- **GUI 采集红线**：android/desktop 抓取前须 `knowledge/consent.json`（用户口头同意后由 agent 写入），否则退出并提示。
- **web 目标**：近乎全自动（capture→dedup→tokens→外壳+runtime→门禁→serve）。
- **android/ios/desktop**：脚本跑确定性步骤后，**打印宿主 agent 的抓取/誊写交接命令**（VLM 决策与逐页 s2c 誊写由宿主完成），完成后 `--gates-only` 收口。
- **中断续跑**：`--resume` 读 `knowledge/run-state.json` 跳过已完成阶段。
- **展示契约（M44i）**：每 run 自带 `prototype/appicon/`（16..512+maskable+`icon-spec.json`，用户改 spec 后 `gen/appicon.mjs --regen` 调整图标）+ `knowledge/showcase.json`（原型展示网站读它）。
- 脚本自动跑六门：`privacy`/`interact`/`audit`/`inspect`(含 layout-sanity/paths-sanity/appicon-present/critique)/`eval`(含 interactivity+style-parity)，并起服务打印「打开即用」地址。
- 已装配的 run 仅收口：`node {SKILL_DIR}/scripts/clone.mjs --target <名> --gates-only --out <run目录> --serve`。
- 全量回归/自修：`node {SKILL_DIR}/scripts/regress.mjs [--full]`、`node {SKILL_DIR}/scripts/autofix.mjs --run <run> --base <url>`；失败查 `references/recovery.md`。
- Remix 保留原版：`apply-patch.mjs <run> <patch> --variant <名>` → `?variant=<名>` 切换，default 永远是原版。

### A0 环境与人接管（Android 目标必做，Web 目标跳过 2/3）

1. 跑 `node {SKILL_DIR}/scripts/doctor.mjs`；`❌` 项按提示装（跨平台命令见
   `references/install-guide.md`），`⚠️` 设备项按 `references/human-takeover.md` 引导用户
2. `bash {SKILL_DIR}/scripts/android/prepare.sh` —— 唤醒/USB 常亮/长超时/锁屏检测；
   锁屏、授权弹窗等无法自动化的项，脚本会打印给用户的话术
3. 捕获中任何卡点（注入被拦/灭屏锁屏/登录/验证码）→ 一律按 human-takeover 四段式
   （检测→话术→验证→继续）处理，不硬重试超过 2 次
4. **所有读帧/读截图/GUI 决策先读 `references/vlm-analysis.md`**，按其 JSON 协议输出
   （页面三要素/边关系标签/弹窗即页节点/保真档/素材 bbox），保证信息挂接 inspector v3
4. 结束时跑 `prepare.sh --restore` 并念恢复清单（safety-rules §9）

### A1 制定捕获计划

输出一份简短计划给用户确认（除非用户说直接开始）：
- 目标应用/网址、平台（android / web）
- 范围：全量遍历时给出**预算**（如最多 15 屏、每屏最多 5 个动作）；指定场景时给出**路径预想**（如：首页 → 我 → 服务 → 钱包 → 支付）
- 安全边界：读取 `references/safety-rules.md`，向用户声明暂停点（支付确认/密码/验证码/登录）

### A2 执行捕获

产物目录结构严格遵循 `references/directory-spec.md`。

**Web 目标**：

```bash
node {SKILL_DIR}/scripts/web/capture.mjs \
  --url <目标网址> --out <产物目录>/capture \
  --max-pages <预算页数> --viewport <mobile|desktop|WxH> \
  [--max-depth n] [--budget-seconds n] [--resume]
```

脚本自动完成：逐页截图、提取交互元素树（ui-tree）、记录页面跳转图（graph.json）、
感知哈希去重、输出 manifest。若需要录制完整操作视频，加 `--record`。

预算制：`--max-pages`/`--budget-seconds`/`--max-depth` 三者取最先触发者停爬（stop_reason
入 manifest）。每完成一屏增量落盘 `state.json`+`graph.json`，被杀不丢进度；下次加 `--resume`
从积压队列续跑（不重拍已捕获节点，`--max-pages` 为累计上限）。

全量遍历后读 `coverage.json`（路径前缀分布/未发现 top30/深度分布/去重统计），
在 `knowledge/DESIGN.md` 写"覆盖深度"段：已覆盖区结论 + 未覆盖区标注推断。

**iOS 模拟器目标**（simctl，细则 `references/ios-desktop.md`）：
`bash {SKILL_DIR}/scripts/ios/sim-capture.sh list|shot|launch|openurl|loop`。
simctl 无原生 tap → 默认人接管点击，或辅助功能权限下 `desktop/capture.sh click`。
无 simctl 时脚本 exit 3 打印回落（真机 WDA / 人接管 / Link 模式）。

**桌面目标**（mac；win 模板见 ios-desktop.md）：
`bash {SKILL_DIR}/scripts/desktop/capture.sh check|shot|click|type|loop`。

**Android 目标**（需要已连接设备 + adb，doctor 已确认）：

1. 启动录屏（后台循环，绕过 180s 限制）：
   `bash {SKILL_DIR}/scripts/android/record.sh <产物目录>/capture/videos`
2. 启动目标应用：`adb shell monkey -p <包名> -c android.intent.category.LAUNCHER 1`
   （不知道包名先 `adb shell pm list packages | grep -i <关键词>`）
3. 进入"截图 → 决策 → 操作"循环（动作语法见 `references/action-protocol.md`）：
   ```bash
   adb exec-out screencap -p > capture/screens/<screen-id>.png
   adb shell uiautomator dump /sdcard/ui.xml && adb pull /sdcard/ui.xml capture/ui-tree/<screen-id>.xml
   adb shell input tap <x> <y>            # 或 swipe / keyevent / text
   ```
4. **决策由你（宿主 VLM）完成**：看最新截图 + 控件树，决定下一个动作，目标是覆盖计划中的范围。
   可选增强（视觉定位更准）：`npx @midscene/android ai-tap "<自然语言目标>"`（需配置 MIDSCENE_MODEL_* 环境变量）。
5. 每步追加一行到 `capture/actions.jsonl`（格式见 directory-spec）；遇到新页面分配 `<screen-id>`，
   已有页面（肉眼/哈希相同）只加边不重复截图。
6. 权限弹窗：`adb shell pm grant <包名> <权限>` 可自动授予的尽量自动；否则按安全规则处理。
7. 结束：停止录屏脚本，运行 `node {SKILL_DIR}/scripts/dedup.mjs <产物目录>/capture` 复核去重。

**指定场景模式**：只沿计划路径前进，路径外的入口只记录不进入；到达场景终点（如支付确认页前）即停。

### A3 结构化与设计提炼

基于捕获产物（截图 + ui-tree + graph + actions），**先按 vlm-analysis.md §2 做平台检测**
（web/android/ios/ipad/desktop + web.form + desktop.os；confidence=low 或信号冲突必须 question 询问用户），
落盘 `knowledge/platform.json`，再按协议产出 products.json 三要素（功能/目标/再生成提示词）与 edges 关系标签：

1. `node {SKILL_DIR}/scripts/tokens.mjs <产物目录>/capture/screens --out <产物目录>/knowledge`
   提取主色板/背景色，生成 `knowledge/tokens.css` 与 `knowledge/tokens.json`
2. 你阅读全部截图与图数据，撰写：
   - `knowledge/DESIGN.md`：产品目标推断、设计理念、信息架构、导航模型、组件清单、
     排版与色彩规律、值得借鉴的设计决策（这是"设计思维"的载体，不许敷衍）
   - `knowledge/flows/<场景名>.md`：每条交互路径的分步说明（屏幕 → 动作 → 屏幕，附截图引用）
   - `knowledge/components.md`：原子组件清单（导航栏/列表项/按钮/卡片…含尺寸与状态）
3. 为每个页面生成规格 `prototype/pages/<screen-id>.spec.yaml`（schema 见 `schema/page.spec.schema.json`，
   写法见 `references/prototype-spec.md`）

### A4 生成可交互原型（活 PRD）

按 `references/prototype-spec.md` 生成 `prototype/`：
- 每屏一个路由/视图，跳转关系严格来自 `capture/graph.json` 的边
- 视图元素带 `data-dc` 锚点（与 spec 的 region/component id 对齐）
- 视觉 tokens 全部引用 `knowledge/tokens.css`（禁止把色值散落在组件里）
- 数据用真实感 mock（从截图中抄文案，禁止 lorem ipsum）；隐私字段匿名化
- 外壳四档按 platform.json 选（lib-index.platforms.*.shell）：ios/android→c_mobile 手机壳（390×844），
  ipad→c_tablet 平板壳（834×1194），web.form.desktop→c_browser 浏览器窗壳（tab+地址栏），
  desktop→c_desktop OS 窗壳（mac 红绿灯/win caption，由 platform.os 决定）；桌面类保持原比例
- **必产**：`annotations.json`（产品批注）+ `journeys.json`（≥1 条核心路径，含 blocked 步骤）
- **必产（v3）**：`node scripts/paths-gen.mjs <run目录>` 生 paths.json（场景树/路径画布）；
  按 `references/vlm-analysis.md` 产出 `prototype/products.json`（每页功能/目标/再生成提示词，关键元素 element_prompts）
- 复制 inspector 运行时（模板 `templates/prototype/inspector.*`）
- 动手前选保真模（wireframe/mockup/prototype）+ 列状态清单；handoff 声明刻意排除项
   （见 `references/prototype-spec.md`）
- **地基体检（M14b）**：写视图前 `node scripts/dedup.mjs <capture目录> --sub frames`，
  blank/黑屏/模糊帧不得进 source-map 与裁剪源（细则 `references/capture-quality.md`）
- **生成后必审（M14b）**：`node scripts/shotdiff.mjs <run目录>` 出对照拼图，
  按 `references/critique-loop.md` 六维打分修正，最多 2 轮，结论记 `<run>/qa/critique.log`
- **生成/修改后必评（M15）**：`node scripts/eval/eval.mjs --run <run目录> --base <serve-url>`，
  三维（perf/ux/stab）打分 + issues；按 `references/eval-protocol.md` 有界自修复
  （hard 必修、每 run ≤2 轮、熔断记 LESSONS）；收尾 `--all` 刷新 `docs/EVAL-REPORT.md`
- **完整应用原型（M16）**：手机/桌面 app 克隆默认 `scope:"full"`——先写 `knowledge/ia-plan.json`
  （一级 tab+二级入口清单），sweep 捕获（预算见 `references/completeness-protocol.md`），
  每去重屏一视图；eval 含 views/ia_coverage/live_ratio 门槛。
  读图一律先 `node scripts/img/view.mjs`（多图 --grid），不读原图
- **交付视图必须 live（M18 硬规则）**：视图主体=真 HTML 控件+真元素+data-goto；
  截图仅限 compare 右半/状态帧，进 views 主层即被 inspect `live-views` 硬阻断。
  先抄 `templates/components/`（mobile-im/desktop-app/web-marketing/controls）再填内容
- **每个控件必须可交互（M44 硬规则）**：不止导航——开关/单选/多选/下拉/折叠/分段/弹层/步进/滑杆/输入全接
  `data-act`（运行时 `templates/prototype/runtime.js`，控件目录+snippet `templates/components/controls.md`）。
  微信只是控件子集，别的 app 有下拉/面包屑/单选/多选，一律按目录接线。无目标页的控件用 `toast`/`sheet` 兜底，**杜绝死按钮**。
  门：`node scripts/qa/interact.mjs --run <run> --base <url>` → dead=0 且 act_pass=1 且 goto_pass=1；
  inspect `interactive-controls` + `no-h-overflow`（390 宽装不下要换行/收缩）双硬阻断；eval 计 `interactivity`。
- **preflight 三平台**（每新会话首跑 doctor 后按平台过一遍）：
  - android：`adb devices` 见 device → `android/prepare.sh` → 动作走 `android/gesture.sh`，
    等待走 `android/settle.mjs`（不稳不截），中文输入 Midscene ai-input 无人工兜底
  - web：`web/capture.mjs --scope full --wait 2500`；SPA 无链时 `--seeds` 补入口
  - desktop：`desktop/capture.sh check` 权限 → 点击默认 CGEvent+`clickv` 闭环，miss→fresh shot
    重取坐标→`raise`→告知后移挡窗→人接管 loop 兜底；截窗用 `windowid.sh`+`-l <wid>`，不截全屏

验收：`node {SKILL_DIR}/scripts/serve.mjs <产物目录>` 起本地服务，
打开 `http://localhost:4173/prototype/`，逐项自检（清单在 `references/prototype-spec.md`）：
普通可点（**每个控件点击都有反应，不是静态图**）/ 产品折线批注（**标注模式 A：点元素即新增/编辑批注并写回 annotations.json；视图改版后失效的标注会红字提示**）/
设计 inspect / 编辑拖拽导出 / 路径故事板+播放（**P 键或底栏「播放」：页面模式从当前页起播、场景模式播所选路径；无出向路径自动回退演示旅程，两者皆无会明确告知缺什么**）/
Tweaks 调参（**「存为变体」落 prototype/variants/<名>/{tokens.json,tokens-override.css} 并登记 variants-index.json，?variant=<名> 复现**）/
演示模式（D 键，自动播放+字幕+模拟弹窗+总结卡）/
导出（**默认浏览器直接下载 zip；也可「选目录导出」或「仅存服务端 run/export/<ts>/」；含页面 ±标注 PNG、场景树与 board.json**）/
设备档（下拉=手机/平板/桌面/网页，选择持久化并写进分享链接）；
外壳自检可自动化：`node {SKILL_DIR}/scripts/qa/ui-smoke.mjs --run <run> --base <url>`
（真点播放/导出下载/分享/标注与产品与变体写回/画布标签排版/?chrome=0/筛选/帮助；inspect 硬门跑 --fast，regress 跑全量含下载）。
不达标的屏返工。交付：服务地址 + 目录 + 模式说明 + handoff（保真模/场景/状态/排除项）。
可选：`node {SKILL_DIR}/scripts/export-walkthrough.mjs <产物目录>` 导出演示视频。

**保真与素材（M8/M18）**：交付视图主体必须 live（真控件+真元素），pixel 仅限 compare/状态帧。
- 裁真素材：`node {SKILL_DIR}/scripts/extract-assets.mjs <run目录> <spec.json>`（或 `--from-uitree`，`trim`/`icon` 预设一次裁准）
- 采样精确色：`node {SKILL_DIR}/scripts/tokens-sample.mjs <证据图> --points "x,y,--color-x;..."`
- 生质感图：`node {SKILL_DIR}/scripts/genimg.mjs --prompt "..." --out <run>/prototype/assets/x.png --style pixar-3d`（免费档；风格锚见 presets/genimg-styles.md）
- 保真 QA：`node {SKILL_DIR}/scripts/fidelity.mjs <源图> <原型截屏> --report <run>/report/fidelity.json --name <key>`
外壳双主题：顶栏 ◐ 切换（跟随系统+记忆）；换壳同步存量 run：`node {SKILL_DIR}/scripts/sync-shell.mjs`。

**通用保真管线=唯一生成路径（M40，app 无关）**：逐页保真重生成（s2c-prompt.md），特定问题=循环输出非特判；微信验证后泛化全 app。

**自主逐页达标循环（M39）**：用户一条命令，agent 内部 render→目检→修 循环到全页 fidelity≤0.15 且 truncated=0，不向用户提问，一次交付（s2c-prompt.md）。

**s2c 效果=宿主 agent 当生成器（M38，零 key）**：见 references/s2c-prompt.md——读高清 capture→按 s2c prompt 逐像素誊写单文件 HTML→viewshot 自渲染循环修到像；有 key 可选 s2c-adapter 加速。

**逐页逐控件验收（M36/M37）**：`node {SKILL_DIR}/scripts/qa/audit.mjs --run <run> --base <url>` 对每视图渲染截图+源控件 label 召回+truncated+fidelity+并排图；门=truncated≤0.2 且非空视图；并排图供宿主 VLM 9 维目检，坏一个控件都过不了。

**生成管线（M28 神经符号，首选）**：测量交给工具、模型只做语义，任何模型都稳。
1. 测量适配：mobile `android/capture.sh snap <id> <run>`（settle+shot+uiautomator dump，**特征文本验页防热启动/锁屏**）；web `web/capture.mjs --probe --assets`；desktop `gen/ax2spec.mjs <proc> <cap>`
2. 转 spec：`gen/uitree2spec.mjs` / `gen/webtree2spec.mjs` / `gen/ax2spec.mjs` → region spec（bounds/text/clickable）
3. 标注：`gen/annotate.mjs <spec> --out /tmp/som.png --crops <dir>`（Set-of-Mark 喂语义 pass，配方见 references/semantic-pass.md）
4. 编译：`gen/spec2view.mjs --spec <spec> [--overlay <spec>] [--dim] [--anon <map>] [--goto <map>] --out <view.html>`（bounds→%、像素采色、bbox 真裁、overlay 成层、data-goto、匿名 hook）
5. 验收：viewshot+fidelity（匿名视图 `--waive`）+ inspect parity/asset/icon/live 门

---

## §B Link 模式（从视频/图文链接取材复刻）

0. **代理**：被墙平台先 `eval "$(node {SKILL_DIR}/scripts/link/proxy-env.mjs)"`（系统代理自动感知）
1. **一键意图解析+六级路由梯**（把用户原话整段丢进来，含口语+链接）：
   ```bash
   node {SKILL_DIR}/scripts/link/intent.mjs "<分享文本或URL>" --out <capture> --run \
     [--allow-headed] [--allow-app]
   ```
   梯级：L1 CLI 直下(lux/yt-dlp/you-get/xhs) → L2 headless web-sim → L3 headed+用户登录
   → L4 Web GUI-agent(拖拽滑动/clip 关键区域) → L5 手机深链(横滑/长按保存/区域裁剪) → 无设备回落。
   全程写 `ladder.json`；成功后自动跑 `meta.mjs`（标题/描述/置顶评论/**desc 与评论里的 GitHub·官网 URL**
   → `secondary_sources`，命中就追加为二级源走 §A Web Clone）。
   意图=style_only（纯审美素材非产品 UI）→ 走 `references/style-extraction.md` 提风格不生界面。
   单步手工调用仍可用：`fetch.mjs` / `xhs.mjs` / `web-sim.mjs`（--swipe 拖拽/--clip 关键区域截图）。
   本地文件：跳过取材，直接进第 3 步。
3. **抽帧**：`bash {SKILL_DIR}/scripts/link/keyframes.sh <视频> <产物目录>/capture/frames`
   （场景检测 + 1fps 采样，自动去重）
4. **可选转录**（视频有口播/讲解时）：见 `references/link-mode.md` 的 whisper 步骤
5. **分析**：你逐帧查看（多帧批量），按 `references/vlm-analysis.md` 协议输出 pages/edges/assets JSON
   （弹窗/状态=独立页节点、边带 action_label、每页三要素+regen_prompt），标注每屏证据帧与时间戳；
   一闪而过的屏标记 `fidelity: live-low`
6. 之后走 §A 的 A3、A4（tokens 从关键帧提取；图数据用帧序列构建），
   `DESIGN.md` 中注明"本复刻基于视频证据，未覆盖的页面为合理推断"

---

## §C Remix 模式（在复刻原型上按想法改造）

前置：已有复刻产物（`knowledge/` + `prototype/`）。若用户指向的是别的目录/链接，先确认位置。

1. **意图分类**（读 `references/remix-protocol.md`）：把用户需求拆成最小编辑，落到对应层：
   - token 级（换色/换字体/圆角/间距）→ 只改 `knowledge/tokens.css`
   - 全局风格级（"改成暗黑风/像某某品牌"）→ 换风格预设（`presets/`，含本机
     awesome-design-md 的 74 个品牌 DESIGN.md 可引用）或从用户给的参考图/链接提取 tokens 覆盖
   - 组件级（换/加/删元素）→ 改对应 `pages/*.spec.yaml` 的 regions/components
   - 布局级（改版式）→ 改 spec 的 regions/layout
   - 动效级（转场/微交互）→ 改 `prototype/motion.js`（GSAP，语法见 `references/remix-protocol.md`）
2. **执行**：先改规格文件再重新生成受影响页面，**禁止整站重新生成**；每次修改在
   `spec.yaml` 的 `meta.change_log` 追加一条记录
3. **验证**（三重+评审，见 `references/remix-protocol.md`）：
   ① 符合用户意图 ② 未破坏原有布局结构（与改造前截图对照）③ anti-slop
   ④ 五维度评审（哲学/层级/细节/功能/创新 → Keep/Fix/Quick Wins）
   不达标自动返工一轮；仍不行则向用户说明并给选项
4. **模糊风格需求**：三套逻辑各出一版真实视觉并排选，不文字盲选
5. **指牌换风格且预设库没有**：走 `references/brand-protocol.md` 五步硬流程，绝不从记忆猜品牌色
4. 所有改动沉淀回 `knowledge/DESIGN.md`（设计系统随迭代演进）

---

## §D Export 模式（导出 Figma，可选）

仅在用户明确要求且环境具备时执行：
1. `node {SKILL_DIR}/scripts/figma/export.mjs <run目录>` 生成 report/figma-plan.json
   （计算样式→Figma 0-1 浮点，MCP 无关中间层）
2. 优先检测 Figma 官方远程 MCP（`https://mcp.figma.com/mcp`，免费账号可用）；
   其次 talk-to-figma-mcp（需 bun + WebSocket + Figma 插件，见 `references/figma-export.md`）
3. 按 plan 逐页创建 Frame，完成后 `export.mjs --apply-nodeids map.json` 回填
   （后续增量修改靠 nodeId 定向 patch，禁止整页重建）
3. 没有任何 Figma 接入时：明确告知用户原型 HTML 本身即可作为开发依据，不强推

**演示视频**（不依赖 Figma）：`node {SKILL_DIR}/scripts/export-walkthrough.mjs <产物目录> [--journey <i>] [--gif]`
驱动演示模式录屏 → webm/mp4/gif，PRD 可直接内嵌。

---

## §E QA 模式（全链路验收，触发即按协议执行）

用户说"全链路验收/QA/产品验收/设计走查/全量测试/回归"时，**完整执行** `references/qa-protocol.md` 四阶段：
基线矩阵（docs/QA.md）→ PM 验收（H/B 组，inspect.mjs 取证）→ 设计师走查（F 组）→ 测试（A/C/E/G 组）→ 修复闭环（回归+归档）。
设备路由：Android 真机>模拟器>env-blocked；iOS 模拟器>env-blocked；win 静态审查。

```bash
node {SKILL_DIR}/scripts/qa/interact.mjs --run <run目录> --base <base-url>   # M44 交互门：逐控件点击验响应，dead=0
node {SKILL_DIR}/scripts/qa/privacy.mjs --run <run目录> [--discover]        # M44c 隐私门：真名/PII/真人脸未虚构=fail；--discover 起草 privacy.json
node {SKILL_DIR}/scripts/qa/viewsheet.mjs --run <run目录> --base <url> --out /tmp/sheet.jpg  # M44d 全视图拼图（critique 用）
node {SKILL_DIR}/scripts/qa/critique.mjs --run <run目录> [--skeleton|--set <v> --layout N]  # M44d 结构 critique 硬门（full 必 VLM 打分）
node {SKILL_DIR}/scripts/img/gen-loop.mjs --out <asset> --run <run目录> --kind avatar --subject "..."  # M44e 场景风格+循环自检生图
node {SKILL_DIR}/scripts/gen/style-pick.mjs --run <run目录> --kind avatar    # M44e 场景→风格决策；gen/fakename.mjs 场景化假名
node {SKILL_DIR}/scripts/gen/wire.mjs <run目录> [--dry]                    # M44 通用死控件接线（toast/toggle/tab 兜底，幂等）
node {SKILL_DIR}/scripts/qa/audit.mjs --run <run目录> --base <base-url>      # 逐页召回+截断+溢出+并排图
node {SKILL_DIR}/scripts/qa/fidelity-all.mjs --run <run目录> --base <base-url> # M44 逐视图保真复测（source-map 配对+chrome=0 截屏）
node {SKILL_DIR}/scripts/qa/inspect.mjs <base-url> <name> --shots <取证目录> --run <run目录>
node {SKILL_DIR}/scripts/qa/ui-smoke.mjs --run <run目录> --base <base-url> [--fast]  # M44k 外壳冒烟门：真点播放/导出下载/分享/设备/标注·产品·变体写回/画布排版/?chrome=0
node {SKILL_DIR}/scripts/gen/utility-css.mjs --run <run目录> [--strict]             # M45 utility 子集本地编译（无 CDN）；unknown=疑似笔误
node {SKILL_DIR}/scripts/build-shell.mjs [--out <file>]                            # M45 inspector 17 段拼接（单 IIFE，产物对拍可验）
node {SKILL_DIR}/scripts/qa/ip-scan.mjs && node {SKILL_DIR}/scripts/qa/secret-scan.mjs  # M45 开源自证门（CI 必跑）
node {SKILL_DIR}/scripts/eval/eval.mjs --run <run目录> --base <base-url>   # M15：每次回归同步自评（含 interactivity）
```

## 红线（任何模式下必须遵守）

完整规则见 `references/safety-rules.md`，摘要：
- **支付/转账/下单确认页**：只截图记录，绝不点击确认
- **密码/验证码/人脸**：暂停，交给用户手动完成
- **登录**：提示用户自己登录（浏览器模式可见窗口 / 设备模式等待用户操作），不代输凭证
- **权限**：只自动授予无风险权限（通知/位置等可配置），敏感权限（通讯录/相册/短信）先问用户
- **合规**：产物仅限个人学习与内部参考；提醒用户不得将复刻产物冒充原创发布或商用
- **预算**：全量遍历必须有步数预算，达到预算先汇报，由用户决定是否继续

## 安装三法（M20）
1. `npx skills add <repo>`（推荐）；2. `git clone` 后软链到 agent skills 目录；3. 无 CLI 平台：CI 产物 `dist/design-clone.zip` 解压即用。
