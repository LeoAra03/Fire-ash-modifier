#!/usr/bin/env node
/**
 * metrica_dimensiones_check.mjs
 *
 * Mide la métrica de éxito del plan (fase 2/46199, tarea 36): cada dimensión con
 * jefe final, retorno libre, verificador propio y partida de prueba registrada.
 *
 * No se fía de la declaración: comprueba cada condición contra los datos reales.
 *
 *   jefe          el evento del jefe existe en su mapa y una de sus páginas llama
 *                 a la batalla declarada (subcadena exacta);
 *   retorno       el evento de salida existe y tiene una página SIN condición de
 *                 switch ni de variable que transfiere fuera del mundo;
 *   verificador   cada script declarado existe en package.json;
 *   partida       la corrida registrada cita (texto literal) el registro de
 *                 corridas, y la partida manual se declara aparte.
 *
 * Además audita la cobertura: ningún mundo del plan puede faltar del registro
 * (dimensiones de barco + dimensión Team Rocket, las 7 emisiones del Monte Silver
 * y los mundos creepypasta con jefe, incluida la Liga Oscura), y verifica los
 * hallazgos declarados que sean comprobables (como la colisión de switches).
 *
 * Uso:
 *   node tools/qa/metrica_dimensiones_check.mjs              # mide y comprueba
 *   node tools/qa/metrica_dimensiones_check.mjs --json       # legible por máquina
 *   node tools/qa/metrica_dimensiones_check.mjs --profundo   # re-ejecuta cada verificador
 *
 * `--profundo` necesita `npm install` (los verificadores de DN importan @napi-rs/canvas).
 * Código de salida 1 si alguna condición no está cubierta o alguna cita no existe.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readMap, readData, txt } from "../lib/dn_rmxp.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const REGISTRO = path.join(ROOT, "content", "metrica_dimensiones.json");
const BANDERAS = {
  json: process.argv.includes("--json"),
  profundo: process.argv.includes("--profundo"),
};

const leerJson = (ruta) => JSON.parse(fs.readFileSync(ruta, "utf8"));
const existe = (rel) => fs.existsSync(path.join(ROOT, rel));

// --------------------------------------------------------------- eventos instalados
const cache = new Map();
function eventos(mapId) {
  if (!cache.has(mapId)) {
    const raw = readMap(mapId);
    const lista = (raw.getIvar("@events")?.pairs ?? []).map(([, obj]) => ({
      name: txt(obj.getIvar("@name")),
      pages: obj.getIvar("@pages") ?? [],
    }));
    cache.set(mapId, lista);
  }
  return cache.get(mapId);
}

function comandos(page) {
  return (page.getIvar("@list") ?? []).map((c) => ({
    code: c.getIvar("@code"),
    params: (c.getIvar("@parameters") ?? []).map((p) => txt(p)),
  }));
}

function condicion(page) {
  const cond = page.getIvar("@condition");
  return {
    switch1: Boolean(cond?.getIvar("@switch1_valid")),
    switch2: Boolean(cond?.getIvar("@switch2_valid")),
    variable: Boolean(cond?.getIvar("@variable_valid")),
    switch1Id: cond?.getIvar("@switch1_id"),
    switch2Id: cond?.getIvar("@switch2_id"),
  };
}

const textoDePagina = (page) => comandos(page).map((c) => c.params.join(" ")).join("\n");

/** ¿La página transfiere a `destino` sin ninguna condición de switch/variable? */
function paginaLibreHacia(page, destino) {
  if (condicion(page).switch1 || condicion(page).switch2 || condicion(page).variable) return false;
  return comandos(page).some((c) => c.code === 201 && Number(c.params[1]) === destino);
}

// --------------------------------------------------------------- condiciones de la métrica
function revisarJefe(mundo) {
  const fallos = [];
  const jefe = mundo.jefe ?? {};
  const mapa = Number(jefe.mapa);
  if (!fs.existsSync(path.join(ROOT, "pokemon_fire_ash", "Data", `Map${String(mapa).padStart(3, "0")}.rxdata`))) {
    return [`nunca: no existe Map${mapa}`];
  }
  const evento = eventos(mapa).find((e) => e.name === jefe.evento);
  if (!evento) return [`Map${mapa}: no existe el evento «${jefe.evento}»`];
  const pagina = evento.pages.find((p) => textoDePagina(p).includes(jefe.batalla));
  if (!pagina) return [`Map${mapa} «${jefe.evento}»: ninguna página llama a «${jefe.batalla}»`];

  if (jefe.premio) {
    const premio = `:${jefe.premio}`;
    const dado = (mundo.mapas ?? []).some((id) =>
      eventos(Number(id)).some((e) => e.pages.some((p) => textoDePagina(p).includes(premio))),
    );
    if (!dado) fallos.push(`el premio ${jefe.premio} no se entrega en ningún evento del mundo`);
  }
  return fallos;
}

