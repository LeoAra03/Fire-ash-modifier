// ============================================================================
// ui.js — Armazón: arranque, pestañas, Inicio y Mapas
// ============================================================================
import {
  S, log, connectDemo, connectBrowser, connectAndroid, connectFallback,
  loadMap, getTileset, saveAll, saveMap,
} from "./app.js";
import { FS } from "./fs.js";
import { parseEvent, parseMap } from "./rmxp.js";
import { renderMap } from "./render.js";
import { esc, fmtBytes, pad3 } from "./util.js";
import { toast, openModal, closeModal, showProgress, mapPickerModal, debounce } from "./helpers.js";
import { renderEventsTab, renderFlagsTab, renderNpcsTab, renderPbsTab, renderModsTab } from "./editors.js";

const TABS = [
  ["home", "🏠", "Inicio"],
  ["maps", "🗺", "Mapas"],
  ["events", "🎭", "Eventos"],
  ["flags", "🚩", "Flags"],
  ["npcs", "🧍", "NPCs"],
  ["pbs", "🔮", "Pokémon"],
  ["mods", "🧩", "Mods"],
];
let currentTab = "";

export function boot() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <header class="top">
      <div class="brand">🎮 <b>PokeMod Studio</b> <span class="tag">Fire Ash Edition</span></div>
      <div class="top-r">
        <span id="proj" class="proj">sin proyecto</span>
        <span id="dirty" class="dirty hidden" title="Hay cambios sin guardar">●</span>
        <button id="btn-save" class="btn small primary hidden">💾 Guardar</button>
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
    try { await saveAll(); toast("Guardado ✔ (partidas intactas)"); refreshDirty(); if (currentTab === "home") goTab("home", true); }
    catch (e) { toast("Error al guardar: " + e.message, "error"); }
  };
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
  currentTab = name;
  document.querySelectorAll("#tabs .tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  const view = document.getElementById("view");
  view.scrollTop = 0;
  if (name === "home") renderHome(view);
  else if (!S.connected) {
    view.innerHTML = `<div class="empty">Primero abre un proyecto en <b>🏠 Inicio</b>.</div>`;
  }
  else if (name === "maps") renderMapsTab(view);
  else if (name === "events") renderEventsTab(view, { goTab });
  else if (name === "flags") renderFlagsTab(view, { goTab });
  else if (name === "npcs") renderNpcsTab(view, { goTab });
  else if (name === "pbs") renderPbsTab(view, { goTab });
  else if (name === "mods") renderModsTab(view, { goTab });
}

export function refreshDirty() {
  const anyDirty = [...S.maps.values()].some((r) => r.dirty) || [...S.pbs.values()].some((r) => r.dirty);
  document.getElementById("dirty")?.classList.toggle("hidden", !anyDirty);
}

function afterConnect() {
  document.getElementById("proj").textContent = S.projectName;
  document.getElementById("btn-save").classList.toggle("hidden", !FS.canWrite && FS.mode !== "fallback");
  toast(`Proyecto listo: ${S.mapList.length} mapas ✔`);
  goTab("maps", true);
}

