#!/usr/bin/env node
/**
 * verify_rom_campaigns_real.mjs — audita que los mapas de los ROMs invitados
 * instalados en el juego sean los del ROM, sin adaptaciones.
 *
 * Comprueba, para cada campaña:
 *   1. que cada mapa del plan tenga su Map<id>.rxdata con las dimensiones del ROM;
 *   2. que el número de celdas y los ids de tile cuadren con el catálogo real;
 *   3. que todos los tiles apunten dentro del atlas del tileset (PNG 256 px de ancho);
 *   4. que el tileset tenga el PNG y la tabla de pasabilidad de tamaño correcto;
 *   5. que los sprites de los NPC existan en Graphics/Characters;
 *   6. y que los mapas de muestra se rendericen pixel a pixel igual que el ROM.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { marshalLoad } from "../web/js/marshal.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GAME = path.join(ROOT, "pokemon_fire_ash");
const DATA = path.join(GAME, "Data");
const EXTRA = path.join(ROOT, "reference", "roms_invitados_extraidos");
const PLAN = path.join(ROOT, "content", "rom_campaigns_complete.json");
const pad3 = (n) => String(n).padStart(3, "0");
const txt = (v) => (v && v.bytes ? Buffer.from(v.bytes).toString("utf8") : String(v ?? ""));

const fallos = [];
const ok = (cond, msg) => { if (!cond) fallos.push(msg); };

/** Lee dimensiones de un PNG sin decodificarlo. */
function dimPng(ruta) {
  const b = fs.readFileSync(ruta);
  if (b.readUInt32BE(12) !== 0x49484452) return null; // "IHDR"
  return { ancho: b.readUInt32BE(16), alto: b.readUInt32BE(20) };
}

const plan = JSON.parse(fs.readFileSync(PLAN, "utf8"));
const campanas = Array.isArray(plan.campaigns) ? plan.campaigns : Object.values(plan.campaigns);
const tilesets = marshalLoad(fs.readFileSync(path.join(DATA, "Tilesets.rxdata")));
const porNombre = new Map();
for (const t of tilesets) if (t) porNombre.set(t.getIvar("@tileset_name")?.text, t);

let mapasTotal = 0, muestrasTotal = 0, npcsTotal = 0;

