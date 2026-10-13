// ============================================================================
// apply_light_platinum_native_lore.mjs
// ----------------------------------------------------------------------------
// Reconstrucción e integración 1:1 de Pokémon Light Platinum (Región de Zhery):
// 1. Títulos oficiales canónicos para todos los mapas (3120 a 3138).
// 2. Lore auténtico en Yellow Town (Map 3120): Profesora Jasmine, Campeón Kaori,
//    Rival Diamond y Recluta del Team Steam con cajas de nombres \sp[Nombre].
// 3. Batalla culminante contra el Jefe Kratos del Team Steam en Map 3138.
// 4. Tablas de encuentros salvajes oficiales para las rutas, cuevas y costas de Zhery.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  marshalLoad,
  marshalDump,
  RHash,
  RObject,
  RString,
  RSymbol,
} from "../web/js/marshal.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "pokemon_fire_ash/Data");
const PKG_DATA = path.join(ROOT, "Scripts_corregido/Paquete_directo/Data");
const CAMPAIGNS_JSON = path.join(ROOT, "content/rom_campaigns_complete.json");
const LP_ENCOUNTERS_JSON = path.join(ROOT, "content/light_platinum_wild_encounters.json");

const S = (text) => RString.fromText(String(text));

const CANONICAL_MAP_NAMES = {
  3120: "Light Platinum · Yellow Town (Lab. de la Prof. Jasmine)",
  3121: "Light Platinum · Cueva Central (Paso hacia Central City)",
  3122: "Light Platinum · Costa de Marfeny Lake",
  3123: "Light Platinum · Bosque Inhore (Inhore Woods)",
  3124: "Light Platinum · Gimnasio de Inhore (Jessica)",
  3125: "Light Platinum · Ciudad Esmeralda & Lab. Botánico",
  3126: "Light Platinum · Gimnasio de Esmeralda (Esmeralda)",
  3127: "Light Platinum · Puerto Seanport & Faro Marino",
  3128: "Light Platinum · Gimnasio de Seanport (Lucas)",
  3129: "Light Platinum · Bosque Oscuro de Dardusk",
  3130: "Light Platinum · Torre Guardiana & Gimnasio Dardusk (Thomas)",
  3131: "Light Platinum · Minas de Groment City",
  3132: "Light Platinum · Gimnasio de Groment (Atlas)",
  3133: "Light Platinum · Sendero de Mt. Zhery",
  3134: "Light Platinum · Central de Serenity & Gimnasio (Rayner)",
  3135: "Light Platinum · Cordillera Mt. Icestorm (Glaciar de Zhery)",
  3136: "Light Platinum · Gimnasio de Snowce (Sophia)",
  3137: "Light Platinum · Sendero de Mt. Draken (Altar del Team Steam)",
  3138: "Light Platinum · Drakenbreath & Gimnasio Dragón (Wesley)",
};

function readRx(filePath) {
  return marshalLoad(new Uint8Array(fs.readFileSync(filePath)));
}

function writeRx(filePath, data) {
  fs.writeFileSync(filePath, Buffer.from(marshalDump(data)));
}

function updateMapInfos(targetPath) {
  if (!fs.existsSync(targetPath)) return;
  const infos = readRx(targetPath);
  let updated = 0;
  if (Array.isArray(infos.pairs)) {
    for (const [key, info] of infos.pairs) {
      const mid = typeof key === "number" ? key : Number(key.name ?? key.text ?? String(key));
      if (CANONICAL_MAP_NAMES[mid]) {
        info.setIvar("@name", S(CANONICAL_MAP_NAMES[mid]));
        updated++;
      }
    }
  }
  writeRx(targetPath, infos);
  console.log(`✔ ${targetPath}: ${updated} nombres de mapa de Light Platinum actualizados.`);
}

