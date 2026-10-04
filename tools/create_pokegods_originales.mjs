#!/usr/bin/env node
/**
 * Crea/verifica `content/pokegods_originales.json`: el plantel de doce
 * Pokégods originales (los rumores de patio de 1999-2000) con sus Formas de
 * Anomalía.
 *
 * El plantel se valida contra los datos compilados del juego: tipos,
 * habilidades, movimientos, especies usadas como fuente del grito, colores,
 * formas, hábitats, ritmos de crecimiento, ratios de género y grupos huevo
 * tienen que existir en Fire Ash 3.7.1. Si algo no existe, el instalador
 * falla antes de escribir un solo byte: es la regla de "cero assets ausentes"
 * de la expansión.
 *
 * Uso:
 *   node tools/create_pokegods_originales.mjs          # escribe el JSON
 *   node tools/create_pokegods_originales.mjs --check  # solo verifica
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalLoad, RSymbol } from "../web/js/marshal.js";
import { DATA, ROOT } from "./lib/fire_ash_registry.mjs";

const CHECK_ONLY = process.argv.includes("--check");
const OUT = path.join(ROOT, "content", "pokegods_originales.json");

// --------------------------------------------------------------- catálogos
const read = (file) => marshalLoad(fs.readFileSync(path.join(DATA, file)));
const symbolsOf = (file) => new Set(
  read(file).pairs.filter(([key]) => key instanceof RSymbol).map(([key]) => key.name),
);
const TYPES = new Set(["NORMAL", "FIGHTING", "FLYING", "POISON", "GROUND", "ROCK", "BUG",
  "GHOST", "STEEL", "FIRE", "WATER", "GRASS", "ELECTRIC", "PSYCHIC", "ICE", "DRAGON",
  "DARK", "FAIRY", "QMARKS", "SHADOW"]);
const WEATHERS = new Set(["None", "Sun", "Rain", "Sandstorm", "Hail", "HarshSun",
  "HeavyRain", "StrongWinds", "ShadowSky", "Fog"]);
const NATURES = new Set(["HARDY", "LONELY", "BRAVE", "ADAMANT", "NAUGHTY", "BOLD", "DOCILE",
  "RELAXED", "IMPISH", "LAX", "TIMID", "HASTY", "SERIOUS", "JOLLY", "NAIVE", "MODEST", "MILD",
  "QUIET", "BASHFUL", "RASH", "CALM", "GENTLE", "SASSY", "CAREFUL", "QUIRKY"]);
const COLORS = new Set(["Black", "Blue", "Brown", "Gray", "Green", "Pink", "Purple", "Red",
  "White", "Yellow"]);
const SHAPES = new Set(["Bipedal", "BipedalTail", "Finned", "Head", "HeadArms", "HeadBase",
  "HeadLegs", "Insectoid", "MultiBody", "MultiWinged", "Multiped", "Quadruped", "Serpentine",
  "Winged"]);
const HABITATS = new Set(["Cave", "Forest", "Grassland", "Mountain", "None", "Rare",
  "RoughTerrain", "Sea", "UltraSpace", "Urban", "WatersEdge"]);
const GROWTH = new Set(["Erratic", "Fast", "Fluctuating", "Medium", "Parabolic", "Slow"]);
const GENDERS = new Set(["AlwaysFemale", "AlwaysMale", "Female25Percent", "Female50Percent",
  "Female75Percent", "FemaleOneEighth", "Genderless"]);
const EGGS = new Set(["Amorphous", "Bug", "Ditto", "Dragon", "Fairy", "Field", "Flying",
  "Grass", "Humanlike", "Mineral", "Monster", "Undiscovered", "Water1", "Water2", "Water3"]);
const STATS = new Set(["HP", "ATTACK", "DEFENSE", "SPECIAL_ATTACK", "SPECIAL_DEFENSE", "SPEED"]);

// ---------------------------------------------------------- plantel (12)
/**
 * Cada entrada conserva el rumor original (de dónde sale, qué juraban haber
 * visto) y lo reinterpreta con voz propia: ninguna criatura copia textos ni
 * sprites ajenos, igual que se hizo con las emisiones del Monte Silver.
 */
