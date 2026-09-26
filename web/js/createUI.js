// ============================================================================
// createUI.js — UI de la pestaña Crear (usa los constructores de create.js)
// ============================================================================
import {
  S, loadMap, loadPBS, saveMap, savePBS, saveMapInfos,
  markMapDirty, scanAllMaps, log,
} from "./app.js";
import { FS } from "./fs.js";
import { marshalDump, marshalLoad } from "./marshal.js";
import { cmdOf, parseMap, TRIGGERS, humanizeCommand, rstr } from "./rmxp.js";
import { parsePBS, pbsToText, pbsSections } from "./pbs.js";
import { esc, pad3 } from "./util.js";
import { toast, showProgress, mapPickerModal, spritePickerModal } from "./helpers.js";
import {
  TEMPLATES, buildTemplate, insertEvent, buildMap, buildMapInfo,
  getSectionBody, setSectionBody, getTownRegions, setTownPoints,
  ENCOUNTER_TYPES, parseEncountersBody, formatEncountersBody, normalizeChances,
  formatTrainerEntry, parseTrainerHeader, trainerKey,
  formatMetadataSection, formatConnection, auditPBS, auditMapEvents,
} from "./create.js";

const dirty = () => document.dispatchEvent(new CustomEvent("pokemod-dirty"));

function findPBS(cands) {
  const low = S.pbsFiles.map((f) => f.toLowerCase());
  for (const c of cands) {
    const i = low.findIndex((f) => f === c.toLowerCase() || f.endsWith("/" + c.toLowerCase()));
    if (i >= 0) return S.pbsFiles[i];
  }
  return null;
}

async function pbsTextOr(rel, fallback = "") {
  if (!rel) return fallback;
  try { return pbsToText((await loadPBS(rel)).lines); }
  catch { return fallback; }
}

async function savePBSText(rel, text) {
  const rec = await loadPBS(rel);
  rec.lines = parsePBS(text);
  rec.dirty = true;
  dirty();
  await savePBS(rel);
}

const linesOf = (ta) => {
  const ls = String(ta || "").split("\n").map((s) => s.trim());
  while (ls.length && ls[ls.length - 1] === "") ls.pop();
  return ls.length ? ls : ["..."];
};

async function sectionIds(base) {
  const rel = findPBS([`PBS/${base}`, base]);
  if (!rel) return [];
  try { return pbsSections((await loadPBS(rel)).lines); }
  catch { return []; }
}

const dlHTML = (id, arr) => `<datalist id="${id}">${arr.slice(0, 2000).map((v) => `<option value="${esc(v)}">`).join("")}</datalist>`;

// ============================================================================
// Pestaña Crear
// ============================================================================
export async function renderCreateTab(view, { goTab }) {
  const [speciesList, itemList, ttypeList] = await Promise.all([
    sectionIds("pokemon.txt"), sectionIds("items.txt"), sectionIds("trainertypes.txt"),
  ]);
  view.innerHTML = `
  <div class="wrap">
    ${dlHTML("dl-species", speciesList)}
    ${dlHTML("dl-items", itemList)}
    ${dlHTML("dl-ttypes", ttypeList)}
    <details class="card" open>
      <summary><b>1. Evento nuevo en un mapa</b> <span class="muted">— NPCs, entrenadores, objetos, tiendas…</span></summary>
      <div id="ce-event"></div>
    </details>
    <details class="card">
      <summary><b>2. Mapa nuevo</b> <span class="muted">— vacío o duplicado</span></summary>
      <div id="ce-map"></div>
    </details>
    <details class="card">
      <summary><b>3. Datos PBS</b> <span class="muted">— entrenadores, encuentros, metadatos, mapamundi, conexiones</span></summary>
      <div id="ce-pbs"></div>
    </details>
    <details class="card">
      <summary><b>4. Editor de mapamundi</b> <span class="muted">— puntos, vuelos y regiones</span></summary>
      <div id="ce-region"></div>
    </details>
    <details class="card">
      <summary><b>5. Auditoría</b> <span class="muted">— revisa que todo encaje como en el juego base</span></summary>
      <div id="ce-audit"></div>
    </details>
  </div>`;
  renderEventCreator(view.querySelector("#ce-event"), { goTab });
  renderMapCreator(view.querySelector("#ce-map"), { goTab });
  renderPbsCreator(view.querySelector("#ce-pbs"), { goTab });
  renderRegionEditor(view.querySelector("#ce-region"));
  renderAudit(view.querySelector("#ce-audit"), { goTab });
}

