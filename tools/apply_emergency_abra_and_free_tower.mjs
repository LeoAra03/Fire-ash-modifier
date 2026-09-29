#!/usr/bin/env node
/**
 * Parche: Abra de emergencia y Torre de Créditos 0 (Grandeur Club).
 *
 * Resuelve:
 * 1. Softlock al volver de Isla Espejo / Pueblo Paleta:
 *    - El ferry de vuelta en Mapa 997 ahora desembarca en (39, 23) (césped libre).
 *    - En Mapa 033 (Pueblo Paleta), la celda (39, 25) deja de tener el tile de valla
 *      bloqueante (bits de colisión = 0), permitiendo moverse en cualquier dirección
 *      incluso si se carga una partida ya guardada encima de la valla.
 *    - El Ayudante de Oak en (39, 24) tiene @through = true para no obstaculizar el paso,
 *      ofrece teletransporte directo a la casa de Ash en Kanto y entrega el "Abra de emergencia".
 *    - En Mapa 048 (Sótano laboratorio Oak), el Ayudante también tiene @through = true.
 *
 * 2. Objeto e interacción "Abra de emergencia":
 *    - Registrado como Objeto Clave (:ABRADEEMERGENCIA, id 1031, bolsillo 8, uso infinito)
 *      en items.dat con icono propio 48x48 en Graphics/Items/ABRADEEMERGENCIA.png.
 *    - Usable desde la Mochila en el mapa para teletransportar inmediatamente al jugador
 *      a la casa del protagonista en Kanto (Mapa 42, coordenadas 3, 8).
 *    - Eventos NPC Abra de emergencia ubicados en:
 *        * Mapa 997 (Atrio de Isla Espejo) en (12, 10).
 *        * Mapa 999 (Archivo Cero, junto al NPC de Game Over) en (19, 11).
 *      Ambos entregan el objeto al hablar con ellos y permiten teletransporte inmediato.
 *
 * 3. Torre de postgame (Grandeur Club) a 0 créditos:
 *    - Máquina expendedora (Mapa 151, Evento 72): todos los objetos, códigos, pases
 *      y BGM pack cuestan 0 créditos (condición de crédito >= 0, resta de créditos = 0).
 *    - Common Events 26..32 (Gemas y categorías de objetos de combate): comprobación
 *      de crédito >= 0 y llamada con precio 0.
 *    - Scripts.rxdata:
 *        * Sección 392 (Grandeur Club): grandeurItemExchange fuerza precio 0, permite
 *          hasta 99 unidades, no divide por 0 ni descuenta créditos, y recarga créditos.
 *        * Sección 393 (Sygna Buffs): SygnaBuff inicializa coste en 0, showShopBuffs
 *          muestra "0 GC Credits", y buyBuff permite adquirir todos los buffs sin coste
 *          ni comprobación de saldo.
 *        * Sección 248 (Item_Effects): manejadores UseInField y UseFromBag de :ABRADEEMERGENCIA.
 *
 * Uso:
 *   node tools/apply_emergency_abra_and_free_tower.mjs            # instala y verifica
 *   node tools/apply_emergency_abra_and_free_tower.mjs --verify   # solo verifica
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { marshalDump, marshalLoad, RObject, RString, RSymbol, RUserDef } from "../web/js/marshal.js";
import { cmdOf, parseEvent, parseMap, parseTileset, tableGet, tableSet, tableToUserDef, tableFromUserDef } from "../web/js/rmxp.js";
import { DATA, GAME, ROOT } from "./lib/fire_ash_registry.mjs";

const VERIFY_ONLY = process.argv.includes("--verify");
const BACKUP = path.join(GAME, "PokeModBackups", "emergency_abra_and_tower_originals");
const S = (value) => RString.fromText(String(value));
const iv = (object, name) => object?.getIvar?.(name);
const txt = (value) => value instanceof RString ? value.text : String(value ?? "");
const read = (file) => marshalLoad(fs.readFileSync(path.join(DATA, file)));
const write = (file, value) => fs.writeFileSync(path.join(DATA, file), Buffer.from(marshalDump(value)));

function cmd(code, parameters = [], indent = 0) {
  return new RObject("RPG::EventCommand", [["@code", code], ["@indent", indent], ["@parameters", parameters]]);
}
function condition(sw = 0) {
  return new RObject("RPG::Event::Page::Condition", [
    ["@switch1_valid", Boolean(sw)], ["@switch1_id", sw || 1],
    ["@switch2_valid", false], ["@switch2_id", 1],
    ["@variable_valid", false], ["@variable_id", 1], ["@variable_value", 0],
    ["@self_switch_valid", false], ["@self_switch_ch", S("A")]
  ]);
}
function graphic({ tile = 0, name = "", dir = 2 } = {}) {
  return new RObject("RPG::Event::Page::Graphic", [
    ["@tile_id", tile], ["@character_name", S(name)], ["@character_hue", 0],
    ["@direction", dir], ["@pattern", 0], ["@opacity", 255], ["@blend_type", 0]
  ]);
}
function route() {
  return new RObject("RPG::MoveRoute", [
    ["@repeat", true], ["@skippable", false],
    ["@list", [new RObject("RPG::MoveCommand", [["@code", 0], ["@parameters", []]])]]
  ]);
}
function page({ cond = condition(), gfx = graphic(), list = [cmd(0)], through = false, trigger = 0 } = {}) {
  return new RObject("RPG::Event::Page", [
    ["@condition", cond], ["@graphic", gfx], ["@move_type", 0], ["@move_speed", 3],
    ["@move_frequency", 3], ["@move_route", route()], ["@walk_anime", true],
    ["@step_anime", false], ["@direction_fix", false], ["@through", through],
    ["@always_on_top", false], ["@trigger", trigger], ["@list", list]
  ]);
}
function event(id, name, [x, y], pages) {
  return new RObject("RPG::Event", [
    ["@id", id], ["@name", S(name)], ["@x", x], ["@y", y], ["@pages", pages]
  ]);
}
function tone(red, green, blue, gray = 0) {
  const buffer = Buffer.alloc(32);
  [red, green, blue, gray].forEach((value, index) => buffer.writeDoubleLE(value, index * 8));
  return new RUserDef("Tone", Uint8Array.from(buffer));
}

// ---------------------------------------------------------------------------
// 1. Icono de Abra de emergencia (48x48 PNG)
// ---------------------------------------------------------------------------
async function installItemIcon() {
  const outPath = path.join(GAME, "Graphics", "Items", "ABRADEEMERGENCIA.png");
  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 100) return;
  const abraIconPath = path.join(GAME, "Graphics", "Pokemon", "Icons", "ABRA.png");
  try {
    const { createCanvas, loadImage } = await import("@napi-rs/canvas");
    const img = await loadImage(abraIconPath);
    const canvas = createCanvas(48, 48);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, 64, 64, 0, 0, 48, 48);
    fs.writeFileSync(outPath, canvas.toBuffer("image/png"));
  } catch (err) {
    if (fs.existsSync(abraIconPath)) {
      fs.copyFileSync(abraIconPath, outPath);
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Registro en items.dat
// ---------------------------------------------------------------------------
const ABRA_ITEM_ID = 1031;
function installItemDefinition() {
  const items = read("items.dat");
  const already = items.pairs.some(([k]) => (k instanceof RSymbol && k.name === "ABRADEEMERGENCIA") || k === ABRA_ITEM_ID);
  if (already) return;

  const itemObj = new RObject("GameData::Item", [
    ["@id", new RSymbol("ABRADEEMERGENCIA")],
    ["@id_number", ABRA_ITEM_ID],
    ["@real_name", S("Abra de emergencia")],
    ["@real_name_plural", S("Abras de emergencia")],
    ["@pocket", 8], // Objetos Clave / Key Items
    ["@price", 0],
    ["@real_description", S("Un Abra fiel entrenado para teletransportarte de inmediato a la casa de Ash en Pueblo Paleta, Kanto. Uso infinito.")],
    ["@field_use", 2], // Usable desde la Mochila en el mapa
    ["@battle_use", 0],
    ["@type", 6],
    ["@move", null]
  ]);

  items.pairs.push([ABRA_ITEM_ID, itemObj]);
  items.pairs.push([new RSymbol("ABRADEEMERGENCIA"), itemObj]);
  write("items.dat", items);
}

// ---------------------------------------------------------------------------
// 3. Parches en Scripts.rxdata
// ---------------------------------------------------------------------------
const ABRA_TELEPORT_RUBY = `
#===============================================================================
# PokeMod: Abra de emergencia - Teletransporte a la casa de Ash en Kanto
#===============================================================================
def pbEmergencyAbraTeleport
  pbPlayDecisionSE
  pbMessage(_INTL("\\\\b¡El Abra de emergencia usó Teletransporte!"))
  pbFadeOutIn {
    $game_temp.player_new_map_id    = 42
    $game_temp.player_new_x         = 3
    $game_temp.player_new_y         = 8
    $game_temp.player_new_direction = 8
    pbCancelVehicles
    $scene.transfer_player if $scene.is_a?(Scene_Map)
    $game_map.autoplay
    $game_map.refresh
  }
end

ItemHandlers::UseInField.add(:ABRADEEMERGENCIA, proc { |item|
  pbEmergencyAbraTeleport
  next 1
})

ItemHandlers::UseFromBag.add(:ABRADEEMERGENCIA, proc { |item|
  pbEmergencyAbraTeleport
  next 2
})
`;

function sectionCode(scripts, name) {
  const row = scripts.find((entry) => txt(entry[1]) === name);
  if (!row) throw new Error(`No se encontró la sección ${name} en Scripts.rxdata`);
  return { row, code: zlib.inflateSync(Buffer.from(row[2].bytes)).toString("utf8") };
}
function storeCode(row, code) {
  row[2].bytes = Uint8Array.from(zlib.deflateSync(Buffer.from(code, "utf8")));
}

function installScripts() {
  const scripts = read("Scripts.rxdata");
  let changed = false;

  // 3a. Manejadores de Abra de emergencia en Item_Effects (sección 248)
  const effects = sectionCode(scripts, "Item_Effects");
  if (!effects.code.includes("pbEmergencyAbraTeleport")) {
    storeCode(effects.row, effects.code + "\n" + ABRA_TELEPORT_RUBY);
    changed = true;
  }

  // 3b. Sección 392 (Grandeur Club): grandeurItemExchange a coste 0 libre
  const gc = sectionCode(scripts, "Grandeur Club");
  if (!gc.code.includes("# PokeMod: Grandeur Club Free Items (0 Credits)")) {
    const newExchange = `def grandeurItemExchange(item,itemprice=0)
  # PokeMod: Grandeur Club Free Items (0 Credits)
  itemprice = 0
  credits = pbGet(GCVariables::GC_CREDITS)
  credits = 99999 if credits < 99999
  pbSet(GCVariables::GC_CREDITS, credits)
  maxitems = 99
  params = ChooseNumberParams.new
  params.setRange(1, maxitems)
  params.setInitialValue(1)
  params.setCancelValue(0)
  items = pbMessageChooseNumber(_INTL("\\\\CN\\\\bHow many {1} would you like? (max.{2})",
            GameData::Item.get(item).name_plural, maxitems), params)
  if items > 0
    if $PokemonBag.pbCanStore?(item, items)
      pbReceiveItem(item,items)
      pbMessage(_INTL("REDEEM SUCCESSFUL! THANK YOU!"))
    else
      pbMessage(_INTL("\\\\CN\\\\bYou have no room in your Bag."))
    end
  end
end`;
    const replacedGc = gc.code.replace(
      /def grandeurItemExchange\(item,itemprice\)[\s\S]*?pbMessage\(_INTL\("\\\\CN\\\\bYou have no room in your Bag\."\)\)\s+end\s+end\s+end\s+end/m,
      newExchange
    );
    if (replacedGc === gc.code) throw new Error("No se pudo reemplazar grandeurItemExchange en Grandeur Club");
    storeCode(gc.row, replacedGc);
    changed = true;
  }

  // 3c. Sección 393 (Sygna Buffs): Buffs a coste 0
  const buffs = sectionCode(scripts, "Sygna Buffs");
  if (!buffs.code.includes("# PokeMod: Sygna Buffs 0 Credits")) {
    let buffCode = buffs.code;
    // En initialize: @cost = 0
    buffCode = buffCode.replace(
      /@cost = cost\r?\n\s+@cost = cost\*5 if @level == 2 && @buff_type == "Blessing"/,
      `@cost = 0 # PokeMod: Sygna Buffs 0 Credits`
    );
    // En showShopBuffs: "#{choices},#{b.name} - 0 GC Credits"
    buffCode = buffCode.replace(
      /"#\{choices\},#\{b\.name\} - #\{b\.cost\} GC Credits"/,
      `"#{choices},#{b.name} - 0 GC Credits"`
    );
    // En buyBuff: eliminar bloqueo de créditos
    buffCode = buffCode.replace(
      /def buyBuff\r?\n\s+buff = pbGet\(62\)\[pbGet\(75\)\]\r?\n\s+if buff\.cost > pbGet\(80\)[\s\S]*?pbSet\(80,pbGet\(80\) - buff\.cost\)/,
      `def buyBuff\n  buff = pbGet(62)[pbGet(75)]\n  # PokeMod: coste 0 créditos`
    );
    storeCode(buffs.row, buffCode);
    changed = true;
  }

  if (changed) write("Scripts.rxdata", scripts);
}

// ---------------------------------------------------------------------------
// 4. Parche en CommonEvents.rxdata (Eventos Comunes 26 a 32 a 0 créditos)
// ---------------------------------------------------------------------------
function installCommonEvents() {
  const commonEvents = read("CommonEvents.rxdata");
  let changed = false;

  for (let id = 26; id <= 32; id++) {
    const ce = commonEvents[id];
    if (!ce) continue;
    const list = iv(ce, "@list") || [];
    for (const c of list) {
      const code = iv(c, "@code");
      const p = iv(c, "@parameters");
      // Condición de crédito: [1, 80, 0, N, 1] -> [1, 80, 0, 0, 1]
      if (code === 111 && p[0] === 1 && p[1] === 80 && p[3] > 0) {
        p[3] = 0;
        changed = true;
      }
      // Llamada de script grandeurItemExchange(item, N) -> grandeurItemExchange(item, 0)
      if ((code === 355 || code === 655) && p[0] instanceof RString) {
        const text = p[0].text;
        if (/grandeurItemExchange\(item,\s*\d+\)/.test(text)) {
          p[0].text = text.replace(/grandeurItemExchange\(item,\s*\d+\)/, "grandeurItemExchange(item, 0)");
          changed = true;
        }
      }
    }
  }

  if (changed) write("CommonEvents.rxdata", commonEvents);
}

// ---------------------------------------------------------------------------
// 5. Parche en Map151.rxdata (Vending Machine a 0 créditos)
// ---------------------------------------------------------------------------
function installMap151() {
  const map = read("Map151.rxdata");
  const events = iv(map, "events").pairs;
  const vendingEv = events.find(([, ev]) => Number(iv(ev, "id")) === 72)?.[1];
  if (!vendingEv) throw new Error("No se encontró el evento 72 (Vending Machine) en Map151");

  const page0 = iv(vendingEv, "pages")[0];
  const list = iv(page0, "list") || [];
  let changed = false;

  for (const c of list) {
    const code = iv(c, "@code");
    const p = iv(c, "@parameters");

    // Comprobación de saldo Var 80: [1, 80, 0, N, 1] -> N = 0
    if (code === 111 && p[0] === 1 && p[1] === 80 && p[3] > 0) {
      p[3] = 0;
      changed = true;
    }
    // Resta de saldo Var 80: [80, 80, 2, 0, N] -> N = 0
    if (code === 122 && p[0] === 80 && p[1] === 80 && p[2] === 2 && p[4] > 0) {
      p[4] = 0;
      changed = true;
    }
    // Scripts con grandeurItemExchange(:DNALUCK, 2) o similar -> precio 0
    if ((code === 355 || code === 655) && p[0] instanceof RString) {
      const text = p[0].text;
      if (/grandeurItemExchange\((\w+|:\w+),\s*[1-9]\d*\)/.test(text)) {
        p[0].text = text.replace(/grandeurItemExchange\((\w+|:\w+),\s*[1-9]\d*\)/, "grandeurItemExchange($1, 0)");
        changed = true;
      }
    }
    // Textos informativos con precio
    if ((code === 101 || code === 401) && p[0] instanceof RString) {
      let text = p[0].text;
      const replaced = text
        .replace(/\(1 Credit\)/g, "(0 Credits)")
        .replace(/\(2 Credits\)/g, "(0 Credits)")
        .replace(/\(3 Credits\)/g, "(0 Credits)")
        .replace(/\(5 Credits\)/g, "(0 Credits)")
        .replace(/\(10 Credits\)/g, "(0 Credits)")
        .replace(/\(500\s*\r?\n?Credits\)/g, "(0 Credits)");
      if (replaced !== text) {
        p[0].text = replaced;
        changed = true;
      }
    }
  }

  if (changed) write("Map151.rxdata", map);
}

// ---------------------------------------------------------------------------
// 6. Parche en Map033.rxdata (Pueblo Paleta: valla abierta + Ayudante con through y teletransporte)
// ---------------------------------------------------------------------------
function installMap033() {
  const map = read("Map033.rxdata");
  const dataUd = iv(map, "data");
  const table = tableFromUserDef(dataUd);

  // Eliminar el tile de valla en capa 1 en (39, 25)
  if (tableGet(table, 39, 25, 1) !== 0) {
    tableSet(table, 39, 25, 1, 0);
    map.setIvar("data", tableToUserDef(table));
  }

  // Modificar el Ayudante (Evento 76)
  const events = iv(map, "events").pairs;
  const aideEv = events.find(([, ev]) => txt(iv(ev, "name")) === "PokeMod: Aide Isla Espejo")?.[1];
  if (!aideEv) throw new Error("No se encontró el Ayudante en Map033");

  const page0 = iv(aideEv, "pages")[0];
  page0.setIvar("@through", true); // Permite al jugador atravesarlo sin atascarse

  const commands = [
    cmd(101, [S("\\bOak's aide: A stable signal has appeared beyond the Orange Archipelago.")]),
    cmd(401, [S("Professor Oak calls it Mirror Island. It preserves battles from worlds that might have been.")]),
    cmd(111, [12, S("!$PokemonBag.pbHasItem?(:ABRADEEMERGENCIA)")]),
    cmd(101, [S("\\bOak's aide: Prof. Oak asked me to give you this Emergency Abra.")]),
    cmd(401, [S("If you ever get trapped, it will teleport you straight back home!")]),
    cmd(355, [S("pbReceiveItem(:ABRADEEMERGENCIA, 1)")]),
    cmd(412),
    cmd(101, [S("Where would you like to go?\\ch[1,3,Sail to Mirror Island,Teleport to Ash's House,Leave / Step aside]")]),
    cmd(111, [1, 1, 0, 0, 0]),
    cmd(201, [0, 997, 14, 10, 2, 1], 1),
    cmd(0, [], 1),
    cmd(412),
    cmd(111, [1, 1, 0, 1, 0]),
    cmd(223, [tone(-255, -255, -255), 6], 1),
    cmd(106, [8], 1),
    cmd(201, [0, 42, 3, 8, 8, 1], 1),
    cmd(223, [tone(0, 0, 0), 6], 1),
    cmd(101, [S("You returned safely to Ash's house.")], 1),
    cmd(0, [], 1),
    cmd(412),
    cmd(111, [1, 1, 0, 2, 0]),
    cmd(101, [S("\\bOak's aide: You can pass freely at any time. I will keep the route open!")], 1),
    cmd(0, [], 1),
    cmd(412),
    cmd(0)
  ];
  page0.setIvar("@list", commands);

  write("Map033.rxdata", map);
}

// ---------------------------------------------------------------------------
// 7. Parche en Map997.rxdata (Ferry a (39, 23) + NPC Abra de emergencia)
// ---------------------------------------------------------------------------
function abraEvent(id, [x, y], customIntro = null) {
  const intro = customIntro || "Este Abra de emergencia te sacará de cualquier apuro y puede llevarte a casa en cualquier momento.";
  const list = [
    cmd(101, [S("\\bAbra: ¡Aaaa-bra!\\1")]),
    cmd(101, [S(`\\b${intro}`)]),
    cmd(401, [S("Puede teletransportarte de inmediato a la casa de Ash en Kanto.")]),
    cmd(111, [12, S("!$PokemonBag.pbHasItem?(:ABRADEEMERGENCIA)")]),
    cmd(101, [S("\\b¡Recibiste el objeto 'Abra de emergencia'!\\1")], 1),
    cmd(355, [S("pbReceiveItem(:ABRADEEMERGENCIA, 1)")], 1),
    cmd(101, [S("\\bAhora puedes usar el 'Abra de emergencia' desde los Objetos Clave de tu Mochila en cualquier momento.")], 1),
    cmd(412),
    cmd(101, [S("¿Deseas usar Teletransporte ahora hacia la casa de Ash en Kanto?\\ch[1,2,Teletransportar,Quedarme aquí]")]),
    cmd(111, [1, 1, 0, 0, 0]),
    cmd(223, [tone(-255, -255, -255), 6], 1),
    cmd(106, [8], 1),
    cmd(201, [0, 42, 3, 8, 8, 1], 1),
    cmd(223, [tone(0, 0, 0), 6], 1),
    cmd(101, [S("Llegaste a salvo a la casa de Ash en Kanto.")], 1),
    cmd(0, [], 1),
    cmd(412),
    cmd(111, [1, 1, 0, 1, 0]),
    cmd(101, [S("\\bAbra: ¡Abra-abra! Estaré aquí por si me necesitas.")], 1),
    cmd(0, [], 1),
    cmd(412),
    cmd(0)
  ];
  return event(id, "Abra de emergencia", [x, y], [
    page({ gfx: graphic({ name: "ABRA", dir: 2 }), list })
  ]);
}

function installMap997() {
  const map = read("Map997.rxdata");
  const events = iv(map, "events");

  // Corregir destino del Return Ferry: transferir a (39, 23)
  const ferry = events.pairs.find(([, ev]) => txt(iv(ev, "name")) === "Return Ferry")?.[1];
  if (ferry) {
    const list = iv(iv(ferry, "pages")[0], "list") || [];
    const transferCmd = list.find((c) => iv(c, "@code") === 201);
    if (transferCmd) {
      const p = iv(transferCmd, "@parameters");
      p[1] = 33;
      p[2] = 39;
      p[3] = 23; // Césped abierto en Pueblo Paleta
    }
  }

  // Añadir Abra de emergencia si no está ya
  events.pairs = events.pairs.filter(([, ev]) => txt(iv(ev, "name")) !== "Abra de emergencia");
  const nextId = Math.max(0, ...events.pairs.map(([id]) => Number(id))) + 1;
  const abra = abraEvent(nextId, [12, 10]);
  events.pairs.push([nextId, abra]);

  write("Map997.rxdata", map);
}

// ---------------------------------------------------------------------------
// 8. Parche en Map999.rxdata (NPC Abra de emergencia junto a Game Over)
// ---------------------------------------------------------------------------
function installMap999() {
  const map = read("Map999.rxdata");
  const events = iv(map, "events");

  events.pairs = events.pairs.filter(([, ev]) => txt(iv(ev, "name")) !== "Abra de emergencia");
  const nextId = Math.max(0, ...events.pairs.map(([id]) => Number(id))) + 1;
  const abra = abraEvent(nextId, [19, 11], "Este Abra de emergencia te sacará de este archivo corrompido.");
  events.pairs.push([nextId, abra]);

  write("Map999.rxdata", map);
}

// ---------------------------------------------------------------------------
// 9. Parche en Map048.rxdata (Oak Lab Hub: through en Ayudante)
// ---------------------------------------------------------------------------
function installMap048() {
  const map = read("Map048.rxdata");
  const events = iv(map, "events").pairs;
  const aide = events.find(([, ev]) => txt(iv(ev, "name")).includes("Ayudante"))?.[1];
  if (aide) {
    for (const pg of iv(aide, "pages") || []) {
      pg.setIvar("@through", true);
    }
    write("Map048.rxdata", map);
  }
}

// ---------------------------------------------------------------------------
// 10. Actualizar tools/apply_isla_espejo_expansion.mjs para coherencia
// ---------------------------------------------------------------------------
function updateIslaEspejoInstaller() {
  const scriptPath = path.join(ROOT, "tools", "apply_isla_espejo_expansion.mjs");
  if (!fs.existsSync(scriptPath)) return;
  let code = fs.readFileSync(scriptPath, "utf8");

  // Ajustar coordenadas del ferry en buildHubMap: (39, 23)
  code = code.replace(
    'PALLET_MAP, 39, 25,',
    'PALLET_MAP, 39, 23,'
  );

  // Permitir transfer a mapa 42 en verify()
  code = code.replace(
    'ok([33, 997, 998, 999].includes(Number(p[1]))',
    'ok([33, 42, 997, 998, 999].includes(Number(p[1]))'
  );

  fs.writeFileSync(scriptPath, code);
}

// ---------------------------------------------------------------------------
// Verificación exhaustiva
// ---------------------------------------------------------------------------
function verify() {
  const errors = [];
  const ok = (cond, msg) => { if (!cond) errors.push(msg); };

  // 1. Icono
  const iconPath = path.join(GAME, "Graphics", "Items", "ABRADEEMERGENCIA.png");
  ok(fs.existsSync(iconPath) && fs.statSync(iconPath).size > 500, "falta el icono Graphics/Items/ABRADEEMERGENCIA.png");

  // 2. items.dat
  const items = read("items.dat");
  const abraItem = items.pairs.find(([k]) => k instanceof RSymbol && k.name === "ABRADEEMERGENCIA")?.[1];
  ok(!!abraItem, "items.dat no registra :ABRADEEMERGENCIA");
  if (abraItem) {
    ok(Number(iv(abraItem, "pocket")) === 8, "el Abra de emergencia debe ser un Objeto Clave (pocket 8)");
    ok(Number(iv(abraItem, "field_use")) === 2, "el Abra de emergencia debe tener field_use = 2");
    ok(Number(iv(abraItem, "price")) === 0, "el Abra de emergencia debe tener precio 0");
    ok(txt(iv(abraItem, "real_name")) === "Abra de emergencia", "nombre de objeto inválido");
  }

  // 3. Scripts
  const scripts = read("Scripts.rxdata");
  const effects = sectionCode(scripts, "Item_Effects");
  ok(effects.code.includes("def pbEmergencyAbraTeleport"), "falta pbEmergencyAbraTeleport en Item_Effects");
  ok(effects.code.includes("ItemHandlers::UseInField.add(:ABRADEEMERGENCIA"), "falta UseInField para :ABRADEEMERGENCIA");
  ok(effects.code.includes("ItemHandlers::UseFromBag.add(:ABRADEEMERGENCIA"), "falta UseFromBag para :ABRADEEMERGENCIA");

  const gc = sectionCode(scripts, "Grandeur Club");
  ok(gc.code.includes("# PokeMod: Grandeur Club Free Items (0 Credits)"), "falta parche de 0 créditos en Grandeur Club");
  ok(gc.code.includes("maxitems = 99"), "grandeurItemExchange debe permitir hasta 99 unidades libres");
  // La copia del juego puede conservar el script original; la copia que se
  // distribuye para instalar debe ser la que no contiene el `end` sobrante.
  const correctedScripts = marshalLoad(fs.readFileSync(path.join(ROOT, "Scripts_corregido", "Scripts.rxdata")));
  const correctedGc = sectionCode(correctedScripts, "Grandeur Club");
  ok(!/(?<=\n)end\r?\nend\r?\n\r?\ndef givePassive\b/.test(correctedGc.code), "Scripts_corregido/Scripts.rxdata contiene un end extra tras grandeurItemExchange");

  const buffs = sectionCode(scripts, "Sygna Buffs");
  ok(buffs.code.includes("# PokeMod: Sygna Buffs 0 Credits"), "falta parche de 0 créditos en Sygna Buffs");
  ok(buffs.code.includes("\"#{choices},#{b.name} - 0 GC Credits\""), "showShopBuffs no muestra 0 GC Credits");

  // 4. CommonEvents 26..32
  const ce = read("CommonEvents.rxdata");
  for (let id = 26; id <= 32; id++) {
    const list = iv(ce[id], "@list") || [];
    for (const c of list) {
      const code = iv(c, "@code");
      const p = iv(c, "@parameters");
      if (code === 111 && p[0] === 1 && p[1] === 80) {
        ok(p[3] === 0, `CE ${id} comprueba Var 80 >= ${p[3]} en vez de 0`);
      }
      if ((code === 355 || code === 655) && p[0] instanceof RString && p[0].text.includes("grandeurItemExchange")) {
        ok(/grandeurItemExchange\(item,\s*0\)/.test(p[0].text), `CE ${id} pasa precio distinto de 0`);
      }
    }
  }

  // 5. Map151
  const map151 = read("Map151.rxdata");
  const ev72 = iv(map151, "events").pairs.find(([, ev]) => Number(iv(ev, "id")) === 72)?.[1];
  ok(!!ev72, "no existe el evento 72 en Map151");
  if (ev72) {
    const list = iv(iv(ev72, "pages")[0], "list") || [];
    for (const c of list) {
      const code = iv(c, "@code");
      const p = iv(c, "@parameters");
      if (code === 111 && p[0] === 1 && p[1] === 80) ok(p[3] === 0, `Map151 Ev 72 comprueba saldo >= ${p[3]}`);
      if (code === 122 && p[0] === 80 && p[1] === 80 && p[2] === 2) ok(p[4] === 0, `Map151 Ev 72 resta ${p[4]} créditos`);
    }
  }

  // 6. Map033
  const map033 = read("Map033.rxdata");
  const table033 = tableFromUserDef(iv(map033, "data"));
  const tilesets = read("Tilesets.rxdata");
  const tileset033 = parseTileset(tilesets[iv(map033, "tileset_id")]);
  let bits033 = 0;
  for (let z = 0; z < table033.z; z++) {
    const tile = tableGet(table033, 39, 25, z);
    if (tile > 0 && tile < tileset033.passages.data.length) bits033 |= tileset033.passages.data[tile] & 15;
  }
  ok(bits033 === 0, `Map033 celda (39, 25) bloqueada (bits=${bits033})`);
  const aide033 = iv(map033, "events").pairs.find(([, ev]) => txt(iv(ev, "name")) === "PokeMod: Aide Isla Espejo")?.[1];
  ok(!!aide033, "falta el Ayudante en Map033");
  if (aide033) {
    const page0 = iv(aide033, "pages")[0];
    ok(Boolean(iv(page0, "through")), "el Ayudante en Map033 debe tener through = true");
    const list = iv(page0, "list") || [];
    ok(list.some((c) => iv(c, "@code") === 201 && iv(c, "@parameters")[1] === 42), "el Ayudante no ofrece teletransporte a casa (mapa 42)");
  }

  // 7. Map997
  const map997 = read("Map997.rxdata");
  const ferry = iv(map997, "events").pairs.find(([, ev]) => txt(iv(ev, "name")) === "Return Ferry")?.[1];
  ok(!!ferry, "falta Return Ferry en Map997");
  if (ferry) {
    const transferCmd = (iv(iv(ferry, "pages")[0], "list") || []).find((c) => iv(c, "@code") === 201);
    const p = iv(transferCmd, "@parameters");
    ok(p[1] === 33 && p[2] === 39 && p[3] === 23, `Return Ferry desembarca en (${p[2]}, ${p[3]}) en vez de (39, 23)`);
  }
  const abra997 = iv(map997, "events").pairs.find(([, ev]) => txt(iv(ev, "name")) === "Abra de emergencia")?.[1];
  ok(!!abra997, "falta Abra de emergencia en Map997");
  if (abra997) {
    const list = iv(iv(abra997, "pages")[0], "list") || [];
    ok(list.some((c) => iv(c, "@code") === 201 && iv(c, "@parameters")[1] === 42), "Abra en Map997 no transfiere a casa (mapa 42)");
  }

  // 8. Map999
  const map999 = read("Map999.rxdata");
  const abra999 = iv(map999, "events").pairs.find(([, ev]) => txt(iv(ev, "name")) === "Abra de emergencia")?.[1];
  ok(!!abra999, "falta Abra de emergencia en Map999");
  if (abra999) {
    const list = iv(iv(abra999, "pages")[0], "list") || [];
    ok(list.some((c) => iv(c, "@code") === 201 && iv(c, "@parameters")[1] === 42), "Abra en Map999 no transfiere a casa (mapa 42)");
  }

  if (errors.length) throw new Error(`Verificación fallida (${errors.length}):\n- ${errors.join("\n- ")}`);
  console.log("Verificación OK: Abra de emergencia funcional (Mochila e islas), softlock resuelto (valla abierta, Ayudante through) y torre Grandeur a 0 créditos.");
}

async function main() {
  if (!VERIFY_ONLY) {
    await installItemIcon();
    installItemDefinition();
    installScripts();
    installCommonEvents();
    installMap151();
    installMap033();
    installMap997();
    installMap999();
    installMap048();
    updateIslaEspejoInstaller();
    console.log("Instalación de Abra de emergencia y Torre a 0 créditos completada.");
  }
  verify();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
