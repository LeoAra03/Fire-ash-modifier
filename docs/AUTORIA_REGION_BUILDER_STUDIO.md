# Flujo de autoría con Pokémon Region Builder y Pokémon Studio 2.11.0

## Objetivo

Estas herramientas se incorporan como apoyo de diseño, modelado y validación sin migrar Pokémon Fire Ash a PSDK. La única salida jugable continúa siendo RPG Maker XP/RGSS + Pokémon Essentials mediante los compiladores propios de este repositorio.

Esto evita cuatro riesgos:

1. reemplazar por accidente `Data/*.rxdata` con datos PSDK incompatibles;
2. introducir scripts LiteRGSS en un juego RGSS;
3. copiar código o recursos de herramientas y fangames externos;
4. confundir una referencia regional o un manifiesto con un mapa jugable.

## Fuentes correctas

- Pokémon Region Builder: <https://felker.dev/pokemon-region-builder/>
- Repositorio de Pokémon Studio: <https://github.com/PokemonWorkshop/PokemonStudio>
- Versión fijada de Pokémon Studio: `v2.11.0`
- Release: <https://github.com/PokemonWorkshop/PokemonStudio/releases/tag/v2.11.0>

El adaptador de Region Builder fue implementado de forma independiente alrededor del JSON `.pkregion`. No se incluye código de ese repositorio, que no declara una licencia. Pokémon Studio tiene su propia licencia; el proyecto externo se instala fuera de Fire Ash y este repositorio solo conserva adaptadores originales y atribución.

