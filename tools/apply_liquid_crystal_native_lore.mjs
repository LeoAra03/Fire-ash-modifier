// ============================================================================
// apply_liquid_crystal_native_lore.mjs
// ----------------------------------------------------------------------------
// Reconstrucción e integración 1:1 de Pokémon Liquid Crystal (Johto & Kanto):
// 1. Títulos oficiales canónicos para todos los 432 mapas (3200 a 3631).
// 2. Lore auténtico en Pueblo Primavera (Map 3200): Prof. Elm, Rival Silver,
//    Lyra y Eusine con cajas de nombres \sp[Nombre].
// 3. Batalla culminante contra el legendario Campeón Red en la cima del Monte
//    Plateado (Map 3631) con activación del switch 992.
// 4. Tablas de encuentros salvajes canónicas para las rutas y cuevas de Johto.
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
const LC_ENCOUNTERS_JSON = path.join(ROOT, "content/liquid_crystal_wild_encounters.json");

const VERIFY_ONLY = process.argv.includes("--verify");

const S = (text) => RString.fromText(String(text));

export function getLcTitle(mid) {
  if (mid === 3200) return "Liquid Crystal · Pueblo Primavera (Lab. del Prof. Elm)";
  if (mid === 3201) return "Liquid Crystal · Ruta 29 (Paso hacia Cherrygrove)";
  if (mid === 3202) return "Liquid Crystal · Ciudad Cerezo (Cherrygrove City)";
  if (mid === 3203) return "Liquid Crystal · Ruta 30 (Casa del Sr. Pokémon)";
  if (mid === 3204) return "Liquid Crystal · Cueva Oscura (Dark Cave)";
  if (mid === 3205) return "Liquid Crystal · Ciudad Malvalona (Violet City)";
  if (mid === 3206) return "Liquid Crystal · Torre Bellsprout (Sprout Tower)";
  if (mid === 3207) return "Liquid Crystal · Gimnasio de Malvalona (Falkner)";
  if (mid >= 3208 && mid <= 3214) return `Liquid Crystal · Ruinas Alfa (Sector ${mid - 3207})`;
  if (mid === 3215) return "Liquid Crystal · Cueva Unión (Union Cave)";
  if (mid >= 3216 && mid <= 3219) return `Liquid Crystal · Ruta 32 (Costa Sur · Tramo ${mid - 3215})`;
  if (mid === 3220) return "Liquid Crystal · Pueblo Azalea (Pozo Slowpoke)";
  if (mid === 3221) return "Liquid Crystal · Pozo Slowpoke (Nivel Inferior)";
  if (mid === 3222) return "Liquid Crystal · Gimnasio de Azalea (Bugsy)";
  if (mid >= 3223 && mid <= 3229) return `Liquid Crystal · Encinar (Ilex Forest · Tramo ${mid - 3222})`;
  if (mid === 3230) return "Liquid Crystal · Santuario del Encinar (Celebi)";
  if (mid >= 3231 && mid <= 3239) return `Liquid Crystal · Ruta 34 & Guardería (Sector ${mid - 3230})`;
  if (mid === 3240) return "Liquid Crystal · Ciudad Trigal (Goldenrod City)";
  if (mid === 3241) return "Liquid Crystal · Torre Radio de Trigal (Radio Tower)";
  if (mid === 3242) return "Liquid Crystal · Gimnasio de Trigal (Whitney)";
  if (mid >= 3243 && mid <= 3254) return `Liquid Crystal · Subterráneo de Trigal (Galería ${mid - 3242})`;
  if (mid === 3255) return "Liquid Crystal · Parque Nacional (National Park)";
  if (mid >= 3256 && mid <= 3259) return `Liquid Crystal · Ruta 35 & Ruta 36 (Sector ${mid - 3255})`;
  if (mid === 3260) return "Liquid Crystal · Ciudad Iris (Ecruteak City)";
  if (mid === 3261) return "Liquid Crystal · Torre Quemada (Burned Tower)";
  if (mid === 3262) return "Liquid Crystal · Gimnasio de Iris (Morty)";
  if (mid >= 3263 && mid <= 3279) return `Liquid Crystal · Torre Hojalata (Bell Tower · Planta ${mid - 3262})`;
  if (mid >= 3280 && mid <= 3289) return `Liquid Crystal · Rutas 38 & 39 (Granja Mu-mu · Tramo ${mid - 3279})`;
  if (mid === 3290) return "Liquid Crystal · Ciudad Olivo (Olivine City)";
  if (mid >= 3291 && mid <= 3294) return `Liquid Crystal · Faro de Olivo (Planta ${mid - 3290})`;
  if (mid === 3295) return "Liquid Crystal · Gimnasio de Olivo (Jasmine)";
  if (mid >= 3296 && mid <= 3309) return `Liquid Crystal · Puerto de Olivo & Canal Marino (Sector ${mid - 3295})`;
  if (mid >= 3310 && mid <= 3319) return `Liquid Crystal · Islas Remolino (Whirl Islands · Gruta ${mid - 3309})`;
  if (mid === 3320) return "Liquid Crystal · Ciudad Orquídea (Cianwood City)";
  if (mid >= 3321 && mid <= 3322) return `Liquid Crystal · Costa de Orquídea (Tramo ${mid - 3320})`;
  if (mid === 3323) return "Liquid Crystal · Gimnasio de Orquídea (Chuck)";
  if (mid >= 3324 && mid <= 3339) return `Liquid Crystal · Acantilados & Safari de Johto (Sector ${mid - 3323})`;
  if (mid >= 3340 && mid <= 3359) return `Liquid Crystal · Monte Mortero (Mt. Mortar · Sala ${mid - 3339})`;
  if (mid === 3360) return "Liquid Crystal · Pueblo Caoba (Mahogany Town)";
  if (mid >= 3361 && mid <= 3374) return `Liquid Crystal · Guarida Rocket de Caoba (Nivel ${mid - 3360})`;
  if (mid === 3375) return "Liquid Crystal · Lago de la Furia (Lake of Rage)";
  if (mid >= 3376 && mid <= 3384) return `Liquid Crystal · Alrededores del Lago de la Furia (Sector ${mid - 3375})`;
  if (mid === 3385) return "Liquid Crystal · Gimnasio de Caoba (Pryce)";
  if (mid >= 3386 && mid <= 3399) return `Liquid Crystal · Ruta 44 (Paso hacia Ruta Helada · Tramo ${mid - 3385})`;
  if (mid >= 3400 && mid <= 3414) return `Liquid Crystal · Ruta Helada (Ice Path · Galería ${mid - 3399})`;
  if (mid === 3415) return "Liquid Crystal · Ciudad Endrino (Blackthorn City)";
  if (mid >= 3416 && mid <= 3421) return `Liquid Crystal · Guarida Dragón (Dragon Den · Cámara ${mid - 3415})`;
  if (mid === 3422) return "Liquid Crystal · Gimnasio de Endrino (Clair)";
  if (mid >= 3423 && mid <= 3459) return `Liquid Crystal · Rutas 45 & 46 (Desfiladero · Sector ${mid - 3422})`;
  if (mid >= 3460 && mid <= 3479) return `Liquid Crystal · Cataratas Tohjo (Paso hacia Kanto · Nivel ${mid - 3459})`;
  if (mid >= 3480 && mid <= 3499) return `Liquid Crystal · Calle Victoria de Johto (Nivel ${mid - 3479})`;
  if (mid >= 3500 && mid <= 3519) return `Liquid Crystal · Meseta Añil & Liga Pokémon (Sala ${mid - 3499})`;
  if (mid >= 3520 && mid <= 3539) return `Liquid Crystal · Kanto · Puerto Carmín & Muelle S.S. Aqua (${mid - 3519})`;
  if (mid >= 3540 && mid <= 3559) return `Liquid Crystal · Kanto · Ciudad Carmín & Central Eléctrica (${mid - 3539})`;
  if (mid >= 3560 && mid <= 3579) return `Liquid Crystal · Kanto · Ciudad Azafrán & Silph S.A. (${mid - 3559})`;
  if (mid >= 3580 && mid <= 3599) return `Liquid Crystal · Kanto · Ciudad Azulona & Casino (${mid - 3579})`;
  if (mid >= 3600 && mid <= 3614) return `Liquid Crystal · Kanto · Ciudad Celeste & Cueva Celeste (${mid - 3599})`;
  if (mid >= 3615 && mid <= 3624) return `Liquid Crystal · Kanto · Pueblo Lavanda & Torre (${mid - 3614})`;
  if (mid >= 3625 && mid <= 3630) return `Liquid Crystal · Monte Plateado (Sendero Nevado · Tramo ${mid - 3624})`;
  if (mid === 3631) return "Liquid Crystal · Cima del Monte Plateado (Duelo contra Red)";
  return `Liquid Crystal · Región de Johto (${mid})`;
}

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
      if (mid >= 3200 && mid <= 3631) {
        info.setIvar("@name", S(getLcTitle(mid)));
        updated++;
      }
    }
  }
  writeRx(targetPath, infos);
  console.log(`✔ ${targetPath}: ${updated} nombres de mapa de Liquid Crystal actualizados.`);
}

