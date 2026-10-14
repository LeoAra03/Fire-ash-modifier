#!/usr/bin/env node
/** Genera el índice local de herramientas y ROMs sin versionar binarios. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { ROOT } from "./lib/dlc_helpers.mjs";

const TOOLKIT = path.join(ROOT, "toolkit");
const ROMS = path.join(ROOT, "reference", "roms_invitadas", "entrada");
const OUTPUT = path.join(TOOLKIT, "INDICE_HERRAMIENTAS.json");
const exists = (relative) => fs.existsSync(path.join(ROOT, relative));
const files = (dir, predicate = () => true) => {
  if (!fs.existsSync(dir)) return [];
  const result = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (predicate(full)) result.push(full);
    }
  };
  walk(dir);
  return result;
};
const state = (relative) => exists(relative) ? "extraído" : "pendiente";
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

const roms = files(ROMS, (file) => /\.(?:gba|gb|gbc)$/i.test(file)).map((file) => ({
  archivo: path.basename(file),
  bytes: fs.statSync(file).size,
  sha256: sha256(file),
})).sort((a, b) => a.archivo.localeCompare(b.archivo));
const agentDefinitions = files(path.join(TOOLKIT, "agentes", "timps_swarm"),
  (file) => /[/\\]\.claude[/\\]agents[/\\].+\.md$/i.test(file));

const index = {
  toolkit_version: "FireAsh_Absorption_v2.0",
  generated_at: new Date().toISOString(),
  extraccion_completada: [
    "toolkit/editores/tiled", "toolkit/editores/porymap", "toolkit/editores/porygion",
    "toolkit/descompilaciones/crystal", "toolkit/descompilaciones/red",
    "toolkit/agentes/timps_swarm", "toolkit/agentes/coordenadores",
    "toolkit/extractores/scripts", "toolkit/extractores/audio", "toolkit/scripts",
  ].every(exists) && roms.length === 5,
  herramientas: {
    editores_mapas: {
      tiled: { estado: state("toolkit/editores/tiled/Tiled-1.12.2_Linux_x86_64.AppImage"), ruta: "toolkit/editores/tiled/", capacidad: "Editar mapas TMX" },
      porymap: { estado: state("toolkit/editores/porymap"), ruta: "toolkit/editores/porymap/", capacidad: "Editar mapas de decompilaciones GBA" },
      porygion: { estado: state("toolkit/editores/porygion"), ruta: "toolkit/editores/porygion/", capacidad: "Renderizar mapas de proyectos pret" },
    },
    descompilaciones: {
      pokecrystal: { estado: state("toolkit/descompilaciones/crystal"), ruta: "toolkit/descompilaciones/crystal/" },
      pokered: { estado: state("toolkit/descompilaciones/red"), ruta: "toolkit/descompilaciones/red/" },
    },
    agentes: {
      timps_swarm: { estado: state("toolkit/agentes/timps_swarm"), definiciones_detectadas: agentDefinitions.length, ruta: "toolkit/agentes/timps_swarm/" },
      coordinadores: { estado: state("toolkit/agentes/coordenadores"), ruta: "toolkit/agentes/coordenadores/" },
    },
    extractores: {
      rvpacker: { estado: state("toolkit/extractores/scripts"), ruta: "toolkit/extractores/scripts/" },
      swablu: { estado: state("toolkit/extractores/audio"), ruta: "toolkit/extractores/audio/" },
    },
  },
  roms_detectadas: roms,
  politica: "Los ROMs, assets extraídos y herramientas desempaquetadas son locales, están ignorados por Git y no entran en paquetes distribuibles.",
};

fs.mkdirSync(TOOLKIT, { recursive: true });
fs.writeFileSync(OUTPUT, `${JSON.stringify(index, null, 2)}\n`);
console.log(`✔ Índice: ${path.relative(ROOT, OUTPUT)}`);
console.log(`  · ROMs: ${roms.length}`);
console.log(`  · definiciones TIMPS: ${agentDefinitions.length}`);
console.log(`  · extracción completa: ${index.extraccion_completada ? "sí" : "no"}`);
if (!index.extraccion_completada) process.exitCode = 1;
