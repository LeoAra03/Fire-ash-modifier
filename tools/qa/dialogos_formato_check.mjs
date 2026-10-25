#!/usr/bin/env node
/**
 * Control de formato del volcado de diálogos — LOTE 2, tanda 22
 * (tareas 2184–2190 de `tareas.txt`).
 *
 * Comprueba el volcado `content/plan900_dialogos.json` con 13 reglas: 6 de
 * error (deben quedar en 0 para que el control pase) y 7 de aviso (candidatos
 * editoriales que se publican con mapa/evento/página, sin reescribirlos por
 * expresión regular). Los códigos de escape se contrastan cada corrida con la
 * sección Ruby `Messages` (y `PokeMod_Dialogos` para `\sp[...]`): si el motor
 * gana o pierde un código, el control falla en lugar de aprobar por inercia.
 *
 * Uso:
 *   node tools/qa/dialogos_formato_check.mjs             # control completo (exit 1 si hay errores)
 *   node tools/qa/dialogos_formato_check.mjs --selftest  # autoprueba: 17 casos, 13 reglas
 *   node tools/qa/dialogos_formato_check.mjs --stats     # conteos por regla, sin exit 1
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { marshalLoad } from "../../web/js/marshal.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DUMP = path.join(ROOT, "content", "plan900_dialogos.json");
const SCRIPTS = path.join(ROOT, "pokemon_fire_ash", "Data", "Scripts.rxdata");
const SYSTEM = path.join(ROOT, "pokemon_fire_ash", "Data", "System.rxdata");

/** Única definición de las reglas del control (formato y nivel). */
export const REGLAS = [
  { id: "E1", nivel: "error", nombre: "caja_vacia", titulo: "caja sin texto visible" },
  { id: "E2", nivel: "error", nombre: "escape_desconocido", titulo: "código de escape que el motor no define" },
  { id: "E3", nivel: "error", nombre: "argumento_invalido", titulo: "argumento de escape vacío o fuera de rango" },
  { id: "E4", nivel: "error", nombre: "corchete_desbalanceado", titulo: "escape con `[` sin `]` de cierre" },
  { id: "E5", nivel: "error", nombre: "caracter_no_imprimible", titulo: "carácter de control dentro del texto" },
  { id: "E6", nivel: "error", nombre: "solo_escape", titulo: "caja cuya parte visible queda vacía" },
  { id: "A1", nivel: "aviso", nombre: "signo_pregunta", titulo: "`?` sin signo de apertura `¿`" },
  { id: "A2", nivel: "aviso", nombre: "signo_exclamacion", titulo: "`!` sin signo de apertura `¡`" },
  { id: "A3", nivel: "aviso", nombre: "comillas_rectas", titulo: 'comillas rectas `"` en voz narrativa' },
  { id: "A4", nivel: "aviso", nombre: "guion_dudoso", titulo: "guion doble `--` o guion medio rodeado de espacios" },
  { id: "A5", nivel: "aviso", nombre: "jerga_motor", titulo: "jerga de motor visible para el jugador" },
  { id: "A6", nivel: "aviso", nombre: "caja_unica_ancha", titulo: "caja de una sola línea por encima de 53 columnas" },
  { id: "A7", nivel: "aviso", nombre: "posible_ingles", titulo: "candidato de texto en inglés" },
];

/** Códigos que el motor exige con corchete: `[argumento]`. */
const BRACKET_CODES = ["sign", "sp", "wtnp", "ff", "wt", "ts", "ch", "me", "se", "cl", "f", "v", "l", "w", "c", "n"];
/** Códigos que el motor admite sin corchete (incluye `\1` y el guion `\.`). */
const BARE_CODES = ["pn", "pm", "pg", "pog", "cl", "cn", "wd", "wm", "wu", "op", "pt", "g", "b", "r", "n", "1", "."];
/** Con corchete obligatorio: si aparecen sin `[...]` son error E3. */
const REQUIRES_ARG = new Set(["sign", "sp", "wtnp", "ff", "wt", "ts", "ch", "me", "se", "f", "v", "l", "w", "c"]);

