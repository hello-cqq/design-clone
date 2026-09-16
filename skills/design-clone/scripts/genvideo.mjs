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
import { genVideo } from "./gen/providers.mjs";

const { values } = parseArgs({
  options: {
    prompt: { type: "string" }, out: { type: "string" }, brief: { type: "string" },
    duration: { type: "string", default: "5" }, aspect: { type: "string", default: "16:9" },
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
  jobs.push({ prompt: values.prompt, out: values.out, duration: +values.duration });
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
const tmp = path.join(path.dirname(path.resolve(jobs[0].out)), ".genvideo-tmp");
fs.mkdirSync(tmp, { recursive: true });
const done = [];
for (const jb of jobs) {
  const r = await genVideo({ prompt: jb.prompt, duration: jb.duration, aspect: values.aspect });
  if (!r) break;
  const raw = path.join(tmp, path.basename(jb.out) + ".raw.mp4");
  fs.writeFileSync(raw, r.buf);
  normalize(raw, jb.out, values.also);
  done.push({ out: jb.out, engine: r.engine, prompt: jb.prompt.slice(0, 120) });
  console.log("video:", path.basename(jb.out), `(${r.engine})`);
}
fs.rmSync(tmp, { recursive: true, force: true });
if (!done.length) {
  // agent-native 回落协议：写履约请求，宿主 agent 用自配视频工具产出同路径文件后重跑 --verify
  const req = { kind: "video", created_at: new Date().toISOString(), items: jobs.map((x) => ({ prompt: x.prompt, out: path.resolve(x.out), duration: x.duration, aspect: values.aspect })) };
  const reqP = path.join(path.dirname(path.resolve(jobs[0].out)), "media-request.json");
  fs.writeFileSync(reqP, JSON.stringify(req, null, 1));
  console.error(`无可用视频 provider（ARK/KLING/DASHSCOPE/MINIMAX key 均未配置）。已写 agent-native 履约请求：${reqP}——宿主 agent 请用自配视频模型产出同路径 mp4 后重跑本脚本 --verify。`);
  process.exit(3);
}
console.log(JSON.stringify({ ok: true, videos: done }, null, 1));
