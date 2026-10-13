// ============================================================================
// render.js — Renderizado de mapas RMXP en <canvas> (idéntico a mkxp/Kirin)
// ----------------------------------------------------------------------------
// - Tiles normales: rejilla 8 columnas de 32x32 desde id 384.
// - Autotiles: IDs 48..383 (7 autotiles × 48 patrones), 4 piezas de 16x16
//   con la tabla EXACTA de mkxp (ver autotiles.cpp, motor base de Kirin).
// - IDs 0..47: vacío (igual que mkxp).
// ============================================================================
import { tableGet } from "./rmxp.js";

// Tabla EXACTA de autotiles de mkxp. 48 patrones × 4 piezas [TL,TR,BL,BR],
// cada pieza es [sx,sy] de un bloque 16x16 dentro del PNG del autotile.
export const AUTOTILE_RECTS = [
  [[32,64], [48,64], [32,80], [48,80]], // patron 0
  [[64,0], [48,64], [32,80], [48,80]], // patron 1
  [[32,64], [80,0], [32,80], [48,80]], // patron 2
  [[64,0], [80,0], [32,80], [48,80]], // patron 3
  [[32,64], [48,64], [32,80], [80,16]], // patron 4
  [[64,0], [48,64], [32,80], [80,16]], // patron 5
  [[32,64], [80,0], [32,80], [80,16]], // patron 6
  [[64,0], [80,0], [32,80], [80,16]], // patron 7
  [[32,64], [48,64], [64,16], [48,80]], // patron 8
  [[64,0], [48,64], [64,16], [48,80]], // patron 9
  [[32,64], [80,0], [64,16], [48,80]], // patron 10
  [[64,0], [80,0], [64,16], [48,80]], // patron 11
  [[32,64], [48,64], [64,16], [80,16]], // patron 12
  [[64,0], [48,64], [64,16], [80,16]], // patron 13
  [[32,64], [80,0], [64,16], [80,16]], // patron 14
  [[64,0], [80,0], [64,16], [80,16]], // patron 15
  [[0,64], [16,64], [0,80], [16,80]], // patron 16
  [[0,64], [80,0], [0,80], [16,80]], // patron 17
  [[0,64], [16,64], [0,80], [80,16]], // patron 18
  [[0,64], [80,0], [0,80], [80,16]], // patron 19
  [[32,32], [48,32], [32,48], [48,48]], // patron 20
  [[32,32], [48,32], [32,48], [80,16]], // patron 21
  [[32,32], [48,32], [64,16], [48,48]], // patron 22
  [[32,32], [48,32], [64,16], [80,16]], // patron 23
  [[64,64], [80,64], [64,80], [80,80]], // patron 24
  [[64,64], [80,64], [64,16], [80,80]], // patron 25
  [[64,0], [80,64], [64,80], [80,80]], // patron 26
  [[64,0], [80,64], [64,16], [80,80]], // patron 27
  [[32,96], [48,96], [32,112], [48,112]], // patron 28
  [[64,0], [48,96], [32,112], [48,112]], // patron 29
  [[32,96], [80,0], [32,112], [48,112]], // patron 30
  [[64,0], [80,0], [32,112], [48,112]], // patron 31
  [[0,64], [80,64], [0,80], [80,80]], // patron 32
  [[32,32], [48,32], [32,112], [48,112]], // patron 33
  [[0,32], [16,32], [0,48], [16,48]], // patron 34
  [[0,32], [16,32], [0,48], [80,16]], // patron 35
  [[64,32], [80,32], [64,48], [80,48]], // patron 36
  [[64,32], [80,32], [64,16], [80,48]], // patron 37
  [[64,96], [80,96], [64,112], [80,112]], // patron 38
  [[64,0], [80,96], [64,112], [80,112]], // patron 39
  [[0,96], [16,96], [0,112], [16,112]], // patron 40
  [[0,96], [80,0], [0,112], [16,112]], // patron 41
  [[0,32], [80,32], [0,48], [80,48]], // patron 42
  [[0,32], [16,32], [0,112], [16,112]], // patron 43
  [[0,96], [80,96], [0,112], [80,112]], // patron 44
  [[64,32], [80,32], [64,112], [80,112]], // patron 45
  [[0,32], [80,32], [0,112], [80,112]], // patron 46
  [[0,0], [16,0], [0,16], [16,16]], // patron 47
];

