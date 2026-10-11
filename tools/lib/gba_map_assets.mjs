/**
 * gba_map_assets.mjs — lectura directa de mapas y gráficos de un ROM de GBA.
 *
 * A diferencia de `tools/gba_maps_events.mjs` (que sólo inventaría el esqueleto),
 * aquí se leen las estructuras completas para poder reconstruir el mapa tal cual:
 *
 *   · MapLayout  → ancho, alto, puntero a los bloques y a los dos tilesets.
 *   · Tileset    → tiles 4bpp (LZ77 si hace falta), paletas BGR555, metatiles de
 *                  16 bytes (dos capas de 2×2 tiles) y atributos de colisión.
 *   · Bloques    → u16 por celda con el metatile y sus volteos.
 *
 * Cada metatile se compone a 32×32 px (16×16 escalado ×2), que es exactamente el
 * tamaño de tile de RPG Maker XP: un metatile de GBA = un tile del motor.
 */
import fs from "node:fs";
import { lz77, bgr555aRGB } from "../forense/gba.mjs";

export const BASE = 0x08000000;

export function cargarROM(ruta) {
  return fs.readFileSync(ruta);
}

export const u16 = (data, off) => data[off] | (data[off + 1] << 8);
export const u32 = (data, off) => (data[off] | (data[off + 1] << 8) | (data[off + 2] << 16) | (data[off + 3] << 24)) >>> 0;
export const esPtr = (v, len) => v >= BASE && v - BASE < len - 4;
export const offsetDe = (ptr) => ptr - BASE;

/** Descomprime (LZ77/RLE) o devuelve los bytes crudos si no hay cabecera. */
export function bytesEn(data, ptr, maxCrudo = 0) {
  const o = offsetDe(ptr);
  if (o < 0 || o >= data.length) return null;
  if (data[o] === 0x10 || data[o] === 0x30) {
    const res = data[o] === 0x10 ? lz77(data, o) : null;
    if (res) return Buffer.from(res.datos);
    return null;
  }
  if (!maxCrudo) return null;
  return Buffer.from(data.subarray(o, o + maxCrudo));
}

/* ─────────────────────────────── MapLayout ─────────────────────────────── */

function tilesetValido(data, ptr, len) {
  const o = offsetDe(ptr);
  if (o < 0 || o + 24 >= len) return false;
  if (data[o] > 1 || data[o + 1] > 1) return false;
  const validos = [4, 8, 12, 16, 20].filter((k) => esPtr(u32(data, o + k), len)).length;
  if (validos < 3) return false;
  if (data[o + 20] === 0 && data[o + 1] === 0) return false; // el tileset primario siempre trae callback
  return true;
}

/** Censo de todas las estructuras MapLayout del ROM (mismo criterio que el analizador). */
export function buscarMapLayouts(data) {
  const len = data.length;
  const hallados = [];
  for (let off = 0; off + 26 <= len; off += 4) {
    const width = u32(data, off);
    if (width < 8 || width > 200) continue;
    const height = u32(data, off + 4);
    if (height < 8 || height > 200) continue;
    if (!esPtr(u32(data, off + 8), len)) continue;
    const map = u32(data, off + 12);
    if (!esPtr(map, len)) continue;
    const prim = u32(data, off + 16);
    const sec = u32(data, off + 20);
    if (!esPtr(prim, len) || !esPtr(sec, len)) continue;
    if (!tilesetValido(data, prim, len) && !tilesetValido(data, sec, len)) continue;
    if (data[off + 24] > 8 || data[off + 25] > 8) continue;
    hallados.push({ off, width, height, map, prim, sec, comprimido: data[offsetDe(map)] === 0x10 });
  }
  return hallados;
}

