// ============================================================================
// app.js — Núcleo de PokeMod Studio: proyecto, guardado, backups, Kirin, mods
// ============================================================================
import { FS } from "./fs.js";
import { marshalLoad, marshalDump, RString, RObject, RHash } from "./marshal.js";
import {
  parseMap, parseEvent, parseTileset, mapListFromInfos, mapTree,
  systemNames, setSystemName, tableGet, cmdOf, rstr,
} from "./rmxp.js";
import { parsePBS, pbsToText } from "./pbs.js";
import { buildDemoProject } from "./demo.js";
import { createHistory } from "./history.js";
import { pad3, fmtBytes, fmtTime, zipStore, downloadBytes } from "./util.js";

const S = {
  connected: false,
  projectName: "",
  mapInfosObj: null,
  mapList: [],
  tree: [],
  tilesetsRaw: null,
  tilesets: new Map(), // id -> parsed
  systemObj: null,
  names: { switches: [], variables: [] },
  maps: new Map(), // id -> { info, parsed, dirty }
  lru: [],
  currentMap: null,
  currentEvent: null,
  currentPage: 0,
  pbs: new Map(), // rel -> { lines, dirty }
  pbsFiles: [],
  characters: [],
  tilesetFiles: [],
  autotileFiles: [],
  dirtyFiles: new Set(),
  sessionTs: "",
  backedUp: new Set(),
  log: [],
  scanning: false,
  scanCancel: false,
  missingMaps: new Set(), // MapInfos sin archivo Data/MapXXX.rxdata (el juego truena al entrar)
  brokenTilesets: new Map(), // tilesetId -> motivo ("" = el slot existe pero no tiene PNG)
  voidMaps: new Map(), // mapId -> fracción de celdas vacías (negro en el juego)
};

export { S };

let editInProgress = false;
function dispatchEditorEvent(name, detail = {}) {
  if (typeof document === "undefined" || typeof CustomEvent === "undefined") return;
  document.dispatchEvent(new CustomEvent(name, { detail }));
}
function dispatchHistoryState(state) {
  dispatchEditorEvent("pokemod-history", { ...state, pending: editInProgress });
}
const editHistory = createHistory({ onChange: dispatchHistoryState });

function emitHistoryState() {
  dispatchHistoryState(editHistory.state);
}

function captureEditTarget(target) {
  if (target.kind === "map") {
    const id = Number(target.id);
    const rec = S.maps.get(id);
    if (!rec) throw new Error(`Mapa ${id} no está cargado.`);
    return { payload: marshalDump(rec.parsed.obj), dirty: !!rec.dirty };
  }
  if (target.kind === "system") {
    return { payload: marshalDump(S.systemObj), dirty: false };
  }
  if (target.kind === "pbs") {
    const rel = String(target.path || "");
    const rec = S.pbs.get(rel);
    if (!rec) throw new Error(`PBS no está cargado: ${rel}`);
    return { payload: pbsToText(rec.lines), dirty: !!rec.dirty };
  }
  throw new Error(`Tipo de edición no compatible con el historial: ${target.kind}`);
}

function sameEditContent(a, b) {
  if (a.payload instanceof Uint8Array && b.payload instanceof Uint8Array) {
    if (a.payload.length !== b.payload.length) return false;
    for (let i = 0; i < a.payload.length; i++) if (a.payload[i] !== b.payload[i]) return false;
    return true;
  }
  return a.payload === b.payload;
}

async function restoreEditTarget(target, snapshot, direction) {
  const rollback = direction === "rollback";
  if (target.kind === "map") {
    const id = Number(target.id);
    const previous = S.maps.get(id);
    const rec = {
      info: previous?.info || S.mapList.find((m) => m.id === id) || null,
      parsed: parseMap(marshalLoad(snapshot.payload)),
      dirty: rollback ? !!snapshot.dirty : true,
    };
    S.maps.set(id, rec);
    touchLru(id);
  } else if (target.kind === "pbs") {
    const rec = S.pbs.get(target.path);
    if (!rec) throw new Error(`PBS no está cargado: ${target.path}`);
    rec.lines = parsePBS(snapshot.payload);
    rec.dirty = rollback ? !!snapshot.dirty : true;
  } else if (target.kind === "system") {
    const previousObj = S.systemObj;
    const previousNames = S.names;
    S.systemObj = marshalLoad(snapshot.payload);
    S.names = systemNames(S.systemObj);
    if (!rollback) {
      try { await saveSystem(); }
      catch (error) { S.systemObj = previousObj; S.names = previousNames; throw error; }
    }
  }
  dispatchEditorEvent("pokemod-dirty");
}

