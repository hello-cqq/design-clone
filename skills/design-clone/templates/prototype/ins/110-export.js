/* inspector 分段 110-export.js —— 导出与分享：store-only zip/下载/选目录/并发锁 + 分享四入口
 * 源文件按文件名顺序拼接为 prototype/inspector.js（scripts/build-shell.mjs），同一 IIFE 闭包。
 * 约定：JS 只写几何与状态；排版/配色一律 inspector.css 类 + 主题变量。
 */
  /* ---------- 导出/分享/截图 ---------- */
  function boardItem() {
    return { type: "board", board: { page: S.page, ia: S.ia, selNode: S.selNode, selPath: S.selPath, selected: S.selected,
      product: S.products[S.ia === "scene" ? S.selNode : S.page] || null, at: new Date().toISOString() } };
  }
  function exportGroups() {
    const all = { id: "all", label: "导出全部（页面±标注 + 全场景树）", run: () => {
      const its = [];
      (DC.pages || []).forEach((p) => { its.push({ type: "page", id: p.id, ann: false }); its.push({ type: "page", id: p.id, ann: true }); });
      its.push({ type: "scene-full" }, boardItem(), { type: "design-json" }, { type: "figma" });
      return its;
    } };
    let ctx = null;
    if (S.ia === "scene" && S.flowMode === "tree" && S.selNode) ctx = { id: "sel-node", label: `导出选中树 ${idxOf(S.selNode)} ${nodeTitle(S.selNode)}`, run: () => [{ type: "node", id: S.selNode }, boardItem()] };
    else if (S.ia === "scene" && S.flowMode === "path" && S.selNode) ctx = { id: "sel-path", label: `导出选中路径 #${S.selPath + 1}`, run: () => [{ type: "path", id: S.selPath, root: S.selNode }, boardItem()] };
    else if (S.page) ctx = { id: "sel-page", label: `导出选中页 ${idxOf(S.page)} ${nodeTitle(S.page)} ±标注`, run: () => [{ type: "page", id: S.page, ann: false }, { type: "page", id: S.page, ann: true }, boardItem(), { type: "design-json", id: S.page }] };
    // M51：设计产物独立入口（生成期已有初始版；此处=编辑后重采集）
    const design = { id: "design", label: "产品设计 JSON（每页 spec）+ Figma 源", run: () => [{ type: "design-json" }, { type: "figma" }] };
    return [{ h: "", items: ctx ? [all, ctx, design] : [all, design] }];
  }
  /* ---------- M44k：导出真正落到用户本地 ----------
     旧实现只把文件写进服务端 run/export/<ts>/，浏览器里"导出"看不到任何下载（用户报的 bug）。
     现在三档：本地下载 zip（默认，前端零依赖打包 store-zip）/ 选目录导出（File System Access API）/ 仅存服务端（CLI 口径）。 */
  /* zip/CRC 已抽为叶子模块 templates/prototype/zipstore.js（UMD-lite：浏览器挂 window.DCZip，Node 可 require 做单测） */
  const b64ToU8 = (b64) => DCZip.b64ToU8(b64);
  const zipStore = (entries) => DCZip.zipStore(entries);
  const stamp = () => new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  function downloadBlob(name, blob) {
    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 8000);
  }
  function download(name, text) { downloadBlob(name, new Blob([text], { type: "application/json" })); }
  const exportMode = () => localStorage.getItem("dc-export-mode") || "download";
  let exportBusy = false;
  function setExportBusy(on) {
    const b = $("#dc-export-btn");
    if (!b) return;
    b.classList.toggle("busy", on);
    b.textContent = on ? "导出中" : "导出 ▾";
  }
  async function requestExport(items, returnFiles) {
    const r = await fetch("/__dc_export__", { method: "POST", body: JSON.stringify({ scope: items.map((i) => i.type).join(","), items, returnFiles }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) throw new Error(j.error || ("HTTP " + r.status));
    return j;
  }
  async function exportToDir(items) {
    let dir;
    try { dir = await window.showDirectoryPicker({ mode: "readwrite" }); }
    catch (e) { if (e && e.name === "AbortError") return; throw new Error("目录选择不可用：" + e.message); }
    const j = await requestExport(items, true);
    if (!j.payload) throw new Error("服务端未回传文件内容（可能超出回传上限），已存 " + j.dir);
    for (const f of j.payload) {
      const seg = f.name.split("/");
      let cur = dir;
      for (const s of seg.slice(0, -1)) cur = await cur.getDirectoryHandle(s, { create: true });
      const fh = await cur.getFileHandle(seg[seg.length - 1], { create: true });
      const w = await fh.createWritable();
      await w.write(b64ToU8(f.b64)); await w.close();
    }
    return { count: j.payload.length, where: "所选目录" };
  }
  async function runExport(items) {
    if (exportBusy) { toast("导出进行中，请稍候…"); return; }
    const mode = exportMode();
    exportBusy = true; setExportBusy(true);
    try {
      if (mode === "dir" && window.showDirectoryPicker) {
        const r = await exportToDir(items);
        if (r) toast(`已写入${r.where}（${r.count} 文件）`);
        return;
      }
      if (mode === "dir") toast("当前浏览器不支持选目录，改用本地下载 zip");
      const wantFiles = mode !== "server";
      const j = await requestExport(items, wantFiles);
      if (!wantFiles || !j.payload) { toast(`已导出 → ${j.dir}（${j.files.length} 文件）`); return; }
      downloadBlob(`design-clone-export-${stamp()}.zip`, zipStore(j.payload.map((f) => ({ name: f.name, data: b64ToU8(f.b64) }))));
      toast(`已下载 ${j.payload.length} 个文件（zip）${j.truncated ? "；超量部分只在 " + j.dir : "；服务端副本 " + j.dir}`);
    } catch (e) {
      const b = items.find((i) => i.type === "board");
      if (b) download("board.json", JSON.stringify(b.board, null, 2));
      toast(/Failed to fetch|Load failed|NetworkError/i.test(String(e.message)) && b
        ? "图片导出需 node serve.mjs 服务；看板 JSON 已下载"
        : "导出失败：" + String(e.message).slice(0, 120) + (b ? "（看板 JSON 已下载）" : ""));
    } finally {
      exportBusy = false; setExportBusy(false);
    }
  }

  /* ---------- 分享：状态链接 / 纯净版 / 卡片版 / 全屏演示 ---------- */
  function shareURL(extra) {
    const u = new URL(location.href);
    const dev = DEVICES.find((d) => d.cls === shellClass());
    if (dev) u.searchParams.set("device", dev.cls);
    if (S.variant) u.searchParams.set("variant", S.variant);
    for (const [k, v] of Object.entries(extra || {})) u.searchParams.set(k, v);
    return u.toString();
  }
  function shareItems() {
    return [
      { h: "分享 / 演示" },
      { id: "link", label: "复制状态链接（含页面/场景/设备/变体）" },
      { id: "clean", label: "打开纯净版（无外壳，可嵌 iframe）" },
      { id: "card", label: "打开卡片版（截图/贴文档用）" },
      { id: "full", label: "全屏演示（观看者视角）" },
    ];
  }
  function renderShareDD() {
    const dd = $("#dc-share-dd");
    dd.innerHTML = shareItems().map((it) => (it.h ? `<div class="dd-h">${esc(it.h)}</div>` : `<button data-s="${it.id}">${esc(it.label)}</button>`)).join("");
    dd.querySelectorAll("button").forEach((b) => (b.onclick = () => { dd.hidden = true; $("#dc-share-btn").setAttribute("aria-expanded", "false"); shareAction(b.dataset.s); }));
  }
  async function shareAction(id) {
    if (id === "link") {
      const url = shareURL();
      try { await navigator.clipboard.writeText(url); toast("已复制状态链接，可直接分享"); }
      catch { notify("复制链接", esc(url)); }
      return;
    }
    if (id === "clean" || id === "card") { window.open(shareURL(id === "clean" ? { embed: "1" } : { card: "1" }), "_blank"); return; }
    if (id === "full") {
      try { if (document.fullscreenEnabled) await document.documentElement.requestFullscreen(); } catch { /* 全屏被拒时仍进入演示 */ }
      if (S.journeys.length) { S.journeys.length > 1 ? demoChooser() : startDemo(0); }
      else playPath(S.ia === "scene" ? S.selPath : 0);
    }
  }
  function toast(msg) {
    let t = $("#dc-toast"); if (!t) { t = document.createElement("div"); t.id = "dc-toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false;
    setTimeout(() => (t.hidden = true), 3200);
  }
