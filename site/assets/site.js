/* design-clone site — i18n (EN default + zh), gallery + proto detail rendering, zero deps */
(() => {
  const INDEX_LIVE = "https://hello-cqq.github.io/design-clone-prototype/index.json";
  const INDEX_FALLBACK = "data/index.fallback.json";
  const PROTO_BASE = "https://hello-cqq.github.io/design-clone-prototype";

  const I18N = {
    en: {
      nav_home: "Home", nav_gallery: "Gallery", nav_guide: "Guide", nav_start: "Install", nav_github: "GitHub",
      kick: "Agent Skill · MIT · runs in opencode / claude code / codex",
      h1a: "Clone any app into", h1b: "a playable prototype.",
      lead: "design-clone captures real apps, sites, or videos and rebuilds them as fully interactive local web prototypes — pages, journeys, design tokens, and exportable Figma-grade specs. Then share them on the open gallery.",
      install_label: "One command, your agent:",
      cta_gallery: "Explore prototypes", cta_gh: "GitHub", cta_publish: "Publish yours",
      proof_title: "Live proof — petpark, a 2.5D clay-style pet park app (community seed)",
      proof_note: "served straight from GitHub Pages · tap around, play journeys, export design assets",
      stat_apps: "prototype apps", stat_flavors: "flavors (mobile/tablet/desktop/web)", stat_contrib: "contributors",
      feat_h: "What the skill does", feat_sub: "Five capabilities, one workflow, gated end-to-end.",
      f1t: "Capture anything", f1d: "Android via adb/scrcpy, web via crawl, video/link frames — with UI trees, tokens, and journey graphs.",
      f2t: "Rebuild playable", f2d: "Static HTML prototypes with an inspector shell: scene tree, path mode, play, compare, annotations.",
      f3t: "Design artifacts", f3d: "Per-page product spec JSON + Figma-source (variables, frames, nodes) generated at build time, re-exported after edits.",
      f4t: "Gated quality", f4d: "Dead-control, parity, privacy, typography, and paste-screenshot gates — red means not shippable.",
      f5t: "Publish & remix", f5d: "One command opens a PR to the community gallery; every prototype stays remixable.",
      f6t: "Zero server", f6d: "Prototypes are fully offline static bundles — GitHub Pages hosts them as live apps.",
      gal_h: "Community gallery", gal_sub: "Every card is a real, playable prototype hosted on GitHub Pages.",
      gal_search: "search app or tag…", gal_sort_upd: "recently updated", gal_sort_com: "most commits", gal_all: "all forms",
      proto_open: "Open fullscreen", proto_flavors: "Flavors", proto_meta: "Meta", proto_contrib: "Contributors",
      proto_src: "Source", proto_license: "License", proto_ver: "Version", proto_clone: "Clone & remix this",
      proto_fix: "Suggest a fix (PR)", proto_dl: "Download offline zip",
      guide_h: "Guide", start_h: "Install in one command",
      ft_note: "MIT · prototypes carry their own license · brand replicas are unofficial study works",
    },
    zh: {
      nav_home: "首页", nav_gallery: "画廊", nav_guide: "指南", nav_start: "安装", nav_github: "GitHub",
      kick: "Agent Skill · MIT · 可跑在 opencode / claude code / codex",
      h1a: "把任意应用克隆成", h1b: "可玩的原型。",
      lead: "design-clone 捕获真实 App、网站或视频，重建为完全可交互的本地 Web 原型——页面、交互路径、设计 tokens 与可导出的 Figma 级规格；并发布到开放画廊共创。",
      install_label: "一条命令，进你的 agent：",
      cta_gallery: "浏览原型", cta_gh: "GitHub", cta_publish: "发布你的原型",
      proof_title: "Live proof —— petpark：2.5D 粘土风宠物乐园（社区种子）",
      proof_note: "直接由 GitHub Pages 托管 · 可点可玩可演播可导出设计资产",
      stat_apps: "原型应用", stat_flavors: "变体（手机/平板/桌面/网页）", stat_contrib: "贡献者",
      feat_h: "skill 能力", feat_sub: "五大能力、一条工作流、端到端门禁。",
      f1t: "捕获一切", f1d: "Android 走 adb/scrcpy、网页走爬取、视频/链接走帧——带 UI 树、tokens 与旅程图。",
      f2t: "重建可玩", f2d: "静态 HTML 原型 + inspector 外壳：场景树、路径模式、播放、对照、标注。",
      f3t: "设计资产", f3d: "每页产品规格 JSON + Figma 源（variables/frames/nodes）生成期即有，编辑后可重导出。",
      f4t: "门禁质量", f4d: "死控件、保真、隐私、排版、贴图门——红即不可交付。",
      f5t: "发布与再混", f5d: "一条命令向社区画廊提 PR；每个原型都可被再混。",
      f6t: "零服务器", f6d: "原型是全离线静态包——GitHub Pages 即活应用托管。",
      gal_h: "社区画廊", gal_sub: "每张卡都是 GitHub Pages 上真实可玩的原型。",
      gal_search: "搜索应用或标签…", gal_sort_upd: "最近更新", gal_sort_com: "最多提交", gal_all: "全部形态",
      proto_open: "全屏打开", proto_flavors: "变体", proto_meta: "信息", proto_contrib: "贡献者",
      proto_src: "来源", proto_license: "许可", proto_ver: "版本", proto_clone: "克隆并再混",
      proto_fix: "提修正 PR", proto_dl: "下载离线 zip",
      guide_h: "指南", start_h: "一条命令安装",
      ft_note: "MIT · 原型各自携带许可 · 品牌复刻为非官方学习作品",
    },
  };

  const state = { lang: localStorage.getItem("dc-lang") || "en", theme: localStorage.getItem("dc-theme") || "dark", index: null };
  const t = (k) => (I18N[state.lang] || I18N.en)[k] || I18N.en[k] || k;

  function applyI18n() {
    document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
    document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
    const lb = document.getElementById("langbtn");
    if (lb) lb.textContent = state.lang === "en" ? "中文" : "EN";
  }
  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
    const tb = document.getElementById("themebtn");
    if (tb) tb.textContent = state.theme === "dark" ? "☀" : "☾";
  }

  async function loadIndex() {
    if (state.index) return state.index;
    try {
      const r = await fetch(INDEX_LIVE + "?t=" + Date.now(), { cache: "no-store" });
      if (r.ok) { state.index = await r.json(); return state.index; }
    } catch {}
    try { const r = await fetch(INDEX_FALLBACK); state.index = await r.json(); return state.index; } catch {}
    return { version: 2, apps: [] };
  }

  const av = (c) => c.login
    ? `<span class="av" title="${c.name} (@${c.login}) · ${c.commits}"><img src="https://github.com/${c.login}.png?size=40" alt=""></span>`
    : `<span class="av" title="${c.name} · ${c.commits}">${(c.name || "?").slice(0, 1).toUpperCase()}</span>`;

  function card(a) {
    const f = a.flavors[0] || {};
    const thumb = f.thumb ? `${PROTO_BASE}/${f.thumb}` : "";
    return `<a class="pcard" href="proto.html?app=${encodeURIComponent(a.app)}">
      <div class="th">${thumb ? `<img src="${thumb}" alt="" loading="lazy">` : ""}</div>
      <div class="bd"><div class="t">${a.title}</div>
      <div class="m"><span class="chip">${a.flavors.length} flavor${a.flavors.length > 1 ? "s" : ""}</span>
      <span class="chip">${(a.tags || []).slice(0, 2).join(" · ") || a.category || "app"}</span>
      <span class="avs">${(a.contributors || []).slice(0, 4).map(av).join("")}</span></div></div></a>`;
  }

  async function renderGallery() {
    const idx = await loadIndex();
    const grid = document.getElementById("cards");
    const q = (document.getElementById("q") || {}).value || "";
    const form = (document.getElementById("form") || {}).value || "";
    const sort = (document.getElementById("sort") || {}).value || "upd";
    let apps = idx.apps || [];
    if (form) apps = apps.filter((a) => a.flavors.some((f) => f.flavor.startsWith(form)));
    if (q) apps = apps.filter((a) => (a.title + " " + a.app + " " + (a.tags || []).join(" ")).toLowerCase().includes(q.toLowerCase()));
    apps = apps.slice().sort((x, y) => sort === "com"
      ? (y.flavors.reduce((s, f) => s + f.commits, 0)) - (x.flavors.reduce((s, f) => s + f.commits, 0))
      : String(y.updated || "").localeCompare(String(x.updated || "")));
    grid.innerHTML = apps.map(card).join("") || `<p style="color:var(--mut)">${state.lang === "zh" ? "暂无原型——成为第一个发布者：" : "No prototypes yet — be the first:"} <a href="guide.html#publish">publish</a></p>`;
    const st = document.getElementById("stats");
    if (st) {
      const nf = (idx.apps || []).reduce((s, a) => s + a.flavors.length, 0);
      const nc = new Set((idx.apps || []).flatMap((a) => (a.contributors || []).map((c) => c.name))).size;
      st.innerHTML = `<div class="stat"><b>${(idx.apps || []).length}</b><span>${t("stat_apps")}</span></div>
        <div class="stat"><b>${nf}</b><span>${t("stat_flavors")}</span></div>
        <div class="stat"><b>${nc}</b><span>${t("stat_contrib")}</span></div>`;
    }
  }

  async function renderProto() {
    const params = new URLSearchParams(location.search);
    let app = params.get("app"); let flavor = params.get("flavor");
    const idx = await loadIndex();
    const a = (idx.apps || []).find((x) => x.app === app) || (idx.apps || [])[0];
    if (!a) { document.getElementById("side").innerHTML = "<p>not found</p>"; return; }
    if (!flavor || !a.flavors.some((f) => f.flavor === flavor)) flavor = (a.flavors[0] || {}).flavor;
    const f = a.flavors.find((x) => x.flavor === flavor) || {};
    history.replaceState(null, "", `proto.html?app=${a.app}&flavor=${flavor}`);
    document.title = `${a.title} · ${flavor} — design-clone gallery`;
    const url = f.url || `${PROTO_BASE}/${a.app}/${flavor}/prototype/`;
    document.getElementById("stageframe").src = url;
    const rel = `${a.app}/${flavor}`;
    document.getElementById("side").innerHTML = `
      <h1>${a.title}</h1>
      <div class="desc">${a.description || ""}</div>
      ${a.brand_disclaimer ? `<div class="disc">${a.brand_disclaimer}</div>` : ""}
      <h4>${t("proto_flavors")}</h4>
      <div class="flavchips">${a.flavors.map((x) => `<a href="proto.html?app=${a.app}&flavor=${x.flavor}" class="${x.flavor === flavor ? "on" : ""}">${x.flavor}</a>`).join("")}</div>
      <h4>${t("proto_meta")}</h4>
      <div class="kv"><span class="k">${t("proto_ver")}</span><span>v${f.version || "?"} · ${f.shell || ""}</span></div>
      <div class="kv"><span class="k">${t("proto_src")}</span><span>${(f.source || {}).kind || ""} · ${(f.source || {}).ref || ""}</span></div>
      <div class="kv"><span class="k">${t("proto_license")}</span><span>${f.license || "CC-BY-4.0"} · attest: ${f.ip_attestation || ""}</span></div>
      <div class="kv"><span class="k">play</span><span><a href="${url}" target="_blank" rel="noopener">${url.replace("https://", "")}</a></span></div>
      <h4>${t("proto_contrib")}</h4>
      <div class="contrib">${(f.contributors || []).map((c) => `<div class="c">${av(c)}<span class="n">${c.name}${c.login ? ` <a href="https://github.com/${c.login}">@${c.login}</a>` : ""}<small>${c.commits} commits · ${rel}</small></span></div>`).join("") || "<span style='color:var(--mut);font-size:12px'>—</span>"}</div>
      <h4>${t("proto_clone")}</h4>
      <div class="cmd">git clone --depth 1 https://github.com/hello-cqq/design-clone-prototype && open design-clone-prototype/${rel}/prototype/index.html</div>
      <div class="cta" style="margin-top:14px">
        <a class="btn gh" href="https://github.com/hello-cqq/design-clone-prototype/releases?q=${encodeURIComponent(a.app + "-" + flavor)}" target="_blank" rel="noopener">${t("proto_dl")}</a>
        <a class="btn gh" href="https://github.com/hello-cqq/design-clone-prototype/edit/main/${rel}/PROVENANCE.md" target="_blank" rel="noopener">${t("proto_fix")}</a>
      </div>`;
  }

  const AGENTS = {
    opencode: "curl -fsSL https://raw.githubusercontent.com/hello-cqq/design-clone/main/install.sh | bash -s -- --agent opencode",
    claude: "curl -fsSL https://raw.githubusercontent.com/hello-cqq/design-clone/main/install.sh | bash -s -- --agent claude",
    codex: "curl -fsSL https://raw.githubusercontent.com/hello-cqq/design-clone/main/install.sh | bash -s -- --agent codex",
    npx: "npx skills add hello-cqq/design-clone -g",
  };
  function wireInstall() {
    const code = document.getElementById("installcmd");
    const box = document.getElementById("agentswitch");
    if (!code || !box) return;
    const set = (k) => { code.textContent = AGENTS[k]; box.querySelectorAll(".agentbtn").forEach((b) => b.classList.toggle("on", b.dataset.a === k)); };
    box.innerHTML = Object.keys(AGENTS).map((k) => `<button class="agentbtn" data-a="${k}">${k}</button>`).join("");
    box.addEventListener("click", (e) => { const b = e.target.closest(".agentbtn"); if (b) set(b.dataset.a); });
    set("opencode");
    const cp = document.getElementById("copycmd");
    if (cp) cp.onclick = () => { navigator.clipboard.writeText(code.textContent); cp.textContent = "✓"; setTimeout(() => (cp.textContent = "copy"), 1200); };
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyTheme(); applyI18n(); wireInstall();
    const lb = document.getElementById("langbtn");
    if (lb) lb.onclick = () => { state.lang = state.lang === "en" ? "zh" : "en"; localStorage.setItem("dc-lang", state.lang); applyI18n(); if (document.getElementById("cards")) renderGallery(); if (document.getElementById("side")) renderProto(); };
    const tb = document.getElementById("themebtn");
    if (tb) tb.onclick = () => { state.theme = state.theme === "dark" ? "light" : "dark"; localStorage.setItem("dc-theme", state.theme); applyTheme(); };
    if (document.getElementById("cards")) {
      renderGallery();
      ["q", "form", "sort"].forEach((id) => { const el = document.getElementById(id); if (el) el.addEventListener("input", renderGallery); });
    }
    if (document.getElementById("side")) renderProto();
    const fsb = document.getElementById("fsbtn");
    if (fsb) fsb.onclick = () => { const f = document.getElementById("stageframe"); if (f.requestFullscreen) f.requestFullscreen(); };
  });
})();
