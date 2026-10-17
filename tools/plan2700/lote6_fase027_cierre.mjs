#!/usr/bin/env node
/**
 * Auditoría reproducible del bloque de cierre documental y de entrega (FASE 027).
 *
 * El bloque contiene comprobaciones que necesitan Game.exe, Android/Kirin o una
 * persona (instalación, playtest, revisión externa). No suplanta esas pruebas:
 * comprueba lo que sí puede comprobarse en el checkout, deja cada pendiente con
 * estado explícito y evita convertir una cifra estática en una certificación de
 * runtime.
 *
 * Uso:
 *   node tools/plan2700/lote6_fase027_cierre.mjs
 *   node tools/plan2700/lote6_fase027_cierre.mjs --verify
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
const OUT = path.join(ROOT, "content", "lote6_fase027_cierre.json");
const VERIFY = process.argv.includes("--verify");
const requiredPackages = [
  "Fire-Ash-Scripts-Corregidos.zip",
  "Scripts_corregido/Fire_Ash_Paquete_Directo.zip",
  "Scripts_corregido/Dimensional_Nightmare_QA.zip",
  "Scripts_corregido/Mapas_PNG_y_Informe_Referencial.zip",
  "Scripts_corregido/Fire_Ash_Expansion_Multiversal.zip",
];
const forbiddenEntry = /(?:^|\/)(?:PokeModBackups|backups?|Save\d*|Game\.rxdata)(?:\/|$)|(?:\.bak|\.tmp|\.part)$/i;
const forbiddenSource = /(?:^|\/)(?:content|tools|reference\/roms_invitadas|roms? pokemon)(?:\/|$)|\.(?:gba|gbc|ips|ups|xdelta)$/i;
const guestMosaic = /(?:mosaico|mosaic|guest[_ -]?rom|rom[_ -]?derived|roms?_invitad)/i;
const requiredDocs = [
  ["docs/qa/defectos.md", "Registro de defectos"],
  ["docs/qa/guia_mantenimiento.md", "Guía de mantenimiento"],
  ["docs/qa/mapa_conocimiento.md", "Mapa de conocimiento"],
  ["docs/qa/reversion_bloque.md", "Prueba de reversión"],
  ["docs/qa/lote6/fase_027_cierre.md", "FASE 027"],
  ["docs/ENTREGA_FINAL_LIMITACIONES.md", "Limitaciones conocidas"],
  ["Scripts_corregido/LEEME.md", "Limitaciones comprobables"],
];
const commands = [
  "npm run build:package && npm run verify:package",
  "npm run build:corregido:zip && npm run verify:corregido:zip",
  "npm run build:dn:qa && npm run verify:dn:qa",
  "npm run sync:ruta_de_dios:package && npm run verify:ruta_de_dios:package",
  "npm run build:expansion:package && npm run verify:expansion:package",
  "npm run create:map-reference && npm run verify:map-reference",
  "node tools/inventario_congelado.mjs --verify",
  "node tools/qa/artifact_budget_check.mjs --json",
];

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}
function zipEntries(file) {
  try {
    return execFileSync("unzip", ["-Z1", file], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })
      .split(/\r?\n/).filter(Boolean).sort();
  } catch {
    return null;
  }
}
function readText(relative) {
  const file = path.join(ROOT, relative);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}
function gitFiles() {
  return execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 })
    .split("\0").filter(Boolean).sort();
}
function packageAudit(relative) {
  const file = path.join(ROOT, relative);
  const exists = fs.existsSync(file);
  const entries = exists ? zipEntries(file) : null;
  const forbidden = (entries ?? []).filter((entry) => forbiddenEntry.test(entry));
  const source = (entries ?? []).filter((entry) => forbiddenSource.test(entry));
  const mosaic = (entries ?? []).filter((entry) => guestMosaic.test(entry));
  return {
    path: relative,
    exists,
    readable: Boolean(entries),
    bytes: exists ? fs.statSync(file).size : null,
    sha256: exists ? sha256(file) : null,
    entries: entries?.length ?? null,
    forbiddenRuntimeEntries: forbidden,
    forbiddenGuestSourceEntries: source,
    guestMosaicNames: mosaic,
  };
}
function trackedRuntimeArtifacts(files) {
  return files.filter((file) =>
    /(?:^|\/)(?:Save\d*|Game\.rxdata|.*\.(?:bak|tmp|part))$/i.test(file) ||
    /(?:^|\/)PokeModBackups\//i.test(file));
}
function cleanInstallCheck(packages) {
  const direct = packages.find((p) => p.path === "Scripts_corregido/Fire_Ash_Paquete_Directo.zip");
  const entries = new Set(zipEntries(path.join(ROOT, direct?.path ?? "")) ?? []);
  const required = ["Data/Scripts.rxdata", "Data/MapInfos.rxdata", "LEEME.txt"];
  return {
    package: direct?.path ?? null,
    requiredFiles: required,
    present: required.filter((file) => [...entries].some((entry) => entry === file || entry === `${file}/`)),
    missing: required.filter((file) => !entries.has(file)),
    mode: "patch_over_existing_game",
    note: "El ZIP es un parche; Game.exe y las partidas del jugador quedan fuera. La instalación limpia real queda en pending_human_review.",
  };
}
function docAudit() {
  const missing = [];
  const empty = [];
  const found = [];
  for (const [relative, marker] of requiredDocs) {
    const text = readText(relative);
    if (!text) missing.push(relative);
    else if (!text.includes(marker)) empty.push({ path: relative, marker });
    else found.push(relative);
  }
  return { required: requiredDocs.map(([path_, marker]) => ({ path: path_, marker })), found, missing, wrongMarker: empty };
}
function defectPolicyAudit() {
  const text = readText("docs/qa/defectos.md");
  const requiredMarkers = ["ID", "Estado", "Reproducción", "Regresión", "Alcance", "pending_human_review"];
  return {
    present: Boolean(text),
    requiredMarkers,
    missingMarkers: requiredMarkers.filter((marker) => !text.includes(marker)),
    knownOpen: (text.match(/\|[^\n]*\|\s*(?:open|pending|known|pending_human_review)/gi) ?? []).length,
    policy: "No se borra ni se salta un defecto: se reproduce, se clasifica, se corrige, se regresa y se reverifica; lo humano queda pendiente y visible.",
  };
}
function docsNumbersAudit() {
  const files = ["docs/qa/lote6/fase_027_cierre.md", "docs/qa/guia_mantenimiento.md", "docs/qa/mapa_conocimiento.md", "docs/ENTREGA_FINAL_LIMITACIONES.md"];
  const commandsPresent = files.flatMap((file) => commands.filter((command) => readText(file).includes(command)).map((command) => ({ file, command })));
  return { files, commandsListed: commandsPresent, commandCount: commandsPresent.length };
}
function romPolicyAudit() {
  const ignored = readText(".gitignore");
  const docs = `${readText("docs/ENTREGA_FINAL_LIMITACIONES.md")}\n${readText("docs/qa/guia_mantenimiento.md")}`;
  const scripts = ["tools/rom_nativo_mapas.mjs", "tools/rom_nativo_sprites.mjs", "tools/rom_nativo_mapas.mjs"]
    .map((file) => ({ file, exists: fs.existsSync(path.join(ROOT, file)) }));
  return {
    ignoredGuestRoms: ignored.includes("reference/roms_invitadas/") && ignored.includes("roms pokemon/"),
    documentedDependency: /ROM|ROMs|invitad/i.test(docs),
    defaultWithoutRom: /sin las ROM|sin ROM|ausente/i.test(docs),
    nativeTools: scripts,
    rule: "La entrega no contiene ROMs ni mosaicos derivados; los extractores nativos solo se ejecutan con una fuente local explícita y no son parte del arranque normal.",
  };
}
function buildReport() {
  const packages = requiredPackages.map(packageAudit);
  const files = gitFiles();
  const docs = docAudit();
  const defects = defectPolicyAudit();
  const guestMosaics = packages.flatMap((p) => p.guestMosaicNames.map((entry) => ({ package: p.path, entry })));
  const forbidden = packages.flatMap((p) => [
    ...p.forbiddenRuntimeEntries.map((entry) => ({ package: p.path, entry, kind: "runtime" })),
    ...p.forbiddenGuestSourceEntries.map((entry) => ({ package: p.path, entry, kind: "guest_source" })),
  ]);
  const missingPackages = packages.filter((p) => !p.exists || !p.readable).map((p) => p.path);
  const staticFailures = [
    ...missingPackages.map((path_) => `paquete ausente o ilegible: ${path_}`),
    ...forbidden.map((x) => `${x.kind} prohibido en ${x.package}: ${x.entry}`),
    ...guestMosaics.map((x) => `nombre de mosaico derivado de ROM invitada en ${x.package}: ${x.entry}`),
    ...docs.missing.map((path_) => `documento requerido ausente: ${path_}`),
    ...docs.wrongMarker.map((x) => `${x.path} no contiene el marcador requerido «${x.marker}»`),
    ...defects.missingMarkers.map((marker) => `registro de defectos sin campo «${marker}»`),
  ];
  return {
    schema: "lote6_fase027_cierre/1.0",
    tasks: "2600–2699",
    packages,
    checks: {
      requiredPackages: { count: requiredPackages.length, missing: missingPackages },
      forbiddenPackageEntries: forbidden,
      guestRomDerivedMosaics: guestMosaics,
      versionedRuntimeArtifacts: trackedRuntimeArtifacts(files),
      allRequiredPackagesReadable: missingPackages.length === 0,
      packagesContainNoBackupsSavesOrGuestSources: forbidden.length === 0,
      packagesContainNoGuestRomDerivedMosaics: guestMosaics.length === 0,
      cleanInstallManifest: cleanInstallCheck(packages),
      documentation: docs,
      defectRegister: defects,
      romIndependence: romPolicyAudit(),
      temporaryTrackedFiles: files.filter((file) => /(?:^|\/)(?:tmp|temp|scratch)(?:\/|$)|\.(?:tmp|swp)$/i.test(file)),
      staticFailures,
    },
    reproducibility: {
      commands,
      numbersPolicy: "Toda cifra de este bloque debe tener una fuente o comando vecino; las pruebas de runtime se listan como manual_pending.",
      cleanClone: "pending_human_review: clonar la rama publicada en un directorio sin node_modules y ejecutar los comandos anteriores.",
    },
    manual: [
      { id: "M027-01", task: "2602–2614", status: "pending_human_review", evidence: "instalación descargada, registro de Game.exe y acta firmada" },
      { id: "M027-02", task: "2617–2633", status: "pending_human_review", evidence: "tres sesiones humanas consecutivas sin descubrimientos y guía de limitaciones" },
      { id: "M027-03", task: "2635–2644", status: "pending_human_review", evidence: "etiqueta final y CI remota del cierre completo" },
      { id: "M027-04", task: "2665–2679", status: "static_pass_manual_runtime_pending", evidence: "clon limpio, ROM ausente, Game.exe y Android/Kirin" },
      { id: "M027-05", task: "2691–2699", status: "pending_human_review", evidence: "firmas del playtest y revisión externa" },
    ],
    status: staticFailures.length ? "static_review" : "static_pass_manual_pending",
    policy: "No se afirma que el juego entero esté jugado ni que la CI final exista: esta tanda deja evidencia estática y una cola humana verificable.",
  };
}
const report = buildReport();
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (VERIFY) {
  if (!fs.existsSync(OUT)) throw new Error(`Falta ${path.relative(ROOT, OUT)}`);
  if (fs.readFileSync(OUT, "utf8") !== serialized) throw new Error(`${path.relative(ROOT, OUT)} está desactualizado`);
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, serialized);
}
const checks = report.checks;
console.log(`FASE 027 cierre: ${report.packages.length} paquetes · fallos estáticos ${checks.staticFailures.length} · manual ${report.manual.length} · ${report.status}`);
if (checks.staticFailures.length) {
  for (const failure of checks.staticFailures.slice(0, 20)) console.error(`FALLO: ${failure}`);
  process.exitCode = 1;
}
