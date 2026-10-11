#!/usr/bin/env node
/**
 * apply_rom_campaigns_real.mjs — instala los mapas REALES de los ROMs invitados.
 *
 * Sustituye los mapas «adaptados» (pintados con donantes de Fire Ash) por el
 * mapa tal como lo dibuja el ROM: mismas dimensiones, mismas celdas, mismos
 * tiles, y los sprites de NPC del propio ROM. Los eventos que ya estaban
 * instalados y verificados (guiones, batallas, warps, retorno libre) se
 * conservan: sólo se recolocan sobre el mapa real y se les cambia la ropa.
 *
 * Todo lo que necesita lo lee de `reference/roms_invitados_extraidos/<slug>/`:
 *   catalogo.json · tilesets/*.png · npcs/*.png
 *
 * Uso:
 *   node tools/apply_rom_campaigns_real.mjs --slug glazed
 *   node tools/apply_rom_campaigns_real.mjs --all
 *   node tools/apply_rom_campaigns_real.mjs --all --verify
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { marshalLoad, marshalDump, RObject, RString } from "../web/js/marshal.js";
import { tableToUserDef } from "../web/js/rmxp.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GAME = path.join(ROOT, "pokemon_fire_ash");
const DATA = path.join(GAME, "Data");
const GRAPHICS = path.join(GAME, "Graphics");
const EXTRA = path.join(ROOT, "reference", "roms_invitados_extraidos");
const BACKUP = path.join(GAME, "PokeModBackups", "rom_campaigns_real");
const PLAN = path.join(ROOT, "content", "rom_campaigns_complete.json");
const CATALOGO_TILESETS = path.join(ROOT, "content", "rom_tilesets_reales.json");

const argv = process.argv.slice(2);
const arg = (n, d = null) => { const i = argv.indexOf(`--${n}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
const ALL = argv.includes("--all");
const VERIFY = argv.includes("--verify");
const SLUGS = ALL ? null : [arg("slug")].filter(Boolean);
if (!ALL && !SLUGS.length) throw new Error("indica --slug <nombre> o --all");

const pad3 = (n) => String(n).padStart(3, "0");
const S = (v) => RString.fromText(String(v));
const txt = (v) => (v && v.bytes ? Buffer.from(v.bytes).toString("utf8") : String(v ?? ""));
const readRx = (f) => marshalLoad(fs.readFileSync(path.join(DATA, f)));
const writeRx = (f, v) => fs.writeFileSync(path.join(DATA, f), Buffer.from(marshalDump(v)));

/* ───────────────────────── pasabilidad desde el arte ───────────────────── */

/** Un tile del atlas es «sólido» si casi todos sus píxeles son opacos. */
async function solidezDeAtlas(ruta, { lado = 32 } = {}) {
  const img = await loadImage(fs.readFileSync(ruta));
  const cols = Math.floor(img.width / lado);
  const filas = Math.floor(img.height / lado);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const datos = ctx.getImageData(0, 0, img.width, img.height).data;
  const solidos = [];
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < cols; c++) {
      let opacos = 0, total = 0;
      for (let y = 0; y < lado; y++) {
        for (let x = 0; x < lado; x++) {
          const p = (((f * lado + y) * img.width) + (c * lado + x)) * 4;
          total++;
          if (datos[p + 3] > 200) opacos++;
        }
      }
      solidos.push(opacos / total);
    }
  }
  return { columnas: cols, filas, solidos };
}

/* ───────────────────────────── instalación ─────────────────────────────── */

function respaldar(archivo) {
  fs.mkdirSync(BACKUP, { recursive: true });
  const destino = path.join(BACKUP, archivo);
  if (!fs.existsSync(destino)) fs.copyFileSync(path.join(DATA, archivo), destino);
}

/** Crea (o reutiliza) el tileset RMXP del atlas real de un ROM. */
function instalarTileset(tilesets, nombre, solidos) {
  const existente = tilesets.find((t, i) => i > 0 && t && t.getIvar("@tileset_name")?.text === nombre);
  if (existente) return { id: Number(existente.getIvar("@id")), nuevo: false };
  const id = tilesets.findIndex((t, i) => i > 0 && t === null);
  const libre = id > 0 ? id : tilesets.length;
  const plantilla = tilesets[1];
  const clone = new RObject(plantilla.className, plantilla.ivars.map(([k, v]) => [k, v]));
  clone.setIvar("@id", libre);
  clone.setIvar("@tileset_name", S(nombre));
  clone.setIvar("@name", S(nombre));
  const total = 384 + solidos.length; // 384 = bloque de autotiles (fijo en RMXP)
  const passages = new Uint16Array(total);
  const priorities = new Uint16Array(total);
  for (let i = 0; i < solidos.length; i++) {
    // Sólido = arte casi opaco (muros, edificios, vallas). El resto queda transitable.
    passages[384 + i] = solidos[i] >= 0.97 ? 0x0f : 0;
  }
  clone.setIvar("@passages", tableToUserDef({ dim: 1, x: total, y: 1, z: 1, data: passages }));
  clone.setIvar("@priorities", tableToUserDef({ dim: 1, x: total, y: 1, z: 1, data: priorities }));
  clone.setIvar("@terrain_tags", tableToUserDef({ dim: 1, x: total, y: 1, z: 1, data: new Uint16Array(total) }));
  clone.setIvar("@autotile_names", Array.from({ length: 7 }, () => S("")));
  tilesets[libre] = clone;
  return { id: libre, nuevo: true };
}

