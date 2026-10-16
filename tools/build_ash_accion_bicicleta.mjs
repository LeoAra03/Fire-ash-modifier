#!/usr/bin/env node
/**
 * build_ash_accion_bicicleta.mjs — variante "Acción Bicicleta" del charset
 * de Ash.
 *
 * Parte del charset "Mapa Espalda" (ash_outfit_mapa_espalda.png, RMXP
 * 128×192: 4 direcciones × 4 patrones de 32×48, pies sobre la línea del
 * suelo en la fila 47), que ya trae la alineación de Mapa Frontal y la
 * mochila elevada de Mapa Espalda.
 *
 * La acción de bicicleta necesita el vehículo debajo del personaje, así que
 * la figura completa se eleva 3 px dentro de cada celda:
 *
 *  · La pelvis (primera fila del pantalón corto) queda 3 px más arriba
 *    respecto a la línea del suelo (fila 47), que no se mueve.
 *  · Los pies pasan de la fila 47 a la 44 y las filas 45–47 quedan libres
 *    en las 16 celdas: ese es el hueco donde encaja el vehículo.
 *  · No se redibuja ningún píxel: cada celda de destino es la de origen
 *    desplazada exactamente -3 en Y.
 *
 * Uso: node tools/build_ash_accion_bicicleta.mjs [--verify]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHARS = path.join(ROOT, "pokemon_fire_ash", "Graphics", "Characters");
const SRC = path.join(CHARS, "ash_outfit_mapa_espalda.png");
const DEST = path.join(CHARS, "ash_outfit_accion_bicicleta.png");
const CELL_W = 32, CELL_H = 48, COLS = 4, ROWS = 4;
const GROUND_ROW = CELL_H - 1; // fila 47 = línea del suelo
const LIFT = 3;                // px que sube la pelvis (y toda la figura)

function pixelsOf(img) {
  const ctx = createCanvas(img.width, img.height).getContext("2d");
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, img.width, img.height);
}

const at = (d, w, x, y) => {
  const i = (y * w + x) * 4;
  return [d[i], d[i + 1], d[i + 2], d[i + 3]];
};

// Pelvis: primera fila del pantalón corto (azul oscuro) de la celda.
const isShorts = ([r, g, b, a]) => a > 0 && b >= 80 && b > r + 25 && r <= 70 && g >= 40 && g <= 95;
function pelvisRow(d, w, col, row) {
  for (let y = 0; y < CELL_H; y++) {
    let n = 0;
    for (let x = 0; x < CELL_W; x++) if (isShorts(at(d, w, col * CELL_W + x, row * CELL_H + y))) n++;
    if (n >= 3) return y;
  }
  return -1;
}

function bbox(d, w, col, row) {
  let t = CELL_H, b = -1;
  for (let y = 0; y < CELL_H; y++) for (let x = 0; x < CELL_W; x++) {
    if (at(d, w, col * CELL_W + x, row * CELL_H + y)[3] > 0) { if (y < t) t = y; if (y > b) b = y; }
  }
  return [t, b];
}

async function build() {
  if (!fs.existsSync(SRC)) throw new Error(`Falta el charset base ${SRC}`);
  const src = await loadImage(SRC);
  if (src.width !== CELL_W * COLS || src.height !== CELL_H * ROWS) {
    throw new Error(`Tamaño de charset inesperado: ${src.width}×${src.height}`);
  }
  const image = pixelsOf(src);
  const d = image.data, w = src.width;
  // Desplaza cada celda -LIFT en Y sobre una copia vacía: la línea del
  // suelo (fila 47) queda como referencia y libre para el vehículo.
  const out = new Uint8ClampedArray(d.length);
  for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLS; col++) {
    for (let y = LIFT; y < CELL_H; y++) for (let x = 0; x < CELL_W; x++) {
      const si = ((row * CELL_H + y) * w + col * CELL_W + x) * 4;
      const di = ((row * CELL_H + y - LIFT) * w + col * CELL_W + x) * 4;
      out[di] = d[si]; out[di + 1] = d[si + 1]; out[di + 2] = d[si + 2]; out[di + 3] = d[si + 3];
    }
  }
  image.data.set(out);
  const canvas = createCanvas(w, src.height);
  canvas.getContext("2d").putImageData(image, 0, 0);
  fs.writeFileSync(DEST, canvas.toBuffer("image/png"));
  console.log(`✔ ${path.relative(ROOT, DEST)} — ${w}×${src.height}, pelvis elevada ${LIFT}px sobre la línea del suelo (fila ${GROUND_ROW}); filas ${GROUND_ROW - LIFT + 1}–${GROUND_ROW} libres para el vehículo.`);
}

async function verify() {
  if (!fs.existsSync(DEST)) throw new Error(`Falta ${DEST}`);
  if (!fs.existsSync(SRC)) throw new Error(`Falta el charset base ${SRC}`);
  const [destImg, srcImg] = [await loadImage(DEST), await loadImage(SRC)];
  if (destImg.width !== CELL_W * COLS || destImg.height !== CELL_H * ROWS) {
    throw new Error(`Tamaño incorrecto: ${destImg.width}×${destImg.height}`);
  }
  const dd = pixelsOf(destImg).data, sd = pixelsOf(srcImg).data, w = destImg.width;
  const samePx = (d1, d2, x, y) => {
    const i = (y * w + x) * 4;
    return d1[i] === d2[i] && d1[i + 1] === d2[i + 1] && d1[i + 2] === d2[i + 2] && d1[i + 3] === d2[i + 3];
  };
  let pelvisComprobadas = 0;
  for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLS; col++) {
    // 1) Cada píxel de destino es el de origen 3 px más abajo (o vacío
    //    bajo los pies): no se ha redibujado ni deformado nada.
    for (let y = 0; y < CELL_H; y++) for (let x = 0; x < CELL_W; x++) {
      const gx = col * CELL_W + x, gy = row * CELL_H + y;
      if (y >= CELL_H - LIFT) {
        if (at(dd, w, gx, gy)[3] !== 0) throw new Error(`La fila libre ${y} no está vacía en la celda ${row},${col}`);
      } else if (!samePx(dd, sd, gx, gy) && at(dd, w, gx, gy).join() !== at(sd, w, gx, gy + LIFT).join()) {
        throw new Error(`Píxel no desplazado tal cual en la celda ${row},${col} (${x},${y})`);
      }
    }
    // El desplazamiento exacto se comprueba píxel a píxel contra la fuente:
    for (let y = 0; y < CELL_H - LIFT; y++) for (let x = 0; x < CELL_W; x++) {
      const gx = col * CELL_W + x;
      if (at(dd, w, gx, row * CELL_H + y).join() !== at(sd, w, gx, row * CELL_H + y + LIFT).join()) {
        throw new Error(`Desplazamiento distinto de -${LIFT}px en la celda ${row},${col} (${x},${y})`);
      }
    }
    // 2) Altura sobre el suelo: pies a GROUND_ROW-LIFT, suelo intacto.
    const [st, sb] = bbox(sd, w, col, row);
    const [dt, db] = bbox(dd, w, col, row);
    if (sb !== GROUND_ROW || db !== GROUND_ROW - LIFT || dt !== st - LIFT) {
      throw new Error(`Celda ${row},${col}: bbox fuente ${st}–${sb}, destino ${dt}–${db}`);
    }
    // 3) La pelvis sube exactamente LIFT px respecto a la línea del suelo.
    const sp = pelvisRow(sd, w, col, row), dp = pelvisRow(dd, w, col, row);
    if (sp >= 0 || dp >= 0) {
      if (sp < 0 || dp !== sp - LIFT) throw new Error(`Pelvis no elevada ${LIFT}px en la celda ${row},${col}: ${sp}→${dp}`);
      if ((GROUND_ROW - dp) !== (GROUND_ROW - sp) + LIFT) throw new Error(`Distancia pelvis→suelo incorrecta en la celda ${row},${col}`);
      pelvisComprobadas++;
    }
  }
  if (pelvisComprobadas < 12) throw new Error(`Pelvis detectada en muy pocas celdas: ${pelvisComprobadas}/16`);
  console.log(`✔ Acción Bicicleta verificada: ${destImg.width}×${destImg.height}; pelvis elevada ${LIFT}px sobre la línea del suelo (fila ${GROUND_ROW}) en ${pelvisComprobadas}/16 celdas y pies en la fila ${GROUND_ROW - LIFT} en las 16, con las filas ${GROUND_ROW - LIFT + 1}–${GROUND_ROW} libres para el vehículo.`);
}

(process.argv.includes("--verify") ? verify() : build()).catch((e) => {
  console.error(`[ash-accion-bicicleta] ERROR: ${e.message}`);
  process.exit(1);
});
