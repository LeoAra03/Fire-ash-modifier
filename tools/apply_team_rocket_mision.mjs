#!/usr/bin/env node
/**
 * apply_team_rocket_mision.mjs
 *
 * «Implementa la dimensión del Pokémon Team Rocket para vivir las aventuras,
 * pero siendo Ash un infiltrado, el cual hará las misiones, pero también se
 * encargará de salvaguardar la vida de los lastimados, buscará escalar en
 * puesto para poder controlar esa dimensión y por el bienestar de los que ahí
 * residen.»
 *
 * Lo que construye:
 *
 *   · **Map2220 · Base Subterránea** — seis distritos tomados de interiores
 *     reales del juego, unidos y verificados sin celdas vacías ni aisladas.
 *   · **Map2221 · Núcleo del Mando** — el despacho donde se toma el control.
 *   · **Capitán** en Puerto Horizonte, cerrado hasta el duelo de Arceus, y
 *     **barco de vuelta** disponible siempre.
 *   · **La infiltración**: variable 311 es el rango (0 Recluta → 5 Jefe
 *     Supremo). Cinco misiones encadenadas: cada una sólo se ofrece al rango
 *     que toca y, al cumplirla, asciende. Dos de ellas se resuelven peleando.
 *   · **Los heridos**: tres personas tiradas por la base. Ash puede pararse a
 *     curarlas (variable 313). No puntúa para el ascenso: es lo que hace
 *     cuando nadie le ve, y el juego lo subraya.
 *   · **La toma del mando**: al llegar a Jefe Supremo, el Núcleo se abre y Ash
 *     dicta tres órdenes. Ninguna es de poder: son de bienestar. La dimensión
 *     pasa a cuidar a los suyos.
 *
 * Nada de esto toca contenido original: mapas nuevos, datos nuevos.
 *
 * Uso:
 *   node tools/apply_team_rocket_mision.mjs
 *   node tools/apply_team_rocket_mision.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import {
  DATA, ROOT, choice, choiceCase, choiceEnd, cmd, condition, elseBranch, endBranch, endEvent,
  event, eventsOf, graphic, ifScript, ifVariable, installItems, installMapInfos,
  installMetadata, installTrainerTypes, installTrainers, makeChecker, page, pagesOf,
  script, selfSwitch, spread, switchOn, texts, tint, transfer, upsert, varAdd, varSet,
  wait, txt,
} from "./lib/dlc_helpers.mjs";
import { celdasLibres, componer, publicar, verificarMapa } from "./lib/dimension_builder.mjs";

const VERIFY_ONLY = process.argv.includes("--verify");
const PLAN = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "team_rocket_mision.json"), "utf8"));
const DUELO = PLAN.interruptores.DUELO_RESUELTO;
const ABIERTA = PLAN.interruptores.ROCKET_ABIERTA;
const CONTROL = PLAN.interruptores.ROCKET_CONTROL;
const RANGO = PLAN.variables.RANGO;
const MISIONES = PLAN.variables.MISIONES;
const HERIDOS = PLAN.variables.HERIDOS;
const DIM = PLAN.dimension;
const PUERTO = PLAN.puerto.mapa;
const REGRESO = PLAN.puerto.pista;
const BACKUP = "team_rocket_mision";
const MARKER = "PokeMod Rocket:";
const LLEGADA = [2, 2];
const ULTIMO_RANGO = PLAN.rangos.length - 1;

const plano = (lista) => lista.flat(Infinity).filter(Boolean);
/** «Recuperar» (314): Ash cura a quien se ha parado a socorrer. */
const curar = (indent = 0) => cmd(314, [0], indent);
const viaje = (mapId, x, y, indent = 1) => [
  tint(-255, -255, -255, 0, 6, indent),
  wait(8, indent),
  transfer(mapId, x, y, 2, indent),
  tint(0, 0, 0, 0, 6, indent),
];
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
  const { canvas, pasillos, ventanas } = componer({
    tilesetId: DIM.tileset,
    distritos: DIM.distritos,
    lado: DIM.lado,
    columnas: DIM.columnas,
  });
  publicar(DIM.mapaId, DIM.titulo, canvas, { parentId: DIM.padre });
  // El Núcleo: una sala de mando construida con el mismo compositor, más íntima.
  const nucleo = componer({
    tilesetId: DIM.tileset,
    distritos: DIM.distritos.slice(0, 4),
    lado: DIM.lado,
    columnas: 2,
  });
  publicar(DIM.nucleoId, DIM.tituloNucleo, nucleo.canvas, { parentId: DIM.mapaId });
  return { pasillos, ventanas, ancho: canvas.width, alto: canvas.height };
}

