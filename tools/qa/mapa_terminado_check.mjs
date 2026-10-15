#!/usr/bin/env node
/**
 * mapa_terminado_check.mjs — ¿está TERMINADO un mapa?
 *
 * Responde, mapa por mapa, a las cinco preguntas de la definición de terminado
 * (docs/qa/mapa_terminado.md) contra los datos compilados del juego:
 *
 *   1. TRANSITABLE      existe el archivo, el tileset tiene nombre y la entrada
 *                       pisa una celda por la que se puede caminar.
 *   2. SIN HUÉRFANAS    las celdas alcanzables desde la entrada son (casi) todas
 *                       las transitables: cuenta huérfanas y regiones aisladas
 *                       con el mismo movimiento del motor (direcciones + hielo)
 *                       y vigila que ninguna salida quede en una zona aislada.
 *   3. CON ENCUENTROS   si el mapa es zona salvaje declarada (los catálogos de
 *                       encuentros del repo) exige su tabla `<id>_0` con
 *                       especies y niveles válidos; también vale implementarlos
 *                       por evento (`pbWildBattle`). Si no es zona salvaje,
 *                       exige una exención declarada con su motivo.
 *   4. CON MÚSICA       el BGM del mapa existe en Audio/BGM, o el mapa hereda la
 *                       música (`@autoplay_bgm` apagado: el idioma del motor), o
 *                       el silencio está declarado y citado.
 *   5. CON ENTRADA Y SALIDA
 *                       el mapa es destino de una transferencia real (o raíz
 *                       declarada) y tiene al menos una salida a otro mapa.
 *
 * Tres grados de resultado por mapa:
 *   ✔ terminado            las cinco condiciones se cumplen.
 *   ⏳ pendiente declarado  una condición no se cumple y el registro lo declara
 *                          como pendiente con su cita (la cita se verifica).
 *   ✘ fallo                cualquier otra cosa: rompe la corrida.
 *
 * Uso:
 *   node tools/qa/mapa_terminado_check.mjs                 # anillo A (mapas del plan)
 *   node tools/qa/mapa_terminado_check.mjs --mapa 2072     # ficha de un mapa
 *   node tools/qa/mapa_terminado_check.mjs --fichas        # datos crudos del anillo A
 *   node tools/qa/mapa_terminado_check.mjs --censo         # mide TODOS los mapas
 *   node tools/qa/mapa_terminado_check.mjs --censo --json  # y resume en JSON
 *
 * `--censo` escribe content/mapa_terminado_censo.json (resumen + lista de
 * trabajo, sólo los mapas que fallan algo) y falla si algún contador empeora
 * respecto de la línea base declarada en el registro.
 */
import fs from "node:fs";
import path from "node:path";
import { marshalLoad } from "../../web/js/marshal.js";
import { parseMap } from "../../web/js/rmxp.js";
import { passabilityOf, reachableCells, tilesets } from "../lib/map_painter.mjs";
import { ROOT, DATA, GAME, txt, mapFile, readMap } from "../lib/dn_rmxp.mjs";

const REGISTRO = path.join(ROOT, "content", "mapa_terminado.json");
const CENSO = path.join(ROOT, "content", "mapa_terminado_censo.json");
const ARGS = process.argv.slice(2);
const B = {
  json: ARGS.includes("--json"),
  censo: ARGS.includes("--censo"),
  fichas: ARGS.includes("--fichas"),
  mapa: ARGS.includes("--mapa") ? Number(ARGS[ARGS.indexOf("--mapa") + 1]) : null,
};
const CONDICIONES = ["transitable", "huerfanas", "encuentros", "musica", "entrada_salida"];
const NOMBRES = {
  transitable: "transitable", huerfanas: "sin huérfanas", encuentros: "con encuentros",
  musica: "con música", entrada_salida: "con entrada y salida",
};

const json = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const registro = json(REGISTRO);
const citaOk = (fuente) =>
  !!fuente && fs.existsSync(path.join(ROOT, fuente.ruta)) &&
  fs.readFileSync(path.join(ROOT, fuente.ruta), "utf8").includes(fuente.busca);
const cubre = (entrada, id) =>
  entrada.rango ? id >= Number(entrada.rango[0]) && id <= Number(entrada.rango[1]) : Number(entrada.mapa) === id;
const exento = (lista, id) => (registro.exenciones?.[lista] ?? []).find((e) => cubre(e, id));

const pendiente = (condicion, id) =>
  (registro.pendientes ?? []).find((p) => p.condicion === condicion &&
    ((p.mapas ?? []).map(Number).includes(id) || (p.rango && cubre(p, id))));