/** Agrupa una edición del editor como una única operación deshacer/rehacer. */
export async function runUndoableEdit(label, target, mutate) {
  if (editInProgress || editHistory.state.busy) throw new Error("Espera a que termine la edición actual.");
  const normalized = target.kind === "map"
    ? { kind: "map", id: Number(target.id) }
    : target.kind === "pbs"
      ? { kind: "pbs", path: String(target.path || "") }
      : { kind: target.kind };
  const before = captureEditTarget(normalized);
  editInProgress = true;
  emitHistoryState();
  try {
    const result = await mutate();
    const after = captureEditTarget(normalized);
    if (!sameEditContent(before, after)) {
      editHistory.record({
        label,
        before,
        after,
        equals: sameEditContent,
        measure: (snapshot) => snapshot.payload instanceof Uint8Array
          ? snapshot.payload.byteLength
          : new TextEncoder().encode(snapshot.payload).byteLength,
        restore: (snapshot, direction) => restoreEditTarget(normalized, snapshot, direction),
      });
    }
    return result;
  } catch (error) {
    try {
      const afterFailure = captureEditTarget(normalized);
      if (!sameEditContent(before, afterFailure)) await restoreEditTarget(normalized, before, "rollback");
    } catch (rollbackError) { log(`No se pudo revertir la edición fallida: ${rollbackError.message}`, "error"); }
    throw error;
  } finally {
    editInProgress = false;
    emitHistoryState();
  }
}

export function clearEditHistory() {
  editHistory.clear();
}

export async function undoEdit() {
  if (editInProgress) return null;
  const entry = await editHistory.undo();
  if (entry) dispatchEditorEvent("pokemod-history-applied", { action: "undo", label: entry.label });
  return entry;
}

export async function redoEdit() {
  if (editInProgress) return null;
  const entry = await editHistory.redo();
  if (entry) dispatchEditorEvent("pokemod-history-applied", { action: "redo", label: entry.label });
  return entry;
}

export function log(msg, kind = "info") {
  S.log.unshift({ t: new Date(), msg, kind });
  if (S.log.length > 200) S.log.pop();
  document.dispatchEvent(new CustomEvent("pokemod-log", { detail: { msg, kind } }));
}

// --- Conexión ----------------------------------------------------------------------
export async function connectDemo() {
  FS.reset();
  const mem = await buildDemoProject();
  await FS.connectDemo(mem, "Proyecto demo (PokeMod)");
  await loadProject();
}

export async function connectBrowser() {
  if (!window.showDirectoryPicker) throw new Error("Tu navegador no soporta File System Access. Usa Chrome/Edge de escritorio o la APK.");
  const h = await window.showDirectoryPicker({ mode: "readwrite" });
  FS.reset();
  await FS.connectBrowser(h);
  await loadProject();
}

export async function connectAndroid() {
  FS.reset();
  await FS.connectAndroid();
  await loadProject();
}

export async function connectFallback(files) {
  FS.reset();
  await FS.connectFallback(files);
  await loadProject();
}

// --- Carga del proyecto ---------------------------------------------------------------
export async function loadProject() {
  editHistory.clear();
  S.sessionTs = fmtTime();
  S.backedUp = new Set();
  S.maps.clear(); S.lru = [];
  S.pbs.clear(); S.pbsFiles = [];
  S.dirtyFiles.clear();
  S.currentMap = null; S.currentEvent = null; S.currentPage = 0;

  FS.onBeforeWrite = backupBeforeWrite;

  const need = ["Data/MapInfos.rxdata", "Data/System.rxdata", "Data/Tilesets.rxdata"];
  for (const f of need) {
    if (!(await FS.exists(f))) throw new Error(`No parece una carpeta de Fire Ash: falta ${f}`);
  }
  S.mapInfosObj = marshalLoad(await FS.readBytes("Data/MapInfos.rxdata"));
  S.mapList = mapListFromInfos(S.mapInfosObj);
  S.tree = mapTree(S.mapList);
  S.systemObj = marshalLoad(await FS.readBytes("Data/System.rxdata"));
  S.names = systemNames(S.systemObj);
  S.tilesetsRaw = marshalLoad(await FS.readBytes("Data/Tilesets.rxdata"));
  S.tilesets.clear();
  (S.tilesetsRaw || []).forEach((ts, i) => {
    if (!ts) return;
    try { S.tilesets.set(i, parseTileset(ts)); } catch (e) { console.warn("tileset", i, e); }
  });
  // PBS
  try {
    const items = await FS.list("PBS");
    S.pbsFiles = items.filter((i) => !i.isDir && i.name.toLowerCase().endsWith(".txt")).map((i) => i.path);
  } catch { S.pbsFiles = []; }
  // Graphics (listados para selectores)
  for (const [dir, key] of [["Graphics/Characters", "characters"], ["Graphics/Tilesets", "tilesetFiles"], ["Graphics/Autotiles", "autotileFiles"]]) {
    try {
      const items = await FS.list(dir);
      S[key] = items.filter((i) => !i.isDir && /\.(png|jpg|jpeg|bmp)$/i.test(i.name)).map((i) => i.name).sort((a, b) => a.localeCompare(b));
    } catch { S[key] = []; }
  }
  S.connected = true;
  S.projectName = FS.folderName;
  log(`Proyecto cargado: ${S.mapList.length} mapas, ${S.tilesets.size} tilesets, ${S.pbsFiles.length} PBS.`);
}

