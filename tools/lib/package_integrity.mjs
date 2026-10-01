import fs from "node:fs";

/** Verifica el origen y la copia; no modifica ninguno de los archivos. */
export function assertSameFile(source, destination) {
  if (!fs.existsSync(source)) throw new Error(`Falta el archivo de origen: ${source}`);
  if (!fs.existsSync(destination)) throw new Error(`Falta el archivo del paquete: ${destination}`);
  if (!fs.readFileSync(source).equals(fs.readFileSync(destination))) {
    throw new Error(`Archivo del paquete desactualizado: ${destination} (origen: ${source})`);
  }
}