const JERGA = /\b(?:switch|variable|Map\d+|event\s*id|RMXP|engine|script|ejecutar\s+script)\b/i;
const INGLES = /\b(?:welcome|the |you got|let's|congratulations|press|continue|battle|route|city)\b/i;
const GUION = /--|\s-\s/;
const COMILLAS = /"/;
const CONTROL = /[\x00-\x1f]/;
const LIMITE_EJEMPLOS = 20;

function sectionRuby(name) {
  const scripts = marshalLoad(fs.readFileSync(SCRIPTS));
  for (const row of scripts) {
    if ((row[1]?.text ?? "") !== name) continue;
    const raw = row[2];
    const buf = raw?.bytes ?? Buffer.from(raw?.data ?? []);
    try { return zlib.inflateSync(buf).toString("utf8"); } catch { return buf.toString("utf8"); }
  }
  return "";
}

/**
 * Códigos de escape que el motor define, leídos de `Messages` y
 * `PokeMod_Dialogos` en cada corrida (formas directas `\\código`, clases de
 * carácter `\\[Cc]`, alternancias `\\(f|ff|…)` y `\1`).
 */
export function engineCodes() {
  const src = sectionRuby("Messages") + "\n" + sectionRuby("PokeMod_Dialogos");
  const codes = new Set();
  for (const m of src.matchAll(/\\\\([A-Za-z]{1,6})/g)) codes.add(m[1].toLowerCase());
  for (const m of src.matchAll(/\\\\\[([A-Za-z]+)\]/g)) for (const ch of new Set(m[1])) codes.add(ch.toLowerCase());
  for (const m of src.matchAll(/\\\\\(([^)]+)\)/g)) for (const alt of m[1].split("|")) codes.add(alt.toLowerCase().replace(/[^a-z0-9.]/g, ""));
  for (const m of src.matchAll(/\\\\(\d)/g)) codes.add(m[1]);
  codes.delete("");
  return { codes, source: src };
}

function assertUniverse(engine) {
  const declared = new Set([...BRACKET_CODES, ...BARE_CODES]);
  const missingInRules = [...engine.codes].filter((c) => !declared.has(c)).sort();
  const missingInEngine = [...declared].filter((c) => !engine.codes.has(c)).sort();
  if (missingInRules.length || missingInEngine.length) {
    throw new Error(
      `REGLAS_FORMATO desalineadas del motor — sin regla: [${missingInRules.join(", ")}] · sin código en Messages: [${missingInEngine.join(", ")}]`,
    );
  }
}

/** Tokeniza reconociendo primero los códigos conocidos (como hace el motor). */
export function tokenize(input) {
  const tokens = [];
  let i = 0;
  const esc = (code) => code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  while (i < input.length) {
    if (input[i] !== "\\") { i += 1; continue; }
    const rest = input.slice(i);
    let m;
    if ((m = /^\\\\/.exec(rest))) { tokens.push({ tipo: "escape", codigo: "\\", raw: m[0] }); i += m[0].length; continue; }
    if ((m = /^\\\[([0-9a-fA-F]{8})\]/.exec(rest))) { tokens.push({ tipo: "escape", codigo: "[hex]", raw: m[0] }); i += m[0].length; continue; }
    let matched = false;
    for (const code of BRACKET_CODES.slice().sort((a, b) => b.length - a.length)) {
      if (!rest.startsWith(`\\${code}[`)) continue;
      const mm = new RegExp(`^\\\\${esc(code)}\\[([^\\]]*)(\\]|$)`).exec(rest);
      if (!mm) continue;
      if (mm[2] !== "]") tokens.push({ tipo: "corchete_abierto", codigo: code, raw: mm[0] });
      else tokens.push({ tipo: "escape", codigo: code, arg: mm[1], raw: mm[0] });
      i += mm[0].length; matched = true; break;
    }
    if (matched) continue;
    for (const code of BARE_CODES.slice().sort((a, b) => b.length - a.length)) {
      if (rest.startsWith(`\\${code}`)) { tokens.push({ tipo: "escape", codigo: code, raw: `\\${code}` }); i += 1 + code.length; matched = true; break; }
    }
    if (matched) continue;
    const um = /^\\([A-Za-z]{1,6})/.exec(rest);
    if (um) {
      const code = um[1].toLowerCase();
      tokens.push(REQUIRES_ARG.has(code)
        ? { tipo: "sin_argumento", codigo: code, raw: um[0] }
        : { tipo: "desconocido", codigo: code, raw: um[0] });
      i += um[0].length; continue;
    }
    tokens.push({ tipo: "texto", raw: "\\" }); i += 1;
  }
  return tokens;
}

