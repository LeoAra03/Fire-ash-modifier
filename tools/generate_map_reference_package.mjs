#!/usr/bin/env node
/**
 * Genera el catálogo visual referencial de los 1.039 mapas solicitados:
 * Atlas Mil (1021–2020) en 15 mosaicos y 39 mapas complementarios en el 16.
 *
 * Usa exclusivamente los mapas, tilesets, gráficos y catálogos del proyecto.
 * Los PNG son vistas estáticas de referencia; no sustituyen una prueba dentro
 * de Kirin ni de Game.exe.
 *
 * Uso:
 *   npm run create:map-reference          # crea solo los archivos ausentes
 *   node tools/generate_map_reference_package.mjs --force  # reconstrucción explícita
 *   npm run verify:map-reference          # valida PNG, informe y ZIP sin escribir
 *   node tools/generate_map_reference_package.mjs --refresh-report # actualiza solo informe/ZIP
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { marshalLoad } from "../web/js/marshal.js";
import { mapListFromInfos, parseEvent, parseMap, parseTileset, tableGet } from "../web/js/rmxp.js";
import { DATA, GAME, ROOT, readMarshalData } from "./lib/fire_ash_registry.mjs";
import { readZipEntry, readZipIndex, writeZip } from "./lib/zip_writer.mjs";

const OUTPUT_DIR = path.join(ROOT, "Scripts_corregido", "Mapas_PNG_16");
const REPORT_PATH = path.join(ROOT, "Scripts_corregido", "INFORME_REFERENCIAL_MAPAS.md");
const ZIP_PATH = path.join(ROOT, "Scripts_corregido", "Mapas_PNG_y_Informe_Referencial.zip");
const REPORT_NAME = path.basename(REPORT_PATH);
const ZIP_FOLDER_NAME = path.basename(OUTPUT_DIR);
const VERIFY_ONLY = process.argv.includes("--verify");
const FORCE = process.argv.includes("--force");
const REFRESH_REPORT = process.argv.includes("--refresh-report");

const ATLAS_IDS = Array.from({ length: 1000 }, (_, index) => 1021 + index);
const OTHER_GROUPS = [
  { name: "Isla Espejo", ids: [997, 998, 999] },
  { name: "Panteón Pokégod", ids: [1020] },
  // Se conserva la asignación: Falda 2021, Gruta 2030 y Cumbre 2022.
  { name: "Monte Silver", ids: [2021, 2030, 2022] },
  { name: "Multiverso Creepypasta", ids: [2023, 2024, 2025, 2026, 2027, 2028, 2029] },
  // La aproximación se presenta primero; los siete pisos siguen en 2031–2037.
  { name: "La Ruta de Dios", ids: [2038, 2031, 2032, 2033, 2034, 2035, 2036, 2037] },
  { name: "Vía de las Nueve Eras", ids: [2195, 2196] },
  { name: "Dimensiones del DLC", ids: [
    2200, 2201,                                        // Glazed y su gimnasio
    2210, 2211,                                        // Light Platinum y su gimnasio
    2220, 2221,                                        // Team Rocket: base y núcleo
    2230,                                              // Avenida de los Ocho Gimnasios
    ...Array.from({ length: 8 }, (_, i) => 2250 + i),   // los ocho gimnasios de Atlas
  ] },
];
const OTHER_IDS = OTHER_GROUPS.flatMap((group) => group.ids);
const REQUESTED_IDS = [...ATLAS_IDS, ...OTHER_IDS];
const EXPECTED_IMAGE_NAMES = [
  ...Array.from({ length: 15 }, (_, index) => `Atlas_${String(index + 1).padStart(2, "0")}.png`),
  "Otros_Mapas_16.png",
];

const atlasCatalog = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_mil_500.json"), "utf8"));
const hierarchy = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_content_hierarchy.json"), "utf8"));
const tier1Blueprints = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_tier1_blueprints_approved.json"), "utf8")).blueprints;
const tier1Seeds = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_narrative_seeds.json"), "utf8")).seeds;
const tier3Catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_tier3_rules.json"), "utf8"));
const multiverseCatalog = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "multiverse_creepypasta.json"), "utf8"));
const hierarchyById = new Map(hierarchy.maps.map((entry) => [Number(entry.mapId), entry]));
const tier1ById = new Map(tier1Blueprints.map((entry) => [Number(entry.mapId), entry]));
const tier1SeedById = new Map(tier1Seeds.map((entry) => [Number(entry.mapId), entry]));
const tier3ById = new Map(tier3Catalog.entries.map((entry) => [Number(entry.mapId), entry]));

const tier2ById = new Map();
for (const filename of fs.readdirSync(path.join(ROOT, "content")).filter((name) => /^atlas_tier2_blueprints_macro\d+\.json$/.test(name)).sort()) {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, "content", filename), "utf8"));
  for (const blueprint of data.blueprints ?? []) tier2ById.set(Number(blueprint.mapId), blueprint);
}

const EXTRA_DESCRIPTIONS = new Map([
  [997, "Atrio de llegada de Isla Espejo: concentra el acceso a la isla, la orientación inicial y el ferry de retorno."],
  [998, "Galería de Leyendas: sala de enfrentamientos con reflejos de entrenadores y líneas alternativas del multiverso."],
  [999, "Archivo Cero: cámara final de Isla Espejo, con su encuentro de cierre y una vía de regreso al exterior."],
  [1020, "Panteón Pokégod, recinto culminante de Horizontes para las manifestaciones y relatos de la categoría Pokégod."],
  [2021, "Falda del Monte Silver: acceso desde el hub, ladera nevada, cabaña y entrada a la gruta; aquí aparece el Archivero Prohibido."],
  [2030, "Gruta de los Testigos: vestíbulo subterráneo con accesos a Falda y Cumbre, siete puertas Unown que deletrean TESTIGO, curación y encuentros de cueva."],
  [2022, "Cumbre del Monte Silver: meseta nevada de RED, el Campeón Silencioso, y punto de acceso a las siete emisiones."],
  [2038, "Aproximación Celestial larga de La Ruta de Dios: montaña de terrazas, escaleras, santuarios, hitos, zonas de hierba nevada y retorno a Ciudad Puntaneva."],
  [2031, "Piso 1F, Puerta de las Columnas: entrada de la montaña sagrada, con nieve, estatuas y el desafío de Maya/Dawn."],
  [2032, "Piso 2F, Sendero de los Titanes: laderas y monolitos nevados; alberga el encuentro de Palmer y Barry."],
  [2033, "Piso 3F, Terraza del Aura: avenida y plataformas de mármol entre riscos, pozas cósmicas y estatuas; encuentro de Riley."],
  [2034, "Piso 4F, Baluarte Celestial: calzada procesional alpina y santuario de campeones; encuentro de Cynthia."],
  [2035, "Piso 5F, Santuario del Tiempo: recinto de Dialga Primordial, con altar, escalinatas y salida al siguiente piso."],
  [2036, "Piso 6F, Santuario del Espacio: recinto de Palkia Primordial y transición hacia la cima."],
  [2037, "Piso 7F, Cima del Génesis: altar de Arceus y desenlace de La Ruta de Dios."],
  [2195, "Vía de las Nueve Eras: nueve distritos de 30×30, cada uno tomado de una ciudad canónica de Kanto, Johto, Hoenn, Sinnoh, Unova, Kalos, Alola, Galar y Glazed, unidos por avenidas en serpentina."],
  [2196, "Gimnasio Atlas · Las Nueve Eras: recinto de la Líder Vera, nueve entrenadores de era y la Medalla Era."],
  [2200, "Glazed — Bahía de Cedolán: dimensión navegable con seis distritos tomados de Cedolán, Lerucean, la Meseta Ingido y sus rutas."],
  [2201, "Gimnasio Glazed: sala del Líder Ámbar y la Medalla Glazed."],
  [2210, "Light Platinum — Costa de Lappet: dimensión navegable con seis distritos de costa, sendas, safari y frente de batalla."],
  [2211, "Gimnasio Light Platinum: sala del Líder Resplandor y la Medalla Platino."],
  [2220, "Team Rocket — Base Subterránea: la infiltración de Ash, cinco misiones encadenadas por rango y tres heridos que socorrer."],
  [2221, "Team Rocket — Núcleo del Mando: despacho donde Ash toma el control de la dimensión al llegar a Jefe Supremo."],
  [2230, "Atlas — Avenida de los Ocho Gimnasios: seis plazas canónicas, ocho puertas, tres rivales y cuatro cuadrillas."],
  [2250, "Gimnasio de Atlas · Bruma (FANTASMA): Líder Néboa y la Medalla Bruma, primera del circuito."],
  [2251, "Gimnasio de Atlas · Veta (ROCA): Líder Canto y la Medalla Veta."],
  [2252, "Gimnasio de Atlas · Duna (TIERRA): Líder Ágata y la Medalla Duna."],
  [2253, "Gimnasio de Atlas · Fragua (FUEGO): Líder Crisol y la Medalla Fragua."],
  [2254, "Gimnasio de Atlas · Marea (AGUA): Líder Náyade y la Medalla Marea."],
  [2255, "Gimnasio de Atlas · Vendaval (VOLADOR): Líder Cierzo y la Medalla Vendaval."],
  [2256, "Gimnasio de Atlas · Invernadero (PLANTA): Líder Retoño y la Medalla Invernadero."],
  [2257, "Gimnasio de Atlas · Cumbre (ELÉCTRICO): Líder Chispa y la Medalla Cumbre, octava del circuito."],
]);

const MULTIVERSE_DESCRIPTIONS = new Map(multiverseCatalog.bosses.map((boss) => [
  Number(boss.mapId),
  `${boss.label}: emisión inspirada en “${boss.homage}”. ${boss.atmosphere?.[0] ?? boss.intro?.[0] ?? "Zona de desafío del Monte Silver."}`,
]));

const graphicsRoots = {
  tileset: path.join(GAME, "Graphics", "Tilesets"),
  autotile: path.join(GAME, "Graphics", "Autotiles"),
  character: path.join(GAME, "Graphics", "Characters"),
};
const autotileParts = [
  [27, 28, 33, 34], [5, 28, 33, 34], [27, 6, 33, 34], [5, 6, 33, 34],
  [27, 28, 33, 12], [5, 28, 33, 12], [27, 6, 33, 12], [5, 6, 33, 12],
  [27, 28, 11, 34], [5, 28, 11, 34], [27, 6, 11, 34], [5, 6, 11, 34],
  [27, 28, 11, 12], [5, 28, 11, 12], [27, 6, 11, 12], [5, 6, 11, 12],
  [25, 26, 31, 32], [25, 6, 31, 32], [25, 26, 31, 12], [25, 6, 31, 12],
  [15, 16, 21, 22], [15, 16, 21, 12], [15, 16, 11, 22], [15, 16, 11, 12],
  [29, 30, 35, 36], [29, 30, 11, 36], [5, 30, 35, 36], [5, 30, 11, 36],
  [39, 40, 45, 46], [5, 40, 45, 46], [39, 6, 45, 46], [5, 6, 45, 46],
  [25, 30, 31, 36], [15, 16, 45, 46], [13, 14, 19, 20], [13, 14, 19, 12],
  [17, 18, 23, 24], [17, 18, 11, 24], [41, 42, 47, 48], [5, 42, 47, 48],
  [37, 38, 43, 44], [37, 6, 43, 44], [13, 18, 19, 24], [13, 14, 43, 44],
  [37, 42, 43, 48], [17, 18, 47, 48], [13, 18, 43, 48], [1, 2, 7, 8],
];

const imageCache = new Map();
const directoryCache = new Map();
function resolveGraphic(directory, name) {
  if (!name || !fs.existsSync(directory)) return null;
  if (!directoryCache.has(directory)) {
    directoryCache.set(directory, new Map(fs.readdirSync(directory).map((filename) => [filename.toLowerCase(), filename])));
  }
  const files = directoryCache.get(directory);
  for (const candidate of [name, `${name}.png`, `${name}.PNG`, `${name}.jpg`, `${name}.jpeg`]) {
    const actual = files.get(candidate.toLowerCase());
    if (actual) return path.join(directory, actual);
  }
  return null;
}
async function graphic(kind, name) {
  const file = resolveGraphic(graphicsRoots[kind], name);
  if (!file) return null;
  if (!imageCache.has(file)) imageCache.set(file, loadImage(file));
  return imageCache.get(file);
}

function loadMapIndex() {
  const mapInfos = mapListFromInfos(readMarshalData("MapInfos.rxdata"));
  const byId = new Map(mapInfos.map((entry) => [entry.id, entry]));
  for (const id of REQUESTED_IDS) {
    if (!byId.has(id)) throw new Error(`MapInfos.rxdata no contiene Map${id}`);
    const mapPath = path.join(DATA, `Map${id}.rxdata`);
    if (!fs.existsSync(mapPath)) throw new Error(`Falta ${path.relative(ROOT, mapPath)}`);
  }
  if (hierarchy.maps.length !== 1000 || atlasCatalog.maps.length !== 1000) {
    throw new Error(`Los catálogos de Atlas no contienen 1.000 filas (${hierarchy.maps.length}/${atlasCatalog.maps.length})`);
  }
  if (OTHER_IDS.length !== 39 || new Set(REQUESTED_IDS).size !== 1039) {
    throw new Error(`La selección solicitada no es de 1.039 mapas únicos (${REQUESTED_IDS.length})`);
  }
  assertIdTitles(byId);
  return byId;
}

function assertIdTitles(mapInfoById) {
  const titleContains = (id, phrase) => (mapInfoById.get(id)?.name ?? "").toLowerCase().includes(phrase.toLowerCase());
  if (!titleContains(2021, "Falda")) throw new Error("Map2021 debe ser Monte Silver — Falda");
  if (!titleContains(2030, "Gruta de los Testigos")) throw new Error("Map2030 debe ser la Gruta de los Testigos; no se generará la aproximación sobre este ID");
  if (!titleContains(2022, "Cumbre")) throw new Error("Map2022 debe ser Monte Silver — Cumbre");
  if (!titleContains(2038, "Aproximación Celestial")) throw new Error("Map2038 debe ser la aproximación celestial de La Ruta de Dios");
  for (let id = 2031; id <= 2037; id++) {
    if (!titleContains(id, "La Ruta de Dios")) throw new Error(`Map${id} debe conservar uno de los siete pisos de La Ruta de Dios`);
  }
}

function summarizeMaps(mapInfoById) {
  const summaries = new Map();
  for (const id of REQUESTED_IDS) {
    const raw = fs.readFileSync(path.join(DATA, `Map${id}.rxdata`));
    const parsed = parseMap(marshalLoad(raw));
    const events = parsed.events.map(({ obj }) => parseEvent(obj));
    summaries.set(id, {
      id,
      title: mapInfoById.get(id)?.name || `Mapa ${id}`,
      width: parsed.width,
      height: parsed.height,
      tilesetId: parsed.tilesetId,
      eventCount: events.length,
      eventNames: events.map((event) => event.name).filter(Boolean),
    });
  }
  return summaries;
}

function atlasCategory(hierarchyEntry) {
  if (hierarchyEntry.tier === 1) return "Tier 1 · ancla artesanal";
  if (hierarchyEntry.tier === 2) return "Tier 2 · ruta estable";
  return "Tier 3 · eco dimensional";
}
function atlasDescription(entry, summary) {
  const source = `${entry.sourceName || entry.mapName || "escenario de Atlas"} (Map${entry.sourceId ?? "—"})`;
  if (entry.tier === 1) {
    const blueprint = tier1ById.get(Number(entry.mapId));
    const seed = tier1SeedById.get(Number(entry.mapId));
    const identity = blueprint?.biome?.identity || seed?.biome || "ancla narrativa del sector";
    const promise = blueprint?.oneSentencePromise || seed?.coreMystery || seed?.globalImportance;
    return `Ancla artesanal basada en ${source}. Identidad del lugar: ${identity}. Episodio: ${promise || "articula el sello y la historia del sector."}`;
  }
  if (entry.tier === 2) {
    const blueprint = tier2ById.get(Number(entry.mapId));
    if (blueprint) {
      return `Ruta estable basada en ${source}. Objetivo: ${blueprint.objective} Mecánica de referencia: ${blueprint.mechanic?.name || "interacción local"}. Promesa: ${blueprint.promise}`;
    }
    return `Ruta estable de ${source} dentro de ${entry.sectorName}; el plano la clasifica como Tier 2 con mecánica local, decisión persistente y retorno libre.`;
  }
  const localRule = tier3ById.get(Number(entry.mapId));
  if (localRule) {
    const counterplay = localRule.rule?.rules?.[0];
    return `Eco dimensional de ${source}. Anomalía documentada: ${localRule.anomaly} Regla local: ${localRule.rule?.name || localRule.variant || "regla de navegación"}.${counterplay ? ` Primer contrajuego: ${counterplay}` : ""}`;
  }
  const hasAtlasChallenge = summary.eventNames.some((name) => /atlas desafío/i.test(name));
  return `Eco dimensional de ${source} en el sector ${entry.sectorName}. La ficha de jerarquía lo ubica en Tier 3; ${hasAtlasChallenge ? "conserva un evento de desafío Atlas" : "su lectura se centra en el espacio heredado y su baliza"}, junto con la navegación y el retorno de referencia del Atlas.`;
}

function extraDescription(id) {
  if (MULTIVERSE_DESCRIPTIONS.has(id)) return MULTIVERSE_DESCRIPTIONS.get(id);
  return EXTRA_DESCRIPTIONS.get(id) || "Mapa complementario del proyecto; la ficha se limita a su título de MapInfos y los datos compilados presentes.";
}
function cleanMarkdown(value) {
  return String(value ?? "—").replaceAll("|", "\\|").replaceAll("\r", " ").replaceAll("\n", " ").trim();
}
function mapFactLine(summary) {
  return `**Datos compilados:** ${summary.width}×${summary.height} tiles; ${summary.eventCount} eventos; tileset ${summary.tilesetId}.`;
}

function buildReport(summaries) {
  const lines = [
    "# Informe referencial de mapas — 1.039 fichas",
    "",
    `**Generado:** ${new Date().toISOString().slice(0, 10)}`,
    "**Alcance:** Atlas Mil (Map1021–Map2020) y 39 mapas complementarios en `Otros_Mapas_16.png`.",
    "",
    "> Este informe y sus mosaicos son referencias estáticas elaboradas a partir de MapInfos, datos RMXP, catálogos de contenido y gráficos del proyecto. No equivalen a una prueba dentro de Kirin ni de Game.exe; no se afirma aquí que se haya ejecutado el juego.",
    "",
    "## Asignación de IDs y alcance",
    "",
    "- **Atlas Mil:** Map1021–Map2020, 1.000 mapas organizados en 40 sectores y 15 hojas visuales.",
    "- **Isla Espejo:** Map997–Map999 (3 mapas).",
    "- **Panteón Pokégod:** Map1020 (1 mapa).",
    "- **Monte Silver:** Falda Map2021, Gruta de los Testigos Map2030 y Cumbre Map2022.",
    "- **Multiverso Creepypasta:** siete emisiones, Map2023–Map2029.",
    "- **La Ruta de Dios:** siete pisos Map2031–Map2037 y aproximación celestial Map2038.",
    "- **Vía de las Nueve Eras:** Map2195 (vía de nueve distritos) y Map2196 (Gimnasio Atlas · Las Nueve Eras).",
    "- **Dimensiones del DLC:** Map2200–Map2201 (Glazed), Map2210–Map2211 (Light Platinum), Map2220–Map2221 (Team Rocket), Map2230 (Avenida) y Map2250–Map2257 (ocho gimnasios de Atlas).",
    "",
    "**Colisión evitada:** Map2030 sigue siendo la Gruta de los Testigos. La aproximación de La Ruta de Dios está en Map2038; los pisos permanecen en Map2031–Map2037.",
    "",
    "## Cómo leer las fichas",
    "",
    "Cada ficha conserva el título registrado en `MapInfos.rxdata`, la categoría/sector del catálogo del proyecto y las dimensiones y cantidad de eventos leídas del mapa compilado. Las descripciones Tier 1 y Tier 2 se apoyan en sus blueprints; las Tier 3, en sus reglas o en la jerarquía y los eventos disponibles. Para los mapas complementarios se usan los catálogos y documentos del proyecto.",
    "",
  ];

  for (const sector of [...atlasCatalog.sectors].sort((a, b) => a.id - b.id)) {
    const sectorEntries = hierarchy.maps
      .filter((entry) => Number(entry.sector) === Number(sector.id))
      .sort((a, b) => Number(a.mapId) - Number(b.mapId));
    if (sectorEntries.length !== 25) throw new Error(`Sector ${sector.id} debe tener 25 mapas, tiene ${sectorEntries.length}`);
    const first = sectorEntries[0].mapId;
    const last = sectorEntries.at(-1).mapId;
    lines.push(`## Sector ${String(sector.id).padStart(2, "0")} — ${sector.name} (${sector.faction}) · Map${first}–Map${last}`, "");
    for (const entry of sectorEntries) {
      const id = Number(entry.mapId);
      const summary = summaries.get(id);
      if (!summary) throw new Error(`Falta resumen de Map${id}`);
      const desc = atlasDescription(entry, summary);
      lines.push(
        `### Map${id} — ${cleanMarkdown(summary.title)}`,
        `- **Categoría:** Atlas Mil · ${cleanMarkdown(sector.name)} · ${cleanMarkdown(atlasCategory(entry))}.`,
        `- **Referencia:** ${cleanMarkdown(desc)}`,
        `- ${mapFactLine(summary)}`,
        "",
      );
    }
  }

  lines.push("## Mapas complementarios — 39 fichas", "");
  for (const group of OTHER_GROUPS) {
    lines.push(`## ${group.name}`, "");
    for (const id of group.ids) {
      const summary = summaries.get(id);
      if (!summary) throw new Error(`Falta resumen de Map${id}`);
      lines.push(
        `### Map${id} — ${cleanMarkdown(summary.title)}`,
        `- **Categoría:** ${cleanMarkdown(group.name)}.`,
        `- **Referencia:** ${cleanMarkdown(extraDescription(id))}`,
        `- ${mapFactLine(summary)}`,
        "",
      );
    }
  }
  lines.push("## Límites de esta referencia", "", "Los mosaicos son renders estáticos de los mapas compilados con sus tilesets y gráficos disponibles. No validan por sí mismos pasabilidad en ejecución, transferencias, eventos en tiempo real, compatibilidad Android/Kirin ni funcionamiento en Game.exe. Para esas comprobaciones hace falta ejecutar el juego y realizar una prueba manual.", "");
  return `${lines.join("\n").replace(/\n+$/, "")}\n`;
}

const tilesetRaw = readMarshalData("Tilesets.rxdata");
const tilesets = new Map();
for (let index = 1; index < tilesetRaw.length; index++) {
  if (!tilesetRaw[index]) continue;
  const parsed = parseTileset(tilesetRaw[index]);
  tilesets.set(parsed.id, parsed);
}

async function renderMapBuffer(buffer) {
  const map = parseMap(marshalLoad(buffer));
  const tileset = tilesets.get(map.tilesetId);
  if (!tileset) throw new Error(`Map usa Tileset ${map.tilesetId}, ausente en Tilesets.rxdata`);
  const tilesetImage = await graphic("tileset", tileset.tilesetName);
  if (!tilesetImage) throw new Error(`Falta Graphics/Tilesets/${tileset.tilesetName}`);
  const autotiles = await Promise.all(tileset.autotiles.map((name) => graphic("autotile", name)));
  const canvas = createCanvas(Math.max(1, map.width * 32), Math.max(1, map.height * 32));
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#252b34";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const drawAutotile = (image, pattern, dx, dy) => {
    if (!image) return;
    if (image.width < 96 || image.height < 128) {
      const width = Math.min(32, image.width);
      const height = Math.min(32, image.height);
      if (width && height) ctx.drawImage(image, 0, 0, width, height, dx, dy, 32, 32);
      return;
    }
    for (let quarter = 0; quarter < 4; quarter++) {
      const part = autotileParts[pattern]?.[quarter] ?? autotileParts[0][quarter];
      const source = part - 1;
      const sx = (source % 6) * 16;
      const sy = Math.floor(source / 6) * 16;
      ctx.drawImage(image, sx, sy, 16, 16, dx + (quarter % 2) * 16, dy + Math.floor(quarter / 2) * 16, 16, 16);
    }
  };
  const drawTile = (tileId, x, y) => {
    if (!tileId) return;
    if (tileId >= 384) {
      const source = tileId - 384;
      const sx = (source % 8) * 32;
      const sy = Math.floor(source / 8) * 32;
      if (sx + 32 <= tilesetImage.width && sy + 32 <= tilesetImage.height) {
        ctx.drawImage(tilesetImage, sx, sy, 32, 32, x, y, 32, 32);
      }
      return;
    }
    if (tileId >= 48) {
      const index = Math.floor(tileId / 48) - 1;
      drawAutotile(autotiles[index], tileId % 48, x, y);
    }
  };

  // RMXP Table access is intentionally routed through tableGet from web/js/rmxp.js.
  for (let z = 0; z < 3; z++) {
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        drawTile(tableGet(map.table, x, y, z), x * 32, y * 32);
      }
    }
  }

  const events = map.events.map(({ obj }) => parseEvent(obj)).sort((a, b) => a.y - b.y || a.id - b.id);
  for (const event of events) {
    const display = event.pages.map((page) => page.graphic).find((entry) => entry?.charName || entry?.tileId);
    if (!display || display.opacity === 0) continue;
    if (display.tileId) {
      drawTile(display.tileId, event.x * 32, event.y * 32);
      continue;
    }
    const image = await graphic("character", display.charName);
    if (!image) continue;
    const frameWidth = Math.floor(image.width / 4);
    const frameHeight = Math.floor(image.height / 4);
    if (!frameWidth || !frameHeight) continue;
    const row = ({ 2: 0, 4: 1, 6: 2, 8: 3 })[display.direction] ?? 0;
    const column = Math.max(0, Math.min(3, Number(display.pattern ?? 0)));
    ctx.globalAlpha = Number(display.opacity ?? 255) / 255;
    ctx.drawImage(image, column * frameWidth, row * frameHeight, frameWidth, frameHeight,
      event.x * 32 + (32 - frameWidth) / 2, event.y * 32 + 32 - frameHeight, frameWidth, frameHeight);
    ctx.globalAlpha = 1;
  }
  return canvas;
}

function wrapText(ctx, text, maxWidth, maxLines = 2) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = word;
    } else current = candidate;
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    let last = lines[maxLines - 1];
    while (last && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1).trimEnd();
    lines[maxLines - 1] = `${last}…`;
  }
  return lines;
}
function clipText(ctx, text, maxWidth) {
  let value = String(text || "");
  while (value && ctx.measureText(`${value}…`).width > maxWidth) value = value.slice(0, -1).trimEnd();
  return value === text ? value : `${value}…`;
}
function categoryForCard(id) {
  const entry = hierarchyById.get(id);
  if (entry) return `ATLAS · S${String(entry.sector).padStart(2, "0")} · TIER ${entry.tier}`;
  for (const group of OTHER_GROUPS) if (group.ids.includes(id)) return group.name.toUpperCase();
  return "MAPA";
}

const SHEET_COLUMNS = 5;
const CARD_WIDTH = 360;
const CARD_HEIGHT = 232;
const HEADER_HEIGHT = 72;
const SHEET_ROWS = 14;

async function renderSheet(entries, title, subtitle, outputPath, summaries, mapInfoById) {
  const rows = Math.max(1, Math.ceil(entries.length / SHEET_COLUMNS));
  const width = SHEET_COLUMNS * CARD_WIDTH;
  const height = HEADER_HEIGHT + rows * CARD_HEIGHT;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#10151c";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#171f29";
  ctx.fillRect(0, 0, width, HEADER_HEIGHT);
  ctx.fillStyle = "#f0d18c";
  ctx.font = "bold 24px sans-serif";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(clipText(ctx, title, width - 32), 16, 30);
  ctx.fillStyle = "#bdc9d7";
  ctx.font = "13px sans-serif";
  ctx.fillText(clipText(ctx, subtitle, width - 32), 16, 51);
  ctx.fillStyle = "#8593a4";
  ctx.font = "11px sans-serif";
  ctx.fillText("Render estático de referencia · no sustituye prueba dentro del juego", 16, 67);

  for (let index = 0; index < entries.length; index++) {
    const id = typeof entries[index] === "number" ? entries[index] : Number(entries[index].mapId);
    const summary = summaries.get(id);
    if (!summary) throw new Error(`No hay ficha resumida para Map${id}`);
    const x = (index % SHEET_COLUMNS) * CARD_WIDTH;
    const y = HEADER_HEIGHT + Math.floor(index / SHEET_COLUMNS) * CARD_HEIGHT;

    ctx.fillStyle = "#1a222c";
    ctx.fillRect(x + 1, y + 1, CARD_WIDTH - 2, CARD_HEIGHT - 2);
    ctx.strokeStyle = "#34404d";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, CARD_WIDTH - 1, CARD_HEIGHT - 1);

    ctx.fillStyle = "#9ec6ed";
    ctx.font = "bold 11px sans-serif";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(clipText(ctx, `MAP ${id} · ${categoryForCard(id)}`, CARD_WIDTH - 20), x + 10, y + 16);

    ctx.fillStyle = "#f1ebdd";
    ctx.font = "bold 15px sans-serif";
    const titleLines = wrapText(ctx, summary.title, CARD_WIDTH - 22, 2);
    ctx.fillText(titleLines[0] || "(sin título)", x + 10, y + 36);
    if (titleLines[1]) ctx.fillText(titleLines[1], x + 10, y + 53);

    const mapCanvas = await renderMapBuffer(fs.readFileSync(path.join(DATA, `Map${id}.rxdata`)));
    const boxX = x + 9;
    const boxY = y + 62;
    const boxWidth = CARD_WIDTH - 18;
    const boxHeight = 150;
    ctx.fillStyle = "#252b34";
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    const scale = Math.min(boxWidth / mapCanvas.width, boxHeight / mapCanvas.height);
    const drawWidth = Math.max(1, Math.round(mapCanvas.width * scale));
    const drawHeight = Math.max(1, Math.round(mapCanvas.height * scale));
    const drawX = Math.round(boxX + (boxWidth - drawWidth) / 2);
    const drawY = Math.round(boxY + (boxHeight - drawHeight) / 2);
    ctx.drawImage(mapCanvas, 0, 0, mapCanvas.width, mapCanvas.height, drawX, drawY, drawWidth, drawHeight);

    ctx.fillStyle = "#aeb9c7";
    ctx.font = "11px sans-serif";
    ctx.fillText(`${summary.width}×${summary.height} · ${summary.eventCount} eventos · tileset ${summary.tilesetId}`, x + 10, y + 226);

    // Las superficies nativas son mucho mayores que sus miniaturas. Liberarlas
    // enseguida evita acumular cientos de canvas completos en ejecuciones largas.
    mapCanvas.width = 0;
    mapCanvas.height = 0;
    if (global.gc && index % 10 === 9) global.gc();
  }

  const png = canvas.toBuffer("image/png");
  fs.writeFileSync(outputPath, png);
  canvas.width = 0;
  canvas.height = 0;
  if (global.gc) global.gc();
  const fileSize = fs.statSync(outputPath).size;
  console.log(`PNG ${path.relative(ROOT, outputPath)} · ${entries.length} mapas · ${(fileSize / 1024 / 1024).toFixed(2)} MiB`);
}

function atlasSheetBatches() {
  const batches = [];
  const baseSize = Math.floor(ATLAS_IDS.length / 15);
  const remainder = ATLAS_IDS.length % 15;
  let cursor = 0;
  for (let sheetIndex = 0; sheetIndex < 15; sheetIndex++) {
    const count = baseSize + (sheetIndex < remainder ? 1 : 0);
    const entries = ATLAS_IDS.slice(cursor, cursor + count);
    cursor += count;
    batches.push({ sheetIndex, entries });
  }
  if (cursor !== ATLAS_IDS.length || batches.some((batch) => batch.entries.length > SHEET_COLUMNS * SHEET_ROWS)) {
    throw new Error("La división de Atlas Mil en 15 mosaicos no cuadra");
  }
  return batches;
}

function expectedZipEntries() {
  return [
    ...EXPECTED_IMAGE_NAMES.map((name) => `${ZIP_FOLDER_NAME}/${name}`),
    REPORT_NAME,
  ].sort();
}
function verifyReport(summaries) {
  if (!fs.existsSync(REPORT_PATH)) throw new Error(`Falta ${path.relative(ROOT, REPORT_PATH)}`);
  const report = fs.readFileSync(REPORT_PATH, "utf8");
  for (const id of REQUESTED_IDS) {
    if (!report.includes(`### Map${id} —`)) throw new Error(`El informe no contiene una ficha para Map${id}`);
  }
  const withoutDate = (text) => text.replace(/^\*\*Generado:\*\* .*$/m, "**Generado:**");
  if (withoutDate(report) !== withoutDate(buildReport(summaries))) throw new Error("El informe está desactualizado respecto a los mapas/catálogos: ejecuta --refresh-report");
  const headings = [...report.matchAll(/^### Map\d+ —/gm)].length;
  if (headings !== 1039) throw new Error(`El informe contiene ${headings} fichas, se esperaban 1.039`);
  for (const required of [
    "Map2030 sigue siendo la Gruta de los Testigos",
    "Map2038",
    "Map2031–Map2037",
    "No equivalen a una prueba dentro de Kirin ni de Game.exe",
  ]) {
    if (!report.includes(required)) throw new Error(`Falta en el informe la nota obligatoria: ${required}`);
  }
}
async function verifyImages() {
  for (const name of EXPECTED_IMAGE_NAMES) {
    const file = path.join(OUTPUT_DIR, name);
    if (!fs.existsSync(file)) throw new Error(`Falta ${path.relative(ROOT, file)}`);
    const image = await loadImage(file);
    if (image.width < 1000 || image.height < 500) throw new Error(`${name} tiene dimensiones inesperadas (${image.width}×${image.height})`);
    console.log(`PNG OK ${name} · ${image.width}×${image.height} · ${(fs.statSync(file).size / 1024 / 1024).toFixed(2)} MiB`);
  }
}
function verifyZip() {
  if (!fs.existsSync(ZIP_PATH)) throw new Error(`Falta ${path.relative(ROOT, ZIP_PATH)}`);
  const zip = readZipIndex(ZIP_PATH);
  const expected = expectedZipEntries();
  const actual = [...zip.entries.keys()].sort();
  if (actual.length !== expected.length || actual.some((name, index) => name !== expected[index])) {
    throw new Error(`El ZIP no contiene exactamente los 16 mosaicos y el informe (${actual.length} entradas)`);
  }
  for (const name of expected) {
    const source = name === REPORT_NAME ? REPORT_PATH : path.join(ROOT, "Scripts_corregido", name);
    if (!readZipEntry(zip, name).equals(fs.readFileSync(source))) throw new Error(`Contenido desactualizado en el ZIP: ${name}`);
  }
  console.log(`ZIP OK ${path.relative(ROOT, ZIP_PATH)} · ${expected.length} archivos · ${(fs.statSync(ZIP_PATH).size / 1024 / 1024).toFixed(2)} MiB`);
}

async function verifyAll() {
  const mapInfoById = loadMapIndex();
  const summaries = summarizeMaps(mapInfoById);
  if (summaries.size !== 1039) throw new Error(`Se leyeron ${summaries.size} mapas, no 1.039`);
  verifyReport(summaries);
  await verifyImages();
  verifyZip();
  console.log("Verificación referencial OK: 1.000 mapas de Atlas Mil + 39 mapas complementarios. No es una prueba en Game.exe/Kirin.");
}

async function createMissing() {
  const mapInfoById = loadMapIndex();
  const summaries = summarizeMaps(mapInfoById);
  if (summaries.size !== 1039) throw new Error(`Se leyeron ${summaries.size} mapas, no 1.039`);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let updated = false;
  if (FORCE || REFRESH_REPORT || !fs.existsSync(REPORT_PATH)) {
    updated = true;
    fs.writeFileSync(REPORT_PATH, buildReport(summaries), "utf8");
    console.log(`Informe ${path.relative(ROOT, REPORT_PATH)} · 1.039 fichas`);
  } else {
    console.log(`Conservo el informe existente: ${path.relative(ROOT, REPORT_PATH)}`);
  }

  for (const { sheetIndex, entries } of atlasSheetBatches()) {
    const name = `Atlas_${String(sheetIndex + 1).padStart(2, "0")}.png`;
    const output = path.join(OUTPUT_DIR, name);
    if (fs.existsSync(output) && !FORCE) {
      console.log(`Conservo el mosaico existente: ${path.relative(ROOT, output)}`);
      continue;
    }
    const first = entries[0];
    const last = entries.at(-1);
    const subtitle = `Map${first}–Map${last} · ${entries.length} mapas · hojas 01–15 de Atlas Mil`;
    updated = true;
    await renderSheet(entries, `ATLAS MIL · MOSAICO ${String(sheetIndex + 1).padStart(2, "0")} / 15`, subtitle, output, summaries, mapInfoById);
  }

  const otherOutput = path.join(OUTPUT_DIR, "Otros_Mapas_16.png");
  if (!fs.existsSync(otherOutput) || FORCE) {
    updated = true;
    const entries = OTHER_GROUPS.flatMap((group) => group.ids);
    await renderSheet(entries, "MAPAS COMPLEMENTARIOS · MOSAICO 16 / 16",
      "39 mapas · Isla Espejo · Panteón Pokégod · Monte Silver · Multiverso Creepypasta · La Ruta de Dios · Vía de las Nueve Eras · Dimensiones del DLC",
      otherOutput, summaries, mapInfoById);
  } else {
    console.log(`Conservo el mosaico existente: ${path.relative(ROOT, otherOutput)}`);
  }

  if (fs.existsSync(ZIP_PATH) && !updated) {
    console.log(`Conservo el ZIP existente: ${path.relative(ROOT, ZIP_PATH)}`);
  } else {
    const extraFiles = Object.fromEntries([
      ...EXPECTED_IMAGE_NAMES.map((name) => [`${ZIP_FOLDER_NAME}/${name}`, fs.readFileSync(path.join(OUTPUT_DIR, name))]),
      [REPORT_NAME, fs.readFileSync(REPORT_PATH)],
    ]);
    const emptyRoot = fs.mkdtempSync(path.join(os.tmpdir(), "mapas-referenciales-"));
    try {
      writeZip({ root: emptyRoot, destination: ZIP_PATH, extraFiles, timestamp: new Date(Date.UTC(2026, 8, 30)) });
    } finally {
      fs.rmSync(emptyRoot, { recursive: true, force: true });
    }
    console.log(`ZIP ${path.relative(ROOT, ZIP_PATH)} · ${Object.keys(extraFiles).length} archivos`);
  }

  await verifyAll();
}

if (VERIFY_ONLY) await verifyAll();
else await createMissing();
