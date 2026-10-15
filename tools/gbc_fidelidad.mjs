#!/usr/bin/env node
/**
 * gbc_fidelidad.mjs — Fija la restricción de fidelidad de la dimensión creepypasta:
 * **donde la GBC sólo permitía 4 colores por sprite, el juego moderno no añade
 * degradados**.
 *
 * La referencia es la máquina, no el gusto: la Game Boy Color dibuja sprites de
 * 2 bpp contra una paleta de cuatro tonos (3 opacos + transparente en objetos) y
 * una máscara de **un bit** por píxel. De ahí salen las tres reglas que se
 * comprueban aquí, tal y como quedan fijadas en
 * `content/dimensional_nightmare_visual_contract.json` → `fidelidad`:
 *
 *   1. **Cuatro tonos planos.** Todo píxel visible es exactamente uno de los cuatro
 *      verdes del contrato. Cualquier otro color sólo puede haber entrado por
 *      interpolación (mezcla, antialiasing, escalado con suavizado): es un degradado.
 *   2. **Máscara de un bit.** El canal alfa sólo puede valer 0 (transparente) o 255
 *      (opaco). Un borde semitransparente es un degradado en la máscara.
 *   3. **Cuatro tonos por sprite.** Ninguna celda de la microcuadrícula del contrato
 *      (16×16 px, `visualMicroGridPx`) usa más tonos que los cuatro permitidos.
 *
 * Alcance: el arte de la dimensión que emula esa máquina, es decir los PNG
 * `Graphics/**\/DN_*.png` (tilesets, autotiles, personajes, objetos, entrenadores,
 * batallas y escenarios) más el traje creep `Graphics/Characters/ash_outfit_creep.png`.
 * El resto del juego es GBA/RMXP y no le aplica este techo.
 *
 * Uso:
 *   node tools/gbc_fidelidad.mjs             # mide y escribe el informe
 *   node tools/gbc_fidelidad.mjs --fix       # corrige lo que tenga degradados y reescribe el informe
 *   node tools/gbc_fidelidad.mjs --verify    # recalcula y compara con el informe guardado
 *   node tools/gbc_fidelidad.mjs --selftest  # comprobaciones sintéticas
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { leerPng, pngRGBA } from "./forense/png.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(AQUI, "..");
const CONTRATO = path.join(ROOT, "content", "dimensional_nightmare_visual_contract.json");
const INFORME = path.join(ROOT, "content", "gbc_fidelidad.json");
const DOC = path.join(ROOT, "docs", "qa", "gbc_fidelidad.md");
const GRAFICOS = path.join(ROOT, "pokemon_fire_ash", "Graphics");
const ESPEJOS = [
  { etiqueta: "paquete QA de Dimensional Nightmare", carpeta: path.join(ROOT, "Scripts_corregido", "Dimensional_Nightmare_QA", "Graphics"), comando: "npm run build:dn:qa" },
  { etiqueta: "paquete directo", carpeta: path.join(ROOT, "Scripts_corregido", "Paquete_directo", "Graphics"), comando: "npm run sync:paquete && npm run build:corregido:zip" },
];
const TRAJE_CREEP = path.join("Characters", "ash_outfit_creep.png");

const args = process.argv.slice(2);
const VERIFY_ONLY = args.includes("--verify");
const FIX = args.includes("--fix");
const SELFTEST = args.includes("--selftest");
/** Sólo actúa como programa cuando es el punto de entrada (otros tools lo importan). */
const esEntrada = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

const sha1 = (b) => crypto.createHash("sha1").update(b).digest("hex").slice(0, 12);
const hexDe = (r, g, b) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
const rgbDeHex = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));

/* ─────────────────────────────── la regla ────────────────────────────────── */

/** Lee la restricción fijada en el contrato visual de la dimensión. */
export function reglas() {
  if (!fs.existsSync(CONTRATO)) throw new Error(`falta ${path.relative(ROOT, CONTRATO)}`);
  const contrato = JSON.parse(fs.readFileSync(CONTRATO, "utf8"));
  const fidelidad = contrato.fidelidad;
  if (!fidelidad) throw new Error("el contrato visual no fija la restricción de fidelidad (clave `fidelidad`)");
  const colores = (fidelidad.colores ?? contrato.palette ?? []).map((hex) => hex.toLowerCase());
  if (!colores.length) throw new Error("el contrato no declara los colores permitidos");
  return {
    colores,
    conjunto: new Set(colores),
    rgb: new Map(colores.map((hex) => [hex, rgbDeHex(hex)])),
    maxColoresPorSprite: fidelidad.maxColoresPorSprite ?? colores.length,
    celdaPx: fidelidad.celdaPx ?? contrato.visualMicroGridPx ?? 16,
    umbralAlfa: fidelidad.umbralAlfa ?? 128,
    maquina: fidelidad.maquinaDeReferencia ?? "Game Boy Color",
    contrato: path.relative(ROOT, CONTRATO).split(path.sep).join("/"),
  };
}

