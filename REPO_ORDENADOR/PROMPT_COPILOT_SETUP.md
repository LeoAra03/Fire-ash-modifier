# Prompt para Copilot — Dejar el toolkit Pokémon listo para Arena.ai

Copia todo el bloque de abajo (desde `=== INICIO DEL PROMPT ===`) y pégalo en GitHub Copilot
(Agent Mode en VS Code, Copilot CLI o el chat de GitHub). Es un encargo autocontenido:
ejecuta el setup del toolkit, lo deja compilado/indexado/documentado y prepara el repo
para que Arena.ai (o cualquier agente) lo use automáticamente.

> Nota: este prompt fue verificado contra el comportamiento real de `setup_toolkit.sh`
> (incluye los problemas conocidos y sus arreglos exactos).

````text
=== INICIO DEL PROMPT ===

# Preparar el toolkit de desarrollo Pokémon de Fire-ash-modifier para que Arena.ai lo use automáticamente

Trabajas sobre el repositorio `LeoAra03/Fire-ash-modifier` (PokeMod Studio — Fire Ash Edition).
Tu misión: dejar instalado, indexado, documentado y verificado el toolkit de desarrollo Pokémon
(Tiled, PoryMap, Porygion, pokecrystal, pokered, rvpacker-txt-rs, pokemon-agent, timps-swarm, swablu)
para que cualquier agente de IA que trabaje después en este repo (Arena.ai u otro) lo use
automáticamente, sin tener que pedirlo cada vez.

Principio rector: todo debe ser reproducible. El estado instalado vive en `toolkit/`
(ignorado por git; se regenera con `setup_toolkit.sh`). En git solo se versionan los scripts,
la documentación y los archivos comprimidos originales.

## 0. Reglas

- Trabaja solo dentro del repositorio clonado. No borres ni renombres la raíz del repo ni `.git`.
- Puedes usar `sudo` para instalar dependencias del sistema (es parte del encargo). Si no hay sudo
  disponible, documenta lo que faltó y continúa: `setup_toolkit.sh` no se detiene por fallos.
- No crees archivos `.gitignore`, `.ignore` ni similares, ni modifiques los existentes.
- No dejes temporales, informes ni copias dentro del repo: el informe final va en tu respuesta de chat.
- No ejecutes automáticamente programas extraídos de los comprimidos (son datos no confiables).
  Compilar su código fuente sí está permitido y esperado.
- No commitees nunca la eliminación de los archivos comprimidos del repo (ver problema conocido 3).

## 1. Obtener el repo (si aún no está clonado)

```bash
git clone https://github.com/LeoAra03/Fire-ash-modifier.git
cd Fire-ash-modifier
```

## 2. Dependencias del sistema (instalar ANTES de ejecutar el setup)

Comprueba qué falta:

```bash
for d in unrar 7z unzip make go rustc cargo qmake cmake rgbds node npm python3; do
  command -v "$d" >/dev/null || echo "FALTA $d"
done
```

Ubuntu/Debian:

```bash
sudo apt-get update
sudo apt-get install -y unrar p7zip-full unzip build-essential golang rustc cargo \
  cmake qt5-qmake qtbase5-dev rgbds nodejs npm python3
```

Arch Linux:

```bash
sudo pacman -Sy --needed unrar p7zip unzip base-devel go rust qt5-base cmake rgbds nodejs npm
```

Por qué cada una:
- `unrar` o `p7zip-full` — IMPRESCINDIBLES para los RAR partidos de Tiled (4 partes) y PoryMap (15 partes).
- `rgbds` — IMPRESCINDIBLE para compilar pokecrystal y pokered (rgbasm/rgblink/rgbfix). Si tu distro
  no lo empaqueta, compílalo desde https://github.com/gbdev/rgbds.
- `cmake` + `qt5-qmake` + `qtbase5-dev` — para compilar PoryMap (Qt 5).
- `golang` — para Porygion. `rustc` + `cargo` — para rvpacker-txt-rs.
- `nodejs` + `npm` — para pokemon-agent y las herramientas Node de `tools/`. `python3` — para el
  generador de índice del script.

