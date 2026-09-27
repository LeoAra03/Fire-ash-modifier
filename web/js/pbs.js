// ============================================================================
// pbs.js — Parser PBS de Pokémon Essentials (v19) que preserva formato
// ----------------------------------------------------------------------------
// Los PBS son INI con secciones [ID] y líneas Clave = Valor. Este parser guarda
// cada línea (código o comentario/blanco) para reescribir el archivo tocando
// SOLO las líneas editadas. Así no se rompe nada si hay campos desconocidos.
// ============================================================================

// Una línea: {kind:"section"|"kv"|"raw", section?, key?, value?, raw?}
export function parsePBS(text) {
  const lines = text.split(/\r?\n/);
  const out = [];
  let current = null;
  for (const raw of lines) {
    const t = raw.trim();
    const mSec = t.match(/^\[([^\]]+)\]\s*$/);
    if (mSec) {
      current = mSec[1].trim();
      out.push({ kind: "section", section: current, raw });
      continue;
    }
    if (t === "" || t.startsWith("#")) {
      out.push({ kind: "raw", section: current, raw });
      continue;
    }
    const mKv = raw.match(/^([^=]+?)=(.*)$/);
    if (mKv && current !== null) {
      out.push({ kind: "kv", section: current, key: mKv[1].trim(), value: mKv[2].trim(), raw });
      continue;
    }
    // Continuación multilínea (Pokedex, etc.) u otra cosa: se conserva tal cual
    out.push({ kind: "raw", section: current, raw });
  }
  return out;
}

export function pbsSections(lines) {
  const seen = [];
  for (const l of lines) if (l.kind === "section" && !seen.includes(l.section)) seen.push(l.section);
  return seen;
}

export function pbsGet(lines, section, key) {
  const l = lines.find((x) => x.kind === "kv" && x.section === section && x.key.toLowerCase() === key.toLowerCase());
  return l ? l.value : undefined;
}

export function pbsGetAll(lines, section, key) {
  return lines.filter((x) => x.kind === "kv" && x.section === section && x.key.toLowerCase() === key.toLowerCase());
}

export function pbsSet(lines, section, key, value) {
  // Devuelve true si cambió algo. Si la clave no existe, la inserta al final
  // de la sección (antes de la siguiente sección).
  const found = lines.find((x) => x.kind === "kv" && x.section === section && x.key.toLowerCase() === key.toLowerCase());
  if (found) {
    if (found.value === value) return false;
    found.value = value;
    found.raw = `${found.key} = ${value}`;
    return true;
  }
  // Insertar al final de la sección
  let idx = lines.findIndex((x) => x.kind === "section" && x.section === section);
  if (idx < 0) {
    lines.push({ kind: "section", section, raw: `[${section}]` });
    lines.push({ kind: "kv", section, key, value, raw: `${key} = ${value}` });
    return true;
  }
  let j = idx + 1;
  while (j < lines.length && lines[j].kind !== "section") j++;
  // retroceder sobre líneas en blanco finales de la sección
  let k = j - 1;
  while (k > idx && lines[k].kind === "raw" && lines[k].raw.trim() === "") k--;
  lines.splice(k + 1, 0, { kind: "kv", section, key, value, raw: `${key} = ${value}` });
  return true;
}

export function pbsToText(lines) {
  return lines.map((l) => {
    if (l.kind === "kv") return `${l.key} = ${l.value}`;
    return l.raw;
  }).join("\n");
}

