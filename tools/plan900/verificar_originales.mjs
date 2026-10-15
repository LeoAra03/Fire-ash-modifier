#!/usr/bin/env node
// FASE 30 — Verificar que PokeModBackups/ contiene los originales de todos
// los mapas que el plan 900 va a tocar, ANTES de tocarlos.
//
// Qué considera «mapas que el plan va a tocar»:
//   a) TODOS los Map<NNN>.rxdata existentes en pokemon_fire_ash/Data/ — el
//      plan es aditivo (regla de oro) pero sus instaladores reescriben
//      mapas PokeMod existentes al reinstalarse (orden_instalacion.sh), así
//      que la garantía máxima es que cada mapa existente tenga original.
//   b) Los mapas NUEVOS que el plan creará en IDs libres (docs/qa/politica_ids.md)
//      — no existen, no requieren original: se confirma que no hay archivo.
//
// Protección = el mapa aparece en AL MENOS UN backup_*.zip de PokeModBackups
// (snapshot de tools/backup.py). Frescura = CRC del mapa en el ZIP MÁS
// RECIENTE igual al CRC del archivo actual (0 diferencias = snapshot virgen
// del estado pre-plan; tras instalar, las diferencias son lo esperado y los
// originales siguen a salvo en el ZIP).
//
// Uso:  node tools/plan900/verificar_originales.mjs    (exit 0 = protegido)

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import zlib from "node:zlib";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const GAME = join(ROOT, "pokemon_fire_ash");
const DATA = join(GAME, "Data");
const BACKUPS = join(GAME, "PokeModBackups");

// IDs libres donde el plan creará mapas nuevos (docs/qa/politica_ids.md, FASE 12).
const RANGOS_LIBRES = [
  [2039, 2039], [2197, 2199], [2202, 2209], [2212, 2219], [2222, 2229],
  [2232, 2239], [2246, 2249], [2258, 2259], [2266, 2269], [2276, 2279],
  [2287, 2287], [2289, 2299], [2301, 2999], [3111, 3119], [3139, 3199],
  [3632, 3699], [3945, 3999], [4420, 9999],
];

let fallos = 0;
const paso = (ok, msg) => { console.log((ok ? "✔ " : "✘ ") + msg); if (!ok) fallos++; };

// --- 1) Backups disponibles -------------------------------------------------
const zips = readdirSync(BACKUPS).filter((n) => /^backup_.*\.zip$/i.test(n)).sort();
paso(zips.length > 0, `backups ZIP disponibles: ${zips.length} (${zips.join(", ") || "ninguno"})`);
if (zips.length === 0) {
  console.log("✘ no hay snapshot que proteja los mapas: correr `python3 tools/backup.py pokemon_fire_ash`");
  process.exit(1);
}

// --- 2) CRC de cada mapa dentro de cada ZIP ---------------------------------
// { "Data/Map123.rxdata": { crc: N, zip: nombre } }
const protegidos = new Map(); // nombre → zip más reciente que lo contiene
const crcUltimo = new Map(); // nombre → crc en el ZIP más reciente
for (const z of zips) {
  const out = execFileSync(
    "python3",
    ["-c", [
      "import zipfile,sys,json",
      "z=zipfile.ZipFile(sys.argv[1])",
      "print(json.dumps({i.filename:i.CRC for i in z.infolist()}))",
    ].join("\n"), join(BACKUPS, z)],
    { maxBuffer: 1 << 26 }
  );
  const entradas = JSON.parse(out.toString("utf8"));
  for (const [nombre, crc] of Object.entries(entradas)) {
    if (!/^Data\/Map\d+\.rxdata$/.test(nombre)) continue;
    if (!protegidos.has(nombre)) protegidos.set(nombre, z); // zips ordenados: el primero que lo trae es el más antiguo, el último sobrescribe
    crcUltimo.set(nombre, crc); // el último procesado = ZIP más reciente
  }
}

// --- 3) Mapas actuales en Data/ ----------------------------------------------
const actuales = readdirSync(DATA).filter((n) => /^Map\d+\.rxdata$/.test(n));
const sinProteger = actuales.filter((n) => !protegidos.has(`Data/${n}`));
paso(
  sinProteger.length === 0,
  sinProteger.length
    ? `mapas SIN original en ningún ZIP: ${sinProteger.slice(0, 10).join(", ")}${sinProteger.length > 10 ? "…" : ""} (${sinProteger.length})`
    : `protección: ${actuales.length}/${actuales.length} mapas existentes tienen original en PokeModBackups`
);

// --- 4) Frescura del snapshot más reciente -----------------------------------
let difieren = 0;
const ejemplos = [];
for (const n of actuales) {
  const crcZip = crcUltimo.get(`Data/${n}`);
  if (crcZip === undefined) continue;
  const crcActual = zlib.crc32(readFileSync(join(DATA, n))) >>> 0;
  if (crcZip !== crcActual) { difieren++; if (ejemplos.length < 5) ejemplos.push(n); }
}
console.log(
  difieren === 0
    ? `ℹ snapshot virgen: 0/${actuales.length} mapas difieren del ZIP más reciente (${zips[zips.length - 1]})`
    : `ℹ ${difieren}/${actuales.length} mapas difieren del ZIP más reciente (modificados tras el snapshot; su original sigue a salvo)${ejemplos.length ? " — ej: " + ejemplos.join(", ") : ""}`
);

// --- 5) Mapas nuevos del plan: IDs libres sin archivo ------------------------
const ocupados = new Set(actuales.map((n) => Number(/^Map(\d+)\.rxdata$/.exec(n)[1])));
let libresTotal = 0;
let libresOcupados = [];
for (const [a, b] of RANGOS_LIBRES) {
  for (let id = a; id <= b; id++) {
    libresTotal++;
    if (ocupados.has(id)) libresOcupados.push(id);
  }
}
paso(
  libresOcupados.length === 0,
  libresOcupados.length
    ? `IDs libres de la política con archivo existente (¡colisión!): ${libresOcupados.slice(0, 10).join(", ")}`
    : `mapas nuevos del plan: ${libresTotal} IDs libres sin archivo (no requieren original)`
);

// --- 6) Resumen ---------------------------------------------------------------
const totalEnZip = [...protegidos].filter(([n]) => ocupados.has(Number(/^Map(\d+)\.rxdata$/.exec(n.slice(5))[1]))).length;
console.log(
  fallos === 0
    ? `originales verificados: TODO EN VERDE — ${actuales.length} mapas protegidos en ${zips.length} ZIP, ${libresTotal} IDs nuevos sin colisión`
    : `originales verificados: ${fallos} comprobación(es) en rojo`
);
process.exit(fallos === 0 ? 0 : 1);
