# 全链路验收协议（QA Protocol）

触发词：全链路验收 / QA / 产品验收 / 设计走查 / 全量测试 / 回归。
每次触发**必须**按本协议四阶段执行，不许跳步；结果归档 `docs/QA/<日期>/`。

## 0. 基线与门槛
- 用例矩阵维护在 `docs/QA.md`（A–H 组）。**新缺陷修复后必补 case**，编号递增。
- 通过门槛：doctor 必需项 ✅；inspect.mjs 零 pageError、零非可选 requestfailed；
  fidelity：pixel <0.05、live-high <0.15（文本重排屏噪声约 0.11，QA 首轮校准）；五模式+演示+主题全操作 pass。
- 设备路由（每次验收开头探测并记录）：
  - Android：**真机 > 模拟器**（`adb devices` 有 device 用真机；否则 avd，见 install-guide §Android 模拟器）> env-blocked
  - iOS：simctl（需 Xcode）> env-blocked（缺失按 human-takeover 四段式引导安装）
  - Windows：本机无 win → 模板/文档静态审查，标 env-blocked
  - Web/mac：本机直跑

## 1. PM 验收（功能是否实现 + 全链路）
- H1 web：新目标 capture（预算制）→ tokens.mjs → 生成最小原型（≥2 视图+annotations+journeys）→ serve → `scripts/qa/inspect.mjs` 取证
- H2 android：安全目标（系统设置）捕获 ≥2 屏+ui-tree → 最小原型 → inspect.mjs
- H3 ios：sim-capture.sh list/launch/openurl/shot 闭环（环境具备时）
- B 组：预算停/续跑/coverage/录屏/dedup/proxy/keyframes/meta 逐项执行留痕
- 产物：`docs/QA/<日期>/pm-acceptance.md`（逐项 ✅/❌ + shots 引用）

## 2. 设计师走查
- 三 demo（wechat/dy1/xhs2）× 明暗：F1–F7（fidelity 阈值 / tokens-sample 抽点核对 / 字体栈 computed style / VLM 逐屏对照原图出 Fix 清单 / WCAG 对比度 / a11y title-alt-键盘 / emoji 残留扫描）
- 产物：`docs/QA/<日期>/design-review.md`（Fix 清单按 P0/P1/P2 分级）

## 3. 测试（功能/稳定/兼容）
- A 环境、C 知识、E Remix/Export、G 稳定兼容（serve 并发、genimg 缓存、sync-shell 幂等、三视口、代理 emulate、长截图滚动）
- 产物：`docs/QA/<日期>/test-report.md`

## 4. 修复闭环
- 三角色 Fix 清单**合并去重** → 主代理修复（不外包）→ 失败项用 inspect.mjs/对应脚本**回归重跑**
- 归档三份报告 + shots/；新坑进 LESSONS；架构级进 DECISIONS；ROADMAP 打 ✅
- 全绿后向用户交付：矩阵通过率 + 修复清单 + 仍 env-blocked 项

## 工具
- `node scripts/qa/inspect.mjs <base-url> <name> --shots <dir> [--run <runDir>]`：五模式/演示/缩放/调参/对照/双主题自动操作+截图+错误收集；带 `--run` 时串起全部硬门（含 ui-smoke --fast / privacy / layout-sanity / paths-sanity / appicon / structural-critique）
- `node scripts/qa/ui-smoke.mjs --run <runDir> --base <url> [--fast] [--keep]`：M44k 外壳冒烟门——真点播放/导出下载/分享/设备档/标注·产品·变体写回/画布标签排版/`?chrome=0`/左栏筛选/快捷键帮助/代码视图，断言"有反应且正确"；写盘类检查自动还原。`--fast` 跳过真实导出下载（inspect 内置用），regress 跑全量
- `node scripts/qa/interact.mjs --run <runDir> --base <url>`：逐视图真点每个控件断言可观测变化，dead=0 门
- `node scripts/qa/paths-qa.mjs <runDir>`：路径决策卫生门（禁 hub-chain/giant-chain/back 环等违反真实交互逻辑的结构）
- `node scripts/qa/critique.mjs --run <runDir> [--skeleton | --set <view> --layout N --notes ...]`：结构 critique（VLM 对照并排图打 layout 分）；full run 必须跑且 notes 不允许残留 TODO
- `node scripts/qa/warn-dump.mjs <base-url> [--out <file>]`：把各门 warn 汇总成清单，供"软警告清零"冲刺用
- `node scripts/gen/verify-page.mjs <ui-tree.xml> --expect "标签1,标签2"`：dump 后按特征文本验页身份（防热启动/导航错位拿错页）
- `node scripts/qa/viewsheet.mjs --run <run> --base <url> --out <png>`：全视图拼图，供 VLM/人一次看全
- `node scripts/gen/flows-skeleton.mjs <runDir>` / `node scripts/gen/flows-from-events.mjs <runDir>`：无 flows.json 时从图结构/录制事件流起草交互流骨架（agent 目视修正后落 flows.json）
- `node scripts/desktop/diff2.mjs <a> <b>`：桌面 capture 两帧差分，验证点击是否命中（clickv 闭环证据）
- `node scripts/package.mjs [--out dist/design-clone.zip]`：打包 skill 主体为 zip（无 CLI 平台兜底；CI 同款）
- `node scripts/fidelity.mjs`、`scripts/tokens-sample.mjs`、`scripts/review.mjs` 作设计走查证据
- `node scripts/gen/utility-css.mjs --run <runDir> [--strict]`：utility 子集本地编译（替代 CDN）；unknown=长得像 utility 却无任何样式源定义（笔误门）
- `node scripts/build-shell.mjs [--out <file>]`：inspector 17 段拼接；`npm test` 内含"拼接=单 IIFE/确定性/无重名顶层声明"断言
- `node scripts/qa/ip-scan.mjs` / `node scripts/qa/secret-scan.mjs`：开源自证门（跟踪文件零二进制/零 run 产物；零凭据/PII），CI 必跑
- 一键全量：`node scripts/regress.mjs [--runs a,b] [--full]`（每 run：interact + inspect(含 ui-smoke --fast) + ui-smoke 全量含导出下载 [+ --full 时 fidelity-all]，输出 report/regress-<ts>.md）
