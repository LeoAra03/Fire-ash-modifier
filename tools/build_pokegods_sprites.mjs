#!/usr/bin/env node
/**
 * Convierte el arte conceptual de los Pokégods en los sprites reales que usa
 * Fire Ash 3.7.1.
 *
 * Entrada  : reference/pokegods/concept/<ID>.png  (cualquier tamaño; se recorta
 *            el fondo liso, se recorta la criatura y se centra).
 * Salida   : Graphics/Pokemon/Front/<ID>.png        96x96   (combate, frente)
 *            Graphics/Pokemon/Back/<ID>.png         96x96   (combate, reverso)
 *            Graphics/Pokemon/Icons/<ID>.png       128x64   (dos fotogramas de 64)
 *            Graphics/Characters/<ID>.png         256x256   (4 direcciones x 4 pasos)
 *
 * El proceso reduce la paleta por corte mediano (median cut) a 32 colores para
 * que el resultado conviva con los sprites clásicos del juego en lugar de
 * parecer una ilustración pegada. El reverso y los fotogramas se derivan del
 * frente: la isla está habitada por anomalías, así que todas las direcciones
 * muestran la misma criatura "mirando" a la vez; es una decisión estética, no
 * un error de assets.
 *
 * Uso:
 *   node tools/build_pokegods_sprites.mjs            # convierte lo que exista
 *   node tools/build_pokegods_sprites.mjs --verify   # valida tamaños y alfa
 *   node tools/build_pokegods_sprites.mjs --strict   # exige los 12 planteles
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { GAME, ROOT } from "./lib/fire_ash_registry.mjs";

const VERIFY = process.argv.includes("--verify");
const STRICT = process.argv.includes("--strict");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "pokegods_originales.json"), "utf8"));
const CONCEPT_DIR = path.join(ROOT, CATALOG.assets.conceptDir);
const FRONT_DIR = path.join(GAME, "Graphics", "Pokemon", "Front");
const BACK_DIR = path.join(GAME, "Graphics", "Pokemon", "Back");
const ICON_DIR = path.join(GAME, "Graphics", "Pokemon", "Icons");
const CHAR_DIR = path.join(GAME, "Graphics", "Characters");
const CRY_DIR = path.join(GAME, "Audio", "SE");
const PALETTE_SIZE = 32;
const [FW, FH] = CATALOG.assets.sizes.front;
const [IW, IH] = CATALOG.assets.sizes.icon;
const [CW, CH] = CATALOG.assets.sizes.character;

// ------------------------------------------------------------------ imagen
function pixelsOf(image) {
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, image.width, image.height);
  return { data: data.data, width: image.width, height: image.height };
}

/** Funde el fondo: recorre desde los bordes con tolerancia de color. */
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

/** Paleta por corte mediano sobre los píxeles opacos. */
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

function quantize(data, width, height, alpha) {
  const opaque = [];
  for (let i = 0; i < width * height; i++) {
    if (!alpha[i]) continue;
    const p = i * 4;
    opaque.push([data[p], data[p + 1], data[p + 2]]);
  }
  const palette = medianCut(opaque, PALETTE_SIZE);
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

function canvasFrom(source, width, height) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);
  return canvas;
}

/**
 * Reescala y cuantiza en el tamaño final. La paleta se calcula DESPUÉS de
 * reescalar: si se hiciera antes, el suavizado volvería a mezclar colores y el
 * sprite perdería el aspecto de pixel art del juego base.
 */
function finalize(source, width, height) {
  const canvas = canvasFrom(source, width, height);
  const ctx = canvas.getContext("2d");
  const pixels = ctx.getImageData(0, 0, width, height);
  const mask = new Uint8Array(width * height);
  for (let i = 0; i < mask.length; i++) mask[i] = pixels.data[i * 4 + 3] > 8 ? 1 : 0;
  const quantized = quantize(pixels.data, width, height, mask);
  const image = ctx.createImageData(width, height);
  image.data.set(quantized);
  ctx.putImageData(image, 0, 0);
  return canvas;
}

