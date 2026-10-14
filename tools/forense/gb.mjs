/**
 * Primitivas forenses para ROMs de Game Boy / Game Boy Color (Gen 1 y hacks).
 *
 * El descompresor de sprites está implementado a partir del desensamblado de
 * pret/pokered (home/uncompress.asm): lector de bits MSB-primero, RLE de ceros
 * con codificación por longitudes (2^n - 1), dos planos de 1 bpp, modos de
 * desempaquetado 0/1/2 y decodificación diferencial por nybbles.
 */

/* ─────────────────────────────── cabecera ──────────────────────────────── */

export function leerCabeceraGB(data) {
  const tituloBytes = data.subarray(0x134, 0x144);
  let titulo = '';
  for (const b of tituloBytes) {
    if (b === 0) break;
    if (b >= 0x20 && b <= 0x7e) titulo += String.fromCharCode(b);
  }
  return {
    plataforma: (data[0x143] & 0x80) ? 'GBC' : 'GB',
    titulo: titulo.trim(),
    cgb: data[0x143],
    codigoNuevoTitular: tituloBytes.toString('latin1').slice(11, 15),
    tipoCartucho: data[0x147],
    tamRom: 32 * 1024 * (1 << data[0x148]),
    tamRam: data[0x149],
    checksum: (data[0x14e] << 8) | data[0x14f],
    tam: data.length,
  };
}

/* ───────────────────────────── lector de bits ──────────────────────────── */

class LectorBits {
  constructor(data, offset) {
    this.data = data;
    this.p = offset;
    this.contador = 1;
    this.actual = 0;
    this.agotado = false;
  }
  byte() {
    if (this.p >= this.data.length) { this.agotado = true; return 0; }
    return this.data[this.p++];
  }
  bit() {
    this.contador--;
    if (this.contador === 0) {
      this.actual = this.byte();
      this.contador = 8;
    }
    // rlca: primero rota (el bit 7 pasa al bit 0) y después se lee el bit 0.
    this.actual = ((this.actual << 1) | (this.actual >> 7)) & 0xff;
    return this.actual & 1;
  }
}

/* ───────────── decodificación diferencial por nybbles ──────────────────── */

function decodificarNybble(n, semilla, invertido) {
  let v = semilla;
  let salida = 0;
  for (let i = 0; i < 4; i++) {
    v ^= (n >> (3 - i)) & 1;
    salida = invertido ? (salida | (v << i)) : ((salida << 1) | v);
  }
  return salida & 0xf;
}

/** Aplica la decodificación diferencial a un plano (se recorre por filas). */
function decodificacionDiferencial(buffer, ancho, alto, invertido) {
  const columnas = ancho / 8;
  for (let y = 0; y < alto; y++) {
    let e = 0; // último nybble decodificado; se reinicia en cada fila
    for (let c = 0; c < columnas; c++) {
      const dir = c * alto + y;
      const byte = buffer[dir];
      const alto_ = decodificarNybble((byte >> 4) & 0xf, invertido ? ((e >> 3) & 1) : (e & 1), invertido);
      e = alto_;
      const bajo = decodificarNybble(byte & 0xf, invertido ? ((e >> 3) & 1) : (e & 1), invertido);
      e = bajo;
      buffer[dir] = ((alto_ << 4) | bajo) & 0xff;
    }
  }
}

const LISTA_DESPLAZAMIENTOS = [1, 3, 7, 15, 31, 63, 127, 255, 511, 1023, 2047, 4095, 8191, 16383, 32767, 65535];

/* ─────────────────────────── descompresor Gen 1 ────────────────────────── */