// ============================================================================
// 1. Creador de eventos
// ============================================================================
function renderEventCreator(el, { goTab }) {
  const st = {
    map: S.currentMap || S.tree[0]?.id || 1,
    x: 5, y: 5, tpl: "npc",
    team: [{ species: "RATTATA", level: 5, moves: "TACKLE", ability: "", item: "", gender: "", nick: "", iv: "", shiny: false, ball: "" }],
  };
  el.innerHTML = `
    <div class="row wrap">
      <button class="btn small" id="ce-mapbtn">Mapa: <b id="ce-mapn"></b></button>
      <label>X <input id="ce-x" class="inp num" type="number" value="5" /></label>
      <label>Y <input id="ce-y" class="inp num" type="number" value="5" /></label>
      <label>Plantilla <select id="ce-tpl" class="inp">${TEMPLATES.map(([id, t, d]) => `<option value="${id}">${t} — ${d}</option>`).join("")}</select></label>
    </div>
    <div id="ce-form" style="margin-top:8px"></div>
    <div id="ce-prev" style="margin-top:8px"></div>
    <div class="row" style="margin-top:8px">
      <button class="btn primary" id="ce-create">Crear evento</button>
    </div>
    <div id="ce-out" style="margin-top:8px"></div>`;
  const mapName = () => {
    const m = S.mapList.find((x) => x.id === st.map);
    el.querySelector("#ce-mapn").textContent = `${st.map}: ${m?.name || "?"}`;
  };
  mapName();
  el.querySelector("#ce-mapbtn").onclick = () => mapPickerModal("Mapa destino", (id) => { st.map = id; mapName(); });
  el.querySelector("#ce-tpl").onchange = (e) => { st.tpl = e.target.value; drawForm(); };
  const sprRow = (val = "") => `
    <div class="row wrap"><label>Sprite <input id="cf-sprite" class="inp mono" value="${esc(val)}" placeholder="(sin gráfico)" /></label>
    <button class="btn small" id="cf-sprpick" type="button">Elegir</button></div>`;
  const dirSel = (v = 2) => `<label>Dir. <select id="cf-dir" class="inp">${[[2, "abajo"], [4, "izq."], [6, "der."], [8, "arriba"]].map(([n, l]) => `<option value="${n}"${n === v ? " selected" : ""}>${l}</option>`).join("")}</select></label>`;

  function drawForm() {
    const f = el.querySelector("#ce-form");
    const T = st.tpl;
    if (T === "npc") {
      f.innerHTML = `<div class="row wrap"><label>Nombre <input id="cf-name" class="inp" value="NPC" /></label>${dirSel()}</div>${sprRow()}
        <label>Diálogo (una línea por renglón)<textarea id="cf-dialog" class="inp" rows="3">¡Hola! Soy nuevo en el pueblo.</textarea></label>`;
    } else if (T === "trainer") {
      f.innerHTML = `
        <p class="muted small">El evento se llamará <b>Trainer(X)</b> para que detecte al jugador a X casillas. El disparador será "Tocar evento".</p>
        <div class="row wrap"><label>Alcance (X) <input id="cf-sight" class="inp num" type="number" value="3" min="1" max="8" /></label>${dirSel()}</div>${sprRow()}
        <div class="row wrap"><label>Tipo <input id="cf-ttype" class="inp mono" list="dl-ttypes" value="CAMPER" /></label>
        <label>Nombre <input id="cf-tname" class="inp" value="Dave" /></label>
        <label>Versión <input id="cf-ver" class="inp num" type="number" value="0" min="0" /></label>
        <label class="check"><input type="checkbox" id="cf-double" /> Doble</label></div>
        <label>Presentación<textarea id="cf-intro" class="inp" rows="2">¡Eh, tú! ¡A luchar!</textarea></label>
        <label>Tras perder<textarea id="cf-after" class="inp" rows="2">Eres fuerte…</textarea></label>
        <div class="row wrap"><label>Frase de derrota (PBS) <input id="cf-lose" class="inp" value="¡Perdí!" /></label>
        <label class="check"><input type="checkbox" id="cf-pbs" checked /> Crear entrada en trainers.txt</label></div>
        <div id="cf-team"></div>`;
      drawTeamEditor(f.querySelector("#cf-team"), st.team);
    } else if (T === "item" || T === "hidden") {
      f.innerHTML = `
        <p class="muted small">${T === "hidden" ? "Invisible y atravesable. Conserva <b>HiddenItem</b> en el nombre para el Buscaobjetos." : "Estructura expandida lista para jugar (sin necesidad de compilar en RPG Maker)."}</p>
        <div class="row wrap"><label>Objeto <input id="cf-item" class="inp mono" list="dl-items" value="POTION" /></label>
        <label>Cantidad <input id="cf-qty" class="inp num" type="number" value="1" min="1" /></label></div>
        ${T === "item" ? `${sprRow("Object ball")}<p class="muted small" id="cf-gfxnote"></p>` : ""}`;
      const note = f.querySelector("#cf-gfxnote");
      if (note) {
        FS.exists("Graphics/Characters/Object ball.png").then((ok) => {
          note.textContent = ok ? "Gráfico clásico encontrado en tu proyecto." : "Aviso: no existe 'Object ball' en tu proyecto; elige otro sprite o déjalo vacío.";
        }).catch(() => { note.textContent = ""; });
      }
    } else if (T === "gift") {
      f.innerHTML = `<div class="row wrap"><label>Nombre <input id="cf-name" class="inp" value="Regalo Pokémon" /></label>${dirSel()}</div>${sprRow()}
        <div class="row wrap"><label>Especie <input id="cf-species" class="inp mono" list="dl-species" value="MEW" /></label>
        <label>Nivel <input id="cf-level" class="inp num" type="number" value="20" min="1" max="100" /></label></div>
        <label>Antes<textarea id="cf-before" class="inp" rows="2">Toma, este Pokémon es para ti.</textarea></label>
        <label>Después<textarea id="cf-after" class="inp" rows="2">¡Cuídalo bien!</textarea></label>
        <label>Si el equipo está lleno<textarea id="cf-full" class="inp" rows="1">Tu equipo está lleno.</textarea></label>`;
    } else if (T === "heal") {
      f.innerHTML = `<div class="row wrap"><label>Nombre <input id="cf-name" class="inp" value="Curandera" /></label>${dirSel()}</div>${sprRow()}
        <label>Saludo<textarea id="cf-greet" class="inp" rows="2">Hola, ¿quieres que cure a tus Pokémon?</textarea></label>
        <label>Tras curar<textarea id="cf-healed" class="inp" rows="2">Tus Pokémon están como nuevos.</textarea></label>
        <label>Si dice que no<textarea id="cf-no" class="inp" rows="1">De acuerdo, vuelve cuando quieras.</textarea></label>`;
    } else if (T === "mart") {
      f.innerHTML = `<div class="row wrap"><label>Nombre <input id="cf-name" class="inp" value="Dependiente" /></label>${dirSel()}</div>${sprRow()}
        <label>Saludo<textarea id="cf-greet" class="inp" rows="2">¡Bienvenido! ¿Qué deseas comprar?</textarea></label>
        <label>Mercancía (un ID por línea)<textarea id="cf-stock" class="inp mono" rows="5">POKEBALL
POTION
ANTIDOTE
ESCAPEROPE</textarea></label>`;
    } else if (T === "sign") {
      f.innerHTML = `<label>Nombre <input id="cf-name" class="inp" value="Cartel" /></label>
        <label>Texto<textarea id="cf-lines" class="inp" rows="3">PUEBLO DEMO
Población: tú y 3 NPCs.</textarea></label>`;
    } else if (T === "transfer") {
      f.innerHTML = `<label>Nombre <input id="cf-name" class="inp" value="Salida" /></label>
        <div class="row wrap"><button class="btn small" id="cf-tmap">Destino: <b id="cf-tmapn"></b></button>
        <label>X <input id="cf-tx" class="inp num" type="number" value="5" /></label>
        <label>Y <input id="cf-ty" class="inp num" type="number" value="5" /></label></div>`;
      st.tmap = st.map;
      const upd = () => {
        const m = S.mapList.find((x) => x.id === st.tmap);
        f.querySelector("#cf-tmapn").textContent = `${st.tmap}: ${m?.name || "?"}`;
      };
      upd();
      f.querySelector("#cf-tmap").onclick = () => mapPickerModal("Mapa destino", (id) => { st.tmap = id; upd(); });
    } else if (T === "wild") {
      f.innerHTML = `<div class="row wrap"><label>Nombre <input id="cf-name" class="inp" value="Salvaje" /></label>
        <label>Disparador <select id="cf-trig" class="inp"><option value="0">Acción (tecla)</option><option value="1">Tocar jugador</option></select></label></div>${sprRow()}
        <div class="row wrap"><label>Especie <input id="cf-species" class="inp mono" list="dl-species" value="PIKACHU" /></label>
        <label>Nivel <input id="cf-level" class="inp num" type="number" value="10" min="1" max="100" /></label>
        <label>Variable resultado <input id="cf-var" class="inp num" type="number" value="1" min="0" /></label>
        <label class="check"><input type="checkbox" id="cf-run" checked /> Puede huir</label>
        <label class="check"><input type="checkbox" id="cf-lose" /> Seguir si pierdes</label></div>
        <label>Presentación<textarea id="cf-intro" class="inp" rows="2">¡Un Pokémon salvaje bloquea el paso!</textarea></label>`;
    }
    const pick = f.querySelector("#cf-sprpick");
    if (pick) pick.onclick = () => spritePickerModal("Sprite", f.querySelector("#cf-sprite").value, (n) => {
      f.querySelector("#cf-sprite").value = n; drawPrev();
    });
    f.oninput = drawPrev;
    f.onchange = drawPrev;
    drawPrev();
  }

  function collect() {
    const f = el.querySelector("#ce-form");
    const v = (id) => f.querySelector("#" + id)?.value ?? "";
    const T = st.tpl;
    const base = { sprite: v("cf-sprite"), dir: Number(v("cf-dir") || 2) };
    if (T === "npc") return { ...base, name: v("cf-name"), dialog: linesOf(v("cf-dialog")) };
    if (T === "trainer") {
      return {
        ...base, sight: Number(v("cf-sight") || 3), ttype: v("cf-ttype"), tname: v("cf-tname"),
        version: Number(v("cf-ver") || 0), double: !!f.querySelector("#cf-double")?.checked,
        intro: linesOf(v("cf-intro")), after: linesOf(v("cf-after")),
        loseText: v("cf-lose"), makePBS: !!f.querySelector("#cf-pbs")?.checked, team: st.team,
      };
    }
    if (T === "item" || T === "hidden") return { item: v("cf-item"), qty: Number(v("cf-qty") || 1), graphic: v("cf-sprite") };
    if (T === "gift") return { ...base, name: v("cf-name"), species: v("cf-species"), level: Number(v("cf-level") || 5), before: linesOf(v("cf-before")), after: linesOf(v("cf-after")), full: linesOf(v("cf-full")) };
    if (T === "heal") return { ...base, name: v("cf-name"), greet: linesOf(v("cf-greet")), healed: linesOf(v("cf-healed")), no: linesOf(v("cf-no")) };
    if (T === "mart") return { ...base, name: v("cf-name"), greet: linesOf(v("cf-greet")), stock: String(v("cf-stock")).split(/[\s,]+/).map((s) => s.trim().toUpperCase()).filter(Boolean) };
    if (T === "sign") return { name: v("cf-name"), lines: linesOf(v("cf-lines")) };
    if (T === "transfer") return { name: v("cf-name"), map: st.tmap, x: Number(v("cf-tx")), y: Number(v("cf-ty")) };
    if (T === "wild") return { ...base, name: v("cf-name"), trigger: Number(v("cf-trig") || 0), species: v("cf-species"), level: Number(v("cf-level") || 5), outcomeVar: Number(v("cf-var") || 1), canRun: !!f.querySelector("#cf-run")?.checked, canLose: !!f.querySelector("#cf-lose")?.checked, intro: linesOf(v("cf-intro")) };
    return {};
  }

  function drawPrev() {
    const box = el.querySelector("#ce-prev");
    try {
      const p = collect();
      const { name, pages } = buildTemplate(st.tpl, p);
      let html = `<p class="muted small">Vista previa: <b>${esc(name)}</b> · ${pages.length} página(s)</p>`;
      pages.forEach((pg, i) => {
        const trig = Number(pg.getIvar("trigger") || 0);
        const g = pg.getIvar("graphic");
        const gfx = g ? rstr(g.getIvar("character_name")) : "";
        const list = pg.getIvar("list") || [];
        html += `<div class="logrow">Pág ${i + 1} · ${esc(TRIGGERS[trig] || trig)}${gfx ? " · " + esc(gfx) : ""} · ${list.length} cmds</div>`;
        for (const o of list.slice(0, 30)) {
          const { code, indent, params } = cmdOf(o);
          const h = humanizeCommand(code, params);
          html += `<div class="logrow" style="margin-left:${8 + indent * 14}px"><span class="mono muted">#${code}</span> <b>${esc(h.title)}</b> <span class="muted">${esc(h.detail || "")}</span></div>`;
        }
        if (list.length > 30) html += `<div class="logrow muted">…${list.length - 30} más</div>`;
      });
      // avisos rápidos
      const warns = [];
      if (st.tpl === "trainer") {
        if (!/^[A-Z0-9_]+$/.test((p.ttype || "").toUpperCase())) warns.push("El tipo debe ser un ID en MAYÚSCULAS (p. ej. CAMPER).");
        for (const m of p.team) {
          if (speciesList.length && m.species && !speciesList.includes(m.species.toUpperCase())) warns.push(`Especie del equipo ausente en pokemon.txt: ${m.species}`);
        }
        if (!p.team.length) warns.push("El equipo está vacío: el entrenador necesita al menos 1 Pokémon.");
      }
      if ((st.tpl === "item" || st.tpl === "hidden") && itemList.length && p.item && !itemList.includes(p.item.toUpperCase())) {
        warns.push(`Objeto ausente en items.txt: ${p.item}`);
      }
      if ((st.tpl === "gift" || st.tpl === "wild") && speciesList.length && p.species && !speciesList.includes(p.species.toUpperCase())) {
        warns.push(`Especie ausente en pokemon.txt: ${p.species}`);
      }
      if (st.tpl === "mart" && itemList.length) {
        for (const s of p.stock) if (!itemList.includes(s)) warns.push(`Objeto de tienda ausente en items.txt: ${s}`);
      }
      if (warns.length) html += warns.slice(0, 6).map((w) => `<div class="logrow warn">${esc(w)}</div>`).join("");
      box.innerHTML = html;
    } catch (e) { box.innerHTML = `<div class="logrow error">${esc(e.message)}</div>`; }
  }

  el.querySelector("#ce-create").onclick = async () => {
    const out = el.querySelector("#ce-out");
    try {
      st.x = Number(el.querySelector("#ce-x").value);
      st.y = Number(el.querySelector("#ce-y").value);
      const rec = await loadMap(st.map);
      if (st.x < 0 || st.y < 0 || st.x >= rec.parsed.width || st.y >= rec.parsed.height) {
        toast(`Casilla fuera del mapa (${rec.parsed.width}x${rec.parsed.height}).`, "error");
        return;
      }
      const p = collect();
      if (st.tpl === "trainer" && (!p.ttype || !p.tname)) { toast("El entrenador necesita tipo y nombre.", "error"); return; }
      if ((st.tpl === "item" || st.tpl === "hidden") && !p.item) { toast("Elige un objeto.", "error"); return; }
      const { name, pages } = buildTemplate(st.tpl, p);
      const id = insertEvent(rec.parsed, name, st.x, st.y, pages);
      markMapDirty(st.map); dirty();
      await saveMap(st.map);
      let extra = "";
      if (st.tpl === "trainer" && p.makePBS) {
        const rel = findPBS(["PBS/trainers.txt", "trainers.txt"]);
        if (!rel) extra = " (sin trainers.txt: no se creó la entrada PBS)";
        else {
          const { header, body } = formatTrainerEntry({
            type: p.ttype.toUpperCase(), name: p.tname, version: p.version,
            loseText: p.loseText, team: p.team,
          });
          const text = await pbsTextOr(rel);
          const existed = getSectionBody(text, header.slice(1, -1)).found;
          await savePBSText(rel, setSectionBody(text, header.slice(1, -1), body));
          extra = existed ? ` (entrada ${header} actualizada)` : ` (entrada ${header} creada)`;
        }
      }
      S.currentMap = st.map; S.currentEvent = id; S.currentPage = 0;
      out.innerHTML = `<div class="logrow ok">Evento ${id} "${esc(name)}" creado en mapa ${st.map} @(${st.x},${st.y})${esc(extra)}</div>
        <div class="row" style="margin-top:6px"><button class="btn small" id="ce-jump">Ver en Eventos</button></div>`;
      out.querySelector("#ce-jump").onclick = () => goTab("events");
      toast(`Evento ${id} creado.`);
      log(`Crear: evento ${id} (${st.tpl}) en mapa ${st.map}.`);
    } catch (e) { out.innerHTML = `<div class="logrow error">${esc(e.message)}</div>`; }
  };
  drawForm();
}

