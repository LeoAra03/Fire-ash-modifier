#!/usr/bin/env node
/** Reconstruye solo la hoja de overworld de ELECTRAMEW desde su arte de batalla. */
import fs from "node:fs";
import path from "node:path";
import { decodificarPNG, encajarEn, escribirPNG } from "../generar_assets_pokegods.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const GAME = path.join(ROOT, "pokemon_fire_ash");
const front = decodificarPNG(path.join(GAME, "Graphics/Pokemon/Front/ELECTRAMEW.png"));
const back = decodificarPNG(path.join(GAME, "Graphics/Pokemon/Back/ELECTRAMEW.png"));
const f = encajarEn(front, 64);
const b = encajarEn(back, 64);
const mirror = new Uint8Array(f.rgba.length);
for (let y = 0; y < 64; y += 1) for (let x = 0; x < 64; x += 1) {
  const src = (y * 64 + x) * 4;
  const dst = (y * 64 + (63 - x)) * 4;
  mirror.set(f.rgba.slice(src, src + 4), dst);
}
const sheet = new Uint8Array(256 * 256 * 4);
const paste = (cell, cx, cy) => {
  for (let y = 0; y < 64; y += 1) for (let x = 0; x < 64; x += 1) {
    const src = (y * 64 + x) * 4;
    const dst = ((cy * 64 + y) * 256 + cx * 64 + x) * 4;
    sheet.set(cell.slice(src, src + 4), dst);
  }
};
for (let frame = 0; frame < 4; frame += 1) {
  paste(f.rgba, frame, 0);
  paste(f.rgba, frame, 1);
  paste(mirror, frame, 2);
  paste(b.rgba, frame, 3);
}
const output = path.join(GAME, "Graphics/Characters/ELECTRAMEW.png");
if (process.argv.includes("--verify")) {
  const image = decodificarPNG(output);
  if (image.w !== 256 || image.h !== 256) throw new Error("ELECTRAMEW no es una hoja 256×256");
  console.log("OK: ELECTRAMEW Character 256×256 derivado de front/back existentes.");
} else {
  escribirPNG(output, 256, 256, sheet);
  console.log("OK: hoja de ELECTRAMEW reconstruida desde front/back; no se creó arte externo.");
}