// ------------------------------------------------------------------ recursos
const infos = (() => {
  const raw = marshalLoad(fs.readFileSync(path.join(DATA, "MapInfos.rxdata")));
  const map = new Map();
  for (const [id, info] of raw.pairs) map.set(Number(id), { nombre: txt(info.getIvar("@name")), padre: info.getIvar("@parent_id") });
  return map;
})();

/** Lo que la métrica de mundos (fase 2) promete que se alcanza en cada mapa. */
const promesas = (() => {
  const porMapa = new Map();
  const p = path.join(ROOT, "content", "metrica_dimensiones.json");
  if (!fs.existsSync(p)) return porMapa;
  for (const mundo of json(p).mundos ?? []) {
    const anota = (mapa, que, evento, mundo_) => {
      const id = Number(mapa);
      if (!infos.has(id)) return;
      if (!porMapa.has(id)) porMapa.set(id, []);
      porMapa.get(id).push({ que, evento, mundo: mundo_ });
    };
    if (mundo.jefe?.evento) anota(mundo.jefe.mapa, "jefe", mundo.jefe.evento, mundo.nombre);
    for (const r of mundo.retornos ?? []) anota(r.mapa, "salida", r.evento, mundo.nombre);
  }
  return porMapa;
})();

const sinExt = (nombre) => String(nombre).replace(/\.[a-z0-9]+$/i, "");
const setDir = (dir) => new Set(fs.readdirSync(path.join(GAME, "Audio", dir)).map(sinExt));
const BGM = setDir("BGM");
const BGS = setDir("BGS");
const existeAudio = (set, nombre) => !!nombre && (set.has(nombre) || set.has(sinExt(nombre)));

const species = (() => {
  const out = new Set();
  const td = new TextDecoder();
  for (const [k] of marshalLoad(fs.readFileSync(path.join(DATA, "species.dat")))?.pairs ?? []) {
    if (k?.bytes) out.add(td.decode(k.bytes));
    else if (k?.name || k?.text) out.add(k.name ?? k.text);
  }
  return out;
})();

/** encounters.dat → por mapa: slots disponibles y la tabla del slot 0. */
const encounters = (() => {
  const raw = marshalLoad(fs.readFileSync(path.join(DATA, "encounters.dat")));
  const porMapa = new Map();
  for (const [k, v] of raw.pairs) {
    const m = /^(\d+)_(\d+)$/.exec(String(k?.name ?? k?.text ?? k));
    if (!m) continue;
    const id = Number(m[1]), slot = Number(m[2]);
    if (!porMapa.has(id)) porMapa.set(id, { slots: [], tablas: new Map() });
    const e = porMapa.get(id);
    if (!e.slots.includes(slot)) e.slots.push(slot);
    e.tablas.set(slot, v);
  }
  return porMapa;
})();

/** Zonas salvajes declaradas por los catálogos del repo. */
const zonasSalvajes = (() => {
  const out = new Map();
  for (const [rel, claves] of [["content/wild_zones.json", ["zonas", "zones"]], ["content/glazed_wild_encounters.json", ["zonas", "zones"]]]) {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) continue;
    const data = json(p);
    for (const z of claves.map((k) => data[k]).find(Array.isArray) ?? []) {
      out.set(Number(z.mapId), { catalogo: rel, etiqueta: z.label ?? z.nombre ?? "" });
    }
  }
  return out;
})();

/** Un barrido de todos los mapas: entradas, salidas y música declarada. */
const barrido = (() => {
  const entradas = new Map(), salidas = new Map(), musica = new Map(), salvajes = new Map();
  for (const id of infos.keys()) {
    if (!fs.existsSync(path.join(DATA, mapFile(id)))) continue;
    const raw = readMap(id);
    musica.set(id, {
      bgm: txt(raw.getIvar("@bgm")?.getIvar("@name")),
      bgs: txt(raw.getIvar("@bgs")?.getIvar("@name")),
      autoplay: raw.getIvar("@autoplay_bgm"),
    });
    let n = 0;
    const destinos = [];
    for (const [, ev] of raw.getIvar("@events")?.pairs ?? []) {
      for (const page of ev.getIvar("@pages") ?? []) {
        for (const c of page.getIvar("@list") ?? []) {
          if (c.getIvar("@code") === 201) {
            const p = (c.getIvar("@parameters") ?? []).map(txt);
            const destino = Number(p[1]);
            if (destino && destino !== id) {
              if (!entradas.has(destino)) entradas.set(destino, []);
              entradas.get(destino).push({ desde: id, x: Number(p[2]), y: Number(p[3]) });
              destinos.push({ destino, evento: txt(ev.getIvar("@name")) });
            }
          } else if (/pbWildBattle|WildBattleCore/.test((c.getIvar("@parameters") ?? []).map(txt).join(" "))) n++;
        }
      }
    }
    salidas.set(id, destinos);
    if (n) salvajes.set(id, n);
  }
  return { entradas, salidas, musica, salvajes };
})();

