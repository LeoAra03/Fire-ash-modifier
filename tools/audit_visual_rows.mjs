#!/usr/bin/env node
/**
 * audit_visual_rows.mjs — auditoría de las filas de estilo (`visualRows`) del
 * plano de campañas ROM (content/rom_campaigns_complete.json).
 *
 * Cada mapa del plano lleva una fila de estilo por cada fila de su alto: el
 * mapa donante de Fire Ash que se muestrea (`donorMapId`), el desfase del
 * suelo (`floorPhase`), la cadencia de acentos (`accentEvery`) y la banda de
 * pasillo (`corridorBand`, informativa: el pintor no la usa). Se revisan dos
 * niveles:
 *
 *  Plano
 *    - totales: filas = totals.visualRows = suma de los altos; mapas = totals.maps;
 *    - cada mapa: una fila por y (0..alto-1, contiguas) con los cinco campos,
 *      un único donante (el de su ranura, donors[índice % 6]), parámetros en
 *      rango, sin dos filas consecutivas iguales y con 2 o más estilos.
 *
 *  Efecto (lo que de verdad se pinta)
 *    - cada mapa se pinta con el pintor real (tools/lib/rom_campaign_painter.mjs,
 *      el mismo que usa tools/apply_complete_rom_campaigns.mjs) y se cuentan
 *      sus filas pintadas distintas, en la capa de suelo y en las tres capas.
 *      Con 1 sola fila distinta el mapa queda con «una sola fila de estilo»
 *      aunque sus parámetros varíen, p. ej. con un donante de suelo uniforme;
 *    - cada donante: tileset 1 y suelo transitable variado (4 o más teselas,
 *      ninguna por encima del 95 % de las celdas transitables).
 *
 * El resultado se escribe entre las marcas de docs/AUDITORIA_VISUAL_ROWS.md.
 *
 * Uso:
 *   node tools/audit_visual_rows.mjs                # audita y actualiza el informe
 *   node tools/audit_visual_rows.mjs --verify       # falla si hay incidencias o el informe está viejo
 *   node tools/audit_visual_rows.mjs --json         # resultado completo en JSON
 *   node tools/audit_visual_rows.mjs --plan <json>  # audita otro plano (no toca el informe)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalLoad } from "../web/js/marshal.js";
import { DATA } from "./lib/fire_ash_registry.mjs";
import { loadSourceMap } from "./lib/map_painter.mjs";
import { floorCounts, floorPalette, paintMap, paintedSize, passagesTileset1 } from "./lib/rom_campaign_painter.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const VERIFY = args.includes("--verify");
const JSON_OUT = args.includes("--json");
const planArg = args.indexOf("--plan");
const PLAN_FILE = planArg >= 0 && args[planArg + 1]
  ? path.resolve(args[planArg + 1])
  : path.join(ROOT, "content", "rom_campaigns_complete.json");
const OTRO_PLANO = planArg >= 0;
const INFORME = path.join(ROOT, "docs", "AUDITORIA_VISUAL_ROWS.md");
const INICIO = "<!-- audit_visual_rows:inicio -->";
const FIN = "<!-- audit_visual_rows:fin -->";

const MIN_FILAS = 2; // «ningún mapa con una sola fila de estilo»
const MIN_SUELOS_DONANTE = 4; // teselas de suelo transitable distintas por donante
const MAX_DOMINANCIA = 0.95; // fracción máxima del suelo transitable ocupada por una sola tesela
const CAMPOS = ["y", "donorMapId", "floorPhase", "accentEvery", "corridorBand"];
const PEORES = 12; // mapas con menos variedad que se listan en el informe

const entero = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
const pct = (v) => `${(v * 100).toFixed(1)} %`;
const mediana = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor((s.length - 1) / 2)] : 0;
};

function nombresMapas() {
  const nombres = new Map();
  try {
    const infos = marshalLoad(fs.readFileSync(path.join(DATA, "MapInfos.rxdata")));
    for (const [k, v] of infos.pairs) nombres.set(Number(k), v.getIvar("@name")?.text ?? "");
  } catch { /* sin MapInfos: se informa sólo el número */ }
  return nombres;
}

