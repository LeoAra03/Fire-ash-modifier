/**
 * Codificador PNG mínimo (sin dependencias externas).
 *
 * El proyecto ya tiene utilidades PNG, pero el extractor forense necesita
 * escribir imágenes *indexadas* (paleta + transparencia) tal y como viven los
 * gráficos en las ROMs de GBA/GBC: 4 bpp con el índice 0 como transparente.
 */

import { deflateSync } from 'node:zlib';

const TABLA_CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) c = TABLA_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (~c) >>> 0;
}

function bloque(tipo, datos) {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length, 0);
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'latin1'), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(cuerpo), 0);
  return Buffer.concat([largo, cuerpo, crc]);
}

const FIRMA = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function ihdr(ancho, alto, profundidad, tipoColor) {
  const b = Buffer.alloc(13);
  b.writeUInt32BE(ancho, 0);
  b.writeUInt32BE(alto, 4);
  b[8] = profundidad;
  b[9] = tipoColor;
  b[10] = 0; // compresión
  b[11] = 0; // filtro
  b[12] = 0; // sin entrelazado
  return b;
}

/**
 * PNG indexado. `paleta` es una lista de [r, g, b, a] (a opcional, 0-255).
 * `indices` es un Uint8Array de `ancho * alto` con valores 0..paleta.length-1.
 */
export function pngIndizado(ancho, alto, indices, paleta) {
  const prof = paleta.length <= 16 ? 4 : 8;
  const porFila = Math.ceil((ancho * prof) / 8);
  const crudo = Buffer.alloc((porFila + 1) * alto);
  for (let y = 0; y < alto; y++) {
    const destino = y * (porFila + 1);
    crudo[destino] = 0; // filtro None
    for (let x = 0; x < ancho; x++) {
      const v = indices[y * ancho + x] & 0xff;
      if (prof === 4) {
        const byte = crudo[destino + 1 + (x >> 1)] || 0;
        crudo[destino + 1 + (x >> 1)] = (x & 1) ? (byte & 0xf0) | (v & 0x0f) : (byte & 0x0f) | ((v & 0x0f) << 4);
      } else {
        crudo[destino + 1 + x] = v;
      }
    }
  }
  const plte = Buffer.alloc(paleta.length * 3);
  const trns = [];
  paleta.forEach(([r, g, b, a], i) => {
    plte[i * 3] = r & 0xff;
    plte[i * 3 + 1] = g & 0xff;
    plte[i * 3 + 2] = b & 0xff;
    trns.push(a === undefined ? 255 : a & 0xff);
  });
  const partes = [FIRMA, bloque('IHDR', ihdr(ancho, alto, prof, 3)), bloque('PLTE', plte)];
  if (trns.some((a) => a < 255)) partes.push(bloque('tRNS', Buffer.from(trns)));
  partes.push(bloque('IDAT', deflateSync(crudo, { level: 9 })));
  partes.push(bloque('IEND', Buffer.alloc(0)));
  return Buffer.concat(partes);
}

/** PNG RGBA directo (útil para vistas previas ya resueltas). */
export function pngRGBA(ancho, alto, rgba) {
  const crudo = Buffer.alloc((ancho * 4 + 1) * alto);
  for (let y = 0; y < alto; y++) {
    crudo[y * (ancho * 4 + 1)] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * ancho * 4, ancho * 4).copy(crudo, y * (ancho * 4 + 1) + 1);
  }
  return Buffer.concat([
    FIRMA,
    bloque('IHDR', ihdr(ancho, alto, 8, 6)),
    bloque('IDAT', deflateSync(crudo, { level: 9 })),
    bloque('IEND', Buffer.alloc(0)),
  ]);
}
