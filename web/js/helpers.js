// ============================================================================
// helpers.js — UI compartida: toast, modales, progreso, selectores
// ============================================================================
import { S, loadMap } from "./app.js";
import { FS } from "./fs.js";
import { parseEvent } from "./rmxp.js";
import { drawCharacterPreview } from "./render.js";
import { esc } from "./util.js";

// --- Toast -------------------------------------------------------------------------
export function toast(msg, kind = "info", ms = 3500) {
  const box = document.getElementById("toast");
  const d = document.createElement("div");
  d.className = "toast " + kind;
  d.textContent = msg;
  box.appendChild(d);
  setTimeout(() => d.classList.add("show"));
  setTimeout(() => { d.classList.remove("show"); setTimeout(() => d.remove(), 400); }, ms);
}

// --- Modal ---------------------------------------------------------------------------
export function openModal({ title, body, actions = [], wide = false }) {
  closeModal();
  const ov = document.createElement("div");
  ov.id = "modal-ov";
  ov.className = "modal-ov";
  ov.innerHTML = `<div class="modal${wide ? " wide" : ""}" role="dialog">
    <div class="modal-h"><b>${esc(title)}</b><button class="iconbtn" data-x>✕</button></div>
    <div class="modal-b"></div>
    <div class="modal-f"></div>
  </div>`;
  const b = ov.querySelector(".modal-b");
  if (typeof body === "string") b.innerHTML = body;
  else b.appendChild(body);
  const f = ov.querySelector(".modal-f");
  for (const a of actions) {
    const btn = document.createElement("button");
    btn.className = "btn " + (a.cls || "");
    btn.textContent = a.label;
    btn.onclick = () => a.onClick?.(closeModal, ov);
    f.appendChild(btn);
  }
  if (!actions.length) f.remove();
  ov.querySelector("[data-x]").onclick = closeModal;
  ov.addEventListener("mousedown", (e) => { if (e.target === ov) closeModal(); });
  document.body.appendChild(ov);
  return ov;
}

export function closeModal() {
  document.getElementById("modal-ov")?.remove();
}

export function confirmDialog(title, message, okLabel = "Confirmar") {
  return new Promise((resolve) => {
    openModal({
      title,
      body: `<p>${esc(message)}</p>`,
      actions: [
        { label: "Cancelar", onClick: (close) => { close(); resolve(false); } },
        { label: okLabel, cls: "danger", onClick: (close) => { close(); resolve(true); } },
      ],
    });
  });
}

// --- Progreso con cancelación --------------------------------------------------------------
export function showProgress(title) {
  const ov = openModal({
    title,
    body: `<div class="prog"><div class="prog-bar"><div class="prog-fill"></div></div><div class="prog-label">…</div></div>`,
    actions: [{ label: "Cancelar", onClick: () => { st.cancelled = true; } }],
  });
  const fill = ov.querySelector(".prog-fill");
  const label = ov.querySelector(".prog-label");
  const st = { cancelled: false };
  return {
    update(i, total, text) {
      fill.style.width = total ? Math.round((i / total) * 100) + "%" : "0%";
      label.textContent = text || `${i}/${total}`;
      if (st.cancelled) S.scanCancel = true;
    },
    close: closeModal,
    get cancelled() { return st.cancelled; },
  };
}

// --- Selector de mapa (modal con buscador + árbol) ---------------------------------------------
export function mapPickerModal(title, onPick) {
  const wrap = document.createElement("div");
  wrap.innerHTML = `<input class="inp" placeholder="🔍 Buscar mapa por nombre o ID…" />
    <div class="picklist"></div>`;
  const inp = wrap.querySelector("input");
  const list = wrap.querySelector(".picklist");
  const draw = (filter = "") => {
    const f = filter.trim().toLowerCase();
    const items = S.tree.filter((m) =>
      !f || m.name.toLowerCase().includes(f) || String(m.id) === f || String(m.id).includes(f));
    list.innerHTML = items.slice(0, 400).map((m) =>
      `<button class="pickrow" data-id="${m.id}">
        <span class="mono muted">${m.id}</span>
        <span style="margin-left:${m.depth * 14}px">${esc(m.name)}</span>
      </button>`).join("") || `<p class="muted">Sin resultados.</p>`;
    if (items.length > 400) list.innerHTML += `<p class="muted">…${items.length - 400} más (afina la búsqueda)</p>`;
    list.querySelectorAll(".pickrow").forEach((b) => {
      b.onclick = () => { closeModal(); onPick(Number(b.dataset.id)); };
    });
  };
  inp.oninput = () => draw(inp.value);
  draw();
  openModal({ title, body: wrap, wide: true });
  setTimeout(() => inp.focus(), 100);
}

// --- Selector de sprite de personaje --------------------------------------------------------------
export async function spritePickerModal(title, current, onPick) {
  const wrap = document.createElement("div");
  wrap.innerHTML = `<input class="inp" placeholder="🔍 Buscar sprite…" /><div class="spritegrid"></div>`;
  const grid = wrap.querySelector(".spritegrid");
  const inp = wrap.querySelector("input");
  const draw = async (filter = "") => {
    const f = filter.trim().toLowerCase();
    const files = S.characters.filter((n) => !f || n.toLowerCase().includes(f)).slice(0, 120);
    grid.innerHTML = `<button class="sprrow${!current ? " sel" : ""}" data-n="">
      <span class="sprnone">∅</span><span>Sin gráfico</span></button>` +
      files.map((n) => `<button class="sprrow${n.replace(/\.[^.]+$/, "") === current ? " sel" : ""}" data-n="${esc(n)}">
        <canvas width="48" height="48"></canvas><span>${esc(n)}</span></button>`).join("");
    grid.querySelectorAll(".sprrow").forEach((b) => {
      b.onclick = () => {
        const n = b.dataset.n;
        closeModal();
        onPick(n ? n.replace(/\.[^.]+$/, "") : "");
      };
    });
    // previews perezosas
    for (const b of grid.querySelectorAll(".sprrow[data-n]:not([data-n=''])")) {
      try {
        const img = await FS.readImage("Graphics/Characters/" + b.dataset.n);
        const cv = b.querySelector("canvas");
        if (cv) drawCharacterPreview(cv, img, 2, 1);
      } catch { /* noop */ }
    }
  };
  inp.oninput = () => draw(inp.value);
  openModal({ title, body: wrap, wide: true });
  draw();
}

// --- Selector de evento de un mapa -------------------------------------------------------------------
export async function eventPickerModal(mapId, onPick) {
  const rec = await loadMap(mapId);
  const rows = [];
  for (const { id, obj } of rec.parsed.events) {
    let name = "";
    try { name = parseEvent(obj).name; } catch { name = "?"; }
    const x = obj.getIvar?.("x") ?? "?", y = obj.getIvar?.("y") ?? "?";
    rows.push(`<button class="pickrow" data-id="${id}"><span class="mono muted">${id}</span><span>${esc(name)}</span><span class="muted">(${x},${y})</span></button>`);
  }
  const wrap = document.createElement("div");
  wrap.innerHTML = `<div class="picklist">${rows.join("") || "<p class=muted>Sin eventos.</p>"}</div>`;
  wrap.querySelectorAll(".pickrow").forEach((b) => {
    b.onclick = () => { closeModal(); onPick(Number(b.dataset.id)); };
  });
  openModal({ title: `Eventos del mapa ${mapId}`, body: wrap, wide: true });
}

export function debounce(fn, ms = 250) {
  let t = null;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
