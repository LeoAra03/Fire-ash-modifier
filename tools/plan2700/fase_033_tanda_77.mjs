#!/usr/bin/env node
// Comprueba integridad y continuidad del lote de estados de tareas.txt.
import fs from "node:fs";
const rows = fs.readFileSync(new URL("../../tareas.txt", import.meta.url), "utf8").split(/\r?\n/).slice(7599, 7699);
const parse = (s) => { const m = /Probar las combinaciones ([\d.]+)[–-]([\d.]+) de ([\d.]+)/.exec(s); return m && m.slice(1).map(x => Number(x.replaceAll(".", ""))); };
const ranges = rows.map(parse);
if (rows.length !== 100 || ranges.some(r => !r || r[2] !== 262144 || r[0] > r[1])) throw new Error("Tanda incompleta o rango inválido");
for (let i=1; i<ranges.length; i++) if (ranges[i-1][1]+1 !== ranges[i][0]) throw new Error(`Discontinuidad en la línea 7600+${i}`);
console.log(JSON.stringify({ lines: "7600–7699", taskIds: [rows[0].split(".")[0], rows.at(-1).split(".")[0]], tasks: rows.length, combinations: [ranges[0][0], ranges.at(-1)[1]], universe: 262144, runtime: "pending" }, null, 2));
