#!/usr/bin/env node
/**
 * style-pick.mjs — 场景→生图风格自主决策（M44e）。不限死 3D：按产品场景选 二次元/迪士尼/插画/赛博/古风/照片/扁平企业 等。
 * 用法:
 *   node style-pick.mjs --scenario <social-im|travel-life|work-collab|ecommerce-marketing|game-tech|culture-reading|developer-tools|default> [--kind avatar|cover|scene|icon] [--subject "..."] [--palette "#aabbcc,#ddeeff"]
 *   node style-pick.mjs --run <runDir> [--kind avatar] [--subject "..."]   # 从 target/platform/shell 推断场景
 * 输出: JSON {scenario, kind, style, prompt}（prompt 已含风格锚点提示，反 AI 味后缀由 genimg 自动加）
 */
import fs from "node:fs";
import path from "node:path";

const A = process.argv.slice(2);
const get = (k, d) => (A.includes(k) ? A[A.indexOf(k) + 1] : d);
if (A.includes("--help") || A.includes("-h")) { console.log("用法: node style-pick.mjs --scenario <s> | --run <runDir>  [--kind avatar|cover|scene|icon] [--subject ...] [--palette ...]"); process.exit(0); }

const SCEN = {
  "social-im": { avatar: "anime", cover: "photographic", scene: "illustration", icon: "clay-icon" },
  "travel-life": { avatar: "anime", cover: "photographic", scene: "illustration", icon: "sticker" },
  "work-collab": { avatar: "flat-corporate", cover: "flat-corporate", scene: "flat-corporate", icon: "flat" },
  "ecommerce-marketing": { avatar: "photographic", cover: "photographic", scene: "photographic", icon: "clay-icon" },
  "game-tech": { avatar: "cyberpunk", cover: "cyberpunk", scene: "cyberpunk", icon: "sticker" },
  // M76-W3a: 虚拟人/AI 助理/宠物伙伴等"角色向"场景 → 原神级 cel 渲染
  "virtual-human": { avatar: "anime-cel", cover: "anime-cel", scene: "anime-cel", icon: "sticker" },
  "pet-companion": { avatar: "anime-cel", cover: "anime-cel", scene: "anime-cel", icon: "clay-icon" },
  "culture-reading": { avatar: "guofeng", cover: "guofeng", scene: "guofeng", icon: "sticker" },
  "developer-tools": { avatar: "flat-corporate", cover: "flat", scene: "flat", icon: "flat" },
  default: { avatar: "illustration", cover: "illustration", scene: "illustration", icon: "clay-icon" },
};
const TPL = {
  avatar: "single person head-and-shoulders portrait avatar, {S}, centered, flat solid SATURATED background color (warm terracotta / teal / mustard / dusty blue — never white, never gray), square crop, friendly approachable expression, bold simple shapes",
  cover: "wide banner cover image, {S}, landscape composition, atmospheric depth, no readable text, no watermark",
  scene: "environmental scene illustration, {S}, storytelling details, coherent light source, no readable text",
  icon: "app icon / feature glyph, {S}, simple bold silhouette, centered, square, minimal background",
};
const KW = [
  [/wechat|微信|chat|im|社交|消息/i, "social-im"],
  [/travel|轨迹|trip|出行|游|地图|footprint/i, "travel-life"],
  [/lark|feishu|workbuddy|office|协作|doc|meeting|日历|任务|work/i, "work-collab"],
  [/shop|mall|store|aliyun|apple|price|电商|云|buy|ecs/i, "ecommerce-marketing"],
  [/game|游戏|cyber|赛博|tech|ai\b/i, "game-tech"],
  [/read|book|书|文化|古风|poem|zine/i, "culture-reading"],
  [/dev|code|github|terminal|cli/i, "developer-tools"],
];
function infer(run) {
  let name = path.basename(run);
  let plat = "", shell = "";
  try { plat = (JSON.parse(fs.readFileSync(path.join(run, "knowledge/platform.json"), "utf8")).platform) || ""; } catch {}
  try { shell = (JSON.parse(fs.readFileSync(path.join(run, "knowledge/scope.json"), "utf8")).platform) || ""; } catch {}
  const blob = name + " " + plat + " " + shell;
  for (const [re, s] of KW) if (re.test(blob)) return s;
  if (plat === "desktop" || shell === "c_desktop") return "work-collab";
  return "default";
}
const scenario = get("--scenario", null) || (get("--run", null) ? infer(path.resolve(get("--run"))) : "default");
const kind = get("--kind", "avatar");
const style = (SCEN[scenario] || SCEN.default)[kind] || SCEN.default[kind] || "illustration";
const subject = get("--subject", kind === "avatar" ? "a friendly fictional person" : "an evocative abstract motif");
const palette = get("--palette", null);
let prompt = TPL[kind].replace("{S}", subject);
if (palette) prompt += `, color palette constrained to ${palette}`;
console.log(JSON.stringify({ scenario, kind, style, prompt }, null, 1));
