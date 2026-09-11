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
      feat_h: "Four ways in", feat_sub: "Pick a source — the skill handles capture, rebuild, gates, and publishing.",
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
      feat_h: "四种入口", feat_sub: "选一种来源——捕获、重建、门禁、发布全由 skill 完成。",
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

  const NINJA = `
  <svg width="34" height="30" viewBox="0 0 44 38" fill="none" aria-hidden="true">
    <g class="ninja-ghost" opacity=".3">
      <g transform="translate(12,2)">
        <circle cx="10" cy="8" r="7" fill="#8b95a3"/>
        <rect x="3.5" y="6" width="13" height="3.4" rx="1.7" fill="#0b0e13"/>
        <circle cx="7.6" cy="7.7" r="1.1" fill="#e8ecf1"/><circle cx="12.4" cy="7.7" r="1.1" fill="#e8ecf1"/>
        <path d="M6 15 q4 -3 8 0 l1.5 8 q-5.5 2.5 -11 0 z" fill="#8b95a3"/>
        <path d="M14 17 l6 -4" stroke="#8b95a3" stroke-width="2.4" stroke-linecap="round"/>
      </g>
    </g>
    <g transform="translate(2,2)">
      <circle cx="10" cy="8" r="7" fill="#39424e"/>
      <rect x="3.5" y="6" width="13" height="3.4" rx="1.7" fill="#0b0e13"/>
      <circle cx="7.6" cy="7.7" r="1.15" fill="#ffd7a8"/><circle cx="12.4" cy="7.7" r="1.15" fill="#ffd7a8"/>
      <path d="M16.5 4.5 l4 -2.4 M16.8 6.4 l4.6 -1" stroke="#ff8a5c" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M6 15 q4 -3 8 0 l1.5 8 q-5.5 2.5 -11 0 z" fill="#39424e"/>
      <path d="M8 18 q2 2 4 0" stroke="#6fd3b2" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M14 17 l5.5 -4.5 M15 19 l6 -2.5" stroke="#39424e" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="20.5" cy="11.6" r="1.7" fill="#39424e"/>
    </g>
  </svg>`;

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
      const r = await fetch(INDEX_LIVE + "?t=" + Date.now(), { cache: "no-store" });
      if (r.ok) { state.index = await r.json(); return state.index; }
    } catch {}
    try { state.index = await (await fetch(INDEX_FALLBACK)).json(); return state.index; } catch {}
    return { version: 3, apps: [] };
  }

  const av = (c, size = 20) => c.login
    ? `<span class="av" style="width:${size}px;height:${size}px" title="${c.name} (@${c.login}) · ${c.commits}"><img src="https://github.com/${c.login}.png?size=48" alt=""></span>`
    : `<span class="av" style="width:${size}px;height:${size}px" title="${c.name} · ${c.commits}">${(c.name || "?").slice(0, 1).toUpperCase()}</span>`;

  function card(a) {
    const cover = a.cover ? `${PROTO_BASE}/${a.cover}` : "";
    const name = L(a.name, a.app);
    const desc = L(a.description, "");
    return `<a class="pcard" href="proto.html?app=${encodeURIComponent(a.app)}">
      <div class="th">${cover ? `<img src="${cover}" alt="" loading="lazy">` : ""}
        <span class="heat"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18M5 10l7-7 7 7"/></svg>${a.downloads || 0}</span></div>
      <div class="bd"><div class="t">${a.icon ? `<img src="${PROTO_BASE}/${a.icon}" alt="">` : ""}${name}</div>
      <div class="d">${desc}</div>
      <div class="m"><span class="avs">${(a.contributors || []).slice(0, 4).map((c) => av(c)).join("")}</span>
      ${(a.tags || []).slice(0, 3).map((x) => `<span class="chip">${x}</span>`).join("")}</div></div></a>`;
  }

  async function renderFeatured() {
    const idx = await loadIndex();
    const apps = (idx.apps || []).slice().sort((a, b) => (b.downloads || 0) - (a.downloads || 0)).slice(0, 4);
    const el = document.getElementById("featured");
    if (el) el.innerHTML = apps.map(card).join("");
    const st = document.getElementById("stats");
    if (st) {
      const dl = (idx.apps || []).reduce((s, a) => s + (a.downloads || 0), 0);
      const nc = new Set((idx.apps || []).flatMap((a) => (a.contributors || []).map((c) => c.name))).size;
      st.innerHTML = `<div class="stat"><b>${(idx.apps || []).length}</b><span>${t("stat_apps")}</span></div>
        <div class="stat"><b>${dl}</b><span>${t("stat_dl")}</span></div>
        <div class="stat"><b>${nc}</b><span>${t("stat_contrib")}</span></div>`;
    }
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
    const rel = `hello-cqq/design-clone-prototype/releases?q=${encodeURIComponent(a.app + "-")}`;
    side.innerHTML = `
      <h1>${a.icon ? `<img src="${PROTO_BASE}/${a.icon}" alt="">` : ""}${L(a.name, a.app)}</h1>
      <div class="desc">${L(a.description)}</div>
      ${a.brand_disclaimer ? `<div class="disc">${a.brand_disclaimer}</div>` : ""}
      <h4>${t("proto_meta")}</h4>
      <div class="kv"><span class="k">${t("proto_ver")}</span><span>v${a.version} · ${a.shell}</span></div>
      <div class="kv"><span class="k">${t("proto_src")}</span><span>${(a.source || {}).kind || ""} · ${(a.source || {}).ref || ""}</span></div>
      <div class="kv"><span class="k">${t("proto_license")}</span><span>${a.license} · ${a.ip_attestation}</span></div>
      <h4>${t("proto_tags")}</h4>
      <div class="tagrow" style="margin:0">${(a.tags || []).map((x) => `<a class="chip" href="gallery.html?q=${x}">${x}</a>`).join("")}</div>
      <h4>${t("proto_contrib")}</h4>
      <div class="contrib">${(a.contributors || []).map((c, i) => `<div class="c">${av(c, 26)}<span class="n">${i === 0 ? "★ " : ""}${c.name}${c.login ? ` <a href="https://github.com/${c.login}">@${c.login}</a>` : ""}<small>${c.commits} commits</small></span></div>`).join("") || "—"}</div>
      <h4>${t("proto_clone")}</h4>
      <div class="cmd">npx skills add ${"hello-cqq/design-clone"} -g && echo "clone ${a.url}"</div>
      <div class="cta"><a class="btn pri dlbtn" href="${rel}" target="_blank" rel="noopener">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12M6 11l6 6 6-6M4 21h16"/></svg>
        ${t("proto_dl")} <span class="cnt">↓ ${a.downloads || 0}</span></a></div>`;
  }

  function wireNav() {
    document.querySelectorAll(".logo").forEach((el) => { el.insertAdjacentHTML("afterbegin", NINJA); });
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
      const r = await fetch(`https://api.github.com/repos/${REPO}`);
      const j = await r.json();
      el.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="color:#ffd166"><path d="M12 3l2.7 5.8 6.3.8-4.6 4.3 1.2 6.1-5.6-3-5.6 3 1.2-6.1L3 9.6l6.3-.8z"/></svg> ${(j.stargazers_count ?? 0) >= 1000 ? ((j.stargazers_count / 1000).toFixed(1) + "k") : (j.stargazers_count ?? 0)}`;
    } catch { el.textContent = "★"; }
  }

  function wireFeatureTabs() {
    const wrap = document.getElementById("ftabs");
    if (!wrap || !window.DCAnim) return;
    const scenes = { a: "mobile", b: "link", c: "desktop", d: "web" };
    wrap.innerHTML = Object.entries(scenes).map(([k], i) => `<button class="ftab${i === 0 ? " on" : ""}" data-s="${k}">${t("f_" + k + "_t")}</button>`).join("");
    const stage = document.getElementById("animstage");
    window.DCAnim.mount(stage, scenes.a);
    const txt0 = document.getElementById("ftext");
    if (txt0) txt0.innerHTML = `<h3>${t("f_a_t")}</h3><p>${t("f_a_d")}</p>`;
    wrap.addEventListener("click", (e) => {
      const b = e.target.closest(".ftab");
      if (!b) return;
      wrap.querySelectorAll(".ftab").forEach((x) => x.classList.toggle("on", x === b));
      const key = b.dataset.s;
      window.DCAnim.mount(stage, scenes[key]);
      const txt = document.getElementById("ftext");
      if (txt) txt.innerHTML = `<h3>${t("f_" + key + "_t")}</h3><p>${t("f_" + key + "_d")}</p>`;
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
