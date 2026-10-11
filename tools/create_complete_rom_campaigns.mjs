#!/usr/bin/env node
/**
 * Construye planos estructurales de campañas invitadas a partir de informes
 * locales de ROM GBA. No copia textos, tiles, audio ni gráficos de las ROMs.
 *
 * El plano compilado es una adaptación jugable de estructura y un prototipo de
 * integración: no es una emulación ni una campaña artesanal validada. Las ROMs
 * permanecen fuera del repositorio; si faltan en reference/roms_invitadas, el
 * plano saneado versionado se usa como entrada reproducible.
 *
 * Uso:
 *   node tools/gba_maps_events.mjs --rom <ROM> --out <directorio>
 *   ROM_INPUT_DIR=<directorio> node tools/create_complete_rom_campaigns.mjs
 *   node tools/create_complete_rom_campaigns.mjs --check
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./lib/fire_ash_registry.mjs";

const CHECK = process.argv.includes("--check");
const OUT = path.join(ROOT, "content", "rom_campaigns_complete.json");
const INPUT = path.resolve(process.env.ROM_INPUT_DIR || path.join(ROOT, "reference", "roms_invitadas"));
const MAX_NPCS_PER_MAP = 4;
const CONFIGS = [
  {
    id: "glazed", source: "GlazedESPB6", title: "Glazed", firstMapId: 3000, lobbyMapId: 2200,
    returnMapId: 1001, mainHubMapId: 1001, cityPortal: { x: 33, y: 28 },
    completeSwitch: 990, progressVariable: 350, trainerType: "GLAZED_ARCHIVE", outfitId: 3,
    playerRole: "ash_protagonist", legacyLobbyEnabled: true,
    donors: [7, 23, 28, 31, 35, 167],
    palette: "postgame A: escarcha, lagos y ciudades que recuerdan dos líneas temporales",
    storyAxis: "las decisiones que conectan dos historias sin borrar ninguna",
    ashVoice: "Si hay alguien que necesita ayuda, vamos. Pero primero quiero escuchar qué pasó.",
  },
  {
    id: "light_platinum", source: "LightPlatinumEsp", title: "Light Platinum", firstMapId: 3120, lobbyMapId: 2210,
    returnMapId: 1001, mainHubMapId: 1001, cityPortal: { x: 30, y: 29 },
    completeSwitch: 991, progressVariable: 351, trainerType: "PLATINUM_ARCHIVE", outfitId: 4,
    playerRole: "ash_protagonist", legacyLobbyEnabled: true,
    donors: [2, 33, 41, 43, 44, 180],
    palette: "postgame A: costas luminosas, rutas largas y plazas de una liga viajera",
    storyAxis: "las rutas de una liga que no se queda quieta",
    ashVoice: "¿Una región nueva y una liga por recorrer? Pikachu, esto va a ser divertido.",
  },
  {
    id: "liquid_crystal", source: "LiquidCrystalESP", title: "Liquid Crystal", firstMapId: 3200, lobbyMapId: 2240,
    returnMapId: 1001, mainHubMapId: 1001, cityPortal: { x: 31, y: 26 },
    completeSwitch: 992, progressVariable: 352, trainerType: "CRYSTAL_ARCHIVE", outfitId: 5,
    playerRole: "ash_protagonist", legacyLobbyEnabled: true,
    donors: [251, 254, 295, 299, 306, 308],
    palette: "postgame A: lluvia de Johto, ruinas, faros y cristal vivo",
    storyAxis: "los lugares de Johto, sus lazos y sus recuerdos",
    ashVoice: "Un lugar puede cambiar muchísimo y seguir siendo hogar para alguien. Vamos a verlo.",
  },
  {
    id: "tfoh", source: "Pokémon TFOH-Beta3", title: "TFOH", firstMapId: 3700, lobbyMapId: 2242,
    returnMapId: 2242, completeSwitch: 993, progressVariable: 353,
    trainerType: "TFOH_ARCHIVE", outfitId: 6, playerRole: "visitor", legacyLobbyEnabled: true,
    donors: [209, 211, 228, 236, 245, 491],
    palette: "postgame A: frontera, archipiélagos y caminos de una aventura que siguió creciendo",
    storyAxis: "la frontera, el archipiélago y una aventura en expansión",
    ashVoice: "Vengo a conocer este lugar y a respetar la historia de quienes ya viven aquí.",
  },
  {
    id: "unbound", source: "Pokemon unbound gba", title: "Pokémon Unbound", firstMapId: 4000, lobbyMapId: 1001,
    returnMapId: 1001, mainHubMapId: 1001, cityPortal: { x: 34, y: 25 },
    completeSwitch: 994, progressVariable: 354, trainerType: "UNBOUND_ARCHIVE", outfitId: 10,
    playerRole: "ash_protagonist", legacyLobbyEnabled: false,
    donors: [209, 211, 228, 236, 245, 491],
    palette: "postgame A: caminos de frontera, decisiones difíciles y refugios construidos en equipo",
    storyAxis: "los dilemas de una región fronteriza y la gente que decide protegerla",
    ashVoice: "Una región dividida no deja de ser un hogar. Si alguien necesita ayuda, cuenta conmigo.",
  },
];

const ROLES = ["testigo del camino", "guía local", "investigador de campo", "entrenador de paso", "cuidador del distrito", "mensajero regional", "cronista de la dimensión", "exploradora de rutas"];
const MOTIFS = ["memoria", "retorno", "amistad", "elección", "rumor", "frontera", "promesa", "hallazgo", "rivalidad", "refugio", "viaje", "legado"];
const BIOMES = ["poblado", "ruta", "santuario", "cueva", "costa", "bosque", "instalación", "meseta"];
const cleanOps = (script) => (script?.pasos ?? []).filter((p) => p.tipo !== "texto").map((p) => ({ tipo: p.tipo, valor: p.valor ?? null }));
const mainReturn = (cfg) => cfg.returnMapId ?? cfg.lobbyMapId;
const titleFor = (cfg, map, index) => {
  const biome = BIOMES[(Number(map.tipo || 0) + Number(map.clima || 0) + index) % BIOMES.length];
  const chapter = Math.floor(index / 12) + 1;
  return `${cfg.title} · Capítulo ${String(chapter).padStart(2, "0")} · ${biome} ${String(index + 1).padStart(3, "0")}`;
};
const uniquePosition = (npc, index, width, height) => ({
  x: Math.max(2, Math.min(width - 3, Number(npc.x) + (index % 3))),
  y: Math.max(2, Math.min(height - 3, Number(npc.y) + (Math.floor(index / 3) % 3))),
});

function sanitizedSummary(summary = {}) {
  // Conserva métricas estructurales; la duración depende de la máquina y el
  // contador de textos es un dato agregado, nunca el contenido de esos textos.
  const { duracionSegundos: _duration, ...stable } = summary;
  return stable;
}

function npcScore(npc, originalIndex) {
  return (npc.trainer || Number(npc.sourceTrainerType) > 0 ? 80 : 0)
    + (Number(npc.sourceFlag) > 0 ? 30 : 0)
    + Math.min(30, (npc.structuralOps?.length ?? 0) * 2)
    + (npc.movement ? 1 : 0)
    - originalIndex / 10000;
}

/**
 * Retiene hasta cuatro actores por mapa para que los mapas A no se conviertan
 * en salas abarrotadas. Se guardan entrenadores y NPC con señales estructurales
 * primero; el recuento completo del origen queda anotado en sourceSemantics.
 */
