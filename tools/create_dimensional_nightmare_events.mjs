#!/usr/bin/env node
/**
 * create_dimensional_nightmare_events.mjs — plano de conexiones, NPCs y eventos.
 *
 * Lee los docs del GDD (01–07) y produce `content/dimensional_nightmare_events.json`:
 *   - connections: cadena de mapas por episodio (el instalador resuelve las celdas);
 *   - npcs:        filas de las tablas «NPCs por mapa» (nombre, tipo, sprite, notas);
 *   - events:      índice de «Eventos programables» (nombre, mapas, celdas, disparador, efecto);
 *   - anomalies:   recuento declarado por episodio;
 *   - boss:        jefe de cada episodio (nombre, mapa, interruptores, resonancia).
 *
 * No toca el juego: solo lee documentación y escribe el plano que consume
 * `tools/apply_dimensional_nightmare_events.mjs`.
 *
 * Uso:
 *   node tools/create_dimensional_nightmare_events.mjs
 *   node tools/create_dimensional_nightmare_events.mjs --check
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = path.join(ROOT, "docs", "DIMENSIONAL_NIGHTMARE");
const OUT = path.join(ROOT, "content", "dimensional_nightmare_events.json");
const CHECK = process.argv.includes("--check");

const EPISODES = [
  { key: "EP01", doc: "01_EP01_WHITE_HAND.md", from: 2041, to: 2056, seal: 883, grieta: 890, res: 12, var: 268, cuota: 896, boss: "LA MANO BLANCA" },
  { key: "EP02", doc: "02_EP02_LOST_SILVER.md", from: 2057, to: 2072, seal: 884, grieta: 891, res: 10, var: 269, cuota: 897, boss: "EL SIN NOMBRE" },
  { key: "EP03", doc: "03_EP03_SNOW_ON_MT_SILVER.md", from: 2073, to: 2087, seal: 885, grieta: 892, res: 12, var: 270, cuota: 898, boss: "EL CAMINANTE" },
  { key: "EP04", doc: "04_EP04_HYPNOS_LULLABY.md", from: 2088, to: 2103, seal: 886, grieta: 893, res: 14, var: 271, cuota: 899, boss: "LA NANA" },
  { key: "EP05", doc: "05_EP05_POKEMON_BLACK.md", from: 2104, to: 2119, seal: 887, grieta: 894, res: 16, var: 272, cuota: 900, boss: "EL JUGADOR 000" },
  { key: "EP06", doc: "06_EP06_KING_UNOWN.md", from: 2120, to: 2135, seal: 888, grieta: 895, res: 18, var: 273, cuota: 901, boss: "KINGGUS" },
  // Segundo anillo (W7–W9): se abre tras la Liga Oscura (v264 ≥ 9) y usa su propio
  // bloque de flags 922–930 y variables 283–285.
  { key: "W7", doc: "16_W7_STRANGLED_RED.md", from: 2143, to: 2158, seal: 922, grieta: 925, res: 12, var: 283, cuota: 932, bossSwitch: 928, boss: "EL AMO Y LA CORREA" },
  { key: "W8", doc: "17_W8_BURIED_ALIVE.md", from: 2159, to: 2174, seal: 923, grieta: 926, res: 11, var: 284, cuota: 933, bossSwitch: 929, boss: "EL QUE RESPIRA DEBAJO" },
  { key: "W9", doc: "18_W9_LAVENDER_SYNDROME.md", from: 2175, to: 2190, seal: 924, grieta: 927, res: 12, var: 285, cuota: 934, bossSwitch: 930, boss: "EL CORO DEL CAMPANARIO" },
];

/** Ficha de jefe y fase B, leídas del §9 de cada doc (celdas y conteos citados allí). */
const BOSSES = {
  EP01: {
    name: "LA MANO BLANCA", phaseA: { type: "HIKER", label: "EL SEPULTADO", trainer: "DN_EP01_A" },
    team: [["MAROWAK", 103], ["GOLURK", 105], ["COFAGRIGUS", 103], ["DUSKNOIR", 104], ["SABLEYE", 101], ["SPIRITOMB", 105]],
    phaseB: { kind: "cadenas", verb: "romper", noun: "cadena", cells: [[6, 4], [17, 4], [6, 19], [17, 19]], cellsMap: null,
      texts: ["Una cadena sostiene la Mano.", "La cadena cruje y cae.", "La Mano pierde un dedo.", "El altar tiembla."] },
    reward: "DN_PAGE_01", notes: "Al ganar la fase A no termina: hay que romper las 4 cadenas.",
  },
  EP02: {
    name: "EL SIN NOMBRE", phaseA: { type: "COOLTRAINER_M", label: "EL SIN NOMBRE", trainer: "DN_EP02_A" },
    team: [["NOCTOWL", 100], ["MAROWAK", 102], ["UMBREON", 101], ["GENGAR", 103], ["FROSLASS", 101], ["SPIRITOMB", 104]],
    phaseB: { kind: "fotos", verb: "romper", noun: "foto", cells: null, cellsMap: null,
      texts: ["La foto 1 se quema por los bordes.", "La foto 2 muestra un pueblo que ya no existe.",
        "La foto 3 la firma Silver, con otra letra.", "La foto 4 está en blanco: ahí va tu nombre."] },
    reward: "DN_PAGE_02", notes: "Ganar la fase A «no cuenta»: el jefe reinicia la silueta.",
  },
  EP03: {
    name: "EL CAMINANTE", phaseA: { type: "CHAMPION", label: "EL CAMINANTE", trainer: "DN_EP03_A" },
    team: [["ABOMASNOW", 104], ["MAMOSWINE", 105], ["GLALIE", 102], ["FROSLASS", 103], ["WEAVILE", 103], ["LAPRAS", 102]],
    phaseB: { kind: "fogatas", verb: "encender", noun: "fogata", cells: null, cellsMap: null, maps: [2073, 2075, 2078, 2082],
      texts: ["La fogata 1 se enciende: el Caminante retrocede un paso.", "La fogata 2 arde sin consumir leña.",
        "La fogata 3 calienta el aire: la nieve derrite a su alrededor.", "La fogata 4 la dejaste tú al pasar. Ahora vuelve a arder."] },
    reward: "DN_PAGE_03", notes: "Es un jefe que obliga a volver sobre tus pasos (fogatas en 2073/2075/2078/2082).",
  },
  EP04: {
    name: "LA NANA", phaseA: { type: "PSYCHIC_F", label: "LA NANA", trainer: "DN_EP04_A" },
    team: [["MUSHARNA", 104], ["HYPNO", 105], ["DROWZEE", 101], ["GENGAR", 104], ["MISMAGIUS", 103], ["SPIRITOMB", 106]],
    phaseB: { kind: "cunas", verb: "despertar", noun: "cuna", cells: [[10, 12], [20, 12], [10, 26], [20, 26]], cellsMap: null,
      texts: ["La cuna 1 se abre. Dentro no hay nadie.", "La cuna 2 tararea la nana al revés.",
        "La cuna 3 está vacía y, aun así, se mece.", "La cuna 4 deja de cantar: el árbol se queda en silencio."] },
    reward: "POKEFLUTE", notes: "La canción es el jefe: el equipo entra dormido y las cunas lo despiertan.",
  },
  EP05: {
    name: "EL JUGADOR 000", phaseA: { type: "TEAMROCKET", label: "EL JUGADOR 000", trainer: "DN_EP05_A" },
    team: [["UNOWN", 110], ["UNOWN", 110], ["MISMAGIUS", 110], ["SPIRITOMB", 110], ["GENGAR", 110], ["DUSKNOIR", 110]],
    phaseB: { kind: "rendijas", verb: "cerrar", noun: "rendija", cells: null, cellsMap: null,
      texts: ["Una rendija se cierra. La silueta pierde un borde.", "La segunda rendija te devuelve una copia de tu poción.",
        "La tercera rendija repite tu último movimiento.", "La cuarta se cierra desde dentro."] },
    reward: "DN_PAGE_05", notes: "El combate espejo real (pbPartyCopy) queda pendiente: hoy usa un equipo fijo equivalente.",
  },
  EP06: {
    name: "KINGGUS", phaseA: { type: "GENTLEMAN", label: "KINGGUS", trainer: "DN_EP06_A" },
    team: [["UNOWN", 120], ["UNOWN", 121], ["UNOWN", 122], ["UNOWN", 123], ["UNOWN", 124], ["UNOWN", 125]],
    phaseB: { kind: "letras", verb: "colocar", noun: "letra", cells: null, cellsMap: null,
      texts: ["El suelo brilla: K", "El suelo brilla: I", "El suelo brilla: N", "El suelo brilla: G",
        "El suelo brilla: G", "El suelo brilla: U", "El suelo brilla: S"] },
    reward: "DN_ANCLA", notes: "Tras la fase 7 el Rey se levanta: forma final KINGGUS2 (equipo 120–125 propuesto).",
  },
  W7: {
    name: "EL AMO Y LA CORREA", phaseA: { type: "HIKER", label: "EL AMO", trainer: "DN_W7_A" },
    team: [["MIGHTYENA", 104], ["HOUNDOUR", 103], ["MURKROW", 105], ["ARIADOS", 102], ["POOCHYENA", 101], ["SPINARAK", 102]],
    phaseB: { kind: "correas", verb: "cortar", noun: "correa", cells: [[6, 4], [20, 4], [6, 10], [20, 10]], cellsMap: null,
      texts: ["La correa 1 cede: el amo pierde un paso.", "La correa 2 cae y el aire se llena de polvo.",
        "La correa 3 se corta sola en la mano.", "La cuarta correa se suelta: el amo dice el nombre del Pokémon."] },
    reward: "DN_PAGE_W7", notes: "Ganar la fase A no cierra el duelo: hay que cortar las 4 correas del árbol.",
  },
  W8: {
    name: "EL QUE RESPIRA DEBAJO", phaseA: { type: "CHAMPION", label: "EL QUE RESPIRA", trainer: "DN_W8_A" },
    team: [["DUGTRIO", 106], ["SANDSLASH", 104], ["TRAPINCH", 103], ["VIBRAVA", 105], ["SANDSHREW", 102], ["CLAYDOL", 105]],
    phaseB: { kind: "bolsas", verb: "abrir", noun: "bolsa de aire", cells: [[5, 5], [20, 5], [12, 8], [5, 8], [20, 8]], cellsMap: null,
      texts: ["La bolsa 1 se abre: el mundo respira contigo.", "La bolsa 2 silba entre la tierra.",
        "La bolsa 3 trae aire con olor a raíz.", "La bolsa 4 enfría la fosa.", "La quinta bolsa estalla: el que respira debajo se calla."] },
    reward: "DN_PAGE_W8", notes: "La variable de aire v284 nunca derrota: obliga a ritmo y a buscar bolsas.",
  },
  W9: {
    name: "EL CORO DEL CAMPANARIO", phaseA: { type: "PSYCHIC_F", label: "EL CORO", trainer: "DN_W9_A" },
    team: [["MISMAGIUS", 105], ["HYPNO", 106], ["HAUNTER", 104], ["BANETTE", 103], ["DRIFBLIM", 104], ["GENGAR", 106]],
    phaseB: { kind: "silencios", verb: "tocar", noun: "silencio", cells: [[5, 5], [20, 5], [5, 10], [20, 10]], cellsMap: null,
      texts: ["Primer silencio: una voz se apaga.", "Segundo silencio: el coro pierde el compás.",
        "Tercer silencio: el campanario se queda sin eco.", "Cuarto silencio: el pueblo calla para siempre."] },
    reward: "DN_PAGE_W9", notes: "Los silencios van en el orden de DN_W9_SCORE; fuera de orden la voz vuelve (sin daño).",
  },
};

