// ============================================================================
// validate_boot_classes.mjs
// ----------------------------------------------------------------------------
// Verificación de arranque: todo nombre de clase serializado dentro de los
// .dat / .rxdata que se distribuyen debe existir como class/module en los
// Scripts.rxdata que acompañan al paquete (o ser núcleo RGSS/Ruby). Esto es
// exactamente lo que Ruby comprueba al hacer load_data en el arranque; si un
// nombre no existe, el juego muere con "undefined class/module X".
//
//   node tools/validate_boot_classes.mjs
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { marshalLoad, RObject, RStruct, RClassRef, RUserDef, RUserMarshal } from "../web/js/marshal.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Clases del núcleo RGSS1 (viven en RGSS10x.dll / Kirin, no en los scripts)
// más primitivas de Ruby que pueden aparecer serializadas.
const CORE = new Set([
  "Table", "Color", "Tone", "Rect", "String", "Array", "Hash", "Symbol",
  "NilClass", "TrueClass", "FalseClass", "Integer", "Float", "Range",
  "Regexp", "Fixnum", "Bignum", "Object", "Proc",
  "RPG::Actor", "RPG::Actor::Learning", "RPG::Class", "RPG::Skill",
  "RPG::Item", "RPG::Weapon", "RPG::Armor", "RPG::Enemy",
  "RPG::Enemy::Action", "RPG::Troop", "RPG::Troop::Member",
  "RPG::Troop::Page", "RPG::Troop::Page::Condition", "RPG::State",
  "RPG::Animation", "RPG::Animation::Frame", "RPG::Animation::Timing",
  "RPG::Tileset", "RPG::CommonEvent", "RPG::System", "RPG::System::Words",
  "RPG::System::TestBattler", "RPG::AudioFile", "RPG::MoveRoute",
  "RPG::MoveCommand", "RPG::EventCommand", "RPG::Event", "RPG::Event::Page",
  "RPG::Event::Page::Condition", "RPG::Event::Page::Graphic",
  "RPG::Map", "RPG::MapInfo",
]);

function sectionCode(entry) {
  const bytes = entry[2].bytes ?? entry[2];
  const buf = Buffer.from(bytes);
  if (buf.length > 2 && buf[0] === 0x78 && buf[1] === 0x9c) {
    return zlib.inflateSync(buf).toString("utf-8");
  }
  return buf.toString("utf-8");
}

