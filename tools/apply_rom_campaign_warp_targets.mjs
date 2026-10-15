#!/usr/bin/env node
/**
 * Warps de campaña sobre celdas transitables.
 *
 * Los 5.061 warps de las campañas invitadas se instalaron con el compilador
 * estructural (`tools/apply_complete_rom_campaigns.mjs`), que los hacía
 * aterrizar en la celda (2, 2) del mapa de destino: una celda que su propio
 * pintor reserva libre. Después, la reconstrucción 1:1 de las ROMs
 * (`tools/rom_nativo_mapas.mjs`) repintó esos mapas célula a célula como la
 * ROM, con sus muros reales, y abrió sólo las celdas ocupadas por eventos
 * (`abrirCeldasDeEventos`). Resultado: (2, 2) volvió a ser pared en gran parte
 * de los mapas y miles de warps empezaron a apuntar a muros.
 *
 * Esta herramienta cierra ese hueco sin tocar un solo tile:
 *
 *   1. Lee los 5.061 eventos `PokeMod Campaña ROM: Warp N` instalados y extrae
 *      el comando de transferencia (código 201) de cada uno.
 *   2. Mide el mapa de destino: celdas transitables en las cuatro direcciones,
 *      sin eventos encima, y se queda con el componente conexo mayor para no
 *      dejar a nadie en un bolsillo aislado.
 *   3. Si el destino ya es válido, no se toca. Si no, se reescribe el comando
 *      con la celda válida más cercana a la que el warp pedía.
 *   4. Deja copia de seguridad de cada mapa modificado y escribe el censo en
 *      `content/rom_campaign_warp_targets.json` y el informe en
 *      `docs/CAMPANAS_ROM_WARPS_TRANSITABLES.md`.
 *
 * `--verify` no escribe: comprueba que los 5.061 warps aterrizan en celda
 * transitable y que el censo está al día.
 *
 * Uso:
 *   node tools/apply_rom_campaign_warp_targets.mjs            # corrige y verifica
 *   node tools/apply_rom_campaign_warp_targets.mjs --dry-run  # mide sin escribir
 *   node tools/apply_rom_campaign_warp_targets.mjs --verify   # sólo comprueba
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalLoad } from "../web/js/marshal.js";
import { parseMap } from "../web/js/rmxp.js";
import { passabilityOf } from "./lib/map_painter.mjs";
import {
  DATA, ROOT, backup, eventsOf, iv, makeChecker, mapFile, pagesOf, readMapRaw,
  txt, writeMapRaw,
} from "./lib/dlc_helpers.mjs";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PLAN_PATH = path.join(ROOT_DIR, "content", "rom_campaigns_complete.json");
const REPORT_PATH = path.join(ROOT_DIR, "content", "rom_campaign_warp_targets.json");
const DOC_PATH = path.join(ROOT_DIR, "docs", "CAMPANAS_ROM_WARPS_TRANSITABLES.md");

const VERIFY = process.argv.includes("--verify");
const DRY = process.argv.includes("--dry-run");
const INSPECTAR = (process.argv.find((a) => a.startsWith("--inspect=")) ?? "").split("=")[1];
const MARKER = "PokeMod Campaña ROM:";
const DIRS = [2, 4, 6, 8];                 // abajo, izquierda, derecha, arriba
const PLAN = JSON.parse(fs.readFileSync(PLAN_PATH, "utf8"));

/* ─────────────────────────── mapa de destino ────────────────────────────── */

const cache = new Map();

/**
 * Malla de aterrizaje de un mapa: `libre` marca las celdas transitables en las
 * cuatro direcciones y sin eventos encima; `region` es el componente conexo
 * mayor de esas celdas. Sólo se guardan dos vectores planos por mapa: con mil
 * y pico mapas de campaña no cabe otra cosa.
 */
