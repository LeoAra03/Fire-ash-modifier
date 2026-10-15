#!/usr/bin/env node
/**
 * artifact_budget_check.mjs
 *
 * Comprobación del presupuesto de tamaño del artefacto de sesión (Fase 14/2680,
 * tarea 34). Mide el ZIP raíz, el grupo de entregables versionados, los insumos
 * de terceros y el total del repositorio, y aplica las reglas de
 * `content/artifact_budget.json`.
 *
 * Uso:
 *   node tools/qa/artifact_budget_check.mjs             # comprueba (código 1 si falla)
 *   node tools/qa/artifact_budget_check.mjs --json      # salida legible por máquina
 *   node tools/qa/artifact_budget_check.mjs --selftest  # pruebas de las reglas, sin tocar el disco
 *
 * Una regla superada **con justificación escrita vigente** no falla: se informa
 * como JUSTIFICADO y se recuerda cuánto hay que recortar para volver al techo.
 */
import assert from "node:assert/strict";
import {
  LIMITE_SESION_BYTES,
  aMiB,
  evaluarPresupuesto,
  cargarPolitica,
  formatearMiB,
  mbABytes,
  medirArtefacto,
} from "../lib/artifact_budget.mjs";

const BANDERAS = {
  json: process.argv.includes("--json"),
  selftest: process.argv.includes("--selftest"),
};

const ETIQUETA = {
  ok: "OK",
  justificado: "JUSTIFICADO",
  excedido: "EXCEDIDO",
  justificacion_vencida: "JUSTIFICACIÓN VENCIDA",
  falta: "FALTA",
};

/** Mediciones sintéticas: comprueban las reglas sin depender del repositorio. */
function medicion(base, overrides = {}) {
  const entregables = overrides.entregables ?? [];
  const insumos = overrides.insumos ?? [];
  const sumar = (items) => items.reduce((total, item) => total + (item.bytes ?? 0), 0);
  return {
    archivosVersionados: overrides.archivosVersionados ?? 10,
    totalBytes: overrides.totalBytes ?? sumar([...entregables, ...insumos]),
    entregables: { archivos: entregables, bytes: sumar(entregables) },
    insumos: { archivos: insumos, bytes: sumar(insumos) },
    zipRaiz: overrides.zipRaiz ?? { ruta: base.zip_raiz.ruta, bytes: 0 },
  };
}

function politicaSintetica(extra = {}) {
  const base = {
    version: 1,
    limite_sesion_mb: 128,
    zip_raiz: { ruta: "ZIP-RAIZ.zip", tope_mb: 64, justificable: false },
    entregables: [{ ruta: "ZIP-RAIZ.zip", rol: "zip_raiz" }, { ruta: "OTRO.zip", rol: "otro" }],
    insumos: { extensiones: [".zip"] },
    repositorio: { tope_mb: 1600 },
    justificaciones: [],
  };
  return { ...base, ...extra };
}

function selftest() {
  const politica = politicaSintetica();
  const mib = (mb) => mbABytes(mb);

  // 1. Todo por debajo de los topes: pasa.
  const bajo = medicion(politica, {
    entregables: [
      { ruta: "ZIP-RAIZ.zip", rol: "zip_raiz", bytes: mib(40) },
      { ruta: "OTRO.zip", rol: "otro", bytes: mib(50) },
    ],
    insumos: [{ ruta: "TERCERO.zip", bytes: mib(20) }],
    zipRaiz: { ruta: "ZIP-RAIZ.zip", bytes: mib(40) },
  });
  assert.equal(evaluarPresupuesto(bajo, politica).ok, true, "bajo los topes debe pasar");

  // 2. ZIP raíz por encima de su tope duro: falla siempre (no es justificable).
  const zipGrande = medicion(politica, {
    entregables: [
      { ruta: "ZIP-RAIZ.zip", rol: "zip_raiz", bytes: mib(65) },
      { ruta: "OTRO.zip", rol: "otro", bytes: mib(1) },
    ],
    zipRaiz: { ruta: "ZIP-RAIZ.zip", bytes: mib(65) },
  });
  const evalZipGrande = evaluarPresupuesto(zipGrande, politica);
  assert.equal(evalZipGrande.ok, false, "el ZIP raíz no puede pasar de 64 MiB");
  assert.equal(evalZipGrande.fallos[0].id, "zip_raiz");

  // 3. Grupo de entregables sobre 128 MiB sin justificación: falla.
  const grupoGrande = medicion(politica, {
    entregables: [
      { ruta: "ZIP-RAIZ.zip", rol: "zip_raiz", bytes: mib(60) },
      { ruta: "OTRO.zip", rol: "otro", bytes: mib(80) },
    ],
    zipRaiz: { ruta: "ZIP-RAIZ.zip", bytes: mib(60) },
  });
  const evalGrupoGrande = evaluarPresupuesto(grupoGrande, politica);
  assert.equal(evalGrupoGrande.ok, false, "sin justificación el exceso debe fallar");
  assert.ok(evalGrupoGrande.fallos.some((fallo) => fallo.id === "entregables"));

  // 4. El mismo exceso con justificación vigente: pasa, marcado JUSTIFICADO.
  const conJustificacion = politicaSintetica({
    justificaciones: [{ id: "entregables", techo_mb: 150, motivo: "entrega partida en dos artefactos", fecha: "2026-10-15", autor: "test" }],
  });
  const evalJustificado = evaluarPresupuesto(grupoGrande, conJustificacion);
  assert.equal(evalJustificado.ok, true, "una justificación vigente debe sostener el exceso");
  assert.deepEqual(evalJustificado.justificados, ["entregables"]);

  // 5. La justificación vence cuando lo medido pasa su techo declarado.
  const techoCorto = politicaSintetica({
    justificaciones: [{ id: "entregables", techo_mb: 100, motivo: "techo chico", fecha: "2026-10-15", autor: "test" }],
  });
  const evalVencida = evaluarPresupuesto(grupoGrande, techoCorto);
  assert.equal(evalVencida.ok, false, "la justificación vencida debe volver a fallar");
  assert.ok(evalVencida.fallos.some((fallo) => fallo.id === "entregables"));

  // 6. Un entregable borrado del repositorio se reporta como faltante.
  const faltante = medicion(politica, {
    entregables: [
      { ruta: "ZIP-RAIZ.zip", rol: "zip_raiz", bytes: null },
      { ruta: "OTRO.zip", rol: "otro", bytes: mib(10) },
    ],
    zipRaiz: { ruta: "ZIP-RAIZ.zip", bytes: null },
  });
  const evalFaltante = evaluarPresupuesto(faltante, politica);
  assert.equal(evalFaltante.ok, false, "un entregable ausente debe fallar");
  assert.deepEqual(evalFaltante.faltantes, ["ZIP-RAIZ.zip"]);

  // 7. El objetivo de recorte del ZIP raíz mantiene la aritmética del techo.
  assert.equal(evalGrupoGrande.objetivoZipRaizBytes, LIMITE_SESION_BYTES - mib(80), "objetivo de recorte incorrecto");

  console.log("presupuesto de artefacto: 7/7 reglas verificadas (tope duro del ZIP raíz, techo combinado, justificación vigente y vencida, faltantes, objetivo de recorte)");
  return true;
}

