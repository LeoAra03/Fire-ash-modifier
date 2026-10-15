#!/usr/bin/env node
/**
 * Dimensión creepypasta — contrato visual B:
 *   · arte propio DN en paleta Game Boy verde de cuatro tonos;
 *   · reducción a una microcuadrícula visible de 16×16 px (2×2 dentro del tile RMXP 32×32);
 *   · copias DN de los gráficos de eventos, sin recolorear los recursos compartidos;
 *   · no más de 3 personajes visibles ni 1 Poké Ball por mapa.
 *
 * El juego usa tiles RMXP de 32 px; no se cambia el tamaño global, que rompería mapas
 * normales. Las referencias y originales se conservan en PokeModBackups/dn_gameboy_palette.
 *
 * Uso:
 *   node tools/dn_apply_gameboy_palette.mjs            # aplica paleta y máscara de un bit
 *   node tools/dn_apply_gameboy_palette.mjs --verify   # sólo comprueba
 *   node tools/dn_apply_gameboy_palette.mjs --selftest # comprobaciones sintéticas
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { DATA, GAME, RObject, S, txt, iv, readData, writeData, readMapRaw, writeMapRaw } from "./lib/dlc_helpers.mjs";
import { faltasDe, medirPng, reglas } from "./gbc_fidelidad.mjs";
import { pngRGBA } from "./forense/png.mjs";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = path.join(ROOT_DIR, "content", "dimensional_nightmare_visual_contract.json");
const ART_MANIFEST = path.join(ROOT_DIR, "content", "dimensional_nightmare_art.json");
const sha1 = (buf) => crypto.createHash("sha1").update(buf).digest("hex").slice(0, 12);
const CONTRACT = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8"));
const GRAPHICS = path.join(GAME, "Graphics");
const CHARS = path.join(GRAPHICS, "Characters");
const BACKUP = path.join(GAME, "PokeModBackups", "dn_gameboy_palette");
const VERIFY_ONLY = process.argv.includes("--verify");
const SELFTEST = process.argv.includes("--selftest");
const GREEN = ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"].map((hex) => [
  Number.parseInt(hex.slice(1, 3), 16), Number.parseInt(hex.slice(3, 5), 16), Number.parseInt(hex.slice(5, 7), 16),
]);
const MAP_RANGES = CONTRACT.mapRanges;
const GREEN_SHARED_PREFIX = "DN_SHARED_";
const GREEN_TILESET_PREFIX = "DN_GB_";

const fileExists = (p) => fs.existsSync(p);
const safeDecodeHex = (hex) => {
  if (!/^(?:[0-9a-f]{2})+$/i.test(hex)) return null;
  const value = Buffer.from(hex, "hex").toString("utf8");
  return value && !/[\\/]/.test(value) ? value : null;
};
const sharedName = (sourceName) => `${GREEN_SHARED_PREFIX}${Buffer.from(sourceName, "utf8").toString("hex")}`;
const decodeSharedName = (name) => name.startsWith(GREEN_SHARED_PREFIX) ? safeDecodeHex(name.slice(GREEN_SHARED_PREFIX.length)) : null;
const mapFile = (id) => `Map${String(id).padStart(3, "0")}.rxdata`;

function walkPngs(dir) {
  if (!fileExists(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkPngs(full));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".png")) files.push(full);
  }
  return files;
}

function resolveGraphicPath(dir, name) {
  const expected = path.join(dir, `${name}.png`);
  if (fileExists(expected)) return expected;
  const match = fs.readdirSync(dir).find((entry) => entry.toLowerCase() === `${name}.png`.toLowerCase());
  if (match) return path.join(dir, match);
  throw new Error(`falta el recurso gráfico ${path.join(dir, `${name}.png`)}`);
}

function eventEntriesForMap(mapId) {
  const raw = readMapRaw(mapId);
  const hash = iv(raw, "@events");
  return { raw, events: hash?.pairs ?? [] };
}

function baseCharacterName(name) {
  return decodeSharedName(name) ?? name;
}

function isActualItemBall(eventName) {
  return /(?:^|\b)(?:ITEM|POKEBALL|POK[EÉ]?BALL|MEDALLA|RELIQUIA|RECOMPENSA)(?:\b|_)/i.test(eventName);
}

function chooseSharedSource(baseName, eventName, keptBall) {
  if (baseName !== "Object ball" && baseName !== "Object ball special") return { source: baseName, keptBall };
  if (isActualItemBall(eventName) && !keptBall) return { source: baseName, keptBall: true };
  if (/DN_TOWN_MART/i.test(eventName)) return { source: "Object pokedex", keptBall };
  if (/^(?:DN_MAP_MEMORY|DN_STATUE_LORE|VITRINA_)/i.test(eventName)) return { source: "Object rock", keptBall };
  if (/^(?:HUB_|LIGA_|DN_TOWN_)/i.test(eventName)) return { source: "Object pokedex", keptBall };
  return { source: "Object rock", keptBall };
}

function imageSourceFor(relativePath) {
  const basename = path.basename(relativePath, ".png");
  const originalSharedName = decodeSharedName(basename);
  if (originalSharedName) return path.join(CHARS, `${originalSharedName}.png`);
  if (basename === "ash_outfit_creep") return path.join(BACKUP, "Characters", "ash_outfit_creep.png");
  return path.join(BACKUP, relativePath);
}

function makeBackup(original, relativePath) {
  const backupPath = path.join(BACKUP, relativePath);
  if (!fileExists(backupPath)) {
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.copyFileSync(original, backupPath);
  }
  return backupPath;
}

function makeDataBackup(relativePath, sourcePath) {
  const backupPath = path.join(BACKUP, "Data", relativePath);
  if (!fileExists(backupPath)) {
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.copyFileSync(sourcePath, backupPath);
  }
}

function makeSourceBackup(relativePath, sourcePath) {
  const backupPath = path.join(BACKUP, "tile_sources", relativePath);
  if (!fileExists(backupPath)) {
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.copyFileSync(sourcePath, backupPath);
  }
}

function shadeFor(luminance, thresholds) {
  if (luminance <= thresholds[0]) return 0;
  if (luminance <= thresholds[1]) return 1;
  if (luminance <= thresholds[2]) return 2;
  return 3;
}

function quantile(sorted, q) {
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * q))];
}

/**
 * 2×2 block reduction, then the four-tone classic Game Boy green palette.
 *
 * La máscara también es de la máquina: un bloque sólo sobrevive si su alfa medio llega al
 * umbral del contrato, y los píxeles que sobreviven quedan opacos (alfa 0 o 255). Donde la
 * GBC sólo permitía cuatro colores por sprite, el juego moderno no añade degradados: ni
 * tonos intermedios ni bordes suavizados por antialiasing.
 */
