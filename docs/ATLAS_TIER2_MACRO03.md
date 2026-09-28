# Atlas Tier 2 — Macrociclo 03

## Alcance

El macrociclo 03 completa cinco lotes de cinco rutas Tier 2. Cubre 25 mapas, desde el 1108 hasta el 1308, en los sectores Distrito Cuarzo, Órbita Esmeralda, Paso Boreal, Jardín Índigo, Costa Prisma, Dominio Solar, Velo Lunar, Nexo Onírico y el inicio de Valle Magnético.

Resultados instalados:

- 5 lotes Tier 2;
- 25 rutas de autoría dedicada;
- 50 NPCs con nombre, motivación, conflicto y páginas anterior/posterior;
- 25 objetivos y mecánicas locales;
- 25 decisiones persistentes;
- 25 recompensas únicas;
- 300 líneas de diálogo nuevas sin repeticiones;
- switches 758–782 y variables 154–178;
- desafío Atlas genérico preservado en los 25 mapas;
- geometría, eventos originales y retorno libre preservados.

El acumulado Tier 2 queda en 35/120 rutas, 70 NPCs y 420 líneas de diálogo sin repeticiones.

## Seguridad de juego

Las rutas no añaden combates forzados ni consultan los switches 674 o 675. La Mochila continúa disponible. La recompensa se entrega mediante una rama condicional: el switch de progreso solo se activa si `pbReceiveItem` confirma la entrega; si no hay espacio, el jugador puede retirarse, ordenar la Mochila y volver.

Cada mapa conserva su evento `Atlas desafío`, su baliza Tier 2 y la transferencia incondicional a Puerto Horizonte.

## Referencia PNG para crítica

- `docs/referencia_tier2_macro03_antes.png`
- `docs/referencia_tier2_macro03_despues.png`

Los recuadros amarillos indican las posiciones reservadas para los dos NPCs. Son anotaciones de revisión y no forman parte del juego. Los PNG muestran el primer frame de tiles, autotiles y sprites; no son assets jugables nuevos ni sustituyen una prueba dentro de `Game.exe`.

Se regeneran con:

```bash
npm ci
node tools/render_atlas_visual_reference.mjs \
  --tier2 content/atlas_tier2_blueprints_macro03.json \
  --backup pokemon_fire_ash/PokeModBackups/atlas_tier2_macro03_originals \
  --before docs/referencia_tier2_macro03_antes.png \
  --after docs/referencia_tier2_macro03_despues.png
```

## Fuentes reproducibles

```text
content/atlas_tier2_blueprints_macro03.json
content/atlas_tier2_qa_macro03.json
tools/create_tier2_macro03.mjs
tools/apply_tier2_routes.mjs
```

Instalación y verificación:

```bash
node tools/create_tier2_macro03.mjs
node tools/apply_tier2_routes.mjs \
  --input content/atlas_tier2_blueprints_macro03.json \
  --backup atlas_tier2_macro03_originals
node tools/apply_tier2_routes.mjs \
  --input content/atlas_tier2_blueprints_macro03.json \
  --backup atlas_tier2_macro03_originals \
  --verify
```

## Backup y reversión

El backup local anterior a la compilación está en:

`pokemon_fire_ash/PokeModBackups/atlas_tier2_macro03_originals/`

Contiene los 25 mapas originales, `MapInfos.rxdata` y `System.rxdata`. La comparación automática confirmó que el macrociclo solo añadió los 50 eventos previstos, cambió los 25 nombres de mapa y reservó sus 25 switches y variables.

## Límite de certificación

El QA estático comprueba datos, eventos, flags, recompensas, geometría, contenido original, desafío y retorno. Aun así, ritmo de lectura, clipping, densidad de NPCs y sensación de recorrido deben revisarse manualmente dentro de `Game.exe`.
