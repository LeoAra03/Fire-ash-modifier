#!/usr/bin/env node
/**
 * fase_002_tanda_23.mjs — tanda 23 (líneas 2200–2299 de `tareas.txt`).
 *
 * Carril de playtest real: las sesiones 2–52, el registro de cobertura, la
 * clasificación de hallazgos y la puerta de regresión.
 *
 * La regla de esta tanda es incómoda y no se puede saltar: **nadie ha jugado el
 * DLC de punta a punta**. Por eso el veredicto honesto no es «hecho», es
 * `instrumentado`: la carpeta, la ficha, el guion con cuota y la puerta de
 * regresión existen y están medidos; la fecha, la duración, las capturas y los
 * hallazgos los pone una persona cuando juegue.
 *
 * Uso:
 *   node tools/plan2700/fase_002_tanda_23.mjs            # escribe artefacto
 *   node tools/plan2700/fase_002_tanda_23.mjs --verify   # comprueba que sigue al día
 *   node tools/plan2700/fase_002_tanda_23.mjs --json     # vuelca el artefacto
 */
import fs from "node:fs";
import path from "node:path";
import {
  ROOT, cargarCorpus, cargarTanda, escribirArtefacto, evaluarTanda, verificarArtefacto,
} from "./tanda_textos_core.mjs";
import { evaluar as evaluarRegresiones, hallazgosDeFicha } from "../qa/playtest_regresiones.mjs";

const VERIFY = process.argv.includes("--verify");
const JSON_OUT = process.argv.includes("--json");
const LINEAS = { desdeLinea: 2200, hastaLinea: 2299 };

const corpus = cargarCorpus();
const tanda = cargarTanda(LINEAS);
const CONTENT = path.join(ROOT, "content");
const PLAYTEST = path.join(ROOT, "docs", "qa", "playtest");

const leerJson = (relativa) => JSON.parse(fs.readFileSync(path.join(ROOT, relativa), "utf8"));
const guion = leerJson("content/plan2700_playtest_guion.json");
const registroRegresiones = leerJson("content/playtest_regresiones.json");
const sesiones = new Map(guion.sesiones.map((sesion) => [sesion.id, sesion]));
const paquete = leerJson("package.json");

/**
 * Los cinco campos que la tarea 2193 exige en la ficha. Los otros cinco del
 * guion (entorno, mapas, eventos, diálogos, tasa) son el contrato completo para
 * la sesión jugada; la ficha de hoy los nombra o no, y eso se informa aparte
 * sin convertir la plantilla en un fallo.
 */
const CAMPOS_NUCLEO = ["fecha", "version", "duracion", "hallazgos", "capturas"];
const sinTildes = (texto) => String(texto).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Fichas de sesión: carpeta, README y los cinco campos núcleo. */
function fichas() {
  const presentes = [];
  const conCampos = [];
  const faltantes = [];
  for (const sesion of guion.sesiones) {
    const ficha = path.join(ROOT, sesion.carpeta, "README.md");
    if (!fs.existsSync(ficha)) { faltantes.push({ sesion: sesion.id, motivo: "sin README" }); continue; }
    presentes.push(sesion.id);
    const texto = sinTildes(fs.readFileSync(ficha, "utf8"));
    const sinCampo = CAMPOS_NUCLEO.filter((campo) => !texto.includes(campo));
    if (sinCampo.length) faltantes.push({ sesion: sesion.id, motivo: `ficha sin ${sinCampo.join(", ")}` });
    else conCampos.push(sesion.id);
  }
  return { presentes, conCampos, faltantes };
}
const fichasMedidas = fichas();

