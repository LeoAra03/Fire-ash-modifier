#!/usr/bin/env node
/**
 * rendimiento_presupuesto.mjs — presupuesto de densidad por mapa y auditoría de
 * los recursos que el plan mide en las tareas 2326–2350.
 *
 * Qué mide, y con qué definición (la definición importa más que el número):
 *
 *   · **Eventos por mapa**: cuántos eventos tiene el mapa compilado.
 *     Es la cota real de procesos simultáneos: un evento ejecuta **una** página a
 *     la vez, así que contar páginas infla el número. Las páginas automáticas se
 *     miden y se informan, pero no se ponen como techo.
 *   · **Huella del mod**: eventos cuyo nombre empieza por «PokeMod». El
 *     presupuesto se aplica a los mapas que el mod toca, no a los 1 021 mapas
 *     del juego base que el mod no reescribe.
 *   · **Excepciones declaradas**: un mapa puede pasarse del techo si hay una
 *     entrada con su id, el motivo medido (qué evento concentra los procesos) y
 *     su responsable. Sin entrada, la verificación falla: el exceso no se puede
 *     colar en silencio.
 *   · **Audio**: archivos de cero bytes, duplicados exactos por SHA-256 y si los
 *     nombres implicados están referenciados por mapas o eventos. Un duplicado
 *     referenciado no se borra: se documenta.
 *   · **Peso**: `Data`, `Graphics` y `Audio`, y qué archivos versionados pasan de
 *     20 MiB (el techo que el plan fija para el repositorio).
 *
 * Uso:
 *   node tools/qa/rendimiento_presupuesto.mjs            # escribe artefacto y acta
 *   node tools/qa/rendimiento_presupuesto.mjs --verify   # comprueba que están al día
 *   node tools/qa/rendimiento_presupuesto.mjs --json     # salida legible por máquina
 *   node tools/qa/rendimiento_presupuesto.mjs --selftest # prueba la regla del presupuesto
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { marshalLoad } from "../../web/js/marshal.js";
import { mapListFromInfos } from "../../web/js/rmxp.js";
import { ROOT } from "../plan2700/tanda_textos_core.mjs";

const ARGS = new Set(process.argv.slice(2));
const VERIFY = ARGS.has("--verify");
const JSON_OUT = ARGS.has("--json");
const SELFTEST = ARGS.has("--selftest");

const GAME = path.join(ROOT, "pokemon_fire_ash");
const DATA = path.join(GAME, "Data");
const SALIDA_JSON = "content/plan2700_rendimiento.json";
const SALIDA_MD = "docs/qa/rendimiento_presupuesto.md";

/** Techos del plan. Se declaran aquí y no en el artefacto: el artefacto es la medición. */
export const PRESUPUESTO = Object.freeze({
  eventosPorMapa: 60,
  eventosAutomaticosPorMapa: 12,
  mibVersionado: 20,
  /** Sólo informativo: un evento corre una página a la vez, así que este número sobreestima el coste. */
  paginasAutomaticasPorMapa: 40,
});

export const familiaDe = (id) => (id >= 1021 && id <= 2020 ? "atlas"
  : id >= 2040 && id <= 2194 ? "nightmare"
    : id >= 3000 && id <= 3110 ? "glazed"
      : id >= 3120 && id <= 3138 ? "light_platinum"
        : id >= 3200 && id <= 3631 ? "liquid_crystal"
          : id >= 3700 && id <= 3944 ? "tfoh"
            : id >= 4000 && id <= 4419 ? "unbound"
              : id >= 1001 && id <= 1020 ? "horizontes"
                : id >= 2200 && id <= 2299 ? "dlc_base"
                  : "base");

const texto = (valor) => valor?.text ?? String(valor ?? "");

function nombresDeMapas() {
  const infos = mapListFromInfos(marshalLoad(fs.readFileSync(path.join(DATA, "MapInfos.rxdata"))));
  return new Map(infos.map((info) => [info.id, info.name]));
}

