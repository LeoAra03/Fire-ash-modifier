// Historial transaccional pequeño para los editores de PokeMod Studio.
// Guarda snapshots antes/después y mantiene acotado el uso de memoria.
function snapshotEquals(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b || a == null || b == null) return false;
  if (typeof a !== "object") return false;
  if (a instanceof Uint8Array || b instanceof Uint8Array) {
    if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => snapshotEquals(v, b[i]));
  }
  const ak = Object.keys(a), bk = Object.keys(b);
  return ak.length === bk.length && ak.every((k) => Object.prototype.hasOwnProperty.call(b, k) && snapshotEquals(a[k], b[k]));
}

function snapshotSize(value) {
  if (typeof value === "string") return value.length * 2;
  if (value instanceof Uint8Array) return value.byteLength;
  if (Array.isArray(value)) return value.reduce((n, x) => n + snapshotSize(x), 0);
  if (value && typeof value === "object") return Object.values(value).reduce((n, x) => n + snapshotSize(x), 0);
  return 8;
}

export function createHistory({ maxEntries = 40, maxBytes = 24 * 1024 * 1024, onChange = () => {} } = {}) {
  const undoStack = [];
  const redoStack = [];
  let bytes = 0;
  let busy = false;

  const state = () => ({
    canUndo: undoStack.length > 0 && !busy,
    canRedo: redoStack.length > 0 && !busy,
    busy,
    undoLabel: undoStack.length ? undoStack[undoStack.length - 1].label : "",
    redoLabel: redoStack.length ? redoStack[redoStack.length - 1].label : "",
    undoCount: undoStack.length,
    redoCount: redoStack.length,
    bytes,
  });
  const notify = () => {
    try { onChange(state()); } catch { /* la UI no debe romper el historial */ }
  };
  const discard = (stack) => {
    while (stack.length) bytes -= stack.pop().size;
  };
  const clear = () => {
    undoStack.length = 0;
    redoStack.length = 0;
    bytes = 0;
    notify();
  };

  function record({ label, before, after, restore, equals = snapshotEquals, measure = snapshotSize }) {
    if (busy) throw new Error("El historial está ocupado.");
    if (equals(before, after)) return false;
    if (typeof restore !== "function") throw new TypeError("La entrada del historial necesita una función restore.");

    // Una edición nueva descarta la rama de rehacer.
    discard(redoStack);
    const size = Math.max(0, measure(before)) + Math.max(0, measure(after));
    if (maxEntries < 1 || size > maxBytes) {
      // No dejamos que Deshacer salte una operación que no pudo registrarse.
      discard(undoStack);
      notify();
      return false;
    }
    undoStack.push({ label: String(label || "Edición"), before, after, restore, equals, measure, size });
    bytes += size;
    while (undoStack.length + redoStack.length > maxEntries || bytes > maxBytes) {
      const oldest = undoStack.shift();
      if (!oldest) break;
      bytes -= oldest.size;
    }
    notify();
    return true;
  }

  async function move(from, to, snapshot, direction) {
    if (busy || !from.length) return null;
    const entry = from.pop();
    busy = true;
    notify();
    try {
      await entry.restore(entry[snapshot], direction);
      to.push(entry);
      return entry;
    } catch (error) {
      from.push(entry);
      throw error;
    } finally {
      busy = false;
      notify();
    }
  }

  return {
    record,
    clear,
    undo: () => move(undoStack, redoStack, "before", "undo"),
    redo: () => move(redoStack, undoStack, "after", "redo"),
    get state() { return state(); },
  };
}
