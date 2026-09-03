# 截图质量门禁（M14b：地基不干净，生成必然差）

截图是整条链的地基：帧不干净 → VLM 分析错 → bbox 裁糊 → 生成必然差。
**先体检地基，再谈审美。**

## 采集时（capture/link/真机补拍）

1. **分辨率**：viewport ≥ 目标逻辑宽，deviceScaleFactor ≥ 2（retina），文本锐利可裁。
2. **等待**：networkidle + 所有 `<img>` complete + 额外 ≥800ms；骨架屏/懒加载未落地不拍。
3. **弹窗协议**：系统权限/营销弹窗默认dismiss；仅当该弹窗是分析目标时保留。
4. **长页**：滚动拼接需带 ≥15% overlap；或 fullPage 截图（避免半屏状态）。
5. **动效中不拍**：转场/下拉刷新/键盘弹起过程中的帧一律弃。
6. 真机（adb/simctl）补拍前先 `prepare.sh` 清通知栏、回桌面焦点、固定亮度。

## 采集后（必跑体检）

```bash
node dedup.mjs <capture目录> --sub frames
```

每帧给出 `stddev`（<6=空白/纯色）、均值（<12=黑屏）、Laplacian 方差（<8=模糊）。
**blank/black/blurry 帧禁止**：
- 写入 `knowledge/source-map.json`（对照/审查的右半）
- 作为 `extract-assets.mjs` 的裁剪源

## 裁剪时

`extract-assets.mjs` 每次裁剪自动报 sharp 值；低于阈值即警告 → 换帧或收紧 bbox，
**不许拿糊素材进视图**（糊素材比占位更破坏质感）。

## 生成后

见 `critique-loop.md`：shotdiff 拼图 + 宿主 VLM 按清单打分，最多 2 轮修正。

## 上下文预算（M16，强制）

直接 Read 原图（1080×2400+、多 MB）会频繁触发宿主上下文压缩，丢前文。纪律：

1. **读图前先压**：任何截图/帧/QA 取证图，先 `node scripts/img/view.mjs <图> --max 1000`，只 Read 预览；
   bbox 用打印的 factor 映射回原图像素。
2. **多图合一张**：≥2 张用 `--grid`（2 列联系表、长边≤1200、q75），只 Read 一次。
3. **结论即文字**：读完立即把布局/bbox/色值写成文字记录，不复读原图。
4. **取证分辨率**：inspect/warn-dump viewport 1280×800（截图像素减半）。
5. 数值检查（inspect/eval/warn-dump JSON）优先于读图；读图只用于最终视觉抽审。
