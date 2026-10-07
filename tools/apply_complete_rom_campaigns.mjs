#!/usr/bin/env node
/**
 * Compila las cuatro campañas ROM completas posteriores a La Ruta de Dios.
 * 807 mapas estructurales, 5.516 NPC, 3.252 warps y 1.059 entrenadores
 * adaptados al motor de Fire Ash, sin introducir assets binarios de terceros.
 */
import fs from "node:fs";
import path from "node:path";
import { marshalDump, RHash } from "../web/js/marshal.js";
import { tableGet } from "../web/js/rmxp.js";
import {
  DATA, ROOT, condition, elseBranch, endBranch, endEvent, event, graphic,
  ifScript, installMapInfos, installMetadata, installTrainers, installTrainerTypes,
  page, pagesOf, readMapRaw, script, selfSwitch, switchOn, texts, transfer, upsert,
  eventsOf, iv, makeChecker,
} from "./lib/dlc_helpers.mjs";
import { TileCanvas, buildMapObject, loadSourceMap, tilesets } from "./lib/map_painter.mjs";

const VERIFY = process.argv.includes("--verify");
const ONLY = process.argv.find((arg) => arg.startsWith("--campaign="))?.split("=")[1] ?? null;
const PLAN_PATH = path.join(ROOT, "content", "rom_campaigns_complete.json");
const PLAN = JSON.parse(fs.readFileSync(PLAN_PATH, "utf8"));
const MARKER = "PokeMod Campaña ROM:";
const BACKUP = "complete_rom_campaigns";
const BGM = {
  glazed: "DN_SnowSilver.mid",
  light_platinum: "Sinnoh Route.ogg",
  liquid_crystal: "Johto Route.ogg",
  tfoh: "Kanto Route.ogg",
};
const TEAMS = {
  glazed: ["GLACEON", "LUCARIO", "GARCHOMP", "ROTOM", "TOGEKISS", "KYUREM"],
  light_platinum: ["LUXRAY", "MILOTIC", "BRAVIARY", "VOLCARONA", "METAGROSS", "ZACIAN"],
  liquid_crystal: ["MEGANIUM", "TYPHLOSION", "FERALIGATR", "AMPHAROS", "UMBREON", "SUICUNE"],
  tfoh: ["VENUSAUR", "CHARIZARD", "BLASTOISE", "RAICHU", "DRAGONITE", "MEWTWO"],
};
const campaigns = PLAN.campaigns.filter((campaign) => !ONLY || campaign.id === ONLY);
if (!campaigns.length) throw new Error(`Campaña desconocida: ${ONLY}`);

const pad = (n) => String(n).padStart(3, "0");
const mapPath = (id) => path.join(DATA, `Map${pad(id)}.rxdata`);
const flatten = (value) => value.flat(Infinity).filter(Boolean);

function floorPalette(donorIds) {
  const passages = tilesets().get(1)?.passages?.data ?? [];
  const result = new Map();
  for (const id of donorIds) {
    const donor = loadSourceMap(id);
    const count = new Map();
    for (let y = 0; y < donor.height; y += 1) for (let x = 0; x < donor.width; x += 1) {
      const tile = tableGet(donor.table, x, y, 0);
      if (tile && (passages[tile] ?? 0) === 0) count.set(tile, (count.get(tile) ?? 0) + 1);
    }
    const floors = [...count.entries()].sort((a, b) => b[1] - a[1]).map(([tile]) => tile);
    if (!floors.length) throw new Error(`El donante Map${id} no tiene suelo transitable de tileset 1`);
    result.set(id, floors);
  }
  return { passages, result };
}

function paintMap(campaign, blueprint, palette) {
  const desiredEvents = blueprint.npcs.length + blueprint.warps.length + 5;
  const minSide = Math.ceil(Math.sqrt(desiredEvents)) + 4;
  const width = Math.max(blueprint.dimensions.width, minSide, 8);
  const height = Math.max(blueprint.dimensions.height, minSide, 8);
  const canvas = new TileCanvas(width, height, 1);
  for (let y = 0; y < height; y += 1) {
    const row = blueprint.visualRows[y % blueprint.visualRows.length];
    const donor = loadSourceMap(row.donorMapId);
    const floors = palette.result.get(row.donorMapId);
    for (let x = 0; x < width; x += 1) {
      const sx = (x + row.floorPhase) % donor.width;
      const sy = (y + blueprint.sequence + row.floorPhase) % donor.height;
      let floor = tableGet(donor.table, sx, sy, 0);
      if (!floor || (palette.passages[floor] ?? 0) !== 0) floor = floors[(x + y + row.floorPhase) % Math.min(floors.length, 12)];
      canvas.set(x, y, 0, floor);
      if ((x + row.floorPhase) % row.accentEvery === 0 && x > 1 && y > 1 && x < width - 2 && y < height - 2) {
        for (const z of [1, 2]) {
          const accent = tableGet(donor.table, sx, sy, z);
          if (accent && (palette.passages[accent] ?? 0) === 0) canvas.set(x, y, z, accent);
        }
      }
    }
  }
  return canvas;
}

