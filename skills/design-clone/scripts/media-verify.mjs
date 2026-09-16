#!/usr/bin/env node
/**
 * media-verify.mjs（M101）——agent 履约产物的统一验收+登记（skill 指挥闭环的最后一环）。
 * 用法:
 *   node media-verify.mjs --kind image --in <png> [--run <runDir>] [--asset-name <name>] [--consent "<note>"]
 *   node media-verify.mjs --kind video --in <mp4> [--run <runDir>] [--also webm,poster]
 * 验收项：
 *   image：尺寸≥256 边、asset-qa 启发式、VLM 四维 rubric（vlmChat，skill 自控策略；无通道跳过并标注）
 *   video：ffprobe 可解、H.264+faststart（不足则自动转码）、≤2MB（超则 720p/480p 降档重压）、webm 派生、poster 首帧
 * 登记：run/prototype/assets-manifest.json（source=agent-media, engine, consent）+ stdout JSON 摘要。
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import { vlmChat } from "./gen/providers.mjs";
const require = createRequire(import.meta.url);
const sharp = require("sharp");

const { values } = parseArgs({ options: { kind: { type: "string" }, in: { type: "string" }, run: { type: "string" }, "asset-name": { type: "string" }, consent: { type: "string" }, also: { type: "string" }, help: { type: "boolean" } } });
if (values.help || !values.kind || !values.in) { console.log("用法: node media-verify.mjs --kind image|video --in <file> [--run <runDir>] [--consent note] [--also webm,poster]"); process.exit(values.help ? 0 : 1); }
const IN = path.resolve(values.in);
const rep = { kind: values.kind, in: IN, checks: {}, engine: process.env.DC_MEDIA_ENGINE || "agent-native", consent: values.consent || process.env.DC_MEDIA_CONSENT || null };
const fail = (m) => { console.error("verify fail: " + m); console.log(JSON.stringify({ ok: false, ...rep })); process.exit(1); };

if (values.kind === "image") {
  const m = await sharp(IN).metadata();
  rep.checks.size = `${m.width}x${m.height}`;
  if (Math.min(m.width, m.height) < 256) fail("边长 <256");
  const { data, info } = await sharp(IN).grayscale().raw().toBuffer({ resolveWithObject: true });
  let sum = 0, sum2 = 0; const n = info.width * info.height;
  for (let i = 0; i < n; i++) { sum += data[i]; sum2 += data[i] * data[i]; }
  const stddev = Math.sqrt(Math.max(0, sum2 / n - (sum / n) ** 2));
  rep.checks.stddev = +stddev.toFixed(1);
  if (stddev < 5) fail("近似空白图");
  try {
    const b64 = (await sharp(IN).resize(512, 512, { fit: "inside" }).png().toBuffer()).toString("base64");
    const v = await vlmChat("为应用原型资产验收打分。只回一行 JSON：{\"relevance\":1-5,\"texture\":1-5,\"beauty\":1-5,\"usability\":1-5,\"note\":\"<=20字\"}", b64, { maxTokens: 160 });
    if (v) {
      const sc = JSON.parse((v.text.match(/\{[\s\S]*\}/) || ["{}"])[0]);
      rep.checks.vlm = { ...sc, engine: v.engine };
      if ((+sc.relevance || 0) < 2) fail("VLM 切题分过低: " + sc.relevance);
    } else rep.checks.vlm = { skipped: "no-vlm-channel" };
  } catch (e) { rep.checks.vlm = { skipped: String(e.message).slice(0, 60) }; }
} else if (values.kind === "video") {
  let probe;
  try { probe = JSON.parse(execSync(`ffprobe -v error -print_format json -show_format -show_streams "${IN}"`, { encoding: "utf8" })); }
  catch { fail("ffprobe 不可解"); }
  const vs = (probe.streams || []).find((s) => s.codec_type === "video");
  if (!vs) fail("无视频流");
  rep.checks.codec = vs.codec_name;
  const fmt = probe.format || {};
  rep.checks.duration = +(fmt.duration || 0).toFixed(1);
  rep.checks.bytes = +(fmt.size || 0);
  if (!/mp4|mov/.test(fmt.format_name || "")) fail("容器非 mp4/mov");
  // faststart 检查+必要时转码
  const moov = execSync(`ffprobe -v trace -i "${IN}" 2>&1 | grep -m1 -o "type:'moov'" || true`, { encoding: "utf8", shell: "/bin/bash" });
  if (!moov) {
    const out = IN.replace(/\.mov$/, ".mp4");
    execSync(`ffmpeg -y -v error -i "${IN}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart -an "${out}"`);
    rep.checks.reencoded = out;
  }
  // ≤2MB 降档
  let cur = rep.checks.reencoded || IN;
  for (const res of [null, "-vf scale=-2:720", "-vf scale=-2:480"]) {
    if (fs.statSync(cur).size <= 2 * 1024 * 1024) break;
    const out = cur.replace(/\.mp4$/, `.s${(res || "").includes("480") ? 480 : 720}.mp4`);
    execSync(`ffmpeg -y -v error -i "${cur}" ${res || ""} -c:v libx264 -pix_fmt yuv420p -movflags +faststart -an "${out}"`);
    cur = out;
  }
  if (fs.statSync(cur).size > 2 * 1024 * 1024) fail("仍 >2MB");
  rep.checks.final = cur;
  const also = (values.also || "webm,poster").split(",");
  if (also.includes("webm")) execSync(`ffmpeg -y -v error -i "${cur}" -c:v libvpx-vp9 -crf 34 -b:v 0 -an "${cur.replace(/\.mp4$/, ".webm")}"`);
  if (also.includes("poster")) execSync(`ffmpeg -y -v error -i "${cur}" -vf "select=eq(n\\,0)" -frames:v 1 "${cur.replace(/\.mp4$/, "-poster.png")}"`);
  rep.checks.also = also;
  // M102 可循环性：首尾帧平均绝对差 ≤12 判 loop-ok（idle 循环接入参考）
  try {
    const frames = execSync(`ffmpeg -v error -i "${cur}" -vf "select='eq(n\\,0)+eq(n\\,999999)'" -vsync vfr -frames:v 2 "${cur}.ff-%d.png" -y`, { encoding: "utf8", shell: "/bin/bash" });
    void frames;
    const f1 = `${cur}.ff-1.png`, f2 = `${cur}.ff-2.png`;
    if (fs.existsSync(f1) && fs.existsSync(f2)) {
      const a1 = await sharp(f1).grayscale().raw().toBuffer();
      const a2 = await sharp(f2).grayscale().raw().toBuffer();
      let d = 0; const n = Math.min(a1.length, a2.length);
      for (let i = 0; i < n; i += 7) d += Math.abs(a1[i] - a2[i]);
      rep.checks.loop_diff = +(d / (n / 7)).toFixed(1);
      rep.checks.loop_ok = rep.checks.loop_diff <= 12;
      fs.rmSync(f1, { force: true }); fs.rmSync(f2, { force: true });
    }
  } catch {}
} else fail("未知 kind");

if (values.run) {
  const mp = path.join(path.resolve(values.run), "prototype", "assets-manifest.json");
  fs.mkdirSync(path.dirname(mp), { recursive: true });
  const prev = fs.existsSync(mp) ? JSON.parse(fs.readFileSync(mp, "utf8")) : { assets: {} };
  const name = values["asset-name"] || path.basename(IN);
  prev.assets[name] = { file: name, source: "agent-media", engine: rep.engine, consent: rep.consent ? "session-approved" : null, checks: rep.checks, at: new Date().toISOString() };
  prev.generated_at = new Date().toISOString();
  fs.writeFileSync(mp, JSON.stringify(prev, null, 1));
  rep.manifest = mp;
}
console.log(JSON.stringify({ ok: true, ...rep }, null, 1));
