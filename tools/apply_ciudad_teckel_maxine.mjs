// ============================================================================
// apply_ciudad_teckel_maxine.mjs
// ----------------------------------------------------------------------------
// Nuevo propósito de la Isla Espejo, según el diseño del usuario:
//
//  · Map 997 → CIUDAD TECKEL: pueblo donde los Pokémon perro (Zigzagoon,
//    Poochyena, Growlithe…) campan libremente; gimnasio y muelle.
//  · Map 998 → GIMNASIO TECKEL: la líder Duna entrega la Medalla Pata.
//  · Map 999 → AFUERAS TECKEL: prado con encuentros de perros.
//  · Map 2300 → ISLA PARAÍSO: bosque con el altar de MAXINE (Legendaria
//    Florateck, nivel 125). Se llega con el Ticket Paraíso que entrega el
//    Profesor Atlas en Puerto Horizonte (1001). Para que MAXINE despierte hay
//    que haber vencido a Duna y responder a la Guardiana Nira la pregunta
//    «¿qué le gusta más a MAXINE, el pollo o la pata?» — la correcta es LA PATA.
//
// Idempotente. Con --verify solo comprueba.
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ROOT, GAME, DATA, S, Sym, txt, iv, cmd, condition, graphic, page, event,
  readMapRaw, writeMapRaw, readData, writeData, backup, texts, script,
  transfer, switchOn, ifSwitch, ifScript, elseBranch, endBranch, choice,
  choiceCase, choiceEnd, endEvent, freeCells, nearest, makeChecker,
  installMapInfos, installMetadata, installItems, installTrainerTypes,
  installTrainers, speciesAvailable, marshalLoad, marshalDump, RHash, RObject,
} from "./lib/dlc_helpers.mjs";
import { RSymbol } from "../web/js/marshal.js";
import { buildPokemonSprites } from "./lib/sprite_build.mjs";

const VERIFY = process.argv.includes("--verify");

const CITY = 997, GYM = 998, OUTSKIRTS = 999, PARADISE = 2300;
const DONORS = { [CITY]: 43, [GYM]: 58, [OUTSKIRTS]: 28, [PARADISE]: 21 };
const SW_TECKEL = 960;   // Duna vencida
const SW_MAXINE = 961;   // MAXINE vencida o capturada
const SW_PATA   = 962;   // la guardiana aceptó «la pata»
const CANON_ARCEUS = 876;
const MANIFEST = path.join(ROOT, "content", "teckel_manifest.json");

const DOGS = ["ZIGZAGOON", "POOCHYENA", "GROWLITHE", "EEVEE", "ROCKRUFF", "LILLIPUP"];
const DOG_CHARS = ["ZIGZAGOON", "POOCHYENA", "GROWLITHE", "EEVEE", "ZIGZAGOON_1", "POOCHYENA"];

function saveManifest(list) {
  const m = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : { files: [] };
  const set = new Set(m.files);
  for (const f of list) set.add(f);
  m.files = [...set].sort();
  fs.writeFileSync(MANIFEST, JSON.stringify(m, null, 2));
}

const mapPath = (id) => `Data/Map${String(id).padStart(3, "0")}.rxdata`;

function cloneTerrain() {
  for (const [target, donor] of Object.entries(DONORS)) {
    const id = Number(target);
    const copy = marshalLoad(Buffer.from(marshalDump(readMapRaw(donor))));
    copy.setIvar("@events", new RHash([]));
    writeMapRaw(id, copy);
  }
}

/* ────────────────────────────────── eventos ─────────────────────────────── */

