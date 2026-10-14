/**
 * rom_nativo_sprites.mjs — Sprites de personajes NATIVOS de las ROMs (Gen 3).
 *
 * Los mapas se instalaron célula a célula desde la ROM (`rom_nativo_mapas.mjs`);
 * este módulo hace lo propio con los GRÁFICOS DE LOS NPCs: extrae del ROM la
 * imagen y la paleta de cada personaje y las deja como PNG de personaje RMXP.
 *
 * Cómo se localiza todo dentro del ROM (verificado contra el código de
 * pokeemerald — `struct ObjectEventGraphicsInfo`, `overworld_frame` y
 * `sObjectEventSpritePalettes`):
 *
 *   1. `gObjectEventGraphicsInfoPointers[]`: array de punteros a structs de
 *      0x24 bytes; se reconoce porque cada struct lleva su `paletteTag` en 0x02
 *      con el rango 0x1100-0x11FF (OBJ_EVENT_PAL_TAG_*).
 *   2. `sObjectEventSpritePalettes[]`: array de structs de 8 bytes
 *      { const u16 *data; u16 tag; } con los mismos tags; la paleta son 16
 *      colores BGR555.
 *   3. La imagen del personaje: el struct (ver `struct ObjectEventGraphicsInfo`)
 *      trae en 0x08/0x0A ancho y alto en píxeles y en 0x1C un puntero a la tabla
 *      de frames. Los 9 frames (abajo, arriba, lado) están CONSECUTIVOS, 4bpp y
 *      en disposición de tiles GBA: una tira de (ancho/8) tiles de ancho por
 *      9 * (alto/8) de alto.
 *
 * El juego usa tiles RMXP de 32×32 (cada metatile de 16×16 se reescala ×2), así
 * que el sprite también se reescala ×2 (16×32 → 32×64 y 32×32 → 64×64).
 *
 * Uso:  node tools/rom_nativo_sprites.mjs --extract | --install | --verify [--dry-run] [--dir ROM_DIR]
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { marshalLoad, marshalDump, RString } from "../web/js/marshal.js";
import { escribirPng } from "./rom_nativo_mapas.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(AQUI, "..");
const GAME = path.join(ROOT, "pokemon_fire_ash");
const DATA = path.join(GAME, "Data");
const PERSONAJES = path.join(GAME, "Graphics", "Characters");
const PLAN_PATH = path.join(ROOT, "content", "rom_nativo.json");
const PLAN_SPRITES = path.join(ROOT, "content", "rom_nativo_sprites.json");
const CAMPAIGNS_PATH = path.join(ROOT, "content", "rom_campaigns_complete.json");
const BLUEPRINT_PATH = path.join(ROOT, "content", "rom_campaigns_complete.json");
const BACKUP = path.join(GAME, "PokeModBackups", "rom_nativo_sprites");

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const EXTRACT = args.includes("--extract");
const INSTALL = args.includes("--install");
const VERIFY = args.includes("--verify");
const dirArg = args.indexOf("--dir");
const ROM_DIR = path.resolve(ROOT, dirArg >= 0 ? args[dirArg + 1] : path.join(ROOT, "roms pokemon"));

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

/* ───────────────────────────── lectura del ROM ─────────────────────────── */

const sha1 = (b) => crypto.createHash("sha1").update(b).digest("hex");
const pad3 = (n) => String(n).padStart(3, "0");

const u8 = (d, o) => d[o];
const u16 = (d, o) => d[o] | (d[o + 1] << 8);
const u32 = (d, o) => ((d[o] | (d[o + 1] << 8) | (d[o + 2] << 16) | (d[o + 3] << 24)) >>> 0);
const esPtr = (d, p) => p >= 0x08000000 && p < 0x08000000 + d.length;

/**
 * ¿El struct apunta a un ObjectEventGraphicsInfo válido? (ver cabecera)
 * Se exige, además del tamaño y el tag, que la tabla de frames empiece con una
 * entrada coherente (puntero válido y `size` = ancho×alto/2 bytes de 4bpp): ese
 * detalle es lo que distingue la tabla real de un array de punteros parecido.
 */
