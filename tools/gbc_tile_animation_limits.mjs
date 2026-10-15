#!/usr/bin/env node
/**
 * Límites de la GBC sobre la animación de tiles + revisión de la dimensión
 * creepypasta (Dimensional Nightmare).
 *
 * La regla que se aplica es literal: **sólo animaciones lentas y sólo donde el
 * original de Game Boy Color las tenía**. Las dos mitades se comprueban con
 * datos medibles, no de oído:
 *
 *   1. **Qué animaba el original.** Se lee el desensamblado de pokecrystal que
 *      ya vive en el repositorio (`pokecrystal-master.zip`):
 *      `data/tileset_anims.asm` es la tabla de secuencias de animación por
 *      tileset y `engine/tilesets/tileset_anims.asm` es el intérprete que las
 *      ejecuta. De ahí salen las clases animadas (agua, cascada, remolino,
 *      flores, lava, pilares de torre, fuente, árboles) y los tilesets que,
 *      sencillamente, no animan nada (interiores, tiendas, laboratorios…).
 *      Un comando por VBlank → el ciclo completo de cada tileset es de 8 a 19
 *      fotogramas de 59,73 Hz, es decir entre 0,13 s y 0,32 s por paso.
 *   2. **Qué hace el motor de destino.** Fire Ash corre sobre RMXP (mkxp), que
 *      anima los autotiles con una cadencia fija: 4 fotogramas, 16 fotogramas
 *      de juego por paso (0,4 s a 40 fps, 1,6 s el ciclo completo). Es más
 *      lenta que la GBC, así que cualquier autotile animado cumple la mitad
 *      «lenta» de la regla; en cambio nohay forma de acelerarla desde el
 *      contenido, y cualquier animación «a mano» (panorama o imágenes
 *      cambiadas por un proceso paralelo) sí puede pasarse de rápida.
 *
 * Con eso, la herramienta:
 *
 *   · regenera el bloque `gbc` de `content/gbc_tile_animation_limits.json`
 *     (números derivados del desensamblado, con su SHA-1 de procedencia);
 *   · censa todos los autotiles declarados por los tilesets que usan los mapas
 *     de la dimensión y los clasifica según la política del mismo JSON;
 *   · cuenta cuántas celdas animadas hay realmente pintadas en esos mapas;
 *   · busca animaciones falsas (procesos paralelos que cambian panorama o
 *     imágenes con esperas más cortas que el suelo permitido);
 *   · escribe el informe (`content/gbc_tile_animation_review.json`) y el
 *     documento (`docs/DIMENSIONAL_NIGHTMARE/22_LIMITES_GBC_ANIMACIONES.md`).
 *
 * Uso:
 *   node tools/gbc_tile_animation_limits.mjs                # regenera límites + informe + doc
 *   node tools/gbc_tile_animation_limits.mjs --check        # sólo verifica (no escribe)
 *   node tools/gbc_tile_animation_limits.mjs --check --strict   # las observaciones también fallan
 *   node tools/gbc_tile_animation_limits.mjs --print        # muestra el informe por pantalla
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { marshalLoad } from "../web/js/marshal.js";
import { parseMap, parseTileset, tableGet } from "../web/js/rmxp.js";
import { DATA } from "./lib/fire_ash_registry.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ZIP_PATH = path.join(ROOT, "pokecrystal-master.zip");
const ENTRY_DATA = "pokecrystal-master/data/tileset_anims.asm";
const ENTRY_ENGINE = "pokecrystal-master/engine/tilesets/tileset_anims.asm";
const CONTRACT_PATH = path.join(ROOT, "content", "dimensional_nightmare_visual_contract.json");
const LIMITS_PATH = path.join(ROOT, "content", "gbc_tile_animation_limits.json");
const REVIEW_PATH = path.join(ROOT, "content", "gbc_tile_animation_review.json");
const DOC_PATH = path.join(ROOT, "docs", "DIMENSIONAL_NIGHTMARE", "22_LIMITES_GBC_ANIMACIONES.md");

const CHECK = process.argv.includes("--check");
const STRICT = process.argv.includes("--strict");
const PRINT = process.argv.includes("--print");

/** Frecuencia de VBlank en Game Boy Color (59,7275 Hz). */
const HZ_VBLANK = 59.7275;
/** Ancho de un fotograma de autotile en RMXP/mkxp (3 bloques de 32 px). */
const AUTOTILE_W = 96;
/** Fotogramas que mkxp reserva por autotile (atAreaW = 96*4). */
const MAX_FRAMES = 4;

/* ─────────────────────────── lector mínimo de ZIP ───────────────────────── */

/**
 * Lee una entrada de un ZIP (método 0 almacenado o 8 deflate) usando sólo
 * zlib: el repositorio no depende de ninguna librería de archivos.
 */
function readZipEntry(zipPath, wanted) {
  const buf = fs.readFileSync(zipPath);
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i -= 1) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error(`${path.basename(zipPath)}: no se encontró el directorio central`);
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let n = 0; n < count; n += 1) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLen);
    if (name === wanted) {
      const lNameLen = buf.readUInt16LE(localOff + 26);
      const lExtraLen = buf.readUInt16LE(localOff + 28);
      const start = localOff + 30 + lNameLen + lExtraLen;
      const raw = buf.subarray(start, start + compSize);
      return method === 0 ? Buffer.from(raw) : zlib.inflateRawSync(raw);
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  return null;
}

const sha1 = (buf) => crypto.createHash("sha1").update(buf).digest("hex").slice(0, 12);

/* ─────────────────────── tabla de animación del original ────────────────── */

