// ============================================================================
// build_teckel_package.mjs
// ----------------------------------------------------------------------------
// Empaqueta el contenido de Ciudad Teckel / Isla Paraíso / MAXINE y la
// relocalización de Pokégods y versiones alternativas al Atlas, usando el
// manifest que dejan tools/apply_atlas_relocalizacion.mjs y
// tools/apply_ciudad_teckel_maxine.mjs (content/teckel_manifest.json).
//
//   node tools/build_teckel_package.mjs            # reconstruye ZIP + carpeta
//   node tools/build_teckel_package.mjs --verify   # comprueba ZIP vs carpeta
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, GAME } from "./lib/fire_ash_registry.mjs";
import { writeZip, readZipIndex, readZipEntry } from "./lib/zip_writer.mjs";

const VERIFY = process.argv.includes("--verify");
const MANIFEST = path.join(ROOT, "content", "teckel_manifest.json");
const STAGE = path.join(ROOT, "Scripts_corregido", "Ciudad_Teckel_Paraiso");
const ZIP = path.join(ROOT, "Scripts_corregido", "Fire_Ash_Ciudad_Teckel_Paraiso.zip");

const LEEME = `CIUDAD TECKEL E ISLA PARAÍSO (rediseño de la Isla Espejo)
=========================================================

La Isla Espejo cambia de propósito y la Dimensión Atlas absorbe su contenido
anterior:

 · Los 20 Pokégods y las 15/16 versiones alternativas de personajes (Mirror
   Boss, ahora con sprites recoloreados ALT_*) viven repartidos por los mapas
   Tier 1 de la Dimensión Atlas.
 · Map 997 = Ciudad Teckel: perros Pokémon (Zigzagoon, Poochyena, Growlithe,
   Eevee…) deambulando libres, veterinaria que cura, gimnasio y muelle.
 · Map 998 = Gimnasio Teckel: la líder Duna entrega la Medalla Pata.
 · Map 999 = Afueras Teckel: prado con encuentros de perros.
 · Map 2300 = Isla Paraíso: el altar de MAXINE, la Legendaria Florateck
   (nivel 125).

Cómo se juega
-------------
1. Tras cerrar la Ruta de Dios (Arceus), habla con el PROFESOR ATLAS en Puerto
   Horizonte (Atlas Mil): te da el TICKET PARAÍSO.
2. En Ciudad Teckel, vence a DUNA en el gimnasio para la MEDALLA PATA.
3. Cruza en el muelle con el ticket hasta Isla Paraíso.
4. La GUARDIANA NIRA pregunta: «¿qué le gusta más a MAXINE, el pollo o la
   pata?» La respuesta correcta es LA PATA. Con ella, MAXINE despierta en su
   altar y puede combatirse (y capturarse) al nivel 125.

Instalación
-----------
Extrae este ZIP en la raíz del juego (junto a Game.exe) aceptando reemplazos.
Requiere haber instalado antes Fire_Ash_Paquete_Directo.zip y
Dimensional_Nightmare_QA.zip (los mapas Atlas existen desde esa capa).
No toca partidas guardadas.
`;

function manifestFiles() {
  const m = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  return m.files;
}

function build() {
  fs.rmSync(STAGE, { recursive: true, force: true });
  fs.mkdirSync(STAGE, { recursive: true });
  const files = manifestFiles();
  for (const rel of files) {
    const src = path.join(GAME, rel);
    if (!fs.existsSync(src)) throw new Error(`el manifest cita ${rel} y no existe en el juego`);
    const dst = path.join(STAGE, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
  fs.writeFileSync(path.join(STAGE, "LEEME_TECKEL.txt"), LEEME);
  writeZip({ root: STAGE, destination: ZIP });
  console.log(`OK: Fire_Ash_Ciudad_Teckel_Paraiso.zip (${files.length + 1} entradas)`);
}

function verify() {
  const files = manifestFiles();
  const zip = readZipIndex(ZIP);
  const missing = files.filter((f) => !zip.entries.has(f));
  if (missing.length) throw new Error(`ZIP sin: ${missing.slice(0, 5).join(", ")}`);
  for (const f of files) {
    const disk = fs.readFileSync(path.join(STAGE, f));
    const inZip = Buffer.from(readZipEntry(zip, f));
    if (!disk.equals(inZip)) throw new Error(`diferencia carpeta/ZIP en ${f}`);
  }
  if (!zip.entries.has("LEEME_TECKEL.txt")) throw new Error("ZIP sin LEEME_TECKEL.txt");
  console.log(`OK: paquete Teckel/Paraíso verificado (${files.length + 1} entradas)`);
}

if (VERIFY) verify();
else { build(); verify(); }
