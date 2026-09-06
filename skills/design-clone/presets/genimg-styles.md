# genimg 风格锚预设

与 `scripts/genimg.mjs` 的 `--style` 一一对应；改这里时同步改脚本内 STYLES 表。

| style | 适用 | 锚点提示词 |
|---|---|---|
| `pixar-3d` | 吉祥物/角色插画（灵魂级质感） | pixar style 3d render, soft volumetric lighting, detailed fur and textures, subsurface scattering, cinematic still, high quality 3d character |
| `clay-icon` | 3D 黏土图标/功能入口 | 3d clay icon, soft matte clay material, rounded shapes, gentle studio lighting, solid pastel background, blender render, minimal |
| `sticker` | 徽章/表情/标签 | die-cut sticker art, bold clean outline, flat vibrant colors, thin white border |
| `flat` | 空态插画/背景纹样 | flat vector illustration, minimal geometric shapes, limited palette |

## 写词两段式（agent 编排）
1. VLM 看证据帧 → 结构化描述：主体/材质/光效/构图/色板 hex（`tokens-sample.mjs` 取）
2. 拼接：`<主体描述>, <色板约束: palette #xxx #yyy>, <style 锚点>`

## 评判闭环
`--seeds 1,2,3` 出三张 → VLM 对照证据选优 → 不满意改一句描述重生（≤2 轮）。

## 兜底链
crop 证据 → iconify/simple-icons 矢量 → genimg → VLM 重画 SVG（clay 配方：radial 渐变+顶部高光+feGaussianBlur）→ CSS clay → emoji。

## M44e 场景自适应风格 + 循环自检
不限死 3D。`scripts/gen/style-pick.mjs --scenario <s>|--run <run> --kind avatar|cover|scene|icon` 按产品场景自主决策风格：
| 场景 | avatar | cover/scene | icon |
|---|---|---|---|
| social-im（微信/IM） | anime | photographic / illustration | clay-icon |
| travel-life（轨迹/出行） | anime | photographic / illustration | sticker |
| work-collab（飞书/办公桌面） | flat-corporate | flat-corporate | flat |
| ecommerce-marketing（apple/aliyun/电商） | photographic | photographic | clay-icon |
| game-tech | cyberpunk | cyberpunk | sticker |
| culture-reading | guofeng | guofeng | sticker |

新增锚点：`anime / disney / illustration / cyberpunk / guofeng / photographic / flat-corporate`（均含 "NOT photoreal/NOT 3d" 等防串味措辞）。
**反 AI 味后缀**（genimg 默认附加，`--no-anti` 关闭）：非对称光/构图、自然不完美细节、禁塑料光泽肌/完美对称/纯灰底。
**循环自检**：`scripts/img/gen-loop.mjs --out <asset> --run <run> --kind avatar --subject "..." [--rounds 3] [--sheet p]`
= style-pick 选风格 → 生成 → 自检(blank/blur/collage/头像禁纯灰底) → 不过则变异重试(换 seed→加纠正词→换风格) ≤N 轮 → 写 manifest(style/scenario/rounds/checks)。
**假名也按场景**：`scripts/gen/fakename.mjs --scenario <s> --n K`（社交可爱/职场/游戏ID/古风池）；称呼保留。

## M44g 内容安全后缀（不可关闭）
所有 prompt 自动附加：family-safe, fully clothed, no nudity/partial nudity, no suggestive pose。cover/scene 默认追加 no people（gen-loop --with-people 关闭该追加）。palette 从 run tokens 注入。