export function transformPixels(imageData, umbralAlfa = reglas().umbralAlfa) {
  const { width, height } = imageData;
  const input = imageData.data;
  const blocks = [];
  const luminances = [];
  const channelLuma = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
  for (let y = 0; y < height; y += 2) for (let x = 0; x < width; x += 2) {
    let r = 0, g = 0, b = 0, count = 0, alfa = 0, vistos = 0;
    for (let by = y; by < Math.min(y + 2, height); by += 1) for (let bx = x; bx < Math.min(x + 2, width); bx += 1) {
      const i = (by * width + bx) * 4;
      const a = input[i + 3] / 255;
      vistos += 1;
      alfa += input[i + 3];
      if (!a) continue;
      r += input[i] * a; g += input[i + 1] * a; b += input[i + 2] * a; count += a;
    }
    const alfaMedio = vistos ? alfa / vistos : 0;
    if (!count || alfaMedio < umbralAlfa) { blocks.push({ x, y, opaque: false, luma: 0, alfaMedio }); continue; }
    const luma = channelLuma(r / count, g / count, b / count);
    blocks.push({ x, y, opaque: true, luma, alfaMedio });
    luminances.push(luma);
  }
  luminances.sort((a, b) => a - b);
  const thresholds = [quantile(luminances, 0.25), quantile(luminances, 0.5), quantile(luminances, 0.75)];
  const output = new Uint8ClampedArray(input);
  for (const block of blocks) {
    const tono = block.opaque ? GREEN[shadeFor(block.luma, thresholds)] : null;
    for (let y = block.y; y < Math.min(block.y + 2, height); y += 1) for (let x = block.x; x < Math.min(block.x + 2, width); x += 1) {
      const i = (y * width + x) * 4;
      if (!tono) { output[i + 3] = 0; continue; }  // el bloque no llega al umbral: fuera
      output[i] = tono[0]; output[i + 1] = tono[1]; output[i + 2] = tono[2]; output[i + 3] = 255;
    }
  }
  return output;
}

