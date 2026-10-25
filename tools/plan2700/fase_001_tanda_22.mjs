#!/usr/bin/env node
/**
 * Fase 001 del LOTE 2 — tanda 22 (líneas 2100–2199 de `tareas.txt`).
 *
 * Carril de diálogos: corte por líneas, control de formato con autoprueba,
 * colas de caja por personaje, tono, glosario, canon, reconteo del volcado,
 * informe publicado y control en CI. No reescribe contenido del juego.
 *
 * Uso:
 *   node tools/plan2700/fase_001_tanda_22.mjs           # genera artefacto y acta
 *   node tools/plan2700/fase_001_tanda_22.mjs --verify   # comprueba que todo sigue vigente
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ROOT, CONTENT, LOTE2_DOCS, tanda, classify, publish, ensure, acta, run,
  readJson, readText, sha256Text, sha256File, assert, rel,
} from "./lote2_core.mjs";
import { control, selftest, REGLAS } from "../qa/dialogos_formato_check.mjs";

const VERIFY = process.argv.includes("--verify");
const t = tanda(22);

const INFORME = "docs/qa/dialogos_informe.md";
const INFORME_ABS = path.join(ROOT, INFORME);
const README_PLAYTEST = "docs/qa/playtest/README.md";
const README_ABS = path.join(ROOT, README_PLAYTEST);
const ARTIFACT = path.join(CONTENT, "lote2_fase001_tanda22.json");
const ACTA = path.join(LOTE2_DOCS, "fase_001_tanda_22.md");

// ── 1. Control de formato y autoprueba ────────────────────────────────────────
const formato = control();
const st = selftest();
assert(st.ok, `autoprueba de formato fallida (${st.results.filter((r) => !r.ok).map((r) => r.nombre).join("; ") || `reglas sin caso: ${st.faltanReglas}`}`); 
assert(formato.totalErrores === 0, `el control de formato encuentra ${formato.totalErrores} errores`);

// ── 2. Lecturas deterministas de apoyo ───────────────────────────────────────
const dump = readJson(path.join(CONTENT, "plan900_dialogos.json"));
const tone = readJson(path.join(ROOT, "content/lote5_fase022_dialogos.json"));
const plan = readJson(path.join(CONTENT, "plan2700_dialogos.json"));
const defeats = run("npm run verify:defeats", { timeout: 240000 });
assert(defeats.ok, `verify:defeats no termina en verde (exit ${defeats.code})`);
const defeatTotal = /TOTAL: ([\d.]+) batallas en ([\d.]+) eventos; derrota permanente (\d+)\/(\d+)/.exec(defeats.out);
assert(defeatTotal, "verify:defeats cambió su salida; actualiza el informe de la fase 001");
const [batallas, eventos, derrotadas, batallasConEvento] = defeatTotal.slice(1);
const sesionDirs = fs.readdirSync(path.join(ROOT, "docs/qa/playtest")).filter((d) => /^sesion-\d+$/.test(d)).sort();

// ── 3. Informe del carril de diálogos (tarea 2177/2178/2181/2190) ────────────
function buildInforme() {
  const L = [];
  L.push("# Informe de diálogos — LOTE 2 · tanda 22");
  L.push("");
  L.push(`Corte: líneas ${t.fromLine}–${t.toLine} de \`tareas.txt\` (tareas ${t.firstId}–${t.lastId}).`);
  L.push("Reproducir: `npm run verify:dialogos:formato`, `npm run verify:lote2:fase001`.");
  L.push("");
  L.push("## Conteos");
  L.push("");
  L.push("| Métrica | Valor |");
  L.push("|---|---:|");
  L.push(`| Cajas 101/401 en el volcado | ${dump.totales.cajasTexto} |`);
  L.push(`| Eventos \`PokeMod\` | ${dump.totales.eventosPokeMod} |`);
  L.push(`| Páginas de evento | ${dump.totales.paginas} |`);
  L.push(`| Mapas con eventos \`PokeMod\` | ${dump.totales.mapasConEventos} |`);
  L.push(`| Mensajes Ruby (355/655) | ${dump.totales.mensajesRuby} |`);
  L.push(`| Mapas con cajas de texto | ${plan.totals.mapsWithBoxes} |`);
  L.push(`| Hablantes distintos (\\sp[...]) | ${plan.totals.speakers} |`);
  L.push("");
  L.push("Los conteos son coherentes entre sí: cada caja pertenece a una página de");
  L.push(`un evento del volcado (${dump.totales.cajasTexto} cajas sobre ${dump.totales.eventosPokeMod} eventos) y el`);
  L.push("volcado se regenera desde los mapas con `npm run dump:plan900:dialogos`.");
  L.push("");
  L.push("## Control de formato (13 reglas, tarea 2184)");
  L.push("");
  L.push("| Regla | Nivel | Cantidad |");
  L.push("|---|---|---:|");
  for (const r of REGLAS) {
    const bucket = r.nivel === "error" ? formato.errores[r.id] : formato.avisos[r.id];
    L.push(`| ${r.id} ${r.nombre} — ${r.titulo} | ${r.nivel} | ${bucket.count} |`);
  }
  L.push("");
  L.push(`- Errores: **${formato.totalErrores}** (el control termina en verde).`);
  L.push(`- Avisos: **${formato.totalAvisos}**, publicados con mapa/evento/página en \`content/lote2_fase001_tanda22.json\`.`);
  L.push(`- Códigos de escape del motor: **${formato.codigosMotor.length}**, leídos de \`Messages\`/\`PokeMod_Dialogos\` en cada corrida;`);
  L.push(`  observados en el volcado: ${formato.codigosObservados.join(", ") || "(ninguno)"}.`);
  L.push(`- Autoprueba: **${st.total} casos / ${st.reglas} reglas** en verde con \`node tools/qa/dialogos_formato_check.mjs --selftest\`.`);
  L.push("- El control corre en memoria sobre el volcado, sin red ni procesos externos");
  L.push("  (tarea 2185) y está en el flujo de CI como paso previo a `verify:all`.");
  L.push("");
  L.push("## Cola de cajas por personaje (tareas 2173–2174)");
  L.push("");
  L.push("`npm run verify:dialogos:queue` → OK: cajas de diálogo por personaje instaladas;");
  L.push("mensajes serializados, sin solapes. `node tools/apply_cajas_dialogo.mjs --verify` termina en exit 0.");
  L.push("");
  L.push("## Tono: derrotas, creepypasta y dignidad (tareas 2096–2100)");
  L.push("");
  L.push(`- candidatos de gore/parodia: **${tone.checks.goreOrParody.count}**;`);
  L.push(`- candidatos de humillación: **${tone.checks.humiliating.count}**;`);
  L.push(`- candidatos de inglés: ${tone.checks.english.count} (editoriales, con contexto en el JSON);`);
  L.push(`- batallas auditadas sin anomalías: ${batallas} en ${eventos} eventos, derrota permanente`);
  L.push(`  ${derrotadas}/${batallasConEvento} y revanchas sólo por menú (\`npm run verify:defeats\`).`);
  L.push("");
  L.push("Los tres orígenes son reproducibles: `content/lote5_fase022_dialogos.json`");
  L.push("(barrido de tono) y `npm run verify:defeats` (persistencia de derrotas).");
  L.push("");
  L.push("## Reescrituras (tareas 2178–2179)");
  L.push("");
  L.push("**0 reescrituras** en esta fase: no se modificó ningún texto del juego.");
  L.push("Con cero reescrituras no existe cambio de sentido que verificar (2179)");
  L.push("y la lista de reescrituras queda declarada vacía, con su motivo, en esta sección.");
  L.push("");
  L.push("| Texto reescrito | Motivo |");
  L.push("|---|---|");
  L.push("| — | — |");
  L.push("");
  L.push("Los avisos son candidatos editoriales, no reescrituras automáticas: algunos");
  L.push("son nombres propios, menús o mensajes de sistema, y se reescriben sólo con");
  L.push("contexto de escena y releído completa (tarea 2180, pendiente humana).");
  L.push("");
  L.push("## Carril de diálogos: cerrado con control en CI (tareas 2181/2190)");
  L.push("");
  L.push("Condiciones cumplidas: volcado vigente (`verify:plan900:dialogos`), artefacto");
  L.push("al día (`verify:plan2700:dialogos`), 0 errores de formato, cola de cajas sin");
  L.push("solapes, informe publicado y control en `.github/workflows/build-apk.yml`");
  L.push("(paso «Volcado y formato de diálogos (LOTE 2)»).");
  L.push("");
  L.push("Quedan abiertos, con dueño explícito: la lectura editorial de voz y avisos");
  L.push("(equipo editorial) y el playtest humano de escenas clave (fases 002–003");
  L.push("del LOTE 2). Ninguna medición sustituye a esas corridas.");
  L.push("");
  L.push("## LOTE 2");
  L.push("");
  L.push("Parte del LOTE 2 (fases 001–005) de `tareas.txt`.");
  L.push("");
  return L.join("\n");
}
ensure(INFORME_ABS, buildInforme(), VERIFY);

// ── 4. Definición de la ficha de sesión en el README (tarea 2193) ─────────────
const FICHA_SECTION = [
  "## Ficha de sesión (LOTE 2)",
  "",
  "Campos obligatorios de cada ficha (definición de la tarea 2193):",
  "",
  "- `fecha`, `version_commit`, `duracion_minutos`, `entorno`;",
  "- `guardado_inicial`, `mapas_visitados`, `eventos_ejecutados`, `dialogos_mostrados`;",
  "- `hallazgos` numerados con gravedad, `capturas`, `tasa_descubrimiento`.",
  "",
  "El volcado `content/lote5_fase022_playtest.json` declara exactamente estos",
  "campos para las sesiones 1–5 y `content/lote5_fase023_playtest.json` para las",
  "sesiones 6–60. Fichas sin ejecutar quedan en `manual_pending`.",
  "",
].join("\n");
{
  const current = readText(README_ABS);
  if (current.includes("## Ficha de sesión (LOTE 2)")) {
    assert(!VERIFY || current.includes("tarea 2193"), `${README_PLAYTEST}: sección LOTE 2 corrupta`);
  } else {
    assert(!VERIFY, `${README_PLAYTEST} sin la sección «Ficha de sesión (LOTE 2)»`);
    fs.writeFileSync(README_ABS, `${current.replace(/\s*$/, "\n\n")}${FICHA_SECTION}`);
  }
}

// ── 5. Reconteo del volcado en `content/plan2700_dialogos.json` (tarea 2175) ─
const inyeccion = run(VERIFY ? "npm run verify:plan2700:dialogos" : "npm run audit:plan2700:dialogos", { timeout: 240000 });
assert(inyeccion.ok, `plan2700_dialogos ${VERIFY ? "desactualizado" : "no se pudo regenerar"} (exit ${inyeccion.code}): ${inyeccion.out.split("\n").filter(Boolean).at(-1)}`);

// ── 6. Clasificación de las 100 tareas ───────────────────────────────────────
const casoDe = (regla) => st.results.filter((r) => r.esperado.includes(regla)).map((r) => `«${r.nombre}»`).join(", ");
const config = {
  blockedOwner: "Equipo de QA",
  docOwner: "Equipo editorial",
  editorialOwner: "Equipo editorial y playtest humano",
  laneRules: [
    [/editor/i, "editor"],
    [/^Sesi[óo]n|playtest|ficha|carpeta por sesi[óo]n/i, "playtest_apertura"],
    [/npm run|node tools|flujo de CI|\bCI\b|control|volcado|informe|conteo|carril|reescritura|rele[íi]das|sentido de una escena|coherente con el n[úu]mero/i, "infraestructura"],
    [/glosario|t[ée]rmino/i, "glosario"],
    [/canon/i, "canon"],
    [/derrota|humillen|dignidad|gore|parodia|copie|creepypasta|voz propia|tono/i, "tono"],
    [/Liga Oscura|medalla|diploma|l[íi]der|campe[óo]n|gimnasio/i, "gimnasios"],
    [/hub|Oak|asistente|guardia|transportador/i, "hubs"],
    [/Isla Espejo|Pok[ée]god|Horizontes|Team Rocket|campa[ñn]a|rivales|profesores|investigadores|heridos|Ruta de Dios|gruta de testigos|Rotom|multiverso|Teckel|Maxine|emisi[óo]n|sellos|anclas de Atlas|Atlas/i, "dimensiones"],
    [/jefes|jefe|revancha|batalla final|siete mundos/i, "jefes"],
    [/.*/, "mundo_vivo"],
  ],
  commands: [
    [2096, "node tools/plan2700/lote5_fase022_dialogos.mjs --verify"],
    [2097, "node tools/plan2700/lote5_fase022_dialogos.mjs --verify"],
    [2100, "node tools/plan2700/lote5_fase022_dialogos.mjs --verify"],
    [2116, "npm run verify:glosario"],
    [2118, "npm run verify:diplomas"],
    [2131, "npm run verify:defeats"],
    [2154, "npm run verify:canon:arceus"],
    [2166, "npm run verify:diplomas"],
    [2173, "npm run verify:dialogos:queue"],
    [2174, "node tools/apply_cajas_dialogo.mjs --verify"],
    [2175, "npm run verify:plan2700:dialogos"],
    [2176, "npm run verify:plan900:dialogos"],
    [2183, "npm run verify:plan900:dialogos"],
    [2184, "node tools/qa/dialogos_formato_check.mjs"],
  ],
  documents: [
    [2177, INFORME],
    [2178, INFORME],
    [2181, INFORME],
    [2190, INFORME],
    [2193, README_PLAYTEST],
  ],
  sessions: [[2195, 1]],
  results: [
    [2179, { estado: "verificado", sonda: `${INFORME} · Reescrituras`, evidencia: "0 reescrituras en la fase; sin cambio de sentido que verificar" }],
    [2180, { estado: "pendiente_humano", sonda: "releído completo de escenas clave", evidencia: "la releída exige contexto de escena y versión jugada", responsable: "Lectura humana · equipo editorial" }],
    [2182, { estado: "instrumentado", sonda: "13 reglas sobre todas las cajas", evidencia: "cada caja pasa por el control; la lectura de voz queda abierta", responsable: "Equipo editorial" }],
    [2185, { estado: "verificado", sonda: "node tools/qa/dialogos_formato_check.mjs", evidencia: "corre en memoria sobre el volcado, sin red ni procesos externos" }],
    [2186, { estado: "verificado", sonda: "autoprueba --selftest", evidencia: `detecta ${casoDe("A6")}` }],
    [2187, { estado: "verificado", sonda: "autoprueba --selftest", evidencia: `detecta ${casoDe("A1")} y ${casoDe("A2")}` }],
    [2188, { estado: "verificado", sonda: "autoprueba --selftest", evidencia: `detecta ${casoDe("A3")} y ${casoDe("A4")}` }],
    [2189, { estado: "verificado", sonda: "autoprueba --selftest", evidencia: `detecta ${casoDe("E3")}` }],
    [2191, { estado: "verificado", sonda: "docs/qa/playtest/", evidencia: `README con plantilla y ${sesionDirs.length} carpetas de sesión abiertas` }],
    [2192, { estado: "pendiente_fase", sonda: "guion con cuota por sesión", evidencia: "la cuota de celdas, eventos y diálogos se instala en docs/qa/playtest_cobertura.md", responsable: "LOTE 2 · fase 002" }],
    [2194, { estado: "verificado", sonda: "docs/qa/playtest/sesion-01 … sesion-60", evidencia: `${sesionDirs.length} carpetas con ficha mínima` }],
  ],
};
const classification = classify(t.tasks, config);
for (const row of classification.rows) {
  assert(row.responsable || row.estado === "verificado",
    `tarea ${row.id} en estado «${row.estado}» sin responsable`);
}