// ------------------------------------------------------------------ medida de un mapa
function medirMapa(id) {
  const f = {
    id, nombre: infos.get(id)?.nombre ?? `(Map${id} sin ficha)`,
    archivo: fs.existsSync(path.join(DATA, mapFile(id))),
    datos: {}, fallos: {}, pendientes: [], avisos: [],
  };
  for (const c of CONDICIONES) f.fallos[c] = [];
  if (!f.archivo) {
    f.fallos.transitable.push("no existe el archivo del mapa");
    return finalizar(f);
  }

  const raw = readMap(id);
  const parsed = parseMap(raw);
  const ts = tilesets().get(parsed.tilesetId);
  const pass = passabilityOf(parsed, parsed.tilesetId);
  f.datos.tamano = `${parsed.width}×${parsed.height}`;
  f.datos.tileset = `${parsed.tilesetId} ${ts?.name ?? "(SIN NOMBRE)"}`;

  const eventos = (raw.getIvar("@events")?.pairs ?? []).map(([, ev]) => ({
    nombre: txt(ev.getIvar("@name")), x: ev.getIvar("@x"), y: ev.getIvar("@y"),
    // toque al jugador (1) o botón de acción (0): desde una celda vecina también se alcanza.
    // Autorun (3) y paralelo (4) se ejecutan solos: su celda no decide nada.
    toque: (ev.getIvar("@pages") ?? []).some((p) => [0, 1].includes(Number(p.getIvar("@trigger")))) ||
      (ev.getIvar("@pages") ?? []).every((p) => [3, 4].includes(Number(p.getIvar("@trigger")))),
    sprite: (ev.getIvar("@pages") ?? []).some((p) => txt(p.getIvar("@graphic")?.getIvar("@character_name")) !== ""),
    transfiere: (ev.getIvar("@pages") ?? []).some((p) => (p.getIvar("@list") ?? []).some((c) => c.getIvar("@code") === 201)),
    salvaje: (ev.getIvar("@pages") ?? []).some((p) => (p.getIvar("@list") ?? []).some((c) =>
      /pbWildBattle|WildBattleCore/.test((c.getIvar("@parameters") ?? []).map(txt).join(" ")))),
    textoSalvaje: (ev.getIvar("@pages") ?? []).flatMap((p) => (p.getIvar("@list") ?? [])
      .map((c) => (c.getIvar("@parameters") ?? []).map(txt).join(" "))
      .filter((t) => /pbWildBattle|WildBattleCore/.test(t))).join("\n"),
  }));

  // ---- 1. transitable
  const walkable = [];
  for (let y = 0; y < parsed.height; y++) for (let x = 0; x < parsed.width; x++) if (pass.passable(x, y, 8)) walkable.push([x, y]);
  const entrantes = barrido.entradas.get(id) ?? [];
  const declarada = registro.entradas?.[String(id)];
  // Llegadas: la declarada, o TODAS las transferencias que traen al jugador (una sola ya no
  // decide la medida: en el juego base un mapa se entra por varias puertas).
  const llegadas = [];
  if (declarada) llegadas.push([declarada[0], declarada[1]]);
  else for (const e of entrantes) if (!llegadas.some((c) => c[0] === e.x && c[1] === e.y)) llegadas.push([e.x, e.y]);
  const llegadasValidas = llegadas.filter((c) => pass.passable(c[0], c[1], 8));
  let entrada = llegadasValidas[0] ?? null;
  if (!entrada) {
    let mejor = null, mejorD = Infinity;
    for (const [x, y] of walkable) {
      const d = Math.abs(x - Math.floor(parsed.width / 2)) + Math.abs(y - (parsed.height - 2));
      if (d < mejorD) { mejorD = d; mejor = [x, y]; }
    }
    if (llegadas.length) f.avisos.push(`las llegadas instaladas (${llegadas.map((c) => c.join(",")).join(" ")}) no son transitables; se midió desde ${(mejor ?? [0, 0]).join(",")}`);
    entrada = mejor ?? [0, 0];
  }
  f.datos.entrada = `${entrada.join(",")}${llegadasValidas.length > 1 ? ` (+${llegadasValidas.length - 1} más)` : ""}`;
  f.datos.transitables = walkable.length;
  if (!ts || !ts.name) f.fallos.transitable.push(`tileset #${parsed.tilesetId} sin nombre: el mapa entra en negro`);
  if (walkable.length === 0) f.fallos.transitable.push("no hay ninguna celda transitable");
  else if (!pass.passable(entrada[0], entrada[1], 8)) f.fallos.transitable.push(`la entrada (${entrada.join(",")}) pisa una celda sólida`);

  // ---- 2. sin celdas huérfanas (movimiento del motor: direcciones + hielo)
  const desdeEntrada = new Set();
  for (const celda of (llegadasValidas.length ? llegadasValidas : [entrada])) {
    const alcanza = reachableCells(pass, celda);
    for (const c of alcanza) desdeEntrada.add(c);
  }
  const visitado = new Set(desdeEntrada);
  const regiones = [];
  for (const [x, y] of walkable) {
    const k = `${x},${y}`;
    if (visitado.has(k)) continue;
    const comp = reachableCells(pass, [x, y]);
    for (const c of comp) visitado.add(c);
    regiones.push(comp.size);
  }
  const ratio = walkable.length ? desdeEntrada.size / walkable.length : 1;
  const alcanzables = (celda) => desdeEntrada.has(`${celda[0]},${celda[1]}`);
  /** Alcanzable = se pisa la celda, o el evento es de toque y hay una celda alcanzable al lado. */
  const alcanzableEvento = (ev) => alcanzables([ev.x, ev.y]) ||
    (ev.toque && [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => alcanzables([ev.x + dx, ev.y + dy])));
  f.datos.alcanzables = desdeEntrada.size;
  f.datos.huerfanas = walkable.length - desdeEntrada.size;
  f.datos.regiones_aisladas = regiones.length;
  f.datos.bfs = Number(ratio.toFixed(3));
  // lo que bloquea: que haya algo que el jugador no pueda alcanzar desde la llegada
  const fuera = eventos.filter((e) => !alcanzableEvento(e));
  const fueraConTransferencia = fuera.filter((e) => e.transfiere);
  const fueraConSprite = fuera.filter((e) => e.sprite);
  const prometido = promesas.get(id) ?? [];
  const prometidoFuera = prometido.filter((p) => {
    const e = eventos.find((x) => x.nombre === p.evento);
    return !e || !alcanzableEvento(e);
  });
  if (fueraConTransferencia.length) {
    f.fallos.huerfanas.push(`salidas inalcanzables desde la llegada: ${fueraConTransferencia.slice(0, 3).map((e) => `${e.nombre}(${e.x},${e.y})`).join(", ")}`);
  }
  for (const p of prometidoFuera) {
    f.fallos.huerfanas.push(`${p.que} «${p.evento}» del mundo «${p.mundo}» no se alcanza desde la llegada`);
  }
  if (fueraConSprite.length) {
    f.avisos.push(`${fueraConSprite.length} evento(s) con gráfico fuera de la zona alcanzable`);
  }
  if (f.datos.huerfanas > 0) {
    const vacias = f.datos.huerfanas;
    const conContenido = new Set([...fueraConSprite, ...fueraConTransferencia].map((e) => `${e.x},${e.y}`)).size;
    f.avisos.push(`${vacias} celdas huérfanas en ${regiones.length} regiones (BFS ${(ratio * 100).toFixed(0)} %), con contenido en ${conContenido} de ellas`);
  }

  // ---- 3. encuentros
  const tabla = encounters.get(id);
  const zona = zonasSalvajes.get(id);
  const exentoEnc = exento("sin_encuentros", id);
  const porEvento = eventos.filter((e) => e.salvaje);
  if (tabla?.tablas.has(0)) {
    const tipos = tabla.tablas.get(0).getIvar("@types");
    const slots = (tipos?.pairs ?? []).flatMap(([, lista]) => lista ?? []);
    const malos = [];
    for (const [peso, sp, min, max] of slots) {
      const nombre = sp?.name ?? sp?.text ?? String(sp);
      if (!species.has(nombre)) malos.push(`especie desconocida ${nombre}`);
      if (!(peso > 0)) malos.push(`peso ${peso} inválido para ${nombre}`);
      if (!(Number(min) >= 1 && Number(min) <= Number(max))) malos.push(`niveles ${min}–${max} inválidos para ${nombre}`);
      if (Number(max) > (registro.exenciones?.techo_nivel ?? 175)) malos.push(`${nombre} en nivel ${max}, por encima del techo ${registro.exenciones?.techo_nivel ?? 175}`);
    }
    f.datos.encuentros = `${slots.length} slots · slots ${tabla.slots.join("/")}${zona ? ` · zona «${zona.etiqueta}»` : ""}`;
    if (slots.length === 0) f.fallos.encuentros.push("la tabla de encuentros no tiene ningún slot");
    if (malos.length) f.fallos.encuentros.push(`tabla de encuentros inválida: ${[...new Set(malos)].slice(0, 3).join(", ")}`);
    if (!zona) f.avisos.push("tiene tabla de encuentros pero no figura en ningún catálogo de zonas salvajes");
  } else if (porEvento.length) {
    const especies = [...new Set(porEvento.flatMap((e) => e.textoSalvaje.match(/:([A-Z][A-Z0-9_]*)/g) ?? [])
      .map((x) => x.slice(1)))]
      .filter((n) => !/^(FALSE|TRUE|NIL|NONE)$/.test(n) && (!species.size || species.has(n)));
    f.datos.encuentros = `por evento: ${porEvento.length} evento(s) con combate salvaje interactivo (${porEvento.map((e) => e.nombre).slice(0, 3).join(", ")})${especies.length ? ` · especies ${especies.slice(0, 4).join(", ")}` : ""}`;
  } else if (zona) {
    f.datos.encuentros = `debería tenerla: es zona salvaje de ${zona.catalogo} («${zona.etiqueta}»)`;
    f.fallos.encuentros.push(`zona salvaje declarada en ${zona.catalogo} pero sin tabla Map${id}_0 ni evento de combate salvaje`);
  } else if (exentoEnc) {
    const ok = exentoEnc.fuente ? citaOk(exentoEnc.fuente) : true;
    f.datos.encuentros = `exento: ${exentoEnc.motivo}${ok ? "" : " (CITA NO ENCONTRADA)"}`;
    if (!ok) f.fallos.encuentros.push(`la exención de encuentros cita ${exentoEnc.fuente.ruta}, donde no aparece «${exentoEnc.fuente.busca}»`);
    if ((exentoEnc.motivo ?? "").length < 20) f.fallos.encuentros.push("la exención de encuentros no explica el motivo (mínimo 20 caracteres)");
  } else {
    f.fallos.encuentros.push("no tiene tabla de encuentros ni combate salvaje por evento, y no está declarado como exento");
  }

  // ---- 4. música
  const bgm = txt(raw.getIvar("@bgm")?.getIvar("@name"));
  const bgs = txt(raw.getIvar("@bgs")?.getIvar("@name"));
  const autoplay = raw.getIvar("@autoplay_bgm");
  const exentoMus = exento("sin_musica", id);
  f.datos.bgm = bgm || "(vacío)";
  f.datos.autoplay_bgm = autoplay;
  if (bgm && bgm !== "(OFF)" && existeAudio(BGM, bgm)) {
    if (autoplay === false) f.avisos.push("declara BGM propia con autoplay apagado: no sonará al entrar");
  } else if (!bgm && autoplay === false) {
    f.datos.bgm = "(vacío) · música heredada del mapa anterior (autoplay apagado)";
  } else if (exentoMus && citaOk(exentoMus.fuente)) {
    f.datos.bgm = `${bgm || "(vacío)"} · silencio declarado: ${exentoMus.motivo}`;
  } else if (exentoMus) {
    f.fallos.musica.push(exentoMus.fuente
      ? `la exención de música cita ${exentoMus.fuente.ruta}, donde no aparece «${exentoMus.fuente.busca}»`
      : "la exención de música no cita la fuente del silencio (obligatoria)");
  } else {
    f.fallos.musica.push(`BGM «${bgm || "(vacío)"}» sin archivo en Audio/BGM, sin herencia y sin silencio declarado`);
  }
  if (bgs && bgs !== "(OFF)" && !existeAudio(BGS, bgs)) f.avisos.push(`BGS «${bgs}» sin archivo en Audio/BGS`);

  // ---- 5. entrada y salida
  const salidas = barrido.salidas.get(id) ?? [];
  f.datos.transferencias = `${entrantes.length} entradas · ${salidas.length} salidas`;
  if (!entrantes.length && !(registro.exenciones?.raices ?? []).includes(id)) {
    f.fallos.entrada_salida.push("ninguna transferencia del juego llega a este mapa (no tiene entrada)");
  }
  if (!salidas.length) f.fallos.entrada_salida.push("no tiene ninguna salida que transfiera a otro mapa");

  // ---- pendientes declarados: fallo declarado y citado, no oculto
  for (const c of CONDICIONES) {
    if (!f.fallos[c].length) continue;
    const p = pendiente(c, id);
    if (!p) continue;
    if (!citaOk(p.fuente)) {
      f.fallos[c].push(`el pendiente ${p.id} cita ${p.fuente?.ruta}, donde no aparece «${p.fuente?.busca}»`);
      continue;
    }
    f.pendientes.push({ condicion: c, id: p.id, motivo: p.motivo, detalle: f.fallos[c].join(" · ") });
    f.fallos[c] = [];
  }
  return finalizar(f);
}

