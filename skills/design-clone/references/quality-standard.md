# quality-standard.md —— design-clone 原型质量标准体系（M104-W1 立）

> 地位：与 VISION/DECISIONS 同级的**验收宪法**。所有生成器、壳、门、人工深化都以此为判据；
> 任何"面向特定 run/特定截图作弊"的修法是违宪的——修因（生成器/门）不修果（单 run 手改），手改只做存量 Remediation 且必须记账。

## 0. 反作弊四机制（元约束）
1. **修因不修果**：每个缺陷先回答"哪个生成器/门放行了它"。生成器修+门加为主；已发布 run 的手改=存量 Remediation，CHANGELOG 标注性质。
2. **门只测通用不变量**：空带≤12% 屏高、SVG 文字 stroke=0、声明边⊆真接线、资产 prompt 含本 run 锚词、每页≥1 idle 动效……禁止"某 app 某页要怎样"的字面断言进代码。
3. **skill 零 run 特判**：生成器/壳/门内不得出现 run slug 条件分支；CI `qa/no-run-specialcase.mjs` 扫描，白名单需行尾 `// specialcase-allow: 理由`。
4. **活门证明**：门必须红过才算存在——W7b 变异测试（注入故障断言门红）+ 未见过的输入端到端演练（模糊概念/链接）。

## 1. 输入类型矩阵（六类输入 → 管线差异）
| 输入 | 捕获手段 | 保真目标 | 流真值来源 | 资产策略 |
|---|---|---|---|---|
| GUI-android | adb/uiautomator+录屏抽帧 | 控件级 1:1 | capture/graph.json ∪ data-goto | 截图切片优先，缺景生图补 |
| GUI-ios | WDA/录屏（无 Xcode 时录屏链） | 控件级 1:1 | 同上 | 同上 |
| GUI-desktop | 窗口录屏+键鼠日志 | 布局级 1:1 | 同上 | 同上 |
| web 链接 | playwright 抓取+DOM 快照 | 像素级 1:1 | DOM 真接线 | 原站资产登记制（ip-scan） |
| 视频/图文链接 | 抽帧+VLM 语义拆解 | 场景级神似 | VLM 推断路径→**必须回灌 data-goto 校验** | 生图/生视频按锚 |
| 模糊概念 | director brief 九 aspect | 产品级自洽 | brief 导航意图→brief-views 接线→paths-gen 读 DOM | 全生图按锚 |

共同底线：无论哪类，**paths.json 一律 paths-gen.mjs 读交付视图 data-goto（∪capture graph）产出**；brief.flows 只做标签注记。

## 2. 六法
### 2.1 风格锚唯一法
- 每 run 单锚（brief.style_anchor）；icon/cover/bg/角色/视频提示词**必须内嵌锚词**（director 拼 styleWords）。
- manifest 记 engine+style+prompt；`qa/style-anchor.mjs` 核资产 prompt 携带锚指纹（锚名+锚词特征词），不符=fail。
- 人工深化换风格=换锚重出资产，不允许双锚并存（petpark 三锚并存教训）。

### 2.2 角色表现单一法
- 每页每角色**一种**表现：胸像卡 | 全身立绘层 | 视频 hero。混挂=违宪（01-home 四张人物图教训）。
- manifest 登记 representation（bust/layer/video）；视图引用与登记一致由 critique 人工清单+门抽查。
- 同角色资产同源同画风；旧引擎（pollinations）资产在新 means 可用时**禁止上线**（水印法联动）。

### 2.3 布局法
- 空带（无内容且视觉平 stddev<15）≤12% 屏高（`inspect empty-band`）。
- 背景层必须 cover 满铺；**@keyframes 禁改 background-size**（`inspect bg-cover`），呼吸只准 transform/opacity，且 transform 动画不得与 parallax 同元素（.far 拆 ::before 模板制）。
- 高度链：`min-height:100%` 在 auto 高父级上解析失败=禁单；壳高链用 `height:100%`+flex 列（LESSONS#34）。
- 选择器必须真匹配：根类名与 CSS 前缀一致（`inspect unstyled-view-classes` 祖先校验）。

### 2.4 动效法
- 每页 ≥1 idle 动效：video 播放中 | CSS animation | canvas fx（`inspect motion-min`）。
- 全部动效带 prefers-reduced-motion 兜底（静帧/poster）。
- 视频环境层：muted+loop+playsinline+runtime 自播；loop_diff 公示，>阈值标"非完美循环"不隐瞒。

