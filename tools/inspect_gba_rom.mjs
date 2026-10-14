#!/usr/bin/env node
/**
 * Inventario de solo lectura de un ROM hack de GBA (Pokémon Gen 3).
 *
 * Los ROM invitados de referencia (Glazed, Light Platinum, Pokémon Team Rocket)
 * son ROMs de Game Boy Advance, no proyectos de RPG Maker XP: no se abren con
 * Pokémon Studio ni con el analizador de Essentials. Este analizador les saca
 * el esqueleto jugable directamente de la ROM:
 *
 *   · identificación: título interno, código de juego, ROM base y tamaño
 *   · tablas de nombres: especies, movimientos, objetos, habilidades
 *   · clases de entrenador
 *   · batallas: tabla de entrenadores con equipo, niveles, objetos y movimientos
 *   · inventario de recursos comprimidos (LZ77): sprites y demás gráficos
 *   · censo de texto: cuánto diálogo hay y dónde
 *
 * No copia sprites, música ni mapas al repositorio: sólo metadatos y texto,
 * que es lo que hace falta para reescribir las ideas con contenido original.
 *
 * Uso:
 *   node tools/inspect_gba_rom.mjs --rom reference/roms_invitadas/entrada/GlazedESPB6.gba
 *   node tools/inspect_gba_rom.mjs --dir reference/roms_invitadas/entrada   (todos los .gba/.gb)
 *
 * Salida (reference/roms_invitadas/<slug>/, ignorada por Git):
 *   gba_inventory.json · informe_gba.md · pbs/{pokemon,moves,items,abilities,trainers}.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_ROOT = () => (process.env.ROM_OUT_DIR ? path.resolve(process.env.ROM_OUT_DIR) : path.join(ROOT, "reference", "roms_invitadas"));

const arg = (name, fallback = null) => {
  const key = `--${name}`;
  const i = process.argv.indexOf(key);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : fallback;
};
const ROM = arg("rom");
const DIR = arg("dir");

// ---------------------------------------------------------------- charmap GBA
// Tabla estándar de la 3ª generación. Se valida buscando "BULBASAUR" en la ROM.
const CHAR = new Array(256).fill(null);
{
  const set = (byte, text) => (CHAR[byte] = text);
  set(0x00, " ");
  for (let i = 0; i < 26; i += 1) set(0xbb + i, String.fromCharCode(65 + i)); // A-Z
  for (let i = 0; i < 26; i += 1) set(0xd5 + i, String.fromCharCode(97 + i)); // a-z
  for (let i = 0; i < 10; i += 1) set(0xa1 + i, String(i)); // 0-9
  set(0xab, "!");
  set(0xac, "?");
  set(0xad, ".");
  set(0xae, "-");
  set(0xaf, "·");
  set(0xb8, ",");
  set(0xb9, "×");
  set(0xba, "/");
  set(0xb5, "♂");
  set(0xb6, "♀");
  set(0xb0, "…");
  set(0xf0, ":");
  set(0x2d, "+");
  set(0x2c, "&");
  set(0x2f, ";");
  set(0x51, "¿");
  set(0x52, "¡");
  set(0x53, "[PK]");
  set(0x54, "[MN]");
  set(0x71, "[>]");
  // Acentos y eñes de la tabla estándar de la 3ª generación.
  const acentos = {
    0x01: "À", 0x02: "Á", 0x03: "Â", 0x04: "Ç", 0x05: "È", 0x06: "É", 0x07: "Ê", 0x08: "Ë",
    0x09: "Ì", 0x0a: "Í", 0x0b: "Î", 0x0c: "Ï", 0x0d: "Ò", 0x0e: "Ó", 0x0f: "Ô", 0x10: "Œ",
    0x11: "Ù", 0x12: "Ú", 0x13: "Û", 0x14: "Ñ", 0x15: "ß", 0x16: "à", 0x17: "á", 0x18: "â",
    0x19: "ç", 0x1a: "è", 0x1b: "é", 0x1c: "ê", 0x1d: "ë", 0x1e: "ì", 0x1f: "í", 0x20: "î",
    0x21: "ï", 0x22: "ò", 0x23: "ó", 0x24: "ô", 0x25: "œ", 0x26: "ù", 0x27: "ú", 0x28: "û",
    0x29: "ñ", 0x2a: "º", 0x2b: "ª", 0x68: "â", 0x6f: "í",
  };
  for (const [byte, texto] of Object.entries(acentos)) set(Number(byte), texto);
  // Códigos de control de texto: se aceptan dentro de un nombre, pero no se imprimen.
  for (let b = 0xf7; b <= 0xfe; b += 1) set(b, "");
}
const decode = (data, offset, length) => {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    const b = data[offset + i];
    if (b === 0xff) break;
    const c = CHAR[b];
    out += c === null || c === undefined ? "" : c;
  }
  return out.trim();
};

// -------------------------------------------------------------- identificación
const BASES = {
  BPEE: "Esmeralda",
  BPRE: "Rojo Fuego",
  BPGE: "Verde Hoja",
  AXVE: "Rubí",
  AXPE: "Zafiro",
};

function identificar(data, file) {
  let title = "";
  let code = "";
  let maker = "";
  let rev = 0;
  if (data.length >= 0xc0) {
    title = Buffer.from(data.subarray(0xa0, 0xac)).toString("latin1").replace(/\0/g, "").trim();
    code = Buffer.from(data.subarray(0xac, 0xb0)).toString("latin1");
    maker = Buffer.from(data.subarray(0xb0, 0xb2)).toString("latin1");
    rev = data[0xbc] ?? 0;
  }
  return {
    archivo: path.basename(file),
    tamaño: data.length,
    tituloInterno: title,
    codigo: code,
    maker,
    revision: rev,
    romBase: BASES[code] || (code ? `desconocida (${code})` : "¿GB/GBC?"),
  };
}

// ------------------------------------------------------ descubrimiento de tablas
/** ¿Es una entrada de nombre plausible? Termina en 0xFF y se decodifica. */
function entradaValida(data, off, stride) {
  if (off < 0 || off + stride > data.length) return false;
  let letras = 0;
  let terminado = false;
  for (let i = 0; i < stride; i += 1) {
    const b = data[off + i];
    if (terminado) {
      // Tras el terminador sólo hay relleno: ceros… y a veces más 0xFF.
      if (b !== 0x00 && b !== 0xff) return false;
      continue;
    }
    if (b === 0xff) {
      terminado = true;
      continue;
    }
    if (b === 0x00) continue; // espacio
    if (CHAR[b] === null || CHAR[b] === undefined) return false;
    letras += 1;
  }
  return terminado && letras > 0;
}

