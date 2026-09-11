# 宠物乐园 · 3D 萌宠质感设计简报 / PetPark Design Brief (3D plush-cute)

> M62-E 视觉真源。重建/重生成 petpark 任何视图或资产时以本简报为准；
> products.json 的 page_prompt/element_prompts 已用本语言重写，保证未来重生成同风格。

## 0. 一句话风格 / Style line
皮克斯式蓬松 3D 萌宠站在粘土玩具乐园里——糖果材质、奶油光、软影微动，像一盒刚打开的盲盒场景。
Pixar-fluffy 3D pets standing in a clay-toy park: candy materials, cream light, soft shadows, idle micro-motion — like a freshly opened blind-box diorama.

## 1. 色板 / Palette（hex + 用法）
| token | hex | 用法 |
|---|---|---|
| cream 奶油底 | `#FFF6E9` | 页面/卡面/设备框 |
| cocoa 可可墨 | `#4A3B2E` | 正文/描边/接触影（**禁纯黑**） |
| mint 糖果薄荷 | `#7EDCC3` | 主 CTA/成功/草坪 |
| peach 蜜桃 | `#FFB38A` | 预约/热情/滑梯 |
| lilac 丁香 | `#C9B6F2` | 会员/魔法/猫爬架 |
| sky 天空 | `#8ECDF0` | 水/信息/戏水区 |
| honey 蜂蜜 | `#FFD66B` | 积分/高亮/轮廓光 |
| berry 草莓 | `#FF8FA3` | 点赞/爱心 |

渐变配方：主光 `linear 140deg rgba(255,255,255,.9) → transparent`；环境 `radial 120% at 50% -10%, #FFF6E9 → #FFE8D2`；水域 `linear 180deg #A5D8F2 → #8ECDF0`；会员卡 `linear 140deg #D9C8F7 → #C9B6F2 55% → #B79DED`。

## 2. 材质配方 / Materials（CSS 可复现）
- **粘土卡 clay card**：哑光底 `#FFFDF8` + `inset 0 2px 0 rgba(255,255,255,.85)` 顶高光 + `inset 0 -4px 0 rgba(74,59,46,.10)` 底托 + `0 12px 24px rgba(74,59,46,.14)` 落影 + feTurbulence 颗粒 `opacity .04`。
- **果冻 jelly**（胶囊/开关轨/仪表轨）：半透明底 `rgba(色,.35)` + 1px 内 rim `inset 0 0 0 1px rgba(255,255,255,.6)`；按压 squish `scale(.96)` 弹簧回弹。
- **光泽 gloss**：6px 白色 radial 高光点（::after，左上 18%）用于头像/按钮/图标磁贴。
- **草地 grass**：薄荷双层 radial（`#A9E3C4`→`#7EDCC3`）+ 噪点；**木纹 wood**：蜜桃渐变 + `repeating-linear-gradient` 细条纹。
- **饼干边 cookie edge**：按钮/卡底托 4px（`box-shadow 0 4px 0 rgba(74,59,46,.12)`）形成厚度。

## 3. 光照系统 / Lighting
主光左上 45° 暖白；右侧轮廓光 honey `.25`；**接触影**=椭圆 `rgba(74,59,46,.18)` blur 8、y+10（所有立物/宠物/磁贴必有）；禁硬黑投影、禁纯黑描边、禁灰底（灰=脏）。

## 4. 造型语言 / Shapes
squircle 卡 radius≥20、胶囊 999；图标 stroke 2.2 round cap 胖比例；宠物头身比 1:1.2 圆润；磁贴微旋转 ±2° 增加手作感；所有圆角统一族 {12,20,28,34,999}。

## 5. 宠物资产 / Pet renders
genimg `pixar-3d`：柯基/英短/垂耳兔各一，**坐姿全身**、奶油纯色底 `#FFF6E9`（无缝融入）、seed 精选、去水印。三态用法：
- **hero**：全身立基座（椭圆平台+接触影+背后 honey 光晕）；
- **avatar**：圆环 3px cream + 光泽点；
- **mini**：squircle 磁贴微旋转 ±2° + 饼干边。

## 6. 场景分层 / Scene layers（首页范式，其余视图降配复用）
1 天空渐变 + 三层云团（parallax drift 60s，远层 blur .5 + 降饱和）；
2 中景岛：草台 squircle + 树团 + 蜜桃滑梯 + 水洼反光（sky 渐变+白高光弧）；
3 前景宠物基座（平台+接触影）；
4 浮动 chips/磁贴（饼干边+光泽）。
层级纵深靠「影 + 饱和度 + blur」拉开，不靠灰雾。

## 7. 微动效 / Micro-motion（仅 transform/opacity，CSS）
宠物 idle 2.4s 呼吸浮沉 ±3px + squash 1.02；chips hover 抬升 2px / press squish .96 弹簧；tab pill 弹簧滑动；打卡 toast 盖**爪印戳**动画（scale 1.4→1 + rotate -8°）；赞=berry 填充跳一下；`prefers-reduced-motion` 全静止。

## 8. 字体 / Type
`ui-rounded, -apple-system, "PingFang SC", "Segoe UI", sans-serif`；H1 22/600 ls .01；正文 13/400 lh 1.7；数字 `tabular-nums`；中英成对=zh 主 + en 副（mut 11px）。字重 ≤600（预算门）。

## 9. 五视图场景规格 / Per-view specs
- **01-home**：§6 全分层场景；三饼干边快捷钮（预约 mint/遛伴 peach/打卡 lilac 图标磁贴）；通行证卡=可可磁贴二维码块+薄荷果冻进度；feed 预览磁贴。
- **02-pets**：宠物大卡微倾斜 -2°（hero 态 render+基座）；三环仪表=果冻轨+糖果针+tabular 数字；健康行磁贴（mint/peach/lilac 图标）；次要宠物 mini 磁贴 ×2。
- **03-map**：奶油底 SVG 园区：四色果冻分区（草坪 mint/戏水 sky/猫爬架 lilac/咖啡 peach）+白路网+pin 磁贴弹跳落位（stagger .08s）；预约 sheet=grab+分区胶囊 radio+时段胶囊弹簧选中+peach 渐变 CTA。
- **04-community**：feed 卡=avatar 圆环+昵称/时间+分区 tag 胶囊+正文+照片磁贴（微旋转）+赞/评/藏果冻钮；发布=mint 渐变胶囊。
- **05-me**：丁香渐变会员饼干卡+大白爪印水印+积分/券/档案 tabular 三数；设置行磁贴+果冻开关；头像=avatar 态+编辑磁贴。

## 10. 可访问与性能 / A11y & perf
ink/cream 对比 ≥7:1；动效仅 transform/opacity；首屏资产 ≤300KB；genimg 资产带 seed 记录（mascot-prompt 同纪律）；所有交互控件有 data-act/data-goto（零死控件门）。
