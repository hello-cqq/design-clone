/* inspector 分段 100-play.js —— 播放与演示：playPath 回退链/会话守卫 + demo 字幕/模拟弹窗/总结卡
 * 源文件按文件名顺序拼接为 prototype/inspector.js（scripts/build-shell.mjs），同一 IIFE 闭包。
 * 约定：JS 只写几何与状态；排版/配色一律 inspector.css 类 + 主题变量。
 */
  /* ---------- 播放器（路径演播） ----------
     M44k：禁止静默失败。页面模式从当前页起播，场景模式播所选路径；
     无出向路径 → 回退 journeys 演示；两者都缺 → 明确告知缺什么、跑哪条命令。 */
  function playPath(pi) {
    const P = S.paths;
    const node = (S.ia === "pages" ? S.page : S.selNode) || (P && P.roots[0]) || null;
    if (P && node) {
      const list = ((P.perNode || {})[node] || {}).paths || [];
      if (list.length) {
        const idx = Math.min(Math.max(pi | 0, 0), list.length - 1);
        const p = list[idx];
        if (p && p.length) { startPlay(p, idx, node); return; }
      }
    }
    const navTour = P && node ? ((P.perNode[node] || {}).nav || [])
      .map((tid) => P.edges.findIndex((e) => e.from === node && e.to === tid)).filter((ei) => ei >= 0) : [];
    if (navTour.length) {
      toast("该节点无内容路径，按导航巡游播放");
      startPlay(navTour, 0, node);
      return;
    }
    if (S.journeys.length) {
      toast("该节点无出向路径，改用演示旅程播放");
      if (S.journeys.length > 1) demoChooser(); else startDemo(0);
      return;
    }
    notify("无法播放", P
      ? `节点 ${idxOf(node || "")} ${esc(nodeTitle(node || ""))} 没有可用出向路径，且本 run 无 journeys.json 可回退。<br>补：node scripts/paths-gen.mjs --run &lt;run&gt;`
      : "本 run 缺 paths.json，也无 journeys.json 可回退。<br>补：node scripts/paths-gen.mjs --run &lt;run&gt;");
  }
  function startPlay(edges, pi, node) {
    if (S.play) endPlay(); // 重复触发播放：先干净结束旧会话，避免两条链互相踩（M44k）
    setIA("pages");
    S.play = { edges, i: 0, paused: false, speed: 1, timer: null, pi: pi | 0, node: node || S.selNode };
    $("#dc-player").classList.add("on");
    playStep();
  }
  function playRender(e) {
    const pl = S.play;
    // 会话可能在异步间隙被结束/被新会话取代：不再渲染，绝不抛错（M44k 修 null.edges 崩溃）
    if (!pl) { console.warn("[dc] playRender: 会话已结束，跳过渲染"); return; }
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
    $("#pp-pause").onclick = () => { if (S.play !== pl) return; pl.paused = !pl.paused; pl.paused ? clearTimeout(pl.timer) : scheduleNext(); playRender(((S.paths || {}).edges || {})[pl.edges[pl.i]] || e); };
    $("#pp-speed").onclick = () => { pl.speed = pl.speed === 1 ? 1.5 : pl.speed === 1.5 ? 2 : 1; scheduleNext(); playRender(e); };
    $("#pp-rec").onclick = () => runExport([{ type: "video", root: pl.node || S.selNode, path: pl.pi | 0 }, boardItem()]);
    $("#pp-end").onclick = endPlay;
  }
  async function playStep() {
    const pl = S.play; if (!pl || pl.i >= pl.edges.length) { console.warn("[dc] playStep: 无活跃会话或已播完", !!pl, pl && pl.i, pl && pl.edges.length); endPlay(); return; }
    const e = ((S.paths || {}).edges || {})[pl.edges[pl.i]];
    if (!e) { console.warn("[dc] playStep: 边缺失，结束播放", pl.edges[pl.i]); endPlay(); return; }
    if (e.from !== S.page) { try { await loadView(e.from); } catch {} }
    await new Promise((r) => setTimeout(r, 250));
    if (S.play !== pl) return; // 等待期间会话已结束/被取代
    const t = e.target_dc ? el(e.target_dc) : null;
    if (t) { const r = toWS(t.getBoundingClientRect()); const ring = document.createElement("div"); ring.className = "dc-ring"; Object.assign(ring.style, { left: r.x - 4 + "px", top: r.y - 4 + "px", width: r.w + 8 + "px", height: r.h + 8 + "px" }); W.overlay.appendChild(ring); liveTrack(t, ring, (rr) => Object.assign(ring.style, { left: rr.x - 4 + "px", top: rr.y - 4 + "px", width: rr.w + 8 + "px", height: rr.h + 8 + "px" })); }
    playRender(e);
    scheduleNext();
  }
  function scheduleNext() {
    const pl = S.play; if (!pl) return;
    clearTimeout(pl.timer);
    if (pl.paused) return;
    pl.timer = setTimeout(async () => {
      if (S.play !== pl) return; // 旧会话的定时器在新会话/结束后仍可能触发
      const e = ((S.paths || {}).edges || {})[pl.edges[pl.i]];
      if (!e) { console.warn("[dc] scheduleNext: 边缺失，结束播放", pl.edges[pl.i]); endPlay(); return; }
      try { await loadView(e.to); } catch {}
      pl.i++; playStep();
    }, 2400 / pl.speed);
  }
  function playGoto() { if (!S.play) return; clearTimeout(S.play.timer); playStep(); }
  function endPlay() { if (S.play) clearTimeout(S.play.timer); S.play = null; $("#dc-player").classList.remove("on"); }

  /* ---------- 演示模式 ---------- */
  async function startDemo(ji) {
    const j = S.journeys[ji];
    if (!j) { toast("演示旅程不存在（journeys.json 为空或序号越界）"); return; }
    if (!j.steps || !j.steps.length) { toast(`旅程「${j.name || ji}」没有步骤，无法演示`); return; }
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
    // M44k：journeys 数据可能缺 result/result.kind（旧链路只写了 target/label）——
    // 旧实现会把 undefined 直接渲染进字幕（"跳转undefined"），这里归一为 navigate 兜底
    s.result = { ...(s.result || {}) };
    if (!s.result.kind) s.result.kind = "navigate";
    if (s.result.kind === "navigate" && !s.result.to) {
      const t0 = el(s.target);
      s.result.to = (t0 && t0.getAttribute ? t0.getAttribute("data-goto") : "") || "";
    }
    if (s.page !== S.page) { try { await loadView(s.page); } catch {} }
    clearOverlay();
    const t = el(s.target); if (t) { t.scrollIntoView({ block: "center" }); const r = toWS(t.getBoundingClientRect()); const ring = document.createElement("div"); ring.className = "dc-ring"; Object.assign(ring.style, { left: r.x - 4 + "px", top: r.y - 4 + "px", width: r.w + 8 + "px", height: r.h + 8 + "px" }); W.overlay.appendChild(ring); liveTrack(t, ring, (rr) => Object.assign(ring.style, { left: rr.x - 4 + "px", top: rr.y - 4 + "px", width: rr.w + 8 + "px", height: rr.h + 8 + "px" })); }
    const old = $("#dc-sim"); if (old) old.remove();
    const K = s.result.kind;
    if (K === "dialog" || K === "blocked") {
      const d = document.createElement("div"); d.id = "dc-sim"; d.className = K === "blocked" ? "dc-sim blocked" : "dc-sim";
      d.innerHTML = `<b>${K === "blocked" ? "🚫 安全边界" : "💬 弹窗"}</b><div>${s.result.note || ""}</div>`;
      document.body.appendChild(d);
    } else if (K === "toast") {
      const d = document.createElement("div"); d.id = "dc-sim"; d.className = "dc-sim toast"; d.textContent = s.result.note || ""; document.body.appendChild(d);
    }
    let cap = $("#dc-caption"); if (!cap) { cap = document.createElement("div"); cap.id = "dc-caption"; document.body.appendChild(cap); }
    cap.innerHTML = `<span class="k" style="background:${KIND_COLOR[K] || KIND_COLOR.navigate}">${i + 1}/${j.steps.length} · ${KIND_CN[K] || KIND_CN.navigate}</span><b>${esc(s.label)}</b> <span style="color:#888">→ ${K === "navigate" ? s.result.to : s.result.note || ""}</span>
      <span style="float:right"><button id="dc-d-next">⏭</button><button id="dc-d-exit">✕ 退出</button></span><div class="bar"><i style="width:${((i + 1) / j.steps.length) * 100}%"></i></div>`;
    $("#dc-d-next").onclick = () => { clearTimeout(S.demo.timer); demoStep(i + 1); };
    $("#dc-d-exit").onclick = endDemo;
    S.demo.timer = setTimeout(() => demoStep(i + 1), (K === "blocked" ? 3600 : 2400) / S.demo.speed);
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
