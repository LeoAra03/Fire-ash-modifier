#!/usr/bin/env node
/**
 * Dimensional Nightmare — arte de prioridad ALTA (doc 08) + cableado en el juego.
 *
 * Toma los originales de `reference/dimensional_nightmare/art_src/` (arte propio, NO derivado de
 * los mosaicos: por eso sí puede empaquetarse), les quita el fondo magenta, los recorta, los
 * reduce por media de área al tamaño final, los cuantiza a ≤32 colores y los escribe en
 * `pokemon_fire_ash/Graphics/` con vecino más cercano (pixel art nítido).
 *
 * Después cablea el arte:
 *   - tipo de entrenador `DN_KINGGUS` (clon de GENTLEMAN) → el jefe de EP06 se ve como KINGGUS;
 *   - registro del entrenador `DN_EP06_A` → pasa a tipo DN_KINGGUS (clave + @trainer_type);
 *   - evento `EV_EP06_JEFE` (Map2135) → secuencia registrada `dn_kinggus_final_sequence` (forma intermedia + final);
 *   - `NPC_KINGGUS` (Map2135) → gráfico de personaje `DN_KINGGUS`;
 *   - `EV_EP01_JEFE` (Map2056) → gráfico de personaje `DN_WHITE_HAND`.
 * El catálogo `content/dimensional_nightmare_events.json` se actualiza igual, para que regenerar
 * eventos/trainers con las herramientas dn reproduzca el mismo resultado.
 *
 * Uso:
 *   node tools/dn_install_art.mjs            # procesa, escribe y cablea
 *   node tools/dn_install_art.mjs --verify   # sólo comprueba (no escribe)
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { marshalLoad, marshalDump, RObject, RString, RSymbol } from "../web/js/marshal.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GAME = path.join(ROOT, "pokemon_fire_ash");
const SRC = path.join(ROOT, "reference", "dimensional_nightmare", "art_src");
const MANIFEST = path.join(ROOT, "content", "dimensional_nightmare_art.json");
const CATALOG = path.join(ROOT, "content", "dimensional_nightmare_events.json");
const BACKUP = path.join(GAME, "PokeModBackups", "dimensional_nightmare_art_originals");
const DATA = path.join(GAME, "Data");
const VERIFY = process.argv.includes("--verify");

const S = (v) => RString.fromText(String(v));
const sha1 = (buf) => crypto.createHash("sha1").update(buf).digest("hex").slice(0, 12);
const readData = (f) => marshalLoad(fs.readFileSync(path.join(DATA, f)));
const txt = (v) => (v && v.text !== undefined ? v.text : v && v.name !== undefined ? v.name : String(v));

// ------------------------------------------------------------------ especificaciones
/** Cada salida: fuente, destino, tamaño final (px) y alineación del recorte. */
const SPECS = [
  { id: "kinggus_front", src: "kinggus_form1.png", out: "Graphics/Pokemon/Front/DN_KINGGUS.png", w: 64, h: 64, align: "bottom", use: "battler forma 1 (soporte arte)" },
  { id: "kinggus_final", src: "kinggus_final.png", out: "Graphics/Pokemon/Front/DN_KINGGUS_FINAL.png", w: 64, h: 64, align: "bottom", use: "battler forma final" },
  { id: "kinggus_trainer", src: "kinggus_form1.png", out: "Graphics/Trainers/DN_KINGGUS.png", w: 128, h: 128, align: "bottom", use: "sprite de entrenador del jefe EP06" },
  { id: "kinggus_over", src: "kinggus_over.png", out: "Graphics/Characters/DN_KINGGUS.png", w: 128, h: 128, cell: 32, align: "bottom", use: "overworld (hoja 4×4 de 32 px)" },
  { id: "white_hand_over", src: "white_hand.png", out: "Graphics/Characters/DN_WHITE_HAND.png", w: 384, h: 384, cell: 96, align: "bottom", use: "altar de la Mano Blanca (hoja 4×4 de 96 px)" },
  { id: "white_hand_pic", src: "white_hand.png", out: "Graphics/Pictures/DN_WHITE_HAND.png", w: 96, h: 96, align: "center", use: "escena (pantalla/altar)" },
  { id: "unown_fragment", src: "unown_fragment.png", out: "Graphics/Items/DN_UNOWN_FRAGMENT.png", w: 48, h: 48, align: "center", use: "icono de objeto" },
];

const MAGENTA = (r, g, b) => r > 170 && b > 170 && g < 110;
const PALETTE_MAX = 32;

