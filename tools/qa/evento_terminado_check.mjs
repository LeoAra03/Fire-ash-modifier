#!/usr/bin/env node
/**
 * evento_terminado_check.mjs — ¿está TERMINADO un evento?
 *
 * Responde, evento por evento, a las cuatro preguntas de la definición de
 * terminado (docs/qa/evento_terminado.md) contra los datos compilados:
 *
 *   1. DIÁLOGO REVISADO   el texto que el jugador lee (cajas 101/401 y mensajes
 *                         por script) no lleva notas de desarrollo, ni marcas de
 *                         relleno, ni metagame, y está bien formado.
 *   2. FLAG DE UNA SOLA ESCRITURA
 *                         cada switch de progreso que escribe el evento se
 *                         enciende en un solo sitio del juego, no se apaga en
 *                         ninguno y tiene nombre propio en System.rxdata.
 *   3. TEXTO EN DOS LÍNEAS DE CAJA
 *                         el texto está maquetado para la caja real del motor
 *                         (2 líneas × 53 columnas): ninguna línea del autor la
 *                         supera, y nada depende de que el motor junte los 401
 *                         con espacios.
 *   4. SALIDA GARANTIZADA toda página termina con la orden de fin y ninguna
 *                         página puede retener al jugador: una página autorun o
 *                         paralela tiene que liberarse (self switch, borrar
 *                         evento, transferencia o una flag que su propia
 *                         condición mire).
 *
 * El texto se ensambla como lo hace el motor de verdad
 * (Interpreter_Commands#command_101: el parámetro del 101 y las continuaciones
 * 401 se unen con un espacio).
 *
 * Veredictos por evento: ✔ terminado · ⏳ pendiente declarado (con cita) · ✘ fallo.
 *
 * Uso:
 *   node tools/qa/evento_terminado_check.mjs                  # anillo A (eventos del plan)
 *   node tools/qa/evento_terminado_check.mjs --fichas         # tabla cruda
 *   node tools/qa/evento_terminado_check.mjs --evento 2056:EV_EP01_JEFE
 *   node tools/qa/evento_terminado_check.mjs --mapa 2041      # todos los eventos de un mapa
 *   node tools/qa/evento_terminado_check.mjs --censo          # los 3465 mapas
 *   node tools/qa/evento_terminado_check.mjs --censo --json
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { marshalLoad, RString } from "../../web/js/marshal.js";
import { visibleWidth } from "../../web/js/rmxp.js";
import { ROOT, DATA, GAME, txt, mapFile, readMap } from "../lib/dn_rmxp.mjs";

const REGISTRO = path.join(ROOT, "content", "evento_terminado.json");
const CENSO = path.join(ROOT, "content", "evento_terminado_censo.json");
const ARGS = process.argv.slice(2);
const B = {
  json: ARGS.includes("--json"),
  crudo: ARGS.includes("--crudo"),
  censo: ARGS.includes("--censo"),
  fichas: ARGS.includes("--fichas"),
  mapa: ARGS.includes("--mapa") ? Number(ARGS[ARGS.indexOf("--mapa") + 1]) : null,
  evento: ARGS.includes("--evento") ? ARGS[ARGS.indexOf("--evento") + 1] : null,
};
const CONDICIONES = ["dialogo", "flag", "caja", "salida"];
/** Con --crudo se miden los fallos sin aplicar exenciones, deudas ni pendientes: el diagnóstico. */
const NOMBRES = { dialogo: "diálogo revisado", flag: "flag de una sola escritura", caja: "texto en dos líneas de caja", salida: "salida garantizada" };

const json = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const registro = json(REGISTRO);
const citaOk = (fuente) =>
  !!fuente && fs.existsSync(path.join(ROOT, fuente.ruta)) &&
  fs.readFileSync(path.join(ROOT, fuente.ruta), "utf8").includes(fuente.busca);
const exento = (lista, quien) => (registro.exenciones?.[lista] ?? []).find((e) => e.eventos?.includes(quien) || (e.rango && quien.includes(":") && Number(quien.split(":")[0]) >= e.rango[0] && Number(quien.split(":")[0]) <= e.rango[1]));

// ------------------------------------------------------------------ la caja, comprobada en el motor
/**
 * La definición se apoya en tres hechos del motor. No se citan de memoria: se
 * leen de los Scripts compilados del juego en cada corrida.
 */
function comprobarCajaDelMotor() {
  const hechos = [
    { donde: "Messages", busca: "pbBottomLeftLines(msgwindow,2)", que: "la caja se crea de 2 líneas" },
    { donde: "Messages", busca: "linecount=(Graphics.height>400) ? 3 : 2", que: "la caja muestra 2 líneas cuando la pantalla no pasa de 400 px" },
    { donde: "Settings", busca: "SCREEN_HEIGHT = 384", que: "la pantalla del juego mide 384 de alto" },
  ];
  const scripts = marshalLoad(fs.readFileSync(path.join(GAME, "Data", "Scripts.rxdata")));
  const seccion = (nombre) => {
    for (const [, t, c] of scripts) {
      const etiqueta = t instanceof RString ? t.text : String(t);
      if (etiqueta !== nombre) continue;
      try { return zlib.inflateSync(Buffer.from(c.bytes)).toString("utf8"); } catch { return ""; }
    }
    return "";
  };
  const cache = new Map();
  const fallos = [];
  for (const h of hechos) {
    if (!cache.has(h.donde)) cache.set(h.donde, seccion(h.donde));
    if (!cache.get(h.donde).includes(h.busca)) fallos.push(`no se encontró «${h.busca}» en la sección ${h.donde}: ${h.que} no está comprobado`);
  }
  return fallos;
}

