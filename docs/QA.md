# 全链路验收用例矩阵

维护规则：新缺陷修复后必补 case（编号递增）；每次验收在 `docs/QA/<日期>/` 出报告。
状态：✅ 通过 / ❌ 失败(见报告) / ⛔ env-blocked / ⏳ 未跑

## A 环境与基础
| # | Case | 平台 | 状态 |
|---|---|---|---|
| A1 | doctor.mjs 分级输出 | all | ✅ |
| A2 | npm ci 依赖可复装 | all | ✅ |
| A3 | node ≥20.19 兼容 | all | ✅ |

## B 捕获层
| # | Case | 平台 | 状态 |
|---|---|---|---|
| B1 | web capture 新鲜抓取四件套 | web | ✅ |
| B2 | 预算三档先到先停+stop_reason | web | ✅ |
| B3 | --resume 续跑不重拍 | web | ✅ |
| B4 | coverage.json 字段 | web | ✅ |
| B5 | adb 真机 prepare→screencap+dump→actions→dedup→restore | android | ⛔ env，见报告 |
| B6 | record.sh 循环录屏绕 180s | android | ✅ |
| B7 | sim-capture list/launch/openurl/shot 闭环 | ios | ⛔ env，见报告 |
| B8 | desktop capture.sh check/shot | mac | ✅ |
| B9 | win 模板静态审查 | win | ⛔ env，见报告 |
| B10 | intent.mjs 六级路由梯+ladder.json | web/android | ✅ |
| B11 | proxy-env 系统代理感知 | all | ✅ |
| B12 | keyframes 抽帧去重+meta 二级源 | web | ✅ |

## C 知识层
| # | Case | 状态 |
|---|---|---|
| C1 | tokens.mjs 色板+变量规范 | ✅ |
| C2 | DOM tokens 真实 font-family | ✅ |
| C3 | DESIGN.md/flows/components 齐备 | ✅ |

## D Inspector（三 demo × 全部，inspect.mjs 覆盖）
| # | Case | 状态 |
|---|---|---|
| D1 | 普通 data-goto+placeholder | ✅ |
| D2 | 产品 pin+折线+tip | ✅ |
| D3 | 设计 inspect+测量线 | ✅ |
| D4 | 编辑拖拽导出 patch | ✅ |
| D5 | 路径抽屉+播放四键 | ✅ |
| D6 | 调参+变体+重置 | ✅ |
| D7 | 缩放/滚轮/1:1/适应/抓手 | ✅ |
| D8 | 演示 D/?demo= 全流程 | ✅ |
| D9 | 对照原图 | ✅ |
| D10 | 主题切换+记忆+跟随 | ✅ |
| D11 | hashchange/?variant/?embed | ✅ |
| D12 | pixel 热点+徽标 | ✅ |
| D13 | 快捷键 1-6/H/±/0 | ✅ |
| D14 | serve 301+no-store | ✅ |
| D15 | sync-shell 幂等 | ✅ |

## E Remix/Export
| # | Case | 状态 |
|---|---|---|
| E1 | variants.html 三变体+点选 | ✅ |
| E2 | apply-patch tokens/layout | ✅ |
| E3 | review.mjs 五维 | ✅ |
| E4 | figma plan+apply-nodeids | ✅ |
| E5 | export-walkthrough webm/gif | ✅ |

## F 设计走查（三 demo × 明暗）
| # | Case | 状态 |
|---|---|---|
| F1 | fidelity 阈值（pixel<0.05 / live-high<0.15） | ✅ |
| F2 | tokens 采样核对 | ✅ |
| F3 | 字体栈核对 | ✅ |
| F4 | VLM 逐屏对照 Fix 清单 | ✅ |
| F5 | WCAG 对比度 | ✅ |
| F6 | a11y title/alt/键盘 | ✅ |
| F7 | emoji 残留扫描 | ✅ |

## G 稳定/兼容
| # | Case | 状态 |
|---|---|---|
| G1 | serve 并发 50 | ✅ |
| G2 | genimg 缓存命中 | ✅ |
| G3 | 三视口不溢出 | ✅ |
| G4 | 代理 emulate 防回归 | ⛔ env，见报告 |
| G5 | 长截图滚动+scrollIntoView | ✅ |

## H PM 全链路 E2E
| # | Case | 平台 | 状态 |
|---|---|---|---|
| H1 | HN：capture→tokens→原型→inspect→handoff | web | ✅ |
| H2 | Android 设置 app 捕获→原型→inspect | android | ⛔ env，见报告 |
| H3 | iOS 模拟器闭环 | ios | ⛔ env，见报告 |