/** Cada primitiva de pokecrystal, clasificada. null = no toca tiles. */
const FUNCIONES = {
  AnimateWaterTile: "agua",
  AnimateFlowerTile: "flores",
  AnimateWhirlpoolTile: "remolino",
  AnimateLavaBubbleTile1: "lava",
  AnimateLavaBubbleTile2: "lava",
  AnimateTowerPillarTile: "pilar-torre",
  AnimateFountainTile: "fuente",
  ForestTreeLeftAnimation: "arboles",
  ForestTreeRightAnimation: "arboles",
  ForestTreeLeftAnimation2: "arboles",
  ForestTreeRightAnimation2: "arboles",
  ScrollTileRightLeft: "agua",
  ScrollTileDown: "cascada",
  AnimateWaterPalette: "paleta-agua",
  FlickeringCaveEntrancePalette: "paleta-cueva",
  ReadTileToAnimBuffer: "buffer",
  WriteTileFromAnimBuffer: "buffer",
  WaitTileAnimation: null,
  StandingTileFrame: null,
  StandingTileFrame8: null,
  DoneTileAnimation: null,
};

const TILE_WRITE = new Set([
  "AnimateWaterTile", "AnimateFlowerTile", "AnimateWhirlpoolTile",
  "AnimateLavaBubbleTile1", "AnimateLavaBubbleTile2", "AnimateTowerPillarTile",
  "AnimateFountainTile", "ForestTreeLeftAnimation", "ForestTreeRightAnimation",
  "ForestTreeLeftAnimation2", "ForestTreeRightAnimation2", "WriteTileFromAnimBuffer",
]);

const nombreTileset = (etiqueta) => etiqueta
  .replace(/^Unused/, "")
  .replace(/^Tileset/, "")
  .replace(/Anim$/, "");

/**
 * Parsea `data/tileset_anims.asm`: cada etiqueta abre una secuencia de
 * comandos que el intérprete ejecuta de uno en uno, un comando por VBlank,
 * hasta llegar a `DoneTileAnimation` (que reinicia el contador).
 */
export function parsearTilesetAnims(texto) {
  const lineas = texto.split(/\r?\n/);
  const grupos = [];
  let etiquetas = [];
  let comandos = [];

  const cerrar = (forzar = false) => {
    // Varias etiquetas seguidas comparten el mismo cuerpo: sólo se cierra el
    // grupo cuando ya se han acumulado comandos (o al terminar el archivo).
    if (!etiquetas.length) return;
    if (!comandos.length && !forzar) return;
    const clases = new Set();
    const paletas = new Set();
    let escrituras = 0;
    for (const cmd of comandos) {
      const clase = FUNCIONES[cmd.funcion];
      if (cmd.funcion && FUNCIONES[cmd.funcion] === undefined) {
        clases.add(`desconocida:${cmd.funcion}`);
      }
      if (!clase) continue;
      if (clase.startsWith("paleta-")) paletas.add(clase);
      else if (clase !== "buffer") clases.add(clase);
      if (TILE_WRITE.has(cmd.funcion)) escrituras += 1;
    }
    const ciclo = comandos.length;
    const nombres = etiquetas.map(nombreTileset);
    const principal = /^\d+$/.test(nombres[0]) && nombres.length > 1 ? nombres[nombres.length - 1] : nombres[0];
    grupos.push({
      etiquetas,
      nombre: principal,
      mostrar: nombres.length > 1 ? `${principal} · ${nombres.length} tilesets` : principal,
      compartidoCon: nombres.filter((n) => n !== principal),
      sinUso: etiquetas[0].startsWith("Unused"),
      comandos: ciclo,
      segundos: Number((ciclo / HZ_VBLANK).toFixed(3)),
      escriturasPorCiclo: escrituras,
      elementos: [...clases].sort(),
      paletas: [...paletas].sort(),
      animaTiles: clases.size > 0,
    });
    etiquetas = [];
    comandos = [];
  };

  let dentroDeMacro = false;
  for (const linea of lineas) {
    if (/^\s*MACRO\b/.test(linea)) { dentroDeMacro = true; continue; }
    if (/^\s*ENDM\b/.test(linea)) { dentroDeMacro = false; continue; }
    if (dentroDeMacro) continue;
    const etiqueta = linea.match(/^([A-Za-z_][\w]*):(?:\s*;.*)?$/);
    if (etiqueta) { cerrar(); etiquetas.push(etiqueta[1]); continue; }
    if (!etiquetas.length) continue;
    const frame = linea.match(/^\s*tileframe\s+([A-Za-z_][\w]*)\s*(?:,\s*(.+?))?\s*(?:;.*)?$/);
    if (!frame) continue;
    comandos.push({ funcion: frame[1], argumento: (frame[2] ?? "").trim() });
  }
  cerrar(true);
  return grupos;
}

/** Resume las clases animadas del original con su ciclo más rápido. */
function resumirClases(grupos) {
  const clases = {};
  for (const g of grupos) {
    for (const clase of g.elementos) {
      const destino = clases[clase] ?? (clases[clase] = { clase, tilesets: [], cicloMasRapido: null });
      destino.tilesets.push(g.nombre);
      if (!destino.cicloMasRapido || g.comandos < destino.cicloMasRapido.comandos) {
        destino.cicloMasRapido = { tileset: g.nombre, comandos: g.comandos, segundos: g.segundos };
      }
    }
  }
  for (const valor of Object.values(clases)) valor.tilesets.sort();
  return clases;
}

