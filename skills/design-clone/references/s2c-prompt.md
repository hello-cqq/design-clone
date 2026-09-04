# s2c 效果 = 宿主 agent 当生成器（M38，零 key，跨 agent）

screenshot-to-code 的魔法=**视觉模型+SYSTEM_PROMPT+自渲染循环**，key 只是拿模型的通道。
每个 agent（opencode/claudecode/codex）自己就配了视觉模型 → **不需要 s2c 的 key**：把 prompt+循环移植进 skill，宿主 agent 用自己的模型当生成器，即 s2c 效果。（prompt 原文 MIT，曾 vendor 于 references/_s2c_system_prompt.py，现归纳如下。）

## 生成协议（每视图）
1. 读高清 capture（view.mjs --max 1400）。
2. 按 s2c prompt 逐像素誊写**单文件保真 HTML**：复刻布局/色彩/间距/图标/文本；图标用内联 SVG 或真裁；不拉伸低清图。
3. 翻译/包成 view（组件类 mi-row/mi-cell 或单文件 iframe），wire data-goto，个人文本匿名。
4. **自渲染循环**：viewshot 渲染→与源并排目检→不对就 edit 修→重渲，循环到像（=s2c 循环）。
5. 有 env key 时可选 `gen/s2c-adapter.mjs` 调外部视觉 API 加速（opt-in，不假设）。

## s2c SYSTEM_PROMPT 要点（归纳）
- 你是前端专家；单文件 HTML；用 create_file 一次写全、edit_file 定向改不整文件重生成。
- 每次 create/edit 后调 screenshot_preview 目检桌面+移动，发现破布局/叠/错距/错色即修。
- 图标用 extract_assets 紧裁真资产；不可裁才 generate_images；低清用 edit_images upscale 非 CSS 拉；透明用 remove_backgrounds。
- 栈：Tailwind CDN / 纯 HTML-CSS / React / Vue / Bootstrap / Ionic；Google Fonts；Font Awesome。

## 自主逐页达标循环（M39，用户一条命令、agent 内部修到达标）
s2c 演示"一次完美"=render→目检→修 循环在内部自动跑完。本 skill 同：用户只发"克隆 X"，
agent 对每页自动循环，**不向用户提问**，直到全过：
1. audit 输出 per-view fidelity 排序，从最差页开始。
2. 每页：读高清 capture→按 s2c prompt 誊写 HTML→viewshot 并排→fidelity≤0.15 且 truncated=0？
   否→自己 edit→重渲；是→下一页。单页上限 3 轮防死循环。
3. 全页 bad=[] 后一次性交付用户验收。
禁止把"修一版等用户指问题"当流程——那是把自主循环外推给人工。

## 通用保真管线=唯一生成路径（M40，不再打地鼠）
逐页保真重生成是**唯一**生成路径，app 无关（输入=capture 目录）：
每视图=读高清 capture→宿主 VLM 逐像素誊写单文件 HTML→viewshot 并排→fidelity≤0.15 且结构对→否则自 edit→收敛；不达标不交付。
特定问题（头像/底部菜单/小程序/加载态）都是循环输出，**不写特判代码**。
微信 19 页验证后，同一循环套 slytherin/lark/workbuddy/web/link 泛化。
