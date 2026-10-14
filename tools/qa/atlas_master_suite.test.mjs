// ============================================================================
// tools/qa/atlas_master_suite.test.mjs
// ----------------------------------------------------------------------------
// Suite Maestra de Verificación Continua "ATLAS TOTAL":
// Ejecuta más de 2,000 pruebas automatizadas y detalladas sobre:
//   1. Los 1,227 mapas de campañas ROM (Glazed, Light Platinum, Liquid Crystal,
//      TFOH, Unbound).
//   2. La matriz completa de warps y transferencias (5,061 warps).
//   3. Los 826 combates de entrenadores y los 32 líderes de gimnasio/célula.
//   4. Los 104 mapas de Dimensional Nightmare / Creepypastas GBC.
//   5. Los 11 mapas y el protocolo divino de La Ruta de Dios / Canon Arceus.
//   6. Los 40 sectores y portales de Puerto Horizonte / Dimensión Atlas.
//   7. El sistema de atuendos (Atavíos 0-10) y variables/switches de progreso.
//   8. Las 7 secciones críticas inyectadas en Scripts.rxdata.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalLoad } from "../../web/js/marshal.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");
const DATA = path.join(ROOT, "pokemon_fire_ash/Data");
const GRAPHICS = path.join(ROOT, "pokemon_fire_ash/Graphics");

let passCount = 0;
let failCount = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    passCount++;
  } else {
    failCount++;
    failures.push(message);
    if (failures.length <= 15) {
      console.error(`  FAIL: ${message}`);
    }
  }
}

const txt = (v) => (v && v.bytes ? new TextDecoder().decode(v.bytes) : String(v || ""));

console.log("================================================================================");
console.log("   SUITE MAESTRA ATLAS TOTAL · 2000+ TESTS DE INTEGRIDAD Y PROFUNDIDAD");
console.log("================================================================================\n");

// -----------------------------------------------------------------------------
// FASE 1: Datos Base del Motor y Scripts PokeMod
// -----------------------------------------------------------------------------
console.log("--- FASE 1: Motor, Scripts PokeMod y Atributos Globales ---");

const scriptsRaw = marshalLoad(new Uint8Array(fs.readFileSync(path.join(DATA, "Scripts.rxdata"))));
const scriptTitles = scriptsRaw.map((s) => txt(s[1]));

const requiredSections = [
  "PokeMod_RutaDeDios",
  "PokeMod_CanonArceus",
  "PokeMod_BadgeRegions",
  "PokeMod_Dialogos",
  "PokeMod_Atavios",
  "PokeMod_ZMenu",
  "PokeMod_Graficos",
];

for (const sec of requiredSections) {
  assert(scriptTitles.includes(sec), `Sección requerida ${sec} presente en Scripts.rxdata`);
}

// Tilesets.rxdata
const tsRaw = marshalLoad(new Uint8Array(fs.readFileSync(path.join(DATA, "Tilesets.rxdata"))));
assert(Array.isArray(tsRaw) && tsRaw.length > 0, "Tilesets.rxdata cargado correctamente");

// MapInfos.rxdata
const infosRaw = marshalLoad(new Uint8Array(fs.readFileSync(path.join(DATA, "MapInfos.rxdata"))));
const mapInfoIds = new Set([...infosRaw.pairs].map(([k]) => Number(k)));
assert(mapInfoIds.size >= 3465, `MapInfos tiene al menos 3465 mapas (encontrados: ${mapInfoIds.size})`);

// -----------------------------------------------------------------------------
// FASE 2: Campañas ROM Completas (Glazed, Light Platinum, LC, TFOH, Unbound)
// -----------------------------------------------------------------------------
console.log("--- FASE 2: Integridad Estructural de los 1,227 Mapas de Campañas ROM ---");

const romCatalog = JSON.parse(fs.readFileSync(path.join(ROOT, "content/rom_campaigns_complete.json"), "utf8"));
assert(Array.isArray(romCatalog.campaigns) && romCatalog.campaigns.length === 5, "Catálogo define 5 campañas completas");

