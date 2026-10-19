#!/usr/bin/env node
// Contrasta rangos de celdas de tareas.txt con dimensiones reales de mapas RXDATA.
import fs from "node:fs";
import { marshalLoad } from "../../web/js/marshal.js";
import { parseMap } from "../../web/js/rmxp.js";
const lines=fs.readFileSync(new URL("../../tareas.txt",import.meta.url),"utf8").split(/\r?\n/).slice(10299,10399);
if(lines.length!==100)throw new Error("Se esperaban 100 líneas");
const ids=lines.map(x=>Number(x.split(".",1)[0]));if(ids.some((id,i)=>id!==ids[0]+i))throw new Error("IDs no consecutivos");
const n=s=>Number(s.replaceAll(".","")),cache=new Map();
function dims(id){if(!cache.has(id)){const f=new URL(`../../pokemon_fire_ash/Data/Map${String(id).padStart(3,"0")}.rxdata`,import.meta.url);if(!fs.existsSync(f))throw new Error(`Falta mapa ${id}`);const m=parseMap(marshalLoad(fs.readFileSync(f)));cache.set(id,{w:m.width,h:m.height,cells:m.width*m.height});}return cache.get(id);}
let mapRanges=0,transitions=0;
for(const line of lines){let m=/celdas ([\d.]+)[–-]([\d.]+) de las ([\d.]+) del mapa (\d+)/.exec(line);if(m){const [,a0,b0,t0,i0]=m,[a,b,total,id]=[a0,b0,t0,i0].map(n),d=dims(id);if(total!==d.cells)throw new Error(`Map${id} declara ${total}, RXDATA ${d.w}×${d.h}=${d.cells}`);if(a<1||b<a||b>total)throw new Error(`Map${id}: rango ${a}–${b} fuera de límites`);mapRanges++;continue;}m=/desde la celda ([\d.]+) del mapa (\d+).*?hasta la celda ([\d.]+) del mapa (\d+)/.exec(line);if(!m)throw new Error(`Formato no reconocido: ${line}`);const [,a0,s0,b0,d0]=m;for(const [cell,id]of[[n(a0),n(s0)],[n(b0),n(d0)]]){const d=dims(id);if(cell<1||cell>d.cells)throw new Error(`Map${id}: celda ${cell} fuera de ${d.cells}`);}transitions++;}
console.log(JSON.stringify({lines:"10300–10399",tasks:lines.length,taskIds:[ids[0],ids.at(-1)],mapRanges,transitions,mapsLoaded:cache.size,validation:"RXDATA dimensions and cell-index bounds passed"},null,2));
