#!/usr/bin/env node
/**
 * build_outfit_sheets.mjs — convierte los assets de atavios en hojas de
 * personaje RMXP 128x192 (4x4 de 32x48).
 *
 * Entrada:  assets_outfit/<clave>.png (rejilla 4x4 generada, fondo blanco).
 * Salida:   pokemon_fire_ash/Graphics/Characters/<charset>.png (fondo transparente).
 *
 * Proceso por celda: recorta la celda de la rejilla, detecta el bounding box
 * del personaje (lo no-blanco), lo reescala a 32x48 conservando proporción y
 * lo ancla al centro-inferior de la celda (como hace RMXP con los charsets).
 *
 * Uso: node tools/build_outfit_sheets.mjs [--verify]
 */
import fs from "node:fs";
import path from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const ROOT = path.resolve(new URL(".", import.meta.url).pathname, "..");
const SRC = path.join(ROOT, "assets_outfit");
const DST = path.join(ROOT, "pokemon_fire_ash", "Graphics", "Characters");
const BACKUP = path.join(ROOT, "PokeModBackups", "atavios");
const CELL_W = 32, CELL_H = 48, GRID = 4;
const SHEET_W = CELL_W * GRID, SHEET_H = CELL_H * GRID;
const BLANCO = 235; // canal por encima = fondo

const BOM = [
  ["atlas",   "ash_outfit_atlas"],
  ["creep",   "ash_outfit_creep"],
  ["glazed",  "ash_outfit_glazed"],
  ["lp",      "ash_outfit_lp"],
  ["lc",      "ash_outfit_lc"],
  ["tfoh",    "ash_outfit_tfoh"],
];

function bgPixel(d, i) {
  // blanco casi puro o transparente = fondo
  return (d[i + 3] < 20) || (d[i] >= BLANCO && d[i + 1] >= BLANCO && d[i + 2] >= BLANCO);
}

function bboxOf(imgData, x0, y0, w, h) {
  const d = imgData.data;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = ((y0 + y) * imgData.width + (x0 + x)) * 4;
      if (!bgPixel(d, i)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return maxX < 0 ? null : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

async function convertir(clave, charset) {
  const src = path.join(SRC, `${clave}.png`);
  const img = await loadImage(src);
  const big = createCanvas(img.width, img.height);
  const bc = big.getContext("2d");
  bc.drawImage(img, 0, 0);
  const data = bc.getImageData(0, 0, img.width, img.height);

  const sheet = createCanvas(SHEET_W, SHEET_H);
  const sc = sheet.getContext("2d");
  sc.imageSmoothingEnabled = true;

  const cw = Math.floor(img.width / GRID), ch = Math.floor(img.height / GRID);
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const cx = col * cw, cy = row * ch;
      const bb = bboxOf(data, cx, cy, cw, ch);
      // destino dentro de la celda 32x48
      const dx0 = col * CELL_W, dy0 = row * CELL_H;
      if (!bb) continue; // celda vacía: celda transparente
      const esc = Math.min(CELL_W / bb.w, CELL_H / bb.h);
      const dw = Math.round(bb.w * esc), dh = Math.round(bb.h * esc);
      const dx = dx0 + Math.round((CELL_W - dw) / 2);
      const dy = dy0 + CELL_H - dh; // anclado al suelo
      sc.drawImage(img, cx + bb.x, cy + bb.y, bb.w, bb.h, dx, dy, dw, dh);
    }
  }

  // key de residuos blancos: píxeles con canales altos → transparentes (los
  // bordes suaves del reescalado se degradan a alfa proporcional)
  const out = sc.getImageData(0, 0, SHEET_W, SHEET_H);
  const od = out.data;
  for (let i = 0; i < od.length; i += 4) {
    if (od[i + 3] === 0) continue;
    const m = Math.max(od[i], od[i + 1], od[i + 2]);
    if (od[i] >= BLANCO && od[i + 1] >= BLANCO && od[i + 2] >= BLANCO) {
      od[i + 3] = 0;
    } else if (m >= 200) {
      od[i + 3] = Math.round(od[i + 3] * Math.max(0, (255 - m) / (255 - BLANCO)));
    }
  }
  sc.putImageData(out, 0, 0);

  const dest = path.join(DST, `${charset}.png`);
  if (fs.existsSync(dest) && !fs.existsSync(path.join(BACKUP, `${charset}.png`))) {
    fs.mkdirSync(BACKUP, { recursive: true });
    fs.copyFileSync(dest, path.join(BACKUP, `${charset}.png`));
  }
  fs.mkdirSync(DST, { recursive: true });
  fs.writeFileSync(dest, sheet.toBuffer("image/png"));
  console.log(`[atavios] ${charset}.png 128x192 <- assets_outfit/${clave}.png`);
  return dest;
}

async function main() {
  const soloVerificar = process.argv.includes("--verify");
  for (const [clave, charset] of BOM) {
    const dest = path.join(DST, `${charset}.png`);
    if (soloVerificar) {
      const ok = fs.existsSync(dest) &&
        (await loadImage(dest).then(i => i.width === SHEET_W && i.height === SHEET_H).catch(() => false));
      if (!ok) throw new Error(`falta o mal dimensionada: ${charset}.png`);
      console.log(`[atavios] verificada ${charset}.png 128x192`);
    } else {
      await convertir(clave, charset);
    }
  }
  console.log(soloVerificar ? "build_outfit_sheets --verify OK" : "build_outfit_sheets OK");
}

main().catch(err => { console.error("[atavios] ERROR:", err.message); process.exit(1); });
