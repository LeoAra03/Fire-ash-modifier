#!/usr/bin/env node
/** Genera el plan de 1.000 mapas y 500 eventos/combates no redundantes. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalLoad, RString, RSymbol } from "../web/js/marshal.js";
import { mapListFromInfos, parseMap, parseEvent, parseTileset, tableGet, cmdOf, rstr } from "../web/js/rmxp.js";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const DATA=path.join(ROOT,"pokemon_fire_ash","Data");
const read=(f)=>marshalLoad(fs.readFileSync(path.join(DATA,f)));
const text=(v)=>v instanceof RString?v.text:String(v??"");
const symbol=(v)=>v instanceof RSymbol?v.name:String(v??"");
const pad3=(n)=>String(n).padStart(3,"0");
const oldCatalog=JSON.parse(fs.readFileSync(path.join(ROOT,"content","horizontes_500.json"),"utf8"));

const sectorNames=[
  "Meridiano Ámbar","Cuenca Celeste","Frontera Carmesí","Distrito Cuarzo","Órbita Esmeralda",
  "Paso Boreal","Jardín Índigo","Costa Prisma","Dominio Solar","Velo Lunar",
  "Nexo Onírico","Valle Magnético","Arco Fósil","Mar de Nubes","Bosque de Hierro",
  "Canal Estelar","Páramo Sonoro","Islas del Viento","Anillo Abisal","Ruta del Cometa",
  "Territorio Origami","Delta de Cristal","Llanura Meteoro","Cordillera Coral","Ciudad del Eclipse",
  "Archipiélago Vapor","Santuario de Polen","Cañón Espejo","Bahía Relámpago","Meseta de Tinta",
  "Reserva de Engranajes","Círculo de Ceniza","Labertino Boreal","República de Musgo","Cinturón Aurora",
  "Trinchera de Luz","Provincia del Eco","Horizonte Fractal","Corona de Bruma","Umbral Mil",
];
const factions=[
  "Vigías Ámbar","Navegantes Celestes","Custodios Carmesí","Canteros Cuarzo","Botánicos Esmeralda",
  "Patrulla Boreal","Tejedores Índigo","Ópticos Prisma","Heraldos Solares","Cartógrafos Lunares",
  "Médicos del Sueño","Ingenieros Magnéticos","Paleontólogos Libres","Pilotos de Nube","Forjadores Verdes",
  "Astrónomos del Canal","Músicos del Páramo","Mensajeros del Viento","Buzos Abisales","Rastreadores Cometa",
  "Plegadores del Territorio","Mineros Delta","Meteorólogos Errantes","Biólogos Coral","Cronistas Eclipse",
  "Mecánicos Vapor","Guardianes de Polen","Reflejo Nómada","Técnicos Relámpago","Ilustradores de Tinta",
  "Relojeros de Reserva","Bomberos de Ceniza","Guías Boreales","Consejo de Musgo","Pintores Aurora",
  "Fareros de Luz","Oyentes del Eco","Geómetras Fractales","Pastores de Bruma","Archiveros del Mil",
];
const motifs=[
  "La baliza que cambió de dueño","El duelo sin espectadores","La patrulla de seis sombras","Una señal bajo la piedra",
  "El torneo de una sola ronda","La cápsula llegada sin remitente","El juramento del especialista","El rugido detrás del clima",
  "La expedición que perdió su norte","Un fósil con pulso","El transmisor de voces futuras","La guardia del puente móvil",
  "El desafío de dos compañeros","La especie que olvidó su hábitat","El archivo que no debía abrirse","La carrera contra la marea",
  "La campeona sin medallas","El centinela de la ruta inversa","La noche de los objetos despiertos","La estación que saltó un día",
  "El combate de relevos","La grieta de energía contenida","El pacto entre facciones","El mensaje cifrado del guardián",
  "La última prueba del sector",
];
const roles=[
  "capitana","geólogo","agente de campo","ingeniera","árbitro","mensajera","especialista","climatólogo","exploradora",
  "paleontóloga","radioaficionado","guardiana","entrenador doble","ecóloga","archivero","socorrista","campeona","centinela",
  "anticuario","cronista","estratega","técnica","diplomático","criptógrafa","custodio",
];
const categories=[
  "jefe_faccion","duelo_especialista","supervivencia","evento_artefacto","jefe_faccion",
  "evento_artefacto","duelo_especialista","pokemon_elite","supervivencia","pokemon_elite",
  "evento_decision","jefe_faccion","combate_doble","pokemon_elite","evento_decision",
  "supervivencia","duelo_especialista","jefe_faccion","evento_artefacto","pokemon_elite",
  "combate_doble","pokemon_elite","duelo_especialista","evento_decision","jefe_faccion",
];
const items=["RARECANDY","PPMAX","MAXREVIVE","FULLRESTORE","MAXELIXIR","BIGNUGGET","ABILITYCAPSULE","BOTTLECAP","COMETSHARD","STARPIECE","LIFEORB","LEFTOVERS","FOCUSSASH","CHOICEBAND","CHOICESPECS","CHOICESCARF","ASSAULTVEST","EXPCANDYXL","DUSKSTONE","DAWNSTONE","SHINYSTONE","MOONSTONE","SUNSTONE","FIRESTONE","WATERSTONE"];
const trainerTypes=[
  ["COOLTRAINER_M","trchar007"],["COOLTRAINER_F","trchar008"],["SCIENTIST","trchar246"],
  ["POKEMONRANGER_M","trchar009"],["POKEMONRANGER_F","trchar016"],["PSYCHIC_M","trchar028"],
  ["PSYCHIC_F","trchar069"],["BLACKBELT","trchar011"],["AROMALADY","trchar017"],["POKEMONBREEDER","trchar021"],
];
const moves=["PSYCHIC","SHADOWBALL","FOCUSBLAST","ENERGYBALL","THUNDERBOLT","ICEBEAM","FLAMETHROWER","SURF","EARTHQUAKE","STONEEDGE","DRAGONPULSE","DARKPULSE","FLASHCANNON","SLUDGEBOMB","MOONBLAST","AURASPHERE","HYPERBEAM","GIGAIMPACT","DAZZLINGGLEAM","PROTECT"];

// Seleccionar 1.000 plantillas distintas cuya mayor zona abierta tenga al menos
// 6 celdas, evitando mapas puramente cinematográficos o vacíos.
const tilesetRaw=read("Tilesets.rxdata"),tilesets=new Map();
for(let i=1;i<tilesetRaw.length;i++)if(tilesetRaw[i])tilesets.set(i,parseTileset(tilesetRaw[i]));
function openCell(parsed,tileset,x,y){
  if(x<1||y<1||x>=parsed.width-1||y>=parsed.height-1)return false;let p=0;
  for(let z=0;z<parsed.table.z;z++){const t=tableGet(parsed.table,x,y,z);if(t>0&&t<tileset.passages.data.length)p|=tileset.passages.data[t]&15;}
  return p===0;
}
function componentSize(mapObj){
  const p=parseMap(mapObj),t=tilesets.get(p.tilesetId),seen=new Set();let best=0;
  for(let y=1;y<p.height-1;y++)for(let x=1;x<p.width-1;x++){
    const k=`${x},${y}`;if(seen.has(k)||!openCell(p,t,x,y))continue;
    const q=[[x,y]];seen.add(k);
    for(let j=0;j<q.length;j++){const[c,d]=q[j];for(const[n,m]of[[c+1,d],[c-1,d],[c,d+1],[c,d-1]]){const h=`${n},${m}`;if(!seen.has(h)&&openCell(p,t,n,m)){seen.add(h);q.push([n,m]);}}}
    if(q.length>best)best=q.length;
  }return best;
}
const infos=mapListFromInfos(read("MapInfos.rxdata")),nameById=new Map(infos.map((x)=>[x.id,x.name]));
const sources=[];
for(let id=1;id<=1020&&sources.length<1000;id++){
  const file=`Map${pad3(id)}.rxdata`;if(!fs.existsSync(path.join(DATA,file)))continue;
  if(componentSize(read(file))>=6)sources.push(id);
}
if(sources.length!==1000)throw new Error(`Solo se hallaron ${sources.length}/1000 plantillas transitables`);
const maps=sources.map((sourceId,i)=>({
  index:i+1,newId:1021+i,sourceId,sourceName:nameById.get(sourceId)||`Mapa ${sourceId}`,
  sector:Math.floor(i/25)+1,sectorName:sectorNames[Math.floor(i/25)],
  name:`Atlas ${String(i+1).padStart(4,"0")} - ${nameById.get(sourceId)||`Mapa ${sourceId}`}`,
}));

function records(file){
  const data=read(file),out=[];
  for(const[key,obj]of data.pairs)if(key instanceof RSymbol){
    const formName=text(obj?.getIvar?.("real_form_name"));
    out.push({id:key.name,number:Number(obj?.getIvar?.("id_number")??999999),form:Number(obj?.getIvar?.("form")??0),
      name:text(obj?.getIvar?.("real_name"))||key.name,formName,base:symbol(obj?.getIvar?.("species"))});
  }
  return out;
}
const oldPokemon=new Set(oldCatalog.adventures.map((a)=>a.pokemon));
const speciesAll=records("species.dat").filter((s)=>s.id!=="NONE").sort((a,b)=>a.number-b.number||a.form-b.form||a.id.localeCompare(b.id));
const candidates=speciesAll.filter((s)=>!oldPokemon.has(s.id));
if(candidates.length<500)throw new Error(`Solo hay ${candidates.length} Pokémon no usados; se necesitan 500`);
const itemIds=new Set(records("items.dat").map((x)=>x.id)),moveIds=new Set(records("moves.dat").map((x)=>x.id));
for(const i of items)if(!itemIds.has(i))throw new Error(`Objeto inexistente ${i}`);
for(const m of moves)if(!moveIds.has(m))throw new Error(`Movimiento inexistente ${m}`);

const suggestions=[];
for(let i=0;i<500;i++){
  const map=maps[i],slot=i%25,sector=map.sector-1,pk=candidates[i],category=categories[slot];
  const trainer=trainerTypes[(sector+slot)%trainerTypes.length],item=items[(i*7+slot)%items.length];
  const display=pk.formName?`${pk.name} (${pk.formName})`:pk.name;
  let hook;
  if(category==="combate_doble")hook=`${roles[slot]} propone en ${map.name} una batalla doble con posiciones cambiantes; exige dos Pokémon utilizables y coordinación, no fuerza bruta.`;
  else if(category==="pokemon_elite")hook=`Una señal inédita de ${map.name} despierta a ${display} con IV perfectos y cuatro técnicas de cobertura. Puede ser contenido o capturado sin cerrar la ruta.`;
  else if(category==="evento_artefacto")hook=`${roles[slot]} encontró en ${map.name} un artefacto relacionado con ${display}. Elegir cómo restaurarlo decide el diálogo y revela ${item}.`;
  else if(category==="evento_decision")hook=`En ${map.name}, dos facciones disputan la custodia de ${display}. El jugador media mediante una decisión reversible antes de registrar la solución.`;
  else if(category==="supervivencia")hook=`Una tormenta aisló al equipo de ${roles[slot]} en ${map.name}. Supera un combate de resistencia de seis Pokémon para reactivar la baliza de retorno.`;
  else if(category==="duelo_especialista")hook=`${roles[slot]} de ${map.name} estudió un estilo no utilizado en Horizontes y desafía al jugador con seis especies y coberturas exclusivas.`;
  else hook=`La facción ${factions[sector]} protege en ${map.name} información sobre ${display}. Su líder ofrece un combate amistoso para decidir quién conserva el registro.`;
  const team=[pk.id];
  for(let k=0;team.length<6;k++){
    const teammate=speciesAll[(700+i*11+k*37)%speciesAll.length].id;
    if(!team.includes(teammate))team.push(teammate);
  }
  const trName=`A${String(i+1).padStart(3,"0")} ${roles[slot]}`;
  suggestions.push({
    id:i+1,mapId:map.newId,mapName:map.name,sector:map.sector,sectorName:map.sectorName,
    title:`${motifs[slot]} — ${map.name}`,category,npc:`${roles[slot]} de ${map.sectorName}`,
    hook,pokemon:pk.id,pokemonName:display,item,level:86+((i*13)%15),
    trainerType:trainer[0],trainerSprite:trainer[1],trainerName:trName,team,
    doubleBattle:category==="combate_doble",moves:Array.from({length:4},(_,k)=>moves[(i+5*k)%moves.length]),
    flag:`Mapa ${map.newId} / evento 100 / self-switch A`,implemented:true,
  });
}
const oldTitles=new Set(oldCatalog.adventures.map((a)=>a.title)),oldHooks=new Set(oldCatalog.adventures.map((a)=>a.hook));
// Comparación exacta adicional contra todos los nombres y diálogos de mapas
// anteriores a Atlas (1-1020), no solo contra el catálogo de Horizontes.
const baseText=new Set();
for(const info of infos.filter((x)=>x.id<=1020)){
  const file=`Map${pad3(info.id)}.rxdata`;if(!fs.existsSync(path.join(DATA,file)))continue;
  const parsed=parseMap(read(file));
  for(const {obj} of parsed.events){
    const ev=parseEvent(obj);baseText.add(ev.name);
    for(const pg of ev.pages)for(const raw of pg.list||[]){const c=cmdOf(raw);if(c.code===101||c.code===401)baseText.add(rstr(c.params[0]));}
  }
}
const unique=(field)=>new Set(suggestions.map((x)=>x[field])).size===suggestions.length;
for(const field of ["title","hook","pokemon","flag"]) if(!unique(field)) {
  const seen=new Set(),dupes=[];for(const x of suggestions){if(seen.has(x[field]))dupes.push(x[field]);seen.add(x[field]);}
  throw new Error(`Redundancia interna en ${field}: ${dupes.slice(0,5).join(" | ")}`);
}
if(suggestions.some((x)=>oldTitles.has(x.title)||oldHooks.has(x.hook)||oldPokemon.has(x.pokemon)))throw new Error("El Atlas repite contenido de Horizontes");
if(suggestions.some((x)=>baseText.has(x.title)||baseText.has(x.hook)))throw new Error("Una propuesta Atlas ya existe literalmente en los mapas 1-1020");
const trainerSuggestions=suggestions.filter((x)=>!x.category.startsWith("evento_")&&!x.category.includes("pokemon"));
if(new Set(trainerSuggestions.map((x)=>x.team.join("|"))).size!==trainerSuggestions.length)throw new Error("Equipos repetidos");
const priorTeamSignatures=new Set();
for(const [key,tr] of read("trainers.dat").pairs){
  if(typeof key!=="number"||/^A\d{3} /.test(text(tr.getIvar("real_name"))))continue;
  const team=(tr.getIvar("pokemon")||[]).map((pk)=>symbol(pk.pairs.find(([k])=>symbol(k)==="species")?.[1])).join("|");
  if(team)priorTeamSignatures.add(team);
}
if(trainerSuggestions.some((x)=>priorTeamSignatures.has(x.team.join("|"))))throw new Error("Un equipo Atlas duplica exactamente un equipo anterior");

const out={version:1,description:"Atlas Mil: 1.000 mapas y 500 eventos/peleas no redundantes",sectors:sectorNames.map((name,i)=>({id:i+1,name,faction:factions[i]})),maps,suggestions};
const outJson=path.join(ROOT,"content","atlas_mil_500.json"),outMd=path.join(ROOT,"docs","500_EVENTOS_Y_PELEAS_ATLAS_MIL.md");
fs.writeFileSync(outJson,JSON.stringify(out,null,2));
const lines=["# Atlas Mil: 500 eventos y peleas nuevas","",`Estas 500 propuestas se compararon con las 500 de Horizontes. No repiten título, gancho, Pokémon principal, flag ni equipo. Todas están marcadas como \`implemented: true\` y se instalan en mapas 1021–1520.`,""];
for(const sector of out.sectors.slice(0,20)){
  lines.push(`## Sector ${sector.id}: ${sector.name}`,"",`Facción: **${sector.faction}**`,"");
  for(const s of suggestions.filter((x)=>x.sector===sector.id))lines.push(`### ${s.id}. ${s.title}`,"",`- **Tipo:** ${s.category}`,`- **NPC:** ${s.npc}`,`- **Pokémon principal:** ${s.pokemonName} (${s.pokemon})`,`- **Equipo:** ${s.team.join(", ")}`,`- **Recompensa:** ${s.item}`,`- **Flag:** ${s.flag}`,`- **Propuesta aplicada:** ${s.hook}`,"");
}
fs.writeFileSync(outMd,lines.join("\n"));
console.log(`Atlas generado: ${maps.length} mapas, ${suggestions.length} eventos/peleas, sin redundancia con Horizontes.`);
console.log(path.relative(ROOT,outJson));console.log(path.relative(ROOT,outMd));
