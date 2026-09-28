#!/usr/bin/env node
/**
 * Autoriza el catálogo de la capa "Fire Ash: A Través del Multiverso —
 * Emisiones Prohibidas del Monte Silver": el monte es visitable en el
 * postgame y custodia siete dimensiones inspiradas en los cuentos creepypasta
 * de Pokémon, reinterpretados con voz propia del mundo (homenajes; se conserva
 * la esencia de cada cuento sin copiar textos ni personajes ajenos).
 *
 * Escribe: content/multiverse_creepypasta.json
 * Uso:    node tools/create_multiverse_creepypasta.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const catalog = {
  title: "Fire Ash: A Través del Multiverso — Emisiones Prohibidas del Monte Silver",
  voice: "Las historias que nadie se atrevió a contar se congelan en el Monte Silver. El Archivero Prohibido custodia las emisiones: lugares que existen cuando alguien susurra un cuento prohibido. Homenajes reinterpretados; esencia preservada; voz propia.",
  postgameSwitch: 429,
  sealSwitchBase: 868,
  counterVariable: 264,
  returnToLab: { map: 48, near: [10, 16] },
  maps: [
    { mapId: 2021, title: "Monte Silver — Falda", template: 49, role: "falda", anchor: [17, 14] },
    { mapId: 2022, title: "Monte Silver — Cumbre", template: 508, role: "cumbre", anchor: [16, 10] },
    { mapId: 2023, title: "La Torre que Escuchaba", template: 143, role: "emision", zone: 0, anchor: [12, 12] },
    { mapId: 2024, title: "La Partida Perdida", template: 201, role: "emision", zone: 1, anchor: [16, 10] },
    { mapId: 2025, title: "La Fosa del Enterrado", template: 303, role: "emision", zone: 2, anchor: [15, 12] },
    { mapId: 2026, title: "La Cinta Carmesí", template: 139, role: "emision", zone: 3, anchor: [20, 15] },
    { mapId: 2027, title: "Ciudad Glitch", template: 137, role: "emision", zone: 4, anchor: [21, 18] },
    { mapId: 2028, title: "El Eco que Jugó Contigo", template: 638, role: "emision", zone: 5, anchor: [15, 12] },
    { mapId: 2029, title: "La Consola de 1996", template: 139, role: "emision", zone: 6, anchor: [20, 15] },
  ],
  archivist: {
    sprite: "trchar028",
    lines: [
      "Soy el Archivero Prohibido. En esta montaña se congelan las historias que nadie se atrevió a terminar.",
      "Las llamo emisiones: lugares que aparecen cuando alguien susurra un cuento prohibido. Siete siguen activas.",
      "Sube a la cumbre: las puertas te esperan. Si algo te derrota, puedes curarte y volver a intentarlo; si ganas, esa emisión queda en silencio para siempre.",
    ],
  },
  signs: {
    falda: ["MONTE SILVER — La montaña de las historias sin testigos.", "Una placa añadida a mano: «Lo que aquí se cuenta, no se cuenta dos veces»."],
    cumbre: ["CUMBRE DEL MONTE SILVER — Aquí solo hablan las batallas.", "Siete puertas de niebla. Un entrenador de gorra roja las mira en silencio."],
  },
  champion: {
    id: "red", zone: 7, mapId: 2022,
    name: "RED",
    type: "CHAMPION_Red",
    sprite: "trchar137",
    label: "El Campeón Silencioso",
    intro: [
      "Un entrenador con gorra roja aguarda en la cumbre, junto a su Pikachu.",
      "No dice una sola palabra. Señala su equipo y asiente.",
    ],
    win: "El campeón asiente una vez. En su silencio hay respeto.",
    loss: "El campeón señala el camino de vuelta con la cabeza. La Mochila te acompaña: usa lo que necesites.",
    rematch: "El campeón acomoda su gorra. ¿Otra batalla en silencio?",
    team: [["PIKACHU", 108], ["VENUSAUR", 106], ["CHARIZARD", 106], ["BLASTOISE", 106], ["LAPRAS", 105], ["SNORLAX", 107]],
    reward: "LEFTOVERS",
    atmosphere: ["El viento de la cumbre no hace ruido alrededor de él."],
  },
  bosses: [
    {
      id: "locutora", zone: 0, mapId: 2023,
      name: "LA LOCUTORA", type: "PSYCHIC_F", sprite: "MISMAGIUS", label: "La Torre que Escuchaba",
      homage: "Lavender Town Syndrome",
      intro: [
        "La torre emite una canción que ningún altavoz reproduce.",
        "Una voz la canta desde un piso que la torre no tiene.",
        "LA LOCUTORA: No cierres los oídos. La canción ya te eligió.",
      ],
      win: "La canción se detiene. La torre, por primera vez, suena a silencio.",
      loss: "La voz ríe sin hacer ruido. Puedes recuperarte y volver a escuchar.",
      rematch: "LA LOCUTORA: ¿Quieres oír la canción completa otra vez?",
      team: [["CHANDELURE", 102], ["MISMAGIUS", 101], ["GENGAR", 103], ["DRIFBLIM", 100], ["BANETTE", 100], ["FROSLASS", 101]],
      reward: "CLEANSETAG",
      atmosphere: ["Un memorial sin nombres. La música se grabó con voces que ya no responden."],
    },
    {
      id: "plata", zone: 1, mapId: 2024,
      name: "PLATA PERDIDA", type: "POKEMONTRAINER_Silver", sprite: "trchar142", label: "La Partida Perdida",
      homage: "Lost Silver",
      intro: [
        "Un entrenador camina en círculos sobre la nieve. Su ficha no tiene nombre.",
        "Cada vez que completa el camino, vuelve a empezar. No parece sufrirlo.",
        "PLATA PERDIDA: He ganado y perdido esta batalla miles de veces. Ayúdame a que esta sea la última.",
      ],
      win: "El entrenador mira a su equipo y sonríe, como si recordara algo que era suyo.",
      loss: "El camino se borra tras sus pasos. No importa: siempre puedes volver a encontrarlo.",
      rematch: "PLATA PERDIDA: El camino sigue aquí. ¿Recorremos la batalla una vez más?",
      team: [["NOCTOWL", 100, null, true], ["MAROWAK", 102], ["UMBREON", 101], ["GENGAR", 103], ["FROSLASS", 101], ["SPIRITOMB", 104]],
      reward: "ODDKEYSTONE",
      atmosphere: ["Nieve que registra pasos que nadie dio."],
    },
    {
      id: "enterrado", zone: 2, mapId: 2025,
      name: "EL ENTERRADO", type: "HIKER", sprite: "MAROWAK", label: "La Fosa del Enterrado",
      homage: "Buried Alive",
      intro: [
        "Alguien excavó aquí donde no debía. La tierra todavía respira.",
        "EL ENTERRADO: Bajé buscando tesoros. La fosa decidió quedarse conmigo.",
        "No vengo a herirte: vengo a comprobar si todavía eres tú quien baja.",
      ],
      win: "La fosa se cierra sobre un suspiro antiguo. La tierra por fin descansa.",
      loss: "La tierra te empuja hacia la salida. Curar, respirar, volver: la fosa respeta los turnos.",
      rematch: "EL ENTERRADO: ¿Vuelves a mirar hacia dentro?",
      team: [["MAROWAK", 103], ["GOLURK", 105], ["COFAGRIGUS", 103], ["DUSKNOIR", 104], ["SABLEYE", 101], ["SPIRITOMB", 105]],
      reward: "SPELLTAG",
      atmosphere: ["Aquí el suelo se tragó una promesa. No la busques."],
    },
    {
      id: "cinta", zone: 3, mapId: 2026,
      name: "EL NIÑO DE LA CINTA", type: "YOUNGSTER", sprite: "MIMIKYU", label: "La Cinta Carmesí",
      homage: "Strangled Red",
      intro: [
        "Una consola roja sigue encendida desde hace mucho más tiempo del que debería.",
        "EL NIÑO DE LA CINTA: Mi partida se guardó dentro de la cinta. Yo me quedé fuera.",
        "Su compañero nunca apareció... pero algo de él se niega a apagar la pantalla.",
      ],
      win: "La pantalla parpadea: PARTIDA GUARDADA. El niño asiente, aliviado.",
      loss: "La cinta rebobina el combate. Puedes intentarlo cuando quieras.",
      rematch: "EL NIÑO DE LA CINTA: ¿Jugamos una partida amistosa? Sin guardar resultado.",
      team: [["PORYGONZ", 104], ["MAGNEZONE", 103], ["METAGROSS", 106], ["ROTOM", 102], ["ELECTRODE", 101], ["DITTO", 102]],
      reward: "FLAMEORB",
      atmosphere: ["Una cinta carmesí con una sola letra grabada a mano."],
    },
    {
      id: "fallo", zone: 4, mapId: 2027,
      name: "EL FALLO CERO", type: "SCIENTIST", sprite: "PORYGON2", label: "Ciudad Glitch",
      homage: "Glitch City",
      intro: [
        "Las calles se repiten, se cortan y se ordenan al revés. El mapa dice una cosa; tus ojos, otra.",
        "EL FALLO CERO: Esta ciudad no se rompió: se desbordó. Demasiadas historias en un mismo hueco.",
        "Mi trabajo era corregirla. Terminé formando parte del error.",
      ],
      win: "Las calles encajan durante un segundo. Suficiente para salir caminando.",
      loss: "La ciudad te devuelve al principio de la cuadra. Sin más daño que el orgullo.",
      rematch: "EL FALLO CERO: ¿Corremos el error una vez más?",
      team: [["PORYGON2", 103], ["PORYGONZ", 105], ["MUK", 102], ["ELECTRODE", 102], ["DITTO", 103], ["UNOWN", 101, null, true]],
      reward: "GHOSTGEM",
      atmosphere: ["Este cartel cambia cuando no lo miras."],
    },
    {
      id: "eco", zone: 5, mapId: 2028,
      name: "EL ECO AHOGADO", type: "SWIMMER_M", sprite: "JELLICENT", label: "El Eco que Jugó Contigo",
      homage: "el eco de una partida que se niega a desaparecer",
      intro: [
        "El agua de esta gruta repite los movimientos que hiciste hace un rato... con unos segundos de retraso.",
        "EL ECO AHOGADO: Alguien jugó aquí antes que tú. Su partida sigue reflejándose.",
        "No me preguntes mi nombre: se lo quedó el reflejo.",
      ],
      win: "El reflejo te imita una última vez... y saluda antes de disolverse.",
      loss: "El eco repite tu derrota como si fuera un juego. Toma tu tiempo y vuelve.",
      rematch: "EL ECO AHOGADO: Enséñame ese movimiento otra vez.",
      team: [["JELLICENT", 104], ["FROSLASS", 103], ["GENGAR", 105], ["MISMAGIUS", 103], ["SPIRITOMB", 106], ["DUSKNOIR", 104]],
      reward: "SPOOKYPLATE",
      atmosphere: ["El agua está quieta. Tus reflejos, no."],
    },
    {
      id: "consola", zone: 6, mapId: 2029,
      name: "EL JUGADOR DE 1996", type: "SUPERNERD", sprite: "ROTOM", label: "La Consola de 1996",
      homage: "la cartucho embrujada",
      intro: [
        "Una consola antigua muestra una partida que nadie está jugando.",
        "EL JUGADOR DE 1996: Llevo desde 1996 esperando a alguien que terminara este combate.",
        "No soy el jugador: soy lo que la partida dejó cuando el jugador se fue.",
      ],
      win: "La pantalla muestra dos palabras: FIN DE PARTIDA. Y por fin se apaga.",
      loss: "La partida se reinicia. Por suerte, tú también puedes.",
      rematch: "EL JUGADOR DE 1996: Una partida más. Las máquinas no nos cansamos.",
      team: [["PORYGONZ", 105], ["ROTOM", 104], ["GENGAR", 105], ["CHANDELURE", 104], ["BANETTE", 103], ["DUSKNOIR", 105]],
      reward: "LIFEORB",
      atmosphere: ["Una etiqueta escrita a mano: «NO BORRAR»."],
    },
  ],
  guarantees: {
    bagAlwaysAvailable: true,
    canLoseEveryBattle: true,
    permanentDefeat: true,
    optionalRematchByMenu: true,
    freeReturn: true,
    rewardOnce: true,
    maxLevel: 150,
    existingAssetsOnly: true,
    reinterpretedHomagesOnly: true,
  },
};

const target = path.join(ROOT, "content", "multiverse_creepypasta.json");
fs.writeFileSync(target, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Catálogo escrito en ${path.relative(ROOT, target)}: 9 mapas, ${catalog.bosses.length + 1} batallas, ${catalog.bosses.length} emisiones creepypasta + el Campeón Silencioso.`);
