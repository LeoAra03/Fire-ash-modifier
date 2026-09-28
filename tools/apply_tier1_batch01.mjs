#!/usr/bin/env node
/**
 * Compatibilidad: el compilador Tier 1 ahora es genérico.
 * Este alias procesa el catálogo acumulativo aprobado.
 */
console.warn("Aviso: usa tools/apply_tier1_batch.mjs para lotes nuevos.");
await import("./apply_tier1_batch.mjs");
