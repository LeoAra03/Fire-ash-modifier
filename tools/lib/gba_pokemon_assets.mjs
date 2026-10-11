/**
 * gba_pokemon_assets.mjs — battlers e iconos REALES de un ROM de GBA.
 *
 * En Gen 3 los sprites y las paletas viven en tablas paralelas:
 *   · tabla de imágenes: { ptr, tamaño LZ77 }  (64×64 = 2048 B los battlers)
 *   · tabla de paletas:  ptr → 2 paletas de 16 colores (normal + brillante)
 *   · tabla de iconos:   32×32 por Pokémon (64 B/2 B por píxel)
 *
 * Como los hacks mueven y recortan tablas, aquí no se fijan direcciones: se
 * localizan por forma (todas las entradas decodifican y el tamaño declarado
 * coincide con el descomprimido) y se puntúan por «ruido» para quedarse con la
 * que produce siluetas limpias cuando hay varias candidatas.
 */
import { u16, u32, esPtr, offsetDe } from "./gba_map_assets.mjs";
import { lz77, bgr555aRGB } from "../forense/gba.mjs";

const TAMANOS_SPRITE = new Set([512, 1024, 2048, 4096, 8192, 320, 640, 1280, 2560, 4608]);

/** Tablas { ptr, tamaño } candidatas: todas las entradas decodifican. */
export function buscarTablasSprites(data, { umbral = 100 } = {}) {
  const len = data.length;
  const out = [];
  for (let off = 0; off + umbral * 8 < len; off += 4) {
    let ok = 0;
    for (let i = 0; i < umbral; i++) {
      const img = u32(data, off + i * 8), size = u16(data, off + i * 8 + 4);
      if (!esPtr(img, len) || data[offsetDe(img)] !== 0x10) break;
      if (!TAMANOS_SPRITE.has(size)) break;
      const r = lz77(data, offsetDe(img));
      if (!r || r.tam !== size) break;
      ok++;
    }
    if (ok >= umbral) {
      let n = ok;
      while (off + n * 8 + 8 < len) {
        const img = u32(data, off + n * 8), size = u16(data, off + n * 8 + 4);
        if (!esPtr(img, len) || data[offsetDe(img)] !== 0x10 || !TAMANOS_SPRITE.has(size)) break;
        const r = lz77(data, offsetDe(img));
        if (!r || r.tam !== size) break;
        n++;
      }
      out.push({ off, n });
      off += n * 8 - 4;
    }
  }
  return out;
}

/** Tablas de paletas: array de punteros a 32 bytes (2 paletas de 16 colores). */
export function buscarTablasPaletas(data, { umbral = 100 } = {}) {
  const len = data.length;
  const out = [];
  for (let off = 0; off + umbral * 4 < len; off += 4) {
    let ok = 0;
    for (let i = 0; i < umbral; i++) {
      const p = u32(data, off + i * 4);
      if (!esPtr(p, len)) break;
      const o = offsetDe(p);
      if (o + 32 > len) break;
      // índice 0 casi siempre negro o transparente; el resto debe tener variedad
      const distintos = new Set();
      for (let c = 0; c < 16; c++) distintos.add(u16(data, o + c * 2) & 0x7fff);
      if (distintos.size < 4) break;
      ok++;
    }
    if (ok >= umbral) {
      let n = ok;
      while (off + n * 4 + 4 < len) {
        const p = u32(data, off + n * 4);
        if (!esPtr(p, len)) break;
        const o = offsetDe(p);
        const distintos = new Set();
        for (let c = 0; c < 16; c++) distintos.add(u16(data, o + c * 2) & 0x7fff);
        if (distintos.size < 4) break;
        n++;
      }
      out.push({ off, n });
      off += n * 4 - 4;
    }
  }
  return out;
}

