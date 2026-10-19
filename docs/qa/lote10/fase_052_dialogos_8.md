# FASE 052 — Mostrar y comprobar diálogos (tramo 5100–5199)

## Reproducción

```bash
node tools/plan2700/lote10_fase052_dialogos_8.mjs
node tools/plan2700/lote10_fase052_dialogos_8.mjs --verify
```

## Resumen medido

- **Tareas procesadas**: 100 (40 con lectura humana de sentido explícita · 0 sin mapas localizables).
- **Mapas únicos cubiertos**: 178 (mapas 1019–1196) · familias declaradas: «Horizontes», «Atlas Mil».
- **Suma por tarea** (los tramos se solapan): 1856 eventos con diálogo · 4389 bloques 101/401 · 0 mensajes de script.
- **Recuento sin duplicar por mapa** (178 mapas): 1071 eventos con diálogo · 2234 bloques 101/401 · 0 mensajes de script.
- **Formato de caja (sin duplicar)**: 1132 líneas superan las 53 columnas · 0 bloques pasan de 2 líneas.
- **Signos (sin duplicar)**: 65 interrogaciones sin «¿» · 119 exclamaciones sin «¡» · 0 comillas impares.
- **Idioma y glosario (sin duplicar)**: 858 bloques con marcas de inglés · 495 aciertos de glosario.
- **Variables y cantidades (sin duplicar)**: \PN en 5 bloques · \v[n] en 0 ocasiones · 583 bloques con cifras · **referencias inválidas: 0**.
- **Tareas con alguna incidencia de formato/signos**: 100/100. Estado: `static_measured_manual_reading_pending`.

## Cobertura por aspecto

| Aspecto | Tareas | Lectura humana | Mapas | Bloques 101/401 | Script msgs | >53 cols | >2 líneas | ¿/¡ ausentes | Comillas impares | Glosario | `\PN` / `\v[n]` | Inválidas |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| formato de caja y longitud de línea | 20 | 5 | 55 | 948 | 0 | 509 | 0 | 112 | 0 | 195 | 3/0 | 0 |
| signos de apertura, comillas y puntuación | 20 | 5 | 52 | 902 | 0 | 486 | 0 | 114 | 0 | 193 | 1/0 | 0 |
| idioma, glosario y nombres propios | 20 | 5 | 57 | 801 | 0 | 460 | 0 | 44 | 0 | 233 | 2/0 | 0 |
| variables, cantidades y nombres insertados | 20 | 5 | 60 | 851 | 0 | 464 | 0 | 49 | 0 | 253 | 0/0 | 0 |
| sentido, tono y lectura humana | 20 | 20 | 53 | 887 | 0 | 426 | 0 | 118 | 0 | 213 | 0/0 | 0 |

## Cobertura por familia declarada

| Familia | Tareas | Lectura humana | Mapas | Rango de mapas | Bloques | Script msgs | Inválidas |
|---|---:|---:|---:|---|---:|---:|---:|
| Horizontes | 6 | 2 | 3 | 1019–1021 | 524 | 0 | 0 |
| Atlas Mil | 94 | 38 | 176 | 1021–1196 | 3865 | 0 | 0 |

## Tareas con más incidencias

| Tarea | Aspecto | Mapa(s) | Bloques | >53 cols | >2 líneas | ¿/¡ | Comillas |
|---:|---|---|---:|---:|---:|---:|---:|
| 5101 | signos de apertura, comillas y puntuación | 1019–1020 «Horizontes» | 140 | 128 | 0 | 0 | 0 |
| 5189 | sentido, tono y lectura humana | 1179–1180 «Atlas Mil» | 174 | 31 | 0 | 88 | 0 |
| 5191 | signos de apertura, comillas y puntuación | 1180–1181 «Atlas Mil» | 174 | 31 | 0 | 88 | 0 |
| 5190 | formato de caja y longitud de línea | 1180 Atlas 0160 - Game Corner | 167 | 28 | 0 | 88 | 0 |
| 5105 | formato de caja y longitud de línea | 1020–1021 «Horizontes» | 104 | 93 | 0 | 1 | 0 |
| 5100 | formato de caja y longitud de línea | 1019 Enredo Feérico | 70 | 64 | 0 | 0 | 0 |
| 5102 | idioma, glosario y nombres propios | 1020 Panteón Pokégod | 70 | 64 | 0 | 0 | 0 |
| 5103 | variables, cantidades y nombres insertados | 1020 Panteón Pokégod | 70 | 64 | 0 | 0 | 0 |
| 5104 | sentido, tono y lectura humana | 1020 Panteón Pokégod | 70 | 64 | 0 | 0 | 0 |
| 5107 | idioma, glosario y nombres propios | 1021–1024 «Atlas Mil» | 60 | 52 | 0 | 1 | 0 |

## Muestras extraídas

- **Tarea 5100** (formato de caja y longitud de línea · Mapa 1019 «Enredo Feérico» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 42 cols): `La ruta estable vuelve a Puerto Horizonte.`
- **Tarea 5105** (formato de caja y longitud de línea · Mapa 1020 «Panteón Pokégod» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 42 cols): `La ruta estable vuelve a Puerto Horizonte.`
- **Tarea 5101** (signos de apertura, comillas y puntuación · Mapa 1019 «Enredo Feérico» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 42 cols): `La ruta estable vuelve a Puerto Horizonte.`
- **Tarea 5106** (signos de apertura, comillas y puntuación · Mapa 1021 «Pueblo Campanario» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 77 cols): `El arco de retorno conecta Pueblo Campanario con Puerto Horizonte. Horizonte.`
- **Tarea 5102** (idioma, glosario y nombres propios · Mapa 1020 «Panteón Pokégod» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 42 cols): `La ruta estable vuelve a Puerto Horizonte.`
- **Tarea 5107** (idioma, glosario y nombres propios · Mapa 1021 «Pueblo Campanario» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 77 cols): `El arco de retorno conecta Pueblo Campanario con Puerto Horizonte. Horizonte.`
- **Tarea 5103** (variables, cantidades y nombres insertados · Mapa 1020 «Panteón Pokégod» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 42 cols): `La ruta estable vuelve a Puerto Horizonte.`
- **Tarea 5108** (variables, cantidades y nombres insertados · Mapa 1024 «Ruta del Zumbido Dorado» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 83 cols): `El arco de retorno conecta Ruta del Zumbido Dorado con Puerto Horizonte. Horizonte.`
- **Tarea 5104** (sentido, tono y lectura humana · Mapa 1020 «Panteón Pokégod» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 42 cols): `La ruta estable vuelve a Puerto Horizonte.`
- **Tarea 5109** (sentido, tono y lectura humana · Mapa 1026 «El Semáforo de las Promesas Tardías» · Ev 1 `Return to Puerto Horizonte`, pág. 1, 52 cols): `La baliza regresa inmediatamente a Puerto Horizonte.`

## Límite honesto

Los mapas auditados pertenecen a «Horizontes» y «Atlas Mil». Los de «Fire Ash original» están congelados por política del proyecto y las demás familias se auditan sin reescribir sus textos en esta tanda: la fase **muestra y mide** los diálogos, no modifica los `.rxdata`. Las métricas de formato, signos, glosario y variables quedan archivadas por tarea en el JSON de la fase; el juicio de sentido y tono permanece marcado como `manual_pending` y la ejecución interactiva en `Game.exe` como `runtime_pending`.