// Codificador inverso para buscar nombres conocidos dentro de la ROM.
const BYTE = new Map();
for (let b = 0; b < 256; b += 1) if (CHAR[b]) BYTE.set(CHAR[b], b);
const codificar = (texto) => {
  const out = [];
  for (const ch of texto.toUpperCase()) {
    const b = BYTE.get(ch) ?? BYTE.get(ch.toLowerCase());
    if (b === undefined || b === 0) return null;
    out.push(b);
  }
  return Buffer.from(out);
};

// Nombres que anclan cada tabla. Se prueban en español y en inglés porque los
// hacks están traducidos y las tablas se repunterizan al insertar contenido.
const ANCLAS = {
  especies: ["BULBASAUR"],
  movimientos: ["PLACAJE", "TACKLE", "DESTRUCTOR", "GOLPE CUERPO", "LATIGO"],
  objetos: ["POKEBALL", "POCION", "POKéBALL", "BICICLETA", "BASTON"],
  habilidades: ["STENCH", "HEDOR", "DRIZZLE", "LLOVIZNA", "INTIMIDATE"],
  clases_entrenador: ["ENTRENADOR", "RANGER", "AQUA", "CAMPER", "ALPINISTA"],
};

function buscarTablas(data) {
  const runs = [];
  for (const stride of [10, 11, 12, 13, 14, 16]) {
    let i = 0;
    while (i + stride <= data.length) {
      const first = data[i];
      if ((first !== 0xff && first !== 0x00 && CHAR[first] != null) && entradaValida(data, i, stride)) {
        let start = i;
        while (entradaValida(data, start - stride, stride)) start -= stride;
        let end = i;
        while (entradaValida(data, end + stride, stride)) end += stride;
        runs.push({ inicio: start, fin: end, stride, count: Math.floor((end - start) / stride) + 1, huecos: 0 });
        i = end + stride;
      } else {
        i += 1;
      }
    }
  }
  for (const r of runs) {
    r.nombres = [];
    for (let k = 0; k < r.count; k += 1) r.nombres.push(decode(data, r.inicio + k * r.stride, r.stride));
    r.muestra = r.nombres.slice(0, 5);
  }
  runs.sort((a, b) => b.count - a.count);

  // Selección por ancla: la tabla es la serie que contiene ese nombre exacto.
  const porTipo = {};
  for (const [tipo, anclas] of Object.entries(ANCLAS)) {
    for (const ancla of anclas) {
      const buscado = ancla.toUpperCase();
      const hit = runs.find((r) => r.nombres.some((n) => n.toUpperCase() === buscado));
      if (hit) {
        porTipo[tipo] = hit;
        porTipo[tipo].ancla = ancla;
        break;
      }
    }
  }
  // Fragmentos: series del mismo ancho cerca de la tabla principal (los hacks
  // suelen partir las tablas al insertar datos).
  for (const [tipo, tabla] of Object.entries(porTipo)) {
    const cercanos = runs
      .filter((r) => r !== tabla && r.stride === tabla.stride && Math.abs(r.inicio - tabla.inicio) < 0x20000 && r.count >= 20)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    tabla.fragmentos = cercanos.map((f) => ({ inicio: f.inicio, count: f.count, muestra: f.muestra }));
    tabla.entradasTotales = tabla.count + cercanos.reduce((a, f) => a + f.count, 0);
  }
  const ordenadas = Object.values(porTipo).sort((a, b) => b.count - a.count);
  return { todas: runs.slice(0, 14), porTipo, tablasOrdenadas: ordenadas };
}

