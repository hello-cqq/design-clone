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
      install_label: "Install",
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
      more: "More",
      gal_h: "Gallery", gal_sub: "Community prototypes on GitHub Pages. Search, filter by tag, play, download, remix.",
      gal_search: "search name or tag…", gal_sort_dl: "most downloads", gal_sort_upd: "recently updated",
      proto_dl: "Download offline zip", proto_jump: "source on GitHub", proto_meta: "Details", proto_contrib: "Creator & contributors", proto_spec: "Design specs",
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
      install_label: "安装",
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
      more: "更多",
      gal_h: "画廊", gal_sub: "GitHub Pages 上的社区原型。搜索、按标签筛选、玩、下载、再混。",
      gal_search: "搜索名称或标签…", gal_sort_dl: "最多下载", gal_sort_upd: "最近更新",
      proto_dl: "下载离线 zip", proto_jump: "GitHub 源码", proto_meta: "详情", proto_contrib: "创建者与贡献者", proto_spec: "设计规格",
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
    document.querySelectorAll(".logoimg").forEach((im) => { im.src = state.theme === "dark" ? "assets/logo-boy.png" : "assets/logo-girl.png"; });
    if (window.__identCtrl && window.__identCtrl.swap) window.__identCtrl.swap(state.theme);
    const sf = document.getElementById("stageframe");
    if (sf && sf.contentWindow) { try { sf.contentWindow.postMessage({ type: "dc-theme", theme: state.theme }, "*"); window.__postedTheme = state.theme; } catch {} }
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

  async function clientZip(app) {
    const base = "https://hello-cqq.github.io/design-clone-prototype";
    const list = await (await fetch(`${base}/${app}/files.json`)).json();
    const entries = [];
    for (const f of list) {
      const r = await fetch(`${base}/${app}/${f}`);
      if (!r.ok) continue;
      entries.push({ name: `${app}/${f}`, data: new Uint8Array(await r.arrayBuffer()) });
    }
    const blob = window.DCZip.zipStore(entries);
    const a2 = document.createElement("a");
    a2.href = URL.createObjectURL(blob);
    a2.download = `${app}-prototype.zip`;
    a2.click();
    setTimeout(() => URL.revokeObjectURL(a2.href), 4000);
  }
  function cavHtml(a) {
    const list = (a.contributors || []).slice().sort((x, y) => (x.login === a.creator ? -1 : y.login === a.creator ? 1 : y.commits - x.commits));
    return list.map((c) => {
      const cr = c.login === a.creator ? " creator" : "";
      const ti = c.login + (c.login === a.creator ? " · creator" : "");
      return '<a class="cav' + cr + '" href="https://github.com/' + c.login + '" target="_blank" rel="noopener" title="' + ti + '"><img src="https://github.com/' + c.login + '.png?size=64" alt="' + c.login + '"></a>';
    }).join("");
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
      <div class="th${cover ? "" : " tile"}">${cover ? `<img src="${cover}" alt="" loading="lazy">` : (a.icon ? `<img class="appicon" src="${PROTO_BASE}/${a.icon}" alt="" loading="lazy">` : "")}
        <span class="heat"><svg width="11" height="11" viewBox="0 0 24 24" style="fill:#ff8a5c"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>${fmtHeat(a.downloads)}</span></div>
      <div class="bd"><div class="t"><span class="nm">${name}</span>
        ${a.icon ? `<img class="tic" src="${PROTO_BASE}/${a.icon}" alt="" loading="lazy">` : ""}</div></div></a>`;
  }

  async function renderFeatured() {
    const idx = await loadIndex();
    const boost = (a) => (a.app === "ai-assistant" ? 1e9 : 0) + (a.downloads || 0); // M75-W3: 智能助理置顶精选
    const apps = (idx.apps || []).slice().sort((a, b) => boost(b) - boost(a)).slice(0, 4);
    const el = document.getElementById("featured");
    if (el) el.innerHTML = apps.map(card).join("");
    const sel = document.getElementById("expselect");
    if (sel && !sel.options.length) {
      const apps = idx.apps || [];
      sel.innerHTML = apps.map((a) => `<option value="${a.app}">${L(a.name, a.app)}</option>`).join("");
      if (apps.some((a) => a.app === "ai-assistant")) sel.value = "ai-assistant"; else if (apps.some((a) => a.app === "petpark")) sel.value = "petpark";
      switchExp(sel.value);
    }
  }
  function switchExp(app) {
    const idx = state.index;
    const a = (idx && idx.apps || []).find((x) => x.app === app);
    const fl = document.getElementById("expframe");
    if (fl) fl.src = a ? (isMobile() ? a.url + (a.url.includes("?") ? "&" : "?") + "chrome=0&embed=1&theme=" + state.theme : a.url) : `${PROTO_BASE}/ai-assistant/prototype/`;
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

  const isMobile = () => matchMedia("(max-width: 820px)").matches;
  const protoSrc = (a, theme, pageId) => {
    const base = a.url + (a.url.includes("?") ? "&" : "?");
    if (isMobile()) return base + "chrome=0&embed=1&theme=" + theme + (pageId ? "#pages/" + pageId : "");
    return base + "theme=" + theme;
  };
  async function renderProto() {
    const params = new URLSearchParams(location.search);
    const app = params.get("app");
    const idx = await loadIndex();
    const a = (idx.apps || []).find((x) => x.app === app) || (idx.apps || [])[0];
    const side = document.getElementById("side");
    if (!a || !side) return;
    document.title = `${L(a.name, a.app)} — design-clone gallery`;
    document.getElementById("stageframe").src = protoSrc(a, state.theme);
    const chips = document.getElementById("pagechips");
    if (chips) {
      chips.innerHTML = (a.pages || []).map((p, i) => `<button class="pchip${i === 0 ? " on" : ""}" data-p="${p.id}">${p.name || p.id}</button>`).join("");
      chips.onclick = (e) => {
        const b = e.target.closest(".pchip"); if (!b) return;
        chips.querySelectorAll(".pchip").forEach((x) => x.classList.toggle("on", x === b));
        document.getElementById("stageframe").src = protoSrc(a, state.theme, b.dataset.p);
      };
      chips.style.display = isMobile() && (a.pages || []).length ? "" : "none";
    }
    document.getElementById("jump").href = a.repo_dir;
    const crumb = document.getElementById("crumb");
    if (crumb) crumb.innerHTML = `<a href="gallery.html">${t("nav_gallery")}</a><span>/</span><b>${L(a.name, a.app)}</b>`;
    const rel = `hello-cqq/design-clone-prototype/releases?q=${encodeURIComponent(a.app + "-")}`;

    side.innerHTML = `
      <h1>${a.icon ? `<img src="${PROTO_BASE}/${a.icon}" alt="">` : ""}${L(a.name, a.app)}</h1>
      <div class="desc">${L(a.description)}</div>
      <h4>${t("proto_tags")}</h4>
      <div class="tagrow" style="margin:0">${(a.tags || []).map((x) => `<a class="chip" href="gallery.html?q=${x}">${x}</a>`).join("")}</div>
      <h4>${t("proto_spec")}</h4>
      <div class="specrow" id="specrow" style="display:flex;gap:8px;flex-wrap:wrap;margin:0 0 4px"></div>
      <h4>${t("proto_contrib")}</h4>
      <div class="contrib-avs">${cavHtml(a)}</div>
      <div class="cta"><a class="btn pri dlbtn" id="dlbtn" href="${`https://github.com/hello-cqq/design-clone-prototype/releases/download/${a.app}-${a.version}/${a.app}-${a.version}.zip`}" data-app="${a.app}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12M6 11l6 6 6-6M4 21h16"/></svg>
        ${t("proto_dl")} <span class="cnt">↓ ${fmtHeat(a.downloads)}</span></a></div>
      ${a.brand_disclaimer ? `<div class="footnote">${a.brand_disclaimer}</div>` : ""}`;
    // M62-B(G1)：设计规格入口（pages/*.spec.json + figma-source.json，随原型发布在 Pages）
    (async () => {
      const box = document.getElementById("specrow");
      if (!box) return;
      try {
        const html = await (await fetch(a.url, { cache: "default" })).text();
        const id = ((html.match(/window\.DC = (\{[\s\S]*?\});/) || [])[1] ? JSON.parse(html.match(/window\.DC = (\{[\s\S]*?\});/)[1]).pages[0].id : null);
        if (!id) { box.style.display = "none"; return; }
        box.innerHTML = `<a class="chip" href="${a.url}pages/${id}.spec.json" target="_blank" rel="noopener">pages/${id}.spec.json</a>
          <a class="chip" href="${a.url}design/figma-source.json" target="_blank" rel="noopener">figma-source.json</a>`;
      } catch { box.style.display = "none"; }
    })();
  }

  function wireNav() {
    // M75-W1 艺术字标：主题生图（双联昼/夜）作字形填充——亮=昼半海空、暗=夜半星月，与头像图标同源同主题
    const WORDMARK = `<span class="wordmark" role="img" aria-label="design-clone">design-clone</span>`;
    document.querySelectorAll(".logo").forEach((el) => {
      if (el.querySelector(".wordmark")) return;
      const txt = [...el.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
      if (txt) txt.replaceWith(document.createRange().createContextualFragment(WORDMARK));
    });
    document.querySelectorAll(".ftbrand").forEach((el) => { el.innerHTML = WORDMARK.replace('class="wordmark"', 'class="wordmark wordmark--ft"'); });
    matchMedia("(max-width: 820px)").addEventListener("change", () => { if (document.getElementById("stageframe")) renderProto(); });
    const idn = document.getElementById("ident");
    if (idn && window.DCIdent && window.DCIdent.build) {
      idn.innerHTML = window.DCIdent.build(state.theme);
      window.__identCtrl = window.DCIdent.wire(idn);
    }

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
    const dlb = document.getElementById("dlbtn");
    if (dlb) dlb.addEventListener("click", async (e) => {
      const url = dlb.getAttribute("href");
      try {
        const r = await fetch(url, { method: "HEAD" });
        if (r.ok) return; // 直链可用，放行默认下载
      } catch {}
      e.preventDefault();
      await clientZip(dlb.dataset.app);
    });
    const fsb = document.getElementById("fsbtn");
    if (fsb) fsb.onclick = () => { const f = document.getElementById("stageframe"); if (f.requestFullscreen) f.requestFullscreen(); };
    const code0 = document.getElementById("installcmd");
    const STABLE_CMD = "curl -fsSL https://raw.githubusercontent.com/hello-cqq/design-clone/main/install.sh | bash";
    if (code0) code0.textContent = STABLE_CMD;
    // M62-B(G2, 与 M67 单命令设计共存)：渠道 pill 切换 stable/snapshot + release 徽章
    let relTag = "";
    fetch("data/release.json", { cache: "default" }).then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then((j) => {
      relTag = j.tag_name || "";
      const rb = document.getElementById("relbadge");
      if (rb && relTag) { rb.textContent = (j.prerelease ? "◐ " : "● ") + relTag; rb.style.cursor = "pointer"; rb.onclick = () => { window.open("https://github.com/hello-cqq/design-clone/releases", "_blank"); }; }
    }).catch(() => {});
    const cp = document.getElementById("copycmd");
    if (cp) cp.onclick = () => { navigator.clipboard.writeText(document.getElementById("installcmd").textContent); cp.textContent = "✓"; setTimeout(() => (cp.textContent = "copy"), 1200); };

  });
})();
