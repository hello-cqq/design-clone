# VLM 语义 pass 提示配方（M28 神经符号 Stage 2）

模型不测量像素，只做语义。喂四样：[干净图 + SoM 覆盖图(annotate.mjs) + tree/spec JSON(剪枝) + meta(mjs)]，输出 `semantic-spec.json`：

```
对每个 SoM 编号节点给出：
- component: 归类（nav/tabbar/row/card/button/input/avatar/icon/overlay/hero/footer…）
- group: 所属分区（header/list/sidebar/main/modal…）
- style: 品牌判断（主色/圆角/字重感觉，引用 meta/DESIGN.md 真值）
- anon: 需匿名的个人文本→虚构替换 map
- motion: 交互/动效注（hover/按压/过渡/吸顶）
- unexplained: tree 解释不了的自绘区域清单（走像素特判/genimg）
```

纪律：
1. 几何/色彩/图标**不**由模型输出——来自 spec bounds + 像素采样 + bbox 真裁（spec2view.mjs）。
2. 模型只裁决歧义（无文本图标、自绘 view）、分组、匿名、动效。
3. 输出必须是 JSON，供 spec2view 消费；不可输出整页 HTML。
4. GUI 专用模型可选增强；通用模型按本配方亦稳（测量在工具侧）。
