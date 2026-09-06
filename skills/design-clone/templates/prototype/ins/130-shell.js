/* inspector 分段 130-shell.js —— 设备壳：shellClass/状态栏与窗框注入/applyShellClasses/设备下拉与持久化
 * 源文件按文件名顺序拼接为 prototype/inspector.js（scripts/build-shell.mjs），同一 IIFE 闭包。
 * 约定：JS 只写几何与状态；排版/配色一律 inspector.css 类 + 主题变量。
 */
  /* ---------- 平台 shell 四档 + 状态栏（M44k：全部由 DEVICES 单一真源驱动） ---------- */
  function shellClass() { return S.device || SHELL_ALIAS[DC.shell] || "dc-mobile"; }
  function isTouch() { return deviceOf(shellClass()).touch; }
  function isLarge() { return !deviceOf(shellClass()).touch; }
  function shellLabel() { return deviceOf(shellClass()).long; }
  /* 状态栏图标：借鉴 open-design mobile-app 种子（Apache-2.0）的填充式画法；
     注意必须用 inline style 而非 fill/stroke 属性（全局 svg{} CSS 会覆盖表现属性） */
  const SB_ICONS = `<span class="sb-ic"><svg width="15" height="11" viewBox="0 0 17 11" style="fill:currentColor;stroke:none"><rect x="0" y="7" width="3" height="4" rx="0.6"/><rect x="4" y="5" width="3" height="6" rx="0.6"/><rect x="8" y="3" width="3" height="8" rx="0.6"/><rect x="12" y="0" width="3" height="11" rx="0.6"/></svg><svg width="15" height="11" viewBox="0 0 17 11" style="fill:currentColor;stroke:none"><path d="M8.5 1.5C5.5 1.5 2.7 2.6 0.5 4.6L2 6.1C3.8 4.5 6.1 3.6 8.5 3.6c2.4 0 4.7 0.9 6.5 2.5l1.5-1.5c-2.2-2-5-3.1-8-3.1zM3.5 7.6L5 9.1c1-0.9 2.2-1.4 3.5-1.4 1.3 0 2.5 0.5 3.5 1.4l1.5-1.5c-1.4-1.3-3.1-2-5-2-1.9 0-3.6 0.7-5 2zM6.5 10.6l2 2 2-2c-0.5-0.5-1.2-0.8-2-0.8s-1.5 0.3-2 0.8z"/></svg><svg width="22" height="11" viewBox="0 0 25 11" style="fill:none;stroke:none"><rect x="0.5" y="0.5" width="21" height="10" rx="2.5" stroke="currentColor" stroke-opacity="0.45" stroke-width="1"/><rect x="22.5" y="3.5" width="1.5" height="4" rx="0.4" fill="currentColor" fill-opacity="0.45"/><rect x="2" y="2" width="13.5" height="7" rx="1.4" fill="currentColor"/></svg></span>`;
  function buildFrameChrome() {
    W.phone.querySelectorAll(".dc-framebar, .dc-statusbar").forEach((n) => n.remove());
    if (document.body.classList.contains("dc-chromeless") || document.body.classList.contains("dc-cardview")) return;
    const c = shellClass();
    const title = ($("#dc-title") || {}).textContent || "";
    if (!S.frame) return;
    if (isTouch()) {
      const ios = ((DC.platform || {}).platform || "ios") === "ios";
      if (ios) {
        const isl = document.createElement("span");
        isl.className = "dc-island";
        W.phone.prepend(isl);
      }
      // M19：视图未自带状态栏时壳层自动注入（微信等 live 视图恢复状态栏）
      // M44k：排版改用 .dc-sb-injected 双类（比 run 视图 CSS 的 .dc-statusbar 更具体），
      //       不再用 inline cssText —— inline 会压过 inspector.css，是"改了 CSS 却没生效"这类反复 bug 的温床
      if (!W.stage.querySelector(".dc-statusbar,[data-dc-statusbar]")) {
        const sb = document.createElement("div");
        sb.className = "dc-statusbar dc-sb-injected";
        sb.innerHTML = `<span class="sb-time">9:41</span>${SB_ICONS}`;
        W.phone.prepend(sb);
      }
    } else if (c === "dc-browser") {
      const bar = document.createElement("div");
      bar.className = "dc-framebar";
      bar.innerHTML = `<span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="tab">${esc(title)}</span><span class="urlbar">🔒 ${esc(((DC.platform || {}).url) || "https://" + (((DC.platform || {}).host) || "example.com"))}</span><span>＋</span>`;
      W.phone.prepend(bar);
    } else if (c === "dc-desktop") {
      const os = ((DC.platform || {}).os) || "mac";
      const bar = document.createElement("div");
      bar.className = "dc-framebar";
      bar.innerHTML = os === "win"
        ? `<span>⊞</span><span>${esc(title)}</span><span class="win-cap"><span>─</span><span>▢</span><span>✕</span></span>`
        : `<span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span style="margin:0 auto">${esc(title)}</span><span style="width:52px"></span>`;
      W.phone.prepend(bar);
    }
  }
  function applyShellClasses() {
    const dev = deviceOf(shellClass());
    DEVICES.forEach((d) => document.body.classList.remove(d.cls));
    document.body.classList.add(dev.cls);
    $("#dc-device-label").textContent = dev.label;
    // M44f：shell 尺寸用 inline 兜底（防视图 css 级联把桌面窗压成手机宽——desktop run 排版崩坏根因）
    W.phone.style.width = dev.size[0] + "px"; W.phone.style.height = dev.size[1] + "px";
  }
  /** 设备下拉：由 DEVICES 渲染（改名只改一处）；选择持久化 + 进 URL，刷新与分享都不丢 */
  function renderDeviceDD() {
    const dd = $("#dc-device-dd");
    dd.innerHTML = DEVICES.map((d) =>
      `<button role="menuitem" data-cls="${d.cls}"${d.cls === shellClass() ? ' class="on"' : ""}>${esc(d.label)}<span class="dd-sub">${d.size[0]}×${d.size[1]}</span></button>`).join("");
    dd.querySelectorAll("button").forEach((b) => (b.onclick = () => {
      dd.hidden = true; $("#dc-device-btn").setAttribute("aria-expanded", "false"); setDevice(b.dataset.cls);
    }));
  }
  function setDevice(cls) {
    if (!DEVICES.some((d) => d.cls === cls)) { toast("未知设备档：" + cls); return; }
    S.device = cls;
    try { localStorage.setItem("dc-device", cls); } catch { /* 隐私模式下忽略 */ }
    setQueryParam("device", cls);
    applyShellClasses(); renderDeviceDD(); buildFrameChrome();
    if (S.ia === "pages") fit(); else renderFlow();
    fillDetail();
    const dev = deviceOf(cls);
    toast(`设备：${dev.label}（${dev.size[0]}×${dev.size[1]}）`);
  }
