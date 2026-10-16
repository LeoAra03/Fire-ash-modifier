#!/usr/bin/env node
/**
 * audit_gbc_terreno.mjs
 *
 * Audita que la extracción de la ROM GBC (FactoryAdventure.gb) no invente terreno,
 * y aplica y documenta la regla para celdas sin bit de colisión:
 *
 *   A. Extracción GB (`roms pokemon/factoryadventure/01_indice.json`): solo puede
 *      contener nombres de especie, sprites y textos. Ninguna clave ni fichero de
 *      colisión, pasaje, terreno o mapa.
 *   B. Registro de la dimensión (`content/dimensiones_barco.json`): la entrada
 *      factoryadventure debe declarar 0 mapas, 0 NPC y 0 diálogos del ROM. Así el
 *      terreno de esa dimensión sale de ventanas de mapas del propio juego.
 *   C. Regla para celdas sin bit (GBA, campaña 0, ROM `GlazedESPB6.gba`): en el
 *      MapLayout, una celda con bits 10–11 = 0 es libre. Se cuenta cuántas hay por
 *      mapa, se comprueba que quedan con paso 0 en lo instalado y se documenta en
 *      `content/colision_libres_sin_bit.json`.
 *
 * Uso:
 *   node tools/qa/audit_gbc_terreno.mjs              # audita y compara con la documentación
 *   node tools/qa/audit_gbc_terreno.mjs --escribir   # regenera content/colision_libres_sin_bit.json
 *
 * Sale con código 1 si algo falla. Las secciones que necesitan ROM o extracción
 * avisan y se saltan si no existen.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalLoad, RString } from "../../web/js/marshal.js";
import { tableFromUserDef, tableGet } from "../../web/js/rmxp.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const ESCRIBIR = process.argv.includes("--escribir");
const ROM_DIR = path.join(ROOT, "roms pokemon");
const DATA = path.join(ROOT, "pokemon_fire_ash", "Data");
const SALIDA = path.join(ROOT, "content", "colision_libres_sin_bit.json");

const COLISION_MASK = 0x0c00;
const PASS_BLOCK = 0x0f;
const CLAVES_GB_PERMITIDAS = new Set(["nombresEspecie", "sprites", "textos"]);
const PATRON_TERRENO = /colision|collision|passab|pasaje|terren|terrain|layout|mapa|map/i;

const errores = [];
const avisos = [];
const txt = (v) => (v instanceof RString ? v.text : v == null ? "" : String(v));

// ── A. extracción GB ──────────────────────────────────────────────────────────
const slugGB = path.join(ROM_DIR, "factoryadventure");
const indiceGB = path.join(slugGB, "01_indice.json");
let claveGB = [];
if (!fs.existsSync(indiceGB)) {
  avisos.push("A: no hay extracción GB; ejecuta `node tools/forense_roms.mjs --rom \"roms pokemon/FactoryAdventure.gb\"`");
} else {
  const indice = JSON.parse(fs.readFileSync(indiceGB, "utf8"));
  claveGB = Object.keys(indice.hallazgos ?? {});
  for (const k of claveGB) {
    if (!CLAVES_GB_PERMITIDAS.has(k)) errores.push(`A: hallazgo GB «${k}» fuera de lo permitido (nombres, sprites, textos)`);
    if (PATRON_TERRENO.test(k)) errores.push(`A: hallazgo GB con nombre de terreno «${k}»`);
  }
  const ficheros = [];
  const recorre = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) recorre(p); else ficheros.push(path.relative(slugGB, p));
    }
  };
  recorre(slugGB);
  for (const f of ficheros) if (PATRON_TERRENO.test(f) && !/\.png$/.test(f)) errores.push(`A: fichero de terreno en la extracción GB: ${f}`);
  const sinMapas = !ficheros.some((f) => /map/i.test(f));
  if (!sinMapas) errores.push("A: la extracción GB contiene ficheros de mapa");
}

// ── B. registro de la dimensión ───────────────────────────────────────────────
const dimensiones = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "dimensiones_barco.json"), "utf8"));
const dimFactory = (dimensiones.dimensiones ?? []).find((d) => d.id === "factoryadventure");
if (!dimFactory) {
  errores.push("B: no existe la dimensión factoryadventure en content/dimensiones_barco.json");
} else {
  const r = dimFactory.rom ?? {};
  for (const campo of ["mapasDetectados", "npcsDetectados", "dialogosDetectados"]) {
    if (r[campo] !== 0) errores.push(`B: rom.${campo} = ${r[campo]}; el ROM GB no aporta mapas, se esperaba 0`);
  }
}

// ── C. celdas sin bit (GBA, campaña 0) ────────────────────────────────────────
const romPath = path.join(ROM_DIR, "GlazedESPB6.gba");
const indicePath = path.join(ROOT, "reference", "roms_invitadas", "GlazedESPB6", "mapas_npcs.json");
const plan = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "rom_campaigns_complete.json"), "utf8"));
const manifiesto = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "rom_nativo.json"), "utf8"));
let documento = null;

if (!fs.existsSync(romPath) || !fs.existsSync(indicePath)) {
  avisos.push("C: falta la ROM GlazedESPB6.gba o su índice; sección C omitida");
} else {
  const rom = fs.readFileSync(romPath);
  const indice = new Map();
  for (const m of JSON.parse(fs.readFileSync(indicePath, "utf8")).mapas) indice.set(`${m.banco}:${m.indice}`, m);

  const tilesetsRaw = marshalLoad(fs.readFileSync(path.join(DATA, "Tilesets.rxdata")));
  const pasajes = new Map();
  for (let i = 1; i < tilesetsRaw.length; i += 1) {
    const o = tilesetsRaw[i];
    if (!o) continue;
    const n = txt(o.getIvar("@tileset_name"));
    if (n.startsWith("ROMN_")) pasajes.set(n, tableFromUserDef(o.getIvar("passages")).data);
  }

  const mapas = [];
  let celdasTotales = 0, libresSinBit = 0, bloqueadas = 0, mapasSinInstalar = 0, incumplen = 0;
  for (const bp of plan.campaigns["0"].maps) {
    const ficha = indice.get(`${bp.source.bank}:${bp.source.map}`);
    if (!ficha) { errores.push(`C: Map${bp.mapId} sin ficha en el índice de la ROM`); continue; }
    const L = rom.readUInt32LE(ficha.header) - 0x08000000;
    const w = rom.readUInt32LE(L), h = rom.readUInt32LE(L + 4);
    const mp = rom.readUInt32LE(L + 12) - 0x08000000;
    const archivo = path.join(DATA, `Map${String(bp.mapId).padStart(3, "0")}.rxdata`);
    const tsNombre = manifiesto.campaigns?.["0"]?.maps?.[bp.mapId]?.tileset ?? "";
    const pas = pasajes.get(tsNombre);
    let sin = 0, bloq = 0;
    if (!fs.existsSync(archivo) || !pas) {
      mapasSinInstalar += 1;
    } else {
      const mapa = marshalLoad(fs.readFileSync(archivo));
      const t = tableFromUserDef(mapa.getIvar("data"));
      if (t.x !== w || t.y !== h) {
        errores.push(`C: Map${bp.mapId} instalado ${t.x}×${t.y} ≠ ROM ${w}×${h}; no se puede comparar celda a celda`);
        mapasSinInstalar += 1;
        mapas.push({ mapId: bp.mapId, celdas: w * h, libresSinBit: null });
        continue;
      }
      for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) {
        const c = rom.readUInt16LE(mp + 2 * (y * w + x));
        if ((c & COLISION_MASK) !== 0) { bloq += 1; continue; }
        sin += 1;
        const v = tableGet(t, x, y, 0);
        const paso = v < pas.length ? pas[v] : -1;
        if (paso !== 0) {
          incumplen += 1;
          if (incumplen <= 5) errores.push(`C: Map${bp.mapId} (${x},${y}) sin bit de colisión pero paso instalado ${paso}`);
        }
      }
    }
    celdasTotales += w * h; libresSinBit += sin; bloqueadas += bloq;
    mapas.push({ mapId: bp.mapId, celdas: w * h, libresSinBit: sin });
  }
  if (mapasSinInstalar) avisos.push(`C: ${mapasSinInstalar} mapa(s) sin instalar o sin tileset ROMN; no se comprueban`);
  documento = {
    generado: "tools/qa/audit_gbc_terreno.mjs",
    rom: "GlazedESPB6.gba",
    campana: "0",
    regla: "Celda del MapLayout con bits 10–11 = 0 (sin colisión): se trata como libre (paso 0) y se documenta aquí.",
    totales: { mapas: mapas.length, mapasNoComparados: mapas.filter((m) => m.libresSinBit === null).length, celdas: celdasTotales, libresSinBit, bloqueadas },
    mapas,
  };
  console.log(`C: ${mapas.length} mapas · ${celdasTotales} celdas · sin bit (libres): ${libresSinBit} · bloqueadas: ${bloqueadas} · incumplen: ${incumplen}`);

  if (ESCRIBIR) {
    fs.writeFileSync(SALIDA, JSON.stringify(documento, null, 2) + "\n");
    console.log(`documentación escrita: ${path.relative(ROOT, SALIDA)}`);
  } else if (fs.existsSync(SALIDA)) {
    const previo = JSON.parse(fs.readFileSync(SALIDA, "utf8"));
    if (JSON.stringify(previo.totales) !== JSON.stringify(documento.totales) || JSON.stringify(previo.mapas) !== JSON.stringify(documento.mapas)) {
      errores.push("C: content/colision_libres_sin_bit.json no coincide con lo calculado (regenerar con --escribir)");
    }
  } else {
    errores.push("C: falta content/colision_libres_sin_bit.json (generar con --escribir)");
  }
}

// ── resultado ─────────────────────────────────────────────────────────────────
console.log(`A: claves GB: ${claveGB.length ? claveGB.join(", ") : "(sin extracción)"}`);
console.log(`B: ${dimFactory ? "factoryadventure: rom.mapasDetectados = " + dimFactory.rom?.mapasDetectados : "sin registro"}`);
for (const a of avisos) console.log(`  AVISO  ${a}`);
for (const e of errores) console.log(`  FALLO  ${e}`);
if (errores.length) {
  console.log(`✘ ${errores.length} problema(s)`);
  process.exit(1);
}
console.log("OK: la extracción GBC no aporta terreno; las celdas sin bit se tratan como libres y están documentadas.");