function cityEvents() {
  const cells = freeCells(CITY);
  const pick = (i) => cells[(i * 11 + 3) % cells.length];
  const events = [];
  DOG_CHARS.forEach((charName, i) => {
    const species = DOGS[i % DOGS.length];
    const [x, y] = pick(i);
    const p = page({
      trigger: 2,
      list: [
        ...texts([`¡Un ${species.toLowerCase()} salvaje juega suelto y te reta!`]),
        script(`pbWildBattle(:${species}, ${58 + i}, true)`),
        endEvent(),
      ],
    });
    p.setIvar("@graphic", graphic(charName));
    p.setIvar("@move_type", 1);
    p.setIvar("@move_speed", 4);
    p.setIvar("@step_anime", true);
    events.push(event(100 + i, `Teckel: ${species} errante ${i}`, x, y, [p]));
  });
  const [gx, gy] = nearest(cells, [20, 10]);
  events.push(event(200, "Teckel: Gimnasio", gx, gy, [page({
    trigger: 1,
    list: [transfer(GYM, 6, 8, 2), endEvent()],
  })]));
  const [mx, my] = nearest(cells, [4, 24]);
  events.push(event(201, "Teckel: Muelle a Paraíso", mx, my, [page({
    list: [
      ifScript("pbHasItem?(:PARAISOTICKET)"),
      ...texts(["El barquero del Atlas revisa tu Ticket Paraíso y asiente.", "La lancha corta un mar que no aparece en ningún mapa."], 1),
      transfer(PARADISE, 10, 26, 2, 1),
      elseBranch(),
      ...texts(["El barquero: «Sin el Ticket Paraíso no cruzo. El Profesor Atlas", "lo entrega en Puerto Horizonte, a quien ya haya cerrado la Ruta de Dios.»"]),
      endBranch(),
      endEvent(),
    ],
  })]));
  const [vx, vy] = nearest(cells, [24, 14]);
  events.push(event(202, "Teckel: Veterinaria canina", vx, vy, [page({
    list: [
      ...texts(["Veterinaria: «Aquí todo perro termina sano.»"]),
      script("$Trainer.party.each { |p| p.heal }"),
      script("pbMessage(\"Tu equipo descansa entre colchonetas y juguetes.\")"),
      endEvent(),
    ],
  })]));
  return events;
}

function gymEvents() {
  const events = [];
  events.push(event(300, "Teckel: Líder Duna", 6, 4, [
    page({
      list: [
        ...texts([
          "\\bDuna: En Ciudad Teckel cada Pokémon perro corre libre.",
          "Si quieres la Medalla Pata, demuestra que entiendes la manada:",
          "no se domina, se acompaña.",
        ]),
        script("if pbTrainerBattle(:TECKEL_LEADER, \"DUNA\", nil, false, 0, true)"),
        ...texts(["\\bDuna: La manada te aceptó. Lleva la Medalla Pata.", "Y si buscas a MAXINE: gana en la isla y responde bien la pregunta."], 1),
        script("pbReceiveItem(:TECKELBADGE)", 1),
        switchOn(SW_TECKEL, 1),
        elseBranch(),
        ...texts(["\\bDuna: Vuelve cuando corras a su lado, no delante."], 1),
        endBranch(),
        endEvent(),
      ],
    }),
    page({
      cond: condition({ sw: SW_TECKEL }),
      list: [
        ...texts(["\\bDuna: La Medalla Pata te sienta bien.", "¿Revancha? Elige tú."]),
        choice(["Revancha", "Hoy no"]),
        choiceCase(0, "Revancha", 1),
        script("pbTrainerBattle(:TECKEL_LEADER, \"DUNA\", nil, true, 0, true)", 1),
        choiceCase(1, "Hoy no", 1),
        ...texts(["\\bDuna: Los perros te olfatean contento."], 1),
        choiceEnd(),
        endEvent(),
      ],
    }),
  ]));
  events.push(event(301, "Teckel: Criadora del gimnasio", 3, 6, [page({
    list: [
      ...texts(["Criadora: «Duna cría perros de todas las épocas.", "Zigzagoon de Hoenn, Poochyena… hasta un Arcanine que fue de un campeón.»"]),
      endEvent(),
    ],
  })]));
  events.push(event(302, "Teckel: Salida", 6, 9, [page({
    trigger: 1,
    list: [transfer(CITY, 20, 11, 2), endEvent()],
  })]));
  return events;
}

function outskirtsEvents() {
  return [event(400, "Teckel: Cartel de afueras", 8, 8, [page({
    list: [...texts(["«Afueras Teckel: los perros marcan el camino; tú no.»"]), endEvent()],
  })])];
}

