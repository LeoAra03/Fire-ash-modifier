#!/usr/bin/env node
/**
 * Extracción forense de ROMs invitadas.
 *
 * Toma cada ROM de `roms pokemon/` y la desarma en una carpeta propia con todo
 * lo que se puede reconstruir: cabecera, catálogos (especies, objetos,
 * movimientos...), sprites, tiles, textos/diálogos y un censo de bloques
 * comprimidos que alimenta la extracción de mapas.
 *
 * Todo se hace con decodificadores reales (LZ77/RLE de la BIOS de GBA,
 * descompresor de sprites de Gen 1, paletas BGR555, tiles 4 bpp) y cada hallazgo
 * se guarda con su desplazamiento dentro de la ROM para poder volver a él.
 *
 * Uso:
 *   node tools/forense_roms.mjs
 *   node tools/forense_roms.mjs --rom "roms pokemon/GlazedESPB6.gba"
 *   node tools/forense_roms.mjs --solo nombres
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

import { pngIndizado } from './forense/png.mjs';
import * as GBA from './forense/gba.mjs';
import * as GB from './forense/gb.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROMS_DIR = join(RAIZ, 'roms pokemon');

const arg = (nombre, defecto = null) => {
  const i = process.argv.indexOf(`--${nombre}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : defecto;
};
const SOLO = arg('solo');
const ROM_ARG = arg('rom');

const PALETA_GRIS = [[255, 255, 255, 0], [176, 176, 176, 255], [96, 96, 96, 255], [0, 0, 0, 255]];
const PALETA_VACIA = Array.from({ length: 16 }, (_, i) => [i * 16, i * 16, i * 16, i === 0 ? 0 : 255]);

const asegurar = (dir) => { mkdirSync(dir, { recursive: true }); return dir; };
const escribir = (ruta, contenido) => { writeFileSync(ruta, contenido); };
const escribirJSON = (ruta, datos) => escribir(ruta, JSON.stringify(datos, null, 2));

function slugDe(archivo) {
  return basename(archivo, extname(archivo)).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

/* ───────────────────────────── utilidades comunes ──────────────────────── */

/**
 * Métricas de "parece un sprite de verdad": proporción de transparente, anillo
 * exterior de 2 px limpio (los monstruos de Gen 1 se dibujan con margen) y
 * longitud media de trazo. Se calibraron con la cadena de frontales del banco
 * 0x13 de FactoryAdventure: cero 0,54-0,87 · anillo 0,87-1,00 · trazo 1,0-1,5.
 */
function metricasSprite(r) {
  const { px, ancho: w, alto: h } = r;
  const anillo = (m) => {
    let total = 0;
    let vacios = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (x < m || y < m || x >= w - m || y >= h - m) { total++; if (!px[y * w + x]) vacios++; }
      }
    }
    return vacios / total;
  };
  let cero = 0;
  let trazos = 0;
  let pixeles = 0;
  for (let y = 0; y < h; y++) {
    let ant = -1;
    for (let x = 0; x < w; x++) {
      const v = px[y * w + x];
      if (v === 0) cero++;
      if (v !== ant) trazos++;
      ant = v;
      if (v) pixeles++;
    }
  }
  return {
    cero: cero / (w * h),
    anillo: anillo(2),
    trazo: pixeles / Math.max(1, trazos),
    w,
    h,
  };
}

const pareceSprite = (m) => m.cero >= 0.40 && m.cero <= 0.95 && m.anillo >= 0.85 && m.trazo >= 0.8 && m.trazo <= 4.0;

/* ──────────────────────────────────── GBA ─────────────────────────────── */

