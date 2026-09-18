# 存量 parity 保真债（M49 公示）

门规则：M49（2026-09-10）后新建 run 的 parity 控件覆盖/交互覆盖 <0.8/<0.9 = hard；存量 run = warn + 本表公示。
债的含义：源屏（android ui-tree clickable / graph 边）比原型已接线控件多 → 补接线即可清债（data-act/data-goto）。

| run | 视图 | 现状 | 清债动作 |
|---|---|---|---|

清债流程：补接线 → `qa/parity.mjs --run <run> --base <url>` → cov≥0.8 且 inter≥0.9 → 本表删行。
