// ============================================================================
// fs.js — Acceso a los archivos del juego (4 modos)
// ----------------------------------------------------------------------------
// 1) android  → la APK expone la carpeta del juego (SAF) vía PokeModBridge.
// 2) browser  → File System Access API (Chrome/Edge escritorio).
// 3) fallback→ <input webkitdirectory> (solo lectura) + exportar cambios en ZIP.
// 4) demo    → proyecto procedural en memoria (para probar sin el juego).
//
// TODAS las escrituras pasan por writeBytes(), que:
//   a) rechaza tocar partidas guardadas (Save*, Game.rxdata, *.sav),
//   b) avisa a onBeforeWrite para copia de seguridad automática.
// ============================================================================
import { bytesToBase64, base64ToBytes } from "./util.js";

// --- Archivos PROTEGIDOS: nunca se escriben ni borran ------------------------------
// (Partidas de Essentials/RMXP y nuestros propios backups.)
export const PROTECTED = [
  /^save[\s_.-]*\d*\.rxdata$/i,
  /^game\.rxdata$/i,
  /\.sav$/i,
  /^pokemodbackups\//i,
  /\.bak$/i,
];

export function isProtected(rel) {
  const n = rel.replace(/\\/g, "/").replace(/^\.\//, "");
  const base = n.split("/").pop();
  return PROTECTED.some((re) => re.test(base) || re.test(n));
}

export function normalizeRel(p) {
  return String(p).replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\/+/, "");
}

