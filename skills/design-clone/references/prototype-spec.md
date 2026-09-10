# 原型规范（prototype-spec）

复刻产物 = **可用于生产的"活 PRD"**：纯静态可交互原型 + 五模式 inspector
（普通/产品批注/设计 inspect/编辑/路径故事板与播放）。规格驱动：先生成
`pages/*.spec.yaml`，再按规格生成 `views/*.html`。Remix 的增量修改也落在这一层。

## 超出一屏的内容（强制）

真实页面经常比视口长/宽。规则：
- 视图按**自然内容高度**写，不硬塞进 844/800；壳的 `#dc-screen` 双向滚动承载溢出
- 横向轮播/画廊用 `overflow-x:auto` 容器+滑动惯性，禁止把宽内容压窄
- 捕获侧证据用 `<id>-full.png`（fullPage）+ 全量控件树，视口图只作首屏对照
- 演示/批注/inspect 对屏外目标自动 `scrollIntoView` 定位（inspector 已内置）

## 锚点（强制）

视图里每个 region 根元素与可交互组件必须带 `data-dc="<region>/<组件名>"`，
与 spec.yaml 的 id 对齐——批注、测量、编辑、路径高亮全靠它。

## 批注与路径（强制产出）

- `annotations.json`：每个唯一屏 ≥2 条批注（控件功能 + 事件→响应）
- `journeys.json`：≥1 条核心路径；捕获主路径必含；安全拦截步骤 kind=blocked
- 生成后跑 inspector 五模式自检（见下）

## Inspector 五模式验收

1 普通：纯净可点，data-goto 跳转与占位提示正常
2 产品：pin+折线+事件表；hover 元素出 tooltip
3 设计：点选元素出面板（hex/字体/尺寸/圆角/位置）；Alt+悬停出测量线
4 编辑：拖拽元素→导出 layout-patch.json
5 路径：故事板（真机截图+高亮框+结果标签）+ 播放（脉冲高亮+步骤卡+上/下/自动）
画布：Ctrl+滚轮 25–400%、抓手平移、适应/1:1
6 调参：Tweaks 面板 live 改 tokens（localStorage 持久化/变体/导出 patch）
演示模式：右下「▶ 演示」或 D 键，自动播放所选路径（字幕/模拟弹窗/总结卡）

## 保真度三模（借鉴 effective-html，先选模再动手）

| 模 | 回答什么问题 | 何时用 |
|---|---|---|
| wireframe | 信息层级/导航/任务流/响应结构 | 布局级 Remix 或 IA 存疑时；"故意的未完成"：灰阶/系统字体/无品牌色，2-3 个**结构性**方向同文件+键盘选择器（换色不算方向） |
| mockup | 视觉层级/排版/色彩/产品契合 | 视觉问题待评审；静态但不加假行为 |
| prototype | 导航/输入/状态变化/反馈/转场 | 默认模（我们的主产物） |

不为让 mockup 显得完整而加行为；用户同时要两模时保持同构以便比较。

## Inspector v3 IA（M11，外壳信息架构权威）

- 左 rail 两菜单：**页面**（索引-标题平铺，点击单页展示）| **场景**（导航目录树，多根可展开）
- 场景画布顶部开关 **树|路径**：树=以选中节点画流程树；路径=逐行列出全部路径
- 流程卡=页面缩略（iframe embed），顶部「索引·标题」；数据线=发丝线+**实心圆数字**+关系标签（graph edges.action_label）
- 选中节点触发**一次性灯带流动**（stroke-dashoffset 单程，不循环，克制）
- **弹窗/toast/页内状态大变 = 独立页节点**（kind=dialog|state），不做隐藏状态
- 右看板三 tab：产品（功能/目标/再生成提示词，数据=products.json，克隆时按 vlm-analysis.md 产出）|
  设计（Figma 分段 Position/Appearance/Typography；编辑模式可改色/边框/圆角）| 调参（tweaks）
- 底栏 pill：阅读|编辑 + 标注开关（黑白细线折线批注）；场景下 +▶播放（视频式演播）+⏺导出视频；↩撤销(Ctrl+Z) + ⟲一键还原
- **编辑持久化**：修改防抖落盘 edit-overrides.json（serve.mjs `/__dc_write__` 白名单），重启生效；无 serve 降级 localStorage
- 导出（右上▾）：默认全部页面±标注+全场景树 / 选中页面±标注 / 树·选中节点 / 路径·选中路径 / 看板 JSON；
  服务端 headless 元素级截屏（`?chrome=0`，**只出原型本体不含外壳**，DPR2）→ `<run>/export/<ts>/`

