#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  EXPECTED_GBA_PARTS,
  build7ZipExtractArgs,
  copyTreeSafe,
  extractGbaMultipartArchive,
  findGbaMultipartParts,
  resolveSafeDestinationPath,
} from "./lib/gba_multipart_extract.mjs";

const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "gba-multipart-test-"));

try {
  const inputDir = path.join(workspace, "entrada");
  fs.mkdirSync(inputDir, { recursive: true });

  assert.throws(
    () => findGbaMultipartParts(inputDir),
    /Faltan partes del archivo multipart/,
    "debe exigir exactamente gba.part01..04"
  );

  for (const name of EXPECTED_GBA_PARTS) {
    fs.writeFileSync(path.join(inputDir, name), Buffer.from([0x01]));
  }
  const parts = findGbaMultipartParts(inputDir);
  assert.equal(path.basename(parts.firstPart), "gba.part01", "la extracción debe iniciarse desde la primera parte");
  assert.equal(parts.parts.length, 4, "debe detectar las cuatro partes");

  const args = build7ZipExtractArgs({
    firstPart: parts.firstPart,
    destinationDir: "/tmp/salida",
    password: "12345678",
  });
  assert.deepEqual(args.slice(0, 4), ["x", "-y", "-p12345678", "-o/tmp/salida"], "debe construir comando 7z con clave y salida");
  assert.equal(args[4], parts.firstPart, "debe pasar la primera parte al extractor");

  const safeDestination = resolveSafeDestinationPath("/tmp/roms", "nested/file.gba");
  assert.equal(safeDestination, path.resolve("/tmp/roms", "nested/file.gba"));
  assert.throws(() => resolveSafeDestinationPath("/tmp/roms", "../escape.gba"), /Ruta fuera del destino/);

  const extractedRoot = path.join(workspace, "extraido");
  fs.mkdirSync(path.join(extractedRoot, "nested"), { recursive: true });
  fs.writeFileSync(path.join(extractedRoot, "nested", "rom.gba"), "ROM");
  const finalDestination = path.join(workspace, "gba roms");
  copyTreeSafe(extractedRoot, finalDestination);
  assert.equal(fs.readFileSync(path.join(finalDestination, "nested", "rom.gba"), "utf8"), "ROM");

  const destinationFromExtractor = path.join(workspace, "destino_extractor");
  const extracted = extractGbaMultipartArchive({
    inputDir,
    destinationDir: destinationFromExtractor,
    password: "12345678",
    findExtractor: () => "7z",
    runExtractor: (_bin, runArgs) => {
      const outputArg = runArgs.find((value) => value.startsWith("-o"));
      assert.ok(outputArg, "debe indicar carpeta temporal de salida");
      assert.equal(path.basename(runArgs[4]), "gba.part01", "debe usar la parte inicial del multipart");
      const tempOut = outputArg.slice(2);
      fs.mkdirSync(path.join(tempOut, "roms"), { recursive: true });
      fs.writeFileSync(path.join(tempOut, "roms", "demo.gba"), "OK");
    },
  });
  assert.equal(extracted.extractor, "7z");
  assert.equal(
    fs.readFileSync(path.join(destinationFromExtractor, "roms", "demo.gba"), "utf8"),
    "OK",
    "debe copiar al destino final y crearlo automáticamente"
  );

  console.log("gba multipart: validación de nombres, comando 7z, creación de destino y copia segura OK");
} finally {
  fs.rmSync(workspace, { recursive: true, force: true });
}