function allocator(width, height) {
  const used = new Set();
  const reserve = (hx, hy) => {
    for (let radius = 0; radius < Math.max(width, height); radius += 1) {
      for (let dy = -radius; dy <= radius; dy += 1) for (let dx = -radius; dx <= radius; dx += 1) {
        const x = Math.max(1, Math.min(width - 2, hx + dx));
        const y = Math.max(1, Math.min(height - 2, hy + dy));
        const key = `${x},${y}`;
        if (!used.has(key)) { used.add(key); return [x, y]; }
      }
    }
    throw new Error(`Sin celdas para eventos en ${width}×${height}`);
  };
  return reserve;
}

function visitorEvent(name, npc, xy) {
  const gfx = graphic(`trchar${String((npc.sourceSprite % 66) + 1).padStart(3, "0")}`, 2, 1, {});
  if (!npc.trainer) return event(0, `${MARKER} NPC — ${name}`, xy[0], xy[1], [
    page({ gfx, list: [...texts(npc.dialoguePlan), endEvent()] }),
  ]);
  return event(0, `${MARKER} Entrenador — ${name}`, xy[0], xy[1], [
    page({ gfx, list: flatten([
      texts(npc.dialoguePlan),
      script(`pbTrainerIntro(:${npc.trainerType})`),
      ifScript(`pbTrainerBattle(:${npc.trainerType},"${npc.trainerName}",nil,false,0,true)`),
      texts(["Has comprendido este tramo sin apropiarte de él."], 1),
      selfSwitch("A", 0, 1),
      elseBranch(),
      texts(["Puedes reintentarlo o seguir explorando: aquí una derrota no encierra a nadie."], 1),
      endBranch(), script("pbTrainerEnd"), endEvent(),
    ]) }),
    page({ cond: condition({ self: "A" }), gfx, list: [...texts(["Nuestro combate ya forma parte del viaje. Sigue escuchando a esta dimensión."]), endEvent()] }),
  ]);
}

function navigationEvent(name, xy, target, lines, extra = []) {
  return event(0, `${MARKER} ${name}`, xy[0], xy[1], [
    page({ list: flatten([texts(lines), extra, transfer(target, 2, 2), endEvent()]) }),
  ]);
}

function finaleEvent(campaign, blueprint, xy) {
  const trainerName = `${campaign.id.toUpperCase()}_FINAL`;
  return event(0, `${MARKER} Final — ${campaign.title}`, xy[0], xy[1], [
    page({ gfx: graphic("trchar052", 2, 1, {}), list: flatten([
      texts([
        `Guardián de ${campaign.title}: Ash, has recorrido ${campaign.mapCount} lugares sin exigir que fueran tuyos.`,
        "Este combate no decide quién posee la dimensión. Decide si aprendiste a visitarla.",
      ]),
      script(`pbTrainerIntro(:${campaign.trainerType})`),
      ifScript(`pbTrainerBattle(:${campaign.trainerType},"${trainerName}",nil,false,0,true)`),
      switchOn(campaign.completeSwitch, 1),
      texts(["La campaña queda completa. Sus rutas permanecen abiertas para volver cuando quieras."], 1),
      script("pbReceiveItem(:RARECANDY)", 1), selfSwitch("A", 0, 1),
      elseBranch(), texts(["El archivo espera. Puedes curarte, volver al puerto o intentarlo otra vez."], 1), endBranch(),
      script("pbTrainerEnd"), endEvent(),
    ]) }),
    page({ cond: condition({ self: "A" }), gfx: graphic("trchar052", 2, 1, {}), list: [
      ...texts([`La experiencia de ${campaign.title} está completa, pero sus ${campaign.mapCount} mapas siguen abiertos.`]), endEvent(),
    ] }),
  ]);
}

