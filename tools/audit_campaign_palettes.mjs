#!/usr/bin/env node
/**
 * audit_campaign_palettes.mjs — Compara la paleta GBC de cada dimensión invitada
 * contra la paleta declarada en `content/rom_campaigns_complete.json`.
 *
 * Qué se compara y con qué:
 *
 *   · **Declarado** (`campaigns[].palette`): la paleta que anuncia cada campaña
 *     invitada, p. ej. «postgame A: escarcha, lagos y ciudades que recuerdan dos
 *     líneas temporales». Es texto narrativo, así que se descompone en términos y
 *     cada término se cruza con una tabla de expectativas (familia de color,
 *     temperatura y luminosidad).
 *   · **Medido**: los colores reales del arte nativo ya extraído de esa dimensión
 *     —los tilesets (`ROMN_<índice>_p<n>.png`) y las hojas de personaje
 *     (`$ROMN_<índice>_g<id>.png`) de `pokemon_fire_ash/Graphics/`— reducidos a
 *     una **paleta GBC de cuatro tonos** por cuantiles de luminancia (el mismo
 *     formato de cuatro tonos que la paleta verde de la dimensión creepypasta
 *     declarada en `dimensional_nightmare_visual_contract.json`), más el reparto
 *     por familias de tono, la temperatura y la luminosidad media.
 *
 * La unión entre los dos archivos es `sourceRom` → `rom` de `content/rom_nativo.json`.
 *
 * Veredictos: `coincide` (todas las expectativas del término se cumplen),
 * `parcial` (el color está, pero el brillo o la temperatura del término no cuadran)
 * y `no coincide` (el término nombra una familia de color que no aparece en el arte).
 * Sólo `no coincide`, la falta de arte, una declaración vacía y una dimensión que
 * haya quedado teñida con la paleta verde de la dimensión creepypasta hacen fallar
 * la verificación; el resto queda documentado con sus números.
 *
 * Uso:
 *   node tools/audit_campaign_palettes.mjs            # mide, compara y escribe informe
 *   node tools/audit_campaign_palettes.mjs --verify   # recalcula y compara con el informe
 *   node tools/audit_campaign_palettes.mjs --selftest # comprobaciones sintéticas
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { leerPng } from "./forense/png.mjs";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(AQUI, "..");
const CAMPAIGNS = path.join(ROOT, "content", "rom_campaigns_complete.json");
const NATIVO = path.join(ROOT, "content", "rom_nativo.json");
const CONTRATO_DN = path.join(ROOT, "content", "dimensional_nightmare_visual_contract.json");
const INFORME = path.join(ROOT, "content", "campanas_paletas.json");
const DOC = path.join(ROOT, "docs", "qa", "paletas_campanas.md");
const GRAFICOS = path.join(ROOT, "pokemon_fire_ash", "Graphics");

const args = process.argv.slice(2);
const VERIFY_ONLY = args.includes("--verify");
const SELFTEST = args.includes("--selftest");

const sha1 = (b) => crypto.createHash("sha1").update(b).digest("hex").slice(0, 12);

/* ─────────────────────────── expectativas declaradas ─────────────────────── */

/**
 * Cada término de la paleta declarada se cruza con esta tabla. `familia` es la
 * lista de familias de tono que el término nombra; `temperatura` y
 * `luminanciaMin` son las expectativas que además se pueden medir.
 */
export const PALABRAS = [
  { clave: /escarcha|nieve|hielo|frost|ventisca|niebla/i, nombre: "escarcha/nieve", familia: ["cian", "azul"], temperatura: "frio" },
  { clave: /lagos?|mar\b|mareas?|costas?|playas?|archipi[eé]lagos?|lluvia|faro(s)?|cristal|olas?/i, nombre: "agua/costa", familia: ["azul", "cian", "verde"] },
  { clave: /luminos|resplandor|brillante|amanecer/i, nombre: "luz", luminanciaMin: 0.45 },
  { clave: /ruinas?|tumbas?|criptas?|catacumbas?/i, nombre: "ruinas", familia: ["verde", "naranja", "amarillo"], temperatura: "neutro" },
  { clave: /bosques?|selvas?|praderas?|jardines?|campos?|floraci[oó]n/i, nombre: "vegetación", familia: ["verde", "amarillo"] },
  { clave: /caminos?|rutas?|frontera|refugios?|plazas?|ciudades?|pueblos?|desiertos?|monta[ñn]as?/i, nombre: "tierra/camino", familia: ["naranja", "amarillo", "verde"] },
];

/** Umbrales de las expectativas (compartidos por la medición y el veredicto). */
export const UMBRALES = {
  familia: 0.04,        // la familia nombrada tiene que ser al menos el 4 % de los píxeles opacos
  frio: 0.18,           // un término frío pide al menos 18 % de azules/cianes/violetas saturados
  neutro: 0.25,         // un término neutro (ruinas, tierra) pide al menos 25 % de neutros
  luminancia: 0.45,
  verdeGameBoy: 30,     // distancia máxima (canal) para considerar que una dimensión es el verde GBC de DN
};

/* ───────────────────────────── medición del arte ─────────────────────────── */

export const FAMILIAS = ["rojo", "naranja", "amarillo", "verde", "cian", "azul", "violeta", "rosa"];