/** Bloques del mapa: u16 por celda (metatile 10 bits | volteos | paleta | colisión). */
export function leerBloques(data, layout) {
  const len = layout.width * layout.height;
  let bytes;
  if (layout.comprimido) {
    bytes = bytesEn(data, layout.map) ?? Buffer.alloc(0);
  } else {
    bytes = data.subarray(offsetDe(layout.map), offsetDe(layout.map) + len * 2);
  }
  const bloques = new Uint16Array(len);
  for (let i = 0; i < len; i += 1) bloques[i] = bytes[i * 2] | ((bytes[i * 2 + 1] ?? 0) << 8);
  return bloques;
}

/* ──────────────────────────────── Tileset ──────────────────────────────── */

const cacheTilesets = new WeakMap();
const METATILES_POR_TILESET = 512;

/** Lee un Tileset completo: tiles descomprimidos, paletas y metatiles. */
export function leerTileset(data, ptr, { nMetatiles = METATILES_POR_TILESET } = {}) {
  let cache = cacheTilesets.get(data);
  if (!cache) { cache = new Map(); cacheTilesets.set(data, cache); }
  const clave = `${ptr}:${nMetatiles}`;
  if (cache.has(clave)) return cache.get(clave);

  const o = offsetDe(ptr);
  const comprimido = data[o] === 1;
  const esSecundario = data[o + 1] === 1;
  const tilesPtr = u32(data, o + 4);
  const paletasPtr = u32(data, o + 8);
  const metatilesPtr = u32(data, o + 12);
  const attrsPtr = u32(data, o + 16);

  // Tiles: hasta 512 por tileset (16 KB en VRAM a 4bpp).
  let tiles = comprimido ? (bytesEn(data, tilesPtr) ?? Buffer.alloc(0)) : Buffer.from(data.subarray(offsetDe(tilesPtr), offsetDe(tilesPtr) + 512 * 32));

  // Paletas: 16 paletas de 16 colores.
  const paletas = [];
  for (let p = 0; p < 16; p += 1) {
    const fila = [];
    for (let c = 0; c < 16; c += 1) fila.push(bgr555aRGB(u16(data, offsetDe(paletasPtr) + (p * 16 + c) * 2)));
    paletas.push(fila);
  }

  // Metatiles: 512 entradas de 16 bytes (8 tiles: 2 capas de 2×2).
  const metaBytes = bytesEn(data, metatilesPtr, nMetatiles * 16) ?? Buffer.alloc(nMetatiles * 16);
  const metatiles = [];
  for (let m = 0; m < nMetatiles; m += 1) {
    const base = m * 16;
    const entrada = [];
    for (let k = 0; k < 8; k += 1) entrada.push(metaBytes[base + k * 2] | ((metaBytes[base + k * 2 + 1] ?? 0) << 8));
    metatiles.push(entrada);
  }
  const attrs = [];
  const attrBytes = bytesEn(data, attrsPtr, nMetatiles * 2) ?? Buffer.alloc(nMetatiles * 2);
  for (let m = 0; m < nMetatiles; m += 1) attrs.push(attrBytes[m * 2] | ((attrBytes[m * 2 + 1] ?? 0) << 8));

  const valor = {
    ptr, comprimido, esSecundario, tiles, paletas, metatiles, attrs,
    tilesDisponibles: Math.floor(tiles.length / 32),
  };
  cache.set(clave, valor);
  return valor;
}

export const SPLIT_SECUNDARIO = METATILES_POR_TILESET;

/** Metatile dentro del par de tilesets del mapa (ids 0-511 primario · 512-1023 secundario). */
export function metatileDe(par, id) {
  const limpio = id & 0x3ff; // el u16 del bloque trae colisión/elevación en los bits altos
  return limpio < SPLIT_SECUNDARIO
    ? { tileset: par.primario, indice: limpio }
    : { tileset: par.secundario, indice: limpio - SPLIT_SECUNDARIO };
}

/* ──────────────────────────────── render ───────────────────────────────── */

const cacheMetatiles = new WeakMap();

