# Política de IDs — tabla maestra de rangos usados

`docs/qa/politica_ids.md` — fijada en **FASE 12** del plan 900. Medida sobre los
datos reales del juego vivo (`pokemon_fire_ash/Data`) con el inventario
congelado (`tools/inventario_congelado.json`), el censo
(`tools/analyze_compiled_fire_ash.mjs`) y `MapInfos.rxdata`/`System.rxdata`.

Regla de oro (ver `docs/ESTADO_CONGELADO.md`): **nada original se edita; todo
entra por IDs nuevos y aditivos.** Esta tabla es el mapa de qué rango es de
quién y por dónde se puede crecer sin pisar a nadie.

## Mapas (3465 en disco · IDs 1–4419 · 3465 entradas en `MapInfos.rxdata`)

| Rango | Uso | Origen |
|---|---|---|
| 1–996 | Fire Ash original (`Intro` → `Stadium`, Galar incluido) | Original |
| 997–999 | Ciudad Teckel · Gimnasio Teckel · Afueras Teckel | PokeMod |
| 1000–1020 | Horizontes 500 (`Whisperwood Rescue Forest` → `Puerto Horizonte` → `Panteón Pokégod`) | PokeMod |
| 1021–2020 | Atlas Mil (1000 mapas, `Pueblo Campanario` → `Selva Prismática`) | PokeMod |
| 2021–2022 | Monte Silver rebuild (Falda · Cumbre) | PokeMod |
| 2023–2029 | Multiverso creepypasta (7 mapas: `La Torre que Escuchaba` … `La Consola de 1996`) | PokeMod |
| 2030–2038 | Monte Silver — Gruta de los Testigos + La Ruta de Dios (1F–7F + Aproximación Celestial) | PokeMod |
| 2040–2190 | Dimensional Nightmare (151 mapas; incluye NEXO 2136–2140 y Liga Oscura 2141–2142, no suman) | PokeMod |
| 2191 | Muelle de Atlas Mil | PokeMod |
| 2192–2193 | Liga Oscura (Umbral · Arena Final) | PokeMod |
| 2194 | Sótano Sellado de la Mansión (Isla Espejo) | PokeMod |
| 2195–2196 | Vía de las Nueve Eras · Gimnasio Atlas | PokeMod |
| 2200–2201 | Glazed (Bahía de Cedolán · Gimnasio) | PokeMod |
| 2210–2211 | Light Platinum (Costa de Lappet · Gimnasio) | PokeMod |
| 2220–2221 | Team Rocket (Base Subterránea · Núcleo del Mando) | PokeMod |
| 2230–2231 | Avenida de los Ocho Gimnasios · TFOH Cámara de la Primera Huella | PokeMod |
| 2240–2245 | Liquid Crystal (Santuario de Johto) · Factory Adventure (Núcleo de Ensamblaje) | PokeMod |
| 2250–2257 | Ocho gimnasios de Atlas (`Bruma` → `Cumbre`) | PokeMod |
| 2260–2265 | Glazed — Afueras de Cedolán · Casa del Pescador | PokeMod |
| 2270–2275 | Light Platinum — Senda Luminosa · Laboratorio del Fragmento | PokeMod |
| 2280–2286 | Team Rocket — Muelle de Infiltración · Sala de Comunicaciones | PokeMod |
| 2288 | Casa de Ash — Salón de Diplomas | PokeMod |
| 2300 | Isla Paraíso (Teckel) | PokeMod |
| 3000–3110 | Campañas ROM Glazed (111 mapas, `Pueblo Glenwood` → `Cumbre de Tunod`) | PokeMod |
| 3120–3138 | Campañas ROM Light Platinum (19, `Yellow Town` → `Drakenbreath`) | PokeMod |
| 3200–3631 | Campañas ROM Liquid Crystal (432, `Pueblo Primavera` → `Cima del Monte Plateado`) | PokeMod |
| 3700–3944 | Campañas ROM TFOH (245, `Capítulo 01` → `Capítulo 21`) | PokeMod |
| 4000–4419 | Campañas ROM Pokémon Unbound (420, `Capítulo 01` → `Capítulo 35`) | PokeMod |

**IDs libres (huecos) para mapas nuevos:** 2039 · 2197–2199 · 2202–2209 ·
2212–2219 · 2222–2229 · 2232–2239 · 2246–2249 · 2258–2259 · 2266–2269 ·
2276–2279 · 2287 · 2289–2299 · 2301–2999 · 3111–3119 · 3139–3199 · 3632–3699 ·
3945–3999 · 4420+.

## Switches (887 usados · IDs 1–994 · techo original: 700)

| Rango | Uso | Origen |
|---|---|---|
| 1–700 | Fire Ash original (historia, gimnasios, roaming, sistema) | Original |
| 701–707 | Base PokeMod (`HYPNO`, `HORIZONS`, `ATLAS MIL`) | Reservado PokeMod |
| 708–747 | Anclas Tier 1 (40) | Reservado PokeMod |
| 748–867 | Rutas Tier 2 (120) | Reservado PokeMod |
| 868–875 | Sellos multiversales / La Ruta de Dios (868–869 aún sin usar; 870–875 = `RUTA_DE_DIOS_*`, incl. el 873 del duelo de Arceus) | PokeMod |
| 876–880 | `RUTA_DE_DIOS_COMPLETED`, `SNOWPOINT_TEMPORARY_TREE_PASS`, cinemáticas de Arceus (878–880) | PokeMod |
| 882–939 | Dimensional Nightmare (`DN_UNLOCKED`, `DN_SELLO_EP*`…; 881 libre) | PokeMod |
| 940–947 | Sellos del Multiverso: siete emisiones (940–946) y RED en la cumbre (947) | PokeMod |
| 948–989 | Internos de campañas ROM (948–977 en uso; 978–989 libres) | PokeMod |
| 990–994 | `POKEMOD <CAMPAÑA> COMPLETADA` (Glazed, Light Platinum, Liquid Crystal, TFOH, Unbound) | PokeMod |