function instalarMapInfosYMetadatos() {
  const specs = [
    { mapId: DIM.mapaId, title: DIM.titulo, parentId: DIM.padre, order: 910 },
    { mapId: DIM.nucleoId, title: DIM.tituloNucleo, parentId: DIM.mapaId, order: 911 },
  ];
  installMapInfos(specs, BACKUP);
  installMetadata(specs.map((s) => ({ mapId: s.mapId, parentId: s.parentId })), BACKUP);
}

/* ─────────────────────────── datos del juego ────────────────────────────── */

function instalarDatos() {
  const tipos = [
    { id: "ROCKET_AGENT", base: "GENTLEMAN", nombre: "Rocket" },
    { id: "ROCKET_BOSS", base: "LEADER_Brock", nombre: "Comandante Rocket" },
    { id: "ROCKET_RIVAL", base: "RIVAL1", nombre: "Rival Rocket" },
  ];
  const entrenadores = [];
  for (const t of PLAN.entrenadores) {
    entrenadores.push({ tipo: "ROCKET_AGENT", nombre: t.nombre, equipo: t.equipo, nivel: 100, derrota: t.frase });
  }
  for (const m of PLAN.misiones) {
    if (!m.batalla) continue;
    entrenadores.push({
      tipo: m.batalla.tipo, nombre: m.batalla.nombre,
      equipo: m.rango >= 4 ? ["PERSIAN", "NIDOKING", "NIDOQUEEN", "DRAPION", "TOXICROAK", "BISHARP"]
        : ["RATICATE", "ZUBAT", "KOFFING", "HOUNDOUR", "MUK", "CROBAT"],
      nivel: 100, derrota: m.hecho[0],
    });
  }
  entrenadores.push({
    tipo: PLAN.rival.tipo, nombre: PLAN.rival.nombre, equipo: PLAN.rival.equipo,
    nivel: PLAN.rival.nivel, derrota: PLAN.rival.derrota,
  });
  const medallas = [{ ...PLAN.medalla, plural: `${PLAN.medalla.nombre}s`, pocket: 8 }];
  return {
    tipos: installTrainerTypes(tipos, BACKUP),
    entrenadores: installTrainers(entrenadores, BACKUP),
    medallas: installItems(medallas, BACKUP),
  };
}

/* ───────────────────────────────── eventos ──────────────────────────────── */

function capitanEvent(cell) {
  return event(0, `${MARKER} Capitán — Team Rocket`, cell[0], cell[1], [
    page({
      gfx: graphic("trchar062", 2, 1, {}),
      list: plano([
        ...texts([
          "Patrón: ¿La dimensión del Sindicato? Existe, y mi barco llega. Pero no lleva a cualquiera.",
          "Patrón: Vuelve cuando hayas cerrado el duelo de la montaña. Antes de eso, allí no hay nada.",
        ]),
        endEvent(),
      ]),
    }),
    page({
      cond: condition({ sw: DUELO }),
      gfx: graphic("trchar062", 2, 1, {}),
      list: plano([
        ...texts([
          "Patrón: Allí dentro nadie entra como visita. Se entra con uniforme o no se entra.",
          "Patrón: Yo sólo llevo y traigo. Lo que hagas con el uniforme es cosa tuya.",
        ]),
        elegir("Zarpar", "Quedarse",
          (i) => [...viaje(DIM.mapaId, LLEGADA[0], LLEGADA[1], i), switchOn(ABIERTA, i)],
          (i) => texts(["Patrón: Como quieras. El barco no se mueve sin ti."], i)),
        endEvent(),
      ]),
    }),
  ]);
}

