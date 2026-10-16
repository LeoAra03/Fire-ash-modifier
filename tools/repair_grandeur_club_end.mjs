#!/usr/bin/env node
/**
 * repair_grandeur_club_end.mjs — quita el `end` sobrante de la sección
 * «Grandeur Club» en la copia de desarrollo del juego.
 *
 * El hallazgo (fase 39, `docs/DEFINICION_DE_TERMINADO_SCRIPTS.md`):
 * `pokemon_fire_ash/Data/Scripts.rxdata` tenía en «Grandeur Club» un `end` de
 * más justo después de `grandeurItemExchange`, en la línea 710, y la sección no
 * compilaba (`syntax error, unexpected 'end'`). Las tres copias de distribución
 * (`Scripts_corregido/`) sí compilaban: la corrección viajaba en el paquete y no
 * en el juego con el que se desarrolla. Lo produjo
 * `tools/apply_emergency_abra_and_free_tower.mjs`, que sustituía el método con
 * una expresión regular que contaba cuatro `end` del original y escribía un
 * reemplazo con los suyos propios.
 *
 * Esta herramienta:
 *   1. hace copia del archivo en `PokeModBackups/grandeur_club_end_originals/`
 *      antes de escribir (regla de oro del proyecto: todo cambio es reversible);
 *   2. quita sólo la línea del `end` sobrante, sin tocar el resto de la sección;
 *   3. vuelve a comprimir y a volcar el Marshal completo.
 *
 * Es idempotente: si la sección ya está bien, no escribe nada y lo dice.
 *
 * Uso:
 *   node tools/repair_grandeur_club_end.mjs              # repara la copia del juego
 *   node tools/repair_grandeur_club_end.mjs --verify     # sólo comprueba (exit 1 si sigue roto)
 *   node tools/repair_grandeur_club_end.mjs --selftest   # 6 reglas sobre secciones sintéticas
 *   npm run verify:grandeur:end                          # = --verify
 *
 * Comprobación de cierre de la fase 32: `npm run verify:ruby:full`
 * (tools/qa/ruby_syntax_full_check.mjs) compila las 409 secciones de los cuatro
 * paquetes y sale 0 sólo cuando ninguna tiene errores de sintaxis.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { marshalDump, marshalLoad } from "../web/js/marshal.js";
import { DATA, GAME, ROOT } from "./lib/fire_ash_registry.mjs";
import {
  dividirLineas,
  endSobranteTrasMetodo,
  equilibrioNivelSuperior,
  intervaloMetodo,
  quitarEndSobrante,
  reemplazarMetodo,
} from "./lib/ruby_method_patch.mjs";

const VERIFY_ONLY = process.argv.includes("--verify");
const SELFTEST = process.argv.includes("--selftest");

const SECCION = "Grandeur Club";
const METODO = "grandeurItemExchange";
const MARCA = "# PokeMod: Grandeur Club Free Items (0 Credits)";
const JUEGO = path.join(DATA, "Scripts.rxdata");
const BACKUP = path.join(GAME, "PokeModBackups", "grandeur_club_end_originals");
/** Copias de distribución: la corrección ya viaja en ellas y debe seguir ahí. */
const DISTRIBUCION = [
  "Scripts_corregido/Scripts.rxdata",
  "Scripts_corregido/Paquete_directo/Data/Scripts.rxdata",
  "Scripts_corregido/Dimensional_Nightmare_QA/Data/Scripts.rxdata",
];

function seccion(archivo, nombre = SECCION) {
  const scripts = marshalLoad(fs.readFileSync(archivo));
  const fila = scripts.find(([, titulo]) => titulo && titulo.text === nombre);
  if (!fila) throw new Error(`no se encontró la sección «${nombre}» en ${path.relative(ROOT, archivo)}`);
  const codigo = zlib.inflateSync(Buffer.from(fila[2].bytes)).toString("utf8");
  return { scripts, fila, codigo };
}

function guardar(fila, codigo) {
  fila[2].bytes = Uint8Array.from(zlib.deflateSync(Buffer.from(codigo, "utf8")));
}