function selectNpcs(npcs, cap = MAX_NPCS_PER_MAP) {
  const indexed = (npcs ?? []).map((npc, index) => ({ ...npc, __sourceOrder: index }));
  if (indexed.length <= cap) return indexed.map(({ __sourceOrder, ...npc }) => npc);
  const rank = (a, b) => npcScore(b, b.__sourceOrder) - npcScore(a, a.__sourceOrder);
  const trainers = indexed.filter((npc) => npc.trainer || Number(npc.sourceTrainerType) > 0).sort(rank);
  const locals = indexed.filter((npc) => !trainers.includes(npc)).sort(rank);
  const picked = trainers.slice(0, Math.min(2, cap));
  for (const npc of locals) {
    if (picked.length >= cap) break;
    picked.push(npc);
  }
  for (const npc of trainers) {
    if (picked.length >= cap) break;
    if (!picked.includes(npc)) picked.push(npc);
  }
  return picked.sort((a, b) => a.__sourceOrder - b.__sourceOrder).map(({ __sourceOrder, ...npc }) => npc);
}

function dialoguePlanFor(cfg, npc) {
  const role = npc.role || "guía local";
  const motif = npc.motif || "viaje";
  if (cfg.playerRole === "ash_protagonist") {
    return [
      `${role}: Ash, aquí cada persona tiene algo propio que contar sobre ${motif}. ¿Nos ayudas a entenderlo?`,
      `Ash: ${cfg.ashVoice}`,
      npc.trainer
        ? `Esta batalla forma parte de ${cfg.storyAxis}; nadie tiene que imitar a otra persona para pertenecer aquí.`
        : `Esta historia trata de ${cfg.storyAxis}. Preguntar primero también es una forma de ayudar.`,
    ];
  }
  return [
    `${role}: Ash, aquí eres visitante; escucha lo que este lugar conserva sobre ${motif}.`,
    `Este rincón pertenece a ${cfg.title}. Puedes recorrerlo sin borrar la historia de quienes llegaron antes.`,
    npc.trainer ? "Si aceptas el desafío, podrás continuar aunque pierdas; el camino nunca se cerrará." : "Pregunta, observa y vuelve cuando quieras: ninguna puerta depende de llevarte algo ajeno.",
  ];
}

