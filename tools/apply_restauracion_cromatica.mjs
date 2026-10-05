#!/usr/bin/env node
/**
 * apply_restauracion_cromatica.mjs
 *
 * «Los mundos de creepypasta son fieles a sus creepypastas, pero Ash es el
 * agente externo que busca salvar las dimensiones y restaurarlas a un momento
 * de paz restaurando su color.»
 *
 * Lo que hace esta herramienta:
 *
 *   1. **Migración de sellos.** Los sellos de las siete emisiones vivían en
 *      868–875 y eso chocaba con el canon de Arceus: 873 es «duelo resuelto» y
 *      874 es «Arceus capturado», así que purgar la sexta o la séptima emisión
 *      abría en falso todas las puertas del canon. Se trasladan a 940–947,
 *      bloque comprobadamente libre (el juego no pasa de 939).
 *   2. **Ceniza.** Cada emisión se muestra en gris mientras no está restaurada.
 *      Un proceso paralelo que se autoborra fija el tono al entrar en el mapa:
 *      gris si el mundo sigue roto, color si ya volvió a su tarde. También
 *      corrige el caso de guardar y recargar dentro de un mundo gris.
 *   3. **Nexo de Color.** Derrotar al jefe *purga* la emisión; no la salva.
 *      Después hay que volver y tocar el nexo: Ash habla como lo que es —alguien
 *      que viene de fuera de estas dimensiones— y le devuelve su momento de paz.
 *   4. **Pobladores.** Dos vecinos por emisión que repiten su trauma en gris y
 *      hablan distinto cuando el color vuelve. Cada mundo es fiel a su
 *      creepypasta: la torre, la partida sin guardar, la fosa, la cinta, la
 *      ciudad fallida, el eco y el cartucho de 1996.
 *   5. **Salida limpia.** Las dos salidas de cada emisión devuelven la pantalla
 *      al color antes de transferir, para que el gris no se escape al mundo.
 *   6. **Censo Cromático** en la falda del Monte Silver: lleva la cuenta de los
 *      mundos restaurados y cierra el arco cuando son los siete.
 *
 * No se toca contenido original: sólo se añaden eventos en mapas del DLC y se
 * reescriben los sellos que ya estaban declarados.
 *
 * Uso:
 *   node tools/apply_restauracion_cromatica.mjs
 *   node tools/apply_restauracion_cromatica.mjs --verify
 */
import fs from "node:fs";
import path from "node:path";
import {
  DATA, ROOT, cmdOf, condition, endBranch, endEvent, eraseEvent, event, eventsOf,
  freeCells, graphic, ifSwitch, ifVariable, iv, makeChecker, marshalDump, page,
  pagesOf, readMapRaw, selfSwitch, spread, switchOn, texts, tint, upsert, varAdd,
  wait, writeMapRaw, txt,
} from "./lib/dlc_helpers.mjs";

const VERIFY_ONLY = process.argv.includes("--verify");
const PLAN = JSON.parse(fs.readFileSync(path.join(ROOT, "content", "restauracion_cromatica.json"), "utf8"));
const SELLO_BASE = PLAN.interruptores.SELLO_BASE;      // 940
const COLOR_BASE = PLAN.interruptores.COLOR_BASE;      // 950
const PAZ_TOTAL = PLAN.interruptores.PAZ_TOTAL;        // 957
const RESTAURADOS = PLAN.variables.MUNDOS_RESTAURADOS; // 310
const MARKER = "PokeMod Restauración:";
const BOSS_MARKER = "PokeMod Multiverso: Jefe";
const BACKUP_DIR = "restauracion_cromatica";

/** El bloque viejo chocaba con el canon de Arceus (873 = duelo, 874 = captura). */
const SELLOS_VIEJOS = [868, 869, 870, 871, 872, 873, 874, 875];
const SELLOS_NUEVOS = [940, 941, 942, 943, 944, 945, 946, 947];

const GRIS = [-30, -30, -30, 255];
const NORMAL = [0, 0, 0, 0];
const TOTAL_MUNDOS = PLAN.mundos.length;

function backupFile(file) {
  const dir = path.join(DATA, "..", "PokeModBackups", BACKUP_DIR);
  fs.mkdirSync(dir, { recursive: true });
  const source = path.join(DATA, file);
  if (fs.existsSync(source)) fs.copyFileSync(source, path.join(dir, file));
}

