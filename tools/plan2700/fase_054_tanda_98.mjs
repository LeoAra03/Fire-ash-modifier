#!/usr/bin/env node
// Contrasta rangos de celdas de tareas.txt con dimensiones reales de mapas RXDATA.
import fs from "node:fs";
import { marshalLoad } from "../../web/js/marshal.js";
import { parseMap } from "../../web/js/rmxp.js";
const lines=fs.readFileSync(new URL("../../tareas.txt",import.meta.url),"utf8").split(/\r?\n/).slice(9699,9799);
if(lines.length!==100) throw new Error("Se esperaban 100 líneas");
const ids=lines.map(x=>Number(x.split(".",1)[0]));
if(ids.some((id,i)=>id!==ids[0]+i)) throw new Error("IDs de tarea no consecutivos");
const n=s=>Number(s.replaceAll(".",""));
const cache=new Map();
function dimensions(id){if(!cache.has(id)){const file=new URL(`../../pokemon_fire_ash/Data/Map${String(id).padStart(3,"0")}.rxdata`,import.meta.url);if(!fs.existsSync(file))throw new Error(`Falta mapa ${id}`);const m=parseMap(marshalLoad(fs.readFileSync(file)));cache.set(id,{width:m.width,height:m.height,cells:m.width*m.height});}return cache.get(id);}
let ranges=0,transitions=0;
for(const line of lines){
 let m=/celdas ([\d.]+)[–-]([\d.]+) de las ([\d.]+) del mapa (\d+)/.exec(line);
 if(m){const [,as,bs,ts,is]=m;const [a,b,total,id]=[as,bs,ts,is].map(n);const d=dimensions(id);if(d.cells!==total)throw new Error(`Map${id}: tarea declara ${total} celdas pero RXDATA mide ${d.width}×${d.height}=${d.cells}`);if(a<1||b<a||b>total)throw new Error(`Map${id}: rango ${a}–${b} excede ${total}`);ranges++;continue;}
 m=/desde la celda ([\d.]+) del mapa (\d+).*?hasta la celda ([\d.]+) del mapa (\d+)/.exec(line);
 if(!m)throw new Error(`Formato no reconocido: ${line}`);
 const [,as,sid,bs,did]=m;for(const [cell,id] of [[n(as),n(sid)],[n(bs),n(did)]]){const d=dimensions(id);if(cell<1||cell>d.cells)throw new Error(`Map${id}: celda ${cell} fuera de ${d.cells}`);}transitions++;
}
console.log(JSON.stringify({lines:"9700–9799",tasks:lines.length,taskIds:[ids[0],ids.at(-1)],mapRanges:ranges,transitions,mapsLoaded:cache.size,validation:"RXDATA dimensions and cell-index bounds passed"},null,2));
