#!/usr/bin/env node
/**
 * Compila planos estructurales de campañas de ROM como prototipos adaptados a
 * Fire Ash. No emula las ROM ni copia sus mapas, diálogos o recursos binarios.
 * Glazed, Light Platinum, Liquid Crystal y Pokémon Unbound ponen a Ash como
 * protagonista; TFOH conserva el tratamiento de visitante ya existente.
 */
import fs from "node:fs";
import path from "node:path";
import { marshalDump, RHash } from "../web/js/marshal.js";
import { tableGet } from "../web/js/rmxp.js";
import {
  DATA, ROOT, backup, condition, elseBranch, endBranch, endEvent, event, graphic,
  ifScript, installMapInfos, installMetadata, installTrainerTypes, installTrainers,
  page, pagesOf, readData, readMapRaw, script, selfSwitch, switchOn, texts, transfer,
  upsert, eventsOf, iv, makeChecker, wait, writeData, S, txt, grid, walkableAt,
} from "./lib/dlc_helpers.mjs";
import { TileCanvas, buildMapObject, loadSourceMap, tilesets } from "./lib/map_painter.mjs";

const VERIFY = process.argv.includes("--verify");
const ONLY = process.argv.find((arg) => arg.startsWith("--campaign="))?.split("=")[1] ?? null;
const PLAN_PATH = path.join(ROOT, "content", "rom_campaigns_complete.json");
const PLAN = JSON.parse(fs.readFileSync(PLAN_PATH, "utf8"));
const MARKER = "PokeMod Campaña ROM:";
const BACKUP = "complete_rom_campaigns";
const MAIN_CITY_MAP = 1001;
const LEAGUE_MAP = 643;
const GUIDE_NAME = `${MARKER} Cynthia — Guía de la fragmentación`;
const NORMAL_CAMPAIGNS = new Set(["glazed", "light_platinum", "liquid_crystal", "unbound"]);
const FIRST_MAP_SPAWN = {
  glazed: { x: 3, y: 3 },
  light_platinum: { x: 2, y: 2 },
  liquid_crystal: { x: 2, y: 3 },
  tfoh: { x: 2, y: 2 },
  unbound: { x: 10, y: 11 },
};
const BGM = {
  glazed: "Sinnoh Route.ogg",
  light_platinum: "Sinnoh Route.ogg",
  liquid_crystal: "Johto Route.ogg",
  tfoh: "Kanto Route.ogg",
  unbound: "Kanto Route.ogg",
};
const TEAMS = {
  glazed: ["GLACEON", "LUCARIO", "GARCHOMP", "ROTOM", "TOGEKISS", "KYUREM"],
  light_platinum: ["LUXRAY", "MILOTIC", "BRAVIARY", "VOLCARONA", "METAGROSS", "ZACIAN"],
  liquid_crystal: ["MEGANIUM", "TYPHLOSION", "FERALIGATR", "AMPHAROS", "UMBREON", "SUICUNE"],
  tfoh: ["VENUSAUR", "CHARIZARD", "BLASTOISE", "RAICHU", "DRAGONITE", "MEWTWO"],
  unbound: ["EMPOLEON", "LUCARIO", "GARCHOMP", "METAGROSS", "TOGEKISS", "ZOROARK"],
};
const campaigns = PLAN.campaigns.filter((campaign) => !ONLY || campaign.id === ONLY);
if (!campaigns.length) throw new Error(`Campaña desconocida: ${ONLY}`);

const pad = (n) => String(n).padStart(3, "0");
const mapPath = (id) => path.join(DATA, `Map${pad(id)}.rxdata`);
const flatten = (value) => value.flat(Infinity).filter(Boolean);
const returnMap = (campaign) => Number(campaign.returnMapId ?? campaign.lobbyMapId);
const isAshProtagonist = (campaign) => campaign.playerRole === "ash_protagonist";

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
  const desiredEvents = blueprint.npcs.length + blueprint.warps.length + 6;
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

