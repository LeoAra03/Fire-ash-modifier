# PokeMod Studio — Fire Ash Edition

**Editor estilo RPG Maker para Pokémon Fire Ash, en tu celular o PC.**
Mapas, eventos, diálogos, flags, NPCs y Pokémon — compatible con **Kirin** y con
**partidas 100% protegidas** (el editor jamás las escribe ni las borra).

![PokeMod](web/icon.svg)

## Qué incluye

| Pestaña | Qué hace |
|---|---|
| Mapas | Árbol de todos los mapas, visor con zoom (render idéntico al juego), eventos clicables |
| Eventos | Diálogos, opciones, scripts, condiciones, añadir/mover/borrar comandos, sprite con vista previa |
| Flags | Renombrar interruptores/variables + **buscar usos** en todos los mapas |
| NPCs | Todos los NPCs del juego: moverlos, cambiar sprite, editar |
| Pokémon | Editor PBS (`pokemon.txt`, `encounters.txt`, `trainers.txt`, `metadata.txt`, …) |
| Crear | **Contenido nuevo estilo juego base**: 10 plantillas de evento, mapas, PBS, mapamundi visual y auditoría |
| Mods | Chequeo Kirin, **Sala PokeMod** (viajar a todos los mapas), backups, scripts, exportar ZIP |

- **Partidas a salvo**: `Save*.rxdata`/`Game.rxdata` bloqueados contra escritura + backup automático de cada archivo antes de tocarlo.
- **Kirin ready**: chequeo de estructura, `.rgssad`, audio y mayúsculas (lo que en PC funciona y en Android falla).
- **Offline**: PWA + APK sin internet ni servidores; tus archivos no salen del dispositivo.

## Uso rápido

### Opción A — APK en Android (recomendado)

1. Descarga `PokeMod-Studio-FireAsh.apk` desde **Actions → último build → Artefactos**
   (o desde Releases) e instálala.
2. Ten Fire Ash extraído en el almacenamiento interno (ej. `/FireAsh`), la misma
   carpeta que usa Kirin.
3. Abre PokeMod → **Abrir carpeta de Fire Ash** → elige esa carpeta → edita.
4. Juega con Kirin. Repite. Tus partidas siguen intactas.

> Funciona en chips **Kirin**, Snapdragon, Exynos, etc. (APK universal sin código
> nativo: ARM64/ARMv7/x86_64) desde Android 7.0.

### Opción B — PC (Chrome/Edge)

1. Sirve la carpeta `web/`: `python -m http.server 8080 --directory web`
   (o abre la preview del repo).
2. **Abrir carpeta (PC)** → elige tu Fire Ash extraído → edita y guarda directo.

### Opción C — Modo lectura + ZIP (cualquier navegador)

1. **Abrir en modo lectura** → elige la carpeta (se lee en memoria).
2. Edita → **Exportar ZIP** → extrae el ZIP sobre tu carpeta del juego.

### Descargar el juego (PC)

```bash
python tools/download_game.py --full        # completo 3.7 + parche 3.7.1 (verificado SHA-1)
python tools/download_game.py --audioless   # ligero, sin audio
python tools/kirin_check.py game            # chequeo de compatibilidad
python tools/backup.py game                 # backup a ZIP
```

## Estructura

```
web/            PWA (la APK la empaqueta tal cual)
  js/marshal.js   Ruby Marshal 4.8 ida/vuelta (51 tests OK)
  js/rmxp.js      Modelos RPG::Map/Event/Tileset + comandos en español
  js/render.js    Render de mapas (autotiles exactos de mkxp)
  js/pbs.js       Parser PBS que preserva formato
  js/fs.js        Acceso a archivos (APK SAF / navegador / lectura / demo)
  js/demo.js      Proyecto procedural para probar sin el juego
  js/app.js       Núcleo: proyecto, backups, Kirin, Sala PokeMod
  js/create.js    Plantillas de evento/mapa/PBS + auditoría (verificado v19.1)
  js/ui.js + editors.js + createUI.js + helpers.js   Interfaz (8 pestañas)
android/        APK WebView + puente SAF (Kotlin, minSdk 24)
tools/          CLI Python (descarga, backup, chequeo) — solo stdlib
  build_direct_package.mjs  Empaqueta Paquete_directo/ en el ZIP descargable
                             (npm run build:package · npm run verify:package)
docs/           GUIA_KIRIN · GUIA_MODS · GUIA_CREAR · FORMATO_RXDATA
```