function revisarRetornos(mundo) {
  const fallos = [];
  const retornos = mundo.retornos ?? [];
  if (retornos.length === 0) return ["no declara ninguna salida"];
  for (const r of retornos) {
    const mapa = Number(r.mapa);
    const evento = eventos(mapa).find((e) => e.name === r.evento);
    if (!evento) {
      fallos.push(`Map${mapa}: no existe el evento de salida «${r.evento}»`);
      continue;
    }
    const libre = evento.pages.some((p) => paginaLibreHacia(p, Number(r.destino)));
    if (!libre) fallos.push(`Map${mapa} «${r.evento}»: ninguna página transfiere a Map${r.destino} sin condición`);
  }
  return fallos;
}

function revisarVerificadores(mundo, scripts) {
  const fallos = [];
  const verifs = mundo.verificadores ?? [];
  if (verifs.length === 0) return ["no declara verificador"];
  for (const v of verifs) {
    if (!(v in scripts)) fallos.push(`el script ${v} no está en package.json`);
  }
  return fallos;
}

function revisarPartida(mundo) {
  const fallos = [];
  const partida = mundo.partida ?? {};
  if (partida.tipo !== "automatica" && partida.tipo !== "manual") fallos.push("tipo de partida desconocido");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(partida.fecha ?? "")) fallos.push("fecha ausente o inválida");
  if (!(partida.evidencia?.ruta && partida.evidencia?.busca)) {
    fallos.push("la corrida no declara evidencia (ruta + cita)");
  } else if (!existe(partida.evidencia.ruta)) {
    fallos.push(`no existe el registro de corridas ${partida.evidencia.ruta}`);
  } else if (!fs.readFileSync(path.join(ROOT, partida.evidencia.ruta), "utf8").includes(partida.evidencia.busca)) {
    fallos.push(`la cita no aparece en ${partida.evidencia.ruta}: «${partida.evidencia.busca}»`);
  }
  if (partida.comando && !((mundo.verificadores ?? []).includes(partida.comando))) {
    fallos.push(`la corrida usa ${partida.comando}, que no está entre los verificadores declarados`);
  }
  const manual = partida.manual ?? {};
  if (!manual.estado) fallos.push("la partida manual no declara estado");
  return fallos;
}

/** Cobertura: el registro no puede perder mundos que el contenido sí tiene. */
function cobertura(registro) {
  const ids = new Set(registro.mundos.map((m) => m.id));
  const esperados = new Map();
  const barco = leerJson(path.join(ROOT, "content", "dimensiones_barco.json"));
  for (const d of barco.dimensiones ?? []) esperados.set(d.id, "dimension_invitada (barco)");
  esperados.set("teamrocket", "dimensión Team Rocket");
  const multiverso = leerJson(path.join(ROOT, "content", "multiverse_creepypasta.json"));
  for (const b of multiverso.bosses ?? []) esperados.set(b.id, "emisión del Monte Silver");
  const dn = leerJson(path.join(ROOT, "content", "dimensional_nightmare_events.json"));
  for (const ep of dn.episodes ?? []) {
    if (!ep.boss) continue; // el Nexo cierra el arco y no tiene jefe
    esperados.set(`dn_${String(ep.key).toLowerCase()}`, "mundo creepypasta");
  }
  esperados.set("dn_liga_oscura", "Liga Oscura");

  const faltantes = [...esperados].filter(([id]) => !ids.has(id)).map(([id, tipo]) => `${id} (${tipo})`);
  const sobrantes = [...ids].filter((id) => !esperados.has(id));
  return { faltantes, sobrantes, esperados: esperados.size };
}

/** Hallazgos comprobables: hoy, la colisión de switches entre gruta y Atlas. */
function revisarHallazgos(registro) {
  const resultados = [];
  for (const h of registro.hallazgos ?? []) {
    if (h.verificacion?.tipo !== "switch_compartido") {
      resultados.push({ id: h.id, estado: "no_comprobable" });
      continue;
    }
    const { mapa, rango, prefijo_system, fuentes } = h.verificacion;
    const system = readData("System.rxdata");
    const nombres = system.getIvar("@switches");
    const usados = new Set();
    for (const e of eventos(Number(mapa))) {
      for (const p of e.pages) {
        const c = condicion(p);
        if (c.switch1 && c.switch1Id >= rango[0] && c.switch1Id <= rango[1]) usados.add(c.switch1Id);
        if (c.switch2 && c.switch2Id >= rango[0] && c.switch2Id <= rango[1]) usados.add(c.switch2Id);
      }
    }
    const colisionando = [...usados].filter((id) => String(txt(nombres[id])).startsWith(prefijo_system));
    const citasOk = (fuentes ?? []).every(
      (f) => existe(f.ruta) && fs.readFileSync(path.join(ROOT, f.ruta), "utf8").includes(f.busca),
    );
    const confirmado = colisionando.length > 0 && citasOk;
    resultados.push({
      id: h.id,
      estado: confirmado ? "confirmado" : "sin_confirmar",
      detalle: `Map${mapa} usa ${usados.size} switches del rango ${rango[0]}–${rango[1]}; ` +
        `${colisionando.length} de ellos están nombrados «${prefijo_system}…» en System.rxdata`,
      colisionando,
      citasOk,
    });
  }
  return resultados;
}

