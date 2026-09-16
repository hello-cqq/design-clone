/* design-clone site v2 —— logo(影分身忍者)/nav 光感滑动/star 徽章/i18n(EN 默认+zh)/gallery/详情/精选 */
(() => {
  const INDEX_LIVE = "https://hello-cqq.github.io/design-clone-prototype/index.json";
  const INDEX_FALLBACK = "data/index.fallback.json";
  const PROTO_BASE = "https://hello-cqq.github.io/design-clone-prototype";
  const REPO = "hello-cqq/design-clone";

  const I18N = {
    en: {
      nav_home: "Home", nav_gallery: "Gallery",
      h1a: "Clone any app into", h1b: "a playable prototype.",
      install_label: "Install",
      exp_title: "Try it live", exp_note: "hosted on GitHub Pages · tap, play, export",
      feat_h: "Feature demos", guide_h: "Guide", start_h: "Install in one command",
      f_a_t: "Mobile GUI capture", f_b_t: "Douyin / RED links", f_c_t: "Desktop GUI capture", f_d_t: "Website links", top_h: "Top prototypes", more: "More",
      gal_search: "search name or tag…", gal_sort_dl: "most downloads", gal_sort_upd: "recently updated",
      proto_dl: "Download offline zip", proto_jump: "source on GitHub", proto_contrib: "Contributors", proto_spec: "Design specs",
      proto_tags: "Tags", ft_note: "MIT · prototypes carry their own license · brand replicas are unofficial study works",
      empty: "No prototypes yet — be the first:",
      ph_gal: "Act II · pick a world", gal_h: "Every clone, one shelf", ph_proto: "Act III · step inside", ph_guide: "Backstage · how it works", ph_start: "Act I · take it home",
    },
    zh: {
      nav_home: "首页", nav_gallery: "画廊",
      h1a: "把任意应用克隆成", h1b: "可玩的原型。",
      install_label: "安装",
      exp_title: "在线体验", exp_note: "GitHub Pages 托管 · 可点可玩可导出",
      feat_h: "功能演示", guide_h: "指南", start_h: "一条命令安装",
      f_a_t: "手机 GUI 抓取", f_b_t: "抖音 / 小红书链接", f_c_t: "桌面 GUI 抓取", f_d_t: "网站链接", top_h: "精选原型", more: "更多",
      gal_search: "搜索名称或标签…", gal_sort_dl: "最多下载", gal_sort_upd: "最近更新",
      proto_dl: "下载离线 zip", proto_jump: "GitHub 源码", proto_contrib: "贡献者", proto_spec: "设计规格",
      proto_tags: "标签", ft_note: "MIT · 原型各自携带许可 · 品牌复刻为非官方学习作品",
      empty: "暂无原型——成为第一个：",
      ph_gal: "第二幕 · 挑选一个世界", gal_h: "所有复刻，同一面墙", ph_proto: "第三幕 · 走进原型", ph_guide: "幕后 · 它如何工作", ph_start: "第一幕 · 带它回家",
    },
  };

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
    document.querySelectorAll(".animstage").forEach((cap) => { if (cap._replayLang) cap._replayLang(); });
    if (document.getElementById("cards")) renderGallery();
    if (document.getElementById("side")) renderProto();
    if (document.getElementById("featured")) renderFeatured();
  }
  /* M104-W5：无边界叙事——滚动感知页眉 / IO reveal+素描扫显 / View Transitions 页间过渡 */
  function wireNarrative() {
    const hd = document.querySelector("header.top");
    if (hd) addEventListener("scroll", () => hd.classList.toggle("scrolled", scrollY > 24), { passive: true });
    const rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const targets = document.querySelectorAll("[data-rv], .sketch");
    if ("IntersectionObserver" in window && targets.length) {
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("rv-in"); io.unobserve(e.target); } }), { threshold: 0.18 });
      targets.forEach((t) => io.observe(t));
    } else targets.forEach((t) => t.classList.add("rv-in"));
    if (rm) return;
    document.addEventListener("click", (e) => {
      const a = e.target.closest && e.target.closest("a[href]");
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return;
      const href = a.getAttribute("href") || "";
      if (!/^(index|gallery|proto|guide|start)\.html/.test(href) && !href.endsWith(".html")) return;
      if (!document.startViewTransition) return;
      e.preventDefault();
      document.startViewTransition(() => { location.href = href; });
    }, true);
  }
  /* M103-W3：hero 环境视频守卫 + 云体视差 */
  function wireAmbient() {
    const vid = document.querySelector(".heroambient video");
    if (vid) {
      const rm = matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (rm) vid.remove();
      else { vid.play().catch(() => {}); vid.addEventListener("mouseenter", () => {}); }
    }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const layer = document.createElement("div");
    layer.className = "cloudlayer"; layer.setAttribute("aria-hidden", "true");
    const spots = [[8, 12, 340, 90], [62, 6, 420, 110], [30, 58, 300, 80], [78, 44, 260, 70]];
    for (const [x, y, w, h] of spots) {
      const d = document.createElement("div");
      d.className = "cl"; d.style.cssText = `left:${x}%;top:${y}%;width:${w}px;height:${h}px`;
      d.dataset.sp = (0.04 + Math.random() * 0.05).toFixed(3);
      layer.appendChild(d);
    }
    document.body.appendChild(layer);
    let tick = false;
    addEventListener("scroll", () => {
      if (tick) return; tick = true;
      requestAnimationFrame(() => {
        const y = scrollY;
        layer.querySelectorAll(".cl").forEach((d) => { d.style.transform = `translateY(${(-y * parseFloat(d.dataset.sp)).toFixed(1)}px)`; });
        tick = false;
      });
    }, { passive: true });
  }
  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
    if (window.__identCtrl && window.__identCtrl.swap) window.__identCtrl.swap(state.theme);
    const sf = document.getElementById("stageframe");
    if (sf && sf.contentWindow) { try { sf.contentWindow.postMessage({ type: "dc-theme", theme: state.theme }, "*"); window.__postedTheme = state.theme; } catch {} }
    const tb = document.getElementById("themebtn");
    if (tb) tb.innerHTML = state.theme === "dark"
      ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>'
      : '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
    // M94: logo 动图/标签图标随主题切换
    const lockSrc = `assets/logo-anim-${state.theme === "dark" ? "dark" : "light"}.webp`;
    document.querySelectorAll(".logolock").forEach((im) => { im.src = lockSrc; });
    const favs = [...document.querySelectorAll('link[rel="icon"]')];
    favs.forEach((fav) => { fav.href = state.theme === "dark" ? "assets/favicon-dark.png" : "assets/favicon.png"; });


  }

  async function loadIndex() {
    if (state.index) return state.index;
    try {
      const r = await fetch(INDEX_LIVE, { cache: "default" });
      if (r.ok) { state.index = await r.json(); window.__DC_STATE = state; return state.index; }
    } catch {}
    try { state.index = await (await fetch(INDEX_FALLBACK)).json(); window.__DC_STATE = state; return state.index; } catch {}
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
    // M76-W2c: 不区分创建者——纯 commits 序展示全部贡献者
    const list = (a.contributors || []).slice().sort((x, y) => y.commits - x.commits);
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

  function card(a) {
    const cover = a.cover ? `${PROTO_BASE}/${a.cover}` : "";
    const name = L(a.name, a.app);
    return `<a class="pcard" href="proto.html?app=${encodeURIComponent(a.app)}">
      <div class="th${cover ? "" : " tile"}">${cover ? `<img data-src="${thumbUrl(a.app, "cover", `data/thumbs/${a.app}-cover.jpg`)}" onerror="this.onerror=null;this.src='${cover}'" alt="" loading="lazy">` : (a.icon ? `<img class="appicon" data-src="${thumbUrl(a.app, "icon", `data/thumbs/${a.app}-icon.png`)}" onerror="this.onerror=null;this.src='${PROTO_BASE}/${a.icon}'" alt="" loading="lazy">` : "")}
        <span class="heat"><svg width="11" height="11" viewBox="0 0 24 24" style="fill:#ff8a5c"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>${fmtHeat(a.downloads)}</span></div>
      <div class="bd"><div class="t"><span class="nm">${name}</span>
        ${a.icon ? `<img class="tic" data-src="${thumbUrl(a.app, "icon", `data/thumbs/${a.app}-icon.png`)}" onerror="this.onerror=null;this.src='${PROTO_BASE}/${a.icon}'" alt="" loading="lazy">` : ""}</div></div></a>`;
  }

  async function renderFeatured() {
    const idx = await loadIndex();
    const boost = (a) => (a.app === "ai-assistant" ? 1e9 : 0) + (a.downloads || 0); // M75-W3: 智能助理置顶精选
    const apps = (idx.apps || []).slice().sort((a, b) => boost(b) - boost(a)).slice(0, 4);
    await loadThumbs();
    const el = document.getElementById("featured");
    if (el) el.innerHTML = apps.map(card).join("");
    armThumbIO();
    const sel = document.getElementById("expselect");
    if (sel && !sel.options.length) {
      // M83: 在线体验只列白名单五 app（星海/微信/飞书/动物乐园/阿里云）
      const WL = ["ai-assistant", "wechat", "lark", "petpark", "aliyun-console"];
      const apps = WL.map((sl) => (idx.apps || []).find((a) => a.app === sl)).filter(Boolean);
      sel.innerHTML = apps.map((a) => `<option value="${a.app}">${L(a.name, a.app)}</option>`).join("");
      sel.value = apps[0] ? apps[0].app : "";
      if (sel.value) switchExp(sel.value);
    }
  }
  function switchExp(app) {
    const idx = state.index;
    const a = (idx && idx.apps || []).find((x) => x.app === app);
    const fl = document.getElementById("expframe");
    // M76-W7: live-proof iframe 延到 window.load+idle 再挂 src——proto 边缘慢时不拖主文档 load（首页卡加载/视频不出的根因）
    if (fl) {
      const setSrc = () => { fl.src = a ? (isMobile() ? a.url + (a.url.includes("?") ? "&" : "?") + "chrome=0&embed=1&theme=" + state.theme : a.url) : ((idx.apps || [])[0] ? (idx.apps[0].url) : "about:blank"); };
      const idle = window.requestIdleCallback || ((f) => setTimeout(f, 300));
      afterLoadOr(() => idle(setSrc), 4000);
    }
  }

  // M76-W7f: 边缘可能拖死 load 事件——所有 load 后任务都给 DCL+3.5s 兜底
  function afterLoadOr(fn, ms) {
    let done = false;
    const run = () => { if (done) return; done = true; fn(); };
    if (document.readyState === "complete") run();
    else {
      window.addEventListener("load", run, { once: true });
      setTimeout(run, ms);
    }
  }
  // M76-W7c: 画廊缩略图 IO 延载——load 前不发 proto 边缘请求，load 事件不被慢边缘拖住
  function armThumbIO() {
    const io = new IntersectionObserver((es) => {
      for (const e of es) if (e.isIntersecting) { const im = e.target; if (im.dataset.src) { im.src = im.dataset.src; delete im.dataset.src; } io.unobserve(im); }
    }, { rootMargin: "300px" });
    document.querySelectorAll("img[data-src]").forEach((im) => io.observe(im));
    afterLoadOr(() => setTimeout(() => document.querySelectorAll("img[data-src]").forEach((im) => { im.src = im.dataset.src; delete im.dataset.src; io.unobserve(im); }), 400), 3500);
  }
  async function renderGallery() {
    const idx = await loadIndex();
    await loadThumbs();
    const grid = document.getElementById("cards");
    if (!grid) return;
    const q = (document.getElementById("q") || {}).value || "";
    const sort = (document.getElementById("sort") || {}).value || "dl";
    const tagOn = forcedTag || (document.querySelector(".tagbtn.on") || {}).dataset?.tag || "";
    let apps = idx.apps || [];
    if (tagOn) apps = apps.filter((a) => (a.tags || []).includes(tagOn));
    if (q) apps = apps.filter((a) => (L(a.name, a.app) + " " + a.app + " " + (a.tags || []).join(" ") + " " + L(a.description)).toLowerCase().includes(q.toLowerCase()));
    apps = apps.slice().sort((x, y) => sort === "upd"
      ? String(y.updated || "").localeCompare(String(x.updated || ""))
      : (y.downloads || 0) - (x.downloads || 0));
    // M81-W3: 标签行=频次 Top 单行；搜索框出命中标签推荐
    const freq = {};
    for (const a of idx.apps || []) for (const tg of a.tags || []) freq[tg] = (freq[tg] || 0) + 1;
    const tags = Object.keys(freq).sort((x, y) => freq[y] - freq[x] || x.localeCompare(y));
    const tr = document.getElementById("tagrow");
    if (tr) {
      tr.innerHTML = tags.map((x) => `<button class="tagbtn${x === tagOn ? " on" : ""}" data-tag="${x}">${x}</button>`).join("");
      // 单行裁剪：超宽即从低频端移除
      let guard = 0;
      while (tr.scrollWidth > tr.clientWidth + 2 && tr.children.length > 3 && guard++ < 60) {
        const onIdx = [...tr.children].findIndex((c) => c.classList.contains("on"));
        tr.removeChild(tr.children[tr.children.length - 1]);
        if (onIdx >= 0 && !tr.children[onIdx]) break;
      }
    }
    wireSuggest(idx, freq);
    grid.innerHTML = apps.map(card).join("") || `<p style="color:var(--mut)">${t("empty")} <a href="guide.html#publish">publish</a></p>`;
    armThumbIO();
  }

  let forcedTag = "";
  let THUMBS = null;
  async function loadThumbs() {
    if (THUMBS) return THUMBS;
    try { THUMBS = await (await fetch("data/thumbs/thumbs-index.json", { cache: "default" })).json(); } catch { THUMBS = {}; }
    return THUMBS;
  }
  const thumbUrl = (app, kind, fallback) => {
    const m = (THUMBS || {})[app];
    return m && m[kind] ? `data/thumbs/${m[kind]}` : fallback;
  };
  function wireSuggest(idx, freq) {
    const q = document.getElementById("q");
    const box = document.getElementById("qsuggest");
    const act = document.getElementById("tagactive");
    if (!q || !box) return;
    const paintActive = () => {
      if (!act) return;
      if (!forcedTag) { act.hidden = true; act.innerHTML = ""; return; }
      act.hidden = false;
      act.innerHTML = `<span class="chip on">${forcedTag}<button class="x" aria-label="clear">×</button></span>`;
      act.onclick = (e) => { if (e.target.closest(".x")) { forcedTag = ""; paintActive(); renderGallery(idx); } };
    };
    const close = () => { box.hidden = true; };
    q.oninput = () => {
      const v = q.value.trim().toLowerCase();
      renderGallery(idx);
      if (!v) { close(); return; }
      const hitTags = Object.keys(freq).filter((tg) => tg.includes(v)).slice(0, 8);
      const hitViaApps = (idx.apps || []).filter((a) => (L(a.name, a.app) || "").toLowerCase().includes(v)).flatMap((a) => a.tags || []);
      const merged = [...new Set([...hitTags, ...hitViaApps.filter((tg) => freq[tg])])].sort((x, y) => freq[y] - freq[x]).slice(0, 8);
      if (!merged.length) { close(); return; }
      box.hidden = false;
      box.innerHTML = merged.map((tg) => `<button class="chip" data-tag="${tg}">${tg}<i>${freq[tg]}</i></button>`).join("");
      box.onclick = (e) => {
        const b = e.target.closest("button[data-tag]");
        if (!b) return;
        forcedTag = b.dataset.tag;
        q.value = "";
        close(); paintActive(); renderGallery(idx);
      };
    };
    q.onkeydown = (e) => { if (e.key === "Escape") close(); };
    q.onblur = () => setTimeout(close, 180);
    paintActive();
  }
  const isMobile = () => matchMedia("(max-width: 980px)").matches;
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
    if (crumb) crumb.innerHTML = `<span class="eyebrow">${t("ph_proto")}</span><span>/</span><a href="gallery.html">${t("nav_gallery")}</a><span>/</span><b>${L(a.name, a.app)}</b>`;
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
        // M74: index v5 pages 字段优先，旧索引/无字段时回退抓 prototype index.html
        let id = (a.pages && a.pages[0] && a.pages[0].id) || null;
        if (!id) {
          const html = await (await fetch(a.url, { cache: "default" })).text();
          id = ((html.match(/window\.DC = (\{[\s\S]*?\});/) || [])[1] ? JSON.parse(html.match(/window\.DC = (\{[\s\S]*?\});/)[1]).pages[0].id : null);
        }
        if (!id) { box.style.display = "none"; return; }
        box.innerHTML = `<a class="chip" href="${a.url}pages/${id}.spec.json" target="_blank" rel="noopener">pages/${id}.spec.json</a>
          <a class="chip" href="${a.url}design/figma-source.json" target="_blank" rel="noopener">figma-source.json</a>`;
      } catch { box.style.display = "none"; }
    })();
  }

  function wireNav() {
    // M91: logo 锁定为用户新标图片（mark+手写体锁排），替代渐变字标
    const LOCKSRC = () => `assets/logo-anim-${state.theme === "dark" ? "dark" : "light"}.webp`;
    const LOCK = (cls) => `<img class="${cls}" src="${LOCKSRC()}" alt="design-clone">`;
    document.querySelectorAll(".logo").forEach((el) => { if (!el.querySelector(".logolock")) el.innerHTML = LOCK("logolock"); });
    document.querySelectorAll(".ftbrand").forEach((el) => { el.innerHTML = LOCK("logolock logolock--ft"); });

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
    // M83: 四场景各 mount 一次（idle 错峰预挂），pill 切换=display 切换+_play()，零重建零卡顿
    stage.classList.add("animwrap");
    const handles = {}, kids = {};
    const ensure = (key) => {
      if (handles[key]) return handles[key];
      const d = document.createElement("div");
      d.className = "animstage";
      d.dataset.scene = key;
      d.style.display = "none";
      stage.appendChild(d);
      handles[key] = window.DCAnim.mount(d, scenes[key]);
      kids[key] = d;
      return handles[key];
    };
    const show = (key) => {
      for (const k of Object.keys(kids)) kids[k].style.display = k === key ? "" : "none";
      const h = handles[key];
      if (h && h._play) h._play();
      // M88: 点击即播——强制活层 + 舞台不可见时最小滚入
      if (h && h._forceLive) h._forceLive();
      const kid = kids[key];
      if (kid) {
        const r = kid.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) kid.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    };
    let mounted = false;
    const doMount = () => {
      if (mounted) return; mounted = true;
      ensure("a"); show("a");
      const idle = window.requestIdleCallback || ((f) => setTimeout(f, 700));
      ["b", "c", "d"].forEach((k, i) => idle(() => ensure(k), { timeout: 2500 + i * 900 }));
    };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) { io.disconnect(); doMount(); } }, { rootMargin: "200px" });
      io.observe(stage);
    } else doMount();
    wrap.addEventListener("click", (e) => {
      const b = e.target.closest(".ftab");
      if (!b) return;
      wrap.querySelectorAll(".ftab").forEach((x) => x.classList.toggle("on", x === b));
      const key = b.dataset.s;
      ensure(key); show(key);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyTheme(); applyI18n(); wireNav(); wireStars(); wireFeatureTabs(); wireAmbient(); wireNarrative();
    const lb = document.getElementById("langbtn");
    if (lb) lb.onclick = () => { state.lang = state.lang === "en" ? "zh" : "en"; localStorage.setItem("dc-lang", state.lang); applyI18n(); };
    const tb = document.getElementById("themebtn");
    if (tb) tb.onclick = () => { state.theme = state.theme === "dark" ? "light" : "dark"; localStorage.setItem("dc-theme", state.theme); applyTheme(); };
    const sel = document.getElementById("expselect");
    if (sel) sel.onchange = () => switchExp(sel.value);
    if (document.getElementById("cards")) {
      const qp = new URLSearchParams(location.search).get("q");
      const q0 = document.getElementById("q"); if (qp && q0) q0.value = qp;
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
    // M98: dlbtn 由 renderProto 异步生成——改文档级委托，HEAD 探测+clientZip 兜底真正生效
    document.addEventListener("click", async (e) => {
      const dlb = e.target.closest(".dlbtn"); if (!dlb) return;
      const url = dlb.getAttribute("href"); if (!url) return;
      try { const r = await fetch(url, { method: "HEAD" }); if (r.ok) return; } catch {}
      e.preventDefault();
      try { await clientZip(dlb.dataset.app); } catch {}
    });
    const code0 = document.getElementById("installcmd");
    const STABLE_CMD = "curl -fsSL https://raw.githubusercontent.com/hello-cqq/design-clone/main/install.sh | bash";
    if (code0) code0.textContent = STABLE_CMD;
    const cp = document.getElementById("copycmd");
    if (cp) cp.onclick = () => { const done = () => { cp.textContent = "✓"; setTimeout(() => (cp.textContent = "copy"), 1200); }; try { navigator.clipboard.writeText(document.getElementById("installcmd").textContent).then(done).catch(done); } catch { done(); } };

  });
})();
