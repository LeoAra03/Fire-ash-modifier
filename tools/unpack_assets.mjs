#!/usr/bin/env node
/**
 * unpack_assets.mjs — Desempaquetador de assets de las ROMs invitadas.
 *
 * Saca TODOS los assets gráficos y de texto que se pueden decodificar de cada
 * ROM y los deja en una carpeta propia (fuera del juego) lista para usarlos
 * como material de referencia para Fire Ash.
 *
 *   GB / GBC  → sprites de Pokémon (frontal + trasero), descompresión RLE de
 *               1ª generación, emparejados con su especie mediante la tabla de
 *                estadísticas base (paso 28, punteros en +0x0B y +0x0D).
 *   GBA       → bloques LZ77 (compresión estándar de la BIOS de GBA),
 *               exportados como tiles 4bpp + PNG con paleta de grises.
 *
 * Uso:
 *   node tools/unpack_assets.mjs [--dir <carpeta_entrada>] [--salida <dir>]
 *
 * Nada de esto se copia al juego: se guarda en reference/roms_invitadas/<rom>/assets
 * (carpeta ignorada por git) como material de referencia.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import { deflateSync } from 'node:zlib';

/* ──────────────────────────── PNG mínimo (indexado 8 bits) ───────────────── */

function crc32(buf) {
  let c, crc = 0xFFFFFFFF;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xFF;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(tipo, datos) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(datos.length);
  const td = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

/** Escribe un PNG indexado de 8 bits. `pix` = array de índices (w*h). */
function escribirPNG(ruta, w, h, pix, paleta) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;   // profundidad
  ihdr[9] = 3;   // indexado
  const plte = Buffer.concat(paleta.map(([r, g, b]) => Buffer.from([r, g, b])));
  const raw = Buffer.alloc((w + 1) * h);
  let p = 0;
  for (let y = 0; y < h; y++) {
    raw[p++] = 0; // filtro none
    for (let x = 0; x < w; x++) raw[p++] = pix[y * w + x] & 0xFF;
  }
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('PLTE', plte),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  writeFileSync(ruta, png);
  return png.length;
}

const PALETA_DMG = [[255, 255, 255], [176, 176, 176], [96, 96, 96], [0, 0, 0]];
const PALETA_GRIS = Array.from({ length: 16 }, (_, i) => {
  const v = (i * 17) & 0xFF;
  return [v, v, v];
});

/* ─────────────────────── Sprites de 1ª generación (GB) ───────────────────── */

// Tablas de decodificación diferencial (pret/pokered home/uncompress.asm)
const TABLA_0 = [0x01, 0x32, 0x76, 0x45, 0xFE, 0xCD, 0x89, 0xBA];
const TABLA_1 = [0xFE, 0xCD, 0x89, 0xBA, 0x01, 0x32, 0x76, 0x45];

/** DifferentialDecodeNybble */
function decodificarNybble(n, e) {
  const c = n & 1;
  const idx = n >> 1;
  const t = (e & 1) ? TABLA_1[idx] : TABLA_0[idx];
  return c ? (t & 0x0F) : (t >> 4);
}

/**
 * SpriteDifferentialDecode (in-place sobre un plano).
 * Recorre el plano por FILAS (todas las columnas de tile de una fila, luego la
 * siguiente): el último nybble decodificado se arrastra entre tiles de la misma
 * fila y se reinicia al empezar cada fila (tal y como hace la ROM).
 */
function deltaDecodificar(buf, wt, ht) {
  const alto = ht * 8;
  for (let r = 0; r < alto; r++) {
    let e = 0;                       // se reinicia en cada fila
    for (let g = 0; g < wt; g++) {
      const idx = g * alto + r;
      const b = buf[idx];
      const altoN = decodificarNybble(b >> 4, e);
      const bajoN = decodificarNybble(b & 0x0F, altoN);
      buf[idx] = (altoN << 4) | bajoN;
      e = bajoN;                     // se arrastra al siguiente tile de la fila
    }
  }
}

