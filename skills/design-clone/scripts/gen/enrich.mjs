#!/usr/bin/env node
/**
 * enrich.mjs —— 稀薄输入提示词富化（M75-W2）：把"一只猫"级输入扩展为多模态生图可用的富提示词包。
 * 智能在宿主 agent（VLM）：本脚本提供离线词表展开 + bundle 组装 + 评分记录/改词建议；
 * 联网搜索例图/官方风格由 agent 完成后以 --hints <json> 注入合并。工作流与 rubric 见 references/prompt-enrichment.md。
 *
 * 用法:
 *   node enrich.mjs --concept "猫" [--out <json>] [--hints <json>] [--score <json>] [--pick <n=0>]
 * 产出 bundle: {concept, subjects[], styles[], palette[], composition[], lighting[], mood[], negatives[],
 *               prompts:{hero,icon,cover}, scores[], provenance}
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

const { values: V } = parseArgs({ options: { concept: { type: "string" }, out: { type: "string" }, hints: { type: "string" }, score: { type: "string" }, pick: { type: "string", default: "0" } } });
if (!V.concept) { console.log("用法: node enrich.mjs --concept <概念> [--out json] [--hints json] [--score json]"); process.exit(1); }

/* 离线词表（可扩展）：主体变体 / 风格 / 配色 / 构图 / 光效 / 情绪 / 负提示 */
const KB = {
  _generic: {
    styles: ["pixar-3d 蓬松渲染", "粘土 clay 哑光", "吉卜力手绘水彩", "扁平 vector 极简", "贴纸 sticker 描边", "等距 2.5D 玩具"],
    composition: ["居中主体+留白", "三分法侧身回眸", "俯拍微缩场景", "特写面部+浅景深", "全身+环境叙事"],
    lighting: ["柔光棚拍顶光", "黄昏暖逆光", "清晨冷侧光", "霓虹边缘光", "窗光丁达尔"],
    mood: ["治愈温柔", "俏皮活泼", "安静诗意", "高级克制"],
    negatives: ["文字水印", "多余肢体", "畸形爪/指", "低清噪点", "真人脸(若主体为动物)"],
  },
  cat: {
    subjects: ["英国短毛猫(蓝灰圆脸)", "橘猫(虎斑胖脸)", "布偶猫(蓝眼长毛)", "黑猫(金眼)", "三花猫", "奶牛猫"],
    palette: ["#FFF6E9 奶油底", "#7EDCC3 薄荷", "#FFB38A 蜜桃", "#8ECDF0 天空", "#FFD66B 蜂蜜"],
    extra: { scene: ["窗台毛毯", "纸箱城堡", "猫爬架顶层", "沙发扶手"], props: ["毛线球", "小鱼干", "铃铛项圈"] },
  },
  dog: { subjects: ["柯基(棕白短腿)", "柴犬(赤色笑眼)", "金毛(暖棕长毛)", "边牧(黑白聪明脸)"], palette: ["#FFF6E9", "#7EDCC3", "#FFB38A", "#FFD66B"] },
  rabbit: { subjects: ["垂耳兔(白)", "侏儒兔(灰)", "安哥拉兔(长毛)"], palette: ["#FFF6E9", "#C9B6F2 丁香", "#FF8FA3 草莓"] },
  assistant: { subjects: ["知性女生助理(短发衬衫)", "沉稳男生助理(衬衫侧颜)"], palette: ["#8ECDF0", "#C9B6F2", "#FFF6E9"], extra: { scene: ["全息对话环", "视频通话框", "音色波形"] } },
};
const c = V.concept.trim();
const key = Object.keys(KB).find((k) => k !== "_generic" && (c.includes(k) || c.includes(KB[k].subjects?.[0]?.slice(0, 2) || ""))) || (c.includes("猫") ? "cat" : null);
const spec = KB[key] || {};
const g = KB._generic;
const hints = V.hints && fs.existsSync(V.hints) ? JSON.parse(fs.readFileSync(V.hints, "utf8")) : {};
const pick = (arr, n) => arr.slice(n, n + 1)[0] || arr[0];
const style = pick([...(hints.styles || []), ...g.styles], +V.pick);
const subject = pick([...(hints.subjects || []), ...(spec.subjects || ["未指定主体"])], +V.pick);
const bundle = {
  concept: c,
  subjects: [...(hints.subjects || []), ...(spec.subjects || [])],
  styles: [...(hints.styles || []), ...g.styles],
  palette: [...(hints.palette || []), ...(spec.palette || [])],
  composition: g.composition, lighting: g.lighting, mood: g.mood,
  negatives: g.negatives,
  scenes: (spec.extra && spec.extra.scene) || hints.scenes || [],
  props: (spec.extra && spec.extra.props) || hints.props || [],
  prompts: {
    hero: `${subject}，${style}，${pick(g.composition, +V.pick)}，${pick(g.lighting, +V.pick)}，${pick(g.mood, +V.pick)}，配色 ${((spec.palette || g.styles).join("/"))}，场景 ${((spec.extra && spec.extra.scene) || ["极简留白"])[0]}，道具 ${((spec.extra && spec.extra.props) || ["无"])[0]}；负提示：${g.negatives.join("/")}`,
    icon: `圆角方形 app 图标，${subject} 头部特写，${style}，居中，纯色奶油底 #FFF6E9，光泽顶高光，无文字`,
    cover: `3:2 横幅，${subject} 全身立于等距平台，${style}，环境叙事场景，柔和接触影，糖果配色`,
  },
  scores: V.score && fs.existsSync(V.score) ? JSON.parse(fs.readFileSync(V.score, "utf8")) : [],
  provenance: { offline_kb: key || "_generic", hints: V.hints || null, at: new Date().toISOString() },
};
/* 低分改词建议：rubric 四维 <3 时给出替换轴 */
const low = bundle.scores.filter((s) => (s.avg || 5) < 3);
if (low.length) bundle.refine = { swap_style_to: g.styles[(+V.pick + 1) % g.styles.length], swap_composition_to: g.composition[(+V.pick + 1) % g.composition.length], note: "按 rubric 低维替换对应轴后重生（≤3 轮）" };
const out = V.out || `knowledge/enrich-${c.replace(/\s+/g, "-")}.json`;
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(bundle, null, 2));
console.log(JSON.stringify({ out, style, subject, prompts: Object.keys(bundle.prompts) }));