export async function loadMap(id) {
  id = Number(id);
  if (S.maps.has(id)) {
    touchLru(id);
    return S.maps.get(id);
  }
  let raw;
  try {
    raw = await FS.readBytes(`Data/Map${pad3(id)}.rxdata`);
  } catch (e) {
    // Caso real de Fire Ash: MapInfos tiene el mapa 2231 pero el archivo no
    // existe. El juego truena al entrar; PokeMod lo marca y no vuelve a fallar.
    S.missingMaps.add(Number(id));
    const err = new Error(`El mapa ${id} está en la lista pero falta Data/Map${pad3(id)}.rxdata (el juego daría error al entrar).`);
    err.code = "MISSING_MAP_FILE";
    throw err;
  }
  const parsed = parseMap(marshalLoad(raw));
  const info = S.mapList.find((m) => m.id === id);
  const rec = { info, parsed, dirty: false };
  S.maps.set(id, rec);
  touchLru(id);
  // LRU: máximo 25 mapas en memoria (teléfonos modestos)
  while (S.lru.length > 25) {
    const old = S.lru.shift();
    const r = S.maps.get(old);
    if (r && !r.dirty && old !== S.currentMap) S.maps.delete(old);
    else if (r && r.dirty) { S.lru.push(old); break; }
  }
  return rec;
}

function touchLru(id) {
  S.lru = S.lru.filter((x) => x !== id);
  S.lru.push(id);
}

export function getTileset(tilesetId) {
  const id = Number(tilesetId);
  const ts = S.tilesets.get(id);
  if (ts) return ts;
  // Sin fallback silencioso: devolver otro tileset dibujaba basura (parecía un mapa negro).
  if (!S.brokenTilesets.has(id)) {
    const slot = S.tilesetsRaw?.[id];
    const reason = !slot ? "no existe el indicador de tileset"
      : !rstr(slot.getIvar("tileset_name")) ? "el tileset no tiene imagen asignada"
      : "el tileset no se pudo leer";
    S.brokenTilesets.set(id, reason);
    log(`Aviso: mapa con tileset ${id} roto (${reason}).`, "warn");
  }
  return null;
}

export async function loadPBS(rel) {
  if (S.pbs.has(rel)) return S.pbs.get(rel);
  const text = await FS.readText(rel);
  const rec = { lines: parsePBS(text), dirty: false };
  S.pbs.set(rel, rec);
  return rec;
}

// --- Guardado (siempre con backup previo) --------------------------------------------------
export async function saveMap(id) {
  const rec = S.maps.get(Number(id));
  if (!rec) return;
  const bytes = marshalDump(rec.parsed.obj);
  await FS.writeBytes(`Data/Map${pad3(id)}.rxdata`, bytes);
  rec.dirty = false;
  S.dirtyFiles.add(`Data/Map${pad3(id)}.rxdata`);
  log(`Mapa ${id} guardado (${fmtBytes(bytes.length)}).`);
}

export async function saveSystem() {
  const bytes = marshalDump(S.systemObj);
  await FS.writeBytes("Data/System.rxdata", bytes);
  S.dirtyFiles.add("Data/System.rxdata");
  S.names = systemNames(S.systemObj);
  log("System.rxdata guardado (nombres de flags).");
}

export async function saveMapInfos() {
  const bytes = marshalDump(S.mapInfosObj);
  await FS.writeBytes("Data/MapInfos.rxdata", bytes);
  S.dirtyFiles.add("Data/MapInfos.rxdata");
  S.mapList = mapListFromInfos(S.mapInfosObj);
  S.tree = mapTree(S.mapList);
  log("MapInfos.rxdata guardado.");
}

export async function savePBS(rel) {
  const rec = S.pbs.get(rel);
  if (!rec) return;
  await FS.writeBytes(rel, new TextEncoder().encode(pbsToText(rec.lines)));
  rec.dirty = false;
  S.dirtyFiles.add(rel);
  log(`${rel} guardado.`);
}

export async function saveAll() {
  for (const [id, rec] of S.maps) if (rec.dirty) await saveMap(id);
  for (const [rel, rec] of S.pbs) if (rec.dirty) await savePBS(rel);
  log("Todo guardado. Las partidas no se tocaron.");
}

