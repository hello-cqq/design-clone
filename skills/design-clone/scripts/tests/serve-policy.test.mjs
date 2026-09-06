/**
 * serve/policy 单测：白名单、路径包含校验、body 上限、JSON 响应形状。
 * 这些是 SECURITY.md 里承诺的控制点，回归即违约。
 */
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { Readable } from "node:stream";
import { canWrite, makeInsideRoot, readBody, json, MAX_BODY, WRITE_WHITELIST } from "../serve/policy.mjs";

test("write whitelist accepts only declared files", () => {
  for (const f of WRITE_WHITELIST) assert.equal(canWrite(f), true, f);
  assert.equal(canWrite("prototype/variants/dark/tokens.json"), true);
  assert.equal(canWrite("prototype/variants/dark/tokens-override.css"), true);
  assert.equal(canWrite("prototype/variants/dark/layout-overrides.json"), true);
});

test("write whitelist rejects escapes and arbitrary files", () => {
  for (const f of ["../../../etc/passwd", "prototype/views/01.html", "prototype/variants/../secrets.json", "prototype/variants/a b/tokens.json", "", null, 42]) {
    assert.equal(canWrite(f), false, String(f));
  }
  assert.equal(canWrite("prototype/variants/" + "x".repeat(65) + "/tokens.json"), false, "name length capped");
});

test("insideRoot is separator-aware", () => {
  const inside = makeInsideRoot("/tmp/dc-run");
  assert.equal(inside("/tmp/dc-run"), true);
  assert.equal(inside("/tmp/dc-run/prototype/index.html"), true);
  assert.equal(inside("/tmp/dc-run-secret/index.html"), false, "sibling prefix must not pass");
  assert.equal(inside("/tmp/dc-run/../../etc/passwd"), false, "dot-dot escape must not pass even unnormalized");
  assert.equal(inside("/tmp/dc-run/../dc-run/x"), true, "in-root path with redundant .. is still in root");
  assert.equal(inside("/tmp/other"), false);
});

test("readBody rejects oversized payloads", async () => {
  const req = new Readable({ read() {} });
  const p = readBody(req, 16);
  req.push("x".repeat(64));
  await assert.rejects(p, /body too large/);
});

test("readBody concatenates chunks", async () => {
  const req = new Readable({ read() {} });
  const p = readBody(req);
  req.push('{"a":'); req.push("1}"); req.push(null);
  assert.equal(await p, '{"a":1}');
});

test("json() writes status + application/json", () => {
  const calls = [];
  const res = { writeHead: (c, h) => calls.push([c, h]), end: (b) => calls.push(b) };
  json(res, 400, { ok: false });
  assert.equal(calls[0][0], 400);
  assert.equal(calls[0][1]["content-type"], "application/json");
  assert.equal(calls[1], '{"ok":false}');
});

test("MAX_BODY is sane for the documented cap", () => {
  assert.equal(MAX_BODY, 8 * 1024 * 1024);
});

test("path.join+normalize is what handlers must use (documented invariant)", () => {
  // 纯文档性断言：确保策略导出的比较函数与 node path 语义一致
  const inside = makeInsideRoot(path.resolve("/a/b"));
  assert.equal(inside(path.normalize("/a/b/c/../c/d")), true);
});
