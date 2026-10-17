#!/usr/bin/env node
/** Verificación de entrega y cierre de la tanda 26. */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
const OUT = path.join(ROOT, "content", "lote5_fase026_entrega.json");
const VERIFY = process.argv.includes("--verify");
const required = [
  "Fire-Ash-Scripts-Corregidos.zip",
  "Scripts_corregido/Fire_Ash_Paquete_Directo.zip",
  "Scripts_corregido/Dimensional_Nightmare_QA.zip",
  "Scripts_corregido/Mapas_PNG_y_Informe_Referencial.zip",
  "Scripts_corregido/Fire_Ash_Expansion_Multiversal.zip",
];
const forbid = /(?:PokeModBackups|(?:^|\/)Save\d*|Game\.rxdata|\.bak$|\.tmp$|(?:^|\/)content\/|(?:^|\/)tools\/)/i;
function sha256(file) { return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex"); }
function listZip(file) {
  try { return execFileSync("unzip", ["-Z1", file], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }).split(/\r?\n/).filter(Boolean).sort(); }
  catch { return null; }
}
const packages = required.map((relative) => {
  const file = path.join(ROOT, relative);
  const exists = fs.existsSync(file);
  const entries = exists ? listZip(file) : null;
  return { path: relative, exists, bytes: exists ? fs.statSync(file).size : null, sha256: exists ? sha256(file) : null, readable: Boolean(entries), entries: entries?.length ?? null, forbidden: (entries ?? []).filter((entry) => forbid.test(entry)).slice(0, 100) };
});
const versioned = execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 }).split("\0").filter(Boolean);
const rootArtifacts = versioned.filter((file) => /(?:^|\/)(?:Save\d*|Game\.rxdata|.*\.bak|.*\.tmp)$/i.test(file));
const packagePaths = new Set(required);
const packageMissing = packages.filter((item) => !item.exists || !item.readable);
const packageForbidden = packages.flatMap((item) => item.forbidden.map((entry) => ({ package: item.path, entry })));
const report = {
  schema: "lote5_fase026_entrega/1.0",
  tasks: "2500–2599",
  packages,
  checks: {
    requiredPackages: { count: required.length, missing: packageMissing },
    forbiddenPackageEntries: packageForbidden,
    versionedRuntimeArtifacts: rootArtifacts,
    allRequiredPackagesReadable: packageMissing.length === 0,
    packagesContainNoBackupsOrSaves: packageForbidden.length === 0,
    rootZipIsUnder64MiB: packages[0].bytes !== null && packages[0].bytes <= 64 * 1024 * 1024,
  },
  generated: {
    directPackage: "npm run build:package && npm run verify:package",
    correctedZip: "npm run build:corregido:zip && npm run verify:corregido:zip",
    nightmareQA: "npm run build:dn:qa && npm run verify:dn:qa",
    rutaDeDios: "npm run sync:ruta_de_dios:package && npm run verify:ruta_de_dios:package",
    expansion: "npm run build:expansion:package && npm run verify:expansion:package",
    mapReference: "npm run create:map-reference && npm run verify:map-reference",
  },
  manual: [
    "instalar sobre copia limpia y arrancar Game.exe",
    "recorrer contenido completo y verificar Android/Kirin",
    "comprobar desinstalación desde backups originales",
    "descargar la entrega desde GitHub y repetir instalación",
  ],
  policy: "Los paquetes no deben contener análisis, backups ni partidas; las fuentes no redistribuibles quedan fuera de la entrega.",
};
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (VERIFY) {
  if (!fs.existsSync(OUT)) throw new Error(`Falta ${path.relative(ROOT, OUT)}`);
  if (fs.readFileSync(OUT, "utf8") !== serialized) throw new Error(`${path.relative(ROOT, OUT)} está desactualizado`);
} else fs.writeFileSync(OUT, serialized);
const status = packageMissing.length || packageForbidden.length || !report.checks.rootZipIsUnder64MiB ? "review" : "pass_static";
console.log(`FASE 026 entrega: ${required.length} paquetes · faltantes/no legibles ${packageMissing.length} · entradas prohibidas ${packageForbidden.length} · ${status}`);
