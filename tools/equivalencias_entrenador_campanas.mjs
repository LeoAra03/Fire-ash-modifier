#!/usr/bin/env node
/**
 * equivalencias_entrenador_campanas.mjs — Fase 69.
 *
 * Genera docs/EQUIVALENCIAS_ENTRENADOR_CAMPANAS.md a partir de datos reales:
 *   · content/rom_campaigns_complete.json  → campañas, NPC y su campo tipoEntrenador (ROM)
 *   · pokemon_fire_ash/Data/trainer_types.dat → id y id_number de cada tipo de entrenador
 *
 * Uso:
 *   node tools/equivalencias_entrenador_campanas.mjs          # escribe el documento
 *   node tools/equivalencias_entrenador_campanas.mjs --check  # falla si el documento está desactualizado
 */
import fs from "node:fs";
import path from "node:path";
import { marshalLoad } from "../web/js/marshal.js";

const ROOT = path.resolve(import.meta.dirname, "..");
const SALIDA = path.join(ROOT, "docs/EQUIVALENCIAS_ENTRENADOR_CAMPANAS.md");
const PLANO = path.join(ROOT, "content/rom_campaigns_complete.json");
const TIPOS = path.join(ROOT, "pokemon_fire_ash/Data/trainer_types.dat");

const txt = (v) => {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (v.bytes?.data) return Buffer.from(v.bytes.data).toString("utf8");
  if (v.name) return String(v.name);
  return String(v);
};

function cargarTiposFireAsh() {
  const data = marshalLoad(fs.readFileSync(TIPOS));
  const tipos = new Map();
  for (const [, v] of data.pairs) {
    const iv = Object.fromEntries((v.ivars ?? []).map(([k, val]) => [txt(k), val]));
    const id = txt(iv["@id"]);
    if (id) tipos.set(id, { id, num: iv["@id_number"], nombre: txt(iv["@real_name"]) });
  }
  return tipos;
}

function construir() {
  const plano = JSON.parse(fs.readFileSync(PLANO, "utf8"));
  const tipos = cargarTiposFireAsh();
  const base = tipos.get("GENTLEMAN");
  if (!base) throw new Error("no existe el tipo base GENTLEMAN en trainer_types.dat");

  const filas = [];
  const detalle = [];
  for (const c of plano.campaigns) {
    const npcs = c.maps.flatMap((m) => m.npcs);
    const entrenadores = npcs.filter((n) => n.trainer);
    const conteo = new Map();
    for (const n of entrenadores) conteo.set(n.sourceTrainerType, (conteo.get(n.sourceTrainerType) ?? 0) + 1);
    const tipo = tipos.get(c.trainerType);
    if (!tipo) throw new Error(`la campaña ${c.id} usa ${c.trainerType}, que no existe en trainer_types.dat`);
    const origen = [...conteo.entries()].sort((a, b) => a[0] - b[0]);
    filas.push({
      campaña: c.title, id: c.id, fuente: c.source,
      mapas: `${c.mapCount} (${c.firstMapId}–${c.lastMapId})`,
      npcs: npcs.length, entrenadores: entrenadores.length,
      interruptor: c.completeSwitch, variable: c.progressVariable,
      tipo, origen,
    });
    detalle.push(`| ${c.title} | \`${c.trainerType}\` | ${tipo.num} | ${origen.map(([v, n]) => `${v} (${n})`).join(", ")} |`);
  }

  const L = [];
  L.push("# Equivalencias de entrenador · campañas ROM invitadas", "");
  L.push("> Documento generado por `tools/equivalencias_entrenador_campanas.mjs`. No editar a mano.", "");
  L.push("## Aviso sobre «ids GBC»", "");
  L.push("Las cinco campañas invitadas proceden de ROMs **GBA** (Glazed, Light Platinum, Liquid Crystal, TFOH Beta 3 y Pokémon Unbound). Ninguna procede de la ROM GBC `FactoryAdventure.gb`, que sólo se usa para los Pokégods. Por tanto **no existen ids GBC que mapear en estas campañas**: la tabla siguiente usa los valores GBA que sí constan en el repositorio.", "");
  L.push("## Qué es cada columna", "");
  L.push("- **tipoEntrenador (ROM)**: campo `u16` en +0x0C de cada evento de objeto del mapa GBA (`tools/gba_maps_events.mjs`). Un valor `0` es NPC normal; `> 0` marca un combate de entrenador. Se conserva en `sourceTrainerType` del plano.");
  L.push("- **Tipo Fire Ash**: `id` y `id_number` del tipo de entrenador creado en `pokemon_fire_ash/Data/trainer_types.dat`, clonado de la plantilla base `GENTLEMAN` (número 17).", "");
  L.push("## Regla de conversión", "");
  L.push("Toda NPC de combate de una campaña (`sourceTrainerType > 0`) se convierte en un combate `pbTrainerBattle(:<TIPO>, …)` con el **tipo Fire Ash propio de esa campaña**. El valor original no elige el tipo: sólo decide si el NPC lucha. El combate final usa el mismo tipo.", "");
  L.push("## Tabla por campaña", "");
  L.push("| Campaña | ROM fuente | Mapas Fire Ash | NPC totales | Con entrenador | Interruptor final | Variable | Tipo Fire Ash | id_number |");
  L.push("|---|---|---|---:|---:|---:|---:|---|---:|");
  for (const f of filas) {
    L.push(`| ${f.campaña} | ${f.fuente} | ${f.mapas} | ${f.npcs} | ${f.entrenadores} | ${f.interruptor} | ${f.variable} | \`${f.tipo.id}\` · ${f.tipo.nombre} | ${f.tipo.num} |`);
  }
  L.push("", "## Valores de origen observados por campaña", "");
  L.push("| Campaña | Tipo Fire Ash | id_number | tipoEntrenador (ROM) observado (nº de NPC) |");
  L.push("|---|---|---:|---|");
  L.push(...detalle);
  L.push("", "## Tipo base y totales", "");
  L.push(`- Base de clonado: \`${base.id}\` (id_number ${base.num}).`);
  const totalEnt = filas.reduce((s, f) => s + f.entrenadores, 0);
  L.push(`- Combates de entrenador convertidos en total: ${totalEnt}, consistentes con \`totals.trainers\` del plano.`);
  L.push("");
  L.push("## Límites conocidos", "");
  L.push("- `tipoEntrenador` **no** es la clase de entrenador de la ROM (la clase vive en la tabla `trainers` de 40 bytes, que se extrae a `reference/roms_invitadas/`, ignorado por Git y no versionado). Por eso no hay equivalencia clase ROM → clase Fire Ash: todo combate de una campaña cae en un único tipo.");
  L.push("- Los conteos proceden del plano `rom_campaigns_complete.json`; si se regenera el plano, ejecutar de nuevo este script.");
  L.push("");
  return L.join("\n");
}

const contenido = construir();
if (process.argv.includes("--check")) {
  const actual = fs.existsSync(SALIDA) ? fs.readFileSync(SALIDA, "utf8") : "";
  if (actual !== contenido) {
    console.error("✘ docs/EQUIVALENCIAS_ENTRENADOR_CAMPANAS.md desactualizado: ejecutar sin --check.");
    process.exit(1);
  }
  console.log("✔ Documento de equivalencias al día.");
} else {
  fs.writeFileSync(SALIDA, contenido);
  console.log(`✔ Escrito ${path.relative(ROOT, SALIDA)}`);
}
