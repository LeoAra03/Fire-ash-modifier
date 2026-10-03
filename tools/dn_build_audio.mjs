#!/usr/bin/env node
/**
 * dn_build_audio.mjs — MIDI original y asignación de BGM propia para Dimensional Nightmare.
 *
 * No convierte ni modifica música comercial. Compone bucles MIDI breves con instrumentos GM
 * estándar, asigna cada tema a los mapas DN y deja EP05 (Map2104–2109) en silencio explícito.
 * Incluye guardas de escritura/verificación e inventario SHA-256 reproducible.
 *
 * Uso: node tools/dn_build_audio.mjs [--verify]
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { marshalLoad, marshalDump, RObject, RString } from "../web/js/marshal.js";
import { backup } from "./lib/dn_rmxp.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GAME = path.join(ROOT, "pokemon_fire_ash");
const DATA = path.join(GAME, "Data");
const BGM_DIR = path.join(GAME, "Audio", "BGM");
const MANIFEST = path.join(ROOT, "content", "dimensional_nightmare_audio.json");
const VERIFY = process.argv.includes("--verify");
const PPQ = 480;

// Cada motivo y armonía es original; la paleta instrumental sólo usa General MIDI.
const TRACKS = [
  {
    name: "DN_WitnessAtrium", title: "The Witness Atrium", bpm: 64, beats: 4, bars: 8,
    root: 60, scale: [0, 2, 3, 5, 7, 9, 10], pad: 89, bass: 48, lead: 10, volume: 48,
    progression: [0, 5, 3, 4],
    motif: [[[0, 0, 1.5], [2, 4, 1], [3, 2, 1]], [[0, 5, 2], [2.5, 4, 1]], [[0, 3, 1], [1.5, 2, 1], [3, 0, 0.8]], [[0, 4, 2.5], [3, 2, 0.8]]],
    mood: "Umbral sereno del hub; piano-celesta tenue sobre un acorde suspendido.",
  },
  {
    name: "DN_WhiteHand", title: "A Hand Beneath the Ash", bpm: 68, beats: 4, bars: 8,
    root: 50, scale: [0, 2, 3, 5, 7, 8, 11], pad: 48, bass: 43, lead: 11, volume: 46,
    progression: [0, 3, 5, 4],
    motif: [[[0, 0, 2], [2.5, 4, 0.8]], [[0, 2, 1], [1.5, 5, 1.5]], [[0, 4, 1.5], [2, 3, 1]], [[0, 5, 2.5]]],
    mood: "Pulso de piedra y ceniza; figura de campana original, lenta y sin percusión.",
  },
  {
    name: "DN_LostSilver", title: "The Name Left Behind", bpm: 62, beats: 4, bars: 8,
    root: 49, scale: [0, 2, 3, 5, 7, 8, 10], pad: 89, bass: 42, lead: 8, volume: 44,
    progression: [0, 4, 3, 5],
    motif: [[[0, 4, 1.5], [2, 6, 0.8], [3, 5, 0.8]], [[0, 3, 2], [2.5, 2, 1]], [[0, 4, 1], [1.5, 1, 1.5]], [[0, 0, 2.5]]],
    mood: "Celesta distante y armonía menor; una frase que vuelve sin resolver el nombre.",
  },
  {
    name: "DN_SnowSilver", title: "Snow on the Witness Ridge", bpm: 54, beats: 3, bars: 8,
    root: 52, scale: [0, 2, 3, 5, 7, 9, 10], pad: 88, bass: 42, lead: 11, volume: 42,
    progression: [0, 5, 2, 4],
    motif: [[[0, 0, 2], [2, 4, 0.7]], [[0, 5, 1.7], [2, 3, 0.7]], [[0, 2, 2.5]], [[0, 4, 1], [1.5, 5, 1]]],
    mood: "Tres pulsos amplios, como pasos sobre nieve; aireado, sin reutilizar una melodía existente.",
  },
  {
    name: "DN_Hypnos_Lullaby", title: "The Hollow Trunk Lullaby", bpm: 60, beats: 3, bars: 8,
    root: 57, scale: [0, 2, 3, 5, 7, 8, 10], pad: 89, bass: 43, lead: 10, volume: 52,
    progression: [0, 3, 5, 4],
    motif: [[[0, 0, 1.4], [1.5, 2, 0.7], [2.25, 4, 0.6]], [[0, 5, 1.2], [1.5, 4, 1]], [[0, 3, 1.6], [1.75, 2, 0.8]], [[0, 4, 2.2]]],
    mood: "Canción de cuna propia de tres pulsos; la BGM se puede apagar durante el silenciador.",
  },
  {
    name: "DN_PokemonBlack", title: "A Signal with No Sender", bpm: 72, beats: 4, bars: 8,
    root: 51, scale: [0, 1, 3, 5, 6, 8, 10], pad: 96, bass: 38, lead: 12, volume: 36,
    progression: [0, 0, 4, 3],
    motif: [[[0, 0, 0.3], [0.5, 0, 0.3], [2.5, 4, 0.25]], [[1, 3, 0.3], [3, 6, 0.25]], [[0, 5, 0.25], [2, 2, 0.25]], [[0.5, 0, 0.3], [3, 1, 0.25]]],
    mood: "Código tonal escaso que emerge tras el tramo de silencio absoluto de EP05.",
  },
  {
    name: "DN_KingUnown", title: "Seven Letters, One Throne", bpm: 70, beats: 4, bars: 8,
    root: 51, scale: [0, 2, 3, 5, 6, 8, 10], pad: 48, bass: 32, lead: 12, volume: 48,
    progression: [0, 3, 6, 4],
    motif: [[[0, 0, 1], [1, 2, 0.7], [2, 6, 1]], [[0, 5, 1.5], [2, 4, 1]], [[0, 3, 1], [1.5, 6, 1], [3, 5, 0.7]], [[0, 4, 2.5]]],
    mood: "Órgano suspendido y siete grados que se contestan; trono sin fanfarria prestada.",
  },
  {
    name: "DN_AshenGuardian", title: "Ashen Guardian", bpm: 76, beats: 4, bars: 8,
    root: 62, scale: [0, 2, 4, 5, 7, 9, 11], pad: 89, bass: 32, lead: 0, volume: 50,
    progression: [0, 5, 3, 4],
    motif: [[[0, 0, 1.5], [1.5, 2, 0.8], [2.5, 4, 1]], [[0, 5, 1], [1.5, 4, 0.8], [2.5, 2, 1]], [[0, 3, 1.5], [2, 4, 0.8]], [[0, 4, 2], [2.5, 2, 1]]],
    mood: "Resolución cálida en Re mayor; motivo nuevo para el Nexo y el subtítulo Ashen Guardian.",
  },
  {
    name: "DN_StrangledRed", title: "The Garden Holds Its Breath", bpm: 82, beats: 4, bars: 8,
    root: 55, scale: [0, 2, 3, 5, 7, 8, 11], pad: 91, bass: 43, lead: 11, volume: 45,
    progression: [0, 4, 2, 5],
    motif: [[[0, 0, 1.3], [1.5, 3, 0.7], [2.5, 4, 0.7]], [[0, 5, 1], [2, 3, 1]], [[0, 2, 1.5], [2, 4, 0.8]], [[0, 4, 2], [3, 1, 0.6]]],
    mood: "Cuerda tenue con una nota que se estrecha y vuelve; no imita la BGM del juego base.",
  },
  {
    name: "DN_BuriedAlive", title: "Air Under the Earth", bpm: 48, beats: 4, bars: 8,
    root: 46, scale: [0, 1, 3, 5, 7, 8, 10], pad: 89, bass: 43, lead: 48, volume: 40,
    progression: [0, 0, 3, 0],
    motif: [[[0, 0, 3.2]], [[0, 1, 1.5], [2.5, 0, 0.4]], [[0, 3, 2.5]], [[1, 2, 1.8]]],
    mood: "Grave baja y sostenida; sensación de aire limitado sin efectos de susto fuerte.",
  },
  {
    name: "DN_LavenderEcho", title: "A Bell Remembers the Silence", bpm: 68, beats: 4, bars: 8,
    root: 54, scale: [0, 2, 3, 5, 7, 8, 11], pad: 89, bass: 48, lead: 9, volume: 46,
    progression: [0, 3, 5, 4],
    motif: [[[0, 0, 1], [1.5, 4, 1], [3, 2, 0.6]], [[0, 5, 1.5], [2, 4, 0.8]], [[0, 3, 1], [1.5, 2, 1], [3, 0, 0.5]], [[0, 4, 2.3]]],
    mood: "Campana de celesta y pausas amplias; composición nueva para las ondas de Lavender.",
  },
];

// EP05 abre con vacío/silencio real y sólo recupera una composición original desde Map2110.
const MAP_RANGES = [
  { from: 2040, to: 2040, track: "DN_WitnessAtrium", volume: 55 },
  { from: 2041, to: 2056, track: "DN_WhiteHand", volume: 52 },
  { from: 2057, to: 2072, track: "DN_LostSilver", volume: 48 },
  { from: 2073, to: 2087, track: "DN_SnowSilver", volume: 48 },
  { from: 2088, to: 2103, track: "DN_Hypnos_Lullaby", volume: 56 },
  { from: 2104, to: 2109, track: "", volume: 100 },
  { from: 2110, to: 2119, track: "DN_PokemonBlack", volume: 40 },
  { from: 2120, to: 2135, track: "DN_KingUnown", volume: 52 },
  { from: 2136, to: 2140, track: "DN_AshenGuardian", volume: 55 },
  { from: 2143, to: 2158, track: "DN_StrangledRed", volume: 50 },
  { from: 2159, to: 2174, track: "DN_BuriedAlive", volume: 46 },
  { from: 2175, to: 2190, track: "DN_LavenderEcho", volume: 50 },
];

const text = (value) => RString.fromText(String(value));
const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const mapFile = (id) => `Map${String(id).padStart(3, "0")}.rxdata`;
const mapRangeById = new Map();
for (const range of MAP_RANGES) for (let id = range.from; id <= range.to; id++) mapRangeById.set(id, range);

function vlq(value) {
  let remaining = Math.max(0, Math.floor(value));
  const bytes = [remaining & 0x7f];
  remaining >>>= 7;
  while (remaining > 0) {
    bytes.unshift((remaining & 0x7f) | 0x80);
    remaining >>>= 7;
  }
  return bytes;
}
function meta(type, data) {
  const payload = Buffer.from(data);
  return Buffer.concat([Buffer.from([0xff, type]), Buffer.from(vlq(payload.length)), payload]);
}
function noteNumber(track, degree, octaveOffset) {
  const scale = track.scale;
  const octave = Math.floor(degree / scale.length);
  const index = ((degree % scale.length) + scale.length) % scale.length;
  return Math.max(0, Math.min(127, track.root + scale[index] + (octave + octaveOffset) * 12));
}
function midiFor(track) {
  const events = [];
  const push = (tick, order, bytes) => events.push({ tick, order, bytes: Buffer.from(bytes) });
  const addMeta = (tick, order, kind, bytes) => push(tick, order, meta(kind, bytes));
  addMeta(0, -10, 0x03, Buffer.from(track.name, "utf8"));
  addMeta(0, -9, 0x02, Buffer.from("Original Fire Ash: Ashen Guardian composition", "utf8"));
  const micros = Math.round(60_000_000 / track.bpm);
  addMeta(0, -8, 0x51, [micros >> 16 & 0xff, micros >> 8 & 0xff, micros & 0xff]);
  addMeta(0, -7, 0x58, [track.beats, 2, 24, 8]);
  const instruments = [[0, track.pad, 64, 58], [1, track.bass, 64, 40], [2, track.lead, 76, 54]];
  for (const [channel, program, pan, volume] of instruments) {
    push(0, -6, [0xc0 | channel, program & 0x7f]);
    push(0, -5, [0xb0 | channel, 7, volume]);
    push(0, -4, [0xb0 | channel, 10, pan]);
    push(0, -3, [0xb0 | channel, 91, channel === 2 ? 34 : 48]);
  }
  const addNote = (channel, pitch, startBeat, durationBeats, velocity) => {
    const start = Math.max(0, Math.round(startBeat * PPQ));
    const end = Math.max(start + 1, Math.round((startBeat + durationBeats) * PPQ));
    push(start, 2, [0x90 | channel, pitch & 0x7f, velocity & 0x7f]);
    push(end, 0, [0x80 | channel, pitch & 0x7f, 42]);
  };
  for (let bar = 0; bar < track.bars; bar++) {
    const baseBeat = bar * track.beats;
    const chord = track.progression[bar % track.progression.length];
    // Acorde ancho de pad, una vez por compás.
    for (const degree of [chord, chord + 2, chord + 4]) {
      addNote(0, noteNumber(track, degree, 1), baseBeat, track.beats * 0.92, 23 + ((bar + degree) % 4) * 3);
    }
    // Bajo sostenido y deliberadamente bajo en la mezcla.
    addNote(1, noteNumber(track, chord, -1), baseBeat, track.beats * 0.88, 25 + (bar % 3) * 2);
    const phrase = track.motif[bar % track.motif.length];
    for (let i = 0; i < phrase.length; i++) {
      const [at, degree, length] = phrase[i];
      const pitch = noteNumber(track, degree, 2);
      addNote(2, pitch, baseBeat + at, Math.min(length, track.beats - at - 0.04), 34 + ((bar + i) % 3) * 4);
    }
  }
  events.sort((a, b) => a.tick - b.tick || a.order - b.order);
  const body = [];
  let cursor = 0;
  for (const event of events) {
    body.push(...vlq(event.tick - cursor), ...event.bytes);
    cursor = event.tick;
  }
  const endTick = track.bars * track.beats * PPQ + 1;
  body.push(...vlq(endTick - cursor), 0xff, 0x2f, 0x00);
  const data = Buffer.from(body);
  const header = Buffer.alloc(14);
  header.write("MThd", 0, 4, "ascii");
  header.writeUInt32BE(6, 4);
  header.writeUInt16BE(0, 8); // MIDI type 0: máxima compatibilidad con RPG Maker XP.
  header.writeUInt16BE(1, 10);
  header.writeUInt16BE(PPQ, 12);
  const chunk = Buffer.alloc(8);
  chunk.write("MTrk", 0, 4, "ascii");
  chunk.writeUInt32BE(data.length, 4);
  return Buffer.concat([header, chunk, data]);
}
function audioFile(name, volume, pitch = 100) {
  return new RObject("RPG::AudioFile", [
    ["@name", text(name)], ["@volume", volume], ["@pitch", pitch],
  ]);
}
function desiredFor(mapId) {
  const range = mapRangeById.get(mapId);
  if (!range) return null;
  return { track: range.track, volume: range.volume, pitch: 100 };
}
function applyMap(mapId, desired) {
  const file = path.join(DATA, mapFile(mapId));
  if (!fs.existsSync(file)) throw new Error(`falta ${mapFile(mapId)}`);
  backup(mapFile(mapId));
  const map = marshalLoad(fs.readFileSync(file));
  map.setIvar("@bgm", audioFile(desired.track, desired.volume, desired.pitch));
  map.setIvar("@autoplay_bgm", true);
  fs.writeFileSync(file, Buffer.from(marshalDump(map)));
}
function mapAudio(mapId) {
  const map = marshalLoad(fs.readFileSync(path.join(DATA, mapFile(mapId))));
  const bgm = map.getIvar("@bgm");
  return {
    autoplay: map.getIvar("@autoplay_bgm"),
    name: bgm?.getIvar("@name")?.text ?? "",
    volume: bgm?.getIvar("@volume") ?? 100,
    pitch: bgm?.getIvar("@pitch") ?? 100,
  };
}
function manifestFor() {
  return {
    generatedBy: "tools/dn_build_audio.mjs",
    originalComposition: true,
    format: "Standard MIDI File type 0 · 480 PPQ · General MIDI · no borrowed samples",
    silence: { from: 2104, to: 2109, reason: "EP05 phases 1–3 require true silence" },
    tracks: TRACKS.map((track) => {
      const file = `${track.name}.mid`;
      const bytes = fs.readFileSync(path.join(BGM_DIR, file));
      return {
        file: `Audio/BGM/${file}`, title: track.title, bpm: track.bpm,
        bars: track.bars, beatsPerBar: track.beats,
        durationSeconds: Math.round(track.bars * track.beats * 60 / track.bpm),
        mood: track.mood, bytes: bytes.length, sha256: sha256(bytes),
      };
    }),
    mapAssignments: MAP_RANGES.map((range) => ({
      from: range.from, to: range.to, track: range.track || null,
      volume: range.volume, pitch: 100,
    })),
  };
}
function build() {
  fs.mkdirSync(BGM_DIR, { recursive: true });
  for (const track of TRACKS) fs.writeFileSync(path.join(BGM_DIR, `${track.name}.mid`), midiFor(track));
  for (const range of MAP_RANGES) {
    for (let mapId = range.from; mapId <= range.to; mapId++) applyMap(mapId, {
      track: range.track, volume: range.volume, pitch: 100,
    });
  }
  fs.writeFileSync(MANIFEST, `${JSON.stringify(manifestFor(), null, 2)}\n`);
  console.log(`audio DN: ${TRACKS.length} composiciones MIDI originales · silencio explícito Map2104–2109 · BGM asignadas en ${MAP_RANGES.reduce((n, range) => n + range.to - range.from + 1, 0)} mapas`);
}
function verify() {
  const failures = [];
  const check = (condition, message) => { if (!condition) failures.push(message); };
  for (const track of TRACKS) {
    const file = path.join(BGM_DIR, `${track.name}.mid`);
    if (!fs.existsSync(file)) { failures.push(`falta Audio/BGM/${track.name}.mid`); continue; }
    const bytes = fs.readFileSync(file);
    check(bytes.subarray(0, 4).toString("ascii") === "MThd", `${track.name}: cabecera MIDI inválida`);
    check(bytes.readUInt16BE(8) === 0 && bytes.readUInt16BE(10) === 1 && bytes.readUInt16BE(12) === PPQ,
      `${track.name}: debe ser MIDI tipo 0 de una pista a 480 PPQ`);
    check(bytes.includes(Buffer.from(track.name, "utf8")), `${track.name}: falta metadato de título`);
    check(bytes.subarray(bytes.length - 3).equals(Buffer.from([0xff, 0x2f, 0x00])), `${track.name}: falta fin de pista MIDI`);
  }
  for (const range of MAP_RANGES) for (let mapId = range.from; mapId <= range.to; mapId++) {
    const file = path.join(DATA, mapFile(mapId));
    if (!fs.existsSync(file)) { failures.push(`falta ${mapFile(mapId)}`); continue; }
    const actual = mapAudio(mapId);
    check(actual.autoplay === true && actual.name === range.track && actual.volume === range.volume && actual.pitch === 100,
      `Map${mapId}: BGM/autoplay no coincide con ${range.track || "silencio"}`);
  }
  if (!fs.existsSync(MANIFEST)) failures.push("falta content/dimensional_nightmare_audio.json");
  else {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
    check(manifest.tracks?.length === TRACKS.length, "manifiesto de audio incompleto");
    for (const item of manifest.tracks ?? []) {
      const bytes = fs.readFileSync(path.join(BGM_DIR, path.basename(item.file)));
      check(bytes.length === item.bytes && sha256(bytes) === item.sha256, `${item.file}: hash distinto del manifiesto`);
    }
  }
  if (failures.length) {
    for (const failure of failures) console.error(`FALLA: ${failure}`);
    process.exit(1);
  }
  console.log(`audio DN verificado: ${TRACKS.length} MIDI originales y ${MAP_RANGES.reduce((n, range) => n + range.to - range.from + 1, 0)} mapas con BGM explícita`);
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (VERIFY) verify();
  else { build(); verify(); }
}

export { TRACKS, MAP_RANGES, midiFor, manifestFor };
