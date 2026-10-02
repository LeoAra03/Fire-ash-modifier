#!/usr/bin/env node
/**
 * create_dimensional_nightmare_maps.mjs — Plano de recreación (blueprint).
 *
 * Lee las tablas del GDD (`docs/DIMENSIONAL_NIGHTMARE/01..07`) y escribe
 * `content/dimensional_nightmare_maps.json`: por cada mapa, su título, la FICHA
 * de referencia (R#-N) que le asignó el GDD, el recorte concreto en
 * `reference/dimensional_nightmare/slices/` y el tamaño de diseño.
 *
 * Este archivo es la entrada de `tools/apply_dimensional_nightmare_maps.mjs`
 * (E3). No toca el juego: solo lee documentación y escribe el plano.
 *
 * Uso:
 *   node tools/create_dimensional_nightmare_maps.mjs
 *   node tools/create_dimensional_nightmare_maps.mjs --check
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = path.join(ROOT, "docs", "DIMENSIONAL_NIGHTMARE");
const OUT = path.join(ROOT, "content", "dimensional_nightmare_maps.json");
const CHECK = process.argv.includes("--check");

const RESOURCES = {
  R1: { key: "r1_glitch_city", label: "Glitch City Compilation", cols: 4 },
  R2: { key: "r2_dark_forest", label: "Creepy Dark Forest", cols: 4 },
  R3: { key: "r3_king_unown", label: "King Unown (sprite)", cols: 1 },
  R4: { key: "r4_trono_unown", label: "El Trono del Rey Unown", cols: 4 },
  R5: { key: "r5_pueblos_tumbas", label: "Pueblos y Tumbas", cols: 4 },
  R6: { key: "r6_snowy_mountain", label: "Creepy Snowy Mountain", cols: 5 },
  R7: { key: "r7_catacumbas", label: "Catacumbas de Lavanda", cols: 4 },
  // Segundo anillo (W7–W9): hojas origen compuestas a partir del arte del autor
  // por `tools/dn_create_world_sheets.mjs` (misma rejilla 4×4 que los mosaicos).
  R8: { key: "r8_strangled_red", label: "Strangled Red (W7)", cols: 4 },
  R9: { key: "r9_buried_alive", label: "Buried Alive (W8)", cols: 4 },
  R10: { key: "r10_lavender_syndrome", label: "Lavender Town Syndrome (W9)", cols: 4 },
};

// `R7-1` · `R6-12` · `R5-3bis` · `R1-6 (void con código)` · `R5-1 vacío + R1`
const FICHA_RE = /\bR(\d{1,2})-(\d+)(bis)?\b/g;

/** Índice secuencial (1..N) a partir de "R7-13" o de la forma "R7-3,2" (fila,col). */
function fichaIndexOf(resource, number, bis) {
  return { index: Number(number), bis: Boolean(bis), resource };
}

const MAP_ROW = /^\|\s*(\d{4})\s*\|(.+)\|(.+)\|(.+)\|\s*(\d+)[×x](\d+)\s*\|(.*?)\|?\s*$/;
const MAP_ROW_5COL = /^\|\s*(\d{4})\s*\|(.+)\|(.+)\|\s*(\d+)[×x](\d+)\s*\|(.*?)\|?\s*$/;

function loadEpisodeMaps(file, episode) {
  const maps = [];
  for (const line of fs.readFileSync(path.join(DOCS, file), "utf8").split("\n")) {
    const six = line.match(MAP_ROW);   // | id | título | ficha | tileset | WxH | rol |
    const five = line.match(MAP_ROW_5COL); // | id | título | ficha | WxH | rol |
    let id, title, fichaCell, tileset, width, height, role;
    if (six) {
      [, id, title, fichaCell, tileset, width, height, role] = six;
    } else if (five) {
      [, id, title, fichaCell, width, height, role] = five;
      tileset = "";
    } else continue;
    if (!/\bR\d{1,2}-\d/.test(fichaCell)) continue; // filas de NPCs, objetos…: no son mapas
    maps.push({
      id: Number(id),
      episode,
      title: title.trim().replace(/\*\*/g, ""),
      fichaCell: fichaCell.trim(),
      tileset: (tileset ?? "").trim(),
      designSize: { width: Number(width), height: Number(height) },
      role: (role ?? "").trim().replace(/\*\*/g, ""),
    });
  }
  return maps;
}

function resolveFichas(cell) {
  const found = [];
  for (const m of cell.matchAll(FICHA_RE)) {
    const [, r, n, bis] = m;
    const resource = `R${r}`;
    if (!RESOURCES[resource]) continue;
    const info = fichaIndexOf(resource, n, bis);
    // evita duplicar la misma ficha repetida en la celda
    if (!found.some((f) => f.resource === resource && f.index === info.index)) found.push(info);
  }
  return found;
}