function esFichaGrafico(data, t) {
  if (t + 0x24 > data.length) return false;
  const tag = u16(data, t + 2);
  const ancho = u16(data, t + 8);
  const alto = u16(data, t + 10);
  // Algunos hacks reasignan los tags fuera del rango clásico 0x1100-0x11FF.
  if (tag < 0x1100 || tag > 0x1fff) return false;
  if (!(ancho >= 8 && ancho <= 64 && (ancho & 7) === 0)) return false;
  if (!(alto >= 8 && alto <= 64 && (alto & 7) === 0)) return false;
  // El struct real trae cinco punteros buenos: OAM, subconjuntos, animaciones,
  // imágenes y (opcionalmente) animaciones afines.
  if (!esPtr(data, u32(data, t + 0x10))) return false;
  if (!esPtr(data, u32(data, t + 0x14))) return false;
  if (!esPtr(data, u32(data, t + 0x18))) return false;
  const imagenes = u32(data, t + 0x1c);
  if (!esPtr(data, imagenes)) return false;
  const afines = u32(data, t + 0x20);
  if (afines !== 0 && !esPtr(data, afines)) return false;
  // Y su tabla de frames son entradas coherentes (puntero válido + tamaño exacto
  // del frame en 4bpp). Algún hack tiene una entrada con tamaño raro, así que se
  // exige el primer frame y la mayoría de los nueve.
  const tabla = imagenes - 0x08000000;
  if (tabla + 9 * 8 > data.length) return false;
  if (!esPtr(data, u32(data, tabla))) return false;
  if (u16(data, tabla + 4) !== (ancho * alto) / 2) return false;
  let correctos = 0;
  for (let f = 0; f < 9; f += 1) {
    if (esPtr(data, u32(data, tabla + f * 8)) && u16(data, tabla + f * 8 + 4) === (ancho * alto) / 2) correctos += 1;
  }
  return correctos >= 6;
}

/**
 * Busca el array `gObjectEventGraphicsInfoPointers[]` usando los graphicsId que
 * realmente usan los NPCs de la campaña: gana el array donde más de esos ids
 * resuelven a una ficha válida. Así no hay que adivinar el rango de tags ni
 * asumir que la tabla no tiene huecos (Unbound deja punteros nulos).
 */
export function tablaGraficos(data, ids = []) {
  const MAX_HUECO = 12;
  // Sin descartar solapes: un array desplazado (sub-array del real) también
  // parece válido, así que todos compiten y decide la cobertura de ids usados.
  // Los huecos largos se toleran: algunos hacks dejan tramos sin ficha.
  const HUECO_CANDIDATO = 40;
  const candidatos = [];
  for (let o = 0; o + 4 * 30 < data.length; o += 4) {
    let validos = 0, hueco = 0, i = 0;
    while (i < 60) {
      const p = u32(data, o + i * 4);
      if (esPtr(data, p) && esFichaGrafico(data, p - 0x08000000)) { validos += 1; hueco = 0; }
      else if (++hueco > HUECO_CANDIDATO) break;
      i += 1;
    }
    if (validos >= 25) candidatos.push(o);
  }
  const puntuar = (o) => {
    let cobertura = 0;
    for (const g of ids) {
      const p = u32(data, o + g * 4);
      if (esPtr(data, p) && esFichaGrafico(data, p - 0x08000000)) cobertura += 1;
    }
    let fichas = 0, hueco = 0, i = 0, ultimo = 0;
    while (i < 400) {
      const p = u32(data, o + i * 4);
      if (esPtr(data, p) && esFichaGrafico(data, p - 0x08000000)) { fichas += 1; ultimo = o + i * 4; hueco = 0; }
      else if (++hueco > MAX_HUECO) break;
      i += 1;
    }
    // Un sub-array conserva los punteros a fichas del array real pero empieza
    // desplazado: se penaliza el desplazamiento, no el número de fichas.
    return { cobertura, fichas, hasta: ultimo };
  };
  let mejor = null;
  for (const o of candidatos) {
    const m = puntuar(o);
    // Cobertura primero (la tabla real resuelve casi todos los ids usados);
    // a igualdad, la tabla MÁS LARGA gana porque un array posterior es un
    // sub-array desplazado del real.
    if (!mejor || m.cobertura > mejor.cobertura || (m.cobertura === mejor.cobertura && m.fichas > mejor.fichas)) mejor = { o, ...m };
  }
  return mejor;
}