function compileMap(campaign, blueprint, palette) {
  const canvas = paintMap(campaign, blueprint, palette);
  const raw = buildMapObject(canvas, { bgm: BGM[campaign.id], encounterStep: 25 });
  const take = allocator(canvas.width, canvas.height);
  const pairs = [];
  let id = 1;
  const add = (object) => { object.setIvar("@id", id); pairs.push([id, object]); id += 1; };

  add(navigationEvent("Retorno libre", take(1, 1), campaign.lobbyMapId,
    [`Regresar a la entrada de ${campaign.title}. El retorno nunca está condicionado.`]));
  add(navigationEvent("Tramo anterior", take(1, canvas.height - 2), blueprint.linearLinks.previous,
    [blueprint.sequence === 1 ? "Volver al embarcadero dimensional." : `Volver al tramo ${blueprint.sequence - 1}.`]));
  add(navigationEvent("Tramo siguiente", take(canvas.width - 2, canvas.height - 2), blueprint.linearLinks.next,
    [blueprint.finale ? "La ruta principal vuelve al embarcadero." : `Avanzar al tramo ${blueprint.sequence + 1} de ${campaign.mapCount}.`],
    [script(`$game_variables[${campaign.progressVariable}] = [$game_variables[${campaign.progressVariable}], ${Math.min(campaign.mapCount, blueprint.sequence + 1)}].max`)]));

  for (let i = 0; i < blueprint.warps.length; i += 1) {
    const warp = blueprint.warps[i];
    const target = warp.targetMapId ?? warp.fallbackMapId;
    add(navigationEvent(`Warp ${i + 1}`, take(warp.x, warp.y), target,
      [`Enlace reconstruido del banco ${blueprint.source.bank}, mapa ${blueprint.source.map}.`, "La geometría se adaptó a Fire Ash; el destino conserva su relación estructural."]));
  }
  for (let i = 0; i < blueprint.npcs.length; i += 1) {
    const npc = blueprint.npcs[i];
    add(visitorEvent(`${campaign.id}_${blueprint.sequence}_${i + 1}`, npc, take(npc.x, npc.y)));
  }
  if (blueprint.finale) add(finaleEvent(campaign, blueprint, take(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2))));
  raw.setIvar("@events", new RHash(pairs));
  fs.writeFileSync(mapPath(blueprint.mapId), Buffer.from(marshalDump(raw)));
  return { width: canvas.width, height: canvas.height, events: pairs.length };
}

function trainerRecords(campaign) {
  const records = [];
  const team = TEAMS[campaign.id];
  for (const map of campaign.maps) for (let i = 0; i < map.npcs.length; i += 1) {
    const npc = map.npcs[i];
    if (!npc.trainer) continue;
    npc.trainerType = campaign.trainerType;
    npc.trainerName = `${campaign.id.toUpperCase()}_${map.sequence}_${i + 1}`;
    const count = 3 + ((map.sequence + i) % 4);
    const rotated = Array.from({ length: count }, (_, k) => team[(k + map.sequence + i) % team.length]);
    records.push({ tipo: campaign.trainerType, nombre: npc.trainerName, equipo: rotated, nivel: Math.min(150, 72 + Math.floor((map.sequence / campaign.mapCount) * 70)), derrota: "Ash respetó la historia de este lugar." });
  }
  records.push({ tipo: campaign.trainerType, nombre: `${campaign.id.toUpperCase()}_FINAL`, equipo: team, nivel: 145, derrota: `La memoria de ${campaign.title} queda abierta.` });
  return records;
}

function installLobbyPortal(campaign) {
  upsert(campaign.lobbyMapId, [`${MARKER} Acceso completo — ${campaign.title}`], () => {
    const all = eventsOf(campaign.lobbyMapId);
    const occupied = new Set(all.map((entry) => `${iv(entry.obj, "@x")},${iv(entry.obj, "@y")}`));
    let x = 2, y = 2;
    while (occupied.has(`${x},${y}`)) { x += 1; if (x > 12) { x = 2; y += 1; } }
    return [event(0, `${MARKER} Acceso completo — ${campaign.title}`, x, y, [
      page({ gfx: graphic("ARCEUS_GATE", 2, 1, {}), list: [...texts(["El archivo completo permanece sellado hasta terminar La Ruta de Dios."]), endEvent()] }),
      page({ cond: condition({ sw: campaign.routeOfGodSwitch }), gfx: graphic("ARCEUS_GATE", 2, 1, {}), list: flatten([
        texts([
          `${campaign.title}: campaña completa de ${campaign.mapCount} mapas.`,
          "Ash entra como visitante. Hay retorno libre desde cada mapa y las derrotas permiten reintentar.",
        ]),
        script(`$game_variables[${campaign.progressVariable}] = [$game_variables[${campaign.progressVariable}], 1].max`),
        transfer(campaign.firstMapId, 2, 2), endEvent(),
      ]) }),
    ])];
  }, BACKUP);
}

