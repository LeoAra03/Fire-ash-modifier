# FASE 047 — Mostrar y comprobar diálogos (tramo 4600–4699)

## Reproducción

```bash
node tools/plan2700/lote10_fase047_dialogos_3.mjs
node tools/plan2700/lote10_fase047_dialogos_3.mjs --verify
```

## Resumen medido

- **Tareas procesadas**: 100 (40 con lectura humana de sentido explícita · 0 sin mapas localizables).
- **Mapas únicos cubiertos**: 107 (mapas 108–214) · familias declaradas: «Fire Ash original».
- **Suma por tarea** (los tramos se solapan): 6646 eventos con diálogo · 167768 bloques 101/401 · 0 mensajes de script.
- **Recuento sin duplicar por mapa** (107 mapas): 1021 eventos con diálogo · 8353 bloques 101/401 · 0 mensajes de script.
- **Formato de caja (sin duplicar)**: 5500 líneas superan las 53 columnas · 7 bloques pasan de 2 líneas.
- **Signos (sin duplicar)**: 1457 interrogaciones sin «¿» · 3211 exclamaciones sin «¡» · 0 comillas impares.
- **Idioma y glosario (sin duplicar)**: 6529 bloques con marcas de inglés · 1399 aciertos de glosario.
- **Variables y cantidades (sin duplicar)**: \PN en 131 bloques · \v[n] en 75 ocasiones · 402 bloques con cifras · **referencias inválidas: 0**.
- **Tareas con alguna incidencia de formato/signos**: 100/100. Estado: `static_measured_manual_reading_pending`.

## Cobertura por aspecto

| Aspecto | Tareas | Lectura humana | Mapas | Bloques 101/401 | Script msgs | >53 cols | >2 líneas | ¿/¡ ausentes | Comillas impares | Glosario | `\PN` / `\v[n]` | Inválidas |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| formato de caja y longitud de línea | 20 | 5 | 30 | 31454 | 0 | 25037 | 36 | 19353 | 0 | 5251 | 394/153 | 0 |
| signos de apertura, comillas y puntuación | 20 | 5 | 50 | 31612 | 0 | 25066 | 36 | 19434 | 0 | 5263 | 399/147 | 0 |
| idioma, glosario y nombres propios | 20 | 5 | 24 | 31991 | 0 | 25265 | 37 | 19627 | 0 | 5287 | 381/181 | 0 |
| variables, cantidades y nombres insertados | 20 | 5 | 20 | 36343 | 0 | 29095 | 36 | 22837 | 0 | 6204 | 403/187 | 0 |
| sentido, tono y lectura humana | 20 | 20 | 26 | 36368 | 0 | 29088 | 36 | 22890 | 0 | 6212 | 395/184 | 0 |

## Cobertura por familia declarada

| Familia | Tareas | Lectura humana | Mapas | Rango de mapas | Bloques | Script msgs | Inválidas |
|---|---:|---:|---:|---|---:|---:|---:|
| Fire Ash original | 100 | 40 | 107 | 108–214 | 167768 | 0 | 0 |

## Tareas con más incidencias

| Tarea | Aspecto | Mapa(s) | Bloques | >53 cols | >2 líneas | ¿/¡ | Comillas |
|---:|---|---|---:|---:|---:|---:|---:|
| 4673 | variables, cantidades y nombres insertados | 212–214 «Fire Ash original» | 4568 | 3880 | 0 | 3289 | 0 |
| 4674 | sentido, tono y lectura humana | 214 STAGE | 4526 | 3865 | 0 | 3278 | 0 |
| 4675 | formato de caja y longitud de línea | 214 STAGE | 4526 | 3865 | 0 | 3278 | 0 |
| 4676 | signos de apertura, comillas y puntuación | 214 STAGE | 4526 | 3865 | 0 | 3278 | 0 |
| 4677 | idioma, glosario y nombres propios | 214 STAGE | 4526 | 3865 | 0 | 3278 | 0 |
| 4678 | variables, cantidades y nombres insertados | 214 STAGE | 4526 | 3865 | 0 | 3278 | 0 |
| 4679 | sentido, tono y lectura humana | 214 STAGE | 4526 | 3865 | 0 | 3278 | 0 |
| 4680 | formato de caja y longitud de línea | 214 STAGE | 4526 | 3865 | 0 | 3278 | 0 |
| 4681 | signos de apertura, comillas y puntuación | 214 STAGE | 4526 | 3865 | 0 | 3278 | 0 |
| 4682 | idioma, glosario y nombres propios | 214 STAGE | 4526 | 3865 | 0 | 3278 | 0 |

## Muestras extraídas

- **Tarea 4600** (formato de caja y longitud de línea · Mapa 108 «Vermilion City» · Ev 1 `Sign`, pág. 1, 16 cols): `Vermilion Harbor`
- **Tarea 4605** (formato de caja y longitud de línea · Mapa 120 «S.S. Anne Rooms» · Ev 1 `Trainer(1)`, pág. 1, 26 cols): `\bLet's have a friendly battle.`
- **Tarea 4601** (signos de apertura, comillas y puntuación · Mapa 108 «Vermilion City» · Ev 1 `Sign`, pág. 1, 16 cols): `Vermilion Harbor`
- **Tarea 4606** (signos de apertura, comillas y puntuación · Mapa 124 «Route 11» · Ev 1 `Trainer(1)`, pág. 1, 41 cols): `\bLet me battle with Butterfree one more time.`
- **Tarea 4602** (idioma, glosario y nombres propios · Mapa 110 «Vermilion Pokémon Center» · Ev 4 `Nurse`, pág. 1, 36 cols): `\rHello, and welcome to the Pokémon Center.`
- **Tarea 4607** (idioma, glosario y nombres propios · Mapa 130 «Saffron City» · Ev 2 `Person`, pág. 1, 32 cols): `\rSabrina is the Gym Leader of this town.`
- **Tarea 4603** (variables, cantidades y nombres insertados · Mapa 112 «Vermilion Gym» · Ev 3 `Trainer(3)`, pág. 2, 26 cols): `\bYou might have what it takes.`
- **Tarea 4608** (variables, cantidades y nombres insertados · Mapa 136 «Saffron Gym» · Ev 32 `Trainer(4)`, pág. 1, 19 cols): `\bYou dare challenge me?`
- **Tarea 4604** (sentido, tono y lectura humana · Mapa 113 «Vermilion Pokémon Fan Club» · Ev 1 `Pokemon`, pág. 1, 0 cols): `\bSeel`
- **Tarea 4609** (sentido, tono y lectura humana · Mapa 139 «Lavender House» · Ev 2 `Person`, pág. 1, 54 cols): `\rPokémon Tower is a creepy place. I wouldn't go in  there.`

## Límite honesto

Los mapas de «Fire Ash original» están congelados por política del proyecto: esta fase **muestra y mide** sus diálogos, no reescribe los `.rxdata`. Las métricas de formato, signos, glosario y variables quedan archivadas por tarea en el JSON de la fase; el juicio de sentido y tono permanece marcado como `manual_pending` y la ejecución interactiva en `Game.exe` como `runtime_pending`.