/** Lector de bits MSB-first (ReadNextInputBit de la ROM) */
class Bits {
  constructor(data, pos) { this.d = data; this.pos = pos; this.cont = 1; this.cur = 0; }
  bit() {
    if (--this.cont === 0) {
      if (this.pos >= this.d.length) throw new Error('EOF');
      this.cur = this.d[this.pos++];
      this.cont = 8;
    }
    this.cur = ((this.cur << 1) | (this.cur >> 7)) & 0xFF; // rlca
    return this.cur & 1;
  }
}

/**
 * Descomprime un sprite de 1ª generación empezando en `offset`.
 * Devuelve null si los datos no son un sprite válido.
 */
export function descomprimirSpriteGB(data, offset) {
  const dim = data[offset];
  let wt = dim >> 4, ht = dim & 0x0F;
  if (wt === 0) wt = 32;
  if (ht === 0) ht = 32;
  if (wt > 7 || ht > 7) return null;
  const ancho = wt * 8, alto = ht * 8;
  const tamPlano = wt * ht * 8;
  if (tamPlano > 392) return null;

  const r = new Bits(data, offset + 1);
  const planos = [new Uint8Array(392), new Uint8Array(392)];
  let modo = 0;
  let flag0 = 0;

  try {
    flag0 = r.bit();
    for (let trozo = 0; trozo < 2; trozo++) {
      const buf = planos[(flag0 ^ trozo) & 1];
      const st = { x: 0, y: 0, bo: 3, ptr: 0, cache: 0 };
      const mover = () => {
        st.y++;
        if (st.y === alto) {
          st.y = 0;
          if (st.bo !== 0) { st.bo--; st.ptr = st.cache; }
          else {
            st.bo = 3; st.x += 8;
            if (st.x === ancho) return true;      // plano completo
            st.ptr++; st.cache = st.ptr;
          }
        } else st.ptr++;
        return false;
      };
      const escribir = (par) => {
        if (st.ptr < 392) buf[st.ptr] |= (par & 3) << (2 * st.bo);
      };

      if (trozo === 1) {
        const b = r.bit();
        modo = b ? r.bit() + 1 : 0;
      }

      let literal = r.bit() === 1;
      let terminado = false;
      while (!terminado) {
        if (literal) {
          while (true) {
            const hi = r.bit(), lo = r.bit();
            const par = (hi << 1) | lo;
            if (par === 0) { literal = false; break; }
            escribir(par);
            if (mover()) { terminado = true; break; }
          }
        } else {
          let c = 0;
          while (r.bit()) { if (++c > 20) return null; }
          const off = (1 << (c + 1)) - 1;
          let v = 0;
          for (let i = 0; i <= c; i++) v = (v << 1) | r.bit();
          let total = (off + v) & 0xFFFF;
          while (true) {
            escribir(0);
            if (mover()) { terminado = true; break; }
            total = (total - 1) & 0xFFFF;
            if (total === 0) break;
          }
          literal = true;
        }
      }
    }
  } catch {
    return null;
  }

  // UnpackSprite: el orden de los planos depende del primer bit del stream.
  const [p1, p2] = planos;
  const primero = (flag0 & 1) === 0 ? p1 : p2;   // primer trozo del stream
  const segundo = (flag0 & 1) === 0 ? p2 : p1;   // segundo trozo
  if (modo === 0) {
    deltaDecodificar(p1, wt, ht);
    deltaDecodificar(p2, wt, ht);
  } else if (modo === 1) {
    deltaDecodificar(primero, wt, ht);
    for (let i = 0; i < tamPlano; i++) segundo[i] ^= primero[i];
  } else {
    deltaDecodificar(segundo, wt, ht);
    deltaDecodificar(primero, wt, ht);
    for (let i = 0; i < tamPlano; i++) segundo[i] ^= primero[i];
  }

  return { ancho, alto, wt, ht, p1, p2, modo, consumido: r.pos - offset, flag0, tamPlano };
}