// ---------------------------------------------------------------------------
// --selftest: seis reglas sobre secciones sintéticas, sin tocar el disco
// ---------------------------------------------------------------------------
function selftest() {
  let fallos = 0;
  const regla = (nombre, condicion, detalle = "") => {
    console.log(`${condicion ? "✔" : "✘"} ${nombre}${condicion || !detalle ? "" : `\n   ${detalle}`}`);
    if (!condicion) fallos++;
  };

  // La sección real usa CRLF; el texto inyectado por el instalador usa LF.
  // Los fixtures reproducen exactamente esa mezcla, que es donde se coló el `end`.
  const crlf = (lineas) => lineas.join("\r\n") + "\r\n";
  const MENSAJE = "        pbMessage(_INTL(\"\\\\CN\\\\bYou have no room in your Bag.\"))";

  /** Método original con `n` bloques internos: cierra con n+1 `end` indentados y el suyo en columna 0. */
  const original = (extras = 0) => crlf([
    `def ${METODO}(item,itemprice)`,
    "  if pbGet(GCVariables::GC_CREDITS) >= itemprice",
    "    if pbConfirm(_INTL(\"Buy {1}?\", GameData::Item.get(item).name))",
    "      if $PokemonBag.pbCanStore?(item,1)",
    ...Array.from({ length: extras }, (_, i) => `        if itemprice >= ${i}`),
    "        pbSet(GCVariables::GC_CREDITS, pbGet(GCVariables::GC_CREDITS) - itemprice)",
    "        pbReceiveItem(item,1)",
    ...Array.from({ length: extras }, () => "        end"),
    "      else",
    MENSAJE.slice(2),
    "      end",
    "    end",
    "  end",
    "end",
  ]);

  const seccionDe = (metodo, cola = "") => crlf(["def otro", "  pbMessage(_INTL(\"x\"))", "end", ""])
    + metodo + "\r\n" + crlf(["def givePassive", "  poke = 1", "end"]) + cola;

  const nuevo = [
    `def ${METODO}(item,itemprice=0)`,
    `  ${MARCA}`,
    "  itemprice = 0",
    "  maxitems = 99",
    "  if items > 0",
    "    if $PokemonBag.pbCanStore?(item, items)",
    "      pbReceiveItem(item,items)",
    "    else",
    "      pbMessage(_INTL(\"\\\\CN\\\\bYou have no room in your Bag.\"))",
    "    end",
    "  end",
    "end",
  ].join("\n");

  // 1. El reemplazo estructural deja la sección equilibrada y sin `end` sueltos.
  const sana = seccionDe(original(0));
  const sustituido = reemplazarMetodo(sana, METODO, nuevo);
  const equilibrio = equilibrioNivelSuperior(sustituido.codigo);
  regla("reemplazo estructural: 3 aperturas de nivel superior y 3 `end`, sin sobrantes",
    sustituido.reemplazado && equilibrio.equilibrado && equilibrio.aperturas === 3
    && !endSobranteTrasMetodo(sustituido.codigo, METODO).sobrante,
    JSON.stringify(equilibrio));

  // 2. Un original con más bloques internos se reemplaza igual: no se cuentan `end`.
  const profunda = seccionDe(original(2));
  const sustituidoProfundo = reemplazarMetodo(profunda, METODO, nuevo);
  const endsIndentados = (texto) => (texto.match(/^[ \t]+end[ \t]*\r?$/gm) || []).length;
  regla("reemplazo estructural: independiente de cuántos `end` indentados cierre el original",
    sustituidoProfundo.reemplazado
    && equilibrioNivelSuperior(sustituidoProfundo.codigo).equilibrado
    && !endSobranteTrasMetodo(sustituidoProfundo.codigo, METODO).sobrante
    && endsIndentados(sustituidoProfundo.anterior) === endsIndentados(sustituido.anterior) + 2,
    `ends indentados del original: ${endsIndentados(sustituido.anterior)} → ${endsIndentados(sustituidoProfundo.anterior)}`);

  // 3. El mismo mensaje en otro método no desvía el reemplazo (fallo del regex viejo).
  const conDuplicado = seccionDe(original(0),
    "\r\n" + crlf(["def grandeurCodeExchange(code)", "  pbMessage(_INTL(\"\\\\CN\\\\bYou have no room in your Bag.\"))", "end"]));
  const sustituidoDuplicado = reemplazarMetodo(conDuplicado, METODO, nuevo);
  regla("reemplazo estructural: un segundo método con el mismo mensaje sobrevive intacto",
    sustituidoDuplicado.reemplazado
    && sustituidoDuplicado.codigo.includes("def grandeurCodeExchange(code)")
    && (sustituidoDuplicado.codigo.match(/You have no room in your Bag/g) || []).length === 2);

  // 4. Idempotencia: reemplazar dos veces no cambia el resultado ni duplica la marca.
  const segunda = reemplazarMetodo(sustituido.codigo, METODO, nuevo);
  regla("reemplazo estructural: idempotente (la segunda pasada deja el mismo texto)",
    segunda.codigo === sustituido.codigo && (segunda.codigo.split(MARCA).length - 1) === 1);

  // 5. Detección y reparación del defecto real: `end` de nivel superior suelto.
  const defectuosa = sustituido.codigo.replace("def givePassive", "end\r\ndef givePassive");
  const hallazgo = endSobranteTrasMetodo(defectuosa, METODO);
  const reparada = quitarEndSobrante(defectuosa, METODO);
  regla("detección y reparación del `end` sobrante (texto exacto y equilibrio recuperado)",
    hallazgo.sobrante && hallazgo.texto.replace(/\r$/, "") === "end"
    && reparada.quitado && reparada.codigo === sustituido.codigo
    && equilibrioNivelSuperior(reparada.codigo).equilibrado
    && !endSobranteTrasMetodo(reparada.codigo, METODO).sobrante,
    JSON.stringify({ linea: hallazgo.indiceLinea, quitado: reparada.textoQuitado }));

  // 6. Sección sana: no se detecta defecto y no se modifica nada.
  const intacta = quitarEndSobrante(sustituido.codigo, METODO);
  regla("sección sana: no se detecta `end` sobrante ni se modifica el texto",
    !endSobranteTrasMetodo(sustituido.codigo, METODO).sobrante && !intacta.quitado && intacta.codigo === sustituido.codigo);

  // 7. Método inexistente: no se escribe nada y `reemplazado` lo informa.
  const sinMetodo = reemplazarMetodo(crlf(["def otro", "  x = 1", "end"]), METODO, nuevo);
  regla("método ausente: no se reemplaza nada (quien llama decide si lanzar)",
    !sinMetodo.reemplazado && sinMetodo.codigo === crlf(["def otro", "  x = 1", "end"]) && sinMetodo.anterior === null);

  // 8. dividirLineas conserva desplazamientos y terminadores (ida y vuelta exacta).
  const lineas = dividirLineas(sana);
  regla("dividirLineas conserva desplazamientos y terminadores (ida y vuelta exacta)",
    lineas.map((l) => sana.slice(l.inicio, l.fin)).join("") === sana
    && lineas.every((l) => sana.slice(l.inicio, l.fin) === l.texto + l.eol));

  console.log(`\nselftest: ${fallos ? `✘ ${fallos} regla(s) en rojo` : "✔ 8/8 reglas en verde"}`);
  process.exit(fallos ? 1 : 0);
}