function finalizar(f) {
  for (const c of CONDICIONES) f[c] = f.fallos[c].length === 0;
  f.totalFallos = CONDICIONES.reduce((n, c) => n + f.fallos[c].length, 0);
  f.completo = f.totalFallos === 0 && f.pendientes.length === 0;
  return f;
}

// ------------------------------------------------------------------ hallazgos del registro
function revisarHallazgos() {
  const salida = [];
  for (const h of registro.hallazgos ?? []) {
    const v = h.verificacion ?? {};
    let estado = "no_comprobable", detalle = "tipo de verificación sin implementar", muestras = [];
    if (v.tipo === "audio_roto_en_el_juego") {
      const roto = [...barrido.musica].filter(([, m]) => m.autoplay !== false && m.bgm && m.bgm !== "(OFF)" && !existeAudio(BGM, m.bgm));
      estado = roto.length === Number(v.mapas ?? -1) ? "confirmado" : "sin_confirmar";
      detalle = `${roto.length} mapas del juego con BGM declarada que no existe en Audio/BGM (el registro declara ${v.mapas})`;
      muestras = roto.slice(0, 6).map(([id, m]) => `Map${id} «${m.bgm}»`);
    } else if (v.tipo === "llegadas_sin_contenido") {
      const malas = [];
      for (const [id, lista] of promesas) {
        if (!fs.existsSync(path.join(DATA, mapFile(id)))) continue;
        const raw = readMap(id);
        const parsed = parseMap(raw);
        const pass = passabilityOf(parsed, parsed.tilesetId);
        const entrantes = barrido.entradas.get(id) ?? [];
        if (!entrantes.length) continue;
        const alcanza = reachableCells(pass, [entrantes[0].x, entrantes[0].y]);
        const eventos = (raw.getIvar("@events")?.pairs ?? []).map(([, ev]) => ({
          nombre: txt(ev.getIvar("@name")), x: ev.getIvar("@x"), y: ev.getIvar("@y"),
          // toque al jugador (1) o botón de acción (0): desde una celda vecina también se alcanza.
    // Autorun (3) y paralelo (4) se ejecutan solos: su celda no decide nada.
    toque: (ev.getIvar("@pages") ?? []).some((p) => [0, 1].includes(Number(p.getIvar("@trigger")))) ||
      (ev.getIvar("@pages") ?? []).every((p) => [3, 4].includes(Number(p.getIvar("@trigger")))),
        }));
        const alcanzaEvento = (e) => !!e && (alcanza.has(`${e.x},${e.y}`) ||
          (e.toque && [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => alcanza.has(`${e.x + dx},${e.y + dy}`))));
        const fuera = lista.filter((p) => !alcanzaEvento(eventos.find((e) => e.nombre === p.evento)));
        const jefeFuera = fuera.some((p) => p.que === "jefe");
        if (jefeFuera) malas.push({ id, fuera });
      }
      const declaradas = (v.mapas ?? []).map(Number).sort((a, b) => a - b);
      estado = malas.length === declaradas.length && malas.every((m, i) => m.id === declaradas[i]) ? "confirmado" : "sin_confirmar";
      detalle = `${malas.length} mapas del plan llegan a una zona desde la que no se alcanza el jefe (el registro declara ${declaradas.length})`;
      muestras = malas.map((m) => `Map${m.id}: ${m.fuera.map((p) => `${p.que} «${p.evento}»`).join(", ")}`);
    } else if (v.tipo === "salvajes_en_docs") {
      const mapa = new Set();
      const carpeta = path.join(ROOT, v.docs);
      for (const archivo of fs.readdirSync(carpeta).filter((x) => x.endsWith(".md"))) {
        for (const linea of fs.readFileSync(path.join(carpeta, archivo), "utf8").split("\n")) {
          if (!/salvaj|encuentro/i.test(linea)) continue;
          for (const m of linea.matchAll(/\b(2[01]\d\d)\b/g)) {
            const id = Number(m[1]);
            if (id >= 2041 && id <= 2190) mapa.add(id);
          }
        }
      }
      const declarados = [...mapa].sort((a, b) => a - b);
      const esperados = (v.mapas ?? []).map(Number).sort((a, b) => a - b);
      const implementados = declarados.filter((id) => (encounters.get(id)?.tablas.has(0) ?? false) || barrido.salvajes.has(id));
      const iguales = declarados.length === esperados.length && declarados.every((id, i) => id === esperados[i]);
      estado = iguales && implementados.length === Number(v.implementados ?? 0) ? "confirmado" : "sin_confirmar";
      detalle = `${declarados.length} mapas del sueño declaran salvajes en las fichas (el registro lista ${esperados.length}) y ${implementados.length} los tienen implementados (el registro dice ${v.implementados})`;
      muestras = declarados.map((id) => `Map${id}`);
    }
    const ok = !h.fuente || citaOk(h.fuente);
    if (!ok) { estado = "sin_confirmar"; detalle += ` · cita no encontrada en ${h.fuente.ruta}`; }
    salida.push({ id: h.id, estado, detalle, muestras });
  }
  return salida;
}

