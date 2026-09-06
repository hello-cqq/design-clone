/**
 * /__dc_write__ 处理（M45 抽出）：白名单 + 路径包含校验后落盘。
 */
import fs from "node:fs";
import path from "node:path";
import { canWrite, json, makeInsideRoot } from "./policy.mjs";

export function makeWriteHandler(root) {
  const insideRoot = makeInsideRoot(root);
  return function handleWrite(res, j) {
    if (!canWrite(j.file)) return json(res, 400, { ok: false, error: "not whitelisted: " + j.file });
    const dest = path.normalize(path.join(root, j.file));
    if (!insideRoot(dest)) return json(res, 400, { ok: false, error: "path escapes root" });
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, typeof j.content === "string" ? j.content : JSON.stringify(j.content, null, 2));
    return json(res, 200, { ok: true, file: j.file });
  };
}