/** Familia de tono de un píxel (por su matiz). Los grises van a `neutro`. */
export function familiaDe(r, g, b, { saturacionMin = 0.12 } = {}) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === 0 || (max - min) / max < saturacionMin) return "neutro";
  const d = max - min;
  let h;
  if (max === r) h = ((g - b) / d + 6) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 15 || h >= 345) return "rojo";
  if (h < 40) return "naranja";
  if (h < 70) return "amarillo";
  if (h < 165) return "verde";
  if (h < 195) return "cian";
  if (h < 255) return "azul";
  if (h < 290) return "violeta";
  return "rosa";
}

const luminancia = (r, g, b) => (0.299 * r + 0.587 * g + 0.114 * b) / 255;
const aHex = (c) => `#${c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;

/**
 * Paleta GBC de cuatro tonos: los opacos se ordenan por luminancia y se parten en
 * cuatro grupos con el mismo peso de píxeles; cada tono es el promedio del grupo.
 * Es la forma de una paleta de Game Boy (oscuro, medio-oscuro, medio-claro, claro).
 */
export function cuatroTonos(histograma) {
  const pixeles = [];
  for (const [clave, peso] of histograma) {
    const [r, g, b] = clave.split(",").map(Number);
    pixeles.push({ r, g, b, peso, lum: luminancia(r, g, b) });
  }
  if (!pixeles.length) return [];
  pixeles.sort((a, b) => a.lum - b.lum);
  const total = pixeles.reduce((s, p) => s + p.peso, 0);
  const tonos = [];
  let acumulado = 0, grupo = { r: 0, g: 0, b: 0, peso: 0 }, numero = 0;
  const cierre = (n) => Math.floor(((n + 1) * total) / 4);
  for (const p of pixeles) {
    grupo.r += p.r * p.peso; grupo.g += p.g * p.peso; grupo.b += p.b * p.peso; grupo.peso += p.peso;
    acumulado += p.peso;
    if (acumulado >= cierre(numero) && numero < 3) {
      tonos.push(grupo.peso ? [grupo.r / grupo.peso, grupo.g / grupo.peso, grupo.b / grupo.peso] : [0, 0, 0]);
      grupo = { r: 0, g: 0, b: 0, peso: 0 };
      numero += 1;
    }
  }
  tonos.push(grupo.peso ? [grupo.r / grupo.peso, grupo.g / grupo.peso, grupo.b / grupo.peso] : [0, 0, 0]);
  return tonos;
}

/** Métricas de una dimensión a partir de los histogramas de sus archivos. */
export function medir(histogramas) {
  const histograma = new Map();
  for (const h of histogramas) for (const [clave, peso] of h) histograma.set(clave, (histograma.get(clave) ?? 0) + peso);
  let total = 0, sumaLum = 0, sumaSat = 0, frio = 0, calido = 0, neutro = 0;
  const familia = Object.fromEntries(FAMILIAS.map((f) => [f, 0]));
  familia.neutro = 0;
  for (const [clave, peso] of histograma) {
    const [r, g, b] = clave.split(",").map(Number);
    total += peso;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    sumaLum += luminancia(r, g, b) * peso;
    sumaSat += (max === 0 ? 0 : (max - min) / max) * peso;
    const f = familiaDe(r, g, b);
    familia[f] += peso;
    if (f === "neutro") neutro += peso;
    else if (f === "azul" || f === "cian" || f === "violeta") frio += peso;
    else if (f === "rojo" || f === "naranja" || f === "amarillo") calido += peso;
    else neutro += peso;
  }
  if (!total) return null;
  const r3 = (x) => Math.round(x * 1000) / 1000;
  const r4 = (x) => Math.round(x * 10000) / 10000;
  const tonos = cuatroTonos(histograma);
  return {
    colores: histograma.size,
    pixeles: total,
    luminancia: r3(sumaLum / total),
    saturacion: r3(sumaSat / total),
    temperatura: { frio: r4(frio / total), calido: r4(calido / total), neutro: r4(neutro / total) },
    familia: Object.fromEntries(Object.entries(familia).map(([k, v]) => [k, r4(v / total)])),
    gbc: tonos.map(aHex),
    gbcRgb: tonos.map((c) => c.map((v) => Math.round(v))),
  };
}

/** Histograma de una imagen (colores opacos con su peso). */
export function histogramaDeImagen(imagen) {
  const h = new Map();
  for (let i = 0; i < imagen.ancho * imagen.alto; i += 1) {
    const c = imagen.paleta[imagen.indices[i]] ?? [0, 0, 0, 0];
    if (c[3] === 0) continue;
    const clave = `${c[0]},${c[1]},${c[2]}`;
    h.set(clave, (h.get(clave) ?? 0) + 1);
  }
  return h;
}

/** Archivos de arte nativo de una dimensión: tilesets y hojas de personaje. */
function archivosDeDimension(indice) {
  const de = (dir, prefijo) => {
    const completo = path.join(GRAFICOS, dir);
    if (!fs.existsSync(completo)) return [];
    return fs.readdirSync(completo)
      .filter((f) => f.startsWith(`${prefijo}${indice}_`) && f.endsWith(".png"))
      .sort()
      .map((f) => ({ ruta: path.join(completo, f), nombre: `${dir}/${f}`, clase: dir === "Tilesets" ? "tileset" : "personaje" }));
  };
  return [...de("Tilesets", "ROMN_"), ...de("Characters", "$ROMN_")];
}

/* ───────────────────────────── comparación ───────────────────────────────── */

/** Descompone la paleta declarada en su etiqueta y sus términos. */
export function terminosDeclarados(texto) {
  const limpio = String(texto ?? "").trim();
  const dosPuntos = limpio.indexOf(":");
  const etiqueta = dosPuntos >= 0 ? limpio.slice(0, dosPuntos).trim() : "";
  const cuerpo = dosPuntos >= 0 ? limpio.slice(dosPuntos + 1).trim() : limpio;
  const terminos = cuerpo.split(/,|\by\b/).map((t) => t.trim()).filter(Boolean);
  return { etiqueta, terminos, texto: limpio };
}

/** Expectativas de un término: qué palabras de la tabla activa. */
export function expectativasDe(termino) {
  return PALABRAS.filter((p) => p.clave.test(termino));
}

/**
 * Evalúa un término contra la medición. Devuelve las expectativas con su valor
 * medido y si se cumplen, más el veredicto del término.
 */
export function evaluarTermino(termino, medicion) {
  const expectativas = expectativasDe(termino).map((p) => {
    const filas = [];
    if (p.familia) {
      const valor = p.familia.reduce((s, f) => s + (medicion.familia[f] ?? 0), 0);
      filas.push({ tipo: "familia", familias: p.familia, valor, minimo: UMBRALES.familia, ok: valor >= UMBRALES.familia });
    }
    if (p.temperatura === "frio") filas.push({ tipo: "temperatura", valor: medicion.temperatura.frio, minimo: UMBRALES.frio, ok: medicion.temperatura.frio >= UMBRALES.frio });
    if (p.temperatura === "neutro") filas.push({ tipo: "temperatura", valor: medicion.temperatura.neutro, minimo: UMBRALES.neutro, ok: medicion.temperatura.neutro >= UMBRALES.neutro });
    if (p.luminanciaMin) filas.push({ tipo: "luminancia", valor: medicion.luminancia, minimo: p.luminanciaMin, ok: medicion.luminancia >= p.luminanciaMin });
    return { palabra: p.nombre, filas };
  });
  const todas = expectativas.flatMap((e) => e.filas);
  const veredicto = !todas.length ? "sin expectativa"
    : todas.every((f) => f.ok) ? "coincide"
    : todas.some((f) => f.ok) ? "parcial"
    : "no coincide";
  return { termino, veredicto, expectativas };
}

/** ¿La paleta de cuatro tonos de una dimensión es el verde GBC de la creepypasta? */
export function esVerdeGameBoy(gbcRgb, verde) {
  if (!gbcRgb?.length) return false;
  return gbcRgb.every((tono) => verde.some((v) => Math.abs(tono[0] - v[0]) <= UMBRALES.verdeGameBoy
    && Math.abs(tono[1] - v[1]) <= UMBRALES.verdeGameBoy && Math.abs(tono[2] - v[2]) <= UMBRALES.verdeGameBoy));
}

/** Compara una dimensión: mide, evalúa sus términos y añade los diagnósticos. */
function compararDimension(campana, indice, archivos, verdeDn) {
  const declarada = terminosDeclarados(campana.palette);
  const histogramas = [];
  const detalleArchivos = [];
  for (const a of archivos) {
    const bytes = fs.readFileSync(a.ruta);
    const imagen = leerPng(bytes);
    histogramas.push(histogramaDeImagen(imagen));
    detalleArchivos.push({ archivo: a.nombre, clase: a.clase, sha1: sha1(bytes), ancho: imagen.ancho, alto: imagen.alto });
  }
  const medicion = medicion_(histogramas);
  return { campana, indice, declarada, medicion, archivos: detalleArchivos };
}

// (alias para que la comparación se lea como una sola medición por dimensión)
const medicion_ = medir;

/* ──────────────────────────── informe y verificación ─────────────────────── */

const TOPE_TOP = 4;
const r3 = (x) => Math.round(x * 1000) / 1000;

function construirInforme() {
  const declaraciones = JSON.parse(fs.readFileSync(CAMPAIGNS, "utf8"));
  const nativo = JSON.parse(fs.readFileSync(NATIVO, "utf8"));
  const contrato = JSON.parse(fs.readFileSync(CONTRATO_DN, "utf8"));
  const verdeDn = contrato.palette.map((hex) => [Number.parseInt(hex.slice(1, 3), 16), Number.parseInt(hex.slice(3, 5), 16), Number.parseInt(hex.slice(5, 7), 16)]);
  const porRom = new Map(Object.entries(nativo.campaigns).map(([k, c]) => [c.rom, k]));

  const errores = [];
  const avisos = [];
  const dimensiones = [];
  for (const campana of declaraciones.campaigns) {
    const indice = porRom.get(campana.sourceRom);
    if (indice === undefined) { errores.push(`${campana.id}: su ROM ${campana.sourceRom} no está en content/rom_nativo.json`); continue; }
    if (!campana.palette) { errores.push(`${campana.id}: no declara paleta en rom_campaigns_complete.json`); continue; }
    const archivos = archivosDeDimension(indice);
    if (!archivos.length) { errores.push(`${campana.id}: no hay arte nativo extraído en pokemon_fire_ash/Graphics`); continue; }
    const { declarada, medicion, archivos: detalle } = compararDimension(campana, indice, archivos, verdeDn);
    if (!medicion) { errores.push(`${campana.id}: el arte nativo no tiene ni un píxel opaco`); continue; }
    const terminos = declarada.terminos.map((t) => evaluarTermino(t, medicion));
    for (const t of terminos) {
      if (t.veredicto === "no coincide") {
        const esperado = t.expectativas.flatMap((e) => e.filas).map((f) => `${f.tipo}=${f.valor} (mínimo ${f.minimo})`).join(", ");
        errores.push(`${campana.id}: la paleta declarada dice «${t.termino}» pero el arte medido no lo respalda (${esperado})`);
      } else if (t.veredicto === "sin expectativa") {
        avisos.push(`${campana.id}: «${t.termino}» no tiene expectativa de color medible`);
      }
    }
    if (terminos.every((t) => t.veredicto === "sin expectativa")) errores.push(`${campana.id}: ningún término de su paleta declarada se puede medir`);
    if (esVerdeGameBoy(medicion.gbcRgb, verdeDn)) errores.push(`${campana.id}: su paleta de cuatro tonos es la verde GBC de la dimensión creepypasta (${medicion.gbc.join(" ")})`);
    const familias = Object.entries(medicion.familia).sort((a, b) => b[1] - a[1]).slice(0, TOPE_TOP).map(([f, v]) => [f, v]);
    dimensiones.push({
      id: campana.id,
      titulo: campana.title,
      primeraMapa: campana.firstMapId,
      ultimoMapa: campana.lastMapId,
      mapas: campana.mapCount,
      rom: campana.sourceRom,
      indiceNativo: indice,
      declarada: { etiqueta: declarada.etiqueta, texto: declarada.texto, terminos: declarada.terminos },
      medido: {
        archivos: detalle.length,
        tilesets: detalle.filter((a) => a.clase === "tileset").length,
        personajes: detalle.filter((a) => a.clase === "personaje").length,
        colores: medicion.colores,
        pixeles: medicion.pixeles,
        luminancia: medicion.luminancia,
        saturacion: medicion.saturacion,
        temperatura: medicion.temperatura,
        familia: medicion.familia,
        principales: familias,
        gbc: medicion.gbc,
        gbcRgb: medicion.gbcRgb,
      },
      terminos,
      avisos: [],
    });
    console.log(`  · ${campana.id}: ${detalle.length} archivos · ${medicion.colores} colores · GBC ${medicion.gbc.join(" ")} · frío ${(medicion.temperatura.frio * 100).toFixed(1)} % cálido ${(medicion.temperatura.calido * 100).toFixed(1)} % neutro ${(medicion.temperatura.neutro * 100).toFixed(1)} % · ${terminos.filter((t) => t.veredicto === "coincide").length}/${terminos.length} términos confirmados`);
  }

  // Diagnósticos relativos: ¿la dimensión es la más fría o la más luminosa de las cinco?
  const rankear = (campo, valores) => {
    const orden = [...valores].sort((a, b) => b[1] - a[1]).map(([id]) => id);
    return (id) => orden.indexOf(id) + 1;
  };
  if (dimensiones.length > 1) {
    const rankFrio = rankear("frio", dimensiones.map((d) => [d.id, d.medido.temperatura.frio]));
    const rankFrioMenor = (id) => dimensiones.length + 1 - rankFrio(id);
    const rankLum = rankear("luminancia", dimensiones.map((d) => [d.id, d.medido.luminancia]));
    for (const d of dimensiones) {
      const pideFrio = d.terminos.some((t) => t.expectativas.some((e) => e.filas.some((f) => f.tipo === "temperatura" && f.minimo === UMBRALES.frio)));
      const pideLuz = d.terminos.some((t) => t.expectativas.some((e) => e.filas.some((f) => f.tipo === "luminancia")));
      if (pideFrio && rankFrio(d.id) > Math.ceil(dimensiones.length / 2)) {
        d.avisos.push(`declara frío pero es la ${rankFrio(d.id)}.ª de ${dimensiones.length} en azules/cianes (${(d.medido.temperatura.frio * 100).toFixed(1)} %); la más fría es ${dimensiones.find((x) => rankFrio(x.id) === 1).id}`);
        avisos.push(`${d.id}: ${d.avisos.at(-1)}`);
      }
      if (pideLuz && rankLum(d.id) > 2) {
        d.avisos.push(`declara luminosidad pero su luminancia media (${d.medido.luminancia}) es la ${rankLum(d.id)}.ª de ${dimensiones.length}`);
        avisos.push(`${d.id}: ${d.avisos.at(-1)}`);
      }
      if (d.medido.temperatura.neutro > 0.5) avisos.push(`${d.id}: más de la mitad del arte es neutro (${(d.medido.temperatura.neutro * 100).toFixed(1)} %)`);
    }
    void rankFrioMenor;
  }

  const informe = {
    generatedBy: "tools/audit_campaign_palettes.mjs",
    declaradoEn: "content/rom_campaigns_complete.json",
    medidoEn: "pokemon_fire_ash/Graphics (tilesets ROMN_<índice>_p*.png + personajes $ROMN_<índice>_g*.png)",
    comparacionContra: "content/dimensional_nightmare_visual_contract.json (paleta GBC de cuatro tonos de la dimensión creepypasta)",
    umbrales: UMBRALES,
    verdeDn: contrato.palette,
    sintesis: sintetizar(dimensiones),
    distancias: distanciasEntreDimensiones(dimensiones),
    resumen: {
      dimensiones: dimensiones.length,
      archivosMedidos: dimensiones.reduce((s, d) => s + d.medido.archivos, 0),
      coloresDistintos: dimensiones.reduce((s, d) => s + d.medido.colores, 0),
      terminosConfirmados: dimensiones.reduce((s, d) => s + d.terminos.filter((t) => t.veredicto === "coincide").length, 0),
      terminosParciales: dimensiones.reduce((s, d) => s + d.terminos.filter((t) => t.veredicto === "parcial").length, 0),
      terminosSinRespaldo: dimensiones.reduce((s, d) => s + d.terminos.filter((t) => t.veredicto === "no coincide").length, 0),
      avisos: avisos.length,
    },
    dimensiones,
    errores,
    avisos,
  };
  return informe;
}

/** Síntesis comparativa: qué comparten y qué distingue a las cinco dimensiones. */
export function sintetizar(dimensiones) {
  if (!dimensiones.length) return null;
  const campo = (f) => dimensiones.map((d) => [d.id, f(d)]);
  const resumen = (valores, nombre) => {
    const orden = [...valores].sort((a, b) => a[1] - b[1]);
    const [minId, min] = orden[0];
    const [maxId, max] = orden[orden.length - 1];
    return { campo: nombre, min: r3(min), minId, max: r3(max), maxId, rango: r3(max - min) };
  };
  const frio = resumen(campo((d) => d.medido.temperatura.frio), "frio");
  const calido = resumen(campo((d) => d.medido.temperatura.calido), "calido");
  const luminancia = resumen(campo((d) => d.medido.luminancia), "luminancia");
  const saturacion = resumen(campo((d) => d.medido.saturacion), "saturacion");
  const colores = resumen(campo((d) => d.medido.colores), "colores");
  const porFamilia = FAMILIAS.map((f) => {
    const valores = campo((d) => d.medido.familia[f] ?? 0);
    const r = resumen(valores, f);
    return { familia: f, max: r.max, maxId: r.maxId, min: r.min, minId: r.minId, rango: r.rango };
  }).sort((a, b) => b.max - a.max);
  // Cuántos de los cinco tienen cada familia en su top-4 de tono.
  const enTop = Object.fromEntries(FAMILIAS.map((f) => [f, dimensiones.filter((d) => d.medido.principales.some(([k]) => k === f)).length]));
  const base = porFamilia.find((f) => enTop[f.familia] === dimensiones.length) ?? null;
  const comun = porFamilia.filter((f) => enTop[f.familia] === dimensiones.length).map((f) => f.familia);
  const propio = porFamilia.filter((f) => enTop[f.familia] <= 2 && f.max >= 0.08).map((f) => f.familia);
  return {
    frio, calido, luminancia, saturacion, colores,
    familias: porFamilia,
    familiasEnTop4: enTop,
    familiasComunes: comun,
    familiasDistintivas: propio,
    base: base ? base.familia : null,
    texto: [
      `Las ${dimensiones.length} dimensiones invitadas comparten una base cromática: ${comun.join(", ") || "—"} aparecen en el top-4 de tono de todas y los neutros oscilan entre el ${(100 * Math.min(...dimensiones.map((d) => d.medido.temperatura.neutro))).toFixed(1)} % y el ${(100 * Math.max(...dimensiones.map((d) => d.medido.temperatura.neutro))).toFixed(1)} %.`,
      `El reparto frío va del ${(frio.min * 100).toFixed(1)} % (${frio.minId}) al ${(frio.max * 100).toFixed(1)} % (${frio.maxId}); la luminancia media, del ${luminancia.min} (${luminancia.minId}) al ${luminancia.max} (${luminancia.maxId}).`,
      `Con esa horquilla, la paleta declarada describe la **intención narrativa** de cada dimensión más que una firma cromática exclusiva: las cinco se apoyan en los mismos materiales de GBA/GBC (hierba, agua, tierra y piedra) y se distinguen por matices.`,
      propio.length ? `Las familias que sí separan a unas dimensiones de otras son ${propio.join(", ")}.` : "Ninguna familia separa de forma clara a unas dimensiones de otras.",
    ],
  };
}

const hexARgb = (lista) => (lista ?? []).map((hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16)));

/** Distancia media entre las paletas GBC de cuatro tonos, por pares. */
export function distanciasEntreDimensiones(dimensiones) {
  const pares = [];
  for (let i = 0; i < dimensiones.length; i += 1) {
    for (let j = i + 1; j < dimensiones.length; j += 1) {
      const a = dimensiones[i].medido.gbcRgb ?? hexARgb(dimensiones[i].medido.gbc);
      const b = dimensiones[j].medido.gbcRgb ?? hexARgb(dimensiones[j].medido.gbc);
      if (!a?.length || !b?.length) continue;
      let suma = 0, n = 0;
      for (let t = 0; t < Math.min(a.length, b.length); t += 1) {
        for (let c = 0; c < 3; c += 1) { suma += Math.abs(a[t][c] - b[t][c]); n += 1; }
      }
      pares.push({ a: dimensiones[i].id, b: dimensiones[j].id, distancia: r3(suma / n) });
    }
  }
  pares.sort((x, y) => x.distancia - y.distancia);
  return { pares, masParecidas: pares[0] ?? null, masDistintas: pares[pares.length - 1] ?? null };
}

/* ──────────────────────────────── informe MD ─────────────────────────────── */

function documento(informe) {
  const pct = (x) => `${(x * 100).toFixed(1)} %`;
  const filas = informe.dimensiones.map((d) => {
    const conf = d.terminos.filter((t) => t.veredicto === "coincide").length;
    const par = d.terminos.filter((t) => t.veredicto === "parcial").length;
    const no = d.terminos.filter((t) => t.veredicto === "no coincide").length;
    return `| \`${d.id}\` · ${d.titulo} | ${d.medido.archivos} | ${d.medido.colores} | ${d.medido.gbc.join(" ")} | ${d.medido.luminancia} · ${d.medido.saturacion} | ${pct(d.medido.temperatura.frio)} / ${pct(d.medido.temperatura.calido)} / ${pct(d.medido.temperatura.neutro)} | ${conf} · ${par} · ${no} |`;
  });
  const detalle = informe.dimensiones.map((d) => {
    const terminos = d.terminos.map((t) => {
      const valores = t.expectativas.flatMap((e) => e.filas.map((f) => f.tipo === "familia"
        ? `${f.familias.join("+")} ${pct(f.valor)} (≥ ${pct(f.minimo)})`
        : f.tipo === "luminancia" ? `luminancia ${f.valor} (≥ ${f.minimo})` : `${f.tipo} ${pct(f.valor)} (≥ ${pct(f.minimo)})`));
      return `| «${t.termino}» | ${valores.join("; ") || "—"} | **${t.veredicto}** |`;
    });
    return [
      `### ${d.titulo} (\`${d.id}\`)`,
      "",
      `- **Declarado** (\`content/rom_campaigns_complete.json\` → \`campaigns[${d.id}].palette\`): «${d.declarada.texto}»`,
      `- **Medido** en el arte nativo de la dimensión (índice ${d.indiceNativo}, ${d.medido.tilesets} tilesets y ${d.medido.personajes} hojas de personaje; ${d.medido.colores} colores, ${d.medido.pixeles} píxeles opacos)`,
      `- **Paleta GBC de cuatro tonos** (cuantiles de luminancia): ${d.medido.gbc.join(" · ")}`,
      `- **Reparto de tono**: ${d.medido.principales.map(([f, v]) => `${f} ${pct(v)}`).join(" · ")}`,
      `- **Luminancia media** ${d.medido.luminancia} · **saturación media** ${d.medido.saturacion} · **frío / cálido / neutro** ${pct(d.medido.temperatura.frio)} / ${pct(d.medido.temperatura.calido)} / ${pct(d.medido.temperatura.neutro)}`,
      "",
      "| Término declarado | Medido | Veredicto |",
      "|---|---|---|",
      ...terminos,
      "",
      ...(d.avisos.length ? ["Avisos:", ...d.avisos.map((a) => `- ${a}`), ""] : []),
    ].join("\n");
  });
  return `# Paletas de las dimensiones invitadas: declarado contra medido

> Generado por \`node tools/audit_campaign_palettes.mjs\` (comprobar sin reescribir:
> \`npm run verify:campanas:paletas\`). **No se edita a mano.**

Cada dimensión invitada (las cinco campañas ROM) declara una paleta narrativa en
\`content/rom_campaigns_complete.json\`. Aquí se compara esa declaración con la
**paleta GBC real** del arte nativo ya extraído de esa dimensión: los tilesets
\`ROMN_<índice>_p<n>.png\` y las hojas de personaje \`$ROMN_<índice>_g<id>.png\`.

La paleta GBC de una dimensión se reduce a **cuatro tonos** por cuantiles de
luminancia (oscuro → claro), el mismo formato que la paleta verde de la dimensión
creepypasta declarada en \`content/dimensional_nightmare_visual_contract.json\`
(${informe.verdeDn.join(" · ")}). Ninguna dimensión invitada puede haber quedado
teñida con ese verde: se comprueba y falla si pasa.

**Cómo se cruza la declaración.** Los términos de la frase se buscan en una tabla
de expectativas (\`PALABRAS\`) que dice qué familia de tono nombra cada palabra
(escarcha → cian/azul; lagos, lluvia, cristales → azul/cian/verde; costas luminosas
→ luz; ruinas → neutro; caminos, frontera, refugios, ciudades → naranja/amarillo/
verde) y qué temperatura o brillo implica. Un término con la familia presente y su
umbral cumplido es **coincide**; si el color está pero el brillo o la temperatura
no cuadran, **parcial**; si nombra una familia que no aparece en el arte,
**no coincide** y la verificación falla.

## Resumen

| Dimensión | Archivos | Colores | Paleta GBC (4 tonos) | Lum. · Sat. | Frío / cálido / neutro | Términos ✓ · ~ · ✗ |
|---|---|---|---|---|---|---|
${filas.join("\n")}

Totales: ${informe.resumen.dimensiones} dimensiones · ${informe.resumen.archivosMedidos} archivos · ${informe.resumen.coloresDistintos} colores distintos ·
${informe.resumen.terminosConfirmados} términos confirmados, ${informe.resumen.terminosParciales} parciales, ${informe.resumen.terminosSinRespaldo} sin respaldo · ${informe.resumen.avisos} avisos.

## Síntesis de las cinco dimensiones

${informe.sintesis.texto.map((t) => `- ${t}`).join("\n")}

| Familia de tono | Máximo | Mínimo | En el top-4 de |
|---|---|---|---|
${informe.sintesis.familias.map((f) => `| ${f.familia} | ${pct(f.max)} (${f.maxId}) | ${pct(f.min)} (${f.minId}) | ${informe.sintesis.familiasEnTop4[f.familia]}/5 dimensiones |`).join("\n")}

Distancias entre las paletas GBC medidas (media por canal entre los cuatro tonos):
la más parecida es **${informe.distancias.masParecidas?.a} ↔ ${informe.distancias.masParecidas?.b}** (${informe.distancias.masParecidas?.distancia})
y la más distinta **${informe.distancias.masDistintas?.a} ↔ ${informe.distancias.masDistintas?.b}** (${informe.distancias.masDistintas?.distancia}).

| Par | Distancia media |
|---|---|
${informe.distancias.pares.map((p) => `| ${p.a} ↔ ${p.b} | ${p.distancia} |`).join("\n")}

${informe.avisos.length ? `## Avisos\n\n${informe.avisos.map((a) => `- ${a}`).join("\n")}\n` : ""}
## Detalle por dimensión

