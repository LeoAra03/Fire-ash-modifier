#!/usr/bin/env node
/**
 * apply_atlas_circuito.mjs
 *
 * «Atlas se accede mediante un portal, es un mundo totalmente nuevo y
 * explorable con muchos líderes de gimnasio, con distintos rivales y equipos.»
 *
 * Esto es lo que le faltaba a Atlas para ser un mundo y no sólo mil mapas: una
 * liga propia. Construye:
 *
 *   · **Map2230 · Avenida de los Ocho Gimnasios** — una plaza larga hecha con
 *     seis plazas reales de ciudades canónicas, con ocho puertas, maestro de
 *     circuito, tablón, rivales y cuadrillas, y el portal de vuelta.
 *   · **Map2250–2257 · ocho gimnasios de Atlas**, cada uno con un donante de
 *     gimnasio distinto, dos entrenadores y **un líder original con su propia
 *     medalla**: Bruma, Veta, Duna, Fragua, Marea, Vendaval, Invernadero y
 *     Cumbre.
 *   · **Circuito encadenado**: la primera puerta está abierta y cada una de las
 *     demás se abre con la medalla anterior (switches 970–977). La variable
 *     319 lleva la cuenta de medallas.
 *   · **Tres rivales** (Dalia, Íñigo y Néstor) y **cuatro cuadrillas** que
 *     pelean con sus propios equipos.
 *   · **Portal de Atlas** en Puerto Horizonte: cerrado hasta el duelo de
 *     Arceus, y con la vuelta siempre libre.
 *
 * No se toca contenido original: mapas y datos nuevos, en identificadores
 * nuevos.
 *
 * Uso:
 *   node tools/apply_atlas_circuito.mjs
 *   node tools/apply_atlas_circuito.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import {
  DATA, ROOT, choice, choiceCase, choiceEnd, cmd, condition, elseBranch, endBranch,
  endEvent, event, eventsOf, graphic, ifScript, installItems, installMapInfos,
  installMetadata, installTrainerTypes, installTrainers, makeChecker, page, pagesOf,
  script, selfSwitch, spread, switchOn, texts, tint, transfer, upsert, varAdd, varSet,
  wait, txt,
} from "./lib/dlc_helpers.mjs";
import { celdasLibres, componer, componerGimnasio, publicar, verificarMapa } from "./lib/dimension_builder.mjs";

const VERIFY_ONLY = process.argv.includes("--verify");
const PLAN = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "atlas_circuito.json"), "utf8"));
const DUELO = PLAN.interruptores.DUELO_RESUELTO;
const MEDALLAS = PLAN.medallas.variable;
const CIRCUITO = PLAN.circuito;
const BACKUP = "atlas_circuito";
const MARKER = "PokeMod Circuito:";
const LLEGADA = [2, 2];
const TOTAL = PLAN.gimnasios.length;

const plano = (lista) => lista.flat(Infinity).filter(Boolean);
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
/** Switch de la medalla del gimnasio número `n` (1..8). */
const medalla = (n) => PLAN.interruptores.CIRCUITO_BASE + n - 1;

/* ─────────────────────────────── los mapas ──────────────────────────────── */

function construirMapas() {
  const { canvas, pasillos, ventanas } = componer({
    tilesetId: CIRCUITO.tileset,
    distritos: CIRCUITO.distritos,
    lado: CIRCUITO.lado,
    columnas: CIRCUITO.columnas,
  });
  publicar(CIRCUITO.mapaId, CIRCUITO.titulo, canvas, { parentId: CIRCUITO.padre });
  for (const gimnasio of PLAN.gimnasios) {
    const { canvas: sala } = componerGimnasio({
      ancho: 46, alto: 42, donante: gimnasio.donante, tilesetId: 14,
    });
    publicar(gimnasio.mapaId, gimnasio.titulo, sala, { parentId: CIRCUITO.mapaId });
  }
  return { pasillos, ventanas, ancho: canvas.width, alto: canvas.height };
}

function instalarMapInfosYMetadatos() {
  const specs = [{ mapId: CIRCUITO.mapaId, title: CIRCUITO.titulo, parentId: CIRCUITO.padre, order: 920 }];
  for (const g of PLAN.gimnasios) {
    specs.push({ mapId: g.mapaId, title: g.titulo, parentId: CIRCUITO.mapaId, order: 921 + g.id });
  }
  installMapInfos(specs, BACKUP);
  installMetadata(specs.map((s) => ({ mapId: s.mapId, parentId: s.parentId })), BACKUP);
}

