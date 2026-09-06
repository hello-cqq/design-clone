/* inspector 分段 20-ui.js —— UI 原语：modal(含 fields 表单)/notify/写盘 writeFile/读盘 readJSON
 * 源文件按文件名顺序拼接为 prototype/inspector.js（scripts/build-shell.mjs），同一 IIFE 闭包。
 * 约定：JS 只写几何与状态；排版/配色一律 inspector.css 类 + 主题变量。
 */
  /* ---------- modal（M44k：支持 fields 多字段表单，标注/产品编辑复用同一原语） ---------- */
  function modal({ title, body = "", input = null, fields = null, actions = [{ id: "ok", label: "好", pr: true }] }) {
    return new Promise((res) => {
      const root = $("#dc-modal-root");
      const mask = document.createElement("div");
      mask.className = "dc-modal-mask";
      const flds = (fields || []).map((f) => {
        const id = "dcf-" + f.id;
        const ctl = f.type === "textarea"
          ? `<textarea id="${id}" rows="${f.rows || 3}" placeholder="${esc(f.ph || "")}">${esc(f.value || "")}</textarea>`
          : `<input class="dc-inp" id="${id}" type="text" placeholder="${esc(f.ph || "")}" value="${esc(f.value || "")}" style="width:100%;box-sizing:border-box">`;
        return `<div class="fld"><label for="${id}">${esc(f.label)}</label>${ctl}</div>`;
      }).join("");
      mask.innerHTML = `<div class="dc-modal"><h3>${title}</h3><div>${body}</div>${flds}${input != null ? `<input class="dc-inp" placeholder="${esc(input.ph || "")}" value="${esc(input.val || "")}">` : ""}<div class="acts"></div></div>`;
      const acts = mask.querySelector(".acts");
      const collect = () => {
        if (fields) { const o = {}; (fields || []).forEach((f) => { o[f.id] = (mask.querySelector("#dcf-" + f.id) || {}).value || ""; }); return o; }
        const inp = mask.querySelector("input.dc-inp:not([id^=dcf-])");
        return inp ? inp.value : undefined;
      };
      actions.forEach((a) => {
        const b = document.createElement("button");
        b.className = a.pr ? "pr" : (a.danger ? "danger" : ""); b.textContent = a.label;
        // fields 表单：回传 {action, value}（标注编辑器需要区分 保存/删除）；input 单字段：回传字符串；纯确认：回传 action id
        b.onclick = () => {
          const v = collect();
          root.innerHTML = "";
          if (a.id === "cancel") return res(null);
          res(fields ? { action: a.id, value: v } : (v !== undefined ? v : a.id));
        };
        acts.appendChild(b);
      });
      mask.addEventListener("click", (e) => { if (e.target === mask) { root.innerHTML = ""; res(null); } });
      root.innerHTML = ""; root.appendChild(mask);
      const first = mask.querySelector("textarea, input"); if (first) first.focus();
    });
  }
  const notify = (title, body) => modal({ title, body, actions: [{ id: "ok", label: "知道了", pr: true }] });

  /* ---------- 写盘（统一走 serve 白名单接口；离线回退 localStorage） ---------- */
  const LS_KEY = { "prototype/edit-overrides.json": "dc-editover", "prototype/annotations.json": "dc-ann", "prototype/products.json": "dc-products", "prototype/variants-index.json": "dc-variants-index" };
  async function writeFile(file, content) {
    const text = typeof content === "string" ? content : JSON.stringify(content, null, 2);
    try {
      const r = await fetch("/__dc_write__", { method: "POST", body: JSON.stringify({ file, content: text }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || r.status);
      return { ok: true, where: "run" };
    } catch (e) {
      const k = LS_KEY[file];
      if (k) localStorage.setItem(k, text);
      return { ok: false, where: k ? "localStorage" : "none", error: String(e.message || e) };
    }
  }
  /** 读 JSON：先服务端，失败回退 localStorage（离线打开 zip 时编辑不丢） */
  async function readJSON(url, lsKey, fallback) {
    try { const r = await fetch(url); if (!r.ok) throw new Error(String(r.status)); return await r.json(); }
    catch { if (lsKey) { try { return JSON.parse(localStorage.getItem(lsKey) || "null") ?? fallback; } catch { /* 忽略坏缓存 */ } } return fallback; }
  }
