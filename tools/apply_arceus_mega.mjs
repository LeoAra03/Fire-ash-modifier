#!/usr/bin/env node
/**
 * apply_arceus_mega.mjs
 *
 * R14 · «La Mega es un cambio REAL de apariencia.»
 *
 * Instala la MEGA ARCEUS (Forma Origen de los Mil Brazos) como forma 19 de la
 * especie ARCEUS, con sus propios sprites construidos desde el arte fuente de
 * `assets_r14/`, y devuelve a la forma 18 (Fairy Type) su sprite de batalla
 * legítimo, que era un recoloreado de la forma base como sus hermanas de placa.
 *
 *   1. Sprites de batalla de la forma 19 (Front/Back + shiny + iconos) desde
 *      `assets_r14/mega_front_raw.png` y `assets_r14/mega_back_raw.png`:
 *      fundido del fondo magenta, recorte, reescala y paleta.
 *   2. Overworld de la forma 19 (`Graphics/Characters/ARCEUS_19.png` y
 *      seguidor shiny) reutilizando la hoja de la familia ARCEUS.
 *   3. Restauración de `Front/ARCEUS_18.png` y `Back/ARCEUS_18.png` (y shiny)
 *      como el recoloreado hada que corresponde a «Fairy Type».
 *   4. Entrada `ARCEUS_19` en `species.dat` (clon de la forma 18, con las
 *      estadísticas de la Mega y `@real_form_name` = «Forma Origen»).
 *
 * El duelo (`apply_la_ruta_de_dios.mjs`) invoca la forma 19 con
 * `battler.pbChangeForm(19, …)`; este instalador verifica ese enganche.
 *
 * Uso:
 *   node tools/apply_arceus_mega.mjs           # instala y verifica
 *   node tools/apply_arceus_mega.mjs --verify  # solo verifica
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { marshalLoad, marshalDump, RSymbol, RString, RHash, RObject } from "../web/js/marshal.js";
import { DATA, GAME, ROOT } from "./lib/fire_ash_registry.mjs";

const VERIFY_ONLY = process.argv.includes("--verify");
const BACKUP = path.join(GAME, "PokeModBackups", "arceus_mega");
const ID = "ARCEUS_19";
const FORM = 19;

const PNG = {
  front: path.join(GAME, "Graphics", "Pokemon", "Front", `${ID}.png`),
  back: path.join(GAME, "Graphics", "Pokemon", "Back", `${ID}.png`),
  frontShiny: path.join(GAME, "Graphics", "Pokemon", "Front shiny", `${ID}.png`),
  backShiny: path.join(GAME, "Graphics", "Pokemon", "Back shiny", `${ID}.png`),
  icon: path.join(GAME, "Graphics", "Pokemon", "Icons", `${ID}.png`),
  iconShiny: path.join(GAME, "Graphics", "Pokemon", "Icons shiny", `${ID}.png`),
  char: path.join(GAME, "Graphics", "Characters", `${ID}.png`),
  follower: path.join(GAME, "Graphics", "Characters", "Followers shiny", `${ID}.png`),
};
const FAIRY = {
  front: path.join(GAME, "Graphics", "Pokemon", "Front", "ARCEUS_18.png"),
  back: path.join(GAME, "Graphics", "Pokemon", "Back", "ARCEUS_18.png"),
  frontShiny: path.join(GAME, "Graphics", "Pokemon", "Front shiny", "ARCEUS_18.png"),
  backShiny: path.join(GAME, "Graphics", "Pokemon", "Back shiny", "ARCEUS_18.png"),
};
const RAW = {
  front: path.join(ROOT, "assets_r14", "mega_front_raw.png"),
  back: path.join(ROOT, "assets_r14", "mega_back_raw.png"),
};

function fail(msg) { throw new Error(msg); }

/* ───────────────────────── procesado de imagen ────────────────────────── */

function pixelsOf(image) {
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, image.width, image.height);
  return { data: data.data, width: image.width, height: image.height };
}

