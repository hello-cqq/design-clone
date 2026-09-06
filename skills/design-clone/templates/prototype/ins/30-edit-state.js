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
