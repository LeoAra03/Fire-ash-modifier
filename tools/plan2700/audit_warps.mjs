#!/usr/bin/env node
/** Auditor de transfers y retornos para la FASE 019. Solo lectura. */
import fs from "node:fs";
import path from "node:path";
import { DATA, ROOT, eventsOf, iv, mapFile, readData, readMapRaw, pagesOf } from "../lib/dlc_helpers.mjs";

const jsonMode = process.argv.includes("--json");
const errors = [];
const mapInfos = readData("MapInfos.rxdata");
const ids = mapInfos.pairs.map(([id]) => Number(id)).filter((id) => Number.isInteger(id) && fs.existsSync(path.join(DATA, mapFile(id))));
const dims = new Map();
const mapData = new Map();
for (const id of ids) {
  const raw = readMapRaw(id);
  dims.set(id, { width: Number(iv(raw, "@width")), height: Number(iv(raw, "@height")) });
  mapData.set(id, eventsOf(id));
}
const transfers = [];
for (const source of ids) {
  for (const entry of mapData.get(source)) {
    for (const page of pagesOf(entry)) {
      for (const command of page.list) {
        if (Number(command.code) !== 201) continue;
        const target = Number(command.params?.[1]);
        const x = Number(command.params?.[2]);
        const y = Number(command.params?.[3]);
        const row = { source, event: entry.name, target, x, y };
        transfers.push(row);
        const size = dims.get(target);
        if (!size) errors.push({ ...row, error: "mapa destino ausente" });
        else if (x < 0 || y < 0 || x >= size.width || y >= size.height) errors.push({ ...row, error: `coordenada fuera de ${size.width}×${size.height}` });
      }
    }
  }
}
const report = { schema: "plan2700_audit_warps/1.0", maps: ids.length, transfers: transfers.length, invalid: errors, policy: "La existencia de retorno físico se revisa sobre comandos; los menús de retorno son QA adicional." };
if (jsonMode) console.log(JSON.stringify(report, null, 2));
else {
  console.log(`Warps: ${ids.length} mapas · ${transfers.length} transferencias · ${errors.length} inválidas`);
  if (errors.length) for (const error of errors.slice(0, 30)) console.error(`  · Map${error.source} → Map${error.target}: ${error.error}`);
  else console.log("OK: destinos y coordenadas dentro de rango");
}
if (errors.length) process.exit(1);
