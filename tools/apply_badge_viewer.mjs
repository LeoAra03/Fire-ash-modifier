// ============================================================================
// apply_badge_viewer.mjs
// ----------------------------------------------------------------------------
// Visor de medallas región por región en la información del jugador, como el
// de las regiones base de Fire Ash pero extendido a las regiones nuevas:
//
//   filas 0-8  : regiones base (Kanto…Orange), ya cableadas por el juego con
//                $Trainer.badges[region*8+i].
//   fila  9    : Glazed            (medallas en la Mochila)
//   fila 10    : Light Platinum    (medallas en la Mochila)
//   fila 11    : Liquid Crystal    (medallas en la Mochila)
//   fila 12    : Creepypastas      (sellos de los 8 jefes del multiverso,
//                                   switches 940-947)
//   fila 13    : Dimensión Atlas   (las 8 medallas de elemento ATLAS*)
//   fila 14    : Ciudad Teckel     (Medalla Pata)
//
// En la Tarjeta de Entrenador, ◀/▶ cambian de región y la hoja de iconos
// icon_badges.png se extiende de 9 a 15 filas con emblemas nuevos.
//
//   node tools/apply_badge_viewer.mjs            # aplica
//   node tools/apply_badge_viewer.mjs --verify   # solo comprueba
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import {
  ROOT, GAME, marshalLoad, marshalDump, RString, installItems, makeChecker,
} from "./lib/dlc_helpers.mjs";
import { badgeRowCanvas, REGION_PALETTES } from "./lib/badge_icons.mjs";
import { patchedCard } from "./lib/card_patch.mjs";

const VERIFY = process.argv.includes("--verify");
const ROWS = 15;
const SHEET = path.join(GAME, "Graphics", "Pictures", "Trainer Card", "icon_badges.png");

const SCRIPT_TARGETS = [
  "pokemon_fire_ash/Data/Scripts.rxdata",
  "Scripts_corregido/Scripts.rxdata",
  "Scripts_corregido/Paquete_directo/Data/Scripts.rxdata",
  "Scripts_corregido/Dimensional_Nightmare_QA/Data/Scripts.rxdata",
];

/* ───────────────────────────── código Ruby ─────────────────────────────── */

const REGISTRY_RUBY = `# ==============================================================================
# PokeMod_BadgeRegions — registro de regiones de medallas del visor.
# ==============================================================================
module PokeModBadgeRegions
  ROWS = ${ROWS}
  BASE_NAMES = ["Kanto", "Johto", "Hoenn", "Sinnoh", "Unova", "Kalos", "Alola", "Galar", "Orange"]
  REGIONS = {
    9  => ["Glazed", :items, [:GLAZEDBADGE, :GLAZEDBADGE2, :GLAZEDBADGE3, :GLAZEDBADGE4, :GLAZEDBADGE5, :GLAZEDBADGE6, :GLAZEDBADGE7, :GLAZEDBADGE8]],
    10 => ["Light Platinum", :items, [:PLATINUMBADGE, :PLATINUMBADGE2, :PLATINUMBADGE3, :PLATINUMBADGE4, :PLATINUMBADGE5, :PLATINUMBADGE6, :PLATINUMBADGE7, :PLATINUMBADGE8]],
    11 => ["Liquid Crystal", :items, [:CRYSTALBADGE, :CRYSTALBADGE2, :CRYSTALBADGE3, :CRYSTALBADGE4, :CRYSTALBADGE5, :CRYSTALBADGE6, :CRYSTALBADGE7, :CRYSTALBADGE8]],
    12 => ["Creepypastas", :switches, [940, 941, 942, 943, 944, 945, 946, 947]],
    13 => ["Dimensión Atlas", :items, [:ATLASBRUMABADGE, :ATLASVETABADGE, :ATLASDUNABADGE, :ATLASFRAGUABADGE, :ATLASMAREABADGE, :ATLASVENTABADGE, :ATLASFLORABADGE, :ATLASCHISPABADGE]],
    14 => ["Ciudad Teckel", :items, [:TECKELBADGE]],
  }

  def self.region_name(r)
    return BASE_NAMES[r] if r <= 8
    meta = REGIONS[r]
    return meta ? meta[0] : "Región #{r + 1}"
  end

  def self.owned?(r, i)
    if r <= 8
      return ($Trainer && $Trainer.badges[i + r * 8]) ? true : false
    end
    meta = REGIONS[r]
    return false if !meta
    key = meta[2][i]
    return false if key.nil?
    if meta[1] == :switches
      return $game_switches ? !!$game_switches[key] : false
    end
    return pbHasItem?(key)
  end
end
`;

