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
