# FASE 048 — Mostrar y comprobar diálogos (tramo 4700–4799)

## Reproducción

```bash
node tools/plan2700/lote10_fase048_dialogos_4.mjs
node tools/plan2700/lote10_fase048_dialogos_4.mjs --verify
```

## Resumen medido

- **Tareas procesadas**: 100 (40 con lectura humana de sentido explícita · 0 sin mapas localizables).
- **Mapas únicos cubiertos**: 90 (mapas 214–303) · familias declaradas: «Fire Ash original».
- **Suma por tarea** (los tramos se solapan): 4343 eventos con diálogo · 355101 bloques 101/401 · 0 mensajes de script.
- **Recuento sin duplicar por mapa** (90 mapas): 592 eventos con diálogo · 5981 bloques 101/401 · 0 mensajes de script.
- **Formato de caja (sin duplicar)**: 4195 líneas superan las 53 columnas · 0 bloques pasan de 2 líneas.
- **Signos (sin duplicar)**: 1113 interrogaciones sin «¿» · 2627 exclamaciones sin «¡» · 0 comillas impares.
- **Idioma y glosario (sin duplicar)**: 4760 bloques con marcas de inglés · 1209 aciertos de glosario.
- **Variables y cantidades (sin duplicar)**: \PN en 69 bloques · \v[n] en 33 ocasiones · 31 bloques con cifras · **referencias inválidas: 0**.
- **Tareas con alguna incidencia de formato/signos**: 100/100. Estado: `static_measured_manual_reading_pending`.

## Cobertura por aspecto

| Aspecto | Tareas | Lectura humana | Mapas | Bloques 101/401 | Script msgs | >53 cols | >2 líneas | ¿/¡ ausentes | Comillas impares | Glosario | `\PN` / `\v[n]` | Inválidas |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| formato de caja y longitud de línea | 20 | 5 | 20 | 72760 | 0 | 61921 | 0 | 52574 | 0 | 14620 | 438/45 | 0 |
| signos de apertura, comillas y puntuación | 20 | 5 | 24 | 72767 | 0 | 61951 | 0 | 52550 | 0 | 14641 | 451/36 | 0 |
| idioma, glosario y nombres propios | 20 | 5 | 19 | 72784 | 0 | 61929 | 0 | 52549 | 0 | 14640 | 454/41 | 0 |
| variables, cantidades y nombres insertados | 20 | 5 | 26 | 68384 | 0 | 58072 | 0 | 49354 | 0 | 13743 | 420/39 | 0 |
| sentido, tono y lectura humana | 20 | 20 | 27 | 68406 | 0 | 58073 | 0 | 49366 | 0 | 13747 | 421/48 | 0 |

## Cobertura por familia declarada

| Familia | Tareas | Lectura humana | Mapas | Rango de mapas | Bloques | Script msgs | Inválidas |
|---|---:|---:|---:|---|---:|---:|---:|
| Fire Ash original | 100 | 40 | 90 | 214–303 | 355101 | 0 | 0 |

## Tareas con más incidencias

| Tarea | Aspecto | Mapa(s) | Bloques | >53 cols | >2 líneas | ¿/¡ | Comillas |
|---:|---|---|---:|---:|---:|---:|---:|
| 4777 | idioma, glosario y nombres propios | 214–217 «Fire Ash original» | 4571 | 3879 | 0 | 3293 | 0 |
| 4700 | formato de caja y longitud de línea | 214 STAGE | 4526 | 3865 | 0 | 3278 | 0 |
| 4701 | signos de apertura, comillas y puntuación | 214 STAGE | 4526 | 3865 | 0 | 3278 | 0 |
| 4702 | idioma, glosario y nombres propios | 214 STAGE | 4526 | 3865 | 0 | 3278 | 0 |
| 4703 | variables, cantidades y nombres insertados | 214 STAGE | 4526 | 3865 | 0 | 3278 | 0 |
| 4704 | sentido, tono y lectura humana | 214 STAGE | 4526 | 3865 | 0 | 3278 | 0 |
| 4705 | formato de caja y longitud de línea | 214 STAGE | 4526 | 3865 | 0 | 3278 | 0 |
| 4706 | signos de apertura, comillas y puntuación | 214 STAGE | 4526 | 3865 | 0 | 3278 | 0 |
| 4707 | idioma, glosario y nombres propios | 214 STAGE | 4526 | 3865 | 0 | 3278 | 0 |
| 4708 | variables, cantidades y nombres insertados | 214 STAGE | 4526 | 3865 | 0 | 3278 | 0 |

## Muestras extraídas

- **Tarea 4700** (formato de caja y longitud de línea · Mapa 214 «STAGE» · Ev 1 `Kanto 2`, pág. 1, 88 cols): `\bBrock: Hi, I believe having rock hard defense and  determination will overcome all obstacles!`
- **Tarea 4705** (formato de caja y longitud de línea · Mapa 214 «STAGE» · Ev 1 `Kanto 2`, pág. 1, 88 cols): `\bBrock: Hi, I believe having rock hard defense and  determination will overcome all obstacles!`
- **Tarea 4701** (signos de apertura, comillas y puntuación · Mapa 214 «STAGE» · Ev 1 `Kanto 2`, pág. 1, 88 cols): `\bBrock: Hi, I believe having rock hard defense and  determination will overcome all obstacles!`
- **Tarea 4706** (signos de apertura, comillas y puntuación · Mapa 214 «STAGE» · Ev 1 `Kanto 2`, pág. 1, 88 cols): `\bBrock: Hi, I believe having rock hard defense and  determination will overcome all obstacles!`
- **Tarea 4702** (idioma, glosario y nombres propios · Mapa 214 «STAGE» · Ev 1 `Kanto 2`, pág. 1, 88 cols): `\bBrock: Hi, I believe having rock hard defense and  determination will overcome all obstacles!`
- **Tarea 4707** (idioma, glosario y nombres propios · Mapa 214 «STAGE» · Ev 1 `Kanto 2`, pág. 1, 88 cols): `\bBrock: Hi, I believe having rock hard defense and  determination will overcome all obstacles!`
- **Tarea 4703** (variables, cantidades y nombres insertados · Mapa 214 «STAGE» · Ev 1 `Kanto 2`, pág. 1, 88 cols): `\bBrock: Hi, I believe having rock hard defense and  determination will overcome all obstacles!`
- **Tarea 4708** (variables, cantidades y nombres insertados · Mapa 214 «STAGE» · Ev 1 `Kanto 2`, pág. 1, 88 cols): `\bBrock: Hi, I believe having rock hard defense and  determination will overcome all obstacles!`
- **Tarea 4704** (sentido, tono y lectura humana · Mapa 214 «STAGE» · Ev 1 `Kanto 2`, pág. 1, 88 cols): `\bBrock: Hi, I believe having rock hard defense and  determination will overcome all obstacles!`
- **Tarea 4709** (sentido, tono y lectura humana · Mapa 214 «STAGE» · Ev 1 `Kanto 2`, pág. 1, 88 cols): `\bBrock: Hi, I believe having rock hard defense and  determination will overcome all obstacles!`

## Límite honesto

Los mapas de «Fire Ash original» están congelados por política del proyecto: esta fase **muestra y mide** sus diálogos, no reescribe los `.rxdata`. Las métricas de formato, signos, glosario y variables quedan archivadas por tarea en el JSON de la fase; el juicio de sentido y tono permanece marcado como `manual_pending` y la ejecución interactiva en `Game.exe` como `runtime_pending`.