/** Inventario de densidad: una fila por mapa compilado. */
export function medirMapas() {
  const nombres = nombresDeMapas();
  const archivos = fs.readdirSync(DATA).filter((nombre) => /^Map\d+\.rxdata$/.test(nombre));
  const filas = [];
  for (const archivo of archivos) {
    const id = Number(/^Map(\d+)\.rxdata$/.exec(archivo)[1]);
    const mapa = marshalLoad(fs.readFileSync(path.join(DATA, archivo)));
    const eventos = mapa.ivars.find(([clave]) => clave === "@events")?.[1]?.pairs ?? [];
    let pokemod = 0;
    let paginas = 0;
    let paginasAutomaticas = 0;
    let autorun = 0;
    let parallel = 0;
    let eventosAutomaticos = 0;
    const porEvento = [];
    for (const [, evento] of eventos) {
      const nombre = texto(evento.getIvar("@name"));
      if (/^PokeMod/i.test(nombre)) pokemod += 1;
      let paginasEvento = 0;
      let automaticasEvento = 0;
      for (const pagina of evento.getIvar("@pages") ?? []) {
        paginas += 1;
        paginasEvento += 1;
        const trigger = Number(pagina.getIvar("@trigger"));
        if (trigger === 3) autorun += 1;
        else if (trigger === 4) parallel += 1;
        if (trigger === 3 || trigger === 4) { paginasAutomaticas += 1; automaticasEvento += 1; }
      }
      if (automaticasEvento > 0) {
        eventosAutomaticos += 1;
        porEvento.push({ nombre, paginas: paginasEvento, automaticas: automaticasEvento });
      }
    }
    const bgm = mapa.ivars.find(([clave]) => clave === "@bgm")?.[1];
    const bgs = mapa.ivars.find(([clave]) => clave === "@bgs")?.[1];
    filas.push({
      id,
      nombre: nombres.get(id) ?? "",
      familia: familiaDe(id),
      eventos: eventos.length,
      pokemod,
      paginas,
      paginasAutomaticas,
      autorun,
      parallel,
      eventosAutomaticos,
      automaticosPorEvento: porEvento.sort((a, b) => b.automaticas - a.automaticas || a.nombre.localeCompare(b.nombre)).slice(0, 3),
      bgm: texto(bgm?.getIvar?.("name") ?? ""),
      bgs: texto(bgs?.getIvar?.("name") ?? ""),
    });
  }
  return filas.sort((a, b) => a.id - b.id);
}

/** Nombres de audio que el juego pide: de los mapas (bgm/bgs) y de los comandos 241/245/249/250. */
export function referenciasDeAudio(filas) {
  const referencias = new Set();
  for (const fila of filas) {
    if (fila.bgm) referencias.add(`BGM/${fila.bgm}`);
    if (fila.bgs) referencias.add(`BGS/${fila.bgs}`);
  }
  const tipos = { 241: "BGM", 245: "BGS", 249: "ME", 250: "SE" };
  for (const archivo of fs.readdirSync(DATA).filter((nombre) => /^Map\d+\.rxdata$/.test(nombre))) {
    const mapa = marshalLoad(fs.readFileSync(path.join(DATA, archivo)));
    const eventos = mapa.ivars.find(([clave]) => clave === "@events")?.[1]?.pairs ?? [];
    for (const [, evento] of eventos) {
      for (const pagina of evento.getIvar("@pages") ?? []) {
        for (const comando of pagina.getIvar("@list") ?? []) {
          const tipo = tipos[Number(comando.getIvar("@code"))];
          if (!tipo) continue;
          const parametros = comando.getIvar("@parameters") ?? [];
          const nombre = texto(parametros[0]?.getIvar?.("name") ?? parametros[0]);
          if (nombre) referencias.add(`${tipo}/${nombre}`);
        }
      }
    }
  }
  return referencias;
}

