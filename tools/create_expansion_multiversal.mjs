#!/usr/bin/env node
/**
 * Crea/verifica `content/expansion_multiversal.json`: el plano de la Expansión
 * Multiversal posterior a la Ruta de Dios.
 *
 * Cuatro reglas de diseño gobiernan el plano y se comprueban aquí:
 *
 *   1. Nada se alcanza por un menú. Los siete relatos creepypasta se acceden
 *      por grietas repartidas por Kanto y Johto; el Atlas Mil por el capitán
 *      del puerto de Ciudad Carmín; la Isla Espejo por un espejo en el sótano
 *      sellado de la Mansión Pokémon de Isla Canela.
 *   2. Nadie queda atrapado. Cada destino tiene retorno al mundo y cada combate
 *      se puede perder.
 *   3. Purgar una grieta cierra una línea temporal: la cuenta vive en el
 *      contador 264 y en los sellos 868-875 que ya instala el Monte Silver.
 *      Con las siete purgadas aparece el punto de colapso; con las ocho, la
 *      Liga Oscura.
 *   4. El laboratorio de Oak recupera sus funciones originales: se retira la
 *      cápsula central nueva y Oak se queda como consejero, no como transporte.
 *
 * El plano no usa ni un switch ni una variable nueva: reutiliza el contador y
 * los sellos existentes, así que ninguna partida guardada queda en un estado
 * imposible por falta de slots.
 *
 * Uso:
 *   node tools/create_expansion_multiversal.mjs          # escribe el JSON
 *   node tools/create_expansion_multiversal.mjs --check  # solo verifica
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalLoad, RSymbol } from "../web/js/marshal.js";
import { DATA, ROOT } from "./lib/fire_ash_registry.mjs";

const CHECK_ONLY = process.argv.includes("--check");
const OUT = path.join(ROOT, "content", "expansion_multiversal.json");

const read = (file) => marshalLoad(fs.readFileSync(path.join(DATA, file)));
const symbolsOf = (file) => new Set(
  read(file).pairs.filter(([key]) => key instanceof RSymbol).map(([key]) => key.name),
);
const mapExists = (id) => fs.existsSync(path.join(DATA, `Map${String(id).padStart(3, "0")}.rxdata`));

// ------------------------------------------------------------------ planos
const POSTGAME = 429;
const COUNTER = 264;          // purgas realizadas (siete emisiones + Red)
const SEAL_BASE = 868;        // 868-874 emisiones, 875 Red
const PURGE_GOAL = 7;         // grietas necesarias para que aparezca el colapso
const FINAL_GOAL = 8;         // con Red, se abre la Liga Oscura

/**
 * Las siete grietas. Cada una vive en un lugar real de Kanto o Johto y conduce
 * a la emisión correspondiente del Monte Silver (mapas 2023-2029).
 */