// --- API -----------------------------------------------------------------------
export const FS = {
  mode: "none",
  folderName: "",
  onBeforeWrite: null, // async (rel, newBytes) => void — backup automático
  pendingWrites: new Map(), // fallback/demo: rel -> Uint8Array pendiente
  pendingDeletes: new Set(), // fallback: rels borrados pendientes
  _backupMem: new Map(), // fallback: backups en memoria (PokeModBackups/...)
  _handles: new Map(), // browser: path dir -> handle
  _files: new Map(), // fallback: rel -> File
  _mem: new Map(), // demo: rel -> Uint8Array
  _imgCache: new Map(),
  _indexLower: null, // índice minúsculas → ruta real

  reset() {
    this.mode = "none";
    this.folderName = "";
    this._handles.clear();
    this._files.clear();
    this._mem.clear();
    this._imgCache.clear();
    this._indexLower = null;
    this.pendingWrites.clear();
    this.pendingDeletes.clear();
    this._backupMem.clear();
  },

  get isAndroid() { return typeof window !== "undefined" && !!window.PokeModBridge; },
  get canWrite() { return this.mode === "android" || this.mode === "browser" || this.mode === "demo"; },

  // -- Conexión ------------------------------------------------------------------
  async connectAndroid() {
    const b = window.PokeModBridge;
    if (!b) throw new Error("Sin puente Android");
    const has = await this._bridge("pmHasFolder");
    if (has !== "1") {
      const name = await this._pickAndroidFolder();
      if (!name) throw new Error("No se eligió carpeta");
    }
    this.mode = "android";
    this.folderName = await this._bridge("pmFolderName");
    await this.rebuildIndex();
  },

  _pickAndroidFolder() {
    return new Promise((resolve) => {
      window.__pmResolveFolder = (name) => { window.__pmResolveFolder = null; resolve(name); };
      window.PokeModBridge.pmPickFolder();
      setTimeout(() => { if (window.__pmResolveFolder) { window.__pmResolveFolder = null; resolve(""); } }, 120000);
    });
  },

  _bridge(method, ...args) {
    return new Promise((resolve, reject) => {
      try {
        const r = window.PokeModBridge[method](...args);
        resolve(r);
      } catch (e) { reject(e); }
    });
  },

  async connectBrowser(dirHandle) {
    this._handles.set("", dirHandle);
    this.mode = "browser";
    this.folderName = dirHandle.name || "carpeta";
    await this.rebuildIndex();
  },

  async connectFallback(fileList) {
    this._files.clear();
    for (const f of fileList) {
      const rel = normalizeRel(f.webkitRelativePath || f.name);
      // Quitar el primer segmento (nombre de la carpeta raíz elegida)
      const parts = rel.split("/");
      parts.shift();
      this._files.set(parts.join("/"), f);
    }
    this.mode = "fallback";
    const first = fileList[0]?.webkitRelativePath?.split("/")[0] || "carpeta";
    this.folderName = first + " (solo lectura)";
    await this.rebuildIndex();
  },

  connectDemo(memMap, name = "Proyecto demo") {
    this._mem = memMap;
    this.mode = "demo";
    this.folderName = name;
    return this.rebuildIndex();
  },

  // -- Índice insensible a mayúsculas (¡clave en Android/Kirin!) -------------------
  async rebuildIndex() {
    this._indexLower = new Map();
    try {
      const all = await this.walk("", 30000);
      for (const p of all) {
        const l = p.toLowerCase();
        if (!this._indexLower.has(l)) this._indexLower.set(l, p);
      }
    } catch (e) {
      console.warn("rebuildIndex:", e);
    }
  },

  resolve(rel) {
    // Devuelve la ruta REAL conservando mayúsculas del FS.
    const n = normalizeRel(rel);
    if (!this._indexLower) return n;
    return this._indexLower.get(n.toLowerCase()) || n;
  },

  caseMismatches(wantedList) {
    // Para el chequeo Kirin: referencias cuya caja no coincide con el archivo.
    const out = [];
    for (const w of wantedList) {
      const real = this.resolve(w);
      if (real !== normalizeRel(w)) {
        const exists = this._indexLower?.has(normalizeRel(w).toLowerCase());
        out.push({ wanted: w, found: exists ? real : null });
      }
    }
    return out;
  },

  // -- Operaciones ------------------------------------------------------------------
  async list(relDir) {
    const rel = normalizeRel(relDir);
    if (this.mode === "android") {
      const j = await this._bridge("pmList", this.resolve(rel));
      return JSON.parse(j).map((e) => ({ name: e.n, path: (rel ? rel + "/" : "") + e.n, isDir: !!e.d, size: e.s || 0 }));
    }
    if (this.mode === "browser") {
      const h = await this._dirHandle(rel, false);
      const out = [];
      for await (const [name, entry] of h.entries()) {
        let size = 0;
        if (entry.kind === "file") {
          try { size = (await entry.getFile()).size; } catch { /* noop */ }
        }
        out.push({ name, path: (rel ? rel + "/" : "") + name, isDir: entry.kind === "directory", size });
      }
      return out.sort((a, b) => Number(b.isDir) - Number(a.isDir) || a.name.localeCompare(b.name));
    }
    if (this.mode === "fallback" || this.mode === "demo") {
      const map = this.mode === "fallback"
        ? new Map([...this._files, ...this.pendingWrites, ...this._backupMem])
        : new Map([...this._mem, ...this.pendingWrites]);
      const prefix = rel ? rel.toLowerCase() + "/" : "";
      const seen = new Map();
      for (const key of map.keys()) {
        const lk = key.toLowerCase();
        if (!lk.startsWith(prefix)) continue;
        const rest = key.slice(prefix.length);
        if (!rest) continue;
        const slash = rest.indexOf("/");
        if (slash < 0) {
          const v = map.get(key);
          seen.set(rest, { name: rest, path: key, isDir: false, size: v.size ?? v.length ?? 0 });
        } else {
          const d = rest.slice(0, slash);
          if (!seen.has(d)) seen.set(d, { name: d, path: (rel ? rel + "/" : "") + d, isDir: true, size: 0 });
        }
      }
      return [...seen.values()].sort((a, b) => Number(b.isDir) - Number(a.isDir) || a.name.localeCompare(b.name));
    }
    throw new Error("Sin carpeta conectada");
  },

  async walk(relDir, max = 30000) {
    const rel = normalizeRel(relDir);
    if (this.mode === "android") {
      const j = await this._bridge("pmWalk", this.resolve(rel), Math.min(max, 100000));
      return JSON.parse(j);
    }
    const out = [];
    const rec = async (dir, depth) => {
      if (out.length >= max || depth > 12) return;
      const items = await this.list(dir);
      for (const it of items) {
        if (out.length >= max) return;
        if (it.isDir) await rec(it.path, depth + 1);
        else out.push(it.path);
      }
    };
    if (this.mode === "browser") await rec(rel, 0);
    else {
      const map = this.mode === "fallback" ? this._files : this._mem;
      const prefix = rel ? rel.toLowerCase() + "/" : "";
      for (const key of map.keys()) {
        if (out.length >= max) break;
        if (!rel || key.toLowerCase().startsWith(prefix)) out.push(key);
      }
    }
    return out;
  },

  async exists(rel) {
    const n = normalizeRel(rel);
    if (this._indexLower?.has(n.toLowerCase())) return true;
    if (this.mode === "android") return (await this._bridge("pmExists", n)) === "1";
    if (this.mode === "browser") {
      try { await this._fileHandle(n, false); return true; }
      catch { return false; }
    }
    if (this.mode === "fallback") return this._files.has(n);
    if (this.mode === "demo") return this._mem.has(n);
    return false;
  },

  async readBytes(rel) {
    const n = this.resolve(rel);
    if (this.mode === "android") {
      // Lectura por bloques de 1 MB (Scripts.rxdata y mapas grandes).
      try {
        const size = parseInt(await this._bridge("pmSize", n), 10);
        if (Number.isFinite(size) && size >= 0 && size <= 256 * 1024 * 1024) {
          const CH = 1024 * 1024;
          const parts = [];
          for (let off = 0; off < size; off += CH) {
            parts.push(base64ToBytes(await this._bridge("pmReadChunk", n, off, Math.min(CH, size - off))));
          }
          const out = new Uint8Array(size);
          let o = 0;
          for (const p of parts) { out.set(p, o); o += p.length; }
          return out;
        }
      } catch (e) {
        console.warn("lectura por bloques falló, intento directa:", e);
      }
      return base64ToBytes(await this._bridge("pmRead", n));
    }
    if (this.mode === "browser") {
      const h = await this._fileHandle(n, false);
      return new Uint8Array(await (await h.getFile()).arrayBuffer());
    }
    if (this.mode === "fallback") {
      if (this.pendingWrites.has(n)) return this.pendingWrites.get(n);
      if (this._backupMem.has(n)) return this._backupMem.get(n);
      const f = this._files.get(n);
      if (!f) throw new Error("No existe: " + rel);
      return new Uint8Array(await f.arrayBuffer());
    }
    if (this.mode === "demo") {
      // pendingWrites tiene prioridad (ver cambios sin "guardar")
      if (this.pendingWrites.has(n)) return this.pendingWrites.get(n);
      const v = this._mem.get(n);
      if (!v) throw new Error("No existe: " + rel);
      return v;
    }
    throw new Error("Sin carpeta conectada");
  },

  async readText(rel) {
    const b = await this.readBytes(rel);
    try { return new TextDecoder("utf-8", { fatal: true }).decode(b); }
    catch { return new TextDecoder("windows-1252").decode(b); }
  },

  async writeBytes(rel, u8, opts = {}) {
    const n = normalizeRel(rel);
    const internal = !!opts.internal;
    if (!internal && isProtected(n)) throw new Error("[X] Protegido (partida o backup): no se puede escribir " + n);
    if (this.onBeforeWrite && this.mode !== "demo" && !internal && !opts.skipBackup) {
      await this.onBeforeWrite(n, u8);
    }
    if (internal && this.mode === "fallback") {
      this._backupMem.set(n, u8);
      this._indexLower?.set(n.toLowerCase(), n);
      return { written: true, memory: true };
    }
    if (internal && this.mode === "demo") {
      this._mem.set(n, u8);
      this.pendingWrites.delete(n);
      this._indexLower?.set(n.toLowerCase(), n);
      this._imgCache.delete(n.toLowerCase());
      return { written: true };
    }
    if (this.mode === "android") {
      await this._bridge("pmWrite", n, bytesToBase64(u8));
      this._indexLower?.set(n.toLowerCase(), n);
      this._imgCache.delete(n.toLowerCase());
      return { written: true };
    }
    if (this.mode === "browser") {
      const h = await this._fileHandle(n, true);
      const w = await h.createWritable();
      await w.write(u8);
      await w.close();
      this._indexLower?.set(n.toLowerCase(), n);
      this._imgCache.delete(n.toLowerCase());
      return { written: true };
    }
    // fallback/demo: se guarda como pendiente (descargar ZIP o aplicar en demo)
    this.pendingWrites.set(n, u8);
    this._imgCache.delete(n.toLowerCase());
    return { written: false, pending: true };
  },

  async writeText(rel, text) {
    return this.writeBytes(rel, new TextEncoder().encode(text));
  },

  async deleteFile(rel) {
    const n = normalizeRel(rel);
    if (isProtected(n)) throw new Error("[X] Protegido: no se puede borrar " + n);
    const real = this.resolve(n);
    if (this.mode === "android") {
      await this._bridge("pmDelete", real);
    } else if (this.mode === "browser") {
      const parts = real.split("/");
      const name = parts.pop();
      const dir = await this._dirHandle(parts.join("/"), false);
      // nombre con caja exacta
      let exact = name;
      for await (const [fname, entry] of dir.entries()) {
        if (entry.kind === "file" && fname.toLowerCase() === name.toLowerCase()) { exact = fname; break; }
      }
      await dir.removeEntry(exact);
    } else if (this.mode === "fallback") {
      this._files.delete(n);
      this.pendingWrites.delete(n);
      this.pendingDeletes.add(n);
    } else if (this.mode === "demo") {
      this._mem.delete(n);
      this.pendingWrites.delete(n);
    } else {
      throw new Error("Sin carpeta conectada");
    }
    this._indexLower?.delete(n.toLowerCase());
    this._imgCache.delete(n.toLowerCase());
    return true;
  },

  async readImage(rel) {
    const n = this.resolve(rel);
    const key = n.toLowerCase();
    if (this._imgCache.has(key)) return this._imgCache.get(key);
    const b = await this.readBytes(n);
    const blob = new Blob([b], { type: "image/png" });
    try {
      const bmp = await createImageBitmap(blob);
      this._imgCache.set(key, bmp);
      return bmp;
    } catch {
      // WebView antiguos: vía <img>
      const url = URL.createObjectURL(blob);
      const img = await new Promise((res, rej) => {
        const el = new Image();
        el.onload = () => res(el);
        el.onerror = rej;
        el.src = url;
      });
      this._imgCache.set(key, img);
      return img;
    }
  },

  // -- Interno (browser) ----------------------------------------------------------------
  async _dirHandle(rel, create) {
    const parts = normalizeRel(rel).split("/").filter(Boolean);
    let h = this._handles.get("");
    let cur = "";
    for (const p of parts) {
      cur = cur ? cur + "/" + p : p;
      if (!this._handles.has(cur)) {
        // buscar con caja exacta o aproximada
        let next = null;
        if (!create) {
          for await (const [name, entry] of h.entries()) {
            if (entry.kind === "directory" && name.toLowerCase() === p.toLowerCase()) { next = entry; break; }
          }
          if (!next) throw new Error("No existe carpeta: " + rel);
        } else {
          next = await h.getDirectoryHandle(p, { create: true });
        }
        this._handles.set(cur, next);
      }
      h = this._handles.get(cur);
    }
    return h;
  },

  async _fileHandle(rel, create) {
    const n = normalizeRel(rel);
    const parts = n.split("/");
    const name = parts.pop();
    const dir = await this._dirHandle(parts.join("/"), create);
    if (!create) {
      for await (const [fname, entry] of dir.entries()) {
        if (entry.kind === "file" && fname.toLowerCase() === name.toLowerCase()) return entry;
      }
      throw new Error("No existe: " + rel);
    }
    return dir.getFileHandle(name, { create: true });
  },
};
