#!/usr/bin/env node
/**
 * audit_back_sprites.mjs — auditoría de los back sprites de los kits de
 * atuendo (creep_back, glazed_back, lp_back, lc_back y ash_maestro_back)
 * contra su frente, para que la espalda nunca tenga proporciones distintas.
 *
 * Mide los PNG del juego, que es lo que ve el jugador (umbral de opacidad
 * visible: alfa >= 128):
 *
 *  Caminar y correr (`trchar000_N`, `boy_run_N`; celdas de 32x48)
 *    - ninguna celda con la figura partida (tocando los dos bordes) ni con
 *      filas transparentes en mitad de la figura;
 *    - fila 0 (frente) contra fila 3 (espalda), marco quieto: pies en la misma
 *      línea base, misma altura (±1 px), mismo eje del cuerpo (±1,5 px) y
 *      misma proporción cabeza/alto (±15 %, una celda de 48 px cuantiza).
 *
 *  Batalla (`POKEMONTRAINER_Red_N_back` contra `POKEMONTRAINER_Red_N`)
 *    - rejilla del motor: Scene_Initialize trata como animada la tira con
 *      width > 2*height y la corta en width/5; cada uno de los 5 marcos con
 *      figura anclada abajo (oy = alto), ningún píxel cruzando de un marco al
 *      vecino ni sobrando fuera de los 5 marcos;
 *    - la pose quieta a la escala de su frente (altura en pie ±10 %) y con su
 *      proporción cabeza/alto (±10 %);
 *    - las poses de lanzar a la misma escala que la quieta (±10 %).
 *
 *  Además, como referencia, la tira original `POKEMONTRAINER_Red_back` (debe
 *  pasar la rejilla) y, solo a título informativo, los charsets heredados
 *  `ash_outfit_{creep,glazed,lp,lc}` de los atavíos por dimensión.
 *
 * Las medidas se escriben entre las marcas del informe
 * docs/AUDITORIA_BACK_SPRITES.md, junto con la conformación que aplicó el
 * ensamblador (content/atuendos_espaldas.json, de tools/assemble_atuendos.py).
 *
 * Uso:
 *   node tools/audit_back_sprites.mjs            # mide y actualiza el informe
 *   node tools/audit_back_sprites.mjs --verify   # falla si algo se sale de
 *                                                # tolerancia o el informe está viejo
 *   node tools/audit_back_sprites.mjs --json     # vuelca las medidas en JSON
 *   node tools/audit_back_sprites.mjs --gfx <dir> # audita otra carpeta Graphics
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const VERIFY = args.includes("--verify");
const JSON_OUT = args.includes("--json");
const gfxArg = args.indexOf("--gfx");
const GFX = gfxArg >= 0 && args[gfxArg + 1]
  ? path.resolve(args[gfxArg + 1])
  : path.join(ROOT, "pokemon_fire_ash", "Graphics");
const CHARS = path.join(GFX, "Characters");
const TRAINERS = path.join(GFX, "Trainers");
const CONFORMACION = path.join(ROOT, "content", "atuendos_espaldas.json");
const INFORME = path.join(ROOT, "docs", "AUDITORIA_BACK_SPRITES.md");
const INICIO = "<!-- audit_back_sprites:inicio -->";
const FIN = "<!-- audit_back_sprites:fin -->";

/** Kits de atuendo de tools/assemble_atuendos.py (slot de outfit -> crudos). */
const KITS = [
  { slot: 8, crudo: "ash_maestro", nombre: "Maestro (regalo de Oak)" },
  { slot: 11, crudo: "creep", nombre: "Viajero 1ª Gen (crepypasta)" },
  { slot: 12, crudo: "glazed", nombre: "Glazed" },
  { slot: 13, crudo: "lp", nombre: "Light Platinum" },
  { slot: 14, crudo: "lc", nombre: "Liquid Crystal" },
];
/** Charsets heredados de los atavíos por dimensión (informativo). */
const HEREDADOS = ["creep", "glazed", "lp", "lc"];