/** Une los dos planos 1bpp en una matriz de píxeles 0-3. */
export function planosAPixeles(sp) {
  const { ancho, alto, wt, p1, p2 } = sp;
  const pix = new Uint8Array(ancho * alto);
  for (let g = 0; g < wt; g++) {
    const base = g * alto;
    for (let y = 0; y < alto; y++) {
      const b1 = p1[base + y], b2 = p2[base + y];
      for (let x = 0; x < 8; x++) {
        const bit = 7 - x;
        pix[y * ancho + g * 8 + x] = (((b2 >> bit) & 1) << 1) | ((b1 >> bit) & 1);
      }
    }
  }
  return pix;
}

/** Coloca un sprite frontal en un lienzo de 56×56 (centrado abajo, como la ROM). */
export function centrarFrontal(pix, sp) {
  const W = 56, H = 56;
  const salida = new Uint8Array(W * H);
  const xoff = sp.wt === 6 ? 8 : (7 - sp.wt) * 4;
  const yoff = (7 - sp.ht) * 8;
  for (let y = 0; y < sp.alto; y++) {
    for (let x = 0; x < sp.ancho; x++) {
      const dy = y + yoff, dx = x + xoff;
      if (dx >= 0 && dx < W && dy >= 0 && dy < H) salida[dy * W + dx] = pix[y * sp.ancho + x];
    }
  }
  return salida;
}

/** Trasero: la ROM lo amplía ×2 y descarta la última fila/columna de tiles. */
export function ampliarTrasero(pix, sp) {
  const W = 56, H = 56;
  const salida = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      salida[y * W + x] = pix[(y >> 1) * sp.ancho + (x >> 1)] || 0;
    }
  }
  return salida;
}

/* ── mapa de caracteres de 1ª generación ── */
export function decodificarTextoGB(bytes) {
  let s = '';
  for (const b of bytes) {
    if (b === 0x50) break;
    if (b >= 0x80 && b <= 0x99) s += String.fromCharCode(65 + b - 0x80);
    else if (b === 0x7F) s += ' ';
    else if (b >= 0xF6 && b <= 0xFF) s += String(b - 0xF6);
    else s += `{${b.toString(16).toUpperCase().padStart(2, '0')}}`;
  }
  return s.trim();
}

/** Recorre la tabla de nombres de especie (10 bytes por entrada). */
export function leerNombresGB(data, base, tolerante = true) {
  const nombres = [];
  let o = base;
  while (o + 10 <= data.length) {
    const e = data.subarray(o, o + 10);
    let letras = 0;
    for (const b of e) if (b >= 0x80 && b <= 0x99) letras++;
    if (!tolerante && letras === 0) break;
    if (letras < 2) break;
    nombres.push({ indice: nombres.length, offset: o, nombre: decodificarTextoGB(e) });
    o += 10;
    if (nombres.length > 400) break;
  }
  return nombres;
}

/**
 * Localiza todos los sprites del ROM:
 *  1) prueba todos los offsets cuyo primer byte es una dimensión válida,
 *  2) descarta los que no tienen el tamaño comprimido propio de un sprite real,
 *  3) encadena los que están seguidos (los bancos gráficos son contiguos).
 */
export function buscarSpritesGB(data) {
  const rango = { '7,7': [150, 650], '6,6': [120, 550], '5,5': [80, 450], '4,4': [30, 320] };
  const validos = new Map();
  for (let o = 0; o < data.length - 2; o++) {
    const dim = data[o];
    // un sprite válido de la 1ª generación es cuadrado: 4x4, 5x5, 6x6 o 7x7 tiles
    if (!((dim >> 4) >= 4 && (dim >> 4) <= 7 && (dim >> 4) === (dim & 0xF))) continue;
    const sp = descomprimirSpriteGB(data, o);
    if (!sp) continue;
    const rg = rango[`${sp.wt},${sp.ht}`];
    if (rg && (sp.consumido < rg[0] || sp.consumido > rg[1])) continue;
    validos.set(o, sp);
  }
  const usados = new Set();
  const cadenas = [];
  for (const o of [...validos.keys()].sort((a, b) => a - b)) {
    if (usados.has(o)) continue;
    const cad = [o];
    usados.add(o);
    let cur = o;
    while (cad.length < 400) {
      const L = validos.get(cur).consumido;
      let sig = null;
      for (const pad of [0, 1, 2]) {
        const n = cur + L + pad;
        if (validos.has(n) && !usados.has(n)) { sig = n; break; }
      }
      if (sig === null) break;
      cad.push(sig);
      usados.add(sig);
      cur = sig;
    }
    if (cad.length >= 3) cadenas.push(cad);
  }
  cadenas.sort((a, b) => b.length - a.length);
  return { validos, cadenas };
}