function mallaDe(mapId) {
  if (cache.has(mapId)) return cache.get(mapId);
  const file = path.join(DATA, mapFile(mapId));
  if (!fs.existsSync(file)) { cache.set(mapId, null); return null; }
  const parsed = parseMap(marshalLoad(fs.readFileSync(file)));
  const pass = passabilityOf(parsed, parsed.tilesetId);
  const { width, height } = parsed;
  const size = width * height;
  const pasable = new Uint8Array(size);
  const ocupado = new Uint8Array(size);
  const solido = new Uint8Array(size);
  // Celdas sin ningún evento que se dispare solo (sólo botón de acción,
  // código 0): se puede caer encima sin que salte nada al llegar.
  const tacto = new Uint8Array(size);
  let referencia = null;
  for (const { obj } of parsed.events) {
    const name = txt(iv(obj, "@name"));
    const x = Number(obj.getIvar("@x") ?? -1), y = Number(obj.getIvar("@y") ?? -1);
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const i = y * width + x;
    ocupado[i] = 1;
    // Con el parche de colisión del juego, un evento con gráfico ocupa su celda.
    const pages = obj.getIvar("@pages") ?? [];
    if (pages.some((page) => txt(iv(page, "@graphic")?.getIvar?.("@character_name")))) solido[i] = 1;
    if (pages.some((page) => Number(iv(page, "@trigger") ?? 0) !== 0)) tacto[i] = 1;
    if (name === `${MARKER} Retorno libre`) referencia = i;
  }
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      if (DIRS.every((dir) => pass.passable(x, y, dir))) pasable[i] = 1;
    }
  }
  // Componentes conexos sobre las celdas transitables (los eventos invisibles
  // no cortan el paso; los que tienen gráfico sí).
  const transitable = new Uint8Array(size);
  for (let i = 0; i < size; i += 1) transitable[i] = pasable[i] && !solido[i] ? 1 : 0;
  const comp = new Int32Array(size).fill(-1);
  const regiones = [];
  const cola = new Int32Array(size);
  for (let inicio = 0; inicio < size; inicio += 1) {
    if (!transitable[inicio] || comp[inicio] !== -1) continue;
    const id = regiones.length;
    const celdas = [];
    let cabeza = 0, fin = 0;
    cola[fin] = inicio; fin += 1;
    comp[inicio] = id;
    while (cabeza < fin) {
      const actual = cola[cabeza]; cabeza += 1;
      celdas.push(actual);
      const x = actual % width, y = (actual - x) / width;
      const vecinos = [
        y > 0 ? actual - width : -1,
        y + 1 < height ? actual + width : -1,
        x > 0 ? actual - 1 : -1,
        x + 1 < width ? actual + 1 : -1,
      ];
      for (const v of vecinos) if (v >= 0 && transitable[v] && comp[v] === -1) { comp[v] = id; cola[fin] = v; fin += 1; }
    }
    regiones.push(celdas);
  }
  const libresEn = (celdas) => celdas.reduce((n, i) => n + (ocupado[i] ? 0 : 1), 0);
  let mayor = 0;
  for (let i = 1; i < regiones.length; i += 1) if (libresEn(regiones[i]) > libresEn(regiones[mayor])) mayor = i;
  // La región de aterrizaje es la que contiene el retorno libre del mapa —así
  // el jugador siempre puede alcanzar la salida—, siempre que tenga al menos
  // una celda libre donde caer. Si no, la región con más celdas de aterrizaje.
  let regionId = mayor, regionElegida = "mayor";
  if (referencia !== null && comp[referencia] >= 0 && libresEn(regiones[comp[referencia]]) > 0) {
    regionId = comp[referencia]; regionElegida = "retorno";
  }
  regionId = regionsLabel(regionId);
  const malla = {
    mapId, width, height, pasable, ocupado, solido, tacto, transitable, comp, referencia, regionId, regionElegida,
    // Candidatas de aterrizaje: región elegida, transitables y sin ningún evento.
    // Nivel 1: celdas libres. Nivel 2 —sólo si la región no tiene ninguna
    // libre, como pasa en los mapas rom 1:1 que son muro entero—: celdas cuyos
    // eventos esperan el botón de acción.
    celdas: (regiones[regionId] ?? []).filter((i) => !ocupado[i]).sort((a, b) => a - b),
    celdasConEvento: (regiones[regionId] ?? []).filter((i) => ocupado[i] && !tacto[i]).sort((a, b) => a - b),
    // Centro aproximado de la región elegida: sirve para desempatar hacia dentro.
    centro: centroDe(regiones[regionId] ?? [], width),
    libres: transitable.reduce((n, v) => n + v, 0),
    regiones: regiones.length,
    regionTamano: (regiones[regionId] ?? []).length,
  };
  cache.set(mapId, malla);
  return malla;
}

