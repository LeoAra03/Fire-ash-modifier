/**
 * Primitivas forenses para ROMs de Game Boy Advance (Gen 3 y hacks).
 *
 * Todo son decodificadores reales: LZ77/RLE de la BIOS, tiles 4/8 bpp,
 * paletas BGR555, tablas de punteros y tablas de texto. Nada de volcados
 * crudos sin interpretar.
 */

export const BASE_ROM = 0x08000000;

/* ─────────────────────────────── compresión ─────────────────────────────── */

/** LZ77 de la BIOS (0x10): ventana de 4096 bytes, referencias de 3 a 18. */
export function lz77(data, offset) {
  if (data[offset] !== 0x10) return null;
  const tam = data[offset + 1] | (data[offset + 2] << 8) | (data[offset + 3] << 16);
  if (tam <= 0 || tam > 0x40000) return null;
  const salida = new Uint8Array(tam);
  let p = offset + 4;
  let o = 0;
  while (o < tam && p < data.length) {
    let banderas = data[p++];
    for (let bit = 7; bit >= 0 && o < tam; bit--) {
      if (banderas & (1 << bit)) {
        if (p + 1 >= data.length) break;
        const b1 = data[p++];
        const b2 = data[p++];
        const largo = (b1 >> 4) + 3;
        const desplazamiento = (((b1 & 0x0f) << 8) | b2) + 1;
        if (desplazamiento > o) return null;
        for (let k = 0; k < largo && o < tam; k++) salida[o++] = salida[o - desplazamiento];
      } else {
        if (p >= data.length) break;
        salida[o++] = data[p++];
      }
    }
  }
  if (o < tam) return null;
  return { tipo: 'lz77', tam, datos: salida, consumido: p - offset };
}

/** RLE de la BIOS (0x30): 00-7F copia n+1 literales, 80-FF repite un byte n-125 veces. */
export function rle(data, offset) {
  if (data[offset] !== 0x30) return null;
  const tam = data[offset + 1] | (data[offset + 2] << 8) | (data[offset + 3] << 16);
  if (tam <= 0 || tam > 0x40000) return null;
  const salida = new Uint8Array(tam);
  let p = offset + 4;
  let o = 0;
  while (o < tam && p < data.length) {
    const cabecera = data[p++];
    if (cabecera < 0x80) {
      const n = cabecera + 1;
      for (let k = 0; k < n && o < tam; k++) salida[o++] = data[p++];
    } else {
      const valor = data[p++];
      const n = cabecera - 125;
      for (let k = 0; k < n && o < tam; k++) salida[o++] = valor;
    }
  }
  if (o < tam) return null;
  return { tipo: 'rle', tam, datos: salida, consumido: p - offset };
}

/** Descomprime según la cabecera encontrada en `offset`. */
export function descomprimirEn(data, offset) {
  if (data[offset] === 0x10) return lz77(data, offset);
  if (data[offset] === 0x30) return rle(data, offset);
  return null;
}

/** Censo de todos los bloques comprimidos válidos de la ROM. */
export function censoComprimidos(data) {
  const hallados = [];
  for (let o = 0; o + 4 < data.length; o++) {
    if (data[o] !== 0x10 && data[o] !== 0x30) continue;
    const tam = data[o + 1] | (data[o + 2] << 8) | (data[o + 3] << 16);
    if (tam < 32 || tam > 0x40000) continue;
    const r = descomprimirEn(data, o);
    if (!r) continue;
    hallados.push({ offset: o, tipo: r.tipo, tam, comprimido: r.consumido });
    o += r.consumido - 1;
  }
  return hallados;
}

/* ──────────────────────────────── paletas ───────────────────────────────── */

export function bgr555aRGB(v) {
  const r = (v & 0x1f) << 3;
  const g = ((v >> 5) & 0x1f) << 3;
  const b = ((v >> 10) & 0x1f) << 3;
  return [r | (r >> 5), g | (g >> 5), b | (b >> 5)];
}

