/**
 * Codificador PNG mínimo (sin dependencias externas).
 *
 * El proyecto ya tiene utilidades PNG, pero el extractor forense necesita
 * escribir imágenes *indexadas* (paleta + transparencia) tal y como viven los
 * gráficos en las ROMs de GBA/GBC: 4 bpp con el índice 0 como transparente.
 */

import { deflateSync, inflateSync } from 'node:zlib';

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

/* ─────────────────────────────── lectura ───────────────────────────────── */

/** Canales de color por tipo PNG (0 gris, 2 RGB, 3 indexado, 4 gris+alfa, 6 RGBA). */
const CANALES = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

function desfiltrar(crudo, ancho, alto, porFila, bpp) {
  const salida = new Uint8Array(porFila * alto);
  let previa = new Uint8Array(porFila);
  for (let y = 0; y < alto; y++) {
    const off = y * (porFila + 1);
    const filtro = crudo[off];
    const fila = Uint8Array.from(crudo.subarray(off + 1, off + 1 + porFila));
    for (let i = 0; i < porFila; i++) {
      const a = i >= bpp ? fila[i - bpp] : 0;
      const b = previa[i];
      const c = i >= bpp ? previa[i - bpp] : 0;
      if (filtro === 1) fila[i] = (fila[i] + a) & 0xff;
      else if (filtro === 2) fila[i] = (fila[i] + b) & 0xff;
      else if (filtro === 3) fila[i] = (fila[i] + ((a + b) >> 1)) & 0xff;
      else if (filtro === 4) {
        const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
        fila[i] = (fila[i] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff;
      }
    }
    salida.set(fila, y * porFila);
    previa = fila;
  }
  return salida;
}

/**
 * Lector PNG sin dependencias (zlib de Node). Devuelve siempre `indices` (para
 * imágenes indexadas) o `rgba` (para RGBA/grís), más la paleta resuelta con su
 * alfa. Se usa para auditar los PNG que ya están escritos (p. ej. las hojas de
 * personaje RMXP) sin cargar un canvas en Node.
 */
export function leerPng(bytes) {
  if (bytes.length < 8 || bytes.readUInt32BE(0) !== 0x89504e47) throw new Error("no es un PNG");
  let ancho = 0, alto = 0, profundidad = 0, tipoColor = 0, entrelazado = 0;
  const idat = [];
  const plte = [];
  let trns = null;
  let p = 8;
  while (p + 8 <= bytes.length) {
    const largo = bytes.readUInt32BE(p);
    const tipo = bytes.toString("latin1", p + 4, p + 8);
    const datos = bytes.subarray(p + 8, p + 8 + largo);
    if (tipo === "IHDR") {
      ancho = datos.readUInt32BE(0); alto = datos.readUInt32BE(4);
      profundidad = datos[8]; tipoColor = datos[9]; entrelazado = datos[12];
    } else if (tipo === "PLTE") { for (const v of datos) plte.push(v); }
    else if (tipo === "tRNS") trns = Buffer.from(datos);
    else if (tipo === "IDAT") idat.push(datos);
    else if (tipo === "IEND") break;
    p += 12 + largo;
  }
  if (!ancho || !alto) throw new Error("PNG sin IHDR válido");
  if (entrelazado !== 0) throw new Error("PNG entrelazado: no soportado");
  const canales = CANALES[tipoColor];
  if (!canales) throw new Error(`tipo de color PNG ${tipoColor} no soportado`);
  if (![1, 2, 4, 8, 16].includes(profundidad)) throw new Error(`profundidad PNG ${profundidad} no soportada`);
  if (profundidad === 16) throw new Error("PNG de 16 bits por canal: no soportado");
  const porPx = (canales * profundidad) / 8;
  const porFila = Math.ceil((ancho * canales * profundidad) / 8);
  const plano = desfiltrar(inflateSync(Buffer.concat(idat)), ancho, alto, porFila, porPx);
  const leer = (x, y) => {
    const off = y * porFila;
    if (profundidad === 8) return Array.from(plano.subarray(off + x * canales, off + (x + 1) * canales));
    if (profundidad === 4) { const v = plano[off + (x >> 1)]; return [(x & 1) ? v & 0x0f : v >> 4]; }
    if (profundidad === 2) { const v = plano[off + (x >> 2)]; return [(v >> (6 - 2 * (x & 3))) & 3]; }
    return [(plano[off + (x >> 3)] >> (7 - (x & 7))) & 1];
  };
  const paleta = [];
  for (let i = 0; i < plte.length / 3; i += 1) {
    paleta.push([plte[i * 3], plte[i * 3 + 1], plte[i * 3 + 2], trns && i < trns.length ? trns[i] : 255]);
  }
  const resultado = { ancho, alto, profundidad, tipoColor, paleta, entrelazado };
  if (tipoColor === 3) {
    const indices = new Uint8Array(ancho * alto);
    for (let y = 0; y < alto; y++) for (let x = 0; x < ancho; x++) indices[y * ancho + x] = leer(x, y)[0];
    resultado.indices = indices;
    resultado.rgba = new Uint8Array(ancho * alto * 4);
    for (let i = 0; i < ancho * alto; i += 1) {
      const c = paleta[indices[i]] ?? [0, 0, 0, 0];
      resultado.rgba[i * 4] = c[0]; resultado.rgba[i * 4 + 1] = c[1]; resultado.rgba[i * 4 + 2] = c[2]; resultado.rgba[i * 4 + 3] = c[3];
    }
  } else {
    const rgba = new Uint8Array(ancho * alto * 4);
    for (let y = 0; y < alto; y++) {
      for (let x = 0; x < ancho; x++) {
        const v = leer(x, y);
        const d = (y * ancho + x) * 4;
        if (tipoColor === 6) { rgba[d] = v[0]; rgba[d + 1] = v[1]; rgba[d + 2] = v[2]; rgba[d + 3] = profundidad === 8 ? v[3] : 255; }
        else if (tipoColor === 2) { rgba[d] = v[0]; rgba[d + 1] = v[1]; rgba[d + 2] = v[2]; rgba[d + 3] = 255; }
        else { rgba[d] = v[0]; rgba[d + 1] = v[0]; rgba[d + 2] = v[0]; rgba[d + 3] = tipoColor === 4 ? (profundidad === 8 ? v[1] : 255) : 255; }
      }
    }
    resultado.rgba = rgba;
  }
  return resultado;
}