/**
 * Encuentra la tabla de estadísticas base buscando dónde aparecen los punteros
 * de 16 bits de los sprites: paso 28, frontal en +0x0B, trasero en +0x0D.
 */
export function encontrarTablaBaseStats(data, sprites, cadenas, nEspecies) {
  // índice valor de 16 bits -> posiciones donde aparece (una sola pasada)
  const indice = new Map();
  for (let i = 0; i + 1 < data.length; i++) {
    const v = data[i] | (data[i + 1] << 8);
    if (v < 0x4000 || v >= 0x8000) continue;
    let l = indice.get(v);
    if (!l) indice.set(v, (l = []));
    l.push(i);
  }
  const ptrDe = (o) => 0x4000 + (o - Math.floor(o / 0x4000) * 0x4000);

  // 1) votación con el primer sprite de cada banco gráfico
  const votos = new Map();
  for (const cad of cadenas.slice(0, 60)) {
    const pos = indice.get(ptrDe(cad[0])) || [];
    for (const p of pos) {
      if (p > 0x80000) continue;
      for (let k = 0; k < 220; k++) {
        const T = p - 0x0B - 28 * k;
        if (T < 0) break;
        votos.set(T, (votos.get(T) || 0) + 1);
      }
    }
  }
  // 2) los finalistas se puntúan con el emparejamiento real:
  //    en la ROM el trasero está justo después del frontal.
  const finalistas = [...votos.entries()].sort((a, b) => b[1] - a[1]).slice(0, 300).map(([T]) => T);
  let mejor = null;
  for (const T of finalistas) {
    const pares = emparejarEspecies(data, { base: T }, sprites, nEspecies);
    let res = 0, ady = 0;
    for (const p of pares) {
      if (p.frontal === null) continue;
      res++;
      if (p.trasero !== null) {
        const d = p.trasero - p.frontal - sprites.get(p.frontal).consumido;
        if (d >= 0 && d <= 2) ady++;
      }
    }
    const puntos = ady * 2 + res;
    if (!mejor || puntos > mejor.puntos) mejor = { base: T, puntos, res, ady, votos: votos.get(T) };
  }
  return mejor;
}

/** Empareja cada especie con sus dos sprites usando la tabla anterior. */
export function emparejarEspecies(data, tabla, sprites, nNombres) {
  const { base } = tabla;
  const salida = [];
  const resolver = (ptr) => {
    if (ptr < 0x4000 || ptr >= 0x8000) return null;
    const off = ptr - 0x4000;
    for (let banco = 1; banco < 64; banco++) {
      const abs = banco * 0x4000 + off;
      if (sprites.has(abs)) return abs;
    }
    return null;
  };
  for (let i = 0; i < nNombres; i++) {
    const e = base + 28 * i;
    if (e + 14 >= data.length) break;
    const ptrF = data[e + 0x0B] | (data[e + 0x0C] << 8);
    const ptrT = data[e + 0x0D] | (data[e + 0x0E] << 8);
    salida.push({ indice: i, ptrFrontal: ptrF, ptrTrasero: ptrT, frontal: resolver(ptrF), trasero: resolver(ptrT) });
  }
  return salida;
}

/* ─────────────────────────────── GBA: LZ77 ──────────────────────────────── */

