# 坑位索引（M18，LESSONS 64–94 分类沉淀）

每条：现象 → 根因 → 修复位置。新坑先记 LESSONS 再回填本表。

## Android 捕获
- screencap stdout 被 "Multiple displays" 污染 → 多屏设备必须 `screencap -p -d <长id>` → `android/capture.sh`（缓存 SurfaceFlinger id）
- 固定 sleep 截到骨架/转圈 → 无稳定检测 → `android/settle.mjs`（连拍差值稳定才落盘）+ completeness §8
- 中文 `input text` 丢字 → adb 不支持非 ASCII → Midscene ai-input / 人工兜底（action-protocol）
- 三指/捏合无法模拟 → input 无多点触控 → 协议如实标不支持（completeness §8）
- 长按 = 同坐标 swipe ≥800ms；下拉 = 顶 20%→80% swipe → `android/gesture.sh`

## 桌面捕获与点击
- `System Events click at` 发给坐标处最顶层窗（跨进程），挡窗即点错 → Z-order 不由 frontmost 决定 → CGEvent 真实 HID（`desktop/clickcg.py`）+ 挡窗临时移走（LESSONS 89/90）
- Electron 自绘内容 a11y 空（4 个无名元素）→ 元素点击不可行 → CGEvent 坐标+clickv 闭环；`--force-renderer-accessibility` 需用户批准重启（ios-desktop §Electron）
- Electron accessory 应用 activate 不 raise 主窗 → 窗被埋 → `screencapture -l <wid>`（`desktop/windowid.sh`）捕获；操作走 clickv（LESSONS 88）
- Retina：screencapture 物理像素 vs click 逻辑点 → 坐标=预览×(物理/预览)/2（LESSONS 87）
- 复用旧截图坐标 → 窗口布局变即 miss → 决策树强制 fresh shot（action-protocol §桌面）

## 图像与上下文
- 直接 Read 原图触发宿主上下文压缩 → 读前必 `img/view.mjs`（≤1000/q82），多图 `--grid`，结论文字化（LESSONS 86）
- contrast 检查 lum() 只认 rgb() → oklab/半透明/渐变背景误判 → canvas 归一+alpha 合成+渐变跳过（inspect.mjs contrast）

## 壳与视觉
- 全局 `svg{stroke/fill}` 覆盖表现属性 → 填充图标 inline style（LESSONS 70/77/79）
- inline span 进 flex 底栏基线错位 → `display:contents`（LESSONS 80）
- innerHTML 重建 iframe 闪白 → load 淡入+chip no-op（LESSONS 81）
- body 模式类与组件类同名 → 模式类加后缀（LESSONS 67）

##  fidelity 与完整性
- **pixel 档当交付主体 = 截图集被打回** → 交付必须 live；inspect `live-views` 硬检查、eval `live_ratio=1`；组件库 `templates/components/`（LESSONS 94）
- 完整性只数视图数 → 加 ia_coverage + live_ratio + 源场景覆盖（link-video 特例）（eval.mjs）
- 叠窗误判列表内容（微信群行当飞书列表）→ 多窗环境每步 fresh shot（LESSONS 91）

## 隐私与红线
- 群成员/昵称/ID 进原型 → 四防线：capture 仅本机 / mask.mjs+privacy-rects / 文本虚构+privacy-scan / handoff 声明（safety-rules §10）
- 支付确认/凭证/敏感权限 → 红线不变（safety-rules §1-3）

##  shell/serve/脚本
- serve 根是 run 根（/prototype/ 入口）；可选 json 404 触发 console error → serve.mjs OPTIONAL_DEFAULTS（LESSONS 83）
- tokens.css 缺失 → requestfailed 零容忍 → 新 run 必产 tokens.css（LESSONS 83 族）
- zsh 不 word-splitting → 循环参数用 bash -c 或脚本文件（LESSONS 82/84）
- macOS 无 GNU timeout；后台长跑 nohup 脚本文件+三向重定向（LESSONS 84）
