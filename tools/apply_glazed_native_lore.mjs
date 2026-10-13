// ============================================================================
// tools/apply_glazed_native_lore.mjs
// ----------------------------------------------------------------------------
// Fase 1 & 2: Integración Narrativa y Nombres Auténticos de Pokémon Glazed
// (Región de Tunod & Rankor · Mapas 3000 a 3110)
//
// Reemplaza los títulos genéricos de los 111 mapas de Glazed por sus nombres
// canónicos y enriquece los eventos con los personajes clave del ROM hack:
//   · Profesor Willow en Pueblo Glenwood (Map 3000)
//   · Scarf Pikachu (el legendario Pikachu con bufanda interdimensional)
//   · Los rivales Percy y Chelle
//   · Los comandantes del Team Fusion (Henri, Blake, Regina)
//   · Los 8 Gimnasios oficiales de Tunod y sus 8 Medallas canónicas
// ============================================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marshalLoad, marshalDump, RString, RObject } from "../web/js/marshal.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const DATA = path.join(ROOT, "pokemon_fire_ash/Data");
const PKG_DATA = path.join(ROOT, "Scripts_corregido/Paquete_directo/Data");

const S = (text) => RString.fromText(String(text));
const txt = (v) => (v && v.bytes ? new TextDecoder().decode(v.bytes) : String(v || ""));

