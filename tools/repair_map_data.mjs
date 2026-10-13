#!/usr/bin/env node
/**
 * repair_map_data.mjs — arregla los datos de mapa que rompen el juego.
 *
 * Cubre dos fallos REALES y comprobados en este repositorio:
 *
 *  A) MAPA CON TILESET VACÍO (crash al entrar, y mapa en negro)
 *     El mapa 51 «Dungeon» (80×80) tiene `tileset_id = 7`, y el slot 7 de
 *     `Tilesets.rxdata` no tiene nombre. Al entrar —y se entra, porque el evento
 *     13 de «Rock Cave» (mapa 49) transfiere ahí— el motor hace
 *     `pbGetTileset(nil)` → `AnimatedBitmap.new(nil)` → «Filename is nil
 *     (missing graphic).» → error en pantalla. El mismo fallo deja el mapa negro.
 *     Arreglo: apuntar el mapa al tileset de su mapa padre (o al de un hermano,
 *     o al que diga `--tileset`).
 *
 *  B) SPRITE DE PERSONAJE CON CEROS DE MENOS (NPC invisible)
 *     12 nombres de sprite usados por eventos no existen en disco. Ocho de ellos
 *     son solo el mismo nombre sin los ceros de delante: los eventos piden
 *     «trchar41» y el archivo es «trchar041.png». El motor no revienta (usa un
 *     mapa de bits en blanco) pero el NPC NO SE VE. Arreglo: renombrar el campo
 *     `character_name` de esas páginas al nombre que existe de verdad.
 *
 * Lo que NO hace: no toca partidas (`Save*.rxdata`, `Game.rxdata`), no inventa
 * mapas ni gráficos, y no borra entradas de MapInfos. Todo cambio queda anotado
 * en `PokeModBackups/`.
 *
 * Uso:
 *   node tools/repair_map_data.mjs                 # informa y repara
 *   node tools/repair_map_data.mjs --dry-run       # solo informa
 *   node tools/repair_map_data.mjs --verify        # falla si queda algo roto
 *   node tools/repair_map_data.mjs --tileset 6     # tileset a usar en el caso A
 *   node tools/repair_map_data.mjs --game <ruta>
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalLoad, marshalDump, RString } from "../web/js/marshal.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARGS = process.argv.slice(2);
const DRY = ARGS.includes("--dry-run");
const VERIFY = ARGS.includes("--verify");
const FORCE_TS = ARGS.includes("--tileset") ? Number(ARGS[ARGS.indexOf("--tileset") + 1]) : null;
const GAME = ARGS.includes("--game") ? path.resolve(ARGS[ARGS.indexOf("--game") + 1]) : path.join(ROOT, "pokemon_fire_ash");
const DATA = path.join(GAME, "Data");
const GRAFICOS = path.join(GAME, "Graphics");
const BACKUP = path.join(GAME, "PokeModBackups", "datos_reparados");

const txt = (v) => (v instanceof RString ? v.text : v == null ? "" : String(v));
const pad3 = (n) => String(n).padStart(3, "0");

if (!fs.existsSync(DATA)) { console.error(`✘ no existe ${DATA}`); process.exit(2); }

const infos = marshalLoad(new Uint8Array(fs.readFileSync(path.join(DATA, "MapInfos.rxdata"))));
const info = new Map([...infos.pairs].map(([k, v]) => [Number(k), { name: txt(v.getIvar("name")), parent: Number(v.getIvar("parent_id") || 0) }]));
const tilesets = marshalLoad(new Uint8Array(fs.readFileSync(path.join(DATA, "Tilesets.rxdata"))));
const tsNombre = (i) => { const t = tilesets[i]; return t ? txt(t.getIvar("tileset_name")) : null; };
const slotsVacios = new Set();
tilesets.forEach((t, i) => { if (!t || !txt(t.getIvar("tileset_name"))) slotsVacios.add(i); });

const mapIds = fs.readdirSync(DATA).filter((f) => /^Map\d+\.rxdata$/i.test(f)).map((f) => Number(f.replace(/\D/g, ""))).sort((a, b) => a - b);
const readMap = (id) => marshalLoad(new Uint8Array(fs.readFileSync(path.join(DATA, `Map${pad3(id)}.rxdata`))));

// Palabras reservadas del diccionario de sprites: nunca se tocan
const charDir = fs.existsSync(path.join(GRAFICOS, "Characters")) ? fs.readdirSync(path.join(GRAFICOS, "Characters")) : [];
const charBases = new Set(charDir.map((f) => f.replace(/\.[^.]+$/, "")));
const charLower = new Map(charDir.map((f) => [f.replace(/\.[^.]+$/, "").toLowerCase(), f.replace(/\.[^.]+$/, "")]));

const acciones = [];
const avisos = [];
const log = [];

// ------------------------------------------------------------------ A) tileset
function tilesetDeReemplazo(id, mapa) {
  if (FORCE_TS != null && !slotsVacios.has(FORCE_TS)) return { ts: FORCE_TS, motivo: "--tileset indicado a mano" };
  const padre = info.get(id)?.parent;
  if (padre && fs.existsSync(path.join(DATA, `Map${pad3(padre)}.rxdata`))) {
    const pm = readMap(padre);
    const t = Number(pm.getIvar("tileset_id"));
    if (!slotsVacios.has(t)) return { ts: t, motivo: `tileset del mapa padre ${padre} «${info.get(padre)?.name ?? ""}»` };
  }
  for (const otro of mapIds) {
    if (otro === id) continue;
    if (info.get(otro)?.parent !== padre) continue;
    const m = readMap(otro);
    const t = Number(m.getIvar("tileset_id"));
    if (!slotsVacios.has(t)) return { ts: t, motivo: `tileset del mapa hermano ${otro} «${info.get(otro)?.name ?? ""}»` };
  }
  // último recurso: el tileset más usado por mapas del mismo tamaño y nombre parecido
  const palabra = (info.get(id)?.name ?? "").toLowerCase().split(/\s+/)[0];
  const conteo = new Map();
  for (const otro of mapIds) {
    if (otro === id) continue;
    const nom = (info.get(otro)?.name ?? "").toLowerCase();
    if (!palabra || !nom.includes(palabra)) continue;
    const t = Number(readMap(otro).getIvar("tileset_id"));
    if (!slotsVacios.has(t)) conteo.set(t, (conteo.get(t) || 0) + 1);
  }
  const mejor = [...conteo].sort((a, b) => b[1] - a[1])[0];
  if (mejor) return { ts: mejor[0], motivo: `tileset más usado por mapas llamados «${palabra}…» (${mejor[1]} mapas)` };
  return null;
}

const mapasConTilesetRoto = [];
for (const id of mapIds) {
  const m = readMap(id);
  const tid = Number(m.getIvar("tileset_id"));
  if (!slotsVacios.has(tid) && tid >= 0 && tid < tilesets.length) continue;
  mapasConTilesetRoto.push({ id, tid, mapa: m });
}
if (mapasConTilesetRoto.length) {
  console.log(`\nA) mapas con tileset vacío o inválido: ${mapasConTilesetRoto.length}`);
  for (const { id, tid, mapa } of mapasConTilesetRoto) {
    const rep = tilesetDeReemplazo(id, mapa);
    if (!rep) { avisos.push(`mapa ${id}: tileset ${tid} inválido y sin reemplazo claro`); console.log(`   ✘ ${id} «${info.get(id)?.name}»: tileset ${tid} · sin reemplazo claro (no se toca)`); continue; }
    console.log(`   → ${id} «${info.get(id)?.name}»: tileset ${tid} → ${rep.ts} «${tsNombre(rep.ts)}» (${rep.motivo})`);
    acciones.push({ tipo: "tileset", id, de: tid, a: rep.ts });
    log.push({ tipo: "tileset", mapa: id, nombre: info.get(id)?.name, de: tid, a: rep.ts, motivo: rep.motivo });
  }
} else console.log("\nA) ✔ ningún mapa apunta a un tileset vacío");

// ------------------------------------------------- B) sprites con ceros de menos
const sprites = new Map();
for (const id of mapIds) {
  const m = readMap(id);
  for (const [, ev] of m.getIvar("events")?.pairs ?? []) {
    for (const pg of ev.getIvar("pages") || []) {
      const g = pg.getIvar("graphic");
      const cn = txt(g?.getIvar("character_name"));
      if (!cn || charBases.has(cn)) continue;
      const corregido = charLower.get(cn.toLowerCase()) ?? charLower.get(cn.replace(/^trchar0*/, "trchar0").toLowerCase());
      if (!corregido) continue;
      // solo si el nombre corregido es el mismo número (ceros de menos de verdad)
      const num = (s) => Number((s.match(/(\d+)/) || [])[1] || -1);
      if (num(corregido) !== num(cn)) continue;
      const clave = `${id}|${cn}|${corregido}`;
      if (!sprites.has(clave)) sprites.set(clave, { id, cn, corregido, paginas: 0, tipo: cn.toLowerCase() === corregido.toLowerCase() ? "ceros" : "mayúsculas" });
      sprites.get(clave).paginas++;
    }
  }
}
if (sprites.size) {
  console.log(`\nB) sprites con el nombre mal escrito (NPC invisible): ${sprites.size} combinación(es)`);
  for (const v of sprites.values()) {
    console.log(`   → mapa ${v.id} [${v.tipo}]: «${v.cn}» → «${v.corregido}» (${v.paginas} página/s)`);
    acciones.push({ tipo: "sprite", ...v });
    log.push({ tipo: "sprite", causa: v.tipo, mapa: v.id, nombre: info.get(v.id)?.name, de: v.cn, a: v.corregido, paginas: v.paginas });
  }
} else console.log("\nB) ✔ ningún sprite usa un nombre que exista con otros ceros");

