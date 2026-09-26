// ============================================================================
// marshal.js — Lector/escritor Ruby Marshal 4.8 con fidelidad de ida y vuelta
// ----------------------------------------------------------------------------
// Lee y escribe los archivos Data/*.rxdata de RPG Maker XP (Ruby 1.8 / RGSS)
// preservando la semántica exacta: tabla de símbolos, enlaces (@), ivars,
// strings binarios, Bignum, Regexp, Struct, UserDef (Table), UserMarshal, etc.
//
// Regla de oro: si cargas un .rxdata y lo guardas SIN modificar, el juego
// debe cargarlo igual que el original (bytes semánticamente idénticos).
// ============================================================================

export const MARSHAL_MAJOR = 4;
export const MARSHAL_MINOR = 8;

const _utf8enc = new TextEncoder();
const _utf8dec = new TextDecoder("utf-8", { fatal: true });
const _latin1dec = new TextDecoder("windows-1252");

function bytesToText(bytes) {
  try {
    return _utf8dec.decode(bytes);
  } catch {
    return _latin1dec.decode(bytes);
  }
}

// --- Clases del modelo -------------------------------------------------------

export class RSymbol {
  // Guarda los bytes crudos para no perder información; `name` es vista.
  constructor(nameOrBytes) {
    if (typeof nameOrBytes === "string") this.bytes = _utf8enc.encode(nameOrBytes);
    else this.bytes = nameOrBytes instanceof Uint8Array ? nameOrBytes : new Uint8Array(nameOrBytes);
  }
  get name() { return bytesToText(this.bytes); }
  toString() { return ":" + this.name; }
}

export class RString {
  constructor(bytes, ivars = []) {
    this.bytes = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    this.ivars = ivars; // [ [RSymbol, valor], ... ]
  }
  static fromText(s) { return new RString(_utf8enc.encode(s)); }
  get text() { return bytesToText(this.bytes); }
  set text(s) { this.bytes = _utf8enc.encode(s); }
  toString() { return JSON.stringify(this.text); }
}

export class RObject {
  // className: string ("RPG::Map"); ivars: [ [nombreConArroba, valor], ... ]
  constructor(className, ivars = []) {
    this.className = className;
    this.ivars = ivars;
  }
  getIvar(name) {
    const n = name.startsWith("@") ? name : "@" + name;
    const f = this.ivars.find((p) => p[0] === n);
    return f ? f[1] : undefined;
  }
  setIvar(name, value) {
    const n = name.startsWith("@") ? name : "@" + name;
    const f = this.ivars.find((p) => p[0] === n);
    if (f) f[1] = value;
    else this.ivars.push([n, value]);
  }
}

export class RUserDef {
  constructor(className, bytes) {
    this.className = className;
    this.bytes = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  }
}

export class RUserMarshal {
  constructor(className, data) {
    this.className = className;
    this.data = data;
  }
}

export class RStruct {
  constructor(name, pairs = []) {
    this.name = name; // string
    this.pairs = pairs; // [ [RSymbol|string, valor], ... ]
  }
}

export class RRegexp {
  constructor(bytes, options = 0) {
    this.bytes = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    this.options = options;
  }
}

export class RFloat {
  constructor(value, raw) {
    this.value = value;
    this.raw = raw !== undefined ? raw : rubyFloatRepr(value);
  }
}

export class RHash {
  constructor(pairs = [], defVal = undefined) {
    this.pairs = pairs; // [ [clave, valor], ... ] preserva orden
    this.defVal = defVal;
  }
  get hasDefault() { return this.defVal !== undefined; }
  get(key, eq) {
    const f = this.pairs.find((p) => (eq ? eq(p[0], key) : p[0] === key));
    return f ? f[1] : this.defVal;
  }
  set(key, value, eq) {
    const f = this.pairs.find((p) => (eq ? eq(p[0], key) : p[0] === key));
    if (f) f[1] = value;
    else this.pairs.push([key, value]);
  }
}

export class RBignum {
  // sign: "+" | "-"; words: uint16 little-endian
  constructor(sign, words) {
    this.sign = sign;
    this.words = words;
  }
  toBigInt() {
    let v = 0n;
    for (let i = this.words.length - 1; i >= 0; i--) v = (v << 16n) | BigInt(this.words[i]);
    return this.sign === "-" ? -v : v;
  }
  static fromBigInt(bi) {
    const sign = bi < 0n ? "-" : "+";
    let v = bi < 0n ? -bi : bi;
    const words = [];
    if (v === 0n) words.push(0);
    while (v > 0n) { words.push(Number(v & 0xffffn)); v >>= 16n; }
    return new RBignum(sign, words);
  }
}