export function markMapDirty(id) {
  const rec = S.maps.get(Number(id));
  if (rec) rec.dirty = true;
}

// --- Backups automáticos ------------------------------------------------------------------
async function backupBeforeWrite(rel, _newBytes) {
  if (S.backedUp.has(rel)) return;
  try {
    const orig = await FS.readBytes(rel);
    const dest = `PokeModBackups/${S.sessionTs}/${rel}`;
    await FS.writeBytes(dest, orig, { internal: true });
    S.backedUp.add(rel);
    log(`Backup: ${rel} → ${dest}`);
  } catch (e) {
    // Si el archivo es nuevo (no existía), no hay nada que respaldar.
    if (!/No existe|not found|Missing/i.test(e.message)) log("Backup omitido (" + rel + "): " + e.message, "warn");
    S.backedUp.add(rel);
  }
}

export async function backupNow(label = "manual") {
  const ts = fmtTime();
  const files = ["Data/MapInfos.rxdata", "Data/System.rxdata", "Data/Tilesets.rxdata", "Game.ini", ...S.pbsFiles];
  // + saves (¡respaldarlas, nunca modificarlas!)
  const saves = await findSaves();
  let n = 0;
  for (const f of [...files, ...saves.map((s) => s.path)]) {
    try {
      const b = await FS.readBytes(f);
      await FS.writeBytes(`PokeModBackups/${ts}_${label}/${f}`, b, { internal: true });
      n++;
    } catch { /* no existe, se omite */ }
  }
  // + mapas sucios
  for (const [id, rec] of S.maps) {
    if (!rec.dirty) continue;
    const rel = `Data/Map${pad3(id)}.rxdata`;
    try {
      await FS.writeBytes(`PokeModBackups/${ts}_${label}/${rel}`, await FS.readBytes(rel), { internal: true });
      n++;
    } catch { /* noop */ }
  }
  log(`Copia de seguridad completa: ${n} archivos en PokeModBackups/${ts}_${label}/`);
  return ts + "_" + label;
}

export async function listBackups() {
  try {
    const items = await FS.list("PokeModBackups");
    return items.filter((i) => i.isDir).map((i) => i.name).sort().reverse();
  } catch { return []; }
}

export async function restoreBackup(folder, rel) {
  const b = await FS.readBytes(`PokeModBackups/${folder}/${rel}`);
  await FS.writeBytes(rel, b, { internal: true, skipBackup: true });
  // invalidar cachés
  const m = rel.match(/Map(\d+)\.rxdata/i);
  if (m) S.maps.delete(Number(m[1]));
  if (/MapInfos/i.test(rel)) { S.mapInfosObj = marshalLoad(await FS.readBytes(rel)); S.mapList = mapListFromInfos(S.mapInfosObj); S.tree = mapTree(S.mapList); }
  if (/System\.rxdata/i.test(rel)) { S.systemObj = marshalLoad(await FS.readBytes(rel)); S.names = systemNames(S.systemObj); }
  S.pbs.delete(rel);
  log(`Restaurado ${rel} desde ${folder}.`);
}

// --- Saves (solo lectura + backup) --------------------------------------------------------------
export async function findSaves() {
  const out = [];
  try {
    const root = await FS.list("");
    for (const it of root) {
      if (!it.isDir && /^(save.*|game)\.rxdata$/i.test(it.name)) out.push({ path: it.name, size: it.size });
    }
  } catch { /* noop */ }
  return out;
}

// --- Escaneo global (streaming, sin retener) ----------------------------------------------------
export async function scanAllMaps(fn, onProgress) {
  S.scanning = true; S.scanCancel = false;
  const results = [];
  let i = 0;
  for (const m of S.mapList) {
    if (S.scanCancel) break;
    i++;
    if (onProgress && i % 5 === 0) onProgress(i, S.mapList.length, m);
    try {
      const rec = await loadMap(m.id);
      const r = fn(m.id, rec.parsed, rec.info);
      if (r !== undefined && r !== null) {
        if (Array.isArray(r)) results.push(...r);
        else results.push(r);
      }
    } catch (e) {
      results.push({ _error: true, mapId: m.id, msg: e.message });
    }
  }
  S.scanning = false;
  return results;
}