const ROSTER = [
  {
    id: "PIKABLU",
    name: "Pikablu",
    category: "Sea Mouse",
    dex: "El rumor más repetido de todos: un ratón azul que nadie pudo enseñar dos veces. Dicen que aparece cuando el mar se queda en silencio y que solo se deja ver por quien no lo estaba buscando.",
    homage: "El Pokémon azul que todos juraron haber pescado (1999)",
    lore: "El primero de los dioses de patio. Se contaba que vivía en las rocas de la orilla y que su cola brillaba bajo el agua.",
    types: ["WATER"],
    baseStats: { HP: 100, ATTACK: 90, DEFENSE: 80, SPECIAL_ATTACK: 105, SPECIAL_DEFENSE: 95, SPEED: 120 },
    evs: { SPEED: 3 },
    abilities: ["TORRENT"],
    hiddenAbility: "SWIFTSWIM",
    moves: ["HYDROPUMP", "THUNDER", "ICEBEAM", "AGILITY"],
    crySource: "MARILL",
    color: "Blue", shape: "Quadruped", habitat: "WatersEdge", growthRate: "Medium",
    genderRatio: "Female50Percent", eggGroups: ["Water1", "Fairy"],
    height: 4, weight: 85, catchRate: 45, baseExp: 250, happiness: 70, hatchSteps: 2560,
    anomaly: { nature: "MODEST", evSpread: ["SPECIAL_ATTACK", "SPEED"], weather: { beta: "Rain", omega: "Hail" } },
    // Sin arte conceptual todavía: el sprite se adapta del Pikachu del juego
    // (tools/build_pikablu_sprite.mjs) en lugar de dejar un hueco. Si se dibuja
    // un concepto, el convertidor oficial toma el relevo.
    art: { source: "PIKACHU", adapted: true, note: "Azul cielo sobre la silueta del rumor; el concepto propio manda si aparece." },
  },
  {
    id: "MEWTHREE",
    name: "Mewthree",
    category: "New Species",
    dex: "La evolución que nunca existió y que medio mundo describió igual: más alta, más serena y con tres cuernos en lugar de dos. Su aura no empuja: ordena.",
    homage: "La evolución imposible de Mewtwo (2000)",
    lore: "Si Mewtwo era el clon, Mewthree era la respuesta. Los rumores hablaban de un nivel que ningún cartucho podía sostener.",
    types: ["PSYCHIC"],
    baseStats: { HP: 106, ATTACK: 100, DEFENSE: 95, SPECIAL_ATTACK: 140, SPECIAL_DEFENSE: 110, SPEED: 130 },
    evs: { SPECIAL_ATTACK: 3 },
    abilities: ["PRESSURE"],
    hiddenAbility: "MAGICBOUNCE",
    moves: ["PSYSTRIKE", "AURASPHERE", "ICEBEAM", "CALMMIND"],
    crySource: "MEWTWO",
    color: "Purple", shape: "BipedalTail", habitat: "Rare", growthRate: "Slow",
    genderRatio: "Genderless", eggGroups: ["Undiscovered"],
    height: 22, weight: 1220, catchRate: 3, baseExp: 340, happiness: 0, hatchSteps: 30720,
    anomaly: { nature: "MODEST", evSpread: ["SPECIAL_ATTACK", "SPEED"], weather: { beta: "ShadowSky", omega: "ShadowSky" } },
  },
  {
    id: "FLARETH",
    name: "Flareth",
    category: "Blazing Fox",
    dex: "La evolución final que los patios juraban conseguir con una piedra que nadie tenía. Su mela no arde: respira. Cada paso deja una huella que tarda en apagarse.",
    homage: "La evolución de Flareon que nunca llegó (1999)",
    lore: "Se decía que solo despertaba si la entrega se hacía de noche y el entrenador no miraba hacia atrás.",
    types: ["FIRE"],
    baseStats: { HP: 95, ATTACK: 110, DEFENSE: 85, SPECIAL_ATTACK: 120, SPECIAL_DEFENSE: 95, SPEED: 100 },
    evs: { ATTACK: 3 },
    abilities: ["FLASHFIRE"],
    hiddenAbility: "JUSTIFIED",
    moves: ["FLAREBLITZ", "SACREDFIRE", "EXTREMESPEED", "WILLOWISP"],
    crySource: "FLAREON",
    color: "Red", shape: "Quadruped", habitat: "Mountain", growthRate: "Medium",
    genderRatio: "FemaleOneEighth", eggGroups: ["Field"],
    height: 10, weight: 250, catchRate: 45, baseExp: 265, happiness: 70, hatchSteps: 8960,
    anomaly: { nature: "ADAMANT", evSpread: ["ATTACK", "SPEED"], weather: { beta: "Sun", omega: "Sandstorm" } },
  },
  {
    id: "LUNAREON",
    name: "Lunareon",
    category: "Moonlight",
    dex: "La evolución de la luna. Su pelaje guarda el color de la medianoche y las marcas de su lomo dibujan fases que cambian según quién las mire.",
    homage: "La evolución lunar de Eevee (2000)",
    lore: "Los rumores la situaban al final de un camino que solo se abría con la consola encendida de madrugada.",
    types: ["DARK"],
    baseStats: { HP: 95, ATTACK: 105, DEFENSE: 80, SPECIAL_ATTACK: 110, SPECIAL_DEFENSE: 110, SPEED: 95 },
    evs: { SPECIAL_DEFENSE: 2, SPECIAL_ATTACK: 1 },
    abilities: ["SYNCHRONIZE"],
    hiddenAbility: "MAGICBOUNCE",
    moves: ["CRUNCH", "MOONGEISTBEAM", "SHADOWBALL", "CALMMIND"],
    crySource: "UMBREON",
    color: "Purple", shape: "Quadruped", habitat: "Rare", growthRate: "Medium",
    genderRatio: "FemaleOneEighth", eggGroups: ["Field"],
    height: 10, weight: 270, catchRate: 45, baseExp: 265, happiness: 70, hatchSteps: 8960,
    anomaly: { nature: "MODEST", evSpread: ["SPECIAL_ATTACK", "SPEED"], weather: { beta: "Hail", omega: "ShadowSky" } },
  },
  {
    id: "SOLAREON",
    name: "Solareon",
    category: "Sunlight",
    dex: "La hermana diurna de la evolución lunar. Lleva un disco solar en la frente que calienta sin quemar y una melena que se abre como un amanecer.",
    homage: "La evolución solar de Eevee (2000)",
    lore: "Mismo rumor, otro horario: si entrenabas al mediodía, la piedra del sol respondía.",
    types: ["FIRE", "PSYCHIC"],
    baseStats: { HP: 95, ATTACK: 100, DEFENSE: 85, SPECIAL_ATTACK: 120, SPECIAL_DEFENSE: 95, SPEED: 105 },
    evs: { SPECIAL_ATTACK: 3 },
    abilities: ["DROUGHT"],
    hiddenAbility: "SOLARPOWER",
    moves: ["FLAMETHROWER", "SOLARBEAM", "PSYCHIC", "NASTYPLOT"],
    crySource: "ESPEON",
    color: "Yellow", shape: "Quadruped", habitat: "Grassland", growthRate: "Medium",
    genderRatio: "FemaleOneEighth", eggGroups: ["Field"],
    height: 10, weight: 265, catchRate: 45, baseExp: 265, happiness: 70, hatchSteps: 8960,
    anomaly: { nature: "MODEST", evSpread: ["SPECIAL_ATTACK", "SPEED"], weather: { beta: "Sun", omega: "HarshSun" } },
  },
  {
    id: "NIDOGOD",
    name: "Nidogod",
    category: "Drill King",
    dex: "El rey que los rumores coronaron sobre el Nido: placas volcánicas, un cuerno capaz de partir el suelo y una cola que no deja de temblar cuando algo se acerca.",
    homage: "La evolución final de Nidoking (1999)",
    lore: "Se contaba que vivía bajo la montaña y que solo salía si alguien pronunciaba su nombre completo.",
    types: ["POISON", "GROUND"],
    baseStats: { HP: 110, ATTACK: 125, DEFENSE: 105, SPECIAL_ATTACK: 95, SPECIAL_DEFENSE: 95, SPEED: 85 },
    evs: { ATTACK: 3 },
    abilities: ["SHEERFORCE"],
    hiddenAbility: "POISONTOUCH",
    moves: ["SLUDGEWAVE", "EARTHPOWER", "STONEEDGE", "TOXIC"],
    crySource: "NIDOKING",
    color: "Purple", shape: "Quadruped", habitat: "RoughTerrain", growthRate: "Parabolic",
    genderRatio: "AlwaysMale", eggGroups: ["Monster", "Field"],
    height: 23, weight: 620, catchRate: 45, baseExp: 290, happiness: 70, hatchSteps: 5120,
    anomaly: { nature: "MODEST", evSpread: ["SPECIAL_ATTACK", "HP"], weather: { beta: "Sandstorm", omega: "Sandstorm" } },
  },
  {
    id: "SPOOKY",
    name: "Spooky",
    category: "Shadow Grin",
    dex: "La evolución que nadie supo dibujar igual dos veces: una sombra redonda, una sonrisa demasiado ancha y tres púas que aparecen cuando dejas de mirarla.",
    homage: "La evolución de Gengar (1999)",
    lore: "El rumor aseguraba que se obtenía intercambiando de noche, con la luz apagada y la puerta cerrada.",
    types: ["GHOST", "POISON"],
    baseStats: { HP: 85, ATTACK: 90, DEFENSE: 75, SPECIAL_ATTACK: 125, SPECIAL_DEFENSE: 95, SPEED: 120 },
    evs: { SPECIAL_ATTACK: 3 },
    abilities: ["LEVITATE"],
    hiddenAbility: "CURSEDBODY",
    moves: ["SHADOWBALL", "SLUDGEBOMB", "NASTYPLOT", "SUBSTITUTE"],
    crySource: "GENGAR",
    color: "Purple", shape: "HeadArms", habitat: "Cave", growthRate: "Parabolic",
    genderRatio: "Female50Percent", eggGroups: ["Amorphous"],
    height: 18, weight: 405, catchRate: 45, baseExp: 280, happiness: 70, hatchSteps: 5120,
    anomaly: { nature: "MODEST", evSpread: ["SPECIAL_ATTACK", "SPEED"], weather: { beta: "Hail", omega: "ShadowSky" } },
  },
  {
    id: "DOOMSDAY",
    name: "Doomsday",
    category: "Final Wing",
    dex: "El dios del último día. Alas gastadas, un ojo que marca una hora que nadie sabe leer y una sombra que siempre cae un segundo antes que él.",
    homage: "El Pokémon del fin del mundo (2000)",
    lore: "No venía de ninguna evolución: era el rumor entero. Aparecía en las listas de 'los nueve prohibidos' de los recreos.",
    types: ["DARK", "FLYING"],
    baseStats: { HP: 105, ATTACK: 130, DEFENSE: 95, SPECIAL_ATTACK: 110, SPECIAL_DEFENSE: 95, SPEED: 105 },
    evs: { ATTACK: 3 },
    abilities: ["MULTISCALE"],
    hiddenAbility: "INTIMIDATE",
    moves: ["BRAVEBIRD", "CRUNCH", "ROOST", "DRAGONDANCE"],
    crySource: "HYDREIGON",
    color: "Black", shape: "Winged", habitat: "Rare", growthRate: "Slow",
    genderRatio: "Genderless", eggGroups: ["Undiscovered"],
    height: 32, weight: 950, catchRate: 3, baseExp: 360, happiness: 0, hatchSteps: 30720,
    anomaly: { nature: "ADAMANT", evSpread: ["ATTACK", "SPEED"], weather: { beta: "Sandstorm", omega: "ShadowSky" } },
  },
  {
    id: "TRICKET",
    name: "Tricket",
    category: "Trickster",
    dex: "Un bicho pequeño con alas de prisma que nunca está donde se le ve. Cambia de sitio sin moverse y devuelve los objetos que no le diste.",
    homage: "El Pokégod bromista de las listas de 2000",
    lore: "En los rumores aparecía y desaparecía de los listados: por eso se le llamaba el dios que se borraba solo.",
    types: ["BUG", "FAIRY"],
    baseStats: { HP: 80, ATTACK: 95, DEFENSE: 80, SPECIAL_ATTACK: 110, SPECIAL_DEFENSE: 95, SPEED: 125 },
    evs: { SPEED: 3 },
    abilities: ["PRANKSTER"],
    hiddenAbility: "WONDERWORLD",
    moves: ["BUGBUZZ", "PLAYROUGH", "QUIVERDANCE", "SUBSTITUTE"],
    crySource: "SABLEYE",
    color: "Pink", shape: "Insectoid", habitat: "Forest", growthRate: "Fast",
    genderRatio: "Female50Percent", eggGroups: ["Bug", "Fairy"],
    height: 6, weight: 120, catchRate: 60, baseExp: 240, happiness: 70, hatchSteps: 3840,
    anomaly: { nature: "TIMID", evSpread: ["SPECIAL_ATTACK", "SPEED"], weather: { beta: "Sun", omega: "Fog" } },
  },
  {
    id: "SHADYBUG",
    name: "Shadybug",
    category: "Dark Shell",
    dex: "Su caparazón es una sombra sólida: se mueve con él, se cierra cuando le da la luz y deja un rastro que el suelo tarda en olvidar.",
    homage: "El Pokégod insecto de las listas de 2000",
    lore: "Se contaba que solo salía en las zonas donde el juego se quedaba a oscuras.",
    types: ["BUG", "DARK"],
    baseStats: { HP: 90, ATTACK: 110, DEFENSE: 95, SPECIAL_ATTACK: 95, SPECIAL_DEFENSE: 95, SPEED: 100 },
    evs: { ATTACK: 3 },
    abilities: ["INTIMIDATE"],
    hiddenAbility: "SPEEDBOOST",
    moves: ["CRUNCH", "XSCISSOR", "SWORDSDANCE", "PROTECT"],
    crySource: "SCIZOR",
    color: "Black", shape: "Insectoid", habitat: "Cave", growthRate: "Fast",
    genderRatio: "Female50Percent", eggGroups: ["Bug"],
    height: 12, weight: 310, catchRate: 45, baseExp: 246, happiness: 70, hatchSteps: 3840,
    anomaly: { nature: "ADAMANT", evSpread: ["ATTACK", "SPEED"], weather: { beta: "Sandstorm", omega: "ShadowSky" } },
  },
  {
    id: "ANTHRAX",
    name: "Anthrax",
    category: "Plague Beast",
    dex: "La bestia de la peste de los rumores: cuerpo de alquitrán, esporas que flotan alrededor y una tos seca que suena a names que nadie pronunció.",
    homage: "El Pokégod de la enfermedad (2000)",
    lore: "Aparecía en las listas de 'no lo busques': los patios aseguraban que su nombre no debía escribirse en la libreta.",
    types: ["POISON", "DARK"],
    baseStats: { HP: 100, ATTACK: 115, DEFENSE: 95, SPECIAL_ATTACK: 105, SPECIAL_DEFENSE: 95, SPEED: 80 },
    evs: { ATTACK: 2, HP: 1 },
    abilities: ["LEVITATE"],
    hiddenAbility: "SPEEDBOOST",
    moves: ["SLUDGEBOMB", "CRUNCH", "TOXIC", "PROTECT"],
    crySource: "HOUNDOOM",
    color: "Green", shape: "Quadruped", habitat: "RoughTerrain", growthRate: "Slow",
    genderRatio: "Female50Percent", eggGroups: ["Amorphous", "Field"],
    height: 19, weight: 480, catchRate: 45, baseExp: 268, happiness: 70, hatchSteps: 5120,
    anomaly: { nature: "ADAMANT", evSpread: ["ATTACK", "HP"], weather: { beta: "Sandstorm", omega: "ShadowSky" } },
  },
  {
    id: "DIMONIX",
    name: "Dimonix",
    category: "Crystal Snake",
    dex: "Una serpiente de diamante que cruje al avanzar. Cada segmento refleja un lugar distinto del mismo pasillo, y ninguno coincide con el que estás viendo.",
    homage: "La evolución cristalina de Onix (1999)",
    lore: "El rumor decía que se conseguía con una piedra que solo brillaba en las profundidades de la cueva.",
    types: ["ROCK", "STEEL"],
    baseStats: { HP: 105, ATTACK: 120, DEFENSE: 140, SPECIAL_ATTACK: 85, SPECIAL_DEFENSE: 95, SPEED: 60 },
    evs: { DEFENSE: 3 },
    abilities: ["STURDY"],
    hiddenAbility: "MULTISCALE",
    moves: ["DIAMONDSTORM", "IRONHEAD", "STONEEDGE", "PROTECT"],
    crySource: "ONIX",
    color: "Gray", shape: "Serpentine", habitat: "Cave", growthRate: "Slow",
    genderRatio: "Female50Percent", eggGroups: ["Mineral"],
    height: 88, weight: 4000, catchRate: 45, baseExp: 280, happiness: 70, hatchSteps: 6400,
    anomaly: { nature: "ADAMANT", evSpread: ["ATTACK", "DEFENSE"], weather: { beta: "Sandstorm", omega: "Sandstorm" } },
  },
];

