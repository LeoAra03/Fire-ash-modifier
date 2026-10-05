#!/usr/bin/env node
/**
 * apply_dimensiones_barco.mjs
 *
 * «Atlas, Glazed y Light Platinum son lugares a explorar accesibles desde
 * barco.» Atlas ya tenía su capitán; faltaban las otras dos. Esta herramienta
 * crea las dos dimensiones invitadas navegables:
 *
 *   · **Glazed** (Map2200 + gimnasio 2201) — bahía fría, seis distritos
 *     tomados de Cedolán, Lerucean, la Meseta Ingido y sus rutas.
 *   · **Light Platinum** (Map2210 + gimnasio 2211) — costa luminosa, seis
 *     distritos tomados del pueblo costero, la ciudad verde, las sendas, la
 *     zona safari y el frente de batalla.
 *
 * Cada dimensión se construye con ventanas reales de mapas del juego, se une
 * con avenidas en serpentina y se comprueba que **no quede una sola celda
 * vacía ni aislada**. Después se puebla con capitán en Puerto Horizonte,
 * barco de vuelta en la orilla, cronista del Fragmento, cuatro entrenadores,
 * dos pobladores y un gimnasio nuevo con su líder y su medalla.
 *
 * Los capitanes están cerrados hasta el duelo de Arceus (switch 873): son
 * Fragmentos de dimensión, y eso es canon. La vuelta nunca está cerrada.
 *
 * Nada de esto toca contenido original: los mapas son nuevos y los datos se
 * añaden con identificadores nuevos.
 *
 * Uso:
 *   node tools/apply_dimensiones_barco.mjs
 *   node tools/apply_dimensiones_barco.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import {
  DATA, ROOT, S, choice, choiceCase, choiceEnd, cmd, condition, elseBranch, endBranch,
  endEvent, event, eventsOf, graphic, ifScript, installItems, installMapInfos,
  installMetadata, installTrainerTypes, installTrainers, makeChecker, page, pagesOf,
  script, selfSwitch, spread, switchOn, texts, tint, transfer, upsert, wait, txt,
} from "./lib/dlc_helpers.mjs";
import {
  celdasLibres, componer, componerGimnasio, publicar, verificarMapa,
} from "./lib/dimension_builder.mjs";

const VERIFY_ONLY = process.argv.includes("--verify");
const PLAN = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "dimensiones_barco.json"), "utf8"));
const DUELO = PLAN.interruptores.DUELO_RESUELTO;
const PUERTO = PLAN.puerto.mapa;
const REGRESO = PLAN.puerto.pistas[0];
const BACKUP = "dimensiones_barco";
const MARKER = "PokeMod Barco:";

/** Aplana bloques anidados dentro de una lista de comandos. */
const plano = (lista) => lista.flat(Infinity).filter(Boolean);

/** Viaje con fundido: fundido a negro, transferencia y fundido de vuelta. */
const viaje = (mapId, x, y, indent = 1) => [
  tint(-255, -255, -255, 0, 6, indent),
  wait(8, indent),
  transfer(mapId, x, y, 2, indent),
  tint(0, 0, 0, 0, 6, indent),
];

/** Bloque «¿Sí o No?» con dos ramas. */
function elegir(si, no, ramaSi, ramaNo, indent = 0) {
  return [
    choice([si, no], indent),
    choiceCase(0, si, indent),
    ...plano(ramaSi(indent + 1)),
    choiceCase(1, no, indent),
    ...plano(ramaNo(indent + 1)),
    choiceEnd(indent),
  ];
}

/* ─────────────────────────────── los mapas ──────────────────────────────── */