const RIFTS = [
  {
    id: "locutora",
    boss: "LA LOCUTORA",
    emissionMap: 2023,
    seal: SEAL_BASE + 0,
    label: "La Torre que Escuchaba",
    place: "Torre Pokémon",
    world: { mapId: 149, hint: [12, 12] },
    warning: [
      "Una grieta se abre en el aire de la torre, a la altura de un altavoz que no existe.",
      "Dentro suena una canción que nadie está cantando.",
    ],
    enter: "El suelo de la torre deja de sonar bajo tus pies. La canción te reconoce.",
    retreat: "Retrocedes. La grieta se queda donde estaba, esperando.",
    closed: "La grieta está sellada. La torre ya solo suena a madera vieja.",
    scar: "La cicatriz queda quieta: ya no es una amenaza, es una puerta a lo que ocurrió.",
    scarAsk: "¿Cruzar al eco o dejarla en paz?\\ch[1,2,Cruzar,Dejarla]",
  },
  {
    id: "plata",
    boss: "PLATA PERDIDA",
    emissionMap: 2024,
    seal: SEAL_BASE + 1,
    label: "La Partida Perdida",
    place: "Islas Espuma",
    world: { mapId: 979, hint: [60, 40] },
    warning: [
      "Entre la nieve y la espuma hay una grieta con forma de huella.",
      "Alguien camina en círculos al otro lado y no levanta la vista.",
    ],
    enter: "La nieve del otro lado no está fría: está repetida.",
    retreat: "Cierras los ojos y la huella sigue ahí cuando los abres.",
    closed: "La huella se borró. El frío volvió a ser solo frío.",
    scar: "La cicatriz queda quieta: ya no es una amenaza, es una puerta a lo que ocurrió.",
    scarAsk: "¿Cruzar al eco o dejarla en paz?\\ch[1,2,Cruzar,Dejarla]",
  },
  {
    id: "enterrado",
    boss: "EL ENTERRADO",
    emissionMap: 2025,
    seal: SEAL_BASE + 2,
    label: "La Fosa del Enterrado",
    place: "Monte Moon",
    world: { mapId: 90, hint: [30, 25] },
    warning: [
      "La roca se ha abierto sola. Huele a excavación reciente y a algo más antiguo.",
      "Desde abajo sube un ruido de uñas.",
    ],
    enter: "Bajas por un túnel que no cavó nadie de este mundo.",
    retreat: "Te apartas. Las uñas siguen arañando, pacientes.",
    closed: "La fosa fue tapiada con algo mejor que piedra: silencio.",
    scar: "La cicatriz queda quieta: ya no es una amenaza, es una puerta a lo que ocurrió.",
    scarAsk: "¿Cruzar al eco o dejarla en paz?\\ch[1,2,Cruzar,Dejarla]",
  },
  {
    id: "cinta",
    boss: "EL NIÑO DE LA CINTA",
    emissionMap: 2026,
    seal: SEAL_BASE + 3,
    label: "La Cinta Carmesí",
    place: "Torre Quemada",
    world: { mapId: 303, hint: [15, 12] },
    warning: [
      "Una cinta carmesí atraviesa la pared como si la pared fuera agua.",
      "Al otro lado hay una partida guardada que no termina de cargar.",
    ],
    enter: "La cinta te envuelve y el mundo tarda un segundo en dibujarse.",
    retreat: "Sueltas la cinta. La torre vuelve a oler a ceniza.",
    closed: "La cinta quedó sin nudo. La partida, por fin, terminó.",
    scar: "La cicatriz queda quieta: ya no es una amenaza, es una puerta a lo que ocurrió.",
    scarAsk: "¿Cruzar al eco o dejarla en paz?\\ch[1,2,Cruzar,Dejarla]",
  },
  {
    id: "fallo",
    boss: "EL FALLO CERO",
    emissionMap: 2027,
    seal: SEAL_BASE + 4,
    label: "Ciudad Glitch",
    place: "Planta de Energía de Kanto",
    world: { mapId: 412, hint: [22, 15] },
    warning: [
      "Los generadores zumban en un idioma que no es electricidad.",
      "La grieta parpadea como una pantalla con un error que nadie corrigió.",
    ],
    enter: "Las calles del otro lado se desbordan de datos al llegar a su borde.",
    retreat: "Sales antes de que el error te aprenda el nombre.",
    closed: "El error fue corregido. El zumbido volvió a ser corriente.",
    scar: "La cicatriz queda quieta: ya no es una amenaza, es una puerta a lo que ocurrió.",
    scarAsk: "¿Cruzar al eco o dejarla en paz?\\ch[1,2,Cruzar,Dejarla]",
  },
  {
    id: "eco",
    boss: "EL ECO AHOGADO",
    emissionMap: 2028,
    seal: SEAL_BASE + 5,
    label: "El Eco que Jugó Contigo",
    place: "Ruinas Alfa",
    world: { mapId: 295, hint: [20, 17] },
    warning: [
      "Un reflejo con retraso repite tus movimientos junto a la grieta.",
      "Cuando te detienes, él tarda un paso en detenerse.",
    ],
    enter: "El agua del otro lado devuelve tu imagen con un segundo de retraso.",
    retreat: "Te quedas quieto hasta que el eco se cansa.",
    closed: "El eco aprendió su propio nombre y dejó de repetir el tuyo.",
    scar: "La cicatriz queda quieta: ya no es una amenaza, es una puerta a lo que ocurrió.",
    scarAsk: "¿Cruzar al eco o dejarla en paz?\\ch[1,2,Cruzar,Dejarla]",
  },
  {
    id: "jugador",
    boss: "EL JUGADOR DE 1996",
    emissionMap: 2029,
    seal: SEAL_BASE + 6,
    label: "La Consola de 1996",
    place: "Mansión Pokémon",
    world: { mapId: 190, hint: [25, 25] },
    warning: [
      "Una grieta con forma de pantalla se enciende entre los diarios quemados.",
      "Alguien sigue jugando al otro lado desde hace treinta años.",
    ],
    enter: "La partida sigue en marcha. Te estaba esperando para el relevo.",
    retreat: "Apagas la mirada. La consola sigue sola.",
    closed: "La partida terminó. Alguien, por fin, guardó y apagó.",
    scar: "La cicatriz queda quieta: ya no es una amenaza, es una puerta a lo que ocurrió.",
    scarAsk: "¿Cruzar al eco o dejarla en paz?\\ch[1,2,Cruzar,Dejarla]",
  },
];

