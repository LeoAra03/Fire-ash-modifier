#!/usr/bin/env node
/**
 * rom_nativo_mapas.mjs — mapas y tilesets NATIVOS de las ROMs invitadas.
 *
 * A diferencia del instalador estructural (que reconstruía los mapas con tiles de
 * Fire Ash), este módulo usa los gráficos del propio ROM:
 *
 *   1. Descodifica los tilesets (tiles 4bpp LZ77/RLE, paletas BGR555 y metatiles
 *      de dos capas) y los reescala ×2 a tiles RMXP de 32×32 — los metatiles de
 *      GBA son de 16×16.
 *   2. Convierte cada mapa con sus dimensiones y su bloque de borde originales.
 *   3. La pasabilidad sale de los bits 10-11 de cada celda del mapa (donde el
 *      editor la hornea y el motor la lee con `MapGridGetCollisionAt`), no de una
 *      tabla de comportamientos. Cuando un mismo metatile aparece en celdas
 *      libres y bloqueadas se emiten dos variantes (libre / sólida) para no
 *      perder ni un solo bit de la geometría original.
 *
 * Uso:
 *   node tools/rom_nativo_mapas.mjs --extract [--dir "roms pokemon"]
 *   node tools/rom_nativo_mapas.mjs --install
 *   node tools/rom_nativo_mapas.mjs --verify
 *
 * La ROM no se versiona: el plan (content/rom_nativo.json), los tilesets
 * (Graphics/Tilesets/ROMN_*.png) y los mapas reconstruidos sí.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { marshalLoad, marshalDump, RObject, RString } from "../web/js/marshal.js";
import { parseMap, tableGet, tableToUserDef } from "../web/js/rmxp.js";
import { lz77 } from "./forense/gba.mjs";
import { pngIndizado, pngRGBA } from "./forense/png.mjs";
import { TileCanvas } from "./lib/map_painter.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GAME = path.join(ROOT, "pokemon_fire_ash");
const DATA = path.join(GAME, "Data");
const GRAPHICS = path.join(GAME, "Graphics", "Tilesets");
const ROM_GAMES = path.join(ROOT, "roms pokemon");
const WORK = path.join(ROOT, "reference", "roms_invitadas", "rom_nativo");
const PLAN_PATH = path.join(ROOT, "content", "rom_nativo.json");
const CAMPAIGNS_PATH = path.join(ROOT, "content", "rom_campaigns_complete.json");
const BACKUP = path.join(GAME, "PokeModBackups", "rom_nativo_mapas");
const TILE = 32;
const COLUMNS = 8;
const PASS_BLOCK = 0x0f;
const BASE_ID = 384;
/** Bits del mapa de Gen 3: 0-9 metatile, 10-11 colisión, 12-15 elevación. */
const COLISION_MASK = 0x0c00;
const ELEVACION_MASK = 0xf000;

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const option = (name, fallback) => {
  const at = argv.indexOf(name);
  return at >= 0 && argv[at + 1] && !argv[at + 1].startsWith("--") ? argv[at + 1] : fallback;
};
const EXTRACT = flag("--extract");
const INSTALL = flag("--install");
const VERIFY = flag("--verify");
const DRY = flag("--dry-run");
const ROM_DIR = path.resolve(option("--dir", ROM_GAMES));

const read = (file) => marshalLoad(fs.readFileSync(path.join(DATA, file)));
const write = (file, value) => { if (!DRY) fs.writeFileSync(path.join(DATA, file), Buffer.from(marshalDump(value))); };
const S = (v) => RString.fromText(String(v));
const pad3 = (n) => String(n).padStart(3, "0");
const mapFile = (id) => `Map${pad3(id)}.rxdata`;
const sha1 = (buf) => crypto.createHash("sha1").update(buf).digest("hex").slice(0, 12);
const b64 = (u16) => Buffer.from(new Uint8Array(u16.buffer, u16.byteOffset, u16.byteLength)).toString("base64");
const deB64 = (text, expected) => {
  const buf = Buffer.from(text, "base64");
  const out = new Uint16Array(buf.length / 2);
  for (let i = 0; i < out.length; i += 1) out[i] = buf.readUInt16LE(i * 2);
  if (expected && out.length !== expected) throw new Error(`celdas ${out.length} ≠ ${expected}`);
  return out;
};
const blockedOf = (celda) => ((celda & COLISION_MASK) >> 10) !== 0;
const elevationOf = (celda) => (celda & ELEVACION_MASK) >> 12;

