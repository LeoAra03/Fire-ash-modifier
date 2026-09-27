#!/usr/bin/env node
/**
 * Pipeline narrativo de Atlas Mil.
 * - Clasifica 1.000 mapas en Tier 1/2/3.
 * - Genera seeds y paquetes de contexto para los 40 mapas Tier 1.
 * - Audita blueprints JSON y emite prompts de revisión por fallo.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalLoad,RSymbol } from "../web/js/marshal.js";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const DATA=path.join(ROOT,"pokemon_fire_ash","Data");
const catalog=JSON.parse(fs.readFileSync(path.join(ROOT,"content","atlas_mil_500.json"),"utf8"));
const masterPrompt=fs.readFileSync(path.join(ROOT,"docs","PROMPT_MAESTRO_TIER1.md"),"utf8");
const read=(f)=>marshalLoad(fs.readFileSync(path.join(DATA,f)));
const sym=(v)=>v instanceof RSymbol?v.name:String(v??"");

const crossovers=[
  ["Pokémon Adventures","TCG","radio de Pueblo Lavanda"],["The Electric Tale of Pikachu","anime clásico","torneos escolares"],
  ["Pokémon Origins","archivos de Oak","Liga prototipo"],["Mystery Dungeon","gremios","expediciones"],
  ["Pokémon Ranger","rescate","ecología"],["Colosseum/XD","Orre","rehabilitación oscura"],
  ["Pokémon Conquest","clanes","táctica"],["Pokémon Snap","fotografía","conducta natural"],
  ["PokéPark","festival","pruebas amistosas"],["Pokémon TCG","cartas memoria","duelo ritual"],
  ["Pokémon Masters EX","parejas compi","what-if"],["Pokémon Unite","deporte","objetivos"],
  ["Pokémon GO","investigación comunitaria","señales remotas"],["Pokémon Rumble","juguetes","identidad"],
  ["Trozei/Picross","lógica visual","cifrado"],["Café Remix","comunidad","conflicto cotidiano"],
  ["Detective Pikachu","misterio","testigos"],["Legends: Arceus","distorsión","expedición histórica"],
  ["Scarlet/Violet","paradojas","ecología"],["Infinite Fusion","identidad fusionada","ética"],
  ["Uranium (homenaje)","energía peligrosa","restauración"],["Insurgence (homenaje)","propaganda","libre elección"],
  ["Reborn (homenaje)","reconstrucción urbana","consecuencia social"],["Rejuvenation (homenaje)","memoria temporal","familia"],
  ["Unbound (homenaje)","portales","contrabando"],["Gaia (homenaje)","arqueología","civilización"],
  ["Prism (homenaje)","minería","responsabilidad"],["Glazed (homenaje)","sueño","dimensiones"],
  ["Light Platinum (homenaje)","ligas","diplomacia"],["Radical Red (homenaje)","estrategia","contrajuego"],
  ["mito de Lavender","horror sonoro","duelo"],["Lost Silver (homenaje no gráfico)","memoria","identidad"],
  ["cartucho negro","fantasma","decisión"],["Buried Alive (mito)","arqueología falsa","explicación Pokémon"],
  ["nieve de Mt. Silver","aislamiento","rescate"],["MissingNo.","datos rotos","estabilización"],
  ["Pale Luna","acertijo","contrajuego justo"],["Strangled Red (reinterpretación)","culpa","reconciliación"],
  ["Archiveros del Último Guardado","facción original","memoria segura"],["convergencia all-star","campeones","Pokégods"],
];
const tones=["íntimo y supersticioso","rápido y bromista","documental y contenido","cálido y gremial","operativo y compasivo","seco y redentor","ceremonial y táctico","observador y paciente","festivo con melancolía","ritual y preciso","carismático y competitivo","deportivo y conciso","comunitario y curioso","metaficcional e inocente","lógico y juguetón","cotidiano y humano","noir ligero","histórico y asombrado","científico y urgente","ético y reflexivo","ecológico y grave","persuasivo e inquietante","urbano y resistente","emocional y fragmentado","fronterizo y desconfiado","arqueológico y reverente","obrero y directo","onírico y lírico","diplomático y ambicioso","analítico y deportivo","susurrado y opcional","elegíaco sin gore","sobrio y moral","macabro sugerido","aislado pero esperanzador","glitch y técnico","enigmático pero justo","culpable y reparador","archivístico y protector","épico y coral"];
const mysteries=[
  "una emisión que conoce recuerdos que nadie contó","un torneo escolar cuyo premio quiere renunciar","un expediente de Liga fechado antes de su fundación","un gremio recibe encargos de exploradores desaparecidos",
  "la fauna huye de un rescate aparentemente perfecto","los Pokémon oscuros protegen a quien debía purificarlos","dos clanes recuerdan versiones incompatibles del mismo juramento","una fotografía muestra un NPC que nunca estuvo allí",
  "un festival continúa después de que todos olvidaron su motivo","una carta cambia su ilustración según quién la sostenga","una pareja compi se formó en una línea temporal descartada","el marcador premia a quien evita anotar",
  "miles de señales señalan una Poképarada inexistente","los juguetes temen convertirse en sus entrenadores","un mosaico resuelve nombres borrados del mapa","una receta reproduce emociones ajenas",
  "todos los testigos dicen la verdad y aun así se contradicen","una distorsión devuelve objetos antes de perderse","una especie paradoja está reparando el ecosistema","una fusión quiere conservar dos nombres",
  "una central limpia oculta residuos que parecen vivos","una facción fabrica profecías para reclutar","la ciudad mejora mientras sus habitantes pierden recuerdos","una familia recibe cartas de sus futuros incompatibles",
  "portales pequeños sostienen una economía clandestina","una estatua registra civilizaciones que aún no existen","la mina produce minerales formados por decisiones","los sueños están pagando peaje entre dimensiones",
  "dos ligas reclaman al mismo campeón sin querer combatir","una academia confunde dificultad con crueldad","una melodía solo existe cuando el jugador decide escucharla","un héroe olvidado pide que no reconstruyan su leyenda",
  "un fantasma concede victorias que nadie quiere aceptar","una excavación construyó deliberadamente su propio monstruo","un equipo aislado sigue enviando reportes desde la nieve","los datos corruptos intentan clasificar al jugador",
  "un acertijo imposible fue manipulado para parecer profundo","la venganza era un recuerdo implantado","el último guardado no es una partida sino una persona","cuarenta historias compiten por decidir qué final merece Atlas" ];
const lexiconRoots=["campana","chispa","expediente","encargo","pulso","sombra","estandarte","encuadre","feria","baraja","compás","zona","señal","cuerda","patrón","receta","coartada","vestigio","hábitat","nombre","residuo","consigna","barrio","recuerdo","umbral","estrato","veta","sueño","delegación","apertura","susurro","eco","deuda","fosa","refugio","checksum","coordenada","culpa","copia","convergencia"];

const hierarchy=catalog.maps.map((m)=>{
  const position=((m.index-1)%25)+1;
  const tier=position===1?1:[6,13,20].includes(position)?2:3;
  return{mapId:m.newId,mapName:m.name,sourceId:m.sourceId,sourceName:m.sourceName,sector:m.sector,sectorName:m.sectorName,position,tier,
    purpose:tier===1?"ancla artesanal":tier===2?"ruta estable":"eco dimensional",
    minimum:tier===1?"3-5 NPCs, escena, decisión, jefe y recompensa global":tier===2?"1-2 NPCs y una mecánica":"baliza, regla local y retorno"};
});
const counts=Object.fromEntries([1,2,3].map((tier)=>[tier,hierarchy.filter((x)=>x.tier===tier).length]));
if(counts[1]!==40||counts[2]!==120||counts[3]!==840)throw new Error(`Clasificación inválida: ${JSON.stringify(counts)}`);

const characters=new Set(fs.readdirSync(path.join(ROOT,"pokemon_fire_ash","Graphics","Characters")).filter((f)=>/\.png$/i.test(f)).map((f)=>f.replace(/\.png$/i,"")));
function symbols(file){const d=read(file),s=[];for(const[k]of d.pairs)if(k instanceof RSymbol)s.push(k.name);return s;}
const moveCategory=new Map(read("moves.dat").pairs.filter(([k])=>k instanceof RSymbol).map(([k,v])=>[k.name,Number(v?.getIvar?.("category"))]));
const valid={species:new Set(symbols("species.dat")),items:new Set(symbols("items.dat")),moves:new Set(symbols("moves.dat")),trainerTypes:new Set(symbols("trainer_types.dat")),characters};
const tier1=hierarchy.filter((x)=>x.tier===1);
const seeds=tier1.map((map,i)=>({
  mapId:map.mapId,currentName:map.mapName,narrativeName:`${catalog.sectors[i].name}: Ancla ${String(i+1).padStart(2,"0")}`,
  sector:map.sector,sectorName:map.sectorName,biome:`reinterpretación segura de ${map.sourceName}`,
  globalImportance:`Entrega el sello ${i+1}/40 y revela una pieza del origen de Atlas.`,coreMystery:mysteries[i],
  inspirations:crossovers[i],voiceProfile:{tone:tones[i],lexicon:[lexiconRoots[i],map.sectorName,"ancla","retorno","testigo","decisión"],sentenceRule:i%3===0?"frases breves con silencios":i%3===1?"frases concretas con una imagen sensorial":"frases medidas que terminan en pregunta",forbiddenPhrases:["Soy un entrenador","Qué gran combate","Este Pokémon es muy fuerte","Según la Pokédex","Debes derrotarme"]},
  safety:{bagAllowed:true,canLose:true,freeReturn:true,maxLevel:150,maxTeam:6,creepypastaOptIn:i>=30&&i<=37,noSaveDamage:true},
  flagBudget:{reservedGlobalSwitch:708+i,counterVariable:103,selfSwitches:["A","B"]},
}));
const promptTemplate=masterPrompt.match(/```text\n([\s\S]*?)\n```/)?.[1]||masterPrompt;
const prompts=seeds.map((seed)=>({mapId:seed.mapId,iteration:1,prompt:promptTemplate
  .replaceAll("{{MAP_ID}}",String(seed.mapId)).replaceAll("{{CURRENT_NAME}}",seed.currentName).replaceAll("{{NARRATIVE_NAME}}",seed.narrativeName)
  .replaceAll("{{SECTOR_ID}}",String(seed.sector)).replaceAll("{{SECTOR_NAME}}",seed.sectorName).replaceAll("{{BIOME}}",seed.biome)
  .replaceAll("{{SOURCE_MAP}}",hierarchy.find((x)=>x.mapId===seed.mapId).sourceName).replaceAll("{{GLOBAL_IMPORTANCE}}",seed.globalImportance)
  .replaceAll("{{CORE_MYSTERY}}",seed.coreMystery).replaceAll("{{INSPIRATIONS}}",seed.inspirations.join(" + "))
  .replaceAll("{{VOICE_PROFILE}}",seed.voiceProfile.tone+"; "+seed.voiceProfile.sentenceRule).replaceAll("{{LEXICON}}",seed.voiceProfile.lexicon.join(", "))
  .replaceAll("{{BANNED_PHRASES}}",seed.voiceProfile.forbiddenPhrases.join(" | ")).replaceAll("{{AVAILABLE_SPRITES}}",[...characters].slice(0,120).join(", "))
  .replaceAll("{{VALID_SPECIES}}",`manifesto species.dat (${valid.species.size} IDs; validar salida)`).replaceAll("{{VALID_ITEMS}}",`manifesto items.dat (${valid.items.size} IDs; validar salida)`)
  .replaceAll("{{FLAG_BUDGET}}",JSON.stringify(seed.flagBudget)).replaceAll("{{SIMILARITY_CONTEXT}}","catálogos Horizontes y Atlas + blueprints aprobados del lote") }));

function tokens(s){return new Set(String(s).toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu,"").replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter((x)=>x.length>3));}
function similarity(a,b){const A=tokens(a),B=tokens(b);if(!A.size||!B.size)return 0;let n=0;for(const x of A)if(B.has(x))n++;return n/(A.size+B.size-n);}
const banned=/soy un entrenador|que gran combate|este pokemon es muy fuerte|segun la pokedex|debes derrotarme/i;
function qaBlueprints(list){const results=[],allText=[];for(const b of list){const errors=[],warn=[];const seed=seeds.find((x)=>x.mapId===Number(b.mapId));if(!seed)errors.push("mapId no pertenece a Tier 1");if(Number(b.tier)!==1)errors.push("tier debe ser 1");
    if(!b.title||!b.oneSentencePromise)errors.push("faltan título/promesa");if(!Array.isArray(b.npcs)||b.npcs.length<3||b.npcs.length>5)errors.push("se requieren 3-5 NPCs");
    const names=new Set();for(const npc of b.npcs||[]){if(!npc.name||names.has(npc.name))errors.push("nombre NPC vacío/repetido");names.add(npc.name);if(!valid.characters.has(npc.sprite))errors.push(`sprite NPC inexistente: ${npc.sprite}`);if(!npc.reasonForBeingHere||!npc.personalConflict||!npc.want||!npc.fear)errors.push(`motivación incompleta: ${npc.name}`);const lines=Object.values(npc.dialogue||{}).flat();if((npc.dialogue?.before||[]).length<3||(npc.dialogue?.after||[]).length<3)errors.push(`diálogo insuficiente: ${npc.name}`);if(lines.some((x)=>banned.test(x)))errors.push(`frase genérica: ${npc.name}`);}
    const battle=b.battle||{};if(battle.canLose!==true||battle.bagAllowed!==true)errors.push("batalla debe permitir perder y Mochila");if(!valid.trainerTypes.has(battle.trainerType))errors.push("trainerType inválido");if(!valid.characters.has(battle.sprite))errors.push("sprite de jefe inválido");if(!Array.isArray(battle.team)||battle.team.length!==6)errors.push("jefe Tier 1 requiere 6 Pokémon");const levels=[];for(const p of battle.team||[]){if(!valid.species.has(p.species))errors.push(`especie inválida ${p.species}`);if(p.level>150||p.level<1)errors.push(`nivel inválido ${p.level}`);levels.push(p.level);if(!Array.isArray(p.moves)||p.moves.length!==4||p.moves.some((m)=>!valid.moves.has(m)))errors.push(`moveset inválido ${p.species}`);if(p.item&&!valid.items.has(p.item))errors.push(`objeto inválido ${p.item}`);if(p.item==="ASSAULTVEST"&&p.moves.some((m)=>moveCategory.get(m)===2))errors.push(`Assault Vest incompatible con movimiento de estado: ${p.species}`);if(!p.whyItBelongs||!p.narrativeRole)errors.push(`rol narrativo incompleto ${p.species}`);}if(levels.length&&Math.max(...levels)-Math.min(...levels)>8)errors.push("rango de niveles mayor que 8");
    if(!battle.counterplayHint||!battle.storyToldByTeam)errors.push("falta historia/contrajuego del equipo");const cut=b.cutscene||{};if(!Array.isArray(cut.steps)||cut.steps.length<7)errors.push("cutscene requiere 7 pasos");if(!cut.decision||!Array.isArray(cut.decision.options)||cut.decision.options.length<2)errors.push("falta decisión");if(!cut.reentryPath||!cut.failurePath)errors.push("faltan rutas de fallo/reentrada");if(!Array.isArray(b.exits)||!b.exits.some((x)=>x.condition==="always"))errors.push("falta salida incondicional");
    if(!b.reward?.item||!valid.items.has(b.reward.item)||!b.reward.globalEffect||!b.reward.futurePayoff)errors.push("recompensa no significativa/válida");const raw=JSON.stringify(b);if(/674|675|NO ITEM|disable.*bag/i.test(raw))errors.push("intento de bloquear Mochila");if(/delete.*save|erase.*save|corrupt.*save/i.test(raw))errors.push("efecto destructivo de guardado");for(const claim of ["noBagLock","noImpossibleBattle","freeReturn","allAssetsExist","allDataIdsExist","notSimilarToPreviousContent","creepypastaIsOptInAndNonDestructive"])if(b.qaClaims?.[claim]!==true)errors.push(`qaClaim falso: ${claim}`);
    const narrativeText=[b.title,b.oneSentencePromise,...(b.npcs||[]).flatMap((n)=>Object.values(n.dialogue||{}).flat())].join(" ");for(const prev of allText)if(similarity(narrativeText,prev.text)>0.48)errors.push(`similitud excesiva con mapa ${prev.mapId}`);allText.push({mapId:b.mapId,text:narrativeText});if((b.npcs||[]).some((n)=>Object.values(n.dialogue||{}).flat().every((line)=>line.length<35)))warn.push("un NPC solo usa frases cortas; revisar ritmo");results.push({mapId:b.mapId,ok:errors.length===0,errors,warnings:warn,revisionPrompt:errors.length?`Reescribe el blueprint ${b.mapId}. Corrige exclusivamente: ${errors.join("; ")}. Conserva IDs, salida libre, Mochila y canLose.`:""});}
  return{generatedAt:new Date().toISOString(),summary:{total:results.length,passed:results.filter((x)=>x.ok).length,failed:results.filter((x)=>!x.ok).length},results};}

const outDir=path.join(ROOT,"content");
fs.writeFileSync(path.join(outDir,"atlas_content_hierarchy.json"),JSON.stringify({version:1,counts,maps:hierarchy},null,2));
fs.writeFileSync(path.join(outDir,"atlas_narrative_seeds.json"),JSON.stringify({version:1,seeds},null,2));
fs.writeFileSync(path.join(outDir,"atlas_tier1_prompts.json"),JSON.stringify({version:1,prompts},null,2));
const qaIndex=process.argv.indexOf("--qa");
if(qaIndex>=0){const file=path.resolve(process.argv[qaIndex+1]);const data=JSON.parse(fs.readFileSync(file,"utf8"));const report=qaBlueprints(Array.isArray(data)?data:(data.blueprints||[]));fs.writeFileSync(path.join(outDir,"atlas_narrative_qa.json"),JSON.stringify(report,null,2));console.log(JSON.stringify(report.summary,null,2));if(report.summary.failed)process.exitCode=1;}
console.log(`Jerarquía: Tier 1=${counts[1]}, Tier 2=${counts[2]}, Tier 3=${counts[3]}.`);
console.log(`Seeds/prompts Tier 1: ${seeds.length}.`);