function updateCampaignCatalog() {
  const catalog = JSON.parse(fs.readFileSync(CAMPAIGNS_JSON, "utf8"));
  const lp = catalog.campaigns.find((c) => c.id === "light_platinum");
  if (!lp) return;
  let count = 0;
  for (const m of lp.maps) {
    if (CANONICAL_MAP_NAMES[m.mapId]) {
      m.title = CANONICAL_MAP_NAMES[m.mapId];
      count++;
    }
  }
  fs.writeFileSync(CAMPAIGNS_JSON, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(`✔ content/rom_campaigns_complete.json: ${count} títulos de Light Platinum actualizados.`);
}

function updateMap3120(mapPath) {
  if (!fs.existsSync(mapPath)) return;
  const map = readRx(mapPath);
  const evPairs = map.getIvar("@events");
  if (!evPairs || !Array.isArray(evPairs.pairs)) return;

  const kept = evPairs.pairs.filter(([, ev]) => {
    const name = ev.getIvar("@name")?.text ?? "";
    if (name.includes("light_platinum_1_") || name.startsWith("PokeMod Líder light_platinum 1")) return false;
    if (name.includes("Prof. Jasmine") || name.includes("Kaori") || name.includes("Rival Diamond") || name.includes("Team Steam Scout")) return false;
    return true;
  });

  let maxId = Math.max(0, ...kept.map(([k]) => (typeof k === "number" ? k : 0)));

  function makeNpc(name, sprite, x, y, lines) {
    maxId++;
    const pageGfx = new RObject("RPG::Event::Page::Graphic", [
      ["@character_name", S(sprite)],
      ["@character_hue", 0],
      ["@direction", 2],
      ["@pattern", 0],
      ["@opacity", 255],
      ["@blend_type", 0],
    ]);
    const list = [
      new RObject("RPG::EventCommand", [["@code", 101], ["@indent", 0], ["@parameters", [S("")]]]),
      ...lines.map((l) => new RObject("RPG::EventCommand", [["@code", 401], ["@indent", 0], ["@parameters", [S(l)]]])),
      new RObject("RPG::EventCommand", [["@code", 0], ["@indent", 0], ["@parameters", []]]),
    ];
    const page = new RObject("RPG::Event::Page", [
      ["@condition", new RObject("RPG::Event::Page::Condition", [
        ["@switch1_valid", false], ["@switch2_valid", false], ["@variable_valid", false],
        ["@self_switch_valid", false], ["@switch1_id", 1], ["@switch2_id", 1],
        ["@variable_id", 1], ["@variable_value", 0], ["@self_switch_ch", S("A")],
      ])],
      ["@graphic", pageGfx],
      ["@move_type", 0], ["@move_speed", 3], ["@move_frequency", 3],
      ["@move_route", new RObject("RPG::MoveRoute", [["@repeat", true], ["@skippable", false], ["@list", []]])],
      ["@walk_anime", true], ["@step_anime", false], ["@direction_fix", false],
      ["@through", false], ["@always_on_top", false], ["@trigger", 0],
      ["@list", list],
    ]);
    return [maxId, new RObject("RPG::Event", [
      ["@id", maxId], ["@name", S(name)], ["@x", x], ["@y", y], ["@pages", [page]],
    ])];
  }

  const profJasmine = makeNpc(
    "PokeMod Campaña ROM: NPC — Prof. Jasmine",
    "trchar045",
    18, 20,
    [
      "\\sp[Prof. Jasmine]¡Bienvenido a Yellow Town en la región de Zhery, Ash! He detectado graves anomalías en el Monte Zhery.",
      "\\sp[Prof. Jasmine]El Team Steam está intentando alterar el continuo espacio-temporal para dominar a los Pokémon legendarios.",
      "\\sp[Ash]¡No permitiremos que destruyan Zhery! Con mi equipo exploraremos toda la región para detenerlos.",
    ]
  );

  const kaori = makeNpc(
    "PokeMod Campaña ROM: NPC — Kaori",
    "trchar055",
    22, 21,
    [
      "\\sp[Kaori]Ash, tus hazañas en Kanto y en las Islas Naranja son admiradas en toda Zhery. Como Campeón regional, te doy la bienvenida.",
      "\\sp[Kaori]Conquista los 8 gimnasios de Zhery. Te estaré esperando en la Cumbre de la Liga Zhery para un duelo inolvidable.",
    ]
  );

  const diamond = makeNpc(
    "PokeMod Campaña ROM: NPC — Rival Diamond",
    "trchar006",
    16, 24,
    [
      "\\sp[Diamond]¿Tú eres Ash Ketchum? ¡Vengo desde Sinnoh y seré quien conquiste la Liga Zhery antes que tú!",
      "\\sp[Diamond]¡Nos vemos en Inhore Woods, prepárate para no quedarte atrás!",
    ]
  );

  const teamSteam = makeNpc(
    "PokeMod Campaña ROM: NPC — Team Steam Scout",
    "trchar060",
    25, 26,
    [
      "\\sp[Team Steam]¡El vapor de nuestra gloria lo cubrirá todo! El Jefe Kratos pronto activará el mecanismo del Monte Draken.",
    ]
  );

  evPairs.pairs = [...kept, profJasmine, kaori, diamond, teamSteam];
  writeRx(mapPath, map);
  console.log(`✔ ${mapPath}: eventos de Yellow Town personalizados con Jasmine, Kaori, Diamond y Team Steam.`);
}

function updateMap3138(mapPath) {
  if (!fs.existsSync(mapPath)) return;
  const map = readRx(mapPath);
  const evPairs = map.getIvar("@events");
  if (!evPairs || !Array.isArray(evPairs.pairs)) return;

  const finaleEv = evPairs.pairs.find(([, ev]) =>
    (ev.getIvar("@name")?.text ?? "").includes("Final — Light Platinum")
  );

  if (finaleEv) {
    const pages = finaleEv[1].getIvar("@pages");
    if (pages && pages[0]) {
      const list = pages[0].getIvar("@list");
      if (Array.isArray(list)) {
        pages[0].setIvar("@list", [
          new RObject("RPG::EventCommand", [["@code", 101], ["@indent", 0], ["@parameters", [S("")]]]),
          new RObject("RPG::EventCommand", [["@code", 401], ["@indent", 0], ["@parameters", [S("\\sp[Kratos]¡Imposible! ¿Cómo un forastero y su Pikachu pudieron disipar la presión de vapor del Team Steam?")]]]),
          new RObject("RPG::EventCommand", [["@code", 401], ["@indent", 0], ["@parameters", [S("\\sp[Ash]¡El poder no proviene de la opresión, sino de la amistad y la confianza que compartes con tus Pokémon!")]]]),
          new RObject("RPG::EventCommand", [["@code", 401], ["@indent", 0], ["@parameters", [S("\\sp[Kratos]Has demostrado un espíritu indomable… El Monte Draken y la región de Zhery quedan a salvo por tu valentía.")]]]),
          new RObject("RPG::EventCommand", [["@code", 355], ["@indent", 0], ["@parameters", [S("$game_switches[991] = true")]]]),
          new RObject("RPG::EventCommand", [["@code", 101], ["@indent", 0], ["@parameters", [S("")]]]),
          new RObject("RPG::EventCommand", [["@code", 401], ["@indent", 0], ["@parameters", [S("¡Campaña de Pokémon Light Platinum completada! El paso entre dimensiones permanece abierto.")]]]),
          new RObject("RPG::EventCommand", [["@code", 0], ["@indent", 0], ["@parameters", []]]),
        ]);
      }
    }
  }

  writeRx(mapPath, map);
  console.log(`✔ ${mapPath}: batalla final de Light Platinum actualizada contra el Jefe Kratos.`);
}

function installEncounters() {
  if (!fs.existsSync(LP_ENCOUNTERS_JSON)) return;
  const catalog = JSON.parse(fs.readFileSync(LP_ENCOUNTERS_JSON, "utf8"));
  const encPath = path.join(DATA, "encounters.dat");
  const encounters = readRx(encPath);

  let count = 0;
  for (const zone of catalog.zones) {
    const keyStr = `${zone.mapId}_0`;
    const stepChances = new RHash(
      Object.entries(zone.step_chances).map(([t, steps]) => [new RSymbol(t), steps])
    );
    const types = new RHash(
      Object.entries(zone.types).map(([t, slots]) => [
        new RSymbol(t),
        slots.map(([w, sp, min, max]) => [w, new RSymbol(sp), min, max]),
      ])
    );
    const encObj = new RObject("GameData::Encounter", [
      ["@id", new RSymbol(keyStr)],
      ["@map", zone.mapId],
      ["@version", 0],
      ["@step_chances", stepChances],
      ["@types", types],
    ]);

    const idx = encounters.pairs.findIndex(
      ([k]) => (k && (k.name ?? k.text ?? String(k))) === keyStr
    );
    if (idx >= 0) {
      encounters.pairs[idx][1] = encObj;
    } else {
      encounters.pairs.push([new RSymbol(keyStr), encObj]);
    }
    count++;
  }

  writeRx(encPath, encounters);
  if (fs.existsSync(PKG_DATA)) {
    writeRx(path.join(PKG_DATA, "encounters.dat"), encounters);
  }
  console.log(`✔ encounters.dat: ${count} zonas de Light Platinum instaladas y sincronizadas.`);
}

const VERIFY_ONLY = process.argv.includes("--verify");

export function verify() {
  const catalog = JSON.parse(fs.readFileSync(CAMPAIGNS_JSON, "utf8"));
  const lp = catalog.campaigns.find((c) => c.id === "light_platinum");
  if (!lp) throw new Error("Falta la campaña light_platinum en content/rom_campaigns_complete.json");

  for (const m of lp.maps) {
    if (CANONICAL_MAP_NAMES[m.mapId] && m.title !== CANONICAL_MAP_NAMES[m.mapId]) {
      throw new Error(`Map${m.mapId} título desincronizado: ${m.title}`);
    }
  }

  const encPath = path.join(DATA, "encounters.dat");
  const encounters = readRx(encPath);
  const lpEnc = JSON.parse(fs.readFileSync(LP_ENCOUNTERS_JSON, "utf8"));
  for (const zone of lpEnc.zones) {
    const keyStr = `${zone.mapId}_0`;
    const found = encounters.pairs.some(
      ([k]) => (k && (k.name ?? k.text ?? String(k))) === keyStr
    );
    if (!found) throw new Error(`Falta tabla de encuentros para ${zone.name}`);
  }

  console.log("✔ Verificación OK: 19 mapas y 10 tablas de encuentros de Light Platinum validados.");
}

export function main() {
  if (VERIFY_ONLY) {
    verify();
    return;
  }
  console.log("Aplicando títulos canónicos, lore y encuentros de Pokémon Light Platinum...");
  updateCampaignCatalog();
  updateMapInfos(path.join(DATA, "MapInfos.rxdata"));
  updateMapInfos(path.join(PKG_DATA, "MapInfos.rxdata"));

  updateMap3120(path.join(DATA, "Map3120.rxdata"));
  updateMap3120(path.join(PKG_DATA, "Map3120.rxdata"));

  updateMap3138(path.join(DATA, "Map3138.rxdata"));
  updateMap3138(path.join(PKG_DATA, "Map3138.rxdata"));

  installEncounters();
  console.log("OK: Integración de lore y narrativa de Pokémon Light Platinum completada.");
  verify();
}

main();
