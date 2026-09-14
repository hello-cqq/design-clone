#!/usr/bin/env node
/**
 * 多引擎生图（免费档优先，sha1 缓存 + 15s 节流 + 退避重试）。
 * 用法: node genimg.mjs --prompt "..." --out assets/mascot.png [--style pixar-3d|clay-icon|sticker|flat]
 *       [--w 512 --h 512] [--seeds 1,2,3] [--ref-url <https://...>]
 * 引擎: pollinations flux（匿名免费）；有 --ref-url 且设 POLLINATIONS_TOKEN 时走 kontext 图生图。
 * 缓存: <out目录>/.cache/<sha1>.png；清单: <out目录>/images.json
 * 兜底链由 agent 编排: crop → iconify → genimg → VLM-SVG → css-clay → emoji
 */
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
const sharp = createRequire(import.meta.url)("sharp");
import { parseArgs } from "node:util";

const STYLES = {
  "pixar-3d": "pixar style 3d render, soft volumetric lighting, detailed fur and textures, subsurface scattering, cinematic still, high quality 3d character",
  "clay-icon": "3d clay icon, soft matte clay material, rounded shapes, gentle studio lighting, solid pastel background, blender render, minimal",
  sticker: "die-cut sticker art, bold clean outline, flat vibrant colors, thin white border",
  flat: "flat vector illustration, minimal geometric shapes, limited palette",
  anime: "anime style character art, clean confident lineart, cel shading with soft gradients, expressive eyes, hand-drawn feel, studio quality key visual, obviously hand-drawn 2d animation cel, NOT photoreal",
  disney: "modern disney-style 2d animation character, warm painterly shading, rounded friendly features, storybook lighting, theatrical color script, hand-painted 2d NOT photoreal",
  illustration: "textured editorial gouache illustration, visible brush strokes and paper grain, matte hand-painted picture-book quality, slightly stylized proportions, muted harmonious palette, cozy imperfect hand-made feel, clearly painted NOT photoreal NOT 3d render",
  cyberpunk: "cyberpunk neon art, rain-slick reflections, magenta-cyan rim light, holographic ui glow, gritty detailed textures, moody night atmosphere",
  guofeng: "Chinese guofeng ink-wash illustration, xuan paper texture, flowing brush lines, subtle mineral pigments, classical poetic composition,留白 negative space",
  photographic: "candid documentary photograph, natural available light, shallow depth of field, real skin texture and fabric detail, slight film grain, unposed moment",
  "flat-corporate": "clean flat corporate illustration, geometric simplified shapes, consistent 2-tone brand palette, crisp edges, professional saas marketing style",
  "shinkai-2.5d": "Makoto Shinkai film style 2.5D anime key visual, clean transparent cinematic lighting, tyndall god rays, luminous sky and sea mirror reflections, delicate hair strand highlights, emotional saturated-yet-soft color script, crisp cel shading with painterly backgrounds, 8k studio key art, obviously hand-drawn anime NOT photoreal NOT plastic",
  "zootopia-3d": "Disney Zootopia-grade cinematic 3D cartoon render, anthropomorphic animal characters with realistic fine fur and fabric materials, soft natural light and volumetrics, juicy translucent macaron palette, rounded modern mobile game UI shapes, OC render 8k, clean uncluttered background, bright playful child-friendly NOT photoreal",
  // M76-W3a: 原神级虚拟人锚点——cel-shading+轮廓光+体积光+景深分层，禁塑料灰底
  "anime-cel": "premium anime key visual (genshin-impact-grade virtual character), crisp cel shading with 2-3 tone steps, strong rim light and subsurface glow on skin, volumetric god rays, atmospheric depth of field with layered background (far sky / mid clouds-light / near subject), saturated yet soft painterly palette, delicate hair strand highlights, cinematic composition, studio key art quality, NOT photoreal NOT plastic symmetric",
};
// M44g 内容安全后缀（不可关闭）：禁低俗/裸露/暗示姿态
const SAFETY = "family-safe content, fully clothed subjects, no nudity or partial nudity, no suggestive pose or framing";
// M44e 反 AI 味后缀：破除"塑料对称灰底"特征（可 --no-anti 关闭）
const ANTI_TELL = "asymmetric composition and lighting, natural imperfections and fine texture detail, avoid plastic glossy skin, avoid perfect symmetry, avoid plain studio gray background, cohesive art-directed color palette";


