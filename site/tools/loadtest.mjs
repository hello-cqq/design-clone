#!/usr/bin/env node
/**
 * loadtest.mjs —— 官网并发/稳定性负载测试（node fetch，keep-alive）
 * 用法: node loadtest.mjs [base] [concurrency=100] [waves=10]
 * 输出: 请求数/错误数/rps/p50/p95/p99。静态站目标：0 错误、p95 < 200ms（本地基线）。
 */
const base = (process.argv[2] || "http://localhost:4211").replace(/\/$/, "");
const conc = +(process.argv[3] || 100);
const waves = +(process.argv[4] || 10);
const PATHS = ["/index.html", "/gallery.html", "/proto.html?app=petpark", "/assets/site.css", "/assets/site.js", "/assets/demo-anim.js", "/data/index.fallback.json"];

const lat = [];
let errors = 0;
const t0 = Date.now();
for (let w = 0; w < waves; w++) {
  const jobs = Array.from({ length: conc }, (_, i) => {
    const url = base + PATHS[(w * conc + i) % PATHS.length];
    const s = Date.now();
    return fetch(url, { keepalive: true }).then((r) => {
      if (!r.ok) { errors++; return; }
      return r.body ? r.body.pipeTo(new WritableStream({ write() {} })).then(() => lat.push(Date.now() - s)) : lat.push(Date.now() - s);
    }).catch(() => { errors++; });
  });
  await Promise.all(jobs);
}
const ms = Date.now() - t0;
lat.sort((a, b) => a - b);
const q = (p) => lat[Math.min(lat.length - 1, Math.floor(lat.length * p))] ?? 0;
console.log(JSON.stringify({
  requests: conc * waves, errors, ms, rps: Math.round((conc * waves) / (ms / 1000)),
  p50: q(0.5), p95: q(0.95), p99: q(0.99),
}));
process.exit(errors ? 1 : 0);