/** Archivos de audio con cero bytes, duplicados exactos y si están referenciados. */
export function auditarAudio(referencias) {
  const base = path.join(GAME, "Audio");
  const archivos = [];
  const recorrer = (directorio, relativo = "") => {
    if (!fs.existsSync(directorio)) return;
    for (const entrada of fs.readdirSync(directorio, { withFileTypes: true })) {
      const absoluto = path.join(directorio, entrada.name);
      const rel = relativo ? `${relativo}/${entrada.name}` : entrada.name;
      if (entrada.isDirectory()) recorrer(absoluto, rel);
      else archivos.push({ rel, absoluto, bytes: fs.statSync(absoluto).size });
    }
  };
  recorrer(base);
  const porHuella = new Map();
  const cero = [];
  for (const archivo of archivos) {
    if (archivo.bytes === 0) { cero.push(archivo.rel); continue; }
    const huella = crypto.createHash("sha256").update(fs.readFileSync(archivo.absoluto)).digest("hex");
    const clave = `${archivo.bytes}:${huella}`;
    if (!porHuella.has(clave)) porHuella.set(clave, []);
    porHuella.get(clave).push(archivo.rel);
  }
  const sinExtension = (ruta) => ruta.replace(/\.[^.]+$/, "");
  // El nombre puede venir con extensión («TeamRocket.ogg») o sin ella: se comparan sin extensión.
  const normalizar = (ruta) => ruta.replace(/\.[^.]+$/, "").toLowerCase();
  const indice = new Set(archivos.map((archivo) => normalizar(archivo.rel)));
  const faltantes = [...referencias].filter((referencia) => !indice.has(normalizar(referencia))).sort();
  const grupos = [...porHuella.values()]
    .filter((lista) => lista.length > 1)
    .map((lista) => ({
      archivos: lista.sort(),
      bytes: fs.statSync(path.join(base, lista[0])).size,
      referenciados: lista.filter((ruta) => referencias.has(sinExtension(ruta))).length,
    }))
    .sort((a, b) => b.bytes * b.archivos.length - a.bytes * a.archivos.length || a.archivos[0].localeCompare(b.archivos[0]));
  const sinReferencia = grupos.filter((grupo) => grupo.referenciados === 0);
  return {
    archivos: archivos.length,
    bytes: archivos.reduce((total, archivo) => total + archivo.bytes, 0),
    ceroBytes: cero,
    referencias: referencias.size,
    faltantes,
    gruposDuplicados: grupos.length,
    archivosDuplicados: grupos.reduce((total, grupo) => total + grupo.archivos.length, 0),
    gruposConReferencias: grupos.length - sinReferencia.length,
    gruposSinReferencias: sinReferencia.length,
    ahorroPotencialBytes: sinReferencia.reduce((total, grupo) => total + grupo.bytes * (grupo.archivos.length - 1), 0),
    grupos: grupos.slice(0, 40),
  };
}

/** Archivos versionados que pasan del techo del plan. */
export function archivosGrandes(techoMiB = PRESUPUESTO.mibVersionado) {
  const salida = execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, encoding: "buffer", maxBuffer: 64 * 1024 * 1024 });
  const rutas = salida.toString("utf8").split("\0").filter(Boolean);
  // El total de bytes versionados cambia con cada commit, así que no se congela en el
  // artefacto: sólo se guarda la lista de archivos sobre el techo, que sí es estable.
  const grandes = [];
  let total = 0;
  for (const ruta of rutas) {
    const absoluto = path.join(ROOT, ruta);
    if (!fs.existsSync(absoluto)) continue;
    const bytes = fs.statSync(absoluto).size;
    total += bytes;
    if (bytes > techoMiB * 1024 * 1024) grandes.push({ ruta, bytes, mib: Number((bytes / 1048576).toFixed(2)) });
  }
  return {
    techoMiB,
    archivosVersionados: rutas.length,
    mibVersionados: Number((total / 1048576).toFixed(2)),
    grandes: grandes.sort((a, b) => b.bytes - a.bytes),
  };
}

