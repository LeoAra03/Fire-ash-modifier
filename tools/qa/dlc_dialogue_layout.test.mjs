#!/usr/bin/env node
/** QA de fuentes del DLC para caja GBC: 40 caracteres × 2 líneas. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  GBC_DIALOGUE_COLUMNS,
  GBC_DIALOGUE_LINES_PER_BOX,
  formatGbcDialoguePages,
  gbcDialogueCommands,
  layoutGbcDialogue,
  visibleDialogueWidth,
} from "../lib/dlc_dialogue_layout.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const CONTENT = path.join(ROOT, "content");
const SKIP_FILE = /(?:_built|_report|_audit|_reference|_qa(?:_|\.)|_matrix|_index)\.json$/i;
const DIALOGUE_KEY = /^(?:dialogue|dialog|lineas|lines|line|texto|text|textos|before|during|after|optional|narrative|story|premise|setup|escalation|reversal|resolution|globalconnection|flavor|outcome|storytoldbyteam|counterplayhint|failurepath|reentrypath|immediatedifferences|laterdifferences|immediate|later|futurepayoff|intro|arrival|departure|orden|hecho|ascenso|rule|rules)$/i;

assert.equal(GBC_DIALOGUE_COLUMNS, 40, "el ancho GBC debe ser 40 caracteres");
assert.equal(GBC_DIALOGUE_LINES_PER_BOX, 2, "la caja GBC debe tener dos líneas");

function contentFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === "schemas" ? [] : contentFiles(file);
    return entry.isFile() && entry.name.endsWith(".json") && !SKIP_FILE.test(entry.name) ? [file] : [];
  });
}

const utterances = [];
const dialogueGroups = [];
function collect(value, source, breadcrumb, inDialogue = false) {
  if (typeof value === "string") {
    if (inDialogue && value.trim()) utterances.push({ source, breadcrumb, text: value });
    return;
  }
  if (Array.isArray(value)) {
    if (inDialogue && value.length && value.every((item) => typeof item === "string")) {
      const text = value.filter((item) => item.trim());
      if (text.length) dialogueGroups.push({ source, breadcrumb, text });
    }
    value.forEach((item, index) => collect(item, source, `${breadcrumb}[${index}]`, inDialogue));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    collect(child, source, breadcrumb ? `${breadcrumb}.${key}` : key, inDialogue || DIALOGUE_KEY.test(key));
  }
}

function assertPageLayout(source, breadcrumb, pages) {
  assert.ok(pages.length > 0, `${source} ${breadcrumb}: se perdió el texto fuente`);
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const page = pages[pageIndex];
    assert.ok(page.lines.length >= 1 && page.lines.length <= GBC_DIALOGUE_LINES_PER_BOX,
      `${source} ${breadcrumb} página ${pageIndex + 1}: ${page.lines.length} líneas (máximo 2)`);
    for (const [lineIndex, line] of page.lines.entries()) {
      const width = visibleDialogueWidth(line);
      assert.ok(width <= GBC_DIALOGUE_COLUMNS,
        `${source} ${breadcrumb} página ${pageIndex + 1}, línea ${lineIndex + 1}: ${width} caracteres (máximo 40)`);
    }
    const encodedRows = page.text.split(/\\n|\n/);
    assert.equal(encodedRows.length, page.lines.length,
      `${source} ${breadcrumb} página ${pageIndex + 1}: el salto de línea no coincide con las filas calculadas`);
  }
}

// Pruebas de borde: hablante en todas las páginas, etiquetas invisibles, cortes
// explícitos, Unicode y palabras sin espacios que exceden el ancho.
const speech = [
  "Leñador: ¿Ves la nieve? Lleva tres días sin dejar de caer y no cuaja.",
  "Leñador: En mi pueblo dicen que es porque el cielo está ocupado en otra parte.",
];
const speechLayout = layoutGbcDialogue(speech);
assert.equal(speechLayout.speaker, "Leñador");
assert.ok(speechLayout.pages.length > 1, "un diálogo largo debe continuar en otra caja, no exceder dos líneas");
assert.ok(speechLayout.pages.every((page) => page.text.startsWith("\\sp[Leñador]")),
  "cada página conserva la etiqueta de hablante");
assert.equal(speechLayout.body,
  "¿Ves la nieve? Lleva tres días sin dejar de caer y no cuaja. En mi pueblo dicen que es porque el cielo está ocupado en otra parte.",
  "se conserva el texto hablado y se elimina la repetición de la etiqueta del mismo hablante");
assertPageLayout("fixture", "hablante", speechLayout.pages);

const coded = layoutGbcDialogue("\\c[2]\\sp[Maxine] ¡Hola, Ash!\\n¿Lista para navegar?");
assert.equal(coded.speaker, "Maxine");
assertPageLayout("fixture", "códigos y salto explícito", coded.pages);
const longWord = layoutGbcDialogue("X".repeat(95));
assertPageLayout("fixture", "palabra indivisible", longWord.pages);
assert.equal(longWord.rows.map((line) => visibleDialogueWidth(line)).join(","), "40,40,15");

const commands = gbcDialogueCommands(speech, {
  cmd: (code, params, indent) => ({ code, params, indent }),
  S: (value) => String(value),
});
const emittedPages = [];
for (let index = 0; index < commands.length;) {
  assert.equal(commands[index].code, 101, "cada página comienza en un comando 101 nuevo");
  assert.equal(commands[index + 1]?.code, 401, "cada página emite su texto en 401");
  emittedPages.push(commands[index + 1].params[0]);
  index += 2;
}
assert.deepEqual(emittedPages, formatGbcDialoguePages(speech), "la capa RMXP usa el mismo formato que el auditor");

let sourceFileCount = 0;
for (const file of contentFiles(CONTENT)) {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const relative = path.relative(ROOT, file);
  sourceFileCount++;
  collect(data, relative, "");
}
assert.ok(sourceFileCount > 0, "se encontraron manifiestos de contenido DLC");
assert.ok(utterances.length > 0, "se encontraron fuentes de diálogo del DLC");

let checkedPages = 0;
for (const entry of utterances) {
  const layout = layoutGbcDialogue(entry.text);
  assertPageLayout(entry.source, entry.breadcrumb, layout.pages);
  checkedPages += layout.pages.length;
}
for (const entry of dialogueGroups) {
  const layout = layoutGbcDialogue(entry.text);
  assertPageLayout(entry.source, entry.breadcrumb, layout.pages);
  checkedPages += layout.pages.length;
}

console.log(`OK: ${utterances.length} frases y ${dialogueGroups.length} grupos de diálogo en ${sourceFileCount} manifiestos.`);
console.log(`OK: ${checkedPages} páginas cumplen ${GBC_DIALOGUE_LINES_PER_BOX} líneas × ${GBC_DIALOGUE_COLUMNS} caracteres GBC.`);
