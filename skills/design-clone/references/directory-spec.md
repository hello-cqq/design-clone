# 产物目录规范（directory-spec）

每次克隆/取材一个目标，产出一个独立目录。默认位置：`./design-clone-runs/<目标名>/<run-id>/`，
`run-id` = `YYYYMMDD-HHmmss`。用户指定位置时从用户。

```
<产物目录>/
├── capture/                     # 捕获层（原始证据，只增不改）
│   ├── manifest.json            # 本次捕获的元信息（见下）
│   ├── graph.json               # 页面状态图（见下）
│   ├── actions.jsonl            # 动作日志，每行一个 JSON
│   ├── screens/                 # 每屏一张截图：<screen-id>.png
│   ├── ui-tree/                 # 控件树：<screen-id>.xml(Android) 或 .json(Web)
│   ├── frames/                  # Link 模式：视频关键帧 <序号>-<时间戳>.png
│   └── videos/                  # 录屏：record-<序号>.mp4（Android 循环录屏会多段）
├── knowledge/                   # 提炼层（设计理解）
│   ├── tokens.json              # 色彩/字体/间距 tokens（机器可读）
│   ├── tokens.css               # 同上的 CSS 变量形式（原型直接引用）
│   ├── DESIGN.md                # 设计理念文档（产品目标/信息架构/设计决策）
│   ├── components.md            # 原子组件清单
│   └── flows/                   # 交互路径：<场景名>.md
├── prototype/                   # 生成层（可交互原型 + 活 PRD）
│   ├── index.html               # 入口：inspector 外壳（五模式 + 缩放画布）
│   ├── inspector.js / inspector.css   # 五模式运行时（模板复制，勿手改）
│   ├── annotations.json         # 产品视角批注：{<screen-id>: [{target,label,notes,note}]}
│   ├── journeys.json            # 路径视角：[{id,name,steps:[{page,target,action,label,rect,result}]}]
│   ├── pages/                   # 每屏规格：<screen-id>.spec.yaml
│   ├── views/                   # 每屏实现：<screen-id>.html（元素带 data-dc 锚点）
│   ├── assets/                  # 图标/图片素材：extract-assets 裁剪 / genimg 生成；images.json 清单 + .cache 缓存
│   ├── utilities.css            # 本地编译 utility 子集；动效=原生 @keyframes（零 CDN）
│   └── README.md                # 运行说明
├── export/                      # 导出层（serve.mjs /__dc_export__ 产出，原型本体不含外壳）
│   └── <ts>/                    # pages/<id>(+ann).png / scene-full.png / node-*.png / path-*.png / path-*.webm / board.json / manifest.json
└── report/                      # 验证层
    ├── fidelity.json            # 保真 QA：fidelity.mjs 像素差异率（pixel 档≈0，live-high <0.08）
    ├── verify-<screen-id>.png   # 原型渲染截图（与原截图对照用）
    ├── walkthrough-<journey>.webm|.mp4|.gif   # 演示模式导出视频
    └── notes.md                 # 验证结论与返工记录（含五维评审 Keep/Fix/QuickWins）
```

## screen-id 规则

`<两位序号>-<语义名>`，如 `01-home`、`02-chat-list`、`03-pay-confirm`。
语义名用小写英文连字符，从截图内容提炼（中文应用也用具象英文名：`wallet`、`scan`）。

## manifest.json

```json
{
  "target": "news.ycombinator.com",
  "target_type": "web | android | ios | desktop | link",
  "scope": "full | scenario:<场景名>",
  "platform_info": { "os": "...", "device": "...", "app_package": "...", "app_version": "..." },
  "viewport": { "width": 390, "height": 844 },
  "started_at": "2026-09-01T10:00:00+08:00",
  "ended_at": "...",
  "screen_count": 12,
  "budgets": { "max_pages": 30, "budget_seconds": 25, "max_depth": 99, "clicks": 4 },
  "stop_reason": "pages | seconds | depth | drained",
  "tool_versions": { "node": "...", "adb": "...", "playwright": "..." }
}
```

