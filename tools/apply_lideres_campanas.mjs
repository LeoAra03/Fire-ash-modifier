// ============================================================================
// apply_lideres_campanas.mjs
// ----------------------------------------------------------------------------
// Las cuatro campañas ROM adaptadas (Glazed, Light Platinum, Liquid Crystal y
// TFOH/Team Rocket) llenan 807 mapas con 1059 combates, pero ningún líder
// entregaba medallas. Este instalador coloca 8 líderes de gimnasio por campaña
// (tipos GLAZED_LEADER / PLATINUM_LEADER / LIQUIDCRYSTAL_LEADER / TFOH_LEADER,
// ya presentes en trainer_types.dat), con equipos temáticos y, en las tres
// campañas de medallas, la entrega del objeto-medalla que enciende el visor
// región por región de la Tarjeta de Entrenador.
//
//   switches 700-731: líderes derrotados (8 por campaña, en orden).
//
//   node tools/apply_lideres_campanas.mjs            # aplica
//   node tools/apply_lideres_campanas.mjs --verify   # solo comprueba
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import {
  ROOT, txt, iv, event, page, graphic, texts, script, ifScript,
  switchOn, selfSwitch, endEvent, condition, eventsOf, freeCells, nearest,
  upsert, installTrainers, makeChecker, readData,
} from "./lib/dlc_helpers.mjs";

const VERIFY = process.argv.includes("--verify");
const MARKER = "PokeMod Líder";
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "content/rom_campaigns_complete.json"), "utf8"));

const POOLS = {
  hielo: ["SWINUB", "PILOSWINE", "MAMOSWINE", "LAPRAS", "CLOYSTER", "DEWGONG", "JYNX", "GLALIE", "FROSLASS", "VANILLITE", "VANILLUXE", "CRYOGONAL", "SNORUNT", "SPHEAL", "SEALEO", "WALREIN"],
  agua: ["VAPOREON", "GYARADOS", "MILOTIC", "STARMIE", "KINGDRA", "TENTACRUEL", "QWILFISH", "SHARPEDO", "WAILORD", "POLIWRATH", "PELIPPER", "FLOATZEL"],
  electrico: ["RAICHU", "ELECTABUZZ", "JOLTEON", "AMPHAROS", "MAGNETON", "MAGNEZONE", "MANECTRIC", "ELECTIVIRE", "EMOLGA", "LANTURN", "VOLTORB", "ELECTRODE", "MAREEP"],
  planta: ["VENUSAUR", "VILEPLUME", "BELLOSSOM", "EXEGGUTOR", "TANGROWTH", "ROSELIA", "ROSERADE", "LEAFEON", "ABOMASNOW", "SNOVER", "SHIFTRY", "LUDICOLO", "TROPIUS"],
  fuego: ["CHARIZARD", "MAGMAR", "MAGMORTAR", "FLAREON", "ARCANINE", "NINETALES", "MAGCARGO", "CAMERUPT", "TORKOAL", "HOUNDOOM", "RAPIDASH"],
  psiquico: ["ALAKAZAM", "EXEGGUTOR", "ESPEON", "GARDEVOIR", "GALLADE", "METAGROSS", "XATU", "CLAYDOL", "SIGILYPH", "MUSHARNA", "WOBUFFET", "GIRAFARIG"],
  roca: ["ONIX", "STEELIX", "RHYDON", "RHYPERIOR", "TYRANITAR", "AERODACTYL", "GOLEM", "CRADILY", "ARMALDO", "SHUCKLE", "PROBOPASS", "LUNATONE"],
  dragon: ["DRATINI", "DRAGONAIR", "DRAGONITE", "KINGDRA", "FLYGON", "ALTARIA", "SALAMENCE", "GARCHOMP", "HAXORUS"],
  sombra: ["HOUNDOOM", "MIGHTYENA", "ABSOL", "CROBAT", "WEEZING", "MUK", "HONCHKROW", "SPIRITOMB", "DRAPION", "SKUNTANK", "LIEPARD"],
  tierra: ["GLIGAR", "GLISCOR", "DONPHAN", "VIBRAVA", "FLYGON", "HIPPOWDON", "STEELIX", "MUDKIP", "SWAMPERT", "NIDOQUEEN", "NIDOKING", "MAROWAK"],
  lucha: ["LUCARIO", "MACHAMP", "GALLADE", "PRIMEAPE", "HERACROSS", "HITMONLEE", "HITMONCHAN", "HITMONTOP", "HARIYAMA", "INFERNAPE", "BRELOOM", "CONKELDURR"],
  bicho: ["HERACROSS", "SCIZOR", "PINSIR", "BUTTERFREE", "BEEDRILL", "VOLCARONA", "YANMEGA", "GALVANTULA", "SCOLIPEDE", "ARMALDO", "FORRETRESS", "NINJASK"],
  fantasma: ["GENGAR", "MISMAGIUS", "DUSKNOIR", "FROSLASS", "CHANDELURE", "DRIFBLIM", "BANETTE", "SABLEYE", "SPIRITOMB", "COFAGRIGUS"],
};