/** Filas distintas de un lienzo pintado: capa de suelo y las tres capas juntas. */
function filasDistintas(canvas) {
  const w = canvas.width;
  const suelo = new Set(), todas = new Set();
  for (let y = 0; y < canvas.height; y += 1) {
    const capas = canvas.layers.map((l) => l.subarray(y * w, (y + 1) * w).join(","));
    suelo.add(capas[0]);
    todas.add(capas.join("|"));
  }
  return { suelo: suelo.size, todas: todas.size };
}

function auditar() {
  const errores = [];
  const plan = JSON.parse(fs.readFileSync(PLAN_FILE, "utf8"));
  const nombres = nombresMapas();
  const passages = passagesTileset1();
  const campanas = [], donantes = [], mapas = [];
  let filasTotales = 0, altosTotales = 0, mapasTotales = 0;

  for (const campaign of plan.campaigns ?? []) {
    const donors = campaign.donors ?? [];
    // Donantes de la campaña.
    const fichaDonante = new Map();
    donors.forEach((id, ranura) => {
      const ficha = { campana: campaign.id, ranura, id, nombre: nombres.get(id) ?? "", tamano: null, tileset: null, suelos: 0, dominancia: 1, mapas: 0, minSuelo: Infinity, sumaCuota: 0 };
      try {
        const src = loadSourceMap(id);
        ficha.tamano = `${src.width}×${src.height}`;
        ficha.tileset = src.tilesetId;
        const cuentas = floorCounts(id, passages);
        const total = cuentas.reduce((a, [, n]) => a + n, 0);
        ficha.suelos = cuentas.length;
        ficha.dominancia = total ? cuentas[0][1] / total : 1;
      } catch (e) {
        errores.push(`${campaign.id}: el donante Map${id} no se puede leer (${e.message})`);
      }
      if (ficha.tileset !== null && ficha.tileset !== 1) errores.push(`${campaign.id}: el donante Map${id} usa el tileset ${ficha.tileset}; el pintor sólo admite el 1`);
      if (ficha.suelos < MIN_SUELOS_DONANTE) errores.push(`${campaign.id}: el donante Map${id} (${ficha.nombre}) sólo tiene ${ficha.suelos} tesela${ficha.suelos === 1 ? "" : "s"} de suelo transitable (mínimo ${MIN_SUELOS_DONANTE})`);
      if (ficha.dominancia > MAX_DOMINANCIA) errores.push(`${campaign.id}: en el donante Map${id} (${ficha.nombre}) una sola tesela ocupa el ${pct(ficha.dominancia)} del suelo (máximo ${pct(MAX_DOMINANCIA)})`);
      fichaDonante.set(ranura, ficha);
      donantes.push(ficha);
    });
    let palette = null;
    try { palette = floorPalette(donors); } catch (e) { errores.push(`${campaign.id}: ${e.message}`); }

    const resumen = { id: campaign.id, mapas: 0, filas: 0, altos: [], minEstilos: Infinity, minSuelo: Infinity, minTodas: Infinity, unaFilaPlano: 0, unaFilaSuelo: 0, unaFilaTodas: 0, sumaCuota: 0 };
    (campaign.maps ?? []).forEach((bp, index) => {
      const nombre = `${campaign.id} Map${bp.mapId}`;
      const rows = Array.isArray(bp.visualRows) ? bp.visualRows : [];
      const alto = bp.dimensions?.height, ancho = bp.dimensions?.width;
      resumen.mapas += 1; resumen.filas += rows.length; resumen.altos.push(rows.length);
      filasTotales += rows.length; altosTotales += alto ?? 0; mapasTotales += 1;

      if (rows.length !== alto) errores.push(`${nombre}: ${rows.length} filas de estilo para un alto de ${alto}`);
      const ranura = donors.length ? index % donors.length : -1;
      const esperado = donors[ranura];
      const donantesMapa = new Set(rows.map((r) => r.donorMapId));
      if (donantesMapa.size !== 1) errores.push(`${nombre}: ${donantesMapa.size} donantes distintos (debe haber uno por mapa)`);
      else if (![...donantesMapa][0] || [...donantesMapa][0] !== esperado) errores.push(`${nombre}: donante Map${[...donantesMapa][0]} y su ranura ${ranura} pide Map${esperado}`);
      const maxBanda = 1 + Math.max(3, Math.floor((ancho ?? 0) / 4));
      const estilos = new Set();
      rows.forEach((r, y) => {
        const claves = Object.keys(r);
        if (claves.length !== CAMPOS.length || !CAMPOS.every((c) => c in r)) errores.push(`${nombre} y=${y}: campos ${claves.join(",")} (se esperan ${CAMPOS.join(",")})`);
        if (r.y !== y) errores.push(`${nombre}: la fila ${y} dice y=${r.y} (las filas deben ser contiguas desde 0)`);
        if (!entero(r.floorPhase, 0, 96)) errores.push(`${nombre} y=${y}: floorPhase ${r.floorPhase} fuera de 0..96`);
        if (!entero(r.accentEvery, 5, 15)) errores.push(`${nombre} y=${y}: accentEvery ${r.accentEvery} fuera de 5..15`);
        if (!entero(r.corridorBand, 2, maxBanda)) errores.push(`${nombre} y=${y}: corridorBand ${r.corridorBand} fuera de 2..${maxBanda}`);
        const estilo = `${r.donorMapId}/${r.floorPhase}/${r.accentEvery}/${r.corridorBand}`;
        if (y > 0) {
          const p = rows[y - 1];
          if (`${p.donorMapId}/${p.floorPhase}/${p.accentEvery}/${p.corridorBand}` === estilo) errores.push(`${nombre}: las filas ${y - 1} y ${y} tienen el mismo estilo`);
        }
        estilos.add(estilo);
      });
      if (estilos.size < MIN_FILAS) errores.push(`${nombre}: el plano sólo tiene ${estilos.size} estilo de fila`);

      // Efecto: pintar con el pintor real y contar filas distintas. Si el plano
      // del mapa ya falló (sin filas, varios donantes o un donante ilegible), no
      // se pinta: esa incidencia ya está anotada y aquí se contabiliza como 0.
      let suelo = 0, todas = 0, pintado = paintedSize(bp);
      if (palette && rows.length && donantesMapa.size === 1 && palette.result.has([...donantesMapa][0])) {
        const canvas = paintMap(campaign, bp, palette);
        ({ suelo, todas } = filasDistintas(canvas));
        pintado = { width: canvas.width, height: canvas.height };
        if (suelo < MIN_FILAS) errores.push(`${nombre}: el suelo pintado sólo tiene ${suelo} fila distinta en ${pintado.height}`);
        if (todas < MIN_FILAS) errores.push(`${nombre}: las tres capas pintadas sólo tienen ${todas} fila distinta en ${pintado.height}`);
      }
      const cuota = pintado.height ? suelo / pintado.height : 0;

      resumen.minEstilos = Math.min(resumen.minEstilos, estilos.size);
      resumen.minSuelo = Math.min(resumen.minSuelo, suelo);
      resumen.minTodas = Math.min(resumen.minTodas, todas);
      if (estilos.size < MIN_FILAS) resumen.unaFilaPlano += 1;
      if (suelo < MIN_FILAS) resumen.unaFilaSuelo += 1;
      if (todas < MIN_FILAS) resumen.unaFilaTodas += 1;
      resumen.sumaCuota += cuota;
      const ficha = fichaDonante.get(ranura);
      if (ficha && esperado === [...donantesMapa][0]) {
        ficha.mapas += 1; ficha.minSuelo = Math.min(ficha.minSuelo, suelo); ficha.sumaCuota += cuota;
      }
      mapas.push({ mapId: bp.mapId, campana: campaign.id, titulo: bp.title ?? "", alto: rows.length, ancho, pintado, donante: [...donantesMapa][0] ?? null, estilos: estilos.size, filasSuelo: suelo, filasTodas: todas, cuota });
    });
    campanas.push(resumen);
  }

  const totales = { campanas: campanas.length, mapas: mapasTotales, filas: filasTotales, altos: altosTotales, plano: plan.totals ?? {} };
  if (filasTotales !== plan.totals?.visualRows) errores.push(`totals.visualRows = ${plan.totals?.visualRows}, pero los mapas suman ${filasTotales} filas`);
  if (filasTotales !== altosTotales) errores.push(`${filasTotales} filas de estilo para una suma de altos de ${altosTotales}`);
  if (mapasTotales !== plan.totals?.maps) errores.push(`totals.maps = ${plan.totals?.maps}, pero hay ${mapasTotales} mapas`);
  for (const c of plan.campaigns ?? []) if (c.mapCount !== (c.maps ?? []).length) errores.push(`${c.id}: mapCount ${c.mapCount} y ${(c.maps ?? []).length} mapas`);

  const peores = [...mapas].sort((a, b) => a.filasSuelo - b.filasSuelo || a.cuota - b.cuota || a.mapId - b.mapId).slice(0, PEORES);
  return { errores, totales, campanas, donantes, mapas, peores };
}

