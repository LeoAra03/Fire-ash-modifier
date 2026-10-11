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
 * Uso: node tools/dn_apply_gameboy_palette.mjs [--verify]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { DATA, GAME, S, txt, iv, readMapRaw, writeMapRaw } from "./lib/dlc_helpers.mjs";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = path.join(ROOT_DIR, "content", "dimensional_nightmare_visual_contract.json");
const CONTRACT = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8"));
const GRAPHICS = path.join(GAME, "Graphics");
const CHARS = path.join(GRAPHICS, "Characters");
const BACKUP = path.join(GAME, "PokeModBackups", "dn_gameboy_palette");
const VERIFY_ONLY = process.argv.includes("--verify");
const GREEN = ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"].map((hex) => [
  Number.parseInt(hex.slice(1, 3), 16), Number.parseInt(hex.slice(3, 5), 16), Number.parseInt(hex.slice(5, 7), 16),
]);
const MAP_RANGES = CONTRACT.mapRanges;
const GREEN_SHARED_PREFIX = "DN_SHARED_";

const fileExists = (p) => fs.existsSync(p);
const isWithinRanges = (id) => MAP_RANGES.some(([lo, hi]) => id >= lo && id <= hi);
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
  if (basename === "ash_outfit_creep") {
    return path.join(BACKUP, "Characters", "ash_outfit_creep.png");
  }
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

/** 2×2 block reduction, then the four-tone classic Game Boy green palette. */
function transformPixels(imageData) {
  const { width, height } = imageData;
  const input = imageData.data;
  const blocks = [];
  const luminances = [];
  const channelLuma = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
  for (let y = 0; y < height; y += 2) for (let x = 0; x < width; x += 2) {
    let r = 0, g = 0, b = 0, count = 0;
    for (let by = y; by < Math.min(y + 2, height); by += 1) for (let bx = x; bx < Math.min(x + 2, width); bx += 1) {
      const i = (by * width + bx) * 4;
      const a = input[i + 3] / 255;
      if (!a) continue;
      r += input[i] * a; g += input[i + 1] * a; b += input[i + 2] * a; count += a;
    }
    if (!count) { blocks.push({ x, y, opaque: false, luma: 0 }); continue; }
    const luma = channelLuma(r / count, g / count, b / count);
    blocks.push({ x, y, opaque: true, luma });
    luminances.push(luma);
  }
  luminances.sort((a, b) => a - b);
  const thresholds = [quantile(luminances, 0.25), quantile(luminances, 0.5), quantile(luminances, 0.75)];
  const output = new Uint8ClampedArray(input);
  for (const block of blocks) {
    if (!block.opaque) continue;
    const [r, g, b] = GREEN[shadeFor(block.luma, thresholds)];
    for (let y = block.y; y < Math.min(block.y + 2, height); y += 1) for (let x = block.x; x < Math.min(block.x + 2, width); x += 1) {
      const i = (y * width + x) * 4;
      if (input[i + 3] === 0) continue;
      output[i] = r; output[i + 1] = g; output[i + 2] = b;
      // Se conserva cada píxel de alfa, por lo que bordes transparentes siguen limpios.
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

function mapIds() {
  const ids = new Set();
  for (const [lo, hi] of MAP_RANGES) for (let id = lo; id <= hi; id += 1) {
    if (fileExists(path.join(DATA, mapFile(id)))) ids.add(id);
  }
  return [...ids].sort((a, b) => a - b);
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

async function verifyArtwork() {
  const files = walkPngs(GRAPHICS).filter((file) => path.basename(file).startsWith("DN_")
    || file === path.join(CHARS, "ash_outfit_creep.png"));
  const errors = [];
  for (const file of files) {
    const image = await loadImage(file);
    const canvas = createCanvas(image.width, image.height);
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    const data = context.getImageData(0, 0, image.width, image.height).data;
    let visible = 0;
    for (let i = 0; i < data.length; i += 4) {
      // Canvas aplica redondeo de sRGB en semitransparencias al decodificar PNG.
      // Los píxeles opacos deben coincidir con uno de los cuatro tonos (±2 por canal).
      if (data[i + 3] < 250) continue;
      visible += 1;
      const matched = GREEN.some(([r, g, b]) => Math.abs(data[i] - r) <= 2 && Math.abs(data[i + 1] - g) <= 2 && Math.abs(data[i + 2] - b) <= 2);
      if (!matched) {
        errors.push(`${path.relative(GRAPHICS, file)}: color fuera de la paleta verde`);
        break;
      }
    }
    if (!visible) errors.push(`${path.relative(GRAPHICS, file)}: imagen vacía`);
  }
  return { files: files.length, errors };
}

async function verify() {
  const errors = [];
  const artwork = await verifyArtwork();
  errors.push(...artwork.errors);
  const ids = mapIds();
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

  // Cada mapa mantiene su terreno/tileset y sus comandos. Sólo cambia el charset visual.
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
  const artwork = walkPngs(GRAPHICS).filter((file) => path.basename(file).startsWith("DN_")
    || file === path.join(CHARS, "ash_outfit_creep.png"));
  for (const outputPath of artwork) {
    const relativePath = path.relative(GRAPHICS, outputPath);
    const sourcePath = imageSourceFor(relativePath);
    let stableSource = sourcePath;
    if (!path.basename(relativePath).startsWith(GREEN_SHARED_PREFIX)) {
      stableSource = makeBackup(outputPath, relativePath);
    }
    await colorizeFile(stableSource, outputPath);
  }
  console.log(`✔ Paleta Game Boy aplicada: ${artwork.length} recursos; ${recolored} charsets de eventos; ${patchedMaps} mapas y ${patchedPages} páginas ajustados.`);
  await verify();
}

if (VERIFY_ONLY) await verify();
else {
  try { await apply(); }
  catch (error) { console.error(`[dn-gameboy] ERROR: ${error.message}`); process.exit(1); }
}