function mapVisualRows(cfg, map, index, dimensions) {
  // Un único donante por mapa evita cambios de tileset/paleta de fila en fila.
  // El pintor actual usa fuentes exteriores de Fire Ash; la clasificación y la
  // construcción artesanal de interiores sigue siendo una tarea de arte aparte.
  const donorMapId = cfg.donors[index % cfg.donors.length];
  return Array.from({ length: dimensions.height }, (_, y) => ({
    y,
    donorMapId,
    floorPhase: (Number(map.header || 0) + y * 17 + index * 31) % 97,
    accentEvery: 5 + ((Number(map.clima || 0) + y + index) % 11),
    corridorBand: 2 + ((Number(map.tipo || 0) + y) % Math.max(3, Math.floor(dimensions.width / 4))),
  }));
}

function createMapFromSource(cfg, source, map, index, keyToId) {
  const mapId = cfg.firstMapId + index;
  const scriptsByNpc = new Map((map.scripts ?? []).map((s) => [s.npc, s]));
  const rawNpcs = (map.npcsDetalle ?? []).map((npc, npcIndex) => {
    const script = scriptsByNpc.get(npc.localId);
    const role = ROLES[(Number(npc.sprite || 0) + npcIndex + index) % ROLES.length];
    const motif = MOTIFS[(Number(npc.localId || 0) + index) % MOTIFS.length];
    const pos = uniquePosition(npc, npcIndex, map.ancho, map.alto);
    return {
      localId: npc.localId,
      sourceSprite: npc.sprite,
      x: pos.x,
      y: pos.y,
      movement: npc.movimiento,
      trainer: npc.tipoEntrenador > 0,
      sourceTrainerType: npc.tipoEntrenador,
      sourceFlag: npc.flag,
      role,
      motif,
      structuralOps: cleanOps(script),
    };
  });
  const npcs = selectNpcs(rawNpcs);
  for (const npc of npcs) npc.dialoguePlan = dialoguePlanFor(cfg, npc);
  const warps = (map.warpsDetalle ?? []).map((warp, warpIndex) => {
    const target = keyToId.get(`${warp.bancoDestino}:${warp.mapaDestino}`) ?? null;
    return {
      x: Math.max(1, Math.min(map.ancho - 2, warp.x)),
      y: Math.max(1, Math.min(map.alto - 2, warp.y)),
      sourceWarpId: warp.warpId,
      targetMapId: target,
      targetSource: { bank: warp.bancoDestino, map: warp.mapaDestino },
      fallbackMapId: index + 1 < source.mapas.length ? mapId + 1 : mainReturn(cfg),
      label: `Enlace ${warpIndex + 1}`,
    };
  });
  const dimensions = { width: map.ancho, height: map.alto };
  return {
    mapId,
    source: { bank: map.banco, map: map.indice, header: `0x${map.header.toString(16).toUpperCase()}` },
    title: titleFor(cfg, map, index),
    chapter: Math.floor(index / 12) + 1,
    sequence: index + 1,
    dimensions,
    sourceSemantics: { music: map.musica, weather: map.clima, mapType: map.tipo, npcCount: map.npcs, warpCount: map.warps, flags: map.flags, variables: map.variables },
    npcSelection: { sourceCount: map.npcsDetalle?.length ?? map.npcs ?? 0, installedCount: npcs.length, maxInstalled: MAX_NPCS_PER_MAP },
    artDirection: `${cfg.palette}; plano estructural con tiles propios de Fire Ash, no arte del fangame`,
    visualRows: mapVisualRows(cfg, map, index, dimensions),
    npcs,
    warps,
    linearLinks: {
      previous: index > 0 ? mapId - 1 : mainReturn(cfg),
      next: index + 1 < source.mapas.length ? mapId + 1 : mainReturn(cfg),
      lobby: cfg.lobbyMapId,
      returnMapId: mainReturn(cfg),
    },
    finale: index === source.mapas.length - 1,
  };
}

