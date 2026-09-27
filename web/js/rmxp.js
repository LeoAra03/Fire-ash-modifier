// ============================================================================
// rmxp.js — Modelos RPG Maker XP sobre marshal.js (lectura/escritura in-place)
// ----------------------------------------------------------------------------
// Todo se edita SOBRE la estructura parseada (sin reconstruir), así el guardado
// conserva intacto lo que no tocaste. Los helpers leen/escriben ivars.
// ============================================================================
import { RString, RObject, RUserDef, RHash, RSymbol, RFloat } from "./marshal.js";

// --- Table (RGSS) ---------------------------------------------------------------
// Binario: int32 dim, x, y, z, size + int16LE[size]  (verificado en mkxp table.cpp)
export function tableFromUserDef(ud) {
  if (!(ud instanceof RUserDef) || ud.className !== "Table") {
    throw new Error("Se esperaba UserDef Table");
  }
  const dv = new DataView(ud.bytes.buffer, ud.bytes.byteOffset, ud.bytes.byteLength);
  const dim = dv.getInt32(0, true);
  const x = dv.getInt32(4, true), y = dv.getInt32(8, true), z = dv.getInt32(12, true);
  const size = dv.getInt32(16, true);
  if (size !== x * y * z) throw new Error(`Table corrupta: size=${size} x*y*z=${x * y * z}`);
  const data = new Uint16Array(x * y * z);
  for (let i = 0; i < size; i++) data[i] = dv.getUint16(20 + i * 2, true);
  return { dim, x, y, z, data };
}

export function tableToUserDef(t) {
  const buf = new ArrayBuffer(20 + t.data.length * 2);
  const dv = new DataView(buf);
  dv.setInt32(0, t.dim, true);
  dv.setInt32(4, t.x, true);
  dv.setInt32(8, t.y, true);
  dv.setInt32(12, t.z, true);
  dv.setInt32(16, t.data.length, true);
  for (let i = 0; i < t.data.length; i++) dv.setUint16(20 + i * 2, t.data[i], true);
  return new RUserDef("Table", new Uint8Array(buf));
}

export const tableGet = (t, x, y, z = 0) =>
  (x < 0 || y < 0 || z < 0 || x >= t.x || y >= t.y || z >= t.z) ? 0 : t.data[x + t.x * (y + t.y * z)];
export const tableSet = (t, x, y, z, v) => {
  if (x < 0 || y < 0 || z < 0 || x >= t.x || y >= t.y || z >= t.z) return;
  t.data[x + t.x * (y + t.y * z)] = v & 0xffff;
};

// --- Strings --------------------------------------------------------------------
export const rstr = (v) => (v instanceof RString ? v.text : v === null || v === undefined ? "" : String(v));
export function setRstr(obj, ivar, text) {
  const cur = obj.getIvar(ivar);
  if (cur instanceof RString) cur.text = text;
  else obj.setIvar(ivar, RString.fromText(text));
}

// --- MapInfos --------------------------------------------------------------------
export function mapListFromInfos(infosHash) {
  // RHash id(int) => RPG::MapInfo
  const list = [];
  for (const [k, info] of infosHash.pairs) {
    list.push({
      id: Number(k),
      name: rstr(info.getIvar("name")) || `Mapa ${k}`,
      parent: Number(info.getIvar("parent_id") || 0),
      order: Number(info.getIvar("order") || 0),
      obj: info,
    });
  }
  return list;
}

export function mapTree(list) {
  // Ordena por (order) dentro de cada padre, como el editor.
  const byParent = new Map();
  for (const m of list) {
    if (!byParent.has(m.parent)) byParent.set(m.parent, []);
    byParent.get(m.parent).push(m);
  }
  for (const arr of byParent.values()) arr.sort((a, b) => a.order - b.order || a.id - b.id);
  const out = [];
  const walk = (pid, depth) => {
    for (const m of byParent.get(pid) || []) {
      out.push({ ...m, depth });
      walk(m.id, depth + 1);
    }
  };
  walk(0, 0);
  // Huérfanos (padre inexistente)
  const seen = new Set(out.map((m) => m.id));
  for (const m of list) if (!seen.has(m.id)) out.push({ ...m, depth: 0, orphan: true });
  return out;
}

