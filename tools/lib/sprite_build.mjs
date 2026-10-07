// ============================================================================
// sprite_build.mjs — convierte arte conceptual (fondo liso) en el set de
// sprites que consume Fire Ash 3.7.1. Misma receta que build_pokegods_sprites:
// fundido de fondo por bordes, recorte, reescala y paleta por corte mediano.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { GAME } from "./fire_ash_registry.mjs";

const PALETTE_SIZE = 32;
const [FW, FH] = [96, 96];
const [IW, IH] = [128, 64];
const [CW, CH] = [256, 256];

function pixelsOf(image) {
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, image.width, image.height);
  return { data: data.data, width: image.width, height: image.height };
}

function keyBackground({ data, width, height }) {
  const alpha = new Uint8Array(width * height).fill(255);
  const at = (x, y) => (y * width + x) * 4;
  const corner = (x, y) => {
    const i = at(x, y);
    return [data[i], data[i + 1], data[i + 2]];
  };
  const samples = [corner(0, 0), corner(width - 1, 0), corner(0, height - 1), corner(width - 1, height - 1)];
  const bg = [0, 1, 2].map((c) => samples.reduce((sum, s) => sum + s[c], 0) / samples.length);
  const near = (i, tolerance = 46) =>
    Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2]) <= tolerance;
  const seen = new Uint8Array(width * height);
  const queue = [];
  for (let x = 0; x < width; x++) { queue.push([x, 0], [x, height - 1]); }
  for (let y = 0; y < height; y++) { queue.push([0, y], [width - 1, y]); }
  while (queue.length) {
    const [x, y] = queue.pop();
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const index = y * width + x;
    if (seen[index]) continue;
    seen[index] = 1;
    const i = index * 4;
    if (!near(i)) continue;
    alpha[index] = 0;
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return alpha;
}

function boundingBox(alpha, width, height) {
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!alpha[y * width + x]) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return maxX < 0 ? null : { minX, minY, maxX, maxY };
}

function medianCut(rgbList, size) {
  if (!rgbList.length) return [];
  let boxes = [rgbList];
  while (boxes.length < size) {
    boxes.sort((a, b) => b.length - a.length);
    const box = boxes.shift();
    if (!box || box.length < 2) { if (box) boxes.push(box); break; }
    let range = -1, channel = 0;
    for (let c = 0; c < 3; c++) {
      let lo = 255, hi = 0;
      for (const px of box) { lo = Math.min(lo, px[c]); hi = Math.max(hi, px[c]); }
      if (hi - lo > range) { range = hi - lo; channel = c; }
    }
    box.sort((a, b) => a[channel] - b[channel]);
    const mid = Math.floor(box.length / 2);
    boxes.push(box.slice(0, mid), box.slice(mid));
  }
  return boxes.filter((box) => box.length).map((box) => [0, 1, 2].map((c) =>
    Math.round(box.reduce((sum, px) => sum + px[c], 0) / box.length)));
}

function quantize(data, width, height, alpha, paletteSize = PALETTE_SIZE) {
  const opaque = [];
  for (let i = 0; i < width * height; i++) {
    if (!alpha[i]) continue;
    const p = i * 4;
    opaque.push([data[p], data[p + 1], data[p + 2]]);
  }
  const palette = paletteSize > 0 ? medianCut(opaque, paletteSize) : [];
  const out = new Uint8ClampedArray(data.length);
  out.set(data);
  if (!palette.length) return out;
  for (let i = 0; i < width * height; i++) {
    if (!alpha[i]) { out[i * 4 + 3] = 0; continue; }
    const p = i * 4;
    let best = 0, bestDistance = Infinity;
    for (let k = 0; k < palette.length; k++) {
      const [r, g, b] = palette[k];
      const distance = (r - data[p]) ** 2 + (g - data[p + 1]) ** 2 + (b - data[p + 2]) ** 2;
      if (distance < bestDistance) { bestDistance = distance; best = k; }
    }
    out[p] = palette[best][0];
    out[p + 1] = palette[best][1];
    out[p + 2] = palette[best][2];
    out[p + 3] = 255;
  }
  return out;
}

function finalize(source, width, height, paletteSize = PALETTE_SIZE) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);
  const pixels = ctx.getImageData(0, 0, width, height);
  const mask = new Uint8Array(width * height);
  for (let i = 0; i < mask.length; i++) mask[i] = pixels.data[i * 4 + 3] > 8 ? 1 : 0;
  const quantized = quantize(pixels.data, width, height, mask, paletteSize);
  const image = ctx.createImageData(width, height);
  image.data.set(quantized);
  ctx.putImageData(image, 0, 0);
  return canvas;
}