// ------------------------------------------------------------------ recursos
const caja = registro.caja ?? { columnas: 53, lineas: 2 };
const PATRONES = registro.patrones ?? {};
const aRegExp = (p) => new RegExp(p.expresion, p.banderas ?? "");

const nombres = (() => {
  const system = marshalLoad(fs.readFileSync(path.join(DATA, "System.rxdata")));
  return {
    switches: system.getIvar("@switches") ?? [],
    variables: system.getIvar("@variables") ?? [],
    de: (tipo, id) => {
      const lista = tipo === "s" ? (system.getIvar("@switches") ?? []) : (system.getIvar("@variables") ?? []);
      const v = lista?.[id];
      return v ? txt(v) : "";
    },
  };
})();

/** Alcance del anillo A: los mapas del plan (mismos que la fase 3). */
const anilloA = (() => {
  const ids = new Set();
  const p = path.join(ROOT, "content", "mapa_terminado.json");
  if (fs.existsSync(p)) {
    const decl = json(p).alcance?.anillo_a ?? {};
    for (const id of decl.mapas ?? []) ids.add(Number(id));
    for (const [a, b] of decl.rangos ?? []) for (let i = a; i <= b; i++) ids.add(i);
    const metrica = json(path.join(ROOT, "content", "metrica_dimensiones.json"));
    for (const m of metrica.mundos ?? []) for (const id of m.mapas ?? []) ids.add(Number(id));
  }
  return ids;
})();

const infos = (() => {
  const raw = marshalLoad(fs.readFileSync(path.join(DATA, "MapInfos.rxdata")));
  return new Map([...raw.pairs].map(([id, info]) => [Number(id), txt(info.getIvar("@name"))]));
})();

const mapIds = [...infos.keys()].filter((id) => fs.existsSync(path.join(DATA, mapFile(id))));

// ------------------------------------------------------------------ lectura de un evento
/** Une el 101 y sus 401 como lo hace el motor: con espacios. */
function ensamblar(par0, continuaciones) {
  let m = par0 ?? "";
  for (const t of continuaciones) {
    if (t !== "" && m.length && m[m.length - 1] !== " ") m += " ";
    m += t;
  }
  return m;
}