const TOL = {
  alturaCaminarPx: 1,
  ejeCaminarPx: 1.5,
  cabezaCaminar: 0.15,
  cabezaBatalla: 0.10,
  escalaFrente: 0.10,
  escalaPoses: 0.10,
};
const ALFA = 128;
const CELDA = { w: 32, h: 48 };
const MARCOS = 5;

async function cargar(file) {
  const img = await loadImage(fs.readFileSync(file));
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return { w: img.width, h: img.height, data: ctx.getImageData(0, 0, img.width, img.height).data };
}

const alfa = (img, x, y) => img.data[(y * img.w + x) * 4 + 3];

/**
 * Mide la figura de una región: caja, perfil por fila, cuello, proporción
 * cabeza/alto, altura en pie y eje del cuerpo (centroide de los pies). Mismos criterios que
 * tools/assemble_atuendos.py (neck_row, head_ratio, standing_height, body_axis).
 */
function medirFigura(img, x0, y0, w, h, umbral = ALFA) {
  let bx0 = w, by0 = h, bx1 = -1, by1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (alfa(img, x0 + x, y0 + y) >= umbral) {
        if (x < bx0) bx0 = x;
        if (x > bx1) bx1 = x;
        if (y < by0) by0 = y;
        if (y > by1) by1 = y;
      }
    }
  }
  if (bx1 < 0) return null;
  const filas = [];
  for (let y = by0; y <= by1; y++) {
    let cnt = 0, mejor = 0, racha = 0, peso = 0;
    for (let x = 0; x < w; x++) {
      const a = alfa(img, x0 + x, y0 + y);
      peso += a / 255;
      if (a >= umbral) {
        cnt++;
        racha++;
        if (racha > mejor) mejor = racha;
      } else {
        racha = 0;
      }
    }
    filas.push({ cnt, mejor, peso });
  }
  const alto = by1 - by0 + 1;
  const cuello = filaCuello(filas);
  const tope = cuello ?? Math.max(1, Math.floor(0.30 * alto));
  // Ancho de cabeza ponderado por alfa: el borde suavizado del reescalado
  // cuenta su fracción y una celda de 48 px no salta de píxel en píxel.
  let anchoCabeza = 0;
  for (let i = 0; i < tope; i++) anchoCabeza = Math.max(anchoCabeza, filas[i].peso);
  let coronilla = 0;
  while (coronilla < alto && filas[coronilla].mejor < 0.15 * alto) coronilla++;
  // Eje del cuerpo: centroide de los pies (15 % inferior), como body_axis().
  const yPies = by1 + 1 - Math.max(1, Math.round(alto * 0.15));
  let total = 0, suma = 0;
  for (let y = yPies; y <= by1; y++) {
    for (let x = 0; x < w; x++) if (alfa(img, x0 + x, y0 + y) >= umbral) { total++; suma += x; }
  }
  const eje = total ? suma / total + 0.5 : w / 2;
  let huecos = 0;
  for (const f of filas) if (f.cnt === 0) huecos++;
  // Figura partida: toca los dos bordes y entre medias hay columnas vacías
  // (dos medias figuras de celdas vecinas), no una figura ancha que llena la celda.
  let partida = false;
  if (bx0 === 0 && bx1 === w - 1) {
    for (let x = 1; x < w - 1 && !partida; x++) {
      let vacia = true;
      for (let y = by0; y <= by1 && vacia; y++) if (alfa(img, x0 + x, y0 + y) >= umbral) vacia = false;
      if (vacia) partida = true;
    }
  }
  return {
    caja: [bx0, by0, bx1 + 1, by1 + 1],
    alto,
    ancho: bx1 - bx0 + 1,
    base: by1,
    cuello,
    cabeza: anchoCabeza / alto,
    enPie: alto - coronilla,
    eje,
    huecos,
    partida,
  };
}

