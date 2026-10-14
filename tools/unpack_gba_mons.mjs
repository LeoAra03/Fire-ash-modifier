#!/usr/bin/env node
/**
 * unpack_gba_mons.mjs — extrae los sprites de Pokémon de los ROM de GBA con su
 * nombre y su paleta reales, localizando las tablas del motor de 3ª generación:
 *
 *   gMonFrontPicTable   paso 8  → { puntero LZ77 (4B), tamaño (2B), tag (2B) }
 *   gMonBackPicTable    paso 8  → idem
 *   gMonPaletteTable    paso 4  → puntero a paleta de 16 colores (32 B)
 *   gMonIconTable       paso 4  → puntero a icono 32×32 (0x200 B, sin comprimir)
 *   tabla de nombres    paso 11 → 11 bytes por especie, charmap de 3ª gen
 *
 * Salida: reference/roms_invitadas/<rom>/assets/mons/
 *   <nnn>_<NOMBRE>_front.png · _back.png · _icon.png · paletas/*.pal · mons.json
 *
 * Uso: node tools/unpack_gba_mons.mjs [--dir reference/roms_invitadas/entrada]
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import { deflateSync } from 'node:zlib';
import { lz77Descomprimir } from './unpack_assets.mjs';

/* ─────────────────────────────── PNG RGBA ────────────────────────────── */
const TABLA_CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c; }
  return t;
})();
function crc32(buf) { let c = -1; for (let i = 0; i < buf.length; i++) c = TABLA_CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return (c ^ -1) >>> 0; }
function chunk(t, d) {
  const l = Buffer.alloc(4); l.writeUInt32BE(d.length);
  const td = Buffer.concat([Buffer.from(t, 'ascii'), d]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc32(td));
  return Buffer.concat([l, td, c]);
}
function escribirPNG(ruta, w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  let p = 0;
  for (let y = 0; y < h; y++) { raw[p++] = 0; for (let x = 0; x < w * 4; x++) raw[p++] = rgba[y * w * 4 + x]; }
  mkdirSync(ruta.substring(0, ruta.lastIndexOf('/')), { recursive: true });
  writeFileSync(ruta, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]));
}

/* ────────────────────────── mapa de caracteres GBA ────────────────────── */
export function decodificarTextoGBA(bytes) {
  let s = '';
  for (const b of bytes) {
    if (b === 0xFF) break;
    if (b === 0x00) { s += ' '; continue; }
    if (b >= 0xBB && b <= 0xD4) { s += String.fromCharCode(65 + b - 0xBB); continue; }   // A-Z
    if (b >= 0xD5 && b <= 0xEE) { s += String.fromCharCode(97 + b - 0xD5); continue; }   // a-z
    if (b >= 0xA1 && b <= 0xAA) { s += String(b - 0xA1); continue; }                     // 0-9
    if (b === 0xB4) { s += '-'; continue; }
    if (b === 0xB0) { s += '...'; continue; }
    s += `{${b.toString(16).toUpperCase().padStart(2, '0')}}`;
  }
  return s.trim();
}

/** Busca la tabla de nombres de especie (11 bytes por entrada). */
export function buscarTablaNombres(data, minEntradas = 40) {
  let mejor = null;
  for (let o = 0; o + 11 < data.length; o++) {
    if (data[o + 10] !== 0xFF) continue;
    let n = 0;
    while (o + n * 11 + 11 <= data.length) {
      const e = data.subarray(o + n * 11, o + n * 11 + 11);
      if (e[10] !== 0xFF) break;
      let letras = 0;
      for (let k = 0; k < 10; k++) if ((e[k] >= 0xBB && e[k] <= 0xEE) || e[k] === 0x00) letras++;
      if (letras < 7) break;
      n++;
      if (n > 900) break;
    }
    if (n >= minEntradas && (!mejor || n > mejor.n)) mejor = { base: o, n };
    if (mejor) o += Math.max(0, mejor.n * 11 - 1);
  }
  if (!mejor) return null;
  const nombres = [];
  for (let i = 0; i < mejor.n; i++) {
    nombres.push(decodificarTextoGBA(data.subarray(mejor.base + i * 11, mejor.base + i * 11 + 11)));
  }
  return { base: mejor.base, nombres };
}

/** Busca tablas de sprites: paso 8 (puntero LZ77 + tamaño) o paso 4 (puntero). */
export function buscarTablasPunteros(data, opciones) {
  const { paso, minEntradas = 40, validar } = opciones;
  const halladas = [];
  for (let o = 0; o + paso < data.length; o++) {
    let n = 0;
    while (o + n * paso + paso <= data.length) {
      const ptr = data.readUInt32LE(o + n * paso);
      const off = ptr - 0x08000000;
      if (off < 0 || off >= data.length) break;
      if (!validar(data, off, o + n * paso)) break;
      n++;
      if (n > 900) break;
    }
    if (n >= minEntradas) {
      halladas.push({ base: o, n });
      o += n * paso - 1;
    }
  }
  halladas.sort((a, b) => b.n - a.n || a.base - b.base);
  return halladas;
}

