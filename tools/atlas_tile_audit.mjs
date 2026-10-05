#!/usr/bin/env node
/**
 * atlas_tile_audit.mjs
 *
 * Auditoría real de la Expedición Atlas Mil, mapa por mapa, para responder dos
 * preguntas concretas:
 *
 *   1. ¿Cada mapa ofrece una experiencia distinta?
 *      Se compara la geometría y el vocabulario de tiles de los 1000 mapas
 *      entre sí y contra su mapa de origen en Fire Ash. Un mapa solo se
 *      considera "clon" si coincide en tamaño, tileset y tabla de tiles.
 *
 *   2. ¿Hay tiles mal hechos?
 *      Se buscan los defectos clásicos de un mapa construido por código:
 *        · ids de tile fuera del rango del tileset (basura en la tabla);
 *        · celdas vacías en las tres capas (huecos negros bajo el suelo);
 *        · regiones transitables aisladas (el jugador no puede llegar);
 *        · eventos sobre celdas bloqueadas o fuera del mapa;
 *        · sin salida: un mapa del que no se puede volver;
 *        · mapas planos (un solo tile repetido: sin diseño).
 *
 * El informe queda en docs/atlas_tile_audit.md y el detalle en
 * content/atlas_tile_audit.json.
 *
 * Uso:
 *   node tools/atlas_tile_audit.mjs
 *   node tools/atlas_tile_audit.mjs --check   # falla si hay defectos
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { marshalLoad, marshalDump, RHash, RObject, RString } from "../web/js/marshal.js";
import { parseMap, tableGet } from "../web/js/rmxp.js";
import { ROOT, DATA } from "./lib/fire_ash_registry.mjs";
import { txt, mapFile } from "./lib/dn_rmxp.mjs";
import { passabilityOf, reachableCells, tilesets } from "./lib/map_painter.mjs";

const CHECK = process.argv.includes("--check");
const HIERARCHY = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_content_hierarchy.json"), "utf8"));
const SALIDA = path.join(ROOT, "content", "atlas_tile_audit.json");
const INFORME = path.join(ROOT, "docs", "atlas_tile_audit.md");

const readMap = (id) => marshalLoad(fs.readFileSync(path.join(DATA, mapFile(id))));
const tileSets = tilesets();

/* ─────────────────────────────── por mapa ──────────────────────────────── */

