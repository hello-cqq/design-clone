/* inspector 分段 140-events.js —— 模式开关/抓手/提示 + 标注编辑器(可写) + 产品说明编辑器(可写)
 * 源文件按文件名顺序拼接为 prototype/inspector.js（scripts/build-shell.mjs），同一 IIFE 闭包。
 * 约定：JS 只写几何与状态；排版/配色一律 inspector.css 类 + 主题变量。
 */
  /* ---------- 模式/事件 ---------- */
  function applyMode() { redraw(); }
  function setEdit(on) {
    S.edit = on;
    $("#dc-read").classList.toggle("on", !on);
    $("#dc-edit").classList.toggle("on", on);
    fillDetail();
  }
  let pan = null;
  function panStart(e) { pan = { x: e.clientX, y: e.clientY, sl: W.screen.scrollLeft, st: W.screen.scrollTop }; }
  function panEnd() { pan = null; }
  window.addEventListener("pointermove", (e) => { if (pan && !drag) { W.screen.scrollLeft = pan.sl - (e.clientX - pan.x); W.screen.scrollTop = pan.st - (e.clientY - pan.y); } });
  let tipEl = null;
  function tip(e) {
    const t = e.target.closest("[data-dc]");
    const a = t && (S.ann_data[S.page] || []).find((x) => x.target === t.getAttribute("data-dc"));
    if (!a) { if (tipEl) { tipEl.remove(); tipEl = null; } return; }
    if (!tipEl) { tipEl = document.createElement("div"); tipEl.className = "dc-tip"; document.body.appendChild(tipEl); }
    tipEl.innerHTML = `<b>${esc(a.label)}</b><br>` + (a.notes || []).map((n) => `<span style="color:var(--sh-mut)">${esc(n.event)}</span> → ${esc(n.response)}`).join("<br>");
    tipEl.style.left = e.clientX + 14 + "px"; tipEl.style.top = e.clientY + 10 + "px";
  }

  /* ---------- 标注：可读**也可写**（M44k） ----------
     旧实现只 fetch annotations.json 展示，无法在原型里补批注（"活 PRD"缺一半）。
     现在标注模式下点元素即弹编辑器，写回 prototype/annotations.json；离线打开时回退 localStorage。 */
  async function saveAnnotations() {
    const r = await writeFile("prototype/annotations.json", S.ann_data);
    const cnt = $("#dc-ann-toggle .cnt");
    if (cnt) cnt.textContent = (S.ann_data[S.page] || []).length || "";
    redraw(); fillDetail();
    return r;
  }
  async function editAnnotation(target) {
    const page = S.page;
    if (!page || !target) { toast("请先在页面模式选中一个元素"); return; }
    const list = S.ann_data[page] || (S.ann_data[page] = []);
    const i = list.findIndex((a) => a.target === target);
    const cur = i >= 0 ? list[i] : {};
    const n0 = (cur.notes || [])[0] || {};
    const res = await modal({
      title: i >= 0 ? "编辑标注" : "新增标注",
      body: `<div style="color:var(--sh-mut);font-size:11px">元素 ${esc(target)} · 页面 ${idxOf(page)} ${esc(nodeTitle(page))}</div>` +
        ((cur.notes || []).length > 1 ? `<div class="dc-ann-list">${cur.notes.slice(1).map((n) => `<div class="it"><span class="ev">${esc(n.event)}</span> → ${esc(n.response)}</div>`).join("")}</div><div class="hint">下面编辑第 1 条交互，其余保留</div>` : ""),
      fields: [
        { id: "label", label: "控件名 / 标题", value: cur.label || "" },
        { id: "event", label: "交互（点击 / 长按 / 开关 / 输入…）", value: n0.event || "点击" },
        { id: "response", label: "应有响应（跳转 / 弹窗 / 提示 / 状态变化…）", value: n0.response || "" },
        { id: "note", label: "产品批注（可空）", type: "textarea", value: cur.note || "" },
      ],
      actions: i >= 0
        ? [{ id: "cancel", label: "取消" }, { id: "del", label: "删除", danger: true }, { id: "ok", label: "保存", pr: true }]
        : [{ id: "cancel", label: "取消" }, { id: "ok", label: "保存", pr: true }],
    });
    if (!res) return;
    if (res.action === "del") {
      list.splice(i, 1);
      const r = await saveAnnotations();
      toast(r.ok ? "标注已删除并落盘" : "标注已删除（仅浏览器，未落盘）");
      return;
    }
    const v = res.value;
    const rest = (cur.notes || []).slice(1);
    const notes = v.response ? [{ event: v.event || "点击", response: v.response }, ...rest] : rest;
    const next = { target, label: v.label || cur.label || target, note: v.note || "", notes };
    if (i >= 0) list[i] = next; else list.push(next);
    const r = await saveAnnotations();
    toast(r.ok ? "标注已保存到 prototype/annotations.json" : "标注只存到浏览器（离线）：起 node serve.mjs 才能落盘");
  }

  /* ---------- 产品说明可编辑（M44k）：products.json 不再只能手改 ---------- */
  async function editProduct(id) {
    if (!id) return;
    const cur = S.products[id] || {};
    const res = await modal({
      title: "编辑产品说明（活 PRD）",
      body: `<div style="color:var(--sh-mut);font-size:11px">${idxOf(id)} ${esc(nodeTitle(id))} → prototype/products.json</div>`,
      fields: [
        { id: "function", label: "功能（这屏/这块做什么）", type: "textarea", rows: 4, value: cur.function || "" },
        { id: "goals", label: "目标（顿号或逗号分隔）", value: (cur.goals || []).join("、") },
      ],
      actions: [{ id: "cancel", label: "取消" }, { id: "ok", label: "保存", pr: true }],
    });
    if (!res) return;
    const v = res.value;
    S.products[id] = {
      ...cur,
      function: v.function || cur.function || "",
      goals: String(v.goals || "").split(/[、,，]/).map((s) => s.trim()).filter(Boolean),
    };
    const r = await writeFile("prototype/products.json", S.products);
    fillDetail();
    toast(r.ok ? "产品说明已保存到 prototype/products.json" : "产品说明只存到浏览器（离线）：起 node serve.mjs 才能落盘");
  }
