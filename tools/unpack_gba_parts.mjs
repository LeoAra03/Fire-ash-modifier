#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractGbaMultipartArchive, EXPECTED_GBA_PARTS } from "./lib/gba_multipart_extract.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_INPUT = path.join(ROOT, "reference", "roms_invitadas", "entrada");

const arg = (name, fallback = null) => {
  const key = `--${name}`;
  const index = process.argv.indexOf(key);
  if (index < 0) return fallback;
  const value = process.argv[index + 1];
  return value && !value.startsWith("--") ? value : fallback;
};

const inputDir = path.resolve(arg("entrada", DEFAULT_INPUT));
const outputDir = path.resolve(arg("salida", path.join(inputDir, "gba roms")));
const password = arg("clave");

if (!password) {
  console.error("Uso: node tools/unpack_gba_parts.mjs --clave 12345678 [--entrada <carpeta>] [--salida \"gba roms\"]");
  process.exit(1);
}

try {
  const result = extractGbaMultipartArchive({
    inputDir,
    destinationDir: outputDir,
    password,
  });

  console.log(`Partes detectadas: ${EXPECTED_GBA_PARTS.join(", ")}`);
  console.log(`Extracción completada en: ${result.destinationDir}`);
  console.log(`Extractor usado: ${result.extractor}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
