#!/usr/bin/env node
/**
 * tanda_textos_core.mjs — núcleo de auditoría de texto para las tandas del plan.
 *
 * Las tandas de `tareas.txt` que van del cierre de diálogos al cierre de entrega
 * piden cosas muy distintas: revisar una voz, publicar un informe, contar cajas,
 * comprobar que un control de formato detecte lo que dice detectar. Este módulo
 * ofrece lo que todas comparten para no reimplementarlo en cada fase:
 *
 *   · la lectura de una tanda exacta de `tareas.txt` (100 líneas, ids
 *     consecutivos, sin inventar rutas);
 *   · el corpus real del juego, con sus dos fuentes de texto de jugador:
 *       - las cajas de evento (bloques 101/401) que ya vuelca
 *         `tools/plan900/dump_dialogos.mjs` en `content/plan900_dialogos.json`
 *         y normaliza `tools/plan2700/audit_dialogos.mjs` en
 *         `content/plan2700_dialogos.json`;
 *       - los literales de las secciones Ruby `PokeMod_*` de
 *         `Data/Scripts.rxdata`, que es donde viven menús, avisos y mensajes
 *         que no salen de un evento;
 *   · las sondas de comprobación (probes) que cada fase declara y ejecuta;
 *   · un evaluador que asigna a CADA tarea de la tanda un veredicto con dueño,
 *     de modo que ninguna tarea quede sin estado ni sin responsable.
 *
 * Lo que este núcleo NO hace: jugar. Todo lo que exige partida, editor, mando o
 * valoración editorial se marca `manual` con su carril; el informe de la fase
 * lo dice con el mismo número que se mide aquí.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { marshalLoad } from "../../web/js/marshal.js";

export const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
export const CONTENT = path.join(ROOT, "content");
export const DATA = path.join(ROOT, "pokemon_fire_ash", "Data");

/** Una tanda son 100 líneas consecutivas de tareas.txt, contando desde 1. */
export const LINEAS_POR_TANDA = 100;

// ------------------------------------------------------------------ tareas.txt
/**
 * Corta la tanda pedida y comprueba que sean 100 líneas con ids consecutivos.
 * Las líneas de `tareas.txt` son `N. texto`; la cabecera del archivo son las
 * tres primeras líneas, así que la línea `L` del archivo es la tarea `L - 4`.
 */
export function cargarTanda({ desdeLinea, hastaLinea }) {
  const lineas = fs.readFileSync(path.join(ROOT, "tareas.txt"), "utf8").split(/\r?\n/);
  if (hastaLinea - desdeLinea + 1 !== LINEAS_POR_TANDA) {
    throw new Error(`una tanda son ${LINEAS_POR_TANDA} líneas: pediste ${desdeLinea}-${hastaLinea}`);
  }
  const crudas = lineas.slice(desdeLinea - 1, hastaLinea);
  if (crudas.length !== LINEAS_POR_TANDA) throw new Error(`tareas.txt no llega a la línea ${hastaLinea}`);
  const tareas = crudas.map((linea, indice) => {
    const match = /^(\d+)\.\s+(.*\S)\s*$/.exec(linea);
    if (!match) throw new Error(`línea ${desdeLinea + indice} sin formato «N. texto»: ${linea.slice(0, 60)}`);
    return { id: Number(match[1]), texto: match[2], linea: desdeLinea + indice };
  });
  for (let i = 1; i < tareas.length; i++) {
    if (tareas[i].id !== tareas[i - 1].id + 1) {
      throw new Error(`ids no consecutivos en la tanda: ${tareas[i - 1].id} → ${tareas[i].id}`);
    }
  }
  return { lineas: [desdeLinea, hastaLinea], tareas };
}

// ------------------------------------------------------------------ corpus
let corpusCache = null;

const texto = (valor) => valor?.text ?? String(valor ?? "");

/** Nombres de switch y variable tal como los ve el motor (System.rxdata). */
function nombresDelSistema() {
  const system = marshalLoad(fs.readFileSync(path.join(DATA, "System.rxdata")));
  const variables = system.getIvar("@variables") ?? [];
  const switches = system.getIvar("@switches") ?? [];
  return {
    variables,
    switches,
    nombreVariable: (id) => texto(variables[id]).trim(),
    nombreSwitch: (id) => texto(switches[id]).trim(),
  };
}

/** Secciones Ruby del mod, descomprimidas y listas para leer. */
function seccionesRuby() {
  const scripts = marshalLoad(fs.readFileSync(path.join(DATA, "Scripts.rxdata")));
  const salida = [];
  for (const [, nombre, codigo] of scripts) {
    const etiqueta = texto(nombre);
    if (!etiqueta.startsWith("PokeMod_")) continue;
    const crudo = codigo?.bytes ? Buffer.from(codigo.bytes.data ?? codigo.bytes) : Buffer.from(codigo);
    let fuente = "";
    try { fuente = zlib.inflateSync(crudo).toString("utf8"); } catch { fuente = crudo.toString("utf8"); }
    salida.push({ seccion: etiqueta, fuente });
  }
  return salida;
}

/**
 * Códigos de escape que el motor entiende, leídos de `Messages` en cada
 * corrida. No se citan de memoria: si el motor deja de tratar un código, la
 * comprobación de códigos desconocidos cambia de resultado.
 */
