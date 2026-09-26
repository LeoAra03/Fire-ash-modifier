// ============================================================================
// demo.js — Proyecto RMXP procedural en memoria (para probar sin el juego)
// ----------------------------------------------------------------------------
// Genera Data/*.rxdata válidos + PBS + PNGs (tileset, autotiles, personajes)
// dibujados por código. Sirve para: probar la app, capturas y tests.
// ============================================================================
import { marshalDump, RString, RObject, RUserDef, RHash } from "./marshal.js";
import { tableToUserDef } from "./rmxp.js";
import { zlibDeflate } from "./util.js";

const S = (s) => RString.fromText(s);

function audioFile(name = "") {
  return new RObject("RPG::AudioFile", [["@name", S(name)], ["@volume", 100], ["@pitch", 100]]);
}
function condition(o = {}) {
  return new RObject("RPG::Event::Page::Condition", [
    ["@switch1_valid", !!o.sw1], ["@switch1_id", o.sw1 || 1],
    ["@switch2_valid", !!o.sw2], ["@switch2_id", o.sw2 || 1],
    ["@variable_valid", !!o.var], ["@variable_id", o.var || 1], ["@variable_value", o.varVal || 0],
    ["@self_switch_valid", !!o.self], ["@self_switch_ch", S(o.self || "A")],
  ]);
}
function graphic(charName = "", tileId = 0, dir = 2, pat = 1) {
  return new RObject("RPG::Event::Page::Graphic", [
    ["@tile_id", tileId], ["@character_name", S(charName)], ["@character_hue", 0],
    ["@direction", dir], ["@pattern", pat], ["@opacity", 255], ["@blend_type", 0],
  ]);
}
function moveRoute(list = []) {
  return new RObject("RPG::MoveRoute", [["@repeat", true], ["@skippable", false], ["@list", list]]);
}
function moveCmd(code, params = []) {
  return new RObject("RPG::MoveCommand", [["@code", code], ["@parameters", params]]);
}
function cmd(code, params = [], indent = 0) {
  return new RObject("RPG::EventCommand", [["@code", code], ["@indent", indent], ["@parameters", params]]);
}
function page({ cond, gfx, trigger = 0, list = [cmd(0)], moveType = 0 } = {}) {
  return new RObject("RPG::Event::Page", [
    ["@condition", cond || condition()],
    ["@graphic", gfx || graphic()],
    ["@move_type", moveType], ["@move_speed", 3], ["@move_frequency", 3],
    ["@move_route", moveRoute()], ["@walk_anime", true], ["@step_anime", false],
    ["@direction_fix", false], ["@through", false], ["@always_on_top", false],
    ["@trigger", trigger], ["@list", list],
  ]);
}
function event(id, name, x, y, pages) {
  return new RObject("RPG::Event", [["@id", id], ["@name", S(name)], ["@x", x], ["@y", y], ["@pages", pages]]);
}
function textCmds(lines, face = "") {
  const out = [cmd(101, [S(face), 0, 0, 2])];
  for (const l of lines) out.push(cmd(401, [S(l)]));
  return out;
}

function makeTable(x, y, z, fill) {
  const data = new Uint16Array(x * y * z);
  data.fill(fill);
  return tableToUserDef({ dim: z > 1 ? 3 : 2, x, y, z, data });
}
function setTile(ud, x, y, z, v, W, H) {
  // escribe directo en el UserDef Table (x = W, y = H)
  const dv = new DataView(ud.bytes.buffer, ud.bytes.byteOffset, ud.bytes.byteOffset + ud.bytes.byteLength);
  const idx = x + W * (y + H * z);
  dv.setUint16(20 + idx * 2, v, true);
}

function makeMap(tilesetId, W, H, events) {
  const data = makeTable(W, H, 3, 0);
  // suelo de hierba (autotile 1 → id 96+patron "lleno"=96)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) setTile(data, x, y, 0, 96, W, H);
  const evHash = new RHash(events.map((e) => [e.getIvar("@id"), e]));
  return new RObject("RPG::Map", [
    ["@tileset_id", tilesetId], ["@width", W], ["@height", H],
    ["@autoplay_bgm", false], ["@bgm", audioFile()],
    ["@autoplay_bgs", false], ["@bgs", audioFile()],
    ["@encounter_list", []], ["@encounter_step", 30],
    ["@data", data], ["@events", evHash],
  ]);
}

