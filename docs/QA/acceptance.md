# 产品验收单（活文档）

> M114 起合并各里程碑验收单为单一活文档：每里程碑一节，后续验收追加新节。历史原件见 git（M104/M110 等）。
> 纪律：判据一律通用不变量（quality-standard.md 六法），不含 app/页面字面。

## M104 产品验收清单（用户 16 图 → 通用判据）

> 纪律：判据一律**通用不变量**（quality-standard.md 六法），不含 app/页面字面；16 图仅作证据索引。
> 证据命令统一：`node skills/design-clone/scripts/regress.mjs --run-dir <run>` + `node skills/design-clone/scripts/qa/<gate>.mjs <run>`；站点目视双主题截图存档 /tmp/m104-*.png。

| # | 用户图 | 诉求 | 通用判据（入 quality-standard） | 门/机制 | 状态 |
|---|---|---|---|---|---|
| 1 | 三幕卡片带 | 删除 | 官网装饰组件增删须整链路清（html/css/i18n/引用） | grep 零残留 | ✅ W0 |
| 2 | 首页"只加头像" | 全站新海诚连续叙事 | 站点=全屏段+页间过渡+滚动 reveal+素描点缀（点缀元素法） | 目视双主题+VT/reveal 代码在 | ✅ W5 |
| 3 | 头部硬线 | 无边界 | 站点 0 条 1px 硬分隔线（border 退场清单） | site.css 覆盖块 | ✅ W5 |
| 4-8 | 星海五页 | 排版干净/单表现/动态/输入栏在底/设置可读 | 布局法（空带≤12%、高度链禁单、选择器真匹配）+表现单一法+动效法 | inspect empty-band/layout-sanity/unstyled-祖先/motion-min | ✅ W2 |
| 9-12,15 | 动物乐园页 | 满铺/不叠压/不粗糙/有动效 | 布局法+bg-cover（动画禁改 background-size）+风格锚唯一法 | inspect bg-cover/empty-band + style-anchor | ✅ W3 |
| 13 | 树/路径乱连+标注深粗 | 流=真接线；标注浅细 | 流真值法（声明边⊆data-goto∪capture；不可达=fail）+svg-text stroke=0 | qa/flow-truth + ui-smoke wire-label-lite(stroke) | ✅ W1/W4 |
| 14 | 页脚丑 | 地平线极简 | 点缀元素法（页脚=地平线渐变+小字） | 目视 | ✅ W5 |
| 16 | 封面不契合 | 封面=产品锚+真截图 | 封面法（brief.cover.prompt 强制；hero 必真截图；品牌=icon 主色取样） | cover.mjs 锚拒合成 + publish cover-meta 前置 + style-anchor | ✅ W6 |

## 活门证明矩阵（W7b）
| 门 | 证明方式 | 证据 |
|---|---|---|
| flow-truth | 变异（paths 注入凭空边）→红 | mutation-test: gate-red |
| style-anchor | 变异（manifest 注入 photoreal 错锚资产）→红 | mutation-test: gate-red |
| motion-min | 变异（drill 副本剥光 video/animation/fx）→红 view0-4 | /tmp/mut-mm qa/inspect.json |
| empty-band | 变异（40% 纯色 void 层）→红；有机：chat 413px 空带 52% | 同上 + W2 前 inspect |
| bg-cover | 有机：kb 改 background-size →红（W2 前 assistant） | W2 inspect 记录 |
| unstyled-祖先 | 有机：03-call `.xh` 前缀死 CSS →红 view3 3/15（W2 前） | W2 inspect 记录 |

## 新场景演练（W7b）
- **模糊概念**（"治愈系宠物陪伴 app"一句）：director→brief（anchor=shinkai-2.5d, flows=1 入口边）→brief-tokens/products/views→paths-gen（20 边全 DOM 真值, phantom=0）→gates：**empty-band 红 66%×5 页**=门在发布前拦下稀薄基线（标准体系设计内行为：基线视图必须走艺术深化路径）。run=design-clone-runs/drill-paw（不发布）。
- **网页链接**（HN）：clone.mjs 捕获 0 屏（反爬 drained）=管线如实报告覆盖不足而非硬凑产物；coverage.json 留证。run=drill-hn（不发布）。教训入 LESSONS：链接演练需选可抓目标或降级声明。

