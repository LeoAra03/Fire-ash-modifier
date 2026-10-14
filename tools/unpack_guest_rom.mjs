#!/usr/bin/env node
/**
 * Prepara un ROM invitado para el analizador: localiza el archivo, lo
 * descomprime si hace falta y deja lista la carpeta con Data/MapInfos.rxdata.
 *
 * Admite ZIP (con o sin contraseña), RAR de varias partes (si el sistema tiene
 * unrar/unar/7z/bsdtar) y carpetas ya descomprimidas. La contraseña se prueba
 * con la lista que indique el jugador (--clave a, --clave b) o con la serie
 * numérica típica que él mismo dio (1, 12, 123, …, 12345678).
 *
 * Uso:
 *   node tools/unpack_guest_rom.mjs --entrada reference/roms_invitadas/entrada
 *   node tools/unpack_guest_rom.mjs --entrada juegos/glazed.rar --slug glazed
 *   node tools/unpack_guest_rom.mjs --entrada juegos/ --slug team_rocket --clave 12345678
 *
 * Salida: reference/roms_invitadas/<slug>/juego/… (carpeta ignorada por Git).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_ROOT = path.join(ROOT, "reference", "roms_invitadas");

const arg = (name, fallback = null) => {
  const key = `--${name}`;
  const i = process.argv.indexOf(key);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : fallback;
};
const allArgs = (name) => {
  const key = `--${name}`;
  const out = [];
  for (let i = 0; i < process.argv.length; i += 1) {
    if (process.argv[i] === key && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")) out.push(process.argv[i + 1]);
  }
  return out;
};
const ENTRADA = arg("entrada");
const SLUG = arg("slug", "invitado");
const CLAVES = allArgs("clave");

const which = (bin) => {
  try {
    execFileSync("command", ["-v", bin], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

const esJuego = (dir) => fs.existsSync(path.join(dir, "Data", "MapInfos.rxdata"));
const esRaizDeJuego = (dir) => fs.existsSync(path.join(dir, "MapInfos.rxdata"));

/** Busca, dentro de un árbol, la carpeta que contiene Data/MapInfos.rxdata. */
function buscarJuego(dir, profundidad = 3) {
  if (esJuego(dir)) return path.join(dir, "Data");
  if (esRaizDeJuego(dir)) return dir;
  if (profundidad <= 0) return null;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const found = buscarJuego(path.join(dir, entry.name), profundidad - 1);
    if (found) return found;
  }
  return null;
}

function archivosDe(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => path.join(dir, e.name));
}

/** Encuentra el archivo contenedor: prioriza el .rar/.zip que empiece el juego. */
function encontrarContenedor(dir) {
  const files = archivosDe(dir);
  const rar = files.filter((f) => /\.rar$/i.test(f) || /\.r\d{2}$/i.test(f) || /\.part\d+\.rar$/i.test(f));
  const zip = files.filter((f) => /\.zip$/i.test(f) || /\.7z$/i.test(f));
  const ordenar = (a, b) => fs.statSync(b).size - fs.statSync(a).size;
  return rar.sort(ordenar)[0] || zip.sort(ordenar)[0] || null;
}

const CANDIDATOS_CLAVE = () => {
  const base = ["", "1", "12", "123", "1234", "12345", "123456", "1234567", "12345678"];
  return [...new Set([...CLAVES, ...base])];
};

