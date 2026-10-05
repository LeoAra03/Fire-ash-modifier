#!/usr/bin/env node
/**
 * Inventario de solo lectura de un ROM hack invitado (RPG Maker XP / Essentials).
 *
 * Para qué sirve: cuando el jugador trae un ROM de referencia (Glazed, Light
 * Platinum, Pokémon Team Rocket...), este analizador le saca el esqueleto
 * jugable sin abrir Pokémon Studio:
 *
 *   · mapas: nombre, tamaño, tileset, eventos, páginas, comandos y textos
 *   · flags: nombres reales de switches y variables (Data/System.rxdata)
 *   · NPCs: nombres de evento, sprite que usan y dónde están
 *   · cinemáticas: CommonEvents + bloques de texto ShowText por mapa
 *   · música: BGM/BGS/ME/SE referenciados y presentes
 *   · sprites: hojas de Characters/Battlers/Tilesets con dimensiones y fotogramas
 *   · batallas: entrenadores de Data/trainers.dat (si es formato Essentials)
 *
 * Lo que NO hace, a propósito: no copia sprites, música ni mapas del ROM al
 * nuestro. Sólo produce un inventario y un informe para inspirar contenido
 * original. Ningún recurso con derechos ajenos entra en el repositorio.
 *
 * Uso:
 *   node tools/inspect_guest_rom.mjs --dir /ruta/al/juego --slug team_rocket
 *   node tools/inspect_guest_rom.mjs --zip /ruta/al/juego.zip --slug glazed
 *   node tools/inspect_guest_rom.mjs --dir ... --slug x --limit-maps 200
 *
 * Salidas (carpeta reference/roms_invitadas/<slug>/, ignorada por git):
 *   inventory.json  · informe.md  · pbs/ (exportación tipo Pokémon Studio)
 */
import fs from "node:fs";
import os from "node:os";
import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalLoad } from "../web/js/marshal.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_ROOT = path.join(ROOT, "reference", "roms_invitadas");
/** Carpeta de salida: se puede redirigir con ROM_OUT_DIR para las autopruebas. */
const outputRoot = () => (process.env.ROM_OUT_DIR ? path.resolve(process.env.ROM_OUT_DIR) : OUT_ROOT);

const arg = (name, fallback = null) => {
  const key = `--${name}`;
  const i = process.argv.indexOf(key);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : fallback;
};
const FLAGS = new Set(process.argv.filter((a) => a.startsWith("--") && !a.includes("=")));
const DIR = arg("dir");
const ZIP = arg("zip");
const SLUG = arg("slug", "invitado");
const LIMIT = Number(arg("limit-maps", "0")) || 0;

const ivars = (obj) => {
  if (!obj || !Array.isArray(obj.ivars)) return {};
  return Object.fromEntries(obj.ivars.map(([k, v]) => [k, v]));
};
/** Campos de un objeto marshal: ivars (@clave) o pares de RHash (clave sin arroba). */
const fields = (obj) => {
  if (!obj) return {};
  if (Array.isArray(obj.ivars) && obj.ivars.length) return Object.fromEntries(obj.ivars);
  if (Array.isArray(obj.pairs)) {
    return Object.fromEntries(obj.pairs.map(([k, v]) => [String((k && (k.text ?? k.name ?? k)) ?? ""), v]));
  }
  return {};
};
/** Texto de un RString, RSymbol o símbolo serializado ([bytes, ivars, 0]). */
const text = (v) => {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "object") {
    if (typeof v.text === "string") return v.text;
    if (typeof v.name === "string") return v.name; // RSymbol
    if (Array.isArray(v)) return text(v[0]);
  }
  return "";
};
const num = (v) => {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  if (v && typeof v === "object" && "value" in v) return Number(v.value) || 0;
  return 0;
};