/** Genera Front/Back/Icons/Characters de `id` a partir de un concepto PNG. */
export async function buildPokemonSprites(conceptFile, id, { paletteSize = PALETTE_SIZE } = {}) {
  const image = await loadImage(conceptFile);
  const raw = pixelsOf(image);
  const alpha = keyBackground(raw);
  const box = boundingBox(alpha, raw.width, raw.height);
  if (!box) throw new Error(`${id}: fondo no separable`);
  const cutW = box.maxX - box.minX + 1;
  const cutH = box.maxY - box.minY + 1;
  const base = 256;
  const scale = Math.min(base / cutW, base / cutH);
  const drawW = Math.max(1, Math.round(cutW * scale));
  const drawH = Math.max(1, Math.round(cutH * scale));
  const canvas = createCanvas(base, base);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const cutData = new Uint8ClampedArray(cutW * cutH * 4);
  for (let y = 0; y < cutH; y++) {
    for (let x = 0; x < cutW; x++) {
      const from = ((box.minY + y) * raw.width + (box.minX + x)) * 4;
      const to = (y * cutW + x) * 4;
      cutData[to] = raw.data[from];
      cutData[to + 1] = raw.data[from + 1];
      cutData[to + 2] = raw.data[from + 2];
      cutData[to + 3] = alpha[(box.minY + y) * raw.width + (box.minX + x)] ? 255 : 0;
    }
  }
  const cutCanvas = createCanvas(cutW, cutH);
  const cutCtx = cutCanvas.getContext("2d");
  const cutImage = cutCtx.createImageData(cutW, cutH);
  cutImage.data.set(cutData);
  cutCtx.putImageData(cutImage, 0, 0);
  ctx.drawImage(cutCanvas, Math.floor((base - drawW) / 2), Math.floor((base - drawH) / 2), drawW, drawH);

  const dirs = {
    front: path.join(GAME, "Graphics", "Pokemon", "Front"),
    back: path.join(GAME, "Graphics", "Pokemon", "Back"),
    icon: path.join(GAME, "Graphics", "Pokemon", "Icons"),
    char: path.join(GAME, "Graphics", "Characters"),
  };
  for (const d of Object.values(dirs)) fs.mkdirSync(d, { recursive: true });

  const front = finalize(canvas, FW, FH, paletteSize);
  fs.writeFileSync(path.join(dirs.front, `${id}.png`), front.toBuffer("image/png"));

  const backRaw = createCanvas(FW, FH);
  const backCtx = backRaw.getContext("2d");
  backCtx.drawImage(front, 0, 0);
  backCtx.globalCompositeOperation = "source-atop";
  backCtx.fillStyle = "rgba(18,14,32,0.34)";
  backCtx.fillRect(0, 0, FW, FH);
  fs.writeFileSync(path.join(dirs.back, `${id}.png`), finalize(backRaw, FW, FH, paletteSize).toBuffer("image/png"));

  const iconRaw = createCanvas(IW, IH);
  const iconCtx = iconRaw.getContext("2d");
  iconCtx.imageSmoothingEnabled = true;
  iconCtx.drawImage(canvas, 0, 0, 64, 64);
  iconCtx.drawImage(canvas, 65, 0, 63, 64);
  fs.writeFileSync(path.join(dirs.icon, `${id}.png`), finalize(iconRaw, IW, IH, paletteSize).toBuffer("image/png"));

  const sheetRaw = createCanvas(CW, CH);
  const sheetCtx = sheetRaw.getContext("2d");
  sheetCtx.imageSmoothingEnabled = true;
  for (let row = 0; row < 4; row++) {
    for (let step = 0; step < 4; step++) {
      const bob = step % 2 === 0 ? 0 : -2;
      sheetCtx.drawImage(canvas, step * 64, row * 64 + bob, 64, 64);
    }
  }
  fs.writeFileSync(path.join(dirs.char, `${id}.png`), finalize(sheetRaw, CW, CH, paletteSize).toBuffer("image/png"));
  return Object.values(dirs).map((d) => path.relative(path.join(GAME, ".."), path.join(d, `${id}.png`)).split(path.sep).slice(1).join("/"));
}