/** Tono permitido más cercano en RGB (empate → el más oscuro, como el índice 0 de la GBC). */
export function tonoMasCercano(r, g, b, r0 = reglas()) {
  let mejor = null;
  let mejorDistancia = Infinity;
  for (const hex of r0.colores) {
    const [cr, cg, cb] = r0.rgb.get(hex);
    const distancia = (cr - r) ** 2 + (cg - g) ** 2 + (cb - b) ** 2;
    if (distancia < mejorDistancia) { mejorDistancia = distancia; mejor = [cr, cg, cb]; }
  }
  return mejor;
}

/** ¿Este PNG entra en el alcance de la restricción? (ruta relativa a Graphics/) */
export function esObjetivo(relativo) {
  const rel = relativo.split(path.sep).join("/");
  if (rel === TRAJE_CREEP.split(path.sep).join("/")) return true;
  return /(?:^|\/)DN_[^/]+\.png$/i.test(rel);
}

/** Categoría legible de un archivo del alcance, por su carpeta. */
export function categoriaDe(relativo) {
  const partes = relativo.split(path.sep).join("/").split("/");
  const carpeta = partes.length > 1 ? partes[0] : "";
  const mapa = {
    Characters: "personajes",
    Tilesets: "tilesets",
    Autotiles: "autotiles",
    Items: "objetos",
    Trainers: "entrenadores",
    Pokemon: "batallas",
    Pictures: "escenarios",
  };
  return mapa[carpeta] ?? (carpeta ? carpeta.toLowerCase() : "raíz");
}

/* ─────────────────────────────── medición ───────────────────────────────── */

/**
 * Mide un PNG contra la regla: tonos usados, píxeles fuera de paleta (degradado),
 * alfa parcial (borde suave) y el peor caso por sprite de la microcuadrícula.
 */
export function medirPng(datos, r0 = reglas()) {
  const img = leerPng(datos);
  const colores = new Set();
  const alfas = new Set();
  const celdas = new Map();
  const muestra = [];
  let pixeles = 0;
  let fueraPaleta = 0;
  let alfaParcial = 0;
  for (let y = 0; y < img.alto; y++) {
    for (let x = 0; x < img.ancho; x++) {
      const i = (y * img.ancho + x) * 4;
      const alfa = img.rgba[i + 3];
      if (!alfa) continue;
      pixeles += 1;
      alfas.add(alfa);
      if (alfa !== 255) alfaParcial += 1;
      const hex = hexDe(img.rgba[i], img.rgba[i + 1], img.rgba[i + 2]);
      colores.add(hex);
      const enPaleta = r0.conjunto.has(hex);
      if (!enPaleta) {
        fueraPaleta += 1;
        if (muestra.length < 6 && !muestra.includes(hex)) muestra.push(hex);
      }
      const clave = `${Math.floor(x / r0.celdaPx)},${Math.floor(y / r0.celdaPx)}`;
      let celda = celdas.get(clave);
      if (!celda) { celda = { colores: new Set(), fuera: new Set() }; celdas.set(clave, celda); }
      celda.colores.add(hex);
      if (!enPaleta) celda.fuera.add(hex);
    }
  }
  const valores = [...celdas.values()];
  return {
    ancho: img.ancho,
    alto: img.alto,
    pixeles,
    colores: [...colores].sort(),
    coloresDistintos: colores.size,
    fueraPaleta,
    alfaParcial,
    alfaDistintos: alfas.size,
    alfaFueraDeMascara: [...alfas].filter((a) => a !== 255).length,
    celdas: valores.length,
    celdaMaxColores: valores.reduce((max, c) => Math.max(max, c.colores.size), 0),
    celdaMaxFuera: valores.reduce((max, c) => Math.max(max, c.fuera.size), 0),
    celdasConFuera: valores.filter((c) => c.fuera.size).length,
    muestra,
  };
}

