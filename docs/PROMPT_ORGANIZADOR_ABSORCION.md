# Prompt maestro — organizador del toolkit y motor de absorción Fire Ash

> **Propósito:** convertir referencias de otros juegos en aventuras nuevas que se sientan parte natural de Fire Ash. El flujo es «inhalar → catalogar → digerir → reimaginar → integrar → probar», no copiar una ROM entera ni prometer compatibilidad universal.
>
> **Estado medido el 2026-10-05:** inventario de herramientas en [`toolkit/INDICE_HERRAMIENTAS.json`](../toolkit/INDICE_HERRAMIENTAS.json) y censo completo en [`AUDITORIA_REPOSITORIO_Y_RECURSOS.md`](AUDITORIA_REPOSITORIO_Y_RECURSOS.md). Hay código forense propio y paquetes fuente ZIP; Tiled/Porymap siguen dentro de RAR sin extraer, y no se proporcionó ninguna ROM invitada. Por tanto, la absorción de una ROM concreta **todavía no se ejecutó**.

## 1. Contrato del agente

Pega este documento como instrucciones de trabajo al iniciar una sesión de absorción. Lee primero el repositorio y el índice; no trates los ejemplos ni las cifras antiguas como hechos actuales.

1. **No declarar éxito antes de medirlo.** Distingue siempre entre archivo presente, fuente extraída, programa instalado, prueba ejecutada y contenido integrado/jugable.
2. **No modificar el juego original por una importación.** La fuente activa es `pokemon_fire_ash/`; el paquete entregable está en `Scripts_corregido/`. Inspecciona `git status` y haz una copia de seguridad antes de cualquier operación que toque datos del juego. Integra solo contenido nuevo y con instalador/verificador explícitos.
3. **ROMs y material derivado quedan locales.** El usuario debe proporcionar material que tenga derecho a analizar. No descargues ROMs ni incluyas ROMs, assets extraídos o archivos de terceros en Git, paquetes de distribución o ZIPs maestros. Conserva insumos y salidas de ROM en `reference/roms_invitadas/`, ignorado por Git.
4. **Identifica el formato antes de elegir herramienta.** Un `.gba` no es un proyecto RPG Maker XP; `inspect_guest_rom.mjs` no descompila un cartucho. No conviertas ASM de GBA a eventos de Essentials por búsqueda/reemplazo.
5. **No uses capacidades inventadas.** No afirmes extracción al 100%, conversión directa de mapas, descifrado universal de audio ni que 161 perfiles de agente son 161 procesos ejecutándose.
6. **Conserva la autoría y continuidad.** Extrae patrones de diseño, ritmo, roles, tipos de misión y datos que puedan analizarse; escribe escenas, mapas, diálogos, música e identidad visual propios para que parezcan concebidos para este mundo. Cada acceso nuevo debe tener contexto diegético, estado persistente, retorno seguro y pruebas de continuidad.

## 2. Fase 1 — detectar y organizar lo que existe

### 2.1 Antes de extraer

- Ejecuta `git status --short`, lista los archivos y comprueba el contenido de cada archivo comprimido. Usa `unzip -t` para ZIP y una herramienta RAR real para RAR.
- Mantén el código extraído de terceros en `toolkit/` local. Solo el índice y esta guía se versionan; el resto de `toolkit/` está ignorado por Git y se puede regenerar desde los paquetes fuente.
- No hagas una segunda copia del juego en `fireash_project/`: `pokemon_fire_ash/` y `Scripts_corregido/` ya son las ubicaciones del proyecto y del entregable.
- No pongas ROMs en `toolkit/roms_fuente/` ni sus gráficos en una carpeta que pueda publicarse. Usa `reference/roms_invitadas/entrada/` y las salidas ignoradas de los analizadores.

### 2.2 Estructura local

La estructura lógica esperada (cuando se extraigan localmente los paquetes) es:

```text
toolkit/
  editores/{tiled,porymap,porygion}/
  descompilaciones/{crystal,red,emerald}/
  agentes/{timps_swarm,coordenadores}/
  extractores/{sprites,audio,mapas,scripts}/
  roms_fuente/                 # vacío hasta aportar ROMs legales para análisis local
  assets_extraidos/            # vacío; las salidas reales de ROM van a reference/roms_invitadas/
  scripts/                     # referencia local del paquete corregido
  INDICE_HERRAMIENTAS.json
```

### 2.3 Paquetes detectados en este clon

`toolkit/INDICE_HERRAMIENTAS.json` es la fuente de verdad del estado actual. Resumen:

