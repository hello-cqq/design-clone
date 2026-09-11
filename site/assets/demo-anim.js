/* demo-anim.js —— 四场景四步骤矢量动画播放器（比 Lottie 更 crisp：纯 SVG+CSS，主题感知、双语字幕、可 replay） */
(() => {
  const NS = "http://www.w3.org/2000/svg";
  const C = {
    phone: "#1c222b", phoneL: "#e8ecf1", screen: "#f6f8fb", screenD: "#12161d",
    acc: "#ff8a5c", acc2: "#6fd3b2", acc3: "#7fb7ef", mut: "#8b95a3", card: "#ffffff", cardD: "#1a2029",
  };

  const phone = (x, y, w, h, inner) => `
    <g transform="translate(${x},${y})">
      <rect width="${w}" height="${h}" rx="18" fill="${C.phone}"/>
      <rect x="4" y="4" width="${w - 8}" height="${h - 8}" rx="14" fill="${C.screen}"/>
      <rect x="${w / 2 - 14}" y="8" width="28" height="5" rx="2.5" fill="${C.phone}"/>
      ${inner}
    </g>`;

  const win = (x, y, w, h, title, inner) => `
    <g transform="translate(${x},${y})">
      <rect width="${w}" height="${h}" rx="10" fill="${C.cardD}" stroke="rgba(255,255,255,.14)"/>
      <rect width="${w}" height="20" rx="10" fill="rgba(255,255,255,.07)"/>
      <circle cx="12" cy="10" r="3" fill="#ff6b6b"/><circle cx="22" cy="10" r="3" fill="#ffd166"/><circle cx="32" cy="10" r="3" fill="#6fd3b2"/>
      <text x="${w / 2}" y="14" text-anchor="middle" font-size="8" fill="${C.mut}">${title}</text>
      ${inner}
    </g>`;

  const protoCards = (x, y) => `
    <g transform="translate(${x},${y})">
      <g class="s4">
        <rect x="18" y="10" width="86" height="58" rx="8" fill="${C.cardD}" stroke="${C.acc2}" stroke-width="1.4" transform="rotate(-5 61 39)"/>
        <rect x="8" y="4" width="86" height="58" rx="8" fill="${C.cardD}" stroke="${C.acc}" stroke-width="1.4" transform="rotate(3 51 33)"/>
        <rect x="0" y="0" width="86" height="58" rx="8" fill="${C.cardD}" stroke="rgba(255,255,255,.25)"/>
        <rect x="8" y="8" width="40" height="6" rx="3" fill="${C.acc}"/>
        <rect x="8" y="20" width="70" height="4" rx="2" fill="rgba(255,255,255,.25)"/>
        <rect x="8" y="28" width="58" height="4" rx="2" fill="rgba(255,255,255,.18)"/>
        <rect x="8" y="40" width="26" height="10" rx="5" fill="${C.acc2}"/>
        <text x="52" y="49" font-size="7" fill="${C.acc2}">playable ✓</text>
      </g>
    </g>`;

  const agentChat = (x, y, linkText) => `
    <g transform="translate(${x},${y})" class="s3">
      <rect width="150" height="74" rx="10" fill="${C.cardD}" stroke="rgba(255,255,255,.14)"/>
      <text x="10" y="16" font-size="8" fill="${C.acc2}">agent · design-clone</text>
      <rect x="10" y="24" width="120" height="14" rx="7" fill="rgba(255,255,255,.1)"/>
      <text x="16" y="34" font-size="7" fill="${C.acc3}">${linkText}</text>
      <rect x="10" y="44" width="86" height="10" rx="5" fill="${C.acc}" opacity=".85"/>
      <text x="18" y="51.5" font-size="6.5" fill="#fff">clone → prototype</text>
      <rect x="10" y="58" width="60" height="8" rx="4" fill="rgba(111,211,178,.25)"/>
    </g>`;

  const SCENES = {
    mobile: {
      steps: [
        ["Phone app runs — pages, gestures, tokens observed", "手机 App 运行——采集页面、手势与 tokens"],
        ["GUI mirror capture (adb/scrcpy) frames every screen", "GUI 镜像抓取（adb/scrcpy）逐屏截帧"],
        ["Frames + UI tree feed the spec-driven generator", "帧 + UI 树喂给规格驱动生成器"],
        ["Playable prototype assembled — gates green", "可玩原型组装完成——门禁全绿"],
      ],
      svg: `
        ${phone(30, 30, 96, 190, `
          <g class="s1"><rect x="10" y="22" width="76" height="30" rx="8" fill="${C.acc}" opacity=".85"/>
          <g class="scrollfeed"><rect x="10" y="58" width="76" height="20" rx="6" fill="#e3e9f2"/><rect x="10" y="82" width="76" height="20" rx="6" fill="#e3e9f2"/><rect x="10" y="106" width="76" height="20" rx="6" fill="#e3e9f2"/><rect x="10" y="130" width="76" height="20" rx="6" fill="#e3e9f2"/></g>
          <rect x="10" y="158" width="76" height="14" rx="7" fill="#dfe6f0"/></g>`)}
        <g class="s2">${win(160, 40, 150, 120, "scrcpy mirror", `
          <rect x="46" y="28" width="58" height="84" rx="8" fill="${C.screen}"/>
          <rect class="scanline" x="46" y="30" width="58" height="3" fill="${C.acc2}" opacity=".8"/>
          <text x="75" y="122" text-anchor="middle" font-size="7" fill="${C.mut}">frame 12/48</text>`)}
        </g>
        <g class="s3"><path class="fly" d="M240 90 q30 -18 60 -8" stroke="${C.acc3}" stroke-width="1.6" fill="none" stroke-dasharray="4 4"/>
          ${win(300, 60, 130, 90, "generator", `
            <rect x="10" y="28" width="50" height="8" rx="4" fill="${C.acc2}" opacity=".8"/>
            <rect x="10" y="42" width="110" height="5" rx="2.5" fill="rgba(255,255,255,.2)"/>
            <rect x="10" y="52" width="90" height="5" rx="2.5" fill="rgba(255,255,255,.15)"/>
            <rect x="10" y="66" width="40" height="12" rx="6" fill="${C.acc}" opacity=".9"/>`)}</g>
        ${protoCards(330, 170)}`,
    },
    link: {
      steps: [
        ["Scroll the Douyin / RED note or video", "刷抖音 / 小红书视频或图文"],
        ["Share → copy link", "分享 → 复制链接"],
        ["Paste the link into your agent", "把链接粘贴进 Agent"],
        ["Frames parsed → prototype generated", "解析帧 → 生成原型"],
      ],
      svg: `
        ${phone(30, 30, 96, 190, `
          <g class="s1"><g class="scrollfeed"><rect x="8" y="20" width="80" height="70" rx="6" fill="#20262e"/><rect x="8" y="94" width="80" height="70" rx="6" fill="#262c36"/></g>
          <rect x="14" y="150" width="40" height="6" rx="3" fill="rgba(255,255,255,.5)"/></g>
          <g class="s2"><rect x="18" y="70" width="60" height="80" rx="10" fill="rgba(255,255,255,.96)"/>
          <text x="26" y="86" font-size="7" fill="#333">分享到…</text>
          <rect x="24" y="94" width="48" height="12" rx="6" fill="${C.acc}"/><text x="32" y="102.5" font-size="6.5" fill="#fff">复制链接</text>
          <rect x="24" y="112" width="48" height="10" rx="5" fill="#e8ecf1"/><rect x="24" y="126" width="48" height="10" rx="5" fill="#e8ecf1"/></g>`)}
        <g class="s3"><path class="fly" d="M120 120 q40 -26 90 -14" stroke="${C.acc}" stroke-width="1.6" fill="none" stroke-dasharray="4 4"/></g>
        ${agentChat(230, 60, "https://v.douyin.com/…")}
        ${protoCards(330, 170)}`,
    },
    desktop: {
      steps: [
        ["Desktop app operates — windows, panels, flows", "桌面应用操作——窗口、面板、流程"],
        ["Screen capture snapshots each state", "屏幕捕获逐状态快照"],
        ["Tokens & layout extracted from computed styles", "从 computed 样式抽取 tokens 与布局"],
        ["Desktop-faithful prototype assembled", "组装桌面保真原型"],
      ],
      svg: `
        <g class="s1">${win(30, 40, 170, 120, "Lark · mac", `
          <rect x="8" y="26" width="34" height="86" rx="6" fill="rgba(255,255,255,.06)"/>
          <rect x="48" y="26" width="60" height="86" rx="6" fill="rgba(255,255,255,.09)"/>
          <rect x="112" y="26" width="50" height="86" rx="6" fill="rgba(255,255,255,.05)"/>
          <rect x="52" y="32" width="52" height="8" rx="4" fill="${C.acc3}" opacity=".8"/>`)}</g>
        <g class="s2">${win(215, 30, 120, 66, "capture", `
          <rect x="8" y="26" width="30" height="20" rx="4" fill="rgba(255,255,255,.14)"/>
          <rect x="42" y="26" width="30" height="20" rx="4" fill="rgba(255,255,255,.14)"/>
          <rect x="76" y="26" width="30" height="20" rx="4" fill="rgba(255,255,255,.14)"/>
          <rect class="scanline" x="8" y="26" width="98" height="2.5" fill="${C.acc2}"/>`)}</g>
        <g class="s3">${win(215, 106, 120, 60, "tokens", `
          <circle cx="18" cy="34" r="7" fill="${C.acc}"/><circle cx="36" cy="34" r="7" fill="${C.acc2}"/><circle cx="54" cy="34" r="7" fill="${C.acc3}"/><circle cx="72" cy="34" r="7" fill="#c9b6f2"/>
          <rect x="12" y="46" width="96" height="5" rx="2.5" fill="rgba(255,255,255,.18)"/>`)}</g>
        ${protoCards(350, 60)}`,
    },
    web: {
      steps: [
        ["Open the site — crawl starts from the URL", "打开网站——从 URL 开始爬取"],
        ["Page graph grows (nav + content edges)", "页面图生长（导航 + 内容边）"],
        ["Every page rebuilt as a view", "每页重建为视图"],
        ["Whole-site prototype, playable offline", "整站原型，离线可玩"],
      ],
      svg: `
        <g class="s1">${win(30, 40, 160, 100, "browser — example.com", `
          <rect x="8" y="26" width="100" height="10" rx="5" fill="rgba(255,255,255,.1)"/>
          <text x="14" y="33.5" font-size="6.5" fill="${C.acc3}">https://example.com</text>
          <rect x="8" y="42" width="144" height="24" rx="6" fill="${C.acc3}" opacity=".25"/>
          <rect x="8" y="70" width="66" height="22" rx="6" fill="rgba(255,255,255,.1)"/>
          <rect x="80" y="70" width="66" height="22" rx="6" fill="rgba(255,255,255,.1)"/>`)}</g>
        <g class="s2"><g stroke="${C.acc2}" stroke-width="1.3" fill="none" class="pulse">
          <path d="M190 80 q30 0 46 -18"/><path d="M190 90 q30 4 46 14"/><path d="M190 100 q34 16 52 34"/></g>
          <circle cx="240" cy="60" r="7" fill="${C.cardD}" stroke="${C.acc2}"/><circle cx="240" cy="104" r="7" fill="${C.cardD}" stroke="${C.acc2}"/><circle cx="246" cy="136" r="7" fill="${C.cardD}" stroke="${C.acc2}"/></g>
        <g class="s3"><rect x="270" y="46" width="52" height="34" rx="6" fill="${C.cardD}" stroke="rgba(255,255,255,.2)"/><rect x="270" y="90" width="52" height="34" rx="6" fill="${C.cardD}" stroke="rgba(255,255,255,.2)"/><rect x="270" y="134" width="52" height="34" rx="6" fill="${C.cardD}" stroke="rgba(255,255,255,.2)"/></g>
        ${protoCards(340, 80)}`,
    },
  };

  function mount(el, sceneKey) {
    const sc = SCENES[sceneKey];
    el.innerHTML = `
      <div class="cap"><span class="captxt"></span>
        <span class="steps"><i></i><i></i><i></i><i></i></span>
        <button class="replay">replay</button></div>
      <div class="svgbox"><svg viewBox="0 0 460 250" data-step="1">${sc.svg}</svg></div>`;
    const svgEl = el.querySelector("svg");
    const cap = el.querySelector(".captxt");
    const dots = [...el.querySelectorAll(".steps i")];
    const lang = () => document.documentElement.lang === "zh-CN" ? 1 : 0;
    let step = 1, timer = null;
    const paint = () => {
      svgEl.setAttribute("data-step", step);
      cap.textContent = `${step}/4 · ${sc.steps[step - 1][lang()]}`;
      dots.forEach((d, i) => d.classList.toggle("on", i < step));
    };
    const play = () => {
      clearInterval(timer);
      step = 1; paint();
      timer = setInterval(() => { if (step < 4) { step++; paint(); } else clearInterval(timer); }, 2100);
    };
    el.querySelector(".replay").onclick = play;
    el._replayLang = () => paint();
    play();
    return el;
  }
  window.DCAnim = { mount, scenes: Object.keys(SCENES) };
})();