/** La región elegida es un índice: este alias lo deja claro al leer el código. */
const regionsLabel = (valor) => (typeof valor === "number" ? valor : 0);


/** Centro (mediana) de un conjunto de índices de celda. */
function centroDe(celdas, width) {
  if (!celdas.length) return [0, 0];
  const medio = celdas[Math.floor(celdas.length / 2)];
  const x = medio % width;
  return [x, (medio - x) / width];
}

const dentro = (malla, x, y) => x >= 0 && y >= 0 && x < malla.width && y < malla.height;
const indice = (malla, x, y) => y * malla.width + x;

/** ¿Es una celda de aterrizaje válida? */
function esValida(malla, x, y) {
  if (!malla) return false;
  if (!dentro(malla, x, y)) return false;
  const i = indice(malla, x, y);
  return malla.transitable[i] === 1 && malla.comp[i] === malla.regionId
    && (!malla.ocupado[i] || malla.tacto[i] === 0);
}

/**
 * Celda de aterrizaje: la más cercana a la que pedía el warp y, entre las
 * equidistantes, la más interior de la región (para no dejar al jugador en el
 * borde del mapa si hay una celda igual de cerca por dentro).
 */
function celdaDeAterrizaje(malla, hx, hy) {
  if (!malla) return null;
  if (esValida(malla, hx, hy)) return [hx, hy];
  const cx = malla.centro[0], cy = malla.centro[1];
  for (const nivel of [malla.celdas, malla.celdasConEvento]) {
    let mejor = null, mejorD = Infinity, mejorC = Infinity;
    for (const i of nivel) {
      const x = i % malla.width, y = (i - x) / malla.width;
      const d = Math.abs(x - hx) + Math.abs(y - hy);
      const c = Math.abs(x - cx) + Math.abs(y - cy);
      if (d < mejorD || (d === mejorD && c < mejorC)) { mejorD = d; mejorC = c; mejor = [x, y]; }
    }
    if (mejor) return mejor;
  }
  return null;
}

/** Vecinos transitables de una celda (indicador de que no es un callejón). */
function vecinosLibres(malla, x, y) {
  let n = 0;
  for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    const nx = x + dx, ny = y + dy;
    if (!dentro(malla, nx, ny)) continue;
    if (malla.transitable[indice(malla, nx, ny)] === 1) n += 1;
  }
  return n;
}

/* ──────────────────────────────── warps ─────────────────────────────────── */

/** Extrae el comando de transferencia (201) instalado en un evento. */
function comandoTransferencia(entry) {
  const page = pagesOf(entry)[0];
  if (!page) return null;
  const comando = page.list.find((item) => item.code === 201);
  if (!comando) return null;
  const objeto = page.obj.getIvar("@list").find((item) => Number(item.getIvar("@code")) === 201);
  return { comando, objeto };
}

function censo() {
  const warps = [];
  for (const campaign of PLAN.campaigns) {
    for (const blueprint of campaign.maps) {
      const mapId = blueprint.mapId;
      if (!fs.existsSync(path.join(DATA, mapFile(mapId)))) continue;
      for (const entry of eventsOf(mapId)) {
        if (!entry.name.startsWith(`${MARKER} Warp `)) continue;
        const transferencia = comandoTransferencia(entry);
        if (!transferencia) continue;
        const params = transferencia.comando.params.map((valor) => Number(valor));
        warps.push({
          campaign: campaign.id,
          mapId,
          evento: entry.name,
          destino: Number(params[1]),
          x: Number(params[2]),
          y: Number(params[3]),
          direccion: Number(params[4] ?? 2),
          objeto: transferencia.objeto,
        });
      }
    }
  }
  return warps;
}

/**
 * Escribe de verdad: vuelve a leer cada mapa tocado, localiza sus warps por
 * nombre y reescribe las coordenadas del comando 201. Antes de escribir deja
 * copia del mapa en `PokeModBackups/rom_campaign_warp_targets`.
 */
