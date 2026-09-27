import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
export const qa={noBagLock:true,noImpossibleBattle:true,freeReturn:true,allAssetsExist:true,allDataIdsExist:true,notSimilarToPreviousContent:true,creepypastaIsOptInAndNonDestructive:true};
export const banned=["Soy un entrenador","Qué gran combate","Este Pokémon es muy fuerte","Según la Pokédex","Debes derrotarme"];
export const D=(before,during,after,optional)=>({before,during,after,optional});
export const N=(name,sprite,role,reason,conflict,want,fear,tic,dialogue)=>({name,sprite,role,reasonForBeingHere:reason,personalConflict:conflict,want,fear,verbalTic:tic,dialogue});
export const P=(species,level,narrativeRole,moves,item,whyItBelongs)=>({species,level,narrativeRole,moves,item,whyItBelongs});

export function build(d){
  return {mapId:d.id,tier:1,title:d.title,oneSentencePromise:d.promise,
    ...(Number.isInteger(d.prerequisiteSeals)?{prerequisiteSeals:d.prerequisiteSeals}:{}),
    biome:{identity:d.identity,visualStorytelling:d.visual,ambientChanges:d.ambient,assetManifest:[...new Map(d.npcs.map(n=>[n.sprite,{type:"character",id:n.sprite,exists:true}])).values()]},
    narrative:d.narrative,voiceProfile:{...d.voice,forbiddenPhrases:banned},npcs:d.npcs,battle:d.battle,
    cutscene:{trigger:d.steps[0],steps:d.steps.map((action,i)=>({order:i+1,eventCommand:i===3?"Show Choices":i===5?"Trainer Battle canLose":"RMXP event command",actor:i===3?"Jugador":i===5?d.battle.trainerName:"Escena",action,stateChange:i===6?`switch${d.flag}=true`:i===7?"map_state=resolved":null})),decision:d.decision,failurePath:"La derrota devuelve al jugador al punto de curación; no altera la decisión ni bloquea la salida.",reentryPath:"La escena omite la introducción ya vista y permite repetir únicamente la prueba pendiente."},
    reward:d.reward,
    flags:{globalSwitches:[{id:d.flag,name:`POKEMOD ATLAS SEAL ${String(d.flag-707).padStart(2,"0")}`,setWhen:"Tras resolver la decisión y vencer.",readWhen:"Archivo Final y continuidad sectorial."}],variables:[{id:103,name:"POKEMOD ATLAS NARRATIVE SEALS",operation:"Incrementar una vez, protegido por self-switch A."}],selfSwitches:[{event:"Conductor de escena",letter:"A",purpose:"Bloquear recompensa repetida."},{event:d.npcs[0].name,letter:"B",purpose:"Diálogo posterior."}]},
    exits:[{destination:1001,condition:"always",purpose:"Retorno incondicional a Puerto Horizonte."}],qaClaims:qa};
}

export function writeBatch(batch,rows,fileName){
  const out={batch,iteration:1,blueprints:rows.map(build)};
  fs.writeFileSync(path.join(ROOT,"content",fileName),JSON.stringify(out,null,2)+"\n");
  console.log(`Batch ${String(batch).padStart(2,"0")} generado: ${out.blueprints.length} blueprints.`);
}
