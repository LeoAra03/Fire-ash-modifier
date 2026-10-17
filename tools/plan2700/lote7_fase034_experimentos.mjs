#!/usr/bin/env node
/**
 * FASE 034 — protocolo y registro de experimentos de diseño.
 *
 * Genera hipótesis y medidas reproducibles para 25 experimentos. No escribe
 * resultados de participantes: hasta que una persona ejecute la prueba, cada
 * conclusión permanece manual_pending.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
const OUT = path.join(ROOT, "content", "lote7_fase034_experimentos.json");
const VERIFY = process.argv.includes("--verify");
const protocolFile = path.join(ROOT, "docs/qa/protocolo_experimento.md");
const measures = {
  time: { unit: "seconds", definition: "tiempo desde la instrucción hasta completar el objetivo; registrar mediana y rango", capture: "cronómetro visible para el observador" },
  stuck: { unit: "events", definition: "atasco cuando la persona nueva permanece más de 120 segundos sin progreso ni decisión", capture: "mapa, minuto y pista solicitada" },
  defeats: { unit: "count", definition: "derrotas contra un jefe desde el mismo estado inicial", capture: "jefe, nivel, equipo, intentos y motivo declarado" },
  abandonment: { unit: "map_or_minute", definition: "punto donde la persona deja de jugar o expresa que no continuará", capture: "mapa, minuto, causa textual no identificable" },
  comprehension: { unit: "rubric_0_to_3", definition: "recuerdo cinco minutos después: 0 no recuerda, 1 detalle aislado, 2 idea correcta, 3 objetivo y consecuencia correctos", capture: "respuesta literal anonimizada y puntuación" },
  discovery: { unit: "count", definition: "hallazgos opcionales encontrados sin guía", capture: "lista de hallazgos y tiempo" },
  satisfaction: { unit: "rubric_1_to_5", definition: "valoración declarada del final/recompensa, siempre acompañada de un porqué", capture: "puntuación y explicación breve" },
};
const experiments = [
  [1, "primer jefe por región", "La dificultad del primer jefe permite aprender sin trivializar la respuesta.", ["defeats", "time", "abandonment"], "cinco jugadores nuevos por región; misma versión y estado inicial", "ajustar solo si la medida se desvía del rango definido y repetir con grupo independiente"],
  [2, "arranque del postgame", "Una persona nueva puede explicar Fragmento, dimensiones y siguiente objetivo tras la primera escena.", ["comprehension", "stuck"], "cinco personas nuevas, sin documentación externa", "reescribir la escena solo con hipótesis previa y repetir"],
  [3, "orientación en Atlas Mil", "Las señales del circuito evitan atascos en las primeras veinte franjas.", ["stuck", "time"], "cinco personas nuevas con ruta libre", "añadir señal solo en el punto observado y repetir"],
  [4, "identidad de siete regiones", "Las regiones se distinguen por captura, símbolo, paleta y música sin texto explicativo.", ["comprehension", "satisfaction"], "mostrar las mismas capturas/fragmentos a cinco personas nuevas", "rediseñar únicamente la región confundida y documentar la diferencia"],
  [5, "efecto de las emisiones", "Cada emisión produce tensión en los primeros dos minutos sin susto gratuito.", ["time", "comprehension", "satisfaction"], "cinco personas nuevas por emisión; volumen y configuración declarados", "cambiar ritmo/sonido/luz con hipótesis, no añadir gore"],
  [6, "arco de Team Rocket", "La persona puede resumir el arco sin invertir causa y consecuencia.", ["comprehension", "abandonment"], "cinco personas nuevas al terminar la misión", "corregir la escena concreta que se interpreta al revés"],
  [7, "finales regionales", "El cierre paga la promesa de la región y se entiende por qué termina.", ["satisfaction", "comprehension", "abandonment"], "cinco personas nuevas por final", "reescribir el cierre débil y volver a medir"],
  [8, "resumen de progreso", "El jugador sabe qué le falta sin salir del juego.", ["time", "comprehension", "stuck"], "cinco personas nuevas con una lista de objetivos mezclados", "añadir información faltante sin destripes"],
  [9, "economía percibida", "El dinero disponible no fuerza ni elimina la decisión de curar/comprar en cada tercio.", ["time", "satisfaction", "abandonment"], "cinco personas nuevas por tercio con estado equivalente", "ajustar precios/recompensas y repetir; no usar opinión aislada"],
  [10, "ritmo de misiones Rocket", "Cada misión conserva su dilema y no se alarga sin aportar.", ["time", "abandonment", "satisfaction"], "cinco personas nuevas, medir cada misión por separado", "recortar solo tramos sin información ni decisión"],
  [11, "exploración de cuevas", "Las bifurcaciones y recompensas hacen que la persona explore en vez de ir a la salida.", ["discovery", "time", "stuck"], "cinco personas nuevas, sin mapa externo", "añadir recompensa donde la decisión no se lee"],
  [12, "puzles de gimnasio", "La idea central se puede explicar y no se resuelve por prueba y error puro.", ["time", "stuck", "comprehension"], "cinco personas nuevas por puzle", "rediseñar la regla central y repetir"],
  [13, "legibilidad nocturna", "Camino y pared se distinguen sin perder atmósfera.", ["stuck", "time", "satisfaction"], "cinco personas nuevas en ciudades nuevas de noche", "ajustar tinte/contraste con una hipótesis previa"],
  [14, "menús nuevos", "Las funciones nuevas se encuentran sin explicación del observador.", ["time", "stuck", "comprehension"], "cinco personas nuevas con tareas aleatorizadas", "reordenar solo la función que nadie encuentra"],
  [15, "valor de recompensas", "La recompensa deseada se recuerda y tiene efecto visible.", ["comprehension", "satisfaction", "discovery"], "cinco personas nuevas tras hitos comparables", "sustituir una recompensa olvidada y repetir"],
  [16, "peso de diálogos", "Los saltos de texto señalan exceso de carga y no falta de interés aislada.", ["time", "abandonment", "comprehension"], "cinco personas nuevas; registrar saltos sin juzgar a la persona", "recortar texto solo si no elimina información"],
  [17, "objetos parecidos", "Nombre e icono permiten distinguir objetos similares.", ["time", "comprehension", "stuck"], "cinco personas nuevas con inventario controlado", "renombrar o redibujar la pareja confundida"],
  [18, "mochila en combate", "La libertad de mochila no vuelve trivial el combate.", ["defeats", "time", "satisfaction"], "cinco personas nuevas con jefe y recursos equivalentes", "ajustar jefe solo si la trivialidad se reproduce"],
  [19, "curva de niveles", "La persona llega al jefe dentro del nivel previsto sin grindeo obligatorio.", ["time", "defeats", "abandonment"], "cinco personas nuevas por región", "ajustar camino antes que inflar el jefe"],
  [20, "rejugabilidad", "Una región terminada conserva un motivo opcional para volver.", ["discovery", "satisfaction", "comprehension"], "cinco personas nuevas tras terminarla; no contar obligación", "añadir contenido opcional solo donde falte motivo"],
  [21, "jefe de Liga Oscura", "El final exige estrategia y no frustra ni aburre.", ["defeats", "time", "satisfaction"], "cinco personas nuevas con expectativas registradas antes", "ajustar y comparar con expectativa, no solo con derrotas"],
  [22, "requisito de Liga Oscura", "La persona puede decir qué falta para entrar sin consultar documentación.", ["comprehension", "stuck", "time"], "cinco personas nuevas antes de entregar una pista", "reescribir el aviso hasta que la causa quede clara"],
  [23, "mapa generado frente a original", "La diferencia artesanal se puede describir sin presentar como artesanal lo que no lo es.", ["satisfaction", "comprehension"], "cinco personas nuevas, comparación ciega y mismo tamaño de captura", "aceptar, mejorar o reducir alcance por escrito"],
  [24, "dos versiones de escena", "Una de dos versiones se recuerda mejor sin aumentar confusión.", ["comprehension", "satisfaction", "abandonment"], "mismo grupo, orden contrabalanceado y versión ciega", "conservar la versión con mejor evidencia y enlazar la decisión"],
  [25, "dos curvas de dificultad", "Una curva reduce derrotas injustas y abandono sin volver trivial la región.", ["defeats", "abandonment", "satisfaction"], "mismo grupo, orden contrabalanceado y dos versiones", "adoptar solo si el resultado se replica y no rompe regiones vecinas"],
].map(([id, title, hypothesis, metrics, sample, decision]) => ({ id, title, hypothesis, metrics, sample, decision, result: null, evidence: [], status: "manual_pending" }));
function validate() {
  const errors = [];
  if (experiments.length !== 25) errors.push("expected-25-experiments");
  const ids = new Set(experiments.map((item) => item.id));
  if (ids.size !== experiments.length) errors.push("duplicate-experiment-id");
  for (const item of experiments) {
    if (!item.hypothesis || !item.metrics.length || !item.sample || !item.decision) errors.push(`incomplete-${item.id}`);
    for (const metric of item.metrics) if (!measures[metric]) errors.push(`unknown-metric-${item.id}-${metric}`);
  }
  return errors;
}
function taskMatrix() {
  const staticIds = new Set([3301, 3302, 3303, 3304, 3305, 3306, 3307, 3308, 3309, 3310, 3396, 3397, 3398, 3399]);
  return Array.from({ length: 100 }, (_, index) => {
    const id = 3300 + index;
    return { id, status: staticIds.has(id) ? "static_pass" : "manual_pending" };
  });
}
const errors = validate();
const report = {
  schema: "lote7_fase034_experimentos/1.0",
  tasks: "3300–3399",
  protocol: {
    hypothesesBeforeChange: true,
    beforeAfterRequired: true,
    measures,
    participantTarget: 5,
    independentReplicationRequired: true,
    noPersonalData: true,
    consentFile: "docs/qa/protocolo_experimento.md",
    offlineCapable: "manual_pending",
    pcAndroidParity: "manual_pending",
  },
  experiments,
  validation: { errors, definitionsComplete: errors.length === 0, noFabricatedResults: experiments.every((item) => item.result === null) },
  taskMatrix: taskMatrix(),
  manual: [
    "reclutar y consentir cinco personas nuevas por experimento cuando corresponda",
    "medir antes/después con la misma versión, estado, orden y configuración declarados",
    "repetir con un segundo grupo; registrar resultados negativos, reversiones y regresiones",
    "no publicar datos personales ni presentar cinco personas como validación estadística",
  ],
  status: errors.length ? "static_review_manual_pending" : "static_pass_manual_pending",
};
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (VERIFY) {
  if (!fs.existsSync(OUT)) throw new Error(`Falta ${path.relative(ROOT, OUT)}`);
  if (fs.readFileSync(OUT, "utf8") !== serialized) throw new Error(`${path.relative(ROOT, OUT)} está desactualizado`);
  if (!fs.existsSync(protocolFile)) throw new Error("Falta docs/qa/protocolo_experimento.md");
} else {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, serialized);
}
console.log(`FASE 034 experimentos: ${report.experiments.length} hipótesis · ${Object.keys(measures).length} medidas · errores ${errors.length} · ${report.status}`);
if (errors.length) process.exitCode = 1;