/* ─────────────────────────── datos del juego ────────────────────────────── */

function instalarDatos() {
  const tipos = [
    { id: "ATLAS_GYM_TRAINER", base: "GENTLEMAN", nombre: "Gimnasio de Atlas" },
    { id: "ATLAS_RIVAL", base: "RIVAL1", nombre: "Rival de Atlas" },
    { id: "ATLAS_SQUAD", base: "GENTLEMAN", nombre: "Cuadrilla de Atlas" },
  ];
  for (const g of PLAN.gimnasios) {
    tipos.push({ id: `ATLAS_LEADER_${g.id}`, base: "LEADER_Brock", nombre: `Líder ${g.nombre}` });
  }
  const entrenadores = [];
  for (const g of PLAN.gimnasios) {
    for (const t of g.entrenadores) {
      entrenadores.push({ tipo: "ATLAS_GYM_TRAINER", nombre: t.nombre, equipo: t.equipo, nivel: 100, derrota: `El gimnasio ${g.nombre} te cede el paso.` });
    }
    entrenadores.push({
      tipo: `ATLAS_LEADER_${g.id}`, nombre: g.lider.nombre, equipo: g.lider.equipo,
      nivel: 100, derrota: g.lider.derrota,
    });
  }
  for (const r of PLAN.rivales) {
    entrenadores.push({ tipo: "ATLAS_RIVAL", nombre: r.nombre, equipo: r.equipo, nivel: r.nivel, derrota: r.derrota });
  }
  for (const c of PLAN.cuadrillas) {
    entrenadores.push({ tipo: "ATLAS_SQUAD", nombre: c.nombre, equipo: c.equipo, nivel: 100, derrota: c.frase });
  }
  const medallas = PLAN.gimnasios.map((g) => ({
    id: g.medalla, base: "BOULDERBADGE", nombre: g.nombreMedalla, plural: `${g.nombreMedalla}s`, pocket: 8,
  }));
  return {
    tipos: installTrainerTypes(tipos, BACKUP),
    entrenadores: installTrainers(entrenadores, BACKUP),
    medallas: installItems(medallas, BACKUP),
  };
}

/* ───────────────────────────────── eventos ──────────────────────────────── */

function portalEvent(cell) {
  return event(0, "PokeMod Portal: Atlas", cell[0], cell[1], [
    page({
      gfx: graphic(PLAN.portal.sprite, 2, 1, {}),
      stepAnime: true,
      list: plano([...texts(PLAN.portal.cerrado), endEvent()]),
    }),
    page({
      cond: condition({ sw: DUELO }),
      gfx: graphic(PLAN.portal.sprite, 2, 1, {}),
      stepAnime: true,
      list: plano([
        ...texts(PLAN.portal.abierto),
        elegir("Cruzar", "Quedarse",
          (i) => viaje(CIRCUITO.mapaId, LLEGADA[0], LLEGADA[1], i),
          (i) => texts(["Te quedas. El portal no se cierra."], i)),
        endEvent(),
      ]),
    }),
  ]);
}

function regresoEvent(cell) {
  return event(0, `${MARKER} Portal de vuelta`, cell[0], cell[1], [
    page({
      gfx: graphic(PLAN.portal.sprite, 2, 1, {}),
      stepAnime: true,
      list: plano([
        ...texts(CIRCUITO.regreso.lineas),
        elegir("Volver", "Quedarse",
          (i) => viaje(PLAN.portal.mapa, PLAN.portal.pista[0], PLAN.portal.pista[1], i),
          (i) => texts(["Sigues en Atlas. Tómate tu tiempo."], i)),
        endEvent(),
      ]),
    }),
  ]);
}