export class RClassRef {
  // kind: "c" (class) | "m" (module) | "M" (module antiguo)
  constructor(kind, name) {
    this.kind = kind;
    this.name = name;
  }
}

// --- Lector ------------------------------------------------------------------

class Reader {
  constructor(bytes) {
    this.b = bytes;
    this.p = 0;
    this.syms = []; // símbolos
    this.objs = []; // objetos linkeables
  }
  byte() {
    if (this.p >= this.b.length) throw new Error("Marshal: fin de datos inesperado");
    return this.b[this.p++];
  }
  bytes(n) {
    if (this.p + n > this.b.length) throw new Error("Marshal: fin de datos inesperado");
    const s = this.b.subarray(this.p, this.p + n);
    this.p += n;
    return s;
  }
  long() {
    const c = this.byte();
    if (c === 0) return 0;
    if (c >= 5 && c < 128) return c - 5; // 0..122
    if (c > 0 && c < 5) {
      // multibyte positivo
      let v = 0;
      for (let i = 0; i < c; i++) v += this.byte() * 256 ** i;
      return v;
    }
    // c >= 128 → con signo
    const cs = c - 256;
    if (cs > -5) {
      const n = -cs;
      if (n > 8) throw new Error("Marshal: entero demasiado largo");
      let raw = 0;
      for (let i = 0; i < n; i++) raw += this.byte() * 256 ** i;
      return raw - 256 ** n;
    }
    return cs + 5; // -123..0
  }
  rawBytes() {
    const n = this.long();
    if (n < 0) throw new Error("Marshal: longitud negativa");
    return this.bytes(n);
  }
  symbol() {
    const t = this.byte();
    if (t === 0x3a) { // ':'
      const s = new RSymbol(this.rawBytes().slice());
      this.syms.push(s);
      return s;
    }
    if (t === 0x3b) { // ';' symlink
      const idx = this.long();
      if (idx < 0 || idx >= this.syms.length) throw new Error("Marshal: symlink fuera de rango");
      return this.syms[idx];
    }
    throw new Error("Marshal: se esperaba símbolo, llegó 0x" + t.toString(16));
  }

  read() {
    const t = this.byte();
    switch (t) {
      case 0x30: return null; // '0'
      case 0x54: return true; // 'T'
      case 0x46: return false; // 'F'
      case 0x69: return this.long(); // 'i'
      case 0x66: return this.readFloat(); // 'f'
      case 0x6c: return this.readBignum(); // 'l'
      case 0x22: return this.readString(); // '"'
      case 0x2f: return this.readRegexp(); // '/'
      case 0x5b: return this.readArray(); // '['
      case 0x7b: return this.readHash(false); // '{'
      case 0x7d: return this.readHash(true); // '}'
      case 0x53: return this.readStruct(); // 'S'
      case 0x6f: return this.readObject(); // 'o'
      case 0x75: return this.readUserDef(); // 'u'
      case 0x55: return this.readUserMarshal(); // 'U'
      case 0x63: case 0x6d: case 0x4d: // 'c' 'm' 'M'
        return new RClassRef(String.fromCharCode(t), bytesToText(this.rawBytes().slice()));
      case 0x3a: { // símbolo suelto
        const s = new RSymbol(this.rawBytes().slice());
        this.syms.push(s);
        return s;
      }
      case 0x3b: { // ';'
        const idx = this.long();
        if (idx < 0 || idx >= this.syms.length) throw new Error("Marshal: symlink fuera de rango");
        return this.syms[idx];
      }
      case 0x40: { // '@' link
        const idx = this.long();
        if (idx < 0 || idx >= this.objs.length) throw new Error("Marshal: link fuera de rango");
        return this.objs[idx];
      }
      case 0x49: return this.readIVar(); // 'I'
      case 0x65: { // 'e' extended
        const mod = this.symbol();
        const obj = this.read();
        if (obj !== null && (typeof obj === "object")) obj.__ruby_extend = mod;
        return obj;
      }
      case 0x43: { // 'C' uclass
        const cls = this.symbol();
        const obj = this.read();
        if (obj !== null && (typeof obj === "object")) obj.__ruby_uclass = cls;
        return obj;
      }
      case 0x64: // 'd' Data (extensiones C) — no aparece en rxdata
        throw new Error("Marshal: tipo 'Data' no soportado (no existe en rxdata)");
      default:
        throw new Error("Marshal: tipo desconocido 0x" + t.toString(16) + " en offset " + (this.p - 1));
    }
  }

