#!/usr/bin/env node
/**
 * dn_apply_medals.mjs — medallas y cartucheras de los mundos creepypasta (M2).
 *
 * Cada mundo entrega una **Medalla** y su **cartuchera**, y la cartuchera se llama exactamente
 * `Badges of <mundo>` (requisito de diseño). La medalla se recoge en el **Pedestal del Sello** de la
 * cámara del jefe: el pedestal se enciende cuando el sello del mundo queda cerrado, entrega medalla
 * + cartuchera una sola vez (self-switch A) y deja el registro a la vista.
 *
 *   EP01 White Hand          DN_MEDAL_WHT + DN_CASE_WHT · Badges of White Hand          (2056)
 *   EP02 Lost Silver         DN_MEDAL_LSV + DN_CASE_LSV · Badges of Lost Silver         (2072)
 *   EP03 Snow on Mt. Silver  DN_MEDAL_SNO + DN_CASE_SNO · Badges of Snow on Mt. Silver  (2087)
 *   EP04 Hypno's Lullaby     DN_MEDAL_HYP + DN_CASE_HYP · Badges of Hypno's Lullaby     (2103)
 *   EP05 Pokémon Black       DN_MEDAL_BLK + DN_CASE_BLK · Badges of Pokémon Black       (2119)
 *   EP06 King Unown          DN_MEDAL_UNO + DN_CASE_UNO · Badges of King Unown          (2135)
 *
 *   W7  Strangled Red         DN_MEDAL_AMO + DN_CASE_AMO · Badges of Strangled Red     (2158)
 *   W8  Buried Alive          DN_MEDAL_FOS + DN_CASE_FOS · Badges of Buried Alive      (2174)
 *   W9  Lavender Town Syndr.  DN_MEDAL_SIL + DN_CASE_SIL · Badges of Lavender Town     (2190)
 *
 * Los dos últimos (Medalla del Vínculo · Badges of Mad Pikachu) los entrega la Liga Oscura
 * (`tools/dn_build_liga.mjs`), que reutiliza estas mismas definiciones. Al cerrar los **nueve**
 * mundos, la Antesala entrega además la cartuchera del testigo `DN_CASE_WIT`
 * («Badges of the Witness») desde el evento `VITRINA_TESTIGO` (mapa 2040).
 *
 * Uso:
 *   node tools/dn_apply_medals.mjs            # objetos, iconos y pedestales
 *   node tools/dn_apply_medals.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import { createCanvas } from "@napi-rs/canvas";
import {
  GRAPHICS, txt, grid, nearestFreeCell, reachableFrom, upsertEvents, writeItems, cmd,
  readData, readJson, CATALOG, EVENTS, condition, graphic, page, event, texts, script,
  selfSwitch,
} from "./lib/dn_rmxp.mjs";

const argv = process.argv.slice(2);
const VERIFY = argv.includes("--verify");
const DRY = argv.includes("--dry-run");
const ITEM_BASE = 1040;
const ITEM_ICONS = path.join(GRAPHICS, "Items");

/** Mundos, medallas, cartucheras y colores de su icono. */
export const WORLDS = [
  { key: "EP01", world: "White Hand", medal: "DN_MEDAL_WHT", case: "DN_CASE_WHT", medalName: "Medalla de la Mano Blanca", caseName: "Badges of White Hand", body: "#e8e0d0", ring: "#8a6a3c", glyph: "✋" },
  { key: "EP02", world: "Lost Silver", medal: "DN_MEDAL_LSV", case: "DN_CASE_LSV", medalName: "Medalla del Sin Nombre", caseName: "Badges of Lost Silver", body: "#c8ccd4", ring: "#3d5a8a", glyph: "☠" },
  { key: "EP03", world: "Snow on Mt. Silver", medal: "DN_MEDAL_SNO", case: "DN_CASE_SNO", medalName: "Medalla del Caminante", caseName: "Badges of Snow on Mt. Silver", body: "#eaf4ff", ring: "#4a86c8", glyph: "❄" },
  { key: "EP04", world: "Hypno's Lullaby", medal: "DN_MEDAL_HYP", case: "DN_CASE_HYP", medalName: "Medalla de la Nana", caseName: "Badges of Hypno's Lullaby", body: "#b06ad8", ring: "#5a2a7a", glyph: "♪" },
  { key: "EP05", world: "Pokémon Black", medal: "DN_MEDAL_BLK", case: "DN_CASE_BLK", medalName: "Medalla del Jugador 000", caseName: "Badges of Pokémon Black", body: "#1c1c22", ring: "#8e1b1b", glyph: "0" },
  { key: "EP06", world: "King Unown", medal: "DN_MEDAL_UNO", case: "DN_CASE_UNO", medalName: "Medalla del Rey Unown", caseName: "Badges of King Unown", body: "#39ff88", ring: "#101418", glyph: "ᛝ" },
  { key: "W7", world: "Strangled Red", medal: "DN_MEDAL_AMO", case: "DN_CASE_AMO", medalName: "Medalla del Amo", caseName: "Badges of Strangled Red", body: "#b03a3a", ring: "#3a0d0d", glyph: "⛓" },
  { key: "W8", world: "Buried Alive", medal: "DN_MEDAL_FOS", case: "DN_CASE_FOS", medalName: "Medalla de la Fosa", caseName: "Badges of Buried Alive", body: "#6b5236", ring: "#241708", glyph: "▽" },
  { key: "W9", world: "Lavender Town Syndrome", medal: "DN_MEDAL_SIL", case: "DN_CASE_SIL", medalName: "Medalla del Silencio", caseName: "Badges of Lavender Town Syndrome", body: "#b98ad8", ring: "#33134f", glyph: "◌" },
];