/** ¿Es una paleta de personaje? 16 colores BGR555 con varios colores reales. */
function esPaleta(data, ptr, tag) {
  if (!(tag >= 0x1100 && tag <= 0x1fff)) return false;
  if (!esPtr(data, ptr)) return false;
  const o = ptr - 0x08000000;
  if (o + 32 > data.length) return false;
  let colores = 0;
  for (let c = 0; c < 16; c += 1) if (u16(data, o + c * 2) !== 0) colores += 1;
  return colores >= 4;
}

/**
 * Busca el array `sObjectEventSpritePalettes[]` ({ const u16 *data; u16 tag; })
 * y devuelve el que cubre más tags pedidos (los de las fichas en uso).
 */
export function tablaPaletas(data, tags = []) {
  const MAX_HUECO = 12;
  const candidatos = [];
  const vistos = new Set();
  for (let o = 0; o + 8 * 10 < data.length; o += 4) {
    if (vistos.has(o)) continue;
    let validos = 0, hueco = 0, i = 0;
    while (i < 40) {
      const p = u32(data, o + i * 8);
      const tag = u16(data, o + i * 8 + 4);
      if (esPaleta(data, p, tag)) { validos += 1; hueco = 0; }
      else if (++hueco > MAX_HUECO) break;
      i += 1;
    }
    if (validos >= 10) {
      candidatos.push(o);
      for (let k = 1; k < validos; k += 1) vistos.add(o + k * 8);
    }
  }
  const puntuar = (o) => {
    const conjunto = new Set();
    let hueco = 0, i = 0;
    while (i < 300) {
      const p = u32(data, o + i * 8);
      const tag = u16(data, o + i * 8 + 4);
      if (esPaleta(data, p, tag)) { conjunto.add(tag); hueco = 0; }
      else if (++hueco > MAX_HUECO) break;
      i += 1;
    }
    let cobertura = 0;
    for (const t of tags) if (conjunto.has(t)) cobertura += 1;
    return { cobertura, paletas: conjunto.size, conjunto };
  };
  let mejor = null;
  for (const o of candidatos) {
    const m = puntuar(o);
    if (!mejor || m.cobertura > mejor.cobertura || (m.cobertura === mejor.cobertura && m.paletas > mejor.paletas)) mejor = { o, ...m };
  }
  return mejor;
}

/** Mapa tag → puntero de la paleta de 16 colores (usa el conjunto detectado). */
export function paletasDe(data, tabla) {
  const mapa = new Map();
  if (tabla.conjunto) {
    let hueco = 0, i = 0;
    while (i < 300 && hueco <= 12) {
      const p = u32(data, tabla.o + i * 8);
      const tag = u16(data, tabla.o + i * 8 + 4);
      if (esPaleta(data, p, tag)) { if (!mapa.has(tag)) mapa.set(tag, p); hueco = 0; }
      else hueco += 1;
      i += 1;
    }
    return mapa;
  }
  for (let i = 0; i < tabla.n; i += 1) mapa.set(u16(data, tabla.o + i * 8 + 4), u32(data, tabla.o + i * 8));
  return mapa;
}

/** Paleta RGBA (16 colores) del tag indicado. */
export function paletaDe(data, paletas, tag) {
  const ptr = paletas.get(tag);
  if (!ptr) return null;
  const o = ptr - 0x08000000;
  const paleta = [];
  for (let c = 0; c < 16; c += 1) {
    const v = u16(data, o + c * 2);
    paleta.push([Math.round(((v & 31) * 255) / 31), Math.round((((v >> 5) & 31) * 255) / 31), Math.round((((v >> 10) & 31) * 255) / 31), c === 0 ? 0 : 255]);
  }
  return paleta;
}

/**
 * Ficha completa de un graphicsId: tamaño, paleta y los 9 frames en RGBA.
 * Los frames están en una tira consecutiva con tiles de 8×8 (barrido por filas).
 */