function construirMapas() {
  const informe = [];
  for (const dim of PLAN.dimensiones) {
    const { canvas, centros, pasillos, ventanas } = componer({
      tilesetId: dim.tileset,
      distritos: dim.distritos,
      lado: dim.lado,
      columnas: dim.columnas,
    });
    publicar(dim.mapaId, dim.titulo, canvas, { parentId: dim.padre, bgm: dim.musica || "" });
    const gimnasio = componerGimnasio({
      ancho: PLAN.gimnasio.ancho,
      alto: PLAN.gimnasio.alto,
      donante: PLAN.donanteGimnasio,
      tilesetId: PLAN.gimnasio.tileset,
    });
    publicar(dim.gimnasioId, dim.tituloGimnasio, gimnasio.canvas, { parentId: dim.mapaId });
    informe.push({ dim, ancho: canvas.width, alto: canvas.height, pasillos, ventanas });
  }
  return informe;
}

function instalarMapInfosYMetadatos() {
  const specs = [];
  for (const dim of PLAN.dimensiones) {
    specs.push({ mapId: dim.mapaId, title: dim.titulo, parentId: dim.padre, order: 900 });
    specs.push({ mapId: dim.gimnasioId, title: dim.tituloGimnasio, parentId: dim.mapaId, order: 901 });
  }
  installMapInfos(specs, BACKUP);
  installMetadata(specs.map((s) => ({ mapId: s.mapId, parentId: s.parentId })), BACKUP);
}

/* ─────────────────────────── datos del juego ────────────────────────────── */

function instalarDatos() {
  const tipos = [];
  const entrenadores = [];
  const medallas = [];
  for (const dim of PLAN.dimensiones) {
    const tipoBase = dim.id === "glazed" ? "GLAZED_TRAINER" : "PLATINUM_TRAINER";
    tipos.push({ id: tipoBase, base: "GENTLEMAN", nombre: dim.slug });
    tipos.push({ id: dim.lider.tipo, base: "LEADER_Brock", nombre: dim.lider.mostrado });
    for (const t of dim.entrenadores) {
      entrenadores.push({ tipo: tipoBase, nombre: t.nombre, equipo: t.equipo, nivel: 100, derrota: t.frase });
    }
    entrenadores.push({
      tipo: dim.lider.tipo, nombre: dim.lider.nombre, equipo: dim.lider.equipo,
      nivel: dim.lider.nivel, derrota: dim.lider.derrota,
    });
    medallas.push({ id: dim.medalla, base: "BOULDERBADGE", nombre: dim.nombreMedalla, plural: `${dim.nombreMedalla}s`, pocket: 8 });
  }
  return {
    tipos: installTrainerTypes(tipos, BACKUP),
    entrenadores: installTrainers(entrenadores, BACKUP),
    medallas: installItems(medallas, BACKUP),
  };
}

/* ───────────────────────────────── eventos ──────────────────────────────── */

const LLEGADA = [2, 2];

function capitanEvent(dim, cell) {
  return event(0, `${MARKER} Capitán — ${dim.slug}`, cell[0], cell[1], [
    // Sin el duelo de Arceus el Fragmento no se sostiene: no hay viaje.
    page({
      gfx: graphic(dim.capitan.sprite, 2, 1, {}),
      list: plano([
        ...texts([
          `${dim.capitan.nombre}: Esa dimensión todavía no existe.`,
          "Cuando el Fragmento se sostenga por sí solo, mi barco sabrá el camino. Hasta entonces, no.",
        ]),
        endEvent(),
      ]),
    }),
    // Con el duelo resuelto: zarpar o quedarse.
    page({
      cond: condition({ sw: DUELO }),
      gfx: graphic(dim.capitan.sprite, 2, 1, {}),
      list: plano([
        ...texts(dim.capitan.saludo),
        elegir("Zarpar", "Quedarse",
          (i) => [...texts([dim.capitan.ir], i), ...viaje(dim.mapaId, LLEGADA[0], LLEGADA[1], i), switchOn(dim.abierta, i)],
          (i) => texts([dim.capitan.quedarse], i)),
        endEvent(),
      ]),
    }),
  ]);
}

