// ============================================================================
// sprite_fx.mjs — utilidades de píxeles para variantes de sprite
// ----------------------------------------------------------------------------
// Recolor por rotación de matiz sobre PNG con alfa (sprites de personaje y de
// Pokémon). Usa @napi-rs/canvas, la misma dependencia del resto de tools.
// ============================================================================

import fs from "node:fs";
import { createCanvas, loadImage } from "@napi-rs/canvas";

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
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hueToRgb(p, q, h + 1 / 3) * 255),
    Math.round(hueToRgb(p, q, h) * 255),
    Math.round(hueToRgb(p, q, h - 1 / 3) * 255),
  ];
}

/**
 * Rota el matiz de un PNG conservando alfa y luminancia relativa.
 * Devuelve el buffer PNG resultante. `degrees` en grados (0..360).
 */
export async function recolorPng(sourcePath, degrees, { saturation = 1.08 } = {}) {
  const image = await loadImage(sourcePath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const img = ctx.getImageData(0, 0, image.width, image.height);
  const d = img.data;
  const shift = ((degrees % 360) + 360) % 360 / 360;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 8) continue;
    const [h, s, l] = rgbToHsl(d[i], d[i + 1], d[i + 2]);
    if (s < 0.04) continue; // grises/neutros se conservan
    const [r, g, b] = hslToRgb((h + shift) % 1, Math.min(1, s * saturation), l);
    d[i] = r; d[i + 1] = g; d[i + 2] = b;
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toBuffer("image/png");
}

/** Copia un recorte redimensionado (nearest) de un PNG: para mini-variantes. */
export async function pngSizeOf(file) {
  const b = fs.readFileSync(file);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}
