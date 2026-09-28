#!/usr/bin/env node
/**
 * Instala/verifica "Horizontes": misión de Hypno en Ciudad Verde, un bosque
 * nuevo y 500 aventuras interactivas repartidas entre 20 lugares postgame.
 *
 * Es aditivo: usa mapas 1000-1020, switches 701-705 y variable 101. Conserva
 * los mapas y entrenadores base. Los originales tocados se copian una sola vez
 * a PokeModBackups/horizontes_originals/.
 *
 * Uso:
 *   node tools/apply_horizontes_500_expansion.mjs
 *   node tools/apply_horizontes_500_expansion.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  marshalLoad, marshalDump, RHash, RObject, RString, RSymbol,
} from "../web/js/marshal.js";
import { parseMap, parseTileset, tableGet } from "../web/js/rmxp.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GAME = path.join(ROOT, "pokemon_fire_ash");
const DATA = path.join(GAME, "Data");
const CATALOG_FILE = path.join(ROOT, "content", "horizontes_500.json");
const BACKUP = path.join(GAME, "PokeModBackups", "horizontes_originals");
const VERIFY = process.argv.includes("--verify");
const catalog = JSON.parse(fs.readFileSync(CATALOG_FILE, "utf8"));
const realms = catalog.realms;
const adventures = catalog.adventures;

const VIRIDIAN = 43;
const FOREST = 1000;
const HUB = 1001;
const POSTGAME = 429;
const QUEST_STARTED = 701;
const HYPNO_SUBDUED = 702;
const QUEST_COMPLETE = 703;
const HORIZONS_OPEN = 704;
const ALL_COMPLETE = 705;
const ADVENTURE_COUNT = 101;
const NPC_MARKER = "PokeMod: Guardabosques Horizontes";
const NEW_MAP_IDS = [FOREST, ...realms.map((r) => r.mapId)];
const affected = ["System.rxdata", "Map043.rxdata", "MapInfos.rxdata", "map_metadata.dat", "trainers.dat"];

const S = (v) => RString.fromText(String(v));
const Sym = (v) => new RSymbol(String(v));
const iv = (o, n) => o?.getIvar?.(n);
const txt = (v) => v instanceof RString ? v.text : String(v ?? "");
const sym = (v) => v instanceof RSymbol ? v.name : String(v ?? "");
const pad3 = (n) => String(n).padStart(3, "0");
const readRx = (f) => marshalLoad(fs.readFileSync(path.join(DATA, f)));
const writeRx = (f, v) => fs.writeFileSync(path.join(DATA, f), Buffer.from(marshalDump(v)));
const cloneMarshal = (v) => marshalLoad(Buffer.from(marshalDump(v)));

function backupAffected() {
  fs.mkdirSync(BACKUP, { recursive:true });
  for (const file of affected) {
    const src = path.join(DATA, file), dst = path.join(BACKUP, file);
    if (fs.existsSync(src) && !fs.existsSync(dst)) fs.copyFileSync(src, dst);
  }
  fs.writeFileSync(path.join(BACKUP, "LEEME.txt"),
    "Originales inmediatamente anteriores a Horizontes. No incluye partidas.\n" +
    "Para revertir, copia estos archivos a Data y elimina Map1000-Map1020.rxdata.\n");
}

// ---------------------------------------------------------------------------
// Constructores RMXP expandidos
// ---------------------------------------------------------------------------
function cmd(code, params = [], indent = 0) {
  return new RObject("RPG::EventCommand", [["@code",code],["@indent",indent],["@parameters",params]]);
}
function condition({ sw1=0, sw2=0, variable=0, variableValue=0, self="" } = {}) {
  return new RObject("RPG::Event::Page::Condition", [
    ["@switch1_valid",!!sw1],["@switch1_id",sw1||1],
    ["@switch2_valid",!!sw2],["@switch2_id",sw2||1],
    ["@variable_valid",!!variable],["@variable_id",variable||1],["@variable_value",variableValue||0],
    ["@self_switch_valid",!!self],["@self_switch_ch",S(self||"A")],
  ]);
}
function graphic(name="", dir=2, pattern=1) {
  return new RObject("RPG::Event::Page::Graphic", [
    ["@tile_id",0],["@character_name",S(name)],["@character_hue",0],
    ["@direction",dir],["@pattern",pattern],["@opacity",255],["@blend_type",0],
  ]);
}
function route() { return new RObject("RPG::MoveRoute", [["@repeat",true],["@skippable",false],["@list",[]]]); }
function page({ cond=condition(), gfx=graphic(), trigger=0, through=false, alwaysTop=false, list=[cmd(0)] } = {}) {
  return new RObject("RPG::Event::Page", [
    ["@condition",cond],["@graphic",gfx],["@move_type",0],["@move_speed",3],["@move_frequency",3],
    ["@move_route",route()],["@walk_anime",true],["@step_anime",false],["@direction_fix",false],
    ["@through",through],["@always_on_top",alwaysTop],["@trigger",trigger],["@list",list],
  ]);
}
function event(id,name,x,y,pages) {
  return new RObject("RPG::Event", [["@id",id],["@name",S(name)],["@x",x],["@y",y],["@pages",pages]]);
}
function wrapLine(input, max=43) {
  const out=[];
  for (const paragraph of String(input).split("\n")) {
    const words=paragraph.split(/\s+/).filter(Boolean); let line="";
    for (const word of words) {
      if (!line) line=word;
      else if (`${line} ${word}`.length<=max) line+=` ${word}`;
      else { out.push(line); line=word; }
    }
    if (line) out.push(line);
  }
  return out.length ? out : ["..."];
}
function textCommands(lines, indent=0) {
  const all=(Array.isArray(lines)?lines:[lines]).flatMap((line)=>wrapLine(line));
  return [cmd(101,[S("")],indent),...all.map((line)=>cmd(401,[S(line)],indent))];
}
function scriptCommands(lines, indent=0) {
  const all=Array.isArray(lines)?lines:[lines];
  return [cmd(355,[S(all[0]||"")],indent),...all.slice(1).map((line)=>cmd(655,[S(line)],indent))];
}
function transfer(map,x,y,dir=2,indent=0) { return cmd(201,[0,map,x,y,dir,1],indent); }
function setSwitch(id,on=true,indent=0) { return cmd(121,[id,id,on?0:1],indent); }
function selfOn(letter="A",indent=0) { return cmd(123,[S(letter),0],indent); }
function addEvent(mapObj,ev) { iv(mapObj,"events").pairs.push([Number(iv(ev,"id")),ev]); }
function commandsOf(ev) {
  const out=[]; for (const pg of iv(ev,"pages")||[]) for (const c of iv(pg,"list")||[]) out.push(c); return out;
}

// ---------------------------------------------------------------------------
// Flags del sistema
// ---------------------------------------------------------------------------
function installSystemFlags() {
  const system=readRx("System.rxdata");
  const switches=iv(system,"switches")||[];
  const variables=iv(system,"variables")||[];
  const names={
    [QUEST_STARTED]:"POKEMOD HYPNO RESCUE STARTED",
    [HYPNO_SUBDUED]:"POKEMOD HYPNO SUBDUED",
    [QUEST_COMPLETE]:"POKEMOD CHILDREN RESCUED",
    [HORIZONS_OPEN]:"POKEMOD HORIZONS OPEN",
    [ALL_COMPLETE]:"POKEMOD HORIZONS 500 COMPLETE",
  };
  for (const [id,name] of Object.entries(names)) switches[Number(id)]=S(name);
  variables[ADVENTURE_COUNT]=S("POKEMOD HORIZONS COMPLETED");
  system.setIvar("switches",switches); system.setIvar("variables",variables);
  writeRx("System.rxdata",system);
}

// ---------------------------------------------------------------------------
// Misión principal de Hypno
// ---------------------------------------------------------------------------
function viridianNpc(id) {
  const first=[
    ...textCommands([
      "Guardabosques: Llegas justo a tiempo. Cinco niños desaparecieron siguiendo una canción hacia un bosque que no figura en ningún mapa.",
      "Las huellas tienen polvo psíquico. Creo que un Hypno muy poderoso los mantiene bajo su control.",
      "¿Aceptarás la misión de rescate?",
    ]),
    cmd(102,[[S("Aceptar misión"),S("Todavía no")],2]),
    cmd(402,[0,S("Aceptar misión")]), setSwitch(QUEST_STARTED,true,1),
    ...textCommands(["Guardabosques: Abriré el sendero. Podemos volver a Ciudad Verde en cualquier momento."],1),
    transfer(FOREST,35,45,8,1),
    cmd(402,[1,S("Todavía no")]),
    ...textCommands(["Guardabosques: Me quedaré aquí. Los niños necesitan ayuda, pero entra preparado."],1),
    cmd(404),cmd(0),
  ];
  const active=[
    ...textCommands(["Guardabosques: Hypno sigue en el corazón del bosque. ¿Quieres regresar al sendero de rescate?"]),
    cmd(102,[[S("Ir al bosque"),S("Quedarme")],2]),
    cmd(402,[0,S("Ir al bosque")]),transfer(FOREST,35,45,8,1),
    cmd(402,[1,S("Quedarme")]),cmd(404),cmd(0),
  ];
  const complete=[
    ...textCommands([
      "Guardabosques: Los niños están a salvo. Tras Hypno apareció una ruta hacia veinte territorios que no pertenecen a nuestra línea temporal.",
      "Los llamamos Horizontes. Allí hay 500 aventuras registradas y siempre podrás volver.",
    ]),
    cmd(102,[[S("Explorar Horizontes"),S("Volver al bosque"),S("Quedarme")],3]),
    cmd(402,[0,S("Explorar Horizontes")]),setSwitch(HORIZONS_OPEN,true,1),transfer(HUB,34,23,2,1),
    cmd(402,[1,S("Volver al bosque")]),transfer(FOREST,35,45,8,1),
    cmd(402,[2,S("Quedarme")]),cmd(404),cmd(0),
  ];
  const gfx=()=>graphic("trchar009");
  return event(id,NPC_MARKER,34,25,[
    page({cond:condition({sw1:POSTGAME}),gfx:gfx(),list:first}),
    page({cond:condition({sw1:QUEST_STARTED}),gfx:gfx(),list:active}),
    page({cond:condition({sw1:QUEST_COMPLETE}),gfx:gfx(),list:complete}),
  ]);
}
function installViridianNpc() {
  const map=readRx("Map043.rxdata");
  const events=iv(map,"events");
  events.pairs=events.pairs.filter(([,ev])=>txt(iv(ev,"name"))!==NPC_MARKER);
  const id=Math.max(0,...events.pairs.map(([key])=>Number(key)))+1;
  addEvent(map,viridianNpc(id));
  writeRx("Map043.rxdata",map);
}
function hypnoBattleCommands() {
  return scriptCommands([
    "p=Pokemon.new(:HYPNO,100)",
    "GameData::Stat.each_main { |s| p.iv[s.id]=31 }",
    "p.ev[:HP]=252; p.ev[:SPECIAL_ATTACK]=252; p.ev[:SPECIAL_DEFENSE]=6",
    "p.nature=:MODEST; p.item=:TWISTEDSPOON",
    "p.moves=[]",
    "[:HYPNOSIS,:DREAMEATER,:PSYCHIC,:FOCUSBLAST].each { |m| p.learn_move(m) }",
    "p.calc_stats",
    "setBattleRule(\"cannotRun\"); setBattleRule(\"canLose\")",
    "d=pbWildBattleCore(p)",
    `$game_switches[${HYPNO_SUBDUED}]=true if d==1 || d==4`,
  ]);
}
function forestEvents(mapObj) {
  const events=[];
  events.push(event(1,"Return to Viridian",35,47,[page({through:true,list:[
    ...textCommands(["El sendero regresa a Ciudad Verde."]),
    cmd(102,[[S("Regresar"),S("Seguir aquí")],2]),
    cmd(402,[0,S("Regresar")]),transfer(VIRIDIAN,34,26,2,1),
    cmd(402,[1,S("Seguir aquí")]),cmd(404),cmd(0),
  ]})]));
  const rangerGfx=()=>graphic("trchar009");
  events.push(event(2,"Ranger de rescate",36,46,[
    page({cond:condition({sw1:QUEST_STARTED}),gfx:rangerGfx(),through:true,list:[
      ...textCommands(["Guardabosques: La canción viene del norte. Los niños están inmóviles, pero siguen respirando. Encuentra a Hypno."]),cmd(0),
    ]}),
    page({cond:condition({sw1:HYPNO_SUBDUED}),gfx:rangerGfx(),through:true,list:[
      ...textCommands(["Guardabosques: ¡La hipnosis terminó! Encontramos a los cinco niños y ya avisamos a sus familias."],0),
      ...scriptCommands(["pbReceiveItem(:MASTERBALL)"]),
      setSwitch(QUEST_COMPLETE,true),setSwitch(HORIZONS_OPEN,true),
      ...textCommands(["Has recibido una Master Ball por completar el rescate. Una nueva ruta dimensional se ha estabilizado." ]),cmd(0),
    ]}),
    page({cond:condition({sw1:QUEST_COMPLETE}),gfx:rangerGfx(),through:true,list:[
      ...textCommands(["Guardabosques: Misión cumplida. El guardabosques de Ciudad Verde puede llevarte a Horizontes." ]),cmd(0),
    ]}),
  ]));
  const hypnoGfx=()=>graphic("HYPNO");
  events.push(event(3,"Hypno Lv.100 - Misión",38,11,[
    page({cond:condition({sw1:QUEST_STARTED}),gfx:hypnoGfx(),through:true,list:[
      ...textCommands([
        "Hypno alza su péndulo. La canción del bosque intenta adormecer incluso a tus Pokémon.",
        "Es nivel 100, posee IV perfectos y no permitirá escapar. Puedes derrotarlo o capturarlo.",
      ]),
      ...hypnoBattleCommands(),
      cmd(111,[12,S(`$game_switches[${HYPNO_SUBDUED}]`)]),
      ...textCommands(["El péndulo se detiene. La niebla psíquica desaparece y los niños despiertan."],1),
      cmd(411),...textCommands(["Hypno conserva el control. Puedes recuperarte y volver a intentarlo."],1),cmd(412),cmd(0),
    ]}),
    page({cond:condition({sw1:HYPNO_SUBDUED}),through:true,list:[cmd(0)]}),
  ]));
  const children=[
    [10,"Nora",57,42,"NPC 04","Nora: Soñaba con un jardín amarillo. Gracias por apagar la canción."],
    [11,"Teo",36,40,"NPC 05","Teo: Hypno decía que nadie encontraría este sendero. Se equivocó."],
    [12,"Lía",17,17,"NPC 04","Lía: Mi Pikachu siguió despierto y nos mantuvo juntos."],
    [13,"Bruno",61,33,"NPC 05","Bruno: Marqué los árboles para que todos podamos volver."],
    [14,"Maya",50,11,"NPC 04","Maya: Ya no tengo miedo. Quiero ser guardabosques algún día."],
  ];
  for (const [id,name,x,y,sprite,line] of children) {
    const gfx=()=>graphic(sprite);
    events.push(event(id,`Niño rescatado: ${name}`,x,y,[
      page({cond:condition({sw1:QUEST_STARTED}),gfx:gfx(),through:true,list:[...textCommands([`${name}: ...la canción... no puedo despertar...`]),cmd(0)]}),
      page({cond:condition({sw1:HYPNO_SUBDUED}),gfx:gfx(),through:true,list:[...textCommands([line]),cmd(0)]}),
    ]));
  }
  iv(mapObj,"events").pairs=events.map((ev)=>[Number(iv(ev,"id")),ev]);
}

// ---------------------------------------------------------------------------
// Posiciones transitables y mapas de Horizontes
// ---------------------------------------------------------------------------
const tilesetData=readRx("Tilesets.rxdata");
const tilesets=new Map();
for (let i=1;i<tilesetData.length;i++) if (tilesetData[i]) tilesets.set(i,parseTileset(tilesetData[i]));
function openCell(parsed,tileset,x,y) {
  if (x<1||y<1||x>=parsed.width-1||y>=parsed.height-1) return false;
  let passage=0;
  for (let z=0;z<parsed.table.z;z++) {
    const tile=tableGet(parsed.table,x,y,z);
    if (tile>0&&tile<tileset.passages.data.length) passage|=tileset.passages.data[tile]&0x0f;
  }
  return passage===0;
}
function largestOpenComponent(mapObj) {
  const parsed=parseMap(mapObj),tileset=tilesets.get(parsed.tilesetId);
  const seen=new Set(),components=[];
  for (let y=1;y<parsed.height-1;y++) for (let x=1;x<parsed.width-1;x++) {
    const key=`${x},${y}`; if (seen.has(key)||!openCell(parsed,tileset,x,y)) continue;
    const cells=[],queue=[[x,y]];seen.add(key);
    for (let q=0;q<queue.length;q++) {
      const [cx,cy]=queue[q];cells.push([cx,cy]);
      for (const [nx,ny] of [[cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]]) {
        const nk=`${nx},${ny}`;
        if (!seen.has(nk)&&openCell(parsed,tileset,nx,ny)) {seen.add(nk);queue.push([nx,ny]);}
      }
    }
    components.push(cells);
  }
  components.sort((a,b)=>b.length-a.length);
  return components[0]||[];
}
function spreadPositions(mapObj,count) {
  const cells=largestOpenComponent(mapObj);
  if (cells.length<count) throw new Error(`Componente transitable insuficiente: ${cells.length}/${count}`);
  const chosen=[cells[Math.floor(cells.length/2)]],used=new Set([chosen[0].join(",")]);
  while (chosen.length<count) {
    let best=null,bestScore=-1;
    for (const cell of cells) {
      if (used.has(cell.join(","))) continue;
      const score=Math.min(...chosen.map(([x,y])=>(cell[0]-x)**2+(cell[1]-y)**2));
      if (score>bestScore) {bestScore=score;best=cell;}
    }
    chosen.push(best);used.add(best.join(","));
  }
  return chosen;
}
function portalEvent(id,name,x,y,targetMap,targetX,targetY,message) {
  return event(id,name,x,y,[page({gfx:graphic("Object ball special"),through:true,list:[
    ...textCommands([message]),cmd(102,[[S("Entrar"),S("Quedarme")],2]),
    cmd(402,[0,S("Entrar")]),transfer(targetMap,targetX,targetY,2,1),
    cmd(402,[1,S("Quedarme")]),cmd(404),cmd(0),
  ]})]);
}
function completionCommands(indent=0) {
  return [
    ...scriptCommands([
      `$game_variables[${ADVENTURE_COUNT}]=[$game_variables[${ADVENTURE_COUNT}].to_i+1,500].min`,
      `$game_switches[${ALL_COMPLETE}]=true if $game_variables[${ADVENTURE_COUNT}]>=500`,
    ],indent),
    selfOn("A",indent),
  ];
}
function nodeGraphic(a) {
  if (a.category==="objeto_oculto") return "";
  if (["pokemon_raro","anomalia","pokegod"].includes(a.category)) return "Object ball special";
  return a.trainerSprite;
}
function pokegodSetup(a) {
  return [
    `p=Pokemon.new(:${a.pokemon},100)`,
    `p.name=${JSON.stringify(a.pokegodName)}`,
    "GameData::Stat.each_main { |s| p.iv[s.id]=31 }",
    "p.ev[:HP]=252; p.ev[:SPECIAL_ATTACK]=252; p.ev[:SPEED]=6",
    "p.nature=:MODEST; p.shiny=true",
    "p.moves=[]",
    `[${a.moves.map((move)=>`:${move}`).join(",")}].each { |m| p.learn_move(m) }`,
    "p.calc_stats",
    "setBattleRule(\"cannotRun\"); setBattleRule(\"canLose\")",
    "d=pbWildBattleCore(p)",
  ];
}
function adventureEvent(a,x,y) {
  const g=nodeGraphic(a),first=[];
  first.push(...textCommands([a.title,a.hook]));
  if (a.category==="objeto_oculto") {
    first.push(cmd(111,[12,S(`pbReceiveItem(:${a.item})`)]));
    first.push(...completionCommands(1));
    first.push(cmd(411),...textCommands(["La Mochila está llena. El hallazgo seguirá aquí."],1),cmd(412));
  } else if (["pokemon_raro","anomalia"].includes(a.category)) {
    const call=`pbWildBattle(:${a.pokemon},${a.level},1,false,true)`;
    first.push(cmd(111,[12,S(call)]),...completionCommands(1),cmd(411));
    first.push(...textCommands(["La anomalía permanece. Puedes recuperarte y volver a intentarlo."],1),cmd(412));
  } else if (a.category==="pokegod") {
    first.push(...scriptCommands(pokegodSetup(a)));
    first.push(cmd(111,[12,S("d==1 || d==4")]),...completionCommands(1),cmd(411));
    first.push(...textCommands(["El altar sigue activo. La prueba puede repetirse cuando estés preparado."],1),cmd(412));
  } else if (a.category==="entrenador") {
    const call=`pbTrainerBattle(:${a.trainerType},${JSON.stringify(a.trainerName)},nil,false,0,true)`;
    first.push(...scriptCommands([`pbTrainerIntro(:${a.trainerType})`]));
    first.push(cmd(111,[12,S(call)]),...completionCommands(1),cmd(411));
    first.push(...textCommands(["El especialista te anima a recuperarte antes de volver a intentarlo."],1),cmd(412));
    first.push(...scriptCommands(["pbTrainerEnd"]));
  } else if (a.category==="acertijo") {
    first.push(...textCommands([`El mecanismo pregunta: ¿qué mantiene unido a ${a.realm}?`]));
    first.push(cmd(102,[[S("Cooperación"),S("Fuerza sin control")],2]));
    first.push(cmd(402,[0,S("Cooperación")]),...scriptCommands([`pbReceiveItem(:${a.item})`],1),...completionCommands(1));
    first.push(cmd(402,[1,S("Fuerza sin control")]),...textCommands(["El mecanismo se apaga. Puedes pensar y probar otra vez."],1),cmd(404));
  } else {
    first.push(...completionCommands());
  }
  first.push(cmd(0));
  const done=[...textCommands([`Registro ${a.id}/500 completado: ${a.title}.`]),cmd(0)];
  const gfx=()=>graphic(g);
  return event(a.slot+99,`Horizonte ${String(a.id).padStart(3,"0")}: ${a.title}`,x,y,[
    page({gfx:gfx(),through:true,alwaysTop:a.category==="objeto_oculto",list:first}),
    page({cond:condition({self:"A"}),gfx:gfx(),through:true,alwaysTop:a.category==="objeto_oculto",list:done}),
  ]);
}
function progressNpc(id,x,y) {
  const gfx=()=>graphic("trchar028");
  return event(id,"Cronista 500 Horizontes",x,y,[
    page({gfx:gfx(),through:true,list:[...textCommands(["Cronista: Tu atlas registra \\v[101] de 500 aventuras. Cada señal completada queda estable para siempre." ]),cmd(0)]}),
    page({cond:condition({sw1:ALL_COMPLETE}),gfx:gfx(),through:true,list:[
      ...textCommands(["Cronista: ¡Has completado las 500 aventuras! Los veinte Horizontes reconocen tu viaje." ]),
      ...scriptCommands(["pbReceiveItem(:MASTERBALL)"]),selfOn("B"),cmd(0),
    ]}),
    page({cond:condition({self:"B"}),gfx:gfx(),through:true,list:[...textCommands(["Cronista: El Atlas de los 500 Horizontes está completo. Siempre podrás regresar." ]),cmd(0)]}),
  ]);
}
function makeRealmMap(realm,hubSpawns) {
  const mapObj=readRx(`Map${pad3(realm.template)}.rxdata`);
  const isHub=realm.mapId===HUB;
  const required=isHub?48:28;
  const positions=spreadPositions(mapObj,required);
  const spawn=positions[0],exit=positions[1];
  const events=[];
  if (isHub) {
    events.push(portalEvent(1,"Return to Viridian",exit[0],exit[1],VIRIDIAN,34,26,"Este faro regresa a Ciudad Verde."));
    let p=2;
    for (const target of realms.filter((r)=>r.mapId!==HUB)) {
      const targetSpawn=hubSpawns.get(target.mapId);
      const pos=positions[p++];
      events.push(portalEvent(p-1,`Gate: ${target.name}`,pos[0],pos[1],target.mapId,targetSpawn[0],targetSpawn[1],`La puerta conduce a ${target.name}.`));
    }
    const pos=positions[p++];events.push(progressNpc(50,pos[0],pos[1]));
    const nodePositions=positions.slice(p,p+25);
    for (const [i,a] of adventures.filter((x)=>x.mapId===realm.mapId).entries()) events.push(adventureEvent(a,...nodePositions[i]));
  } else {
    events.push(portalEvent(1,"Return to Puerto Horizonte",exit[0],exit[1],HUB,hubSpawns.get(HUB)[0],hubSpawns.get(HUB)[1],"La ruta estable vuelve a Puerto Horizonte."));
    const nodePositions=positions.slice(2,27);
    for (const [i,a] of adventures.filter((x)=>x.mapId===realm.mapId).entries()) events.push(adventureEvent(a,...nodePositions[i]));
  }
  iv(mapObj,"events").pairs=events.map((ev)=>[Number(iv(ev,"id")),ev]);
  return {mapObj,spawn};
}
function installMaps() {
  // Calcular primero las posiciones de llegada de todos los mapas.
  const hubSpawns=new Map();
  for (const realm of realms) {
    const mapObj=readRx(`Map${pad3(realm.template)}.rxdata`);
    hubSpawns.set(realm.mapId,realm.mapId===HUB ? [34,23] : spreadPositions(mapObj,1)[0]);
  }
  for (const realm of realms) {
    const {mapObj}=makeRealmMap(realm,hubSpawns);
    writeRx(`Map${pad3(realm.mapId)}.rxdata`,mapObj);
  }
  const forest=readRx("Map081.rxdata"); forestEvents(forest); writeRx("Map1000.rxdata",forest);
}

// ---------------------------------------------------------------------------
// MapInfos, metadatos y entrenadores
// ---------------------------------------------------------------------------
function mapInfo(name,parent,order) {
  return new RObject("RPG::MapInfo", [
    ["@scroll_x",512],["@name",S(name)],["@expanded",false],["@order",order],
    ["@parent_id",parent],["@scroll_y",384],
  ]);
}
function installMapInfos() {
  const infos=readRx("MapInfos.rxdata");
  const ids=new Set(NEW_MAP_IDS);
  infos.pairs=infos.pairs.filter(([key])=>!ids.has(Number(key)));
  let order=Math.max(0,...infos.pairs.map(([,obj])=>Number(iv(obj,"order")||0)))+1;
  infos.pairs.push([FOREST,mapInfo("Whisperwood Rescue Forest",VIRIDIAN,order++)]);
  for (const realm of realms) infos.pairs.push([realm.mapId,mapInfo(realm.name,realm.mapId===HUB?48:HUB,order++)]);
  writeRx("MapInfos.rxdata",infos);
}
function installMetadata() {
  const metadata=readRx("map_metadata.dat");
  const ids=new Set(NEW_MAP_IDS);
  metadata.pairs=metadata.pairs.filter(([key])=>!ids.has(Number(key)));
  const byId=new Map(metadata.pairs.map(([key,obj])=>[Number(key),obj]));
  const forestMeta=cloneMarshal(byId.get(81));
  metadata.pairs.push([FOREST,forestMeta]);
  for (let i=0;i<realms.length;i++) {
    const realm=realms[i],meta=cloneMarshal(byId.get(realm.template) || byId.get(973));
    // Región 9 es el contenedor seguro de áreas dimensionales y usa (0,0).
    // No inventamos coordenadas fuera del gráfico compilado del Town Map.
    meta.setIvar("town_map_position",[9,0,0]);
    metadata.pairs.push([realm.mapId,meta]);
  }
  writeRx("map_metadata.dat",metadata);
}
function dataSymbols(file) {
  const data=readRx(file),out=new Set();
  for (const [key] of data.pairs) if (key instanceof RSymbol) out.add(key.name);
  return out;
}
function trainerKeyMatches(key,a) {
  return Array.isArray(key)&&sym(key[0])===a.trainerType&&txt(key[1])===a.trainerName&&Number(key[2])===0;
}
function trainerPokemon(species,level) {
  return new RHash([[Sym("species"),Sym(species)],[Sym("level"),level]]);
}
function trainerObject(a,id) {
  const key=[Sym(a.trainerType),S(a.trainerName),0];
  return new RObject("GameData::Trainer", [
    ["@id",key],["@id_number",id],["@trainer_type",key[0]],["@real_name",key[1]],["@version",0],
    ["@items",[Sym("FULLRESTORE"),Sym("FULLRESTORE")]],["@real_lose_text",S(`${a.trainerName}: Gran combate. El Horizonte queda registrado.`)],
    ["@numpkmn",0],["@guara",0],["@pokemon",a.team.map((sp,k)=>trainerPokemon(sp,Math.min(100,84+((a.id+k)%17))))],
  ]);
}
function installTrainers() {
  const trainerAdventures=adventures.filter((a)=>a.category==="entrenador");
  const species=dataSymbols("species.dat"),types=dataSymbols("trainer_types.dat");
  for (const a of trainerAdventures) {
    if (!types.has(a.trainerType)) throw new Error(`Tipo inexistente ${a.trainerType}`);
    for (const sp of a.team) if (!species.has(sp)) throw new Error(`Especie inexistente ${sp}`);
  }
  const trainers=readRx("trainers.dat");
  let next=Math.max(-1,...trainers.pairs.filter(([key])=>typeof key==="number").map(([key])=>key))+1;
  for (const a of trainerAdventures) {
    if (trainers.pairs.some(([key])=>trainerKeyMatches(key,a))) continue;
    const obj=trainerObject(a,next); const key=iv(obj,"id");
    trainers.pairs.push([next,obj],[key,obj]);next++;
  }
  writeRx("trainers.dat",trainers);
}

// ---------------------------------------------------------------------------
// Verificación integral
// ---------------------------------------------------------------------------
function verify() {
  const errors=[],ok=(v,m)=>{if(!v)errors.push(m);};
  ok(adventures.length===500,"el catálogo no contiene 500 aventuras");
  ok(new Set(adventures.map((a)=>a.title)).size===500,"hay títulos repetidos en el catálogo");
  const system=readRx("System.rxdata"),switches=iv(system,"switches"),variables=iv(system,"variables");
  ok(txt(switches[QUEST_STARTED]).includes("HYPNO"),"falta flag de inicio de Hypno");
  ok(txt(switches[ALL_COMPLETE]).includes("500"),"falta flag final 500");
  ok(txt(variables[ADVENTURE_COUNT]).includes("HORIZONS"),"falta contador de aventuras");
  const infos=readRx("MapInfos.rxdata");
  for (const id of NEW_MAP_IDS) {
    ok(infos.pairs.some(([key])=>Number(key)===id),`MapInfos no registra ${id}`);
    ok(fs.existsSync(path.join(DATA,`Map${pad3(id)}.rxdata`)),`falta Map${pad3(id)}.rxdata`);
  }
  const viridian=readRx("Map043.rxdata");
  const ranger=iv(viridian,"events").pairs.find(([,ev])=>txt(iv(ev,"name"))===NPC_MARKER)?.[1];
  ok(!!ranger,"falta NPC de Ciudad Verde");
  if (ranger) {
    ok(Number(iv(ranger,"x"))===34&&Number(iv(ranger,"y"))===25,"NPC de Ciudad Verde movido");
    ok((iv(ranger,"pages")||[]).some((pg)=>Number(iv(iv(pg,"condition"),"switch1_id"))===POSTGAME),"NPC no está limitado al postgame");
  }
  const forest=readRx("Map1000.rxdata");
  const forestEvents=iv(forest,"events").pairs.map(([,ev])=>ev);
  const hypno=forestEvents.find((ev)=>txt(iv(ev,"name")).includes("Hypno Lv.100"));
  const hypnoCode=hypno?commandsOf(hypno).map((c)=>txt(iv(c,"parameters")?.[0])).join("\n"):"";
  ok(!!hypno,"falta Hypno de misión");
  ok(hypnoCode.includes("Pokemon.new(:HYPNO,100)"),"Hypno no es nivel 100");
  ok(hypnoCode.includes("p.iv[s.id]=31"),"Hypno no tiene IV perfectos");
  for (const move of ["HYPNOSIS","DREAMEATER","PSYCHIC","FOCUSBLAST"]) ok(hypnoCode.includes(move),`Hypno no conoce ${move}`);
  ok(hypnoCode.includes("d==1 || d==4"),"la misión no acepta derrotar o capturar a Hypno");
  ok(forestEvents.filter((ev)=>txt(iv(ev,"name")).startsWith("Niño rescatado")).length===5,"no hay cinco niños");

  let nodeCount=0,returnCount=0,pokegodCount=0;
  const characterDir=path.join(GAME,"Graphics","Characters");
  for (const realm of realms) {
    const map=readRx(`Map${pad3(realm.mapId)}.rxdata`),events=iv(map,"events").pairs.map(([,ev])=>ev);
    const nodes=events.filter((ev)=>txt(iv(ev,"name")).startsWith("Horizonte "));
    nodeCount+=nodes.length;
    ok(nodes.length===25,`${realm.name} tiene ${nodes.length}/25 aventuras`);
    if (events.some((ev)=>txt(iv(ev,"name")).startsWith("Return"))) returnCount++;
    const parsed=parseMap(map),tileset=tilesets.get(parsed.tilesetId);
    for (const ev of events) {
      const x=Number(iv(ev,"x")),y=Number(iv(ev,"y"));
      ok(x>=0&&y>=0&&x<parsed.width&&y<parsed.height,`${realm.name}: evento fuera del mapa`);
      if (txt(iv(ev,"name")).startsWith("Horizonte ")) {
        const commands=commandsOf(ev);
        const self=commands.find((c)=>Number(iv(c,"code"))===123);
        ok(self&&Number(iv(self,"parameters")[1])===0,`${txt(iv(ev,"name"))}: self-switch incorrecto`);
        const ruby=commands.filter((c)=>[111,355,655].includes(Number(iv(c,"code"))))
          .map((c)=>txt(iv(c,"parameters")?.[Number(iv(c,"code"))===111?1:0])).join("\n");
        ok(!/:\w+:/.test(ruby),`${txt(iv(ev,"name"))}: símbolo Ruby mal formado`);
        if (ruby.includes("pbWildBattleCore(p)")) {
          pokegodCount++;
          ok(ruby.includes("p.iv[s.id]=31")&&ruby.includes("d==1 || d==4"),
            `${txt(iv(ev,"name"))}: Pokégod sin IV/captura válidos`);
        }
      }
      for (const pg of iv(ev,"pages")||[]) {
        const char=txt(iv(iv(pg,"graphic"),"character_name"));
        if (char) ok(fs.existsSync(path.join(characterDir,`${char}.png`)),`${realm.name}: sprite ausente ${char}`);
      }
    }
  }
  ok(nodeCount===500,`se instalaron ${nodeCount}/500 aventuras`);
  ok(returnCount===20,"no todos los lugares tienen retorno");
  ok(pokegodCount===20,`se instalaron ${pokegodCount}/20 manifestaciones Pokégod`);

  // Toda transferencia añadida debe terminar en una celda abierta. También se
  // comprueba el número para garantizar bosque, hub, 19 puertas y retornos.
  const sourceEvents=[ranger,...forestEvents];
  for (const realm of realms) {
    const map=readRx(`Map${pad3(realm.mapId)}.rxdata`);
    // Atlas Mil añade puertas al hub 1001 después de Horizontes. No forman
    // parte de las 44 transferencias que este instalador debe auditar.
    sourceEvents.push(...iv(map,"events").pairs.map(([,ev])=>ev)
      .filter((ev)=>!txt(iv(ev,"name")).startsWith("PokeMod Atlas Mil:")));
  }
  const targetMaps=new Map();
  let transferCount=0;
  for (const ev of sourceEvents.filter(Boolean)) for (const c of commandsOf(ev)) {
    if (Number(iv(c,"code"))!==201) continue;
    const p=iv(c,"parameters"); if (Number(p[0])!==0) continue;
    transferCount++;
    const targetId=Number(p[1]),x=Number(p[2]),y=Number(p[3]);
    if (!targetMaps.has(targetId)) targetMaps.set(targetId,readRx(`Map${pad3(targetId)}.rxdata`));
    const target=targetMaps.get(targetId),parsed=parseMap(target),tileset=tilesets.get(parsed.tilesetId);
    ok(openCell(parsed,tileset,x,y),`transferencia a celda bloqueada: ${targetId} (${x},${y})`);
  }
  ok(transferCount===44,`se esperaban 44 transferencias aditivas; hay ${transferCount}`);

  const trainers=readRx("trainers.dat");
  const trainerAdventures=adventures.filter((a)=>a.category==="entrenador");
  ok(trainerAdventures.length===100,`el catálogo tiene ${trainerAdventures.length}/100 entrenadores`);
  for (const a of trainerAdventures) {
    const pair=trainers.pairs.find(([key])=>trainerKeyMatches(key,a));
    ok(!!pair,`falta entrenador ${a.trainerName}`);
    if (pair) ok((iv(pair[1],"pokemon")||[]).length===6,`${a.trainerName} no tiene seis Pokémon`);
  }
  const metadata=readRx("map_metadata.dat");
  for (const id of NEW_MAP_IDS) ok(metadata.pairs.some(([key])=>Number(key)===id),`faltan metadatos ${id}`);
  if (errors.length) throw new Error(`Verificación fallida (${errors.length}):\n- ${errors.slice(0,100).join("\n- ")}`);
  console.log(`Verificación OK: misión Hypno, ${NEW_MAP_IDS.length} mapas, ${nodeCount} aventuras, 100 entrenadores y retorno libre.`);
}

if (!VERIFY) {
  backupAffected();
  installSystemFlags();
  installViridianNpc();
  installTrainers();
  installMapInfos();
  installMetadata();
  installMaps();
  console.log(`Horizontes instalado. Originales: ${path.relative(ROOT,BACKUP)}`);
}
verify();
