#!/usr/bin/env node
/**
 * artifact_budget.mjs
 *
 * Presupuesto de tamaño del artefacto de sesión (Fase 14/2680, tarea 34).
 *
 * Regla: el ZIP raíz tiene un tope duro de 64 MiB y el conjunto de entregables
 * versionados no puede pasar de 128 MiB **sin justificación escrita**. La
 * justificación vive en `content/artifact_budget.json` (`justificaciones`) con
 * un `techo_mb` explícito: si lo medido supera ese techo, la justificación
 * vence y la comprobación falla, de modo que una excepción nunca se vuelve
 * permanente por olvido.
 *
 * El módulo no escribe nada: mide archivos ya versionados y evalúa la política.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const BYTES_PER_MIB = 1024 * 1024;
/** Lectura conservadora del techo de la plataforma: 128 MiB de bytes reales. */
export const LIMITE_SESION_MB = 128;
export const LIMITE_SESION_BYTES = LIMITE_SESION_MB * BYTES_PER_MIB;
export const POLICY_FILE = path.join(ROOT, "content", "artifact_budget.json");
export const ARCHIVE_EXT = /\.(zip|rar|7z)$/i;

export const aMiB = (bytes) => bytes / BYTES_PER_MIB;
export const formatearMiB = (bytes) => `${aMiB(bytes).toFixed(2)} MiB`;
export const mbABytes = (mb) => Math.round(mb * BYTES_PER_MIB);

/** Lee y valida la política. Falla ruidosamente si el JSON está mal formado. */
export function cargarPolitica(file = POLICY_FILE) {
  let crudo;
  try {
    crudo = fs.readFileSync(file, "utf8");
  } catch {
    throw new Error(`Falta la política de presupuesto: ${path.relative(ROOT, file)}`);
  }
  let policy;
  try {
    policy = JSON.parse(crudo);
  } catch (error) {
    throw new Error(`content/artifact_budget.json no es JSON válido: ${error.message}`);
  }
  if (!policy.zip_raiz || typeof policy.zip_raiz.tope_mb !== "number") {
    throw new Error("La política necesita zip_raiz.tope_mb numérico");
  }
  if (!Array.isArray(policy.entregables) || policy.entregables.length === 0) {
    throw new Error("La política necesita al menos un entregable");
  }
  if (!Array.isArray(policy.justificaciones)) policy.justificaciones = [];
  return policy;
}

/** Rutas versionadas (git ls-files), sin depender del árbol de trabajo sucio. */
export function archivosVersionados(root = ROOT) {
  const salida = execFileSync("git", ["-C", root, "ls-files", "-z"], {
    encoding: "utf8",
    maxBuffer: 256 * BYTES_PER_MIB,
  });
  return salida.split("\0").filter(Boolean);
}

/**
 * Mide el artefacto de sesión: total versionado, grupo de entregables, grupo de
 * insumos de terceros y el ZIP raíz por separado.
 */
export function medirArtefacto(root = ROOT, policy = cargarPolitica()) {
  const tamanos = new Map();
  for (const rel of archivosVersionados(root)) {
    const abs = path.join(root, rel);
    let st;
    try {
      st = fs.statSync(abs);
    } catch {
      continue; // Borrado sin commitear: la política lo reportará como faltante.
    }
    if (st.isFile()) tamanos.set(rel, st.size);
  }

  const entregables = policy.entregables.map((entrada) => ({
    ruta: entrada.ruta,
    rol: entrada.rol ?? "entregable",
    bytes: tamanos.has(entrada.ruta) ? tamanos.get(entrada.ruta) : null,
  }));

  const rutasEntregables = new Set(entregables.map((item) => item.ruta));
  const insumos = [...tamanos]
    .filter(([rel]) => ARCHIVE_EXT.test(rel) && !rutasEntregables.has(rel))
    .map(([ruta, bytes]) => ({ ruta, bytes }))
    .sort((a, b) => b.bytes - a.bytes || a.ruta.localeCompare(b.ruta));

  const sumar = (items) => items.reduce((total, item) => total + (item.bytes ?? 0), 0);
  const totalBytes = [...tamanos.values()].reduce((total, bytes) => total + bytes, 0);
  const zipRaiz = entregables.find((item) => item.ruta === policy.zip_raiz.ruta) ?? null;

  return {
    archivosVersionados: tamanos.size,
    totalBytes,
    entregables: { archivos: entregables, bytes: sumar(entregables) },
    insumos: { archivos: insumos, bytes: sumar(insumos) },
    zipRaiz: zipRaiz ? { ruta: zipRaiz.ruta, bytes: zipRaiz.bytes } : { ruta: policy.zip_raiz.ruta, bytes: null },
  };
}