// --- Mapa ------------------------------------------------------------------------
export function parseMap(mapObj) {
  const dataUd = mapObj.getIvar("data");
  const table = tableFromUserDef(dataUd);
  const evHash = mapObj.getIvar("events");
  const events = [];
  if (evHash instanceof RHash) {
    for (const [k, ev] of evHash.pairs) events.push({ id: Number(k), obj: ev });
  }
  events.sort((a, b) => a.id - b.id);
  return {
    obj: mapObj,
    tilesetId: Number(mapObj.getIvar("tileset_id") || 1),
    width: Number(mapObj.getIvar("width") || 0),
    height: Number(mapObj.getIvar("height") || 0),
    table,
    tableUd: dataUd,
    events,
    bgm: mapObj.getIvar("bgm"),
    bgs: mapObj.getIvar("bgs"),
  };
}

export function commitMapTable(parsed) {
  parsed.obj.setIvar("data", tableToUserDef(parsed.table));
}

// --- Eventos -----------------------------------------------------------------------
export function parseEvent(evObj) {
  const pages = (evObj.getIvar("pages") || []).map((p, i) => parsePage(p, i));
  return {
    obj: evObj,
    id: Number(evObj.getIvar("id") || 0),
    name: rstr(evObj.getIvar("name")),
    x: Number(evObj.getIvar("x") || 0),
    y: Number(evObj.getIvar("y") || 0),
    pages,
  };
}

export function parsePage(pageObj, index) {
  const cond = pageObj.getIvar("condition");
  const graphic = pageObj.getIvar("graphic");
  const route = pageObj.getIvar("move_route");
  return {
    obj: pageObj,
    index,
    condition: cond ? {
      obj: cond,
      switch1: cond.getIvar("switch1_valid") ? Number(cond.getIvar("switch1_id")) : 0,
      switch2: cond.getIvar("switch2_valid") ? Number(cond.getIvar("switch2_id")) : 0,
      selfSwitch: cond.getIvar("self_switch_valid") ? rstr(cond.getIvar("self_switch_ch")) : "",
      variable: cond.getIvar("variable_valid") ? { id: Number(cond.getIvar("variable_id")), value: Number(cond.getIvar("variable_value")) } : null,
    } : null,
    graphic: graphic ? {
      obj: graphic,
      tileId: Number(graphic.getIvar("tile_id") || 0),
      charName: rstr(graphic.getIvar("character_name")),
      direction: Number(graphic.getIvar("direction") ?? 2),
      pattern: Number(graphic.getIvar("pattern") ?? 1),
      opacity: Number(graphic.getIvar("opacity") ?? 255),
    } : null,
    moveType: Number(pageObj.getIvar("move_type") || 0),
    moveSpeed: Number(pageObj.getIvar("move_speed") || 3),
    moveFreq: Number(pageObj.getIvar("move_frequency") || 3),
    moveRoute: route || null,
    walkAnime: !!pageObj.getIvar("walk_anime"),
    stepAnime: !!pageObj.getIvar("step_anime"),
    dirFix: !!pageObj.getIvar("direction_fix"),
    through: !!pageObj.getIvar("through"),
    alwaysTop: !!pageObj.getIvar("always_on_top"),
    trigger: Number(pageObj.getIvar("trigger") || 0),
    list: pageObj.getIvar("list") || [],
  };
}

export const TRIGGERS = ["Acción (tecla)", "Tocar jugador", "Tocar evento", "Automático", "Proceso paralelo"];
export const MOVE_TYPES = ["Fijo", "Aleatorio", "Acercar", "Personalizado"];

// --- Comandos de evento --------------------------------------------------------------
export function cmdOf(o) {
  return { code: Number(o.getIvar("code")), indent: Number(o.getIvar("indent") || 0), params: o.getIvar("parameters") || [], obj: o };
}