async function colorizeFile(sourcePath, outputPath) {
  if (!fileExists(sourcePath)) throw new Error(`falta origen gráfico ${sourcePath}`);
  const image = await loadImage(sourcePath);
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, image.width, image.height);
  const result = transformPixels(imageData);
  imageData.data.set(result);
  context.putImageData(imageData, 0, 0);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, canvas.toBuffer("image/png"));
  return { width: image.width, height: image.height };
}

/** Deja constancia en el manifiesto de arte de la huella ya recoloreada. */
function recordArtPaletteHashes() {
  if (!fileExists(ART_MANIFEST)) return 0;
  const manifest = JSON.parse(fs.readFileSync(ART_MANIFEST, "utf8"));
  let recorded = 0;
  for (const item of manifest.assets ?? []) {
    const abs = path.join(GAME, item.out);
    if (!fileExists(abs)) continue;
    const hash = sha1(fs.readFileSync(abs));
    if (item.gbSha1 !== hash) {
      item.gbSha1 = hash;
      recorded += 1;
    }
    item.palette = "gameboy-green";
  }
  manifest.paletteAppliedAt = new Date().toISOString();
  fs.writeFileSync(ART_MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  return recorded;
}

function mapIds() {
  const ids = new Set();
  for (const [lo, hi] of MAP_RANGES) for (let id = lo; id <= hi; id += 1) {
    if (fileExists(path.join(DATA, mapFile(id)))) ids.add(id);
  }
  return [...ids].sort((a, b) => a - b);
}

async function applyGreenTilesets(ids) {
  const tilesetPath = path.join(DATA, "Tilesets.rxdata");
  const tilesets = readData("Tilesets.rxdata");
  const needed = new Map();
  const originalMapTilesets = new Map();
  for (const mapId of ids) {
    const map = readMapRaw(mapId);
    const tilesetId = Number(iv(map, "@tileset_id"));
    const tileset = tilesets[tilesetId];
    if (!tileset) throw new Error(`Map${mapId}: falta el tileset ${tilesetId}`);
    const name = txt(iv(tileset, "@tileset_name"));
    if (name.startsWith("DN_")) continue;
    needed.set(tilesetId, tileset);
    originalMapTilesets.set(mapId, tilesetId);
  }

  let nextId = tilesets.length;
  while (tilesets[nextId]) nextId += 1;
  const replacementIds = new Map();
  let cloned = 0, autotiles = 0;
  for (const [sourceId, source] of needed) {
    const sourceTilesetName = txt(iv(source, "@tileset_name"));
    const outputName = `${GREEN_TILESET_PREFIX}TS${sourceId}`;
    const outputPath = path.join(GRAPHICS, "Tilesets", `${outputName}.png`);
    const sourcePath = resolveGraphicPath(path.join(GRAPHICS, "Tilesets"), sourceTilesetName);
    makeSourceBackup(path.join("Tilesets", `${sourceTilesetName}.png`), sourcePath);
    await colorizeFile(sourcePath, outputPath);

    const sourceAutotiles = iv(source, "@autotile_names") ?? [];
    const outputAutotiles = [];
    for (let index = 0; index < sourceAutotiles.length; index += 1) {
      const sourceAutotileName = txt(sourceAutotiles[index]);
      if (!sourceAutotileName) { outputAutotiles.push(S("")); continue; }
      const outputAutotileName = `${GREEN_TILESET_PREFIX}TS${sourceId}_A${index}`;
      const autoSource = resolveGraphicPath(path.join(GRAPHICS, "Autotiles"), sourceAutotileName);
      const autoOutput = path.join(GRAPHICS, "Autotiles", `${outputAutotileName}.png`);
      makeSourceBackup(path.join("Autotiles", `${sourceAutotileName}.png`), autoSource);
      await colorizeFile(autoSource, autoOutput);
      outputAutotiles.push(S(outputAutotileName));
      autotiles += 1;
    }

    const clone = new RObject(source.className, source.ivars.map(([key, value]) => [key, value]));
    clone.setIvar("@id", nextId);
    clone.setIvar("@name", S(`DN Game Boy ${sourceId}`));
    clone.setIvar("@tileset_name", S(outputName));
    clone.setIvar("@autotile_names", outputAutotiles);
    tilesets[nextId] = clone;
    replacementIds.set(sourceId, nextId);
    nextId += 1;
    cloned += 1;
  }

  if (cloned) {
    makeDataBackup("Tilesets.rxdata", tilesetPath);
    writeData("Tilesets.rxdata", tilesets);
  }
  let reassigned = 0;
  for (const [mapId, oldId] of originalMapTilesets) {
    const map = readMapRaw(mapId);
    const file = path.join(DATA, mapFile(mapId));
    map.setIvar("@tileset_id", replacementIds.get(oldId));
    mapBackup(mapId, file);
    writeMapRaw(mapId, map);
    reassigned += 1;
  }
  return { cloned, autotiles, reassigned };
}

function plannedMapGraphics(ids) {
  const needed = new Map();
  for (const mapId of ids) {
    const { events } = eventEntriesForMap(mapId);
    for (const [, eventObj] of events) {
      const eventName = txt(iv(eventObj, "@name"));
      for (const page of iv(eventObj, "@pages") ?? []) {
        const graphic = iv(page, "@graphic");
        const name = txt(iv(graphic, "@character_name"));
        if (!name) continue;
        const base = baseCharacterName(name);
        if (base.startsWith("DN_")) continue;
        const chosen = chooseSharedSource(base, eventName, false).source;
        needed.set(chosen, path.join(CHARS, `${chosen}.png`));
      }
    }
  }
  return needed;
}

function mapBackup(mapId, mapPathname) {
  const destination = path.join(BACKUP, "maps", mapFile(mapId));
  if (!fileExists(destination)) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(mapPathname, destination);
  }
}