/** LZ77 de la BIOS de GBA (variante LZ10). Devuelve null si no encaja. */
export function lz77Descomprimir(data, off, maxSalida = 0x40000) {
  if (off + 4 > data.length) return null;
  if (data[off] !== 0x10) return null;
  const tam = data[off + 1] | (data[off + 2] << 8) | (data[off + 3] << 16);
  if (tam <= 0 || tam > maxSalida) return null;
  const salida = Buffer.alloc(tam);
  let p = off + 4, d = 0;
  while (d < tam && p < data.length) {
    const flags = data[p++];
    for (let i = 0; i < 8 && d < tam && p < data.length; i++) {
      if (flags & (0x80 >> i)) {
        const b1 = data[p++], b2 = data[p++];
        const len = (b1 >> 4) + 3;
        const disp = (((b1 & 0x0F) << 8) | b2) + 1;
        if (disp > d) return null;
        for (let k = 0; k < len && d < tam; k++) salida[d++] = salida[d - disp];
      } else {
        salida[d++] = data[p++];
      }
    }
  }
  return d === tam ? salida : null;
}

/** Renderiza datos de tiles 4bpp como PNG (16 colores, paleta de grises). */
export function tiles4bppAPixeles(buf, anchoTiles = 16) {
  const nTiles = Math.floor(buf.length / 32);
  if (!nTiles) return null;
  const px = anchoTiles * 8;
  const filas = Math.ceil(nTiles / anchoTiles) * 8;
  const pix = new Uint8Array(px * filas);
  for (let t = 0; t < nTiles; t++) {
    const tx = (t % anchoTiles) * 8, ty = Math.floor(t / anchoTiles) * 8;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const b = buf[t * 32 + y * 4 + (x >> 1)];
        const v = (x & 1) ? (b >> 4) : (b & 0x0F);
        const px1 = tx + x, py = ty + y;
        if (py < filas && px1 < px) pix[py * px + px1] = v;
      }
    }
  }
  return { pix, w: px, h: filas, nTiles };
}

function escanearLZ77(data) {
  const bloques = [];
  for (let o = 0; o < data.length - 4; o++) {
    if (data[o] !== 0x10) continue;
    const tam = data[o + 1] | (data[o + 2] << 8) | (data[o + 3] << 16);
    if (tam < 64 || tam > 0x40000 || o + 4 + tam > data.length + 64) continue;
    const dec = lz77Descomprimir(data, o);
    if (!dec) continue;
    // descarta bloques que no parecen gráficos (demasiado uniformes)
    let distintos = new Set();
    for (let i = 0; i < Math.min(dec.length, 512); i++) distintos.add(dec[i]);
    if (distintos.size < 4) continue;
    bloques.push({ offset: o, tam, datos: dec });
    o += 3;
  }
  return bloques;
}

/* ──────────────────────────────── programa ──────────────────────────────── */

function slug(nombre) {
  return basename(nombre, extname(nombre)).replace(/[^\w.-]+/g, '_');
}