function filaCuello(filas) {
  const h = filas.length;
  if (h < 8) return null;
  const k = Math.max(1, Math.floor(h / 100));
  const sm = filas.map((_, y) => {
    let s = 0, n = 0;
    for (let i = Math.max(0, y - k); i <= Math.min(h - 1, y + k); i++) { s += filas[i].cnt; n++; }
    return s / n;
  });
  const lo = Math.floor(0.18 * h), hi = Math.floor(0.50 * h);
  if (hi <= lo) return null;
  let y = lo;
  for (let i = lo; i < hi; i++) if (sm[i] < sm[y]) y = i;
  const cabeza = y ? Math.max(...sm.slice(0, y)) : 0;
  const cuerpo = Math.max(...sm.slice(y, Math.max(y + 1, Math.floor(0.70 * h))));
  return sm[y] < 0.85 * cabeza && sm[y] < 0.75 * cuerpo ? y : null;
}

const desvio = (a, b) => (b ? a / b - 1 : Infinity);
let comprobaciones = 0;
/** Registra una comprobación; si falla, añade el mensaje a `errores`. */
function comprobar(errores, ok, mensaje) {
  comprobaciones++;
  if (!ok) errores.push(typeof mensaje === "function" ? mensaje() : mensaje);
  return ok;
}
const pct = (v) => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(1)} %`;
const num = (v, d = 3) => (v === null || v === undefined ? "—" : Number(v).toFixed(d));

/** Rejilla de una tira trasera tal como la corta el motor. */
function medirTira(img) {
  const animada = img.w > img.h * 2;
  const fw = animada ? Math.floor(img.w / MARCOS) : img.w;
  const n = animada ? MARCOS : 1;
  const marcos = [];
  for (let i = 0; i < n; i++) marcos.push(medirFigura(img, i * fw, 0, fw, img.h));
  const bordes = [];
  for (let i = 1; i < n; i++) {
    const b = i * fw;
    let filas = 0;
    for (let y = 0; y < img.h; y++) if (alfa(img, b - 1, y) > 0 && alfa(img, b, y) > 0) filas++;
    bordes.push({ x: b, filas });
  }
  const cruces = bordes.filter((b) => b.filas > 0);
  let sobrante = 0;
  for (let x = n * fw; x < img.w; x++) for (let y = 0; y < img.h; y++) if (alfa(img, x, y) > 0) sobrante++;
  return { animada, fw, marcos, bordes, cruces, sobrante };
}

function revisarRejilla(nombre, img, tira, errores) {
  comprobar(errores, tira.animada, `${nombre}: ${img.w}x${img.h} no es una tira animada (width <= 2*height)`);
  tira.marcos.forEach((m, i) => {
    if (comprobar(errores, Boolean(m), `${nombre}: el marco ${i} (de ${tira.fw} px) está vacío`)) {
      comprobar(errores, m.base === img.h - 1,
        () => `${nombre}: el marco ${i} no está anclado abajo (pies en y=${m.base}, el motor usa oy=${img.h})`);
    }
  });
  for (const b of tira.bordes) {
    comprobar(errores, b.filas === 0,
      `${nombre}: la figura cruza el borde de marco x=${b.x} (${b.filas} filas); el motor corta la tira en width/${MARCOS}`);
  }
  comprobar(errores, tira.sobrante === 0, () => `${nombre}: ${tira.sobrante} px opacos fuera de los ${MARCOS} marcos de ${tira.fw} px`);
}

async function auditarCaminar(kit, hoja, errores) {
  const file = path.join(CHARS, `${hoja}.png`);
  if (!comprobar(errores, fs.existsSync(file), `falta Characters/${hoja}.png`)) return null;
  const img = await cargar(file);
  if (!comprobar(errores, img.w === CELDA.w * 4 && img.h === CELDA.h * 4,
    `${hoja}: mide ${img.w}x${img.h} (se espera 128x192)`)) return null;
  const celdas = [];
  let malas = 0;
  for (let fila = 0; fila < 4; fila++) {
    for (let col = 0; col < 4; col++) {
      const m = medirFigura(img, col * CELDA.w, fila * CELDA.h, CELDA.w, CELDA.h);
      celdas.push(m);
      const donde = `${hoja}: celda fila ${fila} col ${col}`;
      if (!comprobar(errores, Boolean(m), `${donde} vacía`)) { malas++; continue; }
      const sana = comprobar(errores, !m.partida, `${donde} con la figura partida (medias figuras en los dos bordes)`)
        & comprobar(errores, m.huecos === 0, `${donde} con ${m.huecos} filas transparentes en mitad de la figura`);
      if (!sana) malas++;
    }
  }
  const frente = celdas[0];
  const espalda = celdas[12];
  if (!frente || !espalda) return null;
  const r = {
    hoja,
    frente,
    espalda,
    malas,
    dAlto: espalda.alto - frente.alto,
    dEje: espalda.eje - frente.eje,
    dCabeza: desvio(espalda.cabeza, frente.cabeza),
  };
  comprobar(errores, espalda.base === frente.base,
    `${hoja}: pies de la espalda en y=${espalda.base} y del frente en y=${frente.base}`);
  comprobar(errores, Math.abs(r.dAlto) <= TOL.alturaCaminarPx,
    `${hoja}: la espalda mide ${espalda.alto} px y el frente ${frente.alto} px (±${TOL.alturaCaminarPx})`);
  comprobar(errores, Math.abs(r.dEje) <= TOL.ejeCaminarPx,
    `${hoja}: eje del cuerpo de la espalda desplazado ${r.dEje.toFixed(1)} px respecto al frente (±${TOL.ejeCaminarPx})`);
  comprobar(errores, Math.abs(r.dCabeza) <= TOL.cabezaCaminar,
    `${hoja}: proporción cabeza/alto de la espalda ${num(espalda.cabeza)} contra ${num(frente.cabeza)} del frente (${pct(r.dCabeza)}, ±${TOL.cabezaCaminar * 100} %)`);
  return r;
}

async function auditarBatalla(kit, errores) {
  const nombreFrente = `POKEMONTRAINER_Red_${kit.slot}`;
  const nombreTira = `${nombreFrente}_back`;
  const fFrente = path.join(TRAINERS, `${nombreFrente}.png`);
  const fTira = path.join(TRAINERS, `${nombreTira}.png`);
  if (!comprobar(errores, fs.existsSync(fFrente), `falta Trainers/${nombreFrente}.png`)) return null;
  if (!comprobar(errores, fs.existsSync(fTira), `falta Trainers/${nombreTira}.png`)) return null;
  const frenteImg = await cargar(fFrente);
  const tiraImg = await cargar(fTira);
  const frente = medirFigura(frenteImg, 0, 0, frenteImg.w, frenteImg.h);
  if (!comprobar(errores, Boolean(frente), `${nombreFrente}: sin figura`)) return null;
  const tira = medirTira(tiraImg);
  revisarRejilla(nombreTira, tiraImg, tira, errores);
  const quieto = tira.marcos[0];
  const r = { frente, tira, size: [tiraImg.w, tiraImg.h], escalaPoses: [] };
  if (!quieto) return r;
  r.escalaFrente = desvio(quieto.enPie, frente.enPie);
  r.cabeza = desvio(quieto.cabeza, frente.cabeza);
  r.escalaPoses = tira.marcos.slice(1).map((m) => (m ? desvio(m.enPie, quieto.enPie) : null));
  comprobar(errores, Math.abs(r.escalaFrente) <= TOL.escalaFrente,
    `${nombreTira}: la pose quieta mide ${quieto.enPie} px en pie y su frente ${frente.enPie} px (${pct(r.escalaFrente)}, ±${TOL.escalaFrente * 100} %)`);
  comprobar(errores, Math.abs(r.cabeza) <= TOL.cabezaBatalla,
    `${nombreTira}: proporción cabeza/alto ${num(quieto.cabeza)} contra ${num(frente.cabeza)} de su frente (${pct(r.cabeza)}, ±${TOL.cabezaBatalla * 100} %)`);
  r.escalaPoses.forEach((d, i) => {
    if (d === null) return;
    comprobar(errores, Math.abs(d) <= TOL.escalaPoses,
      `${nombreTira}: el marco ${i + 1} cambia la escala del personaje ${pct(d)} respecto a la pose quieta (±${TOL.escalaPoses * 100} %)`);
  });
  return r;
}

async function auditarHeredado(clave) {
  const file = path.join(CHARS, `ash_outfit_${clave}.png`);
  if (!fs.existsSync(file)) return { clave, falta: true };
  const img = await cargar(file);
  let partidas = 0, vacias = 0, huecos = 0;
  const celdas = [];
  for (let fila = 0; fila < 4; fila++) {
    for (let col = 0; col < 4; col++) {
      const m = medirFigura(img, col * CELDA.w, fila * CELDA.h, CELDA.w, CELDA.h);
      celdas.push(m);
      if (!m) { vacias++; continue; }
      if (m.partida) partidas++;
      if (m.huecos) huecos++;
    }
  }
  const frente = celdas[0], espalda = celdas[12];
  return {
    clave,
    size: [img.w, img.h],
    partidas,
    vacias,
    huecos,
    altoFrente: frente?.alto ?? null,
    altoEspalda: espalda?.alto ?? null,
  };
}

function leerConformacion(errores) {
  if (!comprobar(errores, fs.existsSync(CONFORMACION),
    "falta content/atuendos_espaldas.json (ejecuta python3 tools/assemble_atuendos.py)")) return null;
  const datos = JSON.parse(fs.readFileSync(CONFORMACION, "utf8"));
  for (const kit of KITS) {
    const k = datos.kits?.[String(kit.slot)];
    if (!comprobar(errores, Boolean(k), `content/atuendos_espaldas.json no registra el kit ${kit.slot} (${kit.crudo})`)) continue;
    comprobar(errores, k.crudo === kit.crudo, `content/atuendos_espaldas.json: el kit ${kit.slot} usa ${k.crudo} y no ${kit.crudo}`);
    comprobar(errores, k.batalla?.marcos === "5x162x196",
      `content/atuendos_espaldas.json: el kit ${kit.slot} no se ensambló en la rejilla de 5 marcos de 162x196`);
  }
  return datos;
}

function informe(res) {
  const L = [];
  L.push(INICIO);
  L.push("<!-- Bloque generado por tools/audit_back_sprites.mjs: no editar a mano. -->");
  L.push("");
  L.push(`Resultado: **${res.errores.length ? `${res.errores.length} incidencias` : "todo dentro de tolerancia"}** `
    + `(${KITS.length} kits, ${res.comprobaciones} comprobaciones).`);
  L.push("");
  L.push("#### Caminar: frente (fila 0) contra espalda (fila 3), marco quieto");
  L.push("");
  L.push("| Slot | Kit | Alto frente / espalda (px) | Pies (y) | Eje frente / espalda (x) | Cabeza/alto frente / espalda | Desvío cabeza | Celdas partidas o con huecos (caminar + correr) |");
  L.push("|---|---|---|---|---|---|---|---|");
  for (const k of res.kits) {
    const c = k.caminar;
    if (!c) { L.push(`| ${k.slot} | ${k.crudo} | — | — | — | — | — | falta |`); continue; }
    const malas = (c.malas || 0) + (k.correr?.malas || 0);
    L.push(`| ${k.slot} | ${k.crudo} | ${c.frente.alto} / ${c.espalda.alto} | ${c.frente.base} / ${c.espalda.base} `
      + `| ${c.frente.eje.toFixed(1)} / ${c.espalda.eje.toFixed(1)} | ${num(c.frente.cabeza)} / ${num(c.espalda.cabeza)} `
      + `| ${pct(c.dCabeza)} | ${malas} |`);
  }
  L.push("");
  L.push("#### Batalla: tira trasera contra su frente");
  L.push("");
  L.push("| Slot | Tira | Marcos (motor) | Cruces de marco | En pie frente / quieto (px) | Escala quieto vs frente | Cabeza/alto frente / quieto | Desvío cabeza | Escala marcos 1-4 vs quieto |");
  L.push("|---|---|---|---|---|---|---|---|---|");
  for (const k of res.kits) {
    const b = k.batalla;
    if (!b) { L.push(`| ${k.slot} | falta | — | — | — | — | — | — | — |`); continue; }
    const q = b.tira.marcos[0];
    L.push(`| ${k.slot} | ${b.size[0]}x${b.size[1]} | ${b.tira.marcos.length} x ${b.tira.fw} px | ${b.tira.cruces.length} `
      + `| ${b.frente.enPie} / ${q ? q.enPie : "—"} | ${b.escalaFrente !== undefined ? pct(b.escalaFrente) : "—"} `
      + `| ${num(b.frente.cabeza)} / ${q ? num(q.cabeza) : "—"} | ${b.cabeza !== undefined ? pct(b.cabeza) : "—"} `
      + `| ${(b.escalaPoses || []).map((d) => (d === null ? "—" : pct(d))).join(", ")} |`);
  }
  L.push("");
  const ref = res.referencia;
  L.push(ref
    ? `Referencia del motor: \`POKEMONTRAINER_Red_back.png\` ${ref.size[0]}x${ref.size[1]}, `
      + `${ref.tira.marcos.length} marcos de ${ref.tira.fw} px, ${ref.tira.cruces.length} cruces de marco, `
      + `${ref.tira.marcos.filter(Boolean).length}/${ref.tira.marcos.length} marcos con figura.`
    : "Referencia del motor: falta `POKEMONTRAINER_Red_back.png`.");
  L.push("");
  if (res.conformacion) {
    L.push("#### Conformación aplicada por el ensamblador (`content/atuendos_espaldas.json`)");
    L.push("");
    L.push("Proporción cabeza/alto medida en los crudos IA y factor `k` con el que se escaló solo la cabeza de la espalda (1 = sin retoque).");
    L.push("");
    L.push("| Slot | Crudos | Caminar: frente / espalda → conformada | k caminar | Batalla: frente / quieto → conformada | k batalla | En pie frente / espalda (px) |");
    L.push("|---|---|---|---|---|---|---|");
    for (const kit of KITS) {
      const c = res.conformacion.kits?.[String(kit.slot)];
      if (!c) continue;
      const w = c.caminar || {}, t = c.batalla || {};
      L.push(`| ${kit.slot} | \`${w.espalda}\` / \`${t.quieto}\` | ${num(w.cabeza_frente)} / ${num(w.cabeza_espalda)} → ${num(w.cabeza_conformada)} `
        + `| ${num(w.k_cabeza, 2)} | ${num(t.cabeza_frente)} / ${num(t.cabeza_quieto)} → ${num(t.cabeza_conformada)} | ${num(t.k_cabeza, 2)} `
        + `| ${t.altura_en_pie_frente ?? "—"} / ${t.altura_en_pie_espalda ?? "—"} |`);
    }
    L.push("");
  }
  L.push("#### Charsets heredados de los atavíos por dimensión (informativo, no bloquea)");
  L.push("");
  L.push("| Charset | Tamaño | Celdas con la figura partida | Celdas con huecos | Celdas vacías |");
  L.push("|---|---|---|---|---|");
  for (const h of res.heredados) {
    if (h.falta) { L.push(`| \`ash_outfit_${h.clave}\` | falta | — | — | — |`); continue; }
    L.push(`| \`ash_outfit_${h.clave}\` | ${h.size[0]}x${h.size[1]} | ${h.partidas}/16 | ${h.huecos}/16 | ${h.vacias}/16 |`);
  }
  L.push("");
  if (res.errores.length) {
    L.push("#### Incidencias");
    L.push("");
    for (const e of res.errores) L.push(`- ${e}`);
    L.push("");
  }
  L.push(FIN);
  return L.join("\n");
}