const NPC_ROW = /^\|\s*(\d{4})\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*`?([^`|\s]+)`?[^|]*\|\s*([^|]+?)\s*\|?\s*$/;
const CELL = () => /\((\d+)\s*,\s*(\d+)\)/g;
const MAP_ID = () => /\b(20[3-9]\d|21[0-8]\d|2190)\b/g;   // 2039–2140 · 2143–2190 (W7–W9)

function sections(text) {
  const out = new Map();
  let current = null;
  for (const line of text.split("\n")) {
    const heading = line.match(/^##+\s+(.*)$/);
    if (heading) {
      current = heading[1];
      out.set(current, []);
      continue;
    }
    if (current) out.get(current).push(line);
  }
  return out;
}

function parseNpcs(lines) {
  const npcs = [];
  for (const line of lines) {
    const m = line.match(NPC_ROW);
    if (!m) continue;
    const [, mapId, name, type, rawSprite, notes] = m;
    if (!/^\d{4}$/.test(mapId) || /^:?-+$/.test(name)) continue;
    let sprite = rawSprite.trim();
    // El GDD escribe cosas como «(sin sprite)», «(imagen fija)» o «(evento sin sprite)»:
    // no son nombres de archivo de Graphics/Characters, son eventos sin gráfico propio.
    if (sprite.startsWith("(")) sprite = "";
    npcs.push({
      map: Number(mapId),
      name: name.trim().replace(/\*\*/g, ""),
      type: type.trim(),
      sprite,
      notes: notes.trim().replace(/\*\*/g, ""),
    });
  }
  return npcs;
}

/** Índice de eventos: un bloque de código con líneas «EV_XXX — …» (y continuaciones con «→»). */
function parseEvents(lines, episode) {
  const events = [];
  let inBlock = false;
  let current = null;
  for (const line of lines) {
    if (line.trim().startsWith("```")) { inBlock = !inBlock; current = null; continue; }
    if (!inBlock) continue;
    const head = line.match(/^(EV_[A-Z0-9]+_[A-Za-z0-9]+)\s*[—-]\s*(.*)$/);
    if (head) {
      current = { name: head[1], episode: episode.key, detail: head[2].trim(), effect: "" };
      events.push(current);
      continue;
    }
    if (current && line.trim().startsWith("→")) current.effect += (current.effect ? " " : "") + line.trim().replace(/^→\s*/, "");
  }
  for (const ev of events) {
    const maps = [...ev.detail.matchAll(MAP_ID())].map((m) => Number(m[1]));
    const cells = [...ev.detail.matchAll(CELL())].map((m) => [Number(m[1]), Number(m[2])]);
    const triggerText = ev.detail.toLowerCase();
    const trigger = /autorun/.test(triggerText) ? "autorun" : /pisar|al pisar/.test(triggerText) ? "touch" : "action";
    ev.maps = maps.length ? maps : [];
    ev.cells = cells;
    ev.trigger = trigger;
    // "EV_CAT_Urnas — 2042, 4 puntos — ..." significa 4 eventos en 2042
    const count = ev.detail.match(/(\d+)\s*puntos?/i);
    ev.instances = count ? Number(count[1]) : Math.max(1, ev.cells.length);
  }
  return events;
}