/** Lee `colores` entradas BGR555 desde `offset`; el índice 0 sale transparente. */
export function leerPaleta(data, offset, colores = 16) {
  const paleta = [];
  for (let i = 0; i < colores; i++) {
    const v = data[offset + i * 2] | (data[offset + i * 2 + 1] << 8);
    const [r, g, b] = bgr555aRGB(v);
    paleta.push(i === 0 ? [r, g, b, 0] : [r, g, b, 255]);
  }
  return paleta;
}

/** ¿Parece una paleta BGR555 en crudo? (índice 0 transparente o muy oscuro/blanco). */
export function parecePaleta(data, offset, colores = 16) {
  if (offset + colores * 2 > data.length) return false;
  for (let i = 0; i < colores; i++) {
    const v = data[offset + i * 2] | (data[offset + i * 2 + 1] << 8);
    if (v & 0x8000) return false;
  }
  const primero = data[offset] | (data[offset + 1] << 8);
  return primero === 0 || primero === 0x7fff || (primero & 0x7fff) < 0x1000;
}

/* ───────────────────────────────── tiles ────────────────────────────────── */

/** Desentrelaza tiles de 4 bpp en un buffer de índices por píxel. */
export function tiles4bpp(datos, tilesAncho, tilesAlto) {
  const w = tilesAncho * 8;
  const h = tilesAlto * 8;
  const px = new Uint8Array(w * h);
  for (let t = 0; t < tilesAncho * tilesAlto; t++) {
    const tx = (t % tilesAncho) * 8;
    const ty = Math.floor(t / tilesAncho) * 8;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const b = datos[t * 32 + y * 4 + (x >> 1)] || 0;
        px[(ty + y) * w + tx + x] = (x & 1) ? (b >> 4) : (b & 0x0f);
      }
    }
  }
  return { w, h, px };
}

/** Tiles de 8 bpp (mapas de pantalla,一些 fondos). */
export function tiles8bpp(datos, tilesAncho, tilesAlto) {
  const w = tilesAncho * 8;
  const h = tilesAlto * 8;
  const px = new Uint8Array(w * h);
  for (let t = 0; t < tilesAncho * tilesAlto; t++) {
    const tx = (t % tilesAncho) * 8;
    const ty = Math.floor(t / tilesAncho) * 8;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) px[(ty + y) * w + tx + x] = datos[t * 64 + y * 8 + x] || 0;
    }
  }
  return { w, h, px };
}

/** Compone una hoja de sprites a partir de una lista de imágenes {w,h,px}. */
export function hojaSprites(imagenes, columnas = 8) {
  if (!imagenes.length) return null;
  const cw = imagenes[0].w;
  const ch = imagenes[0].h;
  const cols = Math.min(columnas, imagenes.length);
  const filas = Math.ceil(imagenes.length / cols);
  const px = new Uint8Array(cols * cw * filas * ch);
  imagenes.forEach((img, i) => {
    const ox = (i % cols) * cw;
    const oy = Math.floor(i / cols) * ch;
    for (let y = 0; y < Math.min(ch, img.h); y++) {
      for (let x = 0; x < Math.min(cw, img.w); x++) px[(oy + y) * cols * cw + ox + x] = img.px[y * img.w + x];
    }
  });
  return { w: cols * cw, h: filas * ch, px, cw, ch, cols, filas };
}

/* ──────────────────────────────── punteros ──────────────────────────────── */

export function punteroValido(data, ptr) {
  if (ptr < BASE_ROM) return false;
  const off = ptr - BASE_ROM;
  return off >= 0 && off < data.length;
}

export function offsetDe(data, ptr) {
  return ptr - BASE_ROM;
}

/**
 * Busca tablas de punteros. `validar(data, offset, posicion)` decide si una
 * entrada cuenta; debe devolver un objeto con metadatos o `null`.
 */