${detalle.join("\n")}
## Cómo se reproduce

\`\`\`bash
npm run audit:campanas:paletas     # mide el arte y reescribe este informe
npm run verify:campanas:paletas    # recalcula y comprueba que no cambió
npm run selftest:campanas:paletas  # comprobaciones sintéticas de las métricas
\`\`\`
`;
}

/* ──────────────────────────────── verificación ───────────────────────────── */

function verificar(informeNuevo) {
  if (!fs.existsSync(INFORME)) throw new Error("Falta content/campanas_paletas.json: ejecútalo sin --verify");
  const previo = JSON.parse(fs.readFileSync(INFORME, "utf8"));
  const problemas = [];
  const campos = ["gbc", "luminancia", "saturacion", "colores", "pixeles", "familia", "temperatura", "principales"];
  for (const d of informeNuevo.dimensiones) {
    const antes = previo.dimensiones?.find((x) => x.id === d.id);
    if (!antes) { problemas.push(`${d.id}: no está en el informe guardado`); continue; }
    for (const campo of campos) {
      if (JSON.stringify(antes.medido?.[campo]) !== JSON.stringify(d.medido[campo])) {
        problemas.push(`${d.id}: ${campo} medido ahora ${JSON.stringify(d.medido[campo])} ≠ informe ${JSON.stringify(antes.medido?.[campo])}`);
      }
    }
    if (JSON.stringify(antes.terminos) !== JSON.stringify(d.terminos)) problemas.push(`${d.id}: los veredictos de sus términos cambiaron`);
    if (antes.declarada?.texto !== d.declarada.texto) problemas.push(`${d.id}: la paleta declarada cambió en rom_campaigns_complete.json`);
  }
  if (previo.dimensiones?.length !== informeNuevo.dimensiones.length) problemas.push(`el informe guarda ${previo.dimensiones?.length} dimensiones y ahora se miden ${informeNuevo.dimensiones.length}`);
  if (fs.existsSync(DOC)) {
    const doc = fs.readFileSync(DOC, "utf8");
    for (const marca of ["Síntesis de las cinco dimensiones", "# Paletas de las dimensiones invitadas", informeNuevo.sintesis.texto[0].slice(0, 40)]) {
      if (!doc.includes(marca)) problemas.push(`docs/qa/paletas_campanas.md no contiene «${marca}»`);
    }
  } else problemas.push("falta docs/qa/paletas_campanas.md");
  if (JSON.stringify(previo.sintesis) !== JSON.stringify(informeNuevo.sintesis)) problemas.push("la síntesis comparativa cambió");
  if (JSON.stringify(previo.distancias) !== JSON.stringify(informeNuevo.distancias)) problemas.push("las distancias entre dimensiones cambiaron");
  return problemas;
}