- Los **11 ZIP del repositorio** pasaron `unzip -t`: siete ZIP de fuentes de herramientas, un ZIP del paquete de scripts Fire Ash y tres paquetes de entrega. Ninguno contiene archivos con extensiones de ROM/parche conocidas. Las fuentes ZIP siguen disponibles, pero el checkout persistido no conserva sus copias extraídas: solo están el índice y esta guía bajo `toolkit/`.
- **pokecrystal** y **pokered** son árboles de código dentro de ZIP; no son ROMs ni están compilados. Falta `rgbasm`/RGBDS.
- El ZIP TIMPS contiene **161 definiciones de agente**. No hay runtime del swarm ni las definiciones se han desplegado como procesos.
- `pokemon-agent` es una herramienta de juego mediante emulador, no un coordinador de absorción. Su README requiere dependencias externas y limita los juegos soportados.
- **RV Packer** maneja texto/JSON de varios formatos RPG Maker, incluido XP; su fuente está en ZIP y no se puede compilar aquí porque falta Rust/Cargo.
- **Swablu** es un creador de mapas aleatorios para *Pokémon Mystery Dungeon: Explorers of Sky*. No es un extractor de audio ni de mapas GBA/RMXP.
- **Porygion** genera mapas regionales procedurales de estilo Gen 3. Su fuente está en ZIP; no convierte mapas de una ROM a Essentials.
- `Fire-Ash-Scripts-Corregidos.zip` se comparó directamente con `Scripts_corregido/Paquete_directo/`: coincide byte por byte (297 archivos; 11 595 689 bytes).
- No se encontró una fuente de descompilación de Emerald.

### 2.4 RAR multipartes: regla crítica

Hay 4 volúmenes RAR de Tiled y 15 de Porymap. Todos están presentes, pero el entorno actual no dispone de `unrar`, `unar`, `7z` ni `bsdtar`; no se afirma que estén extraídos.

**No concatenes los `.part*.rar` con `cat`.** Son volúmenes RAR con sus propias cabeceras. Cuando haya una herramienta compatible, ejecútala sobre el primer volumen —por ejemplo, `unrar x Tiled-1.12.2_Linux_x86_64.part1.rar toolkit/editores/tiled/` y `unrar x porymap-master.part01.rar toolkit/editores/porymap/`— manteniendo todos los volúmenes juntos. Si el extractor no está disponible, detente y registra el bloqueo; no fabriques un ZIP maestro incompleto.

Incluso una vez extraídos, Tiled es un editor genérico y Porymap está dirigido a proyectos de descompilación compatibles (principalmente Gen 3). Ninguno importa por sí solo una ROM arbitraria directamente a Fire Ash/Essentials.

## 3. Fase 2 — capacidades reales y límites

### 3.1 Herramientas que ya están en el repositorio

| Ruta | Capacidad útil | Límite importante |
|---|---|---|
| `web/js/marshal.js`, `web/js/rmxp.js` | Lectura/escritura de datos Ruby Marshal y modelos RPG Maker XP usados por el editor. | Entender el contenedor no convierte automáticamente la semántica de otro motor. |
| `tools/inspect_guest_rom.mjs` | Inventaría un juego RPG Maker XP/Essentials: mapas, eventos, texto, flags, entrenadores y catálogos compatibles. | Requiere un proyecto XP extraído; no analiza bytes de `.gba`. |
| `tools/inspect_gba_rom.mjs` | Identifica cabeceras/tablas de una ROM GBA y exporta catálogos PBS cuando reconoce las estructuras. | Detección heurística; tablas repunterizadas, codificaciones propias y datos fragmentados pueden escapar. |
| `tools/gba_maps_events.mjs` | Busca layouts, mapas, warps, NPCs, scripts y algunas flags en ROMs GBA Gen 3; emite JSON/PBS de referencia. | Minería de patrones, no desensamblado completo: puede omitir datos o producir falsos positivos. |
| `tools/forense/gba.mjs`, `tools/forense/gb.mjs`, `tools/unpack_assets.mjs` | Decodificadores locales para formatos reconocidos: LZ77/RLE, sprites Gen 1, tiles y paletas. | Descomprimir bytes no equivale a identificar el uso de cada gráfico, recuperar todo el tilemap o reconstruir una escena. |
| `tools/audit_all_flags.mjs` y verificadores `tools/apply_*.mjs` | Ayudan a reservar IDs, aplicar contenido propio y comprobar invariantes del proyecto. | No reutilices el espacio de flags suponiendo que “999 están libres”; consulta el juego real y su auditoría. |

La autoprueba `npm run verify:rom:inspect` sí se ejecutó correctamente contra Fire Ash: **40 mapas, 337 eventos, 1215 líneas de texto, 876 switches con nombre, 7970 entrenadores y 50 eventos comunes**. `node tools/forense_roms.mjs` confirmó que no hay ROMs en `roms pokemon/`.