const LIDERES = [
  {
    id: "glazed", tipoLider: "GLAZED_LEADER",
    mapIds: [3011, 3025, 3036, 3046, 3056, 3071, 3086, 3101],
    oldMapIds: [3000, 3016, 3031, 3047, 3063, 3079, 3094, 3110],
    medallas: ["GLAZEDBADGE", "GLAZEDBADGE2", "GLAZEDBADGE3", "GLAZEDBADGE4", "GLAZEDBADGE5", "GLAZEDBADGE6", "GLAZEDBADGE7", "GLAZEDBADGE8"],
    nombres: ["Sparky", "Terry", "Flo", "Lief", "Irene", "Ernest", "Nicole", "Tyson"],
    ciudades: ["Ciudad Oceanview", "Isla Serenidad", "Pueblo Seaspray", "Ciudad Stormy", "Pueblo Northcoast", "Ciudad Southerly", "Palmtree Resort", "Pueblo Darkwood"],
    gimnasios: ["electrico", "tierra", "agua", "planta", "hielo", "fuego", "roca", "lucha"],
    frases: [
      "¡Mis Pokémon eléctricos canalizan el alto voltaje de la costa de Tunod!",
      "La tierra firme de Serenidad es inquebrantable como las raíces del mundo.",
      "El agua de Seaspray fluye con calma o embiste con la furia de un maremoto.",
      "En Stormy desafiamos las tormentas junto a la fuerza de la naturaleza.",
      "El frío absoluto de Northcoast congela cualquier atisbo de duda.",
      "El calor ardiente de Southerly forja a los entrenadores con temple de acero.",
      "La roca ancestral de Palmtree ha resistido el paso de eras enteras.",
      "La disciplina marcial de Darkwood no conoce atajos: ¡lucha con el corazón!",
    ],
    equipos: [
      ["SHINX", "LUXIO", "FLAAFFY", "AMPHAROS", "RAICHU", "JOLTEON"],
      ["GLIGAR", "VIBRAVA", "DONPHAN", "HIPPOWDON", "STEELIX", "GLISCOR"],
      ["WARTORTLE", "SEADRA", "MILOTIC", "POLIWRATH", "FLOATZEL", "KINGDRA"],
      ["JUMPLUFF", "TANGROWTH", "LEAFEON", "LUDICOLO", "ROSERADE", "VENUSAUR"],
      ["SNORUNT", "WEAVILE", "FROSLASS", "GLALIE", "MAMOSWINE", "GLACEON"],
      ["MAGMAR", "RAPIDASH", "HOUNDOOM", "TORKOAL", "FLAREON", "MAGMORTAR"],
      ["SUDOWOODO", "CRADILY", "ARMALDO", "AERODACTYL", "RHYPERIOR", "TYRANITAR"],
      ["PRIMEAPE", "HERACROSS", "HITMONLEE", "GALLADE", "LUCARIO", "MACHAMP"],
    ],
  },
  {
    id: "light_platinum", tipoLider: "PLATINUM_LEADER",
    mapIds: [3124, 3126, 3128, 3130, 3132, 3134, 3136, 3138],
    oldMapIds: [3120, 3123, 3125, 3128, 3130, 3133, 3135, 3138],
    medallas: ["PLATINUMBADGE", "PLATINUMBADGE2", "PLATINUMBADGE3", "PLATINUMBADGE4", "PLATINUMBADGE5", "PLATINUMBADGE6", "PLATINUMBADGE7", "PLATINUMBADGE8"],
    nombres: ["Jessica", "Esmeralda", "Lucas", "Thomas", "Atlas", "Rayner", "Sophia", "Wesley"],
    ciudades: ["Ciudad Inhore", "Ciudad Esmeralda", "Ciudad Seanport", "Ciudad Dardusk", "Ciudad Groment", "Ciudad Serenidad", "Ciudad Snowce", "Ciudad Drakenbreath"],
    gimnasios: ["bicho", "planta", "agua", "fantasma", "tierra", "electrico", "hielo", "dragon"],
    frases: [
      "¡El zumbido de mis Pokémon bicho corta el viento de Inhore Woods!",
      "La flora de Ciudad Esmeralda florece con una vitalidad insuperable.",
      "Las olas de Seanport golpean con la furia del océano indómito.",
      "La Torre Guardiana de Dardusk guarda los misterios de las sombras eternas.",
      "La roca y el suelo de las minas de Groment son inamovibles ante cualquier embate.",
      "El generador de Serenidad vibra con energía eléctrica de alto voltaje.",
      "La ventisca gélida de Mt. Icestorm forja espíritus templados por el hielo.",
      "El rugido de los dragones de Drakenbreath custodia el cielo de toda la región de Zhery.",
    ],
    equipos: [
      ["BUTTERFREE", "BEEDRILL", "YANMEGA", "SCIZOR", "HERACROSS", "SCOLIPEDE"],
      ["BELLOSSOM", "ROSERADE", "VILEPLUME", "LEAFEON", "TANGROWTH", "VENUSAUR"],
      ["POLIWRATH", "TENTACRUEL", "FLOATZEL", "GYARADOS", "MILOTIC", "SAMUROTT"],
      ["MISMAGIUS", "DUSKNOIR", "DRIFBLIM", "SPIRITOMB", "CHANDELURE", "GENGAR"],
      ["HIPPOWDON", "DONPHAN", "STEELIX", "GLISCOR", "RHYPERIOR", "SWAMPERT"],
      ["AMPHAROS", "RAICHU", "MANECTRIC", "MAGNEZONE", "JOLTEON", "ELECTIVIRE"],
      ["FROSLASS", "GLALIE", "WEAVILE", "MAMOSWINE", "GLACEON", "WALREIN"],
      ["ALTARIA", "KINGDRA", "FLYGON", "SALAMENCE", "HAXORUS", "GARCHOMP"],
    ],
  },
  {
    id: "liquid_crystal", tipoLider: "LIQUIDCRYSTAL_LEADER",
    mapIds: [3207, 3222, 3242, 3262, 3323, 3295, 3385, 3422],
    oldMapIds: [3200, 3262, 3323, 3385, 3446, 3508, 3569, 3631],
    medallas: ["CRYSTALBADGE", "CRYSTALBADGE2", "CRYSTALBADGE3", "CRYSTALBADGE4", "CRYSTALBADGE5", "CRYSTALBADGE6", "CRYSTALBADGE7", "CRYSTALBADGE8"],
    nombres: ["Falkner", "Bugsy", "Whitney", "Morty", "Chuck", "Jasmine", "Pryce", "Clair"],
    ciudades: ["Ciudad Malvalona", "Pueblo Azalea", "Ciudad Trigal", "Ciudad Iris", "Ciudad Orquídea", "Ciudad Olivo", "Pueblo Caoba", "Ciudad Endrino"],
    gimnasios: ["dragon", "bicho", "sombra", "fantasma", "lucha", "roca", "hielo", "dragon"],
    frases: [
      "¡Siente la corriente de aire de las aves de Malvalona surcando los cielos de Johto!",
      "Los secretos de los Pokémon bicho son infinitos si sabes observar con paciencia.",
      "¡No te dejes engañar por la dulzura de mis Pokémon de Trigal!",
      "La niebla de Ciudad Iris revela el vínculo entre el pasado, los espíritus y el presente.",
      "En el rugido de las olas de Orquídea templamos nuestros puños con disciplina marcial.",
      "El acero pulido del faro de Olivo protege a todos los barcos en la tormenta.",
      "La escarcha invernal de Caoba conserva la sabiduría acumulada durante décadas.",
      "¡Los dragones sagrados de Endrino no doblarán su orgullo ante ningún retador!",
    ],
    equipos: [
      ["PIDGEOT", "NOCTOWL", "SWELLOW", "STARAPTOR", "HONCHKROW", "AERODACTYL"],
      ["SCIZOR", "HERACROSS", "PINSIR", "YANMEGA", "BUTTERFREE", "BEEDRILL"],
      ["MILTANK", "CLEFABLE", "WIGGLYTUFF", "BLISSEY", "URSARING", "SNORLAX"],
      ["GENGAR", "MISMAGIUS", "DUSKNOIR", "DRIFBLIM", "SPIRITOMB", "CHANDELURE"],
      ["POLIWRATH", "MACHAMP", "HITMONLEE", "HITMONCHAN", "HITMONTOP", "PRIMEAPE"],
      ["STEELIX", "MAGNETON", "MAGNEZONE", "SKARMORY", "SCIZOR", "METAGROSS"],
      ["MAMOSWINE", "DEWGONG", "CLOYSTER", "LAPRAS", "GLALIE", "WALREIN"],
      ["KINGDRA", "DRAGONITE", "SALAMENCE", "FLYGON", "ALTARIA", "GARCHOMP"],
    ],
  },
  {
    id: "tfoh", tipoLider: "TFOH_LEADER",
    medallas: [null, null, null, null, null, null, null, null],
    nombres: ["Ejecutivo Kuro", "Ejecutiva Vex", "Ejecutivo Mal", "Ejecutiva Nox", "Ejecutivo Umbra", "Ejecutiva Lis", "Ejecutivo Grajo", "Jefe Sombra"],
    gimnasios: ["sombra", "sombra", "sombra", "sombra", "sombra", "sombra", "sombra", "sombra"],
    frase: "La célula se reorganiza más rápido de lo que Ash la desarma.",
  },
];

