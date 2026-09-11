#!/usr/bin/env node
/**
 * cover.mjs —— 画廊封面合成（M62-A）：run 根 cover.png，1200×800 严格 3:2、≤300KB
 *
 * 合成=category 色板渐变底+柔斑 → 设备框（shell 决定手机壳/浏览器 chrome）内嵌首视图真截图
 * （场景一致的保证）→ 真图标角标 → 中英名称 → tag 胶囊。hero 截图优先 capture 首屏，
 * 否则 --base 现拍 chrome=0。
 *
 * 用法: node cover.mjs --run <runDir> [--base <url>] [--force]
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
const { values } = parseArgs({ options: { run: { type: "string" }, base: { type: "string" }, force: { type: "boolean" } } });
if (!values.run) { console.log("用法: node cover.mjs --run <runDir> [--base <url>] [--force]"); process.exit(1); }
const run = path.resolve(values.run);
const out = path.join(run, "cover.png");
if (fs.existsSync(out) && !values.force) { console.log("cover.png 已存在（--force 重制）"); process.exit(0); }

const readJ = (p) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; } };
const meta = readJ(path.join(run, "meta.json")) || {};
const dc = (() => { try { const m = fs.readFileSync(path.join(run, "prototype/index.html"), "utf8").match(/window\.DC = (\{[\s\S]*?\});/); return JSON.parse(m[1]); } catch { return { pages: [], shell: "c_mobile" }; } })();
const shell = dc.shell || "c_mobile";
const cat = meta.category || "tools";
const PAL = {
  social: ["#FFE3E8", "#FFF6E9", "#FF8FA3"], "short-video": ["#FFE8D2", "#FFF6E9", "#FF9D6B"],
  office: ["#E3F0FA", "#FFF6E9", "#4AA3E8"], commerce: ["#FFEFD2", "#FFF6E9", "#E8A23A"],
  travel: ["#E0F5EC", "#FFF6E9", "#3FAE83"], game: ["#EFE7FB", "#FFF6E9", "#8A63D2"],
  news: ["#FFE9E3", "#FFF6E9", "#E07B39"], education: ["#E8F7EE", "#FFF6E9", "#3FAE83"],
  finance: ["#E3F0FA", "#FFF6E9", "#4AA3E8"], tools: ["#E8F7EE", "#FFF6E9", "#3FAE83"], lifestyle: ["#FFE8D2", "#FFF6E9", "#FFB38A"],
};
const [bg1, bg2, accent] = PAL[cat] || PAL.tools;
const nameZh = (meta.name && meta.name.zh) || (dc.pages[0] || {}).name || "prototype";
const nameEn = (meta.name && meta.name.en) || "";
const tags = (meta.tags || []).slice(0, 3);

/* ---------- hero 截图 ---------- */
const first = (dc.pages[0] || {}).id;
let heroBuf = null;
const cap = path.join(run, "capture/screens", `${first}.png`);
if (fs.existsSync(cap)) heroBuf = fs.readFileSync(cap);
else if (values.base) {
  const { chromium } = require("playwright");
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: shell === "c_mobile" || shell === "c_tablet" ? { width: 390, height: 844 } : { width: 1280, height: 800 } });
  await p.goto(`${values.base}/prototype/?chrome=0#${first}`, { waitUntil: "networkidle" }).catch(() => {});
  await p.waitForTimeout(1200);
  heroBuf = await p.locator("#dc-stage").screenshot().catch(() => null);
  await b.close();
}
if (!heroBuf) { console.error("无 hero 截图：需 capture/screens/<首页>.png 或 --base <url>"); process.exit(1); }

/* ---------- 图标 ---------- */
let iconB64 = "";
for (const c of [path.join(run, "icon.png"), path.join(run, "prototype/appicon/icon-256.png"), path.join(run, "prototype/appicon/icon-512.png")]) {
  if (fs.existsSync(c)) { iconB64 = (await sharp(c).resize(192, 192, { fit: "cover" }).png().toBuffer()).toString("base64"); break; }
}

