# Auditoría integral del repositorio y sus recursos

> **Fecha:** 2026-10-05 · **Alcance:** árbol de trabajo completo, archivos versionados, paquetes comprimidos, datos del juego, herramientas y dependencias disponibles. Índice máquina: [`toolkit/INDICE_HERRAMIENTAS.json`](../toolkit/INDICE_HERRAMIENTAS.json).
>
> **Conclusión corta:** este repositorio sí tiene una base extensa para seguir modificando **el Fire Ash que ya está aquí** y producir aventuras originales. **No contiene las ROMs invitadas** que hacen falta para absorber datos de Emerald, Crystal, Glazed, Light Platinum, Team Rocket o FactoryAdventure. Los informes de análisis de esas ROMs son documentación histórica: los insumos y salidas no están en este checkout.

## 1. Cómo se hizo el censo

- Se enumeraron los archivos del proyecto y de sus carpetas principales, sin mover ni modificar los datos del juego.
- Se compararon los archivos `MapNNN.rxdata` con las claves de `Data/MapInfos.rxdata`, normalizando ceros a la izquierda.
- Se probaron **los 11 ZIP** encontrados con `unzip -t` y se inspeccionaron sus listas de entradas para buscar ROMs/parches.
- Se comprobaron los nombres, tamaños y cabeceras de los **20 RAR**. No se pudo listar su contenido porque no hay descompresor RAR en este entorno.
- Se revisaron scripts, datos de contenido y herramientas disponibles en el sistema.

Los RAR de Tiled/Porymap tienen firma RAR5. Su contenido no se presenta como inspeccionado. Los ZIP sí se pudieron leer: **ninguno contiene entradas con extensiones `.gba`, `.gb`, `.gbc`, `.nds`, `.ips`, `.ups`, `.bps` o `.xdelta`.**

## 2. Lo que sí está completo en el repositorio

### Fire Ash base

`pokemon_fire_ash/` contiene **22.804 archivos**: el juego Windows (`Game.exe`), `Data/`, gráficos, audio, fuentes y archivos auxiliares.

| Área | Inventario medido |
|---|---:|
| `Data/` | 2.293 archivos |
| Mapas numéricos `Map*.rxdata` | **2.229** |
| Registros en `MapInfos.rxdata` | **2.229** |
| Mapas sin archivo o sin registro | **0** |
| `Graphics/` | 15.829 archivos: 15.822 PNG, 6 XCF y 1 BMP |
| `Audio/` | 4.650 archivos: 2.714 OGG, 1.834 WAV, 61 MP3 y 40 MIDI (más 1 INI) |

El conteo de **2.229** es el estado real de los datos en este checkout. Algunos informes anteriores dicen 2.210; consulta esta auditoría para la cifra actual.

El censo cuenta solo los nombres canónicos `MapNNN.rxdata`. También existen `Map341 2.rxdata` y `Map813b.rxdata`: ambos son archivos distintos de `Map341.rxdata`/`Map813.rxdata` y no figuran como IDs separados en `MapInfos.rxdata`. Además, `Map081.BAK` es una copia de respaldo. Los dejé intactos; conviene verificar su procedencia antes de limpiar o renombrar. No se encontró referencia textual a los dos nombres no canónicos en el código legible.

El `Game.exe` es un ejecutable PE de Windows. Está presente, pero no se puede lanzar en este entorno Linux: no hay Wine. Los archivos de juego `.rxdata` que ya están en `pokemon_fire_ash/Data/` son datos del proyecto; no son ROMs GBA.

### Mod y entregables

`Scripts_corregido/` contiene **887 archivos** (aprox. 98,3 MiB), entre ellos:

- `Paquete_directo/`: **297 archivos** (11.595.689 bytes), la copia de entrega del mod.
- `Scripts.rxdata` corregido y los paquetes de expansión, QA, mapas e informes.
- `Fire_Ash_Paquete_Directo.zip`, `Dimensional_Nightmare_QA.zip` y `Mapas_PNG_y_Informe_Referencial.zip`.

El ZIP raíz `Fire-Ash-Scripts-Corregidos.zip` coincide byte por byte con `Scripts_corregido/Paquete_directo/`. La prueba `npm test` también comprobó que el paquete directo de entrega está actualizado.

### Datos de aventuras ya incluidos

`content/` tiene **68 archivos** (66 JSON, un `.pkregion` y un archivo Ruby). Entre las colecciones medidas:

- **Horizontes:** 500 registros de aventura en 20 reinos.
- **Atlas Mil:** 1.000 mapas, 500 sugerencias y 40 sectores.
- **Tier 1:** 40 blueprints.
- **Tier 2:** 120 blueprints.
- **Tier 3:** 420 reglas locales.