/* ─────────────────────────────── lectura de ROM ─────────────────────────── */

const u8 = (d, o) => d[o];
const u16 = (d, o) => d[o] | (d[o + 1] << 8);
const u32 = (d, o) => (d[o] | (d[o + 1] << 8) | (d[o + 2] << 16) | (d[o + 3] << 24)) >>> 0;
const offline = (ptr) => ptr - 0x08000000;

function descomprimir(data, ptr) {
  const o = offline(ptr);
  const cabecera = data[o];
  if (cabecera === 0x10) {
    const r = lz77(data, o);
    if (!r) throw new Error(`LZ77 inválido en 0x${ptr.toString(16)}`);
    return r.datos;
  }
  if (cabecera === 0x30) {
    const tam = u32(data, o + 1) & 0xffffff;
    const salida = new Uint8Array(tam);
    let p = o + 4, q = 0;
    while (q < tam && p < data.length) {
      const cab = data[p++];
      if (cab < 0x80) { const n = cab + 1; for (let k = 0; k < n && q < tam; k += 1) salida[q++] = data[p++]; }
      else { const v = data[p++]; const n = cab - 125; for (let k = 0; k < n && q < tam; k += 1) salida[q++] = v; }
    }
    if (q < tam) throw new Error("RLE incompleto");
    return salida;
  }
  throw new Error(`compresión desconocida 0x${cabecera.toString(16)} en 0x${ptr.toString(16)}`);
}

function leerLayout(data, headerOff) {
  const layout = offline(u32(data, headerOff));
  return {
    layout,
    width: u32(data, layout),
    height: u32(data, layout + 4),
    borderPtr: u32(data, layout + 8),
    mapPtr: u32(data, layout + 12),
    prim: u32(data, layout + 16),
    sec: u32(data, layout + 20),
    borderW: Math.max(1, u8(data, layout + 24)),
    borderH: Math.max(1, u8(data, layout + 25)),
  };
}

/**
 * Carga un PAR de tilesets (primario + secundario) con el modelo real de Gen 3:
 * los índices de tile y de paleta son absolutos en un espacio unificado de 1024
 * tiles (0-511 primarios, 512-1023 secundarios) y 16 paletas (0-5 primarias,
 * 6-15 secundarias).
 */
export function cargarPar(data, primPtr, secPtr) {
  const campos = (ptr) => {
    const o = offline(ptr);
    return { comprimido: u8(data, o) === 1, tiles: u32(data, o + 4), paletas: u32(data, o + 8), metatiles: u32(data, o + 12) };
  };
  const cPrim = campos(primPtr), cSec = campos(secPtr);
  const tiles = new Uint8Array(1024 * 64);
  const paletas = new Uint32Array(16 * 16);
  const metatiles = new Uint16Array(1024 * 8);
  const nTiles = (campo, destino, maximo) => {
    const bruto = campo.comprimido ? descomprimir(data, campo.tiles) : data.subarray(offline(campo.tiles));
    const n = Math.min(maximo, Math.floor(bruto.length / 32));
    for (let t = 0; t < n; t += 1) {
      for (let i = 0; i < 32; i += 1) {
        const byte = bruto[t * 32 + i];
        tiles[(destino + t) * 64 + i * 2] = byte & 0x0f;
        tiles[(destino + t) * 64 + i * 2 + 1] = byte >> 4;
      }
    }
    return n;
  };
  /**
   * Copia paletas a los slots globales. `desde` es la entrada de la tabla de
   * origen: el motor carga las paletas del tileset secundario empezando por su
   * entrada 6 (`LoadPalette(tileset->palettes[6], 6, ...)`), así que un metatile
   * con nibble 6 usa la entrada 6 —no la 0— del bloque secundario.
   */
  const leerPaletas = (ptr, destino, desde, cuantas) => {
    const o = offline(ptr);
    for (let k = 0; k < cuantas; k += 1) {
      const p = desde + k;
      for (let c = 0; c < 16; c += 1) {
        const v = u16(data, o + (p * 16 + c) * 2);
        const r = Math.round(((v & 31) * 255) / 31);
        const g = Math.round((((v >> 5) & 31) * 255) / 31);
        const b = Math.round((((v >> 10) & 31) * 255) / 31);
        paletas[(destino + k) * 16 + c] = (r << 24) | (g << 16) | (b << 8) | (c === 0 ? 0 : 255);
      }
    }
  };
  const copiarMetatiles = (ptr, destino) => {
    const o = offline(ptr);
    for (let i = 0; i < 512; i += 1) {
      for (let k = 0; k < 8; k += 1) metatiles[(destino + i) * 8 + k] = u16(data, o + (i * 8 + k) * 2);
    }
  };
  const nPrim = nTiles(cPrim, 0, 512);
  const nSec = nTiles(cSec, 512, 512);
  leerPaletas(cPrim.paletas, 0, 0, 6);
  leerPaletas(cSec.paletas, 6, 6, 10);
  copiarMetatiles(cPrim.metatiles, 0);
  copiarMetatiles(cSec.metatiles, 512);
  return { tiles, paletas, metatiles, nPrim, nSec };
}