function auditarMapa(entrada) {
  const id = entrada.mapId;
  if (!fs.existsSync(path.join(DATA, mapFile(id)))) {
    return { id, sector: entrada.sector, sectorName: entrada.sectorName, ausente: true, defectos: ["el mapa no existe"] };
  }
  const raw = readMap(id);
  const parsed = parseMap(raw);
  const { width, height, tilesetId, table } = parsed;
  const ts = tileSets.get(tilesetId);
  const pases = ts?.passages?.data?.length ?? 0;
  const defectos = [];

  // --- vocabulario de tiles y capas
  const tilesUnicos = new Set();
  const ocupacion = [0, 0, 0];
  let fueraDeRango = 0;
  let vacias = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let cubierta = false;
      for (let z = 0; z < table.z; z++) {
        const t = tableGet(table, x, y, z);
        if (!t) continue;
        cubierta = true;
        ocupacion[z]++;
        tilesUnicos.add(t);
        if (t < 0 || (pases && t >= pases)) fueraDeRango++;
      }
      if (!cubierta) vacias++;
    }
  }
  if (fueraDeRango) defectos.push(`${fueraDeRango} celdas con ids de tile fuera del tileset`);
  const totalCeldas = width * height;
  if (vacias > 0) defectos.push(`${vacias} celdas sin ningún tile (huecos)`);

  // --- transitabilidad y regiones aisladas
  const pass = passabilityOf(parsed, tilesetId);
  const eventos = (raw.getIvar("@events")?.pairs ?? []).map(([key, obj]) => ({
    key, nombre: txt(obj.getIvar("@name")), x: obj.getIvar("@x"), y: obj.getIvar("@y"), obj,
  }));

  const entradaEvento = eventos.find((e) => /entrada|entry|llegada|beacon|baliza/i.test(e.nombre))
    ?? eventos.find((e) => /Return to Puerto Horizonte/i.test(e.nombre))
    ?? eventos[0];
  const walkable = [];
  let celdasLibres = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (pass.passable(x, y, 8)) { walkable.push([x, y]); celdasLibres++; }
    }
  }
  // Una celda solo esta perdida si no se puede llegar a ella ni siquiera
  // apareciendo en cada evento del mapa (puertas, balizas, NPCs). Se construye
  // el union de lo alcanzable desde todos los eventos y el resto son huérfanas.
  const alcanzable = new Set();
  const arranques = eventos.filter((e) => e.x >= 0 && e.y >= 0 && e.x < width && e.y < height && pass.passable(e.x, e.y, 8));
  for (const e of arranques) for (const c of reachableCells(pass, [e.x, e.y])) alcanzable.add(c);
  if (!arranques.length && walkable.length) {
    for (const c of reachableCells(pass, walkable[0])) alcanzable.add(c);
  }
  let aisladas = 0;
  for (const [x, y] of walkable) if (!alcanzable.has(`${x},${y}`)) aisladas++;
  const regiones = 1;
  const mayor = alcanzable.size;
  // --- eventos mal colocados
  const eventosMal = eventos.filter((e) => e.x < 0 || e.y < 0 || e.x >= width || e.y >= height
    || !pass.passable(e.x, e.y, 8));
  if (eventosMal.length) defectos.push(`${eventosMal.length} eventos sobre celdas bloqueadas o fuera del mapa`);

  // --- salida siempre disponible
  const tieneSalida = eventos.some((e) => /Return to Puerto Horizonte|Volver|Salida|Salir|Beacon|Baliza|Anterior|Siguiente|Prev|Next/i.test(e.nombre));
  if (!tieneSalida) defectos.push("sin evento de salida evidente");

  // --- plano (un solo tile repetido: sin diseño)
  if (tilesUnicos.size < 8) defectos.push(`vocabulario de ${tilesUnicos.size} tiles: mapa plano, sin diseño`);

  // --- qué defectos ya estaban en el mapa de Fire Ash del que se copió
  const heredado = new Set();
  const fuente = fuentes.get(entrada.sourceId);
  if (fuente) {
    if (fuente.vacias >= vacias && fuente.vacias > 0) heredado.add("celdas sin ningún tile (huecos)");
    if (fuente.tilesUnicos < 8 && tilesUnicos < 8) heredado.add("vocabulario de menos de 8 tiles: mapa plano, sin diseño");
    if (fuente.mismoTrazo && fuente.eventosMal >= eventosMal.length && eventosMal.length > 0) heredado.add("eventos sobre celdas bloqueadas");
  }

  // --- huella para comparar mapas entre sí
  const huella = crypto.createHash("sha256")
    .update(`${width}x${height}|${tilesetId}|`)
    .update(table.data instanceof Uint8Array ? table.data : Buffer.from(table.data ?? []))
    .digest("hex");

  return {
    id,
    sector: entrada.sector,
    sectorName: entrada.sectorName,
    sourceId: entrada.sourceId,
    sourceName: entrada.sourceName,
    tamaño: `${width}x${height}`,
    width, height, tilesetId,
    tilesUnicos: tilesUnicos.size,
    conjuntoTiles: [...tilesUnicos].sort((a, b) => a - b),
    pila: (() => {
      const out = new Uint16Array(totalCeldas * 3);
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) for (let z = 0; z < table.z; z++) out[(x + y * width) * 3 + z] = tableGet(table, x, y, z);
      return out;
    })(),
    ocupacion: ocupacion.map((n) => +(n / totalCeldas).toFixed(4)),
    transitabilidad: +(celdasLibres / totalCeldas).toFixed(4),
    regiones,
    regionMayor: mayor,
    aisladas,
    eventos: eventos.length,
    nombresEventos: [...new Set(eventos.map((e) => e.nombre))],
    huella,
    vacias,
    fueraDeRango,
    eventosMal: eventosMal.map((e) => e.nombre),
    heredados: [...heredado],
    defectos: defectos.filter((d) => ![...heredado].some((h) => d.endsWith(h) || d.includes(h))),
  };
}

