/* inspector 分段 150-bind.js —— 帮助浮层 + 全部事件绑定(顶栏/底栏/画布/键盘)
 * 源文件按文件名顺序拼接为 prototype/inspector.js（scripts/build-shell.mjs），同一 IIFE 闭包。
 * 约定：JS 只写几何与状态；排版/配色一律 inspector.css 类 + 主题变量。
 */
  /* ---------- 帮助（快捷键单一真源 SHORTCUTS） ---------- */
  function showHelp() {
    modal({
      title: "快捷键",
      body: `<div class="sc">${SHORTCUTS.map(([k, d]) => `<kbd>${esc(k)}</kbd><span>${esc(d)}</span>`).join("")}</div>
        <div class="hint">标注模式（A）下点画面元素可新增/编辑批注；编辑模式（E）下拖拽元素、右栏改样式，Ctrl/⌘+Z 撤销。</div>`,
      actions: [{ id: "ok", label: "知道了", pr: true }],
    });
  }

  function bind() {
    $$("#dc-rail [data-ia]").forEach((b) => (b.onclick = () => setIA(b.dataset.ia)));
    $("#dc-flow-toggle").addEventListener("click", (e) => { const b = e.target.closest("[data-fm]"); if (!b) return; S.flowMode = b.dataset.fm; renderFlow(); fillDetail(); syncURL(true); updateCrumb(); });
    $("#dc-zoom-in").onclick = () => zoomBy(1.2);
    $("#dc-zoom-out").onclick = () => zoomBy(1 / 1.2);
    $("#dc-zoom-100").onclick = () => (S.ia === "scene" ? setFZoom(1) : setScale(1));
    $("#dc-zoom-fit").onclick = fit;
    $("#dc-hand").onclick = (e) => { S.hand = !S.hand; e.target.classList.toggle("on", S.hand); };
    $("#dc-compare-btn").onclick = (e) => {
      document.body.classList.toggle("dc-compare"); e.currentTarget.classList.toggle("on");
      syncCompareScale();
      if (document.body.classList.contains("dc-compare") && S.ia === "pages") setTimeout(fit, 60);
    };
    $("#dc-compare-x").onclick = () => { document.body.classList.remove("dc-compare"); $("#dc-compare-btn").classList.remove("on"); };
    $("#dc-theme").onclick = () => { const n = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; document.documentElement.dataset.theme = n; localStorage.setItem("dc-theme", n); };
    $("#dc-demo").onclick = () => {
      if (S.demo.active) return endDemo();
      if (!S.journeys.length) return notify("无演示旅程", "本 run 没有 journeys.json（demo 范围可无；full 范围应由 gen/flows-skeleton.mjs 或 gen/flows-from-events.mjs 生成）。<br>可改用底栏「播放」按路径演播。");
      if (S.journeys.length > 1) demoChooser(); else startDemo(0);
    };
    $("#dc-left-fold").onclick = () => { document.body.classList.toggle("dc-left-off"); $("#dc-left-fold").textContent = document.body.classList.contains("dc-left-off") ? "›" : "‹"; };
    $("#dc-right-fold").onclick = () => { document.body.classList.toggle("dc-right-off"); };
    $("#dc-read").onclick = () => setEdit(false);
    $("#dc-edit").onclick = () => setEdit(true);
    $("#dc-ann-toggle").onclick = (e) => { S.ann = !S.ann; e.currentTarget.classList.toggle("on", S.ann); redraw(); fillDetail(); };
    $("#dc-frame-toggle").onclick = (e) => {
      S.frame = !S.frame; localStorage.setItem("dc-frame", S.frame ? "1" : "0");
      document.body.classList.toggle("dc-framed", S.frame);
      e.currentTarget.classList.toggle("on", S.frame);
      buildFrameChrome(); if (S.ia === "pages" && isLarge()) fit();
    };
    $("#dc-labels-toggle").onclick = (e) => {
      S.labels = !S.labels; localStorage.setItem("dc-labels", S.labels ? "1" : "0");
      document.body.classList.toggle("dc-labels", S.labels);
      e.currentTarget.classList.toggle("on", S.labels);
    };
    $("#dc-undo").onclick = undo;
    $("#dc-restore").onclick = restore;
    $("#dc-play").onclick = () => playPath(S.ia === "scene" ? S.selPath : 0);
    $("#dc-share-btn").onclick = () => {
      const dd = $("#dc-share-dd");
      dd.hidden = !dd.hidden;
      $("#dc-share-btn").setAttribute("aria-expanded", String(!dd.hidden));
      if (!dd.hidden) renderShareDD();
    };
    $("#dc-shot-btn").onclick = () => {
      if (!S.page) { toast("请先选择一个页面再截图"); return; }
      runExport([{ type: "page", id: S.page, ann: S.ann }, boardItem()]);
    };
    $$("#dc-viewmode button").forEach((b) => (b.onclick = () => setVM(b.dataset.vm)));
    $("#dc-code-copy").onclick = () => navigator.clipboard.writeText(S.lastHTML).then(() => toast("已复制视图 HTML"));
    $("#dc-code-open").onclick = () => window.open(`views/${S.page}.html`, "_blank");
    $("#dc-device-btn").onclick = () => {
      const dd = $("#dc-device-dd");
      dd.hidden = !dd.hidden;
      $("#dc-device-btn").setAttribute("aria-expanded", String(!dd.hidden));
      if (!dd.hidden) renderDeviceDD();
    };
    $("#dc-export-btn").onclick = () => {
      const dd = $("#dc-export-dd");
      dd.hidden = !dd.hidden;
      $("#dc-export-btn").setAttribute("aria-expanded", String(!dd.hidden));
      if (dd.hidden) return;
      const mode = exportMode();
      dd.innerHTML =
        `<div class="dd-h">导出到</div><div class="dd-modes">${EXPORT_MODES.map((m) =>
          `<button data-m="${m.id}" class="${m.id === mode ? "on" : ""}" title="${m.id === "server" ? "只写 run/export/<时间戳>/（CLI 口径）" : m.id === "dir" ? "用系统目录选择器写到任意本地目录" : "浏览器直接下载 zip（默认）"}">${esc(m.label)}</button>`).join("")}</div>` +
        (window.showDirectoryPicker ? "" : `<div class="dd-h">此浏览器不支持选目录，将自动改用 zip 下载</div>`) +
        `<div class="dd-h">范围</div>` +
        exportGroups().map((g) => (g.h ? `<div class="dd-h">${esc(g.h)}</div>` : "") + g.items.map((it) => `<button data-x="${it.id}">${esc(it.label)}</button>`).join("")).join("");
      dd.querySelectorAll("[data-m]").forEach((b) => (b.onclick = () => {
        localStorage.setItem("dc-export-mode", b.dataset.m);
        dd.querySelectorAll("[data-m]").forEach((x) => x.classList.toggle("on", x === b));
        toast("导出方式：" + (EXPORT_MODES.find((m) => m.id === b.dataset.m) || {}).label);
      }));
      dd.querySelectorAll("[data-x]").forEach((b) => (b.onclick = () => {
        dd.hidden = true;
        const it = exportGroups().flatMap((g) => g.items).find((x) => x.id === b.dataset.x);
        if (it) runExport(it.run());
      }));
      a11yPass(dd);
    };
    const q = $("#dc-q");
    if (q) q.oninput = () => { S.filter = q.value; applyFilter(); };
    document.addEventListener("click", (e) => {
      const close = (wrapSel, ddSel, btnSel) => {
        if (e.target.closest(wrapSel)) return;
        const dd = $(ddSel); if (dd) dd.hidden = true;
        const b = $(btnSel); if (b) b.setAttribute("aria-expanded", "false");
      };
      close("#dc-export-wrap", "#dc-export-dd", "#dc-export-btn");
      close("#dc-device-wrap", "#dc-device-dd", "#dc-device-btn");
      close("#dc-share-wrap", "#dc-share-dd", "#dc-share-btn");
    });

    W.workspace.addEventListener("wheel", (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? 1.1 : 0.9);
    }, { passive: false });
    W.screen.addEventListener("scroll", () => requestAnimationFrame(redraw), { passive: true });
    W.screen.addEventListener("scroll", () => { const cb = $("#dc-compare-body"); if (cb && document.body.classList.contains("dc-compare")) compareSyncScroll(W.screen, cb); }, { passive: true });
    $("#dc-compare-body").addEventListener("scroll", () => compareSyncScroll($("#dc-compare-body"), W.screen), { passive: true });
    window.addEventListener("resize", () => requestAnimationFrame(redraw));

    W.stage.addEventListener("pointerdown", (e) => {
      if (S.ia !== "pages") return;
      const t = e.target.closest("[data-dc]");
      if (S.edit && t) { e.preventDefault(); e.stopPropagation(); startDrag(e, t); return; }
      if (S.hand) panStart(e);
    }, true);
    W.stage.addEventListener("click", (e) => {
      if (S.ia !== "pages" || S.demo.active) return;
      // M47：选中回退链——凡"可点且有反应"的控件都能选中进看板/可标注，不限 data-dc
      const selElem = (root) => root.closest("[data-dc]") ||
        root.closest('[data-act],[data-goto],button,a,input,select,textarea,[role=button],[role=tab],[role=switch],[role=checkbox],[role=radio]');
      const selId = (t) => {
        if (!t || !W.stage.contains(t)) return null;
        const d = t.getAttribute("data-dc");
        if (d) return d;
        const id = synthId(t);
        t.setAttribute("data-dc-auto", id);
        return id;
      };
      // 标注模式：点元素=编辑批注（不触发原型交互，避免"边标注边跳页"）
      if (S.ann && !S.edit) {
        const at = selElem(e.target);
        if (at) {
          e.preventDefault(); e.stopPropagation();
          S.selected = selId(at);
          fillDetail(); redraw();
          editAnnotation(S.selected);
          return;
        }
      }
      const actEl = e.target.closest("[data-act]");
      if (actEl && !S.edit && window.DCRuntime) {
        e.preventDefault(); e.stopPropagation();
        window.DCRuntime.handleClick(actEl, e);
        const d = selId(actEl);
        if (d) { S.selected = d; fillDetail(); redraw(); }
        return;
      }
      const nav = e.target.closest("[data-goto]");
      if (nav && !S.edit) {
        e.preventDefault();
        const t = nav.dataset.goto;
        if (t.startsWith("placeholder:")) notify("原型占位", esc(t.slice(10)) + "（范围外/安全边界，不克隆）");
        else loadView(t).catch((err) => notify("加载失败", esc(err.message)));
        return;
      }
      S.selected = selId(selElem(e.target));
      fillDetail();
      redraw();
    }, true);
    W.stage.addEventListener("mousemove", (e) => {
      if (drag) {
        const dx = drag.dx + (e.clientX - drag.sx) / S.scale, dy = drag.dy + (e.clientY - drag.sy) / S.scale;
        drag.t.style.transform = `translate(${dx}px, ${dy}px)`;
        ((S.overrides[drag.page || S.page] ||= {})[drag.dc] ||= {}).dx = dx;
        S.overrides[S.page][drag.dc].dy = dy;
        return;
      }
      if (S.selected) measure(e);
      if (S.ann) tip(e);
    });
    window.addEventListener("pointerup", () => { finishDrag(); panEnd(); });

    window.addEventListener("keydown", (e) => {
      if (/input|textarea|select/i.test(e.target.tagName)) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); return; }
      if (S.demo.active && e.key === "Escape") return endDemo();
      if (S.play && e.key === "Escape") return endPlay();
      if (e.key === "1") setIA("pages");
      else if (e.key === "2") setIA("scene");
      else if (e.key === "e" || e.key === "E") setEdit(!S.edit);
      else if (e.key === "a" || e.key === "A") $("#dc-ann-toggle").click();
      else if (e.key === "d" || e.key === "D") $("#dc-demo").click();
      else if (e.key === "p" || e.key === "P") $("#dc-play").click();
      else if (e.key === "h" || e.key === "H") $("#dc-hand").click();
      else if (e.key === "f" || e.key === "F") $("#dc-frame-toggle").click();
      else if (e.key === "?" || e.key === "/") showHelp();
      else if (e.key === "+" || e.key === "=") zoomBy(1.2);
      else if (e.key === "-") zoomBy(1 / 1.2);
      else if (e.key === "0") (S.ia === "scene" ? setFZoom(1) : setScale(1));
      else if (e.key === "Escape") {
        ["#dc-export-dd", "#dc-device-dd", "#dc-share-dd"].forEach((s) => { const n = $(s); if (n) n.hidden = true; });
        const mr = $("#dc-modal-root"); if (mr && mr.innerHTML) mr.innerHTML = "";
      }
    });
    window.addEventListener("popstate", () => applyHash(false));
    window.addEventListener("hashchange", () => applyHash(false));
  }
