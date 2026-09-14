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
    // M86: 视图重渲染后选中框/标注必须重画（旧 overlay 节点指向已销毁 DOM → 活跟踪脱靶）
    if (S.selected || S.ann) redraw();
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