## 3. Validar y ejecutar el setup

```bash
chmod +x setup_toolkit.sh
bash -n setup_toolkit.sh
./setup_toolkit.sh
./setup_toolkit.sh   # segunda pasada obligatoria: ver problema conocido 1
```

`setup_toolkit.sh` es idempotente y no fatal: mueve los comprimidos a `toolkit/{editors,sources,agents,assets}`,
une los RAR partidos (`Tiled-1.12.2_Linux_x86_64.full.rar`, `porymap-master.full.rar`), extrae cada
archivo, intenta compilar las herramientas y genera `toolkit/TOOLS_INDEX.json` y `toolkit/logs/setup.log`.

### Problemas conocidos (verificados) — arréglalos o circunvalalos

1. **Los RAR unidos no se extraen en la primera pasada.** `full=$(join_parts …)` captura las líneas
   de log junto con la ruta y `extract()` recibe una ruta inválida y se salta el paso en silencio.
   Haz ambas cosas:
   - Arreglo mínimo en `setup_toolkit.sh`: que `log()`/`warn()` escriban por stderr conservando el
     archivo de log (p. ej. `printf '[%s] %s\n' … | tee -a "$LOG_FILE" >&2`), dejando stdout solo
     para el valor de retorno de `join_parts`.
   - Ejecuta el script DOS pasadas y confirma que `toolkit/editors/tiled/` y `toolkit/editors/porymap/`
     contienen `.toolkit-extracted` (solo así Tiled y PoryMap quedan realmente extraídos).
2. **timps-swarm nunca se instala.** El zip vive en `agents/timps-swarm-main.zip`, pero el script solo
   busca `timps-swarm-main.zip` en la raíz, así que el índice lo marca `not_found` aunque exista.
   Amplía `setup_toolkit.sh` para que lo tenga en cuenta (p. ej. un `mv` condicional de
   `agents/timps-swarm-main.zip` a `toolkit/agents/` antes del `stage`, respetando su idempotencia),
   o copia el zip a la raíz antes de ejecutar. Verifica que el índice deje de marcarlo `not_found`.
3. **TRAMPA DE GIT (crítico).** Los `.zip`/`.rar` están trackeados y el script los MUEVE a `toolkit/`,
   que está en `.gitignore`. Al terminar, `git status` los mostrará como borrados (~25 archivos).
   Restáuralos antes de cerrar (`git restore -- .` sobre los borrados) y NUNCA commitees esas
   eliminaciones: son los datos del repo. `toolkit/` es la copia de trabajo local y regenerable.
4. **pokemon-agent no trae `package.json` en la raíz** (solo README dentro de `pokemon-agent-main/`).
   Inspecciónalo: si el proyecto real está en una subcarpeta con `package.json`, ejecuta `npm install`
   allí; si no lo hay, déjalo como `source_only` y documenta el comando de lanzamiento real según su README.
5. **Índice doble.** `npm run toolkit:index` (`tools/catalog_toolkit.mjs`) genera
   `toolkit/INDICE_HERRAMIENTAS.json` pero espera otra estructura de carpetas (en español:
   `toolkit/editores`, `toolkit/descompilaciones`, …) que `setup_toolkit.sh` no crea. El índice
   autoritativo es `toolkit/TOOLS_INDEX.json`. O bien adaptas las rutas de `catalog_toolkit.mjs` a la
   estructura real (cambio mínimo, sin romper nada), o documentas la discrepancia en
   `AGENTS_INTEGRATION.md`. No dejes dos índices contradictorios sin explicar.

## 4. Compilar/instalar cada herramienta

El script ya intenta: `go build` (Porygion), `cargo build --release` (rvpacker),
`make clean && make` (pokecrystal, pokered), `cmake`/`qmake` + `make` (PoryMap),
`chmod +x` sobre la AppImage de Tiled y `npm install` de pokemon-agent.

