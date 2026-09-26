// ============================================================================
// editors.js — Pestañas Eventos, Flags, NPCs, Pokémon (PBS) y Mods
// ============================================================================
import {
  S, loadMap, loadPBS, getTileset, saveMap, saveSystem, savePBS,
  markMapDirty, scanAllMaps, kirinCheck, backupNow, listBackups, restoreBackup,
  buildSalaMod, uninstallSalaMod, exportChangesZip, findSaves,
} from "./app.js";
import { FS } from "./fs.js";
import { RString, RObject, RHash, RSymbol, RFloat, marshalLoad, marshalDump } from "./marshal.js";
import {
  parseEvent, cmdOf, humanizeCommand, getCommandStrings, setRstr, rstr,
  findFlagUsesInMap, TRIGGERS, MOVE_TYPES, setSystemName, tableGet,
} from "./rmxp.js";
import { drawCharacterPreview } from "./render.js";
import { pbsSections, pbsGet, pbsSet, schemaFor, lintPBS, parsePBS, pbsToText } from "./pbs.js";
import { esc, fmtBytes, pad3 } from "./util.js";
import { zlibInflate, zlibDeflate } from "./util.js";
import {
  toast, openModal, closeModal, confirmDialog, showProgress,
  mapPickerModal, spritePickerModal, eventPickerModal, debounce,
} from "./helpers.js";

const dirty = () => document.dispatchEvent(new CustomEvent("pokemod-dirty"));

