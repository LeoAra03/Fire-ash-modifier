#!/usr/bin/env node
/**
 * Auditoría determinista de la tanda 22 (tareas 2100–2199).
 * Escanea directamente los Map*.rxdata y no modifica el juego.
 */
import fs from "node:fs";
import path from "node:path";
import { marshalLoad } from "../../web/js/marshal.js";
import { cmdOf, mapListFromInfos, parseEvent, parseMap } from "../../web/js/rmxp.js";

const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
const DATA = path.join(ROOT, "pokemon_fire_ash", "Data");
const OUT = path.join(ROOT, "content", "lote5_fase022_dialogos.json");
const VERIFY = process.argv.includes("--verify");
const textOf = (value) => value?.text ?? String(value ?? "");
const profile = (id) => {
  if (id >= 1021 && id <= 2020) return "atlas";
  if (id >= 2040 && id <= 2194) return "nightmare/multiversal";
  if (id >= 3000 && id <= 3110) return "glazed";
  if (id >= 3120 && id <= 3138) return "light_platinum";
  if (id >= 3200 && id <= 3631) return "liquid_crystal";
  if (id >= 3700 && id <= 3944) return "tfoh";
  if (id >= 4000 && id <= 4419) return "unbound";
  return "base/dlc";
};
const bucket = (eventName) => {
  if (/creepypasta|grieta|emisi[oó]n|white hand|lost silver|hypnos|buried|lavender|unown|strangled red/i.test(eventName)) return "emisiones";
  if (/atlas|ancla|tier/i.test(eventName)) return "atlas";
  if (/rocket|infiltr|disfraz/i.test(eventName)) return "team_rocket";
  if (/l[ií]der|campe[oó]n|jefe|guardian|guardi[aá]n/i.test(eventName)) return "jefes";
  if (/cartel|sign|objeto|examin|item|ball/i.test(eventName)) return "carteles_objetos";
  if (/hub|oak|asistente|guardia|transport|portal/i.test(eventName)) return "hubs_accesos";
  if (/campa[nñ]a|npc|aldea|ciudad|pueblo/i.test(eventName)) return "npc_campanas";
  return "otros_pokemod";
};
function collectPage(page) {
  const list = page.list ?? [];
  const boxes = [];
  const scripts = [];
  for (let i = 0; i < list.length; i += 1) {
    const command = cmdOf(list[i]);
    if (command.code === 101) {
      const lines = [textOf(command.params[0])];
      let j = i + 1;
      while (j < list.length && cmdOf(list[j]).code === 401) {
        lines.push(textOf(cmdOf(list[j]).params[0]));
        j += 1;
      }
      boxes.push({ command: i, lines, text: lines.join(" ").trim() });
    } else if ([355, 655].includes(command.code)) {
      const ruby = textOf(command.params[0]);
      if (ruby) scripts.push({ command: i, code: command.code, ruby });
    }
  }
  return { boxes, scripts };
}
function build() {
  const infos = mapListFromInfos(marshalLoad(fs.readFileSync(path.join(DATA, "MapInfos.rxdata"))));
  const totals = { maps: 0, mapsWithPokeMod: 0, events: 0, pages: 0, boxes: 0, scripts: 0 };
  const mapsWithPokeMod = new Set();
  const counts = {};
  const profiles = {};
  const repeats = new Map();
  const findings = { empty: [], english: [], goreOrParody: [], humiliating: [], engineMechanics: [], missingOpening: [], variablesEmpty: [] };
  const sampled = { champions: [], leaders: [], emissions: [], rocket: [], signsAndObjects: [], hubs: [] };
  for (const info of infos) {
    const file = path.join(DATA, `Map${String(info.id).padStart(3, "0")}.rxdata`);
    if (!fs.existsSync(file)) continue;
    totals.maps += 1;
    const parsed = parseMap(marshalLoad(fs.readFileSync(file)));
    for (const entry of parsed.events) {
      const event = parseEvent(entry.obj);
      if (!event.name.startsWith("PokeMod")) continue;
      totals.events += 1;
      totals.pages += event.pages.length;
      mapsWithPokeMod.add(info.id);
      totals.mapsWithPokeMod = mapsWithPokeMod.size;
      const kind = bucket(event.name);
      counts[kind] ??= { events: 0, pages: 0, boxes: 0 };
      counts[kind].events += 1;
      const p = profile(info.id);
      profiles[p] ??= { maps: new Set(), events: 0, boxes: 0 };
      profiles[p].maps.add(info.id);
      profiles[p].events += 1;
      const eventRef = { mapId: info.id, map: info.name, eventId: event.id, event: event.name };
      const sampleKey = kind === "jefes" && /campe[oó]n/i.test(event.name) ? "champions" : kind === "jefes" ? "leaders" : kind === "emisiones" ? "emissions" : kind === "team_rocket" ? "rocket" : kind === "carteles_objetos" ? "signsAndObjects" : kind === "hubs_accesos" ? "hubs" : null;
      if (sampleKey && sampled[sampleKey].length < 100) sampled[sampleKey].push(eventRef);
      for (let pageIndex = 0; pageIndex < event.pages.length; pageIndex += 1) {
        const page = collectPage(event.pages[pageIndex]);
        counts[kind].pages += 1;
        counts[kind].boxes += page.boxes.length;
        profiles[p].boxes += page.boxes.length;
        totals.boxes += page.boxes.length;
        totals.scripts += page.scripts.length;
        for (const box of page.boxes) {
          const ref = { ...eventRef, page: pageIndex + 1, command: box.command, text: box.text };
          if (!box.text) findings.empty.push(ref);
          if (box.text) repeats.set(box.text, (repeats.get(box.text) ?? 0) + 1);
          if (/[?]/.test(box.text) && !/[¿]/.test(box.text)) findings.missingOpening.push(ref);
          if (/\b(?:welcome|the |you got|let's|congratulations|press|continue|battle|route|city)\b/i.test(box.text)) findings.english.push(ref);
          if (/\b(?:gore|entrañas|sangre|desmembr|mutil|víscera|blood|guts|dismember)\b/i.test(box.text)) findings.goreOrParody.push(ref);
          if (/\b(?:idiota|inútil|patético|humill|loser|worthless)\b/i.test(box.text)) findings.humiliating.push(ref);
          if (/\b(?:switch|variable|Map\d+|event ?id|RMXP|engine|script)\b/i.test(box.text)) findings.engineMechanics.push(ref);
          for (const match of box.text.matchAll(/\\v\[([^\]]*)\]/gi)) if (!match[1].trim()) findings.variablesEmpty.push(ref);
        }
      }
    }
  }
  for (const item of Object.values(profiles)) item.maps = item.maps.size;
  const repeatedLiterals = [...repeats.entries()].filter(([, count]) => count > 1).sort((a, b) => b[1] - a[1]).slice(0, 200).map(([text, count]) => ({ text, count }));
  return {
    schema: "lote5_fase022_dialogos/1.0",
    tasks: "2100–2199",
    source: "pokemon_fire_ash/Data/MapInfos.rxdata + Map*.rxdata",
    totals,
    profiles,
    buckets: counts,
    checks: Object.fromEntries(Object.entries(findings).map(([key, values]) => [key, { count: values.length, examples: values.slice(0, 100) }])),
    repeatedLiterals,
    samples: sampled,
    editorial: [
      "leer los candidatos de voz, canon y ausencia de copia con contexto de escena",
      "revisar manualmente los avisos de posible inglés, gore/parodia y jerga de motor",
      "contrastar los textos de créditos con pokemon_fire_ash/Credits.txt",
      "cerrar el carril solo después del playtest humano de las escenas clave",
    ],
  };
}
const report = build();
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (VERIFY) {
  if (!fs.existsSync(OUT)) throw new Error(`Falta ${path.relative(ROOT, OUT)}`);
  if (fs.readFileSync(OUT, "utf8") !== serialized) throw new Error(`${path.relative(ROOT, OUT)} está desactualizado`);
} else fs.writeFileSync(OUT, serialized);
console.log(`FASE 022 diálogo: ${report.totals.events} eventos, ${report.totals.boxes} cajas, vacías ${report.checks.empty.count}, candidatos inglés ${report.checks.english.count}`);
