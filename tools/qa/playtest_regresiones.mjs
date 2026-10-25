#!/usr/bin/env node
/**
 * playtest_regresiones.mjs — puerta de regresión de los hallazgos de playtest.
 *
 * El plan pide (tareas 2234–2236) que **cada hallazgo grave corregido tenga su
 * prueba de regresión** y que esas pruebas entren en la suite. Esta herramienta
 * es la puerta que lo hace cumplir sin inventar hallazgos:
 *
 *   · lee las fichas de `docs/qa/playtest/<sesion>/README.md` y extrae los bloques de
 *     hallazgo (ID, Gravedad, Estado, Regresión añadida);
 *   · un hallazgo `bloqueante` o `grave` en estado `corregido` exige una prueba
 *     existente (`.mjs`) y ejecutable: sin prueba, la verificación falla;
 *   · un hallazgo `abierto` no exige prueba todavía, pero se cuenta y se publica;
 *   · `--selftest` demuestra los tres casos con fichas de fixture, para que la
 *     puerta no pueda pasar por estar vacía.
 *
 * Uso:
 *   node tools/qa/playtest_regresiones.mjs            # puerta de CI
 *   node tools/qa/playtest_regresiones.mjs --json     # salida legible por máquina
 *   node tools/qa/playtest_regresiones.mjs --selftest # demuestra que detecta
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ROOT } from "../plan2700/tanda_textos_core.mjs";

const COMO_CLI = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
const ARGS = new Set(COMO_CLI ? process.argv.slice(2) : []);
const JSON_OUT = ARGS.has("--json");
const SELFTEST = ARGS.has("--selftest");
const REGISTRO = path.join(ROOT, "content", "playtest_regresiones.json");
const PLAYTEST = path.join(ROOT, "docs", "qa", "playtest");
const GRAVES = new Set(["bloqueante", "grave"]);

/**
 * Extrae los hallazgos de una ficha. El formato está publicado en
 * `docs/qa/playtest/README.md`: pares «Campo: valor», un bloque por hallazgo,
 * separados por el ID.
 */
export function hallazgosDeFicha(texto, sesion) {
  const bloques = [];
  let actual = null;
  for (const linea of String(texto).split(/\r?\n/)) {
    const par = /^\s*(?:[-*]\s*)?([A-Za-zÁÉÍÓÚÑáéíóúñ ]+?)\s*:\s*(.*)$/.exec(linea);
    if (!par) continue;
    const campo = par[1].trim().toLowerCase();
    const valor = par[2].trim();
    if (!camposConocidos.has(campo)) continue;
    if (campo === "id" || !actual) {
      actual = { sesion, id: null, gravedad: null, estado: null, prueba: null, linea: null };
      bloques.push(actual);
    }
    if (campo === "id") actual.id = valor;
    if (campo === "gravedad") actual.gravedad = valor.toLowerCase();
    if (campo === "estado") actual.estado = valor.toLowerCase();
    if (campo === "regresión añadida" || campo === "regresion anadida" || campo === "prueba") actual.prueba = valor;
  }
  return bloques.filter((bloque) => bloque.id);
}

const camposConocidos = new Set(["id", "sesión", "sesion", "gravedad", "estado", "regresión añadida", "regresion anadida", "prueba", "mapa/evento", "pasos para reproducir", "esperado", "observado", "evidencia"]);

/** Aplica la regla a una lista de hallazgos ya extraídos. */
export function evaluar(registro, hallazgos, { existePrueba = (ruta) => fs.existsSync(path.join(ROOT, ruta)) } = {}) {
  const problemas = [];
  const gravesSinPrueba = [];
  for (const hallazgo of hallazgos) {
    const esGrave = GRAVES.has(hallazgo.gravedad);
    if (!hallazgo.gravedad) problemas.push({ ...hallazgo, motivo: "hallazgo sin gravedad" });
    if (hallazgo.estado === "corregido") {
      if (esGrave && !hallazgo.prueba) gravesSinPrueba.push({ ...hallazgo, motivo: "corregido sin prueba de regresión" });
      else if (esGrave && !existePrueba(hallazgo.prueba)) gravesSinPrueba.push({ ...hallazgo, motivo: `la prueba no existe: ${hallazgo.prueba}` });
      else if (esGrave && !/\.(?:mjs|js|test\.mjs)$/.test(hallazgo.prueba)) gravesSinPrueba.push({ ...hallazgo, motivo: `la prueba no es ejecutable por la suite: ${hallazgo.prueba}` });
    }
    if (hallazgo.estado === "verificado" && !hallazgo.prueba) problemas.push({ ...hallazgo, motivo: "verificado sin prueba que lo respalde" });
  }
  const porGravedad = hallazgos.reduce((acc, hallazgo) => {
    const clave = hallazgo.gravedad ?? "sin gravedad";
    acc[clave] = (acc[clave] ?? 0) + 1;
    return acc;
  }, {});
  const porEstado = hallazgos.reduce((acc, hallazgo) => {
    const clave = hallazgo.estado ?? "sin estado";
    acc[clave] = (acc[clave] ?? 0) + 1;
    return acc;
  }, {});
  return {
    ok: gravesSinPrueba.length === 0 && problemas.filter((problema) => problema.motivo !== "hallazgo sin gravedad").length === 0,
    total: hallazgos.length,
    graves: hallazgos.filter((hallazgo) => GRAVES.has(hallazgo.gravedad)).length,
    porGravedad,
    porEstado,
    gravesSinPrueba,
    problemas,
    registro: registro.regla,
  };
}