function isVisibleActor(eventName, characterName) {
  const base = baseCharacterName(characterName);
  if (!base || base.startsWith("Object ")) return false;
  // Estas UNOWN son puertas/rutas, no personajes. Los UNOWN llamados NPC_* sí cuentan.
  if (/^HUB_GRIETA_/.test(eventName)) return false;
  if (/^(?:DN_MAP_MEMORY|DN_STATUE_LORE|DN_PHASE_GUARD|DN_OPENING_SCENE|DN_DECISION_|DN_TOWN_CENTER|DN_TOWN_MART|HUB_SALIDA|HUB_PROGRESO|HUB_LIGA_OSCURA|VITRINA_|CONN_|ANOM_|LIGA_(?:ACCESO|SALIDA|CHISPA_))/i.test(eventName)) return false;
  if (base === "NPC 16" && /(?:Nurse|Curaci[oó]n|Healing)/i.test(eventName)) return true;
  return true;
}

function namesAndBallCount(mapId) {
  const { events } = eventEntriesForMap(mapId);
  let actors = 0, balls = 0;
  const violations = [];
  for (const [, eventObj] of events) {
    const eventName = txt(iv(eventObj, "@name"));
    let eventActor = false, eventBall = false;
    for (const page of iv(eventObj, "@pages") ?? []) {
      const name = txt(iv(iv(page, "@graphic"), "@character_name"));
      if (!name) continue;
      const base = baseCharacterName(name);
      if (base === "Object ball" || base === "Object ball special") eventBall = true;
      if (isVisibleActor(eventName, name)) eventActor = true;
      if (!name.startsWith("DN_")) violations.push(`${eventName}: sprite sin copia DN (${name})`);
      else if (!fileExists(path.join(CHARS, `${name}.png`))) violations.push(`${eventName}: falta Graphics/Characters/${name}.png`);
    }
    if (eventActor) actors += 1;
    if (eventBall) balls += 1;
  }
  return { actors, balls, violations };
}

/**
 * El arte de la dimensión se audita con la regla fijada en el contrato y con el lector PNG
 * propio (sin tolerancia de canal: el antialiasing que la máquina no podía dibujar cuenta
 * como fallo). La lista de archivos y la medida son las de `tools/gbc_fidelidad.mjs`.
 */
async function verifyArtwork() {
  const r0 = reglas();
  const files = walkPngs(GRAPHICS).filter((file) => path.basename(file).startsWith("DN_")
    || file === path.join(CHARS, "ash_outfit_creep.png"));
  const errors = [];
  for (const file of files) {
    const medida = medirPng(fs.readFileSync(file), r0);
    const faltas = faltasDe(medida, r0);
    if (faltas.length) errors.push(`${path.relative(GRAPHICS, file)}: ${faltas.join("; ")}`);
    if (!medida.pixeles) errors.push(`${path.relative(GRAPHICS, file)}: imagen vacía`);
  }
  return { files: files.length, errors };
}

