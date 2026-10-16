#!/usr/bin/env node
/**
 * glosario_check.mjs
 *
 * Comprueba el sello del glosario congelado (fase 1/46199, tarea 35).
 *
 * Verifica cinco cosas:
 *   1. existe `docs/qa/glosario.md` y su SHA-256 coincide con el sello;
 *   2. los términos congelados están como encabezado `##` y **no hay ninguno más**
 *      (añadir un término obliga a re-sellar: el diccionario no crece por accidente);
 *   3. cada fuente declarada en el sello existe en el repositorio;
 *   4. cada cita literal (`busca`) sigue apareciendo en su fuente, incluidos los dos
 *      lados de cada divergencia registrada;
 *   5. el sello declara revisión, fecha y protocolo.
 *
 * Uso:
 *   node tools/qa/glosario_check.mjs               # comprueba (código 1 si falla)
 *   node tools/qa/glosario_check.mjs --json        # salida legible por máquina
 *   node tools/qa/glosario_check.mjs --recongelar  # sube la revisión y re-sella
 *
 * `--recongelar` es la única forma de mover el sello: no reescribe el glosario, solo
 * el registro de `content/qa_glosario_congelado.json` (revisión, fecha, hash).
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SELLO = path.join(ROOT, "content", "qa_glosario_congelado.json");
const BANDERAS = {
  json: process.argv.includes("--json"),
  recongelar: process.argv.includes("--recongelar"),
};

const sha256 = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");

function leerSello() {
  if (!fs.existsSync(SELLO)) throw new Error("Falta content/qa_glosario_congelado.json: el glosario no está sellado");
  try {
    return JSON.parse(fs.readFileSync(SELLO, "utf8"));
  } catch (error) {
    throw new Error(`content/qa_glosario_congelado.json no es JSON válido: ${error.message}`);
  }
}

/** Encabezados `## ` del glosario, sin los separadores ni las líneas de cierre. */
function encabezados(markdown) {
  return markdown
    .split("\n")
    .filter((linea) => /^##\s+\S/.test(linea))
    .map((linea) => linea.replace(/^##\s+/, "").trim());
}

function comprobarCita(fallo, etiqueta, fuente) {
  if (!fuente || !fuente.ruta) {
    fallo.push(`${etiqueta}: fuente sin ruta declarada`);
    return;
  }
  const abs = path.join(ROOT, fuente.ruta);
  if (!fs.existsSync(abs)) {
    fallo.push(`${etiqueta}: no existe la fuente ${fuente.ruta}`);
    return;
  }
  if (!fuente.busca) return;
  const texto = fs.readFileSync(abs, "utf8");
  if (!texto.includes(fuente.busca)) {
    fallo.push(`${etiqueta}: la cita no aparece en ${fuente.ruta} → «${fuente.busca}»`);
  }
}

function comprobar(sello) {
  const fallos = [];
  const avisos = [];
  const glosarioPath = path.join(ROOT, sello.archivo ?? "docs/qa/glosario.md");

  if (!fs.existsSync(glosarioPath)) {
    fallos.push(`no existe el glosario ${sello.archivo}`);
    return { fallos, avisos, hash: null, encabezados: [] };
  }

  const contenido = fs.readFileSync(glosarioPath);
  const hash = sha256(contenido);
  const texto = contenido.toString("utf8");

  if (sello.sha256 !== hash) {
    if (sello.sha256 === "PENDIENTE") {
      fallos.push("el sello está sin hash: ejecuta --recongelar y commitea el registro");
    } else {
      fallos.push(`el glosario cambió y el sello no: hash medido ${hash.slice(0, 16)}… ≠ sellado ${String(sello.sha256).slice(0, 16)}…`);
    }
  }

  const terminos = sello.terminos ?? [];
  if (terminos.length === 0) fallos.push("el sello no declara términos");
  const seccionesExtra = sello.secciones_extra ?? [];
  const esperados = [...terminos, ...seccionesExtra];

  const encontrados = encabezados(texto);
  for (const termino of terminos) {
    if (!encontrados.includes(termino)) fallos.push(`falta el encabezado del término «${termino}»`);
  }
  for (const encontrado of encontrados) {
    if (!esperados.includes(encontrado)) {
      fallos.push(`encabezado «${encontrado}» no declarado en el sello: re-sella para admitirlo`);
    }
  }
  for (const extra of seccionesExtra) {
    if (!encontrados.includes(extra)) avisos.push(`la sección «${extra}» ya no está en el glosario: actualiza secciones_extra`);
  }

  for (const fuente of sello.fuentes ?? []) comprobarCita(fallos, `fuente de «${fuente.termino}»`, fuente);
  if ((sello.fuentes ?? []).length === 0) fallos.push("el sello no declara fuentes");
  const conCita = (sello.fuentes ?? []).filter((fuente) => fuente.busca).length;
  if (conCita === 0) fallos.push("ninguna fuente tiene cita literal: el sello no comprueba nada");

  for (const divergencia of sello.divergencias ?? []) {
    if (!divergencia.id || !divergencia.titulo) fallos.push("una divergencia no declara id o título");
    const lados = divergencia.lados ?? [];
    if (lados.length < 2) fallos.push(`${divergencia.id}: una divergencia necesita los dos lados`);
    lados.forEach((lado, i) => comprobarCita(fallos, `${divergencia.id} lado ${i + 1}`, lado));
  }

  for (const campo of ["revision", "fecha", "protocolo"]) {
    if (!sello[campo]) fallos.push(`el sello no declara «${campo}»`);
  }

  return { fallos, avisos, hash, encabezados: encontrados, conCita };
}

function recongelar(sello, hash) {
  const revisionPrevia = sello.revision ?? "R0";
  // El primer sellado (hash "PENDIENTE") confirma la revisión declarada; los
  // siguientes la suben, porque cada uno es un cambio deliberado del diccionario.
  const inicial = sello.sha256 === "PENDIENTE";
  const numero = Number.parseInt(String(revisionPrevia).replace(/^R/, ""), 10);
  const revision = inicial ? revisionPrevia : `R${Number.isFinite(numero) ? numero + 1 : 1}`;
  const fecha = new Date().toISOString().slice(0, 10);
  const actualizado = {
    ...sello,
    revision,
    fecha,
    hash_anterior: sello.sha256,
    sha256: hash,
    protocolo:
      sello.protocolo ??
      "Editar el glosario exige re-sellar con `node tools/qa/glosario_check.mjs --recongelar` en el mismo commit.",
  };
  delete actualizado._nota;
  fs.writeFileSync(SELLO, `${JSON.stringify(actualizado, null, 2)}\n`);
  console.log(`Sello actualizado: ${revisionPrevia} → ${revision} (${fecha}) con ${hash.slice(0, 16)}…`);
  console.log("Recuerda commitear content/qa_glosario_congelado.json con la edición del glosario.");
}

const sello = leerSello();
const resultado = comprobar(sello);

if (BANDERAS.recongelar) {
  if (!resultado.hash) {
    console.error(`No se puede sellar: ${resultado.fallos.join("; ")}`);
    process.exit(1);
  }
  recongelar(sello, resultado.hash);
  process.exit(0);
}

if (BANDERAS.json) {
  console.log(
    JSON.stringify(
      {
        ok: resultado.fallos.length === 0,
        revision: sello.revision,
        fecha: sello.fecha,
        hash: resultado.hash,
        terminos: sello.terminos,
        encabezados: resultado.encabezados,
        fuentes: (sello.fuentes ?? []).length,
        citas: resultado.conCita,
        divergencias: (sello.divergencias ?? []).length,
        fallos: resultado.fallos,
        avisos: resultado.avisos,
      },
      null,
      2,
    ),
  );
  process.exit(resultado.fallos.length === 0 ? 0 : 1);
}

console.log(`Glosario congelado — ${sello.archivo} (revisión ${sello.revision}, ${sello.fecha})`);
console.log(`  términos: ${(sello.terminos ?? []).join(" · ")}`);
console.log(`  fuentes: ${(sello.fuentes ?? []).length} declaradas, ${resultado.conCita} con cita literal verificable`);
console.log(`  divergencias registradas: ${(sello.divergencias ?? []).map((d) => d.id).join(", ") || "ninguna"}`);
for (const aviso of resultado.avisos) console.log(`  AVISO: ${aviso}`);
for (const fallo of resultado.fallos) console.error(`  FALLO: ${fallo}`);
if (resultado.fallos.length === 0) {
  console.log("OK: el glosario coincide con su sello, los 7 términos están cerrados y todas las citas siguen en pie");
  process.exit(0);
}
console.error(`FALLO: ${resultado.fallos.length} problema(s). Si el cambio fue deliberado: --recongelar en el mismo commit.`);
process.exit(1);
