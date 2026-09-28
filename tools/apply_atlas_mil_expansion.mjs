#!/usr/bin/env node
/**
 * Instala/verifica Atlas Mil: mapas 1021-2020, 40 sectores, navegación libre
 * y 500 eventos/combates adicionales no redundantes con Horizontes.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalLoad,marshalDump,RHash,RObject,RString,RSymbol } from "../web/js/marshal.js";
import { parseMap,parseTileset,tableGet } from "../web/js/rmxp.js";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const GAME=path.join(ROOT,"pokemon_fire_ash"),DATA=path.join(GAME,"Data");
const CATALOG=JSON.parse(fs.readFileSync(path.join(ROOT,"content","atlas_mil_500.json"),"utf8"));
const BACKUP=path.join(GAME,"PokeModBackups","atlas_mil_originals");
const VERIFY=process.argv.includes("--verify");
const maps=CATALOG.maps,suggestions=CATALOG.suggestions,sectors=CATALOG.sectors;
const HUB=1001,HORIZONS_OPEN=704,ATLAS_OPEN=706,ATLAS_COMPLETE=707,ATLAS_COUNT=102;
const NEW_IDS=maps.map((m)=>m.newId),HUB_MARKER="PokeMod Atlas Mil:";
const affected=["System.rxdata","Map1001.rxdata","MapInfos.rxdata","map_metadata.dat","trainers.dat"];

const S=(v)=>RString.fromText(String(v)),Sym=(v)=>new RSymbol(String(v));
const iv=(o,n)=>o?.getIvar?.(n),txt=(v)=>v instanceof RString?v.text:String(v??""),sym=(v)=>v instanceof RSymbol?v.name:String(v??"");
const pad3=(n)=>String(n).padStart(3,"0"),readRx=(f)=>marshalLoad(fs.readFileSync(path.join(DATA,f)));
const writeRx=(f,v)=>fs.writeFileSync(path.join(DATA,f),Buffer.from(marshalDump(v)));
const cloneMarshal=(v)=>marshalLoad(Buffer.from(marshalDump(v)));

function backupAffected(){
  fs.mkdirSync(BACKUP,{recursive:true});
  for(const f of affected){const src=path.join(DATA,f),dst=path.join(BACKUP,f);if(fs.existsSync(src)&&!fs.existsSync(dst))fs.copyFileSync(src,dst);}
  fs.writeFileSync(path.join(BACKUP,"LEEME.txt"),"Originales anteriores a Atlas Mil. Para revertir, restaura estos archivos y elimina Map1021-Map2020.rxdata.\n");
}
function cmd(code,params=[],indent=0){return new RObject("RPG::EventCommand",[["@code",code],["@indent",indent],["@parameters",params]]);}
function condition({sw1=0,sw2=0,self=""}={}){return new RObject("RPG::Event::Page::Condition",[
  ["@switch1_valid",!!sw1],["@switch1_id",sw1||1],["@switch2_valid",!!sw2],["@switch2_id",sw2||1],
  ["@variable_valid",false],["@variable_id",1],["@variable_value",0],["@self_switch_valid",!!self],["@self_switch_ch",S(self||"A")],
]);}
function graphic(name="",dir=2,pattern=1){return new RObject("RPG::Event::Page::Graphic",[
  ["@tile_id",0],["@character_name",S(name)],["@character_hue",0],["@direction",dir],["@pattern",pattern],["@opacity",255],["@blend_type",0],
]);}
function route(){return new RObject("RPG::MoveRoute",[["@repeat",true],["@skippable",false],["@list",[]]]);}
function page({cond=condition(),gfx=graphic(),trigger=0,through=true,alwaysTop=false,list=[cmd(0)]}={}){return new RObject("RPG::Event::Page",[
  ["@condition",cond],["@graphic",gfx],["@move_type",0],["@move_speed",3],["@move_frequency",3],["@move_route",route()],
  ["@walk_anime",true],["@step_anime",false],["@direction_fix",false],["@through",through],["@always_on_top",alwaysTop],["@trigger",trigger],["@list",list],
]);}
function event(id,name,x,y,pages){return new RObject("RPG::Event",[["@id",id],["@name",S(name)],["@x",x],["@y",y],["@pages",pages]]);}
function wrap(input,max=43){const out=[];for(const paragraph of String(input).split("\n")){const words=paragraph.split(/\s+/).filter(Boolean);let line="";for(const word of words){if(!line)line=word;else if(`${line} ${word}`.length<=max)line+=` ${word}`;else{out.push(line);line=word;}}if(line)out.push(line);}return out.length?out:["..."];}
function textCommands(lines,indent=0){const all=(Array.isArray(lines)?lines:[lines]).flatMap((x)=>wrap(x));return[cmd(101,[S("")],indent),...all.map((x)=>cmd(401,[S(x)],indent))];}
function scriptCommands(lines,indent=0){const all=Array.isArray(lines)?lines:[lines];return[cmd(355,[S(all[0]||"")],indent),...all.slice(1).map((x)=>cmd(655,[S(x)],indent))];}
function transfer(map,x,y,dir=2,indent=0){return cmd(201,[0,map,x,y,dir,1],indent);}
function selfOn(letter="A",indent=0){return cmd(123,[S(letter),0],indent);}
function setSwitch(id,on=true,indent=0){return cmd(121,[id,id,on?0:1],indent);}
function commandsOf(ev){const out=[];for(const pg of iv(ev,"pages")||[])for(const c of iv(pg,"list")||[])out.push(c);return out;}

const tilesetRaw=readRx("Tilesets.rxdata"),tilesets=new Map();
for(let i=1;i<tilesetRaw.length;i++)if(tilesetRaw[i])tilesets.set(i,parseTileset(tilesetRaw[i]));
function openCell(parsed,tileset,x,y){if(x<1||y<1||x>=parsed.width-1||y>=parsed.height-1)return false;let p=0;for(let z=0;z<parsed.table.z;z++){const t=tableGet(parsed.table,x,y,z);if(t>0&&t<tileset.passages.data.length)p|=tileset.passages.data[t]&15;}return p===0;}
function largestComponent(mapObj){const p=parseMap(mapObj),t=tilesets.get(p.tilesetId),seen=new Set(),all=[];for(let y=1;y<p.height-1;y++)for(let x=1;x<p.width-1;x++){const key=`${x},${y}`;if(seen.has(key)||!openCell(p,t,x,y))continue;const q=[[x,y]];seen.add(key);for(let j=0;j<q.length;j++){const[c,d]=q[j];for(const[n,m]of[[c+1,d],[c-1,d],[c,d+1],[c,d-1]]){const k=`${n},${m}`;if(!seen.has(k)&&openCell(p,t,n,m)){seen.add(k);q.push([n,m]);}}}all.push(q);}all.sort((a,b)=>b.length-a.length);return all[0]||[];}
function spreadPositions(mapObj,count,excluded=[]){const cells=largestComponent(mapObj),ban=new Set(excluded.map((p)=>p.join(",")));if(cells.filter((c)=>!ban.has(c.join(","))).length<count)throw new Error(`Mapa sin ${count} posiciones libres`);const available=cells.filter((c)=>!ban.has(c.join(","))),chosen=[available[Math.floor(available.length/2)]],used=new Set([chosen[0].join(",")]);while(chosen.length<count){let best,bestScore=-1;for(const cell of available){if(used.has(cell.join(",")))continue;const score=Math.min(...chosen.map(([x,y])=>(x-cell[0])**2+(y-cell[1])**2));if(score>bestScore){bestScore=score;best=cell;}}chosen.push(best);used.add(best.join(","));}return chosen;}

function installSystem(){const s=readRx("System.rxdata"),sw=iv(s,"switches")||[],v=iv(s,"variables")||[];sw[ATLAS_OPEN]=S("POKEMOD ATLAS MIL OPEN");sw[ATLAS_COMPLETE]=S("POKEMOD ATLAS MIL 500 COMPLETE");v[ATLAS_COUNT]=S("POKEMOD ATLAS MIL COMPLETED");s.setIvar("switches",sw);s.setIvar("variables",v);writeRx("System.rxdata",s);}
function portal(id,name,x,y,target,spawn,message,cond=condition()){return event(id,name,x,y,[page({cond,gfx:graphic("Object ball special"),list:[...textCommands([message]),cmd(102,[[S("Viajar"),S("Quedarme")],2]),cmd(402,[0,S("Viajar")]),transfer(target,spawn[0],spawn[1],2,1),cmd(402,[1,S("Quedarme")]),cmd(404),cmd(0)]})]);}
function completion(indent=0){return[...scriptCommands([`$game_variables[${ATLAS_COUNT}]=[$game_variables[${ATLAS_COUNT}].to_i+1,500].min`,`$game_switches[${ATLAS_COMPLETE}]=true if $game_variables[${ATLAS_COUNT}]>=500`],indent),selfOn("A",indent)];}
function eliteSetup(s){return[`p=Pokemon.new(:${s.pokemon},${s.level})`,`GameData::Stat.each_main { |stat| p.iv[stat.id]=31 }`,`p.ev[:HP]=252; p.ev[:SPECIAL_ATTACK]=252; p.ev[:SPEED]=6`,`p.nature=:MODEST; p.moves=[]`,`[${s.moves.map((m)=>`:${m}`).join(",")}].each { |m| p.learn_move(m) }`,`p.calc_stats`,`setBattleRule(\"cannotRun\"); setBattleRule(\"canLose\")`,`d=pbWildBattleCore(p)`];}
function suggestionEvent(s,x,y){const first=[...textCommands([s.title,s.hook])];let g=s.trainerSprite;
  if(s.category==="pokemon_elite"){g="Object ball special";first.push(...scriptCommands(eliteSetup(s)),cmd(111,[12,S("d==1 || d==4")]),...completion(1),cmd(411),...textCommands(["La señal sigue activa. Puedes recuperarte y repetir el encuentro."],1),cmd(412));}
  else if(s.category.startsWith("evento_")){first.push(cmd(102,[[S("Resolver con cooperación"),S("Examinar otra vez")],2]),cmd(402,[0,S("Resolver con cooperación")]),...scriptCommands([`pbReceiveItem(:${s.item})`],1),...completion(1),cmd(402,[1,S("Examinar otra vez")]),...textCommands(["El evento queda pendiente y no consume su flag."],1),cmd(404));}
  else {const dbl=s.doubleBattle?"true":"false",call=`pbTrainerBattle(:${s.trainerType},${JSON.stringify(s.trainerName)},nil,${dbl},0,true)`;
    if(s.doubleBattle){first.push(cmd(111,[12,S("!pbCanDoubleBattle?")]),...textCommands(["Necesitas al menos dos Pokémon utilizables para esta pelea doble."],1),cmd(115,[],1),cmd(412));}
    first.push(...scriptCommands([`pbTrainerIntro(:${s.trainerType})`]),cmd(111,[12,S(call)]),...completion(1),cmd(411),...textCommands(["La pelea puede repetirse después de curar al equipo."],1),cmd(412),...scriptCommands(["pbTrainerEnd"]));
  }
  first.push(cmd(0));const gfx=()=>graphic(g);return event(100,`Atlas desafío ${String(s.id).padStart(3,"0")}`,x,y,[page({gfx:gfx(),list:first}),page({cond:condition({self:"A"}),gfx:gfx(),list:[...textCommands([`Registro Atlas ${s.id}/500 completado: ${s.title}.`]),cmd(0)]})]);}
function beaconEvent(map,x,y){return event(10,`Baliza Atlas ${map.index}`,x,y,[page({gfx:graphic("Object ball special"),list:[...textCommands([`${map.name}. Sector ${map.sector}: ${map.sectorName}.`,`Esta geografía deriva de ${map.sourceName}, pero pertenece a una ruta postgame independiente.`]),cmd(0)]})]);}

function sourcePositions(){const result=new Map();for(const map of maps){const obj=readRx(`Map${pad3(map.sourceId)}.rxdata`);result.set(map.newId,spreadPositions(obj,6));}return result;}
function installMaps(){const pos=sourcePositions();for(let i=0;i<maps.length;i++){const m=maps[i],obj=readRx(`Map${pad3(m.sourceId)}.rxdata`),p=pos.get(m.newId),events=[];
    events.push(portal(1,"Return to Puerto Horizonte",p[1][0],p[1][1],HUB,[34,23],"La baliza regresa inmediatamente a Puerto Horizonte."));
    if(i>0){const prev=maps[i-1],sp=pos.get(prev.newId)[0];events.push(portal(2,"Previous Atlas Map",p[2][0],p[2][1],prev.newId,sp,"La senda vuelve al mapa anterior del Atlas."));}
    if(i<maps.length-1){const next=maps[i+1],sp=pos.get(next.newId)[0];events.push(portal(3,"Next Atlas Map",p[3][0],p[3][1],next.newId,sp,"La senda continúa al siguiente mapa del Atlas."));}
    events.push(beaconEvent(m,p[4][0],p[4][1]));const s=suggestions.find((x)=>x.mapId===m.newId);if(s)events.push(suggestionEvent(s,p[5][0],p[5][1]));
    iv(obj,"events").pairs=events.map((ev)=>[Number(iv(ev,"id")),ev]);writeRx(`Map${pad3(m.newId)}.rxdata`,obj);
  }}
function hubMaster(id,x,y,firstSpawn){const gfx=()=>graphic("trchar028");return event(id,`${HUB_MARKER} Cronista`,x,y,[
  page({cond:condition({sw1:HORIZONS_OPEN}),gfx:gfx(),list:[...textCommands(["Cronista Atlas: Detectamos mil ecos cartográficos. Cada diseño proviene de una geografía distinta y está dividido en cuarenta sectores.","Los primeros quinientos contienen eventos o peleas que no aparecen en Horizontes. ¿Abrimos el Atlas Mil?"]),cmd(102,[[S("Abrir Atlas Mil"),S("Más tarde")],2]),cmd(402,[0,S("Abrir Atlas Mil")]),setSwitch(ATLAS_OPEN,true,1),transfer(1021,firstSpawn[0],firstSpawn[1],2,1),cmd(402,[1,S("Más tarde")]),cmd(404),cmd(0)]}),
  page({cond:condition({sw1:ATLAS_OPEN}),gfx:gfx(),list:[...textCommands(["Cronista Atlas: Has resuelto \\v[102] de 500 registros. Las puertas sectoriales permiten saltar bloques de veinticinco mapas."]),cmd(0)]}),
  page({cond:condition({sw1:ATLAS_COMPLETE}),gfx:gfx(),list:[...textCommands(["Cronista Atlas: Los quinientos registros están completos. Has recorrido una cartografía que ninguna línea temporal podía contener."]),...scriptCommands(["pbReceiveItem(:MASTERBALL)"]),selfOn("B"),cmd(0)]}),
  page({cond:condition({self:"B"}),gfx:gfx(),list:[...textCommands(["Cronista Atlas: Atlas Mil está completo. Sus mil mapas y todas sus salidas permanecen abiertos."]),cmd(0)]}),
]);}
function installHub(){const obj=readRx("Map1001.rxdata"),events=iv(obj,"events");events.pairs=events.pairs.filter(([,ev])=>!txt(iv(ev,"name")).startsWith(HUB_MARKER));const occupied=events.pairs.map(([,ev])=>[Number(iv(ev,"x")),Number(iv(ev,"y"))]),positions=spreadPositions(obj,41,occupied),sourcePos=sourcePositions();
  const additions=[hubMaster(900,positions[0][0],positions[0][1],sourcePos.get(1021)[0])];
  for(let sector=0;sector<40;sector++){const target=maps[sector*25],spawn=sourcePos.get(target.newId)[0],p=positions[sector+1];additions.push(portal(901+sector,`${HUB_MARKER} Sector ${sector+1}`,p[0],p[1],target.newId,spawn,`Puerta al sector ${sector+1}: ${sectors[sector].name}.`,condition({sw1:ATLAS_OPEN})));}
  for(const ev of additions)events.pairs.push([Number(iv(ev,"id")),ev]);writeRx("Map1001.rxdata",obj);
}
function mapInfo(name,parent,order){return new RObject("RPG::MapInfo",[["@scroll_x",512],["@name",S(name)],["@expanded",false],["@order",order],["@parent_id",parent],["@scroll_y",384]]);}
function installInfos(){const infos=readRx("MapInfos.rxdata"),ids=new Set(NEW_IDS);infos.pairs=infos.pairs.filter(([k])=>!ids.has(Number(k)));let order=Math.max(0,...infos.pairs.map(([,o])=>Number(iv(o,"order")||0)))+1;for(const m of maps){const first=1021+(m.sector-1)*25,parent=m.index%25===1?HUB:first;infos.pairs.push([m.newId,mapInfo(m.name,parent,order++)]);}writeRx("MapInfos.rxdata",infos);}
function installMetadata(){const md=readRx("map_metadata.dat"),ids=new Set(NEW_IDS);md.pairs=md.pairs.filter(([k])=>!ids.has(Number(k)));const byId=new Map(md.pairs.map(([k,o])=>[Number(k),o]));for(const m of maps){const meta=cloneMarshal(byId.get(m.sourceId)||byId.get(973));meta.setIvar("town_map_position",[9,0,0]);md.pairs.push([m.newId,meta]);}writeRx("map_metadata.dat",md);}
function dataSymbols(file){const d=readRx(file),s=new Set();for(const[k]of d.pairs)if(k instanceof RSymbol)s.add(k.name);return s;}
const trainerSuggestions=()=>suggestions.filter((s)=>!["pokemon_elite","evento_artefacto","evento_decision"].includes(s.category));
function trainerMatch(key,s){return Array.isArray(key)&&sym(key[0])===s.trainerType&&txt(key[1])===s.trainerName&&Number(key[2])===0;}
function trainerPokemon(sp,level){return new RHash([[Sym("species"),Sym(sp)],[Sym("level"),level]]);}
function trainerObject(s,id){const key=[Sym(s.trainerType),S(s.trainerName),0];return new RObject("GameData::Trainer",[["@id",key],["@id_number",id],["@trainer_type",key[0]],["@real_name",key[1]],["@version",0],["@items",[Sym("FULLRESTORE"),Sym("FULLRESTORE")]],["@real_lose_text",S(`${s.trainerName}: El registro del Atlas es tuyo.`)],["@numpkmn",0],["@guara",0],["@pokemon",s.team.map((sp,k)=>trainerPokemon(sp,Math.min(100,88+((s.id+k)%13))))]]);}
function installTrainers(){const species=dataSymbols("species.dat"),types=dataSymbols("trainer_types.dat"),d=readRx("trainers.dat");for(const s of trainerSuggestions()){if(!types.has(s.trainerType))throw new Error(`Tipo inexistente ${s.trainerType}`);for(const sp of s.team)if(!species.has(sp))throw new Error(`Especie inexistente ${sp}`);}let next=Math.max(-1,...d.pairs.filter(([k])=>typeof k==="number").map(([k])=>k))+1;for(const s of trainerSuggestions()){if(d.pairs.some(([k])=>trainerMatch(k,s)))continue;const obj=trainerObject(s,next),key=iv(obj,"id");d.pairs.push([next,obj],[key,obj]);next++;}writeRx("trainers.dat",d);}

function verify(){const errors=[],ok=(v,m)=>{if(!v)errors.push(m);};ok(maps.length===1000,"catálogo sin 1.000 mapas");ok(suggestions.length===500,"catálogo sin 500 propuestas");ok(new Set(maps.map((m)=>m.sourceId)).size===1000,"plantillas de mapa repetidas");
  const system=readRx("System.rxdata");ok(txt(iv(system,"switches")[ATLAS_OPEN]).includes("ATLAS"),"falta flag Atlas");ok(txt(iv(system,"variables")[ATLAS_COUNT]).includes("ATLAS"),"falta contador Atlas");
  const infos=readRx("MapInfos.rxdata"),metadata=readRx("map_metadata.dat");let challengeCount=0,returnCount=0,transferCount=0,wildCount=0;const mapCache=new Map();
  for(const m of maps){const file=`Map${pad3(m.newId)}.rxdata`;ok(fs.existsSync(path.join(DATA,file)),`falta ${file}`);ok(infos.pairs.some(([k])=>Number(k)===m.newId),`MapInfos sin ${m.newId}`);ok(metadata.pairs.some(([k])=>Number(k)===m.newId),`metadata sin ${m.newId}`);if(!fs.existsSync(path.join(DATA,file)))continue;const obj=readRx(file),events=iv(obj,"events").pairs.map(([,ev])=>ev);if(events.some((ev)=>txt(iv(ev,"name"))==="Return to Puerto Horizonte"))returnCount++;const challenges=events.filter((ev)=>txt(iv(ev,"name")).startsWith("Atlas desafío"));challengeCount+=challenges.length;
    for(const ev of events){const ruby=commandsOf(ev).filter((c)=>[111,355,655].includes(Number(iv(c,"code")))).map((c)=>txt(iv(c,"parameters")?.[Number(iv(c,"code"))===111?1:0])).join("\n");ok(!/:\w+:/.test(ruby),`${m.newId}: símbolo Ruby inválido`);if(ruby.includes("pbWildBattleCore(p)")){wildCount++;ok(ruby.includes("p.iv[stat.id]=31")&&ruby.includes("d==1 || d==4"),`${m.newId}: élite salvaje inválido`);}if(txt(iv(ev,"name")).startsWith("Atlas desafío")){const self=commandsOf(ev).find((c)=>Number(iv(c,"code"))===123);ok(self&&Number(iv(self,"parameters")[1])===0,`${m.newId}: self-switch incorrecto`);}for(const c of commandsOf(ev)){if(Number(iv(c,"code"))!==201)continue;transferCount++;const p=iv(c,"parameters"),targetId=Number(p[1]),x=Number(p[2]),y=Number(p[3]);if(!mapCache.has(targetId))mapCache.set(targetId,readRx(`Map${pad3(targetId)}.rxdata`));const target=parseMap(mapCache.get(targetId)),ts=tilesets.get(target.tilesetId);ok(openCell(target,ts,x,y),`${m.newId} transfiere a celda bloqueada ${targetId} (${x},${y})`);}}
  }
  const hub=readRx("Map1001.rxdata"),atlasHub=iv(hub,"events").pairs.map(([,ev])=>ev).filter((ev)=>txt(iv(ev,"name")).startsWith(HUB_MARKER));ok(atlasHub.length===41,`hub tiene ${atlasHub.length}/41 eventos Atlas`);for(const ev of atlasHub)for(const c of commandsOf(ev))if(Number(iv(c,"code"))===201)transferCount++;
  ok(challengeCount===500,`hay ${challengeCount}/500 desafíos`);ok(returnCount===1000,`hay ${returnCount}/1000 retornos`);ok(wildCount===100,`hay ${wildCount}/100 élites salvajes`);ok(transferCount===3039,`hay ${transferCount}/3039 transferencias`);
  const trainers=readRx("trainers.dat"),ts=trainerSuggestions();ok(ts.length===280,`catálogo tiene ${ts.length}/280 peleas de entrenador`);for(const s of ts){const pair=trainers.pairs.find(([k])=>trainerMatch(k,s));ok(!!pair,`falta ${s.trainerName}`);if(pair)ok((iv(pair[1],"pokemon")||[]).length===6,`${s.trainerName} sin seis Pokémon`);}
  if(errors.length)throw new Error(`Verificación Atlas fallida (${errors.length}):\n- ${errors.slice(0,100).join("\n- ")}`);console.log("Verificación OK: 1.000 mapas, 500 eventos/peleas únicos, 40 sectores y retorno libre.");}

if(!VERIFY){backupAffected();installSystem();installTrainers();installInfos();installMetadata();installMaps();installHub();console.log(`Atlas Mil instalado. Originales: ${path.relative(ROOT,BACKUP)}`);}verify();
