#!/usr/bin/env node
/**
 * genvideo.mjs（M99-2）——文/图生视频统一入口（provider 路由 + ffmpeg 归一化）。
 * 用法:
 *   node genvideo.mjs --prompt "<视频提示词>" --out <out.mp4> [--duration 5] [--aspect 16:9] [--also gif|frames|webm]
 *   node genvideo.mjs --brief <brief.json> --out <dir>      # 消费 director 产的 video_prompts[]（逐条生成）
 * provider：Ark Seedance → 可灵 → 万相 → MiniMax（gen/providers.mjs 探测）；
 * 全无 key → exit 3 并写 knowledge/media-request.json（agent-native 协议：宿主 agent 用自配视频工具履约）。
 * 归一化：mp4 必 H.264+faststart；--also gif=palettegen 12fps 480w；frames=1fps 抽帧目录；webm=vp9。
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { execSync } from "node:child_process";
import { arkRequestSpec, officialSkillPath, arkStandardKey, arkStandardVideo } from "./gen/providers.mjs";

const { values } = parseArgs({
  options: {
    prompt: { type: "string" }, out: { type: "string" }, brief: { type: "string" },
    duration: { type: "string", default: "5" }, aspect: { type: "string", default: "16:9" }, "first-frame": { type: "string" },
    also: { type: "string" }, verify: { type: "boolean" }, help: { type: "boolean" },
  },
});
if (values.help) { console.log("用法: node genvideo.mjs --prompt <p> --out <out.mp4> [--also gif|frames|webm] | --brief <brief.json> --out <dir>"); process.exit(0); }

const ff = (cmd) => execSync(cmd, { stdio: "pipe" });
const normalize = (src, out, also) => {
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  ff(`ffmpeg -y -v error -i "${src}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart -an "${out}"`);
  if (!also) return;
  for (const kind of also.split(",")) {
    if (kind === "gif") ff(`ffmpeg -y -v error -i "${out}" -vf "fps=12,scale=480:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse" "${out.replace(/\.mp4$/, ".gif")}"`);
    if (kind === "webm") ff(`ffmpeg -y -v error -i "${out}" -c:v libvpx-vp9 -crf 34 -b:v 0 -an "${out.replace(/\.mp4$/, ".webm")}"`);
    if (kind === "frames") { const d = out.replace(/\.mp4$/, "-frames"); fs.mkdirSync(d, { recursive: true }); ff(`ffmpeg -y -v error -i "${out}" -vf fps=1 "${d}/f-%03d.png"`); }
  }
};

const jobs = [];
if (values.brief) {
  const b = JSON.parse(fs.readFileSync(values.brief, "utf8"));
  (b.video_prompts || []).forEach((v, i) => jobs.push({ prompt: typeof v === "string" ? v : v.prompt, out: path.join(values.out, `video-${String(i + 1).padStart(2, "0")}.mp4`), duration: (typeof v === "object" && v.duration) || +values.duration }));
  if (!jobs.length) { console.error("brief 无 video_prompts"); process.exit(1); }
} else if (values.prompt && values.out) {
  jobs.push({ prompt: values.prompt, out: values.out, duration: +values.duration, firstFrame: values["first-frame"] || null });
} else { console.error("需 --prompt+--out 或 --brief+--out"); process.exit(1); }

if (values.verify) {
  // agent-native 履约校验：宿主 agent 产出的 mp4 归一化+登记（不重新生成）
  const okl = [];
  for (const jb of jobs) {
    if (!fs.existsSync(jb.out)) { console.error("缺履约文件: " + jb.out); continue; }
    try { execSync(`ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of csv=p=0 "${jb.out}"`, { stdio: "pipe" }); }
    catch { console.error("非视频: " + jb.out); continue; }
    normalize(jb.out, jb.out, values.also);
    okl.push({ out: jb.out, engine: "agent-native", prompt: jb.prompt.slice(0, 120) });
  }
  if (!okl.length) process.exit(1);
  console.log(JSON.stringify({ ok: true, videos: okl }, null, 1));
  process.exit(0);
}
const done = [];
// M102 直连档：标准 key 在位+本 session 授权（DC_MEDIA_CONSENT）→ skill 直接履约（后付费，省配额默认 480p/4s/无声）
if (arkStandardKey() && process.env.DC_MEDIA_CONSENT) {
  for (const jb of jobs) {
    try {
      const r = await arkStandardVideo({ prompt: jb.prompt, duration: Math.min(jb.duration || 4, 5), resolution: "480p", firstFrame: jb.firstFrame || null });
      const raw = path.join(path.dirname(path.resolve(jb.out)), ".raw-" + path.basename(jb.out));
      fs.writeFileSync(raw, r.buf);
      normalize(raw, path.resolve(jb.out), values.also);
      fs.rmSync(raw, { force: true });
      done.push({ out: path.resolve(jb.out), engine: r.engine, meta: r.meta, prompt: jb.prompt.slice(0, 120) });
      console.log("video:", path.basename(jb.out), `(${r.engine}, ${r.meta.duration}s, tokens=${r.meta.tokens})`);
    } catch (e) { console.error("直连档失败→回落 defer:", String(e.message).slice(0, 140)); break; }
  }
}
if (!done.length) {
  // M101 教义：skill 不直调生视频——写履约请求（含官方契约规格），宿主 agent 用其已配置 means
  // （官方 byted-ark-seedance-skill / 自配视频工具）产出同路径 mp4 后重跑 --verify 验收
  const req = {
    kind: "video", created_at: new Date().toISOString(), skill: "design-clone",
    consent: "required — 本 session 内用户已批准使用配置模型生视频（DC_MEDIA_CONSENT 或会话内明确同意）",
    official_skill: officialSkillPath("video"),
    items: jobs.map((x) => ({ prompt: x.prompt, out: path.resolve(x.out), duration: x.duration, aspect: values.aspect, spec: arkRequestSpec("video", { prompt: x.prompt, duration: x.duration, ratio: values.aspect }) })),
    acceptance: { ffprobe: true, faststart: true, max_mb: 2, webm: true, poster: true, verify: "node media-verify.mjs --kind video --in <out>" },
  };
  const reqP = path.join(path.dirname(path.resolve(jobs[0].out)), "media-request.json");
  fs.writeFileSync(reqP, JSON.stringify(req, null, 1));
  console.error(`M101 履约请求已写：${reqP}——宿主 agent 请按 spec 用已配置生视频 means（官方 seedance skill 优先）产出同路径 mp4，再重跑本脚本 --verify 验收。`);
  process.exit(3);
}
console.log(JSON.stringify({ ok: true, videos: done }, null, 1));