// --- Chequeo Kirin / Android ----------------------------------------------------------------------
export async function kirinCheck(deep = false, onProgress = null) {
  const out = [];
  const push = (level, msg) => out.push({ level, msg });
  // 1. Estructura
  const has = async (f) => FS.exists(f);
  if (!(await has("Game.ini"))) push("error", "Falta Game.ini (¿carpeta correcta?)");
  else {
    try {
      const ini = await FS.readText("Game.ini");
      const title = (ini.match(/Title\s*=\s*(.+)/i) || [])[1];
      push("ok", `Game.ini [OK] Título: ${(title || "?").trim()}`);
    } catch { push("warn", "Game.ini ilegible"); }
  }
  for (const f of ["Data/MapInfos.rxdata", "Data/Tilesets.rxdata", "Data/System.rxdata", "Data/Scripts.rxdata"]) {
    push((await has(f)) ? "ok" : "error", `${(await has(f)) ? "[OK]" : "[X]"} ${f}`);
  }
  if (!(await has("Game.exe"))) push("warn", "No se ve Game.exe (Kirin lo usa como referencia; revisa que sea la carpeta completa)");
  else push("ok", "[OK] Game.exe presente");
  // 2. Archivos cifrados (Kirin necesita archivos EXTRAÍDOS)
  const all = await FS.walk("", 30000).catch(() => []);
  const enc = all.filter((p) => /\.(rgssad|rgss2a|rgss3a)$/i.test(p));
  if (enc.length) push("error", `Hay ${enc.length} archivo(s) cifrados (.rgssad): Kirin NO los lee. Extrae el juego en PC primero. Ej: ${enc[0]}`);
  else push("ok", "[OK] Sin .rgssad (archivos extraídos, como Kirin quiere)");
  // 3. Audio
  const audio = all.filter((p) => /^audio\//i.test(p));
  const mid = audio.filter((p) => /\.mid$/i.test(p));
  push("ok", `[OK] Audio: ${audio.length} archivos`);
  if (mid.length) push("warn", `${mid.length} MIDIs (.mid): en Android pueden sonar distinto o no sonar. No bloquea el juego.`);
  // 4. PBS (Essentials)
  const pbsCount = all.filter((p) => /^pbs\/.*\.txt$/i.test(p)).length;
  push(pbsCount ? "ok" : "warn", pbsCount ? `[OK] PBS de Essentials: ${pbsCount} archivos` : "Sin carpeta PBS (¿juego incompleto?)");
  // 5. Partidas
  const saves = await findSaves();
  if (saves.length) push("ok", `[OK] Partidas detectadas y PROTEGIDAS: ${saves.map((s) => `${s.path} (${fmtBytes(s.size)})`).join(", ")}`);
  else push("info", "Sin partidas todavía (se crean al jugar; PokeMod nunca las borra).");
  // 6. Análisis profundo: caja de archivos (Windows la perdona, Android NO)
  if (deep) {
    push("info", "Análisis profundo: cargando todos los mapas…");
    const wanted = new Set();
    await scanAllMaps((id, parsed) => {
      const ts = getTileset(parsed.tilesetId);
      if (ts) {
        if (ts.tilesetName) wanted.add(`Graphics/Tilesets/${ts.tilesetName}.png`);
        ts.autotiles.forEach((a) => { if (a) wanted.add(`Graphics/Autotiles/${a}.png`); });
      }
      for (const { obj } of parsed.events) {
        try {
          const ev = parseEvent(obj);
          for (const pg of ev.pages) {
            if (pg.graphic?.charName) wanted.add(`Graphics/Characters/${pg.graphic.charName}.png`);
          }
        } catch { /* noop */ }
      }
    }, onProgress);
    const mm = FS.caseMismatches([...wanted]);
    const missing = mm.filter((m) => !m.found);
    const wrongCase = mm.filter((m) => m.found);
    if (!missing.length && !wrongCase.length) push("ok", `[OK] Caja de archivos perfecta (${wanted.size} referencias revisadas)`);
    for (const m of wrongCase.slice(0, 20)) push("warn", `Caja distinta: el juego pide "${m.wanted}" pero el archivo es "${m.found}" (en PC funciona, en Kirin puede fallar)`);
    for (const m of missing.slice(0, 20)) push("error", `Falta gráfico: "${m.wanted}"`);
    if (wrongCase.length > 20) push("warn", `…y ${wrongCase.length - 20} diferencias de caja más`);
    if (missing.length > 20) push("error", `…y ${missing.length - 20} faltantes más`);
  }
  // 7. Consejos
  push("info", "Consejo Kirin: pon la carpeta en el ALMACENAMIENTO INTERNO (no microSD) y dale permiso de archivos.");
  push("info", "PokeMod escribe solo en Data/ y PBS/ (con backup). Nunca toca tus partidas.");
  return out;
}

// --- Caminabilidad (para warps seguros) --------------------------------------------------------------
// Un mapa RMXP dibuja negro todo lo que no tenga tile. Muchos mapas de Fire Ash
// son grandes con el decorado en el centro: el resto es vacío. Antes se buscaba
// la casilla caminable más cercana al centro y la Sala PokeMod (y cualquier
// warp) podía dejar al jugador en mitad del negro.
const VOID_CODES = new Set([48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63]);

/** Cuenta las celdas sin ningún tile (negro garantizado en el juego). */
export function emptyCellStats(parsed) {
  const t = parsed.table;
  let empty = 0;
  for (let i = 0; i < t.x * t.y; i++) {
    const z = i * t.z;
    if (!t.data[z] && !t.data[z + 1] && !t.data[z + 2]) empty++;
  }
  const total = Math.max(1, t.x * t.y);
  return { empty, total, pct: 100 * empty / total };
}

/**
 * ID de tile que hace de «fondo» del mapa (el vacío/negro o el suelo dominante).
 * Sirve para saber si una casilla aporta algo visible.
 */
function dominantTile(parsed) {
  const t = parsed.table;
  const hist = new Map();
  for (let i = 0; i < t.data.length; i++) {
    const v = t.data[i];
    if (!v) continue;
    hist.set(v, (hist.get(v) || 0) + 1);
  }
  let best = 0, bestN = -1;
  for (const [v, n] of hist) if (n > bestN) { best = v; bestN = n; }
  return { id: best, count: bestN, different: hist.size };
}

/**
 * Busca una casilla donde el jugador se vea y pueda andar.
 * @param {object} parsed mapa parseado
 * @param {object} tileset tileset parseado (passages)
 * @param {number} cx centro de búsqueda
 * @param {number} cy centro de búsqueda
 * @param {object} opts { maxR, avoidVoid }
 */
export function findWalkable(parsed, tileset, cx, cy, maxR = 40, opts = {}) {
  const { table, width, height } = parsed;
  const avoidVoid = opts.avoidVoid !== false;
  const { id: background, different } = dominantTile(parsed);
  const prio = tileset?.priorities?.data;
  const pas = tileset?.passages?.data;
  const tileAt = (x, y, z) => tableGet(table, x, y, z);

  const solid = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return false;
    let anyTile = false;
    for (let z = 0; z < 3; z++) {
      const id = tileAt(x, y, z);
      if (id < 8) continue;
      // id 48..63 sin autotile asignado es el «vacío» clásico de RMXP
      if (id >= 48 && id < 384) {
        const a = tileset?.autotiles?.[Math.floor(id / 48) - 1];
        if (!a) continue;
      }
      anyTile = true;
      if (id >= 384 && pas && id - 384 < pas.length) {
        const p = pas[id - 384];
        if ((p & 0x0f) === 0x0f) return false; // bloqueada
        if (prio && id - 384 < prio.length && prio[id - 384] > 4) return false; // techo
      }
    }
    return anyTile;
  };

  // ¿La casilla aporta algo visible o está rodeada de fondo/negro?
  const visible = (x, y) => {
    if (different <= 1) return true; // mapa de un solo tile: no hay con qué comparar
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        for (let z = 0; z < 3; z++) {
          const id = tileAt(nx, ny, z);
          if (id && id !== background) return true;
        }
      }
    }
    return false;
  };

  const rings = [];
  for (let r = 0; r <= maxR; r++) {
    if (r === 0) { rings.push([cx, cy]); continue; }
    for (let dx = -r; dx <= r; dx++) {
      for (const dy of [-r, r]) rings.push([cx + dx, cy + dy]);
    }
    for (let dy = -r + 1; dy <= r - 1; dy++) {
      for (const ddx of [-r, r]) rings.push([cx + ddx, cy + dy]);
    }
  }
  let firstWalkable = null;
  for (const [x, y] of rings) {
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    if (!solid(x, y)) continue;
    if (!firstWalkable) firstWalkable = { x, y };
    if (!avoidVoid || visible(x, y)) return { x, y };
  }
  return firstWalkable;
}

