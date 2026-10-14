# Plan de cobertura — 42 633 fases (3601–46 233)

**Archivo del plan:** [`PLAN_COBERTURA_FASES.md`](PLAN_COBERTURA_FASES.md) — 42 633 líneas numeradas, una fase por línea, sin secciones.
**Manifiesto:** `content/plan_cobertura_manifest.json` — fases y unidades por familia, con rango de numeración.

## Qué es

La continuación natural de los tres primeros documentos (`PLAN_900_FASES.md`,
`PLAN_1800_FASES.md`, `PLAN_2700_FASES.md`, `PLAN_PERFECCION.md`): las fases **3601 en
adelante** ya no se escriben a mano, se **derivan del censo del proyecto**. Cada línea es
una fase concreta: dice qué mapa, qué celdas, qué diálogos o qué combinación de estado hay
que comprobar, y cuántas unidades cubre.

## Cómo se calculó

```
CENSO  mapas 3.465 · eventos 36.147 · páginas 55.499 · comandos 444.284 · celdas 5.493.642
       switches 874 · variables 240 · gráficos 1.726 · BGM 105 · 340 tablas de encuentro / 3.329 slots
TOTAL  6.426.480 unidades de cobertura
REGLA  una fase = 150 unidades · una comprobación con juicio humano pesa ×4
FASES  42.633  (3601–46 233)
```

El número **no lo elige nadie**: sale del contenido. Si mañana se añaden mapas, eventos o
diálogos, se vuelve a ejecutar el emisor y el listado crece solo, conservando la numeración.

> Nota de precisión: la primera medición publicada dijo ~42 844 fases. Al unificar los dos
> medidores se detectó un **doble conteo** de las comprobaciones con juicio humano (se
> contaban a la vez en la base y con su peso). Corregido, la cifra real es **42 633**.

## Reparto por familia

| Familia | Fases | Rango |
|---|---:|---|
| checklist de mapa (10 puntos) | 231 | 3601–3831 |
| ejecución de evento (página inicial · página final · salida) | 723 | 3832–4554 |
| diálogo mostrado y comprobado | 1 673 | 4555–6227 |
| elección con cada rama tomada | 70 | 6228–6297 |
| condición probada en verdadero y falso | 226 | 6298–6523 |
| switch comprobado en ambos estados | 12 | 6524–6535 |
| variable comprobada en valores límite | 5 | 6536–6540 |
| self-switch comprobado en ambos estados | 114 | 6541–6654 |
| transferencia recorrida en ambos sentidos | 255 | 6655–6909 |
| combate ejecutado y comprobado | 5 | 6910–6914 |
| rutina de movimiento completada | 57 | 6915–6971 |
| espera medida (ni corte ni lentitud) | 53 | 6972–7024 |
| script de evento ejecutado sin error | 260 | 7025–7284 |
| estado de progreso (7 regiones + 5 campañas + 6 dimensiones) | 1 748 | 7285–9032 |
| reserva de mapas fuera de rango | 24 | 9033–9056 |
| encuentro salvaje (tabla × slot) | 23 | 9057–9079 |
| tablas de encuentro | 3 | 9080–9082 |
| gráficos de personaje referenciados | 24 | 9083–9106 |
| pistas de música referenciadas | 1 | 9107 |
| mapas con BGM | 24 | 9108–9131 |
| **tiles de mapa (celdas)** | **36 625** | 9132–45 756 |
| fuzz de eventos (semillas) | 134 | 45 757–45 890 |
| mutación de mapas (celdas alteradas) | 334 | 45 891–46 224 |
| partida interrumpida en guardado | 4 | 46 225–46 228 |
| límites de sistema | 3 | 46 229–46 231 |
| sesiones humanas de playtest | 2 | 46 232–46 233 |

Ochenta y seis por ciento del plan es la verificación de las 5 493 642 celdas de los 3 465
mapas: por eso cada línea de esa familia nombra el mapa, su nombre real y el tramo de celdas.

## Cómo se regenera

```bash
npm run cobertura                                   # informe del censo y de las familias
npm run cobertura:plan                              # reescribe docs/PLAN_COBERTURA_FASES.md
node tools/plan900/cobertura.mjs --json             # el mismo informe en JSON
```

Los tres comandos leen el juego real (`pokemon_fire_ash/Data/`) y **no escriben nada** en él.

## Cómo se marca el avance

Cada fase cumplida debe dejar un artefacto (informe, registro o prueba) y anotarse; el
manifiesto es la fuente para saber qué rango de líneas pertenece a qué familia. El plan no
se da por cumplido por leerlo: se da por cumplido cuando la fase tiene evidencia.

## Lo que este archivo no es

No es un plan de diseño ni de contenido nuevo: es el **plan de verificación y cobertura** del
proyecto ya construido. El contenido nuevo y las correcciones están en los documentos
anteriores (fases 1–3600). Y no cierra el proyecto por sí solo: las cinco condiciones de
cierre (C1–C5) siguen definidas en `PLAN_PERFECCION.md`.