// ============================================================================
// EVENTOS
// ============================================================================
export async function renderEventsTab(view) {
  if (!S.currentMap) S.currentMap = S.tree[0]?.id;
  view.innerHTML = `<div class="wrap"><p class="muted">Cargando…</p></div>`;
  const rec = await loadMap(S.currentMap);
  if (!rec.parsed.events.length) {
    view.innerHTML = `<div class="wrap"><div class="card">
      <h3>Mapa ${S.currentMap} sin eventos</h3>
      <button class="btn" id="ev-pickmap">Cambiar de mapa</button></div></div>`;
    view.querySelector("#ev-pickmap").onclick = () => mapPickerModal("Mapa", (id) => { S.currentMap = id; S.currentEvent = null; renderEventsTab(view); });
    return;
  }
  if (!S.currentEvent || !rec.parsed.events.some((e) => e.id === S.currentEvent)) {
    S.currentEvent = rec.parsed.events[0].id;
    S.currentPage = 0;
  }
  const evObj = rec.parsed.events.find((e) => e.id === S.currentEvent).obj;
  const ev = parseEvent(evObj);
  if (S.currentPage >= ev.pages.length) S.currentPage = 0;
  const pg = ev.pages[S.currentPage];

  view.innerHTML = `
  <div class="wrap">
    <div class="card">
      <div class="row wrap">
        <button class="btn small" id="ev-map">Mapa ${S.currentMap}</button>
        <button class="btn small" id="ev-ev">Ev.${ev.id}: ${esc(ev.name)} @(${ev.x},${ev.y})</button>
        <button class="btn small primary" id="ev-save">Guardar mapa</button>
      </div>
      <div class="row wrap" style="margin-top:8px">
        <label>Nombre <input id="f-name" class="inp" value="${esc(ev.name)}" /></label>
        <label>X <input id="f-x" class="inp num" type="number" value="${ev.x}" /></label>
        <label>Y <input id="f-y" class="inp num" type="number" value="${ev.y}" /></label>
      </div>
      <div class="pagetabs">${ev.pages.map((p, i) => `<button class="chip${i === S.currentPage ? " sel" : ""}" data-pg="${i}">Pág ${i + 1}</button>`).join("")}</div>
    </div>
    <div class="card">
      <h3>Página ${S.currentPage + 1} — condiciones y aspecto</h3>
      <div class="formgrid">
        <label class="check"><input type="checkbox" id="c-sw1v" ${pg.condition?.switch1 ? "checked" : ""} /> Switch 1</label>
        <input id="c-sw1" class="inp num" type="number" min="1" value="${pg.condition?.switch1 || 1}" />
        <span class="muted small" id="c-sw1n"></span>
        <label class="check"><input type="checkbox" id="c-sw2v" ${pg.condition?.switch2 ? "checked" : ""} /> Switch 2</label>
        <input id="c-sw2" class="inp num" type="number" min="1" value="${pg.condition?.switch2 || 1}" />
        <span class="muted small" id="c-sw2n"></span>
        <label class="check"><input type="checkbox" id="c-varv" ${pg.condition?.variable ? "checked" : ""} /> Variable ≥</label>
        <span><input id="c-var" class="inp num" type="number" min="1" value="${pg.condition?.variable?.id || 1}" />
        <input id="c-varval" class="inp num" type="number" value="${pg.condition?.variable?.value || 0}" /></span>
        <span class="muted small" id="c-varn"></span>
        <label class="check"><input type="checkbox" id="c-selfv" ${pg.condition?.selfSwitch ? "checked" : ""} /> Self-switch</label>
        <select id="c-self" class="inp">${["A", "B", "C", "D"].map((l) => `<option${pg.condition?.selfSwitch === l ? " selected" : ""}>${l}</option>`).join("")}</select>
        <span></span>
      </div>
      <div class="row wrap" style="margin-top:8px">
        <label>Disparador <select id="f-trig" class="inp">${TRIGGERS.map((t, i) => `<option value="${i}"${pg.trigger === i ? " selected" : ""}>${t}</option>`).join("")}</select></label>
        <label>Movimiento <select id="f-mv" class="inp">${MOVE_TYPES.map((t, i) => `<option value="${i}"${pg.moveType === i ? " selected" : ""}>${t}</option>`).join("")}</select></label>
      </div>
      <div class="row wrap">
        ${[["walkAnime", "Anim.caminar", pg.walkAnime], ["stepAnime", "Anim.quieto", pg.stepAnime], ["dirFix", "Fijar dir.", pg.dirFix], ["through", "Atravesar", pg.through], ["alwaysTop", "Siempre arriba", pg.alwaysTop]].map(([k, l, v]) =>
          `<label class="check"><input type="checkbox" data-opt="${k}" ${v ? "checked" : ""} /> ${l}</label>`).join("")}
      </div>
      <div class="row wrap" style="margin-top:8px;align-items:flex-end">
        <canvas id="spr-prev" width="64" height="64" class="sprprev"></canvas>
        <div>
          <div class="muted small">Gráfico: <b id="spr-name">${esc(pg.graphic?.charName || "(ninguno)")}</b></div>
          <button class="btn small" id="f-spr">Cambiar sprite</button>
        </div>
        <label>Dir. <select id="f-dir" class="inp">${[[2, "↓"], [4, "←"], [6, "→"], [8, "↑"]].map(([v, l]) => `<option value="${v}"${pg.graphic?.direction === v ? " selected" : ""}>${l}</option>`).join("")}</select></label>
        <label>Paso <select id="f-pat" class="inp">${[0, 1, 2, 3].map((v) => `<option${pg.graphic?.pattern === v ? " selected" : ""}>${v}</option>`).join("")}</select></label>
      </div>
    </div>
    <div class="card">
      <div class="row" style="justify-content:space-between"><h3>Comandos</h3>
        <span><button class="btn small" id="cmd-add">+ Añadir</button></span></div>
      <div id="cmdlist"></div>
    </div>
  </div>`;

  const updSwNames = () => {
    view.querySelector("#c-sw1n").textContent = S.names.switches[Number(view.querySelector("#c-sw1").value)] || "";
    view.querySelector("#c-sw2n").textContent = S.names.switches[Number(view.querySelector("#c-sw2").value)] || "";
    view.querySelector("#c-varn").textContent = S.names.variables[Number(view.querySelector("#c-var").value)] || "";
  };
  updSwNames();
  ["#c-sw1", "#c-sw2", "#c-var"].forEach((s) => (view.querySelector(s).oninput = updSwNames));

  // preview sprite
  const paintSpr = async () => {
    try {
      const img = await FS.readImage(`Graphics/Characters/${pg.graphic.charName}.png`);
      drawCharacterPreview(view.querySelector("#spr-prev"), img, Number(view.querySelector("#f-dir").value), Number(view.querySelector("#f-pat").value));
    } catch { /* sin preview */ }
  };
  paintSpr();
  view.querySelector("#f-dir").onchange = paintSpr;
  view.querySelector("#f-pat").onchange = paintSpr;

  view.querySelector("#ev-map").onclick = () => mapPickerModal("Mapa", (id) => { S.currentMap = id; S.currentEvent = null; renderEventsTab(view); });
  view.querySelector("#ev-ev").onclick = () => eventPickerModal(S.currentMap, (id) => { S.currentEvent = id; S.currentPage = 0; renderEventsTab(view); });
  view.querySelectorAll("[data-pg]").forEach((b) => (b.onclick = () => { S.currentPage = Number(b.dataset.pg); renderEventsTab(view); }));
  view.querySelector("#f-spr").onclick = () => spritePickerModal("Sprite del NPC", pg.graphic?.charName || "", (n) => {
    pg.graphic.obj.setIvar("character_name", RString.fromText(n));
    pg.graphic.obj.setIvar("tile_id", 0);
    markMapDirty(S.currentMap); dirty(); renderEventsTab(view);
  });

  const applyAndSave = async () => {
    evObj.setIvar("name", RString.fromText(view.querySelector("#f-name").value));
    evObj.setIvar("x", Number(view.querySelector("#f-x").value));
    evObj.setIvar("y", Number(view.querySelector("#f-y").value));
    const c = pg.condition?.obj;
    if (c) {
      c.setIvar("switch1_valid", view.querySelector("#c-sw1v").checked);
      c.setIvar("switch1_id", Number(view.querySelector("#c-sw1").value));
      c.setIvar("switch2_valid", view.querySelector("#c-sw2v").checked);
      c.setIvar("switch2_id", Number(view.querySelector("#c-sw2").value));
      c.setIvar("variable_valid", view.querySelector("#c-varv").checked);
      c.setIvar("variable_id", Number(view.querySelector("#c-var").value));
      c.setIvar("variable_value", Number(view.querySelector("#c-varval").value));
      c.setIvar("self_switch_valid", view.querySelector("#c-selfv").checked);
      c.setIvar("self_switch_ch", RString.fromText(view.querySelector("#c-self").value));
    }
    pg.obj.setIvar("trigger", Number(view.querySelector("#f-trig").value));
    pg.obj.setIvar("move_type", Number(view.querySelector("#f-mv").value));
    view.querySelectorAll("[data-opt]").forEach((chk) => {
      pg.obj.setIvar(chk.dataset.opt === "walkAnime" ? "walk_anime" : chk.dataset.opt === "stepAnime" ? "step_anime" : chk.dataset.opt === "dirFix" ? "direction_fix" : chk.dataset.opt === "alwaysTop" ? "always_on_top" : "through", chk.checked);
    });
    if (pg.graphic) {
      pg.graphic.obj.setIvar("direction", Number(view.querySelector("#f-dir").value));
      pg.graphic.obj.setIvar("pattern", Number(view.querySelector("#f-pat").value));
    }
    markMapDirty(S.currentMap); dirty();
    try { await saveMap(S.currentMap); toast("Evento guardado [OK]"); }
    catch (e) { toast(e.message, "error"); }
  };
  view.querySelector("#ev-save").onclick = applyAndSave;

  // --- lista de comandos
  const listEl = view.querySelector("#cmdlist");
  const drawCmds = () => {
    listEl.innerHTML = pg.list.map((o, i) => {
      const { code, indent, params } = cmdOf(o);
      const h = humanizeCommand(code, params);
      return `<div class="cmdrow${h.known ? "" : " unknown"}" data-i="${i}" style="margin-left:${indent * 16}px">
        <span class="mono muted">#${code}</span>
        <span class="cmd-t"><b>${esc(h.title)}</b> <span class="muted">${esc(h.detail)}</span></span>
        <button class="iconbtn mini" data-mv="-1" title="Subir">▲</button>
        <button class="iconbtn mini" data-mv="1" title="Bajar">▼</button>
      </div>`;
    }).join("");
    listEl.querySelectorAll(".cmdrow").forEach((row) => {
      row.onclick = (e) => {
        if (e.target.dataset.mv) {
          e.stopPropagation();
          const i = Number(row.dataset.i), j = i + Number(e.target.dataset.mv);
          if (j < 0 || j >= pg.list.length) return;
          const [it] = pg.list.splice(i, 1);
          pg.list.splice(j, 0, it);
          markMapDirty(S.currentMap); dirty(); drawCmds();
          return;
        }
        openCommandEditor(view, rec, pg, Number(row.dataset.i), drawCmds);
      };
    });
  };
  drawCmds();
  view.querySelector("#cmd-add").onclick = () => openInsertMenu(view, rec, pg, drawCmds);
}