### 3.2 Qué se puede hacer

- **Con un proyecto RPG Maker XP/Essentials extraído:** inventariar mapas/eventos/textos/flags y algunos catálogos con el analizador ya disponible; preparar un manifiesto y proponer una adaptación original.
- **Con una ROM GBA compatible:** probar reconocimiento de cabecera/tablas, catálogos y algunos entrenadores; decodificar bloques gráficos conocidos; investigar mapas y eventos mediante las heurísticas existentes.
- **Con una ROM GB/GBC compatible:** inspeccionar cabecera/texto y decodificar familias de sprites Gen 1 que coincidan con los formatos soportados.
- **Con una petición narrativa definida:** diseñar una aventura original con entrada diegética, NPCs, decisión, combate/recompensa, flags nuevas y una salida que no rompa la continuidad de Fire Ash.
- **Con un paquete de contenido nuevo y validado:** integrarlo con las herramientas/patrones actuales, ejecutar verificadores y reconstruir el paquete directo.

### 3.3 Qué no se puede prometer

- No existe aquí un descompilador universal que recupere el 100% de los mapas, eventos, texto, flags, entrenadores, sprites, audio y lógica de cualquier ROM.
- Un mapa GBA no se importa automáticamente como mapa jugable RPG Maker XP. Hace falta reconstruir tilesets, paletas, colisiones, conexiones, coordenadas, eventos y retornos; Porymap y Tiled no reemplazan ese trabajo.
- No hay traductor automático fiable de ASM, bytecode o scripts de un hack a comandos de evento de Essentials. Flags, IDs de especies/movimientos, rutinas especiales y condiciones deben mapearse y probarse por juego.
- No se ha validado un extractor universal de música/efectos GBA/GBC ni una conversión automática de sus secuencias a OGG. Swablu no cubre audio.
- No se garantizan límites universales como “999×999 tiles” u “8 tilesets”: dependen de la versión del motor, del proyecto y del formato de datos. Compruébalos en Fire Ash/Kirin antes de diseñar mapas grandes.
- Tener 161 perfiles TIMPS no equivale a invocar 161 agentes, repartirles trabajo ni obtener sus resultados. En este checkout se confirmó su presencia dentro del ZIP; la copia extraída no se conserva.
- La instalación de un paquete no certifica calidad narrativa, jugabilidad, rendimiento en Android/Kirin, ausencia de clipping ni continuidad. Hace falta QA en el motor de juego.

### 3.4 Aventuras existentes: cantidad no es acabado

El repositorio ya contiene catálogos amplios, entre ellos `content/horizontes_500.json` (500 registros de aventura), `content/atlas_mil_500.json` (1000 mapas y 500 sugerencias), 40 blueprints Tier 1, 120 blueprints Tier 2 y 420 entradas de reglas Tier 3. Esas cantidades son datos que existen en JSON; no prueban por sí solas que cada entrada sea una aventura artesanal, única, equilibrada y probada en el juego. Usa `docs/ESTADO_CONTENIDO_Y_PROMPTS.md` y los verificadores de cada sistema para distinguir contenido instalado, infraestructura y trabajo narrativo.

## 4. Pipeline por ROM (cuando el usuario aporte una)

### Paso 0 — reconocer formato y proteger datos

1. El usuario deja una ROM o proyecto en `reference/roms_invitadas/entrada/`; no uses descargas externas.
2. Registra nombre/formato y valida que el archivo se puede leer. Mantén originales intactos y trabaja en carpetas de salida ignoradas.
3. Elige una sola ruta según el formato. No ejecutes los pasos siguientes si el formato no coincide.

### Ruta A — ROM GBA (`.gba`)

```bash
node tools/inspect_gba_rom.mjs --rom "reference/roms_invitadas/entrada/JUEGO.gba"
node tools/gba_maps_events.mjs --rom "reference/roms_invitadas/entrada/JUEGO.gba"
node tools/unpack_assets.mjs --dir reference/roms_invitadas/entrada --salida reference/roms_invitadas
```

Compara los hallazgos entre salidas; documenta offsets, confianza y falsos positivos. No uses el inventario como si ya fueran PBS listos para integrar. Los tres comandos producen datos de referencia locales, no un port jugable.

### Ruta B — ROM GB/GBC (`.gb` o `.gbc`)

```bash
node tools/forense_roms.mjs --rom "reference/roms_invitadas/entrada/JUEGO.gb"
node tools/unpack_assets.mjs --dir reference/roms_invitadas/entrada --salida reference/roms_invitadas
```

`forense_roms.mjs` escribe su informe legado bajo `roms pokemon/<slug>/` (también ignorado por Git). Explica cualquier limitación por formato o hack; una ROM desconocida puede requerir trabajo específico.

