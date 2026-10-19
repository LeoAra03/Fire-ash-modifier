# FASE 051 — Mostrar y comprobar diálogos (tramo 5000–5099)

## Reproducción

```bash
node tools/plan2700/lote10_fase051_dialogos_7.mjs
node tools/plan2700/lote10_fase051_dialogos_7.mjs --verify
```

## Resumen medido

- **Tareas procesadas**: 100 (40 con lectura humana de sentido explícita · 0 sin mapas localizables).
- **Mapas únicos cubiertos**: 119 (mapas 901–1019) · familias declaradas: «Fire Ash original», «Horizontes».
- **Suma por tarea** (los tramos se solapan): 4286 eventos con diálogo · 10557 bloques 101/401 · 2 mensajes de script.
- **Recuento sin duplicar por mapa** (119 mapas): 1466 eventos con diálogo · 3479 bloques 101/401 · 1 mensaje de script.
- **Formato de caja (sin duplicar)**: 1861 líneas superan las 53 columnas · 0 bloques pasan de 2 líneas.
- **Signos (sin duplicar)**: 356 interrogaciones sin «¿» · 268 exclamaciones sin «¡» · 0 comillas impares.
- **Idioma y glosario (sin duplicar)**: 1244 bloques con marcas de inglés · 480 aciertos de glosario.
- **Variables y cantidades (sin duplicar)**: \PN en 96 bloques · \v[n] en 22 ocasiones · 563 bloques con cifras · **referencias inválidas: 0**.
- **Tareas con alguna incidencia de formato/signos**: 100/100. Estado: `static_measured_manual_reading_pending`.

## Cobertura por aspecto

| Aspecto | Tareas | Lectura humana | Mapas | Bloques 101/401 | Script msgs | >53 cols | >2 líneas | ¿/¡ ausentes | Comillas impares | Glosario | `\PN` / `\v[n]` | Inválidas |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| formato de caja y longitud de línea | 20 | 5 | 42 | 2029 | 0 | 1311 | 0 | 254 | 0 | 256 | 48/5 | 0 |
| signos de apertura, comillas y puntuación | 20 | 5 | 48 | 2287 | 1 | 1392 | 0 | 328 | 0 | 282 | 67/8 | 0 |
| idioma, glosario y nombres propios | 20 | 5 | 41 | 1889 | 1 | 1276 | 0 | 185 | 0 | 264 | 25/17 | 0 |
| variables, cantidades y nombres insertados | 20 | 5 | 40 | 2052 | 0 | 1420 | 0 | 153 | 0 | 297 | 21/18 | 0 |
| sentido, tono y lectura humana | 20 | 20 | 45 | 2300 | 0 | 1490 | 0 | 271 | 0 | 331 | 62/9 | 0 |

## Cobertura por familia declarada

| Familia | Tareas | Lectura humana | Mapas | Rango de mapas | Bloques | Script msgs | Inválidas |
|---|---:|---:|---:|---|---:|---:|---:|
| Fire Ash original | 33 | 13 | 100 | 901–1000 | 3854 | 2 | 0 |
| Horizontes | 67 | 27 | 20 | 1000–1019 | 6703 | 0 | 0 |

## Tareas con más incidencias

| Tarea | Aspecto | Mapa(s) | Bloques | >53 cols | >2 líneas | ¿/¡ | Comillas |
|---:|---|---|---:|---:|---:|---:|---:|
| 5039 | sentido, tono y lectura humana | 1001–1002 «Horizontes» | 245 | 173 | 0 | 0 | 0 |
| 5029 | sentido, tono y lectura humana | 987–995 «Fire Ash original» | 159 | 68 | 0 | 87 | 0 |
| 5019 | sentido, tono y lectura humana | 958–959 «Fire Ash original» | 296 | 63 | 0 | 73 | 0 |
| 5031 | signos de apertura, comillas y puntuación | 995–997 «Fire Ash original» | 128 | 64 | 0 | 65 | 0 |
| 5043 | variables, cantidades y nombres insertados | 1002–1003 «Horizontes» | 140 | 128 | 0 | 0 | 0 |
| 5046 | signos de apertura, comillas y puntuación | 1003–1004 «Horizontes» | 140 | 128 | 0 | 0 | 0 |
| 5050 | formato de caja y longitud de línea | 1004–1005 «Horizontes» | 140 | 128 | 0 | 0 | 0 |
| 5053 | variables, cantidades y nombres insertados | 1005–1006 «Horizontes» | 140 | 128 | 0 | 0 | 0 |
| 5056 | signos de apertura, comillas y puntuación | 1006–1007 «Horizontes» | 140 | 128 | 0 | 0 | 0 |
| 5060 | formato de caja y longitud de línea | 1007–1008 «Horizontes» | 140 | 128 | 0 | 0 | 0 |

## Muestras extraídas

- **Tarea 5000** (formato de caja y longitud de línea · Mapa 901 «Route 3» · Ev 4 `Item`, pág. 1, 46 cols): `\bIt's always a bonus to feel bonded to your team.`
- **Tarea 5005** (formato de caja y longitud de línea · Mapa 914 «Route 7» · Ev 2 `Double trainer F`, pág. 1, 56 cols): `\rYou'll need at least two Pokémon if you want to  battle us.`
- **Tarea 5001** (signos de apertura, comillas y puntuación · Mapa 904 «Iki Pokémon Center» · Ev 3 `Nurse`, pág. 1, 36 cols): `\rHello, and welcome to the Pokémon Center.`
- **Tarea 5006** (signos de apertura, comillas y puntuación · Mapa 919 «Aether Paradise» · Ev 5 `Person`, pág. 1, 17 cols): `\bWorking here is a blast!`
- **Tarea 5002** (idioma, glosario y nombres propios · Mapa 907 «Paniola Ranch» · Ev 1 `Day Care Man`, pág. 1, 15 cols): `\bRango: Ah, it's you!`
- **Tarea 5007** (idioma, glosario y nombres propios · Mapa 921 «Vast Poni Canyon» · Ev 7 `Trainer(2)`, pág. 1, 14 cols): `\bHere for some fun?`
- **Tarea 5003** (variables, cantidades y nombres insertados · Mapa 908 «Paniola House» · Ev 2 `Item`, pág. 1, 47 cols): `\bI caught what I wanted so I don't need this now.`
- **Tarea 5008** (variables, cantidades y nombres insertados · Mapa 923 «Ultra Deep Space» · Ev 1 `Solgaleo`, pág. 1, 26 cols): `Would you like to go back?`
- **Tarea 5004** (sentido, tono y lectura humana · Mapa 909 «Paniola Pokémon Center» · Ev 3 `Nurse`, pág. 1, 36 cols): `\rHello, and welcome to the Pokémon Center.`
- **Tarea 5009** (sentido, tono y lectura humana · Mapa 927 «Royal Avenue» · Ev 2 `Item`, pág. 1, 100 cols): `\bThe Masked Royal uses this. I want to be like him,  but I'm not a Trainer. Maybe you can use it better.`

## Límite honesto

Los mapas auditados pertenecen a «Fire Ash original» y «Horizontes». Los de «Fire Ash original» están congelados por política del proyecto y las demás familias se auditan sin reescribir sus textos en esta tanda: la fase **muestra y mide** los diálogos, no modifica los `.rxdata`. Las métricas de formato, signos, glosario y variables quedan archivadas por tarea en el JSON de la fase; el juicio de sentido y tono permanece marcado como `manual_pending` y la ejecución interactiva en `Game.exe` como `runtime_pending`.
