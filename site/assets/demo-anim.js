/* demo-anim.js v2 —— 四场景四步骤"真实场景感"矢量动画播放器
   每场景=可识别的产品 UI 模拟（微信/抖音/mac/浏览器）+ 光标点击涟漪/打字点/进度条/截帧闪/星点；
   纯 SVG+CSS（主题感知、双语字幕、replay），比 Lottie 更 crisp 可控。 */
(() => {
  const P = {
    dark: "#171c24", dark2: "#1f2630", line: "rgba(255,255,255,.14)", mut: "#8b95a3",
    light: "#f6f8fb", white: "#ffffff", ink: "#2b3440",
    acc: "#ff8a5c", acc2: "#6fd3b2", acc3: "#7fb7ef", green: "#3fca6b", red: "#ff5b6b", yellow: "#ffd166",
  };

  const cursor = (x, y, cls = "") => `<g class="${cls}"><circle cx="${x}" cy="${y}" r="4" fill="#fff" stroke="#2b3440" stroke-width="1.4"/><circle class="ripple" cx="${x}" cy="${y}" r="6" fill="none" stroke="${P.acc}" stroke-width="2"/></g>`;
  const rippleCss = true; void rippleCss;

  const badge = (x, y) => `
    <g class="s4" transform="translate(${x},${y})">
      <rect x="-46" y="-14" width="92" height="26" rx="13" fill="${P.acc2}"/>
      <text x="0" y="3" text-anchor="middle" font-size="10" font-weight="600" fill="#08331f">playable ✓</text>
      <g class="spark"><path d="M-58 -18 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3 z" fill="${P.yellow}"/></g>
      <g class="spark2"><path d="M56 -20 l2.5 5 5 2.5 -5 2.5 -2.5 5 -2.5 -5 -5 -2.5 5 -2.5 z" fill="${P.yellow}"/></g>
    </g>`;

  const agentWin = (x, y, link) => `
    <g class="s3" transform="translate(${x},${y})">
      <rect width="190" height="96" rx="12" fill="${P.dark}" stroke="${P.line}"/>
      <rect width="190" height="22" rx="12" fill="rgba(255,255,255,.06)"/>
      <circle cx="12" cy="11" r="3" fill="${P.red}"/><circle cx="22" cy="11" r="3" fill="${P.yellow}"/><circle cx="32" cy="11" r="3" fill="${P.green}"/>
      <text x="95" y="15" text-anchor="middle" font-size="8" fill="${P.mut}">agent · design-clone</text>
      <rect x="10" y="30" width="120" height="16" rx="8" fill="rgba(127,183,239,.16)" stroke="rgba(127,183,239,.5)"/>
      <text x="18" y="41" font-size="7.5" fill="${P.acc3}">${link}</text>
      <g class="typing"><circle cx="18" cy="58" r="2.4" fill="${P.mut}"/><circle cx="26" cy="58" r="2.4" fill="${P.mut}"/><circle cx="34" cy="58" r="2.4" fill="${P.mut}"/></g>
      <rect x="10" y="70" width="170" height="7" rx="3.5" fill="rgba(255,255,255,.1)"/>
      <rect class="prog" x="10" y="70" width="40" height="7" rx="3.5" fill="${P.acc2}"/>
      <text x="10" y="89" font-size="7" fill="${P.mut}">capture → spec → views → gates</text>
    </g>`;

  /* M79-W2: 站点风矢量引导动画——弃截图嵌入，与官网同设计语言（主题变量/玻璃/线描 glyph/描绘式连接） */
  const glow = `
    <ellipse cx="260" cy="150" rx="252" ry="142" fill="var(--bg2)" opacity=".7"/>
    <circle cx="90" cy="70" r="60" fill="var(--acc)" opacity=".07"/>
    <circle cx="440" cy="220" r="70" fill="var(--acc2)" opacity=".08"/>`;
  const rows = (x, y, wds) => wds.map((w, i) => `<rect x="${x}" y="${y + i * 16}" width="${w}" height="7" rx="3.5" fill="var(--mut)" opacity=".32"/>`).join("");
  const device = {
    phone: `
      <rect x="58" y="36" width="124" height="218" rx="20" fill="var(--card)" stroke="var(--line)"/>
      <rect x="66" y="48" width="108" height="194" rx="12" fill="var(--bg2)"/>
      <rect x="76" y="58" width="44" height="9" rx="4.5" fill="var(--acc)" opacity=".85"/>
      <circle cx="160" cy="62" r="7" fill="var(--acc2)" opacity=".55"/>
      ${rows(76, 80, [88, 72, 84, 60])}
      <rect x="76" y="152" width="88" height="52" rx="10" fill="var(--card)" stroke="var(--line)"/>
      <circle cx="94" cy="170" r="8" fill="var(--acc2)" opacity=".5"/>
      <rect x="108" y="164" width="44" height="6" rx="3" fill="var(--mut)" opacity=".4"/>
      <rect x="108" y="176" width="34" height="5" rx="2.5" fill="var(--mut)" opacity=".28"/>
      <rect x="76" y="216" width="88" height="14" rx="7" fill="var(--card)" stroke="var(--line)"/>`,
    mac: `
      <rect x="42" y="56" width="196" height="132" rx="12" fill="var(--card)" stroke="var(--line)"/>
      <rect x="42" y="56" width="196" height="20" rx="12" fill="var(--bg2)"/>
      <circle cx="56" cy="66" r="3.2" fill="#ff5f57"/><circle cx="67" cy="66" r="3.2" fill="#febc2e"/><circle cx="78" cy="66" r="3.2" fill="#28c840"/>
      <rect x="52" y="86" width="52" height="92" rx="8" fill="var(--bg2)"/>
      ${rows(60, 96, [36, 30, 34])}
      <rect x="112" y="86" width="116" height="92" rx="8" fill="var(--bg2)"/>
      <rect x="120" y="94" width="56" height="8" rx="4" fill="var(--acc)" opacity=".8"/>
      ${rows(120, 112, [100, 84, 92])}`,
    browser: `
      <rect x="42" y="48" width="196" height="146" rx="12" fill="var(--card)" stroke="var(--line)"/>
      <rect x="42" y="48" width="196" height="22" rx="12" fill="var(--bg2)"/>
      <rect x="52" y="54" width="52" height="10" rx="5" fill="var(--card)" stroke="var(--line)"/>
      <rect x="110" y="54" width="52" height="10" rx="5" fill="var(--bg2)"/>
      <rect x="52" y="80" width="176" height="46" rx="8" fill="var(--bg2)"/>
      <rect x="60" y="88" width="70" height="9" rx="4.5" fill="var(--acc)" opacity=".8"/>
      ${rows(60, 104, [120, 96])}
      <rect x="52" y="136" width="84" height="48" rx="8" fill="var(--bg2)"/>
      <rect x="144" y="136" width="84" height="48" rx="8" fill="var(--bg2)"/>`,
    link: `
      <rect x="52" y="40" width="176" height="26" rx="13" fill="var(--card)" stroke="var(--line)"/>
      <circle cx="70" cy="53" r="6" fill="none" stroke="var(--acc)" stroke-width="2"/>
      <rect x="84" y="49" width="96" height="8" rx="4" fill="var(--mut)" opacity=".4"/>
      <rect x="58" y="80" width="124" height="170" rx="18" fill="var(--card)" stroke="var(--line)"/>
      <rect x="66" y="92" width="108" height="146" rx="10" fill="var(--bg2)"/>
      <circle cx="84" cy="110" r="9" fill="var(--acc2)" opacity=".55"/>
      <rect x="100" y="104" width="52" height="7" rx="3.5" fill="var(--mut)" opacity=".45"/>
      <rect x="66" y="132" width="108" height="60" rx="8" fill="var(--card)" stroke="var(--line)"/>
      <circle cx="120" cy="162" r="16" fill="var(--acc)" opacity=".35"/>
      ${rows(74, 204, [92, 70])}`,
  };
  const beam = (x, y, h) => `
    <g class="s2">
      <rect class="scanline" x="${x}" y="${y}" width="108" height="4" rx="2" fill="var(--acc)" opacity=".8"/>
      <g class="fly"><rect x="${x + 20}" y="${y + 30}" width="26" height="34" rx="6" fill="var(--card)" stroke="var(--acc)"/></g>
      <g class="fly" style="animation-delay:.5s"><rect x="${x + 60}" y="${y + 60}" width="26" height="34" rx="6" fill="var(--card)" stroke="var(--acc)"/></g>
    </g>`;
  const agent = `
    <g class="s3">
      <path class="draw" d="M196 150 C 240 150 250 120 296 118" fill="none" stroke="var(--acc)" stroke-width="2" stroke-dasharray="6 5"/>
      <rect x="296" y="70" width="176" height="126" rx="16" fill="var(--card)" stroke="var(--line)"/>
      <rect x="296" y="70" width="176" height="24" rx="16" fill="var(--bg2)"/>
      <circle cx="310" cy="82" r="3.2" fill="#ff5f57"/><circle cx="321" cy="82" r="3.2" fill="#febc2e"/><circle cx="332" cy="82" r="3.2" fill="#28c840"/>
      <text x="384" y="86" text-anchor="middle" font-size="9" fill="var(--mut)">agent · design-clone</text>
      <rect x="308" y="104" width="120" height="16" rx="8" fill="var(--bg2)" stroke="var(--acc2)" stroke-opacity=".5"/>
      <text x="316" y="115" font-size="8" fill="var(--acc2)">views:5 · tokens:38</text>
      <g class="typing"><circle cx="314" cy="132" r="2.6" fill="var(--mut)"/><circle cx="323" cy="132" r="2.6" fill="var(--mut)"/><circle cx="332" cy="132" r="2.6" fill="var(--mut)"/></g>
      <rect x="308" y="146" width="152" height="8" rx="4" fill="var(--bg2)"/>
      <rect class="prog" x="308" y="146" width="152" height="8" rx="4" fill="var(--acc2)"/>
      <text x="308" y="172" font-size="8" fill="var(--mut)">capture → spec → views → gates</text>
    </g>`;
  const finale = `
    <g class="s4">
      <rect x="330" y="96" width="104" height="150" rx="14" fill="var(--card)" stroke="var(--acc2)" stroke-width="1.6"/>
      <rect x="338" y="104" width="88" height="18" rx="6" fill="var(--acc)" opacity=".8"/>
      ${rows(338, 132, [80, 64, 72])}
      <rect x="338" y="190" width="88" height="26" rx="8" fill="var(--bg2)"/>
      <g transform="translate(382,262)">
        <rect x="-52" y="-14" width="104" height="27" rx="13.5" fill="var(--acc2)"/>
        <text x="0" y="4" text-anchor="middle" font-size="10.5" font-weight="700" fill="#08331f">playable ✓</text>
      </g>
      <g class="spark"><path d="M300 84 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3 z" fill="var(--yellow, #ffd166)"/></g>
      <g class="spark2"><path d="M452 92 l2.5 5 5 2.5 -5 2.5 -2.5 5 -2.5 -5 -5 -2.5 5 -2.5 z" fill="var(--yellow, #ffd166)"/></g>
      <g class="ripple" transform="translate(120,150)"><circle r="10" fill="none" stroke="var(--acc)" stroke-width="2"/></g>
    </g>`;
  const scene = (kind, beamPos) => glow + `<g class="s1">${device[kind]}</g>` + beam(...beamPos) + agent + finale;
  const SCENES = {
    mobile: {
      steps: [
        ["Phone app runs — screens scroll, tokens observed", "手机 App 运行——界面滚动，采集 tokens"],
        ["Mirror capture sweeps each screen (frame chips fly out)", "镜像捕获逐屏扫描（帧芯片飞出）"],
        ["Frames + UI tree feed the agent generator", "帧 + UI 树喂给 agent 生成器"],
        ["Playable prototype assembled — gates green", "可玩原型组装完成——门禁全绿"],
      ],
      svg: scene("phone", [66, 60, 180]),
    },
    link: {
      steps: [
        ["Shared link opened — content parsed", "分享链接打开——内容解析"],
        ["Capture sweeps the note flow (frame chips fly out)", "捕获扫描笔记流（帧芯片飞出）"],
        ["Content structure feeds the agent generator", "内容结构喂给 agent 生成器"],
        ["Playable prototype assembled — gates green", "可玩原型组装完成——门禁全绿"],
      ],
      svg: scene("link", [66, 96, 150]),
    },
    desktop: {
      steps: [
        ["Desktop app runs — AX tree observed", "桌面软件运行——AX 树观测"],
        ["Screen capture sweeps windows (frame chips fly out)", "截屏扫描窗口（帧芯片飞出）"],
        ["AX tree + frames feed the agent generator", "AX 树 + 帧喂给 agent 生成器"],
        ["Playable prototype assembled — gates green", "可玩原型组装完成——门禁全绿"],
      ],
      svg: scene("mac", [52, 86, 110]),
    },
    web: {
      steps: [
        ["Website loads — DOM observed", "网站加载——DOM 观测"],
        ["Headless capture sweeps pages (frame chips fly out)", "无头捕获扫描页面（帧芯片飞出）"],
        ["DOM + assets feed the agent generator", "DOM + 资产喂给 agent 生成器"],
        ["Playable prototype assembled — gates green", "可玩原型组装完成——门禁全绿"],
      ],
      svg: scene("browser", [52, 80, 110]),
    },
  };

  function mount(el, sceneKey) {
    const sc = SCENES[sceneKey];
    el.innerHTML = `
      <div class="cap"><span class="captxt"></span>
        <span class="steps">${[1, 2, 3, 4].map((n) => `<b data-s="${n}">${n}</b>`).join("")}</span>
        <button class="replay">replay</button></div>
      <div class="svgbox"><svg viewBox="0 0 520 290" data-step="1">${sc.svg}</svg><canvas class="dvfx"></canvas></div>`;
    const svgEl = el.querySelector("svg");
    const cap = el.querySelector(".captxt");
    const dots = [...el.querySelectorAll(".steps b")];
    const lang = () => (document.documentElement.lang === "zh-CN" ? 1 : 0);
    let step = 1, timer = null;
    const paint = (swap) => {
      el.setAttribute("data-step", step);
      svgEl.setAttribute("data-step", step);
      if (swap !== false) { el.classList.remove("swap"); void el.offsetWidth; el.classList.add("swap"); }
      cap.textContent = `${step}/4 · ${sc.steps[step - 1][lang()]}`;
      dots.forEach((d, i) => { d.classList.toggle("on", i + 1 === step); d.classList.toggle("done", i + 1 < step); });
    };
    const cycle = () => { clearInterval(timer); timer = setInterval(() => { if (step < 4) { step++; paint(); } else clearInterval(timer); }, 2600); };
    const play = () => { clearInterval(timer); step = 1; paint(); cycle(); };
    dots.forEach((d) => (d.onclick = () => { clearInterval(timer); step = +d.dataset.s; paint(); cycle(); }));
    el.querySelector(".replay").onclick = play;
    el._replayLang = () => paint(false);
    // M78: 视口才播（离屏暂停）+ 粒子浮尘层（借鉴原型 particles 经验）
    const rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!rm) {
      const cv = el.querySelector(".dvfx");
      const ctx = cv.getContext("2d");
      let W = 0, H = 0, ps = [], raf = null, live = false;
      const fit = () => { const d = window.devicePixelRatio || 1; W = cv.width = cv.clientWidth * d; H = cv.height = cv.clientHeight * d; };
      const mk = () => ({ x: Math.random() * W, y: Math.random() * H, r: (0.8 + Math.random() * 1.6) * (window.devicePixelRatio || 1), v: 0.12 + Math.random() * 0.3, ph: Math.random() * 6.283 });
      const tick = () => {
        if (!live) return;
        ctx.clearRect(0, 0, W, H);
        const dark = document.documentElement.dataset.theme === "dark";
        for (const p of ps) {
          p.y -= p.v; p.x += Math.sin(p.ph + p.y * 0.01) * 0.25;
          if (p.y < -6) { p.y = H + 6; p.x = Math.random() * W; }
          ctx.globalAlpha = 0.25 + 0.2 * Math.sin(p.ph + performance.now() * 0.001);
          ctx.fillStyle = dark ? "#9fd8ef" : "#ffffff";
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
        }
        ctx.globalAlpha = 1;
        raf = requestAnimationFrame(tick);
      };
      const io = new IntersectionObserver((es) => {
        for (const e of es) {
          if (e.isIntersecting && !live) {
            live = true; fit(); if (!ps.length) ps = Array.from({ length: 14 }, mk);
            if (!raf) tick();
            if (!el._started) { el._started = true; play(); } else cycle();
          } else if (!e.isIntersecting && live) { live = false; clearInterval(timer); if (raf) cancelAnimationFrame(raf); raf = null; }
        }
      }, { threshold: 0.25 });
      io.observe(el);
      window.addEventListener("resize", () => { if (live) fit(); }, { passive: true });
    } else {
      play();
    }
    paint(false);
    return el;
  }

  window.DCAnim = { mount, scenes: Object.keys(SCENES) };
})();
