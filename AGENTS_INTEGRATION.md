# Plan de Integración Automatizada para Arena.ai

## Inventario detectado

El repositorio contiene los archivos comprimidos esperados para Tiled, PoryMap, Porygion, pokecrystal, pokered, RV Packer, Pokémon Agent y Swablu. También contiene `porygion-master.rar` además del ZIP. En la inspección del directorio raíz no apareció `timps-swarm-main.zip`; el script lo busca de forma condicional y lo registra como `not_found` si no está disponible.

## Estructura objetivo

| Carpeta | Contenido |
|---|---|
| `toolkit/editors/` | Partes RAR de Tiled y PoryMap, más sus extracciones |
| `toolkit/sources/` | pokecrystal, pokered, porygion y RV Packer |
| `toolkit/agents/` | Pokémon Agent y Timps Swarm si se añade posteriormente |
| `toolkit/assets/` | Archivo y extracción de Swablu |

Los archivos originales se mueven, no se eliminan. La ejecución repetida conserva archivos ya preparados.

## Herramientas

| Nombre | Comando para usarla | Propósito |
|---|---|---|
| Tiled | `./toolkit/editors/tiled/<Tiled.AppImage>` | Editar mapas basados en tiles. |
| PoryMap | `./toolkit/editors/porymap/<porymap>` | Editar mapas de proyectos Pokémon. |
| Porygion | `./toolkit/sources/porygion/<binary>` | Herramientas del proyecto Porygion. |
| RV Packer | `./toolkit/sources/rvpacker/target/release/<binary>` | Empaquetar y desempaquetar textos. |
| Pokecrystal | `cd toolkit/sources/pokecrystal && make` | Compilar/modificar Pokémon Crystal. |
| Pokered | `cd toolkit/sources/pokered && make` | Compilar/modificar Pokémon Red. |
| Pokémon Agent | `cd toolkit/agents/pokemon-agent && npm start` | Ejecutar el agente Node.js, si su `package.json` define `start`. |
| Timps Swarm | Consultar `toolkit/TOOLS_INDEX.json` | Agente swarm opcional; no estaba presente en el inventario inicial. |
| Swablu | `toolkit/assets/swablu/` | Consultar los recursos extraídos. |

Los nombres exactos de los binarios pueden variar según el contenido de cada archivo comprimido. `toolkit/TOOLS_INDEX.json` es el índice de ejecución autoritativo y debe consultarse antes de invocar una herramienta.

## Uso para Arena.ai

1. Ejecutar desde cualquier directorio:

   ```bash
   bash ./setup_toolkit.sh
   ```

   El script resuelve su propia ubicación, crea la estructura, mueve los archivos originales, une las partes RAR, extrae ZIP/RAR, aplica permisos a la AppImage de Tiled, intenta compilar y genera el índice.

2. Leer `toolkit/TOOLS_INDEX.json`.
   - `status: "compiled"`: existe un binario compilado.
   - `status: "appimage"`: existe una AppImage ejecutable.
   - `status: "source_only"`: hay fuentes, pero no se encontró un resultado compilado.
   - `status: "failed"`: había fuentes, pero la compilación no terminó correctamente.
   - `status: "not_found"`: no hay archivo o extracción disponible.

3. Para editar mapas, seleccionar primero PoryMap o Tiled desde los campos `path` del índice. No asumir nombres internos del ZIP/RAR.
4. Para trabajar con una ROM de primera o segunda generación, usar los directorios `pokecrystal` o `pokered` y ejecutar `make` dentro del directorio que contenga el `Makefile`.
5. Para agentes, buscar el `package.json` o ejecutable indicado en el índice. Timps Swarm solo debe invocarse si el archivo aparece posteriormente.
6. Para recursos gráficos o auxiliares, pasar `toolkit/assets/swablu/` como raíz de assets.

## Dependencias

El script solo verifica las dependencias y no usa `sudo` automáticamente. En Ubuntu/Debian, un administrador puede instalar:

```bash
sudo apt-get update
sudo apt-get install -y unrar p7zip-full unzip build-essential golang rustc cargo qt5-qmake cmake rgbds nodejs npm
```

En Arch Linux:

```bash
sudo pacman -Sy --needed unrar p7zip unzip base-devel go rust qt5-base cmake rgbds nodejs npm
```

Las dependencias relevantes verificadas son `go`, `rustc`, `cargo`, `qmake`, `cmake` y `rgbds`; además se recomienda disponer de `make`, `unrar`/`7z`, `unzip`, Node.js y npm.

## Comportamiento ante errores

- `setup_toolkit.sh` es idempotente: puede ejecutarse varias veces.
- Cada acción y error se registra en `toolkit/logs/setup.log`.
- Una compilación o extracción fallida no detiene las demás herramientas.
- Las partes RAR se conservan; el archivo unido se genera dentro de `toolkit/`.
- Para forzar una nueva extracción, eliminar únicamente el marcador `.toolkit-extracted` de la herramienta correspondiente.
- El script intenta generar JSON con Python 3; si no está disponible, deja un índice JSON mínimo y registra la limitación.

## Limitaciones conocidas

La inspección inicial no encontró `timps-swarm-main.zip`, por lo que Arena.ai debe tratarlo como opcional. Los nombres de binarios y los sistemas de compilación reales dependen del contenido de cada archivo comprimido; por eso el script descubre `go.mod`, `Cargo.toml`, `Makefile`, `CMakeLists.txt`, archivos `.pro` y `package.json` en vez de asumir una ruta única.