// ------------------------------------------------------------------ alcance
const anilloA = (() => {
  const decl = registro.alcance?.anillo_a ?? {};
  const ids = new Set();
  for (const fuente of decl.fuentes ?? []) {
    const p = path.join(ROOT, fuente);
    if (!fs.existsSync(p)) continue;
    for (const m of json(p).mundos ?? []) for (const id of m.mapas ?? []) ids.add(Number(id));
  }
  for (const id of decl.mapas ?? []) if (infos.has(Number(id))) ids.add(Number(id));
  for (const [a, b] of decl.rangos ?? []) for (let id = Number(a); id <= Number(b); id++) if (infos.has(id)) ids.add(id);
  return [...ids].sort((a, b) => a - b);
})();

const objetivos = B.mapa ? [B.mapa] : B.censo ? [...infos.keys()].sort((a, b) => a - b) : anilloA;
const t0 = Date.now();
const fichas = objetivos.map(medirMapa);
const segundos = Number(((Date.now() - t0) / 1000).toFixed(1));
const hallazgos = revisarHallazgos();
const hallazgosSinConfirmar = hallazgos.filter((h) => h.estado !== "confirmado").map((h) => h.id);
const deudas = (registro.deudas ?? []).map((d) => ({ id: d.id, titulo: d.titulo, cita: d.evidencia?.[0] ? citaOk(d.evidencia[0]) : false }));
const imprimirHallazgos = () => {
  for (const h of hallazgos) console.log(`  hallazgo ${h.id}: ${h.estado} — ${h.detalle}`);
  for (const d of deudas) console.log(`  deuda ${d.id}${d.cita ? "" : " (EVIDENCIA NO ENCONTRADA)"}: ${d.titulo}`);
};