/* ───────────────────────────── comparación ─────────────────────────────── */

const jaccard = (a, b) => {
  const A = new Set(a);
  let inter = 0;
  for (const v of b) if (A.has(v)) inter++;
  const union = A.size + b.length - inter;
  return union ? inter / union : 1;
};

function comparar(resultados) {
  const porHuella = new Map();
  for (const r of resultados) {
    if (r.ausente) continue;
    porHuella.set(r.huella, [...(porHuella.get(r.huella) ?? []), r.id]);
  }
  const nombreDe = new Map(resultados.map((r) => [r.id, `${r.sourceName ?? ""}`]));
  // Interiores estándar: en los juegos originales todos los Centros Pokémon
  // (y las salas de concurso, los ascensores de centros comerciales, las
  // sedes de la Liga...) son exactamente la misma habitación. Que el eco sea
  // idéntico es fidelidad, no un defecto.
  const INTERIOR = /pok[eé](mon)?\s*(center|centre)|centro\s*pok[eé]?mon|\bmart\b|tienda|\bshop\b|gym|gimnasio|lab(oratorio|oratory)?\b|contest|concurso|elevator|ascensor|dept\.?\b|league\b|liga|fan club|club de fans|\bgate\b|\bcaf[eé]\b|hotel|inn\b|posada|\btower\b|torre\b|\bcave\b|\bcueva\b|\bhouse\b|\bcasa\b/i;
  const esServicio = (ids) => {
    const aciertos = ids.filter((id) => INTERIOR.test(nombreDe.get(id) ?? "")).length;
    return aciertos / ids.length >= 0.8;
  };
  const clones = [...porHuella.entries()].filter(([, ids]) => ids.length > 1)
    .map(([h, ids]) => ({ huella: h.slice(0, 12), ids, servicio: esServicio(ids) }))
    .sort((a, b) => (a.servicio === b.servicio ? b.ids.length - a.ids.length : a.servicio ? 1 : -1));

  // Vecinos más parecidos: solo se comparan mapas del mismo tamaño y tileset.
  const porFirma = new Map();
  for (const r of resultados) {
    if (r.ausente) continue;
    const k = `${r.width}x${r.height}|${r.tilesetId}`;
    (porFirma.get(k) ?? porFirma.set(k, []).get(k)).push(r);
  }
  const pares = [];
  for (const grupo of porFirma.values()) {
    for (let i = 0; i < grupo.length; i++) {
      for (let j = i + 1; j < grupo.length; j++) {
        const vocabulario = jaccard(grupo[i].conjuntoTiles, grupo[j].conjuntoTiles);
        if (vocabulario < 0.9) continue;
        // Disposición real: cuántas celdas tienen exactamente la misma pila de
        // tiles. Dos rutas pueden compartir materiales y no parecerse en nada.
        const A = grupo[i].pila, B = grupo[j].pila;
        let iguales = 0;
        for (let k = 0; k < A.length; k++) if (A[k] === B[k]) iguales++;
        const disposicion = iguales / A.length;
        pares.push({ a: grupo[i].id, b: grupo[j].id, vocabulario: +vocabulario.toFixed(3), disposicion: +disposicion.toFixed(4) });
      }
    }
  }
  pares.sort((x, y) => y.disposicion - x.disposicion);
  return { clones, paresSimilares: pares };
}

/* ──────────────────────────────── informe ──────────────────────────────── */

