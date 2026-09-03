# Figma 导出细则（Export 模式）

前提：用户明确要求导出，且以下路线至少一条可用。都不满足时，告知用户
"原型 HTML + spec.yaml 已足够支撑开发，Figma 导出需先完成接入配置"，不强推。

## 第 0 步：生成导出计划（MCP 无关中间层）

```bash
node {SKILL_DIR}/scripts/figma/export.mjs <run目录>
```

产出 `report/figma-plan.json`：
- `variables`：tokens.css 全量 → Figma 0-1 浮点（hex/rgb 自动转）
- `pages[].frame`：页框尺寸；`pages[].nodes[]`：每个 data-dc 节点的
  kind(text/button/image/frame/rect) / rect / fill / color / cornerRadius / 字体四元 / 文本
- 样式读的是**真实计算值**（playwright 渲染后 getComputedStyle），var() 已解引用

创建完成后回填：`node export.mjs <run> --apply-nodeids map.json`，
map 键 `"<page>::<dc>"` / `"<page>::__frame"` → nodeId。增量修改（见文末）靠它定向 patch。

## 路线一：Figma 官方远程 MCP（首选）

- 端点：`https://mcp.figma.com/mcp`，任意 Figma 账号（含免费）可用；当前 beta 免费
- 需要宿主环境已配置该 MCP（检测方式：会话中是否存在 figma 相关 MCP 工具）
- 能力：write to canvas（创建/修改 frames、组件、auto layout、variables）
- 执行：按 `prototype/pages/*.spec.yaml` 逐页创建；颜色转 0-1 浮点；
  中文文本创建前确保字体可加载；Frame 命名 `<page_id>-<page_name>`，
  多页横向排布（间距 ≥ 100px）
- 回填：创建成功后把 frame nodeId 写入 `meta.figma.frame_node_id`，
  各 region 的 nodeId 写入 `regions[].figma_node_id`

## 路线二：talk-to-figma-mcp（降级）

适用：官方 MCP 不可用、或需要图片填充/注释/连线等细粒度操作。

1. 依赖：bun、Figma 桌面/网页版
2. 安装运行：
   ```bash
   bunx cursor-talk-to-figma-mcp@latest    # MCP server（配置进宿主 agent 的 mcp 配置）
   bun socket                                # WebSocket 中继（保持运行）
   ```
3. Figma 插件：Community 安装 "Cursor MCP" 插件 → 打开 → `join_channel`
4. 工具映射（spec → Figma）：
   - shell/regions 容器 → `create_frame` + `set_layout_mode`/`set_padding`/`set_item_spacing`
   - 文本 → `create_text`；色块/按钮 → `create_rectangle` + `set_fill_color` + `set_corner_radius`
   - 截图素材 → `set_image_fill`（本地文件路径，`capture/screens/<id>.png`）
5. 同样回填 nodeId 到 spec

## 路线三：只读验收

Framelink（`figma-developer-mcp`）只读，不能写；仅用于导出后拉回元数据/截图做验收对照。

## 增量修改（导出后用户再改原型）

遵循 Remix 协议的"最小层修改"：改 spec → 用回填的 nodeId 定向更新对应
frame/节点（官方 MCP 的修改能力或 talk-to-figma 的 `set_*`/`resize_node`），
禁止删掉整页重建（除非用户要求"重新生成该页"）。

## 不做的事

- 不通过 Figma REST API 写入（官方无写入端点）
- 不在导出时上传用户截图到第三方服务（`set_image_fill` 走本地文件）
