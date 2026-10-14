#!/usr/bin/env node
/**
 * Extrae la hoja de caminar de Ash de la referencia local de Unbound y la adapta
 * al charset RMXP del juego: 4 direcciones × 4 patrones, celdas 32×48, fondo
 * transparente, tamaño final 128×192. No extrae ni empaqueta datos de la ROM.
 *
 * node tools/build_unbound_ash_outfit.mjs [--verify]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(ROOT, "ashsprites", "ash_pokemon_unbound.jpg");
const DEST_DIR = path.join(ROOT, "pokemon_fire_ash", "Graphics", "Characters");
const DEST = path.join(DEST_DIR, "ash_outfit_unbound.png");
const BACKUP = path.join(ROOT, "pokemon_fire_ash", "PokeModBackups", "atavios", "ash_outfit_unbound.png");
const CELL_W = 32, CELL_H = 48, COLS = 4, ROWS = 4;
const OUTPUT_W = CELL_W * COLS, OUTPUT_H = CELL_H * ROWS;
const FRAME_W = 42, FRAME_H = 64;
const FRAME_X = [53, 107, 161];
const FRAME_Y = [81, 151, 221];
const CYCLE = [0, 1, 2, 1];

function isReferenceGreen(r, g, b) {
  // El fondo y la filigrana de la lámina son verde/sombra-verde; el sprite de
  // Ash usa rojo, crema, piel, azul y marrón. El key no toca esos tonos.
  return g >= 42 && g > r * 1.13 && g > b * 1.04 && r < 125 && b < 145;
}

function extractFrame(source, sx, sy, mirror) {
  const raw = createCanvas(FRAME_W, FRAME_H);
  const rc = raw.getContext("2d");
  rc.drawImage(source, sx, sy, FRAME_W, FRAME_H, 0, 0, FRAME_W, FRAME_H);
  const image = rc.getImageData(0, 0, FRAME_W, FRAME_H);
  const pixels = image.data;
  let left = FRAME_W, top = FRAME_H, right = -1, bottom = -1;
  for (let y = 0; y < FRAME_H; y += 1) for (let x = 0; x < FRAME_W; x += 1) {
    const i = (y * FRAME_W + x) * 4;
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    if (isReferenceGreen(r, g, b)) {
      pixels[i + 3] = 0;
      continue;
    }
    // La fuente es JPEG; cuantizar a 5 bits/canal elimina el ruido de compresión
    // sin desdibujar el pixel art ni cambiar su paleta de forma agresiva.
    pixels[i] = Math.round(r / 8) * 8;
    pixels[i + 1] = Math.round(g / 8) * 8;
    pixels[i + 2] = Math.round(b / 8) * 8;
    if (x < left) left = x;
    if (x > right) right = x;
    if (y < top) top = y;
    if (y > bottom) bottom = y;
  }
  if (right < left || bottom < top) throw new Error(`No se detectó el personaje en el recorte ${sx},${sy}`);
  rc.putImageData(image, 0, 0);
  const bounds = { x: left, y: top, w: right - left + 1, h: bottom - top + 1 };
  const frame = createCanvas(CELL_W, CELL_H);
  const fc = frame.getContext("2d");
  fc.imageSmoothingEnabled = false;
  const scale = Math.min(CELL_W / bounds.w, CELL_H / bounds.h);
  const w = Math.max(1, Math.min(CELL_W, Math.round(bounds.w * scale)));
  const h = Math.max(1, Math.min(CELL_H, Math.round(bounds.h * scale)));
  const x = Math.floor((CELL_W - w) / 2);
  const y = CELL_H - h;
  fc.drawImage(raw, bounds.x, bounds.y, bounds.w, bounds.h, x, y, w, h);
  return { canvas: frame, mirror };
}

async function build() {
  if (!fs.existsSync(SOURCE)) throw new Error(`Falta la referencia visual ${SOURCE}`);
  const source = await loadImage(SOURCE);
  if (source.width < 220 || source.height < 285) {
    throw new Error(`La lámina tiene tamaño inesperado: ${source.width}×${source.height}`);
  }
  const sheet = createCanvas(OUTPUT_W, OUTPUT_H);
  const ctx = sheet.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  // Orden RMXP: abajo, izquierda, derecha, arriba. La fuente ofrece tres
  // patrones por pose; se coloca el paso central en el patrón de reposo.
  const directions = [
    { sourceRow: 0, mirror: false }, // frente / abajo
    { sourceRow: 2, mirror: true },  // perfil reflejado / izquierda
    { sourceRow: 2, mirror: false }, // perfil / derecha
    { sourceRow: 1, mirror: false }, // espalda / arriba
  ];
  for (let row = 0; row < ROWS; row += 1) {
    const direction = directions[row];
    for (let col = 0; col < COLS; col += 1) {
      const frameIndex = CYCLE[col];
      const frame = extractFrame(source, FRAME_X[frameIndex], FRAME_Y[direction.sourceRow], direction.mirror);
      const dx = col * CELL_W, dy = row * CELL_H;
      if (frame.mirror) {
        ctx.save();
        ctx.translate(dx + CELL_W, dy);
        ctx.scale(-1, 1);
        ctx.drawImage(frame.canvas, 0, 0);
        ctx.restore();
      } else {
        ctx.drawImage(frame.canvas, dx, dy);
      }
    }
  }
  fs.mkdirSync(DEST_DIR, { recursive: true });
  if (fs.existsSync(DEST) && !fs.existsSync(BACKUP)) {
    fs.mkdirSync(path.dirname(BACKUP), { recursive: true });
    fs.copyFileSync(DEST, BACKUP);
  }
  fs.writeFileSync(DEST, sheet.toBuffer("image/png"));
  console.log(`✔ ${path.relative(ROOT, DEST)} — ${OUTPUT_W}×${OUTPUT_H}, 4 direcciones × 4 patrones.`);
}

async function verify() {
  if (!fs.existsSync(DEST)) throw new Error(`Falta ${DEST}`);
  const image = await loadImage(DEST);
  if (image.width !== OUTPUT_W || image.height !== OUTPUT_H) {
    throw new Error(`Tamaño de charset incorrecto: ${image.width}×${image.height}`);
  }
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, image.width, image.height).data;
  const opaqueByDirection = [];
  for (let row = 0; row < ROWS; row += 1) {
    let opaque = 0;
    for (let y = row * CELL_H; y < (row + 1) * CELL_H; y += 1) for (let x = 0; x < image.width; x += 1) {
      if (data[(y * image.width + x) * 4 + 3] > 0) opaque += 1;
    }
    opaqueByDirection.push(opaque);
  }
  if (opaqueByDirection.some((count) => count < 100)) throw new Error(`Dirección vacía o rota: ${opaqueByDirection.join(", ")}`);
  console.log(`✔ Ash Unbound verificado: ${image.width}×${image.height}; píxeles visibles por dirección ${opaqueByDirection.join("/")}.`);
}

const verifyOnly = process.argv.includes("--verify");
(verifyOnly ? verify() : build()).catch((error) => {
  console.error(`[ash-unbound] ERROR: ${error.message}`);
  process.exit(1);
});