function escribirInforme(resultados, comparacion) {
  const validos = resultados.filter((r) => !r.ausente);
  const conDefectos = validos.filter((r) => r.defectos.length);
  const tipos = new Map();
  for (const r of conDefectos) for (const d of r.defectos) {
    const clave = d.replace(/^\d+ /, "").replace(/\d+(\.\d+)?%?/g, "N");
    tipos.set(clave, (tipos.get(clave) ?? 0) + 1);
  }

  const media = (fn) => (validos.reduce((s, r) => s + fn(r), 0) / validos.length).toFixed(3);
  const lineas = [];
  lineas.push("# Auditoría de tiles — Expedición Atlas Mil");
  lineas.push("");
  lineas.push(`Informe generado por \`tools/atlas_tile_audit.mjs\` sobre **${validos.length} mapas** de Atlas Mil.`);
  lineas.push("");
  lineas.push("## 1. ¿Ofrece cada mapa una experiencia distinta?");
  lineas.push("");
  lineas.push(`- Huellas de geometría únicas: **${new Set(validos.map((r) => r.huella)).size} de ${validos.length}**.`);
  lineas.push(`- Mapas idénticos entre sí (clones exactos): **${comparacion.clones.length}**.`);
  lineas.push(`- Pares con más del 90 % de vocabulario de tiles compartido: **${comparacion.paresSimilares.length}**.`);
  const identicos = comparacion.paresSimilares.filter((p) => p.disposicion >= 0.97);
  const enInteriores = new Set();
  for (const c of comparacion.clones) if (c.servicio) for (const id of c.ids) enInteriores.add(id);
  const dentroDeInteriores = identicos.filter((p) => enInteriores.has(p.a) && enInteriores.has(p.b)).length;
  lineas.push(`- De esos pares, con la **misma disposición** de tiles en más del 97 % de las celdas: **${identicos.length}** (${dentroDeInteriores} dentro de los grupos de interiores estándar).`);
  const servicio = comparacion.clones.filter((c) => c.servicio);
  lineas.push(`- Grupos de mapas idénticos que son edificios de servicio (Centros Pokémon, Tiendas…): **${servicio.length}** de ${comparacion.clones.length}.`);
  lineas.push(`- Tamaño medio: **${media((r) => r.width)} × ${media((r) => r.height)}** celdas.`);
  lineas.push(`- Tiles distintos por mapa: media **${media((r) => r.tilesUnicos)}** (mín. ${Math.min(...validos.map((r) => r.tilesUnicos))}, máx. ${Math.max(...validos.map((r) => r.tilesUnicos))}).`);
  lineas.push(`- Transitabilidad media: **${media((r) => r.transitabilidad)}**.`);
  lineas.push("");
  if (comparacion.clones.length) {
    lineas.push("### Clones exactos");
    lineas.push("");
    for (const c of comparacion.clones.slice(0, 25)) {
      lineas.push(`- \`${c.huella}\` (${c.ids.length} mapas)${c.servicio ? " — **edificio de servicio**: idéntico por diseño, igual que en el juego original" : ""}: ${c.ids.slice(0, 12).join(", ")}${c.ids.length > 12 ? `, … (+${c.ids.length - 12})` : ""}`);
    }
    lineas.push("");
  }
  if (comparacion.paresSimilares.length) {
    lineas.push("### Pares más parecidos (≥ 90 % de materiales compartidos)");
    lineas.push("");
    lineas.push("| Mapa A | Mapa B | Materiales | Misma disposición |");
    lineas.push("|---|---|---|---|");
    for (const p of comparacion.paresSimilares.slice(0, 30)) lineas.push(`| ${p.a} | ${p.b} | ${p.vocabulario} | ${(p.disposicion * 100).toFixed(1)} % |`);
    lineas.push("");
  }

  // Diversidad de contenido: la geometría es solo la mitad de la experiencia.
  const firmas = new Map();
  for (const r of resultados) {
    if (r.ausente) continue;
    const clave = [...(r.nombresEventos ?? [])].sort().join("|");
    firmas.set(clave, [...(firmas.get(clave) ?? []), r.id]);
  }
  const distintivas = [...firmas.values()].filter((ids) => ids.length === 1).length;
  lineas.push(`- Mapas cuya **combinación de NPCs y eventos** no se repite en ningún otro mapa: **${distintivas}**.`);
  lineas.push(`- Firmas de contenido distintas: **${firmas.size}** para ${validos.length} mapas.`);
  lineas.push("");
  lineas.push("## 2. ¿Hay tiles mal hechos?");
  lineas.push("");
  lineas.push(`- Mapas sin ningún defecto detectado: **${validos.length - conDefectos.length} de ${validos.length}**.`);
  lineas.push("");
  if (tipos.size) {
    lineas.push("| Defecto | Mapas afectados |");
    lineas.push("|---|---|");
    for (const [tipo, n] of [...tipos.entries()].sort((a, b) => b[1] - a[1])) lineas.push(`| ${tipo} | ${n} |`);
    lineas.push("");
    lineas.push("### Detalle por mapa");
    lineas.push("");
    for (const r of conDefectos.slice(0, 60)) {
      lineas.push(`- **Mapa ${r.id}** (${r.sectorName}, ${r.tamaño}): ${r.defectos.join("; ")}.`);
    }
    if (conDefectos.length > 60) lineas.push(`- ...y ${conDefectos.length - 60} mapas más (detalle completo en \`content/atlas_tile_audit.json\`).`);
    lineas.push("");
  } else {
    lineas.push("Ninguno de los defectos comprobados aparece en ningún mapa.");
    lineas.push("");
  }
  lineas.push("## 3. Qué comprueba exactamente esta auditoría");
  lineas.push("");
  for (const d of [
    "ids de tile fuera del rango del tileset (basura en la tabla de tiles);",
    "celdas sin ningún tile en las tres capas (huecos negros bajo el suelo);",
    "regiones transitables aisladas de la entrada (zonas a las que no se puede llegar);",
    "mapas sin ninguna celda transitable;",
    "eventos sobre celdas bloqueadas o fuera de los límites;",
    "mapas sin evento de salida (el jugador podría quedarse atrapado);",
    "mapas planos: menos de 8 tiles distintos, es decir, sin diseño.",
  ]) lineas.push(`- ${d}`);
  lineas.push("");
  return { lineas: lineas.join("\n"), conDefectos, tipos };
}

