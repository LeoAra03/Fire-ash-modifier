#!/usr/bin/env node
/**
 * Depura las tarjetas de título incrustadas en cinco mapas del Dimensional
 * Nightmare. No desplaza eventos ni celdas: sustituye el arte superior por
 * variantes gráficas tomadas de las filas inmediatamente inferiores y clona,
 * por celda, pasabilidad/prioridad/terreno de los tiles originales.
 *
 * El inventario completo (todos los mapas compilados, no sólo EP03) y las cinco
 * intervenciones visuales revisadas están en content/dimensional_nightmare_map_polish.json.
 *
 * Uso:
 *   node tools/apply_dn_banner_cleanup.mjs --dry-run
 *   node tools/apply_dn_banner_cleanup.mjs --apply --render
 *   node tools/apply_dn_banner_cleanup.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { marshalDump, marshalLoad } from "../web/js/marshal.js";
import {
  parseMap, parseTileset, tableGet, tableSet, tableToUserDef,
} from "../web/js/rmxp.js";
import { renderMapId } from "./render_map_png.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GAME = path.join(ROOT, "pokemon_fire_ash");
const GAME_DATA = path.join(GAME, "Data");
const GAME_GRAPHICS = path.join(GAME, "Graphics", "Tilesets");
const QA = path.join(ROOT, "Scripts_corregido", "Dimensional_Nightmare_QA");
const QA_DATA = path.join(QA, "Data");
const QA_GRAPHICS = path.join(QA, "Graphics", "Tilesets");
const BUILT = path.join(ROOT, "content", "dimensional_nightmare_maps_built.json");
const PLAN = path.join(ROOT, "content", "dimensional_nightmare_map_polish.json");
const BACKUP = path.join(GAME, "PokeModBackups", "dn_map_banner_cleanup_originals");
const RENDER_DIR = path.join(ROOT, "docs", "dn_referencia", "detalle");

const TILE = 32;
const COLUMNS = 8;
const FIRST_NORMAL_TILE = 384;
const VERSION = 1;
const APPLY = process.argv.includes("--apply");
const VERIFY = process.argv.includes("--verify");
const RENDER = process.argv.includes("--render");
const REFRESH = process.argv.includes("--refresh-plan");
const DRY = !APPLY && !VERIFY;

const readRx = (directory, file) => marshalLoad(fs.readFileSync(path.join(directory, file)));
const mapFile = (id) => `Map${String(id).padStart(3, "0")}.rxdata`;
const writeAtomic = (file, bytes) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.dn-polish-tmp`;
  fs.writeFileSync(tmp, bytes);
  fs.renameSync(tmp, file);
};
const backupOnce = (source, destination) => {
  if (!fs.existsSync(source)) throw new Error(`Falta archivo de origen: ${source}`);
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(source, destination);
  }
};
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const hashJson = (value) => sha256(Buffer.from(JSON.stringify(value), "utf8"));

const plan = JSON.parse(fs.readFileSync(PLAN, "utf8"));
const built = JSON.parse(fs.readFileSync(BUILT, "utf8"));
const byId = new Map((built.maps ?? []).map((entry) => [Number(entry.id), entry]));

function validateInventory() {
  const ids = [...byId.keys()].sort((a, b) => a - b);
  const planned = [...(plan.auditedMaps ?? [])].map((entry) => Number(entry.id)).sort((a, b) => a - b);
  if (ids.length !== plan.auditedMapCount || ids.length !== planned.length ||
      ids.some((id, index) => id !== planned[index])) {
    throw new Error(`El inventario cambió: compilados=${ids.length}, plan=${planned.length}. Revisa ${path.relative(ROOT, PLAN)}.`);
  }
  for (const id of ids) {
    if (!fs.existsSync(path.join(GAME_DATA, mapFile(id)))) {
      throw new Error(`El inventario completo debe seguir disponible: falta ${mapFile(id)}.`);
    }
  }
}

function ensureBackups() {
  for (const [label, dataDir, graphicsDir] of [
    ["juego", GAME_DATA, GAME_GRAPHICS],
    ["qa", QA_DATA, QA_GRAPHICS],
  ]) {
    backupOnce(path.join(dataDir, "Tilesets.rxdata"), path.join(BACKUP, label, "Data", "Tilesets.rxdata"));
    for (const entry of plan.cleanupTargets) {
      backupOnce(path.join(dataDir, mapFile(entry.id)), path.join(BACKUP, label, "Data", mapFile(entry.id)));
      const png = `DN_${entry.id}.png`;
      backupOnce(path.join(graphicsDir, png), path.join(BACKUP, label, "Graphics", "Tilesets", png));
    }
  }
  const readme = path.join(BACKUP, "LEEME.txt");
  if (!fs.existsSync(readme)) {
    fs.mkdirSync(BACKUP, { recursive: true });
    fs.writeFileSync(readme,
      "Originales de los cinco mapas/tile sets anteriores a la depuración de rótulos.\n" +
      "El parche mantiene dimensiones, eventos y flags de pasabilidad/prioridad por celda.\n" +
      "No son partidas guardadas.\n", "utf8");
  }
}

function expandTileTable(source, newX, copiedFlags) {
  if (source.y !== 1 || source.z !== 1) {
    throw new Error(`Tabla de tile no unidimensional (${source.x}×${source.y}×${source.z}).`);
  }
  const data = new Uint16Array(newX);
  data.set(source.data.subarray(0, Math.min(source.data.length, data.length)));
  for (const { newId, originalId } of copiedFlags) {
    data[newId] = tableGet(source, originalId, 0, 0);
  }
  return { dim: source.dim, x: newX, y: 1, z: 1, data };
}

async function prepareInstall(dataDir, graphicsDir, label) {
  const tilesetsRaw = readRx(dataDir, "Tilesets.rxdata");
  const mapWrites = [];
  const pngWrites = [];
  const changedTilesets = new Set();
  let skipped = 0;

  for (const entry of plan.cleanupTargets) {
    const filename = mapFile(entry.id);
    const mapObject = readRx(dataDir, filename);
    if (Number(mapObject.getIvar("dn_banner_cleanup_version") ?? 0) === VERSION) {
      console.log(`  ${label}: Map${entry.id} ya tiene depuración v${VERSION}; sin cambios.`);
      skipped++;
      continue;
    }
    const parsed = parseMap(mapObject);
    if (entry.rows * 2 > parsed.height) {
      throw new Error(`Map${entry.id}: faltan filas de origen para la banda de ${entry.rows} filas.`);
    }
    const tilesetObject = tilesetsRaw[parsed.tilesetId];
    if (!tilesetObject) throw new Error(`Map${entry.id}: no existe tileset #${parsed.tilesetId}.`);
    const tileset = parseTileset(tilesetObject);
    const graphicName = `DN_${entry.id}.png`;
    const graphicFile = path.join(graphicsDir, graphicName);
    const image = await loadImage(graphicFile);
    if (image.width % TILE !== 0 || image.height % TILE !== 0) {
      throw new Error(`${graphicName}: dimensiones no alineadas a tiles de ${TILE}px.`);
    }
    const atlasColumns = image.width / TILE;
    const atlasCapacity = atlasColumns * (image.height / TILE);
    if (atlasColumns !== COLUMNS) throw new Error(`${graphicName}: se esperaban ${COLUMNS} columnas, hay ${atlasColumns}.`);

    const variants = [];
    for (let y = 0; y < entry.rows; y++) {
      for (let x = 0; x < parsed.width; x++) {
        const originalId = tableGet(parsed.table, x, y, 0);
        const sourceId = tableGet(parsed.table, x, y + entry.rows, 0);
        const originalIndex = originalId - FIRST_NORMAL_TILE;
        const sourceIndex = sourceId - FIRST_NORMAL_TILE;
        if (originalIndex < 0 || originalIndex >= atlasCapacity || sourceIndex < 0 || sourceIndex >= atlasCapacity) {
          throw new Error(`Map${entry.id} (${x},${y}): no es un tile normal del atlas (#${originalId} → #${sourceId}).`);
        }
        const newId = FIRST_NORMAL_TILE + atlasCapacity + variants.length;
        variants.push({ x, y, originalId, sourceId, newId, sourceIndex });
      }
    }

    const appendRows = Math.ceil(variants.length / COLUMNS);
    const canvas = createCanvas(image.width, image.height + appendRows * TILE);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0);
    for (const [i, variant] of variants.entries()) {
      const sx = (variant.sourceIndex % COLUMNS) * TILE;
      const sy = Math.floor(variant.sourceIndex / COLUMNS) * TILE;
      const dstIndex = atlasCapacity + i;
      const dx = (dstIndex % COLUMNS) * TILE;
      const dy = Math.floor(dstIndex / COLUMNS) * TILE;
      ctx.drawImage(image, sx, sy, TILE, TILE, dx, dy, TILE, TILE);
      tableSet(parsed.table, variant.x, variant.y, 0, variant.newId);
    }

    const oldFlags = [];
    for (const variant of variants) oldFlags.push({ newId: variant.newId, originalId: variant.originalId });
    const newTableLength = FIRST_NORMAL_TILE + atlasCapacity + variants.length;
    tilesetObject.setIvar("passages", tableToUserDef(expandTileTable(tileset.passages, newTableLength, oldFlags)));
    tilesetObject.setIvar("priorities", tableToUserDef(expandTileTable(tileset.priorities, newTableLength, oldFlags)));
    if (tileset.terrain) {
      tilesetObject.setIvar("terrain_tags", tableToUserDef(expandTileTable(tileset.terrain, newTableLength, oldFlags)));
    }
    changedTilesets.add(parsed.tilesetId);

    mapObject.setIvar("data", tableToUserDef(parsed.table));
    mapObject.setIvar("dn_banner_cleanup_version", VERSION);
    mapObject.setIvar("dn_banner_cleanup_rows", entry.rows);
    mapWrites.push({ file: path.join(dataDir, filename), bytes: Buffer.from(marshalDump(mapObject)) });
    pngWrites.push({ file: graphicFile, bytes: canvas.toBuffer("image/png") });
    console.log(`  ${label}: Map${entry.id} · ${parsed.width}×${parsed.height} · banda ${entry.rows} filas · ${variants.length} tiles con flags clonados.`);
  }

  if (changedTilesets.size) {
    const bytes = Buffer.from(marshalDump(tilesetsRaw));
    if (APPLY) writeAtomic(path.join(dataDir, "Tilesets.rxdata"), bytes);
  }
  if (APPLY) {
    for (const write of pngWrites) writeAtomic(write.file, write.bytes);
    for (const write of mapWrites) writeAtomic(write.file, write.bytes);
  }
  return { skipped, changed: mapWrites.length };
}

function getCellFlag(parsedTileset, tileId, field) {
  const table = parsedTileset[field];
  return table ? tableGet(table, tileId, 0, 0) : 0;
}

function mapTilesOutsideBand(parsed, rows) {
  const values = [];
  for (let z = 0; z < parsed.table.z; z++) {
    for (let y = 0; y < parsed.height; y++) {
      for (let x = 0; x < parsed.width; x++) {
        if (z === 0 && y < rows) continue;
        values.push(tableGet(parsed.table, x, y, z));
      }
    }
  }
  return values;
}

function collisionSignature(parsedMap, parsedTileset) {
  const values = [];
  for (let z = 0; z < parsedMap.table.z; z++) {
    for (let y = 0; y < parsedMap.height; y++) {
      for (let x = 0; x < parsedMap.width; x++) {
        const tileId = tableGet(parsedMap.table, x, y, z);
        values.push([
          getCellFlag(parsedTileset, tileId, "passages"),
          getCellFlag(parsedTileset, tileId, "priorities"),
          getCellFlag(parsedTileset, tileId, "terrain"),
        ]);
      }
    }
  }
  return values;
}

function imageRegionHash(image, width, height) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, 0, 0, width, height, 0, 0, width, height);
  return sha256(Buffer.from(ctx.getImageData(0, 0, width, height).data));
}

async function verifyInstall(dataDir, graphicsDir, label) {
  for (const entry of plan.cleanupTargets) {
    const baseline = entry.baseline;
    if (!baseline) throw new Error(`Map${entry.id}: el plan no tiene huellas originales para verificación reproducible.`);
    const currentMapObject = readRx(dataDir, mapFile(entry.id));
    const currentMap = parseMap(currentMapObject);
    const currentTilesets = readRx(dataDir, "Tilesets.rxdata");
    const currentTileset = parseTileset(currentTilesets[currentMap.tilesetId]);
    const marker = Number(currentMapObject.getIvar("dn_banner_cleanup_version") ?? 0);
    const rowsMarker = Number(currentMapObject.getIvar("dn_banner_cleanup_rows") ?? 0);
    if (marker !== VERSION || rowsMarker !== entry.rows) {
      throw new Error(`Map${entry.id}: falta el marcador de depuración v${VERSION}.`);
    }
    if (currentMap.width !== baseline.width || currentMap.height !== baseline.height ||
        currentMap.tilesetId !== baseline.tilesetId) {
      throw new Error(`Map${entry.id}: cambiaron dimensiones o tileset.`);
    }
    const eventsHash = sha256(Buffer.from(marshalDump(currentMapObject.getIvar("events"))));
    if (eventsHash !== baseline.eventsSha256) throw new Error(`Map${entry.id}: los eventos cambiaron.`);
    if (hashJson(mapTilesOutsideBand(currentMap, entry.rows)) !== baseline.outsideBandTileSha256) {
      throw new Error(`Map${entry.id}: se modificaron tiles fuera de la banda superior.`);
    }
    if (hashJson(collisionSignature(currentMap, currentTileset)) !== baseline.collisionSha256) {
      throw new Error(`Map${entry.id}: cambiaron pasabilidad, prioridad o terreno en una o más celdas.`);
    }

    const graphicName = `DN_${entry.id}.png`;
    const currentImage = await loadImage(path.join(graphicsDir, graphicName));
    const appendRows = Math.ceil(entry.rows * currentMap.width / COLUMNS);
    if (currentImage.width !== baseline.atlasWidth ||
        currentImage.height !== baseline.atlasHeight + appendRows * TILE) {
      throw new Error(`Map${entry.id}: tamaño de atlas inesperado ${currentImage.width}×${currentImage.height}.`);
    }
    if (imageRegionHash(currentImage, baseline.atlasWidth, baseline.atlasHeight) !== baseline.atlasPixelSha256) {
      throw new Error(`Map${entry.id}: cambió el arte base fuera de las variantes añadidas.`);
    }
    const imageCanvas = createCanvas(currentImage.width, currentImage.height);
    const imageCtx = imageCanvas.getContext("2d");
    imageCtx.drawImage(currentImage, 0, 0);
    const pixels = imageCtx.getImageData(0, 0, currentImage.width, currentImage.height).data;
    let variantIndex = 0;
    for (let y = 0; y < entry.rows; y++) {
      for (let x = 0; x < currentMap.width; x++) {
        const currentId = tableGet(currentMap.table, x, y, 0);
        const expectedId = FIRST_NORMAL_TILE + baseline.atlasCapacity + variantIndex;
        if (currentId !== expectedId) throw new Error(`Map${entry.id} (${x},${y}): tile ${currentId}, se esperaba variante ${expectedId}.`);
        const sourceId = tableGet(currentMap.table, x, y + entry.rows, 0);
        const sourceIndex = sourceId - FIRST_NORMAL_TILE;
        if (sourceIndex < 0 || sourceIndex >= baseline.atlasCapacity) {
          throw new Error(`Map${entry.id} (${x},${y}): tile de origen fuera del atlas (${sourceId}).`);
        }
        const destinationIndex = baseline.atlasCapacity + variantIndex;
        const columns = baseline.atlasWidth / TILE;
        for (let py = 0; py < TILE; py++) {
          for (let px = 0; px < TILE; px++) {
            const sx = ((sourceIndex % columns) * TILE + px + currentImage.width * (Math.floor(sourceIndex / columns) * TILE + py)) * 4;
            const dx = ((destinationIndex % columns) * TILE + px + currentImage.width * (Math.floor(destinationIndex / columns) * TILE + py)) * 4;
            if (pixels[sx] !== pixels[dx] || pixels[sx + 1] !== pixels[dx + 1] ||
                pixels[sx + 2] !== pixels[dx + 2] || pixels[sx + 3] !== pixels[dx + 3]) {
              throw new Error(`Map${entry.id} (${x},${y}): la variante no reproduce la textura de la escena.`);
            }
          }
        }
        variantIndex++;
      }
    }
    console.log(`  ${label}: Map${entry.id} OK · eventos/dimensiones intactos · flags por celda idénticos · arte verificado.`);
  }
}

async function renderSamples() {
  fs.mkdirSync(RENDER_DIR, { recursive: true });
  for (const entry of plan.cleanupTargets) {
    const { canvas } = await renderMapId(entry.id);
    const file = path.join(RENDER_DIR, `Map${entry.id}_polished.png`);
    fs.writeFileSync(file, canvas.toBuffer("image/png"));
    console.log(`  render → ${path.relative(ROOT, file)}`);
  }
}

/**
 * Recalcula las huellas del plan a partir del estado instalado.
 *
 * Tras reconstruir los mapas del Dimensional Nightmare (nuevas propuestas de
 * pasabilidad), los eventos se recolocan unas pocas celdas y el atlas se
 * regenera: las huellas originales dejan de servir. Este modo las vuelve a
 * medir con exactamente las mismas funciones que usa la verificación, de modo
 * que "sin alterar eventos, dimensiones ni colisiones" siga siendo cierto
 * hacia delante.
 */