/* ─────────────────────── 1. migración de los sellos ─────────────────────── */

function migrateSeals() {
  const moved = [];
  const files = fs.readdirSync(DATA).filter((f) => /^Map\d+\.rxdata$/.test(f));
  for (const file of files) {
    const mapId = Number(file.match(/\d+/)[0]);
    const map = readMapRaw(mapId);
    const pairs = iv(map, "@events")?.pairs ?? [];
    let touched = false;
    for (const [, object] of pairs) {
      if (!txt(iv(object, "@name")).startsWith(BOSS_MARKER)) continue;
      for (const pageObj of iv(object, "@pages") ?? []) {
        for (const raw of pageObj.getIvar("@list") ?? []) {
          const c = cmdOf(raw);
          if (c.code !== 121) continue;
          const index = SELLOS_VIEJOS.indexOf(Number(c.params[0]));
          if (index < 0) continue;
          const nuevo = SELLOS_NUEVOS[index];
          raw.setIvar("@parameters", [nuevo, nuevo, c.params[2]]);
          touched = true;
        }
      }
      if (touched) moved.push(mapId);
    }
    if (touched) { backupFile(file); writeMapRaw(mapId, map); }
  }
  return moved;
}

/* ─────────────────── 2. salida limpia (que el gris no escape) ───────────── */

/**
 *Inserta un teñido a color normal justo antes de cada transferencia.
 * Idempotente: si ya hay un teñido delante, no hace nada.
 */
function ensureTintBeforeTransfer(mapId, names) {
  let changed = 0;
  if (!fs.existsSync(path.join(DATA, `Map${String(mapId).padStart(3, "0")}.rxdata`))) return changed;
  backupFile(`Map${String(mapId).padStart(3, "0")}.rxdata`);
  const map = readMapRaw(mapId);
  const pairs = iv(map, "@events")?.pairs ?? [];
  for (const [, object] of pairs) {
    const name = txt(iv(object, "@name"));
    if (!names.some((n) => name.startsWith(n))) continue;
    for (const pageObj of iv(object, "@pages") ?? []) {
      const list = pageObj.getIvar("@list") ?? [];
      // Se recorre al revés para no descolocar los índices al insertar.
      for (let i = list.length - 1; i >= 0; i--) {
        if (cmdOf(list[i]).code !== 201) continue;
        const prev = i > 0 ? cmdOf(list[i - 1]) : null;
        if (prev && prev.code === 223) continue;
        list.splice(i, 0, tint(...NORMAL, 6, 0), wait(8, 0));
        changed += 1;
      }
      pageObj.setIvar("@list", list);
    }
  }
  if (changed) writeMapRaw(mapId, map);
  return changed;
}

/* ─────────────────────────── 3. la ceniza ───────────────────────────────── */

/**
 * Proceso paralelo que se autoborra: fija el tono de la emisión una sola vez
 * por visita. Gris si el mundo sigue roto; color si ya se restauró. Así el
 * gris no depende de por qué puerta se entró ni de que se guarde y se cargue.
 */
function cenizaEvent(id, colorSwitch) {
  return event(id, `${MARKER} Ceniza`, 0, 0, [
    page({
      trigger: 4,
      gfx: graphic("", 2, 1, {}),
      list: [
        wait(12),
        ifSwitch(colorSwitch, false),
        tint(...GRIS, 30, 1),
        endBranch(),
        ifSwitch(colorSwitch, true),
        tint(...NORMAL, 30, 1),
        endBranch(),
        eraseEvent(),
        endEvent(),
      ],
    }),
  ]);
}

/* ─────────────────────────── 4. el nexo ─────────────────────────────────── */