/** Dimensiones de un PNG leyendo sólo la cabecera (rápido, sin decodificar). */
function pngSize(file) {
  try {
    const fd = fs.openSync(file, "r");
    const buf = Buffer.alloc(24);
    fs.readSync(fd, buf, 0, 24, 0);
    fs.closeSync(fd);
    if (buf.readUInt32BE(0) !== 0x89504e47) return null;
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  } catch {
    return null;
  }
}

function findGameRoot(start) {
  const candidates = [start, path.join(start, "Data"), path.join(start, "Game"), path.join(start, "game")];
  for (const c of candidates) if (fs.existsSync(path.join(c, "MapInfos.rxdata"))) return c;
  // Búsqueda acotada: subdirectorios inmediatos que parezcan un juego RMXP.
  if (fs.existsSync(start)) {
    for (const entry of fs.readdirSync(start, { withFileTypes: true }).slice(0, 50)) {
      if (!entry.isDirectory()) continue;
      const c = path.join(start, entry.name, "Data");
      if (fs.existsSync(path.join(c, "MapInfos.rxdata"))) return c;
    }
  }
  return null;
}

function listDir(dir, exts) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && exts.some((x) => e.name.toLowerCase().endsWith(x)))
    .map((e) => e.name)
    .sort();
}

/** Recorre comandos de evento y clasifica lo interesante. */
function scanCommands(list, sink) {
  let i = 0;
  let pendingText = [];
  while (i < list.length) {
    const cmd = list[i];
    const d = ivars(cmd);
    const code = num(d["@code"]);
    const params = Array.isArray(d["@parameters"]) ? d["@parameters"] : [];
    if (code === 101 || code === 401) {
      const line = text(params[0]);
      if (line.trim()) pendingText.push(line.trim());
    } else if (pendingText.length) {
      sink.texts.push(pendingText.join(" "));
      sink.textLines += pendingText.length;
      pendingText = [];
    }
    if (code === 111 || code === 121 || code === 122) {
      // Condición por switch (111) y control de switches (121/122).
      const sid = code === 111 ? num(params[0]) : num(params[0]);
      if (sid > 0) sink.switches[sid] = (sink.switches[sid] || 0) + 1;
    }
    if (code === 112 || code === 122 || code === 123) {
      const vid = num(code === 123 ? params[0] : params[0]);
      if (vid > 0) sink.variables[vid] = (sink.variables[vid] || 0) + 1;
    }
    if (code === 355 || code === 655) {
      // Script de Essentials: guardamos sólo la primera línea, como pista.
      const script = text(params[0]);
      const head = script.split("\n")[0].slice(0, 120);
      if (head.trim()) sink.scriptsHeads.push(head.trim());
    }
    if (code === 241 || code === 245 || code === 249 || code === 250) {
      const p = text(params[0]);
      if (p) sink.audioRefs.add(p);
    }
    if (code === 209 || code === 208) {
      // Mostrar animación / mover evento: cinemática.
      sink.cinematicCommands += 1;
    }
    i += 1;
  }
  if (pendingText.length) {
    sink.texts.push(pendingText.join(" "));
    sink.textLines += pendingText.length;
  }
}

const newSink = () => ({
  texts: [],
  textLines: 0,
  switches: {},
  variables: {},
  scriptsHeads: [],
  audioRefs: new Set(),
  cinematicCommands: 0,
});


