# VLM 分析协议（读帧/读截图/GUI 决策前必读）

宿主 VLM 在执行 GUI-agent 操作、视频抽帧理解、截图结构化时，**必须**按本协议输出，
保证信息直接挂接 inspector v3 的数据模型（页面/场景树/产品三要素/保真档）。
机器可读部分一律 JSON；禁止散文式描述代替结构。

## 1. 页面与路径（capture/link 分析阶段产出）
```json
{
  "pages": [
    { "id": "01-home", "title": "首页", "fidelity": "live-high|pixel|live-low",
      "is_dialog_or_state": false, "parent_page": null,
      "product": { "function": "一句话功能", "goals": ["留存", "NPS"], "page_prompt": "再生成提示词（见§4）" } }
  ],
  "edges": [
    { "from": "01-home", "to": "02-detail", "kind": "navigate|dialog|state",
      "action_label": "tap · 商品卡", "target_dc": "list/item1" }
  ]
}
```
判定规则：
- **弹窗/toast 遮罩/页内状态大变（登录前后、空态→满态）= 独立页节点**，kind=dialog/state，parent_page 指向宿主页
- 边必须带 `action_label`（交互关系，将显示在流程数据线）：`tap/swipe/input/longpress · 目标文案`
- 同页滚动不算边；重复出现的页只加边不新建

## 2. 平台检测（读帧前第一步，不确定必须问）
先出平台结论再读页面：
```json
{ "platform": "web|android|ios|ipad|desktop",
  "form": "mobile|desktop（仅 web）", "os": "mac|win（仅 desktop）",
  "confidence": "high|med|low", "signals": ["命中 presets/lib-index.json detection_signals 的条目"] }
```
- 逐条对照 `lib-index.detection_signals`：≥2 条命中同一平台且无他平台反证 → high；仅 1 条 → med
- `confidence=low` 或信号冲突（如宽屏+底部 tabbar 并存、小程序胶囊+浏览器地址栏并存）→ **必须用 question 工具询问用户**：选项 [Web 响应式 / Android 手机 / iOS 手机 / 平板 / 桌面]，推荐项=guess；禁止默默自选
- 结论落盘 `knowledge/platform.json`：{platform, form?, os?, source: auto|user, confidence, signals}
- 平台→shell/canvas/icon/字体 映射查 `lib-index.platforms.*`：ios/android→c_mobile，ipad→c_tablet，web.form.desktop→c_browser，web.form.mobile→c_mobile，desktop→c_desktop（os 决定红绿灯/caption 框顶）
- 组件/图标命名进入对应平台档：web=antd/Element Plus/MUI/shadcn 命名；android=Material 3；ios/ipad=HIG（SF Symbols 仅命名，抓取回退 lucide）；desktop=Fluent 2(win)/macOS HIG(mac)

## 3. 保真三档判定
- pixel：核心验收屏（支付/主流程终点/用户点名页）→ 截图底+热点
- live-high：默认档；要求真素材（extract-assets 裁剪 bbox 同帧给出）、tokens-sample 采样色、平台字体栈
- live-low：一闪而过/边缘屏；标注推断点
读帧时对每个 page 直接给档+理由（1 句）。

## 4. 产品三要素（每页/每关键元素必给）
- function：该页/元素"做什么"，一句动宾
- goals：大厂 PM 视角目标数组，从 [获客, 转化, 留存, 活跃, NPS/口碑, 降本, 信任/安全, 变现] 选≥1 并一句理由
- regen_prompt（再生成提示词）：让任意多模态大模型能生成**相似元素/功能**的 prompt，格式：
  `设计一个<组件类型>，用于<function>；尺寸约 WxH，圆角 R，主色 #hex，辅色 #hex，字体 <栈> <size>/<weight>；布局：<结构一句>；状态：<默认/激活/禁用>；风格锚：<clay-icon|pixar-3d|flat|sticker|原生平台风>；不要：<反例一句>`
  元素级写入 element_prompts{data-dc: prompt}；色值必须来自 tokens-sample 采样，不许目测。

## 5. GUI-agent 操作时
- 每步决策输出 `{observe: 1句, next_action: adb/midscene 语法, expect_kind: navigate|dialog|state|toast, screen_id_if_new}`
- 遇到登录/支付确认/验证码 → 立即停，按 human-takeover 四段式，不硬试
- 新页面分配 id 遵循 `NN-kebab`；与已有页哈希同 → 只加边

## 6. 素材 bbox 与图标 id（优先级：裁剪 > 索引 > 生图 > 重画）
读帧同时给出待裁素材：`assets:[{page, bbox:[x,y,w,h], out, kind: icon|avatar|img|texture}]`，
坐标基于该帧原始分辨率；图标类≥48px 边长才值得裁。
小图标/低分辨率/矢量需求 → 查 `presets/lib-index.json` 的 icon_semantic_map 给 **iconify id**
（如 `material-symbols/wallet-outline`），`extract-assets.mjs --icon <id> --color <采样hex>` 拉取缓存；
组件命名/结构对齐 lib-index.component_patterns（List.Item/TabBar/Chat.Bubble…），再生成提示词引用模式名。

## 落盘映射
- pages/edges → capture/graph.json（web 脚本已产）+ prototype/paths.json（paths-gen.mjs 汇总）
- product 三要素 → prototype/products.json（运行时看板读取）+ pages/*.spec.yaml meta.product（schema 同源）
- assets → extract-assets.mjs spec

## 7. 生成质量门禁（M14，写视图 HTML 前必读 mobile-shell-patterns.md）

- 壳组件（状态栏/圆图标钮/列表行+红badge/搜索栏/tabbar/渐变字符头像）先查 `references/mobile-shell-patterns.md` 复用模板，禁止临场发挥
- UI 图标一律内联 lucide 风 SVG（stroke 1.8）；emoji 不得充当图标（inspect no-emoji-ui fail）
- mascot/hero 资产梯：源帧裁剪（extract-assets --matte light/erase）→ genimg --style pixar-3d → 渐变字符头像
- 布局：flow 优先；绝对定位仅限悬浮 tabbar 与透明底 hero 叠卡；横向零溢出；对比度 ≥4.5:1
- 对照源：knowledge/source-map.json 记录 view→capture 帧映射，生成视图时同步写入
- 地基先体检：写视图前对该 run 跑 `node dedup.mjs <capture目录> --sub frames`，blank/黑屏/模糊帧**不得**用作 source-map 目标与裁剪源（截图质量直接决定生成质量，见 capture-quality.md）
- 产出前按 mobile-shell-patterns.md 末尾 P0/P1/P2 清单自查一遍再交付
- 产出后必审：`scripts/shotdiff.mjs <runDir> <view-id>` 出「生成 vs 源帧」拼图 → 按 critique-loop.md 清单打分修正，最多 2 轮