// --- PNGs procedurales ------------------------------------------------------------
function canvasToPngBytes(cv) {
  return new Promise((res, rej) => cv.toBlob(async (b) => {
    if (!b) return rej(new Error("toBlob falló"));
    res(new Uint8Array(await b.arrayBuffer()));
  }, "image/png"));
}

function drawDemoTileset() {
  const cv = document.createElement("canvas");
  cv.width = 256; cv.height = 256;
  const g = cv.getContext("2d");
  const pal = ["#5da24a", "#c9a86a", "#7ec850", "#8a6f4d", "#b03a2e", "#f0e6d2", "#4a6fa5", "#6e6e6e"];
  for (let ty = 0; ty < 8; ty++) {
    for (let tx = 0; tx < 8; tx++) {
      const x = tx * 32, y = ty * 32;
      g.fillStyle = pal[(tx + ty * 3) % pal.length];
      g.fillRect(x, y, 32, 32);
      g.fillStyle = "rgba(0,0,0,.18)";
      for (let i = 0; i < 8; i++) g.fillRect(x + ((tx * 7 + ty * 13 + i * 5) % 28), y + ((i * 11 + tx) % 28), 3, 3);
      g.strokeStyle = "rgba(0,0,0,.35)";
      g.strokeRect(x + 0.5, y + 0.5, 31, 31);
      g.fillStyle = "rgba(255,255,255,.75)";
      g.font = "9px monospace";
      g.fillText(String(tx + ty * 8), x + 3, y + 12);
    }
  }
  return cv;
}

function drawDemoAutotile(base, wave) {
  const cv = document.createElement("canvas");
  cv.width = 96; cv.height = 128;
  const g = cv.getContext("2d");
  g.fillStyle = base;
  g.fillRect(0, 0, 96, 128);
  g.strokeStyle = wave;
  g.lineWidth = 2;
  for (let y = 4; y < 128; y += 10) {
    g.beginPath();
    for (let x = 0; x <= 96; x += 8) g.lineTo(x, y + ((x / 8 + y) % 2 ? 1.5 : -1.5));
    g.stroke();
  }
  g.fillStyle = "rgba(255,255,255,.25)";
  for (let i = 0; i < 40; i++) g.fillRect((i * 37) % 94, (i * 53) % 126, 2, 2);
  return cv;
}

function drawDemoChar(shirt, skin = "#f2c89b", hair = "#4a2f1d") {
  const cv = document.createElement("canvas");
  cv.width = 128; cv.height = 192;
  const g = cv.getContext("2d");
  // 4 filas (abajo, izq, der, arriba) × 4 frames 32x48
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const x = col * 32, y = row * 48;
      const step = col === 0 ? -2 : col === 2 ? 2 : 0;
      // sombra
      g.fillStyle = "rgba(0,0,0,.25)";
      g.beginPath(); g.ellipse(x + 16, y + 44, 10, 3, 0, 0, 7); g.fill();
      // piernas
      g.fillStyle = "#33415c";
      g.fillRect(x + 10 + step, y + 32, 5, 11);
      g.fillRect(x + 17 - step, y + 32, 5, 11);
      // cuerpo
      g.fillStyle = shirt;
      g.fillRect(x + 8, y + 18, 16, 15);
      // cabeza
      g.fillStyle = skin;
      g.fillRect(x + 9, y + 6, 14, 13);
      // pelo
      g.fillStyle = hair;
      g.fillRect(x + 9, y + 4, 14, 5);
      if (row === 3) g.fillRect(x + 9, y + 4, 14, 12); // de espaldas: todo pelo
      // ojos (no de espaldas)
      if (row !== 3) {
        g.fillStyle = "#222";
        if (row === 0) { g.fillRect(x + 12, y + 11, 2, 3); g.fillRect(x + 18, y + 11, 2, 3); }
        else if (row === 1) { g.fillRect(x + 11, y + 11, 2, 3); }
        else { g.fillRect(x + 19, y + 11, 2, 3); }
      }
    }
  }
  return cv;
}

