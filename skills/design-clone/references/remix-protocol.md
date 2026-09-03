# Remix 协议（在复刻原型上按用户想法改造）

原则：**规格先行、最小层修改、改完必验、沉淀回设计系统**。禁止收到改动需求就整站重新生成。

## 1. 意图分类

把用户需求（可含参考图/参考链接/"像某某风格"）拆解为最小编辑，每步先声明落在哪一层：

| 层 | 触发词示例 | 修改对象 | 重生成范围 |
|---|---|---|---|
| token 级 | 换主色/换字体/圆角大一点/间距松一点 | `knowledge/tokens.css` + `tokens.json` | 全部视图（变量生效即可，无需改代码） |
| 风格级 | 改暗黑风/日系杂志感/像 Linear 那种 | 换风格预设或提取参考图 tokens → 覆盖 tokens.css；必要时更新 `DESIGN.md` tone | 全部视图 + 检查组件适配 |
| 组件级 | 把按钮改成胶囊/加个搜索栏/去掉轮播 | 对应 `pages/*.spec.yaml` 的 regions/components | 仅受影响页面 |
| 布局级 | 列表改双列卡片/导航放侧边 | spec 的 regions/layout/shell | 仅受影响页面 |
| 动效级 | 卡片弹性入场/页面转场改成淡入 | `prototype/motion.js` 或 spec `flows[].transition` | 仅动效代码 |

一次需求可能跨层（"暗黑风+卡片动效"）：拆成两步按序执行，每步单独验证。

## 2. 风格级改法

**有参考物**（用户给了图片/链接/品牌名）：
1. 品牌名 → 查本机 `~/.config/opencode/skills/awesome-design-md/design-md/<品牌>/DESIGN.md`
   （74 个品牌；没有则取最接近的并告知用户），或 `presets/` 内的预设
2. 图片/链接 → 用 `scripts/tokens.mjs`（图片）或 Web 捕获（链接首页截图）提取 tokens
3. 生成新 tokens.css（保留原变量名结构，只换值），更新 `DESIGN.md` 的 tone 一节

**无参考物**（"高级感一点"）：**绝不文字盲选**（借鉴 huashu）——三套逻辑各出一版**真实视觉**并排给用户看着选：
① 惯性打破：从风格预设库随机取一档（大胆/中性/安静分级）② 现实参照：awesome-design-md/open-design 里气质最接近的获奖级品牌 ③ 最佳设计师：按主题匹配工作室哲学（如极简=原研哉「白」）。
三版用并排变体画布或三个原型文件呈现，用户点选后进入主干流程。

## 3. 修改流程

1. 读当前规格（`pages/*.spec.yaml` + tokens.css + DESIGN.md）
2. 改规格文件；在被修改文件的 `meta.change_log` 追加：
   `{ at: <ISO时间>, by: "remix", note: "<用户需求原文摘要> → <改了哪些字段>" }`
3. 重新生成受影响视图；**规格里未涉及的页面一个字符都不动**
4. 验证（见下）；失败则回滚规格与视图到改前状态（依赖 git 或备份副本），报告原因

## 4. 三重验证

每轮修改完成后必须逐项检查（前两项对照 `report/` 里改造前的渲染截图）：

1. **意图符合**：用户要的变化是否真实发生（主色真的换了/动效真的加了）
2. **结构守恒**：未声明修改的区域布局不变（区域数/顺序/层级对照改前截图）
3. **Anti-Slop**（避免落入 AI 默认审美）——命中任一项即返工：
   - 正文用了 Inter/Roboto/Arial/system-ui 且原设计并非如此
   - 无来由的紫蓝渐变（#6366F1 系）、霓虹深色侧栏
   - 原设计没有的装饰被加上（多余卡片套卡片、发光描边、emoji 点缀）
   - 改动后页面变成"换任何需求都长这样"的模板脸
   - 细则增补（huashu）：紫渐变/emoji 当图标/圆角+左 border accent 卡/Inter 或 system-ui 做 display 字体/SVG 画人脸；正文未用 `text-wrap: pretty`；色彩未优先考虑 oklch 感知空间

## 5.3 三变体并排与落回（工具链）

0. 先跑 `review.mjs` 拿 `var_tokens`（视图实际用到的全部 var()），变体映射必须覆盖其中所有颜色/圆角 token，避免局部露馅
1. 写 `prototype/variants.json`：`{ "<名字>": { "--color-primary": "...", ..., "_why": "一句话理由" } }` ×3
   （大胆/中性/安静分级；来源=预设库/风格简报/随机惯性打破）
2. 复制 `templates/prototype/variants.html` 进 prototype/；serve 后打开它——三 iframe 并排真实渲染
3. 用户点选 → 把名字告诉 agent → `node {SKILL_DIR}/scripts/apply-patch.mjs <run> <(从 variants.json 抽出的 tokens-patch)>`
   落回 `knowledge/tokens.css`（:root 覆盖块，旧块自动替换）+ spec change_log 追加 remix 记录
4. 编辑模式拖拽导出的 `layout-patch.json` 同命令落回 → `prototype/layout-overrides.json`（inspector 打开即生效）

## 5.5 五维度评审（交付前必跑，借鉴 huashu）

哲学一致性 / 视觉层级 / 细节执行 / 功能性 / 创新性，各 0-10 分；
输出 **Keep / Fix / Quick Wins** 三清单：Fix 项当轮修掉，Quick Wins 列出低成本高回报项供用户勾选。
评审对照物 = 克隆源证据（DESIGN.md 的理念），不是抽象品味。

工具：`node {SKILL_DIR}/scripts/review.mjs <run>` → report/review-*.png 逐屏截屏 +
tokens 对比度(WCAG) + anti-slop grep 命中 → agent 读图打分写 report/notes.md。

## 5. 动效词汇表（motion.js，GSAP CDN）

```js
// 页面转场：push / fade / none（默认见 spec flows[].transition）
// 卡片弹性入场
gsap.from(".card", { y: 24, opacity: 0, duration: .45, stagger: .06, ease: "back.out(1.4)" });
// 按钮点按反馈
gsap.fromTo(btn, { scale: 1 }, { scale: .96, duration: .08, yoyo: true, repeat: 1 });
// 列表骨架渐显、数字滚动、抽屉滑出……一律 GSAP timeline，集中写在 motion.js
```

约束：动效时长 ≤ 600ms；尊重 `prefers-reduced-motion`（媒体查询内禁用）；
不动效掩盖交互反馈（点击必须有即时视觉响应）。

## 6. 沉淀

每轮验证通过后：
- `DESIGN.md` 增补"迭代记录"小节（改了什么、为什么）
- 若用户的偏好具有一般性（如"这个用户偏爱衬线体+墨绿"），写入
  `knowledge/tokens.json` 的 `user_preferences` 字段，下次生成自动继承
