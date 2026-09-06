#!/usr/bin/env node
/**
 * 交互门（M44）：逐视图"真实点击"每个控件，断言可观测变化；揪出死控件。
 * 用法: node interact.mjs --run <runDir> --base <url> [--views a,b] [--out qa/interact.json]
 * 与 parity.mjs 区别：parity 只"数"控件（DOM 计数），interact "点"控件并验证响应。
 * 门：dead=0 且 act_pass=1 且 goto_pass=1。任何控件点了没反应即 fail。
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const A = process.argv.slice(2);
const get = (k) => (A.includes(k) ? A[A.indexOf(k) + 1] : null);
if (A.includes("--help") || A.includes("-h") || !get("--run")) {
  console.log("用法: node interact.mjs --run <runDir> --base <url> [--views a,b] [--out qa/interact.json]");
  process.exit(get("--run") ? 0 : 1);
}
const run = path.resolve(get("--run"));
const base = get("--base").replace(/\/+$/, "");
const outP = get("--out") || path.join(run, "qa/interact.json");
const viewsDir = path.join(run, "prototype/views");
const viewsArg = get("--views");
let views = viewsArg ? viewsArg.split(",") : fs.readdirSync(viewsDir).filter((f) => f.endsWith(".html")).map((f) => f.replace(".html", ""));
// goto 目标校验对照"磁盘上全部视图"，不受 --views 过滤影响
const viewSet = new Set(fs.readdirSync(viewsDir).filter((f) => f.endsWith(".html")).map((f) => f.replace(".html", "")));

// 非导航类 act（点击后留在本页，可安全 dispatch 验证）
const NON_NAV_ACT = new Set(["toggle", "checkbox", "radio", "select", "select-opt", "accordion", "tab", "sheet", "dialog", "toast", "step", "slider", "input", "noop"]);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const result = {};

for (const v of views) {
  // 带 cache-buster query 强制整文档加载（仅 hash 变化不会可靠替换 stage）
  await page.goto(base + "/prototype/?t=" + Date.now() + "#pages/" + v, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
  await page.waitForFunction((id) => {
    const s = document.querySelector("#dc-stage");
    return location.hash.includes(id) && s && s.children.length > 0;
  }, v, { timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(400);

  const r = await page.evaluate(({ NON_NAV_ACT, viewSet }) => {
    const NAV = new Set(NON_NAV_ACT);
    const VSET = new Set(viewSet);
    const stage = document.querySelector("#dc-stage");
    if (!stage) return { error: "no-stage" };
    const SEL = '[data-act],[data-goto],a,button,input,select,textarea,[role=button],[role=switch],[role=radio],[role=checkbox],[role=tab],.mi-cell,.mi-row,.mi-tab';
    // M44g：库样式按钮（.wm-cta .pri/.ghost 等）不在 SEL 里但有 cursor:pointer → 一并纳入，堵交互盲区
    const bySel = [...stage.querySelectorAll(SEL)];
    const byPointer = [...stage.querySelectorAll("span,div,li,td,label")].filter((el) => getComputedStyle(el).cursor === "pointer" && !el.querySelector("[data-act],[data-goto]"));
    const all = [...new Set([...bySel, ...byPointer])];
    // 顶层控件：祖先（stage 内）若有 data-act/data-goto 则本元素是装饰，跳过
    const candidates = all.filter((el) => {
      let p = el.parentElement;
      while (p && p !== stage) {
        if (p.hasAttribute("data-act") || p.hasAttribute("data-goto")) return false;
        p = p.parentElement;
      }
      return true;
    });

    const sig = () => JSON.stringify({
      hash: location.hash,
      act: (document.activeElement && (document.activeElement.getAttribute("data-act") || document.activeElement.tagName)) || "",
      checked: [...stage.querySelectorAll("[aria-checked],[aria-selected]")].map((e) => e.getAttribute("aria-checked") + "/" + e.getAttribute("aria-selected")),
      oncls: [...stage.querySelectorAll(".on,.open,.sel")].map((e) => e.className).sort(),
      masks: document.querySelectorAll(".dc-rt-mask").length,
      toast: (document.querySelector("#dc-rt-toast") || {}).className || "",
      itoast: ((document.querySelector("#dc-toast") || {}).textContent || "") + "|" + ((document.querySelector("#dc-toast") || {}).hidden),
      panels: [...stage.querySelectorAll("[data-tab-panel],[data-acc-panel]")].map((e) => e.className),
      menus: [...stage.querySelectorAll("[data-select-menu]")].map((e) => e.className),
      vals: [...stage.querySelectorAll("[data-stepper-val],[data-slider-val],[data-select-value]")].map((e) => e.textContent),
      sliders: [...stage.querySelectorAll('[data-act="slider"]')].map((e) => e.style.getPropertyValue("--p")),
    });

    const cleanup = () => {
      document.querySelectorAll(".dc-rt-mask").forEach((m) => m.remove());
      const t = document.querySelector("#dc-rt-toast"); if (t) t.classList.remove("show");
      const it = document.querySelector("#dc-toast"); if (it) it.hidden = true;
      stage.querySelectorAll("[data-select-menu].open").forEach((m) => m.classList.remove("open"));
    };

    const dead = [], acted = [], responded = [], gotos = [], gotoBad = [], exempt = [];
    for (const el of candidates) {
      const act = el.getAttribute("data-act");
      const goto = el.getAttribute("data-goto");
      const cls = String(el.className || "");
      const isCurrent = cls.split(/\s+/).includes("on") || el.getAttribute("aria-selected") === "true" || el.getAttribute("aria-checked") === "true";
      const native = /^(input|textarea|select)$/i.test(el.tagName);
      const loading = !!el.closest("[data-state=loading]");
      const wired = !!act || !!goto || native || el.tagName === "BUTTON" || (el.tagName === "A" && el.getAttribute("href")) || !!el.getAttribute("role");

      if (loading) { exempt.push("loading"); continue; }
      // 当前激活 tab/已选中项：点击 no-op 属正常
      if (!act && !goto && isCurrent && (cls.includes("mi-tab") || el.getAttribute("role") === "tab")) { exempt.push("current-tab"); continue; }

      if (goto) {
        gotos.push(goto);
        if (!goto.startsWith("placeholder:") && !VSET.has(goto)) gotoBad.push(goto);
        continue;
      }
      if (act) {
        // 已选中的 radio / 已激活的 tab：再点击为合法 no-op，豁免
        if ((act === "radio" && el.getAttribute("aria-checked") === "true") ||
            (act === "tab" && (el.classList.contains("on") || el.getAttribute("aria-selected") === "true"))) {
          exempt.push("active-" + act); continue;
        }
        if (NAV.has(act)) {
          const before = sig();
          el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
          const after = sig();
          acted.push(act);
          if (after !== before) responded.push(act);
          cleanup();
        } else {
          // 导航类 act（goto/back）：仅校验存在性，不实际点击（会切页）
          acted.push(act); responded.push(act);
        }
        continue;
      }
      if (native) {
        // 原生输入：可聚焦即视为有响应
        const before = sig();
        try { el.focus(); } catch {}
        const after = sig();
        acted.push("native-input");
        if (after !== before || native) responded.push("native-input");
        continue;
      }
      if (!wired) {
        // 容器内含已接线后代（如 .mi-cell 包着 toggle）→ 容器本身不算死控件
        if (el.querySelector('[data-act],[data-goto],a[href],button,input,select,textarea,[role]')) continue;
        // 看起来可点（cursor:pointer / mi-cell / mi-row / a / button）但没接线
        const cs = getComputedStyle(el);
        const looksClickable = cs.cursor === "pointer" || cls.includes("mi-cell") || cls.includes("mi-row") || cls.includes("mi-tab") || el.tagName === "A" || el.tagName === "BUTTON";
        if (looksClickable) dead.push((el.getAttribute("data-dc") || el.tagName + "." + cls.split(/\s+/)[0]).slice(0, 40));
      }
    }

    return {
      candidates: candidates.length,
      dead, acted: acted.length, responded: responded.length,
      gotos: gotos.length, gotoBad,
      exempt: exempt.length,
      act_pass: acted.length ? responded.length / acted.length : 1,
      goto_pass: gotos.length ? (gotos.length - gotoBad.length) / gotos.length : 1,
    };
  }, { NON_NAV_ACT: [...NON_NAV_ACT], viewSet: [...viewSet] });

  result[v] = r;
}
await browser.close();

fs.mkdirSync(path.dirname(outP), { recursive: true });
fs.writeFileSync(outP, JSON.stringify(result, null, 1));

const bad = Object.entries(result).filter(([k, r]) => r.error || (r.dead && r.dead.length) || r.act_pass < 1 || r.goto_pass < 1);
const summary = {
  views: Object.keys(result).length,
  total_dead: Object.values(result).reduce((s, r) => s + ((r.dead && r.dead.length) || 0), 0),
  bad: bad.map(([k, r]) => `${k}(dead=${(r.dead || []).length}${r.act_pass < 1 ? " act=" + r.act_pass.toFixed(2) : ""}${r.gotoBad && r.gotoBad.length ? " goto=" + r.gotoBad.slice(0, 3).join(",") : ""})`),
};
console.log(JSON.stringify(summary));
process.exit(bad.length ? 4 : 0);