/** Motivos por los que un archivo incumple la restricción (vacío = fiel). */
export function faltasDe(medida, r0 = reglas()) {
  const motivos = [];
  if (medida.fueraPaleta) {
    const tonos = medida.colores.filter((c) => !r0.conjunto.has(c)).length;
    motivos.push(`${medida.fueraPaleta} píxeles en ${tonos} tonos que no son de la paleta (degradado de tono)`);
  }
  if (medida.alfaParcial) motivos.push(`${medida.alfaParcial} píxeles con alfa parcial (máscara suave)`);
  if (medida.celdaMaxColores > r0.maxColoresPorSprite) motivos.push(`una microcelda usa ${medida.celdaMaxColores} tonos (máximo ${r0.maxColoresPorSprite})`);
  return motivos;
}

/* ─────────────────────────────── corrección ─────────────────────────────── */

/**
 * Devuelve el PNG normalizado: cada píxel visible pasa a ser uno de los cuatro
 * tonos y el alfa colapsa a 0/255 (máscara de un bit). Es la operación que
 * convierte arte «moderno» (antialiasing, escalado) en arte de máquina.
 */
export function normalizarPng(datos, r0 = reglas(), { umbralAlfa = r0.umbralAlfa } = {}) {
  const img = leerPng(datos);
  const rgba = Uint8Array.from(img.rgba);
  let tonos = 0;
  let alfa = 0;
  let apagados = 0;
  let opacos = 0;
  for (let i = 0; i < rgba.length; i += 4) {
    const original = rgba[i + 3];
    if (!original) continue;
    const duro = original >= umbralAlfa ? 255 : 0;
    if (duro !== original) {
      alfa += 1;
      if (!duro) apagados += 1;
    }
    rgba[i + 3] = duro;
    if (!duro) continue;
    opacos += 1;
    const hex = hexDe(rgba[i], rgba[i + 1], rgba[i + 2]);
    if (r0.conjunto.has(hex)) continue;
    const [nr, ng, nb] = tonoMasCercano(rgba[i], rgba[i + 1], rgba[i + 2], r0);
    rgba[i] = nr; rgba[i + 1] = ng; rgba[i + 2] = nb;
    tonos += 1;
  }
  return { png: pngRGBA(img.ancho, img.alto, rgba), tonos, alfa, apagados, opacos, ancho: img.ancho, alto: img.alto };
}

/* ─────────────────────────────── alcance ────────────────────────────────── */

function recorrer(dir, base = GRAFICOS) {
  const archivos = [];
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const completo = path.join(dir, entrada.name);
    if (entrada.isDirectory()) archivos.push(...recorrer(completo, base));
    else if (entrada.isFile() && entrada.name.toLowerCase().endsWith(".png")) {
      const rel = path.relative(base, completo);
      if (esObjetivo(rel)) archivos.push({ rel: rel.split(path.sep).join("/"), abs: completo, categoria: categoriaDe(rel) });
    }
  }
  return archivos;
}

/** Todos los PNG sujetos a la restricción, ordenados por ruta. */
export function archivosObjetivo(raiz = GRAFICOS) {
  if (!fs.existsSync(raiz)) throw new Error(`falta ${raiz}`);
  return recorrer(raiz).sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0));
}

/* ─────────────────────────────── informe ────────────────────────────────── */

const CAMPOS = ["coloresDistintos", "fueraPaleta", "alfaParcial", "alfasDistintos", "celdaMaxColores", "celdaMaxFuera", "celdasConFuera", "pixeles"];

function visibles(medida) {
  return Object.fromEntries(CAMPOS.map((campo) => [campo, medida[campo]]));
}

/** Reparaciones ya registradas (el «antes» es histórico; el «después» se recalcula). */
function reparacionesPrevias() {
  if (!fs.existsSync(INFORME)) return [];
  try {
    return JSON.parse(fs.readFileSync(INFORME, "utf8")).reparaciones ?? [];
  } catch {
    return [];
  }
}

/** Las entregas (paquete QA y paquete directo) guardan su propia copia del arte. */
function espejos(archivos) {
  const shas = new Map(archivos.map((archivo) => [archivo.rel, sha1(fs.readFileSync(archivo.abs))]));
  return ESPEJOS.map(({ etiqueta, carpeta, comando }) => {
    const desfasados = [];
    let copias = 0;
    for (const archivo of archivos) {
      const copia = path.join(carpeta, archivo.rel);
      if (!fs.existsSync(copia)) continue;
      copias += 1;
      const shaCopia = sha1(fs.readFileSync(copia));
      if (shaCopia !== shas.get(archivo.rel)) desfasados.push({ archivo: archivo.rel, sha1Juego: shas.get(archivo.rel), sha1Copia: shaCopia });
    }
    return { etiqueta, carpeta: path.relative(ROOT, carpeta).split(path.sep).join("/"), copias, desfasados: desfasados.length, detalle: desfasados, comando };
  });
}

