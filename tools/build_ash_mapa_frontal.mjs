#!/usr/bin/env node
/**
 * build_ash_mapa_frontal.mjs — variante "Mapa Frontal" del charset de Ash.
 *
 * Toma el charset limpio ash_outfit_atlas.png (RMXP 128×192: 4 direcciones ×
 * 4 patrones de 32×48) y alinea los pies de cada celda sobre una base horizontal
 * rígida: la última fila de píxeles visibles de TODOS los patrones cae en la
 * fila 47 de su celda (fondo de la cuadrícula de 16×16: 48 = 3 × 16). Cada celda
 * se centra horizontalmente. No modifica el charset original.
 *
 * Uso: node tools/build_ash_mapa_frontal.mjs [--verify]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHARS = path.join(ROOT, "pokemon_fire_ash", "Graphics", "Characters");
const SRC = path.join(CHARS, "ash_outfit_atlas.png");
const DEST = path.join(CHARS, "ash_outfit_mapa_frontal.png");
const CELL_W = 32, CELL_H = 48, COLS = 4, ROWS = 4;
const BASE_ROW = CELL_H - 1; // fila 47 = base de los pies
const TILE = 16;             // cuadrícula de 16×16 px

async function build() {
  if (!fs.existsSync(SRC)) throw new Error(`Falta el charset base ${SRC}`);
  const src = await loadImage(SRC);
  if (src.width !== CELL_W * COLS || src.height !== CELL_H * ROWS) {
    throw new Error(`Tamaño de charset inesperado: ${src.width}×${src.height}`);
  }
  const out = createCanvas(src.width, src.height);
  const octx = out.getContext("2d");
  octx.imageSmoothingEnabled = false;
  const sctx = createCanvas(src.width, src.height).getContext("2d");
  sctx.drawImage(src, 0, 0);
  const data = sctx.getImageData(0, 0, src.width, src.height).data;
  for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLS; col++) {
    const x0 = col * CELL_W, y0 = row * CELL_H;
    let l = CELL_W, r = -1, b = -1;
    for (let y = 0; y < CELL_H; y++) for (let x = 0; x < CELL_W; x++) {
      if (data[((y0 + y) * src.width + x0 + x) * 4 + 3] > 0) {
        if (x < l) l = x; if (x > r) r = x; if (y > b) b = y;
      }
    }
    if (r < 0) throw new Error(`Celda vacía ${row},${col}`);
    const w = r - l + 1;
    const dx = Math.floor((CELL_W - w) / 2) - l;
    const dy = BASE_ROW - b;
    // Copia el contenido de la celda desplazado: pies en la base común.
    const cell = createCanvas(CELL_W, CELL_H).getContext("2d");
    cell.drawImage(src, x0, y0, CELL_W, CELL_H, 0, 0, CELL_W, CELL_H);
    octx.clearRect(x0, y0, CELL_W, CELL_H);
    octx.drawImage(cell.canvas, 0, 0, CELL_W, CELL_H, x0 + dx, y0 + dy, CELL_W, CELL_H);
  }
  fs.writeFileSync(DEST, out.toBuffer("image/png"));
  console.log(`✔ ${path.relative(ROOT, DEST)} — ${src.width}×${src.height}, pies en la fila ${BASE_ROW} (${TILE}px grid).`);
}

async function verify() {
  if (!fs.existsSync(DEST)) throw new Error(`Falta ${DEST}`);
  const img = await loadImage(DEST);
  if (img.width !== CELL_W * COLS || img.height !== CELL_H * ROWS) {
    throw new Error(`Tamaño incorrecto: ${img.width}×${img.height}`);
  }
  const ctx = createCanvas(img.width, img.height).getContext("2d");
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, img.width, img.height).data;
  const bottoms = [];
  for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLS; col++) {
    let b = -1;
    for (let y = 0; y < CELL_H; y++) for (let x = 0; x < CELL_W; x++) {
      if (d[(((row * CELL_H) + y) * img.width + col * CELL_W + x) * 4 + 3] > 0) b = Math.max(b, y);
    }
    bottoms.push(b);
  }
  if (bottoms.some((b) => b !== BASE_ROW)) throw new Error(`Pies desalineados: ${bottoms.join(",")}`);
  console.log(`✔ Mapa Frontal verificado: ${img.width}×${img.height}; base de pies en fila ${BASE_ROW} en las 16 celdas.`);
}

(process.argv.includes("--verify") ? verify() : build()).catch((e) => {
  console.error(`[ash-mapa-frontal] ERROR: ${e.message}`);
  process.exit(1);
});