function leerHallazgosDeFichas() {
  if (!fs.existsSync(PLAYTEST)) return [];
  const hallazgos = [];
  for (const nombre of fs.readdirSync(PLAYTEST).filter((entrada) => /^sesion-\d+$/.test(entrada)).sort()) {
    const ficha = path.join(PLAYTEST, nombre, "README.md");
    if (!fs.existsSync(ficha)) continue;
    hallazgos.push(...hallazgosDeFicha(fs.readFileSync(ficha, "utf8"), nombre));
  }
  return hallazgos;
}

function selftest() {
  const registro = JSON.parse(fs.readFileSync(REGISTRO, "utf8"));
  const pruebas = { existePrueba: (ruta) => ruta === "tools/qa/playtest_regresiones.mjs" };
  const ficha = (gravedad, estado, prueba) => [
    "ID: PT-01",
    "Gravedad: " + gravedad,
    "Estado: " + estado,
    ...(prueba ? ["Regresión añadida: " + prueba] : []),
  ].join("\n");
  const casos = [
    { nombre: "grave corregido sin prueba", entrada: ficha("grave", "corregido", ""), espera: false },
    { nombre: "bloqueante corregido con prueba existente", entrada: ficha("bloqueante", "corregido", "tools/qa/playtest_regresiones.mjs"), espera: true },
    { nombre: "grave corregido con prueba inventada", entrada: ficha("grave", "corregido", "tools/qa/no_existe.mjs"), espera: false },
    { nombre: "grave abierto sin prueba (todavía)", entrada: ficha("grave", "abierto", ""), espera: true },
    { nombre: "leve corregido sin prueba (no la exige)", entrada: ficha("leve", "corregido", ""), espera: true },
    { nombre: "grave verificado sin prueba", entrada: ficha("grave", "verificado", ""), espera: false },
  ];
  const fallos = [];
  for (const caso of casos) {
    const hallazgos = hallazgosDeFicha(caso.entrada, "sesion-99");
    const resultado = evaluar(registro, hallazgos, pruebas);
    if (resultado.ok !== caso.espera) fallos.push(`${caso.nombre}: esperaba ok=${caso.espera} y salió ok=${resultado.ok}`);
    if (hallazgos.length !== 1) fallos.push(`${caso.nombre}: se esperaban 1 hallazgo y se leyeron ${hallazgos.length}`);
  }
  // Una ficha sin bloques no produce hallazgos: no se confunde el texto libre con un hallazgo.
  if (hallazgosDeFicha("Estado: manual_pending\nRegistrar fecha y duración.", "sesion-98").length !== 0) {
    fallos.push("una ficha vacía no puede producir hallazgos");
  }
  if (fallos.length) {
    console.error(`✘ Autoprueba de regresiones: ${fallos.length} fallo(s)`);
    for (const fallo of fallos) console.error(`   · ${fallo}`);
    process.exit(1);
  }
  console.log(`✔ Autoprueba de regresiones: ${casos.length + 1} casos, regla aplicada a mano y a máquina`);
}

if (!COMO_CLI) {
  // Importado como módulo: solo se expone la regla, no se ejecuta la puerta.
} else if (SELFTEST) {
  selftest();
  process.exit(0);
}

const registro = COMO_CLI ? JSON.parse(fs.readFileSync(REGISTRO, "utf8")) : null;
if (COMO_CLI) {
const hallazgosImportados = leerHallazgosDeFichas();
const hallazgos = hallazgosImportados;
const resultado = evaluar(registro, hallazgos);
const artefacto = {
  schema: "playtest_regresiones/1.0",
  fuente: "docs/qa/playtest/<sesion>/README.md",
  regla: registro.regla,
  hallazgos,
  resultado,
};
if (JSON_OUT) {
  console.log(JSON.stringify(artefacto, null, 2));
} else {
  console.log(`Regresiones de playtest · ${resultado.total} hallazgo(s) · ${resultado.graves} grave(s)/bloqueante(s)`);
  console.log(`  por gravedad: ${Object.entries(resultado.porGravedad).map(([clave, veces]) => `${clave} ${veces}`).join(" · ") || "—"}`);
  for (const problema of resultado.gravesSinPrueba.slice(0, 8)) console.log(`  ✘ ${problema.sesion} ${problema.id}: ${problema.motivo}`);
  if (!resultado.ok) {
    console.error("Hay hallazgos graves corregidos sin prueba de regresión.");
    process.exit(1);
  }
  console.log("✔ Ningún hallazgo grave corregido sin prueba de regresión.");
}
if (JSON_OUT && !resultado.ok) process.exit(1);
}