function eventosDimension(dim) {
  const total = 4 + dim.entrenadores.length + dim.pobladores.length;
  const celdas = spread(celdasLibres(dim.mapaId), total);
  let i = 0;
  const siguiente = () => celdas[i++];

  const barco = siguiente();
  const puerta = siguiente();
  const cronista = siguiente();
  const eventos = [];

  // Barco de vuelta: disponible siempre, sin condiciones.
  eventos.push(event(0, `${MARKER} Barco a Puerto Horizonte`, barco[0], barco[1], [
    page({
      gfx: graphic(dim.capitan.sprite, 2, 1, {}),
      list: plano([
        ...texts([dim.muelle.saludo, dim.muelle.volver]),
        elegir("Volver", "Quedarse",
          (k) => viaje(PUERTO, REGRESO[0], REGRESO[1], k),
          (k) => texts(["Te quedas. El barco espera, no se cansa."], k)),
        endEvent(),
      ]),
    }),
  ]));

  // Puerta del gimnasio.
  eventos.push(event(0, `${MARKER} Puerta del Gimnasio — ${dim.slug}`, puerta[0], puerta[1], [
    page({
      cond: condition({ sw: dim.abierta }),
      gfx: graphic("", 2, 1, {}),
      list: plano([
        ...texts([`${dim.tituloGimnasio}. El ${dim.lider.mostrado} entrena dentro.`]),
        elegir("Entrar", "Seguir explorando",
          (k) => viaje(dim.gimnasioId, 2, 2, k),
          (k) => texts(["Vuelve cuando quieras."], k)),
        endEvent(),
      ]),
    }),
    page({
      gfx: graphic("", 2, 1, {}),
      list: plano([...texts(["La puerta del gimnasio está cerrada por dentro. Alguien entrena al otro lado."]), endEvent()]),
    }),
  ]));

  // Cronista del Fragmento.
  eventos.push(event(0, `${MARKER} Cronista — ${dim.slug}`, cronista[0], cronista[1], [
    page({
      gfx: graphic(dim.cronista.sprite, 2, 1, {}),
      list: plano([...texts(dim.cronista.lineas), endEvent()]),
    }),
  ]));

  // Entrenadores: se puede perder, nunca bloquean el paso.
  const tipoBase = dim.id === "glazed" ? "GLAZED_TRAINER" : "PLATINUM_TRAINER";
  const variable = dim.id === "glazed" ? 314 : 315;
  for (const t of dim.entrenadores) {
    const celda = siguiente();
    eventos.push(event(0, `${MARKER} Entrenador — ${t.nombre}`, celda[0], celda[1], [
      page({
        gfx: graphic(t.sprite, 2, 1, {}),
        list: plano([
          ...texts([t.frase]),
          script(`pbTrainerIntro(:${tipoBase})`),
          script(`$game_variables[${variable}] = pbTrainerBattle(:${tipoBase},"${t.nombre}",nil,false,0,true) ? 1 : 0`),
          script("pbTrainerEnd"),
          endEvent(),
        ]),
      }),
    ]));
  }

  // Pobladores.
  for (const p of dim.pobladores) {
    const celda = siguiente();
    eventos.push(event(0, `${MARKER} Poblador — ${dim.slug}`, celda[0], celda[1], [
      page({
        gfx: graphic(p.sprite, 2, 1, {}),
        list: plano([...texts(p.lineas), endEvent()]),
      }),
    ]));
  }

  return eventos;
}

