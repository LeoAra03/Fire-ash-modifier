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
 * ANTES de armar cada hoja de 4×4 se verifican los NUEVE frames 4bpp del
 * personaje (fase 51): las tres poses quietas (abajo, arriba, lado) y sus seis
 * pasos. Un frame que llega vacío (todos los píxeles con el índice 0, que es el
 * transparente) dejaría un hueco en la rejilla y el personaje desaparecería en
 * los fotogramas de paso, así que se sustituye por la pose quieta de la misma
 * dirección y queda anotado en el plan (`reparados`). Lo que es estructural
 * —no hay nueve frames, el tamaño no cae en la rejilla de tiles 8×8, los datos
 * no cuadran con el tamaño en bytes de 4bpp o falta la pose quieta— aborta la
 * hoja entera y el personaje se lista como rechazado en vez de escribirse mal.
 * Los frames de 2bpp (cartuchos GB/GBC, cuatro tonos) se rechazan con ese mismo
 * control: `ancho×alto/2` bytes no describen un frame de 4bpp.
 *
 * Uso:  node tools/rom_nativo_sprites.mjs --extract | --install | --verify
 *       node tools/rom_nativo_sprites.mjs --verify-frames [--repair] [--dir ROM_DIR]
 *       node tools/rom_nativo_sprites.mjs --selftest
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { marshalLoad, marshalDump, RString } from "../web/js/marshal.js";
import { escribirPng } from "./rom_nativo_mapas.mjs";
import { leerPng, pngIndizado, pngRGBA } from "./forense/png.mjs";

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
const VERIFY_FRAMES = args.includes("--verify-frames");
const VERIFY_PALETAS = args.includes("--verify-paletas");
const PALETAS = args.includes("--paletas");
const REPAIR = args.includes("--repair");
const SELFTEST = args.includes("--selftest");
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
export function esPaleta(data, ptr, tag) {
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
 *
 * El array se identifica por su forma (entradas de 8 bytes con puntero válido y
 * tag en el rango de OBJ_EVENT_PAL_TAG_*) y se puntúa por la cobertura de los
 * tags que realmente usan los personajes de la campaña. Tres detalles que hacen
 * que el mapa `tag → paleta` no pueda salir de una tabla parecida:
 *
 *   · no se descartan solapamientos: un sub-array desplazado también parece
 *     válido y tiene que competir;
 *   · a igualdad de cobertura gana el array MÁS LARGO y, después, el offset MÁS
 *     BAJO (la cabeza real, no una cola);
 *   · al final se camina hacia atrás mientras la entrada anterior siga siendo
 *     válida: así el array empieza en su cabeza de verdad y no se pierde ninguna
 *     paleta de los primeros tags.
 */
export function tablaPaletas(data, tags = []) {
  const MAX_HUECO = 12;
  const candidatos = [];
  const vistos = new Set();
  for (let o = 0; o + 8 * 10 < data.length; o += 4) {
    if (vistos.has(o)) continue;
    // La cabeza de un array empieza con una entrada válida: si las primeras
    // entradas son un hueco, ese offset es una cola con relleno por delante.
    if (!esPaleta(data, u32(data, o), u16(data, o + 4))) continue;
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
    if (!mejor || m.cobertura > mejor.cobertura
      || (m.cobertura === mejor.cobertura && m.paletas > mejor.paletas)
      || (m.cobertura === mejor.cobertura && m.paletas === mejor.paletas && o < mejor.o)) mejor = { o, ...m };
  }
  if (!mejor) return null;
  // Cabeza del array: mientras la entrada anterior sea una paleta válida, el
  // inicio está más atrás (un sub-array perdería las paletas de los primeros tags).
  let inicio = mejor.o;
  while (inicio >= 8 && esPaleta(data, u32(data, inicio - 8), u16(data, inicio - 4))) inicio -= 8;
  const { entradas, duplicados } = entradasDePaletas(data, inicio);
  return { ...mejor, o: inicio, entradas, duplicados, headExacta: mejor.o === inicio };
}

/**
 * Entradas reales del array desde `o`: `{ tag, ptr, offset }` en orden, hasta el
 * hueco largo. Detecta tags repetidos con punteros distintos (un join ambiguo:
 * el mismo tag apuntando a dos paletas obliga a decidir cuál es la buena).
 */
export function entradasDePaletas(data, o, { maxHueco = 12, maximo = 300 } = {}) {
  const entradas = [];
  const duplicados = [];
  const porTag = new Map();
  let hueco = 0, i = 0;
  while (i < maximo && hueco <= maxHueco) {
    const ptr = u32(data, o + i * 8);
    const tag = u16(data, o + i * 8 + 4);
    if (esPaleta(data, ptr, tag)) {
      const entrada = { tag, ptr, offset: o + i * 8 };
      entradas.push(entrada);
      if (porTag.has(tag) && porTag.get(tag) !== ptr) duplicados.push({ tag, ptrs: [porTag.get(tag), ptr] });
      else if (!porTag.has(tag)) porTag.set(tag, ptr);
      hueco = 0;
    } else hueco += 1;
    i += 1;
  }
  return { entradas, duplicados };
}

/** Volcado de una paleta de 16 colores BGR555: 32 bytes en hexadecimal. */
export function hexDePaleta(data, ptr) {
  const o = ptr - 0x08000000;
  if (o < 0 || o + 32 > data.length) return null;
  let hex = "";
  for (let c = 0; c < 32; c += 1) hex += data[o + c].toString(16).padStart(2, "0");
  return hex;
}

/** Los 16 colores RGBA de un volcado hexadecimal (índice 0 transparente). */
export function coloresDeHexPaleta(hex) {
  const colores = [];
  for (let c = 0; c < 16; c += 1) {
    const v = Number.parseInt(hex.slice(c * 4, c * 4 + 2), 16) | (Number.parseInt(hex.slice(c * 4 + 2, c * 4 + 4), 16) << 8);
    colores.push([Math.round(((v & 31) * 255) / 31), Math.round((((v >> 5) & 31) * 255) / 31), Math.round((((v >> 10) & 31) * 255) / 31), c === 0 ? 0 : 255]);
  }
  return colores;
}

/**
 * Registro completo de `sObjectEventSpritePalettes[]` para una campaña:
 * el mapa `tag → puntero`, el volcado de cada paleta usada y los problemas de
 * lectura que se hayan visto (tags repetidos, orden monotónico, cabeza exacta).
 */
export function registroPaletas(data, tabla, tags = []) {
  const mapa = new Map();
  for (const { tag, ptr } of tabla.entradas) if (!mapa.has(tag)) mapa.set(tag, ptr);
  const usados = new Set(tags);
  const entradasUsadas = tabla.entradas.filter((e) => usados.has(e.tag));
  const refs = new Map();
  for (const { ptr } of entradasUsadas) if (!refs.has(ptr)) refs.set(ptr, hexDePaleta(data, ptr));
  // Si el array va en orden creciente de tag, el índice de la entrada tiene que
  // coincidir con `tag - primerTag`: si no, un join por índice y otro por tag
  // darían paletas distintas (ambigüedad real en la lectura).
  const ordenTags = tabla.entradas.map((e) => e.tag);
  const monotona = ordenTags.every((t, i) => i === 0 || t > ordenTags[i - 1]);
  const desajustes = monotona
    ? tabla.entradas.filter((e, i) => i > 0 && e.tag - ordenTags[0] !== i).map((e) => e.tag)
    : [];
  const sinCobertura = [...usados].filter((t) => !mapa.has(t));
  return { mapa, refs, entradas: tabla.entradas, duplicados: tabla.duplicados, monotona, desajustes, sinCobertura, headExacta: tabla.headExacta };
}

/** Mapa tag → puntero de la paleta de 16 colores (usa las entradas del array). */
export function paletasDe(data, tabla) {
  const mapa = new Map();
  if (tabla?.entradas) {
    for (const { tag, ptr } of tabla.entradas) if (!mapa.has(tag)) mapa.set(tag, ptr);
    return mapa;
  }
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

/* ───────────────── los 9 frames: contrato y verificación ───────────────── */
/**
 * Orden de los 9 frames en Gen 3 (tabla `overworld_frame`): 0/1/2 son las poses
 * quietas de abajo/arriba/lado y 3..8 los pasos (3-4 abajo, 5-6 arriba, 7-8
 * lado). Es la única fuente de verdad: la usan el validador, la reparación y la
 * composición de la hoja, para que no puedan divergir.
 */
export const FRAMES = {
  abajo: { quieto: 0, pasos: [3, 4] },
  arriba: { quieto: 1, pasos: [5, 6] },
  lado: { quieto: 2, pasos: [7, 8] },
};
/** Dirección a la que pertenece un frame (los pasos heredan la de su pose). */
export function direccionDeFrame(i) {
  if (i === FRAMES.abajo.quieto || FRAMES.abajo.pasos.includes(i)) return "abajo";
  if (i === FRAMES.arriba.quieto || FRAMES.arriba.pasos.includes(i)) return "arriba";
  return "lado";
}
/** Ciclo de columnas de la hoja RMXP por dirección: [quieto, paso1, quieto, paso2]. */
const ciclo = (dir) => [FRAMES[dir].quieto, FRAMES[dir].pasos[0], FRAMES[dir].quieto, FRAMES[dir].pasos[1]];

/** ¿El frame no tiene ni un píxel opaco? (todo índice 0, el color transparente) */
export function frameVacio(rgba) {
  if (!rgba) return true;
  for (let i = 3; i < rgba.length; i += 4) if (rgba[i] !== 0) return false;
  return true;
}

/** ¿Los dos frames son idénticos píxel a píxel? (paso que repite la pose quieta) */
export function mismoFrame(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return false;
  return true;
}

/**
 * Verifica los 9 frames 4bpp de un personaje ANTES de armar su hoja.
 * `errores` impiden la hoja; `avisos` se reparan (frame vacío) o se aceptan.
 * Con `bpp: 2` un conjunto de GB/GBC (cuatro tonos) se rechaza por tamaño.
 */
export function validarFrames(sprite, { bpp = 4 } = {}) {
  const errores = [];
  const avisos = [];
  if (!sprite || !Array.isArray(sprite.frames)) return { errores: ["el personaje no trae frames"], avisos, vacios: [], repetidos: [] };
  const { ancho, alto } = sprite;
  const n = sprite.frames.length;
  const bytesFrame = (ancho * alto * bpp) / 8;
  if (n !== 9) errores.push(`la ROM entrega ${n} frames; el contrato pide 9 (3 poses quietas + 6 pasos)`);
  if (!Number.isInteger(ancho) || !Number.isInteger(alto) || ancho <= 0 || alto <= 0) errores.push(`medidas de frame inválidas (${ancho}×${alto})`);
  else {
    if (ancho % 8 || alto % 8) errores.push(`frame ${ancho}×${alto}: no cae en la rejilla de tiles 8×8`);
    if (!Number.isInteger(bytesFrame)) errores.push(`frame ${ancho}×${alto}: no cabe en bytes de ${bpp}bpp (ancho×alto/2 tiene que ser entero)`);
  }
  const tam = ancho * alto * 4;
  for (let i = 0; i < n; i += 1) {
    const f = sprite.frames[i];
    if (!f || f.length !== tam) errores.push(`frame ${i}: ${f ? f.length : 0} bytes RGBA; se esperaban ${tam} (${ancho}×${alto} a ${bpp}bpp)`);
  }
  const vacios = [];
  for (let i = 0; i < n; i += 1) if (frameVacio(sprite.frames[i])) vacios.push(i);
  const repetidos = [];
  for (const [dir, { quieto, pasos }] of Object.entries(FRAMES)) {
    if (vacios.includes(quieto)) { errores.push(`pose quieta de ${dir} vacía (frame ${quieto}): no hay nada que dibujar`); continue; }
    for (const p of pasos) {
      if (p >= n) continue;
      if (vacios.includes(p)) avisos.push(`frame ${p} (paso de ${dir}) llega vacío: se usará la pose quieta para no dejar un hueco`);
      else if (mismoFrame(sprite.frames[p], sprite.frames[quieto])) repetidos.push(p);
    }
  }
  if (repetidos.length) avisos.push(`pasos que repiten la pose quieta (sin animación real): ${repetidos.join(", ")}`);
  return { errores, avisos, vacios, repetidos };
}

/**
 * Rellena los frames que llegan vacíos para que la hoja de 4×4 no tenga huecos
 * (en RMXP un hueco = el personaje desaparece en esa columna o, si es la pose
 * quieta, toda la dirección se ve en blanco). Dos casos:
 *
 *   · `reparados`: hay pose quieta de esa dirección → el hueco se cubre con esa
 *     misma pose (mismo dibujo, sin inventar nada).
 *   · `prestados`: esa dirección no trae NINGUNA pose quieta (objetos que en la
 *     ROM sólo tienen el frente) → se presta el frame equivalente de la fila de
 *     abajo, que es lo único que garantiza que el personaje siempre se vea.
 */
export function repararFrames(sprite) {
  const { vacios } = validarFrames(sprite);
  const frames = sprite.frames.slice();
  const reparados = [];
  const prestados = [];
  const abajo = FRAMES.abajo;
  const fuentePrestada = (i, dir) => {
    const { quieto, pasos } = FRAMES[dir];
    const equivalente = i === quieto ? abajo.quieto : i === pasos[0] ? abajo.pasos[0] : abajo.pasos[1];
    for (const p of [equivalente, abajo.quieto, abajo.pasos[0], abajo.pasos[1], ...frames.keys()]) if (!frameVacio(frames[p])) return p;
    return equivalente;
  };
  for (const i of vacios) {
    const dir = direccionDeFrame(i);
    const quieto = FRAMES[dir].quieto;
    if (i !== quieto && !frameVacio(frames[quieto])) {
      frames[i] = frames[quieto];
      reparados.push(i);
    } else {
      frames[i] = frames[fuentePrestada(i, dir)];
      prestados.push(i);
    }
  }
  return { frames, reparados, prestados };
}

/* ─────────────────────── composición del PNG RMXP ─────────────────────── */
/**
 * Hoja de personaje RMXP con prefijo "$" (un solo personaje, 4 columnas × 4
 * filas): fila 0 = abajo, 1 = izquierda, 2 = derecha (espejo), 3 = arriba.
 * Las columnas son el ciclo de animación [quieto, paso1, quieto, paso2], que
 * encaja con los frames del ROM (0 = quieto, 1-2 = pasos).
 */
export function hojaRmxp(sprite, escala) {
  // Puerta de entrada: la hoja no se arma si los nueve frames no pasan el
  // contrato (el detalle queda en el plan; aquí se corta en seco).
  const { errores } = validarFrames(sprite);
  if (errores.length) throw new Error(`los 9 frames del personaje no pasan la verificación: ${errores.join(" · ")}`);
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
  // Los nueve frames de Gen 3 ya están descritos en FRAMES (arriba): la hoja
  // RMXP repite la pose quieta entre paso y paso.
  const abajo = ciclo("abajo");
  const arriba = ciclo("arriba");
  const lado = ciclo("lado");
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
  const registro = registroPaletas(data, palTab, tagsUsados);
  const paletas = registro.mapa;
  return { usados, gfxTab, palTab, paletas, registro, tagsUsados };
}

/* ─────────── verificación de las paletas contra la ROM ─────────── */

/**
 * Verifica la lectura de `sObjectEventSpritePalettes[]` y que cada personaje
 * reciba SU paleta. El join es por tag: el `paletteTag` que declara el struct
 * (0x02) tiene que existir en una entrada del array y esa entrada tiene que
 * apuntar a una paleta de 16 colores BGR555 dentro de la ROM. Comprobaciones:
 *
 *   1. cobertura: todos los tags de los personajes usados resuelven;
 *   2. sin duplicados: ningún tag apunta a dos paletas distintas (join ambiguo);
 *   3. entrada bien formada: puntero 4-alineado, 16 colores, índice 0 = BGR555 0;
 *   4. la paleta NO cae dentro de la tira de frames del propio personaje (una
 *      paleta leída de los píxeles sería una paleta equivocada);
 *   5. `reflectionPaletteTag` (0x04): el segundo tag del struct también tiene que
 *      estar en el mismo array — es la evidencia independiente de que el array
 *      detectado es el bueno y no un parecido;
 *   6. si el array va en orden creciente de tag, el índice de la entrada tiene
 *      que ser `tag - primerTag`: que un join por índice y otro por tag den la
 *      MISMA paleta (si no, la asignación sería ambigua);
 *   7. la cabeza del array es exacta (la entrada anterior ya no es una paleta):
 *      no se está leyendo una cola del array y perdiendo las primeras paletas.
 */
export function verificarPaletasRom(data, campana, prep) {
  const fallos = [];
  const avisos = [];
  const { gfxTab, registro, tagsUsados } = prep;
  const datos = { tags: tagsUsados.length, unicos: new Set(tagsUsados).size, paletas: registro.refs.size, reflexion: 0, sinReflexion: 0 };
  const paletas = registro.mapa;
  if (registro.sinCobertura.length) fallos.push(`${registro.sinCobertura.length} tags de personaje sin entrada en el array: ${registro.sinCobertura.slice(0, 8).map((t) => `0x${t.toString(16)}`).join(", ")}`);
  for (const { tag, ptrs } of registro.duplicados) fallos.push(`el tag 0x${tag.toString(16)} aparece con dos paletas distintas (0x${ptrs[0].toString(16)} / 0x${ptrs[1].toString(16)}): el join sería ambiguo`);
  if (!registro.headExacta) fallos.push("la tabla de paletas no empieza en su cabeza: hay entradas válidas antes del offset elegido");
  // El array va en orden creciente de tag, pero con huecos: aquí un join por
  // índice daría otra paleta, así que el único join válido es por tag (el que
  // usa el pipeline). Queda como aviso, no como fallo.
  if (registro.desajustes.length) avisos.push(`el array tiene huecos de tag (${registro.desajustes.length} entradas donde índice ≠ tag - primerTag): el join por índice daría paletas distintas, por eso se une por tag`);
  for (const graphicsId of new Set(prep.usados.map(([id]) => id))) {
    const p = u32(data, gfxTab.o + graphicsId * 4);
    if (!esPtr(data, p)) continue;
    const st = p - 0x08000000;
    const tag = u16(data, st + 2);
    const ptr = paletas.get(tag);
    if (!ptr) continue;
    if (ptr % 4 !== 0) fallos.push(`g${graphicsId}: la paleta 0x${tag.toString(16)} no está alineada a 4 bytes (0x${ptr.toString(16)})`);
    const hex = hexDePaleta(data, ptr);
    if (!hex) { fallos.push(`g${graphicsId}: la paleta 0x${tag.toString(16)} se sale de la ROM`); continue; }
    if (hex.slice(0, 4) !== "0000") avisos.push(`g${graphicsId}: el índice 0 de la paleta 0x${tag.toString(16)} no es BGR555 cero (0x${hex.slice(0, 4)})`);
    const reflexion = u16(data, st + 4);
    if (reflexion >= 0x1100 && reflexion <= 0x1fff && reflexion !== tag) {
      if (paletas.has(reflexion)) datos.reflexion += 1;
      else { datos.sinReflexion += 1; avisos.push(`g${graphicsId}: reflectionPaletteTag 0x${reflexion.toString(16)} no está en el array (¿tabla incompleta?)`); }
    }
    // La paleta no puede ser un trozo de los píxeles del propio personaje.
    const imagenes = u32(data, st + 0x1c);
    if (esPtr(data, imagenes)) {
      const base = u32(data, imagenes - 0x08000000) - 0x08000000;
      const tam = (u16(data, st + 8) * u16(data, st + 10)) / 2;
      const po = ptr - 0x08000000;
      if (po >= base && po < base + 9 * tam) fallos.push(`g${graphicsId}: la paleta 0x${tag.toString(16)} cae dentro de sus propios frames (0x${ptr.toString(16)})`);
    }
  }
  return { fallos, avisos, datos };
}

function extraer() {
  const plan = planNativo();
  const salida = { generatedBy: "tools/rom_nativo_sprites.mjs", fuente: "ROMs invitadas (GBA)", campaigns: {} };
  let totalSprites = 0, totalBytes = 0;
  for (const [clave, campana] of Object.entries(plan.campaigns)) {
    const romPath = path.join(ROM_DIR, campana.rom);
    if (!fs.existsSync(romPath)) { console.log(`  · ${clave}: ROM ausente (${campana.rom}); se omite`); continue; }
    const data = fs.readFileSync(romPath);
    const { usados, gfxTab, palTab, paletas, registro, tagsUsados } = preparar(data, campana);
    const paletasRom = verificarPaletasRom(data, campana, { usados, gfxTab, palTab, paletas, registro, tagsUsados });
    for (const f of paletasRom.fallos) console.error(`  FALLA paletas ${clave}: ${f}`);
    for (const a of paletasRom.avisos.slice(0, 3)) console.log(`  · aviso paletas ${clave}: ${a}`);
    const escala = 2;
    const sprites = {};
    let bytes = 0;
    let reparados = 0;
    const faltantes = [];
    const rechazados = [];
    for (const [graphicsId, usos] of usados) {
      const sprite = spriteDe(data, gfxTab, paletas, graphicsId);
      if (!sprite) { faltantes.push(graphicsId); continue; }
      // Fase 51: los nueve frames 4bpp se verifican ANTES de armar la hoja.
      const revision = validarFrames(sprite);
      if (revision.errores.length) {
        rechazados.push({ graphicsId, motivo: revision.errores[0], errores: revision.errores });
        continue;
      }
      const { frames, reparados: tocados, prestados } = repararFrames(sprite);
      const hoja = hojaRmxp({ ...sprite, frames }, escala);
      const nombre = `$ROMN_${clave}_g${graphicsId}`;
      const png = escribirPng(hoja.rgba, hoja.ancho, hoja.alto);
      if (!DRY) {
        fs.mkdirSync(PERSONAJES, { recursive: true });
        fs.writeFileSync(path.join(PERSONAJES, `${nombre}.png`), png);
      }
      sprites[graphicsId] = {
        nombre, png: `${nombre}.png`, sha1: sha1(png), ancho: hoja.ancho, alto: hoja.alto,
        frame: `${sprite.ancho}x${sprite.alto}`, tag: sprite.tag, usos,
        // De dónde salió la paleta de este personaje (join por tag, fase 54).
        paleta: paletas.get(sprite.tag) ?? null,
        ...(tocados.length ? { reparados: tocados } : {}),
        ...(prestados.length ? { prestados } : {}),
        ...(revision.repetidos.length ? { pasosRepetidos: revision.repetidos } : {}),
      };
      reparados += tocados.length + prestados.length;
      bytes += png.length;
      totalSprites += 1;
    }
    salida.campaigns[clave] = {
      rom: campana.rom,
      gfxTab: gfxTab.o, gfxFichas: gfxTab.fichas, gfxCobertura: gfxTab.cobertura,
      palTab: palTab.o, palPaletas: palTab.paletas, palCobertura: palTab.cobertura,
      paletas: volcadoRegistro(registro),
      sprites, faltantes, rechazados,
    };
    totalBytes += bytes;
    console.log(`  · ${clave}: ${Object.keys(sprites).length} sprites nativos (${(bytes / 1024).toFixed(0)} KB) · tabla de gráficos 0x${gfxTab.o.toString(16)} (${gfxTab.cobertura}/${usados.length} ids) · paletas 0x${palTab.o.toString(16)} (${palTab.cobertura}/${tagsUsados.length} tags · ${Object.keys(registro.refs).length} distintas · ${paletasRom.datos.reflexion} de reflejo)${faltantes.length ? ` · sin gráfico en la ROM: ${faltantes.slice(0, 8).join(",")}${faltantes.length > 8 ? "…" : ""} (${faltantes.length})` : ""}${reparados ? ` · ${reparados} frames vacíos cubiertos (pose quieta o fila de abajo)` : ""}${rechazados.length ? ` · RECHAZADOS por los 9 frames: ${rechazados.length}` : ""}`);
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

/* ───────── volcado del registro de paletas al plan ───────── */

/**
 * Registro de `sObjectEventSpritePalettes[]` en JSON: `tags` (tag → puntero),
 * `refs` (puntero → volcado de 32 bytes y su sha1) y el estado de la lectura.
 * Con esto, la auditoría puede comprobar SIN la ROM que los colores de cada hoja
 * entregada son los de la paleta que le toca a su tag.
 */
export function volcadoRegistro(registro) {
  const tags = {};
  for (const [tag, ptr] of [...registro.mapa].sort((a, b) => a[0] - b[0])) tags[tag] = ptr;
  const refs = {};
  for (const [ptr, hex] of [...registro.refs].sort((a, b) => a[0] - b[0])) {
    if (hex) refs[ptr] = { s: sha1(Buffer.from(hex, "hex")).slice(0, 12), d: hex };
  }
  return {
    tags, refs,
    entradas: registro.entradas.length,
    monotona: registro.monotona,
    headExacta: registro.headExacta,
    ...(registro.duplicados.length ? { duplicadas: registro.duplicados } : {}),
    ...(registro.sinCobertura.length ? { sinCobertura: registro.sinCobertura } : {}),
  };
}

/**
 * `--paletas`: relee `sObjectEventSpritePalettes[]` de las ROMs y refresca SÓLO
 * el registro de paletas del plan (y el puntero de paleta de cada personaje),
 * sin volver a escribir ni una hoja. Sirve para verificar la lectura en un
 * entorno que tenga las ROMs sin tocar los sprites ya entregados.
 */
function refrescarPaletas() {
  if (!fs.existsSync(PLAN_SPRITES)) throw new Error("Falta content/rom_nativo_sprites.json");
  const plan = planNativo();
  const planSpr = JSON.parse(fs.readFileSync(PLAN_SPRITES, "utf8"));
  let campanas = 0, fallos = 0, tags = 0;
  for (const [clave, campana] of Object.entries(plan.campaigns)) {
    const romPath = path.join(ROM_DIR, campana.rom);
    if (!fs.existsSync(romPath)) { console.log(`  · ${clave}: ROM ausente (${campana.rom}); se omite`); continue; }
    const data = fs.readFileSync(romPath);
    const prep = preparar(data, campana);
    const revision = verificarPaletasRom(data, campana, prep);
    fallos += revision.fallos.length;
    for (const f of revision.fallos) console.error(`  FALLA paletas ${clave}: ${f}`);
    const ficha = planSpr.campaigns[clave];
    if (!ficha) continue;
    ficha.palTab = prep.palTab.o;
    ficha.palPaletas = prep.palTab.paletas;
    ficha.palCobertura = prep.palTab.cobertura;
    ficha.paletas = volcadoRegistro(prep.registro);
    for (const [graphicsId, sprite] of Object.entries(ficha.sprites ?? {})) {
      if (sprite.tag === undefined) continue;
      sprite.paleta = prep.paletas.get(sprite.tag) ?? null;
    }
    tags += Object.keys(ficha.paletas.tags).length;
    campanas += 1;
    console.log(`  · ${clave}: ${Object.keys(ficha.paletas.tags).length} tags · ${Object.keys(ficha.paletas.refs).length} paletas distintas · ${revision.datos.reflexion} tags de reflejo también en el array · ${revision.fallos.length} fallos`);
  }
  fs.writeFileSync(PLAN_SPRITES, `${JSON.stringify(planSpr)}\n`);
  console.log(`✅ Registro de paletas actualizado: ${campanas} campañas · ${tags} tags${fallos ? ` · ${fallos} FALLOS` : ""} → content/rom_nativo_sprites.json`);
  if (fallos) process.exit(1);
}

/* ─────────── auditoría de los 9 frames en las hojas ya escritas ─────────── */

const FILA_DIR = { abajo: 0, lado: 1, arriba: 3 };
/** Dónde vive cada frame en la hoja 4×4: frame → [columna, fila]. */
const UBICACION = (() => {
  const mapa = new Map();
  for (const [dir, { quieto, pasos }] of Object.entries(FRAMES)) {
    const fila = FILA_DIR[dir];
    mapa.set(quieto, [0, fila]);      // la pose quieta ocupa las columnas 0 y 2
    mapa.set(pasos[0], [1, fila]);
    mapa.set(pasos[1], [3, fila]);
  }
  return mapa;
})();

const colorDe = (imagen, x, y) => {
  const i = imagen.indices[y * imagen.ancho + x];
  return imagen.paleta[i] ?? [0, 0, 0, 0];
};
const vaciaEn = (imagen, col, fila, fw, fh) => {
  for (let y = 0; y < fh; y += 1) for (let x = 0; x < fw; x += 1) if (colorDe(imagen, col * fw + x, fila * fh + y)[3] !== 0) return false;
  return true;
};
const igualesEn = (imagen, colA, filaA, colB, filaB, fw, fh) => {
  for (let y = 0; y < fh; y += 1) {
    for (let x = 0; x < fw; x += 1) {
      if (imagen.indices[(filaA * fh + y) * imagen.ancho + colA * fw + x] !== imagen.indices[(filaB * fh + y) * imagen.ancho + colB * fw + x]) return false;
    }
  }
  return true;
};
const espejoEn = (imagen, colA, filaA, colB, filaB, fw, fh) => {
  for (let y = 0; y < fh; y += 1) {
    for (let x = 0; x < fw; x += 1) {
      const a = imagen.indices[(filaA * fh + y) * imagen.ancho + colA * fw + x];
      const b = imagen.indices[(filaB * fh + y) * imagen.ancho + (colB + 1) * fw - 1 - x];
      if (a !== b) return false;
    }
  }
  return true;
};
/** Copia una celda sobre otra (en los índices, que es como se guardan los PNG). */
function copiarCelda(imagen, destino, origen, fw, fh, espejo = false) {
  for (let y = 0; y < fh; y += 1) for (let x = 0; x < fw; x += 1) {
    const sx = espejo ? fw - 1 - x : x;
    imagen.indices[(destino[1] * fh + y) * imagen.ancho + destino[0] * fw + x] = imagen.indices[(origen[1] * fh + y) * imagen.ancho + origen[0] * fw + sx];
  }
}

/**
 * Comprueba, personaje a personaje, que la hoja RMXP de 4×4 se pueda
 * descomponer otra vez en los nueve frames del contrato: tres poses quietas
 * (abajo, arriba, lado) y sus seis pasos, todos con contenido, todos dentro de
 * los 16 colores del 4bpp, con la pose quieta repetida en las columnas 0 y 2 y
 * con la fila de la derecha igual al espejo de la izquierda.
 *
 * Con `reparar` los fotogramas de paso que estén en blanco se rellenan con la
 * pose quieta de su fila y la ficha del plan se actualiza (sha1 y `reparados`).
 */
export function auditarHojas({ reparar = false, silencioso = false } = {}) {
  const plan = JSON.parse(fs.readFileSync(PLAN_SPRITES, "utf8"));
  const errores = [];
  const avisos = [];
  const reparadas = [];
  let hojas = 0, framesVacios = 0, sinPlan = 0, conPlan = new Set();
  for (const [clave, campana] of Object.entries(plan.campaigns)) {
    for (const [id, ficha] of Object.entries(campana.sprites ?? {})) {
      const ruta = path.join(PERSONAJES, ficha.png);
      conPlan.add(ficha.png);
      if (!fs.existsSync(ruta)) { errores.push(`${ficha.png}: falta la hoja (campaña ${clave}, graphicsId ${id})`); continue; }
      const bytes = fs.readFileSync(ruta);
      let imagen;
      try { imagen = leerPng(bytes); } catch (e) { errores.push(`${ficha.png}: PNG ilegible (${e.message})`); continue; }
      const { ancho, alto } = imagen;
      const problema = [];
      if (ancho !== ficha.ancho || alto !== ficha.alto) problema.push(`mide ${ancho}×${alto}; el plan dice ${ficha.ancho}×${ficha.alto}`);
      if (ancho % 4 || alto % 4) problema.push(`no se parte en la rejilla 4×4`);
      const [fwPlan, fhPlan] = String(ficha.frame).split("x").map(Number);
      const fw = ancho / 4, fh = alto / 4;
      const escala = fw / fwPlan;
      if (!Number.isInteger(escala) || escala < 1) problema.push(`la celda (${fw}×${fh}) no es múltiplo entero del frame del ROM (${ficha.frame})`);
      else if (fh !== fhPlan * escala) problema.push(`la celda (${fw}×${fh}) no cuadra con el frame ${ficha.frame} ×${escala}`);
      if (problema.length) { errores.push(`${ficha.png}: ${problema.join("; ")}`); continue; }
      // 4bpp: toda la hoja dentro de 16 colores (uno de ellos transparente).
      const colores = new Set();
      for (let i = 0; i < ancho * alto; i += 1) { const c = imagen.paleta[imagen.indices[i]] ?? [0, 0, 0, 0]; colores.add(`${c[0]},${c[1]},${c[2]},${c[3]}`); }
      if (colores.size > 16) errores.push(`${ficha.png}: ${colores.size} colores; el 4bpp admite 16`);
      // Pose quieta repetida en las columnas 0 y 2, y lado derecho espejado.
      for (let fila = 0; fila < 4; fila += 1) if (!igualesEn(imagen, 0, fila, 2, fila, fw, fh)) errores.push(`${ficha.png}: la columna 2 no repite la pose quieta de la fila ${fila}`);
      for (let col = 0; col < 4; col += 1) if (!espejoEn(imagen, col, 2, col, 1, fw, fh)) errores.push(`${ficha.png}: la fila 2 no es el espejo de la fila 1 (columna ${col})`);
      // Los nueve frames, uno a uno (y los huecos, reparables con --repair).
      const vacios = [];
      for (const i of [...UBICACION.keys()].sort((a, b) => a - b)) {
        const [col, fila] = UBICACION.get(i);
        if (!vaciaEn(imagen, col, fila, fw, fh)) continue;
        vacios.push(i);
        const dir = direccionDeFrame(i);
        const propio = FRAMES[dir].quieto === i || !vaciaEn(imagen, UBICACION.get(FRAMES[dir].quieto)[0], UBICACION.get(FRAMES[dir].quieto)[1], fw, fh);
        const detalle = i === FRAMES[dir].quieto ? `pose quieta de ${dir}` : `paso de ${dir}`;
        if (reparar) avisos.push(`${ficha.png}: el frame ${i} (${detalle}) llega vacío; ${propio ? "se cubre con la pose quieta de su dirección" : "se presta la fila de abajo"}`);
        else errores.push(`${ficha.png}: el frame ${i} (${detalle}) está vacío: la hoja tendría un hueco (corre con --repair)`);
      }
      if (vacios.length) framesVacios += vacios.length;
      if (reparar && vacios.length) {
        const nueva = { ...imagen, indices: Uint8Array.from(imagen.indices) };
        const tocados = [];
        const prestados = [];
        for (const i of vacios) {
          const dir = direccionDeFrame(i);
          const quieto = FRAMES[dir].quieto;
          const [col, fila] = UBICACION.get(i);
          if (i !== quieto && !vaciaEn(nueva, UBICACION.get(quieto)[0], UBICACION.get(quieto)[1], fw, fh)) {
            copiarCelda(nueva, [col, fila], UBICACION.get(quieto), fw, fh);
            tocados.push(i);
          } else {
            // La dirección no trae ni una pose: se presta la celda equivalente de la fila de abajo.
            const abajo = FRAMES.abajo;
            const equivalente = i === quieto ? abajo.quieto : i === FRAMES[dir].pasos[0] ? abajo.pasos[0] : abajo.pasos[1];
            const fuente = vaciaEn(nueva, UBICACION.get(equivalente)[0], UBICACION.get(equivalente)[1], fw, fh) ? FRAMES.abajo.quieto : equivalente;
            copiarCelda(nueva, [col, fila], UBICACION.get(fuente), fw, fh);
            prestados.push(i);
          }
        }
        if (tocados.length || prestados.length) {
          // La reparación respeta la regla con la que se armó la hoja: la
          // columna 2 repite la 0 y la fila 2 es el espejo de la 1.
          for (let fila = 0; fila < 4; fila += 1) copiarCelda(nueva, [2, fila], [0, fila], fw, fh);
          for (let col = 0; col < 4; col += 1) copiarCelda(nueva, [col, 2], [col, 1], fw, fh, true);
          const png = pngIndizado(ancho, alto, nueva.indices, imagen.paleta);
          fs.writeFileSync(ruta, png);
          ficha.sha1 = sha1(png);
          if (tocados.length) ficha.reparados = tocados;
          if (prestados.length) ficha.prestados = prestados;
          reparadas.push({ png: ficha.png, frames: [...tocados, ...prestados] });
          if (!silencioso) console.log(`  · ${ficha.png}: ${tocados.length ? `huecos ${tocados.join(", ")} → pose quieta de su dirección` : ""}${tocados.length && prestados.length ? " · " : ""}${prestados.length ? `huecos ${prestados.join(", ")} → fila de abajo (esa dirección no trae arte)` : ""}`);
        }
      }
      // Pasos que repiten la pose quieta: se acepta, pero queda listado.
      const repetidos = [];
      for (const [dir, { quieto, pasos }] of Object.entries(FRAMES)) for (const p of pasos) if (igualesEn(imagen, UBICACION.get(p)[0], UBICACION.get(p)[1], UBICACION.get(quieto)[0], UBICACION.get(quieto)[1], fw, fh)) repetidos.push(p);
      if (repetidos.length) avisos.push(`${ficha.png}: los pasos ${repetidos.join(", ")} repiten la pose quieta (animación estática)`);
      if (igualesEn(imagen, 0, 0, 0, 3, fw, fh)) avisos.push(`${ficha.png}: abajo y arriba comparten la misma pose quieta`);
      if (sha1(bytes) !== ficha.sha1 && !reparar) errores.push(`${ficha.png}: huella distinta a la del plan`);
      hojas += 1;
    }
  }
  // Hojas en disco sin ficha en el plan (restos de extracciones anteriores).
  if (fs.existsSync(PERSONAJES)) {
    for (const nombre of fs.readdirSync(PERSONAJES).filter((f) => f.startsWith("$ROMN") && f.endsWith(".png"))) {
      if (conPlan.has(nombre)) continue;
      sinPlan += 1;
      avisos.push(`${nombre}: hoja en disco sin ficha en el plan (puede seguir en uso por eventos)`);
    }
  }
  if (reparar) {
    plan.resumen = { ...(plan.resumen ?? {}), sprites: conPlan.size, bytes: 0 };
    plan.resumen.bytes = [...conPlan].reduce((s, n) => { const p = path.join(PERSONAJES, n); return s + (fs.existsSync(p) ? fs.statSync(p).size : 0); }, 0);
    fs.writeFileSync(PLAN_SPRITES, `${JSON.stringify(plan)}\n`);
  }
  return { hojas, framesVacios, reparadas, sinPlan, errores, avisos };
}

/* ─────── auditoría de paletas sobre el material entregado ─────── */

/** Colores (sin el transparente) que usa una hoja escrita. */
function coloresDeHoja(imagen) {
  const usados = new Set();
  let transparencias = 0;
  for (let i = 0; i < imagen.ancho * imagen.alto; i += 1) {
    const c = imagen.paleta[imagen.indices[i]] ?? [0, 0, 0, 0];
    if (c[3] === 0) { transparencias += 1; continue; }
    usados.add(`${c[0]},${c[1]},${c[2]}`);
  }
  return { usados, transparencias };
}

/**
 * Verifica que ninguna paleta se haya aplicado a un sprite equivocado, sobre las
 * hojas YA escritas (no necesita la ROM):
 *
 *   · con registro (`paletas` en el plan, escrito por `--extract`/`--paletas`):
 *     cada personaje tiene que usar su tag, el tag tiene que apuntar a una paleta
 *     del registro, el volcado tiene que cuadrar con su sha1 y **todos los colores
 *     de la hoja tienen que estar en esa paleta** — el color transparente incluido
 *     (índice 0). Si a una hoja se le hubiera aplicado la paleta de otro personaje,
 *     aparecerían colores que no pertenecen a su tag.
 *   · sin registro (todavía no se releyó la ROM): se comprueba el invariante
 *     fuerte que sí se puede medir — todas las hojas que comparten un tag tienen
 *     que caber en UNA sola paleta de 16 colores (si a una de ellas se le hubiera
 *     aplicado otra paleta, la unión se saldría de 16).
 */
export function auditarPaletas({ silencioso = false } = {}) {
  const plan = JSON.parse(fs.readFileSync(PLAN_SPRITES, "utf8"));
  const errores = [];
  const avisos = [];
  let hojas = 0, conPaleta = 0, grupos = 0, gruposGrandes = 0, sinTag = 0, refs = 0;
  const detalleGrupo = [];
  for (const [clave, campana] of Object.entries(plan.campaigns)) {
    const registro = campana.paletas;
    const refsCampana = new Map();
    if (registro) {
      for (const [ptr, ref] of Object.entries(registro.refs ?? {})) {
        if (sha1(Buffer.from(ref.d, "hex")).slice(0, 12) !== ref.s) errores.push(`campaña ${clave}: el volcado de la paleta 0x${Number(ptr).toString(16)} (0x${ptr}) no cuadra con su sha1`);
        refsCampana.set(Number(ptr), { ...ref, colores: new Set(coloresDeHexPaleta(ref.d).slice(1).map((c) => `${c[0]},${c[1]},${c[2]}`)) });
      }
      refs += refsCampana.size;
    }
    const porTag = new Map();
    for (const [graphicsId, ficha] of Object.entries(campana.sprites ?? {})) {
      const ruta = path.join(PERSONAJES, ficha.png);
      if (!fs.existsSync(ruta)) { errores.push(`${ficha.png}: falta la hoja`); continue; }
      let imagen;
      try { imagen = leerPng(fs.readFileSync(ruta)); } catch (e) { errores.push(`${ficha.png}: PNG ilegible (${e.message})`); continue; }
      hojas += 1;
      const { usados } = coloresDeHoja(imagen);
      if (ficha.tag === undefined) { sinTag += 1; avisos.push(`${ficha.png}: la ficha no guarda tag de paleta`); }
      if (!porTag.has(ficha.tag)) porTag.set(ficha.tag, { usados: new Set(), hojas: [], ptr: ficha.paleta });
      const grupo = porTag.get(ficha.tag);
      grupo.hojas.push(ficha.png);
      for (const c of usados) grupo.usados.add(c);
      if (usados.size > 15) errores.push(`${ficha.png}: usa ${usados.size} colores opacos; una paleta de personaje tiene 15 (más el transparente)`);
      if (!registro) continue;
      const ptr = ficha.paleta ?? registro.tags?.[ficha.tag];
      const ref = ptr !== undefined ? refsCampana.get(ptr) : null;
      if (ref === undefined || ref === null) { errores.push(`${ficha.png}: su tag 0x${Number(ficha.tag).toString(16)} no tiene paleta en el registro de la campaña ${clave}`); continue; }
      if (registro.tags?.[ficha.tag] !== ptr) errores.push(`${ficha.png}: el tag 0x${Number(ficha.tag).toString(16)} apunta a 0x${ptr} pero el registro dice 0x${registro.tags?.[ficha.tag]}`);
      conPaleta += 1;
      for (const c of usados) if (!ref.colores.has(c)) errores.push(`${ficha.png}: el color ${c} no está en la paleta 0x${Number(ptr).toString(16)} de su tag (¿paleta de otro personaje?)`);
      // El índice 0 es el transparente y tiene que ser BGR555 cero.
      const cero = coloresDeHexPaleta(ref.d)[0];
      if (cero[0] || cero[1] || cero[2]) avisos.push(`${ficha.png}: la paleta de su tag no tiene el índice 0 a cero`);
    }
    for (const [tag, grupo] of porTag) {
      grupos += 1;
      if (grupo.usados.size > 16) {
        gruposGrandes += 1;
        detalleGrupo.push(`campaña ${clave} tag 0x${Number(tag).toString(16)}: ${grupo.usados.size} colores entre ${grupo.hojas.length} hojas`);
      }
    }
  }
  for (const d of detalleGrupo.slice(0, 8)) errores.push(`un tag con más de 16 colores (alguno de sus sprites llevaría otra paleta): ${d}`);
  if (!silencioso) {
    console.log(`paletas: ${hojas} hojas · ${grupos} tags distintos${refs ? ` · ${refs} paletas en el registro` : " · sin registro de ROM en el plan"}`);
    console.log(`  · un tag = una paleta: ${grupos - gruposGrandes}/${grupos} grupos caben en 16 colores${sinTag ? ` · ${sinTag} hojas sin tag` : ""}`);
    console.log(conPaleta
      ? `  · ${conPaleta} hojas verificadas color a color contra la paleta de su tag (${refs} volcados de la ROM)`
      : "  · el registro de ROM no está en el plan: se comprueba el invariante de 16 colores por tag (ejecuta --paletas con las ROMs para la comprobación color a color)");
  }
  return { hojas, conPaleta, grupos, gruposGrandes, sinTag, refs, errores, avisos };
}

/** `--verify-paletas`: la ROM (si está) y, siempre, el material entregado. */
function verificarPaletas() {
  const plan = planNativo();
  const planSpr = JSON.parse(fs.readFileSync(PLAN_SPRITES, "utf8"));
  let rom = 0, fallosRom = 0, tagsRom = 0, reflexion = 0, avisosRom = 0;
  for (const [clave, campana] of Object.entries(plan.campaigns)) {
    const romPath = path.join(ROM_DIR, campana.rom);
    if (!fs.existsSync(romPath)) continue;
    const data = fs.readFileSync(romPath);
    const prep = preparar(data, campana);
    if (!prep) { console.error(`  FALLA paletas ${clave}: no se localizó gObjectEventGraphicsInfoPointers[]`); fallosRom += 1; continue; }
    const revision = verificarPaletasRom(data, campana, prep);
    for (const f of revision.fallos) console.error(`  FALLA paletas ${clave}: ${f}`);
    for (const a of revision.avisos.slice(0, 3)) console.log(`  · aviso paletas ${clave}: ${a}`);
    fallosRom += revision.fallos.length;
    avisosRom += revision.avisos.length;
    reflexion += revision.datos.reflexion;
    tagsRom += revision.datos.unicos;
    rom += 1;
    // El registro del plan (si lo hay) tiene que describir la misma tabla.
    const guardado = planSpr.campaigns[clave]?.paletas;
    if (guardado?.tags) {
      const ahora = volcadoRegistro(prep.registro);
      const difTags = Object.entries(ahora.tags).filter(([tag, ptr]) => guardado.tags[tag] !== ptr).length;
      const difRefs = Object.entries(ahora.refs).filter(([ptr, ref]) => guardado.refs?.[ptr]?.s !== ref.s).length;
      const difEntradas = Number(guardado.entradas) !== ahora.entradas;
      if (difEntradas || difTags || difRefs) {
        console.error(`  FALLA paletas ${clave}: el registro del plan no describe la tabla de la ROM (${difEntradas ? "entradas " : ""}${difTags} tags y ${difRefs} paletas distintas)`);
        fallosRom += 1;
      } else {
        console.log(`  · paletas ${clave}: el registro del plan (${Object.keys(guardado.tags).length} tags, ${Object.keys(guardado.refs ?? {}).length} paletas) describe la misma tabla que la ROM`);
      }
    }
  }
  const entregado = auditarPaletas({ silencioso: true });
  const totalSprites = Object.values(planSpr.campaigns).reduce((s, c) => s + Object.keys(c.sprites ?? {}).length, 0);
  console.log(`verificación de paletas (sObjectEventSpritePalettes[]): ${rom ? `${rom} campañas releídas del ROM · ${tagsRom} tags de personaje · ${reflexion} tags de reflejo confirmados en el array` : "ROM ausente: no se pudo releer el array"}`);
  console.log(`paletas: ${entregado.hojas}/${totalSprites} hojas · ${entregado.grupos} tags distintos${entregado.refs ? ` · ${entregado.conPaleta} hojas con la paleta de su tag (${entregado.refs} volcados)` : ""} · ${entregado.grupos - entregado.gruposGrandes}/${entregado.grupos} grupos dentro de 16 colores`);
  if (entregado.avisos.length) console.log(`  · avisos: ${entregado.avisos.length} (p. ej. ${entregado.avisos[0]})`);
  if (avisosRom) console.log(`  · avisos de ROM: ${avisosRom}`);
  const fallos = fallosRom + entregado.errores.length;
  if (fallos) {
    for (const e of entregado.errores.slice(0, 12)) console.error(`  FALLA: ${e}`);
    console.error(`verificación de paletas: ${fallos} fallos`);
    process.exit(1);
  }
  console.log("  · ninguna paleta se aplica a un sprite equivocado (join por tag verificado)");
}

/** Verifica los 9 frames contra la ROM (si está) y contra las hojas escritas. */
function verificarFrames() {
  const plan = JSON.parse(fs.readFileSync(PLAN_SPRITES, "utf8"));
  const nativo = planNativo();
  let revisadosRom = 0, conProblemasRom = 0;
  for (const [clave, campana] of Object.entries(nativo.campaigns)) {
    const romPath = path.join(ROM_DIR, campana.rom);
    if (!fs.existsSync(romPath)) continue;
    const data = fs.readFileSync(romPath);
    const prep = preparar(data, campana);
    if (!prep) continue;
    for (const [graphicsId] of prep.usados) {
      const sprite = spriteDe(data, prep.gfxTab, prep.paletas, graphicsId);
      if (!sprite) continue;
      revisadosRom += 1;
      const { errores, avisos } = validarFrames(sprite);
      if (errores.length) { conProblemasRom += 1; console.error(`  FALLA ROM ${clave} g${graphicsId}: ${errores.join(" · ")}`); }
      else if (avisos.length) conProblemasRom += 1;
    }
  }
  const antes = auditarHojas({ reparar: REPAIR });
  const despues = REPAIR ? auditarHojas({ reparar: false, silencioso: true }) : antes;
  const informe = REPAIR ? despues : antes;
  const totalSprites = Object.values(plan.campaigns).reduce((s, c) => s + Object.keys(c.sprites ?? {}).length, 0);
  console.log(`verificación de frames (9 por personaje, 4bpp): ${totalSprites} personajes planificados · ${informe.hojas} hojas auditadas${revisadosRom ? ` · ${revisadosRom} personajes releídos del ROM${conProblemasRom ? ` (${conProblemasRom} con huecos en los frames del ROM)` : ""}` : " · ROM ausente: sólo se auditan las hojas escritas"}`);
  if (REPAIR) console.log(`  · huecos cubiertos: ${antes.reparadas.length} hojas (${antes.framesVacios} frames) → quedan ${informe.framesVacios}`);
  const avisosReparacion = informe.avisos.filter((a) => a.includes("llega vacío"));
  const avisosAnimacion = informe.avisos.filter((a) => !a.includes("llega vacío"));
  if (avisosReparacion.length) console.log(`  · huecos cubiertos con la pose quieta o la fila de abajo: ${avisosReparacion.length}`);
  if (avisosAnimacion.length) {
    const sinAnimacion = avisosAnimacion.filter((a) => a.includes("repiten la pose quieta")).length;
    const sinPlan = avisosAnimacion.filter((a) => a.includes("sin ficha en el plan")).length;
    const abajoArriba = avisosAnimacion.filter((a) => a.includes("abajo y arriba")).length;
    console.log(`  · avisos: ${avisosAnimacion.length} (${sinAnimacion} hojas con pasos que repiten la pose quieta · ${abajoArriba} hojas con abajo y arriba idénticos · ${sinPlan} hojas sin ficha en el plan)`);
  }
  if (informe.errores.length) {
    for (const e of informe.errores.slice(0, 12)) console.error(`  FALLA: ${e}`);
    console.error(`verificación de frames: ${informe.errores.length} fallos`);
    process.exit(1);
  }
  console.log(`  · los 9 frames (abajo, arriba, lado y sus pasos) están completos y la hoja de 4×4 se descompone sin huecos`);
}


/**
 * ROM sintética para la autocomprobación: monta en memoria el mismo formato que
 * un cartucho de GBA (frame 4bpp con tiles 8×8, tabla `SpriteFrameImage[9]`,
 * struct `ObjectEventGraphicsInfo` de 0x24 bytes, `gObjectEventGraphicsInfoPointers[]`
 * y `sObjectEventSpritePalettes[]` con entradas { puntero, tag }). Cada personaje
 * lleva su propia paleta, con el color de índice 1 distinto, para poder
 * comprobar que a cada uno se le aplica la SUYA.
 */
export function romSintetica({ nGraficos = 30, nPaletas = 12, mezclarPaletas = false, etiquetaRepetida = false, saltoTags = 1 } = {}) {
  const rom = Buffer.alloc(0x8000);
  const BASE = 0x08000000;
  const OAM = 0x7800, SUBS = 0x7820, ANIMS = 0x7840;
  const FICHAS = 0x7000;                  // structs de 0x24 bytes
  const ARRAY = 0x7600;                   // gObjectEventGraphicsInfoPointers[]
  const PALETAS = 0x1000;                 // 16 colores BGR555 por paleta
  const PAL_TAB = 0x2000;                 // sObjectEventSpritePalettes[] (8 B/entrada)
  const FRAMES = 0x4000;                  // tiras de 9 frames de 8×8 (32 B cada una)
  const w = (off, v) => rom.writeUInt16LE(v & 0xffff, off);
  const d = (off, v) => rom.writeUInt32LE(v >>> 0, off);
  // Paletas: la entrada 1 cambia por paleta (10*i, 0, 0) para distinguirlas.
  for (let i = 0; i < nPaletas; i += 1) {
    for (let c = 0; c < 16; c += 1) {
      const r = c === 1 ? (i + 1) * 10 : c * 2;
      const g = c === 1 ? 0 : c * 3;
      const b = c === 1 ? 0 : c * 4;
      w(PALETAS + i * 32 + c * 2, ((b >> 3) << 10) | ((g >> 3) << 5) | (r >> 3));
    }
  }
  for (let i = 0; i < nPaletas; i += 1) {
    const destino = mezclarPaletas ? (i + 1) % nPaletas : i;
    d(PAL_TAB + i * 8, BASE + PALETAS + destino * 32);
    w(PAL_TAB + i * 8 + 4, 0x1100 + (etiquetaRepetida && i > 0 ? 0 : i * saltoTags));
  }
  // Frames: cada personaje usa el índice 1 en todos sus píxeles (nibble bajo y alto).
  for (let g = 0; g < nGraficos; g += 1) {
    const base = FRAMES + g * 9 * 32;
    for (let f = 0; f < 9; f += 1) rom.fill(0x11, base + f * 32, base + f * 32 + 32);
  }
  for (let g = 0; g < nGraficos; g += 1) {
    const tabla = 0x3000 + g * 9 * 8;
    for (let f = 0; f < 9; f += 1) {
      d(tabla + f * 8, BASE + FRAMES + g * 9 * 32 + f * 32);
      w(tabla + f * 8 + 4, 32);
    }
    const st = FICHAS + g * 0x24;
    w(st + 0x00, 0x1000 + g);
    w(st + 0x02, 0x1100 + (g % nPaletas) * saltoTags);
    w(st + 0x04, 0x1100 + ((g + 1) % nPaletas) * saltoTags);   // reflectionPaletteTag
    w(st + 0x06, 8);
    w(st + 0x08, 8);
    w(st + 0x0a, 8);
    d(st + 0x10, BASE + OAM);
    d(st + 0x14, BASE + SUBS);
    d(st + 0x18, BASE + ANIMS);
    d(st + 0x1c, BASE + tabla);
    d(st + 0x20, 0);
    d(ARRAY + g * 4, BASE + st);
  }
  return rom;
}

/** Campaña sintética: un mapa con los NPCs 0..n-1 (el graphicsId es el localId). */
export function campanaSintetica(nGraficos = 30) {
  return { rom: "sintetica.gba", maps: { "1": { npcs: Array.from({ length: nGraficos }, (_, i) => ({ sprite: i, x: i, y: 0, localId: i })) } } };
}

/* ──────────────────────────── autocomprobación ─────────────────────────── */

/** Comprobaciones sintéticas: no necesitan ROM ni tocar el juego. */
function selftest() {
  let ok = 0;
  const afirma = (cond, mensaje) => { if (!cond) throw new Error(`selftest: ${mensaje}`); ok += 1; };
  const marco = (w, h, color) => { const b = new Uint8Array(w * h * 4); for (let i = 0; i < w * h; i += 1) { b[i * 4] = color; b[i * 4 + 1] = color; b[i * 4 + 2] = color; b[i * 4 + 3] = color ? 255 : 0; } return b; };
  const personaje = () => ({ ancho: 8, alto: 8, tag: 0x1100, frames: Array.from({ length: 9 }, (_, i) => marco(8, 8, i + 1)) });

  afirma(validarFrames(personaje()).errores.length === 0, "un personaje con 9 frames válidos no debe dar errores");
  const pocos = personaje(); pocos.frames = pocos.frames.slice(0, 6);
  afirma(validarFrames(pocos).errores.some((e) => e.includes("6 frames")), "se exige que haya nueve frames");
  const rejilla = personaje(); rejilla.ancho = 12; rejilla.frames = rejilla.frames.map(() => marco(12, 8, 3));
  afirma(validarFrames(rejilla).errores.some((e) => e.includes("8×8")), "un ancho fuera de la rejilla de tiles se rechaza");
  // Rejilla de tiles y tamaño en bytes: `bpp` entra en la cuenta del contrato.
  const gbc = personaje(); gbc.ancho = 9; gbc.frames = gbc.frames.map(() => marco(9, 8, 3));
  afirma(validarFrames(gbc, { bpp: 2 }).errores.some((e) => e.includes("8×8")), "la rejilla 8×8 se exige también cuando se declara 2bpp");
  afirma(validarFrames(personaje(), { bpp: 2 }).errores.length === 0, "un frame de 8×8 con rejilla válida pasa en 2bpp y en 4bpp");
  const malTamaño = personaje(); malTamaño.frames[4] = marco(8, 8, 3).subarray(0, 8);
  afirma(validarFrames(malTamaño).errores.some((e) => e.includes("frame 4")), "un frame con bytes de menos se rechaza");

  const conHueco = personaje(); conHueco.frames[3] = marco(8, 8, 0);
  const revision = validarFrames(conHueco);
  afirma(revision.errores.length === 0 && revision.vacios.includes(3), "un paso vacío es un hueco reparable");
  const reparado = repararFrames(conHueco);
  afirma(reparado.reparados.includes(3) && mismoFrame(reparado.frames[3], conHueco.frames[0]), "el paso vacío se sustituye por la pose quieta de su dirección");
  const quietoVacio = personaje(); quietoVacio.frames[1] = marco(8, 8, 0);
  afirma(validarFrames(quietoVacio).errores.some((e) => e.includes("pose quieta de arriba")), "una pose quieta vacía aborta la hoja");
  afirma(direccionDeFrame(8) === "lado" && direccionDeFrame(5) === "arriba" && direccionDeFrame(0) === "abajo", "cada frame sabe a qué dirección pertenece");

  const hoja = hojaRmxp(personaje(), 2);
  afirma(hoja.ancho === 64 && hoja.alto === 64, "la hoja de 4×4 mide 4 × 4 celdas");
  let lanza = false;
  try { hojaRmxp(quietoVacio, 2); } catch { lanza = true; }
  afirma(lanza, "componer una hoja con frames inválidos lanza error");
  afirma(mismoFrame(personaje().frames[0], hojaRmxp(conHueco, 2).rgba) === false, "la hoja reparada usa la pose quieta en la columna del paso");

  const rgba = marco(8, 8, 5);
  const ida = leerPng(pngIndizado(8, 8, new Uint8Array(64).fill(1), [[0, 0, 0, 0], [255, 255, 255, 255]]));
  afirma(ida.ancho === 8 && ida.profundidad === 4 && ida.indices.every((v) => v === 1), "el PNG indexado de 4bpp vuelve intacto");
  const vuelta = leerPng(pngRGBA(8, 8, rgba));
  afirma(vuelta.tipoColor === 6 && vuelta.rgba.every((v, i) => v === rgba[i]), "el PNG RGBA vuelve píxel a píxel");
  afirma(UBICACION.get(0)[1] === 0 && UBICACION.get(6)[1] === 3 && UBICACION.get(7)[0] === 1, "cada frame tiene su celda en la rejilla");


  // ── paletas: la ROM sintética prueba la lectura del array y el join tag → paleta
  const rom = romSintetica();
  const campana = campanaSintetica();
  const prep = preparar(rom, campana);
  afirma(prep !== null, "la ROM sintética se deja leer: hace falta su gObjectEventGraphicsInfoPointers[]");
  afirma(prep.palTab.o === 0x2000, "sObjectEventSpritePalettes[] se localiza en su sitio de la ROM sintética");
  afirma(prep.registro.entradas.length === 12 && prep.registro.monotona && prep.registro.headExacta, "las doce entradas del array se leen en orden, con la cabeza exacta");
  afirma(prep.registro.sinCobertura.length === 0 && prep.registro.duplicados.length === 0, "cada tag de personaje resuelve y ninguno apunta a dos paletas");
  const revisionPaletas = verificarPaletasRom(rom, campana, prep);
  afirma(revisionPaletas.fallos.length === 0, `la verificación de paletas no encuentra fallos en la ROM sintética: ${revisionPaletas.fallos[0] ?? ""}`);
  afirma(revisionPaletas.datos.reflexion === 30, "los 30 tags de reflejo (0x04) también están en el array: evidencia de que es el array bueno");
  // Y cada personaje recibe SU paleta, no la de otro.
  // El rojo de la entrada 1 se guarda en BGR555, así que el valor que se ve es
  // el del canal ya cuantizado a 5 bits (y vuelto a 8).
  const esperado = (i) => Math.round(((((i + 1) * 10) >> 3) * 255) / 31);
  const color1 = (sprite) => sprite.frames[0][0];
  const s0 = spriteDe(rom, prep.gfxTab, prep.paletas, 0);
  const s1 = spriteDe(rom, prep.gfxTab, prep.paletas, 1);
  const s7 = spriteDe(rom, prep.gfxTab, prep.paletas, 7);
  afirma(color1(s0) === esperado(0) && color1(s1) === esperado(1) && color1(s7) === esperado(7) && esperado(0) !== esperado(1), `cada graphicsId se pinta con la paleta de su tag (${esperado(0)} · ${esperado(1)} · ${esperado(7)})`);
  afirma(s0.tag === 0x1100 && s1.tag === 0x1101 && s7.tag === 0x1107, "el tag de cada personaje sale del struct, no del orden del array");
  const conOtra = { usados: prep.usados, gfxTab: prep.gfxTab, palTab: prep.palTab, paletas: new Map(prep.paletas) };
  conOtra.paletas.set(0x1107, prep.paletas.get(0x1100));
  afirma(color1(spriteDe(rom, conOtra.gfxTab, conOtra.paletas, 7)) === esperado(0), "si el join se rompiera, el sprite saldría con la paleta equivocada (el detector tiene sentido)");
  // Tablas parecidas que NO se deben elegir.
  // Con las paletas del array desordenadas, el join por tag sigue resolviendo y
  // los tags son los mismos, pero el volcado cambia: eso es exactamente lo que
  // detecta la comparación contra el registro guardado en el plan.
  const mezclada = romSintetica({ mezclarPaletas: true });
  const prepMezclada = preparar(mezclada, campana);
  const regA = volcadoRegistro(prep.registro), regB = volcadoRegistro(prepMezclada.registro);
  const tagsIguales = JSON.stringify(regA.tags) === JSON.stringify(regB.tags);
  const paletasIguales = JSON.stringify(regA.refs) === JSON.stringify(regB.refs);
  afirma(!tagsIguales && paletasIguales, "si las paletas del array cambian de sitio, el join tag → paleta del registro lo delata (las 12 paletas son las mismas: lo que cambia es cuál le toca a cada tag)");
  // Un array con huecos de tag (orden creciente pero no consecutivo) avisa de
  // que el join por índice daría otra paleta.
  const conHuecos = romSintetica({ saltoTags: 2 });
  const prepHuecos = preparar(conHuecos, campanaSintetica());
  const revisionHuecos = verificarPaletasRom(conHuecos, campanaSintetica(), prepHuecos);
  afirma(prepHuecos.registro.desajustes.length > 0 && revisionHuecos.fallos.length === 0 && revisionHuecos.avisos.some((a) => a.includes("huecos de tag")), "un array monotónico con huecos se avisa y no se da por fallo (se une por tag)");
  const repetida = romSintetica({ etiquetaRepetida: true });
  const prepRepetida = preparar(repetida, campana);
  afirma(prepRepetida.registro.duplicados.length > 0, "dos entradas con el mismo tag y paletas distintas se marcan como ambiguas");
  afirma(verificarPaletasRom(repetida, campana, prepRepetida).fallos.some((f) => f.includes("dos paletas distintas")), "la ambigüedad de tag hace fallar la verificación");
  const corte = romSintetica();
  const prepCorte = preparar(corte, campana);
  const soloCola = { ...prepCorte, registro: { ...prepCorte.registro, headExacta: false } };
  afirma(verificarPaletasRom(corte, campana, soloCola).fallos.some((f) => f.includes("cabeza")), "leer una cola del array en vez de su cabeza se detecta");
  // El registro que viaja en el plan describe la misma tabla.
  const volcado = volcadoRegistro(prep.registro);
  afirma(Object.keys(volcado.tags).length === 12 && Object.keys(volcado.refs).length === 12, "el registro del plan guarda los 12 tags y sus 12 paletas");
  const colores = coloresDeHexPaleta(volcado.refs[0x08001000].d);
  afirma(colores[0][3] === 0 && colores[1][0] === esperado(0) && sha1(Buffer.from(volcado.refs[0x08001000].d, "hex")).slice(0, 12) === volcado.refs[0x08001000].s, "el volcado vuelve a dar los mismos colores y cuadra con su sha1");

  // El circuito completo: ROM → 9 frames → verificación → hoja 4×4 → PNG indexado,
  // y de vuelta al leer los colores de la hoja, que tienen que ser los de SU paleta.
  const s3 = spriteDe(rom, prep.gfxTab, prep.paletas, 3);
  const limpio = repararFrames(s3);
  const hoja3 = hojaRmxp({ ...s3, frames: limpio.frames }, 2);
  const pngHoja = escribirPng(hoja3.rgba, hoja3.ancho, hoja3.alto);
  const leida = leerPng(pngHoja);
  const suyos = coloresDeHexPaleta(volcadoRegistro(prep.registro).refs[0x08001060].d);
  const permitidos = new Set(suyos.filter((c) => c[3] !== 0).map((c) => `${c[0]},${c[1]},${c[2]}`));
  const vistos = coloresDeHoja(leida);
  afirma(leida.ancho === 64 && leida.alto === 64, "la hoja del personaje sintético mide 4 × 4 celdas de 16×16 reescaladas ×2");
  afirma([...vistos.usados].every((c) => permitidos.has(c)), "todos los colores de la hoja están en la paleta de su tag");
  afirma(vistos.usados.has(`${esperado(3)},0,0`) && !vistos.usados.has(`${esperado(4)},0,0`), "la hoja usa su paleta y no la del tag vecino");

  console.log(`OK: autocomprobación de los 9 frames 4bpp, la hoja RMXP y las paletas (${ok} comprobaciones)`);
}

/* ───────────────────── lectura/escritura de Map*.rxdata ────────────────── */
const string = (v) => RString.fromText(String(v));
const leerMapa = (nombre) => marshalLoad(fs.readFileSync(path.join(DATA, nombre)));
const guardarMapa = (nombre, objeto) => { if (!DRY) fs.writeFileSync(path.join(DATA, nombre), Buffer.from(marshalDump(objeto))); };

/* ─────────────────────────────────── main ─────────────────────────────── */
if (isMain) {
  if (!EXTRACT && !INSTALL && !VERIFY && !VERIFY_FRAMES && !VERIFY_PALETAS && !PALETAS && !SELFTEST) {
    console.log("uso: --extract | --install | --verify | --verify-frames [--repair] | --verify-paletas | --paletas | --selftest  [--dry-run] [--dir ROM_DIR]");
    process.exit(1);
  }
  if (SELFTEST) selftest();
  else if (EXTRACT) extraer();
  else if (INSTALL) instalar();
  else if (VERIFY) verificar();
  else if (VERIFY_FRAMES) verificarFrames();
  else if (VERIFY_PALETAS) verificarPaletas();
  else if (PALETAS) refrescarPaletas();
}