function eventoSimple(nombre, sprite, lineas, cond = null) {
  return event(0, `${MARKER} ${nombre}`, 0, 0, [
    page({
      cond: cond ?? condition(),
      gfx: graphic(sprite, 2, 1, {}),
      list: plano([...texts(lineas), endEvent()]),
    }),
  ]);
}

function misionEvent(mision, cell) {
  const cuerpo = [
    ...texts(mision.orden),
  ];
  if (mision.batalla) {
    cuerpo.push(
      script(`pbTrainerIntro(:${mision.batalla.tipo})`),
      ifScript(`pbTrainerBattle(:${mision.batalla.tipo},"${mision.batalla.nombre}",nil,false,0,true)`),
      ...texts(mision.hecho, 1),
      varSet(RANGO, mision.rango + 1, 1),
      varAdd(MISIONES, 1, 1),
      ...texts([mision.ascenso], 1),
      selfSwitch("A", 0, 1),
      elseBranch(),
      ...texts(["Has perdido. Vuelve cuando puedas con ello: aquí nadie te echa."], 1),
      endBranch(),
      script("pbTrainerEnd"),
    );
  } else {
    cuerpo.push(
      ...texts(mision.hecho),
      varSet(RANGO, mision.rango + 1),
      varAdd(MISIONES, 1),
      ...texts([mision.ascenso]),
      selfSwitch("A"),
    );
  }
  return event(0, `${MARKER} Misión — ${mision.titulo}`, cell[0], cell[1], [
    // Sin el rango: el encargo todavía no es tuyo.
    page({
      gfx: graphic(mision.sprite, 2, 1, {}),
      list: plano([...texts(["Todavía no tienes rango para este encargo. Sigue haciendo lo que te manden."]), endEvent()]),
    }),
    // Con el rango y sin hacer: la misión.
    page({
      cond: condition({ variable: [RANGO, mision.rango] }),
      gfx: graphic(mision.sprite, 2, 1, {}),
      list: plano([...cuerpo, endEvent()]),
    }),
    // Hecha.
    page({
      cond: condition({ self: "A" }),
      gfx: graphic(mision.sprite, 2, 1, {}),
      list: plano([...texts(["Eso ya está hecho. Ahora te toca lo siguiente."]), endEvent()]),
    }),
  ]);
}

function heridoEvent(herido, cell) {
  return event(0, `${MARKER} Herido — ${herido.nombre}`, cell[0], cell[1], [
    page({
      gfx: graphic(herido.sprite, 2, 1, {}),
      list: plano([
        ...texts([herido.antes]),
        elegir("Socorrer", "Seguir",
          (i) => [
            curar(i),                                            // curar al equipo
            varAdd(HERIDOS, 1, i),
            selfSwitch("A", 0, i),
            ...texts([herido.despues], i),
          ],
          (i) => texts(["Pasas de largo. Nadie te ha visto. Tú sí."], i)),
        endEvent(),
      ]),
    }),
    page({
      cond: condition({ self: "A" }),
      gfx: graphic(herido.sprite, 2, 1, {}),
      list: plano([...texts([herido.despues, "Ya estás mejor. Si te dejan, descansa."]), endEvent()]),
    }),
  ]);
}

function nucleoEvent(cell) {
  return event(0, `${MARKER} Núcleo del Mando`, cell[0], cell[1], [
    // Todavía no se manda.
    page({
      gfx: graphic(PLAN.nucleo.sprite, 2, 1, {}),
      list: plano([...texts(PLAN.nucleo.cerrado), endEvent()]),
    }),
    // Jefe Supremo: toma del mando.
    page({
      cond: condition({ variable: [RANGO, ULTIMO_RANGO] }),
      gfx: graphic(PLAN.nucleo.sprite, 2, 1, {}),
      list: plano([
        ...texts(PLAN.nucleo.toma),
        switchOn(CONTROL),
        script(`pbReceiveItem(:${PLAN.medalla.id})`),
        selfSwitch("A"),
        endEvent(),
      ]),
    }),
    // Ya se mandó.
    page({
      cond: condition({ self: "A" }),
      gfx: graphic(PLAN.nucleo.sprite, 2, 1, {}),
      list: plano([...texts(PLAN.nucleo.despues), endEvent()]),
    }),
  ]);
}