function puertaEvent(gimnasio, cell) {
  const anterior = gimnasio.id > 1 ? medalla(gimnasio.id - 1) : null;
  const entra = [
    ...texts([`${gimnasio.titulo}. El ${gimnasio.lider.mostrado} te espera.`]),
    elegir("Entrar", "Seguir",
      (i) => viaje(gimnasio.mapaId, 2, 2, i),
      (i) => texts(["Vuelve cuando quieras."], i)),
    endEvent(),
  ];
  const paginas = [];
  if (anterior === null) {
    paginas.push(page({
      gfx: graphic("", 2, 1, {}),
      list: plano(entra),
    }));
  } else {
    paginas.push(page({
      gfx: graphic("", 2, 1, {}),
      list: plano([...texts([
        `${gimnasio.titulo}.`,
        `La puerta está cerrada: se abre con la ${PLAN.gimnasios[gimnasio.id - 2].nombreMedalla}.`,
      ]), endEvent()]),
    }));
    paginas.push(page({
      cond: condition({ sw: anterior }),
      gfx: graphic("", 2, 1, {}),
      list: plano(entra),
    }));
  }
  return event(0, `${MARKER} Puerta ${gimnasio.id} — ${gimnasio.nombre}`, cell[0], cell[1], paginas);
}

function npcEvent(nombre, sprite, lineas, cell) {
  return event(0, `${MARKER} ${nombre}`, cell[0], cell[1], [
    page({
      gfx: graphic(sprite, 2, 1, {}),
      list: plano([...texts(lineas), endEvent()]),
    }),
  ]);
}

function peleaEvent(nombre, sprite, tipo, rival, lineas, variable, cell) {
  return event(0, `${MARKER} ${nombre}`, cell[0], cell[1], [
    page({
      gfx: graphic(sprite, 2, 1, {}),
      list: plano([
        ...texts(lineas),
        script(`pbTrainerIntro(:${tipo})`),
        script(`$game_variables[${variable}] = pbTrainerBattle(:${tipo},"${rival}",nil,false,0,true) ? 1 : 0`),
        script("pbTrainerEnd"),
        endEvent(),
      ]),
    }),
  ]);
}

function eventosCircuito() {
  // regreso, maestro y tablón = 3
  const total = 3 + TOTAL + PLAN.rivales.length + PLAN.cuadrillas.length;
  const celdas = spread(celdasLibres(CIRCUITO.mapaId), total);
  let i = 0;
  const siguiente = () => celdas[i++];
  const eventos = [];

  eventos.push(regresoEvent(siguiente()));
  eventos.push(npcEvent("Maestro de Circuito", CIRCUITO.maestro.sprite, CIRCUITO.maestro.lineas, siguiente()));
  eventos.push(npcEvent("Tablón del Circuito", CIRCUITO.tablon.sprite, CIRCUITO.tablon.lineas, siguiente()));

  for (const gimnasio of PLAN.gimnasios) eventos.push(puertaEvent(gimnasio, siguiente()));

  let variable = 320;
  PLAN.rivales.forEach((rival, index) => {
    eventos.push(peleaEvent(
      `Rival — ${rival.mostrado}`, rival.sprite, "ATLAS_RIVAL", rival.nombre,
      [...rival.intro], 320 + index, siguiente(),
    ));
  });
  for (const cuadrilla of PLAN.cuadrillas) {
    eventos.push(peleaEvent(
      `Cuadrilla — ${cuadrilla.nombre}`, cuadrilla.sprite, "ATLAS_SQUAD", cuadrilla.nombre,
      [cuadrilla.frase], 330 + PLAN.cuadrillas.indexOf(cuadrilla), siguiente(),
    ));
  }
  return eventos;
}