const SONDAS_LOCALES = {
  /** El guion existe, tiene las sesiones del plan y sus fracciones suman 1. */
  guion_cuotas: {
    titulo: "Guion con cuota por sesión, fracciones que suman 1",
    ejecutar() {
      const ids = guion.sesiones.map((sesion) => sesion.id);
      const problemas = [];
      if (guion.sesiones.length !== 60) problemas.push(`el guion tiene ${guion.sesiones.length} sesiones y el plan pide 60`);
      const duplicadas = ids.filter((id, indice) => ids.indexOf(id) !== indice);
      if (duplicadas.length) problemas.push(`sesiones repetidas: ${duplicadas.join(", ")}`);
      for (const sesion of guion.sesiones.filter((fila) => fila.tipo === "contenido")) {
        if (!sesion.tramos.length) problemas.push(`la sesión ${sesion.id} es de contenido y no tiene tramos`);
        const sinCuota = sesion.tramos.filter((tramo) => tramo.cuota.mapas <= 0 || tramo.cuota.eventos <= 0 || tramo.cuota.cajas <= 0);
        if (sinCuota.length) problemas.push(`la sesión ${sesion.id} tiene un tramo con cuota cero`);
        const sumaFracciones = sesion.tramos.reduce((total, tramo) => total + tramo.fraccion, 0);
        if (sumaFracciones <= 0) problemas.push(`la sesión ${sesion.id} no cubre nada`);
      }
      // La suma por dimensión la garantiza el generador; aquí se comprueba de
      // nuevo, porque un artefacto manipulado no puede pasar la puerta.
      for (const dimension of guion.dimensiones) {
        const suma = guion.sesiones
          .filter((sesion) => sesion.tipo === "contenido")
          .flatMap((sesion) => sesion.tramos.filter((tramo) => tramo.dimension === dimension.perfil))
          .reduce((total, tramo) => total + tramo.fraccion, 0);
        if (Math.abs(suma - 1) > 1e-9) problemas.push(`las fracciones de ${dimension.perfil} suman ${suma.toFixed(4)}`);
      }
      return {
        total: problemas.length,
        veredicto: problemas.length ? "hallazgo" : "ok",
        universo: guion.sesiones.length,
        detalle: {
          sesiones: guion.sesiones.length,
          conCuota: guion.sesiones.filter((sesion) => sesion.tipo === "contenido").length,
          deSoporte: guion.sesiones.filter((sesion) => sesion.tipo === "soporte").length,
          ejecutado: false,
        },
        muestras: problemas.map((motivo) => ({ detalle: motivo })),
      };
    },
  },

  /** La suma de cuotas cubre el 100 % del contenido con texto. */
  cuota_100: {
    titulo: "Las cuotas cubren el 100 % de mapas, eventos y cajas",
    ejecutar() {
      const suma = guion.sesiones.reduce((acc, sesion) => ({
        mapas: acc.mapas + sesion.cuota.mapas,
        eventos: acc.eventos + sesion.cuota.eventos,
        cajas: acc.cajas + sesion.cuota.cajas,
      }), { mapas: 0, eventos: 0, cajas: 0 });
      const problemas = [];
      for (const clave of ["mapas", "eventos", "cajas"]) {
        if (suma[clave] !== guion.totales[clave]) problemas.push(`${clave}: ${suma[clave]} ≠ ${guion.totales[clave]}`);
      }
      return {
        total: problemas.length,
        veredicto: problemas.length ? "hallazgo" : "ok",
        universo: guion.totales.cajas,
        detalle: { suma, totales: guion.totales, ejecutado: false },
        muestras: problemas.map((motivo) => ({ detalle: motivo })),
      };
    },
  },

  /** Cada dimensión recibe exactamente su contenido en las sesiones que la cubren. */
  cuota_dimensiones: {
    titulo: "Cada dimensión reparte su contenido exacto entre sus sesiones",
    ejecutar() {
      const problemas = [];
      const detalle = [];
      for (const dimension of guion.dimensiones) {
        const asignado = guion.sesiones
          .filter((sesion) => sesion.tipo === "contenido" && sesion.dimensiones.includes(dimension.perfil))
          .reduce((acc, sesion) => {
            const tramo = sesion.tramos.find((entrada) => entrada.dimension === dimension.perfil);
            return { mapas: acc.mapas + tramo.cuota.mapas, eventos: acc.eventos + tramo.cuota.eventos, cajas: acc.cajas + tramo.cuota.cajas };
          }, { mapas: 0, eventos: 0, cajas: 0 });
        detalle.push({ dimension: dimension.perfil, total: { mapas: dimension.mapas, eventos: dimension.eventos, cajas: dimension.cajas }, asignado });
        for (const clave of ["mapas", "eventos", "cajas"]) {
          if (asignado[clave] !== dimension[clave]) problemas.push(`${dimension.perfil}.${clave}: ${asignado[clave]} ≠ ${dimension[clave]}`);
        }
      }
      return { total: problemas.length, veredicto: problemas.length ? "hallazgo" : "ok", universo: guion.dimensiones.length, detalle: { dimensiones: detalle.slice(0, 8), ejecutado: false }, muestras: problemas.map((motivo) => ({ detalle: motivo })) };
    },
  },

  /** Fichas presentes y con los campos del guion. */
  fichas_presentes: {
    titulo: "Ficha por sesión con sus campos",
    ejecutar() {
      return {
        total: fichasMedidas.faltantes.length,
        veredicto: fichasMedidas.faltantes.length ? "hallazgo" : "ok",
        universo: guion.sesiones.length,
        detalle: {
          presentes: fichasMedidas.presentes.length,
          conCampos: fichasMedidas.conCampos.length,
          total: guion.sesiones.length,
          ejecutado: false,
        },
        muestras: fichasMedidas.faltantes.slice(0, 6).map((falta) => ({ detalle: `sesión ${falta.sesion}: ${falta.motivo}` })),
      };
    },
  },

  /** La ficha define sus campos (tarea 2193) y la gravedad tiene los cuatro niveles. */
  ficha_campos: {
    titulo: "Ficha de sesión y niveles de gravedad definidos",
    ejecutar() {
      const readme = path.join(PLAYTEST, "README.md");
      const texto = fs.existsSync(readme) ? fs.readFileSync(readme, "utf8") : "";
      const normalizado = sinTildes(texto);
      const faltantes = CAMPOS_NUCLEO.filter((campo) => !normalizado.includes(campo));
      const gravedades = ["bloqueante", "grave", "leve", "cosmético"];
      const sinGravedad = gravedades.filter((gravedad) => !normalizado.includes(sinTildes(gravedad)));
      const problemas = [...faltantes.map((campo) => ({ detalle: `el README no documenta «${campo}»` })), ...sinGravedad.map((gravedad) => ({ detalle: `falta la gravedad «${gravedad}»` }))];
      return {
        total: problemas.length,
        veredicto: problemas.length ? "hallazgo" : "ok",
        universo: CAMPOS_NUCLEO.length + gravedades.length,
        detalle: { camposNucleo: CAMPOS_NUCLEO, camposDelGuion: guion.camposFicha.length, gravedades: gravedades.length, ejecutado: false },
        muestras: problemas.slice(0, 6),
      };
    },
  },

  /** Clasificación de hallazgos por gravedad en los tres sitios que la usan. */
  severidad: {
    titulo: "Gravedad declarada en guion, registro y plantilla",
    ejecutar() {
      const niveles = ["bloqueante", "grave", "leve", "cosmético"];
      const fuentes = {
        registro: JSON.stringify(registroRegresiones.plantilla ?? {}),
        guion: JSON.stringify(guion.politica ?? ""),
        ficha: fs.readFileSync(path.join(PLAYTEST, "README.md"), "utf8"),
        inventario: JSON.stringify(leerJson("content/lote5_fase023_playtest.json").severity ?? []),
      };
      const problemas = [];
      for (const [fuente, texto] of Object.entries(fuentes)) {
        for (const nivel of niveles) if (!texto.toLowerCase().includes(nivel)) problemas.push({ detalle: `${fuente} no menciona «${nivel}»` });
      }
      return { total: problemas.length, veredicto: problemas.length ? "hallazgo" : "ok", universo: niveles.length * Object.keys(fuentes).length, detalle: { fuentes: Object.keys(fuentes), ejecutado: false }, muestras: problemas.slice(0, 6) };
    },
  },

  /** Puerta de regresión: estado medido, no prometido. */
  regresiones: {
    titulo: "Puerta de regresión con su regla aplicada",
    ejecutar() {
      const hallazgos = [];
      for (const sesion of guion.sesiones) {
        const ficha = path.join(ROOT, sesion.carpeta, "README.md");
        if (fs.existsSync(ficha)) hallazgos.push(...hallazgosDeFicha(fs.readFileSync(ficha, "utf8"), `sesion-${String(sesion.id).padStart(2, "0")}`));
      }
      const resultado = evaluarRegresiones(registroRegresiones, hallazgos);
      return {
        total: resultado.ok ? 0 : resultado.gravesSinPrueba.length,
        veredicto: resultado.ok ? "ok" : "hallazgo",
        universo: resultado.total,
        detalle: { hallazgos: resultado.total, graves: resultado.graves, porGravedad: resultado.porGravedad, porEstado: resultado.porEstado, ejecutado: false },
        muestras: resultado.gravesSinPrueba.slice(0, 6).map((problema) => ({ detalle: `${problema.sesion} ${problema.id}: ${problema.motivo}` })),
      };
    },
  },

  /** Registro de cobertura publicado y con la distinción indexado/ejercido. */
  cobertura_registro: {
    titulo: "Registro de cobertura publicado (indexado ≠ ejercido)",
    ejecutar() {
      const archivo = path.join(ROOT, "docs", "qa", "playtest_cobertura.md");
      if (!fs.existsSync(archivo)) return { total: 1, veredicto: "hallazgo", universo: 0, detalle: { existe: false, ejecutado: false }, muestras: [{ detalle: "falta docs/qa/playtest_cobertura.md" }] };
      const texto = fs.readFileSync(archivo, "utf8");
      const problemas = [];
      if (!/indexad/i.test(texto)) problemas.push({ detalle: "el registro no distingue lo indexado" });
      if (!/ejercid/i.test(texto)) problemas.push({ detalle: "el registro no distingue lo ejercido" });
      if (!texto.includes("19801")) problemas.push({ detalle: "el registro no cita el total de cajas medido" });
      const dimensionesCubiertas = guion.dimensiones.filter((dimension) => texto.includes(dimension.perfil)).length;
      if (dimensionesCubiertas !== guion.dimensiones.length) problemas.push({ detalle: `el registro nombra ${dimensionesCubiertas} de ${guion.dimensiones.length} dimensiones` });
      return { total: problemas.length, veredicto: problemas.length ? "hallazgo" : "ok", universo: guion.dimensiones.length, detalle: { dimensiones: dimensionesCubiertas, ejercido: 0, ejecutado: false }, muestras: problemas };
    },
  },

  /** Cobertura de jefes: cuántos jefes hay y cómo se reparten (sin inventar combates). */
  cupo_jefes: {
    titulo: "Jefes del DLC repartidos entre sesiones",
    ejecutar() {
      const jefes = corpus.cajas.filter((caja) => /jefe|campe|líder|guardi|Pokégod|Arceus|Espejo/i.test(`${caja.event} ${caja.map}`));
      const eventos = new Set(jefes.map((caja) => `${caja.mapId}:${caja.event}`));
      const dimensiones = new Set(jefes.map((caja) => caja.profile));
      const sinSesion = [...dimensiones].filter((dimension) => !guion.sesiones.some((sesion) => sesion.tipo === "contenido" && sesion.dimensiones.includes(dimension)));
      return {
        total: sinSesion.length,
        veredicto: sinSesion.length ? "hallazgo" : "ok",
        universo: eventos.size,
        detalle: { eventosDeJefe: eventos.size, cajas: jefes.length, dimensiones: [...dimensiones].sort(), sinSesionAsignada: sinSesion, ejecutado: false },
        muestras: sinSesion.map((dimension) => ({ detalle: `la dimensión ${dimension} tiene jefes y ninguna sesión de contenido` })),
      };
    },
  },

  /** Medallas y diplomas que una sesión debe obtener. */
  cupo_medallas: {
    titulo: "Medallas del DLC con dueño en el guion",
    ejecutar() {
      const lideres = leerJson("content/campanas_lideres.json").colocados ?? [];
      const atlas = 8; // ocho gimnasios de Atlas (sesión 13)
      const total = lideres.length + atlas;
      const sesionesQueLasCubren = guion.sesiones.filter((sesion) => sesion.tipo === "contenido" && sesion.dimensiones.some((dimension) => ["glazed", "light_platinum", "liquid_crystal", "tfoh", "unbound", "atlas"].includes(dimension)));
      const problemas = [];
      if (total !== 40) problemas.push({ detalle: `el registro da ${total} medallas y el plan declara 40` });
      if (!sesionesQueLasCubren.length) problemas.push({ detalle: "ninguna sesión de contenido recorre las campañas con medallas" });
      return { total: problemas.length, veredicto: problemas.length ? "hallazgo" : "ok", universo: total, detalle: { medallas: total, campana: lideres.length, atlas, sesiones: sesionesQueLasCubren.map((sesion) => sesion.id), ejecutado: false }, muestras: problemas };
    },
  },

  /** Scripts que la tanda cita: si el plan manda ejecutarlos, tienen que existir. */
  scripts_declarados: {
    titulo: "Scripts citados por la tanda declarados en package.json",
    ejecutar() {
      const citados = ["verify:all", "verify:mapas", "verify:playtest:regresiones", "verify:playtest:guion"];
      const faltan = citados.filter((nombre) => !paquete.scripts?.[nombre]);
      return { total: faltan.length, veredicto: faltan.length ? "hallazgo" : "ok", universo: citados.length, detalle: { citados, faltan, ejecutado: false }, muestras: faltan.map((nombre) => ({ detalle: `falta el script ${nombre}` })) };
    },
  },

  /** Una sesión concreta: instrumento listo y partida pendiente. */
  sesion_instrumentada: {
    titulo: "Sesión instrumentada con ficha y cuota",
    ejecutar(_corpus, ambito = {}) {
      const sesion = sesiones.get(ambito.sesion);
      if (!sesion) return { total: 1, veredicto: "hallazgo", universo: 0, detalle: { ejecutado: false }, muestras: [{ detalle: `la sesión ${ambito.sesion} no está en el guion` }] };
      const ficha = path.join(ROOT, sesion.carpeta, "README.md");
      const existe = fs.existsSync(ficha);
      return {
        total: existe ? 0 : 1,
        veredicto: existe ? "ok" : "hallazgo",
        universo: 1,
        detalle: {
          sesion: sesion.id,
          titulo: sesion.titulo,
          tipo: sesion.tipo,
          cuota: sesion.cuota,
          ficha: sesion.carpeta,
          estado: sesion.estado,
          ejecutado: false,
        },
        muestras: existe ? [] : [{ detalle: `falta la ficha ${sesion.carpeta}/README.md` }],
      };
    },
  },
};

