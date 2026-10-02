#!/usr/bin/env node
/**
 * dn_name_flags.mjs — pone nombre a las switches y variables del Dimensional Nightmare en
 * `System.rxdata`.
 *
 * Sin nombre, las flags del ciclo (882–921 y 264–289) aparecen como «—» en el editor de RMXP y en
 * la lista de eventos, y es fácil pisar una ajena. Esta herramienta:
 *   1. extiende las listas hasta el último índice que usa el ciclo;
 *   2. escribe el nombre de cada flag DN (sólo si el hueco está vacío o ya es DN);
 *   3. **rechaza** tocar cualquier nombre de Atlas o de La Ruta de Dios, y avisa si detecta
 *      colisiones entre dos herramientas del propio ciclo.
 *
 * Uso:
 *   node tools/dn_name_flags.mjs            # nombra (idempotente)
 *   node tools/dn_name_flags.mjs --verify
 */
import { S, txt, readData, writeData, backup } from "./lib/dn_rmxp.mjs";

const VERIFY = process.argv.includes("--verify");
const FOREIGN = /ATLAS|RUTA_DE_DIOS|ARCEUS_CINEMATIC|SNOWPOINT/i;

/** Switches del ciclo: estados de progreso, sellos, grietas, cuotas, jefes, medallas y Liga. */
export const SWITCHES = {
  882: "DN_UNLOCKED",
  883: "DN_SELLO_EP01_WHITE_HAND",
  884: "DN_SELLO_EP02_LOST_SILVER",
  885: "DN_SELLO_EP03_SNOW_MT_SILVER",
  886: "DN_SELLO_EP04_HYPNOS_LULLABY",
  887: "DN_SELLO_EP05_POKEMON_BLACK",
  888: "DN_SELLO_EP06_KING_UNOWN",
  889: "DN_NEXO_CLEARED",
  890: "DN_GRIETA_EP01",
  891: "DN_GRIETA_EP02",
  892: "DN_GRIETA_EP03",
  893: "DN_GRIETA_EP04",
  894: "DN_GRIETA_EP05",
  895: "DN_GRIETA_EP06",
  896: "DN_CUOTA_EP01",
  897: "DN_CUOTA_EP02",
  898: "DN_CUOTA_EP03",
  899: "DN_CUOTA_EP04",
  900: "DN_CUOTA_EP05",
  901: "DN_CUOTA_EP06",
  902: "DN_ROTOM_OBTAINED",
  903: "DN_JEFE_EP01_FASE_A",
  904: "DN_JEFE_EP02_FASE_A",
  905: "DN_JEFE_EP03_FASE_A",
  906: "DN_JEFE_EP04_FASE_A",
  907: "DN_JEFE_EP05_FASE_A",
  908: "DN_JEFE_EP06_FASE_A",
  909: "DN_JEFE_NEXO_FASE_A",
  910: "DN_BOSS_EP01_PASO_1",
  911: "DN_BOSS_EP02_PASO_1",
  912: "DN_BOSS_EP03_PASO_1",
  913: "DN_BOSS_EP04_PASO_1",
  914: "DN_BOSS_EP05_PASO_1",
  915: "DN_BOSS_EP06_PASO_1",
  916: "DN_BOSS_RESERVA",
  917: "DN_MEDALS_READY",
  918: "DN_LIGA_STARTED",
  919: "DN_LIGA_ARCEUS",
  920: "DN_LIGA_CLEARED",
  921: "DN_MADPIKA_SAVED",
  922: "DN_SELLO_W7_STRANGLED_RED",
  923: "DN_SELLO_W8_BURIED_ALIVE",
  924: "DN_SELLO_W9_LAVENDER_SYNDROME",
  925: "DN_GRIETA_W7",
  926: "DN_GRIETA_W8",
  927: "DN_GRIETA_W9",
  928: "DN_JEFE_W7_FASE_A",
  929: "DN_JEFE_W8_FASE_A",
  930: "DN_JEFE_W9_FASE_A",
  931: "DN_TESTIGO_LISTO",
};

