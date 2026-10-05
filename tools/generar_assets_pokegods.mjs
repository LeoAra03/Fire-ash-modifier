#!/usr/bin/env node
/**
 * generar_assets_pokegods.mjs — convierte el arte conceptual de los Pokégods
 * en los formatos reales del proyecto Fire Ash.
 *
 *   Graphics/Pokemon/Front/<NOMBRE>.png      96×96   (vista frontal)
 *   Graphics/Pokemon/Back/<NOMBRE>.png       96×96   (vista trasera)
 *   Graphics/Pokemon/Icons/<NOMBRE>.png     128×64   (hoja de 8 iconos 32×32)
 *   Graphics/Characters/<NOMBRE>.png        256×256  (hoja 4×4 de 64×64:
 *                                                    fila 0 abajo, 1 izq.,
 *                                                    2 dcha., 3 arriba)
 *
 * El proceso es 100 % por código: quita el fondo blanco, recorta, reescala con
 * conservación de proporción, reduce la paleta (median cut) y compone las hojas.
 *
 * Uso:
 *   node tools/generar_assets_pokegods.mjs [--src reference/pokegods/concepto]
 *                                          [--juego pokemon_fire_ash]
 *                                          [--colores 48]
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { inflateSync, deflateSync } from 'node:zlib';
import { join, basename } from 'node:path';

/* ───────────────────────────────── PNG ───────────────────────────────── */

const TABLA_CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = TABLA_CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(tipo, datos) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(datos.length);
  const td = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

/** Decodifica un PNG (8 bits, tipos 0/2/3/4/6) a RGBA. */
export function decodificarPNG(ruta) {
  const d = readFileSync(ruta);
  let i = 8;
  const idat = [];
  let w = 0, h = 0, prof = 8, ctype = 6, plte = null, trns = null;
  while (i < d.length) {
    const ln = d.readUInt32BE(i);
    const tipo = d.subarray(i + 4, i + 8).toString('ascii');
    const dat = d.subarray(i + 8, i + 8 + ln);
    if (tipo === 'IHDR') { w = dat.readUInt32BE(0); h = dat.readUInt32BE(4); prof = dat[8]; ctype = dat[9]; }
    else if (tipo === 'IDAT') idat.push(dat);
    else if (tipo === 'PLTE') plte = dat;
    else if (tipo === 'tRNS') trns = dat;
    i += 12 + ln;
  }
  if (![1, 2, 4, 8].includes(prof)) throw new Error(`profundidad de bits no soportada: ${prof}`);
  const raw = inflateSync(Buffer.concat(idat));
  const canales = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ctype];
  const bpp = Math.max(1, Math.floor(canales * prof / 8));   // bytes por píxel (filtro)
  const stride = Math.ceil(w * canales * prof / 8);          // bytes por fila
  const px = Buffer.alloc(h * stride);
  let p = 0;
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[p++];
    const fila = Buffer.from(raw.subarray(p, p + stride));
    p += stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? fila[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      if (f === 1) fila[x] = (fila[x] + a) & 255;
      else if (f === 2) fila[x] = (fila[x] + b) & 255;
      else if (f === 3) fila[x] = (fila[x] + ((a + b) >> 1)) & 255;
      else if (f === 4) {
        const pp = a + b - c;
        const pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c);
        const pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
        fila[x] = (fila[x] + pr) & 255;
      }
    }
    fila.copy(px, y * stride);
    prev = fila;
  }
  const rgba = new Uint8Array(w * h * 4);
  // índice de un píxel para imágenes indexadas / escala de grises de < 8 bits
  const indice = (x, y) => {
    if (prof === 8) return px[y * stride + x * canales];
    const bitPos = y * stride * 8 + x * canales * prof;
    const byte = px[bitPos >> 3];
    const shift = 8 - prof - (bitPos & 7);
    return (byte >> shift) & ((1 << prof) - 1);
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = y * stride + x * bpp;
      const o = (y * w + x) * 4;
      if (ctype === 6) { rgba[o] = px[s]; rgba[o + 1] = px[s + 1]; rgba[o + 2] = px[s + 2]; rgba[o + 3] = px[s + 3]; }
      else if (ctype === 2) { rgba[o] = px[s]; rgba[o + 1] = px[s + 1]; rgba[o + 2] = px[s + 2]; rgba[o + 3] = 255; }
      else if (ctype === 0) {
        const v = prof === 8 ? px[s] : Math.round(indice(x, y) * 255 / ((1 << prof) - 1));
        rgba[o] = rgba[o + 1] = rgba[o + 2] = v; rgba[o + 3] = 255;
      }
      else if (ctype === 4) { rgba[o] = rgba[o + 1] = rgba[o + 2] = px[s]; rgba[o + 3] = px[s + 1]; }
      else if (ctype === 3) {
        const idx = indice(x, y);
        rgba[o] = plte[idx * 3]; rgba[o + 1] = plte[idx * 3 + 1]; rgba[o + 2] = plte[idx * 3 + 2];
        rgba[o + 3] = trns && idx < trns.length ? trns[idx] : 255;
      }
    }
  }
  return { w, h, rgba };
}