// Editor de equipo reutilizable (entrenador del evento y entrenador PBS).
function drawTeamEditor(box, team) {
  const paint = () => {
    box.innerHTML = `<p class="muted small">Equipo (${team.length}/6):</p>` + team.map((m, i) => `
      <div class="flagrow"><span class="mono muted">${i + 1}</span>
        <input class="inp mono" data-i="${i}" data-k="species" list="dl-species" value="${esc(m.species)}" placeholder="ESPECIE" style="max-width:130px" />
        <input class="inp num" data-i="${i}" data-k="level" type="number" value="${m.level}" min="1" max="100" title="Nivel" />
        <input class="inp" data-i="${i}" data-k="moves" value="${esc(m.moves)}" placeholder="Movs. (coma)" />
        <input class="inp mono" data-i="${i}" data-k="item" list="dl-items" value="${esc(m.item)}" placeholder="Objeto" style="max-width:110px" />
        <button class="btn small" data-del="${i}" title="Quitar">X</button>
      </div>`).join("") + (team.length < 6 ? `<button class="btn small" id="team-add">+ Añadir Pokémon</button>` : `<p class="muted small">Equipo completo.</p>`);
    box.querySelectorAll("[data-i]").forEach((inp) => {
      inp.oninput = () => {
        const m = team[Number(inp.dataset.i)];
        m[inp.dataset.k] = inp.dataset.k === "level" ? Number(inp.value) : inp.value.toUpperCase();
      };
    });
    box.querySelectorAll("[data-del]").forEach((b) => {
      b.onclick = () => { team.splice(Number(b.dataset.del), 1); paint(); };
    });
    const add = box.querySelector("#team-add");
    if (add) add.onclick = () => {
      team.push({ species: "RATTATA", level: 5, moves: "", ability: "", item: "", gender: "", nick: "", iv: "", shiny: false, ball: "" });
      paint();
    };
  };
  paint();
}

