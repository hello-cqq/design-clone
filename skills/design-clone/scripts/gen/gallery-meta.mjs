#!/usr/bin/env node
/**
 * gallery-meta.mjs —— 生成画廊就绪 meta.json（proto 仓 SPEC v2 同构）于 run 根（M62-A）
 *
 * 心智：官网画廊唯一真源=<app>/meta.json（CI index.json 由其聚合）；生成期即产出，
 * publish 只搬运+合并。双语基线=模板+products.json 三要素；tags=词表 seeded 洗牌（可复跑）。
 *
 * 用法: node gallery-meta.mjs --run <runDir> [--force] [--category <cat>]
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({ options: { run: { type: "string" }, force: { type: "boolean" }, category: { type: "string" }, "name-zh": { type: "string" }, "name-en": { type: "string" }, "desc-zh": { type: "string" }, "desc-en": { type: "string" }, tags: { type: "string" } } });
if (!values.run) { console.log("用法: node gallery-meta.mjs --run <runDir> [--force] [--category <cat>]"); process.exit(1); }
const run = path.resolve(values.run);
const out = path.join(run, "meta.json");
if (fs.existsSync(out) && !values.force) { console.log("meta.json 已存在（--force 覆盖）:", out); process.exit(0); }

const readJ = (p) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; } };
const dc = (() => { try { const m = fs.readFileSync(path.join(run, "prototype/index.html"), "utf8").match(/window\.DC = (\{[\s\S]*?\});/); return JSON.parse(m[1]); } catch { return { pages: [], shell: "c_mobile" }; } })();
const scope = readJ(path.join(run, "knowledge/scope.json")) || {};
const products = readJ(path.join(run, "prototype/products.json")) || {};
const manifest = readJ(path.join(run, "capture/manifest.json")) || {};
const app = scope.target || path.basename(run);

/* ---------- category 关键词映射 ---------- */
const CATS = [
  ["social", /wechat|微信|chat|社交|会话|im\b|message|通讯/i],
  ["short-video", /douyin|抖音|tiktok|视频|video|shorts|bilibili|哔哩/i],
  ["office", /lark|飞书|办公|协作|文档|slack|workspace|会议/i],
  ["commerce", /shop|store|商城|电商|购物|mall|taobao|京东/i],
  ["travel", /旅行|地图|map|乐园|park|travel|出行|导航|explore/i],
  ["game", /游戏|game|play|冒险/i],
  ["news", /新闻|news|资讯|头条|日报/i],
  ["education", /学|edu|course|课堂|知识/i],
  ["finance", /银行|bank|金融|finance|钱包|wallet|支付/i],
  ["tools", /工具|tool|任务|task|效率|管理|面板|console|控制台/i],
];
const CAT_ZH = { social: "社交", "short-video": "短视频", office: "办公协作", commerce: "电商购物", travel: "旅行出行", game: "游戏", news: "新闻资讯", education: "学习教育", finance: "金融支付", tools: "效率工具", lifestyle: "生活" };
const haystack = [app, (dc.pages || []).map((p) => p.name).join(" "), manifest.title || "", Object.values(products).map((p) => p.function || "").join(" ")].join(" ");
// M63：计分制——各类关键词命中次数取最大（避免"先到先得"误判，如 aliyun 因"文档"误入 office）
let category = values.category;
if (!category) {
  let best = "lifestyle", bestN = 0;
  for (const [cat, re] of CATS) {
    const n = (haystack.match(new RegExp(re.source, "gi")) || []).length;
    if (n > bestN) { bestN = n; best = cat; }
  }
  category = bestN ? best : "lifestyle";
}

/* ---------- 双语名称/描述基线 ---------- */
const title = String(manifest.title || "").trim();
const hasCJK = (s) => /[\u4e00-\u9fa5]/.test(s);
const nameZh = values["name-zh"] || (hasCJK(title) ? title.slice(0, 40) : hasCJK(app) ? app : `${CAT_ZH[category] || category} · 可交互原型`);
const nameEn = values["name-en"] || (!hasCJK(title) && title ? title.slice(0, 40) : `${app} · ${category} prototype`);
const homeProd = products[(dc.pages || [])[0]?.id] || Object.values(products)[0] || {};
const funcZh = homeProd.function || "完整可交互界面与路径演示";
const SHELL_EN = { c_mobile: "mobile", c_tablet: "tablet", c_desktop: "desktop", c_browser: "web" };
const descZh = values["desc-zh"] || `${CAT_ZH[category] || category}类${SHELL_EN[dc.shell] === "web" ? "网页" : "应用"}原型：${funcZh}。由 design-clone 自真实来源克隆，全控件可交互、含设计规格与路径。`;
const descEn = values["desc-en"] || `Interactive ${category} prototype (${SHELL_EN[dc.shell] || "mobile"}): full UI flows, live controls, design specs and user paths — cloned from a real source by design-clone.`;

/* ---------- tags：词表 seeded 洗牌（app 名做种，稳定可复跑） ---------- */
const seed = [...app].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const mulberry = (s) => () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const rnd = mulberry(seed);
const featWords = [];
for (const [k, re] of [["map", /地图|map/], ["community", /社区|community|feed/], ["booking", /预约|booking/], ["chat", /聊天|chat|会话/], ["profile", /档案|profile|我的/], ["player", /播放|player|视频/], ["dashboard", /面板|dashboard|控制台/], ["shop", /购物|shop|商城/], ["pets", /宠物|pet/], ["search", /搜索|search/]]) if (re.test(haystack)) featWords.push(k);
const pool = [...new Set([category, SHELL_EN[dc.shell] || "mobile", scope.source || "clone", ...featWords, "interactive", scope.source && scope.source !== "original" ? "study" : "original"])];
for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
const tags = values.tags ? values.tags.split(",").map((x) => x.trim()).slice(0, 6) : pool.slice(0, Math.min(6, Math.max(3, pool.length)));

/* ---------- SPEC v2 同构 meta ---------- */
const attest = scope.source === "original" ? "original" : "public-material";
const meta = {
  name: { en: nameEn, zh: nameZh },
  description: { en: descEn, zh: descZh },
  tags, category,
  shell: dc.shell || "c_mobile",
  source: { kind: scope.source || "original", ref: scope.target || app },
  license: "CC-BY-4.0",
  ip_attestation: attest,
  attestation_note: "",
  version: "0.1.0",
  created_at: new Date().toISOString(),
};
if (attest !== "original") meta.brand_disclaimer = `Unofficial study replica of ${nameEn}; trademarks belong to their owners; no affiliation or endorsement implied.`;
fs.writeFileSync(out, JSON.stringify(meta, null, 2));
console.log(JSON.stringify({ meta: out, category, tags, name: meta.name }));