function verifyTilesetCoverage(ids) {
  const tilesets = readData("Tilesets.rxdata");
  const errors = [];
  for (const mapId of ids) {
    const map = readMapRaw(mapId);
    const tilesetId = Number(iv(map, "@tileset_id"));
    const tileset = tilesets[tilesetId];
    if (!tileset) { errors.push(`Map${mapId}: falta el tileset ${tilesetId}`); continue; }
    const name = txt(iv(tileset, "@tileset_name"));
    if (!name.startsWith("DN_")) errors.push(`Map${mapId}: tileset fuera de la paleta Game Boy (${name})`);
    if (!fileExists(path.join(GRAPHICS, "Tilesets", `${name}.png`))) errors.push(`Map${mapId}: falta Graphics/Tilesets/${name}.png`);
    for (const autoName of (iv(tileset, "@autotile_names") ?? []).map(txt).filter(Boolean)) {
      if (!autoName.startsWith("DN_")) errors.push(`Map${mapId}: autotile fuera de la paleta Game Boy (${autoName})`);
      if (!fileExists(path.join(GRAPHICS, "Autotiles", `${autoName}.png`))) errors.push(`Map${mapId}: falta Graphics/Autotiles/${autoName}.png`);
    }
  }
  return errors;
}

async function verify() {
  const errors = [];
  const artwork = await verifyArtwork();
  errors.push(...artwork.errors);
  const ids = mapIds();
  errors.push(...verifyTilesetCoverage(ids));
  for (const id of ids) {
    const { actors, balls, violations } = namesAndBallCount(id);
    errors.push(...violations.map((message) => `Map${id}: ${message}`));
    if (actors > CONTRACT.maxVisibleCharactersPerMap) errors.push(`Map${id}: ${actors} personajes visibles (máximo ${CONTRACT.maxVisibleCharactersPerMap})`);
    if (balls > CONTRACT.maxVisiblePokeballsPerMap) errors.push(`Map${id}: ${balls} Poké Balls visibles (máximo ${CONTRACT.maxVisiblePokeballsPerMap})`);
  }
  if (errors.length) {
    console.error(`✘ Contrato Game Boy: ${errors.length} problema(s)`);
    for (const error of errors.slice(0, 24)) console.error(`  · ${error}`);
    process.exit(1);
  }
  console.log(`✔ Contrato Game Boy: ${artwork.files} imágenes en paleta verde, ${ids.length} mapas, ≤${CONTRACT.maxVisibleCharactersPerMap} personajes y ≤${CONTRACT.maxVisiblePokeballsPerMap} Poké Ball por mapa.`);
}

async function apply() {
  const ids = mapIds();
  const tilesetStats = await applyGreenTilesets(ids);
  const requested = plannedMapGraphics(ids);
  const sharedFiles = new Map();
  for (const [sourceName, sourcePath] of requested) {
    if (!fileExists(sourcePath)) throw new Error(`no existe el charset base ${sourceName}.png`);
    const outputName = sharedName(sourceName);
    const outputPath = path.join(CHARS, `${outputName}.png`);
    sharedFiles.set(sourceName, { outputName, outputPath, sourcePath });
  }

  let recolored = 0;
  for (const { outputName, outputPath, sourcePath } of sharedFiles.values()) {
    await colorizeFile(sourcePath, outputPath);
    recolored += 1;
  }

  // Cada mapa conserva el mismo tileset, autotiles, pasabilidad y celdas RMXP;
  // las copias DN cambian sólo la paleta, sin tocar la geometría del terreno.
  let patchedMaps = 0, patchedPages = 0;
  for (const mapId of ids) {
    const file = path.join(DATA, mapFile(mapId));
    const { raw, events } = eventEntriesForMap(mapId);
    const keptBallByMap = { value: false };
    let changed = false;
    for (const [, eventObj] of events) {
      const eventName = txt(iv(eventObj, "@name"));
      const pages = iv(eventObj, "@pages") ?? [];
      const eventKeepsBall = !keptBallByMap.value && isActualItemBall(eventName) && pages.some((page) => {
        const name = txt(iv(iv(page, "@graphic"), "@character_name"));
        const base = baseCharacterName(name);
        return base === "Object ball" || base === "Object ball special";
      });
      if (eventKeepsBall) keptBallByMap.value = true;
      for (const page of pages) {
        const graphic = iv(page, "@graphic");
        const currentName = txt(iv(graphic, "@character_name"));
        if (!currentName) continue;
        const decoded = baseCharacterName(currentName);
        const isBall = decoded === "Object ball" || decoded === "Object ball special";
        const source = eventKeepsBall && isBall ? decoded : chooseSharedSource(decoded, eventName, keptBallByMap.value).source;
        const nextName = source.startsWith("DN_") ? source : sharedName(source);
        if (currentName !== nextName) {
          graphic.setIvar("@character_name", S(nextName));
          changed = true;
          patchedPages += 1;
        }
      }
    }
    if (changed) {
      mapBackup(mapId, file);
      writeMapRaw(mapId, raw);
      patchedMaps += 1;
    }
  }

  // Conserva originales de DN y del traje creep; la salida siempre se regenera
  // desde la copia sin cuantizar para que la operación sea idempotente.
  const artwork = walkPngs(GRAPHICS).filter((file) => {
    const name = path.basename(file);
    return (name.startsWith("DN_") && !name.startsWith(GREEN_TILESET_PREFIX))
      || file === path.join(CHARS, "ash_outfit_creep.png");
  });
  for (const outputPath of artwork) {
    const relativePath = path.relative(GRAPHICS, outputPath);
    const sourcePath = imageSourceFor(relativePath);
    let stableSource = sourcePath;
    if (!path.basename(relativePath).startsWith(GREEN_SHARED_PREFIX)) {
      stableSource = makeBackup(outputPath, relativePath);
    }
    await colorizeFile(stableSource, outputPath);
  }
  const allGameboyImages = walkPngs(GRAPHICS).filter((file) => path.basename(file).startsWith("DN_")
    || file === path.join(CHARS, "ash_outfit_creep.png"));
  recordArtPaletteHashes();
  console.log(`✔ Paleta Game Boy aplicada: ${allGameboyImages.length} imágenes; ${recolored} charsets, ${tilesetStats.cloned} tilesets y ${tilesetStats.autotiles} autotiles copiados; ${tilesetStats.reassigned} mapas usan tilesets verdes, ${patchedMaps} mapas/${patchedPages} páginas de eventos ajustados.`);
  await verify();
}

