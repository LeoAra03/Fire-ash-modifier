#!/usr/bin/env node
/**
 * verify_overworld_battle_coherence.mjs — Fase 67.
 *
 * Verifica que, para cada Pokégod del roster (content/pokegods_originales.json,
 * origen en la ROM GBC FactoryAdventure.gb), el sprite de overworld
 * (Graphics/Characters/<ID>.png) y el sprite de batalla (Graphics/Pokemon/Front
 * y Back/<ID>.png) sean COHERENTES entre sí:
 *   1. Todos los archivos existen y tienen las dimensiones de content/pokegods_assets.json
 *      (Characters 256×256 con celdas 64×64; Front/Back 96×96; Icons 128×64).
 *   2. La paleta del overworld (frame de pie, dirección abajo) y la del frontal de
 *      batalla comparten color: histograma 4×4×4 (bins de 64) con intersección
 *      ≥ UMBRAL_HISTOGRAMA, y color medio de píxeles opacos a ≤ UMBRAL_COLOR_MEDIO.
 *   3. El área opaca del overworld (escalada ×(96/64)²) coincide con la del frontal de
 *      batalla dentro de [RATIO_AREA_MIN, RATIO_AREA_MAX].
 *
 * Solo lee archivos (no modifica assets). Decodifica PNG RGBA/RGB/paleta de 8 bits
 * sin dependencias nuevas (zlib de Node).
 *
 * Uso: node tools/verify_overworld_battle_coherence.mjs [--json]
 * Sale con código 1 si alguna comprobación falla.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = path.resolve(import.meta.dirname, "..");
const UMBRAL_HISTOGRAMA = 0.35;
const UMBRAL_COLOR_MEDIO = 90;
// El overworld es el frontal reducido a 64/96 (celda 64 frente a 96 de batalla):
// el área opaca del overworld, escalada ×(96/64)², debe igualar la del frontal.
const RATIO_AREA_MIN = 0.8;
const RATIO_AREA_MAX = 1.25;

export function decodePNG(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("no es PNG");
  let off = 8, w = 0, h = 0, bitDepth = 0, colorType = 0, interlace = 0;
  let palette = null, trns = null;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("latin1", off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      bitDepth = data[8]; colorType = data[9]; interlace = data[12];
    } else if (type === "PLTE") palette = data;
    else if (type === "tRNS") trns = data;
    else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    off += 12 + len;
  }
  if (bitDepth !== 8 || interlace !== 0) throw new Error(`PNG no soportado (depth ${bitDepth}, interlace ${interlace})`);
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  if (!channels) throw new Error(`color type ${colorType} no soportado`);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * channels;
  const out = Buffer.alloc(stride * h);
  let prev = Buffer.alloc(stride);
  let p = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[p++];
    const line = Buffer.from(raw.subarray(p, p + stride));
    p += stride;
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? line[i - channels] : 0;
      const b = prev[i];
      const c = i >= channels ? prev[i - channels] : 0;
      let v = line[i];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      line[i] = v & 0xff;
    }
    line.copy(out, y * stride);
    prev = line;
  }
  // Normaliza a RGBA
  const rgba = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const s = i * channels, d = i * 4;
    if (colorType === 6) { rgba[d] = out[s]; rgba[d + 1] = out[s + 1]; rgba[d + 2] = out[s + 2]; rgba[d + 3] = out[s + 3]; }
    else if (colorType === 2) { rgba[d] = out[s]; rgba[d + 1] = out[s + 1]; rgba[d + 2] = out[s + 2]; rgba[d + 3] = 255; }
    else if (colorType === 0) { rgba[d] = rgba[d + 1] = rgba[d + 2] = out[s]; rgba[d + 3] = 255; }
    else if (colorType === 4) { rgba[d] = rgba[d + 1] = rgba[d + 2] = out[s]; rgba[d + 3] = out[s + 1]; }
    else if (colorType === 3) {
      const idx = out[s];
      rgba[d] = palette[idx * 3]; rgba[d + 1] = palette[idx * 3 + 1]; rgba[d + 2] = palette[idx * 3 + 2];
      rgba[d + 3] = trns && idx < trns.length ? trns[idx] : 255;
    }
  }
  return { w, h, rgba };
}

/** Recorta un rectángulo de una imagen RGBA. */
export function crop(img, x0, y0, cw, ch) {
  const rgba = new Uint8Array(cw * ch * 4);
  for (let y = 0; y < ch; y++) {
    const src = ((y0 + y) * img.w + x0) * 4;
    rgba.set(img.rgba.subarray(src, src + cw * 4), y * cw * 4);
  }
  return { w: cw, h: ch, rgba };
}

/** Métricas de color de los píxeles opacos (alfa ≥ 128). */
export function colorMetrics(img) {
  const hist = new Float64Array(64);
  let n = 0, sr = 0, sg = 0, sb = 0;
  for (let i = 0; i < img.w * img.h; i++) {
    const d = i * 4;
    if (img.rgba[d + 3] < 128) continue;
    const r = img.rgba[d], g = img.rgba[d + 1], b = img.rgba[d + 2];
    hist[((r >> 6) << 4) | ((g >> 6) << 2) | (b >> 6)]++;
    sr += r; sg += g; sb += b; n++;
  }
  const total = img.w * img.h;
  if (n) for (let k = 0; k < 64; k++) hist[k] /= n;
  return {
    hist,
    cobertura: n / total,
    media: n ? [sr / n, sg / n, sb / n] : [0, 0, 0],
  };
}