/** Descomprime uno de los dos planos; devuelve false si el flujo es inválido. */
function descomprimirPlano(lector, buffer, ancho, alto, variante = 'bandera') {
  const tamBuffer = buffer.length;
  let base = 0;
  let indice = 0;
  let desplazamientoBits = 3;
  let y = 0;
  let x = 0;
  let escritos = 0;

  const avanzar = () => {
    y++;
    if (y === alto) {
      y = 0;
      if (desplazamientoBits === 0) {
        // Banda de 8 píxeles terminada: el puntero quedó en base+alto-1 y el
        // `inc hl` del ensamblador lo deja en la siguiente banda (base+alto).
        x += 8;
        if (x === ancho) return 'fin';
        desplazamientoBits = 3;
        base += alto;
        indice = base;
      } else {
        desplazamientoBits--;
        indice = base;
      }
    } else {
      indice++;
    }
    return null;
  };

  const escribir = (valor) => {
    if (indice >= tamBuffer) throw new Error('buffer');
    buffer[indice] |= (valor & 3) << (desplazamientoBits * 2);
    escritos++;
  };

  const ceros = () => {
    let c = 0;
    for (;;) {
      if (lector.bit() === 0) break;
      c++;
      if (c > 16) throw new Error('longitud');
    }
    let cuenta = 0;
    for (let i = 0; i <= c; i++) cuenta = ((cuenta << 1) | lector.bit()) >>> 0;
    cuenta += LISTA_DESPLAZAMIENTOS[Math.min(c, 15)];
    if (cuenta === 0 || cuenta > alto * ancho) throw new Error('cuenta');
    while (cuenta > 0) {
      escribir(0);
      if (avanzar() === 'fin') return 'fin';
      cuenta--;
    }
    return null;
  };

  try {
    if (variante === 'bandera') {
      // El primer bit del plano indica si arranca con una tanda de ceros.
      if (lector.bit() === 0 && ceros() === 'fin') return false;
    } else {
      const primero = lector.bit();
      if (primero === 1) {
        const valor = 2 | lector.bit();
        escribir(valor);
        if (avanzar() === 'fin') return escritos > 0;
      } else if (ceros() === 'fin') return false;
    }
    for (;;) {
      const valor = (lector.bit() << 1) | lector.bit();
      if (valor === 0) {
        if (ceros() === 'fin') return escritos > 0;
      } else {
        escribir(valor);
        if (avanzar() === 'fin') return escritos > 0;
      }
    }
  } catch {
    return false;
  }
}

/**
 * Descomprime un sprite de Gen 1 (dos planos de 1 bpp) y devuelve la imagen
 * indexada final (0 = transparente, 1..3 = tonos) junto con el tamaño consumido.
 */
export function descomprimirSprite(data, offset, { invertido = false, variante = 'bandera' } = {}) {
  const lector = new LectorBits(data, offset);
  const byteTamano = lector.byte();
  const ancho = ((byteTamano >> 4) & 0xf) * 8;
  const alto = (byteTamano & 0xf) * 8;
  if (ancho === 0 || alto === 0 || ancho > 64 || alto > 64) return null;

  const tamBuffer = (ancho / 8) * alto;
  const b1 = new Uint8Array(tamBuffer);
  const b2 = new Uint8Array(tamBuffer);
  let bit0 = lector.bit();
  let bit1 = false;
  let modo = 0;

  for (let vuelta = 0; vuelta < 2; vuelta++) {
    const buffer = bit0 ? b2 : b1;
    if (bit1) {
      const m = lector.bit();
      modo = m === 0 ? 0 : (lector.bit() ? 2 : 1);
    }
    if (!descomprimirPlano(lector, buffer, ancho, alto, variante)) return null;
    if (!bit1) { bit0 ^= 1; bit1 = true; }
  }

  const fuente = bit0 ? b1 : b2;   // primer plano cargado
  const destino = bit0 ? b2 : b1;  // segundo plano cargado

  if (modo === 0) {
    decodificacionDiferencial(b1, ancho, alto, invertido);
    decodificacionDiferencial(b2, ancho, alto, invertido);
  } else if (modo === 1) {
    decodificacionDiferencial(fuente, ancho, alto, invertido);
    for (let i = 0; i < tamBuffer; i++) destino[i] ^= fuente[i];
  } else {
    decodificacionDiferencial(destino, ancho, alto, false);
    decodificacionDiferencial(fuente, ancho, alto, invertido);
    for (let i = 0; i < tamBuffer; i++) destino[i] ^= fuente[i];
  }

  // Composición: b1 = bit bajo del índice, b2 = bit alto.
  const px = new Uint8Array(ancho * alto);
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const dir = (x >> 3) * alto + y;
      const bit = 7 - (x & 7);
      const bajo = (b1[dir] >> bit) & 1;
      const alto_ = (b2[dir] >> bit) & 1;
      px[y * ancho + x] = bajo | (alto_ << 1);
    }
  }
  return { ancho, alto, px, modo, consumido: lector.p - offset, tamBuffer };
}

/* ─────────────────────────────── texto Gen 1 ───────────────────────────── */

const LETRAS_GB = [];
for (let i = 0; i < 26; i++) LETRAS_GB[0x80 + i] = String.fromCharCode(65 + i);
for (let i = 0; i < 26; i++) LETRAS_GB[0xa0 + i] = String.fromCharCode(97 + i);
LETRAS_GB[0x7f] = ' ';
LETRAS_GB[0xe8] = '.';

const CONTROLES_GB = {
  0x4a: '<PKMN>', 0x4b: '<TARGET>', 0x4c: '<USER>', 0x4d: '<PLAYER>',
  0x4e: '<NEXT>', 0x4f: '<LINE>', 0x50: '<PAGE>', 0x51: '<PARA>',
  0x52: '<PLAYERNAME>', 0x53: '<RIVAL>', 0x54: '<POKE>', 0x55: '<CONT>',
  0x57: '<DONE>', 0x58: '<PROMPT>',
};

