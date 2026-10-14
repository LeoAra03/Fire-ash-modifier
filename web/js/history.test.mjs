import { createHistory } from "./history.js";

let pass = 0, fail = 0;
const ok = (condition, message) => {
  if (condition) pass++;
  else { fail++; console.error("FALLA:", message); }
};

let value = "base";
const h = createHistory({ maxEntries: 3, maxBytes: 1024 });
const recordValue = (label, before, after) => h.record({
  label,
  before,
  after,
  restore: async (next) => { value = next; },
});

ok(!h.state.canUndo && !h.state.canRedo, "inicia vacío");
value = "uno";
recordValue("cambiar a uno", "base", "uno");
ok(h.state.canUndo && !h.state.canRedo, "registra una edición");
let entry = await h.undo();
ok(entry?.label === "cambiar a uno" && value === "base", "deshace el último valor");
ok(!h.state.canUndo && h.state.canRedo, "mueve entrada a rehacer");
entry = await h.redo();
ok(entry?.label === "cambiar a uno" && value === "uno", "rehace el valor");

value = "dos";
recordValue("cambiar a dos", "uno", "dos");
await h.undo();
value = "alternativo";
recordValue("nueva rama", "uno", "alternativo");
ok(!h.state.canRedo, "una edición nueva descarta la rama de rehacer");
ok(!h.record({ label: "sin cambio", before: "igual", after: "igual", restore() {} }), "omite snapshots idénticos");

let changedDuringFailure = false;
const failed = createHistory();
failed.record({
  label: "falla reversible",
  before: 0,
  after: 1,
  restore: async () => { changedDuringFailure = true; throw new Error("fallo de prueba"); },
});
try { await failed.undo(); } catch { /* fallo esperado */ }
ok(changedDuringFailure && failed.state.canUndo && !failed.state.canRedo, "si falla restore conserva la entrada para reintentar");

const limited = createHistory({ maxEntries: 1, maxBytes: 1024 });
limited.record({ label: "primera", before: "a", after: "b", restore() {} });
limited.record({ label: "segunda", before: "b", after: "c", restore() {} });
ok(limited.state.undoCount === 1 && limited.state.undoLabel === "segunda", "respeta el máximo de entradas");

const oversized = createHistory({ maxEntries: 4, maxBytes: 4 });
oversized.record({ label: "demasiado grande", before: "larguísimo", after: "otro texto", restore() {} });
ok(!oversized.state.canUndo && oversized.state.bytes === 0, "no retiene snapshots que exceden el límite de memoria");

console.log(`\nhistorial: ${pass} OK, ${fail} fallos`);
process.exit(fail ? 1 : 0);
