#!/usr/bin/env node
/**
 * Compuerta estática del contrato de dinamismo (tareas.txt 101–150).
 *
 * No intenta simular Game.exe: comprueba que los catálogos, recursos, mapas y
 * verificadores necesarios para el recorrido estén presentes. La comprobación
 * manual de ritmo, cámara y colisiones vive en docs/qa/playtest_dinamismo.md.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DATA = path.join(ROOT, "pokemon_fire_ash", "Data");
const BGM = path.join(ROOT, "pokemon_fire_ash", "Audio", "BGM");
const SE = path.join(ROOT, "pokemon_fire_ash", "Audio", "SE");
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
const exists = (file) => fs.existsSync(path.join(ROOT, file));
const mapExists = (id) => fs.existsSync(path.join(DATA, `Map${String(id).padStart(3, "0")}.rxdata`));

const contract = readJson("content/dinamismo.json");
check(contract.schema === "fire_ash_dinamismo/1.0", "contrato de dinamismo con esquema incorrecto");
check(contract.checks.length === 50, `contrato de dinamismo: ${contract.checks.length}/50 controles`);
contract.checks.forEach((item, index) => check(item.id === 101 + index, `control fuera de orden: ${item.id}`));
check(exists("docs/qa/playtest_dinamismo.md"), "falta el protocolo de playtest manual");

const ambience = readJson("content/dlc_ambience.json");
check(ambience.musica.length === 23, `ambientación: ${ambience.musica.length}/23 mapas con BGM`);
for (const row of ambience.musica) {
  check(mapExists(row.mapId), `ambientación: falta Map${row.mapId}`);
  check(fs.existsSync(path.join(BGM, row.bgm)), `ambientación: falta Audio/BGM/${row.bgm}`);
}
for (const zone of ambience.zonas) check(mapExists(zone.mapId), `zona dinámica sin mapa: ${zone.mapId}`);

const wild = readJson("content/wild_zones.json");
const wildIds = new Set(wild.zones.map((zone) => zone.mapId));
for (const zone of ambience.zonas) check(wildIds.has(zone.mapId), `zona de encuentros no sincronizada: ${zone.mapId}`);

const multiverse = readJson("content/multiverse_creepypasta.json");
check(multiverse.maps.length === 9, `emisiones: ${multiverse.maps.length}/9 mapas declarados`);
check(multiverse.bosses.length === 7, `emisiones: ${multiverse.bosses.length}/7 guardianes declarados`);
check(multiverse.counterVariable === 264, "emisiones: el contador no es v[264]");
check(multiverse.sealSwitchBase === 940, "emisiones: el rango de sellos no empieza en 940");
for (const map of multiverse.maps) check(mapExists(map.mapId), `emisión sin mapa: ${map.mapId}`);

const atlas = readJson("content/atlas_tier1_blueprints_approved.json");
check(atlas.blueprints.length === 40, `Atlas Tier 1: ${atlas.blueprints.length}/40 anclas`);
const atlasFlags = atlas.blueprints.map((blueprint) => blueprint.flags?.globalSwitches?.[0]?.id).filter(Number.isInteger).sort((a, b) => a - b);
check(atlasFlags.length === 40 && atlasFlags[0] === 708 && atlasFlags.at(-1) === 747,
  "Atlas Tier 1: los switches de ancla no cubren 708–747");
check(atlas.blueprints.every((blueprint) => blueprint.flags?.variables?.some((entry) => entry.id === 103)),
  "Atlas Tier 1: una ancla no alimenta la variable 103");

const rocket = readJson("content/team_rocket_mision.json");
check(rocket.misiones.length === 5, `Rocket: ${rocket.misiones.length}/5 misiones`);
check(rocket.rangos.length === 6, `Rocket: ${rocket.rangos.length}/6 rangos`);
check(rocket.dimension.mapaId === 2220 && rocket.dimension.nucleoId === 2221, "Rocket: mapas de base/núcleo incorrectos");
check(mapExists(2220) && mapExists(2221), "Rocket: falta Map2220 o Map2221");
check(fs.existsSync(path.join(SE, "MAXINE.ogg")) || fs.existsSync(path.join(SE, "ARCEUS.ogg")),
  "no hay SE de expansión instalados para el gate de audio");

const canon = readJson("content/canon_arceus.json");
check(Object.keys(canon.fases_dios).length === 6, "Arceus: no están declaradas las seis fases");
check(exists("tools/apply_transition_safety_fix.mjs") && exists("tools/apply_tone_safety_fix.mjs"),
  "faltan los parches de seguridad de transición o tono");
check(exists("tools/apply_la_ruta_de_dios.mjs") && exists("tools/apply_arceus_portal_recovery.mjs"),
  "faltan los instaladores de Ruta de Dios o recuperación del portal");
check(exists("tools/apply_dlc_ambience.mjs") && exists("tools/apply_wild_zones.mjs"),
  "faltan los instaladores de ambiente o encuentros");

const packageJson = readJson("package.json");
for (const script of ["verify:ambience", "verify:wild", "verify:transition-safety", "verify:tone-safety", "verify:ruta_de_dios", "verify:arceus-portal"]) {
  check(typeof packageJson.scripts?.[script] === "string", `falta npm run ${script}`);
}

console.log(`contrato de dinamismo: ${contract.checks.length} controles · ${ambience.musica.length} mapas con BGM · ${multiverse.maps.length} emisiones · ${atlas.blueprints.length} anclas Tier 1`);
if (failures.length) {
  failures.forEach((message) => console.error(`FALLO: ${message}`));
  console.error(`✘ dinamismo: ${failures.length} comprobación(es) en rojo`);
  process.exit(1);
}
console.log("OK: compuerta estática de dinamismo en verde; ejecutar el playtest manual antes de publicar.");