function paradiseEvents() {
  const events = [];
  events.push(event(499, "Paraíso: Altar de MAXINE", 10, 8, [page({
    gfx: graphic("ALTAR_MAXINE"),
    through: true,
    list: [...texts(["Un altar de piedra musgosa, cubierto de flores moradas.", "Huele a siglo y a pelaje mojado."]), endEvent()],
  })]));
  events.push(event(500, "Paraíso: Guardiana Nira", 10, 22, [
    page({
      list: [
        ifSwitch(SW_PATA),
        ...texts(["Guardiana Nira: «La pata, claro. Pasa: ella ya te espera.»"], 1),
        elseBranch(),
        ifSwitch(SW_TECKEL, true, 1),
        ...texts([
          "Guardiana Nira: «MAXINE duerme sobre su altar con el osito.",
          "Solo despierta para quien responda con el corazón:",
          "¿qué le gusta más a MAXINE, el pollo o la pata?»",
        ], 1),
        choice(["El pollo", "La pata"], 1),
        choiceCase(0, "El pollo", 2),
        ...texts(["Guardiana Nira: «…¿El POLLO?» El altar sigue dormido.", "Vuelve cuando entiendas a los teckel.»"], 2),
        choiceCase(1, "La pata", 2),
        ...texts(["Guardiana Nira: «¡La pata! Como a todo teckel con alma.", "Pasa, pero despacio: protege a su osito.»"], 2),
        switchOn(SW_PATA, 2),
        choiceEnd(),
        elseBranch(1),
        ...texts(["Guardiana Nira: «Sin la Medalla Pata de Duna, ni la pregunta.»"], 1),
        endBranch(1),
        endBranch(),
        endEvent(),
      ],
    }),
  ]));
  events.push(event(501, "Paraíso: MAXINE", 10, 7, [
    page({
      gfx: graphic("MAXINE"),
      list: [...texts(["El altar de flores duerme. Un osito pequeño descansa sobre una huella cálida."]), endEvent()],
    }),
    page({
      cond: condition({ sw: SW_PATA }),
      gfx: graphic("MAXINE"),
      list: [
        ...texts([
          "¡Ahí está MAXINE! Parece proteger un pequeño osito…",
          "La Legendaria Florateck olfatea tu medalla y baja del altar.",
        ]),
        script("begin"),
        script("  resultado = pbWildBattle(:MAXINE, 125, false)", 0),
        script("  $game_switches[961] = [1, 2].include?(resultado)", 0),
        script("rescue StandardError"),
        script("  pbMessage(\"(El encuentro con MAXINE se interrumpió; puedes reintentarlo.)\")", 0),
        script("end"),
        endEvent(),
      ],
    }),
    page({
      cond: condition({ sw: SW_MAXINE }),
      gfx: graphic("MAXINE"),
      list: [...texts(["MAXINE duerme de nuevo, con el osito abrazado.", "Las flores del altar brillan un poco más que antes."]), endEvent()],
    }),
  ]));
  events.push(event(502, "Paraíso: Retorno", 10, 27, [page({
    trigger: 1,
    list: [transfer(CITY, 4, 25, 2), endEvent()],
  })]));
  return events;
}

function professorEvent() {
  return event(600, "Teckel: Profesor Atlas", 8, 6, [
    page({
      list: [
        ifSwitch(CANON_ARCEUS),
        ifScript("!pbHasItem?(:PARAISOTICKET)", 1),
        ...texts([
          "Profesor Atlas: «Cerraste la Ruta de Dios; por eso te hablo claro.",
          "Al este de Ciudad Teckel late la Isla Paraíso, donde duerme MAXINE.",
          "Toma el Ticket Paraíso. Y recuerda: a ella no se llega mandando;",
          "se llega entendiendo a los perros.»",
        ], 1),
        script("pbReceiveItem(:PARAISOTICKET)", 1),
        elseBranch(1),
        ...texts(["Profesor Atlas: «El muelle de Ciudad Teckel cruza a Paraíso.»"], 1),
        endBranch(1),
        elseBranch(),
        ...texts(["Profesor Atlas: «Aún study las grietas. Vuelve cuando la Ruta de Dios cierre.»"]),
        endBranch(),
        endEvent(),
      ],
    }),
  ]);
}