const TILE = 32;

// Límite de lienzo de WebKit/Safari (móvil): 16 777 216 px de área y 8192 por
// eje. Un mapa de 5 760x5 600 px son 32,3 Mpx: en el móvil el lienzo sale NEGRO
// (o directamente no se pinta). Para esos mapas se devuelve `mode: "viewport"`:
// el editor dibuja solo la parte visible en un lienzo pequeño.
const MAX_CANVAS_PX = 16777216;
const MAX_CANVAS_AXIS = 8192;

// Colores del «vacío» (casilla sin ningún tile). NO es negro puro a propósito:
// un hueco del mapa tiene que distinguirse de un tile que de verdad es negro.
const VOID_BG = "#161a22";
const VOID_ALT = "#1d222c";
let _voidTile = null;
function voidPattern(ctx) {
  if (!_voidTile) {
    _voidTile = document.createElement("canvas");
    _voidTile.width = 16;
    _voidTile.height = 16;
    const c = _voidTile.getContext("2d");
    if (c) {
      c.fillStyle = VOID_BG;
      c.fillRect(0, 0, 16, 16);
      c.fillStyle = VOID_ALT;
      c.fillRect(0, 0, 8, 8);
      c.fillRect(8, 8, 8, 8);
    }
  }
  try { return ctx.createPattern(_voidTile, "repeat"); } catch { return VOID_BG; }
}

/**
 * Renderiza un mapa RMXP.
 *
 * - Mapas que caben en el límite de lienzo: un único canvas 1:1 (`mode:"static"`).
 * - Mapas enormes (más de 16,7 Mpx): `mode:"viewport"`; se usa `paint(ctx,ox,oy,w,h)`
 *   para dibujar la parte visible en un canvas pequeño (el llamador lo rellena al
 *   hacer scroll). Así ningún mapa queda negro en el móvil.
 *
 * @param {object} parsed mapa parseado (parseMap)
 * @param {object} tileset tileset parseado (parseTileset)
 * @param {object} gfx { tileset: HTMLImage/Canvas|null, autotiles: [7 imgs], characters: Map nombre->img }
 * @param {object} opts { showEvents:true, ghostEvents:false, passageOverlay:false, forceViewport:false }
 * @returns {{mode, canvas, width, height, oversized, paint, eventsBelow, eventsOnTop}}
 */
export function renderMap(parsed, tileset, gfx, opts = {}) {
  const { width, height } = parsed;
  const totalW = Math.max(1, width * TILE);
  const totalH = Math.max(1, height * TILE);
  const cabe = totalW * totalH <= MAX_CANVAS_PX && totalW <= MAX_CANVAS_AXIS && totalH <= MAX_CANVAS_AXIS;
  const paint = (ctx, ox, oy, w, h) => paintRect(ctx, parsed, tileset, gfx, opts, ox, oy, w, h);
  // Los eventos se dibujan entre el suelo y los tiles con prioridad (igual que
  // el motor): `eventsBelow` los lleva todos y `eventsOnTop` va vacío.
  const eventos = { eventsBelow: parsed.events, eventsOnTop: [] };

  if (opts.forceViewport === true || !cabe) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(totalW, 1024);
    canvas.height = Math.min(totalH, 1024);
    return { mode: "viewport", canvas, width: totalW, height: totalH, oversized: true, paint, ...eventos };
  }

  const canvas = document.createElement("canvas");
  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.imageSmoothingEnabled = false;
    paint(ctx, 0, 0, totalW, totalH);
  }
  return { mode: "static", canvas, width: totalW, height: totalH, oversized: false, paint, ...eventos };
}