export function buscarTablasPunteros(data, { paso, minEntradas = 40, validar, alineacion = 4 }) {
  const halladas = [];
  for (let o = 0; o + paso <= data.length; o += alineacion) {
    if (o % alineacion !== 0) continue;
    const entradas = [];
    let n = 0;
    while (o + n * paso + paso <= data.length) {
      const ptr = data.readUInt32LE(o + n * paso);
      if (!punteroValido(data, ptr)) break;
      const extra = validar(data, offsetDe(data, ptr), o + n * paso, n);
      if (!extra) break;
      entradas.push({ ptr, offset: ptr - BASE_ROM, ...extra });
      n++;
      if (n > 1200) break;
    }
    if (n >= minEntradas) {
      halladas.push({ base: o, n, entradas });
      o += n * paso - 1;
    }
  }
  return halladas;
}

/* ───────────────────────────────── texto ────────────────────────────────── */

const MAPA_GEN3 = (() => {
  const m = new Map();
  m.set(0x00, ' ');
  '0123456789'.split('').forEach((c, i) => m.set(0xa1 + i, c));
  m.set(0xab, '!'); m.set(0xac, '?'); m.set(0xad, '.'); m.set(0xae, '-');
  m.set(0xaf, '·'); m.set(0xb0, '…'); m.set(0xb1, '“'); m.set(0xb2, '”');
  m.set(0xb3, '‘'); m.set(0xb4, '’'); m.set(0xb5, '♂'); m.set(0xb6, '♀');
  m.set(0xb7, '$'); m.set(0xb8, ','); m.set(0xb9, '×'); m.set(0xba, '/');
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach((c, i) => m.set(0xbb + i, c));
  'abcdefghijklmnopqrstuvwxyz'.split('').forEach((c, i) => m.set(0xd5 + i, c));
  m.set(0xf0, ':'); m.set(0xf1, 'ä'); m.set(0xf2, 'ö'); m.set(0xf3, 'ü');
  m.set(0xfe, '\n');
  return m;
})();

/** Decodifica texto Gen 3 hasta el terminador 0xFF. */
export function decodificarTextoGBA(bytes, { terminador = 0xff } = {}) {
  let texto = '';
  let consumido = 0;
  for (const b of bytes) {
    consumido++;
    if (b === terminador) return { texto, consumido };
    if (b >= 0xfa && b <= 0xfd) { texto += `{CTRL-${b.toString(16).toUpperCase()}}`; continue; }
    const c = MAPA_GEN3.get(b);
    texto += c !== undefined ? c : (b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : `·`);
  }
  return { texto, consumido, sinTerminar: true };
}

/** ¿Es una cadena plausible dentro de una ROM de Gen 3? */
export function esTextoPlausible(data, offset, minLargo = 3, maxLargo = 200) {
  let letras = 0;
  let n = 0;
  for (let i = 0; i < maxLargo; i++) {
    const b = data[offset + i];
    if (b === undefined) return null;
    if (b === 0xff) break;
    const esLetra = (b >= 0xbb && b <= 0xee) || (b >= 0x41 && b <= 0x7a) || (b >= 0xa1 && b <= 0xaa);
    const permitido = b === 0x00 || b === 0xfe || (b >= 0x20 && b <= 0x7e) || (b >= 0x80 && b <= 0xfa);
    if (!permitido) return null;
    if (esLetra) letras++;
    n++;
  }
  if (n < minLargo || letras < Math.max(1, Math.ceil(n * 0.45))) return null;
  return { largo: n };
}

/* ────────────────────────── tablas de nombres ───────────────────────────── */

const esLetraGBA = (b) => (b >= 0xbb && b <= 0xee) || (b >= 0x41 && b <= 0x7a);
// Los hacks en español meten acentuados y códigos de control en huecos bajos,
// así que se acepta cualquier byte salvo el 0 (relleno) y el terminador.
const permitidoNombre = (b) => b !== 0x00 && b !== 0xff;

/**
 * Localiza la tabla de nombres de especie (entradas de 11 bytes terminadas en
 * 0xFF). Tolerante con los hacks en español, que reasignan caracteres acentuados
 * a huecos del mapa original.
 */
/**
 * Valida una entrada de 11 bytes: el nombre ocupa los primeros bytes hasta el
 * terminador 0xFF y el resto va relleno con 0x00 (los nombres de menos de diez
 * letras llevan el terminador antes del final, así que no vale exigir 0xFF en
 * la posición 10).
 */
