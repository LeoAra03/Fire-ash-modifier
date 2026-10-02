#!/usr/bin/env node
/**
 * dn_render_sheets.mjs — hojas de contacto por episodio para revisión.
 *
 * Compone, a partir de los renders individuales de `docs/dn_referencia/detalle/`,
 * una hoja `docs/dn_referencia/lotes/<EPISODIO>.png` con una fila por mapa:
 * referencia | mapa construido | overlay de transitabilidad, a tamaño legible.
 * La hoja es el artefacto que se versiona; el detalle por mapa queda ignorado.
 *
 * Uso:
 *   node tools/dn_render_sheets.mjs --episode EP01
 *   node tools/dn_render_sheets.mjs --all
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DETALLE = path.join(ROOT, "docs", "dn_referencia", "detalle");
const OUT_DIR = path.join(ROOT, "docs", "dn_referencia", "lotes");
const BUILT = path.join(ROOT, "content", "dimensional_nightmare_maps_built.json");
const BLUEPRINT = path.join(ROOT, "content", "dimensional_nightmare_maps.json");

const argv = process.argv.slice(2);
const option = (name, fallback) => {
  const at = argv.indexOf(name);
  return at >= 0 && argv[at + 1] ? argv[at + 1] : fallback;
};
const EPISODE = option("--episode", null);
const ALL = argv.includes("--all");

const built = new Map(JSON.parse(fs.readFileSync(BUILT, "utf8")).maps.map((m) => [m.id, m]));
const blueprint = JSON.parse(fs.readFileSync(BLUEPRINT, "utf8")).maps;
const episodes = ALL ? [...new Set(blueprint.map((m) => m.episode))] : [EPISODE ?? "EP01"];

const PER_ROW = 1;      // una comparativa por fila (ya trae 3 paneles)
const SCALE = 0.55;     // reducción para que la hoja no pese de más
const LABEL = 26;

for (const episode of episodes) {
  const maps = blueprint.filter((m) => m.episode === episode && built.has(m.id));
  if (!maps.length) { console.log(`${episode}: sin mapas construidos; se omite`); continue; }
  const rows = [];
  for (const map of maps) {
    const file = path.join(DETALLE, `${map.id}_comparacion.png`);
    if (!fs.existsSync(file)) { console.log(`  aviso: falta ${path.relative(ROOT, file)}`); continue; }
    rows.push({ map: { ...map, ...built.get(map.id) }, img: await loadImage(file) });
  }
  if (!rows.length) continue;
  const cellH = Math.round(Math.max(...rows.map((r) => r.img.height)) * SCALE) + LABEL;
  const cellW = Math.round(Math.max(...rows.map((r) => r.img.width)) * SCALE);
  const canvas = createCanvas(cellW + 24, rows.length * cellH + 24);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#141414";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = "16px sans-serif";
  rows.forEach((row, i) => {
    const y = 12 + i * cellH;
    ctx.fillStyle = "#ffd479";
    const ficha = row.map.primary ? `ficha R${row.map.primary.resource.slice(1)}-${row.map.primary.index}` : `tileset del juego base${row.map.source ? ` · ${row.map.source}` : ""}`;
    ctx.fillText(`${row.map.id} · ${row.map.title} · ${ficha} · ts #${row.map.tilesetId} · ${row.map.width}×${row.map.height}`, 12, y + 16);
    ctx.drawImage(row.img, 12, y + LABEL, row.img.width * SCALE, row.img.height * SCALE);
  });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const out = path.join(OUT_DIR, `${episode}.png`);
  fs.writeFileSync(out, canvas.toBuffer("image/png"));
  console.log(`${episode}: ${rows.length} mapas → ${path.relative(ROOT, out)} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
}