/** Fundido del fondo por bordes (tolerancia amplia: el raw usa magenta puro). */
function keyBackground({ data, width, height }) {
  const alpha = new Uint8Array(width * height).fill(255);
  const at = (x, y) => (y * width + x) * 4;
  const corner = (x, y) => {
    const i = at(x, y);
    return [data[i], data[i + 1], data[i + 2]];
  };
  const samples = [corner(0, 0), corner(width - 1, 0), corner(0, height - 1), corner(width - 1, height - 1)];
  const bg = [0, 1, 2].map((c) => samples.reduce((sum, s) => sum + s[c], 0) / samples.length);
  const near = (i, tolerance = 80) =>
    Math.abs(data[i] - bg[0]) + Math.abs(data[i + 1] - bg[1]) + Math.abs(data[i + 2] - bg[2]) <= tolerance;
  const seen = new Uint8Array(width * height);
  const queue = [];
  for (let x = 0; x < width; x++) queue.push([x, 0], [x, height - 1]);
  for (let y = 0; y < height; y++) queue.push([0, y], [width - 1, y]);
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

function quantize(data, width, height, alpha, paletteSize) {
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

function finalize(source, width, height, paletteSize) {
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

/** Recorta el sujeto del raw y lo centra en un lienzo de trabajo cuadrado. */
async function cutoutCanvas(conceptFile) {
  const image = await loadImage(conceptFile);
  const raw = pixelsOf(image);
  const alpha = keyBackground(raw);
  const box = boundingBox(alpha, raw.width, raw.height);
  if (!box) fail(`${conceptFile}: fondo no separable`);
  const cutW = box.maxX - box.minX + 1;
  const cutH = box.maxY - box.minY + 1;
  const cutCanvas = createCanvas(cutW, cutH);
  const cutCtx = cutCanvas.getContext("2d");
  const cutImage = cutCtx.createImageData(cutW, cutH);
  for (let y = 0; y < cutH; y++) {
    for (let x = 0; x < cutW; x++) {
      const from = ((box.minY + y) * raw.width + (box.minX + x)) * 4;
      const to = (y * cutW + x) * 4;
      cutImage.data[to] = raw.data[from];
      cutImage.data[to + 1] = raw.data[from + 1];
      cutImage.data[to + 2] = raw.data[from + 2];
      cutImage.data[to + 3] = alpha[(box.minY + y) * raw.width + (box.minX + x)] ? 255 : 0;
    }
  }
  cutCtx.putImageData(cutImage, 0, 0);
  return cutCanvas;
}

/** Rotación de matiz (para shinys) conservando alfa y luminancia. */
function hueShiftCanvas(source, degrees) {
  const canvas = createCanvas(source.width, source.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(source, 0, 0);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  const shift = (((degrees % 360) + 360) % 360) / 360;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 8) continue;
    const [h, s, l] = rgbToHsl(d[i], d[i + 1], d[i + 2]);
    if (s < 0.04) continue;
    const [r, g, b] = hslToRgb((h + shift) % 1, Math.min(1, s * 1.08), l);
    d[i] = r; d[i + 1] = g; d[i + 2] = b;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}
function hueToRgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}
function hslToRgb(h, s, l) {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
    Math.round(hueToRgb(p, q, h) * 255),
    Math.round(hueToRgb(p, q, h - 1 / 3) * 255),
  ];
}

/**
 * Restaura el sprite HADA de la forma 18: recolorea a rosa los tonos dorados
 * del anillo/gema de la forma base, igual que las demás formas de placa son
 * recoloreados de la base. El rosa se calibra contra el overworld hada
 * (Characters/ARCEUS_18.png), que nunca se tocó.
 */
function fairyRecolor(source) {
  const canvas = createCanvas(source.width, source.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(source, 0, 0);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 8) continue;
    const [h, s, l] = rgbToHsl(d[i], d[i + 1], d[i + 2]);
    if (s < 0.18) continue;
    const deg = h * 360;
    // Tonos cálidos del anillo y la gema (oro/ámbar) hacia rosa hada.
    if (deg >= 28 && deg <= 72) {
      const [r, g, b] = hslToRgb(330 / 360, Math.min(1, s * 0.95), Math.min(0.92, l * 1.06));
      d[i] = r; d[i + 1] = g; d[i + 2] = b;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

function writePng(file, canvas) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (fs.existsSync(file) && !fs.existsSync(path.join(BACKUP, path.basename(file)))) {
    fs.mkdirSync(BACKUP, { recursive: true });
    fs.copyFileSync(file, path.join(BACKUP, path.basename(file)));
  }
  fs.writeFileSync(file, canvas.toBuffer("image/png"));
}

/* ─────────────────────────── construcción ─────────────────────────────── */

async function buildMegaSprites() {
  const frontCut = await cutoutCanvas(RAW.front);
  const backCut = await cutoutCanvas(RAW.back);

  // Front: el raw mide 1376x768; conservamos su proporción en un sprite amplio
  // de batalla (el duelo ya admite 208x115; esta versión es más nítida).
  const frontW = 280, frontH = 156;
  writePng(PNG.front, finalize(frontCut, frontW, frontH, 48));
  writePng(PNG.frontShiny, finalize(hueShiftCanvas(frontCut, 28), frontW, frontH, 48));

  // Back: del raw 1024x1024.
  const backW = 240, backH = 240;
  writePng(PNG.back, finalize(backCut, backW, backH, 48));
  writePng(PNG.backShiny, finalize(hueShiftCanvas(backCut, 28), backW, backH, 48));

  // Iconos: dos frames de 64x64 dentro de una hoja 128x64.
  for (const [file, canvas] of [[PNG.icon, frontCut], [PNG.iconShiny, hueShiftCanvas(frontCut, 28)]]) {
    const sheet = createCanvas(128, 64);
    const sctx = sheet.getContext("2d");
    sctx.imageSmoothingEnabled = true;
    sctx.imageSmoothingQuality = "high";
    sctx.drawImage(canvas, 0, 0, 64, 64);
    sctx.drawImage(canvas, 65, 0, 63, 64);
    writePng(file, finalize(sheet, 128, 64, 32));
  }

  // Overworld: la hoja 512x512 de la familia ARCEUS (4x4 frames de 128px).
  const family = await loadImage(path.join(GAME, "Graphics", "Characters", "ARCEUS.png"));
  writePng(PNG.char, finalize(family, 512, 512, 0));
  const familyShinyPath = path.join(GAME, "Graphics", "Characters", "Followers shiny", "ARCEUS.png");
  if (fs.existsSync(familyShinyPath)) {
    const familyShiny = await loadImage(familyShinyPath);
    writePng(PNG.follower, finalize(familyShiny, 512, 512, 0));
  }
}

async function restoreFairySprites() {
  for (const target of [FAIRY.front, FAIRY.back]) {
    const baseName = path.basename(target) === "ARCEUS_18.png"
      ? target.replace("ARCEUS_18.png", "ARCEUS.png")
      : target;
    const base = await loadImage(baseName);
    writePng(target, finalize(fairyRecolor(base), base.width, base.height, 24));
  }
  for (const [target, source] of [
    [FAIRY.frontShiny, path.join(GAME, "Graphics", "Pokemon", "Front shiny", "ARCEUS.png")],
    [FAIRY.backShiny, path.join(GAME, "Graphics", "Pokemon", "Back shiny", "ARCEUS.png")],
  ]) {
    if (!fs.existsSync(source)) continue;
    const base = await loadImage(source);
    writePng(target, finalize(fairyRecolor(hueShiftCanvas(base, 18)), base.width, base.height, 24));
  }
}

/* ─────────────────────────── species.dat ──────────────────────────────── */

function speciesRegistry() {
  const file = path.join(DATA, "species.dat");
  const data = marshalLoad(fs.readFileSync(file));
  const bySymbol = new Map();
  let maxId = 0;
  for (const [key, value] of data.pairs) {
    if (key instanceof RSymbol && value?.getIvar) bySymbol.set(key.name, value);
    if (typeof key === "number") maxId = Math.max(maxId, key);
    if (key instanceof RSymbol && value?.getIvar) maxId = Math.max(maxId, Number(value.getIvar("@id_number")?.value ?? 0));
  }
  return { file, data, bySymbol, maxId };
}

function installSpecies() {
  const { file, data, bySymbol, maxId } = speciesRegistry();
  const template = bySymbol.get("ARCEUS_18") ?? bySymbol.get("ARCEUS");
  if (!template) fail("species.dat no tiene la especie ARCEUS");
  if (bySymbol.has(ID)) return "existia";
  const object = new RObject(template.className, template.ivars.map(([name, value]) => [name, value]));
  const set = (name, value) => object.setIvar(name, value);
  set("@id", new RSymbol(ID));
  set("@id_number", maxId + 1);
  set("@species", new RSymbol("ARCEUS"));
  set("@form", FORM);
  set("@real_form_name", new RString(Buffer.from("Forma Origen", "utf8")));
  // Mega de los Mil Brazos: ataque brutal, conjunto redondo de 820.
  const stats = { HP: 120, ATTACK: 180, DEFENSE: 130, SPECIAL_ATTACK: 140, SPECIAL_DEFENSE: 130, SPEED: 120 };
  const oldStats = object.getIvar("@base_stats");
  const statKeys = oldStats?.pairs
    ? oldStats.pairs.map(([k]) => (k instanceof RSymbol ? k.name : String(k)))
    : Object.keys(stats);
  set("@base_stats", new RHash(statKeys.map((name) => [new RSymbol(name), stats[name] ?? 100])));
  set("@unmega_form", 0);
  if (object.getIvar("@mega_stone") !== undefined) set("@mega_stone", null);
  if (object.getIvar("@mega_move") !== undefined) set("@mega_move", null);
  // El grito lo resuelve Fire Ash por símbolo: clonar el de ARCEUS.
  const seDir = path.join(GAME, "Audio", "SE");
  const cry = path.join(seDir, "ARCEUS.ogg");
  const targetCry = path.join(seDir, `${ID}.ogg`);
  if (fs.existsSync(cry) && !fs.existsSync(targetCry)) fs.copyFileSync(cry, targetCry);

  const next = maxId + 1;
  data.pairs.push([next, object], [new RSymbol(ID), object]);
  fs.mkdirSync(BACKUP, { recursive: true });
  const bak = path.join(BACKUP, "species.dat");
  if (!fs.existsSync(bak)) fs.copyFileSync(file, bak);
  fs.writeFileSync(file, Buffer.from(marshalDump(data)));
  return "instalada";
}

/* ─────────────────────────── verificación ─────────────────────────────── */

function pngSize(file) {
  const buffer = fs.readFileSync(file);
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

function verify() {
  const fallos = [];
  const espera = [
    [PNG.front, 280, 156], [PNG.back, 240, 240],
    [PNG.frontShiny, 280, 156], [PNG.backShiny, 240, 240],
    [PNG.icon, 128, 64], [PNG.iconShiny, 128, 64],
    [PNG.char, 512, 512],
    [FAIRY.front, 96, 96], [FAIRY.back, 96, 96],
  ];
  for (const [file, w, h] of espera) {
    if (!fs.existsSync(file)) { fallos.push(`falta ${path.relative(GAME, file)}`); continue; }
    const [iw, ih] = pngSize(file);
    if (iw !== w || ih !== h) fallos.push(`${path.relative(GAME, file)} mide ${iw}x${ih}, esperaba ${w}x${h}`);
  }
  const { bySymbol } = speciesRegistry();
  const entry = bySymbol.get(ID);
  if (!entry) fallos.push("species.dat no tiene la entrada ARCEUS_19");
  else {
    const rawForm = entry.getIvar("@form");
    const form = Number(rawForm?.value ?? rawForm ?? -1);
    if (form !== FORM) fallos.push(`ARCEUS_19 declara form=${form}`);
    const name = entry.getIvar("@real_form_name");
    const text = name?.bytes ? Buffer.from(name.bytes).toString("utf8") : "";
    if (text !== "Forma Origen") fallos.push(`ARCEUS_19 se llama «${text}» en lugar de «Forma Origen»`);
  }
  // El duelo debe invocar la forma 19.
  for (const scriptsFile of [
    path.join(GAME, "Data", "Scripts.rxdata"),
    path.join(ROOT, "Scripts_corregido", "Scripts.rxdata"),
  ]) {
    if (!fs.existsSync(scriptsFile)) continue;
    const scripts = marshalLoad(fs.readFileSync(scriptsFile));
    const seccion = scripts.find(([, t]) => t && t.text === "PokeMod_RutaDeDios");
    if (!seccion) { fallos.push(`${scriptsFile} no tiene PokeMod_RutaDeDios`); continue; }
    const ruby = zlib.inflateSync(Buffer.from(seccion[2].bytes)).toString("utf8");
    if (!ruby.includes("pbChangeForm(19")) fallos.push(`${scriptsFile}: el duelo no invoca la Forma Origen (19)`);
    if (/pbChangeForm\(18/.test(ruby)) fallos.push(`${scriptsFile}: el duelo aún invoca la forma 18 (hada)`);
  }
  return fallos;
}

/* ─────────────────────────────── main ─────────────────────────────────── */

async function main() {
  if (!VERIFY_ONLY) {
    console.log("· Construyendo sprites de MEGA ARCEUS desde assets_r14 …");
    await buildMegaSprites();
    console.log("  · Front/Back/Iconos + shiny de ARCEUS_19 escritos.");
    console.log("· Restaurando el sprite hada de ARCEUS_18 …");
    await restoreFairySprites();
    console.log("  · Front/Back de ARCEUS_18 (Fairy Type) restaurados.");
    console.log("· Registrando ARCEUS_19 en species.dat …");
    const estado = installSpecies();
    console.log(`  · entrada ARCEUS_19: ${estado}.`);
  }
  const fallos = verify();
  if (fallos.length) {
    console.error("FALLOS:\n" + fallos.map((f) => "  · " + f).join("\n"));
    process.exit(1);
  }
  console.log("OK: Mega Arceus (Forma Origen) instalada con sprites propios; forma 18 (hada) restaurada.");
}

main().catch((error) => { console.error(error); process.exit(1); });