## Scripts.rxdata corregido: colisiones de eventos

El archivo completo [`Scripts_corregido/Scripts.rxdata`](Scripts_corregido/Scripts.rxdata) hace sólidos los eventos con sprite: el jugador ya no puede atravesar NPCs, entrenadores, objetos ni personajes añadidos aunque sus páginas estén marcadas como `Through`, y conserva su interacción con el botón de acción. Además, repara automáticamente tonos (`Tone.new(...)`) guardados por error como texto antes de actualizarlos en pantalla o imágenes, evitando el `NoMethodError` mostrado en Kirin; y maneja nombres de transición nulos como la transición predeterminada, evitando que Kirin cierre el juego al cambiar de mapa. También desactiva archivos auxiliares de ajustes que provocaban `Errno::ENOENT` en Android/Kirin cuando no existe `Save Files`; la partida principal sigue guardándose en `Game.rxdata`, y conserva la corrección del `end` sobrante de **Grandeur Club**. Lee las [instrucciones de instalación](Scripts_corregido/LEEME.md) antes de copiarlo sobre `Data/Scripts.rxdata` de tu juego. Para instalar también el portal, la avenida de Puntaneva, la aproximación celestial y los siete pisos de Arceus, descarga el [ZIP del paquete directo](Scripts_corregido/Fire_Ash_Paquete_Directo.zip) y descomprímelo sobre la raíz del juego. La batalla de Arceus usa seis fases persistentes, ruleta de tipos, captura 0%/100%, pseudo-PC sin curación, invocaciones legendarias, distorsiones de pantalla y rendición segura. Antes del duelo de Ash se ejecutan tres combates reales CPU vs CPU en la escena normal: Cynthia/Steven 2v1, Gold/Eco/Red 2v1 y Volus con Giratina Origen en individual; el jugador no puede intervenir. El portal incluye una recuperación y ya no depende de una flag 870 perdida en partidas antiguas. Tras hablar con el primer Volus aparece un segundo Volus en la avenida para guiar el ascenso. La plaza del antiguo templo quedó despejada y un Squirtle junto al Charmeleon de la zona baja habilita temporalmente el paso entre árboles solo dentro de Ciudad Puntaneva; el permiso se borra al salir del mapa. El original permanece en `pokemon_fire_ash/Data/`. El ZIP se reconstruye de forma reproducible con `npm run build:package` y `npm run verify:package` comprueba que sus 30 archivos coinciden byte a byte con `Scripts_corregido/Paquete_directo/`, así que nunca vuelve a quedar viejo.

## Catálogo visual referencial de mapas

En [`Scripts_corregido/`](Scripts_corregido/) están los **16 mosaicos PNG** (Atlas Mil en 15 hojas y los otros 22 mapas en la hoja 16), el [informe con ficha para cada uno de los 1.022 IDs](Scripts_corregido/INFORME_REFERENCIAL_MAPAS.md) y el [ZIP descargable del paquete](Scripts_corregido/Mapas_PNG_y_Informe_Referencial.zip). Son referencias estáticas basadas en los datos del proyecto; no sustituyen una prueba dentro de Kirin ni de `Game.exe`.

## Compilar la APK

Automático: cada push a esta rama ejecuta **Actions → PokeMod — Tests + APK**
(tests JS + `assembleDebug`) y publica el APK como artefacto.
En local necesitas JDK 17 + Android SDK:

```bash
cd android && gradle assembleDebug   # sale en app/build/outputs/apk/debug/
```

## Autoría regional y validación externa

Atlas Mil dispone de una capa segura de interoperabilidad con Pokémon Region Builder y Pokémon Studio 2.11.0. Ambos se usan para planificar e inspeccionar; la salida jugable continúa compilándose exclusivamente para Essentials/RMXP.

```bash
node tools/region_builder_adapter.mjs validate --input content/atlas_mil_region.pkregion
node tools/pokemon_studio_adapter.mjs fire-ash-reference
node tools/atlas_style_gate.mjs --check
node tools/external_authoring.test.mjs
```

El flujo completo, sus límites y los comandos de instalación desde el repositorio oficial están en [`docs/AUTORIA_REGION_BUILDER_STUDIO.md`](docs/AUTORIA_REGION_BUILDER_STUDIO.md).

