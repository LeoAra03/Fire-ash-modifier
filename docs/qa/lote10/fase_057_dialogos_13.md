# FASE 057 — Mostrar y comprobar diálogos (tramo 5600–5699)

## Reproducción

```bash
node tools/plan2700/lote10_fase057_dialogos_13.mjs
node tools/plan2700/lote10_fase057_dialogos_13.mjs --verify
```

## Resumen medido

- **Tareas procesadas**: 100 (40 con lectura humana de sentido explícita · 0 sin mapas localizables).
- **Mapas únicos cubiertos**: 204 (mapas 1931–2135) · familias declaradas: «Atlas Mil», «Ruta de Dios + Silver», «Dimensional Nightmare».
- **Suma por tarea** (los tramos se solapan): 1849 eventos con diálogo · 4414 bloques 101/401 · 101 mensajes de script.
- **Recuento sin duplicar por mapa** (204 mapas): 1198 eventos con diálogo · 2778 bloques 101/401 · 53 mensajes de script.
- **Formato de caja (sin duplicar)**: 2148 líneas superan las 53 columnas · 0 bloques pasan de 2 líneas.
- **Signos (sin duplicar)**: 14 interrogaciones sin «¿» · 32 exclamaciones sin «¡» · 0 comillas impares.
- **Idioma y glosario (sin duplicar)**: 875 bloques con marcas de inglés · 643 aciertos de glosario.
- **Variables y cantidades (sin duplicar)**: \PN en 4 bloques · \v[n] en 1 ocasión · 698 bloques con cifras · **referencias inválidas: 0**.
- **Tareas con alguna incidencia de formato/signos**: 100/100. Estado: `static_measured_manual_reading_pending`.

## Cobertura por aspecto

| Aspecto | Tareas | Lectura humana | Mapas | Bloques 101/401 | Script msgs | >53 cols | >2 líneas | ¿/¡ ausentes | Comillas impares | Glosario | `\PN` / `\v[n]` | Inválidas |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| formato de caja y longitud de línea | 20 | 5 | 55 | 817 | 6 | 615 | 0 | 14 | 0 | 186 | 1/0 | 0 |
| signos de apertura, comillas y puntuación | 20 | 5 | 63 | 912 | 14 | 700 | 0 | 13 | 0 | 215 | 0/0 | 0 |
| idioma, glosario y nombres propios | 20 | 5 | 61 | 865 | 37 | 652 | 0 | 20 | 0 | 225 | 2/0 | 0 |
| variables, cantidades y nombres insertados | 20 | 5 | 65 | 905 | 34 | 692 | 0 | 23 | 0 | 200 | 2/1 | 0 |
| sentido, tono y lectura humana | 20 | 20 | 58 | 915 | 10 | 713 | 0 | 13 | 0 | 193 | 2/0 | 0 |

## Cobertura por familia declarada

| Familia | Tareas | Lectura humana | Mapas | Rango de mapas | Bloques | Script msgs | Inválidas |
|---|---:|---:|---:|---|---:|---:|---:|
| Atlas Mil | 49 | 19 | 92 | 1931–2022 | 1692 | 0 | 0 |
| Ruta de Dios + Silver | 9 | 4 | 18 | 2022–2040 | 525 | 30 | 0 |
| Dimensional Nightmare | 42 | 17 | 96 | 2040–2135 | 2197 | 71 | 0 |

## Tareas con más incidencias

| Tarea | Aspecto | Mapa(s) | Bloques | >53 cols | >2 líneas | ¿/¡ | Comillas |
|---:|---|---|---:|---:|---:|---:|---:|
| 5698 | variables, cantidades y nombres insertados | 2133–2135 «Dimensional Nightmare» | 87 | 75 | 0 | 0 | 0 |
| 5684 | sentido, tono y lectura humana | 2100–2103 «Dimensional Nightmare» | 87 | 69 | 0 | 0 | 0 |
| 5653 | variables, cantidades y nombres insertados | 2027–2029 «Ruta de Dios + Silver» | 81 | 66 | 0 | 0 | 0 |
| 5686 | signos de apertura, comillas y puntuación | 2103–2105 «Dimensional Nightmare» | 80 | 63 | 0 | 0 | 0 |
| 5679 | sentido, tono y lectura humana | 2087–2089 «Dimensional Nightmare» | 62 | 56 | 0 | 0 | 0 |
| 5649 | sentido, tono y lectura humana | 2022–2024 «Ruta de Dios + Silver» | 65 | 55 | 0 | 0 | 0 |
| 5664 | sentido, tono y lectura humana | 2054–2056 «Dimensional Nightmare» | 65 | 54 | 0 | 0 | 0 |
| 5681 | signos de apertura, comillas y puntuación | 2092–2095 «Dimensional Nightmare» | 57 | 54 | 0 | 0 | 0 |
| 5699 | sentido, tono y lectura humana | 2135 DN 2135 · Cámara de KINGGUS | 63 | 54 | 0 | 0 | 0 |
| 5671 | signos de apertura, comillas y puntuación | 2070–2072 «Dimensional Nightmare» | 68 | 52 | 0 | 0 | 0 |

## Muestras extraídas

- **Tarea 5600** (formato de caja y longitud de línea · Mapa 1931 «Atlas 0911 - Lush Jungle» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5605** (formato de caja y longitud de línea · Mapa 1941 «Atlas 0921 - Aether Paradise-Moon» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5601** (signos de apertura, comillas y puntuación · Mapa 1933 «La Prueba que Ocultaba sus Reglas» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5606** (signos de apertura, comillas y puntuación · Mapa 1943 «Atlas 0923 - Royal House» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5602** (idioma, glosario y nombres propios · Mapa 1935 «Atlas 0915 - Ten Carat Hill» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5607** (idioma, glosario y nombres propios · Mapa 1945 «Atlas 0925 - Battle Royal Dome» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5603** (variables, cantidades y nombres insertados · Mapa 1937 «Atlas 0917 - Altar of the Sunne» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5608** (variables, cantidades y nombres insertados · Mapa 1946 «El Enemigo que Alguien Recordó por Ti» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5604** (sentido, tono y lectura humana · Mapa 1940 «El Eco que Contestaba Antes de la Pregunta» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5609** (sentido, tono y lectura humana · Mapa 1947 «Atlas 0927 - Tapu Village» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`

## Límite honesto

Los mapas auditados pertenecen a «Atlas Mil», «Ruta de Dios + Silver» y «Dimensional Nightmare». Los de «Fire Ash original» están congelados por política del proyecto y las demás familias se auditan sin reescribir sus textos en esta tanda: la fase **muestra y mide** los diálogos, no modifica los `.rxdata`. Las métricas de formato, signos, glosario y variables quedan archivadas por tarea en el JSON de la fase; el juicio de sentido y tono permanece marcado como `manual_pending` y la ejecución interactiva en `Game.exe` como `runtime_pending`.