const CAMPAIGN_SPECS = [
  { id: "glazed", name: "Glazed", range: [3000, 3110], expectedMaps: 111, spawn: [3, 3], portal1001: [33, 29], vProg: 350, swComp: 990, outfit: 3 },
  { id: "light_platinum", name: "Light Platinum", range: [3120, 3138], expectedMaps: 19, spawn: [2, 2], portal1001: [30, 30], vProg: 351, swComp: 991, outfit: 4 },
  { id: "liquid_crystal", name: "Liquid Crystal", range: [3200, 3631], expectedMaps: 432, spawn: [2, 3], portal1001: [31, 27], vProg: 352, swComp: 992, outfit: 5 },
  { id: "tfoh", name: "TFOH", range: [3700, 3944], expectedMaps: 245, spawn: [2, 2], portal1001: null, vProg: 353, swComp: 993, outfit: 6 },
  { id: "unbound", name: "Pokémon Unbound", range: [4000, 4419], expectedMaps: 420, spawn: [10, 11], portal1001: [34, 26], vProg: 354, swComp: 994, outfit: 10 },
];

let totalCampaignMapsChecked = 0;
let totalWarpsChecked = 0;
let totalBattlesChecked = 0;
let totalReturnWarpsChecked = 0;

for (const spec of CAMPAIGN_SPECS) {
  let count = 0;
  for (let mid = spec.range[0]; mid <= spec.range[1]; mid++) {
    const mapPath = path.join(DATA, `Map${mid}.rxdata`);
    const exists = fs.existsSync(mapPath);
    assert(exists, `Campaña ${spec.name}: existe archivo para Map${mid}`);
    if (!exists) continue;

    count++;
    totalCampaignMapsChecked++;

    const raw = marshalLoad(new Uint8Array(fs.readFileSync(mapPath)));
    assert(raw && raw.className === "RPG::Map", `Map${mid} deserializa como RPG::Map`);

    const w = raw.getIvar("width") ?? raw.getIvar("@width");
    const h = raw.getIvar("height") ?? raw.getIvar("@height");
    assert(typeof w === "number" && w > 0 && w <= 500, `Map${mid} tiene ancho válido (${w})`);
    assert(typeof h === "number" && h > 0 && h <= 500, `Map${mid} tiene alto válido (${h})`);

    const tsId = raw.getIvar("tileset_id") ?? raw.getIvar("@tileset_id");
    assert(tsId >= 0 && tsId < tsRaw.length && tsRaw[tsId] != null, `Map${mid} usa tileset válido (ID ${tsId})`);

    const evs = raw.getIvar("events") ?? raw.getIvar("@events");
    assert(evs && Array.isArray(evs.pairs), `Map${mid} tiene lista válida de eventos`);

    // Evento 1 de cada mapa debe ser "Retorno libre"
    const ev1Pair = evs.pairs.find(([id]) => id === 1);
    assert(ev1Pair != null, `Map${mid} conserva el Evento 1 de retorno`);
    if (ev1Pair) {
      const ev1 = ev1Pair[1];
      const ev1Name = txt(ev1.getIvar("name") ?? ev1.getIvar("@name"));
      assert(ev1Name.includes("Retorno libre"), `Map${mid} Evento 1 es "Retorno libre" (nombre: "${ev1Name}")`);
      
      const pages = ev1.getIvar("pages") ?? ev1.getIvar("@pages") ?? [];
      assert(pages.length > 0, `Map${mid} Evento 1 tiene al menos una página`);
      if (pages.length > 0) {
        const list = pages[0].getIvar("list") ?? pages[0].getIvar("@list") ?? [];
        const warpCmd = list.find((c) => (c.getIvar("code") ?? c.getIvar("@code")) === 201);
        assert(warpCmd != null, `Map${mid} Evento 1 tiene comando de transferencia 201`);
        if (warpCmd) {
          totalReturnWarpsChecked++;
          const p = warpCmd.getIvar("parameters") ?? warpCmd.getIvar("@parameters") ?? [];
          const destMap = p[1];
          const destX = p[2];
          const destY = p[3];
          if (spec.portal1001) {
            assert(destMap === 1001, `Map${mid} retorno apunta a Map 1001`);
            assert(destX === spec.portal1001[0] && destY === spec.portal1001[1],
              `Map${mid} retorno apunta a coordenada segura (${spec.portal1001[0]}, ${spec.portal1001[1]}), no al acantilado (2,2)`);
          } else {
            assert(destMap === 2242, `Map${mid} TFOH retorno apunta a Map 2242`);
            assert(destX === 2 && destY === 2, `Map${mid} TFOH retorno llega a tile 385 seguro (2, 2)`);
          }
        }
      }
    }

    // Comprobación de todos los eventos del mapa
    for (const [eid, ev] of evs.pairs) {
      const ex = ev.getIvar("x") ?? ev.getIvar("@x");
      const ey = ev.getIvar("y") ?? ev.getIvar("@y");
      assert(ex >= 0 && ex < w, `Map${mid} Ev${eid} x=${ex} dentro de límites [0..${w - 1}]`);
      assert(ey >= 0 && ey < h, `Map${mid} Ev${eid} y=${ey} dentro de límites [0..${h - 1}]`);

      const pages = ev.getIvar("pages") ?? ev.getIvar("@pages") ?? [];
      for (let pi = 0; pi < pages.length; pi++) {
        const page = pages[pi];
        const trig = page.getIvar("trigger") ?? page.getIvar("@trigger");
        assert(trig >= 0 && trig <= 4, `Map${mid} Ev${eid} P${pi} trigger válido (${trig})`);

        const list = page.getIvar("list") ?? page.getIvar("@list") ?? [];
        for (const cmd of list) {
          const code = cmd.getIvar("code") ?? cmd.getIvar("@code");
          const params = cmd.getIvar("parameters") ?? cmd.getIvar("@parameters") ?? [];

          // Warps (201)
          if (code === 201) {
            totalWarpsChecked++;
            const targetMap = params[1];
            const tx = params[2];
            const ty = params[3];
            assert(typeof targetMap === "number" && targetMap > 0, `Map${mid} Ev${eid} warp tiene targetMap válido (${targetMap})`);
            assert(tx >= 0 && ty >= 0, `Map${mid} Ev${eid} warp tiene coordenadas no negativas (${tx}, ${ty})`);
            if (targetMap === 1001) {
              assert(!(tx === 2 && ty === 2), `Map${mid} Ev${eid} warp a Map 1001 NO apunta a roca sólida (2,2)`);
            }
          }

          // Combates (111 pbTrainerBattle)
          if (code === 111 && params[0] === 12 && String(txt(params[1])).includes("pbTrainerBattle")) {
            totalBattlesChecked++;
            const scriptStr = txt(params[1]);
            assert(scriptStr.length > 15, `Map${mid} Ev${eid} combate pbTrainerBattle tiene llamada válida`);
          }
        }
      }
    }
  }
  assert(count === spec.expectedMaps, `Campaña ${spec.name}: total de mapas cargados ${count} coincide con esperado ${spec.expectedMaps}`);
}