/** Punto cero: aparece cuando las siete grietas están purgadas. */
const COLLAPSE = {
  mapId: 143,
  hint: [12, 18],
  place: "Torre Pokémon",
  targetMap: 2021,
  title: "Monte Silver — Falda",
  lines: [
    "La torre que abrió la primera grieta es la que las cierra todas.",
    "La inestabilidad se ha derrumbado en un solo punto: una grieta que ya no parpadea, sino que respira.",
    "Al otro lado está el Monte Silver, la montaña de las historias sin testigos.",
  ],
  enter: "Subes por la grieta. Arriba, siete puertas de niebla ya no respiran: ahora guardan silencio.",
  retreat: "No es el momento. La montaña puede esperar.",
};

/** La Liga Oscura: dos mapas nuevos y el umbral que sustituye al menú. */
const DARK_LEAGUE = {
  maps: [
    {
      mapId: 2192,
      title: "Liga Oscura — Umbral",
      template: 151,
      role: "umbral",
      battleBackdrop: "distortion",
      lines: [
        "Umbral de la Liga Oscura. El aire aquí no circula: se repite.",
        "Detrás de esa puerta esperan las siete voces, pero ya no por separado.",
      ],
    },
    {
      mapId: 2193,
      title: "Liga Oscura — Arena Final",
      template: 214,
      role: "arena",
      battleBackdrop: "distortion",
      lines: [
        "Arena Final. No hay gradas: hay reflejos de todas las personas que contaron estas historias.",
      ],
    },
  ],
  gate: {
    mapId: 2022,
    eventName: "PokeMod Multiverso: Puertas de niebla",
    newName: "PokeMod Grieta: Umbral de la Liga Oscura",
    locked: "Las siete puertas callan, pero el umbral no se abre. Falta que el Campeón Silencioso hable.",
    open: "Red asiente y señala la pared del fondo. Detrás del silencio hay una puerta que no estaba.",
  },
  battles: [
    {
      id: "canto",
      name: "EL CANTO",
      type: "PSYCHIC_F",
      sprite: "MISMAGIUS",
      reward: "CHOICESPECS",
      intro: ["El coro de la torre se ordena en una sola voz.", "EL CANTO: ¿Oyes? Es lo que queda de quienes escucharon demasiado."],
      win: "EL CANTO: Bien. Ahora la canción se queda aquí.",
      loss: "EL CANTO: Vuelve. La melodía no se acaba por descansar.",
      rematch: "EL CANTO: ¿Otra vez? Cantemos, entonces.",
      team: [["CHANDELURE", 110], ["MISMAGIUS", 112], ["GENGAR", 114], ["DRIFBLIM", 110], ["BANETTE", 110], ["FROSLASS", 112]],
    },
    {
      id: "estatica",
      name: "LA ESTÁTICA",
      type: "SCIENTIST",
      sprite: "PORYGON",
      reward: "ASSAULTVEST",
      intro: ["Un científico que ya no distingue su cara de la del error que corregía.", "LA ESTÁTICA: Todo lo que ves es un dato que se negó a morir."],
      win: "LA ESTÁTICA: Corregido. Al fin.",
      loss: "LA ESTÁTICA: El error vuelve a empezar. Siempre lo hace.",
      rematch: "LA ESTÁTICA: Otra comprobación. Otra vez.",
      team: [["PORYGON2", 112], ["PORYGONZ", 116], ["MUK", 112], ["ELECTRODE", 112], ["DITTO", 113], ["UNOWN", 110]],
    },
    {
      id: "sinrostro",
      name: "EL SIN ROSTRO",
      type: "HIKER",
      sprite: "MAROWAK",
      reward: "ROCKYHELMET",
      intro: ["Lo que excavaron donde no debían aprendió a esperar de pie.", "EL SIN ROSTRO: Nadie me enterró. Yo me quedé."],
      win: "EL SIN ROSTRO: Descansa. Yo también puedo, por fin.",
      loss: "EL SIN ROSTRO: La tierra es paciente.",
      rematch: "EL SIN ROSTRO: ¿Otra palada?",
      team: [["MAROWAK", 114], ["GOLURK", 116], ["COFAGRIGUS", 114], ["DUSKNOIR", 115], ["SABLEYE", 113], ["SPIRITOMB", 116]],
    },
    {
      id: "eco",
      name: "EL ECO",
      type: "SWIMMER_M",
      sprite: "JELLICENT",
      reward: "FOCUSSASH",
      intro: ["Un reflejo con retraso que esta vez no se limita a repetir.", "EL ECO: Jugué contigo. Ahora juego en serio."],
      win: "EL ECO: Ya sé quién soy. Gracias por prestármelo.",
      loss: "EL ECO: Vuelve cuando aprendas tus propios pasos.",
      rematch: "EL ECO: Otra partida. Sin trampas esta vez.",
      team: [["JELLICENT", 115], ["FROSLASS", 114], ["GENGAR", 117], ["MISMAGIUS", 114], ["SPIRITOMB", 118], ["DUSKNOIR", 115]],
    },
    {
      id: "convergencia",
      name: "LA CONVERGENCIA",
      type: "CHAMPION",
      sprite: "GENGAR",
      reward: "MASTERBALL",
      intro: [
        "Las siete vocas convergen en una sola figura que no termina de dibujarse.",
        "LA CONVERGENCIA: No soy la suma de las siete. Soy lo que contaban cuando nadie las contaba.",
      ],
      win: "LA CONVERGENCIA: Entonces ya puedes volver. Y esta vez, de verdad.",
      loss: "LA CONVERGENCIA: Ninguna de nosotras te encierra. Vuelve cuando quieras.",
      rematch: "LA CONVERGENCIA: ¿Otra vez el final? Adelante.",
      team: [["PORYGONZ", 120], ["CHANDELURE", 120], ["GOLURK", 122], ["DUSKNOIR", 122], ["GENGAR", 124], ["SPIRITOMB", 125]],
    },
  ],
};