// --- Proyecto -----------------------------------------------------------------------
export async function buildDemoProject() {
  const mem = new Map();
  const putRx = (rel, obj) => mem.set(rel, marshalDump(obj));
  const putTxt = (rel, txt) => mem.set(rel, new TextEncoder().encode(txt));

  // -- Tilesets: [null, set1]
  const N = 64; // 8x8 tiles normales
  const passages = new Uint16Array(384 + N);
  const priorities = new Uint16Array(384 + N);
  const terrain = new Uint16Array(384 + N);
  // tejado (tiles 8..15) con prioridad 1 (encima del jugador)
  for (let i = 8; i < 16; i++) { priorities[384 + i] = 1; passages[384 + i] = 0x0f; }
  const ts = new RObject("RPG::Tileset", [
    ["@id", 1], ["@name", S("Demo Interior/Ext")],
    ["@tileset_name", S("DemoTiles")],
    ["@autotile_names", [S("DemoAgua"), S("DemoHierba"), S(""), S(""), S(""), S(""), S("")]],
    ["@panorama_name", S("")], ["@panorama_hue", 0],
    ["@fog_name", S("")], ["@fog_hue", 0], ["@fog_opacity", 0], ["@fog_blend_type", 0], ["@fog_zoom", 100], ["@fog_sx", 0], ["@fog_sy", 0],
    ["@battleback_name", S("")],
    ["@passages", tableToUserDef({ dim: 1, x: 384 + N, y: 1, z: 1, data: passages })],
    ["@priorities", tableToUserDef({ dim: 1, x: 384 + N, y: 1, z: 1, data: priorities })],
    ["@terrain_tags", tableToUserDef({ dim: 1, x: 384 + N, y: 1, z: 1, data: terrain })],
  ]);
  putRx("Data/Tilesets.rxdata", [null, ts]);

  // -- System (nombres)
  const sw = [S("")];
  const swNames = ["", "Intro terminada", "Tiene Pokédex", "Jefe vencido", "Llave conseguida", "Evento noche"];
  for (let i = 1; i <= 200; i++) sw.push(S(swNames[i] || ""));
  const va = [S("")];
  const vaNames = ["", "Medallas", "Dinero extra", "Contador bichos"];
  for (let i = 1; i <= 200; i++) va.push(S(vaNames[i] || ""));
  putRx("Data/System.rxdata", new RObject("RPG::System", [
    ["@switches", sw], ["@variables", va],
    ["@party_members", [1]], ["@elements", [null]], ["@windowskin_name", S("001-Blue01")],
    ["@title_name", S("Title")], ["@gameover_name", S("Gameover")],
  ]));

  // -- MapInfos
  const info = (name, parent, order) => new RObject("RPG::MapInfo", [
    ["@name", S(name)], ["@parent_id", parent], ["@order", order],
    ["@expanded", true], ["@scroll_x", 0], ["@scroll_y", 0],
  ]);
  putRx("Data/MapInfos.rxdata", new RHash([[1, info("Pueblo Demo", 0, 1)], [2, info("Ruta 1", 0, 2)], [3, info("Tienda", 1, 1)]]));

  // -- Mapa 1: Pueblo Demo
  const m1 = makeMap(1, 12, 10, [
    event(1, "Profesor", 5, 4, [page({
      gfx: graphic("DemoProfesor", 0, 2, 1),
      list: [
        ...textCmds(["¡Hola! Soy el PROFESOR DEMO.", "Esto es un diálogo editable.\\nPruébalo en la pestaña Eventos."]),
        cmd(102, [[S("Sí"), S("No"), S("Quizás")], 4]),
        cmd(402, [0, S("Sí")], 1),
        ...textCmds(["¡Genial! Activaré el interruptor 1."], "", 2),
        cmd(121, [1, 1, 1], 2),
        cmd(404, [], 1),
        cmd(402, [1, S("No")], 1),
        ...textCmds(["Oh… bueno, vuelve cuando quieras."], "", 2),
        cmd(404, [], 1),
        cmd(402, [2, S("Quizás")], 1),
        ...textCmds(["Los indecisos llegan lejos."], "", 2),
        cmd(404, [], 1),
        cmd(404, []),
        cmd(0),
      ],
    })]),
    event(2, "Cartel", 3, 2, [page({
      list: [...textCmds(["PUEBLO DEMO", "Población: 3 NPCs y tú."]), cmd(0)],
    })]),
    event(3, "Salida norte", 6, 0, [page({
      trigger: 1,
      list: [cmd(201, [0, 2, 6, 8, 8, 0]), cmd(0)],
    })]),
    event(4, "Cofre script", 8, 6, [page({
      gfx: graphic("DemoNPC", 0, 2, 1),
      list: [
        cmd(355, [S("pbReceiveItem(:POTION,3)")]),
        cmd(655, [S("pbMessage(\"¡Recibiste 3 POCIONES!\")")]),
        cmd(123, [S("A"), 1]),
        cmd(0),
      ],
    }), page({ cond: condition({ self: "A" }) })]),
  ]);
  // charco de agua (autotile 0, patrón lleno 48) y tejado con prioridad
  {
    const d = m1.getIvar("@data");
    for (let y = 7; y <= 8; y++) for (let x = 1; x <= 3; x++) setTile(d, x, y, 0, 48, 12, 10);
    for (let x = 7; x <= 9; x++) setTile(d, x, 1, 1, 384 + 8, 12, 10);
  }
  putRx("Data/Map001.rxdata", m1);

  // -- Mapa 2: Ruta 1
  const m2 = makeMap(1, 14, 12, [
    event(1, "NPC Ruta", 7, 5, [page({
      gfx: graphic("DemoNPC", 0, 4, 1), moveType: 1,
      list: [...textCmds(["Dicen que al norte hay un pueblo.", "Yo me quedo aquí, patrullando."]), cmd(0)],
    })]),
    event(2, "Vuelta sur", 6, 11, [page({
      trigger: 1,
      list: [cmd(201, [0, 1, 6, 1, 2, 0]), cmd(0)],
    })]),
    event(3, "Condicional", 10, 3, [page({
      list: [
        cmd(111, [0, 1, 1]),
        ...textCmds(["Ya hablaste con el profesor. (Switch 1 ON)"], "").map((c, i) => { if (i > 0) c.setIvar("indent", 1); return c; }),
        cmd(411, [], 0),
        ...textCmds(["Aún no hablas con el profesor…"], "").map((c, i) => { if (i > 0) c.setIvar("indent", 1); return c; }),
        cmd(412, []),
        cmd(0),
      ],
    })]),
  ]);
  putRx("Data/Map002.rxdata", m2);

  // -- Mapa 3: Tienda
  const m3 = makeMap(1, 8, 7, [
    event(1, "Vendedora", 4, 2, [page({
      gfx: graphic("DemoNPC", 0, 2, 1),
      list: [
        ...textCmds(["¡Bienvenido a la TIENDA DEMO!", "Hoy hay 20% de descuento imaginario."]),
        cmd(302, [[[0, 1, 0], [0, 4, 0]]]),
        cmd(0),
      ],
    })]),
    event(2, "Salida", 4, 6, [page({
      trigger: 1,
      list: [cmd(201, [0, 1, 5, 5, 2, 0]), cmd(0)],
    })]),
  ]);
  putRx("Data/Map003.rxdata", m3);

  // -- PBS (formato Essentials v19.1)
  putTxt("PBS/pokemon.txt", `# Demo — formato Essentials v19
[PIKACHU]
Name = Pikachu
Types = ELECTRIC
BaseStats = 35,55,40,90,50,50
GenderRate = Female50Percent
GrowthRate = Medium
BaseExp = 112
Rareness = 190
Happiness = 70
Abilities = STATIC
HiddenAbilities = LIGHTNINGROD
Moves = 1,GROWL,1,THUNDERSHOCK,9,THUNDERWAVE
Evolutions = RAICHU,Item,THUNDERSTONE
Height = 0.4
Weight = 6.0
Color = Yellow
Shape = Quadruped
Kind = Ratón
Pokedex = Cuando se enfada, descarga la energía de sus mejillas.

[CHARIZARD]
Name = Charizard
Types = FIRE,FLYING
BaseStats = 78,84,78,100,109,85
GenderRate = FemaleOneEighth
GrowthRate = MediumSlow
BaseExp = 240
Rareness = 45
Happiness = 70
Abilities = BLAZE
HiddenAbilities = SOLARPOWER
Moves = 1,SCRATCH,1,GROWL,7,EMBER
Height = 1.7
Weight = 90.5
Color = Red
Shape = BipedalTall
Kind = Llama
Pokedex = Escupe fuego capaz de fundir rocas.

[RATTATA]
Name = Rattata
Types = NORMAL
BaseStats = 30,56,35,72,25,35
GenderRate = Female50Percent
GrowthRate = Medium
BaseExp = 51
Rareness = 255
Happiness = 70
Abilities = RUNAWAY,GUTS
Moves = 1,TACKLE,1,TAILWHIP
Evolutions = RATICATE,Level,20
Height = 0.3
Weight = 3.5
Color = Purple
Shape = Quadruped
Kind = Ratón
Pokedex = Muerde todo lo que ve con sus afilados colmillos.

[MAGIKARP]
Name = Magikarp
Types = WATER
BaseStats = 20,10,55,80,15,20
GenderRate = Female50Percent
GrowthRate = Slow
BaseExp = 40
Rareness = 255
Happiness = 70
Abilities = SWIFTSWIM
Moves = 1,SPLASH,15,TACKLE
Evolutions = GYARADOS,Level,20
Height = 0.9
Weight = 10.0
Color = Red
Shape = Fish
Kind = Pez
Pokedex = Un Pokémon patético e inútil. Solo salpica.
`);
  putTxt("PBS/metadata.txt", `# Demo — metadatos globales [000] y por mapa (Essentials v19)
[000]
Home = 1,5,5,2
PlayerA = RED,boy_walk,boy_bike,boy_surf,boy_run
WildBattleBGM = Battle wild.ogg
TrainerBattleBGM = Battle trainer.ogg
#-------------------------------
[001]
Name = Pueblo Demo
Outdoor = true
ShowArea = true
MapPosition = 0,13,12
HealingSpot = 1,5,5
#-------------------------------
[002]
Name = Ruta 1
Outdoor = true
ShowArea = true
MapPosition = 0,13,11
Bicycle = true
`);
  putTxt("PBS/encounters.txt", `# Demo — formato v19: Tipo,densidad + probabilidad,ESPECIE,min,max
[002]
Land,21
    40,PIKACHU,5,8
    35,PIKACHU,9,11
    20,RATTATA,5,8
    5,RATTATA,12,14
Water,2
    70,MAGIKARP,5,10
    30,MAGIKARP,11,14
`);
  putTxt("PBS/trainers.txt", `# Demo
[YOUNGSTER,Joey]
LoseText = ¡Rayos! ¡Perdí!
Pokemon = RATTATA,8
    Moves = TACKLE,TAILWHIP
Pokemon = RATTATA,10
`);
  putTxt("PBS/townmap.txt", `# Demo — mapamundi (Essentials v19)
[0]
Name = Demo
Filename = DemoRegion.png
Point = 13,12,Pueblo Demo,,1,5,5,
Point = 13,11,Ruta 1,,,,,
`);
  putTxt("PBS/connections.txt", `# Demo — conexiones entre mapas (vacío: ningún borde conectado)
`);
  putTxt("PBS/items.txt", `# Demo
[POTION]
Name = Poción
Price = 300
Description = Recupera 20 PS de un Pokémon.
`);
  putTxt("PBS/trainertypes.txt", `# Demo
[YOUNGSTER]
Name = Jovencito
Gender = Male
BaseMoney = 16
`);

  putTxt("Game.ini", `[Game]
Title=PokeMod Demo (simula Fire Ash)
Scripts=Data\\Scripts.rxdata
`);

  // -- Scripts (mínimo válido: [id, nombre, zlib])
  const demoCode = "# Proyecto demo de PokeMod Studio\n# (simula los scripts de Fire Ash)\nputs 'Hola desde la demo'\n";
  putRx("Data/Scripts.rxdata", [[1, S("DemoMain"), new RString(await zlibDeflate(new TextEncoder().encode(demoCode)))]]);

  // -- PNGs
  mem.set("Graphics/Tilesets/DemoTiles.png", await canvasToPngBytes(drawDemoTileset()));
  mem.set("Graphics/Autotiles/DemoAgua.png", await canvasToPngBytes(drawDemoAutotile("#2f6fd0", "#9fc6ff")));
  mem.set("Graphics/Autotiles/DemoHierba.png", await canvasToPngBytes(drawDemoAutotile("#4f9e3f", "#b8e69b")));
  mem.set("Graphics/Characters/DemoProfesor.png", await canvasToPngBytes(drawDemoChar("#ffffff", "#f2c89b", "#8a8a8a")));
  mem.set("Graphics/Characters/DemoNPC.png", await canvasToPngBytes(drawDemoChar("#d05454")));

  return mem;
}