export function spriteDe(data, gfxTab, paletas, graphicsId) {
  const ptr = u32(data, gfxTab.o + graphicsId * 4);
  if (!esPtr(data, ptr)) return null;
  const st = ptr - 0x08000000;
  const ancho = u16(data, st + 8);
  const alto = u16(data, st + 10);
  const tag = u16(data, st + 2);
  const imagenes = u32(data, st + 0x1c);
  if (!esPtr(data, imagenes)) return null;
  const paleta = paletaDe(data, paletas, tag);
  if (!paleta) return null;
  // La tabla de frames son 9 structs SpriteFrameImage { const void* data; u16 size; }
  // seguidos, y los datos de esos 9 frames están a su vez consecutivos: se leen
  // los punteros de la tabla y, si alguno no cuadra, se avanza con el tamaño del
  // frame ((ancho*alto)/2 bytes, 4bpp).
  const tablaFrames = imagenes - 0x08000000;
  const primerFrame = u32(data, tablaFrames);
  if (!esPtr(data, primerFrame)) return null;
  const base = primerFrame - 0x08000000;
  const tamFrame = (ancho * alto) / 2;
  const tilesX = ancho / 8;
  const frames = [];
  for (let f = 0; f < 9; f += 1) {
    const apuntado = u32(data, tablaFrames + f * 8);
    const desde = esPtr(data, apuntado) && u16(data, tablaFrames + f * 8 + 4) === tamFrame ? apuntado - 0x08000000 : base + f * tamFrame;
    const rgba = new Uint8Array(ancho * alto * 4);
    for (let ty = 0; ty < alto / 8; ty += 1) {
      for (let tx = 0; tx < tilesX; tx += 1) {
        const src = desde + (ty * tilesX + tx) * 32;
        if (src + 32 > data.length) continue;
        for (let y = 0; y < 8; y += 1) {
          for (let x = 0; x < 8; x += 1) {
            const byte = data[src + y * 4 + (x >> 1)];
            const color = x & 1 ? byte >> 4 : byte & 0x0f;
            const px = paleta[color];
            const dx = tx * 8 + x;
            const dy = ty * 8 + y;
            const d = (dy * ancho + dx) * 4;
            rgba[d] = px[0]; rgba[d + 1] = px[1]; rgba[d + 2] = px[2]; rgba[d + 3] = px[3];
          }
        }
      }
    }
    frames.push(rgba);
  }
  return { ancho, alto, tag, frames };
}

/* ─────────────────────── composición del PNG RMXP ─────────────────────── */
/**
 * Hoja de personaje RMXP con prefijo "$" (un solo personaje, 4 columnas × 4
 * filas): fila 0 = abajo, 1 = izquierda, 2 = derecha (espejo), 3 = arriba.
 * Las columnas son el ciclo de animación [quieto, paso1, quieto, paso2], que
 * encaja con los frames del ROM (0 = quieto, 1-2 = pasos).
 */
export function hojaRmxp(sprite, escala) {
  const fw = sprite.ancho * escala;
  const fh = sprite.alto * escala;
  const ancho = fw * 4;
  const alto = fh * 4;
  const rgba = new Uint8Array(ancho * alto * 4);
  const pintar = (frame, col, fila, espejo) => {
    const src = sprite.frames[frame];
    if (!src) return;
    for (let y = 0; y < fh; y += 1) {
      for (let x = 0; x < fw; x += 1) {
        const sx = espejo ? fw - 1 - x : x;
        const s = (Math.floor(y / escala) * sprite.ancho + Math.floor(sx / escala)) * 4;
        const d = ((fila * fh + y) * ancho + col * fw + x) * 4;
        rgba[d] = src[s]; rgba[d + 1] = src[s + 1]; rgba[d + 2] = src[s + 2]; rgba[d + 3] = src[s + 3];
      }
    }
  };
  // Orden de los 9 frames en Gen 3 (tabla `overworld_frame`): 0/1/2 son las
  // poses quietas de abajo/arriba/lado y 3..8 los pasos (3-4 abajo, 5-6 arriba,
  // 7-8 lado). La hoja RMXP repite la pose quieta entre paso y paso.
  const abajo = [0, 3, 0, 4];
  const arriba = [1, 5, 1, 6];
  const lado = [2, 7, 2, 8];
  for (let c = 0; c < 4; c += 1) {
    pintar(abajo[c], c, 0, false);
    pintar(lado[c], c, 1, false);
    pintar(lado[c], c, 2, true);   // la hoja solo trae el lado izquierdo: se espeja
    pintar(arriba[c], c, 3, false);
  }
  return { rgba, ancho, alto };
}

/* ─────────────────────────────── extracción ────────────────────────────── */

function planNativo() {
  if (!fs.existsSync(PLAN_PATH)) throw new Error("Falta content/rom_nativo.json; corre --extract de rom_nativo_mapas.mjs");
  return JSON.parse(fs.readFileSync(PLAN_PATH, "utf8"));
}

