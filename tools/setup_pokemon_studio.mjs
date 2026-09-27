#!/usr/bin/env node
/** Instalación reproducible de referencia para Pokémon Studio 2.11.0.
 * El programa externo se conserva fuera del juego y nunca se distribuye aquí.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPOSITORY = "https://github.com/PokemonWorkshop/PokemonStudio.git";
const TAG = "v2.11.0";
const VERSION = "2.11.0";
const DEFAULT_DESTINATION = path.join(ROOT, "tools", ".cache", "PokemonStudio-2.11.0");

function argument(name, fallback = null) {
  const at = process.argv.indexOf(name);
  return at >= 0 ? process.argv[at + 1] : fallback;
}

function execute(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} terminó con código ${result.status}.`);
}

function assertSafeDestination(destination) {
  const cache = path.resolve(ROOT, "tools", ".cache");
  const resolved = path.resolve(destination);
  const relative = path.relative(cache, resolved);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("El destino debe estar dentro de tools/.cache.");
  return resolved;
}

function status(source) {
  const packageFile = path.join(source, "package.json");
  const packageData = fs.existsSync(packageFile) ? JSON.parse(fs.readFileSync(packageFile, "utf8")) : null;
  const electronBinary = process.platform === "win32"
    ? path.join(source, "node_modules", "electron", "dist", "electron.exe")
    : path.join(source, "node_modules", "electron", "dist", "electron");
  return {
    source,
    repository: REPOSITORY,
    expectedTag: TAG,
    expectedVersion: VERSION,
    sourcePresent: Boolean(packageData),
    detectedVersion: packageData?.version ?? null,
    versionMatches: packageData?.version === VERSION,
    dependenciesPresent: fs.existsSync(path.join(source, "node_modules")),
    electronBinaryPresent: fs.existsSync(electronBinary),
    adapterReady: fs.existsSync(path.join(ROOT, "tools", "pokemon_studio_adapter.mjs")),
    guiReady: packageData?.version === VERSION && fs.existsSync(electronBinary),
    runtimePolicy: "Pokémon Studio/PSDK permanece separado de Fire Ash/Essentials.",
  };
}

function install(destination) {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    execute("git", ["clone", "--depth", "1", "--branch", TAG, REPOSITORY, destination]);
  }
  const packageData = JSON.parse(fs.readFileSync(path.join(destination, "package.json"), "utf8"));
  if (packageData.version !== VERSION) throw new Error(`Se esperaba Pokémon Studio ${VERSION}, se obtuvo ${packageData.version}.`);
  const tag = spawnSync("git", ["describe", "--tags", "--exact-match"], { cwd: destination, encoding: "utf8" });
  if (tag.status !== 0 || tag.stdout.trim() !== TAG) throw new Error(`La fuente no corresponde a ${TAG}.`);

  if (process.argv.includes("--dependencies")) {
    const adapterOnly = process.argv.includes("--adapter-only");
    execute("npm", ["ci"], {
      cwd: destination,
      env: {
        ...process.env,
        ...(adapterOnly ? { ELECTRON_SKIP_BINARY_DOWNLOAD: "1" } : {}),
        NODE_EXTRA_CA_CERTS: process.env.NODE_EXTRA_CA_CERTS || "/etc/ssl/certs/ca-certificates.crt",
      },
    });
  }
  if (process.argv.includes("--submodules")) execute("git", ["submodule", "update", "--init", "--recursive"], { cwd: destination });
  return status(destination);
}

function main() {
  const command = process.argv[2] ?? "doctor";
  const suppliedSource = argument("--source");
  const destination = command === "install"
    ? assertSafeDestination(argument("--destination", DEFAULT_DESTINATION))
    : suppliedSource ? path.resolve(suppliedSource) : assertSafeDestination(argument("--destination", DEFAULT_DESTINATION));
  if (command === "install") console.log(JSON.stringify(install(destination), null, 2));
  else if (command === "doctor") console.log(JSON.stringify(status(destination), null, 2));
  else if (command === "links") console.log(JSON.stringify({
    pokemonStudio: REPOSITORY,
    pokemonStudioTag: `https://github.com/PokemonWorkshop/PokemonStudio/releases/tag/${TAG}`,
    pokemonRegionBuilder: "https://felker.dev/pokemon-region-builder/",
  }, null, 2));
  else {
    console.log("Uso:");
    console.log("  node tools/setup_pokemon_studio.mjs install [--dependencies] [--adapter-only] [--submodules]");
    console.log("  node tools/setup_pokemon_studio.mjs doctor [--source /ruta/PokemonStudio]");
    console.log("  node tools/setup_pokemon_studio.mjs links");
  }
}

try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
