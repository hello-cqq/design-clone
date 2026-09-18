# M110 终版回归验收单（2026-09-18）

目标对照（VISION）：普通用户用 skill 即可把真实应用/链接克隆为可交互原型，并能在其上再创作。本单为 M110 全量回归证据。

## 1. 存量原型回归（W3）
- 备份：`/Users/cqq/Project/design-clone/archive/proto-backup-M110/`（5 proto + index.json，107M）。
- `regress.mjs --runs demo-assistant,demo-petpark,wechat-full,mac-lark,web-aliyun`：**ALL GREEN**（dead=0/inspectFail=0/smokeFail=0/gateFail=0 ×5）。

## 2. 模拟用户五场景（W4，空间 demo/，不入库）
| 场景 | 输入 | 结果 | 备注 |
|---|---|---|---|
| coloros-web | https://www.coloros.com/version/coloros17/ | **PASS**（ux100/stab100） | web 全自动链路 |
| douyin-ju | v.douyin.com/jZdqp9nYTMs（每一迹） | FIX（1 已知问题） | no-h-overflow 幻影 62px，见 §5 |
| douyin-paimomo | v.douyin.com/8HCFcR_UGUU（Paimomo） | **PASS** | link 六级梯 L2 成功 |
| mac-appstore | 本机 App Store（desktop HID） | **PASS** | capture.sh shot/click/type 三屏 |
| softer-xhs | xhslink.cn/o/6YswIkYJJaw | **阻塞-待登录** | 全梯失败=登录墙；resume：`node scripts/link/web-sim.mjs <url> --out demo/softer-xhs/capture --platform xiaohongshu --headed` 登录一次后重跑接线 |

## 3. 技能缺口修复（修因，已入库）
- `sync-shell.mjs`：DC.pages 以 pages/*.spec.json 为单一真源重修（脚手架空注入不再沿用）。
- `desktop/capture.sh`：补 --help/-h/help。
- 文档级：paths-gen 以 capture graph 为节点源、parity-log.md 库存步骤、link 源 fidelity 需裁真机区域屏——已记 LESSONS。

## 4. 官网全维度（W5）
- e2e 全契约绿；双主题+390 竖屏截图过；i18n 缺键 gal_sort_new/az 补齐；内链无 404；飞鸟云带落于功能演示背后（M110-W0）。

## 5. 已知问题（诚实登记）
1. douyin-ju 01-assets：#dc-stage scrollWidth 幻影 +62px（no-h-overflow 硬门红）。排查记录：子元素全删/伪元素/overflow/contain/clip 均不复原源头，仅隐藏 #dc-stage 自身归零；疑 Chromium scrollWidth 边界 case。影响：仅该 demo 门禁 verdict；交互/视觉不受影响。
2. softer-xhs 登录墙：需人工 headed 登录一次（profile 持久化后免登）。

## 6. 过夜服务矩阵（W8，明早 check）
见收尾消息 URL 清单；服务为 nohup 静态 serve，机器不眠即存活。

## 7. 过夜 URL 清单（/prototype/ 为原型入口）
| 端口 | 原型 | URL |
|---|---|---|
| 4801 | 错位时空（ai-assistant） | http://localhost:4801/prototype/ |
| 4806 | 动物乐园（petpark） | http://localhost:4806/prototype/ |
| 4802 | 微信（wechat） | http://localhost:4802/prototype/ |
| 4204 | 飞书（lark） | http://localhost:4204/prototype/ |
| 4202 | 阿里云（aliyun-console） | http://localhost:4202/prototype/ |
| 4813 | ColorOS 17 官网（新） | http://localhost:4813/prototype/ |
| 4811 | 每一迹 · 资产记录（新·抖音） | http://localhost:4811/prototype/ |
| 4812 | Paimomo · 宠物陪护（新·抖音） | http://localhost:4812/prototype/ |
| 4814 | Mac App Store（新·桌面） | http://localhost:4814/prototype/ |
| 4211 | 官网 | http://localhost:4211/ |
| — | softer-xhs | 待 headed 登录续跑（§2） |