/** Número de sesión citado por la tarea, si lo hay. */
function sesionDeTarea(texto) {
  const match = /Sesi[óo]n\s+(\d+)/i.exec(texto);
  return match ? Number(match[1]) : null;
}

const REGLAS = [
  { re: /guion de playtest con cuota de cobertura/i, sonda: "guion_cuotas" },
  { re: /Definir la ficha de sesi[óo]n/i, sonda: "ficha_campos" },
  { re: /Crear `docs\/qa\/playtest\/` y una carpeta por sesi[óo]n/i, sonda: "fichas_presentes" },
  { re: /Registrar cada sesi[óo]n con su ficha/i, sonda: "fichas_presentes" },
  { re: /Clasificar cada hallazgo por gravedad/i, sonda: "severidad" },
  { re: /Corregir los hallazgos bloqueantes/i, sonda: "regresiones" },
  { re: /Corregir los graves/i, sonda: "regresiones" },
  { re: /Agrupar los leves y cosm[ée]ticos/i, sonda: "regresiones" },
  { re: /ninguna correcci[óo]n de playtest rompa/i, sonda: "regresiones" },
  { re: /Reejecutar `npm run verify:all`/i, sonda: "scripts_declarados" },
  { re: /prueba de regresi[óo]n de cada hallazgo grave/i, sonda: "regresiones" },
  { re: /A[ñn]adir esas pruebas de regresi[óo]n/i, sonda: "regresiones" },
  { re: /la suite siga pasando despu[ée]s de cada a[ñn]adido/i, sonda: "scripts_declarados" },
  { re: /Medir el tiempo de cada sesi[óo]n/i, sonda: "guion_cuotas" },
  { re: /se cubra el 100 % del contenido/i, sonda: "cuota_100" },
  { re: /registro de cobertura en `docs\/qa\/playtest_cobertura\.md`/i, sonda: "cobertura_registro" },
  { re: /Marcar cada mapa visitado/i, sonda: "cobertura_registro" },
  { re: /ning[úu]n mapa del DLC quede sin visitar/i, sonda: "cuota_100" },
  { re: /ning[úu]n jefe del DLC quede sin combatir/i, sonda: "cupo_jefes" },
  { re: /ninguna medalla quede sin obtener/i, sonda: "cupo_medallas" },
  { re: /ning[úu]n di[áa]logo del DLC quede sin mostrarse/i, sonda: "cuota_dimensiones" },
  { re: /ninguna ruta quede sin recorrer/i, sonda: "cuota_dimensiones" },
  { re: /Revisar la cobertura por dimensi[óo]n/i, sonda: "cuota_dimensiones" },
  { re: /cambios hechos con el editor pasen `npm run verify:mapas`/i, sonda: "scripts_declarados" },
  { re: /cambios hechos con el editor no rompan los verificadores de regi[óo]n/i, sonda: "scripts_declarados" },
];