function newCmd(code, params, indent = 0) {
  return new RObject("RPG::EventCommand", [["@code", code], ["@indent", indent], ["@parameters", params]]);
}

function openInsertMenu(view, rec, pg, redraw) {
  const T = (label, make) => `<button class="pickrow" data-t="${label}">${label}</button>`;
  const wrap = document.createElement("div");
  wrap.innerHTML = `<div class="picklist">
    ${T("Texto", 0)}${T("Opciones (Sí/No)", 0)}${T("Script", 0)}${T("Comentario", 0)}
    ${T("Control switch", 0)}${T("Control variable", 0)}${T("Teletransportar", 0)}
    ${T("Condición (switch)", 0)}${T("Sonido SE", 0)}${T("Tienda", 0)}
  </div><p class="muted small">Se inserta al final (antes del Fin).</p>`;
  wrap.querySelectorAll("[data-t]").forEach((b) => {
    b.onclick = () => {
      const cmds = [];
      const t = b.dataset.t;
      if (t.startsWith("Texto")) cmds.push(newCmd(101, [RString.fromText(""), 0, 0, 2]), newCmd(401, [RString.fromText("Nuevo diálogo…")]));
      else if (t.startsWith("Opciones")) {
        cmds.push(newCmd(102, [[RString.fromText("Sí"), RString.fromText("No")], 4]));
        cmds.push(newCmd(402, [0, RString.fromText("Sí")], 1), newCmd(401, [RString.fromText("Elegiste SÍ")], 2), newCmd(404, [], 1));
        cmds.push(newCmd(402, [1, RString.fromText("No")], 1), newCmd(401, [RString.fromText("Elegiste NO")], 2), newCmd(404, [], 1));
        cmds.push(newCmd(404, []));
      }
      else if (t.startsWith("Script")) cmds.push(newCmd(355, [RString.fromText("pbMessage(\"Hola\")")]));
      else if (t.startsWith("Comentario")) cmds.push(newCmd(108, [RString.fromText("Nota…")]));
      else if (t.startsWith("Control switch")) cmds.push(newCmd(121, [1, 1, 1]));
      else if (t.startsWith("Control variable")) cmds.push(newCmd(122, [1, 1, 0, 0, 0]));
      else if (t.startsWith("Teletransportar")) cmds.push(newCmd(201, [0, S.currentMap, 0, 0, 2, 0]));
      else if (t.startsWith("Condición")) cmds.push(newCmd(111, [0, 1, 1]), newCmd(412, []));
      else if (t.startsWith("Sonido")) cmds.push(newCmd(247, [new RObject("RPG::AudioFile", [["@name", RString.fromText("")], ["@volume", 80], ["@pitch", 100]])]));
      else if (t.startsWith("Tienda")) cmds.push(newCmd(302, [[]]));
      let at = pg.list.length;
      if (at > 0 && Number(pg.list[at - 1].getIvar("code")) === 0) at--;
      pg.list.splice(at, 0, ...cmds);
      markMapDirty(S.currentMap); dirty(); closeModal(); redraw();
      toast("Comando añadido (guarda el mapa).");
    };
  });
  openModal({ title: "Añadir comando", body: wrap });
}

function openCommandEditor(view, rec, pg, index, redraw) {
  const o = pg.list[index];
  const { code, params } = cmdOf(o);
  const h = humanizeCommand(code, params);
  const strings = getCommandStrings(code, params);
  let body;
  if (strings.length) {
    body = document.createElement("div");
    body.innerHTML = `<p class="muted">#${code} · ${esc(h.title)} — edita el texto (soporta saltos con <span class="mono">\\n</span> en diálogos):</p>` +
      strings.map((s, k) => `<textarea class="inp mono" rows="${code === 355 || code === 655 ? 4 : 2}" data-k="${k}">${esc(s.rs.text)}</textarea>`).join("");
  } else {
    body = document.createElement("div");
    body.innerHTML = `<p class="muted">#${code} · <b>${esc(h.title)}</b> ${esc(h.detail)}<br/>Edición avanzada (JSON). Los textos van como <span class="mono">{"$str":"…"}</span>. Si lo rompes, restaura desde Mods → Backups.</p>
      <textarea class="inp mono" rows="8" id="cmd-json">${esc(JSON.stringify(paramsToJson(params), null, 1))}</textarea>`;
  }
  openModal({
    title: `Comando #${code}: ${h.title}`,
    body, wide: true,
    actions: [
      { label: "Eliminar", cls: "danger", onClick: async (close) => {
        if (pg.list.length <= 1) { toast("No puedes borrar el único comando.", "error"); return; }
        if (await confirmDialog("Eliminar comando", "¿Borrar este comando? (se guarda con el mapa)")) {
          pg.list.splice(index, 1);
          markMapDirty(S.currentMap); dirty(); close(); redraw();
        }
      } },
      { label: "Guardar", cls: "primary", onClick: (close) => {
        try {
          if (strings.length) {
            body.querySelectorAll("textarea").forEach((ta) => {
              strings[Number(ta.dataset.k)].rs.text = ta.value;
            });
          } else {
            const j = JSON.parse(body.querySelector("#cmd-json").value);
            o.setIvar("parameters", jsonToParams(j));
          }
          markMapDirty(S.currentMap); dirty(); close(); redraw();
          toast("Comando actualizado (guarda el mapa).");
        } catch (e) { toast("JSON inválido: " + e.message, "error"); }
      } },
    ],
  });
}