/** Expedición Atlas Mil: capitán en el puerto de Ciudad Carmín. */
const ATLAS = {
  captainMap: 108,
  captainHint: [34, 40],
  captainName: "Capitán Ferrán",
  captainSprite: "trchar016",
  gate: 706,          // el Cronista abrió el Atlas
  horizons: 704,      // Horizontes abierto (Puerto Horizonte)
  portMap: 1001,
  dock: {
    mapId: 2191,
    title: "Muelle de Atlas Mil",
    template: 1001,
    role: "muelle",
    battleBackdrop: "city",
  },
  ask: "Capitán: El Atlas Mil no está en ninguna carta, pero se deja navegar. ¿Zarpamos?",
  notYet: "Capitán: Necesito las cartas del Cronista de Puerto Horizonte antes de meter el barco en esa nada.",
  setSail: "Capitán: ¡Izad! Y si el mar se equivoca, no le hagáis caso.",
  back: "Capitán: ¿Volvemos a Ciudad Carmín? El barco obedece cuando quiere, pero hoy quiere.",
  stay: "Capitán: Tómate tu tiempo. El muelle no se mueve.",
};

/** Isla Espejo: sótano sellado de la Mansión Pokémon de Isla Canela. */
const MIRROR = {
  mansionMap: 192,
  mansionHint: [25, 25],
  basement: {
    mapId: 2194,
    title: "Sótano Sellado de la Mansión",
    template: 192,
    role: "sotano",
    battleBackdrop: "indoor3",
  },
  islandMap: 997,
  islandArrival: [14, 10],
  hatch: "Una escotilla que no figuraba en los planos de la mansión. Alguien la abrió desde dentro.",
  lines: [
    "El sótano no aparecía en ningún plano y, sin embargo, siempre estuvo aquí.",
    "En el centro hay un espejo grande como una pared, con el cristal deformado.",
    "Te acercas... y el reflejo no te devuelve a ti: devuelve una isla.",
  ],
  ask: "El reflejo muestra una isla que no conoces. ¿Cruzas el umbral?",
  cross: "El cristal cede como el agua. Del otro lado, el aire sabe a datos viejos.",
  retreat: "Retrocedes. El espejo sigue mostrando la isla, paciente.",
  backAsk: "El espejo sigue ahí, visto desde dentro. ¿Vuelves al sótano de la mansión?",
  back: "Atraviesas el cristal. El sótano te recibe como si no hubieras salido nunca.",
  stay: "Te quedas. La isla tiene más cosas que enseñar.",
};

