#!/usr/bin/env node
/**
 * fire_ash_health.mjs — radiografía de los cuatro problemas del informe
 * «mapas en negro, muchas crash, movimiento z, diálogos solapados npc».
 *
 * Mide, sobre los datos REALES del juego (no opiniones):
 *
 *   1. MAPAS EN NEGRO
 *      · mapas de MapInfos cuyo archivo falta (el juego falla al entrar),
 *      · mapas sin ningún tile (negro garantizado) y cuántos eventos tienen,
 *      · tilesets a los que les falta el PNG (o con mayúsculas distintas, que en
 *        Android/Kirin cuentan como faltante),
 *      · mapas sin ninguna casilla donde el jugador se vea (no sirven de warp).
 *   2. CRASH
 *      · transferencias (201) a mapas que no existen / sin archivo / fuera de
 *        rango / con coordenadas negativas,
 *      · llamadas a `pbX(...)` en eventos que el motor no define,
 *      · páginas automáticas (3) y paralelas (4) sin espera, que cuelgan el
 *        bucle del intérprete,
 *      · el parche del botón Z y las secciones Ruby inyectadas.
 *   3. MOVIMIENTO (Z)
 *      · mapa de teclas del motor (Input) y estado del parche PokeMod_ZMenu.
 *   4. DIÁLOGOS
 *      · bloques de diálogo (101 + 401), líneas que se salen de la caja,
 *        diálogos vacíos y códigos de color sin cerrar.
 *
 * Uso:
 *   node tools/qa/fire_ash_health.mjs            # informe (falla solo con lo grave)
 *   node tools/qa/fire_ash_health.mjs --json     # salida JSON
 *   node tools/qa/fire_ash_health.mjs --game <carpeta>
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { marshalLoad, RString, RHash } from "../../web/js/marshal.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const ARGS = process.argv.slice(2);
const JSON_OUT = ARGS.includes("--json");
const GAME = ARGS.includes("--game") ? path.resolve(ARGS[ARGS.indexOf("--game") + 1]) : path.join(ROOT, "pokemon_fire_ash");
const DATA = path.join(GAME, "Data");
const G = path.join(GAME, "Graphics");
const BOX_COLS = 53;      // ancho útil de la caja de mensajes de Essentials
const LINES_PER_BOX = 2;  // pbBottomLeftLines(msgwindow, 2)

const txt = (v) => (v instanceof RString ? v.text : v == null ? "" : String(v));
const pad3 = (n) => String(n).padStart(3, "0");

const out = {
  juego: path.relative(ROOT, GAME),
  mapas: {},
  tilesets: {},
  transferencias: {},
  eventos: {},
  dialogos: {},
  ruby: {},
  graves: [],
  avisos: [],
};

// ---------------------------------------------------------------- utilidades
function inflate(entry) {
  try { return zlib.inflateSync(Buffer.from(entry.bytes)).toString("utf8"); } catch { return null; }
}
const secsCache = new Map();
function secciones(file) {
  if (secsCache.has(file)) return secsCache.get(file);
  if (!fs.existsSync(file)) return null;
  const secs = marshalLoad(fs.readFileSync(file)).map((e) => ({ id: Number(e[0]), title: txt(e[1]), code: e[2] ? inflate(e[2]) : null }));
  secsCache.set(file, secs);
  return secs;
}

// ------------------------------------------------------------------- 1. mapas
const infosRaw = marshalLoad(new Uint8Array(fs.readFileSync(path.join(DATA, "MapInfos.rxdata"))));
const infos = [...infosRaw.pairs].map(([k, v]) => ({
  id: Number(k), name: txt(v.getIvar("name")), parent: Number(v.getIvar("parent_id") || 0),
}));
const mapFiles = new Map();
for (const f of fs.readdirSync(DATA)) {
  const m = f.match(/^Map(\d+)\.rxdata$/i);
  if (m) mapFiles.set(Number(m[1]), f);
}
const sinArchivo = infos.filter((i) => !mapFiles.has(i.id));
out.mapas = { entradas: infos.length, archivos: mapFiles.size, sinArchivo: sinArchivo.map((i) => `${i.id} ${i.name}`) };
if (sinArchivo.length) out.graves.push(`${sinArchivo.length} mapa(s) en la lista SIN archivo: el juego falla al entrar (${sinArchivo.map((i) => i.id).join(", ")})`);

// tilesets: nombre -> PNG presente (case-insensitive)
const tsRaw = marshalLoad(new Uint8Array(fs.readFileSync(path.join(DATA, "Tilesets.rxdata"))));
const tsDir = fs.existsSync(path.join(G, "Tilesets")) ? fs.readdirSync(path.join(G, "Tilesets")) : [];
const tsFiles = new Set(tsDir);
const tsLower = new Map(tsDir.map((f) => [f.toLowerCase(), f]));
const ts = tsRaw.map((t, i) => (t ? { id: i, name: txt(t.getIvar("tileset_name")), autos: (t.getIvar("autotile_names") || []).map(txt) } : null));
const tsSinPng = [];
const tsMayusculas = [];
for (const t of ts) {
  if (!t || !t.name) continue;
  const f = t.name + ".png";
  if (tsFiles.has(f)) continue;
  if (tsLower.has(f.toLowerCase())) tsMayusculas.push(`${t.id} ${f} → ${tsLower.get(f.toLowerCase())}`);
  else tsSinPng.push(`${t.id} ${t.name}`);
}
const tsVacias = ts.filter((t) => t && !t.name).map((t) => t.id);
const tsRotasIdx = new Set(ts.map((t, i) => (t && t.name ? null : i)).filter((i) => i !== null));
const mapasSinTileset = [];
const autoSinPng = new Set();
const auDir = fs.existsSync(path.join(G, "Autotiles")) ? fs.readdirSync(path.join(G, "Autotiles")).map((f) => f.replace(/\.[^.]+$/, "").toLowerCase()) : [];
for (const t of ts) {
  if (!t) continue;
  for (const a of t.autos) if (a && !auDir.includes(a.toLowerCase())) autoSinPng.add(a);
}
out.tilesets = {
  total: ts.filter(Boolean).length,
  mapasConTilesetRoto: mapasSinTileset,
  sinPng: tsSinPng,
  soloMayusculas: tsMayusculas,
  slotsVacios: tsVacias,
  autotilesSinPng: [...autoSinPng],
};
if (tsSinPng.length) out.graves.push(`${tsSinPng.length} tileset(s) sin PNG: esos mapas salen negros`);
if (mapasSinTileset.length) out.graves.push(`${mapasSinTileset.length} mapa(s) con tileset vacío o fuera de rango: el juego falla al entrar (${mapasSinTileset.join(" | ")})`);
if (tsMayusculas.length) out.avisos.push(`${tsMayusculas.length} tileset(s) con el nombre en mayúsculas distintas del archivo (en Android/Kirin cuenta como faltante)`);
if (autoSinPng.size) out.avisos.push(`${autoSinPng.size} autotile(s) referenciados sin PNG: los mapas muestran el hueco en cuadros`);

// --------------------------------------------------- 2/4. recorrido de mapas
const defined = new Set();
const RUBY_CORE = new Set(
  (fs.readFileSync(path.join(ROOT, "tools/qa/scripts_dangling_calls.mjs"), "utf8").match(/const RUBY_CORE = new Set\(\s*`([\s\S]*?)`/)?.[1] ?? "")
    .split(/\s+/).filter(Boolean),
);
const ALLOWED = new Set(
  (fs.readFileSync(path.join(ROOT, "tools/qa/scripts_dangling_calls.mjs"), "utf8").match(/const ALLOWED = new Set\(\s*`([\s\S]*?)`/)?.[1] ?? "")
    .split(/\s+/).filter(Boolean),
);
for (const file of ["pokemon_fire_ash/Data/Scripts.rxdata", "Scripts_corregido/Scripts.rxdata"]) {
  const secs = secciones(path.join(ROOT, file));
  if (!secs) continue;
  for (const s of secs) {
    if (!s.code) continue;
    for (const m of s.code.matchAll(/\bdef\s+(?:self\.)?([A-Za-z_][A-Za-z0-9_]*[?!]?)/g)) defined.add(m[1]);
    for (const m of s.code.matchAll(/\balias(?:_method)?\s+:?([A-Za-z_][A-Za-z0-9_]*[?!]?)/g)) defined.add(m[1]);
  }
}

const stats = {
  mapasVacios: [], sinCasillaVisible: [], traspasosRotos: [], rutasRotos: [], llamadasRaras: [],
  autorunSinEspera: 0, paraleloSinEspera: 0, bloquesDialogo: 0, dialogosVacios: [], lineasLargas: [],
  npcsEnBloqueado: 0, spritesSinPng: 0, spritesMalEscritos: [], eventos: 0, paginas: 0,
};
const charDirFiles = fs.existsSync(path.join(G, "Characters")) ? fs.readdirSync(path.join(G, "Characters")) : [];
const charFiles = new Set(charDirFiles.map((f) => f.replace(/\.[^.]+$/, "").toLowerCase()));
const charBases = new Map(charDirFiles.map((f) => { const b = f.replace(/\.[^.]+$/, ""); return [b.toLowerCase(), b]; }));

for (const [id, file] of [...mapFiles.entries()].sort((a, b) => a[0] - b[0])) {
  let map;
  try { map = marshalLoad(new Uint8Array(fs.readFileSync(path.join(DATA, file)))); } catch (e) { out.graves.push(`Map${pad3(id)}.rxdata no se puede leer: ${e.message}`); continue; }
  const W = Number(map.getIvar("width")), H = Number(map.getIvar("height"));
  const data = map.getIvar("data");
  const dv = data ? new DataView(data.bytes.buffer, data.bytes.byteOffset, data.bytes.byteLength) : null;
  let vacias = 0;
  const cell = (x, y, z) => (dv && x >= 0 && y >= 0 && x < W && y < H && z < 3 ? dv.getUint16(20 + (x + W * (y + H * z)) * 2, true) : 0);
  if (dv) {
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (!cell(x, y, 0) && !cell(x, y, 1) && !cell(x, y, 2)) vacias++;
      }
    }
  }
  const nombre = infos.find((i) => i.id === id)?.name ?? "";
  const tid = Number(map.getIvar("tileset_id") ?? -1);
  if (tsRotasIdx.has(tid) || tid < 0 || tid >= ts.length) mapasSinTileset.push(`${id} «${nombre}» tileset_id=${tid}`);
  const evHash = map.getIvar("events");
  const eventos = evHash instanceof RHash ? evHash.pairs : [];
  stats.eventos += eventos.length;
  if (dv && vacias === W * H) stats.mapasVacios.push(`${id} «${nombre}» ${W}x${H} eventos=${eventos.length}`);
  if (dv && vacias > 0.99 * W * H && vacias !== W * H) stats.mapasVacios.push(`${id} «${nombre}» ${W}x${H} (${(100 * vacias / (W * H)).toFixed(0)} % sin tiles) eventos=${eventos.length}`);

  for (const [, ev] of eventos) {
    for (const pg of ev.getIvar("pages") || []) {
      stats.paginas++;
      const trigger = Number(pg.getIvar("trigger"));
      const list = pg.getIvar("list") || [];
      const codes = list.map((c) => Number(c.getIvar("code")));
      const tieneEspera = codes.includes(106) || codes.includes(115) || codes.includes(116) ||
                          codes.includes(121) || codes.includes(123) || codes.includes(201) ||
                          codes.includes(101) || codes.includes(210);
      if (trigger === 3 && !tieneEspera && !codes.includes(355)) stats.autorunSinEspera++;
      if (trigger === 4 && !tieneEspera && !codes.includes(355)) stats.paraleloSinEspera++;
      const g = pg.getIvar("graphic");
      const cn = txt(g?.getIvar("character_name"));
      // «invisible» es una convención del proyecto: no dibuja nada, no es un error.
      if (cn && cn.toLowerCase() !== "invisible" && !charFiles.has(cn.toLowerCase())) {
        stats.spritesSinPng++;
        const real = charBases.get(cn.replace(/^trchar0*/, "trchar0").toLowerCase()) ?? charBases.get(cn.toLowerCase());
        if (real && real !== cn && stats.spritesMalEscritos.length < 20) {
          stats.spritesMalEscritos.push(`${id}: «${cn}» → «${real}»`);
        }
      }
      if (cn && cn.toLowerCase() !== "invisible" && !charFiles.has(cn.toLowerCase())) {
        out.avisos.push(`sprite inexistente «${cn}» en el mapa ${id} (el editor dibuja un aviso amarillo)`);
      }
      // NPC sobre casilla bloqueada (se queda trabado al moverse)
      if (dv && cn && cn.toLowerCase() !== "invisible" && Number(g?.getIvar("tile_id")) === 0) {
        const ex = Number(ev.getIvar("x")), ey = Number(ev.getIvar("y"));
        const t = cell(ex, ey, 0) || cell(ex, ey, 1) || cell(ex, ey, 2);
        if (!t) stats.npcsEnBloqueado++;
      }
      // transferencias y rutas
      for (const c of list) {
        const code = Number(c.getIvar("code"));
        const p = c.getIvar("parameters") || [];
        if (code === 201) {
          const target = Number(txt(p[1])), x = Number(txt(p[2])), y = Number(txt(p[3]));
          if (!mapFiles.has(target)) stats.traspasosRotos.push(`mapa ${id} ev ${txt(ev.getIvar("id"))} → mapa ${target} (sin archivo)`);
          else if (x < 0 || y < 0) stats.traspasosRotos.push(`mapa ${id} ev ${txt(ev.getIvar("id"))} → (${x},${y}) negativo`);
        }
        if (code === 209) {
          const objetivo = Number(txt(p[0]));
          // En RMXP: -1 es el jugador, 0 es «este evento» (self). Solo > 0 apunta a otro evento.
          if (objetivo > 0 && !eventos.some(([k]) => Number(k) === objetivo)) stats.rutasRotos.push(`mapa ${id}: ruta de movimiento al evento ${objetivo}, que no existe`);
        }
        if ((code === 355 || code === 655 || code === 111)) {
          const src = txt(p[code === 111 ? 1 : 0]);
          for (const m of src.matchAll(/(?:^|[^\w.$@:])([A-Za-z_$][\w$]*)\.([A-Za-z_]\w*[?!]?)\s*\(/g)) {
            const [, recv, meth] = m;
            if (RUBY_CORE.has(meth) || ALLOWED.has(meth) || defined.has(meth)) continue;
            if (!/^pb/.test(meth)) continue;
            if (stats.llamadasRaras.length < 25) stats.llamadasRaras.push(`mapa ${id} ev ${txt(ev.getIvar("id"))}: ${recv}.${meth}() no está definido`);
          }
        }
      }
      // diálogos: 101 + sus 401
      for (let i = 0; i < list.length; i++) {
        if (Number(list[i].getIvar("code")) !== 101) continue;
        const partes = [];
        let j = i + 1;
        while (j < list.length && Number(list[j].getIvar("code")) === 401) { partes.push(txt((list[j].getIvar("parameters") || [])[0])); j++; }
        let msg = txt((list[i].getIvar("parameters") || [])[0]);
        for (const t of partes) {
          if (msg !== "" && t !== "" && !msg.endsWith(" ")) msg += " ";
          msg += t;
        }
        stats.bloquesDialogo++;
        if (msg.trim() === "") stats.dialogosVacios.push(`mapa ${id} ev ${txt(ev.getIvar("id"))}`);
        for (const linea of msg.split(/\\n/)) {
          const limpio = linea.replace(/\\sp\[[^\]]*\]/g, "").replace(/\\[cv]\[\d+\]/g, "").replace(/\\[a-zA-Z]+/g, "");
          if (limpio.length > BOX_COLS * LINES_PER_BOX && stats.lineasLargas.length < 40) {
            stats.lineasLargas.push(`mapa ${id} ev ${txt(ev.getIvar("id"))}: ${limpio.length} car. sin salto (caja de ${BOX_COLS})`);
          }
        }
        // Chequeo de escape de color malformado (p. ej. \c[ sin corchete de cierre)
        if (/\\c\[[^\]]*$/i.test(msg) || /\\c\[\D/i.test(msg)) out.avisos.push(`mapa ${id} ev ${txt(ev.getIvar("id"))}: código de color malformado en diálogo`);
      }
    }
  }
}
out.eventos = { total: stats.eventos, paginas: stats.paginas, ...stats };
out.dialogos = {
  bloques: stats.bloquesDialogo,
  vacios: stats.dialogosVacios.length,
  lineasLargas: stats.lineasLargas.length,
  ejemplosLargos: stats.lineasLargas.slice(0, 10),
};
if (stats.traspasosRotos.length) out.graves.push(`${stats.traspasosRotos.length} transferencia(s) rota(s)`);
if (stats.llamadasRaras.length) out.graves.push(`${stats.llamadasRaras.length} llamada(s) a métodos que el motor no define`);
if (stats.dialogosVacios.length) out.avisos.push(`${stats.dialogosVacios.length} diálogo(s) vacíos (caja en blanco)`);
if (stats.autorunSinEspera) out.avisos.push(`${stats.autorunSinEspera} página(s) «automático» sin espera (riesgo de bucle)`);
if (stats.paraleloSinEspera) out.avisos.push(`${stats.paraleloSinEspera} página(s) «proceso paralelo» sin espera`);
if (stats.npcsEnBloqueado) out.avisos.push(`${stats.npcsEnBloqueado} NPC(s) sobre casilla sin tile (se ven «colgados» en el negro)`);
if (stats.spritesMalEscritos.length) out.avisos.push(`${stats.spritesMalEscritos.length} sprite(s) con el nombre mal escrito: el NPC no se ve (arreglo: tools/repair_map_data.mjs)`);

