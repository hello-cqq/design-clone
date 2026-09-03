# PM 验收报告 · 2026-09-01

范围：H 组全链路 + B 组捕获层。取证 /tmp/qa-pm-web /tmp/qa-pm-android /tmp/qa-regress。

## 通过
- **H1 web 全链路** ✅：HN 新鲜 capture（3 屏 stop=pages）→ tokens（7 变量）→ pixel 最小原型 → serve 4191 → inspect 16/16（五模式/演示/缩放/调参/对照/双主题/导航），console/pageerror 0
- **B1–B4** ✅：四件套齐；budget-seconds stop_reason 生效；--resume 只增不重拍；coverage 字段齐
- **B10/B11/B12** ✅：ladder.json 五级留痕（含新 L0 本地直拷）；proxy-env 感知 29758；keyframes 124 帧+dedup 81 重复
- **B5/B6 android** ⛔→部分：真机验收开始时掉线（USB 总线仅 Hub/AV 适配器）。prepare.sh fail-fast 守卫 ✅、--restore 无状态降级 ✅、record.sh 160s 轮转 code-reviewed ✅。H2 待重插续跑
- **H3 ios** ⛔：无 Xcode（simctl 缺失），引导安装中
- **B9 win** ⛔：模板静态审查（ios-desktop.md win 段存在）

## 本轮修复的技能缺陷
1. intent.mjs：新增 L0 本地素材直拷；无 --run 也落 ladder.json（analysis-only）
2. dedup.mjs：screens 缺失自动回落 frames（keyframes 契约对齐）
3. capture.mjs：budgets 未设限写 null 不写 0
4. sync-shell.mjs：--help 支持+参数过滤
5. inspect.mjs：D 键多 journey 弹 chooser 时自动选首条（回归器自身缺陷）

## 结论
web 全链路从 0 到交付闭环成立；android/ios 链路脚本守卫与回落符合预期，差真机/模拟器执行环境。