function paramsToJson(params) {
  const toJ = (v) => {
    if (v instanceof RString) return { $str: v.text };
    if (v instanceof RSymbol) return { $sym: v.name };
    if (v instanceof RFloat) return { $float: v.raw };
    if (Array.isArray(v)) return v.map(toJ);
    if (v instanceof RObject) { const o = { $obj: v.className }; for (const [k, val] of v.ivars) o[k] = toJ(val); return o; }
    if (v instanceof RHash) return { $hash: v.pairs.map(([k, val]) => [toJ(k), toJ(val)]) };
    return v;
  };
  return params.map(toJ);
}
function jsonToParams(j) {
  const fromJ = (x) => {
    if (x && typeof x === "object") {
      if (Array.isArray(x)) return x.map(fromJ);
      if ("$str" in x) return RString.fromText(String(x.$str));
      if ("$sym" in x) return new RSymbol(String(x.$sym));
      if ("$float" in x) return new RFloat(parseFloat(x.$float), String(x.$float));
      if ("$hash" in x) return new RHash(x.$hash.map(([k, v]) => [fromJ(k), fromJ(v)]));
      if ("$obj" in x) { const o = new RObject(x.$obj); for (const k of Object.keys(x)) if (k !== "$obj") o.ivars.push([k, fromJ(x[k])]); return o; }
    }
    return x;
  };
  return j.map(fromJ);
}

// ============================================================================
// FLAGS (interruptores y variables)
// ============================================================================
let flagKind = "sw";
export function renderFlagsTab(view, { goTab }) {
  const names = flagKind === "sw" ? S.names.switches : S.names.variables;
  view.innerHTML = `
  <div class="wrap">
    <div class="card">
      <div class="row">
        <button class="chip${flagKind === "sw" ? " sel" : ""}" id="fk-sw">Interruptores</button>
        <button class="chip${flagKind === "var" ? " sel" : ""}" id="fk-var">Variables</button>
      </div>
      <p class="muted small">Los <b>nombres</b> viven en el juego (editables). Los <b>valores ON/OFF</b> viven en tu partida (PokeMod no toca partidas).</p>
      <input id="flag-search" class="inp" placeholder="Buscar por nombre o número…" />
      <div id="flag-list"></div>
    </div>
  </div>`;
  view.querySelector("#fk-sw").onclick = () => { flagKind = "sw"; renderFlagsTab(view, { goTab }); };
  view.querySelector("#fk-var").onclick = () => { flagKind = "var"; renderFlagsTab(view, { goTab }); };
  const listEl = view.querySelector("#flag-list");
  const draw = (filter = "") => {
    const f = filter.trim().toLowerCase();
    const rows = [];
    const max = Math.min(names.length - 1, 5000);
    for (let i = 1; i <= max && rows.length < 400; i++) {
      const n = names[i] || "";
      if (f && !n.toLowerCase().includes(f) && String(i) !== f && !String(i).includes(f)) continue;
      rows.push(`<div class="flagrow">
        <span class="mono muted">${i}</span>
        <input class="inp" data-id="${i}" value="${esc(n)}" placeholder="(sin nombre)" />
        <button class="btn small" data-uses="${i}">Usos</button>
      </div>`);
    }
    listEl.innerHTML = rows.join("") || `<p class="muted">Sin resultados.</p>`;
    listEl.querySelectorAll("input[data-id]").forEach((inp) => {
      inp.onchange = async () => {
        setSystemName(S.systemObj, flagKind, Number(inp.dataset.id), inp.value);
        try { await saveSystem(); S.names = flagKind === "sw" || true ? S.names : S.names; toast("Nombre guardado [OK]"); }
        catch (e) { toast(e.message, "error"); }
      };
    });
    listEl.querySelectorAll("[data-uses]").forEach((b) => {
      b.onclick = () => showFlagUses(Number(b.dataset.uses), goTab);
    });
  };
  view.querySelector("#flag-search").oninput = debounce((e) => draw(e.target.value), 200);
  draw();
}

async function showFlagUses(id, goTab) {
  const prog = showProgress(`Buscando usos de ${flagKind === "sw" ? "Switch" : "Variable"}[${id}]…`);
  const results = await scanAllMaps((mapId, parsed, info) => {
    const uses = findFlagUsesInMap(parsed, flagKind, id);
    return uses.map((u) => ({ mapId, mapName: info?.name || "", ...u }));
  }, (i, total, m) => prog.update(i, total, `Mapa ${i}/${total}: ${m.name}`));
  prog.close();
  if (!results.length) { toast("Sin usos en eventos (puede usarse en scripts)."); return; }
  const wrap = document.createElement("div");
  wrap.innerHTML = `<div class="picklist">${results.slice(0, 500).map((r, k) =>
    `<button class="pickrow" data-k="${k}"><span class="mono muted">${r.mapId}</span><span>${esc(r.mapName)} · Ev.${r.evId} ${esc(r.evName)} · Pág ${r.page + 1}</span><span class="muted">${esc(r.where)}</span></button>`).join("")}</div>
    ${results.length > 500 ? `<p class="muted">…${results.length - 500} más</p>` : ""}`;
  wrap.querySelectorAll(".pickrow").forEach((b) => {
    b.onclick = () => {
      const r = results[Number(b.dataset.k)];
      S.currentMap = r.mapId;
      // buscar id de evento por nombre+id
      S.currentEvent = r.evId; S.currentPage = r.page;
      closeModal(); goTab("events");
    };
  });
  openModal({ title: `${results.length} usos`, body: wrap, wide: true });
}