## 素材保真三档（M8，与上表正交：上表答"建什么"，本表答"像多少"）

| 档 | 实现 | 何时用 | fidelity 字段 |
|---|---|---|---|
| live-high | 重绘但素材真实：extract-assets 裁真图标/头像、tokens-sample 采样精确色、平台字体栈（PingFang/Roboto/MiSans）、质感位图走 genimg；**真控件真元素可交互** | **交付默认档**，可 Remix 可交付 | `live-high` |
| live-low | 推断占位（SVG 灰块/简笔），一闪而过的屏 | 边缘屏省 token，仍须真元素 | `live-low` |
| pixel | 原截图做底图 + 热点矩形 | **M18 起仅限**：① compare 面板右半的 1:1 参照；② loading/骨架状态帧；**禁止作为交付视图主体** | `pixel` |

**M18 硬规则**：交付原型（scope=full）每个视图主体必须是 live HTML（真控件+真元素+data-goto 交互）；
截图只进 compare/状态帧，不进 views 主层。inspect `live-views` 硬检查（单 img 占 stage>80% 即 fail），
eval `live_ratio` 必须=1。"截图+热点"是截图集不是原型——历史教训见 LESSONS 94。
组件库捷径：`templates/components/`（mobile-im / desktop-app / web-marketing 三套 snippet+css），
live 是便宜路径，先抄组件再填内容，不许拿 pixel 偷懒。
DC.pages[].fidelity 标注，Pages 面板出徽标（绿=pixel/蓝=live-high/灰=live-low）。
验收：fidelity.mjs 对比原型截屏与源图，差异率写 report/fidelity.json。
**源帧配对（M44 修缺陷）**：view id 与 capture 文件名不一致时（常见于多页/改名/`-full` 全页帧）必须写 `knowledge/source-map.json`（`{view: "capture/screens/x.png"}`），
否则 fidelity 会错配出假高/假低分；批量复测用 `qa/fidelity-all.mjs`（source-map 配对 + `?chrome=0` 截屏，防长页滚动拼接渗入固定外壳）。

### 素材来源优先级与生图
图标/矢量：裁剪证据 > iconify（免 key CDN）/Simple Icons（品牌 CC0）> VLM 重画 SVG。
质感位图（吉祥物/插画）：`genimg.mjs --style pixar-3d|clay-icon|sticker|flat`（免费匿名档，15s 节流+sha1 缓存）；写词两段式：VLM 看帧出主体/色板 hex → 拼风格锚（presets/genimg-styles.md）；`--seeds` 多张选优≤2 轮。
全挂时回落：VLM SVG clay 配方 → CSS clay → emoji。

## 状态模型（先列后建）

动手前列出场景可达状态：loading / empty / error / success / disabled / 移动端 / 领域态。
- 异步动作要见 loading+success+失败恢复；集合要有 empty；被门禁的动作要说明为何 disabled
- 不相关的态不硬塞进主流程；**省略的态在交付 handoff 里显式声明**

## 交互完整性契约（a11y + M44 全控件可交互）

- **每个可见控件点击必须有可观测反应**——不是只有导航。控件目录与 `data-act` 见
  `templates/components/controls.md`，运行时 `templates/prototype/runtime.js`（事件委托，自动补 role/tabindex/aria）：
  导航 `data-goto`；开关 `toggle`、单选 `radio`、多选 `checkbox`、下拉 `select`、折叠 `accordion`、
  分段 `tab`、弹层 `sheet`/`dialog`、提示 `toast`、步进 `step`、滑杆 `slider`、输入 `input`、返回 `back`、占位 `noop`。
  **微信只是控件子集**：别的 app 有下拉/面包屑/单选/多选/stepper，一律按目录接线，不假设只有开关。
- **门（强制）**：`node scripts/qa/interact.mjs --run <run> --base <url>` 逐视图真实点击每个控件并断言状态变化；
  `dead=0`（无死控件）且 `act_pass=1`（点了都有反应）且 `goto_pass=1`（跳转目标存在）。inspect `interactive-controls` 硬阻断、eval 计 `interactivity`。