function eventosGimnasio(dim) {
  const celdas = spread(celdasLibres(dim.gimnasioId), 2);
  const salida = celdas[0];
  const lider = celdas[1];
  return [
    event(0, `${MARKER} Salida del Gimnasio`, salida[0], salida[1], [
      page({
        gfx: graphic("", 2, 1, {}),
        list: plano([...texts(["Sales al aire libre."]), viaje(dim.mapaId, LLEGADA[0], LLEGADA[1], 0), endEvent()]),
      }),
    ]),
    event(0, `${MARKER} Líder — ${dim.lider.mostrado}`, lider[0], lider[1], [
      page({
        gfx: graphic(dim.lider.sprite, 2, 1, {}),
        list: plano([
          ...texts(dim.lider.intro),
          script(`pbTrainerIntro(:${dim.lider.tipo})`),
          ifScript(`pbTrainerBattle(:${dim.lider.tipo},"${dim.lider.nombre}",nil,false,0,true)`),
          ...texts([dim.lider.victoria], 1),
          script(`pbReceiveItem(:${dim.medalla})`, 1),
          selfSwitch("A", 0, 1),
          elseBranch(),
          ...texts([dim.lider.derrota], 1),
          endBranch(),
          script("pbTrainerEnd"),
          endEvent(),
        ]),
      }),
      page({
        cond: condition({ self: "A" }),
        gfx: graphic(dim.lider.sprite, 2, 1, {}),
        list: plano([...texts(["Entrena y vuelve: el gimnasio no se cierra."]), endEvent()]),
      }),
    ]),
  ];
}

function instalarCapitanes() {
  const libres = spread(celdasLibres(PUERTO), PLAN.dimensiones.length);
  const construidos = PLAN.dimensiones.map((dim, index) => capitanEvent(dim, libres[index]));
  upsert(PUERTO, [`${MARKER} Capitán`], () => construidos, BACKUP);
  return libres;
}

function instalar() {
  const mapas = construirMapas();
  instalarMapInfosYMetadatos();
  const datos = instalarDatos();
  const capitanes = instalarCapitanes();
  for (const dim of PLAN.dimensiones) {
    upsert(dim.mapaId, [MARKER], () => eventosDimension(dim), BACKUP);
    upsert(dim.gimnasioId, [MARKER], () => eventosGimnasio(dim), BACKUP);
  }
  return { mapas, datos, capitanes };
}

/* ──────────────────────────── verificación ──────────────────────────────── */