/** Dibuja un metatile de 16×16 (dos capas) reescalado ×2 → bloque RGBA de 32×32. */
export function renderMetatile(par, metatileId, buffer) {
  const base = (metatileId & 0x3ff) * 8;
  for (let capa = 0; capa < 2; capa += 1) {
    for (let i = 0; i < 4; i += 1) {
      const entrada = par.metatiles[base + capa * 4 + i];
      const tileId = entrada & 0x3ff;
      const hf = (entrada >> 10) & 1;
      const vf = (entrada >> 11) & 1;
      const paletaIdx = (entrada >> 12) & 0xf;
      const tile = par.tiles.subarray(tileId * 64, tileId * 64 + 64);
      const ox = (i % 2) * 16;
      const oy = Math.floor(i / 2) * 16;
      for (let y = 0; y < 8; y += 1) {
        for (let x = 0; x < 8; x += 1) {
          const color = par.paletas[paletaIdx * 16 + tile[(vf ? 7 - y : y) * 8 + (hf ? 7 - x : x)]];
          if ((color & 0xff) === 0) continue;
          for (let dy = 0; dy < 2; dy += 1) {
            for (let dx = 0; dx < 2; dx += 1) {
              const at = ((oy + y * 2 + dy) * TILE + ox + x * 2 + dx) * 4;
              buffer[at] = (color >> 24) & 0xff;
              buffer[at + 1] = (color >> 16) & 0xff;
              buffer[at + 2] = (color >> 8) & 0xff;
              buffer[at + 3] = 255;
            }
          }
        }
      }
    }
  }
}

/** PNG indexado si la paleta cabe en 255 colores; si no, RGBA. */
export function escribirPng(rgba, ancho, alto) {
  const colores = new Map();
  const indices = new Uint8Array(ancho * alto);
  let desbordado = false;
  for (let i = 0; i < ancho * alto && !desbordado; i += 1) {
    const r = rgba[i * 4], g = rgba[i * 4 + 1], b = rgba[i * 4 + 2], a = rgba[i * 4 + 3];
    const clave = a === 0 ? "t" : `${r},${g},${b}`;
    if (!colores.has(clave)) {
      if (colores.size >= 255) { desbordado = true; break; }
      colores.set(clave, colores.size + 1);
    }
    indices[i] = colores.get(clave);
  }
  if (desbordado) return pngRGBA(ancho, alto, rgba);
  const paleta = [[0, 0, 0, 0]];
  for (const clave of colores.keys()) {
    if (clave === "t") { paleta.push([0, 0, 0, 0]); continue; }
    const [r, g, b] = clave.split(",").map(Number);
    paleta.push([r, g, b, 255]);
  }
  return pngIndizado(ancho, alto, indices, paleta);
}

/* ───────────────────────────────── extracción ───────────────────────────── */

function forense(slug, romPath) {
  fs.mkdirSync(WORK, { recursive: true });
  execFileSync(process.execPath, ["tools/gba_maps_events.mjs", "--rom", romPath], {
    cwd: ROOT, env: { ...process.env, ROM_OUT_DIR: WORK }, stdio: "inherit",
  });
  const archivo = path.join(WORK, path.basename(romPath).replace(/\.(gba|gb|gbc)$/i, ""), "mapas_npcs.json");
  const json = JSON.parse(fs.readFileSync(archivo, "utf8"));
  const indice = new Map();
  for (const mapa of json.mapas) indice.set(`${mapa.banco}:${mapa.indice}`, mapa);
  return indice;
}

