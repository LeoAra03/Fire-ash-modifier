/**
 * ruby_method_patch.mjs — parcheo de métodos Ruby dentro de una sección de
 * `Scripts.rxdata` sin contar `end` a ciegas.
 *
 * Por qué existe: `tools/apply_emergency_abra_and_free_tower.mjs` sustituía
 * `grandeurItemExchange` con una expresión regular que tenía que *adivinar*
 * cuántos `end` cerraban el método original (`\s+end\s+end\s+end\s+end`) y
 * escribía un reemplazo con sus propios tres `end`. Cuando el original no
 * cerraba con esa cuenta exacta, la diferencia sobrevivía en la sección: en la
 * copia de desarrollo quedó un `end` sobrante (línea 710 de «Grandeur Club») y
 * la sección dejó de compilar. Lo registró la fase 39 en
 * `docs/DEFINICION_DE_TERMINADO_SCRIPTS.md` como hallazgo bloqueante.
 *
 * La regla de aquí es estructural, no aritmética: un `def` de nivel superior
 * termina en el primer `end` que aparece en la columna 0. Los `end` del cuerpo
 * van indentados, así que no hace falta contarlos. Con eso el reemplazo no
 * depende de cuántos bloques tuviera el método original.
 *
 * Sólo trabaja sobre texto: no sabe de Marshal ni de zlib. Quien llama carga la
 * sección, la descomprime, usa estas funciones y vuelve a comprimir.
 */

/** Divide el código en líneas conservando el terminador de cada una. */
export function dividirLineas(codigo) {
  const partes = String(codigo).split(/(?<=\n)/);
  if (partes.length === 1 && partes[0] === "") return [];
  let inicio = 0;
  return partes.map((parte) => {
    const eol = /\r?\n$/.exec(parte)?.[0] ?? "";
    const texto = eol ? parte.slice(0, -eol.length) : parte;
    const linea = { texto, eol, inicio, fin: inicio + parte.length };
    inicio += parte.length;
    return linea;
  });
}

/** `end` en la columna 0: cierra un `def`/`class`/`module`/`begin` de nivel superior. */
export function esEndDeNivelSuperior(texto) {
  return /^end[ \t]*$/.test(texto.replace(/\r$/, ""));
}

/** `def nombre(...)` en la columna 0 (admite `self.` y `?`/`!` finales). */
export function esDefDeNivelSuperior(texto) {
  return /^def[ \t]+(?:self\.)?[A-Za-z_][A-Za-z0-9_]*[?!]?/.test(texto.replace(/\r$/, ""));
}

/** Nombre del método que abre una línea `def` de nivel superior, o null. */
export function nombreDeDef(texto) {
  const m = /^def[ \t]+(?:self\.)?([A-Za-z_][A-Za-z0-9_]*[?!]?)/.exec(texto.replace(/\r$/, ""));
  return m ? m[1] : null;
}

/**
 * Localiza el intervalo exacto de un método de nivel superior.
 *
 * @param {string} codigo  texto completo de la sección Ruby.
 * @param {string|RegExp} cabecera  nombre del método o expresión que debe
 *   cumplir la línea `def` (se aplica sobre la línea sin su terminador).
 * @returns {{inicio:number, fin:number, texto:string, lineaDef:number, lineaEnd:number}|null}
 *   `inicio`/`fin` son desplazamientos sobre `codigo` (fin exclusivo, incluye el
 *   terminador del `end` final). Devuelve null si el método no está o si no se
 *   encuentra su `end` de nivel superior.
 */
export function intervaloMetodo(codigo, cabecera) {
  const lineas = dividirLineas(codigo);
  const cumple = (texto) => (cabecera instanceof RegExp ? cabecera.test(texto) : nombreDeDef(texto) === cabecera);
  const apertura = lineas.findIndex((l) => esDefDeNivelSuperior(l.texto) && cumple(l.texto));
  if (apertura < 0) return null;
  let cierre = -1;
  for (let i = apertura + 1; i < lineas.length; i++) {
    if (esEndDeNivelSuperior(lineas[i].texto)) { cierre = i; break; }
    // Un `def` de nivel superior antes de cualquier `end`: el método buscado no
    // se cierra (sección malformada). No se adivina: se informa.
    if (esDefDeNivelSuperior(lineas[i].texto)) return null;
  }
  if (cierre < 0) return null;
  return {
    inicio: lineas[apertura].inicio,
    fin: lineas[cierre].fin,
    texto: codigo.slice(lineas[apertura].inicio, lineas[cierre].fin),
    lineaDef: apertura + 1,
    lineaEnd: cierre + 1,
  };
}

