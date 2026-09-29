#!/usr/bin/env node
/**
 * Empaqueta `Scripts_corregido/Paquete_directo/` en el ZIP descargable.
 *
 * El ZIP se descomprime directamente sobre la raíz del juego (la que tiene
 * `Game.exe`): las carpetas `Data`, `Graphics` y `Audio` van en la raíz, sin
 * una carpeta intermedia. Además incluye `LEEME.txt` generado a partir de
 * `LEEME.md` para que las instrucciones viajen dentro del archivo.
 *
 * Uso:
 *   node tools/build_direct_package.mjs           # reconstruye el ZIP
 *   node tools/build_direct_package.mjs --verify  # solo comprueba el ZIP actual
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listFiles, readZipEntry, readZipIndex, writeZip } from "./lib/zip_writer.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGE = path.join(ROOT, "Scripts_corregido");
const DIRECT = path.join(PACKAGE, "Paquete_directo");
const ZIP = path.join(PACKAGE, "Fire_Ash_Paquete_Directo.zip");
const README_MD = path.join(PACKAGE, "LEEME.md");
const README_TXT = "LEEME.txt";
const VERIFY_ONLY = process.argv.includes("--verify");

/** Convierte el LEEME en Markdown a texto plano legible dentro del ZIP. */
export function leemeToText(markdown) {
  return `${markdown
    .replace(/^```[a-z]*$/gm, "")
    .replace(/^(#{1,6})\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim()}\n`;
}

function readmeText() {
  if (!fs.existsSync(README_MD)) throw new Error(`Falta ${README_MD}`);
  return leemeToText(fs.readFileSync(README_MD, "utf8"));
}

export function build() {
  if (!fs.existsSync(DIRECT)) throw new Error(`Falta ${DIRECT}`);
  writeZip({ root: DIRECT, destination: ZIP, extraFiles: { [README_TXT]: readmeText() } });
}

export function verify() {
  if (!fs.existsSync(ZIP)) throw new Error("Falta Fire_Ash_Paquete_Directo.zip: ejecútalo sin --verify");
  const expected = new Set([...listFiles(DIRECT), README_TXT]);
  const zip = readZipIndex(ZIP);
  const actual = new Set(zip.entries.keys());

  for (const name of expected) {
    if (!actual.has(name)) throw new Error(`El ZIP no incluye ${name}`);
  }
  for (const name of actual) {
    if (!expected.has(name)) throw new Error(`El ZIP trae un archivo inesperado: ${name}`);
    if (name.includes("..") || name.startsWith("/")) throw new Error(`Ruta insegura en el ZIP: ${name}`);
  }
  for (const name of expected) {
    const onDisk = name === README_TXT ? Buffer.from(readmeText(), "utf8") : fs.readFileSync(path.join(DIRECT, name));
    const inZip = readZipEntry(zip, name);
    if (!onDisk.equals(inZip)) throw new Error(`El contenido de ${name} no coincide con Paquete_directo/`);
  }
  return { files: expected.size, bytes: fs.statSync(ZIP).size };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!VERIFY_ONLY) build();
  const result = verify();
  console.log(
    `OK: Fire_Ash_Paquete_Directo.zip con ${result.files} archivos (${(result.bytes / 1024).toFixed(0)} KB)`,
  );
}