/** Laboratorio de Oak: sin cápsula nueva, Oak solo aconseja. */
const OAK_LAB = {
  mapId: 48,
  hubMarker: "PokeMod Hub:",
  sprite: "trchar024",
  hint: [11, 17],
  name: "PokeMod Oak: Registro de Grietas",
  lines: [
    "Prof. Oak: Ash, no he instalado nada nuevo abajo. Las dos cápsulas de siempre siguen donde estaban y con ellas me basta.",
    "Prof. Oak: Lo que sí hago es medir. Las lecturas de energía de estas grietas suben cada vez que cierras una.",
    "Prof. Oak: Llevas \\v[264] de 8 líneas temporales purgadas. Cuando falte una, la inestabilidad caerá en un solo punto.",
    "Prof. Oak: Si quieres ir más lejos, no busques un transportador: busca el mundo. Hay un capitán en el puerto de Ciudad Carmín, un sótano recién abierto en la Mansión de Isla Canela y grietas en lugares que conoces de sobra.",
  ],
};

const CATALOG = {
  version: 1,
  title: "Expansión Multiversal — Post-Ruta de Dios",
  voice: "Nada se alcanza por un menú: cada umbral se camina, se navega o se cruza.",
  postgameSwitch: POSTGAME,
  counterVariable: COUNTER,
  sealSwitchBase: SEAL_BASE,
  championSeal: SEAL_BASE + 7,
  purgeGoal: PURGE_GOAL,
  finalGoal: FINAL_GOAL,
  guarantees: {
    noTravelMenus: true,
    everyDestinationHasReturn: true,
    canLoseEveryBattle: true,
    permanentDefeatBySeal: true,
    optionalRematchByMenu: true,
    noNewSwitches: true,
    noNewVariables: true,
    oakLabKeepsOriginalTransporters: true,
    existingAssetsOnly: true,
    maxLevel: 125,
    levelCap: 150,
  },
  rifts: RIFTS,
  collapse: COLLAPSE,
  emissionsReturn: {
    note: "Cada emisión conserva su salida a la gruta y gana una salida nueva al mundo.",
    exitName: "PokeMod Grieta: Volver al mundo",
    exitMessage: "El aire se cierra detrás de ti como una herida que por fin cicatriza.",
  },
  falda: {
    mapId: 2021,
    eventName: "PokeMod Multiverso: Bajar al laboratorio",
    newName: "PokeMod Grieta: Volver al mundo",
    message: "El sendero baja hasta la torre que abrió la primera grieta.",
  },
  darkLeague: DARK_LEAGUE,
  atlas: ATLAS,
  mirror: MIRROR,
  oakLab: OAK_LAB,
};