function eventosGimnasio(gimnasio) {
  const celdas = spread(celdasLibres(gimnasio.mapaId), 2 + gimnasio.entrenadores.length);
  let i = 0;
  const siguiente = () => celdas[i++];
  const eventos = [];
  const propio = medalla(gimnasio.id);

  eventos.push(event(0, `${MARKER} Salida — ${gimnasio.nombre}`, celdas[0][0], celdas[0][1], [
    page({
      gfx: graphic("", 2, 1, {}),
      list: plano([...texts(["Sales a la Avenida."]), viaje(CIRCUITO.mapaId, LLEGADA[0], LLEGADA[1], 0), endEvent()]),
    }),
  ]));
  i = 1;

  eventos.push(event(0, `${MARKER} Líder — ${gimnasio.lider.mostrado}`, celdas[1][0], celdas[1][1], [
    page({
      gfx: graphic(gimnasio.lider.sprite, 2, 1, {}),
      list: plano([
        ...texts(gimnasio.intro),
        script(`pbTrainerIntro(:ATLAS_LEADER_${gimnasio.id})`),
        ifScript(`pbTrainerBattle(:ATLAS_LEADER_${gimnasio.id},"${gimnasio.lider.nombre}",nil,false,0,true)`),
        ...texts([gimnasio.victoria], 1),
        script(`pbReceiveItem(:${gimnasio.medalla})`, 1),
        switchOn(propio, 1),
        varAdd(MEDALLAS, 1, 1),
        selfSwitch("A", 0, 1),
        elseBranch(),
        ...texts([gimnasio.derrota], 1),
        endBranch(),
        script("pbTrainerEnd"),
        endEvent(),
      ]),
    }),
    page({
      cond: condition({ self: "A" }),
      gfx: graphic(gimnasio.lider.sprite, 2, 1, {}),
      list: plano([...texts(["La medalla ya es tuya. El gimnasio sigue abierto para entrenar."]), endEvent()]),
    }),
  ]));
  i = 2;

  for (const t of gimnasio.entrenadores) {
    const celda = celdas[i++];
    eventos.push(peleaEvent(
      `Entrenador — ${t.nombre}`, t.sprite, "ATLAS_GYM_TRAINER", t.nombre,
      [`El gimnasio ${gimnasio.nombre} te corta el paso.`], 340 + gimnasio.id, celda,
    ));
  }
  return eventos;
}

/* ──────────────────────────── instalación ───────────────────────────────── */

function instalar() {
  const mapas = construirMapas();
  instalarMapInfosYMetadatos();
  const datos = instalarDatos();
  const libres = spread(celdasLibres(PLAN.portal.mapa), 1);
  upsert(PLAN.portal.mapa, ["PokeMod Portal:"], () => [portalEvent(libres[0])], BACKUP);
  upsert(CIRCUITO.mapaId, [MARKER], () => eventosCircuito(), BACKUP);
  for (const gimnasio of PLAN.gimnasios) {
    upsert(gimnasio.mapaId, [MARKER], () => eventosGimnasio(gimnasio), BACKUP);
  }
  return { mapas, datos, portal: libres[0] };
}

/* ──────────────────────────── verificación ──────────────────────────────── */