const GLAZED_LOCATIONS = [
  // Capítulo 1: Glenwood, Ruta 41, Chocovine (Gimnasio 1 - Jolt)
  { id: 3000, name: "Glazed · Pueblo Glenwood (Lab. de Willow)" },
  { id: 3001, name: "Glazed · Ruta 41 (Senda Costera)" },
  { id: 3002, name: "Glazed · Pueblo Chocovine (Santuario del Molino)" },
  { id: 3003, name: "Glazed · Caverna Glacial 1F" },
  { id: 3004, name: "Glazed · Costa del Reloj" },
  { id: 3005, name: "Glazed · Bosque de Chocovine" },
  { id: 3006, name: "Glazed · Gimnasio Sparkfly (Medalla Jolt)" },
  { id: 3007, name: "Glazed · Meseta de la Brisa" },
  { id: 3008, name: "Glazed · Casa del Guardabosques" },
  { id: 3009, name: "Glazed · Ruta 41 Norte" },
  { id: 3010, name: "Glazed · Arboleda Oculta" },
  { id: 3011, name: "Glazed · Paso Fronterizo de Chocovine" },

  // Capítulo 2: Ruta 42, Oceanview City, Central Eléctrica (Gimnasio 2 - Sprout)
  { id: 3012, name: "Glazed · Ciudad Oceanview (Muelle & Faro)" },
  { id: 3013, name: "Glazed · Ruta 42 (Paso Marino)" },
  { id: 3014, name: "Glazed · Central Eléctrica de Oceanview" },
  { id: 3015, name: "Glazed · Parque Energético" },
  { id: 3016, name: "Glazed · Gimnasio Oceanview (Medalla Sprout)" },
  { id: 3017, name: "Glazed · Laboratorio Marítimo" },
  { id: 3018, name: "Glazed · Dársena de Pescadores" },
  { id: 3019, name: "Glazed · Ruta 42 Este" },
  { id: 3020, name: "Glazed · Almacén del Team Fusion" },
  { id: 3021, name: "Glazed · Paseo de las Palmeras" },
  { id: 3022, name: "Glazed · Mirador del Océano" },
  { id: 3023, name: "Glazed · Subterráneo de Oceanview" },
  { id: 3024, name: "Glazed · Torre de Transmisión" },
  { id: 3025, name: "Glazed · Estación del Transbordador" },

  // Capítulo 3: Ruta 43, Isla Serenidad, Bahía Sol (Gimnasio 3 - Pure)
  { id: 3026, name: "Glazed · Isla Serenidad (Balneario)" },
  { id: 3027, name: "Glazed · Ruta 43 (Arrecife de Coral)" },
  { id: 3028, name: "Glazed · Faro de Serenidad" },
  { id: 3029, name: "Glazed · Gruta del Resplandor" },
  { id: 3030, name: "Glazed · Bahía del Sol Poniente" },
  { id: 3031, name: "Glazed · Gimnasio Serenity (Medalla Pure)" },
  { id: 3032, name: "Glazed · Jardín Zen de Serenidad" },
  { id: 3033, name: "Glazed · Acantilado Tranquilo" },
  { id: 3034, name: "Glazed · Cala de las Conchas" },
  { id: 3035, name: "Glazed · Centro de Buceo" },
  { id: 3036, name: "Glazed · Banco de Arena" },
  { id: 3037, name: "Glazed · Pasadizo Submarino" },
  { id: 3038, name: "Glazed · Embarcadero de Serenidad" },

  // Capítulo 4: Cabo Azure, Espoir City (Gimnasio 4 - Mud)
  { id: 3039, name: "Glazed · Ciudad Espoir (Cabo Azure)" },
  { id: 3040, name: "Glazed · Ruta 44 (Senda de Espoir)" },
  { id: 3041, name: "Glazed · Playa Esmeralda" },
  { id: 3042, name: "Glazed · Acuario de Espoir" },
  { id: 3043, name: "Glazed · Gruta Costera de Azure" },
  { id: 3044, name: "Glazed · Cabo Azure (Mirador del Faro)" },
  { id: 3045, name: "Glazed · Academia de Entrenadores de Espoir" },
  { id: 3046, name: "Glazed · Jardines Botánicos" },
  { id: 3047, name: "Glazed · Gimnasio Espoir (Medalla Mud)" },
  { id: 3048, name: "Glazed · Puesto de Guardia" },
  { id: 3049, name: "Glazed · Cueva de la Marea" },
  { id: 3050, name: "Glazed · Albergue de Montaña" },
  { id: 3051, name: "Glazed · Colina de los Vientos" },
  { id: 3052, name: "Glazed · Paso hacia Mt. Stratus" },

  // Capítulo 5: Stormy City, Mt. Stratus (Gimnasio 5 - Coral)
  { id: 3053, name: "Glazed · Ciudad Stormy (Valle de Tormentas)" },
  { id: 3054, name: "Glazed · Mt. Stratus (Base de la Montaña)" },
  { id: 3055, name: "Glazed · Mt. Stratus (Túneles Interiores 1F)" },
  { id: 3056, name: "Glazed · Mt. Stratus (Caverna de Hielo)" },
  { id: 3057, name: "Glazed · Puesto de Avanzada Team Fusion" },
  { id: 3058, name: "Glazed · Mt. Stratus (Cornisa Nevada)" },
  { id: 3059, name: "Glazed · Laboratorio Clandestino de Fusión" },
  { id: 3060, name: "Glazed · Mt. Stratus (Cumbre Helada)" },
  { id: 3061, name: "Glazed · Refugio del Alpinista" },
  { id: 3062, name: "Glazed · Garganta del Viento Blanco" },
  { id: 3063, name: "Glazed · Gimnasio Stormy (Medalla Coral)" },
  { id: 3064, name: "Glazed · Desfiladero de las Sombras" },
  { id: 3065, name: "Glazed · Pista de Aterrizaje Fusion" },
  { id: 3066, name: "Glazed · Bajada hacia Darkwood" },

  // Capítulo 6: Darkwood Town, Iglesia de Pikachu (Gimnasio 6 - Venom)
  { id: 3067, name: "Glazed · Pueblo Darkwood (Bosque Umbrío)" },
  { id: 3068, name: "Glazed · Iglesia de Pikachu (Templo del Lenguaje)" },
  { id: 3069, name: "Glazed · Bosque de las Sombras 1F" },
  { id: 3070, name: "Glazed · Bosque de las Sombras 2F (Península)" },
  { id: 3071, name: "Glazed · Cripta Sagrada de Darkwood" },
  { id: 3072, name: "Glazed · Mansión Abandonada de Tunod" },
  { id: 3073, name: "Glazed · Santuario Espectral" },
  { id: 3074, name: "Glazed · Cementerio de las Brumas" },
  { id: 3075, name: "Glazed · Claro de los Espíritus" },
  { id: 3076, name: "Glazed · Casa de la Médium" },
  { id: 3077, name: "Glazed · Pasaje Secreto de la Iglesia" },
  { id: 3078, name: "Glazed · Altar del Scarf Pikachu" },
  { id: 3079, name: "Glazed · Gimnasio Darkwood (Medalla Venom)" },
  { id: 3080, name: "Glazed · Camino hacia Geminite" },

  // Capítulo 7: Geminite Village, Minas de Geminite (Gimnasio 7 - Plain)
  { id: 3081, name: "Glazed · Aldea Geminite (Valle de los Cristales)" },
  { id: 3082, name: "Glazed · Mina de Geminite 1F" },
  { id: 3083, name: "Glazed · Mina de Geminite 2F (Galería de Gemas)" },
  { id: 3084, name: "Glazed · Pozo de Excavación" },
  { id: 3085, name: "Glazed · Fundición de Geminite" },
  { id: 3086, name: "Glazed · Caverna de Cuarzo Resonante" },
  { id: 3087, name: "Glazed · Taller del Orfebre" },
  { id: 3088, name: "Glazed · Gruta de los Zafiros" },
  { id: 3089, name: "Glazed · Terraza Rocosa de Geminite" },
  { id: 3090, name: "Glazed · Campamento Minero" },
  { id: 3091, name: "Glazed · Fisura Subterránea" },
  { id: 3092, name: "Glazed · Paso Alto de Geminite" },
  { id: 3093, name: "Glazed · Almacén de Minerales" },
  { id: 3094, name: "Glazed · Gimnasio Geminite (Medalla Plain)" },
  { id: 3095, name: "Glazed · Sendero de la Liga de Tunod" },

  // Capítulo 8: Safari Tunod, Altar Fusión, Liga Tunod & Cumbre (Gimnasio 8 - Spark & Final)
  { id: 3096, name: "Glazed · Safari de Tunod (Entrada Principal)" },
  { id: 3097, name: "Glazed · Safari de Tunod (Área Pantanosa)" },
  { id: 3098, name: "Glazed · Safari de Tunod (Área Rocosa)" },
  { id: 3099, name: "Glazed · Safari de Tunod (Área Pradera)" },
  { id: 3100, name: "Glazed · Avenida de la Victoria de Tunod" },
  { id: 3101, name: "Glazed · Puerta de los Campeones de Tunod" },
  { id: 3102, name: "Glazed · Altar de la Fusión Dimensional" },
  { id: 3103, name: "Glazed · Cámara del Núcleo Temporal" },
  { id: 3104, name: "Glazed · Terraza de la Convergencia" },
  { id: 3105, name: "Glazed · Salón de Honor de Tunod" },
  { id: 3106, name: "Glazed · Coliseo de la Liga de Tunod" },
  { id: 3107, name: "Glazed · Torre de Enlace Tunod-Rankor" },
  { id: 3108, name: "Glazed · Pasarela Espacial de Rankor" },
  { id: 3109, name: "Glazed · Gimnasio Alto de Tunod (Medalla Spark)" },
  { id: 3110, name: "Glazed · Cumbre de Tunod (Duelo Final Team Fusion)" },
];