Es una base sustancial para seguir escribiendo e integrando aventuras originales. Los conteos de JSON son infraestructura/datos, no una certificación de que cada entrada esté equilibrada, sea única en su experiencia y haya pasado juego manual.

### Código, aplicación y documentación

| Área | Contenido medido |
|---|---|
| `tools/` | 136 archivos: 131 módulos `.mjs`, 3 scripts Python, 1 shell y 1 texto; incluye editores, importadores, generadores, instaladores y verificadores propios. |
| `web/` | 24 archivos: PokeMod Studio/PWA con lectura y edición de datos RMXP, mapas, eventos, PBS y contenido nuevo. |
| `android/` | 9 archivos fuente para la app WebView/SAF. El workflow de GitHub Actions instala el toolchain Android y construye el APK. |
| `docs/` | 173 archivos antes de añadir esta auditoría: 70 Markdown, 102 PNG y 1 JSON. |
| `reference/` | 20 archivos de referencia gráfica/documental; no contiene las ROMs invitadas. |
| `Mapas/` | 27 referencias visuales/mapas de mosaico. No son archivos de ROM ni un paquete importable automáticamente. |
| `agents/` | 3 archivos: un ZIP de TIMPS y dos archivos de texto pequeños; no hay un servidor de agentes activo. |

Herramientas propias relevantes: `web/js/marshal.js`, `web/js/rmxp.js`, `tools/inspect_guest_rom.mjs`, `tools/inspect_gba_rom.mjs`, `tools/gba_maps_events.mjs`, `tools/forense/{gb,gba}.mjs`, `tools/unpack_assets.mjs`, `tools/audit_all_flags.mjs` y los instaladores/verificadores `tools/apply_*.mjs`.

## 3. Paquetes fuente encontrados

### ZIP

Hay **11 ZIP**, todos pasaron la prueba de integridad. Siete son fuentes de herramientas: TIMPS, pokecrystal, pokered, pokemon-agent, Porygion, RV Packer y Swablu; uno más contiene los scripts corregidos de Fire Ash. Los otros tres son entregables bajo `Scripts_corregido/`.

Las fuentes que el prompt inicial proponía “extraer” están todavía en sus ZIP originales en el repositorio. **No hay copias de esas fuentes extraídas persistidas bajo `toolkit/`**: ahí solo están el índice y el README. Las copias temporales ignoradas por Git no se conservan en el checkout persistido; se pueden volver a extraer cuando una tarea las necesite. El ZIP TIMPS contiene 161 definiciones Markdown, pero tener las definiciones no instala un runtime ni ejecuta los agentes.

Correcciones de capacidad importantes:

- `pokecrystal` y `pokered` son código fuente/disassemblies; no incluyen una ROM de usuario ni una fuente Emerald.
- `pokemon-agent` es un agente de gameplay vía emulador; no es un extractor/coordinador de recursos. Su README indica soporte GBA limitado/planeado.
- RV Packer extrae/reconstruye texto/JSON de formatos RPG Maker compatibles; no traduce ASM o scripts de una ROM a eventos Fire Ash.
- Swablu trabaja con mapas de mazmorras de *Mystery Dungeon: Explorers of Sky*; no es extractor de música.
- Porygion genera mapas regionales procedurales estilo Gen 3; no convierte mapas de ROM a Essentials.
- Tiled es un editor genérico. Porymap necesita un proyecto de descompilación compatible; no hay proyecto `pokeemerald` en este repositorio.

### RAR

Se encontraron **20 archivos RAR**:

- 4 volúmenes de Tiled Linux.
- 15 volúmenes de Porymap.
- 1 RAR de Porygion, además de su ZIP fuente.

No se dispone de `unrar`, `unar`, `7z`, `7za`, `7zr`, `7zz` ni `bsdtar`. Por tanto, Tiled/Porymap no están extraídos ni probados. **No concatenes los volúmenes con `cat`**: usa un extractor RAR sobre el primer volumen, con los demás al lado. Estos editores no son requisito para el editor PokeMod ni equivalen a un importador de ROM.

## 4. Lo que falta para absorción de otra ROM

- No existen `roms pokemon/` ni `reference/roms_invitadas/` en este checkout.
- No se halló ningún `.gba`, `.gb`, `.gbc`, `.nds`, `.ips`, `.ups`, `.bps` o `.xdelta` en el árbol.
- Ninguno de los 11 ZIP incluye una entrada con esos formatos. Las listas internas de los RAR no se pudieron inspeccionar, pero son paquetes llamados Tiled, Porymap y Porygion, no juegos invitados.
- `content/mons_invitados.json` está vacío (`[]`).
- Los informes `docs/ROMS_POKEMON_FORENSE.md` y `docs/ROM_INVITADO_EXTRACCION.md` describen ejecuciones/ROMs anteriores. No hay insumos ni carpetas de salida presentes para repetir sus resultados hoy.