function codigosDelMotor() {
  const codigos = new Set(["c", "sp"]); // extensiones PokeMod (color y hablante)
  for (const { seccion, fuente } of seccionesRuby()) {
    if (!/Dialogos|Canon|ZMenu/.test(seccion)) continue;
    for (const match of fuente.matchAll(/\\\\([A-Za-z]{1,4})\s*\[/g)) codigos.add(match[1]);
    for (const match of fuente.matchAll(/["']([A-Za-z]{1,4})\s*["']\s*=>/g)) codigos.add(match[1]);
  }
  // La lista canónica de códigos está en la clase Messages del motor: el
  // interpretador la escribe como una alternancia dentro de un regex Ruby
  //     while text[/(?:\\(f|ff|ts|cl|me|se|wt|wtnp|ch)\[([^\]]*)\]|\\(g|cn|...))/i]
  // y los códigos sin argumento se sustituyen con gsub!(/\\pg/i, …). Se leen de
  // ahí en cada corrida: si el motor deja de tratar uno, el control lo ve.
  const scripts = marshalLoad(fs.readFileSync(path.join(DATA, "Scripts.rxdata")));
  for (const [, nombre, codigo] of scripts) {
    if (!/^(Messages|Intl_Messages|SpriteWindow)/.test(texto(nombre))) continue;
    const crudo = codigo?.bytes ? Buffer.from(codigo.bytes.data ?? codigo.bytes) : Buffer.from(codigo);
    let fuente = "";
    try { fuente = zlib.inflateSync(crudo).toString("utf8"); } catch { continue; }
    for (const match of fuente.matchAll(/\\{2,}\(([A-Za-z|.]{1,80})\)/g)) {
      for (const alternativa of match[1].split("|")) if (/^[A-Za-z]{1,4}$/.test(alternativa)) codigos.add(alternativa);
    }
    for (const match of fuente.matchAll(/gsub!?\(\s*\/\\+([A-Za-z]{1,4})/g)) codigos.add(match[1]);
    for (const match of fuente.matchAll(/when\s+"([A-Za-z]{1,4})"/g)) codigos.add(match[1]);
  }
  return codigos;
}

/** Literales de jugador dentro de las secciones Ruby PokeMod_*. */
function literalesRuby(secciones) {
  const salida = [];
  for (const { seccion, fuente } of secciones) {
    for (const match of fuente.matchAll(/"((?:[^"\\\n]|\\.){6,300})"/g)) {
      const literal = match[1];
      if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{3}/.test(literal)) continue;
      if (/^[\w./-]+$/.test(literal)) continue; // rutas, ids y símbolos
      salida.push({ seccion, texto: literal });
    }
  }
  return salida;
}

/** Corpus memoizado: cargarlo cuesta ~1 s y las sondas lo comparten. */
export function cargarCorpus() {
  if (corpusCache) return corpusCache;
  const volcado = JSON.parse(fs.readFileSync(path.join(CONTENT, "plan2700_dialogos.json"), "utf8"));
  const cajas = volcado.dialogos.map((caja) => ({ ...caja, crudo: (caja.lines ?? []).join(" ") }));
  const sistema = nombresDelSistema();
  const secciones = seccionesRuby();
  const mapaPorId = new Map();
  for (const caja of cajas) if (!mapaPorId.has(caja.mapId)) mapaPorId.set(caja.mapId, caja.map);
  corpusCache = {
    volcado,
    cajas,
    mapaPorId,
    sistema,
    secciones,
    ruby: literalesRuby(secciones),
    codigos: codigosDelMotor(),
    especies: new Set(volcado.catalog.validSpecies),
    objetos: new Set(volcado.catalog.validItems),
  };
  return corpusCache;
}

// ------------------------------------------------------------------ utilidades
/** Texto que ve el jugador: sin códigos de escape. */
export function textoVisible(crudo) {
  return String(crudo ?? "")
    .replace(/\\sp\[[^\]]*\]/gi, "")
    .replace(/\\(?:v|c|ch|f|cl|cn|me|op|pt|se|sign|ts|wd|wm|wt|wtnp|wu|g|b|pg|pog|pn|PN)\[[^\]]*\]/g, "")
    .replace(/\\[A-Za-z]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const escapar = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Códigos de escape de un texto que el motor NO trata.
 *
 * Se resuelve por prefijo más largo: en `\bOak's aide` el código es `b` y lo
 * que sigue es texto; en `\ch[1,2,…]` el código es `ch`, no `chx`. Comparar la
 * palabra entera daría falsos positivos y escondería los reales.
 */
export function codigosDesconocidos(crudo, codigos) {
  const desconocidos = [];
  for (const match of String(crudo).matchAll(/\\([A-Za-z]{1,4})/g)) {
    let resto = match[1];
    let conocido = false;
    while (resto.length) {
      if (codigos.has(resto)) { conocido = true; break; }
      resto = resto.slice(0, -1);
    }
    if (!conocido) desconocidos.push(`\\${match[1]}`);
  }
  return desconocidos;
}

/** Variables insertadas inválidas de un texto: fuera del sistema o sin nombre. */
export function variablesInvalidas(crudo, sistema) {
  const invalidas = [];
  for (const match of String(crudo).matchAll(/\\v\[([^\]]*)\]/gi)) {
    const id = Number(match[1]);
    const enRango = Number.isInteger(id) && id >= 0 && id < sistema.variables.length;
    if (!enRango || !sistema.nombreVariable(id)) invalidas.push(`\\v[${match[1]}]`);
  }
  return invalidas;
}

/** Busca un término con mayúsculas/minúsculas libres, devolviendo las variantes usadas. */
export function variantesDeTermino(textos, termino) {
  const cuerpo = escapar(termino).replace(/\\?\s+/g, "\\s+");
  const regex = new RegExp(`\\b${cuerpo}\\b`, "gi");
  const variantes = new Map();
  for (const textoCrudo of textos) {
    for (const match of String(textoCrudo).matchAll(regex)) {
      const forma = match[0];
      variantes.set(forma, (variantes.get(forma) ?? 0) + 1);
    }
  }
  return [...variantes.entries()].sort((a, b) => b[1] - a[1]).map(([forma, veces]) => ({ forma, veces }));
}

/** Muestra corta y estable para los informes: nunca volcamos la caja entera. */
export function muestra(caja, maximo = 92) {
  const t = caja.text ? caja.text : caja.crudo ?? "";
  return { mapId: caja.mapId, evento: caja.event ?? caja.evento, texto: String(t).slice(0, maximo) };
}

const recortar = (lista, tope = 5) => lista.slice(0, tope);

// ------------------------------------------------------------------ formato
/**
 * Reglas de formato de una caja de diálogo. Son la única definición: las usa
 * el control de CI (`tools/qa/dialogos_formato_check.mjs`) y la sonda de
 * formato de las tandas, para que un cambio de criterio no viva en dos sitios.
 *
 * `severidad: "error"` rompe el build; `"aviso"` cuenta y se publica.
 */
export const REGLAS_FORMATO = [
  {
    id: "caja_vacia",
    severidad: "error",
    titulo: "Caja sin texto visible",
    probar: (caja) => (textoVisible(caja.crudo) ? null : "el jugador no lee nada"),
  },
  {
    id: "codigo_desconocido",
    severidad: "error",
    titulo: "Código de escape que el motor no trata",
    probar: (caja, codigos) => codigosDesconocidos(caja.crudo, codigos)[0] ?? null,
  },
  {
    id: "variable_inexistente",
    severidad: "error",
    titulo: "Variable insertada inexistente o sin nombre",
    probar: (caja, _codigos, sistema) => variablesInvalidas(caja.crudo, sistema)[0] ?? null,
  },
  {
    id: "hablante_vacio",
    severidad: "error",
    titulo: "Etiqueta de hablante vacía",
    probar: (caja) => (/\\sp\[\s*\]/i.test(caja.crudo) ? "\\sp[]" : null),
  },
  {
    id: "comillas_desbalanceadas",
    severidad: "error",
    titulo: "Comillas angulares desbalanceadas",
    probar: (caja) => {
      const abre = (caja.crudo.match(/«/g) ?? []).length;
      const cierra = (caja.crudo.match(/»/g) ?? []).length;
      return abre === cierra ? null : `«${abre} / »${cierra}`;
    },
  },
  {
    id: "comilla_recta",
    severidad: "error",
    titulo: "Comilla recta en texto de jugador",
    probar: (caja) => (caja.crudo.includes('"') ? "usa «»" : null),
  },
  {
    id: "salto_forzado",
    severidad: "error",
    titulo: "Salto de línea forzado (\\l)",
    probar: (caja) => (/\\l\[/.test(caja.crudo) ? "\\l[] pide una caja más alta" : null),
  },
  {
    id: "raya_sin_espacio",
    severidad: "aviso",
    titulo: "Raya de diálogo sin espacios",
    probar: (caja) => (/(^|\S)—|—(\S|$)/.test(caja.crudo) ? "raya pegada a una palabra" : null),
  },
  {
    id: "doble_guion",
    severidad: "aviso",
    titulo: "Doble guion en lugar de raya",
    probar: (caja) => (/--/.test(caja.crudo) ? "--" : null),
  },
  {
    id: "palabra_pegada",
    severidad: "aviso",
    titulo: "Palabra pegada tras puntuación",
    probar: (caja) => {
      const limpio = caja.crudo.replace(/\\([A-Za-z]{1,4})\[[^\]]*\]/g, "");
      return /[.,;:!?][A-Za-zÁÉÍÓÚÜÑáéíóúüñ¿¡«]/.test(limpio) ? "falta el espacio tras la puntuación" : null;
    },
  },
  {
    id: "espacio_doble",
    severidad: "aviso",
    titulo: "Espacio doble en la línea del autor",
    probar: (caja) => (/ {2,}/.test(caja.crudo) ? "dos espacios seguidos" : null),
  },
  {
    id: "signo_apertura",
    severidad: "aviso",
    titulo: "Signo de apertura ausente (¿ o ¡)",
    probar: (caja) => {
      const t = textoVisible(caja.crudo);
      if (t.includes("?") && !t.includes("¿")) return "? sin ¿";
      if (t.includes("!") && !t.includes("¡")) return "! sin ¡";
      return null;
    },
  },
  {
    id: "linea_unica_sin_cierre",
    severidad: "aviso",
    titulo: "Caja de una sola línea que no cierra frase",
    probar: (caja) => {
      if ((caja.lines ?? []).length !== 1) return null;
      const t = textoVisible(caja.crudo);
      return /[.!?…»:)\]]$/.test(t) ? null : "posible error de relleno";
    },
  },
];

