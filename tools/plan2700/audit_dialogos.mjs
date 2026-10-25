#!/usr/bin/env node
/**
 * Volcado y QA de diálogos del plan 2700 (FASE 021, IDs 2000–2099).
 *
 * Parte del volcado reproducible de plan900, normaliza cada caja de texto y
 * separa PASS de revisión editorial. No reescribe mapas ni scripts.
 */
import fs from "node:fs";
import path from "node:path";
import { marshalLoad } from "../../web/js/marshal.js";
import { visibleWidth } from "../../web/js/rmxp.js";
import { tanda, sha256Text, sha256File } from "./lote2_core.mjs";
import { control as formatoControl } from "../qa/dialogos_formato_check.mjs";

const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
const SOURCE = path.join(ROOT, "content/plan900_dialogos.json");
const OUTPUT = path.join(ROOT, "content/plan2700_dialogos.json");
const WRITE = process.argv.includes("--write") || !process.argv.includes("--verify");
const VERIFY = process.argv.includes("--verify");
const source = JSON.parse(fs.readFileSync(SOURCE, "utf8"));
const DATA = path.join(ROOT, "pokemon_fire_ash", "Data");
function symbols(file) {
  const data = marshalLoad(fs.readFileSync(path.join(DATA, file)));
  return new Set((data.pairs ?? []).map(([key]) => key?.name).filter(Boolean));
}
const validSpecies = symbols("species.dat");
const validItems = symbols("items.dat");
const stripTags = (text) => String(text ?? "")
  .replace(/\\sp\[[^\]]*\]/gi, "")
  .replace(/\\(?:v|c|ch|f)\[[^\]]*\]/gi, "")
  .replace(/\\[A-Za-z]+/g, "")
  .trim();
