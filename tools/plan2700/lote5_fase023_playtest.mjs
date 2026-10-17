#!/usr/bin/env node
/**
 * Construye la matriz de cobertura para las sesiones 6–60 de la tanda 23.
 * Es evidencia estática: no simula una partida ni inventa capturas.
 */
import fs from "node:fs";
import path from "node:path";
import { marshalLoad, RString } from "../../web/js/marshal.js";
import { cmdOf, mapListFromInfos, parseEvent, parseMap } from "../../web/js/rmxp.js";

const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
const DATA = path.join(ROOT, "pokemon_fire_ash", "Data");
const OUT = path.join(ROOT, "content", "lote5_fase023_playtest.json");
const VERIFY = process.argv.includes("--verify");
const titles = [
  [6, "las siete grietas y su aviso de Entrar o Retirarse", "postgame"],
  [7, "las siete emisiones en orden natural y su purga", "emisiones"],
  [8, "las siete emisiones en orden inverso y su purga", "emisiones"],
  [9, "punto de colapso y subida a la falda del Monte Silver", "ruta_de_dios"],
  [10, "cumbre, Red y su combate", "ruta_de_dios"],
  [11, "Liga Oscura con siete sellos y Diploma", "liga_oscura"],
  [12, "entrada a Atlas y primer lote de franjas", "atlas"],
  [13, "ocho gimnasios de Atlas y sus puzles", "atlas"],
  [14, "anclas Tier 1 y su narración", "atlas"],
  [15, "ciudad Teckel y la escena de Maxine", "teckel"],
  [16, "Isla Espejo y captura de un Pokégod por forma", "isla_espejo"],
  [17, "barco a Glazed y primera ciudad", "glazed"],
  [18, "Glazed de punta a punta y su campeón", "glazed"],
  [19, "barco a Light Platinum y su capital", "light_platinum"],
  [20, "Light Platinum de punta a punta y su campeón", "light_platinum"],
  [21, "Liquid Crystal de punta a punta y su campeón", "liquid_crystal"],
  [22, "TFOH de punta a punta y su cierre narrativo", "tfoh"],
  [23, "Unbound de punta a punta y su campeón", "unbound"],
  [24, "cinco misiones de Team Rocket en una partida", "team_rocket"],
  [25, "disfraz puesto y quitado dentro de la base", "team_rocket"],
  [26, "movimientos de campo sin medallas", "sistemas"],
  [27, "mochila libre en cada tipo de combate", "sistemas"],
  [28, "menú Z y menú de estado tras desbloqueos", "sistemas"],
  [29, "guardar y cargar dentro de cada dimensión", "guardado"],
  [30, "perder contra cada jefe final y reintentar", "combates"],
  [31, "abandonar cada región a mitad y retomar", "transiciones"],
  [32, "DLC completo sin guía externa", "cobertura"],
  [33, "ventana pequeña de escritorio", "interfaz"],
  [34, "pantalla completa de escritorio", "interfaz"],
  [35, "mando", "input"],
  [36, "teclado", "input"],
  [37, "Android con Kirin", "android"],
  [38, "APK de PokeMod Studio en paralelo", "editor"],
  [39, "deshacer y rehacer sobre un mapa del DLC", "editor"],
  [40, "auditoría del editor sobre contenido nuevo", "editor"],
  [41, "exportación ZIP y reimportación", "editor"],
  [42, "modo lectura sin permisos de escritura", "editor"],
  [43, "partida larga de cuatro horas", "estrés"],
  [44, "guardado muy antiguo del juego original", "compatibilidad"],
  [45, "partida nueva hasta postgame sin atajos", "duración"],
  [46, "estrés de apertura y cierre de menús", "menús"],
  [47, "estrés de surf y buceo", "campo"],
  [48, "pesca en mapas nuevos", "encuentros"],
  [49, "vuelo y teletransporte", "navegación"],
  [50, "día y noche en ciudades nuevas", "tiempo"],
  [51, "clima extremo y rendimiento", "rendimiento"],
  [52, "niebla en interiores y exteriores", "render"],
  [53, "restauración del tono de pantalla", "render"],
  [54, "transiciones de batalla nuevas", "combate"],
  [55, "animaciones de jefes nuevos", "combate"],
  [56, "recompensas únicas tras completar", "recompensas"],
  [57, "revancha contra jefes disponibles", "revancha"],
  [58, "derrota contra jefes obligatorios", "combates"],
  [59, "huida y captura en combates especiales", "combates"],
  [60, "partida de cierre desde arranque hasta último diploma", "cierre"],
];
const mapInfos = mapListFromInfos(marshalLoad(fs.readFileSync(path.join(DATA, "MapInfos.rxdata"))));
const maps = [];
let events = 0;
let boxes = 0;
const profiles = {};
for (const info of mapInfos) {
  const file = path.join(DATA, `Map${String(info.id).padStart(3, "0")}.rxdata`);
  if (!fs.existsSync(file)) continue;
  const parsed = parseMap(marshalLoad(fs.readFileSync(file)));
  let mapEvents = 0;
  for (const entry of parsed.events) {
    const event = parseEvent(entry.obj);
    if (!event.name.startsWith("PokeMod")) continue;
    mapEvents += 1; events += 1;
    for (const page of event.pages) for (let i = 0; i < (page.list ?? []).length; i += 1) {
      if (cmdOf(page.list[i]).code === 101) boxes += 1;
    }
  }
  if (mapEvents) maps.push({ id: info.id, name: info.name, events: mapEvents });
  const profile = info.id >= 1021 && info.id <= 2020 ? "atlas" : info.id >= 2040 && info.id <= 2194 ? "nightmare" : info.id >= 3000 && info.id <= 3110 ? "glazed" : info.id >= 3120 && info.id <= 3138 ? "light_platinum" : info.id >= 3200 && info.id <= 3631 ? "liquid_crystal" : info.id >= 3700 && info.id <= 3944 ? "tfoh" : info.id >= 4000 && info.id <= 4419 ? "unbound" : "base_dlc";
  profiles[profile] ??= { maps: 0, events: 0 };
  profiles[profile].maps += mapEvents ? 1 : 0;
  profiles[profile].events += mapEvents;
}
const sessions = titles.map(([id, title, lane]) => ({
  id,
  title,
  lane,
  status: "manual_pending",
  folder: `docs/qa/playtest/sesion-${String(id).padStart(2, "0")}`,
  required: ["fecha", "version_commit", "entorno", "duracion_minutos", "mapas_visitados", "eventos_ejecutados", "dialogos_mostrados", "hallazgos", "capturas"],
}));
const report = {
  schema: "lote5_fase023_playtest/1.0",
  fase: "023",
  scope: "tareas 2200–2299",
  status: "manual_pending",
  source: "pokemon_fire_ash/Data/MapInfos.rxdata + Map*.rxdata",
  staticInventory: { mapsWithPokeMod: maps.length, events, dialogBoxes: boxes, profiles },
  sessions,
  coverage: {
    mapIds: maps.map((map) => map.id),
    target: "100% del contenido que corresponda a cada guion; registrar mapa, evento y diálogo, no solo duración",
    dimensions: ["postgame", "emisiones", "atlas", "teckel", "isla_espejo", "glazed", "light_platinum", "liquid_crystal", "tfoh", "unbound"],
  },
  severity: ["bloqueante", "grave", "leve", "cosmético"],
  environments: ["escritorio ventana", "escritorio pantalla completa", "mando", "teclado", "Android/Kirin", "PokeMod Studio/editor"],
  policy: "Una ficha manual_pending no es PASS; no se fabrican partidas, capturas, tiempos ni cobertura humana.",
};
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (VERIFY) {
  if (!fs.existsSync(OUT)) throw new Error(`Falta ${path.relative(ROOT, OUT)}`);
  if (fs.readFileSync(OUT, "utf8") !== serialized) throw new Error(`${path.relative(ROOT, OUT)} está desactualizado`);
} else fs.writeFileSync(OUT, serialized);
console.log(`FASE 023 playtest: ${sessions.length} sesiones · ${maps.length} mapas · ${events} eventos · estado manual_pending`);
