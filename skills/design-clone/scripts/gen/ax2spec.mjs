#!/usr/bin/env node
/**
 * macOS System Events AX 元素树 → 统一 region spec（M28 desktop）。
 * 用法: node ax2spec.mjs <process> <capture.png> [--out spec.json]
 * 读 AX position/size/title/role（只读查询）。Electron AX 弱时输出稀疏→走 VLM-spec+crop 兜底。
 */
import fs from "node:fs";
import { execSync } from "node:child_process";
const [proc, png, ...r] = process.argv.slice(2);
if (!proc || r.includes("--help")) { console.log("用法: node ax2spec.mjs <process> <capture.png> [--out spec.json]"); process.exit(proc ? 0 : 1); }
let raw = "";
try {
  raw = execSync(`osascript -e 'tell application "System Events" to tell process "${proc}"
  set out to ""
  repeat with w in windows
    set wp to position of w
    set ws to size of w
    set out to out & "win|" & (item 1 of wp) & "," & (item 2 of wp) & "," & (item 1 of ws) & "," & (item 2 of ws) & "|window\\n"
    try
      repeat with e in (every UI element of w)
        set p to position of e
        set s to size of e
        set t to ""
        try
          set t to title of e
        end try
        set out to out & (role of e) & "|" & (item 1 of p) & "," & (item 2 of p) & "," & (item 1 of s) & "," & (item 2 of s) & "|" & t & "\\n"
      end repeat
    end try
  end repeat
  return out
end tell'`, { encoding: "utf8", timeout: 30000 });
} catch (e) { raw = ""; }
const nodes = [];
let frame = { w: 0, h: 0 }, i = 0;
for (const line of raw.split("\\n").filter(Boolean)) {
  const [role, b, title] = line.split("|");
  const [x, y, w, h] = (b || "").split(",").map(Number);
  if (!w || !h) continue;
  frame.w = Math.max(frame.w, x + w); frame.h = Math.max(frame.h, y + h);
  nodes.push({ id: "n" + i++, bbox: [x, y, w, h], text: title || "", rid: role, cls: role, clickable: /Button|Link|CheckBox|PopUp/.test(role), kind: /Image/.test(role) ? "image" : (title ? "text" : "box") });
}
const spec = { source: "mac-ax", process: proc, png, frame, nodes };
if (r.includes("--out")) fs.writeFileSync(r[r.indexOf("--out") + 1], JSON.stringify(spec, null, 1));
console.log(JSON.stringify({ nodes: nodes.length, frame, sparse: nodes.length < 12 }));
