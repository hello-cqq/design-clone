# 核心原则：照猫画猫（M41，app-agnostic）
生成=对该 capture **逐元素誊写**，**照猫画猫**（看到什么誊什么），**禁止**：
- 用通用组件**近似** capture（照猫画虎）；
- 在 prompt/skill 里 baked **任何 app 的视觉约定**（如"微信 outgoing 带右头像"）——其他聊天 app 约定不同，套用微信=错。
**誊写前强制逐 capture 盘点**（帮宿主模型 attending 每元素，弱模型补偿）：
对每行/每格/每消息列清单——头像有/无/左/右/形状、图标形状+色、行结构、开关态、名字单/多行——再照清单誊写。
**誊写前再盘点"控件类型"**（M44，app 无关）：这页有哪些可交互控件？逐项归类——
导航(行/卡/头像/tab/面包屑/返回)、选择(单选 radio/多选 checkbox/下拉 select/Picker)、
设置(开关 toggle/stepper ±/slider)、输入(文本框/搜索框)、动作(按钮/icon 钮/FAB)、
反馈(弹层 sheet/dialog/toast/折叠 accordion)。**微信只是子集，别假设别的 app 也只有开关。**
**每个控件誊写时同时接线**（杜绝"像放了张图片"）：导航 `data-goto="<目标视图>"`；
其余 `data-act="toggle|radio|checkbox|select|accordion|tab|sheet|dialog|toast|step|slider|input|back"`
（运行时见 `templates/prototype/runtime.js`，属性如 data-group/data-tab/data-items/data-target/data-msg/data-title）。
无对应目标页的行/按钮一律 `data-act="toast"` 或 `sheet` 兜底，**不留死按钮**。
**自渲染目检**增两问："capture 有的元素，渲染是否逐一存在且形状/位置一致？"（抓"画虎"）；
"每个控件点了有没有可观测反应（翻转/选中/展开/弹层/提示/跳转）？"（抓"静态图"，跑 `qa/interact.mjs` 验）。
s2c 同机制：高清晰截图(detail:high)喂视觉模型+extract_assets 真裁+screenshot_preview 自渲染循环；无 app 约定。

# s2c 效果 = 宿主 agent 当生成器（M38，零 key，跨 agent）

screenshot-to-code 的魔法=**视觉模型+SYSTEM_PROMPT+自渲染循环**，key 只是拿模型的通道。
每个 agent（opencode/claudecode/codex）自己就配了视觉模型 → **不需要 s2c 的 key**：把 prompt+循环移植进 skill，宿主 agent 用自己的模型当生成器，即 s2c 效果。（prompt 原文 MIT，曾 vendor 于 references/_s2c_system_prompt.py，现归纳如下。）

## 生成协议（每视图）
1. 读高清 capture（view.mjs --max 1400）。
2. 按 s2c prompt 逐像素誊写**单文件保真 HTML**：复刻布局/色彩/间距/图标/文本；图标用内联 SVG 或真裁；不拉伸低清图。
3. 翻译/包成 view（组件类 mi-row/mi-cell 或单文件 iframe），**wire data-goto（导航）+ data-act（其余全控件交互，见 runtime.js 目录）**，个人文本匿名。
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
2. 每页：读高清 capture→按 s2c prompt 誊写 HTML（同时接线 data-goto/data-act）→viewshot 并排→
   fidelity≤0.15 且 truncated=0 且 **interact 死控件=0（每控件点击有反应）**？
   否→自己 edit→重渲；是→下一页。单页上限 3 轮防死循环。
3. 全页 bad=[]（audit/interact/inspect/eval 四门）后一次性交付用户验收。
禁止把"修一版等用户指问题"当流程——那是把自主循环外推给人工。

## 通用保真管线=唯一生成路径（M40，不再打地鼠）
逐页保真重生成是**唯一**生成路径，app 无关（输入=capture 目录）：
每视图=读高清 capture→宿主 VLM 逐像素誊写单文件 HTML→viewshot 并排→fidelity≤0.15 且结构对→否则自 edit→收敛；不达标不交付。
特定问题（头像/底部菜单/小程序/加载态）都是循环输出，**不写特判代码**。
微信 19 页验证后，同一循环套 slytherin/lark/workbuddy/web/link 泛化。