function refreshExistingMap(cfg, map, index, mapCount) {
  const mapId = cfg.firstMapId + index;
  const dimensions = map.dimensions;
  const sourceOrder = map.npcs ?? [];
  const npcs = selectNpcs(sourceOrder);
  for (const npc of npcs) npc.dialoguePlan = dialoguePlanFor(cfg, npc);
  const fallback = mainReturn(cfg);
  const visualRows = mapVisualRows(cfg, {
    header: Number.parseInt(map.source?.header ?? "0", 16),
    clima: map.sourceSemantics?.weather,
    tipo: map.sourceSemantics?.mapType,
  }, index, dimensions);
  return {
    ...map,
    mapId,
    npcSelection: {
      sourceCount: map.npcSelection?.sourceCount ?? map.sourceSemantics?.npcCount ?? sourceOrder.length,
      installedCount: npcs.length,
      maxInstalled: MAX_NPCS_PER_MAP,
    },
    artDirection: `${cfg.palette}; plano estructural con tiles propios de Fire Ash, no arte del fangame`,
    visualRows,
    npcs,
    linearLinks: {
      previous: index > 0 ? mapId - 1 : fallback,
      next: index + 1 < mapCount ? mapId + 1 : fallback,
      lobby: cfg.lobbyMapId,
      returnMapId: fallback,
    },
    finale: index === mapCount - 1,
  };
}

