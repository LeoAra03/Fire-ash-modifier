#!/usr/bin/env node
/**
 * dialogos_formato_check.mjs — control de formato del volcado de diálogos.
 *
 * Cierra el carril de diálogos con una comprobación que corre en CI sobre
 * `content/plan2700_dialogos.json` y sobre `Data/System.rxdata`:
 *
 *   ERRORES (rompen el build)
 *     · caja vacía o de solo espacios;
 *     · código de escape que el motor no trata (la lista se lee de `Messages`
 *       en cada corrida, no de memoria);
 *     · `\v[N]` fuera de rango o sin nombre en `System.rxdata`, y `\sp[]` vacío;
 *     · comillas «» desbalanceadas, comillas rectas y `\l[]` (caja más alta);
 *   AVISOS (se cuentan y se publican, no rompen)
 *     · palabras pegadas tras puntuación, espacio doble, raya sin espacio;
 *     · `?`/`!` sin su signo de apertura;
 *     · cajas de una sola línea que no cierran frase (relleno mal hecho).
 *
 * Las reglas no viven aquí: viven en `tools/plan2700/tanda_textos_core.mjs`
 * (`REGLAS_FORMATO`), y esta herramienta solo las ejecuta, las imprime y las
 * autoprueba. Un cambio de criterio se hace una vez y lo ven todos.
 *
 * Uso:
 *   node tools/qa/dialogos_formato_check.mjs            # control de CI
 *   node tools/qa/dialogos_formato_check.mjs --json      # salida legible por máquina
 *   node tools/qa/dialogos_formato_check.mjs --selftest  # demuestra que detecta
 *   node tools/qa/dialogos_formato_check.mjs --verbose   # lista los avisos
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, analizarFormato, cargarCorpus, REGLAS_FORMATO } from "../plan2700/tanda_textos_core.mjs";

const ARGS = new Set(process.argv.slice(2));
const JSON_OUT = ARGS.has("--json");
const VERBOSE = ARGS.has("--verbose");
const SELFTEST = ARGS.has("--selftest");

/**
 * Autoprueba: cada regla debe disparar con una caja que la incumple y callar
 * con una caja correcta. Es la prueba de que el control no es decorativo
 * (tareas 2186, 2187, 2188 y 2189 del plan).
 */
function autoprueba() {
  const sistema = {
    variables: [null, { text: "POKEMOD PRUEBA" }],
    nombreVariable: (id) => (sistema.variables[id]?.text ?? "").trim(),
  };
  const codigos = new Set(["v", "sp", "c", "ch", "b"]);
  const caja = (crudo) => ({ mapId: 1, map: "Fixture", event: "Fixture", crudo, lines: [crudo], text: crudo });
  const casos = [
    { regla: "caja_vacia", texto: "   ", detecta: true },
    { regla: "codigo_desconocido", texto: "Prueba \\z[1] rara.", detecta: true },
    { regla: "variable_inexistente", texto: "Has resuelto \\v[999] registros.", detecta: true },
    { regla: "variable_inexistente", texto: "Has resuelto \\v[1] registros.", detecta: false },
    { regla: "hablante_vacio", texto: "\\sp[]Hola, Ash.", detecta: true },
    { regla: "comillas_desbalanceadas", texto: "Dice «hola y no cierra.", detecta: true },
    { regla: "comilla_recta", texto: 'Dice "hola" y se va.', detecta: true },
    { regla: "salto_forzado", texto: "Primera línea\\l[1]y sigue.", detecta: true },
    { regla: "raya_sin_espacio", texto: "Voy—dijo Ash—a la torre.", detecta: true },
    { regla: "doble_guion", texto: "Voy --dijo Ash-- a la torre.", detecta: true },
    { regla: "palabra_pegada", texto: "kid!What?You want?No.", detecta: true },
    { regla: "espacio_doble", texto: "Dos  espacios aquí.", detecta: true },
    { regla: "signo_apertura", texto: "¿Vienes? Sí! Claro", detecta: true },
    { regla: "signo_apertura", texto: "¿Vienes? ¡Claro!", detecta: false },
    { regla: "linea_unica_sin_cierre", texto: "La torre que abrió la primera grieta es la", detecta: true },
    { regla: "linea_unica_sin_cierre", texto: "La torre ya está cerrada.", detecta: false },
  ];
  const fallos = [];
  for (const caso of casos) {
    const regla = REGLAS_FORMATO.find((candidata) => candidata.id === caso.regla);
    if (!regla) { fallos.push(`la regla ${caso.regla} no existe en REGLAS_FORMATO`); continue; }
    const detalle = regla.probar(caja(caso.texto), codigos, sistema);
    const detectado = Boolean(detalle);
    if (detectado !== caso.detecta) {
      fallos.push(`${caso.regla}: esperaba ${caso.detecta ? "detectar" : "no detectar"} «${caso.texto}»`);
    }
  }
  // La caja limpia no puede disparar ninguna regla con severidad de error.
  const limpia = caja("\\sp[Oak]Ash, la grieta ya está cerrada. ¿Descansas un momento?");
  for (const regla of REGLAS_FORMATO.filter((r) => r.severidad === "error")) {
    const detalle = regla.probar(limpia, codigos, sistema);
    if (detalle) fallos.push(`la caja limpia dispara ${regla.id}: ${detalle}`);
  }
  // El criterio de anchura de la caja no se reimplementa aquí: lo mide
  // `npm run verify:evento_terminado` con el ancho de 53 columnas del motor.
  if (fallos.length) {
    console.error(`✘ Autoprueba del control de formato: ${fallos.length} fallo(s)`);
    for (const fallo of fallos) console.error(`   · ${fallo}`);
    process.exit(1);
  }
  console.log(`✔ Autoprueba del control de formato: ${casos.length + 1} casos, ${REGLAS_FORMATO.length} reglas, 0 fallos`);
  return true;
}