/** Escribe un PNG RGBA de 8 bits. */
export function escribirPNG(ruta, w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  let p = 0;
  for (let y = 0; y < h; y++) {
    raw[p++] = 0;
    for (let x = 0; x < w * 4; x++) raw[p++] = rgba[y * w * 4 + x];
  }
  mkdirSync(ruta.substring(0, ruta.lastIndexOf('/')), { recursive: true });
  writeFileSync(ruta, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]));
}

/* ────────────────────────────── procesado ────────────────────────────── */

/** Quita el fondo blanco por inundación desde los bordes. */
export function quitarFondo(img, umbral = 232) {
  const { w, h, rgba } = img;
  const alpha = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) alpha[i] = rgba[i * 4 + 3] > 8 ? 1 : 0;
  const esBlanco = (i) => {
    const o = i * 4;
    return alpha[i] === 1 && rgba[o] >= umbral && rgba[o + 1] >= umbral && rgba[o + 2] >= umbral;
  };
  const cola = [];
  for (let x = 0; x < w; x++) { if (esBlanco(x)) cola.push(x); if (esBlanco((h - 1) * w + x)) cola.push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { if (esBlanco(y * w)) cola.push(y * w); if (esBlanco(y * w + w - 1)) cola.push(y * w + w - 1); }
  while (cola.length) {
    const i = cola.pop();
    if (!esBlanco(i)) continue;
    alpha[i] = 0;
    const x = i % w, y = (i - x) / w;
    if (x > 0) cola.push(i - 1);
    if (x < w - 1) cola.push(i + 1);
    if (y > 0) cola.push(i - w);
    if (y < h - 1) cola.push(i + w);
  }
  // bordes suaves: los píxeles casi blancos pegados al fondo se atenúan
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (alpha[i] !== 1) continue;
      const o = i * 4;
      const min = Math.min(rgba[o], rgba[o + 1], rgba[o + 2]);
      if (min < 200) continue;
      let vecinoFondo = false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        if (alpha[ny * w + nx] === 0) { vecinoFondo = true; break; }
      }
      if (vecinoFondo) alpha[i] = Math.max(0, Math.min(1, (255 - min) / 48));
    }
  }
  const salida = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    salida[i * 4] = rgba[i * 4];
    salida[i * 4 + 1] = rgba[i * 4 + 1];
    salida[i * 4 + 2] = rgba[i * 4 + 2];
    salida[i * 4 + 3] = Math.round(alpha[i] * (rgba[i * 4 + 3] / 255) * 255);
  }
  return { w, h, rgba: salida };
}