if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("多引擎生图（免费档优先，sha1 缓存 + 15s 节流 + 退避重试）。\n用法: node genimg.mjs --prompt \"...\" --out assets/mascot.png [--style pixar-3d|clay-icon|sticker|flat]\n引擎: pollinations flux（匿名免费）；有 --ref-url 且设 POLLINATIONS_TOKEN 时走 kontext 图生图。\n缓存: <out目录>/.cache/<sha1>.png；清单: <out目录>/images.json");
  process.exit(0);
}
const { values } = parseArgs({
  options: {
    prompt: { type: "string" }, out: { type: "string" }, style: { type: "string" },
    w: { type: "string", default: "512" }, h: { type: "string", default: "512" },
    seeds: { type: "string" }, "ref-url": { type: "string" }, "no-anti": { type: "boolean", default: false },
  },
});
if (!values.prompt || !values.out) {
  console.log("用法: node genimg.mjs --prompt \"...\" --out <file> [--style pixar-3d|clay-icon|sticker|flat|anime|anime-cel|shinkai-2.5d|zootopia-3d|disney|illustration|cyberpunk|guofeng|photographic|flat-corporate] [--seeds 1,2,3] [--no-anti]");
  process.exit(1);
}
const full = [values.prompt, values.style ? (STYLES[values.style] || "") : "", SAFETY, values["no-anti"] ? "" : ANTI_TELL].filter(Boolean).join(", ");
const outAbs = path.resolve(values.out);
const outDir = path.dirname(outAbs);
const cacheDir = path.join(outDir, ".cache");
fs.mkdirSync(cacheDir, { recursive: true });

const seeds = values.seeds ? values.seeds.split(",").map(Number) : [42];
let last = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchImg(url) {
  for (let i = 0; i < 4; i++) {
    const wait = Math.max(0, last + 15500 - Date.now());
    if (wait) await sleep(wait);
    last = Date.now();
    const res = await fetch(url);
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    console.error(`retry ${i + 1}: HTTP ${res.status}`);
    await sleep(5000 * 2 ** i);
  }
  throw new Error("genimg failed after retries");
}

const manifest = path.join(outDir, "images.json");
const list = fs.existsSync(manifest) ? JSON.parse(fs.readFileSync(manifest, "utf8")) : [];

for (const seed of seeds) {
  const key = crypto.createHash("sha1").update(JSON.stringify([full, values.style || "", values.w, values.h, seed, values["ref-url"] || ""])).digest("hex");
  const cached = path.join(cacheDir, key + ".png");
  const target = seeds.length > 1 ? outAbs.replace(/(\.\w+)$/, `-${seed}$1`) : outAbs;
  const wmErase = async (f) => {
    try {
      const meta = await sharp(f).metadata();
      const r = spawnSync("node", [path.join(HERE, "gen", "patch-erase.mjs"), "--in", f, "--out", f + ".wm", "--mask", `rect:${meta.width - 165},${meta.height - 36},165,36`, "--feather", "8"], { encoding: "utf8" });
      if (r.status === 0 && fs.existsSync(f + ".wm")) fs.renameSync(f + ".wm", f);
      // M81: 水印位置不定（右下/底中）→ 补擦底中带
      const r2 = spawnSync("node", [path.join(HERE, "gen", "patch-erase.mjs"), "--in", f, "--out", f + ".wm2", "--mask", `rect:${Math.round(meta.width * 0.28)},${meta.height - 34},${Math.round(meta.width * 0.5)},34`, "--feather", "8"], { encoding: "utf8" });
      if (r2.status === 0 && fs.existsSync(f + ".wm2")) fs.renameSync(f + ".wm2", f);
    } catch {}
  };
  if (fs.existsSync(cached)) {
    fs.copyFileSync(cached, target);
    await wmErase(target); // M77: 缓存命中也擦水印
    console.log("cache hit:", path.basename(target));
  } else {
    const model = values["ref-url"] && process.env.POLLINATIONS_TOKEN ? "kontext" : "flux";
    const u = new URL(`https://image.pollinations.ai/prompt/${encodeURIComponent(full)}`);
    u.searchParams.set("model", model);
    u.searchParams.set("width", values.w);
    u.searchParams.set("height", values.h);
    u.searchParams.set("seed", String(seed));
    u.searchParams.set("nologo", "true");
    if (model === "kontext") u.searchParams.set("image", values["ref-url"]);
    const buf = await fetchImg(u.href);
    fs.writeFileSync(cached, buf);
    fs.copyFileSync(cached, target);
    await wmErase(target); // M76-W3c: 匿名档 flux 仍盖 pollinations 水印（nologo 无效）→ 落盘即擦
    console.log("generated:", path.basename(target), `(${model}, seed ${seed})`);
  }
  list.push({ at: new Date().toISOString(), prompt: values.prompt, style: values.style || null, seed, engine: "pollinations", out: path.basename(target) });
}
fs.writeFileSync(manifest, JSON.stringify(list, null, 2));
// M44c 素材溯源：生图资产登记进 prototype/assets-manifest.json（source=genimg），供 privacy/asset 门禁核验
{
  const mp = path.join(outDir, "..", "assets-manifest.json");
  if (path.basename(outDir) === "assets") {
    try {
      const prev = fs.existsSync(mp) ? JSON.parse(fs.readFileSync(mp, "utf8")) : { assets: {} };
      for (const seed of seeds) {
        const target = seeds.length > 1 ? outAbs.replace(/(\.\w+)$/, `-${seed}$1`) : outAbs;
        prev.assets[path.basename(target)] = { file: path.basename(target), source: "genimg", prompt: values.prompt, style: values.style || null, seed, at: new Date().toISOString() };
      }
      prev.generated_at = new Date().toISOString();
      fs.writeFileSync(mp, JSON.stringify(prev, null, 1));
    } catch (e) { console.warn("manifest skip:", e.message.slice(0, 80)); }
  }
}