const esLZ77 = (data, off) => data[off] === 0x10;
const tamEsperado = (data, off, esperado) => {
  const t = data.readUInt32LE(off + 1) & 0xFFFFFF;
  return t === esperado;
};

/** Paleta de 16 colores en formato 15-bit BGR (GBA). */
export function leerPaleta(data, off) {
  const pal = [];
  for (let i = 0; i < 16; i++) {
    const v = data.readUInt16LE(off + i * 2);
    const r = (v & 0x1F) << 3, g = ((v >> 5) & 0x1F) << 3, b = ((v >> 10) & 0x1F) << 3;
    pal.push([Math.min(255, r * 255 / 248), Math.min(255, g * 255 / 248), Math.min(255, b * 255 / 248)]);
  }
  return pal;
}

/** Renderiza tiles 4bpp (índice 0 transparente) con una paleta dada. */
export function renderizar(datos, paleta, tilesAncho, escala = 2) {
  const w = tilesAncho * 8;
  const altoTiles = Math.floor(datos.length / 32 / tilesAncho);
  const h = altoTiles * 8;
  const rgba = new Uint8Array(w * escala * h * escala * 4);
  for (let t = 0; t < tilesAncho * altoTiles; t++) {
    const tx = (t % tilesAncho) * 8, ty = Math.floor(t / tilesAncho) * 8;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const b = datos[t * 32 + y * 4 + (x >> 1)] || 0;
        const idx = (x & 1) ? (b >> 4) : (b & 0x0F);
        if (idx === 0) continue;
        const [r, g, bl] = paleta[idx];
        for (let dy = 0; dy < escala; dy++) {
          for (let dx = 0; dx < escala; dx++) {
            const px = (tx + x) * escala + dx, py = (ty + y) * escala + dy;
            const o = (py * w * escala + px) * 4;
            rgba[o] = r; rgba[o + 1] = g; rgba[o + 2] = bl; rgba[o + 3] = 255;
          }
        }
      }
    }
  }
  return { w: w * escala, h: h * escala, rgba };
}

/* ──────────────────────────────── programa ───────────────────────────── */