/**
 * Compone un metatile (dos capas de 2×2 tiles, 16×16) y lo escala ×2 → 32×32 RGBA.
 * Devuelve un Uint8ClampedArray de lado*lado*4.
 */
export function renderMetatile(par, id, { escala = 2, paletaBase = 0 } = {}) {
  let cache = cacheMetatiles.get(par);
  if (!cache) { cache = new Map(); cacheMetatiles.set(par, cache); }
  if (cache.has(id)) return cache.get(id);

  const { tileset, indice } = metatileDe(par, id);
  const entrada = tileset.metatiles[indice] ?? [];
  const lado = 16 * escala;
  const out = new Uint8ClampedArray(lado * lado * 4);

  const pintarTile = (tileId, hflip, vflip, paleta, cx, cy) => {
    // En VRAM el tileset primario ocupa 0-511 y el secundario 512-1023, así que
    // los metatiles del secundario indexan con ese desplazamiento.
    const local = tileset.esSecundario ? tileId - SPLIT_SECUNDARIO : tileId;
    if (local < 0 || local >= tileset.tilesDisponibles) return;
    const pal = tileset.paletas[(paleta + paletaBase) % 16];
    const base = local * 32;
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        const byte = tileset.tiles[base + y * 4 + (x >> 1)];
        const idx = (x & 1) === 0 ? byte & 0x0f : byte >> 4;
        if (idx === 0) continue; // color 0 = transparente
        const [r, g, b] = pal[idx];
        const dx = x ^ (hflip ? 7 : 0);
        const dy = y ^ (vflip ? 7 : 0);
        for (let sy = 0; sy < escala; sy += 1) {
          for (let sx = 0; sx < escala; sx += 1) {
            const px = (cx * 8 + dx) * escala + sx;
            const py = (cy * 8 + dy) * escala + sy;
            const p = (py * lado + px) * 4;
            out[p] = r; out[p + 1] = g; out[p + 2] = b; out[p + 3] = 255;
          }
        }
      }
    }
  };

  for (let capa = 0; capa < 2; capa += 1) {
    for (let k = 0; k < 4; k += 1) {
      const v = entrada[capa * 4 + k] ?? 0;
      pintarTile(v & 0x3ff, (v >> 10) & 1, (v >> 11) & 1, (v >> 12) & 0xf, k & 1, k >> 1);
    }
  }
  cache.set(id, out);
  return out;
}

/** Colisión declarada por el ROM para ese metatile (0 = transitable). */
export function colisionDe(par, id) {
  const { tileset, indice } = metatileDe(par, id);
  return (tileset.attrs[indice] ?? 0) & 0x3f;
}

/** Carga el par primario/secundario de un layout. */
export function parTilesets(data, layout) {
  return { primario: leerTileset(data, layout.prim), secundario: leerTileset(data, layout.sec) };
}

/* ──────────────────────────────── sprites ──────────────────────────────── */

const cacheSprites = new WeakMap();

/** Tabla de sprites de overworld: id → { img, pal } (punteros GBA comprimidos). */
export function buscarTablaOverworld(data, { minEntradas = 100 } = {}) {
  let cache = cacheSprites.get(data);
  if (cache?.overworld) return cache.overworld;
  const len = data.length;
  for (let off = 0; off + 8 * minEntradas < len; off += 4) {
    let ok = 0;
    for (let i = 0; i < minEntradas; i += 1) {
      const base = off + i * 8;
      const img = u32(data, base);
      const pal = u32(data, base + 4);
      if (!esPtr(img, len) || !esPtr(pal, len)) break;
      if (data[offsetDe(img)] !== 0x10) break;
      ok += 1;
    }
    if (ok >= minEntradas) {
      const entradas = [];
      for (let i = 0; i < 512; i += 1) {
        const base = off + i * 8;
        const img = u32(data, base);
        const pal = u32(data, base + 4);
        if (!esPtr(img, len) || !esPtr(pal, len) || data[offsetDe(img)] !== 0x10) break;
        entradas.push({ id: i, img, pal, tam: u16(data, base + 6) });
      }
      const res = { off, entradas };
      cache = cache ?? {}; cache.overworld = res; cacheSprites.set(data, cache);
      return res;
    }
  }
  return { off: -1, entradas: [] };
}

