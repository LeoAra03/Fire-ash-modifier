# FASE 055 — Mostrar y comprobar diálogos (tramo 5400–5499)

## Reproducción

```bash
node tools/plan2700/lote10_fase055_dialogos_11.mjs
node tools/plan2700/lote10_fase055_dialogos_11.mjs --verify
```

## Resumen medido

- **Tareas procesadas**: 100 (40 con lectura humana de sentido explícita · 0 sin mapas localizables).
- **Mapas únicos cubiertos**: 181 (mapas 1571–1751) · familias declaradas: «Atlas Mil».
- **Suma por tarea** (los tramos se solapan): 1581 eventos con diálogo · 3502 bloques 101/401 · 0 mensajes de script.
- **Recuento sin duplicar por mapa** (181 mapas): 993 eventos con diálogo · 2120 bloques 101/401 · 0 mensajes de script.
- **Formato de caja (sin duplicar)**: 1308 líneas superan las 53 columnas · 0 bloques pasan de 2 líneas.
- **Signos (sin duplicar)**: 23 interrogaciones sin «¿» · 56 exclamaciones sin «¡» · 0 comillas impares.
- **Idioma y glosario (sin duplicar)**: 583 bloques con marcas de inglés · 344 aciertos de glosario.
- **Variables y cantidades (sin duplicar)**: \PN en 1 bloque · \v[n] en 0 ocasiones · 639 bloques con cifras · **referencias inválidas: 0**.
- **Tareas con alguna incidencia de formato/signos**: 100/100. Estado: `static_measured_manual_reading_pending`.

## Cobertura por aspecto

| Aspecto | Tareas | Lectura humana | Mapas | Bloques 101/401 | Script msgs | >53 cols | >2 líneas | ¿/¡ ausentes | Comillas impares | Glosario | `\PN` / `\v[n]` | Inválidas |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| formato de caja y longitud de línea | 20 | 5 | 58 | 715 | 0 | 465 | 0 | 17 | 0 | 101 | 0/0 | 0 |
| signos de apertura, comillas y puntuación | 20 | 5 | 57 | 683 | 0 | 443 | 0 | 20 | 0 | 100 | 0/0 | 0 |
| idioma, glosario y nombres propios | 20 | 5 | 55 | 668 | 0 | 424 | 0 | 21 | 0 | 93 | 1/0 | 0 |
| variables, cantidades y nombres insertados | 20 | 5 | 54 | 685 | 0 | 421 | 0 | 31 | 0 | 111 | 1/0 | 0 |
| sentido, tono y lectura humana | 20 | 20 | 54 | 751 | 0 | 445 | 0 | 43 | 0 | 158 | 0/0 | 0 |

## Cobertura por familia declarada

| Familia | Tareas | Lectura humana | Mapas | Rango de mapas | Bloques | Script msgs | Inválidas |
|---|---:|---:|---:|---|---:|---:|---:|
| Atlas Mil | 100 | 40 | 181 | 1571–1751 | 3502 | 0 | 0 |

## Tareas con más incidencias

| Tarea | Aspecto | Mapa(s) | Bloques | >53 cols | >2 líneas | ¿/¡ | Comillas |
|---:|---|---|---:|---:|---:|---:|---:|
| 5495 | formato de caja y longitud de línea | 1743–1746 «Atlas Mil» | 75 | 46 | 0 | 4 | 0 |
| 5484 | sentido, tono y lectura humana | 1721–1724 «Atlas Mil» | 72 | 42 | 0 | 5 | 0 |
| 5429 | sentido, tono y lectura humana | 1621–1624 «Atlas Mil» | 58 | 43 | 0 | 1 | 0 |
| 5468 | variables, cantidades y nombres insertados | 1694–1696 «Atlas Mil» | 63 | 39 | 0 | 5 | 0 |
| 5454 | sentido, tono y lectura humana | 1669–1671 «Atlas Mil» | 49 | 37 | 0 | 2 | 0 |
| 5456 | signos de apertura, comillas y puntuación | 1671–1672 «Atlas Mil» | 54 | 33 | 0 | 6 | 0 |
| 5470 | formato de caja y longitud de línea | 1696–1698 «Atlas Mil» | 49 | 37 | 0 | 1 | 0 |
| 5401 | signos de apertura, comillas y puntuación | 1571–1572 «Atlas Mil» | 45 | 35 | 0 | 1 | 0 |
| 5413 | variables, cantidades y nombres insertados | 1594–1596 «Atlas Mil» | 49 | 35 | 0 | 1 | 0 |
| 5415 | formato de caja y longitud de línea | 1596–1598 «Atlas Mil» | 49 | 35 | 0 | 1 | 0 |

## Muestras extraídas

- **Tarea 5400** (formato de caja y longitud de línea · Mapa 1571 «La Ciudad que Pagaba con Recuerdos» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5405** (formato de caja y longitud de línea · Mapa 1578 «Atlas 0558 - Solaceon Town» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5401** (signos de apertura, comillas y puntuación · Mapa 1571 «La Ciudad que Pagaba con Recuerdos» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5406** (signos de apertura, comillas y puntuación · Mapa 1580 «Atlas 0560 - Solaceon Day Care» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5402** (idioma, glosario y nombres propios · Mapa 1572 «Atlas 0552 - Battle Hall» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5407** (idioma, glosario y nombres propios · Mapa 1582 «Atlas 0562 - Glimwood Tangle» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5403** (variables, cantidades y nombres insertados · Mapa 1574 «Atlas 0554 - Battle Hall Stadium» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5408** (variables, cantidades y nombres insertados · Mapa 1584 «Atlas 0564 - Solaceon Ruins» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5404** (sentido, tono y lectura humana · Mapa 1576 «El Estadio que Sembraba Rivales» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5409** (sentido, tono y lectura humana · Mapa 1586 «Atlas 0566 - Route 210 House» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`

## Límite honesto

Los mapas auditados pertenecen a «Atlas Mil». Los de «Fire Ash original» están congelados por política del proyecto y las demás familias se auditan sin reescribir sus textos en esta tanda: la fase **muestra y mide** los diálogos, no modifica los `.rxdata`. Las métricas de formato, signos, glosario y variables quedan archivadas por tarea en el JSON de la fase; el juicio de sentido y tono permanece marcado como `manual_pending` y la ejecución interactiva en `Game.exe` como `runtime_pending`.