/* ─────────────────────────────────── datos ──────────────────────────────── */

function installEncounters() {
  const enc = readData("encounters.dat");
  const keyText = (k) => String(k?.name ?? k?.text ?? k);
  if (enc.pairs.some(([k]) => keyText(k).startsWith(`${OUTSKIRTS}_`))) return;
  const donors = enc.pairs.filter(([k]) => keyText(k).startsWith("28_"));
  if (!donors.length) throw new Error("sin tabla de encuentros donante (mapa 28)");
  let i = 0;
  const especies = speciesAvailable();
  const walk = (v) => {
    if (v instanceof RSymbol && !DOGS.includes(v.name) && especies.has(v.name)) {
      // símbolo de especie: lo sustituimos por un perro de la manada
      return new RSymbol(DOGS[i++ % DOGS.length]);
    }
    if (Array.isArray(v)) return v.map(walk);
    if (v && v.pairs) { v.pairs = v.pairs.map(([k, val]) => [walk(k), walk(val)]); return v; }
    if (v && v.ivars) { v.ivars = v.ivars.map(([k, val]) => [k, walk(val)]); return v; }
    return v;
  };
  for (const [k, donor] of donors) {
    const slot = keyText(k).split("_")[1] ?? "0";
    const copy = marshalLoad(Buffer.from(marshalDump(donor)));
    enc.pairs.push([Sym(`${OUTSKIRTS}_${slot}`), walk(copy)]);
  }
  writeData("encounters.dat", enc);
}

function installMaxineSpecies() {
  const data = readData("species.dat");
  if (data.pairs.some(([k]) => k instanceof RSymbol && k.name === "MAXINE")) return;
  const bySymbol = new Map();
  let maxId = 0;
  for (const [k, v] of data.pairs) {
    if (k instanceof RSymbol) bySymbol.set(k.name, v);
    if (typeof k === "number") maxId = Math.max(maxId, k);
    if (v?.getIvar) maxId = Math.max(maxId, Number(v.getIvar("@id_number") ?? 0));
  }
  const template = bySymbol.get("ZIGZAGOON");
  if (!template) throw new Error("falta plantilla ZIGZAGOON");
  const obj = new RObject(template.className, template.ivars.map(([k, v]) => [k, v]));
  const set = (n, v) => obj.setIvar(n, v);
  const stat = (vals) => new RHash(Object.entries(vals).map(([s, v]) => [Sym(s), v]));
  set("@id", Sym("MAXINE"));
  set("@id_number", maxId + 1);
  set("@species", Sym("MAXINE"));
  set("@form", 0);
  set("@real_name", S("MAXINE"));
  set("@real_form_name", null);
  set("@real_category", S("Florateck"));
  set("@real_pokedex_entry", S("Legendaria guardiana de la Isla Paraíso. Su armadura de flora mora florece una vez al siglo y su osito de peluche, dicen, es el sello que mantiene dormida a la verdadera bestia."));
  set("@type1", Sym("GRASS"));
  set("@type2", Sym("FAIRY"));
  set("@base_stats", stat({ HP: 95, ATTACK: 105, DEFENSE: 100, SPECIAL_ATTACK: 130, SPECIAL_DEFENSE: 110, SPEED: 95 }));
  set("@evs", stat({ HP: 0, ATTACK: 0, DEFENSE: 0, SPECIAL_ATTACK: 3, SPECIAL_DEFENSE: 0, SPEED: 0 }));
  set("@base_exp", 306);
  set("@growth_rate", Sym("Slow"));
  set("@gender_ratio", Sym("AllFemale"));
  set("@catch_rate", 3);
  set("@happiness", 100);
  set("@moves", [
    [1, Sym("PETALBLIZZARD")], [1, Sym("PLAYROUGH")], [40, Sym("EXTREMESPEED")],
    [60, Sym("GRASSKNOT")], [80, Sym("DAZZLINGGLEAM")], [100, Sym("CLOSECOMBAT")],
  ]);
  set("@tutor_moves", []);
  set("@egg_moves", []);
  set("@abilities", [Sym("FLOWERVEIL")]);
  set("@hidden_abilities", [Sym("FLOWERGIFT")]);
  set("@egg_groups", [Sym("Field")]);
  set("@hatch_steps", 30720);
  set("@evolutions", []);
  set("@height", 6.0);
  set("@weight", 28.5);
  set("@color", Sym("Brown"));
  set("@shape", Sym("Quadruped"));
  set("@habitat", Sym("Rare"));
  data.pairs.push([maxId + 1, obj], [Sym("MAXINE"), obj]);
  writeData("species.dat", data);
}

