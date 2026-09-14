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
  /* M85: 活跟踪 ticker——视图内动效/滚动/缩放会让元素位移，选中框与演示 ring 必须每帧贴合 */
  const trackers = new Set();
  let tickRaf = null;
  function tickLoop() {
    if (!trackers.size) { tickRaf = null; return; }
    for (const tr of [...trackers]) {
      if (!tr.t || !tr.t.isConnected || !tr.node || !tr.node.isConnected) { trackers.delete(tr); continue; }
      tr.apply(toWS(tr.t.getBoundingClientRect()));
    }
    tickRaf = requestAnimationFrame(tickLoop);
  }
  function liveTrack(t, node, apply) {
    const tr = { t, node, apply };
    trackers.add(tr);
    if (!tickRaf) tickRaf = requestAnimationFrame(tickLoop);
    return tr;
  }
  function untrack(node) { for (const tr of [...trackers]) if (tr.node === node) trackers.delete(tr); }
  function clearOverlay() { W.overlay.innerHTML = ""; trackers.clear(); tickRaf && cancelAnimationFrame(tickRaf); tickRaf = null; }
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
    liveTrack(t, box, (rr) => {
      Object.assign(box.style, { left: rr.x + "px", top: rr.y + "px", width: rr.w + "px", height: rr.h + "px" });
      sz.style.left = rr.x + "px"; sz.style.top = rr.b + 4 + "px";
      sz.textContent = `${Math.round(rr.w)} × ${Math.round(rr.h)}`;
    });
  }
  // M85: 滚动/缩放/窗口变化 → 节流重绘标注（pins/cards 不再 drift）
  let redrawT = null;
  const queueRedraw = () => { if (!(S.ann || S.selected)) return; if (redrawT) return; redrawT = setTimeout(() => { redrawT = null; redraw(); }, 150); };
  window.addEventListener("scroll", queueRedraw, true);
  window.addEventListener("resize", queueRedraw);
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
