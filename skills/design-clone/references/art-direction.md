# art-direction.md —— 原型视觉质感红线（M76-W3a）

> 目标：稀薄提示词生成的原型也要达到"可发布给真实用户"的水准——对标原神/星穹铁道级
> 角色渲染质感 + 一线应用（微信/抖音/小红书/原神/Notion/Stripe/淘宝）的界面秩序。
> 本文件是生成与自检的共同 rubric；`enrich.mjs` 的 `art_direction` 字段是它的机器可读版。

## 1. 依赖清单（回答"skill 还依赖哪些"）
| 能力 | 选型 | 说明 |
| --- | --- | --- |
| 生图 | 现有 `genimg.mjs`（flux 免费档）+ 新锚点 `anime-cel` | 角色/背景/层资产；节流+缓存不变 |
| 3D | **2.5D 分层视差假 3D**（CSS transform + pointer/scroll 驱动） | 不引 three.js：无模型来源、包体大、离线门禁 |
| 粒子 | 模板内置 `fx/particles.js`（~2KB canvas） | motes/petals/sparkles 三型，主题感知，reduced-motion 关 |
| 动效 | CSS keyframes + rAF（模板无 gsap/无 CDN） | idle 呼吸、浮动、视差、页面过渡 |
| 生视频 | genvideo.mjs provider 路由（Seedance/可灵/万相/MiniMax）或 agent-native 履约；无 key  exit 3 写 media-request.json | M99-2 起允许 hero/idle 视频层（ADR-M99-video：poster+reduced-motion+≤2MB+同层活控件），见 references/media-engine.md |

## 2. 深度分层（硬要求 ≥3 层）
1. **far**：大气远景（genimg anime-cel 背景带：天空/海面/星野/林冠），`scale(1.06)` 慢视差；
2. **mid**：光云/体积光/漂浮物（第二张 genimg 或 CSS 光斑），视差 ±8px；
3. **near**：角色/主体渲染（rim light + 发丝高光），idle 呼吸+浮动；
4. **ui**：玻璃 HUD 卡（`backdrop-filter: blur(14px)` + 内发光 1px + 软影），承载信息。
视图 HTML 必须出现 `data-fx-parallax` ≥2 处与 `data-fx="particles"` ≥1 处（inspect 门 `art-depth` 查）。

## 3. 色彩与光
- 高饱和但柔调：主色 1 + 辅 2 + 光色 1；禁灰底、禁纯白底、禁塑料对称（gen-loop 自检既有）；
- 每屏一个主光源方向；角色层带轮廓光（genimg 锚点内置）；暗主题=夜海/星野带，亮主题=昼海/林光带；
- 文字对比 ≥4.5:1（既有 typography 门不变）。

## 4. 动效红线
- idle：呼吸 scale 1.00–1.015 / 4s；浮动 translateY ±3px / 5–7s 错位相位；
- 交互：tap 涟漪 180ms、卡按压 scale .97、页面过渡 fade+slide 240ms；
- 全部 `prefers-reduced-motion` 降级（门既有）。

## 5. 借鉴名单（界面秩序，非素材）
- 信息秩序：微信（列表密度/绿头）、抖音（沉浸式_feed+顶 tab）、小红书（双列瀑布卡）；
- 角色与世界观：原神/星穹（cel 渲染+rim light+粒子氛围）、明日方舟（版式张力）；
- 工具质感：Notion/Linear/Stripe（留白与层级）、淘宝/京东（促销节奏与卡群）。
借鉴=布局节奏/密度/层级，**不抄素材不抄商标**（IP 门既有）。

## 6. 自检 rubric（critique 增维，1-5 分，<3 必改词重生 ≤3 轮）
1. depth：≥3 层且视差可感；2. character：渲染质感非 clipart/非塑料；
3. atmosphere：粒子+光存在且克制；4. ui-craft：玻璃卡/圆角/阴影体系一致；
5. motion：idle+交互动效齐全且降级正确。