// --- MOD: Sala PokeMod (acceso total a mapas, 100% datos, reversible) ---------------------------------
function evCmd(code, params = [], indent = 0) {
  return new RObject("RPG::EventCommand", [["@code", code], ["@indent", indent], ["@parameters", params]]);
}
function salaEvent(id, name, x, y, list, gfxName = "", trigger = 1) {
  const cond = new RObject("RPG::Event::Page::Condition", [
    ["@switch1_valid", false], ["@switch1_id", 1], ["@switch2_valid", false], ["@switch2_id", 1],
    ["@variable_valid", false], ["@variable_id", 1], ["@variable_value", 0],
    ["@self_switch_valid", false], ["@self_switch_ch", RString.fromText("A")],
  ]);
  const gfx = new RObject("RPG::Event::Page::Graphic", [
    ["@tile_id", 0], ["@character_name", RString.fromText(gfxName)], ["@character_hue", 0],
    ["@direction", 2], ["@pattern", 1], ["@opacity", 255], ["@blend_type", 0],
  ]);
  const route = new RObject("RPG::MoveRoute", [["@repeat", true], ["@skippable", false], ["@list", []]]);
  const pg = new RObject("RPG::Event::Page", [
    ["@condition", cond], ["@graphic", gfx],
    ["@move_type", 0], ["@move_speed", 3], ["@move_frequency", 3], ["@move_route", route],
    ["@walk_anime", true], ["@step_anime", false], ["@direction_fix", false],
    ["@through", false], ["@always_on_top", false],
    ["@trigger", trigger], ["@list", list],
  ]);
  return new RObject("RPG::Event", [["@id", id], ["@name", RString.fromText(name)], ["@x", x], ["@y", y], ["@pages", [pg]]]);
}
function salaText(lines) {
  const out = [evCmd(101, [RString.fromText(""), 0, 0, 2])];
  for (const l of lines) out.push(evCmd(401, [RString.fromText(l)]));
  out.push(evCmd(0));
  return out;
}

