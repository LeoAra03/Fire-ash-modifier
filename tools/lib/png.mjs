/**
 * png.mjs — Escritor PNG mínimo y generador de capas de profundidad.
 *
 * El juego necesita capas que se muevan a distinta velocidad para que un
 * escenario tenga aire: la niebla cercana corre, el horizonte lejano casi no
 * se mueve. RPG Maker XP sólo dibuja una capa de niebla por mapa
 * (`@fog_*`), así que el horizonte se resuelve con el panorama
 * (`@parallax_*`) y la cercanía con la niebla; dos planos, dos velocidades.
 *
 * Todas las capas se generan por código y son **sin costura**: cualquier
 * pincelada que toca un borde se vuelve a dibujar envuelta al lado opuesto,
 * de modo que al teselarse no aparece lajunta.
 *
 * No depende de ninguna librería externa: `zlib` viene con Node.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

/* ───────────────────────────────── PNG ─────────────────────────────────── */

const TABLA_CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = TABLA_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

/** Escribe un PNG RGBA de 8 bits. */
export function escribirPNG(ruta, w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  let p = 0;
  for (let y = 0; y < h; y++) {
    raw[p++] = 0;
    for (let x = 0; x < w * 4; x++) raw[p++] = rgba[y * w * 4 + x] & 0xff;
  }
  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  fs.writeFileSync(ruta, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]));
  return ruta;
}

/* ─────────────────────────── ruido determinista ────────────────────────── */

/** Generador congruente: misma semilla, mismo dibujo, siempre. */
export function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

/** Suma de senos periódica: por construcción f(0) === f(ancho). */
function ruido1d(x, periodo, armónicos) {
  let v = 0, amp = 1, norma = 0;
  for (let k = 1; k <= armónicos; k++) {
    v += amp * Math.sin((2 * Math.PI * k * x) / periodo);
    norma += amp;
    amp *= 0.55;
  }
  return v / norma;
}

/* ─────────────────────────── las capas ─────────────────────────────────── */

/** Lienzo RGBA vacío. */
const lienzo = (w, h) => ({ w, h, rgba: new Uint8ClampedArray(w * h * 4) });

/** Pinta un disco suave envolviéndolo por los cuatro bordes (sin costura). */
function disco(img, cx, cy, radio, r, g, b, a) {
  const { w, h, rgba } = img;
  const r2 = radio * radio;
  for (let dy = -radio; dy <= radio; dy++) {
    for (let dx = -radio; dx <= radio; dx++) {
      const d2 = dx * dx + dy * dy;
      if (d2 > r2) continue;
      const caida = 1 - Math.sqrt(d2) / radio;
      const alfa = a * caida * caida;
      // envolver: la pincelada se repite al otro lado para que el teselado
      // no muestre un corte recto
      for (const ox of [0, -w, w]) {
        for (const oy of [0, -h, h]) {
          const x = Math.round(cx + dx + ox), y = Math.round(cy + dy + oy);
          if (x < 0 || y < 0 || x >= w || y >= h) continue;
          const i = (y * w + x) * 4;
          const na = alfa + (rgba[i + 3] / 255) * (1 - alfa);
          if (na <= 0) continue;
          rgba[i] = (r * alfa + rgba[i] * (1 - alfa));
          rgba[i + 1] = (g * alfa + rgba[i + 1] * (1 - alfa));
          rgba[i + 2] = (b * alfa + rgba[i + 2] * (1 - alfa));
          rgba[i + 3] = na * 255;
        }
      }
    }
  }
}

/**
 * Nevada que cae: copos pequeños, blancos, semitransparentes.
 * Capa cercana: se mueve rápido y en diagonal.
 */
export function capaNieve(w = 640, h = 480, { semilla = 7, copos = 260, alfa = 0.55, radio = 2 } = {}) {
  const img = lienzo(w, h);
  const azar = rng(semilla);
  for (let i = 0; i < copos; i++) {
    const x = azar() * w, y = azar() * h;
    const t = azar();
    disco(img, x, y, radio + t * 2.2, 255, 255, 255, alfa * (0.45 + t * 0.55));
  }
  return img;
}

/**
 * Bruma baja: manchas grandes y blanquecinas.
 * Capa media: se desplaza despacio.
 */
export function capaBruma(w = 640, h = 480, { semilla = 11, manchas = 46, alfa = 0.20, radio = 58 } = {}) {
  const img = lienzo(w, h);
  const azar = rng(semilla);
  for (let i = 0; i < manchas; i++) {
    disco(img, azar() * w, azar() * h, radio * (0.5 + azar()), 232, 238, 246, alfa * (0.5 + azar() * 0.5));
  }
  return img;
}

/**
 * Polvo en suspensión: motas cálidas para interiores industriales.
 */
export function capaPolvo(w = 640, h = 480, { semilla = 23, motas = 190, alfa = 0.30 } = {}) {
  const img = lienzo(w, h);
  const azar = rng(semilla);
  for (let i = 0; i < motas; i++) {
    disco(img, azar() * w, azar() * h, 1 + azar() * 2, 214, 198, 170, alfa * (0.4 + azar() * 0.6));
  }
  return img;
}

/**
 * Alarma roja: viñeta roja con franjas horizontales. No parpadea por sí sola
 * (un PNG es estático): el latido lo hacen los eventos del mapa moviendo la
 * opacidad de la niebla con el comando 206.
 */
export function capaAlarma(w = 640, h = 480, { intensidad = 0.30 } = {}) {
  const img = lienzo(w, h);
  const { rgba } = img;
  const cx = w / 2, cy = h / 2;
  const maxD = Math.hypot(cx, cy);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const d = Math.hypot(x - cx, y - cy) / maxD;
      const viñeta = Math.pow(d, 2.1) * intensidad;
      const franja = (y % 40 < 3 ? 0.05 : 0) * intensidad;
      const a = Math.min(0.85, viñeta + franja);
      const i = (y * w + x) * 4;
      rgba[i] = 255; rgba[i + 1] = 40; rgba[i + 2] = 32; rgba[i + 3] = a * 255;
    }
  }
  return img;
}

/**
 * Horizonte lejano: siluetas de montañas en capas.
 * Es periódico en horizontal (suma de senos), así que al desplazarse
 * lateralmente el dibujo nunca se corta.
 */
export function capaHorizonte(w = 640, h = 240, { semilla = 3, cordilleras = 3, tono = [96, 118, 148] } = {}) {
  const img = lienzo(w, h);
  const { rgba } = img;
  const azar = rng(semilla);
  for (let c = 0; c < cordilleras; c++) {
    const fase = azar() * 1000;
    const periodo = w / (2 + c * 2);
    const base = h * (0.42 + c * 0.17);
    const altura = h * (0.30 - c * 0.07);
    const oscuro = 1 - c * 0.16;
    for (let x = 0; x < w; x++) {
      const cresta = base - altura * (0.5 + 0.5 * ruido1d(x + fase, periodo, 4));
      for (let y = Math.round(cresta); y < h; y++) {
        if (y < 0) continue;
        const i = (y * w + x) * 4;
        rgba[i] = tono[0] * oscuro;
        rgba[i + 1] = tono[1] * oscuro;
        rgba[i + 2] = tono[2] * oscuro;
        rgba[i + 3] = 255;
      }
    }
  }
  return img;
}

/** Fábrica de capas por nombre, usada por el instalador. */
export const CAPAS = {
  nieve: capaNieve,
  bruma: capaBruma,
  polvo: capaPolvo,
  alarma: capaAlarma,
  horizonte: capaHorizonte,
};