/* El código de la tarjeta vive en tools/lib/card_patch.mjs (parche del original). */

/* ─────────────────────────────── hoja de iconos ────────────────────────── */

async function extendSheet() {
  const image = await loadImage(SHEET);
  if (image.height >= ROWS * 48) return false;
  const canvas = createCanvas(384, ROWS * 48);
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, 0, 0);
  const rows = [
    [9, REGION_PALETTES.glazed], [10, REGION_PALETTES.platinum], [11, REGION_PALETTES.crystal],
    [12, REGION_PALETTES.creepy], [13, REGION_PALETTES.atlas], [14, REGION_PALETTES.teckel],
  ];
  for (const [row, pal] of rows) {
    ctx.drawImage(badgeRowCanvas(pal), 0, row * 48);
  }
  fs.writeFileSync(SHEET, canvas.toBuffer("image/png"));
  return true;
}

/* ─────────────────────────── scripts (4 archivos) ──────────────────────── */

function codeOf(entry) {
  const b = Buffer.from(entry[2].bytes);
  return (b[0] === 0x78 && b[1] === 0x9c ? zlib.inflateSync(b) : b).toString("utf8");
}
function setCode(entry, text) {
  entry[2].bytes = new Uint8Array(zlib.deflateSync(Buffer.from(text, "utf8")));
}

function patchScripts(file) {
  const scripts = marshalLoad(fs.readFileSync(path.join(ROOT, file)));
  let changed = 0;

  const card = scripts.find((e) => (e[1].text ?? String(e[1])) === "UI_TrainerCard");
  if (!card) throw new Error(`${file}: sin sección UI_TrainerCard`);
  const cardCode = codeOf(card);
  if (!cardCode.includes("PokeModBadgeRegions") || !cardCode.includes("PokemonTrainerCardScreen")) {
    setCode(card, patchedCard());
    changed++;
  }

  const mainIdx = scripts.findIndex((e) => (e[1].text ?? String(e[1])) === "Main");
  const existing = scripts.findIndex((e) => (e[1].text ?? String(e[1])) === "PokeMod_BadgeRegions");
  if (existing >= 0) {
    if (!codeOf(scripts[existing]).includes("ROWS = 15")) { setCode(scripts[existing], REGISTRY_RUBY); changed++; }
  } else {
    const entry = [99971, RString.fromText("PokeMod_BadgeRegions"), new RString("")];
    setCodeFromEntry(entry);
    scripts.splice(mainIdx, 0, entry);
    changed++;
  }
  if (changed) fs.writeFileSync(path.join(ROOT, file), Buffer.from(marshalDump(scripts)));
  return changed;
}
function setCodeFromEntry(entry) {
  entry[2].bytes = new Uint8Array(zlib.deflateSync(Buffer.from(REGISTRY_RUBY, "utf8")));
}

/* ────────────────────────────────── apply ──────────────────────────────── */

