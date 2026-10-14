// ============================================================================
// apply_no_badge_field_moves.mjs
// ----------------------------------------------------------------------------
// Regla de diseño solicitada: en Fire Ash no se usan MO y ningún movimiento de
// campo exige medalla. Si un Pokémon conoce el movimiento (por MT u otra vía),
// Corte/Flash/Surf/etc. funcionan directamente. En Essentials v19 las MO no
// existen como objeto; el único candado restante son los Settings BADGE_FOR_*,
// que aquí pasan de 0 (primera medalla) a -1 (sin requisito), en los tres
// Scripts.rxdata que se distribuyen y en el del juego de desarrollo.
//
//   node tools/apply_no_badge_field_moves.mjs            # aplica
//   node tools/apply_no_badge_field_moves.mjs --verify   # solo comprueba
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { marshalLoad, marshalDump } from "../web/js/marshal.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const verify = process.argv.includes("--verify");

const TARGETS = [
  "pokemon_fire_ash/Data/Scripts.rxdata",
  "Scripts_corregido/Scripts.rxdata",
  "Scripts_corregido/Paquete_directo/Data/Scripts.rxdata",
  "Scripts_corregido/Dimensional_Nightmare_QA/Data/Scripts.rxdata",
];

const LINE = /^(\s*BADGE_FOR_[A-Z]+\s*=\s*)(-?\d+)\s*$/gm;

let cambios = 0;
let malos = 0;

for (const rel of TARGETS) {
  const file = path.join(ROOT, rel);
  const scripts = marshalLoad(fs.readFileSync(file));
  const entry = scripts.find((e) => (e[1].text ?? e[1]) === "Settings");
  if (!entry) throw new Error(`${rel}: no existe la sección Settings`);
  const raw = Buffer.from(entry[2].bytes);
  const compressed = raw[0] === 0x78 && raw[1] === 0x9c;
  const code = (compressed ? zlib.inflateSync(raw) : raw).toString("utf-8");

  let aqui = 0;
  const nueva = code.replace(LINE, (m, pre, val) => {
    if (val !== "-1") aqui++;
    return verify ? m : `${pre}-1`;
  });
  const restantes = [...nueva.matchAll(LINE)].filter((m) => m[2] !== "-1").length;
  malos += restantes;
  cambios += aqui;

  if (!verify && aqui > 0) {
    entry[2].bytes = new Uint8Array(zlib.deflateSync(Buffer.from(nueva, "utf-8")));
    fs.writeFileSync(file, Buffer.from(marshalDump(scripts)));
  }
  console.log(`${restantes ? "✘" : "✔"} ${rel}: ${aqui} candados de medalla retirados${restantes ? `, quedan ${restantes}` : ""}`);
}

if (verify) {
  if (malos > 0) {
    console.error(`✘ quedan ${malos} BADGE_FOR_* distintos de -1`);
    process.exit(1);
  }
  console.log("OK: los movimientos de campo no piden medalla ni MO en ningún Scripts.rxdata");
} else {
  console.log(`OK: ${cambios} constantes BADGE_FOR_* fijadas a -1 (sin medalla, sin MO)`);
}