/** Variables del ciclo: resonancia, fase, episodio, anomalías, Rotom, final y la Liga. */
export const VARIABLES = {
  264: "DN_PROGRESO_EPISODIOS",
  265: "DN_RESONANCIA",
  266: "DN_FASE_CORRUPCION",
  267: "DN_EPISODIO_ACTUAL",
  268: "DN_ANOMALIAS_EP01",
  269: "DN_ANOMALIAS_EP02",
  270: "DN_ANOMALIAS_EP03",
  271: "DN_ANOMALIAS_EP04",
  272: "DN_ANOMALIAS_EP05",
  273: "DN_ANOMALIAS_EP06",
  274: "DN_ANOMALIAS_TOTAL",
  275: "DN_ROTOM_NIVEL",
  276: "DN_FINAL_CHOICE",
  277: "DN_SELLOS_Y_CONTADOR",
  278: "DN_LIGA_RAMA_MADPIKA",
  279: "DN_LIGA_CHISPAS",
  280: "DN_MEDALLAS_CONTADAS",
  281: "DN_LIGA_ETAPA",
  282: "DN_LIGA_COMBATE_RESULTADO",
  283: "DN_ANOMALIAS_W7",
  284: "DN_ANOMALIAS_W8",
  285: "DN_ANOMALIAS_W9",
  286: "DN_W8_AIRE",
  287: "DN_W9_CANTO",
  288: "DN_W7_CORREAS",
};

function apply(table, map, label) {
  let named = 0, skipped = 0;
  const highest = Math.max(...Object.keys(map).map(Number));
  while (table.length <= highest) table.push(null);
  for (const [id, name] of Object.entries(map)) {
    const current = txt(table[Number(id)]);
    if (current && FOREIGN.test(current)) { console.error(`  FALLA: ${label} ${id} pertenece a «${current}»`); continue; }
    if (current === name) { skipped++; continue; }
    if (current && !/^DN_/.test(current)) console.log(`  aviso: ${label} ${id} renombrada «${current}» → «${name}»`);
    table[Number(id)] = S(name);
    named++;
  }
  return { named, skipped };
}

function verify() {
  const sys = readData("System.rxdata");
  const sw = sys.getIvar("@switches"), va = sys.getIvar("@variables");
  const failures = [];
  for (const [id, name] of Object.entries(SWITCHES)) {
    if (txt(sw[Number(id)]) !== name) failures.push(`switch ${id}: «${txt(sw[Number(id)])}» ≠ «${name}»`);
  }
  for (const [id, name] of Object.entries(VARIABLES)) {
    if (txt(va[Number(id)]) !== name) failures.push(`variable ${id}: «${txt(va[Number(id)])}» ≠ «${name}»`);
  }
  const duplicated = new Map();
  for (let i = 0; i < sw.length; i++) {
    const name = txt(sw[i]);
    if (!name || !/^DN_/.test(name)) continue;
    if (duplicated.has(name)) failures.push(`switch duplicado «${name}» en ${duplicated.get(name)} y ${i}`);
    duplicated.set(name, i);
  }
  console.log(`verificación de flags DN (${Object.keys(SWITCHES).length} switches, ${Object.keys(VARIABLES).length} variables)`);
  if (failures.length) { for (const f of failures) console.error(`  FALLA: ${f}`); process.exit(1); }
  console.log("verificación de flags DN OK");
}

if (VERIFY) {
  verify();
} else {
  backup("System.rxdata");
  const sys = readData("System.rxdata");
  const sw = apply(sys.getIvar("@switches"), SWITCHES, "switch");
  const va = apply(sys.getIvar("@variables"), VARIABLES, "variable");
  writeData("System.rxdata", sys);
  console.log(`flags DN: ${sw.named} switches y ${va.named} variables nombradas (ya correctas: ${sw.skipped}/${va.skipped})`);
}