const campaignById = (id) => CATALOG.campaigns.find((c) => c.id === id);
const leaderSwitch = (ci, i) => 700 + ci * 8 + i;
const leaderName = (spec, i) => `${spec.id.toUpperCase()}_LIDER_${i + 1}`;
const spriteName = (i) => `trchar${String(((40 + i * 9) % 66) + 1).padStart(3, "0")}`;

function pickMaps(campaign, spec) {
  if (spec && Array.isArray(spec.mapIds)) {
    return spec.mapIds.map((mid) => campaign.maps.find((m) => m.mapId === mid)).filter(Boolean);
  }
  const n = campaign.maps.length;
  const chosen = [];
  for (let i = 0; i < 8; i++) {
    let idx = Math.round((i * (n - 1)) / 7);
    while (chosen.some((c) => c.mapId === campaign.maps[idx].mapId)) idx = (idx + 1) % n;
    chosen.push(campaign.maps[idx]);
  }
  return chosen;
}

function leaderEvent(spec, i, sw, x, y) {
  const medalla = spec.medallas[i];
  const win = [];
  if (medalla) win.push(script(`pbReceiveItem(:${medalla})`, 2));
  win.push(switchOn(sw, 2), selfSwitch("A", 0, 2));
  win.push(...texts([medalla ? `Ash recibió la medalla de ${spec.nombres[i]}.` : `La célula de ${spec.nombres[i]} se dispersa… por ahora.`], 2));
  const introFrase = spec.frases ? spec.frases[i] : spec.frase;
  const introLugar = spec.ciudades ? spec.ciudades[i] : spec.id;
  return event(0, `${MARKER} ${spec.id} ${i + 1} — ${spec.nombres[i]}`, x, y, [
    page({ gfx: graphic(spriteName(i), 2, 1, {}), list: [
      ...texts([
        `\\sp[${spec.nombres[i]}]¡Te doy la bienvenida al Gimnasio de ${introLugar}!`,
        `\\sp[${spec.nombres[i]}]${introFrase}`,
        "¡El líder de gimnasio te desafía formalmente a un combate!"
      ]),
      script(`pbTrainerIntro(:${spec.tipoLider})`),
      ifScript(`pbTrainerBattle(:${spec.tipoLider},"${leaderName(spec, i)}",nil,false,0,true)`),
      ...win,
      endEvent(),
    ] }),
    page({ cond: condition({ self: "A" }), gfx: graphic(spriteName(i), 2, 1, {}), list: [
      ...texts([`\\sp[${spec.nombres[i]}]Tu victoria demuestra la fuerza de tu vínculo con tus Pokémon. Sigue adelante, Ash.`]),
      endEvent(),
    ] }),
  ]);
}

