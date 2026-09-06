/* inspector 分段 160-boot.js —— boot：主题/壳/设备/数据加载/初始视图/a11y 观察器
 * 源文件按文件名顺序拼接为 prototype/inspector.js（scripts/build-shell.mjs），同一 IIFE 闭包。
 * 约定：JS 只写几何与状态；排版/配色一律 inspector.css 类 + 主题变量。
 */
  /* ---------- boot ---------- */
  let a11yQueued = false;
  async function boot() {
    const saved = localStorage.getItem("dc-theme");
    document.documentElement.dataset.theme = saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
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