/** Mueve un evento a la celda transitable más cercana dentro del mapa. */
function celdaSegura(pass, x, y, ancho, alto, ocupadas) {
  const libre = (cx, cy) => cx >= 0 && cy >= 0 && cx < ancho && cy < alto
    && pass.passable(cx, cy, 8) && !ocupadas.has(`${cx},${cy}`);
  if (libre(x, y)) return [x, y];
  for (let radio = 1; radio < Math.max(ancho, alto); radio++) {
    for (let dy = -radio; dy <= radio; dy++) {
      for (let dx = -radio; dx <= radio; dx++) {
        if (Math.abs(dx) !== radio && Math.abs(dy) !== radio) continue;
        const cx = x + dx, cy = y + dy;
        if (libre(cx, cy)) return [cx, cy];
      }
    }
  }
  for (let cy = 0; cy < alto; cy++) for (let cx = 0; cx < ancho; cx++) if (pass.passable(cx, cy, 8)) return [cx, cy];
  return [0, 0];
}

async function instalarCampana(slug, campana, tilesets, mapaTilesets, graficosNpc) {
  const dir = path.join(EXTRA, slug);
  const catalogo = JSON.parse(fs.readFileSync(path.join(dir, "catalogo.json"), "utf8"));
  const porMapa = new Map(catalogo.mapas.map((m) => [m.mapa, m]));
  const atlasDir = path.join(dir, "tilesets");
  const solidosCache = new Map();
  const resultado = { slug, mapas: 0, tilesetsNuevos: 0, npcs: 0, movidos: 0, sinCatalogo: [] };

  for (const [indiceMapa, entrada] of campana.maps.entries()) {
    const info = porMapa.get(`Map${entrada.mapId}`);
    if (!info) { resultado.sinCatalogo.push(entrada.mapId); continue; }
    const archivo = `Map${pad3(entrada.mapId)}.rxdata`;
    const actual = readRx(archivo);
    respaldar(archivo);

    // --- tileset real
    const nombreTs = `ROM_${slug.toUpperCase()}_${info.tileset.replace(`${slug}_`, "")}`;
    const definicion = catalogo.tilesets[info.tileset];
    if (!solidosCache.has(info.tileset)) {
      solidosCache.set(info.tileset, { arte: await solidezDeAtlas(path.join(atlasDir, `${info.tileset}.png`)), definicion });
    }
    const arte = solidosCache.get(info.tileset).arte;
    const { id: idTileset, nuevo } = instalarTileset(tilesets, nombreTs, arte.solidos);
    if (nuevo) {
      resultado.tilesetsNuevos++;
      fs.mkdirSync(path.join(GRAPHICS, "Tilesets"), { recursive: true });
      fs.copyFileSync(path.join(atlasDir, `${info.tileset}.png`), path.join(GRAPHICS, "Tilesets", `${nombreTs}.png`));
    }
    mapaTilesets[entrada.mapId] = { nombre: nombreTs, id: idTileset, tiles: info.tileset };

    // --- mapa real: mismas dimensiones y mismas celdas del ROM
    const ancho = info.ancho, alto = info.alto;
    const ids = definicion.ids;
    const casilla = new Map(ids.map((id, k) => [id, 384 + k])); // 0..383 = autotiles
    const data = new Uint16Array(ancho * alto * 3);
    for (let i = 0; i < ancho * alto; i++) {
      const idRom = parseInt(info.tiles.substr(i * 2, 2), 36) || 0;
      data[i] = casilla.get(idRom) ?? 0;
    }
    const tabla = { dim: 3, x: ancho, y: alto, z: 3, data };

    const pass = { passable: (x, y, d) => {
      const t = data[x + y * ancho];
      const solidez = t >= 384 ? (arte.solidos[t - 384] ?? 0) : 0;
      return solidez < 0.97;
    } };

    // --- eventos: se conservan y se recolocan
    const ocupadas = new Set();
    let movidos = 0;
    const listaNpc = [];
    for (const [, ev] of actual.getIvar("@events").pairs) {
      const nombre = txt(ev.getIvar("@name"));
      if (/NPC — /.test(nombre)) listaNpc.push(ev);
    }
    for (const [, ev] of actual.getIvar("@events").pairs) {
      const x = Number(ev.getIvar("@x")), y = Number(ev.getIvar("@y"));
      const [nx, ny] = celdaSegura(pass, x, y, ancho, alto, ocupadas);
      if (nx !== x || ny !== y) movidos++;
      ocupadas.add(`${nx},${ny}`);
      ev.setIvar("@x", nx); ev.setIvar("@y", ny);
    }

    // --- sprites de NPC reales
    const charsetDir = path.join(dir, "npcs");
    const disponibles = Object.keys(catalogo.graficosNpc).map(Number).sort((a, b) => a - b);
    // El ROM lista los personajes del mapa en orden; se usan tal cual y se
    // completan con los demás gráficos del ROM si el mapa trae menos.
    const delMapa = (info.npcs ?? []).filter((n) => catalogo.graficosNpc[n] !== undefined);
    const orden = [...new Set([...delMapa, ...disponibles])];
    // Los mapas de campaña traen el mismo puñado de NPCs: se rota el catálogo de
    // sprites del ROM para que en el conjunto de la campaña aparezcan todos.
    const turno = orden.length ? (indiceMapa * 3) % orden.length : 0;
    listaNpc.forEach((ev, i) => {
      const gfxId = orden[(i + turno) % Math.max(1, orden.length)];
      if (gfxId === undefined) return;
      const nombreGfx = `ROM_${slug.toUpperCase()}_GFX_${gfxId}`;
      const origen = path.join(charsetDir, `${slug}_GFX_${gfxId}.png`);
      if (!fs.existsSync(origen)) return;
      if (!graficosNpc.has(nombreGfx)) {
        fs.mkdirSync(path.join(GRAPHICS, "Characters"), { recursive: true });
        fs.copyFileSync(origen, path.join(GRAPHICS, "Characters", `${nombreGfx}.png`));
        graficosNpc.add(nombreGfx);
        resultado.npcs++;
      }
      for (const page of ev.getIvar("@pages")) {
        page.getIvar("@graphic")?.setIvar("@character_name", S(nombreGfx));
      }
    });

    actual.setIvar("@tileset_id", idTileset);
    actual.setIvar("@width", ancho);
    actual.setIvar("@height", alto);
    actual.setIvar("@data", tableToUserDef(tabla));
    writeRx(archivo, actual);
    resultado.mapas++;
  }
  return resultado;
}