function visitorEvent(campaign, name, npc, xy) {
  const gfx = graphic(`trchar${String((npc.sourceSprite % 66) + 1).padStart(3, "0")}`, 2, 1, {});
  if (!npc.trainer) return event(0, `${MARKER} NPC — ${name}`, xy[0], xy[1], [
    page({ gfx, list: [...texts(npc.dialoguePlan), endEvent()] }),
  ]);
  const winLines = isAshProtagonist(campaign)
    ? ["Ash: ¡Buena batalla! Me gusta que podamos seguir viajando después de medir fuerzas."]
    : ["Has comprendido este tramo sin apropiarte de él."];
  return event(0, `${MARKER} Entrenador — ${name}`, xy[0], xy[1], [
    page({ gfx, list: flatten([
      texts(npc.dialoguePlan),
      script(`pbTrainerIntro(:${npc.trainerType})`),
      ifScript(`pbTrainerBattle(:${npc.trainerType},"${npc.trainerName}",nil,false,0,true)`),
      texts(winLines, 1),
      selfSwitch("A", 0, 1),
      elseBranch(),
      texts(["Puedes reintentarlo o seguir explorando: aquí una derrota no encierra a nadie."], 1),
      endBranch(), script("pbTrainerEnd"), endEvent(),
    ]) }),
    page({ cond: condition({ self: "A" }), gfx, list: [...texts(["Nuestro combate ya forma parte del viaje. Sigue escuchando a esta dimensión."]), endEvent()] }),
  ]);
}

function navigationEvent(name, xy, target, lines, extra = [], targetX = 2, targetY = 2) {
  return event(0, `${MARKER} ${name}`, xy[0], xy[1], [
    page({ list: flatten([texts(lines), extra, transfer(target, targetX, targetY), endEvent()]) }),
  ]);
}