/** Reconstruye el bloque `gbc` desde el desensamblado del repositorio. */
export function derivarBloqueGbc() {
  const data = readZipEntry(ZIP_PATH, ENTRY_DATA);
  const engine = readZipEntry(ZIP_PATH, ENTRY_ENGINE);
  if (!data) throw new Error(`${ENTRY_DATA} no está en ${path.basename(ZIP_PATH)}`);
  if (!engine) throw new Error(`${ENTRY_ENGINE} no está en ${path.basename(ZIP_PATH)}`);
  const grupos = parsearTilesetAnims(data.toString("utf8"));
  const usados = grupos.filter((g) => !g.sinUso);
  const enUso = grupos.filter((g) => !g.sinUso && g.animaTiles);
  return {
    fuente: {
      archivo: path.relative(ROOT, ZIP_PATH),
      entradas: [
        { entrada: ENTRY_DATA, sha1: sha1(data), bytes: data.length },
        { entrada: ENTRY_ENGINE, sha1: sha1(engine), bytes: engine.length },
      ],
      notas: [
        "Un comando por VBlank: _AnimateTileset ejecuta la función del índice hTileAnimFrame y lo incrementa (engine/tilesets/tileset_anims.asm).",
        "Se llama desde VBlank (home/vblank.asm) y sólo durante el primer quinto de éste: home/video.asm comprueba LY < LY_VBLANK + 7.",
        "Se ejecuta con el banco 0 de VRAM seleccionado, así que los tiles $80 y superiores (banco 1) no se pueden animar.",
        "hMapAnims = 0 desactiva toda la animación de mapa.",
      ],
    },
    hzVBlank: HZ_VBLANK,
    comandosPorVBlank: 1,
    limiteTilesAnimables: "sólo VRAM banco 0 (tiles $00–$7F); una escritura de tile por VBlank como máximo",
    tilesets: grupos,
    clases: resumirClases(enUso),
    clasesSinUso: resumirClases(grupos.filter((g) => g.sinUso)),
    resumen: {
      secuencias: grupos.length,
      secuenciasEnUso: usados.length,
      tilesetsQueAnimanTiles: enUso.length,
      secuenciasSinUso: grupos.filter((g) => g.sinUso).length,
      tilesetsSinAnimacion: grupos.filter((g) => !g.animaTiles).map((g) => g.mostrar),
      totalTilesets: grupos.reduce((n, g) => n + g.etiquetas.length, 0),
      tilesetsSinAnimacionCantidad: grupos.filter((g) => !g.animaTiles).reduce((n, g) => n + g.etiquetas.length, 0),
      cicloMasRapido: enUso
        .reduce((min, g) => (!min || g.comandos < min.comandos ? { tileset: g.nombre, comandos: g.comandos, segundos: g.segundos } : min), null),
      cicloMasLento: enUso
        .reduce((max, g) => (!max || g.comandos > max.comandos ? { tileset: g.nombre, comandos: g.comandos, segundos: g.segundos } : max), null),
    },
  };
}

/* ────────────────────────────── política ────────────────────────────────── */

const POLITICA_POR_DEFECTO = {
  alcance: "Dimensional Nightmare (rangos de mapas del contrato visual)",
  minimoFramesPorPaso: 8,
  minimoSegundosPorPaso: 0.2,
  cadenciaNativaAutotilesUnicaPermitida: true,
  interior: {
    patron: "inside|interior|interior general|house|habitaci|room|mart|pok[eé]center|center|lab|facility|gate|station|mansion|corner|underground",
    clasesProhibidas: ["fuente"],
    nota: "En el original de GBC los tilesets de interior (casa, centro, tienda, laboratorio…) sólo encadenan WaitTileAnimation: no animan nada.",
  },
  clases: [
    { clase: "cascada", permitida: true, patrones: ["waterfall", "cascada"], origen: "ScrollTileDown (cueva $40, ruta helada $31)" },
    { clase: "remolino", permitida: true, patrones: ["whirlpool", "remolino"], origen: "AnimateWhirlpoolTile (sólo Johto)" },
    { clase: "lava", permitida: true, patrones: ["lava"], origen: "AnimateLavaBubbleTile1/2 (sala de Élite Four)" },
    { clase: "pilar-torre", permitida: true, patrones: ["tower", "pillar", "torre", "pilar"], origen: "AnimateTowerPillarTile (torre)" },
    { clase: "flores", permitida: true, patrones: ["flower", "flor"], origen: "AnimateFlowerTile ($03)" },
    { clase: "arboles", permitida: true, patrones: ["tree", "arbol", "forest", "bosque"], origen: "ForestTreeLeft/RightAnimation (bosque)" },
    { clase: "fuente", permitida: true, patrones: ["fountain", "fuente"], origen: "AnimateFountainTile (sólo el Parque Nacional, $5f)", nota: "Permitida en exterior; prohibida en interior (ver política.interior)." },
    { clase: "orilla", permitida: false, patrones: ["^shore", "shore$", "orilla", "beach", "playa", "^sand", "sand"], excluir: ["sea", "water", "river", "ocean", "lake", "without shore"], origen: "sin equivalente en el original", nota: "La orilla es estática en GBC: sólo se anima la lámina de agua, no la arena." },
    { clase: "paleta-agua", permitida: false, patrones: ["water palette", "paleta"], origen: "AnimateWaterPalette: ciclo de paleta, no de tiles", nota: "RMXP no cicla paletas de tileset; un tono de pantalla repetido sería una animación nueva, no del original." },
    { clase: "paleta-cueva", permitida: false, patrones: ["cave palette"], origen: "FlickeringCaveEntrancePalette: parpadeo de la entrada de cueva", nota: "Parpadeo deliberado: fuera del conjunto lento y del original." },
    { clase: "agua", permitida: true, patrones: ["^sea", "sea", "^water$", "water", "river", "pond", "ocean", "lagoon", "agua"], origen: "AnimateWaterTile / ScrollTileRightLeft (vTiles2 $14, $03, $35)" },
  ],
  claseDesconocida: {
    permitida: false,
    nota: "Cualquier autotile animado que no encaje en las clases del original se considera animación nueva y queda prohibido.",
  },
};