function eventosBase() {
  // barco, puerta del Núcleo, contacto, tablón, enfermería y centinela = 6
  const total = 6 + PLAN.misiones.length + PLAN.heridos.length + PLAN.entrenadores.length;
  const celdas = spread(celdasLibres(DIM.mapaId), total);
  let i = 0;
  const siguiente = () => celdas[i++];

  const eventos = [];
  // Barco de vuelta: sin condiciones.
  const barco = siguiente();
  eventos.push(event(0, `${MARKER} Barco a Puerto Horizonte`, barco[0], barco[1], [
    page({
      gfx: graphic("trchar062", 2, 1, {}),
      list: plano([
        ...texts([PLAN.dimension.barco.saludo, PLAN.dimension.barco.volver]),
        elegir("Volver", "Quedarse",
          (k) => viaje(PUERTO, REGRESO[0], REGRESO[1], k),
          (k) => texts(["Te quedas. El uniforme pesa, pero aguanta."], k)),
        endEvent(),
      ]),
    }),
  ]));

  // Puerta del Núcleo del Mando.
  const puerta = siguiente();
  eventos.push(event(0, `${MARKER} Puerta del Núcleo`, puerta[0], puerta[1], [
    page({
      cond: condition({ variable: [RANGO, ULTIMO_RANGO] }),
      gfx: graphic("", 2, 1, {}),
      list: plano([
        ...texts(["El Núcleo del Mando. Tu rango abre la puerta."]),
        elegir("Entrar", "Seguir",
          (k) => viaje(DIM.nucleoId, LLEGADA[0], LLEGADA[1], k),
          (k) => texts(["Vuelve cuando quieras."], k)),
        endEvent(),
      ]),
    }),
    page({
      gfx: graphic("", 2, 1, {}),
      list: plano([...texts(["Cerrada con llave de rango. Aún no eres Jefe Supremo."]), endEvent()]),
    }),
  ]));

  // Contacto, tablón y enfermería.
  const contacto = siguiente();
  eventos.push(eventoConCelda(`${MARKER} Contacto Gris`, contacto, DIM.contacto.sprite, DIM.contacto.lineas));
  const tablon = siguiente();
  eventos.push(eventoConCelda(`${MARKER} Tablón de Mando`, tablon, DIM.tablon.sprite, DIM.tablon.lineas));
  const enfermeria = siguiente();
  eventos.push(eventoConCelda(`${MARKER} Enfermera`, enfermeria, DIM.enfermeria.sprite, DIM.enfermeria.lineas));
  const centinela = siguiente();
  eventos.push(eventoConCelda(`${MARKER} Centinela`, centinela, DIM.centinela.sprite, DIM.centinela.lineas));

  // Misiones.
  for (const mision of PLAN.misiones) eventos.push(misionEvent(mision, siguiente()));

  // Heridos.
  for (const herido of PLAN.heridos) eventos.push(heridoEvent(herido, siguiente()));

  // Entrenadores de la base.
  for (const t of PLAN.entrenadores) {
    const celda = siguiente();
    eventos.push(event(0, `${MARKER} Agente — ${t.nombre}`, celda[0], celda[1], [
      page({
        gfx: graphic(t.sprite, 2, 1, {}),
        list: plano([
          ...texts([t.frase]),
          script("pbTrainerIntro(:ROCKET_AGENT)"),
          script(`$game_variables[318] = pbTrainerBattle(:ROCKET_AGENT,"${t.nombre}",nil,false,0,true) ? 1 : 0`),
          script("pbTrainerEnd"),
          endEvent(),
        ]),
      }),
    ]));
  }

  return eventos;
}

