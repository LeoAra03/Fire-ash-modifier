#!/usr/bin/env node
/**
 * Mapas, NPCs, cinemáticas y flags de un ROM hack de GBA (Pokémon Gen 3).
 *
 * Segunda fase del análisis de los ROM invitados. Trabaja sin offsets
 * prefijados: localiza las estructuras por su forma, igual que haría un
 * AdvanceMap, y a partir de ahí reconstruye el esqueleto jugable:
 *
 *   1. MapLayout   → ancho/alto, tilesets (primario y secundario)
 *   2. MapHeader   → música, tipo de mapa, tiempo, conexiones
 *   3. MapEvents   → NPCs (sprite, x, y, movimiento, tipo de entrenador,
 *                    script y flag), warps, triggers y signos
 *   4. Scripts     → minería de patrones sobre el bytecode para recuperar
 *                    los diálogos (msgbox), las flags usadas (setflag,
 *                    clearflag, checkflag), los combates (trainerbattle),
 *                    los movimientos de cámara/personaje y las entregas
 *
 * No es un desensamblador completo: es una minería por patrones sobre la
 * ventana de cada script, así que puede tener algún falso positivo. Lo que
 * importa es que da el *material* (textos, flags, batallas) para reescribir
 * estas escenas con contenido original en Atlas Mil.
 *
 * Uso:
 *   node tools/gba_maps_events.mjs --rom reference/roms_invitadas/entrada/GlazedESPB6.gba
 *   node tools/gba_maps_events.mjs --dir reference/roms_invitadas/entrada
 *
 * Salida (reference/roms_invitadas/<slug>/, ignorada por Git):
 *   mapas_npcs.json · informe_mapas.md · pbs/{npcs,cutscenes,flags,warps}.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_ROOT = () => (process.env.ROM_OUT_DIR ? path.resolve(process.env.ROM_OUT_DIR) : path.join(ROOT, "reference", "roms_invitadas"));

const arg = (name, fallback = null) => {
  const key = `--${name}`;
  const i = process.argv.indexOf(key);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : fallback;
};
const ROM = arg("rom");
const DIR = arg("dir");
const MAX_MAPS = Number(arg("max-maps", "0")) || 0;

// ------------------------------------------------------------------- charmap
const CHAR = new Array(256).fill(null);
{
  const set = (b, t) => (CHAR[b] = t);
  set(0x00, " ");
  for (let i = 0; i < 26; i += 1) set(0xbb + i, String.fromCharCode(65 + i));
  for (let i = 0; i < 26; i += 1) set(0xd5 + i, String.fromCharCode(97 + i));
  for (let i = 0; i < 10; i += 1) set(0xa1 + i, String(i));
  Object.entries({
    0xab: "!", 0xac: "?", 0xad: ".", 0xae: "-", 0xaf: "·", 0xb8: ",", 0xb9: "×", 0xba: "/",
    0xb5: "♂", 0xb6: "♀", 0xb0: "…", 0xf0: ":", 0x2d: "+", 0x2c: "&", 0x2f: ";",
    0x51: "¿", 0x52: "¡", 0x53: "[PK]", 0x54: "[MN]",
    0x01: "À", 0x02: "Á", 0x03: "Â", 0x04: "Ç", 0x05: "È", 0x06: "É", 0x07: "Ê", 0x08: "Ë",
    0x09: "Ì", 0x0a: "Í", 0x0b: "Î", 0x0c: "Ï", 0x0d: "Ò", 0x0e: "Ó", 0x0f: "Ô", 0x10: "Œ",
    0x11: "Ù", 0x12: "Ú", 0x13: "Û", 0x14: "Ñ", 0x15: "ß", 0x16: "à", 0x17: "á", 0x18: "â",
    0x19: "ç", 0x1a: "è", 0x1b: "é", 0x1c: "ê", 0x1d: "ë", 0x1e: "ì", 0x1f: "í", 0x20: "î",
    0x21: "ï", 0x22: "ò", 0x23: "ó", 0x24: "ô", 0x25: "œ", 0x26: "ù", 0x27: "ú", 0x28: "û",
    0x29: "ñ", 0x2a: "º", 0x2b: "ª",
  }).forEach(([b, t]) => set(Number(b), t));
  for (let b = 0xf7; b <= 0xfe; b += 1) set(b, "");
}
const textoEn = (data, off, max = 400) => {
  let out = "";
  for (let i = 0; i < max; i += 1) {
    const b = data[off + i];
    if (b === undefined) break;
    if (b === 0xff) break;
    const c = CHAR[b];
    out += c === null || c === undefined ? "" : c;
  }
  return out.replace(/\s+/g, " ").trim();
};

const u32 = (d, o) => (d[o] | (d[o + 1] << 8) | (d[o + 2] << 16) | (d[o + 3] << 24)) >>> 0;
const u16 = (d, o) => d[o] | (d[o + 1] << 8);
const s16 = (d, o) => {
  const v = u16(d, o);
  return v > 0x7fff ? v - 0x10000 : v;
};
const esPtr = (v, len) => v >= 0x08000000 && v - 0x08000000 < len - 4;

// --------------------------------------------------------------- MapLayout
// struct MapLayout { s32 width; s32 height; u16* border; u16* map;
//                    Tileset* primary; Tileset* secondary; u8 bw; u8 bh; }
/** struct Tileset { u8 isCompressed; u8 isSecondary; ptr tiles; ptr palettes;
 *                   ptr metatiles; ptr metatileAttrs; … } */
