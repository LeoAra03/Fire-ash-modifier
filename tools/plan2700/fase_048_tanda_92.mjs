#!/usr/bin/env node
// Validador de estructura del tramo de tareas.txt; no ejecuta el runtime del juego.
import fs from "node:fs";
const rows=fs.readFileSync(new URL("../../tareas.txt",import.meta.url),"utf8").split(/\r?\n/).slice(9099,9199);
if(rows.length!==100) throw new Error("Se esperaban 100 líneas");
const ids=rows.map(x=>Number(x.split(".",1)[0]));
if(ids.some((id,i)=>id!==ids[0]+i)) throw new Error("IDs no consecutivos");
const num=s=>Number(s.replaceAll(".",""));
const combos=rows.map(x=>{const m=/Probar las combinaciones ([\d.]+)[–-]([\d.]+) de ([\d.]+)/.exec(x);return m&&m.slice(1).map(num)}).filter(Boolean);
for(let i=0;i<combos.length;i++){const r=combos[i];if(r[2]!==262144||r[0]>r[1]||(i&&combos[i-1][1]+1!==r[0]))throw new Error("Rango de combinaciones inválido/discontinuo");}
let grid=0,transitions=0;
for(const x of rows.filter(x=>x.includes("Verificar transitabilidad, altura y autotile"))){grid++;const m=/celdas ([\d.]+)[–-]([\d.]+) de las ([\d.]+) del mapa (\d+)/.exec(x);if(m){const [,a,b,total]=m.map((v,i)=>i?num(v):v);if(a<1||a>b||b>total)throw new Error("Rango de celdas fuera de límites: "+x);}else if(x.includes("desde la celda"))transitions++;else throw new Error("Formato de celda no reconocido: "+x);}
console.log(JSON.stringify({lines:"9100–9199",tasks:rows.length,taskIds:[ids[0],ids.at(-1)],combinationWindows:combos.length,combinationSpan:combos.length?[combos[0][0],combos.at(-1)[1]]:null,gridTasks:grid,transitions,runtime:"pending"},null,2));
