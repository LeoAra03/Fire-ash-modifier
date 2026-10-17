#!/usr/bin/env node
/**
 * FASE 032 — resistencia, hardware, localización y autoría.
 *
 * El checkout puede medir inventarios, formatos, textos y contratos. No puede
 * convertirse en Game.exe, un teléfono Android, un mando, ocho horas de
 * juego ni un grupo de jugadores. Las comprobaciones perceptivas permanecen
 * explícitamente como manual_pending.
 */
import fs from "node:fs";
import path from "node:path";
import { marshalLoad } from "../../web/js/marshal.js";
import { cmdOf, parseEvent, parseMap, rstr, visibleWidth } from "../../web/js/rmxp.js";

const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
const GAME = path.join(ROOT, "pokemon_fire_ash");
const DATA = path.join(GAME, "Data");
const OUT = path.join(ROOT, "content", "lote7_fase032_resistencia.json");
const VERIFY = process.argv.includes("--verify");

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
function readJson(relative) { return JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8")); }
function cleanText(value) {
  return rstr(value)
    .replace(/\\(?:sp|v|c|ch|f)\[[^\]]*\]/gi, "")
    .replace(/\\[A-Za-z]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
function mapFiles() {
  return fs.readdirSync(DATA)
    .flatMap((file) => {
      const match = /^Map(\d+)\.rxdata$/i.exec(file);
      return match ? [{ id: Number(match[1]), file }] : [];
    })
    .sort((a, b) => a.id - b.id);
}
function scanMaps() {
  const rows = [];
  const failures = [];
  let maps = 0;
  let cells = 0;
  let events = 0;
  let pages = 0;
  let boxes = 0;
  let choices = 0;
  for (const row of mapFiles()) {
    try {
      const raw = marshalLoad(new Uint8Array(fs.readFileSync(path.join(DATA, row.file))));
      const map = parseMap(raw);
      maps++;
      cells += map.width * map.height;
      for (const eventObject of map.events) {
        const event = parseEvent(eventObject.obj);
        events++;
        for (let pageIndex = 0; pageIndex < event.pages.length; pageIndex++) {
          const page = event.pages[pageIndex];
          pages++;
          let currentBox = null;
          for (const rawCommand of page.list) {
            const command = cmdOf(rawCommand);
            if (command.code === 101) {
              if (currentBox && currentBox.text) rows.push(currentBox);
              boxes++;
              currentBox = { mapId: row.id, eventId: event.id, event: event.name, page: pageIndex + 1, text: "" };
            } else if (command.code === 401 && currentBox) {
              const line = cleanText(command.params[0]);
              currentBox.text = `${currentBox.text} ${line}`.trim();
            } else if (command.code === 102) choices++;
          }
          if (currentBox && currentBox.text) rows.push(currentBox);
        }
      }
    } catch (error) {
      failures.push({ map: row.id, file: row.file, error: String(error.message ?? error) });
    }
  }
  return { totals: { maps, cells, events, pages, boxes, choices }, rows, failures };
}
function assetAudit() {
  const graphics = walk(path.join(GAME, "Graphics"));
  const audio = walk(path.join(GAME, "Audio"));
  const native = walk(ROOT).filter((file) => /\.(?:dll|so|dylib|exe|apk|aab)$/i.test(file)).map((file) => path.relative(ROOT, file).split(path.sep).join("/"));
  const zero = (files) => files.filter((file) => fs.statSync(file).size === 0).map((file) => path.relative(ROOT, file).split(path.sep).join("/"));
  const byExtension = (files) => Object.fromEntries([...files.reduce((map, file) => {
    const ext = path.extname(file).toLowerCase() || "(none)";
    map.set(ext, (map.get(ext) ?? 0) + 1);
    return map;
  }, new Map())].sort());
  return {
    graphics: { files: graphics.length, byExtension: byExtension(graphics), zeroBytes: zero(graphics) },
    audio: { files: audio.length, byExtension: byExtension(audio), zeroBytes: zero(audio) },
    nativeArtifacts: native,
    readonlyAndPermissions: "manual_pending: no se cambia chmod ni se escribe en la instalación del jugador",
  };
}
function localization(rows) {
  const candidate = (predicate, limit = 120) => rows.filter((row) => predicate(row.text)).slice(0, limit);
  const accented = rows.filter((row) => /[áéíóúüñÁÉÍÓÚÜÑ¿¡]/.test(row.text));
  const replacement = candidate((text) => /[�□]/.test(text));
  const likelyEnglish = candidate((text) => /\b(?:welcome|the|you got|congratulations|press|continue|battle|route|city|your|this|from|with)\b/i.test(text));
  const technical = candidate((text) => /(?:Map\d+|switch|variable|RMXP|engine|script|Data\/|Graphics\/|Audio\/|\.rxdata|\.mjs|\.rb)/i.test(text));
  const missingQuestion = candidate((text) => /\?/.test(text) && !/¿/.test(text));
  const missingExclamation = candidate((text) => /!/.test(text) && !/¡/.test(text));
  const long = rows.filter((row) => visibleWidth(row.text) > 120).slice(0, 120);
  const terms = ["Vía", "Ancla", "Emisión", "Sello", "Fragmento", "Dimensión", "Liga Oscura"];
  const termCounts = Object.fromEntries(terms.map((term) => [term, rows.filter((row) => row.text.includes(term)).length]));
  return {
    boxes: rows.length,
    accentedBoxes: accented.length,
    replacementCharacters: { count: replacement.length, examples: replacement },
    likelyEnglish: { count: likelyEnglish.length, examples: likelyEnglish },
    technicalJargon: { count: technical.length, examples: technical },
    missingOpeningQuestion: { count: missingQuestion.length, examples: missingQuestion },
    missingOpeningExclamation: { count: missingExclamation.length, examples: missingExclamation },
    longForNarrowBox: { count: long.length, examples: long },
    glossarySignals: termCounts,
  };
}
function contractAudit() {
  const regions = readJson("content/dlc_regiones.json");
  const expansion = readJson("content/expansion_multiversal.json");
  const campaigns = readJson("content/rom_campaigns_complete.json");
  const atlas = readJson("content/atlas_circuito.json");
  const dimensions = readJson("content/dimensiones_barco.json");
  const rocket = readJson("content/team_rocket_mision.json");
  const momentsDoc = fs.existsSync(path.join(ROOT, "docs/qa/momentos_memorables.md"));
  return {
    regions: { declaredMaps: regions.mapas?.length ?? 0, declaredRoutes: regions.rutas?.length ?? 0, sevenRifts: expansion.rifts?.length === 7 },
    campaigns: { declared: campaigns.campaigns?.length ?? 0, maps: campaigns.totals?.maps ?? 0 },
    atlas: { gyms: atlas.gimnasios?.length ?? 0, rivals: atlas.rivales?.length ?? 0 },
    dimensions: { dimensions: dimensions.dimensiones?.length ?? 0, switches: Object.keys(dimensions.interruptores ?? {}).length },
    teamRocket: { missions: rocket.misiones?.length ?? 0, declaredRanges: rocket.rangos?.length ?? 0 },
    memorableMomentsDefinition: momentsDoc,
    contractConsistency: [
      ["seven rifts", expansion.rifts?.length === 7],
      ["five campaigns", campaigns.campaigns?.length === 5],
      ["atlas gyms", atlas.gimnasios?.length === 8],
      ["memorable-moments definition", momentsDoc],
    ],
  };
}
function momentCandidates(rows) {
  const signal = /(?:¡|Emisión|Liga Oscura|Arceus|Fragmento|Sello|grieta|jefe|secreto|recuerda|nunca|puerta|alarma|Rocket)/i;
  return rows.filter((row) => signal.test(row.text) && row.text.length >= 25).slice(0, 200).map((row) => ({
    mapId: row.mapId, eventId: row.eventId, event: row.event, page: row.page, text: row.text,
  }));
}
function manualMatrix() {
  const runtime = new Set([3100, 3101, 3102, 3103, 3104, 3105, 3106, 3107, 3108, 3109, 3110, 3111, 3112, 3113, 3114, 3115, 3116, 3117, 3118, 3119, 3120, 3121, 3122, 3123, 3124, 3125, 3126, 3127, 3128, 3129, 3130, 3131, 3132, 3133, 3134]);
  const review = new Set([3135, 3136, 3137, 3138, 3139, 3140, 3142, 3143, 3144, 3146, 3147, 3149, 3150, 3151, 3152, 3153, 3154, 3155, 3156, 3157, 3158, 3159, 3160, 3161, 3162, 3163, 3164, 3165, 3166, 3167, 3168, 3169, 3170, 3171, 3172, 3173, 3174, 3175, 3176, 3177, 3178, 3179, 3180, 3181, 3182, 3183, 3184, 3185, 3186, 3187, 3188, 3189, 3190, 3191, 3192, 3193, 3194, 3195, 3196, 3197, 3198, 3199]);
  return Array.from({ length: 100 }, (_, index) => {
    const id = 3100 + index;
    return { id, status: runtime.has(id) ? "manual_pending" : review.has(id) ? "review_pending" : "manual_pending" };
  });
}
function buildReport() {
  const scanned = scanMaps();
  const assets = assetAudit();
  const localizationAudit = localization(scanned.rows);
  const contracts = contractAudit();
  const candidateMoments = momentCandidates(scanned.rows);
  const machineFailures = [...scanned.failures, ...assets.graphics.zeroBytes, ...assets.audio.zeroBytes];
  return {
    schema: "lote7_fase032_resistencia/1.0",
    tasks: "3100–3199",
    scan: { totals: scanned.totals, mapFailures: scanned.failures },
    assets,
    localization: localizationAudit,
    authorship: {
      definition: "Un momento memorable es una escena, decisión, espacio o combate que el jugador pueda recordar y describir en una frase sin depender de un cartel opcional ni de una guía.",
      candidateCount: candidateMoments.length,
      candidateExamples: candidateMoments,
      contract: contracts,
      countsAreNotValidation: true,
      validation: "manual_pending: cada región, campaña, gimnasio, jefe, ruta, ciudad, mazmorra y secreto exige lectura/playtest humano",
    },
    hardware: {
      staticSignals: { nativeArtifacts: assets.nativeArtifacts, gameDirectoryPresent: fs.existsSync(GAME), androidDirectoryPresent: fs.existsSync(path.join(ROOT, "android")) },
      manual: ["equipo limitado", "Android/Kirin dentro del soporte", "resolución baja/alta", "mando y teclado", "sin internet", "solo lectura y permisos de guardado", "ocho horas, mil transiciones y cien combates"],
      status: "manual_pending",
    },
    taskMatrix: manualMatrix(),
    manual: [
      "ejecutar las ocho horas, mil transiciones, cien combates, siete regiones y DLC en Game.exe sin reiniciar",
      "repetir en hardware limitado, Android/Kirin, resoluciones y mandos declarados",
      "comprobar guardado, memoria, música, transiciones, acentos, cajas estrechas y carpeta de solo lectura",
      "hacer la auditoría autoral y rediseñar escenas/puzles/jefes/rutas/ciudades/mazmorras/secrets que no alcancen la meta",
    ],
    status: machineFailures.length ? "static_review_manual_pending" : "static_pass_manual_pending",
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
console.log(`FASE 032 resistencia: ${report.scan.totals.maps} mapas · ${report.scan.totals.boxes} cajas · gráficos ${report.assets.graphics.files} · audio ${report.assets.audio.files} · candidatos ${report.authorship.candidateCount} · ${report.status}`);
if (report.scan.mapFailures.length || report.assets.graphics.zeroBytes.length || report.assets.audio.zeroBytes.length) process.exitCode = 1;