/** Presupuesto aplicado a la huella del mod, con excepciones declaradas. */
export function aplicarPresupuesto(filas, excepciones = []) {
  const declaradas = new Map(excepciones.map((entrada) => [entrada.mapId, entrada]));
  const huella = filas.filter((fila) => fila.pokemod > 0);
  const excesos = [];
  for (const fila of huella) {
    const porEventos = fila.eventos > PRESUPUESTO.eventosPorMapa;
    const porAutomaticos = fila.eventosAutomaticos > PRESUPUESTO.eventosAutomaticosPorMapa;
    if (!porEventos && !porAutomaticos) continue;
    const declarada = declaradas.get(fila.id);
    excesos.push({
      mapId: fila.id,
      nombre: fila.nombre,
      familia: fila.familia,
      eventos: fila.eventos,
      pokemod: fila.pokemod,
      eventosAutomaticos: fila.eventosAutomaticos,
      paginasAutomaticas: fila.paginasAutomaticas,
      autorun: fila.autorun,
      parallel: fila.parallel,
      porEventos,
      porAutomaticos,
      exceso: {
        eventos: Math.max(0, fila.eventos - PRESUPUESTO.eventosPorMapa),
        automaticos: Math.max(0, fila.eventosAutomaticos - PRESUPUESTO.eventosAutomaticosPorMapa),
      },
      automaticosPorEvento: fila.automaticosPorEvento ?? [],
      declarada: declarada ? { motivo: declarada.motivo, responsable: declarada.responsable, estado: declarada.estado } : null,
      sinDeclarar: !declarada,
    });
  }
  return {
    presupuesto: PRESUPUESTO,
    mapasConHuella: huella.length,
    mapasBajoPresupuesto: huella.length - excesos.length,
    excesos,
    sinDeclarar: excesos.filter((exceso) => exceso.sinDeclarar),
    declaradasSinExceso: excepciones.filter((entrada) => !excesos.some((exceso) => exceso.mapId === entrada.mapId)).map((entrada) => entrada.mapId),
  };
}

// ------------------------------------------------------------------ medición
export function medir() {
  const filas = medirMapas();
  const referencias = referenciasDeAudio(filas);
  const porFamilia = {};
  for (const fila of filas) {
    const acumulado = porFamilia[fila.familia] ?? { mapas: 0, eventos: 0, automaticos: 0, paginasAutomaticas: 0, maxEventos: 0, maxAutomaticos: 0, conHuella: 0 };
    acumulado.mapas += 1;
    acumulado.eventos += fila.eventos;
    acumulado.automaticos += fila.eventosAutomaticos;
    acumulado.paginasAutomaticas += fila.paginasAutomaticas;
    acumulado.maxEventos = Math.max(acumulado.maxEventos, fila.eventos);
    acumulado.maxAutomaticos = Math.max(acumulado.maxAutomaticos, fila.eventosAutomaticos);
    if (fila.pokemod > 0) acumulado.conHuella += 1;
    porFamilia[fila.familia] = acumulado;
  }
  const pesos = {};
  for (const carpeta of ["Data", "Graphics", "Audio"]) {
    let bytes = 0;
    let archivos = 0;
    const recorrer = (directorio) => {
      if (!fs.existsSync(directorio)) return;
      for (const entrada of fs.readdirSync(directorio, { withFileTypes: true })) {
        const absoluto = path.join(directorio, entrada.name);
        if (entrada.isDirectory()) recorrer(absoluto);
        else { bytes += fs.statSync(absoluto).size; archivos += 1; }
      }
    };
    recorrer(path.join(GAME, carpeta));
    pesos[carpeta] = { bytes, archivos, mib: Number((bytes / 1048576).toFixed(2)) };
  }
  return {
    filas,
    mapas: filas.length,
    eventos: filas.reduce((total, fila) => total + fila.eventos, 0),
    automaticos: filas.reduce((total, fila) => total + fila.eventosAutomaticos, 0),
    paginasAutomaticas: filas.reduce((total, fila) => total + fila.paginasAutomaticas, 0),
    porFamilia,
    pesos,
    audio: auditarAudio(referencias),
    referenciasDeAudio: referencias.size,
    grandes: archivosGrandes(),
  };
}

/** La regla, aislada de la medición: un exceso sin declarar es un fallo. */
export function evaluarRegla(presupuesto_) {
  const problemas = presupuesto_.sinDeclarar.map((exceso) => ({
    mapId: exceso.mapId,
    motivo: `mapa ${exceso.mapId} con ${exceso.eventos} eventos y ${exceso.eventosAutomaticos} eventos automáticos, sin excepción declarada`,
  }));
  const deudas = presupuesto_.excesos
    .filter((exceso) => exceso.declarada && exceso.declarada.estado !== "heredado")
    .map((exceso) => ({ mapId: exceso.mapId, nombre: exceso.nombre, estado: exceso.declarada.estado, responsable: exceso.declarada.responsable }));
  return { ok: problemas.length === 0, problemas, deudas };
}

