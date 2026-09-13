#!/usr/bin/env node
/**
 * brief-tokens.mjs（M77-W1）——brief.identity.tokens → knowledge/tokens.css + prototype/tokens.css。
 * 用法: node brief-tokens.mjs --run <runDir>
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
const { values: V } = parseArgs({ options: { run: { type: "string" } } });
if (!V.run || process.argv.includes("--help")) { console.log("用法: node brief-tokens.mjs --run <runDir>"); process.exit(V.run ? 0 : 1); }
const run = path.resolve(V.run);
const brief = JSON.parse(fs.readFileSync(path.join(run, "knowledge/brief.json"), "utf8"));
const t = brief.identity.tokens || {};
const css = ":root {\n" + Object.entries(t).map(([k, v]) => `  ${k}: ${v};`).join("\n") + "\n}\n";
for (const d of ["knowledge", path.join("prototype")]) {
  fs.mkdirSync(path.join(run, d), { recursive: true });
  fs.writeFileSync(path.join(run, d, "tokens.css"), css);
}
console.log("tokens.css written");