/**
 * Pasa todas las reglas sobre una lista de cajas. Devuelve los casos de error y
 * de aviso por separado, con el conteo por regla: es lo que el control de CI
 * imprime y lo que el informe publica.
 */
export function analizarFormato(cajas, codigos, sistema) {
  const errores = [];
  const avisos = [];
  const porRegla = {};
  for (const regla of REGLAS_FORMATO) {
    let casos = 0;
    for (const caja of cajas) {
      const detalle = regla.probar(caja, codigos, sistema);
      if (!detalle) continue;
      casos++;
      const destino = regla.severidad === "error" ? errores : avisos;
      if (destino.length < 400) destino.push({ regla: regla.id, ...muestra(caja), detalle });
    }
    if (casos) porRegla[regla.id] = casos;
  }
  return { errores, avisos, porRegla, cajas: cajas.length };
}

// ------------------------------------------------------------------ sondas
/**
 * Cada sonda recibe el corpus y un ámbito opcional y devuelve un resultado con
 * `total` (cuántos casos hay DE VERDAD) y `muestras`. `veredicto` resume: `ok`
 * cuando no hay casos, `hallazgo` cuando los hay. Nunca dice «limpio» sin
 * haber contado.
 */
export const SONDAS = {
  /** Formato del volcado completo o de un perfil (tareas 2076-2078, 2173-2174, 2184-2189). */
  formato: {
    titulo: "Formato de las cajas de diálogo",
    ejecutar(corpus, ambito = {}) {
      const scope = filtrar(corpus.cajas, ambito);
      const informe = analizarFormato(scope, corpus.codigos, corpus.sistema);
      return {
        total: informe.errores.length,
        veredicto: informe.errores.length ? "hallazgo" : "ok",
        detalle: { errores: informe.errores.length, avisos: informe.avisos.length, porRegla: informe.porRegla, cajas: informe.cajas },
        muestras: informe.errores.slice(0, 5).map((caso) => ({ ...caso })),
        universo: informe.cajas,
      };
    },
  },

  /** Cajas vacías o con solo espacios. Tarea 2076 y cierre del carril. */
  cajas_vacias: {
    titulo: "Cajas sin texto visible",
    ejecutar(corpus, ambito = {}) {
      const scope = filtrar(corpus.cajas, ambito);
      const casos = scope.filter((caja) => !textoVisible(caja.crudo));
      return resultado(casos, "caja vacía");
    },
  },

  /** Signos de apertura en español: ¿? y ¡! (tareas 2077, 2187). */
  signos_apertura: {
    titulo: "Signos de apertura ausentes",
    ejecutar(corpus, ambito = {}) {
      const scope = filtrar(corpus.cajas, ambito);
      const casos = scope.filter((caja) => {
        const t = textoVisible(caja.crudo);
        return (t.includes("?") && !t.includes("¿")) || (t.includes("!") && !t.includes("¡"));
      });
      return resultado(casos, "signo de apertura ausente");
    },
  },

  /** Variables y hablantes insertados: índice fuera del sistema o vacío (tarea 2189). */
  variables_insertadas: {
    titulo: "Variables insertadas inexistentes o vacías",
    ejecutar(corpus) {
      const casos = [];
      for (const caja of corpus.cajas) {
        for (const detalle of variablesInvalidas(caja.crudo, corpus.sistema)) casos.push({ caja, detalle });
        for (const match of caja.crudo.matchAll(/\\sp\[([^\]]*)\]/gi)) {
          if (!match[1].trim()) casos.push({ caja, detalle: "\\sp[] vacío" });
        }
      }
      return resultado(casos);
    },
  },

  /** Códigos de escape que el motor no trata: se leen del motor en cada corrida. */
  codigos_escape: {
    titulo: "Códigos de escape que el motor no reconoce",
    ejecutar(corpus) {
      const casos = [];
      for (const caja of corpus.cajas) {
        for (const detalle of codigosDesconocidos(caja.crudo, corpus.codigos)) casos.push({ caja, detalle });
      }
      return { ...resultado(casos), detalle: { casos: casos.length, codigosReconocidos: corpus.codigos.size } };
    },
  },

  /** Comillas y rayas: comillas desbalanceadas, rectas, raya sin espacio (tarea 2188). */
  comillas_y_rayas: {
    titulo: "Comillas y rayas mal usadas",
    ejecutar(corpus, ambito = {}) {
      const scope = filtrar(corpus.cajas, ambito);
      const casos = [];
      for (const caja of scope) {
        const t = caja.crudo;
        const abre = (t.match(/«/g) ?? []).length;
        const cierra = (t.match(/»/g) ?? []).length;
        if (abre !== cierra) casos.push({ caja, detalle: `comillas «${abre}»/»${cierra}»` });
        if (t.includes('"')) casos.push({ caja, detalle: "comilla recta" });
        if (/(^|\S)—|—(\S|$)/.test(t)) casos.push({ caja, detalle: "raya sin espacio" });
        if (/--/.test(t)) casos.push({ caja, detalle: "doble guion" });
      }
      return resultado(casos);
    },
  },

  /** Textos que mezclan idiomas: cajas sin una sola palabra funcional en español (tarea 2078). */
  idioma: {
    titulo: "Cajas escritas en otro idioma",
    ejecutar(corpus, ambito = {}) {
      const scope = filtrar(corpus.cajas, ambito);
      const espanol = /\b(?:de|la|el|los|las|un|una|que|para|con|del|por|pero|como|más|ya|sin|su|tu|te|se|no|es|está|hay|puedes|tienes|aquí)\b/i;
      const ingles = /\b(?:the|and|you|your|this|that|what|when|would|could|will|from|with|have|there|here|they|are|was|were|been|his|her|its|it's|don't|can't|i'm)\b/i;
      const casos = scope.filter((caja) => {
        const t = textoVisible(caja.crudo);
        return ingles.test(t) && !espanol.test(t);
      });
      return resultado(casos, "texto sin español");
    },
  },

  /** Palabras pegadas por mala importación: «kid!What?», «oneat» (tarea 2078/2188). */
  palabras_pegadas: {
    titulo: "Palabras pegadas tras puntuación",
    ejecutar(corpus, ambito = {}) {
      const scope = filtrar(corpus.cajas, ambito);
      const casos = [];
      for (const caja of scope) {
        const limpio = caja.crudo.replace(/\\([A-Za-z]{1,4})\[[^\]]*\]/g, "");
        if (/[.,;:!?][A-Za-zÁÉÍÓÚÜÑáéíóúüñ¿¡«]/.test(limpio)) casos.push({ caja, detalle: "puntuación sin espacio" });
      }
      return resultado(casos);
    },
  },

  /** Jerga del motor en texto de jugador (tarea 2172). */
  jerga_motor: {
    titulo: "Jerga interna del motor en texto de jugador",
    ejecutar(corpus) {
      const patron = /\b(?:switch|switches|flag|flags|variable global|rxdata|Scripts|MapInfos|tileset|pbMessage|pbDisplayMessage|Interpreter|self switch|evento \d+|autotile)\b/i;
      const casos = [];
      for (const caja of corpus.cajas) {
        const t = textoVisible(caja.crudo);
        if (patron.test(t)) casos.push({ caja, detalle: "jerga de motor" });
      }
      for (const literal of corpus.ruby) {
        if (patron.test(literal.texto)) casos.push({ caja: { mapId: null, event: literal.seccion }, detalle: "jerga de motor (Ruby)" });
      }
      return resultado(casos);
    },
  },

  /** Glosario: los siete términos congelados se usan con una forma estable (tarea 2116-2117). */
  glosario: {
    titulo: "Términos congelados con formas inconsistentes",
    ejecutar(corpus) {
      const terminos = ["Vía", "Ancla", "Emisión", "Sello", "Fragmento", "Dimensión invitada", "Liga Oscura"];
      const textos = corpus.cajas.map((caja) => textoVisible(caja.crudo));
      const detalle = terminos.map((termino) => {
        const variantes = variantesDeTermino(textos, termino);
        const formas = new Set(variantes.map((v) => v.forma));
        const inconsistente = variantes.filter((v) => !esFormaDelTermino(v.forma, termino));
        return { termino, usos: variantes.reduce((a, v) => a + v.veces, 0), formas: variantes.length, inconsistente };
      });
      const conHallazgo = detalle.filter((d) => d.inconsistente.length > 0);
      return {
        total: conHallazgo.length,
        veredicto: conHallazgo.length ? "hallazgo" : "ok",
        detalle,
        muestras: conHallazgo.map((d) => ({ termino: d.termino, variantes: d.inconsistente.slice(0, 4) })),
      };
    },
  },

  /** Textos que humillan al jugador o al rival (tarea 2096). */
  humillacion: {
    titulo: "Textos de derrota que humillan",
    ejecutar(corpus, ambito = { derrota: true }) {
      const scope = corpus.cajas.filter((caja) => esCajaDeJefe(caja, ambito));
      const patron = /\b(?:inútil|inutil|patético|patética|ridículo|ridícula|vergüenza|imbécil|idiota|llorón|llorona|estúpido|estúpida|fracasado|fracasada|mediocre|escoria|asqueroso|asquerosa|despreciable|miserable|cobardica|cobarde)\b/i;
      const casos = scope.filter((caja) => patron.test(textoVisible(caja.crudo)));
      return { ...resultado(casos, "léxico humillante"), universo: scope.length };
    },
  },

  /** Gore gratuito en el material creepypasta (tarea 2100). */
  gore: {
    titulo: "Gore gratuito en textos de terror",
    ejecutar(corpus) {
      const scope = corpus.cajas.filter((caja) => /Grieta|creepypasta|Multiverso|Emisi/i.test(caja.event));
      const patron = /\b(?:vísceras|visceras|descuartiz\w*|degoll\w*|tripas|empalad\w*|mutilad\w*|sesos|cadáver|cadaver|sangriento|sangrienta|gore)\b/i;
      const casos = scope.filter((caja) => patron.test(textoVisible(caja.crudo)));
      return { ...resultado(casos, "gore gratuito"), universo: scope.length };
    },
  },

  /** Promesas que el juego no cumple: secuelas, continuaciones, «pronto» (tarea 2113 y 2168). */
  promesas: {
    titulo: "Promesas narrativas que el juego no cumple",
    ejecutar(corpus, ambito = { finales: true }) {
      const scope = corpus.cajas.filter((caja) =>
        ambito.finales ? /Campe|Final|Epílogo|Crédito|Diploma|Arceus|OAK|Oak/i.test(caja.event) : true);
      const patron = /\b(?:secuela|continuará|continuara|en la próxima|próximo juego|proximo juego|pronto volverás|aún nos queda mucho|nos vemos en la siguiente)\b/i;
      const casos = scope.filter((caja) => patron.test(textoVisible(caja.crudo)));
      return { ...resultado(casos, "promesa abierta"), universo: scope.length };
    },
  },

  /** Menciones de Pokémon u objetos que no existen en los catálogos del juego (tareas 2085-2086). */
  catalogo_simbolos: {
    titulo: "Tokens en mayúsculas que no existen en species.dat/items.dat",
    ejecutar(corpus) {
      const permitidos = new Set([
        "ASH", "ROCKET", "ATLAS", "TEAM", "DLC", "POKEMOD", "TFOH", "POK", "MON", "PN", "EEUU", "OA", "LV",
      ]);
      const casos = [];
      for (const caja of corpus.cajas) {
        const t = textoVisible(caja.crudo);
        for (const match of t.matchAll(/\b[A-Z][A-Z0-9]{2,}\b/g)) {
          const token = match[0];
          if (corpus.especies.has(token) || corpus.objetos.has(token) || permitidos.has(token)) continue;
          casos.push({ caja, detalle: token });
        }
      }
      return { ...resultado(casos), nota: "los tokens pueden ser nombres propios: se listan como candidatos, no como error" };
    },
  },

  /** Líderes de gimnasio del DLC: 32 de campaña + 8 de Atlas = los 40 del plan (tarea 2103). */
  lideres: {
    titulo: "Cuarenta líderes de gimnasio con switch y texto",
    ejecutar(corpus) {
      const registro = JSON.parse(fs.readFileSync(path.join(CONTENT, "campanas_lideres.json"), "utf8"));
      const campañas = registro.colocados ?? [];
      const atlas = corpus.cajas
        .map((caja) => caja.event)
        .filter((evento) => /PokeMod Líder |PokeMod Gimnasio/i.test(evento));
      const conSwitch = campañas.filter((lider) => {
        const nombre = corpus.sistema.nombreSwitch(lider.sw);
        return Boolean(nombre);
      });
      const conTexto = campañas.filter((lider) =>
        corpus.cajas.some((caja) => new RegExp(`\\b${escapar(lider.lider)}\\b`, "i").test(caja.text) || new RegExp(`\\b${escapar(lider.lider)}\\b`, "i").test(caja.event)));
      const atlasUnicos = new Set(atlas);
      const detalle = {
        campanaRegistrados: campañas.length,
        campanaConSwitchNombrado: conSwitch.length,
        campanaConTexto: conTexto.length,
        atlasEventos: atlasUnicos.size,
        total: campañas.length + atlasUnicos.size,
      };
      const faltan = [];
      for (const lider of campañas) {
        if (!corpus.sistema.nombreSwitch(lider.sw)) faltan.push({ lider: lider.lider, motivo: "switch sin nombre" });
        else if (!conTexto.includes(lider)) faltan.push({ lider: lider.lider, motivo: "sin texto en el volcado" });
      }
      return {
        total: faltan.length + (detalle.total === 40 ? 0 : 1),
        veredicto: faltan.length === 0 && detalle.total === 40 ? "ok" : "hallazgo",
        detalle,
        muestras: faltan.slice(0, 8),
      };
    },
  },

  /** Diplomas: cada uno con condición y textos, y presentes en el documento (tareas 2118-2119, 2165-2166). */
  diplomas: {
    titulo: "Diplomas con condición, texto y nombre coincidente",
    ejecutar() {
      const datos = JSON.parse(fs.readFileSync(path.join(CONTENT, "diplomas_planta.json"), "utf8"));
      const documento = fs.readFileSync(path.join(ROOT, "docs", "ATAVIOS_Y_DIPLOMAS.md"), "utf8");
      const faltan = [];
      for (const diploma of datos.diplomas ?? []) {
        if (!diploma.condicion || (!diploma.condicion.switch && !diploma.condicion.variable)) faltan.push({ diploma: diploma.nombre, motivo: "sin condición" });
        if (!(diploma.vacio ?? []).length || !(diploma.ganado ?? []).length) faltan.push({ diploma: diploma.nombre, motivo: "sin textos de marco vacío o ganado" });
        if (!documento.includes(diploma.nombre)) faltan.push({ diploma: diploma.nombre, motivo: "no aparece en ATAVIOS_Y_DIPLOMAS.md" });
      }
      return {
        total: faltan.length,
        veredicto: faltan.length ? "hallazgo" : "ok",
        detalle: { diplomas: (datos.diplomas ?? []).length, mapa: datos.mapaId },
        muestras: faltan.slice(0, 8),
      };
    },
  },

  /** Créditos: cada campaña invitada está atribuida y la ficha no tiene huecos (tarea 2169-2170). */
  creditos: {
    titulo: "Atribuciones de las campañas invitadas",
    ejecutar() {
      const archivo = path.join(ROOT, "docs", "qa", "creditos_arte.md");
      const textoCreditos = fs.readFileSync(archivo, "utf8");
      const invitadas = ["Glazed", "Light Platinum", "Liquid Crystal", "The First Hoenn", "TFOH", "Unbound"];
      const faltan = invitadas.filter((nombre) => !new RegExp(escapar(nombre), "i").test(textoCreditos)).map((nombre) => ({ campaña: nombre, motivo: "sin atribución" }));
      if (/TODO|pendiente de atribuir|\bTBD\b/i.test(textoCreditos)) faltan.push({ campaña: "—", motivo: "marcador de hueco en los créditos" });
      return { total: faltan.length, veredicto: faltan.length ? "hallazgo" : "ok", detalle: { invitadas: invitadas.length }, muestras: faltan };
    },
  },

  /** Playtest: cada sesión tiene ficha con fecha, versión, duración y hallazgos (tareas 2192-2195). */
  playtest_fichas: {
    titulo: "Fichas de sesión de playtest",
    ejecutar() {
      const base = path.join(ROOT, "docs", "qa", "playtest");
      if (!fs.existsSync(base)) return { total: 1, veredicto: "hallazgo", detalle: { existe: false }, muestras: [{ motivo: "falta docs/qa/playtest" }] };
      const sesiones = fs.readdirSync(base).filter((nombre) => /^sesion-\d+$/.test(nombre)).sort();
      const incompletas = [];
      for (const sesion of sesiones) {
        const ficha = path.join(base, sesion, "README.md");
        if (!fs.existsSync(ficha)) { incompletas.push({ sesion, motivo: "sin README" }); continue; }
        const contenido = fs.readFileSync(ficha, "utf8");
        const campos = { fecha: /\bfecha\b/i, version: /versi[óo]n/i, duracion: /duraci[óo]n/i, hallazgos: /hallazgo/i };
        const faltan = Object.entries(campos).filter(([, patron]) => !patron.test(contenido)).map(([campo]) => campo);
        if (faltan.length) incompletas.push({ sesion, motivo: `ficha sin ${faltan.join(", ")}` });
      }
      return {
        total: incompletas.length,
        veredicto: incompletas.length ? "hallazgo" : "ok",
        detalle: { sesiones: sesiones.length },
        muestras: incompletas.slice(0, 8),
      };
    },
  },

  /** Informe de diálogos publicado con sus conteos (tarea 2177-2179). */
  informe_dialogos: {
    titulo: "Informe de diálogos publicado",
    ejecutar(corpus) {
      const archivo = path.join(ROOT, "docs", "qa", "dialogos_informe.md");
      if (!fs.existsSync(archivo)) return { total: 1, veredicto: "hallazgo", detalle: { existe: false }, muestras: [{ motivo: "falta docs/qa/dialogos_informe.md" }] };
      const contenido = fs.readFileSync(archivo, "utf8");
      const requisitos = {
        conteo_cajas: /19[ .]?801|cajas de texto/i,
        formato: /formato/i,
        reescrituras: /reescritur/i,
        limites: /l[íi]mite/i,
      };
      const faltan = Object.entries(requisitos).filter(([, patron]) => !patron.test(contenido)).map(([clave]) => clave);
      const filas = corpus.cajas.length;
      const declarado = /(\d[\d.]*)\s*cajas de texto/i.exec(contenido);
      const numero = declarado ? Number(declarado[1].replaceAll(".", "")) : null;
      if (numero !== null && numero !== filas) faltan.push(`conteo declarado ${numero} ≠ volcado ${filas}`);
      return { total: faltan.length, veredicto: faltan.length ? "hallazgo" : "ok", detalle: { filas, numero }, muestras: faltan };
    },
  },

  /** Control de formato en CI: script declarado, workflow que lo invoca y autoprueba (tarea 2184-2189). */
  control_en_ci: {
    titulo: "Control de formato de diálogos dentro de CI",
    ejecutar() {
      const paquete = fs.readFileSync(path.join(ROOT, "package.json"), "utf8");
      const workflow = fs.readFileSync(path.join(ROOT, ".github", "workflows", "build-apk.yml"), "utf8");
      const piezas = {
        script: /"verify:dialogos:formato"\s*:/.test(paquete),
        workflow: /verify:dialogos:formato/.test(workflow),
        autoprueba: /--selftest/.test(fs.readFileSync(path.join(ROOT, "tools", "qa", "dialogos_formato_check.mjs"), "utf8")),
      };
      const faltan = Object.entries(piezas).filter(([, ok]) => !ok).map(([clave]) => clave);
      return { total: faltan.length, veredicto: faltan.length ? "hallazgo" : "ok", detalle: piezas, muestras: faltan };
    },
  },
};