function extraer() {
  const plan = JSON.parse(fs.readFileSync(CAMPAIGNS_PATH, "utf8"));
  const salida = { generatedBy: "tools/rom_nativo_mapas.mjs", fuente: "ROMs invitadas (GBA)", campaigns: {} };
  let totalMapas = 0, totalTilesets = 0;
  for (const [clave, campana] of Object.entries(plan.campaigns)) {
    const romPath = path.join(ROM_DIR, campana.sourceRom);
    if (!fs.existsSync(romPath)) { console.log(`  · ${clave}: ROM ausente (${campana.sourceRom}); se omite`); continue; }
    const data = fs.readFileSync(romPath);
    const index = forense(clave, romPath);
    const pares = new Map();
    const mapas = {};
    for (const blueprint of campana.maps) {
      const ficha = index.get(`${blueprint.source.bank}:${blueprint.source.map}`);
      if (!ficha) continue;
      const layout = leerLayout(data, ficha.header);
      const clavePar = `${layout.prim}+${layout.sec}`;
      if (!pares.has(clavePar)) pares.set(clavePar, { prim: layout.prim, sec: layout.sec, par: cargarPar(data, layout.prim, layout.sec), variantes: new Map() });
      const par = pares.get(clavePar);
      const celdas = new Uint16Array(layout.width * layout.height);
      const mo = offline(layout.mapPtr);
      for (let i = 0; i < celdas.length; i += 1) {
        const celda = u16(data, mo + i * 2);
        celdas[i] = celda;
        const metatile = celda & 0x3ff;
        const bloqueado = blockedOf(celda) ? 1 : 0;
        const uso = par.variantes.get(metatile) ?? [0, 0];
        uso[bloqueado] += 1;
        par.variantes.set(metatile, uso);
      }
      const borde = new Uint16Array(layout.borderW * layout.borderH);
      const bo = offline(layout.borderPtr);
      for (let i = 0; i < borde.length; i += 1) borde[i] = u16(data, bo + i * 2);
      mapas[blueprint.mapId] = {
        banco: blueprint.source.bank, indice: blueprint.source.map, par: clavePar,
        width: layout.width, height: layout.height,
        borderWidth: layout.borderW, borderHeight: layout.borderH,
        celdas: b64(celdas), borde: b64(borde),
        elevaciones: [...new Set(Array.from(celdas, (c) => elevationOf(c)))].sort((a, b) => a - b),
        npcs: (ficha.npcsDetalle ?? []).map((n) => ({ x: n.x, y: n.y, sprite: n.sprite })),
        textos: (ficha.scripts ?? []).flatMap((s) => (s.textos ?? []).map((t) => ({ x: s.x, y: s.y, texto: t }))),
        warps: (ficha.warpsDetalle ?? []).length,
      };
      totalMapas += 1;
    }
    const tilesets = [];
    for (const [clavePar, entidad] of pares) {
      const par = entidad.par;
      // Variantes: cada metatile usado se emite libre y/o sólido según su uso real.
      // Ambas variantes por metatile: la instalación necesita la versión
      // transitable para abrir los accesos a los eventos sin cambiar el dibujo.
      const variantes = [];
      for (const [metatile] of [...entidad.variantes].sort((a, b) => a[0] - b[0])) {
        variantes.push({ metatile, bloqueado: 0 });
        variantes.push({ metatile, bloqueado: 1 });
      }
      const filas = Math.max(1, Math.ceil(variantes.length / COLUMNS));
      const ancho = COLUMNS * TILE, alto = filas * TILE;
      const rgba = new Uint8Array(ancho * alto * 4);
      const total = BASE_ID + variantes.length;
      const pasajes = new Uint16Array(total);
      const prioridades = new Uint16Array(total);
      const comportamiento = new Uint16Array(total);
      const porMetatile = {};
      variantes.forEach((variante, i) => {
        // El motor lee el tile k de la imagen del tileset como id 384+k.
        const local = BASE_ID + i;
        const buffer = new Uint8Array(TILE * TILE * 4);
        renderMetatile(par, variante.metatile, buffer);
        const col = i % COLUMNS, fila = Math.floor(i / COLUMNS);
        for (let y = 0; y < TILE; y += 1) {
          const destino = ((fila * TILE + y) * ancho + col * TILE) * 4;
          rgba.set(buffer.subarray(y * TILE * 4, y * TILE * 4 + TILE * 4), destino);
        }
        pasajes[local] = variante.bloqueado ? PASS_BLOCK : 0;
        const filaUso = porMetatile[variante.metatile] ?? [0, 0];
        filaUso[variante.bloqueado] = local;
        porMetatile[variante.metatile] = filaUso;
      });
      const nombre = `ROMN_${clave}_p${tilesets.length + 1}`;
      const bytes = escribirPng(rgba, ancho, alto);
      if (!DRY) { fs.mkdirSync(GRAPHICS, { recursive: true }); fs.writeFileSync(path.join(GRAPHICS, `${nombre}.png`), bytes); }
      tilesets.push({
        nombre, png: `${nombre}.png`, sha1: sha1(bytes), ancho, alto, tiles: variantes.length,
        porMetatile, pasajes: Array.from(pasajes), comportamiento: Array.from(comportamiento),
        prim: entidad.prim, sec: entidad.sec,
        nTilesPrim: par.nPrim, nTilesSec: par.nSec,
        bloqueados: variantes.filter((v) => v.bloqueado).length,
      });
      totalTilesets += 1;
    }
    for (const mapa of Object.values(mapas)) {
      const ts = tilesets.find((t) => `${t.prim}+${t.sec}` === mapa.par);
      const traduce = (celda) => {
        const fila = ts.porMetatile[celda & 0x3ff];
        if (!fila) return 0;
        return fila[blockedOf(celda) ? 1 : 0] || fila[0] || fila[1] || 0;
      };
      const celdas = deB64(mapa.celdas, mapa.width * mapa.height);
      const borde = deB64(mapa.borde, mapa.borderWidth * mapa.borderHeight);
      mapa.celdas = b64(Uint16Array.from(celdas, traduce));
      mapa.borde = b64(Uint16Array.from(borde, traduce));
      mapa.tileset = ts.nombre;
    }
    salida.campaigns[clave] = { rom: campana.sourceRom, tilesets, maps: mapas };
    const variantes = tilesets.reduce((suma, t) => suma + t.tiles, 0);
    console.log(`  · ${clave}: ${Object.keys(mapas).length} mapas nativos · ${tilesets.length} tilesets (${variantes} metatiles, ${tilesets.reduce((s, t) => s + t.bloqueados, 0)} sólidos)`);
  }
  salida.resumen = { mapas: totalMapas, tilesets: totalTilesets };
  if (!DRY) fs.writeFileSync(PLAN_PATH, `${JSON.stringify(salida)}\n`);
  console.log(`✅ Plan nativo: ${totalMapas} mapas · ${totalTilesets} tilesets → content/rom_nativo.json`);
}