function aplicar(mapasTocados, planes) {
  backup("rom_campaign_warp_targets", [...mapasTocados].map((id) => mapFile(id)));
  let escritos = 0;
  for (const id of mapasTocados) {
    const raw = readMapRaw(id);
    for (const [, obj] of iv(raw, "@events")?.pairs ?? []) {
      const destino = planes.get(`${id}|${txt(iv(obj, "@name"))}`);
      if (!destino) continue;
      const pagina = (iv(obj, "@pages") ?? [])[0];
      const comando = (iv(pagina, "@list") ?? [])
        .find((item) => Number(iv(item, "@code")) === 201);
      if (!comando) { console.warn(`  ! sin comando 201 en ${txt(iv(obj, "@name"))} (Map${id})`); continue; }
      const params = comando.getIvar("@parameters");
      params[2] = destino[0];
      params[3] = destino[1];
      escritos += 1;
    }
    writeMapRaw(id, raw);
  }
  return escritos;
}

/* ────────────────────────────────── main ────────────────────────────────── */

function main() {
  const previo = fs.existsSync(REPORT_PATH)
    ? JSON.parse(fs.readFileSync(REPORT_PATH, "utf8")) : null;
  const warps = censo();
  const mallas = new Map();
  const mallaPara = (id) => {
    if (!mallas.has(id)) mallas.set(id, mallaDe(id));
    return mallas.get(id);
  };

  if (INSPECTAR) {
    const mapId = Number(INSPECTAR);
    const malla = mallaPara(mapId);
    if (!malla) { console.log(`Map${mapId}: sin malla`); return; }
    console.log(`Map${mapId} ${malla.width}x${malla.height} · libres=${malla.libres} · regiones=${malla.regiones} · region=${malla.regionElegida} (${malla.regionTamano}) · retorno=${malla.referencia === null ? "ninguno" : `${malla.referencia % malla.width},${(malla.referencia - (malla.referencia % malla.width)) / malla.width}`} · aterrizables=${malla.celdas.length} · centro=${malla.centro}`);
    for (let y = 0; y < Math.min(malla.height, 40); y += 1) {
      let fila = "";
      for (let x = 0; x < Math.min(malla.width, 120); x += 1) {
        const i = indice(malla, x, y);
        let c = "#";
        if (malla.pasable[i] === 1) c = malla.solido[i] ? "E" : (malla.ocupado[i] ? "e" : ".");
        if (malla.transitable[i] === 1 && malla.comp[i] === malla.regionId) c = malla.ocupado[i] ? "e" : "+";
        fila += c;
      }
      console.log(String(y).padStart(2, " "), fila);
    }
    console.log(`Aterrizaje sugerido desde (2,2): ${JSON.stringify(celdaDeAterrizaje(malla, 2, 2))}`);
    return;
  }

  const detalles = [];
  const planes = new Map();          // "mapId|nombre del evento" → [x, y] nuevo
  let validos = 0, corregidos = 0, sinArreglo = 0, mapasTocados = new Set();
  const porCausa = {
    "fuera-de-rango": 0, "pared": 0, "ocupada-por-evento-solido": 0,
    "bolsillo-aislado": 0, "ocupada-por-evento": 0, "mapa-ausente": 0,
  };
  const porCampania = new Map();

  for (const warp of warps) {
    const malla = mallaPara(warp.destino);
    const cuenta = porCampania.get(warp.campaign) ?? { total: 0, validos: 0, corregidos: 0 };
    cuenta.total += 1;
    if (!malla) {
      porCausa["mapa-ausente"] += 1; sinArreglo += 1;
      detalles.push({ ...sinObjeto(warp), causa: "mapa-ausente" });
      porCampania.set(warp.campaign, cuenta);
      continue;
    }
    if (esValida(malla, warp.x, warp.y)) {
      validos += 1; cuenta.validos += 1;
      porCampania.set(warp.campaign, cuenta);
      continue;
    }
    let causa = "pared";
    if (!dentro(malla, warp.x, warp.y)) causa = "fuera-de-rango";
    else {
      const i = indice(malla, warp.x, warp.y);
      if (malla.pasable[i] === 0) causa = "pared";
      else if (malla.solido[i] === 1) causa = "ocupada-por-evento-solido";
      else if (malla.comp[i] !== malla.regionId) causa = "bolsillo-aislado";
      else if (malla.tacto[i] === 1) causa = "ocupada-por-evento-con-disparo";
      else causa = "válida";
    }
    const destino = celdaDeAterrizaje(malla, warp.x, warp.y);
    const registro = { ...sinObjeto(warp), causa, anterior: [warp.x, warp.y], nuevo: destino };
    if (!destino) {
      sinArreglo += 1;
      detalles.push(registro);
      porCampania.set(warp.campaign, cuenta);
      continue;
    }
    corregidos += 1; cuenta.corregidos += 1;
    porCausa[causa] += 1;
    detalles.push(registro);
    if (!DRY && !VERIFY) {
      planes.set(`${warp.mapId}|${warp.evento}`, destino);
      mapasTocados.add(warp.mapId);
    }
    porCampania.set(warp.campaign, cuenta);
  }

  const aplicados = (!DRY && !VERIFY && mapasTocados.size) ? aplicar(mapasTocados, planes) : 0;

  const resumen = {
    warps: warps.length,
    esperados: PLAN.totals.warps,
    destinosUnicos: mallas.size,
    validosYa: validos,
    corregidos,
    sinArreglo,
    mapasModificados: mapasTocados.size,
    causas: porCausa,
    comandosEscritos: aplicados,
  };

  if (VERIFY) {
    const check = makeChecker("Warps de campaña sobre celdas transitables");
    check.ok(warps.length === PLAN.totals.warps,
      `se esperaban ${PLAN.totals.warps} warps y se han leído ${warps.length}`);
    check.ok(sinArreglo === 0, `${sinArreglo} warps sin destino transitable posible`);
    check.ok(corregidos === 0, `${corregidos} warps siguen sin aterrizar en celda transitable`);
    if (fs.existsSync(REPORT_PATH)) {
      const previo = JSON.parse(fs.readFileSync(REPORT_PATH, "utf8"));
      check.ok(previo.resumen?.warps === warps.length,
        "el censo guardado no está al día: regenera con npm run rom:warps");
      check.ok(previo.resumen?.sinArreglo === 0, "el censo guardado deja warps sin arreglo");
    }
    check.done();
    console.log(`  · ${warps.length} warps · ${validos} ya válidos · ${corregidos} por corregir · ${mallas.size} mapas de destino`);
    return resumen;
  }

  const aterrizajes = new Map();
  for (const d of detalles) {
    if (!d.nuevo) continue;
    const malla = mallaPara(d.destino);
    if (!malla) continue;
    const n = vecinosLibres(malla, d.nuevo[0], d.nuevo[1]);
    const clave = `con ${n} salidas`;
    aterrizajes.set(clave, (aterrizajes.get(clave) ?? 0) + 1);
  }
  const calidad = [...aterrizajes.entries()].sort().map(([clave, n]) => ({ clave, n }));

  const informe = {
    esquema: "rom_campaign_warp_targets/1.0",
    generadoPor: "tools/apply_rom_campaign_warp_targets.mjs",
    modo: DRY ? "dry-run" : "aplicado",
    regla: [
      "Todo warp de campaña aterriza en una celda del mapa de destino que sea",
      "transitable en las cuatro direcciones y que pertenezca a la misma región",
      "conexa que el retorno libre de ese mapa —o, si el retorno queda aislado,",
      "a la región con más celdas de aterrizaje—. En los mapas que la ROM pinta",
      "como muro entero se admite caer sobre la celda de un evento de botón de",
      "acción: es el único suelo que existe allí.",
    ].join(" "),
    resumen,
    porCampania: [...porCampania.entries()].map(([id, valor]) => ({ campania: id, ...valor })),
    calidadAterrizaje: calidad,
    destinos: [...mallas.values()].filter(Boolean).map((malla) => ({
      mapId: malla.mapId,
      celdas: `${malla.width}×${malla.height}`,
      libres: malla.libres,
      regiones: malla.regiones,
      regionElegida: malla.regionElegida,
      regionTamano: malla.regionTamano,
      celdasLibres: malla.celdas.length,
      celdasConEvento: malla.celdasConEvento.length,
    })),
    corregidos: detalles.filter((d) => d.nuevo).slice(0, 400),
    sinArreglo: detalles.filter((d) => !d.nuevo),
  };
  // Si esta ejecución no ha tenido que corregir nada (la herramienta es
  // idempotente), el censo conserva el bloque de la última vez que sí cambió
  // algo: así el informe sigue contando qué se arregló y no un "0" vacío.
  const bloque = {
    resumen,
    porCampania: informe.porCampania,
    calidadAterrizaje: calidad,
    ejemplos: detalles.filter((d) => d.nuevo).slice(0, 12),
  };
  informe.ultimaCorreccion = resumen.corregidos > 0 ? bloque : (previo?.ultimaCorreccion ?? bloque);
  if (!DRY && !VERIFY && aplicados !== corregidos) {
    console.warn(`  ! se esperaban ${corregidos} comandos reescritos y se han escrito ${aplicados}`);
  }
  if (DRY) {
    const colgados = [...new Set(detalles.filter((d) => !d.nuevo).map((d) => d.destino))];
    if (colgados.length) {
      console.log(`Destinos sin celda de aterrizaje (${colgados.length}):`);
      for (const id of colgados.slice(0, 20)) {
        const m = mallaPara(id);
        console.log(`  Map${id}: ${m ? `${m.width}x${m.height} · transitables=${m.libres} · regiones=${m.regiones} · region=${m.regionElegida} (${m.regionTamano}) · libres-en-region=${m.celdas.length}` : "sin mapa"}`);
      }
    }
    console.log("Ejemplos de corrección (mapa de origen → destino: antes → ahora):");
    for (const d of detalles.filter((x) => x.nuevo).slice(0, 10)) {
      console.log(`  Map${d.mapId} → Map${d.destino}: (${d.anterior[0]}, ${d.anterior[1]}) → (${d.nuevo[0]}, ${d.nuevo[1]})  [${d.causa}]`);
    }
  }
  if (!DRY) {
    fs.writeFileSync(REPORT_PATH, `${JSON.stringify(informe, null, 2)}\n`);
    fs.writeFileSync(DOC_PATH, documento(informe));
  }
  console.log(`Warps revisados: ${warps.length} (esperados ${PLAN.totals.warps}) · destinos únicos: ${mallas.size}`);
  console.log(`Ya válidos: ${validos} · corregidos: ${corregidos} · sin arreglo posible: ${sinArreglo}`);
  console.log(`Causas: ${Object.entries(porCausa).filter(([, n]) => n).map(([k, n]) => `${k}=${n}`).join(" ") || "ninguna"}`);
  if (!DRY) {
    console.log(`Mapas modificados: ${mapasTocados.size}`);
    console.log(`→ ${path.relative(ROOT, REPORT_PATH)}`);
    console.log(`→ ${path.relative(ROOT, DOC_PATH)}`);
  }
  return resumen;
}

