#!/usr/bin/env node
// FASE 27 — Checkpoint único del plan 900.
//
// Valida en un solo comando:
//   1. Numeración de fases de tools/plan900/avance.md (ascendente, sin
//      duplicados, huecos solo en la FASE 2, que nunca fue enviada).
//   2. Verificadores: cada fila en OK cita evidencia de verificador en verde
//      (protocolo de cierre, FASE 26). Excepciones históricas solo para las
//      fases pre-protocolo documentadas abajo; desde la FASE 27 no se admiten.
//   3. Integridad de los backups ZIP de pokemon_fire_ash/PokeModBackups
//      (test de zipfile sobre cada archivo; debe existir al menos uno).
//
// Uso:  node tools/plan900/checkpoint.mjs      (exit 0 = todo en verde)

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const AVANCE = join(ROOT, "tools", "plan900", "avance.md");
const BACKUPS_DIR = join(ROOT, "pokemon_fire_ash", "PokeModBackups");

// FASE 2 no fue enviada (el backlog saltó de la 1 a la 3): único hueco tolerado.
const HUECOS_TOLERADOS = new Set([2]);

// Fases pre-protocolo (≤26) cuya verificación consta en la bitácora de
// docs/ESTADO_CONGELADO.md pero no en el texto de su fila del registro.
const EXCEPCIONES_HISTORICAS = new Map([
  [6, "fase documental; respaldada por el estado verde de las FASES 3–4 (auditoría FASE 26)"],
  [23, "verificación con dn_name_flags --verify en verde, registrada en la bitácora FASE 23"],
]);

// Evidencia de verificador citada en la columna «Entrega / verificación».
const EVIDENCIA =
  /(exit 0|en verde|--verify|--audit|verify:|npm test|verifica(?:r|ción|dora|doras|ciones)|comprobaci(?:ón|on|ones)|\b\d+\/\d+\b|colisiones? 0|sin colisiones|sin anomalías|intactos|auditad|verificado|avance\.sh|coincidencia exacta|sin desviación|datos reales)/i;

let fallos = 0;
const paso = (ok, mensaje) => {
  console.log((ok ? "✔ " : "✘ ") + mensaje);
  if (!ok) fallos++;
};

// ---------------------------------------------------------------------------
// 1) Numeración de fases
// ---------------------------------------------------------------------------
const lineas = readFileUtf8(AVANCE).split("\n");
const filas = [];
const filaRe = /^\| *(\d+) *\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|(.*)\|$/;
for (const [i, linea] of lineas.entries()) {
  if (!/^\| *\d+ *\|/.test(linea)) continue;
  const m = filaRe.exec(linea);
  if (!m) {
    paso(false, `formato de fila inválido en avance.md línea ${i + 1}`);
    continue;
  }
  const c = m.map((s) => (s || "").trim());
  filas.push({ fase: Number(c[1]), fecha: c[2], base: c[3], cierre: c[4], estado: c[5], desc: c[6] });
}

let numeracionOk = filas.length > 0 && filas[0].fase === 1;
const huecos = [];
for (let i = 1; i < filas.length && numeracionOk; i++) {
  const d = filas[i].fase - filas[i - 1].fase;
  if (d <= 0) { paso(false, `numeración no ascendente/duplicada en fase ${filas[i].fase}`); numeracionOk = false; break; }
  for (let g = filas[i - 1].fase + 1; g < filas[i].fase; g++) huecos.push(g);
}
if (numeracionOk) {
  const inesperados = huecos.filter((g) => !HUECOS_TOLERADOS.has(g));
  if (inesperados.length) { paso(false, `huecos de numeración no tolerados: ${inesperados.join(", ")}`); numeracionOk = false; }
}
if (numeracionOk && filas.length) {
  const ultimo = filas[filas.length - 1].fase;
  const conHueco = huecos.length ? ` (hueco documentado: ${huecos.join(", ")})` : "";
  paso(true, `numeración: ${filas.length} fases, 1→${ultimo}${conHueco}`);
}

// ---------------------------------------------------------------------------
// 2) Verificadores citados (protocolo FASE 26)
// ---------------------------------------------------------------------------
let conVerificador = 0;
const sinEvidencia = [];
for (const f of filas) {
  const postProtocolo = f.fase >= 27;
  const exc = EXCEPCIONES_HISTORICAS.get(f.fase);
  if (f.estado === "OK" && (EVIDENCIA.test(f.desc) || (!postProtocolo && exc))) conVerificador++;
  else sinEvidencia.push(String(f.fase));
}
paso(
  conVerificador === filas.length,
  sinEvidencia.length
    ? `verificadores: ${conVerificador}/${filas.length} filas OK; sin evidencia: ${sinEvidencia.join(", ")}`
    : `verificadores: ${conVerificador}/${filas.length} filas en OK citan verificador en verde` +
        (EXCEPCIONES_HISTORICAS.size ? ` — excepciones históricas documentadas: ${[...EXCEPCIONES_HISTORICAS.keys()].join(", ")}` : "")
);
for (const f of filas) {
  if (f.estado !== "OK") paso(false, `fase ${f.fase} con estado «${f.estado}» (debe ser OK)`);
}

// ---------------------------------------------------------------------------
// 3) Integridad de backups
// ---------------------------------------------------------------------------
let zips = [];
try {
  zips = readdirSync(BACKUPS_DIR).filter((n) => n.toLowerCase().endsWith(".zip")).sort();
} catch { /* directorio ausente: zips queda vacío */ }
paso(zips.length > 0, `backups: ${zips.length} ZIP en PokeModBackups (mínimo 1)`);
for (const z of zips) {
  const ruta = join(BACKUPS_DIR, z);
  const mb = (statSync(ruta).size / 1048576).toFixed(1);
  let ok = false;
  try {
    execFileSync("python3", ["-m", "zipfile", "--test", ruta], { stdio: "pipe" });
    ok = true;
  } catch (e) {
    ok = false;
  }
  paso(ok, `backup íntegro: ${z} (${mb} MB) — zipfile --test ${ok ? "sin errores" : "CON ERRORES"}`);
}

// ---------------------------------------------------------------------------
// Resumen
// ---------------------------------------------------------------------------
const ultima = filas.length ? filas[filas.length - 1].fase : 0;
console.log(
  fallos === 0
    ? `checkpoint plan 900: TODO EN VERDE — ${filas.length} fases registradas (última: ${ultima}), ${zips.length} backup(s) íntegro(s)`
    : `checkpoint plan 900: ${fallos} comprobación(es) en rojo`
);
process.exit(fallos === 0 ? 0 : 1);

// ---------------------------------------------------------------------------
function readFileUtf8(ruta) {
  return readFileSync(ruta, "utf8");
}
