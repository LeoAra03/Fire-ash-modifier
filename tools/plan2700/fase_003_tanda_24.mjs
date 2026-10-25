#!/usr/bin/env node
/**
 * fase_003_tanda_24.mjs — tanda 24 (líneas 2300–2399 de `tareas.txt`).
 *
 * Carril de rendimiento: cierre del playtest (acta, sesiones 54–60), presupuesto
 * de densidad por mapa exigido en CI, peso de Data/Graphics/Audio, audio
 * duplicado, paquete/ZIP y peso del repositorio.
 *
 * Regla de estado, heredada de las tandas 22 y 23:
 *   verificado_auto  la comprobación se ejecuta entera aquí (verificadores del paquete, mediciones).
 *   instrumentado    el instrumento está medido y guardado, pero la aceptación exige una persona.
 *   manual:<carril>  no hay forma de cerrarlo desde el repositorio: hardware, audio o playtest.
 *   hallazgo         el repositorio contradice la tarea (herramienta, acta o Script ausentes).
 *
 * Uso:
 *   node tools/plan2700/fase_003_tanda_24.mjs            # escribe artefacto
 *   node tools/plan2700/fase_003_tanda_24.mjs --verify   # comprueba que sigue al día
 *   node tools/plan2700/fase_003_tanda_24.mjs --json     # salida legible por máquina
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { marshalLoad } from "../../web/js/marshal.js";
import { mapListFromInfos, parseMap } from "../../web/js/rmxp.js";
import { ROOT, cargarCorpus, cargarTanda, escribirArtefacto, verificarArtefacto } from "./tanda_textos_core.mjs";

const VERIFY = process.argv.includes("--verify");
const JSON_OUT = process.argv.includes("--json");
const LINEAS = { desdeLinea: 2300, hastaLinea: 2399 };

const corpus = cargarCorpus();
const tanda = cargarTanda(LINEAS);
const leerJson = (relativa) => JSON.parse(fs.readFileSync(path.join(ROOT, relativa), "utf8"));
const existe = (relativa) => fs.existsSync(path.join(ROOT, relativa));
const leer = (relativa) => fs.readFileSync(path.join(ROOT, relativa), "utf8");

const guion = leerJson("content/plan2700_playtest_guion.json");
const rendimiento = leerJson("content/plan2700_rendimiento.json");
const presupuestoArtefacto = leerJson("content/artifact_budget.json");
const baseline = leerJson("content/lote5_fase024_performance.json");
const paquete = leerJson("package.json");
const workflow = leer(".github/workflows/build-apk.yml");
const sesiones = new Map(guion.sesiones.map((sesion) => [sesion.id, sesion]));
const MIB = 1048576;

/** Ejecuta un verificador del proyecto y devuelve su resultado sin ruido. */
function verificar(script, args = []) {
  try {
    execFileSync(process.execPath, [script, ...args], { cwd: ROOT, stdio: "pipe" });
    return { ok: true };
  } catch (error) {
    const salida = `${error.stdout ?? ""}${error.stderr ?? ""}`.trim().split("\n").slice(-2).join(" · ");
    return { ok: false, salida: salida.slice(0, 240) };
  }
}

/** Entradas de MapInfos.rxdata — el árbol que muestra el editor. */
function cargarInfos(data) {
  return mapListFromInfos(marshalLoad(fs.readFileSync(path.join(data, "MapInfos.rxdata"))));
}

/** Recorre un árbol y devuelve rutas relativas estándar. */
function recorrer(raiz, relativo = "", acc = []) {
  if (!fs.existsSync(raiz)) return acc;
  for (const entrada of fs.readdirSync(raiz, { withFileTypes: true })) {
    const rel = relativo ? `${relativo}/${entrada.name}` : entrada.name;
    if (entrada.isDirectory()) recorrer(path.join(raiz, entrada.name), rel, acc);
    else acc.push(rel);
  }
  return acc;
}

/** Lista de entradas de un ZIP; `null` si la herramienta no está disponible. */
function entradasZip(absoluto) {
  try {
    const salida = execFileSync("unzip", ["-Z1", absoluto], { encoding: "utf8", maxBuffer: 32 * MIB });
    return salida.split(/\r?\n/).filter(Boolean);
  } catch {
    return null;
  }
}

const PATRON_PARTIDA = /(?:^|\/)(?:Save\d*\.rxdata|Game\.rvdata|PokeModBackups\/|.*\.sav$|.*\.bak$|.*\.tmp$)/i;
const PATRON_ANALISIS = /(?:^|\/)(?:content\/|tools\/|node_modules\/|xml\/|.*\.jsonl(?:\.gz)?$|.*\.xcf$)/i;