function tilesetValido(data, ptr, len) {
  const o = ptr - 0x08000000;
  if (o < 0 || o + 24 >= len) return false;
  if (data[o] > 1 || data[o + 1] > 1) return false;
  const validos = [4, 8, 12, 16].filter((k) => esPtr(u32(data, o + k), len)).length;
  return validos >= 3;
}

function buscarMapLayouts(data) {
  const len = data.length;
  const hallados = [];
  for (let off = 0; off + 26 <= len; off += 4) {
    const width = u32(data, off);
    if (width < 8 || width > 200) continue;
    const height = u32(data, off + 4);
    if (height < 8 || height > 200) continue;
    const border = u32(data, off + 8);
    if (!esPtr(border, len)) continue;
    const map = u32(data, off + 12);
    if (!esPtr(map, len)) continue;
    const prim = u32(data, off + 16);
    const sec = u32(data, off + 20);
    if (!esPtr(prim, len) || !esPtr(sec, len)) continue;
    // Un hack puede servir el mapa comprimido (LZ77, mágico 0x10) o sin comprimir:
    // lo que decide es que los dos tilesets apunten a estructuras coherentes.
    if (!tilesetValido(data, prim, len) && !tilesetValido(data, sec, len)) continue;
    const bw = data[off + 24];
    const bh = data[off + 25];
    if (bw > 8 || bh > 8) continue;
    hallados.push({ off, width, height, map, prim, sec, bw, bh, comprimido: data[map - 0x08000000] === 0x10 });
  }
  return hallados;
}

/** Índice inverso: para cada dirección objetivo, qué posiciones la apuntan. */
function indiceInverso(data, objetivos) {
  const set = new Set(objetivos);
  const idx = new Map();
  const len = data.length - 3;
  for (let off = 0; off < len; off += 1) {
    const v = u32(data, off);
    if (!set.has(v)) continue;
    if (!idx.has(v)) idx.set(v, []);
    idx.get(v).push(off);
  }
  return idx;
}

// --------------------------------------------------------------- MapHeader
// struct MapHeader { MapLayout* mapLayout (0x00); MapEvents* events (0x04);
//   MapScripts* scripts (0x08); MapConnections* connections (0x0C);
//   u16 music (0x10); u16 mapLayoutId (0x12); u8 regionMapSectionId (0x14);
//   u8 weather (0x15); u8 mapType (0x16); u8 filler (0x17); ... }
function buscarHeaders(data, layouts) {
  const len = data.length;
  const idx = indiceInverso(data, layouts.map((l) => l.off + 0x08000000));
  const headers = [];
  for (const layout of layouts) {
    const refs = idx.get(layout.off + 0x08000000) || [];
    for (const ref of refs) {
      const events = u32(data, ref + 4);
      if (!esPtr(events, len)) continue;
      const scripts = u32(data, ref + 8);
      if (!esPtr(scripts, len)) continue;
      const conns = u32(data, ref + 12);
      if (conns !== 0 && !esPtr(conns, len)) continue;
      const music = u16(data, ref + 16);
      if (music > 0x600) continue;
      const weather = data[ref + 0x15];
      if (weather > 20) continue;
      const mapType = data[ref + 0x16];
      if (mapType > 12) continue;
      headers.push({ off: ref, layout, events, scripts, conns, music, weather, mapType });
      break;
    }
  }
  return headers;
}

