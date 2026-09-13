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

  const SCENES = {
    mobile: {
      steps: [
        ["Phone app runs — chat list scrolls, tokens observed", "手机 App 运行——会话列表滚动，采集 tokens"],
        ["adb/scrcpy mirror captures each screen (frame flash)", "adb/scrcpy 镜像逐屏捕获（截帧闪光）"],
        ["Frames + UI tree feed the agent generator", "帧 + UI 树喂给 agent 生成器"],
        ["Playable prototype assembled — gates green", "可玩原型组装完成——门禁全绿"],
      ],
      svg: `
      <defs><clipPath id="dcm"><rect x="46" y="26" width="138" height="238" rx="16"/></clipPath><clipPath id="dcm2"><rect x="300" y="60" width="112" height="192" rx="10"/></clipPath></defs>
      <g class="s1">
        <rect x="40" y="20" width="150" height="250" rx="24" fill="#101820"/>
        <image href="assets/demo/mobile.png" x="46" y="26" width="138" height="238" clip-path="url(#dcm)" preserveAspectRatio="xMidYMin slice"/>
        <rect x="250" y="40" width="212" height="212" rx="12" fill="#161d26"/>
        <circle cx="264" cy="52" r="3.4" fill="#ff5f57"/><circle cx="276" cy="52" r="3.4" fill="#febc2e"/><circle cx="288" cy="52" r="3.4" fill="#28c840"/>
        <text x="356" y="55" text-anchor="middle" font-size="7" fill="#8fa3b8">scrcpy · mirror</text>
        <image href="assets/demo/mobile.png" x="300" y="60" width="112" height="192" clip-path="url(#dcm2)" preserveAspectRatio="xMidYMin slice" opacity=".92"/>
      </g>
      <g class="s2"><rect x="46" y="120" width="138" height="3" fill="#6ee7ff" opacity=".85"/><rect x="40" y="20" width="150" height="250" rx="24" fill="none" stroke="#6ee7ff" stroke-width="1.4" opacity=".8"/></g>
      <g class="s3"><path d="M196 140 C 240 140 250 170 292 170" stroke="#ffd66b" stroke-width="1.6" fill="none" stroke-dasharray="4 3"/><rect x="292" y="150" width="150" height="26" rx="13" fill="#12333f"/><text x="367" y="166" text-anchor="middle" font-size="8" fill="#9fe8d2">frames + ui-tree → spec</text></g>
      <g class="s4"><rect x="300" y="216" width="120" height="26" rx="13" fill="#3fb899"/><text x="360" y="232" text-anchor="middle" font-size="9" fill="#06303a" font-weight="700">playable ✓</text><circle cx="115" cy="150" r="16" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/></g>
      
      `,
    },
    link: {
      steps: [
        ["Scroll the Douyin feed — like, comment, share rail", "刷抖音视频流——点赞/评论/分享侧栏"],
        ["Share sheet → tap “copy link”", "分享面板 → 点“复制链接”"],
        ["Paste into agent — it parses frames & notes", "粘贴进 agent——解析帧与图文"],
        ["Note rebuilt as a playable prototype", "笔记重建为可玩原型"],
      ],
      svg: `
      <defs><clipPath id="dcl"><rect x="66" y="46" width="138" height="222" rx="14"/></clipPath></defs>
      <g class="s1">
        <rect x="150" y="18" width="300" height="26" rx="13" fill="#161d26"/><text x="168" y="35" font-size="8" fill="#8fa3b8">https://v.douyin.com/…  (shared link)</text>
        <rect x="60" y="40" width="150" height="234" rx="20" fill="#101820"/>
        <image href="assets/demo/link.png" x="66" y="46" width="138" height="222" clip-path="url(#dcl)" preserveAspectRatio="xMidYMin slice"/>
        <rect x="250" y="70" width="200" height="170" rx="12" fill="#161d26"/>
        <text x="266" y="92" font-size="8" fill="#8fa3b8">link parser</text>
        <rect x="266" y="104" width="168" height="8" rx="4" fill="#2a3644"/><rect x="266" y="120" width="140" height="8" rx="4" fill="#2a3644"/><rect x="266" y="136" width="152" height="8" rx="4" fill="#2a3644"/>
        <image href="assets/demo/link.png" x="266" y="152" width="76" height="72" preserveAspectRatio="xMidYMin slice" opacity=".9"/>
      </g>
      <g class="s2"><rect x="66" y="140" width="138" height="3" fill="#6ee7ff" opacity=".85"/><rect x="60" y="40" width="150" height="234" rx="20" fill="none" stroke="#6ee7ff" stroke-width="1.4" opacity=".8"/></g>
      <g class="s3"><path d="M212 160 C 236 160 240 180 262 180" stroke="#ffd66b" stroke-width="1.6" fill="none" stroke-dasharray="4 3"/><rect x="262" y="168" width="150" height="26" rx="13" fill="#12333f"/><text x="337" y="184" text-anchor="middle" font-size="8" fill="#9fe8d2">content → views spec</text></g>
      <g class="s4"><rect x="300" y="216" width="120" height="26" rx="13" fill="#3fb899"/><text x="360" y="232" text-anchor="middle" font-size="9" fill="#06303a" font-weight="700">playable ✓</text><circle cx="135" cy="160" r="16" fill="none" stroke="#fff" stroke-width="2" opacity=".8"/></g>
      
      `,
    },
    desktop: {
      steps: [
        ["Desktop app operates — sidebar, panels, clicks", "桌面应用操作——侧栏、面板、点击"],
        ["Screen capture snapshots each state (flash)", "屏幕捕获逐状态快照（闪光）"],
        ["Tokens & layout extracted from computed styles", "从 computed 样式抽取 tokens 与布局"],
        ["Desktop-faithful prototype assembled", "组装桌面保真原型"],
      ],
      svg: `
      <defs><clipPath id="dcd"><rect x="70" y="58" width="380" height="196" rx="6"/></clipPath></defs>
      <g class="s1">
        <rect x="60" y="34" width="400" height="230" rx="12" fill="#161d26"/>
        <circle cx="76" cy="46" r="3.6" fill="#ff5f57"/><circle cx="89" cy="46" r="3.6" fill="#febc2e"/><circle cx="102" cy="46" r="3.6" fill="#28c840"/>
        <rect x="60" y="52" width="400" height="6" fill="#0d141c"/>
        <image href="assets/demo/desktop.png" x="70" y="58" width="380" height="196" clip-path="url(#dcd)"/>
        <rect x="150" y="252" width="220" height="10" rx="5" fill="#0d141c"/>
        <g fill="#2a3644"><rect x="170" y="254" width="7" height="7" rx="2"/><rect x="190" y="254" width="7" height="7" rx="2"/><rect x="210" y="254" width="7" height="7" rx="2"/><rect x="230" y="254" width="7" height="7" rx="2"/><rect x="250" y="254" width="7" height="7" rx="2"/></g>
      </g>
      <g class="s2"><rect x="70" y="140" width="380" height="3" fill="#6ee7ff" opacity=".8"/><rect x="60" y="34" width="400" height="230" rx="12" fill="none" stroke="#6ee7ff" stroke-width="1.4" opacity=".7"/></g>
      <g class="s3"><rect x="330" y="90" width="120" height="24" rx="12" fill="#12333f"/><text x="390" y="105" text-anchor="middle" font-size="8" fill="#9fe8d2">AX tree → spec</text></g>
      <g class="s4"><rect x="330" y="216" width="120" height="26" rx="13" fill="#3fb899"/><text x="390" y="232" text-anchor="middle" font-size="9" fill="#06303a" font-weight="700">playable ✓</text></g>
      
      `,
    },
    web: {
      steps: [
        ["Type the URL — crawl starts", "输入网址——开始爬取"],
        ["Page graph grows: nav + content edges", "页面图生长：导航 + 内容边"],
        ["Every page rebuilt as a view", "每页重建为视图"],
        ["Whole-site prototype, playable offline", "整站原型，离线可玩"],
      ],
      svg: `
      <defs><clipPath id="dcw"><rect x="70" y="64" width="380" height="190" rx="4"/></clipPath></defs>
      <g class="s1">
        <rect x="60" y="34" width="400" height="230" rx="12" fill="#ffffff" stroke="#d7e3ea"/>
        <rect x="60" y="34" width="400" height="24" rx="12" fill="#eef4f8"/>
        <rect x="72" y="40" width="86" height="13" rx="6.5" fill="#ffffff" stroke="#d7e3ea"/><rect x="164" y="40" width="86" height="13" rx="6.5" fill="#f6fafc" stroke="#e2ecf2"/>
        <rect x="70" y="58" width="380" height="6" fill="#f2f7fa"/>
        <image href="assets/demo/web.png" x="70" y="64" width="380" height="190" clip-path="url(#dcw)"/>
      </g>
      <g class="s2"><rect x="70" y="150" width="380" height="3" fill="#12a8c4" opacity=".7"/><rect x="60" y="34" width="400" height="230" rx="12" fill="none" stroke="#12a8c4" stroke-width="1.4" opacity=".7"/></g>
      <g class="s3"><rect x="330" y="92" width="120" height="24" rx="12" fill="#12333f"/><text x="390" y="107" text-anchor="middle" font-size="8" fill="#9fe8d2">DOM → spec</text></g>
      <g class="s4"><rect x="330" y="216" width="120" height="26" rx="13" fill="#3fb899"/><text x="390" y="232" text-anchor="middle" font-size="9" fill="#06303a" font-weight="700">playable ✓</text></g>
      
      `,
    },
  };

  function mount(el, sceneKey) {
    const sc = SCENES[sceneKey];
    el.innerHTML = `
      <div class="cap"><span class="captxt"></span>
        <span class="steps">${[1, 2, 3, 4].map((n) => `<b data-s="${n}">${n}</b>`).join("")}</span>
        <button class="replay">replay</button></div>
      <div class="svgbox"><svg viewBox="0 0 520 290" data-step="1">${sc.svg}</svg></div>`;
    const svgEl = el.querySelector("svg");
    const cap = el.querySelector(".captxt");
    const dots = [...el.querySelectorAll(".steps b")];
    const lang = () => (document.documentElement.lang === "zh-CN" ? 1 : 0);
    let step = 1, timer = null;
    const paint = () => {
      svgEl.setAttribute("data-step", step);
      cap.textContent = `${step}/4 · ${sc.steps[step - 1][lang()]}`;
      dots.forEach((d, i) => { d.classList.toggle("on", i + 1 === step); d.classList.toggle("done", i + 1 < step); });
    };
    const play = () => {
      clearInterval(timer);
      step = 1; paint();
      timer = setInterval(() => { if (step < 4) { step++; paint(); } else clearInterval(timer); }, 2400);
    };
    dots.forEach((d) => (d.onclick = () => { clearInterval(timer); step = +d.dataset.s; paint(); timer = setInterval(() => { if (step < 4) { step++; paint(); } else clearInterval(timer); }, 2400); }));
    el.querySelector(".replay").onclick = play;
    el._replayLang = () => paint();
    play();
    return el;
  }
  window.DCAnim = { mount, scenes: Object.keys(SCENES) };
})();
