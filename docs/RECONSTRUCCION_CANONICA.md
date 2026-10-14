# Reconstrucción canónica

Inicio: 2026-10-14T17:10:22.439Z
Resultado: OK

Orden obligatorio: expansión multiversal, canon de Arceus, protección de `Tone.new`, protección de `transition_name`.

Idempotencia: `apply_tone_safety_fix.mjs` y `apply_transition_safety_fix.mjs` no reescriben ni regeneran el ZIP si el parche ya está y los tres artefactos coinciden byte a byte. `apply_expansion_multiversal.mjs` y `upsertEvents` reutilizan el ID del evento del mismo nombre; antes cada pasada lo incrementaba.

## Expansión Multiversal

- Script: `tools/apply_expansion_multiversal.mjs`
- Precondición: OK — Data del juego y el plano de la expansión están presentes. No exige switches previos: este paso es el que instala los sellos base.
- Instalación: exit 0 en 1618 ms
- Verificación: exit 0 en 326 ms
- Archivos tocados en este paso (git status nuevo respecto al inicio del paso): 1

- ` M pokemon_fire_ash/Data/Map192.rxdata`

### Instalación — salida literal

```
Expansión Multiversal instalada. Cápsulas retiradas del laboratorio: 1. Eventos del laboratorio ahora: 27. Backup: pokemon_fire_ash/PokeModBackups/expansion_multiversal
Verificación OK: 7 grietas con Entrar/Retirarse y retorno al mundo, punto de colapso con 7 purgas, Liga Oscura (2 mapas, 5 combates que se pueden perder), capitán de Atlas Mil, espejo de Isla Canela y laboratorio de Oak sin cápsula nueva.
```

### --verify — salida literal

```
Verificación OK: 7 grietas con Entrar/Retirarse y retorno al mundo, punto de colapso con 7 purgas, Liga Oscura (2 mapas, 5 combates que se pueden perder), capitán de Atlas Mil, espejo de Isla Canela y laboratorio de Oak sin cápsula nueva.
```

## Canon de Arceus

- Script: `tools/apply_canon_arceus.mjs`
- Precondición: OK — La expansión verifica sus sellos, grietas y retornos. El canon puede exigir el duelo encima de esa base.
- Instalación: exit 0 en 386 ms
- Verificación: exit 0 en 120 ms
- Archivos tocados en este paso (git status nuevo respecto al inicio del paso): 0

### Precondición — salida literal

```
Verificación OK: 7 grietas con Entrar/Retirarse y retorno al mundo, punto de colapso con 7 purgas, Liga Oscura (2 mapas, 5 combates que se pueden perder), capitán de Atlas Mil, espejo de Isla Canela y laboratorio de Oak sin cápsula nueva.
```

### Instalación — salida literal

```
✔ Canon de Arceus aplicado sobre pokemon_fire_ash
  · guion PokeMod_CanonArceus: actualizado (581 líneas, 6 fases con abuso de mecánicas)
  · Scripts_corregido/Scripts.rxdata: actualizado (mismas nueve correcciones de estabilidad)
  · Rotom del Tiempo — la Isla Espejo: mapa 2194 en (20,24)
  · Rotom del Tiempo — Atlas Mil: mapa 108 en (35,36)
  · Rotom del Tiempo — el mundo creepypasta: mapa 143 en (11,18)
  · Fragmento del Génesis: mapa 2037 en (23,9)
  · puerta cerrada — el espejo del Sótano Sellado de la Mansión: mapa 2194 (1 páginas)
  · puerta cerrada — la escotilla de la Mansión Pokémon: mapa 192 (2 páginas)
  · puerta cerrada — el capitán del puerto de Ciudad Carmín: mapa 108 (2 páginas)
  · puerta cerrada — el guardabosques que abre la ruta al puerto: mapa 43 (0 páginas)
  · puerta cerrada — la grieta del mundo creepypasta: mapa 143 (2 páginas)
  · Oak: 12 páginas nuevas en el mapa 48
  · Mad Pikachu: eco del Génesis en el mapa 2142 (14,10), junto a "LIGA_MPIKA"
✔ Verificación posterior OK.
```

### --verify — salida literal

```
✔ Canon de Arceus verificado.
  · todas las puertas exigen el duelo de La Ruta de Dios
  · Fragmento del Génesis en la cumbre, solo tras el duelo
  · Rotom del Tiempo en los tres accesos
  · Oak habla de las dimensiones y Arceus aparece si fue capturado
  · el combate doblega una regla distinta por fase
```

## Protección de Tone

- Script: `tools/apply_tone_safety_fix.mjs`
- Precondición: OK — Game_Screen, Game_Picture y PokeMod_CanonArceus están en el Scripts.rxdata corregido.
- Instalación: exit 0 en 139 ms
- Verificación: exit 0 en 85 ms
- Archivos tocados en este paso (git status nuevo respecto al inicio del paso): 0

### Instalación — salida literal

```
Protección de tonos ya aplicada; no se reescribe (idempotente).
OK: Game_Screen y Game_Picture recuperan tonos guardados como String
OK: Scripts_corregido, Paquete_directo y ZIP contienen la misma corrección
```

### --verify — salida literal

```
OK: Game_Screen y Game_Picture recuperan tonos guardados como String
OK: Scripts_corregido, Paquete_directo y ZIP contienen la misma corrección
```

