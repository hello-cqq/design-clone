#!/usr/bin/env node
/**
 * brief-views.mjs（M77-W4）——brief.json → 基线 2.5D 视图套（每页全控件接线）。
 * 用法: node brief-views.mjs --run <runDir>
 * 说明：产出"可玩基线"；精品 run（星海对话/动物乐园级）在此基线上人工/agent 深化美术。
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
const { values: V } = parseArgs({ options: { run: { type: "string" } } });
if (!V.run || process.argv.includes("--help")) { console.log("用法: node brief-views.mjs --run <runDir>"); process.exit(V.run ? 0 : 1); }
const run = path.resolve(V.run);
const brief = JSON.parse(fs.readFileSync(path.join(run, "knowledge/brief.json"), "utf8"));
const P = brief.identity.palette || ["#eef4f8 雾", "#3fb899 薄荷", "#ffd166 金", "#12333f 墨"];
const col = (i) => (P[i] || P[0]).split(" ")[0];
const C1 = col(1), C2 = col(2), BG = col(0), INK = "#22343c";
const assetsDir = path.join(run, "prototype/assets");
const refsDir = path.join(run, "references");
const has = (f) => fs.existsSync(path.join(assetsDir, f));
// 资产落地：references/ast-* → assets/bv-*
fs.mkdirSync(assetsDir, { recursive: true });
const charFile = (() => {
  const c0 = (brief.characters || [])[0];
  if (!c0) return null;
  const src = path.join(refsDir, "ast-ast-" + c0.id + ".png");
  if (!fs.existsSync(src)) return null;
  fs.copyFileSync(src, path.join(assetsDir, "bv-char.png"));
  return "assets/bv-char.png";
})();
const bgFile = (() => {
  const src = path.join(refsDir, "ast-ast-bg-0.png");
  if (!fs.existsSync(src)) return null;
  fs.copyFileSync(src, path.join(assetsDir, "bv-bg.png"));
  return "assets/bv-bg.png";
})();
const particles = ((brief.scenes || [])[0] || {}).particles || "motes";
const ctlHTML = (c, i) => {
  const lab = (c.dc || "ctl" + i).split("/").pop();
  if (c.kind === "radio") return `<span class="bv-chip${i === 0 ? " on" : ""}" data-dc="${c.dc}" data-act="radio" data-group="${c.dc}">${lab}</span>`;
  if (c.kind === "toggle") return `<span class="bv-row" data-dc="${c.dc}">${lab}<span class="sp"></span><span class="bv-sw on" data-act="toggle" data-target="[data-dc='${c.dc}-sw']"></span></span><span hidden data-dc="${c.dc}-sw"></span>`;
  if (c.kind === "slider") return `<span class="bv-row" data-dc="${c.dc}">${lab}<span class="sp"></span><span class="bv-sl" data-act="slider" data-target="[data-dc='${c.dc}-v']"><i style="width:55%"></i></span><b data-dc="${c.dc}-v">55</b></span>`;
  if (c.kind === "goto") return `<span class="bv-btn" data-dc="${c.dc}" data-goto="${c.react && c.react.includes("跳") ? "" : ""}${(brief.pages[1] || {}).id || ""}">${lab}</span>`;
  if (c.kind === "dialog") return `<span class="bv-btn ghost" data-dc="${c.dc}" data-act="dialog" data-title="${lab}" data-body="${c.react || ""}">${lab}</span>`;
  if (c.kind === "sheet") return `<span class="bv-btn ghost" data-dc="${c.dc}" data-act="sheet" data-title="${lab}" data-items="A|B|C">${lab}</span>`;
  return `<span class="bv-btn" data-dc="${c.dc}" data-act="toast" data-msg="${c.react || lab}（演示）">${lab}</span>`;
};
const navHTML = (cur) => `<div class="bv-nav">${brief.pages.map((p) => `<span class="${p.id === cur ? "on" : ""}" data-goto="${p.id}">${p.name.slice(0, 4)}</span>`).join("")}</div>`;
const CSS = `
  .bv{position:relative;min-height:100%;overflow:hidden;font-family:ui-rounded,-apple-system,"PingFang SC","Segoe UI",sans-serif;color:${INK};background:${BG}}
  .bv .far{position:absolute;inset:0;${bgFile ? `background:url(${bgFile}) center/cover;opacity:.5;` : `background:linear-gradient(160deg,${BG},${C1}33);`}animation:kb 36s ease-in-out infinite alternate}
  @keyframes kb{from{transform:scale(1.1)}to{transform:scale(1.03)}}
  .bv .scroll{position:relative;z-index:4;padding:52px 16px 108px;box-sizing:border-box}
  .bv h1{font-size:18px;font-weight:600;margin:0 2px 4px}
  .bv .fn{font-size:11px;color:${INK}99;margin:0 2px 12px}
  .bv .glass{background:rgba(255,255,255,.66);backdrop-filter:blur(14px) saturate(1.2);-webkit-backdrop-filter:blur(14px) saturate(1.2);border:1px solid rgba(255,255,255,.8);border-radius:20px;box-shadow:0 14px 32px rgba(20,40,50,.14), inset 0 1px 0 rgba(255,255,255,.9);padding:14px;margin-bottom:12px}
  .bv .hero{position:relative;border-radius:22px;overflow:hidden;margin-bottom:12px;box-shadow:0 18px 40px rgba(20,40,50,.2)}
  .bv .hero img{display:block;width:100%;height:220px;object-fit:cover;object-position:50% 30%;animation:breathe 4.6s ease-in-out infinite}
  @keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.014)}}
  .bv .chips{display:flex;flex-wrap:wrap;gap:8px}
  .bv-chip{padding:8px 14px;border-radius:999px;font-size:11.5px;font-weight:600;color:${INK}cc;cursor:pointer;background:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.9)}
  .bv-chip.on{background:linear-gradient(140deg,${C1},${C2});color:#fff;border-color:transparent;box-shadow:0 8px 18px ${C1}66}
  .bv-row{display:flex;align-items:center;gap:10px;padding:10px 2px;font-size:12px;font-weight:600;border-bottom:1px solid rgba(20,40,50,.08)}
  .bv-row:last-child{border-bottom:0}
  .bv-row .sp{flex:1}
  .bv-sw{width:40px;height:24px;border-radius:999px;background:rgba(20,40,50,.18);position:relative;cursor:pointer}
  .bv-sw::after{content:"";position:absolute;left:3px;top:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left .2s}
  .bv-sw.on{background:${C1}}
  .bv-sw.on::after{left:19px}
  .bv-sl{width:110px;height:6px;border-radius:3px;background:rgba(20,40,50,.15);position:relative;cursor:pointer}
  .bv-sl i{position:absolute;left:0;top:0;bottom:0;border-radius:3px;background:${C1}}
  .bv-btn{display:inline-block;margin:4px 6px 0 0;padding:10px 18px;border-radius:999px;font-size:12px;font-weight:600;color:#fff;background:linear-gradient(140deg,${C1},${C2});cursor:pointer;box-shadow:0 10px 22px ${C1}55, inset 0 1px 0 rgba(255,255,255,.5)}
  .bv-btn.ghost{background:rgba(255,255,255,.75);color:${INK}}
  .bv-nav{position:absolute;left:12px;right:12px;bottom:20px;z-index:8;display:flex;gap:8px}
  .bv-nav span{flex:1;background:rgba(255,255,255,.88);backdrop-filter:blur(10px);border-radius:16px;padding:10px 2px;text-align:center;font-size:10.5px;color:${INK}99;cursor:pointer;box-shadow:0 8px 20px rgba(20,40,50,.14)}
  .bv-nav span.on{color:${C1};font-weight:600}
  @media (prefers-reduced-motion: reduce){.bv .far,.bv .hero img{animation:none}}
`;
for (const p of brief.pages) {
  const ctls = (p.controls || []).map(ctlHTML).join("");
  const html = `<style>${CSS}</style>
<div data-dc="bv/root" class="bv">
  <div class="far" data-fx-parallax="0.4"></div>
  <canvas data-fx="particles" data-fx-kind="${particles}" data-fx-n="16" data-fx-colors="#ffffff,${C1},${C2}"></canvas>
  <div class="scroll" data-fx-parallax="1.1">
    ${charFile ? `<div class="hero"><img src="${charFile}" alt=""></div>` : ""}
    <h1>${p.name}</h1>
    <p class="fn">${p.function}</p>
    <div class="glass"><div class="chips">${ctls}</div></div>
    <div class="glass">${(p.layout || []).map((l) => `<div class="bv-row">${l}<span class="sp"></span>·</div>`).join("")}</div>
  </div>
  ${navHTML(p.id)}
</div>
`;
  fs.writeFileSync(path.join(run, "prototype/views", p.id + ".html"), html);
}
// index.html
const idx = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${brief.identity.name_zh}</title><link rel="stylesheet" href="../knowledge/tokens.css"><link rel="stylesheet" href="inspector.css"><link rel="stylesheet" href="utilities.css"></head><body><script>window.DC = ${JSON.stringify({ pages: brief.pages.map((p) => ({ id: p.id, name: p.name, fidelity: "live-high" })) }, null, 0)};</script><div id="dc-shell"></div><script src="runtime.js"></script><script src="inspector.js"></script></body></html>
`;
const dcJson = JSON.stringify({ pages: brief.pages.map((p) => ({ id: p.id, name: p.name, fidelity: "live-high" })) }, null, 0);
const idxPath = path.join(run, "prototype/index.html");
if (!fs.existsSync(idxPath)) fs.writeFileSync(idxPath, idx);
let s0 = fs.readFileSync(idxPath, "utf8");
// 新壳模板占位符注入（__DC_JSON__/__TITLE__），存量壳则替换 window.DC 对象
if (s0.includes("__DC_JSON__")) s0 = s0.replace("__DC_JSON__", dcJson).replaceAll("__TITLE__", brief.identity.name_zh);
else s0 = s0.replace(/window\.DC = \{.*?\};/s, "window.DC = " + dcJson + ";");
fs.writeFileSync(idxPath, s0);
console.log("提示：随后跑 sync-shell.mjs <run>/prototype 落哈希与 utilities.css");
console.log("brief-views:", brief.pages.length, "views");
