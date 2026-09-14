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

  /* M81-W2: 可辨认迷你 UI 引导动画——每场景=品牌色板+真实微文案的矢量迷你界面（借 enrich/brief 经验） */
  const glow = `
    <ellipse cx="260" cy="150" rx="252" ry="142" fill="var(--bg2)" opacity=".7"/>
    <circle cx="90" cy="70" r="60" fill="var(--acc)" opacity=".07"/>
    <circle cx="440" cy="220" r="70" fill="var(--acc2)" opacity=".08"/>`;
  const T = (x, y, str, size, fill, anchor, weight) => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}"${anchor ? ` text-anchor="${anchor}"` : ""}${weight ? ` font-weight="${weight}"` : ""} font-family="ui-rounded,-apple-system,'PingFang SC',sans-serif">${str}</text>`;
  const dev = {
    mobile: `
      <rect x="52" y="26" width="132" height="238" rx="20" fill="var(--card)" stroke="var(--line)"/>
      <rect x="60" y="38" width="116" height="214" rx="12" fill="#ededed"/>
      <rect x="60" y="38" width="116" height="20" rx="10" fill="#07c160"/>
      ${T(118, 51, "微信(38)", 8, "#ffffff", "middle", 600)}
      <circle cx="166" cy="48" r="4" fill="none" stroke="#fff" stroke-width="1.2"/>
      ${[[68, "#8ea6c9", "段雅洁", "你还小号了", "昨天", 1], [68, "#07c160", "文件传输助手", "1. 微信核心的单聊和群聊界面", "昨天", 0], [68, "#b78ae8", "家", "姐: 先不急，等妈妈回来", "周三", 0], [68, "#4a9be0", "公众号", "阿蛋巴巴: 上线首月破三千万", "10:53", 1]].map((r, i) => `
        <rect x="60" y="${62 + i * 34}" width="116" height="34" fill="#f6f6f6"/>
        <circle cx="72" cy="${79 + i * 34}" r="8" fill="${r[1]}"/>
        ${T(84, 76 + i * 34, r[2], 7, "#2b3440", "", 600)}
        ${T(84, 86 + i * 34, r[3], 5.6, "#9aa3ad")}
        ${T(172, 76 + i * 34, r[4], 5.4, "#b3bac2", "end")}
        ${r[5] ? `<circle cx="170" cy="${84 + i * 34}" r="3.4" fill="#fa5151"/>${T(170, 86 + i * 34, "1", 4.6, "#fff", "middle")}` : ""}`).join("")}
      <rect x="60" y="232" width="116" height="20" rx="10" fill="#f6f6f6"/>
      <g fill="#07c160"><circle cx="80" cy="242" r="4"/><circle cx="106" cy="242" r="4" opacity=".35"/><circle cx="132" cy="242" r="4" opacity=".35"/><circle cx="158" cy="242" r="4" opacity=".35"/></g>`,
    link: `
      <rect x="52" y="26" width="132" height="238" rx="20" fill="#161823" stroke="var(--line)"/>
      <circle cx="72" cy="48" r="9" fill="#e8b04b"/>
      ${T(86, 46, "沫沫的调色盘", 7, "#ffffff", "", 600)}
      ${T(86, 55, "抖音号: momomo_palette", 5.2, "#8b93a0")}
      <rect x="146" y="40" width="30" height="13" rx="6.5" fill="#fe2c55"/>
      ${T(161, 49, "关注", 6, "#ffffff", "middle", 600)}
      ${T(64, 82, "中午好,", 9, "#ffffff", "", 600)}
      ${T(64, 95, "Serenaqng", 9, "#ffffff", "", 600)}
      <circle cx="150" cy="102" r="12" fill="none" stroke="#ffffff" stroke-width="1.4" opacity=".7"/>
      <circle cx="96" cy="126" r="7" fill="#f4f4f4"/><circle cx="120" cy="126" r="7" fill="#f4f4f4"/>
      <rect x="62" y="146" width="112" height="76" rx="10" fill="#ffffff"/>
      ${T(70, 160, "今日健康分", 6, "#5b4636")}
      ${T(70, 178, "100%", 13, "#3d2c1e", "", 700)}
      ${T(70, 190, "正常", 6, "#2f9e63", "", 600)}
      <circle cx="146" cy="180" r="20" fill="#f7f3ee"/>
      <circle cx="146" cy="176" r="9" fill="#ffffff"/><circle cx="143" cy="174" r="1.6" fill="#2b2b2b"/><circle cx="149" cy="174" r="1.6" fill="#2b2b2b"/>
      <rect x="70" y="198" width="44" height="14" rx="7" fill="#7a4a2b"/>
      ${T(92, 207.5, "和我聊聊", 6, "#ffffff", "middle", 600)}
      ${T(64, 244, "◦ 原创声线 · 沫沫的调色盘", 5.2, "#8b93a0")} `,
    desktop: `
      <rect x="40" y="46" width="200" height="150" rx="12" fill="var(--card)" stroke="var(--line)"/>
      <rect x="40" y="46" width="200" height="20" rx="12" fill="var(--bg2)"/>
      <circle cx="54" cy="56" r="3.2" fill="#ff5f57"/><circle cx="65" cy="56" r="3.2" fill="#febc2e"/><circle cx="76" cy="56" r="3.2" fill="#28c840"/>
      ${T(140, 59, "飞书文档 · 本周原型评审", 6.6, "var(--mut)", "middle")}
      <rect x="48" y="72" width="46" height="116" rx="8" fill="#eef4ff"/>
      <rect x="54" y="80" width="34" height="6" rx="3" fill="#3370ff"/>
      <rect x="54" y="92" width="28" height="5" rx="2.5" fill="#9db9f5"/>
      <rect x="54" y="102" width="32" height="5" rx="2.5" fill="#9db9f5"/>
      <rect x="54" y="112" width="24" height="5" rx="2.5" fill="#9db9f5"/>
      ${T(104, 86, "本周原型评审", 8.4, "var(--ink)", "", 700)}
      <rect x="104" y="94" width="120" height="5" rx="2.5" fill="var(--mut)" opacity=".4"/>
      <rect x="104" y="104" width="104" height="5" rx="2.5" fill="var(--mut)" opacity=".4"/>
      <rect x="104" y="114" width="112" height="5" rx="2.5" fill="var(--mut)" opacity=".4"/>
      <rect x="104" y="128" width="86" height="18" rx="6" fill="#e8f2ff" stroke="#3370ff" stroke-opacity=".5"/>
      ${T(110, 139, "@小昼 门禁全绿，可发布", 5.8, "#2456c4")}
      <rect x="104" y="152" width="120" height="28" rx="6" fill="var(--bg2)"/>
      <rect x="110" y="158" width="40" height="5" rx="2.5" fill="var(--mut)" opacity=".5"/>
      <rect x="110" y="168" width="70" height="5" rx="2.5" fill="var(--mut)" opacity=".35"/>`,
    web: `
      <rect x="40" y="40" width="200" height="160" rx="12" fill="var(--card)" stroke="var(--line)"/>
      <rect x="40" y="40" width="200" height="22" rx="12" fill="var(--bg2)"/>
      <rect x="48" y="45" width="64" height="13" rx="6.5" fill="var(--card)" stroke="var(--line)"/>
      ${T(80, 54, "阿里云控制台", 6, "var(--ink)", "middle", 600)}
      <rect x="116" y="45" width="52" height="13" rx="6.5" fill="transparent"/>
      ${T(142, 54, "监控大盘", 6, "var(--mut)", "middle")}
      <rect x="48" y="68" width="184" height="10" rx="5" fill="var(--bg2)"/>
      ${T(54, 75.5, "ecs.console.aliyun.com", 5.4, "var(--mut)")}
      <rect x="48" y="84" width="40" height="108" rx="6" fill="var(--bg2)"/>
      <rect x="54" y="92" width="28" height="5" rx="2.5" fill="#ff6a00"/>
      <rect x="54" y="102" width="24" height="5" rx="2.5" fill="var(--mut)" opacity=".45"/>
      <rect x="54" y="112" width="26" height="5" rx="2.5" fill="var(--mut)" opacity=".45"/>
      <rect x="94" y="84" width="138" height="14" rx="4" fill="var(--bg2)"/>
      ${T(100, 93.5, "实例", 5.6, "var(--mut)", "", 600)}${T(150, 93.5, "状态", 5.6, "var(--mut)", "", 600)}${T(200, 93.5, "地域", 5.6, "var(--mut)", "", 600)}
      ${[0, 1, 2].map((i) => `
        <rect x="94" y="${100 + i * 18}" width="138" height="16" rx="4" fill="transparent" stroke="var(--line)" stroke-opacity=".6"/>
        ${T(100, 110 + i * 18, "web-0" + (i + 1), 5.6, "var(--ink)")}
        <circle cx="152" cy="${108 + i * 18}" r="2.6" fill="#2f9e63"/>${T(158, 110 + i * 18, "运行中", 5.6, "#2f9e63")}
        ${T(200, 110 + i * 18, "杭州", 5.6, "var(--mut)")}`).join("")}`,
  };
  const beam = (x, y) => `
    <g class="s2">
      <rect class="scanline" x="${x}" y="${y}" width="116" height="4" rx="2" fill="var(--acc)" opacity=".85"/>
      <g class="fly"><rect x="${x + 128}" y="${y + 8}" width="26" height="34" rx="6" fill="var(--card)" stroke="var(--acc)"/><rect x="${x + 132}" y="${y + 14}" width="18" height="3" rx="1.5" fill="var(--mut)" opacity=".5"/><rect x="${x + 132}" y="${y + 20}" width="14" height="3" rx="1.5" fill="var(--mut)" opacity=".35"/></g>
      <g class="fly" style="animation-delay:.5s"><rect x="${x + 150}" y="${y + 44}" width="26" height="34" rx="6" fill="var(--card)" stroke="var(--acc)"/><circle cx="${x + 163}" cy="${y + 56}" r="5" fill="var(--acc2)" opacity=".5"/><rect x="${x + 154}" y="${y + 66}" width="18" height="3" rx="1.5" fill="var(--mut)" opacity=".4"/></g>
    </g>`;
  const agent = `
    <g class="s3">
      <path class="draw" d="M196 150 C 240 150 250 120 296 118" fill="none" stroke="var(--acc)" stroke-width="2" stroke-dasharray="6 5"/>
      <rect x="296" y="70" width="176" height="126" rx="16" fill="var(--card)" stroke="var(--line)"/>
      <rect x="296" y="70" width="176" height="24" rx="16" fill="var(--bg2)"/>
      <circle cx="310" cy="82" r="3.2" fill="#ff5f57"/><circle cx="321" cy="82" r="3.2" fill="#febc2e"/><circle cx="332" cy="82" r="3.2" fill="#28c840"/>
      ${T(384, 86, "agent · design-clone", 6.4, "var(--mut)", "middle")}
      <rect x="308" y="104" width="132" height="16" rx="8" fill="var(--bg2)" stroke="var(--acc2)" stroke-opacity=".5"/>
      ${T(316, 115, "views:5 · tokens:38 · journeys:3", 6.2, "var(--acc2)")}
      <g class="typing"><circle cx="314" cy="132" r="2.6" fill="var(--mut)"/><circle cx="323" cy="132" r="2.6" fill="var(--mut)"/><circle cx="332" cy="132" r="2.6" fill="var(--mut)"/></g>
      <rect x="308" y="146" width="152" height="8" rx="4" fill="var(--bg2)"/>
      <rect class="prog" x="308" y="146" width="152" height="8" rx="4" fill="var(--acc2)"/>
      ${T(308, 172, "capture → spec → views → gates", 6, "var(--mut)")}
    </g>`;
  const finale = `
    <g class="s4">
      <rect x="330" y="96" width="104" height="150" rx="14" fill="var(--card)" stroke="var(--acc2)" stroke-width="1.6"/>
      <rect x="338" y="104" width="88" height="16" rx="6" fill="var(--acc)" opacity=".85"/>
      ${T(382, 115, "可玩原型", 6.4, "#ffffff", "middle", 600)}
      <rect x="338" y="128" width="88" height="26" rx="7" fill="var(--bg2)"/>
      <circle cx="348" cy="141" r="6" fill="var(--acc2)" opacity=".55"/>
      <rect x="358" y="136" width="52" height="4" rx="2" fill="var(--mut)" opacity=".5"/>
      <rect x="358" y="144" width="40" height="4" rx="2" fill="var(--mut)" opacity=".35"/>
      <rect x="338" y="160" width="88" height="26" rx="7" fill="var(--bg2)"/>
      <circle cx="348" cy="173" r="6" fill="var(--acc)" opacity=".5"/>
      <rect x="358" y="168" width="48" height="4" rx="2" fill="var(--mut)" opacity=".5"/>
      <rect x="358" y="176" width="36" height="4" rx="2" fill="var(--mut)" opacity=".35"/>
      <rect x="338" y="192" width="88" height="18" rx="6" fill="var(--bg2)"/>
      <g transform="translate(382,262)">
        <rect x="-52" y="-14" width="104" height="27" rx="13.5" fill="var(--acc2)"/>
        ${T(0, 4, "playable ✓", 8, "#08331f", "middle", 700)}
      </g>
      <g class="spark"><path d="M300 84 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3 z" fill="#ffd166"/></g>
      <g class="spark2"><path d="M452 92 l2.5 5 5 2.5 -5 2.5 -2.5 5 -2.5 -5 -5 -2.5 5 -2.5 z" fill="#ffd166"/></g>
      <g class="ripple" transform="translate(120,150)"><circle r="10" fill="none" stroke="var(--acc)" stroke-width="2"/></g>
    </g>`;
  const scene = (kind, bp) => glow + `<g class="s1">${dev[kind]}</g>` + beam(...bp) + agent + finale;
  const SCENES = {
    mobile: {
      steps: [
        ["WeChat-style list runs — names, badges, timestamps observed", "微信风会话列表运行——昵称/红点/时间被观测"],
        ["Mirror capture sweeps each screen (content frames fly out)", "镜像捕获逐屏扫描（内容帧芯片飞出）"],
        ["Frames + UI tree feed the agent generator", "帧 + UI 树喂给 agent 生成器"],
        ["Playable prototype assembled — gates green", "可玩原型组装完成——门禁全绿"],
      ],
      svg: scene("mobile", [60, 66]),
    },
    link: {
      steps: [
        ["Shared Douyin note opens — author, follow, health card parsed", "抖音分享笔记打开——作者/关注/健康卡被解析"],
        ["Capture sweeps the note flow (content frames fly out)", "捕获扫描笔记流（内容帧芯片飞出）"],
        ["Content structure feeds the agent generator", "内容结构喂给 agent 生成器"],
        ["Playable prototype assembled — gates green", "可玩原型组装完成——门禁全绿"],
      ],
      svg: scene("link", [60, 66]),
    },
    desktop: {
      steps: [
        ["Feishu-style doc window runs — AX tree observed", "飞书风文档窗口运行——AX 树被观测"],
        ["Screen capture sweeps windows (content frames fly out)", "截屏扫描窗口（内容帧芯片飞出）"],
        ["AX tree + frames feed the agent generator", "AX 树 + 帧喂给 agent 生成器"],
        ["Playable prototype assembled — gates green", "可玩原型组装完成——门禁全绿"],
      ],
      svg: scene("desktop", [48, 78]),
    },
    web: {
      steps: [
        ["Aliyun-style console loads — DOM table observed", "阿里云风控制台加载——DOM 表格被观测"],
        ["Headless capture sweeps pages (content frames fly out)", "无头捕获扫描页面（内容帧芯片飞出）"],
        ["DOM + assets feed the agent generator", "DOM + 资产喂给 agent 生成器"],
        ["Playable prototype assembled — gates green", "可玩原型组装完成——门禁全绿"],
      ],
      svg: scene("web", [48, 70]),
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