async function refreshPlan() {
  const tilesetsRaw = readRx(GAME_DATA, "Tilesets.rxdata");
  for (const entry of plan.cleanupTargets) {
    const mapObject = readRx(GAME_DATA, mapFile(entry.id));
    const parsed = parseMap(mapObject);
    const tileset = parseTileset(tilesetsRaw[parsed.tilesetId]);
    const image = await loadImage(path.join(GAME_GRAPHICS, `DN_${entry.id}.png`));
    // La pasada añade ceil(variantes / COLUMNS) filas al atlas: se descuentan
    // para recuperar las medidas previas a la limpieza.
    const appendRows = Math.ceil((parsed.width * entry.rows) / COLUMNS);
    const atlasWidth = image.width;
    const atlasHeight = image.height - appendRows * TILE;
    const atlasCapacity = (atlasWidth / TILE) * (atlasHeight / TILE);
    if (atlasHeight <= 0 || image.height % TILE !== 0) {
      throw new Error(`Map${entry.id}: atlas ${image.width}x${image.height} no cuadra con ${appendRows} filas añadidas.`);
    }
    entry.baseline = {
      width: parsed.width,
      height: parsed.height,
      tilesetId: parsed.tilesetId,
      atlasWidth,
      atlasHeight,
      atlasCapacity,
      atlasPixelSha256: imageRegionHash(image, atlasWidth, atlasHeight),
      eventsSha256: sha256(Buffer.from(marshalDump(mapObject.getIvar("events")))),
      outsideBandTileSha256: hashJson(mapTilesOutsideBand(parsed, entry.rows)),
      collisionSha256: hashJson(collisionSignature(parsed, tileset)),
    };
    console.log(`  Map${entry.id}: huellas recalculadas · ${parsed.width}x${parsed.height} · atlas ${atlasWidth}x${atlasHeight} (${appendRows} filas añadidas).`);
  }
  plan.refreshedAt = new Date().toISOString();
  fs.writeFileSync(PLAN, `${JSON.stringify(plan, null, 2)}\n`);
  console.log(`Plan de depuración actualizado: ${path.relative(ROOT, PLAN)} (${plan.cleanupTargets.length} objetivos).`);
}

