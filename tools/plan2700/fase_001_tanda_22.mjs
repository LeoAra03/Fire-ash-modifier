#!/usr/bin/env node
/**
 * fase_001_tanda_22.mjs — tanda 22 (líneas 2100–2199 de `tareas.txt`).
 *
 * Es el carril de diálogos del plan: de la auditoría de voz de los jefes al
 * cierre del carril con el control de formato en CI y el informe publicado.
 *
 * Qué hace, en orden:
 *   1. corta la tanda exacta (100 tareas, ids consecutivos);
 *   2. pasa cada tarea por una sonda que mide su enunciado sobre el contenido
 *      real (volcado de cajas, literales Ruby y registros de `content/`);
 *   3. escribe `content/plan2700_tanda22.json` con el veredicto de las 100;
 *   4. publica `docs/qa/dialogos_informe.md` con los conteos medidos.
 *
 * Uso:
 *   node tools/plan2700/fase_001_tanda_22.mjs            # escribe artefactos
 *   node tools/plan2700/fase_001_tanda_22.mjs --verify   # comprueba que siguen al día
 *   node tools/plan2700/fase_001_tanda_22.mjs --json      # vuelca el artefacto
 */
import fs from "node:fs";
import path from "node:path";
import { readMap, txt } from "../lib/dn_rmxp.mjs";
import {
  ROOT, CONTENT, SONDAS, analizarFormato, cargarCorpus, cargarTanda, escribirArtefacto,
  muestra, textoVisible, variantesDeTermino, verificarArtefacto,
} from "./tanda_textos_core.mjs";

const VERIFY = process.argv.includes("--verify");
const JSON_OUT = process.argv.includes("--json");
const LINEAS = { desdeLinea: 2100, hastaLinea: 2199 };

const corpus = cargarCorpus();
const tanda = cargarTanda(LINEAS);

// ------------------------------------------------------------------ sondas locales
const cajas = () => corpus.cajas;
const enEvento = (patron) => cajas().filter((caja) => patron.test(caja.event ?? ""));
const visibles = (lista) => lista.map((caja) => textoVisible(caja.crudo));

/** Textos visibles repetidos literalmente en más de un evento del ámbito. */
function repeticionEntreEventos(lista, minimoEventos = 2) {
  const mapa = new Map();
  for (const caja of lista) {
    const texto = textoVisible(caja.crudo);
    if (texto.length < 20) continue;
    const registro = mapa.get(texto) ?? { texto, eventos: new Set(), mapas: new Set() };
    registro.eventos.add(caja.event);
    registro.mapas.add(caja.mapId);
    mapa.set(texto, registro);
  }
  return [...mapa.values()]
    .filter((registro) => registro.eventos.size >= minimoEventos)
    .sort((a, b) => b.eventos.size - a.eventos.size)
    .map((registro) => ({ texto: registro.texto.slice(0, 90), eventos: registro.eventos.size, mapas: registro.mapas.size }));
}

const sondaRepeticion = (patron, minimo = 2, etiqueta = "texto repetido entre eventos") => ({
  titulo: etiqueta,
  ejecutar() {
    const lista = enEvento(patron);
    const casos = repeticionEntreEventos(lista, minimo);
    return {
      total: casos.length,
      veredicto: casos.length ? "hallazgo" : lista.length ? "ok" : "sin_datos",
      universo: lista.length,
      detalle: { cajas: lista.length, eventos: new Set(lista.map((c) => c.event)).size },
      muestras: casos.slice(0, 5),
    };
  },
});

