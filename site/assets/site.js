/* design-clone site v2 —— logo(影分身忍者)/nav 光感滑动/star 徽章/i18n(EN 默认+zh)/gallery/详情/精选 */
(() => {
  const INDEX_LIVE = "https://hello-cqq.github.io/design-clone-prototype/index.json";
  const INDEX_FALLBACK = "data/index.fallback.json";
  const PROTO_BASE = "https://hello-cqq.github.io/design-clone-prototype";
  const REPO = "hello-cqq/design-clone";

  const I18N = {
    en: {
      nav_home: "Home", nav_gallery: "Gallery",
      kick: "Agent Skill · MIT · opencode / claude code / codex",
      h1a: "Clone any app into", h1b: "a playable prototype.",
      lead: "One sentence: design-clone captures real apps, sites, or shared links and rebuilds them as fully interactive prototypes — with design specs your team can ship.",
      install_label: "Copy → paste into your agent:",
      cta_gallery: "Browse gallery", cta_gh: "GitHub", cta_publish: "Publish yours",
      exp_title: "Try it live", exp_note: "hosted on GitHub Pages · tap, play, export",
      feat_h: "Feature demos", feat_sub: "Four sources, one workflow — watch each 4-step story.",
      f_a_t: "Mobile GUI capture", f_a_d: "adb/scrcpy mirror captures every screen and gesture of a phone app, then rebuilds it as a playable mobile prototype.",
      f_a_1: "Phone app runs — pages, gestures, tokens observed", f_a_2: "GUI mirror capture (adb/scrcpy) frames every screen", f_a_3: "Frames + UI tree feed the spec-driven generator", f_a_4: "Playable prototype assembled — gates green",
      f_b_t: "Douyin / RED links", f_b_d: "Share a Douyin or Xiaohongshu link: the skill parses the video/note frames and rebuilds the experience as a prototype.",
      f_c_t: "Desktop GUI capture", f_c_d: "macOS/Windows desktop apps captured state-by-state (windows, panels, flows) into desktop-faithful prototypes.",
      f_c_1: "Desktop app operates — windows, panels, flows", f_c_2: "Screen capture snapshots each state", f_c_3: "Tokens & layout extracted from computed styles", f_c_4: "Desktop-faithful prototype assembled",
      f_d_t: "Website links", f_d_d: "Paste any site URL: crawl the page graph, rebuild every page as a view, ship a whole-site playable prototype.",
      f_d_1: "Open the site — crawl starts from the URL", f_d_2: "Page graph grows (nav + content edges)", f_d_3: "Every page rebuilt as a view", f_d_4: "Whole-site prototype, playable offline",
      f_b_1: "Scroll the Douyin / RED note or video", f_b_2: "Share → copy link", f_b_3: "Paste the link into your agent", f_b_4: "Frames parsed → prototype generated",
      top_h: "Top prototypes", top_sub: "Ranked by downloads — every card is playable and downloadable.",
      more: "More → full gallery",
      gal_h: "Gallery", gal_sub: "Community prototypes on GitHub Pages. Search, filter by tag, play, download, remix.",
      gal_search: "search name or tag…", gal_sort_dl: "most downloads", gal_sort_upd: "recently updated",
      proto_dl: "Download offline zip", proto_jump: "source on GitHub", proto_meta: "Details", proto_contrib: "Creator & contributors",
      proto_tags: "Tags", proto_ver: "Version", proto_license: "License", proto_src: "Source", proto_clone: "Clone & remix",
      stat_apps: "prototypes", stat_dl: "total downloads", stat_contrib: "contributors",
      ft_note: "MIT · prototypes carry their own license · brand replicas are unofficial study works",
      empty: "No prototypes yet — be the first:",
    },
    zh: {
      nav_home: "首页", nav_gallery: "画廊",
      kick: "Agent Skill · MIT · opencode / claude code / codex",
      h1a: "把任意应用克隆成", h1b: "可玩的原型。",
      lead: "一句话：design-clone 捕获真实 App、网站或分享链接，重建为完全可交互的原型——并附上团队可直接开工的设计规格。",
      install_label: "复制 → 粘贴进你的 agent：",
      cta_gallery: "浏览画廊", cta_gh: "GitHub", cta_publish: "发布你的原型",
      exp_title: "在线体验", exp_note: "GitHub Pages 托管 · 可点可玩可导出",
      feat_h: "功能演示", feat_sub: "四种来源、同一条工作流——看四步演示。",
      f_a_t: "手机 GUI 抓取", f_a_d: "adb/scrcpy 镜像逐屏捕获手机应用的页面与手势，重建为可玩移动原型。",
      f_a_1: "手机 App 运行——采集页面、手势与 tokens", f_a_2: "GUI 镜像抓取（adb/scrcpy）逐屏截帧", f_a_3: "帧 + UI 树喂给规格驱动生成器", f_a_4: "可玩原型组装完成——门禁全绿",
      f_b_t: "抖音 / 小红书链接", f_b_d: "分享抖音或小红书链接：解析视频/图文帧，把体验重建为原型。",
      f_c_t: "桌面 GUI 抓取", f_c_d: "macOS/Windows 桌面应用逐状态捕获（窗口、面板、流程），生成桌面保真原型。",
      f_c_1: "桌面应用操作——窗口、面板、流程", f_c_2: "屏幕捕获逐状态快照", f_c_3: "从 computed 样式抽取 tokens 与布局", f_c_4: "组装桌面保真原型",
      f_d_t: "网站链接", f_d_d: "粘贴任意网址：爬取页面图，每页重建为视图，交付整站可玩原型。",
      f_d_1: "打开网站——从 URL 开始爬取", f_d_2: "页面图生长（导航 + 内容边）", f_d_3: "每页重建为视图", f_d_4: "整站原型，离线可玩",
      f_b_1: "刷抖音 / 小红书视频或图文", f_b_2: "分享 → 复制链接", f_b_3: "把链接粘贴进 Agent", f_b_4: "解析帧 → 生成原型",
      top_h: "精选原型", top_sub: "按下载量排序——每张卡都可玩可下载。",
      more: "更多 → 完整画廊",
      gal_h: "画廊", gal_sub: "GitHub Pages 上的社区原型。搜索、按标签筛选、玩、下载、再混。",
      gal_search: "搜索名称或标签…", gal_sort_dl: "最多下载", gal_sort_upd: "最近更新",
      proto_dl: "下载离线 zip", proto_jump: "GitHub 源码", proto_meta: "详情", proto_contrib: "创建者与贡献者",
      proto_tags: "标签", proto_ver: "版本", proto_license: "许可", proto_src: "来源", proto_clone: "克隆并再混",
      stat_apps: "原型", stat_dl: "总下载", stat_contrib: "贡献者",
      ft_note: "MIT · 原型各自携带许可 · 品牌复刻为非官方学习作品",
      empty: "暂无原型——成为第一个：",
    },
  };

;

  const state = {
    lang: localStorage.getItem("dc-lang") || "en",
    theme: localStorage.getItem("dc-theme") || "dark",
    index: null,
  };
  const t = (k) => (I18N[state.lang] || I18N.en)[k] ?? I18N.en[k] ?? k;
  const L = (obj, fallback = "") => {
    if (!obj) return fallback;
    if (typeof obj === "string") return obj;
    return obj[state.lang === "zh" ? "zh" : "en"] || obj.en || obj.zh || fallback;
  };

  function applyI18n() {
    document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
    document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
    const lb = document.getElementById("langbtn");
    if (lb) lb.textContent = state.lang === "en" ? "中文" : "EN";
    const cap = document.querySelector(".animstage");
    if (cap && cap._replayLang) cap._replayLang();
    if (document.getElementById("cards")) renderGallery();
    if (document.getElementById("side")) renderProto();
    if (document.getElementById("featured")) renderFeatured();
  }
  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
    const tb = document.getElementById("themebtn");
    if (tb) tb.innerHTML = state.theme === "dark"
      ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>'
      : '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  }

  async function loadIndex() {
    if (state.index) return state.index;
    try {
      const r = await fetch(INDEX_LIVE, { cache: "default" });
      if (r.ok) { state.index = await r.json(); return state.index; }
    } catch {}
    try { state.index = await (await fetch(INDEX_FALLBACK)).json(); return state.index; } catch {}
    return { version: 3, apps: [] };
  }

  const fmtHeat = (n) => {
    n = n || 0;
    if (n >= 10000) { const w = n / 10000; return (w >= 10 ? Math.floor(w) : Math.round(w * 10) / 10) + "w+"; }
    if (n >= 1000) { const k = n / 1000; return (k >= 10 ? Math.floor(k) : Math.round(k * 10) / 10) + "k+"; }
    return String(n);
  };
  const av = (c, size = 20) => (c.login && !c.login.includes("["))
    ? `<span class="av" style="width:${size}px;height:${size}px" title="${c.name} (@${c.login}) · ${c.commits}"><img src="https://github.com/${c.login}.png?size=48" alt=""></span>`
    : `<span class="av" style="width:${size}px;height:${size}px" title="${c.name} · ${c.commits}">${(c.name || "?").slice(0, 1).toUpperCase()}</span>`;

  function card(a) {
    const cover = a.cover ? `${PROTO_BASE}/${a.cover}` : "";
    const name = L(a.name, a.app);
    return `<a class="pcard" href="proto.html?app=${encodeURIComponent(a.app)}">
      <div class="th">${cover ? `<img src="${cover}" alt="" loading="lazy">` : ""}
        <span class="heat"><svg width="11" height="11" viewBox="0 0 24 24" style="fill:#ff8a5c"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>${fmtHeat(a.downloads)}</span></div>
      <div class="bd"><div class="t"><span class="nm">${name}</span>
        <span class="avs">${(a.contributors || []).slice(0, 3).map((c) => av(c)).join("")}${(a.contributors || []).length > 3 ? `<span class="av">+${(a.contributors || []).length - 3}</span>` : ""}</span></div></div></a>`;
  }

  async function renderFeatured() {
    const idx = await loadIndex();
    const apps = (idx.apps || []).slice().sort((a, b) => (b.downloads || 0) - (a.downloads || 0)).slice(0, 4);
    const el = document.getElementById("featured");
    if (el) el.innerHTML = apps.map(card).join("");
    const sel = document.getElementById("expselect");
    if (sel && !sel.options.length) {
      const apps = idx.apps || [];
      sel.innerHTML = apps.map((a) => `<option value="${a.app}">${L(a.name, a.app)}</option>`).join("");
      if (apps.some((a) => a.app === "petpark")) sel.value = "petpark";
      switchExp(sel.value);
    }
  }
  function switchExp(app) {
    const idx = state.index;
    const a = (idx && idx.apps || []).find((x) => x.app === app);
    const fl = document.getElementById("expframe");
    if (fl) fl.src = a ? a.url : `${PROTO_BASE}/petpark/prototype/`;
  }

  async function renderGallery() {
    const idx = await loadIndex();
    const grid = document.getElementById("cards");
    if (!grid) return;
    const q = (document.getElementById("q") || {}).value || "";
    const sort = (document.getElementById("sort") || {}).value || "dl";
    const tagOn = (document.querySelector(".tagbtn.on") || {}).dataset?.tag || "";
    let apps = idx.apps || [];
    if (tagOn) apps = apps.filter((a) => (a.tags || []).includes(tagOn));
    if (q) apps = apps.filter((a) => (L(a.name, a.app) + " " + a.app + " " + (a.tags || []).join(" ") + " " + L(a.description)).toLowerCase().includes(q.toLowerCase()));
    apps = apps.slice().sort((x, y) => sort === "upd"
      ? String(y.updated || "").localeCompare(String(x.updated || ""))
      : (y.downloads || 0) - (x.downloads || 0));
    const tags = [...new Set((idx.apps || []).flatMap((a) => a.tags || []))];
    const tr = document.getElementById("tagrow");
    if (tr) tr.innerHTML = tags.map((x) => `<button class="tagbtn${x === tagOn ? " on" : ""}" data-tag="${x}">${x}</button>`).join("");
    grid.innerHTML = apps.map(card).join("") || `<p style="color:var(--mut)">${t("empty")} <a href="guide.html#publish">publish</a></p>`;
  }

  async function renderProto() {
    const params = new URLSearchParams(location.search);
    const app = params.get("app");
    const idx = await loadIndex();
    const a = (idx.apps || []).find((x) => x.app === app) || (idx.apps || [])[0];
    const side = document.getElementById("side");
    if (!a || !side) return;
    document.title = `${L(a.name, a.app)} — design-clone gallery`;
    document.getElementById("stageframe").src = a.url;
    document.getElementById("jump").href = a.repo_dir;
    const crumb = document.getElementById("crumb");
    if (crumb) crumb.innerHTML = `<a href="gallery.html">${t("nav_gallery")}</a><span>/</span><b>${L(a.name, a.app)}</b>`;
    const rel = `hello-cqq/design-clone-prototype/releases?q=${encodeURIComponent(a.app + "-")}`;
    side.innerHTML = `
      <h1>${a.icon ? `<img src="${PROTO_BASE}/${a.icon}" alt="">` : ""}${L(a.name, a.app)}</h1>
      <div class="desc">${L(a.description)}</div>
      <h4>${t("proto_tags")}</h4>
      <div class="tagrow" style="margin:0">${(a.tags || []).map((x) => `<a class="chip" href="gallery.html?q=${x}">${x}</a>`).join("")}</div>
      <h4>${t("proto_contrib")}</h4>
      <div class="contrib">${(a.contributors || []).map((c, i2) => `<div class="c">${av(c, 26)}<span class="n">${i2 === 0 ? "★ " : ""}${c.name}${c.login ? ` <a href="https://github.com/${c.login}">@${c.login}</a>` : ""}<small>${c.commits} commits</small></span></div>`).join("") || "—"}</div>
      <div class="cta"><a class="btn pri dlbtn" href="${rel}" target="_blank" rel="noopener">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12M6 11l6 6 6-6M4 21h16"/></svg>
        ${t("proto_dl")} <span class="cnt">↓ ${fmtHeat(a.downloads)}</span></a></div>
      ${a.brand_disclaimer ? `<div class="footnote">${a.brand_disclaimer}</div>` : ""}`;
  }

  function wireNav() {
    document.querySelectorAll(".logo").forEach((el) => { el.insertAdjacentHTML("afterbegin", '<img class="logoimg" src="assets/logo-head.svg" alt="" width="34" height="34">'); });
    const hs = document.getElementById("heroscene");
    if (hs && window.DCScene) hs.innerHTML = window.DCScene;

    const nw = document.querySelector(".navwrap");
    if (!nw) return;
    const pill = document.createElement("span");
    pill.className = "glowpill";
    nw.prepend(pill);
    const move = () => {
      const on = nw.querySelector("a.on") || nw.querySelector("a");
      if (!on) return;
      pill.style.left = on.offsetLeft + "px";
      pill.style.width = on.offsetWidth + "px";
    };
    nw.querySelectorAll("a").forEach((a) => a.addEventListener("mouseenter", () => {
      pill.style.left = a.offsetLeft + "px"; pill.style.width = a.offsetWidth + "px";
    }));
    nw.addEventListener("mouseleave", move);
    window.addEventListener("resize", move);
    setTimeout(move, 30);
  }

  async function wireStars() {
    const el = document.getElementById("starbadge");
    if (!el) return;
    try {
      let j = null;
      try { j = await (await fetch("data/stars.json", { cache: "default" })).json(); } catch {}
      if (!j || j.stars == null) { const r = await fetch(`https://api.github.com/repos/${REPO}`); j = { stars: (await r.json()).stargazers_count }; }
      el.textContent = "★ " + ((j.stars ?? 0) >= 1000 ? ((j.stars / 1000).toFixed(1) + "k") : (j.stars ?? 0));
    } catch { el.textContent = "★"; }
  }

  function wireFeatureTabs() {
    const wrap = document.getElementById("ftabs");
    if (!wrap || !window.DCAnim) return;
    const scenes = { a: "mobile", b: "link", c: "desktop", d: "web" };
    wrap.innerHTML = Object.entries(scenes).map(([k], i) => `<button class="ftab${i === 0 ? " on" : ""}" data-s="${k}">${t("f_" + k + "_t")}</button>`).join("");
    const stage = document.getElementById("animstage");
    window.DCAnim.mount(stage, scenes.a);
    wrap.addEventListener("click", (e) => {
      const b = e.target.closest(".ftab");
      if (!b) return;
      wrap.querySelectorAll(".ftab").forEach((x) => x.classList.toggle("on", x === b));
      const key = b.dataset.s;
      window.DCAnim.mount(stage, scenes[key]);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyTheme(); applyI18n(); wireNav(); wireStars(); wireFeatureTabs();
    const lb = document.getElementById("langbtn");
    if (lb) lb.onclick = () => { state.lang = state.lang === "en" ? "zh" : "en"; localStorage.setItem("dc-lang", state.lang); applyI18n(); wireFeatureTabs(); };
    const tb = document.getElementById("themebtn");
    if (tb) tb.onclick = () => { state.theme = state.theme === "dark" ? "light" : "dark"; localStorage.setItem("dc-theme", state.theme); applyTheme(); };
    const sel = document.getElementById("expselect");
    if (sel) sel.onchange = () => switchExp(sel.value);
    if (document.getElementById("cards")) {
      renderGallery();
      const q = document.getElementById("q"); if (q) q.addEventListener("input", renderGallery);
      const so = document.getElementById("sort"); if (so) so.addEventListener("change", renderGallery);
      document.addEventListener("click", (e) => { const b = e.target.closest(".tagbtn"); if (b) { b.classList.toggle("on"); document.querySelectorAll(".tagbtn").forEach((x) => { if (x !== b) x.classList.remove("on"); }); renderGallery(); } });
    }
    if (document.getElementById("featured")) renderFeatured();
    if (document.getElementById("side")) renderProto();
    const sf = document.getElementById("stagefail");
    const sfr = document.getElementById("stageretry");
    const frame = document.getElementById("stageframe");
    if (sf && sfr && frame) {
      let loaded = false, t = null;
      const arm = () => { loaded = false; sf.classList.add("hidden"); clearTimeout(t); t = setTimeout(() => { if (!loaded) sf.classList.remove("hidden"); }, 9000); };
      frame.addEventListener("load", () => { loaded = true; sf.classList.add("hidden"); });
      sfr.onclick = () => { const src = frame.src; frame.src = ""; frame.src = src + (src.includes("?") ? "&" : "?") + "r=" + Date.now(); arm(); };
      new MutationObserver(() => arm()).observe(frame, { attributes: true, attributeFilter: ["src"] });
    }
    const fsb = document.getElementById("fsbtn");
    if (fsb) fsb.onclick = () => { const f = document.getElementById("stageframe"); if (f.requestFullscreen) f.requestFullscreen(); };
    const cp = document.getElementById("copycmd");
    if (cp) cp.onclick = () => { navigator.clipboard.writeText(document.getElementById("installcmd").textContent); cp.textContent = "✓"; setTimeout(() => (cp.textContent = "copy"), 1200); };
    const AG = {
      opencode: "curl -fsSL https://raw.githubusercontent.com/hello-cqq/design-clone/main/install.sh | bash -s -- --agent opencode",
      claude: "curl -fsSL https://raw.githubusercontent.com/hello-cqq/design-clone/main/install.sh | bash -s -- --agent claude",
      codex: "curl -fsSL https://raw.githubusercontent.com/hello-cqq/design-clone/main/install.sh | bash -s -- --agent codex",
      npx: "npx skills add hello-cqq/design-clone -g",
    };
    const box = document.getElementById("agentswitch");
    const code = document.getElementById("installcmd");
    if (box && code) {
      const set = (k) => { code.textContent = AG[k]; box.querySelectorAll(".agentbtn").forEach((b) => b.classList.toggle("on", b.dataset.a === k)); };
      box.innerHTML = Object.keys(AG).map((k) => `<button class="agentbtn" data-a="${k}">${k}</button>`).join("");
      box.addEventListener("click", (e) => { const b = e.target.closest(".agentbtn"); if (b) set(b.dataset.a); });
      set("opencode");
    }
  });
})();