export function auditar() {
  const r0 = reglas();
  const archivos = archivosObjetivo();
  const medidas = archivos.map((archivo) => {
    const bytes = fs.readFileSync(archivo.abs);
    const medida = medirPng(bytes, r0);
    return { ...archivo, medida, sha1: sha1(bytes), faltas: faltasDe(medida, r0) };
  });
  const faltas = medidas.filter((m) => m.faltas.length);
  const porCategoria = [...new Set(medidas.map((m) => m.categoria))].sort().map((categoria) => {
    const delGrupo = medidas.filter((m) => m.categoria === categoria);
    const suma = (campo) => delGrupo.reduce((total, m) => total + m.medida[campo], 0);
    return {
      categoria,
      archivos: delGrupo.length,
      fieles: delGrupo.filter((m) => !m.faltas.length).length,
      pixeles: suma("pixeles"),
      fueraPaleta: suma("fueraPaleta"),
      alfaParcial: suma("alfaParcial"),
      maxColores: delGrupo.reduce((max, m) => Math.max(max, m.medida.coloresDistintos), 0),
      maxCelda: delGrupo.reduce((max, m) => Math.max(max, m.medida.celdaMaxColores), 0),
    };
  });
  const reparaciones = reparacionesPrevias().map((rep) => {
    const actual = medidas.find((m) => m.rel === rep.archivo);
    if (!actual) return { ...rep, ausente: true };
    return {
      archivo: rep.archivo,
      antes: rep.antes,
      despues: { ...visibles(actual.medida), sha1: actual.sha1 },
      tonosCorregidos: rep.tonosCorregidos,
      alfaCorregido: rep.alfaCorregido,
      apagados: rep.apagados ?? 0,
      siluetaConservada: rep.siluetaConservada ?? null,
    };
  });
  const espejosActuales = espejos(medidas);
  const avisos = [];
  for (const copia of espejosActuales) {
    if (copia.desfasados) {
      const cuantas = copia.desfasados === 1 ? "copia" : "copias";
      avisos.push(`el ${copia.etiqueta} conserva ${copia.desfasados} ${cuantas} con el arte anterior: renuévalo con \`${copia.comando}\``);
    }
  }
  const errores = [];
  if (faltas.length) {
    for (const falta of faltas.slice(0, 12)) errores.push(`${falta.rel}: ${falta.faltas.join("; ")}`);
    if (faltas.length > 12) errores.push(`…y ${faltas.length - 12} archivos más con degradados`);
  }
  return {
    generatedBy: "tools/gbc_fidelidad.mjs",
    maquina: r0.maquina,
    contrato: r0.contrato,
    regla: {
      coloresPorSprite: r0.maxColoresPorSprite,
      colores: r0.colores,
      celdaPx: r0.celdaPx,
      mascaraDeBits: 1,
      umbralAlfa: r0.umbralAlfa,
      prohibido: "tonos intermedios (antialiasing, mezcla, escalado suave) y alfa parcial",
    },
    alcance: {
      prefijos: ["Graphics/**/DN_*.png", "Graphics/Characters/ash_outfit_creep.png"],
      archivos: medidas.length,
      categorias: porCategoria.length,
      pixeles: medidas.reduce((total, m) => total + m.medida.pixeles, 0),
    },
    resumen: {
      archivos: medidas.length,
      fieles: medidas.length - faltas.length,
      conDegradados: faltas.length,
      pixelesFueraPaleta: medidas.reduce((total, m) => total + m.medida.fueraPaleta, 0),
      pixelesAlfaParcial: medidas.reduce((total, m) => total + m.medida.alfaParcial, 0),
      maxColores: medidas.reduce((max, m) => Math.max(max, m.medida.coloresDistintos), 0),
      maxCelda: medidas.reduce((max, m) => Math.max(max, m.medida.celdaMaxColores), 0),
      reparados: reparaciones.filter((rep) => !rep.ausente).length,
      peorSilueta: reparaciones.filter((rep) => rep.siluetaConservada !== null && rep.siluetaConservada !== undefined)
        .reduce((peor, rep) => Math.min(peor, rep.siluetaConservada), 1),
      avisos: avisos.length,
      errores: errores.length,
    },
    porCategoria,
    faltas: faltas.map((falta) => ({ archivo: falta.rel, categoria: falta.categoria, ...visibles(falta.medida), muestra: falta.medida.muestra, motivos: falta.faltas })),
    reparaciones,
    espejos: espejosActuales,
    errores,
    avisos,
  };
}

/* ─────────────────────────────── informe MD ─────────────────────────────── */

