// ============================================================================
// analyze.js — Análisis total del juego (puro; la UI orquesta la carga)
// ----------------------------------------------------------------------------
// Extrae de cada mapa: diálogos, NPCs, flags, objetos, especies, entrenadores,
// salidas y colisiones. Luego construye un índice global + islas por región.
// ============================================================================
import { cmdOf, parseEvent, rstr, tableGet } from "./rmxp.js";
import { parsePBS, pbsSections, pbsGet } from "./pbs.js";
import { getSectionBody, getTownRegions } from "./create.js";

const uniqPush = (arr, v) => { if (!arr.includes(v)) arr.push(v); };

// Referencias dentro de un texto de script (especies, objetos, entrenadores).
export function scanScriptRefs(text) {
  const species = [], items = [], trainers = [], marts = [];
  for (const m of String(text || "").matchAll(/pb(?:WildBattle|DoubleWildBattle|AddPokemon)\(\s*:([A-Za-z0-9_]+)/g)) {
    uniqPush(species, m[1].toUpperCase());
  }
  for (const m of String(text || "").matchAll(/pb(?:ItemBall|ReceiveItem)\(\s*:([A-Za-z0-9_]+)/g)) {
    uniqPush(items, m[1].toUpperCase());
  }
  for (const m of String(text || "").matchAll(/pbTrainerBattle\(\s*:([A-Za-z0-9_]+)\s*,\s*"([^"]+)"(?:\s*,\s*[^,]+?)?(?:\s*,\s*(?:true|false|nil))?(?:\s*,\s*(\d+))?/g)) {
    trainers.push({ type: m[1].toUpperCase(), name: m[2], version: Number(m[3] || 0) });
  }
  for (const m of String(text || "").matchAll(/pbPokemonMart\(\[([\s\S]*?)\]\)/g)) {
    const stock = [];
    for (const it of m[1].matchAll(/:([A-Za-z0-9_]+)/g)) stock.push(it[1].toUpperCase());
    if (stock.length) marts.push(stock);
  }
  return { species, items, trainers, marts };
}

// --- Extracción por mapa ------------------------------------------------------
export function extractMapReport(parsed, mapId, info, tileset) {
  const rep = {
    id: mapId, name: info?.name || `Mapa ${mapId}`,
    w: parsed.width, h: parsed.height,
    tilesetId: parsed.tilesetId, tilesetName: tileset?.name || tileset?.tilesetName || "",
    events: [], texts: [], scripts: [],
    species: [], items: [], trainers: [], marts: [],
    switchesUsed: [], switchesSet: [], varsUsed: [], varsSet: [],
    selfSwitches: [], transfers: [],
    collisions: null, terrainTags: [],
  };
  const useSw = (a, b) => { for (let i = a; i <= b; i++) uniqPush(rep.switchesUsed, i); };
  const setSw = (a, b) => { for (let i = a; i <= b; i++) { uniqPush(rep.switchesSet, i); uniqPush(rep.switchesUsed, i); } };
  const useVar = (a, b) => { for (let i = a; i <= b; i++) uniqPush(rep.varsUsed, i); };
  const setVar = (a, b) => { for (let i = a; i <= b; i++) { uniqPush(rep.varsSet, i); uniqPush(rep.varsUsed, i); } };
  const eatRefs = (text, where) => {
    const r = scanScriptRefs(text);
    for (const s of r.species) uniqPush(rep.species, s);
    for (const s of r.items) uniqPush(rep.items, s);
    for (const t of r.trainers) rep.trainers.push({ ...t, ...where });
    for (const m of r.marts) rep.marts.push({ stock: m, ...where });
  };

  for (const { id: evId, obj } of parsed.events) {
    let ev;
    try { ev = parseEvent(obj); }
    catch { continue; }
    const evOut = { id: evId, name: ev.name, x: ev.x, y: ev.y, pages: [] };
    ev.pages.forEach((pg, pi) => {
      const where = { evId, evName: ev.name, page: pi };
      // condiciones de página
      if (pg.condition) {
        if (pg.condition.switch1) useSw(pg.condition.switch1, pg.condition.switch1);
        if (pg.condition.switch2) useSw(pg.condition.switch2, pg.condition.switch2);
        if (pg.condition.variable) useVar(pg.condition.variable.id, pg.condition.variable.id);
      }
      const gfx = pg.graphic ? { charName: pg.graphic.charName, tileId: pg.graphic.tileId, dir: pg.graphic.direction } : null;
      const pgOut = { trigger: pg.trigger, moveType: pg.moveType, gfx, commands: [] };
      const list = pg.list || [];
      let i = 0;
      let scriptBuf = "";
      const flushScript = () => {
        if (scriptBuf) {
          rep.scripts.push({ text: scriptBuf, ...where });
          eatRefs(scriptBuf, where);
          scriptBuf = "";
        }
      };
      while (i < list.length) {
        const c = cmdOf(list[i]);
        const P = c.params;
        pgOut.commands.push(c.code);
        if (c.code === 101) {
          const lines = [];
          i++;
          while (i < list.length) {
            const n = cmdOf(list[i]);
            if (n.code !== 401) break;
            lines.push(rstr(n.params[0]));
            i++;
          }
          rep.texts.push({ kind: "msg", text: lines.join("\n"), ...where });
          continue;
        }
        if (c.code === 102) {
          const opts = (P[0] || []).map(rstr);
          rep.texts.push({ kind: "choice", text: opts.join(" / "), ...where });
        } else if (c.code === 355) { flushScript(); scriptBuf = rstr(P[0]); }
        else if (c.code === 655) { scriptBuf += "\n" + rstr(P[0]); }
        else {
          flushScript();
          if (c.code === 111) {
            if (P[0] === 0) useSw(Number(P[1]), Number(P[1]));
            else if (P[0] === 1) { useVar(Number(P[1]), Number(P[1])); }
            else if (P[0] === 12) eatRefs(rstr(P[1]), where);
          }
          else if (c.code === 121) setSw(Number(P[0]), Number(P[1]));
          else if (c.code === 122) setVar(Number(P[0]), Number(P[1]));
          else if (c.code === 123) uniqPush(rep.selfSwitches, `${evId}:${rstr(P[0])}`);
          else if (c.code === 103) setVar(Number(P[1]), Number(P[1]));
          else if (c.code === 105) setVar(Number(P[0]), Number(P[0]));
          else if (c.code === 201) {
            if (P[0] === 0) rep.transfers.push({ map: Number(P[1]), x: Number(P[2]), y: Number(P[3]), ...where });
            else { useVar(Number(P[1]), Number(P[1])); useVar(Number(P[2]), Number(P[2])); useVar(Number(P[3]), Number(P[3])); rep.transfers.push({ map: -1, dynamic: true, ...where }); }
          }
        }
        i++;
      }
      flushScript();
      evOut.pages.push(pgOut);
    });
    rep.events.push(evOut);
  }

  // --- Colisiones y terreno
  try {
    if (tileset?.passages && parsed.table) {
      const T = parsed.table, P = tileset.passages.data;
      let blocked = 0, partial = 0;
      const tags = new Set();
      for (let y = 0; y < T.y; y++) {
        for (let x = 0; x < T.x; x++) {
          let cell = 0;
          for (let z = 0; z < T.z; z++) {
            const tid = tableGet(T, x, y, z);
            if (tid > 0 && tid < P.length) cell |= P[tid] & 0x0f;
            if (tid > 0 && tileset.terrain) {
              const tg = tileset.terrain.data[tid];
              if (tg) tags.add(tg);
            }
          }
          if (cell === 0x0f) blocked++;
          else if (cell !== 0) partial++;
        }
      }
      rep.collisions = { total: T.x * T.y, blocked, partial };
      rep.terrainTags = [...tags].sort((a, b) => a - b);
    }
  } catch { /* sin colisiones */ }
  return rep;
}

// --- Índice global --------------------------------------------------------------
export function buildGameIndex(reports, pbsTexts = {}) {
  const idx = {
    totals: {
      maps: reports.length, events: 0, npcs: 0, texts: 0, scripts: 0,
      switchesUsed: 0, varsUsed: 0, transfers: 0,
      speciesRef: 0, itemsRef: 0, trainerBattles: 0,
    },
    dialogues: [], npcs: [],
    flagUses: new Map(), // "sw:12" -> [{mapId,...}]
    transfers: [], speciesUses: new Map(), itemUses: new Map(), trainerBattles: [],
    collisions: [],
  };
  const flagPush = (kind, id, u) => {
    const k = `${kind}:${id}`;
    if (!idx.flagUses.has(k)) idx.flagUses.set(k, []);
    idx.flagUses.get(k).push(u);
  };
  for (const r of reports) {
    idx.totals.events += r.events.length;
    idx.totals.texts += r.texts.length;
    idx.totals.scripts += r.scripts.length;
    idx.totals.transfers += r.transfers.length;
    idx.totals.trainerBattles += r.trainers.length;
    for (const t of r.texts) idx.dialogues.push({ mapId: r.id, mapName: r.name, ...t });
    for (const e of r.events) {
      const g = e.pages[0]?.gfx;
      if (g && (g.charName || g.tileId)) {
        idx.totals.npcs++;
        idx.npcs.push({ mapId: r.id, mapName: r.name, evId: e.id, name: e.name, x: e.x, y: e.y, sprite: g.charName || `(tile ${g.tileId})` });
      }
    }
    for (const s of r.switchesUsed) flagPush("sw", s, { mapId: r.id, mapName: r.name, set: r.switchesSet.includes(s) });
    for (const v of r.varsUsed) flagPush("var", v, { mapId: r.id, mapName: r.name, set: r.varsSet.includes(v) });
    for (const t of r.transfers) idx.transfers.push({ mapId: r.id, mapName: r.name, ...t });
    for (const s of r.species) {
      if (!idx.speciesUses.has(s)) idx.speciesUses.set(s, []);
      idx.speciesUses.get(s).push({ mapId: r.id, mapName: r.name });
    }
    for (const s of r.items) {
      if (!idx.itemUses.has(s)) idx.itemUses.set(s, []);
      idx.itemUses.get(s).push({ mapId: r.id, mapName: r.name });
    }
    for (const t of r.trainers) idx.trainerBattles.push({ mapId: r.id, mapName: r.name, ...t });
    if (r.collisions) idx.collisions.push({ mapId: r.id, mapName: r.name, w: r.w, h: r.h, ...r.collisions });
  }
  idx.totals.switchesUsed = [...idx.flagUses.keys()].filter((k) => k.startsWith("sw:")).length;
  idx.totals.varsUsed = [...idx.flagUses.keys()].filter((k) => k.startsWith("var:")).length;
  idx.totals.speciesRef = idx.speciesUses.size;
  idx.totals.itemsRef = idx.itemUses.size;

  // islas/regiones desde metadata + townmap
  idx.islands = groupIslands(reports, pbsTexts.metadata || "", pbsTexts.townmap || "");
  return idx;
}

export function groupIslands(reports, metadataText, townText) {
  const meta = metadataText ? parsePBS(metadataText) : [];
  const regions = townText ? getTownRegions(townText) : [];
  const byRegion = new Map(); // region -> {region, name, filename, points, maps:[]}
  const getR = (rg) => {
    if (!byRegion.has(rg)) {
      const t = regions.find((x) => x.region === rg);
      byRegion.set(rg, { region: rg, name: t?.name || "", filename: t?.filename || "", points: t?.points.length || 0, maps: [] });
    }
    return byRegion.get(rg);
  };
  const unplaced = [];
  for (const r of reports) {
    let mp = null;
    for (const h of [String(r.id).padStart(3, "0"), String(r.id)]) {
      const v = meta.length ? pbsGet(meta, h, "MapPosition") : undefined;
      if (v) { mp = v; break; }
    }
    const m = mp ? mp.match(/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*$/) : null;
    if (m) getR(m[1]).maps.push({ id: r.id, name: r.name, x: Number(m[2]), y: Number(m[3]), events: r.events.length });
    else unplaced.push({ id: r.id, name: r.name, events: r.events.length });
  }
  // regiones sin mapas también cuentan
  for (const t of regions) getR(t.region);
  return { regions: [...byRegion.values()], unplaced };
}

// Resumen exportable (sin Maps, apto para JSON).
export function indexToJSON(idx) {
  return {
    totals: idx.totals,
    dialogues: idx.dialogues,
    npcs: idx.npcs,
    flagUses: [...idx.flagUses.entries()].map(([k, v]) => ({ flag: k, uses: v })),
    transfers: idx.transfers,
    speciesUses: [...idx.speciesUses.entries()].map(([k, v]) => ({ species: k, uses: v })),
    itemUses: [...idx.itemUses.entries()].map(([k, v]) => ({ item: k, uses: v })),
    trainerBattles: idx.trainerBattles,
    collisions: idx.collisions,
    islands: idx.islands,
  };
}