function procesarGB(ruta, salidaDir) {
  const data = readFileSync(ruta);
  const nombre = basename(ruta);
  console.log(`\n═══ ${nombre} (${data.length} bytes, GB/GBC) ═══`);

  // 1) nombres de especie
  const nombres = leerNombresGB(data, 0x1C236);
  console.log(`  Especies en la tabla de nombres: ${nombres.length}`);

  // 2) sprites
  const { validos, cadenas } = buscarSpritesGB(data);
  console.log(`  Sprites decodificados: ${validos.size} (${cadenas.length} bancos gráficos)`);

  // 3) tabla de estadísticas base y emparejamiento
  const tabla = encontrarTablaBaseStats(data, validos, cadenas, nombres.length);
  let pares = [];
  if (tabla) {
    console.log(`  Tabla de estadísticas base: 0x${tabla.base.toString(16).toUpperCase()} (paso 28, ${tabla.ady} traseros contiguos, ${tabla.res} frontales)`);
    pares = emparejarEspecies(data, tabla, validos, nombres.length);
    const conAmbos = pares.filter((p) => p.frontal !== null && p.trasero !== null).length;
    const conFrontal = pares.filter((p) => p.frontal !== null).length;
    console.log(`  Especies emparejadas: ${conFrontal} con frontal, ${conAmbos} con frontal+trasero`);
  }

  // 4) exportar PNG
  const dirSprites = join(salidaDir, 'sprites');
  mkdirSync(dirSprites, { recursive: true });
  const inventario = [];
  for (const p of pares) {
    const nom = nombres[p.indice]?.nombre || `SIN_NOMBRE_${p.indice}`;
    const limpio = nom.replace(/[^A-Za-z0-9{}]/g, '_').toUpperCase();
    const fila = { indice: p.indice, nombre: nom, archivos: {} };
    if (p.frontal !== null) {
      const sp = validos.get(p.frontal);
      const pix = planosAPixeles(sp);
      const lienzo = centrarFrontal(pix, sp);
      const f = join(dirSprites, `${String(p.indice).padStart(3, '0')}_${limpio}_frontal.png`);
      escribirPNG(f, 56, 56, lienzo, PALETA_DMG);
      fila.archivos.frontal = basename(f);
      fila.frontal = { offset: `0x${p.frontal.toString(16)}`, tiles: `${sp.wt}x${sp.ht}`, modo: sp.modo, bytes: sp.consumido };
    }
    if (p.trasero !== null) {
      const sp = validos.get(p.trasero);
      const pix = planosAPixeles(sp);
      const lienzo = ampliarTrasero(pix, sp);
      const f = join(dirSprites, `${String(p.indice).padStart(3, '0')}_${limpio}_trasero.png`);
      escribirPNG(f, 56, 56, lienzo, PALETA_DMG);
      fila.archivos.trasero = basename(f);
      fila.trasero = { offset: `0x${p.trasero.toString(16)}`, tiles: `${sp.wt}x${sp.ht}`, modo: sp.modo, bytes: sp.consumido };
    }
    if (fila.archivos.frontal || fila.archivos.trasero) inventario.push(fila);
  }

  // 5) sprites sueltos (no emparejados): entrenadores y otros gráficos
  const emparejados = new Set();
  for (const p of pares) { if (p.frontal !== null) emparejados.add(p.frontal); if (p.trasero !== null) emparejados.add(p.trasero); }
  const dirOtros = join(salidaDir, 'sprites_sin_emparejar');
  mkdirSync(dirOtros, { recursive: true });
  const sueltos = [];
  for (const cad of cadenas) {
    for (const o of cad) {
      if (emparejados.has(o)) continue;
      const sp = validos.get(o);
      if (sp.ht < 5) continue; // los 4x4 sueltos suelen ser traseros sin emparejar
      const pix = planosAPixeles(sp);
      const lienzo = centrarFrontal(pix, sp);
      const f = join(dirOtros, `b${String(Math.floor(o / 0x4000)).padStart(2, '0')}_0x${o.toString(16).padStart(5, '0')}_${sp.wt}x${sp.ht}.png`);
      escribirPNG(f, 56, 56, lienzo, PALETA_DMG);
      sueltos.push({ archivo: basename(f), offset: `0x${o.toString(16)}`, tiles: `${sp.wt}x${sp.ht}`, modo: sp.modo });
    }
  }
  console.log(`  Sprites sueltos (entrenadores/otros): ${sueltos.length}`);

  // 6) textos: tabla de nombres exportada
  writeFileSync(join(salidaDir, 'especies.txt'),
    nombres.map((n) => `${String(n.indice).padStart(3, '0')}\t${n.nombre}\t0x${n.offset.toString(16)}`).join('\n') + '\n');

  const indice = {
    rom: nombre, tipo: 'GB/GBC', tamano: data.length,
    especies: nombres.length,
    sprites_decodificados: validos.size,
    bancos_graficos: cadenas.slice(0, 12).map((c) => ({ inicio: `0x${c[0].toString(16)}`, n: c.length })),
    tabla_base_stats: tabla ? `0x${tabla.base.toString(16)}` : null,
    emparejados: inventario.length,
    sueltos: sueltos.length,
    sprites: inventario,
    sprites_sueltos: sueltos,
  };
  writeFileSync(join(salidaDir, 'indice_assets.json'), JSON.stringify(indice, null, 2));
  return indice;
}