export async function buildSalaMod({ entryMapId, doorX, doorY, doorGraphic, onProgress }) {
  const entryId = Number(entryMapId);
  const entry = await loadMap(entryId);
  const tilesetId = entry.parsed.tilesetId;
  const ts = getTileset(tilesetId);

  // 1. Destinos: todos los mapas con una casilla caminable
  const targets = [];
  const omitted = [];
  let i = 0;
  for (const m of S.mapList) {
    i++;
    if (onProgress) onProgress(i, S.mapList.length, m);
    try {
      const rec = await loadMap(m.id);
      const ts = getTileset(rec.parsed.tilesetId);
      const spot = findWalkable(rec.parsed, ts, rec.parsed.width >> 1, rec.parsed.height >> 1, 40, { avoidVoid: true });
      const stats = emptyCellStats(rec.parsed);
      if (spot) {
        // Nunca llevar al jugador a un mapa que es todo negro.
        if (stats.pct >= 99.5) omitted.push({ id: m.id, name: m.name, reason: "el mapa está vacío (todo negro)" });
        else targets.push({ id: m.id, name: m.name, x: spot.x, y: spot.y });
      } else omitted.push({ id: m.id, name: m.name, reason: "sin casilla caminable" });
    } catch (e) {
      omitted.push({ id: m.id, name: m.name, reason: e.message });
    }
  }
  if (!targets.length) throw new Error("No se encontró ningún destino válido.");

  // 2. Crear mapa sala
  const COLS = 32;
  const rows = Math.ceil(targets.length / COLS);
  const W = COLS, H = rows + 1; // fila 0 = info
  const newId = Math.max(...S.mapList.map((m) => m.id)) + 1;

  const { tableToUserDef } = await import("./rmxp.js");
  const data = new Uint16Array(W * H * 3);
  const T = (x, y, z, v) => { data[x + W * (y + H * z)] = v; };
  const hasAuto0 = ts && ts.autotiles[0];
  const hasAuto1 = ts && ts.autotiles[1];
  const A = hasAuto0 ? 48 : 384;   // autotile 0, patrón 0 (centro)
  const B = hasAuto1 ? 96 : A;     // autotile 1, patrón 0
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) T(x, y, 0, (x + y) % 2 ? A : B);

  const events = [];
  events.push(salaEvent(1, "ℹ Ayuda", 0, 0, salaText([
    "SALA POKEMOD — acceso total a mapas.",
    "Pisa una casilla para viajar a ese mapa.",
    "La casilla (1,0) te devuelve a la puerta.",
  ]), doorGraphic, 0));
  events.push(salaEvent(2, "↩ Volver", 1, 0, [
    evCmd(201, [0, entryId, doorX, doorY, 2, 0]), evCmd(0),
  ], "", 1));
  targets.forEach((t, k) => {
    const x = k % COLS, y = 1 + Math.floor(k / COLS);
    events.push(salaEvent(3 + k, `→ ${t.id}: ${t.name}`.slice(0, 40), x, y, [
      evCmd(201, [0, t.id, t.x, t.y, 2, 0]), evCmd(0),
    ]));
  });
  const evHash = new RHash(events.map((e) => [e.getIvar("@id"), e]));
  const audioFile = () => new RObject("RPG::AudioFile", [["@name", RString.fromText("")], ["@volume", 100], ["@pitch", 100]]);
  const salaMap = new RObject("RPG::Map", [
    ["@tileset_id", tilesetId], ["@width", W], ["@height", H],
    ["@autoplay_bgm", false], ["@bgm", audioFile()],
    ["@autoplay_bgs", false], ["@bgs", audioFile()],
    ["@encounter_list", []], ["@encounter_step", 30],
    ["@data", tableToUserDef({ dim: 3, x: W, y: H, z: 3, data })],
    ["@events", evHash],
  ]);

  // 3. Guardar sala + MapInfos (+ backup automático)
  await FS.writeBytes(`Data/Map${pad3(newId)}.rxdata`, marshalDump(salaMap), {});
  const info = new RObject("RPG::MapInfo", [
    ["@name", RString.fromText("Sala PokeMod")], ["@parent_id", 0], ["@order", 9999],
    ["@expanded", true], ["@scroll_x", 0], ["@scroll_y", 0],
  ]);
  S.mapInfosObj.pairs.push([newId, info]);
  await saveMapInfos();

  // 4. Puerta en el mapa de entrada
  const doorId = Math.max(0, ...entry.parsed.events.map((e) => e.id)) + 1;
  const door = salaEvent(doorId, "Sala PokeMod", doorX, doorY, [
    evCmd(201, [0, newId, 0, 0, 2, 0]), evCmd(0),
  ], doorGraphic, 0);
  const evHashEntry = entry.parsed.obj.getIvar("events");
  evHashEntry.pairs.push([doorId, door]);
  entry.parsed.events.push({ id: doorId, obj: door });
  markMapDirty(entryId);
  await saveMap(entryId);

  // 5. Meta para desinstalar
  const meta = { newId, entryId, doorId, ts: fmtTime(), targets: targets.length, omitted };
  await FS.writeBytes("PokeModBackups/sala_meta.json", new TextEncoder().encode(JSON.stringify(meta, null, 2)), { internal: true });

  S.mapList = mapListFromInfos(S.mapInfosObj);
  S.tree = mapTree(S.mapList);
  log(`Sala PokeMod creada: mapa ${newId} con ${targets.length} destinos. Puerta en mapa ${entryId} (${doorX},${doorY}).`);
  return meta;
}