// ============================================================================
// NPCS
// ============================================================================
let npcCache = [];
export function renderNpcsTab(view, { goTab }) {
  view.innerHTML = `
  <div class="wrap"><div class="card">
    <h3>Todos los NPCs del juego</h3>
    <p class="muted small">Escanea todos los mapas y lista cada evento con gráfico. Toca uno para moverlo o cambiar su sprite.</p>
    <div class="row"><button class="btn primary" id="npc-scan">Escanear mapas</button>
    <input id="npc-search" class="inp" placeholder="Filtrar…" style="flex:1" /></div>
    <div id="npc-list"></div>
  </div></div>`;
  const listEl = view.querySelector("#npc-list");
  const draw = (filter = "") => {
    const f = filter.trim().toLowerCase();
    const rows = npcCache.filter((n) => !f || n.name.toLowerCase().includes(f) || n.charName.toLowerCase().includes(f) || n.mapName.toLowerCase().includes(f) || String(n.mapId) === f);
    listEl.innerHTML = rows.slice(0, 250).map((n, k) =>
      `<button class="npcrow" data-k="${npcCache.indexOf(n)}">
        <canvas width="40" height="40" data-spr="${esc(n.charName)}"></canvas>
        <span><b>${esc(n.name)}</b> <span class="muted">Ev.${n.evId} · Mapa ${n.mapId} ${esc(n.mapName)} · (${n.x},${n.y})</span></span>
      </button>`).join("") || `<p class="muted">${npcCache.length ? "Sin coincidencias." : "Pulsa «Escanear mapas»."}</p>`;
    if (rows.length > 250) listEl.innerHTML += `<p class="muted">…${rows.length - 250} más (filtra)</p>`;
    listEl.querySelectorAll(".npcrow").forEach((b) => {
      b.onclick = () => openNpcEditor(npcCache[Number(b.dataset.k)], goTab);
    });
    // previews
    listEl.querySelectorAll("canvas[data-spr]").forEach(async (cv) => {
      const n = cv.dataset.spr;
      if (!n) return;
      try {
        const img = await FS.readImage(`Graphics/Characters/${n}.png`);
        drawCharacterPreview(cv, img, 2, 1);
      } catch { /* noop */ }
    });
  };
  view.querySelector("#npc-search").oninput = debounce((e) => draw(e.target.value), 200);
  view.querySelector("#npc-scan").onclick = async () => {
    const prog = showProgress("Escaneando NPCs…");
    npcCache = await scanAllMaps((mapId, parsed, info) => {
      const out = [];
      for (const { id, obj } of parsed.events) {
        try {
          const ev = parseEvent(obj);
          const g = ev.pages[0]?.graphic;
          if (g && (g.charName || g.tileId)) {
            out.push({ mapId, mapName: info?.name || "", evId: id, name: ev.name, x: ev.x, y: ev.y, charName: g.charName || "", tileId: g.tileId, dir: g.direction, pat: g.pattern });
          }
        } catch { /* noop */ }
      }
      return out;
    }, (i, total, m) => prog.update(i, total, `Mapa ${i}/${total}`));
    prog.close();
    toast(`${npcCache.length} NPCs encontrados [OK]`);
    draw(view.querySelector("#npc-search").value);
  };
  draw();
}

