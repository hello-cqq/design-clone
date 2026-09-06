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