/** graphicsId usados por los NPCs de la campaña, en orden. */
function spritesUsados(campana) {
  const usados = new Map();  // graphicsId → nº de usos
  for (const mapa of Object.values(campana.maps)) {
    for (const npc of mapa.npcs ?? []) {
      if (!Number.isInteger(npc.sprite) || npc.sprite < 0) continue;
      usados.set(npc.sprite, (usados.get(npc.sprite) ?? 0) + 1);
    }
  }
  return [...usados].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
}

/**
 * Prepara la lectura de una campaña: detecta la tabla de gráficos con los ids
 * que usan sus NPCs y, con los tags resultantes, la tabla de paletas.
 */
export function preparar(data, campana) {
  const usados = spritesUsados(campana);
  const ids = usados.map(([id]) => id);
  const gfxTab = tablaGraficos(data, ids);
  if (!gfxTab) return null;
  const tagsUsados = [];
  for (const graphicsId of ids) {
    const p = u32(data, gfxTab.o + graphicsId * 4);
    if (esPtr(data, p)) tagsUsados.push(u16(data, p - 0x08000000 + 2));
  }
  const palTab = tablaPaletas(data, tagsUsados);
  const paletas = paletasDe(data, palTab);
  return { usados, gfxTab, palTab, paletas, tagsUsados };
}

function extraer() {
  const plan = planNativo();
  const salida = { generatedBy: "tools/rom_nativo_sprites.mjs", fuente: "ROMs invitadas (GBA)", campaigns: {} };
  let totalSprites = 0, totalBytes = 0;
  for (const [clave, campana] of Object.entries(plan.campaigns)) {
    const romPath = path.join(ROM_DIR, campana.rom);
    if (!fs.existsSync(romPath)) { console.log(`  · ${clave}: ROM ausente (${campana.rom}); se omite`); continue; }
    const data = fs.readFileSync(romPath);
    const { usados, gfxTab, palTab, paletas, tagsUsados } = preparar(data, campana);
    const escala = 2;
    const sprites = {};
    let bytes = 0;
    const faltantes = [];
    for (const [graphicsId, usos] of usados) {
      const sprite = spriteDe(data, gfxTab, paletas, graphicsId);
      if (!sprite) { faltantes.push(graphicsId); continue; }
      const hoja = hojaRmxp(sprite, escala);
      const nombre = `$ROMN_${clave}_g${graphicsId}`;
      const png = escribirPng(hoja.rgba, hoja.ancho, hoja.alto);
      if (!DRY) {
        fs.mkdirSync(PERSONAJES, { recursive: true });
        fs.writeFileSync(path.join(PERSONAJES, `${nombre}.png`), png);
      }
      sprites[graphicsId] = {
        nombre, png: `${nombre}.png`, sha1: sha1(png), ancho: hoja.ancho, alto: hoja.alto,
        frame: `${sprite.ancho}x${sprite.alto}`, tag: sprite.tag, usos,
      };
      bytes += png.length;
      totalSprites += 1;
    }
    salida.campaigns[clave] = {
      rom: campana.rom,
      gfxTab: gfxTab.o, gfxFichas: gfxTab.fichas, gfxCobertura: gfxTab.cobertura,
      palTab: palTab.o, palPaletas: palTab.paletas, palCobertura: palTab.cobertura,
      sprites, faltantes,
    };
    totalBytes += bytes;
    console.log(`  · ${clave}: ${Object.keys(sprites).length} sprites nativos (${(bytes / 1024).toFixed(0)} KB) · tabla de gráficos 0x${gfxTab.o.toString(16)} (${gfxTab.cobertura}/${usados.length} ids) · paletas 0x${palTab.o.toString(16)} (${palTab.cobertura}/${tagsUsados.length} tags)${faltantes.length ? ` · sin gráfico en la ROM: ${faltantes.slice(0, 8).join(",")}${faltantes.length > 8 ? "…" : ""} (${faltantes.length})` : ""}`);
  }
  salida.resumen = { sprites: totalSprites, bytes: totalBytes };
  if (!DRY) fs.writeFileSync(PLAN_SPRITES, `${JSON.stringify(salida)}\n`);
  console.log(`✅ Sprites nativos: ${totalSprites} personajes · ${(totalBytes / 1024).toFixed(0)} KB → content/rom_nativo_sprites.json`);
}

/* ─────────────────────────────── instalación ───────────────────────────── */