/* ──────────────────────────────── programa ────────────────────────────── */

const plan = JSON.parse(fs.readFileSync(PLAN, "utf8"));
const campanas = Array.isArray(plan.campaigns) ? plan.campaigns : Object.values(plan.campaigns);
const tilesets = readRx("Tilesets.rxdata");
const mapaTilesets = fs.existsSync(CATALOGO_TILESETS) ? JSON.parse(fs.readFileSync(CATALOGO_TILESETS, "utf8")).mapas ?? {} : {};
const graficosNpc = new Set();
const resultados = [];

for (const campana of campanas) {
  const slug = campana.id;
  if (SLUGS && !SLUGS.includes(slug)) continue;
  if (!fs.existsSync(path.join(EXTRA, slug, "catalogo.json"))) {
    console.log(`· ${slug}: sin extracción real (falta reference/roms_invitados_extraidos/${slug})`);
    continue;
  }
  const r = await instalarCampana(slug, campana, tilesets, mapaTilesets, graficosNpc);
  resultados.push(r);
  console.log(`✔ ${slug}: ${r.mapas} mapas reales · ${r.tilesetsNuevos} tilesets nuevos · ${r.npcs} sprites de NPC · ${r.movidos} eventos recolocados`);
}

respaldar("Tilesets.rxdata");
writeRx("Tilesets.rxdata", tilesets);
fs.writeFileSync(CATALOGO_TILESETS, `${JSON.stringify({
  title: "Tilesets reales de los ROMs invitados",
  generatedBy: "tools/apply_rom_campaigns_real.mjs",
  nota: "Atlas de metatiles compuestos desde el ROM (32 px por celda) y usados por los mapas de campaña.",
  mapas: mapaTilesets,
  campanas: resultados,
}, null, 1)}\n`);

if (VERIFY) {
  let fallos = 0;
  const ok = (c, m) => { if (!c) { fallos++; console.error(`  FALLA: ${m}`); } };
  for (const r of resultados) {
    ok(r.mapas > 0, `${r.slug}: sin mapas instalados`);
    ok(r.sinCatalogo.length === 0, `${r.slug}: ${r.sinCatalogo.length} mapas sin extracción real`);
  }
  const ts = readRx("Tilesets.rxdata");
  for (const [mapa, info] of Object.entries(mapaTilesets)) {
    ok(ts.some((t, i) => i > 0 && t && t.getIvar("@tileset_name")?.text === info.nombre), `falta el tileset ${info.nombre} del mapa ${mapa}`);
  }
  console.log(fallos === 0 ? "verificación OK" : `verificación con ${fallos} fallos`);
  process.exit(fallos === 0 ? 0 : 1);
}