function procesarGBA(ruta, salidaDir) {
  const data = readFileSync(ruta);
  const nombre = basename(ruta);
  console.log(`\n═══ ${nombre} (${data.length} bytes, GBA) ═══`);
  const bloques = escanearLZ77(data);
  console.log(`  Bloques LZ77 válidos: ${bloques.length}`);

  const dirGraficos = join(salidaDir, 'graficos_lz77');
  const dirDatos = join(salidaDir, 'datos_lz77');
  mkdirSync(dirGraficos, { recursive: true });
  mkdirSync(dirDatos, { recursive: true });

  const inventario = [];
  const graficos = bloques.filter((b) => b.tam % 32 === 0 && b.tam >= 512);
  for (const b of graficos) {
    const hex = b.offset.toString(16).padStart(6, '0');
    writeFileSync(join(dirDatos, `lz_${hex}.bin`), b.datos);
    const img = tiles4bppAPixeles(b.datos, 16);
    if (!img) continue;
    const f = join(dirGraficos, `lz_${hex}.png`);
    escribirPNG(f, img.w, img.h, img.pix, PALETA_GRIS);
    inventario.push({ offset: `0x${b.offset.toString(16)}`, descomprimido: b.tam, tiles: img.nTiles, png: basename(f), bin: `lz_${hex}.bin` });
  }
  console.log(`  Gráficos exportados: ${inventario.length} PNG + ${graficos.length} BIN`);

  const indice = {
    rom: nombre, tipo: 'GBA', tamano: data.length,
    bloques_lz77: bloques.length,
    graficos_exportados: inventario.length,
    bloques: inventario,
  };
  writeFileSync(join(salidaDir, 'indice_assets.json'), JSON.stringify(indice, null, 2));
  return indice;
}

function main() {
  const args = process.argv.slice(2);
  const dirIn = (args.includes('--dir') ? args[args.indexOf('--dir') + 1] : null) || 'reference/roms_invitadas/entrada';
  const salidaBase = (args.includes('--salida') ? args[args.indexOf('--salida') + 1] : null) || 'reference/roms_invitadas';

  if (!existsSync(dirIn)) {
    console.error(`No existe la carpeta de entrada: ${dirIn}`);
    process.exit(1);
  }
  const roms = readdirSync(dirIn).filter((f) => /\.(gba|gb|gbc)$/i.test(f));
  if (!roms.length) {
    console.error(`No hay ROMs en ${dirIn}`);
    process.exit(1);
  }

  console.log(`Desempaquetando ${roms.length} ROM(s) de ${dirIn} → ${salidaBase}/<rom>/assets`);
  const resumen = [];
  for (const f of roms.sort()) {
    const ruta = join(dirIn, f);
    const s = slug(f);
    const salida = join(salidaBase, s, 'assets');
    mkdirSync(salida, { recursive: true });
    const indice = /\.gb$/i.test(f) ? procesarGB(ruta, salida) : procesarGBA(ruta, salida);
    resumen.push({ rom: f, carpeta: salida, ...indice });
  }

  // informe global
  const lineas = ['# Assets desempaquetados de las ROMs invitadas', ''];
  for (const r of resumen) {
    lineas.push(`## ${r.rom} (${r.tipo})`);
    lineas.push(`- Carpeta: \`${r.carpeta}\``);
    if (r.tipo === 'GB/GBC') {
      lineas.push(`- Especies identificadas: **${r.especies}**`);
      lineas.push(`- Sprites decodificados: **${r.sprites_decodificados}** (frontal+trasero emparejados: ${r.emparejados}, sueltos: ${r.sueltos})`);
      lineas.push(`- Tabla de estadísticas base: ${r.tabla_base_stats}`);
    } else {
      lineas.push(`- Bloques LZ77 válidos: **${r.bloques_lz77}**`);
      lineas.push(`- Gráficos exportados: **${r.graficos_exportados}** (PNG + BIN)`);
    }
    lineas.push('');
  }
  writeFileSync(join(salidaBase, 'ASSETS_DESEMPAQUETADOS.md'), lineas.join('\n'));
  console.log(`\n✔ Informe: ${join(salidaBase, 'ASSETS_DESEMPAQUETADOS.md')}`);
}

if (process.argv[1] && process.argv[1].endsWith('unpack_assets.mjs')) main();