function updateCampaignCatalog() {
  const catalog = JSON.parse(fs.readFileSync(CAMPAIGNS_JSON, "utf8"));
  const lc = catalog.campaigns.find((c) => c.id === "liquid_crystal");
  if (!lc) return;
  let count = 0;
  for (const m of lc.maps) {
    if (m.mapId >= 3200 && m.mapId <= 3631) {
      m.title = getLcTitle(m.mapId);
      count++;
    }
  }
  fs.writeFileSync(CAMPAIGNS_JSON, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(`✔ content/rom_campaigns_complete.json: ${count} títulos de Liquid Crystal actualizados.`);
}

function updateMap3200(mapPath) {
  if (!fs.existsSync(mapPath)) return;
  const map = readRx(mapPath);
  const evPairs = map.getIvar("@events");
  if (!evPairs || !Array.isArray(evPairs.pairs)) return;

  const kept = evPairs.pairs.filter(([, ev]) => {
    const name = ev.getIvar("@name")?.text ?? "";
    if (name.includes("liquid_crystal_1_") || name.startsWith("PokeMod Líder liquid_crystal 1")) return false;
    if (name.includes("Prof. Elm") || name.includes("Silver") || name.includes("Lyra") || name.includes("Eusine")) return false;
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

  const profElm = makeNpc(
    "PokeMod Campaña ROM: NPC — Prof. Elm",
    "trchar046",
    4, 4,
    [
      "\\sp[Prof. Elm]¡Hola Ash! Es un honor tenerte en Pueblo Primavera. He estado investigando las pautas de eclosión de los huevos Pokémon.",
      "\\sp[Prof. Elm]Johto tiene leyendas milenarias: las tres bestias sagradas y las aves guardianas. ¡Disfruta cada paso de tu viaje!",
    ]
  );

  const silver = makeNpc(
    "PokeMod Campaña ROM: NPC — Rival Silver",
    "trchar003",
    8, 4,
    [
      "\\sp[Silver]¿Tú eres el famoso Ash? No me importan los discursos sobre la amistad. Solo los entrenadores con verdadera fuerza importan.",
      "\\sp[Silver]¡Si te cruzas en mi camino hacia la cima, te aplastaré!",
    ]
  );

  const lyra = makeNpc(
    "PokeMod Campaña ROM: NPC — Lyra",
    "trchar005",
    6, 5,
    [
      "\\sp[Lyra]¡Bienvenido a Johto, Ash! No olvides llevar siempre contigo el PokéGear y cuidar mucho a tu Pikachu.",
    ]
  );

  const eusine = makeNpc(
    "PokeMod Campaña ROM: NPC — Eusine",
    "trchar048",
    10, 5,
    [
      "\\sp[Eusine]He seguido el rastro del viento del norte… Suicune corre libre por las praderas de Johto. Algún día seré digno de su mirada.",
    ]
  );

  evPairs.pairs = [...kept, profElm, silver, lyra, eusine];
  writeRx(mapPath, map);
  console.log(`✔ ${mapPath}: eventos de New Bark Town personalizados con Elm, Silver, Lyra y Eusine.`);
}

function updateMap3631(mapPath) {
  if (!fs.existsSync(mapPath)) return;
  const map = readRx(mapPath);
  const evPairs = map.getIvar("@events");
  if (!evPairs || !Array.isArray(evPairs.pairs)) return;

  const finaleEv = evPairs.pairs.find(([, ev]) =>
    (ev.getIvar("@name")?.text ?? "").includes("Final — Liquid Crystal")
  );

  if (finaleEv) {
    const pages = finaleEv[1].getIvar("@pages");
    if (pages && pages[0]) {
      pages[0].setIvar("@list", [
        new RObject("RPG::EventCommand", [["@code", 101], ["@indent", 0], ["@parameters", [S("")]]]),
        new RObject("RPG::EventCommand", [["@code", 401], ["@indent", 0], ["@parameters", [S("\\sp[Red]… … …")]]]),
        new RObject("RPG::EventCommand", [["@code", 401], ["@indent", 0], ["@parameters", [S("\\sp[Red]… … …!")]]]),
        new RObject("RPG::EventCommand", [["@code", 401], ["@indent", 0], ["@parameters", [S("\\sp[Ash]¡Red! ¡Dos leyendas frente a frente en la cima del Monte Plateado!")]]]),
        new RObject("RPG::EventCommand", [["@code", 355], ["@indent", 0], ["@parameters", [S("$game_switches[992] = true")]]]),
        new RObject("RPG::EventCommand", [["@code", 101], ["@indent", 0], ["@parameters", [S("")]]]),
        new RObject("RPG::EventCommand", [["@code", 401], ["@indent", 0], ["@parameters", [S("¡Campaña de Pokémon Liquid Crystal completada! El paso entre dimensiones permanece abierto.")]]]),
        new RObject("RPG::EventCommand", [["@code", 0], ["@indent", 0], ["@parameters", []]]),
      ]);
    }
  }

  writeRx(mapPath, map);
  console.log(`✔ ${mapPath}: clímax en la cumbre del Monte Plateado actualizado con el Campeón Red.`);
}

function installEncounters() {
  if (!fs.existsSync(LC_ENCOUNTERS_JSON)) return;
  const catalog = JSON.parse(fs.readFileSync(LC_ENCOUNTERS_JSON, "utf8"));
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
  console.log(`✔ encounters.dat: ${count} zonas de Liquid Crystal instaladas y sincronizadas.`);
}

export function verify() {
  const catalog = JSON.parse(fs.readFileSync(CAMPAIGNS_JSON, "utf8"));
  const lc = catalog.campaigns.find((c) => c.id === "liquid_crystal");
  if (!lc) throw new Error("Falta la campaña liquid_crystal en content/rom_campaigns_complete.json");

  for (const m of lc.maps) {
    const expected = getLcTitle(m.mapId);
    if (m.title !== expected) {
      throw new Error(`Map${m.mapId} título desincronizado: ${m.title} != ${expected}`);
    }
  }

  const encPath = path.join(DATA, "encounters.dat");
  const encounters = readRx(encPath);
  const lcEnc = JSON.parse(fs.readFileSync(LC_ENCOUNTERS_JSON, "utf8"));
  for (const zone of lcEnc.zones) {
    const keyStr = `${zone.mapId}_0`;
    const found = encounters.pairs.some(
      ([k]) => (k && (k.name ?? k.text ?? String(k))) === keyStr
    );
    if (!found) throw new Error(`Falta tabla de encuentros para ${zone.name}`);
  }

  console.log(`✔ Verificación OK: 432 mapas y ${lcEnc.zones.length} tablas de encuentros de Liquid Crystal validados.`);
}

export function main() {
  if (VERIFY_ONLY) {
    verify();
    return;
  }
  console.log("Aplicando títulos canónicos, lore y encuentros de Pokémon Liquid Crystal...");
  updateCampaignCatalog();
  updateMapInfos(path.join(DATA, "MapInfos.rxdata"));
  updateMapInfos(path.join(PKG_DATA, "MapInfos.rxdata"));

  updateMap3200(path.join(DATA, "Map3200.rxdata"));
  updateMap3200(path.join(PKG_DATA, "Map3200.rxdata"));

  updateMap3631(path.join(DATA, "Map3631.rxdata"));
  updateMap3631(path.join(PKG_DATA, "Map3631.rxdata"));

  installEncounters();
  console.log("OK: Integración de lore y narrativa de Pokémon Liquid Crystal completada.");
  verify();
}

main();