/** Los mensajes que dispara un comando de script (pbMessage / pbMessageDisplay). */
function mensajesDeScript(ruby) {
  const out = [];
  for (const m of String(ruby).matchAll(/pbMessage(?:Display)?\([^"]*"((?:[^"\\]|\\.)*)"/g)) out.push(m[1].replace(/\\"/g, '"'));
  // Sólo se leen los mensajes de verdad (pbMessage con comillas dobles): las cadenas sueltas
  // entre comillas simples son código Ruby (bloques, símbolos) y darían falsos positivos.
  return out;
  return out;
}

/** Extrae, de una página, todo lo que la métrica necesita medir. */
function analizarPagina(pagina, mapa, nombreEvento, indice) {
  const lista = pagina.getIvar("@list") ?? [];
  const trigger = Number(pagina.getIvar("@trigger"));
  const cond = pagina.getIvar("@condition");
  const condiciones = new Set();
  if (cond?.getIvar("@switch1_valid")) condiciones.add(`s${cond.getIvar("@switch1_id")}`);
  if (cond?.getIvar("@switch2_valid")) condiciones.add(`s${cond.getIvar("@switch2_id")}`);
  if (cond?.getIvar("@variable_valid")) condiciones.add(`v${cond?.getIvar("@variable_id")}`);

  const bloques = [];
  const scripts = [];
  const escribe = [];
  let libera = false;
  let transfiere = false;
  let termina = lista.length === 0 ? false : Number(lista[lista.length - 1].getIvar("@code")) === 0;

  let par0 = null;
  let conts = [];
  let anterior = null;
  const cerrar = () => {
    if (par0 === null) return;
    bloques.push({
      texto: ensamblar(par0, conts),
      // juntas: dos 401 seguidos que el motor separará con un espacio y que el autor no cerró con \n
      juntas: conts.reduce((n, t, i) => (i > 0 && !/\\n$/.test(conts[i - 1]) && !/^\\n/.test(t) ? n + 1 : n), 0),
      enCaja101: par0 !== "",
      continuaciones: conts.length,
    });
    par0 = null; conts = [];
  };

  for (const c of lista) {
    const code = Number(c.getIvar("@code"));
    const p = (c.getIvar("@parameters") ?? []).map(txt);
    if (code === 101) { cerrar(); par0 = p[0] ?? ""; }
    else if (code === 401) { if (par0 === null) par0 = ""; conts.push(p[0] ?? ""); }
    else cerrar();
    if (code === 355) for (const t of mensajesDeScript(p[0] ?? "")) scripts.push(t);
    if (code === 121) escribe.push({ tipo: "s", id: Number(p[0]), valor: Number(p[2]) });
    else if (code === 122) escribe.push({ tipo: "v", id: Number(p[0]), valor: Number(p[4]) });
    else if (code === 123) { escribe.push({ tipo: "self", id: txt(p[0]) }); libera = true; }
    else if (code === 124) libera = true;
    else if (code === 201) { transfiere = true; libera = true; }
  }
  cerrar();
  for (const e of escribe) if (e.tipo !== "self" && condiciones.has(`${e.tipo}${e.id}`)) libera = true;

  return { mapa, evento: nombreEvento, pagina: indice + 1, trigger, condiciones: [...condiciones], bloques, scripts, escribe, libera, transfiere, termina };
}

// ------------------------------------------------------------------ hallazgos de texto
function revisarTexto(paginas) {
  const fallos = [];
  const detalle = {
    bloques: 0, cabeEnUnaCaja: 0, lineasAnchas: 0, peorLinea: 0, juntas: 0, textos: 0,
    anchuras: { hasta60: 0, hasta100: 0, mas100: 0 },
  };
  for (const pg of paginas) {
    for (const b of pg.bloques) {
      detalle.bloques++;
      const lineas = b.texto.split(/\\n/);
      const anchas = lineas.filter((l) => visibleWidth(l) > caja.columnas);
      const peor = Math.max(0, ...lineas.map(visibleWidth));
      detalle.peorLinea = Math.max(detalle.peorLinea, peor);
      if (anchas.length) {
        detalle.lineasAnchas++;
        if (peor <= 60) detalle.anchuras.hasta60++;
        else if (peor <= 100) detalle.anchuras.hasta100++;
        else detalle.anchuras.mas100++;
        fallos.push({ condicion: "caja", tipo: "linea-ancha", pagina: pg.pagina, detalle: `${anchas.length} línea(s) de hasta ${Math.max(...anchas.map(visibleWidth))} columnas (la caja tiene ${caja.columnas}): «${anchas[0].slice(0, 70)}»` });
      }
      if (b.juntas) {
        detalle.juntas += b.juntas;
        fallos.push({ condicion: "caja", tipo: "junta-401", pagina: pg.pagina, detalle: `${b.juntas} junta(s) entre continuaciones 401: el motor inserta un espacio que el autor no escribió` });
      }
      // ¿cabría en una sola caja de 2 líneas?
      const envueltas = [];
      for (const l of lineas) {
        let actual = "";
        for (const w of l.split(/ +/)) {
          if (!actual) actual = w;
          else if (visibleWidth(actual) + 1 + visibleWidth(w) <= caja.columnas) actual += " " + w;
          else { envueltas.push(actual); actual = w; }
        }
        envueltas.push(actual);
      }
      if (envueltas.length <= caja.lineas) detalle.cabeEnUnaCaja++;
    }
    const textos = [
      ...pg.bloques.map((b) => ({ texto: b.texto, origen: "caja" })),
      ...pg.scripts.map((t) => ({ texto: t, origen: "script" })),
    ];
    for (const t of textos) {
      detalle.textos++;
      // Primero, lo que el texto dice de sí mismo: fuga de diseño, relleno o metagame.
      const propios = [];
      if (!t.texto.trim()) propios.push({ tipo: "texto-vacio", detalle: `${t.origen}: texto vacío` });
      else {
        for (const p of PATRONES.fugas ?? []) {
          if (aRegExp(p).test(t.texto)) { propios.push({ tipo: `fuga:${p.id}`, detalle: `${p.id} (${t.origen}): «${t.texto.slice(0, 70)}»` }); break; }
        }
        for (const p of PATRONES.relleno ?? []) {
          if (aRegExp(p).test(t.texto)) propios.push({ tipo: `relleno:${p.id}`, detalle: `${p.id} (${t.origen}): «${t.texto.slice(0, 70)}»` });
        }
      }
      // El formato sólo se juzga cuando el texto no es ya una nota de diseño: si lo es, el espacio
      // o el punto fuera de sitio son consecuencia de la nota, no un defecto aparte.
      if (!propios.length) {
        for (const p of PATRONES.metagame ?? []) {
          if (aRegExp(p).test(t.texto)) propios.push({ tipo: `metagame:${p.id}`, detalle: `${p.id} (${t.origen}): «${t.texto.slice(0, 70)}»` });
        }
        if (/\s$/.test(t.texto)) propios.push({ tipo: "espacio-final", detalle: `${t.origen}: «…${t.texto.slice(-30).trim()}» termina en espacio` });
        if (/ {2,}/.test(t.texto)) propios.push({ tipo: "espacios-dobles", detalle: `${t.origen}: «${t.texto.slice(0, 60)}»` });
        if (/[ \t]+[,;.:](?=\s|$)/.test(t.texto)) propios.push({ tipo: "espacio-antes-de-puntuacion", detalle: `${t.origen}: «${t.texto.slice(0, 60)}»` });
        if (/\\(?![nbcv]|sp\[|c\[|v\[|PN|pg|pog)/.test(t.texto)) propios.push({ tipo: "codigo-mal-formado", detalle: `${t.origen}: «${t.texto.slice(0, 60)}»` });
      }
      for (const f of propios) fallos.push({ condicion: "dialogo", ...f, pagina: pg.pagina });
    }
  }
  return { fallos, detalle };
}

// ------------------------------------------------------------------ flags del juego entero
/** Índice de escrituras de switch/variable de TODOS los mapas (para «una sola escritura»). */
const escrituras = (() => {
  const porFlag = new Map();
  const anotar = (clave, mapa, evento, valor) => {
    if (!porFlag.has(clave)) porFlag.set(clave, []);
    porFlag.get(clave).push({ mapa, evento, valor });
  };
  for (const id of mapIds) {
    if (B.mapa && id !== B.mapa) continue;
    if (!B.censo && !B.mapa && !anilloA.has(id)) {
      // el anillo A necesita saber si otro mapa escribe la misma flag: se indexan todos
    }
    const raw = readMap(id);
    for (const [, ev] of raw.getIvar("@events")?.pairs ?? []) {
      const nombre = txt(ev.getIvar("@name"));
      for (const pg of ev.getIvar("@pages") ?? []) {
        for (const c of pg.getIvar("@list") ?? []) {
          const code = Number(c.getIvar("@code"));
          if (code !== 121 && code !== 122) continue;
          const p = (c.getIvar("@parameters") ?? []).map(txt);
          if (code === 121) anotar(`s${Number(p[0])}`, id, nombre, Number(p[2]));
          else anotar(`v${Number(p[0])}`, id, nombre, Number(p[4]));
        }
      }
    }
  }
  return porFlag;
})();

function revisarFlags(paginas, quien) {
  const fallos = [];
  const detalle = { switches: 0, variables: 0, dobles: 0, sinNombre: 0, apagadas: 0 };
  const vistos = new Set();
  for (const pg of paginas) {
    for (const e of pg.escribe) {
      if (e.tipo === "self") continue;
      const clave = `${e.tipo}${e.id}`;
      if (vistos.has(clave)) continue;
      vistos.add(clave);
      const todas = escrituras.get(clave) ?? [];
      const encendidos = todas.filter((w) => w.tipo !== "v" && w.valor === 0 && e.tipo === "s");
      const nombre = nombres.de(e.tipo, e.id);
      if (e.tipo === "s") {
        detalle.switches++;
        if (todas.some((w) => w.valor === 1)) {
          detalle.apagadas++;
          fallos.push({ condicion: "flag", tipo: "flag-apagada", detalle: `switch ${e.id} se apaga en ${todas.filter((w) => w.valor === 1).map((w) => `Map${w.mapa}:${w.evento}`).slice(0, 2).join(", ")}` });
        }
        if (encendidos.length > 1) {
          detalle.dobles++;
          fallos.push({ condicion: "flag", tipo: "flag-doble", detalle: `switch ${e.id} se enciende en ${encendidos.length} sitios: ${encendidos.map((w) => `Map${w.mapa}:${w.evento}`).slice(0, 3).join(", ")}` });
        }
      } else {
        detalle.variables++;
      }
      if (!nombre || !nombre.trim().length) {
        detalle.sinNombre++;
        fallos.push({ condicion: "flag", tipo: "flag-sin-nombre", detalle: `${e.tipo === "s" ? "switch" : "variable"} ${e.id} no tiene nombre en System.rxdata (el editor muestra «—»)` });
      }
    }
  }
  return { fallos, detalle };
}

function revisarSalida(paginas) {
  const fallos = [];
  const detalle = { paginas: paginas.length, sinFin: 0, autorunSinLiberar: 0, paralelasSinLiberar: 0 };
  for (const pg of paginas) {
    if (!pg.termina) {
      detalle.sinFin++;
      fallos.push({ condicion: "salida", tipo: "sin-fin", pagina: pg.pagina, detalle: "la lista de la página no termina con la orden de fin (código 0)" });
    }
    if ((pg.trigger === 3 || pg.trigger === 4) && !pg.libera) {
      if (pg.trigger === 3) detalle.autorunSinLiberar++; else detalle.paralelasSinLiberar++;
      fallos.push({
        condicion: "salida", tipo: pg.trigger === 3 ? "autorun-sin-salida" : "paralela-sin-salida", pagina: pg.pagina,
        detalle: `página ${pg.trigger === 3 ? "autorun" : "paralela"} sin liberación (self switch, borrar evento, transferencia o flag propia): el jugador no recupera el control`,
        graves: pg.trigger === 3 && pg.condiciones.length === 0,
      });
    }
  }
  return { fallos, detalle };
}

// ------------------------------------------------------------------ evaluación
/**
 * ¿Este fallo está declarado? Tres vías, en este orden:
 *   1. una EXENCIÓN (motivo ≥ 20 caracteres) para un texto que se muestra a propósito tal cual;
 *   2. un PENDIENTE de un evento concreto, con su cita;
 *   3. una DEUDA por barrido (tipo de fallo + alcance), con su cita y su conteo.
 * Lo que no encaja en ninguna se queda como fallo abierto y rompe la corrida.
 */
const tipoCasa = (patron, tipo) => (patron.endsWith("*") ? tipo.startsWith(patron.slice(0, -1)) : tipo === patron);
const algunTipo = (lista, tipo) => [].concat(lista ?? []).some((p) => tipoCasa(p, tipo));
const casaEvento = (x, e) =>
  (x.eventos ?? []).includes(e.quien) ||
  (x.patrones ?? []).some((p) => new RegExp(p).test(e.quien)) ||
  (x.mapas ?? []).some(([a, b]) => e.mapa >= a && e.mapa <= b);
const casaMapa = (alcance, e) =>
  !alcance?.mapas || alcance.mapas.some(([a, b]) => e.mapa >= a && e.mapa <= b);

const cubreExencion = (c, f, e) => {
  if (c !== "dialogo" && c !== "caja") return null;
  if (B.crudo) return null;
  return (registro.exenciones?.textos ?? []).find((x) =>
    algunTipo(x.tipos, f.tipo) &&
    casaEvento(x, e) &&
    (!x.condiciones || x.condiciones.includes(c)) &&
    (x.motivo ?? "").length >= 20);
};
const cubreDeuda = (c, f, e, enPlan) =>
  (registro.deudas ?? []).find((d) =>
    d.condicion === c && algunTipo(d.tipos, f.tipo) && casaMapa(d.alcance, e) &&
    (d.alcance?.todos ? true : enPlan) && citaOk(d.fuente));
const cubreDeudaCrudo = () => null;

function evaluarEvento(mapa, nombreEvento, objetos) {
  const paginas = objetos.map((pg, i) => analizarPagina(pg, mapa, nombreEvento, i));
  const quien = `${mapa}:${nombreEvento}`;
  const texto = revisarTexto(paginas);
  const flags = revisarFlags(paginas, quien);
  const salida = revisarSalida(paginas);
  const enPlan = anilloA.has(mapa);
  const e = {
    quien, mapa, nombre: nombreEvento, paginas: paginas.length,
    detalle: { texto: texto.detalle, flags: flags.detalle, salida: salida.detalle },
    fallos: {
      dialogo: texto.fallos.filter((f) => f.condicion === "dialogo"),
      caja: texto.fallos.filter((f) => f.condicion === "caja"),
      flag: flags.fallos,
      salida: salida.fallos,
    },
    exenciones: [], pendientes: [], deudas: [], avisos: [],
  };
  for (const c of CONDICIONES) e.fallos[c] = e.fallos[c] ?? [];

  for (const c of CONDICIONES) {
    const quedan = [];
    for (const f of e.fallos[c]) {
      const x = cubreExencion(c, f, e);
      if (x) e.exenciones.push({ condicion: c, tipo: f.tipo, motivo: x.motivo });
      else quedan.push(f);
    }
    e.fallos[c] = quedan;
  }
  // Primero las deudas (miran el tipo del fallo, así que describen una clase de defecto) y después
  // los pendientes (declaran el evento entero): un texto al que le toca una deuda no se le apunta
  // además al pendiente del evento, para que cada conteo signifique una sola cosa.
  for (const c of CONDICIONES) {
    const quedan = [];
    for (const f of e.fallos[c]) {
      const d = B.crudo ? cubreDeudaCrudo() : cubreDeuda(c, f, e, enPlan);
      if (d) e.deudas.push({ condicion: c, id: d.id, tipo: f.tipo });
      else quedan.push(f);
    }
    e.fallos[c] = quedan;
  }
  for (const c of CONDICIONES) {
    if (!e.fallos[c].length) continue;
    const p = B.crudo ? null : (registro.pendientes ?? []).find((x) => x.condicion === c && casaEvento(x, e) && citaOk(x.fuente));
    if (!p) continue;
    e.pendientes.push({ condicion: c, id: p.id, motivo: p.motivo, tipos: [...new Set(e.fallos[c].map((f) => f.tipo))] });
    e.fallos[c] = [];
  }

  e.totalFallos = CONDICIONES.reduce((n, c) => n + e.fallos[c].length, 0);
  e.totalDeudas = e.deudas.length;
  for (const c of CONDICIONES) e[c] = e.fallos[c].length === 0;
  e.completo = e.totalFallos === 0 && e.pendientes.length === 0 && e.deudas.length === 0;
  return e;
}

// ------------------------------------------------------------------ recorrido
const objetivos = (() => {
  if (B.evento) {
    const [m, n] = B.evento.split(":");
    return [{ mapa: Number(m), solo: n }];
  }
  if (B.mapa) return [{ mapa: B.mapa }];
  if (B.censo) return mapIds.map((id) => ({ mapa: id }));
  return [...anilloA].filter((id) => infos.has(id)).sort((a, b) => a - b).map((id) => ({ mapa: id }));
})();

const t0 = Date.now();
const evaluados = [];
for (const objetivo of objetivos) {
  if (!fs.existsSync(path.join(DATA, mapFile(objetivo.mapa)))) continue;
  const raw = readMap(objetivo.mapa);
  for (const [, ev] of raw.getIvar("@events")?.pairs ?? []) {
    const nombreEvento = txt(ev.getIvar("@name"));
    if (objetivo.solo && nombreEvento !== objetivo.solo) continue;
    if (!B.censo && !B.mapa && !B.evento && !anilloA.has(objetivo.mapa)) continue;
    evaluados.push(evaluarEvento(objetivo.mapa, nombreEvento, ev.getIvar("@pages") ?? []));
  }
}
const segundos = Number(((Date.now() - t0) / 1000).toFixed(1));

if (B.evento) {
  const e = evaluados[0];
  if (!e) { console.error(`no existe el evento ${B.evento}`); process.exit(1); }
  if (B.json) console.log(JSON.stringify(e, null, 2));
  else {
    console.log(`${e.quien} — ${e.paginas} página(s)`);
    console.log(`  texto   ${JSON.stringify(e.detalle.texto)}`);
    console.log(`  flags   ${JSON.stringify(e.detalle.flags)}`);
    console.log(`  salida  ${JSON.stringify(e.detalle.salida)}`);
    console.log(`  ${CONDICIONES.map((c) => `${NOMBRES[c]}=${e[c] ? "✔" : "✘"}`).join("  ")}`);
    for (const p of e.pendientes) console.log(`  PENDIENTE ${p.id} (${NOMBRES[p.condicion]}): ${p.motivo}`);
    for (const c of CONDICIONES) for (const f of e.fallos[c]) console.log(`  FALLO ${NOMBRES[c]} · ${f.tipo}${f.pagina ? ` p${f.pagina}` : ""}: ${f.detalle}`);
  }
  process.exit(e.totalFallos ? 1 : 0);
}

if (B.fichas) {
  for (const e of evaluados) {
    const d = e.detalle;
    console.log(
      `${e.quien.slice(0, 46).padEnd(46)} pág ${String(e.paginas).padStart(2)}  ` +
        `textos ${String(d.texto.textos).padStart(3)}  en-una-caja ${String(d.texto.cabeEnUnaCaja).padStart(3)}  ` +
        `anchas ${String(d.texto.lineasAnchas).padStart(3)}  juntas ${String(d.texto.juntas).padStart(3)}  ` +
        `sw ${String(d.flags.switches).padStart(2)}  salida ${d.salida.autorunSinLiberar ? "AUTORUN!" : "ok"}`,
    );
  }
  process.exit(0);
}

// ------------------------------------------------------------------ informe
const resumenCondiciones = Object.fromEntries(CONDICIONES.map((c) => [c, evaluados.filter((e) => e[c]).length]));
const totalTexto = evaluados.reduce((acc, e) => {
  for (const k of ["bloques", "cabeEnUnaCaja", "lineasAnchas", "juntas", "textos"]) acc[k] += e.detalle.texto[k];
  acc.anchurasHasta60 += e.detalle.texto.anchuras.hasta60;
  acc.anchurasHasta100 += e.detalle.texto.anchuras.hasta100;
  acc.anchurasMasDe100 += e.detalle.texto.anchuras.mas100;
  acc.peorLinea = Math.max(acc.peorLinea, e.detalle.texto.peorLinea);
  for (const k of ["switches", "variables", "dobles", "sinNombre", "apagadas"]) acc[k] += e.detalle.flags[k] ?? e.detalle.salida[k] ?? 0;
  acc.paginas += e.detalle.salida.paginas;
  acc.sinFin += e.detalle.salida.sinFin;
  acc.autorunSinLiberar += e.detalle.salida.autorunSinLiberar;
  acc.paralelasSinLiberar += e.detalle.salida.paralelasSinLiberar;
  return acc;
}, { bloques: 0, textos: 0, cabeEnUnaCaja: 0, lineasAnchas: 0, juntas: 0, peorLinea: 0, anchurasHasta60: 0, anchurasHasta100: 0, anchurasMasDe100: 0, switches: 0, variables: 0, dobles: 0, sinNombre: 0, apagadas: 0, paginas: 0, sinFin: 0, autorunSinLiberar: 0, paralelasSinLiberar: 0 });

const problemas = evaluados.filter((e) => e.totalFallos);
const conPendientes = evaluados.filter((e) => !e.totalFallos && e.pendientes.length);
const conDeudas = evaluados.filter((e) => !e.totalFallos && !e.pendientes.length && e.deudas.length);
const terminados = evaluados.filter((e) => e.completo);
const graves = problemas.filter((e) => e.fallos.salida.some((f) => f.graves));
/** Cuántos fallos y cuántos eventos cubre cada declaración (deuda por barrido o pendiente). */
const conMarca = (id, clave) => evaluados.filter((e) => (e[clave] ?? []).some((x) => x.id === id));
const cuentaDeclaracion = (id, clave) => ({
  fallos: evaluados.reduce((n, e) => n + (e[clave] ?? []).filter((x) => x.id === id).length, 0),
  // Las declaraciones del registro van por nombre («mapa:nombre»), así que se cuentan nombres.
  eventos: new Set(conMarca(id, clave).map((e) => e.quien)).size,
  mapas: [...new Set(conMarca(id, clave).map((e) => e.mapa))].sort((a, b) => a - b),
});
const resumenDeudas = (registro.deudas ?? []).map((d) => ({ id: d.id, condicion: d.condicion, tipos: d.tipos, motivo: d.motivo, fuente: d.fuente, ...cuentaDeclaracion(d.id, "deudas") }));
const resumenPendientes = (registro.pendientes ?? []).map((x) => ({ id: x.id, condicion: x.condicion, motivo: x.motivo, fuente: x.fuente, ...cuentaDeclaracion(x.id, "pendientes") }));
Object.assign(totalTexto, {
  eventos: evaluados.length,
  mapas: new Set(evaluados.map((e) => e.mapa)).size,
  terminados: terminados.length,
  con_deuda: conDeudas.length,
  con_pendiente: conPendientes.length,
  con_fallo: problemas.length,
});
const resumenExenciones = (registro.exenciones?.textos ?? []).map((x) => ({
  motivo: x.motivo, tipos: x.tipos, eventos: x.eventos ?? x.patrones ?? x.rango,
  aplicadas: evaluados.reduce((n, e) => n + e.exenciones.filter((y) => y.motivo === x.motivo).length, 0),
}));

/** ¿Los números declarados en el registro siguen siendo los medidos? */
const comprobarMediciones = () => {
  const fallos = [];
  for (const d of registro.mediciones ?? []) {
    const medido = totalTexto[d.metrica];
    if (medido !== d.valor) fallos.push(`la medición declarada «${d.etiqueta}» dice ${d.valor} y ahora son ${medido}`);
  }
  for (const p of registro.pendientes ?? []) {
    if (p.medido === undefined) continue;
    const medido = p.metrica === "eventos" ? evaluados.filter((e) => e.pendientes.some((x) => x.id === p.id)).length : totalTexto[p.metrica];
    if (medido !== p.medido) fallos.push(`el pendiente ${p.id} declara ${p.medido} y ahora son ${medido} (${p.metrica})`);
  }
  for (const d of registro.deudas ?? []) {
    if (d.medido === undefined) continue;
    const medido = d.metrica === "eventos"
      ? evaluados.filter((e) => e.deudas.some((x) => x.id === d.id)).length
      : evaluados.reduce((n, e) => n + e.deudas.filter((x) => x.id === d.id).length, 0);
    if (medido !== d.medido) fallos.push(`la deuda ${d.id} declara ${d.medido} y ahora son ${medido} (${d.metrica})`);
  }
  return fallos;
};

const fallosCajaMotor = comprobarCajaDelMotor();
const lineas = [];
lineas.push(`  eventos: ${evaluados.length} objetos en ${totalTexto.mapas} mapas · ${new Set(evaluados.map((e) => e.quien)).size} nombres distintos (${evaluados.length - new Set(evaluados.map((e) => e.quien)).size} repiten nombre, y una declaración por nombre cubre a todos los que se llamen así)`);
lineas.push(`Eventos terminados — ${evaluados.length} eventos en ${segundos} s (${CONDICIONES.map((c) => NOMBRES[c]).join(" · ")})`);
lineas.push(`  texto: ${totalTexto.bloques} bloques de caja y ${totalTexto.textos - totalTexto.bloques} mensajes por script · ` +
  `${totalTexto.cabeEnUnaCaja} caben en una caja de ${caja.lineas} líneas (${((totalTexto.cabeEnUnaCaja / Math.max(1, totalTexto.bloques)) * 100).toFixed(1)} %)`);
lineas.push(`  caja de ${caja.columnas} columnas: ${totalTexto.lineasAnchas} bloques con línea de autor más ancha (peor: ${totalTexto.peorLinea}) · ${totalTexto.juntas} juntas 401 sin salto explícito`);
lineas.push(`  flags: ${totalTexto.switches} switches (${totalTexto.dobles} con más de un escritor, ${totalTexto.apagadas} apagados) y ${totalTexto.variables} variables · ${totalTexto.sinNombre} sin nombre`);
lineas.push(`  salida: ${totalTexto.paginas} páginas · ${totalTexto.sinFin} sin orden de fin · ${totalTexto.autorunSinLiberar} autorun y ${totalTexto.paralelasSinLiberar} paralelas sin liberación`);

const salidaCenso = () => ({
  fecha: new Date().toISOString().slice(0, 10),
  eventos: evaluados.length,
  veredictos: {
    terminados: terminados.length,
    con_deuda: conDeudas.length,
    con_pendiente: conPendientes.length,
    con_fallo_abierto: problemas.length,
    graves_autorun_sin_liberar: graves.length,
  },
  por_condicion: resumenCondiciones,
  caja_del_motor: fallosCajaMotor.length === 0,
  texto: totalTexto,
  deudas: resumenDeudas.map((d) => ({ id: d.id, condicion: d.condicion, tipos: d.tipos, fallos: d.fallos, eventos: d.eventos, medido: (registro.deudas ?? []).find((x) => x.id === d.id)?.medido })),
  exenciones: resumenExenciones,
  pendientes: resumenPendientes.map((x) => ({
    id: x.id, condicion: x.condicion, motivo: x.motivo, fallos: x.fallos, mapas: x.mapas,
    medido: (registro.pendientes ?? []).find((y) => y.id === x.id)?.medido,
    eventos: evaluados.filter((e) => e.pendientes.some((y) => y.id === x.id)).map((e) => e.quien),
  })),
  deudas_del_proyecto: (registro.deudas_del_proyecto ?? []).map((d) => ({ id: d.id, nota: d.nota })),
  hallazgos: (registro.hallazgos ?? []).map((h) => ({ id: h.id, titulo: h.titulo, nota: h.nota })),
  por_mapa: (() => {
    const porMapa = new Map();
    for (const e of evaluados) {
      const malas = CONDICIONES.filter((c) => e.fallos[c].length);
      if (!malas.length) continue;
      if (!porMapa.has(e.mapa)) porMapa.set(e.mapa, { mapa: e.mapa, nombre: infos.get(e.mapa) ?? "", eventos: 0, condiciones: {} });
      const fila = porMapa.get(e.mapa);
      fila.eventos++;
      for (const c of malas) fila.condiciones[c] = (fila.condiciones[c] ?? 0) + 1;
    }
    return [...porMapa.values()].sort((a, b) => b.eventos - a.eventos);
  })(),
  muestras: {
    dialogo: problemas.flatMap((e) => e.fallos.dialogo.map((f) => `${e.quien} · ${f.tipo}: ${f.detalle}`)).slice(0, 12),
    caja: problemas.flatMap((e) => e.fallos.caja.map((f) => `${e.quien} · ${f.tipo}: ${f.detalle}`)).slice(0, 12),
    flag: problemas.flatMap((e) => e.fallos.flag.map((f) => `${e.quien} · ${f.tipo}: ${f.detalle}`)).slice(0, 12),
    salida: problemas.flatMap((e) => e.fallos.salida.map((f) => `${e.quien} · ${f.tipo}: ${f.detalle}`)).slice(0, 12),
  },
});

if (B.censo) {
  const detalle = salidaCenso();
  fs.writeFileSync(CENSO, `${JSON.stringify(detalle, null, 1)}\n`);
  if (B.json) console.log(JSON.stringify(detalle, null, 2));
  else {
    for (const l of lineas) console.log(l);
    console.log(`  veredictos: ${terminados.length} terminados · ${conDeudas.length} con deuda declarada · ${conPendientes.length} con pendiente declarado · ${problemas.length} ${B.censo ? "abiertos (línea base del juego; las declaraciones del registro sólo cubren al plan)" : "con fallo abierto"}`);
    for (const d of detalle.deudas) console.log(`  deuda ${d.id} (${NOMBRES[d.condicion]}): ${d.fallos} fallos en ${d.eventos} eventos · medido ${d.medido}`);
    for (const p of detalle.pendientes) console.log(`  pendiente ${p.id} (${NOMBRES[p.condicion]}): ${p.eventos.length} eventos declarados, medido ${p.medido}`);
    for (const f of fallosCajaMotor) console.error(`  FALLO motor: ${f}`);
    for (const e of problemas.slice(0, 8)) console.error(`  ${B.censo ? "ABIERTO (línea base)" : "FALLO"} ${e.quien}: ${CONDICIONES.flatMap((c) => e.fallos[c]).map((f) => `${f.tipo}${f.pagina ? ` p${f.pagina}` : ""}`).join(" · ")}`);
  }
  const linea = registro.alcance?.anillo_b?.linea_base ?? null;
  const empeora = linea ? CONDICIONES.filter((c) => resumenCondiciones[c] < (linea.eventos_ok?.[c] ?? 0)) : [];
  for (const c of empeora) console.error(`  FALLO regresión: «${NOMBRES[c]}» bajó de ${linea.eventos_ok[c]} a ${resumenCondiciones[c]} eventos sin fallo`);
  const fallosMedicion = B.censo ? [] : comprobarMediciones();
  for (const f of fallosMedicion) console.error(`  FALLO medición: ${f}`);
  if (B.censo) {
    // El censo mide la herencia de Fire Ash: sus fallos son la línea base, no un veredicto.
    if (empeora.length || fallosCajaMotor.length) process.exit(1);
    process.exit(0);
  }
  if (problemas.length || fallosMedicion.length || empeora.length || fallosCajaMotor.length) process.exit(1);
  process.exit(0);
}

if (B.json) {
  console.log(JSON.stringify({
    eventos: evaluados.length, por_condicion: resumenCondiciones, totales: totalTexto,
    veredictos: { terminados: terminados.length, con_deuda: conDeudas.length, con_pendiente: conPendientes.length, con_fallo: problemas.length },
    deudas: resumenDeudas.map((d) => ({ id: d.id, fallos: d.fallos, eventos: d.eventos, motivo: d.motivo })),
    graves: graves.map((e) => ({ quien: e.quien, fallos: e.fallos.salida })),
    pendientes: conPendientes.map((e) => ({ quien: e.quien, pendientes: e.pendientes })),
    con_deuda: conDeudas.map((e) => ({ quien: e.quien, deudas: [...new Set(e.deudas.map((d) => d.id))] })),
    problemas: problemas.map((e) => ({ quien: e.quien, fallos: e.fallos })),
  }, null, 2));
  process.exit(problemas.length ? 1 : 0);
}

for (const l of lineas) console.log(l);
const fallosMedicion = comprobarMediciones();
for (const f of fallosMedicion) console.error(`  FALLO medición: ${f}`);
console.log("");
console.log(`  anillo A: ${terminados.length}/${evaluados.length} eventos terminados · ${conDeudas.length} con deuda declarada · ${conPendientes.length} con pendiente declarado · ${problemas.length} con fallo abierto`);
for (const d of resumenDeudas) console.log(`  DEUDA ${d.id} (${NOMBRES[d.condicion]}): ${d.fallos} fallos en ${d.eventos} eventos y ${d.mapas.length} mapas — ${d.motivo}`);
for (const x of resumenPendientes) console.log(`  PENDIENTE ${x.id} (${NOMBRES[x.condicion]}): ${x.eventos} eventos — ${x.motivo}`);
for (const x of resumenExenciones) console.log(`  EXENCIÓN (${x.aplicadas} textos): ${x.motivo}`);
for (const e of conPendientes) {
  for (const p of e.pendientes) console.log(`  ⏳ ${e.quien} · ${NOMBRES[p.condicion]}: pendiente ${p.id} (${p.tipos.join(", ")})`);
}
for (const e of problemas) console.error(`  FALLO ${e.quien}: ${CONDICIONES.flatMap((c) => e.fallos[c]).map((f) => `${f.tipo}${f.pagina ? ` p${f.pagina}` : ""}: ${f.detalle}`).join(" · ")}`);
for (const f of fallosCajaMotor) console.error(`  FALLO motor: ${f}`);
if (problemas.length || fallosMedicion.length || fallosCajaMotor.length) {
  console.error("FALLO: hay eventos con fallos no declarados, mediciones desactualizadas o hechos del motor sin comprobar");
  process.exit(1);
}
console.log("OK: ningún evento del anillo A tiene fallo abierto (los pendientes declarados van listados con su cita)");