function informe(res) {
  const { totales: t, campanas, donantes, peores, errores } = res;
  const unaPlano = campanas.reduce((a, c) => a + c.unaFilaPlano, 0);
  const unaSuelo = campanas.reduce((a, c) => a + c.unaFilaSuelo, 0);
  const unaTodas = campanas.reduce((a, c) => a + c.unaFilaTodas, 0);
  const L = [];
  L.push(INICIO);
  L.push("<!-- Bloque generado por tools/audit_visual_rows.mjs: no editar a mano. -->");
  L.push("");
  L.push(`- Plano: **${t.campanas} campañas, ${t.mapas} mapas y ${t.filas} filas de estilo** (\`totals.visualRows\` = ${t.plano.visualRows}; suma de altos = ${t.altos}).`);
  L.push(`- Mapas con una sola fila de estilo: **${unaPlano}** en el plano, **${unaSuelo}** en el suelo pintado y **${unaTodas}** en las tres capas pintadas.`);
  L.push(`- Umbrales: al menos ${MIN_FILAS} filas distintas por mapa; donantes de tileset 1 con al menos ${MIN_SUELOS_DONANTE} teselas de suelo transitable y ninguna por encima del ${pct(MAX_DOMINANCIA)}.`);
  L.push(`- Incidencias: **${errores.length}**.`);
  L.push("");
  L.push("### Por campaña");
  L.push("");
  L.push("| Campaña | Mapas | Filas de estilo | Alto mín. / mediana / máx. | Estilos por mapa (mín.) | Filas de suelo distintas (mín.) | Filas distintas, 3 capas (mín.) | Mapas con 1 fila (plano / suelo / 3 capas) | Filas de suelo distintas (media) |");
  L.push("|---|---:|---:|---|---:|---:|---:|---|---:|");
  for (const c of campanas) {
    L.push(`| ${c.id} | ${c.mapas} | ${c.filas} | ${Math.min(...c.altos)} / ${mediana(c.altos)} / ${Math.max(...c.altos)} | ${c.minEstilos} | ${c.minSuelo} | ${c.minTodas} | ${c.unaFilaPlano} / ${c.unaFilaSuelo} / ${c.unaFilaTodas} | ${pct(c.sumaCuota / Math.max(1, c.mapas))} |`);
  }
  L.push("");
  L.push("### Donantes");
  L.push("");
  L.push("Cada mapa usa el donante de su ranura (`donors[índice % 6]`). «Suelo» son las teselas transitables de la capa 0.");
  L.push("");
  L.push("| Campaña | Ranura | Donante | Tamaño | Teselas de suelo | Tesela dominante | Mapas | Filas de suelo distintas (mín.) | Media |");
  L.push("|---|---:|---|---|---:|---:|---:|---:|---:|");
  for (const d of donantes) {
    L.push(`| ${d.campana} | ${d.ranura} | Map${d.id} ${d.nombre} | ${d.tamano ?? "—"} | ${d.suelos} | ${pct(d.dominancia)} | ${d.mapas} | ${d.mapas ? d.minSuelo : "—"} | ${d.mapas ? pct(d.sumaCuota / d.mapas) : "—"} |`);
  }
  L.push("");
  L.push(`### Los ${peores.length} mapas con menos variedad de suelo`);
  L.push("");
  L.push("| Mapa | Campaña | Título | Pintado | Donante | Filas de suelo distintas | Filas distintas, 3 capas |");
  L.push("|---|---|---|---|---|---:|---:|");
  for (const m of peores) {
    L.push(`| Map${m.mapId} | ${m.campana} | ${m.titulo.replace(/\|/g, "/")} | ${m.pintado.width}×${m.pintado.height} | Map${m.donante} | ${m.filasSuelo} de ${m.pintado.height} | ${m.filasTodas} |`);
  }
  if (errores.length) {
    L.push("");
    L.push("### Incidencias");
    L.push("");
    for (const e of errores.slice(0, 50)) L.push(`- ${e}`);
    if (errores.length > 50) L.push(`- … y ${errores.length - 50} más (\`node tools/audit_visual_rows.mjs --json\`).`);
  }
  L.push("");
  L.push(FIN);
  return L.join("\n");
}