// --- Esquemas de campos conocidos (para formularios) --------------------------------
// field: [clave, etiqueta, tipo]  tipo: text|number|list|select|moves
export const PBS_SCHEMAS = {
  "pokemon.txt": {
    label: "Pokémon",
    idLabel: "ID interno",
    fields: [
      ["Name", "Nombre", "text"],
      ["Types", "Tipos (coma)", "text"],
      ["BaseStats", "Stats base (HP,AT,DF,VE,AE,DE)", "text"],
      ["GenderRate", "Género", "select", ["AlwaysMale", "FemaleOneEighth", "Female25Percent", "Female50Percent", "Female75Percent", "FemaleSevenEighths", "AlwaysFemale", "Genderless"]],
      ["GrowthRate", "Crecimiento", "select", ["Slow", "MediumSlow", "Medium", "MediumFast", "Fast", "Erratic", "Fluctuating"]],
      ["BaseExp", "Exp. base", "number"],
      ["Rareness", "Ratio captura", "number"],
      ["Happiness", "Amistad base", "number"],
      ["Abilities", "Habilidades", "text"],
      ["HiddenAbilities", "H. ocultas", "text"],
      ["Moves", "Movimientos (Nv,Mov,…)", "text"],
      ["EggMoves", "Mov. huevo", "text"],
      ["Evolutions", "Evoluciones", "text"],
      ["Height", "Altura (m)", "text"],
      ["Weight", "Peso (kg)", "text"],
      ["Color", "Color", "text"],
      ["Shape", "Forma", "text"],
      ["Kind", "Categoría", "text"],
      ["Pokedex", "Entrada Pokédex", "text"],
    ],
  },
  "encounters.txt": {
    label: "Encuentros",
    idLabel: "Mapa",
    rawHint: "Cada sección es un mapa con densidades (Land, Water, Cave…) y líneas de encuentro.",
    fields: [],
  },
  "trainers.txt": {
    label: "Entrenadores",
    idLabel: "Tipo,Nombre",
    rawHint: "Cada sección define un entrenador y sus Pokémon (líneas 'Pokemon = …').",
    fields: [],
  },
  "map_metadata.txt": {
    label: "Metadatos de mapa",
    idLabel: "Mapa",
    fields: [
      ["Name", "Nombre mostrado", "text"],
      ["Outdoor", "Exterior (true/false)", "select", ["true", "false"]],
      ["ShowArea", "Mostrar área", "select", ["true", "false"]],
      ["Bicycle", "Bici permitida", "select", ["true", "false"]],
      ["BicycleAlways", "Bici siempre", "select", ["true", "false"]],
      ["HealingSpot", "Punto de curación (mapa,x,y)", "text"],
      ["Weather", "Clima (id,prob…)", "text"],
      ["MapPosition", "Posición en mapamundi", "text"],
      ["BattleBack", "Fondo de batalla", "text"],
    ],
  },
  "items.txt": {
    label: "Objetos",
    idLabel: "ID interno",
    fields: [
      ["Name", "Nombre", "text"],
      ["NamePlural", "Nombre plural", "text"],
      ["Pocket", "Bolsillo", "number"],
      ["Price", "Precio", "number"],
      ["Description", "Descripción", "text"],
      ["FieldUse", "Uso en campo", "select", ["Direct", "OnPokemon", "TM", "HM", "BerryPlant", "ApricornBox"]],
      ["BattleUse", "Uso en batalla", "select", ["OnPokemon", "OnFoe", "OnBattler", "Direct"]],
    ],
  },
  "moves.txt": {
    label: "Movimientos",
    idLabel: "ID interno",
    fields: [
      ["Name", "Nombre", "text"],
      ["Type", "Tipo", "text"],
      ["Category", "Categoría", "select", ["Physical", "Special", "Status"]],
      ["Power", "Potencia", "number"],
      ["Accuracy", "Precisión", "number"],
      ["TotalPP", "PP", "number"],
      ["EffectChance", "Prob. efecto", "number"],
      ["Target", "Objetivo", "text"],
      ["Priority", "Prioridad", "number"],
      ["Description", "Descripción", "text"],
    ],
  },
  "abilities.txt": {
    label: "Habilidades",
    idLabel: "ID interno",
    fields: [["Name", "Nombre", "text"], ["Description", "Descripción", "text"]],
  },
  "trainertypes.txt": {
    label: "Tipos de entrenador",
    idLabel: "ID interno",
    fields: [["Name", "Nombre", "text"], ["Money", "Dinero base", "number"], ["BattleBGM", "Música", "text"], ["VictoryME", "Fanfarria", "text"], ["Gender", "Género", "select", ["Male", "Female", "Mixed", "Unknown"]], ["SkillLevel", "Nivel IA", "number"]],
  },
};

export function schemaFor(filename) {
  const base = filename.split("/").pop().toLowerCase();
  // v19.1 guarda los metadatos de mapa en metadata.txt; v20+ en map_metadata.txt
  if (base === "metadata.txt") return PBS_SCHEMAS["map_metadata.txt"];
  return PBS_SCHEMAS[base] || null;
}

// --- Validación ligera -----------------------------------------------------------------
export function lintPBS(filename, text) {
  const issues = [];
  const lines = parsePBS(text);
  const seen = new Set();
  for (const l of lines) {
    if (l.kind === "section") {
      if (seen.has(l.section)) issues.push({ level: "warn", msg: `Sección duplicada: [${l.section}]` });
      seen.add(l.section);
    }
    if (l.kind === "kv" && l.value === "") {
      issues.push({ level: "info", msg: `[${l.section}] ${l.key} está vacío` });
    }
  }
  const base = filename.split("/").pop().toLowerCase();
  if (base === "pokemon.txt") {
    for (const s of seen) {
      if (!/^[A-Z0-9_]+$/.test(s)) issues.push({ level: "warn", msg: `ID de especie inusual: [${s}] (usa MAYÚSCULAS_)` });
    }
  }
  return issues;
}