  readFloat() {
    const raw = bytesToText(this.rawBytes());
    let v;
    if (raw === "inf") v = Infinity;
    else if (raw === "-inf") v = -Infinity;
    else if (raw === "nan") v = NaN;
    else v = parseFloat(raw);
    const o = new RFloat(v, raw);
    this.objs.push(o);
    return o;
  }
  readBignum() {
    const sign = String.fromCharCode(this.byte());
    const n = this.long();
    const words = [];
    for (let i = 0; i < n; i++) {
      const lo = this.byte(), hi = this.byte();
      words.push(lo | (hi << 8));
    }
    const o = new RBignum(sign, words);
    this.objs.push(o);
    return o;
  }
  readString() {
    const o = new RString(this.rawBytes().slice());
    this.objs.push(o);
    return o;
  }
  readRegexp() {
    const o = new RRegexp(this.rawBytes().slice(), this.byte());
    this.objs.push(o);
    return o;
  }
  readArray() {
    const n = this.long();
    const a = [];
    this.objs.push(a);
    for (let i = 0; i < n; i++) a.push(this.read());
    return a;
  }
  readHash(withDefault) {
    const n = this.long();
    const h = new RHash();
    this.objs.push(h);
    for (let i = 0; i < n; i++) {
      const k = this.read();
      const v = this.read();
      h.pairs.push([k, v]);
    }
    if (withDefault) h.defVal = this.read();
    return h;
  }
  readStruct() {
    const name = this.symbol().name;
    const n = this.long();
    const s = new RStruct(name);
    this.objs.push(s);
    for (let i = 0; i < n; i++) {
      const k = this.symbol();
      s.pairs.push([k, this.read()]);
    }
    return s;
  }
  readObject() {
    const className = this.symbol().name;
    const n = this.long();
    const o = new RObject(className);
    this.objs.push(o);
    for (let i = 0; i < n; i++) {
      const k = this.symbol().name;
      o.ivars.push([k, this.read()]);
    }
    return o;
  }
  readUserDef() {
    const className = this.symbol().name;
    const o = new RUserDef(className, this.rawBytes().slice());
    this.objs.push(o);
    return o;
  }
  readUserMarshal() {
    const className = this.symbol().name;
    const o = new RUserMarshal(className, null);
    this.objs.push(o);
    o.data = this.read();
    return o;
  }
  readIVar() {
    const obj = this.read();
    const n = this.long();
    const pairs = [];
    for (let i = 0; i < n; i++) pairs.push([this.symbol(), this.read()]);
    if (obj instanceof RString) obj.ivars = pairs;
    else if (obj !== null && typeof obj === "object") obj.__ruby_ivars = pairs;
    return obj;
  }
}

export function marshalLoad(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (b.length < 2 || b[0] !== MARSHAL_MAJOR || b[1] !== MARSHAL_MINOR) {
    throw new Error(`Marshal: versión no soportada (esperaba 4.8, llegó ${b[0]}.${b[1]})`);
  }
  const r = new Reader(b);
  r.p = 2;
  const v = r.read();
  return v;
}

// --- Escritor ----------------------------------------------------------------

export function rubyFloatRepr(v) {
  if (Number.isNaN(v)) return "nan";
  if (v === Infinity) return "inf";
  if (v === -Infinity) return "-inf";
  if (Object.is(v, -0)) return "-0.0";
  let s = String(v);
  if (!/[.eEn]/.test(s)) s += ".0";
  return s;
}

