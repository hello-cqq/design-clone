/**
 * zipstore 单测（node:test，零新依赖）。
 * 覆盖：CRC-32 标准向量、base64 还原、zip 容器结构（LFH/CDH/EOCD 签名与计数/偏移自洽）、
 * 以及"用中央目录回读"的往返一致性（不依赖外部 unzip）。
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const ZIP = require(path.join("..", "..", "templates", "prototype", "zipstore.js"));

test("crc32 matches the IEEE 802.3 check vector", () => {
  const v = ZIP.crc32(new TextEncoder().encode("123456789"));
  assert.equal(v, 0xcbf43926);
});

test("crc32 of empty input is 0", () => {
  assert.equal(ZIP.crc32(new Uint8Array(0)), 0);
});

test("b64ToU8 round-trips bytes >127 and empty", () => {
  const src = Uint8Array.from([0, 1, 127, 128, 255, 42]);
  const b64 = Buffer.from(src).toString("base64");
  assert.deepEqual([...ZIP.b64ToU8(b64)], [...src]);
  assert.equal(ZIP.b64ToU8("").length, 0);
});

const parse = (bytes) => {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // EOCD 在末尾 22 字节
  const eocd = bytes.length - 22;
  assert.equal(dv.getUint32(eocd, true), 0x06054b50, "EOCD signature");
  const count = dv.getUint16(eocd + 10, true);
  const cdOffset = dv.getUint32(eocd + 16, true);
  const entries = [];
  let p = cdOffset;
  for (let i = 0; i < count; i++) {
    assert.equal(dv.getUint32(p, true), 0x02014b50, "central dir signature");
    const crc = dv.getUint32(p + 16, true);
    const size = dv.getUint32(p + 24, true);
    const nameLen = dv.getUint16(p + 28, true);
    const localOff = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(p + 46, p + 46 + nameLen));
    entries.push({ name, crc, size, localOff });
    p += 46 + nameLen + dv.getUint16(p + 30, true) + dv.getUint16(p + 32, true);
  }
  return { count, entries, dv };
};

test("zip container is structurally self-consistent", () => {
  const enc = new TextEncoder();
  const entries = [
    { name: "pages/01.png", data: enc.encode("hello world") },
    { name: "board.json", data: enc.encode('{"a":1}') },
    { name: "empty.bin", data: new Uint8Array(0) },
  ];
  const bytes = ZIP.zipStoreBytes(entries);
  const { count, entries: cd, dv } = parse(bytes);
  assert.equal(count, 3);
  assert.deepEqual(cd.map((e) => e.name), entries.map((e) => e.name));
  for (let i = 0; i < cd.length; i++) {
    const e = cd[i];
    assert.equal(dv.getUint32(e.localOff, true), 0x04034b50, "local header signature");
    const nameLen = dv.getUint16(e.localOff + 26, true);
    assert.equal(dv.getUint32(e.localOff + 14, true), e.crc, "crc agrees between LFH and CDH");
    assert.equal(dv.getUint32(e.localOff + 18, true), e.size, "size agrees between LFH and CDH");
    const payload = bytes.subarray(e.localOff + 30 + nameLen, e.localOff + 30 + nameLen + e.size);
    assert.equal(ZIP.crc32(payload), e.crc, "stored payload crc matches header");
    assert.deepEqual([...payload], [...entries[i].data], "payload bytes round-trip");
  }
});

test("nested paths keep slashes (unzip recreates directories)", () => {
  const bytes = ZIP.zipStoreBytes([{ name: "a/b/c.txt", data: new TextEncoder().encode("x") }]);
  const { entries } = parse(bytes);
  assert.equal(entries[0].name, "a/b/c.txt");
});

test("utf8 filenames survive", () => {
  const bytes = ZIP.zipStoreBytes([{ name: "pages/01-聊天+标注.png", data: new Uint8Array([1, 2, 3]) }]);
  const { entries } = parse(bytes);
  assert.equal(entries[0].name, "pages/01-聊天+标注.png");
});