/** Renderiza un sprite 4bpp indexado a RGBA y mide su «ruido» (0 = limpio). */
export function renderSpriteIndizado(bytes, ancho, alto, colores) {
  const px = new Uint8ClampedArray(ancho * alto * 4);
  const tw = ancho >> 3;
  let opacos = 0, saltos = 0;
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const ti = Math.floor(y / 8) * tw + Math.floor(x / 8), ox = x & 7, oy = y & 7;
      const b = bytes[ti * 32 + oy * 4 + (ox >> 1)] ?? 0;
      const idx = (ox & 1) === 0 ? b & 0xf : b >> 4;
      const p = (y * ancho + x) * 4;
      if (idx) {
        const [r, g, bl] = colores[idx];
        px[p] = r; px[p + 1] = g; px[p + 2] = bl; px[p + 3] = 255;
        opacos++;
        if (x > 0) {
          const prev = (y * ancho + x - 1) * 4;
          const prevIdx = px[prev + 3] ? 1 : 0;
          if (prevIdx && (px[prev] !== r || px[prev + 1] !== g || px[prev + 2] !== bl)) saltos++;
        }
      }
    }
  }
  return { px, opacos, saltos, ruido: opacos ? saltos / opacos : 1 };
}

/** Puntúa una tabla de sprites: media de ruido de las primeras `muestra` entradas. */
export function puntuarTabla(data, tabla, colorGris, { muestra = 24, desde = 1 } = {}) {
  let suma = 0, vistos = 0, cobertura = 0;
  for (let i = desde; i < desde + muestra; i++) {
    const img = u32(data, tabla.off + i * 8);
    const size = u16(data, tabla.off + i * 8 + 4);
    if (!esPtr(img, data.length)) continue;
    const r = lz77(data, offsetDe(img));
    if (!r) continue;
    const lado = Math.round(Math.sqrt(size * 2)); // 4bpp: 2 píxeles por byte
    const ancho = lado, alto = lado;
    const sprite = renderSpriteIndizado(r.datos, ancho, alto, colorGris);
    suma += sprite.ruido;
    cobertura += sprite.opacos / (ancho * alto);
    vistos++;
  }
  return { ruido: vistos ? suma / vistos : 1, cobertura: vistos ? cobertura / vistos : 0, vistos };
}

/** Paleta normal (índice 0) o brillante (índice 1) de una especie. */
export function paletaDe(data, tablaPaletas, especie, { brillante = false } = {}) {
  const p = u32(data, tablaPaletas + especie * 4);
  if (!esPtr(p, data.length)) return null;
  const base = offsetDe(p) + (brillante ? 16 : 0);
  const colores = [];
  for (let c = 0; c < 16; c++) colores.push(bgr555aRGB(u16(data, base + c * 2)));
  return colores;
}

/** Vista previa en color de un battler concreto. */
export function battlerDe(data, tablaSprites, tablaPaletas, especie, { brillante = false } = {}) {
  const img = u32(data, tablaSprites + especie * 8);
  const size = u16(data, tablaSprites + especie * 8 + 4);
  if (!esPtr(img, data.length)) return null;
  const r = lz77(data, offsetDe(img));
  if (!r) return null;
  const colores = paletaDe(data, tablaPaletas, especie, { brillante });
  if (!colores) return null;
  const lado = Math.round(Math.sqrt(size * 2));
  const ancho = lado;
  const sprite = renderSpriteIndizado(r.datos, ancho, ancho, colores);
  return { ...sprite, ancho, alto: ancho, size };
}

/** Convierte a PNG RGBA (sin dependencias). */
export function pngRGBA(ancho, alto, rgba, zlib) {
  const filas = Buffer.alloc((ancho * 4 + 1) * alto);
  const fuente = Buffer.from(rgba.buffer, rgba.byteOffset, rgba.length);
  for (let y = 0; y < alto; y++) {
    filas[y * (ancho * 4 + 1)] = 0;
    fuente.copy(filas, y * (ancho * 4 + 1) + 1, y * ancho * 4, (y + 1) * ancho * 4);
  }
  const chunk = (tipo, datos) => {
    const largo = Buffer.alloc(4); largo.writeUInt32BE(datos.length);
    const cuerpo = Buffer.concat([Buffer.from(tipo, "latin1"), datos]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(cuerpo) >>> 0);
    return Buffer.concat([largo, cuerpo, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(ancho, 0); ihdr.writeUInt32BE(alto, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(filas, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

let TABLA_CRC = null;
function crc32(buf) {
  if (!TABLA_CRC) {
    TABLA_CRC = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      TABLA_CRC[n] = c;
    }
  }
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = TABLA_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
