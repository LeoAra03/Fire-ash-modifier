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
 * Los dos últimos (Medalla del Vínculo · Badges of Mad Pikachu) los entrega la Liga Oscura
 * (`tools/dn_build_liga.mjs`), que reutiliza estas mismas definiciones.
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
];

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
        page({
          cond: condition({ self: "A" }),
          gfx: graphic("Object ball special", 2, 1, { hue: 0 }),
          list: [...texts([`El pedestal guarda la ${world.medalName}.`, `Cartuchera registrada: «${world.caseName}».`]), cmd(0)],
        }),
        page({
          cond: condition({ sw: seal }),
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
          gfx: graphic("Object ball special", 2, 1, { hue: 0 }),
          list: [...texts([`Pedestal de ${world.world}.`, `Se encenderá cuando el sello cierre. La medalla se guarda en «${world.caseName}».`]), cmd(0)],
        }),
      ]),
    ], { dry: DRY });
    summary.push({ key: world.key, mapId, cell, seal, event: name, added: built.added.length });
  }
  return summary;
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
    ok(ev.pages.length === 3, `${world.key}: el pedestal necesita 3 páginas (registrada / sello / vacío)`);
    const claim = ev.pages[1];
    const sealOk = claim?.getIvar("@condition")?.getIvar("@switch1_id") === catalog.episodes.find((e) => e.key === world.key).seal &&
      claim?.getIvar("@condition")?.getIvar("@switch1_valid") === true;
    ok(sealOk, `${world.key}: la página que entrega la medalla no está condicionada al sello`);
    const claimText = (claim?.getIvar("@list") ?? []).map((c) => (c.getIvar("@parameters") ?? []).map((p) => txt(p)).join(" ")).join(" ");
    ok(claimText.includes(`:${world.medal}`) && claimText.includes(`:${world.case}`), `${world.key}: el pedestal no entrega medalla y cartuchera`);
    ok((ev.pages[0]?.getIvar("@condition")?.getIvar("@self_switch_valid") ?? false) === true, `${world.key}: falta la página «ya registrada» (self-switch A)`);
  }
  console.log(`verificación de medallas y cartucheras (${ALL_ITEMS.length} objetos, ${WORLDS.length} pedestales)`);
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
