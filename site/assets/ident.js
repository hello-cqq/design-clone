/* ident.js v4 —— 首页片头：透明浮景双视频 ident（M65）
   亮=女生（坐→躺→描云）·暗=男生（朝右行走→弯腰看水面）；片尾含 1.4s 冻结定格。
   循环：ended → hold .8s → .4s 淡出 → 回 0 播放 → 淡入（无缝缝合）。
   主题切换：双 video/halo 叠层 .7s 交叉淡化，非活动片 pause。
   无 lockup 文字、无 replay 提示；点击舞台=无提示重播；reduced-motion=poster 静帧不循环。 */
window.DCIdent = {
  build() {
    return `
  <div class="idf-halo" data-k="light" style="background-image:url(assets/ident-light-poster.jpg)"></div>
  <div class="idf-halo" data-k="dark" style="background-image:url(assets/ident-dark-poster.jpg)"></div>
  <video class="idf-video" data-k="light" src="assets/ident-light.mp4" poster="assets/ident-light-poster.jpg" muted playsinline preload="metadata" tabindex="-1"></video>
  <video class="idf-video" data-k="dark" src="assets/ident-dark.mp4" poster="assets/ident-dark-poster.jpg" muted playsinline preload="metadata" tabindex="-1"></video>`;
  },
  wire(el) {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const vids = { light: el.querySelector('.idf-video[data-k="light"]'), dark: el.querySelector('.idf-video[data-k="dark"]') };
    const halos = { light: el.querySelector('.idf-halo[data-k="light"]'), dark: el.querySelector('.idf-halo[data-k="dark"]') };
    let cur = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    let dipping = false;

    const loop = (k) => {
      const v = vids[k];
      v.addEventListener("ended", () => {
        if (k !== cur || reduced) return;
        setTimeout(() => {
          if (k !== cur || dipping) return;
          dipping = true;
          el.classList.add("dip");
          setTimeout(() => {
            v.currentTime = 0;
            const p = v.play(); if (p && p.catch) p.catch(() => {});
            el.classList.remove("dip");
            dipping = false;
          }, 420);
        }, 800);
      });
    };
    loop("light"); loop("dark");

    const setActive = (theme, restart) => {
      cur = theme;
      for (const k of ["light", "dark"]) {
        const on = k === theme;
        vids[k].classList.toggle("on", on);
        halos[k].classList.toggle("on", on);
        if (on) {
          if (restart && !reduced) { vids[k].currentTime = 0; const p = vids[k].play(); if (p && p.catch) p.catch(() => {}); }
          else if (reduced) { vids[k].pause(); vids[k].currentTime = 0; }
        } else {
          setTimeout(() => { if (cur !== k) vids[k].pause(); }, 750);
        }
      }
    };

    el.onclick = () => {
      if (reduced || dipping) return;
      dipping = true;
      el.classList.add("dip");
      setTimeout(() => {
        vids[cur].currentTime = 0;
        const p = vids[cur].play(); if (p && p.catch) p.catch(() => {});
        el.classList.remove("dip");
        dipping = false;
      }, 420);
    };

    setActive(cur, !reduced);
    return { swap: (theme) => setActive(theme, true) };
  },
};