/* ────────────────────────────────── instalación ─────────────────────────── */

function planNativo() {
  if (!fs.existsSync(PLAN_PATH)) throw new Error("Falta content/rom_nativo.json; corre --extract");
  return JSON.parse(fs.readFileSync(PLAN_PATH, "utf8"));
}

function instalarTileset(plan, guardar) {
  const raw = read("Tilesets.rxdata");
  const ids = new Map();
  for (const campana of Object.values(plan.campaigns)) {
    for (const ts of campana.tilesets) {
      const existente = raw.findIndex((e) => e && String(e.getIvar?.("@tileset_name")?.text ?? "") === ts.nombre);
      const id = existente > 0 ? existente : raw.length;
      const total = ts.total ?? (BASE_ID + ts.tiles);
      const tabla = (datos) => tableToUserDef({ dim: 1, x: total, y: 1, z: 1, data: Uint16Array.from(datos) });
      const obj = new RObject("RPG::Tileset", [
        ["@id", id],
        ["@name", S(`ROM nativo — ${ts.nombre}`)],
        ["@tileset_name", S(ts.nombre)],
        ["@autotile_names", Array.from({ length: 7 }, () => S(""))],
        ["@panorama_name", S("")], ["@panorama_hue", 0],
        ["@fog_name", S("")], ["@fog_hue", 0], ["@fog_opacity", 64],
        ["@fog_blend_type", 0], ["@fog_zoom", 200], ["@fog_sx", 0], ["@fog_sy", 0],
        ["@battleback_name", S("")],
        ["@passages", tabla(ts.pasajes)],
        ["@priorities", tabla(new Uint16Array(total))],
        ["@terrain_tags", tabla(new Uint16Array(total))],
      ]);
      if (existente > 0) raw[existente] = obj; else raw.push(obj);
      ids.set(ts.nombre, id);
      const destino = path.join(GRAPHICS, ts.png);
      const bytes = fs.existsSync(destino) ? fs.readFileSync(destino) : null;
      if (!bytes || sha1(bytes) !== ts.sha1) {
        throw new Error(`Falta el tileset nativo ${ts.png} (o no coincide su huella). Corre --extract`);
      }
    }
  }
  guardar("Tilesets.rxdata", raw);
  return ids;
}