function install() {
  const altas = [];
  const placed = [];
  // Limpieza de mapas anteriores si cambiaron de ubicación
  LIDERES.forEach((spec) => {
    if (spec.oldMapIds) {
      for (const oldId of spec.oldMapIds) {
        if (!spec.mapIds || !spec.mapIds.includes(oldId)) {
          upsert(oldId, [`${MARKER} ${spec.id}`], () => [], "lideres_campanas");
        }
      }
    }
  });

  LIDERES.forEach((spec, ci) => {
    const campaign = campaignById(spec.id);
    pickMaps(campaign, spec).forEach((blueprint, i) => {
      const sw = leaderSwitch(ci, i);
      const equipo = spec.equipos ? spec.equipos[i] : POOLS[spec.gimnasios[i]].slice(0, 6);
      altas.push({
        tipo: spec.tipoLider,
        nombre: leaderName(spec, i),
        equipo,
        nivel: 85 + i * 5,
        derrota: `${spec.nombres[i]} reconoce la fuerza de Ash.`,
        overwrite: true,
      });
      upsert(blueprint.mapId, [`${MARKER} ${spec.id} ${i + 1} —`], () => {
        const cells = freeCells(blueprint.mapId);
        const [x, y] = nearest(cells, [Math.floor((blueprint.dimensions?.width ?? 10) / 2), Math.floor((blueprint.dimensions?.height ?? 10) / 2)]);
        placed.push({ map: blueprint.mapId, lider: spec.nombres[i], sw, x, y });
        return [leaderEvent(spec, i, sw, x, y)];
      }, "lideres_campanas");
    });
  });
  const res = installTrainers(altas, "lideres_campanas");
  const fallidos = res.filter((r) => r.error);
  if (fallidos.length) throw new Error(`líderes sin equipo válido: ${fallidos.map((f) => f.nombre).join(", ")}`);
  fs.writeFileSync(path.join(ROOT, "content/campanas_lideres.json"), `${JSON.stringify({ generatedBy: "tools/apply_lideres_campanas.mjs", switches: "700-731", colocados: placed }, null, 2)}\n`);
  console.log(`OK: ${placed.length} líderes colocados y ${res.filter((r) => r.added).length} equipos nuevos/actualizados en trainers.dat`);
}