/** Quita escapes completos para calcular la parte visible. */
function visibleOf(raw) {
  return raw
    .replace(/\\[A-Za-z]{1,6}\[[^\]]*\]/g, "")
    .replace(/\\\[[0-9a-fA-F]{8}\]/g, "")
    .replace(/\\[A-Za-z]{1,6}/g, "")
    .replace(/\\\\/g, "\\")
    .trim();
}

/** Argumentos que pueden ser inválidos según el motor (variables y actores). */
function argumentProblems(tokens, varCount) {
  const problems = [];
  for (const t of tokens) {
    if (t.tipo !== "escape") continue;
    if (t.codigo === "v" || t.codigo === "n") {
      const arg = t.arg ?? "";
      if (arg === "") problems.push({ codigo: t.codigo, motivo: "argumento vacío" });
      else if (!/^\d+$/.test(arg)) problems.push({ codigo: t.codigo, motivo: `argumento no numérico (${arg})` });
      else if (t.codigo === "v" && (Number(arg) < 1 || Number(arg) > varCount)) problems.push({ codigo: t.codigo, motivo: `variable ${arg} fuera de rango 1..${varCount}` });
      else if (t.codigo === "n" && (Number(arg) < 1 || Number(arg) > 8)) problems.push({ codigo: t.codigo, motivo: `actor ${arg} fuera de rango 1..8` });
    } else if (["sign", "sp", "ch"].includes(t.codigo) && !(t.arg ?? "").trim()) {
      problems.push({ codigo: t.codigo, motivo: "argumento vacío" });
    }
  }
  return problems;
}

/** Evalúa una caja y devuelve las reglas que disparan (sin efectos). */
export function evaluarCaja({ rawLines, varCount }) {
  const raw = rawLines.join(" ");
  const findings = new Set();
  const tokens = tokenize(raw);
  const visible = visibleOf(raw);
  if (!raw.trim()) findings.add("E1");
  else if (!visible && !/\\(?:v|n|pn|pm)\b/i.test(raw)) findings.add("E6");
  for (const t of tokens) {
    if (t.tipo === "desconocido") findings.add("E2");
    else if (t.tipo === "corchete_abierto") findings.add("E4");
    else if (t.tipo === "sin_argumento") findings.add("E3");
  }
  for (const p of argumentProblems(tokens, varCount)) findings.add("E3");
  if (CONTROL.test(raw)) findings.add("E5");
  if (/\?/.test(visible) && !/¿/.test(visible)) findings.add("A1");
  if (/!/.test(visible) && !/¡/.test(visible)) findings.add("A2");
  if (COMILLAS.test(visible)) findings.add("A3");
  if (GUION.test(visible)) findings.add("A4");
  if (JERGA.test(visible)) findings.add("A5");
  const nonEmptyLines = rawLines.filter((line) => line.trim());
  // A6: una sola línea física por encima de 53 columnas una vez consumidos los
  // escapes (incluidos los argumentos de menú `\ch[...]`, que no se pintan).
  if (nonEmptyLines.length === 1 && visibleOf(nonEmptyLines[0]).length > 53) findings.add("A6");
  if (INGLES.test(visible)) findings.add("A7");
  return [...findings];
}