/**
 * Cartuchera del testigo: se entrega en la Antesala cuando los **nueve** sellos están cerrados.
 * No tiene medalla propia: es el registro de haber visto cerrarse los nueve mundos.
 */
export const WITNESS = {
  id: "DN_CASE_WIT", name: "Badges of the Witness",
  description: "Cartuchera del Testigo: se entrega cuando los nueve sellos del Dimensional Nightmare están cerrados.",
  hubMap: 2040,
};

/** Todos los sellos del Dimensional Nightmare (seis del primer anillo + tres del segundo). */
export const SEALS = [883, 884, 885, 886, 887, 888, 922, 923, 924];

const PHASE_A_SWITCHES = Object.freeze({
  EP01: 903, EP02: 904, EP03: 905, EP04: 906, EP05: 907, EP06: 908,
  W7: 928, W8: 929, W9: 930,
});
const PHASE_B_VARIABLE_BASE = 289;
function bossProgress(catalog, key) {
  const bosses = catalog.episodes.filter((episode) => episode.boss);
  const index = bosses.findIndex((episode) => episode.key === key);
  const episode = bosses[index];
  if (!episode || !PHASE_A_SWITCHES[key]) throw new Error(`${key}: faltan datos de progresión del jefe`);
  const spec = episode.boss.phaseB;
  const total = spec.maps?.length || spec.cells?.length || (spec.kind === "letras" ? 7 : 4);
  return { phaseA: PHASE_A_SWITCHES[key], variable: PHASE_B_VARIABLE_BASE + index, total };
}

/** Condición de la Vitrina del Testigo: los nueve sellos cerrados. */
export const WITNESS_CHECK = `begin; $game_switches[931] = [${SEALS.map((id) => `$game_switches[${id}]`).join(", ")}].all?; rescue; end`;

/** Con las seis cartucheras se abre la Liga Oscura (switch 917); lo comprueba también el Archivero. */
export const READY_CHECK = `begin; $game_switches[917] = [${WORLDS.map((w) => `:${w.case}`).join(", ")}].all? { |i| $PokemonBag.pbHasItem?(i) }; rescue; end`;