/**
 * Las tres Formas de Anomalía. No son niveles estándar: cada forma cambia el
 * nivel, el reparto de esfuerzo, la naturaleza, la habilidad, el clima y las
 * reglas del combate. Omega es la única que rompe las reglas de verdad:
 * Wonder Guard convierte el duelo en un rompecabezas de coberturas.
 */
const FORMS = {
  alfa: {
    label: "Anomalía Alfa",
    level: 85,
    ivs: 31,
    evs: null,
    nature: null,
    shiny: false,
    ability: "primary",
    weather: null,
    backdrop: null,
    rules: ["canLose"],
    capture: true,
    brief: "Nivel 85, IVs perfectos. Puedes huir y puedes capturarla.",
  },
  beta: {
    label: "Anomalía Beta",
    level: 100,
    ivs: 31,
    evs: { first: 252, second: 252, hp: 6 },
    nature: "anomaly",
    shiny: false,
    ability: "hidden",
    weather: "beta",
    backdrop: null,
    rules: ["canLose", "cannotRun"],
    capture: true,
    brief: "Nivel 100, esfuerzo repartido y clima hostil. No puedes huir: solo superarla o capturarla.",
  },
  omega: {
    label: "Anomalía Omega",
    level: 115,
    ivs: 31,
    evs: { first: 252, second: 252, hp: 6 },
    nature: "anomaly",
    shiny: true,
    ability: "WONDERGUARD",
    weather: "omega",
    backdrop: "distortion",
    rules: ["canLose", "cannotRun"],
    capture: true,
    brief: "Nivel 115, variocolor, clima extremo y Wonder Guard: solo la rozan los ataques super eficaces.",
  },
};