Por eso, ahora se puede **diseñar y adaptar contenido nuevo con los datos de Fire Ash**, y se pueden probar decodificadores con sus autopruebas; no se puede entregar una extracción específica de Emerald/Crystal/Glazed/etc. sin el archivo fuente de esa ROM.

## 5. Límites de esta máquina

| Componente | Estado aquí | Consecuencia |
|---|---|---|
| Node 22, npm 10, Python 3, `make`, `zip`/`unzip` | Disponibles | Se ejecutan herramientas propias y pruebas JS principales. |
| Dependencias `node_modules` | No instaladas | La prueba UI que necesita `jsdom` y el workflow completo no están preparados para ejecución local sin instalar deps. |
| `unrar`/`7z`/`bsdtar` | Ausentes | No se extraen RAR de Tiled/Porymap. |
| Java 17, Gradle, Android SDK/ADB | Ausentes | No se compila el APK localmente; el workflow CI sí instala ese toolchain. |
| Cargo/Rust, Go, RGBDS (`rgbasm`) | Ausentes | No se compilan RV Packer, Porygion ni las descompilaciones Red/Crystal. |
| `ffmpeg` | Ausente | No hay conversión de audio local con FFmpeg. |
| Wine | Ausente | No se puede lanzar `pokemon_fire_ash/Game.exe` aquí para QA de juego. |

`tools/inspect_gba_rom.mjs` y `tools/gba_maps_events.mjs` pueden buscar estructuras GBA conocidas; la búsqueda de mapas/eventos es heurística. No equivalen a reconstruir el 100% de cualquier ROM, portar mapas automáticamente ni traducir su código a scripts Essentials. La prueba real de jugabilidad sigue requiriendo Kirin/PC.

## 6. Hallazgo de protección de partidas

`Game1.rxdata` y `Game2.rxdata` en la raíz tienen formato Ruby Marshal y contienen estructura de `Player`; parecen partidas guardadas de prueba. Ya estaban versionadas. **No las moví, alteré ni desversioné.** Añadí `Game[0-9]*.rxdata` a `.gitignore` para evitar que futuros slots numerados nuevos se agreguen por accidente. También añadí `*.BAK` para cubrir respaldos con extensión en mayúsculas: `pokemon_fire_ash/Data/Map081.BAK` permanece intacto y versionado. Las reglas nuevas no retiran archivos ya versionados del índice de Git.

## 7. Verificaciones ejecutadas

- `npm test`: **pasó** (51 pruebas Marshal, 114 de integración, 107 de authoring externo y pruebas de seguridad/integridad/runtime incluidas en el comando).
- `npm run verify:rom:inspect`: **pasó** contra Fire Ash: 40 mapas de muestra, 337 eventos, 1.215 líneas, 876 switches nombrados, 7.970 entrenadores y 50 eventos comunes. Es una autoprueba del lector XP, no una prueba contra ROM invitada.
- `unzip -t`: **11/11 ZIP válidos**.
- Comparación `Fire-Ash-Scripts-Corregidos.zip` ↔ `Scripts_corregido/Paquete_directo/`: **sin diferencias**.
- `npm run verify:all`, `npm run test:ui`, APK y prueba manual en Kirin/`Game.exe`: no ejecutados en esta auditoría.

## 8. Respuesta final: ¿tenemos todo lo necesario?

| Objetivo | Estado | Por qué |
|---|---|---|
| Continuar el mod actual de Fire Ash | **Sí, en cuanto a archivos del proyecto** | Están el juego, sus datos/gráficos/audio, las modificaciones, catálogos, herramientas y pruebas principales. |
| Crear más aventuras originales dentro del proyecto | **Sí, hay base e infraestructura** | Existen los pipelines de contenido, mapas, eventos, flags, paquetes y verificadores; cada historia nueva todavía necesita autoría, integración y QA. |
| Absorber una ROM invitada concreta ahora | **No** | No hay ROM/patch invitado y no hay extracción previa reproducible en el checkout. |
| Usar Tiled/Porymap desde este entorno | **No todavía** | Los RAR están, pero falta extractor; para Porymap también falta un proyecto `pokeemerald` compatible. |
| Compilar la APK aquí | **No localmente** | Faltan Java, Gradle y SDK; está automatizada la vía de GitHub Actions. |
| Certificar que el juego se siente “como siempre estuvo ahí” | **No solo con el inventario** | Eso exige playtest narrativo/visual, retorno, colisiones, audio y compatibilidad en Kirin/PC. |

El siguiente paso depende del objetivo: para **más aventuras originales**, se puede escoger una dimensión y trabajar con los catálogos existentes; para **absorber un juego concreto**, hace falta aportar la ROM/proyecto invitado al flujo local y analizarlo sin subirla a Git.
