import fs from "node:fs";
import { DATA, marshalLoad, eventsOf, pagesOf } from "./lib/dlc_helpers.mjs";
import { parseMap, mapListFromInfos } from "../web/js/rmxp.js";
const files = fs.readdirSync(DATA).filter(f => /^Map\d+\.rxdata$/.test(f));
let totalEventos = 0, pokeMod = 0;
const porPrefijo = new Map();
for (const f of files) {
  const id = Number(f.match(/\d+/)[0]);
  for (const e of eventsOf(id)) {
    totalEventos++;
    const m = (e.name || "").match(/^(PokeMod [A-Za-zÁÉÍÓÚáéíóú]+:|[A-Za-z]+_[A-Z]+:)/);
    if (/PokeMod|Horizonte|Gate:|HUB_/.test(e.name || "")) {
      pokeMod++;
      const k = (e.name.match(/^(PokeMod [A-Za-zÁÉÍÓÚáéíóú]+:|Horizonte|HUB_[A-Z_]+|Gate:)/) || ["otro"])[0];
      porPrefijo.set(k, (porPrefijo.get(k) || 0) + 1);
    }
  }
}
console.log("mapas:", files.length, "| eventos totales:", totalEventos, "| eventos DLC:", pokeMod);
for (const [k, v] of [...porPrefijo].sort((a,b)=>b[1]-a[1])) console.log(`   ${String(v).padStart(5)}  ${k}`);
// BGM de los mapas nuevos
const nuevos = [2195,2196,2200,2201,2210,2211,2220,2221,2230,...Array.from({length:8},(_,i)=>2250+i)];
console.log("\nBGM de los mapas nuevos:");
for (const id of nuevos) {
  const raw = marshalLoad(fs.readFileSync(`${DATA}/Map${String(id).padStart(3,"0")}.rxdata`));
  const bgm = raw.getIvar("@bgm");
  const auto = raw.getIvar("@autoplay_bgm");
  const enc = raw.getIvar("@encounter_step");
  console.log(`   Map${id}: bgm=${JSON.stringify(bgm?.name ?? bgm)} autoplay=${auto} paso=${enc}`);
}