/** Entrenadores: soporta Essentials moderno (RHash de GameData::Trainer) y legacy (Array). */
function readTrainers(file) {
  if (!fs.existsSync(file)) return { total: 0, format: "sin archivo", sample: [], partyStats: null };
  let raw;
  try {
    raw = marshalLoad(fs.readFileSync(file));
  } catch (error) {
    return { total: 0, format: `no legible: ${error.message}`, sample: [], partyStats: null };
  }
  const entries = raw && raw.pairs ? raw.pairs.map(([, v]) => v) : Array.isArray(raw) ? raw : [];
  const rows = [];
  let partySum = 0;
  let partyMax = 0;
  for (const e of entries) {
    if (e && e.className === "GameData::Trainer") {
      const d = fields(e);
      const party = Array.isArray(d["@pokemon"]) ? d["@pokemon"] : [];
      partySum += party.length;
      partyMax = Math.max(partyMax, party.length);
      rows.push({
        id: text(d["@id"]),
        trainerType: text(d["@trainer_type"] ?? d["trainer_type"]),
        name: text(d["@name"]),
        version: num(d["@version"]),
        loseText: text(d["@lose_text"]).slice(0, 120),
        items: Array.isArray(d["@items"]) ? d["@items"].map((i) => text(i)) : [],
        party: party.map((p) => {
          const pd = fields(p);
          return {
            species: text(pd["@species"] ?? pd["species"]),
            level: num(pd["@level"] ?? pd["level"]),
            item: text(pd["@item"] ?? pd["item"]),
            moves: Array.isArray(pd["@moves"] ?? pd["moves"]) ? (pd["@moves"] ?? pd["moves"]).map((m) => text(m)).filter(Boolean) : [],
            ability: text(pd["@ability"] ?? pd["ability"]),
            gender: num(pd["@gender"] ?? pd["gender"]),
            form: num(pd["@form"] ?? pd["form"]),
            shiny: Boolean(pd["@shiny"] ?? pd["shiny"]),
          };
        }),
      });
    } else if (Array.isArray(e) && e.length >= 4) {
      // Formato legacy: [tipo, nombre, partido] con party = [especie, nivel, ...]
      const [type, name, , party] = e;
      const list = Array.isArray(party) ? party : [];
      partySum += list.length;
      partyMax = Math.max(partyMax, list.length);
      rows.push({
        id: "",
        trainerType: text(type),
        name: text(name),
        version: 0,
        loseText: "",
        items: [],
        party: list.map((p) => ({ species: text(p && p[2]), level: num(p && p[3]) })),
      });
    }
  }
  const partyStats = rows.length
    ? { promedio: Number((partySum / rows.length).toFixed(2)), maximo: partyMax }
    : null;
  return {
    total: rows.length,
    format: entries.length && entries[0] && entries[0].className ? entries[0].className : "legacy",
    partyStats,
    sample: rows.slice(0, 40),
    todos: rows,
  };
}

/** Catálogo genérico de un .dat de Essentials: id, nombre y campos ligeros. */
function readDataCatalog(file, key) {
  try {
    const raw = marshalLoad(fs.readFileSync(file));
    const entries = raw && raw.pairs ? raw.pairs.map(([, v]) => v) : Array.isArray(raw) ? raw : [];
    const rows = entries
      .map((e) => (e && (e.ivars || e.pairs) ? fields(e) : Array.isArray(e) ? { id: e[0], name: e[1] } : null))
      .filter(Boolean)
      .slice(0, 2000)
      .map((d) => ({
        id: text(d["@id"] ?? d["id"]),
        name: text(d["@name"] ?? d["name"]) || text(d["@real_name"] ?? d["real_name"]) || text(d["@id"] ?? d["id"]),
        extra:
          key === "moves"
            ? { tipo: text(d["@type"] ?? d["type"]), categoria: num(d["@category"] ?? d["category"]), potencia: num(d["@power"] ?? d["power"]) }
            : key === "species"
              ? { tipo1: text(d["@type1"] ?? d["type1"]), tipo2: text(d["@type2"] ?? d["type2"]), forma: num(d["@form"] ?? d["form"]) }
              : {},
      }));
    return { total: entries.length, className: entries[0] && entries[0].className ? entries[0].className : "legacy", filas: rows };
  } catch (error) {
    return { total: 0, className: `no legible: ${error.message}`, filas: [] };
  }
}

