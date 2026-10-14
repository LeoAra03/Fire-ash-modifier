#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const ROOT = path.resolve(import.meta.dirname, "..");
const roots = [path.join(ROOT, "pokemon_fire_ash", "Graphics", "Characters"), path.join(ROOT, "pokemon_fire_ash", "Graphics", "Pokemon")];
const requiredCharacters = ["ARCEUS.png", "ARC_Cynthia.png", "ARC_Steven.png", "NC_Red.png"];
let checked = 0;
const failures = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.png$/i.test(entry.name) && (/^ARCEUS/i.test(entry.name) || /^ARC_/i.test(entry.name) || entry.name === "NC_Red.png")) verifyPng(full);
  }
}
function verifyPng(file) {
  const data = fs.readFileSync(file);
  if (!data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return failures.push(`${file}: bad PNG signature`);
  let offset = 8, width = 0, height = 0, idat = [];
  while (offset + 12 <= data.length) {
    const length = data.readUInt32BE(offset); const type = data.toString("ascii", offset + 4, offset + 8);
    if (offset + 12 + length > data.length) return failures.push(`${file}: truncated ${type}`);
    const payload = data.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") { width = payload.readUInt32BE(0); height = payload.readUInt32BE(4); }
    if (type === "IDAT") idat.push(payload);
    offset += 12 + length;
    if (type === "IEND") break;
  }
  if (!width || !height || !idat.length) return failures.push(`${file}: missing image data`);
  try { if (!zlib.inflateSync(Buffer.concat(idat)).length) throw new Error("empty pixels"); }
  catch (error) { return failures.push(`${file}: undecodable pixels (${error.message})`); }
  if (file.includes(`${path.sep}Characters${path.sep}`) && (width % 4 || height % 4)) failures.push(`${file}: character sheet is not divisible into 4x4 frames`);
  checked++;
}
for (const name of requiredCharacters) if (!fs.existsSync(path.join(roots[0], name))) failures.push(`missing required character ${name}`);
for (const root of roots) walk(root);
if (checked < 10) failures.push(`expected at least 10 Arceus encounter assets, decoded ${checked}`);
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log(`OK: ${checked} Arceus/allies PNG assets decoded; map sheets have valid 4x4 frame geometry.`);