/**
 * §5 «Anomalías (N)» de cada doc: bloque de texto, no tabla.
 *
 *   [A01] LA ANTORCHA QUE VUELVE — visual
 *     Map2042 — (7,6) [R7-4]. Fase ≥2. La antorcha apagada está encendida al reentrar.
 */
function parseAnomalies(sectionsMap) {
  for (const [title, lines] of sectionsMap) {
    const m = title.match(/^5\.\s*Anomal[íi]as\s*\((\d+)\)/i);
    if (!m) continue;
    const items = [];
    let current = null;
    for (const line of lines) {
      const head = line.match(/^\s*\[(A\d+)\]\s*(.+?)\s*[—-]\s*([a-záéíóú/\s]+?)\s*$/i);
      if (head) {
        const kinds = head[3].toLowerCase().split(/[/\sy]+/).filter((k) => /^(visual|auditiva|temporal|espacial)$/.test(k));
        current = { code: head[1], name: head[2].trim(), type: kinds[0] ?? "visual", types: kinds, map: null, cells: [], text: "" };
        items.push(current);
        continue;
      }
      if (!current) continue;
      const where = line.match(/Map(\d{4})[\s\S]*?/);
      if (where && current.map === null) current.map = Number(where[1]);
      for (const cell of line.matchAll(CELL())) current.cells.push([Number(cell[1]), Number(cell[2])]);
      const body = line.trim();
      if (body) current.text += (current.text ? " " : "") + body;
    }
    for (const item of items) {
      item.trigger = /pisar|al pisar/i.test(item.text) ? "touch" : "action";
      item.fase = Number(item.text.match(/Fase\s*[≥>=]+\s*(\d)/i)?.[1] ?? 1);
    }
    return { declared: Number(m[1]), items };
  }
  return { declared: 0, items: [] };
}

