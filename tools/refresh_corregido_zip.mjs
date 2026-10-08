#!/usr/bin/env node
/**
 * refresh_corregido_zip.mjs
 *
 * Mantiene actualizado el ZIP descargable de la raíz del repositorio
 * (`Fire-Ash-Scripts-Corregidos.zip`), que es el que se comparte por fuera de
 * GitHub: contiene exactamente las carpetas `Data`, `Graphics` y `Audio` del
 * paquete directo (`Scripts_corregido/Paquete_directo/`) más el `LEEME.txt`
 * generado a partir de `Scripts_corregido/LEEME.md`.
 *
 * El ZIP de la raíz se armó una vez y luego se fue parcheando; esta herramienta
 * lo reconstruye de forma reproducible conservando su lista de entradas, para
 * que nunca quede con un `Scripts.rxdata` viejo.
 *
 * Uso:
 *   node tools/refresh_corregido_zip.mjs           # reconstruye el ZIP
 *   node tools/refresh_corregido_zip.mjs --verify  # solo comprueba que esté al día
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listFiles, readZipEntry, readZipIndex, writeZipEntries } from "./lib/zip_writer.mjs";
import { leemeToText } from "./build_direct_package.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGE = path.join(ROOT, "Scripts_corregido");
const DIRECT = path.join(PACKAGE, "Paquete_directo");
const README_MD = path.join(PACKAGE, "LEEME.md");
const README_TXT = "LEEME.txt";
const ZIP = path.join(ROOT, "Fire-Ash-Scripts-Corregidos.zip");
const VERIFY_ONLY = process.argv.includes("--verify");

if (!fs.existsSync(README_MD)) throw new Error(`Falta ${README_MD}`);
if (!fs.existsSync(DIRECT)) throw new Error(`Falta ${DIRECT}`);

/** Método de compresión de cada entrada del ZIP actual (0 sin comprimir, 8 deflate). */
function currentMethods() {
  const methods = new Map();
  if (!fs.existsSync(ZIP)) return methods;
  const zip = readZipIndex(ZIP);
  for (const [name, record] of zip.entries) methods.set(name, record.method);
  return methods;
}

/** Lista de entradas del ZIP: la existente o, si no hay, el paquete completo. */
function entryNames() {
  if (fs.existsSync(ZIP)) {
    const order = [];
    const zip = readZipIndex(ZIP);
    for (const name of zip.entries.keys()) order.push(name);
    // readZipIndex no conserva el orden del índice: se reordena igual que lo
    // escribe zip_writer (carpetas primero, luego archivos alfabéticos).
    const dirs = new Set();
    for (const name of order) {
      const parts = name.split("/");
      parts.pop();
      let current = "";
      for (const part of parts) {
        current = current ? `${current}/${part}` : part;
        dirs.add(`${current}/`);
      }
    }
    return [...new Set([...dirs].sort().concat(order.sort()))];
  }
  return [...new Set([...listFiles(DIRECT), README_TXT].sort())];
}

function contentFor(name) {
  if (name.endsWith("/")) return Buffer.alloc(0);
  if (name === README_TXT) return Buffer.from(leemeToText(fs.readFileSync(README_MD, "utf8")), "utf8");
  const source = path.join(DIRECT, name);
  if (!fs.existsSync(source)) return null;
  return fs.readFileSync(source);
}

const names = entryNames();
const methods = currentMethods();
const entries = [];
for (const name of names) {
  const content = contentFor(name);
  if (content === null) {
    console.log(`AVISO: ${name} no está en Paquete_directo/ ni es ${README_TXT}; se conserva del ZIP actual`);
    if (fs.existsSync(ZIP)) entries.push({ name, content: readZipEntry(readZipIndex(ZIP), name) });
    continue;
  }
  // Se conserva el método de compresión original para que el ZIP siga siendo
  // el mismo artefacto compacto que ya se comparte (sin carpetas comprimidas
  // de más ni archivos sin comprimir de más).
  const method = name.endsWith("/") ? 0 : methods.get(name);
  entries.push(method === undefined ? { name, content } : { name, content, method });
}
const files = entries.filter((entry) => !entry.name.endsWith("/"));

function verify() {
  if (!fs.existsSync(ZIP)) throw new Error("Falta Fire-Ash-Scripts-Corregidos.zip: ejecútalo sin --verify");
  const zip = readZipIndex(ZIP);
  const inZip = new Set(zip.entries.keys());
  for (const { name, content } of files) {
    if (!inZip.has(name)) throw new Error(`El ZIP no incluye ${name}`);
    if (!readZipEntry(zip, name).equals(content)) {
      throw new Error(`${name} está desactualizado en Fire-Ash-Scripts-Corregidos.zip`);
    }
  }
  for (const name of inZip) {
    if (!files.some((entry) => entry.name === name)) throw new Error(`El ZIP trae un archivo inesperado: ${name}`);
  }
  return { files: files.length, bytes: fs.statSync(ZIP).size };
}

if (!VERIFY_ONLY) {
  const result = writeZipEntries({ entries, destination: ZIP });
  console.log(`OK: Fire-Ash-Scripts-Corregidos.zip con ${result.entries.length} archivos (${(result.size / 1024 / 1024).toFixed(1)} MB)`);
}
const check = verify();
console.log(`OK: el ZIP de la raíz coincide con Paquete_directo/ y LEEME.md (${check.files} archivos, ${(check.bytes / 1024 / 1024).toFixed(1)} MB)`);