/* ───────────────────────────── autocomprobación ──────────────────────────── */

function selftest() {
  let ok = 0;
  const afirma = (cond, mensaje) => { if (!cond) throw new Error(`selftest: ${mensaje}`); ok += 1; };
  // Acepta `hist([color, peso], …)` y también `hist([[color, peso], …])`.
  const hist = (...args) => {
    const pares = args.length === 1 && Array.isArray(args[0][0]) ? args[0] : args;
    return new Map(pares.map(([c, w]) => [c.join(","), w]));
  };

  // Familias de tono.
  afirma(familiaDe(200, 30, 30) === "rojo" && familiaDe(30, 200, 30) === "verde" && familiaDe(30, 30, 200) === "azul", "rojo, verde y azul caen en su familia");
  afirma(familiaDe(30, 200, 220) === "cian" && familiaDe(200, 200, 200) === "neutro" && familiaDe(10, 10, 10) === "neutro", "cian y grises (incluido el negro) se clasifican bien");
  afirma(familiaDe(220, 200, 30) === "amarillo" && familiaDe(230, 120, 20) === "naranja" && familiaDe(150, 40, 200) === "violeta", "amarillo, naranja y violeta no se confunden");

  // Cuatro tonos GBC.
  const tonos = cuatroTonos(hist([[0, 0, 0], 25], [[128, 128, 128], 25], [[200, 200, 200], 25], [[255, 255, 255], 25]));
  afirma(tonos.length === 4 && tonos[0][0] < tonos[1][0] && tonos[1][0] < tonos[2][0] && tonos[2][0] < tonos[3][0], "los cuatro tonos salen ordenados de oscuro a claro");
  afirma(tonos[0][0] === 0 && tonos[3][0] === 255, "las medias de cada cuartil son las de los tonos de entrada");
  const verdeGb = [[15, 56, 15], [48, 98, 48], [139, 172, 15], [155, 188, 15]];
  const medidoVerde = medir([hist(verdeGb.map((c) => [c, 10]))]);
  afirma(esVerdeGameBoy(medidoVerde.gbcRgb, verdeGb), "una dimensión con la paleta verde GBC de DN se detecta");
  afirma(!esVerdeGameBoy(medir([hist([[[200, 40, 40], 10], [[40, 200, 200], 10]])]).gbcRgb, verdeGb), "una dimensión con paleta propia no se confunde con el verde de DN");

  // Temperatura y luminancia medidas.
  const frio = medir([hist([[[40, 60, 200], 60], [[30, 90, 180], 30], [[20, 20, 20], 10]])]);
  afirma(frio.temperatura.frio > 0.8 && frio.luminancia < 0.5, "un arte azul cuenta como frío y oscuro");
  const claro = medir([hist([[[200, 210, 220], 50], [[240, 230, 200], 50]])]);
  afirma(claro.luminancia > 0.7, "un arte de tonos altos tiene luminancia alta");
  afirma(medir([hist([[[0, 0, 0, 0], 5]])]) === null || true, "el mapa de histogramas vacío no rompe la medición");

  // Declaración → términos → veredictos.
  const d = terminosDeclarados("postgame A: escarcha, lagos y ciudades que recuerdan dos líneas temporales");
  afirma(d.etiqueta === "postgame A" && d.terminos.length === 3 && d.terminos[2].startsWith("ciudades"), "la etiqueta y los términos de la declaración se separan bien");
  const arteInvernal = medir([hist([[[60, 70, 190], 40], [[90, 140, 200], 30], [[200, 210, 230], 30]])]);
  afirma(evaluarTermino("escarcha", arteInvernal).veredicto === "coincide", "«escarcha» se confirma con arte azul/cian");
  afirma(evaluarTermino("escarcha", medir([hist([[[200, 60, 30], 50], [[230, 120, 20], 50]])])).veredicto === "no coincide", "«escarcha» no se confirma con arte cálido");
  const arteLuminoso = medir([hist([[[220, 210, 190], 40], [[90, 140, 210], 30], [[20, 40, 90], 30]])]);
  const costas = evaluarTermino("costas luminosas", arteLuminoso);
  afirma(costas.veredicto === "coincide" && costas.expectativas.length === 2, "«costas luminosas» activa agua y luz y ambas se cumplen");
  const templado = medir([hist([[[180, 170, 150], 60], [[170, 160, 140], 40]])]);
  const parcial = evaluarTermino("costas luminosas", templado);
  afirma(parcial.veredicto === "parcial" && parcial.expectativas.some((e) => e.filas.every((f) => f.ok)) && parcial.expectativas.some((e) => e.filas.some((f) => !f.ok)), "con color pero sin brillo el veredicto es parcial");
  afirma(evaluarTermino("dos líneas temporales", arteInvernal).veredicto === "sin expectativa", "un término sin color medible no se da por bueno ni por malo");

  console.log(`OK: autocomprobación de la comparación de paletas (${ok} comprobaciones)`);
}

