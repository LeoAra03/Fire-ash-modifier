#!/usr/bin/env node
/** Auditoría de recursos, pantallas, progresión y guardado del bloque 2900–2999. */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { marshalLoad } from "../../web/js/marshal.js";
import { parseEvent, parseMap, rstr } from "../../web/js/rmxp.js";
import { DATA, GAME, ROOT } from "../lib/dn_rmxp.mjs";

const OUT = path.join(ROOT, "content", "lote6_fase030_integracion.json");
const VERIFY = process.argv.includes("--verify");
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
const text = (relative) => fs.existsSync(path.join(ROOT, relative)) ? fs.readFileSync(path.join(ROOT, relative), "utf8") : "";
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full)); else if (entry.isFile()) out.push(full);
  }
  return out.sort();
}
function countAssets(dir) {
  const files = walk(dir); return { files: files.length, byExtension: Object.fromEntries([...files.reduce((map, file) => { const ext = path.extname(file).toLowerCase() || "(none)"; map.set(ext, (map.get(ext) ?? 0) + 1); return map; }, new Map())].sort()), zeroBytes: files.filter((file) => fs.statSync(file).size === 0).map((file) => path.relative(ROOT, file).split(path.sep).join("/")) };
}
function rubySections() {
  const file = path.join(DATA, "Scripts.rxdata");
  if (!fs.existsSync(file)) return [];
  const raw = marshalLoad(new Uint8Array(fs.readFileSync(file)));
  return raw.map((row) => {
    const title = rstr(row[1]);
    let code = "";
    try { code = row[2] ? zlib.inflateSync(Buffer.from(row[2].bytes)).toString("utf8") : ""; } catch { /* el auditor conserva la sección ilegible en el conteo */ }
    return { title, code };
  });
}
function occurrences(source, patterns) {
  return Object.fromEntries(patterns.map(([id, pattern]) => [id, [...source.matchAll(pattern)].length]));
}
function readMapHub() {
  const file = path.join(DATA, "Map048.rxdata");
  if (!fs.existsSync(file)) return { events: 0, names: [], states: [] };
  const map = parseMap(marshalLoad(new Uint8Array(fs.readFileSync(file))));
  const events = map.events.map((event) => parseEvent(event.obj)).filter((event) => /^PokeMod Hub:/i.test(event.name));
  const states = [...new Set(events.flatMap((event) => event.pages.flatMap((page) => page.list.map((command) => rstr(command.getIvar("parameters")?.[0])).filter((line) => /estado|progreso|sello|anomalía|resonancia/i.test(line)))))].sort();
  return { events: events.length, names: events.map((event) => event.name).sort(), states };
}
function mapAudio() {
  const kinds = { 241: "BGM", 245: "BGS", 249: "ME", 250: "SE" };
  const available = Object.fromEntries(Object.values(kinds).map((kind) => {
    const dir = path.join(GAME, "Audio", kind);
    return [kind, new Set((fs.existsSync(dir) ? fs.readdirSync(dir) : []).map((file) => file.replace(/\.[^.]+$/, "").toLowerCase()))];
  }));
  const missing = new Map(); const references = new Map();
  const add = (kind, raw) => {
    const name = rstr(raw?.getIvar?.("name") ?? raw);
    if (!name || name === "(OFF)") return;
    const key = name.replace(/\.[^.]+$/, "").toLowerCase();
    const refKey = `${kind}:${key}`;
    references.set(refKey, (references.get(refKey) ?? 0) + 1);
    if (!available[kind]?.has(key)) missing.set(refKey, { kind, name, count: (missing.get(refKey)?.count ?? 0) + 1 });
  };
  for (const file of fs.readdirSync(DATA).filter((name) => /^Map\d+\.rxdata$/i.test(name))) {
    const map = parseMap(marshalLoad(new Uint8Array(fs.readFileSync(path.join(DATA, file)))));
    add("BGM", map.bgm);
    for (const event of map.events) for (const page of parseEvent(event.obj).pages) for (const command of page.list) {
      const code = Number(command.getIvar("code"));
      if (kinds[code]) add(kinds[code], command.getIvar("parameters")?.[0]);
    }
  }
  return {
    referencedNames: references.size,
    references: [...references.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, count]) => ({ name, count })),
    missing: [...missing.values()].sort((a, b) => `${a.kind}:${a.name}`.localeCompare(`${b.kind}:${b.name}`)),
  };
}
function contracts() {
  const atlas = readJson("content/atlas_circuito.json");
  const dims = readJson("content/dimensiones_barco.json");
  const diplomas = readJson("content/diplomas_planta.json");
  const outfits = readJson("content/outfits_dimension.json");
  const gods = readJson("content/pokegods_originales.json");
  const regions = readJson("content/dlc_regiones.json");
  const expansion = readJson("content/expansion_multiversal.json");
  const campaigns = fs.existsSync(path.join(ROOT, "content/rom_campaigns_complete.json")) ? readJson("content/rom_campaigns_complete.json") : {};
  return {
    atlas: { gyms: atlas.gimnasios?.length ?? 0, medals: Number(atlas.medallas?.total ?? 0), rivals: atlas.rivales?.length ?? 0 },
    dimensions: { count: dims.dimensiones?.length ?? 0, switches: Object.keys(dims.interruptores ?? {}).length },
    regions: { maps: regions.mapas?.length ?? 0, routes: regions.rutas?.length ?? 0, tilesets: regions.tilesets?.length ?? 0, campaigns: Object.keys(campaigns).length || campaigns.campaigns?.length || 0 },
    diplomas: { count: diplomas.diplomas?.length ?? 0, conditions: (diplomas.diplomas ?? []).map((item) => ({ key: item.clave, condition: item.condicion })) },
    outfits: { count: outfits.atavios?.length ?? 0, dimensions: outfits.dimensiones?.length ?? 0, variable: outfits.variables?.atavio ?? null },
    pokegods: { roster: gods.roster?.length ?? 0, forms: Object.keys(gods.forms ?? {}).length, pendingAssets: gods.assets?.pendientes ?? [], completeAssets: gods.assets?.completos ?? null },
    expansion: { rifts: expansion.rifts?.length ?? 0, finalSwitch: expansion.finalSwitch ?? null, purgeGoal: expansion.purgeGoal ?? null },
    hub: { targetStates: 32, evidence: "Map048 PokeMod Hub events; static count is not a runtime state proof" },
  };
}
function saveContract(ruby, packageReport) {
  const source = ruby.map((section) => section.code).join("\n");
  const suspicious = [...source.matchAll(/(?:File|open|save|Save|Game\.rxdata)[^\n]{0,100}/g)].map((match) => match[0].slice(0, 160)).slice(0, 30);
  const forbidden = [
    ...(packageReport?.checks?.forbiddenPackageEntries ?? []),
    ...(packageReport?.checks?.guestRomDerivedMosaics ?? []),
  ];
  return {
    saveReferences: suspicious,
    packageArtifacts: forbidden,
    packageIsolation: forbidden.length === 0,
    realSaveTest: "pending_human_review: corte durante guardado, PC/Android/paquete exportado",
    recoveryDoc: fs.existsSync(path.join(ROOT, "docs/qa/lote5/recuperacion_partida.md")),
  };
}
function buildReport() {
  const ruby = rubySections();
  const rubyText = ruby.map((section) => section.code).join("\n");
  const graphics = countAssets(path.join(GAME, "Graphics"));
  const audio = countAssets(path.join(GAME, "Audio"));
  const packageReport = fs.existsSync(path.join(ROOT, "content/lote6_fase027_cierre.json")) ? readJson("content/lote6_fase027_cierre.json") : null;
  const hubs = readMapHub();
  const featureSignals = occurrences(rubyText, [
    ["fly", /\b(?:pbFlyTo|FlyTo|fly)/gi], ["fieldMoves", /\b(?:pbCut|pbSurf|pbStrength|pbFlash|pbRockSmash|pbWaterfall|pbDive|pbTeleport)/gi],
    ["fishing", /\b(?:pbFishing|fishing|OldRod|GoodRod|SuperRod)/gi], ["dayNight", /\b(?:daynight|day.?night|Time\.now|PokeBattle_Clock)/gi],
    ["weather", /\b(?:Weather|pbWeather|weather)/gi], ["cinematics", /\b(?:cinematic|cutscene|pbToneChangeAll|pbFlash|pbShake)/gi],
    ["victoryDefeat", /\b(?:victory|defeat|pbLose|canLose|Battle_Abort)/gi], ["healing", /\b(?:pbHeal|heal|Pokémon Center|Centro Pokémon)/gi],
    ["shops", /\b(?:shop|store|Poké Mart|PokeMart|tienda)/gi], ["progress", /\b(?:PokeMod Hub:|PROGRESO|progreso)/gi],
  ]);
  const battleAssets = ["Battlebacks", "Animations", "Transitions", "Pokemon/Front", "Pokemon/Back", "Pokemon/Icons", "Trainers"].map((dir) => ({ dir, ...countAssets(path.join(GAME, "Graphics", dir)) }));
  const uiAssets = ["Pictures", "Windowskins", "Titles"].map((dir) => ({ dir, ...countAssets(path.join(GAME, "Graphics", dir)) }));
  const contract = contracts();
  const resourceFailures = [
    ...graphics.zeroBytes.map((file) => `gráfico de cero bytes: ${file}`),
    ...audio.zeroBytes.map((file) => `audio de cero bytes: ${file}`),
    ...mapAudio().missing.map((row) => `BGM referenciada sin archivo homónimo: ${row.name}`),
  ];
  const audioAudit = mapAudio();
  return {
    schema: "lote6_fase030_integracion/1.0",
    tasks: "2900–2999",
    resources: { graphics, audio, battleAssets, uiAssets, audioReferences: audioAudit, failures: resourceFailures },
    ruby: { sections: ruby.length, signals: featureSignals, internalIdLeakCandidates: [...rubyText.matchAll(/\b(?:Map|Switch|Variable)\d+\b/g)].length },
    contracts: contract,
    hub: hubs,
    save: saveContract(ruby, packageReport),
    gameplayFamilies: {
      flight: { status: "static_signal_manual_runtime_pending", signalCount: featureSignals.fly },
      fieldMoves: { status: "static_signal_manual_runtime_pending", signalCount: featureSignals.fieldMoves },
      fishing: { status: "static_signal_manual_runtime_pending", signalCount: featureSignals.fishing },
      dayNight: { status: "static_signal_manual_runtime_pending", signalCount: featureSignals.dayNight },
      weather: { status: "static_signal_manual_runtime_pending", signalCount: featureSignals.weather },
      cinematics: { status: "static_signal_manual_runtime_pending", signalCount: featureSignals.cinematics },
      defeatsVictories: { status: "static_signal_manual_runtime_pending", signalCount: featureSignals.victoryDefeat },
      economyHealing: { status: "static_signal_manual_runtime_pending", signalCount: featureSignals.healing + featureSignals.shops },
      save: { status: "manual_pending", reason: "los cortes y recuperación necesitan Game.exe/PC/Android" },
    },
    manual: [
      "cada pista suena y no se corta al transferir",
      "cada pantalla nueva en resoluciones soportadas, sin apertura durante combate",
      "vuelo, movimientos de campo, pesca, clima y ciclo temporal dentro/fuera de interiores",
      "derrota/victoria, finales, diplomas, medallas, atavíos y Pokégods en partida",
      "dinero/mochila/tiendas/curación y guardado en PC, Android y paquete exportado",
    ],
    status: resourceFailures.length ? "static_review_manual_pending" : "static_pass_manual_pending",
  };
}
const report = buildReport();
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (VERIFY) {
  if (!fs.existsSync(OUT)) throw new Error(`Falta ${path.relative(ROOT, OUT)}`);
  if (fs.readFileSync(OUT, "utf8") !== serialized) throw new Error(`${path.relative(ROOT, OUT)} está desactualizado`);
} else { fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, serialized); }
console.log(`FASE 030 integración: gráficos ${report.resources.graphics.files} · audio ${report.resources.audio.files} · BGM faltantes ${report.resources.audioReferences.missing.length} · diplomas ${report.contracts.diplomas.count} · ${report.status}`);
// Cero bytes y corrupción son fallos de máquina; faltantes históricos de audio se conservan como revisión.
if (report.resources.graphics.zeroBytes.length || report.resources.audio.zeroBytes.length) process.exitCode = 1;