function eventoConCelda(nombre, celda, sprite, lineas) {
  const e = eventoSimple(nombre, sprite, lineas);
  e.setIvar("@x", celda[0]);
  e.setIvar("@y", celda[1]);
  return e;
}

function eventosNucleo() {
  const celdas = spread(celdasLibres(DIM.nucleoId), 3);
  return [
    (() => {
      const e = nucleoEvent(celdas[0]);
      return e;
    })(),
    (() => {
      const evento = event(0, `${MARKER} Salida del Núcleo`, celdas[1][0], celdas[1][1], [
        page({
          gfx: graphic("", 2, 1, {}),
          list: plano([...texts(["Vuelves a la base."]), viaje(DIM.mapaId, LLEGADA[0], LLEGADA[1], 0), endEvent()]),
        }),
      ]);
      return evento;
    })(),
    (() => eventoConCelda(`${MARKER} Rival Rocket`, celdas[2], PLAN.rival.sprite, PLAN.rival.intro))(),
  ];
}

/* ──────────────────────────── instalación ───────────────────────────────── */

function instalar() {
  const mapas = construirMapas();
  instalarMapInfosYMetadatos();
  const datos = instalarDatos();
  const libres = spread(celdasLibres(PUERTO), 1);
  upsert(PUERTO, [`${MARKER} Capitán`], () => [capitanEvent(libres[0])], BACKUP);
  upsert(DIM.mapaId, [MARKER], () => eventosBase(), BACKUP);
  upsert(DIM.nucleoId, [MARKER], () => eventosNucleo(), BACKUP);
  return { mapas, datos, capitan: libres[0] };
}

/* ──────────────────────────── verificación ──────────────────────────────── */

