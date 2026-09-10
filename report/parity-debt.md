# 存量 parity 保真债（M49 公示）

门规则：M49（2026-09-10）后新建 run 的 parity 控件覆盖/交互覆盖 <0.8/<0.9 = hard；存量 run = warn + 本表公示。
债的含义：源屏（android ui-tree clickable / graph 边）比原型已接线控件多 → 补接线即可清债（data-act/data-goto）。

| run | 视图 | 现状 | 清债动作 |
|---|---|---|---|
| slytherin | 01-home/02-explore/03-me/05-plan | cov 0.34-0.92、inter 0.33-0.86 | 地图 pin/气泡/列表行补 data-act；me/plan 行补 goto |
| wechat-full | 01-chatlist/02-contacts/03-discover/04-me/05-services/12-group-chat/13-group-settings | cov<0.8 或 inter<0.9 | 列表行/宫格补 data-act；群聊设置链补 goto |

清债流程：补接线 → `qa/parity.mjs --run <run> --base <url>` → cov≥0.8 且 inter≥0.9 → 本表删行。
