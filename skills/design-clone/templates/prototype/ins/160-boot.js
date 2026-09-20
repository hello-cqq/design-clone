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
    if (Q.get("embed") || (!Q.get("chrome") && !Q.get("card"))) setTimeout(() => { if (S.ia === "pages" && (isLarge() || Q.get("embed"))) fit(); }, 300); // M114: embed 也自 fit（未来发布生效）
    try { if (window.parent !== window) window.parent.postMessage({ type: "dc-ready" }, "*"); } catch {} // M114.2: embed 心跳，宿主据此判定壳 JS 存活
  }
  boot();
})();
