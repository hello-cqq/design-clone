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
