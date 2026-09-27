// ============================================================================
// packs.js — Packs de contenido nuevo (puros; la UI orquesta)
// ----------------------------------------------------------------------------
// Un pack describe jefes/entrenadores + un mapa concentrador (hub) + puerta.
// Todo lo que genera es ADITIVO: mapa nuevo, secciones PBS nuevas y 1 evento
// puerta. Con el manifiesto guardado se puede desinstalar sin tocar lo demás.
// ============================================================================
import {
  buildTrainer, buildTemplate, evPage, evGraphic, textCmds, evCmd,
  formatTrainerEntry,
} from "./create.js";

const asSet = (v) => (v ? new Set([...v].map((x) => String(x).toUpperCase())) : null);

// --- Validación ---------------------------------------------------------------
// ctx = { species, items, maps } (arreglos o Sets con ids en mayúsculas)
export function validatePack(pack, ctx = {}) {
  const issues = [];
  const err = (where, msg) => issues.push({ level: "error", where, msg });
  const warn = (where, msg) => issues.push({ level: "warn", where, msg });
  const info = (where, msg) => issues.push({ level: "info", where, msg });
  if (!pack || typeof pack !== "object") return [{ level: "error", where: "pack", msg: "JSON inválido" }];
  if (!pack.title) err("pack", "falta el título");
  const hub = pack.hub || {};
  const W = Number(hub.width), H = Number(hub.height);
  if (!hub.name) err("hub", "falta el nombre del mapa");
  if (!Number.isInteger(W) || W < 8 || W > 100) err("hub", `ancho inválido: ${hub.width} (8-100)`);
  if (!Number.isInteger(H) || H < 8 || H > 100) err("hub", `alto inválido: ${hub.height} (8-100)`);
  const bosses = pack.bosses || [];
  if (!bosses.length) err("pack", "no trae jefes");
  if (bosses.length > 40) err("pack", "demasiados jefes (máximo 40)");
  const species = asSet(ctx.species), items = asSet(ctx.items);
  const used = new Set();
  const claim = (x, y, what) => {
    const k = `${x},${y}`;
    if (used.has(k)) err(what, `casilla (${x},${y}) ocupada por otro contenido del pack`);
    used.add(k);
  };
  const inHub = (x, y) => Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < W && y < H;
  const seenIds = new Set();
  bosses.forEach((b, i) => {
    const where = `jefe[${b.id || i}]`;
    if (!b.id) err(where, "falta id");
    else if (seenIds.has(b.id)) err(where, "id duplicado");
    seenIds.add(b.id);
    if (!b.name) err(where, "falta nombre");
    if (!inHub(b.x, b.y)) err(where, `posición (${b.x},${b.y}) fuera del hub ${W}x${H}`);
    else claim(b.x, b.y, where);
    const team = b.team || [];
    if (!team.length) err(where, "equipo vacío");
    if (team.length > 6) err(where, `equipo con ${team.length} Pokémon (máximo 6)`);
    team.forEach((m, j) => {
      const sp = String(m.species || "").toUpperCase();
      if (!sp) err(where, `equipo[${j}]: falta especie`);
      else if (species && !species.has(sp)) err(where, `especie inexistente en tu juego: ${sp}`);
      const lv = Number(m.level);
      if (!Number.isInteger(lv) || lv < 1 || lv > 150) err(where, `nivel inválido en ${sp || "?"}: ${m.level}`);
      if (m.item && items && !items.has(String(m.item).toUpperCase())) warn(where, `objeto inexistente en tu juego: ${m.item}`);
    });
    if (b.version !== undefined && (!Number.isInteger(b.version) || b.version < 0)) err(where, "versión inválida");
    if (!b.loseText) warn(where, "sin frase de derrota (dirá ...)");
    if (!b.intro?.length) info(where, "sin presentación (usará una genérica)");
  });
  (pack.extras || []).forEach((e, i) => {
    const where = `extra[${e.kind || i}]`;
    if (!["healer", "sign", "item", "mart", "gift"].includes(e.kind)) err(where, `tipo desconocido: ${e.kind}`);
    if (!inHub(e.x, e.y)) err(where, `posición (${e.x},${e.y}) fuera del hub`);
    else claim(e.x, e.y, where);
    if (e.kind === "item" && e.item && items && !items.has(String(e.item).toUpperCase())) err(where, `objeto inexistente: ${e.item}`);
    if (e.kind === "mart" && e.stock && items) {
      for (const s of e.stock) if (!items.has(String(s).toUpperCase())) warn(where, `objeto de tienda inexistente: ${s}`);
    }
  });
  const sx = hub.spawn?.x ?? Math.floor(W / 2), sy = hub.spawn?.y ?? H - 2;
  if (!inHub(sx, sy)) err("hub", `salida (${sx},${sy}) fuera del mapa`);
  else claim(sx, sy, "hub.salida");
  return issues;
}

// Primera casilla libre del mapamundi 30x20, en espiral desde la preferida.
export function findFreeTownCoord(points, prefer = { x: 1, y: 1 }) {
  const busy = new Set((points || []).map((p) => `${p.x},${p.y}`));
  for (let r = 0; r < 30; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = prefer.x + dx, y = prefer.y + dy;
        if (x >= 0 && x <= 29 && y >= 0 && y <= 19 && !busy.has(`${x},${y}`)) return { x, y };
      }
    }
  }
  return { ...prefer };
}

