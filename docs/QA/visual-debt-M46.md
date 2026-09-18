# 视觉债清单（M46 回刷结果）

回刷口径：critique 桌面/网页 full run 及格线 4 + 全视图 + 证据 notes；placeholder-blocks 硬门；asset-qa fail=0。

| run | scope/platform | 结论 |
|---|---|---|
| mac-lark / mac-workbuddy / web-aliyun / slytherin / web-apple | full | M46 重修后 0 债（inspect 38/0/0） |
| link-xhs5 | full/web | 0 债（critique 全 ≥4） |
| wechat-full | full/android | 0 债（mobile 阈值 3，实际 ≥3；用户验收"还可以"） |
| demo scope runs（dy-*, intl-yt3, link-bili2/dy1/xhs2/xhs4, qa-*, wechat-pay） | demo | 豁免：demo 范围不强制全视图 VLM 分；升级 full 时按 M46 协议重修 |
| *-v1 快照 | - | 重修前冻结备份，不参与回归、不计债 |

**当前视觉债 = 0。** 新增 run 进 full 范围时必须先过 M46 四步协议。
