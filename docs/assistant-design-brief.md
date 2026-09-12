# 智能助理 demo 设计简报（M75-W3）

> 替换 petpark 成为官网 live proof / 精选 / README banner。主题=**智能助理**：
> 形象参考官网主题生图的**男生/女生**（site/assets/logo-boy.png、logo-girl.png 同源），
> 支持**切换形象、切换音色**，可**文字聊天、语音对话、视频通话**。

## 0. 风格线
与官网同源的"昼海/夜海"动漫质感 + 粘土糖果 UI：奶油底 `#FFF6E9`、可可墨 `#4A3B2E`、
薄荷 `#7EDCC3`（发送/成功）、丁香 `#C9B6F2`（AI 侧/音色）、天空 `#8ECDF0`（通话/信息）、蜜桃 `#FFB38A`（提醒/挂断）。
头像=既有生图资产（零新生成风险）；通话屏大头像加**呼吸光环**（薄荷/丁香交替脉冲）。

## 1. 视图规格（5 视图）
### 01-home 助理首页
- hero：当前形象大头像（圆环 4px cream + 光泽点 + 呼吸光环）+ 名称"小昼 / 小夜"（随形象切换）+ 状态胶囊"在线 · 语音就绪"。
- 能力四磁贴（饼干边+图标磁贴）：聊天 / 语音对话 / 视频通话 / 日程提醒（前三 goto，末 toast）。
- 今日摘要卡（粘土卡）：三条 bullet（日程/天气/待办）+ tabular 数字。
- 快捷输入条：圆角输入框 + 薄荷发送钮（act toast）。
### 02-chat 文字聊天
- 消息流：AI 侧=丁香气泡+小头像；用户侧=薄荷气泡右对齐；时间戳 mut 10px。
- 打字指示三点动画（CSS）；输入条+发送（act toast 追加模拟回复不行→toast 即可）。
- 顶部：形象小头像+名称+音色胶囊（点击 goto 04-persona）。
### 03-call 视频通话
- 全屏深色渐变（夜海 band）+ 中央大头像（呼吸光环+微浮沉）+ 对方名称+计时 tabular。
- 底部控制磁贴排：静音(toggle) / 切换摄像头(toggle) / 切换形象(goto 04) / 挂断(peach 圆钮, act toast)。
- 角落_self_ 小窗（用户侧=奶油磁贴+剪影 svg）。
- 波形条：12 根 CSS 动画柱（通话中），静音时静止（toggle 联动 class）。
### 04-persona 形象与音色
- 形象双磁贴（女生小昼/男生小夜）：选中=薄荷 rim+勾；切换 act radio。
- 音色四胶囊（清亮/温柔/沉稳/活泼）：radio；每胶囊带 3 根静态波形 glyph。
- 语速滑杆（slider act）+ 预览按钮（toast"用当前音色朗读示例"）。
### 05-me 我的
- 头像+昵称+会员胶囊；统计三数（对话/通话/提醒）tabular；
- 设置行：开场问候(toggle) / 通话自动接听(toggle) / 数据本地化(toggle on) / 帮助(toast)。

## 2. 交互契约
所有控件 data-act/data-goto 齐全（零死控件门）；形象/音色 radio 真切换 class；toggle 真翻转；
切换形象后 home/call 头像与名称联动=**不做跨视图状态**（各视图按选中态静态呈现两态之一，默认女），
radio 选中态在本视图内真实生效（门可验）。

## 3. 资产
- assets/assistant-girl.png = site/assets/logo-girl.png 复制；assistant-boy.png = logo-boy.png 复制（注明来源 asset-sources.json）。
- 无新生图；封面=cover.mjs 合成（hero 视图真截图+薄荷 palette+名称"智能助理"）。

## 4. 门与发布
interact dead=0 / inspect 全绿（含 gallery-ready、view-weight-budget）/ ui-smoke 28 项 / collect-design /
meta（official-names assistant 命中）/ cover 3:2 → publish app `ai-assistant` v1.0.0 →
官网 expselect 默认 + 精选首卡 + README banner 换 assistant cover。