export function interseccion(a, b) {
  let s = 0;
  for (let k = 0; k < 64; k++) s += Math.min(a[k], b[k]);
  return s;
}

export function distanciaColorMedio(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function verificarPokegod(entry, dims) {
  const errores = [];
  const a = entry.assets || {};
  const rutas = {
    front: a.front, back: a.back, icono: a.icono, personaje: a.personaje,
  };
  const leer = (rel) => {
    const abs = path.join(ROOT, rel);
    if (!rel || !fs.existsSync(abs)) return null;
    return decodePNG(fs.readFileSync(abs));
  };
  const imgs = {};
  for (const [k, rel] of Object.entries(rutas)) {
    if (!rel) { errores.push(`falta ruta ${k}`); continue; }
    try {
      imgs[k] = leer(rel);
      if (!imgs[k]) errores.push(`no existe ${rel}`);
    } catch (e) {
      errores.push(`${k}: ${e.message}`);
    }
  }
  const dimOk = (k, [w, h]) => imgs[k] && imgs[k].w === w && imgs[k].h === h;
  if (imgs.front && !dimOk("front", dims.front)) errores.push(`front ${imgs.front.w}x${imgs.front.h} ≠ ${dims.front}`);
  if (imgs.back && !dimOk("back", dims.back)) errores.push(`back ${imgs.back.w}x${imgs.back.h} ≠ ${dims.back}`);
  if (imgs.icono && !dimOk("icono", dims.icon)) errores.push(`icono ${imgs.icono.w}x${imgs.icono.h} ≠ ${dims.icon}`);
  if (imgs.personaje && !dimOk("personaje", dims.character)) errores.push(`personaje ${imgs.personaje.w}x${imgs.personaje.h} ≠ ${dims.character}`);

  let histInter = null, colorDist = null, cobOver = null, cobBatalla = null, areaRatio = null;
  if (imgs.personaje && imgs.front) {
    // Frame de pie (celda 0,0 = dirección abajo, 64×64).
    const ow = colorMetrics(crop(imgs.personaje, 0, 0, 64, 64));
    const bt = colorMetrics(imgs.front);
    histInter = interseccion(ow.hist, bt.hist);
    colorDist = distanciaColorMedio(ow.media, bt.media);
    cobOver = ow.cobertura; cobBatalla = bt.cobertura;
    if (histInter < UMBRAL_HISTOGRAMA) errores.push(`paleta divergente (intersección ${histInter.toFixed(2)} < ${UMBRAL_HISTOGRAMA})`);
    if (colorDist > UMBRAL_COLOR_MEDIO) errores.push(`color medio divergente (${colorDist.toFixed(0)} > ${UMBRAL_COLOR_MEDIO})`);
    // Área opaca relativa: (cob_ow · 64²) · (96/64)² frente a (cob_batalla · 96²).
    areaRatio = (cobOver * 64 * 64 * (96 / 64) ** 2) / (cobBatalla * 96 * 96);
    if (!(areaRatio >= RATIO_AREA_MIN && areaRatio <= RATIO_AREA_MAX)) {
      errores.push(`área opaca no coherente (overworld/batalla escalada = ${areaRatio.toFixed(2)}, esperado ${RATIO_AREA_MIN}–${RATIO_AREA_MAX})`);
    }
  }
  return {
    id: entry.id,
    ok: errores.length === 0,
    interseccion: histInter === null ? null : Number(histInter.toFixed(3)),
    distanciaColor: colorDist === null ? null : Number(colorDist.toFixed(1)),
    coberturaOverworld: cobOver === null ? null : Number((cobOver * 100).toFixed(1)),
    coberturaBatalla: cobBatalla === null ? null : Number((cobBatalla * 100).toFixed(1)),
    ratioArea: areaRatio === null ? null : Number(areaRatio.toFixed(2)),
    errores,
  };
}

function main() {
  const json = process.argv.includes("--json");
  const roster = JSON.parse(fs.readFileSync(path.join(ROOT, "content/pokegods_originales.json"), "utf8")).roster;
  const dims = {
    front: [96, 96], back: [96, 96], icon: [128, 64], character: [256, 256],
  };
  const resultados = roster.map((p) => verificarPokegod(p, dims));
  const fallidos = resultados.filter((r) => !r.ok);
  if (json) {
    console.log(JSON.stringify({ total: resultados.length, ok: resultados.length - fallidos.length, resultados }, null, 2));
  } else {
    for (const r of resultados) {
      const met = r.interseccion === null ? "" :
        ` · inter=${r.interseccion} Δcolor=${r.distanciaColor} área ow/batalla=${r.ratioArea}`;
      console.log(`${r.ok ? "✔" : "✘"} ${r.id.padEnd(12)}${met}${r.ok ? "" : "\n    " + r.errores.join("\n    ")}`);
    }
    console.log(`\nCoherencia overworld ↔ batalla: ${resultados.length - fallidos.length}/${resultados.length} Pokégods OK.`);
  }
  process.exit(fallidos.length ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