/**
 * Valores curados en el catálogo anterior que la regeneración debe respetar: hoy sólo el
 * `type` de la fase A del jefe (el tipo de entrenador «DN_KINGGUS» es un tipo propio del
 * mod y no aparece en la tabla del plan). Si el catálogo previo trae el mismo jefe, se
 * conserva su `phaseA` para no pisar ajustes hechos a mano.
 */
function curatedBossTypes() {
  if (!fs.existsSync(OUT)) return new Map();
  try {
    const previous = JSON.parse(fs.readFileSync(OUT, "utf8"));
    const out = new Map();
    for (const ep of previous.episodes ?? []) {
      if (ep.boss?.phaseA?.type && ep.bossName === ep.boss.name) out.set(ep.key, ep.boss.phaseA);
    }
    return out;
  } catch {
    return new Map();
  }
}
const CURATED = curatedBossTypes();

const blueprint = {
  title: "Dimensional Nightmare — plano de conexiones, NPCs y eventos",
  generatedBy: "tools/create_dimensional_nightmare_events.mjs",
  docs: "docs/DIMENSIONAL_NIGHTMARE/01..07",
  hub: { map: 2030, x: 36, y: 12, note: "Gruta de los Testigos: punto de entrada/salida de cada episodio" },
  flags: {
    switchRange: [882, 934],
    variableRange: [265, 288],
    commonEvents: [900, 906],
  },
  episodes: [],
};