function procesar(ruta, salidaDir) {
  const data = readFileSync(ruta);
  const nombre = basename(ruta);
  console.log(`\n═══ ${nombre} ═══`);

  const nombres = buscarTablaNombres(data);
  if (!nombres) { console.log('  sin tabla de nombres'); return null; }
  console.log(`  Nombres de especie: ${nombres.nombres.length} (tabla 0x${nombres.base.toString(16)})`);

  // frontal y trasero: paso 8, puntero a LZ77 de 0x800 bytes (64×64 4bpp)
  const pics = buscarTablasPunteros(data, {
    paso: 8, minEntradas: 40,
    validar: (d, off, pos) => {
      if (!esLZ77(d, off)) return false;
      const tam = d.readUInt16LE(pos + 4);
      return (tam === 0x800 || tam === 0x1000) && tamEsperado(d, off, tam);
    },
  });
  console.log(`  Tablas de sprites 64×64: ${pics.map((p) => `0x${p.base.toString(16)} (${p.n})`).join(', ') || 'ninguna'}`);

  // paletas: paso 4 → 32 bytes con 16 colores válidos
  const pals = buscarTablasPunteros(data, {
    paso: 4, minEntradas: 40,
    validar: (d, off) => {
      if (off + 32 > d.length) return false;
      for (let i = 0; i < 16; i++) {
        const v = d.readUInt16LE(off + i * 2);
        if (v & 0x8000) return false;
      }
      // al menos 3 colores distintos y ninguno totalmente negro repetido 16 veces
      const s = new Set();
      for (let i = 0; i < 16; i++) s.add(d.readUInt16LE(off + i * 2));
      return s.size >= 3;
    },
  });
  console.log(`  Tablas de paletas: ${pals.map((p) => `0x${p.base.toString(16)} (${p.n})`).join(', ') || 'ninguna'}`);

  // iconos: paso 4 → 0x200 bytes sin comprimir (32×32 4bpp)
  const iconosT = buscarTablasPunteros(data, {
    paso: 4, minEntradas: 40,
    validar: (d, off) => off + 0x200 <= d.length && !esLZ77(d, off),
  });
  console.log(`  Tablas de iconos: ${iconosT.map((p) => `0x${p.base.toString(16)} (${p.n})`).join(', ') || 'ninguna'}`);

  const tFrontal = pics[0], tTrasero = pics[1];
  const tPaleta = pals.find((p) => !tFrontal || p.base > tFrontal.base) || pals[0];
  const tIconos = iconosT.find((p) => !tFrontal || p.base > tFrontal.base) || iconosT[0];

  const dirPal = join(salidaDir, 'mons/paletas');
  mkdirSync(dirPal, { recursive: true });
  const inventario = [];
  const total = Math.min(nombres.nombres.length, tFrontal ? tFrontal.n : 0);

  for (let i = 1; i < total; i++) {
    const nom = (nombres.nombres[i] || `SIN_NOMBRE_${i}`).replace(/[^A-Za-z0-9{}]/g, '_').toUpperCase();
    const etiqueta = `${String(i).padStart(3, '0')}_${nom}`;
    let paleta = null;
    if (tPaleta && i < tPaleta.n) {
      const ptr = data.readUInt32LE(tPaleta.base + i * 4);
      const off = ptr - 0x08000000;
      if (off >= 0 && off + 32 <= data.length) {
        paleta = leerPaleta(data, off);
        writeFileSync(join(dirPal, `${etiqueta}.pal`), Buffer.from(
          paleta.flatMap(([r, g, b]) => [Math.round(r), Math.round(g), Math.round(b)])));
      }
    }
    if (!paleta) continue;
    const fila = { indice: i, nombre: nombres.nombres[i], archivos: {} };

    const exportar = (tabla, sufijo, tilesAncho, escala) => {
      if (!tabla || i >= tabla.n) return;
      const ptr = data.readUInt32LE(tabla.base + i * 8);
      const off = ptr - 0x08000000;
      const dec = lz77Descomprimir(data, off);
      if (!dec) return;
      const img = renderizar(dec, paleta, tilesAncho, escala);
      const f = join(salidaDir, 'mons', `${etiqueta}_${sufijo}.png`);
      escribirPNG(f, img.w, img.h, img.rgba);
      fila.archivos[sufijo] = basename(f);
    };
    exportar(tFrontal, 'front', 8, 2);
    exportar(tTrasero, 'back', 8, 2);

    if (tIconos && i < tIconos.n) {
      const ptr = data.readUInt32LE(tIconos.base + i * 4);
      const off = ptr - 0x08000000;
      if (off >= 0 && off + 0x200 <= data.length) {
        const img = renderizar(data.subarray(off, off + 0x200), paleta, 4, 3);
        const f = join(salidaDir, 'mons', `${etiqueta}_icon.png`);
        escribirPNG(f, img.w, img.h, img.rgba);
        fila.archivos.icon = basename(f);
      }
    }
    if (Object.keys(fila.archivos).length) inventario.push(fila);
  }

  console.log(`  Especies exportadas: ${inventario.length}`);
  const indice = {
    rom: nombre,
    tablas: {
      nombres: `0x${nombres.base.toString(16)}`,
      frontales: tFrontal ? `0x${tFrontal.base.toString(16)} (${tFrontal.n})` : null,
      traseros: tTrasero ? `0x${tTrasero.base.toString(16)} (${tTrasero.n})` : null,
      paletas: tPaleta ? `0x${tPaleta.base.toString(16)} (${tPaleta.n})` : null,
      iconos: tIconos ? `0x${tIconos.base.toString(16)} (${tIconos.n})` : null,
    },
    especies: inventario,
  };
  writeFileSync(join(salidaDir, 'mons/mons.json'), JSON.stringify(indice, null, 2));
  writeFileSync(join(salidaDir, 'mons/especies.txt'),
    nombres.nombres.map((n, i) => `${String(i).padStart(3, '0')}\t${n}`).join('\n') + '\n');
  return indice;
}

function main() {
  const args = process.argv.slice(2);
  const dirIn = (args.includes('--dir') ? args[args.indexOf('--dir') + 1] : null) || 'reference/roms_invitadas/entrada';
  const salidaBase = (args.includes('--salida') ? args[args.indexOf('--salida') + 1] : null) || 'reference/roms_invitadas';
  const roms = readdirSync(dirIn).filter((f) => /\.gba$/i.test(f));
  const resumen = [];
  for (const f of roms.sort()) {
    const s = basename(f, extname(f)).replace(/[^\w.-]+/g, '_');
    const salida = join(salidaBase, s, 'assets');
    mkdirSync(salida, { recursive: true });
    const r = procesar(join(dirIn, f), salida);
    if (r) resumen.push({ rom: f, ...r });
  }
  writeFileSync('content/mons_invitados.json', JSON.stringify(resumen.map((r) => ({
    rom: r.rom, tablas: r.tablas, especies: r.especies.length,
  })), null, 2));
  console.log('\n✔ Resumen: content/mons_invitados.json');
}

if (process.argv[1] && process.argv[1].endsWith('unpack_gba_mons.mjs')) main();