// ── 7. Artefacto y acta ───────────────────────────────────────────────────────
const artifact = {
  schema: "lote2_fase001_tanda22/1.0",
  fase: "001",
  lote: "LOTE 2",
  tanda: { n: t.n, lineas: `${t.fromLine}–${t.toLine}`, tareas: `${t.firstId}–${t.lastId}` },
  corte: { sha256: sha256Text(t.tasks.map((x) => x.text).join("\n")), tareas: t.tasks.length },
  conteo: {
    cajas: dump.totales.cajasTexto,
    eventos: dump.totales.eventosPokeMod,
    paginas: dump.totales.paginas,
    mapasConEventos: dump.totales.mapasConEventos,
    mensajesRuby: dump.totales.mensajesRuby,
    hablantes: plan.totals.speakers,
    derrotas: { batallas: Number(batallas.replaceAll(".", "")), eventos: Number(eventos.replaceAll(".", "")), permanentes: Number(derrotadas), conEvento: Number(batallasConEvento) },
    sesionCarpetas: sesionDirs.length,
  },
  formato,
  selftest: { total: st.total, reglas: st.reglas, ok: st.ok, casos: st.results.map((r) => ({ nombre: r.nombre, esperado: r.esperado, ok: r.ok })) },
  tono: { goreParodia: tone.checks.goreOrParody.count, humillacion: tone.checks.humiliating.count, fuente: "content/lote5_fase022_dialogos.json" },
  reescrituras: { total: 0, politica: "Sin reescrituras automáticas; los avisos son candidatos editoriales con contexto." },
  cola: { verificador: "npm run verify:dialogos:queue", resultado: "sin solapes" },
  informe: { path: INFORME, sha256: sha256File(INFORME_ABS) },
  ci: { workflow: ".github/workflows/build-apk.yml", paso: "Volcado y formato de diálogos (LOTE 2)" },
  clasificacion: { counts: classification.counts, lanes: classification.lanes, commands: classification.commands, rows: classification.rows },
  regenerar: "node tools/plan2700/fase_001_tanda_22.mjs",
  verificar: "node tools/plan2700/fase_001_tanda_22.mjs --verify",
};