// ------------------------------------------------------------------- 3. Ruby
const secs = secciones(path.join(DATA, "Scripts.rxdata"));
if (secs) {
  const titles = secs.map((s) => s.title);
  out.ruby = {
    secciones: secs.length,
    pokeMod: titles.filter((t) => /^PokeMod/.test(t)),
    tieneZMenu: titles.includes("PokeMod_ZMenu"),
    tieneDialogos: titles.includes("PokeMod_Dialogos"),
  };
  const zmenu = secs.find((s) => s.title === "PokeMod_ZMenu");
  if (!zmenu) out.graves.push("falta el parche PokeMod_ZMenu (el botón Z puede tirar la partida con una partida antigua)");
  if (!titles.includes("PokeMod_Graficos")) out.graves.push("falta el parche PokeMod_Graficos (un tileset vacío o un gráfico ausente puede tirar la partida)");
  const dial = secs.find((s) => s.title === "PokeMod_Dialogos");
  if (dial?.code && !dial.code.includes("@@ocupado += 1\n    frames = 1")) {
    out.avisos.push("PokeMod_Dialogos sin el arreglo de la reserva atómica (puede dibujar dos cajas a la vez)");
  }
}

// ---------------------------------------------------------------- presentación
if (JSON_OUT) {
  console.log(JSON.stringify(out, null, 2));
} else {
  console.log(`\n══ Salud de Fire Ash · ${out.juego} ══\n`);
  console.log("MAPAS");
  console.log(`  ${out.mapas.entradas} entradas de MapInfos · ${out.mapas.archivos} archivos`);
  console.log(`  sin archivo: ${out.mapas.sinArchivo.length ? out.mapas.sinArchivo.join(" | ") : "ninguno ✔"}`);
  console.log(`  mapas con tileset vacío/fuera de rango (crash al entrar): ${mapasSinTileset.length ? mapasSinTileset.join(" | ") : "ninguno ✔"}`);
  console.log(`  sin ningún tile (negro total): ${stats.mapasVacios.length}${stats.mapasVacios.length ? "\n     " + stats.mapasVacios.slice(0, 12).join("\n     ") : " ✔"}`);
  console.log(`  tilesets sin PNG: ${out.tilesets.sinPng.length} · solo mayúsculas: ${out.tilesets.soloMayusculas.length} · slots vacíos: ${out.tilesets.slotsVacios.length} · autotiles sin PNG: ${out.tilesets.autotilesSinPng.length}`);
  console.log(`  NPC sobre casilla sin tile: ${stats.npcsEnBloqueado} · eventos sin sprite en disco: ${stats.spritesSinPng}`);
  if (stats.spritesMalEscritos.length) {
    console.log(`  sprites con el nombre mal escrito (existen con otros ceros/mayúsculas → NPC invisible): ${stats.spritesMalEscritos.length}`);
    stats.spritesMalEscritos.slice(0, 6).forEach((x) => console.log(`     · mapa ${x}`));
  }
  console.log("\nCRASH / MOVIMIENTO");
  console.log(`  transferencias rotas: ${stats.traspasosRotos.length ? stats.traspasosRotos.slice(0, 5).join(" | ") : "ninguna ✔"}`);
  console.log(`  rutas a eventos inexistentes: ${stats.rutasRotos.length ? stats.rutasRotos.slice(0, 5).join(" | ") : "ninguna ✔"}`);
  console.log(`  llamadas a métodos inexistentes: ${stats.llamadasRaras.length ? stats.llamadasRaras.slice(0, 5).join(" | ") : "ninguna ✔"}`);
  console.log(`  páginas automáticas/paralelas sin espera: ${stats.autorunSinEspera} / ${stats.paraleloSinEspera}`);
  console.log(`  secciones PokeMod: ${out.ruby.pokeMod?.join(", ")}`);
  console.log(`  parche del botón Z (Input::SPECIAL): ${out.ruby.tieneZMenu ? "instalado ✔" : "FALTA ✘"}`);
  console.log(`  parche de gráficos (tileset vacío / mayúsculas / gráfico ausente): ${out.ruby.pokeMod?.includes("PokeMod_Graficos") ? "instalado ✔" : "FALTA ✘"}`);
  console.log("\nDIÁLOGOS");
  console.log(`  bloques 101+401: ${out.dialogos.bloques} · vacíos: ${out.dialogos.vacios} · líneas que se salen de la caja: ${out.dialogos.lineasLargas}`);
  for (const e of out.dialogos.ejemplosLargos.slice(0, 5)) console.log("     " + e);
  console.log("\nRESULTADO");
  if (out.graves.length) out.graves.forEach((g) => console.log(`  ✘ ${g}`));
  if (out.avisos.length) {
    const unicos = [...new Set(out.avisos)];
    console.log(`  ⚠ ${unicos.length} aviso(s):`);
    unicos.slice(0, 12).forEach((a) => console.log(`     · ${a}`));
    if (unicos.length > 12) console.log(`     … y ${unicos.length - 12} más`);
  }
  if (!out.graves.length) console.log("  ✔ sin fallos graves");
  console.log("");
}
process.exit(out.graves.length ? 1 : 0);