function cargarPolitica() {
  if (fs.existsSync(LIMITS_PATH)) {
    const previo = JSON.parse(fs.readFileSync(LIMITS_PATH, "utf8"));
    return { ...POLITICA_POR_DEFECTO, ...(previo.politica ?? {}) };
  }
  return POLITICA_POR_DEFECTO;
}

/** Clasifica el nombre de un autotile según la política. */
export function clasificar(nombre, politica) {
  const bruto = String(nombre);
  const suave = bruto.replace(/[_\-]+/g, " ").replace(/\d+$/, "").trim().toLowerCase();
  for (const regla of politica.clases) {
    if ((regla.excluir ?? []).some((p) => new RegExp(p, "i").test(suave))) continue;
    if (regla.patrones.some((p) => new RegExp(p, "i").test(suave))) return regla;
  }
  return { clase: "desconocida", permitida: politica.claseDesconocida.permitida, origen: "sin equivalente en el original", nota: politica.claseDesconocida.nota };
}

/**
 * Los tilesets de la dimensión son clones en paleta Game Boy: sus autotiles se
 * llaman `DN_GB_TS<id>_A<ranura>` y no dicen nada del dibujo. Se recupera el
 * nombre original consultando el tileset del que se clonaron.
 */
export function nombreOriginal(nombre, tilesets) {
  const clon = String(nombre).match(/^DN_GB_TS(\d+)_A(\d+)$/);
  if (!clon) return { nombre: String(nombre), clonado: null };
  const origen = tilesets.get(Number(clon[1]));
  const original = origen?.autotiles?.[Number(clon[2])];
  return { nombre: original || String(nombre), clonado: original ? { tilesetId: Number(clon[1]), tileset: origen.tilesetName, ranura: Number(clon[2]) } : null };
}

/* ────────────────────────── censo de la dimensión ───────────────────────── */

const tamanoPng = (archivo) => {
  try {
    const b = fs.readFileSync(archivo);
    if (b.length < 24 || b.toString("latin1", 1, 4) !== "PNG") return null;
    return { ancho: b.readUInt32BE(16), alto: b.readUInt32BE(20) };
  } catch {
    return null;
  }
};

const enRangos = (id, rangos) => rangos.some(([a, b]) => id >= a && id <= b);

function autotilesDeAnimacion(tileset, gfxDir, politica, tilesets) {
  const salida = [];
  const nombres = tileset.autotiles ?? [];
  const clon = String(tileset.tilesetName).match(/^DN_GB_TS(\d+)$/);
  const origen = clon ? tilesets.get(Number(clon[1])) : null;
  const contexto = [tileset.name, tileset.tilesetName, origen?.name, origen?.tilesetName]
    .filter(Boolean).join(" ");
  nombres.forEach((nombre, slot) => {
    if (!nombre) return;
    const archivo = path.join(gfxDir, `${nombre}.png`);
    const tamano = tamanoPng(archivo);
    const ancho = tamano?.ancho ?? 0;
    const alto = tamano?.alto ?? 0;
    const animado = ancho > AUTOTILE_W;           // mkxp: updateAutotileInfo()
    const framesArchivo = ancho ? Math.floor(ancho / AUTOTILE_W) : 0;
    const framesMostrados = Math.min(MAX_FRAMES, framesArchivo);
    const resuelto = nombreOriginal(nombre, tilesets);
    const regla = clasificar(resuelto.nombre, politica);
    const esInterior = new RegExp(politica.interior.patron, "i").test(contexto);
    let permitida = regla.permitida;
    let motivo = regla.nota ?? regla.origen;
    if (permitida && esInterior && politica.interior.clasesProhibidas.includes(regla.clase)) {
      permitida = false;
      motivo = `interior (${origen?.name || tileset.name || tileset.tilesetName}): ${politica.interior.nota}`;
    }
    salida.push({
      slot,
      recurso: nombre,
      original: resuelto.nombre,
      clonadoDe: resuelto.clonado,
      existe: Boolean(tamano),
      ancho,
      alto,
      animado,
      framesArchivo,
      formato: !alto ? "desconocido" : (alto === 128 ? "completo (96×128)" : `reducido (alto ${alto})`),
      framesMostrados: !animado ? 1 : (alto === 128 ? framesMostrados : null),
      clase: regla.clase,
      clasePermitida: permitida,
      celdas: 0,
      mapas: [],
      motivo,
    });
  });
  return salida;
}