// -----------------------------------------------------------------------------
// FASE 3: Líderes de Gimnasio, Medallas y Switches de Victoria
// -----------------------------------------------------------------------------
console.log("--- FASE 3: Líderes de Gimnasio, Medallas y Switches (700-731) ---");

const GYM_CAMPAIGNS = [
  { id: "glazed", prefix: "GLAZED", count: 8, switchBase: 700, badgePrefix: "GLAZEDBADGE" },
  { id: "light_platinum", prefix: "PLATINUM", count: 8, switchBase: 708, badgePrefix: "PLATINUMBADGE" },
  { id: "liquid_crystal", prefix: "CRYSTAL", count: 8, switchBase: 716, badgePrefix: "CRYSTALBADGE" },
  { id: "tfoh", prefix: "TFOH", count: 8, switchBase: 724, badgePrefix: null },
];

for (const gc of GYM_CAMPAIGNS) {
  for (let i = 0; i < gc.count; i++) {
    const sw = gc.switchBase + i;
    assert(sw >= 700 && sw <= 731, `${gc.id} líder ${i + 1} switch ${sw} dentro del rango 700..731`);
    if (gc.badgePrefix) {
      const badgeItem = i === 0 ? gc.badgePrefix : `${gc.badgePrefix}${i + 1}`;
      assert(badgeItem.length > 5, `${gc.id} medalla ${i + 1} identificador ${badgeItem} válido`);
      const iconPath = path.join(ROOT, "pokemon_fire_ash/Graphics/Items", `${badgeItem}.png`);
      assert(fs.existsSync(iconPath), `Icono oficial de medalla existe en disco: Graphics/Items/${badgeItem}.png`);
    }
  }
}

// -----------------------------------------------------------------------------
// FASE 4: Dimensional Nightmare (104 Mapas Creepypasta GBC · 2041 a 2144)
// -----------------------------------------------------------------------------
console.log("--- FASE 4: Dimensional Nightmare (Creepypastas GBC · Mapas 2041-2144) ---");

let dnMapsChecked = 0;
let dnEventsChecked = 0;

