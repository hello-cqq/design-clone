#!/usr/bin/env node
/**
 * 本地 utility CSS 编译器（M45）：把视图里真正用到的 Tailwind 语法子集编译成 prototype/utilities.css，
 * 从而移除 index.html 对 @tailwindcss/browser CDN 的运行时依赖（离线/file:// / zip 分发完整性 + 供应链面）。
 *
 * 设计取舍：
 *  - 只编译"扫到的"类 → 产物通常 5–15KB，且不引入用不到的规则；
 *  - 任意值（text-[12px] / bg-[var(--x)] / w-[320px] / bg-white/80 / w-1/2）按语法解析；
 *  - 不认识的 token 视为 run 自定义类（如 al-root / card / on / pt），静默跳过；
 *  - 但"长得像 utility 却编译不出规则"的 token 会被列出（--strict 时 exit 4）——多为笔误
 *    （实战抓过 `gap8`：既不是 utility 也无自定义定义，静默失效=视觉 bug）。
 *
 * 用法: node utility-css.mjs --run <runDir> [--out <file>] [--strict] [--views a,b]
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: { run: { type: "string" }, out: { type: "string" }, views: { type: "string" } },
  allowPositionals: true,
});
if (process.argv.includes("--help") || process.argv.includes("-h") || !values.run) {
  console.log("用法: node utility-css.mjs --run <runDir> [--out <file>] [--strict] [--views a,b]");
  process.exit(values.run ? 0 : 1);
}
const strict = process.argv.includes("--strict");
const run = path.resolve(values.run);
const viewsDir = path.join(run, "prototype/views");
const outP = values.out ? path.resolve(values.out) : path.join(run, "prototype/utilities.css");
const only = values.views ? new Set(values.views.split(",")) : null;

/* ---------- scales（Tailwind v4 = 0.25rem 步进） ---------- */
const SP = { 0: 0, 0.5: 2, 1: 4, 1.5: 6, 2: 8, 2.5: 10, 3: 12, 3.5: 14, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 9: 36, 10: 40, 11: 44, 12: 48, 14: 56, 16: 64, 20: 80, 24: 96, 28: 112, 32: 128, 40: 160, 48: 192, 56: 224, 64: 256, 72: 288, 80: 320, 96: 384 };
const RD = { "": 4, none: 0, sm: 2, md: 6, lg: 8, xl: 12, "2xl": 16, "3xl": 24, full: 9999, 10: 10 };
const MW = { xs: 320, sm: 384, md: 448, lg: 512, xl: 576, "2xl": 672, "3xl": 768, "4xl": 896, "5xl": 1024, "6xl": 1152, "7xl": 1280, full: "100%", min: "min-content", max: "max-content", fit: "fit-content" };
const FW = { thin: 100, extralight: 200, light: 300, normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800, black: 900 };
const TR = { tighter: "-0.05em", tight: "-0.025em", normal: "0", wide: "0.025em", wider: "0.05em", widest: "0.1em" };
const SH = { "": "0 1px 3px rgba(0,0,0,.1),0 1px 2px rgba(0,0,0,.06)", sm: "0 1px 2px rgba(0,0,0,.05)", md: "0 4px 6px -1px rgba(0,0,0,.1),0 2px 4px -2px rgba(0,0,0,.1)", lg: "0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -4px rgba(0,0,0,.1)", xl: "0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1)", none: "none" };
const escSel = (tok) => "." + tok.replace(/([/:.[\]%#,()])/g, "\\$1");

/* ---------- 值解析 ---------- */
const frac = (v) => { const m = v.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/); return m ? `${((Number(m[1]) / Number(m[2])) * 100).toFixed(4)}%` : null; };
const arb = (s) => {
  const v = s.slice(1, -1).trim();
  const f = frac(v); if (f) return f;
  if (/^-?\d+(?:\.\d+)?$/.test(v)) return v + "px";
  return v.replace(/_/g, " ");
};
const len = (t, scale = SP) => {
  if (t.startsWith("[")) return arb(t);
  const f = frac(t); if (f) return f;
  if (t === "auto") return "auto";
  if (t === "full") return "100%";
  if (t === "screen") return "100vw";
  if (t === "min") return "min-content";
  if (t === "max") return "max-content";
  if (t === "fit") return "fit-content";
  if (t === "px") return "1px";
  if (scale[t] !== undefined) return scale[t] + "px";
  return null;
};
const hex2rgba = (hex, a) => {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${a})`;
};
const color = (t) => {
  const m = t.match(/^([^\s/]+)(?:\/(\d{1,3}))?$/);
  if (!m) return null;
  const [, base, alpha] = m;
  const a = alpha === undefined ? 1 : Number(alpha) / 100;
  if (base.startsWith("[")) { const v = arb(base); return v.startsWith("#") && a < 1 ? hex2rgba(v, a) : v; }
  if (base === "white") return a < 1 ? `rgba(255,255,255,${a})` : "#fff";
  if (base === "black") return a < 1 ? `rgba(0,0,0,${a})` : "#000";
  if (base === "transparent") return "transparent";
  if (base === "current") return "currentColor";
  return null;
};

/* ---------- 单 token → 声明串（null=不认识） ---------- */
function decl(x, isNeg) {
  const sgn = isNeg ? "-" : "";
  let m;
  if (x === "flex") return "display:flex";
  if (x === "inline-flex") return "display:inline-flex";
  if (x === "grid") return "display:grid";
  if (x === "inline-block") return "display:inline-block";
  if (x === "inline") return "display:inline";
  if (x === "block") return "display:block";
  if (x === "hidden") return "display:none";
  if (x === "contents") return "display:contents";
  if (x === "table") return "display:table";
  if (x === "relative") return "position:relative";
  if (x === "absolute") return "position:absolute";
  if (x === "fixed") return "position:fixed";
  if (x === "sticky") return "position:sticky";
  if (x === "static") return "position:static";
  if ((m = x.match(/^flex-(col|row|wrap|nowrap|col-reverse|row-reverse)$/))) {
    if (m[1] === "wrap") return "flex-wrap:wrap";
    if (m[1] === "nowrap") return "flex-wrap:nowrap";
    return "flex-direction:" + { col: "column", "col-reverse": "column-reverse", row: "row", "row-reverse": "row-reverse" }[m[1]];
  }
  if ((m = x.match(/^flex-(1|auto|none|initial)$/))) return { 1: "flex:1 1 0%", auto: "flex:1 1 auto", none: "flex:none", initial: "flex:0 1 auto" }[m[1]];
  if ((m = x.match(/^(grow|shrink)(-(0|1))?$/))) return `flex-${m[1]}:${m[2] ? 0 : 1}`;
  if ((m = x.match(/^items-(start|end|center|baseline|stretch)$/))) return "align-items:" + m[1];
  if ((m = x.match(/^self-(auto|start|end|center|baseline|stretch)$/))) return "align-self:" + m[1];
  if ((m = x.match(/^justify-(start|end|center|between|around|evenly)$/))) return "justify-content:" + ({ start: "flex-start", end: "flex-end", between: "space-between", around: "space-around", evenly: "space-evenly", center: "center" }[m[1]] || m[1]);
  if ((m = x.match(/^content-(start|end|center|between|around|evenly)$/))) return "align-content:" + ({ start: "flex-start", end: "flex-end", between: "space-between", around: "space-around", evenly: "space-evenly", center: "center" }[m[1]] || m[1]);
  if ((m = x.match(/^place-items-(start|end|center|stretch|baseline)$/))) return "place-items:" + m[1];
  if ((m = x.match(/^gap-(x|y)-(.+)$/))) { const v = len(m[2]); return v == null ? null : `gap-${m[1] === "x" ? "column" : "row"}:${v}`; }
  if ((m = x.match(/^gap-(.+)$/))) { const v = len(m[1]); return v == null ? null : `gap:${v}`; }
  if ((m = x.match(/^space-(x|y)-(.+)$/))) { const v = len(m[2]); return v == null ? null : { sel: " > :not([hidden]) ~ :not([hidden])", d: m[1] === "x" ? `margin-left:${v}` : `margin-top:${v}` }; }
  if ((m = x.match(/^grid-cols-(.+)$/))) return `grid-template-columns:repeat(${m[1].startsWith("[") ? arb(m[1]) : m[1]},minmax(0,1fr))`;
  if ((m = x.match(/^col-span-(\d+)$/))) return `grid-column:span ${m[1]}/span ${m[1]}`;
  if ((m = x.match(/^row-span-(\d+)$/))) return `grid-row:span ${m[1]}/span ${m[1]}`;
  if ((m = x.match(/^p([trblxy])?-(.+)$/))) {
    const v = len(m[2]); if (v == null) return null;
    return side(m[1], "padding", v);
  }
  if ((m = x.match(/^m([trblxy])?-(.+)$/))) {
    if (m[2] === "auto") return side(m[1], "margin", "auto");
    const v = len(m[2]); if (v == null) return null;
    return side(m[1], "margin", sgn + v);
  }
  if ((m = x.match(/^w-(.+)$/))) { const v = len(m[1]); return v == null ? null : `width:${sgn}${v}`; }
  if ((m = x.match(/^h-(.+)$/))) { const v = len(m[1]); return v == null ? null : `height:${v}`; }
  if ((m = x.match(/^min-w-(.+)$/))) { const v = m[1] === "0" ? "0" : len(m[1]); return v == null ? null : `min-width:${v}`; }
  if ((m = x.match(/^min-h-(.+)$/))) { const v = m[1] === "0" ? "0" : len(m[1]); return v == null ? null : `min-height:${v}`; }
  if ((m = x.match(/^max-w-(.+)$/))) { const v = MW[m[1]] !== undefined ? (typeof MW[m[1]] === "number" ? MW[m[1]] + "px" : MW[m[1]]) : len(m[1]); return v == null ? null : `max-width:${v}`; }
  if ((m = x.match(/^max-h-(.+)$/))) { const v = len(m[1]); return v == null ? null : `max-height:${v}`; }
  if ((m = x.match(/^text-(left|center|right|justify)$/))) return "text-align:" + m[1];
  if ((m = x.match(/^text-(.+)$/))) {
    // 任意值歧义：text-[12px]=字号，text-[#fff]/[var(--color-*)]/[rgba(..)]=颜色
    if (m[1].startsWith("[")) {
      const inner = m[1].slice(1, -1).trim();
      const looksColor = /^#|^rgba?\(|^currentcolor|^var\(--[^)]*(color|ink|fg|text)[^)]*\)$/i.test(inner);
      if (looksColor) return `color:${color(m[1])}`;
      const v = len(m[1]);
      return v == null ? null : `font-size:${v}`;
    }
    const c = color(m[1]); if (c) return `color:${c}`;
    const v = len(m[1]); if (v) return `font-size:${v}`;
    return null;
  }
  if ((m = x.match(/^font-(.+)$/))) {
    if (FW[m[1]]) return "font-weight:" + FW[m[1]];
    if (m[1] === "mono") return "font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
    if (m[1] === "sans") return "font-family:ui-sans-serif,system-ui,-apple-system,sans-serif";
    if (m[1] === "serif") return "font-family:ui-serif,Georgia,serif";
    return null;
  }
  if ((m = x.match(/^leading-(.+)$/))) {
    const named = { none: "1", tight: "1.25", snug: "1.375", normal: "1.5", relaxed: "1.625", loose: "2" };
    const v = named[m[1]] !== undefined ? named[m[1]] : len(m[1]);
    return v == null ? null : `line-height:${v}`;
  }
  if ((m = x.match(/^tracking-(.+)$/))) {
    if (m[1].startsWith("[")) return `letter-spacing:${arb(m[1])}`;
    return TR[m[1]] === undefined ? null : `letter-spacing:${TR[m[1]]}`;
  }
  if (x === "truncate") return "overflow:hidden;text-overflow:ellipsis;white-space:nowrap";
  if (x === "underline") return "text-decoration:underline";
  if (x === "line-through") return "text-decoration:line-through";
  if (x === "italic") return "font-style:italic";
  if ((m = x.match(/^whitespace-(normal|nowrap|pre|pre-line|pre-wrap|break-spaces)$/))) return "white-space:" + m[1];
  if ((m = x.match(/^(capitalize|uppercase|lowercase)$/))) return "text-transform:" + m[1];
  if (x === "antialiased") return "-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale";
  if ((m = x.match(/^bg-(.+)$/))) { const c = color(m[1]); return c ? `background-color:${c}` : null; }
  if (x === "border") return "border-width:1px;border-style:solid";
  if ((m = x.match(/^border-(0|2|4|8)$/))) return `border-width:${m[1]}px`;
  if ((m = x.match(/^border-([trblxy])$/))) return side(m[1], "border-W", "1px") + ";border-style:solid";
  if ((m = x.match(/^border-(solid|dashed|dotted|double|none|hidden)$/))) return m[1] === "none" || m[1] === "hidden" ? "border-style:none" : "border-style:" + m[1];
  if ((m = x.match(/^border-(.+)$/))) { const c = color(m[1]); return c ? `border-color:${c}` : null; }
  if ((m = x.match(/^rounded(.*)$/))) {
    const k = m[1] ? m[1].slice(1) : "";
    const corner = { t: ["top-left", "top-right"], b: ["bottom-left", "bottom-right"], l: ["top-left", "bottom-left"], r: ["top-right", "bottom-right"], tl: ["top-left"], tr: ["top-right"], bl: ["bottom-left"], br: ["bottom-right"] };
    const cm = k.match(/^(t|b|l|r|tl|tr|bl|br)-(.+)$/);
    const key = cm ? cm[2] : k;
    let v = RD[key];
    if (v === undefined) { if (!key.startsWith("[")) return null; v = arb(key); }
    else v = v === 9999 ? "9999px" : v + "px";
    const cs = cm ? corner[cm[1]] : ["top-left", "top-right", "bottom-right", "bottom-left"];
    return cs.map((c) => `border-${c}-radius:${v}`).join(";");
  }
  if ((m = x.match(/^shadow(-sm|-md|-lg|-xl|-none)?$/))) return "box-shadow:" + (SH[(m[1] || "").slice(1)] ?? SH[""]);
  if ((m = x.match(/^opacity-(\d{1,3})$/))) return "opacity:" + Number(m[1]) / 100;
  if ((m = x.match(/^overflow-(x|y)-(hidden|auto|visible|scroll)$/))) return `overflow-${m[1]}:${m[2]}`;
  if ((m = x.match(/^overflow-(hidden|auto|visible|scroll)$/))) return "overflow:" + m[1];
  if ((m = x.match(/^object-(top|center|bottom|left|right)$/))) return "object-position:" + m[1];
  if ((m = x.match(/^object-(cover|contain|fill|none|scale-down)$/))) return "object-fit:" + m[1];
  if (x === "inset-0") return "inset:0";
  if (x === "inset-x-0") return "left:0;right:0";
  if (x === "inset-y-0") return "top:0;bottom:0";
  if ((m = x.match(/^(top|left|right|bottom)-(.+)$/))) { const v = len(m[2]); return v == null ? null : `${m[1]}:${sgn}${v}`; }
  if ((m = x.match(/^z-(\d+|auto)$/))) return "z-index:" + m[1];
  if ((m = x.match(/^rotate-(\d+)$/))) return `transform:rotate(${sgn}${m[1]}deg)`;
  if ((m = x.match(/^translate-(x|y)-(.+)$/))) { const v = len(m[2]); return v == null ? null : `transform:translate${m[1].toUpperCase()}(${sgn}${v})`; }
  if ((m = x.match(/^scale-(\d+)$/))) return `transform:scale(${(isNeg ? -1 : 1) * Number(m[1]) / 100})`;
  if ((m = x.match(/^cursor-(pointer|default|not-allowed|text|move|grab|copy|help)$/))) return "cursor:" + m[1];
  if (x === "pointer-events-none") return "pointer-events:none";
  if (x === "pointer-events-auto") return "pointer-events:auto";
  if (x === "select-none") return "user-select:none";
  if (x === "list-none") return "list-style:none";
  if ((m = x.match(/^float-(right|left|none)$/))) return "float:" + m[1];
  if (x === "backdrop-blur") return "backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)";
  if (x === "transition") return "transition:color .15s ease,background-color .15s ease,border-color .15s ease,opacity .15s ease,box-shadow .15s ease,transform .15s ease";
  if ((m = x.match(/^duration-(\d+)$/))) return "transition-duration:" + m[1] + "ms";
  if ((m = x.match(/^ease-(linear|in|out|in-out)$/))) return "transition-timing-function:" + { linear: "linear", in: "cubic-bezier(.4,0,1,1)", out: "cubic-bezier(0,0,.2,1)", "in-out": "cubic-bezier(.4,0,.2,1)" }[m[1]];
  return null;
}
function side(k, prop, v) {
  if (prop === "border-W") {
    const map = { t: ["top"], r: ["right"], b: ["bottom"], l: ["left"], x: ["left", "right"], y: ["top", "bottom"] };
    return map[k].map((s) => `border-${s}-width:${v}`).join(";");
  }
  if (!k) return `${prop}:${v}`;
  const map = { t: ["top"], r: ["right"], b: ["bottom"], l: ["left"], x: ["left", "right"], y: ["top", "bottom"] };
  return map[k].map((s) => `${prop}-${s}:${v}`).join(";");
}

/* ---------- 注册（含变体） ---------- */
const rules = new Map();
function gen(tok) {
  const vm = tok.match(/^(hover|focus|active):(.+)$/);
  if (vm) {
    const r = decl(vm[2], vm[2].startsWith("-"));
    if (!r) return false;
    const [sel, d] = typeof r === "object" ? [escSel(tok) + r.sel, r.d] : [escSel(tok), r];
    add(sel + ":" + vm[1], d);
    return true;
  }
  // 负值前缀（-left-6 / -translate-x-1/2）：剥离后交给 decl，选择器保留原 token
  const neg = tok.startsWith("-");
  const r = decl(neg ? tok.slice(1) : tok, neg);
  if (!r) return false;
  const [sel, d] = typeof r === "object" ? [escSel(tok) + r.sel, r.d] : [escSel(tok), r];
  add(sel, d);
  return true;
}
const add = (sel, d) => { if (!rules.has(sel)) rules.set(sel, d); };

/* ---------- 扫描 ---------- */
const files = fs.readdirSync(viewsDir).filter((f) => f.endsWith(".html")).map((f) => f.replace(".html", "")).filter((v) => !only || only.has(v));
const tokens = new Set();
for (const v of files) {
  const html = fs.readFileSync(path.join(viewsDir, v + ".html"), "utf8");
  for (const m of html.matchAll(/class="([^"]*)"/g)) for (const t of m[1].split(/\s+/)) if (t) tokens.add(t);
}
// 不再用语法白名单预筛（会漏 mt-2/px-8 这类字母后缀）：直接尝试编译；
// 编译不出且"任何样式源里都没有定义"的 token 才报 unknown（真笔误，如实战抓过的 gap8）。
const defined = new Set();
const styleSources = [path.join(run, "prototype/index.html"), path.join(run, "prototype/runtime.js"), path.join(run, "prototype/inspector.css"), ...files.map((v) => path.join(viewsDir, v + ".html"))];
// 组件库路径相对本脚本解析（run 可能在仓库外，如 /tmp 的同步沙盒）
const COMP = path.join(path.dirname(new URL(import.meta.url).pathname), "../../templates/components");
for (const f of fs.readdirSync(COMP).filter((f) => f.endsWith(".css"))) styleSources.push(path.join(COMP, f));
for (const sp of styleSources) {
  let txt = "";
  try { txt = fs.readFileSync(sp, "utf8"); } catch { continue; }
  for (const m of txt.matchAll(/\.([a-zA-Z][\w-]*)/g)) defined.add(m[1]);
}
const unknown = [];
for (const t of tokens) {
  if (gen(t)) continue;
  if (defined.has(t) || defined.has(t.replace(/\\/g, ""))) continue;
  unknown.push(t);
}

/* ---------- 输出 ---------- */
// Preflight 等价物（Tailwind v4 preflight 的子集），:where() 归零特异性以 scoped 到 #dc-stage：
// 不这么做的后果=视图里 h1/p/ul 的 UA margin 回来、box-sizing 变化，布局整体漂移（实测 diff 2.3%）。
// :where 零特异性保证组件库类（.mi-row 的 border-top 等）仍然压得过它。
const PREFLIGHT = `:where(#dc-stage),:where(#dc-stage *),:where(#dc-stage *::before),:where(#dc-stage *::after){box-sizing:border-box;border-width:0;border-style:solid;border-color:currentColor}
:where(#dc-stage){line-height:1.5;-webkit-text-size-adjust:100%}
:where(#dc-stage) :where(h1,h2,h3,h4,h5,h6,p,figure,blockquote,dl,dd,pre){margin:0}
:where(#dc-stage) :where(h1,h2,h3,h4,h5,h6){font-size:inherit;font-weight:inherit}
:where(#dc-stage) :where(ul,ol,menu){list-style:none;margin:0;padding:0}
:where(#dc-stage) :where(img,svg,video,canvas,audio,iframe,embed,object){display:block;vertical-align:middle}
:where(#dc-stage) :where(img,video){max-width:100%;height:auto}
:where(#dc-stage) :where(button,input,optgroup,select,textarea){font:inherit;font-size:100%;color:inherit;margin:0;padding:0}
:where(#dc-stage) :where(button,[role="button"]){cursor:pointer}
:where(#dc-stage) :where(a){color:inherit;text-decoration:inherit}
:where(#dc-stage) :where(table){text-indent:0;border-color:inherit;border-collapse:collapse}
:where(#dc-stage) :where(hr){height:0;color:inherit;border-top-width:1px}
`;
const head = `/* utilities.css —— 由 scripts/gen/utility-css.mjs 生成（M45），替代 @tailwindcss/browser CDN。
 * 只含本 run 视图真实用到的 utility 子集；run 自定义类（如 al-root / card / on）仍由视图内联样式提供。
 * 含 scoped preflight（:where 归零特异性，组件库类仍可覆盖）。
 * 重新生成：node scripts/gen/utility-css.mjs --run <runDir>
 */
${PREFLIGHT}`;
const css = head + [...rules.entries()].map(([sel, d]) => `${sel}{${d}}`).join("\n") + "\n";
fs.mkdirSync(path.dirname(outP), { recursive: true });
fs.writeFileSync(outP, css);
console.log(JSON.stringify({ views: files.length, tokens: tokens.size, compiled: rules.size, bytes: Buffer.byteLength(css), unknownCount: unknown.length, unknown: unknown.slice(0, 24) }));
if (strict && unknown.length) process.exit(4);
