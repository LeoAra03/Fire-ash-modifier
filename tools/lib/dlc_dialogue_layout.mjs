/**
 * Formato de diálogo para cajas de estilo Game Boy Color.
 *
 * Las fuentes pueden seguir escritas como frases naturales: antes de generar
 * comandos RMXP se ajustan a 40 caracteres visibles y se paginan en cajas de
 * un máximo de dos líneas. Los códigos de control no consumen ancho y las
 * etiquetas de hablante se conservan como \sp[Nombre] en cada página.
 */
export const GBC_DIALOGUE_COLUMNS = 40;
export const GBC_DIALOGUE_LINES_PER_BOX = 2;

function controlAt(text, index) {
  if (text[index] !== "\\" || index + 1 >= text.length) return null;
  let end = index + 1;
  if (/[A-Za-z]/.test(text[end])) {
    while (end < text.length && /[A-Za-z]/.test(text[end])) end++;
    if (text[end] === "[") {
      const close = text.indexOf("]", end + 1);
      if (close >= 0) end = close + 1;
    }
  } else if (/\d/.test(text[end])) {
    while (end < text.length && /\d/.test(text[end])) end++;
  } else {
    end++;
  }
  return text.slice(index, end);
}

/** Ancho en caracteres visibles; los códigos RMXP/Essentials son invisibles. */
export function visibleDialogueWidth(value) {
  const text = String(value ?? "");
  let width = 0;
  for (let i = 0; i < text.length;) {
    if (text[i] === "\\") {
      const control = controlAt(text, i);
      if (control) {
        i += control.length;
        continue;
      }
    }
    const point = text.codePointAt(i);
    const char = String.fromCodePoint(point);
    if (char !== "\n" && char !== "\r") width++;
    i += char.length;
  }
  return width;
}

function speakerPrefix(value) {
  const text = String(value ?? "");
  let offset = 0;
  let style = "";
  while (offset < text.length && text[offset] === "\\") {
    const control = controlAt(text, offset);
    if (!control || control.toLowerCase() === "\\n") break;
    if (!/^\\(?:b|c\[\d+\])$/i.test(control)) break;
    style += control;
    offset += control.length;
    while (/\s/.test(text[offset] ?? "")) offset++;
  }
  const rest = text.slice(offset);
  const explicit = rest.match(/^\\sp\[([^\]]{1,28})\]\s*/i);
  if (explicit && explicit[1].trim()) {
    return { name: explicit[1].trim(), body: rest.slice(explicit[0].length), style };
  }
  const named = rest.match(/^([^:\n—]{2,28}?)\s*[:—]\s+/u);
  if (!named) return null;
  const name = named[1].trim();
  if (!name || /^[0-9]/.test(name) || name.split(/\s+/).length > 4 ||
      !/[AEIOUaeiou]/.test(name) || /PokeMod/i.test(name) || name.includes("\\")) return null;
  return { name, body: rest.slice(named[0].length), style };
}

function splitLongWord(word, columns) {
  if (visibleDialogueWidth(word) <= columns) return [word];
  const chunks = [];
  let chunk = "";
  let width = 0;
  for (let i = 0; i < word.length;) {
    if (word[i] === "\\") {
      const control = controlAt(word, i);
      if (control) {
        chunk += control;
        i += control.length;
        continue;
      }
    }
    const point = word.codePointAt(i);
    const char = String.fromCodePoint(point);
    if (width === columns) {
      chunks.push(chunk);
      chunk = "";
      width = 0;
    }
    chunk += char;
    width++;
    i += char.length;
  }
  if (chunk || !chunks.length) chunks.push(chunk);
  return chunks;
}

