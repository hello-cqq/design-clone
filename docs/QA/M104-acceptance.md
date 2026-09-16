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

## 测试验收（机器）
- 门矩阵：regress（interact/inspect[empty-band·bg-cover·motion-min·unstyled-祖先·layout-sanity]/ui-smoke[stroke 锁]/flow-truth/style-anchor）+ e2e + brand-qa + media-verify + no-run-specialcase。
- 活门证明（W7b）：变异测试矩阵（注入五类故障断言门红）+ 双新场景演练（模糊概念/网页链接端到端）。

## 产品验收（人）
- 每 run：启动→主链路→返回闭环目视一遍；封面/图标与产品风格锚对照；双主题站点五页滚动一遍（过渡/reveal/素描/地平线）。
- 验收截图存 /tmp/m104-accept/（发布前刷新）。