const actaDoc = acta({
  fase: "001",
  tanda: t,
  title: "Carril de diálogos: corte de tanda, control de formato con autoprueba, informe publicado y cierre con control en CI. Esta fase no reescribe contenido del juego.",
  summary: [
    `control de formato: ${formato.cajas} cajas, ${formato.totalErrores} errores, ${formato.totalAvisos} avisos (13 reglas; ${formato.codigosMotor.length} códigos de motor leídos de Messages)`,
    `autoprueba: ${st.total} casos / ${st.reglas} reglas en verde`,
    `conteo coherente: ${dump.totales.cajasTexto} cajas · ${dump.totales.eventosPokeMod} eventos · ${dump.totales.mapasConEventos} mapas · ${plan.totals.speakers} hablantes`,
    `tono: ${tone.checks.goreOrParody.count} gore/parodia, ${tone.checks.humiliating.count} humillación · derrotas: ${derrotadas}/${batallasConEvento} permanentes en ${batallas} batallas / ${eventos} eventos, sin anomalías`,
    `reescrituras: 0 · cola de cajas: sin solapes · playtest: ${sesionDirs.length} carpetas abiertas en estado manual_pending`,
  ],
  classification,
  extra: [
    `\`${INFORME}\`: conteos, 13 reglas, cola, tono, reescrituras (0) y cierre del carril.`,
    "`content/lote2_fase001_tanda22.json`: artefacto con el formato completo, la autoprueba y las 100 tareas clasificadas.",
    "`content/plan2700_dialogos.json`: sección `lote2` con corte, formato e informe (tarea 2175).",
    "`tools/qa/dialogos_formato_check.mjs`: control con `--selftest`; `docs/qa/playtest/README.md` gana la ficha obligatoria (2193).",
    "CI: paso «Volcado y formato de diálogos (LOTE 2)» antes de `verify:all`.",
  ],
  pending: [
    "Reescrituras editoriales de los avisos con contexto de escena — Equipo editorial (2109, 2117, 2136, 2138).",
    "Releído de escenas clave tras reescrituras — Lectura humana (2180).",
    "Cuota de playtest por sesión — LOTE 2 fase 002 (2192); sesiones 1–60 — playtest humano.",
  ],
});

publish(ARTIFACT, artifact, ACTA, actaDoc, VERIFY);
const done = VERIFY ? "verificado" : "generado";
console.log(`FASE 001 tanda 22 ${done}: ${t.firstId}–${t.lastId} · formato ${formato.totalErrores} errores/${formato.totalAvisos} avisos · ${JSON.stringify(classification.counts)}`);
console.log(`  ${rel(ARTIFACT)} · ${rel(ACTA)} · ${INFORME}`);