async function auditar() {
  const errores = [];
  const kits = [];
  for (const kit of KITS) {
    const caminar = await auditarCaminar(kit, `trchar000_${kit.slot}`, errores);
    const correr = await auditarCaminar(kit, `boy_run_${kit.slot}`, errores);
    const batalla = await auditarBatalla(kit, errores);
    kits.push({ ...kit, caminar, correr, batalla });
  }
  const refFile = path.join(TRAINERS, "POKEMONTRAINER_Red_back.png");
  let referencia = null;
  if (comprobar(errores, fs.existsSync(refFile), "falta Trainers/POKEMONTRAINER_Red_back.png (referencia del motor)")) {
    const refImg = await cargar(refFile);
    const refTira = medirTira(refImg);
    revisarRejilla("POKEMONTRAINER_Red_back (referencia)", refImg, refTira, errores);
    referencia = { size: [refImg.w, refImg.h], tira: refTira };
  }
  const heredados = [];
  for (const clave of HEREDADOS) heredados.push(await auditarHeredado(clave));
  const conformacion = leerConformacion(errores);
  return { errores, kits, referencia, heredados, conformacion, comprobaciones };
}

function bloqueActual() {
  if (!fs.existsSync(INFORME)) return null;
  const texto = fs.readFileSync(INFORME, "utf8");
  const a = texto.indexOf(INICIO), b = texto.indexOf(FIN);
  if (a < 0 || b < a) return null;
  return { texto, a, b: b + FIN.length };
}

