/* ident.js v5 —— 首页片头：透明浮景双视频 ident + 双联图叙事节点（M69）
   亮=女生（坐→躺→描云）·暗=男生（朝右行走→弯腰看水面）；片尾含 1.4s 冻结定格。
   双联图（昼|夜背靠背）双用途：
     · seam  = 每循环片尾定格卡：video 冻结尾 → 双联淡入 hold 1.4s → 淡出+视频回 0（循环缝合点）
     · bridge = 主题转场桥：旧视频 → 双联（两世界之门）→ 新视频
   reduced-motion = poster 静帧，无循环无 duo。点击舞台=重播。
   调试钩子 window.__ident.phase() → 'play' | 'seam' | 'bridge'。 */
window.DCIdent = {
  build() {
    return `
  <div class="idf-halo" data-k="light" style="background-image:url(assets/ident-light-poster.3345e518.jpg)"></div>
  <div class="idf-halo" data-k="dark" style="background-image:url(assets/ident-dark-poster.0ca98225.jpg)"></div>
  <video class="idf-video" data-k="light" src="assets/ident-light.3345e518.mp4" poster="assets/ident-light-poster.3345e518.jpg" muted playsinline preload="none" tabindex="-1"></video>
  <video class="idf-video" data-k="dark" src="assets/ident-dark.2e1d52dc.mp4" poster="assets/ident-dark-poster.0ca98225.jpg" muted playsinline preload="none" tabindex="-1"></video>
  <div class="idf-duo" style="background-image:url(assets/logo-main.png)"></div>`;
  },
  wire(el) {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const vids = { light: el.querySelector('.idf-video[data-k="light"]'), dark: el.querySelector('.idf-video[data-k="dark"]') };
    const halos = { light: el.querySelector('.idf-halo[data-k="light"]'), dark: el.querySelector('.idf-halo[data-k="dark"]') };
    let cur = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    let phase = "play";
    let busy = false;
    const setPhase = (p) => { phase = p; };
    window.__ident = { phase: () => phase };

    const playVid = (k) => { vids[k].currentTime = 0; const pr = vids[k].play(); if (pr && pr.catch) pr.catch(() => {}); };

    const seam = (k) => {
      if (busy || reduced) return;
      busy = true; setPhase("seam");
      el.classList.add("duo");
      setTimeout(() => {
        el.classList.remove("duo");
        playVid(k);
        setPhase("play");
        busy = false;
      }, 1900); // .5s 淡入 + 1.4s 定格
    };

    vids.light.addEventListener("ended", () => { if (cur === "light") seam("light"); });
    vids.dark.addEventListener("ended", () => { if (cur === "dark") seam("dark"); });

    const setActive = (theme, restart) => {
      if (theme === cur && !restart) return;
      const prev = cur;
      cur = theme;
      if (reduced) {
        for (const k of ["light", "dark"]) {
          vids[k].classList.toggle("on", k === theme);
          halos[k].classList.toggle("on", k === theme);
          vids[k].pause(); vids[k].currentTime = 0;
        }
        return;
      }
      if (prev !== theme) {
        // bridge：旧视频 → 双联 → 新视频
        setPhase("bridge");
        el.classList.add("duo");
        vids[prev].classList.remove("on");
        setTimeout(() => {
          vids[theme].classList.add("on");
          halos[theme].classList.add("on");
          halos[prev].classList.remove("on");
          playVid(theme);
          setTimeout(() => { el.classList.remove("duo"); setPhase("play"); }, 420);
        }, 430);
      } else if (restart) {
        vids[theme].preload = "auto";
        playVid(theme);
      }
      for (const k of ["light", "dark"]) {
        vids[k].classList.toggle("on", k === theme);
        halos[k].classList.toggle("on", k === theme);
        if (k !== theme) setTimeout(() => { if (cur !== k) vids[k].pause(); }, 900);
      }
    };

    el.onclick = () => {
      if (reduced || busy || phase !== "play") return;
      el.classList.add("duo");
      setPhase("seam");
      setTimeout(() => { el.classList.remove("duo"); playVid(cur); setPhase("play"); }, 500);
    };

    // M76-W7c: preload=none + load 后才播——媒体请求不参与主文档 load；poster halo 兜底视觉
    const start = () => setActive(cur, true);
    if (document.readyState === "complete") start();
    else {
      window.addEventListener("load", start, { once: true });
      setTimeout(() => { if (vids[cur].readyState === 0 && !vids[cur].classList.contains("on")) start(); }, 2500);
    }
    return { swap: (theme) => setActive(theme, false), phase: () => phase };
  },
};