if (B.fichas) {
  for (const f of fichas) {
    console.log(
      `Map${String(f.id).padEnd(5)} ${(f.nombre || "").slice(0, 32).padEnd(32)} ${String(f.datos.tamano ?? "").padEnd(8)} ` +
        `${String(f.datos.transitables ?? 0).padStart(5)} trans  BFS ${String(f.datos.bfs ?? "-").padStart(5)}  ` +
        `enc ${(f.datos.encuentros ?? "-").slice(0, 44).padEnd(44)}  ` +
        `bgm ${(f.datos.bgm ?? "-").slice(0, 26).padEnd(26)} auto ${String(f.datos.autoplay_bgm).padEnd(5)} ${f.datos.transferencias ?? ""}`,
    );
  }
  process.exit(0);
}

if (B.mapa) {
  const f = fichas[0];
  if (B.json) console.log(JSON.stringify(f, null, 2));
  else {
    console.log(`Map${f.id} — ${f.nombre}`);
    for (const [k, v] of Object.entries(f.datos)) console.log(`  ${k.padEnd(18)} ${v}`);
    console.log(`  ${"condiciones".padEnd(18)} ${CONDICIONES.map((c) => `${NOMBRES[c]}=${f[c] ? "✔" : "✘"}`).join("  ")}`);
    for (const p of f.pendientes) console.log(`  PENDIENTE ${p.id} (${NOMBRES[p.condicion]}): ${p.motivo} — ${p.detalle}`);
    for (const c of CONDICIONES) for (const x of f.fallos[c]) console.log(`  FALLO ${NOMBRES[c]}: ${x}`);
    for (const x of f.avisos) console.log(`  aviso ${x}`);
  }
  process.exit(f.totalFallos ? 1 : 0);
}