for (const campana of campanas) {
  const slug = campana.id;
  const dir = path.join(EXTRA, slug);
  ok(fs.existsSync(path.join(dir, "catalogo.json")), `${slug}: falta la extracción real (${dir})`);
  if (!fs.existsSync(path.join(dir, "catalogo.json"))) continue;
  const catalogo = JSON.parse(fs.readFileSync(path.join(dir, "catalogo.json"), "utf8"));
  const porMapa = new Map(catalogo.mapas.map((m) => [m.mapa, m]));

  let nMapas = 0, nMuestras = 0;
  for (const entrada of campana.maps) {
    const info = porMapa.get(`Map${entrada.mapId}`);
    ok(!!info, `${slug}: el mapa ${entrada.mapId} no está en el catálogo real`);
    if (!info) continue;
    const archivo = path.join(DATA, `Map${pad3(entrada.mapId)}.rxdata`);
    ok(fs.existsSync(archivo), `${slug}: falta Map${entrada.mapId}.rxdata`);
    if (!fs.existsSync(archivo)) continue;

    const mapa = marshalLoad(fs.readFileSync(archivo));
    const ancho = mapa.getIvar("@width"), alto = mapa.getIvar("@height");
    ok(ancho === info.ancho && alto === info.alto, `${slug} Map${entrada.mapId}: mide ${ancho}x${alto} y el ROM ${info.ancho}x${info.alto}`);
    ok(info.tiles.length === info.ancho * info.alto * 2, `${slug} Map${entrada.mapId}: catálogo con ${info.tiles.length} caracteres de tiles`);

    // --- tileset
    const idTileset = mapa.getIvar("@tileset_id");
    const ts = tilesets[idTileset];
    ok(!!ts, `${slug} Map${entrada.mapId}: tileset ${idTileset} inexistente`);
    if (!ts) continue;
    const nombre = ts.getIvar("@tileset_name")?.text ?? "";
    ok(nombre.startsWith(`ROM_${slug.toUpperCase()}_`), `${slug} Map${entrada.mapId}: el tileset ${nombre} no es del ROM`);
    const png = path.join(GAME, "Graphics", "Tilesets", `${nombre}.png`);
    ok(fs.existsSync(png), `${slug}: falta el atlas ${nombre}.png`);
    const definicion = catalogo.tilesets[info.tileset];
    ok(!!definicion, `${slug} Map${entrada.mapId}: tileset ${info.tileset} sin definición`);

    if (fs.existsSync(png) && definicion) {
      const dim = dimPng(png);
      ok(dim?.ancho === 256, `${slug}: el atlas ${nombre}.png mide ${dim?.ancho} px de ancho (esperado 256)`);
      const filas = Math.ceil(definicion.tiles / 8);
      ok(dim?.alto === filas * 32, `${slug}: el atlas ${nombre}.png tiene ${dim?.alto} px de alto y le corresponden ${filas * 32}`);

      // --- celdas dentro del atlas
      const datos = mapa.getIvar("@data").bytes;
      const dv = new DataView(datos.buffer, datos.byteOffset, datos.byteLength);
      const total = ancho * alto;
      let fuera = 0, distintos = new Set();
      for (let i = 0; i < total; i++) {
        const id = dv.getUint16(20 + i * 2, true);
        if (id < 384) continue;
        const k = id - 384;
        if (k >= definicion.tiles) fuera++;
        distintos.add(k);
      }
      ok(fuera === 0, `${slug} Map${entrada.mapId}: ${fuera} celdas apuntan fuera del atlas`);
      // y que los ids usados por el mapa existan en el atlas del ROM
      const ids = new Set(definicion.ids);
      const tiles = info.tiles;
      let raros = 0;
      for (let i = 0; i < total; i++) {
        const idRom = parseInt(tiles.substr(i * 2, 2), 36) || 0;
        if (!ids.has(idRom)) raros++;
      }
      ok(raros === 0, `${slug} Map${entrada.mapId}: ${raros} celdas con metatile fuera del atlas del ROM`);

      // --- pasabilidad del tileset (el atlas se rellena a filas completas de 8)
      const esperado = 384 + 8 * Math.ceil(definicion.tiles / 8);
      const pass = ts.getIvar("@passages").bytes;
      const largo = new DataView(pass.buffer, pass.byteOffset, pass.byteLength).getInt32(16, true);
      ok(largo === esperado, `${slug}: @passages del tileset ${nombre} tiene ${largo} entradas (esperado ${esperado})`);
    }

    // --- sprites de NPC
    for (const [clave, ev] of mapa.getIvar("@events").pairs) {
      const nombreEv = txt(ev.getIvar("@name"));
      if (!/NPC/.test(nombreEv)) continue;
      for (const page of ev.getIvar("@pages")) {
        const gfx = txt(page.getIvar("@graphic")?.getIvar("@character_name"));
        if (!gfx) continue;
        ok(gfx.startsWith(`ROM_${slug.toUpperCase()}_GFX_`), `${slug} Map${entrada.mapId}: el NPC usa el gráfico ${gfx}, que no es del ROM`);
        ok(fs.existsSync(path.join(GAME, "Graphics", "Characters", `${gfx}.png`)), `${slug}: falta el sprite ${gfx}.png`);
        npcsTotal++;
      }
    }
    nMapas++;
  }
  ok(nMapas === campana.maps.length, `${slug}: sólo ${nMapas} de ${campana.maps.length} mapas verificados`);
  mapasTotal += nMapas;

  // --- muestras: píxel a píxel contra el render del ROM guardado como referencia
  const dirMuestras = path.join(dir, "mapas");
  for (const archivo of fs.existsSync(dirMuestras) ? fs.readdirSync(dirMuestras) : []) {
    const id = Number(archivo.match(/^Map(\d+)\.png$/)?.[1]);
    if (!id) continue;
    const mapa = marshalLoad(fs.readFileSync(path.join(DATA, `Map${pad3(id)}.rxdata`)));
    const ancho = mapa.getIvar("@width"), alto = mapa.getIvar("@height");
    const nombre = tilesets[mapa.getIvar("@tileset_id")]?.getIvar("@tileset_name")?.text;
    if (!nombre) continue;
    const atlas = await loadImage(fs.readFileSync(path.join(GAME, "Graphics", "Tilesets", `${nombre}.png`)));
    const lienzo = createCanvas(ancho * 32, alto * 32);
    const ctx = lienzo.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, lienzo.width, lienzo.height);
    const datos = mapa.getIvar("@data").bytes;
    const dv = new DataView(datos.buffer, datos.byteOffset, datos.byteLength);
    for (let y = 0; y < alto; y++) {
      for (let x = 0; x < ancho; x++) {
        const idTile = dv.getUint16(20 + (x + y * ancho) * 2, true);
        if (idTile < 384) continue;
        const k = idTile - 384;
        ctx.drawImage(atlas, (k % 8) * 32, Math.floor(k / 8) * 32, 32, 32, x * 32, y * 32, 32, 32);
      }
    }
    const referencia = await loadImage(fs.readFileSync(path.join(dirMuestras, archivo)));
    const a = ctx.getImageData(0, 0, lienzo.width, lienzo.height).data;
    const b = createCanvas(referencia.width, referencia.height);
    const cb = b.getContext("2d");
    cb.drawImage(referencia, 0, 0);
    const ref = cb.getImageData(0, 0, referencia.width, referencia.height).data;
    ok(referencia.width === lienzo.width && referencia.height === lienzo.height, `${slug} Map${id}: el render mide ${lienzo.width}x${lienzo.height} y la referencia ${referencia.width}x${referencia.height}`);
    let iguales = 0, total = Math.min(a.length, ref.length);
    for (let i = 0; i < total; i += 4) {
      if (a[i] === ref[i] && a[i + 1] === ref[i + 1] && a[i + 2] === ref[i + 2]) iguales++;
    }
    const pct = (iguales / (total / 4)) * 100;
    ok(pct >= 99.9, `${slug} Map${id}: sólo ${pct.toFixed(1)}% de píxeles coinciden con el ROM`);
    nMuestras++;
  }
  muestrasTotal += nMuestras;
  console.log(`· ${slug}: ${nMapas} mapas reales verificados · ${nMuestras} muestras pixel-perfect · ${campana.maps.length} en el plan`);
}

console.log(`\n${mapasTotal} mapas de los ROMs invitados · ${muestrasTotal} comparaciones pixel a pixel · ${npcsTotal} NPCs con sprite real`);
if (fallos.length) {
  console.error(`\n${fallos.length} fallos:`);
  for (const f of fallos.slice(0, 40)) console.error(` - ${f}`);
  process.exit(1);
}
console.log("verificación de assets reales: OK");
