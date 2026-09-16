# Media Strategy —— 生图/生视频调用与优化策略（M102 总纲）

> 目标：**按需**调用生成能力优化原型，核心是原型符合用户诉求；生成是手段不是目的。
> 教义：skill=指挥者（机会识别/规划/验收/登记），agent=履约者（官方 skill/自配工具）；**标准 Ark key 直连档**为唯一 skill 直调的付费通道（仅视频、consent 门控、成本预估先行）；VLM 语义策略 skill 自控。

## 1. 生图调用策略

### 1.1 机会识别（何时调）
| 资产槽位 | 触发条件 | 首选 means |
|---|---|---|
| 虚拟人/角色 | brief 承诺角色/对话对象/形象切换 | 全身立绘（seedream pro）+ `layer_decomposition` 透明人物层 |
| `.far` 场景带 | 视图需要氛围远景（天空/海面/街景） | seedream 横幅（16:9/21:9 档）或 capture 真景 |
| 图标 | 原创概念 app | 策展/official-icons（品牌）→ seedream full-bleed 圆角（原创） |
| 封面 | 画廊/og 需要 3:2 场景合成 | cover.mjs 合成 + seedream 底图 |
| 空态/插画/纹理 | 视图缺语义图 | seedream lite（便宜） |
| 修复 | capture 资产糊/遮挡/水印 | seedream img2img（reference_images）或 patch-erase |

### 1.2 means 序（成本↑）
复用/策展/capture（0）→ pollinations 匿名（0，免申请+披露）→ AgentPlan seedream（订阅配额，官方 skill 履约）→ 标准 key seedream（后付费，**consent+估价**）。

### 1.3 prompt 优化管线
enrich.mjs 词表 → art-direction 风格锚点 → **按槽位结构化模板**：
- 角色：`全身入镜从头到脚 + 净背景便于抠像 + 无文字无水印 + 赛璐璐/风格锚`
- 场景带：`横幅构图 + 视差分层暗示（远/中/近）+ 无主体人物（除非槽位要求）`
- 图标：`full-bleed 圆角方形内铺满 + 无边框无内边距 + 单主体`
参数路由：拆层/交互编辑/高精度=**pro**；组图/联网/流式=**lite**；`size` 经 `clampArkSize` 钳制；`watermark:false`；透明编辑需带 alpha 输入。

### 1.4 验收与重试
media-verify（尺寸/空白/VLM rubric≥3 均分、relevance≥2）→ 败则变异重试 ≤2（换 seed→加纠正词→换风格档）→ 仍败降档 means + PROVENANCE 注。**角色一致性**：同角色复用同一立绘/层（manifest 交叉索引 + 锁 seed）。

## 2. 生视频调用策略

### 2.1 机会识别
| 场景 | means 序 |
|---|---|
| 虚拟人 idle | CSS/精灵/视差假动效（0，默认）→ 标准 key seedance 首帧视频（consent）→ AgentPlan Large → agent-native |
| hero 氛围循环 | 同上；>10s 或正式 hero 先 **draft 样片**（1.5-pro）确认再正式 |
| 操作演示 | export-walkthrough 真录屏（禁止用生成视频冒充 UI 反馈） |
| **禁用** | UI 交互反馈、文字精度场景（视频文字不可控） |

### 2.2 参数策略（省配额纪律）
- idle：首帧 `role:first_frame` + `ratio:adaptive` + **480p** + `generate_audio:false` + `watermark:false` + duration 4-5 + prompt 含「无缝循环、首尾一致、镜头固定」
- 模型序：`doubao-seedance-2-0-mini-260615`（促销≈0.2 元/s @480/720p 至 2026-10-07）→ `2-0` → `2-5`；`ARK_VIDEO_MODEL` 覆写
- 止损：queued 超时 DELETE tasks/{id}；poll 10s 间隔/30min 上限；**video_url 24h/100 次→成功即下载**
- 成本预估进 consent 话术（时长×单价表，见 media-consent --ask-text）

### 2.3 验收与接入
media-verify video：ffprobe/faststart/≤2MB（超则 720→480 降档重压）/webm/poster/**loop-ok（首尾帧差≤12）** → 接 ADR-M99-video hero 层：`<video muted loop playsinline preload=metadata poster>` + `prefers-reduced-motion` 降级 + 同层活控件。

## 3. 媒体规划步（clone/Remix 工作流内）
知识提炼后跑 `gen/media-plan.mjs --run <run>` → `knowledge/media-plan.json`：
`{slots:[{slot,kind,need,means_order,cost_est,fallback}], policy:"consent-per-session"}`；
consent 申请附摘要；履约后登记 manifest（source=agent-media/ark-standard/…+consent）；inspect 增 `media-plan` warn 步（有 plan 且未履约槽位>0 → warn 公示）。

## 4. 成本与限流纪律
后付费档 consent+估价先行；IPM（图 500/min、拆层预扣 17）/RPM（视频 600 企业/180 个人）/并发（10/3）；24h URL 即下载；草稿/样片优先于正式（长视频）；同 session 至多一次授权询问。