function verify() {
  const check = makeChecker("Dimensión Team Rocket");

  verificarMapa(check, DIM.mapaId, DIM.titulo, [LLEGADA], 0.2);
  verificarMapa(check, DIM.nucleoId, DIM.tituloNucleo, [LLEGADA], 0.2);

  // — capitán cerrado hasta el duelo
  const capitan = eventsOf(PUERTO).find((e) => e.name === `${MARKER} Capitán — Team Rocket`);
  check.ok(!!capitan, "falta el capitán de la dimensión Rocket");
  if (capitan) {
    const paginas = pagesOf(capitan);
    check.ok(paginas.length === 2, "el capitán debe tener dos páginas");
    check.ok(!!paginas[1].condition?.getIvar("@switch1_valid")
      && Number(paginas[1].condition.getIvar("@switch1_id")) === DUELO,
      "el capitán no exige el duelo de Arceus");
    check.ok(paginas[1].list.some((c) => c.code === 201 && Number(c.params[1]) === DIM.mapaId),
      "el capitán no lleva a la base");
  }

  // — barco de vuelta sin condiciones
  const barco = eventsOf(DIM.mapaId).find((e) => e.name === `${MARKER} Barco a Puerto Horizonte`);
  check.ok(!!barco, "falta el barco de vuelta");
  if (barco) {
    const primera = pagesOf(barco)[0];
    check.ok(!primera.condition?.getIvar("@switch1_valid"), "el barco de vuelta no puede estar condicionado");
    check.ok(primera.list.some((c) => c.code === 201 && Number(c.params[1]) === PUERTO),
      "el barco de vuelta no regresa a Puerto Horizonte");
  }

  // — cinco misiones encadenadas por rango
  for (const mision of PLAN.misiones) {
    const ev = eventsOf(DIM.mapaId).find((e) => e.name === `${MARKER} Misión — ${mision.titulo}`);
    check.ok(!!ev, `falta la misión «${mision.titulo}»`);
    if (!ev) continue;
    const paginas = pagesOf(ev);
    check.ok(paginas.length === 3, `«${mision.titulo}» debe tener tres páginas`);
    const cond = paginas[1].condition;
    check.ok(!!cond?.getIvar("@variable_valid") && Number(cond.getIvar("@variable_id")) === RANGO
      && Number(cond.getIvar("@variable_value")) === mision.rango,
      `«${mision.titulo}» no exige el rango ${mision.rango}`);
    const lista = paginas[1].list;
    check.ok(lista.some((c) => c.code === 122 && Number(c.params[1]) === RANGO && Number(c.params[4]) === mision.rango + 1),
      `«${mision.titulo}» no asciende al rango ${mision.rango + 1}`);
    check.ok(lista.some((c) => c.code === 122 && Number(c.params[1]) === MISIONES),
      `«${mision.titulo}» no cuenta la misión`);
    if (mision.batalla) {
      check.ok(lista.some((c) => (c.code === 111 || c.code === 355)
        && [c.params[0], c.params[1]].some((p) => String(p ?? "").includes(`pbTrainerBattle(:${mision.batalla.tipo}`))),
        `«${mision.titulo}» no pelea como está escrito`);
    }
  }

  // — los heridos se pueden socorrer y eso se cuenta
  const heridos = eventsOf(DIM.mapaId).filter((e) => e.name.startsWith(`${MARKER} Herido —`));
  check.ok(heridos.length === PLAN.heridos.length,
    `se esperaban ${PLAN.heridos.length} heridos y hay ${heridos.length}`);
  for (const h of heridos) {
    const primera = pagesOf(h)[0];
    check.ok(primera.list.some((c) => c.code === 314), `${h.name}: no ofrece curar`);
    check.ok(primera.list.some((c) => c.code === 122 && Number(c.params[1]) === HERIDOS),
      `${h.name}: socorrer no se cuenta`);
  }

  // — el Núcleo sólo se abre con el rango máximo y entrega la insignia
  const nucleo = eventsOf(DIM.nucleoId).find((e) => e.name === `${MARKER} Núcleo del Mando`);
  check.ok(!!nucleo, "falta el Núcleo del Mando");
  if (nucleo) {
    const paginas = pagesOf(nucleo);
    check.ok(paginas.length === 3, "el Núcleo debe tener tres páginas");
    const cond = paginas[1].condition;
    check.ok(!!cond?.getIvar("@variable_valid")
      && Number(cond.getIvar("@variable_value")) === ULTIMO_RANGO,
      `el Núcleo no exige el rango ${ULTIMO_RANGO} (Jefe Supremo)`);
    check.ok(paginas[1].list.some((c) => c.code === 121 && Number(c.params[0]) === CONTROL),
      "la toma del mando no enciende el control de la dimensión");
    check.ok(paginas[1].list.some((c) => [c.params?.[0], c.params?.[1]]
      .some((p) => String(p ?? "").includes(`pbReceiveItem(:${PLAN.medalla.id}`))),
      "la toma del mando no entrega la insignia");
  }

  check.done();
}

/* ──────────────────────────────── main ──────────────────────────────────── */

if (VERIFY_ONLY) {
  verify();
} else {
  const resultado = instalar();
  console.log("✔ Dimensión Team Rocket instalada");
  console.log(`  · Map${DIM.mapaId} «${DIM.titulo}» ${resultado.mapas.ancho}×${resultado.mapas.alto} · ${resultado.mapas.ventanas.length} distritos · ${resultado.mapas.pasillos} pasillos`);
  console.log(`  · Map${DIM.nucleoId} «${DIM.tituloNucleo}»`);
  console.log(`  · misiones encadenadas: ${PLAN.misiones.length} (rango 0 → ${ULTIMO_RANGO})`);
  console.log(`  · heridos que Ash puede socorrer: ${PLAN.heridos.length} · variable ${HERIDOS}`);
  console.log(`  · rangos: ${PLAN.rangos.join(" → ")}`);
  const nuevos = (lista) => lista.filter((x) => x.added).length;
  console.log(`  · tipos: ${nuevos(resultado.datos.tipos)}/${resultado.datos.tipos.length} · entrenadores: ${nuevos(resultado.datos.entrenadores)}/${resultado.datos.entrenadores.length} · objetos: ${nuevos(resultado.datos.medallas)}/${resultado.datos.medallas.length}`);
  verify();
}
