# 审美纠正闭环（M14b：生成后必审，最多 2 轮）

截图质量决定下限，审美审查决定上限。每个 view 交付前走一遍：

## 第 1 步：取证

```bash
node scripts/shotdiff.mjs <runDir>          # 全部视图
node scripts/shotdiff.mjs <runDir> 01-home  # 单视图
```

产出 `<run>/qa/shotdiff-<view>.png`（左=生成 2x，右=源帧同宽并排）。
人工审查直接用 inspector 的「对照」按钮（同一视觉基线，且同步滚动）。

## 第 2 步：宿主 VLM 读拼图，按六维打分（各 0/1/2，<2 必修）

1. **结构**：区块顺序/数量/层级与源帧一致？多余或缺失的卡片？
2. **色彩**：主色/背景/卡片色取自 tokens-sample 而非目测？accent ≤ 2？
3. **图标**：状态栏填充式三件？UI 图标 lucide 风 1.8 stroke？有无 emoji 混入？
4. **图片**：素材来自源帧真裁剪且清晰（sharp≥阈值）？比例锁定无拉伸？
5. **排版**：字号阶梯（13/15/20/26）？数字等宽？行距/留白节奏？
6. **质感**（anti-fake-device）
7. **图标与布局对位**：图标为真资产裁剪/品牌复刻？页面块结构（tabs/月历/时间格/now线/选中pill）逐一对位源？：anti-fake-device 清单全过？无 AI 味（indigo/紫蓝渐变/圆角左条卡/占位文案）？

## 第 3 步：修正与复审

- 把 <2 分项转成具体修改（改 HTML/CSS/重裁素材），**一次修完**再复审
- 复审仍 <2 → 该视图降级为 live-low 并在 products.json 标注推断点，不硬磨
- 结论追加到 `<run>/qa/critique.log`：`<view> round<n> <六维分> <修改清单>`

## 纪律

- 审查标准只认清单，不认「看起来还行」
- 源帧本身模糊时右半失真 → 先回 capture-quality.md 换帧，别对着糊帧修生成
