# 风格预设（presets）

Remix 模式"风格级"修改的素材库。按优先级：

1. **本机 awesome-design-md**（若已安装）：
   `~/.config/opencode/skills/awesome-design-md/design-md/<品牌>/DESIGN.md`
   74 个真实品牌（apple / stripe / linear.app / notion / vercel / tesla / nike / spotify …）。
   用户说"像某某风格"时先查这里；读取后提取其 tokens 覆盖到 `knowledge/tokens.css`。
2. **本机 open-design 设计系统**（若已安装/克隆）：`design-systems/<包名>/`
   三件套 `manifest.json + DESIGN.md + tokens.css`（Apache-2.0），tokens.css 可直接引用。
3. **用户参考物**：图片 → `scripts/tokens.mjs` 提取；链接 → Web 捕获首页截图后提取。
4. **无参考的模糊需求**（"高级感"）：给 2-3 个方向让用户选，不擅自发挥。

## 覆盖规则

- 只换 `tokens.css` 的值，保持变量名结构不变（原型代码零改动即生效）
- 覆盖前备份原 tokens 为 `tokens.backup.css`（Remix 回滚用）
- 在 `DESIGN.md` 记录风格来源与覆盖时间
- 覆盖后走 Remix 三重验证（尤其 anti-slop：原布局不得被风格改动破坏）