/** Dibuja el rectángulo [ox,oy,w,h] del mapa (coordenadas del mapa, 1:1). */
function paintRect(ctx, parsed, tileset, gfx, opts, ox, oy, w, h) {
  const { table, width, height } = parsed;
  const x0 = Math.max(0, Math.floor(ox / TILE) - 1);
  const y0 = Math.max(0, Math.floor(oy / TILE) - 1);
  const x1 = Math.min(width - 1, Math.floor((ox + w - 1) / TILE) + 1);
  const y1 = Math.min(height - 1, Math.floor((oy + h - 1) / TILE) + 1);
  const prioOf = (tileId) => {
    if (!tileset || !tileset.priorities || tileId < 384) return 0;
    const idx = tileId - 384;
    if (idx >= tileset.priorities.data.length) return 0;
    return tileset.priorities.data[idx];
  };

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, -ox, -oy);
  // Fondo de casilla vacía (cuadros oscuros, nunca negro puro)
  const pat = voidPattern(ctx);
  ctx.fillStyle = pat;
  ctx.fillRect(ox, oy, w, h);

  // Pasada 1: tiles con prioridad 0 (suelo) en las 3 capas
  for (let z = 0; z < 3; z++) {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const id = tableGet(table, x, y, z);
        if (id < 48) continue;
        if (id >= 384 && prioOf(id) > 0) continue; // a la pasada 2
        drawTile(ctx, id, x, y, gfx, tileset);
      }
    }
  }

  // Eventos (entre el suelo y los tiles con prioridad, como el motor)
  if (opts.showEvents !== false) {
    for (const { obj: evObj } of parsed.events) {
      const ex = Number(evObj.getIvar("x") ?? 0), ey = Number(evObj.getIvar("y") ?? 0);
      if (ex < x0 - 2 || ex > x1 + 2 || ey < y0 - 3 || ey > y1 + 2) continue;
      drawEvent(ctx, evObj, gfx, opts);
    }
  }

  // Pasada 2: tiles con prioridad > 0 (encima de eventos, como tejados)
  for (let z = 0; z < 3; z++) {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const id = tableGet(table, x, y, z);
        if (id < 384) continue;
        if (prioOf(id) > 0) drawTile(ctx, id, x, y, gfx, tileset);
      }
    }
  }

  if (opts.passageOverlay && tileset?.passages) {
    drawPassageOverlay(ctx, parsed, tileset, x0, y0, x1, y1);
  }
  ctx.restore();
}

function drawTile(ctx, id, x, y, gfx, tileset) {
  const dx = x * TILE, dy = y * TILE;
  if (id >= 384) {
    const idx = id - 384;
    const img = gfx.tileset;
    if (!img) { placeholder(ctx, dx, dy, "T"); return; }
    const sx = (idx % 8) * TILE;
    const sy = Math.floor(idx / 8) * TILE;
    if (sy + TILE > img.height || sx + TILE > img.width) { placeholder(ctx, dx, dy, idx); return; }
    ctx.drawImage(img, sx, sy, TILE, TILE, dx, dy, TILE, TILE);
    return;
  }
  // Autotile: 48..383
  const atInd = Math.floor(id / 48) - 1;
  const sub = id % 48;
  const img = gfx.autotiles?.[atInd];
  if (!img) { placeholder(ctx, dx, dy, "A" + atInd); return; }
  const rects = AUTOTILE_RECTS[sub];
  // frame 0 (los PNG animados tienen frames de 96px; usamos el primero)
  const dest = [[dx, dy], [dx + 16, dy], [dx, dy + 16], [dx + 16, dy + 16]];
  for (let i = 0; i < 4; i++) {
    const [sx, sy] = rects[i];
    if (sx + 16 > img.width || sy + 16 > img.height) continue;
    ctx.drawImage(img, sx, sy, 16, 16, dest[i][0], dest[i][1], 16, 16);
  }
}

function placeholder(ctx, dx, dy, label) {
  ctx.fillStyle = "#3a2b5c";
  ctx.fillRect(dx, dy, TILE, TILE);
  ctx.strokeStyle = "#7c5cff";
  ctx.strokeRect(dx + 0.5, dy + 0.5, TILE - 1, TILE - 1);
  ctx.fillStyle = "#cbb8ff";
  ctx.font = "9px monospace";
  ctx.fillText(String(label), dx + 3, dy + 18);
}