function bloqueActual() {
  if (!fs.existsSync(INFORME)) return null;
  const texto = fs.readFileSync(INFORME, "utf8");
  const a = texto.indexOf(INICIO), b = texto.indexOf(FIN);
  if (a < 0 || b < a) return null;
  return { texto, a, b: b + FIN.length };
}

const res = auditar();
const bloque = informe(res);

if (JSON_OUT) {
  const { errores, totales, campanas, donantes, peores, mapas } = res;
  console.log(JSON.stringify({ plano: path.relative(ROOT, PLAN_FILE), errores, totales, campanas, donantes, peores, mapas }, null, 2));
} else if (OTRO_PLANO) {
  console.log(bloque);
} else if (VERIFY) {
  const actual = bloqueActual();
  if (!actual) res.errores.push("docs/AUDITORIA_VISUAL_ROWS.md no tiene el bloque generado (ejecuta node tools/audit_visual_rows.mjs)");
  else if (actual.texto.slice(actual.a, actual.b) !== bloque) res.errores.push("docs/AUDITORIA_VISUAL_ROWS.md está desactualizado (ejecuta node tools/audit_visual_rows.mjs)");
} else {
  const actual = bloqueActual();
  if (!actual) {
    console.error("docs/AUDITORIA_VISUAL_ROWS.md no existe o no tiene las marcas del bloque generado.");
    process.exit(1);
  }
  fs.writeFileSync(INFORME, actual.texto.slice(0, actual.a) + bloque + actual.texto.slice(actual.b));
  console.log("  -> docs/AUDITORIA_VISUAL_ROWS.md");
}

if (!JSON_OUT) {
  for (const c of res.campanas) {
    console.log(`[visual rows] ${c.id}: ${c.mapas} mapas, ${c.filas} filas; mín. ${c.minEstilos} estilos, `
      + `${c.minSuelo} filas de suelo y ${c.minTodas} filas en 3 capas distintas por mapa`);
  }
}
if (res.errores.length) {
  console.error(`audit_visual_rows: ${res.errores.length} incidencias`);
  for (const e of res.errores.slice(0, 40)) console.error(`  - ${e}`);
  if (res.errores.length > 40) console.error(`  … y ${res.errores.length - 40} más`);
  process.exit(1);
}
if (!JSON_OUT) console.log(`audit_visual_rows${VERIFY ? " --verify" : ""} OK: ${res.totales.filas} filas de estilo en ${res.totales.mapas} mapas, ninguno con una sola fila`);
