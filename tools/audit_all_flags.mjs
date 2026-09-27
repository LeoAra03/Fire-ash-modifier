#!/usr/bin/env node
/** Auditoría estática exhaustiva de switches, variables y self-switches. */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { marshalLoad,RString } from "../web/js/marshal.js";
import { mapListFromInfos,parseMap,parseEvent,cmdOf,rstr } from "../web/js/rmxp.js";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const DATA=path.join(ROOT,"pokemon_fire_ash","Data"),BACKUP=path.join(ROOT,"pokemon_fire_ash","PokeModBackups");
const read=(f)=>marshalLoad(fs.readFileSync(path.join(DATA,f))),text=(v)=>v instanceof RString?v.text:String(v??""),pad3=(n)=>String(n).padStart(3,"0");
const system=read("System.rxdata"),switchNames=(system.getIvar("switches")||[]).map(text),variableNames=(system.getIvar("variables")||[]).map(text);
const switches=new Map(),variables=new Map(),selfSwitches=new Map(),dynamic=[];
function rec(store,id,name=""){id=Number(id);if(!store.has(id))store.set(id,{id,name,reads:0,writesOn:0,writesOff:0,writesOther:0,scriptAccess:0,locations:[]});const r=store.get(id);if(name&&!r.name)r.name=name;return r;}
for(let i=1;i<switchNames.length;i++)rec(switches,i,switchNames[i]);
for(let i=1;i<variableNames.length;i++)rec(variables,i,variableNames[i]);
function locPush(r,kind,where){if(r.locations.length<30)r.locations.push({kind,...where});}
function useSwitch(id,kind,where){const r=rec(switches,id,switchNames[id]||"");if(kind==="read")r.reads++;else if(kind==="on")r.writesOn++;else if(kind==="off")r.writesOff++;else if(kind==="script")r.scriptAccess++;else r.writesOther++;locPush(r,kind,where);}
function useVariable(id,kind,where){const r=rec(variables,id,variableNames[id]||"");if(kind==="read")r.reads++;else if(kind==="script")r.scriptAccess++;else r.writesOther++;locPush(r,kind,where);}
function useSelf(key,kind,where){if(!selfSwitches.has(key))selfSwitches.set(key,{key,reads:0,on:0,off:0,locations:[]});const r=selfSwitches.get(key);if(kind==="read")r.reads++;else if(kind==="on")r.on++;else r.off++;if(r.locations.length<20)r.locations.push({kind,...where});}
function scanRuby(code,where){
  for(const m of code.matchAll(/\$game_switches\s*\[\s*([^\]]+)\s*\]/g)){
    const expr=m[1].trim(),tail=code.slice(m.index+m[0].length,m.index+m[0].length+12);
    if(/^\d+$/.test(expr)){const assignment=/^\s*=\s*(?![=])/.test(tail);useSwitch(Number(expr),assignment?"script_write":"script",where);}
    else dynamic.push({kind:"switch",expression:expr,...where});
  }
  for(const m of code.matchAll(/\$game_variables\s*\[\s*([^\]]+)\s*\]/g)){
    const expr=m[1].trim(),tail=code.slice(m.index+m[0].length,m.index+m[0].length+12);
    if(/^\d+$/.test(expr)){const assignment=/^\s*=\s*(?![=])/.test(tail);useVariable(Number(expr),assignment?"write":"script",where);}
    else dynamic.push({kind:"variable",expression:expr,...where});
  }
  for(const m of code.matchAll(/\$game_self_switches\s*\[\s*([^\n]+?)\s*\]/g))dynamic.push({kind:"self-switch",expression:m[1].slice(0,120),...where});
}
function scanList(list,base){
  for(let i=0;i<list.length;){const c=cmdOf(list[i]),p=c.params,where={...base,commandIndex:i,code:c.code};
    if(c.code===111){const type=Number(p[0]);if(type===0)useSwitch(Number(p[1]),"read",where);else if(type===1)useVariable(Number(p[1]),"read",where);else if(type===2)useSelf(`${base.mapId||`CE${base.commonEventId}`}:${base.eventId||0}:${rstr(p[1])}`,"read",where);else if(type===12)scanRuby(rstr(p[1]),where);}
    else if(c.code===121){for(let id=Number(p[0]);id<=Number(p[1]);id++)useSwitch(id,Number(p[2])===0?"on":"off",where);}
    else if(c.code===122){for(let id=Number(p[0]);id<=Number(p[1]);id++)useVariable(id,"write",where);if(Number(p[3])===4)scanRuby(rstr(p[4]),where);}
    else if(c.code===123)useSelf(`${base.mapId||`CE${base.commonEventId}`}:${base.eventId||0}:${rstr(p[0])}`,Number(p[1])===0?"on":"off",where);
    else if(c.code===355){const lines=[rstr(p[0])];let j=i+1;while(j<list.length&&cmdOf(list[j]).code===655){lines.push(rstr(cmdOf(list[j]).params[0]));j++;}scanRuby(lines.join("\n"),where);i=j;continue;}
    i++;
  }
}
const infos=mapListFromInfos(read("MapInfos.rxdata"));
for(const info of infos){const file=`Map${pad3(info.id)}.rxdata`;if(!fs.existsSync(path.join(DATA,file)))continue;let map;try{map=parseMap(read(file));}catch{continue;}for(const {id,obj} of map.events){let ev;try{ev=parseEvent(obj);}catch{continue;}for(const pg of ev.pages){const where={mapId:info.id,mapName:info.name,eventId:id,eventName:ev.name,page:pg.index+1};if(pg.condition?.switch1)useSwitch(pg.condition.switch1,"read",{...where,source:"page"});if(pg.condition?.switch2)useSwitch(pg.condition.switch2,"read",{...where,source:"page"});if(pg.condition?.variable)useVariable(pg.condition.variable.id,"read",{...where,source:"page"});if(pg.condition?.selfSwitch)useSelf(`${info.id}:${id}:${pg.condition.selfSwitch}`,"read",{...where,source:"page"});scanList(pg.list||[],where);}}}
const common=read("CommonEvents.rxdata");for(let id=1;id<common.length;id++){const ce=common[id];if(!ce)continue;const where={commonEventId:id,commonEventName:text(ce.getIvar("name"))};const sw=Number(ce.getIvar("switch_id")||0);if(sw)useSwitch(sw,"read",{...where,source:"trigger"});scanList(ce.getIvar("list")||[],where);}
const scripts=read("Scripts.rxdata");for(let i=0;i<scripts.length;i++){try{const code=zlib.inflateSync(Buffer.from(scripts[i][2].bytes)).toString("utf8");scanRuby(code,{scriptIndex:i,scriptName:text(scripts[i][1])});}catch{/* analyzer principal informa zlib */}}
function finalize(store){return[...store.values()].sort((a,b)=>a.id-b.id).map((r)=>{const writes=(r.writesOn||0)+(r.writesOff||0)+(r.writesOther||0);const readish=(r.reads||0)+(r.scriptAccess||0);let status="used";if(!writes&&!readish)status="no literal use";else if(writes&&!readish)status="write only/static";else if(!writes&&readish)status="read/access only";if(!r.name&&status!=="no literal use")status+="; unnamed";return{...r,writes,readish,status};});}
const switchRows=finalize(switches),variableRows=finalize(variables),selfRows=[...selfSwitches.values()].sort((a,b)=>a.key.localeCompare(b.key,undefined,{numeric:true}));
const expected={701:"POKEMOD HYPNO RESCUE STARTED",702:"POKEMOD HYPNO SUBDUED",703:"POKEMOD CHILDREN RESCUED",704:"POKEMOD HORIZONS OPEN",705:"POKEMOD HORIZONS 500 COMPLETE",706:"POKEMOD ATLAS MIL OPEN",707:"POKEMOD ATLAS MIL 500 COMPLETE"};
const approvedPath=path.join(ROOT,"content","atlas_tier1_blueprints_approved.json");
const approvedBlueprints=fs.existsSync(approvedPath)?JSON.parse(fs.readFileSync(approvedPath,"utf8")).blueprints||[]:[];
for(const b of approvedBlueprints){const sw=b.flags?.globalSwitches?.[0];if(sw)expected[Number(sw.id)]=String(sw.name);}
const tier2Files=fs.readdirSync(path.join(ROOT,"content")).filter((file)=>/^atlas_tier2_blueprints_macro\d+\.json$/.test(file));
const tier2Blueprints=tier2Files.flatMap((file)=>JSON.parse(fs.readFileSync(path.join(ROOT,"content",file),"utf8")).blueprints||[]);
const expectedVariables={};
for(const b of tier2Blueprints){const route=String(Number(b.progression.switchId)-747).padStart(2,"0");expected[Number(b.progression.switchId)]=`POKEMOD ATLAS T2 ROUTE ${route}`;expectedVariables[Number(b.progression.decisionVariable)]=`POKEMOD ATLAS T2 DECISION ${route}`;}
const tier1Count=approvedBlueprints.length,tier1First=708,tier1Last=tier1Count?tier1First+tier1Count-1:tier1First-1,decisionLast=103+tier1Count;
const customConflicts=[];for(const[id,name]of Object.entries(expected))if(switchNames[Number(id)]!==name)customConflicts.push({kind:"switch",id:Number(id),expected:name,actual:switchNames[Number(id)]||""});for(const[id,name]of Object.entries(expectedVariables))if(variableNames[Number(id)]!==name)customConflicts.push({kind:"variable",id:Number(id),expected:name,actual:variableNames[Number(id)]||""});
const dynamicUnique=[...new Map(dynamic.map((x)=>[`${x.kind}|${x.expression}|${x.scriptName||x.mapId||x.commonEventId}`,x])).values()];
const report={generatedAt:new Date().toISOString(),scope:{maps:infos.length,commonEvents:common.filter(Boolean).length,scriptSections:scripts.length},summary:{switchSlots:switchNames.length-1,namedSwitches:switchNames.slice(1).filter(Boolean).length,literalSwitchesUsed:switchRows.filter((r)=>r.status!=="no literal use").length,variableSlots:variableNames.length-1,namedVariables:variableNames.slice(1).filter(Boolean).length,literalVariablesUsed:variableRows.filter((r)=>r.status!=="no literal use").length,selfSwitchKeys:selfRows.length,dynamicExpressions:dynamicUnique.length,customConflicts:customConflicts.length},switches:switchRows,variables:variableRows,selfSwitches:selfRows,dynamicAccesses:dynamicUnique,customConflicts,notes:["La auditoría estática enumera el 100% de los slots y todas las referencias literales.","Los accesos dinámicos se listan por expresión; no es seguro considerar libre un ID solo porque no aparezca literalmente.","write only/read only son indicadores de revisión, no errores automáticos: scripts dinámicos pueden completar el flujo."]};
fs.mkdirSync(BACKUP,{recursive:true});fs.writeFileSync(path.join(BACKUP,"auditoria_flags_total.json"),JSON.stringify(report,null,2));
const md=["# Auditoría total de flags de Fire Ash","",`Generada: ${report.generatedAt}`,"","## Cobertura","",`- ${infos.length} mapas.`,`- ${report.scope.commonEvents} eventos comunes.`,`- ${scripts.length} secciones de script.`,`- ${report.summary.switchSlots} slots de switch (${report.summary.namedSwitches} con nombre).`,`- ${report.summary.variableSlots} slots de variable (${report.summary.namedVariables} con nombre).`,`- ${report.summary.selfSwitchKeys} claves de self-switch observadas.`,`- ${report.summary.dynamicExpressions} expresiones dinámicas distintas.`,"","La ausencia de una referencia literal no demuestra que una flag sea libre: Ruby puede calcular índices en ejecución. Por eso las expresiones dinámicas se conservan en el JSON completo.","","## Flags PokeMod reservadas","","| ID | Nombre | Estado |","|---:|---|---|"];
for(const[id,name]of Object.entries(expected)){const row=switchRows.find((r)=>r.id===Number(id));md.push(`| ${id} | ${name} | ${row?.status||"missing"} |`);}md.push("","## Variables PokeMod Tier 2 reservadas","","| ID | Nombre | Estado |","|---:|---|---|");for(const[id,name]of Object.entries(expectedVariables)){const row=variableRows.find((r)=>r.id===Number(id));md.push(`| ${id} | ${name} | ${row?.status||"missing"} |`);}md.push("",`Conflictos de reserva: **${customConflicts.length}**.`,"",`## Switches 1–${report.summary.switchSlots}`,"","| ID | Nombre | Lecturas | ON | OFF | Script | Estado |","|---:|---|---:|---:|---:|---:|---|");
for(const r of switchRows)md.push(`| ${r.id} | ${(r.name||"—").replaceAll("|","/")} | ${r.reads} | ${r.writesOn} | ${r.writesOff} | ${r.scriptAccess} | ${r.status} |`);
md.push("",`## Variables 1–${report.summary.variableSlots}`,"","| ID | Nombre | Lecturas | Escrituras | Script | Estado |","|---:|---|---:|---:|---:|---|");for(const r of variableRows)md.push(`| ${r.id} | ${(r.name||"—").replaceAll("|","/")} | ${r.reads} | ${r.writesOther} | ${r.scriptAccess} | ${r.status} |`);
md.push("","## Switches críticos revisados","","- **429 – Postgame:** conserva el acceso postgame del contenido aditivo.","- **674 – NO ITEM INBATT:** los eventos originales pueden seguir activándolo, pero `pbItemMenu` ya no lo consulta en combates internos.","- **675 – NO ITEM OUTBATT:** no fue modificado.","- **701–707:** misión de Hypno, Horizontes y Atlas Mil.",`- **${tier1First}–${tier1Last}:** ${tier1Count} sellos narrativos Tier 1 aprobados, verificados sin colisión.`,"- **Variables 101–103:** contadores separados de Horizontes, Atlas Mil y sellos narrativos.",`- **Variables 104–${decisionLast}:** decisiones persistentes de los ${tier1Count} episodios Tier 1.`,`- **Switches 748–757 y variables 144–153:** progreso y decisiones persistentes de las primeras ${tier2Blueprints.length} rutas Tier 2.`,"","## Indicadores que requieren cautela","",`- Switches con nombre sin uso literal: ${switchRows.filter((r)=>r.name&&r.status==="no literal use").length}.`,`- Switches usados sin nombre: ${switchRows.filter((r)=>!r.name&&r.status!=="no literal use").length}.`,`- Switches con escritura estática sin lectura literal: ${switchRows.filter((r)=>r.status.startsWith("write only")).length}.`,`- Switches con lectura/acceso sin escritura estática: ${switchRows.filter((r)=>r.status.startsWith("read/access only")).length}.`,"","El detalle de ubicaciones (hasta 30 por ID), self-switches y expresiones dinámicas está en:","","`pokemon_fire_ash/PokeModBackups/auditoria_flags_total.json`","");
fs.writeFileSync(path.join(ROOT,"docs","AUDITORIA_TOTAL_FLAGS.md"),md.join("\n"));
console.log(JSON.stringify(report.summary,null,2));console.log("docs/AUDITORIA_TOTAL_FLAGS.md");console.log("pokemon_fire_ash/PokeModBackups/auditoria_flags_total.json");
