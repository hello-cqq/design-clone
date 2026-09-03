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
import path from "node:path";
import crypto from "node:crypto";
import { parseArgs } from "node:util";

const STYLES = {
  "pixar-3d": "pixar style 3d render, soft volumetric lighting, detailed fur and textures, subsurface scattering, cinematic still, high quality 3d character",
  "clay-icon": "3d clay icon, soft matte clay material, rounded shapes, gentle studio lighting, solid pastel background, blender render, minimal",
  sticker: "die-cut sticker art, bold clean outline, flat vibrant colors, thin white border",
  flat: "flat vector illustration, minimal geometric shapes, limited palette",
};


if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("多引擎生图（免费档优先，sha1 缓存 + 15s 节流 + 退避重试）。\n用法: node genimg.mjs --prompt \"...\" --out assets/mascot.png [--style pixar-3d|clay-icon|sticker|flat]\n引擎: pollinations flux（匿名免费）；有 --ref-url 且设 POLLINATIONS_TOKEN 时走 kontext 图生图。\n缓存: <out目录>/.cache/<sha1>.png；清单: <out目录>/images.json");
  process.exit(0);
}
const { values } = parseArgs({
  options: {
    prompt: { type: "string" }, out: { type: "string" }, style: { type: "string" },
    w: { type: "string", default: "512" }, h: { type: "string", default: "512" },
    seeds: { type: "string" }, "ref-url": { type: "string" },
  },
});
if (!values.prompt || !values.out) {
  console.log("用法: node genimg.mjs --prompt \"...\" --out <file> [--style ...] [--seeds 1,2,3]");
  process.exit(1);
}
const full = values.style ? `${values.prompt}, ${STYLES[values.style] || ""}` : values.prompt;
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
  const key = crypto.createHash("sha1").update(JSON.stringify([full, values.w, values.h, seed, values["ref-url"] || ""])).digest("hex");
  const cached = path.join(cacheDir, key + ".png");
  const target = seeds.length > 1 ? outAbs.replace(/(\.\w+)$/, `-${seed}$1`) : outAbs;
  if (fs.existsSync(cached)) {
    fs.copyFileSync(cached, target);
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
    console.log("generated:", path.basename(target), `(${model}, seed ${seed})`);
  }
  list.push({ at: new Date().toISOString(), prompt: values.prompt, style: values.style || null, seed, engine: "pollinations", out: path.basename(target) });
}
fs.writeFileSync(manifest, JSON.stringify(list, null, 2));