// ============================================================================
// 🏠 INICIO
// ============================================================================
function renderHome(view) {
  if (!S.connected) {
    const inApk = FS.isAndroid;
    view.innerHTML = `
    <div class="wrap">
      <div class="hero">
        <div class="hero-t">🎮 PokeMod Studio <span class="tag">Fire Ash Edition</span></div>
        <p>Editor estilo RPG Maker para <b>Pokémon Fire Ash</b>: mapas, eventos, diálogos, flags, NPCs y Pokémon — en tu celular o PC. Compatible con <b>Kirin</b> y <b>nunca toca tus partidas</b>.</p>
      </div>
      <div class="card">
        <h3>1️⃣ Abre tu juego</h3>
        ${inApk ? `<button class="btn primary big" id="c-apk">🤖 Abrir carpeta de Fire Ash</button>
        <p class="muted">Elige la carpeta donde tienes Fire Ash (la misma que usa Kirin). Se guarda el permiso.</p>` : ""}
        <button class="btn primary big" id="c-pc">📁 Abrir carpeta (PC · Chrome/Edge)</button>
        <button class="btn big" id="c-ro">📂 Abrir en modo lectura (cualquier navegador)</button>
        <button class="btn big" id="c-demo">🎮 Probar con proyecto demo</button>
        <p class="muted">Modo lectura: editas y exportas un ZIP con los cambios para copiarlos a mano.</p>
      </div>
      <div class="card">
        <h3>2️⃣ ¿No tienes el juego?</h3>
        <p>Descarga Fire Ash 3.7.1 para Windows y extráelo ( ZIP → carpeta). En Android esa misma carpeta la abren Kirin o JoiPlay.</p>
        <p class="muted">En PC también puedes usar <span class="mono">tools/download_game.py</span> de este repo (descarga + verifica + aplica parche).</p>
      </div>
      <div class="grid2">
        <div class="card"><h3>🛡 Partidas a salvo</h3><p class="muted">PokeMod <b>jamás escribe ni borra</b> <span class="mono">Save*.rxdata</span>. Además respalda automáticamente cada archivo antes de tocarlo.</p></div>
        <div class="card"><h3>🤖 Kirin ready</h3><p class="muted">Incluye chequeo de compatibilidad (extraídos, audio, caja de archivos) y la <b>Sala PokeMod</b> para viajar a todos los mapas.</p></div>
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
      <h3>📦 ${esc(S.projectName)}</h3>
      <div class="stats">
        <div><b>${S.mapList.length}</b><span>mapas</span></div>
        <div><b>${S.tilesets.size}</b><span>tilesets</span></div>
        <div><b>${S.pbsFiles.length}</b><span>PBS</span></div>
        <div><b>${S.characters.length}</b><span>sprites</span></div>
      </div>
      <p class="muted">Modo: <b>${FS.mode}</b> ${FS.canWrite ? "(edición directa ✔)" : "(solo lectura → exporta ZIP)"} · Sin guardar: ${dirtyMaps} mapas, ${dirtyPbs} PBS</p>
      <div class="row">
        <button class="btn primary" id="h-save">💾 Guardar todo</button>
        <button class="btn" id="h-go-maps">🗺 Ver mapas</button>
        <button class="btn" id="h-go-mods">🧩 Mods y Kirin</button>
      </div>
    </div>
    <div class="card">
      <h3>📝 Registro</h3>
      <div class="log">${S.log.map((l) => `<div class="logrow ${l.kind}"><span class="muted mono">${l.t.toLocaleTimeString()}</span> ${esc(l.msg)}</div>`).join("") || "<p class=muted>Vacío.</p>"}</div>
    </div>
    <div class="card danger-zone">
      <h3>⚙ Sesión</h3>
      <button class="btn" id="h-disc">Desconectar proyecto</button>
    </div>
  </div>`;
  document.getElementById("h-save").onclick = async () => {
    try { await saveAll(); toast("Guardado ✔"); refreshDirty(); renderHome(view); } catch (e) { toast(e.message, "error"); }
  };
  document.getElementById("h-go-maps").onclick = () => goTab("maps");
  document.getElementById("h-go-mods").onclick = () => goTab("mods");
  document.getElementById("h-disc").onclick = () => location.reload();
}

// ============================================================================
// 🗺 MAPAS
// ============================================================================
const mapUI = { zoom: 1, showEvents: true, ghost: true, passage: false, renderToken: 0 };

async function renderMapsTab(view) {
  if (!S.currentMap) S.currentMap = S.tree[0]?.id ?? S.mapList[0]?.id;
  view.innerHTML = `
  <div class="mapslayout">
    <div class="maplist-pane">
      <input id="map-search" class="inp" placeholder="🔍 Buscar mapa…" />
      <div id="map-list" class="maplist"></div>
    </div>
    <div class="mapview-pane">
      <div class="mapbar">
        <button class="btn small" id="map-pick">📑 <span id="map-name">…</span></button>
        <div class="maptools">
          <button class="iconbtn" id="z-out" title="Reducir">➖</button>
          <span id="z-label" class="mono">100%</span>
          <button class="iconbtn" id="z-in" title="Ampliar">➕</button>
          <button class="iconbtn" id="t-ev" title="Eventos">🧍</button>
          <button class="iconbtn" id="t-ghost" title="Eventos invisibles">👻</button>
          <button class="iconbtn" id="t-pass" title="Pasajes bloqueados">🚧</button>
          <button class="iconbtn" id="map-save" title="Guardar mapa">💾</button>
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
    listEl.innerHTML = items.slice(0, 300).map((m) =>
      `<button class="maprow${m.id === S.currentMap ? " sel" : ""}" data-id="${m.id}">
        <span class="mono muted">${m.id}</span><span style="margin-left:${m.depth * 12}px">${esc(m.name)}</span>
      </button>`).join("");
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
    try { await saveMap(S.currentMap); toast("Mapa guardado ✔"); refreshDirty(); }
    catch (e) { toast(e.message, "error"); }
  };
  drawMapView(view);
}

function setZoom(view, z) {
  mapUI.zoom = Math.min(4, Math.max(0.25, z));
  view.querySelector("#z-label").textContent = Math.round(mapUI.zoom * 100) + "%";
  const cv = view.querySelector("#map-stage canvas");
  if (cv) {
    cv.style.width = Math.round(cv.width * mapUI.zoom) + "px";
    cv.style.height = Math.round(cv.height * mapUI.zoom) + "px";
  }
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
    const ts = getTileset(rec.parsed.tilesetId);
    // gráficos necesarios
    const gfx = { tileset: null, autotiles: [], characters: new Map() };
    if (ts?.tilesetName) {
      try { gfx.tileset = await FS.readImage(`Graphics/Tilesets/${ts.tilesetName}.png`); } catch { /* placeholder */ }
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
      try { gfx.characters.set(n.toLowerCase(), await FS.readImage(`Graphics/Characters/${n}.png`)); } catch { /* marcador */ }
    }
    if (token !== mapUI.renderToken) return;
    const { canvas } = renderMap(rec.parsed, ts, gfx, {
      showEvents: mapUI.showEvents, ghostEvents: mapUI.ghost, passageOverlay: mapUI.passage,
    });
    stage.innerHTML = "";
    stage.appendChild(canvas);
    setZoom(view, mapUI.zoom);
    canvas.onclick = (e) => {
      const r = canvas.getBoundingClientRect();
      const tx = Math.floor((e.clientX - r.left) / r.width * rec.parsed.width);
      const ty = Math.floor((e.clientY - r.top) / r.height * rec.parsed.height);
      const hit = rec.parsed.events.find(({ obj }) => Number(obj.getIvar("x")) === tx && Number(obj.getIvar("y")) === ty);
      if (hit) {
        S.currentEvent = hit.id; S.currentPage = 0;
        toast(`Evento ${hit.id} @(${tx},${ty}) → pestaña 🎭`);
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
    stage.innerHTML = `<p class="error">Error: ${esc(e.message)}</p>`;
  }
}
