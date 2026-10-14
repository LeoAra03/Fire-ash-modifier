#!/usr/bin/env node
/**
 * dump_script_section.mjs — vuelca una sección de `Data/Scripts.rxdata` a texto.
 *
 * Uso:
 *   node tools/dump_script_section.mjs <archivo.rxdata> [lista|nombre]
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { marshalLoad } from "../web/js/marshal.js";

const file = process.argv[2] || "pokemon_fire_ash/Data/Scripts.rxdata";
const wanted = process.argv[3];
const scripts = marshalLoad(fs.readFileSync(file));
if (!wanted || wanted === "lista") {
  if (!wanted) throw new Error("indica un nombre de sección o «lista»");
  for (const [, entry] of scripts) {
    const nombre = entry && entry.text ? entry.text : String(entry);
    const bytes = scripts.find(([, e]) => e === entry)?.[2];
    console.log(nombre);
  }
} else {
  const entry = scripts.find(([, e]) => e && e.text === wanted);
  if (!entry) throw new Error(`sección no encontrada: ${wanted}`);
  const raw = entry[2].bytes ? Buffer.from(entry[2].bytes) : Buffer.from(entry[2]);
  let src;
  try { src = zlib.inflateSync(raw).toString("utf8"); }
  catch { src = raw.toString("utf8"); }
  process.stdout.write(src);
}
