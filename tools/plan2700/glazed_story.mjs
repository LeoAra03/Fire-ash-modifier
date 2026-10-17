#!/usr/bin/env node
/**
 * Instala las tres apariciones originales de Percy en Glazed.
 * Sólo usa mapas de la campaña y un charset existente de Fire Ash.
 */
import fs from "node:fs";
import path from "node:path";
import { event, eventsOf, freeCells, graphic, page, pagesOf, texts, txt, upsert, endEvent } from "../lib/dlc_helpers.mjs";

const APPLY = process.argv.includes("--apply");
const MAPS = [
  { map: 3000, name: "PokeMod Glazed: Percy — llegada", lines: [
    "Percy: No conozco estas rutas, pero sí conozco la sensación de que dos futuros compitan por el mismo lugar.",
    "Ash: Entonces no correremos para ser los primeros. Primero entenderemos qué está pasando en Tunod.",
  ] },
  { map: 3031, name: "PokeMod Glazed: Percy — elección", lines: [
    "Percy: Podrías tomar el camino rápido y dejar que otros carguen con la fractura. Yo casi lo hice.",
    "Ash: Ganar no sirve si el mundo que queda detrás ya no puede volver a casa.",
    "Percy: De acuerdo. La próxima vez que nos encontremos, competiré contigo sin olvidar a quién afecta la carrera.",
  ] },
  { map: 3109, name: "PokeMod Glazed: Percy — cumbre", lines: [
    "Percy: He llegado hasta la nieve sin convertirme en la sombra de otro entrenador. Tú también puedes elegir qué conservar.",
    "Ash: La Ruta de Dios me enseñó que una puerta no borra el camino anterior. Vamos a cerrar esta herida sin borrar a Tunod.",
    "Percy: Entonces nos veremos en la Liga, como rivales y como testigos de que el futuro puede tener más de una línea.",
  ] },
];
const backup = "plan2700_glazed_story";
const getCell = (mapId) => freeCells(mapId)[0] ?? [2, 2];
const hasText = (mapId, name, needle) => eventsOf(mapId).filter((entry) => entry.name === name).some((entry) => pagesOf(entry).flatMap((page) => page.list).some((command) => command.code === 401 && txt(command.params?.[0]).includes(needle)));

function installOne(row) {
  const [x, y] = getCell(row.map);
  upsert(row.map, [row.name, "PokeMod Glazed: Rival Percy"], () => [
    event(0, row.name, x, y, [page({
      trigger: 0,
      gfx: graphic("trchar009", 2, 1, {}),
      list: [...texts(row.lines), endEvent()],
    })]),
  ], backup);
}

function verify() {
  const errors = [];
  for (const row of MAPS) {
    const matches = eventsOf(row.map).filter((entry) => entry.name === row.name);
    if (matches.length !== 1) errors.push(`Map${row.map}: ${row.name} aparece ${matches.length} veces`);
    if (!hasText(row.map, row.name, "Percy:")) errors.push(`Map${row.map}: falta diálogo de Percy`);
  }
  const total = MAPS.reduce((n, row) => n + eventsOf(row.map).filter((entry) => entry.name.startsWith("PokeMod Glazed: Percy —")).length, 0);
  if (total !== 3) errors.push(`Glazed necesita 3 apariciones de Percy y tiene ${total}`);
  if (errors.length) {
    console.error(errors.map((error) => `FALLO: ${error}`).join("\n"));
    process.exit(1);
  }
  console.log("OK: Percy tiene tres apariciones distintas (llegada, elección y cumbre) con desenlace no humillante.");
}

if (APPLY) {
  for (const row of MAPS) installOne(row);
  console.log(`Glazed: tres apariciones de Percy instaladas; backup en pokemon_fire_ash/PokeModBackups/${backup}.`);
}
verify();