function principal() {
  const politica = cargarPolitica();
  const medicionReal = medirArtefacto(undefined, politica);
  const evaluacion = evaluarPresupuesto(medicionReal, politica);

  if (BANDERAS.json) {
    console.log(
      JSON.stringify(
        {
          ok: evaluacion.ok,
          unidad: "MiB",
          limite_sesion_mb: aMiB(LIMITE_SESION_BYTES),
          medicion: medicionReal,
          limites: evaluacion.limites,
          justificados: evaluacion.justificados,
          objetivo_zip_raiz_bytes: evaluacion.objetivoZipRaizBytes,
        },
        null,
        2,
      ),
    );
    return evaluacion.ok;
  }

  console.log(`Presupuesto de artefacto de sesión (techo combinado: ${politica.limite_sesion_mb} MiB por grupo)`);
  for (const limite of evaluacion.limites) {
    const medido = limite.medidoBytes === null ? "sin archivo" : formatearMiB(limite.medidoBytes);
    const tope = formatearMiB(limite.topeBytes);
    const exceso = limite.excesoBytes ? ` (+${formatearMiB(limite.excesoBytes)})` : "";
    console.log(`  ${ETIQUETA[limite.estado].padEnd(22)} ${limite.etiqueta}: ${medido} / tope ${tope}${exceso}`);
    if (limite.estado === "justificado") {
      console.log(`      justificación hasta ${formatearMiB(limite.techoBytes)}: ${limite.motivo}`);
    } else if (limite.motivo) {
      console.log(`      ${limite.motivo}`);
    }
  }
  for (const item of medicionReal.insumos.archivos.slice(0, 5)) {
    console.log(`      insumo mayor: ${item.ruta} (${formatearMiB(item.bytes)})`);
  }
  if (evaluacion.objetivoZipRaizBytes < medicionReal.entregables.bytes) {
    const objetivo = Math.max(0, evaluacion.objetivoZipRaizBytes);
    console.log(
      `Objetivo sin justificación: ${politica.zip_raiz.ruta} debe bajar a ${formatearMiB(objetivo)} ` +
        `(hoy ${medicionReal.zipRaiz.bytes === null ? "sin archivo" : formatearMiB(medicionReal.zipRaiz.bytes)}) ` +
        "o hay que deduplicar el paquete directo. Ver docs/PRESUPUESTO_ARTEFACTO_SESION.md.",
    );
  }

  for (const ruta of evaluacion.faltantes) {
    console.error(`FALLO: falta el entregable versionado ${ruta}`);
  }

  if (evaluacion.ok) {
    const sufijo = evaluacion.justificados.length ? ` (con justificación escrita: ${evaluacion.justificados.join(", ")})` : "";
    console.log(`OK: presupuesto de artefacto dentro de los topes${sufijo}`);
    return true;
  }
  console.error(`FALLO: ${evaluacion.fallos.map((fallo) => `${fallo.id} (${ETIQUETA[fallo.estado]})`).join(", ")}`);
  return false;
}

if (BANDERAS.selftest) {
  selftest();
  process.exit(0);
}

process.exit(principal() ? 0 : 1);
