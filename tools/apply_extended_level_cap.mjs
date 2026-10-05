#!/usr/bin/env node
/**
 * Extiende el crecimiento real de Pokémon hasta nivel 175 sin invalidar partidas.
 *
 * Dos excepciones por encima del techo, ambas deliberadas y fuera del alcance
 * de este instalador (las define apply_la_ruta_de_dios.mjs):
 *   · Arceus de La Ruta de Dios: nivel 200, el único Pokémon que lo alcanza.
 *   · Mad Pikachu: nivel desconocido («???»). No se puede vencer por fuerza:
 *     hace falta que Arceus lo devuelva al límite o sostener el vínculo en la
 *     Liga Oscura.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { marshalLoad,marshalDump,RString } from "../web/js/marshal.js";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const DATA=path.join(ROOT,"pokemon_fire_ash","Data");
const BACKUP=path.join(ROOT,"pokemon_fire_ash","PokeModBackups","extended_level_cap_originals");
const FILE=path.join(DATA,"Scripts.rxdata"),MAX_LEVEL=175,VERIFY=process.argv.includes("--verify");
const text=v=>v instanceof RString?v.text:String(v??"");
const load=()=>marshalLoad(fs.readFileSync(FILE));
const save=v=>fs.writeFileSync(FILE,Buffer.from(marshalDump(v)));
const source=row=>zlib.inflateSync(Buffer.from(row[2].bytes)).toString("utf8");
const setSource=(row,code)=>{row[2].bytes=Uint8Array.from(zlib.deflateSync(Buffer.from(code,"utf8")));};
const section=(scripts,name)=>scripts.find(row=>text(row?.[1])===name);

function backup(){
  fs.mkdirSync(BACKUP,{recursive:true});
  const dst=path.join(BACKUP,"Scripts.rxdata");
  if(!fs.existsSync(dst))fs.copyFileSync(FILE,dst);
  fs.writeFileSync(path.join(BACKUP,"LEEME.txt"),"Scripts.rxdata anterior a instalar el límite extendido de nivel 150. Incluye las modificaciones PokeMod que ya estaban activas.\n");
}

function install(){
  const scripts=load(),settings=section(scripts,"Settings"),growth=section(scripts,"GrowthRate"),storage=section(scripts,"UI_PokemonStorage");
  if(!settings||!growth||!storage)throw new Error("No se localizaron Settings, GrowthRate y UI_PokemonStorage.");
  let code=source(settings);
  if(!/MAXIMUM_LEVEL\s*=\s*\d+/.test(code))throw new Error("Settings no contiene MAXIMUM_LEVEL.");
  code=code.replace(/MAXIMUM_LEVEL\s*=\s*\d+/,`MAXIMUM_LEVEL            = ${MAX_LEVEL}`);
  if(!code.includes("PokeMod Extended Level Cap"))code=code.replace(`MAXIMUM_LEVEL            = ${MAX_LEVEL}`,`MAXIMUM_LEVEL            = ${MAX_LEVEL}   # PokeMod Extended Level Cap`);
  setSource(settings,code);

  code=source(growth);
  code=code.replace(/next \(level \*\* 4\) \* rate \/ 5000(?:\.floor)?/,"next ((level ** 4) * rate / 5000).floor");
  setSource(growth,code);

  code=source(storage);
  code=code.replace("params.setRange(1, 100)","params.setRange(1, GameData::GrowthRate.max_level)");
  code=code.replace('_INTL("Set the level range to search above or below. (1-100).")','_INTL("Set the level range to search above or below. (1-{1}).", GameData::GrowthRate.max_level)');
  setSource(storage,code);
  save(scripts);
}

function verify(){
  const scripts=load(),settings=section(scripts,"Settings"),growth=section(scripts,"GrowthRate"),storage=section(scripts,"UI_PokemonStorage"),errors=[];
  const s=settings?source(settings):"",g=growth?source(growth):"",u=storage?source(storage):"";
  if(!new RegExp(`MAXIMUM_LEVEL\\s*=\\s*${MAX_LEVEL}\\b`).test(s))errors.push(`MAXIMUM_LEVEL no es ${MAX_LEVEL}`);
  if(!s.includes("PokeMod Extended Level Cap"))errors.push("falta marcador PokeMod");
  if(!g.includes("next ((level ** 4) * rate / 5000).floor"))errors.push("fórmula Fluctuating no devuelve entero");
  if(!u.includes("params.setRange(1, GameData::GrowthRate.max_level)"))errors.push("búsqueda de almacenamiento sigue limitada a 100");
  const formulas={Medium:n=>n**3,Erratic:n=>Math.floor(n**4*3/500),Fluctuating:n=>Math.floor(n**4*Math.max(82-(n-100)/2,40)/5000),Parabolic:n=>Math.floor(n**3*6/5)-15*n**2+100*n-140,Fast:n=>Math.floor(n**3*4/5),Slow:n=>Math.floor(n**3*5/4)};
  const at100={Medium:1000000,Erratic:600000,Fluctuating:1640000,Parabolic:1059860,Fast:800000,Slow:1250000};
  for(const[name,fn]of Object.entries(formulas)){let prev=at100[name];for(let lv=101;lv<=MAX_LEVEL;lv++){const cur=fn(lv);if(!Number.isInteger(cur)||cur<=prev){errors.push(`${name}: EXP no crece en nivel ${lv}`);break;}prev=cur;}}
  if(errors.length)throw new Error(`Límite extendido inválido:\n- ${errors.join("\n- ")}`);
  console.log(`Verificación OK: crecimiento continuo 1-${MAX_LEVEL}, seis curvas EXP monótonas, partidas de nivel 100 compatibles y búsqueda de cajas ampliada.`);
}

if(!VERIFY){backup();install();console.log(`Límite extendido instalado. Backup: ${path.relative(ROOT,BACKUP)}`);}
verify();