function drawEvent(ctx, evObj, gfx, opts) {
  const pages = evObj.getIvar("pages") || [];
  if (!pages.length) return;
  // Usa la primera página con gráfico (aproximación de editor)
  let g = null;
  for (const p of pages) {
    const gg = p.getIvar("graphic");
    if (!gg) continue;
    const tileId = Number(gg.getIvar("tile_id") || 0);
    const name = charText(gg.getIvar("character_name"));
    if (tileId > 0 || (name && !esInvisible(name))) { g = gg; break; }
  }
  const x = Number(evObj.getIvar("x") || 0), y = Number(evObj.getIvar("y") || 0);
  const dx = x * TILE, dy = y * TILE;
  if (!g) {
    // Evento sin gráfico: marcador fantasma (no es un error)
    if (opts.ghostEvents) {
      ctx.fillStyle = "rgba(124,92,255,.25)";
      ctx.fillRect(dx, dy, TILE, TILE);
    }
    return;
  }
  const tileId = Number(g.getIvar("tile_id") || 0);
  if (tileId > 0) {
    drawTile(ctx, tileId, x, y, gfx);
    return;
  }
  const name = charText(g.getIvar("character_name"));
  // «invisible» es una convención del juego: el evento no dibuja nada. No es un
  // gráfico que falte, así que sale el mismo marcador fantasma y sin amarillo.
  if (esInvisible(name)) {
    if (opts.ghostEvents) {
      ctx.fillStyle = "rgba(124,92,255,.25)";
      ctx.fillRect(dx, dy, TILE, TILE);
    }
    return;
  }
  const img = name && gfx.characters?.get(name.toLowerCase());
  const dir = Number(g.getIvar("direction") ?? 2);
  const pat = Math.max(0, Math.min(3, Number(g.getIvar("pattern") ?? 0)));
  if (!img) {
    ctx.fillStyle = "rgba(255,200,60,.85)";
    ctx.beginPath();
    ctx.arc(dx + 16, dy + 16, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.font = "bold 11px monospace";
    ctx.fillText("!", dx + 12.5, dy + 20);
    return;
  }
  const fw = img.width / 4, fh = img.height / 4;
  const row = { 2: 0, 4: 1, 6: 2, 8: 3 }[dir] ?? 0;
  ctx.drawImage(img, pat * fw, row * fh, fw, fh, dx + 16 - fw / 2, dy + TILE - fh, fw, fh);
}

/** Un nombre de gráfico «invisible» (o vacío) significa: no dibujes nada. */
export function esInvisible(name) {
  return !name || name.toLowerCase() === "invisible";
}

function charText(v) {
  if (v === null || v === undefined) return "";
  return typeof v === "string" ? v : (v.text ?? String(v));
}

function drawPassageOverlay(ctx, parsed, tileset, x0 = 0, y0 = 0, x1 = parsed.width - 1, y1 = parsed.height - 1) {
  // X roja donde ninguna capa deja pasar (4-dir), aproximado con capa 0..2
  const { table } = parsed;
  ctx.fillStyle = "rgba(255,40,40,.28)";
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      let blocked = false;
      for (let z = 0; z < 3; z++) {
        const id = tableGet(table, x, y, z);
        if (id < 384) continue;
        const idx = id - 384;
        if (idx < tileset.passages.data.length && (tileset.passages.data[idx] & 0x0f) === 0x0f) {
          blocked = true; break;
        }
      }
      if (blocked) ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  }
}

// --- Miniatura de sprite de personaje ---------------------------------------------
export function drawCharacterPreview(canvas, img, direction = 2, pattern = 0) {
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!img) return;
  const fw = img.width / 4, fh = img.height / 4;
  const row = { 2: 0, 4: 1, 6: 2, 8: 3 }[direction] ?? 0;
  const scale = Math.min(canvas.width / fw, canvas.height / fh);
  const w = fw * scale, h = fh * scale;
  ctx.drawImage(img, pattern * fw, row * fh, fw, fh, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
}
