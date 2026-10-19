# FASE 053 — Mostrar y comprobar diálogos (tramo 5200–5299)

## Reproducción

```bash
node tools/plan2700/lote10_fase053_dialogos_9.mjs
node tools/plan2700/lote10_fase053_dialogos_9.mjs --verify
```

## Resumen medido

- **Tareas procesadas**: 100 (40 con lectura humana de sentido explícita · 0 sin mapas localizables).
- **Mapas únicos cubiertos**: 188 (mapas 1196–1383) · familias declaradas: «Atlas Mil».
- **Suma por tarea** (los tramos se solapan): 1711 eventos con diálogo · 3602 bloques 101/401 · 0 mensajes de script.
- **Recuento sin duplicar por mapa** (188 mapas): 1066 eventos con diálogo · 2106 bloques 101/401 · 0 mensajes de script.
- **Formato de caja (sin duplicar)**: 1019 líneas superan las 53 columnas · 0 bloques pasan de 2 líneas.
- **Signos (sin duplicar)**: 30 interrogaciones sin «¿» · 84 exclamaciones sin «¡» · 0 comillas impares.
- **Idioma y glosario (sin duplicar)**: 701 bloques con marcas de inglés · 549 aciertos de glosario.
- **Variables y cantidades (sin duplicar)**: \PN en 1 bloque · \v[n] en 0 ocasiones · 566 bloques con cifras · **referencias inválidas: 0**.
- **Tareas con alguna incidencia de formato/signos**: 100/100. Estado: `static_measured_manual_reading_pending`.

## Cobertura por aspecto

| Aspecto | Tareas | Lectura humana | Mapas | Bloques 101/401 | Script msgs | >53 cols | >2 líneas | ¿/¡ ausentes | Comillas impares | Glosario | `\PN` / `\v[n]` | Inválidas |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| formato de caja y longitud de línea | 20 | 5 | 59 | 819 | 0 | 423 | 0 | 52 | 0 | 225 | 0/0 | 0 |
| signos de apertura, comillas y puntuación | 20 | 5 | 55 | 642 | 0 | 344 | 0 | 21 | 0 | 138 | 0/0 | 0 |
| idioma, glosario y nombres propios | 20 | 5 | 61 | 792 | 0 | 412 | 0 | 42 | 0 | 224 | 0/0 | 0 |
| variables, cantidades y nombres insertados | 20 | 5 | 57 | 662 | 0 | 349 | 0 | 29 | 0 | 143 | 1/0 | 0 |
| sentido, tono y lectura humana | 20 | 20 | 54 | 687 | 0 | 365 | 0 | 35 | 0 | 167 | 0/0 | 0 |

## Cobertura por familia declarada

| Familia | Tareas | Lectura humana | Mapas | Rango de mapas | Bloques | Script msgs | Inválidas |
|---|---:|---:|---:|---|---:|---:|---:|
| Atlas Mil | 100 | 40 | 188 | 1196–1383 | 3602 | 0 | 0 |

## Tareas con más incidencias

| Tarea | Aspecto | Mapa(s) | Bloques | >53 cols | >2 líneas | ¿/¡ | Comillas |
|---:|---|---|---:|---:|---:|---:|---:|
| 5278 | variables, cantidades y nombres insertados | 1343–1346 «Atlas Mil» | 55 | 35 | 0 | 5 | 0 |
| 5241 | signos de apertura, comillas y puntuación | 1271–1274 «Atlas Mil» | 59 | 39 | 0 | 0 | 0 |
| 5265 | formato de caja y longitud de línea | 1319–1321 «Atlas Mil» | 62 | 34 | 0 | 5 | 0 |
| 5214 | sentido, tono y lectura humana | 1221–1224 «Atlas Mil» | 58 | 37 | 0 | 0 | 0 |
| 5227 | idioma, glosario y nombres propios | 1246–1247 «Atlas Mil» | 58 | 33 | 0 | 4 | 0 |
| 5254 | sentido, tono y lectura humana | 1296–1298 «Atlas Mil» | 62 | 32 | 0 | 5 | 0 |
| 5294 | sentido, tono y lectura humana | 1371–1374 «Atlas Mil» | 55 | 36 | 0 | 1 | 0 |
| 5201 | signos de apertura, comillas y puntuación | 1196–1198 «Atlas Mil» | 51 | 35 | 0 | 0 | 0 |
| 5225 | formato de caja y longitud de línea | 1244–1246 «Atlas Mil» | 53 | 34 | 0 | 1 | 0 |
| 5212 | idioma, glosario y nombres propios | 1219–1221 «Atlas Mil» | 51 | 34 | 0 | 0 | 0 |

## Muestras extraídas

- **Tarea 5200** (formato de caja y longitud de línea · Mapa 1196 «La Persona Fuera del Encuadre» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5205** (formato de caja y longitud de línea · Mapa 1204 «Atlas 0184 - Cinnabar Pokémon Center» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5201** (signos de apertura, comillas y puntuación · Mapa 1196 «La Persona Fuera del Encuadre» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5206** (signos de apertura, comillas y puntuación · Mapa 1207 «Atlas 0187 - Pokémon Mansion 1F» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5202** (idioma, glosario y nombres propios · Mapa 1198 «Atlas 0178 - Safari Zone Kanto» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5207** (idioma, glosario y nombres propios · Mapa 1208 «La Mansión de los Espejos de Salida» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5203** (variables, cantidades y nombres insertados · Mapa 1201 «La Lluvia de los Siete Colores» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5208** (variables, cantidades y nombres insertados · Mapa 1211 «Atlas 0191 - Cinnabar Gym» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5204** (sentido, tono y lectura humana · Mapa 1202 «Atlas 0182 - Cinnabar Island» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`
- **Tarea 5209** (sentido, tono y lectura humana · Mapa 1214 «Atlas 0194 - Indigo Plateau» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`

## Límite honesto

Los mapas auditados pertenecen a «Atlas Mil». Los de «Fire Ash original» están congelados por política del proyecto y las demás familias se auditan sin reescribir sus textos en esta tanda: la fase **muestra y mide** los diálogos, no modifica los `.rxdata`. Las métricas de formato, signos, glosario y variables quedan archivadas por tarea en el JSON de la fase; el juicio de sentido y tono permanece marcado como `manual_pending` y la ejecución interactiva en `Game.exe` como `runtime_pending`.