/** id local transitable de un metatile, a partir de su variante sólida. */
function varianteLibre(planTs, idTraducido) {
  for (const fila of Object.values(planTs.porMetatile)) {
    if (fila[1] === idTraducido) return fila[0];
  }
  return idTraducido;
}

/**
 * La instalación estructural colocó NPCs, warps y puntos de retorno con SU propia
 * rejilla; sobre el mapa nativo unas pocas de esas celdas son sólidas. Aquí se
 * pinta la variante TRANSITABLE del mismo metatile (idéntico dibujo, sin colisión)
 * únicamente en las celdas ocupadas por un evento: el resto del mapa queda célula
 * a célula como la ROM. Sin esto los NPCs y los warps quedarían inalcanzables.
 */
function abrirCeldasDeEventos(canvas, objeto, planTs) {
  const pasajes = planTs.pasajes;
  const gemeloLibre = new Map();
  for (const fila of Object.values(planTs.porMetatile)) if (fila[0] && fila[1]) gemeloLibre.set(fila[1], fila[0]);
  let abiertas = 0;
  for (const [, evento] of objeto.getIvar("@events").pairs) {
    const x = Number(evento.getIvar("@x"));
    const y = Number(evento.getIvar("@y"));
    if (!canvas.inside(x, y)) continue;
    const actual = canvas.get(x, y, 0);
    if ((pasajes[actual] ?? 0) === 0) continue;
    const libre = gemeloLibre.get(actual);
    if (!libre) continue;
    canvas.set(x, y, 0, libre);
    abiertas += 1;
  }
  return abiertas;
}

function textoDeNombre(valor) {
  return valor?.bytes ? Buffer.from(valor.bytes).toString("utf8") : String(valor ?? "");
}

function instalar() {
  const plan = planNativo();
  fs.mkdirSync(BACKUP, { recursive: true });
  const blueprint = JSON.parse(fs.readFileSync(CAMPAIGNS_PATH, "utf8"));
  const meta = new Map();
  for (const campana of Object.values(blueprint.campaigns)) for (const m of campana.maps) meta.set(m.mapId, m);
  let mapas = 0, textos = 0, aperturasTotal = 0;
  const ids = instalarTileset(plan, write);
  for (const [clave, campana] of Object.entries(plan.campaigns)) {
    for (const [idTexto, mapa] of Object.entries(campana.maps)) {
      const mapId = Number(idTexto);
      const archivo = path.join(DATA, mapFile(mapId));
      const respaldo = path.join(BACKUP, mapFile(mapId));
      if (!fs.existsSync(respaldo) && fs.existsSync(archivo)) fs.copyFileSync(archivo, respaldo);
      const objeto = read(mapFile(mapId));
      const width = Number(objeto.getIvar("@width"));
      const height = Number(objeto.getIvar("@height"));
      const celdas = deB64(mapa.celdas, mapa.width * mapa.height);
      const borde = deB64(mapa.borde, mapa.borderWidth * mapa.borderHeight);
      const canvas = new TileCanvas(width, height, ids.get(mapa.tileset));
      const celda = (x, y) => (x < mapa.width && y < mapa.height
        ? celdas[y * mapa.width + x]
        : borde[(y % mapa.borderHeight) * mapa.borderWidth + (x % mapa.borderWidth)] ?? 0);
      for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) canvas.set(x, y, 0, celda(x, y));
      const planTs = campana.tilesets.find((t) => t.nombre === mapa.tileset);
      const aperturas = abrirCeldasDeEventos(canvas, objeto, planTs);
      objeto.setIvar("@tileset_id", canvas.tilesetId);
      objeto.setIvar("@data", tableToUserDef(canvas.toTable()));
      // Diálogos ORIGINALES de la ROM: cada evento de campaña se corresponde, en
      // orden, con un NPC del plan estructural (nombre `..._<capítulo>_<k>`) y ese
      // NPC viene de una celda del ROM cuya conversación ya está en el plan.
      // Se inyectan las líneas del ROM sobre los mensajes del evento, sin
      // inventar texto; si el NPC no tiene guion, se conserva el andamiaje.
      const blueprint = meta.get(mapId);
      const eventos = objeto.getIvar("@events");
      for (const [, evento] of eventos.pairs) {
        const nombre = textoDeNombre(evento.getIvar("@name"));
        if (!nombre.includes("PokeMod Campaña ROM")) continue;
        const x = Number(evento.getIvar("@x"));
        const y = Number(evento.getIvar("@y"));
        let lineas = [];
        const sufijo = /_(\d+)$/.exec(nombre);
        const npc = sufijo ? (blueprint?.npcs ?? [])[Number(sufijo[1]) - 1] : null;
        if (npc) lineas = (mapa.textos ?? []).filter((t) => t.x === Number(npc.x) && t.y === Number(npc.y));
        if (!lineas.length) lineas = (mapa.textos ?? []).filter((t) => t.x === x && t.y === y);
        if (!lineas.length) continue;
        for (const pagina of evento.getIvar("@pages") ?? []) {
          const mensajes = (pagina.getIvar("@list") ?? []).filter((c) => c.getIvar("@code") === 401);
          if (!mensajes.length) continue;
          lineas.slice(0, mensajes.length).forEach((linea, i) => {
            mensajes[i].setIvar("@parameters", [S(String(linea.texto).slice(0, 240))]);
            textos += 1;
          });
          break;
        }
      }
      write(mapFile(mapId), objeto);
      aperturasTotal += aperturas;
      mapas += 1;
    }
    console.log(`  · ${clave}: ${Object.keys(campana.maps).length} mapas con gráficos nativos`);
  }
  console.log(`✅ Instalado: ${mapas} mapas nativos · ${textos} diálogos originales · ${aperturasTotal} celdas de evento habilitadas · ${ids.size} tilesets`);
}