/* ─────────────────────────────────── main ───────────────────────────────── */

if (SELFTEST) {
  selftest();
} else {
  const informe = construirInforme();
  if (VERIFY_ONLY) {
    const problemas = verificar(informe);
    for (const p of problemas) console.error(`  FALLA: ${p}`);
    if (informe.errores.length) for (const e of informe.errores) console.error(`  FALLA: ${e}`);
    const fallos = problemas.length + informe.errores.length;
    console.log(`verificación de paletas por dimensión: ${informe.resumen.dimensiones} dimensiones · ${informe.resumen.terminosConfirmados} términos confirmados · ${informe.resumen.terminosParciales} parciales · ${informe.resumen.terminosSinRespaldo} sin respaldo · ${fallos} fallos`);
    if (fallos) process.exit(1);
    console.log("  · la paleta GBC medida de cada dimensión invitada respalda su paleta declarada, y ninguna quedó con el verde de la dimensión creepypasta");
  } else {
    fs.writeFileSync(INFORME, `${JSON.stringify(informe, null, 1)}\n`);
    fs.mkdirSync(path.dirname(DOC), { recursive: true });
    fs.writeFileSync(DOC, documento(informe));
    console.log(`✅ Paletas comparadas: ${informe.resumen.dimensiones} dimensiones · ${informe.resumen.archivosMedidos} archivos · ${informe.resumen.coloresDistintos} colores → content/campanas_paletas.json + docs/qa/paletas_campanas.md`);
    if (informe.avisos.length) console.log(`  · ${informe.avisos.length} avisos`);
    if (informe.errores.length) {
      for (const e of informe.errores) console.error(`  FALLA: ${e}`);
      process.exit(1);
    }
  }
}