function inspect() {
  if (!DIR && !ZIP) throw new Error("Falta --dir <carpeta> o --zip <archivo>.");
  let base = DIR;
  let tempDir = null;
  if (ZIP) {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `rom-${SLUG}-`));
    base = tempDir;
    execFileSync("unzip", ["-qq", "-o", ZIP, "-d", tempDir]);
  }
  const dataDir = findGameRoot(base);
  if (!dataDir) throw new Error(`No encontré Data/MapInfos.rxdata dentro de ${base}`);
  const gameRoot = path.dirname(dataDir);
  const started = Date.now();

  // ---- Mapas -------------------------------------------------------------
  const infos = marshalLoad(fs.readFileSync(path.join(dataDir, "MapInfos.rxdata")));
  const mapNames = new Map();
  for (const [k, v] of infos.pairs || []) {
    const id = num(k.value !== undefined ? k.value : k);
    const d = ivars(v);
    mapNames.set(id, { name: text(d["@name"]), parent: num(d["@parent_id"]), order: num(d["@order"]) });
  }
  const mapFiles = fs
    .readdirSync(dataDir)
    .filter((f) => /^Map\d+\.rxdata$/.test(f))
    .map((f) => ({ file: f, id: Number(f.match(/\d+/)[0]) }))
    .sort((a, b) => a.id - b.id);
  const chosen = LIMIT > 0 ? mapFiles.slice(0, LIMIT) : mapFiles;

  const maps = [];
  const sink = newSink();
  const spriteUse = new Map();
  let eventsTotal = 0;
  let pagesTotal = 0;
  let commandsTotal = 0;
  for (const { file, id } of chosen) {
    const map = marshalLoad(fs.readFileSync(path.join(dataDir, file)));
    const d = ivars(map);
    const events = (d["@events"] && d["@events"].pairs) || [];
    let pages = 0;
    let commands = 0;
    const npcs = [];
    for (const [ek, ev] of events) {
      const ed = ivars(ev);
      const eventId = num(ek.value !== undefined ? ek.value : ek);
      const name = text(ed["@name"]);
      const pagesList = Array.isArray(ed["@pages"]) ? ed["@pages"] : [];
      pages += pagesList.length;
      for (const p of pagesList) {
        const pd = ivars(p);
        const graphic = ivars(pd["@graphic"]);
        const charName = text(graphic["@character_name"]);
        const list = Array.isArray(pd["@list"]) ? pd["@list"] : [];
        commands += list.length;
        scanCommands(list, sink);
        if (charName) {
          spriteUse.set(charName, (spriteUse.get(charName) || 0) + 1);
          npcs.push({ id: eventId, name, sprite: charName, x: num(ed["@x"]), y: num(ed["@y"]) });
        }
      }
    }
    eventsTotal += events.length;
    pagesTotal += pages;
    commandsTotal += commands;
    maps.push({
      id,
      name: mapNames.get(id)?.name ?? "",
      parent: mapNames.get(id)?.parent ?? 0,
      width: num(d["@width"]),
      height: num(d["@height"]),
      tilesetId: num(d["@tileset_id"]),
      events: events.length,
      pages,
      commands,
      npcs: npcs.slice(0, 12),
    });
  }

  // ---- Flags: nombres reales de switches y variables ---------------------
  const systemFile = path.join(dataDir, "System.rxdata");
  let switchNames = [];
  let variableNames = [];
  if (fs.existsSync(systemFile)) {
    const sys = ivars(marshalLoad(fs.readFileSync(systemFile)));
    const asArray = (v) => {
      const arr = Array.isArray(v) ? v : v && Array.isArray(v.value) ? v.value : [];
      return arr.map((x) => text(x && x.text !== undefined ? x : x)).map((s) => (s == null ? "" : String(s)));
    };
    switchNames = asArray(sys["@switches"]);
    variableNames = asArray(sys["@variables"]);
  }

  // ---- Cinemáticas: CommonEvents ----------------------------------------
  let commonEvents = [];
  const commonFile = path.join(dataDir, "CommonEvents.rxdata");
  if (fs.existsSync(commonFile)) {
    const ce = marshalLoad(fs.readFileSync(commonFile));
    const arr = Array.isArray(ce) ? ce : (ce.pairs || []).map(([, v]) => v);
    commonEvents = arr
      .map((v, idx) => {
        const d = ivars(v);
        const s = newSink();
        scanCommands(Array.isArray(d["@list"]) ? d["@list"] : [], s);
        return {
          id: num(d["@id"]) || idx,
          name: text(d["@name"]),
          trigger: num(d["@trigger"]),
          switchId: num(d["@switch_id"]),
          commands: (d["@list"] || []).length,
          textLines: s.textLines,
          preview: s.texts.slice(0, 3).map((t) => t.slice(0, 160)),
        };
      })
      .filter((c) => c.commands > 0);
  }

  // ---- Batallas: trainers.dat (Essentials v17–v21) ------------------------
  const trainers = readTrainers(path.join(dataDir, "trainers.dat"));

  // --- Catálogos de datos (especies, movimientos, objetos) -----------------
  const catalogos = {};
  for (const key of ["species", "moves", "items", "abilities", "types"]) {
    const file = path.join(dataDir, `${key}.dat`);
    if (fs.existsSync(file)) catalogos[key] = readDataCatalog(file, key);
  }

  // ---- Recursos ---------------------------------------------------------
  const G = path.join(gameRoot, "Graphics");
  const spriteDirs = {
    characters: path.join(G, "Characters"),
    entrenadores: path.join(G, "Trainers"),
    pokemon_frontal: path.join(G, "Pokemon", "Front"),
    pokemon_trasero: path.join(G, "Pokemon", "Back"),
    iconos_pokemon: path.join(G, "Pokemon", "Icons"),
    battlers: path.join(G, "Battlers"),
    tilesets: path.join(G, "Tilesets"),
    autotiles: path.join(G, "Autotiles"),
    panoramas: path.join(G, "Panoramas"),
    nieblas: path.join(G, "Fogs"),
    fondos_de_combate: path.join(G, "Battlebacks"),
    objetos: path.join(G, "Items"),
    iconos: path.join(G, "Icons"),
    ventanas: path.join(G, "Windowskins"),
    titulos: path.join(G, "Titles"),
    transiciones: path.join(G, "Transitions"),
    imagenes: path.join(G, "Pictures"),
  };
  const graphics = {};
  for (const [key, dir] of Object.entries(spriteDirs)) {
    const files = listDir(dir, [".png"]);
    graphics[key] = {
      count: files.length,
      files: files.slice(0, 400).map((f) => {
        const size = pngSize(path.join(dir, f));
        return {
          name: f,
          ...(size || {}),
          frames: size ? Math.max(1, Math.round(size.w / (size.h / 4 || 1))) : null,
          usos: key === "characters" ? spriteUse.get(path.basename(f, ".png")) || 0 : undefined,
        };
      }),
    };
  }
  const audio = {};
  for (const key of ["BGM", "BGS", "ME", "SE"]) {
    const files = listDir(path.join(gameRoot, "Audio", key), [".mid", ".midi", ".mp3", ".ogg", ".wav"]);
    audio[key] = { count: files.length, files: files.slice(0, 500) };
  }

  const inventory = {
    slug: SLUG,
    source: ZIP ? path.basename(ZIP) : path.resolve(base),
    engine: "RPG Maker XP / Pokémon Essentials",
    generadoEn: new Date().toISOString(),
    resumen: {
      mapas: maps.length,
      mapasEnMapInfos: mapNames.size,
      eventos: eventsTotal,
      paginas: pagesTotal,
      comandos: commandsTotal,
      lineasDeTexto: sink.textLines,
      switchesNombrados: switchNames.filter((s) => s.trim()).length,
      variablesNombradas: variableNames.filter((s) => s.trim()).length,
      switchesUsados: Object.keys(sink.switches).length,
      variablesUsadas: Object.keys(sink.variables).length,
      commonEvents: commonEvents.length,
      entrenadores: trainers.total,
      catalogos: Object.fromEntries(Object.entries(catalogos).map(([k, v]) => [k, v.total])),
      duracionSegundos: Number(((Date.now() - started) / 1000).toFixed(1)),
    },
    flags: {
      switches: switchNames.map((name, index) => ({ id: index, name, usos: sink.switches[index] || 0 })),
      variables: variableNames.map((name, index) => ({ id: index, name, usos: sink.variables[index] || 0 })),
    },
    mapas: maps,
    commonEvents,
    batallas: { total: trainers.total, formato: trainers.format, estadisticasEquipo: trainers.partyStats, muestra: trainers.sample },
    catalogos,
    graficos: graphics,
    audio,
    audioReferenciadoEnEventos: [...sink.audioRefs].sort(),
    spritesMasUsados: [...spriteUse.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 120)
      .map(([name, usos]) => ({ name, usos })),
    pistasDeScript: [...new Set(sink.scriptsHeads)].slice(0, 200),
  };

  const outDir = path.join(outputRoot(), SLUG);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "inventory.json"), `${JSON.stringify(inventory, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, "informe.md"), renderReport(inventory));
  fs.mkdirSync(path.join(outDir, "pbs"), { recursive: true });
  // ---- Exportación tipo Pokémon Studio (PBS) -----------------------------
  fs.writeFileSync(
    path.join(outDir, "pbs", "mapas.txt"),
    "# id | nombre | tamaño | tileset | mapa padre | eventos\n" +
      maps.map((m) => `${m.id}\t${m.name}\t${m.width}x${m.height}\t${m.tilesetId}\t${m.parent}\t${m.events}`).join("\n") + "\n"
  );
  fs.writeFileSync(
    path.join(outDir, "pbs", "flags.txt"),
    "# switches (id, nombre, usos en eventos) y variables del ROM invitado\n" +
      inventory.flags.switches.filter((f) => f.name.trim()).map((f) => `SWITCH ${f.id}\t${f.name}\t${f.usos}`).join("\n") +
      "\n\n" +
      inventory.flags.variables.filter((f) => f.name.trim()).map((f) => `VARIABLE ${f.id}\t${f.name}\t${f.usos}`).join("\n") +
      "\n"
  );
  const batallasPbs = trainers.sample
    .map((t) => {
      const header = `[${(t.trainerType || "?").toUpperCase()},${t.name}]`;
      const items = t.items && t.items.length ? `Items = ${t.items.join(",")}\n` : "";
      const lose = t.loseText ? `Lose Text = "${t.loseText}"\n` : "";
      const party = t.party
        .map((p) => {
          const bits = [`${(p.species || "?").toUpperCase()}`, p.level || 1];
          if (p.item) bits.push(p.item.toUpperCase());
          if (p.moves && p.moves.length) bits.push(p.moves.map((m) => m.toUpperCase()).join(","));
          return `Pokemon = ${bits.join(",")}`;
        })
        .join("\n");
      return `#-------------------------------\n${header}\n${items}${lose}${party}\n`;
    })
    .join("");
  fs.writeFileSync(
    path.join(outDir, "pbs", "entrenadores.txt"),
    `# ${trainers.total} entrenadores (${trainers.format}) — muestra de ${trainers.sample.length} exportada en formato PBS\n${batallasPbs}`
  );
  for (const [key, cat] of Object.entries(catalogos)) {
    if (!cat.total) continue;
    fs.writeFileSync(
      path.join(outDir, "pbs", `${key}.txt`),
      `# ${cat.total} registros (${cat.className})\n` +
        cat.filas.map((f) => `${f.id}\t${f.name}\t${Object.entries(f.extra).map(([k, v]) => `${k}=${v}`).join(" ")}`).join("\n") +
        "\n"
    );
  }
  fs.writeFileSync(
    path.join(outDir, "pbs", "npc_sprites.txt"),
    "# sprites de personaje usados por los eventos (nombre, usos)\n" +
      inventory.spritesMasUsados.map((s2) => `${s2.name}\t${s2.usos}`).join("\n") +
      "\n"
  );
  console.log(`Inventario de ${SLUG}: ${maps.length} mapas · ${eventsTotal} eventos · ${sink.textLines} líneas de texto · ${trainers.total} entrenadores`);
  console.log(`→ ${path.relative(ROOT, outDir)}/inventory.json`);
  console.log(`→ ${path.relative(ROOT, outDir)}/informe.md`);
  if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
  return inventory;
}