- 语义化原生元素；建模流程全程键盘可用（Enter/Space 触发、Tab 可达）；focus 可见且转场后有意安置
- dialog/sheet：可访问名、焦点圈闭、Esc 关闭、点遮罩关闭、焦点归还触发器
- 表单错误关联控件；重要状态变更要播报；本质行为不藏在 hover 后
- 尊重 `prefers-reduced-motion` 但保留状态反馈；触摸目标可用；**无横向溢出**（inspect `no-h-overflow` 硬阻断，390 宽装不下要换行/收缩）
- **死按钮不允许**：属于真实系统的动作要么实现（data-act），要么 `noop`/`toast` 解释边界（占位提示），不假装完成、也不留无响应

## 构建契约

单文件可自包含或 views 分片（serve 打开）；不依赖构建/鉴权/活 API；
tokens 小而具体；对比度达标且状态不只靠颜色表达；一条流做深做对，胜过铺满假产品。

## 验证与 handoff

- 宽桌面+窄移动两宽度过一遍；每个建模状态与控件实操；键盘 Tab/Enter/Space/Esc 走一遍
- 计算每个独立表面的前景/背景色对比（尤其深色区里继承正文色的文字）
- 浏览器工具不可用时，明示哪些视觉/交互检查未做，不用源码检查冒充
- handoff 必含：保真度模 / 建模场景 / 已实现状态 / **刻意排除的真实行为**

## 技术栈

- HTML + **Tailwind v4**（迭代期用浏览器 CDN：`<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>`）
- tokens 全部放 `tokens.css` 的 `:root` CSS 变量，视图里只引用变量名，**禁止硬编码色值/字号**
- 自定义 CSS（非 Tailwind 工具类）必须放普通 `<style>` 标签，不要写进 `type="text/tailwindcss"`
- 动效：GSAP（CDN 引入）+ 原生 CSS transition；不引入 React/构建工具
- 图标：优先内联 SVG（从截图临摹简化）；占位图用纯色块+文字说明，禁止外链图床

## spec.yaml 写法

每个页面一份 `pages/<screen-id>.spec.yaml`，须通过 `schema/page.spec.schema.json` 校验。
核心原则：

1. **布局意图而非像素**：regions 描述结构（竖排/横排/层叠），间距用枚举值（4/8/12/16/24/32/48）
2. **稳定 id**：`page_id`、`regions[].id` 一经生成不再变更（Remix 定向修改靠它）
3. **token 外置**：颜色/字体名不出现在 yaml 里，只出现在 tokens.css；局部微调写 `tokens_override` 并注明理由
4. **跳转显式声明**：所有页间跳转写进 `flows[]`，必须与 `capture/graph.json` 的边一致
5. **证据可溯**：`meta.evidence` 指向来源截图；Link 模式附帧与时间戳

示例（手机应用聊天列表页）：

```yaml
meta:
  page_id: "02-chat-list"
  page_name: "消息列表"
  surface: c_mobile
  page_type: c_list
  canvas: { width: 390, height: 844 }
  evidence: "capture/screens/02-chat-list.png"
  change_log:
    - { at: "2026-09-01T10:20:00+08:00", by: "clone", note: "初始克隆" }
shell:
  type: c_mobile_shell
  title: "微信"
  show_back: false
regions:
  - id: search_bar
    type: search_bar
    layout: { direction: row, gap: 8, padding: 12 }
    components:
      - { kind: input, label: "搜索", sample_value: "搜索", variant: secondary }
  - id: chat_list
    type: list
    layout: { direction: column, gap: 0, padding: 0 }
    constraints: { max_items: 8 }
    components:
      - { kind: list_item, label: "会话条目", data_key: conversation,
          sample_value: { title: "文件传输助手", subtitle: "10:24", badge: "" } }
states:
  - { id: empty, label: "无会话", description: "显示空态插画与发起聊天入口" }
flows:
  - { trigger: "点击会话条目", from_region: chat_list, to_page_id: "03-chat-detail", transition: push }
  - { trigger: "点击右上角+'号'", from_region: nav_bar, to_page_id: "04-add-menu", transition: popover }
```

## 原型组装规则

`prototype/index.html` 职责：
1. 手机壳（`c_mobile`：390×844 圆角机身+状态栏）或桌面窗口壳（保持原宽高比）
2. 视图切换：每个 `views/<screen-id>.html` 是一个 `<template>` 或独立 fragment，
   用 hash 路由（`#02-chat-list`）切换；`flows[]` 里的跳转绑定到对应元素