export function decodificarTextoGB(bytes) {
  let texto = '';
  for (const b of bytes) {
    if (b === 0x50 || b === 0x00) break;
    if (CONTROLES_GB[b]) { texto += CONTROLES_GB[b]; continue; }
    const c = LETRAS_GB[b];
    if (c) { texto += c; continue; }
    if (b >= 0xf6 && b <= 0xff) { texto += String.fromCharCode(48 + (b - 0xf6)); continue; }
    if (b >= 0xba && b <= 0xe7) { texto += '?'; continue; }
    texto += '·';
  }
  return texto;
}

/** Nombres de especie de Gen 1: 10 bytes terminados/rellenados con 0x50. */
export function buscarTablaNombresGB(data, minEntradas = 40) {
  const esLetra = (b) => b >= 0x80 && b <= 0xb9;
  const candidatos = [];
  for (let o = 0; o + 11 <= data.length; o++) {
    let n = 0;
    for (;;) {
      const e = data.subarray(o + n * 10, o + n * 10 + 10);
      if (e.length < 10) break;
      let letras = 0;
      let valido = true;
      let terminado = false;
      for (let k = 0; k < 10; k++) {
        if (e[k] === 0x50 || e[k] === 0x00) { terminado = true; continue; }
        if (terminado && esLetra(e[k])) { valido = false; break; }
        if (!esLetra(e[k]) && e[k] !== 0x7f && !(e[k] >= 0xf6 && e[k] <= 0xff) && e[k] !== 0x2d) { valido = false; break; }
        if (esLetra(e[k])) letras++;
      }
      if (!valido || letras < 3) break;
      n++;
      if (n > 400) break;
    }
    if (n >= minEntradas) {
      candidatos.push({ base: o, n });
      o += n * 10 - 1;
    }
  }
  candidatos.sort((a, b) => b.n - a.n);
  if (!candidatos.length) return null;
  const mejor = candidatos[0];
  const nombres = [];
  for (let i = 0; i < mejor.n; i++) {
    const e = data.subarray(mejor.base + i * 10, mejor.base + i * 10 + 10);
    nombres.push({
      indice: i,
      nombre: decodificarTextoGB(e).trim() || `SIN_NOMBRE_${i}`,
      crudo: Buffer.from(e).toString('hex'),
      offset: mejor.base + i * 10,
    });
  }
  return { base: mejor.base, nombres, candidatos: candidatos.slice(0, 6) };
}

/** Tablas de punteros de 3 bytes (banco, dirección). */
export function buscarTablaPunterosGB(data, minEntradas = 20, validar = null) {
  const halladas = [];
  for (let o = 0; o + 3 <= data.length; o++) {
    const entradas = [];
    let n = 0;
    for (;;) {
      const banco = data[o + n * 3];
      const dir = data[o + n * 3 + 1] | (data[o + n * 3 + 2] << 8);
      if (banco === 0 || dir < 0x4000) break;
      let offset = banco * 0x4000 + (dir - 0x4000);
      if (offset >= data.length) {
        offset = dir;
        if (offset >= data.length) break;
      }
      if (validar && !validar(data, offset)) break;
      entradas.push({ banco, dir, offset });
      n++;
      if (n > 400) break;
    }
    if (n >= minEntradas) {
      halladas.push({ base: o, n, entradas });
      o += n * 3 - 1;
    }
  }
  halladas.sort((a, b) => b.n - a.n);
  return halladas;
}

/** Barrido de cadenas de texto en el mapa de caracteres de Gen 1. */
export function buscarCadenasGB(data, minLargo = 8) {
  const cadenas = [];
  let inicio = -1;
  for (let o = 0; o < data.length; o++) {
    const b = data[o];
    const valido = (b >= 0x80 && b <= 0xb9) || b === 0x7f || b === 0x50 || b === 0x4f
      || (b >= 0x4a && b <= 0x58) || b === 0xe8 || (b >= 0xf6 && b <= 0xff);
    if (valido) {
      if (inicio < 0) inicio = o;
    } else {
      if (inicio >= 0 && o - inicio >= minLargo) {
        const trozo = data.subarray(inicio, o);
        let letras = 0;
        for (const x of trozo) if ((x >= 0x80 && x <= 0xb9) || x === 0x7f) letras++;
        if (letras >= Math.ceil((o - inicio) * 0.6)) {
          cadenas.push({ offset: inicio, largo: o - inicio, texto: decodificarTextoGB(trozo) });
        }
      }
      inicio = -1;
    }
  }
  return cadenas;
}