const DIR_NAMES = { 2: "abajo", 4: "izq.", 6: "der.", 8: "arriba" };

// Tabla de comandos RMXP → español. detail(params) devuelve texto corto.
export const COMMANDS = {
  101: { t: "Mostrar texto", d: (p) => faceInfo(p) },
  401: { t: "Texto", d: (p) => trunc(rstr(p[0])) },
  102: { t: "Mostrar opciones", d: (p) => (p[0] || []).map(rstr).join(" / ") },
  402: { t: "Cuando: …", d: (p) => trunc(rstr(p[1] ?? p[0])) },
  403: { t: "Cuando se cancela", d: () => "" },
  404: { t: "Fin de opciones", d: () => "" },
  103: { t: "Entrada numérica", d: (p) => `${p[0]} dígitos → Variable[${p[1]}]` },
  105: { t: "Entrada de botón", d: (p) => `→ Variable[${p[0]}]` },
  106: { t: "Esperar", d: (p) => `${p[0]} frames` },
  108: { t: "Comentario", d: (p) => trunc(rstr(p[0])) },
  408: { t: "Comentario…", d: (p) => trunc(rstr(p[0])) },
  111: { t: "Condición", d: condBranchText },
  411: { t: "Si no", d: () => "" },
  412: { t: "Fin de condición", d: () => "" },
  112: { t: "Bucle", d: () => "" },
  413: { t: "Repetir", d: () => "" },
  113: { t: "Romper bucle", d: () => "" },
  115: { t: "Terminar proceso", d: () => "" },
  116: { t: "Borrar evento", d: () => "" },
  117: { t: "Llamar evento común", d: (p) => `ID ${p[0]}` },
  118: { t: "Etiqueta", d: (p) => rstr(p[0]) },
  119: { t: "Saltar a etiqueta", d: (p) => rstr(p[0]) },
  121: { t: "Interruptor", d: (p) => swRange(p) },
  122: { t: "Variable", d: varText },
  123: { t: "Self-switch", d: (p) => `${rstr(p[0])} = ${p[1] ? "ON" : "OFF"}` },
  124: { t: "Temporizador", d: (p) => (p[0] ? `ON ${p[1]}s` : "OFF") },
  125: { t: "Dinero", d: (p) => `${p[0] ? "−" : "+"} ${operand(p, 1)}` },
  126: { t: "Objeto", d: (p) => itemChange(p) },
  127: { t: "Arma", d: (p) => itemChange(p) },
  128: { t: "Armadura", d: (p) => itemChange(p) },
  129: { t: "Miembro del equipo", d: (p) => `${rstr(p[0])} ${p[1] ? "sale" : "entra"}` },
  201: { t: "Teletransportar", d: transferText },
  202: { t: "Posicionar evento", d: (p) => setEventLocText(p) },
  203: { t: "Desplazar mapa", d: (p) => `dir ${p[0]} × ${p[1]} @${p[2]}` },
  204: { t: "Ajustes de mapa", d: () => "panorama/nubes/niebla" },
  205: { t: "Niebla", d: () => "" },
  206: { t: "An. batalla / clima", d: () => "" },
  208: { t: "Transparente", d: (p) => (p[0] ? "ON" : "OFF") },
  209: { t: "Ruta de movimiento", d: (p) => `ev ${p[0]}` },
  210: { t: "Esperar movimiento", d: () => "" },
  221: { t: "Preparar transición", d: () => "" },
  222: { t: "Ejecutar transición", d: (p) => rstr(p[0]) },
  231: { t: "Mostrar imagen", d: (p) => `#${p[0]} ${rstr(p[1])}` },
  232: { t: "Mover imagen", d: (p) => `#${p[0]}` },
  233: { t: "Rotar imagen", d: (p) => `#${p[0]}` },
  234: { t: "Tono de imagen", d: (p) => `#${p[0]}` },
  235: { t: "Borrar imagen", d: (p) => `#${p[0]}` },
  236: { t: "Clima", d: (p) => ["Nada", "Lluvia", "Tormenta", "Nieve"][p[0]] || p[0] },
  241: { t: "BGM", d: (p) => audioName(p[0]) },
  242: { t: "Fundir BGM", d: (p) => `${p[0]}s` },
  243: { t: "Memorizar BGM/BGS", d: () => "" },
  244: { t: "BGS", d: (p) => audioName(p[0]) },
  245: { t: "Fundir BGS", d: (p) => `${p[0]}s` },
  246: { t: "ME", d: (p) => audioName(p[0]) },
  247: { t: "SE", d: (p) => audioName(p[0]) },
  248: { t: "Parar SE", d: () => "" },
  249: { t: "Reproducir BGM/BGS", d: () => "" },
  301: { t: "Batalla", d: (p) => battleText(p) },
  302: { t: "Tienda", d: (p) => `${(p[0] || []).length} artículos` },
  303: { t: "Nombre del héroe", d: (p) => `actor ${p[0]}, ${p[1]} letras` },
  311: { t: "Cambiar HP", d: (p) => charStat(p, "HP") },
  312: { t: "Cambiar SP", d: (p) => charStat(p, "SP") },
  313: { t: "Cambiar estado", d: (p) => `estado ${p[3]}` },
  314: { t: "Recuperar todo", d: (p) => `actor ${p[0]}` },
  315: { t: "Cambiar EXP", d: (p) => charStat(p, "EXP") },
  316: { t: "Cambiar nivel", d: (p) => charStat(p, "Nv") },
  317: { t: "Cambiar parámetro", d: (p) => `param ${p[3]}` },
  318: { t: "Cambiar habilidad", d: (p) => `hab ${p[3]}` },
  319: { t: "Cambiar equipo", d: (p) => `slot ${p[2]}` },
  320: { t: "Cambiar nombre", d: (p) => trunc(rstr(p[2])) },
  321: { t: "Cambiar clase", d: (p) => `clase ${p[2]}` },
  322: { t: "Cambiar gráfico", d: (p) => rstr(p[2]) },
  331: { t: "HP enemigo", d: (p) => `enemigo ${p[0]}` },
  332: { t: "SP enemigo", d: (p) => `enemigo ${p[0]}` },
  333: { t: "Estado enemigo", d: (p) => `estado ${p[2]}` },
  334: { t: "Recuperar enemigo", d: (p) => `enemigo ${p[0]}` },
  335: { t: "Aparecer enemigo", d: (p) => `enemigo ${p[0]}` },
  336: { t: "Transformar enemigo", d: (p) => `→ ${p[1]}` },
  337: { t: "Animación batalla", d: (p) => `anim ${p[1]}` },
  339: { t: "Forzar acción", d: () => "" },
  340: { t: "Abortar batalla", d: () => "" },
  351: { t: "Abrir menú", d: () => "" },
  352: { t: "Abrir guardado", d: () => "" },
  353: { t: "Game Over", d: () => "" },
  354: { t: "Volver al título", d: () => "" },
  355: { t: "Script", d: (p) => trunc(rstr(p[0]), 90) },
  655: { t: "Script…", d: (p) => trunc(rstr(p[0]), 90) },
  0: { t: "Fin", d: () => "" },
};

