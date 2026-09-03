#!/usr/bin/env node
/**
 * 从证据截图裁真实素材（图标/头像/图片）→ prototype/assets/。
 * 用法:
 *   node extract-assets.mjs <runDir> <spec.json>
 *   spec.json: [{ "src": "capture/screens/01-x.png", "bbox": [x,y,w,h], "out": "icon-pay.png" }]
 *   node extract-assets.mjs <runDir> --from-uitree <uitree.json> <screen.png>
 *     （web 目标自动档：裁 tag 为 img/svg/canvas 或 role=img 的元素 rect）
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("用法:\nnode extract-assets.mjs <runDir> <spec.json>\nnode extract-assets.mjs <runDir> --from-uitree <uitree.json> <screen.png>\n质量守卫：每次裁剪自动算清晰度（Laplacian 方差）与空白帧（stddev），过低即警告。");
  process.exit(0);
}

async function quality(base) {
  const { data, info } = await base.clone().greyscale().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, n = w * h;
  let sum = 0, sum2 = 0;
  for (let i = 0; i < n; i++) { sum += data[i]; sum2 += data[i] * data[i]; }
  const stddev = Math.sqrt(Math.max(0, sum2 / n - (sum / n) ** 2));
  let ls = 0, ls2 = 0, m = 0;
  for (let y = 1; y < h - 1; y += 2)
    for (let x = 1; x < w - 1; x += 2) {
      const i = y * w + x;
      const v = 4 * data[i] - data[i - 1] - data[i + 1] - data[i - w] - data[i + w];
      ls += v; ls2 += v * v; m++;
    }
  const lm = ls / m;
  return { stddev: +stddev.toFixed(1), sharp: +(ls2 / m - lm * lm).toFixed(1), blank: stddev < 6 };
}


const args = process.argv.slice(2);
const runDir = path.resolve(args[0]);
const outDir = path.join(runDir, "prototype", "assets");
fs.mkdirSync(outDir, { recursive: true });

/* iconify 薄索引档：--icon set/name [--icon ...] --color #hex —— 免 key 拉矢量并缓存 */
if (args.includes("--icon")) {
  const icons = [];
  for (let i = 0; i < args.length; i++) if (args[i] === "--icon") icons.push(args[++i]);
  const color = args.includes("--color") ? args[args.indexOf("--color") + 1] : null;
  fs.mkdirSync(path.join(outDir, ".cache"), { recursive: true });
  for (const ic of icons) {
    const [set, name] = ic.split("/");
    const cache = path.join(outDir, ".cache", `icon-${set}-${name}.svg`);
    if (!fs.existsSync(cache)) {
      const res = await fetch(`https://api.iconify.design/${set}/${name}.svg`);
      if (!res.ok) { console.error("iconify fail:", ic, res.status); continue; }
      fs.writeFileSync(cache, await res.text());
    }
    let svg = fs.readFileSync(cache, "utf8");
    if (color) svg = svg.replaceAll("currentColor", color);
    const out = `${name}.svg`;
    fs.writeFileSync(path.join(outDir, out), svg);
    console.log("icon:", out, `(${ic}${color ? " " + color : ""})`);
  }
  process.exit(0);
}

const [a, b] = args.slice(1).map((p) => (p.startsWith("-") ? p : path.resolve(p)));
let spec = [];
if (a === "--from-uitree") {
  const tree = JSON.parse(fs.readFileSync(b, "utf8"));
  const png = path.resolve(process.argv[4]);
  const nodes = tree.elements || tree.nodes || tree;
  const list = Array.isArray(nodes) ? nodes : [];
  for (const n of list) {
    const tag = (n.tag || n.type || "").toLowerCase();
    if (!["img", "svg", "canvas", "image"].includes(tag) && n.role !== "img") continue;
    const r = n.rect || n.bbox || n.bounds;
    if (!r) continue;
    const [x, y, w, h] = Array.isArray(r) ? r : [r.x, r.y, r.width, r.height];
    if (w < 12 || h < 12) continue;
    spec.push({ src: path.relative(runDir, png), bbox: [x, y, w, h], out: `auto-${spec.length + 1}-${tag}.png` });
  }
} else {
  spec = JSON.parse(fs.readFileSync(a, "utf8"));
}

for (const s of spec) {
  const [x, y, w, h] = s.bbox.map(Math.round);
  let base = sharp(path.join(runDir, s.src)).extract({ left: x, top: y, width: w, height: h });
  if (s.trim) base = base.trim({ threshold: s.trim_thr ?? 24 });
  if (s.icon) base = base.resize({ width: Math.max(56, s.icon_size ?? 56), kernel: "lanczos3" });
  const q = await quality(base);
  if (q.blank) console.warn(`⚠ ${s.out}: 疑似空白/纯色帧（stddev=${q.stddev}），重选源帧或 bbox`);
  else if (q.sharp < (s.min_sharp ?? 12)) console.warn(`⚠ ${s.out}: 清晰度低（lap-var=${q.sharp}），源帧模糊或 bbox 过界，建议换帧/收紧 bbox`);
  if (s.matte === "light") {
    const thr = s.matte_thr || 205, fe = s.matte_feather || 45;
    const rgb = await base.clone().raw().toBuffer({ resolveWithObject: true });
    const g = await base.clone().greyscale().raw().toBuffer({ resolveWithObject: true });
    const alpha = Buffer.alloc(g.info.width * g.info.height);
    for (let i = 0; i < alpha.length; i++) {
      const l = g.data[i];
      alpha[i] = l >= thr ? 0 : l <= thr - fe ? 255 : Math.round(((thr - l) / fe) * 255);
    }
    for (const [ex, ey, ew, eh] of s.erase || [])
      for (let yy = ey; yy < Math.min(ey + eh, g.info.height); yy++)
        for (let xx = ex; xx < Math.min(ex + ew, g.info.width); xx++) alpha[yy * g.info.width + xx] = 0;
    await sharp(rgb.data, { raw: { width: rgb.info.width, height: rgb.info.height, channels: 3 } })
      .joinChannel(alpha, { raw: { width: g.info.width, height: g.info.height, channels: 1 } })
      .png()
      .toFile(path.join(outDir, s.out));
    console.log("cropped+matte:", s.out, `${w}x${h}`);
  } else {
    await base.png().toFile(path.join(outDir, s.out));
    console.log("cropped:", s.out, `${w}x${h}`);
  }
}
console.log(`共 ${spec.length} 个素材 → ${path.relative(process.cwd(), outDir)}`);
