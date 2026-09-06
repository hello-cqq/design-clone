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
    play: null, lastHTML: "",
  };
  const KIND_COLOR = { navigate: "#07C160", dialog: "#1677FF", toast: "#FA9D3B", state: "#1677FF", instant: "#FA9D3B", blocked: "#FA5151" };
  const KIND_CN = { navigate: "跳转", dialog: "弹窗", toast: "提示", state: "状态变化", instant: "即时反馈", blocked: "安全拦截" };
  const TOKEN_KEYS = ["--color-primary", "--color-accent", "--color-bg", "--color-surface", "--color-text-primary", "--color-text-secondary", "--color-border", "--color-link", "--radius-card"];
  const Q = new URLSearchParams(location.search);

  const el = (sel) => W.stage.querySelector(`[data-dc="${sel}"]`);
  const toWS = (r) => { const w = W.workspace.getBoundingClientRect(); return { x: r.left - w.left, y: r.top - w.top, r: r.right - w.left, b: r.bottom - w.top, cx: (r.left + r.right) / 2 - w.left, cy: (r.top + r.bottom) / 2 - w.top, w: r.width, h: r.height }; };
  const rgb2hex = (c) => { const m = c.match(/rgba?\(([\d.]+), ([\d.]+), ([\d.]+)/); if (!m) return c; return "#" + [m[1], m[2], m[3]].map((v) => Math.round(+v).toString(16).padStart(2, "0")).join(""); };
  const idxOf = (id) => (id || "").slice(0, 2);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  /* ---------- modal ---------- */
  function modal({ title, body = "", input = null, actions = [{ id: "ok", label: "好", pr: true }] }) {
    return new Promise((res) => {
      const root = $("#dc-modal-root");
      const mask = document.createElement("div");
      mask.className = "dc-modal-mask";
      mask.innerHTML = `<div class="dc-modal"><h3>${title}</h3><div>${body}</div>${input != null ? `<input class="dc-inp" placeholder="${esc(input.ph || "")}" value="${esc(input.val || "")}">` : ""}<div class="acts"></div></div>`;
      const acts = mask.querySelector(".acts");
      actions.forEach((a) => {
        const b = document.createElement("button");
        b.className = a.pr ? "pr" : ""; b.textContent = a.label;
        b.onclick = () => { const v = mask.querySelector("input") ? mask.querySelector("input").value : undefined; root.innerHTML = ""; res(a.id === "cancel" ? null : (v !== undefined ? v : a.id)); };
        acts.appendChild(b);
      });
      mask.addEventListener("click", (e) => { if (e.target === mask) { root.innerHTML = ""; res(null); } });
      root.innerHTML = ""; root.appendChild(mask);
      const inp = mask.querySelector("input"); if (inp) inp.focus();
    });
  }
  const notify = (title, body) => modal({ title, body, actions: [{ id: "ok", label: "知道了", pr: true }] });

  /* ---------- 持久化 ---------- */
  async function persist() {
    const payload = JSON.stringify(S.overrides, null, 2);
    try {
      const r = await fetch("/__dc_write__", { method: "POST", body: JSON.stringify({ file: "prototype/edit-overrides.json", content: payload }) });
      if (!r.ok) throw 0;
    } catch { localStorage.setItem("dc-editover", payload); }
  }
  async function loadOverrides() {
    // M44h：layout-overrides（apply-patch 落回）+ ?variant= 变体（原版保留，变体可切换）
    S.variant = Q.get("variant") || "";
    const loPath = S.variant ? ("variants/" + S.variant + "/layout-overrides.json") : "layout-overrides.json";
    try { S.layoutOv = await (await fetch(loPath)).json(); } catch { S.layoutOv = {}; }
    if (S.variant) { try { const css = await (await fetch("variants/" + S.variant + "/tokens-override.css")).text(); let st = document.getElementById("dc-variant-css"); if (!st) { st = document.createElement("style"); st.id = "dc-variant-css"; document.head.appendChild(st); } st.textContent = css; } catch {} }
    try { S.overrides = await (await fetch("edit-overrides.json")).json(); }
    catch { try { S.overrides = JSON.parse(localStorage.getItem("dc-editover") || "{}"); } catch { S.overrides = {}; } }
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
    list.forEach((a, i) => {
      const t = el(a.target); if (!t) return;
      const r = toWS(t.getBoundingClientRect());
      const pin = document.createElement("div");
      pin.className = "dc-pin"; pin.textContent = i + 1;
      pin.style.left = r.r - 8 + "px"; pin.style.top = r.cy - 8 + "px";
      pin.onmouseenter = () => (t.style.outline = "1px solid var(--sh-line)");
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

  /* ---------- IA 切换 ---------- */
  function setIA(ia, push = true) {
    S.ia = ia;
    $$("#dc-rail [data-ia]").forEach((b) => b.classList.toggle("on", b.dataset.ia === ia));
    $("#dc-left-pages").hidden = ia !== "pages";
    $("#dc-left-scene").hidden = ia !== "scene";
    W.single.hidden = ia !== "pages" || S.vm === "code";
    W.flow.hidden = ia !== "scene" || S.vm === "code";
    $("#bb-scene").hidden = ia !== "scene";
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
  }
  function renderSceneTree() {
    const P = S.paths; const box = $("#dc-tree");
    if (!P) { box.innerHTML = `<div style="padding:8px;color:var(--sh-mut);font-size:11px">无 paths.json<br>跑 scripts/paths-gen.mjs 生成</div>`; return; }
    const kids = (id) => [...new Set((P.edges || []).filter((e) => e.from === id && (e.role ? (e.role !== "module" && e.role !== "back") : e.dir !== "back")).map((e) => e.to))];
    const row = (id, depth, seen) => {
      const k = kids(id).filter((c) => !seen.has(c));
      const n = P.nodes[id] || { title: id };
      const nav = ((P.perNode || {})[id] || {}).nav || [];
      const s2 = new Set(seen); s2.add(id);
      return `<div class="tr-node">
        <div class="tr-row" data-node="${id}" style="padding-left:${8 + depth * 4}px">
          <span class="tr-caret" data-tg="${id}">${k.length ? "▸" : ""}</span>
          <span class="idx" style="color:var(--sh-mut);font-size:11px">${idxOf(id)}</span><span>${esc(n.title || id)}</span>
        </div>
        ${nav.length ? `<div class="tr-nav" style="padding-left:${8 + (depth + 1) * 4}px;display:flex;flex-wrap:wrap;gap:4px;margin:2px 0 4px">${nav.map((t) => `<span class="tr-row" data-node="${t}" style="display:inline-flex;padding:2px 8px;border:1px solid var(--sh-border);border-radius:999px;font-size:10.5px;color:var(--sh-mut);cursor:pointer"><span class="idx" style="color:var(--sh-mut);font-size:10px">${idxOf(t)}</span>${esc(((P.nodes || {})[t] || {}).title || t)}</span>`).join("")}<span style="font-size:10px;color:var(--sh-mut);align-self:center">导航</span></div>` : ""}
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
  }

  /* ---------- 场景流程画布（整卡缩放） ---------- */
  function natSize() {
    const c = shellClass();
    return { "dc-mobile": [390, 844], "dc-tablet": [834, 1194], "dc-browser": [1280, 800], "dc-desktop": [1280, 800] }[c] || [390, 844];
  }
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
    return `<defs><marker id="dc-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--sh-line)"/></marker></defs>`;
  }
  function renderFlow() {
    const P = S.paths; if (!P || !S.selNode) { W.canvas.innerHTML = ""; return; }
    $$("#dc-flow-toggle [data-fm]").forEach((b) => b.classList.toggle("on", b.dataset.fm === S.flowMode));
    if (S.flowMode === "path") {
      const paths = (P.perNode[S.selNode] || {}).paths || [];
      if (S.selPath >= paths.length) S.selPath = 0;
      const p = paths[S.selPath] || [];
      const chips = paths.length > 1
        ? `<div class="fc-chips">${paths.map((pp, pi) => `<button class="fc-chip${pi === S.selPath ? " on" : ""}" data-pi="${pi}">路径 ${pi + 1}<i>${pp.length + 1} 屏</i></button>`).join("")}</div>`
        : "";
      let cur = S.selNode;
      let chain = cardHTML(cur);
      p.forEach((ei) => { const e = P.edges[ei]; chain += `<div class="fc-link" data-edge="${ei}"><span class="elabel">${esc(e.label || e.kind || "")}</span></div>` + cardHTML(e.to); cur = e.to; });
      W.canvas.innerHTML = paths.length ? chips + `<div class="fc-chain">${chain}</div>` : `<div style="color:var(--sh-mut);padding:40px">该节点无出向路径</div>`;
      W.canvas.querySelectorAll(".fc-chip").forEach((c) => (c.onclick = () => { if (+c.dataset.pi === S.selPath) return; S.selPath = +c.dataset.pi; renderFlow(); fillDetail(); syncURL(true); updateCrumb(); }));
      W.canvas.querySelectorAll(".fc-card").forEach((c) => (c.onclick = () => {
        S.selNode = c.dataset.node; S.selPath = 0; renderSceneTree(); renderFlow(); fillDetail(); syncURL(true); updateCrumb();
      }));
    } else {
      const mk = (t) => `<div class="fc-h">${cardHTML(t.node)}${t.children.length ? `<div class="fc-kids">${t.children.map((c) => `<div class="fc-edge-slot" data-edge="${c.edge}">${mk(c.child)}</div>`).join("")}</div>` : ""}</div>`;
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
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const g = document.createElementNS(svgNS, "g");
      g.innerHTML = `<circle cx="${mx}" cy="${my}" r="6.5" style="fill:var(--sh-panel);stroke:var(--sh-line);stroke-width:1" /><text x="${mx}" y="${my + 3}" style="fill:var(--sh-line);font:600 9px ui-monospace,Menlo,monospace;text-anchor:middle">${num}</text><text x="${mx}" y="${my + 18}" class="elabel" style="text-anchor:middle">${(e.label || "").replace(/</g, "‹")}</text>`;
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
    let html = "";
    if (S.ia === "scene" && S.selNode) {
      const prod = S.products[S.selNode] || {};
      if (S.flowMode === "path") {
        const p = ((S.paths.perNode[S.selNode] || {}).paths || [])[S.selPath] || [];
        const chain = [S.selNode, ...p.map((ei) => S.paths.edges[ei].to)];
        const goals = [...new Set(chain.map((id) => (S.products[id] || {}).goals || []).flat())];
        const prompt = `复现场景路径：${chain.map((id) => `${idxOf(id)} ${nodeTitle(id)}`).join(" → ")}；每步交互：${p.map((ei) => S.paths.edges[ei].label).join("；")}；产品目标：${goals.join("、") || "转化/留存"}；风格：${shellLabel()}，黑白细线标注风。`;
        html += `<h4>场景路径</h4>${chain.map((id) => `<div>${idxOf(id)} ${esc(nodeTitle(id))}</div>`).join("")}
          <h4>功能</h4>${chain.map((id) => (S.products[id] || {}).function).filter(Boolean).map(esc).join("<br>") || "（products.json 未提供）"}
          <h4>目标</h4>${goals.map((g) => `<span class="goal">${esc(g)}</span>`).join("") || "—"}
          <h4>再生成提示词</h4>${promptBlock(prompt)}`;
      } else {
        html += `<h4>页面</h4><b>${idxOf(S.selNode)} ${esc(nodeTitle(S.selNode))}</b>
          <h4>功能</h4>${esc(prod.function || "（克隆时按 vlm-analysis.md 补 product 三要素）")}
          <h4>目标</h4>${(prod.goals || []).map((g) => `<span class="goal">${esc(g)}</span>`).join("") || "—"}
          <h4>再生成提示词</h4>${promptBlock(prod.page_prompt || compilePagePrompt(S.selNode))}`;
      }
    } else if (S.page) {
      const prod = S.products[S.page] || {};
      html += `<h4>页面</h4><b>${idxOf(S.page)} ${esc(nodeTitle(S.page))}</b>
        <h4>功能</h4>${esc(prod.function || "（克隆时按 vlm-analysis.md 补 product 三要素）")}
        <h4>目标</h4>${(prod.goals || []).map((g) => `<span class="goal">${esc(g)}</span>`).join("") || "—"}
        <h4>再生成提示词</h4>${promptBlock(prod.page_prompt || compilePagePrompt(S.page))}`;
      const t = S.selected ? el(S.selected) : null;
      if (t) {
        const cs = getComputedStyle(t); const r = t.getBoundingClientRect();
        const o = ((S.overrides[S.page] || {})[S.selected] || {}).style || {};
        const row = (label, key, val, type) =>
          `<div class="kv"><label>${label}</label>${type === "color" ? `<input type="color" data-sk="${key}" value="${val.startsWith("#") && val.length === 7 ? val : "#ffffff"}">` : ""}<input class="dc-inp" data-sk="${key}" value="${esc(val)}" style="width:110px" ${S.edit ? "" : "readonly"}></div>`;
        html += `<h4>选中元素 · ${esc(S.selected)}</h4>&lt;${t.tagName.toLowerCase()}&gt;
          ${row("背景", "backgroundColor", rgb2hex(cs.backgroundColor), "color")}${row("文字", "color", rgb2hex(cs.color), "color")}${row("圆角", "borderRadius", cs.borderRadius, "text")}${row("边框", "border", cs.borderWidth + " solid " + rgb2hex(cs.borderColor), "text")}
          ${row("字体", "fontFamily", cs.fontFamily.split(",")[0], "text")}${row("字号", "fontSize", cs.fontSize, "text")}${row("字重", "fontWeight", cs.fontWeight, "text")}
          <div style="margin-top:4px;color:var(--sh-mut);font-size:11px">${S.edit ? "可直接改值，Ctrl+Z 撤销" : "编辑模式可改（底栏 ✎）"}</div>
          <h4>元素提示词</h4>${promptBlock((prod.element_prompts || {})[S.selected] || compilePrompt(t, S.selected))}`;
      }
    } else html = "选中页面/节点/路径后展示详情";
    html += `<details><summary>全局 tokens 调参</summary><div id="dc-tw-zone"></div></details>`;
    box.innerHTML = html;
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
  function renderTweaksZone() {
    const box = $("#dc-tw-zone"); if (!box) return;
    const variants = (() => { try { return JSON.parse(localStorage.getItem("dc-variants") || "{}"); } catch { return {}; } })();
    box.innerHTML = TOKEN_KEYS.map((k) => {
      const v = tweaksStore()[k] || getComputedStyle(document.documentElement).getPropertyValue(k).trim();
      const isC = v.startsWith("#");
      return `<div class="kv"><label style="width:110px">${k}</label>${isC ? `<input type="color" data-tk="${k}" value="${v}">` : ""}<input class="dc-inp" data-tk="${k}" value="${esc(v)}" style="width:104px"></div>`;
    }).join("") +
      `<select class="dc-inp" id="dc-variant" style="width:100%;margin-top:8px"><option value="">（变体：当前）</option>${Object.keys(variants).map((n) => `<option>${esc(n)}</option>`).join("")}</select>
      <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap"><button id="dc-tw-save" class="dc-btn">存为变体</button><button id="dc-tw-export" class="dc-btn">导出 patch</button><button id="dc-tw-reset" class="dc-btn">重置</button></div>`;
    box.querySelectorAll("[data-tk]").forEach((inp) => (inp.oninput = () => {
      const o = tweaksStore(); o[inp.dataset.tk] = inp.value;
      localStorage.setItem("dc-tweaks", JSON.stringify(o));
      document.documentElement.style.setProperty(inp.dataset.tk, inp.value);
    }));
    $("#dc-tw-reset").onclick = () => { localStorage.removeItem("dc-tweaks"); TOKEN_KEYS.forEach((k) => document.documentElement.style.removeProperty(k)); renderTweaksZone(); };
    $("#dc-tw-save").onclick = () => modal({ title: "存为变体", input: { ph: "变体名" }, actions: [{ id: "cancel", label: "取消" }, { id: "ok", label: "保存", pr: true }] }).then((n) => {
      if (!n) return;
      const v = (() => { try { return JSON.parse(localStorage.getItem("dc-variants") || "{}"); } catch { return {}; } })();
      v[n] = tweaksStore(); localStorage.setItem("dc-variants", JSON.stringify(v)); renderTweaksZone();
    });
    $("#dc-tw-export").onclick = () => download("tokens-patch.json", JSON.stringify({ type: "tokens-patch", overrides: tweaksStore() }, null, 2));
    $("#dc-variant").onchange = (e) => { const v = variants[e.target.value]; if (v) { localStorage.setItem("dc-tweaks", JSON.stringify(v)); TOKEN_KEYS.forEach((k) => document.documentElement.style.removeProperty(k)); tweaksApply(v); renderTweaksZone(); } };
  }
  function download(name, text) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "application/json" })); a.download = name; a.click();
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

  /* ---------- 播放器（路径演播） ---------- */
  function playPath(pi) {
    const P = S.paths; if (!P) return;
    const p = ((P.perNode[S.selNode] || {}).paths || [])[pi]; if (!p || !p.length) { toast("该节点无出向路径"); return; }
    setIA("pages");
    S.play = { edges: p, i: 0, paused: false, speed: 1, timer: null };
    $("#dc-player").classList.add("on");
    playStep();
  }
  function playRender(e) {
    const pl = S.play;
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
    $("#pp-pause").onclick = () => { pl.paused = !pl.paused; pl.paused ? clearTimeout(pl.timer) : scheduleNext(); playRender(S.paths.edges[pl.edges[pl.i]]); };
    $("#pp-speed").onclick = () => { pl.speed = pl.speed === 1 ? 1.5 : pl.speed === 1.5 ? 2 : 1; scheduleNext(); playRender(e); };
    $("#pp-rec").onclick = () => runExport([{ type: "video", root: S.selNode, path: S.selPath }, boardItem()]);
    $("#pp-end").onclick = endPlay;
  }
  async function playStep() {
    const pl = S.play; if (!pl || pl.i >= pl.edges.length) { endPlay(); return; }
    const e = S.paths.edges[pl.edges[pl.i]];
    if (e.from !== S.page) { try { await loadView(e.from); } catch {} }
    await new Promise((r) => setTimeout(r, 250));
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
      const e = S.paths.edges[pl.edges[pl.i]];
      try { await loadView(e.to); } catch {}
      pl.i++; playStep();
    }, 2400 / pl.speed);
  }
  function playGoto() { clearTimeout(S.play.timer); playStep(); }
  function endPlay() { if (S.play) clearTimeout(S.play.timer); S.play = null; $("#dc-player").classList.remove("on"); }

  /* ---------- 演示模式 ---------- */
  async function startDemo(ji) {
    const j = S.journeys[ji]; if (!j) return;
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
    s.result = s.result || { kind: "navigate", to: (el(s.target) || {}).getAttribute ? el(s.target).getAttribute("data-goto") || "" : "" };
    if (s.page !== S.page) { try { await loadView(s.page); } catch {} }
    clearOverlay();
    const t = el(s.target); if (t) { t.scrollIntoView({ block: "center" }); const r = toWS(t.getBoundingClientRect()); const ring = document.createElement("div"); ring.className = "dc-ring"; Object.assign(ring.style, { left: r.x - 4 + "px", top: r.y - 4 + "px", width: r.w + 8 + "px", height: r.h + 8 + "px" }); W.overlay.appendChild(ring); }
    const old = $("#dc-sim"); if (old) old.remove();
    const K = (s.result || {}).kind;
    if (K === "dialog" || K === "blocked") {
      const d = document.createElement("div"); d.id = "dc-sim"; d.className = K === "blocked" ? "dc-sim blocked" : "dc-sim";
      d.innerHTML = `<b>${K === "blocked" ? "🚫 安全边界" : "💬 弹窗"}</b><div>${(s.result || {}).note || ""}</div>`;
      document.body.appendChild(d);
    } else if (s.result.kind === "toast") {
      const d = document.createElement("div"); d.id = "dc-sim"; d.className = "dc-sim toast"; d.textContent = s.result.note || ""; document.body.appendChild(d);
    }
    let cap = $("#dc-caption"); if (!cap) { cap = document.createElement("div"); cap.id = "dc-caption"; document.body.appendChild(cap); }
    cap.innerHTML = `<span class="k" style="background:${KIND_COLOR[s.result.kind]}">${i + 1}/${j.steps.length} · ${KIND_CN[s.result.kind]}</span><b>${esc(s.label)}</b> <span style="color:#888">→ ${s.result.kind === "navigate" ? s.result.to : s.result.note || ""}</span>
      <span style="float:right"><button id="dc-d-next">⏭</button><button id="dc-d-exit">✕ 退出</button></span><div class="bar"><i style="width:${((i + 1) / j.steps.length) * 100}%"></i></div>`;
    $("#dc-d-next").onclick = () => { clearTimeout(S.demo.timer); demoStep(i + 1); };
    $("#dc-d-exit").onclick = endDemo;
    S.demo.timer = setTimeout(() => demoStep(i + 1), (s.result.kind === "blocked" ? 3600 : 2400) / S.demo.speed);
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

  /* ---------- 导出/分享/截图 ---------- */
  function boardItem() {
    return { type: "board", board: { page: S.page, ia: S.ia, selNode: S.selNode, selPath: S.selPath, selected: S.selected,
      product: S.products[S.ia === "scene" ? S.selNode : S.page] || null, at: new Date().toISOString() } };
  }
  function exportGroups() {
    const all = { id: "all", label: "导出全部（页面±标注 + 全场景树）", run: () => {
      const its = [];
      (DC.pages || []).forEach((p) => { its.push({ type: "page", id: p.id, ann: false }); its.push({ type: "page", id: p.id, ann: true }); });
      its.push({ type: "scene-full" }, boardItem());
      return its;
    } };
    let ctx = null;
    if (S.ia === "scene" && S.flowMode === "tree" && S.selNode) ctx = { id: "sel-node", label: `导出选中树 ${idxOf(S.selNode)} ${nodeTitle(S.selNode)}`, run: () => [{ type: "node", id: S.selNode }, boardItem()] };
    else if (S.ia === "scene" && S.flowMode === "path" && S.selNode) ctx = { id: "sel-path", label: `导出选中路径 #${S.selPath + 1}`, run: () => [{ type: "path", id: S.selPath, root: S.selNode }, boardItem()] };
    else if (S.page) ctx = { id: "sel-page", label: `导出选中页 ${idxOf(S.page)} ${nodeTitle(S.page)} ±标注`, run: () => [{ type: "page", id: S.page, ann: false }, { type: "page", id: S.page, ann: true }, boardItem()] };
    return [{ h: "", items: ctx ? [all, ctx] : [all] }];
  }
  async function runExport(items) {
    try {
      const r = await fetch("/__dc_export__", { method: "POST", body: JSON.stringify({ scope: items.map((i) => i.type).join(","), items }) });
      const j = await r.json();
      toast(j.ok ? `已导出 → ${j.dir}（${j.files.length} 文件）` : "导出失败: " + j.error);
    } catch {
      const b = items.find((i) => i.type === "board");
      if (b) download("board.json", JSON.stringify(b.board, null, 2));
      toast("图片导出需 node serve.mjs 服务；看板 JSON 已下载");
    }
  }
  function toast(msg) {
    let t = $("#dc-toast"); if (!t) { t = document.createElement("div"); t.id = "dc-toast"; t.style.cssText = "position:fixed;top:56px;left:50%;transform:translateX(-50%);z-index:99;background:var(--sh-panel);border:1px solid var(--sh-border);border-radius:999px;padding:6px 16px;font-size:12px;box-shadow:0 6px 20px var(--sh-shadow)"; document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false;
    setTimeout(() => (t.hidden = true), 3200);
  }

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

  /* ---------- 平台 shell 四档 + 状态栏 ---------- */
  const SHELL_CLASS = { c_mobile: "dc-mobile", mobile: "dc-mobile", c_tablet: "dc-tablet", tablet: "dc-tablet", c_browser: "dc-browser", c_browser2: "dc-browser", c_desktop: "dc-desktop", desktop: "dc-desktop" };
  function shellClass() { return S.device || SHELL_CLASS[DC.shell] || "dc-mobile"; }
  function isTouch() { const c = shellClass(); return c === "dc-mobile" || c === "dc-tablet"; }
  function isLarge() { const c = shellClass(); return c === "dc-browser" || c === "dc-desktop"; }
  function shellLabel() {
    return { "dc-mobile": "移动端页面", "dc-tablet": "平板应用", "dc-browser": "桌面网页（浏览器窗）", "dc-desktop": "原生桌面应用（OS 窗）" }[shellClass()];
  }
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
      if (!W.stage.querySelector(".dc-statusbar,[data-dc-statusbar]")) {
        const sb = document.createElement("div");
        sb.className = "dc-statusbar";
        sb.style.cssText = "flex:none;height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 20px;color:var(--color-text-primary,#1a1a1a);position:relative;z-index:5";
        sb.innerHTML = `<span style="font-size:14px;font-weight:600">9:41</span>${SB_ICONS}`;
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
    ["dc-mobile", "dc-tablet", "dc-browser", "dc-desktop"].forEach((c) => document.body.classList.remove(c));
    document.body.classList.add(shellClass());
    $("#dc-device-label").textContent = { "dc-mobile": "手机", "dc-tablet": "平板", "dc-browser": "浏览器窗", "dc-desktop": "桌面窗" }[shellClass()];
    // M44f：shell 尺寸用 inline 兜底（防视图 css 级联把桌面窗压成手机宽——desktop run 排版崩坏根因）
    const DIM = { "dc-mobile": [390, 844], "dc-tablet": [834, 1194], "dc-browser": [1280, 800], "dc-desktop": [1280, 800] }[shellClass()] || [390, 844];
    W.phone.style.width = DIM[0] + "px"; W.phone.style.height = DIM[1] + "px";
  }

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
    $("#dc-demo").onclick = () => (S.demo.active ? endDemo() : S.journeys.length > 1 ? demoChooser() : startDemo(0));
    $("#dc-left-fold").onclick = () => { document.body.classList.toggle("dc-left-off"); $("#dc-left-fold").textContent = document.body.classList.contains("dc-left-off") ? "›" : "‹"; };
    $("#dc-right-fold").onclick = () => { document.body.classList.toggle("dc-right-off"); };
    $("#dc-read").onclick = () => setEdit(false);
    $("#dc-edit").onclick = () => setEdit(true);
    $("#dc-ann-toggle").onclick = (e) => { S.ann = !S.ann; e.currentTarget.classList.toggle("on", S.ann); redraw(); };
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
    $("#dc-play").onclick = () => playPath(S.selPath);
    $("#dc-share-btn").onclick = () => { navigator.clipboard.writeText(location.href).then(() => toast("已复制状态链接，可直接分享")); };
    $("#dc-shot-btn").onclick = () => S.page && runExport([{ type: "page", id: S.page, ann: S.ann }, boardItem()]);
    $$("#dc-viewmode button").forEach((b) => (b.onclick = () => setVM(b.dataset.vm)));
    $("#dc-code-copy").onclick = () => navigator.clipboard.writeText(S.lastHTML).then(() => toast("已复制视图 HTML"));
    $("#dc-code-open").onclick = () => window.open(`views/${S.page}.html`, "_blank");
    $("#dc-device-btn").onclick = () => { const dd = $("#dc-device-dd"); dd.hidden = !dd.hidden; };
    $$("#dc-device-dd button").forEach((b) => (b.onclick = () => {
      S.device = SHELL_CLASS[b.dataset.shell];
      applyShellClasses(); buildFrameChrome();
      $("#dc-device-dd").hidden = true;
      if (S.ia === "pages") fit();
      fillDetail();
    }));
    $("#dc-export-btn").onclick = () => {
      const dd = $("#dc-export-dd");
      dd.hidden = !dd.hidden;
      if (dd.hidden) return;
      dd.innerHTML = exportGroups().map((g) => (g.h ? `<div class="dd-h">${esc(g.h)}</div>` : "") + g.items.map((it) => `<button data-x="${it.id}">${esc(it.label)}</button>`).join("")).join("");
      dd.querySelectorAll("button").forEach((b) => (b.onclick = () => {
        dd.hidden = true;
        const it = exportGroups().flatMap((g) => g.items).find((x) => x.id === b.dataset.x);
        if (it) runExport(it.run());
      }));
    };
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#dc-export-wrap")) $("#dc-export-dd").hidden = true;
      if (!e.target.closest("#dc-device-wrap")) $("#dc-device-dd").hidden = true;
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
      const actEl = e.target.closest("[data-act]");
      if (actEl && !S.edit && window.DCRuntime) {
        e.preventDefault(); e.stopPropagation();
        window.DCRuntime.handleClick(actEl, e);
        const d = actEl.getAttribute("data-dc");
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
      const t = e.target.closest("[data-dc]");
      S.selected = t && t.getAttribute ? t.getAttribute("data-dc") : null;
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
      else if (e.key === "h" || e.key === "H") $("#dc-hand").click();
      else if (e.key === "f" || e.key === "F") $("#dc-frame-toggle").click();
      else if (e.key === "+" || e.key === "=") zoomBy(1.2);
      else if (e.key === "-") zoomBy(1 / 1.2);
      else if (e.key === "0") (S.ia === "scene" ? setFZoom(1) : setScale(1));
    });
    window.addEventListener("popstate", () => applyHash(false));
    window.addEventListener("hashchange", () => applyHash(false));
  }

  /* ---------- boot ---------- */
  async function boot() {
    const saved = localStorage.getItem("dc-theme");
    document.documentElement.dataset.theme = saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    if (Q.get("embed")) document.body.classList.add("dc-embed");
    if (Q.get("card") === "1") document.body.classList.add("dc-cardview");
    if (Q.get("chrome") === "0") document.body.classList.add("dc-chromeless");
    applyShellClasses();
    document.body.classList.toggle("dc-framed", S.frame);
    document.body.classList.toggle("dc-labels", S.labels);
    $("#dc-frame-toggle").classList.toggle("on", S.frame);
    $("#dc-labels-toggle").classList.toggle("on", S.labels);
    buildFrameChrome();
    if (Q.get("ann") === "1") { S.ann = true; $("#dc-ann-toggle").classList.add("on"); }

    renderPages();
    bind();
    if (window.DCRuntime) {
      window.DCRuntimeHooks = {
        goto: (id) => { const s = String(id || ""); if (s.startsWith("placeholder:")) notify("原型占位", esc(s.slice(10)) + "（范围外/安全边界，不克隆）"); else loadView(s).catch((err) => notify("加载失败", esc(err.message))); },
        toast: (m) => toast(m),
        back: () => { if (history.length > 1) history.back(); else loadView((DC.pages[0] || {}).id).catch(() => {}); },
      };
      DCRuntime.attach(W.stage);
    }
    await loadOverrides();
    try { S.ann_data = await (await fetch("annotations.json")).json(); } catch { S.ann_data = {}; }
    try { S.journeys = await (await fetch("journeys.json")).json(); } catch { S.journeys = []; }
    window.__dcJourneys = S.journeys.length;
    try { S.products = await (await fetch("products.json")).json(); } catch { S.products = {}; }
    try { S.paths = await (await fetch("paths.json")).json(); } catch { S.paths = null; }
    try { S.srcmap = await (await fetch("../knowledge/source-map.json")).json(); } catch { S.srcmap = {}; }
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
    if (Q.get("variant")) { try { const v = await (await fetch("variants.json")).json(); if (v[Q.get("variant")]) tweaksApply(v[Q.get("variant")]); } catch {} }
    tweaksApply(tweaksStore());
    if (!Q.get("chrome") && !Q.get("card") && !Q.get("embed")) setTimeout(() => { if (S.ia === "pages" && isLarge()) fit(); }, 300);
  }
  boot();
})();
