# recovery.md — 失败分类 → 恢复动作（M44h）

门禁 fail 时先按本表定位；能自动修的用 `scripts/autofix.mjs`（≤3 轮），其余人工/VLM。

| 门禁/现象 | 根因 | 恢复动作 |
|---|---|---|
| interact `dead>0` | 可点元素（含 computed cursor:pointer 的库样式按钮）未接线 | `node gen/wire.mjs <run>`（同口径自动接 toast/toggle/tab）；个别容器类手工加 data-act |
| inspect `no-emoji-ui` | 视图含 emoji 作 UI/内容 | `node retrofit.mjs <run>/prototype/views`（emoji→inline SVG）；内容型 emoji 加 `data-emoji-ok` |
| inspect `layout-sanity` clipped | flex 子项 min-width:auto / 固定高 / 无 ellipsis | 库 css 已含 min-width:0+ellipsis；仍裁→该元素加 `overflow:hidden;text-overflow:ellipsis` 或换行 |
| inspect `layout-sanity` empty-slot | >120×120 无子无背景图纯色块 | 加 empty-state 文案/图标；确为装饰加背景图或 `data-deco` |
| inspect `layout-sanity` broken-img | img naturalWidth=0（资源 404/路径错） | 重裁资产（extract-assets/autocrop）或修 src 路径 |
| inspect `no-h-overflow` | 内容宽于 shell（单行 flex 等） | 换行(flex-wrap/grid)或收缩；桌面视图检查 .da-main flex:1 |
| inspect `privacy-anon` | 真名/PII/真人脸未处理 | 更新 knowledge/privacy.json anon_map/face_assets；脸用 gen-loop 虚构；营销 stock 走 exemptions |
| inspect `structural-critique` | full run 缺 critique.json 或 layout<3 | `node qa/critique.mjs --run <run> --skeleton` 后 VLM 对照并排图 `--set <v> --layout N` |
| inspect `paths-sanity` giant-chain/hub-chain | 导航被当路径 | 重跑 `node paths-gen.mjs <run>`；仍坏→补 knowledge/flows.json（真实交互流） |
| inspect `appicon-present` | 缺 appicon/showcase | `node gen/appicon.mjs --run <run>`（cloned 无干净源时 `--mode generated --prompt "<品牌描述>"`） |
| inspect `live-views`/`placeholder-scan` | 视图退化为截图/占位 | 按 prototype-spec 资产阶梯重做为 live 控件 |
| eval `fidelity` hard | 像素差超阈 | 对照 capture 重裁资产/重排版；匿名页 `--waive anonymized-...`；桌面模态 waive modal-approx |
| eval `style-parity` warn | 原型偏素/风格不一致 | autocrop 真品牌 tile/icon + 彩色层次；或 gen-loop 风格匹配资产 |
| capture 失败（web） | 反爬/登录/JS 重 | link/intent.mjs 六级梯（L2 headless→L3 headed 登录→L4 GUI）；或用户给截图/录屏 |
| capture 失败（android） | 无设备/未授权 | 按 human-takeover.md；或降级 web/链接取材；GUI 步骤需 consent.json |
| genimg 低俗/不像 | 无安全后缀/风格不符 | genimg 已带 SAFETY 后缀；改 `--style`/`--prompt`；封面默认 no-people |
| serve 端口占用 | 残留进程 | serve 自动 +1；或 `lsof -i :<port>` 清理 |
| 中断续跑 | 会话断开 | `node clone.mjs ... --resume`（读 run-state.json 跳过已完成阶段） |