// ------------------------------------------------------------------ entrenadores
const u32 = (data, off) => (data[off] | (data[off + 1] << 8) | (data[off + 2] << 16) | (data[off + 3] << 24)) >>> 0;
const u16 = (data, off) => data[off] | (data[off + 1] << 8);
const ptrValido = (v, len) => v >= 0x08000000 && v - 0x08000000 < len;

/**
 * Estructura de entrenador de la 3ª generación (40 bytes):
 * 0x00 partyFlags · 0x01 trainerClass · 0x02 género · 0x03 música · 0x04 sprite(?) ·
 * 0x04 name[12] · 0x10 items[4] · 0x18 doubleBattle · 0x1C aiFlags · 0x20 partySize · 0x24 partyPtr
 */
function buscarEntrenadores(data) {
  const SIZE = 40;
  const candidatos = [];
  const max = data.length - SIZE;
  for (let off = 0; off < max; off += 1) {
    const partyFlags = data[off];
    if (partyFlags > 3) continue;
    const trainerClass = data[off + 1];
    if (trainerClass < 1 || trainerClass > 200) continue;
    const trainerPic = data[off + 3];
    if (trainerPic > 0xff) continue;
    // 0x02 es (música << 1) | género: no sirve para filtrar por rango.
    const gender = data[off + 2] & 1;
    const name = decode(data, off + 4, 12); // trainerName[12] empieza en 0x04
    if (!name) continue;
    const partySize = u32(data, off + 32);
    if (partySize < 1 || partySize > 6) continue;
    const partyPtr = u32(data, off + 36);
    if (!ptrValido(partyPtr, data.length)) continue;
    const items = [0, 1, 2, 3].map((k) => u16(data, off + 16 + k * 2)); // items[4] en 0x10
    if (items.some((it) => it > 900)) continue;
    candidatos.push({ off, partyFlags, trainerClass, gender, name, partySize, partyPtr: partyPtr - 0x08000000, items: items.filter(Boolean) });
    if (candidatos.length > 200000) break;
  }
  // Nos quedamos con la serie más larga de estructuras contiguas de 40 bytes.
  const offsets = new Set(candidatos.map((c) => c.off));
  let mejor = { inicio: 0, count: 0 };
  let actual = { inicio: 0, count: 0 };
  for (const c of candidatos) {
    if (actual.count && c.off === actual.inicio + actual.count * SIZE) actual.count += 1;
    else actual = { inicio: c.off, count: 1 };
    if (actual.count > mejor.count) mejor = { ...actual };
  }
  if (!mejor.count || mejor.count < 20) return { total: 0, muestra: [], series: mejor.count };
  const porOff = new Map(candidatos.map((c) => [c.off, c]));
  const entrenadores = [];
  for (let k = 0; k < mejor.count; k += 1) {
    const c = porOff.get(mejor.inicio + k * SIZE);
    if (!c) continue;
    const party = [];
    for (let p = 0; p < c.partySize; p += 1) {
      const base = c.partyPtr + p * 8;
      if (base + 8 > data.length) break;
      // TrainerMon: iv(u16) + nivel(u8) + relleno(u8) + especie(u16) + objeto(u16 si partyFlags&1)
      party.push({ nivel: data[base + 2], especie: u16(data, base + 4), objeto: c.partyFlags & 1 ? u16(data, base + 6) : 0 });
    }
    entrenadores.push({
      id: k,
      clase: c.trainerClass,
      nombre: c.name,
      objetos: c.items,
      equipo: party,
    });
  }
  return { total: entrenadores.length, inicio: mejor.inicio, muestra: entrenadores.slice(0, 40), todos: entrenadores };
}

