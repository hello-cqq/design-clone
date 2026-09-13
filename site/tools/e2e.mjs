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
await ctx.goto(base + "/index.html", { waitUntil: "load" });
await ctx.waitForTimeout(2500);
ok("ident video", await ctx.locator(".ident .idf-video").count() === 2);
ok("ident mask (no rectangle)", await ctx.evaluate(() => { const v = document.querySelector(".idf-video"); const cs = getComputedStyle(v); return (cs.maskImage || cs.webkitMaskImage || "").includes("radial-gradient"); }));
ok("ident wrapper frameless", await ctx.evaluate(() => { const el = document.querySelector(".ident"); const cs = getComputedStyle(el); return cs.backgroundImage === "none" && cs.backgroundColor === "rgba(0, 0, 0, 0)" && cs.borderTopWidth === "0px"; }));
ok("no lockup/hint text", await ctx.locator(".ident .idf-lockup, .ident .idf-hint").count() === 0);
ok("dual video layers", await ctx.locator(".ident .idf-video").count() === 2 && await ctx.locator(".ident .idf-halo").count() === 2);
{
  const t0 = await ctx.evaluate(() => document.querySelector(".idf-video.on").currentTime);
  await ctx.waitForTimeout(2600);
  const t1 = await ctx.evaluate(() => document.querySelector(".idf-video.on").currentTime);
  ok("ident plays+loops", t1 > t0 + 0.05 || t1 < t0 - 0.5);
}
{
  await ctx.click("#themebtn"); await ctx.waitForTimeout(1000);
  const st = await ctx.evaluate(() => ({
    lightOn: document.querySelector('.idf-video[data-k="light"]').classList.contains("on"),
    darkOn: document.querySelector('.idf-video[data-k="dark"]').classList.contains("on"),
    logo: (document.querySelector(".wordmark") || {}).textContent || "",
    wmGrad: getComputedStyle(document.querySelector(".wm-c")).backgroundImage,
  }));
  ok("theme crossfade swap", st.lightOn && !st.darkOn && (st.logo || "").includes("design-clone"));
  await ctx.click("#themebtn"); await ctx.waitForTimeout(1000);
  const st2 = await ctx.evaluate(() => ({
    wmGrad2: getComputedStyle(document.querySelector(".wm-c")).backgroundImage,
    lightOn: document.querySelector('.idf-video[data-k="light"]').classList.contains("on"),
    darkOn: document.querySelector('.idf-video[data-k="dark"]').classList.contains("on"),
  }));
  ok("theme crossfade back", st2.darkOn && !st2.lightOn && st2.wmGrad2 !== st.wmGrad);
}
ok("nav logo wordmark (M75-W1)", await ctx.locator(".logo .wordmark").count() === 1);
ok("no agent switcher", await ctx.locator(".agentbtn").count() === 0);
ok("install label", ((await ctx.locator("[data-i18n=install_label]").textContent()) || "").trim().toLowerCase() === "install");
ok("universal install cmd", ((await ctx.locator("#installcmd").textContent()) || "").includes("install.sh | bash") && !((await ctx.locator("#installcmd").textContent()) || "").includes("--agent"));
ok("subs removed", await ctx.evaluate(() => !document.body.innerText.includes("按下载量排序") && !document.body.innerText.includes("四种来源") && !document.body.innerText.includes("Ranked by downloads") && !document.body.innerText.includes("Four sources")));
ok("nav logo art-clip stagger (M76-W1b)", await ctx.evaluate(() => { const cs0 = [...document.querySelectorAll(".logo .wm-c")]; if (cs0.length !== 12) return false; const c = getComputedStyle(cs0[0]); const trs = new Set(cs0.map((x) => getComputedStyle(x).transform)); const fs = parseFloat(getComputedStyle(document.querySelector(".logo .wordmark")).fontSize); return (c.webkitBackgroundClip || c.backgroundClip) === "text" && c.color === "rgba(0, 0, 0, 0)" && (c.backgroundImage || "").includes("gradient") && trs.size >= 8 && fs >= 26; }));
ok("no static brandmark", await ctx.locator(".brandmark").count() === 0);
ok("duo layer present", await ctx.locator(".ident .idf-duo").count() === 1);
try {
  await ctx.waitForFunction(() => window.__ident && window.__ident.phase() === "seam", null, { timeout: 14000 });
  ok("duo seam end-card", true);
} catch { ok("duo seam end-card", false); }
{
  await ctx.click("#themebtn");
  let bridged = false;
  try { await ctx.waitForFunction(() => window.__ident && window.__ident.phase() === "bridge", null, { timeout: 2500 }); bridged = true; } catch {}
  ok("duo theme bridge", bridged);
  await ctx.waitForTimeout(1600);
  await ctx.click("#themebtn");
  await ctx.waitForTimeout(1600);
}
ok("wordmark span art", await ctx.locator(".logo span.wordmark").count() === 1);
ok("footer wordmark", await ctx.locator(".ftbrand .wordmark").count() === 1);
ok("wordmark no plain text", await ctx.evaluate(() => ![...document.querySelector(".logo").childNodes].some((n) => n.nodeType === 3 && n.textContent.trim() === "design-clone")));
ok("footer wordmark", await ctx.locator("footer .wordmark--ft").count() === 1);
ok("favicon diptych", await ctx.evaluate(() => (document.querySelector("link[rel=icon]") || {}).href.includes("favicon.png")));
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
await ctx.goto(base + "/gallery.html", { waitUntil: "load" });
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
await ctx.goto(base + "/proto.html?app=petpark", { waitUntil: "load" });
await ctx.waitForTimeout(2500);
ok("breadcrumb", /PetPark|宠物|智能助理|AI Assistant/.test(await ctx.locator("#crumb").textContent()));
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
  await ctx.goto(base + p, { waitUntil: "load" });
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
process.exit(fails.length ? 1 : 0);{
  await ctx.goto(base + "/proto.html?app=wechat", { waitUntil: "load" });
  await ctx.waitForTimeout(2500);
  ok("dl release link", await ctx.evaluate(() => (document.getElementById("dlbtn") || {}).href.includes("/releases/download/wechat-")));
  ok("contrib avatars only", await ctx.evaluate(() => {
    const avs = [...document.querySelectorAll(".contrib-avs .cav")];
    return avs.length >= 1 && avs.every((a) => a.href.startsWith("https://github.com/") && a.querySelector("img")) && !document.querySelector(".contrib-avs .cav + .n") && !document.body.innerText.includes("1 commits");
  }));
  ok("creator first", await ctx.evaluate(() => { const c = document.querySelector(".contrib-avs .cav"); return c && c.classList.contains("creator"); }));
  ok("iframe theme param", await ctx.evaluate(() => document.getElementById("stageframe").src.includes("theme=")));
  await ctx.click("#themebtn"); await ctx.waitForTimeout(600);
  ok("theme post to iframe", await ctx.evaluate(() => window.__postedTheme === "dark"));
  await ctx.click("#themebtn"); await ctx.waitForTimeout(600);
  await ctx.goto(base + "/gallery.html", { waitUntil: "load" });
}
{
  await ctx.waitForTimeout(1800);
  ok("gallery no h2 title", await ctx.evaluate(() => !document.querySelector("#cards")?.closest(".wrap").querySelector("h2")));
  ok("search full width", await ctx.evaluate(() => { const q = document.getElementById("q"); const row = q.parentElement; return q.getBoundingClientRect().width > row.getBoundingClientRect().width * 0.6; }));
  ok("icon tile covers", await ctx.evaluate(() => document.querySelectorAll("#cards .th.tile .appicon").length >= 4));
}