const resumen = Object.fromEntries(CONDICIONES.map((c) => [c, fichas.filter((f) => f[c]).length]));
const problemas = fichas.filter((f) => f.totalFallos);
const conPendientes = fichas.filter((f) => !f.totalFallos && f.pendientes.length);

if (B.censo) {
  const linea = registro.alcance?.anillo_b?.linea_base ?? null;
  const empeora = linea ? CONDICIONES.filter((c) => resumen[c] < (linea[c] ?? 0)) : [];
  const detalle = {
    fecha: new Date().toISOString().slice(0, 10),
    mapas: fichas.length,
    completos: fichas.filter((f) => f.completo).length,
    con_pendientes_declarados: conPendientes.length,
    por_condicion: resumen,
    porcentaje: Object.fromEntries(CONDICIONES.map((c) => [c, Number(((resumen[c] / fichas.length) * 100).toFixed(1))])),
    linea_base: linea,
    empeora,
    hallazgos: hallazgos.map((h) => ({ id: h.id, estado: h.estado, detalle: h.detalle })),
    lista_de_trabajo: problemas.map((f) => ({ id: f.id, nombre: f.nombre, fallos: f.fallos })),
  };
  fs.writeFileSync(CENSO, `${JSON.stringify(detalle, null, 1)}\n`);
  if (B.json) console.log(JSON.stringify({ ...detalle, lista_de_trabajo: undefined }, null, 2));
  else {
    console.log(`Censo de mapas terminados — ${fichas.length} mapas en ${segundos} s (detalle: content/mapa_terminado_censo.json)`);
    console.log(`  completos (5/5)        ${detalle.completos}/${fichas.length}   · con pendiente declarado: ${conPendientes.length}   · con fallo: ${problemas.length}`);
    for (const c of CONDICIONES) {
      console.log(`  ${NOMBRES[c].padEnd(22)} ${String(resumen[c]).padStart(5)}/${fichas.length}  ${((resumen[c] / fichas.length) * 100).toFixed(1).padStart(5)} %${linea ? `   (base ${linea[c] ?? 0})` : ""}`);
    }
    imprimirHallazgos();
    for (const c of empeora) console.error(`  FALLO regresión: «${NOMBRES[c]}» bajó de ${linea[c]} a ${resumen[c]}`);
  }
  for (const id of hallazgosSinConfirmar) console.error(`  FALLO hallazgo: ${id} no se pudo confirmar con los datos instalados`);
  for (const d of deudas.filter((x) => !x.cita)) console.error(`  FALLO deuda: ${d.id} no cita una fuente que exista y contenga el texto`);
  if (empeora.length || hallazgosSinConfirmar.length || deudas.some((d) => !d.cita)) process.exit(1);
  process.exit(0);
}

