# FASE 054 — Mostrar y comprobar diálogos (tramo 5300–5399)

## Reproducción

```bash
node tools/plan2700/lote10_fase054_dialogos_10.mjs
node tools/plan2700/lote10_fase054_dialogos_10.mjs --verify
```

## Resumen medido

- **Tareas procesadas**: 100 (40 con lectura humana de sentido explícita · 0 sin mapas localizables).
- **Mapas únicos cubiertos**: 189 (mapas 1383–1571) · familias declaradas: «Atlas Mil».
- **Suma por tarea** (los tramos se solapan): 1695 eventos con diálogo · 3746 bloques 101/401 · 0 mensajes de script.
- **Recuento sin duplicar por mapa** (189 mapas): 1065 eventos con diálogo · 2197 bloques 101/401 · 0 mensajes de script.
- **Formato de caja (sin duplicar)**: 1128 líneas superan las 53 columnas · 0 bloques pasan de 2 líneas.
- **Signos (sin duplicar)**: 30 interrogaciones sin «¿» · 88 exclamaciones sin «¡» · 0 comillas impares.
- **Idioma y glosario (sin duplicar)**: 758 bloques con marcas de inglés · 528 aciertos de glosario.
- **Variables y cantidades (sin duplicar)**: \PN en 1 bloque · \v[n] en 0 ocasiones · 591 bloques con cifras · **referencias inválidas: 0**.
- **Tareas con alguna incidencia de formato/signos**: 100/100. Estado: `static_measured_manual_reading_pending`.

## Cobertura por aspecto

| Aspecto | Tareas | Lectura humana | Mapas | Bloques 101/401 | Script msgs | >53 cols | >2 líneas | ¿/¡ ausentes | Comillas impares | Glosario | `\PN` / `\v[n]` | Inválidas |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| formato de caja y longitud de línea | 20 | 5 | 64 | 798 | 0 | 428 | 0 | 39 | 0 | 179 | 0/0 | 0 |
| signos de apertura, comillas y puntuación | 20 | 5 | 52 | 668 | 0 | 354 | 0 | 36 | 0 | 158 | 0/0 | 0 |
| idioma, glosario y nombres propios | 20 | 5 | 58 | 756 | 0 | 427 | 0 | 33 | 0 | 157 | 0/0 | 0 |
| variables, cantidades y nombres insertados | 20 | 5 | 56 | 742 | 0 | 367 | 0 | 53 | 0 | 214 | 1/0 | 0 |
| sentido, tono y lectura humana | 20 | 20 | 57 | 782 | 0 | 426 | 0 | 46 | 0 | 196 | 1/0 | 0 |

## Cobertura por familia declarada

| Familia | Tareas | Lectura humana | Mapas | Rango de mapas | Bloques | Script msgs | Inválidas |
|---|---:|---:|---:|---|---:|---:|---:|
| Atlas Mil | 100 | 40 | 189 | 1383–1571 | 3746 | 0 | 0 |

## Tareas con más incidencias

| Tarea | Aspecto | Mapa(s) | Bloques | >53 cols | >2 líneas | ¿/¡ | Comillas |
|---:|---|---|---:|---:|---:|---:|---:|
| 5399 | sentido, tono y lectura humana | 1569–1571 «Atlas Mil» | 80 | 44 | 0 | 8 | 0 |
| 5345 | formato de caja y longitud de línea | 1468–1471 «Atlas Mil» | 74 | 43 | 0 | 5 | 0 |
| 5374 | sentido, tono y lectura humana | 1521–1524 «Atlas Mil» | 62 | 46 | 0 | 0 | 0 |
| 5318 | variables, cantidades y nombres insertados | 1418–1421 «Atlas Mil» | 69 | 35 | 0 | 7 | 0 |
| 5361 | signos de apertura, comillas y puntuación | 1496–1499 «Atlas Mil» | 61 | 39 | 0 | 1 | 0 |
| 5334 | sentido, tono y lectura humana | 1446–1449 «Atlas Mil» | 58 | 39 | 0 | 0 | 0 |
| 5347 | idioma, glosario y nombres propios | 1471–1472 «Atlas Mil» | 58 | 35 | 0 | 4 | 0 |
| 5372 | idioma, glosario y nombres propios | 1520–1521 «Atlas Mil» | 55 | 33 | 0 | 5 | 0 |
| 5320 | formato de caja y longitud de línea | 1421–1422 «Atlas Mil» | 55 | 29 | 0 | 7 | 0 |
| 5307 | idioma, glosario y nombres propios | 1396–1397 «Atlas Mil» | 55 | 29 | 0 | 5 | 0 |

## Muestras extraídas

- **Tarea 5300** (formato de caja y longitud de línea · Mapa 1383 «La Casa que Afinaba sus Clavos» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5305** (formato de caja y longitud de línea · Mapa 1394 «Atlas 0374 - Rustboro Gym» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5301** (signos de apertura, comillas y puntuación · Mapa 1386 «Atlas 0366 - Route 104» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5306** (signos de apertura, comillas y puntuación · Mapa 1396 «La Receta que Lloraba por Otros» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5302** (idioma, glosario y nombres propios · Mapa 1388 «Atlas 0368 - Route 104 House» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5307** (idioma, glosario y nombres propios · Mapa 1396 «La Receta que Lloraba por Otros» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5303** (variables, cantidades y nombres insertados · Mapa 1390 «La Ciudad que Excavaba sus Cimientos» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5308** (variables, cantidades y nombres insertados · Mapa 1397 «Atlas 0377 - Dewford Pokémon Center» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5304** (sentido, tono y lectura humana · Mapa 1392 «Atlas 0372 - Rustboro Pokémon Center» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5309** (sentido, tono y lectura humana · Mapa 1400 «Atlas 0380 - Dewford Gym» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`

## Límite honesto

Los mapas auditados pertenecen a «Atlas Mil». Los de «Fire Ash original» están congelados por política del proyecto y las demás familias se auditan sin reescribir sus textos en esta tanda: la fase **muestra y mide** los diálogos, no modifica los `.rxdata`. Las métricas de formato, signos, glosario y variables quedan archivadas por tarea en el JSON de la fase; el juicio de sentido y tono permanece marcado como `manual_pending` y la ejecución interactiva en `Game.exe` como `runtime_pending`.