/* ───────────────────────────── autocomprobación ─────────────────────────── */

/**
 * La transformación se comprueba sin ROM ni backups: un degradado sintético (rampa de
 * color y borde semitransparente) tiene que salir en cuatro tonos planos y alfa 0/255.
 */
function selftest() {
  let ok = 0;
  const afirma = (cond, mensaje) => { if (!cond) throw new Error(`selftest: ${mensaje}`); ok += 1; };
  const r0 = reglas();
  const ancho = 16, alto = 16;
  const ALFA_DIFUSA = 40;
  const umbral = 2; // dos filas: un bloque de la reducción 2×2 completo
  const data = new Uint8ClampedArray(ancho * alto * 4);
  for (let y = 0; y < alto; y++) for (let x = 0; x < ancho; x++) {
    const i = (y * ancho + x) * 4;
    data[i] = 30 + x * 12; data[i + 1] = 60 + y * 10; data[i + 2] = 40 + x * 6;
    // La banda superior entra con alfa 40: por debajo del umbral, es un borde difuso que
    // la máquina no podía dibujar (el bloque de 2×2 se mide entero, como su píxel).
    data[i + 3] = y < umbral ? ALFA_DIFUSA : 255;
  }
  const salida = transformPixels({ width: ancho, height: alto, data }, r0.umbralAlfa);
  const medida = medirPng(pngRGBA(ancho, alto, salida), r0);
  afirma(!faltasDe(medida, r0).length, "la transformación deja el sprite dentro de la regla (cuatro tonos, máscara de un bit)");
  afirma(medida.fueraPaleta === 0 && medida.alfaParcial === 0, "no quedan tonos intermedios ni alfa parcial");
  afirma(medida.coloresDistintos >= 3 && medida.coloresDistintos <= 4, "el degradado original se resuelve en tres o cuatro tonos planos");
  afirma(medida.celdaMaxColores <= r0.maxColoresPorSprite, "ninguna microcelda usa más tonos de los permitidos");
  const filasDifusas = [...salida.slice(0, ancho * umbral * 4)].filter((_, i) => i % 4 === 3);
  afirma(filasDifusas.every((a) => a === 0), "un borde que no llega al umbral queda transparente del todo");
  const alfaResto = [...salida.slice(ancho * umbral * 4)].filter((_, i) => i % 4 === 3);
  afirma(alfaResto.every((a) => a === 0 || a === 255), "el resto del sprite es opaco o transparente, nunca intermedio");
  console.log(`OK: autocomprobación de la paleta Game Boy (${ok} comprobaciones)`);
}

/* ─────────────────────────────────── main ───────────────────────────────── */

if (SELFTEST) selftest();
else if (VERIFY_ONLY) await verify();
else {
  try { await apply(); }
  catch (error) { console.error(`[dn-gameboy] ERROR: ${error.message}`); process.exit(1); }
}
