# Piloto gradual — Sector 1: Meridiano Ámbar

Este es el primer incremento pequeño del rediseño Atlas; no pretende rehacer de una vez los mil mapas ni reemplazar las baldosas originales del juego.

## Qué cambia en esta entrega

- Los cinco nombres del piloto (mapas 1021–1025) pasan a topónimos propios de **Meridiano Ámbar**; MapInfos, el catálogo y la jerarquía quedan sincronizados.
- Retornos, puertas de sector, balizas y Ecos dejan de usar `Object ball special`. Ahora son umbrales, señales de dirección, una terminal cartográfica, una piedra de resonancia y un fragmento de Eco dibujados para este piloto.
- Los encuentros Atlas cuyo protagonista es un Pokémon muestran el sprite de campo del Pokémon en vez de una Poké Ball.
- **Pueblo Campanario** recibe una Campana de Alba interactuable que enlaza su historia con la Ruta del Zumbido Dorado.
- La ruta incorpora a **Auralume**, una especie original de tipo Eléctrico/Psíquico, con datos de especie, sprites frontal/trasero, iconos, huella, sprite de campo y encuentro salvaje opcional de nivel 35.
- No se descargaron ni reutilizaron gráficos de Pokémon Reloaded; la inspiración se limita al objetivo de dar a la región una identidad propia.

## Qué sigue pendiente a propósito

La geometría y el terreno de estos cinco mapas todavía usan sus plantillas gráficas de Fire Ash. Los otros veinte mapas del sector quedan intactos. Este primer paso verifica la identidad regional, los objetos interactuables y el flujo del encuentro antes de reconstruir el terreno mapa por mapa. Tampoco se añaden todavía más entrenadores o especies.

## Vistas previas

- `docs/atlas_sector01_pilot/map1021_pueblo_campanario.png`
- `docs/atlas_sector01_pilot/map1024_ruta_zumbido_dorado.png`

## Aplicar y verificar

```sh
npm run apply:atlas:sector01
npm run verify:atlas:sector01
```

Los originales compilados se guardan en `pokemon_fire_ash/PokeModBackups/atlas_sector01_redesign_originals/` (directorio ignorado por Git).