// ------------------------------------------------------------------ excepciones
/**
 * Excepciones declaradas. Cada una dice **por qué** el mapa pasa del techo —
 * con el evento que concentra los procesos, no con una frase genérica — y
 * **quién** responde. `heredado` = la densidad viene del juego base o de la
 * campaña y el mod sólo añade contenido encima; `en_revision` = el exceso es del
 * mod y queda como deuda del carril de rendimiento, con el mapa a la vista.
 */
export function excepcionesDeclaradas(presupuesto_, filas) {
  const porId = new Map(filas.map((fila) => [fila.id, fila]));
  return presupuesto_.excesos.map((exceso) => {
    const fila = porId.get(exceso.mapId);
    const heredado = fila && fila.pokemod < 20 && fila.familia === "base";
    const dominante = (exceso.automaticosPorEvento ?? [])[0];
    const detalleAutomaticos = exceso.eventosAutomaticos
      ? `${exceso.eventosAutomaticos} eventos con página automática (${exceso.autorun} autorun, ${exceso.parallel} paralelas en ${exceso.paginasAutomaticas} páginas)`
      : "ningún evento con página automática: el exceso es sólo de número de eventos, no de procesos";
    const quien = dominante && dominante.automaticas > 1
      ? `; el evento «${dominante.nombre}» concentra ${dominante.automaticas} de esas páginas en ${dominante.paginas} páginas`
      : "";
    return {
      mapId: exceso.mapId,
      nombre: exceso.nombre,
      familia: exceso.familia,
      eventos: exceso.eventos,
      pokemod: exceso.pokemod,
      eventosAutomaticos: exceso.eventosAutomaticos,
      motivo: heredado
        ? `mapa del juego base con ${exceso.eventos} eventos de los que sólo ${exceso.pokemod} son del mod: la densidad viene de la campaña original; ${detalleAutomaticos}${quien}`
        : `mapa ${exceso.familia} con ${exceso.eventos} eventos (${exceso.pokemod} del mod); ${detalleAutomaticos}${quien}`,
      responsable: heredado ? "juego base (no se recorta sin partida)" : "carril de rendimiento del plan 2700",
      estado: heredado ? "heredado" : "en_revision",
    };
  });
}

