# FASE 056 — Mostrar y comprobar diálogos (tramo 5500–5599)

## Reproducción

```bash
node tools/plan2700/lote10_fase056_dialogos_12.mjs
node tools/plan2700/lote10_fase056_dialogos_12.mjs --verify
```

## Resumen medido

- **Tareas procesadas**: 100 (40 con lectura humana de sentido explícita · 0 sin mapas localizables).
- **Mapas únicos cubiertos**: 181 (mapas 1751–1931) · familias declaradas: «Atlas Mil».
- **Suma por tarea** (los tramos se solapan): 1594 eventos con diálogo · 3632 bloques 101/401 · 0 mensajes de script.
- **Recuento sin duplicar por mapa** (181 mapas): 996 eventos con diálogo · 2175 bloques 101/401 · 0 mensajes de script.
- **Formato de caja (sin duplicar)**: 1335 líneas superan las 53 columnas · 0 bloques pasan de 2 líneas.
- **Signos (sin duplicar)**: 21 interrogaciones sin «¿» · 73 exclamaciones sin «¡» · 0 comillas impares.
- **Idioma y glosario (sin duplicar)**: 629 bloques con marcas de inglés · 363 aciertos de glosario.
- **Variables y cantidades (sin duplicar)**: \PN en 2 bloques · \v[n] en 0 ocasiones · 640 bloques con cifras · **referencias inválidas: 0**.
- **Tareas con alguna incidencia de formato/signos**: 100/100. Estado: `static_measured_manual_reading_pending`.

## Cobertura por aspecto

| Aspecto | Tareas | Lectura humana | Mapas | Bloques 101/401 | Script msgs | >53 cols | >2 líneas | ¿/¡ ausentes | Comillas impares | Glosario | `\PN` / `\v[n]` | Inválidas |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| formato de caja y longitud de línea | 20 | 5 | 54 | 679 | 0 | 456 | 0 | 18 | 0 | 86 | 1/0 | 0 |
| signos de apertura, comillas y puntuación | 20 | 5 | 59 | 748 | 0 | 475 | 0 | 30 | 0 | 114 | 1/0 | 0 |
| idioma, glosario y nombres propios | 20 | 5 | 55 | 709 | 0 | 431 | 0 | 33 | 0 | 130 | 0/0 | 0 |
| variables, cantidades y nombres insertados | 20 | 5 | 55 | 743 | 0 | 450 | 0 | 38 | 0 | 140 | 1/0 | 0 |
| sentido, tono y lectura humana | 20 | 20 | 55 | 753 | 0 | 467 | 0 | 38 | 0 | 138 | 1/0 | 0 |

## Cobertura por familia declarada

| Familia | Tareas | Lectura humana | Mapas | Rango de mapas | Bloques | Script msgs | Inválidas |
|---|---:|---:|---:|---|---:|---:|---:|
| Atlas Mil | 100 | 40 | 181 | 1751–1931 | 3632 | 0 | 0 |

## Tareas con más incidencias

| Tarea | Aspecto | Mapa(s) | Bloques | >53 cols | >2 líneas | ¿/¡ | Comillas |
|---:|---|---|---:|---:|---:|---:|---:|
| 5509 | sentido, tono y lectura humana | 1769–1771 «Atlas Mil» | 68 | 42 | 0 | 4 | 0 |
| 5537 | idioma, glosario y nombres propios | 1819–1821 «Atlas Mil» | 66 | 42 | 0 | 4 | 0 |
| 5565 | formato de caja y longitud de línea | 1868–1871 «Atlas Mil» | 61 | 46 | 0 | 0 | 0 |
| 5551 | signos de apertura, comillas y puntuación | 1844–1846 «Atlas Mil» | 66 | 41 | 0 | 4 | 0 |
| 5579 | sentido, tono y lectura humana | 1894–1896 «Atlas Mil» | 53 | 39 | 0 | 3 | 0 |
| 5523 | variables, cantidades y nombres insertados | 1794–1796 «Atlas Mil» | 52 | 40 | 0 | 0 | 0 |
| 5539 | sentido, tono y lectura humana | 1821–1822 «Atlas Mil» | 57 | 36 | 0 | 4 | 0 |
| 5511 | signos de apertura, comillas y puntuación | 1771–1772 «Atlas Mil» | 57 | 35 | 0 | 4 | 0 |
| 5593 | variables, cantidades y nombres insertados | 1919–1921 «Atlas Mil» | 57 | 34 | 0 | 4 | 0 |
| 5581 | signos de apertura, comillas y puntuación | 1896–1897 «Atlas Mil» | 44 | 33 | 0 | 3 | 0 |

## Muestras extraídas

- **Tarea 5500** (formato de caja y longitud de línea · Mapa 1751 «La Academia que Vendía Dificultad» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5505** (formato de caja y longitud de línea · Mapa 1761 «Atlas 0741 - Cynthia's Villa» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5501** (signos de apertura, comillas y puntuación · Mapa 1753 «Atlas 0733 - Virbank City» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5506** (signos de apertura, comillas y puntuación · Mapa 1763 «Atlas 0743 - Junior Cup Room» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5502** (idioma, glosario y nombres propios · Mapa 1755 «Atlas 0735 - Virbank Pokémon Center» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5507** (idioma, glosario y nombres propios · Mapa 1765 «El Mapa de Tinta que Explicaba Atajos» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5503** (variables, cantidades y nombres insertados · Mapa 1757 «Atlas 0737 - Route 16» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5508** (variables, cantidades y nombres insertados · Mapa 1767 «Atlas 0747 - Pinwheel Forest» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5504** (sentido, tono y lectura humana · Mapa 1759 «Atlas 0739 - Undella House» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5509** (sentido, tono y lectura humana · Mapa 1769 «Atlas 0749 - Opelucid City» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`

## Límite honesto

Los mapas auditados pertenecen a «Atlas Mil». Los de «Fire Ash original» están congelados por política del proyecto y las demás familias se auditan sin reescribir sus textos en esta tanda: la fase **muestra y mide** los diálogos, no modifica los `.rxdata`. Las métricas de formato, signos, glosario y variables quedan archivadas por tarea en el JSON de la fase; el juicio de sentido y tono permanece marcado como `manual_pending` y la ejecución interactiva en `Game.exe` como `runtime_pending`.
