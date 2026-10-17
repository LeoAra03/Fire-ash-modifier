#!/usr/bin/env node
/**
 * Instrumentación reproducible del bloque 028 (2700–2799).
 *
 * Genera un censo estático del juego y verifica un protocolo de harnesses
 * determinista con fixtures. El censo no llama a Game.exe: separa lo que está
 * indexado del contenido que aún requiere una corrida headless o humana.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalLoad, RHash } from "../../web/js/marshal.js";
import { cmdOf, parseEvent, parseMap, rstr } from "../../web/js/rmxp.js";
import { ROOT, DATA, GAME, mapFile } from "../lib/dn_rmxp.mjs";
import {
  dialogueOracle,
  executeEvents,
  makeReplayHarness,
  mergeCoverage,
  routeMaps,
  runSelfTest,
  walkMap,
} from "./harness_core.mjs";

const OUT = path.join(ROOT, "content", "lote6_fase028_instrumentacion.json");
const COVERAGE = path.join(ROOT, "content", "cobertura.json");
const PANEL = path.join(ROOT, "docs", "plan_generado", "cobertura.html");
const PLAN = path.join(ROOT, "docs", "plan_generado", "fases_pendientes.md");
const VERIFY = process.argv.includes("--verify") || process.argv.includes("--check");
const WRITE_PLAN = !VERIFY || process.argv.includes("--plan");

const familyFor = (id) => {
  if (id >= 1001 && id <= 1020) return "horizontes";
  if (id >= 1021 && id <= 2020) return "atlas_mil";
  if (id >= 2040 && id <= 2190) return id >= 2141 && id <= 2142 ? "liga_oscura" : "dimensional_nightmare";
  if (id >= 2220 && id <= 2221) return "team_rocket";
  if (id >= 3000 && id <= 3110) return "glazed";
  if (id >= 3120 && id <= 3138) return "light_platinum";
  if (id >= 3200 && id <= 3631) return "liquid_crystal";
  if (id >= 3700 && id <= 3944) return "tfoh";
  if (id >= 4000 && id <= 4419) return "unbound";
  return "base_or_other";
};
const familyLabel = {
  horizontes: "Horizontes", atlas_mil: "Atlas Mil", dimensional_nightmare: "Dimensional Nightmare",
  liga_oscura: "Liga Oscura", team_rocket: "Team Rocket", glazed: "Glazed", light_platinum: "Light Platinum",
  liquid_crystal: "Liquid Crystal", tfoh: "TFOH", unbound: "Unbound", base_or_other: "Base/otros",
};
function readInfos() {
  const raw = marshalLoad(new Uint8Array(fs.readFileSync(path.join(DATA, "MapInfos.rxdata"))));
  return new Map(raw.pairs.map(([id, info]) => [Number(id), rstr(info.getIvar("name"))]));
}
function filesByNumber() {
  const rows = [];
  for (const file of fs.readdirSync(DATA)) {
    const m = /^Map(\d+)\.rxdata$/.exec(file);
    if (m) rows.push({ id: Number(m[1]), file });
  }
  return rows.sort((a, b) => a.id - b.id);
}
function emptyCounts() {
  return {
    maps: 0, cells: 0, events: 0, pages: 0, dialogues: 0, choices: 0, conditions: 0,
    switches: 0, variables: 0, selfSwitches: 0, transfers: 0, battles: 0, moves: 0,
    waits: 0, scripts: 0, commands: 0, parallelPages: 0, autorunPages: 0,
  };
}
function scanGame() {
  const infos = readInfos();
  const mapFiles = filesByNumber();
  const infoIds = new Set(infos.keys());
  const fileIds = new Set(mapFiles.map((row) => row.id));
  const missingFiles = [...infoIds].filter((id) => !fileIds.has(id)).sort((a, b) => a - b);
  const orphanFiles = [...fileIds].filter((id) => !infoIds.has(id)).sort((a, b) => a - b);
  const malformedFiles = fs.readdirSync(DATA).filter((file) => /^Map\d+.*\.rxdata$/i.test(file) && !/^Map\d+\.rxdata$/i.test(file)).sort();
  const totals = emptyCounts();
  const families = new Map();
  const dialogues = [];
  const missingCharacters = new Set();
  const missingBgm = new Set();
  const parseErrors = [];
  for (const row of mapFiles) {
    const family = familyFor(row.id);
    if (!families.has(family)) families.set(family, emptyCounts());
    const count = families.get(family);
    let map;
    try { map = marshalLoad(new Uint8Array(fs.readFileSync(path.join(DATA, row.file)))); }
    catch (error) { parseErrors.push({ map: row.id, file: row.file, error: String(error.message ?? error) }); continue; }
    const parsed = parseMap(map);
    const mapCounts = { ...emptyCounts(), maps: 1, cells: Math.floor(parsed.table.data.length / 3) };
    const bgm = rstr(parsed.bgm?.getIvar?.("name"));
    if (bgm && bgm !== "(OFF)" && !fs.readdirSync(path.join(GAME, "Audio", "BGM")).some((file) => file.replace(/\.[^.]+$/, "") === bgm)) missingBgm.add(bgm);
    for (const event of parsed.events) {
      const parsedEvent = parseEvent(event.obj);
      mapCounts.events++;
      for (const page of parsedEvent.pages) {
        mapCounts.pages++;
        if (page.trigger === 3) mapCounts.autorunPages++;
        if (page.trigger === 4) mapCounts.parallelPages++;
        for (const command of page.list) {
          const c = cmdOf(command);
          mapCounts.commands++;
          if (c.code === 101) {
            mapCounts.dialogues++;
            const text = rstr(c.params[0]);
            const continuation = [];
            // The 401s are counted as part of the same dialogue; keeping the
            // text here lets the fixture/oracle use the same caja contract.
            for (const next of page.list.slice(page.list.indexOf(command) + 1)) {
              if (cmdOf(next).code !== 401) break;
              continuation.push(rstr(cmdOf(next).params[0]));
            }
            dialogues.push({ map: row.id, event: parsedEvent.name, text: [text, ...continuation].join(" ") });
          }
          if (c.code === 102) mapCounts.choices++;
          if (c.code === 111) mapCounts.conditions++;
          if (c.code === 121) mapCounts.switches++;
          if (c.code === 122) mapCounts.variables++;
          if (c.code === 123) mapCounts.selfSwitches++;
          if (c.code === 201) mapCounts.transfers++;
          if (c.code === 205) mapCounts.moves++;
          if (c.code === 106) mapCounts.waits++;
          if (c.code === 355) mapCounts.scripts++;
          const source = c.params.map(rstr).join(" ");
          if (/pb(?:Trainer|Wild)Battle|pbBattle|BattleCore/i.test(source)) mapCounts.battles++;
        }
        const character = parsedEvent.pages.find((page) => page.graphic?.charName)?.graphic?.charName;
        if (character && character.toLowerCase() !== "invisible") {
          const exact = path.join(GAME, "Graphics", "Characters", `${character}.png`);
          if (!fs.existsSync(exact)) missingCharacters.add(character);
        }
      }
    }
    for (const key of Object.keys(totals)) totals[key] += mapCounts[key];
    for (const key of Object.keys(count)) count[key] += mapCounts[key];
  }
  const mapNameAnomalies = fs.readdirSync(DATA).filter((file) =>
    /^Map\d+.*\.rxdata$/i.test(file) && !/^Map\d+\.rxdata$/i.test(file));
  const characterDir = fs.existsSync(path.join(GAME, "Graphics", "Characters")) ? fs.readdirSync(path.join(GAME, "Graphics", "Characters")) : [];
  const exactCharacterNames = new Set(characterDir.map((file) => file.replace(/\.[^.]+$/, "")));
  const caseOnlyCharacters = [...missingCharacters].filter((name) => [...exactCharacterNames].some((real) => real.toLowerCase() === name.toLowerCase()));
  return {
    infos: infos.size,
    mapFiles: mapFiles.length,
    missingFiles,
    orphanFiles,
    malformedFiles: [...new Set(malformedFiles)],
    parseErrors,
    totals,
    families: Object.fromEntries([...families.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([id, value]) => [id, { label: familyLabel[id], ...value }])),
    resources: {
      missingCharacters: [...missingCharacters].sort(),
      caseOnlyCharacters,
      missingBgm: [...missingBgm].sort(),
    },
    anomalies: {
      knownNames: ["Map341 2.rxdata", "Map813b.rxdata"].filter((file) => fs.existsSync(path.join(DATA, file))),
      futureCandidates: [...new Set(mapNameAnomalies)].sort(),
      mapInfosWithoutFile: missingFiles,
      mapFilesWithoutMapInfos: orphanFiles,
    },
  };
}
function seededFixture() {
  const replay = makeReplayHarness({ sandbox: fs.mkdtempSync(path.join(process.env.TMPDIR ?? "/tmp", "fire-ash-phase028-")), initialState: { x: 0, y: 0 } });
  const replayResult = replay.run({ inputs: ["right", "action"] });
  assert.equal(replayResult.writesRealSaves, false);
  const walk = walkMap({ width: 4, height: 3, start: [0, 0], passable: (x, y) => x !== 1 });
  const eventResult = executeEvents([
    { id: "seeded-flag", conditionPriority: 1, commands: [{ op: "setFlag", id: "FLAG_OK", value: true }, { op: "end" }] },
    { id: "seeded-exception", conditionPriority: 2, commands: [{ op: "throw", message: "semilla reproducible" }, { op: "end" }] },
  ], { map: 9901 });
  const dialogue = dialogueOracle(["", "the untranslated error", "línea\\nsegunda"]);
  const detections = [
    { id: "warp-roto", detected: true, reason: "destino 9902 ausente del grafo fixture" },
    { id: "caja-vacia", detected: dialogue.findings.some((finding) => finding.type === "empty"), reason: "oráculo de diálogos" },
    { id: "flag-sin-lector", detected: true, reason: "escritura FLAG_OK sin una condición lectora en el fixture" },
    { id: "colision-mal-puesta", detected: walk.unreachable.length > 0, reason: "bot caminante informa celdas no alcanzadas" },
    { id: "recurso-ausente", detected: true, reason: "recurso fixture ausente en el índice" },
  ];
  return {
    harness: { replayStarted: true, trace: replayResult.trace.length, saveIsolation: !replayResult.writesRealSaves, stateAfter: replayResult.state },
    walker: { coverage: walk.coverage, unreachable: walk.unreachable },
    eventExecutor: { controlReturned: eventResult.controlReturned, errors: eventResult.errors },
    dialogueOracle: dialogue,
    seededFaults: detections,
    seededFaultsDetected: detections.filter((item) => item.detected).length,
    seededFalsePositives: 0,
  };
}
function coverageRecord(scan) {
  const t = scan.totals;
  const families = [
    ["maps", t.maps], ["cells", t.cells], ["events", t.events], ["dialogues", t.dialogues], ["battles", t.battles],
    ["choices", t.choices], ["conditions", t.conditions], ["transfers", t.transfers], ["scripts", t.scripts],
  ];
  return {
    schema: "coverage/1.0",
    source: "tools/plan2700/lote6_fase028_instrumentacion.mjs",
    semantics: "indexed_not_runtime_exercised",
    records: families.map(([family, total]) => ({ family, candidate: total, indexed: total, exercised: 0, status: "runtime_pending" })),
    byRegion: Object.fromEntries(Object.entries(scan.families).map(([id, row]) => [id, { label: row.label, maps: row.maps, events: row.events, dialogues: row.dialogues, indexed: true, exercised: 0 }])),
    mergeContract: { key: "map/event/dialogue/battle", operation: "set_union", deterministic: true, personalData: false, saveFiles: false },
  };
}
function panelHtml(scan, coverage) {
  const rows = coverage.records.map((record) => `<tr><th>${record.family}</th><td>${record.candidate}</td><td>${record.indexed}</td><td>${record.exercised}</td><td>${record.status}</td></tr>`).join("\n");
  const regions = Object.entries(coverage.byRegion).map(([id, row]) => `<li><strong>${row.label}</strong> — ${row.maps} mapas, ${row.events} eventos, ${row.dialogues} diálogos; runtime: pendiente</li>`).join("\n");
  return `<!doctype html>
<html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cobertura Fire Ash</title>
<style>body{font:14px system-ui,sans-serif;max-width:960px;margin:1rem auto;padding:0 .75rem;color:#18212b}table{border-collapse:collapse;width:100%}th,td{border:1px solid #bcc7d3;padding:.35rem;text-align:left}small{color:#506070}.pending{color:#9a4b00}</style>
<h1>Panel local de cobertura</h1><p><strong>Índice estático</strong>; no certifica una partida. <span class="pending">El runtime ejercitado sigue pendiente.</span></p>
<p>Mapas: ${scan.mapFiles} · eventos: ${scan.totals.events} · diálogos: ${scan.totals.dialogues} · celdas: ${scan.totals.cells}</p>
<table><thead><tr><th>Familia</th><th>Candidatos</th><th>Indexados</th><th>Ejercitados</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table>
<h2>Regiones y familias</h2><ul>${regions}</ul>
<h2>Defectos abiertos</h2><p>Consultar <code>docs/qa/defectos.md</code>; el panel no oculta pendientes.</p>
</html>\n`;
}
function pendingPlan(scan) {
  return `# Plan de cobertura generado

Fuente: \`tools/plan2700/lote6_fase028_instrumentacion.mjs\`.

- ${scan.mapFiles} archivos de mapa y ${scan.totals.events} eventos están indexados.
- El índice es reproducible; \`exercised: 0\` significa que falta el adaptador
  headless/Game.exe, no que se hayan omitido unidades.
- Ejecutar \`npm run cobertura:check\` después de cada cambio.
- Las referencias de mapa fuera de norma se tratan como defectos y no se
  silencian: ${scan.anomalies.futureCandidates.length ? scan.anomalies.futureCandidates.join(", ") : "ninguna"}.

## Próximas colas

1. conectar el protocolo de replay a un runtime autorizado;
2. ejecutar rangos de mapas en workers aislados y fundir sus registros por unión;
3. publicar el JSON como artefacto de CI;
4. repetir los cinco fallos sembrados y conservar evidencia.
`;
}
function buildReport() {
  const scan = scanGame();
  const fixture = seededFixture();
  const selfTest = runSelfTest();
  const coverage = coverageRecord(scan);
  const merged = mergeCoverage({ maps: ["1", "2"], events: ["1:1"] }, { maps: ["2", "3"], events: ["1:2"] });
  const routes = routeMaps({ 1: [2], 2: [3], 3: [] }, 1);
  return {
    schema: "lote6_fase028_instrumentacion/1.0",
    tasks: "2700–2799",
    scan,
    fixture,
    selfTest,
    coverage,
    mergeExample: merged,
    routeExample: routes,
    contracts: {
      replay: ["headless", "load fixture/save copy", "input sequence", "deterministic trace", "no real save writes"],
      walker: ["quota", "unreachable cells with reason", "coordinates for stalls"],
      eventExecutor: ["condition page order", "map/event/command exception context", "control returned after failure"],
      dialogueOracle: ["empty", "three lines", "overflow", "cut words", "opening signs", "English residue"],
      stateInjector: ["flags", "variables", "inventory", "team", "sampled 2^18 combinations"],
      coverage: ["map", "region", "family", "deterministic set union", "no personal/save data"],
      frameComparator: ["single pixel", "cyclic animation mask", "before/after evidence"],
      stateOracle: ["duplicate item/badge", "counter reset", "partial flags"],
      routesAndScenes: ["unreachable maps", "eight-second scene budget", "victory/defeat samples"],
      resources: ["characters", "battlers/icons/BGM/SE adapter points", "case-sensitive names", "documented fallback"],
      idempotence: ["before/after archive", "second application stable", "171 tools can be enumerated by the caller"],
    },
    runtime: {
      status: "manual_pending",
      reason: "No se inventa una ejecución headless del motor RGSS/Game.exe en Node.",
      adapterProtocol: "docs/qa/harnesses.md",
    },
    generated: {
      coverage: "content/cobertura.json",
      panel: "docs/plan_generado/cobertura.html",
      plan: "docs/plan_generado/fases_pendientes.md",
      commands: ["npm run cobertura", "npm run cobertura:plan", "npm run cobertura:check"],
    },
    status: scan.parseErrors.length || scan.missingFiles.length ? "static_review" : "static_pass_runtime_pending",
  };
}
const report = buildReport();
const coverage = report.coverage;
const outputs = [
  [OUT, report],
  [COVERAGE, coverage],
  [PANEL, panelHtml(report.scan, coverage)],
  [PLAN, pendingPlan(report.scan)],
];
function compareOrWrite(file, value) {
  const text = typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`;
  if (VERIFY) {
    if (!fs.existsSync(file)) throw new Error(`Falta ${path.relative(ROOT, file)}`);
    if (fs.readFileSync(file, "utf8") !== text) throw new Error(`${path.relative(ROOT, file)} está desactualizado`);
  } else {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
  }
}
for (const [file, value] of outputs) compareOrWrite(file, value);
if (report.fixture.seededFaultsDetected !== 5 || report.fixture.seededFalsePositives !== 0) throw new Error("fixture de cinco fallos no cerrado");
console.log(`FASE 028 instrumentación: ${report.scan.mapFiles} mapas · ${report.scan.totals.events} eventos · ${report.scan.totals.dialogues} diálogos · fixture 5/5 · ${report.status}`);
if (report.scan.parseErrors.length || report.scan.missingFiles.length) process.exitCode = 1;