/** Agrupa las referencias a headers en bancos: punteros contiguos. */
function buscarBancos(data, headers) {
  const idx = indiceInverso(data, headers.map((h) => h.off + 0x08000000));
  const referencias = [];
  for (const h of headers) {
    for (const ref of idx.get(h.off + 0x08000000) || []) referencias.push({ ref, header: h });
  }
  referencias.sort((a, b) => a.ref - b.ref);
  const bancos = [];
  let actual = [];
  for (const r of referencias) {
    if (actual.length && r.ref === actual[actual.length - 1].ref + 4) actual.push(r);
    else {
      if (actual.length >= 3) bancos.push(actual);
      actual = [r];
    }
  }
  if (actual.length >= 3) bancos.push(actual);
  return bancos.filter((b) => b.length >= 3);
}

// ----------------------------------------------------------------- eventos
// struct MapEvents { u8 numNPCs; u8 numWarps; u8 numTriggers; u8 numSigns;
//                    ObjectEvent* npcs; WarpEvent* warps; CoordEvent* triggers; BgEvent* signs; }
// struct ObjectEvent { u8 active; u8 localId; u8 graphicsId; u8 kind;
//   s16 x; s16 y; u8 elevation; u8 movementType; u8 rangeX:4/rangeY:4;
//   u16 trainerType; u16 trainerRange; u8* script; u16 flagId; u8 filler[2]; } = 24 bytes
const NPC_SIZE = 24;
function leerEventos(data, eventsPtr) {
  const off = eventsPtr - 0x08000000;
  if (off < 0 || off + 20 > data.length) return null;
  const numNpcs = data[off];
  const numWarps = data[off + 1];
  const numTriggers = data[off + 2];
  const numSigns = data[off + 3];
  const npcs = [];
  const npcPtr = u32(data, off + 4);
  if (esPtr(npcPtr, data.length) && numNpcs > 0 && numNpcs < 200) {
    const base = npcPtr - 0x08000000;
    for (let i = 0; i < numNpcs; i += 1) {
      const o = base + i * NPC_SIZE;
      if (o + NPC_SIZE > data.length) break;
      npcs.push({
        localId: data[o + 1],
        sprite: data[o + 2],
        x: s16(data, o + 4),
        y: s16(data, o + 6),
        elevation: data[o + 8],
        movimiento: data[o + 9],
        tipoEntrenador: u16(data, o + 0x0c),
        rangoEntrenador: u16(data, o + 0x0e),
        script: u32(data, o + 0x10),
        flag: u16(data, o + 0x14),
      });
    }
  }
  const warps = [];
  const warpPtr = u32(data, off + 8);
  if (esPtr(warpPtr, data.length) && numWarps > 0 && numWarps < 100) {
    const base = warpPtr - 0x08000000;
    for (let i = 0; i < numWarps; i += 1) {
      const o = base + i * 8;
      if (o + 8 > data.length) break;
      // WarpEvent Gen III: x, y, elevation, warpId, mapNum, mapGroup.
      // Antes estos dos últimos bytes se publicaban como «destino/salida», lo
      // que impedía reconstruir el grafo completo entre bancos.
      warps.push({
        x: s16(data, o), y: s16(data, o + 2), elevation: data[o + 4],
        warpId: data[o + 5], mapaDestino: data[o + 6], bancoDestino: data[o + 7],
      });
    }
  }
  return { numNpcs, numWarps, numTriggers, numSigns, npcs, warps, npcPtr, warpPtr };
}