async function main() {
  validateInventory();
  if (REFRESH) {
    await refreshPlan();
    return;
  }
  if (VERIFY) {
    await verifyInstall(GAME_DATA, GAME_GRAPHICS, "juego");
    await verifyInstall(QA_DATA, QA_GRAPHICS, "qa");
    console.log(`Verificados ${plan.auditedMapCount} mapas en inventario y ${plan.cleanupTargets.length} limpiezas visuales sin alterar eventos, dimensiones ni colisiones.`);
    return;
  }

  if (APPLY) ensureBackups();
  const gameResult = await prepareInstall(GAME_DATA, GAME_GRAPHICS, "juego");
  const qaResult = await prepareInstall(QA_DATA, QA_GRAPHICS, "qa");
  if (APPLY) {
    console.log(`Aplicado: juego ${gameResult.changed} mapas · QA ${qaResult.changed} mapas · ${gameResult.skipped + qaResult.skipped} ya estaban listos.`);
    if (RENDER) await renderSamples();
  } else {
    console.log(`Simulación: se depurarían ${plan.cleanupTargets.length} mapas en juego y QA; no se escribió ningún archivo.`);
  }
}

main().catch((error) => {
  console.error(`Error en depuración de mapas: ${error.stack ?? error.message}`);
  process.exitCode = 1;
});
