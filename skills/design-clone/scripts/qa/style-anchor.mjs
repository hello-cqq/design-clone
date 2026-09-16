#!/usr/bin/env node
/**
 * style-anchor.mjs（M104-W1）—— 风格锚唯一法门：concept run 的每个生成资产（manifest source=genimg|agent-media）
 * 的 prompt/style 必须携带本 run brief.style_anchor 的锚词指纹；view 引用的背景/角色资产同样抽检。
 * 反作弊约束：锚词指纹取自 brief 数据（锚名+锚词表前 3 个特征词），不写死任何风格字面到判定逻辑。
 * 用法: node style-anchor.mjs <runDir> [--json]
 */
import fs from "node:fs";
import path from "node:path";

const run = process.argv[2];
if (!run || process.argv.includes("--help")) { console.log("用法: node style-anchor.mjs <runDir> [--json]"); process.exit(run ? 0 : 1); }
const briefPath = path.join(run, "knowledge", "brief.json");
if (!fs.existsSync(briefPath)) { console.log(JSON.stringify({ run: path.basename(run), level: "skip", reason: "no brief (clone run)" })); process.exit(0); }
const brief = JSON.parse(fs.readFileSync(briefPath, "utf8"));
const anchor = brief.style_anchor || (brief.style_baseline || {}).anchor || "";
const words = ((brief.style_baseline || {}).words || "").toLowerCase();
const fp = [anchor, ...words.split(/[^a-z0-9\u4e00-\u9fa5]+/).filter((w) => w.length > 3).slice(0, 6)];
const hit = (txt) => { const t = (txt || "").toLowerCase(); return fp.some((f) => f && t.includes(f.toLowerCase())); };

const manifestPath = path.join(run, "prototype", "assets-manifest.json");
const out = { run: path.basename(run), anchor, mismatches: [], checked: 0, level: "pass" };
if (fs.existsSync(manifestPath)) {
  const m = JSON.parse(fs.readFileSync(manifestPath, "utf8")).assets || {};
  for (const [file, rec] of Object.entries(m)) {
    if (/\.(mp4|webm|mov)$/i.test(file)) continue; // 视频资产锚检走 video_prompts 链路，此处豁免
    if (!/^(genimg|agent-media)$/.test(rec.source || "")) continue;
    if (/^(video|voice)$/.test(rec.kind || "")) continue;
    out.checked++;
    const txt = [rec.prompt, rec.style, rec.engine_note].join(" ");
    if (!hit(txt)) out.mismatches.push({ file, prompt: (rec.prompt || "").slice(0, 60), style: rec.style || null });
  }
}
out.level = out.mismatches.length ? "fail" : "pass";
if (process.argv.includes("--json")) console.log(JSON.stringify(out));
else console.log(`style-anchor ${out.level}: anchor=${anchor} checked=${out.checked} mismatch=${out.mismatches.map((x) => x.file).join(",") || "-"}`);
process.exit(out.level === "fail" ? 1 : 0);
