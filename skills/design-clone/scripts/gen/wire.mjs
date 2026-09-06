#!/usr/bin/env node
/**
 * wire.mjs — 通用死控件自动接线（M44/P2）。让任意 run 快速达到 interact 门 dead=0。
 * 规则（与 qa/interact.mjs 的死控件定义对齐）：可点但无 data-act/data-goto/href/role、非当前 tab、
 * 非 loading、不含已接线后代的元素 → 按契约接线：
 *   开关形(.dc-sw/[class*=switch|toggle]) → data-act=toggle (+role/aria-checked)
 *   tab 形(.mi-tab/role=tab，非当前)      → data-act=tab (+data-group/data-tab)
 *   其余（行/卡/按钮/icon）                → data-act=toast data-msg="<标签>（演示）"（契约兜底，非臆造）
 * 只兜底不臆造真实业务行为；高价值真控件（真弹层/真跳转）事后手工升级。幂等：已有 data-act 不动。
 * 用法: node wire.mjs <runDir> [--views a,b] [--dry]
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const HERE = path.dirname(new URL(import.meta.url).pathname);
const { chromium } = require("playwright");

const A = process.argv.slice(2);
const runArg = A.find((x) => !x.startsWith("-"));
if (!runArg || A.includes("--help") || A.includes("-h")) {
  console.log("用法: node wire.mjs <runDir> [--views a,b] [--dry]");
  process.exit(runArg ? 0 : 1);
}
const run = path.resolve(runArg);
const viewsDir = path.join(run, "prototype/views");
const dry = A.includes("--dry");
const viewsArg = A.includes("--views") ? A[A.indexOf("--views") + 1].split(",") : null;
if (!fs.existsSync(viewsDir)) { console.log(JSON.stringify({ error: "no views dir" })); process.exit(1);
}
let views = (viewsArg || fs.readdirSync(viewsDir).filter((f) => f.endsWith(".html")).map((f) => f.replace(".html", "")));

const WIRE_FN = `
function wireRoot(root){
  const SEL='a,button,.mi-cell,.mi-row,.mi-tab,[style*="cursor:pointer"],[class*="cursor-pointer"]';
  // M44g：与 interact 门同口径——computed cursor:pointer 的元素也算可点控件
  const cands=(root)=>{const a=[...root.querySelectorAll(SEL)];const b=[...root.querySelectorAll('span,div,li,td,label')].filter(el=>getComputedStyle(el).cursor==='pointer'&&!el.querySelector('[data-act],[data-goto]'));return [...new Set([...a,...b])]};
  const ancWired=(el,root)=>{let p=el.parentElement;while(p&&p!==root){if(p.hasAttribute('data-act')||p.hasAttribute('data-goto'))return true;p=p.parentElement;}return false;};
  const clean=(s)=>String(s||'').replace(/\\s+/g,' ').trim();
  const isWired=(el)=>el.hasAttribute('data-act')||el.hasAttribute('data-goto')||el.hasAttribute('role')||(el.tagName==='A'&&el.getAttribute('href'));
  const inLoading=(el)=>!!el.closest('[data-state=loading]');
  const hasWiredDesc=(el)=>!!el.querySelector('[data-act],[data-goto]');
  const isOn=(el)=>(' '+el.className+' ').includes(' on ')||el.getAttribute('aria-selected')==='true'||el.getAttribute('aria-checked')==='true';
  const label=(el)=>{const t=clean(el.textContent).slice(0,18);return t||el.getAttribute('data-dc')||'操作';};
  let added=0; const labels=[];
  // pass1: 开关
  for(const sw of root.querySelectorAll('.dc-sw,[class*="switch"],[class*="toggle"]')){
    if(isWired(sw)||inLoading(sw))continue;
    sw.setAttribute('data-act','toggle');
    if(!sw.getAttribute('role'))sw.setAttribute('role','switch');
    if(!sw.hasAttribute('aria-checked'))sw.setAttribute('aria-checked',isOn(sw)?'true':'false');
    added++; labels.push('toggle:'+label(sw.closest('.mi-cell')||sw));
  }
  // pass2: 其余死控件
  for(const el of cands(root)){
    if(isWired(el)||inLoading(el)||hasWiredDesc(el)||ancWired(el,root))continue;
    if(isOn(el)&&(el.className.includes('mi-tab')||el.getAttribute('role')==='tab'))continue; // 当前 tab no-op 豁免
    if(el.className.includes('mi-tab')||el.getAttribute('role')==='tab'){
      el.setAttribute('data-act','tab'); el.setAttribute('data-group','wg'); el.setAttribute('data-tab',label(el));
      added++; labels.push('tab:'+label(el)); continue;
    }
    el.setAttribute('data-act','toast'); el.setAttribute('data-msg',label(el).replace(/"/g,'')+'（演示）');
    added++; labels.push('toast:'+label(el));
  }
  return { added, labels };
}
`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
// M44g：必须带 run 的真 CSS（computed cursor:pointer 才可见）→ 起服务逐页在 #dc-stage 上接线后写回
const { spawn } = await import("node:child_process");
const port = 4410 + (process.pid % 40);
const srv = spawn("node", [path.join(HERE, "..", "serve.mjs"), run, "--port", String(port)], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 1500));
const base = `http://localhost:${port}`;
const report = {};
for (const v of views) {
  const f = path.join(viewsDir, v + ".html");
  await page.goto(base + "/prototype/?chrome=0&ann=0#pages/" + v, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
  await page.waitForFunction((id) => { const s = document.querySelector("#dc-stage"); return location.hash.includes(id) && s && s.children.length > 0; }, v, { timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(250);
  const res = await page.evaluate(({ WIRE_FN }) => {
    const wireRoot = new Function(WIRE_FN + "; return wireRoot;")();
    return wireRoot(document.querySelector("#dc-stage"));
  }, { WIRE_FN });
  if (!dry && res.added) {
    const out = await page.evaluate(() => document.querySelector("#dc-stage").innerHTML);
    fs.writeFileSync(f, out);
  }
  report[v] = res;
}
srv.kill();
await browser.close();
const total = Object.values(report).reduce((s, r) => s + r.added, 0);
console.log(JSON.stringify({ dry, views: views.length, wired: total, per: Object.fromEntries(Object.entries(report).filter(([k, r]) => r.added || dry).map(([k, r]) => [k, dry ? r.labels : r.added])) }, null, 1));