async function apply() {
  const sheetChanged = await extendSheet();
  console.log(sheetChanged ? "✔ icon_badges.png extendido a 15 filas" : "· icon_badges.png ya tenía 15 filas");

  installItems([
    ...[2, 3, 4, 5, 6, 7, 8].map((n) => ({ id: `GLAZEDBADGE${n}`, base: "GLAZEDBADGE", nombre: `Medalla Glazed ${["", "", "II", "III", "IV", "V", "VI", "VII", "VIII"][n]}` })),
    ...[2, 3, 4, 5, 6, 7, 8].map((n) => ({ id: `PLATINUMBADGE${n}`, base: "PLATINUMBADGE", nombre: `Medalla Platinum ${["", "", "II", "III", "IV", "V", "VI", "VII", "VIII"][n]}` })),
    ...[2, 3, 4, 5, 6, 7, 8].map((n) => ({ id: `CRYSTALBADGE${n}`, base: "CRYSTALBADGE", nombre: `Medalla Crystal ${["", "", "II", "III", "IV", "V", "VI", "VII", "VIII"][n]}` })),
  ], "badge_viewer");

  for (const target of SCRIPT_TARGETS) {
    const n = patchScripts(target);
    console.log(`✔ ${target}: ${n} secciones actualizadas`);
  }

  // items.dat del juego es superconjunto de los paquetes: sincronizar copias.
  for (const pkg of ["Paquete_directo", "Dimensional_Nightmare_QA", "Expansion_Multiversal", "Ciudad_Teckel_Paraiso"]) {
    fs.copyFileSync(path.join(GAME, "Data/items.dat"), path.join(ROOT, "Scripts_corregido", pkg, "Data/items.dat"));
  }

  // La hoja extendida también en las carpetas de los paquetes.
  for (const dst of [
    path.join(ROOT, "Scripts_corregido/Paquete_directo/Graphics/Pictures/Trainer Card/icon_badges.png"),
    path.join(ROOT, "Scripts_corregido/Dimensional_Nightmare_QA/Graphics/Pictures/Trainer Card/icon_badges.png"),
  ]) {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(SHEET, dst);
  }
  console.log("OK: visor de medallas región por región instalado");
}

function verify() {
  const check = makeChecker("visor de medallas");
  const size = fs.readFileSync(SHEET);
  check.ok(size.readUInt32BE(20) >= ROWS * 48, `la hoja sigue midiendo ${size.readUInt32BE(20)}px de alto`);
  const items = marshalLoad(fs.readFileSync(path.join(GAME, "Data/items.dat")));
  for (const sym of ["GLAZEDBADGE8", "PLATINUMBADGE8", "CRYSTALBADGE8"]) {
    check.ok(items.pairs.some(([k]) => (k?.name ?? "") === sym), `falta el objeto ${sym}`);
  }
  for (const target of SCRIPT_TARGETS) {
    const scripts = marshalLoad(fs.readFileSync(path.join(ROOT, target)));
    const reg = scripts.find((e) => (e[1].text ?? "") === "PokeMod_BadgeRegions");
    const card = scripts.find((e) => (e[1].text ?? "") === "UI_TrainerCard");
    check.ok(!!reg && codeOf(reg).includes("ROWS = 15"), `${target}: falta el registro de regiones`);
    const cc = card ? codeOf(card) : "";
    check.ok(!!card && cc.includes("PokeModBadgeRegions") && cc.includes("PokemonTrainerCardScreen") && cc.includes("pbEndScene"), `${target}: la tarjeta no usa el visor`);
  }
  for (const pkg of ["Paquete_directo", "Dimensional_Nightmare_QA", "Expansion_Multiversal", "Ciudad_Teckel_Paraiso"]) {
    const same = fs.readFileSync(path.join(ROOT, "Scripts_corregido", pkg, "Data/items.dat")).equals(fs.readFileSync(path.join(GAME, "Data/items.dat")));
    check.ok(same, `${pkg}/Data/items.dat desactualizado frente al del juego`);
  }
  check.done();
}

if (VERIFY) verify();
else { await apply(); verify(); }