/** Séptima cartuchera: la entrega la Liga Oscura. */
export const FINAL_WORLD = {
  key: "LIGA", world: "Mad Pikachu", medal: "DN_MEDAL_MPK", case: "DN_CASE_MPK",
  medalName: "Medalla del Vínculo", caseName: "Badges of Mad Pikachu",
  body: "#ffe14d", ring: "#b8860b", glyph: "⚡",
};

export const ALL_ITEMS = [
  ...WORLDS.flatMap((w) => [
    { id: w.medal, name: w.medalName, description: `${w.medalName}: cierra el sello de ${w.world} y se guarda en su cartuchera.`, kind: "medal", color: w },
    { id: w.case, name: w.caseName, description: `Cartuchera de ${w.world}. Guarda la ${w.medalName} y su registro.`, kind: "case", color: w },
  ]),
  { id: FINAL_WORLD.medal, name: FINAL_WORLD.medalName, description: `${FINAL_WORLD.medalName}: el vínculo que devolvió a Mad Pikachu.`, kind: "medal", color: FINAL_WORLD },
  { id: FINAL_WORLD.case, name: FINAL_WORLD.caseName, description: `Cartuchera de la Liga Oscura. Guarda la ${FINAL_WORLD.medalName}.`, kind: "case", color: FINAL_WORLD },
  { id: WITNESS.id, name: WITNESS.name, description: WITNESS.description, kind: "case", color: { body: "#e8e2c8", ring: "#5a4a24", glyph: "◈" } },
];