export function documento(informe) {
  const n = (v) => v.toLocaleString("es-ES");
  const filas = informe.porCategoria.map((c) => `| ${c.categoria} | ${c.archivos} | ${c.fieles} | ${c.maxColores} | ${c.maxCelda} | ${n(c.pixeles)} |`);
  const faltas = informe.faltas.length
    ? informe.faltas.map((f) => `| \`${f.archivo}\` | ${f.coloresDistintos} | ${f.fueraPaleta} | ${f.alfaParcial} | ${f.celdaMaxFuera} | ${f.motivos.join("; ")} |`)
    : ["| — | — | — | — | — | sin incumplimientos |"];
  const reparaciones = informe.reparaciones.length
    ? informe.reparaciones.map((r) => `| \`${r.archivo}\` | ${r.antes.coloresDistintos} | ${r.antes.fueraPaleta} | ${r.antes.alfaParcial} | ${r.despues.coloresDistintos} | ${r.despues.fueraPaleta} | ${r.despues.alfaParcial} | ${r.siluetaConservada ?? "—"} | ${r.despues.sha1} |`)
    : ["| — | — | — | — | — | — | — | — | — |"];
  return `# Fidelidad Game Boy: donde la GBC sólo permitía 4 colores, sin degradados

> Generado por \`node tools/gbc_fidelidad.mjs\` (comprobar sin reescribir:
> \`npm run verify:gbc:fidelidad\`). **No se edita a mano.**

La dimensión creepypasta emula una máquina concreta: la **${informe.maquina}**, que dibuja
sprites de **2 bpp** contra una paleta de **cuatro tonos** y una **máscara de un bit** por
píxel. La restricción queda fijada en \`${informe.contrato}\` → \`fidelidad\` y se traduce en
tres comprobaciones sobre el arte entregado:

1. **Cuatro tonos planos**: todo píxel visible es exactamente uno de
   ${informe.regla.colores.map((c) => `\`${c}\``).join(" · ")}. Cualquier otro color sólo puede
   haber entrado por interpolación (mezcla, antialiasing, escalado suave) → **degradado**.
2. **Máscara de un bit**: el alfa sólo vale 0 o 255; los bordes semitransparentes son
   degradados de la máscara.
3. **Cuatro tonos por sprite**: ninguna celda de ${informe.regla.celdaPx}×${informe.regla.celdaPx} px
   (la microcuadrícula del contrato) usa más tonos que los permitidos.

Alcance: ${informe.alcance.archivos} PNG del arte de la dimensión
(\`${informe.alcance.prefijos.join("\`, \`")}\`), ${n(informe.alcance.pixeles)} píxeles visibles.
El resto del juego es GBA/RMXP y no le aplica este techo.

## Resumen

| Archivo | Fieles | Con degradados | Píxeles fuera de paleta | Píxeles con alfa parcial | Máx. tonos | Máx. tonos por sprite |
|---|---|---|---|---|---|---|
| ${informe.alcance.archivos} PNG de la dimensión | ${informe.resumen.fieles} | ${informe.resumen.conDegradados} | ${n(informe.resumen.pixelesFueraPaleta)} | ${n(informe.resumen.pixelesAlfaParcial)} | ${informe.resumen.maxColores} | ${informe.resumen.maxCelda} |

${informe.resumen.conDegradados === 0
    ? `**${informe.alcance.archivos} de ${informe.alcance.archivos} archivos son fieles**: ningún sprite añade un tono
ni un borde que la máquina no pudiera dibujar.${informe.resumen.reparados ? ` Los ${informe.resumen.reparados} que sí lo hacían quedaron corregidos y constan abajo (la silueta se conserva: peor intersección sobre unión ${informe.resumen.peorSilueta}).` : ""}`
    : `**${informe.resumen.conDegradados} archivos incumplen la restricción.** Corrígelos con
\`npm run fix:gbc:fidelidad\` (cuantiza al tono más cercano y colapsa el alfa a 0/255).`}

## Por categoría

| Categoría | Archivos | Fieles | Máx. tonos | Máx. tonos por sprite | Píxeles |
|---|---|---|---|---|---|
${filas.join("\n")}

## Incumplimientos medidos

| Archivo | Tonos | Fuera de paleta | Alfa parcial | Fuera por sprite | Motivos |
|---|---|---|---|---|---|
${faltas.join("\n")}

## Reparaciones registradas