export function humanizeCommand(code, params) {
  const c = COMMANDS[code];
  if (!c) return { title: `Comando ${code}`, detail: "", known: false };
  let detail = "";
  try { detail = c.d(params) || ""; } catch { detail = ""; }
  return { title: c.t, detail, known: true };
}

function trunc(s, n = 60) {
  s = String(s ?? "");
  return s.length > n ? s.slice(0, n) + "…" : s;
}
function faceInfo(p) {
  const bits = [];
  if (rstr(p[0])) bits.push("cara: " + rstr(p[0]));
  if (p[2] === 1) bits.push("tenue");
  if (p[2] === 2) bits.push("transparente");
  if (p[3] === 0) bits.push("arriba");
  if (p[3] === 1) bits.push("medio");
  return bits.join(" · ");
}
function swRange(p) {
  const a = p[0], b = p[1], v = p[2] ? "ON" : "OFF";
  return a === b ? `Interruptor[${a}] = ${v}` : `Interruptores[${a}-${b}] = ${v}`;
}
function operand(p, i) {
  if (p[i] === 0) return String(p[i + 1]);
  if (p[i] === 1) return `Variable[${p[i + 1]}]`;
  return "?";
}
function varText(p) {
  const ops = ["=", "+=", "−=", "×=", "÷=", "%="];
  const rng = p[0] === p[1] ? `Variable[${p[0]}]` : `Variables[${p[0]}-${p[1]}]`;
  const op = ops[p[2]] ?? "?";
  let rhs = "?";
  const t = p[3];
  if (t === 0) rhs = String(p[4]);
  else if (t === 1) rhs = `Variable[${p[4]}]`;
  else if (t === 2) rhs = `azar(${p[4]}..${p[5]})`;
  else if (t === 3) rhs = `ítem ${p[4]}`;
  else if (t === 4) rhs = `actor ${p[4]} dato ${p[5]}`;
  else if (t === 5) rhs = `enemigo ${p[4]} dato ${p[5]}`;
  else if (t === 6) rhs = `personaje ${p[4]} dato ${p[5]}`;
  else if (t === 7) rhs = "otros…";
  return `${rng} ${op} ${rhs}`;
}
function itemChange(p) {
  return `id ${p[0]} ${p[1] ? "−" : "+"} ${operand(p, 2)}`;
}
function transferText(p) {
  if (p[0] === 0) return `Mapa ${p[1]} (${p[2]},${p[3]}) ${DIR_NAMES[p[4]] || ""}`;
  return `Mapa V[${p[1]}] (V[${p[2]}],V[${p[3]}])`;
}
function setEventLocText(p) {
  if (p[1] === 0) return `ev ${p[0]} → (${p[2]},${p[3]})`;
  if (p[1] === 1) return `ev ${p[0]} ⇄ ev ${p[2]}`;
  return `ev ${p[0]} → V[${p[2]}],V[${p[3]}]`;
}
function audioName(o) {
  if (!o || typeof o.getIvar !== "function") return "";
  return rstr(o.getIvar("name"));
}
function battleText(p) {
  if (p[0] === 0) return `tropa ${p[1]}`;
  if (p[1] === 0) return `mapa ${p[1]}`;
  return `V[${p[1]}]`;
}
function charStat(p, what) {
  return `${what} obj ${p[0]} ${p[2] ? "−" : "+"} ${operand(p, 3)}`;
}
function condBranchText(p) {
  const t = p[0];
  try {
    switch (t) {
      case 0: return `Interruptor[${p[1]}] ${p[2] ? "ON" : "OFF"}`;
      case 1: {
        const ops = ["==", "≥", "≤", ">", "<", "≠"];
        return `Variable[${p[1]}] ${ops[p[2]] ?? "?"} ${p[3] === 0 ? p[4] : "V[" + p[4] + "]"}`;
      }
      case 2: return `Self-switch ${rstr(p[1])} ${p[2] ? "ON" : "OFF"}`;
      case 3: return `Temporizador ${p[2] ? "≤" : "≥"} ${p[1]}s`;
      case 4: return `Actor ${p[1]}…`;
      case 5: return `Enemigo ${p[1]}…`;
      case 6: return `Personaje ${p[1]} mira ${DIR_NAMES[p[2]] || p[2]}`;
      case 7: return `Dinero ${p[2] ? "≤" : "≥"} ${p[1]}`;
      case 8: return `Tiene ítem ${p[1]}`;
      case 9: return `Tiene arma ${p[1]}`;
      case 10: return `Tiene armadura ${p[1]}`;
      case 11: return `Botón ${["", "abajo", "izq.", "der.", "arriba", "A", "B", "C", "X", "Y", "Z", "L", "R"][p[1]] || p[1]}`;
      case 12: return `Script: ${trunc(rstr(p[1]), 50)}`;
      default: return `tipo ${t}`;
    }
  } catch { return ""; }
}

