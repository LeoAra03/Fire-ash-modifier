import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { assertSameFile } from "./lib/package_integrity.mjs";

const directory = fs.mkdtempSync(path.join(os.tmpdir(), "package-integrity-"));
try {
  const source = path.join(directory, "source.rxdata");
  const destination = path.join(directory, "copy.rxdata");
  const original = Buffer.from([0, 4, 8, 255]);
  assert.throws(() => assertSameFile(source, destination), /origen/);
  fs.writeFileSync(source, original);
  assert.throws(() => assertSameFile(source, destination), /paquete/);
  fs.writeFileSync(destination, original);
  assert.doesNotThrow(() => assertSameFile(source, destination));
  fs.writeFileSync(destination, Buffer.from([0, 4, 8, 254]));
  assert.throws(() => assertSameFile(source, destination), /desactualizado/);
  assert.deepEqual(fs.readFileSync(source), original);
  assert.deepEqual(fs.readFileSync(destination), Buffer.from([0, 4, 8, 254]));
  console.log("package integrity: archivos ausentes, copia idéntica, corrupción del mismo tamaño y verificación sin escritura OK");
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
