# GATES & 产物矩阵（从 README 下沉的细节）

> README 只留门面；本文件是门禁与产物的权威清单。每条门都是可自跑的脚本；
> `scripts/regress.mjs` 对全部 run 跑全部门并写 `report/regress-<ts>.md`。

## 1. 每个 run 的产物

```
<run>/
├── meta.json        画廊真源（SPEC v2 同构：中英 name/desc、tags 3-6、category、source、license、ip_attestation）
├── icon.png         画廊图标（真图标链：输入→web favicon/manifest→mac icns→cloned→generated）
├── cover.png        画廊封面（1200×800 严格 3:2、≤300KB：category 色板+设备框+首视图真截图+图标+中英名+tags）
├── capture/         源证据：screenshots、ui-trees、录屏、action logs
├── knowledge/       tokens.css · source-map.json · privacy.json · scope.json · showcase.json · DESIGN.md
├── prototype/       交付物（见下）
├── qa/              门结果：interact.json · inspect.json · ui-smoke.json · critique.json …
├── report/          fidelity/eval/audit 报告 + 回归证据
└── export/          inspector 产的时间戳 PNG/webm/board 导出
```

`prototype/` 为**静态离线可开**包：

| 件 | 是什么 |
|---|---|
| `index.html` + `inspector.{js,css}` | inspector 外壳：pages/scene IA、预览/代码视图、设备壳、缩放/平移、与源对照、分享链接 |
| `views/*.html` | **活视图**——真 HTML 控件（禁截图当视图，硬门） |
| `runtime.js` | 交互运行时：`data-act` 目录（toggle/radio/checkbox/select/accordion/tab/sheet/dialog/toast/step/slider/input/back/goto）+ a11y roles + 键盘 |
| `pages/*.spec.json` | 每页产品设计 JSON（过 `schema/page.spec.schema.json`） |
| `design/figma-source.json` | Figma 可导入源（variables + frames + nodes 真 computed 值） |
| `annotations.json` / `products.json` | 产品标注与每屏产品三要素——应用内可编辑并写回磁盘 |
| `paths.json` / `journeys.json` | 交互路径（按真实产品逻辑分类：module/task/drill/modal/back）与演示旅程 |
| `appicon/` | 16–512 + maskable 图标（可克隆真图标，否则生成；`--regen` 调） |
| `version.json`（发布后） | app/version/published_at/skill_version/skill_channel |

## 2. Inspector 能力（`ui-smoke` 门全覆盖）

- **播放路径**（`P`）：页面模式从当前屏播、场景模式播选中路径；缺失时回退演示旅程（字幕/模拟对话/安全边界卡），并明确告知缺什么。
- **标注**（`A`）：点元素增删改产品标注 → `annotations.json`；过期标注显式 surfaced，不静默丢。
- **Inspect/编辑**：computed 样式读数、Alt+hover 测量、拖拽微调与样式编辑 → `edit-overrides.json`（Ctrl/⌘+Z 撤销、一键还原）。
- **Tweaks & 变体**：活 token 编辑；"存为变体"落 `prototype/variants/<name>/` + `variants-index.json`，`?variant=<name>` 复现。
- **导出**：浏览器 zip 下载（默认）/ File-System-Access 目录导出 / 服务端 `export/<ts>/`；含页面±标注、场景树、路径板、board.json、**设计规格与 figma 源**。
- **设备壳**：手机/平板/桌面/网页（390×844 / 834×1194 / 1280×800）可选 bezel+状态栏；选择持久化并进分享链接。
- **对照**：与原 capture 并排、匹配缩放、同步滚动。
- `?` 列出全部快捷键。

## 3. 四模式

| 模式 | 做什么 | 示例 prompt |
|---|---|---|
| **Clone** | 驱动 Android(adb)/headless Chromium/macOS HID 捕获 app 或站点的全屏、ui-tree、录屏与交互路径 | "把微信支付流程克隆成设计原型" |
| **Link** | 从抖音/B站/小红书链接或本地视频/图取设计素材：下载→抽帧→转写→识屏 | "重建这个 B 站视频里的记账 app" |
| **Remix** | 在克隆原型上做最小层重风格（色板/字/动效/布局）并自动复验 | "保持布局，改暗色赛博朋克+弹簧卡" |
| **Publish/Export** | 发布到社区画廊（publish.mjs 开 PR）；可选 Figma MCP 桥导出可编辑高保真文件 | "把这个原型发布到画廊" / "导出到 Figma" |

## 4. 门禁清单（为什么"绿"在这里有意义）

> 级别约定：**hard**=不绿即失败（exit≠0，regress/publish/CI 计入）；**warn**=计入报告 warn 列与债表公示，不拦；
> inspect 的 `consoleErrors`/`requestfailed` 为 **warn 级**（良性 404 如 overrides/variants 已过滤），`fail`/`pageErrors` 为 hard。