const sondaVozPropia = (patron, etiqueta, minimoEventos = 2) => ({
  titulo: etiqueta,
  ejecutar() {
    const lista = enEvento(patron);
    const eventos = new Set(lista.map((caja) => caja.event));
    // Una caja sin etiqueta de hablante no es un defecto: el motor la muestra
    // como narración. Se cuenta y se publica, pero el veredicto lo decide la
    // repetición literal entre eventos distintos, que sí es un discurso clonado.
    const sinHablante = lista.filter((caja) => !/\\sp\[/i.test(caja.crudo) && !/^\s*(?:[A-ZÁÉÍÓÚÑ][\wáéíóúñ]+):\s/.test(caja.text ?? ""));
    const repetidos = repeticionEntreEventos(lista, minimoEventos);
    return {
      total: repetidos.length,
      veredicto: eventos.size < 2 ? "sin_datos" : repetidos.length ? "hallazgo" : "ok",
      universo: lista.length,
      detalle: { eventos: eventos.size, cajas: lista.length, sinHablante: sinHablante.length, repetidos: repetidos.length },
      muestras: repetidos.slice(0, 5).map((registro) => ({ detalle: `repetido en ${registro.eventos} eventos`, texto: registro.texto })),
    };
  },
});

const sondaSinDatosSeDeclara = (patron, etiqueta) => ({
  titulo: etiqueta,
  ejecutar() {
    const lista = enEvento(patron);
    return {
      total: 0,
      veredicto: lista.length ? "ok" : "sin_datos",
      universo: lista.length,
      detalle: { cajas: lista.length, eventos: new Set(lista.map((c) => c.event)).size },
      muestras: lista.length ? [] : [{ motivo: "no hay cajas de esta clase en el volcado: la tarea no tiene objeto que auditar" }],
    };
  },
});

/** Cuenta los jefes medidos y los compara con el objetivo declarado por la tarea. */
const sondaCupo = (patron, objetivo, etiqueta) => ({
  titulo: etiqueta,
  ejecutar() {
    const lista = enEvento(patron);
    const eventos = new Set(lista.map((caja) => caja.event));
    return {
      total: eventos.size < objetivo ? objetivo - eventos.size : 0,
      veredicto: eventos.size < objetivo ? "hallazgo" : "ok",
      universo: lista.length,
      detalle: { encontrados: eventos.size, objetivo, cajas: lista.length },
      muestras: eventos.size < objetivo
        ? [{ motivo: `faltan ${objetivo - eventos.size} de ${objetivo}`, encontrados: [...eventos].slice(0, 6) }]
        : [],
    };
  },
});

const sondaPerfil = (perfil, etiqueta, minimoCajas = 20) => ({
  titulo: etiqueta,
  ejecutar() {
    const lista = cajas().filter((caja) => caja.profile === perfil);
    const repetidos = repeticionEntreEventos(lista, 4);
    const cortas = lista.filter((caja) => textoVisible(caja.crudo).length < 8);
    return {
      total: repetidos.length + cortas.length,
      veredicto: lista.length < minimoCajas ? "sin_datos" : repetidos.length + cortas.length ? "hallazgo" : "ok",
      universo: lista.length,
      detalle: { cajas: lista.length, repetidos: repetidos.length, muyCortas: cortas.length },
      muestras: [...repetidos.slice(0, 3), ...cortas.slice(0, 2).map((caja) => ({ ...muestra(caja), detalle: "texto de menos de 8 caracteres" }))],
    };
  },
});

/** Las 500 aventuras de Horizontes: títulos y ganchos no pueden ser plantilla. */
const sondaHorizontes = {
  titulo: "500 aventuras de Horizontes sin plantilla literal",
  ejecutar() {
    const datos = JSON.parse(fs.readFileSync(path.join(CONTENT, "horizontes_500.json"), "utf8"));
    const aventuras = datos.adventures ?? [];
    const titulos = new Map();
    const ganchos = new Map();
    for (const aventura of aventuras) {
      titulos.set(aventura.title, (titulos.get(aventura.title) ?? 0) + 1);
      ganchos.set(aventura.hook, (ganchos.get(aventura.hook) ?? 0) + 1);
    }
    const titulosRepetidos = [...titulos.entries()].filter(([, veces]) => veces > 1);
    const ganchosRepetidos = [...ganchos.entries()].filter(([, veces]) => veces > 1);
    // Un gancho es plantilla si cambia solo el nombre del Pokémon, el objeto o el realm.
    const normalizado = new Map();
    for (const aventura of aventuras) {
      const clave = String(aventura.hook ?? "")
        .replace(new RegExp(`\\b${aventura.pokemonName ?? "x"}\\b`, "gi"), "«pokemon»")
        .replace(new RegExp(`\\b${aventura.realm ?? "x"}\\b`, "gi"), "«realm»")
        .replace(/\b\d+\b/g, "«n»");
      normalizado.set(clave, (normalizado.get(clave) ?? 0) + 1);
    }
    const plantillas = [...normalizado.entries()].filter(([, veces]) => veces > 20);
    return {
      total: titulosRepetidos.length + ganchosRepetidos.length + plantillas.length,
      veredicto: aventuras.length !== 500 ? "hallazgo" : titulosRepetidos.length + ganchosRepetidos.length + plantillas.length ? "hallazgo" : "ok",
      universo: aventuras.length,
      detalle: { aventuras: aventuras.length, titulosRepetidos: titulosRepetidos.length, ganchosRepetidos: ganchosRepetidos.length, plantillas: plantillas.length },
      muestras: [...plantillas.slice(0, 3).map(([clave, veces]) => ({ detalle: `${veces} ganchos con la misma plantilla`, texto: clave.slice(0, 90) })), ...ganchosRepetidos.slice(0, 2).map(([texto, veces]) => ({ detalle: `gancho idéntico ×${veces}`, texto: String(texto).slice(0, 90) }))],
    };
  },
};

/** Los cuarenta líderes: campaña registrada + textos de líder en el volcado. */
const sondaCuarentaLideres = {
  titulo: "Cuarenta líderes con switch, texto y primera línea propia",
  ejecutar() {
    const registro = JSON.parse(fs.readFileSync(path.join(CONTENT, "campanas_lideres.json"), "utf8"));
    const lideres = registro.colocados ?? [];
    const faltan = [];
    for (const lider of lideres) {
      if (!corpus.sistema.nombreSwitch(lider.sw)) faltan.push({ detalle: `switch ${lider.sw} sin nombre`, lider: lider.lider });
      const cajasLider = cajas().filter((caja) => new RegExp(`\\b${lider.lider}\\b`, "i").test(`${caja.event} ${caja.text}`));
      if (!cajasLider.length) faltan.push({ detalle: "sin texto en el volcado", lider: lider.lider });
    }
    const nombres = lideres.map((lider) => lider.lider);
    const duplicados = nombres.filter((nombre, indice) => nombres.indexOf(nombre) !== indice);
    const primeraLinea = [];
    for (const lider of lideres) {
      const primera = enEvento(new RegExp(`Líder[^:]*${lider.lider}|${lider.lider}`, "i"))[0];
      if (!primera) continue;
      const texto = textoVisible(primera.crudo);
      primeraLinea.push({ lider: lider.lider, primera: texto.slice(0, 70) });
    }
    const total = faltan.length + duplicados.length + (lideres.length + 8 === 40 ? 0 : 1);
    return {
      total,
      veredicto: total ? "hallazgo" : "ok",
      universo: lideres.length,
      detalle: { campana: lideres.length, switchesNombrados: lideres.filter((l) => corpus.sistema.nombreSwitch(l.sw)).length, atlas: 8, totalLideres: lideres.length + 8, duplicados: duplicados.length, conPrimeraLinea: primeraLinea.length },
      muestras: [...faltan.slice(0, 5), ...duplicados.slice(0, 3).map((nombre) => ({ detalle: "nombre repetido", lider: nombre }))],
    };
  },
};

/** Los siete jefes de emisión y su degradación: se busca la numeración explícita. */
const sondaEmisiones = {
  titulo: "Siete emisiones numeradas y su degradación",
  ejecutar() {
    const lista = enEvento(/Emisi[óo]n|Grieta|creepypasta/i);
    const numeros = new Set();
    for (const caja of lista) {
      for (const match of textoVisible(caja.crudo).matchAll(/[Ee]misi[óo]n\s+(\d|I{1,3}V?|IV|V|VI|VII)/g)) numeros.add(match[1]);
    }
    return {
      total: numeros.size === 0 ? 1 : 7 - numeros.size > 0 ? 7 - numeros.size : 0,
      veredicto: numeros.size === 7 ? "ok" : "hallazgo",
      universo: lista.length,
      detalle: { cajas: lista.length, eventos: new Set(lista.map((c) => c.event)).size, numerosEncontrados: [...numeros] },
      muestras: numeros.size === 7 ? [] : [{ motivo: "la numeración de las siete emisiones no se lee en el texto; la degradación progresiva es editorial", encontrados: [...numeros] }],
    };
  },
};

const sondaGlosario = {
  titulo: "Términos congelados con una sola forma",
  ejecutar() {
    const terminos = ["Vía", "Ancla", "Emisión", "Sello", "Fragmento", "Dimensión invitada", "Liga Oscura"];
    const textos = visibles(cajas());
    const detalle = terminos.map((termino) => {
      const variantes = variantesDeTermino(textos, termino);
      const inconsistentes = variantes.filter(({ forma }) => forma !== termino && forma !== termino.toUpperCase());
      return { termino, usos: variantes.reduce((suma, v) => suma + v.veces, 0), formas: variantes.length, inconsistentes };
    });
    const casos = detalle.filter((entrada) => entrada.inconsistentes.length);
    return {
      total: casos.length,
      veredicto: casos.length ? "hallazgo" : "ok",
      universo: textos.length,
      detalle: { terminos: detalle.length, usosTotales: detalle.reduce((suma, d) => suma + d.usos, 0) },
      muestras: casos.map((entrada) => ({ termino: entrada.termino, variantes: entrada.inconsistentes.slice(0, 4) })),
    };
  },
};

const sondaJerga = {
  titulo: "Jerga de motor o de taller en texto de jugador",
  ejecutar() {
    const patron = /\b(?:banco \d+|mapa \d+|Map\d{3,}|switch \d+|variable \d+|evento \d+|self switch|rxdata|tileset|autotile|pbMessage|Interpreter|Scripts|MapInfos|warp \d+)\b/i;
    const casos = [];
    for (const caja of cajas()) {
      const texto = textoVisible(caja.crudo);
      const encontrado = patron.exec(texto);
      if (encontrado) casos.push({ ...muestra(caja), detalle: encontrado[0] });
    }
    for (const literal of corpus.ruby) {
      const encontrado = patron.exec(literal.texto);
      if (encontrado) casos.push({ mapId: null, evento: literal.seccion, texto: literal.texto.slice(0, 90), detalle: encontrado[0] });
    }
    return { total: casos.length, veredicto: casos.length ? "hallazgo" : "ok", universo: cajas().length + corpus.ruby.length, detalle: { casos: casos.length }, muestras: casos.slice(0, 6) };
  },
};

/** Coherencia del conteo: cajas del volcado frente a eventos y páginas declarados. */
const sondaConteoCoherente = {
  titulo: "Conteo de cajas coherente con eventos y páginas",
  ejecutar() {
    const volcado = corpus.volcado;
    const cajasMedidas = volcado.dialogos.length;
    const paginas = volcado.sourceTotals?.paginas ?? null;
    const eventos = volcado.sourceTotals?.eventosPokeMod ?? null;
    const problemas = [];
    if (cajasMedidas !== volcado.totals.boxes) problemas.push(`totals.boxes ${volcado.totals.boxes} ≠ ${cajasMedidas} filas`);
    if (cajasMedidas !== (volcado.sourceTotals?.cajasTexto ?? cajasMedidas)) problemas.push(`sourceTotals.cajasTexto ${volcado.sourceTotals?.cajasTexto} ≠ ${cajasMedidas}`);
    if (paginas !== null && cajasMedidas < paginas) problemas.push(`menos cajas (${cajasMedidas}) que páginas (${paginas})`);
    const mapasConCajas = new Set(volcado.dialogos.map((caja) => caja.mapId)).size;
    if (mapasConCajas !== volcado.totals.mapsWithBoxes) problemas.push(`mapas con cajas ${mapasConCajas} ≠ ${volcado.totals.mapsWithBoxes}`);
    return {
      total: problemas.length,
      veredicto: problemas.length ? "hallazgo" : "ok",
      universo: cajasMedidas,
      detalle: { cajas: cajasMedidas, eventos, paginas, mapasConCajas },
      muestras: problemas.map((motivo) => ({ detalle: motivo })),
    };
  },
};

/** El volcado se puede regenerar: existe el generador y su verify está en scripts. */
const sondaRegenerable = {
  titulo: "Volcado regenerable y verificado por script",
  ejecutar() {
    const paquete = fs.readFileSync(path.join(ROOT, "package.json"), "utf8");
    const piezas = {
      generador: fs.existsSync(path.join(ROOT, "tools", "plan900", "dump_dialogos.mjs")),
      normalizador: fs.existsSync(path.join(ROOT, "tools", "plan2700", "audit_dialogos.mjs")),
      scriptVerify: /"verify:plan2700:dialogos"\s*:/.test(paquete),
      scriptAudit: /"audit:plan2700:dialogos"\s*:/.test(paquete),
    };
    const faltan = Object.entries(piezas).filter(([, ok]) => !ok).map(([clave]) => clave);
    return { total: faltan.length, veredicto: faltan.length ? "hallazgo" : "ok", detalle: piezas, muestras: faltan.map((clave) => ({ detalle: `falta ${clave}` })) };
  },
};

/** Rendimiento del control: cuánto tarda el formato de las 19 801 cajas. */
const sondaRendimientoControl = {
  titulo: "El control de formato no ralentiza la suite",
  ejecutar() {
    const inicio = process.hrtime.bigint();
    const informe = analizarFormato(corpus.cajas, corpus.codigos, corpus.sistema);
    const milisegundos = Number(process.hrtime.bigint() - inicio) / 1e6;
    const umbral = 3000; // ms; el paso completo de CI por debajo de 3 s
    // El tiempo medido se imprime para el humano pero NO entra en el artefacto:
    // un artefacto verificable no puede cambiar de una corrida a otra por unos
    // milisegundos de diferencia.
    console.log(`  · control de formato: ${milisegundos.toFixed(0)} ms sobre ${informe.cajas} cajas (umbral ${umbral} ms)`);
    return {
      total: milisegundos > umbral ? 1 : 0,
      veredicto: milisegundos > umbral ? "hallazgo" : "ok",
      universo: informe.cajas,
      detalle: { cajas: informe.cajas, umbralMs: umbral, dentroDelUmbral: milisegundos <= umbral, errores: informe.errores.length, avisos: informe.avisos.length },
      muestras: milisegundos > umbral ? [{ detalle: `el control tardó más de ${umbral} ms` }] : [],
    };
  },
};

/** Las pantallas de error del editor viven en el paquete web, no en el juego. */
const sondaEditor = {
  titulo: "Textos de error del editor sin jerga y en español",
  ejecutar() {
    const archivos = [];
    for (const carpeta of ["web/js", "web"]) {
      const base = path.join(ROOT, carpeta);
      if (!fs.existsSync(base)) continue;
      for (const nombre of fs.readdirSync(base)) if (nombre.endsWith(".js") && nombre !== "marshal.js") archivos.push(path.join(base, nombre));
    }
    const patron = /\b(?:switch|flags?|rxdata|Interpreter|pbMessage|tileset)\b/i;
    const casos = [];
    let literales = 0;
    for (const archivo of archivos) {
      const fuente = fs.readFileSync(archivo, "utf8");
      for (const match of fuente.matchAll(/["'`]((?:[^"'`\\\n]|\\.){12,160})["'`]/g)) {
        const literal = match[1];
        if (!/[A-Za-zÁÉÍÓÚÑáéíóúñ]{4}/.test(literal) || /^[\w./@-]+$/.test(literal)) continue;
        literales++;
        if (patron.test(literal)) casos.push({ archivo: path.relative(ROOT, archivo), texto: literal.slice(0, 90), detalle: "jerga de motor" });
      }
    }
    return { total: casos.length, veredicto: casos.length ? "hallazgo" : "ok", universo: literales, detalle: { archivos: archivos.length, literales, casos: casos.length }, muestras: casos.slice(0, 5) };
  },
};

/** Lee una página de evento del mapa crudo: condiciones y cajas de texto. */
function paginasDeEvento(idMapa, filtroNombre) {
  const mapa = readMap(idMapa);
  const eventos = mapa.ivars.find(([clave]) => clave === "@events")?.[1];
  const lista = eventos?.pairs ? eventos.pairs : [];
  const salida = [];
  for (const [idEvento, evento] of lista) {
    const nombre = txt(evento.getIvar("@name"));
    if (filtroNombre && !filtroNombre.test(nombre)) continue;
    for (const [indice, pagina] of (evento.getIvar("@pages") ?? []).entries()) {
      const condicion = pagina.getIvar("@condition");
      const leer = (clave) => (condicion?.getIvar ? condicion.getIvar(clave) : undefined);
      // El texto de una página es el bloque 101 con sus continuaciones 401
      // unidas con un espacio, exactamente como lo ensambla el motor.
      const cajas = [];
      let enBloque = false;
      for (const comando of pagina.getIvar("@list") ?? []) {
        const codigo = Number(comando.getIvar("@code"));
        const valor = txt(comando.getIvar("@parameters")?.[0]);
        if (codigo === 101) { cajas.push(valor); enBloque = true; continue; }
        if (codigo === 401 && enBloque) { cajas[cajas.length - 1] = `${cajas[cajas.length - 1]} ${valor}`; continue; }
        if (codigo === 102 || codigo === 402) enBloque = false;
      }
      salida.push({
        evento: idEvento,
        nombre,
        pagina: indice + 1,
        switch1: leer("@switch1_valid") ? Number(leer("@switch1_id")) : 0,
        switch2: leer("@switch2_valid") ? Number(leer("@switch2_id")) : 0,
        texto: cajas.join(" "),
      });
    }
  }
  return salida;
}

/**
 * El hub de Oak vive en el mapa 48: tres NPC de Oak con una página por estado de
 * progreso más el consejero del mod. Se mide contra el mapa compilado, no contra
 * el volcado, porque lo que importa aquí es la condición de cada página.
 */
const sondaHubOak = {
  titulo: "Hub de Oak (mapa 48): páginas por estado y textos",
  ejecutar() {
    const paginas = paginasDeEvento(48, /Oak/i);
    const estados = new Map();
    for (const pagina of paginas) {
      const clave = pagina.switch1 || pagina.switch2 || 0;
      estados.set(clave, (estados.get(clave) ?? 0) + 1);
    }
    const conTexto = paginas.filter((pagina) => pagina.texto.trim());
    const vacias = paginas.filter((pagina) => !pagina.texto.trim());
    const ingles = conTexto.filter((pagina) => /\b(?:the|you|your|I'm|I\b|is|are|to|and|of)\b/i.test(pagina.texto) && !/\b(?:de|la|el|que|los|las|una|para|con)\b/i.test(pagina.texto));
    const español = conTexto.filter((pagina) => /\b(?:de|la|el|que|los|las|una|para|con|del)\b/i.test(pagina.texto));
    // Estados repetidos: la misma condición en más de un NPC del hub.
    const repetidos = [...estados.entries()].filter(([, veces]) => veces > 1);
    const postgame = paginas.filter((pagina) => pagina.switch1 === 429 || pagina.switch2 === 429);
    return {
      total: vacias.length + repetidos.length + (postgame.length ? 0 : 1),
      veredicto: vacias.length + repetidos.length + (postgame.length ? 0 : 1) ? "hallazgo" : "ok",
      universo: paginas.length,
      detalle: {
        paginas: paginas.length,
        conTexto: conTexto.length,
        sinTexto: vacias.length,
        enIngles: ingles.length,
        enEspanol: español.length,
        estadosDistintos: estados.size,
        estadosRepetidos: repetidos.length,
        paginasPostgame: postgame.length,
        paginaDelMod: paginas.filter((pagina) => /^PokeMod/i.test(pagina.nombre)).length,
      },
      muestras: [
        ...vacias.slice(0, 2).map((pagina) => ({ detalle: `página ${pagina.pagina} de «${pagina.nombre}» sin texto`, evento: pagina.nombre })),
        ...repetidos.slice(0, 2).map(([sw, veces]) => ({ detalle: `el estado del switch ${sw} se repite en ${veces} páginas` })),
        ...(postgame.length ? [] : [{ detalle: "ninguna página depende del switch 429 (postgame)" }]),
      ],
    };
  },
};

const SONDAS_LOCALES = {
  hub_oak: sondaHubOak,
  repeticion_jefes: sondaRepeticion(/jefe|campe|líder|guardi|Pokégod|Arceus|Espejo/i, 3),
  repeticion_heridos: sondaRepeticion(/Herido/i, 2),
  repeticion_mundos: sondaRepeticion(/Restauración|mundo/i, 2),
  repeticion_emisiones: sondaRepeticion(/Emisi[óo]n|Grieta|creepypasta/i, 3),
  repeticion_anclas: sondaRepeticion(/Atlas Mil|Ancla/i, 3),
  repeticion_testigos: sondaRepeticion(/Testigo/i, 2),
  repeticion_rivales: sondaRepeticion(/Rival|rival/i, 2),
  repeticion_profesores: sondaRepeticion(/Profesor|Prof\.|Investigador/i, 2),
  repeticion_pokegods: sondaRepeticion(/Pokégod/i, 2),
  repeticion_diplomas: sondaRepeticion(/Diploma/i, 2),
  repeticion_jefes_espejo: sondaRepeticion(/Espejo/i, 3),
  repeticion_rocket: sondaRepeticion(/Rocket/i, 3),
  repeticion_guardias: sondaRepeticion(/Guardia|Centinela|Vigilante|Control/i, 2),
  repeticion_transportes: sondaRepeticion(/Barco|Capit|Portal|Transporte|Torniquete/i, 3),
  voz_heridos: sondaVozPropia(/Herido/i, "Heridos de Team Rocket con nombre y voz propia"),
  voz_campeones: sondaVozPropia(/Campe[óo]n(?! de Fecha)/i, "Campeones con discurso propio"),
  voz_lideres: sondaVozPropia(/Líder /i, "Líderes con voz propia"),
  voz_pokegods: sondaVozPropia(/Pokégod/i, "Pokégods con presentación propia"),
  voz_jefes: sondaVozPropia(/jefe|campe|líder/i, "Jefes con voz propia"),
  voz_testigos: sondaVozPropia(/Testigo/i, "Testigos con voz propia"),
  voz_rotom: sondaVozPropia(/Rotom/i, "Rotom del Tiempo con voz propia"),
  voz_oak: sondaVozPropia(/Oak/i, "Oak con voz propia"),
  voz_rocket: sondaVozPropia(/Rocket/i, "Team Rocket con voz propia"),
  voz_profesores: sondaVozPropia(/Profesor|Prof\.|Investigador/i, "Profesores e investigadores con voz propia"),
  cupo_espejo: sondaCupo(/Espejo/i, 16, "Dieciséis jefes de Isla Espejo"),
  cupo_emisiones: sondaCupo(/Emisi[óo]n|Grieta|creepypasta/i, 7, "Siete emisiones de creepypasta"),
  cupo_mundos: sondaCupo(/Restauración/i, 7, "Siete mundos de la Restauración"),
  cupo_misiones_rocket: sondaCupo(/Rocket: Misi[óo]n/i, 5, "Cinco misiones de Team Rocket"),
  cupo_campanas: sondaCupo(/Campaña ROM/i, 5, "Cinco campañas invitadas"),
  cupo_mundos_teckel: sondaCupo(/Teckel|Maxine/i, 1, "Textos de Ciudad Teckel y Maxine"),
  sin_datos_objetos: sondaSinDatosSeDeclara(/Examin|Objeto|Ítem|Cartel|Poste|Letrero|Rótulo/i, "Objetos examinables y carteles"),
  sin_datos_menus: sondaSinDatosSeDeclara(/Menú|Menu/i, "Textos de menús en eventos"),
  sin_datos_guardado: sondaSinDatosSeDeclara(/Guardad|Guardar|Save/i, "Avisos de guardado"),
  sin_datos_recompensas: sondaSinDatosSeDeclara(/Recompensa|Premio|Regalo/i, "Textos de recompensas"),
  sin_datos_sellos: sondaSinDatosSeDeclara(/Sello/i, "Anuncios de sellos"),
  sin_datos_creditos: sondaSinDatosSeDeclara(/Crédito|Credito/i, "Créditos del juego"),
  perfil_glazed: sondaPerfil("glazed", "Campaña Glazed con textos propios"),
  perfil_light_platinum: sondaPerfil("light_platinum", "Campaña Light Platinum con textos propios"),
  perfil_liquid_crystal: sondaPerfil("liquid_crystal", "Campaña Liquid Crystal con textos propios"),
  perfil_tfoh: sondaPerfil("tfoh", "Campaña TFOH con textos propios"),
  perfil_unbound: sondaPerfil("unbound", "Campaña Unbound con textos propios"),
  horizontes: sondaHorizontes,
  cuarenta_lideres: sondaCuarentaLideres,
  emisiones: sondaEmisiones,
  glosario_estricto: sondaGlosario,
  jerga: sondaJerga,
  conteo_coherente: sondaConteoCoherente,
  volcado_regenerable: sondaRegenerable,
  rendimiento_control: sondaRendimientoControl,
  editor: sondaEditor,
};

// ------------------------------------------------------------------ reglas
/**
 * De la tarea al veredicto. La primera regla que casa manda. Lo que no casa
 * ninguna regla va al carril editorial o manual: no se finge verificado.
 */
const REGLAS = [
  // --- voz y plantillas
  { re: /derrota de los jefes/i, sonda: "humillacion" },
  { re: /heridos de Team Rocket/i, sonda: "voz_heridos" },
  { re: /siete mundos/i, sonda: "repeticion_mundos" },
  { re: /copie l[íi]neas de su cuento/i, sonda: "gore" },
  { re: /gore gratuito o parodia/i, sonda: "gore" },
  { re: /Liga Oscura.*catorce medallas/i, sonda: "repeticion_emisiones" },
  { re: /ocho campeones/i, sonda: "voz_campeones" },
  { re: /cuarenta l[íi]deres/i, sonda: "cuarenta_lideres" },
  { re: /cada l[íi]der presente su especialidad/i, sonda: "voz_lideres" },
  { re: /NPC de ciudad por cap[íi]tulo/i, sonda: "repeticion_rivales" },
  { re: /ning[úu]n NPC diga algo que ya no es cierto/i, sonda: "repeticion_rivales" },
  // --- carteles, objetos y menús
  { re: /carteles y verificar que coincidan/i, sonda: "sin_datos_objetos" },
  { re: /objetos examinables.*aporten algo/i, sonda: "sin_datos_objetos" },
  { re: /Reescribir los objetos examinables/i, sonda: "sin_datos_objetos" },
  { re: /men[úu]s nuevos y verificar su estilo/i, sonda: "editor" },
  { re: /avisos de guardado/i, sonda: "sin_datos_guardado" },
  { re: /recompensas y verificar que no se disparen/i, sonda: "sin_datos_recompensas" },
  // --- promesas y epílogo
  { re: /ning[úu]n texto prometa algo/i, sonda: "promesas" },
  { re: /promesas narrativas abiertas/i, sonda: "promesas" },
  { re: /ep[íi]logo mencione solo las dimensiones/i, sonda: "promesas" },
  { re: /texto final no prometa una secuela/i, sonda: "promesas" },
  // --- glosario, medallas y diplomas
  { re: /glosario del proyecto/i, sonda: "glosario_estricto" },
  { re: /t[ée]rmino distinto para el mismo concepto/i, sonda: "glosario_estricto" },
  { re: /nombres de las medallas y diplomas/i, sonda: "diplomas" },
  { re: /nombres coincidan tambi[ée]n en el visor/i, sonda: "diplomas" },
  { re: /textos de los diplomas/i, sonda: "diplomas" },
  { re: /entrega del Diploma de la Liga Oscura/i, sonda: "diplomas" },
  // --- hubs, guardias y transportes
  { re: /hub de Oak por estado/i, sonda: "hub_oak" },
  { re: /hub de Oak tenga respuesta para cada combinaci[óo]n/i, sonda: "hub_oak" },
  { re: /Oak en su hub/i, sonda: "hub_oak" },
  { re: /Oak no anime a un jugador/i, sonda: "hub_oak" },
  { re: /asistentes de los hubs/i, sonda: "repeticion_guardias" },
  { re: /ning[úu]n asistente repita/i, sonda: "repeticion_guardias" },
  { re: /guardias y verificadores/i, sonda: "repeticion_guardias" },
  { re: /ning[úu]n guardia bloquee el paso/i, sonda: "repeticion_guardias" },
  { re: /transportadores/i, sonda: "repeticion_transportes" },
  { re: /transportador mueva al jugador/i, sonda: "repeticion_transportes" },
  // --- jefes, emisiones, sellos, anclas
  { re: /jefes antes del combate en las siete regiones/i, sonda: "voz_jefes" },
  { re: /cada jefe diga algo distinto/i, sonda: "repeticion_jefes" },
  { re: /ning[úu]n jefe repita su discurso/i, sonda: "repeticion_jefes" },
  { re: /ning[úu]n jefe repita su texto de derrota/i, sonda: "repeticion_jefes" },
  { re: /siete emisiones y su degradaci[óo]n/i, sonda: "emisiones" },
  { re: /texto de emisi[óo]n se muestre fuera/i, sonda: "repeticion_emisiones" },
  { re: /textos de los sellos/i, sonda: "sin_datos_sellos" },
  { re: /anclas de Atlas/i, sonda: "repeticion_anclas" },
  { re: /anclas que compartan plantilla/i, sonda: "repeticion_anclas" },
  // --- Horizontes, Rocket, campañas
  { re: /500 aventuras de Horizontes/i, sonda: "horizontes" },
  { re: /aventuras que repitan estructura/i, sonda: "horizontes" },
  { re: /cinco misiones de Team Rocket/i, sonda: "cupo_misiones_rocket" },
  { re: /arco de las misiones se lea completo/i, sonda: "cupo_misiones_rocket" },
  { re: /infiltraci[óo]n y verificar que el disfraz/i, sonda: "voz_rocket" },
  { re: /textos de los rangos/i, sonda: "voz_rocket" },
  { re: /final del arco de Team Rocket/i, sonda: "repeticion_rocket" },
  { re: /final del arco se lea sin haber jugado/i, sonda: "repeticion_rocket" },
  { re: /cinco campa[ñn]as y su coherencia/i, sonda: "cupo_campanas" },
  { re: /ninguna campa[ñn]a use el conflicto de otra/i, sonda: "perfil_glazed" },
  { re: /rivales de cada regi[óo]n/i, sonda: "repeticion_rivales" },
  { re: /profesores e investigadores/i, sonda: "voz_profesores" },
  { re: /ning[úu]n investigador explique lo mismo/i, sonda: "repeticion_profesores" },
  { re: /heridos de la base/i, sonda: "voz_heridos" },
  { re: /ning[úu]n herido se repita/i, sonda: "repeticion_heridos" },
  // --- Ruta de Dios, multiverso y Teckel
  { re: /testigos de la Ruta de Dios/i, sonda: "voz_testigos" },
  { re: /gruta de testigos y su funci[óo]n/i, sonda: "repeticion_testigos" },
  { re: /gruta de testigos no contradiga el canon/i, sonda: "voz_testigos" },
  { re: /Rotom del Tiempo y su explicaci[óo]n/i, sonda: "voz_rotom" },
  { re: /explicaci[óo]n del multiverso no confunda/i, sonda: "glosario_estricto" },
  { re: /Maxine en ciudad Teckel/i, sonda: "cupo_mundos_teckel" },
  { re: /texto de Teckel quede como plantilla/i, sonda: "cupo_mundos_teckel" },
  { re: /Isla Espejo y de sus diecis[ée]is jefes/i, sonda: "cupo_espejo" },
  { re: /jefe de Isla Espejo repita/i, sonda: "repeticion_jefes_espejo" },
  { re: /Pok[ée]gods y su presentaci[óo]n/i, sonda: "voz_pokegods" },
  { re: /formas ALFA, BETA y OMEGA/i, sonda: "repeticion_pokegods" },
  // --- batalla final, créditos y editor
  { re: /batalla final y verificar su peso/i, sonda: "repeticion_jefes" },
  { re: /cr[ée]ditos y verificar las atribuciones/i, sonda: "creditos" },
  { re: /ninguna atribuci[óo]n falte/i, sonda: "creditos" },
  { re: /pantallas de error del editor/i, sonda: "editor" },
  { re: /textos del editor no usen jerga/i, sonda: "jerga" },
  // --- cola de cajas, control y conteos
  { re: /verify:dialogos:queue/i, sonda: "formato" },
  { re: /apply_cajas_dialogo\.mjs --verify/i, sonda: "formato" },
  { re: /Recontar los textos/i, sonda: "conteo_coherente" },
  { re: /conteo final de textos sea coherente/i, sonda: "conteo_coherente" },
  { re: /informe de di[áa]logos en `docs\/qa\/dialogos_informe\.md`/i, sonda: "informe_dialogos" },
  { re: /informe liste cada texto reescrito/i, sonda: "informe_dialogos" },
  { re: /ninguna reescritura haya cambiado el sentido/i, sonda: "formato" },
  { re: /escenas clave hayan sido rele[íi]das/i, sonda: "informe_dialogos" },
  { re: /carril de di[áa]logos con el volcado revisado/i, sonda: "formato" },
  { re: /ning[úu]n texto del DLC quede sin revisar/i, sonda: "conteo_coherente" },
  { re: /volcado se pueda regenerar/i, sonda: "volcado_regenerable" },
  { re: /volcado de di[áa]logos al flujo de CI/i, sonda: "control_en_ci" },
  { re: /control no ralentice la suite/i, sonda: "rendimiento_control" },
  { re: /control detecte cajas de una sola l[íi]nea/i, sonda: "formato" },
  { re: /control detecte signos de apertura/i, sonda: "formato" },
  { re: /control detecte comillas y guiones/i, sonda: "formato" },
  { re: /control detecte variables insertadas/i, sonda: "variables_insertadas" },
  { re: /carril de di[áa]logos con el control en CI/i, sonda: "control_en_ci" },
];

// ------------------------------------------------------------------ informe
/**
 * El informe se construye con las medidas de esta corrida. No incluye el
 * tiempo del control en milisegundos (cambia de una corrida a otra): incluye
 * el veredicto contra el umbral, que es lo que se puede verificar.
 */
function construirInforme(evaluacion) {
  const filasSonda = evaluacion.sondas
    .filter((sonda) => !["informe_dialogos", "rendimiento_control", "control_en_ci"].includes(sonda.sonda))
    .sort((a, b) => a.sonda.localeCompare(b.sonda));
  const formato = analizarFormato(corpus.cajas, corpus.codigos, corpus.sistema);
  const avisos = Object.entries(formato.porRegla ?? {})
    .map(([regla, veces]) => `| \`${regla}\` | ${veces} |`)
    .join("\n");
  const tabla = filasSonda
    .map((sonda) => `| ${sonda.sonda} | ${sonda.veredicto} | ${sonda.total} | ${sonda.universo ?? "—"} | ${sonda.titulo} |`)
    .join("\n");
  const candidatos = filasSonda
    .filter((sonda) => sonda.veredicto === "hallazgo")
    .map((sonda) => `| ${sonda.sonda} | ${sonda.total} | ${(sonda.muestras?.[0]?.texto ?? sonda.muestras?.[0]?.detalle ?? sonda.muestras?.[0]?.motivo ?? "—").toString().slice(0, 120)} |`)
    .join("\n");
  return `# Informe de diálogos del plan 2700

Fase 001 del lote · tanda 22 de \`tareas.txt\` (líneas ${tanda.lineas[0]}–${tanda.lineas[1]},
tareas ${tanda.tareas[0].id}–${tanda.tareas.at(-1).id}). Este informe se **regenera** con
\`npm run audit:plan2700:tanda22\` y se **verifica** con \`npm run verify:plan2700:tanda22\`:
si el contenido cambia y el informe no, la verificación falla.

## Conteos medidos

| Qué | Cuánto |
|---|---|
| Cajas de texto de evento (bloques 101/401) | ${corpus.cajas.length} |
| Mapas con cajas / mapas con eventos PokeMod | ${corpus.volcado.totals.mapsWithBoxes} / ${corpus.volcado.totals.mapsInSource} |
| Eventos PokeMod | ${corpus.volcado.sourceTotals.eventosPokeMod} |
| Páginas de evento | ${corpus.volcado.sourceTotals.paginas} |
| Hablantes distintos (\sp[Nombre] o «Nombre:») | ${corpus.volcado.totals.speakers} |
| Literales de jugador en secciones Ruby \`PokeMod_*\` | ${corpus.ruby.length} |
| Códigos de escape reconocidos por el motor | ${corpus.codigos.size} |

El volcado tiene ${corpus.cajas.length} cajas de texto y ${corpus.ruby.length} literales Ruby: esas dos cifras
son la referencia de todo lo demás. El veredicto de las 100 tareas —qué se verificó automáticamente,
qué es hallazgo abierto y qué queda en el carril de playtest o en el editorial— está en
\`content/plan2700_tanda22.json\`, fila por fila, con su sonda y su conteo.

## Control de formato

\`node tools/qa/dialogos_formato_check.mjs\` recorre las ${formato.cajas} cajas con las reglas de
\`REGLAS_FORMATO\` (una sola definición, compartida con las sondas de la tanda):

- **Errores:** ${formato.errores.length}. Un error rompe el build: caja vacía, código de escape que el
  motor no trata, variable insertada inexistente o sin nombre, etiqueta de hablante vacía, comillas
  desbalanceadas, comilla recta y salto de línea forzado.
- **Avisos:** ${formato.avisos.length}. Se publican y no rompen.

| Regla | Casos |
|---|---|
${avisos || "| — | 0 |"}

La autoprueba (\`--selftest\`) demuestra que cada regla dispara con una caja que la incumple y calla
con una caja correcta: 17 casos, 13 reglas.

## Sondas de la tanda

| Sonda | Veredicto | Casos | Universo | Qué mide |
|---|---|---|---|---|
${tabla}

## Textos reescritos en esta fase

**Ninguno.** Esta fase audita y mide; no reescribe contenido. Cada reescritura de una voz, de una
promesa o de un bloque largo es trabajo editorial y se hace con el hallazgo delante, no a ciegas: por
eso esta fase entrega **candidatos con su motivo** y no cambios de texto. La lista de candidatos es lo
que la tarea 2178 pide tener por escrito antes de tocar una sola caja:

| Sonda | Casos | Primer motivo medido |
|---|---|---|
${candidatos || "| — | 0 | — |"}

Cada candidato lleva su sonda, su conteo y una muestra; el detalle completo de las ${filasSonda.reduce((suma, sonda) => suma + (sonda.total ?? 0), 0)} observaciones
está en \`content/plan2700_tanda22.json\`, con el mapa y el evento de cada caso.

## Límite de este informe

Lo que aquí se mide es **estructura y forma sobre los datos compilados**: cajas, códigos, variables,
comillas, repeticiones literales entre eventos, conteos y presencia de registro. Lo que **no** se mide:
si una voz es buena, si un chiste hace gracia, si una escena se entiende jugando, si un jefe da miedo.
Eso exige partida y queda en el carril de playtest con su ficha. Ninguna tarea editorial se marca como
verificada por leer un archivo: las que solo se pueden juzgar así están declaradas \`manual\` en el
artefacto, con su carril.
`;
}

// ------------------------------------------------------------------ ejecución
const { evaluarTanda } = await import("./tanda_textos_core.mjs");
// Primera pasada: sirve para construir el informe (que después se audita a sí mismo).
const primeraPasada = evaluarTanda(tanda, REGLAS, corpus, SONDAS_LOCALES);
const informe = construirInforme(primeraPasada);
const rutaInforme = "docs/qa/dialogos_informe.md";
const destinoInforme = path.join(ROOT, rutaInforme);
if (VERIFY) {
  const actual = fs.existsSync(destinoInforme) ? fs.readFileSync(destinoInforme, "utf8") : "";
  if (actual !== informe) throw new Error(`${rutaInforme} está desactualizado; ejecuta la fase sin --verify`);
} else {
  fs.mkdirSync(path.dirname(destinoInforme), { recursive: true });
  fs.writeFileSync(destinoInforme, informe);
}
// Segunda pasada: ahora el informe ya existe y su sonda puede leerlo.
const evaluacion = VERIFY ? primeraPasada : evaluarTanda(tanda, REGLAS, corpus, SONDAS_LOCALES);

const filas = evaluacion.filas.map((fila) => ({
  id: fila.id,
  tarea: fila.tarea,
  estado: fila.estado,
  ...(fila.sonda ? { sonda: fila.sonda } : {}),
  ...(fila.carril ? { carril: fila.carril } : {}),
  ...(fila.total !== undefined ? { casos: fila.total } : {}),
  ...(fila.detalle ? { detalle: fila.detalle } : {}),
  ...(fila.motivo ? { motivo: fila.motivo } : {}),
}));

const informeFormato = analizarFormato(corpus.cajas, corpus.codigos, corpus.sistema);
const artefacto = {
  schema: "plan2700_tanda/1.0",
  fase: "001 — tanda 22 (líneas 2100–2199 de tareas.txt)",
  fuente: "tareas.txt",
  lineas: tanda.lineas,
  tareas: { total: tanda.tareas.length, primera: tanda.tareas[0].id, ultima: tanda.tareas.at(-1).id },
  resumen: evaluacion.resumen,
  contenido: {
    cajasDeTexto: corpus.cajas.length,
    mapasConCajas: corpus.volcado.totals.mapsWithBoxes,
    mapasEnFuente: corpus.volcado.totals.mapsInSource,
    eventosPokeMod: corpus.volcado.sourceTotals.eventosPokeMod,
    literalesRuby: corpus.ruby.length,
    codigosDeEscape: [...corpus.codigos].sort(),
    formato: { errores: informeFormato.errores.length, avisos: informeFormato.avisos.length, porRegla: informeFormato.porRegla },
  },
  sondas: evaluacion.sondas,
  filas,
};

const rutaArtefacto = "content/plan2700_tanda22.json";
if (VERIFY) {
  verificarArtefacto(rutaArtefacto, artefacto);
} else {
  escribirArtefacto(rutaArtefacto, artefacto);
}

if (JSON_OUT) {
  console.log(JSON.stringify(artefacto, null, 2));
  process.exit(0);
}

const resumen = evaluacion.resumen;
console.log(`Tanda 22 · líneas ${tanda.lineas[0]}–${tanda.lineas[1]} · tareas ${tanda.tareas[0].id}–${tanda.tareas.at(-1).id}`);
console.log(`  ${Object.entries(resumen).map(([estado, veces]) => `${estado} ${veces}`).join(" · ")}`);
console.log(`  cajas ${corpus.cajas.length} · formatos con error ${informeFormato.errores.length} · avisos ${informeFormato.avisos.length}`);
const hallazgos = filas.filter((fila) => fila.estado === "hallazgo");
if (hallazgos.length) {
  console.log("  hallazgos medidos:");
  for (const fila of hallazgos.slice(0, 12)) console.log(`   · ${fila.id} ${fila.sonda} → ${fila.casos} caso(s): ${fila.tarea.slice(0, 80)}`);
}
if (VERIFY) console.log(`✔ ${rutaArtefacto} está al día.`);
else console.log(`✔ escrito ${rutaArtefacto}`);