// ------------------------------------------------------------------ acta
function acta(medicion, presupuesto_, regla) {
  const excesos = presupuesto_.excesos.map((exceso) => `| ${exceso.mapId} | ${exceso.nombre} | ${exceso.familia} | ${exceso.eventos} | ${exceso.pokemod} | ${exceso.eventosAutomaticos} | ${exceso.autorun}/${exceso.parallel} | ${exceso.declarada.estado} |`).join("\n");
  const familias = Object.entries(medicion.porFamilia).map(([familia, datos]) => `| ${familia} | ${datos.mapas} | ${datos.conHuella} | ${datos.eventos} | ${datos.maxEventos} | ${datos.maxAutomaticos} |`).join("\n");
  const duplicados = medicion.audio.grupos.slice(0, 10).map((grupo) => `| ${grupo.archivos.join(" = ")} | ${(grupo.bytes / 1024).toFixed(0)} KiB | ${grupo.referenciados}/${grupo.archivos.length} |`).join("\n");
  return `# Presupuesto de rendimiento por mapa

Generado por \`tools/qa/rendimiento_presupuesto.mjs\`; exigido en CI por
\`npm run verify:rendimiento:presupuesto\`.

## Definiciones

- **Evento**: cada entrada de \`@events\` del mapa compilado.
- **Evento automático**: evento con alguna página *autorun* (trigger 3) o *paralela*
  (trigger 4). Son las dos únicas que el motor ejecuta sin que el jugador las toque
  (0 acción, 1 toque del jugador, 2 toque del evento, 3 autorun, 4 paralelo).
- **Huella del mod**: eventos cuyo nombre empieza por «PokeMod». El presupuesto se aplica a
  los ${presupuesto_.mapasConHuella} mapas con huella, no a los del juego base que el mod no reescribe.

## Techos y estado

| Techo | Valor | Mapas por encima |
|---|---:|---:|
| Eventos por mapa | ${PRESUPUESTO.eventosPorMapa} | ${presupuesto_.excesos.filter((exceso) => exceso.porEventos).length} |
| Eventos automáticos por mapa | ${PRESUPUESTO.eventosAutomaticosPorMapa} | ${presupuesto_.excesos.filter((exceso) => exceso.porAutomaticos).length} |
| Archivo versionado | ${PRESUPUESTO.mibVersionado} MiB | ${medicion.grandes.grandes.length} |

Las **páginas** automáticas también se miden (${medicion.paginasAutomaticas} en ${medicion.automaticos} eventos de todo el
juego, referencia de ${PRESUPUESTO.paginasAutomaticasPorMapa} por mapa) pero no se ponen como techo: un evento ejecuta una sola
página a la vez, así que un evento con 33 páginas paralelas cuesta **un** proceso, no 33.

Ningún exceso puede existir sin una excepción declarada: eso es lo que comprueba la puerta.
Un exceso declarado no es un aprobado: queda con dueño y con su nombre en esta tabla.

## Excesos declarados

| Mapa | Nombre | Familia | Eventos | Del mod | Eventos automáticos | Páginas autorun/paralelo | Estado |
|---|---|---:|---:|---:|---:|---|---|
${excesos}

## Por qué cada exceso pasa del techo

${presupuesto_.excesos.map((exceso) => `- **${exceso.mapId} · ${exceso.nombre}** (${exceso.declarada.estado}): ${exceso.declarada.motivo}.`).join("\n")}

Decisión de esta fase: **no se recorta ningún mapa sin una partida**. Borrar páginas paralelas de un
mapa compilado puede dejar una escena automática a medias (una puerta que ya no se abre, un cartel que
ya no aparece) y el plan prohíbe cerrar algo así sin verlo. Los ${regla.deudas.length} excesos propios
del mod quedan como deuda con dueño, medidos y visibles; los heredados del juego base no se tocan.

## Densidad por familia

| Familia | Mapas | Con huella | Eventos | Máx. eventos | Máx. eventos automáticos |
|---|---:|---:|---:|---:|---:|
${familias}

## Peso del juego

| Carpeta | Archivos | MiB |
|---|---:|---:|
${Object.entries(medicion.pesos).map(([carpeta, datos]) => `| ${carpeta} | ${datos.archivos} | ${datos.mib} |`).join("\n")}

## Audio

${medicion.audio.archivos} archivos · ${medicion.audio.ceroBytes.length} de cero bytes · ${medicion.audio.gruposDuplicados} grupos duplicados exactos (${medicion.audio.archivosDuplicados} archivos) ·
${medicion.audio.gruposConReferencias} grupos con algún nombre referenciado y ${medicion.audio.gruposSinReferencias} sin referencia.

Un duplicado **referenciado** no se borra: dos nombres iguales de contenido pueden estar
pedidos por mapas distintos y borrar uno rompe la referencia. Sólo los grupos sin ninguna
referencia serían eliminables (${(medicion.audio.ahorroPotencialBytes / 1048576).toFixed(2)} MiB), y
tampoco se borran en esta fase: el motor puede cargar pistas por nombre construido, así que el
recorte exige una sesión que escuche el juego. Queda medido, con dueño y sin ejecutar.

### Referencias sin archivo

${medicion.audio.faltantes.length ? medicion.audio.faltantes.map((nombre) => `- \`${nombre}\` — pedido por un mapa o evento y sin archivo homónimo`).join("\n") : "- ninguna"}

Son ${medicion.audio.faltantes.length} nombres que el juego pide y no existen: quedan sonando en silencio. Vienen de mapas
del juego base (no del mod) y arreglarlos exige o bien autorar el audio o bien editar el mapa compilado;
ninguna de las dos cosas se hace sin una partida, así que se declaran aquí en vez de taparse.

| Grupo (duplicados exactos) | Tamaño | Referenciados |
|---|---:|---:|
${duplicados}

## Repositorio

Archivos versionados por encima del techo de ${PRESUPUESTO.mibVersionado} MiB (el total del repositorio cambia con cada
commit y se publica en \`rendimiento.md\`, no aquí):

${medicion.grandes.grandes.length ? medicion.grandes.grandes.map((archivo) => `- \`${archivo.ruta}\` — ${archivo.mib} MiB`).join("\n") : "- ninguno"}

