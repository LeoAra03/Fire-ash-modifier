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
};

const LIDERES = [
  {
    id: "glazed", tipoLider: "GLAZED_LEADER",
    medallas: ["GLAZEDBADGE", "GLAZEDBADGE2", "GLAZEDBADGE3", "GLAZEDBADGE4", "GLAZEDBADGE5", "GLAZEDBADGE6", "GLAZEDBADGE7", "GLAZEDBADGE8"],
    nombres: ["Celsa", "Nivia", "Boreas", "Crisal", "Viska", "Polar", "Nevara", "Albor"],
    gimnasios: ["hielo", "agua", "electrico", "planta", "fuego", "psiquico", "roca", "dragon"],
    frase: "La escarcha recuerda dos líneas temporales a la vez.",
  },
  {
    id: "light_platinum", tipoLider: "PLATINUM_LEADER",
    medallas: ["PLATINUMBADGE", "PLATINUMBADGE2", "PLATINUMBADGE3", "PLATINUMBADGE4", "PLATINUMBADGE5", "PLATINUMBADGE6", "PLATINUMBADGE7", "PLATINUMBADGE8"],
    nombres: ["Lumen", "Ondina", "Farón", "Alba", "Céfiro", "Coral", "Brillo", "Aurora"],
    gimnasios: ["roca", "agua", "electrico", "planta", "fuego", "psiquico", "hielo", "dragon"],
    frase: "La costa de platino guarda un brillo que no se oxida.",
  },
  {
    id: "liquid_crystal", tipoLider: "LIQUIDCRYSTAL_LEADER",
    medallas: ["CRYSTALBADGE", "CRYSTALBADGE2", "CRYSTALBADGE3", "CRYSTALBADGE4", "CRYSTALBADGE5", "CRYSTALBADGE6", "CRYSTALBADGE7", "CRYSTALBADGE8"],
    nombres: ["Crista", "Prisma", "Faceta", "Cuarzo", "Jade", "Ámbar", "Ópalo", "Zafira"],
    gimnasios: ["hielo", "planta", "electrico", "fuego", "roca", "agua", "psiquico", "dragon"],
    frase: "El cristal líquido refracta la historia en ocho colores.",
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
const spriteName = (i) => `trchar${((40 + i * 9) % 66) + 1}`;

function pickMaps(campaign) {
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
  return event(0, `${MARKER} ${spec.id} ${i + 1} — ${spec.nombres[i]}`, x, y, [
    page({ gfx: graphic(spriteName(i), 2, 1, {}), list: [
      ...texts([`${spec.nombres[i]}: ${spec.frase}`, "¡El gimnasio de la campaña te reta!"]),
      script(`pbTrainerIntro(:${spec.tipoLider})`),
      ifScript(`pbTrainerBattle(:${spec.tipoLider},"${leaderName(spec, i)}",nil,false,0,true)`),
      ...win,
      endEvent(),
    ] }),
    page({ cond: condition({ self: "A" }), gfx: graphic(spriteName(i), 2, 1, {}), list: [
      ...texts([`${spec.nombres[i]}: Tu paso por esta memoria queda sellado.`]),
      endEvent(),
    ] }),
  ]);
}

function install() {
  const altas = [];
  const placed = [];
  LIDERES.forEach((spec, ci) => {
    const campaign = campaignById(spec.id);
    pickMaps(campaign).forEach((blueprint, i) => {
      const sw = leaderSwitch(ci, i);
      altas.push({
        tipo: spec.tipoLider,
        nombre: leaderName(spec, i),
        equipo: POOLS[spec.gimnasios[i]].slice(0, 6),
        nivel: 85 + i * 5,
        derrota: `${spec.nombres[i]} reconoce la fuerza de Ash.`,
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
  fs.writeFileSync(path.join(ROOT, "content/campanas_lideres.json"), `${JSON.stringify({ generatedBy: "tools/apply_lideres_campanas.mjs", switches: "850-881", colocados: placed }, null, 2)}\n`);
  console.log(`OK: ${placed.length} líderes colocados y ${res.filter((r) => r.added).length} equipos nuevos en trainers.dat`);
}

function verify() {
  const check = makeChecker("líderes de campañas");
  const trainers = readData("trainers.dat");
  const items = readData("items.dat");
  LIDERES.forEach((spec, ci) => {
    const campaign = campaignById(spec.id);
    pickMaps(campaign).forEach((blueprint, i) => {
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