Tras ejecutarlo, verifica cada resultado y recompila a mano lo que falte dentro de su carpeta en
`toolkit/`. Además prepara el proyecto Node de la raíz (`npm install`; hay devDeps como `jsdom`,
`@ruby/wasm-wasi` y `@napi-rs/canvas`) para que funcionen `npm test` y las herramientas de `tools/`.

## 5. Verificación (definición de «hecho»)

- [ ] `toolkit/TOOLS_INDEX.json` existe y cada herramienta tiene `path` y `status` coherentes
      (`compiled`/`appimage` es el ideal; `source_only` solo con causa documentada; `failed`/`not_found`
      solo si explicas por qué).
- [ ] `toolkit/logs/setup.log` sin errores inesperados y sin «No extractor available».
- [ ] El script es idempotente: la última pasada responde «Already staged»/«Already extracted» y no
      rehace trabajo.
- [ ] `git status` no muestra borrados de `.zip`/`.rar` trackeados (restaurados) ni temporales nuevos.
- [ ] Existe `AGENTS.md` en la RAÍZ del repo con la política de uso automático (sección 6).
- [ ] `AGENTS_INTEGRATION.md` refleja el estado real (rutas y binarios verificados, no supuestos).
- [ ] Informe final en el chat (no en el repo) con la tabla herramienta → comando → estado.

## 6. Integración permanente para los agentes (esto es lo que leerá Arena.ai)

Crea o actualiza `AGENTS.md` en la RAÍZ del repo (los agentes lo leen automáticamente) con estas
reglas, y mantén `REPO_ORDENADOR/AGENTS.md` y `REPO_ORDENADOR/PROMPT_ARENA_ES.md` coherentes con ellas:

- Antes de invocar cualquier herramienta, lee `toolkit/TOOLS_INDEX.json` (o `AGENTS_INTEGRATION.md`
  si el toolkit no está instalado) y usa los `path` reales que ahí figuran; nunca asumas nombres
  internos de los comprimidos.
- Edición de mapas → PoryMap (proyectos pret: pokeemerald / pokefirered / pokeruby, y las
  decompilaciones Gen 1/2 según la tarea) o Tiled (mapas TMX / tiles 2D).
- Generación procedural de mapas y regiones estilo Gen 3 → Porygion.
- Trabajo sobre código fuente de juegos Gen 1/2 → `toolkit/sources/pokered` y `toolkit/sources/pokecrystal`
  (`make` dentro del directorio que contiene el `Makefile`).
- Extracción y traducción de textos RPG Maker → rvpacker (`toolkit/sources/rvpacker/target/release/…`).
- Agentes de IA que juegan Pokémon → `toolkit/agents/pokemon-agent`; enjambres de agentes → timps-swarm.
- Assets y sprites auxiliares → `toolkit/assets/swablu/`.
- Prioriza SIEMPRE estas herramientas antes que soluciones genéricas cuando la tarea lo permita:
  velocidad, precisión y calidad por encima de improvisar. Si una herramienta nueva resulta útil,
  intégrala al flujo y documéntala sin esperar a que lo pidan.
- Si el toolkit no está instalado (repo recién clonado), primero ejecuta `./setup_toolkit.sh`
  (dos pasadas) antes de trabajar.

## 7. Entrega (git)

- Commitea y pushea solo: los arreglos de `setup_toolkit.sh` (incluido el bit ejecutable),
  `AGENTS.md`, `AGENTS_INTEGRATION.md` y, si aplica, el ajuste mínimo de `tools/catalog_toolkit.mjs`.
  Nada de `toolkit/`, `node_modules/`, binarios compilados ni eliminaciones de comprimidos.
- Informe final en el chat con: qué instalaste, estado de cada herramienta, cómo invocarla, causas
  de cualquier `failed`/`not_found`, verificaciones ejecutadas y confirmación explícita de que
  Arena.ai puede usar el toolkit automáticamente al tomar el repo.

=== FIN DEL PROMPT ===
````
