/**
 * serve 集成单测（拆分后）：起真服务打真请求，验证 SECURITY.md 承诺的边界。
 * 不使用 chromium（导出只走 board 档），保持秒级。
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SERVE = path.join(HERE, "..", "serve.mjs");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "dc-serve-test-"));
fs.mkdirSync(path.join(tmp, "prototype"), { recursive: true });
fs.writeFileSync(path.join(tmp, "prototype", "index.html"), "<html>hi</html>");
const PORT = 4610 + Math.floor(Math.random() * 80);
const base = `http://127.0.0.1:${PORT}`;
const srv = spawn("node", [SERVE, tmp, "--port", String(PORT)], { stdio: "ignore" });
const wait = async () => {
  for (let i = 0; i < 40; i++) {
    try { const r = await fetch(base + "/prototype/"); if (r.ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("serve did not start");
};

test.before(wait);
test.after(() => { srv.kill(); fs.rmSync(tmp, { recursive: true, force: true }); });

test("static serving works for in-root files", async () => {
  const r = await fetch(base + "/prototype/index.html");
  assert.equal(r.status, 200);
  assert.match(await r.text(), /hi/);
});

test("shell assets are never cached (M46: stale-shell bug regression)", async () => {
  fs.writeFileSync(path.join(tmp, "prototype", "inspector.css"), "body{color:#123456}");
  fs.writeFileSync(path.join(tmp, "prototype", "inspector.js"), "console.log(1)");
  for (const f of ["inspector.css", "inspector.js", "index.html"]) {
    const r = await fetch(base + "/prototype/" + f);
    assert.match(r.headers.get("cache-control") || "", /no-store/, f + " must be no-store");
  }
});

test("traversal outside root is 404", async () => {
  const r = await fetch(base + "/prototype/../../etc/passwd");
  assert.ok([400, 404].includes(r.status), "got " + r.status);
  const r2 = await fetch(base + "/..%2f..%2fetc%2fpasswd");
  assert.ok([400, 404].includes(r2.status), "encoded traversal got " + r2.status);
});

test("optional artifacts get defaults instead of 404", async () => {
  const r = await fetch(base + "/prototype/annotations.json");
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), {});
});

test("malformed POST json → 400, server stays alive", async () => {
  const r = await fetch(base + "/__dc_write__", { method: "POST", body: "{not json" });
  assert.equal(r.status, 400);
  const r2 = await fetch(base + "/prototype/");
  assert.equal(r2.status, 200);
});

test("non-whitelisted write → 400 and nothing on disk", async () => {
  const r = await fetch(base + "/__dc_write__", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ file: "prototype/views/evil.html", content: "x" }) });
  assert.equal(r.status, 400);
  assert.equal(fs.existsSync(path.join(tmp, "prototype/views/evil.html")), false);
});

test("whitelisted write lands on disk", async () => {
  const r = await fetch(base + "/__dc_write__", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ file: "prototype/annotations.json", content: { p: [{ target: "a", label: "b" }] } }) });
  assert.equal(r.status, 200);
  const onDisk = JSON.parse(fs.readFileSync(path.join(tmp, "prototype/annotations.json"), "utf8"));
  assert.equal(onDisk.p[0].label, "b");
});

test("variant write lands under variants/<name>/", async () => {
  const r = await fetch(base + "/__dc_write__", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ file: "prototype/variants/dark/tokens.json", content: { "--color-bg": "#000" } }) });
  assert.equal(r.status, 200);
  assert.equal(fs.existsSync(path.join(tmp, "prototype/variants/dark/tokens.json")), true);
});

test("export board-only returns base64 payload without chromium", async () => {
  const r = await fetch(base + "/__dc_export__", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items: [{ type: "board", board: { x: 1 } }], returnFiles: true }) });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.ok, true);
  assert.equal(j.payload.length, 1);
  assert.equal(Buffer.from(j.payload[0].b64, "base64").toString("utf8"), JSON.stringify({ x: 1 }, null, 2));
});
