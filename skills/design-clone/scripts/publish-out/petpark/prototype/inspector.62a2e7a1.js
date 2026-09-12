/* inspector 分段 00-head.js —— IIFE 入口 + DOM 助手($/$$) + 元素引用(W) + 全局状态(S) + query(Q)
 * 源文件按文件名顺序拼接为 prototype/inspector.js（scripts/build-shell.mjs），同一 IIFE 闭包。
 * 约定：JS 只写几何与状态；排版/配色一律 inspector.css 类 + 主题变量。
 */
/* design-clone inspector v4 — M14：URL 状态/面包屑/整卡场景/flowZoom/无边框标注/图标底栏/
   边框开关+状态栏/详情单看板/导出分组/分享截图/modal/播放器/代码视图/设备下拉/对照回退链 */
(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const W = {};
  W.workspace = $("#dc-workspace"); W.zoomwrap = $("#dc-zoomwrap"); W.phone = $("#dc-phone");
  W.screen = $("#dc-screen"); W.stage = $("#dc-stage"); W.overlay = $("#dc-overlay");
  W.single = $("#dc-single"); W.flow = $("#dc-flow"); W.canvas = $("#dc-flow-canvas");

  const S = {
    ia: "pages", flowMode: "tree", selNode: null, selPath: 0, page: null, selected: null,
    edit: false, ann: false, hand: false, scale: 1, fzoom: 1, vm: "preview",
    frame: localStorage.getItem("dc-frame") === "1", labels: localStorage.getItem("dc-labels") === "1",
    device: null, ann_data: {}, journeys: [], products: {}, paths: null, srcmap: {},
    overrides: {}, undo: [], demo: { active: false, timer: null, speed: 1, paused: false },
    play: null, lastHTML: "", variants: {}, filter: "",
  };
  const KIND_COLOR = { navigate: "#07C160", dialog: "#1677FF", toast: "#FA9D3B", state: "#1677FF", instant: "#FA9D3B", blocked: "#FA5151" };
  const KIND_CN = { navigate: "跳转", dialog: "弹窗", toast: "提示", state: "状态变化", instant: "即时反馈", blocked: "安全拦截" };
  const TOKEN_KEYS = ["--color-primary", "--color-accent", "--color-bg", "--color-surface", "--color-text-primary", "--color-text-secondary", "--color-border", "--color-link", "--radius-card"];
  const Q = new URLSearchParams(location.search);
/* inspector 分段 10-config.js —— 单一真源配置：DEVICES/SHELL_ALIAS/SHORTCUTS/EXPORT_MODES/TOKEN_KEYS/KIND_*
 * 源文件按文件名顺序拼接为 prototype/inspector.js（scripts/build-shell.mjs），同一 IIFE 闭包。
 * 约定：JS 只写几何与状态；排版/配色一律 inspector.css 类 + 主题变量。
 */
  /* ---------- 单一真源配置（M44k）：设备/壳类/尺寸/快捷键此前散落在 index.html + 3 处 JS 映射，
     改名与改档必须多处同步（用户看到的"浏览器窗/桌面窗"与代码里的 dc-browser 就是因此对不上）。 ---------- */
  const DEVICES = [
    { cls: "dc-mobile", label: "手机", long: "移动端页面", size: [390, 844], touch: true },
    { cls: "dc-tablet", label: "平板", long: "平板应用", size: [834, 1194], touch: true },
    { cls: "dc-desktop", label: "桌面", long: "原生桌面应用（OS 窗）", size: [1280, 800], touch: false },
    { cls: "dc-browser", label: "网页", long: "桌面网页（浏览器窗）", size: [1280, 800], touch: false },
  ];
  /** platform.json 的 shell 取值 → 设备档（含历史别名） */
  const SHELL_ALIAS = {
    c_mobile: "dc-mobile", mobile: "dc-mobile",
    c_tablet: "dc-tablet", tablet: "dc-tablet",
    c_desktop: "dc-desktop", desktop: "dc-desktop",
    c_browser: "dc-browser", c_browser2: "dc-browser", web: "dc-browser",
  };
  const deviceOf = (cls) => DEVICES.find((d) => d.cls === cls) || DEVICES[0];
  const SHORTCUTS = [
    ["1", "页面模式"], ["2", "场景模式（树 / 路径）"], ["P", "播放路径（页面模式=从当前页起播）"],
    ["D", "演示模式（字幕 + 模拟弹窗 + 总结卡）"], ["E", "编辑模式（拖拽 / 改样式，Ctrl+Z 撤销）"],
    ["A", "标注模式（点元素即可新增/编辑批注）"], ["H", "抓手平移"], ["F", "设备边框 + 状态栏"],
    ["0", "缩放 1:1"], ["+ / −", "缩放"], ["Ctrl/⌘ + 滚轮", "画布缩放"], ["Alt + 悬停元素", "测量间距"],
    ["Esc", "退出播放 / 演示"], ["?", "本帮助"],
  ];
  const EXPORT_MODES = [
    { id: "download", label: "本地下载 zip" },
    { id: "dir", label: "选目录导出" },
    { id: "server", label: "仅存服务端" },
  ];

  const el = (sel) => String(sel || "").startsWith("auto:")
    ? W.stage.querySelector(`[data-dc-auto="${sel}"]`)
    : W.stage.querySelector(`[data-dc="${sel}"]`);
  // M47：无 data-dc 的小控件合成选中 id（能点有反应的就该能选中/进看板）
  const synthId = (t) => "auto:" + t.tagName.toLowerCase() + ":" + (t.getAttribute("data-act") || t.getAttribute("data-goto") || t.getAttribute("role") || "ctl") + ":" + String(t.getAttribute("data-msg") || t.textContent || t.getAttribute("name") || "").trim().replace(/\s+/g, "").slice(0, 12);
  const toWS = (r) => { const w = W.workspace.getBoundingClientRect(); return { x: r.left - w.left, y: r.top - w.top, r: r.right - w.left, b: r.bottom - w.top, cx: (r.left + r.right) / 2 - w.left, cy: (r.top + r.bottom) / 2 - w.top, w: r.width, h: r.height }; };
  const rgb2hex = (c) => { const m = c.match(/rgba?\(([\d.]+), ([\d.]+), ([\d.]+)/); if (!m) return c; return "#" + [m[1], m[2], m[3]].map((v) => Math.round(+v).toString(16).padStart(2, "0")).join(""); };
  const idxOf = (id) => (id || "").slice(0, 2);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
/* inspector 分段 20-ui.js —— UI 原语：modal(含 fields 表单)/notify/写盘 writeFile/读盘 readJSON
 * 源文件按文件名顺序拼接为 prototype/inspector.js（scripts/build-shell.mjs），同一 IIFE 闭包。
 * 约定：JS 只写几何与状态；排版/配色一律 inspector.css 类 + 主题变量。
 */
  /* ---------- modal（M44k：支持 fields 多字段表单，标注/产品编辑复用同一原语） ---------- */
  function modal({ title, body = "", input = null, fields = null, actions = [{ id: "ok", label: "好", pr: true }] }) {
    return new Promise((res) => {
      const root = $("#dc-modal-root");
      const mask = document.createElement("div");
      mask.className = "dc-modal-mask";
      const flds = (fields || []).map((f) => {
        const id = "dcf-" + f.id;
        const ctl = f.type === "textarea"
          ? `<textarea id="${id}" rows="${f.rows || 3}" placeholder="${esc(f.ph || "")}">${esc(f.value || "")}</textarea>`
          : `<input class="dc-inp" id="${id}" type="text" placeholder="${esc(f.ph || "")}" value="${esc(f.value || "")}" style="width:100%;box-sizing:border-box">`;
        return `<div class="fld"><label for="${id}">${esc(f.label)}</label>${ctl}</div>`;
      }).join("");
      mask.innerHTML = `<div class="dc-modal"><h3>${title}</h3><div>${body}</div>${flds}${input != null ? `<input class="dc-inp" placeholder="${esc(input.ph || "")}" value="${esc(input.val || "")}">` : ""}<div class="acts"></div></div>`;
      const acts = mask.querySelector(".acts");
      const collect = () => {
        if (fields) { const o = {}; (fields || []).forEach((f) => { o[f.id] = (mask.querySelector("#dcf-" + f.id) || {}).value || ""; }); return o; }
        const inp = mask.querySelector("input.dc-inp:not([id^=dcf-])");
        return inp ? inp.value : undefined;
      };
      actions.forEach((a) => {
        const b = document.createElement("button");
        b.className = a.pr ? "pr" : (a.danger ? "danger" : ""); b.textContent = a.label;
        // fields 表单：回传 {action, value}（标注编辑器需要区分 保存/删除）；input 单字段：回传字符串；纯确认：回传 action id
        b.onclick = () => {
          const v = collect();
          root.innerHTML = "";
          if (a.id === "cancel") return res(null);
          res(fields ? { action: a.id, value: v } : (v !== undefined ? v : a.id));
        };
        acts.appendChild(b);
      });
      mask.addEventListener("click", (e) => { if (e.target === mask) { root.innerHTML = ""; res(null); } });
      root.innerHTML = ""; root.appendChild(mask);
      const first = mask.querySelector("textarea, input"); if (first) first.focus();
    });
  }
  const notify = (title, body) => modal({ title, body, actions: [{ id: "ok", label: "知道了", pr: true }] });

  /* ---------- 写盘（统一走 serve 白名单接口；离线回退 localStorage） ---------- */
  const LS_KEY = { "prototype/edit-overrides.json": "dc-editover", "prototype/annotations.json": "dc-ann", "prototype/products.json": "dc-products", "prototype/variants-index.json": "dc-variants-index" };
  async function writeFile(file, content) {
    const text = typeof content === "string" ? content : JSON.stringify(content, null, 2);
    try {
      const r = await fetch("/__dc_write__", { method: "POST", body: JSON.stringify({ file, content: text }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || r.status);
      return { ok: true, where: "run" };
    } catch (e) {
      const k = LS_KEY[file];
      if (k) localStorage.setItem(k, text);
      return { ok: false, where: k ? "localStorage" : "none", error: String(e.message || e) };
    }
  }
  /** 读 JSON：先服务端，失败回退 localStorage（离线打开 zip 时编辑不丢） */
  async function readJSON(url, lsKey, fallback) {
    try { const r = await fetch(url); if (!r.ok) throw new Error(String(r.status)); return await r.json(); }
    catch { if (lsKey) { try { return JSON.parse(localStorage.getItem(lsKey) || "null") ?? fallback; } catch { /* 忽略坏缓存 */ } } return fallback; }
  }
/* inspector 分段 30-edit-state.js —— 编辑态持久化：persist/undo/restore/applyOne/applyOverrides
 * 源文件按文件名顺序拼接为 prototype/inspector.js（scripts/build-shell.mjs），同一 IIFE 闭包。
 * 约定：JS 只写几何与状态；排版/配色一律 inspector.css 类 + 主题变量。
 */
  /* ---------- 持久化 ---------- */
  const persist = () => writeFile("prototype/edit-overrides.json", S.overrides);
  async function loadOverrides() {
    // M44h：layout-overrides（apply-patch 落回）+ ?variant= 变体（原版保留，变体可切换）
    S.variant = Q.get("variant") || "";
    const loPath = S.variant ? ("variants/" + encodeURIComponent(S.variant) + "/layout-overrides.json") : "layout-overrides.json";
    S.layoutOv = await readJSON(loPath, null, {});
    S.overrides = await readJSON("edit-overrides.json", "dc-editover", {});
    await loadVariants();
    if (S.variant) applyVariant(S.variant);
  }
  /** 变体清单：服务端 variants-index.json（apply-patch --variant / inspector 存变体）∪ localStorage（离线暂存） */
  async function loadVariants() {
    const idx = await readJSON("variants-index.json", "dc-variants-index", { variants: {} });
    const meta = (idx && idx.variants) || {};
    let local = {};
    try { local = JSON.parse(localStorage.getItem("dc-variants") || "{}"); } catch { local = {}; }
    const names = [...new Set([...Object.keys(meta), ...Object.keys(local)])];
    S.variantWhy = meta;
    S.variants = {};
    for (const n of names) S.variants[n] = (await readJSON("variants/" + encodeURIComponent(n) + "/tokens.json", null, null)) || local[n] || null;
  }
  /** 应用变体：tokens-override.css 优先（apply-patch 产出），退回 tokens.json（inspector 存变体产出） */
  function applyVariant(name) {
    let st = document.getElementById("dc-variant-css");
    if (!st) { st = document.createElement("style"); st.id = "dc-variant-css"; document.head.appendChild(st); }
    const t = S.variants[name];
    const fromTokens = () => {
      st.textContent = t ? ":root{" + Object.entries(t).map(([k, v]) => `${k}:${v};`).join("") + "}" : "";
      if (t) { localStorage.setItem("dc-tweaks", JSON.stringify(t)); tweaksApply(t); renderTweaksZone(); }
    };
    fetch("variants/" + encodeURIComponent(name) + "/tokens-override.css")
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((css) => { st.textContent = css; })
      .catch(fromTokens);
  }
  function pushUndo(entry) { S.undo.push(entry); if (S.undo.length > 100) S.undo.shift(); }
  function undo() {
    const u = S.undo.pop(); if (!u) return;
    const o = (S.overrides[u.page] ||= {});
    if (u.kind === "style") { (o[u.dc] ||= {}).style = u.prev || {}; if (S.page === u.page && el(u.dc)) applyOne(u.page, u.dc); }
    if (u.kind === "move") { (o[u.dc] ||= {}).dx = u.prev.dx; (o[u.dc]).dy = u.prev.dy; if (S.page === u.page && el(u.dc)) applyOne(u.page, u.dc); }
    persist(); fillDetail();
  }
  function restore() {
    modal({ title: "一键还原", body: "清除本 run 全部编辑修改（颜色/圆角/边框/位移），回到克隆原件？", actions: [{ id: "cancel", label: "取消" }, { id: "ok", label: "还原", pr: true }] }).then((r) => {
      if (!r) return;
      S.overrides = {}; S.undo = []; persist();
      if (S.page) loadView(S.page);
    });
  }
  function applyOne(page, dc) {
    const t = el(dc); if (!t) return;
    const o = (S.overrides[page] || {})[dc] || {};
    t.style.transform = o.dx || o.dy ? `translate(${o.dx || 0}px, ${o.dy || 0}px)` : "";
    for (const [k, v] of Object.entries(o.style || {})) t.style[k] = v;
  }
  function applyOverrides(page) { for (const dc of Object.keys(S.overrides[page] || {})) applyOne(page, dc); }
/* inspector 分段 40-url.js —— URL 状态与面包屑：hashStr/syncURL/setQueryParam/nodeTitle/updateCrumb/applyHash
 * 源文件按文件名顺序拼接为 prototype/inspector.js（scripts/build-shell.mjs），同一 IIFE 闭包。
 * 约定：JS 只写几何与状态；排版/配色一律 inspector.css 类 + 主题变量。
 */
  /* ---------- URL 状态 & 面包屑 ---------- */
  function hashStr() {
    if (S.ia === "scene") return `scene/${S.flowMode}/${S.selNode || ""}${S.flowMode === "path" ? "/" + S.selPath : ""}`;
    return `pages/${S.page || ""}`;
  }
  function syncURL(push) {
    const h = "#" + hashStr();
    if (location.hash === h) return;
    if (push) history.pushState(null, "", h); else history.replaceState(null, "", h);
  }
  /** 改单个 query 参数且不重载页面（设备/变体需要能进分享链接） */
  function setQueryParam(k, v) {
    const u = new URL(location.href);
    if (v == null || v === "") u.searchParams.delete(k); else u.searchParams.set(k, v);
    history.replaceState(null, "", u.pathname + u.search + u.hash);
  }
  function nodeTitle(id) { return ((S.paths || {}).nodes || {})[id]?.title || (DC.pages.find((p) => p.id === id) || {}).name || id; }
  function updateCrumb() {
    const c = $("#dc-crumb");
    const parts = S.ia === "pages"
      ? ["页面", nodeTitle(S.page)]
      : ["场景", S.flowMode === "tree" ? "树" : "路径", nodeTitle(S.selNode), ...(S.flowMode === "path" ? ["#" + (S.selPath + 1)] : [])];
    c.innerHTML = parts.filter(Boolean).map((p, i) => `<span class="${i === parts.length - 1 ? "" : "sep"}" ${i === parts.length - 1 ? 'id="dc-cur"' : ""}>${i ? " / " + esc(p) : esc(p)}</span>`).join("");
  }
  async function applyHash(push) {
    const h = location.hash.replace(/^#/, "");
    const seg = h.split("/").filter(Boolean);
    if (seg[0] === "scene" && S.paths) {
      S.flowMode = seg[1] === "path" ? "path" : "tree";
      S.selNode = seg[2] || S.selNode || S.paths.roots[0];
      S.selPath = +seg[3] || 0;
      setIA("scene", push);
      return true;
    } else if (seg[0] === "pages" && seg[1]) {
      setIA("pages", push); await loadView(seg[1]).catch(() => {});
      return true;
    } else if (seg[0] && !["pages", "scene"].includes(seg[0])) {
      setIA("pages", push); await loadView(seg[0]).catch(() => {});
      return true;
    }
    return false;
  }
/* inspector 分段 50-view.js —— 视图加载：loadView(注入+script 复活+fade+overrides+标注计数+对照源)
 * 源文件按文件名顺序拼接为 prototype/inspector.js（scripts/build-shell.mjs），同一 IIFE 闭包。
 * 约定：JS 只写几何与状态；排版/配色一律 inspector.css 类 + 主题变量。
 */
  /* ---------- 视图加载 ---------- */
  async function loadView(id) {
    const res = await fetch(`views/${id}.html`);
    if (!res.ok) throw new Error(`view ${id} 不存在`);
    S.lastHTML = await res.text();
    W.stage.innerHTML = S.lastHTML;
    W.stage.querySelectorAll("script").forEach((old) => {
      const s = document.createElement("script");
      if (old.src) s.src = old.src; else s.textContent = old.textContent;
      s.type = "module"; old.replaceWith(s);
    });
    if (S.play) { W.stage.classList.remove("dc-fade"); void W.stage.offsetWidth; W.stage.classList.add("dc-fade"); }
    W.screen.scrollTop = 0;
    if (window.DCRuntime) DCRuntime.enhance(W.stage);
    for (const [page, m] of Object.entries(S.layoutOv || {})) {
      if (page !== S.view) continue;
      for (const [dc, o] of Object.entries(m || {})) {
        const el = W.stage.querySelector('[data-dc="' + dc + '"]');
        if (el) el.style.transform = "translate(" + (o.dx || 0) + "px," + (o.dy || 0) + "px)";
      }
    }
    S.page = id; S.selected = null;
    $$("#dc-pages [data-nav]").forEach((b) => b.classList.toggle("on", b.dataset.nav === id));
    const cnt = $("#dc-ann-toggle .cnt"); if (cnt) cnt.textContent = (S.ann_data[id] || []).length || "";
    setCompareSrc(id);
    syncURL(false); updateCrumb();
    if (S.vm === "code") fillCode();
    setTimeout(() => { applyOverrides(id); applyMode(); fillDetail(); }, 120);
  }
/* inspector 分段 60-canvas.js —— 画布几何与覆盖层：scale/fzoom/fit + 标注/选中/测量绘制
 * 源文件按文件名顺序拼接为 prototype/inspector.js（scripts/build-shell.mjs），同一 IIFE 闭包。
 * 约定：JS 只写几何与状态；排版/配色一律 inspector.css 类 + 主题变量。
 */
  /* ---------- 缩放/平移/flowZoom ---------- */
  function setScale(s) {
    S.scale = Math.min(4, Math.max(0.2, s));
    W.phone.style.transform = `scale(${S.scale})`; W.phone.style.transformOrigin = "0 0";
    W.zoomwrap.style.width = W.phone.offsetWidth * S.scale + "px";
    W.zoomwrap.style.height = W.phone.offsetHeight * S.scale + "px";
    $("#dc-zoom-pct").textContent = Math.round(S.scale * 100) + "%";
    syncCompareScale();
    redraw();
  }
  function setFZoom(z) {
    S.fzoom = Math.min(2, Math.max(0.2, z));
    W.canvas.style.zoom = S.fzoom;
    // 连线标签反向缩放：画布 zoom 会放大 SVG/HTML 文字，标签必须保持屏幕恒定小字（"太粗太大"的根因之一）
    W.canvas.style.setProperty("--fc-inv", String(1 / S.fzoom));
    $("#dc-zoom-pct").textContent = Math.round(S.fzoom * 100) + "%";
    requestAnimationFrame(() => (S.flowMode === "path" ? drawPathWires() : drawWires()));
  }
  function zoomBy(f) { if (S.ia === "scene") setFZoom(S.fzoom * f); else setScale(S.scale * f); }
  function fit() {
    if (S.ia === "scene") { fitFlow(); return; }
    const a = W.workspace.getBoundingClientRect();
    const pad = document.body.classList.contains("dc-chromeless") ? 0 : 60;
    const pw = W.phone.offsetWidth + pad, ph = W.phone.offsetHeight + pad;
    setScale(Math.min((a.width - 20) / pw, (a.height - 20) / ph, 4));
  }
  function fitFlow() {
    W.canvas.style.zoom = 1;
    const a = W.workspace.getBoundingClientRect();
    const cw = W.canvas.scrollWidth, ch = W.canvas.scrollHeight;
    setFZoom(Math.min(1, (a.width - 40) / cw, (a.height - 40) / ch) || 1);
  }

  /* ---------- overlay ---------- */
  function clearOverlay() { W.overlay.innerHTML = ""; }
  function redraw() {
    clearOverlay();
    if (S.ann) drawAnnotations();
    if (S.selected) drawSelection();
  }
  function drawAnnotations() {
    const list = S.ann_data[S.page] || [];
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    W.overlay.appendChild(svg);
    const phoneR = toWS(W.phone.getBoundingClientRect());
    const chromeless = document.body.classList.contains("dc-chromeless");
    const placed = [];
    // M44k：视图改版后 target 可能消失（改 data-dc 名/删元素）——旧实现静默丢弃，用户以为标注丢了
    const orphans = [];
    list.forEach((a, i) => {
      const t = el(a.target); if (!t) { orphans.push(a.target); return; }
      const r = toWS(t.getBoundingClientRect());
      const pin = document.createElement("div");
      pin.className = "dc-pin"; pin.textContent = i + 1;
      // chrome=0 导出按设备框裁剪，压边放置的 pin 会被裁掉半截 → 无壳时收进框内
      pin.style.left = (chromeless ? r.r - 14 : r.r - 8) + "px"; pin.style.top = r.cy - 8 + "px";
      pin.onmouseenter = () => (t.style.outline = "1px solid var(--sh-accent)");
      pin.onmouseleave = () => (t.style.outline = "");
      W.overlay.appendChild(pin);
      const card = document.createElement("div");
      card.className = "dc-card";
      card.innerHTML = `<b>${i + 1}. ${esc(a.label)}</b>` + (a.notes || []).map((n) => `<div class="ev"><i>${esc(n.event)}</i> → ${esc(n.response)}</div>`).join("") + (a.note ? `<div class="ev">${esc(a.note)}</div>` : "");
      W.overlay.appendChild(card);
      const cardX = chromeless ? Math.max(phoneR.x + 8, phoneR.r - card.offsetWidth - 12) : phoneR.r + 24;
      let cardY = Math.max(phoneR.y + 4, r.cy - 24);
      let hit = true;
      while (hit) {
        hit = false;
        for (const p of placed) if (cardY <= p.b + 8 && cardY + card.offsetHeight >= p.t - 8) { cardY = p.b + 10; hit = true; }
      }
      const wsH = (document.getElementById("dc-workspace") || document.body).clientHeight;
      const maxY = wsH - card.offsetHeight - 64;
      if (cardY > maxY) cardY = Math.max(phoneR.y + 4, maxY);
      placed.push({ t: cardY, b: cardY + card.offsetHeight });
      card.style.left = cardX + "px"; card.style.top = cardY + "px";
      const cy = cardY + card.offsetHeight / 2 - 5;
      const path = document.createElementNS(svgNS, "polyline");
      if (chromeless) {
        const px = r.r, py = r.cy, cx = cardX;
        path.setAttribute("points", `${px},${py} ${(px + cx) / 2},${py} ${(px + cx) / 2},${cy} ${cx - 2},${cy}`);
      } else {
        const midX = cardX - 14;
        path.setAttribute("points", `${r.r},${r.cy} ${midX},${r.cy} ${midX},${cy} ${cardX - 2},${cy}`);
      }
      svg.appendChild(path);
    });
    S.annOrphans = orphans;
    const cnt = $("#dc-ann-toggle .cnt");
    if (cnt) cnt.textContent = (list.length - orphans.length) || "";
  }
  function drawSelection() {
    const t = el(S.selected) || W.stage.querySelector(S.selected); if (!t) return;
    const r = toWS(t.getBoundingClientRect());
    const box = document.createElement("div"); box.className = "dc-sel";
    Object.assign(box.style, { left: r.x + "px", top: r.y + "px", width: r.w + "px", height: r.h + "px" });
    W.overlay.appendChild(box);
    const sz = document.createElement("div"); sz.className = "dc-size"; sz.textContent = `${Math.round(r.w)} × ${Math.round(r.h)}`;
    sz.style.left = r.x + "px"; sz.style.top = r.b + 4 + "px";
    W.overlay.appendChild(sz);
  }
  function measure(e) {
    W.overlay.querySelectorAll(".dc-measure").forEach((n) => n.remove());
    if (!(e.altKey && S.selected)) return;
    const a = el(S.selected); const b = e.target.closest("[data-dc]");
    if (!a || !b || a === b) return;
    const ra = toWS(a.getBoundingClientRect()), rb = toWS(b.getBoundingClientRect());
    const m = document.createElement("div"); m.className = "dc-measure";
    const lx = rb.x >= ra.r ? ra.r : rb.r; const w = Math.abs(rb.x >= ra.r ? rb.x - ra.r : ra.x - rb.r);
    const y = Math.max(ra.y, rb.y);
    m.innerHTML = `<div class="ln" style="left:${lx}px;top:${y}px;width:${w}px;height:1px"></div><div class="lb" style="left:${lx + w / 2 - 10}px;top:${y - 16}px">${Math.round(w)}</div>`;
    const ly = rb.y >= ra.b ? ra.b : rb.b; const h = Math.abs(rb.y >= ra.b ? rb.y - ra.b : ra.y - rb.b);
    const x = Math.max(ra.x, rb.x);
    m.innerHTML += `<div class="ln" style="left:${x}px;top:${ly}px;width:1px;height:${h}px"></div><div class="lb" style="left:${x + 4}px;top:${ly + h / 2 - 8}px">${Math.round(h)}</div>`;
    W.overlay.appendChild(m);
  }
/* inspector 分段 70-nav.js —— IA 与左栏：setIA/renderPages/renderSceneTree/applyFilter/a11yPass
 * 源文件按文件名顺序拼接为 prototype/inspector.js（scripts/build-shell.mjs），同一 IIFE 闭包。
 * 约定：JS 只写几何与状态；排版/配色一律 inspector.css 类 + 主题变量。
 */
  /* ---------- IA 切换 ---------- */
  function setIA(ia, push = true) {
    S.ia = ia;
    $$("#dc-rail [data-ia]").forEach((b) => b.classList.toggle("on", b.dataset.ia === ia));
    $("#dc-left-pages").hidden = ia !== "pages";
    $("#dc-left-scene").hidden = ia !== "scene";
    W.single.hidden = ia !== "pages" || S.vm === "code";
    W.flow.hidden = ia !== "scene" || S.vm === "code";
    if (ia === "scene") { if (!S.selNode) S.selNode = (S.paths && S.paths.roots[0]) || null; renderFlow(); }
    else if (S.page) setTimeout(redraw, 50);
    $("#dc-zoom-pct").textContent = Math.round((ia === "scene" ? S.fzoom : S.scale) * 100) + "%";
    syncURL(push); updateCrumb(); fillDetail();
  }

  /* ---------- 左：页面列表 / 场景树 ---------- */
  function renderPages() {
    const pages = (window.DC && DC.pages) || [];
    $("#dc-pages").innerHTML = pages.map((p) =>
      `<button data-nav="${p.id}"><span class="idx">${idxOf(p.id)}</span><span>${esc(p.name || p.id)}</span>${p.fidelity ? `<i class="fid fid-${p.fidelity}" title="${p.fidelity}"></i>` : ""}</button>`).join("");
    $$("#dc-pages [data-nav]").forEach((b) => (b.onclick = () => { setIA("pages"); loadView(b.dataset.nav); }));
    applyFilter();
  }
  function renderSceneTree() {
    const P = S.paths; const box = $("#dc-tree");
    if (!P) { box.innerHTML = `<div style="padding:8px;color:var(--sh-mut);font-size:11px">无 paths.json<br>跑 scripts/paths-gen.mjs 生成</div>`; return; }
    // M49.2：目录层级=前向边（含 nav，仅排 back）——与画布树同语义
    // M50：目录=层级树：子节点仅 BFS 严格下一层（与画布树同语义；hub 同层横跳不进目录）
    const D = P.depths || {};
    const kids = (id) => [...new Set((P.edges || []).filter((e) => e.from === id && (e.role ? e.role !== "back" : e.dir !== "back") && D[e.to] !== undefined && D[id] !== undefined && D[e.to] === D[id] + 1).map((e) => e.to))];
    const row = (id, depth, seen) => {
      const k = kids(id).filter((c) => !seen.has(c));
      const n = P.nodes[id] || { title: id };
      const s2 = new Set(seen); s2.add(id);
      return `<div class="tr-node">
        <div class="tr-row" data-node="${id}" style="padding-left:${8 + depth * 4}px">
          <span class="tr-caret" data-tg="${id}">${k.length ? "▸" : ""}</span>
          <span class="idx" style="color:var(--sh-mut);font-size:11px">${idxOf(id)}</span><span>${esc(n.title || id)}</span>
        </div>
        <div class="tr-kids" data-kids="${id}" hidden>${k.map((c) => row(c, depth + 1, s2)).join("")}</div>
      </div>`;
    };
    box.innerHTML = P.roots.map((r) => row(r, 0, new Set())).join("");
    box.querySelectorAll(".tr-caret").forEach((c) => (c.onclick = (e) => {
      e.stopPropagation();
      const k = box.querySelector(`[data-kids="${c.dataset.tg}"]`);
      k.hidden = !k.hidden; c.textContent = k.hidden ? "▸" : "▾";
    }));
    box.querySelectorAll(".tr-row").forEach((r) => (r.onclick = () => {
      S.selNode = r.dataset.node; S.selPath = 0;
      box.querySelectorAll(".tr-row").forEach((x) => x.classList.toggle("on", x === r));
      renderFlow(); fillDetail(); syncURL(true); updateCrumb();
    }));
    const cur = box.querySelector(`[data-node="${S.selNode}"]`); if (cur) cur.classList.add("on");
    applyFilter();
  }

  /* ---------- 左栏筛选（M44k：页面多时靠滚动找太慢） ---------- */
  function applyFilter() {
    const q = (S.filter || "").trim().toLowerCase();
    let shown = 0;
    $$("#dc-pages [data-nav]").forEach((b) => {
      const hit = !q || b.textContent.toLowerCase().includes(q) || b.dataset.nav.toLowerCase().includes(q);
      b.classList.toggle("hide", !hit);
      if (hit) shown++;
    });
    $$("#dc-tree .tr-node").forEach((n) => {
      const row = n.querySelector(":scope > .tr-row");
      const hit = !q || (row ? row.textContent.toLowerCase().includes(q) : false);
      n.classList.toggle("hide", !hit);
      if (hit && q) { const kids = n.querySelector(":scope > .tr-kids"); if (kids) kids.hidden = false; }
    });
    let em = $("#dc-left .dc-empty");
    if (!shown && q) {
      if (!em) { em = document.createElement("div"); em.className = "dc-empty"; $("#dc-left-pages").appendChild(em); }
      em.textContent = `无匹配「${S.filter}」`;
    } else if (em) em.remove();
  }

  /* ---------- 可访问性：图标按钮把 title 同步为 aria-label（含动态渲染的下拉/播放器） ---------- */
  function a11yPass(scope) {
    (scope || document).querySelectorAll("button[title]:not([aria-label])").forEach((b) => b.setAttribute("aria-label", b.getAttribute("title")));
  }
/* inspector 分段 80-flow.js —— 场景画布：卡片/连线/路径链渲染 + 连线绘制(几何 only，排版在 CSS)
 * 源文件按文件名顺序拼接为 prototype/inspector.js（scripts/build-shell.mjs），同一 IIFE 闭包。
 * 约定：JS 只写几何与状态；排版/配色一律 inspector.css 类 + 主题变量。
 */
  /* ---------- 场景流程画布（整卡缩放） ---------- */
  function natSize() { return deviceOf(shellClass()).size; }
  function cardHTML(id) {
    const n = (S.paths && S.paths.nodes[id]) || { title: id };
    const [nw, nh] = natSize();
    const CW = isTouch() ? 260 : 320, k = +(CW / nw).toFixed(4), CH = Math.round(nh * k);
    return `<div class="fc-node"><div class="fc-title"><b>${idxOf(id)}</b> · ${esc(n.title || id)}</div>
      <div class="fc-card" data-node="${id}" style="width:${CW}px;height:${CH}px">
        <div class="fc-scale" style="transform:scale(${k});width:${nw}px;height:${nh}px">
          <iframe src="index.html?embed=1&card=1#${id}" width="${nw}" height="${nh}" loading="lazy"></iframe>
        </div></div></div>`;
  }
  function arrowDef() {
    // 用 inline style 而非 fill 属性：全局 svg{} CSS 会覆盖表现属性（同 SB_ICONS 的约定）；颜色走 --sh-mark 主题变量
    return `<defs><marker id="dc-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--sh-wire)"/></marker></defs>`;
  }
  function renderFlow() {
    const P = S.paths; if (!P || !S.selNode) { W.canvas.innerHTML = ""; return; }
    $$("#dc-flow-toggle [data-fm]").forEach((b) => b.classList.toggle("on", b.dataset.fm === S.flowMode));
    if (S.flowMode === "path") {
      // M49：路径模式=列出所选根节点的全部路径（每行一条链，行点选=选中供播放/导出）；hub 无内容路径时巡游链兜底
      const paths = (P.perNode[S.selNode] || {}).paths || [];
      if (S.selPath >= paths.length) S.selPath = 0;
      const navTour = !paths.length ? ((P.perNode[S.selNode] || {}).nav || [])
        .map((tid) => P.edges.findIndex((e) => e.from === S.selNode && e.to === tid)).filter((ei) => ei >= 0) : [];
      const rows = paths.length ? paths.map((pp, pi) => ({ pp, pi, nav: false })) : (navTour.length ? [{ pp: navTour, pi: 0, nav: true }] : []);
      W.canvas.innerHTML = rows.length ? rows.map(({ pp, pi, nav }) => {
        let chain = cardHTML(S.selNode);
        pp.forEach((ei) => { const e = P.edges[ei]; chain += `<div class="fc-link${nav ? " nav" : ""}" data-edge="${ei}"><span class="elabel">${esc(e.label || e.kind || "")}</span></div>` + cardHTML(e.to); });
        return `<div class="fc-chain${nav ? " navtour" : ""}${pi === S.selPath ? " sel" : ""}" data-pathrow="${pi}" title="点选此路径（播放/导出按选中行）">${chain}</div>`;
      }).join("") : `<div style="color:var(--sh-mut);padding:40px">该节点无出向路径</div>`;
      W.canvas.querySelectorAll(".fc-chain").forEach((ch) => (ch.onclick = (ev) => {
        if (ev.target.closest(".fc-card")) return;
        const pi = +ch.dataset.pathrow; if (pi === S.selPath) return;
        S.selPath = pi; renderFlow(); fillDetail(); syncURL(true); updateCrumb();
      }));
      W.canvas.querySelectorAll(".fc-card").forEach((c) => (c.onclick = () => {
        S.selNode = c.dataset.node; S.selPath = 0; renderSceneTree(); renderFlow(); fillDetail(); syncURL(true); updateCrumb();
      }));
    } else {
      // M47：hub 型应用（边多为 module/nav）树不再只剩孤根——nav 边作淡虚线叶铺在节点下
      // M49：树模式=纯前向子树（用户：选中节点只展示以它为根的树；nav 横跳不属于树，路径模式/巡游兜底负责）
      const mk = (t) => {
        const kids = t.children;
        return `<div class="fc-h">${cardHTML(t.node)}${kids.length ? `<div class="fc-kids">${kids.map((c) => `<div class="fc-edge-slot" data-edge="${c.edge}">${mk(c.child)}</div>`).join("")}</div>` : ""}</div>`;
      };
      const roots = Q.get("root") === "__all__" ? P.roots : [S.selNode];
      W.canvas.innerHTML = roots.map((r) => mk((P.perNode[r] || {}).tree || { node: r, children: [] })).join(`<div style="width:80px;display:inline-block"></div>`);
      W.canvas.querySelectorAll(".fc-card").forEach((c) => {
        c.onclick = () => {
          S.selNode = c.dataset.node; renderSceneTree();
          W.canvas.querySelectorAll(".fc-card").forEach((x) => x.classList.toggle("sel", x === c));
          lightband(); fillDetail(); syncURL(true); updateCrumb();
        };
        c.onmouseenter = () => W.canvas.querySelectorAll(`path.band[data-from="${c.dataset.node}"]`).forEach((b) => b.classList.add("flow-loop"));
        c.onmouseleave = () => updateFlowLoops();
      });
    }
    requestAnimationFrame(() => { S.flowMode === "path" ? drawPathWires() : drawWires(); fitFlow(); bindIframeFades(); });
  }
  function bindIframeFades() {
    W.canvas.querySelectorAll("iframe").forEach((f) => {
      if (f.dataset.ld) return;
      f.dataset.ld = 1;
      const done = () => f.classList.add("ld");
      f.addEventListener("load", done, { once: true });
      setTimeout(done, 2500);
    });
  }
  function wirePair(svgNS, svg, x1, y1, x2, y2, fromId, loop) {
    const d = `M${x1},${y1} C${x1 + 32},${y1} ${x2 - 32},${y2} ${x2 - 7},${y2}`;
    const wire = document.createElementNS(svgNS, "path"); wire.setAttribute("d", d); wire.setAttribute("class", "wire"); wire.setAttribute("marker-end", "url(#dc-arrow)");
    const band = document.createElementNS(svgNS, "path"); band.setAttribute("d", d); band.setAttribute("class", "band" + (loop ? " flow-loop" : "")); band.dataset.from = fromId;
    svg.appendChild(wire); svg.appendChild(band);
  }
  function drawPathWires() {
    W.canvas.querySelectorAll("svg.wires").forEach((s) => s.remove());
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("class", "wires");
    svg.innerHTML = arrowDef();
    W.canvas.prepend(svg);
    const cb = W.canvas.getBoundingClientRect();
    const z = S.fzoom || 1;
    W.canvas.querySelectorAll(".fc-chain .fc-link").forEach((link) => {
      const pn = link.previousElementSibling && link.previousElementSibling.querySelector(".fc-card");
      const cn = link.nextElementSibling && link.nextElementSibling.querySelector(".fc-card");
      if (!pn || !cn) return;
      const a = pn.getBoundingClientRect(), b = cn.getBoundingClientRect();
      const x1 = (a.right - cb.left) / z + W.canvas.scrollLeft, y1 = (a.top - cb.top) / z + W.canvas.scrollTop + a.height / 2 / z;
      const x2 = (b.left - cb.left) / z + W.canvas.scrollLeft, y2 = (b.top - cb.top) / z + W.canvas.scrollTop + b.height / 2 / z;
      wirePair(svgNS, svg, x1, y1, x2, y2, link.dataset.edge, true);
    });
  }
  function drawWires() {
    W.canvas.querySelectorAll("svg.wires").forEach((s) => s.remove());
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("class", "wires");
    svg.innerHTML = arrowDef();
    W.canvas.prepend(svg);
    const cb = W.canvas.getBoundingClientRect();
    const z = S.fzoom || 1;
    W.canvas.querySelectorAll(".fc-edge-slot").forEach((slot) => {
      const e = S.paths.edges[+slot.dataset.edge];
      const pn = slot.closest(".fc-h").querySelector(":scope > .fc-node > .fc-card");
      const cn = slot.querySelector(":scope > .fc-h > .fc-node > .fc-card");
      if (!pn || !cn) return;
      const a = pn.getBoundingClientRect(), b = cn.getBoundingClientRect();
      const x1 = (a.right - cb.left) / z + W.canvas.scrollLeft, y1 = (a.top - cb.top) / z + W.canvas.scrollTop + a.height / 2 / z;
      const x2 = (b.left - cb.left) / z + W.canvas.scrollLeft, y2 = (b.top - cb.top) / z + W.canvas.scrollTop + b.height / 2 / z;
      const num = S.paths.edges.indexOf(e) + 1;
      wirePair(svgNS, svg, x1, y1, x2, y2, e.from, false);
      if (e.role === "module") { const ws = svg.querySelectorAll("path.wire"); ws[ws.length - 1].classList.add("nav"); }
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const g = document.createElementNS(svgNS, "g");
      // M44k：JS 只写几何（translate + 1/z 反向缩放），排版/配色全部交给 inspector.css 的 .wbadge/.wnum/.elabel
      g.setAttribute("class", "wmark");
      g.setAttribute("transform", `translate(${mx},${my}) scale(${(1 / z).toFixed(4)})`);
      g.innerHTML = `<circle class="wbadge" r="6.5" /><text class="wnum" y="3">${num}</text><text class="elabel" y="18" text-anchor="middle">${esc(e.label || "")}</text>`;
      svg.appendChild(g);
    });
    updateFlowLoops();
  }
  function updateFlowLoops() {
    W.canvas.querySelectorAll("path.band").forEach((b) => b.classList.toggle("flow-loop", b.dataset.from === S.selNode));
  }
  function lightband() {
    W.canvas.querySelectorAll("path.band").forEach((b) => { b.classList.remove("flow"); void b.getBoundingClientRect(); b.classList.add("flow"); });
    W.canvas.querySelectorAll(".fc-card").forEach((c) => { c.classList.remove("pulse"); void c.offsetWidth; if (c.dataset.node !== S.selNode) c.classList.add("pulse"); });
    updateFlowLoops();
  }
/* inspector 分段 90-board.js —— 右详情看板：产品/设计/提示词 + 产品编辑入口 + tweaks/变体 + 拖拽编辑
 * 源文件按文件名顺序拼接为 prototype/inspector.js（scripts/build-shell.mjs），同一 IIFE 闭包。
 * 约定：JS 只写几何与状态；排版/配色一律 inspector.css 类 + 主题变量。
 */
  /* ---------- 详情看板（产品+设计合并） ---------- */
  function compilePrompt(t, dc) {
    const cs = getComputedStyle(t); const r = t.getBoundingClientRect();
    const name = dc || t.tagName.toLowerCase();
    const prod = S.products[S.page] || {};
    return `设计一个「${name}」组件：尺寸约 ${Math.round(r.width)}×${Math.round(r.height)}，圆角 ${cs.borderRadius}，边框 ${cs.borderWidth} ${rgb2hex(cs.borderColor)}；主色 ${rgb2hex(cs.backgroundColor)}，文字 ${rgb2hex(cs.color)} ${cs.fontSize}/${cs.fontWeight} ${cs.fontFamily.split(",")[0]}；布局：${cs.display}，padding ${cs.padding}；功能：${(prod.function || "见页面功能").slice(0, 60)}；风格锚：原生平台风；不要：多余装饰与投影堆砌。`;
  }
  function compilePagePrompt(id) {
    const n = (S.paths && S.paths.nodes[id]) || {};
    return `设计一个${shellLabel()}「${n.title || id}」：参考 tokens.css 的色板与字体栈；信息层级：导航+主内容列表+底栏；风格锚：原生平台风；不要：lorem 文案（用真实感 mock）。`;
  }
  function promptBlock(text) {
    return `<div class="promptbox">${esc(text)}</div><button class="dc-btn copy" data-copy="${encodeURIComponent(text)}">复制</button>`;
  }
  function fillDetail() {
    const box = $("#dc-board-detail");
    const prodBtn = (id) => (id ? `<button class="dc-btn mini" data-editprod="${esc(id)}" title="编辑产品说明并写回 products.json">编辑</button>` : "");
    let html = S.ann ? `<div class="hint">标注模式已开：点画面里的元素即可新增/编辑批注（写回 annotations.json）</div>` : "";
    if (S.ann && (S.annOrphans || []).length) {
      html += `<div class="hint" style="color:#d92d20">${S.annOrphans.length} 条标注的 target 已不在视图（视图改版后失效）：${S.annOrphans.slice(0, 4).map(esc).join("、")}${S.annOrphans.length > 4 ? "…" : ""}。标注模式点现有元素可重挂，或在标注编辑器里删除。</div>`;
    }
    if (S.ia === "scene" && S.selNode) {
      const prod = S.products[S.selNode] || {};
      if (S.flowMode === "path") {
        const p = ((S.paths.perNode[S.selNode] || {}).paths || [])[S.selPath] || [];
        const chain = [S.selNode, ...p.map((ei) => S.paths.edges[ei].to)];
        const goals = [...new Set(chain.map((id) => (S.products[id] || {}).goals || []).flat())];
        const prompt = `复现场景路径：${chain.map((id) => `${idxOf(id)} ${nodeTitle(id)}`).join(" → ")}；每步交互：${p.map((ei) => S.paths.edges[ei].label).join("；")}；产品目标：${goals.join("、") || "转化/留存"}；风格：${shellLabel()}，黑白细线标注风。`;
        html += `<h4>场景路径</h4>${chain.map((id) => `<div>${idxOf(id)} ${esc(nodeTitle(id))}</div>`).join("")}
          <h4>功能${prodBtn(S.selNode)}</h4>${chain.map((id) => (S.products[id] || {}).function).filter(Boolean).map(esc).join("<br>") || "（products.json 未提供）"}
          <h4>目标</h4>${goals.map((g) => `<span class="goal">${esc(g)}</span>`).join("") || "—"}
          <h4>再生成提示词</h4>${promptBlock(prompt)}`;
      } else {
        html += `<h4>页面</h4><b>${idxOf(S.selNode)} ${esc(nodeTitle(S.selNode))}</b>
          <h4>功能${prodBtn(S.selNode)}</h4>${esc(prod.function || "（克隆时按 vlm-analysis.md 补 product 三要素）")}
          <h4>目标</h4>${(prod.goals || []).map((g) => `<span class="goal">${esc(g)}</span>`).join("") || "—"}
          <h4>再生成提示词</h4>${promptBlock(prod.page_prompt || compilePagePrompt(S.selNode))}`;
      }
    } else if (S.page) {
      const prod = S.products[S.page] || {};
      html += `<h4>页面</h4><b>${idxOf(S.page)} ${esc(nodeTitle(S.page))}</b>
        <h4>功能${prodBtn(S.page)}</h4>${esc(prod.function || "（克隆时按 vlm-analysis.md 补 product 三要素）")}
        <h4>目标</h4>${(prod.goals || []).map((g) => `<span class="goal">${esc(g)}</span>`).join("") || "—"}
        <h4>再生成提示词</h4>${promptBlock(prod.page_prompt || compilePagePrompt(S.page))}`;
      const t = S.selected ? el(S.selected) : null;
      if (t) {
        const cs = getComputedStyle(t); const r = t.getBoundingClientRect();
        const o = ((S.overrides[S.page] || {})[S.selected] || {}).style || {};
        const row = (label, key, val, type) =>
          `<div class="kv"><label>${label}</label>${type === "color" ? `<input type="color" data-sk="${key}" value="${val.startsWith("#") && val.length === 7 ? val : "#ffffff"}">` : ""}<input class="dc-inp" data-sk="${key}" value="${esc(val)}" style="width:110px" ${S.edit ? "" : "readonly"}></div>`;
        const autoMeta = String(S.selected).startsWith("auto:")
          ? `<div class="hint">自动选中控件 · 交互=${esc(t.getAttribute("data-act") || t.getAttribute("data-goto") || t.getAttribute("role") || "-")} · ${esc((t.getAttribute("data-msg") || t.textContent || "").trim().slice(0, 40))}</div>` : "";
        html += `<h4>选中元素 · ${esc(S.selected)}</h4>${autoMeta}&lt;${t.tagName.toLowerCase()}&gt;
          ${row("背景", "backgroundColor", rgb2hex(cs.backgroundColor), "color")}${row("文字", "color", rgb2hex(cs.color), "color")}${row("圆角", "borderRadius", cs.borderRadius, "text")}${row("边框", "border", cs.borderWidth + " solid " + rgb2hex(cs.borderColor), "text")}
          ${row("字体", "fontFamily", cs.fontFamily.split(",")[0], "text")}${row("字号", "fontSize", cs.fontSize, "text")}${row("字重", "fontWeight", cs.fontWeight, "text")}
          <div style="margin-top:4px;color:var(--sh-mut);font-size:11px">${S.edit ? "可直接改值，Ctrl+Z 撤销" : "编辑模式可改（底栏 ✎）"}</div>
          <h4>元素提示词</h4>${promptBlock((prod.element_prompts || {})[S.selected] || compilePrompt(t, S.selected))}`;
      }
    } else html = "选中页面/节点/路径后展示详情";
    html += `<details><summary>全局 tokens 调参</summary><div id="dc-tw-zone"></div></details>`;
    box.innerHTML = html;
    box.querySelectorAll("[data-editprod]").forEach((b) => (b.onclick = () => editProduct(b.dataset.editprod)));
    box.querySelectorAll(".copy").forEach((b) => (b.onclick = () => { navigator.clipboard.writeText(decodeURIComponent(b.dataset.copy)); b.textContent = "已复制"; setTimeout(() => (b.textContent = "复制"), 1200); }));
    box.querySelectorAll("[data-sk]").forEach((inp) => {
      inp.oninput = () => {
        if (!S.edit) return;
        const key = inp.dataset.sk; const val = inp.value;
        const t = el(S.selected); if (!t) return;
        const cur = ((S.overrides[S.page] ||= {})[S.selected] ||= {}).style || {};
        pushUndo({ kind: "style", page: S.page, dc: S.selected, prev: { ...cur } });
        (S.overrides[S.page][S.selected].style ||= {})[key] = val;
        t.style[key] = val; persist();
        const sib = box.querySelector(`${inp.type === "color" ? "input.dc-inp" : "input[type=color]"}[data-sk="${key}"]`);
        if (sib && sib !== inp) sib.value = val;
      };
    });
    renderTweaksZone();
  }

  /* ---------- tweaks（详情内折叠节） ---------- */
  function tweaksStore() { try { return JSON.parse(localStorage.getItem("dc-tweaks") || "{}"); } catch { return {}; } }
  function tweaksApply(o) { for (const [k, v] of Object.entries(o || {})) document.documentElement.style.setProperty(k, v); }
  const VARIANT_NAME_RE = /^[A-Za-z0-9._-]{1,64}$/;
  /** 变体落盘（M44k）：此前只写 localStorage，换机器/清缓存即丢，也无法被 ?variant= 与 apply-patch 复用 */
  async function saveVariant(name, tokens) {
    const dir = "prototype/variants/" + name + "/";
    const css = ":root {\n" + Object.entries(tokens).map(([k, v]) => `  ${k}: ${v};`).join("\n") + "\n}\n";
    const a = await writeFile(dir + "tokens.json", tokens);
    const b = await writeFile(dir + "tokens-override.css", css);
    const idx = { variants: { ...(S.variantWhy || {}) } };
    idx.variants[name] = { why: "inspector tweaks", at: new Date().toISOString(), original: "default" };
    await writeFile("prototype/variants-index.json", idx);
    let local = {}; try { local = JSON.parse(localStorage.getItem("dc-variants") || "{}"); } catch { local = {}; }
    local[name] = tokens; localStorage.setItem("dc-variants", JSON.stringify(local));
    S.variants[name] = tokens; S.variantWhy = idx.variants;
    return a.ok && b.ok ? "run" : a.where;
  }
  function renderTweaksZone() {
    const box = $("#dc-tw-zone"); if (!box) return;
    const variants = S.variants || {};
    const names = Object.keys(variants);
    box.innerHTML = TOKEN_KEYS.map((k) => {
      const v = tweaksStore()[k] || getComputedStyle(document.documentElement).getPropertyValue(k).trim();
      const isC = v.startsWith("#");
      return `<div class="kv"><label style="width:110px">${k}</label>${isC ? `<input type="color" data-tk="${k}" value="${v}">` : ""}<input class="dc-inp" data-tk="${k}" value="${esc(v)}" style="width:104px"></div>`;
    }).join("") +
      `<select class="dc-inp" id="dc-variant" style="width:100%;margin-top:8px"><option value="">（变体：当前）</option>${names.map((n) => `<option value="${esc(n)}"${n === S.variant ? " selected" : ""}>${esc(n)}${(S.variantWhy || {})[n] ? " · " + esc((S.variantWhy || {})[n].why || "") : ""}</option>`).join("")}</select>
      <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap"><button id="dc-tw-save" class="dc-btn">存为变体</button><button id="dc-tw-export" class="dc-btn">导出 patch</button><button id="dc-tw-reset" class="dc-btn">重置</button></div>
      <div class="hint" style="margin-top:6px;font-size:11px;color:var(--sh-mut)">变体写入 prototype/variants/&lt;名&gt;/，分享链接带 ?variant=&lt;名&gt; 即可复现</div>`;
    box.querySelectorAll("[data-tk]").forEach((inp) => (inp.oninput = () => {
      const o = tweaksStore(); o[inp.dataset.tk] = inp.value;
      localStorage.setItem("dc-tweaks", JSON.stringify(o));
      document.documentElement.style.setProperty(inp.dataset.tk, inp.value);
    }));
    $("#dc-tw-reset").onclick = () => { localStorage.removeItem("dc-tweaks"); TOKEN_KEYS.forEach((k) => document.documentElement.style.removeProperty(k)); const st = document.getElementById("dc-variant-css"); if (st) st.textContent = ""; S.variant = ""; setQueryParam("variant", null); renderTweaksZone(); };
    $("#dc-tw-save").onclick = () => modal({
      title: "存为变体", body: "原版（default）保持不动，变体可随时切回。",
      input: { ph: "变体名（字母/数字/._-）" },
      actions: [{ id: "cancel", label: "取消" }, { id: "ok", label: "保存", pr: true }],
    }).then(async (n) => {
      if (!n) return;
      const name = String(n).trim();
      if (!VARIANT_NAME_RE.test(name)) { toast("变体名只能用字母/数字/._-（1-64 字）"); return; }
      const where = await saveVariant(name, tweaksStore());
      renderTweaksZone();
      toast(where === "run" ? `变体 ${name} 已落盘 prototype/variants/${name}/` : `变体 ${name} 只存到浏览器（${where}）：需 node serve.mjs 才能落盘`);
    });
    $("#dc-tw-export").onclick = () => download("tokens-patch.json", JSON.stringify({ type: "tokens-patch", overrides: tweaksStore() }, null, 2));
    $("#dc-variant").onchange = (e) => {
      const n = e.target.value;
      S.variant = n;
      setQueryParam("variant", n || null);
      TOKEN_KEYS.forEach((k) => document.documentElement.style.removeProperty(k));
      if (!n) { const st = document.getElementById("dc-variant-css"); if (st) st.textContent = ""; localStorage.removeItem("dc-tweaks"); renderTweaksZone(); return; }
      const v = variants[n];
      if (v) { localStorage.setItem("dc-tweaks", JSON.stringify(v)); tweaksApply(v); }
      applyVariant(n);
    };
  }
  /* ---------- 编辑拖拽 ---------- */
  let drag = null;
  function startDrag(e, t) {
    const dc = t.getAttribute("data-dc"); if (!dc) return;
    const cur = (S.overrides[S.page] || {})[dc] || {};
    pushUndo({ kind: "move", page: S.page, dc, prev: { dx: cur.dx || 0, dy: cur.dy || 0 } });
    drag = { t, dc, sx: e.clientX, sy: e.clientY, dx: cur.dx || 0, dy: cur.dy || 0 };
  }
  function finishDrag() { if (drag) { drag = null; persist(); } }
/* inspector 分段 100-play.js —— 播放与演示：playPath 回退链/会话守卫 + demo 字幕/模拟弹窗/总结卡
 * 源文件按文件名顺序拼接为 prototype/inspector.js（scripts/build-shell.mjs），同一 IIFE 闭包。
 * 约定：JS 只写几何与状态；排版/配色一律 inspector.css 类 + 主题变量。
 */
  /* ---------- 播放器（路径演播） ----------
     M44k：禁止静默失败。页面模式从当前页起播，场景模式播所选路径；
     无出向路径 → 回退 journeys 演示；两者都缺 → 明确告知缺什么、跑哪条命令。 */
  function playPath(pi) {
    const P = S.paths;
    const node = (S.ia === "pages" ? S.page : S.selNode) || (P && P.roots[0]) || null;
    if (P && node) {
      const list = ((P.perNode || {})[node] || {}).paths || [];
      if (list.length) {
        const idx = Math.min(Math.max(pi | 0, 0), list.length - 1);
        const p = list[idx];
        if (p && p.length) { startPlay(p, idx, node); return; }
      }
    }
    const navTour = P && node ? ((P.perNode[node] || {}).nav || [])
      .map((tid) => P.edges.findIndex((e) => e.from === node && e.to === tid)).filter((ei) => ei >= 0) : [];
    if (navTour.length) {
      toast("该节点无内容路径，按导航巡游播放");
      startPlay(navTour, 0, node);
      return;
    }
    if (S.journeys.length) {
      toast("该节点无出向路径，改用演示旅程播放");
      if (S.journeys.length > 1) demoChooser(); else startDemo(0);
      return;
    }
    notify("无法播放", P
      ? `节点 ${idxOf(node || "")} ${esc(nodeTitle(node || ""))} 没有可用出向路径，且本 run 无 journeys.json 可回退。<br>补：node scripts/paths-gen.mjs --run &lt;run&gt;`
      : "本 run 缺 paths.json，也无 journeys.json 可回退。<br>补：node scripts/paths-gen.mjs --run &lt;run&gt;");
  }
  function startPlay(edges, pi, node) {
    if (S.play) endPlay(); // 重复触发播放：先干净结束旧会话，避免两条链互相踩（M44k）
    setIA("pages");
    S.play = { edges, i: 0, paused: false, speed: 1, timer: null, pi: pi | 0, node: node || S.selNode };
    $("#dc-player").classList.add("on");
    playStep();
  }
  function playRender(e) {
    const pl = S.play;
    // 会话可能在异步间隙被结束/被新会话取代：不再渲染，绝不抛错（M44k 修 null.edges 崩溃）
    if (!pl) { console.warn("[dc] playRender: 会话已结束，跳过渲染"); return; }
    const segs = pl.edges.map((_, i) => `<i class="${i < pl.i ? "done" : i === pl.i ? "cur" : ""}"></i>`).join("");
    $("#dc-player").innerHTML = `<div class="segs">${segs}</div>
      <div class="row">
        <button id="pp-prev" title="上一步">⏮</button>
        <button id="pp-pause" title="暂停/继续">${pl.paused ? "▶" : "⏸"}</button>
        <button id="pp-next" title="下一步">⏭</button>
        <span class="txt"><span class="k">${pl.i + 1}/${pl.edges.length} · ${KIND_CN[e.kind] || "跳转"}</span>${esc(e.label || "")} <span style="color:var(--sh-mut)">→ ${idxOf(e.to)} ${esc(nodeTitle(e.to))}</span></span>
        <button id="pp-speed" title="倍速">${pl.speed}×</button>
        <button id="pp-rec" title="录制本路径视频（webm/mp4）">⏺</button>
        <button id="pp-end" title="结束">✕</button>
      </div>`;
    $("#pp-prev").onclick = () => { if (pl.i > 0) { pl.i--; playGoto(); } };
    $("#pp-next").onclick = () => { pl.i++; pl.i < pl.edges.length ? playGoto() : endPlay(); };
    $("#pp-pause").onclick = () => { if (S.play !== pl) return; pl.paused = !pl.paused; pl.paused ? clearTimeout(pl.timer) : scheduleNext(); playRender(((S.paths || {}).edges || {})[pl.edges[pl.i]] || e); };
    $("#pp-speed").onclick = () => { pl.speed = pl.speed === 1 ? 1.5 : pl.speed === 1.5 ? 2 : 1; scheduleNext(); playRender(e); };
    $("#pp-rec").onclick = () => runExport([{ type: "video", root: pl.node || S.selNode, path: pl.pi | 0 }, boardItem()]);
    $("#pp-end").onclick = endPlay;
  }
  async function playStep() {
    const pl = S.play; if (!pl || pl.i >= pl.edges.length) { console.warn("[dc] playStep: 无活跃会话或已播完", !!pl, pl && pl.i, pl && pl.edges.length); endPlay(); return; }
    const e = ((S.paths || {}).edges || {})[pl.edges[pl.i]];
    if (!e) { console.warn("[dc] playStep: 边缺失，结束播放", pl.edges[pl.i]); endPlay(); return; }
    if (e.from !== S.page) { try { await loadView(e.from); } catch {} }
    await new Promise((r) => setTimeout(r, 250));
    if (S.play !== pl) return; // 等待期间会话已结束/被取代
    const t = e.target_dc ? el(e.target_dc) : null;
    if (t) { const r = toWS(t.getBoundingClientRect()); const ring = document.createElement("div"); ring.className = "dc-ring"; Object.assign(ring.style, { left: r.x - 4 + "px", top: r.y - 4 + "px", width: r.w + 8 + "px", height: r.h + 8 + "px" }); W.overlay.appendChild(ring); }
    playRender(e);
    scheduleNext();
  }
  function scheduleNext() {
    const pl = S.play; if (!pl) return;
    clearTimeout(pl.timer);
    if (pl.paused) return;
    pl.timer = setTimeout(async () => {
      if (S.play !== pl) return; // 旧会话的定时器在新会话/结束后仍可能触发
      const e = ((S.paths || {}).edges || {})[pl.edges[pl.i]];
      if (!e) { console.warn("[dc] scheduleNext: 边缺失，结束播放", pl.edges[pl.i]); endPlay(); return; }
      try { await loadView(e.to); } catch {}
      pl.i++; playStep();
    }, 2400 / pl.speed);
  }
  function playGoto() { if (!S.play) return; clearTimeout(S.play.timer); playStep(); }
  function endPlay() { if (S.play) clearTimeout(S.play.timer); S.play = null; $("#dc-player").classList.remove("on"); }

  /* ---------- 演示模式 ---------- */
  async function startDemo(ji) {
    const j = S.journeys[ji];
    if (!j) { toast("演示旅程不存在（journeys.json 为空或序号越界）"); return; }
    if (!j.steps || !j.steps.length) { toast(`旅程「${j.name || ji}」没有步骤，无法演示`); return; }
    const d = S.demo; d.active = true; d.ji = ji;
    document.body.classList.add("dc-demo");
    window.__dcDemo = "running";
    await demoStep(0);
  }
  function endDemo() {
    S.demo.active = false; clearTimeout(S.demo.timer);
    document.body.classList.remove("dc-demo");
    ["#dc-caption", "#dc-sim", "#dc-summary"].forEach((s) => { const n = $(s); if (n) n.remove(); });
    window.__dcDemo = "done";
  }
  async function demoStep(i) {
    const j = S.journeys[S.demo.ji]; const s = j.steps[i];
    if (!s) return demoSummary();
    // M44k：journeys 数据可能缺 result/result.kind（旧链路只写了 target/label）——
    // 旧实现会把 undefined 直接渲染进字幕（"跳转undefined"），这里归一为 navigate 兜底
    s.result = { ...(s.result || {}) };
    if (!s.result.kind) s.result.kind = "navigate";
    if (s.result.kind === "navigate" && !s.result.to) {
      const t0 = el(s.target);
      s.result.to = (t0 && t0.getAttribute ? t0.getAttribute("data-goto") : "") || "";
    }
    if (s.page !== S.page) { try { await loadView(s.page); } catch {} }
    clearOverlay();
    const t = el(s.target); if (t) { t.scrollIntoView({ block: "center" }); const r = toWS(t.getBoundingClientRect()); const ring = document.createElement("div"); ring.className = "dc-ring"; Object.assign(ring.style, { left: r.x - 4 + "px", top: r.y - 4 + "px", width: r.w + 8 + "px", height: r.h + 8 + "px" }); W.overlay.appendChild(ring); }
    const old = $("#dc-sim"); if (old) old.remove();
    const K = s.result.kind;
    if (K === "dialog" || K === "blocked") {
      const d = document.createElement("div"); d.id = "dc-sim"; d.className = K === "blocked" ? "dc-sim blocked" : "dc-sim";
      d.innerHTML = `<b>${K === "blocked" ? "🚫 安全边界" : "💬 弹窗"}</b><div>${s.result.note || ""}</div>`;
      document.body.appendChild(d);
    } else if (K === "toast") {
      const d = document.createElement("div"); d.id = "dc-sim"; d.className = "dc-sim toast"; d.textContent = s.result.note || ""; document.body.appendChild(d);
    }
    let cap = $("#dc-caption"); if (!cap) { cap = document.createElement("div"); cap.id = "dc-caption"; document.body.appendChild(cap); }
    cap.innerHTML = `<span class="k" style="background:${KIND_COLOR[K] || KIND_COLOR.navigate}">${i + 1}/${j.steps.length} · ${KIND_CN[K] || KIND_CN.navigate}</span><b>${esc(s.label)}</b> <span style="color:#888">→ ${K === "navigate" ? s.result.to : s.result.note || ""}</span>
      <span style="float:right"><button id="dc-d-next">⏭</button><button id="dc-d-exit">✕ 退出</button></span><div class="bar"><i style="width:${((i + 1) / j.steps.length) * 100}%"></i></div>`;
    $("#dc-d-next").onclick = () => { clearTimeout(S.demo.timer); demoStep(i + 1); };
    $("#dc-d-exit").onclick = endDemo;
    S.demo.timer = setTimeout(() => demoStep(i + 1), (K === "blocked" ? 3600 : 2400) / S.demo.speed);
  }
  function demoSummary() {
    clearTimeout(S.demo.timer);
    const j = S.journeys[S.demo.ji];
    ["#dc-caption", "#dc-sim"].forEach((s) => { const n = $(s); if (n) n.remove(); });
    const sum = document.createElement("div"); sum.id = "dc-summary";
    sum.innerHTML = `<b>✔ 演示完成 · ${esc(j.name)}</b><div style="margin:6px 0;color:#666">${j.steps.length} 步</div>
      <button id="dc-s-replay">重播</button><button id="dc-s-ann">看批注</button><button id="dc-s-exit">退出</button>`;
    document.body.appendChild(sum);
    $("#dc-s-replay").onclick = () => { sum.remove(); startDemo(S.demo.ji); };
    $("#dc-s-ann").onclick = () => { endDemo(); S.ann = true; $("#dc-ann-toggle").classList.add("on"); redraw(); };
    $("#dc-s-exit").onclick = endDemo;
    window.__dcDemo = "done";
  }
  function demoChooser() {
    modal({
      title: "选择演示路径",
      body: S.journeys.map((j, i) => `<button class="opt" data-j="${i}">${esc(j.name)}（${j.steps.length} 步）</button>`).join(""),
      actions: [{ id: "cancel", label: "取消" }],
    }).then(() => {});
    $$("#dc-modal-root .opt").forEach((b) => (b.onclick = () => { $("#dc-modal-root").innerHTML = ""; startDemo(+b.dataset.j); }));
  }
/* inspector 分段 110-export.js —— 导出与分享：store-only zip/下载/选目录/并发锁 + 分享四入口
 * 源文件按文件名顺序拼接为 prototype/inspector.js（scripts/build-shell.mjs），同一 IIFE 闭包。
 * 约定：JS 只写几何与状态；排版/配色一律 inspector.css 类 + 主题变量。
 */
  /* ---------- 导出/分享/截图 ---------- */
  function boardItem() {
    return { type: "board", board: { page: S.page, ia: S.ia, selNode: S.selNode, selPath: S.selPath, selected: S.selected,
      product: S.products[S.ia === "scene" ? S.selNode : S.page] || null, at: new Date().toISOString() } };
  }
  function exportGroups() {
    const all = { id: "all", label: "导出全部（页面±标注 + 全场景树）", run: () => {
      const its = [];
      (DC.pages || []).forEach((p) => { its.push({ type: "page", id: p.id, ann: false }); its.push({ type: "page", id: p.id, ann: true }); });
      its.push({ type: "scene-full" }, boardItem(), { type: "design-json" }, { type: "figma" });
      return its;
    } };
    let ctx = null;
    if (S.ia === "scene" && S.flowMode === "tree" && S.selNode) ctx = { id: "sel-node", label: `导出选中树 ${idxOf(S.selNode)} ${nodeTitle(S.selNode)}`, run: () => [{ type: "node", id: S.selNode }, boardItem()] };
    else if (S.ia === "scene" && S.flowMode === "path" && S.selNode) ctx = { id: "sel-path", label: `导出选中路径 #${S.selPath + 1}`, run: () => [{ type: "path", id: S.selPath, root: S.selNode }, boardItem()] };
    else if (S.page) ctx = { id: "sel-page", label: `导出选中页 ${idxOf(S.page)} ${nodeTitle(S.page)} ±标注`, run: () => [{ type: "page", id: S.page, ann: false }, { type: "page", id: S.page, ann: true }, boardItem(), { type: "design-json", id: S.page }] };
    // M51：设计产物独立入口（生成期已有初始版；此处=编辑后重采集）
    const design = { id: "design", label: "产品设计 JSON（每页 spec）+ Figma 源", run: () => [{ type: "design-json" }, { type: "figma" }] };
    return [{ h: "", items: ctx ? [all, ctx, design] : [all, design] }];
  }
  /* ---------- M44k：导出真正落到用户本地 ----------
     旧实现只把文件写进服务端 run/export/<ts>/，浏览器里"导出"看不到任何下载（用户报的 bug）。
     现在三档：本地下载 zip（默认，前端零依赖打包 store-zip）/ 选目录导出（File System Access API）/ 仅存服务端（CLI 口径）。 */
  /* zip/CRC 已抽为叶子模块 templates/prototype/zipstore.js（UMD-lite：浏览器挂 window.DCZip，Node 可 require 做单测） */
  const b64ToU8 = (b64) => DCZip.b64ToU8(b64);
  const zipStore = (entries) => DCZip.zipStore(entries);
  const stamp = () => new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  function downloadBlob(name, blob) {
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 8000);
  }
  function download(name, text) { downloadBlob(name, new Blob([text], { type: "application/json" })); }
  const exportMode = () => localStorage.getItem("dc-export-mode") || "download";
  let exportBusy = false;
  function setExportBusy(on) {
    const b = $("#dc-export-btn");
    if (!b) return;
    b.classList.toggle("busy", on);
    b.textContent = on ? "导出中" : "导出 ▾";
  }
  async function requestExport(items, returnFiles) {
    const r = await fetch("/__dc_export__", { method: "POST", body: JSON.stringify({ scope: items.map((i) => i.type).join(","), items, returnFiles }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) throw new Error(j.error || ("HTTP " + r.status));
    return j;
  }
  async function exportToDir(items) {
    let dir;
    try { dir = await window.showDirectoryPicker({ mode: "readwrite" }); }
    catch (e) { if (e && e.name === "AbortError") return; throw new Error("目录选择不可用：" + e.message); }
    const j = await requestExport(items, true);
    if (!j.payload) throw new Error("服务端未回传文件内容（可能超出回传上限），已存 " + j.dir);
    for (const f of j.payload) {
      const seg = f.name.split("/");
      let cur = dir;
      for (const s of seg.slice(0, -1)) cur = await cur.getDirectoryHandle(s, { create: true });
      const fh = await cur.getFileHandle(seg[seg.length - 1], { create: true });
      const w = await fh.createWritable();
      await w.write(b64ToU8(f.b64)); await w.close();
    }
    return { count: j.payload.length, where: "所选目录" };
  }
  async function runExport(items) {
    if (exportBusy) { toast("导出进行中，请稍候…"); return; }
    const mode = exportMode();
    exportBusy = true; setExportBusy(true);
    try {
      if (mode === "dir" && window.showDirectoryPicker) {
        const r = await exportToDir(items);
        if (r) toast(`已写入${r.where}（${r.count} 文件）`);
        return;
      }
      if (mode === "dir") toast("当前浏览器不支持选目录，改用本地下载 zip");
      const wantFiles = mode !== "server";
      const j = await requestExport(items, wantFiles);
      if (!wantFiles || !j.payload) { toast(`已导出 → ${j.dir}（${j.files.length} 文件）`); return; }
      downloadBlob(`design-clone-export-${stamp()}.zip`, zipStore(j.payload.map((f) => ({ name: f.name, data: b64ToU8(f.b64) }))));
      toast(`已下载 ${j.payload.length} 个文件（zip）${j.truncated ? "；超量部分只在 " + j.dir : "；服务端副本 " + j.dir}`);
    } catch (e) {
      const b = items.find((i) => i.type === "board");
      if (b) download("board.json", JSON.stringify(b.board, null, 2));
      toast(/Failed to fetch|Load failed|NetworkError/i.test(String(e.message)) && b
        ? "图片导出需 node serve.mjs 服务；看板 JSON 已下载"
        : "导出失败：" + String(e.message).slice(0, 120) + (b ? "（看板 JSON 已下载）" : ""));
    } finally {
      exportBusy = false; setExportBusy(false);
    }
  }

  /* ---------- 分享：状态链接 / 纯净版 / 卡片版 / 全屏演示 ---------- */
  function shareURL(extra) {
    const u = new URL(location.href);
    const dev = DEVICES.find((d) => d.cls === shellClass());
    if (dev) u.searchParams.set("device", dev.cls);
    if (S.variant) u.searchParams.set("variant", S.variant);
    for (const [k, v] of Object.entries(extra || {})) u.searchParams.set(k, v);
    return u.toString();
  }
  function shareItems() {
    return [
      { h: "分享 / 演示" },
      { id: "link", label: "复制状态链接（含页面/场景/设备/变体）" },
      { id: "clean", label: "打开纯净版（无外壳，可嵌 iframe）" },
      { id: "card", label: "打开卡片版（截图/贴文档用）" },
      { id: "full", label: "全屏演示（观看者视角）" },
    ];
  }
  function renderShareDD() {
    const dd = $("#dc-share-dd");
    dd.innerHTML = shareItems().map((it) => (it.h ? `<div class="dd-h">${esc(it.h)}</div>` : `<button data-s="${it.id}">${esc(it.label)}</button>`)).join("");
    dd.querySelectorAll("button").forEach((b) => (b.onclick = () => { dd.hidden = true; $("#dc-share-btn").setAttribute("aria-expanded", "false"); shareAction(b.dataset.s); }));
  }
  async function shareAction(id) {
    if (id === "link") {
      const url = shareURL();
      try { await navigator.clipboard.writeText(url); toast("已复制状态链接，可直接分享"); }
      catch { notify("复制链接", esc(url)); }
      return;
    }
    if (id === "clean" || id === "card") { window.open(shareURL(id === "clean" ? { embed: "1" } : { card: "1" }), "_blank"); return; }
    if (id === "full") {
      try { if (document.fullscreenEnabled) await document.documentElement.requestFullscreen(); } catch { /* 全屏被拒时仍进入演示 */ }
      if (S.journeys.length) { S.journeys.length > 1 ? demoChooser() : startDemo(0); }
      else playPath(S.ia === "scene" ? S.selPath : 0);
    }
  }
  function toast(msg) {
    let t = $("#dc-toast"); if (!t) { t = document.createElement("div"); t.id = "dc-toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false;
    setTimeout(() => (t.hidden = true), 3200);
  }
/* inspector 分段 120-compare-code.js —— 原截图对照回退链 + 同步滚动 + 代码视图/setVM
 * 源文件按文件名顺序拼接为 prototype/inspector.js（scripts/build-shell.mjs），同一 IIFE 闭包。
 * 约定：JS 只写几何与状态；排版/配色一律 inspector.css 类 + 主题变量。
 */
  /* ---------- 对照回退链 ---------- */
  function compareChain(id) {
    const ch = [];
    if (S.srcmap[id]) ch.push("../" + S.srcmap[id]);
    ch.push(`../capture/screens/${id}.png`);
    ch.push(`../capture/frames/img-${idxOf(id)}.jpeg`, "../capture/frames/img-01.jpeg");
    return ch;
  }
  function syncCompareScale() {
    const img = $("#dc-compare-body img");
    if (!img) return;
    img.style.width = Math.round(W.phone.offsetWidth * S.scale) + "px";
  }
  let cmpGuard = false;
  function compareSyncScroll(src, dst) {
    if (cmpGuard) return;
    const sm = src.scrollHeight - src.clientHeight, dm = dst.scrollHeight - dst.clientHeight;
    if (sm <= 0 || dm <= 0) return;
    cmpGuard = true;
    dst.scrollTop = (src.scrollTop / sm) * dm;
    requestAnimationFrame(() => (cmpGuard = false));
  }
  function setCompareSrc(id) {
    const img = $("#dc-compare-body img");
    const chain = compareChain(id);
    img.onerror = () => {
      const cur = img.dataset.ci | 0;
      if (cur + 1 < chain.length) { img.dataset.ci = cur + 1; img.src = chain[cur + 1]; }
      else { img.style.display = "none"; let m = $("#dc-compare .miss"); if (!m) { m = document.createElement("div"); m.className = "miss"; m.textContent = "无对应原截图（capture/screens 或 frames 缺失）"; $("#dc-compare-body").appendChild(m); } }
    };
    img.onload = () => { $("#dc-compare-src").textContent = img.src.split("/").slice(-2).join("/"); syncCompareScale(); };
    img.style.display = "";
    const miss = $("#dc-compare .miss"); if (miss) miss.remove();
    img.dataset.ci = 0; img.src = chain[0];
  }

  /* ---------- 代码视图 ---------- */
  function fillCode() {
    $("#dc-code-title").textContent = `views/${S.page}.html`;
    $("#dc-code-pre").textContent = S.lastHTML;
  }
  function setVM(vm) {
    S.vm = vm;
    $$("#dc-viewmode button").forEach((b) => b.classList.toggle("on", b.dataset.vm === vm));
    W.single.hidden = S.ia !== "pages" || vm === "code";
    W.flow.hidden = S.ia !== "scene" || vm === "code";
    $("#dc-code").hidden = vm !== "code";
    if (vm === "code") fillCode();
  }
/* inspector 分段 130-shell.js —— 设备壳：shellClass/状态栏与窗框注入/applyShellClasses/设备下拉与持久化
 * 源文件按文件名顺序拼接为 prototype/inspector.js（scripts/build-shell.mjs），同一 IIFE 闭包。
 * 约定：JS 只写几何与状态；排版/配色一律 inspector.css 类 + 主题变量。
 */
  /* ---------- 平台 shell 四档 + 状态栏（M44k：全部由 DEVICES 单一真源驱动） ---------- */
  function shellClass() { return S.device || SHELL_ALIAS[DC.shell] || "dc-mobile"; }
  function isTouch() { return deviceOf(shellClass()).touch; }
  function isLarge() { return !deviceOf(shellClass()).touch; }
  function shellLabel() { return deviceOf(shellClass()).long; }
  /* 状态栏图标：借鉴 open-design mobile-app 种子（Apache-2.0）的填充式画法；
     注意必须用 inline style 而非 fill/stroke 属性（全局 svg{} CSS 会覆盖表现属性） */
  const SB_ICONS = `<span class="sb-ic"><svg width="15" height="11" viewBox="0 0 17 11" style="fill:currentColor;stroke:none"><rect x="0" y="7" width="3" height="4" rx="0.6"/><rect x="4" y="5" width="3" height="6" rx="0.6"/><rect x="8" y="3" width="3" height="8" rx="0.6"/><rect x="12" y="0" width="3" height="11" rx="0.6"/></svg><svg width="15" height="11" viewBox="0 0 17 11" style="fill:currentColor;stroke:none"><path d="M8.5 1.5C5.5 1.5 2.7 2.6 0.5 4.6L2 6.1C3.8 4.5 6.1 3.6 8.5 3.6c2.4 0 4.7 0.9 6.5 2.5l1.5-1.5c-2.2-2-5-3.1-8-3.1zM3.5 7.6L5 9.1c1-0.9 2.2-1.4 3.5-1.4 1.3 0 2.5 0.5 3.5 1.4l1.5-1.5c-1.4-1.3-3.1-2-5-2-1.9 0-3.6 0.7-5 2zM6.5 10.6l2 2 2-2c-0.5-0.5-1.2-0.8-2-0.8s-1.5 0.3-2 0.8z"/></svg><svg width="22" height="11" viewBox="0 0 25 11" style="fill:none;stroke:none"><rect x="0.5" y="0.5" width="21" height="10" rx="2.5" stroke="currentColor" stroke-opacity="0.45" stroke-width="1"/><rect x="22.5" y="3.5" width="1.5" height="4" rx="0.4" fill="currentColor" fill-opacity="0.45"/><rect x="2" y="2" width="13.5" height="7" rx="1.4" fill="currentColor"/></svg></span>`;
  function buildFrameChrome() {
    W.phone.querySelectorAll(".dc-framebar, .dc-statusbar").forEach((n) => n.remove());
    if (document.body.classList.contains("dc-chromeless") || document.body.classList.contains("dc-cardview")) return;
    const c = shellClass();
    const title = ($("#dc-title") || {}).textContent || "";
    if (!S.frame) return;
    if (isTouch()) {
      const ios = ((DC.platform || {}).platform || "ios") === "ios";
      if (ios) {
        const isl = document.createElement("span");
        isl.className = "dc-island";
        W.phone.prepend(isl);
      }
      // M19：视图未自带状态栏时壳层自动注入（微信等 live 视图恢复状态栏）
      // M44k：排版改用 .dc-sb-injected 双类（比 run 视图 CSS 的 .dc-statusbar 更具体），
      //       不再用 inline cssText —— inline 会压过 inspector.css，是"改了 CSS 却没生效"这类反复 bug 的温床
      if (!W.stage.querySelector(".dc-statusbar,[data-dc-statusbar]")) {
        const sb = document.createElement("div");
        sb.className = "dc-statusbar dc-sb-injected";
        sb.innerHTML = `<span class="sb-time">9:41</span>${SB_ICONS}`;
        W.phone.prepend(sb);
      }
    } else if (c === "dc-browser") {
      const bar = document.createElement("div");
      bar.className = "dc-framebar";
      bar.innerHTML = `<span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="tab">${esc(title)}</span><span class="urlbar">🔒 ${esc(((DC.platform || {}).url) || "https://" + (((DC.platform || {}).host) || "example.com"))}</span><span>＋</span>`;
      W.phone.prepend(bar);
    } else if (c === "dc-desktop") {
      const os = ((DC.platform || {}).os) || "mac";
      const bar = document.createElement("div");
      bar.className = "dc-framebar";
      bar.innerHTML = os === "win"
        ? `<span>⊞</span><span>${esc(title)}</span><span class="win-cap"><span>─</span><span>▢</span><span>✕</span></span>`
        : `<span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span style="margin:0 auto">${esc(title)}</span><span style="width:52px"></span>`;
      W.phone.prepend(bar);
    }
  }
  function applyShellClasses() {
    const dev = deviceOf(shellClass());
    DEVICES.forEach((d) => document.body.classList.remove(d.cls));
    document.body.classList.add(dev.cls);
    $("#dc-device-label").textContent = dev.label;
    // M44f：shell 尺寸用 inline 兜底（防视图 css 级联把桌面窗压成手机宽——desktop run 排版崩坏根因）
    W.phone.style.width = dev.size[0] + "px"; W.phone.style.height = dev.size[1] + "px";
  }
  /** 设备下拉：由 DEVICES 渲染（改名只改一处）；选择持久化 + 进 URL，刷新与分享都不丢 */
  function renderDeviceDD() {
    const dd = $("#dc-device-dd");
    dd.innerHTML = DEVICES.map((d) =>
      `<button role="menuitem" data-cls="${d.cls}"${d.cls === shellClass() ? ' class="on"' : ""}>${esc(d.label)}<span class="dd-sub">${d.size[0]}×${d.size[1]}</span></button>`).join("");
    dd.querySelectorAll("button").forEach((b) => (b.onclick = () => {
      dd.hidden = true; $("#dc-device-btn").setAttribute("aria-expanded", "false"); setDevice(b.dataset.cls);
    }));
  }
  function setDevice(cls) {
    if (!DEVICES.some((d) => d.cls === cls)) { toast("未知设备档：" + cls); return; }
    S.device = cls;
    try { localStorage.setItem("dc-device", cls); } catch { /* 隐私模式下忽略 */ }
    setQueryParam("device", cls);
    applyShellClasses(); renderDeviceDD(); buildFrameChrome();
    if (S.ia === "pages") fit(); else renderFlow();
    fillDetail();
    const dev = deviceOf(cls);
    toast(`设备：${dev.label}（${dev.size[0]}×${dev.size[1]}）`);
  }
/* inspector 分段 140-events.js —— 模式开关/抓手/提示 + 标注编辑器(可写) + 产品说明编辑器(可写)
 * 源文件按文件名顺序拼接为 prototype/inspector.js（scripts/build-shell.mjs），同一 IIFE 闭包。
 * 约定：JS 只写几何与状态；排版/配色一律 inspector.css 类 + 主题变量。
 */
  /* ---------- 模式/事件 ---------- */
  function applyMode() { redraw(); }
  function setEdit(on) {
    S.edit = on;
    $("#dc-read").classList.toggle("on", !on);
    $("#dc-edit").classList.toggle("on", on);
    fillDetail();
  }
  let pan = null;
  function panStart(e) { pan = { x: e.clientX, y: e.clientY, sl: W.screen.scrollLeft, st: W.screen.scrollTop }; }
  function panEnd() { pan = null; }
  window.addEventListener("pointermove", (e) => { if (pan && !drag) { W.screen.scrollLeft = pan.sl - (e.clientX - pan.x); W.screen.scrollTop = pan.st - (e.clientY - pan.y); } });
  let tipEl = null;
  function tip(e) {
    const t = e.target.closest("[data-dc]");
    const a = t && (S.ann_data[S.page] || []).find((x) => x.target === t.getAttribute("data-dc"));
    if (!a) { if (tipEl) { tipEl.remove(); tipEl = null; } return; }
    if (!tipEl) { tipEl = document.createElement("div"); tipEl.className = "dc-tip"; document.body.appendChild(tipEl); }
    tipEl.innerHTML = `<b>${esc(a.label)}</b><br>` + (a.notes || []).map((n) => `<span style="color:var(--sh-mut)">${esc(n.event)}</span> → ${esc(n.response)}`).join("<br>");
    tipEl.style.left = e.clientX + 14 + "px"; tipEl.style.top = e.clientY + 10 + "px";
  }

  /* ---------- 标注：可读**也可写**（M44k） ----------
     旧实现只 fetch annotations.json 展示，无法在原型里补批注（"活 PRD"缺一半）。
     现在标注模式下点元素即弹编辑器，写回 prototype/annotations.json；离线打开时回退 localStorage。 */
  async function saveAnnotations() {
    const r = await writeFile("prototype/annotations.json", S.ann_data);
    const cnt = $("#dc-ann-toggle .cnt");
    if (cnt) cnt.textContent = (S.ann_data[S.page] || []).length || "";
    redraw(); fillDetail();
    return r;
  }
  async function editAnnotation(target) {
    const page = S.page;
    if (!page || !target) { toast("请先在页面模式选中一个元素"); return; }
    const list = S.ann_data[page] || (S.ann_data[page] = []);
    const i = list.findIndex((a) => a.target === target);
    const cur = i >= 0 ? list[i] : {};
    const n0 = (cur.notes || [])[0] || {};
    const res = await modal({
      title: i >= 0 ? "编辑标注" : "新增标注",
      body: `<div style="color:var(--sh-mut);font-size:11px">元素 ${esc(target)} · 页面 ${idxOf(page)} ${esc(nodeTitle(page))}</div>` +
        ((cur.notes || []).length > 1 ? `<div class="dc-ann-list">${cur.notes.slice(1).map((n) => `<div class="it"><span class="ev">${esc(n.event)}</span> → ${esc(n.response)}</div>`).join("")}</div><div class="hint">下面编辑第 1 条交互，其余保留</div>` : ""),
      fields: [
        { id: "label", label: "控件名 / 标题", value: cur.label || "" },
        { id: "event", label: "交互（点击 / 长按 / 开关 / 输入…）", value: n0.event || "点击" },
        { id: "response", label: "应有响应（跳转 / 弹窗 / 提示 / 状态变化…）", value: n0.response || "" },
        { id: "note", label: "产品批注（可空）", type: "textarea", value: cur.note || "" },
      ],
      actions: i >= 0
        ? [{ id: "cancel", label: "取消" }, { id: "del", label: "删除", danger: true }, { id: "ok", label: "保存", pr: true }]
        : [{ id: "cancel", label: "取消" }, { id: "ok", label: "保存", pr: true }],
    });
    if (!res) return;
    if (res.action === "del") {
      list.splice(i, 1);
      const r = await saveAnnotations();
      toast(r.ok ? "标注已删除并落盘" : "标注已删除（仅浏览器，未落盘）");
      return;
    }
    const v = res.value;
    const rest = (cur.notes || []).slice(1);
    const notes = v.response ? [{ event: v.event || "点击", response: v.response }, ...rest] : rest;
    const next = { target, label: v.label || cur.label || target, note: v.note || "", notes };
    if (i >= 0) list[i] = next; else list.push(next);
    const r = await saveAnnotations();
    toast(r.ok ? "标注已保存到 prototype/annotations.json" : "标注只存到浏览器（离线）：起 node serve.mjs 才能落盘");
  }

  /* ---------- 产品说明可编辑（M44k）：products.json 不再只能手改 ---------- */
  async function editProduct(id) {
    if (!id) return;
    const cur = S.products[id] || {};
    const res = await modal({
      title: "编辑产品说明（活 PRD）",
      body: `<div style="color:var(--sh-mut);font-size:11px">${idxOf(id)} ${esc(nodeTitle(id))} → prototype/products.json</div>`,
      fields: [
        { id: "function", label: "功能（这屏/这块做什么）", type: "textarea", rows: 4, value: cur.function || "" },
        { id: "goals", label: "目标（顿号或逗号分隔）", value: (cur.goals || []).join("、") },
      ],
      actions: [{ id: "cancel", label: "取消" }, { id: "ok", label: "保存", pr: true }],
    });
    if (!res) return;
    const v = res.value;
    S.products[id] = {
      ...cur,
      function: v.function || cur.function || "",
      goals: String(v.goals || "").split(/[、,，]/).map((s) => s.trim()).filter(Boolean),
    };
    const r = await writeFile("prototype/products.json", S.products);
    fillDetail();
    toast(r.ok ? "产品说明已保存到 prototype/products.json" : "产品说明只存到浏览器（离线）：起 node serve.mjs 才能落盘");
  }
/* inspector 分段 150-bind.js —— 帮助浮层 + 全部事件绑定(顶栏/底栏/画布/键盘)
 * 源文件按文件名顺序拼接为 prototype/inspector.js（scripts/build-shell.mjs），同一 IIFE 闭包。
 * 约定：JS 只写几何与状态；排版/配色一律 inspector.css 类 + 主题变量。
 */
  /* ---------- 帮助（快捷键单一真源 SHORTCUTS） ---------- */
  function showHelp() {
    modal({
      title: "快捷键",
      body: `<div class="sc">${SHORTCUTS.map(([k, d]) => `<kbd>${esc(k)}</kbd><span>${esc(d)}</span>`).join("")}</div>
        <div class="hint">标注模式（A）下点画面元素可新增/编辑批注；编辑模式（E）下拖拽元素、右栏改样式，Ctrl/⌘+Z 撤销。</div>`,
      actions: [{ id: "ok", label: "知道了", pr: true }],
    });
  }

  function bind() {
    $$("#dc-rail [data-ia]").forEach((b) => (b.onclick = () => setIA(b.dataset.ia)));
    $("#dc-flow-toggle").addEventListener("click", (e) => { const b = e.target.closest("[data-fm]"); if (!b) return; S.flowMode = b.dataset.fm; renderFlow(); fillDetail(); syncURL(true); updateCrumb(); });
    $("#dc-zoom-in").onclick = () => zoomBy(1.2);
    $("#dc-zoom-out").onclick = () => zoomBy(1 / 1.2);
    $("#dc-zoom-100").onclick = () => (S.ia === "scene" ? setFZoom(1) : setScale(1));
    $("#dc-zoom-fit").onclick = fit;
    $("#dc-hand").onclick = (e) => { S.hand = !S.hand; e.target.classList.toggle("on", S.hand); };
    $("#dc-compare-btn").onclick = (e) => {
      document.body.classList.toggle("dc-compare"); e.currentTarget.classList.toggle("on");
      syncCompareScale();
      if (document.body.classList.contains("dc-compare") && S.ia === "pages") setTimeout(fit, 60);
    };
    $("#dc-compare-x").onclick = () => { document.body.classList.remove("dc-compare"); $("#dc-compare-btn").classList.remove("on"); };
    $("#dc-theme").onclick = () => { const n = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; document.documentElement.dataset.theme = n; localStorage.setItem("dc-theme", n); };
    $("#dc-demo").onclick = () => {
      if (S.demo.active) return endDemo();
      if (!S.journeys.length) return notify("无演示旅程", "本 run 没有 journeys.json（demo 范围可无；full 范围应由 gen/flows-skeleton.mjs 或 gen/flows-from-events.mjs 生成）。<br>可改用底栏「播放」按路径演播。");
      if (S.journeys.length > 1) demoChooser(); else startDemo(0);
    };
    $("#dc-left-fold").onclick = () => { document.body.classList.toggle("dc-left-off"); $("#dc-left-fold").textContent = document.body.classList.contains("dc-left-off") ? "›" : "‹"; };
    $("#dc-right-fold").onclick = () => { document.body.classList.toggle("dc-right-off"); };
    $("#dc-read").onclick = () => setEdit(false);
    $("#dc-edit").onclick = () => setEdit(true);
    $("#dc-ann-toggle").onclick = (e) => { S.ann = !S.ann; e.currentTarget.classList.toggle("on", S.ann); redraw(); fillDetail(); };
    $("#dc-frame-toggle").onclick = (e) => {
      S.frame = !S.frame; localStorage.setItem("dc-frame", S.frame ? "1" : "0");
      document.body.classList.toggle("dc-framed", S.frame);
      e.currentTarget.classList.toggle("on", S.frame);
      buildFrameChrome(); if (S.ia === "pages" && isLarge()) fit();
    };
    $("#dc-labels-toggle").onclick = (e) => {
      S.labels = !S.labels; localStorage.setItem("dc-labels", S.labels ? "1" : "0");
      document.body.classList.toggle("dc-labels", S.labels);
      e.currentTarget.classList.toggle("on", S.labels);
    };
    $("#dc-undo").onclick = undo;
    $("#dc-restore").onclick = restore;
    $("#dc-play").onclick = () => playPath(S.ia === "scene" ? S.selPath : 0);
    $("#dc-share-btn").onclick = () => {
      const dd = $("#dc-share-dd");
      dd.hidden = !dd.hidden;
      $("#dc-share-btn").setAttribute("aria-expanded", String(!dd.hidden));
      if (!dd.hidden) renderShareDD();
    };
    $("#dc-shot-btn").onclick = () => {
      if (!S.page) { toast("请先选择一个页面再截图"); return; }
      runExport([{ type: "page", id: S.page, ann: S.ann }, boardItem()]);
    };
    $$("#dc-viewmode button").forEach((b) => (b.onclick = () => setVM(b.dataset.vm)));
    $("#dc-code-copy").onclick = () => navigator.clipboard.writeText(S.lastHTML).then(() => toast("已复制视图 HTML"));
    $("#dc-code-open").onclick = () => window.open(`views/${S.page}.html`, "_blank");
    $("#dc-device-btn").onclick = () => {
      const dd = $("#dc-device-dd");
      dd.hidden = !dd.hidden;
      $("#dc-device-btn").setAttribute("aria-expanded", String(!dd.hidden));
      if (!dd.hidden) renderDeviceDD();
    };
    $("#dc-export-btn").onclick = () => {
      const dd = $("#dc-export-dd");
      dd.hidden = !dd.hidden;
      $("#dc-export-btn").setAttribute("aria-expanded", String(!dd.hidden));
      if (dd.hidden) return;
      const mode = exportMode();
      dd.innerHTML =
        `<div class="dd-h">导出到</div><div class="dd-modes">${EXPORT_MODES.map((m) =>
          `<button data-m="${m.id}" class="${m.id === mode ? "on" : ""}" title="${m.id === "server" ? "只写 run/export/<时间戳>/（CLI 口径）" : m.id === "dir" ? "用系统目录选择器写到任意本地目录" : "浏览器直接下载 zip（默认）"}">${esc(m.label)}</button>`).join("")}</div>` +
        (window.showDirectoryPicker ? "" : `<div class="dd-h">此浏览器不支持选目录，将自动改用 zip 下载</div>`) +
        `<div class="dd-h">范围</div>` +
        exportGroups().map((g) => (g.h ? `<div class="dd-h">${esc(g.h)}</div>` : "") + g.items.map((it) => `<button data-x="${it.id}">${esc(it.label)}</button>`).join("")).join("");
      dd.querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => {
        localStorage.setItem("dc-export-mode", b.dataset.m);
        dd.querySelectorAll("[data-m]").forEach((x) => x.classList.toggle("on", x === b));
        toast("导出方式：" + (EXPORT_MODES.find((m) => m.id === b.dataset.m) || {}).label);
      }));
      dd.querySelectorAll("[data-x]").forEach((b) => (b.onclick = () => {
        dd.hidden = true;
        const it = exportGroups().flatMap((g) => g.items).find((x) => x.id === b.dataset.x);
        if (it) runExport(it.run());
      }));
      a11yPass(dd);
    };
    const q = $("#dc-q");
    if (q) q.oninput = () => { S.filter = q.value; applyFilter(); };
    document.addEventListener("click", (e) => {
      const close = (wrapSel, ddSel, btnSel) => {
        if (e.target.closest(wrapSel)) return;
        const dd = $(ddSel); if (dd) dd.hidden = true;
        const b = $(btnSel); if (b) b.setAttribute("aria-expanded", "false");
      };
      close("#dc-export-wrap", "#dc-export-dd", "#dc-export-btn");
      close("#dc-device-wrap", "#dc-device-dd", "#dc-device-btn");
      close("#dc-share-wrap", "#dc-share-dd", "#dc-share-btn");
    });

    W.workspace.addEventListener("wheel", (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? 1.1 : 0.9);
    }, { passive: false });
    W.screen.addEventListener("scroll", () => requestAnimationFrame(redraw), { passive: true });
    W.screen.addEventListener("scroll", () => { const cb = $("#dc-compare-body"); if (cb && document.body.classList.contains("dc-compare")) compareSyncScroll(W.screen, cb); }, { passive: true });
    $("#dc-compare-body").addEventListener("scroll", () => compareSyncScroll($("#dc-compare-body"), W.screen), { passive: true });
    window.addEventListener("resize", () => requestAnimationFrame(redraw));

    W.stage.addEventListener("pointerdown", (e) => {
      if (S.ia !== "pages") return;
      const t = e.target.closest("[data-dc]");
      if (S.edit && t) { e.preventDefault(); e.stopPropagation(); startDrag(e, t); return; }
      if (S.hand) panStart(e);
    }, true);
    W.stage.addEventListener("click", (e) => {
      if (S.ia !== "pages" || S.demo.active) return;
      // M47：选中回退链——凡"可点且有反应"的控件都能选中进看板/可标注，不限 data-dc
      const selElem = (root) => root.closest("[data-dc]") ||
        root.closest('[data-act],[data-goto],button,a,input,select,textarea,[role=button],[role=tab],[role=switch],[role=checkbox],[role=radio]');
      const selId = (t) => {
        if (!t || !W.stage.contains(t)) return null;
        const d = t.getAttribute("data-dc");
        if (d) return d;
        const id = synthId(t);
        t.setAttribute("data-dc-auto", id);
        return id;
      };
      // 标注模式：点元素=编辑批注（不触发原型交互，避免"边标注边跳页"）
      if (S.ann && !S.edit) {
        const at = selElem(e.target);
        if (at) {
          e.preventDefault(); e.stopPropagation();
          S.selected = selId(at);
          fillDetail(); redraw();
          editAnnotation(S.selected);
          return;
        }
      }
      const actEl = e.target.closest("[data-act]");
      if (actEl && !S.edit && window.DCRuntime) {
        e.preventDefault(); e.stopPropagation();
        window.DCRuntime.handleClick(actEl, e);
        const d = selId(actEl);
        if (d) { S.selected = d; fillDetail(); redraw(); }
        return;
      }
      const nav = e.target.closest("[data-goto]");
      if (nav && !S.edit) {
        e.preventDefault();
        const t = nav.dataset.goto;
        if (t.startsWith("placeholder:")) notify("原型占位", esc(t.slice(10)) + "（范围外/安全边界，不克隆）");
        else loadView(t).catch((err) => notify("加载失败", esc(err.message)));
        return;
      }
      S.selected = selId(selElem(e.target));
      fillDetail();
      redraw();
    }, true);
    W.stage.addEventListener("mousemove", (e) => {
      if (drag) {
        const dx = drag.dx + (e.clientX - drag.sx) / S.scale, dy = drag.dy + (e.clientY - drag.sy) / S.scale;
        drag.t.style.transform = `translate(${dx}px, ${dy}px)`;
        ((S.overrides[drag.page || S.page] ||= {})[drag.dc] ||= {}).dx = dx;
        S.overrides[S.page][drag.dc].dy = dy;
        return;
      }
      if (S.selected) measure(e);
      if (S.ann) tip(e);
    });
    window.addEventListener("pointerup", () => { finishDrag(); panEnd(); });

    window.addEventListener("keydown", (e) => {
      if (/input|textarea|select/i.test(e.target.tagName)) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); return; }
      if (S.demo.active && e.key === "Escape") return endDemo();
      if (S.play && e.key === "Escape") return endPlay();
      if (e.key === "1") setIA("pages");
      else if (e.key === "2") setIA("scene");
      else if (e.key === "e" || e.key === "E") setEdit(!S.edit);
      else if (e.key === "a" || e.key === "A") $("#dc-ann-toggle").click();
      else if (e.key === "d" || e.key === "D") $("#dc-demo").click();
      else if (e.key === "p" || e.key === "P") $("#dc-play").click();
      else if (e.key === "h" || e.key === "H") $("#dc-hand").click();
      else if (e.key === "f" || e.key === "F") $("#dc-frame-toggle").click();
      else if (e.key === "?" || e.key === "/") showHelp();
      else if (e.key === "+" || e.key === "=") zoomBy(1.2);
      else if (e.key === "-") zoomBy(1 / 1.2);
      else if (e.key === "0") (S.ia === "scene" ? setFZoom(1) : setScale(1));
      else if (e.key === "Escape") {
        ["#dc-export-dd", "#dc-device-dd", "#dc-share-dd"].forEach((s) => { const n = $(s); if (n) n.hidden = true; });
        const mr = $("#dc-modal-root"); if (mr && mr.innerHTML) mr.innerHTML = "";
      }
    });
    window.addEventListener("popstate", () => applyHash(false));
    window.addEventListener("hashchange", () => applyHash(false));
  }
/* inspector 分段 160-boot.js —— boot：主题/壳/设备/数据加载/初始视图/a11y 观察器
 * 源文件按文件名顺序拼接为 prototype/inspector.js（scripts/build-shell.mjs），同一 IIFE 闭包。
 * 约定：JS 只写几何与状态；排版/配色一律 inspector.css 类 + 主题变量。
 */
    /* M49 缓存自愈：查询串破缓存会被启发式缓存/代理忽略（"修了没生效"真根因）。
     文件名哈希为主；boot 时校验已生效的 inspector.<build>.css，不匹配则 cache:reload 强刷一次（sessionStorage 防环）。 */
  (function selfHealCache() {
    const b = window.DC_BUILD; if (!b) return;
    const ok = [...document.styleSheets].some((sh) => (sh.href || "").includes("inspector." + b + ".css"));
    if (ok) return;
    try { if (sessionStorage.getItem("dc-cb") === b) return; sessionStorage.setItem("dc-cb", b); } catch {}
    fetch("inspector." + b + ".css", { cache: "reload" }).then(() => location.reload()).catch(() => {});
  })();
/* ---------- boot ---------- */
  let a11yQueued = false;
  async function boot() {
    const saved = localStorage.getItem("dc-theme");
    document.documentElement.dataset.theme = saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    // M70：宿主站点主题联动（?theme= 初始 + postMessage 实时）
    const qt = Q.get("theme");
    if (qt === "dark" || qt === "light") { document.documentElement.dataset.theme = qt; localStorage.setItem("dc-theme", qt); }
    window.addEventListener("message", (ev) => {
      const d = ev.data;
      if (d && d.type === "dc-theme" && (d.theme === "dark" || d.theme === "light")) {
        document.documentElement.dataset.theme = d.theme; localStorage.setItem("dc-theme", d.theme);
      }
    });
    if (Q.get("embed")) document.body.classList.add("dc-embed");
    if (Q.get("card") === "1") document.body.classList.add("dc-cardview");
    if (Q.get("chrome") === "0") document.body.classList.add("dc-chromeless");
    // 设备档优先级：URL ?device= > localStorage > platform.json（此前刷新即丢、分享链接也带不上）
    const known = (v) => (DEVICES.some((d) => d.cls === v) ? v : null);
    S.device = known(Q.get("device")) || known(localStorage.getItem("dc-device")) || null;
    applyShellClasses();
    renderDeviceDD();
    document.body.classList.toggle("dc-framed", S.frame);
    document.body.classList.toggle("dc-labels", S.labels);
    $("#dc-frame-toggle").classList.toggle("on", S.frame);
    $("#dc-labels-toggle").classList.toggle("on", S.labels);
    buildFrameChrome();
    if (Q.get("ann") === "1") { S.ann = true; $("#dc-ann-toggle").classList.add("on"); }

    renderPages();
    bind();
    a11yPass();
    // 下拉/播放器/模态都是动态渲染的，用观察器统一补 aria-label
    new MutationObserver(() => {
      if (a11yQueued) return;
      a11yQueued = true;
      requestAnimationFrame(() => { a11yQueued = false; a11yPass(); });
    }).observe(document.body, { childList: true, subtree: true });

    if (window.DCRuntime) {
      window.DCRuntimeHooks = {
        goto: (id) => { const s = String(id || ""); if (s.startsWith("placeholder:")) notify("原型占位", esc(s.slice(10)) + "（范围外/安全边界，不克隆）"); else loadView(s).catch((err) => notify("加载失败", esc(err.message))); },
        toast: (m) => toast(m),
        back: () => { if (history.length > 1) history.back(); else loadView((DC.pages[0] || {}).id).catch(() => {}); },
      };
      DCRuntime.attach(W.stage);
    }
    await loadOverrides();
    S.ann_data = await readJSON("annotations.json", "dc-ann", {});
    S.journeys = await readJSON("journeys.json", null, []);
    window.__dcJourneys = S.journeys.length;
    S.products = await readJSON("products.json", "dc-products", {});
    S.paths = await readJSON("paths.json", null, null);
    S.srcmap = await readJSON("../knowledge/source-map.json", null, {});
    renderSceneTree();

    const view = Q.get("view");
    if (view === "tree" || view === "path") {
      S.flowMode = view === "path" ? "path" : "tree";
      S.selNode = Q.get("root") === "__all__" ? (S.paths && S.paths.roots[0]) : Q.get("root") || (S.paths && S.paths.roots[0]);
      if (Q.get("path")) S.selPath = +Q.get("path");
      setIA("scene", false);
      if (Q.get("play") != null) setTimeout(() => playPath(S.selPath || 0), 600);
    } else {
      const handled = await applyHash(false);
      if (!handled && !S.page) {
        setIA("pages", false);
        const initial = (DC.pages[0] || {}).id;
        if (initial) await loadView(initial);
      }
    }
    if (!S.variant) tweaksApply(tweaksStore());
    if (!Q.get("chrome") && !Q.get("card") && !Q.get("embed")) setTimeout(() => { if (S.ia === "pages" && isLarge()) fit(); }, 300);
  }
  boot();
})();