El «antes» es lo que había en el repositorio; el «después» se recalcula en cada pasada
(y lo comprueba \`--verify\` contra el sha1 del archivo).

| Archivo | Tonos antes | Fuera antes | Alfa parcial antes | Tonos ahora | Fuera ahora | Alfa parcial ahora | Silueta conservada | sha1 |
|---|---|---|---|---|---|---|---|---|
${reparaciones.join("\n")}

${informe.avisos.length ? `## Avisos\n\n${informe.avisos.map((a) => `- ${a}`).join("\n")}\n\n` : ""}## Cómo se reproduce

\`\`\`bash
npm run audit:gbc:fidelidad    # mide el arte de la dimensión y reescribe este informe
npm run fix:gbc:fidelidad      # corrige los degradados añadidos y reescribe el informe
npm run verify:gbc:fidelidad   # recalcula y comprueba que nada añadió degradados
npm run selftest:gbc:fidelidad # comprobaciones sintéticas de la regla
\`\`\`
`;
}

/* ─────────────────────────────── verificación ───────────────────────────── */

export function verificar(informeNuevo) {
  if (!fs.existsSync(INFORME)) throw new Error("Falta content/gbc_fidelidad.json: ejecútalo sin --verify");
  const previo = JSON.parse(fs.readFileSync(INFORME, "utf8"));
  const problemas = [];
  for (const campo of ["archivos", "fieles", "conDegradados", "pixelesFueraPaleta", "pixelesAlfaParcial", "maxColores", "maxCelda", "peorSilueta"]) {
    if (previo.resumen?.[campo] !== informeNuevo.resumen[campo]) {
      problemas.push(`resumen.${campo}: informe ${JSON.stringify(previo.resumen?.[campo])} ≠ medido ${JSON.stringify(informeNuevo.resumen[campo])}`);
    }
  }
  if (JSON.stringify(previo.porCategoria) !== JSON.stringify(informeNuevo.porCategoria)) problemas.push("el reparto por categoría cambió");
  const faltasPrevias = (previo.faltas ?? []).map((f) => f.archivo).sort();
  const faltasAhora = informeNuevo.faltas.map((f) => f.archivo).sort();
  if (JSON.stringify(faltasPrevias) !== JSON.stringify(faltasAhora)) problemas.push(`los archivos con degradados cambiaron (${faltasPrevias.join(", ") || "ninguno"} → ${faltasAhora.join(", ") || "ninguno"})`);
  for (const rep of previo.reparaciones ?? []) {
    const ahora = informeNuevo.reparaciones.find((r) => r.archivo === rep.archivo);
    if (!ahora) { problemas.push(`${rep.archivo}: la reparación registrada desapareció del alcance`); continue; }
    if (ahora.despues?.sha1 !== rep.despues?.sha1) problemas.push(`${rep.archivo}: el archivo cambió después de la reparación (sha1 ${ahora.despues?.sha1} ≠ ${rep.despues?.sha1})`);
    if (JSON.stringify(ahora.despues) !== JSON.stringify(rep.despues)) problemas.push(`${rep.archivo}: las medidas posteriores a la reparación no se reproducen`);
  }
  if (previo.regla?.coloresPorSprite !== informeNuevo.regla.coloresPorSprite) problemas.push("la regla de colores por sprite cambió");
  if (JSON.stringify(previo.regla?.colores) !== JSON.stringify(informeNuevo.regla.colores)) problemas.push("la paleta del contrato cambió");
  if (fs.existsSync(DOC)) {
    const doc = fs.readFileSync(DOC, "utf8");
    for (const marca of ["# Fidelidad Game Boy", "## Incumplimientos medidos", "## Reparaciones registradas", informeNuevo.regla.colores[0]]) {
      if (!doc.includes(marca)) problemas.push(`docs/qa/gbc_fidelidad.md no contiene «${marca}»`);
    }
  } else problemas.push("falta docs/qa/gbc_fidelidad.md");
  return problemas;
}

/* ───────────────────────────── corrección en disco ──────────────────────── */

/** Intersección sobre unión de las siluetas (alfa > 0) antes y después de corregir. */
function siluetaConservada(bytes, corregido) {
  const antes = leerPng(bytes);
  const despues = leerPng(corregido);
  let interseccion = 0;
  let union = 0;
  for (let i = 3; i < antes.rgba.length; i += 4) {
    const a = antes.rgba[i] > 0;
    const b = despues.rgba[i] > 0;
    if (a && b) interseccion += 1;
    if (a || b) union += 1;
  }
  return union ? Number((interseccion / union).toFixed(4)) : 1;
}

