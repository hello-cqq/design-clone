#!/usr/bin/env node
/**
 * 页身份校验（M28/M37）：dump 后用特征文本验证是否落在目标页，防热启动/导航错位。
 * 用法: node verify-page.mjs <ui-tree.xml> --expect "标签1,标签2"  → 输出 {match,missing}
 */
import fs from "node:fs";
const A = process.argv.slice(2);
const xml = A[0];
const expect = (A.includes("--expect") ? A[A.indexOf("--expect") + 1] : "").split(",").map((s) => s.trim()).filter(Boolean);
if (!xml || !expect.length) { console.log("用法: node verify-page.mjs <ui-tree.xml> --expect \"a,b\""); process.exit(xml ? 0 : 1); }
const x = fs.readFileSync(xml, "utf8");
const missing = expect.filter((t) => !x.includes(t));
console.log(JSON.stringify({ match: missing.length === 0, missing }));