/** Caja envolvente de los píxeles opacos. */
function recortar(img) {
  const { w, h, rgba } = img;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (rgba[(y * w + x) * 4 + 3] > 12) {
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return img;
  const nw = x1 - x0 + 1, nh = y1 - y0 + 1;
  const out = new Uint8Array(nw * nh * 4);
  for (let y = 0; y < nh; y++) {
    for (let x = 0; x < nw; x++) {
      const s = ((y + y0) * w + (x + x0)) * 4, d = (y * nw + x) * 4;
      out[d] = rgba[s]; out[d + 1] = rgba[s + 1]; out[d + 2] = rgba[s + 2]; out[d + 3] = rgba[s + 3];
    }
  }
  return { w: nw, h: nh, rgba: out };
}

/** Reescalado bilineal con alfa. */
export function escalar(img, nw, nh) {
  const { w, h, rgba } = img;
  const out = new Uint8Array(nw * nh * 4);
  for (let y = 0; y < nh; y++) {
    const sy = (y + 0.5) * h / nh - 0.5;
    const y0 = Math.max(0, Math.floor(sy)), y1 = Math.min(h - 1, y0 + 1);
    const fy = sy - y0;
    for (let x = 0; x < nw; x++) {
      const sx = (x + 0.5) * w / nw - 0.5;
      const x0 = Math.max(0, Math.floor(sx)), x1 = Math.min(w - 1, x0 + 1);
      const fx = sx - x0;
      const i00 = (y0 * w + x0) * 4, i10 = (y0 * w + x1) * 4;
      const i01 = (y1 * w + x0) * 4, i11 = (y1 * w + x1) * 4;
      const d = (y * nw + x) * 4;
      for (let c = 0; c < 4; c++) {
        const a = rgba[i00 + c] * (1 - fx) + rgba[i10 + c] * fx;
        const b = rgba[i01 + c] * (1 - fx) + rgba[i11 + c] * fx;
        out[d + c] = Math.round(a * (1 - fy) + b * fy);
      }
    }
  }
  return { w: nw, h: nh, rgba: out };
}

/** Reduce la paleta con median cut (sólo píxeles opacos). */
export function reducirPaleta(img, n = 48) {
  const { w, h, rgba } = img;
  const puntos = [];
  for (let i = 0; i < w * h; i++) {
    if (rgba[i * 4 + 3] > 8) puntos.push([rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2], i]);
  }
  if (puntos.length < n) return img;
  let cajas = [puntos];
  while (cajas.length < n) {
    let bi = -1, mejor = -1;
    for (let k = 0; k < cajas.length; k++) {
      if (cajas[k].length < 2) continue;
      const cj = cajas[k];
      const mn = [255, 255, 255], mx = [0, 0, 0];
      for (const p of cj) for (let c = 0; c < 3; c++) { if (p[c] < mn[c]) mn[c] = p[c]; if (p[c] > mx[c]) mx[c] = p[c]; }
      const rango = Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]);
      if (rango > mejor) { mejor = rango; bi = k; }
    }
    if (bi < 0 || mejor <= 0) break;
    const cj = cajas[bi];
    const mn = [255, 255, 255], mx = [0, 0, 0];
    for (const p of cj) for (let c = 0; c < 3; c++) { if (p[c] < mn[c]) mn[c] = p[c]; if (p[c] > mx[c]) mx[c] = p[c]; }
    let ch = 0, m = -1;
    for (let c = 0; c < 3; c++) { const d = mx[c] - mn[c]; if (d > m) { m = d; ch = c; } }
    cj.sort((a, b) => a[ch] - b[ch]);
    const mitad = cj.length >> 1;
    cajas.splice(bi, 1, cj.slice(0, mitad), cj.slice(mitad));
  }
  const salida = new Uint8Array(rgba);
  for (const cj of cajas) {
    if (!cj.length) continue;
    let r = 0, g = 0, b = 0;
    for (const p of cj) { r += p[0]; g += p[1]; b += p[2]; }
    r = Math.round(r / cj.length); g = Math.round(g / cj.length); b = Math.round(b / cj.length);
    for (const p of cj) { const o = p[3] * 4; salida[o] = r; salida[o + 1] = g; salida[o + 2] = b; }
  }
  return { w, h, rgba: salida };
}

/** Coloca la imagen centrada en un lienzo cuadrado, conservando proporción. */
export function encajarEn(img, lado) {
  const esc = Math.min(lado / img.w, lado / img.h);
  const red = escalar(img, Math.max(1, Math.round(img.w * esc)), Math.max(1, Math.round(img.h * esc)));
  const lienzo = new Uint8Array(lado * lado * 4);
  const ox = Math.floor((lado - red.w) / 2), oy = Math.floor((lado - red.h) / 2);
  for (let y = 0; y < red.h; y++) {
    for (let x = 0; x < red.w; x++) {
      const s = (y * red.w + x) * 4, d = ((y + oy) * lado + (x + ox)) * 4;
      lienzo[d] = red.rgba[s]; lienzo[d + 1] = red.rgba[s + 1];
      lienzo[d + 2] = red.rgba[s + 2]; lienzo[d + 3] = red.rgba[s + 3];
    }
  }
  return { w: lado, h: lado, rgba: lienzo };
}

function espejar(img) {
  const { w, h, rgba } = img;
  const out = new Uint8Array(rgba.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = (y * w + x) * 4, d = (y * w + (w - 1 - x)) * 4;
      out[d] = rgba[s]; out[d + 1] = rgba[s + 1]; out[d + 2] = rgba[s + 2]; out[d + 3] = rgba[s + 3];
    }
  }
  return { w, h, rgba: out };
}

function pegar(lienzo, lado, img, celdaX, celdaY, tamCelda) {
  const enc = encajarEn(img, tamCelda);
  for (let y = 0; y < enc.h; y++) {
    for (let x = 0; x < enc.w; x++) {
      const s = (y * enc.w + x) * 4;
      const d = ((celdaY * tamCelda + y) * lado + celdaX * tamCelda + x) * 4;
      lienzo[d] = enc.rgba[s]; lienzo[d + 1] = enc.rgba[s + 1];
      lienzo[d + 2] = enc.rgba[s + 2]; lienzo[d + 3] = enc.rgba[s + 3];
    }
  }
}

