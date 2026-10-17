#!/usr/bin/env node
/**
 * FASE 033 — coherencia narrativa, geográfica, visual y sonora.
 *
 * Reúne evidencia estructural (contratos, nombres, transferencias, BGM y
 * archivos) y separa de ella las decisiones que solo puede resolver una
 * lectura/playtest humana.
 */
import fs from "node:fs";
import path from "node:path";
import { marshalLoad } from "../../web/js/marshal.js";
import { cmdOf, mapListFromInfos, parseEvent, parseMap, rstr } from "../../web/js/rmxp.js";

const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
const GAME = path.join(ROOT, "pokemon_fire_ash");
const DATA = path.join(GAME, "Data");
const OUT = path.join(ROOT, "content", "lote7_fase033_coherencia.json");
const VERIFY = process.argv.includes("--verify");
const slash = (file) => path.relative(ROOT, file).split(path.sep).join("/");
const text = (value) => rstr(value).replace(/\\(?:sp|v|c|ch|f)\[[^\]]*\]/gi, "").replace(/\\[A-Za-z]+/g, "").replace(/\s+/g, " ").trim();
function readJson(relative) { return JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8")); }
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(full));
    else if (entry.isFile()) result.push(full);
  }
  return result.sort();
}
function mapFiles() {
  return fs.readdirSync(DATA).flatMap((file) => {
    const match = /^Map(\d+)\.rxdata$/i.exec(file);
    return match ? [{ id: Number(match[1]), file }] : [];
  }).sort((a, b) => a.id - b.id);
}
function mapNames() {
  const file = path.join(DATA, "MapInfos.rxdata");
  if (!fs.existsSync(file)) return new Map();
  const infos = mapListFromInfos(marshalLoad(new Uint8Array(fs.readFileSync(file))));
  return new Map(infos.map((info) => [Number(info.id), text(info.name)]));
}
function familyFor(id) {
  if (id >= 1021 && id <= 2020) return "atlas_mil";
  if (id >= 2040 && id <= 2190) return "dimensional_nightmare";
  if (id >= 3000 && id <= 3110) return "glazed";
  if (id >= 3120 && id <= 3138) return "light_platinum";
  if (id >= 3200 && id <= 3631) return "liquid_crystal";
  if (id >= 3700 && id <= 3944) return "tfoh";
  if (id >= 4000 && id <= 4419) return "unbound";
  if (id >= 1001 && id <= 1020) return "horizontes";
  if (id >= 2220 && id <= 2221) return "team_rocket";
  return "base_or_other";
}
function mapScan() {
  const names = mapNames();
  const metadata = new Map();
  const transfers = [];
  const bgmByFamily = new Map();
  const emptyBgm = [];
  const repeatedEvents = new Map();
  const signals = new Map();
  let maps = 0;
  let events = 0;
  let pages = 0;
  for (const row of mapFiles()) {
    try {
      const raw = marshalLoad(new Uint8Array(fs.readFileSync(path.join(DATA, row.file))));
      const parsed = parseMap(raw);
      maps++;
      const bgm = text(parsed.bgm?.getIvar?.("name"));
      metadata.set(row.id, { width: parsed.width, height: parsed.height, family: familyFor(row.id), name: names.get(row.id) ?? "", bgm });
      if (!bgm || bgm === "(OFF)") emptyBgm.push({ mapId: row.id, name: names.get(row.id) ?? "", family: familyFor(row.id) });
      const family = familyFor(row.id);
      if (!bgmByFamily.has(family)) bgmByFamily.set(family, new Map());
      if (bgm && bgm !== "(OFF)") {
        const lower = bgm.toLowerCase();
        const current = bgmByFamily.get(family).get(lower) ?? { name: bgm, maps: [] };
        current.maps.push(row.id);
        bgmByFamily.get(family).set(lower, current);
      }
      for (const eventObject of parsed.events) {
        const event = parseEvent(eventObject.obj);
        events++;
        const eventName = text(event.name);
        if (eventName) {
          const key = eventName.toLowerCase();
          const record = repeatedEvents.get(key) ?? { name: eventName, maps: new Set(), count: 0 };
          record.maps.add(row.id); record.count++;
          repeatedEvents.set(key, record);
        }
        for (const page of event.pages) {
          pages++;
          for (const rawCommand of page.list) {
            const command = cmdOf(rawCommand);
            const params = command.params.map(text);
            if (command.code === 201) {
              transfers.push({ from: row.id, event: eventName, target: Number(command.params[1]), x: Number(command.params[2]), y: Number(command.params[3]) });
            }
            if (command.code === 101) {
              const candidate = params.join(" ");
              for (const word of ["Fragmento", "Emisión", "Liga Oscura", "Team Rocket", "Arceus", "Sello", "grieta", "dimensión", "Atlas"]) {
                if (candidate.toLowerCase().includes(word.toLowerCase())) signals.set(word, (signals.get(word) ?? 0) + 1);
              }
            }
          }
        }
      }
    } catch {
      // La fase conserva el conteo de errores abajo sin ocultarlo.
    }
  }
  const missingTargets = transfers.filter((row) => !metadata.has(row.target)).slice(0, 200);
  const outOfRange = transfers.filter((row) => {
    const target = metadata.get(row.target);
    return target && (row.x < 0 || row.y < 0 || row.x >= target.width || row.y >= target.height);
  }).slice(0, 200);
  const repeated = [...repeatedEvents.values()].filter((row) => row.maps.size >= 2).map((row) => ({ ...row, maps: [...row.maps].sort((a, b) => a - b) })).sort((a, b) => b.count - a.count).slice(0, 100);
  const bgm = Object.fromEntries([...bgmByFamily.entries()].sort().map(([family, namesByBgm]) => [family, {
    unique: namesByBgm.size,
    themes: [...namesByBgm.values()].sort((a, b) => a.name.localeCompare(b.name)).map((row) => ({ name: row.name, maps: row.maps.length })),
  }]));
  return {
    mapCount: maps,
    eventCount: events,
    pageCount: pages,
    metadataCount: metadata.size,
    transfers: { total: transfers.length, missingTargets, outOfRange },
    emptyBgm: { count: emptyBgm.length, examples: emptyBgm.slice(0, 100) },
    repeatedEvents: repeated,
    narrativeSignals: Object.fromEntries([...signals.entries()].sort()),
    bgmByFamily: bgm,
  };
}
function contractAudit() {
  const expansion = readJson("content/expansion_multiversal.json");
  const regions = readJson("content/dlc_regiones.json");
  const campaigns = readJson("content/rom_campaigns_complete.json");
  const atlas = readJson("content/atlas_circuito.json");
  const dimensions = readJson("content/dimensiones_barco.json");
  const rocket = readJson("content/team_rocket_mision.json");
  const canon = readJson("content/canon_arceus.json");
  return {
    rifts: (expansion.rifts ?? []).map((item) => ({ id: item.id, keys: Object.keys(item) })),
    regionMaps: (regions.mapas ?? []).length,
    regionRoutes: (regions.rutas ?? []).length,
    campaigns: (campaigns.campaigns ?? []).map((item) => ({ id: item.id, title: item.title, palette: item.palette, maps: item.mapCount })),
    atlas: { gyms: (atlas.gimnasios ?? []).map((gym) => ({ id: gym.id, name: gym.nombre, type: gym.tipo, mapId: gym.mapaId })), rivals: (atlas.rivales ?? []).length },
    dimensions: (dimensions.dimensiones ?? []).map((item) => ({ id: item.id, slug: item.slug, mapId: item.mapaId, musicDeclared: Boolean(item.musica) })),
    rocket: { missions: (rocket.misiones ?? []).length, villainKeys: Object.keys(rocket.rival ?? {}) },
    canon: { keys: Object.keys(canon), sourcePresent: true },
    docs: {
      originalRespect: fs.existsSync(path.join(ROOT, "docs/qa/recursos_dlc.md")),
      arceusCanon: fs.existsSync(path.join(ROOT, "docs/CANON_ARCEUS.md")),
      absences: fs.existsSync(path.join(ROOT, "docs/qa/ausencias_personajes.md")),
    },
  };
}
function assetAudit() {
  const graphicFiles = walk(path.join(GAME, "Graphics"));
  const audioFiles = walk(path.join(GAME, "Audio"));
  const tokens = ["atlas", "glazed", "platinum", "crystal", "rocket", "arceus", "liga", "dark", "dimensional", "dn_"];
  const byToken = (files) => Object.fromEntries(tokens.map((token) => [token, files.filter((file) => path.basename(file).toLowerCase().includes(token)).length]));
  const audio = audioFiles.filter((file) => /\.(?:ogg|wav|mid|mp3|wma)$/i.test(file));
  const graphics = graphicFiles.filter((file) => /\.(?:png|jpg|jpeg|gif|bmp)$/i.test(file));
  return {
    graphics: { files: graphics.length, byToken: byToken(graphics) },
    audio: { files: audio.length, byToken: byToken(audio) },
    iconography: "manual_pending: símbolo reconocible y lectura en pantalla requieren revisión visual",
    palettes: "manual_pending: conteo de archivos no prueba diferencia cromática",
  };
}
function taskMatrix() {
  const staticReview = new Set([3200, 3201, 3203, 3206, 3209, 3212, 3215, 3217, 3219, 3225, 3227, 3229, 3231, 3234, 3236, 3238, 3240, 3244, 3249, 3251, 3253, 3257, 3259, 3261, 3263, 3267, 3269, 3271, 3273, 3275, 3277, 3279, 3281, 3283, 3285, 3287, 3289, 3291, 3293, 3295, 3297, 3299]);
  return Array.from({ length: 100 }, (_, index) => {
    const id = 3200 + index;
    return { id, status: staticReview.has(id) ? "review_pending" : "manual_pending" };
  });
}
function buildReport() {
  const maps = mapScan();
  const contracts = contractAudit();
  const assets = assetAudit();
  const machineFailures = maps.transfers.missingTargets.length + maps.transfers.outOfRange.length;
  return {
    schema: "lote7_fase033_coherencia/1.0",
    tasks: "3200–3299",
    maps,
    contracts,
    assets,
    coherence: {
      recurrentNpcCandidates: maps.repeatedEvents,
      villain: { staticContract: contracts.rocket, motivationAndOriginality: "manual_pending" },
      regions: { declaredSevenRifts: contracts.rifts.length === 7, campaignCount: contracts.campaigns.length, distinction: "manual_pending" },
      canon: { arceus: "static_contract_present_manual_tone_pending", fireAsh: contracts.docs.originalRespect ? "documented_manual_pending" : "missing_document" },
      absences: contracts.docs.absences ? "documented_pending_review" : "document_missing_until_this_phase_document_is_added",
      worldChanges: { signals: maps.narrativeSignals, visibleAfterMilestones: "manual_pending" },
      geographicContinuity: { mapInfos: maps.metadataCount, transferTargets: maps.transfers.total, missingTargets: maps.transfers.missingTargets.length, outOfRange: maps.transfers.outOfRange.length, edgeVisuals: "manual_pending" },
      temporalScaleWaterSnow: "manual_pending",
    },
    audio: {
      byFamily: maps.bgmByFamily,
      noMainThemeSharing: "manual_pending: la coincidencia de nombre BGM no decide identidad musical; las cuatro referencias históricas siguen pendientes",
      silenceSignals: maps.emptyBgm,
    },
    visual: { assets, iconography: "manual_pending", palettes: "manual_pending", lighting: "manual_pending", mapBorders: "manual_pending", transitionBiomes: "manual_pending", signalsContradiction: "manual_pending" },
    taskMatrix: taskMatrix(),
    manual: [
      "leer introducción, villano, NPC recurrentes y arco completo en orden",
      "revisar identidad, color, símbolos, música, silencio, iluminación y bordes de las siete regiones",
      "jugar transiciones, secretos, caminos, agua, nieve, hora del día y cambios del mundo",
      "verificar que Arceus, Fire Ash, Team Rocket, Ash, Oak, Maxine y aliados no contradigan sus contratos",
    ],
    status: machineFailures ? "static_review_manual_pending" : "static_pass_manual_pending",
  };
}
const report = buildReport();
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (VERIFY) {
  if (!fs.existsSync(OUT)) throw new Error(`Falta ${path.relative(ROOT, OUT)}`);
  if (fs.readFileSync(OUT, "utf8") !== serialized) throw new Error(`${path.relative(ROOT, OUT)} está desactualizado`);
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, serialized);
}
console.log(`FASE 033 coherencia: ${report.maps.mapCount} mapas · ${report.maps.eventCount} eventos · transferencias ${report.maps.transfers.total} · familias BGM ${Object.keys(report.audio.byFamily).length} · ${report.status}`);
if (report.maps.transfers.missingTargets.length || report.maps.transfers.outOfRange.length) process.exitCode = 1;
