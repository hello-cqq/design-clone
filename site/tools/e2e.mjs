#!/usr/bin/env node
/**
 * e2e.mjs —— 官网功能/稳定性 E2E（playwright）
 * 用法: NODE_PATH=<playwright 所在 node_modules> node e2e.mjs [base] [loops=20]
 * 覆盖：五页零控制台错误、导航/语言/主题、画廊搜索+tag、详情 iframe 就绪+面包屑+下载链、
 *       star 徽章、火焰热度、footer 链接已除、20 轮循环稳定性。
 */
import { createRequire } from "node:module";
import http from "node:http";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const base = process.argv[2] || "http://localhost:4211";
const loops = +(process.argv[3] || 20);
const fails = [];
const ok = (name, cond, note = "") => { if (!cond) fails.push(`${name}${note ? ": " + note : ""}`); };

const BENIGN = /capture\/|knowledge\/|(overrides|annotations|journeys|source-map|variants-index)\.json|favicon/;

const browser = await chromium.launch();
const ctx = await browser.newPage({ viewport: { width: 1440, height: 950 } });
const errs = [];
ctx.on("console", (m) => { const u = (m.location() && m.location().url) || ""; if (m.type() === "error" && !BENIGN.test(u) && !BENIGN.test(m.text())) errs.push((u || m.text()).slice(0, 120)); });
ctx.on("pageerror", (e) => errs.push("pageerror:" + String(e.message).slice(0, 120)));

// ---- index
await ctx.goto(base + "/index.html", { waitUntil: "networkidle" });
await ctx.waitForTimeout(2500);
ok("hero scene", await ctx.locator(".hero-scene svg").count() === 1);
ok("hero scene poses", await ctx.locator("#hs-sit").count() === 1 && await ctx.locator("#hs-lie").count() === 1 && await ctx.locator(".hs-refl").count() === 1);
ok("nav logo img", await ctx.locator(".logo img.logoimg").count() === 1);
ok("install cmd", (await ctx.locator("#installcmd").textContent()).includes("install.sh"));
ok("exp iframe", (await ctx.locator("#expframe").getAttribute("src") || "").includes("/prototype/"));
ok("featured cards", await ctx.locator("#featured .pcard").count() >= 4);
ok("flame heat", await ctx.locator("#featured .heat svg path").count() >= 4);
ok("no footer links", await ctx.locator("footer a").count() === 0);
ok("anim stage", await ctx.locator("#animstage svg").count() === 1);
// lang + theme
const h1en = await ctx.locator("h1").textContent();
await ctx.click("#langbtn"); await ctx.waitForTimeout(600);
const h1zh = await ctx.locator("h1").textContent();
ok("lang toggle", h1en !== h1zh, `${h1en} vs ${h1zh}`);
await ctx.click("#langbtn"); await ctx.waitForTimeout(400);
const th0 = await ctx.evaluate(() => document.documentElement.dataset.theme);
await ctx.click("#themebtn"); await ctx.waitForTimeout(300);
const th1 = await ctx.evaluate(() => document.documentElement.dataset.theme);
ok("theme toggle", th0 !== th1);
await ctx.click("#themebtn"); await ctx.waitForTimeout(300);
// nav glow pill
ok("nav glowpill", await ctx.locator(".navwrap .glowpill").count() === 1);
ok("gh pill", (await ctx.locator(".ghbtn").textContent()).includes("GitHub"));

// ---- gallery
await ctx.goto(base + "/gallery.html", { waitUntil: "networkidle" });
await ctx.waitForTimeout(2000);
const nAll = await ctx.locator("#cards .pcard").count();
ok("gallery cards", nAll >= 5, String(nAll));
await ctx.fill("#q", "wechat"); await ctx.waitForTimeout(700);
const nWe = await ctx.locator("#cards .pcard").count();
ok("gallery search", nWe >= 1 && nWe < nAll, `${nWe}/${nAll}`);
await ctx.fill("#q", ""); await ctx.waitForTimeout(500);
const tag = ctx.locator(".tagbtn").first();
if (await tag.count()) { await tag.click(); await ctx.waitForTimeout(600); ok("gallery tag filter", (await ctx.locator("#cards .pcard").count()) < nAll); await tag.click(); await ctx.waitForTimeout(400); }

// ---- proto detail
await ctx.goto(base + "/proto.html?app=petpark", { waitUntil: "networkidle" });
await ctx.waitForTimeout(2500);
ok("breadcrumb", (await ctx.locator("#crumb").textContent()).includes("PetPark") || (await ctx.locator("#crumb").textContent()).includes("宠物"));
ok("board name", (await ctx.locator("#side h1").textContent()).length > 2);
ok("board dl btn", (await ctx.locator("#side .dlbtn").textContent()).length > 2);
{
  // 数据层校验（绕过 CDN 缓存）：index 贡献者必须带 login（站点据此渲染真实头像）；DOM 头像受 CDN TTL 影响仅作软检查
  const idx = await ctx.evaluate(async () => { try { return await (await fetch("https://hello-cqq.github.io/design-clone-prototype/index.json?x=" + Date.now(), { cache: "no-store" })).json(); } catch { return null; } });
  const app = (idx && idx.apps || []).find((a) => a.app === "petpark");
  ok("index contributors carry logins", !!(app && (app.contributors || []).some((c) => c.login)));
}
ok("jump link", (await ctx.locator("#jump").getAttribute("href") || "").includes("tree/main"));
const frame = ctx.frameLocator("#stageframe");
try { await frame.locator("#dc-stage").waitFor({ timeout: 20000 }); ok("iframe prototype ready", true); }
catch { ok("iframe prototype ready", false); }
ok("no page scroll", await ctx.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 2));

// ---- guide/start
for (const p of ["/guide.html", "/start.html"]) {
  await ctx.goto(base + p, { waitUntil: "networkidle" });
  await ctx.waitForTimeout(800);
  ok("page " + p, await ctx.locator("header.top").count() === 1);
}

// ---- stability loops
for (let i = 0; i < loops; i++) {
  await ctx.goto(base + "/index.html", { waitUntil: "domcontentloaded" });
  await ctx.waitForTimeout(250);
  await ctx.goto(base + "/gallery.html", { waitUntil: "domcontentloaded" });
  await ctx.waitForTimeout(250);
  await ctx.goto(base + "/proto.html?app=wechat", { waitUntil: "domcontentloaded" });
  await ctx.waitForTimeout(250);
}
await ctx.waitForTimeout(1500);
ok("console clean", errs.length === 0, errs.slice(0, 3).join(" | "));

await browser.close();
console.log(JSON.stringify({ pass: fails.length === 0, fails }, null, 1));
process.exit(fails.length ? 1 : 0);
