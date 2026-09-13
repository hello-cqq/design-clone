#!/usr/bin/env node
/**
 * ref-images.mjs（M77-W1）——按 brief.json 逐页生参考图（给用户确认+视图构建的艺术方向）。
 * 用法: node ref-images.mjs --run <runDir> [--only <pageId>]
 * 产出: <run>/references/ref-<pageId>.png + references/manifest.json
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";
const { values: V } = parseArgs({ options: { run: { type: "string" }, only: { type: "string" } } });
if (!V.run || process.argv.includes("--help")) { console.log("用法: node ref-images.mjs --run <runDir> [--only pageId]"); process.exit(V.run ? 0 : 1); }
const run = path.resolve(V.run);
const brief = JSON.parse(fs.readFileSync(path.join(run, "knowledge/brief.json"), "utf8"));
const HERE = path.dirname(new URL(import.meta.url).pathname);
const refs = path.join(run, "references");
fs.mkdirSync(refs, { recursive: true });
const manifest = [];
for (const p of brief.pages) {
  if (V.only && p.id !== V.only) continue;
  const out = path.join(refs, `ref-${p.id}.png`);
  if (fs.existsSync(out)) { manifest.push({ page: p.id, file: `references/ref-${p.id}.png` }); continue; }
  const r = spawnSync("node", [path.join(HERE, "..", "genimg.mjs"), "--prompt", p.prompt, "--out", out, "--style", brief.style_anchor, "--w", "768", "--h", "1024"], { encoding: "utf8", stdio: "inherit" });
  if (r.status !== 0) console.log("BAD ref", p.id);
  manifest.push({ page: p.id, file: `references/ref-${p.id}.png` });
}
for (const a of (brief.assets || [])) {
  const out = path.join(refs, `ast-${a.id}.png`);
  if (fs.existsSync(out)) continue;
  spawnSync("node", [path.join(HERE, "..", "genimg.mjs"), "--prompt", a.prompt, "--out", out, "--style", brief.style_anchor, "--w", String(a.w || 768), "--h", String(a.h || 1024)], { encoding: "utf8", stdio: "inherit" });
}
fs.writeFileSync(path.join(refs, "manifest.json"), JSON.stringify({ at: new Date().toISOString(), items: manifest }, null, 2));
console.log("refs done:", manifest.length);