/** Ajusta un párrafo a columnas, preservando códigos de formato y cortes \n. */
export function wrapGbcDialogue(value, columns = GBC_DIALOGUE_COLUMNS) {
  if (!Number.isInteger(columns) || columns < 1) throw new RangeError("columns debe ser un entero positivo");
  const text = String(value ?? "");
  const rows = [];
  let row = "";
  let rowWidth = 0;
  let word = "";

  const pushWord = () => {
    if (!word) return;
    const parts = splitLongWord(word, columns);
    for (let index = 0; index < parts.length; index++) {
      const part = parts[index];
      const partWidth = visibleDialogueWidth(part);
      if (!row) {
        row = part;
        rowWidth = partWidth;
      } else if (rowWidth + 1 + partWidth <= columns) {
        row += ` ${part}`;
        rowWidth += 1 + partWidth;
      } else {
        rows.push(row);
        row = part;
        rowWidth = partWidth;
      }
      if (index < parts.length - 1) {
        rows.push(row);
        row = "";
        rowWidth = 0;
      }
    }
    word = "";
  };

  const pushExplicitBreak = () => {
    pushWord();
    rows.push(row);
    row = "";
    rowWidth = 0;
  };

  for (let i = 0; i < text.length;) {
    if (text[i] === "\\") {
      const control = controlAt(text, i);
      if (control) {
        if (control.toLowerCase() === "\\n") pushExplicitBreak();
        else {
          word += control;
          // The escape and its parameter are formatting, not visible glyphs.
        }
        i += control.length;
        continue;
      }
    }
    const point = text.codePointAt(i);
    const char = String.fromCodePoint(point);
    if (char === "\n") {
      pushExplicitBreak();
    } else if (/\s/u.test(char)) {
      pushWord();
    } else {
      word += char;
    }
    i += char.length;
  }
  pushWord();
  if (row || !rows.length) rows.push(row);
  return rows;
}

/**
 * Convierte una o varias frases de origen en páginas aptas para la caja GBC.
 * La semántica de los comandos 401 del juego une sus parámetros con espacios;
 * por eso las frases se reúnen antes de envolverlas. Si se reconoce un
 * hablante inicial, se normaliza a \sp[Nombre] y se mantiene en cada página.
 */
export function layoutGbcDialogue(source, {
  columns = GBC_DIALOGUE_COLUMNS,
  linesPerBox = GBC_DIALOGUE_LINES_PER_BOX,
} = {}) {
  if (!Number.isInteger(linesPerBox) || linesPerBox < 1) throw new RangeError("linesPerBox debe ser un entero positivo");
  const fragments = (Array.isArray(source) ? source : [source]).map((value) => String(value ?? ""));
  let speaker = null;
  let firstStyle = "";
  const pieces = fragments.map((fragment, index) => {
    const parsed = speakerPrefix(fragment);
    if (parsed && (index === 0 || speaker === parsed.name)) {
      if (!speaker) {
        speaker = parsed.name;
        firstStyle = parsed.style ?? "";
      }
      return parsed.body;
    }
    return fragment;
  });
  const body = pieces.join(" ");
  const rows = wrapGbcDialogue(body, columns);
  const pages = [];
  for (let index = 0; index < rows.length; index += linesPerBox) {
    const lines = rows.slice(index, index + linesPerBox);
    const prefix = speaker ? `\\sp[${speaker}]${firstStyle}` : "";
    pages.push({ speaker, lines, text: `${prefix}${lines.join("\\n")}` });
  }
  return { speaker, body, rows, pages, columns, linesPerBox };
}

export function formatGbcDialoguePages(source, options) {
  return layoutGbcDialogue(source, options).pages.map((page) => page.text);
}

/** Crea los comandos RMXP 101/401 usados por los generadores de contenido. */
export function gbcDialogueCommands(source, { cmd, S, indent = 0, options } = {}) {
  if (typeof cmd !== "function" || typeof S !== "function") {
    throw new TypeError("gbcDialogueCommands necesita cmd y S");
  }
  return formatGbcDialoguePages(source, options).flatMap((text) => [
    cmd(101, [S("")], indent),
    cmd(401, [S(text)], indent),
  ]);
}
