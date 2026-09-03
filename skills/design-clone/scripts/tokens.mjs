#!/usr/bin/env node
/**
 * 从截图中提取设计 tokens（主色/背景/文字色），输出 tokens.css + tokens.json。
 *
 * 用法:
 *   node tokens.mjs <screens目录或图片文件...> --out <knowledge目录>
 *
 * 字体与间距无法从截图可靠提取，tokens.json 中留空由宿主 agent 阅读截图后补齐。
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { createRequire } from "node:module";


if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("用法:\nnode tokens.mjs <screens目录或图片文件...> --out <knowledge目录>");
  process.exit(0);
}
const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { out: { type: "string" } },
});

if (!positionals.length || !values.out) {
  console.log("用法: node tokens.mjs <screens目录或图片...> --out <knowledge目录>");
  process.exit(1);
}

const req = createRequire(import.meta.url);
const sharp = req("sharp");

let images = [];
for (const p of positionals) {
  if (fs.statSync(p).isDirectory()) {
    images.push(...fs.readdirSync(p).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort().map((f) => path.join(p, f)));
  } else images.push(p);
}
if (!images.length) { console.error("未找到图片"); process.exit(1); }
images = images.slice(0, 30);

const buckets = new Map();
const edgeBuckets = new Map();

function key(r, g, b) {
  return `${(r >> 4) << 4},${(g >> 4) << 4},${(b >> 4) << 4}`;
}

for (const img of images) {
  const { data, info } = await sharp(img).resize(512, 512, { fit: "fill" }).raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const k = key(r, g, b);
      buckets.set(k, (buckets.get(k) || 0) + 1);
      if (x < 24 || x >= info.width - 24 || y < 24 || y >= info.height - 24) {
        edgeBuckets.set(k, (edgeBuckets.get(k) || 0) + 1);
      }
    }
  }
}

function toHex([r, g, b]) {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}
function sat([r, g, b]) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  return mx === 0 ? 0 : (mx - mn) / mx;
}
function lum([r, g, b]) { return 0.299 * r + 0.587 * g + 0.114 * b; }

const sorted = [...buckets.entries()].sort((a, b) => b[1] - a[1]).map(([k, c]) => ({ rgb: k.split(",").map(Number), count: c }));

const bg = [...edgeBuckets.entries()].sort((a, b) => b[1] - a[1])[0][0].split(",").map(Number);
const primary = sorted.find((c) => sat(c.rgb) > 0.35 && c.count > sorted[0].count * 0.01)?.rgb;
const total = sorted.reduce((a, c) => a + c.count, 0);
const darkCandidates = sorted.filter((c) => lum(c.rgb) < lum(bg) - 60 && c.count > total * 0.001);
const textPrimary = darkCandidates.sort((a, b) => lum(a.rgb) - lum(b.rgb))[0]?.rgb || [0, 0, 0];
const surface = sorted.find((c) => {
  const d = Math.abs(c.rgb[0] - bg[0]) + Math.abs(c.rgb[1] - bg[1]) + Math.abs(c.rgb[2] - bg[2]);
  return d > 12 && d < 120 && sat(c.rgb) < 0.15;
})?.rgb;
const accent = sorted.find((c) => primary && sat(c.rgb) > 0.35 && toHex(c.rgb) !== toHex(primary))?.rgb;

const tokens = {
  _note: "colors 为自动提取；typography/spacing/radius 由 agent 阅读截图补齐",
  source_images: images.length,
  colors: {
    primary: primary ? toHex(primary) : null,
    accent: accent ? toHex(accent) : null,
    bg: toHex(bg),
    surface: surface ? toHex(surface) : null,
    text_primary: toHex(textPrimary),
    text_secondary: null,
    border: null,
  },
  typography: { display: null, body: null, scale: null },
  spacing: null,
  radius: null,
};

fs.mkdirSync(values.out, { recursive: true });
fs.writeFileSync(path.join(values.out, "tokens.json"), JSON.stringify(tokens, null, 2));

const body = `  --color-primary: ${tokens.colors.primary || "#0a84ff"};
  --color-accent: ${tokens.colors.accent || tokens.colors.primary || "#0a84ff"};
  --color-bg: ${tokens.colors.bg};
  --color-surface: ${tokens.colors.surface || "#ffffff"};
  --color-text-primary: ${tokens.colors.text_primary};
  --color-text-secondary: ${tokens.colors.text_secondary || "#666666"};
  --color-border: ${tokens.colors.border || "#e5e5e5"};
  --font-display: ${tokens.typography.display ? `"${tokens.typography.display}"` : "system-ui, sans-serif"};
  --font-body: ${tokens.typography.body ? `"${tokens.typography.body}"` : "system-ui, sans-serif"};
  --radius-card: ${tokens.radius || "12px"};`;
/* :root 为浏览器裸 <link> 生效源（@theme 仅 Tailwind v4 消费），双写防 LESSONS#47/#56 */
const css = `/* design-clone 自动提取的设计 tokens —— 原型只引用变量，禁止硬编码色值 */
/* 字体/间距由 agent 补齐后保持变量名不变 */
:root {
${body}
}
@theme {
${body}
}
`;
fs.writeFileSync(path.join(values.out, "tokens.css"), css);
console.log(`✅ tokens 已提取（${images.length} 张图）→ ${path.join(values.out, "tokens.css")}`);
console.log(JSON.stringify(tokens.colors, null, 2));
