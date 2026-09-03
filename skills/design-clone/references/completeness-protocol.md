# 完整应用原型协议（M16）

用户诉求：手机/桌面 app 的克隆必须是**完整应用原型**（覆盖一级 IA + 二级主入口 + 关键流程），
不是两三个页面的打样。打样级 run 须标 `scope:"demo"`，完整级标 `scope:"full"`。

## 1. scope 声明（knowledge/scope.json）

```json
{ "scope": "full", "ia_plan": "knowledge/ia-plan.json", "budget_screens": 50, "stop_reason": null }
```

## 2. IA 清单（捕获前必写 knowledge/ia-plan.json）

先验（公开信息/包名/品类常识）+ 首屏 dump 修正，枚举：
```json
{ "tabs": ["首页","消息","我"], "entries": { "首页": ["搜索","商城","直播"], "我": ["设置","收藏"] } }
```
- `tabs` = 一级 tabbar/侧栏项；`entries` = 每个 tab 内可见二级入口。
- 清单允许捕获中扩张（发现新入口追加并记 `discovered:true`）。

## 3. sweep 纪律（Android/桌面共用）

1. 逐 tab：点 tab → 截图+dump → 遍历 `entries[tab]`：tap → 截图+dump → BACK。
2. 哈希相同（dedup）只加边不新增屏；新页面分配 screen-id。
3. 三级流程仅扫"关键流"（下单/发布/设置类），其余只记录不进入。
4. 预算：`budget_screens` 或 45 分钟，先到先停，`stop_reason` 落 scope.json 并向用户汇报。
5. 红线照 safety-rules：支付确认前停、密码/验证码交用户、聊天/社交内容只借布局。

## 4. 保真分层（完整性的效率关键）

- **核心屏（≤6 个）live-high**：tokens + 壳组件手写视图（tab 首页/个人页等品牌强感知屏）。
- **其余屏 pixel 档**：截图底 + 热点跳转（`data-goto`），视图 = `<img>` + 热区，分钟级出屏。
- 共享壳组件先提 `prototype/components.css`（tabbar/navbar/列表行/卡片，复用 mobile-shell-patterns），
  核心屏批量生成保持一贯。

## 5. 生成与指标

- 每去重屏一个视图，view 命名 `<idx>-<tab>-<entry>.html`；**视图主体必须 live**（M18），pixel 仅 compare/状态帧。
- graph.json 边必须来自 actions.jsonl 真实导航；paths-gen 自动出场景树。
- 完整性指标（eval detail）：`views` = 视图数；`ia_coverage` = 命中清单/清单总数；`live_ratio` = live 视图占比。
- scope=full 门槛：views≥10（web≥8）且 ia_coverage≥0.8 且 live_ratio=1；live 不足由 inspect `live-views` 硬阻断。

## 6. 验收

inspect 21 硬 + shotdiff 抽审核心屏 + eval（含完整性）→ 有界自修复 ≤2 轮 → serve 常驻 → 汇报覆盖矩阵
（tabs×entries 命中表 + stop_reason + 刻意排除项）。

## 7. IM 深层清单（M17，full 必扫）

一级 tab 之外，IM 类 app 还须覆盖：
- 单聊会话页、群聊会话页
- 群设置（群聊信息：群成员/群公告/群管理入口）
- 好友/联系人设置页（资料卡：头像/昵称/备注/地区）
- 长按会话行的上下文菜单
- 搜索流：聚焦态 + 输入（中文走 Midscene ai-input，无 env 回落人工）+ 结果态
- 微信小程序：会话列表下拉托盘 + 进入一个小程序首屏
- 状态对：核心屏 loading 帧（tap 后 0.3s）+ settle 稳定帧（`settle.mjs`）

full 预算默认 ≥25 屏；web 目标 ≥8 页。

## 8. 状态对与手势矩阵（M17）

- 状态对命名 `<id>--loading`，作为独立视图入 pages；live-high 视图可用 CSS skeleton 块表达。
- 等待纪律：动作后不再 fixed sleep 直截，用 `settle.mjs`（差值稳定才落盘）。
- 手势矩阵（adb）：tap / longpress(同坐标 swipe≥800ms) / 四向 swipe / pulldown(顶 20%→80%) / text(ASCII) 支持；
  三指/双指捏合 **不支持**（input 无多点触控），handoff 如实声明。
- 桌面：click 默认 CGEvent 真实 HID（clickv 闭环）+wheel/type；Electron 同样默认自动（raise+fresh shot+clickv，M18 验证 WorkBuddy 首试命中）；human-takeover loop 仅兜底。

## 9. 隐私分层（M17，硬约束）

1. capture 层：原图仅存本机 capture/，不进交付物/录屏。
2. pixel 层：含真人信息（头像/昵称/群成员/ID）的截图，进原型前必 `img/mask.mjs` 打码；
   区域清单落 `knowledge/privacy-rects.json`。
3. 文本层：live-high 文案全虚构；inspect `privacy-scan` 扫手机号/wxid/微信号/邮箱/身份证 → 交付前清零。
4. 交付层：handoff 声明"capture 仅本机参考，原型已匿名"。