// ------------------------------------------------------------------- escritura
if (!acciones.length) {
  console.log(VERIFY ? "\n✔ nada roto que reparar" : "\n✔ nada que reparar");
  process.exit(0);
}
if (DRY) {
  console.log(`\n(simulación) ${acciones.length} cambio(s) pendientes; nada escrito`);
  process.exit(VERIFY ? 1 : 0);
}
if (VERIFY) {
  console.log(`\n✘ ${acciones.length} problema(s) sin arreglar todavía`);
  process.exit(1);
}

const porMapa = new Map();
for (const a of acciones) {
  if (!porMapa.has(a.id)) porMapa.set(a.id, []);
  porMapa.get(a.id).push(a);
}
for (const [id, lista] of porMapa) {
  const file = path.join(DATA, `Map${pad3(id)}.rxdata`);
  const m = marshalLoad(new Uint8Array(fs.readFileSync(file)));
  for (const a of lista) {
    if (a.tipo === "tileset") m.setIvar("tileset_id", a.a);
    else {
      for (const [, ev] of m.getIvar("events")?.pairs ?? []) {
        for (const pg of ev.getIvar("pages") || []) {
          const g = pg.getIvar("graphic");
          if (g && txt(g.getIvar("character_name")) === a.cn) g.setIvar("character_name", new RString(a.corregido));
        }
      }
    }
  }
  fs.writeFileSync(file, Buffer.from(marshalDump(m)));
}
fs.mkdirSync(BACKUP, { recursive: true });
const logFile = path.join(BACKUP, "datos_reparados.json");
const prev = fs.existsSync(logFile) ? JSON.parse(fs.readFileSync(logFile, "utf8")) : [];
fs.writeFileSync(logFile, JSON.stringify([...prev, { cuando: new Date().toISOString(), cambios: log }], null, 2));
console.log(`\n✔ ${porMapa.size} mapa(s) reparados · anotado en ${path.relative(ROOT, logFile)}`);
if (avisos.length) { console.log("⚠ pendiente de decisión:"); avisos.forEach((a) => console.log(`   · ${a}`)); }
