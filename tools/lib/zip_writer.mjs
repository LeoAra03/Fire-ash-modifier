#!/usr/bin/env node
/**
 * Escritor de ZIP determinista (solo stdlib) para el paquete directo.
 *
 * `zip` de Info-ZIP no está disponible en todos los entornos (CI, Android,
 * Windows) y su salida cambia entre ejecuciones. Este módulo escribe el
 * archivo a mano para que el ZIP del repositorio sea reproducible: mismas
 * entradas, mismo orden, misma marca de tiempo y mismos bytes.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  return table;
})();

export function crc32(buffer) {
  let crc = -1;
  for (let i = 0; i < buffer.length; i++) crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

/** Convierte una fecha JS al formato de fecha/hora MS-DOS que usa el ZIP. */
function dosDateTime(date) {
  const year = Math.max(1980, date.getUTCFullYear());
  return {
    time: (date.getUTCHours() << 11) | (date.getUTCMinutes() << 5) | (date.getUTCSeconds() >> 1),
    date: ((year - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate(),
  };
}

/**
 * Lista recursivamente los archivos de una carpeta.
 * Devuelve rutas relativas con `/`, ordenadas, sin carpetas intermedias.
 */
export function listFiles(root, base = "") {
  const entries = [];
  for (const name of fs.readdirSync(path.join(root, base)).sort()) {
    const relative = base ? `${base}/${name}` : name;
    const stat = fs.statSync(path.join(root, relative));
    if (stat.isDirectory()) entries.push(...listFiles(root, relative));
    else if (stat.isFile()) entries.push(relative);
  }
  return entries;
}

/** Carpetas implícitas de una lista de archivos, en orden. */
function parentDirectories(files) {
  const dirs = new Set();
  for (const file of files) {
    const parts = file.split("/");
    parts.pop();
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      dirs.add(`${current}/`);
    }
  }
  return [...dirs].sort();
}

const STORED_EXTENSIONS = new Set([".png", ".ogg", ".jpg", ".jpeg", ".zip", ".rxdata", ".dat"]);

/**
 * Crea un ZIP en `destination` a partir de `root`.
 *
 * @param {object} options
 * @param {string} options.root       Carpeta cuyo contenido se empaqueta (sin carpeta raíz).
 * @param {string} options.destination Archivo .zip de salida.
 * @param {string[]} [options.extraFiles]  Pares `ruta relativa` → `Buffer`/`string` a añadir.
 * @param {Date}   [options.timestamp] Marca de tiempo fija para todas las entradas.
 * @returns {{ entries: string[], size: number }}
 */
export function writeZip({ root, destination, extraFiles = {}, timestamp = new Date(Date.UTC(2024, 0, 1)) }) {
  const files = listFiles(root);
  const byName = new Map();
  for (const name of files) byName.set(name, fs.readFileSync(path.join(root, name)));
  for (const [name, content] of Object.entries(extraFiles)) {
    byName.set(name, Buffer.isBuffer(content) ? content : Buffer.from(content, "utf8"));
  }
  return writeZipEntries({ entries: [...byName].map(([name, content]) => ({ name, content })), destination, timestamp });
}

/**
 * Escribe un ZIP a partir de una lista explícita de entradas (nombre + bytes),
 * aplicando las mismas convenciones deterministas: carpetas implícitas primero,
 * archivos ordenados, marca de tiempo fija y sin comprimir los formatos ya
 * comprimidos. Se usa para reconstruir archivos existentes preservando su orden
 * y, si se indica, el método de compresión original de cada entrada
 * (`method`: 0 = sin comprimir, 8 = deflate).
 *
 * @param {object} options
 * @param {{name: string, content: Buffer, method?: number}[]} options.entries
 * @param {string} options.destination
 * @param {Date}   [options.timestamp]
 * @returns {{ entries: string[], size: number }}
 */
export function writeZipEntries({ entries, destination, timestamp = new Date(Date.UTC(2024, 0, 1)) }) {
  const { time, date } = dosDateTime(timestamp);
  const records = [];
  const extras = [];

  const byName = new Map(entries.map((entry) => [entry.name, entry.content]));
  const forced = new Map(entries.filter((entry) => entry.method !== undefined).map((entry) => [entry.name, entry.method]));

  const chunks = [];
  let offset = 0;
  const central = [];
  const names = [...parentDirectories([...byName.keys()]), ...[...byName.keys()].sort()];

  for (const name of names) {
    const isDirectory = name.endsWith("/");
    const buffer = isDirectory ? Buffer.alloc(0) : byName.get(name);
    const preferido = forced.get(name);
    const store = isDirectory ||
      (preferido !== undefined ? preferido === 0 : buffer.length > 0 && STORED_EXTENSIONS.has(path.extname(name).toLowerCase()));
    const deflated = store ? buffer : zlib.deflateRawSync(buffer, { level: 9 });
    const payload = store ? buffer : deflated;
    const useStore = store;
    const nameBytes = Buffer.from(name, "utf8");
    const crc = crc32(buffer);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // nombres en UTF-8
    local.writeUInt16LE(useStore ? 0 : 8, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(payload.length, 18);
    local.writeUInt32LE(buffer.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    local.writeUInt16LE(0, 28);
    chunks.push(local, nameBytes, payload);

    central.push({ nameBytes, crc, compressed: payload.length, size: buffer.length, method: useStore ? 0 : 8, offset });
    offset += local.length + nameBytes.length + payload.length;
  }

  const directory = [];
  for (const entry of central) {
    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(20, 6);
    header.writeUInt16LE(0x0800, 8);
    header.writeUInt16LE(entry.method, 10);
    header.writeUInt16LE(time, 12);
    header.writeUInt16LE(date, 14);
    header.writeUInt32LE(entry.crc, 16);
    header.writeUInt32LE(entry.compressed, 20);
    header.writeUInt32LE(entry.size, 24);
    header.writeUInt16LE(entry.nameBytes.length, 28);
    header.writeUInt16LE(0, 30);
    header.writeUInt16LE(0, 32);
    header.writeUInt16LE(0, 34);
    header.writeUInt16LE(0, 36);
    header.writeUInt32LE(0, 38);
    header.writeUInt32LE(entry.offset, 42);
    directory.push(header, entry.nameBytes);
  }

  const directoryBuffer = Buffer.concat(directory);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(central.length, 8);
  end.writeUInt16LE(central.length, 10);
  end.writeUInt32LE(directoryBuffer.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  const archive = Buffer.concat([...chunks, directoryBuffer, end]);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, archive);
  return { entries: names.filter((name) => !name.endsWith("/")), size: archive.length };
}

/** Lee el índice de un ZIP: nombre → tamaño sin comprimir. */
export function readZipIndex(file) {
  const buffer = fs.readFileSync(file);
  let end = buffer.length - 22;
  while (end >= 0 && buffer.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0) throw new Error(`${file} no parece un ZIP válido`);
  const count = buffer.readUInt16LE(end + 10);
  let pointer = buffer.readUInt32LE(end + 16);
  const entries = new Map();
  for (let i = 0; i < count; i++) {
    if (buffer.readUInt32LE(pointer) !== 0x02014b50) throw new Error("Índice central del ZIP corrupto");
    const method = buffer.readUInt16LE(pointer + 10);
    const compressed = buffer.readUInt32LE(pointer + 20);
    const size = buffer.readUInt32LE(pointer + 24);
    const nameLength = buffer.readUInt16LE(pointer + 28);
    const extraLength = buffer.readUInt16LE(pointer + 30);
    const commentLength = buffer.readUInt16LE(pointer + 32);
    const localOffset = buffer.readUInt32LE(pointer + 42);
    const name = buffer.toString("utf8", pointer + 46, pointer + 46 + nameLength);
    pointer += 46 + nameLength + extraLength + commentLength;
    if (name.endsWith("/")) continue;
    entries.set(name, { size, compressed, method, localOffset });
  }
  return { buffer, entries };
}

/** Extrae el contenido de una entrada usando su cabecera local. */
export function readZipEntry(zip, name) {
  const record = zip.entries.get(name);
  if (!record) throw new Error(`El ZIP no contiene ${name}`);
  const header = record.localOffset;
  if (zip.buffer.readUInt32LE(header) !== 0x04034b50) throw new Error(`Cabecera local corrupta en ${name}`);
  const nameLength = zip.buffer.readUInt16LE(header + 26);
  const extraLength = zip.buffer.readUInt16LE(header + 28);
  const start = header + 30 + nameLength + extraLength;
  const raw = zip.buffer.subarray(start, start + record.compressed);
  return record.method === 0 ? Buffer.from(raw) : zlib.inflateRawSync(raw);
}
