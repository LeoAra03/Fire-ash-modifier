# FASE 050 — Mostrar y comprobar diálogos (tramo 4900–4999)

## Reproducción

```bash
node tools/plan2700/lote10_fase050_dialogos_6.mjs
node tools/plan2700/lote10_fase050_dialogos_6.mjs --verify
```

## Resumen medido

- **Tareas procesadas**: 100 (40 con lectura humana de sentido explícita · 0 sin mapas localizables).
- **Mapas únicos cubiertos**: 271 (mapas 631–901) · familias declaradas: «Fire Ash original».
- **Suma por tarea** (los tramos se solapan): 4474 eventos con diálogo · 12382 bloques 101/401 · 0 mensajes de script.
- **Recuento sin duplicar por mapa** (271 mapas): 2534 eventos con diálogo · 6083 bloques 101/401 · 0 mensajes de script.
- **Formato de caja (sin duplicar)**: 1785 líneas superan las 53 columnas · 2 bloques pasan de 2 líneas.
- **Signos (sin duplicar)**: 1066 interrogaciones sin «¿» · 589 exclamaciones sin «¡» · 0 comillas impares.
- **Idioma y glosario (sin duplicar)**: 3855 bloques con marcas de inglés · 842 aciertos de glosario.
- **Variables y cantidades (sin duplicar)**: \PN en 209 bloques · \v[n] en 95 ocasiones · 83 bloques con cifras · **referencias inválidas: 0**.
- **Tareas con alguna incidencia de formato/signos**: 100/100. Estado: `static_measured_manual_reading_pending`.

## Cobertura por aspecto

| Aspecto | Tareas | Lectura humana | Mapas | Bloques 101/401 | Script msgs | >53 cols | >2 líneas | ¿/¡ ausentes | Comillas impares | Glosario | `\PN` / `\v[n]` | Inválidas |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| formato de caja y longitud de línea | 20 | 5 | 80 | 2459 | 0 | 731 | 1 | 660 | 0 | 313 | 107/21 | 0 |
| signos de apertura, comillas y puntuación | 20 | 5 | 78 | 2408 | 0 | 731 | 1 | 667 | 0 | 300 | 107/27 | 0 |
| idioma, glosario y nombres propios | 20 | 5 | 69 | 2529 | 0 | 813 | 1 | 670 | 0 | 296 | 134/31 | 0 |
| variables, cantidades y nombres insertados | 20 | 5 | 69 | 2826 | 0 | 843 | 0 | 719 | 0 | 390 | 133/43 | 0 |
| sentido, tono y lectura humana | 20 | 20 | 70 | 2160 | 0 | 637 | 1 | 559 | 0 | 305 | 91/40 | 0 |

## Cobertura por familia declarada

| Familia | Tareas | Lectura humana | Mapas | Rango de mapas | Bloques | Script msgs | Inválidas |
|---|---:|---:|---:|---|---:|---:|---:|
| Fire Ash original | 100 | 40 | 271 | 631–901 | 12382 | 0 | 0 |

## Tareas con más incidencias

| Tarea | Aspecto | Mapa(s) | Bloques | >53 cols | >2 líneas | ¿/¡ | Comillas |
|---:|---|---|---:|---:|---:|---:|---:|
| 4993 | variables, cantidades y nombres insertados | 891–892 «Fire Ash original» | 475 | 180 | 0 | 96 | 0 |
| 4987 | idioma, glosario y nombres propios | 889–891 «Fire Ash original» | 449 | 155 | 0 | 86 | 0 |
| 4906 | signos de apertura, comillas y puntuación | 643–650 «Fire Ash original» | 258 | 77 | 0 | 110 | 0 |
| 4988 | variables, cantidades y nombres insertados | 891 Pokémon School | 356 | 121 | 0 | 64 | 0 |
| 4989 | sentido, tono y lectura humana | 891 Pokémon School | 356 | 121 | 0 | 64 | 0 |
| 4990 | formato de caja y longitud de línea | 891 Pokémon School | 356 | 121 | 0 | 64 | 0 |
| 4991 | signos de apertura, comillas y puntuación | 891 Pokémon School | 356 | 121 | 0 | 64 | 0 |
| 4992 | idioma, glosario y nombres propios | 891 Pokémon School | 356 | 121 | 0 | 64 | 0 |
| 4985 | formato de caja y longitud de línea | 887–889 «Fire Ash original» | 185 | 64 | 0 | 84 | 0 |
| 4908 | variables, cantidades y nombres insertados | 650–653 «Fire Ash original» | 179 | 56 | 0 | 88 | 0 |

## Muestras extraídas

- **Tarea 4900** (formato de caja y longitud de línea · Mapa 631 «Route 222 House» · Ev 2 `Item`, pág. 1, 18 cols): `\bWant something useful?`
- **Tarea 4905** (formato de caja y longitud de línea · Mapa 643 «Sinnoh Pokemon League» · Ev 4 `Nurse`, pág. 1, 36 cols): `\rHello, and welcome to the Pokémon Center.`
- **Tarea 4901** (signos de apertura, comillas y puntuación · Mapa 632 «Sunnyshore City» · Ev 3 `Person`, pág. 1, 63 cols): `\bThis bridge is famous. Not many places have such  a complex bridge.`
- **Tarea 4906** (signos de apertura, comillas y puntuación · Mapa 643 «Sinnoh Pokemon League» · Ev 4 `Nurse`, pág. 1, 36 cols): `\rHello, and welcome to the Pokémon Center.`
- **Tarea 4902** (idioma, glosario y nombres propios · Mapa 636 «Ballonlea Stadium» · Ev 1 `Event`, pág. 2, 125 cols): `\bFirst, ranked eighth: The shining first Champion of  the Alola region's first-ever league. Hailing from Pallet  Town, Competitor \PN!`
- **Tarea 4907** (idioma, glosario y nombres propios · Mapa 650 «Unova» · Ev 1 `Trainer(6)`, pág. 1, 33 cols): `\rI'm going to be a bit harder okay?`
- **Tarea 4903** (variables, cantidades y nombres insertados · Mapa 641 «Sunnyshore Gym» · Ev 1 `Volkner`, pág. 1, 73 cols): `\bVolkner: Well you seem like you have some  potential. Don't disappoint me, okay.`
- **Tarea 4908** (variables, cantidades y nombres insertados · Mapa 650 «Unova» · Ev 1 `Trainer(6)`, pág. 1, 33 cols): `\rI'm going to be a bit harder okay?`
- **Tarea 4904** (sentido, tono y lectura humana · Mapa 642 «Lily of the Valley Island» · Ev 1 `Cop`, pág. 1, 29 cols): `\bWelcome. Where would you like to go?`
- **Tarea 4909** (sentido, tono y lectura humana · Mapa 653 «Professor Juniper's Lab» · Ev 1 `Professor`, pág. 1, 81 cols): `\rJuniper: I have an aide here that will help raise your   Pokémon. Feel free to ask them.`

## Límite honesto

Los mapas de «Fire Ash original» están congelados por política del proyecto: esta fase **muestra y mide** sus diálogos, no reescribe los `.rxdata`. Las métricas de formato, signos, glosario y variables quedan archivadas por tarea en el JSON de la fase; el juicio de sentido y tono permanece marcado como `manual_pending` y la ejecución interactiva en `Game.exe` como `runtime_pending`.