const SONDAS = {
  /** Sesión del guion: ficha preparada, partida pendiente. */
  sesion: {
    titulo: "Sesión del guion con ficha",
    ejecutar(_c, ambito = {}) {
      const sesion = sesiones.get(ambito.sesion);
      if (!sesion) return { total: 1, veredicto: "hallazgo", universo: 0, muestras: [{ detalle: `sesión ${ambito.sesion} ausente del guion` }] };
      const ficha = path.join(ROOT, sesion.carpeta, "README.md");
      const ok = fs.existsSync(ficha);
      return {
        total: ok ? 0 : 1,
        veredicto: ok ? "ok" : "hallazgo",
        universo: 1,
        detalle: { sesion: sesion.id, tipo: sesion.tipo, cuota: sesion.cuota, ficha: sesion.carpeta, ejecutado: false },
        muestras: ok ? [] : [{ detalle: `falta ${sesion.carpeta}/README.md` }],
      };
    },
  },

  /**
   * Acta de playtest: existe, enumera las 60 sesiones y **no** se firma en falso.
   * La firma es humana: la sonda sólo comprueba que el acta no miente.
   */
  acta: {
    titulo: "Acta de playtest honesta (sin firmar mientras no haya sesiones)",
    ejecutar() {
      const relativa = "docs/qa/playtest_acta.md";
      const ejecutadas = guion.sesiones.filter((sesion) => sesion.estado !== "manual_pending").length;
      const problemas = [];
      if (!existe(relativa)) {
        return { total: 1, veredicto: "hallazgo", universo: 0, carril: "playtest", muestras: [{ detalle: `falta ${relativa}` }] };
      }
      const texto = leer(relativa);
      const enlaces = (texto.match(/playtest\/sesion-\d+\/README\.md/g) ?? []).length;
      if (enlaces !== guion.sesiones.length) problemas.push({ detalle: `el acta enlaza ${enlaces} fichas y el guion tiene ${guion.sesiones.length}` });
      if (ejecutadas === 0 && !/SIN FIRMAR/i.test(texto)) problemas.push({ detalle: "no hay sesiones ejecutadas y el acta no dice SIN FIRMAR" });
      if (ejecutadas > 0 && !/firmad/i.test(texto)) problemas.push({ detalle: `${ejecutadas} sesiones ejecutadas y el acta no está firmada` });
      return {
        total: problemas.length,
        veredicto: problemas.length ? "hallazgo" : "manual",
        carril: "playtest",
        universo: guion.sesiones.length,
        detalle: { sesiones: guion.sesiones.length, ejecutadas, enlaces },
        motivo: "firmar el acta exige ejecutar las 60 sesiones; el acta existe y declara 0 firmadas",
        muestras: problemas,
      };
    },
  },

  /** Presupuesto por mapa: artefacto, acta, script, puerta en CI y enlace desde el doc de rendimiento. */
  presupuesto: {
    titulo: "Presupuesto de eventos y procesos por mapa exigido en CI",
    ejecutar() {
      const problemas = [];
      if (rendimiento.resultado.sinDeclarar > 0) problemas.push({ detalle: `${rendimiento.resultado.sinDeclarar} excesos sin excepción declarada` });
      if (!existe("docs/qa/rendimiento_presupuesto.md")) problemas.push({ detalle: "falta el acta del presupuesto" });
      if (!paquete.scripts?.["verify:rendimiento:presupuesto"]) problemas.push({ detalle: "falta el script verify:rendimiento:presupuesto" });
      if (!workflow.includes("verify:rendimiento:presupuesto")) problemas.push({ detalle: "CI no ejecuta el presupuesto" });
      if (!existe("docs/qa/rendimiento.md") || !leer("docs/qa/rendimiento.md").includes("rendimiento_presupuesto.md")) {
        problemas.push({ detalle: "rendimiento.md no enlaza el presupuesto por mapa" });
      }
      return {
        total: problemas.length,
        veredicto: problemas.length ? "hallazgo" : "ok",
        universo: rendimiento.medicion.mapas,
        detalle: {
          mapasConHuella: rendimiento.resultado.mapasConHuella,
          excesos: rendimiento.resultado.excesos,
          deudas: rendimiento.resultado.deudas.length,
          techos: rendimiento.presupuesto,
          ejecutado: false,
        },
        muestras: problemas,
      };
    },
  },

  /** Peso del juego medido y comparado con la línea base del plan. */
  pesos: {
    titulo: "Peso de Data, Graphics y Audio medido y comparado con la línea base",
    ejecutar() {
      const pesos = rendimiento.medicion.pesos;
      const problemas = [];
      const deltas = {};
      for (const carpeta of ["Data", "Graphics", "Audio"]) {
        if (!pesos[carpeta]?.bytes) problemas.push({ detalle: `${carpeta} sin medir` });
        const clave = `${carpeta.toLowerCase()}Bytes`;
        if (baseline.static?.[clave]) deltas[carpeta] = pesos[carpeta].bytes - baseline.static[clave];
      }
      return {
        total: problemas.length,
        veredicto: problemas.length ? "hallazgo" : "ok",
        universo: 3,
        detalle: {
          mib: Object.fromEntries(Object.entries(pesos).map(([carpeta, datos]) => [carpeta, datos.mib])),
          deltasBytes: deltas,
          lineaBase: "content/lote5_fase024_performance.json",
        },
        muestras: problemas,
      };
    },
  },

  /** Audio: cero bytes, duplicados, referencias y nombres pedidos sin archivo. */
  audio: {
    titulo: "Audio sin archivos vacíos y con referencias medidas",
    ejecutar() {
      const audio = rendimiento.medicion.audio;
      const problemas = [];
      if (audio.ceroBytes.length) problemas.push({ detalle: `${audio.ceroBytes.length} archivos de cero bytes` });
      if (!audio.gruposDuplicados) problemas.push({ detalle: "no se midieron duplicados: ¿se saltó la carpeta Audio?" });
      if (!audio.referencias) problemas.push({ detalle: "no se midieron referencias de audio" });
      return {
        total: problemas.length,
        veredicto: problemas.length ? "hallazgo" : "ok",
        universo: audio.archivos,
        detalle: {
          archivos: audio.archivos,
          ceroBytes: audio.ceroBytes.length,
          gruposDuplicados: audio.gruposDuplicados,
          archivosDuplicados: audio.archivosDuplicados,
          gruposConReferencias: audio.gruposConReferencias,
          gruposSinReferencias: audio.gruposSinReferencias,
          referencias: audio.referencias,
          faltantes: audio.faltantes,
          ejecutado: false,
        },
        muestras: problemas,
      };
    },
  },

  /** Duplicados de audio: medidos y **no** borrados, con el motivo escrito. */
  audio_deuda: {
    titulo: "Duplicados exactos de audio: inventario y decisión",
    ejecutar() {
      const audio = rendimiento.medicion.audio;
      const problemas = audio.gruposDuplicados ? [] : [{ detalle: "no hay inventario de duplicados" }];
      return {
        total: problemas.length,
        veredicto: problemas.length ? "hallazgo" : "manual",
        carril: "audio",
        universo: audio.gruposDuplicados,
        detalle: {
          gruposDuplicados: audio.gruposDuplicados,
          archivosDuplicados: audio.archivosDuplicados,
          gruposSinReferencias: audio.gruposSinReferencias,
          mibPotenciales: Number((audio.ahorroPotencialBytes / MIB).toFixed(2)),
          decision: "no se borra audio sin una sesión que lo escuche: el motor puede cargar pistas por nombre construido",
        },
        motivo: "el recorte destructivo exige escuchar el juego; hoy quedan medidos con dueño",
        muestras: (audio.grupos ?? []).slice(0, 3).map((grupo) => ({ detalle: grupo.archivos.join(" = "), texto: `${grupo.referenciados}/${grupo.archivos.length} referenciados` })),
      };
    },
  },

  /** Paquete y ZIP: verificadores propios + entrada a entrada (partidas, backups, análisis). */
  paquete: {
    titulo: "Paquete y ZIP verificados de verdad",
    ejecutar() {
      const problemas = [];
      const entregables = (presupuestoArtefacto.entregables ?? []).map((entrada) => entrada.ruta);
      const verificadores = [
        ["build_direct_package", verificar("tools/build_direct_package.mjs", ["--verify"])],
        ["sync_paquete_directo", verificar("tools/sync_paquete_directo.mjs", ["--verify"])],
        ["refresh_corregido_zip", verificar("tools/refresh_corregido_zip.mjs", ["--verify"])],
      ];
      for (const [nombre, resultado] of verificadores) {
        if (!resultado.ok) problemas.push({ detalle: `${nombre} falla: ${resultado.salida}` });
      }
      const zips = [];
      let bytesEntregables = 0;
      for (const relativa of entregables) {
        const absoluto = path.join(ROOT, relativa);
        if (!fs.existsSync(absoluto)) {
          problemas.push({ detalle: `falta el entregable ${relativa}` });
          continue;
        }
        const bytes = fs.statSync(absoluto).size;
        bytesEntregables += bytes;
        if (!relativa.endsWith(".zip")) continue;
        const entradas = entradasZip(absoluto);
        const partida = (entradas ?? []).filter((entrada) => PATRON_PARTIDA.test(entrada));
        const analisis = (entradas ?? []).filter((entrada) => PATRON_ANALISIS.test(entrada));
        if (entradas === null) problemas.push({ detalle: `no se pudo leer ${relativa}` });
        if (partida.length) problemas.push({ detalle: `${relativa} incluye ${partida.length} archivo(s) de partida/backup: ${partida.slice(0, 3).join(", ")}` });
        if (analisis.length) problemas.push({ detalle: `${relativa} incluye ${analisis.length} archivo(s) de análisis: ${analisis.slice(0, 3).join(", ")}` });
        zips.push({ ruta: relativa, mib: Number((bytes / MIB).toFixed(2)), entradas: entradas?.length ?? null, partida: partida.length, analisis: analisis.length });
      }
      const mibEntregables = Number((bytesEntregables / MIB).toFixed(2));
      const justificacion = (presupuestoArtefacto.justificaciones ?? []).find((entrada) => entrada.id === "entregables");
      const techo = justificacion ? justificacion.techo_mb : presupuestoArtefacto.limite_sesion_mb;
      if (mibEntregables > techo) problemas.push({ detalle: `los entregables suman ${mibEntregables} MiB y el techo justificado es ${techo} MiB` });
      return {
        total: problemas.length,
        veredicto: problemas.length ? "hallazgo" : "ok",
        universo: entregables.length,
        detalle: {
          verificadores: Object.fromEntries(verificadores.map(([nombre, resultado]) => [nombre, resultado.ok])),
          zips,
          mibEntregables,
          techoMiB: techo,
          justificado: Boolean(justificacion),
        },
        muestras: problemas,
      };
    },
  },

  /** Repositorio: .gitignore y archivos por encima del techo, con dueño declarado. */
  repositorio: {
    titulo: "Higiene del repositorio y archivos por encima de 20 MiB",
    ejecutar() {
      const gitignore = leer(".gitignore");
      const problemas = [];
      for (const patron of ["Save*.rxdata", "*.zip", "node_modules", "PokeModBackups"]) {
        if (!gitignore.includes(patron)) problemas.push({ detalle: `.gitignore no cubre ${patron}` });
      }
      const entregables = new Set((presupuestoArtefacto.entregables ?? []).map((entrada) => entrada.ruta));
      const extensionesInsumo = new Set(presupuestoArtefacto.insumos?.extensiones ?? []);
      const grandes = rendimiento.medicion.grandes.grandes ?? [];
      const sinDeclarar = grandes.filter((archivo) => !entregables.has(archivo.ruta) && !extensionesInsumo.has(path.extname(archivo.ruta).toLowerCase()));
      return {
        total: problemas.length + sinDeclarar.length,
        veredicto: problemas.length + sinDeclarar.length ? "hallazgo" : "ok",
        universo: grandes.length,
        detalle: {
          techoMiB: rendimiento.medicion.grandes.techoMiB,
          sobreTecho: grandes.length,
          rutas: grandes.map((archivo) => ({ ruta: archivo.ruta, mib: archivo.mib })),
          sinDeclarar: sinDeclarar.map((archivo) => ({ ruta: archivo.ruta, mib: archivo.mib })),
        },
        muestras: [...problemas, ...sinDeclarar.map((archivo) => ({ detalle: `${archivo.ruta} ocupa ${archivo.mib} MiB y no está declarado` }))].slice(0, 6),
      };
    },
  },

  /** Documento de rendimiento: cifras medidas y pendientes de hardware dichos sin ambigüedad. */
  rendimiento_doc: {
    titulo: "Documento de rendimiento con lo medido y lo pendiente",
    ejecutar() {
      const relativa = "docs/qa/rendimiento.md";
      const problemas = [];
      if (!existe(relativa)) return { total: 1, veredicto: "hallazgo", universo: 0, carril: "hardware", muestras: [{ detalle: `falta ${relativa}` }] };
      const texto = leer(relativa);
      if (!texto.includes("rendimiento_presupuesto.md")) problemas.push({ detalle: "el documento no enlaza el presupuesto por mapa" });
      if (!texto.includes("plan2700_rendimiento.json")) problemas.push({ detalle: "el documento no apunta al artefacto que lo respalda" });
      if (!/pendiente/i.test(texto)) problemas.push({ detalle: "el documento no declara lo que queda pendiente de hardware" });
      return {
        total: problemas.length,
        veredicto: problemas.length ? "hallazgo" : "manual",
        carril: "hardware",
        universo: 1,
        detalle: { ejecutado: false, medicion: "content/plan2700_rendimiento.json" },
        motivo: "las cifras estáticas están medidas; el tiempo de arranque exige la máquina y la versión usadas",
        muestras: problemas,
      };
    },
  },

  /**
   * Kirin/Android ejecutado de verdad: corre `tools/kirin_check.py` y comprueba
   * además las dos invariantes que el acta de FASE 31 fija — 0 `.rgssad` y que
   * las colisiones de mayúsculas no crezcan de 14.
   */
  kirin: {
    titulo: "Chequeo Kirin ejecutado sobre la carpeta del juego",
    ejecutar() {
      const problemas = [];
      let salida = "";
      try {
        salida = execFileSync("python3", ["tools/kirin_check.py", "pokemon_fire_ash"], { cwd: ROOT, encoding: "utf8", stdio: "pipe", maxBuffer: 8 * MIB });
      } catch (error) {
        salida = `${error.stdout ?? ""}${error.stderr ?? ""}`;
        problemas.push({ detalle: `kirin_check no termina bien: ${String(error.message).slice(0, 140)}` });
      }
      const resumen = /Resultado:\s*(\d+)\s*errores?,\s*(\d+)\s*avisos?/i.exec(salida);
      const errores = resumen ? Number(resumen[1]) : null;
      const avisos = resumen ? Number(resumen[2]) : null;
      if (errores === null) problemas.push({ detalle: "no se pudo leer el resultado de kirin_check" });
      if (errores > 0) problemas.push({ detalle: `Kirin reporta ${errores} error(es)` });
      const archivos = recorrer(path.join(ROOT, "pokemon_fire_ash"));
      const rgssad = archivos.filter((rel) => /\.rgss(?:ad|2a|3a)$/i.test(rel));
      if (rgssad.length) problemas.push({ detalle: `${rgssad.length} archivo(s) .rgssad cifrados: ${rgssad.slice(0, 3).join(", ")}` });
      const porMinuscula = new Map();
      for (const rel of archivos) {
        const clave = rel.toLowerCase();
        if (!porMinuscula.has(clave)) porMinuscula.set(clave, []);
        porMinuscula.get(clave).push(rel);
      }
      const colisiones = [...porMinuscula.values()].filter((lista) => lista.length > 1);
      if (colisiones.length > 14) problemas.push({ detalle: `las colisiones de mayúsculas crecieron a ${colisiones.length} (techo 14)` });
      const midis = /(\d+)\s*MIDIs/i.exec(salida);
      return {
        total: problemas.length,
        veredicto: problemas.length ? "hallazgo" : "ok",
        universo: archivos.length,
        detalle: {
          errores,
          avisos,
          rgssad: rgssad.length,
          colisionesMayusculas: colisiones.length,
          colisionesMaximas: 14,
          midis: midis ? Number(midis[1]) : null,
          carpetaPbs: !/sin carpeta PBS/i.test(salida),
          referenciasSinArchivo: rendimiento.medicion.audio.faltantes.length,
        },
        muestras: problemas,
      };
    },
  },

  /** Protocolo de recuperación de partida escrito y con sus pasos núcleo. */
  recuperacion: {
    titulo: "Protocolo de recuperación de partida utilizable",
    ejecutar() {
      const relativa = "docs/qa/recuperacion_partida.md";
      if (!existe(relativa)) return { total: 1, veredicto: "hallazgo", universo: 0, muestras: [{ detalle: `falta ${relativa}` }] };
      const texto = leer(relativa);
      const problemas = [];
      const pasos = (texto.match(/^## Paso \d+/gm) ?? []).length;
      if (pasos < 5) problemas.push({ detalle: `el protocolo tiene ${pasos} pasos numerados` });
      if (!texto.includes("Game.rxdata")) problemas.push({ detalle: "el protocolo no nombra el archivo de partida" });
      if (!/ficha de (la )?sesi[óo]n/i.test(texto)) problemas.push({ detalle: "el protocolo no indica dónde reportar" });
      return {
        total: problemas.length,
        veredicto: problemas.length ? "hallazgo" : "ok",
        universo: 1,
        detalle: { pasos, archivo: "Game.rxdata", declaraSinCopiaAutomatica: /no crea copias autom[áa]ticas/i.test(texto) },
        muestras: problemas,
      };
    },
  },

  /** Backups disponibles: el juego no copia la partida solo, y eso se dice. */
  backups: {
    titulo: "Copias disponibles antes de recuperar",
    ejecutar() {
      const carpeta = path.join(ROOT, "pokemon_fire_ash", "PokeModBackups");
      const existeCarpeta = fs.existsSync(carpeta);
      const protocolo = existe("docs/qa/recuperacion_partida.md") && /Copia antes de tocar nada/i.test(leer("docs/qa/recuperacion_partida.md"));
      return {
        total: protocolo ? 0 : 1,
        veredicto: protocolo ? "ok" : "hallazgo",
        universo: 2,
        detalle: {
          copiaAutomatica: false,
          carpetaPokeModBackups: existeCarpeta,
          pasoCopiaManual: protocolo,
          nota: "el juego no crea copias de Game.rxdata; el protocolo exige copiarlo antes de tocar nada",
          ejecutado: false,
        },
        muestras: protocolo ? [] : [{ detalle: "el protocolo no incluye el paso de copia previa" }],
      };
    },
  },

  /** Sprites de evento: cada nombre pedido por una página existe en Graphics/Characters. */
  sprites: {
    titulo: "Sprites de evento sin referencias ausentes",
    ejecutar() {
      const carpeta = path.join(ROOT, "pokemon_fire_ash", "Graphics", "Characters");
      const disponibles = new Set(recorrer(carpeta).map((rel) => rel.replace(/\.[^.]+$/, "").toLowerCase()));
      const SENTINELAS = new Set(["invisible"]);
      const data = path.join(ROOT, "pokemon_fire_ash", "Data");
      let referencias = 0;
      const faltan = new Map();
      for (const archivo of fs.readdirSync(data).filter((nombre) => /^Map\d+\.rxdata$/.test(nombre))) {
        const mapa = marshalLoad(fs.readFileSync(path.join(data, archivo)));
        for (const [, evento] of mapa.ivars.find(([clave]) => clave === "@events")?.[1]?.pairs ?? []) {
          for (const pagina of evento.getIvar("@pages") ?? []) {
            const nombre = pagina.getIvar("@graphic")?.getIvar?.("@character_name")?.text ?? "";
            if (!nombre) continue;
            referencias += 1;
            const clave = nombre.replace(/\.[^.]+$/, "").toLowerCase();
            if (SENTINELAS.has(clave)) continue;
            if (!disponibles.has(clave)) faltan.set(nombre, (faltan.get(nombre) ?? 0) + 1);
          }
        }
      }
      const ausentes = [...faltan.entries()].sort((a, b) => b[1] - a[1]).map(([nombre, usos]) => ({ nombre, usos }));
      return {
        total: ausentes.length,
        veredicto: ausentes.length ? "hallazgo" : "ok",
        universo: referencias,
        detalle: { sprites: disponibles.size, referencias, sentinelas: [...SENTINELAS], ausentes, ejecutado: false },
        muestras: ausentes.slice(0, 5).map((entrada) => ({ detalle: `sprite ${entrada.nombre} pedido ${entrada.usos} vez/veces y sin archivo` })),
      };
    },
  },

  /** Editor de mapas: el parser carga todos los mapas y el árbol tiene todas las entradas. */
  editor_carga: {
    titulo: "El editor carga todos los mapas compilados",
    ejecutar() {
      const data = path.join(ROOT, "pokemon_fire_ash", "Data");
      const archivos = fs.readdirSync(data).filter((nombre) => /^Map\d+\.rxdata$/.test(nombre));
      const fallos = [];
      for (const archivo of archivos) {
        try {
          parseMap(marshalLoad(fs.readFileSync(path.join(data, archivo))));
        } catch (error) {
          fallos.push({ archivo, error: String(error.message).slice(0, 120) });
        }
      }
      const infos = cargarInfos(data);
      return {
        total: fallos.length,
        veredicto: fallos.length ? "hallazgo" : "ok",
        universo: archivos.length,
        detalle: { mapas: archivos.length, fallos: fallos.length, entradasDeArbol: infos.length, ejecutado: false },
        muestras: fallos.slice(0, 5),
      };
    },
  },

  /** Scripts y descargas que la tanda manda usar. */
  scripts: {
    titulo: "Scripts citados por la tanda declarados",
    ejecutar() {
      const citados = ["verify:all", "kirin_check", "verify:presupuesto", "verify:package", "verify:corregido:zip", "verify:paquete", "verify:rendimiento:presupuesto"];
      const faltan = citados.filter((nombre) => !paquete.scripts?.[nombre]);
      return { total: faltan.length, veredicto: faltan.length ? "hallazgo" : "ok", universo: citados.length, detalle: { citados, faltan }, muestras: faltan.map((nombre) => ({ detalle: `falta ${nombre}` })) };
    },
  },

  descargas: {
    titulo: "Descarga del juego intacta",
    ejecutar() {
      const problemas = [];
      if (!existe("tools/download_game.py")) problemas.push({ detalle: "falta tools/download_game.py" });
      if (!existe("docs/INSTALAR_Y_JUGAR.md")) problemas.push({ detalle: "falta la guía de instalación" });
      if (existe("README.md") && !leer("README.md").includes("download_game.py")) problemas.push({ detalle: "README.md no menciona el descargador" });
      return { total: problemas.length, veredicto: problemas.length ? "hallazgo" : "ok", universo: 3, detalle: { ejecutado: false }, muestras: problemas };
    },
  },
};

/** Tareas que ninguna comprobación automática puede cerrar, con su carril. */
const MANUALES = {
  2311: { carril: "hardware", motivo: "medir el arranque con el DLC instalado exige hardware" },
  2313: { carril: "hardware", motivo: "tiempo de carga por región exige ejecutar el juego" },
  2314: { carril: "hardware", motivo: "corregir una carga lenta exige medirla primero" },
  2315: { carril: "hardware", motivo: "memoria en caliente exige medir el proceso" },
  2316: { carril: "hardware", motivo: "recortar eventos por memoria exige la medición previa" },
  2317: { carril: "hardware", motivo: "verificar que no se quitó contenido exige jugar lo recortado" },
  2318: { carril: "hardware", motivo: "tasa de refresco en Android/Kirin exige dispositivo" },
  2319: { carril: "hardware", motivo: "umbral de tasa de refresco exige dispositivo" },
  2320: { carril: "hardware", motivo: "ralentizaciones por clima/parallax exigen dispositivo" },
  2321: { carril: "hardware", motivo: "parallax de la Cima del Génesis exige dispositivo" },
  2322: { carril: "hardware", motivo: "ventisca de Monte Silver exige dispositivo" },
  2323: { carril: "hardware", motivo: "ciclo día/noche exige dispositivo" },
  2324: { carril: "hardware", motivo: "NPC móviles en hubs exigen dispositivo" },
  2325: { carril: "hardware", motivo: "autotiles de agua exigen dispositivo" },
  2355: { carril: "hardware", motivo: "arrancar en Kirin exige el dispositivo" },
  2356: { carril: "hardware", motivo: "arrancar en PC exige ejecutar el juego" },
  2357: { carril: "hardware", motivo: "arrancar sin conexión exige ejecutar el juego" },
  2378: { carril: "hardware", motivo: "tarjeta de memoria llena exige dispositivo y tarjeta" },
  2381: { carril: "playtest", motivo: "seguir el protocolo sin ayuda exige una persona que lo intente" },
  2394: { carril: "hardware", motivo: "el tiempo de apertura del editor exige medirlo en uso" },
  2395: { carril: "hardware", motivo: "permisos SAF exigen Android" },
  2338: { carril: "audio", motivo: "un salto audible en el bucle exige escuchar" },
  2339: { carril: "audio", motivo: "el equilibrio de volumen exige escuchar" },
  2340: { carril: "audio", motivo: "una saturación entre dos sonidos exige escuchar" },
};

/** Carril de una tarea manual por su texto, para no etiquetar todo como playtest. */
function carrilManual(texto) {
  if (/tasa de refresco|FPS|memoria|arranque|tiempo de carga|carga de cada|parallax|clima|ralentizaci/i.test(texto)) return "hardware";
  if (/audio|bucle|volumen|sonido|pista|satura/i.test(texto)) return "audio";
  return "playtest";
}

const REGLAS = [
  { re: /Firmar el acta de playtest/i, sonda: "acta" },
  { re: /Registrar el tiempo de arranque en `docs\/qa\/rendimiento\.md`/i, sonda: "rendimiento_doc" },
  { re: /presupuesto de eventos por mapa por perfil/i, sonda: "presupuesto" },
  { re: /presupuesto de procesos paralelos por mapa/i, sonda: "presupuesto" },
  { re: /ning[úu]n mapa supere su presupuesto sin justificaci[óo]n/i, sonda: "presupuesto" },
  { re: /mapas que hoy superan el presupuesto/i, sonda: "presupuesto" },
  { re: /Recortar los procesos paralelos redundantes/i, sonda: "presupuesto" },
  { re: /ning[úu]n recorte haya roto una escena autom[áa]tica/i, sonda: "presupuesto" },
  { re: /peso final de la carpeta `Data`/i, sonda: "pesos" },
  { re: /peso final de `Graphics`/i, sonda: "pesos" },
  { re: /peso final de `Audio`/i, sonda: "pesos" },
  { re: /Escribir el protocolo de recuperaci[óo]n de partida/i, sonda: "recuperacion" },
  { re: /existan los backups necesarios/i, sonda: "backups" },
  { re: /editor no se bloquee con los 3 ?468 mapas/i, sonda: "editor_carga" },
  { re: /editor muestre los mapas nuevos en su [áa]rbol/i, sonda: "editor_carga" },
  { re: /editor liste los NPC nuevos con su sprite correcto/i, sonda: "sprites" },
  { re: /Eliminar los duplicados exactos de audio/i, sonda: "audio_deuda" },
  { re: /ninguna eliminaci[óo]n de audio rompa una referencia/i, sonda: "audio" },
  { re: /audio del DLC est[ée] corrupto o a cero bytes/i, sonda: "audio" },
  { re: /peso del paquete final/i, sonda: "paquete" },
  { re: /paquete final no supere el l[íi]mite/i, sonda: "paquete" },
  { re: /ZIP ra[íi]z se pueda construir desde cero/i, sonda: "paquete" },
  { re: /ZIP ra[íi]z contenga todos los archivos nuevos/i, sonda: "paquete" },
  { re: /ZIP ra[íi]z no contenga archivos de partida ni backups/i, sonda: "paquete" },
  { re: /ZIP ra[íi]z no contenga los archivos de an[áa]lisis pesados/i, sonda: "paquete" },
  { re: /`\.gitignore` cubra todo/i, sonda: "repositorio" },
  { re: /veinte megabytes entre en el repositorio/i, sonda: "repositorio" },
  { re: /archivos grandes se gestionen por paquete/i, sonda: "repositorio" },
  { re: /descargas del juego sigan funcionando/i, sonda: "descargas" },
  { re: /kirin_check\.py game/i, sonda: "kirin" },
  { re: /aviso de Kirin/i, sonda: "kirin" },
  { re: /arranque en Kirin/i, sonda: "kirin" },
];

const sesionDeTarea = (texto) => {
  const match = /Sesi[óo]n\s+(\d+)/i.exec(texto);
  return match ? Number(match[1]) : null;
};

const filas = [];
const cache = new Map();
for (const tarea of tanda.tareas) {
  const sesion = sesionDeTarea(tarea.texto);
  const regla = REGLAS.find((candidata) => candidata.re.test(tarea.texto))
    ?? (sesion !== null ? { sonda: "sesion", ambito: { sesion } } : null);
  const manual = MANUALES[tarea.id];
  if (!regla && !manual) {
    filas.push({ id: tarea.id, tarea: tarea.texto, estado: `manual:${carrilManual(tarea.texto)}`, motivo: "exige partida o dispositivo: el repositorio no puede cerrarlo" });
    continue;
  }
  if (!regla && manual) {
    filas.push({ id: tarea.id, tarea: tarea.texto, estado: `manual:${manual.carril}`, motivo: manual.motivo });
    continue;
  }
  const clave = `${regla.sonda}|${JSON.stringify(regla.ambito ?? {})}`;
  if (!cache.has(clave)) {
    const sonda = SONDAS[regla.sonda];
    cache.set(clave, { ...sonda.ejecutar(corpus, regla.ambito ?? {}), sonda: regla.sonda, titulo: sonda.titulo });
  }
  const salida = cache.get(clave);
  const estado = salida.veredicto === "ok"
    ? (salida.detalle?.ejecutado === false ? "instrumentado" : "verificado_auto")
    : salida.veredicto === "manual" ? `manual:${salida.carril ?? "playtest"}`
      : salida.veredicto === "sin_datos" ? "sin_datos" : "hallazgo";
  filas.push({
    id: tarea.id,
    tarea: tarea.texto,
    estado,
    sonda: salida.sonda,
    ...(salida.total ? { casos: salida.total } : {}),
    ...(salida.detalle ? { detalle: salida.detalle } : {}),
    ...(salida.motivo ? { motivo: salida.motivo } : {}),
  });
}

const resumen = filas.reduce((acc, fila) => {
  acc[fila.estado] = (acc[fila.estado] ?? 0) + 1;
  return acc;
}, {});

const artefacto = {
  schema: "plan2700_tanda/1.0",
  fase: "003 — tanda 24 (líneas 2300–2399 de tareas.txt)",
  fuente: "tareas.txt",
  lineas: tanda.lineas,
  tareas: { total: tanda.tareas.length, primera: tanda.tareas[0].id, ultima: tanda.tareas.at(-1).id },
  resumen,
  medicion: {
    mapas: rendimiento.medicion.mapas,
    eventos: rendimiento.medicion.eventos,
    paginas: rendimiento.medicion.paginas ?? null,
    eventosAutomaticos: rendimiento.medicion.eventosAutomaticos,
    paginasAutomaticas: rendimiento.medicion.paginasAutomaticas,
    pesos: rendimiento.medicion.pesos,
    audio: {
      archivos: rendimiento.medicion.audio.archivos,
      ceroBytes: rendimiento.medicion.audio.ceroBytes.length,
      gruposDuplicados: rendimiento.medicion.audio.gruposDuplicados,
      archivosDuplicados: rendimiento.medicion.audio.archivosDuplicados,
      gruposSinReferencias: rendimiento.medicion.audio.gruposSinReferencias,
      mibPotenciales: Number((rendimiento.medicion.audio.ahorroPotencialBytes / MIB).toFixed(2)),
      referencias: rendimiento.medicion.audio.referencias,
      faltantes: rendimiento.medicion.audio.faltantes,
    },
    repositorio: {
      techoMiB: rendimiento.medicion.grandes.techoMiB,
      sobreTecho: rendimiento.medicion.grandes.grandes.length,
      rutas: rendimiento.medicion.grandes.grandes.map((archivo) => archivo.ruta),
    },
    presupuesto: {
      techos: rendimiento.presupuesto,
      excesos: rendimiento.resultado.excesos,
      deudas: rendimiento.resultado.deudas.length,
      sinDeclarar: rendimiento.resultado.sinDeclarar,
    },
  },
  sondas: [...cache.entries()].map(([clave, valor]) => ({
    clave,
    sonda: valor.sonda,
    titulo: valor.titulo,
    total: valor.total,
    veredicto: valor.veredicto,
    universo: valor.universo ?? null,
    detalle: valor.detalle ?? null,
    motivo: valor.motivo ?? null,
    muestras: (valor.muestras ?? []).slice(0, 6),
  })),
  filas,
};

const rutaArtefacto = "content/plan2700_tanda24.json";
if (VERIFY) verificarArtefacto(rutaArtefacto, artefacto);
else escribirArtefacto(rutaArtefacto, artefacto);

if (JSON_OUT) {
  console.log(JSON.stringify(artefacto, null, 2));
  process.exit(0);
}

console.log(`Tanda 24 · líneas ${tanda.lineas[0]}–${tanda.lineas[1]} · tareas ${tanda.tareas[0].id}–${tanda.tareas.at(-1).id}`);
console.log(`  ${Object.entries(resumen).map(([estado, veces]) => `${estado} ${veces}`).join(" · ")}`);
console.log(`  ${rendimiento.medicion.mapas} mapas · ${rendimiento.medicion.eventos} eventos · ${rendimiento.medicion.eventosAutomaticos} automáticos · audio ${rendimiento.medicion.audio.gruposDuplicados} grupos duplicados · ${rendimiento.medicion.grandes.grandes.length} archivo(s) sobre ${rendimiento.medicion.grandes.techoMiB} MiB`);
for (const fila of filas.filter((fila) => fila.estado === "hallazgo").slice(0, 10)) console.log(`   · ${fila.id} ${fila.sonda} → ${fila.casos ?? 0} caso(s): ${fila.tarea.slice(0, 74)}`);
if (VERIFY) console.log(`✔ ${rutaArtefacto} está al día.`);
else console.log(`✔ escrito ${rutaArtefacto}`);