// ------------------------------------------------------------------ utilidades de imagen
async function loadKeyed(file) {
  const img = await loadImage(path.join(SRC, file));
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, img.width, img.height);
  for (let i = 0; i < data.length; i += 4) {
    data[i + 3] = MAGENTA(data[i], data[i + 1], data[i + 2]) ? 0 : 255;
  }
  return { px: data, w: img.width, h: img.height };
}

function contentBox({ px, w, h }) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (px[(y * w + x) * 4 + 3] === 0) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) throw new Error("imagen sin contenido tras quitar el fondo");
  return { x0, y0, x1, y1 };
}

/** Reduce por media de área (box filter) y cuantiza. Devuelve {px,w,h} del recorte final. */
function resampleToCell(src, box, cellW, cellH, align) {
  const bw = box.x1 - box.x0 + 1;
  const bh = box.y1 - box.y0 + 1;
  const scale = Math.min(cellW / bw, cellH / bh);
  const cw = Math.max(1, Math.min(cellW, Math.round(bw * scale)));
  const ch = Math.max(1, Math.min(cellH, Math.round(bh * scale)));
  const ox = Math.floor((cellW - cw) / 2);
  const oy = align === "bottom" ? cellH - ch : Math.floor((cellH - ch) / 2);
  const out = new Uint8ClampedArray(cellW * cellH * 4);
  for (let y = 0; y < ch; y++) {
    const sy0 = box.y0 + Math.floor((y * bh) / ch);
    const sy1 = Math.max(sy0 + 1, box.y0 + Math.floor(((y + 1) * bh) / ch));
    for (let x = 0; x < cw; x++) {
      const sx0 = box.x0 + Math.floor((x * bw) / cw);
      const sx1 = Math.max(sx0 + 1, box.x0 + Math.floor(((x + 1) * bw) / cw));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) {
          const i = (sy * src.w + sx) * 4;
          const al = src.px[i + 3] / 255;
          const w = al; // media ponderada por alfa (fondo transparente no ensucia)
          r += src.px[i] * w; g += src.px[i + 1] * w; b += src.px[i + 2] * w;
          a += src.px[i + 3];
          n += 255;
        }
      }
      const i = ((y + oy) * cellW + (x + ox)) * 4;
      const alpha = a / n;
      if (alpha >= 0.5) {
        const sum = (r + g + b) / 255 || 1;
        out[i] = r / sum; out[i + 1] = g / sum; out[i + 2] = b / sum; out[i + 3] = 255;
      }
    }
  }
  return { px: out, w: cellW, h: cellH };
}

/** Median-cut compacto → paleta de ≤max colores; luego mapea cada píxel al color más cercano. */
function quantize(cell, max = PALETTE_MAX) {
  const buckets = [];
  const all = [];
  for (let i = 0; i < cell.px.length; i += 4) {
    if (cell.px[i + 3] > 0) all.push([cell.px[i], cell.px[i + 1], cell.px[i + 2]]);
  }
  if (!all.length) return cell;
  buckets.push(all);
  while (buckets.length < max) {
    let best = -1, bestRange = -1, bestCh = 0;
    buckets.forEach((b, idx) => {
      if (b.length < 2) return;
      for (let ch = 0; ch < 3; ch++) {
        const vals = b.map((p) => p[ch]);
        const range = Math.max(...vals) - Math.min(...vals);
        if (range > bestRange) { bestRange = range; best = idx; bestCh = ch; }
      }
    });
    if (best < 0 || bestRange < 4) break;
    const b = buckets[best];
    b.sort((p, q) => p[bestCh] - q[bestCh]);
    const mid = Math.floor(b.length / 2);
    buckets.splice(best, 1, b.slice(0, mid), b.slice(mid));
  }
  const palette = buckets.filter((b) => b.length).map((b) => {
    const n = b.length;
    return [Math.round(b.reduce((s, p) => s + p[0], 0) / n), Math.round(b.reduce((s, p) => s + p[1], 0) / n), Math.round(b.reduce((s, p) => s + p[2], 0) / n)];
  });
  const nearest = (r, g, b) => {
    let best = 0, bestD = Infinity;
    palette.forEach(([pr, pg, pb], i) => {
      const d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
      if (d < bestD) { bestD = d; best = i; }
    });
    return palette[best];
  };
  const out = new Uint8ClampedArray(cell.px);
  for (let i = 0; i < out.length; i += 4) {
    if (out[i + 3] === 0) { out[i + 3] = 0; continue; }
    const [r, g, b] = nearest(out[i], out[i + 1], out[i + 2]);
    out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = 255;
  }
  return { px: out, w: cell.w, h: cell.h };
}