/**
 * Sustituye un método de nivel superior por texto nuevo, sin tocar nada más.
 *
 * @returns {{codigo:string, reemplazado:boolean, anterior:string|null}}
 *   `reemplazado` es false cuando el método no existe o no tiene cierre; el
 *   código se devuelve sin cambios para que quien llama decida (lanzar, avisar).
 */
export function reemplazarMetodo(codigo, cabecera, textoNuevo) {
  const intervalo = intervaloMetodo(codigo, cabecera);
  if (!intervalo) return { codigo, reemplazado: false, anterior: null };
  // El intervalo sustituido termina con el salto de línea de su `end`. Si el
  // texto nuevo no lo trae, se conserva el de la sección: así la línea siguiente
  // no queda pegada al `end` y el reemplazo es idempotente.
  const eol = /\r?\n$/.exec(intervalo.texto)?.[0] ?? "";
  const reemplazo = eol && !/\r?\n$/.test(textoNuevo) ? textoNuevo + eol : textoNuevo;
  return {
    codigo: codigo.slice(0, intervalo.inicio) + reemplazo + codigo.slice(intervalo.fin),
    reemplazado: true,
    anterior: intervalo.texto,
  };
}

/**
 * Detecta el defecto que esta librería vino a impedir: un `end` de nivel
 * superior suelto justo después del cierre de un método (sobrante del texto
 * original cuando un parche antiguo reemplazó sólo parte del método).
 *
 * @returns {{sobrante:boolean, indiceLinea:number|null, inicio:number|null, fin:number|null, texto:string|null}}
 *   Con `sobrante: true` trae además el intervalo exacto del `end` sobrante,
 *   listo para quitarlo sin reescribir la sección entera.
 */
export function endSobranteTrasMetodo(codigo, cabecera) {
  const sinDefecto = { sobrante: false, indiceLinea: null, inicio: null, fin: null, texto: null };
  const intervalo = intervaloMetodo(codigo, cabecera);
  if (!intervalo) return sinDefecto;
  const lineas = dividirLineas(codigo);
  for (let i = intervalo.lineaEnd; i < lineas.length; i++) {
    const texto = lineas[i].texto.replace(/\r$/, "");
    if (texto.trim() === "") continue;            // líneas en blanco: no cuentan
    if (esEndDeNivelSuperior(lineas[i].texto)) {
      return { sobrante: true, indiceLinea: i + 1, inicio: lineas[i].inicio, fin: lineas[i].fin, texto: lineas[i].texto };
    }
    return sinDefecto;                            // lo siguiente es código: no hay `end` suelto
  }
  return sinDefecto;
}

/** Quita el `end` sobrante detectado por `endSobranteTrasMetodo`, si existe. */
export function quitarEndSobrante(codigo, cabecera) {
  const hallazgo = endSobranteTrasMetodo(codigo, cabecera);
  if (!hallazgo.sobrante) return { codigo, quitado: false, textoQuitado: null };
  return {
    codigo: codigo.slice(0, hallazgo.inicio) + codigo.slice(hallazgo.fin),
    quitado: true,
    textoQuitado: hallazgo.texto,
  };
}

/**
 * Equilibrio de nivel superior de una sección: cuántos `def`/`class`/`module`
 * abren en la columna 0 y cuántos `end` la cierran. Es una comprobación barata
 * y sin Ruby; la autoridad final la tiene la compilación
 * (`tools/qa/ruby_syntax_full_check.mjs`).
 */
export function equilibrioNivelSuperior(codigo) {
  let aperturas = 0;
  let cierres = 0;
  for (const linea of dividirLineas(codigo)) {
    const texto = linea.texto.replace(/\r$/, "");
    if (/^(def|class|module)[ \t]/.test(texto)) aperturas++;
    else if (esEndDeNivelSuperior(texto)) cierres++;
  }
  return { aperturas, cierres, equilibrado: aperturas === cierres };
}