Créditos de herramienta: Pokémon Studio es desarrollado por Pokémon Workshop y se consulta bajo su [licencia oficial](https://github.com/PokemonWorkshop/PokemonStudio/blob/v2.11.0/LICENSE.md). Pokémon Region Builder es publicado por Fleker/Nick Felker; su código no se redistribuye ni se modifica aquí.

## Artefactos integrados

| Archivo | Función | ¿Es jugable? |
|---|---|---|
| `content/atlas_mil_region.pkregion` | Plano editable de Atlas Mil con capas, 40 landmarks y Pokédex regional | No |
| `content/atlas_region_design.json` | Importación neutral validada del plano regional | No |
| `content/atlas_studio_reference.json` | Índice con `dbSymbol` para 40 anclas: 30 compiladas y 10 planificadas | No |
| `content/atlas_style_baseline.json` | Comparación de las 40 anclas contra mapas reales de Fire Ash | No |
| `docs/referencia_region_atlas_mil.png` | PNG criticable del plano regional y su estado | No |
| `content/atlas_tier1_blueprints_approved.json` | Contrato narrativo aprobado | Todavía no por sí solo |
| `pokemon_fire_ash/Data/*.rxdata` | Resultado compilado y respaldado para Essentials/RMXP | Sí |

## Pokémon Region Builder

### Exportar Atlas Mil

```bash
node tools/region_builder_adapter.mjs export \
  --output content/atlas_mil_region.pkregion
```

La exportación actual contiene:

- mapa regional de 80 × 60 celdas;
- capa de agua;
- capa de terreno con cinco categorías;
- red de caminos;
- 40 landmarks, uno por sector;
- 126 especies presentes en equipos narrativos ya aprobados;
- 30 landmarks con episodio aprobado;
- 10 landmarks marcados como pendientes.

Regenerar el PNG criticable sin convertirlo en asset jugable:

```bash
node tools/render_region_builder_reference.mjs
```

Salida: `docs/referencia_region_atlas_mil.png`, 1400 × 900. El propio PNG declara su alcance de referencia.

### Editar

1. Abrir Pokémon Region Builder.
2. Cargar `content/atlas_mil_region.pkregion`.
3. Revisar geografía, agua, terreno, caminos, nombres, descripciones, encuentros y Pokédex.
4. Guardar otro `.pkregion`.
5. No incrustar imágenes o sprites externos sin comprobar licencia y compatibilidad con RPG Maker XP.

### Validar e importar

```bash
node tools/region_builder_adapter.mjs validate \
  --input ruta/al/atlas-revisado.pkregion

node tools/region_builder_adapter.mjs import \
  --input ruta/al/atlas-revisado.pkregion \
  --output content/atlas_region_design.json
```

El importador comprueba dimensiones, capas, huellas de landmarks, referencias de celdas, Pokédex, encuentros y datos personalizados. Convierte IDs canónicos a símbolos existentes en `species.dat`. Bloquea para compilación cualquier Pokémon personalizado o especie externa hasta que existan datos y recursos RMXP validados.

El importador nunca escribe en `pokemon_fire_ash/Data`.

## Pokémon Studio 2.11.0

### Instalación reproducible desde el repositorio correcto

```bash
node tools/setup_pokemon_studio.mjs install --dependencies
```

El destino predeterminado es `tools/.cache/PokemonStudio-2.11.0`, excluido de Git. Para preparar únicamente adaptadores y dependencias en un entorno sin interfaz gráfica:

```bash
node tools/setup_pokemon_studio.mjs install --dependencies --adapter-only
```

Para incluir el submódulo PSDK en un entorno de autoría completo:

```bash
node tools/setup_pokemon_studio.mjs install --dependencies --submodules
```

Comprobar estado:

```bash
node tools/setup_pokemon_studio.mjs doctor
```

`guiReady: true` exige que el binario de Electron se haya descargado. El pipeline de Fire Ash no depende de Electron ni del runtime PSDK.

### Inspeccionar un proyecto PSDK sin modificarlo

```bash
node tools/pokemon_studio_adapter.mjs inspect \
  --project /ruta/al/proyecto-psdk \
  --output /ruta/al/informe-neutral.json
```

El inspector:

- lee `project.studio`;
- indexa las colecciones JSON de `Data/Studio`;
- detecta `dbSymbol` duplicados;
- rechaza enlaces simbólicos y JSON excesivos;
- marca explícitamente que la importación directa está prohibida;
- no escribe en el proyecto PSDK ni en Fire Ash.

### Regenerar el índice de autoría de Fire Ash

```bash
node tools/pokemon_studio_adapter.mjs fire-ash-reference \
  --output content/atlas_studio_reference.json
```

Este índice aplica a Atlas las ideas útiles de Studio 2.11.0:

- símbolos estables;
- registros separados;
- integridad referencial;
- datos textuales revisables;
- referencias explícitas entre episodio, entrenador, reparto, mapa y progresión.

No es un `project.studio`, no contiene código de Pokémon Studio y no se puede ejecutar con PSDK.

## Compuerta de fidelidad a Fire Ash

```bash
node tools/atlas_style_gate.mjs \
  --output content/atlas_style_baseline.json
```

La compuerta compara cada ancla con su mapa fuente real y verifica:

- dimensiones;
- tileset y autotiles existentes;
- ocupación de las tres capas RMXP;
- diversidad de tiles;
- pasabilidad;
- sprites de eventos;
- eventos fuera de límites;
- cinco eventos artesanales en episodios aprobados;
- retorno a Puerto Horizonte.

Estado actual:

- 40/40 anclas técnicamente compatibles;
- 0 recursos visuales faltantes detectados;
- 40/40 conservan exactamente la geometría heredada;
- 40/40 requieren revisión artística antes de certificarse visualmente;
- los 30 episodios aprobados conservan sus cinco eventos Tier 1.

La geometría heredada es segura y coherente con el juego base, pero no equivale a diseño visual final. El informe evita presentar estos mapas como terminados y mantiene obligatoria una prueba dentro de `Game.exe`.

## Pipeline obligatorio

Después de modificar cualquiera de los insumos:

```bash
node tools/region_builder_adapter.mjs validate \
  --input content/atlas_mil_region.pkregion

node tools/region_builder_adapter.mjs import \
  --input content/atlas_mil_region.pkregion \
  --output content/atlas_region_design.json

node tools/pokemon_studio_adapter.mjs fire-ash-reference
node tools/atlas_style_gate.mjs

node tools/atlas_narrative_pipeline.mjs \
  --qa content/atlas_tier1_blueprints_approved.json

node tools/external_authoring.test.mjs
node web/js/marshal.test.mjs
node web/js/integration.test.mjs
```

`atlas_narrative_pipeline.mjs` ahora se detiene si falta cualquiera de estas condiciones:

- 40 landmarks válidos de Region Builder;
- compatibilidad de especies y recursos con Fire Ash;
- integridad del manifiesto inspirado en Studio;
- 40/40 anclas aprobadas por la compuerta técnica de estilo.

## Orden para contenido futuro

1. Diseñar o revisar el sector en Region Builder.
2. Importar el `.pkregion` al manifiesto neutral.
3. Crear el registro estable de episodio, reparto, entrenador y progresión.
4. Seleccionar un mapa fuente de Fire Ash mediante métricas de estilo.
5. Escribir y aprobar el blueprint.
6. Auditar IDs, assets, flags, dificultad, Mochila, derrota segura y retorno.
7. Crear backup.
8. Compilar exclusivamente con las herramientas Essentials/RMXP del repositorio.
9. Repetir QA automático.
10. Probar visualmente y jugar el episodio dentro de `Game.exe`.

Ningún paso externo puede omitir las compuertas de backup, flags, assets, batalla justa o retorno libre.
