/* zipstore —— 零依赖 store-only ZIP 打包（M45 抽出为可单测叶子模块）。
 * UMD-lite：浏览器里挂 window.DCZip（classic script，file:// 可用），Node 里 module.exports（node:test 直接 require）。
 * 为什么不压缩：截图/PNG/webm 本身已是压缩流，store 档换来确定性输出 + 零依赖 + 可单测。
 * 结构：local file header* + central directory* + EOCD，CRC-32 (IEEE 802.3, reflected)。
 */
(function (root, factory) {
  let api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.DCZip = api;
})(/** @type {any} */ (typeof self !== "undefined" ? self : this), function () {
  "use strict";
  let CRC_TABLE = (function () {
    let t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();

  function crc32(u8) {
    let c = 0xffffffff;
    for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function b64ToU8(b64) {
    let bin = atob(b64);
    let u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return u8;
  }

  /** entries: [{name:string, data:Uint8Array}] → Uint8Array（完整 zip 字节） */
  function zipStoreBytes(entries) {
    let enc = new TextEncoder();
    let now = new Date();
    let t = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() / 2)) & 0xffff;
    let d = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xffff;
    let parts = [], central = [];
    let offset = 0;
    for (let i = 0; i < entries.length; i++) {
      let e = entries[i];
      let name = enc.encode(e.name), data = e.data, crc = crc32(data);
      let lh = new Uint8Array(30 + name.length), lv = new DataView(lh.buffer);
      lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(10, t, true); lv.setUint16(12, d, true);
      lv.setUint32(14, crc, true); lv.setUint32(18, data.length, true); lv.setUint32(22, data.length, true);
      lv.setUint16(26, name.length, true); lh.set(name, 30);
      parts.push(lh, data);
      let ch = new Uint8Array(46 + name.length), cv = new DataView(ch.buffer);
      cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
      cv.setUint16(12, t, true); cv.setUint16(14, d, true); cv.setUint32(16, crc, true);
      cv.setUint32(20, data.length, true); cv.setUint32(24, data.length, true);
      cv.setUint16(28, name.length, true); cv.setUint32(42, offset, true); ch.set(name, 46);
      central.push(ch);
      offset += lh.length + data.length;
    }
    let cdSize = central.reduce(function (n, c) { return n + c.length; }, 0);
    let eo = new Uint8Array(22), ev = new DataView(eo.buffer);
    ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, entries.length, true); ev.setUint16(10, entries.length, true);
    ev.setUint32(12, cdSize, true); ev.setUint32(16, offset, true);
    let total = offset + cdSize + 22;
    let out = new Uint8Array(total);
    let p = 0;
    for (let j = 0; j < parts.length; j++) { out.set(parts[j], p); p += parts[j].length; }
    for (let k = 0; k < central.length; k++) { out.set(central[k], p); p += central[k].length; }
    out.set(eo, p);
    return out;
  }

  /** 浏览器入口：返回 Blob（供 URL.createObjectURL 下载） */
  function zipStore(entries) {
    return new Blob([zipStoreBytes(entries)], { type: "application/zip" });
  }

  return { crc32: crc32, b64ToU8: b64ToU8, zipStore: zipStore, zipStoreBytes: zipStoreBytes };
});
