#!/usr/bin/env node
/**
 * verify_rom_nativo_tilesets.mjs
 *
 * Comprueba los tilesets nativos `ROMN_<campaña>_p<n>.png` de Fire Ash:
 *
 *   · existen en pokemon_fire_ash/Graphics/Tilesets/ (y son PNG válidos);
 *   · su cabecera IHDR da exactamente el ancho y alto declarados en
 *     content/rom_nativo.json;
 *   · esas dimensiones son coherentes con su rejilla: 8 columnas de 32 px
 *     (COLUMNS × TILE del generador) y tantas filas como hagan falta para
 *     alojar los `tiles` declarados;
 *   · la huella sha1 (12 primeros hex, como en rom_nativo_mapas.mjs) coincide;
 *   · hay exactamente 212 tilesets y no sobran PNG ROMN_* sin manifiesto.
 *
 * No necesita las ROM: solo lee el manifiesto versionado y los PNG.
 *
 * Uso:
 *   node tools/qa/verify_rom_nativo_tilesets.mjs
 *
 * Sale con código 1 si algo no cuadra.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const GRAPHICS = path.join(ROOT, "pokemon_fire_ash", "Graphics", "Tilesets");
const MANIFEST = path.join(ROOT, "content", "rom_nativo.json");

const TILE = 32;      // px por tile RMXP (2×2 tiles GBA de 16×16)
const COLUMNS = 8;    // columnas de la rejilla generada
const ESPERADOS = 212;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const errores = [];
const fallo = (msg) => errores.push(msg);

/** Lee ancho/alto de la cabecera IHDR; null si no es un PNG válido. */
function dimensionesPng(bytes) {
  if (bytes.length < 24) return null;
  if (!bytes.subarray(0, 8).equals(PNG_SIGNATURE)) return null;
  if (bytes.subarray(12, 16).toString("latin1") !== "IHDR") return null;
  return { ancho: bytes.readUInt32BE(16), alto: bytes.readUInt32BE(20) };
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
const declarados = new Map(); // nombre de fichero -> entrada del manifiesto
for (const [clave, campana] of Object.entries(manifest.campaigns ?? {})) {
  for (const ts of campana.tilesets ?? []) {
    if (declarados.has(ts.png)) fallo(`${ts.png}: declarado dos veces (campaña ${clave})`);
    declarados.set(ts.png, { ...ts, campana: clave });
  }
}

if (declarados.size !== ESPERADOS) {
  fallo(`el manifiesto declara ${declarados.size} tilesets; se esperaban ${ESPERADOS}`);
}

const enDisco = fs.readdirSync(GRAPHICS).filter((f) => f.startsWith("ROMN_") && f.endsWith(".png"));
for (const f of enDisco) {
  if (!declarados.has(f)) fallo(`${f}: PNG ROMN_ en disco sin entrada en rom_nativo.json`);
}

let bytesTotales = 0;
let comprobados = 0;
for (const [png, ts] of declarados) {
  const patron = new RegExp(`^ROMN_${ts.campana}_p\\d+\\.png$`);
  if (!patron.test(png)) fallo(`${png}: el nombre no sigue ROMN_<campaña>_p<n>.png (campaña ${ts.campana})`);

  const ruta = path.join(GRAPHICS, png);
  if (!fs.existsSync(ruta)) {
    fallo(`${png}: no existe en pokemon_fire_ash/Graphics/Tilesets/`);
    continue;
  }
  const bytes = fs.readFileSync(ruta);
  bytesTotales += bytes.length;

  const dim = dimensionesPng(bytes);
  if (!dim) {
    fallo(`${png}: no es un PNG válido (firma o IHDR)`);
    continue;
  }
  if (dim.ancho !== ts.ancho || dim.alto !== ts.alto) {
    fallo(`${png}: ${dim.ancho}×${dim.alto} ≠ ${ts.ancho}×${ts.alto} del manifiesto`);
  }
  if (ts.ancho !== COLUMNS * TILE) {
    fallo(`${png}: ancho ${ts.ancho} ≠ ${COLUMNS * TILE} (${COLUMNS} columnas de ${TILE} px)`);
  }
  const filasNecesarias = Math.ceil(ts.tiles / COLUMNS);
  if (ts.alto !== filasNecesarias * TILE) {
    fallo(`${png}: alto ${ts.alto} ≠ ${filasNecesarias * TILE} (${ts.tiles} tiles en ${filasNecesarias} filas)`);
  }
  const huella = crypto.createHash("sha1").update(bytes).digest("hex").slice(0, 12);
  if (huella !== ts.sha1) fallo(`${png}: sha1 ${huella} ≠ ${ts.sha1} del manifiesto`);
  comprobados += 1;
}

const mb = (bytesTotales / (1024 * 1024)).toFixed(2);
console.log(`Tilesets declarados: ${declarados.size} · PNG en disco: ${enDisco.length} · comprobados: ${comprobados}`);
console.log(`Tamaño total: ${mb} MiB (${bytesTotales} bytes)`);
if (errores.length) {
  for (const e of errores) console.log(`  FALLO  ${e}`);
  console.log(`✘ ${errores.length} problema(s)`);
  process.exit(1);
}
console.log(`OK: ${ESPERADOS} tilesets nativos presentes con dimensiones correctas.`);