### 4.1 run 级门（本地自觉 + regress 汇总；run 产物 gitignored，CI 不跑）

- `doctor.mjs`——环境探针（adb/权限/点击通道）先行；`--onboard` 产 capability 报告（advisory）。
- `qa/interact.mjs`——**点每个控件**并断言可观测变化（`dead=0`，hard）。
- `qa/inspect.mjs`——硬门：live-views、placeholder-scan、asset-qa、layout-sanity、privacy-anon、paths-sanity（方向/回边/互反）、appicon-present、structural-critique、parity、**design-artifacts**、**gallery-ready**、**pasted-screenshot**、**view-weight-budget**、art-depth、brief-director、sel-ring-align；consoleErrors/requestfailed=warn 列。
- `qa/ui-smoke.mjs`——点外壳：播放/导出下载(含设计规格断言)/分享/设备/标注写/产品写/变体写/画布标签排版/`?chrome=0`/过滤/帮助/代码视图/**canvas-text-budget**/**wire-ink**/**wire-label-lite**/**tree-dir-clean**/**path-rows-all**/**cover-geometry**/**export-design-artifacts**。
- `qa/parity.mjs`——逐控件/交互覆盖（control≥0.8、interaction≥0.9，hard；存量 cutoff 前=warn+`report/parity-debt.md` 公示）。
- `fidelity.mjs` / `qa/fidelity-all.mjs`——与源像素 diff（view↔capture 正确配对）+ 样式 parity（hard>0.40 未 waive）。
- `qa/critique.mjs`——VLM 结构 critique（像素指标对稀疏浅色 UI 结构盲）。
- `qa/privacy.mjs`——真名/脸/PII 必须匿名或 genimg 替换（hard）；**consent 红线实际执法点在 `clone.mjs` 采集期**（无 `knowledge/consent.json` 拒绝启动 GUI 捕获）。
- `qa/paths-qa.mjs`——路径方向硬门：回边入路径/回退 nav 叶/互反双向/巨链导航化。
- `qa/audit.mjs`——标注 recall≥0.8 / truncated≤0.2 / overflow≤2（hard，M98 起 exit 真执法）。
- `eval/eval.mjs`——聚合分（fidelity/interactivity/perf/ux/stability/privacy），clone.mjs 收口跑。
- `regress.mjs`——对全部**有视图的 run**（capture-only run 无视图，隐式排除并在报告头注明）跑 interact+inspect+ui-smoke 三门（`--full` 加 fidelity-all 并计入判定），报告写 `report/regress-<ts>.md`（入库）。
- 存量债口径：新门对 cutoff（`meta.json created_at` 为准，M98 起不再用可 touch 的 mtime）前的存量 run 记 warn 并公示，新 run 硬拦。

| 门 | 子门 | 内容 | 级别 |
|---|---|---|---|
| inspect | art-depth | original 概念 run：全视图 data-fx-parallax≥2 且 data-fx="particles"≥1（M76-W3b，见 references/art-direction.md） | hard |
| inspect | brief-director | original/concept run：knowledge/brief.json 齐（pages≥4/角色+资产≥3/风格基准/图标/封面词）且 references/manifest 参考图≥页数（2026-09-13 前存量=warn） | hard |
| inspect | sel-ring-align | 选中框 rAF 活跟踪偏移 ≤3px（M85） | hard |

### 4.2 工程/站点门（CI 必跑，`.github/workflows/ci.yml`）

- 单测（node:test）· eslint 0 errors · tsc --noEmit · shell 构建确定性 · version-sync（SKILL.md==package.json==CHANGELOG 首个非 Unreleased 段）· zip 纯度（runs/devDeps/二进制未登记件=0）。
- `qa/ip-scan.mjs`——跟踪二进制仅限 REGISTERED 登记区（site 品牌资产/docs 图/策展官方图标，归属见 THIRD-PARTY）；外件=hard。
- `qa/secret-scan.mjs`——key/token/phone/ID 模式=hard。
- site e2e（`site/tools/e2e.mjs`，20 轮+复活断言集）· loadtest · **brand-qa**（pencil/veil/faststart/角标水印；M98 起挂 CI）。

### 4.3 发布链门

- `publish.mjs` 前置：interact dead=0 · inspect fail=0 · ui-smoke fail=0（M98 起真读 summary/聚合字段）+ privacy 绿 + 门 JSON 新鲜度（晚于 prototype/index.html 改动）。
- proto 仓 `pr-gate.yml`：SPEC v2 结构/meta/cover/icon/体积/禁名单/PII grep/冒烟（仅 PR 触发；直推 main 无校验=已知缺口，见 SESSION-SUMMARY 未决）。