const txt = (v) => (v && v.bytes ? Buffer.from(v.bytes).toString("utf8") : String(v ?? ""));

/**
 * Los eventos de campaña se instalaron con los NPCs del plan estructural, en el
 * mismo orden que los de la ROM: el nombre termina en `_<capítulo>_<k>` y ese `k`
 * es la posición (1-based) del NPC en el plan. El plan guardó como `localId` el
 * graphicsId del ROM (el parser antiguo leía ahí ese campo), así que el mapeo
 * evento → personaje es directo y en orden, aunque la instalación haya movido
 * las celdas para evitar solapes.
 */
function planEstructural() {
  const blueprint = JSON.parse(fs.readFileSync(BLUEPRINT_PATH, "utf8"));
  const meta = new Map();
  for (const campana of Object.values(blueprint.campaigns)) {
    for (const m of campana.maps) {
      meta.set(m.mapId, (m.npcs ?? []).map((n) => ({
        graphicsId: Number(n.localId),
        x: Number(n.x),
        y: Number(n.y),
      })));
    }
  }
  return meta;
}

/** graphicsId que corresponde a un evento de campaña (o null si no aplica). */
function graphicsDeEvento(nombre, x, y, estructural, porCelda) {
  const sufijo = /_(\d+)$/.exec(nombre);
  if (sufijo) {
    const npc = (estructural ?? [])[Number(sufijo[1]) - 1];
    if (npc && Number.isInteger(npc.graphicsId)) return npc.graphicsId;
  }
  const cercano = porCelda.get(`${x},${y}`);
  return cercano ? cercano.sprite : null;
}

/** ¿El evento es un personaje (y no un warp, un cartel o el retorno)? */
const esPersonaje = (nombre) => nombre.includes("PokeMod Campaña ROM: NPC")
  || nombre.includes("PokeMod Campaña ROM: Entrenador")
  || nombre.includes("PokeMod Campaña ROM: Líder");

function instalar() {
  if (!fs.existsSync(PLAN_SPRITES)) throw new Error("Falta content/rom_nativo_sprites.json; corre --extract");
  const plan = planNativo();
  const planSpr = JSON.parse(fs.readFileSync(PLAN_SPRITES, "utf8"));
  const estructural = planEstructural();
  fs.mkdirSync(BACKUP, { recursive: true });
  let mapas = 0, asignados = 0, sinSprite = 0;
  for (const [clave, campana] of Object.entries(plan.campaigns)) {
    const fichas = planSpr.campaigns[clave]?.sprites ?? {};
    for (const [idTexto, mapa] of Object.entries(campana.maps)) {
      const mapId = Number(idTexto);
      const archivo = path.join(DATA, `Map${pad3(mapId)}.rxdata`);
      if (!fs.existsSync(archivo)) continue;
      const respaldo = path.join(BACKUP, `Map${pad3(mapId)}.rxdata`);
      if (!fs.existsSync(respaldo)) fs.copyFileSync(archivo, respaldo);
      const mapaObj = leerMapa(`Map${pad3(mapId)}.rxdata`);
      // índice de NPCs del ROM por celda
      const porCelda = new Map();
      for (const npc of mapa.npcs ?? []) porCelda.set(`${npc.x},${npc.y}`, npc);
      for (const [, evento] of mapaObj.getIvar("@events").pairs) {
        const nombre = txt(evento.getIvar("@name"));
        if (!esPersonaje(nombre)) continue;
        const x = Number(evento.getIvar("@x"));
        const y = Number(evento.getIvar("@y"));
        const graphicsId = graphicsDeEvento(nombre, x, y, estructural.get(mapId), porCelda);
        if (!Number.isInteger(graphicsId)) continue;
        const ficha = fichas[graphicsId];
        if (!ficha) { sinSprite += 1; continue; }
        for (const pagina of evento.getIvar("@pages") ?? []) {
          const g = pagina.getIvar("@graphic");
          if (!g) continue;
          g.setIvar("@character_name", string(ficha.nombre));
          g.setIvar("@character_index", 0);
          g.setIvar("@tile_id", 0);
          break;
        }
        asignados += 1;
      }
      if (!DRY) guardarMapa(`Map${pad3(mapId)}.rxdata`, mapaObj);
      mapas += 1;
    }
    console.log(`  · ${clave}: sprites nativos asignados en ${Object.keys(campana.maps).length} mapas`);
  }
  console.log(`✅ Sprites instalados: ${asignados} eventos con personaje nativo${sinSprite ? ` · ${sinSprite} sin ficha de sprite` : ""} en ${mapas} mapas`);
}

