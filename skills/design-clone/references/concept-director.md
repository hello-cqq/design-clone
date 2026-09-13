# concept-director.md —— 概念导演工作流（M77-W1，豆包对标+九 aspect 全驱动）

触发：source=original/concept（用户给一段简短/模糊描述，或短图文）。**禁止**直接拿原句生图或手写视图。

## 流程
1. **导演**：`node scripts/gen/director.mjs --concept "<原话>" --out <run>/knowledge/brief.json [--hints h.json] [--refs dir] [--auto]`
   - 场景识别（assistant/animal-park/education/music/culture-tea/commerce/game-tech/travel/generic）；
   - 风格锚点：用户词优先（新海诚/动物城/二次元/赛博/国风/3d），否则场景默认；
   - 九 aspect 一次产出：identity(名/logline/palette/tokens)、style_baseline、characters、pages(功能/目标/布局/**控件清单**/整页 UI 长提示词)、assets(角色/背景/场景分层)、icon{prompt}、cover{prompt}、tags、flows(→场景树)、scenes(→粒子/视差母题)、video_prompts、design_notes、suggested_questions（缺信息公示，--auto 不阻塞）。
2. **参考图**：`node scripts/gen/ref-images.mjs --run <run>` → `references/ref-<page>.png`+manifest（给用户确认+视图构建艺术方向；genimg 自动擦水印）。
3. **衍生三件**：`brief-tokens.mjs`（tokens.css）→ `brief-products.mjs`（products.json=再生提示词面板源）→ `brief-flows.mjs`（paths.json 场景树/路径）。
4. **视图构建**：按 brief.pages 逐页写 HTML，2.5D 分层（references/art-direction.md）：far=assets 背景带 / mid=光球粒子 / near=角色渲染 / ui=玻璃卡；**控件清单全接线**（interact 门 dead=0）；风格令牌消费 tokens.css 变量。
5. **图标/封面/ meta**：appicon（brief.icon 优先）→ cover（brief.cover 生图底+名/标签叠层）→ gallery-meta（brief 名称/标签优先）→ publish。
6. **门**：inspect `brief-director`（brief 齐+参考图≥页数）+ `art-depth` + 既有全门。

## 护栏（存量克隆零影响）
- 所有 brief 逻辑仅在 `knowledge/brief.json` 存在时生效；clone/link/web/desktop 链路不产生 brief → 行为逐字节不变；
- 新门对存量 original run（M77 前）=warn 公示，不 fail；
- 回归 21 run + clone 门 JSON diff 为发布前硬条件（见 docs/GATES.md）。

## 与豆包差异（我们更强）
豆包止步"提示词+参考图"；我们继续：参考图→**可玩原型**（全控件接线+场景树+门禁+一键发布画廊+离线 zip）。