// ---- M71 mobile suite 390x844 ----
{
  const mp = await b.newPage({ viewport: { width: 390, height: 844 } });
  await mp.goto(base + "/index.html", { waitUntil: "load" });
  await mp.waitForTimeout(1800);
  ok("mobile index no h-scroll", await mp.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  ok("mobile ident visible", await mp.locator(".ident .idf-video").first().isVisible());
  ok("mobile install code visible", await mp.locator("#installcmd").isVisible());
  await mp.goto(base + "/gallery.html", { waitUntil: "load" });
  await mp.waitForTimeout(1800);
  ok("mobile gallery no h-scroll", await mp.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  ok("mobile gallery cards", await mp.locator("#cards .pcard").count() >= 4);
  // M75-W5: 360 宽 + proto 页横溢断言
  await mp.setViewportSize({ width: 360, height: 800 });
  await mp.goto(base + "/index.html", { waitUntil: "domcontentloaded" });
  await mp.waitForTimeout(800);
  ok("mobile360 index no h-scroll", await mp.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await mp.goto(base + "/proto.html?app=ai-assistant", { waitUntil: "domcontentloaded" });
  await mp.waitForTimeout(1200);
  ok("mobile360 proto no h-scroll", await mp.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  ok("mobile step rail", await mp.locator(".steps b").count() === 4);
  await mp.close();
  // M76-W5: 画廊全 app 巡检——每个已发布 app 的 proto 页舞台可渲染且无 console 错
  {
    const gp = await b.newPage({ viewport: { width: 1280, height: 900 } });
    const errs = [];
    gp.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 80)); });
    await gp.goto(base + "/gallery.html", { waitUntil: "domcontentloaded" });
    await gp.waitForTimeout(2500);
    const slugs = await gp.evaluate(() => (window.__DC_STATE && window.__DC_STATE.index ? window.__DC_STATE.index.apps || window.__DC_STATE.index : []).map((a) => a.slug || a.app).filter(Boolean));
    ok("gallery index apps", slugs.length >= 6);
    for (const slug of slugs.slice(0, 8)) {
      await gp.goto(base + `/proto.html?app=${slug}`, { waitUntil: "domcontentloaded" });
      await gp.waitForTimeout(1800);
      const live = await gp.evaluate(() => { const st = document.querySelector("#dc-stage, iframe"); return !!st; });
      ok(`proto live ${slug}`, live);
    }
    ok("gallery tour console clean", errs.length === 0);
    await gp.close();
  }
  await mp.goto(base + "/proto.html?app=petpark", { waitUntil: "load" });
  await mp.waitForTimeout(2500);
  ok("mobile proto no h-scroll", await mp.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  ok("mobile proto stacked", await mp.evaluate(() => {
    const st = document.querySelector(".stage").getBoundingClientRect();
    const sd = document.querySelector(".side").getBoundingClientRect();
    return sd.top >= st.bottom - 4;
  }));
  ok("mobile dl reachable", await mp.locator("#dlbtn").isVisible());
  await mp.goto(base + "/proto.html?app=aliyun-console", { waitUntil: "load" });
  await mp.waitForTimeout(2500);
  ok("mobile proto chromeless", await mp.evaluate(() => document.getElementById("stageframe").src.includes("chrome=0")));
  ok("mobile page chips", await mp.evaluate(() => document.querySelectorAll("#pagechips .pchip").length >= 3));
  {
    const second = mp.locator("#pagechips .pchip").nth(1);
    await second.click();
    await mp.waitForTimeout(1200);
    ok("mobile chip switches page", await mp.evaluate(() => document.getElementById("stageframe").src.includes("#pages/")));
  }
  await mp.goto(base + "/index.html", { waitUntil: "load" });
  await mp.waitForTimeout(2000);
  ok("mobile exp chromeless", await mp.evaluate(() => document.getElementById("expframe").src.includes("chrome=0")));
  ok("mobile install wraps", await mp.evaluate(() => { const c = document.getElementById("installcmd"); return c.scrollWidth <= c.clientWidth + 2; }));
  await mp.close();
}