class Writer {
  constructor() {
    this.out = [];
    this.syms = new Map(); // bytes-hex → índice
    this.objs = new Map(); // identidad → índice
  }
  byte(v) { this.out.push(v & 255); }
  bytes(u8) { for (let i = 0; i < u8.length; i++) this.out.push(u8[i]); }
  long(v) {
    if (!Number.isSafeInteger(v)) throw new Error("Marshal: entero fuera de rango: " + v);
    if (v === 0) { this.byte(0); return; }
    if (v > 0 && v <= 122) { this.byte(v + 5); return; }
    if (v < 0 && v >= -123) { this.byte(v + 251); return; }
    if (v > 0) {
      if (v > 0x7fffffff) throw new Error("Marshal: fixnum > 32 bits, usa Bignum: " + v);
      const n = v <= 0xff ? 1 : v <= 0xffff ? 2 : v <= 0xffffff ? 3 : 4;
      this.byte(n);
      for (let i = 0; i < n; i++) this.byte(Math.floor(v / 256 ** i) % 256);
      return;
    }
    // negativo multibyte: complemento a dos
    let n = 1;
    while (n <= 4 && v < -(256 ** n)) n++;
    if (n > 4) throw new Error("Marshal: fixnum muy negativo, usa Bignum: " + v);
    this.byte(256 - n);
    const raw = v + 256 ** n;
    for (let i = 0; i < n; i++) this.byte(Math.floor(raw / 256 ** i) % 256);
  }
  symbol(sym) {
    const s = sym instanceof RSymbol ? sym : new RSymbol(sym);
    const key = Array.from(s.bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    if (this.syms.has(key)) {
      this.byte(0x3b); // ';'
      this.long(this.syms.get(key));
    } else {
      const idx = this.syms.size;
      this.syms.set(key, idx);
      this.byte(0x3a); // ':'
      this.long(s.bytes.length);
      this.bytes(s.bytes);
    }
  }
  rawStr(bytes) {
    this.long(bytes.length);
    this.bytes(bytes);
  }
  linkable(obj) {
    // Devuelve true si YA estaba (y escribe el link). Si no, lo registra.
    if (this.objs.has(obj)) {
      this.byte(0x40); // '@'
      this.long(this.objs.get(obj));
      return true;
    }
    this.objs.set(obj, this.objs.size);
    return false;
  }

  write(v) {
    if (v === null || v === undefined) { this.byte(v === undefined ? 0x30 : 0x30); return; }
    if (v === true) { this.byte(0x54); return; }
    if (v === false) { this.byte(0x46); return; }
    if (typeof v === "number") {
      if (Number.isInteger(v)) {
        if (v >= -0x80000000 && v <= 0x7fffffff) { this.byte(0x69); this.long(v); return; }
        this.writeBignum(RBignum.fromBigInt(BigInt(v))); return;
      }
      this.writeFloat(new RFloat(v)); return;
    }
    if (typeof v === "bigint") { this.writeBignum(RBignum.fromBigInt(v)); return; }
    if (typeof v === "string") { this.write(new RString(_utf8enc.encode(v))); return; }
    if (v instanceof RSymbol) { this.symbol(v); return; }
    if (v instanceof RFloat) { this.writeFloat(v); return; }
    if (v instanceof RBignum) { this.writeBignum(v); return; }
    if (v instanceof RClassRef) {
      this.byte(v.kind.charCodeAt(0));
      this.rawStr(_utf8enc.encode(v.name));
      return;
    }
    // Wrappers externos (mismo orden que CRuby): extended → uclass → ivar
    if (v.__ruby_extend) {
      this.byte(0x65); // 'e'
      this.symbol(v.__ruby_extend);
      const saved = v.__ruby_extend;
      delete v.__ruby_extend;
      try { this.write(v); } finally { v.__ruby_extend = saved; }
      return;
    }
    if (v.__ruby_uclass) {
      this.byte(0x43); // 'C'
      this.symbol(v.__ruby_uclass);
      const saved = v.__ruby_uclass;
      delete v.__ruby_uclass;
      try { this.write(v); } finally { v.__ruby_uclass = saved; }
      return;
    }
    const extraIvars = v.__ruby_ivars;
    if (v instanceof RString) {
      if (this.linkable(v)) return;
      if (v.ivars.length || extraIvars?.length) {
        this.byte(0x49); // 'I'
        this.byte(0x22);
        this.rawStr(v.bytes);
        const pairs = v.ivars.length ? v.ivars : extraIvars;
        this.long(pairs.length);
        for (const [k, val] of pairs) { this.symbol(k); this.write(val); }
        return;
      }
      this.byte(0x22);
      this.rawStr(v.bytes);
      return;
    }
    if (Array.isArray(v)) {
      if (this.linkable(v)) return;
      if (extraIvars?.length) {
        this.byte(0x49);
        this.byte(0x5b);
        this.long(v.length);
        for (const e of v) this.write(e);
        this.long(extraIvars.length);
        for (const [k, val] of extraIvars) { this.symbol(k); this.write(val); }
        return;
      }
      this.byte(0x5b);
      this.long(v.length);
      for (const e of v) this.write(e);
      return;
    }
    if (v instanceof RHash) {
      if (this.linkable(v)) return;
      const writeBody = () => {
        this.long(v.pairs.length);
        for (const [k, val] of v.pairs) { this.write(k); this.write(val); }
        if (v.hasDefault) this.write(v.defVal);
      };
      if (extraIvars?.length) {
        this.byte(0x49);
        this.byte(v.hasDefault ? 0x7d : 0x7b);
        writeBody();
        this.long(extraIvars.length);
        for (const [k, val] of extraIvars) { this.symbol(k); this.write(val); }
        return;
      }
      this.byte(v.hasDefault ? 0x7d : 0x7b);
      writeBody();
      return;
    }
    if (v instanceof RStruct) {
      if (this.linkable(v)) return;
      this.byte(0x53);
      this.symbol(v.name);
      this.long(v.pairs.length);
      for (const [k, val] of v.pairs) { this.symbol(k); this.write(val); }
      return;
    }
    if (v instanceof RObject) {
      if (this.linkable(v)) return;
      this.byte(0x6f); // 'o'
      this.symbol(v.className);
      this.long(v.ivars.length);
      for (const [k, val] of v.ivars) { this.symbol(k); this.write(val); }
      return;
    }
    if (v instanceof RUserDef) {
      if (this.linkable(v)) return;
      this.byte(0x75); // 'u'
      this.symbol(v.className);
      this.rawStr(v.bytes);
      return;
    }
    if (v instanceof RUserMarshal) {
      if (this.linkable(v)) return;
      this.byte(0x55); // 'U'
      this.symbol(v.className);
      this.write(v.data);
      return;
    }
    if (v instanceof RRegexp) {
      if (this.linkable(v)) return;
      this.byte(0x2f);
      this.rawStr(v.bytes);
      this.byte(v.options);
      return;
    }
    throw new Error("Marshal: no sé escribir " + (v?.constructor?.name || typeof v));
  }

  writeFloat(f) {
    if (this.linkable(f)) return;
    this.byte(0x66);
    const b = _utf8enc.encode(f.raw);
    this.rawStr(b);
  }
  writeBignum(bn) {
    if (this.linkable(bn)) return;
    this.byte(0x6c);
    this.byte(bn.sign === "-" ? 0x2d : 0x2b);
    this.long(bn.words.length);
    for (const w of bn.words) { this.byte(w & 255); this.byte((w >> 8) & 255); }
  }
}

export function marshalDump(value) {
  const w = new Writer();
  w.byte(MARSHAL_MAJOR);
  w.byte(MARSHAL_MINOR);
  w.write(value);
  return new Uint8Array(w.out);
}

// --- Ayudas para depurar -----------------------------------------------------
export function marshalInspect(v, depth = 0) {
  const pad = "  ".repeat(depth);
  if (v === null) return "nil";
  if (v === true || v === false) return String(v);
  if (typeof v === "number" || typeof v === "bigint") return String(v);
  if (v instanceof RSymbol) return ":" + v.name;
  if (v instanceof RString) {
    const t = v.text;
    return `"${t.length > 40 ? t.slice(0, 40) + "…" : t}" (${v.bytes.length}B)`;
  }
  if (v instanceof RFloat) return `Float(${v.raw})`;
  if (v instanceof RBignum) return `Bignum(${v.toBigInt()})`;
  if (v instanceof RClassRef) return `${v.kind}(${v.name})`;
  if (v instanceof RRegexp) return `/${v.text || ""}/`;
  if (Array.isArray(v)) {
    if (depth > 3) return `[…${v.length}]`;
    return "[\n" + v.map((e) => pad + "  " + marshalInspect(e, depth + 1)).join(",\n") + "\n" + pad + "]";
  }
  if (v instanceof RHash) {
    if (depth > 3) return `{…${v.pairs.length}}`;
    return "{\n" + v.pairs.map(([k, val]) => pad + "  " + marshalInspect(k, depth + 1) + " => " + marshalInspect(val, depth + 1)).join(",\n") + "\n" + pad + "}";
  }
  if (v instanceof RObject) {
    if (depth > 2) return `#<${v.className} …>`;
    return `#<${v.className}\n` + v.ivars.map(([k, val]) => pad + `  ${k} = ` + marshalInspect(val, depth + 1)).join(",\n") + "\n" + pad + ">";
  }
  if (v instanceof RUserDef) return `#<UserDef ${v.className} ${v.bytes.length}B>`;
  if (v instanceof RUserMarshal) return `#<UserMarshal ${v.className}>`;
  if (v instanceof RStruct) return `Struct(${v.name})`;
  return String(v);
}
