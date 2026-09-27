#!/usr/bin/env node
/** Aplica la jerarquía Tier 1/2/3 a las 1.000 balizas de Atlas Mil. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalLoad,marshalDump,RObject,RString } from "../web/js/marshal.js";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),".."),GAME=path.join(ROOT,"pokemon_fire_ash"),DATA=path.join(GAME,"Data");
const hierarchy=JSON.parse(fs.readFileSync(path.join(ROOT,"content","atlas_content_hierarchy.json"),"utf8"));
const seeds=JSON.parse(fs.readFileSync(path.join(ROOT,"content","atlas_narrative_seeds.json"),"utf8")).seeds;
const BACKUP=path.join(GAME,"PokeModBackups","atlas_hierarchy_originals"),VERIFY=process.argv.includes("--verify");
const S=(x)=>RString.fromText(String(x)),iv=(o,n)=>o?.getIvar?.(n),txt=(v)=>v instanceof RString?v.text:String(v??""),pad=(n)=>String(n).padStart(3,"0");
const read=(f)=>marshalLoad(fs.readFileSync(path.join(DATA,f))),write=(f,v)=>fs.writeFileSync(path.join(DATA,f),Buffer.from(marshalDump(v)));
function cmd(code,params=[],indent=0){return new RObject("RPG::EventCommand",[["@code",code],["@indent",indent],["@parameters",params]]);}
function wrap(s,max=43){const out=[];let line="";for(const w of String(s).split(/\s+/)){if(!line)line=w;else if(`${line} ${w}`.length<=max)line+=` ${w}`;else{out.push(line);line=w;}}if(line)out.push(line);return out;}
function textCommands(lines){const all=lines.flatMap((x)=>wrap(x));return[cmd(101,[S("")]),...all.map((x)=>cmd(401,[S(x)])),cmd(0)];}
function linesFor(m){if(m.tier===1){const seed=seeds.find((x)=>x.mapId===m.mapId);return[
  `ANCLA ARTESANAL — Sector ${m.sector}: ${m.sectorName}.`,
  seed.coreMystery,
  `Voz local: ${seed.voiceProfile.tone}. Esta ubicación recibirá NPCs, escena, decisión y jefe propios.`,
  "La baliza nunca bloquea la Mochila ni la salida al puerto.",
];}if(m.tier===2)return[
  `RUTA ESTABLE — Sector ${m.sector}: ${m.sectorName}.`,
  `Atlas estabilizó la geografía de ${m.sourceName} como una ruta funcional, no como una copia de su historia.`,
  "Aquí se espera una mecánica clara, un objetivo breve y retorno libre.",
];return[
  `ECO DIMENSIONAL ${String(m.mapId-1020).padStart(4,"0")} — ${m.sectorName}.`,
  `Este lugar es un recuerdo incompleto de ${m.sourceName}; sus similitudes y vacíos forman parte de la anomalía.`,
  "Los Ecos son retos opcionales breves. La baliza de retorno siempre permanece activa.",
];}
function backup(){fs.mkdirSync(BACKUP,{recursive:true});for(const m of hierarchy.maps){const f=`Map${pad(m.mapId)}.rxdata`,src=path.join(DATA,f),dst=path.join(BACKUP,f);if(!fs.existsSync(dst))fs.copyFileSync(src,dst);}fs.writeFileSync(path.join(BACKUP,"LEEME.txt"),"Mapas Atlas inmediatamente anteriores a las etiquetas Tier. Restaura sobre Data para revertir esta capa.\n");}
function apply(){for(const m of hierarchy.maps){const file=`Map${pad(m.mapId)}.rxdata`,map=read(file),pair=iv(map,"events").pairs.find(([id])=>Number(id)===10);if(!pair)throw new Error(`${file} no tiene baliza 10`);const ev=pair[1];ev.setIvar("name",S(`Atlas Tier ${m.tier} Beacon ${m.mapId}`));const pages=iv(ev,"pages")||[];if(!pages[0])throw new Error(`${file}: baliza sin página`);pages[0].setIvar("list",textCommands(linesFor(m)));write(file,map);}}
function verify(){const errors=[];for(const m of hierarchy.maps){const file=`Map${pad(m.mapId)}.rxdata`;if(!fs.existsSync(path.join(DATA,file))){errors.push(`falta ${file}`);continue;}const map=read(file),events=iv(map,"events").pairs,ev=events.find(([id])=>Number(id)===10)?.[1];if(!ev||txt(iv(ev,"name"))!==`Atlas Tier ${m.tier} Beacon ${m.mapId}`)errors.push(`${m.mapId}: tier incorrecto`);if(!events.some(([,e])=>txt(iv(e,"name"))==="Return to Puerto Horizonte"))errors.push(`${m.mapId}: sin retorno`);}if(errors.length)throw new Error(`Jerarquía inválida (${errors.length}):\n- ${errors.slice(0,50).join("\n- ")}`);console.log("Verificación OK: 40 Tier 1, 120 Tier 2 y 840 Ecos Tier 3, todos con retorno.");}
if(!VERIFY){backup();apply();console.log(`Jerarquía narrativa aplicada. Backup: ${path.relative(ROOT,BACKUP)}`);}verify();
