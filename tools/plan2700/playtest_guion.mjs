#!/usr/bin/env node
/**
 * playtest_guion.mjs — guion de playtest con cuota de cobertura por sesión.
 *
 * Responde a la pregunta que el plan se hace en la tarea 2192: no «jugar», sino
 * **cuánto** tiene que cubrir cada sesión: mapas visitados, eventos ejecutados y
 * diálogos mostrados, con cifras que sumen el 100 % del contenido del DLC.
 *
 * Las cuotas no se inventan: cada dimensión tiene un total medido en el volcado
 * de diálogos (mapas, eventos y cajas reales) y cada sesión de contenido recibe
 * una fracción de esa dimensión. El script exige que las fracciones de cada
 * dimensión sumen exactamente 1 y reparte el redondeo en la última sesión, de
 * modo que la suma de cuotas coincida con el total **al céntimo de caja**.
 *
 * No simula partidas ni rellena fichas: el estado sigue siendo `manual_pending`
 * hasta que una persona juegue y anote fecha, versión, duración y hallazgos.
 *
 * Uso:
 *   node tools/plan2700/playtest_guion.mjs            # escribe guion y registro
 *   node tools/plan2700/playtest_guion.mjs --verify   # comprueba que están al día
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./tanda_textos_core.mjs";

const VERIFY = process.argv.includes("--verify");
const CONTENT = path.join(ROOT, "content");
const GUION_JSON = "content/plan2700_playtest_guion.json";
const GUION_MD = "docs/qa/playtest_guion.md";
const COBERTURA_MD = "docs/qa/playtest_cobertura.md";

// ------------------------------------------------------------------ títulos reales
/**
 * Los títulos salen de `tareas.txt`: una sesión, una línea «N. Sesión M: …».
 * Si el plan añade una sesión, esta tabla se queda corta y el script falla en
 * vez de inventarse el título.
 */
function titulosDeTareas() {
  const lineas = fs.readFileSync(path.join(ROOT, "tareas.txt"), "utf8").split(/\r?\n/);
  const titulos = new Map();
  for (const [indice, linea] of lineas.entries()) {
    const match = /^\d+\.\s+Sesi[óo]n\s+(\d+):\s+(.+?)\s*$/.exec(linea);
    if (match) titulos.set(Number(match[1]), { id: Number(match[1]), titulo: match[2], linea: indice + 1 });
  }
  return titulos;
}

// ------------------------------------------------------------------ contenido medido
/** Totales por dimensión desde el volcado normalizado: mapas, eventos y cajas. */
function contenidoPorDimension() {
  const volcado = JSON.parse(fs.readFileSync(path.join(CONTENT, "plan2700_dialogos.json"), "utf8"));
  const dimensiones = new Map();
  for (const caja of volcado.dialogos) {
    const fila = dimensiones.get(caja.profile) ?? { perfil: caja.profile, mapas: new Set(), eventos: new Set(), cajas: 0 };
    fila.mapas.add(caja.mapId);
    fila.eventos.add(`${caja.mapId}:${caja.event}`);
    fila.cajas += 1;
    dimensiones.set(caja.profile, fila);
  }
  return new Map([...dimensiones.entries()].map(([perfil, fila]) => [perfil, {
    perfil,
    mapas: fila.mapas.size,
    eventos: fila.eventos.size,
    cajas: fila.cajas,
  }]));
}

// ------------------------------------------------------------------ cuotas
/**
 * Fracción del contenido de cada dimensión que cubre cada sesión.
 *
 * `contenido`: la sesión recorre materia del juego y consume cuota.
 * `soporte`: la sesión repite un tramo ya cubierto (interfaz, mando, editor,
 * estrés, rendimiento, compatibilidad, cierre) o es una corrida de punta a
 * punta: no consume cuota, porque si consumiera se contaría dos veces.
 */
