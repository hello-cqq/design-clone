# 测试报告 · 2026-09-01

18 项首跑 15✅/1⚠️/2❌ → 修复后复跑全绿（除 env-blocked）。取证 /tmp/qa-test。

| 组 | 结果 |
|---|---|
| A1-A3 环境 | ✅ doctor 必需项✅；npm dry-run 可解析；node 24≥20.19 |
| B8 mac | ✅ screencapture 3024×1964 实截 |
| C1-C3 知识 | ✅（C3 初❌：dy1/xhs2 缺 DESIGN/flows/components → 已补六文档） |
| D15 幂等 | ✅ sync-shell 连跑 sha 不变 |
| E1-E5 Remix/Export | ✅ variants 三 iframe；apply-patch tokens 变化；review 五维产物；figma-plan 4页13vars；walkthrough webm 680KB |
| G1 并发 | ✅ 50×200 |
| G2 缓存 | ✅ sha1 缓存二次 hit |
| G3 视口 | ✅ 1280/1440/1920 无溢出 |
| G4 代理 | ⛔ env：29758 不回环 localhost 全 503；直连 301 回归✅（用例改直连断言） |
| G5 滚动 | ✅ 断言校准"溢出才可滚"；scrollIntoView 触发✅ |
| D1-D14 | ✅ inspect 16/16 ×3（含 301/no-store/主题/快捷键/像素热点） |

## 稳定性
serve 三实例全程未崩；genimg 节流+缓存生效；sync-shell 幂等；capture resume 不重拍。

## env-blocked
G4 代理回环（用例侧）、H2 真机（掉线待重插）、H3 iOS（待装 Xcode）、B9 win（无真机）。
