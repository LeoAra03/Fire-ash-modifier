#!/usr/bin/env node
/** Renderiza el plano .pkregion como PNG de referencia no jugable. */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inputAt = process.argv.indexOf("--input");
const outputAt = process.argv.indexOf("--output");
const input = path.resolve(inputAt >= 0 ? process.argv[inputAt + 1] : path.join(ROOT, "content", "atlas_mil_region.pkregion"));
const output = path.resolve(outputAt >= 0 ? process.argv[outputAt + 1] : path.join(ROOT, "docs", "referencia_region_atlas_mil.png"));
const region = JSON.parse(fs.readFileSync(input, "utf8"));
const map = region.mapData;
const cell = 12;
const mapX = 34;
const mapY = 108;
const mapWidth = map.width * cell;
const mapHeight = map.height * cell;
const canvasWidth = 1400;
const canvasHeight = 900;
const colors = ["#9bcf63", "#77b74f", "#4d8c45", "#356044", "#80634b"];
const landmarkColors = { city: "#e05b45", town: "#eaa95d", route: "#f0d06f", cave: "#78658f", special: "#5e82c8" };
const quote = (text) => String(text).replaceAll("\\", "\\\\").replaceAll("'", "\\'");
const draw = [
  "stroke none",
  "font 'DejaVu-Sans'",
  "font-weight 700 fill '#f1ead7' font-size 28 text 34,45 'Atlas Mil · plano regional de autoría'",
  "font-weight 400 fill '#aeb9c5' font-size 15 text 34,76 'Referencia exportada desde el contrato .pkregion · 40 sectores · no es un mapa RMXP jugable'",
  `fill '#202a34' stroke '#6d7d8b' stroke-width 2 roundrectangle ${mapX - 5},${mapY - 5} ${mapX + mapWidth + 5},${mapY + mapHeight + 5} 5,5`,
  "stroke none",
];
const cellColor = (value) => value.water ? "#3398ba" : colors[Math.max(0, value.terrain)] ?? "#26313a";
for (let y = 0; y < map.height; y++) {
  let runStart = 0;
  let runColor = cellColor(map.cells[y][0]);
  for (let x = 1; x <= map.width; x++) {
    const nextColor = x < map.width ? cellColor(map.cells[y][x]) : null;
    if (nextColor !== runColor) {
      const x1 = mapX + runStart * cell;
      const y1 = mapY + y * cell;
      draw.push(`fill '${runColor}' rectangle ${x1},${y1} ${mapX + x * cell},${y1 + cell}`);
      runStart = x;
      runColor = nextColor;
    }
  }
  for (let x = 0; x < map.width; x++) if (map.cells[y][x].path) {
    const x1 = mapX + x * cell;
    const y1 = mapY + y * cell;
    draw.push(`fill '#e7bd6c' rectangle ${x1 + 3},${y1 + 3} ${x1 + cell - 3},${y1 + cell - 3}`);
  }
}
for (const landmark of map.landmarks) {
  const number = Number(landmark.id.slice(-2));
  const x = mapX + landmark.x * cell;
  const y = mapY + landmark.y * cell;
  const width = landmark.width * cell;
  const height = landmark.height * cell;
  draw.push(`fill '${landmarkColors[landmark.type]}' stroke '#fff4d6' stroke-width 1.5 roundrectangle ${x},${y} ${x + width},${y + height} 4,4`);
  draw.push(`stroke none fill '#10161e' font-weight 700 font-size 10 text ${x + 5},${y + height / 2 + 4} '${String(number).padStart(2, "0")}'`);
}
const panelX = mapX + mapWidth + 28;
draw.push(`fill '#18212b' stroke '#455463' stroke-width 1 roundrectangle ${panelX},${mapY - 5} ${panelX + 350},${mapY + mapHeight + 5} 6,6`);
draw.push(`stroke none fill '#f1ead7' font-weight 700 font-size 18 text ${panelX + 18},${mapY + 28} 'Sectores'`);
for (const [index, landmark] of map.landmarks.entries()) {
  const column = Math.floor(index / 20);
  const row = index % 20;
  const x = panelX + 18 + column * 170;
  const y = mapY + 58 + row * 28;
  const number = Number(landmark.id.slice(-2));
  const approved = landmark.pokemon.length > 0;
  draw.push(`fill '${approved ? "#69b578" : "#65707d"}' roundrectangle ${x},${y - 11} ${x + 15},${y + 4} 3,3`);
  draw.push(`fill '#dce4e9' font-weight 400 font-size 9 text ${x + 21},${y + 1} '${String(number).padStart(2, "0")} ${quote(landmark.name.slice(0, 20))}'`);
}
const legendY = mapY + 642;
draw.push(`fill '#f1ead7' font-weight 700 font-size 14 text ${panelX + 18},${legendY} 'Estado de contenido'`);
draw.push(`fill '#69b578' roundrectangle ${panelX + 18},${legendY + 15} ${panelX + 32},${legendY + 29} 3,3`);
draw.push(`fill '#c8d2da' font-weight 400 font-size 11 text ${panelX + 40},${legendY + 27} '30 episodios aprobados'`);
draw.push(`fill '#65707d' roundrectangle ${panelX + 18},${legendY + 39} ${panelX + 32},${legendY + 53} 3,3`);
draw.push(`fill '#c8d2da' font-size 11 text ${panelX + 40},${legendY + 51} '10 anclas planificadas'`);
draw.push("fill '#e2ba6d' font-size 13 text 34,862 'Uso: crítica de geografía, rutas, landmarks, encuentros y Pokédex. La salida final sigue el pipeline Essentials/RMXP con backup.'");
fs.mkdirSync(path.dirname(output), { recursive: true });
const result = spawnSync("/usr/bin/convert", ["-size", `${canvasWidth}x${canvasHeight}`, "xc:#10161e", "-draw", draw.join("\n"), output], { encoding: "utf8" });
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(result.stderr || `ImageMagick terminó con código ${result.status}`);
console.log(`Referencia regional: ${path.relative(ROOT, output)} (${canvasWidth}x${canvasHeight}).`);
