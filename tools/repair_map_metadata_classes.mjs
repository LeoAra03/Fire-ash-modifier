// ============================================================================
// repair_map_metadata_classes.mjs
// ----------------------------------------------------------------------------
// Corrige el defecto de arranque "undefined class/module RPG::MapMetadata":
// los map_metadata.dat distribuidos contenían entradas serializadas como
// RPG::MapMetadata (clase de Essentials v16 que este juego, basado en el
// modelo v19 con GameData::MapMetadata, nunca define). Al hacer load_data en
// el arranque, Ruby aborta con ArgumentError antes de llegar al título.
//
// Este tool convierte cada entrada RPG::MapMetadata en GameData::MapMetadata
// (conservando sus ivars existentes y fijando @id), en los cuatro .dat que se
// distribuyen. Con --verify solo comprueba que no quede ninguna entrada mala.
//
//   node tools/repair_map_metadata_classes.mjs            # repara
//   node tools/repair_map_metadata_classes.mjs --verify   # solo comprueba
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalLoad, marshalDump, RObject } from "../web/js/marshal.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const TARGETS = [
  "pokemon_fire_ash/Data/map_metadata.dat",
  "Scripts_corregido/Paquete_directo/Data/map_metadata.dat",
  "Scripts_corregido/Expansion_Multiversal/Data/map_metadata.dat",
  "Scripts_corregido/Dimensional_Nightmare_QA/Data/map_metadata.dat",
];

const verify = process.argv.includes("--verify");
let malas = 0;

for (const rel of TARGETS) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) {
    console.log(`· sin archivo: ${rel}`);
    continue;
  }
  const meta = marshalLoad(fs.readFileSync(file));
  const malasAqui = meta.pairs.filter(([, o]) => o && o.className === "RPG::MapMetadata").length;
  malas += malasAqui;
  if (verify) {
    console.log(`${malasAqui ? "✘" : "✔"} ${rel}: ${malasAqui} entradas RPG::MapMetadata`);
    continue;
  }
  if (malasAqui === 0) {
    console.log(`✔ ${rel}: nada que convertir`);
    continue;
  }
  meta.pairs = meta.pairs.map(([k, o]) => {
    if (o && o.className === "RPG::MapMetadata") {
      const sano = new RObject("GameData::MapMetadata", [["@id", Number(k)]]);
      for (const [ik, iv] of o.ivars) sano.setIvar(ik, iv);
      return [k, sano];
    }
    return [k, o];
  });
  fs.writeFileSync(file, Buffer.from(marshalDump(meta)));
  console.log(`✔ ${rel}: ${malasAqui} entradas convertidas a GameData::MapMetadata`);
}

if (verify) {
  if (malas > 0) {
    console.error(`✘ quedan ${malas} entradas RPG::MapMetadata en los .dat distribuidos`);
    process.exit(1);
  }
  console.log("OK: ningún map_metadata.dat distribuido contiene RPG::MapMetadata");
} else {
  console.log(malas > 0 ? `OK: ${malas} entradas reparadas en total` : "OK: todos los .dat ya estaban sanos");
}