function renderReport(inv) {
  const top = (arr, key, n = 15) =>
    arr
      .slice()
      .sort((a, b) => (b[key] || 0) - (a[key] || 0))
      .slice(0, n)
      .map((m) => `- Map${m.id} · ${m.name || "(sin nombre)"} — ${m[key]} ${key === "commands" ? "comandos" : "eventos"}`)
      .join("\n");
  const flagsTop = (list) =>
    list
      .filter((f) => f.name && f.name.trim() && f.usos > 0)
      .slice(0, 40)
      .map((f) => `- [${f.id}] ${f.name} (${f.usos} usos)`)
      .join("\n");
  return `# Inventario de referencia: ${inv.slug}

Fuente: \`${inv.source}\` · ${inv.engine} · generado ${inv.generadoEn}
**Sólo metadatos: ningún sprite, música ni mapa del ROM se copia a Fire Ash.**

## Resumen

| Dato | Valor |
|---|---:|
| Mapas analizados | ${inv.resumen.mapas} de ${inv.resumen.mapasEnMapInfos} |
| Eventos | ${inv.resumen.eventos} |
| Páginas de evento | ${inv.resumen.paginas} |
| Comandos | ${inv.resumen.comandos} |
| Líneas de texto (diálogos) | ${inv.resumen.lineasDeTexto} |
| Switches con nombre | ${inv.resumen.switchesNombrados} |
| Variables con nombre | ${inv.resumen.variablesNombradas} |
| Switches usados en eventos | ${inv.resumen.switchesUsados} |
| Variables usadas en eventos | ${inv.resumen.variablesUsadas} |
| Eventos comunes (cinemáticas) | ${inv.resumen.commonEvents} |
| Entrenadores | ${inv.resumen.entrenadores} |

## Mapas con más contenido

${top(inv.mapas, "commands")}

## Mapas con más eventos

${top(inv.mapas, "events")}

## Flags más usadas (switches)

${flagsTop(inv.flags.switches) || "_Sin nombres de switch en System.rxdata._"}

## Variables más usadas

${flagsTop(inv.flags.variables) || "_Sin nombres de variable en System.rxdata._"}

## Cinemáticas (eventos comunes)

${
  inv.commonEvents
    .filter((c) => c.textLines > 0)
    .slice(0, 20)
    .map((c) => `**${c.id} · ${c.name || "(sin nombre)"}** — ${c.commands} comandos, ${c.textLines} líneas\n${c.preview.map((p) => `> ${p}`).join("\n")}`)
    .join("\n\n") || "_Sin eventos comunes con texto._"
}

## Recursos

${Object.entries(inv.graficos)
    .filter(([, v]) => v.count > 0)
    .map(([k, v]) => `- ${k}: ${v.count} archivos`)
    .join("\n")}
- Audio — BGM: ${inv.audio.BGM.count} · BGS: ${inv.audio.BGS.count} · ME: ${inv.audio.ME.count} · SE: ${inv.audio.SE.count}

## Entrenadores

${inv.batallas.total} entrenadores (${inv.batallas.formato}).
${
  inv.batallas.estadisticasEquipo
    ? `Equipo medio: ${inv.batallas.estadisticasEquipo.promedio} Pokémon · máximo: ${inv.batallas.estadisticasEquipo.maximo}.`
    : ""
}

${
  inv.batallas.muestra
    .slice(0, 12)
    .map(
      (t) =>
        `- **${t.trainerType} ${t.name}** — ${t.party.length} Pokémon (${t.party
          .map((p) => `${p.species} Nv${p.level}`)
          .join(", ")})${t.items && t.items.length ? ` · objetos: ${t.items.join(", ")}` : ""}`
    )
    .join("\n") || ""
}

## Catálogos de datos

${Object.entries(inv.catalogos || {})
  .map(([k, v]) => `- ${k}: ${v} registros`)
  .join("\n") || "_Sin catálogos .dat legibles._"}
`;
}