export function censarDimension(politica) {
  const contrato = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8"));
  const rangos = contrato.mapRanges ?? [];
  const gfxDir = path.join(DATA, "..", "Graphics", "Autotiles");
  const tilesetsRaw = marshalLoad(fs.readFileSync(path.join(DATA, "Tilesets.rxdata")));
  const tilesets = new Map();
  for (let i = 1; i < tilesetsRaw.length; i += 1) {
    if (!tilesetsRaw[i]) continue;
    const ts = parseTileset(tilesetsRaw[i]);
    tilesets.set(ts.id, ts);
  }

  const mapas = fs.readdirSync(DATA)
    .filter((f) => /^Map\d+\.rxdata$/.test(f))
    .map((f) => Number(f.match(/\d+/)[0]))
    .filter((id) => enRangos(id, rangos))
    .sort((a, b) => a - b);

  const porTileset = new Map();
  const eventos = { procesosParalelos: 0, paginasConSwap: 0, rapidos: [] };
  const CODIGOS_SWAP = new Set([204, 205, 206, 231, 232]); // ajustes de mapa, niebla, clima, mostrar/mover imagen

  for (const id of mapas) {
    const parsed = parseMap(marshalLoad(fs.readFileSync(path.join(DATA, `Map${String(id).padStart(3, "0")}.rxdata`))));
    const ts = tilesets.get(parsed.tilesetId);
    if (!ts) continue;
    if (!porTileset.has(ts.id)) porTileset.set(ts.id, { tileset: ts, mapas: [], autotiles: autotilesDeAnimacion(ts, gfxDir, politica, tilesets) });
    const entrada = porTileset.get(ts.id);
    entrada.mapas.push(id);

    // celdas ocupadas por cada autotile (ids 48..383 → slot = id/48 - 1)
    for (let z = 0; z < 3; z += 1) {
      for (let y = 0; y < parsed.height; y += 1) {
        for (let x = 0; x < parsed.width; x += 1) {
          const v = tableGet(parsed.table, x, y, z);
          if (v < 48 || v >= 384) continue;
          const slot = Math.floor(v / 48) - 1;
          const auto = entrada.autotiles.find((a) => a.slot === slot);
          if (auto) { auto.celdas += 1; if (!auto.mapas.includes(id)) auto.mapas.push(id); }
        }
      }
    }

    // procesos paralelos que fingen animación cambiando panorama o imágenes
    for (const { obj } of parsed.events) {
      const nombre = String(obj.getIvar?.("@name") ?? "") || `ev${obj.getIvar?.("@id") ?? "?"}`;
      for (const page of obj.getIvar?.("@pages") ?? []) {
        if (Number(page.getIvar("@trigger") ?? 0) !== 4) continue; // 4 = proceso paralelo
        eventos.procesosParalelos += 1;
        const lista = page.getIvar("@list") ?? [];
        const codigos = lista.map((c) => Number(c.getIvar("@code") ?? 0));
        if (!codigos.some((c) => CODIGOS_SWAP.has(c))) continue;
        eventos.paginasConSwap += 1;
        const esperas = lista
          .filter((c) => Number(c.getIvar("@code") ?? 0) === 106)
          .map((c) => Number(c.getIvar("@parameters")?.[0] ?? 0))
          .filter((n) => n > 0);
        const minima = esperas.length ? Math.min(...esperas) : 0;
        if (minima < politica.minimoFramesPorPaso) {
          eventos.rapidos.push({ mapa: id, evento: nombre, esperaMinima: minima, comandos: codigos.filter((c) => CODIGOS_SWAP.has(c)) });
        }
      }
    }
  }

  const tilesetsRevisados = [...porTileset.values()].map(({ tileset, mapas: usadoEn, autotiles }) => ({
    id: tileset.id,
    nombre: tileset.name,
    recursos: tileset.tilesetName,
    mapas: usadoEn.sort((a, b) => a - b),
    autotiles: autotiles.sort((a, b) => a.slot - b.slot),
  })).sort((a, b) => a.id - b.id);

  return { contrato, rangos, mapas, tilesets: tilesetsRevisados, eventos };
}

/* ──────────────────────────────── veredicto ─────────────────────────────── */

export function evaluar(censo, politica, motor) {
  const incumplimientos = [];
  const observaciones = [];
  let declarados = 0;
  let animados = 0;
  let celdasAnimadas = 0;
  const clasesVistas = new Map();

  for (const ts of censo.tilesets) {
    for (const auto of ts.autotiles) {
      declarados += 1;
      if (!auto.existe) {
        observaciones.push({ tipo: "recurso-ausente", tileset: ts.recursos, autotile: auto.recurso, detalle: "el PNG del autotile no existe en Graphics/Autotiles" });
        continue;
      }
      if (!auto.animado) continue;
      animados += 1;
      celdasAnimadas += auto.celdas;
      clasesVistas.set(auto.clase, (clasesVistas.get(auto.clase) ?? 0) + 1);
      if (auto.framesArchivo > MAX_FRAMES) {
        observaciones.push({
          tipo: "fotogramas-mudos",
          tileset: ts.recursos,
          autotile: auto.recurso,
          detalle: `el PNG trae ${auto.framesArchivo} fotogramas pero el motor sólo muestra ${MAX_FRAMES} (paso de ${AUTOTILE_W} px): ${auto.framesArchivo - MAX_FRAMES} fotogramas nunca se ven`,
        });
      }
      if (auto.alto && auto.alto !== 128) {
        observaciones.push({
          tipo: "formato-reducido",
          tileset: ts.recursos,
          autotile: auto.recurso,
          detalle: `mide ${auto.ancho}×${auto.alto} px: no ocupa la rejilla de ${AUTOTILE_W}×128 que el motor reserva por autotile, así que su ciclo no encaja con el paso de ${AUTOTILE_W} px`,
        });
      }
      if (!auto.clasePermitida && auto.celdas > 0) {
        incumplimientos.push({
          tipo: "clase-no-original",
          tileset: ts.recursos,
          autotile: auto.recurso,
          clase: auto.clase,
          celdas: auto.celdas,
          mapas: auto.mapas,
          detalle: `animación pintada de una clase que el original de GBC no animaba (${auto.motivo})`,
        });
      } else if (!auto.clasePermitida) {
        observaciones.push({
          tipo: "clase-no-original-latente",
          tileset: ts.recursos,
          autotile: auto.recurso,
          clase: auto.clase,
          motivo: auto.motivo,
          detalle: `clase «${auto.clase}» declarada animada pero sin pintar en ningún mapa: si se pinta incumpliría la regla (${auto.motivo})`,
        });
      }
    }
  }

  for (const rapido of censo.eventos.rapidos) {
    incumplimientos.push({
      tipo: "animacion-rapida",
      mapa: rapido.mapa,
      evento: rapido.evento,
      detalle: `proceso paralelo que cambia panorama/imagen cada ${rapido.esperaMinima} fotogramas (${(rapido.esperaMinima / motor.fps).toFixed(3)} s): por debajo del mínimo de ${politica.minimoFramesPorPaso} fotogramas (${politica.minimoSegundosPorPaso} s)`,
    });
  }

  const cadenciaOk = motor.framesPorPaso >= politica.minimoFramesPorPaso;
  return {
    incumplimientos,
    observaciones,
    declarados,
    animados,
    celdasAnimadas,
    clasesVistas: [...clasesVistas.entries()].map(([clase, n]) => ({ clase, autotiles: n })).sort((a, b) => b.autotiles - a.autotiles),
    cadenciaOk,
  };
}