function nexoEvent(id, mundo, cell) {
  const sello = SELLO_BASE + mundo.zona;
  const color = COLOR_BASE + mundo.zona;
  const restaurar = [
    ...texts(mundo.nexo.antes),
    ...texts(mundo.nexo.ash),
    wait(12),
    tint(...NORMAL, 60),
    wait(66),
    ...texts(mundo.nexo.despues),
    ...texts([mundo.nexo.paz]),
    switchOn(color),
    varAdd(RESTAURADOS, 1),
    ifVariable(RESTAURADOS, TOTAL_MUNDOS, 1),
    switchOn(PAZ_TOTAL, 1),
    ...texts(PLAN.pazTotal.lineas, 1),
    endBranch(1),
    endEvent(),
  ];
  return event(id, `${MARKER} Nexo — ${mundo.titulo}`, cell[0], cell[1], [
    // Sin purgar: el mundo sigue en pie y el color no se puede desatar.
    page({
      gfx: graphic("Object ball special", 2, 1, {}),
      list: [
        ...texts([
          `El color se escapó de este sitio. Alguien lo sigue sosteniendo: ${mundo.nexo.objeto}.`,
          "Mientras la emisión siga en pie, el gris no se puede desatar.",
        ]),
        endEvent(),
      ],
    }),
    // Purgado pero no salvado: Ash, que viene de fuera, devuelve el color.
    page({
      cond: condition({ sw: sello, sw2: color }),
      gfx: graphic("Object ball special", 2, 1, {}),
      list: restaurar,
    }),
    // Restaurado: el color se sostiene solo.
    page({
      cond: condition({ sw: color }),
      gfx: graphic("Object ball special", 2, 1, {}),
      list: [
        ...texts([
          `${mundo.nexo.objeto.charAt(0).toUpperCase()}${mundo.nexo.objeto.slice(1)} ya no pesa.`,
          "El color se sostiene solo. Este mundo ha vuelto a su tarde.",
        ]),
        endEvent(),
      ],
    }),
  ]);
}

/* ───────────────────────── 5. los pobladores ────────────────────────────── */

function pobladorEvent(id, mundo, pob, cell) {
  const color = COLOR_BASE + mundo.zona;
  return event(id, `${MARKER} ${pob.nombre}`, cell[0], cell[1], [
    page({
      gfx: graphic(pob.sprite, 2, 1, {}),
      list: [...texts([pob.gris]), endEvent()],
    }),
    page({
      cond: condition({ sw: color }),
      gfx: graphic(pob.sprite, 2, 1, {}),
      list: [...texts([pob.color]), endEvent()],
    }),
  ]);
}

/* ──────────────────────── 6. censo y registro ───────────────────────────── */

function censoEvent(id, cell) {
  return event(id, `${MARKER} Censo Cromático`, cell[0], cell[1], [
    page({
      gfx: graphic("trchar028", 2, 1, {}),
      list: [
        ...texts([
          `Censo Cromático: \\v[${RESTAURADOS}] de ${TOTAL_MUNDOS} emisiones han recuperado su color.`,
          "Purgarlas las cierra. Restaurarlas las salva. Son dos cosas distintas y sólo una deja el sitio habitable.",
          "Vuelve a cada emisión y toca su nexo. Yo me quedo a contarlas.",
        ]),
        endEvent(),
      ],
    }),
    page({
      cond: condition({ sw: PAZ_TOTAL }),
      gfx: graphic("trchar028", 2, 1, {}),
      list: [
        ...texts([
          `Las ${TOTAL_MUNDOS} emisiones están en paz. Ni una sola repite su trauma.`,
          "Cuando el Archivero escribió estas historias creyó que no tenían final.",
          "Se equivocaba: los finales los traéis vosotros de fuera.",
        ]),
        endEvent(),
      ],
    }),
  ]);
}

function registroEvent(id, cell) {
  return event(id, `${MARKER} Registro del Agente`, cell[0], cell[1], [
    page({
      gfx: graphic(PLAN.registroAgente.sprite, 2, 1, {}),
      list: [...texts(PLAN.registroAgente.lineas), endEvent()],
    }),
  ]);
}

/* ──────────────────────────── instalación ───────────────────────────────── */

function installWorld(mundo) {
  const color = COLOR_BASE + mundo.zona;
  const solids = spread(freeCells(mundo.mapId), 3);
  return upsert(mundo.mapId, [MARKER], (nextId) => [
    cenizaEvent(nextId, color),
    nexoEvent(nextId + 1, mundo, solids[0]),
    pobladorEvent(nextId + 2, mundo, mundo.pobladores[0], solids[1]),
    pobladorEvent(nextId + 3, mundo, mundo.pobladores[1], solids[2]),
  ], BACKUP_DIR);
}