// --------------------------------------------------------------- validación
const INSTALLED = fs.existsSync(OUT);

function validate() {
  const errors = [];
  const species = symbolsOf("species.dat");
  const items = symbolsOf("items.dat");
  const trainerTypes = symbolsOf("trainer_types.dat");
  const characterDir = path.join(ROOT, "pokemon_fire_ash", "Graphics", "Characters");
  const multiverse = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "multiverse_creepypasta.json"), "utf8"));
  const emissionById = new Map(multiverse.maps.map((entry) => [entry.mapId, entry]));
  const bossByMap = new Map(multiverse.bosses.map((entry) => [entry.mapId, entry]));

  const at = (message) => errors.push(message);

  if (RIFTS.length !== PURGE_GOAL) at(`hay ${RIFTS.length} grietas y la meta son ${PURGE_GOAL}`);
  const worldSeen = new Set();
  for (const rift of RIFTS) {
    if (!mapExists(rift.world.mapId)) at(`${rift.id}: el mapa del mundo ${rift.world.mapId} no existe`);
    if (worldSeen.has(rift.world.mapId)) at(`${rift.id}: el mapa ${rift.world.mapId} ya tiene otra grieta`);
    worldSeen.add(rift.world.mapId);
    const emission = emissionById.get(rift.emissionMap);
    if (!emission) at(`${rift.id}: el mapa de emisión ${rift.emissionMap} no está en el catálogo del Monte Silver`);
    const boss = bossByMap.get(rift.emissionMap);
    if (!boss) at(`${rift.id}: ${rift.emissionMap} no tiene jefe en el catálogo`);
    if (boss && boss.name !== rift.boss) at(`${rift.id}: el jefe de ${rift.emissionMap} es ${boss.name}, no ${rift.boss}`);
    if (boss && SEAL_BASE + boss.zone !== rift.seal) at(`${rift.id}: el sello ${rift.seal} no coincide con la zona ${boss.zone}`);
    if (rift.seal >= SEAL_BASE + 7) at(`${rift.id}: invade el sello del campeón`);
  }
  if (!mapExists(COLLAPSE.mapId)) at(`el punto de colapso ${COLLAPSE.mapId} no existe`);
  if (worldSeen.has(COLLAPSE.mapId)) at("el punto de colapso repite el mapa de una grieta");
  if (!mapExists(COLLAPSE.targetMap)) at(`el destino del colapso ${COLLAPSE.targetMap} no existe`);

  for (const spec of DARK_LEAGUE.maps) {
    if (!mapExists(spec.template)) at(`la plantilla ${spec.template} de la Liga Oscura no existe`);
    // Solo se exige que el ID esté libre la primera vez: en una reinstalación los mapas ya son nuestros.
    if (!INSTALLED && mapExists(spec.mapId)) at(`el mapa ${spec.mapId} ya existe (IDs nuevos: 2191-2194)`);
  }
  if (!mapExists(DARK_LEAGUE.gate.mapId)) at(`la cumbre ${DARK_LEAGUE.gate.mapId} no existe`);
  for (const battle of DARK_LEAGUE.battles) {
    if (!trainerTypes.has(battle.type)) at(`${battle.name}: el tipo de entrenador ${battle.type} no existe`);
    if (!items.has(battle.reward)) at(`${battle.name}: la recompensa ${battle.reward} no existe`);
    if (!fs.existsSync(path.join(characterDir, `${battle.sprite}.png`))) at(`${battle.name}: falta el sprite ${battle.sprite}.png`);
    if (battle.team.length > 6) at(`${battle.name}: más de seis Pokémon`);
    for (const [name, level] of battle.team) {
      if (!species.has(name)) at(`${battle.name}: la especie ${name} no existe`);
      if (level > CATALOG.guarantees.levelCap) at(`${battle.name}: ${name} supera el tope de nivel`);
    }
  }

  if (!mapExists(ATLAS.captainMap)) at("no existe Ciudad Carmín (mapa 108)");
  if (!mapExists(ATLAS.portMap)) at("no existe Puerto Horizonte (mapa 1001)");
  if (!mapExists(ATLAS.dock.template)) at(`la plantilla del muelle ${ATLAS.dock.template} no existe`);
  if (!INSTALLED && mapExists(ATLAS.dock.mapId)) at(`el mapa ${ATLAS.dock.mapId} ya existe`);

  if (!mapExists(MIRROR.mansionMap)) at("no existe la Mansión Pokémon B1F (mapa 192)");
  if (!mapExists(MIRROR.basement.template)) at("la plantilla del sótano no existe");
  if (!INSTALLED && mapExists(MIRROR.basement.mapId)) at(`el mapa ${MIRROR.basement.mapId} ya existe`);
  if (!mapExists(MIRROR.islandMap)) at("no existe el atrio de la Isla Espejo (mapa 997)");

  if (!mapExists(OAK_LAB.mapId)) at("no existe el laboratorio de Oak (mapa 48)");
  if (!fs.existsSync(path.join(characterDir, `${OAK_LAB.sprite}.png`))) at(`falta el sprite de Oak ${OAK_LAB.sprite}.png`);

  const newIds = [ATLAS.dock.mapId, ...DARK_LEAGUE.maps.map((entry) => entry.mapId), MIRROR.basement.mapId];
  if (new Set(newIds).size !== newIds.length) at("los IDs nuevos se repiten");
  for (const id of newIds) if (!INSTALLED && mapExists(id)) at(`el ID ${id} ya está ocupado`);

  if (errors.length) throw new Error(`Expansión Multiversal inválida (${errors.length}):\n- ${errors.join("\n- ")}`);
  return true;
}

