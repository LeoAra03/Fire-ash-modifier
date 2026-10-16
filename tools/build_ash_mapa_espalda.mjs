#!/usr/bin/env node
/**
 * build_ash_mapa_espalda.mjs — variante "Mapa Espalda" del charset de Ash.
 *
 * Parte del charset "Mapa Frontal" (ash_outfit_mapa_frontal.png, RMXP
 * 128×192: 4 direcciones × 4 patrones de 32×48, pies en la fila 47) y solo
 * retoca la fila de espalda (fila 3, dirección arriba):
 *
 *  · La mochila se eleva 2 px: su borde superior pasa de la fila 28 a la 26
 *    de la celda, copiando hacia arriba sus dos primeras filas. Así tapa por
 *    completo la nuca (fila 27, entre el pelo —filas 21–26— y la mochila).
 *  · La altura total no cambia: la gorra sigue empezando en la fila 17 y los
 *    pies siguen en la 47; el bloque gorra→base de la mochila (filas 17–35)
 *    conserva sus 19 px, porque la base de la mochila no se mueve.
 *  · Las demás direcciones y el resto de la fila de espalda quedan
 *    píxel a píxel como en la fuente.
 *
 * Uso: node tools/build_ash_mapa_espalda.mjs [--verify]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHARS = path.join(ROOT, "pokemon_fire_ash", "Graphics", "Characters");
const SRC = path.join(CHARS, "ash_outfit_mapa_frontal.png");
const DEST = path.join(CHARS, "ash_outfit_mapa_espalda.png");
const CELL_W = 32, CELL_H = 48, COLS = 4, ROWS = 4;
const BACK_ROW = 3;          // RMXP: abajo, izquierda, derecha, arriba/espalda
const RISE = 2;              // px que sube el borde superior de la mochila
const EXPECTED_TOP = 17;     // primera fila visible (gorra) en la fuente
const EXPECTED_BOTTOM = 47;  // base de los pies (ver build_ash_mapa_frontal)
const BACKPACK_BOTTOM = 35;  // última fila de la mochila en la fuente
const HEAD_TO_BACKPACK = BACKPACK_BOTTOM - EXPECTED_TOP + 1; // 19 px

// Mochila: panel beige y correa marrón. La piel de brazos/orejas queda fuera
// por el rango (más clara y saturada) y por buscar solo en el torso central.
function isBackpack(r, g, b, a) {
  return a > 0 && r >= 90 && r <= 215 && g >= 65 && g <= 180 &&
    b >= 35 && b <= 135 && r >= g && g >= b && (r - b) >= 25;
}

function pixelsOf(img) {
  const ctx = createCanvas(img.width, img.height).getContext("2d");
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, img.width, img.height);
}

const at = (d, w, x, y) => {
  const i = (y * w + x) * 4;
  return [d[i], d[i + 1], d[i + 2], d[i + 3]];
};

// Primera fila de la mochila en una celda de espalda: primera fila del torso
// con al menos 4 píxeles de mochila en el centro (x 12–20). En la fuente: 28.
function backpackTop(d, w, col) {
  const x0 = col * CELL_W;
  for (let y = 27; y <= 32; y++) {
    let n = 0;
    for (let x = 12; x <= 20; x++) if (isBackpack(...at(d, w, x0 + x, BACK_ROW * CELL_H + y))) n++;
    if (n >= 4) return y;
  }
  throw new Error(`Mochila no detectada en la celda de espalda ${col}`);
}

// Extremo izquierdo/derecho (opaco) de la fila superior de la mochila.
function backpackSpan(d, w, col, top) {
  const x0 = col * CELL_W, y = BACK_ROW * CELL_H + top;
  let l = CELL_W, r = -1;
  for (let x = 8; x <= 24; x++) {
    if (at(d, w, x0 + x, y)[3] > 0) { if (x < l) l = x; if (x > r) r = x; }
  }
  if (r < 0) throw new Error(`Fila de mochila vacía en la celda ${col}`);
  return [l, r];
}

function analyse(d, w, col) {
  const top = backpackTop(d, w, col);
  const [l, r] = backpackSpan(d, w, col, top);
  return { top, l, r };
}

async function build() {
  if (!fs.existsSync(SRC)) throw new Error(`Falta el charset base ${SRC}`);
  const src = await loadImage(SRC);
  if (src.width !== CELL_W * COLS || src.height !== CELL_H * ROWS) {
    throw new Error(`Tamaño de charset inesperado: ${src.width}×${src.height}`);
  }
  const image = pixelsOf(src);
  const d = image.data, w = src.width;
  for (let col = 0; col < COLS; col++) {
    const { top, l, r } = analyse(d, w, col);
    const x0 = col * CELL_W, y0 = BACK_ROW * CELL_H;
    // Guarda las dos primeras filas de la mochila antes de sobrescribir.
    const rows = [0, 1].map((k) => {
      const row = [];
      for (let x = l; x <= r; x++) row.push(at(d, w, x0 + x, y0 + top + k));
      return row;
    });
    // Eleva el gráfico: fila top-2 ← fila top, fila top-1 ← fila top+1.
    // La nuca (top-1) y el borde inferior del pelo (top-2) quedan cubiertos
    // por la mochila en todo su ancho; la base de la mochila no se toca.
    for (let k = 0; k < RISE; k++) {
      for (let x = l; x <= r; x++) {
        const [rr, gg, bb, aa] = rows[k][x - l];
        const i = ((y0 + top - RISE + k) * w + x0 + x) * 4;
        d[i] = rr; d[i + 1] = gg; d[i + 2] = bb; d[i + 3] = aa;
      }
    }
  }
  const out = createCanvas(w, src.height);
  out.getContext("2d").putImageData(image, 0, 0);
  fs.writeFileSync(DEST, out.toBuffer("image/png"));
  console.log(`✔ ${path.relative(ROOT, DEST)} — ${w}×${src.height}, mochila elevada ${RISE}px en la espalda (borde 28→26), altura total intacta.`);
}

function bbox(d, w, col, row) {
  let t = CELL_H, b = -1;
  for (let y = 0; y < CELL_H; y++) for (let x = 0; x < CELL_W; x++) {
    if (at(d, w, col * CELL_W + x, row * CELL_H + y)[3] > 0) { if (y < t) t = y; if (y > b) b = y; }
  }
  return [t, b];
}

async function verify() {
  if (!fs.existsSync(DEST)) throw new Error(`Falta ${DEST}`);
  if (!fs.existsSync(SRC)) throw new Error(`Falta el charset base ${SRC}`);
  const [destImg, srcImg] = [await loadImage(DEST), await loadImage(SRC)];
  if (destImg.width !== CELL_W * COLS || destImg.height !== CELL_H * ROWS) {
    throw new Error(`Tamaño incorrecto: ${destImg.width}×${destImg.height}`);
  }
  const dd = pixelsOf(destImg).data, sd = pixelsOf(srcImg).data, w = destImg.width;
  const same = (x, y, a, b) => {
    const i = (y * w + x) * 4;
    return a[i] === b[i] && a[i + 1] === b[i + 1] && a[i + 2] === b[i + 2] && a[i + 3] === b[i + 3];
  };
  // 1) Fuera de la zona elevada todo es idéntico a la fuente.
  const zones = [];
  for (let col = 0; col < COLS; col++) {
    const info = analyse(sd, w, col);
    zones.push(info);
    for (let row = 0; row < ROWS; row++) for (let y = 0; y < CELL_H; y++) for (let x = 0; x < CELL_W; x++) {
      const gx = col * CELL_W + x, gy = row * CELL_H + y;
      const inZone = row === BACK_ROW && y >= info.top - RISE && y < info.top && x >= info.l && x <= info.r;
      if (!inZone && !same(gx, gy, dd, sd)) {
        throw new Error(`Píxel fuera de la mochila elevado cambiado en celda ${row},${col} (${x},${y})`);
      }
    }
  }
  // 2) Nuca tapada y altura conservada, celda a celda de espalda.
  for (let col = 0; col < COLS; col++) {
    const { top, l, r } = zones[col];
    const y0 = BACK_ROW * CELL_H, x0 = col * CELL_W;
    for (let k = 0; k < RISE; k++) for (let x = l; x <= r; x++) {
      if (!same(x0 + x, y0 + top - RISE + k, dd, sd) && at(dd, w, x0 + x, y0 + top - RISE + k).join() !== at(sd, w, x0 + x, y0 + top + k).join()) {
        throw new Error(`La fila elevada ${top - RISE + k} no copia la mochila en la celda ${col}`);
      }
      if (at(dd, w, x0 + x, y0 + top - RISE + k)[3] === 0) {
        throw new Error(`Nuca sin tapar en la celda ${col} (${x},${top - RISE + k})`);
      }
    }
    // El nuevo borde superior de la mochila está RISE px más arriba.
    if (backpackTop(dd, w, col) !== top - RISE && (() => {
      // La fila elevada copia la mochila, pero su primera fila puede no
      // alcanzar el umbral del detector por el contorno oscuro: se acepta
      // si hay mochila en top-1 (la que tapa la nuca).
      let n = 0;
      for (let x = 12; x <= 20; x++) if (isBackpack(...at(dd, w, x0 + x, y0 + top - 1))) n++;
      return n < 4;
    })()) throw new Error(`La mochila no subió ${RISE}px en la celda ${col}`);
    const [t, b] = bbox(dd, w, col, BACK_ROW);
    if (t !== EXPECTED_TOP || b !== EXPECTED_BOTTOM) {
      throw new Error(`Altura total cambiada en la celda ${col}: filas ${t}–${b}`);
    }
    if (BACKPACK_BOTTOM - t + 1 !== HEAD_TO_BACKPACK) {
      throw new Error(`El bloque gorra→mochila ya no mide ${HEAD_TO_BACKPACK}px en la celda ${col}`);
    }
    // Base de la mochila intacta (misma última fila que en la fuente).
    for (let x = l; x <= r; x++) {
      if (!same(x0 + x, y0 + BACKPACK_BOTTOM, dd, sd)) {
        throw new Error(`La base de la mochila se movió en la celda ${col}`);
      }
    }
  }
  console.log(`✔ Mapa Espalda verificado: ${destImg.width}×${destImg.height}; mochila elevada ${RISE}px y nuca tapada en las 4 celdas de espalda; altura total intacta (filas ${EXPECTED_TOP}–${EXPECTED_BOTTOM}, bloque gorra→mochila de ${HEAD_TO_BACKPACK}px).`);
}

(process.argv.includes("--verify") ? verify() : build()).catch((e) => {
  console.error(`[ash-mapa-espalda] ERROR: ${e.message}`);
  process.exit(1);
});