function esCajaDeJefe(caja, ambito) {
  const nombres = `${caja.event ?? ""} ${caja.map ?? ""}`;
  if (ambito.derrota) return /jefe|campe|líder|lider|guardi[áa]n|revancha|derrota|Arceus|Pokégod/i.test(nombres);
  return true;
}

function esFormaDelTermino(forma, termino) {
  // La forma válida es el término tal cual o el mismo término todo en mayúsculas
  // cuando el texto grita («LIGA OSCURA»). Cualquier otra mezcla es inconsistencia.
  const normal = termino.normalize("NFC");
  return forma.normalize("NFC") === normal || forma.normalize("NFC") === normal.toUpperCase();
}

function filtrar(cajas, ambito) {
  let scope = cajas;
  if (ambito.perfil) scope = scope.filter((caja) => caja.profile === ambito.perfil);
  if (ambito.perfiles) scope = scope.filter((caja) => ambito.perfiles.includes(caja.profile));
  if (ambito.evento) scope = scope.filter((caja) => ambito.evento.test(caja.event ?? ""));
  if (ambito.mapa) scope = scope.filter((caja) => ambito.mapa.test(caja.map ?? ""));
  return scope;
}

function resultado(casos, motivos = "caso") {
  return {
    total: casos.length,
    veredicto: casos.length ? "hallazgo" : "ok",
    detalle: { casos: casos.length },
    muestras: recortar(casos.map((caso) => (caso.caja ? { ...muestra(caso.caja), detalle: caso.detalle } : caso))),
    motivos,
  };
}