async function apply() {
  backup("teckel_maxine", ["Scripts.rxdata", "MapInfos.rxdata", "map_metadata.dat", "encounters.dat", "items.dat", "trainers.dat", "trainer_types.dat", "species.dat"]);
  cloneTerrain();

  const upserts = [
    [CITY, ["Teckel:"], cityEvents],
    [GYM, ["Teckel:"], gymEvents],
    [OUTSKIRTS, ["Teckel:"], outskirtsEvents],
    [PARADISE, ["Paraíso:"], paradiseEvents],
  ];
  for (const [mapId, owned, builder] of upserts) {
    const map = readMapRaw(mapId);
    const events = iv(map, "@events");
    events.pairs = events.pairs.filter(([, e]) => !owned.some((p) => txt(iv(e, "@name")).startsWith(p)));
    const built = builder();
    let nextId = Math.max(0, ...events.pairs.map(([k]) => Number(k))) + 1;
    for (const ev of built) {
      const id = Number(iv(ev, "@id"));
      ev.setIvar("@id", id);
      events.pairs.push([id, ev]);
      nextId = Math.max(nextId, id + 1);
    }
    writeMapRaw(mapId, map);
  }

  // Profesor Atlas en Puerto Horizonte (1001)
  {
    const map = readMapRaw(1001);
    const events = iv(map, "@events");
    events.pairs = events.pairs.filter(([, e]) => txt(iv(e, "@name")) !== "Teckel: Profesor Atlas");
    const ev = professorEvent();
    const cells = freeCells(1001);
    const [x, y] = cells[5] ?? [8, 6];
    ev.setIvar("@x", x); ev.setIvar("@y", y);
    events.pairs.push([Number(iv(ev, "@id")), ev]);
    writeMapRaw(1001, map);
  }

  installMapInfos([
    { mapId: CITY, title: "Ciudad Teckel", parentId: 1001, order: 901 },
    { mapId: GYM, title: "Gimnasio Teckel", parentId: CITY, order: 902 },
    { mapId: OUTSKIRTS, title: "Afueras Teckel", parentId: CITY, order: 903 },
    { mapId: PARADISE, title: "Isla Paraíso", parentId: CITY, order: 904 },
  ], "teckel_maxine");
  installMetadata([
    { mapId: CITY, exterior: true },
    { mapId: GYM },
    { mapId: OUTSKIRTS, exterior: true },
    { mapId: PARADISE, exterior: true, battleBackdrop: "forest" },
  ].map((s) => ({ mapId: s.mapId, parentId: s.exterior ? 1001 : CITY, battleBackdrop: s.battleBackdrop })), "teckel_maxine");

  installEncounters();
  installItems([
    { id: "PARAISOTICKET", base: "VERMILIONTICKET", nombre: "Ticket Paraíso", plural: "Tickets Paraíso" },
    { id: "TECKELBADGE", base: "ATLASERABADGE", nombre: "Medalla Pata", plural: "Medallas Pata" },
  ], "teckel_maxine");
  installTrainerTypes([{ id: "TECKEL_LEADER", base: "LEADER_Valerie", nombre: "Líder de Ciudad Teckel" }], "teckel_maxine");
  installTrainers([{
    tipo: "TECKEL_LEADER", nombre: "DUNA", nivel: 80,
    equipo: ["LILLIPUP", "ROCKRUFF", "POOCHYENA", "MIGHTYENA", "GROWLITHE", "ARCANINE"],
    derrota: "La manada confía en ti. Cuida su ritmo.",
  }], "teckel_maxine");
  installMaxineSpecies();

  // Grito + sprites de MAXINE
  const crySrc = path.join(GAME, "Audio", "SE", "NIDOGOD.ogg");
  const cryDst = path.join(GAME, "Audio", "SE", "MAXINE.ogg");
  if (!fs.existsSync(cryDst)) fs.copyFileSync(crySrc, cryDst);
  // Sprites fieles a las fotos generadas: sin reducción de paleta.
  const concept = path.join(ROOT, "reference", "pokegods", "concept", "MAXINE.png");
  await buildPokemonSprites(concept, "MAXINE", { paletteSize: 0 });
  const altar = path.join(ROOT, "reference", "maxine", "ALTAR_maxine_gb.png");
  await buildPokemonSprites(altar, "ALTAR_MAXINE", { paletteSize: 0 });

  saveManifest([
    mapPath(CITY), mapPath(GYM), mapPath(OUTSKIRTS), mapPath(PARADISE), mapPath(1001),
    "Data/MapInfos.rxdata", "Data/map_metadata.dat", "Data/encounters.dat",
    "Data/items.dat", "Data/trainers.dat", "Data/trainer_types.dat", "Data/species.dat",
    "Graphics/Pokemon/Front/MAXINE.png", "Graphics/Pokemon/Back/MAXINE.png",
    "Graphics/Pokemon/Icons/MAXINE.png", "Graphics/Characters/MAXINE.png",
    "Graphics/Characters/ALTAR_MAXINE.png",
    "Graphics/Pictures/Trainer Card/icon_badges.png",
    "Audio/SE/MAXINE.ogg",
  ]);
  console.log("OK: Ciudad Teckel, Gimnasio, Afueras, Isla Paraíso y MAXINE instalados");
}