function toCanvas(cell) {
  const canvas = createCanvas(cell.w, cell.h);
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(cell.w, cell.h);
  img.data.set(cell.px);
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** Hoja 4×4 (RMXP): filas abajo/izq/der/arriba; columnas 0‑3 = reposo, paso, reposo, paso. */
function buildSheet(cell, cellSize) {
  const sheet = { px: new Uint8ClampedArray(cellSize * 4 * cellSize * 4 * 4), w: cellSize * 4, h: cellSize * 4 };
  const blit = (src, dx, dy, mirror, shiftY) => {
    for (let y = 0; y < cellSize; y++) {
      for (let x = 0; x < cellSize; x++) {
        const s = (y * cellSize + x) * 4;
        if (src.px[s + 3] === 0) continue;
        const tx = mirror ? dx + (cellSize - 1 - x) : dx + x;
        const ty = dy + y + shiftY;
        if (tx < 0 || ty < 0 || tx >= sheet.w || ty >= sheet.h) continue;
        const d = (ty * sheet.w + tx) * 4;
        sheet.px[d] = src.px[s]; sheet.px[d + 1] = src.px[s + 1]; sheet.px[d + 2] = src.px[s + 2]; sheet.px[d + 3] = 255;
      }
    }
  };
  for (let dir = 0; dir < 4; dir++) {
    const mirror = dir === 1;
    for (let f = 0; f < 4; f++) {
      const shiftY = f % 2 === 1 ? 1 : 0;
      blit(cell, f * cellSize, dir * cellSize, mirror, shiftY);
    }
  }
  return sheet;
}

function countColors(cell) {
  const seen = new Set();
  for (let i = 0; i < cell.px.length; i += 4) if (cell.px[i + 3] > 0) seen.add(`${cell.px[i]},${cell.px[i + 1]},${cell.px[i + 2]}`);
  return seen.size;
}

function hasTransparency(cell) {
  for (let i = 3; i < cell.px.length; i += 4) if (cell.px[i] === 0) return true;
  return false;
}

// ------------------------------------------------------------------ construcción de assets
async function buildAssets() {
  const cache = new Map();
  const results = [];
  for (const spec of SPECS) {
    if (!cache.has(spec.src)) cache.set(spec.src, await loadKeyed(spec.src));
    const src = cache.get(spec.src);
    const box = contentBox(src);
    const cellW = spec.cell ?? spec.w;
    const cellH = spec.cell ?? spec.h;
    const cell = quantize(resampleToCell(src, box, cellW, cellH, spec.align));
    const final = spec.cell ? buildSheet(cell, spec.cell) : cell;
    const canvas = toCanvas(final);
    const png = canvas.toBuffer("image/png");
    const abs = path.join(GAME, spec.out);
    results.push({
      id: spec.id, out: spec.out, use: spec.use, source: spec.src,
      sourceSha1: sha1(fs.readFileSync(path.join(SRC, spec.src))), sha1: sha1(png),
      w: final.w, h: final.h, colors: countColors(cell), transparent: hasTransparency(cell),
      bytes: png.length, png, abs,
    });
  }
  return results;
}

// ------------------------------------------------------------------ cableado
function backup(file) {
  fs.mkdirSync(BACKUP, { recursive: true });
  const dest = path.join(BACKUP, file);
  if (!fs.existsSync(dest)) fs.copyFileSync(path.join(DATA, file), dest);
}

function installTrainerType() {
  backup("trainer_types.dat");
  const tt = readData("trainer_types.dat");
  if (tt.pairs.some(([k]) => txt(k) === "DN_KINGGUS")) return { added: false };
  const [, base] = tt.pairs.find(([k]) => txt(k) === "GENTLEMAN") ?? [];
  if (!base) throw new Error("no existe GENTLEMAN en trainer_types.dat");
  const clone = new RObject(base.className, base.ivars.map(([k, v]) => [k, v]));
  const numbers = tt.pairs.map(([, v]) => v.getIvar("@id_number")).filter((n) => typeof n === "number");
  clone.setIvar("@id", new RSymbol("DN_KINGGUS"));
  clone.setIvar("@id_number", Math.max(-1, ...numbers) + 1);
  clone.setIvar("@real_name", S("KINGGUS"));
  clone.setIvar("@base_money", 200);
  tt.pairs.push([new RSymbol("DN_KINGGUS"), clone]);
  if (!VERIFY) fs.writeFileSync(path.join(DATA, "trainer_types.dat"), Buffer.from(marshalDump(tt)));
  return { added: true };
}

function installTrainerRecord() {
  backup("trainers.dat");
  const trainers = readData("trainers.dat");
  let touched = 0;
  for (const [key, value] of trainers.pairs) {
    if (!Array.isArray(key) || txt(key[1]) !== "KINGGUS") continue;
    if (key[0] instanceof RSymbol && key[0].name !== "DN_KINGGUS") { key[0] = new RSymbol("DN_KINGGUS"); touched++; }
    if (value?.setIvar) value.setIvar("@trainer_type", new RSymbol("DN_KINGGUS"));
  }
  if (!VERIFY && touched) fs.writeFileSync(path.join(DATA, "trainers.dat"), Buffer.from(marshalDump(trainers)));
  return { touched };
}

/** Textos de los comandos de script (código 355) de todas las páginas de un evento. */
function scriptTexts(map, eventName) {
  const ev = (map.getIvar("@events")?.pairs ?? []).find(([, e]) => txt(e.getIvar("@name")) === eventName);
  const out = [];
  for (const page of ev?.[1].getIvar("@pages") ?? []) {
    for (const cmd of page.getIvar("@list") ?? []) {
      for (const p of cmd.getIvar?.("@parameters") ?? []) if (p && typeof p.text === "string") out.push(p);
    }
  }
  return out;
}

/** Cambia el gráfico de un evento (todas sus páginas). */
function setEventGraphic(map, name, graphic) {
  const evs = map.getIvar("@events")?.pairs ?? [];
  const ev = evs.find(([, e]) => txt(e.getIvar("@name")) === name);
  if (!ev) return false;
  for (const page of ev[1].getIvar("@pages") ?? []) {
    const g = page.getIvar("@graphic");
    if (g?.getIvar("@character_name")) g.setIvar("@character_name", S(graphic));
  }
  return true;
}

/** Reescribe el tipo del entrenador en los scripts de las páginas de un evento. */
function rewriteBattleType(map, eventName, from, to) {
  const needle = `PBTrainer.new("${from}"`;
  let hits = 0;
  for (const p of scriptTexts(map, eventName)) {
    if (!p.text.includes(needle)) continue;
    p.text = p.text.split(needle).join(`PBTrainer.new("${to}"`);
    hits++;
  }
  return hits;
}

function wireMapEvents(file, edits) {
  const full = path.join(DATA, file);
  backup(file);
  const map = marshalLoad(fs.readFileSync(full));
  const done = edits.map((e) => (e.graphic ? setEventGraphic(map, e.event, e.graphic) : rewriteBattleType(map, e.event, e.from, e.to) > 0));
  if (!VERIFY && done.some(Boolean)) fs.writeFileSync(full, Buffer.from(marshalDump(map)));
  return edits.map((e, i) => ({ ...e, applied: done[i] }));
}

function updateCatalog() {
  const data = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  const ep = (data.episodes ?? []).find((e) => e.key === "EP06");
  const before = ep?.boss?.phaseA?.type;
  if (ep?.boss?.phaseA) ep.boss.phaseA.type = "DN_KINGGUS";
  if (!VERIFY) fs.writeFileSync(CATALOG, JSON.stringify(data, null, 2) + "\n");
  return { before, after: ep?.boss?.phaseA?.type };
}

// ------------------------------------------------------------------ verificación
function verifyAssets(manifest) {
  const failures = [];
  for (const item of manifest.assets ?? []) {
    const abs = path.join(GAME, item.out);
    if (!fs.existsSync(abs)) { failures.push(`${item.out}: no existe`); continue; }
    const buf = fs.readFileSync(abs);
    const img = createCanvas(1, 1); // sólo para dimensiones: se lee la cabecera PNG
    const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
    if (w !== item.w || h !== item.h) failures.push(`${item.out}: ${w}×${h} ≠ ${item.w}×${item.h}`);
    if (sha1(buf) !== item.sha1) failures.push(`${item.out}: hash distinto al manifiesto`);
    if (item.colors > PALETTE_MAX) failures.push(`${item.out}: ${item.colors} colores (máx ${PALETTE_MAX})`);
    if (!item.transparent) failures.push(`${item.out}: sin transparencia (fondo no recortado)`);
    void img;
  }
  return failures;
}

function verifyWiring() {
  const failures = [];
  const push = (ok, msg) => { if (!ok) failures.push(msg); };
  const tt = readData("trainer_types.dat");
  const entry = tt.pairs.find(([k]) => txt(k) === "DN_KINGGUS");
  push(!!entry, "trainer_types.dat: falta DN_KINGGUS");
  push(entry?.[1]?.getIvar("@id_number") > 0, "DN_KINGGUS: sin @id_number");
  const trainers = readData("trainers.dat");
  const rec = trainers.pairs.find(([k]) => Array.isArray(k) && txt(k[1]) === "KINGGUS");
  push(!!rec, "trainers.dat: falta el registro del jefe KINGGUS");
  push(rec && txt(rec[1].getIvar("@trainer_type")) === "DN_KINGGUS", "trainers.dat: el jefe EP06 no usa el tipo DN_KINGGUS");
  const m2135 = marshalLoad(fs.readFileSync(path.join(DATA, "Map2135.rxdata")));
  const m2056 = marshalLoad(fs.readFileSync(path.join(DATA, "Map2056.rxdata")));
  const graphicOf = (map, name) => {
    const ev = (map.getIvar("@events")?.pairs ?? []).find(([, e]) => txt(e.getIvar("@name")) === name);
    return txt(ev?.[1].getIvar("@pages")?.[0]?.getIvar("@graphic")?.getIvar("@character_name"));
  };
  push(graphicOf(m2135, "NPC_KINGGUS") === "DN_KINGGUS", "Map2135: NPC_KINGGUS sin gráfico DN_KINGGUS");
  push(graphicOf(m2056, "EV_EP01_JEFE") === "DN_WHITE_HAND", "Map2056: EV_EP01_JEFE sin gráfico DN_WHITE_HAND");
  const battleCalls = scriptTexts(m2135, "EV_EP06_JEFE").map((p) => p.text).join("\n");
  push(battleCalls.includes("dn_kinggus_final_sequence"), "Map2135: falta la secuencia intermedia + forma final de KINGGUS");
  push(!battleCalls.includes('PBTrainer.new("GENTLEMAN"'), "Map2135: la batalla de EP06 sigue con GENTLEMAN");
  const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  push((catalog.episodes ?? []).find((e) => e.key === "EP06")?.boss?.phaseA?.type === "DN_KINGGUS", "catálogo: EP06 sigue con el tipo antiguo");
  return failures;
}

// ------------------------------------------------------------------ main
async function main() {
  if (VERIFY) {
    if (!fs.existsSync(MANIFEST)) { console.error("No hay manifiesto de arte; corre `npm run dn:art`."); process.exit(1); }
    const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
    const failures = [...verifyAssets(manifest), ...verifyWiring()];
    console.log(`verificación de arte (${manifest.assets.length} assets + cableado)`);
    for (const item of manifest.assets) console.log(`  ${item.out} · ${item.w}×${item.h} · ${item.colors} colores · ${item.use}`);
    if (failures.length) { for (const f of failures) console.error(`  FALLA: ${f}`); process.exit(1); }
    console.log("verificación de arte OK");
    return;
  }

  const assets = await buildAssets();
  for (const a of assets) {
    fs.mkdirSync(path.dirname(a.abs), { recursive: true });
    fs.writeFileSync(a.abs, a.png);
    console.log(`  ${a.out} · ${a.w}×${a.h} · ${a.colors} colores · ${(a.bytes / 1024).toFixed(1)} KB`);
  }
  const manifest = {
    title: "Dimensional Nightmare — arte de prioridad ALTA (doc 08)",
    generatedBy: "tools/dn_install_art.mjs",
    note: "Arte original generado para el mod (no derivado de los mosaicos). Sí puede empaquetarse.",
    paletteMax: PALETTE_MAX,
    assets: assets.map(({ png, abs, ...rest }) => rest),
  };
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");

  const type = installTrainerType();
  const record = installTrainerRecord();
  const wire2135 = wireMapEvents("Map2135.rxdata", [
    { event: "NPC_KINGGUS", graphic: "DN_KINGGUS" },
  ]);
  const wire2056 = wireMapEvents("Map2056.rxdata", [{ event: "EV_EP01_JEFE", graphic: "DN_WHITE_HAND" }]);
  const catalog = updateCatalog();

  console.log(`cableado: tipo DN_KINGGUS ${type.added ? "creado" : "ya existía"} · registro del jefe ${record.touched ? "migrado" : "ya estaba"}`);
  for (const w of [...wire2135, ...wire2056]) console.log(`  ${w.event}: ${w.applied ? "listo" : "revisar"}${w.graphic ? ` (gráfico ${w.graphic})` : ` (tipo ${w.from}→${w.to})`}`);
  console.log(`catálogo EP06: ${catalog.before} → ${catalog.after}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
