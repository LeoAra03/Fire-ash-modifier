#!/usr/bin/env node
/**
 * repair_missing_maps.mjs
 *
 * «Mapas en negro, muchas crash.»
 *
 * Fire Ash arrastra un hueco real de datos: `Data/MapInfos.rxdata` lista mapas
 * cuyo archivo `Data/MapNNNN.rxdata` NO existe. En este repositorio es el caso
 * de:
 *
 *   · **2231 — «TFOH — Cámara de la Primera Huella»**: el mapa está en la lista
 *     (y el sistema de atavíos lo tiene en rango) pero no hay archivo. En el
 *     juego, entrar ahí —o cargar una partida guardada dentro— es un error al
 *     vuelo (`No such file or directory - Data/Map2231.rxdata`). En PokeMod era
 *     el único mapa de los 3 465 que fallaba al dibujarse.
 *   · El gemelo **2243** sí tiene archivo y se llama exactamente igual (TFOH —
 *     Cámara de la Primera Huella, colgado de 2242 «TFOH — Frontera del
 *     Origen»). 2231 cuelga de 2230 («Atlas — Avenida de los Ocho Gimnasios»),
 *     que es el mismo sitio al que apunta el atavío 6 de `PokeMod_Atavios`.
 *
 * Qué hace esta herramienta, sin inventar contenido:
 *
 *   1. Localiza TODO mapa de MapInfos sin archivo.
 *   2. Para cada hueco elige la fuente más honesta, en este orden:
 *        a) un mapa del mismo padre con el MISMO nombre;
 *        b) un mapa con el MISMO nombre (el más cercano en id);
 *        c) `--reuse <origen>` explícito.
 *      Si no hay fuente clara, NO toca nada y lo reporta (mejor un aviso que
 *      contenido inventado).
 *   3. Copia el archivo origen al id que falta y deja constancia en
 *      `PokeModBackups/mapas_reparados.json` (nada de borrar entradas de la
 *      lista: eso cambiaría la numeración que usa el juego).
 *
 * Uso:
 *   node tools/repair_missing_maps.mjs                 # informa y repara
 *   node tools/repair_missing_maps.mjs --dry-run       # solo informa
 *   node tools/repair_missing_maps.mjs --reuse 2243    # fuente explícita
 *   node tools/repair_missing_maps.mjs --verify        # falla si queda algún hueco
 *
 * Sale con código 1 en `--verify` si aún hay mapas listados sin archivo.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalLoad, RString } from "../web/js/marshal.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARGS = process.argv.slice(2);
const DRY = ARGS.includes("--dry-run");
const VERIFY = ARGS.includes("--verify");
const REUSE = ARGS.includes("--reuse") ? Number(ARGS[ARGS.indexOf("--reuse") + 1]) : 0;
const pad3 = (n) => String(n).padStart(3, "0");

// Juego completo del repo: aquí un hueco en MapInfos es un fallo de verdad
// (el jugador entra y el motor revienta).
const FULL_GAME = "pokemon_fire_ash";
// Paquetes corregidos: son parches, traen MapInfos completo pero solo los mapas
// que cambian; sus «huecos» son el resto del juego y NO se tocan.
const PACKAGES = [
  "Scripts_corregido/Paquete_directo",
  "Scripts_corregido/Dimensional_Nightmare_QA",
  "Scripts_corregido/Ciudad_Teckel_Paraiso",
  "Scripts_corregido/Expansion_Multiversal",
];
const TARGETS = [FULL_GAME, ...PACKAGES];

const txt = (v) => (v instanceof RString ? v.text : v == null ? "" : String(v));

function readInfos(dataDir) {
  const raw = marshalLoad(new Uint8Array(fs.readFileSync(path.join(dataDir, "MapInfos.rxdata"))));
  const out = [];
  for (const [k, v] of raw.pairs) {
    out.push({
      id: Number(k),
      name: txt(v.getIvar("name")),
      parent: Number(v.getIvar("parent_id") || 0),
      order: Number(v.getIvar("order") || 0),
    });
  }
  return out;
}

function audit(dataDir) {
  const infos = readInfos(dataDir);
  const withFile = new Set();
  for (const f of fs.readdirSync(dataDir)) {
    const m = f.match(/^Map(\d+)\.rxdata$/i);
    if (m) withFile.add(Number(m[1]));
  }
  const missing = infos.filter((i) => !withFile.has(i.id));
  return { infos, withFile, missing };
}

function pickSource(info, infos, withFile) {
  if (REUSE && withFile.has(REUSE)) return { id: REUSE, why: "--reuse indicado a mano" };
  const sameNameSameParent = infos
    .filter((i) => withFile.has(i.id) && i.id !== info.id && i.parent === info.parent && i.name === info.name)
    .sort((a, b) => Math.abs(a.id - info.id) - Math.abs(b.id - info.id))[0];
  if (sameNameSameParent) return { id: sameNameSameParent.id, why: "mismo nombre y mismo padre" };
  const sameName = infos
    .filter((i) => withFile.has(i.id) && i.id !== info.id && i.name === info.name)
    .sort((a, b) => Math.abs(a.id - info.id) - Math.abs(b.id - info.id))[0];
  if (sameName) return { id: sameName.id, why: "mismo nombre (gemelo del DLC)" };
  return null;
}

let fallos = 0;
let reparados = 0;
let sinSolucion = 0;

for (const rel of TARGETS) {
  const dataDir = path.join(ROOT, rel, "Data");
  if (!fs.existsSync(path.join(dataDir, "MapInfos.rxdata"))) {
    console.log(`— ${rel}: sin Data/MapInfos.rxdata (se salta)`);
    continue;
  }
  const { infos, missing, withFile } = audit(dataDir);
  console.log(`\n=== ${rel}: ${infos.length} entradas · ${withFile.size} archivos · ${missing.length} hueco(s)`);
  if (!missing.length) {
    console.log("   ✔ sin mapas listados que falten");
    continue;
  }
  if (rel !== FULL_GAME) {
    console.log(`   (paquete parcial: los ${missing.length} huecos son mapas del juego que el parche no incluye — no se tocan)`);
    continue;
  }
  for (const info of missing) {
    const src = pickSource(info, infos, withFile);
    if (!src) {
      fallos++;
      sinSolucion++;
      console.log(`   ✘ ${info.id} «${info.name}» (padre ${info.parent}): sin archivo y sin gemelo claro → no se toca`);
      continue;
    }
    const origen = path.join(dataDir, `Map${pad3(src.id)}.rxdata`);
    const destino = path.join(dataDir, `Map${pad3(info.id)}.rxdata`);
    console.log(`   → ${info.id} «${info.name}»: copia de ${src.id} (${src.why})`);
    if (DRY || VERIFY) continue;
    if (!fs.existsSync(destino)) fs.copyFileSync(origen, destino);
    const backupDir = path.join(ROOT, rel, "PokeModBackups", "mapas_reparados");
    fs.mkdirSync(backupDir, { recursive: true });
    const log = path.join(backupDir, "mapas_reparados.json");
    const prev = fs.existsSync(log) ? JSON.parse(fs.readFileSync(log, "utf8")) : [];
    prev.push({
      faltaba: info.id,
      nombre: info.name,
      padre: info.parent,
      copiadoDe: src.id,
      motivo: src.why,
      cuando: new Date().toISOString(),
    });
    fs.writeFileSync(log, JSON.stringify(prev, null, 2));
    reparados++;
  }
  // reverificación
  const after = audit(dataDir).missing.length;
  console.log(`   ${after === 0 ? "✔" : "✘"} quedan ${after} hueco(s)`);
  if (after) fallos++;
}

const huecos = missingInFullGame();
console.log(`\n${VERIFY ? "Verificación" : DRY ? "Simulación" : "Reparación"}: ${huecos} hueco(s) en el juego completo, ${reparados} reparado(s)` + (sinSolucion ? `, ${sinSolucion} sin solución automática` : ""));
function missingInFullGame() {
  const dataDir = path.join(ROOT, FULL_GAME, "Data");
  if (!fs.existsSync(path.join(dataDir, "MapInfos.rxdata"))) return 0;
  return audit(dataDir).missing.length;
}
process.exit(VERIFY && huecos ? 1 : 0);
