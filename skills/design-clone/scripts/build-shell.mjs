#!/usr/bin/env node
/**
 * 外壳拼装器（M45）：templates/prototype/ins/*.js → 单文件 inspector.js。
 *
 * 为什么是 concat 而不是 bundler/ESM：
 *  - 原型要能"zip 解压双击即开"与 file:// 直开，ESM 在这些形态下被 CORS 打死；
 *  - 零构建 = 零构建依赖 = 无供应链面，符合 AGENTS.md 的免费/无 GPU/裸 node 纪律；
 *  - 源码仍按职责分 17 段（配置/UI 原语/URL/视图/画布/导航/流程/看板/播放/导出/对照/壳/事件/绑定/boot），
 *    拼接后是同一个 IIFE 闭包，无运行时注入成本，也不产生"模块加载顺序"这类新故障面。
 * 决策记录见 docs/DECISIONS.md（ADR-014）。
 *
 * 用法: node build-shell.mjs [--out <file>]   （默认打印到 stdout）
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const INS_DIR = path.join(HERE, "../templates/prototype/ins");

/** 分段文件名以数字前缀定序（00,10,…,160）；必须按数值排，字典序会把 100-play 排到 20-ui 前 */
const sectionFiles = () =>
  fs.readdirSync(INS_DIR).filter((f) => /^\d+-.*\.js$/.test(f))
    .sort((x, y) => parseInt(x, 10) - parseInt(y, 10));

/** 按分段顺序拼接；分段头部注释保留，便于在产物里定位源码文件 */
export function buildInspector() {
  const files = sectionFiles();
  if (!files.length) throw new Error("templates/prototype/ins/ 为空或缺少数字前缀分段");
  const body = files.map((f) => fs.readFileSync(path.join(INS_DIR, f), "utf8").trimEnd()).join("\n");
  return body + "\n";
}

export const INSPECTOR_SECTIONS = sectionFiles;

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const A = process.argv.slice(2);
  if (A.includes("--help") || A.includes("-h")) {
    console.log("用法: node build-shell.mjs [--out <file>]   # 拼接 inspector 分段为单文件");
    process.exit(0);
  }
  const out = buildInspector();
  const i = A.indexOf("--out");
  if (i >= 0) {
    fs.mkdirSync(path.dirname(path.resolve(A[i + 1])), { recursive: true });
    fs.writeFileSync(path.resolve(A[i + 1]), out);
    console.log("wrote", path.resolve(A[i + 1]), out.split("\n").length, "lines");
  } else {
    process.stdout.write(out);
  }
}