function entradaNombreValida(e) {
  let fin = -1;
  for (let k = 0; k < 11; k++) { if (e[k] === 0xff) { fin = k; break; } }
  if (fin < 1) return null;
  for (let k = fin + 1; k < 11; k++) if (e[k] !== 0x00) return null;
  let letras = 0;
  for (let k = 0; k < fin; k++) {
    if (!permitidoNombre(e[k])) return null;
    if (esLetraGBA(e[k])) letras++;
  }
  if (letras < 1) return null;
  return { largo: fin };
}

export function buscarTablaNombres(data, minEntradas = 60) {
  const candidatos = [];
  for (let o = 0; o + 11 <= data.length; o++) {
    if (!entradaNombreValida(data.subarray(o, o + 11))) continue;
    let n = 0;
    while (o + n * 11 + 11 <= data.length) {
      const e = data.subarray(o + n * 11, o + n * 11 + 11);
      if (!entradaNombreValida(e)) break;
      n++;
      if (n > 1200) break;
    }
    if (n >= minEntradas) {
      candidatos.push({ base: o, n });
      o += n * 11 - 1;
    }
  }
  candidatos.sort((a, b) => b.n - a.n);
  if (!candidatos.length) return null;
  const mejor = candidatos[0];
  const nombres = [];
  for (let i = 0; i < mejor.n; i++) {
    const e = data.subarray(mejor.base + i * 11, mejor.base + i * 11 + 11);
    const { texto } = decodificarTextoGBA(e);
    nombres.push({
      indice: i,
      nombre: texto.replace(/[^A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ'’\-]/g, '').trim() || `SIN_NOMBRE_${i}`,
      crudo: Buffer.from(e).toString('hex'),
      offset: mejor.base + i * 11,
    });
  }
  return { base: mejor.base, nombres, candidatos: candidatos.slice(0, 8) };
}

/**
 * Tablas de cadenas (paso 4): nombres de objetos, movimientos, habilidades,
 * tipos, clases de entrenador, nombres de mapa…
 */
export function buscarTablasTexto(data, { minEntradas = 20, minLargo = 2 } = {}) {
  return buscarTablasPunteros(data, {
    paso: 4,
    minEntradas,
    validar: (d, off) => esTextoPlausible(d, off, minLargo),
  }).map((t) => ({
    base: t.base,
    n: t.n,
    textos: t.entradas.map((e, i) => {
      const { texto } = decodificarTextoGBA(data.subarray(e.offset, e.offset + 200));
      return { indice: i, texto, offset: e.offset };
    }),
  }));
}

/* ─────────────────────── datos de especies y combate ────────────────────── */

/** Estadísticas base de Gen 3: 28 bytes por especie. */
export function buscarEstadisticasBase(data, nEspecies) {
  const halladas = [];
  for (let o = 0; o + 28 <= data.length; o++) {
    const e = data.subarray(o, o + 28);
    let valida = true;
    for (let k = 0; k < 6; k++) if (e[k] > 255 || e[k] === 0) { valida = false; break; }
    if (!valida) continue;
    if (e[6] > 17 || e[7] > 17) continue;
    if (e[20] > 7 || e[21] > 15 || e[22] > 15) continue;
    if (e[23] > 100 || e[24] > 100) continue;
    if (e[3] === 0 && e[4] === 0) continue;
    let n = 0;
    while (o + n * 28 + 28 <= data.length) {
      const x = data.subarray(o + n * 28, o + n * 28 + 28);
      if (x[6] > 17 || x[7] > 17 || x[20] > 7 || x[21] > 15 || x[22] > 15) break;
      if (x[23] > 100 || x[24] > 100) break;
      let ok = true;
      for (let k = 0; k < 6; k++) if (x[k] > 255) { ok = false; break; }
      if (!ok) break;
      n++;
      if (n > 1200) break;
    }
    if (n >= Math.min(nEspecies, 40)) {
      halladas.push({ base: o, n });
      o += n * 28 - 1;
    }
  }
  halladas.sort((a, b) => b.n - a.n);
  return halladas;
}

export function interpretarEstadisticas(data, base, n) {
  const lista = [];
  for (let i = 0; i < n; i++) {
    const o = base + i * 28;
    const e = data.subarray(o, o + 28);
    lista.push({
      indice: i,
      hp: e[0], ataque: e[1], defensa: e[2], velocidad: e[3], ataqueEspecial: e[4], defensaEspecial: e[5],
      tipo1: e[6], tipo2: e[7],
      tasaCaptura: e[8],
      expBase: e[9] | (e[10] << 8),
      evs: e[11] | (e[12] << 8),
      objeto1: e[13] | (e[14] << 8),
      objeto2: e[15] | (e[16] << 8),
      ratioGenero: e[17], ciclosHuevo: e[18], amistad: e[19],
      crecimiento: e[20], grupoHuevo1: e[21], grupoHuevo2: e[22],
      habilidad1: e[23], habilidad2: e[24], huidaSafari: e[25], color: e[26],
      offset: o,
    });
  }
  return lista;
}

/** Evoluciones de Gen 3: 5 entradas de 8 bytes por especie (40 bytes). */
export function buscarEvoluciones(data, nEspecies) {
  const halladas = [];
  for (let o = 0; o + 40 <= data.length; o += 4) {
    let n = 0;
    while (o + n * 40 + 40 <= data.length) {
      let ok = true;
      for (let k = 0; k < 5; k++) {
        const e = o + n * 40 + k * 8;
        const metodo = data[e] | (data[e + 1] << 8);
        const destino = data[e + 4] | (data[e + 5] << 8);
        if (metodo > 0x30 || destino > nEspecies * 2) { ok = false; break; }
      }
      if (!ok) break;
      n++;
      if (n > 1200) break;
    }
    if (n >= Math.min(nEspecies, 40)) {
      halladas.push({ base: o, n });
      o += n * 40 - 1;
    }
  }
  halladas.sort((a, b) => b.n - a.n);
  return halladas;
}

export function interpretarEvoluciones(data, base, n) {
  const lista = [];
  for (let i = 0; i < n; i++) {
    const ramas = [];
    for (let k = 0; k < 5; k++) {
      const e = base + i * 40 + k * 8;
      const metodo = data[e] | (data[e + 1] << 8);
      const parametro = data[e + 2] | (data[e + 3] << 8);
      const destino = data[e + 4] | (data[e + 5] << 8);
      if (metodo === 0 && destino === 0) continue;
      ramas.push({ metodo, parametro, destino });
    }
    lista.push({ indice: i, ramas });
  }
  return lista;
}

/** Aprendizaje por nivel: punteros a listas de u16 (movimiento, nivel) terminadas en 0xFFFF. */
export function buscarAprendizaje(data, nEspecies) {
  const validar = (d, off) => {
    let n = 0;
    while (off + n * 2 + 2 <= d.length) {
      const v = d[off + n * 2] | (d[off + n * 2 + 1] << 8);
      if (v === 0xffff) return n > 0 ? { pares: n } : null;
      const movimiento = v & 0x1ff;
      const nivel = v >> 9;
      if (movimiento === 0 || movimiento > 600 || nivel > 100) return null;
      n++;
      if (n > 60) return null;
    }
    return null;
  };
  return buscarTablasPunteros(data, { paso: 4, minEntradas: Math.min(nEspecies, 40), validar });
}

export function interpretarAprendizaje(data, tabla) {
  return tabla.entradas.map((e, i) => {
    const pares = [];
    for (let k = 0; k < 60; k++) {
      const v = data[e.offset + k * 2] | (data[e.offset + k * 2 + 1] << 8);
      if (v === 0xffff) break;
      pares.push({ movimiento: v & 0x1ff, nivel: v >> 9 });
    }
    return { indice: i, offset: e.offset, pares };
  });
}

/* ──────────────────────────── sprites de especie ───────────────────────── */

/** Tablas {puntero, tamaño} cuyo destino es un bloque LZ77 del tamaño indicado. */
export function buscarTablaSprites(data, tamEsperado, minEntradas = 40) {
  return buscarTablasPunteros(data, {
    paso: 8,
    minEntradas,
    validar: (d, off) => {
      if (d[off] !== 0x10) return null;
      const tam = d[off + 1] | (d[off + 2] << 8) | (d[off + 3] << 16);
      if (tamEsperado && tam !== tamEsperado) return null;
      if (!lz77(d, off)) return null;
      return { tam };
    },
  });
}

/** Tablas de paletas: punteros espaciados 32 bytes a bloques BGR555 válidos. */
export function buscarTablaPaletas(data, minEntradas = 40) {
  return buscarTablasPunteros(data, {
    paso: 8,
    minEntradas,
    validar: (d, off) => (parecePaleta(d, off, 16) ? { colores: 16 } : null),
  });
}

/** Tabla de iconos: punteros a bloques LZ77 de 0x400 bytes (32×64 en 4 bpp). */
export function buscarTablaIconos(data, minEntradas = 40) {
  return buscarTablasPunteros(data, {
    paso: 4,
    minEntradas,
    validar: (d, off) => {
      if (d[off] !== 0x10) return null;
      const tam = d[off + 1] | (d[off + 2] << 8) | (d[off + 3] << 16);
      if (tam !== 0x400 && tam !== 0x200) return null;
      if (!lz77(d, off)) return null;
      return { tam };
    },
  });
}

/** Paletas de iconos: tabla de u16 (índice a la paleta real). */
export function buscarPaletasIcono(data, minEntradas = 40) {
  const halladas = [];
  for (let o = 0; o + 2 <= data.length; o += 2) {
    let n = 0;
    while (o + n * 2 + 2 <= data.length) {
      const v = data[o + n * 2] | (data[o + n * 2 + 1] << 8);
      if (v > 0x60) break;
      n++;
      if (n > 600) break;
    }
    if (n >= minEntradas) {
      halladas.push({ base: o, n });
      o += n * 2 - 1;
    }
  }
  halladas.sort((a, b) => b.n - a.n);
  return halladas;
}

/* ─────────────────────────────── cabecera ──────────────────────────────── */

export function leerCabeceraGBA(data) {
  const titulo = data.subarray(0xa0, 0xac).toString('latin1').replace(/[^ -~]/g, '');
  const codigo = data.subarray(0xac, 0xb0).toString('latin1').replace(/[^ -~]/g, '');
  const fabricante = data.subarray(0xb0, 0xb2).toString('latin1').replace(/[^ -~]/g, '');
  return {
    plataforma: 'GBA',
    titulo,
    codigo,
    fabricante,
    unidadFija: data[0xb2],
    version: data[0xbc],
    checksumCabecera: data[0xbd],
    tam: data.length,
  };
}

/* ────────────────────── textos sueltos (diálogos) ──────────────────────── */

const esByteDeTexto = (b) => b === 0x00 || b === 0xfe || (b >= 0x20 && b <= 0x7e) || (b >= 0x80 && b <= 0xfa);

/** Barrido de cadenas terminadas en 0xFF dentro de la ROM. */
export function buscarCadenasGBA(data, minLargo = 12) {
  const cadenas = [];
  let inicio = -1;
  let letras = 0;
  let espacios = 0;
  for (let o = 0; o < data.length; o++) {
    const b = data[o];
    if (esByteDeTexto(b)) {
      if (inicio < 0) { inicio = o; letras = 0; espacios = 0; }
      if (b >= 0xbb && b <= 0xee) letras++;
      else if (b === 0x00) espacios++;
      continue;
    }
    if (b === 0xff && inicio >= 0) {
      const largo = o - inicio;
      // el texto real tiene muchas letras y espacios repartidos; el código y los
      // datos binarios no, así que ambos umbrales hacen de filtro.
      if (largo >= minLargo && letras >= Math.ceil(largo * 0.55) && espacios >= Math.ceil(largo * 0.08)) {
        const { texto } = decodificarTextoGBA(data.subarray(inicio, o));
        cadenas.push({ offset: inicio, largo, texto });
      }
      inicio = -1;
      continue;
    }
    inicio = -1;
  }
  return cadenas;
}
