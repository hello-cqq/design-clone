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
