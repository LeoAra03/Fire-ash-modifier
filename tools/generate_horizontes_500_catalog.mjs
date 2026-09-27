#!/usr/bin/env node
/** Genera el catálogo de 500 aventuras que consume la expansión Horizontes. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalLoad, RString, RSymbol } from "../web/js/marshal.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "pokemon_fire_ash", "Data");
const OUT_JSON = path.join(ROOT, "content", "horizontes_500.json");
const OUT_MD = path.join(ROOT, "docs", "500_AVENTURAS_POSTGAME.md");
const text = (v) => v instanceof RString ? v.text : String(v ?? "");
const symbol = (v) => v instanceof RSymbol ? v.name : String(v ?? "");

export const realms = [
  { mapId:1001, template:43,  name:"Puerto Horizonte",         theme:"brújulas, mareas y rutas imposibles", faction:"Cartógrafos del Alba", color:"azul", pokegod:"Brújula" },
  { mapId:1002, template:910, name:"Jardines Aurora",          theme:"flores que almacenan amaneceres", faction:"Jardineros del Sol", color:"dorado", pokegod:"Auralia" },
  { mapId:1003, template:949, name:"Arrecife Cinerario",       theme:"coral volcánico y lluvia de ceniza", faction:"Buzos de Brasa", color:"carmesí", pokegod:"Coralix" },
  { mapId:1004, template:369, name:"Ciudad Engranaje",         theme:"máquinas alimentadas por amistad", faction:"Gremio del Piñón", color:"cobre", pokegod:"Cronotuerca" },
  { mapId:1005, template:311, name:"Ruinas del Eco",           theme:"voces antiguas grabadas en piedra", faction:"Arqueólogos Resonantes", color:"ocre", pokegod:"Ecolito" },
  { mapId:1006, template:425, name:"Selva Prismática",         theme:"lluvia que separa todos los colores", faction:"Guardianes Prisma", color:"verde", pokegod:"Prismavia" },
  { mapId:1007, template:750, name:"Caverna Celeste",          theme:"cristales que reflejan constelaciones", faction:"Mineros Astrales", color:"celeste", pokegod:"Astrocuarzo" },
  { mapId:1008, template:774, name:"Corona de Cronos",         theme:"senderos detenidos entre dos segundos", faction:"Vigías del Minuto", color:"plateado", pokegod:"Cronarca" },
  { mapId:1009, template:303, name:"Torre de Ceniza",          theme:"recuerdos que sobreviven al fuego", faction:"Custodios de la Brasa", color:"gris", pokegod:"Fénix Umbrío" },
  { mapId:1010, template:322, name:"Isla de las Mareas",       theme:"corrientes que cambian con la luna", faction:"Navegantes Lunares", color:"índigo", pokegod:"Marealuna" },
  { mapId:1011, template:885, name:"Arboleda del Juramento",   theme:"promesas que germinan como árboles", faction:"Caballeros Brote", color:"esmeralda", pokegod:"Robleterno" },
  { mapId:1012, template:886, name:"Gruta Boreal",             theme:"auroras atrapadas bajo el hielo", faction:"Exploradores Boreales", color:"blanco", pokegod:"Borealis" },
  { mapId:1013, template:862, name:"Caverna Terminal",         theme:"raíles abandonados hacia ningún mapa", faction:"Topógrafos del Fin", color:"negro", pokegod:"Terminalia" },
  { mapId:1014, template:923, name:"Espacio Umbral",           theme:"gravedad torcida y estrellas cercanas", faction:"Observadores Umbral", color:"violeta", pokegod:"Umbraxis" },
  { mapId:1015, template:942, name:"Ruina Cero",               theme:"datos perdidos convertidos en paisaje", faction:"Restauradores Cero", color:"turquesa", pokegod:"Nullcode" },
  { mapId:1016, template:265, name:"Santuario Dragón",         theme:"nidos unidos por corrientes cálidas", faction:"Pastores de Dragones", color:"ámbar", pokegod:"Dracocielo" },
  { mapId:1017, template:228, name:"Archipiélago Frutal",      theme:"islas con cosechas de estaciones distintas", faction:"Liga de Semillas", color:"naranja", pokegod:"Pomelord" },
  { mapId:1018, template:804, name:"Villa Camelia",            theme:"casas que florecen con cada buena acción", faction:"Consejo Camelia", color:"rosa", pokegod:"Cameluz" },
  { mapId:1019, template:567, name:"Enredo Feérico",           theme:"senderos que responden a las emociones", faction:"Tejedores Feéricos", color:"magenta", pokegod:"Hada Nexo" },
  { mapId:1020, template:973, name:"Panteón Pokégod",          theme:"altares de criaturas de realidades fusionadas", faction:"Cronistas Pokégod", color:"arcoíris", pokegod:"Omnigén" },
];

const roles = [
  "cartógrafa", "guardabosques", "mensajero", "arqueóloga", "mecánico",
  "criadora", "meteoróloga", "pescador", "médica", "historiador",
  "especialista", "exploradora", "cocinero", "astrónoma", "artesano",
  "entrenadora", "rescatista", "investigador", "vigía", "coleccionista",
  "oráculo", "niño explorador", "cronista", "campeona local", "custodio",
];
const motifs = [
  "La brújula que apunta al ayer", "Semillas bajo una luna doble", "El cofre que respira",
  "Un mapa dibujado por Pokémon", "La campana sin sonido", "Huellas sobre el agua",
  "La piedra que recuerda nombres", "Luces detrás de la lluvia", "El puente de las promesas",
  "Una carta llegada del futuro", "El nido de cristal", "Sombras que piden ayuda",
  "La receta de las siete bayas", "El reloj de hojas", "La estrella bajo tierra",
  "Duelo del horizonte", "La patrulla desaparecida", "El fósil que sueña",
  "La señal entre dimensiones", "El guardián sin templo", "Acertijo del clima",
  "Rescate al último minuto", "La grieta que reescribe rutas", "Prueba Pokégod",
  "El secreto final de la región",
];
const categories = [
  "historia", "historia", "objeto_oculto", "historia", "objeto_oculto",
  "pokemon_raro", "historia", "objeto_oculto", "historia", "objeto_oculto",
  "pokemon_raro", "pokemon_raro", "objeto_oculto", "pokemon_raro", "entrenador",
  "entrenador", "rescate", "entrenador", "anomalia", "entrenador",
  "acertijo", "rescate", "anomalia", "pokegod", "entrenador",
];
const items = [
  "RARECANDY", "PPUP", "MAXREVIVE", "FULLRESTORE", "MAXELIXIR", "NUGGET",
  "BIGNUGGET", "ABILITYCAPSULE", "BOTTLECAP", "COMETSHARD", "STARDUST",
  "STARPIECE", "PEARL", "BIGPEARL", "HEARTSCALE", "LIFEORB", "LEFTOVERS",
  "FOCUSSASH", "CHOICEBAND", "CHOICESPECS", "CHOICESCARF", "ASSAULTVEST",
  "EXPCANDYXL", "DUSKSTONE", "DAWNSTONE", "SHINYSTONE", "MOONSTONE",
  "SUNSTONE", "FIRESTONE", "WATERSTONE", "THUNDERSTONE", "LEAFSTONE",
];
const trainerTypes = [
  ["COOLTRAINER_M","trchar007"], ["COOLTRAINER_F","trchar008"],
  ["SCIENTIST","trchar246"], ["POKEMONRANGER_M","trchar009"],
  ["POKEMONRANGER_F","trchar016"], ["PSYCHIC_M","trchar028"],
  ["PSYCHIC_F","trchar069"], ["BLACKBELT","trchar011"],
  ["AROMALADY","trchar017"], ["POKEMONBREEDER","trchar021"],
];
const moves = [
  "PSYCHIC", "SHADOWBALL", "FOCUSBLAST", "ENERGYBALL", "THUNDERBOLT",
  "ICEBEAM", "FLAMETHROWER", "SURF", "EARTHQUAKE", "STONEEDGE",
  "DRAGONPULSE", "DARKPULSE", "FLASHCANNON", "SLUDGEBOMB", "MOONBLAST",
  "AURASPHERE", "HYPERBEAM", "GIGAIMPACT", "DAZZLINGGLEAM", "PROTECT",
];

function dataRecords(file) {
  const data = marshalLoad(fs.readFileSync(path.join(DATA, file)));
  return data.pairs.filter(([key]) => key instanceof RSymbol).map(([key, obj]) => ({
    id: key.name,
    number: Number(obj?.getIvar?.("id_number") ?? 999999),
    form: Number(obj?.getIvar?.("form") ?? 0),
    name: text(obj?.getIvar?.("real_name")) || key.name,
    baseSpecies: symbol(obj?.getIvar?.("species")),
  }));
}
const speciesAll = dataRecords("species.dat")
  .filter((s) => s.form === 0 && s.id !== "NONE")
  .sort((a,b) => a.number - b.number || a.id.localeCompare(b.id));
if (speciesAll.length < 700) throw new Error(`Solo hay ${speciesAll.length} especies base; se requieren 700`);
const itemIds = new Set(dataRecords("items.dat").map((x) => x.id));
const moveIds = new Set(dataRecords("moves.dat").map((x) => x.id));
for (const id of items) if (!itemIds.has(id)) throw new Error(`Objeto inexistente en catálogo: ${id}`);
for (const id of moves) if (!moveIds.has(id)) throw new Error(`Movimiento inexistente en catálogo: ${id}`);

const adventures = [];
for (let r = 0; r < realms.length; r++) {
  const realm = realms[r];
  for (let slot = 0; slot < 25; slot++) {
    const id = r * 25 + slot + 1;
    const species = speciesAll[id - 1];
    const team = Array.from({length:6}, (_,k) => speciesAll[(500 + r * 30 + slot * 6 + k) % speciesAll.length].id);
    const trainer = trainerTypes[(r + slot) % trainerTypes.length];
    const item = items[(r * 7 + slot) % items.length];
    const category = categories[slot];
    const title = `${motifs[slot]} — ${realm.name}`;
    const npc = `${roles[slot]} de ${realm.name}`;
    let hook;
    if (category === "entrenador") {
      hook = `${npc} protege una pista sobre ${realm.theme}. Solo entregará el registro tras un combate postgame con seis compañeros distintos.`;
    } else if (category === "pokemon_raro") {
      hook = `Una alteración ${realm.color} ha atraído a ${species.name}. Investiga sin dañarlo: puede ser derrotado o capturado para estabilizar la zona.`;
    } else if (category === "objeto_oculto") {
      hook = `${npc} dejó una pista ambiental que conduce a ${item}. El escondite revela además una página sobre ${realm.faction}.`;
    } else if (category === "pokegod") {
      hook = `El altar de ${realm.pokegod} manifiesta a ${species.name} como Pokégod de IV perfectos. Superarlo o capturarlo sella la grieta del lugar.`;
    } else if (category === "acertijo") {
      hook = `Resuelve un mecanismo basado en ${realm.theme}; la respuesta cambia la luz del mapa y descubre una reserva de ${item}.`;
    } else if (category === "rescate") {
      hook = `${npc} pide rescatar a ${species.name} de un accidente relacionado con ${realm.theme}; no hay combate obligatorio.`;
    } else if (category === "anomalia") {
      hook = `Una grieta mezcla el presente con otra línea temporal de ${realm.name}. ${species.name} sirve de ancla para cerrar el error.`;
    } else {
      hook = `${npc} documenta a ${species.name} y una historia inédita de ${realm.faction}; escucharla activa un nuevo registro de exploración.`;
    }
    adventures.push({
      id, mapId:realm.mapId, realm:realm.name, slot:slot + 1, title, category, npc,
      hook, pokemon:species.id, pokemonName:species.name, item,
      level:Math.min(100, 76 + ((id * 7) % 25)), flag:`Mapa ${realm.mapId} / self-switch A / evento ${slot + 100}`,
      trainerType:trainer[0], trainerSprite:trainer[1], trainerName:`H${String(id).padStart(3,"0")} ${roles[slot]}`,
      team, pokegodName:realm.pokegod.slice(0,16),
      moves:Array.from({length:4},(_,k)=>moves[(r * 3 + slot + k * 5) % moves.length]),
      implemented:true,
    });
  }
}
if (adventures.length !== 500 || new Set(adventures.map((x)=>x.title)).size !== 500) {
  throw new Error("El catálogo no produjo 500 títulos únicos");
}

fs.mkdirSync(path.dirname(OUT_JSON), { recursive:true });
fs.mkdirSync(path.dirname(OUT_MD), { recursive:true });
fs.writeFileSync(OUT_JSON, JSON.stringify({
  version:1, description:"500 aventuras postgame instalables de Horizontes", realms, adventures,
}, null, 2));
const lines = [
  "# 500 aventuras postgame: Horizontes", "",
  "Las 500 sugerencias siguientes están marcadas como `implemented: true` en el catálogo que consume el instalador. Cada una aparece como un evento interactivo único en su mapa, con self-switch propio y avance del contador global 0–500.", "",
];
for (const realm of realms) {
  lines.push(`## ${realm.name} (mapa ${realm.mapId})`, "");
  for (const a of adventures.filter((x)=>x.mapId===realm.mapId)) {
    lines.push(`### ${a.id}. ${a.title}`, "", `- **Tipo:** ${a.category}`, `- **NPC:** ${a.npc}`, `- **Pokémon:** ${a.pokemonName} (${a.pokemon})`, `- **Objeto:** ${a.item}`, `- **Flag:** ${a.flag}`, `- **Aventura:** ${a.hook}`, "");
  }
}
fs.writeFileSync(OUT_MD, lines.join("\n"));
console.log(`Catálogo generado: ${adventures.length} aventuras, ${realms.length} lugares.`);
console.log(path.relative(ROOT, OUT_JSON));
console.log(path.relative(ROOT, OUT_MD));