if (B.json) {
  console.log(JSON.stringify({
    mapas: fichas.length, por_condicion: resumen, hallazgos,
    pendientes: conPendientes.map((f) => ({ id: f.id, pendientes: f.pendientes })),
    problemas: problemas.map((f) => ({ id: f.id, fallos: f.fallos })), segundos,
  }, null, 2));
  process.exit(problemas.length || hallazgosSinConfirmar.length ? 1 : 0);
}

console.log(`Mapas terminados — anillo A: ${fichas.length} mapas en ${segundos} s (${registro.criterios.map((c) => c.nombre).join(" · ")})`);
console.log("");
for (const f of fichas) {
  const marca = f.totalFallos ? "✘" : f.pendientes.length ? "⏳" : "✔";
  console.log(`  ${marca} Map${String(f.id).padEnd(5)} ${(f.nombre || "").slice(0, 40).padEnd(40)} ${CONDICIONES.map((c) => `${f[c] ? "✔" : "✘"} ${NOMBRES[c]}`).join(" | ")}`);
  for (const p of f.pendientes) console.log(`        PENDIENTE ${p.id} (${NOMBRES[p.condicion]}): ${p.detalle}`);
  for (const c of CONDICIONES) for (const x of f.fallos[c]) console.log(`        FALLO ${NOMBRES[c]}: ${x}`);
  for (const x of f.avisos) console.log(`        aviso ${x}`);
}
console.log("");
console.log(`  anillo A: ${fichas.filter((f) => f.completo).length}/${fichas.length} mapas terminados · ` +
  `${conPendientes.length} con pendiente declarado · ${problemas.length} con fallo`);
imprimirHallazgos();
for (const f of problemas) console.error(`  FALLO Map${f.id}: ${CONDICIONES.flatMap((c) => f.fallos[c]).join(" · ")}`);
for (const id of hallazgosSinConfirmar) console.error(`  FALLO hallazgo: ${id} no se pudo confirmar con los datos instalados`);
for (const d of deudas.filter((x) => !x.cita)) console.error(`  FALLO deuda: ${d.id} no cita una fuente que exista y contenga el texto`);
if (problemas.length || hallazgosSinConfirmar.length || deudas.some((d) => !d.cita)) process.exit(1);
console.log("OK: ningún mapa del anillo A tiene fallo abierto (los pendientes declarados van listados arriba con su cita)");