function forenseGBA(data, salida, nombre) {
  const cabecera = GBA.leerCabeceraGBA(data);
  escribirJSON(join(salida, '00_cabecera.json'), cabecera);
  console.log(`  · cabecera: ${cabecera.titulo} [${cabecera.codigo}] ${(data.length / 1048576).toFixed(1)} MB`);

  const indice = { juego: nombre, plataforma: 'GBA', cabecera, hallazgos: {} };

  /* nombres de especie */
  const nombres = GBA.buscarTablaNombres(data, 60) || GBA.buscarTablaNombres(data, 25);
  if (nombres) {
    const dirPoke = asegurar(join(salida, 'pokemon'));
    escribirJSON(join(dirPoke, 'nombres.json'), {
      offsetTabla: nombres.base,
      cantidad: nombres.nombres.length,
      nombres: nombres.nombres,
      otrasCandidatas: nombres.candidatos,
    });
    // las tablas secundarias suelen ser continuaciones (el hack parte el bloque)
    const extras = nombres.candidatos.slice(1).map((c) => {
      const lista = [];
      for (let i = 0; i < c.n; i++) {
        const e = data.subarray(c.base + i * 11, c.base + i * 11 + 11);
        lista.push({ indice: i, nombre: GBA.decodificarTextoGBA(e).texto, offset: c.base + i * 11 });
      }
      return { offsetTabla: c.base, cantidad: c.n, nombres: lista };
    });
    if (extras.length) escribirJSON(join(dirPoke, 'nombres_tablas_secundarias.json'), extras);
    indice.hallazgos.nombresEspecie = { offset: nombres.base, cantidad: nombres.nombres.length };
    console.log(`  · nombres de especie: ${nombres.nombres.length} (tabla en 0x${nombres.base.toString(16)})`);
  } else {
    console.log('  · sin tabla de nombres todavía');
  }
  const nEspecies = nombres ? nombres.nombres.length : 0;

  /* sprites: sirven también de referencia para el número de especies */
  const tablasSprites = GBA.buscarTablaSprites(data, 0x800, 40);
  const referencia = Math.max(nEspecies, tablasSprites.length ? tablasSprites[0].n : 0);
  const cercana = (tablas) => tablas
    .filter((t) => t.n > 20)
    .sort((a, b) => Math.abs(a.n - referencia) - Math.abs(b.n - referencia))[0];

  /* estadísticas base */
  if (referencia) {
    const tablas = GBA.buscarEstadisticasBase(data, referencia);
    const mejor = cercana(tablas);
    if (mejor) {
      const stats = GBA.interpretarEstadisticas(data, mejor.base, mejor.n);
      escribirJSON(join(salida, 'pokemon', 'estadisticas_base.json'), {
        offsetTabla: mejor.base,
        cantidad: mejor.n,
        entradaBytes: 28,
        entradas: stats,
      });
      indice.hallazgos.estadisticasBase = { offset: mejor.base, cantidad: mejor.n };
      console.log(`  · estadísticas base: ${mejor.n} especies (0x${mejor.base.toString(16)})`);
    }
    const evos = GBA.buscarEvoluciones(data, referencia);
    const e = cercana(evos);
    if (e) {
      escribirJSON(join(salida, 'pokemon', 'evoluciones.json'), {
        offsetTabla: e.base,
        cantidad: e.n,
        entradas: GBA.interpretarEvoluciones(data, e.base, e.n),
      });
      console.log(`  · evoluciones: ${e.n} especies (0x${e.base.toString(16)})`);
    }
    const aprender = GBA.buscarAprendizaje(data, referencia);
    const t = cercana(aprender);
    if (t) {
      escribirJSON(join(salida, 'pokemon', 'aprendizaje_nivel.json'), {
        offsetTabla: t.base,
        cantidad: t.n,
        entradas: GBA.interpretarAprendizaje(data, t),
      });
      console.log(`  · aprendizaje por nivel: ${t.n} especies (0x${t.base.toString(16)})`);
    }
  }

  /* volcado de los sprites localizados */
  if (tablasSprites.length) {
    const paletas = GBA.buscarTablaPaletas(data, Math.max(30, Math.min(nEspecies || 40, 60)));
    const paletaUsar = paletas[0];
    const dirSprites = asegurar(join(salida, 'sprites'));
    const usadas = tablasSprites.slice(0, 2);
    usadas.forEach((tabla, k) => {
      const carpeta = asegurar(join(dirSprites, k === 0 ? 'frontal' : 'trasero'));
      const listado = [];
      tabla.entradas.forEach((entrada, i) => {
        const r = GBA.lz77(data, entrada.offset);
        if (!r) return;
        const img = GBA.tiles4bpp(r.datos, 8, 8);
        let paleta = PALETA_VACIA;
        if (paletaUsar && paletaUsar.entradas[i]) paleta = GBA.leerPaleta(data, paletaUsar.entradas[i].offset, 16);
        const nombre = (nombres && nombres.nombres[i]) ? nombres.nombres[i].nombre : `especie_${i}`;
        const archivo = join(carpeta, `${String(i).padStart(3, '0')}_${nombre}.png`);
        escribir(archivo, pngIndizado(img.w, img.h, img.px, paleta));
        listado.push({ indice: i, nombre, archivo: archivo.replace(salida, '').replace(/^\//, ''), offsetSprite: entrada.offset, tamano: r.tam, offsetPaleta: paletaUsar && paletaUsar.entradas[i] ? paletaUsar.entradas[i].offset : null });
      });
      escribirJSON(join(carpeta, 'indice.json'), { offsetTabla: tabla.base, cantidad: listado.length, sprites: listado });
      indice.hallazgos[k === 0 ? 'spritesFrontales' : 'spritesTraseros'] = { offsetTabla: tabla.base, cantidad: listado.length };
      console.log(`  · sprites ${k === 0 ? 'frontales' : 'traseros'}: ${listado.length} (tabla 0x${tabla.base.toString(16)})`);
    });
  }

  /* iconos */
  const iconos = GBA.buscarTablaIconos(data, Math.max(30, Math.min(nEspecies || 40, 60)));
  if (iconos.length) {
    const tabla = iconos[0];
    const dir = asegurar(join(salida, 'sprites', 'iconos'));
    const imagenes = [];
    tabla.entradas.forEach((entrada, i) => {
      const r = GBA.lz77(data, entrada.offset);
      if (!r) return;
      imagenes.push({ i, img: GBA.tiles4bpp(r.datos, 4, 4) });
    });
    if (imagenes.length) {
      const hoja = GBA.hojaSprites(imagenes.map((x) => x.img), 16);
      escribir(join(dir, 'iconos.png'), pngIndizado(hoja.w, hoja.h, hoja.px, PALETA_VACIA));
      escribirJSON(join(dir, 'indice.json'), { offsetTabla: tabla.base, cantidad: imagenes.length, columnas: 16 });
      indice.hallazgos.iconos = { offsetTabla: tabla.base, cantidad: imagenes.length };
      console.log(`  · iconos: ${imagenes.length} en hoja (tabla 0x${tabla.base.toString(16)})`);
    }
  }

  /* catálogos de texto (objetos, movimientos, habilidades, tipos, mapas…) */
  const tablasTexto = GBA.buscarTablasTexto(data, { minEntradas: 16, minLargo: 2 });
  if (tablasTexto.length) {
    const dir = asegurar(join(salida, 'catalogos'));
    const resumen = tablasTexto.slice(0, 24).map((t, i) => {
      const archivo = `tabla_${String(i).padStart(2, '0')}_${t.n}.json`;
      escribirJSON(join(dir, archivo), { offsetTabla: t.base, cantidad: t.n, textos: t.textos });
      return { archivo, offsetTabla: t.base, cantidad: t.n, muestra: t.textos.slice(0, 4).map((x) => x.texto) };
    });
    escribirJSON(join(dir, 'indice.json'), resumen);
    indice.hallazgos.tablasTexto = { cantidad: tablasTexto.length, resumen: resumen.map((r) => ({ cantidad: r.cantidad, offset: r.offsetTabla })) };
    console.log(`  · tablas de texto: ${tablasTexto.length} (la mayor de ${tablasTexto[0].n} entradas)`);
  }

  /* textos y diálogos */
  const cadenasGBA = GBA.buscarCadenasGBA(data, 12);
  if (cadenasGBA.length) {
    const dir = asegurar(join(salida, 'dialogos'));
    escribirJSON(join(dir, 'textos.json'), { total: cadenasGBA.length, textos: cadenasGBA });
    escribir(join(dir, 'dialogos.txt'), cadenasGBA.map((c) => `; 0x${c.offset.toString(16)}\n${c.texto}`).join('\n\n'));
    indice.hallazgos.textos = cadenasGBA.length;
    console.log(`  · textos/diálogos: ${cadenasGBA.length} cadenas`);
  }

  /* censo de bloques comprimidos → material de mapas y tiles */
  const censo = GBA.censoComprimidos(data);
  if (censo.length) {
    const dir = asegurar(join(salida, 'tiles'));
    escribirJSON(join(dir, 'censo_comprimidos.json'), { total: censo.length, bloques: censo });
    // una muestra de bloques con pinta de tileset se exporta como PNG
    const candidatos = censo.filter((b) => b.tam % 32 === 0 && b.tam >= 64 && b.tam <= 0x4000).slice(0, 60);
    const dirTiles = asegurar(join(dir, 'muestra'));
    const exportados = [];
    candidatos.forEach((b, i) => {
      const r = GBA.descomprimirEn(data, b.offset);
      if (!r) return;
      const tiles = Math.floor(r.tam / 32);
      const columnas = Math.min(16, tiles);
      const filas = Math.ceil(tiles / columnas);
      const img = GBA.tiles4bpp(r.datos, columnas, filas);
      const archivo = join(dirTiles, `tiles_${String(i).padStart(3, '0')}_0x${b.offset.toString(16)}.png`);
      escribir(archivo, pngIndizado(img.w, img.h, img.px, PALETA_VACIA));
      exportados.push({ offset: b.offset, tipo: b.tipo, tam: r.tam, tiles, archivo: archivo.replace(salida, '').replace(/^\//, '') });
    });
    escribirJSON(join(dirTiles, 'indice.json'), exportados);
    indice.hallazgos.tilesExportados = exportados.length;
    const porTamano = new Map();
    for (const b of censo) porTamano.set(b.tam, (porTamano.get(b.tam) || 0) + 1);
    escribirJSON(join(dir, 'tamanos.json'), [...porTamano.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40));
    indice.hallazgos.bloquesComprimidos = censo.length;
    console.log(`  · bloques comprimidos: ${censo.length} (${censo.filter((b) => b.tipo === 'lz77').length} LZ77, ${censo.filter((b) => b.tipo === 'rle').length} RLE)`);
  }

  return indice;
}

/* ───────────────────────────────────── GB ─────────────────────────────── */

function forenseGB(data, salida, nombre) {
  const cabecera = GB.leerCabeceraGB(data);
  escribirJSON(join(salida, '00_cabecera.json'), cabecera);
  console.log(`  · cabecera: ${cabecera.titulo} (${cabecera.plataforma}, ${(data.length / 1048576).toFixed(1)} MB)`);
  const indice = { juego: nombre, plataforma: cabecera.plataforma, cabecera, hallazgos: {} };

  /* nombres de especie */
  const t = GB.buscarTablaNombresGB(data, 20);
  if (t) {
    escribirJSON(join(asegurar(join(salida, 'pokemon')), 'nombres.json'), {
      offsetTabla: t.base,
      cantidad: t.nombres.length,
      nombres: t.nombres,
      otrasCandidatas: t.candidatos,
    });
    indice.hallazgos.nombresEspecie = { offset: t.base, cantidad: t.nombres.length };
    console.log(`  · nombres de especie: ${t.nombres.length} (tabla 0x${t.base.toString(16)}) → ${t.nombres.slice(0, 6).map((n) => n.nombre).join(', ')}`);
  }

  /* sprites: se recorre la ROM buscando flujos válidos que encadenen */
  const dirSprites = asegurar(join(salida, 'sprites'));
  const buenos = new Map();
  for (let o = 0; o + 1 < data.length; o++) {
    const b = data[o];
    if (((b >> 4) & 0xf) < 1 || ((b >> 4) & 0xf) > 8 || (b & 0xf) < 1 || (b & 0xf) > 8) continue;
    const r = GB.descomprimirSprite(data, o, { variante: 'bandera' });
    if (!r) continue;
    if (pareceSprite(metricasSprite(r))) buenos.set(o, r);
  }
  const vistos = new Set();
  const cadenas = [];
  const ordenados = Array.from(buenos.keys()).sort((a, b) => a - b);
  for (const o of ordenados) {
    if (vistos.has(o)) continue;
    const cadena = [];
    let actual = o;
    while (buenos.has(actual) && !vistos.has(actual)) {
      vistos.add(actual);
      cadena.push({ offset: actual, sprite: buenos.get(actual) });
      actual += buenos.get(actual).consumido;
    }
    if (cadena.length >= 3) cadenas.push(cadena);
  }
  cadenas.sort((a, b) => b.length - a.length);
  const totalSprites = cadenas.reduce((n, c) => n + c.length, 0);
  const listado = [];
  cadenas.forEach((cadena, ci) => {
    const carpeta = asegurar(join(dirSprites, `cadena_${String(ci).padStart(2, '0')}_${cadena[0].sprite.ancho}x${cadena[0].sprite.alto}`));
    cadena.forEach(({ offset, sprite }, i) => {
      const archivo = join(carpeta, `${String(i).padStart(3, '0')}_0x${offset.toString(16)}.png`);
      escribir(archivo, pngIndizado(sprite.ancho, sprite.alto, sprite.px, PALETA_GRIS));
      listado.push({ cadena: ci, indice: i, offset, tamano: `${sprite.ancho}x${sprite.alto}`, bytes: sprite.consumido, modo: sprite.modo, archivo: archivo.replace(salida, '').replace(/^\//, '') });
    });
  });
  escribirJSON(join(dirSprites, 'indice.json'), { cadenas: cadenas.length, total: totalSprites, sprites: listado });
  indice.hallazgos.sprites = { cadenas: cadenas.length, total: totalSprites };
  console.log(`  · sprites: ${totalSprites} en ${cadenas.length} cadenas contiguas`);

  /* textos y diálogos */
  const cadenasTexto = GB.buscarCadenasGB(data, 12);
  if (cadenasTexto.length) {
    const dir = asegurar(join(salida, 'dialogos'));
    escribirJSON(join(dir, 'textos.json'), { total: cadenasTexto.length, textos: cadenasTexto });
    escribir(join(dir, 'dialogos.txt'), cadenasTexto.map((c) => `; 0x${c.offset.toString(16)}\n${c.texto}`).join('\n\n'));
    indice.hallazgos.textos = cadenasTexto.length;
    console.log(`  · textos/diálogos: ${cadenasTexto.length} cadenas`);
  }
  return indice;
}

/* ────────────────────────────────── programa ──────────────────────────── */

const roms = ROM_ARG ? [ROM_ARG] : existsSync(ROMS_DIR)
  ? readdirSync(ROMS_DIR).filter((f) => /\.(gba|gb|gbc)$/i.test(f)).map((f) => join(ROMS_DIR, f))
  : [];

if (!roms.length) {
  console.log(`No hay ROMs en ${ROMS_DIR}. Deja ahí los archivos .gba/.gb/.gbc.`);
  process.exit(0);
}

const resumenGeneral = [];
for (const ruta of roms) {
  const nombre = basename(ruta);
  const slug = slugDe(nombre);
  const salida = asegurar(join(ROMS_DIR, slug));
  console.log(`\n═══ ${nombre} ═══`);
  const data = readFileSync(ruta);
  const esGBA = /\.gba$/i.test(nombre);
  const indice = esGBA ? forenseGBA(data, salida, nombre) : forenseGB(data, salida, nombre);
  indice.rom = nombre;
  indice.slug = slug;
  escribirJSON(join(salida, '01_indice.json'), indice);
  resumenGeneral.push({ rom: nombre, slug, plataforma: indice.plataforma, hallazgos: indice.hallazgos });
}

escribirJSON(join(ROMS_DIR, '00_resumen.json'), { generado: new Date().toISOString(), roms: resumenGeneral });
console.log(`\n✔ Extracción forense terminada: ${resumenGeneral.length} ROM(s). Resumen en "roms pokemon/00_resumen.json"`);