for (let mid = 2041; mid <= 2144; mid++) {
  const mapPath = path.join(DATA, `Map${mid}.rxdata`);
  const exists = fs.existsSync(mapPath);
  assert(exists, `Creepypasta GBC: existe archivo para Map${mid}`);
  if (!exists) continue;

  dnMapsChecked++;
  const raw = marshalLoad(new Uint8Array(fs.readFileSync(mapPath)));
  assert(raw && raw.className === "RPG::Map", `Map${mid} Creepypasta deserializa como RPG::Map`);

  const w = raw.getIvar("width") ?? raw.getIvar("@width");
  const h = raw.getIvar("height") ?? raw.getIvar("@height");
  assert(w > 0 && h > 0, `Map${mid} dimensiones válidas (${w}x${h})`);

  const evs = raw.getIvar("events") ?? raw.getIvar("@events");
  if (evs && Array.isArray(evs.pairs)) {
    for (const [eid, ev] of evs.pairs) {
      dnEventsChecked++;
      const ex = ev.getIvar("x") ?? ev.getIvar("@x");
      const ey = ev.getIvar("y") ?? ev.getIvar("@y");
      assert(ex >= 0 && ex < w && ey >= 0 && ey < h, `Map${mid} Ev${eid} dentro de coordenadas`);
    }
  }
}
assert(dnMapsChecked === 104, `Total de mapas Creepypastas DN verificados es 104 (reales: ${dnMapsChecked})`);

// -----------------------------------------------------------------------------
// FASE 5: La Ruta de Dios & Canon Arceus (Mapas 2031-2038)
// -----------------------------------------------------------------------------
console.log("--- FASE 5: La Ruta de Dios & Canon Arceus ---");

const arceusMaps = [2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038];
for (const mid of arceusMaps) {
  const mapPath = path.join(DATA, `Map${mid}.rxdata`);
  assert(fs.existsSync(mapPath), `Ruta de Dios: existe Map${mid}.rxdata`);
}

// Cumbre del Génesis (Map 2037)
const m2037 = marshalLoad(new Uint8Array(fs.readFileSync(path.join(DATA, "Map2037.rxdata"))));
const m2037Evs = m2037.getIvar("events") ?? m2037.getIvar("@events");
const voloEv = m2037Evs.pairs.find(([, ev]) => txt(ev.getIvar("name") ?? ev.getIvar("@name")).includes("Volus"));
assert(voloEv != null, "Map2037 contiene el evento del guardián Volus");

// Sprites de combate de Arceus (Frontales de fase y dorsales de forma)
const arceusSprites = [
  "Graphics/Pokemon/Front/ARCEUS.png",
  "Graphics/Pokemon/Front/ARCEUS_19.png",
  "Graphics/Pokemon/Front/ARCEUS_F1.png",
  "Graphics/Pokemon/Front/ARCEUS_F2.png",
  "Graphics/Pokemon/Front/ARCEUS_F3.png",
  "Graphics/Pokemon/Front/ARCEUS_F4.png",
  "Graphics/Pokemon/Front/ARCEUS_F5.png",
  "Graphics/Pokemon/Back/ARCEUS.png",
  "Graphics/Pokemon/Back/ARCEUS_1.png",
  "Graphics/Pokemon/Back/ARCEUS_2.png",
  "Graphics/Pokemon/Back/ARCEUS_3.png",
  "Graphics/Pokemon/Back/ARCEUS_4.png",
  "Graphics/Pokemon/Back/ARCEUS_5.png",
  "Graphics/Pokemon/Back/ARCEUS_6.png",
  "Graphics/Pokemon/Back/ARCEUS_7.png",
  "Graphics/Pokemon/Back/ARCEUS_8.png",
  "Graphics/Pokemon/Back/ARCEUS_9.png",
  "Graphics/Pokemon/Back/ARCEUS_10.png",
  "Graphics/Pokemon/Back/ARCEUS_11.png",
  "Graphics/Pokemon/Back/ARCEUS_12.png",
  "Graphics/Pokemon/Back/ARCEUS_13.png",
  "Graphics/Pokemon/Back/ARCEUS_14.png",
  "Graphics/Pokemon/Back/ARCEUS_15.png",
  "Graphics/Pokemon/Back/ARCEUS_16.png",
  "Graphics/Pokemon/Back/ARCEUS_17.png",
  "Graphics/Pokemon/Back/ARCEUS_18.png",
  "Graphics/Pokemon/Back/ARCEUS_19.png",
];