3. 转场动效默认 `push`（移动端左右滑入）/ `fade`（桌面），可在 `motion.js` 覆盖
4. 底部加开发者工具条（可折叠）：页面列表跳转、显示当前 page_id、"对照原图"开关
   （并排显示 `capture/screens/<id>.png`，方便验收）

数据：从截图抄真实文案做 mock（`sample_value`），列表类至少 5-8 条真实感数据；
禁止 lorem ipsum、禁止 "测试1/测试2"。

## 验收标准（每屏）

1. 布局结构一致：区域数量、顺序、层级与原截图一致
2. 视觉 tokens 一致：主色/背景/字阶取自 tokens.css，与原图对照无明显色差
3. 文案真实：与原图一致或同级真实感
4. 交互连通：`flows[]` 声明的每条跳转都能点通，返回可用，**且每个控件点击都有可观测反应**（`qa/interact.mjs` dead=0、act_pass=1）
5. 工具条"对照原图"模式下，肉眼相似度可接受

不达标 → 只返工该屏（改 spec → 重新生成该 view），不整站重来。

## 交付

```
✅ 原型已就绪
打开方式: node {SKILL_DIR}/scripts/serve.mjs <产物目录>/prototype  → http://localhost:4173
页面: 12 屏 | 路径: 18 条 | 设计文档: knowledge/DESIGN.md
建议下一步: 可执行 Remix（如"主色换成墨绿"）或 Export（Figma）
```

## 状态层（M17 §states）

每个核心视图应声明覆盖的状态（loading/empty/error/满态，OD 五态纪律）：
- pixel 档：loading 帧独立成 `<id>--loading` 视图（真实捕获的骨架/转圈帧）；
- live-high 档：视图内以 `[data-state=loading]` skeleton 块表达，inspect 不阻断、详情看板列出；
- journeys 可加一条"加载→完成"路径（loading 视图 data-goto 到稳定视图）。
缺失状态在 handoff"刻意排除项"里声明，不许静默只画满态。

## 资产质量门与原版一致（M19，硬规则）

目标：live-high = 真控件 + **与原版视觉近 1:1**。资产只许"有效图"：不模糊/无空白/不截断/无无关因素。
阶梯（依次尝试，禁止跳级直接占位）：
1. **源原图**：web 用 `capture.mjs --assets <n>`（naturalWidth≥300 下载到 capture/assets/+manifest）；app 用 extract-assets 从 capture 真裁（头像/图标/插画/产品图）
2. **截图候选必过 `img/asset-qa.mjs`**：blur/blank 阈值复用 extract-assets；**截断=贴边启发 edgeRatio>2.2 判 fail 阻断（M44：裁错的头像/图标是真缺陷）**；**拼贴/多主体（裁到照片墙/宫格）collage 判 fail 阻断（M44c）**；确属全出血照片/网格设计用 `--waive` 豁免；fail 走处理梯（重拍 settle/加边重裁/换原图/sharp 增强/genimg）；contact sheet 交宿主 VLM 复核
2b. **隐私门 `qa/privacy.mjs`（M44c，硬）**：每 run `knowledge/privacy.json`（anon_map/face_assets/keep_assets/keep_brands，`--discover` 起草）。姓名→可爱假名、称呼保留；账号/ID/密码/手机号/SSID 不真实展示；**个人真人脸/真人照片 genimg 虚构替换**（同名覆盖），官方/商家素材保留；素材溯源 `prototype/assets-manifest.json`（extract-assets/genimg 自动写），face_assets 非 genimg 即 fail。
3. **genimg 风格锚**（pixar-3d/clay-icon/sticker/flat）对齐原版质感
4. 占位仅限 loading 状态（inspect `placeholder-scan` 硬检查）
布局几何门（M44f，inspect `layout-sanity` 硬）：元素级裁切（非 ellipsis 元素 scroll 溢出>8px）/空槽（>120×120 无子无背景图纯色块）/坏图（naturalWidth=0）/视图内重复窗口 chrome 均 fail；豁免透明 tap-catcher、模态 scrim、装饰 orb；full 硬、demo warn。no-emoji 对 full 升硬（标签内 emoji 也算，内容型 emoji 用 data-emoji-ok 豁免）。shell 尺寸由 inspector inline 兜底（四档），视图禁自带标题栏/窗口框。
保真验收：每核心视图 `fidelity.mjs`/`fidelity-all.mjs` 原型截屏 vs 源 ratio 达标（阈值见 eval-protocol）+ **结构 critique 硬门（M44d）**：
`qa/viewsheet.mjs` 出全视图拼图 → 宿主 VLM 对照 capture 逐视图打 layout(1-5) 写 `qa/critique.json`（`critique.mjs --skeleton/--set`）→
`qa/critique.mjs` 门禁：full run 必须存在，且"客观可疑视图（ratio>0.2 / recall<0.9）+ 前 3 视图"layout≥3（<3 须 fixed 并重修）。
**pixelmatch 对浅色稀疏 UI 的缺栏/错页失明**（M44d 教训），桌面 capture 含 OS chrome 时 stage-only ratio 虚高（desktop run 该 ratio 仅参考、以 critique 为准）；report 附 `struct` 墨度网格分作辅助信号。
视觉资产政策：所有者 run 默认**真视觉+文本匿名**（头像/配图用真图，昵称/ID/聊天文字虚构或打码）；他人使用先询问（safety-rules §10）。
桌面截图源必须 `-l <wid>` 窗裁（除无关窗）；手机源必须 settle 稳帧（除转圈/通知遮挡）。