function check() {
  if (!fs.existsSync(OUT)) throw new Error(`Falta ${path.relative(ROOT, OUT)} (ejecuta sin --check)`);
  const stored = JSON.parse(fs.readFileSync(OUT, "utf8"));
  // Los mapas nuevos dejan de existir una vez instalados: se comparan sin esa
  // comprobación, que solo aplica antes de escribir.
  const strip = (value) => JSON.stringify({ ...value, darkLeague: { ...value.darkLeague, maps: value.darkLeague.maps.map(({ mapId }) => ({ mapId })) }, atlas: { ...value.atlas, dock: { mapId: value.atlas.dock.mapId } }, mirror: { ...value.mirror, basement: { mapId: value.mirror.basement.mapId } } });
  if (strip(stored) !== strip(CATALOG)) throw new Error("El plano guardado no coincide con el generador (ejecuta sin --check)");
  return true;
}

validate();
if (CHECK_ONLY) check(); else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(CATALOG, null, 2)}\n`);
}
console.log(`Expansión Multiversal OK: ${RIFTS.length} grietas purgables, punto de colapso,` +
  ` Liga Oscura (${DARK_LEAGUE.maps.length} mapas, ${DARK_LEAGUE.battles.length} combates),` +
  ` expedición a Atlas Mil, espejo de Isla Canela y laboratorio de Oak sin cápsula nueva.` +
  ` Sin switches ni variables nuevas.`);
if (!CHECK_ONLY) console.log(`Escrito: ${path.relative(ROOT, OUT)}`);