function verify() {
  const check = makeChecker("líderes de campañas");
  const trainers = readData("trainers.dat");
  const items = readData("items.dat");
  LIDERES.forEach((spec, ci) => {
    const campaign = campaignById(spec.id);
    pickMaps(campaign, spec).forEach((blueprint, i) => {
      const nombre = leaderName(spec, i);
      const ev = eventsOf(blueprint.mapId).map((e) => e.obj)
        .find((e) => (iv(e, "@name")?.text ?? "").startsWith(`${MARKER} ${spec.id} ${i + 1} —`));
      check.ok(!!ev, `${spec.id} líder ${i + 1}: falta el evento en Map${blueprint.mapId}`);
      if (ev) {
        const list = iv(ev, "@pages")[0].getIvar("@list");
        const battle = list.filter((c) => c.getIvar("code") === 111 && Number(c.getIvar("parameters")[0]) === 12)
          .map((c) => txt(c.getIvar("parameters")[1])).join("\n");
        check.ok(battle.includes(`pbTrainerBattle(:${spec.tipoLider},"${nombre}"`), `${spec.id} líder ${i + 1}: batalla mal cableada`);
        if (spec.medallas[i]) {
          check.ok(list.some((c) => c.getIvar("code") === 355 && txt(c.getIvar("parameters")[0]).includes(`pbReceiveItem(:${spec.medallas[i]})`)), `${spec.id} líder ${i + 1}: no entrega ${spec.medallas[i]}`);
        }
        check.ok(list.some((c) => c.getIvar("code") === 121 && Number(c.getIvar("parameters")[0]) === leaderSwitch(ci, i)), `${spec.id} líder ${i + 1}: falta switch ${leaderSwitch(ci, i)}`);
      }
      check.ok(trainers.pairs.some(([k]) => Array.isArray(k) && txt(k[0]) === spec.tipoLider && txt(k[1]) === nombre), `trainers.dat: falta ${nombre}`);
    });
  });
  for (const sym of ["GLAZEDBADGE8", "PLATINUMBADGE8", "CRYSTALBADGE8"]) {
    check.ok(items.pairs.some(([k]) => txt(k) === sym), `falta el objeto ${sym}`);
  }
  check.done();
}

if (VERIFY) verify();
else { install(); verify(); }