const CATALOG = {
  version: 1,
  title: "Pokégods originales — Isla Espejo",
  voice: "Los rumores de patio de 1999 y 2000 tomaron forma física en una isla que el juego no debería recordar.",
  guarantees: {
    reinterpretedHomagesOnly: true,
    canLoseEveryBattle: true,
    captureAllowed: true,
    freeReturn: true,
    maxLevel: 115,
    levelCap: 150,
    spritesRequired: true,
    criesRequired: true,
    existingAssetsOnlyForTypes: true,
  },
  assets: {
    conceptDir: "reference/pokegods/concept",
    front: "pokemon_fire_ash/Graphics/Pokemon/Front",
    back: "pokemon_fire_ash/Graphics/Pokemon/Back",
    icons: "pokemon_fire_ash/Graphics/Pokemon/Icons",
    characters: "pokemon_fire_ash/Graphics/Characters",
    cries: "pokemon_fire_ash/Audio/SE",
    sizes: { front: [96, 96], back: [96, 96], icon: [128, 64], character: [256, 256] },
    conceptHint: "PNG con fondo liso y criatura centrada a cuerpo completo; el conversor recorta, funde el fondo y reduce la paleta.",
  },
  forms: FORMS,
  roster: ROSTER,
};

// --------------------------------------------------------------- validación
function validate() {
  const errors = [];
  const species = symbolsOf("species.dat");
  const moves = symbolsOf("moves.dat");
  const abilities = symbolsOf("abilities.dat");
  const ids = new Set();

  for (const entry of ROSTER) {
    const at = (message) => errors.push(`${entry.id}: ${message}`);
    if (!/^[A-Z][A-Z0-9_]*$/.test(entry.id)) at("el símbolo debe ir en mayúsculas");
    if (ids.has(entry.id)) at("símbolo duplicado");
    ids.add(entry.id);
    if (!entry.types.length || entry.types.length > 2) at("debe tener uno o dos tipos");
    for (const type of entry.types) if (!TYPES.has(type)) at(`tipo inexistente ${type}`);
    const stats = Object.keys(entry.baseStats);
    if (stats.length !== 6 || stats.some((key) => !STATS.has(key))) at("estadísticas base incompletas");
    const bst = Object.values(entry.baseStats).reduce((a, b) => a + b, 0);
    if (bst < 520 || bst > 700) at(`BST ${bst} fuera del rango de los dioses (520-700)`);
    if (!entry.abilities.length) at("falta la habilidad");
    for (const ability of [...entry.abilities, entry.hiddenAbility]) {
      if (ability && !abilities.has(ability)) at(`habilidad inexistente ${ability}`);
    }
    for (const move of entry.moves) if (!moves.has(move)) at(`movimiento inexistente ${move}`);
    if (!species.has(entry.crySource)) at(`especie de grito inexistente ${entry.crySource}`);
    if (!COLORS.has(entry.color)) at(`color inexistente ${entry.color}`);
    if (!SHAPES.has(entry.shape)) at(`forma inexistente ${entry.shape}`);
    if (!HABITATS.has(entry.habitat)) at(`hábitat inexistente ${entry.habitat}`);
    if (!GROWTH.has(entry.growthRate)) at(`ritmo de crecimiento inexistente ${entry.growthRate}`);
    if (!GENDERS.has(entry.genderRatio)) at(`ratio de género inexistente ${entry.genderRatio}`);
    for (const group of entry.eggGroups) if (!EGGS.has(group)) at(`grupo huevo inexistente ${group}`);
    for (const stat of Object.keys(entry.evs)) if (!STATS.has(stat)) at(`esfuerzo inválido ${stat}`);
    const anomaly = entry.anomaly ?? {};
    if (!NATURES.has(anomaly.nature)) at(`naturaleza de anomalía inexistente ${anomaly.nature}`);
    const spread = anomaly.evSpread ?? [];
    if (spread.length !== 2 || spread.some((stat) => !STATS.has(stat))) at("reparto de esfuerzo de anomalía inválido");
    for (const key of ["beta", "omega"]) {
      const weather = anomaly.weather?.[key];
      if (!WEATHERS.has(weather)) at(`clima inexistente (${key}): ${weather}`);
    }
    if (!WEATHERS.has("Sandstorm")) at("catálogo de climas del juego no disponible");
    for (const key of Object.keys(FORMS)) {
      if (FORMS[key].level > CATALOG.guarantees.levelCap) at(`la forma ${key} supera el tope de nivel`);
    }
    if (FORMS.omega.ability !== "WONDERGUARD" || !abilities.has(FORMS.omega.ability)) {
      at("la forma Omega necesita una habilidad de inmunidad extrema válida");
    }
  }
  if (ROSTER.length !== 12) errors.push(`el plantel tiene ${ROSTER.length}/12 Pokégods`);
  if (errors.length) throw new Error(`Plantel Pokégod inválido (${errors.length}):\n- ${errors.join("\n- ")}`);
  return true;
}

function write() {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(CATALOG, null, 2)}\n`);
}

function check() {
  if (!fs.existsSync(OUT)) throw new Error(`Falta ${path.relative(ROOT, OUT)} (ejecuta sin --check)`);
  const stored = JSON.parse(fs.readFileSync(OUT, "utf8"));
  const a = JSON.stringify(stored), b = JSON.stringify(CATALOG);
  if (a !== b) throw new Error("El catálogo guardado no coincide con el generador (ejecuta sin --check)");
  return true;
}

validate();
if (CHECK_ONLY) check(); else write();
console.log(`Plantel Pokégod OK: ${ROSTER.length} criaturas, 3 formas de anomalía` +
  ` (${FORMS.alfa.level}/${FORMS.beta.level}/${FORMS.omega.level}), tipos, movimientos,` +
  ` habilidades, climas y gritos validados contra los datos compilados.`);
if (!CHECK_ONLY) console.log(`Escrito: ${path.relative(ROOT, OUT)}`);