// ============================================================================
// 2. Creador de mapas
// ============================================================================
function renderMapCreator(el, { goTab }) {
  const st = { mode: "blank", src: S.currentMap || S.tree[0]?.id || 1, parent: 0 };
  const tsOpts = [...S.tilesets.entries()].map(([id, t]) => `<option value="${id}">${id}: ${esc(t.name || t.tilesetName || "?")}</option>`).join("");
  el.innerHTML = `
    <div class="row">
      <button class="chip sel" id="mm-blank">Mapa vacío</button>
      <button class="chip" id="mm-dup">Duplicar mapa</button>
    </div>
    <div id="mm-form" style="margin-top:8px"></div>
    <div class="row wrap" style="margin-top:8px">
      <button class="btn small" id="mm-parent">Padre: <b id="mm-parentn">raíz</b></button>
      <button class="btn primary" id="mm-create">Crear mapa</button>
    </div>
    <div id="mm-out" style="margin-top:8px"></div>`;
  el.querySelector("#mm-blank").onclick = () => { st.mode = "blank"; sync(); };
  el.querySelector("#mm-dup").onclick = () => { st.mode = "dup"; sync(); };
  el.querySelector("#mm-parent").onclick = () => mapPickerModal("Mapa padre (árbol)", (id) => {
    st.parent = id; updParent();
  });
  const updParent = () => {
    const m = S.mapList.find((x) => x.id === st.parent);
    el.querySelector("#mm-parentn").textContent = st.parent ? `${st.parent}: ${m?.name || "?"}` : "raíz";
  };
  const sync = () => {
    el.querySelector("#mm-blank").classList.toggle("sel", st.mode === "blank");
    el.querySelector("#mm-dup").classList.toggle("sel", st.mode === "dup");
    const f = el.querySelector("#mm-form");
    if (st.mode === "blank") {
      f.innerHTML = `<div class="row wrap"><label>Nombre <input id="mm-name" class="inp" value="Mapa nuevo" /></label>
        <label>Ancho <input id="mm-w" class="inp num" type="number" value="20" min="1" max="256" /></label>
        <label>Alto <input id="mm-h" class="inp num" type="number" value="15" min="1" max="256" /></label></div>
        <div class="row wrap"><label>Tileset <select id="mm-ts" class="inp">${tsOpts}</select></label>
        <label>Relleno (id de tile) <input id="mm-fill" class="inp num" type="number" value="0" min="0" /></label></div>
        <p class="muted small">El mapa nace vacío (sin eventos). Luego añade eventos con la sección 1 y píntalo en tu PC si quieres arte detallado.</p>`;
    } else {
      const m = S.mapList.find((x) => x.id === st.src);
      f.innerHTML = `<div class="row wrap"><button class="btn small" id="mm-src">Origen: <b>${st.src}: ${esc(m?.name || "?")}</b></button>
        <label>Nombre <input id="mm-name" class="inp" value="Copia de ${esc(m?.name || "")}" /></label></div>
        <div class="row wrap"><label class="check"><input type="checkbox" id="mm-enc" checked /> Copiar encuentros</label>
        <label class="check"><input type="checkbox" id="mm-meta" checked /> Copiar metadatos</label></div>
        <p class="muted small">Los teletransportes internos seguirán apuntando a los mapas originales: revísalos con la Auditoría.</p>`;
      f.querySelector("#mm-src").onclick = () => mapPickerModal("Mapa origen", (id) => { st.src = id; sync(); });
    }
  };
  sync();
  el.querySelector("#mm-create").onclick = async () => {
    const out = el.querySelector("#mm-out");
    try {
      const f = el.querySelector("#mm-form");
      const name = f.querySelector("#mm-name").value.trim() || "Mapa nuevo";
      const newId = S.mapList.reduce((m, x) => Math.max(m, x.id), 0) + 1;
      let obj;
      if (st.mode === "blank") {
        obj = buildMap({
          tilesetId: Number(f.querySelector("#mm-ts").value),
          width: Number(f.querySelector("#mm-w").value),
          height: Number(f.querySelector("#mm-h").value),
          fill: Number(f.querySelector("#mm-fill").value),
        });
      } else {
        const src = await loadMap(st.src);
        obj = marshalLoad(marshalDump(src.parsed.obj));
      }
      const order = S.mapList.filter((x) => x.parent === st.parent).length + 1;
      S.mapInfosObj.pairs.push([newId, buildMapInfo(name, st.parent, order)]);
      S.maps.set(newId, { info: null, parsed: parseMap(obj), dirty: true });
      await saveMap(newId);
      await saveMapInfos();
      const rec = S.maps.get(newId);
      if (rec) rec.info = S.mapList.find((x) => x.id === newId);
      let extra = "";
      if (st.mode === "dup") {
        const wantEnc = f.querySelector("#mm-enc").checked;
        const wantMeta = f.querySelector("#mm-meta").checked;
        const heads = [`[${pad3(st.src)}]`, `[${st.src}]`];
        if (wantEnc) {
          const rel = findPBS(["PBS/encounters.txt", "encounters.txt"]);
          if (rel) {
            let text = await pbsTextOr(rel);
            for (const h of [pad3(st.src), String(st.src)]) {
              const { found, body } = getSectionBody(text, h);
              if (found && body) { text = setSectionBody(text, pad3(newId), body); extra += " +encuentros"; break; }
            }
            await savePBSText(rel, text);
          }
        }
        if (wantMeta) {
          const rel = findPBS(["PBS/metadata.txt", "metadata.txt"]);
          if (rel) {
            let text = await pbsTextOr(rel);
            for (const h of [pad3(st.src), String(st.src)]) {
              const { found, body } = getSectionBody(text, h);
              if (found && body) {
                const renamed = body.replace(/^Name\s*=.*$/m, `Name = ${name}`);
                text = setSectionBody(text, pad3(newId), renamed); extra += " +metadatos"; break;
              }
            }
            await savePBSText(rel, text);
          }
        }
        void heads;
      }
      S.currentMap = newId;
      out.innerHTML = `<div class="logrow ok">Mapa ${newId} "${esc(name)}" creado${esc(extra)}.</div>
        <div class="row" style="margin-top:6px"><button class="btn small" id="mm-jump">Ver en Mapas</button></div>`;
      out.querySelector("#mm-jump").onclick = () => goTab("maps");
      toast(`Mapa ${newId} creado.`);
      log(`Crear: mapa ${newId} "${name}".`);
    } catch (e) { out.innerHTML = `<div class="logrow error">${esc(e.message)}</div>`; }
  };
}

// Guarda en la cabecera que ya exista ([002] o [2]) o crea [002].
function smartSetSection(text, idNum, body) {
  for (const h of [pad3(idNum), String(idNum)]) {
    if (getSectionBody(text, h).found) return setSectionBody(text, h, body);
  }
  return setSectionBody(text, pad3(idNum), body);
}