const CUOTAS = [
  // base/dlc — arranque, Arceus, postgame, grietas, Rocket, sistemas
  [1, "base/dlc", 0.05, "contenido"],
  [2, "base/dlc", 0.05, "contenido"],
  [3, "base/dlc", 0.06, "contenido"],
  [4, "base/dlc", 0.05, "contenido"],
  [5, "base/dlc", 0.05, "contenido"],
  [6, "base/dlc", 0.10, "contenido"],
  [9, "base/dlc", 0.08, "contenido"],
  [10, "base/dlc", 0.05, "contenido"],
  [11, "base/dlc", 0.06, "contenido"],
  [15, "base/dlc", 0.04, "contenido"],
  [16, "base/dlc", 0.05, "contenido"],
  [24, "base/dlc", 0.08, "contenido"],
  [25, "base/dlc", 0.04, "contenido"],
  [26, "base/dlc", 0.04, "contenido"],
  [27, "base/dlc", 0.04, "contenido"],
  [28, "base/dlc", 0.04, "contenido"],
  [29, "base/dlc", 0.04, "contenido"],
  [30, "base/dlc", 0.03, "contenido"],
  [31, "base/dlc", 0.03, "contenido"],
  [32, "base/dlc", 0.02, "contenido"],
  // nightmare/multiversal — las siete emisiones
  [7, "nightmare/multiversal", 0.35, "contenido"],
  [8, "nightmare/multiversal", 0.35, "contenido"],
  [6, "nightmare/multiversal", 0.30, "contenido"],
  // atlas
  [12, "atlas", 0.35, "contenido"],
  [13, "atlas", 0.20, "contenido"],
  [14, "atlas", 0.45, "contenido"],
  // campañas invitadas
  [17, "glazed", 0.35, "contenido"],
  [18, "glazed", 0.65, "contenido"],
  [19, "light_platinum", 0.40, "contenido"],
  [20, "light_platinum", 0.60, "contenido"],
  [21, "liquid_crystal", 1.00, "contenido"],
  [22, "tfoh", 1.00, "contenido"],
  [23, "unbound", 1.00, "contenido"],
];

/** Sesiones de soporte: repiten un tramo, no consumen cuota. */
const SOPORTE = new Map([
  [33, "interfaz: ventana pequeña de escritorio"],
  [34, "interfaz: pantalla completa de escritorio"],
  [35, "input: mando"],
  [36, "input: teclado"],
  [37, "android: Kirin"],
  [38, "editor: PokeMod Studio en paralelo"],
  [39, "editor: deshacer y rehacer"],
  [40, "editor: auditoría del contenido nuevo"],
  [41, "editor: exportación ZIP y reimportación"],
  [42, "editor: modo lectura"],
  [43, "estrés: partida larga de cuatro horas"],
  [44, "compatibilidad: guardado antiguo del juego original"],
  [45, "duración: partida nueva hasta el postgame"],
  [46, "estrés: menús en todas las dimensiones"],
  [47, "campo: surf y buceo"],
  [48, "encuentros: pesca"],
  [49, "navegación: vuelo y teletransporte"],
  [50, "tiempo: día y noche"],
  [51, "rendimiento: clima extremo"],
  [52, "render: niebla"],
  [53, "render: restauración del tono"],
  [54, "combate: transiciones nuevas"],
  [55, "combate: animaciones de jefes"],
  [56, "recompensas: únicas tras completar"],
  [57, "revancha: jefes con revancha"],
  [58, "combates: derrota contra jefes obligatorios"],
  [59, "combates: huida y captura especiales"],
  [60, "cierre: partida completa hasta el último diploma"],
]);

const CAMPOS_FICHA = ["fecha", "version_commit", "entorno", "duracion_minutos", "mapas_visitados", "eventos_ejecutados", "dialogos_mostrados", "hallazgos", "capturas", "tasa_descubrimiento"];