/** Prepara el arte: quita el fondo y recorta (la paleta se reduce al final,
 *  ya reescalado, para que la interpolación no vuelva a crear colores). */
export function preparar(ruta) {
  let img = decodificarPNG(ruta);
  img = quitarFondo(img);
  img = recortar(img);
  return img;
}

/* ──────────────────────────────── programa ───────────────────────────── */

function main() {
  const args = process.argv.slice(2);
  const get = (k, def) => (args.includes(k) ? args[args.indexOf(k) + 1] : def);
  const src = get('--src', 'reference/pokegods/concepto');
  const juego = get('--juego', 'pokemon_fire_ash');
  const colores = parseInt(get('--colores', '48'), 10);

  if (!existsSync(src)) { console.error(`No existe ${src}`); process.exit(1); }
  const frentes = readdirSync(src).filter((f) => /\.png$/i.test(f) && !/_back\.png$/i.test(f));
  if (!frentes.length) { console.error(`No hay arte en ${src}`); process.exit(1); }

  const gFront = join(juego, 'Graphics/Pokemon/Front');
  const gBack = join(juego, 'Graphics/Pokemon/Back');
  const gIcons = join(juego, 'Graphics/Pokemon/Icons');
  const gChars = join(juego, 'Graphics/Characters');
  for (const d of [gFront, gBack, gIcons, gChars]) mkdirSync(d, { recursive: true });

  const manifesto = [];
  for (const f of frentes.sort()) {
    const nombre = basename(f, '.png').replace(/_front$/i, '').toUpperCase();
    const frente = preparar(join(src, f));
    const rutaBack = join(src, `${nombre}_back.png`);
    const detras = existsSync(rutaBack) ? preparar(rutaBack) : frente;

    const f96 = reducirPaleta(encajarEn(frente, 96), colores);
    const b96 = reducirPaleta(encajarEn(detras, 96), colores);
    escribirPNG(join(gFront, `${nombre}.png`), 96, 96, f96.rgba);
    escribirPNG(join(gBack, `${nombre}.png`), 96, 96, b96.rgba);

    // hoja de iconos: 4×2 celdas de 32×32
    const iconos = new Uint8Array(128 * 64 * 4);
    for (let cy = 0; cy < 2; cy++) for (let cx = 0; cx < 4; cx++) pegar(iconos, 128, frente, cx, cy, 32);
    escribirPNG(join(gIcons, `${nombre}.png`), 128, 64, reducirPaleta({ w: 128, h: 64, rgba: iconos }, Math.round(colores / 2)).rgba);

    // hoja de personaje: 4×4 celdas de 64×64 (abajo / izq / dcha / arriba)
    const chars = new Uint8Array(256 * 256 * 4);
    for (let f2 = 0; f2 < 4; f2++) {
      pegar(chars, 256, frente, f2, 0, 64);          // abajo
      pegar(chars, 256, frente, f2, 1, 64);          // izquierda
      pegar(chars, 256, espejar(frente), f2, 2, 64); // derecha
      pegar(chars, 256, detras, f2, 3, 64);          // arriba
    }
    escribirPNG(join(gChars, `${nombre}.png`), 256, 256, reducirPaleta({ w: 256, h: 256, rgba: chars }, colores).rgba);

    manifesto.push({
      nombre,
      frontal: `Graphics/Pokemon/Front/${nombre}.png`,
      trasero: `Graphics/Pokemon/Back/${nombre}.png`,
      icono: `Graphics/Pokemon/Icons/${nombre}.png`,
      personaje: `Graphics/Characters/${nombre}.png`,
      vista_trasera_propia: existsSync(rutaBack),
      colores_paleta: colores,
    });
    console.log(`  ✔ ${nombre.padEnd(12)} Front 96×96 · Back 96×96 · Icons 128×64 · Characters 256×256${existsSync(rutaBack) ? '' : '  (trasera desde el frontal)'}`);
  }

  mkdirSync('content', { recursive: true });
  writeFileSync('content/pokegods_assets.json', JSON.stringify({
    generado: new Date().toISOString(),
    origen: src,
    destino: juego,
    formatos: { Front: '96x96', Back: '96x96', Icons: '128x64 (8 celdas 32x32)', Characters: '256x256 (4x4 celdas 64x64: abajo/izq/dcha/arriba)' },
    pokegods: manifesto,
  }, null, 2));
  console.log(`\n✔ ${manifesto.length} Pokégods convertidos · manifiesto: content/pokegods_assets.json`);
}

if (process.argv[1] && process.argv[1].endsWith('generar_assets_pokegods.mjs')) main();