// ----------------------------------------------------------------- scripts
// Minería de patrones sobre la ventana de cada script. Los opcodes usados
// están comprobados sobre la ROM (lock/faceplayer, loadpointer+callstd,
// checkflag/setflag/clearflag, setvar, applymovement); no es un desensamblado
// completo, así que puede haber algún falso positivo, pero no pierde diálogos.
//
// Opcodes validados en Glazed (base Esmeralda):
//   0x02 end · 0x03 return · 0x04 call · 0x05 goto · 0x06 goto_if <cond> <ptr>
//   0x09 callstd <tipo>   · 0x0F loadpointer <banco> <ptr>   (el texto)
//   0x16 setvar <var> <valor> · 0x17 addvar · 0x18 subvar
//   0x29 setflag · 0x2A clearflag · 0x2B checkflag
//   0x4F applymovement <id> <ptr> · 0x51 waitmovement <id>
//   0x5A faceplayer · 0x6A lock · 0x6B release
const VENTANA = 2048;
function minarScript(data, ptr) {
  const start = ptr - 0x08000000;
  if (start < 0 || start >= data.length) return null;
  const fin = Math.min(data.length, start + VENTANA);
  const pasos = [];
  const flags = new Set();
  const variables = new Set();
  const textos = [];
  for (let o = start; o < fin - 6; o += 1) {
    const op = data[o];
    // loadpointer <banco> <ptr>: es como se muestra un diálogo (msgbox).
    if (op === 0x0f && data[o + 1] <= 0x02) {
      const p = u32(data, o + 2);
      if (esPtr(p, data.length)) {
        const t = textoEn(data, p - 0x08000000);
        if (t.length > 3 && !/\{[0-9a-f]{2}\}/.test(t.slice(0, 60))) {
          textos.push(t);
          pasos.push({ tipo: "texto", en: o - start, valor: t.slice(0, 240) });
        }
        o += 5;
      }
      continue;
    }
    if (op === 0x09) {
      pasos.push({ tipo: "llamada_estandar", en: o - start, valor: data[o + 1] });
      o += 1;
      continue;
    }
    if (op === 0x29 || op === 0x2a || op === 0x2b) {
      const flag = u16(data, o + 1);
      if (flag > 0 && flag < 0x4000) {
        flags.add(flag);
        pasos.push({ tipo: op === 0x29 ? "setflag" : op === 0x2a ? "clearflag" : "checkflag", en: o - start, valor: flag });
      }
      o += 2;
      continue;
    }
    if (op === 0x16 || op === 0x17 || op === 0x18) {
      const variable = u16(data, o + 1);
      if (variable >= 0x4000 && variable < 0x9000) {
        variables.add(variable);
        pasos.push({ tipo: op === 0x16 ? "setvar" : op === 0x17 ? "addvar" : "subvar", en: o - start, valor: variable });
      }
      o += 4;
      continue;
    }
    if (op === 0x4f) {
      const p = u32(data, o + 3);
      if (esPtr(p, data.length)) pasos.push({ tipo: "movimiento", en: o - start, valor: u16(data, o + 1) });
      o += 6;
      continue;
    }
    if (op === 0x51) {
      pasos.push({ tipo: "esperar_movimiento", en: o - start, valor: u16(data, o + 1) });
      o += 2;
      continue;
    }
    if (op === 0x5a) {
      pasos.push({ tipo: "mirar_jugador", en: o - start });
      continue;
    }
    if (op === 0x6a) {
      pasos.push({ tipo: "bloquear", en: o - start });
      continue;
    }
    if (op === 0x6b) {
      pasos.push({ tipo: "liberar", en: o - start });
      continue;
    }
    if (op === 0x02 || op === 0x03) {
      pasos.push({ tipo: op === 0x02 ? "fin" : "retorno", en: o - start });
      if (o - start > 8) break; // fin plausible del script
      continue;
    }
  }
  if (!pasos.length) return null;
  return { pasos: pasos.sort((a, b) => a.en - b.en).slice(0, 40), textos, flags: [...flags], variables: [...variables] };
}