// --------------------------------------------------------------- iconos
function drawMedal(color) {
  const canvas = createCanvas(48, 48);
  const ctx = canvas.getContext("2d");
  // cintas
  ctx.fillStyle = color.ring;
  ctx.beginPath(); ctx.moveTo(18, 2); ctx.lineTo(30, 2); ctx.lineTo(27, 20); ctx.lineTo(21, 20); ctx.fill();
  ctx.beginPath(); ctx.moveTo(12, 4); ctx.lineTo(20, 4); ctx.lineTo(24, 19); ctx.lineTo(17, 17); ctx.fill();
  ctx.beginPath(); ctx.moveTo(36, 4); ctx.lineTo(28, 4); ctx.lineTo(24, 19); ctx.lineTo(31, 17); ctx.fill();
  // disco
  ctx.fillStyle = color.ring;
  ctx.beginPath(); ctx.arc(24, 30, 15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = color.body;
  ctx.beginPath(); ctx.arc(24, 30, 11.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#101418";
  ctx.font = "bold 15px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(color.glyph, 24, 31);
  return canvas;
}

function drawCase(color) {
  const canvas = createCanvas(48, 48);
  const ctx = canvas.getContext("2d");
  // caja
  ctx.fillStyle = "#2a2f36";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(4, 12, 40, 28, 5); else ctx.rect(4, 12, 40, 28);
  ctx.fill();
  ctx.strokeStyle = color.ring;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(5, 13, 38, 26, 4); else ctx.rect(5, 13, 38, 26);
  ctx.stroke();
  // ranura con la medalla
  ctx.fillStyle = "#101418";
  ctx.beginPath(); ctx.arc(18, 26, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = color.body;
  ctx.beginPath(); ctx.arc(18, 26, 5.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#101418";
  ctx.font = "bold 8px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(color.glyph, 18, 27);
  // dos ranuras vacías
  ctx.strokeStyle = "#4a525c";
  ctx.lineWidth = 1.5;
  for (const cx of [32, 40]) { ctx.beginPath(); ctx.arc(cx, 26, 4, 0, Math.PI * 2); ctx.stroke(); }
  // broche
  ctx.fillStyle = color.ring;
  ctx.fillRect(20, 8, 8, 6);
  return canvas;
}

function installIcons() {
  fs.mkdirSync(ITEM_ICONS, { recursive: true });
  let drawn = 0;
  for (const item of ALL_ITEMS) {
    const file = path.join(ITEM_ICONS, `${item.id}.png`);
    if (DRY) { drawn++; continue; }
    fs.writeFileSync(file, (item.kind === "medal" ? drawMedal(item.color) : drawCase(item.color)).toBuffer("image/png"));
    drawn++;
  }
  return drawn;
}

// --------------------------------------------------------------- pedestales
/** Mapa del jefe de cada episodio, según el catálogo de eventos construido. */
function bossMaps() {
  const built = readJson(EVENTS).maps ?? {};
  const out = new Map();
  for (const [id, info] of Object.entries(built)) if (info.boss) out.set(info.episode, Number(id));
  return out;
}

function applyPedestals() {
  const catalog = readJson(CATALOG);
  const bosses = bossMaps();
  const summary = [];
  for (const world of WORLDS) {
    const episode = catalog.episodes.find((e) => e.key === world.key);
    const mapId = bosses.get(world.key);
    if (!episode || !mapId) { summary.push({ key: world.key, mapId: null, cell: null, error: "sin mapa de jefe" }); continue; }
    const seal = episode.seal;
    const progress = bossProgress(catalog, world.key);
    const g = grid(mapId);
    const sealEvent = g.events.find((e) => /Sello/.test(e.name)) ?? g.events.find((e) => /JEFE/.test(e.name));
    const from = sealEvent ? [sealEvent.x, sealEvent.y] : [Math.floor(g.width / 2), Math.floor(g.height / 2)];
    const entry = readJson(EVENTS).maps?.[String(mapId)]?.entry ?? [Math.floor(g.width / 2), g.height - 2];
    const reach = reachableFrom(g, entry);
    const cell = nearestFreeCell(g, from, { maxDistance: 8, allowed: reach });
    if (!cell) { summary.push({ key: world.key, mapId, cell: null, error: "sin celda libre" }); continue; }
    const name = `MEDALLA_${world.key}`;
    const built = upsertEvents(mapId, [name], (baseId) => [
      event(baseId, name, cell[0], cell[1], [
        // Página base primero; en RMXP siempre gana la página activa de número más alto.
        page({
          gfx: graphic("Object ball special", 2, 1, { hue: 0 }),
          list: [...texts([`Pedestal de ${world.world}.`, `Se encenderá cuando el sello cierre. La medalla se guarda en «${world.caseName}».`]), cmd(0)],
        }),
        page({
          cond: condition({ sw: seal, sw2: progress.phaseA, variable: [progress.variable, progress.total] }),
          gfx: graphic("Object ball special", 2, 1, { hue: 32 }),
          list: [
            ...texts([
              `El sello de ${world.world} está cerrado.`,
              `El pedestal entrega la ${world.medalName} y su cartuchera.`,
            ]),
            script(`begin; pbReceiveItem(:${world.medal}); pbReceiveItem(:${world.case}); rescue; pbMessage("(medalla ${world.medal} pendiente de registrar)"); end`),
            script(READY_CHECK),
            selfSwitch("A"),
            cmd(0),
          ],
        }),
        page({
          cond: condition({ self: "A" }),
          gfx: graphic("Object ball special", 2, 1, { hue: 0 }),
          list: [...texts([`El pedestal guarda la ${world.medalName}.`, `Cartuchera registrada: «${world.caseName}».`]), cmd(0)],
        }),
      ]),
    ], { dry: DRY });
    summary.push({ key: world.key, mapId, cell, seal, event: name, added: built.added.length });
  }
  applyWitness(summary);
  return summary;
}

/** Vitrina del Testigo: un evento en la Antesala (2040) que entrega `DN_CASE_WIT` una sola vez. */
function applyWitness(summary) {
  const mapId = WITNESS.hubMap;
  const g = grid(mapId);
  const entry = readJson(EVENTS).maps?.[String(mapId)]?.entry ?? [Math.floor(g.width / 2), g.height - 2];
  const reach = reachableFrom(g, entry);
  const cell = nearestFreeCell(g, entry, { maxDistance: 12, allowed: reach }) ?? [Math.floor(g.width / 2), Math.floor(g.height / 2)];
  const name = "VITRINA_TESTIGO";
  const built = upsertEvents(mapId, [name], (baseId) => [
    event(baseId, name, cell[0], cell[1], [
      page({
        gfx: graphic("Object ball special", 2, 1, { hue: 0 }),
        list: [...texts(["Vitrina del Testigo: nueve sellos por cerrar.", "Vuelve cuando los nueve mundos estén en silencio."]), cmd(0)],
      }),
      page({
        cond: condition({ sw: 931 }),
        gfx: graphic("Object ball special", 2, 1, { hue: 0 }),
        list: [
          ...texts([
            "La Vitrina del Testigo tiene nueve huecos.",
            "Nueve sellos cerrados: la vitrina se abre sola y entrega una cartuchera vacía.",
            "«Badges of the Witness»: el registro de quien vio cerrarse los nueve mundos.",
          ]),
          script(`begin; pbReceiveItem(:${WITNESS.id}); rescue; pbMessage("(cartuchera del testigo pendiente de registrar)"); end`),
          selfSwitch("A"),
          cmd(0),
        ],
      }),
      page({
        cond: condition({ self: "A" }),
        gfx: graphic("Object ball special", 2, 1, { hue: 32 }),
        list: [...texts(["La Vitrina del Testigo guarda tu cartuchera.", "Nueve mundos, nueve medallas, un solo testigo."]), cmd(0)],
      }),
    ]),
  ], { dry: DRY });
  summary.push({ key: "WIT", mapId, cell, seal: 931, event: name, added: built.added.length });
}

// --------------------------------------------------------------- verificación
function verify() {
  const failures = [];
  const ok = (cond, msg) => { if (!cond) failures.push(msg); };
  const items = readData("items.dat");
  const bySymbol = new Map(items.pairs.filter(([k]) => k && k.name !== undefined).map(([k, v]) => [k.name, v]));
  for (const item of ALL_ITEMS) {
    const entry = bySymbol.get(item.id);
    ok(!!entry, `falta el objeto ${item.id}`);
    if (!entry) continue;
    ok(txt(entry.getIvar("@real_name")) === item.name, `${item.id}: nombre «${txt(entry.getIvar("@real_name"))}» ≠ «${item.name}»`);
    ok(entry.getIvar("@pocket") === 8, `${item.id}: no es objeto clave`);
    ok(fs.existsSync(path.join(ITEM_ICONS, `${item.id}.png`)), `${item.id}: falta el icono 48×48`);
  }
  for (const world of WORLDS) {
    ok(readData("items.dat").pairs.some(([k, v]) => k && k.name !== undefined && k.name === world.case &&
      txt(v.getIvar("@real_name")) === `Badges of ${world.world}`), `${world.case}: la cartuchera no se llama «Badges of ${world.world}»`);
  }
  // pedestales
  const catalog = readJson(CATALOG);
  const bosses = bossMaps();
  for (const world of WORLDS) {
    const mapId = bosses.get(world.key);
    ok(!!mapId, `${world.key}: sin mapa de jefe en el catálogo`);
    if (!mapId) continue;
    const g = grid(mapId);
    const ev = g.events.find((e) => e.name === `MEDALLA_${world.key}`);
    ok(!!ev, `Map${mapId}: falta el pedestal MEDALLA_${world.key}`);
    if (!ev) continue;
    ok(ev.pages.length === 3, `${world.key}: el pedestal necesita 3 páginas (bloqueada / entrega / registrada)`);
    const claim = ev.pages[1];
    const progress = bossProgress(catalog, world.key);
    const claimCondition = claim?.getIvar("@condition");
    const sealOk = claimCondition?.getIvar("@switch1_id") === catalog.episodes.find((e) => e.key === world.key).seal &&
      claimCondition?.getIvar("@switch1_valid") === true
      && claimCondition?.getIvar("@switch2_id") === progress.phaseA && claimCondition?.getIvar("@switch2_valid") === true
      && claimCondition?.getIvar("@variable_id") === progress.variable && claimCondition?.getIvar("@variable_value") === progress.total
      && claimCondition?.getIvar("@variable_valid") === true;
    ok(sealOk, `${world.key}: la página que entrega la medalla no exige sello, victoria y fase B completa`);
    const claimText = (claim?.getIvar("@list") ?? []).map((c) => (c.getIvar("@parameters") ?? []).map((p) => txt(p)).join(" ")).join(" ");
    ok(claimText.includes(`:${world.medal}`) && claimText.includes(`:${world.case}`), `${world.key}: el pedestal no entrega medalla y cartuchera`);
    ok(!(ev.pages[0]?.getIvar("@condition")?.getIvar("@switch1_valid") ?? false)
      && !(ev.pages[0]?.getIvar("@condition")?.getIvar("@self_switch_valid") ?? false), `${world.key}: la página bloqueada no es la página base`);
    ok((ev.pages[2]?.getIvar("@condition")?.getIvar("@self_switch_valid") ?? false) === true, `${world.key}: falta la página «ya registrada» (self-switch A)`);
  }
  // Vitrina del Testigo (2040)
  {
    const g = grid(WITNESS.hubMap);
    const ev = g.events.find((e) => e.name === "VITRINA_TESTIGO");
    ok(!!ev, `Map${WITNESS.hubMap}: falta la VITRINA_TESTIGO`);
    if (ev) {
      const locked = ev.pages[0]?.getIvar("@condition");
      const claim = ev.pages[1];
      const cond = claim?.getIvar("@condition");
      ok(!(locked?.getIvar("@switch1_valid") ?? false) && !(locked?.getIvar("@self_switch_valid") ?? false),
        "VITRINA_TESTIGO: la página bloqueada debe ser la página base");
      ok(cond?.getIvar("@switch1_id") === 931 && cond?.getIvar("@switch1_valid") === true,
        "VITRINA_TESTIGO: la página de entrega debe exigir el switch 931 (nueve sellos)");
      const claimText = (claim?.getIvar("@list") ?? []).map((c) => (c.getIvar("@parameters") ?? []).map((p) => txt(p)).join(" ")).join(" ");
      ok(claimText.includes(`:${WITNESS.id}`), "VITRINA_TESTIGO: no entrega DN_CASE_WIT");
      ok(ev.pages[2]?.getIvar("@condition")?.getIvar("@self_switch_valid") === true,
        "VITRINA_TESTIGO: la página registrada debe cerrar con self-switch A");
    }
    const entry = readData("items.dat");
    const wit = entry.pairs.find(([k, v]) => k && k.name !== undefined && k.name === WITNESS.id);
    ok(!!wit, `falta el objeto ${WITNESS.id}`);
    if (wit) ok(txt(wit[1].getIvar("@real_name")) === WITNESS.name, `${WITNESS.id}: nombre ≠ «${WITNESS.name}»`);
  }
  console.log(`verificación de medallas y cartucheras (${ALL_ITEMS.length} objetos, ${WORLDS.length} pedestales, 1 vitrina)`);
  if (failures.length) { for (const f of failures) console.error(`  FALLA: ${f}`); process.exit(1); }
  console.log("verificación de medallas OK");
}

// --------------------------------------------------------------- main
if (VERIFY) {
  verify();
} else {
  const written = writeItems(ALL_ITEMS, { base: ITEM_BASE, dry: DRY });
  const icons = installIcons();
  const pedestals = applyPedestals();
  console.log(`objetos: ${written.filter((w) => !w.existed).length} nuevos · iconos: ${icons}`);
  for (const p of pedestals) {
    console.log(p.error ? `  ${p.key}: ${p.error}` : `  ${p.key}: pedestal en Map${p.mapId} @ ${p.cell.join(",")} (sello ${p.seal})`);
  }
}
