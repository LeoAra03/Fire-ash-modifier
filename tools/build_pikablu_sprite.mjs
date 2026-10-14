#!/usr/bin/env node
/**
 * Pikablu es el rumor más viejo de todos: un Pikachu azul que nadie pudo
 * enseñar dos veces. Mientras no exista arte conceptual propio, este script lo
 * adapta del Pikachu del juego en lugar de dejar un hueco:
 *
 *   Graphics/Pokemon/Front/PIKACHU.png   -> Front/PIKABLU.png      96x96
 *   Graphics/Pokemon/Back/PIKACHU.png    -> Back/PIKABLU.png       96x96
 *   Graphics/Pokemon/Icons/PIKACHU.png   -> Icons/PIKABLU.png     128x64
 *   (hoja de overworld)                  -> Characters/PIKABLU.png 256x256
 *
 * La transformación trabaja en HSL: solo reescribe los tonos amarillos y
 * marrones (cuerpo y rayas) y empuja su matiz al azul cielo. Los cheek sacs
 * rojos, el negro del contorno y los blancos se respetan tal cual, así que la
 * silueta sigue siendo legible a 96x96.
 *
 * Si algún día se dibuja arte conceptual en reference/pokegods/concept/, este
 * script se aparta: avisa y deja el trabajo a build_pokegods_sprites.mjs, que
 * reconstruye los cuatro formatos desde el concepto con paleta reducida.
 *
 * Uso:
 *   node tools/build_pikablu_sprite.mjs            # adapta y verifica
 *   node tools/build_pikablu_sprite.mjs --verify   # solo comprueba tamaños
 */
import fs from "node:fs";
import path from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { GAME, ROOT } from "./lib/fire_ash_registry.mjs";

const VERIFY = process.argv.includes("--verify");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "pokegods_originales.json"), "utf8"));
const ENTRY = CATALOG.roster.find((entry) => entry.id === "PIKABLU");
if (!ENTRY) throw new Error("El catálogo no define a PIKABLU");
const SOURCE = "PIKACHU";
const FRONT_DIR = path.join(GAME, "Graphics", "Pokemon", "Front");
const BACK_DIR = path.join(GAME, "Graphics", "Pokemon", "Back");
const ICON_DIR = path.join(GAME, "Graphics", "Pokemon", "Icons");
const CHAR_DIR = path.join(GAME, "Graphics", "Characters");
const CONCEPT = path.join(ROOT, CATALOG.assets.conceptDir, "PIKABLU.png");
const [FW, FH] = CATALOG.assets.sizes.front;
const [IW, IH] = CATALOG.assets.sizes.icon;
const [CW, CH] = CATALOG.assets.sizes.character;
const SKY = 197 / 360;      // azul cielo del rumor
const DEEP = 212 / 360;     // azul profundo para las rayas del lomo

// ------------------------------------------------------------------- color
function rgbToHsl(r, g, b) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (!d) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return [h, s, l];
}
function hueToRgb(p, q, t) {
  let x = t;
  if (x < 0) x += 1;
  if (x > 1) x -= 1;
  if (x < 1 / 6) return p + (q - p) * 6 * x;
  if (x < 1 / 2) return q;
  if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
  return p;
}
function hslToRgb(h, s, l) {
  if (!s) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
    Math.round(hueToRgb(p, q, h) * 255),
    Math.round(hueToRgb(p, q, h - 1 / 3) * 255),
  ];
}
/** Amarillos y marrones del cuerpo -> azul; todo lo demás se queda como está. */
function pikabluTint(data) {
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    if (s < 0.18 || l < 0.12) continue;              // contorno, sombra, blanco
    // Los rojos (cheeks) y los magentas se respetan: el rumor decía "azul", no "gris".
    if (h < 0.055 || h > 0.92) continue;
    if (h >= 0.09 && h <= 0.20) {                    // amarillo del cuerpo
      const rgb = hslToRgb(SKY, Math.min(1, s * 1.05), Math.min(0.92, l + 0.02));
      [data[i], data[i + 1], data[i + 2]] = rgb;
    } else if (h > 0.055 && h < 0.09) {              // marrón de las rayas del lomo
      const rgb = hslToRgb(DEEP, Math.min(1, s * 0.9), Math.max(0.18, l - 0.02));
      [data[i], data[i + 1], data[i + 2]] = rgb;
    }
  }
  return data;
}