function corregir() {
  const r0 = reglas();
  const cambios = [];
  for (const archivo of archivosObjetivo()) {
    const bytes = fs.readFileSync(archivo.abs);
    const antes = medirPng(bytes, r0);
    if (!faltasDe(antes, r0).length) continue;
    const normalizado = normalizarPng(bytes, r0);
    fs.writeFileSync(archivo.abs, normalizado.png);
    const despues = medirPng(normalizado.png, r0);
    cambios.push({
      archivo: archivo.rel,
      antes: { ...visibles(antes), colores: antes.colores, muestra: antes.muestra },
      tonosCorregidos: normalizado.tonos,
      alfaCorregido: normalizado.alfa,
      apagados: normalizado.apagados,
      siluetaConservada: siluetaConservada(bytes, normalizado.png),
      despues: visibles(despues),
    });
  }
  return cambios;
}

/** Fusiona las reparaciones recién hechas con las ya registradas (sin perder el «antes»). */
function registrarReparaciones(cambios) {
  const previas = reparacionesPrevias();
  const porArchivo = new Map(previas.map((rep) => [rep.archivo, rep]));
  for (const cambio of cambios) {
    const existente = porArchivo.get(cambio.archivo);
    porArchivo.set(cambio.archivo, {
      archivo: cambio.archivo,
      antes: existente?.antes ?? cambio.antes,
      tonosCorregidos: (existente?.tonosCorregidos ?? 0) + cambio.tonosCorregidos,
      alfaCorregido: (existente?.alfaCorregido ?? 0) + cambio.alfaCorregido,
      apagados: (existente?.apagados ?? 0) + cambio.apagados,
      siluetaConservada: Math.min(existente?.siluetaConservada ?? 1, cambio.siluetaConservada),
    });
  }
  if (!fs.existsSync(INFORME)) return cambios.length;
  const informe = JSON.parse(fs.readFileSync(INFORME, "utf8"));
  informe.reparaciones = [...porArchivo.values()];
  fs.writeFileSync(INFORME, `${JSON.stringify(informe, null, 1)}\n`);
  return cambios.length;
}

/* ───────────────────────────── autocomprobación ─────────────────────────── */

function pngDe(ancho, alto, pintar) {
  const rgba = new Uint8Array(ancho * alto * 4);
  pintar((x, y, [r, g, b, a = 255]) => {
    const i = (y * ancho + x) * 4;
    rgba[i] = r; rgba[i + 1] = g; rgba[i + 2] = b; rgba[i + 3] = a;
  });
  return pngRGBA(ancho, alto, rgba);
}

