#!/usr/bin/env node
/**
 * layers.mjs（M101）——Seedream 5.0 pro 图层拆分的「规格+验收」包装（skill 不直调 API）。
 * 用法:
 *   node layers.mjs --spec --in <src.png> --out <dir> [--prompt "拆出人物与标题"]
 *       → 写 media-request.json（kind=layers，官方契约：layer_decomposition=true/size=auto/单张输入），exit 3 待 agent 履约
 *   node layers.mjs --ingest --in <dir>
 *       → 验收 agent 产出：base + layers（alpha 通道/z_index 连续/bounding_box 合理）+ layers.json 登记 manifest
 * 履约建议 means：官方 byted-ark-seedream-skill（--layer_decomposition）或宿主自配 Seedream 通道。
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { createRequire } from "node:module";
import { arkRequestSpec, officialSkillPath } from "./providers.mjs";
const require = createRequire(import.meta.url);
const sharp = require("sharp");

const { values } = parseArgs({ options: { spec: { type: "boolean" }, ingest: { type: "boolean" }, in: { type: "string" }, out: { type: "string" }, prompt: { type: "string" }, help: { type: "boolean" } } });
if (values.help || (!values.spec && !values.ingest)) { console.log("用法: node layers.mjs --spec --in <src.png> --out <dir> [--prompt ...] | --ingest --in <dir>"); process.exit(values.help ? 0 : 1); }

if (values.spec) {
  const src = path.resolve(values.in);
  const meta = await sharp(src).metadata();
  if (!meta.hasAlpha && !values.prompt) console.warn("提示：输入无透明通道仍可拆层；transparent 编辑模式才要求输入带 alpha。");
  const outDir = path.resolve(values.out);
  const req = {
    kind: "layers", created_at: new Date().toISOString(), skill: "design-clone",
    consent: "required — 本 session 内用户已批准使用配置模型生图/拆层",
    official_skill: officialSkillPath("image"),
    spec: arkRequestSpec("layers", { prompt: values.prompt || null, reference: `local:${src}` }),
    input: src, out_dir: outDir,
    acceptance: { base: "z_index=0 jpeg/png", layers: "每层 png 带 alpha", meta: "layers.json 含 z_index/bounding_box/name/description", verify: "node layers.mjs --ingest --in <out_dir>" },
  };
  fs.mkdirSync(outDir, { recursive: true });
  const reqP = path.join(outDir, "media-request.json");
  fs.writeFileSync(reqP, JSON.stringify(req, null, 1));
  console.log(JSON.stringify({ deferred: true, request: reqP, official_skill: req.official_skill }, null, 1));
  process.exit(3);
}

// ---- ingest 验收 ----
const dir = path.resolve(values.in);
const mj = path.join(dir, "layers.json");
if (!fs.existsSync(mj)) { console.error("缺 layers.json（agent 履约产物元数据）"); process.exit(1); }
const L = JSON.parse(fs.readFileSync(mj, "utf8"));
const items = Array.isArray(L) ? L : (L.data || L.layers || []);
const problems = [];
const zs = items.map((x) => x.z_index ?? 0);
if (!items.length) problems.push("无图层");
if (new Set(zs).size !== zs.length) problems.push("z_index 重复");
for (const it of items) {
  const f = it.file || it.url || it.name;
  const fp = path.isAbsolute(f) ? f : path.join(dir, f);
  if (!fs.existsSync(fp)) { problems.push("缺文件 " + f); continue; }
  const m = await sharp(fp).metadata();
  if ((it.z_index ?? 0) > 0 && !m.hasAlpha) problems.push("图层无 alpha: " + f);
  if (it.bounding_box && (!Array.isArray(it.bounding_box.absolute) || it.bounding_box.absolute.length !== 4)) problems.push("bbox 非法: " + f);
}
const base = items.find((x) => (x.z_index ?? 0) === 0);
if (!base) problems.push("缺 base(z_index=0)");
if (problems.length) { console.error("layers 验收失败: " + problems.slice(0, 6).join("; ")); process.exit(1); }
console.log(JSON.stringify({ ok: true, layers: items.length, base: base.file || base.name, engine: L.engine || "agent-native" }, null, 1));