Los ZIP son entregables declarados en \`content/artifact_budget.json\` y los reconstruyen sus
scripts; el corpus de QA de Arceus Omega pasa a versionarse comprimido
(\`content/arceus_omega_qa_matrix.jsonl.gz\`, 3,88 MiB en vez de 62,46 MiB), así que el techo de
20 MiB queda sólo para los dos ZIP de entrega.

## Resultado

- Excesos sin declarar: ${regla.problemas.length}.
- Deudas del carril de rendimiento: ${regla.deudas.length} (mapas con exceso propio, con dueño asignado).
- Runtime (FPS, memoria, arranque, cargas por región): **pendiente de hardware**, ver
  [\`rendimiento.md\`](rendimiento.md).
`;
}

// ------------------------------------------------------------------ autoprueba
function selftest() {
  const filas = [
    { id: 1, familia: "base", eventos: 10, pokemod: 2, autorun: 1, parallel: 1, eventosAutomaticos: 2, paginasAutomaticas: 2 },
    { id: 2, familia: "atlas", eventos: 80, pokemod: 40, autorun: 2, parallel: 1, eventosAutomaticos: 3, paginasAutomaticas: 3 },
    { id: 3, familia: "glazed", eventos: 30, pokemod: 5, autorun: 5, parallel: 9, eventosAutomaticos: 14, paginasAutomaticas: 14 },
    { id: 4, familia: "base", eventos: 200, pokemod: 0, autorun: 0, parallel: 0, eventosAutomaticos: 0, paginasAutomaticas: 0 },
    { id: 5, familia: "horizontes", eventos: 40, pokemod: 10, autorun: 0, parallel: 12, eventosAutomaticos: 12, paginasAutomaticas: 12 },
    { id: 6, familia: "unbound", eventos: 61, pokemod: 61, autorun: 0, parallel: 0, eventosAutomaticos: 0, paginasAutomaticas: 0 },
  ];
  const casos = [
    { nombre: "sin excepciones, tres excesos sin declarar", excepciones: [], esperaFallos: 3 },
    { nombre: "declarado el mapa 2, quedan el 3 y el 6", excepciones: [{ mapId: 2, motivo: "x", responsable: "y", estado: "en_revision" }], esperaFallos: 2 },
    { nombre: "declarados los tres, ninguno sin declarar", excepciones: [{ mapId: 2, motivo: "x", responsable: "y", estado: "en_revision" }, { mapId: 3, motivo: "x", responsable: "y", estado: "heredado" }, { mapId: 6, motivo: "x", responsable: "y", estado: "en_revision" }], esperaFallos: 0 },
  ];
  const fallos = [];
  for (const caso of casos) {
    const presupuesto_ = aplicarPresupuesto(filas, caso.excepciones);
    const regla = evaluarRegla(presupuesto_);
    if (regla.problemas.length !== caso.esperaFallos) fallos.push(`${caso.nombre}: esperaba ${caso.esperaFallos} y salió ${regla.problemas.length}`);
  }
  const soloBase = aplicarPresupuesto(filas, []).excesos.map((exceso) => exceso.mapId);
  if (soloBase.includes(4)) fallos.push("un mapa sin huella del mod no puede entrar en el presupuesto");
  if (!soloBase.includes(6)) fallos.push("un mapa con 61 eventos y cero automáticos tiene que ser exceso por eventos");
  // El techo es estricto: 12 eventos automáticos no es exceso; 14 sí.
  if (soloBase.includes(5)) fallos.push("un mapa con exactamente 12 eventos automáticos no puede ser exceso");
  if (!soloBase.includes(3)) fallos.push("un mapa con 14 eventos automáticos y huella del mod tiene que ser exceso");
  if (fallos.length) {
    console.error(`✘ Autoprueba del presupuesto: ${fallos.length} fallo(s)`);
    for (const fallo of fallos) console.error(`   · ${fallo}`);
    process.exit(1);
  }
  console.log(`✔ Autoprueba del presupuesto: ${casos.length + 4} casos, regla aislada de la medición`);
}

if (SELFTEST) {
  selftest();
  process.exit(0);
}