function selftest() {
  let ok = 0;
  const afirma = (cond, mensaje) => { if (!cond) throw new Error(`selftest: ${mensaje}`); ok += 1; };
  const r0 = reglas();
  const verde = r0.rgb.get(r0.colores[2]);

  // Alcance.
  afirma(esObjetivo("Tilesets/DN_2041.png") && esObjetivo("Items/DN_MEDAL_WHT.png"), "los PNG DN_ entran en el alcance");
  afirma(esObjetivo(path.join("Characters", "ash_outfit_creep.png")) && !esObjetivo("Characters/ARCEUS.png"), "el traje creep entra y un personaje normal no");
  afirma(categoriaDe("Items/DN_MEDAL_WHT.png") === "objetos" && categoriaDe("Characters/DN_KINGGUS.png") === "personajes", "las categorías salen de la carpeta");

  // Fiel: cuatro tonos planos y máscara dura.
  const fiel = pngDe(32, 32, (px) => {
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      if (x === 0) continue;
      px(x, y, r0.rgb.get(r0.colores[((x >> 2) + (y >> 2)) & 3]));
    }
  });
  const medida = medirPng(fiel, r0);
  afirma(medida.fueraPaleta === 0 && medida.alfaParcial === 0 && medida.coloresDistintos === 4, "un sprite de cuatro tonos planos es fiel");
  afirma(!faltasDe(medida, r0).length, "el sprite fiel no acumula motivos");
  afirma(medida.celdaMaxColores === 4 && medida.celdas === 4, "cada microcelda de 16×16 se mide por separado");

  // Degradado: un tono intermedio (mezcla) rompe la regla.
  const degradado = pngDe(16, 16, (px) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, x < 8 ? verde : [verde[0] + 3, verde[1] + 3, verde[2] + 3]);
  });
  const medidaGrad = medirPng(degradado, r0);
  afirma(medidaGrad.fueraPaleta === 128 && medidaGrad.coloresDistintos === 2, "los píxeles interpolados cuentan como degradado");
  afirma(faltasDe(medidaGrad, r0).some((m) => m.includes("no son de la paleta")), "el motivo del degradado de tono es explícito");

  // Degradado de máscara: alfa parcial.
  const suave = pngDe(16, 16, (px) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, [...verde, x < 8 ? 255 : 96]);
  });
  const medidaSuave = medirPng(suave, r0);
  afirma(medidaSuave.alfaParcial === 128 && medidaSuave.alfaDistintos === 2, "el borde semitransparente cuenta como degradado de máscara");
  afirma(medidaSuave.fueraPaleta === 0 && faltasDe(medidaSuave, r0).some((m) => m.includes("alfa parcial")), "el tono se conserva y el motivo lo denuncia");

  // Corrección: la normalización deja el archivo fiel sin cambiar el tamaño.
  const arreglo = normalizarPng(degradado, r0, { umbralAlfa: r0.umbralAlfa });
  const medidaArreglo = medirPng(arreglo.png, r0);
  afirma(arreglo.tonos === 128 && medidaArreglo.fueraPaleta === 0, "la corrección lleva los tonos interpolados al tono permitido más cercano");
  afirma(medidaArreglo.ancho === 16 && medidaArreglo.alto === 16 && !faltasDe(medidaArreglo, r0).length, "el PNG corregido mantiene el tamaño y cumple la regla");
  const arregloSuave = normalizarPng(suave, r0);
  const medidaCorregida = medirPng(arregloSuave.png, r0);
  afirma(arregloSuave.alfa === 128 && arregloSuave.apagados === 128 && medidaCorregida.alfaParcial === 0, "la corrección colapsa el alfa a 0/255 y apaga lo que no llegaba a la mitad");
  afirma(medidaCorregida.pixeles === 128, "el sprite corregido conserva sólo los píxeles que la máscara mantiene");

  // El tono más cercano respeta la paleta del contrato.
  const cercano = tonoMasCercano(verde[0] + 4, verde[1] + 4, verde[2] + 4, r0);
  afirma(r0.conjunto.has(hexDe(...cercano)), "el tono más cercano siempre está en la paleta");
  afirma(r0.maxColoresPorSprite === 4 && r0.colores.length === 4, "la regla fijada es de cuatro tonos por sprite");
  afirma(r0.celdaPx > 0 && r0.umbralAlfa > 0, "el contrato fija la microcuadrícula y el umbral de la máscara");

  console.log(`OK: autocomprobación de la fidelidad GBC (${ok} comprobaciones)`);
}

/* ─────────────────────────────────── main ───────────────────────────────── */

if (!esEntrada) {
  // Importado desde otro tool (`dn_apply_medals`, `dn_apply_gameboy_palette`, tests).
} else if (SELFTEST) {
  selftest();
} else if (VERIFY_ONLY) {
  const informe = auditar();
  const problemas = verificar(informe);
  for (const p of problemas) console.error(`  FALLA: ${p}`);
  if (informe.errores.length) for (const e of informe.errores) console.error(`  FALLA: ${e}`);
  const fallos = problemas.length + informe.errores.length;
  console.log(`verificación de fidelidad GBC: ${informe.alcance.archivos} PNG de la dimensión · ${informe.resumen.fieles} fieles · ${informe.resumen.conDegradados} con degradados · ${fallos} fallos`);
  if (fallos) process.exit(1);
  console.log("  · ningún sprite añade tonos intermedios ni bordes suaves: cuatro tonos planos y máscara de un bit");
} else {
  const cambios = FIX ? corregir() : [];
  if (FIX) registrarReparaciones(cambios);
  const informe = auditar();
  fs.mkdirSync(path.dirname(DOC), { recursive: true });
  fs.writeFileSync(INFORME, `${JSON.stringify(informe, null, 1)}\n`);
  fs.writeFileSync(DOC, documento(informe));
  if (FIX) {
    console.log(`✅ Degradados corregidos: ${cambios.length} archivos (${cambios.reduce((t, c) => t + c.tonosCorregidos, 0)} píxeles de tono y ${cambios.reduce((t, c) => t + c.alfaCorregido, 0)} de alfa)`);
  }
  console.log(`✅ Fidelidad GBC: ${informe.alcance.archivos} PNG · ${informe.resumen.fieles} fieles · ${informe.resumen.conDegradados} con degradados → content/gbc_fidelidad.json + docs/qa/gbc_fidelidad.md`);
  if (informe.resumen.reparados) console.log(`  · ${informe.resumen.reparados} reparaciones registradas`);
  if (informe.avisos.length) for (const aviso of informe.avisos) console.log(`  · aviso: ${aviso}`);
  if (informe.errores.length) {
    for (const error of informe.errores) console.error(`  FALLA: ${error}`);
    process.exit(1);
  }
}