/* ──────────────────────────── informe y documento ───────────────────────── */

const MOTOR = {
  engine: "RPG Maker XP sobre mkxp (base de Fire Ash)",
  autotileFrameWidthPx: AUTOTILE_W,
  framesUsadosPorAutotile: MAX_FRAMES,
  framesPorPaso: 16,
  fps: 40,
  fpsNota: "valor por defecto de RMXP/mkxp; mkxp.json de Fire Ash no lo sobreescribe",
  segundosPorPaso: 0.4,
  segundosPorCiclo: 1.6,
  detectaAnimacion: `ancho del PNG > ${AUTOTILE_W} px (mkxp src/tilemap.cpp · updateAutotileInfo)`,
  mecanica: "el shader del tilemap desplaza la coordenada de textura en (índice de animación) × 96 px",
  fuente: "mkxp src/tilemap.cpp (atAnimation[16*4]) y src/tileatlas.cpp (atAreaW = 96*4)",
};

function documentoMarkdown({ limites, censo, veredicto, resumen, politica }) {
  const gbc = limites.gbc;
  const filasTilesets = gbc.tilesets
    .map((g) => {
      const nombre = `${g.mostrar}${g.sinUso ? " (secuencia sin usar)" : ""}`;
      const elementos = g.elementos.length
        ? `${g.elementos.join(", ")}${g.paletas.length ? ` · paleta: ${g.paletas.join(", ")}` : ""}`
        : "— nada, sólo esperas —";
      return `| ${nombre} | ${g.comandos} | ${g.segundos.toFixed(3)} s | ${g.escriturasPorCiclo} | ${elementos} |`;
    })
    .join("\n");
  const sinAnimar = gbc.tilesets.filter((g) => !g.animaTiles).map((g) => g.nombre);
  const filasClases = Object.values(gbc.clases)
    .map((c) => `| ${c.clase} | ${c.cicloMasRapido.comandos} | ${c.cicloMasRapido.segundos.toFixed(3)} s | ${c.tilesets.join(", ")} |`)
    .join("\n");
  const filasMotor = censo.tilesets
    .flatMap((ts) => ts.autotiles.filter((a) => a.animado)
      .map((a) => `| ${ts.nombre || ts.recursos} (\`${ts.recursos}\`) | A${a.slot} · \`${a.recurso}\`${a.original && a.original !== a.recurso ? ` ← \`${a.original}\`` : ""} | ${a.ancho}×${a.alto} | ${a.framesMostrados === null ? "—" : `${a.framesMostrados}/${a.framesArchivo}`} | ${a.clase} | ${a.celdas} | ${a.clasePermitida ? "✔ original" : "✘ no original"} |`))
    .join("\n");
  const filasPolitica = politica.clases
    .map((c) => `| ${c.clase} | ${c.permitida ? "permitida" : "prohibida"} | \`${c.patrones.join("`, `")}\` | ${c.origen}${c.nota ? ` · ${c.nota}` : ""} |`)
    .join("\n");
  const obs = veredicto.observaciones.map((o) => `- **${o.tipo}** · \`${o.autotile}\` (${o.tileset}): ${o.detalle}`).join("\n") || "- Ninguna.";
  const latentes = veredicto.observaciones.filter((o) => o.tipo === "clase-no-original-latente");
  const latentesLista = latentes.map((o) => `- \`${o.autotile}\` (clase «${o.clase}»): ${o.motivo}`).join("\n");
  const inc = veredicto.incumplimientos.map((i) => `- **${i.tipo}** · ${i.detalle}`).join("\n") || "- Ninguno.";

  return `# 22 · Límites de la GBC sobre la animación de tiles

> Regla de esta dimensión: **sólo animaciones lentas y sólo donde el original
> de Game Boy Color las tenía.**
>
> Generado por \`tools/gbc_tile_animation_limits.mjs\` (regenerar con
> \`npm run dn:anim:review\`; verificar con \`npm run dn:anim:check\`).
> Los números de la GBC salen del desensamblado de pokecrystal que está en el
> repositorio, no de memoria: \`${limites.gbc.fuente.archivo}\`.

## 1. Veredicto

**${resumen.estado}** — ${resumen.frase}

| Dato | Valor |
|---|---:|
| Mapas de la dimensión revisados | ${censo.mapas.length} |
| Tilesets usados por esos mapas | ${censo.tilesets.length} |
| Autotiles declarados | ${veredicto.declarados} |
| Autotiles animados (ancho > ${AUTOTILE_W} px) | ${veredicto.animados} |
| Celdas animadas realmente pintadas | **${veredicto.celdasAnimadas}** |
| Procesos paralelos en la dimensión | ${censo.eventos.procesosParalelos} |
| Procesos paralelos que cambian panorama/imagen | ${censo.eventos.paginasConSwap} |
| Animaciones más rápidas que el mínimo de ${politica.minimoSegundosPorPaso} s | ${censo.eventos.rapidos.length} |
| Incumplimientos | ${veredicto.incumplimientos.length} |
| Observaciones | ${veredicto.observaciones.length} |

## 2. Lo que la GBC sí podía animar

El intérprete de animación de tiles de la GBC ejecuta **un comando por VBlank**
(${gbc.hzVBlank} Hz) y recorre en bucle la secuencia de cada tileset hasta
\`DoneTileAnimation\`. Eso fija el ritmo: un ciclo de 8 a 19 comandos son
${gbc.resumen.cicloMasRapido.segundos} s a ${gbc.resumen.cicloMasLento.segundos} s por paso. Nada más rápido,
porque sólo cabe una escritura de tile por VBlank y además dentro del primer
quinto de éste.

| Tileset del original | Comandos del ciclo | Paso | Escrituras/ciclo | Qué se anima |
|---|---:|---:|---:|---|
${filasTilesets}

Clases animadas del original, con su ciclo más rápido:

| Clase | Comandos | Paso | Tilesets |
|---|---:|---:|---|
${filasClases}

Y lo que **no** se anima es la mayoría: ${gbc.resumen.tilesetsSinAnimacionCantidad} de los ${gbc.resumen.totalTilesets}
tilesets del original comparten una sola secuencia de esperas. En escenarios
como casa, centro Pokémon, tienda, laboratorio, torre de radio, mansión o
estación, la GBC no mueve un solo tile.

Límites duros que explican por qué el original es tan austero:

- ${gbc.fuente.notas[0]}
- ${gbc.fuente.notas[1]}
- ${gbc.fuente.notas[2]}
- ${gbc.fuente.notas[3]}
- Como máximo ${gbc.limiteTilesAnimables}.

## 3. Lo que hace el motor de destino

| Dato | Valor |
|---|---|
| Motor | ${MOTOR.engine} |
| Ancho de un fotograma de autotile | ${MOTOR.autotileFrameWidthPx} px |
| Fotogramas que se usan por autotile | ${MOTOR.framesUsadosPorAutotile} |
| Fotogramas de juego por paso | ${MOTOR.framesPorPaso} (${MOTOR.segundosPorPaso} s a ${MOTOR.fps} fps · ${MOTOR.fpsNota}) |
| Ciclo completo | ${MOTOR.segundosPorCiclo} s |
| Cuándo considera animado un autotile | ${MOTOR.detectaAnimacion} |
| Mecánica | ${MOTOR.mecanica} |

Consecuencia: la cadencia nativa de RMXP (${MOTOR.segundosPorPaso} s por paso) es
${(MOTOR.segundosPorPaso / gbc.resumen.cicloMasRapido.segundos).toFixed(1)}× más lenta que la animación más rápida de la GBC
(${gbc.resumen.cicloMasRapido.segundos} s). Cualquier autotile animado cumple la parte «lenta» de la regla
sin intervención; y no se puede acelerar desde el contenido, porque la cadencia
está en el motor. Lo que sí puede romperla es una animación hecha a mano con
procesos paralelos: por eso se vigila.

## 4. Política aplicada

| Clase | Veredicto | Detectada por | Origen en el original |
|---|---|---|---|
${filasPolitica}

Reglas:

1. Un tile animado sólo se admite si su clase aparece en la tabla del original.
2. La cadencia tiene que ser la nativa del motor (${MOTOR.framesPorPaso} fotogramas por paso). Ninguna
   animación de tiles puede ir más rápido de ${politica.minimoFramesPorPaso} fotogramas
   (${politica.minimoSegundosPorPaso} s), que ya es un ${((politica.minimoFramesPorPaso / MOTOR.fps) / gbc.resumen.cicloMasRapido.segundos).toFixed(1)}× por encima del techo de la GBC.
3. ${politica.interior.nota}
4. Si un autotile animado no está pintado en ningún mapa no cuenta como
   incumplimiento, pero se registra como observación latente: pintarlo
   incumpliría la regla.

## 5. Estado medido del contenido actual

| Tileset | Autotile | PNG | Fotogramas vistos/totales | Clase | Celdas pintadas | Veredicto |
|---|---|---|---:|---|---:|---|
${filasMotor || "| — | — | — | — | — | — | — |"}

## 6. Incumplimientos

${inc}

## 7. Observaciones

${obs}

Las que vigilar son las \`clase-no-original-latente\`: son autotiles animados que
hoy no están pintados en ningún mapa, pero que incumplirían la regla en cuanto
alguien los use. ${latentes.length === 0 ? "Ahora mismo no hay ninguna." : `Ahora mismo hay ${latentes.length}:`}
${latentes.length === 0 ? "" : latentesLista}

Los mapas de la dimensión se pintan con la matriz de su ficha de referencia
(ids de tile ≥ 384, ver doc 12 §E3), así que los autotiles de los tilesets
clonados en paleta Game Boy quedan declarados pero sin usar: de ahí que el
censo de celdas animadas sea 0.

## 8. Cómo se comprueba

\`\`\`bash
npm run dn:anim:review   # regenera límites, informe y este documento
npm run dn:anim:check    # falla si hay animación prohibida o demasiado rápida
npm run dn:anim:strict   # idem, y también falla con las observaciones
\`\`\`

Salidas: \`content/gbc_tile_animation_limits.json\` (límites + política),
\`content/gbc_tile_animation_review.json\` (censo medido) y este documento.
`;
}