function construir() {
  const titulos = titulosDeTareas();
  const dimensiones = contenidoPorDimension();
  const avisos = [];

  // 1) Cada dimensión con cuota tiene que existir en el volcado y sumar 1.
  const porDimension = new Map();
  for (const [sesion, dimension, fraccion, tipo] of CUOTAS) {
    if (!dimensiones.has(dimension)) throw new Error(`la dimensión «${dimension}» no existe en el volcado`);
    if (tipo !== "contenido") throw new Error("CUOTAS solo admite sesiones de contenido");
    if (!titulos.has(sesion)) throw new Error(`la sesión ${sesion} no aparece en tareas.txt`);
    const lista = porDimension.get(dimension) ?? [];
    lista.push({ sesion, fraccion });
    porDimension.set(dimension, lista);
  }
  for (const dimension of dimensiones.keys()) {
    const lista = porDimension.get(dimension);
    if (!lista) {
      avisos.push(`la dimensión «${dimension}» no tiene ninguna sesión de contenido asignada`);
      continue;
    }
    const suma = lista.reduce((total, entrada) => total + entrada.fraccion, 0);
    if (Math.abs(suma - 1) > 1e-9) {
      throw new Error(`las fracciones de «${dimension}» suman ${suma.toFixed(4)}: tienen que sumar 1 (sesiones ${lista.map((e) => e.sesion).join(", ")})`);
    }
  }

  // 2) Cuota por sesión: mapas, eventos y cajas, con el redondeo en la última.
  //    Una sesión puede tocar dos dimensiones (la 6 recorre las grietas del DLC
  //    y las emisiones del multiverso): se guarda una entrada por sesión con una
  //    lista de tramos, no dos fichas con el mismo número.
  const porSesion = new Map();
  for (const [dimension, lista] of porDimension) {
    const total = dimensiones.get(dimension);
    const ordenada = [...lista].sort((a, b) => a.sesion - b.sesion);
    let mapasDados = 0;
    let eventosDados = 0;
    let cajasDadas = 0;
    ordenada.forEach((entrada, indice) => {
      const ultima = indice === ordenada.length - 1;
      const cuota = ultima
        ? { mapas: total.mapas - mapasDados, eventos: total.eventos - eventosDados, cajas: total.cajas - cajasDadas }
        : { mapas: Math.round(entrada.fraccion * total.mapas), eventos: Math.round(entrada.fraccion * total.eventos), cajas: Math.round(entrada.fraccion * total.cajas) };
      mapasDados += cuota.mapas;
      eventosDados += cuota.eventos;
      cajasDadas += cuota.cajas;
      const fila = porSesion.get(entrada.sesion) ?? { tramos: [] };
      fila.tramos.push({ dimension, fraccion: entrada.fraccion, cuota });
      porSesion.set(entrada.sesion, fila);
    });
  }
  const sesiones = [...porSesion.entries()].map(([id, { tramos }]) => {
    const info = titulos.get(id);
    return {
      id,
      titulo: info.titulo,
      lineaTareas: info.linea,
      tipo: "contenido",
      dimensiones: tramos.map((tramo) => tramo.dimension),
      tramos,
      cuota: tramos.reduce((acc, tramo) => ({ mapas: acc.mapas + tramo.cuota.mapas, eventos: acc.eventos + tramo.cuota.eventos, cajas: acc.cajas + tramo.cuota.cajas }), { mapas: 0, eventos: 0, cajas: 0 }),
      carpeta: `docs/qa/playtest/sesion-${String(id).padStart(2, "0")}`,
      estado: "manual_pending",
    };
  });
  for (const [sesion, motivo] of SOPORTE) {
    const info = titulos.get(sesion);
    if (!info) throw new Error(`la sesión de soporte ${sesion} no aparece en tareas.txt`);
    sesiones.push({
      id: sesion,
      titulo: info.titulo,
      lineaTareas: info.linea,
      tipo: "soporte",
      motivo,
      dimensiones: [],
      tramos: [],
      cuota: { mapas: 0, eventos: 0, cajas: 0 },
      repite: [...dimensiones.keys()],
      carpeta: `docs/qa/playtest/sesion-${String(sesion).padStart(2, "0")}`,
      estado: "manual_pending",
    });
  }
  sesiones.sort((a, b) => a.id - b.id);
  const ids = sesiones.map((sesion) => sesion.id);
  const duplicados = ids.filter((id, indice) => ids.indexOf(id) !== indice);
  if (duplicados.length) throw new Error(`sesiones repetidas en el guion: ${duplicados.join(", ")}`);

  // 3) La suma de cuotas tiene que ser el 100 % del contenido, no «casi».
  const sumaCuotas = sesiones.reduce((acc, sesion) => ({
    mapas: acc.mapas + sesion.cuota.mapas,
    eventos: acc.eventos + sesion.cuota.eventos,
    cajas: acc.cajas + sesion.cuota.cajas,
  }), { mapas: 0, eventos: 0, cajas: 0 });
  const totales = [...dimensiones.values()].reduce((acc, dimension) => ({
    mapas: acc.mapas + dimension.mapas,
    eventos: acc.eventos + dimension.eventos,
    cajas: acc.cajas + dimension.cajas,
  }), { mapas: 0, eventos: 0, cajas: 0 });
  for (const clave of ["mapas", "eventos", "cajas"]) {
    if (sumaCuotas[clave] !== totales[clave]) {
      throw new Error(`la suma de cuotas de ${clave} (${sumaCuotas[clave]}) no cubre el total (${totales[clave]})`);
    }
  }

  // 4) La carpeta de cada sesión tiene que existir: el guion no promete lo que no hay.
  const sinCarpeta = sesiones.filter((sesion) => !fs.existsSync(path.join(ROOT, sesion.carpeta, "README.md")));

  return {
    schema: "plan2700_playtest_guion/1.0",
    fuente: "tareas.txt (líneas «Sesión N: …») + content/plan2700_dialogos.json",
    estado: "manual_pending",
    politica: "Una ficha sin fecha, versión, duración y hallazgos no es PASS. Cada hallazgo se clasifica por gravedad (bloqueante, grave, leve, cosmético); este guion fija la cuota y no sustituye la partida.",
    camposFicha: CAMPOS_FICHA,
    dimensiones: [...dimensiones.values()].sort((a, b) => a.perfil.localeCompare(b.perfil)),
    totales,
    sesiones,
    control: {
      sesionesDeContenido: sesiones.filter((sesion) => sesion.tipo === "contenido").length,
      sesionesDeSoporte: sesiones.filter((sesion) => sesion.tipo === "soporte").length,
      sumaDeCuotas: sumaCuotas,
      coberturaDeclarada: "100 % de mapas, eventos y cajas del DLC repartidos entre las sesiones de contenido",
      fichasPresentes: sesiones.length - sinCarpeta.length,
      fichasAusentes: sinCarpeta.map((sesion) => sesion.carpeta),
      avisos,
    },
  };
}