function installCenso() {
  const mapId = PLAN.censo.mapa;
  return upsert(mapId, [`${MARKER} Censo`, `${MARKER} Registro`], (nextId) => {
    const cells = spread(freeCells(mapId), 2);
    return [censoEvent(nextId, cells[0]), registroEvent(nextId + 1, cells[1])];
  }, BACKUP_DIR);
}

function install() {
  const moved = migrateSeals();
  const placed = [];
  let salidas = 0;
  for (const mundo of PLAN.mundos) {
    const added = installWorld(mundo);
    salidas += ensureTintBeforeTransfer(mundo.mapId, [
      "PokeMod Multiverso: Volver a la gruta",
      "PokeMod Grieta: Volver al mundo",
    ]);
    placed.push({ mapId: mundo.mapId, titulo: mundo.titulo, eventos: added.length });
  }
  const censo = installCenso();
  return { moved, placed, censo, salidas };
}

/* ──────────────────────────── verificación ──────────────────────────────── */

function verify() {
  const check = makeChecker("Restauración cromática");
  let sellosMigrados = 0;

  for (const mundo of PLAN.mundos) {
    const sello = SELLO_BASE + mundo.zona;
    const color = COLOR_BASE + mundo.zona;

    // — el jefe escribe el sello nuevo y ninguno del bloque viejo
    const boss = eventsOf(mundo.mapId).find((e) => e.name.startsWith(BOSS_MARKER));
    check.ok(!!boss, `${mundo.mapId}: falta el evento del jefe`);
    if (boss) {
      let escribeSello = false, usaViejo = false;
      for (const pg of pagesOf(boss)) for (const c of pg.list) {
        if (c.code !== 121) continue;
        if (Number(c.params[0]) === sello) escribeSello = true;
        if (SELLOS_VIEJOS.includes(Number(c.params[0]))) usaViejo = true;
      }
      check.ok(escribeSello, `${mundo.mapId}: el jefe no enciende el sello ${sello}`);
      check.ok(!usaViejo, `${mundo.mapId}: el jefe sigue usando un sello del bloque 868-875`);
      if (escribeSello) sellosMigrados += 1;
    }

    // — ceniza: un proceso paralelo que tiñe gris o color y se autoborra
    const ceniza = eventsOf(mundo.mapId).find((e) => e.name === `${MARKER} Ceniza`);
    check.ok(!!ceniza, `${mundo.mapId}: falta la ceniza`);
    if (ceniza) {
      const pages = pagesOf(ceniza);
      check.ok(pages.length === 1 && pages[0].trigger === 4,
        `${mundo.mapId}: la ceniza debe ser un único proceso paralelo`);
      const comandos = pages[0].list;
      const tonos = comandos.filter((c) => c.code === 223);
      check.ok(tonos.length === 2, `${mundo.mapId}: la ceniza debe tener los dos teñidos (gris y color)`);
      check.ok(comandos.some((c) => c.code === 126), `${mundo.mapId}: la ceniza debe autoborrarse tras teñir`);
      check.ok(comandos.some((c) => c.code === 111 && Number(c.params[1]) === color),
        `${mundo.mapId}: la ceniza no consulta el color ${color}`);
    }

    // — nexo: tres páginas; la central exige sello y se cierra con el color
    const nexo = eventsOf(mundo.mapId).find((e) => e.name === `${MARKER} Nexo — ${mundo.titulo}`);
    check.ok(!!nexo, `${mundo.mapId}: falta el nexo de color`);
    if (nexo) {
      const pages = pagesOf(nexo);
      check.ok(pages.length === 3, `${mundo.mapId}: el nexo debe tener tres páginas`);
      const media = pages[1];
      const sw1ok = !!media.condition?.getIvar("@switch1_valid");
      const sw2ok = !!media.condition?.getIvar("@switch2_valid");
      const sw1 = Number(media.condition?.getIvar("@switch1_id"));
      const sw2 = Number(media.condition?.getIvar("@switch2_id"));
      check.ok(sw1ok && sw1 === sello, `${mundo.mapId}: la restauración no exige el sello ${sello}`);
      check.ok(sw2ok && sw2 === color, `${mundo.mapId}: la restauración no se cierra con el color ${color}`);
      check.ok(media.list.some((c) => c.code === 121 && Number(c.params[0]) === color),
        `${mundo.mapId}: la restauración no enciende el color ${color}`);
      check.ok(media.list.some((c) => c.code === 122 && Number(c.params[1]) === RESTAURADOS),
        `${mundo.mapId}: la restauración no lleva la cuenta de mundos`);
      check.ok(media.list.some((c) => c.code === 223), `${mundo.mapId}: la restauración no tiñe la pantalla`);
    }

    // — pobladores
    const vecinos = eventsOf(mundo.mapId).filter((e) =>
      mundo.pobladores.some((p) => e.name === `${MARKER} ${p.nombre}`));
    check.ok(vecinos.length === 2, `${mundo.mapId}: se esperaban dos pobladores y hay ${vecinos.length}`);
    for (const pob of mundo.pobladores) {
      check.ok(pob.gris !== pob.color, `${mundo.mapId}: ${pob.nombre} repite el mismo texto en gris y en color`);
    }

    // — las salidas devuelven el color antes de transferir
    for (const e of eventsOf(mundo.mapId)) {
      if (!/Volver a la gruta|Volver al mundo/.test(e.name)) continue;
      let limpia = true;
      for (const p of pagesOf(e)) {
        const comandos = p.list;
        for (let i = 0; i < comandos.length; i++) {
          if (comandos[i].code !== 201) continue;
          const prev = i > 0 ? comandos[i - 1] : null;
          const prev2 = i > 1 ? comandos[i - 2] : null;
          if (!((prev && prev.code === 106) || (prev2 && prev2.code === 223))) limpia = false;
        }
      }
      check.ok(limpia, `${mundo.mapId}: la salida «${e.name}» no limpia el gris antes de transferir`);
    }
  }

  // — censo y registro en la falda
  const censo = eventsOf(PLAN.censo.mapa).filter((e) => e.name.startsWith(MARKER));
  check.ok(censo.length === 2, `la falda debe tener censo y registro (hay ${censo.length})`);

  // — invariante real: el bloque 868-875 seguía siendo el de los sellos de las
  //   emisiones, y 873/874 son «duelo de Arceus resuelto» y «Arceus capturado».
  //   Ningún jefe de emisión puede tocarlos ya; sólo el encuentro de Arceus
  //   puede escribir el 873, y nadie fuera de él puede escribir el 874.
  const files = fs.readdirSync(DATA).filter((f) => /^Map\d+\.rxdata$/.test(f));
  let choques = 0;
  for (const f of files) {
    const id = Number(f.match(/\d+/)[0]);
    for (const e of eventsOf(id)) {
      const esArceus = /Arceus/i.test(e.name);
      const esJefe = e.name.startsWith(BOSS_MARKER);
      for (const p of pagesOf(e)) for (const comando of p.list) {
        if (comando.code !== 121) continue;
        const desde = Number(comando.params[0]), hasta = Number(comando.params[1] ?? desde);
        for (let s = desde; s <= hasta; s++) {
          if (esJefe && SELLOS_VIEJOS.includes(s)) choques += 1;              // sello viejo
          if (!esArceus && (s === 873 || s === 874)) choques += 1;           // canon de Arceus
        }
      }
    }
  }
  check.ok(choques === 0, `quedan ${choques} escrituras que chocan con el canon de Arceus (bloque 868-875)`);
  check.ok(sellosMigrados === TOTAL_MUNDOS, `se migraron ${sellosMigrados} de ${TOTAL_MUNDOS} sellos`);

  check.done();
}

/* ──────────────────────────────── main ──────────────────────────────────── */

if (VERIFY_ONLY) {
  verify();
} else {
  const result = install();
  console.log(`✔ Restauración cromática instalada en ${TOTAL_MUNDOS} emisiones`);
  console.log(`  · sellos migrados al bloque ${SELLO_BASE}-${SELLO_BASE + 7}: ${result.moved.length} jefes`);
  for (const mundo of result.placed) {
    console.log(`  · mapa ${mundo.mapId} «${mundo.titulo}»: ${mundo.eventos} eventos (ceniza, nexo y dos pobladores)`);
  }
  console.log(`  · salidas con tono limpio: ${result.salidas}`);
  console.log(`  · censo cromático y registro del agente en el mapa ${PLAN.censo.mapa}`);
  verify();
}