// ============================================================================
// 3. Creador de datos PBS
// ============================================================================
function renderPbsCreator(el) {
  const st = {
    kind: "trainer", map: S.currentMap || 1, fmap: S.currentMap || 1,
    team: [{ species: "RATTATA", level: 5, moves: "", ability: "", item: "", gender: "", nick: "", iv: "", shiny: false, ball: "" }],
    blocks: [{ type: "Land", density: "21", rows: [{ ch: 50, species: "RATTATA", min: 2, max: 4 }, { ch: 50, species: "PIDGEY", min: 2, max: 4 }] }],
  };
  el.innerHTML = `
    <div class="row wrap"><label>Qué crear <select id="pc-kind" class="inp">
      <option value="trainer">Entrenador (trainers.txt)</option>
      <option value="enc">Encuentros (encounters.txt)</option>
      <option value="meta">Metadatos de mapa (metadata.txt)</option>
      <option value="point">Punto de mapamundi (townmap.txt)</option>
      <option value="conn">Conexión (connections.txt)</option>
    </select></label></div>
    <div id="pc-form" style="margin-top:8px"></div>
    <div id="pc-prev" class="log" style="margin-top:8px"></div>
    <div class="row" style="margin-top:8px"><button class="btn primary" id="pc-save">Guardar en PBS</button></div>
    <div id="pc-out" style="margin-top:8px"></div>`;
  el.querySelector("#pc-kind").onchange = (e) => { st.kind = e.target.value; drawForm(); };
  const mapBtn = (id, label) => `<button class="btn small" id="${id}">${label}: <b id="${id}n"></b></button>`;

  function drawForm() {
    const f = el.querySelector("#pc-form");
    const K = st.kind;
    if (K === "trainer") {
      f.innerHTML = `
        <div class="row wrap"><label>Tipo <input id="cp-ttype" class="inp mono" list="dl-ttypes" value="CAMPER" /></label>
        <label>Nombre <input id="cp-tname" class="inp" value="Dave" /></label>
        <label>Versión <input id="cp-ver" class="inp num" type="number" value="0" min="0" /></label></div>
        <div class="row wrap"><label>Frase de derrota <input id="cp-lose" class="inp" value="¡Perdí!" /></label>
        <label>Objetos (coma) <input id="cp-items" class="inp mono" placeholder="POTION,FULLRESTORE" /></label></div>
        <div id="cp-team"></div>`;
      drawTeamEditor(f.querySelector("#cp-team"), st.team);
    } else if (K === "enc") {
      const m = S.mapList.find((x) => x.id === st.map);
      f.innerHTML = `
        <div class="row wrap">${mapBtn("cp-map", "Mapa")} <span class="muted" id="cp-maplabel">${st.map}: ${esc(m?.name || "?")}</span>
        <label>Versión <input id="cp-ver" class="inp num" type="number" value="0" min="0" /></label></div>
        <div id="cp-blocks"></div>
        <button class="btn small" id="cp-addblock">+ Añadir tipo de encuentro</button>
        <p class="muted small">Las probabilidades de cada tipo deben sumar 100.</p>`;
      f.querySelector("#cp-map").onclick = () => mapPickerModal("Mapa", (id) => { st.map = id; drawForm(); });
      drawBlocksEditor(f.querySelector("#cp-blocks"));
      f.querySelector("#cp-addblock").onclick = () => {
        st.blocks.push({ type: "Water", density: "2", rows: [{ ch: 100, species: "MAGIKARP", min: 5, max: 10 }] });
        drawForm();
      };
    } else if (K === "meta") {
      const m = S.mapList.find((x) => x.id === st.map);
      const yn = (id) => `<select id="${id}" class="inp"><option value="">(vacío)</option><option>true</option><option>false</option></select>`;
      f.innerHTML = `
        <div class="row wrap">${mapBtn("cp-map", "Mapa")} <span class="muted">${st.map}: ${esc(m?.name || "?")}</span></div>
        <div class="row wrap"><label>Nombre mostrado <input id="cp-name" class="inp" value="${esc(m?.name || "")}" /></label>
        <label>Exterior ${yn("cp-out")}</label><label>Mostrar área ${yn("cp-show")}</label><label>Bici ${yn("cp-bike")}</label></div>
        <div class="row wrap"><label>MapPosition reg. <input id="cp-mpr" class="inp num" type="number" value="0" min="0" /></label>
        <label>x <input id="cp-mpx" class="inp num" type="number" value="13" /></label>
        <label>y <input id="cp-mpy" class="inp num" type="number" value="12" /></label></div>
        <div class="row wrap"><label>HealingSpot mapa <input id="cp-hsm" class="inp num" type="number" value="${st.map}" /></label>
        <label>x <input id="cp-hsx" class="inp num" type="number" value="5" /></label>
        <label>y <input id="cp-hsy" class="inp num" type="number" value="5" /></label></div>
        <div class="row wrap"><label>Fondo batalla <input id="cp-bb" class="inp" placeholder="field" /></label></div>`;
      f.querySelector("#cp-map").onclick = () => mapPickerModal("Mapa", (id) => { st.map = id; drawForm(); });
    } else if (K === "point") {
      f.innerHTML = `<div class="row wrap"><label>Región <select id="cp-region" class="inp"></select></label>
        <label>X <input id="cp-x" class="inp num" type="number" value="13" min="0" max="29" /></label>
        <label>Y <input id="cp-y" class="inp num" type="number" value="12" min="0" max="19" /></label></div>
        <div class="row wrap"><label>Nombre <input id="cp-name" class="inp" value="Pueblo" /></label>
        <label>Punto de interés <input id="cp-poi" class="inp" placeholder="Tienda, cueva…" /></label></div>
        <div class="row wrap"><label class="check"><input type="checkbox" id="cp-fly" /> Destino de vuelo</label>
        ${mapBtn("cp-fmap", "Mapa")} <span class="muted" id="cp-fmaplabel"></span>
        <label>x <input id="cp-fx" class="inp num" type="number" value="5" /></label>
        <label>y <input id="cp-fy" class="inp num" type="number" value="5" /></label>
        <label>Switch <input id="cp-sw" class="inp num" type="number" placeholder="(vacío)" /></label></div>`;
      const rel = findPBS(["PBS/townmap.txt", "PBS/town_map.txt", "townmap.txt", "town_map.txt"]);
      pbsTextOr(rel).then((text) => {
        const regs = getTownRegions(text);
        const sel = f.querySelector("#cp-region");
        sel.innerHTML = regs.map((r) => `<option value="${esc(r.region)}">[${esc(r.region)}] ${esc(r.name || "?")}</option>`).join("") || `<option value="0">[0]</option>`;
        drawPrev();
      });
      const updF = () => {
        const m = S.mapList.find((x) => x.id === st.fmap);
        f.querySelector("#cp-fmaplabel").textContent = `${st.fmap}: ${m?.name || "?"}`;
      };
      updF();
      f.querySelector("#cp-fmap").onclick = () => mapPickerModal("Mapa de vuelo", (id) => { st.fmap = id; updF(); drawPrev(); });
    } else if (K === "conn") {
      const edge = (id) => `<select id="${id}" class="inp">${["N", "S", "E", "W"].map((e) => `<option>${e}</option>`).join("")}</select>`;
      f.innerHTML = `
        <div class="row wrap">${mapBtn("cp-a", "Mapa A")} <span class="muted" id="cp-alabel"></span>
        <label>Borde ${edge("cp-ea")}</label><label>Desfase <input id="cp-oa" class="inp num" type="number" value="0" /></label></div>
        <div class="row wrap">${mapBtn("cp-b", "Mapa B")} <span class="muted" id="cp-blabel"></span>
        <label>Borde ${edge("cp-eb")}</label><label>Desfase <input id="cp-ob" class="inp num" type="number" value="0" /></label></div>
        <p class="muted small">Une bordes de mapas exteriores para caminar sin cortes (N/S/E/W con desfase en casillas).</p>`;
      st.ca = st.ca || st.map; st.cb = st.cb || st.map;
      const upd = () => {
        const ma = S.mapList.find((x) => x.id === st.ca);
        const mb = S.mapList.find((x) => x.id === st.cb);
        f.querySelector("#cp-alabel").textContent = `${st.ca}: ${ma?.name || "?"}`;
        f.querySelector("#cp-blabel").textContent = `${st.cb}: ${mb?.name || "?"}`;
      };
      upd();
      f.querySelector("#cp-a").onclick = () => mapPickerModal("Mapa A", (id) => { st.ca = id; upd(); drawPrev(); });
      f.querySelector("#cp-b").onclick = () => mapPickerModal("Mapa B", (id) => { st.cb = id; upd(); drawPrev(); });
    }
    f.oninput = drawPrev;
    f.onchange = drawPrev;
    drawPrev();
  }

  function drawBlocksEditor(box) {
    box.innerHTML = st.blocks.map((b, i) => {
      const sum = b.rows.reduce((a, r) => a + (Number(r.ch) || 0), 0);
      return `<div class="card"><div class="row wrap">
        <label>Tipo <select class="inp" data-b="${i}" data-k="type">${ENCOUNTER_TYPES.map(([t]) => `<option${t === b.type ? " selected" : ""}>${t}</option>`).join("")}</select></label>
        <label>Densidad <input class="inp num" data-b="${i}" data-k="density" value="${esc(b.density)}" /></label>
        <span class="muted small">suma ${sum}${sum === 100 ? "" : " (debería ser 100)"}</span>
        <button class="btn small" data-norm="${i}">Normalizar</button>
        <button class="btn small" data-delb="${i}">Quitar tipo</button></div>
        ${b.rows.map((r, j) => `<div class="flagrow"><span class="mono muted">${j + 1}</span>
          <input class="inp num" data-b="${i}" data-r="${j}" data-k="ch" type="number" value="${r.ch}" title="Probabilidad" />
          <input class="inp mono" data-b="${i}" data-r="${j}" data-k="species" list="dl-species" value="${esc(r.species)}" style="max-width:130px" />
          <input class="inp num" data-b="${i}" data-r="${j}" data-k="min" type="number" value="${r.min}" title="Nv mín" />
          <input class="inp num" data-b="${i}" data-r="${j}" data-k="max" type="number" value="${r.max}" title="Nv máx" />
          <button class="btn small" data-delr="${i}:${j}">X</button></div>`).join("")}
        <button class="btn small" data-addr="${i}">+ Añadir fila</button></div>`;
    }).join("");
    box.querySelectorAll("[data-b][data-k]").forEach((inp) => {
      inp.oninput = () => {
        const b = st.blocks[Number(inp.dataset.b)];
        if (inp.dataset.r === undefined) b[inp.dataset.k] = inp.value;
        else {
          const r = b.rows[Number(inp.dataset.r)];
          r[inp.dataset.k] = inp.dataset.k === "species" ? inp.value.toUpperCase() : Number(inp.value);
        }
        drawPrev();
      };
    });
    box.querySelectorAll("[data-delb]").forEach((btn) => {
      btn.onclick = () => { st.blocks.splice(Number(btn.dataset.delb), 1); drawForm(); };
    });
    box.querySelectorAll("[data-delr]").forEach((btn) => {
      btn.onclick = () => {
        const [i, j] = btn.dataset.delr.split(":").map(Number);
        st.blocks[i].rows.splice(j, 1); drawForm();
      };
    });
    box.querySelectorAll("[data-addr]").forEach((btn) => {
      btn.onclick = () => {
        st.blocks[Number(btn.dataset.addr)].rows.push({ ch: 10, species: "RATTATA", min: 2, max: 4 });
        drawForm();
      };
    });
    box.querySelectorAll("[data-norm]").forEach((btn) => {
      btn.onclick = () => {
        const b = st.blocks[Number(btn.dataset.norm)];
        b.rows = normalizeChances(b.rows);
        drawForm();
      };
    });
  }

  function collect() {
    const f = el.querySelector("#pc-form");
    const v = (id) => f.querySelector("#" + id)?.value ?? "";
    const K = st.kind;
    if (K === "trainer") {
      return formatTrainerEntry({
        type: v("cp-ttype").toUpperCase(), name: v("cp-tname"), version: Number(v("cp-ver") || 0),
        loseText: v("cp-lose"), items: v("cp-items").toUpperCase(), team: st.team,
      });
    }
    if (K === "enc") {
      const ver = Number(v("cp-ver") || 0);
      return { header: `[${pad3(st.map)}${ver ? "," + ver : ""}]`, body: formatEncountersBody(st.blocks) };
    }
    if (K === "meta") {
      return {
        header: `[${pad3(st.map)}]`,
        body: formatMetadataSection({
          name: v("cp-name"), Outdoor: v("cp-out"), ShowArea: v("cp-show"), Bicycle: v("cp-bike"),
          mapPosition: `${v("cp-mpr")},${v("cp-mpx")},${v("cp-mpy")}`,
          healingSpot: `${v("cp-hsm")},${v("cp-hsx")},${v("cp-hsy")}`,
          battleBack: v("cp-bb"),
        }),
      };
    }
    if (K === "point") {
      const fly = !!f.querySelector("#cp-fly")?.checked;
      const line = `Point = ${v("cp-x")},${v("cp-y")},${v("cp-name")},${v("cp-poi")},${fly ? st.fmap : ""},${fly ? v("cp-fx") : ""},${fly ? v("cp-fy") : ""},${v("cp-sw")}`;
      return { header: `[${v("cp-region") || "0"}]`, body: line, point: true };
    }
    if (K === "conn") {
      return { header: "", body: formatConnection({ a: st.ca, edgeA: v("cp-ea"), offA: Number(v("cp-oa")), b: st.cb, edgeB: v("cp-eb"), offB: Number(v("cp-ob")) }), conn: true };
    }
    return null;
  }

  function drawPrev() {
    const box = el.querySelector("#pc-prev");
    try {
      const c = collect();
      if (!c) { box.innerHTML = ""; return; }
      box.innerHTML = `<div class="logrow mono">${esc(c.header)}${c.header ? "<br/>" : ""}${esc(c.body).replace(/\n/g, "<br/>")}</div>`;
    } catch (e) { box.innerHTML = `<div class="logrow error">${esc(e.message)}</div>`; }
  }

  el.querySelector("#pc-save").onclick = async () => {
    const out = el.querySelector("#pc-out");
    try {
      const K = st.kind;
      const c = collect();
      if (K === "trainer") {
        const rel = findPBS(["PBS/trainers.txt", "trainers.txt"]);
        if (!rel) throw new Error("No hay trainers.txt en este proyecto.");
        const text = await pbsTextOr(rel);
        const sec = c.header.slice(1, -1);
        const existed = getSectionBody(text, sec).found;
        await savePBSText(rel, setSectionBody(text, sec, c.body));
        out.innerHTML = `<div class="logrow ok">trainers.txt ${c.header} ${existed ? "actualizado" : "creado"}.</div>`;
      } else if (K === "enc") {
        const rel = findPBS(["PBS/encounters.txt", "encounters.txt"]);
        if (!rel) throw new Error("No hay encounters.txt en este proyecto.");
        const text = await pbsTextOr(rel);
        const sec = c.header.slice(1, -1);
        await savePBSText(rel, setSectionBody(text, sec, c.body));
        out.innerHTML = `<div class="logrow ok">encounters.txt ${c.header} guardado.</div>`;
      } else if (K === "meta") {
        const rel = findPBS(["PBS/metadata.txt", "metadata.txt"]);
        if (!rel) throw new Error("No hay metadata.txt en este proyecto.");
        const text = await pbsTextOr(rel);
        await savePBSText(rel, smartSetSection(text, st.map, c.body));
        out.innerHTML = `<div class="logrow ok">metadata.txt [${pad3(st.map)}] guardado.</div>`;
      } else if (K === "point") {
        const rel = findPBS(["PBS/townmap.txt", "PBS/town_map.txt", "townmap.txt", "town_map.txt"]);
        if (!rel) throw new Error("No hay townmap.txt en este proyecto.");
        const f = el.querySelector("#pc-form");
        const region = f.querySelector("#cp-region").value || "0";
        const px = Number(f.querySelector("#cp-x").value), py = Number(f.querySelector("#cp-y").value);
        const text = await pbsTextOr(rel);
        const regs = getTownRegions(text);
        const reg = regs.find((r) => r.region === region) || { points: [] };
        const pts = reg.points.filter((p) => !(p.x === px && p.y === py));
        const fly = !!f.querySelector("#cp-fly")?.checked;
        pts.push({
          x: px, y: py, name: f.querySelector("#cp-name").value, poi: f.querySelector("#cp-poi").value,
          flyMap: fly ? st.fmap : "", flyX: fly ? f.querySelector("#cp-fx").value : "",
          flyY: fly ? f.querySelector("#cp-fy").value : "", sw: f.querySelector("#cp-sw").value,
        });
        await savePBSText(rel, setTownPoints(text, region, pts));
        out.innerHTML = `<div class="logrow ok">Punto (${px},${py}) guardado en la región ${esc(region)}.</div>`;
      } else if (K === "conn") {
        const rel = findPBS(["PBS/connections.txt", "connections.txt"]);
        if (!rel) throw new Error("No hay connections.txt en este proyecto.");
        let text = await pbsTextOr(rel);
        if (text.split("\n").some((l) => l.trim() === c.body)) {
          out.innerHTML = `<div class="logrow warn">Esa conexión ya existe.</div>`;
        } else {
          if (text && !text.endsWith("\n")) text += "\n";
          await savePBSText(rel, text + c.body + "\n");
          out.innerHTML = `<div class="logrow ok">Conexión añadida: ${esc(c.body)}</div>`;
        }
      }
      log(`Crear: PBS ${st.kind} guardado.`);
    } catch (e) { out.innerHTML = `<div class="logrow error">${esc(e.message)}</div>`; }
  };
  drawForm();
}