for (const episode of EPISODES) {
  const text = fs.readFileSync(path.join(DOCS, episode.doc), "utf8");
  const sectionsMap = sections(text);
  const npcSection = [...sectionsMap].find(([t]) => /NPCs por mapa/i.test(t))?.[1] ?? [];
  const eventSection = [...sectionsMap].find(([t]) => /Eventos programables/i.test(t))?.[1] ?? [];
  const anomalies = parseAnomalies(sectionsMap);
  blueprint.episodes.push({
    key: episode.key,
    doc: episode.doc,
    mapRange: { from: episode.from, to: episode.to },
    seal: episode.seal,
    grieta: episode.grieta,
    resonance: episode.res,
    anomalyVariable: episode.var,
    cuota: episode.cuota,
    bossName: episode.boss,
    boss: BOSSES[episode.key]
      ? { ...BOSSES[episode.key], phaseA: CURATED.get(episode.key) ?? BOSSES[episode.key].phaseA }
      : null,
    anomalies,
    npcs: parseNpcs(npcSection),
    events: parseEvents(eventSection, episode),
  });
}

// Nexo: eventos propios (doc 07) sin tabla de NPCs
const nexoText = fs.readFileSync(path.join(DOCS, "07_MAPA_DE_FLUJO.md"), "utf8");
const nexoEvents = [...nexoText.matchAll(/EV_NEXO_[A-Za-z0-9]+/g)].map((m) => m[0]);
blueprint.episodes.push({
  key: "NEXO",
  doc: "07_MAPA_DE_FLUJO.md",
  mapRange: { from: 2136, to: 2140 },
  seal: 889,
  grieta: 895,
  resonance: 18,
  anomalyVariable: null,
  bossName: null,
  boss: null,
  anomalies: { declared: 0, items: [] },
  npcs: [],
  events: [...new Set(nexoEvents)].map((name) => ({
    name, episode: "NEXO", detail: "ver doc 07", effect: "", maps: [], cells: [], trigger: "action", instances: 1,
  })),
});

const stats = blueprint.episodes.map((e) => ({
  key: e.key,
  npcs: e.npcs.length,
  events: e.events.length,
  instances: e.events.reduce((sum, ev) => sum + ev.instances, 0),
  anomalies: e.anomalies.declared,
}));

if (CHECK) {
  console.log("episodio  NPCs  eventos  instancias  anomalías");
  for (const s of stats) console.log(`${s.key.padEnd(8)} ${String(s.npcs).padStart(4)} ${String(s.events).padStart(7)} ${String(s.instances).padStart(10)} ${String(s.anomalies).padStart(10)}`);
  const missing = blueprint.episodes.filter((e) => !e.npcs.length && e.key !== "NEXO" && e.key !== "EP01");
  if (missing.length) {
    console.log(`aviso: sin NPCs parseados en ${missing.map((e) => e.key).join(", ")} (revisar el formato de la tabla)`);
    process.exitCode = 1;
  }
  process.exit(process.exitCode ?? 0);
}

fs.writeFileSync(OUT, `${JSON.stringify(blueprint, null, 2)}\n`);
console.log(`plano de eventos: ${blueprint.episodes.length} episodios → ${path.relative(ROOT, OUT)}`);
for (const s of stats) console.log(`  ${s.key}: ${s.npcs} NPCs · ${s.events} eventos (${s.instances} instancias) · ${s.anomalies} anomalías`);