function buildCampaign(cfg, previous) {
  const file = path.join(INPUT, cfg.source, "mapas_npcs.json");
  if (fs.existsSync(file)) {
    const source = JSON.parse(fs.readFileSync(file, "utf8"));
    const keyToId = new Map(source.mapas.map((m, i) => [`${m.banco}:${m.indice}`, cfg.firstMapId + i]));
    const maps = source.mapas.map((map, index) => createMapFromSource(cfg, source, map, index, keyToId));
    return {
      ...cfg,
      sourceRom: source.rom,
      sourceSummary: sanitizedSummary(source.resumen),
      routeOfGodSwitch: 876,
      mapCount: maps.length,
      firstMapId: maps[0]?.mapId ?? cfg.firstMapId,
      lastMapId: maps.at(-1)?.mapId ?? cfg.firstMapId - 1,
      maps,
    };
  }

  const existing = previous?.campaigns?.find((campaign) => campaign.id === cfg.id);
  if (!existing) throw new Error(`Falta ${file} y no hay un plano saneado previo para ${cfg.id}.`);
  const mapCount = existing.maps.length;
  const maps = existing.maps.map((map, index) => refreshExistingMap(cfg, map, index, mapCount));
  return {
    ...existing,
    ...cfg,
    sourceSummary: sanitizedSummary(existing.sourceSummary),
    routeOfGodSwitch: 876,
    mapCount: maps.length,
    firstMapId: maps[0]?.mapId ?? cfg.firstMapId,
    lastMapId: maps.at(-1)?.mapId ?? cfg.firstMapId - 1,
    maps,
  };
}

function build() {
  const previous = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : null;
  const campaigns = CONFIGS.map((cfg) => buildCampaign(cfg, previous));
  const sourceNpcs = campaigns.reduce((total, campaign) => total + campaign.maps.reduce((sum, map) => sum + Number(map.npcSelection?.sourceCount ?? map.sourceSemantics?.npcCount ?? map.npcs.length), 0), 0);
  const adaptedNpcs = campaigns.reduce((total, campaign) => total + campaign.maps.reduce((sum, map) => sum + map.npcs.length, 0), 0);
  const totals = {
    campaigns: campaigns.length,
    maps: campaigns.reduce((sum, campaign) => sum + campaign.maps.length, 0),
    npcs: adaptedNpcs,
    sourceNpcs,
    trainers: campaigns.reduce((sum, campaign) => sum + campaign.maps.reduce((sub, map) => sub + map.npcs.filter((npc) => npc.trainer).length, 0), 0),
    warps: campaigns.reduce((sum, campaign) => sum + campaign.maps.reduce((sub, map) => sub + map.warps.length, 0), 0),
    visualRows: campaigns.reduce((sum, campaign) => sum + campaign.maps.reduce((sub, map) => sub + map.visualRows.length, 0), 0),
  };
  return {
    schema: "fire_ash_complete_rom_campaigns/2.0",
    generatedBy: "tools/create_complete_rom_campaigns.mjs",
    policy: "Sólo estructura analizada y contenido original de Fire Ash. Los planos generados no son emulación, una campaña artesanal completa ni una validación de juego; no incorporan diálogos, mapas, tiles, audio o gráficos de las ROMs invitadas.",
    visualContract: { category: "A", maxSourceNpcsPerMap: MAX_NPCS_PER_MAP, interiorsNeedSeparateHandcraftedProfiles: true },
    totals,
    campaigns,
  };
}

const result = build();
const serialized = `${JSON.stringify(result, null, 2)}\n`;
if (CHECK) {
  if (!fs.existsSync(OUT)) throw new Error(`Falta ${OUT}`);
  const current = fs.readFileSync(OUT, "utf8");
  if (current !== serialized) throw new Error("rom_campaigns_complete.json está desactualizado; regénéralo con los informes locales o el plano versionado.");
  console.log(`✔ Plano estructural reproducible: ${result.totals.campaigns} campañas, ${result.totals.maps} mapas, ${result.totals.npcs}/${result.totals.sourceNpcs} actores adaptados/origen, ${result.totals.warps} warps.`);
} else {
  fs.writeFileSync(OUT, serialized);
  console.log(`✔ ${path.relative(ROOT, OUT)}: ${result.totals.campaigns} campañas, ${result.totals.maps} mapas, ${result.totals.npcs}/${result.totals.sourceNpcs} actores adaptados/origen, ${result.totals.warps} warps.`);
}