El estado instalado, la diferencia entre infraestructura y autoría artesanal, y el número reproducible de lotes pendientes están en [`docs/ESTADO_CONTENIDO_Y_PROMPTS.md`](docs/ESTADO_CONTENIDO_Y_PROMPTS.md). Se regenera con:

```bash
node tools/audit_content_progress.mjs
```

Los dos macrociclos visuales cubren ocho lotes, las 40 anclas y 397 celdas narrativas. Las comparaciones criticables antes/después —referencias estáticas, no certificaciones— están en [`docs/REFERENCIA_VISUAL_ATLAS_MACRO01.md`](docs/REFERENCIA_VISUAL_ATLAS_MACRO01.md) y [`docs/REFERENCIA_VISUAL_ATLAS_MACRO02.md`](docs/REFERENCIA_VISUAL_ATLAS_MACRO02.md). Los macrociclos 02–07 han instalado además las 120 rutas Tier 2 en 24 lotes; los bloques recientes están documentados en [`docs/ATLAS_TIER2_MACRO03.md`](docs/ATLAS_TIER2_MACRO03.md), [`docs/ATLAS_TIER2_MACRO04_05.md`](docs/ATLAS_TIER2_MACRO04_05.md) y [`docs/ATLAS_TIER2_MACRO06_07.md`](docs/ATLAS_TIER2_MACRO06_07.md). Los 840 Ecos Tier 3 cierran su capa local (420 desafíos Atlas + 420 reglas reversibles) según [`docs/ATLAS_TIER3_REGLAS.md`](docs/ATLAS_TIER3_REGLAS.md). La Mochila funciona dentro de la torre del Grandeur Club del laboratorio de Oak y el sótano tiene un transportador hacia las expansiones: [`docs/INFORME_MOCHILA_GRANDEUR_Y_HUB_OAK.md`](docs/INFORME_MOCHILA_GRANDEUR_Y_HUB_OAK.md).

## Tests

```bash
npm ci                              # dependencias del render PNG y de la prueba UI
npm run verify:all                  # suite completa: tests, UI, mapas, seguridad y paquetes
node web/js/marshal.test.mjs       # 51 pruebas del formato rxdata
node web/js/integration.test.mjs   # 114 pruebas: demo, sala, kirin, PBS, crear, auditoría
node tools/external_authoring.test.mjs  # 67 pruebas: interoperabilidad, estilo, Tier 2/3, Mochila, hub, multiverso y fauna
npm run verify:atlas               # 120 rutas Tier 2 y 840 Ecos compilados y seguros
npm run verify:grandeur:bag        # Mochila libre en la torre del laboratorio de Oak
npm run verify:oak:hub           # transportador postgame del sótano de Oak
npm run verify:multiverse        # Monte Silver y emisiones creepypasta
npm run verify:defeats           # derrotas permanentes; revanchas solo por menú
npm run verify:wild              # encuentros salvajes de las zonas nuevas
node web/js/ui.test.mjs            # 22 pruebas; requiere jsdom
```

## Estado de entrega del PR #10

El PR #10 incorpora los 16 mosaicos, el informe de 1.022 mapas y ambos paquetes ZIP. Las comprobaciones completas se ejecutan con `npm ci && npm run verify:all` y también en CI antes de compilar la APK. La sincronización comprueba cada dato y recurso byte a byte contra su origen; el informe se contrasta con los mapas y catálogos actuales (ignorando solamente la fecha de generación).

Los pasos de instalación y las comprobaciones pendientes dentro del juego están en [`docs/ENTREGA_PR10.md`](docs/ENTREGA_PR10.md). Las pruebas automáticas no certifican una ejecución en Kirin/Game.exe.

## Roadmap

- Pintar tiles en mapas (capas 1-3) · Deshacer/rehacer · Duplicar páginas/eventos
- Más plantillas (PC, gimnasio, concurso) · Editor de tiendas con precios
- Vista previa de animaciones de autotiles · Importar/exportar mapas sueltos
- Traducción EN/PT

## Aviso

Proyecto de fans, sin afiliación con Nintendo, Game Freak, Pokémon Company,
Enterbrain ni los autores de Fire Ash/Kirin. **No incluye el juego ni sus
assets**: tú aportas tu copia. No redistribuyas el juego ni la APK con datos
del juego. Úsalo para mods personales y respeta a los creadores originales.
