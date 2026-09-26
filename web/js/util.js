// ============================================================================
// util.js — Ayudas: base64, CRC32, ZIP (stored), texto, descargas
// ============================================================================

export function u8FromArrayBuffer(ab) { return new Uint8Array(ab); }

export function concatBytes(chunks) {
  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Uint8Array(total);
  let o = 0;
  for (const c of chunks) { out.set(c, o); o += c.length; }
  return out;
}

// --- Base64 (binario seguro, por bloques para no reventar la pila) ------------
export function bytesToBase64(u8) {
  let s = "";
  const CH = 0x8000;
  for (let i = 0; i < u8.length; i += CH) {
    s += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
  }
  return btoa(s);
}

export function base64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// --- CRC32 -------------------------------------------------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(u8) {
  let c = 0xffffffff;
  for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// --- ZIP mínimo (método STORED, sin compresión) --------------------------------
// Suficiente para "exportar cambios" sin dependencias.
export function zipStore(files) {
  // files: [ [nombreRelativo, Uint8Array], ... ]
  const enc = new TextEncoder();
  const chunks = [];
  const central = [];
  let offset = 0;
  // Fecha DOS fija (evita Date en builds reproducibles): 2026-01-01
  const DOS_TIME = (12 << 11) | (0 << 5) | 0;
  const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1;
  for (const [name, data] of files) {
    const nb = enc.encode(name.replace(/\\/g, "/"));
    const crc = crc32(data);
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true);
    lh.setUint16(4, 20, true);
    lh.setUint16(6, 0x0800, true); // UTF-8
    lh.setUint16(8, 0, true); // stored
    lh.setUint16(10, DOS_TIME, true);
    lh.setUint16(12, DOS_DATE, true);
    lh.setUint32(14, crc, true);
    lh.setUint32(18, data.length, true);
    lh.setUint32(22, data.length, true);
    lh.setUint16(26, nb.length, true);
    lh.setUint16(28, 0, true);
    chunks.push(new Uint8Array(lh.buffer), nb, data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true);
    ch.setUint16(4, 20, true);
    ch.setUint16(6, 20, true);
    ch.setUint16(8, 0x0800, true);
    ch.setUint16(10, 0, true);
    ch.setUint16(12, DOS_TIME, true);
    ch.setUint16(14, DOS_DATE, true);
    ch.setUint32(16, crc, true);
    ch.setUint32(20, data.length, true);
    ch.setUint32(24, data.length, true);
    ch.setUint16(28, nb.length, true);
    ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), nb);
    offset += 30 + nb.length + data.length;
  }
  const cdStart = offset;
  const cdBytes = concatBytes(central);
  chunks.push(cdBytes);
  offset += cdBytes.length;
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, cdBytes.length, true);
  end.setUint32(16, cdStart, true);
  chunks.push(new Uint8Array(end.buffer));
  return concatBytes(chunks);
}

// --- Descargas -----------------------------------------------------------------
export function downloadBlob(blob, filename) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
}

export function downloadBytes(u8, filename, mime = "application/octet-stream") {
  downloadBlob(new Blob([u8], { type: mime }), filename);
}

export function downloadText(text, filename, mime = "text/plain;charset=utf-8") {
  downloadBlob(new Blob([text], { type: mime }), filename);
}

// --- Texto ---------------------------------------------------------------------
export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

export function pad3(n) { return String(n).padStart(3, "0"); }
export function fmtBytes(n) {
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  return (n / 1024 / 1024).toFixed(1) + " MB";
}
export function fmtTime(d = new Date()) {
  const p = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

// --- Compresión zlib (para Scripts.rxdata) --------------------------------------
export async function zlibInflate(u8) {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("Tu navegador/WebView no soporta DecompressionStream (scripts comprimidos). Actualiza el WebView del sistema.");
  }
  const ds = new DecompressionStream("deflate");
  const blob = new Blob([u8]);
  const ab = await new Response(blob.stream().pipeThrough(ds)).arrayBuffer();
  return new Uint8Array(ab);
}

export async function zlibDeflate(u8) {
  if (typeof CompressionStream === "undefined") {
    throw new Error("Tu navegador/WebView no soporta CompressionStream. Actualiza el WebView del sistema.");
  }
  const cs = new CompressionStream("deflate");
  const blob = new Blob([u8]);
  const ab = await new Response(blob.stream().pipeThrough(cs)).arrayBuffer();
  return new Uint8Array(ab);
}
