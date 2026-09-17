# M104 产品验收清单（用户 16 图 → 通用判据）

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