/* ───────────────────────────────── verificación ─────────────────────────── */

function verificar() {
  const plan = planNativo();
  const crudoTilesets = read("Tilesets.rxdata");
  const idPorNombre = new Map();
  for (let i = 1; i < crudoTilesets.length; i += 1) {
    const nombre = String(crudoTilesets[i]?.getIvar?.("@tileset_name")?.text ?? "");
    if (nombre) idPorNombre.set(nombre, i);
  }
  let mapas = 0, fallos = 0, solidas = 0, libres = 0, celdasTotales = 0, pngs = 0, abiertas = 0, eventos = 0;
  const errores = [], avisos = [];
  const ok = (cond, mensaje) => { if (!cond) { fallos += 1; if (errores.length < 12) errores.push(mensaje); } };
  for (const [clave, campana] of Object.entries(plan.campaigns)) {
    for (const ts of campana.tilesets) {
      const ruta = path.join(GRAPHICS, ts.png);
      ok(fs.existsSync(ruta), `falta el tileset ${ts.png}`);
      if (!fs.existsSync(ruta)) continue;
      const bytes = fs.readFileSync(ruta);
      ok(bytes.readUInt32BE(16) === ts.ancho && bytes.readUInt32BE(20) === ts.alto,
        `${ts.png}: dimensiones ≠ ${ts.ancho}×${ts.alto}`);
      ok(sha1(bytes) === ts.sha1, `${ts.png}: huella distinta a la del plan`);
      ok((idPorNombre.get(ts.nombre) ?? 0) > 0, `${ts.nombre}: sin entrada en Tilesets.rxdata`);
      if (ts.bloqueados === 0) avisos.push(`${clave}/${ts.nombre}: sin metatiles sólidos (tileset de tránsito)`);
      pngs += 1;
    }
    const tilesetDe = new Map(campana.tilesets.map((t) => [t.nombre, t]));
    for (const [idTexto, mapa] of Object.entries(campana.maps)) {
      const mapId = Number(idTexto);
      const archivo = path.join(DATA, mapFile(mapId));
      ok(fs.existsSync(archivo), `falta Map${mapId}`);
      if (!fs.existsSync(archivo)) continue;
      const objeto = read(mapFile(mapId));
      const ts = tilesetDe.get(mapa.tileset);
      ok(Number(objeto.getIvar("@tileset_id")) === idPorNombre.get(mapa.tileset), `Map${mapId}: tileset ≠ ${mapa.tileset}`);
      const parsed = parseMap(objeto);
      const celdas = deB64(mapa.celdas, mapa.width * mapa.height);
      const solidoDe = new Map(Object.entries(ts.porMetatile).map(([metatile, fila]) => [fila[0], { metatile: Number(metatile), solido: false }]));
      for (const [metatile, fila] of Object.entries(ts.porMetatile)) {
        if (fila[1]) solidoDe.set(fila[1], { metatile: Number(metatile), solido: true });
      }
      // Celdas con evento: únicas donde se admite el gemelo transitable del mismo metatile.
      const celdasConEvento = new Set();
      for (const [, evento] of objeto.getIvar("@events").pairs) {
        const ex = Number(evento.getIvar("@x")), ey = Number(evento.getIvar("@y"));
        if (ex >= 0 && ey >= 0 && ex < mapa.width && ey < mapa.height) celdasConEvento.add(`${ex},${ey}`);
      }
      let distintos = 0, aperturasMalas = 0, fallado = "";
      for (let y = 0; y < mapa.height; y += 1) {
        for (let x = 0; x < mapa.width; x += 1) {
          const esperado = celdas[y * mapa.width + x];
          const tiene = tableGet(parsed.table, x, y, 0);
          const info = solidoDe.get(esperado) ?? { metatile: 0, solido: true };
          if (tiene !== esperado) {
            // Solo se admite el gemelo transitable del MISMO metatile (mismo dibujo)
            // y solo bajo un evento: es la única adaptación de la instalación.
            const libre = ts.porMetatile[String(info.metatile)]?.[0];
            if (info.solido && tiene === libre && celdasConEvento.has(`${x},${y}`)) abiertas += 1;
            else { distintos += 1; aperturasMalas += 1; }
          }
          if ((ts.pasajes[tiene] ?? 0) !== 0) solidas += 1; else libres += 1;
          celdasTotales += 1;
        }
      }
      ok(distintos === 0, `Map${mapId}: ${distintos} celdas no coinciden con el ROM`);
      // Accesos: todo evento sobre celda transitable y alcanzable desde el primero.
      const eventosMapa = [];
      for (const [, evento] of objeto.getIvar("@events").pairs) {
        const x = Number(evento.getIvar("@x")), y = Number(evento.getIvar("@y"));
        if (x < 0 || y < 0 || x >= mapa.width || y >= mapa.height) continue;
        eventosMapa.push({ x, y, nombre: textoDeNombre(evento.getIvar("@name")) });
      }
      const bloqueada = (x, y) => (ts.pasajes[tableGet(parsed.table, x, y, 0)] ?? 0) !== 0;
      let sobreSolida = 0;
      for (const e of eventosMapa) if (bloqueada(e.x, e.y)) { sobreSolida += 1; if (sobreSolida === 1) fallado = `Map${mapId}: "${e.nombre.slice(0, 40)}" @${e.x},${e.y}`; }
      ok(sobreSolida === 0, `${fallado} y ${sobreSolida - 1} eventos más sobre celdas sólidas`);
      // Los mapas de tránsito del ROM tienen zonas incomunicadas por diseño: cada
      // warp se alcanza desde otro mapa, así que no se exige conectividad global.
      eventos += eventosMapa.length;
      mapas += 1;
    }
  }
  const porcentaje = (solidas / Math.max(1, celdasTotales)) * 100;
  console.log(`verificación nativa: ${mapas} mapas · ${pngs} tilesets · ${eventos} eventos revisados · ${fallos} fallos`);
  console.log(`  · celdas ${celdasTotales} · sólidas ${solidas} (${porcentaje.toFixed(1)} %) · libres ${libres} · accesos abiertos ${abiertas}`);
  if (avisos.length) console.log(`  · avisos: ${avisos.length} tilesets de tránsito sin sólidos`);
  if (errores.length) { for (const e of errores) console.error(`  FALLA: ${e}`); process.exit(1); }
  if (porcentaje < 5 || porcentaje > 85) {
    console.error(`  FALLA: proporción de celdas sólidas fuera de rango razonable (${porcentaje.toFixed(1)} %)`);
    process.exit(1);
  }
  console.log("  · cada mapa usa su tileset del ROM, sus celdas, su colisión original y accesos jugables");
}

// El modo CLI solo actúa si el archivo se ejecuta directamente: así otros
// módulos (rom_nativo_sprites.mjs) pueden importar `escribirPng` sin disparar
// la extracción o la instalación.
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  if (EXTRACT) extraer();
  else if (INSTALL) instalar();
  else if (VERIFY) verificar();
  else console.log("uso: --extract | --install | --verify  (ver cabecera del archivo)");
}