// ---------------------------------------------------------------------------
// --verify: estado real de las cuatro copias
// ---------------------------------------------------------------------------
function verificar() {
  const errores = [];
  const ok = (condicion, mensaje) => { if (!condicion) errores.push(mensaje); };

  ok(fs.existsSync(JUEGO), `falta ${path.relative(ROOT, JUEGO)}`);
  if (!fs.existsSync(JUEGO)) throw new Error(errores.join("\n- "));

  const juego = seccion(JUEGO);
  ok(juego.codigo.includes(MARCA), "la sección «Grandeur Club» del juego no lleva el parche de 0 créditos (ejecutar antes el instalador de Abra/Torre)");
  const intervalo = intervaloMetodo(juego.codigo, METODO);
  ok(!!intervalo, `no se encuentra ${METODO} como método de nivel superior en la copia del juego`);
  ok(!endSobranteTrasMetodo(juego.codigo, METODO).sobrante,
    "la copia del juego sigue con un `end` sobrante tras grandeurItemExchange (ejecutar node tools/repair_grandeur_club_end.mjs)");
  ok(equilibrioNivelSuperior(juego.codigo).equilibrado, "la sección «Grandeur Club» del juego tiene aperturas y `end` de nivel superior descompensados");
  ok(juego.codigo.includes("maxitems = 99"), "grandeurItemExchange debe seguir permitiendo hasta 99 unidades libres");

  // Invariante de la fase 32: la sección del juego y la de distribución son la
  // misma. Si una fase futura las separa a propósito, esta comprobación se
  // actualiza en ese mismo commit (y se explica en docs/REPARACION_GRANDEUR_CLUB_END.md).
  const referencia = seccion(path.join(ROOT, DISTRIBUCION[0]));
  ok(juego.codigo === referencia.codigo,
    `la sección «Grandeur Club» del juego difiere de la de ${DISTRIBUCION[0]} (${juego.codigo.length} vs ${referencia.codigo.length} caracteres)`);

  const copias = [];
  for (const relativo of DISTRIBUCION) {
    const archivo = path.join(ROOT, relativo);
    if (!fs.existsSync(archivo)) { errores.push(`falta ${relativo}`); continue; }
    const copia = seccion(archivo);
    const sobrante = endSobranteTrasMetodo(copia.codigo, METODO).sobrante;
    ok(!sobrante, `${relativo} tiene un \`end\` sobrante tras grandeurItemExchange`);
    ok(equilibrioNivelSuperior(copia.codigo).equilibrado, `${relativo}: sección «Grandeur Club» descompensada`);
    copias.push(`${relativo} (${copia.codigo.length} caracteres, sin \`end\` sobrante)`);
  }

  // Fidelidad del volcado Marshal: si existe la copia previa, la única sección
  // que puede diferir de ella es la que se reparó. Nada más puede cambiar.
  const respaldo = path.join(BACKUP, "Scripts.rxdata");
  let fidelidad = "sin copia previa en el checkout (nada que comparar)";
  if (fs.existsSync(respaldo)) {
    const antes = marshalLoad(fs.readFileSync(respaldo));
    ok(antes.length === juego.scripts.length,
      `la copia previa tiene ${antes.length} secciones y el archivo actual ${juego.scripts.length}`);
    let metadataIntacta = true;
    const distintas = [];
    for (let i = 0; i < Math.max(antes.length, juego.scripts.length); i++) {
      const a = antes[i];
      const b = juego.scripts[i];
      if (!a || !b) { metadataIntacta = false; continue; }
      if (a[0] !== b[0] || (a[1]?.text ?? "") !== (b[1]?.text ?? "")) metadataIntacta = false;
      if (!Buffer.from(a[2].bytes).equals(Buffer.from(b[2].bytes))) distintas.push(a[1]?.text ?? `#${i + 1}`);
    }
    ok(metadataIntacta, "el volcado Marshal cambió ids o títulos de alguna sección");
    ok(distintas.length <= 1 && distintas.every((nombre) => nombre === SECCION),
      `el volcado Marshal modificó secciones ajenas a la reparación: ${distintas.join(", ") || "(ninguna)"}`);
    fidelidad = distintas.length
      ? `${antes.length} secciones, ids y títulos intactos, sólo difiere «${distintas.join("», «")}»`
      : `${antes.length} secciones, ids y títulos intactos, ninguna diferencia con el archivo actual`;
  }

  if (errores.length) throw new Error(`Verificación fallida (${errores.length}):\n- ${errores.join("\n- ")}`);
  console.log("Verificación OK: «Grandeur Club» sin `end` sobrante en las cuatro copias.");
  console.log(`  · copia previa: ${fidelidad}`);
  console.log(`  · juego: ${path.relative(ROOT, JUEGO)} (${juego.codigo.length} caracteres, ${dividirLineas(juego.codigo).length} líneas, método en líneas ${intervalo.lineaDef}–${intervalo.lineaEnd})`);
  for (const copia of copias) console.log(`  · ${copia}`);
}