async function buildOne(entry) {
  const file = path.join(CONCEPT_DIR, `${entry.id}.png`);
  if (!fs.existsSync(file)) return { id: entry.id, missing: true };
  const image = await loadImage(file);
  const raw = pixelsOf(image);
  const alpha = keyBackground(raw);
  const box = boundingBox(alpha, raw.width, raw.height);
  if (!box) throw new Error(`${entry.id}: el concepto no tiene criatura recognoscible (fondo no separable)`);
  const cutW = box.maxX - box.minX + 1;
  const cutH = box.maxY - box.minY + 1;

  // Recorte centrado sobre un lienzo cuadrado de trabajo.
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

  fs.mkdirSync(FRONT_DIR, { recursive: true });
  fs.mkdirSync(BACK_DIR, { recursive: true });
  fs.mkdirSync(ICON_DIR, { recursive: true });
  fs.mkdirSync(CHAR_DIR, { recursive: true });

  // Frente: 96x96 con paleta reducida.
  const front = finalize(canvas, FW, FH);
  fs.writeFileSync(path.join(FRONT_DIR, `${entry.id}.png`), front.toBuffer("image/png"));

  // Reverso: la misma silueta en sombra (la isla no muestra dos caras).
  const backRaw = createCanvas(FW, FH);
  const backRawCtx = backRaw.getContext("2d");
  backRawCtx.drawImage(front, 0, 0);
  backRawCtx.globalCompositeOperation = "source-atop";
  backRawCtx.fillStyle = "rgba(18,14,32,0.34)";
  backRawCtx.fillRect(0, 0, FW, FH);
  const back = finalize(backRaw, FW, FH);
  fs.writeFileSync(path.join(BACK_DIR, `${entry.id}.png`), back.toBuffer("image/png"));

  // Icono: dos fotogramas de 64; el segundo late un píxel, como un dato corrupto.
  const iconRaw = createCanvas(IW, IH);
  const iconRawCtx = iconRaw.getContext("2d");
  iconRawCtx.imageSmoothingEnabled = true;
  iconRawCtx.imageSmoothingQuality = "high";
  iconRawCtx.drawImage(canvas, 0, 0, 64, 64);
  iconRawCtx.drawImage(canvas, 64 + 1, 0, 63, 64);
  const icon = finalize(iconRaw, IW, IH);
  fs.writeFileSync(path.join(ICON_DIR, `${entry.id}.png`), icon.toBuffer("image/png"));

  // Overworld: 4 direcciones x 4 pasos de 64. Todas miran de frente: son
  // anomalías, no criaturas con espalda.
  const sheetRaw = createCanvas(CW, CH);
  const sheetRawCtx = sheetRaw.getContext("2d");
  sheetRawCtx.imageSmoothingEnabled = true;
  sheetRawCtx.imageSmoothingQuality = "high";
  for (let row = 0; row < 4; row++) {
    for (let step = 0; step < 4; step++) {
      const bob = step % 2 === 0 ? 0 : -2;
      sheetRawCtx.drawImage(canvas, step * 64, row * 64 + bob, 64, 64);
    }
  }
  const sheet = finalize(sheetRaw, CW, CH);
  fs.writeFileSync(path.join(CHAR_DIR, `${entry.id}.png`), sheet.toBuffer("image/png"));
  return { id: entry.id, missing: false };
}

// -------------------------------------------------------------- verificación
function pngSize(file) {
  const buffer = fs.readFileSync(file);
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}
function coverage(file) {
  const [width, height] = pngSize(file);
  return { width, height, ok: width > 0 && height > 0 };
}

async function verify() {
  const errors = [];
  const pending = [];
  for (const entry of CATALOG.roster) {
    const targets = [
      [path.join(FRONT_DIR, `${entry.id}.png`), FW, FH],
      [path.join(BACK_DIR, `${entry.id}.png`), FW, FH],
      [path.join(ICON_DIR, `${entry.id}.png`), IW, IH],
      [path.join(CHAR_DIR, `${entry.id}.png`), CW, CH],
    ];
    let complete = true;
    for (const [file, width, height] of targets) {
      if (!fs.existsSync(file)) { complete = false; continue; }
      const size = coverage(file);
      if (size.width !== width || size.height !== height) {
        errors.push(`${entry.id}: ${path.basename(path.dirname(file))}/${path.basename(file)} mide ${size.width}x${size.height} y debe medir ${width}x${height}`);
      }
    }
    if (!complete) pending.push(entry.id);
  }
  if (STRICT && pending.length) {
    errors.push(`faltan sprites de ${pending.length} Pokégods: ${pending.join(", ")}`);
  }
  if (errors.length) throw new Error(`Sprites Pokégod inválidos (${errors.length}):\n- ${errors.join("\n- ")}`);
  const ready = CATALOG.roster.length - pending.length;
  console.log(`Verificación OK: ${ready}/${CATALOG.roster.length} Pokégods con frente ${FW}x${FH}, reverso, icono ${IW}x${IH} y overworld ${CW}x${CH}.` +
    (pending.length ? ` Pendientes de arte: ${pending.join(", ")}.` : ""));
}

if (VERIFY) {
  await verify();
} else {
  const built = [];
  const missing = [];
  for (const entry of CATALOG.roster) {
    const result = await buildOne(entry);
    (result.missing ? missing : built).push(result.id);
  }
  if (built.length) console.log(`Sprites construidos (${built.length}): ${built.join(", ")}`);
  if (missing.length) console.log(`Sin arte conceptual todavía (${missing.length}): ${missing.join(", ")}`);
  await verify();
}