**Libres:** 881 · 978–989 · 995+. Verificación de colisiones: 0 (inventario congelado).

## Variables (293 usadas · IDs 1–354 · techo original: 100)

| Rango | Uso | Origen |
|---|---|---|
| 1–100 | Fire Ash original | Original |
| 101–103 | Contadores PokeMod (`HORIZONS COMPLETED`, `ATLAS MIL COMPLETED`, `ATLAS NARRATIVE SEALS`) | Reservado PokeMod |
| 104–143 | Decisiones Tier 1 (40) | Reservado PokeMod |
| 144–263 | Decisiones Tier 2 (120) | Reservado PokeMod |
| 264–307 | Dimensional Nightmare (`DN_PROGRESO_EPISODIOS`, `DN_RESONANCIA`, `DN_ANOMALIAS_EP*`…) | PokeMod |
| 308–349 | Misceláneo PokeMod: `PM_ROCKET_DISFRAZ` (314), atavíos (316–317), contadores internos de campañas (resto sin nombre) | PokeMod |
| 350–354 | `POKEMOD <CAMPAÑA> PROGRESO` (Glazed, Light Platinum, Liquid Crystal, TFOH, Unbound) | PokeMod |

**Libres:** 355+. El contador multiversal de purgas vive en la 264.

## Self-switches (8017 pares · letras A–E · en 2405 mapas)

- Clave: `mapa:evento:letra` — **espacio propio por mapa**, no necesita reserva
  global ni puede colisionar entre mapas.
- Original y PokeMod comparten el mecanismo sin conflicto: los originales no se
  tocan y el contenido nuevo usa self-switches en sus propios mapas/eventos.
- La letra E aparece además de A–D (uso puntual del contenido PokeMod).

## Trainer types (556 definidos · IDs 0–593 · `trainer_types.dat`)

| Rango | Uso | Origen |
|---|---|---|
| 0–261 | Fire Ash original (`POKEMONTRAINER_*`, líderes, élite, `GMAX_*`/`EMAX_*`) | Original |
| 262–299 | **LIBRES (38 IDs)** — siguiente bloque disponible para tipos nuevos | — |
| 300–515 | `SECRET_*` (216: secretos/rematches de toda la saga) | PokeMod |
| 516–558 | `SYGNA_*` (43: trajes Sygna, `GCVariables::SYGNA_TRAINERS`) | PokeMod |
| 559–593 | `DOJO_*`, `ANNI_*`, Arc Suit (35: dojos, aniversario, trajes Arc) | PokeMod |

Los tipos se referencian por símbolo (`pbTrainerBattle(:TIPO, "Nombre")`) y el
banco de entrenadores vive en `trainers.dat` (5547 entrenadores, clave
`TIPO|Nombre|versión`). Todo registro nuevo es aditivo.

## Mantenimiento

- Recalcular y comparar: `node tools/inventario_congelado.mjs --verify` (colisiones y rango reservado).
- Censo completo: `node tools/analyze_compiled_fire_ash.mjs`.
- Audit de flags: `npm run verify:all` · Detalle por ID: `tools/inventario_congelado.json` (`ids.switchesUsed`, `ids.variablesUsed`, `ids.selfSwitchesUsed`).

## Prefijo de nombres del plan 900 (FASE 24)

**Todo switch o variable que se cree durante el plan 900 se nombra con el
prefijo `POKEMOD 900 `** (un solo espacio tras `900`), seguido del nombre
descriptivo en MAYÚSCULAS:

- Switches: `POKEMOD 900 <PROPOSITO>` — p. ej. `POKEMOD 900 SELLO SECTOR 41`,
  `POKEMOD 900 PUERTA ABIERTA`.
- Variables: `POKEMOD 900 <PROPOSITO>` — p. ej. `POKEMOD 900 CONTADOR X`,
  `POKEMOD 900 DECISION Y`.

Reglas del prefijo:

1. **Asignación**: solo en territorio nuevo (switches **≥ 995**, variables
   **≥ 355**) o en los huecos reales marcados en `docs/AUDITORIA_TOTAL_FLAGS.md`
   (FASE 23). Nunca en la zona original (1–700 / 1–100) ni en IDs reservados.
2. **Nombre obligatorio**: ningún ID del plan 900 queda sin nombre en
   `System.rxdata`; el prefijo hace al ID trazable y auditable (regla de oro:
   todo lo PokeMod se distingue del original).
3. **Unicidad**: el prefijo `POKEMOD 900 ` estaba libre a la fijación de esta
   regla (0 switches y 0 variables lo usaban; verificado contra el inventario
   congelado). Cualquier colisión futura de nombres idénticos se trata como
   error de auditoría.
4. **Registro**: toda asignación nueva se anota aquí y en
   `docs/AUDITORIA_TOTAL_FLAGS.md`, y se regenera el inventario congelado.
5. **Self-switches y trainer types** no llevan el prefijo: los self-switches
   son `mapa:evento:letra` (espacio propio) y los trainer types son símbolos
   aditivos; si el plan crea trainer types, se prefijan `POKEMOD900_` en el
   símbolo para la misma trazabilidad.