/** Justificación vigente para un límite: existe y su techo cubre lo medido. */
function justificacion(policy, id, medidoBytes) {
  const entrada = policy.justificaciones.find((item) => item.id === id);
  if (!entrada) return { estado: "ausente" };
  const techoBytes = mbABytes(entrada.techo_mb);
  if (medidoBytes !== null && medidoBytes > techoBytes) {
    return { estado: "vencida", entrada, techoBytes };
  }
  return { estado: "vigente", entrada, techoBytes };
}

function revisarLimite({ id, etiqueta, medidoBytes, topeBytes, justificable, ruta = null }, policy) {
  const resultado = {
    id,
    etiqueta,
    ruta,
    medidoBytes,
    topeBytes,
    justificable,
    excesoBytes: 0,
    estado: "ok",
    motivo: null,
    techoBytes: null,
  };

  if (medidoBytes === null) {
    resultado.estado = "falta";
    resultado.motivo = `No está versionado: ${ruta}`;
    return resultado;
  }
  if (medidoBytes <= topeBytes) return resultado;

  resultado.excesoBytes = medidoBytes - topeBytes;
  const just = justificacion(policy, id, medidoBytes);

  if (!justificable) {
    resultado.estado = "excedido";
    resultado.motivo = "Tope duro sin excepción; hay que recortar el artefacto.";
    return resultado;
  }
  if (just.estado === "vigente") {
    resultado.estado = "justificado";
    resultado.motivo = just.entrada.motivo;
    resultado.techoBytes = just.techoBytes;
    return resultado;
  }
  resultado.estado = just.estado === "vencida" ? "justificacion_vencida" : "excedido";
  resultado.motivo =
    just.estado === "vencida"
      ? `La justificación declara techo de ${just.entrada.techo_mb} MiB y lo medido lo supera: hay que recortar o actualizar la excepción con motivo escrito.`
      : "Nadie escribió una justificación para este exceso.";
  return resultado;
}

/**
 * Evalúa la política contra una medición. Función pura: el autotest la usa con
 * mediciones sintéticas, sin tocar el disco.
 */
export function evaluarPresupuesto(medicion, policy = cargarPolitica()) {
  const limites = [];

  limites.push(
    revisarLimite(
      {
        id: "zip_raiz",
        etiqueta: `ZIP raíz (${policy.zip_raiz.ruta})`,
        ruta: policy.zip_raiz.ruta,
        medidoBytes: medicion.zipRaiz?.bytes ?? null,
        topeBytes: mbABytes(policy.zip_raiz.tope_mb),
        justificable: policy.zip_raiz.justificable === true,
      },
      policy,
    ),
  );

  limites.push(
    revisarLimite(
      {
        id: "entregables",
        etiqueta: "Entregables versionados (raíz + Scripts_corregido)",
        medidoBytes: medicion.entregables.bytes,
        topeBytes: LIMITE_SESION_BYTES,
        justificable: true,
      },
      policy,
    ),
  );

  limites.push(
    revisarLimite(
      {
        id: "insumos",
        etiqueta: `Insumos de terceros (${medicion.insumos.archivos.length} archivos)`,
        medidoBytes: medicion.insumos.bytes,
        topeBytes: LIMITE_SESION_BYTES,
        justificable: true,
      },
      policy,
    ),
  );

  limites.push(
    revisarLimite(
      {
        id: "repositorio",
        etiqueta: `Repositorio completo (${medicion.archivosVersionados} archivos)`,
        medidoBytes: medicion.totalBytes,
        topeBytes: mbABytes(policy.repositorio?.tope_mb ?? 0),
        justificable: true,
      },
      policy,
    ),
  );

  const fallos = limites.filter((limite) => limite.estado === "excedido" || limite.estado === "falta" || limite.estado === "justificacion_vencida");
  const faltantes = medicion.entregables.archivos.filter((item) => item.bytes === null).map((item) => item.ruta);

  // Objetivo accionable para volver bajo el techo sin justificación: cuánto debe
  // bajar el ZIP raíz para que el grupo de entregables quepa en 128 MiB.
  const otrosEntregables = medicion.entregables.bytes - (medicion.zipRaiz?.bytes ?? 0);
  const objetivoZipRaizBytes = LIMITE_SESION_BYTES - otrosEntregables;

  return {
    ok: fallos.length === 0,
    limites,
    fallos,
    faltantes,
    objetivoZipRaizBytes,
    justificados: limites.filter((limite) => limite.estado === "justificado").map((limite) => limite.id),
  };
}