function finaleEvent(campaign, xy) {
  const trainerName = `${campaign.id.toUpperCase()}_FINAL`;
  const opening = isAshProtagonist(campaign)
    ? "Guardián: Ash, ya formas parte de esta historia sin dejar de ser tú. Tu manera de ayudar también cuenta."
    : `Guardián de ${campaign.title}: Ash, has recorrido este lugar sin exigir que te pertenezca.`;
  return event(0, `${MARKER} Final — ${campaign.title}`, xy[0], xy[1], [
    page({ gfx: graphic("trchar052", 2, 1, {}), list: flatten([
      texts([opening, "Este combate no decide quién posee la dimensión; decide qué aprendiste al escucharla."]),
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

  // El acceso desde los portales aterriza siempre en una celda vacía y transitable.
  take(2, 2);
  const returnedTo = returnMap(campaign);
  const portalX = campaign.cityPortal ? campaign.cityPortal.x : 34;
  const portalY = campaign.cityPortal ? campaign.cityPortal.y + 1 : 23;
  add(navigationEvent("Retorno libre", take(1, 1), returnedTo,
    [`Regresar a ${campaign.cityName ?? "Puerto Horizonte"}. El retorno nunca está condicionado.`], [],
    returnedTo === MAIN_CITY_MAP ? portalX : 2,
    returnedTo === MAIN_CITY_MAP ? portalY : 2));
  add(navigationEvent("Tramo anterior", take(1, canvas.height - 2), blueprint.linearLinks.previous,
    [blueprint.sequence === 1 ? "Volver a Puerto Horizonte." : `Volver al tramo ${blueprint.sequence - 1}.`], [],
    blueprint.linearLinks.previous === MAIN_CITY_MAP ? portalX : 2,
    blueprint.linearLinks.previous === MAIN_CITY_MAP ? portalY : 2));
  add(navigationEvent("Tramo siguiente", take(canvas.width - 2, canvas.height - 2), blueprint.linearLinks.next,
    [blueprint.finale ? "La ruta principal vuelve a Puerto Horizonte." : `Avanzar al tramo ${blueprint.sequence + 1} de ${campaign.mapCount}.`],
    [script(`$game_variables[${campaign.progressVariable}] = [$game_variables[${campaign.progressVariable}], ${Math.min(campaign.mapCount, blueprint.sequence + 1)}].max`)],
    blueprint.linearLinks.next === MAIN_CITY_MAP ? portalX : 2,
    blueprint.linearLinks.next === MAIN_CITY_MAP ? portalY : 2));

  for (let i = 0; i < blueprint.warps.length; i += 1) {
    const warp = blueprint.warps[i];
    const target = warp.targetMapId ?? warp.fallbackMapId;
    add(navigationEvent(`Warp ${i + 1}`, take(warp.x, warp.y), target,
      [`Enlace reconstruido del banco ${blueprint.source.bank}, mapa ${blueprint.source.map}.`, "La geometría se adaptó a Fire Ash; el destino conserva su relación estructural."]));
  }
  for (let i = 0; i < blueprint.npcs.length; i += 1) {
    const npc = blueprint.npcs[i];
    add(visitorEvent(campaign, `${campaign.id}_${blueprint.sequence}_${i + 1}`, npc, take(npc.x, npc.y)));
  }
  if (blueprint.finale) add(finaleEvent(campaign, take(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2))));
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
  if (campaign.legacyLobbyEnabled === false || campaign.lobbyMapId === MAIN_CITY_MAP) return;
  upsert(campaign.lobbyMapId, [`${MARKER} Acceso completo — ${campaign.title}`], () => {
    const all = eventsOf(campaign.lobbyMapId);
    const occupied = new Set(all.map((entry) => `${iv(entry.obj, "@x")},${iv(entry.obj, "@y")}`));
    let x = 2, y = 2;
    while (occupied.has(`${x},${y}`)) { x += 1; if (x > 12) { x = 2; y += 1; } }
    const roleText = isAshProtagonist(campaign)
      ? "Ash cruza como protagonista de una historia propia; conserva su carácter y decide cómo ayudar."
      : "Ash entra como visitante. Hay retorno libre desde cada mapa y las derrotas permiten reintentar.";
    const spawn = FIRST_MAP_SPAWN[campaign.id] ?? { x: 2, y: 2 };
    return [event(0, `${MARKER} Acceso completo — ${campaign.title}`, x, y, [
      page({ gfx: graphic("ARCEUS_GATE", 2, 1, {}), list: [...texts(["El archivo completo permanece sellado hasta terminar La Ruta de Dios."]), endEvent()] }),
      page({ cond: condition({ sw: campaign.routeOfGodSwitch }), gfx: graphic("ARCEUS_GATE", 2, 1, {}), list: flatten([
        texts([`${campaign.title}: adaptación estructural de ${campaign.mapCount} mapas.`, roleText]),
        script(`$game_variables[${campaign.progressVariable}] = [$game_variables[${campaign.progressVariable}], 1].max`),
        transfer(campaign.firstMapId, spawn.x, spawn.y), endEvent(),
      ]) }),
    ])];
  }, BACKUP);
}

function cityPortalEvent(campaign) {
  const { x, y } = campaign.cityPortal;
  const spawn = FIRST_MAP_SPAWN[campaign.id] ?? { x: 2, y: 2 };
  const intro = {
    glazed: "Dos caminos de vida se rozan en Glazed; Ash conocerá a quienes sostienen cada uno.",
    light_platinum: "Light Platinum abre rutas nuevas y una liga viajera, con sus propios compañeros y rivales.",
    liquid_crystal: "Liquid Crystal guarda una historia de Johto, sus recuerdos, sus faros y sus vínculos.",
    unbound: "Pokémon Unbound cuenta una historia de frontera, decisiones difíciles y gente que protege su hogar.",
  }[campaign.id] ?? `${campaign.title} tiene una historia propia.`;
  return event(0, `${MARKER} Portal de Puerto Horizonte — ${campaign.title}`, x, y, [
    page({ gfx: graphic("ARCEUS_GATE", 2, 1, {}), list: [
      ...texts(["La grieta sigue dormida. Cynthia dijo que sólo respondería después de completar La Ruta de Dios."]), endEvent(),
    ] }),
    page({ cond: condition({ sw: campaign.routeOfGodSwitch }), gfx: graphic("ARCEUS_GATE", 2, 1, {}), list: flatten([
      texts([`${campaign.title}: ${intro}`, "Ash: No necesito convertirme en otra persona para vivir esta aventura. ¡Pikachu, vamos!", "¿Cruzar el portal y volver a Puerto Horizonte cuando quieras?" ]),
      script(`$game_variables[${campaign.progressVariable}] = [$game_variables[${campaign.progressVariable}], 1].max`),
      transfer(campaign.firstMapId, spawn.x, spawn.y), endEvent(),
    ]) }),
  ]);
}

function installCityPortals() {
  const cityCampaigns = campaigns.filter((campaign) => NORMAL_CAMPAIGNS.has(campaign.id) && campaign.cityPortal);
  const prefixes = cityCampaigns.map((campaign) => `${MARKER} Portal de Puerto Horizonte — ${campaign.title}`);
  upsert(MAIN_CITY_MAP, prefixes, () => cityCampaigns.map(cityPortalEvent), BACKUP);
}

function installCynthiaGuide() {
  upsert(LEAGUE_MAP, [GUIDE_NAME], () => [event(0, GUIDE_NAME, 18, 12, [
    page({ gfx: graphic("trchar198", 2, 1, {}), list: flatten([
      texts([
        "Cynthia: Ash, lo que sientes es la fragmentación: las rutas entre mundos se han separado, no desaparecido.",
        "Cada mundo conserva su gente, sus decisiones y una historia que ya estaba en marcha antes de nuestra llegada.",
      ]),
      wait(18),
      texts(["Ash: Entonces no vamos a tratar esos lugares como escenarios vacíos. Vamos a conocerlos y ayudar si hace falta."], 1),
      wait(14),
      texts([
        "Cynthia: En Puerto Horizonte, busca la plaza de portales justo al este y sudeste del portal Atlas. Los cuatro arcos tienen su nombre.",
        "Liquid Crystal: el arco más cercano al portal Atlas; su camino conduce a una historia propia de Johto.",
        "Light Platinum: el arco situado más al sur; allí te esperan rutas nuevas y una liga itinerante.",
        "Glazed: el arco del sudeste, algo más apartado; sus dos caminos guardan recuerdos distintos.",
        "Pokémon Unbound: el arco del extremo oriental; su región fronteriza tiene dilemas e historias propias.",
        "Las cuatro entradas se activan al completar La Ruta de Dios. Desde cualquier mundo puedes volver libremente a Puerto Horizonte.",
      ]),
      wait(12),
      selfSwitch("A", 0), endEvent(),
    ]) }),
    page({ cond: condition({ self: "A" }), gfx: graphic("trchar198", 2, 1, {}), list: flatten([
      texts([
        "Cynthia: Recuerda, Ash: no tienes que dejar de ser tú para formar parte de otra historia.",
        "Los cuatro portales de Puerto Horizonte, junto al este del portal Atlas, conservan el nombre de su mundo y un regreso abierto.",
      ]),
      endEvent(),
    ]) }),
  ])], BACKUP);
}

function installCampaignNames() {
  backup(BACKUP, ["System.rxdata"]);
  const system = readData("System.rxdata");
  const switches = iv(system, "switches") ?? [];
  const variables = iv(system, "variables") ?? [];
  for (const campaign of campaigns) {
    switches[campaign.completeSwitch] = S(`POKEMOD ${campaign.id.toUpperCase()} COMPLETADA`);
    variables[campaign.progressVariable] = S(`POKEMOD ${campaign.id.toUpperCase()} PROGRESO`);
  }
  system.setIvar("switches", switches);
  system.setIvar("variables", variables);
  writeData("System.rxdata", system);
}

function install() {
  const specs = [];
  const trainerTypes = [];
  const trainers = [];
  const built = [];
  for (const campaign of campaigns) {
    const palette = floorPalette(campaign.donors);
    const roleName = isAshProtagonist(campaign) ? "Ash · protagonista" : "Ash · visitante";
    trainerTypes.push({ id: campaign.trainerType, base: "GENTLEMAN", nombre: `${campaign.title} · ${roleName}` });
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
  installCampaignNames();
  for (const campaign of campaigns) installLobbyPortal(campaign);
  if (campaigns.some((campaign) => NORMAL_CAMPAIGNS.has(campaign.id))) {
    installCityPortals();
    installCynthiaGuide();
  }
  console.log(`✔ Prototipos estructurales compilados: ${built.length} mapas, ${trainers.length} entrenadores adaptados.`);
  console.log(`  · altas nuevas de entrenador: ${trainerResult.filter((r) => r.added).length}`);
  return built;
}

function verify() {
  const check = makeChecker("Integración estructural de campañas invitadas");
  let maps = 0, npcs = 0, warps = 0, sourceTrainers = 0, finals = 0;
  for (const campaign of campaigns) {
    check.ok(campaign.routeOfGodSwitch === 876, `${campaign.title}: no exige completar La Ruta de Dios`);
    const legacyPortal = eventsOf(campaign.lobbyMapId).find((entry) => entry.name === `${MARKER} Acceso completo — ${campaign.title}`);
    if (campaign.legacyLobbyEnabled !== false && campaign.lobbyMapId !== MAIN_CITY_MAP) {
      check.ok(!!legacyPortal, `${campaign.title}: falta el acceso de compatibilidad en Map${campaign.lobbyMapId}`);
      if (legacyPortal) {
        const open = pagesOf(legacyPortal)[1];
        check.ok(Number(iv(open.condition, "@switch1_id")) === 876, `${campaign.title}: acceso sin switch 876`);
        check.ok(open.list.some((command) => command.code === 201 && Number(command.params[1]) === campaign.firstMapId), `${campaign.title}: el acceso no lleva al primer mapa`);
      }
    }
    for (const blueprint of campaign.maps) {
      maps += 1; npcs += blueprint.npcs.length; warps += blueprint.warps.length;
      sourceTrainers += blueprint.npcs.filter((npc) => npc.trainer).length;
      if (blueprint.finale) finals += 1;
      check.ok(blueprint.npcs.length <= 4, `Map${blueprint.mapId}: excede el máximo de 4 actores del plano A`);
      check.ok(fs.existsSync(mapPath(blueprint.mapId)), `${campaign.title}: falta Map${blueprint.mapId}`);
      if (!fs.existsSync(mapPath(blueprint.mapId))) continue;
      const raw = readMapRaw(blueprint.mapId);
      const width = Number(iv(raw, "@width")), height = Number(iv(raw, "@height"));
      const events = eventsOf(blueprint.mapId);
      check.ok(events.some((entry) => entry.name === `${MARKER} Retorno libre`), `Map${blueprint.mapId}: falta retorno libre`);
      check.ok(events.some((entry) => entry.name === `${MARKER} Tramo siguiente`), `Map${blueprint.mapId}: falta avance lineal`);
      check.ok(events.filter((entry) => entry.name.startsWith(`${MARKER} NPC —`) || entry.name.startsWith(`${MARKER} Entrenador —`)).length === blueprint.npcs.length,
        `Map${blueprint.mapId}: NPC incompletos`);
      check.ok(events.filter((entry) => entry.name.startsWith(`${MARKER} Warp `)).length === blueprint.warps.length,
        `Map${blueprint.mapId}: warps incompletos`);
      const actors = events.filter((entry) => entry.name.startsWith(`${MARKER} NPC —`) || entry.name.startsWith(`${MARKER} Entrenador —`) || entry.name.startsWith(`${MARKER} Final —`)).length;
      check.ok(actors <= 5, `Map${blueprint.mapId}: ${actors} actores; el límite postgame es 5`);
      for (const entry of events) {
        const x = Number(iv(entry.obj, "@x")), y = Number(iv(entry.obj, "@y"));
        check.ok(x >= 0 && y >= 0 && x < width && y < height, `Map${blueprint.mapId}: evento fuera de límites`);
      }
      if (blueprint.sequence === 1 || blueprint.finale) {
        const nav = events.find((entry) => entry.name === `${MARKER} ${blueprint.sequence === 1 ? "Tramo anterior" : "Tramo siguiente"}`);
        const target = nav && pagesOf(nav)[0].list.find((command) => command.code === 201)?.params[1];
        check.ok(Number(target) === returnMap(campaign), `Map${blueprint.mapId}: el extremo de campaña no retorna a Puerto Horizonte`);
      }
    }
    const finalEvents = eventsOf(campaign.lastMapId);
    check.ok(finalEvents.some((entry) => entry.name === `${MARKER} Final — ${campaign.title}`), `${campaign.title}: falta final de campaña`);
  }
  check.ok(maps === PLAN.totals.maps, `se esperaban ${PLAN.totals.maps} mapas y hay ${maps}`);
  check.ok(npcs === PLAN.totals.npcs, `se esperaban ${PLAN.totals.npcs} actores adaptados y hay ${npcs}`);
  check.ok(warps === PLAN.totals.warps, `se esperaban ${PLAN.totals.warps} warps y hay ${warps}`);
  check.ok(sourceTrainers + finals === PLAN.totals.trainers + campaigns.length, `recuento de entrenadores adaptados inconsistente`);

  const guide = eventsOf(LEAGUE_MAP).find((entry) => entry.name === GUIDE_NAME);
  if (campaigns.some((campaign) => NORMAL_CAMPAIGNS.has(campaign.id))) {
    check.ok(!!guide, "Liga de Sinnoh: falta la guía de Cynthia");
    if (guide) {
      check.ok(Number(iv(guide.obj, "@x")) === 18 && Number(iv(guide.obj, "@y")) === 12, "Cynthia no está en la celda lateral prevista");
      check.ok(pagesOf(guide).length === 2, "Cynthia debe tener diálogo inicial y recordatorio breve");
      check.ok(txt(iv(pagesOf(guide)[0].obj.getIvar("@graphic"), "@character_name")) === "trchar198", "La guía no usa el sprite original de Cynthia");
    }
    const city = eventsOf(MAIN_CITY_MAP);
    const cityGrid = grid(MAIN_CITY_MAP);
    for (const campaign of campaigns.filter((item) => NORMAL_CAMPAIGNS.has(item.id) && item.cityPortal)) {
      const name = `${MARKER} Portal de Puerto Horizonte — ${campaign.title}`;
      const portal = city.find((entry) => entry.name === name);
      check.ok(!!portal, `Puerto Horizonte: falta el portal a ${campaign.title}`);
      if (!portal) continue;
      const { x, y } = campaign.cityPortal;
      check.ok(Number(iv(portal.obj, "@x")) === x && Number(iv(portal.obj, "@y")) === y, `${campaign.title}: coordenadas de portal incorrectas`);
      check.ok(walkableAt(cityGrid, x, y), `${campaign.title}: portal en celda no transitable de Map1001`);
      check.ok(!city.some((entry) => entry.name !== name && Number(iv(entry.obj, "@x")) === x && Number(iv(entry.obj, "@y")) === y), `${campaign.title}: portal solapa otro evento de Map1001`);
      const pages = pagesOf(portal);
      check.ok(pages.length === 2 && Number(iv(pages[1].condition, "@switch1_id")) === 876, `${campaign.title}: portal sin bloqueo postgame`);
      check.ok(pages[1].list.some((command) => command.code === 201 && Number(command.params[1]) === campaign.firstMapId), `${campaign.title}: portal no llega al primer mapa`);
    }
  }
  check.done();
  console.log(`  · ${maps} mapas · ${npcs} actores adaptados · ${warps} warps · ${sourceTrainers + finals} combates · 4 portales urbanos · guía de Cynthia`);
}

if (VERIFY) verify();
else { install(); verify(); }