## state.json（断点续跑，web 捕获）

`{seq, visited[], queue[{url,edgeIdx,depth}], nodes[], edges[], domTokens, started_at}`，
每完成一屏原子写；`--resume` 读回续跑。graph.json 同步增量落盘。

## coverage.json（DESIGN.md 深化输入）

`captured / discovered / unvisited_count / unvisited_top(30) / by_path_prefix /
depth_distribution / duplicates / stop_reason / backlog`。

Android 目标尽量补齐 `platform_info`：
`adb shell getprop ro.product.model`、`adb shell dumpsys package <包名> | grep versionName`。

## graph.json

```json
{
  "nodes": [
    {
      "id": "01-home",
      "title": "首页",
      "url": "https://...（web 目标才有）",
      "screenshot": "screens/01-home.png",
      "ui_tree": "ui-tree/01-home.json",
      "first_seen_at": "...",
      "hash": "a3f0c1...",
      "fidelity": "high | low",
      "notes": "..."
    }
  ],
  "edges": [
    {
      "from": "01-home",
      "action": { "type": "tap", "target": "登录按钮", "coord": [187, 799] },
      "to": "02-login",
      "at": "..."
    }
  ]
}
```

- `action.type` ∈ `tap | swipe | long_press | input | back | deeplink | goto | scroll | wait`
- 同屏内的动作（如滚动查看更多）`from == to`，保留边用于还原页内交互
- 被安全规则拦截的边：`"to": null, "blocked_by": "safety:payment"`

## actions.jsonl（每行一条）

```json
{"t":"2026-09-01T10:00:01+08:00","step":1,"screen":"01-home","action":{"type":"tap","target":"登录按钮","coord":[187,799]},"result_screen":"02-login","note":""}
```

`result_screen` 为 `null` 表示动作未产生新屏；`note` 记录异常（如"弹窗已自动关闭"）。

## annotations.json（产品视角批注）

键为 screen-id，值为批注数组：`target` = 视图中的 `data-dc` 选择器；
`notes[]` = `{event, response}`，event 用用户语言（点击/长按/滑动/开关/状态）；
未捕获而依据产品常识补充的响应，response 里标注"（推断，未捕获）"。

## journeys.json（路径视角）

`steps[].result.kind` ∈ navigate | dialog | toast | state | instant | blocked；
`rect` = 真机/网页捕获坐标系下的目标框（用于故事板高亮），无则省略；
故事板缩略图直接引用 `capture/screens/<page>.png`。

## 去重

`scripts/dedup.mjs` 用感知哈希（aHash 8x8）标记重复：汉明距离 ≤ 6 判为同屏。
重复屏不删文件，只在 `graph.json` 节点上标 `"duplicate_of": "<screen-id>"`，
edges 指向原始屏。生成原型时只为原始屏建视图。

## M44h/i 新增产物（展示与入口契约）
```
<run>/
├── knowledge/
│   ├── flows.json            # 真实交互流（events 归纳或 agent 推断）→ paths-gen 优先
│   ├── flows-skeleton.json   # 结构推导草稿（agent 修正用）
│   ├── consent.json          # GUI 采集同意收据 {granted,scope,platform,at,by}
│   ├── showcase.json         # 展示网站契约 {id,title,subtitle,platform,shell,source,tags,blurb,icon,iconMaskable,cover,views,updatedAt}
│   └── run-state.json        # 阶段状态（--resume 续跑）
├── capture/events.jsonl      # 采集期真实交互事件（ground-truth 路径来源）
└── prototype/
    ├── appicon/              # icon-16..512.png + icon-maskable-512.png + icon-spec.json(--regen) + cover.png
    ├── variants/<name>/      # remix 变体（tokens-override.css + layout-overrides.json），原版=default 保留
    └── variants-index.json
```