// --------------------------------------------------------------- ejecución
const registro = leerJson(REGISTRO);
const scripts = leerJson(path.join(ROOT, "package.json")).scripts ?? {};
const filas = [];
let conCuatro = 0;
let manuales = 0;
let verificadoresRojos = 0;

for (const mundo of registro.mundos) {
  const fallos = [
    ...revisarJefe(mundo).map((f) => `jefe: ${f}`),
    ...revisarRetornos(mundo).map((f) => `retorno: ${f}`),
    ...revisarVerificadores(mundo, scripts).map((f) => `verificador: ${f}`),
    ...revisarPartida(mundo).map((f) => `partida: ${f}`),
  ];

  if (BANDERAS.profundo) {
    for (const v of mundo.verificadores ?? []) {
      try {
        execFileSync("npm", ["run", "--silent", v], { cwd: ROOT, stdio: "pipe", timeout: 15 * 60 * 1000 });
      } catch (error) {
        const salida = `${error.stdout ?? ""}${error.stderr ?? ""}`.trim().split("\n").slice(-2).join(" | ");
        fallos.push(`verificador en rojo: ${v} (${salida.slice(0, 160)})`);
        verificadoresRojos++;
      }
    }
  }

  const ok = fallos.length === 0;
  if (ok) conCuatro++;
  if (mundo.partida?.manual?.estado === "hecha") manuales++;
  filas.push({
    id: mundo.id,
    familia: mundo.familia,
    jefe: revisarJefe(mundo).length === 0,
    retorno: revisarRetornos(mundo).length === 0,
    verificadores: mundo.verificadores,
    partida: registro.corridas,
    manual: mundo.partida?.manual?.estado ?? "sin declarar",
    ok,
    fallos,
  });
}

const cob = cobertura(registro);
const hallazgos = revisarHallazgos(registro);
const total = registro.mundos.length;
const hallazgoSinConfirmar = hallazgos.filter((h) => h.estado === "sin_confirmar").map((h) => h.id);
const ok = cob.faltantes.length === 0 && cob.sobrantes.length === 0 && filas.every((f) => f.ok) && hallazgoSinConfirmar.length === 0;

if (BANDERAS.json) {
  console.log(JSON.stringify({
    ok,
    total,
    con_cuatro_condiciones: conCuatro,
    cobertura_automatica: Number(((conCuatro / total) * 100).toFixed(1)),
    partidas_manuales: manuales,
    cobertura_manual: Number(((manuales / total) * 100).toFixed(1)),
    mundos_esperados: cob.esperados,
    faltantes: cob.faltantes,
    sobrantes: cob.sobrantes,
    hallazgos,
    mundos: filas,
  }, null, 2));
  process.exit(ok ? 0 : 1);
}

console.log(`Métrica de éxito del plan — ${total} mundos (${registro.criterios.map((c) => c.nombre).join(" · ")})`);
console.log(`  jefe final | retorno libre | verificador propio | partida registrada (${registro.corridas})`);
console.log("");
for (const f of filas) {
  const marca = (v) => (v ? "✔" : "✘");
  console.log(
    `  ${marca(f.ok)} ${f.id.padEnd(18)} jefe ${marca(f.jefe)}  retorno ${marca(f.retorno)}  ` +
      `verificador ${marca(!f.fallos.some((x) => x.startsWith("verificador")))}  partida ${marca(!f.fallos.some((x) => x.startsWith("partida")))}  ` +
      `(${f.verificadores.join(", ")}) · manual: ${f.manual}`,
  );
  for (const fallo of f.fallos) console.log(`        FALLO ${fallo}`);
}
console.log("");
for (const h of hallazgos) console.log(`  hallazgo ${h.id}: ${h.estado} — ${h.detalle}`);
for (const d of registro.deudas ?? []) {
  const cita = d.evidencia?.[0];
  const citaOk = cita && existe(cita.ruta) && fs.readFileSync(path.join(ROOT, cita.ruta), "utf8").includes(cita.busca);
  console.log(`  deuda ${d.id}${citaOk ? "" : " (EVIDENCIA NO ENCONTRADA)"}: ${d.titulo}`);
}
for (const f of cob.faltantes) console.error(`  FALLO cobertura: falta el mundo ${f}`);
for (const s of cob.sobrantes) console.error(`  FALLO cobertura: el registro declara un mundo desconocido: ${s}`);
for (const id of hallazgoSinConfirmar) console.error(`  FALLO hallazgo: ${id} no se pudo confirmar con los datos instalados`);

const porcentaje = ((conCuatro / total) * 100).toFixed(0);
console.log("");
console.log(
  `  métrica: ${conCuatro}/${total} mundos con las cuatro condiciones (${porcentaje} %) · ` +
    `partida manual registrada en ${manuales}/${total} mundos (${((manuales / total) * 100).toFixed(0)} %)`,
);
if (!ok) {
  console.error(`FALLO: la métrica no está cubierta (${filas.filter((f) => !f.ok).length} mundo(s) con fallos)`);
  process.exit(1);
}
console.log("OK: los 4 criterios están cubiertos en la capa automática para todos los mundos del plan");