function verify() {
  const check = makeChecker("ciudad teckel + maxine");
  const names = (id) => readMapRaw(id).getIvar("@events").pairs.map(([, e]) => txt(iv(e, "@name")));
  check.ok(names(CITY).some((n) => n.startsWith("Teckel: Muelle")), "falta el muelle a Paraíso");
  check.ok(names(CITY).filter((n) => /errante/.test(n)).length >= 6, "faltan perros errantes");
  check.ok(names(GYM).some((n) => n.includes("Líder Duna")), "falta Duna");
  check.ok(names(PARADISE).some((n) => n.includes("MAXINE")), "falta MAXINE");
  check.ok(names(PARADISE).some((n) => n.includes("Altar de MAXINE")), "falta el altar");
  check.ok(fs.existsSync(path.join(GAME, "Graphics/Characters/ALTAR_MAXINE.png")), "falta el sprite del altar");
  check.ok(names(PARADISE).some((n) => n.includes("Guardiana Nira")), "falta la guardiana");
  check.ok(names(1001).includes("Teckel: Profesor Atlas"), "falta el Profesor Atlas");
  const items = readData("items.dat");
  check.ok(items.pairs.some(([k]) => txt(k) === "PARAISOTICKET"), "falta el ticket");
  check.ok(items.pairs.some(([k]) => txt(k) === "TECKELBADGE"), "falta la medalla");
  const sp = readData("species.dat");
  check.ok(sp.pairs.some(([k]) => k instanceof RSymbol && k.name === "MAXINE"), "falta la especie MAXINE");
  for (const f of ["Graphics/Pokemon/Front/MAXINE.png", "Graphics/Characters/MAXINE.png", "Audio/SE/MAXINE.ogg"]) {
    check.ok(fs.existsSync(path.join(GAME, f)), `falta ${f}`);
  }
  const maxinePage = readMapRaw(PARADISE).getIvar("@events").pairs
    .map(([, e]) => e).find((e) => txt(iv(e, "@name")) === "Paraíso: MAXINE");
  check.ok(maxinePage && iv(maxinePage, "@pages").length === 3, "MAXINE debe tener 3 páginas");
  check.done();
}

if (VERIFY) {
  verify();
} else {
  await apply();
  verify();
}
