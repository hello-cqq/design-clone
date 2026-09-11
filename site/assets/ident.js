/* ident.js v3 —— 首页片头：透明浮景视频 ident（桌面灵宠形态）
   亮=女生（坐→躺→描云→淡出）；暗=男生（朝右行走→弯腰看水面→淡出）。
   羽毛椭圆遮罩去矩形边界 + poster 模糊环境光晕 + bob 浮沉 + 接触软阴影 = 与页面背景融合。
   播一次→video 融化消失→lockup 浮现原位；点击重播；reduced-motion=poster+lockup。 */
window.DCIdent = {
  build(theme) {
    const dark = theme === "dark";
    const src = dark ? "assets/ident-dark.mp4" : "assets/ident-light.mp4";
    const poster = dark ? "assets/ident-dark-poster.jpg" : "assets/ident-light-poster.jpg";
    return `
  <div class="idf-halo" style="background-image:url(${poster})"></div>
  <video class="idf-video" src="${src}" poster="${poster}" muted playsinline preload="metadata" tabindex="-1"></video>
  <div class="idf-lockup">
    <div class="idf-word">design-clone</div>
    <div class="idf-tag">CLONE ANY APP INTO A PLAYABLE PROTOTYPE</div>
  </div>
  <span class="idf-hint">replay</span>`;
  },
  wire(el) {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const video = el.querySelector(".idf-video");
    const lockup = el.querySelector(".idf-lockup");
    let ended = false;
    const showLock = () => { video.style.opacity = "0"; lockup.classList.add("on"); };
    const play = () => {
      ended = false;
      lockup.classList.remove("on");
      video.style.opacity = "";
      video.currentTime = 0;
      const p = video.play();
      if (p && p.catch) p.catch(() => {});
    };
    video.addEventListener("ended", () => { ended = true; showLock(); });
    video.addEventListener("timeupdate", () => {
      // 视频自身淡出段（末 ~0.7s）开始融化，衔接 lockup
      if (!ended && video.duration && video.currentTime > video.duration - 0.75) showLock();
    });
    el.onclick = () => { if (reduced) return; play(); };
    if (reduced) { video.removeAttribute("autoplay"); showLock(); }
    else setTimeout(play, 300);
    return { play, swap(theme) {
      const dark = theme === "dark";
      video.src = dark ? "assets/ident-dark.mp4" : "assets/ident-light.mp4";
      video.poster = dark ? "assets/ident-dark-poster.jpg" : "assets/ident-light-poster.jpg";
      el.querySelector(".idf-halo").style.backgroundImage = `url(${video.poster})`;
      ended = false; lockup.classList.remove("on"); video.style.opacity = "";
      if (!reduced) setTimeout(play, 150); else showLock();
    } };
  },
};