// ------------------------------------------------------------------ lienzo
function pixelsOf(image) {
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  return { canvas, width: image.width, height: image.height };
}
async function tinted(file) {
  const image = await loadImage(file);
  const { canvas, width, height } = pixelsOf(image);
  const ctx = canvas.getContext("2d");
  const frame = ctx.getImageData(0, 0, width, height);
  pikabluTint(frame.data);
  ctx.putImageData(frame, 0, 0);
  return canvas;
}
/** Hoja de overworld: 4 direcciones x 4 pasos, todas de frente, como el resto de Pokégods. */
function overworldSheet(front) {
  const sheet = createCanvas(CW, CH);
  const ctx = sheet.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  for (let row = 0; row < 4; row++) {
    for (let step = 0; step < 4; step++) {
      const bob = step % 2 === 0 ? 0 : -2;
      ctx.drawImage(front, step * 64, row * 64 + bob, 64, 64);
    }
  }
  return sheet;
}

// -------------------------------------------------------------- verificación
function sizeOf(file) {
  const buffer = fs.readFileSync(file);
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}
function verify() {
  const errors = [];
  const targets = [
    [path.join(FRONT_DIR, "PIKABLU.png"), FW, FH],
    [path.join(BACK_DIR, "PIKABLU.png"), FW, FH],
    [path.join(ICON_DIR, "PIKABLU.png"), IW, IH],
    [path.join(CHAR_DIR, "PIKABLU.png"), CW, CH],
  ];
  for (const [file, width, height] of targets) {
    if (!fs.existsSync(file)) { errors.push(`falta ${path.relative(GAME, file)}`); continue; }
    const [w, h] = sizeOf(file);
    if (w !== width || h !== height) errors.push(`${path.basename(file)} mide ${w}x${h} y debe medir ${width}x${height}`);
  }
  if (errors.length) throw new Error(`Pikablu inválido (${errors.length}):\n- ${errors.join("\n- ")}`);
  console.log(`Pikablu OK: frente ${FW}x${FH}, reverso, icono ${IW}x${IH} y overworld ${CW}x${CH}.`);
}

if (VERIFY) {
  verify();
} else if (fs.existsSync(CONCEPT)) {
  // Si hay arte conceptual propio, manda el convertidor oficial.
  console.log(`Existe ${path.relative(ROOT, CONCEPT)}: reconstruye los sprites con tools/build_pokegods_sprites.mjs`);
  verify();
} else {
  const frontSource = path.join(FRONT_DIR, `${SOURCE}.png`);
  const backSource = path.join(BACK_DIR, `${SOURCE}.png`);
  const iconSource = path.join(ICON_DIR, `${SOURCE}.png`);
  for (const file of [frontSource, backSource, iconSource]) {
    if (!fs.existsSync(file)) throw new Error(`Falta el sprite base ${path.relative(GAME, file)}`);
  }
  const front = await tinted(frontSource);
  const back = await tinted(backSource);
  const icon = await tinted(iconSource);
  if (front.width !== FW || front.height !== FH) throw new Error(`El frente base no mide ${FW}x${FH}`);
  if (back.width !== FW || back.height !== FH) throw new Error(`El reverso base no mide ${FW}x${FH}`);
  if (icon.width !== IW || icon.height !== IH) throw new Error(`El icono base no mide ${IW}x${IH}`);

  fs.mkdirSync(CHAR_DIR, { recursive: true });
  fs.writeFileSync(path.join(FRONT_DIR, "PIKABLU.png"), front.toBuffer("image/png"));
  fs.writeFileSync(path.join(BACK_DIR, "PIKABLU.png"), back.toBuffer("image/png"));
  fs.writeFileSync(path.join(ICON_DIR, "PIKABLU.png"), icon.toBuffer("image/png"));
  fs.writeFileSync(path.join(CHAR_DIR, "PIKABLU.png"), overworldSheet(front).toBuffer("image/png"));
  console.log(`Pikablu adaptado desde ${SOURCE} (matiz amarillo/marrón -> azul cielo). ` +
    "Si dibujas arte conceptual, el convertidor oficial tendrá prioridad.");
  verify();
}
