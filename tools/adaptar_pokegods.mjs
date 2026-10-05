#!/usr/bin/env node
/**
 * adaptar_pokegods.mjs — crea los assets de un Pokégod derivándolos por código
 * de los de un Pokémon base ya presente en el juego (recolorización en HSL
 * conservando luminancia y alfa, como una variante regional).
 *
 * Se usa cuando el generador de arte no está disponible o rechaza el motivo:
 * la regla del proyecto es «si falta un asset, créalo, búscalo o adáptalo»,
 * y aquí la adaptación es explícita y trazable (consta en el manifiesto).
 *
 * Uso:
 *   node tools/adaptar_pokegods.mjs --base PIKACHU --nombre PIKAMARS --tono 8
 *   node tools/adaptar_pokegods.mjs --hoja            (compone la hoja de contacto)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { decodificarPNG, escribirPNG } from './generar_assets_pokegods.mjs';

function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  let h = 0, s = 0;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}

function hsl2rgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/**
 * Recoloriza conservando la luminancia (para no perder el volumen del sprite)
 * y el alfa. `variacion` deja un poco de juego de tono según la luz.
 */
export function recolorear(img, tono, variacion = 14) {
  const { w, h, rgba } = img;
  const salida = new Uint8Array(rgba.length);
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    salida[o + 3] = rgba[o + 3];
    if (rgba[o + 3] < 8) continue;
    const [hh, s, l] = rgb2hsl(rgba[o], rgba[o + 1], rgba[o + 2]);
    const nuevo = tono + (l - 0.5) * variacion * 2 + (s < 0.15 ? 0 : 0);
    const [r, g, b] = hsl2rgb(nuevo, Math.min(1, s * 1.05 + 0.05), l);
    salida[o] = r; salida[o + 1] = g; salida[o + 2] = b;
  }
  return { w, h, rgba: salida };
}

const RUTAS = {
  front: 'pokemon_fire_ash/Graphics/Pokemon/Front',
  back: 'pokemon_fire_ash/Graphics/Pokemon/Back',
  icons: 'pokemon_fire_ash/Graphics/Pokemon/Icons',
  characters: 'pokemon_fire_ash/Graphics/Characters',
};

function derivar(base, nombre, tono) {
  const hechos = [];
  for (const [clave, dir] of Object.entries(RUTAS)) {
    const origen = join(dir, `${base}.png`);
    if (!existsSync(origen)) { console.log(`  · ${clave}: ${base} no existe, se omite`); continue; }
    const img = recolorear(decodificarPNG(origen), tono);
    mkdirSync(dir, { recursive: true });
    escribirPNG(join(dir, `${nombre}.png`), img.w, img.h, img.rgba);
    hechos.push(clave);
  }
  // si el Pokémon base no tiene hoja de personaje, la componemos del frontal
  if (!hechos.includes('characters') && existsSync(join(RUTAS.front, `${nombre}.png`))) {
    const frente = decodificarPNG(join(RUTAS.front, `${nombre}.png`));
    const lado = 256, celda = 64;
    const hoja = new Uint8Array(lado * lado * 4);
    for (let y = 0; y < lado; y++) {
      for (let x = 0; x < lado; x++) {
        const cx = x % celda, cy = y % celda;
        const sx = Math.floor(cx * frente.w / celda), sy = Math.floor(cy * frente.h / celda);
        const s = (sy * frente.w + sx) * 4, d = (y * lado + x) * 4;
        hoja[d] = frente.rgba[s]; hoja[d + 1] = frente.rgba[s + 1];
        hoja[d + 2] = frente.rgba[s + 2]; hoja[d + 3] = frente.rgba[s + 3];
      }
    }
    escribirPNG(join(RUTAS.characters, `${nombre}.png`), lado, lado, hoja);
    hechos.push('characters(desde frontal)');
  }
  console.log(`  ✔ ${nombre} ← ${base} (tono ${tono}°): ${hechos.join(', ')}`);
  return hechos;
}

/** Compone una hoja de contacto con todos los frentes del roster. */
function hoja(salida = 'reference/pokegods/hoja_pokegods.png') {
  const roster = JSON.parse(readFileSync('content/pokegods_originales.json', 'utf8')).roster
    .filter((p) => existsSync(join(RUTAS.front, `${p.id}.png`)));
  const COLS = 5, LADO = 96;
  const filas = Math.ceil(roster.length / COLS);
  const w = COLS * LADO, h = filas * LADO;
  const lienzo = new Uint8Array(w * h * 4);
  // fondo: cuadrícula suave
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      const c = ((Math.floor(x / LADO) + Math.floor(y / LADO)) % 2) ? 244 : 232;
      lienzo[o] = c; lienzo[o + 1] = c; lienzo[o + 2] = c; lienzo[o + 3] = 255;
    }
  }
  roster.forEach((p, k) => {
    const img = decodificarPNG(join(RUTAS.front, `${p.id}.png`));
    const cx = (k % COLS) * LADO, cy = Math.floor(k / COLS) * LADO;
    for (let y = 0; y < Math.min(img.h, LADO); y++) {
      for (let x = 0; x < Math.min(img.w, LADO); x++) {
        const s = (y * img.w + x) * 4, d = ((cy + y) * w + cx + x) * 4;
        if (img.rgba[s + 3] < 8) continue;
        lienzo[d] = img.rgba[s]; lienzo[d + 1] = img.rgba[s + 1];
        lienzo[d + 2] = img.rgba[s + 2]; lienzo[d + 3] = 255;
      }
    }
  });
  mkdirSync(salida.substring(0, salida.lastIndexOf('/')), { recursive: true });
  escribirPNG(salida, w, h, lienzo);
  console.log(`✔ Hoja de contacto: ${salida} (${w}×${h}, ${roster.length} Pokégods)`);
  return roster.map((p) => p.id);
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--hoja')) { hoja(args.includes('--salida') ? args[args.indexOf('--salida') + 1] : undefined); return; }
  const get = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
  const base = get('--base'), nombre = get('--nombre'), tono = parseFloat(get('--tono') ?? '0');
  if (!base || !nombre) {
    console.error('Uso: node tools/adaptar_pokegods.mjs --base PIKACHU --nombre PIKAMARS --tono 8');
    process.exit(1);
  }
  derivar(base.toUpperCase(), nombre.toUpperCase(), tono);
}

if (process.argv[1] && process.argv[1].endsWith('adaptar_pokegods.mjs')) main();
