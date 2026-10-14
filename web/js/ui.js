// ============================================================================
// ui.js — Armazón: arranque, pestañas, Inicio y Mapas
// ============================================================================
import {
  S, log, connectDemo, connectBrowser, connectAndroid, connectFallback,
  loadMap, getTileset, saveAll, saveMap, undoEdit, redoEdit, clearEditHistory,
  emptyCellStats,
} from "./app.js";
import { FS } from "./fs.js";
import { parseEvent, parseMap } from "./rmxp.js";
import { renderMap, esInvisible } from "./render.js";
import { esc, fmtBytes, pad3 } from "./util.js";
import { toast, openModal, closeModal, showProgress, mapPickerModal, debounce } from "./helpers.js";
import { renderEventsTab, renderFlagsTab, renderNpcsTab, renderPbsTab, renderModsTab } from "./editors.js";
import { renderCreateTab } from "./createUI.js";

const TABS = [
  ["home", "⌂", "Inicio"],
  ["maps", "▦", "Mapas"],
  ["events", "≡", "Eventos"],
  ["flags", "►", "Flags"],
  ["npcs", "●", "NPCs"],
  ["pbs", "◉", "Pokémon"],
  ["create", "+", "Crear"],
  ["mods", "◆", "Mods"],
];
let currentTab = "";
const HISTORY_TABS = new Set(["events", "flags", "npcs", "pbs"]);