/**
 * Píxeles de un sprite de overworld: 9 frames de 16×32 en la hoja estándar de Gen 3
 * (el ROM trae los frames uno tras otro, 4bpp con paleta de 16 colores).
 */
export function renderSprite(data, entrada, { frames = 9 } = {}) {
  const bytes = bytesEn(data, entrada.img);
  if (!bytes) return null;
  const pal = offsetDe(entrada.pal);
  const colores = [];
  for (let c = 0; c < 16; c += 1) colores.push(bgr555aRGB(u16(data, pal + c * 2)));
  const ancho = 16, alto = 32;
  const porFrame = (ancho * alto) / 2;
  const total = Math.min(frames, Math.floor(bytes.length / porFrame));
  const hojas = [];
  for (let f = 0; f < total; f += 1) {
    const px = new Uint8ClampedArray(ancho * alto * 4);
    const base = f * porFrame;
    for (let y = 0; y < alto; y += 1) {
      for (let x = 0; x < ancho; x += 1) {
        const byte = bytes[base + y * (ancho / 2) + (x >> 1)];
        const idx = (x & 1) === 0 ? byte & 0x0f : byte >> 4;
        const p = (y * ancho + x) * 4;
        if (!idx) continue;
        const [r, g, b] = colores[idx];
        px[p] = r; px[p + 1] = g; px[p + 2] = b; px[p + 3] = 255;
      }
    }
    hojas.push({ px, ancho, alto });
  }
  return { frames: hojas, colores };
}

/** Tabla de sprites de Pokémon (frontales o traseros): id → { img, pal }. */
export function buscarTablaPokemon(data, { minEntradas = 200 } = {}) {
  const len = data.length;
  const candidatos = [];
  for (let off = 0; off + 8 * minEntradas < len; off += 4) {
    let ok = 0;
    for (let i = 0; i < minEntradas; i += 1) {
      const img = u32(data, off + i * 8);
      if (!esPtr(img, len) || data[offsetDe(img)] !== 0x10) break;
      ok += 1;
    }
    if (ok >= minEntradas) candidatos.push(off);
  }
  return candidatos;
}

/** Tabla de paletas de Pokémon: id → puntero a 2 paletas (normal y shiny). */
export function buscarTablaPaletasPokemon(data, { minEntradas = 200 } = {}) {
  const len = data.length;
  const candidatos = [];
  for (let off = 0; off + 8 * minEntradas < len; off += 4) {
    let ok = 0;
    for (let i = 0; i < minEntradas; i += 1) {
      const pal = u32(data, off + i * 8);
      if (!esPtr(pal, len)) break;
      const v = u16(data, offsetDe(pal));
      if (v & 0x8000) break;
      ok += 1;
    }
    if (ok >= minEntradas) candidatos.push(off);
  }
  return candidatos;
}

/** Convierte una imagen de Pokémon (64×64 por hoja, 4bpp) a RGBA. */
export function renderPokemon(bytes, ancho, alto) {
  const px = new Uint8ClampedArray(ancho * alto * 4);
  for (let y = 0; y < alto; y += 1) {
    for (let x = 0; x < ancho; x += 1) {
      const byte = bytes[y * (ancho / 2) + (x >> 1)];
      const idx = (x & 1) === 0 ? byte & 0x0f : byte >> 4;
      const p = (y * ancho + x) * 4;
      px[p] = px[p + 1] = px[p + 2] = idx * 17;
      px[p + 3] = idx ? 255 : 0;
    }
  }
  return px;
}