function markdownGuion(guion) {
  const filas = guion.sesiones.map((sesion) => sesion.tipo === "contenido"
    ? `| ${sesion.id} | ${sesion.titulo} | ${sesion.dimensiones.join(" + ")} | ${sesion.cuota.mapas} | ${sesion.cuota.eventos} | ${sesion.cuota.cajas} | \`${sesion.carpeta}\` |`
    : `| ${sesion.id} | ${sesion.titulo} | soporte (${sesion.motivo}) | — | — | — | \`${sesion.carpeta}\` |`).join("\n");
  const dimensiones = guion.dimensiones
    .map((dimension) => `| ${dimension.perfil} | ${dimension.mapas} | ${dimension.eventos} | ${dimension.cajas} |`)
    .join("\n");
  return `# Guion de playtest con cuota de cobertura

Generado por \`tools/plan2700/playtest_guion.mjs\`; verificado por
\`npm run verify:plan2700:tanda23\`. Las cuotas salen del volcado de diálogos: cada
dimensión tiene sus mapas, eventos y cajas contados, y cada sesión de contenido recibe
una fracción que, sumada con las demás de su dimensión, da exactamente 1.

## Contenido a cubrir

El universo es el contenido **con texto de jugador**: mapas que tienen al menos una caja,
eventos que muestran al menos una caja y el total de cajas del volcado. Los mapas con
eventos sin texto (${1887 - 1883} en el proyecto) y los eventos sin cajas no entran en la cuota:
se recorren, pero no se pueden medir por diálogo mostrado.

| Dimensión | Mapas | Eventos con cajas | Cajas |
|---|---:|---:|---:|
${dimensiones}
| **Total** | **${guion.totales.mapas}** | **${guion.totales.eventos}** | **${guion.totales.cajas}** |

## Cuota por sesión

${guion.control.sesionesDeContenido} sesiones de contenido consumen cuota; ${guion.control.sesionesDeSoporte} de soporte
(interfaz, input, Android, editor, estrés, rendimiento, compatibilidad y cierre) repiten
tramos ya cubiertos y **no** consumen cuota: contarlas dos veces inflaría la cobertura.

| Sesión | Título | Dimensión | Mapas | Eventos | Cajas | Ficha |
|---:|---|---|---:|---:|---:|---|
${filas}

## Regla de registro

Cada sesión se anota en su ficha (\`README.md\` de su carpeta) con
${guion.camposFicha.map((campo) => `\`${campo}\``).join(", ")}.
Una ficha vacía o sin evidencia es \`manual_pending\`, no PASS. Los hallazgos van
numerados, con gravedad (\`bloqueante\`, \`grave\`, \`leve\`, \`cosmético\`) y su prueba de
regresión cuando se corrigen.

## Control de esta corrida

- Sesiones: ${guion.sesiones.length} (${guion.control.sesionesDeContenido} de contenido, ${guion.control.sesionesDeSoporte} de soporte).
- Fichas presentes: ${guion.control.fichasPresentes}/${guion.sesiones.length}.
- Suma de cuotas: ${guion.control.sumaDeCuotas.mapas} mapas · ${guion.control.sumaDeCuotas.eventos} eventos · ${guion.control.sumaDeCuotas.cajas} cajas = total medido.
- Estado: \`${guion.estado}\` — el guion está listo y la partida no se ha hecho.
`;
}