// ============================================================================
// 4. Editor visual de mapamundi
// ============================================================================
function renderRegionEditor(el) {
  const st = { file: null, text: "", regions: [], ri: 0, points: [], sel: null, img: null, missing: true };
  el.innerHTML = `
    <div class="row wrap"><label>Región <select id="rg-sel" class="inp"></select></label>
    <span class="muted small" id="rg-info"></span>
    <button class="btn small" id="rg-new">+ Región</button></div>
    <canvas id="rg-cv" width="480" height="320" style="width:100%;border:1px solid #555;margin-top:8px"></canvas>
    <p class="muted small">Toca una casilla para elegirla. Blanco = punto · cian = destino de vuelo · amarillo = selección.</p>
    <div id="rg-form"></div>
    <div class="row" style="margin-top:8px"><button class="btn small" id="rg-savept">Guardar punto</button>
    <button class="btn small" id="rg-delpt">Borrar punto</button>
    <button class="btn primary" id="rg-save">Guardar en PBS</button></div>
    <div id="rg-list" style="margin-top:8px"></div>
    <div id="rg-out" style="margin-top:8px"></div>`;

  async function load() {
    st.file = findPBS(["PBS/townmap.txt", "PBS/town_map.txt", "townmap.txt", "town_map.txt"]);
    if (!st.file) {
      el.innerHTML = `<p class="muted">Este proyecto no tiene townmap.txt.</p>`;
      return;
    }
    st.text = await pbsTextOr(st.file);
    st.regions = getTownRegions(st.text);
    if (!st.regions.length) {
      st.text = setSectionBody(st.text, "0", "Name = Región\nFilename = MapRegion0.png");
      st.regions = getTownRegions(st.text);
    }
    const sel = el.querySelector("#rg-sel");
    sel.innerHTML = st.regions.map((r, i) => `<option value="${i}">[${esc(r.region)}] ${esc(r.name || "?")}</option>`).join("");
    sel.onchange = () => { st.ri = Number(sel.value); pickRegion(); };
    await pickRegion();
  }

  async function pickRegion() {
    const r = st.regions[st.ri];
    st.points = r.points.map((p) => ({ ...p }));
    st.sel = null;
    st.img = null; st.missing = true;
    el.querySelector("#rg-info").textContent = `${r.filename || "(sin imagen)"} · ${st.points.length} puntos`;
    if (r.filename) {
      try {
        st.img = await FS.readImage(`Graphics/Pictures/${r.filename}`);
        st.missing = false;
      } catch { st.missing = true; }
    }
    draw(); drawForm(); drawList();
  }

  function draw() {
    const cv = el.querySelector("#rg-cv");
    const g = cv.getContext("2d");
    g.clearRect(0, 0, 480, 320);
    if (st.img && !st.missing) g.drawImage(st.img, 0, 0, 480, 320);
    else {
      g.fillStyle = "#141b26"; g.fillRect(0, 0, 480, 320);
      g.fillStyle = "#8fa3bf"; g.font = "14px sans-serif";
      g.fillText("Sin imagen (Graphics/Pictures/" + (st.regions[st.ri]?.filename || "?") + ")", 20, 30);
    }
    g.strokeStyle = "rgba(255,255,255,.18)"; g.lineWidth = 1;
    for (let x = 0; x <= 480; x += 16) { g.beginPath(); g.moveTo(x + .5, 0); g.lineTo(x + .5, 320); g.stroke(); }
    for (let y = 0; y <= 320; y += 16) { g.beginPath(); g.moveTo(0, y + .5); g.lineTo(480, y + .5); g.stroke(); }
    for (const p of st.points) {
      g.fillStyle = (p.flyMap !== "" && p.flyMap !== undefined) ? "#39d3ee" : "#ffffff";
      g.beginPath(); g.arc(p.x * 16 + 8, p.y * 16 + 8, 4, 0, 7); g.fill();
    }
    if (st.sel) {
      g.strokeStyle = "#ffd23e"; g.lineWidth = 2;
      g.strokeRect(st.sel.x * 16 + 1, st.sel.y * 16 + 1, 14, 14);
    }
  }

  function drawForm() {
    const box = el.querySelector("#rg-form");
    const p = st.sel ? st.points.find((q) => q.x === st.sel.x && q.y === st.sel.y) : null;
    box.innerHTML = st.sel ? `
      <p class="muted small">Casilla (${st.sel.x},${st.sel.y})</p>
      <div class="row wrap"><label>Nombre <input id="rg-name" class="inp" value="${esc(p?.name || "")}" /></label>
      <label>Punto de interés <input id="rg-poi" class="inp" value="${esc(p?.poi || "")}" /></label></div>
      <div class="row wrap"><label class="check"><input type="checkbox" id="rg-fly" ${p && p.flyMap !== "" ? "checked" : ""} /> Destino de vuelo</label>
      <button class="btn small" id="rg-fmap">Mapa: <b id="rg-fmapn"></b></button>
      <label>x <input id="rg-fx" class="inp num" type="number" value="${esc(p?.flyX ?? 5)}" /></label>
      <label>y <input id="rg-fy" class="inp num" type="number" value="${esc(p?.flyY ?? 5)}" /></label>
      <label>Switch <input id="rg-sw" class="inp num" type="number" value="${esc(p?.sw ?? "")}" placeholder="(vacío)" /></label></div>`
      : `<p class="muted">Elige una casilla del mapa.</p>`;
    if (!st.sel) return;
    st.fmap = (p && p.flyMap !== "" && p.flyMap !== undefined) ? Number(p.flyMap) : (S.currentMap || 1);
    const upd = () => {
      const m = S.mapList.find((x) => x.id === st.fmap);
      box.querySelector("#rg-fmapn").textContent = `${st.fmap}: ${m?.name || "?"}`;
    };
    upd();
    box.querySelector("#rg-fmap").onclick = () => mapPickerModal("Mapa de vuelo", (id) => { st.fmap = id; upd(); });
  }

  function drawList() {
    const box = el.querySelector("#rg-list");
    box.innerHTML = `<p class="muted small">${st.points.length} puntos:</p>` + st.points
      .slice().sort((a, b) => a.y - b.y || a.x - b.x)
      .map((p) => `<div class="flagrow"><button class="btn small" data-j="${p.x},${p.y}">(${p.x},${p.y})</button>
        <span><b>${esc(p.name || "(sin nombre)")}</b>${p.poi ? ` <span class="muted">${esc(p.poi)}</span>` : ""}${p.flyMap !== "" && p.flyMap !== undefined ? ` <span class="muted">vuelo→${p.flyMap},${p.flyX},${p.flyY}</span>` : ""}</span>
        <button class="btn small" data-d="${p.x},${p.y}">X</button></div>`).join("");
    box.querySelectorAll("[data-j]").forEach((b) => {
      b.onclick = () => {
        const [x, y] = b.dataset.j.split(",").map(Number);
        st.sel = { x, y }; draw(); drawForm();
      };
    });
    box.querySelectorAll("[data-d]").forEach((b) => {
      b.onclick = () => {
        const [x, y] = b.dataset.d.split(",").map(Number);
        st.points = st.points.filter((q) => !(q.x === x && q.y === y));
        if (st.sel && st.sel.x === x && st.sel.y === y) st.sel = null;
        draw(); drawForm(); drawList();
      };
    });
  }

  el.querySelector("#rg-cv").onclick = (e) => {
    const r = e.target.getBoundingClientRect();
    const x = Math.min(29, Math.max(0, Math.floor((e.clientX - r.left) / r.width * 30)));
    const y = Math.min(19, Math.max(0, Math.floor((e.clientY - r.top) / r.height * 20)));
    st.sel = { x, y };
    draw(); drawForm();
  };
  el.querySelector("#rg-savept").onclick = () => {
    const out = el.querySelector("#rg-out");
    if (!st.sel) { out.innerHTML = `<div class="logrow warn">Elige una casilla primero.</div>`; return; }
    const name = el.querySelector("#rg-name").value.trim();
    if (!name) { out.innerHTML = `<div class="logrow warn">El punto necesita un nombre.</div>`; return; }
    const fly = el.querySelector("#rg-fly").checked;
    st.points = st.points.filter((q) => !(q.x === st.sel.x && q.y === st.sel.y));
    st.points.push({
      x: st.sel.x, y: st.sel.y, name, poi: el.querySelector("#rg-poi").value.trim(),
      flyMap: fly ? st.fmap : "", flyX: fly ? el.querySelector("#rg-fx").value : "",
      flyY: fly ? el.querySelector("#rg-fy").value : "", sw: el.querySelector("#rg-sw").value.trim(),
    });
    out.innerHTML = `<div class="logrow ok">Punto (${st.sel.x},${st.sel.y}) listo. Pulsa "Guardar en PBS".</div>`;
    draw(); drawList();
  };
  el.querySelector("#rg-delpt").onclick = () => {
    if (!st.sel) return;
    st.points = st.points.filter((q) => !(q.x === st.sel.x && q.y === st.sel.y));
    st.sel = null;
    draw(); drawForm(); drawList();
  };
  el.querySelector("#rg-save").onclick = async () => {
    const out = el.querySelector("#rg-out");
    try {
      const region = st.regions[st.ri].region;
      const fresh = await pbsTextOr(st.file);
      await savePBSText(st.file, setTownPoints(fresh, region, st.points));
      st.text = await pbsTextOr(st.file);
      st.regions = getTownRegions(st.text);
      out.innerHTML = `<div class="logrow ok">Región ${esc(region)} guardada (${st.points.length} puntos).</div>`;
      log(`Crear: mapamundi región ${region} guardado.`);
    } catch (e) { out.innerHTML = `<div class="logrow error">${esc(e.message)}</div>`; }
  };
  el.querySelector("#rg-new").onclick = async () => {
    const out = el.querySelector("#rg-out");
    try {
      const ids = st.regions.map((r) => Number(r.region)).filter((n) => !Number.isNaN(n));
      const nid = String(ids.length ? Math.max(...ids) + 1 : 0);
      const fresh = await pbsTextOr(st.file);
      await savePBSText(st.file, setSectionBody(fresh, nid, `Name = Región ${nid}\nFilename = MapRegion${nid}.png`));
      out.innerHTML = `<div class="logrow ok">Región ${nid} creada. Edita su Nombre/Filename en la pestaña Pokémon y dibuja su imagen en Graphics/Pictures.</div>`;
      load();
    } catch (e) { out.innerHTML = `<div class="logrow error">${esc(e.message)}</div>`; }
  };
  load();
}