function verify() {
  const check = makeChecker("Circuito de gimnasios de Atlas");

  verificarMapa(check, CIRCUITO.mapaId, CIRCUITO.titulo, [LLEGADA], 0.25);

  // — portal cerrado hasta el duelo, con vuelta libre
  const portal = eventsOf(PLAN.portal.mapa).find((e) => e.name === "PokeMod Portal: Atlas");
  check.ok(!!portal, "falta el Portal de Atlas");
  if (portal) {
    const paginas = pagesOf(portal);
    check.ok(paginas.length === 2, "el portal debe tener dos páginas");
    check.ok(!!paginas[1].condition?.getIvar("@switch1_valid")
      && Number(paginas[1].condition.getIvar("@switch1_id")) === DUELO,
      "el portal no exige el duelo de Arceus");
    check.ok(paginas[1].list.some((c) => c.code === 201 && Number(c.params[1]) === CIRCUITO.mapaId),
      "el portal no lleva a la Avenida");
  }

  // — vuelta sin condiciones
  const regreso = eventsOf(CIRCUITO.mapaId).find((e) => e.name === `${MARKER} Portal de vuelta`);
  check.ok(!!regreso, "falta el portal de vuelta");
  if (regreso) {
    const primera = pagesOf(regreso)[0];
    check.ok(!primera.condition?.getIvar("@switch1_valid"), "la vuelta no puede estar condicionada");
    check.ok(primera.list.some((c) => c.code === 201 && Number(c.params[1]) === PLAN.portal.mapa),
      "la vuelta no regresa a Puerto Horizonte");
  }

  // — ocho gimnasios con medalla encadenada
  for (const g of PLAN.gimnasios) {
    verificarMapa(check, g.mapaId, g.titulo, [[2, 2]], 0.25);
    const puerta = eventsOf(CIRCUITO.mapaId).find((e) => e.name === `${MARKER} Puerta ${g.id} — ${g.nombre}`);
    check.ok(!!puerta, `falta la puerta del gimnasio ${g.id}`);
    if (puerta) {
      const paginas = pagesOf(puerta);
      if (g.id === 1) {
        check.ok(paginas.length === 1 && !paginas[0].condition?.getIvar("@switch1_valid"),
          "la primera puerta debe estar siempre abierta");
      } else {
        check.ok(paginas.length === 2, `la puerta ${g.id} debe tener página cerrada y abierta`);
        check.ok(!!paginas[1].condition?.getIvar("@switch1_valid")
          && Number(paginas[1].condition.getIvar("@switch1_id")) === medalla(g.id - 1),
          `la puerta ${g.id} no se abre con la medalla ${g.id - 1}`);
      }
      check.ok(paginas.at(-1).list.some((c) => c.code === 201 && Number(c.params[1]) === g.mapaId),
        `la puerta ${g.id} no lleva a su gimnasio`);
    }

    const lider = eventsOf(g.mapaId).find((e) => e.name === `${MARKER} Líder — ${g.lider.mostrado}`);
    check.ok(!!lider, `falta el líder del gimnasio ${g.id}`);
    if (lider) {
      const primera = pagesOf(lider)[0];
      check.ok(primera.list.some((c) => (c.code === 111 || c.code === 355)
        && [c.params[0], c.params[1]].some((p) => String(p ?? "").includes(`pbTrainerBattle(:ATLAS_LEADER_${g.id}`))),
        `el líder ${g.id} no pelea con su tipo`);
      check.ok(primera.list.some((c) => c.code === 121 && Number(c.params[0]) === medalla(g.id)),
        `el líder ${g.id} no enciende su medalla`);
      check.ok(primera.list.some((c) => c.code === 122 && Number(c.params[1]) === MEDALLAS),
        `el líder ${g.id} no cuenta la medalla`);
    }

    const entrenadores = eventsOf(g.mapaId).filter((e) => e.name.startsWith(`${MARKER} Entrenador —`));
    check.ok(entrenadores.length === g.entrenadores.length,
      `gimnasio ${g.id}: se esperaban ${g.entrenadores.length} entrenadores y hay ${entrenadores.length}`);
  }

  // — rivales y cuadrillas
  for (const r of PLAN.rivales) {
    check.ok(eventsOf(CIRCUITO.mapaId).some((e) => e.name === `${MARKER} Rival — ${r.mostrado}`),
      `falta el rival ${r.mostrado}`);
  }
  for (const c of PLAN.cuadrillas) {
    check.ok(eventsOf(CIRCUITO.mapaId).some((e) => e.name === `${MARKER} Cuadrilla — ${c.nombre}`),
      `falta la cuadrilla ${c.nombre}`);
  }

  // — los ocho líderes son distintos entre sí
  const nombres = new Set(PLAN.gimnasios.map((g) => g.lider.nombre));
  const medallasIds = new Set(PLAN.gimnasios.map((g) => g.medalla));
  check.ok(nombres.size === TOTAL, "hay líderes repetidos en el circuito");
  check.ok(medallasIds.size === TOTAL, "hay medallas repetidas en el circuito");
  const donantes = new Set(PLAN.gimnasios.map((g) => g.donante));
  check.ok(donantes.size === TOTAL, "hay gimnasios construidos sobre el mismo donante");

  check.done();
}

/* ──────────────────────────────── main ──────────────────────────────────── */

if (VERIFY_ONLY) {
  verify();
} else {
  const resultado = instalar();
  console.log("✔ Circuito de gimnasios de Atlas instalado");
  console.log(`  · Map${CIRCUITO.mapaId} «${CIRCUITO.titulo}» ${resultado.mapas.ancho}×${resultado.mapas.alto} · ${resultado.mapas.ventanas.length} plazas · ${resultado.mapas.pasillos} pasillos`);
  for (const g of PLAN.gimnasios) {
    const requisito = g.id === 1 ? "abierto" : `medalla ${g.id - 1}`;
    console.log(`  · Map${g.mapaId} ${g.titulo} · líder ${g.lider.mostrado} · ${g.medalla} (${requisito})`);
  }
  console.log(`  · rivales: ${PLAN.rivales.map((r) => r.mostrado).join(", ")}`);
  console.log(`  · cuadrillas: ${PLAN.cuadrillas.length}`);
  const nuevos = (lista) => lista.filter((x) => x.added).length;
  console.log(`  · tipos: ${nuevos(resultado.datos.tipos)}/${resultado.datos.tipos.length} · entrenadores: ${nuevos(resultado.datos.entrenadores)}/${resultado.datos.entrenadores.length} · medallas: ${nuevos(resultado.datos.medallas)}/${resultado.datos.medallas.length}`);
  verify();
}