if (SELFTEST) {
  autoprueba();
  process.exit(0);
}

const corpus = cargarCorpus();
const informe = analizarFormato(corpus.cajas, corpus.codigos, corpus.sistema);
const avisosPorRegla = {};
for (const aviso of informe.avisos) avisosPorRegla[aviso.regla] = (avisosPorRegla[aviso.regla] ?? 0) + 1;

if (JSON_OUT) {
  console.log(JSON.stringify({
    schema: "dialogos_formato/1.0",
    fuente: "content/plan2700_dialogos.json",
    cajas: informe.cajas,
    codigosDelMotor: [...corpus.codigos].sort(),
    errores: { total: informe.errores.length, porRegla: Object.fromEntries(Object.entries(informe.porRegla).filter(([id]) => REGLAS_FORMATO.find((r) => r.id === id)?.severidad === "error")) },
    avisos: { total: informe.avisos.length, porRegla: avisosPorRegla },
    muestras: { errores: informe.errores.slice(0, 10), avisos: informe.avisos.slice(0, 10) },
  }, null, 2));
  process.exit(informe.errores.length ? 1 : 0);
}

const porSeveridad = (severidad) => REGLAS_FORMATO.filter((regla) => regla.severidad === severidad)
  .filter((regla) => informe.porRegla[regla.id])
  .map((regla) => `${regla.id} ${informe.porRegla[regla.id]}`);

console.log(`Control de formato de diálogos · ${informe.cajas} cajas · ${corpus.codigos.size} códigos de escape reconocidos por el motor`);
console.log(`  errores: ${informe.errores.length}${informe.errores.length ? ` (${porSeveridad("error").join(" · ")})` : ""}`);
console.log(`  avisos: ${informe.avisos.length}${informe.avisos.length ? ` (${porSeveridad("aviso").join(" · ")})` : ""}`);
if (informe.errores.length) {
  for (const caso of informe.errores.slice(0, 10)) {
    console.log(`  ✘ ${caso.regla} · Map${caso.mapId} · ${caso.evento ?? "?"}: ${caso.detalle}`);
  }
  console.error("El volcado de diálogos tiene errores de formato: corrígelos antes de fusionar.");
  process.exit(1);
}
if (VERBOSE && informe.avisos.length) {
  for (const caso of informe.avisos.slice(0, 40)) {
    console.log(`  · ${caso.regla} · Map${caso.mapId} · ${caso.evento ?? "?"}: ${caso.detalle} → ${String(caso.texto).slice(0, 70)}`);
  }
}
const ruta = path.relative(ROOT, path.join(ROOT, "content", "plan2700_dialogos.json"));
console.log(`  fuente: ${ruta} (regenerar con «node tools/plan2700/audit_dialogos.mjs --write»)`);
console.log("✔ Formato de diálogos sin errores.");
