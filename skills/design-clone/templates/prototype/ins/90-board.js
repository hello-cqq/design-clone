/* inspector 分段 90-board.js —— 右详情看板：产品/设计/提示词 + 产品编辑入口 + tweaks/变体 + 拖拽编辑
 * 源文件按文件名顺序拼接为 prototype/inspector.js（scripts/build-shell.mjs），同一 IIFE 闭包。
 * 约定：JS 只写几何与状态；排版/配色一律 inspector.css 类 + 主题变量。
 */
  /* ---------- 详情看板（产品+设计合并） ---------- */
  function compilePrompt(t, dc) {
    const cs = getComputedStyle(t); const r = t.getBoundingClientRect();
    const name = dc || t.tagName.toLowerCase();
    const prod = S.products[S.page] || {};
    return `设计一个「${name}」组件：尺寸约 ${Math.round(r.width)}×${Math.round(r.height)}，圆角 ${cs.borderRadius}，边框 ${cs.borderWidth} ${rgb2hex(cs.borderColor)}；主色 ${rgb2hex(cs.backgroundColor)}，文字 ${rgb2hex(cs.color)} ${cs.fontSize}/${cs.fontWeight} ${cs.fontFamily.split(",")[0]}；布局：${cs.display}，padding ${cs.padding}；功能：${(prod.function || "见页面功能").slice(0, 60)}；风格锚：原生平台风；不要：多余装饰与投影堆砌。`;
  }
  function compilePagePrompt(id) {
    const n = (S.paths && S.paths.nodes[id]) || {};
    return `设计一个${shellLabel()}「${n.title || id}」：参考 tokens.css 的色板与字体栈；信息层级：导航+主内容列表+底栏；风格锚：原生平台风；不要：lorem 文案（用真实感 mock）。`;
  }
  function promptBlock(text) {
    return `<div class="promptbox">${esc(text)}</div><button class="dc-btn copy" data-copy="${encodeURIComponent(text)}">复制</button>`;
  }
  function fillDetail() {
    const box = $("#dc-board-detail");
    const prodBtn = (id) => (id ? `<button class="dc-btn mini" data-editprod="${esc(id)}" title="编辑产品说明并写回 products.json">编辑</button>` : "");
    let html = S.ann ? `<div class="hint">标注模式已开：点画面里的元素即可新增/编辑批注（写回 annotations.json）</div>` : "";
    if (S.ann && (S.annOrphans || []).length) {
      html += `<div class="hint" style="color:#d92d20">${S.annOrphans.length} 条标注的 target 已不在视图（视图改版后失效）：${S.annOrphans.slice(0, 4).map(esc).join("、")}${S.annOrphans.length > 4 ? "…" : ""}。标注模式点现有元素可重挂，或在标注编辑器里删除。</div>`;
    }
    if (S.ia === "scene" && S.selNode) {
      const prod = S.products[S.selNode] || {};
      if (S.flowMode === "path") {
        const p = ((S.paths.perNode[S.selNode] || {}).paths || [])[S.selPath] || [];
        const chain = [S.selNode, ...p.map((ei) => S.paths.edges[ei].to)];
        const goals = [...new Set(chain.map((id) => (S.products[id] || {}).goals || []).flat())];
        const prompt = `复现场景路径：${chain.map((id) => `${idxOf(id)} ${nodeTitle(id)}`).join(" → ")}；每步交互：${p.map((ei) => S.paths.edges[ei].label).join("；")}；产品目标：${goals.join("、") || "转化/留存"}；风格：${shellLabel()}，黑白细线标注风。`;
        html += `<h4>场景路径</h4>${chain.map((id) => `<div>${idxOf(id)} ${esc(nodeTitle(id))}</div>`).join("")}
          <h4>功能${prodBtn(S.selNode)}</h4>${chain.map((id) => (S.products[id] || {}).function).filter(Boolean).map(esc).join("<br>") || "（products.json 未提供）"}
          <h4>目标</h4>${goals.map((g) => `<span class="goal">${esc(g)}</span>`).join("") || "—"}
          <h4>再生成提示词</h4>${promptBlock(prompt)}`;
      } else {
        html += `<h4>页面</h4><b>${idxOf(S.selNode)} ${esc(nodeTitle(S.selNode))}</b>
          <h4>功能${prodBtn(S.selNode)}</h4>${esc(prod.function || "（克隆时按 vlm-analysis.md 补 product 三要素）")}
          <h4>目标</h4>${(prod.goals || []).map((g) => `<span class="goal">${esc(g)}</span>`).join("") || "—"}
          <h4>再生成提示词</h4>${promptBlock(prod.page_prompt || compilePagePrompt(S.selNode))}`;
      }
    } else if (S.page) {
      const prod = S.products[S.page] || {};
      html += `<h4>页面</h4><b>${idxOf(S.page)} ${esc(nodeTitle(S.page))}</b>
        <h4>功能${prodBtn(S.page)}</h4>${esc(prod.function || "（克隆时按 vlm-analysis.md 补 product 三要素）")}
        <h4>目标</h4>${(prod.goals || []).map((g) => `<span class="goal">${esc(g)}</span>`).join("") || "—"}
        <h4>再生成提示词</h4>${promptBlock(prod.page_prompt || compilePagePrompt(S.page))}`;
      const t = S.selected ? el(S.selected) : null;
      if (t) {
        const cs = getComputedStyle(t); const r = t.getBoundingClientRect();
        const o = ((S.overrides[S.page] || {})[S.selected] || {}).style || {};
        const row = (label, key, val, type) =>
          `<div class="kv"><label>${label}</label>${type === "color" ? `<input type="color" data-sk="${key}" value="${val.startsWith("#") && val.length === 7 ? val : "#ffffff"}">` : ""}<input class="dc-inp" data-sk="${key}" value="${esc(val)}" style="width:110px" ${S.edit ? "" : "readonly"}></div>`;
        const autoMeta = String(S.selected).startsWith("auto:")
          ? `<div class="hint">自动选中控件 · 交互=${esc(t.getAttribute("data-act") || t.getAttribute("data-goto") || t.getAttribute("role") || "-")} · ${esc((t.getAttribute("data-msg") || t.textContent || "").trim().slice(0, 40))}</div>` : "";
        html += `<h4>选中元素 · ${esc(S.selected)}</h4>${autoMeta}&lt;${t.tagName.toLowerCase()}&gt;
          ${row("背景", "backgroundColor", rgb2hex(cs.backgroundColor), "color")}${row("文字", "color", rgb2hex(cs.color), "color")}${row("圆角", "borderRadius", cs.borderRadius, "text")}${row("边框", "border", cs.borderWidth + " solid " + rgb2hex(cs.borderColor), "text")}
          ${row("字体", "fontFamily", cs.fontFamily.split(",")[0], "text")}${row("字号", "fontSize", cs.fontSize, "text")}${row("字重", "fontWeight", cs.fontWeight, "text")}
          <div style="margin-top:4px;color:var(--sh-mut);font-size:11px">${S.edit ? "可直接改值，Ctrl+Z 撤销" : "编辑模式可改（底栏 ✎）"}</div>
          <h4>元素提示词</h4>${promptBlock((prod.element_prompts || {})[S.selected] || compilePrompt(t, S.selected))}`;
      }
    } else html = "选中页面/节点/路径后展示详情";
    html += `<details><summary>全局 tokens 调参</summary><div id="dc-tw-zone"></div></details>`;
    box.innerHTML = html;
    box.querySelectorAll("[data-editprod]").forEach((b) => (b.onclick = () => editProduct(b.dataset.editprod)));
    box.querySelectorAll(".copy").forEach((b) => (b.onclick = () => { navigator.clipboard.writeText(decodeURIComponent(b.dataset.copy)); b.textContent = "已复制"; setTimeout(() => (b.textContent = "复制"), 1200); }));
    box.querySelectorAll("[data-sk]").forEach((inp) => {
      inp.oninput = () => {
        if (!S.edit) return;
        const key = inp.dataset.sk; const val = inp.value;
        const t = el(S.selected); if (!t) return;
        const cur = ((S.overrides[S.page] ||= {})[S.selected] ||= {}).style || {};
        pushUndo({ kind: "style", page: S.page, dc: S.selected, prev: { ...cur } });
        (S.overrides[S.page][S.selected].style ||= {})[key] = val;
        t.style[key] = val; persist();
        const sib = box.querySelector(`${inp.type === "color" ? "input.dc-inp" : "input[type=color]"}[data-sk="${key}"]`);
        if (sib && sib !== inp) sib.value = val;
      };
    });
    renderTweaksZone();
  }

  /* ---------- tweaks（详情内折叠节） ---------- */
  function tweaksStore() { try { return JSON.parse(localStorage.getItem("dc-tweaks") || "{}"); } catch { return {}; } }
  function tweaksApply(o) { for (const [k, v] of Object.entries(o || {})) document.documentElement.style.setProperty(k, v); }
  const VARIANT_NAME_RE = /^[A-Za-z0-9._-]{1,64}$/;
  /** 变体落盘（M44k）：此前只写 localStorage，换机器/清缓存即丢，也无法被 ?variant= 与 apply-patch 复用 */
  async function saveVariant(name, tokens) {
    const dir = "prototype/variants/" + name + "/";
    const css = ":root {\n" + Object.entries(tokens).map(([k, v]) => `  ${k}: ${v};`).join("\n") + "\n}\n";
    const a = await writeFile(dir + "tokens.json", tokens);
    const b = await writeFile(dir + "tokens-override.css", css);
    const idx = { variants: { ...(S.variantWhy || {}) } };
    idx.variants[name] = { why: "inspector tweaks", at: new Date().toISOString(), original: "default" };
    await writeFile("prototype/variants-index.json", idx);
    let local = {}; try { local = JSON.parse(localStorage.getItem("dc-variants") || "{}"); } catch { local = {}; }
    local[name] = tokens; localStorage.setItem("dc-variants", JSON.stringify(local));
    S.variants[name] = tokens; S.variantWhy = idx.variants;
    return a.ok && b.ok ? "run" : a.where;
  }
  function renderTweaksZone() {
    const box = $("#dc-tw-zone"); if (!box) return;
    const variants = S.variants || {};
    const names = Object.keys(variants);
    box.innerHTML = TOKEN_KEYS.map((k) => {
      const v = tweaksStore()[k] || getComputedStyle(document.documentElement).getPropertyValue(k).trim();
      const isC = v.startsWith("#");
      return `<div class="kv"><label style="width:110px">${k}</label>${isC ? `<input type="color" data-tk="${k}" value="${v}">` : ""}<input class="dc-inp" data-tk="${k}" value="${esc(v)}" style="width:104px"></div>`;
    }).join("") +
      `<select class="dc-inp" id="dc-variant" style="width:100%;margin-top:8px"><option value="">（变体：当前）</option>${names.map((n) => `<option value="${esc(n)}"${n === S.variant ? " selected" : ""}>${esc(n)}${(S.variantWhy || {})[n] ? " · " + esc((S.variantWhy || {})[n].why || "") : ""}</option>`).join("")}</select>
      <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap"><button id="dc-tw-save" class="dc-btn">存为变体</button><button id="dc-tw-export" class="dc-btn">导出 patch</button><button id="dc-tw-reset" class="dc-btn">重置</button></div>
      <div class="hint" style="margin-top:6px;font-size:11px;color:var(--sh-mut)">变体写入 prototype/variants/&lt;名&gt;/，分享链接带 ?variant=&lt;名&gt; 即可复现</div>`;
    box.querySelectorAll("[data-tk]").forEach((inp) => (inp.oninput = () => {
      const o = tweaksStore(); o[inp.dataset.tk] = inp.value;
      localStorage.setItem("dc-tweaks", JSON.stringify(o));
      document.documentElement.style.setProperty(inp.dataset.tk, inp.value);
    }));
    $("#dc-tw-reset").onclick = () => { localStorage.removeItem("dc-tweaks"); TOKEN_KEYS.forEach((k) => document.documentElement.style.removeProperty(k)); const st = document.getElementById("dc-variant-css"); if (st) st.textContent = ""; S.variant = ""; setQueryParam("variant", null); renderTweaksZone(); };
    $("#dc-tw-save").onclick = () => modal({
      title: "存为变体", body: "原版（default）保持不动，变体可随时切回。",
      input: { ph: "变体名（字母/数字/._-）" },
      actions: [{ id: "cancel", label: "取消" }, { id: "ok", label: "保存", pr: true }],
    }).then(async (n) => {
      if (!n) return;
      const name = String(n).trim();
      if (!VARIANT_NAME_RE.test(name)) { toast("变体名只能用字母/数字/._-（1-64 字）"); return; }
      const where = await saveVariant(name, tweaksStore());
      renderTweaksZone();
      toast(where === "run" ? `变体 ${name} 已落盘 prototype/variants/${name}/` : `变体 ${name} 只存到浏览器（${where}）：需 node serve.mjs 才能落盘`);
    });
    $("#dc-tw-export").onclick = () => download("tokens-patch.json", JSON.stringify({ type: "tokens-patch", overrides: tweaksStore() }, null, 2));
    $("#dc-variant").onchange = (e) => {
      const n = e.target.value;
      S.variant = n;
      setQueryParam("variant", n || null);
      TOKEN_KEYS.forEach((k) => document.documentElement.style.removeProperty(k));
      if (!n) { const st = document.getElementById("dc-variant-css"); if (st) st.textContent = ""; localStorage.removeItem("dc-tweaks"); renderTweaksZone(); return; }
      const v = variants[n];
      if (v) { localStorage.setItem("dc-tweaks", JSON.stringify(v)); tweaksApply(v); }
      applyVariant(n);
    };
  }
  /* ---------- 编辑拖拽 ---------- */
  let drag = null;
  function startDrag(e, t) {
    const dc = t.getAttribute("data-dc"); if (!dc) return;
    const cur = (S.overrides[S.page] || {})[dc] || {};
    pushUndo({ kind: "move", page: S.page, dc, prev: { dx: cur.dx || 0, dy: cur.dy || 0 } });
    drag = { t, dc, sx: e.clientX, sy: e.clientY, dx: cur.dx || 0, dy: cur.dy || 0 };
  }
  function finishDrag() { if (drag) { drag = null; persist(); } }
