#!/usr/bin/env node
/**
 * 从证据截图裁真实素材（图标/头像/图片）→ prototype/assets/。
 * 用法:
 *   node extract-assets.mjs <runDir> <spec.json>
 *   spec.json: [{ "src": "capture/screens/01-x.png", "bbox": [x,y,w,h], "out": "icon-pay.png" }]
 *   node extract-assets.mjs <runDir> --from-uitree <tree> <screen.png> [--out-prefix p] [--kinds image|icon] [--min-size N] [--region x,y,w,h]
 *     <tree> 三种格式通吃：android uiautomator XML / uitree2spec JSON / web ui-tree JSON（有树必量，bbox 取自真实控件框）
 *     （web 裁 tag=img/svg/canvas 或 role=img；android 裁 ImageView/kind=image；--region 限定区域、行主序命名 p1..pN）
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
const flag = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const outPrefix = flag("--out-prefix", null);
const kinds = flag("--kinds", "image");
const minSize = parseInt(flag("--min-size", "12"), 10);
const region = flag("--region", null) ? flag("--region", "").split(",").map(Number) : null;

/* 统一节点加载：android uiautomator XML / uitree2spec JSON / web ui-tree JSON。有树必量，杜绝手猜 bbox。 */
function loadNodes(p) {
  if (p.toLowerCase().endsWith(".xml")) {
    const xml = fs.readFileSync(p, "utf8");
    const out = []; const re = /<node[^>]*>/g; let m, i = 0;
    while ((m = re.exec(xml))) {
      const g = (k) => { const r = m[0].match(new RegExp(k + '="([^"]*)"')); return r ? r[1] : ""; };
      const bb = g("bounds").match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/); if (!bb) continue;
      const x1 = +bb[1], y1 = +bb[2], x2 = +bb[3], y2 = +bb[4]; const w = x2 - x1, h = y2 - y1;
      if (w <= 4 || h <= 4) continue;
      const cls = g("class");
      out.push({ id: "n" + i++, bbox: [x1, y1, w, h], cls, kind: /ImageView/.test(cls) ? "image" : (g("text") ? "text" : "box") });
    }
    return out;
  }
  const tree = JSON.parse(fs.readFileSync(p, "utf8"));
  const nodes = tree.elements || tree.nodes || tree;
  return Array.isArray(nodes) ? nodes : [];
}
const isImage = (n) => {
  const tag = (n.tag || n.type || "").toLowerCase();
  if (["img", "svg", "canvas", "image"].includes(tag) || n.role === "img") return true;
  if (n.kind === "image") return true;
  if (/ImageView/.test(n.cls || n.class || "")) return true;
  return false;
};
const rectOf = (n) => {
  const r = n.rect || n.bbox || n.bounds;
  if (!r) return null;
  return Array.isArray(r) ? r : [r.x, r.y, r.width, r.height];
};

let spec = [];
const isTree = (a === "--from-uitree");
const manifest = [];
if (a === "--from-uitree") {
  const ti = args.findIndex((p) => path.resolve(p) === b);
  const png = path.resolve(args[ti + 1]);
  let list = loadNodes(b).filter(isImage).map((n) => ({ n, r: rectOf(n) })).filter((e) => e.r);
  if (kinds === "icon") list = list.filter((e) => e.r[2] <= 96 && e.r[3] <= 96);
  if (region) { const [rx, ry, rw, rh] = region; list = list.filter((e) => { const cx = e.r[0] + e.r[2] / 2, cy = e.r[1] + e.r[3] / 2; return cx >= rx && cx <= rx + rw && cy >= ry && cy <= ry + rh; }); }
  list = list.filter((e) => e.r[2] >= minSize && e.r[3] >= minSize);
  list.sort((p, q) => (Math.round(p.r[1] / 24) - Math.round(q.r[1] / 24)) || (p.r[0] - q.r[0])); // 行主序，命名稳定
  let idx = 0;
  for (const { n, r } of list) {
    idx++;
    const tag = (n.tag || n.kind || n.cls || "img").toString().toLowerCase().replace(/[^a-z]/g, "").slice(0, 10) || "img";
    spec.push({ src: path.relative(runDir, png), bbox: r.map(Math.round), out: outPrefix ? `${outPrefix}${idx}.png` : `auto-${idx}-${tag}.png` });
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
  manifest.push({ file: s.out, source: isTree ? "tree-bbox" : "spec", bbox: [x, y, w, h], src: s.src, tree: isTree ? path.relative(runDir, b) : null, at: new Date().toISOString() });
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
// M44c 素材溯源 manifest：每个资产记录来源（tree-bbox/spec/genimg/iconify），供 privacy/asset 门禁核验"头像必须树测量或生图，不得手猜"
if (manifest.length) {
  const mp = path.join(outDir, "..", "assets-manifest.json");
  const prev = fs.existsSync(mp) ? JSON.parse(fs.readFileSync(mp, "utf8")) : { assets: {} };
  for (const m of manifest) prev.assets[m.file] = m;
  prev.generated_at = new Date().toISOString();
  fs.writeFileSync(mp, JSON.stringify(prev, null, 1));
}
console.log(`共 ${spec.length} 个素材 → ${path.relative(process.cwd(), outDir)}`);