/** Las tareas «Sesión N: …» y «Verificar que …» de cada sesión van a su sonda. */
function reglaDeTarea(texto) {
  const sesion = sesionDeTarea(texto);
  if (sesion === null) return null;
  return { re: /./, sonda: "sesion_instrumentada", ambito: { sesion } };
}

const reglasConSesion = [
  ...REGLAS,
  // Al final: si la tarea nombra una sesión, manda su instrumento.
  { re: /./, sonda: "sesion_instrumentada", ambito: null, resolver: reglaDeTarea },
];

/**
 * Evaluador con resolución dinámica del ámbito: una tarea «Sesión 27: …» usa la
 * sonda de sesión con el número que cita, no una sonda genérica.
 */
function evaluar() {
  const estaticas = REGLAS.map((regla) => ({ ...regla }));
  const filas = [];
  const cache = new Map();
  for (const tarea of tanda.tareas) {
    const regla = estaticas.find((candidata) => candidata.re.test(tarea.texto)) ?? reglaDeTarea(tarea.texto);
    if (!regla) {
      filas.push({ id: tarea.id, tarea: tarea.texto, estado: "manual", carril: "playtest", motivo: "exige una partida o una decisión humana" });
      continue;
    }
    const ambito = regla.resolver ? regla.resolver(tarea.texto)?.ambito : regla.ambito;
    const clave = `${regla.sonda}|${JSON.stringify(ambito ?? {})}`;
    if (!cache.has(clave)) {
      const sonda = SONDAS_LOCALES[regla.sonda];
      if (!sonda) throw new Error(`sonda desconocida: ${regla.sonda}`);
      cache.set(clave, { ...sonda.ejecutar(corpus, ambito ?? {}), sonda: regla.sonda, titulo: sonda.titulo });
    }
    const salida = cache.get(clave);
    const estado = salida.veredicto === "ok"
      ? (salida.detalle && salida.detalle.ejecutado === false ? "instrumentado" : "verificado_auto")
      : salida.veredicto === "sin_datos" ? "sin_datos" : "hallazgo";
    filas.push({
      id: tarea.id,
      tarea: tarea.texto,
      estado,
      sonda: salida.sonda,
      ...(salida.total !== 0 ? { casos: salida.total } : {}),
      ...(salida.detalle ? { detalle: salida.detalle } : {}),
    });
  }
  const resumen = filas.reduce((acc, fila) => {
    const clave = fila.estado === "manual" ? `manual:${fila.carril}` : fila.estado;
    acc[clave] = (acc[clave] ?? 0) + 1;
    return acc;
  }, {});
  return {
    filas,
    resumen,
    sondas: [...cache.entries()].map(([clave, valor]) => ({
      clave,
      sonda: valor.sonda,
      titulo: valor.titulo,
      total: valor.total,
      veredicto: valor.veredicto,
      universo: valor.universo ?? null,
      detalle: valor.detalle ?? null,
      muestras: (valor.muestras ?? []).slice(0, 6),
    })),
  };
}