// ------------------------------------------------------------------------ LZ77
function inventarioLZ77(data) {
  const blobs = [];
  const max = data.length - 4;
  for (let off = 0; off < max; off += 1) {
    if (data[off] !== 0x10) continue;
    const size = data[off + 1] | (data[off + 2] << 8) | (data[off + 3] << 16);
    if (size < 0x40 || size > 0x40000 || off + 4 + size > data.length) continue;
    blobs.push({ offset: off, descomprimido: size });
  }
  const porTam = new Map();
  for (const b of blobs) {
    const k = b.descomprimido;
    porTam.set(k, (porTam.get(k) || 0) + 1);
  }
  const clasificar = (n) => {
    if (n === 2048) return "sprite 64×64 (4 bpp) — Pokémon frente/espalda";
    if (n === 4096) return "sprite 64×64 (8 bpp)";
    if (n === 512) return "icono 32×32 (4 bpp)";
    if (n === 640) return "icono 32×32 + paleta";
    if (n >= 0x1000 && n <= 0x8000) return "gráfico grande (fondo/tileset/interfaz)";
    return "otro";
  };
  return {
    total: blobs.length,
    porTamaño: [...porTam.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([tam, n]) => ({ tam, n, clase: clasificar(tam) })),
  };
}

// ----------------------------------------------------------------------- informe
function renderInforme(inv) {
  const fila = (t) => `| ${t.tipo} | ${t.count} | ${t.stride} | 0x${t.inicio.toString(16).toUpperCase()} | ${t.muestra.filter(Boolean).slice(0, 4).join(", ")} |`;
  return `# Inventario GBA: ${inv.identificacion.archivo}

- **ROM base**: ${inv.identificacion.romBase} (código ${inv.identificacion.codigo || "—"}, revisión ${inv.identificacion.revision})
- **Título interno**: ${inv.identificacion.tituloInterno || "—"}
- **Tamaño**: ${(inv.identificacion.tamaño / 1048576).toFixed(1)} MB
- Análisis: ${inv.resumen.duracionSegundos}s · generado ${inv.generadoEn}

_Sólo metadatos y texto: ningún sprite, música ni mapa del ROM se copia a Fire Ash._

## Tablas de nombres encontradas

| Tipo | Entradas | Ancho | Offset | Muestra |
|---|---:|---:|---|---|
${Object.entries(inv.tablas.porTipo)
  .map(([tipo, t]) => fila({ tipo, count: t.count, stride: t.stride, inicio: t.inicio, muestra: t.muestra }))
  .join("\n")}

## Batallas

${inv.batallas.total} entrenadores detectados (serie contigua de estructuras de 40 bytes).
Equipo medio: ${inv.batallas.estadisticas ? inv.batallas.estadisticas.equipoMedio : "—"} Pokémon ·
nivel medio: ${inv.batallas.estadisticas ? inv.batallas.estadisticas.nivelMedio : "—"}.

${
  inv.batallas.muestra
    .slice(0, 15)
    .map(
      (t) =>
        `- **${t.nombre}** (clase ${t.clase}${t.objetos.length ? `, objetos: ${t.objetos.join("/")}` : ""}) — ` +
        t.equipo.map((p) => `#${p.especie} Nv${p.nivel}${p.objeto ? `+obj${p.objeto}` : ""}`).join(", ")
    )
    .join("\n") || "_No se detectó la tabla de entrenadores con este patrón._"
}

## Recursos comprimidos (LZ77)

${inv.lz77.total} bloques. Tamaños más repetidos:

