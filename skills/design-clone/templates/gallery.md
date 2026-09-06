# 模板画廊（M44h）

帮用户/agent 选 shell、组件库、生图风格的索引。缩略图可用 `node scripts/qa/viewsheet.mjs --run <run> --base <url> --out /tmp/g.png` 生成任一 run 的全视图拼图作为示例。

## Shell（外壳四档）
| shell | 适用 | 尺寸 |  chrome |
|---|---|---|---|
| `c_mobile` | 手机 app（微信/抖音/相机/圆周轨迹） | 390×844 | 状态栏+岛 |
| `c_tablet` | 平板 | 834×1194 | 状态栏 |
| `c_browser` | 桌面网页（apple/aliyun/营销站） | 1280×800 | 浏览器框(tab+url) |
| `c_desktop` | 原生桌面 app（飞书/WorkBuddy/Slack/IDE） | 1280×800 | OS 窗(红绿灯) |

## 组件库（templates/components/）
| 库 | 积木 | 典型 run |
|---|---|---|
| `mobile-im` | mi-nav/mi-row/mi-cell/mi-tabbar/mi-bubble/dc-sw | wechat/slytherin/link-* |
| `desktop-app` | da-root/da-rail/da-side/da-main/da-card2/da-chip/da-banner/da-panel | mac-lark/mac-workbuddy |
| `web-marketing` | wm-nav/wm-hero/wm-cta/wm-table/ap-tile | web-apple/web-aliyun |
| `controls` | data-act 全控件（toggle/radio/checkbox/select/accordion/tab/sheet/dialog/step/slider） | 全 run |

## 生图风格（presets/genimg-styles.md + gen/style-pick.mjs 场景自动选）
social-im→anime/illustration；travel-life→anime/photographic；work-collab→flat-corporate；ecommerce→photographic；game-tech→cyberpunk；culture→guofeng。全部带 SAFETY 后缀；cover/scene 默认 no-people。

## 应用图标（gen/appicon.mjs）
cloned（capture 裁原图标）优先，回落 generated（品牌匹配 --prompt）；产物 `prototype/appicon/` 多尺寸+maskable+`icon-spec.json`（用户改 spec → `--regen`）。展示清单 `knowledge/showcase.json` 供原型展示网站消费。