async function openNpcEditor(n, goTab) {
  const rec = await loadMap(n.mapId);
  const evObj = rec.parsed.events.find((e) => e.id === n.evId)?.obj;
  if (!evObj) { toast("Evento no encontrado (¿mapa cambiado?)", "error"); return; }
  const ev = parseEvent(evObj);
  const pg = ev.pages[0];
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="row"><canvas id="npc-prev" width="72" height="72" class="sprprev"></canvas>
    <div><b>${esc(n.name)}</b><div class="muted small">Mapa ${n.mapId} · Ev.${n.evId}</div>
    <button class="btn small" id="npc-spr">Cambiar sprite</button></div></div>
    <div class="row wrap" style="margin-top:8px">
      <label>Nombre <input id="npc-name" class="inp" value="${esc(ev.name)}" /></label>
      <label>X <input id="npc-x" class="inp num" type="number" value="${ev.x}" /></label>
      <label>Y <input id="npc-y" class="inp num" type="number" value="${ev.y}" /></label>
      <label>Dir. <select id="npc-dir" class="inp">${[[2, "↓"], [4, "←"], [6, "→"], [8, "↑"]].map(([v, l]) => `<option value="${v}"${pg.graphic?.direction === v ? " selected" : ""}>${l}</option>`).join("")}</select></label>
    </div>`;
  const paint = async () => {
    try {
      const img = await FS.readImage(`Graphics/Characters/${pg.graphic.charName}.png`);
      drawCharacterPreview(wrap.querySelector("#npc-prev"), img, Number(wrap.querySelector("#npc-dir").value), 1);
    } catch { /* noop */ }
  };
  paint();
  wrap.querySelector("#npc-dir").onchange = paint;
  wrap.querySelector("#npc-spr").onclick = () => spritePickerModal("Sprite", pg.graphic?.charName || "", (s) => {
    pg.graphic.obj.setIvar("character_name", RString.fromText(s));
    pg.graphic.obj.setIvar("tile_id", 0);
    markMapDirty(n.mapId); dirty(); paint();
  });
  openModal({
    title: "Editar NPC", body: wrap,
    actions: [
      { label: "Ir al evento", onClick: (close) => { S.currentMap = n.mapId; S.currentEvent = n.evId; S.currentPage = 0; close(); goTab("events"); } },
      { label: "Guardar", cls: "primary", onClick: async (close) => {
        evObj.setIvar("name", RString.fromText(wrap.querySelector("#npc-name").value));
        evObj.setIvar("x", Number(wrap.querySelector("#npc-x").value));
        evObj.setIvar("y", Number(wrap.querySelector("#npc-y").value));
        pg.graphic.obj.setIvar("direction", Number(wrap.querySelector("#npc-dir").value));
        markMapDirty(n.mapId); dirty();
        try { await saveMap(n.mapId); toast("NPC guardado [OK]"); } catch (e) { toast(e.message, "error"); }
        close();
        n.name = ev.name; n.x = ev.x; n.y = ev.y;
      } },
    ],
  });
}

// ============================================================================
// POKEMON (PBS)
// ============================================================================
let pbsCurrent = "";
export async function renderPbsTab(view) {
  if (!S.pbsFiles.length) {
    view.innerHTML = `<div class="wrap"><div class="card"><h3>Sin PBS</h3><p class="muted">No se encontró carpeta PBS/ en este proyecto.</p></div></div>`;
    return;
  }
  if (!pbsCurrent || !S.pbsFiles.includes(pbsCurrent)) {
    pbsCurrent = S.pbsFiles.find((f) => /pokemon\.txt$/i.test(f)) || S.pbsFiles[0];
  }
  const rec = await loadPBS(pbsCurrent);
  const schema = schemaFor(pbsCurrent);
  const sections = pbsSections(rec.lines);
  view.innerHTML = `
  <div class="wrap"><div class="card">
    <h3>${esc(schema?.label || "PBS")}</h3>
    <div class="row wrap">
      <select id="pbs-file" class="inp">${S.pbsFiles.map((f) => `<option${f === pbsCurrent ? " selected" : ""}>${f}</option>`).join("")}</select>
      <button class="btn small primary" id="pbs-save">Guardar</button>
    </div>
    ${schema?.rawHint ? `<p class="muted small">${esc(schema.rawHint)}</p>` : ""}
    <input id="pbs-search" class="inp" placeholder="Buscar sección…" />
    <div id="pbs-list"></div>
  </div></div>`;
  view.querySelector("#pbs-file").onchange = (e) => { pbsCurrent = e.target.value; renderPbsTab(view); };
  view.querySelector("#pbs-save").onclick = async () => {
    collectPbsForm(view, rec);
    try { await savePBS(pbsCurrent); toast("PBS guardado [OK]"); dirty(); } catch (e) { toast(e.message, "error"); }
  };
  const listEl = view.querySelector("#pbs-list");
  const draw = (filter = "") => {
    const f = filter.trim().toLowerCase();
    const secs = sections.filter((s) => !f || s.toLowerCase().includes(f)).slice(0, 120);
    if (schema?.fields?.length) {
      listEl.innerHTML = secs.map((s) => `
        <details class="pbssec" data-sec="${esc(s)}">
          <summary><b>${esc(s)}</b> <span class="muted">${esc(pbsGet(rec.lines, s, "Name") || "")}</span></summary>
          <div class="formgrid">
            ${schema.fields.map(([k, label, type, opts]) => {
              const v = pbsGet(rec.lines, s, k) ?? "";
              if (type === "select") return `<label>${esc(label)}</label><select class="inp" data-k="${esc(k)}"><option value="">(igual)</option>${opts.map((o) => `<option${o === v ? " selected" : ""}>${o}</option>`).join("")}</select><span></span>`;
              return `<label>${esc(label)}</label><input class="inp${type === "number" ? " num" : ""}" data-k="${esc(k)}" value="${esc(v)}" /><span class="muted small mono">${esc(k)}</span>`;
            }).join("")}
          </div>
        </details>`).join("") || `<p class="muted">Sin resultados.</p>`;
    } else {
      // modo crudo por sección
      listEl.innerHTML = secs.map((s) => {
        const body = rec.lines.filter((l) => l.section === s && l.kind !== "section").map((l) => l.kind === "kv" ? `${l.key} = ${l.value}` : l.raw).join("\n");
        return `<details class="pbssec" data-sec="${esc(s)}"><summary><b>[${esc(s)}]</b></summary>
          <textarea class="inp mono" rows="10" data-raw="${esc(s)}">${esc(body)}</textarea></details>`;
      }).join("") || `<p class="muted">Sin resultados.</p>`;
    }
    if (sections.length > 120 && !f) listEl.innerHTML += `<p class="muted">Mostrando 120 de ${sections.length} (filtra para ver más).</p>`;
  };
  view.querySelector("#pbs-search").oninput = debounce((e) => { collectPbsForm(view, rec); draw(e.target.value); }, 300);
  draw();
  // avisos de validación
  const issues = lintPBS(pbsCurrent, pbsToText(rec.lines));
  if (issues.length) {
    const d = document.createElement("div");
    d.className = "card";
    d.innerHTML = `<h3>[!] Revisión</h3>${issues.slice(0, 30).map((i) => `<div class="logrow ${i.level}">${esc(i.msg)}</div>`).join("")}`;
    view.querySelector(".wrap").appendChild(d);
  }
}

function collectPbsForm(view, rec) {
  // formularios con data-k dentro de details[data-sec]
  view.querySelectorAll("details.pbssec").forEach((det) => {
    const sec = det.dataset.sec;
    det.querySelectorAll("[data-k]").forEach((inp) => {
      if (inp.value !== "") pbsSet(rec.lines, sec, inp.dataset.k, inp.value);
    });
    const raw = det.querySelector("[data-raw]");
    if (raw) {
      // reconstruir sección desde crudo
      const other = rec.lines.filter((l) => l.section !== sec);
      const secIdx = other.findIndex((l) => l.kind === "section" && l.section === sec);
      const fresh = parsePBS(`[${sec}]\n` + raw.value).filter((l) => !(l.kind === "section"));
      if (secIdx >= 0) {
        // insertar tras la cabecera existente en `other`… (other ya no tiene la sección)
        other.push({ kind: "section", section: sec, raw: `[${sec}]` }, ...fresh.map((l) => ({ ...l, section: sec })));
        rec.lines.length = 0;
        rec.lines.push(...other);
      }
    }
  });
  rec.dirty = true;
  dirty();
}

// ============================================================================
// MODS (backups, Kirin, Sala, Scripts, exportar)
// ============================================================================
export function renderModsTab(view, { goTab }) {
  view.innerHTML = `
  <div class="wrap">
    <div class="card">
      <h3>Compatibilidad Kirin / Android</h3>
      <p class="muted small">Revisa estructura, cifrado, audio, caja de archivos y partidas.</p>
      <div class="row"><button class="btn primary" id="m-kirin">Chequeo rápido</button>
      <button class="btn" id="m-kirin-deep">Análisis profundo (tarda)</button></div>
      <div id="kirin-out"></div>
    </div>
    <div class="card">
      <h3>Sala PokeMod — acceso total a mapas</h3>
      <p class="muted small">Crea un mapa extra con una casilla por cada mapa del juego + una puerta en el mapa que elijas. <b>100% datos</b> (sin scripts), funciona en Kirin y es <b>reversible</b>. No toca partidas.</p>
      <div id="sala-status" class="muted small"></div>
      <div class="row wrap">
        <button class="btn small" id="sala-map">Mapa puerta: <b id="sala-mapn">${S.currentMap || S.tree[0]?.id}</b></button>
        <label>X <input id="sala-x" class="inp num" type="number" value="5" /></label>
        <label>Y <input id="sala-y" class="inp num" type="number" value="5" /></label>
        <button class="btn small" id="sala-spr">Sprite puerta</button>
      </div>
      <div class="row" style="margin-top:8px"><button class="btn primary" id="sala-build">Crear Sala PokeMod</button>
      <button class="btn danger" id="sala-un">Desinstalar</button></div>
      <div id="sala-out"></div>
    </div>
    <div class="card">
      <h3>Copias de seguridad</h3>
      <p class="muted small">PokeMod respalda automáticamente cada archivo antes de modificarlo. Aquí puedes respaldar o restaurar.</p>
      <div class="row"><button class="btn" id="bk-now">Backup ahora</button>
      <button class="btn" id="bk-list">Ver backups</button></div>
      <div id="bk-out"></div>
    </div>
    <div class="card">
      <h3>Scripts (avanzado)</h3>
      <p class="muted small">Ver/exportar/importar secciones de <span class="mono">Scripts.rxdata</span>. Solo para usuarios avanzados (siempre con backup).</p>
      <div class="row"><button class="btn" id="sc-load">Cargar scripts</button></div>
      <div id="sc-out"></div>
    </div>
    <div class="card">
      <h3>Exportar cambios</h3>
      <p class="muted small">Descarga un ZIP con los archivos modificados (para modo lectura o compartir).</p>
      <button class="btn" id="m-exp">Exportar ZIP</button>
    </div>
  </div>`;

  // --- Kirin
  const kOut = view.querySelector("#kirin-out");
  const runKirin = async (deep) => {
    kOut.innerHTML = `<p class="muted">Analizando…</p>`;
    const prog = deep ? showProgress("Análisis profundo…") : null;
    try {
      const res = await kirinCheck(deep, prog ? (i, t, m) => prog.update(i, t, `Mapa ${i}/${t}`) : null);
      if (prog) prog.close();
      kOut.innerHTML = res.map((r) => `<div class="logrow ${r.level}">${r.level === "ok" ? "[OK]" : r.level === "error" ? "[X]" : r.level === "warn" ? "[!]" : "[i]"} ${esc(r.msg)}</div>`).join("");
    } catch (e) { if (prog) prog.close(); kOut.innerHTML = `<p class="error">${esc(e.message)}</p>`; }
  };
  view.querySelector("#m-kirin").onclick = () => runKirin(false);
  view.querySelector("#m-kirin-deep").onclick = () => runKirin(true);

  // --- Sala
  let salaEntry = S.currentMap || S.tree[0]?.id || 1;
  let salaSpr = "";
  FS.readText("PokeModBackups/sala_meta.json").then((t) => {
    const m = JSON.parse(t);
    view.querySelector("#sala-status").innerHTML = `[OK] Instalada: mapa <b>${m.newId}</b> con ${m.targets} destinos (puerta en mapa ${m.entryId}).`;
  }).catch(() => { view.querySelector("#sala-status").textContent = "No instalada."; });
  view.querySelector("#sala-map").onclick = () => mapPickerModal("Mapa de la puerta", (id) => {
    salaEntry = id; view.querySelector("#sala-mapn").textContent = id;
  });
  view.querySelector("#sala-spr").onclick = () => spritePickerModal("Sprite de la puerta", salaSpr, (n) => {
    salaSpr = n; view.querySelector("#sala-spr").innerHTML = `${esc(n || "(invisible)")}`;
  });
  view.querySelector("#sala-build").onclick = async () => {
    const out = view.querySelector("#sala-out");
    const prog = showProgress("Creando Sala PokeMod…");
    try {
      const meta = await buildSalaMod({
        entryMapId: salaEntry,
        doorX: Number(view.querySelector("#sala-x").value),
        doorY: Number(view.querySelector("#sala-y").value),
        doorGraphic: salaSpr,
        onProgress: (i, t) => prog.update(i, t, `Buscando destinos ${i}/${t}`),
      });
      prog.close();
      out.innerHTML = `<p>[OK] Sala creada: mapa <b>${meta.newId}</b> (${meta.targets} destinos, ${meta.omitted.length} omitidos).</p>`;
      toast("Sala PokeMod lista");
    } catch (e) { prog.close(); out.innerHTML = `<p class="error">${esc(e.message)}</p>`; }
  };
  view.querySelector("#sala-un").onclick = async () => {
    if (!await confirmDialog("Desinstalar Sala", "¿Quitar la puerta y borrar el mapa de la Sala PokeMod?")) return;
    try { await uninstallSalaMod(); toast("Sala desinstalada [OK]"); renderModsTab(view, { goTab }); }
    catch (e) { toast(e.message, "error"); }
  };

  // --- Backups
  view.querySelector("#bk-now").onclick = async () => {
    try { const f = await backupNow(); toast("Backup en " + f + " [OK]"); } catch (e) { toast(e.message, "error"); }
  };
  view.querySelector("#bk-list").onclick = async () => {
    const out = view.querySelector("#bk-out");
    const folders = await listBackups();
    if (!folders.length) { out.innerHTML = `<p class="muted">Aún no hay backups.</p>`; return; }
    out.innerHTML = folders.map((f) => `<div class="flagrow"><span class="mono">${esc(f)}</span>
      <button class="btn small" data-bk="${esc(f)}">Ver / restaurar</button></div>`).join("");
    out.querySelectorAll("[data-bk]").forEach((b) => (b.onclick = () => openBackupFolder(b.dataset.bk)));
  };

  // --- Scripts
  view.querySelector("#sc-load").onclick = () => openScripts(view);

  // --- Export
  view.querySelector("#m-exp").onclick = async () => {
    try { await exportChangesZip(); } catch (e) { toast(e.message, "error"); }
  };
}

async function openBackupFolder(folder) {
  const files = await FS.walk(`PokeModBackups/${folder}`, 5000).catch(() => []);
  const wrap = document.createElement("div");
  wrap.innerHTML = `<div class="picklist">${files.map((f) => {
    const rel = f.replace(`PokeModBackups/${folder}/`, "");
    return `<div class="flagrow"><span class="mono small">${esc(rel)}</span><button class="btn small" data-r="${esc(rel)}">↩ Restaurar</button></div>`;
  }).join("") || "<p class=muted>Vacío.</p>"}</div>`;
  wrap.querySelectorAll("[data-r]").forEach((b) => {
    b.onclick = async () => {
      try { await restoreBackup(folder, b.dataset.r); toast("Restaurado [OK]"); }
      catch (e) { toast(e.message, "error"); }
    };
  });
  openModal({
    title: `Backup ${folder}`, body: wrap, wide: true,
    actions: [{ label: "Restaurar TODO", cls: "danger", onClick: async (close) => {
      if (!await confirmDialog("Restaurar todo", `¿Sobrescribir ${files.length} archivos con este backup?`)) return;
      for (const f of files) {
        try { await restoreBackup(folder, f.replace(`PokeModBackups/${folder}/`, "")); } catch (e) { toast(e.message, "error"); }
      }
      close(); toast("Backup restaurado [OK]");
    } }],
  });
}

let scriptsCache = null;
async function openScripts(view) {
  const out = view.querySelector("#sc-out");
  out.innerHTML = `<p class="muted">Cargando Scripts.rxdata…</p>`;
  try {
    if (!scriptsCache) {
      const raw = marshalLoad(await FS.readBytes("Data/Scripts.rxdata"));
      scriptsCache = raw.map((s) => ({ id: s[0], name: s[1]?.text ?? "?", code: s[2], obj: s, dirty: false }));
    }
    out.innerHTML = `<input id="sc-search" class="inp" placeholder="Buscar sección…" /><div id="sc-list" class="picklist" style="max-height:300px"></div>
      <div class="row" style="margin-top:8px"><button class="btn small primary" id="sc-save">Guardar Scripts.rxdata</button></div>`;
    const list = out.querySelector("#sc-list");
    const draw = (f = "") => {
      const fl = f.trim().toLowerCase();
      const items = scriptsCache.filter((s) => !fl || s.name.toLowerCase().includes(fl) || String(s.id) === fl).slice(0, 200);
      list.innerHTML = items.map((s) => `<div class="flagrow"><span class="mono muted">${s.id}</span><span>${esc(s.name)}</span>
        <span class="muted small">${fmtBytes(s.code.bytes.length)}</span>
        <button class="btn small" data-v="${s.id}">Ver</button><button class="btn small" data-e="${s.id}">↓</button><button class="btn small" data-i="${s.id}">↑</button></div>`).join("");
      list.querySelectorAll("[data-v]").forEach((b) => (b.onclick = () => viewScript(Number(b.dataset.v))));
      list.querySelectorAll("[data-e]").forEach((b) => (b.onclick = () => exportScript(Number(b.dataset.e))));
      list.querySelectorAll("[data-i]").forEach((b) => (b.onclick = () => importScript(Number(b.dataset.i))));
    };
    out.querySelector("#sc-search").oninput = debounce((e) => draw(e.target.value), 200);
    draw();
    out.querySelector("#sc-save").onclick = async () => {
      const arr = scriptsCache.map((s) => s.obj);
      await FS.writeBytes("Data/Scripts.rxdata", marshalDump(arr));
      toast("Scripts guardados [OK] (con backup)");
    };
  } catch (e) { out.innerHTML = `<p class="error">${esc(e.message)}</p>`; }
}

async function viewScript(id) {
  const s = scriptsCache.find((x) => x.id === id);
  try {
    const code = new TextDecoder().decode(await zlibInflate(s.code.bytes));
    const wrap = document.createElement("div");
    wrap.innerHTML = `<p class="muted">${code.split("\n").length} líneas · solo lectura (usa ↓/↑ para editar fuera)</p>
      <textarea class="inp mono" rows="16" readonly>${esc(code.slice(0, 60000))}</textarea>`;
    openModal({ title: `#${s.id} ${s.name}`, body: wrap, wide: true });
  } catch (e) { toast(e.message, "error"); }
}

async function exportScript(id) {
  const s = scriptsCache.find((x) => x.id === id);
  try {
    const code = new TextDecoder().decode(await zlibInflate(s.code.bytes));
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([code], { type: "text/plain" }));
    a.download = `${String(s.id).padStart(3, "0")}_${s.name}.rb`;
    a.click();
  } catch (e) { toast(e.message, "error"); }
}

function importScript(id) {
  const s = scriptsCache.find((x) => x.id === id);
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = ".rb,.txt";
  inp.onchange = async () => {
    const f = inp.files[0];
    if (!f) return;
    if (!await confirmDialog("Importar script", `¿Reemplazar la sección #${s.id} ${s.name} con ${f.name}? (se guarda con backup)`)) return;
    try {
      const text = await f.text();
      s.code.bytes = await zlibDeflate(new TextEncoder().encode(text));
      s.dirty = true;
      toast("Sección importada (pulsa Guardar Scripts) [OK]");
    } catch (e) { toast(e.message, "error"); }
  };
  inp.click();
}