// --- Planificación (pura) --------------------------------------------------------
// opts = { typeMap:{bossId:TYPE}, spriteMap:{bossId:sprite}, tilesetId,
//          doorMap, doorX, doorY, region, townX, townY, hubId }
export function planPack(pack, opts = {}) {
  const hub = pack.hub;
  const W = Number(hub.width), H = Number(hub.height);
  const hubId = Number(opts.hubId);
  const sx = hub.spawn?.x ?? Math.floor(W / 2), sy = hub.spawn?.y ?? H - 2;
  // aterrizaje junto a la salida (evita re-disparar la puerta al llegar)
  const landing = (sy + 1 < H) ? { x: sx, y: sy + 1 } : { x: sx, y: sy - 1 };
  const events = [];
  const trainerEntries = [];
  for (const b of pack.bosses) {
    const ttype = (opts.typeMap?.[b.id] || b.suggestedType || "CAMPER").toUpperCase();
    const sprite = opts.spriteMap?.[b.id] ?? b.suggestedSprite ?? "";
    const tname = b.trainerName || b.name;
    const version = Number(b.version || 0);
    const built = buildTrainer({
      mode: "boss", displayName: b.name, ttype, tname, version,
      double: !!b.double, intro: b.intro?.length ? b.intro : ["¡A luchar!"],
      after: b.after?.length ? b.after : ["..."],
      sprite, dir: b.dir || 2,
    });
    events.push({ key: `boss:${b.id}`, x: b.x, y: b.y, name: built.name, pages: built.pages });
    trainerEntries.push(formatTrainerEntry({
      type: ttype, name: tname, version,
      loseText: b.loseText || "", items: (b.items || []).join(","),
      team: b.team,
    }));
  }
  for (const e of pack.extras || []) {
    let built = null;
    if (e.kind === "healer") built = buildTemplate("heal", { name: e.name || "Curandera", sprite: e.sprite ?? "", greet: e.greet, healed: e.healed, no: e.no });
    else if (e.kind === "sign") built = buildTemplate("sign", { name: e.name || "Cartel", lines: e.lines });
    else if (e.kind === "item") built = buildTemplate("item", { item: e.item, qty: e.qty || 1, graphic: e.graphic ?? "" });
    else if (e.kind === "mart") built = buildTemplate("mart", { name: e.name || "Dependiente", sprite: e.sprite ?? "", greet: e.greet, stock: e.stock });
    else if (e.kind === "gift") built = buildTemplate("gift", { name: e.name, sprite: e.sprite ?? "", species: e.species, level: e.level, before: e.before, after: e.after, full: e.full });
    if (built) events.push({ key: `extra:${e.kind}:${e.x},${e.y}`, x: e.x, y: e.y, name: built.name, pages: built.pages });
  }
  // salida del hub (vuelve al sur de la puerta que llevó hasta aquí)
  const back = buildTemplate("transfer", {
    name: pack.hub.exitName || "Volver",
    map: opts.doorMap, x: opts.doorX, y: Number(opts.doorY) + 1,
  });
  events.push({ key: "hub:exit", x: sx, y: sy, name: back.name, pages: back.pages });
  // puerta en el mapa existente (texto + viaje al hub)
  const doorText = pack.door?.text || `Un brillo extraño… ¿Entrar a ${hub.name}?`;
  const door = {
    name: pack.door?.name || hub.name,
    pages: [evPage({
      gfx: evGraphic(opts.doorSprite ?? pack.door?.sprite ?? "", 0, 2, 1),
      list: [
        ...textCmds([doorText]),
        evCmd(201, [0, hubId, landing.x, landing.y, 2, 0]),
        evCmd(0),
      ],
    })],
  };
  const metadataBody = [
    `Name = ${hub.name}`,
    "Outdoor = true",
    "ShowArea = true",
    "Bicycle = true",
    `MapPosition = ${opts.region},${opts.townX},${opts.townY}`,
    `HealingSpot = ${hubId},${landing.x},${landing.y}`,
  ].join("\n");
  const townPoint = {
    x: opts.townX, y: opts.townY, name: hub.name, poi: hub.poi || "",
    flyMap: "", flyX: "", flyY: "", sw: "",
  };
  return {
    hubId, hubName: hub.name, W, H, spawn: { x: sx, y: sy }, landing,
    tilesetId: Number(opts.tilesetId) || 1,
    events, trainerEntries,
    door: { map: opts.doorMap, x: opts.doorX, y: opts.doorY, ...door },
    metadataBody, townPoint,
    manifest: {
      pack: pack.pack || "pack", title: pack.title || "", ts: new Date().toISOString(),
      hubId, hubName: hub.name,
      doorMap: opts.doorMap, doorX: opts.doorX, doorY: opts.doorY, doorEventId: 0,
      trainerHeaders: trainerEntries.map((e) => e.header),
      metadataHeader: `[${hubId}]`, region: opts.region, townX: opts.townX, townY: opts.townY,
    },
  };
}