### 2.5 流真值法
- 声明边⊆真接线（data-goto∪capture）；凭空边=concept fail（`qa/flow-truth.mjs`）。
- 不可达页=concept fail；死端页=warn（终点页合法）。
- tab/底栏边 role=module（虚线降权）；CTA role=task；返回 role=back。
- 树/路径标签：SVG text 必须 stroke:none（`ui-smoke wire-label-lite` 扩 stroke 断言）；全局 `svg{}` 继承污染=壳级红线。

### 2.6 透明融合法（M108 立）
- 站点/原型内**所有大静态贴图必须透明 PNG**（角色/母题/门等），与背景融入；矩形 wash 仅允许径向羽化的场景晕（secbg 类），不允许硬边矩形贴图。
- 透明角色必须带接地软阴影（椭圆晕）防贴纸漂浮；暗色主题加极淡 rim glow 保可读。
- 无意义母题不留：每个母题必须有叙事职责（边饰/供花/入口/陪伴），否则删除。
- 门：e2e alpha 审计（角像素 alpha<40 且存在半透明像素）。

### 2.7 帧库存前置法（M111 立）
- 链接/桌面源誊写前必须先过全部证据帧/屏，产 `knowledge/screen-inventory.md`（屏/角色/控件三清单）；screen-coverage 门：清单每屏必须有视图，杜绝静默漏屏。
- **提取优先铁律**：角色/图标/机模等视觉资产一律先从 capture 帧裁切（本地 sharp，零付费）；生成仅兜底且须在 meta 登记"为何无法提取"。CSS 近似角色=背叛保真。
- 誊写循环=写一屏→viewshot 并排→VLM 打分→改至 ≥8→下一屏；critique 是事中工具不是事后门禁。
- 砍 scope 必须显式向用户报屏数×工作量并获同意，不静默降质。

### 2.8 封面法+水印法
- cover prompt 强制取 brief.cover.prompt（含锚词）；cover.mjs 读 style_anchor，锚不符=重出（W6 实现）。
- hero 设备框内**必须真截图**（--base 现拍或 capture/screens），art 只做底；publish 前置校验。
- 品牌克隆封面=真截图+品牌色极简构图，不生品牌 art（品牌安全）。
- 官方/付费 means 可用时 pollinations 禁用；manifest engine 审计+brand-qa 水印门双锁。

## 3. 点缀元素法（官网/宣传面装饰）
- 单线稿不上色：透明底线稿，CSS 按主题染色；不透明度 6–14%+羽化蒙版。
- 只住负空间（天际/段缝/地平线/角隅）；文字块正后方禁放；不进卡片/框内。
- 叙事复用同角色（recurring character=故事线）；reveal 用 mask 扫显+极慢呼吸；reduced-motion 静帧。
- 视差系数小于云层（更"远"）；z 序在天空层上、内容下。
- 登记入资产清单+PROVENANCE；水印门覆盖。

## 3.5 门分级（输入类型矩阵落地）
| tier | 适用 | 美效门(empty-band/bg-cover/motion-min) | 结构门(layout/flow-truth/unstyled/style-anchor/stroke) |
|---|---|---|---|
| strict | concept/original（含演练 run） | 强制 | 强制 |
| fidelity | clone（GUI/web 捕获） | advisory（源即静态时加动效=背叛保真） | 强制 |
| advisory | 存量实验 run（无 meta 或声明） | advisory | advisory |
tier 由 meta.json `gate_tier` 数据声明（无 meta=advisory），代码无 run 特判。

## 4. 测试验收 vs 产品验收
- **测试验收**（机器）：regress 全门矩阵（interact/inspect[含 empty-band/bg-cover/motion-min/unstyled 祖先校验]/ui-smoke[含 stroke 锁]/flow-truth/style-anchor）+ e2e + brand-qa + media-verify + no-run-specialcase + 变异测试矩阵。
- **产品验收**（人）：`docs/QA/acceptance.md` 式清单（M114 起活文档）——每条用户诉求转**通用判据**+before/after 截图证据；判据不得含 app/页面字面。
- 发布前置：三门绿+publish 真截图校验+manifest 完整（缺登记=拒发）。