### Ruta C — proyecto XP/Essentials (carpeta o ZIP)

```bash
node tools/unpack_guest_rom.mjs --entrada reference/roms_invitadas/entrada --slug NOMBRE
node tools/inspect_guest_rom.mjs --dir reference/roms_invitadas/NOMBRE/juego --slug NOMBRE
```

Si el juego ya está extraído, apunta `--dir` a su raíz real. Los RAR necesitan un extractor externo. Las salidas `inventory.json`, `informe.md` y `pbs/` son inventarios para adaptación; no cambies el juego invitado ni mezcles sus archivos directamente con Fire Ash.

### Paso 1 — manifiesto de absorción

Por cada objetivo crea un manifiesto local (sin assets protegidos en Git) con:

- archivos de entrada, formato y herramienta/versión usada;
- estructuras detectadas y su confianza (`seguro`, `probable`, `experimental`);
- mapas/layouts, warps, NPCs, diálogos, flags, entrenadores y encuentros que realmente se detectaron;
- activos gráficos/audio identificados y lo que no se pudo identificar;
- relaciones entre IDs de origen y IDs nuevos propuestos;
- licencia/procedencia y decisiones de no reutilizar material literal.

### Paso 2 — reimaginar y adaptar

1. Extrae **funciones de diseño** (arco, ritmo, arquetipo de NPC, curva de combate, tema visual), no escenas/textos/recursos ajenos pegados tal cual.
2. Diseña una dimensión/aventura nueva que tenga causa dentro del canon, acceso diegético, objetivos claros, consecuencias persistentes, viaje de regreso y coherencia de personajes.
3. Escribe diálogos y arte originales; mapea especies, movimientos, objetos y flags mediante catálogos reales de Fire Ash. No presupongas que índices iguales significan lo mismo.
4. Reserva IDs con la auditoría del proyecto y documenta cada switch/variable. Usa un instalador idempotente y un `--verify` cuando se modifiquen datos del juego.

### Paso 3 — integrar y probar

```bash
npm run verify:all
npm run build:package
npm run verify:package
```

`npm run dn:preparar` prepara referencias de **Dimensional Nightmare**; no es un comando general para absorber ROMs. Ejecuta la batería completa solo después de conocer sus prerrequisitos y revisar `git status`. La prueba final de mapas, ritmo, colisiones, audio y retorno sigue necesitando el juego en Kirin/PC.

## 5. TIMPS: asignación propuesta, no ejecución

El ZIP incluye 161 definiciones Markdown. Hasta disponer de un runtime y proveedor configurados, las siguientes son **asignaciones de trabajo para un equipo humano/agente futuro**, no tareas ejecutadas:

| Frente | Perfiles que buscar por nombre en `toolkit/agentes/timps_swarm/.../.claude/agents/` | Entrega propuesta |
|---|---|---|
| Forense de la ROM | `code_archaeology`, `data_wrangler`, `pattern_detector` | Manifiesto con estructuras y confianza; sin escribir en el juego. |
| Adaptación narrativa | `storybook_story_generator`, `content_multiplier`, `memory_agent` | Brief/guion original y continuidad con el canon. |
| Datos y normalización | `data_pipeline`, `dataset_agent`, `i18n_agent`, `media_librarian` | Tablas normalizadas y procedencia/licencias documentadas. |
| Integración y calidad | `api_contract_auditor`, `unit_test_writer`, `visual_regression_detective`, `license_compliance_scanner`, `self_critic_agent` | Validación independiente, reporte de diferencias y lista de QA manual. |

Los perfiles se consultan directamente del ZIP fuente (`agents/timps-swarm-main.zip`) o se extraen localmente cuando hacen falta; `toolkit/agentes/` no contiene esas copias en el checkout persistido. Un agente propone; una herramienta determinista integra; el verificador independiente decide. No asignar por números 1–160: los archivos tienen nombres/roles, no una numeración de ejecución.

## 6. Formato de respuesta al cerrar una sesión

El agente debe entregar:

1. **Hecho y verificado:** comandos ejecutados, resultados y rutas exactas.
2. **Disponible pero no probado:** herramientas cuyo código/archivo existe pero no se ejecutó.
3. **Pendiente/bloqueado:** entradas que faltan, dependencias externas y qué tendría que aportar/instalar el usuario.
4. **Capaz / no capaz:** separar extracción de datos, adaptación creativa, integración y QA de juego.
5. **ROM objetivo:** si el usuario no la indicó o no la aportó, decirlo; no inventar un análisis específico.
6. **TIMPS:** dejar claro si son perfiles disponibles o agentes realmente ejecutados.

Nunca contestes “absorción completa” si solo se creó un directorio, se extrajo un ZIP o se generó un catálogo.