${inv.lz77.porTamaño.map((p) => `- ${p.n} bloques de ${p.tam} bytes — ${p.clase}`).join("\n")}
`;
}

// ------------------------------------------------------------------ principal
function analizar(file) {
  const data = fs.readFileSync(file);
  const t0 = Date.now();
  const id = identificar(data, file);
  const tablas = buscarTablas(data);
  const batallas = buscarEntrenadores(data);
  const lz77 = inventarioLZ77(data);

  const nivelMedio = batallas.todos && batallas.todos.length
    ? Number(
        (
          batallas.todos.reduce((a, t) => a + t.equipo.reduce((b, p) => b + p.nivel, 0), 0) /
          batallas.todos.reduce((a, t) => a + t.equipo.length, 0)
        ).toFixed(1)
      )
    : null;
  const equipoMedio = batallas.todos && batallas.todos.length
    ? Number((batallas.todos.reduce((a, t) => a + t.equipo.length, 0) / batallas.todos.length).toFixed(2))
    : null;

  const inv = {
    slug: id.archivo.replace(/\.(gba|gb|gbc)$/i, ""),
    generadoEn: new Date().toISOString(),
    identificacion: id,
    resumen: {
      duracionSegundos: Number(((Date.now() - t0) / 1000).toFixed(1)),
      especies: tablas.porTipo.especies ? tablas.porTipo.especies.count : 0,
      movimientos: tablas.porTipo.movimientos ? tablas.porTipo.movimientos.count : 0,
      objetos: tablas.porTipo.objetos ? tablas.porTipo.objetos.count : 0,
      habilidades: tablas.porTipo.habilidades ? tablas.porTipo.habilidades.count : 0,
      entrenadores: batallas.total,
      bloquesLZ77: lz77.total,
    },
    tablas,
    batallas: { total: batallas.total, inicio: batallas.inicio, estadisticas: { equipoMedio, nivelMedio }, muestra: batallas.muestra || [] },
    lz77,
  };

  const outDir = path.join(OUT_ROOT(), inv.slug);
  fs.mkdirSync(path.join(outDir, "pbs"), { recursive: true });
  fs.writeFileSync(path.join(outDir, "gba_inventory.json"), `${JSON.stringify(inv, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, "informe_gba.md"), renderInforme(inv));

  // Exportación tipo PBS / Pokémon Studio (sólo nombres y estructuras).
  const volcar = (nombre, tabla) => {
    if (!tabla) return;
    const lineas = [];
    for (let i = 0; i < tabla.count; i += 1) {
      const valor = decode(data, tabla.inicio + i * tabla.stride, tabla.stride);
      lineas.push(`${i}\t${valor}`);
    }
    fs.writeFileSync(path.join(outDir, "pbs", nombre), `# ${tabla.count} entradas (ancho ${tabla.stride}, offset 0x${tabla.inicio.toString(16).toUpperCase()})\n${lineas.join("\n")}\n`);
  };
  volcar("pokemon.txt", tablas.porTipo.especies);
  volcar("moves.txt", tablas.porTipo.movimientos);
  volcar("items.txt", tablas.porTipo.objetos);
  volcar("abilities.txt", tablas.porTipo.habilidades);
  volcar("trainerclasses.txt", tablas.porTipo.clases_entrenador);

  if (batallas.todos && batallas.todos.length) {
    const nombresEspecie = tablas.porTipo.especies
      ? (i) => decode(data, tablas.porTipo.especies.inicio + i * tablas.porTipo.especies.stride, tablas.porTipo.especies.stride)
      : (i) => `#${i}`;
    const lineas = batallas.todos.map(
      (t) =>
        `#-------------------------------\n[CLASE_${t.clase},${t.nombre}]\n` +
        (t.objetos.length ? `Items = ${t.objetos.join(",")}\n` : "") +
        t.equipo.map((p) => `Pokemon = ${nombresEspecie(p.especie)},${p.nivel}${p.objeto ? `,ITEM_${p.objeto}` : ""}`).join("\n")
    );
    fs.writeFileSync(
      path.join(outDir, "pbs", "trainers.txt"),
      `# ${batallas.todos.length} entrenadores detectados en la ROM\n${lineas.join("\n")}\n`
    );
  }

  console.log(
    `${inv.slug}: ${id.romBase} · especies ${inv.resumen.especies} · movimientos ${inv.resumen.movimientos} · ` +
      `objetos ${inv.resumen.objetos} · habilidades ${inv.resumen.habilidades} · entrenadores ${inv.resumen.entrenadores} · ` +
      `bloques LZ77 ${inv.resumen.bloquesLZ77} (${inv.resumen.duracionSegundos}s)`
  );
  console.log(`→ ${path.relative(ROOT, outDir)}/informe_gba.md`);
  return inv;
}

const objetivos = ROM
  ? [ROM]
  : DIR
    ? fs
        .readdirSync(DIR)
        .filter((f) => /\.(gba|gb|gbc)$/i.test(f))
        .map((f) => path.join(DIR, f))
    : [];

if (!objetivos.length) {
  console.log("Uso: node tools/inspect_gba_rom.mjs --rom <archivo.gba> | --dir <carpeta>");
  process.exit(1);
}
for (const objetivo of objetivos) analizar(objetivo);