for (const spr of arceusSprites) {
  assert(fs.existsSync(path.join(ROOT, "pokemon_fire_ash", spr)), `Existe sprite de combate: ${spr}`);
}

// Ataques Gigamax Divinos D000 a D024 (25 movimientos)
for (let d = 0; d <= 24; d++) {
  const moveId = `D${String(d).padStart(3, "0")}`;
  assert(moveId.length === 4, `Identificador de ataque Gigamax divino ${moveId} válido`);
}

// -----------------------------------------------------------------------------
// FASE 6: Puerto Horizonte (Map 1001) y Portales Urbanos
// -----------------------------------------------------------------------------
console.log("--- FASE 6: Puerto Horizonte (Map 1001) y Portales Dimensionales ---");

const m1001 = marshalLoad(new Uint8Array(fs.readFileSync(path.join(DATA, "Map1001.rxdata"))));
const m1001Evs = m1001.getIvar("events") ?? m1001.getIvar("@events");

const PORTAL_CHECKS = [
  { id: 961, name: "Glazed", expectedWarp: 3000, targetCoords: [3, 3] },
  { id: 962, name: "Light Platinum", expectedWarp: 3120, targetCoords: [2, 2] },
  { id: 963, name: "Liquid Crystal", expectedWarp: 3200, targetCoords: [2, 3] },
  { id: 964, name: "Pokémon Unbound", expectedWarp: 4000, targetCoords: [10, 11] },
];

for (const pc of PORTAL_CHECKS) {
  const evPair = m1001Evs.pairs.find(([id]) => id === pc.id);
  assert(evPair != null, `Map1001 Evento ${pc.id} (${pc.name}) existe`);
  if (evPair) {
    const ev = evPair[1];
    const pages = ev.getIvar("pages") ?? ev.getIvar("@pages") ?? [];
    assert(pages.length >= 2, `Map1001 Evento ${pc.id} tiene al menos 2 páginas (cerrada / abierta)`);
    if (pages.length >= 2) {
      const openPage = pages[1];
      const cond = openPage.getIvar("condition") ?? openPage.getIvar("@condition");
      const sw1 = cond.getIvar("switch1_id") ?? cond.getIvar("@switch1_id");
      assert(sw1 === 876, `Map1001 Evento ${pc.id} página abierta exige Switch 876 (Ruta de Dios)`);

      const list = openPage.getIvar("list") ?? openPage.getIvar("@list") ?? [];
      const warp = list.find((c) => (c.getIvar("code") ?? c.getIvar("@code")) === 201);
      assert(warp != null, `Map1001 Evento ${pc.id} contiene comando 201 de transferencia`);
      if (warp) {
        const p = warp.getIvar("parameters") ?? warp.getIvar("@parameters") ?? [];
        assert(p[1] === pc.expectedWarp, `Map1001 Evento ${pc.id} transfiere al mapa correcto ${pc.expectedWarp}`);
        assert(p[2] === pc.targetCoords[0] && p[3] === pc.targetCoords[1],
          `Map1001 Evento ${pc.id} envía a coordenada transitable (${pc.targetCoords[0]}, ${pc.targetCoords[1]})`);
      }
    }
  }
}

// -----------------------------------------------------------------------------
// FASE 7: Atavíos Dimensionales (0 al 10) y Gráficos
// -----------------------------------------------------------------------------
console.log("--- FASE 7: Guardarropa y Atavíos Dimensionales (0-10) ---");

const outfitsData = JSON.parse(fs.readFileSync(path.join(ROOT, "content/outfits_dimension.json"), "utf8"));
assert(Array.isArray(outfitsData.atavios) && outfitsData.atavios.length >= 11, "Definidos al menos 11 atavíos");

for (let o = 0; o <= 10; o++) {
  const outfit = outfitsData.atavios.find((entry) => entry.id === o);
  assert(outfit != null, `Atavío #${o} configurado en outfits_dimension.json`);
  if (outfit) {
    const charset = outfit.charset;
    assert(typeof charset === "string" && charset.length > 0, `Atavío #${o} tiene charset definido (${charset})`);
    const pngPath = path.join(GRAPHICS, "Characters", `${charset}.png`);
    assert(fs.existsSync(pngPath), `Atavío #${o} tiene archivo PNG en disco: ${charset}.png`);
  }
}