// ============================================================================
// 5. Auditoría
// ============================================================================
function renderAudit(el, { goTab }) {
  el.innerHTML = `
    <p class="muted small">Comprueba referencias cruzadas como las espera el juego base: entrenadores, especies, objetos, sprites, vuelos, salidas…</p>
    <div class="row"><button class="btn primary" id="au-pbs">Auditar PBS</button>
    <button class="btn" id="au-full">Auditoría completa (todos los mapas)</button></div>
    <div id="au-out" style="margin-top:8px"></div>`;
  const out = el.querySelector("#au-out");

  const collectTexts = async () => ({
    metadata: await pbsTextOr(findPBS(["PBS/metadata.txt", "metadata.txt"])),
    townmap: await pbsTextOr(findPBS(["PBS/townmap.txt", "PBS/town_map.txt", "townmap.txt", "town_map.txt"])),
    connections: await pbsTextOr(findPBS(["PBS/connections.txt", "connections.txt"])),
    encounters: await pbsTextOr(findPBS(["PBS/encounters.txt", "encounters.txt"])),
    trainers: await pbsTextOr(findPBS(["PBS/trainers.txt", "trainers.txt"])),
    pokemon: await pbsTextOr(findPBS(["PBS/pokemon.txt", "pokemon.txt"])),
    items: await pbsTextOr(findPBS(["PBS/items.txt", "items.txt"])),
    trainertypes: await pbsTextOr(findPBS(["PBS/trainertypes.txt", "trainertypes.txt"])),
  });

  const show = (issues) => {
    const n = (l) => issues.filter((i) => i.level === l).length;
    let html = `<p class="muted">Resultado: <b>${issues.length}</b> avisos — ${n("error")} errores, ${n("warn")} advertencias, ${n("info")} notas.</p>`;
    html += issues.slice(0, 400).map((it, k) => `<div class="flagrow"><span class="mono ${it.level}">[${it.level}]</span>
      <span style="flex:1"><b>${esc(it.where)}</b><br/><span class="muted">${esc(it.msg)}</span></span>
      ${it.mapId ? `<button class="btn small" data-j="${k}">Ir</button>` : ""}</div>`).join("")
      || `<div class="logrow ok">Sin problemas. Todo encaja.</div>`;
    if (issues.length > 400) html += `<p class="muted">…${issues.length - 400} más</p>`;
    out.innerHTML = html;
    out.querySelectorAll("[data-j]").forEach((b) => {
      b.onclick = () => {
        const it = issues[Number(b.dataset.j)];
        S.currentMap = it.mapId;
        if (it.evId) { S.currentEvent = it.evId; S.currentPage = it.page || 0; goTab("events"); }
        else goTab("maps");
      };
    });
  };

  el.querySelector("#au-pbs").onclick = async () => {
    out.innerHTML = `<p class="muted">Auditando PBS…</p>`;
    try {
      const texts = await collectTexts();
      const issues = auditPBS(texts, S.mapList.map((m) => m.id));
      for (const r of getTownRegions(texts.townmap)) {
        if (r.filename && !(await FS.exists(`Graphics/Pictures/${r.filename}`).catch(() => false))) {
          issues.push({ level: "warn", where: `townmap.txt [${r.region}]`, msg: `falta la imagen Graphics/Pictures/${r.filename}` });
        }
      }
      log(`Auditoría PBS: ${issues.length} avisos.`);
      show(issues);
    } catch (e) { out.innerHTML = `<div class="logrow error">${esc(e.message)}</div>`; }
  };

  el.querySelector("#au-full").onclick = async () => {
    out.innerHTML = `<p class="muted">Auditando…</p>`;
    const prog = showProgress("Auditoría completa…");
    try {
      const texts = await collectTexts();
      const issues = auditPBS(texts, S.mapList.map((m) => m.id));
      for (const r of getTownRegions(texts.townmap)) {
        if (r.filename && !(await FS.exists(`Graphics/Pictures/${r.filename}`).catch(() => false))) {
          issues.push({ level: "warn", where: `townmap.txt [${r.region}]`, msg: `falta la imagen Graphics/Pictures/${r.filename}` });
        }
      }
      const up = (t) => (t ? new Set(pbsSections(parsePBS(t)).map((s) => s.toUpperCase())) : null);
      const tkeys = texts.trainers
        ? new Set(pbsSections(parsePBS(texts.trainers)).map((s) => {
          const h = parseTrainerHeader(s);
          return h ? trainerKey(h.type.toUpperCase(), h.name, h.version) : null;
        }).filter(Boolean))
        : null;
      const ctx = {
        species: up(texts.pokemon), items: up(texts.items), trainerKeys: tkeys,
        mapSet: new Set(S.mapList.map((m) => m.id)), mapSizes: new Map(),
        charSet: new Set(S.characters.map((n) => n.replace(/\.[^.]+$/, "").toLowerCase())),
      };
      await scanAllMaps((id, parsed) => { ctx.mapSizes.set(id, { w: parsed.width, h: parsed.height }); return []; });
      const found = await scanAllMaps(
        (id, parsed) => auditMapEvents(parsed, id, ctx),
        (i, total) => prog.update(i, total, `Mapa ${i}/${total}`),
      );
      prog.close();
      log(`Auditoría completa: ${issues.length + found.length} avisos.`);
      show([...issues, ...found]);
    } catch (e) { prog.close(); out.innerHTML = `<div class="logrow error">${esc(e.message)}</div>`; }
  };
}