if (FLAGS.has("--help") || FLAGS.has("-h")) {
  console.log("Uso: node tools/inspect_guest_rom.mjs --dir <carpeta> [--slug nombre] [--limit-maps N]");
  process.exit(0);
}

if (FLAGS.has("--help") || FLAGS.has("-h")) {
  console.log("Uso: node tools/inspect_guest_rom.mjs --dir <carpeta> [--slug nombre] [--limit-maps N]");
  process.exit(0);
}

if (FLAGS.has("--selftest")) selftest();
else inspect();

/**
 * Autoprueba: ejecuta el analizador contra el propio Fire Ash (mismo motor que
 * los ROM invitados) y comprueba que entiende mapas, eventos, texto, flags,
 * cinemáticas y entrenadores. Escribe en el temporal, nunca en el repositorio.
 */
function selftest() {
  const game = path.join(ROOT, "pokemon_fire_ash");
  if (!fs.existsSync(path.join(game, "Data", "MapInfos.rxdata"))) {
    throw new Error("No encuentro pokemon_fire_ash para la autoprueba del analizador.");
  }
  const tempOut = fs.mkdtempSync(path.join(os.tmpdir(), "rom-selftest-"));
  try {
    const child = spawnSync(
      process.execPath,
      [fileURLToPath(import.meta.url), "--dir", game, "--slug", "selftest", "--limit-maps", "40"],
      { encoding: "utf8", env: { ...process.env, ROM_OUT_DIR: tempOut } }
    );
    if (child.status !== 0) {
      throw new Error(`El analizador falló:\n${child.stderr || child.stdout}`);
    }
    const inv = JSON.parse(fs.readFileSync(path.join(tempOut, "selftest", "inventory.json"), "utf8"));
    const fallos = [];
    if (!inv.resumen.mapas) fallos.push("no se analizó ningún mapa");
    if (!inv.resumen.eventos) fallos.push("no se encontraron eventos");
    if (!inv.resumen.lineasDeTexto) fallos.push("no se extrajo texto de diálogo");
    if (!inv.resumen.switchesNombrados) fallos.push("no se leyeron los nombres de los switches");
    if (!inv.resumen.entrenadores) fallos.push("no se leyeron los entrenadores");
    if (!inv.resumen.commonEvents) fallos.push("no se leyeron los eventos comunes");
    if (fallos.length) throw new Error(`Autoprueba del analizador de ROM: ${fallos.join("; ")}.`);
    console.log(
      `Autoprueba del analizador de ROM OK: ${inv.resumen.mapas} mapas · ${inv.resumen.eventos} eventos · ` +
        `${inv.resumen.lineasDeTexto} líneas de texto · ${inv.resumen.switchesNombrados} switches con nombre · ` +
        `${inv.resumen.entrenadores} entrenadores · ${inv.resumen.commonEvents} eventos comunes`
    );
  } finally {
    fs.rmSync(tempOut, { recursive: true, force: true });
  }
}