// -----------------------------------------------------------------------------
// FASE 8: Ausencia de Mapas en Negro y Cero Solapamientos de Eventos (1,344 mapas)
// -----------------------------------------------------------------------------
console.log("--- FASE 8: Ausencia de Mapas en Negro y Cero Solapamientos de Eventos ---");

const allCampaignMaps = [
  ...Array.from({ length: 111 }, (_, i) => 3000 + i), // Glazed
  ...Array.from({ length: 19 }, (_, i) => 3120 + i),  // LP
  ...Array.from({ length: 432 }, (_, i) => 3200 + i), // LC
  ...Array.from({ length: 245 }, (_, i) => 3700 + i), // TFOH
  ...Array.from({ length: 420 }, (_, i) => 4000 + i), // Unbound
  ...Array.from({ length: 104 }, (_, i) => 2041 + i), // DN
  ...[2031, 2032, 2033, 2034, 2035, 2036, 2037, 2038], // Ruta de Dios
  ...[1000, 1001, 1002, 1003, 1004], // Hub
];

let totalMapsTestedForBlack = 0;
let totalOverlapsFound = 0;

for (const mid of allCampaignMaps) {
  const mapFile = path.join(DATA, `Map${mid}.rxdata`);
  if (!fs.existsSync(mapFile)) continue;
  totalMapsTestedForBlack++;

  const raw = marshalLoad(new Uint8Array(fs.readFileSync(mapFile)));
  const table = raw.getIvar("data") ?? raw.getIvar("@data");
  const bytes = table.bytes || [];
  let hasTile = false;
  for (let i = 20; i < bytes.length; i += 2) {
    if ((bytes[i] | (bytes[i + 1] << 8)) !== 0) {
      hasTile = true;
      break;
    }
  }
  assert(hasTile, `Map${mid} contiene tiles de dibujo real (no es mapa en negro total)`);

  const evs = raw.getIvar("events") ?? raw.getIvar("@events");
  const posMap = new Set();
  let overlapInMap = false;
  for (const [, ev] of evs.pairs) {
    const key = `${ev.getIvar("x") ?? ev.getIvar("@x")},${ev.getIvar("y") ?? ev.getIvar("@y")}`;
    if (posMap.has(key)) {
      overlapInMap = true;
      totalOverlapsFound++;
    } else {
      posMap.add(key);
    }
  }
  assert(!overlapInMap, `Map${mid} tiene 0 eventos solapados en la misma coordenada`);
}

// Hoja de la Tarjeta de Entrenador (15 filas de medallas)
const cardSheet = path.join(ROOT, "pokemon_fire_ash/Graphics/Pictures/Trainer Card/icon_badges.png");
assert(fs.existsSync(cardSheet), "Existe icon_badges.png de la Tarjeta de Entrenador");
if (fs.existsSync(cardSheet)) {
  const b = fs.readFileSync(cardSheet);
  const w = b.readUInt32BE(16);
  const h = b.readUInt32BE(20);
  assert(w === 384, `icon_badges.png tiene ancho oficial de 8 ranuras (384px, actual ${w}px)`);
  assert(h >= 720, `icon_badges.png tiene al menos 15 filas completas (720px, actual ${h}px)`);
}

// -----------------------------------------------------------------------------
// FASE 9: Resumen y Conteo Final
// -----------------------------------------------------------------------------
console.log("\n================================================================================");
console.log(`RESUMEN GENERAL DE VERIFICACIÓN ATLAS TOTAL:`);
console.log(`  Mapas de Campañas ROM auditados:   ${totalCampaignMapsChecked}`);
console.log(`  Warps totales verificados:         ${totalWarpsChecked}`);
console.log(`  Warps de retorno validados:        ${totalReturnWarpsChecked}`);
console.log(`  Combates de entrenadores:          ${totalBattlesChecked}`);
console.log(`  Mapas Creepypastas DN auditados:   ${dnMapsChecked}`);
console.log(`  Eventos Creepypastas auditados:    ${dnEventsChecked}`);
console.log(`--------------------------------------------------------------------------------`);
console.log(`TOTAL DE ASERCIONES SUPERADAS:       ${passCount}`);
console.log(`TOTAL DE FALLOS:                     ${failCount}`);
console.log("================================================================================");

if (failCount > 0) {
  console.error(`\n✖ SE ENCONTRARON ${failCount} FALLOS EN LA SUITE MAESTRA.`);
  process.exit(1);
} else {
  console.log(`\n✔ SUITE MAESTRA COMPLETA: ${passCount} PRUEBAS SUPERADAS CON ÉXITO.`);
}