const ejemploDe = (map, event, page, raw) => ({
  mapId: map.mapId,
  mapa: map.nombre,
  evento: event.nombre,
  pagina: page.pagina,
  texto: raw.replace(/\s+/g, " ").trim().slice(0, 160),
});

/** Control completo sobre el volcado. Determinista (sin reloj ni azar). */
export function control() {
  const engine = engineCodes();
  assertUniverse(engine);
  const varCount = marshalLoad(fs.readFileSync(SYSTEM)).getIvar("@variables").length;
  const dump = JSON.parse(fs.readFileSync(DUMP, "utf8"));
  const counts = Object.fromEntries(REGLAS.map((r) => [r.id, 0]));
  const examples = Object.fromEntries(REGLAS.map((r) => [r.id, []]));
  const observedCodes = new Set();
  let cajas = 0;
  for (const map of dump.mapas ?? []) {
    for (const event of map.eventos ?? []) {
      for (const page of event.paginas ?? []) {
        for (const box of page.cajas ?? []) {
          cajas += 1;
          const rawLines = (box.lineas ?? []).map(String);
          for (const t of tokenize(rawLines.join(" "))) if (t.tipo !== "texto") observedCodes.add(t.codigo.toLowerCase());
          for (const id of evaluarCaja({ rawLines, varCount })) {
            counts[id] += 1;
            if (examples[id].length < LIMITE_EJEMPLOS) examples[id].push(ejemploDe(map, event, page, rawLines.join(" ")));
          }
        }
      }
    }
  }
  const errores = {}; const avisos = {};
  for (const r of REGLAS) {
    const entry = { regla: r.nombre, count: counts[r.id], examples: examples[r.id] };
    if (r.nivel === "error") errores[r.id] = entry; else avisos[r.id] = entry;
  }
  const totalErrores = Object.values(errores).reduce((a, e) => a + e.count, 0);
  const totalAvisos = Object.values(avisos).reduce((a, e) => a + e.count, 0);
  return {
    schema: "dialogos_formato/1.0",
    fuente: "content/plan900_dialogos.json",
    reglas: REGLAS.map((r) => ({ ...r })),
    cajas,
    codigosMotor: [...engine.codes].sort(),
    codigosObservados: [...observedCodes].sort(),
    errores,
    avisos,
    totalErrores,
    totalAvisos,
    politica: "Los errores bloquean el control; los avisos son candidatos editoriales con mapa/evento/página y no se reescriben por expresión regular.",
  };
}

