#!/usr/bin/env node
/**
 * M16 warn retrofit：emoji→内联 SVG（lucide 风格，inline style 赢全局 svg CSS）、
 * 低对比色值→达标色值（映射表经 ratio≥4.5 校验）。
 * 用法: node retrofit.mjs [views目录...]（不带参数=扫描全部 run 的 prototype/views）
 */
import fs from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const RUNS = path.join(HERE, "../../../design-clone-runs");

const SVG_OPEN = '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;vertical-align:-0.12em">';
const ic = (d) => SVG_OPEN + d + "</svg>";
const EMOJI = {
  "🏡": ic('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>'),
  "👗": ic('<path d="M9 3 4 6l2 4 2-1v12h8V9l2 1 2-4-5-3-2 2z"/>'),
  "🐾": ic('<circle cx="8" cy="7" r="2"/><circle cx="16" cy="7" r="2"/><circle cx="5" cy="11.5" r="1.7"/><circle cx="19" cy="11.5" r="1.7"/><path d="M12 10c-3 0-6 3.2-6 5.6S9 19.5 12 19.5s6-1.5 6-3.9S15 10 12 10z"/>'),
  "📖": ic('<path d="M2 4h7a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-7a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h7z"/>'),
  "👤": ic('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>'),
  "🍽️": ic('<path d="M7 3v8"/><path d="M4 3v5a3 3 0 0 0 6 0V3"/><path d="M17 3c-2 3-2 7 0 9v9"/>'),
  "👏": ic('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>'),
  "🎾": ic('<circle cx="12" cy="12" r="9"/><path d="M4.8 8.5a9 9 0 0 0 14.4 0"/><path d="M4.8 15.5a9 9 0 0 1 14.4 0"/>'),
  "🛁": ic('<path d="M3 12h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5z"/><path d="M6 12V5a2 2 0 0 1 4 0"/>'),
  "📷": ic('<path d="M4 8h3l2-3h6l2 3h3v12H4z"/><circle cx="12" cy="13" r="3.5"/>'),
  "✏️": ic('<path d="M4 20l1-4L17 4l3 3L8 19z"/>'),
  "🐛": ic('<circle cx="12" cy="14" r="5"/><path d="M12 9V6"/><path d="M7 14H4"/><path d="M20 14h-3"/><path d="M8 10 6 8"/><path d="M16 10l2-2"/>'),
  "💊": ic('<rect x="3" y="9.5" width="18" height="6" rx="3"/><path d="M12 9.5v6"/>'),
  "🌙": ic('<path d="M20 14A8 8 0 1 1 10 4a7 7 0 0 0 10 10z"/>'),
  "🐈": ic('<circle cx="12" cy="13" r="7"/><path d="M6.5 8 5 3l4 2.5"/><path d="M17.5 8 19 3l-4 2.5"/>'),
  "🐆": ic('<circle cx="12" cy="13" r="7"/><path d="M6.5 8 5 3l4 2.5"/><path d="M17.5 8 19 3l-4 2.5"/>'),
  "🐱": ic('<circle cx="12" cy="13" r="7"/><path d="M6.5 8 5 3l4 2.5"/><path d="M17.5 8 19 3l-4 2.5"/>'),
  "😺": ic('<circle cx="12" cy="13" r="7"/><path d="M6.5 8 5 3l4 2.5"/><path d="M17.5 8 19 3l-4 2.5"/>'),
  "😸": ic('<circle cx="12" cy="13" r="7"/><path d="M6.5 8 5 3l4 2.5"/><path d="M17.5 8 19 3l-4 2.5"/>'),
  "🎅": ic('<path d="M4 15a8 8 0 0 1 16 0"/><path d="M4 15h16v3H4z"/><circle cx="12" cy="5" r="1.5"/>'),
  "🧢": ic('<path d="M4 14a8 8 0 0 1 16 0"/><path d="M4 14h16v2H4z"/><path d="M20 15h3"/>'),
  "👕": ic('<path d="M9 3 4 6l2 4 2-1v12h8V9l2 1 2-4-5-3-2 2z"/>'),
  "🖌️": ic('<path d="m15 4 5 5L9 20H4v-5z"/>'),
  "🎀": ic('<circle cx="12" cy="9" r="3"/><path d="M9.5 11 6 21l6-4 6 4-3.5-10"/>'),
  "✓": ic('<path d="m5 13 4 4L19 7"/>'),
  "🗒": ic('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6"/><path d="M9 12h6"/>'),
  "🎙": ic('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>'),
  "✦": ic('<path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z"/>'),
  "💭": ic('<path d="M4 6h16v10H9l-5 4z"/>'),
  "💗": ic('<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>'),
  "🔍": ic('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  "💡": ic('<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 1 4 10.5c-.8.7-1 1.5-1 2.5h-6c0-1-.2-1.8-1-2.5A6 6 0 0 1 12 3z"/>'),
  "💺": ic('<path d="M7 4h10v8H7z"/><path d="M5 12h14l1 8H4z"/>'),
  "✾": ic('<path d="M12 4v16"/><path d="M5 8l14 8"/><path d="M19 8L5 16"/>'),
  "🛋": ic('<path d="M6 10V8a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v2"/><path d="M3 12a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v6H3z"/>'),
  "❄": ic('<path d="M12 3v18"/><path d="M5 7l14 10"/><path d="M19 7L5 17"/>'),
  "♨": ic('<path d="M8 3c-1 2 1 3 0 5"/><path d="M12 3c-1 2 1 3 0 5"/><path d="M16 3c-1 2 1 3 0 5"/><path d="M5 12h14v2a7 7 0 0 1-14 0z"/>'),
  "🌱": ic('<path d="M12 20v-8"/><path d="M12 12C12 8 9 6 5 6c0 4 3 6 7 6"/><path d="M12 12c0-4 3-6 7-6 0 4-3 6-7 6"/>'),
  "➤": ic('<path d="M5 4l14 8-14 8z"/>'),
  "⚡": ic('<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>'),
  "🚘": ic('<path d="M4 16l1.5-5h13L20 16"/><rect x="3" y="16" width="18" height="4" rx="1"/><circle cx="7.5" cy="20" r="1.5"/><circle cx="16.5" cy="20" r="1.5"/>'),
  "♫": ic('<path d="M9 18V6l10-2v11"/><circle cx="7" cy="18" r="2.5"/><circle cx="17" cy="15" r="2.5"/>'),
  "☾": ic('<path d="M20 14A8 8 0 1 1 10 4a7 7 0 0 0 10 10z"/>'),
  "♡": ic('<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>'),
  "✎": ic('<path d="M4 20l1-4L17 4l3 3L8 19z"/>'),
  "✕": ic('<path d="M6 6l12 12"/><path d="M18 6L6 18"/>'),
};
const COLORS = [
  ["#666666", "#5c5c5c"], ["#666", "#5c5c5c"],
  ["#3fb14a", "#2f7d3b"],
  ["#d9a05f", "#8a5a26"],
  ["#e05a5a", "#c23c3c"],
  ["#b9885c", "#7d5533"],
  ["#828282", "#6f6f6f"],
  ["#ff6600", "#c24e00"], ["#f60", "#c24e00"],
  ["#999999", "#767676"], ["#999", "#767676"],
  ["#b1b3ac", "#5f615a"],
  ["#8a97a3", "#5d6b79"],
  ["#d96c7f", "#a94459"],
  ["#f2a7b3", "#b0566a"],
  ["#b2b2b2", "#767676"],
  ["#2cad68", "#1f7a48"],
  ["#07c160", "#0b6b3f"],
  ["#2aa8d8", "#1a7ca3"],
  ["#f2600c", "#c24e00"],
  ["#8a5f4b", "#6f4a33"],
  ["#7fa8c9", "#4a7396"],
  ["#f5efe4", "#ffffff"],
  ["#2080e0", "#1266b3"],
  ["#e8302a", "#c62828"],
  ["#f05000", "#c24e00"],
  ["#4cc7f5", "#0f6d94"],
  ["#7fe8ea", "#0f6d94"],
  ["#333333", "#1a1a1a"], ["#333", "#1a1a1a"],
  ["#ff6666", "#f25555"],
];

function findTargets() {
  const out = [];
  if (!fs.existsSync(RUNS)) return out;
  for (const e of fs.readdirSync(RUNS)) {
    const v = path.join(RUNS, e, "prototype");
    if (fs.existsSync(v)) out.push(v);
    const t = path.join(RUNS, e, "knowledge", "tokens.css");
    if (fs.existsSync(t)) out.push(t);
  }
  return out;
}

const dirs = process.argv.slice(2).filter((a) => !a.startsWith("-")).map((p) => path.resolve(p));
let files = 0, swaps = 0;
const walk = (d) => {
  const out = [];
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (/\.(html|css)$/.test(e.name) && !/^inspector\./.test(e.name)) out.push(p);
  }
  return out;
};
for (const dir of (dirs.length ? dirs : findTargets())) {
  const targets = fs.statSync(dir).isDirectory() ? walk(dir) : [dir];
  for (const p of targets) {
    let s = fs.readFileSync(p, "utf8");
    const before = s;
    for (const [e, svg] of Object.entries(EMOJI)) {
      if (s.includes(e)) { s = s.split(e + "️").join(svg); s = s.split(e).join(svg); swaps++; }
    }
    for (const [a, b] of COLORS) {
      const re = new RegExp(a.replace("#", "\\#") + "(?![0-9a-f])", "gi");
      if (re.test(s)) { s = s.replace(re, b); swaps++; }
    }
    if (s !== before) { fs.writeFileSync(p, s); files++; console.log("patched:", p); }
  }
}
console.log(`retrofit done: ${files} files, ${swaps} swap kinds`);
