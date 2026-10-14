# Piloto gradual — Sector 1: Meridiano Ámbar

Este primer incremento sigue acotado a los mapas 1021–1025; no rehace de una vez los mil mapas ni importa datos de otros ROMs.

## Qué cambia en el piloto

- Los cinco mapas reciben topónimos propios de **Meridiano Ámbar**; MapInfos, el catálogo Atlas y la jerarquía quedan sincronizados.
- Retornos, puertas, balizas, Ecos y encuentros Pokémon usan gráficos contextuales/originales, no `Object ball special` como marcador genérico.
- **Pueblo Campanario** tiene una Campana de Alba interactuable que enlaza la historia con la Ruta del Zumbido Dorado.
- El **Laboratorio de Resonancia** incorpora el Dial de Resonancia y diálogo; el **Taller de Conchas de Viento**, una Concha de Brisa interactuable.
- **Auralume** es una especie original Eléctrico/Psíquico (ID 1317, libre tras los datos actualizados de `main`), con sprites de campo/combate/ícono/huella y encuentro opcional de nivel 35.
- El piloto deja reparadas **609 celdas** de suelo respecto del ancestro común en los interiores 1022, 1023 y 1025. El `main` integrado ya incluía las 131 celdas de 1023 y 220 de 1025; este PR conserva esas reparaciones y aplica 258 adicionales en 1022. No se alteraron capas superiores ni se movieron eventos.
- La verificación estática confirma que las cinco llegadas, todos los eventos del piloto y los portales/retornos son alcanzables/transitables; también comprueba habilidades y movimientos de Auralume contra los datos instalados.
- No se descargaron ni reutilizaron gráficos de Pokémon Reloaded ni de otro ROM externo. Los sprites añadidos se dibujaron para este proyecto.

## Límites que siguen pendientes

Este **no** es un rediseño completo de la topografía: Pueblo Campanario y la Ruta del Zumbido Dorado todavía conservan sus diseños exteriores base; el mobiliario de los tres interiores también parte de plantillas de Fire Ash. Los otros veinte mapas del Sector 1 siguen intactos. Falta recorrer el lote en `Game.exe` y Kirin; los PNG y BFS estáticos no sustituyen esa prueba.

## Vistas previas

- `docs/atlas_sector01_pilot/map1021_pueblo_campanario.png`
- `docs/atlas_sector01_pilot/map1022_refugio_de_los_ecos.png`
- `docs/atlas_sector01_pilot/map1023_laboratorio_de_resonancia.png`
- `docs/atlas_sector01_pilot/map1024_ruta_zumbido_dorado.png`
- `docs/atlas_sector01_pilot/map1025_taller_conchas_viento.png`

## Aplicar y verificar

```sh
npm run apply:atlas:sector01
npm run verify:atlas:sector01
```

El aplicador es idempotente y limita el relleno a la capa 0 de 1022, 1023 y 1025. `node tools/apply_atlas_sector01_floor_layout.mjs --restore` revierte únicamente esos suelos, conserva otros campos/eventos actuales y se niega a sobrescribir geometría que haya cambiado después.

Los originales actualizados se guardan en `pokemon_fire_ash/PokeModBackups/` (directorio ignorado por Git): `atlas_sector01_redesign_main_4763ec19_originals/` y `atlas_sector01_floor_layout_main_4763ec19_originals/`. Así los rollback parten del `main` integrado, no de las copias del primer piloto.

El plan por fases, las compuertas de procedencia/licencia y la definición verificable de 10/10 están en [`PLAN_MIGRACION_ATLAS_10_10.md`](PLAN_MIGRACION_ATLAS_10_10.md).