/* ─────────────────────────────── verificación ──────────────────────────── */

function verificar() {
  const plan = planNativo();
  const planSpr = JSON.parse(fs.readFileSync(PLAN_SPRITES, "utf8"));
  const estructural = planEstructural();
  let fallos = 0, revisados = 0, conNativo = 0;
  const errores = [];
  const ok = (cond, mensaje) => { if (!cond) { fallos += 1; if (errores.length < 12) errores.push(mensaje); } };
  const cacheMapas = new Map();
  for (const [clave, campana] of Object.entries(plan.campaigns)) {
    const fichas = planSpr.campaigns[clave]?.sprites ?? {};
    for (const [idTexto, mapa] of Object.entries(campana.maps)) {
      const mapId = Number(idTexto);
      const archivo = path.join(DATA, `Map${pad3(mapId)}.rxdata`);
      ok(fs.existsSync(archivo), `falta Map${mapId}`);
      if (!fs.existsSync(archivo)) continue;
      if (!cacheMapas.has(mapId)) cacheMapas.set(mapId, leerMapa(`Map${pad3(mapId)}.rxdata`));
      const objeto = cacheMapas.get(mapId);
      const porCelda = new Map();
      for (const npc of mapa.npcs ?? []) porCelda.set(`${npc.x},${npc.y}`, npc);
      for (const [, evento] of objeto.getIvar("@events").pairs) {
        const nombre = txt(evento.getIvar("@name"));
        if (!esPersonaje(nombre)) continue;
        const x = Number(evento.getIvar("@x"));
        const y = Number(evento.getIvar("@y"));
        const graphicsId = graphicsDeEvento(nombre, x, y, estructural.get(mapId), porCelda);
        if (!Number.isInteger(graphicsId)) continue;
        const ficha = fichas[graphicsId];
        if (!ficha) continue;
        revisados += 1;
        const pagina = (evento.getIvar("@pages") ?? [])[0];
        const g = pagina?.getIvar("@graphic");
        const usado = txt(g?.getIvar("@character_name"));
        if (usado !== ficha.nombre) { ok(false, `Map${mapId}: "${nombre.slice(0, 30)}" usa "${usado}" en vez de "${ficha.nombre}"`); continue; }
        const ruta = path.join(PERSONAJES, ficha.png);
        ok(fs.existsSync(ruta), `falta ${ficha.png}`);
        if (!fs.existsSync(ruta)) continue;
        const bytes = fs.readFileSync(ruta);
        ok(bytes.readUInt32BE(16) === ficha.ancho && bytes.readUInt32BE(20) === ficha.alto, `${ficha.png}: dimensiones ≠ ${ficha.ancho}×${ficha.alto}`);
        ok(sha1(bytes) === ficha.sha1, `${ficha.png}: huella distinta a la del plan`);
        conNativo += 1;
      }
    }
  }
  const totalSprites = Object.values(planSpr.campaigns).reduce((s, c) => s + Object.keys(c.sprites).length, 0);
  console.log(`verificación de sprites: ${totalSprites} personajes nativos · ${revisados} eventos revisados · ${conNativo} con sprite del ROM · ${fallos} fallos`);
  if (errores.length) { for (const e of errores) console.error(`  FALLA: ${e}`); process.exit(1); }
  console.log("  · cada NPC de campaña muestra el personaje que le asigna la ROM");
}

/* ───────────────────── lectura/escritura de Map*.rxdata ────────────────── */
const string = (v) => RString.fromText(String(v));
const leerMapa = (nombre) => marshalLoad(fs.readFileSync(path.join(DATA, nombre)));
const guardarMapa = (nombre, objeto) => { if (!DRY) fs.writeFileSync(path.join(DATA, nombre), Buffer.from(marshalDump(objeto))); };

/* ─────────────────────────────────── main ─────────────────────────────── */
if (isMain) {
  if (!EXTRACT && !INSTALL && !VERIFY) {
    console.log("uso: --extract | --install | --verify  [--dry-run] [--dir ROM_DIR]");
    process.exit(1);
  }
  if (EXTRACT) extraer();
  else if (INSTALL) instalar();
  else if (VERIFY) verificar();
}