export async function uninstallSalaMod() {
  let meta;
  try {
    meta = JSON.parse(await FS.readText("PokeModBackups/sala_meta.json"));
  } catch {
    throw new Error("No hay Sala PokeMod instalada (falta sala_meta.json).");
  }
  // Restaurar mapa de entrada (quitar puerta) y MapInfos desde el backup de sesión
  const session = S.sessionTs;
  // 1. Quitar puerta del mapa de entrada
  const entry = await loadMap(meta.entryId);
  const evHash = entry.parsed.obj.getIvar("events");
  evHash.pairs = evHash.pairs.filter(([k]) => Number(k) !== Number(meta.doorId));
  entry.parsed.events = entry.parsed.events.filter((e) => e.id !== Number(meta.doorId));
  markMapDirty(meta.entryId);
  await saveMap(meta.entryId);
  // 2. Quitar sala de MapInfos
  S.mapInfosObj.pairs = S.mapInfosObj.pairs.filter(([k]) => Number(k) !== Number(meta.newId));
  await saveMapInfos();
  S.maps.delete(Number(meta.newId));
  // 3. Borrar archivo del mapa sala
  await FS.deleteFile(`Data/Map${pad3(meta.newId)}.rxdata`);
  S.mapList = mapListFromInfos(S.mapInfosObj);
  S.tree = mapTree(S.mapList);
  log(`Sala PokeMod desinstalada (mapa ${meta.newId} eliminado, puerta retirada).`);
  return true;
}

// --- Exportar cambios (modo lectura / compartir) -----------------------------------------
export async function exportChangesZip() {
  const files = [];
  // En fallback, pendingWrites; si no, releer los sucios.
  if (FS.mode === "fallback") {
    for (const [rel, u8] of FS.pendingWrites) {
      if (rel.startsWith("PokeModBackups/")) continue;
      files.push([rel, u8]);
    }
  } else {
    for (const rel of S.dirtyFiles) {
      try { files.push([rel, await FS.readBytes(rel)]); } catch { /* noop */ }
    }
  }
  if (!files.length) throw new Error("No hay cambios para exportar.");
  const readme = `PokeMod Studio — cambios exportados ${new Date().toLocaleString()}
Carpeta origen: ${FS.folderName}

CÓMO APLICAR:
1. Haz copia de tu carpeta del juego (¡incluye tus partidas Save*.rxdata!).
2. Copia estos archivos SOBRE la carpeta del juego, respetando las rutas.
3. Tus partidas NO se tocan: este ZIP no incluye saves.

Archivos: ${files.length}
`;
  files.push(["POKEMOD_LEEME.txt", new TextEncoder().encode(readme)]);
  const zip = zipStore(files);
  downloadBytes(zip, `pokemod_cambios_${fmtTime()}.zip`, "application/zip");
  log(`ZIP exportado: ${files.length - 1} archivos.`);
}