function install() {
  const specs = [];
  const trainerTypes = [];
  const trainers = [];
  const built = [];
  for (const campaign of campaigns) {
    const palette = floorPalette(campaign.donors);
    trainerTypes.push({ id: campaign.trainerType, base: "GENTLEMAN", nombre: `${campaign.title} · Visitante` });
    trainers.push(...trainerRecords(campaign));
    for (const map of campaign.maps) {
      built.push({ campaign: campaign.id, mapId: map.mapId, ...compileMap(campaign, map, palette) });
      specs.push({ mapId: map.mapId, title: map.title, parentId: campaign.lobbyMapId, order: 950 + map.sequence });
    }
  }
  installMapInfos(specs, BACKUP);
  installMetadata(specs, BACKUP);
  installTrainerTypes(trainerTypes, BACKUP);
  const trainerResult = installTrainers(trainers, BACKUP);
  for (const campaign of campaigns) installLobbyPortal(campaign);
  console.log(`✔ Campañas ROM completas compiladas: ${built.length} mapas, ${trainers.length} entrenadores.`);
  console.log(`  · altas nuevas de entrenador: ${trainerResult.filter((r) => r.added).length}`);
  return built;
}

function verify() {
  const check = makeChecker("Campañas ROM completas");
  let maps = 0, npcs = 0, warps = 0, trainers = 0;
  for (const campaign of campaigns) {
    check.ok(campaign.routeOfGodSwitch === 876, `${campaign.title}: no exige completar La Ruta de Dios`);
    const portal = eventsOf(campaign.lobbyMapId).find((entry) => entry.name === `${MARKER} Acceso completo — ${campaign.title}`);
    check.ok(!!portal, `${campaign.title}: falta el portal de campaña en Map${campaign.lobbyMapId}`);
    if (portal) {
      const open = pagesOf(portal)[1];
      check.ok(Number(iv(open.condition, "@switch1_id")) === 876, `${campaign.title}: portal sin switch 876`);
      check.ok(open.list.some((command) => command.code === 201 && Number(command.params[1]) === campaign.firstMapId), `${campaign.title}: portal no lleva al primer mapa`);
    }
    for (const blueprint of campaign.maps) {
      maps += 1; npcs += blueprint.npcs.length; warps += blueprint.warps.length;
      trainers += blueprint.npcs.filter((npc) => npc.trainer).length;
      check.ok(fs.existsSync(mapPath(blueprint.mapId)), `${campaign.title}: falta Map${blueprint.mapId}`);
      if (!fs.existsSync(mapPath(blueprint.mapId))) continue;
      const events = eventsOf(blueprint.mapId);
      check.ok(events.some((entry) => entry.name === `${MARKER} Retorno libre`), `Map${blueprint.mapId}: falta retorno libre`);
      check.ok(events.some((entry) => entry.name === `${MARKER} Tramo siguiente`), `Map${blueprint.mapId}: falta avance lineal`);
      check.ok(events.filter((entry) => entry.name.startsWith(`${MARKER} NPC —`) || entry.name.startsWith(`${MARKER} Entrenador —`)).length === blueprint.npcs.length,
        `Map${blueprint.mapId}: NPC incompletos`);
      check.ok(events.filter((entry) => entry.name.startsWith(`${MARKER} Warp `)).length === blueprint.warps.length,
        `Map${blueprint.mapId}: warps incompletos`);
      for (const entry of events) {
        const x = Number(iv(entry.obj, "@x")), y = Number(iv(entry.obj, "@y"));
        const raw = readMapRaw(blueprint.mapId);
        check.ok(x >= 0 && y >= 0 && x < Number(iv(raw, "@width")) && y < Number(iv(raw, "@height")), `Map${blueprint.mapId}: evento fuera de límites`);
      }
    }
    const finalEvents = eventsOf(campaign.lastMapId);
    check.ok(finalEvents.some((entry) => entry.name === `${MARKER} Final — ${campaign.title}`), `${campaign.title}: falta final de campaña`);
  }
  check.ok(maps === PLAN.totals.maps, `se esperaban ${PLAN.totals.maps} mapas y hay ${maps}`);
  check.ok(npcs === PLAN.totals.npcs, `se esperaban ${PLAN.totals.npcs} NPC y hay ${npcs}`);
  check.ok(warps === PLAN.totals.warps, `se esperaban ${PLAN.totals.warps} warps y hay ${warps}`);
  check.ok(trainers > 1000, `se esperaban más de 1000 entrenadores estructurales y hay ${trainers}`);
  check.done();
  console.log(`  · ${maps} mapas · ${npcs} NPC · ${warps} warps · ${trainers} combates adaptados`);
}

if (VERIFY) verify();
else { install(); verify(); }