export function applyGlazedLore() {
  console.log("Aplicando títulos canónicos y narrativa auténtica de Pokémon Glazed...");

  // 1. Actualizar MapInfos.rxdata en desarrollo y paquete
  for (const dir of [DATA, PKG_DATA]) {
    const infosPath = path.join(dir, "MapInfos.rxdata");
    if (!fs.existsSync(infosPath)) continue;
    const infos = marshalLoad(new Uint8Array(fs.readFileSync(infosPath)));
    let updated = 0;
    for (const loc of GLAZED_LOCATIONS) {
      const entry = infos.pairs.find(([id]) => Number(id) === loc.id);
      if (entry) {
        entry[1].setIvar("@name", S(loc.name));
        updated++;
      }
    }
    fs.writeFileSync(infosPath, Buffer.from(marshalDump(infos)));
    console.log(`✔ ${infosPath}: ${updated} nombres de mapa de Glazed actualizados.`);
  }

  // 2. Personalizar eventos icónicos en Map3000 (Glenwood Town)
  for (const dir of [DATA, PKG_DATA]) {
    const map3000Path = path.join(dir, "Map3000.rxdata");
    if (!fs.existsSync(map3000Path)) continue;
    const map3000 = marshalLoad(new Uint8Array(fs.readFileSync(map3000Path)));
    const evs = map3000.getIvar("events");

    // Evento Profesor Willow (Ev 6)
    const evWillow = evs.pairs.find(([id]) => id === 6)?.[1];
    if (evWillow) {
      evWillow.setIvar("@name", S("PokeMod Glazed: Profesor Willow"));
      const p = evWillow.getIvar("pages")[0];
      const list = p.getIvar("list");
      list.length = 0;
      list.push(
        new RObject("RPG::EventCommand", [["@code", 101], ["@indent", 0], ["@parameters", [S("\\sp[Prof. Willow]")]]]),
        new RObject("RPG::EventCommand", [["@code", 401], ["@indent", 0], ["@parameters", [S("Profesor Willow: ¡Bienvenido a Glenwood Town, Ash! He detectado intensas oscilaciones en el tejido del espacio.")]]]),
        new RObject("RPG::EventCommand", [["@code", 401], ["@indent", 0], ["@parameters", [S("Un grupo llamado Team Fusion está desestabilizando las dimensiones para colapsar nuestra región de Tunod.")]]]),
        new RObject("RPG::EventCommand", [["@code", 401], ["@indent", 0], ["@parameters", [S("Ash: ¡No permitiremos que dañen este mundo! Con Pikachu y mi equipo te ayudaremos a restaurar el equilibrio.")]]]),
        new RObject("RPG::EventCommand", [["@code", 0], ["@indent", 0], ["@parameters", []]])
      );
    }

    // Evento Scarf Pikachu (Ev 7)
    const evScarfPika = evs.pairs.find(([id]) => id === 7)?.[1];
    if (evScarfPika) {
      evScarfPika.setIvar("@name", S("PokeMod Glazed: Scarf Pikachu"));
      const p = evScarfPika.getIvar("pages")[0];
      p.getIvar("graphic").setIvar("@character_name", S("Pikachu"));
      const list = p.getIvar("list");
      list.length = 0;
      list.push(
        new RObject("RPG::EventCommand", [["@code", 101], ["@indent", 0], ["@parameters", [S("\\sp[Scarf Pikachu]")]]]),
        new RObject("RPG::EventCommand", [["@code", 401], ["@indent", 0], ["@parameters", [S("Pikachu con bufanda: ¡Pika! (Lleva una elegante bufanda roja atada al cuello y mira fijamente al Pikachu de Ash.)")]]]),
        new RObject("RPG::EventCommand", [["@code", 401], ["@indent", 0], ["@parameters", [S("Ash: ¡Mira Pikachu, lleva una bufanda como los exploradores! Parece advertirnos de peligros en el Monte Stratus.")]]]),
        new RObject("RPG::EventCommand", [["@code", 0], ["@indent", 0], ["@parameters", []]])
      );
    }

    // Evento Rival Percy (Ev 8)
    const evPercy = evs.pairs.find(([id]) => id === 8)?.[1];
    if (evPercy) {
      evPercy.setIvar("@name", S("PokeMod Glazed: Rival Percy"));
      const p = evPercy.getIvar("pages")[0];
      const list = p.getIvar("list");
      list.length = 0;
      list.push(
        new RObject("RPG::EventCommand", [["@code", 101], ["@indent", 0], ["@parameters", [S("\\sp[Percy]")]]]),
        new RObject("RPG::EventCommand", [["@code", 401], ["@indent", 0], ["@parameters", [S("Percy: ¿Tú también vas a desafiar los 8 gimnasios de Tunod? ¡Yo seré el primero en conquistar la Liga!")]]]),
        new RObject("RPG::EventCommand", [["@code", 401], ["@indent", 0], ["@parameters", [S("Ash: ¡Acepto el desafío! Nos vemos en Chocovine y en las cumbres nevadas.")]]]),
        new RObject("RPG::EventCommand", [["@code", 0], ["@indent", 0], ["@parameters", []]])
      );
    }

    // Evento Team Fusion Scout (Ev 9)
    const evFusion = evs.pairs.find(([id]) => id === 9)?.[1];
    if (evFusion) {
      evFusion.setIvar("@name", S("PokeMod Glazed: Team Fusion Recluta"));
      const p = evFusion.getIvar("pages")[0];
      const list = p.getIvar("list");
      list.length = 0;
      list.push(
        new RObject("RPG::EventCommand", [["@code", 101], ["@indent", 0], ["@parameters", [S("\\sp[Team Fusion]")]]]),
        new RObject("RPG::EventCommand", [["@code", 401], ["@indent", 0], ["@parameters", [S("Recluta Fusion: La Jefa Regina tiene el control del Núcleo Temporal. ¡Nadie podrá detener la fusión de Tunod!")]]]),
        new RObject("RPG::EventCommand", [["@code", 0], ["@indent", 0], ["@parameters", []]])
      );
    }

    fs.writeFileSync(map3000Path, Buffer.from(marshalDump(map3000)));
    console.log(`✔ ${map3000Path}: eventos de Glenwood Town personalizados con Willow, Scarf Pikachu, Percy y Team Fusion.`);
  }

  // 3. Personalizar la batalla final en Map3110 (Cumbre de Tunod) contra Regina
  for (const dir of [DATA, PKG_DATA]) {
    const map3110Path = path.join(dir, "Map3110.rxdata");
    if (!fs.existsSync(map3110Path)) continue;
    const map3110 = marshalLoad(new Uint8Array(fs.readFileSync(map3110Path)));
    const evs = map3110.getIvar("events");
    const evFinal = evs.pairs.find(([id]) => id === 10)?.[1];
    if (evFinal) {
      evFinal.setIvar("@name", S("PokeMod Glazed: Líder Suprema Regina — Team Fusion"));
      const p0 = evFinal.getIvar("pages")[0];
      const list = p0.getIvar("list");
      // Localizar el primer ShowText y enriquecer el diálogo
      const textCmds = list.filter((c) => c.getIvar("code") === 401);
      if (textCmds.length >= 2) {
        textCmds[0].setIvar("@parameters", [S("Regina: ¡Ash! Has superado los 8 gimnasios de Tunod, pero el Team Fusion no se detendrá ante nadie.")] );
        textCmds[1].setIvar("@parameters", [S("¡Si derrotas a mi equipo ancestral, devolveré el Núcleo Temporal y sellaré la fractura de Tunod!")] );
      }
      fs.writeFileSync(map3110Path, Buffer.from(marshalDump(map3110)));
      console.log(`✔ ${map3110Path}: batalla final de Glazed actualizada con el duelo definitivo contra Regina del Team Fusion.`);
    }
  }

  console.log("OK: Integración de lore y nombres auténticos de Pokémon Glazed completada.");
}

// Ejecución directa si se llama con node
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  applyGlazedLore();
}