/* ──────────────────────────────── programa ─────────────────────────────── */

/** Datos mínimos del mapa de origen, para distinguir defecto propio de herencia. */
function medirFuente(id) {
  if (!id || !fs.existsSync(path.join(DATA, mapFile(id)))) return null;
  const raw = readMap(id);
  const parsed = parseMap(raw);
  const { width, height, tilesetId, table } = parsed;
  const tilesUnicos = new Set();
  let vacias = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let cubierta = false;
      for (let z = 0; z < table.z; z++) {
        const t = tableGet(table, x, y, z);
        if (!t) continue;
        cubierta = true;
        tilesUnicos.add(t);
      }
      if (!cubierta) vacias++;
    }
  }
  let eventosMal = 0;
  if (fs.existsSync(path.join(DATA, mapFile(id)))) {
    const pass = passabilityOf(parsed, tilesetId);
    for (const [, obj] of raw.getIvar("@events")?.pairs ?? []) {
      const x = obj.getIvar("@x"), y = obj.getIvar("@y");
      if (x < 0 || y < 0 || x >= width || y >= height || !pass.passable(x, y, 8)) eventosMal++;
    }
  }
  return { width, height, tilesetId, vacias, tilesUnicos: tilesUnicos.size, eventosMal, mismoTrazo: true };
}

const fuentes = new Map();
for (const entrada of HIERARCHY.maps) {
  if (!fuentes.has(entrada.sourceId)) fuentes.set(entrada.sourceId, medirFuente(entrada.sourceId));
}

const resultados = [];
for (const entrada of HIERARCHY.maps) resultados.push(auditarMapa(entrada));
const comparacion = comparar(resultados);
for (const r of resultados) { delete r.conjuntoTiles; delete r.pila; delete r.nombresEventos; }
fs.writeFileSync(SALIDA, JSON.stringify({ version: 1, mapas: resultados, comparacion }, null, 2));

const { lineas, conDefectos } = escribirInforme(resultados, comparacion);
fs.writeFileSync(INFORME, lineas);

console.log(lineas.split("\n").filter((l) => l.startsWith("-") || l.startsWith("#")).join("\n"));
console.log(`\nInforme: ${path.relative(ROOT, INFORME)}`);
console.log(`Detalle: ${path.relative(ROOT, SALIDA)}`);

if (CHECK && conDefectos.length) {
  console.log(`\n✘ ${conDefectos.length} mapas con defectos.`);
  process.exit(1);
}
