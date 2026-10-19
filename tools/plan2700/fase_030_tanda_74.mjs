#!/usr/bin/env node
// Auditoría reproducible de inventario para tareas.txt, líneas 7300–7399.
import fs from "node:fs";
const rows = fs.readFileSync(new URL("../../tareas.txt", import.meta.url), "utf8").split(/\r?\n/).slice(7299, 7399);
if (rows.length !== 100 || rows.some((row) => !/^\d+\. /.test(row))) throw new Error("Rango de tareas incompleto o mal formado");
console.log(JSON.stringify({ lines: "7300–7399", taskIds: [rows[0].split(".")[0], rows.at(-1).split(".")[0]], tasks: rows.length, runtime: "pending" }, null, 2));
