import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

export const EXPECTED_GBA_PARTS = ["gba.part01", "gba.part02", "gba.part03", "gba.part04"];

export function findGbaMultipartParts(inputDir) {
  const absoluteInput = path.resolve(inputDir);
  const missing = EXPECTED_GBA_PARTS.filter((name) => !fs.existsSync(path.join(absoluteInput, name)));
  if (missing.length) {
    throw new Error(
      `Faltan partes del archivo multipart: ${missing.join(", ")}. ` +
        `Debes colocar exactamente ${EXPECTED_GBA_PARTS.join(", ")} en ${absoluteInput}.`
    );
  }
  const parts = EXPECTED_GBA_PARTS.map((name) => path.join(absoluteInput, name));
  return { parts, firstPart: parts[0] };
}

export function detect7ZipBinary(which = defaultWhich) {
  for (const candidate of ["7z", "7za", "7zr"]) {
    if (which(candidate)) return candidate;
  }
  return null;
}

function defaultWhich(bin) {
  try {
    execFileSync(bin, ["-h"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function build7ZipExtractArgs({ firstPart, destinationDir, password }) {
  if (!password) throw new Error("Falta --clave para abrir el archivo protegido.");
  return ["x", "-y", `-p${password}`, `-o${destinationDir}`, firstPart];
}

export function resolveSafeDestinationPath(destinationRoot, relativePath, pathModule = path) {
  if (!relativePath || relativePath === ".") return pathModule.resolve(destinationRoot);
  if (pathModule.isAbsolute(relativePath)) {
    throw new Error(`Ruta absoluta no permitida dentro del archivo: ${relativePath}`);
  }
  const normalized = pathModule.normalize(relativePath);
  if (normalized === ".." || normalized.startsWith(`..${pathModule.sep}`)) {
    throw new Error(`Ruta fuera del destino detectada en el archivo: ${relativePath}`);
  }
  const destinationAbs = pathModule.resolve(destinationRoot);
  const candidate = pathModule.resolve(destinationAbs, normalized);
  const inside = candidate === destinationAbs || candidate.startsWith(`${destinationAbs}${pathModule.sep}`);
  if (!inside) {
    throw new Error(`Ruta fuera del destino detectada en el archivo: ${relativePath}`);
  }
  return candidate;
}

export function copyTreeSafe(sourceRoot, destinationRoot, fsModule = fs, pathModule = path) {
  const sourceAbs = pathModule.resolve(sourceRoot);
  const destinationAbs = pathModule.resolve(destinationRoot);
  fsModule.mkdirSync(destinationAbs, { recursive: true });

  const walk = (current) => {
    for (const entry of fsModule.readdirSync(current, { withFileTypes: true })) {
      const sourcePath = pathModule.join(current, entry.name);
      const relative = pathModule.relative(sourceAbs, sourcePath);
      const destinationPath = resolveSafeDestinationPath(destinationAbs, relative, pathModule);
      if (entry.isSymbolicLink()) {
        throw new Error(`No se permiten enlaces simbólicos en el archivo: ${relative}`);
      }
      if (entry.isDirectory()) {
        fsModule.mkdirSync(destinationPath, { recursive: true });
        walk(sourcePath);
        continue;
      }
      if (entry.isFile()) {
        fsModule.mkdirSync(pathModule.dirname(destinationPath), { recursive: true });
        fsModule.copyFileSync(sourcePath, destinationPath);
      }
    }
  };

  walk(sourceAbs);
}

export function extractGbaMultipartArchive({
  inputDir,
  destinationDir,
  password,
  findExtractor = detect7ZipBinary,
  runExtractor = (bin, args) => execFileSync(bin, args, { stdio: "ignore" }),
  fsModule = fs,
  pathModule = path,
  osModule = os,
}) {
  const { parts, firstPart } = findGbaMultipartParts(inputDir);
  const extractor = findExtractor();
  if (!extractor) {
    throw new Error(
      "No encuentro 7-Zip (7z/7za/7zr) para abrir el multipart protegido. " +
        "Instala 7-Zip y vuelve a ejecutar el comando."
    );
  }

  const tempRoot = fsModule.mkdtempSync(pathModule.join(osModule.tmpdir(), "gba-partes-"));
  try {
    runExtractor(extractor, build7ZipExtractArgs({ firstPart, destinationDir: tempRoot, password }));
    copyTreeSafe(tempRoot, destinationDir, fsModule, pathModule);
  } catch (error) {
    throw new Error(
      `No se pudo extraer ${pathModule.basename(firstPart)}. Revisa que las cuatro partes estén completas y que la clave sea válida.`
    );
  } finally {
    fsModule.rmSync(tempRoot, { recursive: true, force: true });
  }

  return { extractor, parts, destinationDir: pathModule.resolve(destinationDir) };
}