## 测试验收（机器）
- 门矩阵：regress（interact/inspect[empty-band·bg-cover·motion-min·unstyled-祖先·layout-sanity]/ui-smoke[stroke 锁]/flow-truth/style-anchor）+ e2e + brand-qa + media-verify + no-run-specialcase。
- 活门证明（W7b）：变异测试矩阵（注入五类故障断言门红）+ 双新场景演练（模糊概念/网页链接端到端）。

## 产品验收（人）
- 每 run：启动→主链路→返回闭环目视一遍；封面/图标与产品风格锚对照；双主题站点五页滚动一遍（过渡/reveal/素描/地平线）。
- 验收截图存 /tmp/m104-accept/（发布前刷新）。


## M105 增补验收（用户图 1-3 + 站点诉求）
| 用户图 | 诉求 | 通用判据 | 门/证据 |
|---|---|---|---|
| 暗色双矩形 | 接缝非刻意 | 叠加层无直角板边（blur 配滚动态/形状语义化） | 双主题目视 /tmp/m105-*-hero*.png |
| 列表高亮≠舞台 | 三元一致 | 舞台 id ≡ 列表 .on ≡ 详情头 | ui-smoke nav-state-sync |
| 聊天顶栏/空区 | 无边界+无大空带 | 顶栏羽化无板；消息不足顶部起排 | 目视 + empty-band 门 |
| 站点素描风 | 淡雅隐藏氛围+大段+无边界切换 | 单页五段 100svh；素描层 ≤16% 透明；导航融合（星点轨+cue）；e2e 全绿 | site e2e pass:true |

## M110 终版回归验收单（2026-09-18，含 M111/M112 增补）

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
| 4810 | SOFTER · 情绪记录（新·小红书） | http://localhost:4810/prototype/ |

## 8. M111 增补（链接原型做深做细）
- 帧库存：ju/paimomo 各 12 帧全过 → screen-inventory.md；screen-coverage 门全绿（ju 9 屏/paimomo 5 屏）。
- 角色资产化：6 宠物（westie/siamese/blackdog/poodle/ragdoll/graycat）+猫 logo+卡通头像，全部帧裁切零付费；paimomo 首页宠物切换覆盖全部角色（含用户点名的黑狗/褐猫）。
- 视图扩写：ju 2→9 屏、paimomo 2→5 屏；逐屏并排 critique ≥8。
- 门禁：paimomo PASS（50/0）；ju 49/1（仅登记在案的 Chromium scrollWidth 幻影）。
- 存量影响：regress 子集（demo-assistant/wechat-full）ALL GREEN。
- softer-xhs：headed 浏览器已起，待用户扫码一次（profile 持久化后免登），捕获自动续跑。

## 9. M112 增补（收尾清债波）
- softer-xhs 续跑成功：xhs.mjs 修因（共享 profile）+ 短链 404 后经登录态搜索定位 note；10 原图 → 六屏原型（today/checkin/journal/practice/breathe/reflect）。门禁：inspect 48/0、ui-smoke 28/0、screen-coverage 6/6、paths-qa/asset-qa 6/6/privacy/ip-scan 过；外推登记见 demo/softer-xhs/knowledge/DESIGN.md（情绪脸文案×4、End session 幽灵链、周历空日 toast 改静默）。
- 官网：首页萌萌 74svh→64svh、不透明度 .92/.96→.74/.80、object-position 60%（让位背景视频女主，双主题目检过）；其余章节角色不动。
- paimomo 资产净化：六宠源帧紧裁 → seedream-4.5 交互编辑（保角色/换纯白底/去 UI 杂质）→ 纯白底几何无缝贴白卡与白圆头像（免抠透明）；健康卡背景 #fbf8f4→#ffffff（源帧实测）；头像芯片补 overflow+圆角。门禁复跑 50/0、asset-qa 7/7、screen-coverage 5/5。
- 新工具：scripts/img/matte.mjs（flood 边缘泛洪 / global 全局色键 双模 + 羽化）；适用色距足够背景，白毛白底类走几何无缝路（LESSONS 232）。
- 仓卫生：report/ 账本四件迁 docs/QA/（parity-debt/agent-e2e/site-perf/visual-debt），活引用五处同步（inspect.mjs 注释/GATES/HANDOFF×2/ROADMAP）；report/ 归纯转储区（gitignore 既有）+ tracked 转储 untrack；双仓 secret-scan 过；ip-scan 设计范围=skill 仓（过），proto 仓二进制即产品不适用；site e2e 全绿（NODE_PATH 指 scripts/node_modules 跑）。
- LESSONS #230–233。