/* ---------- 设备框内 hero（base64 内嵌 SVG，clip 圆角） ---------- */
const mob = shell === "c_mobile" || shell === "c_tablet";
const FW = mob ? 330 : 660, FH = mob ? 620 : 430, FX = 1200 - FW - 90, FY = mob ? 90 : 150;
const heroB64 = (await sharp(heroBuf).resize(FW - 24, FH - 24, { fit: "cover" }).png().toBuffer()).toString("base64");
const pills = tags.map((t, i) => `<rect x="${70 + i * 150}" y="560" rx="999" ry="999" width="140" height="44" fill="#fffdf8" opacity=".92"/><text x="${140 + i * 150}" y="588" font-size="20" fill="#4a3b2e" text-anchor="middle" font-family="PingFang SC, Noto Sans CJK SC, sans-serif">${String(t).replace(/[<>&]/g, "")}</text>`).join("");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient>
  <clipPath id="scr"><rect x="${FX + 12}" y="${FY + 12}" width="${FW - 24}" height="${FH - 24}" rx="${mob ? 30 : 12}"/></clipPath>
  <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="${accent}" opacity=".18"/></pattern>
</defs>
<rect width="1200" height="800" fill="url(#bg)"/>
<rect width="1200" height="800" fill="url(#dots)"/>
<circle cx="150" cy="120" r="150" fill="${accent}" opacity=".14"/>
<circle cx="1080" cy="700" r="190" fill="${accent}" opacity=".10"/>
<ellipse cx="${FX + FW / 2}" cy="${FY + FH + 26}" rx="${FW * 0.42}" ry="18" fill="#4a3b2e" opacity=".14"/>
<rect x="${FX}" y="${FY}" width="${FW}" height="${FH}" rx="${mob ? 42 : 18}" fill="#fffdf8"/>
<rect x="${FX}" y="${FY}" width="${FW}" height="${FH}" rx="${mob ? 42 : 18}" fill="none" stroke="#4a3b2e" stroke-opacity=".12" stroke-width="2"/>
${mob ? `<rect x="${FX + FW / 2 - 40}" y="${FY + 14}" width="80" height="12" rx="6" fill="#4a3b2e" opacity=".18"/>` : shell === "c_desktop" ? `<g fill="#4a3b2e" opacity=".3"><circle cx="${FX + 22}" cy="${FY + 16}" r="4"/><circle cx="${FX + 38}" cy="${FY + 16}" r="4"/><circle cx="${FX + 54}" cy="${FY + 16}" r="4"/></g><rect x="${FX + 76}" y="${FY + 10}" width="${FW - 100}" height="12" rx="6" fill="#4a3b2e" opacity=".08"/>` : `<g fill="#4a3b2e" opacity=".3"><circle cx="${FX + 22}" cy="${FY + 16}" r="4"/><circle cx="${FX + 38}" cy="${FY + 16}" r="4"/><circle cx="${FX + 54}" cy="${FY + 16}" r="4"/></g><rect x="${FX + 76}" y="${FY + 9}" width="${FW * 0.5}" height="14" rx="7" fill="#fffdf8" stroke="#4a3b2e" stroke-opacity=".12"/>`}
<image href="data:image/png;base64,${heroB64}" x="${FX + 12}" y="${FY + 12}" width="${FW - 24}" height="${FH - 24}" preserveAspectRatio="xMidYMid slice" clip-path="url(#scr)"/>
${iconB64 ? `<rect x="70" y="90" width="112" height="112" rx="28" fill="#fffdf8"/><image href="data:image/png;base64,${iconB64}" x="78" y="98" width="96" height="96" preserveAspectRatio="xMidYMid slice"/><circle cx="96" cy="112" r="7" fill="#fff" opacity=".8"/>` : ""}
<text x="70" y="290" font-size="52" font-weight="600" fill="#4a3b2e" font-family="PingFang SC, Noto Sans CJK SC, sans-serif">${String(nameZh).slice(0, 12).replace(/[<>&]/g, "")}</text>
<text x="70" y="330" font-size="24" fill="#8a7660" font-family="-apple-system, Segoe UI, sans-serif">${String(nameEn).slice(0, 30).replace(/[<>&]/g, "")}</text>
<rect x="70" y="370" width="64" height="10" rx="5" fill="${accent}"/>
${pills}
<text x="70" y="730" font-size="20" fill="#8a7660" font-family="-apple-system, Segoe UI, sans-serif">design-clone · playable prototype</text>
</svg>`;

let buf = await sharp(Buffer.from(svg)).png({ palette: true, quality: 80, compressionLevel: 9 }).toBuffer();
if (buf.length > 300 * 1024) buf = await sharp(Buffer.from(svg)).png({ palette: true, quality: 60, compressionLevel: 9, colors: 128 }).toBuffer();
fs.writeFileSync(out, buf);
const m = await sharp(out).metadata();
console.log(JSON.stringify({ cover: out, w: m.width, h: m.height, kb: Math.round(buf.length / 1024) }));