const medicion = medir();
const previo = fs.existsSync(path.join(ROOT, SALIDA_JSON))
  ? JSON.parse(fs.readFileSync(path.join(ROOT, SALIDA_JSON), "utf8"))
  : null;
const sinExcepciones = aplicarPresupuesto(medicion.filas, []);
// Las excepciones se recalculan de la medición, pero el estado y el responsable de las ya
// declaradas se respetan: un cambio de estado es una decisión, no un efecto de la medición.
const previas = new Map((previo?.excepciones ?? []).map((entrada) => [entrada.mapId, entrada]));
const excepciones = excepcionesDeclaradas(sinExcepciones, medicion.filas).map((entrada) => {
  const anterior = previas.get(entrada.mapId);
  return anterior && anterior.estado !== entrada.estado && anterior.estado === "heredado"
    ? { ...entrada, estado: anterior.estado, responsable: anterior.responsable }
    : entrada;
});
const presupuesto_ = aplicarPresupuesto(medicion.filas, excepciones);
const regla = evaluarRegla(presupuesto_);

const artefacto = {
  schema: "plan2700_rendimiento/1.0",
  fuente: "pokemon_fire_ash/Data/Map*.rxdata + pokemon_fire_ash/Audio/* + git ls-files",
  presupuesto: PRESUPUESTO,
  medicion: {
    mapas: medicion.mapas,
    eventos: medicion.eventos,
    eventosAutomaticos: medicion.automaticos,
    paginasAutomaticas: medicion.paginasAutomaticas,
    porFamilia: medicion.porFamilia,
    pesos: medicion.pesos,
    audio: { ...medicion.audio, grupos: medicion.audio.grupos.slice(0, 40) },
    referenciasDeAudio: medicion.referenciasDeAudio,
    // Sólo la lista estable: los totales del repositorio se imprimen por consola.
    grandes: { techoMiB: medicion.grandes.techoMiB, grandes: medicion.grandes.grandes },
  },
  excepciones,
  resultado: {
    mapasConHuella: presupuesto_.mapasConHuella,
    bajoPresupuesto: presupuesto_.mapasBajoPresupuesto,
    excesos: presupuesto_.excesos.length,
    sinDeclarar: regla.problemas.length,
    deudas: regla.deudas,
  },
  verdict: regla.ok ? "static_pass_manual_runtime_pending" : "exceso_sin_declarar",
};

const destinos = new Map([
  [SALIDA_JSON, `${JSON.stringify(artefacto, null, 2)}\n`],
  [SALIDA_MD, acta(medicion, presupuesto_, regla)],
]);
for (const [relativa, contenido] of destinos) {
  const destino = path.join(ROOT, relativa);
  if (VERIFY) {
    if (!fs.existsSync(destino)) throw new Error(`falta ${relativa}; ejecuta sin --verify`);
    if (fs.readFileSync(destino, "utf8") !== contenido) throw new Error(`${relativa} está desactualizado; vuelve a ejecutar la medición`);
  } else {
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, contenido);
  }
  if (JSON_OUT && relativa === SALIDA_JSON) console.log(contenido);
}

if (!JSON_OUT) {
  console.log(`Rendimiento · ${medicion.mapas} mapas · ${medicion.eventos} eventos · ${medicion.automaticos} automáticos · huella del mod en ${presupuesto_.mapasConHuella} mapas`);
  console.log(`  excesos ${presupuesto_.excesos.length} (sin declarar ${regla.problemas.length}) · deudas ${regla.deudas.length}`);
  console.log(`  audio ${medicion.audio.archivos} archivos · ${medicion.audio.gruposDuplicados} grupos duplicados · ${medicion.audio.ceroBytes.length} de cero bytes`);
  console.log(`  repositorio ${medicion.grandes.mibVersionados} MiB en ${medicion.grandes.archivosVersionados} archivos · ${medicion.grandes.grandes.length} sobre ${PRESUPUESTO.mibVersionado} MiB`);
  if (!regla.ok) {
    console.error("Hay mapas por encima del presupuesto sin excepción declarada.");
    process.exit(1);
  }
  console.log(VERIFY ? "✔ artefacto y acta al día." : "✔ artefacto y acta escritos.");
}
if (JSON_OUT && !regla.ok) process.exit(1);