// ---------------------------------------------------------------------------
// Reparación
// ---------------------------------------------------------------------------
function reparar() {
  const { scripts, fila, codigo } = seccion(JUEGO);
  if (!codigo.includes(MARCA)) {
    throw new Error("la sección «Grandeur Club» del juego no lleva el parche de 0 créditos; nada que reparar aquí (ejecutar antes tools/apply_emergency_abra_and_free_tower.mjs)");
  }
  const hallazgo = endSobranteTrasMetodo(codigo, METODO);
  if (!hallazgo.sobrante) {
    console.log("· La copia del juego ya no tiene el `end` sobrante: no se escribe nada (idempotente).");
    return;
  }

  fs.mkdirSync(BACKUP, { recursive: true });
  const respaldo = path.join(BACKUP, "Scripts.rxdata");
  if (!fs.existsSync(respaldo)) {
    fs.copyFileSync(JUEGO, respaldo);
    console.log(`· Copia previa guardada en ${path.relative(ROOT, respaldo)}`);
  } else {
    console.log(`· Ya existía la copia previa ${path.relative(ROOT, respaldo)}: no se sobrescribe`);
  }

  const { codigo: reparado, textoQuitado } = quitarEndSobrante(codigo, METODO);
  console.log(`· Quitado el \`end\` sobrante de la línea ${hallazgo.indiceLinea} (${JSON.stringify(textoQuitado)}): ${codigo.length} → ${reparado.length} caracteres`);
  const equilibrio = equilibrioNivelSuperior(reparado);
  if (!equilibrio.equilibrado) {
    throw new Error(`la sección reparada queda descompensada (${equilibrio.aperturas} aperturas vs ${equilibrio.cierres} \`end\`): no se escribe el archivo`);
  }
  guardar(fila, reparado);
  fs.writeFileSync(JUEGO, Buffer.from(marshalDump(scripts)));
  console.log(`· Escrito ${path.relative(ROOT, JUEGO)} (${fs.statSync(JUEGO).size} bytes)`);
}

try {
  if (SELFTEST) selftest();
  else if (VERIFY_ONLY) verificar();
  else {
    reparar();
    verificar();
  }
}
catch (error) {
  console.error(`✘ ${error?.message || error}`);
  process.exit(1);
}