export function boot() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <header class="top">
      <div class="brand"><b>PokeMod Studio</b> <span class="tag">Fire Ash Edition</span></div>
      <div class="top-r">
        <span id="proj" class="proj">sin proyecto</span>
        <div class="history-tools" role="group" aria-label="Historial de edición">
          <button id="btn-undo" class="btn small history-btn" type="button" aria-label="Deshacer" title="Deshacer (Ctrl+Z)" disabled>↶</button>
          <button id="btn-redo" class="btn small history-btn" type="button" aria-label="Rehacer" title="Rehacer (Ctrl+Y)" disabled>↷</button>
        </div>
        <span id="dirty" class="dirty hidden" title="Hay cambios sin guardar">●</span>
        <button id="btn-save" class="btn small primary hidden">Guardar</button>
      </div>
    </header>
    <main id="view"></main>
    <nav id="tabs">${TABS.map(([k, ico, label]) =>
      `<button class="tab" data-tab="${k}"><span class="tico">${ico}</span><span class="tlabel">${label}</span></button>`).join("")}
    </nav>
    <div id="toast"></div>
    <input type="file" id="fallbackInput" webkitdirectory directory multiple hidden />`;
  document.querySelectorAll("#tabs .tab").forEach((b) => {
    b.onclick = () => goTab(b.dataset.tab);
  });
  document.getElementById("btn-save").onclick = async () => {
    try { await saveAll(); toast("Guardado [OK] (partidas intactas)"); refreshDirty(); if (currentTab === "home") goTab("home", true); }
    catch (e) { toast("Error al guardar: " + e.message, "error"); }
  };
  document.getElementById("btn-undo").onclick = () => runHistoryAction("undo");
  document.getElementById("btn-redo").onclick = () => runHistoryAction("redo");
  document.addEventListener("pokemod-history", (e) => refreshHistoryControls(e.detail));
  document.addEventListener("pokemod-history-applied", (e) => {
    refreshDirty();
    if (HISTORY_TABS.has(currentTab)) goTab(currentTab, true);
    const action = e.detail.action === "undo" ? "Deshecho" : "Rehecho";
    toast(`${action}: ${e.detail.label}`);
  });
  document.addEventListener("keydown", (e) => {
    if (e.defaultPrevented || e.isComposing || !(e.ctrlKey || e.metaKey) || e.altKey) return;
    if (document.getElementById("modal-ov")) return;
    const tag = e.target?.tagName?.toLowerCase();
    if (["input", "textarea", "select"].includes(tag) || e.target?.isContentEditable) return;
    const key = e.key.toLowerCase();
    const action = key === "z" ? (e.shiftKey ? "redo" : "undo") : key === "y" && !e.shiftKey ? "redo" : "";
    if (!action) return;
    e.preventDefault();
    runHistoryAction(action);
  });
  document.getElementById("fallbackInput").addEventListener("change", async (e) => {
    const files = [...e.target.files];
    e.target.value = "";
    if (!files.length) return;
    try {
      toast("Leyendo carpeta…");
      await connectFallback(files);
      afterConnect();
    } catch (err) { toast("Error: " + err.message, "error"); }
  });
  document.addEventListener("pokemod-dirty", refreshDirty);
  goTab("home");
}

export function goTab(name, force = false) {
  if (name === currentTab && !force) return;
  if (name !== currentTab && (!HISTORY_TABS.has(name) || !HISTORY_TABS.has(currentTab))) clearEditHistory();
  currentTab = name;
  document.querySelectorAll("#tabs .tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  const view = document.getElementById("view");
  view.scrollTop = 0;
  if (name === "home") renderHome(view);
  else if (!S.connected) {
    view.innerHTML = `<div class="empty">Primero abre un proyecto en <b>Inicio</b>.</div>`;
  }
  else if (name === "maps") renderMapsTab(view);
  else if (name === "events") renderEventsTab(view, { goTab });
  else if (name === "flags") renderFlagsTab(view, { goTab });
  else if (name === "npcs") renderNpcsTab(view, { goTab });
  else if (name === "pbs") renderPbsTab(view, { goTab });
  else if (name === "create") renderCreateTab(view, { goTab });
  else if (name === "mods") renderModsTab(view, { goTab });
}

async function runHistoryAction(action) {
  try {
    if (action === "undo") await undoEdit();
    else await redoEdit();
  } catch (e) {
    toast(`No se pudo ${action === "undo" ? "deshacer" : "rehacer"}: ${e.message}`, "error");
  }
}

function refreshHistoryControls(state = {}) {
  const undo = document.getElementById("btn-undo");
  const redo = document.getElementById("btn-redo");
  if (!undo || !redo) return;
  const busy = !!(state.busy || state.pending);
  undo.disabled = busy || !state.canUndo;
  redo.disabled = busy || !state.canRedo;
  undo.title = state.undoLabel ? `Deshacer: ${state.undoLabel} (Ctrl+Z)` : "Deshacer (Ctrl+Z)";
  redo.title = state.redoLabel ? `Rehacer: ${state.redoLabel} (Ctrl+Y)` : "Rehacer (Ctrl+Y)";
}

export function refreshDirty() {
  const anyDirty = [...S.maps.values()].some((r) => r.dirty) || [...S.pbs.values()].some((r) => r.dirty);
  document.getElementById("dirty")?.classList.toggle("hidden", !anyDirty);
}

function afterConnect() {
  document.getElementById("proj").textContent = S.projectName;
  document.getElementById("btn-save").classList.toggle("hidden", !FS.canWrite && FS.mode !== "fallback");
  toast(`Proyecto listo: ${S.mapList.length} mapas [OK]`);
  goTab("maps", true);
}

// ============================================================================
// INICIO
// ============================================================================
function renderHome(view) {
  if (!S.connected) {
    const inApk = FS.isAndroid;
    view.innerHTML = `
    <div class="wrap">
      <div class="hero">
        <div class="hero-t">PokeMod Studio <span class="tag">Fire Ash Edition</span></div>
        <p>Editor estilo RPG Maker para <b>Pokémon Fire Ash</b>: mapas, eventos, diálogos, flags, NPCs y Pokémon — en tu celular o PC. Compatible con <b>Kirin</b> y <b>nunca toca tus partidas</b>.</p>
      </div>
      <div class="card">
        <h3>1. Abre tu juego</h3>
        ${inApk ? `<button class="btn primary big" id="c-apk">Abrir carpeta de Fire Ash</button>
        <p class="muted">Elige la carpeta donde tienes Fire Ash (la misma que usa Kirin). Se guarda el permiso.</p>` : ""}
        <button class="btn primary big" id="c-pc">Abrir carpeta (PC · Chrome/Edge)</button>
        <button class="btn big" id="c-ro">Abrir en modo lectura (cualquier navegador)</button>
        <button class="btn big" id="c-demo">Probar con proyecto demo</button>
        <p class="muted">Modo lectura: editas y exportas un ZIP con los cambios para copiarlos a mano.</p>
      </div>
      <div class="card">
        <h3>2. ¿No tienes el juego?</h3>
        <p>Descarga Fire Ash 3.7.1 para Windows y extráelo ( ZIP → carpeta). En Android esa misma carpeta la abren Kirin o JoiPlay.</p>
        <p class="muted">En PC también puedes usar <span class="mono">tools/download_game.py</span> de este repo (descarga + verifica + aplica parche).</p>
      </div>
      <div class="grid2">
        <div class="card"><h3>Partidas a salvo</h3><p class="muted">PokeMod <b>jamás escribe ni borra</b> <span class="mono">Save*.rxdata</span>. Además respalda automáticamente cada archivo antes de tocarlo.</p></div>
        <div class="card"><h3>Kirin ready</h3><p class="muted">Incluye chequeo de compatibilidad (extraídos, audio, caja de archivos) y la <b>Sala PokeMod</b> para viajar a todos los mapas.</p></div>
      </div>
    </div>`;
    document.getElementById("c-pc").onclick = async () => {
      try { await connectBrowser(); afterConnect(); } catch (e) { toast(e.message, "error"); }
    };
    document.getElementById("c-ro").onclick = () => document.getElementById("fallbackInput").click();
    document.getElementById("c-demo").onclick = async () => {
      try { toast("Generando demo…"); await connectDemo(); afterConnect(); } catch (e) { toast(e.message, "error"); }
    };
    const apk = document.getElementById("c-apk");
    if (apk) apk.onclick = async () => {
      try { await connectAndroid(); afterConnect(); } catch (e) { toast(e.message, "error"); }
    };
    return;
  }
  // Dashboard
  const dirtyMaps = [...S.maps.entries()].filter(([, r]) => r.dirty).length;
  const dirtyPbs = [...S.pbs.entries()].filter(([, r]) => r.dirty).length;
  view.innerHTML = `
  <div class="wrap">
    <div class="card">
      <h3>${esc(S.projectName)}</h3>
      <div class="stats">
        <div><b>${S.mapList.length}</b><span>mapas</span></div>
        <div><b>${S.tilesets.size}</b><span>tilesets</span></div>
        <div><b>${S.pbsFiles.length}</b><span>PBS</span></div>
        <div><b>${S.characters.length}</b><span>sprites</span></div>
      </div>
      <p class="muted">Modo: <b>${FS.mode}</b> ${FS.canWrite ? "(edición directa)" : "(solo lectura → exporta ZIP)"} · Sin guardar: ${dirtyMaps} mapas, ${dirtyPbs} PBS</p>
      <div class="row">
        <button class="btn primary" id="h-save">Guardar todo</button>
        <button class="btn" id="h-go-maps">Ver mapas</button>
        <button class="btn" id="h-go-mods">Mods y Kirin</button>
      </div>
    </div>
    <div class="card">
      <h3>Registro</h3>
      <div class="log">${S.log.map((l) => `<div class="logrow ${l.kind}"><span class="muted mono">${l.t.toLocaleTimeString()}</span> ${esc(l.msg)}</div>`).join("") || "<p class=muted>Vacío.</p>"}</div>
    </div>
    <div class="card danger-zone">
      <h3>Sesión</h3>
      <button class="btn" id="h-disc">Desconectar proyecto</button>
    </div>
  </div>`;
  document.getElementById("h-save").onclick = async () => {
    try { await saveAll(); toast("Guardado [OK]"); refreshDirty(); renderHome(view); } catch (e) { toast(e.message, "error"); }
  };
  document.getElementById("h-go-maps").onclick = () => goTab("maps");
  document.getElementById("h-go-mods").onclick = () => goTab("mods");
  document.getElementById("h-disc").onclick = () => location.reload();
}

// ============================================================================
// MAPAS
// ============================================================================
const mapUI = { zoom: 1, showEvents: true, ghost: true, passage: false, renderToken: 0 };

async function renderMapsTab(view) {
  if (!S.currentMap) S.currentMap = S.tree[0]?.id ?? S.mapList[0]?.id;
  view.innerHTML = `
  <div class="mapslayout">
    <div class="maplist-pane">
      <input id="map-search" class="inp" placeholder="Buscar mapa…" />
      <div id="map-list" class="maplist"></div>
    </div>
    <div class="mapview-pane">
      <div class="mapbar">
        <button class="btn small" id="map-pick"><span id="map-name">…</span></button>
        <div class="maptools">
          <button class="iconbtn" id="z-out" title="Reducir">-</button>
          <span id="z-label" class="mono">100%</span>
          <button class="iconbtn" id="z-in" title="Ampliar">+</button>
          <button class="iconbtn" id="t-ev" title="Eventos">●</button>
          <button class="iconbtn" id="t-ghost" title="Eventos invisibles">○</button>
          <button class="iconbtn" id="t-pass" title="Pasajes bloqueados">▨</button>
          <button class="iconbtn" id="map-save" title="Guardar mapa">▼</button>
        </div>
      </div>
      <div id="map-scroll" class="mapscroll"><div id="map-stage" class="mapstage"><p class="muted">Cargando…</p></div></div>
      <div id="map-events" class="eventchips"></div>
    </div>
  </div>`;
  const listEl = view.querySelector("#map-list");
  const searchEl = view.querySelector("#map-search");

  const drawList = (filter = "") => {
    const f = filter.trim().toLowerCase();
    const items = S.tree.filter((m) => !f || m.name.toLowerCase().includes(f) || String(m.id).includes(f));
    listEl.innerHTML = items.slice(0, 300).map((m) => {
      const falta = S.missingMaps.has(m.id);
      return `<button class="maprow${m.id === S.currentMap ? " sel" : ""}${falta ? " warn" : ""}" data-id="${m.id}"
        title="${falta ? "Falta Data/Map" + pad3(m.id) + ".rxdata: el juego fallaría al entrar aquí" : ""}">
        <span class="mono muted">${m.id}</span><span style="margin-left:${m.depth * 12}px">${esc(m.name)}</span>
      </button>`;
    }).join("");
    if (items.length > 300) listEl.innerHTML += `<p class="muted" style="padding:8px">…${items.length - 300} más (busca para filtrar)</p>`;
    listEl.querySelectorAll(".maprow").forEach((b) => {
      b.onclick = () => { S.currentMap = Number(b.dataset.id); drawList(searchEl.value); drawMapView(view); };
    });
  };
  searchEl.oninput = debounce(() => drawList(searchEl.value), 200);
  drawList();

  view.querySelector("#map-pick").onclick = () => mapPickerModal("Ir al mapa", (id) => {
    S.currentMap = id; drawList(searchEl.value); drawMapView(view);
  });
  view.querySelector("#z-in").onclick = () => setZoom(view, mapUI.zoom * 1.25);
  view.querySelector("#z-out").onclick = () => setZoom(view, mapUI.zoom / 1.25);
  const tgl = (id, key) => {
    const b = view.querySelector(id);
    b.classList.toggle("off", !mapUI[key]);
    b.onclick = () => { mapUI[key] = !mapUI[key]; b.classList.toggle("off", !mapUI[key]); drawMapView(view); };
  };
  tgl("#t-ev", "showEvents"); tgl("#t-ghost", "ghost"); tgl("#t-pass", "passage");
  view.querySelector("#map-save").onclick = async () => {
    try { await saveMap(S.currentMap); toast("Mapa guardado [OK]"); refreshDirty(); }
    catch (e) { toast(e.message, "error"); }
  };
  drawMapView(view);
}

function setZoom(view, z) {
  mapUI.zoom = Math.min(4, Math.max(0.25, z));
  view.querySelector("#z-label").textContent = Math.round(mapUI.zoom * 100) + "%";
  const sup = mapUI.surface;
  if (!sup) return;
  if (sup.kind === "static") {
    sup.canvas.style.width = Math.round(sup.canvas.width * mapUI.zoom) + "px";
    sup.canvas.style.height = Math.round(sup.canvas.height * mapUI.zoom) + "px";
  } else if (sup.repaint) {
    // Mapa enorme: el «lienzo» es la parte visible; hay que recolocar y repintar.
    sup.spacer.style.width = Math.round(sup.view.width * mapUI.zoom) + "px";
    sup.spacer.style.height = Math.round(sup.view.height * mapUI.zoom) + "px";
    sup.repaint();
  }
}

/** Traduce un clic sobre el mapa a coordenadas de casilla (los dos modos). */
function mapClickTile(e, sup) {
  const r = sup.canvas.getBoundingClientRect();
  const z = mapUI.zoom;
  const off = sup.offset || { ox: 0, oy: 0 };
  const mapX = off.ox + (e.clientX - r.left) / z;
  const mapY = off.oy + (e.clientY - r.top) / z;
  return { tx: Math.floor(mapX / 32), ty: Math.floor(mapY / 32) };
}

async function drawMapView(view) {
  const token = ++mapUI.renderToken;
  const stage = view.querySelector("#map-stage");
  const nameEl = view.querySelector("#map-name");
  const chipsEl = view.querySelector("#map-events");
  if (!stage) return;
  stage.innerHTML = `<p class="muted">Cargando mapa ${S.currentMap}…</p>`;
  chipsEl.innerHTML = "";
  try {
    const rec = await loadMap(S.currentMap);
    if (token !== mapUI.renderToken) return;
    const info = S.mapList.find((m) => m.id === S.currentMap);
    nameEl.textContent = `${S.currentMap}: ${info?.name || "?"}`;
    const avisos = [];
    const ts = getTileset(rec.parsed.tilesetId);
    if (!ts) {
      avisos.push({ k: "err", t: `Este mapa usa el tileset <b>${rec.parsed.tilesetId}</b> y el juego no lo tiene bien configurado (${S.brokenTilesets.get(rec.parsed.tilesetId) || "sin datos"}). Por eso el mapa sale negro: PokeMod no dibuja otro tileset en su lugar.` });
    } else if (ts.tilesetName && !(await FS.exists(`Graphics/Tilesets/${ts.tilesetName}.png`))) {
      // Las mayúsculas importan en Android/Kirin: buscamos el archivo real.
      const real = (S.tilesetFiles || []).find((n) => n.replace(/\.[^.]+$/, "").toLowerCase() === ts.tilesetName.toLowerCase());
      avisos.push({ k: "warn", t: real
        ? `El tileset se llama <span class="mono">${esc(ts.tilesetName)}.png</span> pero el archivo es <span class="mono">${esc(real)}</span>. En Android/Kirin eso deja el mapa negro: renombra el archivo o corrige el tileset.`
        : `Falta el archivo <span class="mono">Graphics/Tilesets/${esc(ts.tilesetName)}.png</span>: el mapa se verá negro hasta que exista.` });
    }
    const vacio = emptyCellStats(rec.parsed);
    if (vacio.pct >= 99.5) {
      avisos.push({ k: "err", t: `Este mapa está <b>vacío</b> (${vacio.empty}/${vacio.total} casillas sin ningún tile): así lo ve el juego — todo negro${rec.parsed.events.length ? ` salvo ${rec.parsed.events.length} evento(s)` : ""}. No es un fallo del editor; el mapa no tiene dibujo guardado.` });
    }
    // gráficos necesarios
    const gfx = { tileset: null, autotiles: [], characters: new Map() };
    if (ts?.tilesetName) {
      try { gfx.tileset = await FS.readImage(`Graphics/Tilesets/${ts.tilesetName}.png`); }
      catch { /* placeholder */ }
    }
    for (let i = 0; i < 7; i++) {
      const a = ts?.autotiles[i];
      gfx.autotiles[i] = a ? await FS.readImage(`Graphics/Autotiles/${a}.png`).catch(() => null) : null;
    }
    const charNames = new Set();
    for (const { obj } of rec.parsed.events) {
      try {
        for (const pg of parseEvent(obj).pages) {
          if (pg.graphic?.charName) charNames.add(pg.graphic.charName);
        }
      } catch { /* noop */ }
    }
    for (const n of [...charNames].slice(0, 60)) {
      if (esInvisible(n)) continue; // «invisible» no dibuja nada: no hay PNG que cargar
      try { gfx.characters.set(n.toLowerCase(), await FS.readImage(`Graphics/Characters/${n}.png`)); } catch { /* marcador */ }
    }
    if (token !== mapUI.renderToken) return;
    const sup = renderMap(rec.parsed, ts, gfx, {
      showEvents: mapUI.showEvents, ghostEvents: mapUI.ghost, passageOverlay: mapUI.passage,
    });
    const { canvas } = sup;
    stage.innerHTML = "";
    stage.parentElement.querySelectorAll(".mapwarn").forEach((n) => n.remove());
    const scroll = view.querySelector("#map-scroll");
    if (sup.mode === "viewport") {
      // Mapa enorme (> 16,7 Mpx): en WebKit un lienzo así sale negro. Se dibuja
      // solo la parte visible y se repinta al hacer scroll.
      avisos.push({
        k: "warn",
        t: `Mapa enorme (${rec.parsed.width}×${rec.parsed.height} casillas = ${(sup.width * sup.height / 1e6).toFixed(1)} Mpx). Para que no salga negro en el móvil, PokeMod dibuja solo la parte visible y la actualiza al desplazarte.`,
      });
      stage.classList.add("viewportmode");
      const spacer = document.createElement("div");
      spacer.className = "mapspacer";
      spacer.style.width = Math.round(sup.width * mapUI.zoom) + "px";
      spacer.style.height = Math.round(sup.height * mapUI.zoom) + "px";
      canvas.className = "mapviewport";
      spacer.appendChild(canvas);
      stage.appendChild(spacer);
      const surface = { kind: "viewport", canvas, spacer, repaint: null, view: sup, scroll, offset: { ox: 0, oy: 0 } };
      const repaint = () => {
        const z = mapUI.zoom;
        const visW = Math.max(64, Math.min(sup.width, Math.ceil(scroll.clientWidth / z) + 2));
        const visH = Math.max(64, Math.min(sup.height, Math.ceil(scroll.clientHeight / z) + 2));
        const ox = Math.max(0, Math.min(sup.width - visW, Math.floor(scroll.scrollLeft / z)));
        const oy = Math.max(0, Math.min(sup.height - visH, Math.floor(scroll.scrollTop / z)));
        canvas.width = visW;
        canvas.height = visH;
        canvas.style.width = Math.round(visW * z) + "px";
        canvas.style.height = Math.round(visH * z) + "px";
        const c = canvas.getContext("2d");
        if (c) {
          c.imageSmoothingEnabled = false;
          sup.paint(c, ox, oy, visW, visH);
        }
        surface.offset = { ox, oy };
      };
      surface.repaint = repaint;
      mapUI.surface = surface;
      let rafId = 0;
      scroll.onscroll = () => {
        if (rafId) return;
        rafId = requestAnimationFrame(() => { rafId = 0; repaint(); });
      };
      repaint();
    } else {
      stage.classList.remove("viewportmode");
      mapUI.surface = { kind: "static", canvas, view: sup, scroll, offset: { ox: 0, oy: 0 } };
      scroll.onscroll = null;
      stage.appendChild(canvas);
    }
    // ¿salió negro? medimos lo dibujado (1 de cada 16 píxeles para no frenar el móvil)
    try {
      const c2 = document.createElement("canvas");
      c2.width = Math.min(canvas.width, 256);
      c2.height = Math.min(canvas.height, 256);
      const g2 = c2.getContext("2d");
      g2.imageSmoothingEnabled = false;
      g2.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, c2.width, c2.height);
      const d = g2.getImageData(0, 0, c2.width, c2.height).data;
      let negro = 0, total = 0;
      for (let i = 0; i < d.length; i += 4 * 4) { total++; if (d[i] < 12 && d[i + 1] < 12 && d[i + 2] < 12) negro++; }
      const pct = 100 * negro / Math.max(1, total);
      // Con un tileset roto PokeMod dibuja marcadores morados, no negro: si sale
      // negro de verdad es arte negro del propio mapa. Solo avisamos si el mapa
      // no está casi vacío (en un mapa vacío el negro es lo esperado).
      if (pct > 92 && vacio.pct < 95) {
        avisos.push({ k: "warn", t: `El ${pct.toFixed(0)} % de este mapa se dibuja en negro: son tiles negros del propio juego (arte del mapa), no un fallo del editor.` });
      }
    } catch { /* sin medición */ }
    for (const a of avisos) {
      const div = document.createElement("div");
      div.className = "mapwarn" + (a.k === "err" ? " err" : "");
      div.innerHTML = a.t;
      stage.parentElement.insertBefore(div, stage);
    }
    setZoom(view, mapUI.zoom);
    canvas.onclick = (e) => {
      const { tx, ty } = mapClickTile(e, mapUI.surface);
      if (tx < 0 || ty < 0 || tx >= rec.parsed.width || ty >= rec.parsed.height) return;
      const hit = rec.parsed.events.find(({ obj }) => Number(obj.getIvar("x")) === tx && Number(obj.getIvar("y")) === ty);
      if (hit) {
        S.currentEvent = hit.id; S.currentPage = 0;
        toast(`Evento ${hit.id} @(${tx},${ty}) → pestaña Eventos`);
        goTab("events");
      } else {
        toast(`Casilla (${tx},${ty}) — sin evento`);
      }
    };
    // chips de eventos
    chipsEl.innerHTML = rec.parsed.events.map(({ id, obj }) => {
      let nm = "";
      try { nm = parseEvent(obj).name; } catch { nm = "?"; }
      return `<button class="chip" data-ev="${id}"><b>${id}</b> ${esc(nm)}</button>`;
    }).join("") || `<span class="muted">Sin eventos en este mapa.</span>`;
    chipsEl.querySelectorAll(".chip").forEach((c) => {
      c.onclick = () => { S.currentEvent = Number(c.dataset.ev); S.currentPage = 0; goTab("events"); };
    });
  } catch (e) {
    if (e.code === "MISSING_MAP_FILE") {
      stage.innerHTML = `<div class="mapwarn err">${esc(e.message)}<br/>
        Puedes restaurarlo desde <b>Mods → Backups</b> o reparar la lista con
        <span class="mono">npm run repair:mapas</span>.</div>`;
      try { drawList(view.querySelector("#map-search").value); } catch { /* sin lista */ }
    } else {
      stage.innerHTML = `<p class="error">Error: ${esc(e.message)}</p>`;
    }
  }
}