## 图标与布局对位（M19b，硬规则）

- 图标/品牌资产：**必须真裁剪**（extract-assets 从 capture 裁 rail/应用图标，2x 显示尺寸即可，asset-qa 的 too-small 仅 flag 不阻断图标）或品牌复刻重画；通用线稿 SVG 仅限 live-low/demo。
- 页面块结构逐一对位源：源有 tabs 就画 tabs、有 mini 月历+周时间格+红色 now 线就全画、有选中白 pill 就画 pill。
  不许"卡片宫格代替日历周视图"式简化（M19b 用户打回案例）。
- critique-loop 第 7 维「图标与布局对位」：<2 必修。

## M28 生成管线（extract→compile→润色→gates）
1. extract：测量适配(ui-tree/DOM/AX)+annotate(SoM)+meta；2. compile：spec2view 按真值编译；3. 润色：VLM 语义 pass(semantic-pass.md)只裁决歧义/匿名/动效；4. gates：per-view fidelity+parity+9维 critique+资产/隐私门。手写 HTML 仅作兜底。

## 防再犯三规则（M30）
- R1 替换保护：覆盖已 PASS 视图前必须先渲染新稿+audit/truncated/目检过门，并保留旧稿 fallback。
- R2 验收代理修正：fidelity 像素比仅辅助；交付门=视觉 QA+truncated+逐控件召回。
- R3 编译定位：平铺绝对定位=坏模式禁用；组件/层级模式=好模式。

## 风格丰富度门（M44g）
fidelity-all 对每视图计算 style-parity：capture vs 原型的 Hasler-Susstrunk colorfulness 与饱和像素占比差值；Δcolorfulness>30 → eval warn「原型偏素/风格不一致」，须补品牌资产（autocrop-icons 真裁图标/tile）或彩色层次。
生图安全（不可豁免）：genimg 全局 SAFETY 后缀（family-safe/fully-clothed/no suggestive pose）；cover/scene 默认 no people；palette 从 run tokens 注入以保风格一致。

## 路径=真实交互逻辑（M44j）
边四分类：module（持久 chrome/hub≥60%，切模块不进路径）/ drill（back-pair 父子）/ task（内容 CTA）/ modal（sheet/dialog）/ back（仅校验）。
场景树与路径仅沿 drill/task/modal 枚举；roots=模块入口；nav 平铺于节点下；画布 nav 淡虚线。
数据优先级：flows.json（capture/events.jsonl 录制=ground-truth > agent 目视推断）> 结构推导 > 朴素 DFS（标 source:derived）。
门禁 qa/paths-qa：禁 hub-chain/giant-chain；模块根须有 ≥1 content 流或显式 nav；drill 应有 back-pair（warn）。

## M52 大图区结构规则
- 禁整屏 capture 裁切作背景；地图/画布类大区=内联 SVG 矢量底（水域/陆地/路网/标签分层）+ 独立 POI/气泡/控件层。
- 艺术 SVG 加局部 stroke 豁免（壳全局 svg{stroke:currentColor} 会描黑艺术图形）。
- 照片裁切仅小缩略图（文件夹/头像/气泡），单张 <=90px 级来源区域。