const res = await auditar();
const bloque = informe(res);

if (JSON_OUT) {
  console.log(JSON.stringify({ errores: res.errores, kits: res.kits, referencia: res.referencia, heredados: res.heredados }, null, 2));
} else if (VERIFY) {
  const actual = bloqueActual();
  if (!actual) res.errores.push("docs/AUDITORIA_BACK_SPRITES.md no tiene el bloque de medidas (ejecuta node tools/audit_back_sprites.mjs)");
  else if (actual.texto.slice(actual.a, actual.b) !== bloque) res.errores.push("docs/AUDITORIA_BACK_SPRITES.md está desactualizado (ejecuta node tools/audit_back_sprites.mjs)");
} else {
  const actual = bloqueActual();
  if (!actual) {
    console.error("docs/AUDITORIA_BACK_SPRITES.md no existe o no tiene las marcas del bloque de medidas.");
    process.exit(1);
  }
  fs.writeFileSync(INFORME, actual.texto.slice(0, actual.a) + bloque + actual.texto.slice(actual.b));
  console.log("  -> docs/AUDITORIA_BACK_SPRITES.md");
}

if (!JSON_OUT) {
  for (const k of res.kits) {
    const c = k.caminar, b = k.batalla;
    console.log(`[back sprites] kit ${k.slot} ${k.crudo}: caminar cabeza ${c ? pct(c.dCabeza) : "—"}, `
      + `batalla ${b ? `${b.tira.marcos.length}x${b.tira.fw} px, escala ${b.escalaFrente !== undefined ? pct(b.escalaFrente) : "—"}` : "—"}`);
  }
}
if (res.errores.length) {
  console.error(`audit_back_sprites: ${res.errores.length} incidencias`);
  for (const e of res.errores) console.error(`  - ${e}`);
  process.exit(1);
}
if (!JSON_OUT) console.log(VERIFY ? "audit_back_sprites --verify OK" : "audit_back_sprites OK");
