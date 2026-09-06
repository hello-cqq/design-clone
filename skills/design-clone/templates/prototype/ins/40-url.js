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