function wrapWords(text, max = 43) {
  const lines = [];
  let line = "";
  for (const word of stripTags(text).split(/\s+/).filter(Boolean)) {
    if (!line) line = word;
    else if (`${line} ${word}`.length <= max) line += ` ${word}`;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}
const rows = [];
const speakerCounts = new Map();
const exact = new Map();
const variables = [];
const symbolCandidates = new Map();
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
for (const map of source.mapas ?? []) {
  for (const event of map.eventos ?? []) {
    for (const page of event.paginas ?? []) {
      for (const box of page.cajas ?? []) {
        const rawLines = (box.lineas ?? []).map(String);
        const raw = rawLines.join(" ");
        const text = stripTags(raw);
        const speakers = raw.matchAll(/\\sp\[([^\]]+)\]/gi);
        const names = [...speakers].map((match) => match[1]);
        for (const name of names) speakerCounts.set(name, (speakerCounts.get(name) ?? 0) + 1);
        for (const match of raw.matchAll(/\\v\[([^\]]*)\]/gi)) variables.push({ mapId: map.mapId, event: event.nombre, page: page.pagina, value: match[1] });
        for (const match of text.matchAll(/\b[A-Z][A-Z0-9_]{2,}\b/g)) {
          const token = match[0];
          const kind = validSpecies.has(token) ? "species" : validItems.has(token) ? "item" : "unknown";
          const key = `${kind}:${token}`;
          symbolCandidates.set(key, (symbolCandidates.get(key) ?? 0) + 1);
        }
        if (text) exact.set(text, (exact.get(text) ?? 0) + 1);
        rows.push({
          mapId: map.mapId,
          map: map.nombre,
          profile: profile(map.mapId),
          eventId: event.eventoId,
          event: event.nombre,
          page: page.pagina,
          command: box.comando,
          lines: rawLines,
          text,
          speakers: names,
          wrappedAt43: wrapWords(text),
          lineWidths: rawLines.map((line) => visibleWidth(stripTags(line))),
        });
      }
    }
  }
}
const empty = rows.filter((row) => !row.text);
const tooWide = rows.filter((row) => row.lineWidths.some((width) => width > 53));
const twoLineOverflow = rows.filter((row) => row.wrappedAt43.length > 2);
const brokenWordCandidates = rows.filter((row) => row.text.split(/\s+/).some((word) => visibleWidth(word) > 43));
const missingOpeningQuestion = rows.filter((row) => /\?/.test(row.text) && !/¿/.test(row.text));
const missingOpeningExclamation = rows.filter((row) => /!/.test(row.text) && !/¡/.test(row.text));
const emptyVariables = variables.filter((entry) => !entry.value.trim());
const tooManyLines = rows.filter((row) => row.lines.length > 3);
const longConversations = [];
for (const map of source.mapas ?? []) for (const event of map.eventos ?? []) for (const page of event.paginas ?? []) {
  if ((page.cajas ?? []).length > 8) longConversations.push({ mapId: map.mapId, event: event.nombre, page: page.pagina, boxes: page.cajas.length });
}
const likelyEnglish = rows.filter((row) => /\b(?:welcome|the |you got|let's|congratulations|press|continue|battle|route|city)\b/i.test(row.text));
const duplicateText = [...exact.entries()].filter(([, count]) => count > 1).sort((a, b) => b[1] - a[1]).slice(0, 200).map(([text, count]) => ({ text, count }));
const speakerVariants = {};
for (const name of speakerCounts.keys()) {
  const key = name.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toUpperCase();
  (speakerVariants[key] ??= []).push(name);
}
const inconsistentSpeakers = Object.entries(speakerVariants).filter(([, names]) => new Set(names).size > 1).map(([normalized, names]) => ({ normalized, names }));
const catalog = [...symbolCandidates.entries()].sort((a, b) => b[1] - a[1]).map(([key, count]) => {
  const [kind, token] = key.split(":");
  return { kind, token, count };
});
const campaignRows = rows.filter((row) => /PokeMod Campaña ROM/.test(row.event));
const campaignDialogRows = campaignRows.filter((row) => /NPC|Entrenador|Cynthia|Guía/i.test(row.event));
const profileMemorableCandidates = {};
for (const row of rows.filter((candidate) => candidate.text.length >= 45 && !/Retorno libre|Tramo (anterior|siguiente)|Warp \d+/i.test(candidate.event))) {
  const current = profileMemorableCandidates[row.profile];
  if (!current || row.text.length > current.text.length) profileMemorableCandidates[row.profile] = { mapId: row.mapId, event: row.event, text: row.text };
}
const profileCounts = {};
for (const row of rows) {
  const bucket = profileCounts[row.profile] ?? { boxes: 0, maps: new Set(), events: 0 };
  bucket.boxes += 1; bucket.maps.add(row.mapId); profileCounts[row.profile] = bucket;
}
for (const bucket of Object.values(profileCounts)) bucket.maps = bucket.maps.size;
const report = {
  schema: "plan2700_dialogos/1.0",
  source: "content/plan900_dialogos.json",
  sourceTotals: source.totales,
  scope: {
    dlcEventTarget: 2741,
    importedDialogueTarget: 759,
    observedPokeModEvents: source.totales.eventosPokeMod,
    observedCampaignBoxes: campaignRows.length,
    observedCampaignNpcTrainerBoxes: campaignDialogRows.length,
    note: "Los eventos estructurales de campañas (retornos, warps y tramos) se separan de NPC/Entrenador; el objetivo de 759 se conserva como corte editorial del plan y requiere cotejo contextual con las fuentes invitadas.",
  },
  totals: { boxes: rows.length, mapsInSource: source.mapas.length, mapsWithBoxes: new Set(rows.map((row) => row.mapId)).size, speakers: speakerCounts.size },
  checks: {
    empty: { count: empty.length, examples: empty.slice(0, 50) },
    over53Columns: { count: tooWide.length, examples: tooWide.slice(0, 100) },
    overTwoLinesAt43Columns: { count: twoLineOverflow.length, examples: twoLineOverflow.slice(0, 100) },
    possibleWordCut: { count: brokenWordCandidates.length, examples: brokenWordCandidates.slice(0, 100) },
    overTwoContinuationLines: { count: tooManyLines.length, examples: tooManyLines.slice(0, 100) },
    overEightBoxes: { count: longConversations.length, examples: longConversations.slice(0, 100) },
    missingOpeningQuestion: { count: missingOpeningQuestion.length, examples: missingOpeningQuestion.slice(0, 100) },
    missingOpeningExclamation: { count: missingOpeningExclamation.length, examples: missingOpeningExclamation.slice(0, 100) },
    emptyVariables: { count: emptyVariables.length, examples: emptyVariables.slice(0, 100) },
    inconsistentSpeakers,
    likelyEnglish: { count: likelyEnglish.length, examples: likelyEnglish.slice(0, 100) },
    repeatedLiterals: duplicateText,
  },
  catalog: {
    validSpecies: [...new Set(catalog.filter((entry) => entry.kind === "species").map((entry) => entry.token))].sort(),
    validItems: [...new Set(catalog.filter((entry) => entry.kind === "item").map((entry) => entry.token))].sort(),
    unknownUppercaseCandidates: catalog.filter((entry) => entry.kind === "unknown").slice(0, 300),
    sourceSpeciesCount: validSpecies.size,
    sourceItemCount: validItems.size,
  },
  profileCounts,
  memorableCandidates: profileMemorableCandidates,
  speakers: [...speakerCounts.entries()].sort((a, b) => b[1] - a[1]).map(([name, boxes]) => ({ name, boxes })),
  variables,
  dialogos: rows,
  manual: [
    "revisión de voz propia y frase memorable por dimensión",
    "revisión de signos, ortografía y nombres propios con contexto",
    "partida para comprobar que una caja no interrumpe una escena",
    "revisión de los 759 diálogos importados/adaptados uno por uno",
  ],
  policy: "Los repetidos y posibles anglicismos son candidatos editoriales; no se reemplazan automáticamente porque algunos son nombres propios, menús o mensajes de sistema.",
  lote2: (() => {
    // FASE 001 del LOTE 2 (tanda 22): corte por líneas, control de formato y
    // enlace al informe. Se recalcula en cada corrida para que --verify no
    // pueda aprobar un artefacto desactualizado.
    const t22 = tanda(22);
    const fmt = formatoControl();
    const informe = "docs/qa/dialogos_informe.md";
    const informeAbs = path.join(ROOT, informe);
    return {
      lote: "LOTE 2",
      fase: "001",
      tanda: {
        n: t22.n,
        lineas: `${t22.fromLine}–${t22.toLine}`,
        tareas: `${t22.firstId}–${t22.lastId}`,
        corteSha256: sha256Text(t22.tasks.map((x) => x.text).join("\n")),
      },
      formato: {
        reglas: fmt.reglas.length,
        cajas: fmt.cajas,
        errores: fmt.totalErrores,
        avisos: fmt.totalAvisos,
        porRegla: Object.fromEntries(fmt.reglas.map((r) => [r.id, (r.nivel === "error" ? fmt.errores[r.id] : fmt.avisos[r.id]).count])),
        codigosMotor: fmt.codigosMotor,
      },
      reescrituras: 0,
      informe: { path: informe, sha256: fs.existsSync(informeAbs) ? sha256File(informeAbs) : null },
      carril: "cerrado_con_control_en_ci",
      regenerar: "npm run audit:plan2700:dialogos",
    };
  })(),
};
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (VERIFY) {
  if (!fs.existsSync(OUTPUT)) throw new Error(`Falta ${path.relative(ROOT, OUTPUT)}`);
  if (fs.readFileSync(OUTPUT, "utf8") !== serialized) throw new Error(`${path.relative(ROOT, OUTPUT)} está desactualizado; ejecuta npm run audit:plan2700:dialogos`);
}
if (WRITE) fs.writeFileSync(OUTPUT, serialized);
if (!process.argv.includes("--json")) {
  console.log(`Diálogos plan2700: ${rows.length} cajas · ${report.totals.mapsWithBoxes}/${report.totals.mapsInSource} mapas · ${speakerCounts.size} hablantes`);
  console.log(`  vacías ${empty.length} · >2 líneas a 43 columnas ${twoLineOverflow.length} · palabras indivisibles ${brokenWordCandidates.length}`);
  console.log(`  >8 cajas seguidas ${longConversations.length} · variables vacías ${emptyVariables.length} · posibles anglicismos ${likelyEnglish.length}`);
  console.log(`  salida: ${path.relative(ROOT, OUTPUT)}`);
} else console.log(serialized);