// --- Texto editable de un comando -----------------------------------------------
export const EDITABLE_TEXT = new Set([401, 102, 402, 108, 408, 355, 655, 118, 119, 320, 122]);
export function getCommandStrings(code, params) {
  // Devuelve lista de {i, sub, rstring} editables dentro de params (normalmente 1)
  const out = [];
  const push = (i, sub = -1) => {
    const v = sub >= 0 ? params[i]?.[sub] : params[i];
    if (v instanceof RString) out.push({ i, sub, rs: v });
  };
  switch (code) {
    case 401: case 108: case 408: case 355: case 655: case 118: case 119: case 320:
      push(code === 320 ? 2 : 0); break;
    case 102:
      (params[0] || []).forEach((_, s) => push(0, s));
      break;
    case 402: push(1); break;
  }
  return out;
}

// --- Tilesets ----------------------------------------------------------------------
export function parseTileset(tsObj) {
  const passages = tableFromUserDef(tsObj.getIvar("passages"));
  const priorities = tableFromUserDef(tsObj.getIvar("priorities"));
  let terrain = null;
  try { terrain = tableFromUserDef(tsObj.getIvar("terrain_tags")); } catch { /* algunos juegos no lo usan igual */ }
  return {
    obj: tsObj,
    id: Number(tsObj.getIvar("id")),
    name: rstr(tsObj.getIvar("name")),
    tilesetName: rstr(tsObj.getIvar("tileset_name")),
    autotiles: (tsObj.getIvar("autotile_names") || []).map(rstr),
    passages, priorities, terrain,
  };
}

