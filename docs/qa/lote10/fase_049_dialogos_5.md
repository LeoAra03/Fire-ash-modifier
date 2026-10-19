# FASE 049 — Mostrar y comprobar diálogos (tramo 4800–4899)

## Reproducción

```bash
node tools/plan2700/lote10_fase049_dialogos_5.mjs
node tools/plan2700/lote10_fase049_dialogos_5.mjs --verify
```

## Resumen medido

- **Tareas procesadas**: 100 (40 con lectura humana de sentido explícita · 0 sin mapas localizables).
- **Mapas únicos cubiertos**: 329 (mapas 303–631) · familias declaradas: «Fire Ash original».
- **Suma por tarea** (los tramos se solapan): 3792 eventos con diálogo · 9505 bloques 101/401 · 0 mensajes de script.
- **Recuento sin duplicar por mapa** (329 mapas): 2561 eventos con diálogo · 6332 bloques 101/401 · 0 mensajes de script.
- **Formato de caja (sin duplicar)**: 1662 líneas superan las 53 columnas · 8 bloques pasan de 2 líneas.
- **Signos (sin duplicar)**: 1080 interrogaciones sin «¿» · 721 exclamaciones sin «¡» · 0 comillas impares.
- **Idioma y glosario (sin duplicar)**: 3816 bloques con marcas de inglés · 1107 aciertos de glosario.
- **Variables y cantidades (sin duplicar)**: \PN en 145 bloques · \v[n] en 133 ocasiones · 57 bloques con cifras · **referencias inválidas: 0**.
- **Tareas con alguna incidencia de formato/signos**: 100/100. Estado: `static_measured_manual_reading_pending`.

## Cobertura por aspecto

| Aspecto | Tareas | Lectura humana | Mapas | Bloques 101/401 | Script msgs | >53 cols | >2 líneas | ¿/¡ ausentes | Comillas impares | Glosario | `\PN` / `\v[n]` | Inválidas |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| formato de caja y longitud de línea | 20 | 5 | 86 | 1798 | 0 | 481 | 2 | 521 | 0 | 295 | 44/28 | 0 |
| signos de apertura, comillas y puntuación | 20 | 5 | 83 | 2038 | 0 | 550 | 2 | 521 | 0 | 359 | 62/64 | 0 |
| idioma, glosario y nombres propios | 20 | 5 | 98 | 1802 | 0 | 468 | 3 | 492 | 0 | 336 | 45/38 | 0 |
| variables, cantidades y nombres insertados | 20 | 5 | 75 | 1847 | 0 | 491 | 1 | 515 | 0 | 349 | 44/52 | 0 |
| sentido, tono y lectura humana | 20 | 20 | 85 | 2020 | 0 | 480 | 1 | 633 | 0 | 344 | 42/37 | 0 |

## Cobertura por familia declarada

| Familia | Tareas | Lectura humana | Mapas | Rango de mapas | Bloques | Script msgs | Inválidas |
|---|---:|---:|---:|---|---:|---:|---:|
| Fire Ash original | 100 | 40 | 329 | 303–631 | 9505 | 0 | 0 |

## Tareas con más incidencias

| Tarea | Aspecto | Mapa(s) | Bloques | >53 cols | >2 líneas | ¿/¡ | Comillas |
|---:|---|---|---:|---:|---:|---:|---:|
| 4814 | sentido, tono y lectura humana | 354–355 «Fire Ash original» | 116 | 43 | 0 | 69 | 0 |
| 4815 | formato de caja y longitud de línea | 355–358 «Fire Ash original» | 117 | 32 | 0 | 68 | 0 |
| 4811 | signos de apertura, comillas y puntuación | 346–350 «Fire Ash original» | 173 | 45 | 0 | 43 | 0 |
| 4813 | variables, cantidades y nombres insertados | 350–354 «Fire Ash original» | 155 | 44 | 0 | 41 | 0 |
| 4874 | sentido, tono y lectura humana | 551–555 «Fire Ash original» | 125 | 43 | 0 | 40 | 0 |
| 4860 | formato de caja y longitud de línea | 509–513 «Fire Ash original» | 99 | 53 | 0 | 25 | 0 |
| 4886 | signos de apertura, comillas y puntuación | 591–594 «Fire Ash original» | 119 | 45 | 0 | 32 | 0 |
| 4861 | signos de apertura, comillas y puntuación | 513–515 «Fire Ash original» | 92 | 45 | 0 | 25 | 0 |
| 4888 | variables, cantidades y nombres insertados | 598–601 «Fire Ash original» | 127 | 34 | 0 | 34 | 0 |
| 4830 | formato de caja y longitud de línea | 405–408 «Fire Ash original» | 93 | 30 | 0 | 37 | 0 |

## Muestras extraídas

- **Tarea 4800** (formato de caja y longitud de línea · Mapa 303 «Burned Tower» · Ev 2 `Team Rocket`, pág. 1, 46 cols): `\bMorty: You fiends. What do you think you're doing!?`
- **Tarea 4805** (formato de caja y longitud de línea · Mapa 328 «Yellow Rock Isle» · Ev 3 `Person`, pág. 1, 20 cols): `\bWelcome to the Whirl Waver.`
- **Tarea 4801** (signos de apertura, comillas y puntuación · Mapa 307 «Route 39 House» · Ev 1 `Trainer(3)`, pág. 1, 7 cols): `\bReady to go?`
- **Tarea 4806** (signos de apertura, comillas y puntuación · Mapa 331 «Route 42» · Ev 2 `Apricorn tree`, pág. 2, 23 cols): `There are no apricorns.`
- **Tarea 4802** (idioma, glosario y nombres propios · Mapa 311 «Colossus Ruins» · Ev 5 `Trainer(4)`, pág. 1, 37 cols): `\rTake it easy in here. You could get hurt.`
- **Tarea 4807** (idioma, glosario y nombres propios · Mapa 334 «Lake of Rage» · Ev 3 `Trainer(4)`, pág. 1, 45 cols): `\rWe plan on using evolution to fuel our desires.`
- **Tarea 4803** (variables, cantidades y nombres insertados · Mapa 317 «Cianwood City» · Ev 1 `Sign`, pág. 1, 25 cols): `Cianwood City\nA Port of Crashing Waves.`
- **Tarea 4808** (variables, cantidades y nombres insertados · Mapa 339 «Mahogany Gym» · Ev 3 `Trainer(2)`, pág. 1, 20 cols): `\rLet's fight to warm up.`
- **Tarea 4804** (sentido, tono y lectura humana · Mapa 322 «Ogi Isle» · Ev 1 `Person`, pág. 1, 20 cols): `\bWelcome to the Whirl Waver.`
- **Tarea 4809** (sentido, tono y lectura humana · Mapa 342 «Blackthorn City» · Ev 3 `Sign`, pág. 1, 25 cols): `Blackthorn City\nA Quiet Mountain Retreat.`

## Límite honesto

Los mapas de «Fire Ash original» están congelados por política del proyecto: esta fase **muestra y mide** sus diálogos, no reescribe los `.rxdata`. Las métricas de formato, signos, glosario y variables quedan archivadas por tarea en el JSON de la fase; el juicio de sentido y tono permanece marcado como `manual_pending` y la ejecución interactiva en `Game.exe` como `runtime_pending`.