## Protección de transition_name

- Script: `tools/apply_transition_safety_fix.mjs`
- Precondición: OK — Scene_Map existe y el parche de tono ya está en Game_Screen.
- Instalación: exit 0 en 133 ms
- Verificación: exit 0 en 86 ms
- Archivos tocados en este paso (git status nuevo respecto al inicio del paso): 0

### Instalación — salida literal

```
Corrección de transition_name ya aplicada; no se reescribe (idempotente).
OK: Scene_Map usa la transición predeterminada cuando transition_name es nil/vacío
OK: Scripts_corregido, Paquete_directo y ZIP están sincronizados
```

### --verify — salida literal

```
OK: Scene_Map usa la transición predeterminada cuando transition_name es nil/vacío
OK: Scripts_corregido, Paquete_directo y ZIP están sincronizados
```

## Verificadores finales

### tools/qa/ruby_syntax_check.mjs

- OK — exit 0

```
✔ pokemon_fire_ash/Data/Scripts.rxdata · PokeMod_Dialogos
✔ pokemon_fire_ash/Data/Scripts.rxdata · PokeMod_ZMenu
✔ pokemon_fire_ash/Data/Scripts.rxdata · PokeMod_Graficos
✔ pokemon_fire_ash/Data/Scripts.rxdata · PokeMod_Atavios
✔ pokemon_fire_ash/Data/Scripts.rxdata · PokeMod_BadgeRegions
✔ pokemon_fire_ash/Data/Scripts.rxdata · PokeMod_CanonArceus
✔ Scripts_corregido/Scripts.rxdata · PokeMod_Dialogos
✔ Scripts_corregido/Scripts.rxdata · PokeMod_ZMenu
✔ Scripts_corregido/Scripts.rxdata · PokeMod_Graficos
✔ Scripts_corregido/Scripts.rxdata · PokeMod_Atavios
✔ Scripts_corregido/Scripts.rxdata · PokeMod_BadgeRegions
✔ Scripts_corregido/Scripts.rxdata · PokeMod_CanonArceus
✔ Scripts_corregido/Paquete_directo/Data/Scripts.rxdata · PokeMod_Dialogos
✔ Scripts_corregido/Paquete_directo/Data/Scripts.rxdata · PokeMod_ZMenu
✔ Scripts_corregido/Paquete_directo/Data/Scripts.rxdata · PokeMod_Graficos
✔ Scripts_corregido/Dimensional_Nightmare_QA/Data/Scripts.rxdata · PokeMod_Dialogos
✔ Scripts_corregido/Dimensional_Nightmare_QA/Data/Scripts.rxdata · PokeMod_ZMenu
✔ Scripts_corregido/Dimensional_Nightmare_QA/Data/Scripts.rxdata · PokeMod_Graficos

18 sección(es) Ruby revisadas · ✔ sin errores

(node:2874) ExperimentalWarning: WASI is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
```

### tools/audit_all_flags.mjs

- OK — customConflicts=0

```
{
  "switchSlots": 994,
  "namedSwitches": 882,
  "literalSwitchesUsed": 888,
  "variableSlots": 354,
  "namedVariables": 306,
  "literalVariablesUsed": 293,
  "selfSwitchKeys": 8037,
  "dynamicExpressions": 89,
  "customConflicts": 0
}
docs/AUDITORIA_TOTAL_FLAGS.md
pokemon_fire_ash/PokeModBackups/auditoria_flags_total.json
```

### tools/qa/scripts_dangling_calls.mjs

- OK — exit 0

```
Secciones analizadas: 409
Métodos definidos en el juego: 4930
Llamadas sin definición conocida: 0
Patrones de campo peligrosos (R10): 0
OK: ninguna llamada apunta a un método inexistente en los scripts instalados.
OK: ningún script escribe clima, terreno o talentos que el motor rechace (R10).
```

## Diff resumido

Cambios de git status aparecidos durante la orquestación:

- Ninguno.

```
 .gitignore                             |   3 +
 docs/AUDITORIA_TOTAL_FLAGS.md          | 519 ++++++++++++++++++++-------------
 pokemon_fire_ash/Data/Map108.rxdata    | Bin 139770 -> 139770 bytes
 pokemon_fire_ash/Data/Map143.rxdata    | Bin 9378 -> 9378 bytes
 pokemon_fire_ash/Data/Map2142.rxdata   | Bin 18468 -> 18452 bytes
 pokemon_fire_ash/Data/Map2192.rxdata   | Bin 78383 -> 78274 bytes
 pokemon_fire_ash/Data/Map2193.rxdata   | Bin 195871 -> 195767 bytes
 pokemon_fire_ash/Data/Map2194.rxdata   | Bin 18457 -> 18442 bytes
 pokemon_fire_ash/Data/MapInfos.rxdata  | Bin 241938 -> 241938 bytes
 pokemon_fire_ash/Data/map_metadata.dat | Bin 510855 -> 510855 bytes
 tools/apply_expansion_multiversal.mjs  |  48 ++-
 tools/apply_tone_safety_fix.mjs        |  50 +++-
 tools/apply_transition_safety_fix.mjs  |  37 ++-
 tools/lib/dn_rmxp.mjs                  |  34 ++-
 14 files changed, 453 insertions(+), 238 deletions(-)
```
