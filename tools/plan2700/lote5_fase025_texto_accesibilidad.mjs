#!/usr/bin/env node
/** Auditoría de idioma, pulido y accesibilidad estática (FASE 025). */
import fs from "node:fs";
import path from "node:path";
import { marshalLoad } from "../../web/js/marshal.js";
import { cmdOf, mapListFromInfos, parseMap } from "../../web/js/rmxp.js";

const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
const DATA = path.join(ROOT, "pokemon_fire_ash", "Data");
const SOURCE = path.join(ROOT, "content", "plan2700_dialogos.json");
const OUT = path.join(ROOT, "content", "lote5_fase025_texto.json");
const VERIFY = process.argv.includes("--verify");
const source = JSON.parse(fs.readFileSync(SOURCE, "utf8"));
const clean = (value) => String(value ?? "")
  .replace(/\\(?:sp|v|c|ch|f)\[[^\]]*\]/gi, "")
  .replace(/\\[A-Za-z]+/g, "")
  .replace(/\s+/g, " ")
  .trim();
const rows = source.dialogos ?? [];
const candidate = (test) => rows.filter((row) => test(row.text)).map((row) => ({ mapId: row.mapId, map: row.map, event: row.event, page: row.page, text: row.text })).slice(0, 200);
const english = candidate((text) => /\b(?:welcome|the |you got|let's|congratulations|press|continue|battle|route|city|your |with |this |from )\b/i.test(text));
const technical = candidate((text) => /(?:Map\d+|switch|variable|RMXP|engine|script|Data\/|Graphics\/|Audio\/|event id)/i.test(text));
const missingQuestion = candidate((text) => /\?/.test(text) && !/¿/.test(text));
const missingExclamation = candidate((text) => /!/.test(text) && !/¡/.test(text));
const underscores = candidate((text) => /\b[A-Za-z0-9]+_[A-Za-z0-9_]+\b/.test(text));
const pathLeak = candidate((text) => /(?:[A-Za-z]:\\|\/home\/|\.rxdata|\.dat\b|\.mjs\b|\.rb\b)/i.test(text));
const unresolvedVariables = candidate((text) => /\\v\[\s*\]/i.test(text));
const visibleNames = [...new Set(rows.flatMap((row) => row.speakers ?? []))].sort((a, b) => a.localeCompare(b));
const normalizedNames = new Map();
for (const name of visibleNames) {
  const key = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  const values = normalizedNames.get(key) ?? [];
  values.push(name);
  normalizedNames.set(key, values);
}
const speakerVariants = [...normalizedNames.entries()].filter(([, values]) => new Set(values).size > 1).map(([key, values]) => ({ key, values }));
const speciesData = marshalLoad(fs.readFileSync(path.join(DATA, "species.dat")));
const itemData = marshalLoad(fs.readFileSync(path.join(DATA, "items.dat")));
const species = new Set((speciesData.pairs ?? []).map(([key]) => key?.name).filter(Boolean));
const items = new Set((itemData.pairs ?? []).map(([key]) => key?.name).filter(Boolean));
const tokens = new Map();
for (const row of rows) for (const token of row.text.matchAll(/\b[A-Z][A-Z0-9_]{2,}\b/g)) {
  const value = token[0];
  const kind = species.has(value) ? "species" : items.has(value) ? "item" : "other";
  const key = `${kind}:${value}`;
  tokens.set(key, (tokens.get(key) ?? 0) + 1);
}
const catalogRefs = [...tokens.entries()].sort((a, b) => b[1] - a[1]).map(([key, count]) => { const [kind, value] = key.split(":"); return { kind, value, count }; });
const choices = [];
for (const info of mapListFromInfos(marshalLoad(fs.readFileSync(path.join(DATA, "MapInfos.rxdata"))))) {
  const file = path.join(DATA, `Map${String(info.id).padStart(3, "0")}.rxdata`);
  if (!fs.existsSync(file)) continue;
  const parsed = parseMap(marshalLoad(fs.readFileSync(file)));
  for (const entry of parsed.events) for (const page of entry.obj.getIvar("pages") ?? []) for (const raw of page.getIvar("list") ?? []) {
    const command = cmdOf(raw);
    if (command.code !== 102) continue;
    const options = Array.isArray(command.params[0]) ? command.params[0].map((item) => item?.text ?? String(item ?? "")) : [];
    choices.push({ mapId: info.id, map: info.name, options, count: options.length });
  }
}
const overFourChoices = choices.filter((choice) => choice.count > 4);
const zeroChoices = choices.filter((choice) => choice.count === 0);
const report = {
  schema: "lote5_fase025_texto_accesibilidad/1.0",
  tasks: "2400–2499",
  source: "content/plan2700_dialogos.json + Map*.rxdata + species.dat + items.dat",
  totals: { dialogBoxes: rows.length, speakers: visibleNames.length, choices: choices.length, species: species.size, items: items.size },
  checks: {
    likelyEnglish: { count: english.length, examples: english },
    technicalJargon: { count: technical.length, examples: technical },
    missingOpeningQuestion: { count: missingQuestion.length, examples: missingQuestion },
    missingOpeningExclamation: { count: missingExclamation.length, examples: missingExclamation },
    internalUnderscores: { count: underscores.length, examples: underscores },
    pathLeaks: { count: pathLeak.length, examples: pathLeak },
    unresolvedVariables: { count: unresolvedVariables.length, examples: unresolvedVariables },
    speakerVariants,
    choicesOverFour: { count: overFourChoices.length, examples: overFourChoices.slice(0, 100) },
    choicesEmpty: { count: zeroChoices.length, examples: zeroChoices.slice(0, 100) },
  },
  catalogReferences: catalogRefs.slice(0, 500),
  style: {
    terms: ["Vía", "Ancla", "Emisión", "Sello", "Fragmento", "Dimensión invitada", "Liga Oscura"],
    rules: [
      "Español claro; conservar nombres oficiales de Pokémon, movimientos, objetos, medallas y mapas.",
      "Usar ¿? y ¡! cuando correspondan; no usar rutas, IDs, switches ni jerga del motor en texto visible.",
      "Preferir frases cortas, voz propia y una acción o consecuencia concreta por caja.",
      "No usar humillación, gore gratuito, parodia que rompa el tono ni promesas de contenido inexistente.",
      "No depender solo del color, sonido o una señal efímera para una pista importante.",
    ],
  },
  accessibility: {
    static: [
      "opciones de elección con máximo de cuatro salidas",
      "variables vacías y rutas internas no aparecen en el volcado",
      "nombres de hablante y términos de catálogo quedan auditables",
    ],
    manual: [
      "contraste real de windowskins sobre fondos claros/oscuros",
      "tamaño de fuente en pantalla pequeña y Android",
      "legibilidad temporal de pistas y ausencia de información solo sonora/visual",
      "uso con una mano y lectura sin depender del color",
    ],
  },
  externalReview: "pending_human_review",
};
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (VERIFY) {
  if (!fs.existsSync(OUT)) throw new Error(`Falta ${path.relative(ROOT, OUT)}`);
  if (fs.readFileSync(OUT, "utf8") !== serialized) throw new Error(`${path.relative(ROOT, OUT)} está desactualizado`);
} else fs.writeFileSync(OUT, serialized);
console.log(`FASE 025 texto: ${rows.length} cajas · inglés candidato ${english.length} · rutas ${pathLeak.length} · elecciones >4 ${overFourChoices.length} · revisión externa ${report.externalReview}`);