const maps = [];
for (const [file, episode] of [
  ["01_EP01_WHITE_HAND.md", "EP01"],
  ["02_EP02_LOST_SILVER.md", "EP02"],
  ["03_EP03_SNOW_ON_MT_SILVER.md", "EP03"],
  ["04_EP04_HYPNOS_LULLABY.md", "EP04"],
  ["05_EP05_POKEMON_BLACK.md", "EP05"],
  ["06_EP06_KING_UNOWN.md", "EP06"],
  ["07_MAPA_DE_FLUJO.md", "NEXO"],
  ["16_W7_STRANGLED_RED.md", "W7"],
  ["17_W8_BURIED_ALIVE.md", "W8"],
  ["18_W9_LAVENDER_SYNDROME.md", "W9"],
]) {
  maps.push(...loadEpisodeMaps(file, episode));
}

// Antesala (2040): es el hub, no tiene ficha de referencia.
maps.push({
  id: 2040,
  episode: "HUB",
  title: "Antesala de las Grietas",
  fichaCell: "—",
  tileset: "",
  designSize: { width: 30, height: 24 },
  role: "Entrada del Nightmare (hub); se construye a mano sobre tiles de la Gruta (2030)",
});

maps.sort((a, b) => a.id - b.id);

const blueprint = {
  title: "Dimensional Nightmare — plano de recreación de mapas",
  generatedBy: "tools/create_dimensional_nightmare_maps.mjs",
  docs: "docs/DIMENSIONAL_NIGHTMARE/01..07 (tablas «Mapa | Título | Recurso (ficha) | …»)",
  note: "La ficha R#-N se resuelve al recorte NN.png de reference/dimensional_nightmare/slices/<recurso>/. El tamaño es el de DISEÑO del GDD; el mapa se construye al tamaño real de la ficha × escala.",
  resources: RESOURCES,
  count: maps.length,
  maps: maps.map((m) => {
    const fichas = resolveFichas(m.fichaCell);
    return {
      id: m.id,
      episode: m.episode,
      title: m.title,
      tilesetHint: m.tileset,
      designSize: m.designSize,
      fichaCell: m.fichaCell,
      role: m.role,
      primary: fichas[0]
        ? {
            ...fichas[0],
            key: RESOURCES[fichas[0].resource].key,
            slice: `reference/dimensional_nightmare/slices/${RESOURCES[fichas[0].resource].key}/${String(fichas[0].index).padStart(2, "0")}.png`,
          }
        : null,
      extras: fichas.slice(1).map((f) => ({
        ...f,
        key: RESOURCES[f.resource].key,
        slice: `reference/dimensional_nightmare/slices/${RESOURCES[f.resource].key}/${String(f.index).padStart(2, "0")}.png`,
      })),
    };
  }),
};

if (CHECK) {
  const withoutFicha = blueprint.maps.filter((m) => !m.primary);
  const missingSlice = blueprint.maps.filter((m) => m.primary && !fs.existsSync(path.join(ROOT, m.primary.slice)));
  console.log(`mapas en el plano: ${blueprint.count}`);
  console.log(`  con ficha: ${blueprint.count - withoutFicha.length} (sin ficha: ${withoutFicha.map((m) => m.id).join(", ") || "ninguno"})`);
  console.log(`  recortes presentes: ${blueprint.maps.filter((m) => m.primary).length - missingSlice.length}`);
  if (missingSlice.length) {
    console.log(`  recortes ausentes: ${missingSlice.map((m) => `${m.id} (${m.primary.slice})`).join(", ")}`);
    console.log("  → ejecutar `npm run dn:ingest`");
    process.exitCode = 1;
  }
  process.exit(process.exitCode ?? 0);
}

fs.writeFileSync(OUT, `${JSON.stringify(blueprint, null, 2)}\n`);
const byEpisode = {};
for (const m of blueprint.maps) byEpisode[m.episode] = (byEpisode[m.episode] ?? 0) + 1;
console.log(`plano: ${blueprint.count} mapas → ${path.relative(ROOT, OUT)}`);
console.log(`  ${Object.entries(byEpisode).map(([k, v]) => `${k}: ${v}`).join(" · ")}`);
console.log(`  con ficha de referencia: ${blueprint.maps.filter((m) => m.primary).length} · sin ficha: ${blueprint.maps.filter((m) => !m.primary).map((m) => m.id).join(", ") || "ninguno"}`);