/** Autoprueba: 17 casos que ejercitan las 13 reglas (incluye negativos). */
export function selftest() {
  const varCount = marshalLoad(fs.readFileSync(SYSTEM)).getIvar("@variables").length;
  const suite = [
    { nombre: "E1 caja vacía", lineas: [""], esperado: ["E1"] },
    { nombre: "E2 escape desconocido", lineas: ["\\zap[1] hola"], esperado: ["E2"] },
    { nombre: "E3 variable vacía", lineas: ["\\v[] del tesoro"], esperado: ["E3"] },
    { nombre: "E3 variable fuera de rango", lineas: [`\\v[${varCount + 1}] del tesoro`], esperado: ["E3"] },
    { nombre: "E4 corchete sin cerrar", lineas: ["\\v[12 del tesoro"], esperado: ["E4"] },
    { nombre: "E5 carácter de control", lineas: ["Suelta el pito\x07 aquí"], esperado: ["E5"] },
    { nombre: "E6 sólo escape", lineas: ["\\sp[Puerta del Salón]"], esperado: ["E6"] },
    { nombre: "A1 pregunta sin ¿", lineas: ["Subir o quedarte?"], esperado: ["A1"] },
    { nombre: "A2 exclamación sin ¡", lineas: ["Vamos!"], esperado: ["A2"] },
    { nombre: "A3 comillas rectas", lineas: ['Dijo "no" y se fue.'], esperado: ["A3"] },
    { nombre: "A4 guion doble", lineas: ["Bien -- mal"], esperado: ["A4"] },
    { nombre: "A4 guion con espacios", lineas: ["Pasa por el sur - si te atreves."], esperado: ["A4"] },
    { nombre: "A5 jerga de motor", lineas: ["Cambia el switch 948 para abrir."], esperado: ["A5"] },
    { nombre: "A6 caja única por encima de 53 columnas", lineas: ["Este camión lleva demasiada mercancía apilada encima y va a desmoronarse en cualquier curva"], esperado: ["A6"] },
    { nombre: "A7 candidato de inglés", lineas: ["the city route"], esperado: ["A7"] },
    { nombre: "negativo: códigos conocidos con argumento válido", lineas: ["¡Vamos! \\v[264] \\ch[1,2,Sí,No]"], esperado: [] },
    { nombre: "negativo: caja multi-línea en español", lineas: ["La Ancla de la Fragua está estable. Si cruzas ahora,", "el Sello quedará registrado en el registro."], esperado: [] },
  ];
  const results = suite.map((caso) => {
    const hits = evaluarCaja({ rawLines: caso.lineas, varCount }).sort();
    const esperado = [...caso.esperado].sort();
    return { ...caso, obtenido: hits, ok: JSON.stringify(hits) === JSON.stringify(esperado) };
  });
  const reglasCubiertas = new Set(suite.flatMap((c) => c.esperado));
  const faltan = REGLAS.filter((r) => !reglasCubiertas.has(r.id)).map((r) => r.id);
  const fallos = results.filter((r) => !r.ok);
  const estructuraOk = results.length === 17 && REGLAS.length === 13;
  return { total: results.length, reglas: REGLAS.length, results, faltanReglas: faltan, ok: estructuraOk && fallos.length === 0 && faltan.length === 0 };
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--selftest")) {
    const st = selftest();
    for (const r of st.results) console.log(`${r.ok ? "OK  " : "FAIL"} ${r.nombre} → [${r.obtenido.join(", ")}]${r.esperado.length ? ` (esperado [${r.esperado.join(", ")}])` : ""}`);
    if (!st.ok) {
      if (st.total !== 17 || st.reglas !== 13) console.log(`FAIL estructura: ${st.total} casos / ${st.reglas} reglas (se exigen 17 / 13)`);
      if (st.faltanReglas.length) console.log(`FAIL reglas sin caso: ${st.faltanReglas.join(", ")}`);
      process.exit(1);
    }
    console.log(`OK: autoprueba de formato — 17 casos, ${st.reglas} reglas, códigos de motor contrastados con Messages cada corrida.`);
    return;
  }
  const report = control();
  const lines = [
    `Formato de diálogos: ${report.cajas} cajas · errores ${report.totalErrores} · avisos ${report.totalAvisos}`,
    `  códigos de motor: ${report.codigosMotor.length} · observados en el volcado: ${report.codigosObservados.join(", ") || "(ninguno)"}`,
  ];
  for (const r of REGLAS) {
    const bucket = r.nivel === "error" ? report.errores[r.id] : report.avisos[r.id];
    lines.push(`  ${r.id} ${r.nombre}: ${bucket.count}`);
  }
  console.log(lines.join("\n"));
  if (args.includes("--stats")) return;
  if (report.totalErrores > 0) {
    for (const [id, bucket] of Object.entries(report.errores).filter(([, b]) => b.count)) {
      console.error(`ERROR ${id} (${bucket.regla}) × ${bucket.count}:`);
      for (const ex of bucket.examples.slice(0, 3)) console.error(`  mapa ${ex.mapId} «${ex.evento}» p${ex.pagina}: ${ex.texto.slice(0, 120)}`);
    }
    process.exit(1);
  }
  console.log("OK: volcado de diálogos sin errores de formato (los avisos quedan publicados para revisión editorial).");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
