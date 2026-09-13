/* design-clone interaction runtime (M44) — 全控件可交互层。
   事件委托，按 data-act 分发；零依赖；壳内由 inspector.js 驱动，独立视图自动 attach。
   控件目录：toggle/radio/checkbox/select/accordion/tab/sheet/dialog/toast/step/slider/back/input/goto/noop。
   纪律：每个可见控件都必须有反应（导航/翻转/选中/展开/弹层/提示），杜绝死按钮。 */
(function () {
  const DCR = {};
  window.DCRuntime = DCR;

  /* ---------- 注入样式（一次） ---------- */
  const CSS = `
  [data-act]{cursor:pointer;-webkit-tap-highlight-color:transparent}
  [data-goto]{cursor:pointer;-webkit-tap-highlight-color:transparent}
  [data-act]:focus-visible{outline:2px solid #1677ff;outline-offset:2px;border-radius:4px}
  .dc-sw{position:relative;display:inline-block;width:46px;height:28px;border-radius:999px;background:#e5e5e5;transition:background .18s;flex:none;vertical-align:middle}
  .dc-sw>i{position:absolute;top:2px;left:2px;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:left .18s}
  .dc-sw.on,.dc-sw[aria-checked="true"]{background:#07c160}
  .dc-sw.on>i,.dc-sw[aria-checked="true"]>i{left:20px}
  .dc-radio{width:20px;height:20px;border-radius:50%;border:2px solid #c8c8c8;display:inline-grid;place-items:center;flex:none;background:#fff}
  .dc-radio.on,.dc-radio[aria-checked="true"]{border-color:#07c160}
  .dc-radio.on::after,.dc-radio[aria-checked="true"]::after{content:"";width:10px;height:10px;border-radius:50%;background:#07c160}
  .dc-check{width:20px;height:20px;border-radius:4px;border:2px solid #c8c8c8;display:inline-grid;place-items:center;flex:none;background:#fff}
  .dc-check.on,.dc-check[aria-checked="true"]{border-color:#07c160;background:#07c160}
  .dc-check.on::after,.dc-check[aria-checked="true"]::after{content:"";width:10px;height:5px;border-left:2px solid #fff;border-bottom:2px solid #fff;transform:rotate(-45deg) translate(1px,-1px)}
  .dc-select{position:relative}
  .dc-select-menu{position:absolute;z-index:30;left:0;right:0;top:100%;margin-top:4px;background:#fff;border:1px solid #e5e5e5;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,.18);overflow:hidden;display:none}
  .dc-select-menu.open{display:block}
  .dc-select-opt{padding:12px 14px;font-size:15px;border-top:1px solid #f0f0f0}
  .dc-select-opt:first-child{border-top:0}
  .dc-select-opt.sel{color:#07c160;font-weight:600}
  .dc-acc-panel{overflow:hidden;max-height:0;transition:max-height .22s ease}
  .dc-acc-panel.open{max-height:600px}
  .dc-tab.on{color:#07c160}
  [data-tab-panel]{display:none}
  [data-tab-panel].on{display:block}
  .dc-rt-mask{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9000;display:flex;align-items:flex-end;justify-content:center}
  .dc-rt-mask.center{align-items:center}
  .dc-rt-sheet{width:100%;max-width:430px;background:#f7f7f7;border-radius:16px 16px 0 0;padding:8px 0 18px;animation:dcUp .22s ease}
  .dc-rt-dialog{width:82%;max-width:340px;background:#fff;border-radius:14px;padding:20px;text-align:center;animation:dcPop .18s ease}
  @keyframes dcUp{from{transform:translateY(40px);opacity:.4}to{transform:none;opacity:1}}
  @keyframes dcPop{from{transform:scale(.94);opacity:.4}to{transform:none;opacity:1}}
  .dc-rt-sheet .sh-t{font-size:13px;color:#767676;text-align:center;padding:8px 0 12px}
  .dc-rt-sheet .sh-i{background:#fff;padding:15px 18px;font-size:16px;text-align:center;border-top:1px solid #f0f0f0}
  .dc-rt-sheet .sh-i:first-of-type{border-top:0}
  .dc-rt-sheet .sh-c{margin:10px 14px 0;background:#fff;border-radius:10px;padding:15px;text-align:center;font-size:16px;color:#767676}
  .dc-rt-dialog h4{font-size:17px;font-weight:600;margin-bottom:8px}
  .dc-rt-dialog p{font-size:14px;color:#767676;line-height:1.5}
  .dc-rt-dialog .dg-b{margin-top:16px;display:flex;gap:10px;justify-content:center}
  .dc-rt-dialog .dg-b button{flex:1;padding:9px;border-radius:8px;font-size:15px;background:#f2f2f2}
  .dc-rt-dialog .dg-b button.pr{background:#07c160;color:#fff}
  #dc-rt-toast{position:fixed;left:50%;bottom:14%;transform:translateX(-50%);z-index:9500;background:rgba(40,40,40,.92);color:#fff;font-size:14px;padding:10px 18px;border-radius:8px;max-width:70%;text-align:center;opacity:0;transition:opacity .2s;pointer-events:none}
  #dc-rt-toast.show{opacity:1}
  .dc-slider{position:relative;height:28px;display:flex;align-items:center}
  .dc-slider .tr{position:relative;flex:1;height:4px;border-radius:2px;background:#e5e5e5}
  .dc-slider .fl{position:absolute;left:0;top:0;height:4px;border-radius:2px;background:#07c160;width:var(--p,40%)}
  .dc-slider .th{position:absolute;left:var(--p,40%);width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.3);transform:translateX(-9px)}
  `;
  function injectCSS() {
    if (!document.getElementById("dc-fx-css")) {
      const st = document.createElement("style"); st.id = "dc-fx-css";
      st.textContent = 'canvas[data-fx="particles"]{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3}[data-fx-parallax]{will-change:transform;transition:transform .22s ease-out}';
      (document.head || document.documentElement).appendChild(st);
    }
    if (document.getElementById("dc-runtime-css")) return;
    const s = document.createElement("style");
    s.id = "dc-runtime-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ---------- 工具 ---------- */
  const rootOf = (el) => el.closest("#dc-stage") || el.closest("#dc-rt-host") || document;
  const resolve = (el, sel) => {
    if (!sel) return null;
    const r = rootOf(el);
    try { return r.querySelector(sel) || document.querySelector(sel); } catch { return null; }
  };
  const hooks = () => window.DCRuntimeHooks || {};
  let toastTimer = null;
  function toast(msg) {
    const h = hooks();
    if (h.toast) { h.toast(msg); return; }
    let t = document.getElementById("dc-rt-toast");
    if (!t) { t = document.createElement("div"); t.id = "dc-rt-toast"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }
  function goto(id) {
    const h = hooks();
    if (h.goto) { h.goto(id); return; }
    location.hash = "#pages/" + id;
  }
  function doBack(el) {
    const h = hooks();
    if (h.back) { h.back(); return; }
    if (history.length > 1) history.back();
  }

  /* ---------- 弹层 ---------- */
  function overlay(center) {
    const m = document.createElement("div");
    m.className = "dc-rt-mask" + (center ? " center" : "");
    m.setAttribute("role", "dialog");
    document.body.appendChild(m);
    const close = () => { m.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    m.addEventListener("click", (e) => { if (e.target === m) close(); });
    document.addEventListener("keydown", onKey);
    m.__close = close;
    return m;
  }
  function openSheet(el) {
    const id = el.dataset.sheetId;
    const m = overlay(false);
    if (id) {
      const src = resolve(el, id);
      if (src) { const c = src.cloneNode(true); c.removeAttribute("hidden"); c.classList.add("dc-rt-sheet"); m.appendChild(c); return; }
    }
    const title = el.dataset.title || "";
    const items = (el.dataset.items || "").split("|").filter(Boolean);
    const sheet = document.createElement("div");
    sheet.className = "dc-rt-sheet";
    sheet.innerHTML = (title ? `<div class="sh-t">${title}</div>` : "") +
      items.map((i) => `<div class="sh-i">${i}</div>`).join("") +
      `<div class="sh-c">取消</div>`;
    m.appendChild(sheet);
    sheet.querySelector(".sh-c").onclick = () => m.__close();
    sheet.querySelectorAll(".sh-i").forEach((n) => (n.onclick = () => { m.__close(); toast(n.textContent); }));
  }
  function openDialog(el) {
    const m = overlay(true);
    const d = document.createElement("div");
    d.className = "dc-rt-dialog";
    d.innerHTML = `<h4>${el.dataset.title || "提示"}</h4><p>${el.dataset.body || ""}</p>
      <div class="dg-b"><button class="cancel">取消</button><button class="pr ok">${el.dataset.ok || "确定"}</button></div>`;
    m.appendChild(d);
    d.querySelector(".cancel").onclick = () => m.__close();
    d.querySelector(".ok").onclick = () => { m.__close(); toast(el.dataset.okToast || "已确认"); };
  }

  /* ---------- 各控件行为 ---------- */
  function flipSwitch(el) {
    const on = el.getAttribute("aria-checked") === "true" || el.classList.contains("on");
    el.setAttribute("aria-checked", String(!on));
    el.classList.toggle("on", !on);
  }
  function selectRadio(el) {
    const g = el.dataset.group || "";
    const scope = el.closest("[data-radio-group]") || rootOf(el);
    scope.querySelectorAll(`[data-act="radio"]${g ? `[data-group="${g}"]` : ""}`).forEach((r) => {
      r.classList.remove("on"); r.setAttribute("aria-checked", "false");
    });
    el.classList.add("on"); el.setAttribute("aria-checked", "true");
  }
  function toggleSelect(el) {
    const box = el.closest(".dc-select") || el.parentElement;
    const menu = box.querySelector("[data-select-menu]") || el.nextElementSibling;
    if (!menu) { toast(el.dataset.msg || "选择"); return; }
    const open = menu.classList.toggle("open");
    el.setAttribute("aria-expanded", String(open));
  }
  function chooseOption(el) {
    const box = el.closest(".dc-select") || el.parentElement.parentElement;
    const menu = el.closest("[data-select-menu]");
    box.querySelectorAll("[data-select-opt]").forEach((o) => o.classList.remove("sel"));
    el.classList.add("sel");
    const val = box.querySelector("[data-select-value]");
    if (val) val.textContent = el.dataset.value || el.textContent.trim();
    if (menu) { menu.classList.remove("open"); }
    const trig = box.querySelector('[data-act="select"]');
    if (trig) trig.setAttribute("aria-expanded", "false");
  }
  function toggleAccordion(el) {
    const panel = resolve(el, el.dataset.target) || el.nextElementSibling;
    if (!panel) return;
    const open = panel.classList.toggle("open");
    if (open) panel.removeAttribute("hidden"); else if (panel.dataset.accHide === "1") panel.setAttribute("hidden", "");
    el.classList.toggle("open", open);
    el.setAttribute("aria-expanded", String(open));
  }
  function activateTab(el) {
    const g = el.dataset.group || "";
    const scope = el.closest("[data-tab-group]") || rootOf(el);
    scope.querySelectorAll(`[data-act="tab"]${g ? `[data-group="${g}"]` : ""}`).forEach((t) => {
      t.classList.remove("on"); t.setAttribute("aria-selected", "false");
    });
    el.classList.add("on"); el.setAttribute("aria-selected", "true");
    const name = el.dataset.tab;
    scope.querySelectorAll("[data-tab-panel]").forEach((p) => {
      p.classList.toggle("on", !name || p.dataset.tabPanel === name);
    });
  }
  function stepper(el) {
    const dir = parseFloat(el.dataset.dir || "1");
    const step = parseFloat(el.dataset.step || "1");
    const target = resolve(el, el.dataset.target) || el.parentElement.querySelector("[data-stepper-val]");
    if (!target) { toast(el.dataset.msg || "已调整"); return; }
    let v = parseFloat((target.textContent || "0").replace(/[^\d.-]/g, "")) || 0;
    v = Math.round((v + dir * step) * 100) / 100;
    const min = parseFloat(el.dataset.min), max = parseFloat(el.dataset.max);
    if (!isNaN(min) && v < min) v = min;
    if (!isNaN(max) && v > max) v = max;
    target.textContent = (el.dataset.prefix || "") + v + (el.dataset.suffix || "");
  }
  function slider(el, ev) {
    const track = el.querySelector(".tr") || el;
    const r = track.getBoundingClientRect();
    let p = ev && ev.clientX ? (ev.clientX - r.left) / r.width : (parseFloat(el.getAttribute("aria-valuenow")) || 50) / 100 + 0.1;
    p = Math.max(0, Math.min(1, p));
    el.style.setProperty("--p", (p * 100).toFixed(1) + "%");
    el.setAttribute("aria-valuenow", String(Math.round(p * 100)));
    const out = resolve(el, el.dataset.target) || el.parentElement.querySelector("[data-slider-val]");
    if (out) out.textContent = Math.round(p * 100) + (el.dataset.suffix || "%");
  }
  function focusInput(el) {
    const t = resolve(el, el.dataset.target) || el.querySelector("input,textarea") || (el.tagName === "INPUT" || el.tagName === "TEXTAREA" ? el : null);
    if (t) { t.focus(); if (t.select) t.select(); }
    else if (el.dataset.msg) toast(el.dataset.msg);
  }

  /* ---------- 主分发 ---------- */
  DCR.handleClick = function (el, ev) {
    injectCSS();
    const act = el.getAttribute("data-act");
    switch (act) {
      case "toggle": flipSwitch(resolve(el, el.dataset.target) || el); break; // M49：标签可指向开关（data-target），点击文字=拨开关
      case "radio": selectRadio(el); break;
      case "checkbox": flipSwitch(el); break;
      case "select": toggleSelect(el); break;
      case "select-opt": chooseOption(el); break;
      case "accordion": toggleAccordion(el); break;
      case "tab": activateTab(el); break;
      case "sheet": openSheet(el); break;
      case "dialog": openDialog(el); break;
      case "toast": toast(el.dataset.msg || el.textContent.trim() || "已操作"); break;
      case "step": stepper(el); break;
      case "slider": slider(el, ev); break;
      case "back": doBack(el); break;
      case "input": focusInput(el); break;
      case "goto": goto(el.dataset.to || el.dataset.goto); break;
      case "noop": toast(el.dataset.msg || "原型占位（范围外）"); break;
      default: return false;
    }
    return true;
  };

  /* ---------- a11y 增强 ---------- */
  const ROLE = { toggle: "switch", checkbox: "checkbox", radio: "radio", tab: "tab", select: "button", accordion: "button", sheet: "button", dialog: "button", step: "button", slider: "slider", back: "button", input: "button", goto: "button", toast: "button", noop: "button" };
  DCR.enhance = function (root) {
    injectCSS();
    DCR.fx(root);
    (root || document).querySelectorAll("[data-act]").forEach((el) => {
      const act = el.getAttribute("data-act");
      const nativeForm = /^(input|textarea|select)$/i.test(el.tagName);
      if (!el.getAttribute("role") && ROLE[act] && !nativeForm) el.setAttribute("role", ROLE[act]);
      if (act === "toggle" || act === "checkbox") { if (!el.hasAttribute("aria-checked")) el.setAttribute("aria-checked", el.classList.contains("on") ? "true" : "false"); }
      if (act === "radio") { if (!el.hasAttribute("aria-checked")) el.setAttribute("aria-checked", el.classList.contains("on") ? "true" : "false"); }
      if (act === "tab") { if (!el.hasAttribute("aria-selected")) el.setAttribute("aria-selected", el.classList.contains("on") ? "true" : "false"); }
      if (!nativeForm && !/^(button|a)$/i.test(el.tagName) && !el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
    });
  };

  /* ---------- M76-W3b FX：粒子场 + 指针视差（2.5D 分层假 3D，无外部依赖） ---------- */
  const FX_RM = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  function fxParticles(cv) {
    if (cv.__dcFx || FX_RM.matches) return; cv.__dcFx = 1;
    const kind = cv.getAttribute("data-fx-kind") || "motes";
    const n = Math.max(6, Math.min(32, +(cv.getAttribute("data-fx-n") || 22)));
    const cols = (cv.getAttribute("data-fx-colors") || "").split(",").map((x) => x.trim()).filter(Boolean);
    const ctx = cv.getContext("2d");
    let W = 0, H = 0, ps = [];
    const fit = () => { const d = window.devicePixelRatio || 1; W = cv.width = Math.max(1, cv.clientWidth * d); H = cv.height = Math.max(1, cv.clientHeight * d); };
    const mk = (init) => ({ x: Math.random() * W, y: init ? Math.random() * H : (kind === "petals" ? -10 : H + 10), r: (kind === "petals" ? 3 + Math.random() * 4 : 1 + Math.random() * 2.4) * (window.devicePixelRatio || 1), v: (.1 + Math.random() * .28) * (window.devicePixelRatio || 1), ph: Math.random() * 6.283, sw: .4 + Math.random() * .9, c: cols.length ? cols[(Math.random() * cols.length) | 0] : kind === "sparkles" ? "#ffffff" : "#ffffff" });
    fit(); ps = Array.from({ length: n }, () => mk(true));
    let t = 0;
    const tick = () => {
      t += .016; ctx.clearRect(0, 0, W, H);
      for (const p of ps) {
        if (kind === "petals") { p.y += p.v * 1.6; p.x += Math.sin(t * p.sw + p.ph) * .5; if (p.y > H + 12) Object.assign(p, mk(false)); }
        else if (kind === "motes") { p.y -= p.v * .8; p.x += Math.sin(t * p.sw + p.ph) * .3; if (p.y < -12) Object.assign(p, mk(false), { y: H + 10 }); }
        const tw = kind === "sparkles" ? .35 + .65 * Math.abs(Math.sin(t * 1.7 + p.ph)) : .5 + .3 * Math.sin(t * p.sw + p.ph);
        ctx.globalAlpha = Math.max(.08, tw * .8);
        ctx.fillStyle = p.c;
        ctx.beginPath();
        if (kind === "petals") { ctx.ellipse(p.x, p.y, p.r * 1.5, p.r * .8, Math.sin(t + p.ph) * .8, 0, 6.283); }
        else { ctx.arc(p.x, p.y, p.r, 0, 6.283); }
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    window.addEventListener("resize", fit, { passive: true });
  }
  function fxParallax(root) {
    if (root.__dcFxP || FX_RM.matches) return; root.__dcFxP = 1;
    root.addEventListener("pointermove", (e) => {
      const r = root.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - .5, dy = (e.clientY - r.top) / r.height - .5;
      root.querySelectorAll("[data-fx-parallax]").forEach((el) => {
        const d = +el.getAttribute("data-fx-parallax") || 1;
        el.style.transform = `translate3d(${(-dx * 8 * d).toFixed(1)}px, ${(-dy * 6 * d).toFixed(1)}px, 0) scale(${1 + .015 * d})`;
      });
    }, { passive: true });
  }
  DCR.fx = function (root) {
    (root || document).querySelectorAll('canvas[data-fx="particles"]').forEach(fxParticles);
    fxParallax(root || document);
  };

  /* ---------- 委托绑定 ---------- */
  DCR.attach = function (root) {
    root = root || document;
    if (root.__dcRtBound) return;
    root.__dcRtBound = true;
    root.addEventListener("click", (e) => {
      const el = e.target.closest("[data-act]");
      if (!el || !root.contains(el)) return;
      if (e.target.closest('[data-act="select-opt"]') && el.getAttribute("data-act") !== "select-opt") return;
      e.preventDefault();
      DCR.handleClick(el, e);
    });
    root.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
      const el = e.target.closest && e.target.closest("[data-act]");
      if (!el) return;
      e.preventDefault();
      DCR.handleClick(el, e);
    });
    DCR.enhance(root);
  };

  /* 独立视图（非壳）自动接管；壳内由 inspector.js 显式驱动，避免双触发。 */
  function boot() {
    injectCSS();
    if (!document.getElementById("dc-stage")) DCR.attach(document);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