// ------------------------------------------------------------------ evaluador
/**
 * Asigna veredicto a cada tarea de la tanda.
 *
 * `reglas` es una lista ordenada de `{ re, sonda, ambito, nota }`: la primera
 * que casa con el texto de la tarea manda. Una tarea sin regla no se inventa:
 * se marca `manual` con el carril que le corresponde por su verbo.
 */
export function evaluarTanda(tanda, reglas, corpus = cargarCorpus(), sondasExtra = {}) {
  const cacheSondas = new Map();
  const catalogo = { ...SONDAS, ...sondasExtra };
  const ejecutar = (nombre, ambito) => {
    const clave = `${nombre}|${JSON.stringify(ambito ?? {})}`;
    if (!cacheSondas.has(clave)) {
      const sonda = catalogo[nombre];
      if (!sonda) throw new Error(`sonda desconocida: ${nombre}`);
      cacheSondas.set(clave, { ...sonda.ejecutar(corpus, ambito), sonda: nombre, titulo: sonda.titulo });
    }
    return cacheSondas.get(clave);
  };
  const filas = tanda.tareas.map((tarea) => {
    const regla = reglas.find((candidata) => candidata.re.test(tarea.texto));
    if (!regla) {
      return {
        id: tarea.id,
        tarea: tarea.texto,
        estado: "manual",
        carril: carrilDe(tarea.texto),
        motivo: "exige partida, editor o criterio editorial: no se puede cerrar leyendo archivos",
      };
    }
    const salida = ejecutar(regla.sonda, regla.ambito);
    // `instrumentado` es un estado propio: el instrumento existe, está medido y
    // verificado, pero el hecho que la tarea pide comprobar exige una partida
    // humana. No es PASS y no se disfraza de PASS.
    const estado = salida.veredicto === "ok"
      ? (salida.detalle && salida.detalle.ejecutado === false ? "instrumentado" : "verificado_auto")
      : salida.veredicto === "sin_datos" ? "sin_datos" : "hallazgo";
    return {
      id: tarea.id,
      tarea: tarea.texto,
      estado,
      sonda: regla.sonda,
      titulo: salida.titulo,
      total: salida.total,
      universo: salida.universo ?? null,
      detalle: regla.detalle ?? null,
      muestras: salida.muestras?.slice(0, 3) ?? [],
    };
  });
  const resumen = filas.reduce((acc, fila) => {
    const clave = fila.estado === "manual" ? `manual:${fila.carril}` : fila.estado;
    acc[clave] = (acc[clave] ?? 0) + 1;
    return acc;
  }, {});
  return {
    filas,
    resumen,
    sondas: [...cacheSondas.entries()].map(([clave, valor]) => ({
      clave,
      sonda: valor.sonda,
      titulo: valor.titulo,
      total: valor.total,
      veredicto: valor.veredicto,
      universo: valor.universo ?? null,
      detalle: valor.detalle ?? null,
      muestras: (valor.muestras ?? []).slice(0, 6),
    })),
  };
}

