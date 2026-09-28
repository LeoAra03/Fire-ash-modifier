# Atlas Tier 3 — Reglas locales de los 420 Ecos pendientes

## Alcance

La jerarquía de Atlas Mil divide los 1.000 mapas en 40 anclas Tier 1, 120 rutas Tier 2 y 840 Ecos Tier 3. La mitad de los Ecos ya contenía un evento `Atlas desafío`; los otros **420** conservaban baliza, navegación y retorno, pero les faltaba la **regla local breve** que exige la jerarquía. Este lote las instala todas y cierra el frente: **840/840 Ecos con regla local**.

## Qué es una regla de Eco

Cada regla se instala como evento `PokeMod Tier3: Eco NNNN` (id 120) en celda transitable y aporta:

1. **Identificación del eco**: id de cuatro cifras, sector y mapa de origen (`recuerdo de X`), declarado como Eco antes de que el jugador invierta tiempo;
2. **Anomalía local**: una regla física del lugar (geografía que respira, gravedad prestada, ecos con retraso, sombras dobles, luz con memoria, coordenadas que mienten, pasos prestados, silencio activo, materiales que recuerdan, compases desfasados, señales tardías, mapas que se corrigen, nombres que cambian de asiento);
3. **Tres reglas de contrajuego** observables y una consecuencia reversible;
4. **Microdecisión** «Seguir la regla local / Observar sin intervenir», resuelta con self-switch A y sin efectos permanentes.

Las 420 reglas se derivan de **14 familias de anomalía × 3 variantes** con textos enriquecidos por eco, sector y mapa de origen. Son retos opcionales de 2–6 minutos, no episodios artesanales: el documento los declara como reglas, no como historias.

## Garantías

- Mochila siempre disponible; la regla nunca menciona ni usa los switches 674/675;
- sin combates forzados y sin recompensas ni flags globales (0 switches y 0 variables nuevas);
- baliza `Atlas Tier N Beacon`, navegación anterior/siguiente y `Return to Puerto Horizonte` intactos;
- los eventos previos (1–3, 10, 100) se preservan; el instalador es idempotente;
- backup por lote antes de escribir.

## Verificación

```bash
node tools/create_atlas_tier3_rules.mjs
node tools/apply_atlas_tier3_rules.mjs
node tools/apply_atlas_tier3_rules.mjs --verify
```

Resultado:

```text
Verificación OK: 840 Ecos con baliza y retorno; 420 con desafío Atlas y 420 con
regla local reversible; 0 flags globales nuevas.
```

## Fuentes y backups

```text
content/atlas_tier3_rules.json
tools/create_atlas_tier3_rules.mjs
tools/apply_atlas_tier3_rules.mjs
pokemon_fire_ash/PokeModBackups/atlas_tier3_rules_originals/
```

## Límite de certificación

La verificación es estática (estructura, colocación, retorno, ausencia de bloqueos y decisiones reversibles). El ritmo de los textos y la sensación de las anomalías requieren prueba manual en `Game.exe`.