function markdownCobertura(guion) {
  const indice = JSON.parse(fs.readFileSync(path.join(CONTENT, "cobertura.json"), "utf8"));
  const ejercido = (indice.records ?? []).map((registro) => `| ${registro.family} | ${registro.candidate} | ${registro.indexed} | ${registro.exercised} | ${registro.status} |`);
  const filas = guion.dimensiones.map((dimension) => {
    const sesiones = guion.sesiones.filter((sesion) => sesion.tipo === "contenido" && sesion.dimensiones.includes(dimension.perfil));
    const cuota = sesiones.reduce((acc, sesion) => ({ mapas: acc.mapas + sesion.cuota.mapas, eventos: acc.eventos + sesion.cuota.eventos, cajas: acc.cajas + sesion.cuota.cajas }), { mapas: 0, eventos: 0, cajas: 0 });
    const cubre = cuota.mapas === dimension.mapas && cuota.eventos === dimension.eventos && cuota.cajas === dimension.cajas ? "sí" : "no";
    return `| ${dimension.perfil} | ${dimension.mapas} | ${dimension.eventos} | ${dimension.cajas} | ${sesiones.map((sesion) => sesion.id).join(", ")} | ${cuota.mapas}/${cuota.eventos}/${cuota.cajas} | ${cubre} | 0 |`;
  }).join("\n");
  return `# Registro de cobertura de playtest

Dos cifras distintas que no se pueden mezclar:

- **Indexado**: lo que el juego contiene y el repositorio ya mide (mapas, eventos, cajas,
  familias de prueba). Está aquí y es reproducible.
- **Ejercido**: lo que una persona ha jugado de verdad. Hoy es **0 en todo** porque no hay
  ninguna sesión ejecutada: el estado de las fichas es \`manual_pending\`.

El índice general está en \`content/cobertura.json\` con la semántica
\`${JSON.parse(fs.readFileSync(path.join(CONTENT, "cobertura.json"), "utf8")).semantics ?? "indexed_not_runtime_exercised"}\`: tener una fila indexada no es haberla jugado.

## Índice del proyecto

| Familia | Candidatos | Indexado | Ejercido | Estado |
|---|---:|---:|---:|---|
${ejercido.join("\n")}

## Cobertura por dimensión y quién la ejerce

| Dimensión | Mapas | Eventos con cajas | Cajas | Sesiones que la cubren | Cuota asignada (mapas/eventos/cajas) | Suma = total | Ejercido |
|---|---:|---:|---:|---|---|---:|---:|
${filas}
| **Total** | **${guion.totales.mapas}** | **${guion.totales.eventos}** | **${guion.totales.cajas}** | — | — | — | **0** |

La suma de cuotas de cada dimensión coincide con su total: el guion no deja contenido
sin sesión asignada. Comprobarlo es parte de \`npm run verify:plan2700:tanda23\`; si alguien
añade contenido nuevo a una dimensión y no lo reparte, la verificación falla.

## Cómo se rellena

1. Al terminar una sesión, anotar en su ficha los mapas visitados (ids), los eventos
   ejecutados (nombre de evento) y los diálogos mostrados (contador de cajas).
2. Volcar esas tres listas en la fila de la dimensión y sumar el ejercido.
3. Un hallazgo \`bloqueante\` se corrige el mismo día y lleva prueba de regresión
   (\`npm run verify:playtest:regresiones\`); uno \`grave\` se corrige antes de la sesión
   siguiente. \`leve\` y \`cosmético\` se agrupan por bloque.
4. No se marca PASS sin fecha, versión, duración y evidencia.
`;
}

const guion = construir();
const salidas = new Map([
  [GUION_JSON, `${JSON.stringify(guion, null, 2)}\n`],
  [GUION_MD, markdownGuion(guion)],
  [COBERTURA_MD, markdownCobertura(guion)],
]);
for (const [relativa, contenido] of salidas) {
  const destino = path.join(ROOT, relativa);
  if (VERIFY) {
    if (!fs.existsSync(destino)) throw new Error(`falta ${relativa}; ejecuta el guion sin --verify`);
    if (fs.readFileSync(destino, "utf8") !== contenido) throw new Error(`${relativa} está desactualizado; vuelve a ejecutar el guion`);
  } else {
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, contenido);
  }
}
console.log(`Guion de playtest: ${guion.sesiones.length} sesiones · ${guion.control.sesionesDeContenido} con cuota · ` +
  `${guion.control.sumaDeCuotas.mapas} mapas / ${guion.control.sumaDeCuotas.eventos} eventos / ${guion.control.sumaDeCuotas.cajas} cajas = total`);
console.log(`  fichas presentes ${guion.control.fichasPresentes}/${guion.sesiones.length} · estado ${guion.estado}`);
if (VERIFY) console.log("✔ guion, registro de cobertura y artefacto están al día.");
