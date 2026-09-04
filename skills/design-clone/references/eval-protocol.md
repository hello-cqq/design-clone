# 评测与有界自修复协议（M15）

生成/改造原型后必跑：`node scripts/eval/eval.mjs --run <runDir> --port <port>`。
verdict=FIX 时按本协议修复并重跑，**最多 3 轮**；3 轮仍 FIX 则停下交人工（列 issues），不无限循环。

## 三维评分（0-100，total = .3 perf + .4 ux + .3 stab）

- **perf 性能**：goto(networkidle) 双次均值（≤1200ms 满分，5000ms 零分，权重 .6）+ prototype 体积（≤600KB 满分，3MB 零分，权重 .4）。
- **ux 体验**：inspect 21 硬检查通过率 − 5×warnFail + 覆盖加成（paths/annotations/products/journeys 各 5，上限 20）。
- **stab 稳定性**：100 − 30×(consoleErrors+pageErrors) − 20×(双跑 checks 不一致)。

## 判通过

`hard fail==0 && consoleErrors==0 && pageErrors==0 && 双跑幂等 && total≥80`。

## 零容忍（#stab-zero-tolerance / #hard-checks）

console error / page error / 硬检查 fail / 双跑不一致 → 必修，不在"可接受"集合内。
常见根因 playbook：
- `requestfailed: .../tokens.css|*.json` → run 缺文件：从快照目录恢复或补默认值（serve.mjs OPTIONAL_DEFAULTS 只管可选 json；tokens.css 必须真文件）。
- 404 资源 → source-map 回退链断：补 `knowledge/source-map.json` 或 capture 符号链接。
- 硬检查 fail → 对照 inspect.mjs 的 check 名定位（shell-v4=外壳未 sync；journeys/products=数据文件缺）。

## warn playbook（#warn-playbook，不阻断但每轮顺手修）

- `no-emoji-ui`：UI 图标换 SF Symbols/lucide 命名或内联 SVG，emoji 只许出现在用户生成内容位。
- `contrast`：低对比节点按 tokens 提一档（正文 ≥4.5:1，大字 ≥3:1）。
- `overlap-audit`：负 margin/绝对定位叠压，改流式或加 padding。
- `no-h-overflow`：固定宽改 max-width/min()。
- `assets-exist`：补资产或改引用。

## perf playbook（#perf-playbook）

- goto 慢：视图外链 CDN 字体/大图 → 本地化或 preload；iframe 场景卡懒载。
- 体积大：assets 用 sharp 转 webp/降采样（extract-assets 已有守卫），视频不进 prototype。

## 循环纪律

1. 每轮先修零容忍，再修 warn；一次修一类，修完重跑 eval（`--diff` 看增量）。
2. 分数不回退（total 或任一维 −10 以上）才继续；回退即回滚该轮改动。
3. 第 3 轮仍 FIX：写 `docs/LESSONS.md` 一条 + 交人工，终止循环。

## fidelity 门（M19）

scope=full 必须有 `<run>/report/fidelity.json`（核心视图≥3 的 ratio）+ `qa/critique.log`。
阈值（2026-09-03 校准：wechat 01-chatlist 真头像+精确色实测 0.1315）：
app 视图 ratio ≤0.20 达标（warn 修），>0.40 hard 阻断；web ≤0.15 / >0.30 hard；pixel-perfect 目标 <0.08。
豁免须 critique.log 记理由（如动态内容区）。

## parity 逐控件/交互门（M23，不敷衍评测）

`qa/parity.mjs --run <r> --base <url>` 输出 qa/parity.json：
- 控件覆盖 = 原型交互元素数 / 源控件树 clickable 数（android XML / web JSON 自动；无树须 qa/parity-log.md 人工盘点）
- 交互覆盖 = graph 边被原型 data-goto 命中比例
inspect `parity` 硬检查仅强制"有证据"（mode≠none）；覆盖数值如实进 EVAL-REPORT 列，
不强行打绿——密度缺口靠逐控件重建提升，靠报告透明呈现。
