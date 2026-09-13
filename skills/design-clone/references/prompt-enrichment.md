# 提示词富化工作流（M75-W2）——稀薄输入 → 富提示词包 → 自检循环

触发：用户输入生图需求但条件稀薄（如"一只猫""做个助理形象"）。**禁止**直接拿原句生图。

## 三步
1. **富化**：`node scripts/gen/enrich.mjs --concept "<概念>" --out knowledge/enrich-<c>.json`
   离线词表展开主体变体/风格/配色/构图/光效/情绪/负提示；agent 可先联网搜例图与官方风格页，
   结果写 hints json 后 `--hints` 注入（来源记 provenance）。
2. **生成**：取 bundle.prompts.hero/icon/cover 调 genimg（风格档按 bundle.styles 选）；`--pick N` 换组合。
3. **自检循环（≤3 轮）**：VLM 按 rubric 四维打分（切题/质感/美感/可用性，1-5）写 score json
   `[{dim,avg,note}]` → `--score` 回注；avg<3 时按 bundle.refine 换轴重生；三轮仍<3 → 换风格档或改走素材裁切。

## rubric（VLM 打分提示词模板）
"你是严苛的设计总监。对该图按 切题/质感/美感/可用性 四维 1-5 打分并各给一句理由；
注意：文字是否乱码、肢体/爪指是否畸形、是否有水印、是否偏离概念主体。"

## 边界
- 文本类需求（logo 字样/艺术字）不走本流程：flux 不写字 → 用"生图材质+矢量字形 clip"混合方案（见 M75-W1 字标）。
- 官方品牌素材不走生成：走 references/asset-sourcing.md 官方源链。

## M77-W1 升级：整 App 级富化走 director
单图富化（本文件三步）仍用于资产级需求；**整 App/整原型**需求一律先 `gen/director.mjs` 产 brief.json（九 aspect），
再 `gen/ref-images.mjs` 逐页参考图；enrich.mjs 作为 director 的词表后端被复用（subjects/styles/palette/art_direction）。
详见 references/concept-director.md。