/** Carril del trabajo manual, deducido del verbo de la tarea. */
export function carrilDe(texto) {
  if (/^Sesi[óo]n \d+|playtest|partida/i.test(texto)) return "playtest";
  if (/ejecutar|verificar con `npm|npm run|archivar|recontar|regenerar/i.test(texto)) return "ejecución";
  if (/escribir|publicar|actualizar|redactar|firmar|marcar/i.test(texto)) return "documentación";
  if (/reescribir|auditar|revisar/i.test(texto)) return "editorial";
  return "editorial";
}

// ------------------------------------------------------------------ artefacto
export function escribirArtefacto(rutaRelativa, objeto) {
  const destino = path.join(ROOT, rutaRelativa);
  const serializado = `${JSON.stringify(objeto, null, 2)}\n`;
  fs.writeFileSync(destino, serializado);
  return destino;
}

/** `--verify` de una fase: el artefacto debe ser exactamente el que produce hoy. */
export function verificarArtefacto(rutaRelativa, objeto) {
  const destino = path.join(ROOT, rutaRelativa);
  if (!fs.existsSync(destino)) throw new Error(`falta ${rutaRelativa}; ejecuta la fase sin --verify`);
  const actual = fs.readFileSync(destino, "utf8");
  const esperado = `${JSON.stringify(objeto, null, 2)}\n`;
  if (actual !== esperado) throw new Error(`${rutaRelativa} está desactualizado; vuelve a ejecutar la fase`);
  return true;
}