const evaluacion = evaluar();
const artefacto = {
  schema: "plan2700_tanda/1.0",
  fase: "002 — tanda 23 (líneas 2200–2299 de tareas.txt)",
  fuente: "tareas.txt",
  lineas: tanda.lineas,
  tareas: { total: tanda.tareas.length, primera: tanda.tareas[0].id, ultima: tanda.tareas.at(-1).id },
  resumen: evaluacion.resumen,
  contenido: {
    sesiones: guion.sesiones.length,
    sesionesConCuota: guion.sesiones.filter((sesion) => sesion.tipo === "contenido").length,
    sesionesDeSoporte: guion.sesiones.filter((sesion) => sesion.tipo === "soporte").length,
    fichas: fichasMedidas.presentes.length,
    fichasConCampos: fichasMedidas.conCampos.length,
    cuotaTotal: guion.control.sumaDeCuotas,
    totalesDeContenido: guion.totales,
    estado: "manual_pending",
  },
  sondas: evaluacion.sondas,
  filas: evaluacion.filas,
};

const rutaArtefacto = "content/plan2700_tanda23.json";
if (VERIFY) verificarArtefacto(rutaArtefacto, artefacto);
else escribirArtefacto(rutaArtefacto, artefacto);

if (JSON_OUT) {
  console.log(JSON.stringify(artefacto, null, 2));
  process.exit(0);
}

console.log(`Tanda 23 · líneas ${tanda.lineas[0]}–${tanda.lineas[1]} · tareas ${tanda.tareas[0].id}–${tanda.tareas.at(-1).id}`);
console.log(`  ${Object.entries(evaluacion.resumen).map(([estado, veces]) => `${estado} ${veces}`).join(" · ")}`);
console.log(`  ${guion.sesiones.length} sesiones · ${fichasMedidas.conCampos.length}/${guion.sesiones.length} fichas con campos · cuota ${guion.control.sumaDeCuotas.cajas} cajas`);
const problemas = evaluacion.filas.filter((fila) => fila.estado === "hallazgo");
for (const fila of problemas.slice(0, 10)) console.log(`   · ${fila.id} ${fila.sonda} → ${fila.casos ?? 0} caso(s): ${fila.tarea.slice(0, 78)}`);
if (VERIFY) console.log(`✔ ${rutaArtefacto} está al día.`);
else console.log(`✔ escrito ${rutaArtefacto}`);