/** Nombres completos (con namespace) de class/module definidos en el código. */
export function definedClasses(code) {
  const defs = new Set();
  const frames = []; // { kind: 'class'|'module'|'other', name? }
  const namespace = () => frames.filter((f) => f.name).map((f) => f.name).join("::");
  const lines = code.split(/\r?\n/);
  let heredoc = null;
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (heredoc) {
      if (line.trim() === heredoc) heredoc = null;
      continue;
    }
    const hd = line.match(/<<[~-]?["']?([A-Za-z_][A-Za-z0-9_]*)["']?/);
    if (hd) heredoc = hd[1];
    const stripped = line.split("#")[0];
    const cm = stripped.match(/^\s*(class|module)\s+([A-Za-z_][A-Za-z0-9_]*(?:::[A-Za-z_][A-Za-z0-9_]*)*)/);
    if (cm) {
      const ns = namespace();
      const full = cm[2].includes("::") || !ns ? cm[2] : `${ns}::${cm[2]}`;
      defs.add(full);
      // también registra cada prefijo del propio nombre (module RPG ya contado)
      frames.push({ kind: cm[1], name: cm[2].includes("::") ? null : cm[2] });
      // nombre con :: anida: empuja cada segmento
      if (cm[2].includes("::")) {
        frames.pop();
        for (const seg of cm[2].split("::")) frames.push({ kind: cm[1], name: seg });
      }
      continue;
    }
    if (/^\s*end\b/.test(stripped)) { frames.pop(); continue; }
    if (/^\s*(def|begin|case)\b/.test(stripped)) { frames.push({ kind: "other" }); continue; }
    if (/^\s*(if|unless|while|until|for)\b/.test(stripped)) { frames.push({ kind: "other" }); continue; }
    if (/\bdo\s*(\|[^|]*\|)?\s*$/.test(stripped)) { frames.push({ kind: "other" }); continue; }
  }
  return defs;
}

function collectDefined(scriptsPath) {
  const scripts = marshalLoad(fs.readFileSync(scriptsPath));
  const defs = new Set(CORE);
  for (const entry of scripts) {
    for (const name of definedClasses(sectionCode(entry))) defs.add(name);
  }
  return defs;
}

function collectReferenced(value, out) {
  if (value instanceof RObject || value instanceof RUserDef || value instanceof RUserMarshal) {
    out.add(value.className);
    if (value instanceof RObject) for (const [, v] of value.ivars) collectReferenced(v, out);
    return;
  }
  if (value instanceof RStruct) {
    out.add(value.name);
    for (const [, v] of value.pairs) collectReferenced(v, out);
    return;
  }
  if (value instanceof RClassRef) { out.add(value.name); return; }
  if (Array.isArray(value)) { for (const v of value) collectReferenced(v, out); return; }
  if (value && value.pairs) { for (const [k, v] of value.pairs) { collectReferenced(k, out); collectReferenced(v, out); } }
}

function checkPackage(label, scriptsPath, dataDir) {
  const defs = collectDefined(scriptsPath);
  const problems = [];
  let files = 0;
  for (const name of fs.readdirSync(dataDir).sort()) {
    if (!/\.(dat|rxdata)$/i.test(name)) continue;
    const file = path.join(dataDir, name);
    const raw = fs.readFileSync(file);
    // Formatos propios del juego (texto/binario) que no pasan por Marshal.load.
    if (raw[0] !== 0x04 || raw[1] !== 0x08) continue;
    // Archivos de sólo-compilación o temporales: el arranque y la partida no
    // los cargan jamás (únicos consumidores: Compiler / editor). Verificado
    // grepeando los scripts: ninguna referencia fuera de 385_Compiler.
    if (["TilesetsTemp.rxdata", "ZUD_PowerMoves.dat", "metrics.dat"].includes(name)) continue;
    files++;
    let value;
    try {
      value = marshalLoad(raw);
    } catch (e) {
      problems.push(`${name}: no se pudo leer (${e.message})`);
      continue;
    }
    const refs = new Set();
    collectReferenced(value, refs);
    for (const r of refs) {
      if (!defs.has(r)) problems.push(`${name}: referencia ${r} (no definida en scripts ni núcleo)`);
    }
  }
  console.log(`── ${label}: ${files} archivos de datos contra ${path.relative(ROOT, scriptsPath)}`);
  if (problems.length) {
    for (const p of problems) console.log(`   ✘ ${p}`);
  } else {
    console.log("   ✔ todas las clases serializadas están definidas");
  }
  return problems.length;
}

let bad = 0;
bad += checkPackage("Juego de desarrollo",
  path.join(ROOT, "pokemon_fire_ash/Data/Scripts.rxdata"),
  path.join(ROOT, "pokemon_fire_ash/Data"));
bad += checkPackage("Paquete directo",
  path.join(ROOT, "Scripts_corregido/Paquete_directo/Data/Scripts.rxdata"),
  path.join(ROOT, "Scripts_corregido/Paquete_directo/Data"));
bad += checkPackage("Dimensional Nightmare QA",
  path.join(ROOT, "Scripts_corregido/Dimensional_Nightmare_QA/Data/Scripts.rxdata"),
  path.join(ROOT, "Scripts_corregido/Dimensional_Nightmare_QA/Data"));
bad += checkPackage("Expansión Multiversal (scripts de DN QA)",
  path.join(ROOT, "Scripts_corregido/Dimensional_Nightmare_QA/Data/Scripts.rxdata"),
  path.join(ROOT, "Scripts_corregido/Expansion_Multiversal/Data"));

if (bad > 0) {
  console.error(`✘ ${bad} problema(s) de clases serializadas`);
  process.exit(1);
}
console.log("OK: verificación de clases de arranque superada");