function verify() {
  const check = makeChecker("Dimensiones de barco");

  for (const dim of PLAN.dimensiones) {
    const arranques = [LLEGADA];

    // — el mapa de la dimensión es jugable
    verificarMapa(check, dim.mapaId, dim.titulo, arranques, 0.25);
    verificarMapa(check, dim.gimnasioId, dim.tituloGimnasio, [[2, 2]], 0.25);

    // — capitán en el puerto, cerrado hasta el duelo
    const capitan = eventsOf(PUERTO).find((e) => e.name === `${MARKER} Capitán — ${dim.slug}`);
    check.ok(!!capitan, `falta el capitán de ${dim.slug} en el puerto ${PUERTO}`);
    if (capitan) {
      const paginas = pagesOf(capitan);
      check.ok(paginas.length === 2, `el capitán de ${dim.slug} debe tener dos páginas`);
      const abierta = paginas[1];
      check.ok(!!abierta.condition?.getIvar("@switch1_valid")
        && Number(abierta.condition.getIvar("@switch1_id")) === DUELO,
        `el capitán de ${dim.slug} no exige el duelo de Arceus (${DUELO})`);
      check.ok(abierta.list.some((c) => c.code === 201 && Number(c.params[1]) === dim.mapaId),
        `el capitán de ${dim.slug} no transfiere a su dimensión`);
      check.ok(abierta.list.some((c) => c.code === 121 && Number(c.params[0]) === dim.abierta),
        `el capitán de ${dim.slug} no abre su dimensión`);
    }

    // — barco de vuelta siempre disponible y sin condiciones
    const barco = eventsOf(dim.mapaId).find((e) => e.name === `${MARKER} Barco a Puerto Horizonte`);
    check.ok(!!barco, `${dim.slug}: falta el barco de vuelta`);
    if (barco) {
      const pagina = pagesOf(barco)[0];
      check.ok(!pagina.condition || !pagina.condition.getIvar("@switch1_valid"),
        `${dim.slug}: el barco de vuelta no puede estar condicionado`);
      check.ok(pagina.list.some((c) => c.code === 201 && Number(c.params[1]) === PUERTO),
        `${dim.slug}: el barco de vuelta no lleva a Puerto Horizonte`);
    }

    // — gimnasio con líder y medalla
    const lider = eventsOf(dim.gimnasioId).find((e) => e.name === `${MARKER} Líder — ${dim.lider.mostrado}`);
    check.ok(!!lider, `${dim.slug}: falta el líder del gimnasio`);
    if (lider) {
      const primera = pagesOf(lider)[0];
      const llama = primera.list.some((c) => (c.code === 355 || c.code === 111)
        && [c.params[0], c.params[1]].some((p) => String(p ?? "").includes(`pbTrainerBattle(:${dim.lider.tipo}`)));
      check.ok(llama, `${dim.slug}: el líder no invoca su combate`);
      check.ok(primera.list.some((c) => (c.code === 355 || c.code === 655 || c.code === 111)
        && [c.params[0], c.params[1]].some((p) => String(p ?? "").includes(`pbReceiveItem(:${dim.medalla}`))),
        `${dim.slug}: el líder no entrega la medalla ${dim.medalla}`);
    }

    // — entrenadores
    const tipoBase = dim.id === "glazed" ? "GLAZED_TRAINER" : "PLATINUM_TRAINER";
    const peleas = eventsOf(dim.mapaId).filter((e) => e.name.startsWith(`${MARKER} Entrenador —`));
    check.ok(peleas.length === dim.entrenadores.length,
      `${dim.slug}: se esperaban ${dim.entrenadores.length} entrenadores y hay ${peleas.length}`);
    for (const p of peleas) {
      const lista = pagesOf(p)[0].list;
      check.ok(lista.some((c) => (c.code === 355 || c.code === 655 || c.code === 111)
        && [c.params[0], c.params[1]].some((p) => String(p ?? "").includes(`pbTrainerBattle(:${tipoBase}`))),
        `${dim.slug}: ${p.name} no pelea con el tipo ${tipoBase}`);
    }

    // — cronista
    check.ok(eventsOf(dim.mapaId).some((e) => e.name === `${MARKER} Cronista — ${dim.slug}`),
      `${dim.slug}: falta el cronista`);
  }

  check.done();
}

/* ──────────────────────────────── main ──────────────────────────────────── */

if (VERIFY_ONLY) {
  verify();
} else {
  const resultado = instalar();
  console.log(`✔ Dimensiones de barco instaladas: ${PLAN.dimensiones.length}`);
  for (const { dim, ancho, alto, pasillos, ventanas } of resultado.mapas) {
    console.log(`  · ${dim.slug}: Map${dim.mapaId} ${ancho}×${alto} · ${ventanas.length} distritos · ${pasillos} pasillos de unión`);
    for (const v of ventanas) {
      console.log(`      - ${v.label} ← mapa ${v.sourceId} (ventana ${v.ox},${v.oy} · ${v.tiles} tiles · ${(v.ratio * 100).toFixed(0)}% andable)`);
    }
    console.log(`      gimnasio Map${dim.gimnasioId} · líder ${dim.lider.mostrado} · ${dim.medalla}`);
  }
  const nuevos = (lista) => lista.filter((x) => x.added).length;
  console.log(`  · tipos nuevos: ${nuevos(resultado.datos.tipos)} de ${resultado.datos.tipos.length}`);
  console.log(`  · entrenadores nuevos: ${nuevos(resultado.datos.entrenadores)} de ${resultado.datos.entrenadores.length}`);
  console.log(`  · medallas nuevas: ${nuevos(resultado.datos.medallas)} de ${resultado.datos.medallas.length}`);
  console.log(`  · capitanes en Puerto Horizonte: ${resultado.capitanes.length}`);
  verify();
}