// --- System (nombres de interruptores/variables) -----------------------------------
export function systemNames(sysObj) {
  const sw = (sysObj.getIvar("switches") || []).map((s) => rstr(s));
  const va = (sysObj.getIvar("variables") || []).map((s) => rstr(s));
  return { switches: sw, variables: va };
}
export function setSystemName(sysObj, kind, id, name) {
  const arr = sysObj.getIvar(kind === "sw" ? "switches" : "variables");
  if (!arr || !arr[id]) return false;
  if (arr[id] instanceof RString) arr[id].text = name;
  else arr[id] = RString.fromText(name);
  return true;
}

// --- Búsqueda de usos de flags en un mapa ------------------------------------------
export function findFlagUsesInMap(parsedMap, kind, id) {
  // kind: "sw" | "var" | "self"
  const uses = [];
  for (const { id: evId, obj: evObj } of parsedMap.events) {
    const ev = parseEvent(evObj);
    for (const page of ev.pages) {
      const c = page.condition;
      if (c) {
        if (kind === "sw" && (c.switch1 === id || c.switch2 === id)) {
          uses.push({ evId, evName: ev.name, page: page.index, where: "Condición de página" });
        }
        if (kind === "var" && c.variable && c.variable.id === id) {
          uses.push({ evId, evName: ev.name, page: page.index, where: "Condición de página (variable)" });
        }
      }
      for (const cmdObj of page.list) {
        const { code, params } = cmdOf(cmdObj);
        if (kind === "sw" && code === 121 && id >= params[0] && id <= params[1]) {
          uses.push({ evId, evName: ev.name, page: page.index, where: `Control: Switch[${id}]` });
        }
        if (kind === "sw" && code === 111 && params[0] === 0 && params[1] === id) {
          uses.push({ evId, evName: ev.name, page: page.index, where: `Condición: Switch[${id}]` });
        }
        if (kind === "var" && code === 122 && id >= params[0] && id <= params[1]) {
          uses.push({ evId, evName: ev.name, page: page.index, where: `Control: Variable[${id}]` });
        }
        if (kind === "var" && code === 111 && params[0] === 1 && params[1] === id) {
          uses.push({ evId, evName: ev.name, page: page.index, where: `Condición: Variable[${id}]` });
        }
      }
    }
  }
  return uses;
}