function intentar(bin, args) {
  try {
    execFileSync(bin, args, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function descomprimirZip(archivo, destino) {
  fs.mkdirSync(destino, { recursive: true });
  for (const clave of CANDIDATOS_CLAVE()) {
    const args = ["-qq", "-o", clave ? `-P${clave}` : "-P", archivo, "-d", destino];
    if (intentar("unzip", args.filter((a) => a !== "-P"))) return { ok: true, herramienta: "unzip", clave };
    if (clave && intentar("unzip", args)) return { ok: true, herramienta: "unzip", clave };
  }
  return { ok: false };
}

function descomprimirRar(archivo, destino) {
  const herramientas = [
    { bin: "unrar", args: (clave) => ["x", "-y", clave ? `-p${clave}` : "-p-", archivo, `${destino}/`] },
    { bin: "unar", args: (clave) => ["-f", "-o", destino, clave ? `-p${clave}` : "-p", archivo] },
    { bin: "7z", args: (clave) => ["x", "-y", clave ? `-p${clave}` : "-p", `-o${destino}`, archivo] },
    { bin: "7za", args: (clave) => ["x", "-y", clave ? `-p${clave}` : "-p", `-o${destino}`, archivo] },
    { bin: "7zr", args: (clave) => ["x", "-y", clave ? `-p${clave}` : "-p", `-o${destino}`, archivo] },
    { bin: "bsdtar", args: (clave) => ["-xf", archivo, "-C", destino, ...(clave ? [`--passphrase`, clave] : [])] },
  ];
  const disponible = herramientas.find((h) => which(h.bin));
  if (!disponible) return { ok: false, sinHerramienta: true };
  fs.mkdirSync(destino, { recursive: true });
  for (const clave of CANDIDATOS_CLAVE()) {
    if (intentar(disponible.bin, disponible.args(clave))) return { ok: true, herramienta: disponible.bin, clave };
  }
  return { ok: false, herramienta: disponible.bin };
}

function preparar() {
  if (!ENTRADA) throw new Error("Falta --entrada <carpeta o archivo>.");
  const entrada = path.resolve(ENTRADA);
  if (!fs.existsSync(entrada)) {
    throw new Error(
      `No encuentro ${ENTRADA}. Sube el juego a reference/roms_invitadas/entrada/ ` +
        "(carpeta ignorada por Git) y vuelve a ejecutar este comando."
    );
  }
  const destino = path.join(OUT_ROOT, SLUG);
  const juegoDir = path.join(destino, "juego");

  // 1) ¿Ya es un juego descomprimido?
  if (fs.statSync(entrada).isDirectory()) {
    const data = buscarJuego(entrada);
    if (data) {
      console.log(`El juego ya está descomprimido: ${path.relative(ROOT, data)}`);
      console.log(`Siguiente paso: node tools/inspect_guest_rom.mjs --dir "${path.dirname(data)}" --slug ${SLUG}`);
      return;
    }
  }

  // 2) Localizar el contenedor
  const contenedor = fs.statSync(entrada).isDirectory() ? encontrarContenedor(entrada) : entrada;
  if (!contenedor) {
    throw new Error(
      `No hay ningún .zip ni .rar en ${entrada}. Sube la carpeta ya descomprimida ` +
        "(con Data/, Graphics/ y Audio/) o un ZIP."
    );
  }
  console.log(`Contenedor: ${path.basename(contenedor)} (${(fs.statSync(contenedor).size / 1048576).toFixed(1)} MB)`);

  // 3) Descomprimir
  fs.mkdirSync(juegoDir, { recursive: true });
  const resultado = /\.zip$/i.test(contenedor)
    ? descomprimirZip(contenedor, juegoDir)
    : descomprimirRar(contenedor, juegoDir);
  if (!resultado.ok) {
    if (resultado.sinHerramienta) {
      throw new Error(
        "Este entorno no tiene ningún descompresor de RAR (ni unrar, ni unar, ni 7z, ni bsdtar) y no se " +
          "puede instalar uno: apt no tiene red y libunrar no está disponible.\n" +
          "Soluciones, de mejor a peor:\n" +
          "  1. Descomprime el RAR en tu PC y sube la carpeta (Data/, Graphics/, Audio/).\n" +
          "  2. Vuelve a comprimirlo como ZIP y súbelo así: el ZIP sí se puede abrir aquí.\n" +
          "  3. Súbelo también como .7z si ya lo tienes en ese formato."
      );
    }
    throw new Error(
      `No pude abrir ${path.basename(contenedor)} con ${resultado.herramienta}. ` +
        "Prueba a pasar la contraseña con --clave <contraseña>."
    );
  }
  console.log(`Descomprimido con ${resultado.herramienta}${resultado.clave ? ` (contraseña "${resultado.clave}")` : " (sin contraseña)"}`);

  // 4) Localizar el juego dentro de lo extraído
  const data = buscarJuego(juegoDir);
  if (!data) {
    throw new Error(
      `Se descomprimió pero no encuentro Data/MapInfos.rxdata en ${path.relative(ROOT, juegoDir)}. ` +
        "Puede ser un parche (.ups/.ips/.xdelta) que hay que aplicar sobre un ROM base antes de analizarlo."
    );
  }
  console.log(`Juego listo: ${path.relative(ROOT, data)}`);
  console.log(`Siguiente paso: node tools/inspect_guest_rom.mjs --dir "${path.dirname(data)}" --slug ${SLUG}`);
}

preparar();