const sinObjeto = ({ campaign, mapId, evento, destino, x, y }) => ({ campaign, mapId, evento, destino, x, y });

/* ─────────────────────────────── documento ──────────────────────────────── */

function documento(informe) {
  const { resumen, ultimaCorreccion } = informe;
  const aplicada = ultimaCorreccion?.resumen?.corregidos
    ? ultimaCorreccion : { resumen, porCampania: informe.porCampania, calidadAterrizaje: [], ejemplos: [] };
  const veredicto = resumen.corregidos === 0 && resumen.sinArreglo === 0 ? "CUMPLE" : "NO CUMPLE";
  const filasCampania = (aplicada.porCampania ?? [])
    .map((c) => `| ${c.campania} | ${c.total} | ${c.validos} | ${c.corregidos} |`)
    .join("\n");
  const causas = aplicada.resumen?.causas ?? {};
  const filasCausas = Object.entries(causas).filter(([, n]) => n)
    .map(([k, n]) => `| ${k} | ${n} |`).join("\n") || "| — | 0 |";
  const ejemplos = (aplicada.ejemplos ?? []).slice(0, 12)
    .map((d) => `| Map${d.mapId} · ${d.evento.replace(`${MARKER} `, "")} | Map${d.destino} | (${d.anterior[0]}, ${d.anterior[1]}) | (${d.nuevo[0]}, ${d.nuevo[1]}) | ${d.causa} |`)
    .join("\n");
  const filasCalidad = (aplicada.calidadAterrizaje ?? [])
    .map((c) => `| ${c.clave} | ${c.n} |`).join("\n");
  const pendientes = informe.sinArreglo?.length
    ? informe.sinArreglo.map((d) => `- Map${d.mapId} → Map${d.destino} (${d.x}, ${d.y}): ${d.causa}`).join("\n")
    : "- Ninguno: los 5.061 warps aterrizan en celda transitable.";

  return `# Warps de campaña sobre celdas transitables

> Regla: **ningún warp de campaña puede aterrizar en una pared.** Todos los
> enlaces reconstruidos de las ROMs invitadas dejan al jugador sobre una celda
> transitable en las cuatro direcciones y perteneciente a la misma región conexa
> que el retorno libre del mapa de destino —o, si ese retorno queda aislado, a
> la región con más celdas de aterrizaje—. En los pocos mapas que la ROM pinta
> como muro entero se admite caer sobre la celda de un evento de botón de
> acción: es el único suelo que existe allí.
>
> Generado por \`tools/apply_rom_campaign_warp_targets.mjs\`
> (regenerar con \`npm run rom:warps\`; comprobar con \`npm run verify:rom:warps\`).

## 1. Estado medido

| Dato | Valor |
|---|---:|
| Warps instalados revisados | ${resumen.warps} |
| Warps esperados según el plano | ${resumen.esperados} |
| Mapas de destino distintos | ${resumen.destinosUnicos} |
| Warps que aterrizan en celda transitable | ${resumen.validosYa} |
| Warps que apuntan a pared o a una región aislada | ${resumen.corregidos} |
| Warps sin arreglo posible | ${resumen.sinArreglo} |

Veredicto: **${veredicto}** · ${resumen.validosYa}/${resumen.warps} warps sobre suelo pisable.

## 2. Corrección aplicada

Última ejecución que tuvo que cambiar algo (la herramienta es idempotente: si
vuelve a correr sobre mapas ya corregidos no reescribe nada).

| Dato | Valor |
|---|---:|
| Warps que ya aterrizaban bien | ${aplicada.resumen?.validosYa ?? 0} |
| Warps corregidos | ${aplicada.resumen?.corregidos ?? 0} |
| Comandos de transferencia reescritos | ${aplicada.resumen?.comandosEscritos ?? 0} |
| Mapas reescritos | ${aplicada.resumen?.mapasModificados ?? 0} |
| Warps sin arreglo posible | ${aplicada.resumen?.sinArreglo ?? 0} |

## 3. Por campaña

| Campaña | Warps | Ya válidos | Corregidos |
|---|---:|---:|---:|
${filasCampania || "| — | 0 | 0 | 0 |"}

## 4. Por qué fallaban

| Causa | Warps |
|---|---:|
${filasCausas}

El origen es conocido: el compilador estructural
(\`tools/apply_complete_rom_campaigns.mjs\`) reserva la celda (2, 2) de cada mapa
compilado y manda todos los warps a esa celda, porque en su propio pintor el
suelo entero es transitable. La reconstrucción 1:1 de las ROMs
(\`tools/rom_nativo_mapas.mjs\`) repinta después esos mismos mapas célula a
célula como la ROM —con sus muros— y sólo reabre las celdas que ocupa un
evento. (2, 2) no tiene evento, así que volvió a ser muro en buena parte de los
mapas.

La corrección no toca ni un tile: reescribe el comando de transferencia (código
201) de cada warp para que apunte a la celda válida más cercana a la que pedía.

## 5. Ejemplos de corrección

| Warp | Destino | Antes | Ahora | Causa |
|---|---|---|---|---|
${ejemplos || "| — | — | — | — | — |"}

## 6. Calidad del aterrizaje

Salidas transitables que tiene la celda elegida en cada warp corregido:

| Salidas | Warps |
|---|---:|
${filasCalidad || "| — | 0 |"}

Las celdas sin salida son los mapas que la ROM pinta como muro entero: allí no
existe ningún suelo más que la celda del propio evento, así que el jugador cae
sobre ella y sale con el botón de acción. Las de una sola salida son los
callejones de un tile de ancho que también vienen de la geometría original de la
ROM: se pisa suelo, aunque sea estrecho.

## 7. Pendientes

${pendientes}

## 8. Cómo se comprueba

\`\`\`bash
npm run rom:warps         # corrige y regenera este informe
npm run verify:rom:warps  # falla si algún warp apunta a una pared
\`\`\`

La comprobación va después de \`npm run build:rom:campaigns\` y de
\`npm run rom:nativo:mapas\`, porque mide la geometría que deja instalada la
reconstrucción 1:1.

Ya cuelga de \`npm run verify:all\` (justo detrás de
\`npm run verify:rom:campaigns\`). Si algún día se recompilan las campañas desde
cero, los warps volverán a apuntar a (2, 2): la verificación lo detectará y
\`npm run rom:warps\` lo dejará como estaba, porque la herramienta es idempotente.
`;
}

main();