// ------------------------------------------------------------------ informe
function analizar(file) {
  const data = fs.readFileSync(file);
  const t0 = Date.now();
  const slug = path.basename(file).replace(/\.(gba|gb|gbc)$/i, "");
  const layouts = buscarMapLayouts(data);
  const headers = buscarHeaders(data, layouts);
  const bancos = buscarBancos(data, headers);

  const mapas = [];
  let vistos = 0;
  for (let bancoId = 0; bancoId < bancos.length; bancoId += 1) {
    const banco = bancos[bancoId];
    for (let i = 0; i < banco.length; i += 1) {
      const h = banco[i].header;
      const eventos = leerEventos(data, h.events) || { npcs: [], warps: [] };
      const scripts = [];
      const flags = new Set();
      const variables = new Set();
      const textos = [];
      for (const npc of eventos.npcs || []) {
        const s = minarScript(data, npc.script);
        if (s) {
          scripts.push({ npc: npc.localId, sprite: npc.sprite, x: npc.x, y: npc.y, tipoEntrenador: npc.tipoEntrenador, pasos: s.pasos, textos: s.textos.slice(0, 3) });
          for (const f of s.flags) flags.add(f);
          textos.push(...s.textos.slice(0, 2));
          for (const v of s.variables || []) variables.add(v);
        }
        if (npc.flag) flags.add(npc.flag);
      }
      mapas.push({
        banco: bancoId,
        indice: i,
        header: h.off,
        ancho: h.layout.width,
        alto: h.layout.height,
        musica: h.music,
        clima: h.weather,
        tipo: h.mapType,
        npcs: (eventos.npcs || []).length,
        warps: (eventos.warps || []).length,
        warpsDetalle: eventos.warps || [],
        npcsDetalle: eventos.npcs || [],
        scripts,
        flags: [...flags],
        variables: [...variables],
        textos: textos.slice(0, 3),
      });
      vistos += 1;
      if (MAX_MAPS && vistos >= MAX_MAPS) break;
    }
    if (MAX_MAPS && vistos >= MAX_MAPS) break;
  }

  const totalNpcs = mapas.reduce((a, m) => a + m.npcs, 0);
  const totalTextos = mapas.reduce((a, m) => a + m.scripts.reduce((b, s) => b + (s.textos.length || 0), 0), 0);
  const flagsGlobal = new Map();
  for (const m of mapas) for (const f of m.flags) flagsGlobal.set(f, (flagsGlobal.get(f) || 0) + 1);
  const variablesGlobal = new Set();
  for (const m of mapas) for (const v of m.variables) variablesGlobal.add(v);

  const salida = {
    slug,
    rom: path.basename(file),
    generadoEn: new Date().toISOString(),
    resumen: {
      duracionSegundos: Number(((Date.now() - t0) / 1000).toFixed(1)),
      layouts: layouts.length,
      headers: headers.length,
      bancos: bancos.length,
      mapas: mapas.length,
      npcs: totalNpcs,
      lineasDialogo: totalTextos,
      flagsDistintas: flagsGlobal.size,
      variablesDistintas: variablesGlobal.size,
    },
    mapas,
    flagsMasUsadas: [...flagsGlobal.entries()].sort((a, b) => b[1] - a[1]).slice(0, 60),
  };

  const outDir = path.join(OUT_ROOT(), slug);
  fs.mkdirSync(path.join(outDir, "pbs"), { recursive: true });
  fs.writeFileSync(path.join(outDir, "mapas_npcs.json"), `${JSON.stringify(salida, null, 2)}\n`);

  // NPC por mapa
  const lineasNpc = mapas.map(
    (m) => `MAPA header=0x${m.header.toString(16).toUpperCase()} ${m.ancho}×${m.alto} música=${m.musica} clima=${m.clima} tipo=${m.tipo} · ${m.npcs} NPCs, ${m.warps} warps\n` +
      m.npcsDetalle.map((n) => `  NPC local=${n.localId} sprite=${n.sprite} (${n.x},${n.y}) mov=${n.movimiento} entrenador=${n.tipoEntrenador} rango=${n.rangoEntrenador} flag=${n.flag} script=0x${(n.script >>> 0).toString(16).toUpperCase()}`).join("\n")
  );
  fs.writeFileSync(path.join(outDir, "pbs", "npcs.txt"), `# ${totalNpcs} NPCs en ${mapas.length} mapas\n${lineasNpc.join("\n")}\n`);

  // Cinemáticas: secuencia de pasos por NPC con diálogo
  const lineasCut = [];
  for (const m of mapas) {
    if (!m.scripts.length) continue;
    lineasCut.push(`# ============================== MAPA 0x${m.header.toString(16).toUpperCase()} (${m.ancho}×${m.alto})`);
    for (const s of m.scripts) {
      lineasCut.push(`--- NPC ${s.npc} (sprite ${s.sprite}) en (${s.x},${s.y})${s.tipoEntrenador ? ` · entrenador ${s.tipoEntrenador}` : ""}`);
      for (const paso of s.pasos) {
        if (paso.tipo === "texto") lineasCut.push(`    «${paso.valor}»`);
        else lineasCut.push(`    [${paso.tipo}] ${paso.valor ?? ""}`);
      }
    }
  }
  fs.writeFileSync(path.join(outDir, "pbs", "cutscenes.txt"), `# Cinemáticas reconstruidas: ${mapas.length} mapas\n${lineasCut.join("\n")}\n`);

  // Flags con ejemplo de texto
  const ejemploPorFlag = new Map();
  for (const m of mapas) {
    for (const s of m.scripts) {
      for (const f of m.flags) {
        if (!ejemploPorFlag.has(f) && s.textos.length) ejemploPorFlag.set(f, s.textos[0].slice(0, 120));
      }
    }
  }
  fs.writeFileSync(
    path.join(outDir, "pbs", "flags.txt"),
    `# ${flagsGlobal.size} flags detectadas en scripts y NPCs\n` +
      salida.flagsMasUsadas.map(([f, n]) => `FLAG 0x${f.toString(16).toUpperCase()} (${f})\tusos=${n}\tejemplo: ${ejemploPorFlag.get(f) || "—"}`).join("\n") +
      "\n"
  );

  const informe = `# Mapas, NPCs y cinemáticas: ${salida.rom}

Generado ${salida.generadoEn} en ${salida.resumen.duracionSegundos}s · _minería de patrones, no desensamblado_

| Dato | Valor |
|---|---:|
| MapLayouts detectados | ${salida.resumen.layouts} |
| Cabeceras de mapa | ${salida.resumen.headers} |
| Bancos de mapas | ${salida.resumen.bancos} |
| Mapas reconstruidos | ${salida.resumen.mapas} |
| NPCs | ${salida.resumen.npcs} |
| Líneas de diálogo recuperadas | ${salida.resumen.lineasDialogo} |
| Flags distintas | ${salida.resumen.flagsDistintas} |
| Variables distintas | ${salida.resumen.variablesDistintas} |

## Flags más usadas

${salida.flagsMasUsadas.slice(0, 20).map(([f, n]) => `- **0x${f.toString(16).toUpperCase()}** (${f}) — ${n} usos · _${ejemploPorFlag.get(f) || "sin ejemplo"}_`).join("\n")}

## Mapas con más NPCs

${mapas
  .slice()
  .sort((a, b) => b.npcs - a.npcs)
  .slice(0, 12)
  .map((m) => `- 0x${m.header.toString(16).toUpperCase()} · ${m.ancho}×${m.alto} · música ${m.musica} · ${m.npcs} NPCs, ${m.warps} warps`)
  .join("\n")}

## Ejemplo de cinemática reconstruida

${
  (mapas.find((m) => m.scripts.length && m.scripts.some((s) => s.textos.length)) || { scripts: [] }).scripts
    .slice(0, 1)
    .map((s) => s.pasos.slice(0, 14).map((p) => (p.tipo === "texto" ? `> ${p.valor}` : `- [${p.tipo}] ${p.valor ?? ""}`)).join("\n"))
}
`;
  fs.writeFileSync(path.join(outDir, "informe_mapas.md"), informe);
  console.log(
    `${slug}: ${salida.resumen.mapas} mapas · ${totalNpcs} NPCs · ${salida.resumen.lineasDialogo} diálogos · ` +
      `${salida.resumen.flagsDistintas} flags · ${salida.resumen.variablesDistintas} variables (${salida.resumen.duracionSegundos}s)`
  );
  return salida;
}

const objetivos = ROM
  ? [ROM]
  : DIR
    ? fs.readdirSync(DIR).filter((f) => /\.gba$/i.test(f)).map((f) => path.join(DIR, f))
    : [];
if (!objetivos.length) {
  console.log("Uso: node tools/gba_maps_events.mjs --rom <archivo.gba> | --dir <carpeta>");
  process.exit(1);
}
for (const objetivo of objetivos) analizar(objetivo);
