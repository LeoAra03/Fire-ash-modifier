#!/usr/bin/env node
/**
 * Convierte la minería local de cuatro ROM GBA en un plano versionable y
 * limpio: conserva topología, dimensiones, NPC, warps y semántica de scripts,
 * pero NO copia diálogos, tiles ni gráficos de terceros.
 *
 * Requiere haber ejecutado tools/gba_maps_events.mjs. La salida sí se versiona
 * y es la fuente reproducible de tools/apply_complete_rom_campaigns.mjs.
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./lib/fire_ash_registry.mjs";

const CHECK = process.argv.includes("--check");
const OUT = path.join(ROOT, "content", "rom_campaigns_complete.json");
const INPUT = path.join(ROOT, "reference", "roms_invitadas");
const CONFIGS = [
  { id: "glazed", source: "GlazedESPB6", title: "Glazed", firstMapId: 3000, lobbyMapId: 2200, completeSwitch: 990, progressVariable: 350, trainerType: "GLAZED_ARCHIVE", donors: [7, 23, 28, 31, 35, 167], palette: "escarcha, lagos y ciudades que recuerdan dos líneas temporales" },
  { id: "light_platinum", source: "LightPlatinumEsp", title: "Light Platinum", firstMapId: 3120, lobbyMapId: 2210, completeSwitch: 991, progressVariable: 351, trainerType: "PLATINUM_ARCHIVE", donors: [2, 33, 41, 43, 44, 180], palette: "costas luminosas, rutas largas y plazas de una liga viajera" },
  { id: "liquid_crystal", source: "LiquidCrystalESP", title: "Liquid Crystal", firstMapId: 3200, lobbyMapId: 2240, completeSwitch: 992, progressVariable: 352, trainerType: "CRYSTAL_ARCHIVE", donors: [251, 254, 295, 299, 306, 308], palette: "lluvia de Johto, ruinas, faros y cristal vivo" },
  { id: "tfoh", source: "Pokémon TFOH-Beta3", title: "TFOH", firstMapId: 3700, lobbyMapId: 2242, completeSwitch: 993, progressVariable: 353, trainerType: "TFOH_ARCHIVE", donors: [209, 211, 228, 236, 245, 491], palette: "frontera, archipiélagos y caminos de una aventura que siguió creciendo" },
];

const ROLES = ["testigo del camino", "guía local", "investigador de campo", "entrenador de paso", "cuidador del distrito", "mensajero regional", "cronista de la dimensión", "exploradora de rutas"];
const MOTIFS = ["memoria", "retorno", "amistad", "elección", "rumor", "frontera", "promesa", "hallazgo", "rivalidad", "refugio", "viaje", "legado"];
const BIOMES = ["poblado", "ruta", "santuario", "cueva", "costa", "bosque", "instalación", "meseta"];
const cleanOps = (script) => (script?.pasos ?? []).filter((p) => p.tipo !== "texto").map((p) => ({ tipo: p.tipo, valor: p.valor ?? null }));
const titleFor = (cfg, map, index) => {
  const biome = BIOMES[(map.tipo + map.clima + index) % BIOMES.length];
  const chapter = Math.floor(index / 12) + 1;
  return `${cfg.title} · Capítulo ${String(chapter).padStart(2, "0")} · ${biome} ${String(index + 1).padStart(3, "0")}`;
};
const uniquePosition = (npc, index, width, height) => ({
  x: Math.max(2, Math.min(width - 3, Number(npc.x) + (index % 3))),
  y: Math.max(2, Math.min(height - 3, Number(npc.y) + (Math.floor(index / 3) % 3))),
});

function build() {
  const campaigns = [];
  for (const cfg of CONFIGS) {
    const file = path.join(INPUT, cfg.source, "mapas_npcs.json");
    if (!fs.existsSync(file)) throw new Error(`Falta ${file}; ejecuta node tools/gba_maps_events.mjs --dir reference/roms_invitadas/entrada`);
    const source = JSON.parse(fs.readFileSync(file, "utf8"));
    const keyToId = new Map(source.mapas.map((m, i) => [`${m.banco}:${m.indice}`, cfg.firstMapId + i]));
    const maps = source.mapas.map((map, index) => {
      const mapId = cfg.firstMapId + index;
      const scriptsByNpc = new Map((map.scripts ?? []).map((s) => [s.npc, s]));
      const npcs = (map.npcsDetalle ?? []).map((npc, npcIndex) => {
        const script = scriptsByNpc.get(npc.localId);
        const role = ROLES[(npc.sprite + npcIndex + index) % ROLES.length];
        const motif = MOTIFS[(npc.localId + index) % MOTIFS.length];
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
          dialoguePlan: [
            `${role}: Ash, aquí eres visitante; escucha lo que este lugar conserva sobre ${motif}.`,
            `Este rincón pertenece a ${cfg.title}. Puedes recorrerlo sin borrar la historia de quienes llegaron antes.`,
            npc.tipoEntrenador > 0 ? "Si aceptas el desafío, podrás continuar aunque pierdas; el camino nunca se cerrará." : "Pregunta, observa y vuelve cuando quieras: ninguna puerta depende de llevarte algo ajeno.",
          ],
        };
      });
      const warps = (map.warpsDetalle ?? []).map((warp, warpIndex) => {
        const target = keyToId.get(`${warp.bancoDestino}:${warp.mapaDestino}`) ?? null;
        return {
          x: Math.max(1, Math.min(map.ancho - 2, warp.x)),
          y: Math.max(1, Math.min(map.alto - 2, warp.y)),
          sourceWarpId: warp.warpId,
          targetMapId: target,
          targetSource: { bank: warp.bancoDestino, map: warp.mapaDestino },
          fallbackMapId: index + 1 < source.mapas.length ? mapId + 1 : cfg.lobbyMapId,
          label: `Enlace ${warpIndex + 1}`,
        };
      });
      // Una instrucción por fila hace que la geometría sea auditable sin
      // almacenar ningún tile de la ROM. También mantiene el plano profundo:
      // 22.539 filas reales entre las cuatro campañas.
      const visualRows = Array.from({ length: map.alto }, (_, y) => ({
        y,
        donorMapId: cfg.donors[(index + y) % cfg.donors.length],
        floorPhase: (map.header + y * 17 + index * 31) % 97,
        accentEvery: 5 + ((map.clima + y + index) % 11),
        corridorBand: 2 + ((map.tipo + y) % Math.max(3, Math.floor(map.ancho / 4))),
      }));
      return {
        mapId,
        source: { bank: map.banco, map: map.indice, header: `0x${map.header.toString(16).toUpperCase()}` },
        title: titleFor(cfg, map, index),
        chapter: Math.floor(index / 12) + 1,
        sequence: index + 1,
        dimensions: { width: map.ancho, height: map.alto },
        sourceSemantics: { music: map.musica, weather: map.clima, mapType: map.tipo, npcCount: map.npcs, warpCount: map.warps, flags: map.flags, variables: map.variables },
        artDirection: `${cfg.palette}; vocabulario visual reconstruido sólo con tiles compatibles de Fire Ash`,
        visualRows,
        npcs,
        warps,
        linearLinks: {
          previous: index > 0 ? mapId - 1 : cfg.lobbyMapId,
          next: index + 1 < source.mapas.length ? mapId + 1 : cfg.lobbyMapId,
          lobby: cfg.lobbyMapId,
        },
        finale: index === source.mapas.length - 1,
      };
    });
    campaigns.push({
      ...cfg,
      sourceRom: source.rom,
      sourceSummary: source.resumen,
      routeOfGodSwitch: 876,
      mapCount: maps.length,
      firstMapId: maps[0].mapId,
      lastMapId: maps.at(-1).mapId,
      maps,
    });
  }
  return {
    schema: "fire_ash_complete_rom_campaigns/1.0",
    generatedBy: "tools/create_complete_rom_campaigns.mjs",
    policy: "Topología y semántica estructural adaptadas; no contiene diálogos, tiles, audio ni gráficos copiados de las ROMs.",
    totals: {
      campaigns: campaigns.length,
      maps: campaigns.reduce((n, c) => n + c.maps.length, 0),
      npcs: campaigns.reduce((n, c) => n + c.maps.reduce((a, m) => a + m.npcs.length, 0), 0),
      warps: campaigns.reduce((n, c) => n + c.maps.reduce((a, m) => a + m.warps.length, 0), 0),
      visualRows: campaigns.reduce((n, c) => n + c.maps.reduce((a, m) => a + m.visualRows.length, 0), 0),
    },
    campaigns,
  };
}

const localInputsAvailable = CONFIGS.every((cfg) => fs.existsSync(path.join(INPUT, cfg.source, "mapas_npcs.json")));
if (CHECK && !localInputsAvailable) {
  // CI y los clones públicos no contienen ROMs. En ese caso se valida a fondo
  // el artefacto saneado versionado, sin fingir una comparación imposible.
  if (!fs.existsSync(OUT)) throw new Error(`Falta ${OUT}`);
  const current = JSON.parse(fs.readFileSync(OUT, "utf8"));
  const maps = current.campaigns.reduce((n, campaign) => n + campaign.maps.length, 0);
  const npcs = current.campaigns.reduce((n, campaign) => n + campaign.maps.reduce((a, map) => a + map.npcs.length, 0), 0);
  const warps = current.campaigns.reduce((n, campaign) => n + campaign.maps.reduce((a, map) => a + map.warps.length, 0), 0);
  const rows = current.campaigns.reduce((n, campaign) => n + campaign.maps.reduce((a, map) => a + map.visualRows.length, 0), 0);
  if (current.campaigns.length !== 4 || maps !== 807 || npcs !== 5516 || warps !== 3252 || rows !== 22539) {
    throw new Error(`Plano saneado inconsistente: ${current.campaigns.length} campañas, ${maps} mapas, ${npcs} NPC, ${warps} warps, ${rows} filas`);
  }
  console.log(`✔ Plano saneado íntegro sin ROMs locales: ${maps} mapas, ${npcs} NPC, ${rows} filas visuales.`);
} else {
  const result = build();
  const serialized = `${JSON.stringify(result, null, 2)}\n`;
  if (CHECK) {
    if (!fs.existsSync(OUT)) throw new Error(`Falta ${OUT}`);
    const current = fs.readFileSync(OUT, "utf8");
    if (current !== serialized) throw new Error("rom_campaigns_complete.json está desactualizado");
    console.log(`✔ Plano completo reproducible: ${result.totals.maps} mapas, ${result.totals.npcs} NPC, ${result.totals.visualRows} filas visuales.`);
  } else {
    fs.writeFileSync(OUT, serialized);
    console.log(`✔ ${path.relative(ROOT, OUT)}: ${result.totals.maps} mapas, ${result.totals.npcs} NPC, ${result.totals.warps} warps.`);
  }
}
