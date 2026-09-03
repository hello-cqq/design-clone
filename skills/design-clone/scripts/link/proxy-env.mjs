#!/usr/bin/env node
/**
 * 系统代理自动感知：浏览器走系统代理而终端不走（FB 等被墙站典型场景），本脚本拉齐两者。
 * 用法: eval "$(node proxy-env.mjs)"   或   node proxy-env.mjs --json
 * 读到 macOS 启用的 HTTPS/HTTP 系统代理就输出 export 行；无代理静默退出 0。
 * 已有 HTTPS_PROXY 环境变量时优先沿用。
 */
import { execSync } from "node:child_process";

function sh(cmd) {
  try { return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }); } catch { return ""; }
}

function readProxy(service) {
  const outs = [
    ["https", sh(`networksetup -getsecurewebproxy "${service}"`)],
    ["http", sh(`networksetup -getwebproxy "${service}"`)],
  ];
  for (const [, txt] of outs) {
    if (!txt || !/Enabled:\s*Yes/i.test(txt)) continue;
    const server = (txt.match(/Server:\s*(\S+)/) || [])[1];
    const port = (txt.match(/Port:\s*(\d+)/) || [])[1];
    // 代理 URL 的 scheme 指"如何连代理"，本地 CONNECT 代理一律 http://
    if (server && port) return `http://${server}:${port}`;
  }
  return null;
}

let proxy = process.env.HTTPS_PROXY || process.env.https_proxy || null;
if (!proxy && process.platform === "darwin") {
  for (const s of ["Wi-Fi", "Ethernet"]) {
    proxy = readProxy(s);
    if (proxy) break;
  }
}

if (!proxy) process.exit(0);
if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ https_proxy: proxy, http_proxy: proxy }));
} else {
  console.log(`export HTTPS_PROXY="${proxy}"; export HTTP_PROXY="${proxy}"; export https_proxy="${proxy}"; export http_proxy="${proxy}";`);
}