/* ────────────────────────────────── main ────────────────────────────────── */

function main() {
  const politica = cargarPolitica();
  const gbc = derivarBloqueGbc();
  const censo = censarDimension(politica);
  const veredicto = evaluar(censo, politica, MOTOR);

  const resumen = {
    mapas: censo.mapas.length,
    tilesets: censo.tilesets.length,
    declarados: veredicto.declarados,
    animados: veredicto.animados,
    celdasAnimadas: veredicto.celdasAnimadas,
    procesosParalelos: censo.eventos.procesosParalelos,
    paginasConSwap: censo.eventos.paginasConSwap,
    rapidos: censo.eventos.rapidos.length,
    incumplimientos: veredicto.incumplimientos.length,
    observaciones: veredicto.observaciones.length,
    estado: veredicto.incumplimientos.length === 0 ? "CUMPLE" : "INCUMPLE",
    frase: veredicto.incumplimientos.length === 0
      ? (veredicto.celdasAnimadas === 0
        ? "la dimensión no pinta ni una celda animada: no hay ninguna animación de tiles dentro del juego, así que no hay nada fuera de los límites de la GBC"
        : "toda animación pintada pertenece a una clase que el original de GBC animaba y usa la cadencia nativa del motor")
      : "hay animación de tiles fuera de lo que el original de GBC permitía",
  };

  const limites = {
    esquema: "gbc_tile_animation/1.0",
    titulo: "Límites de la GBC sobre la animación de tiles",
    regla: "Sólo animaciones lentas y sólo donde el original de Game Boy Color las tenía.",
    generadoPor: "tools/gbc_tile_animation_limits.mjs",
    gbc,
    motor: MOTOR,
    politica,
  };

  const previo = fs.existsSync(LIMITS_PATH) ? JSON.parse(fs.readFileSync(LIMITS_PATH, "utf8")) : null;
  if (CHECK) {
    const errores = [...veredicto.incumplimientos];
    if (STRICT) errores.push(...veredicto.observaciones.map((o) => ({ ...o, severidad: "observación" })));
    if (previo && JSON.stringify(previo.gbc) !== JSON.stringify(gbc)) {
      errores.push({ tipo: "límites-desactualizados", detalle: "content/gbc_tile_animation_limits.json no coincide con el desensamblado: regenera con npm run dn:anim:review" });
    }
    if (!veredicto.cadenciaOk) {
      errores.push({ tipo: "cadencia", detalle: `la cadencia nativa (${MOTOR.framesPorPaso} fotogramas por paso) está por debajo del mínimo permitido (${politica.minimoFramesPorPaso})` });
    }
    console.log(`GBC: ${gbc.resumen.tilesetsQueAnimanTiles} de ${gbc.resumen.secuencias} secuencias animan tiles · paso ${gbc.resumen.cicloMasRapido.segundos}–${gbc.resumen.cicloMasLento.segundos} s`);
    console.log(`DN: ${resumen.mapas} mapas · ${resumen.declarados} autotiles declarados · ${resumen.animados} animados · ${resumen.celdasAnimadas} celdas pintadas · ${resumen.procesosParalelos} procesos paralelos (${resumen.rapidos} rápidos)`);
    console.log(`Veredicto: ${resumen.estado} · ${resumen.incumplimientos} incumplimientos · ${resumen.observaciones} observaciones`);
    for (const e of errores) console.log(`  ✘ ${e.tipo}: ${e.detalle}`);
    if (errores.length) process.exit(1);
    console.log("  ✔ ninguna animación fuera de los límites de la GBC");
    return;
  }

  fs.writeFileSync(LIMITS_PATH, `${JSON.stringify(limites, null, 2)}\n`);
  const informe = {
    esquema: "gbc_tile_animation_review/1.0",
    generadoPor: "tools/gbc_tile_animation_limits.mjs",
    alcance: { mapas: censo.mapas, rangos: censo.rangos, tilesets: censo.tilesets.map((t) => ({ id: t.id, nombre: t.recursos, mapas: t.mapas.length })) },
    resumen,
    clasesDetectadas: veredicto.clasesVistas,
    tilesets: censo.tilesets,
    eventos: censo.eventos,
    incumplimientos: veredicto.incumplimientos,
    observaciones: veredicto.observaciones,
  };
  fs.writeFileSync(REVIEW_PATH, `${JSON.stringify(informe, null, 2)}\n`);
  const md = documentoMarkdown({ limites, censo, veredicto, resumen, politica });
  fs.mkdirSync(path.dirname(DOC_PATH), { recursive: true });
  fs.writeFileSync(DOC_PATH, md);

  if (PRINT) console.log(md);
  console.log(`Límites GBC: ${gbc.resumen.tilesetsQueAnimanTiles}/${gbc.resumen.secuencias} secuencias animan tiles · paso ${gbc.resumen.cicloMasRapido.segundos}–${gbc.resumen.cicloMasLento.segundos} s`);
  console.log(`Dimensión: ${resumen.mapas} mapas · ${resumen.declarados} autotiles · ${resumen.animados} animados · ${resumen.celdasAnimadas} celdas pintadas · ${resumen.rapidos} animaciones rápidas`);
  console.log(`Veredicto ${resumen.estado}: ${resumen.frase}`);
  console.log(`→ ${path.relative(ROOT, LIMITS_PATH)}`);
  console.log(`→ ${path.relative(ROOT, REVIEW_PATH)}`);
  console.log(`→ ${path.relative(ROOT, DOC_PATH)}`);
}

main();
