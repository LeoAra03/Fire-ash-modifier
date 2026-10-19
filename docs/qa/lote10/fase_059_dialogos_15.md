# FASE 059 — Mostrar y comprobar diálogos (tramo 5800–5899)

## Reproducción

```bash
node tools/plan2700/lote10_fase059_dialogos_15.mjs
node tools/plan2700/lote10_fase059_dialogos_15.mjs --verify
```

## Resumen medido

- **Tareas procesadas**: 100 (40 con lectura humana de sentido explícita · 0 sin mapas localizables).
- **Mapas únicos cubiertos**: 263 (mapas 3232–3494) · familias declaradas: «Campañas ROM».
- **Suma por tarea** (los tramos se solapan): 3932 eventos con diálogo · 4624 bloques 101/401 · 0 mensajes de script.
- **Recuento sin duplicar por mapa** (263 mapas): 2618 eventos con diálogo · 3035 bloques 101/401 · 0 mensajes de script.
- **Formato de caja (sin duplicar)**: 2501 líneas superan las 53 columnas · 0 bloques pasan de 2 líneas.
- **Signos (sin duplicar)**: 10 interrogaciones sin «¿» · 18 exclamaciones sin «¡» · 0 comillas impares.
- **Idioma y glosario (sin duplicar)**: 186 bloques con marcas de inglés · 1977 aciertos de glosario.
- **Variables y cantidades (sin duplicar)**: \PN en 0 bloques · \v[n] en 0 ocasiones · 1647 bloques con cifras · **referencias inválidas: 0**.
- **Tareas con alguna incidencia de formato/signos**: 100/100. Estado: `static_measured_manual_reading_pending`.

## Cobertura por aspecto

| Aspecto | Tareas | Lectura humana | Mapas | Bloques 101/401 | Script msgs | >53 cols | >2 líneas | ¿/¡ ausentes | Comillas impares | Glosario | `\PN` / `\v[n]` | Inválidas |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| formato de caja y longitud de línea | 20 | 5 | 77 | 945 | 0 | 789 | 0 | 10 | 0 | 623 | 0/0 | 0 |
| signos de apertura, comillas y puntuación | 20 | 5 | 73 | 920 | 0 | 774 | 0 | 11 | 0 | 620 | 0/0 | 0 |
| idioma, glosario y nombres propios | 20 | 5 | 65 | 888 | 0 | 755 | 0 | 6 | 0 | 605 | 0/0 | 0 |
| variables, cantidades y nombres insertados | 20 | 5 | 77 | 974 | 0 | 816 | 0 | 7 | 0 | 648 | 0/0 | 0 |
| sentido, tono y lectura humana | 20 | 20 | 69 | 897 | 0 | 757 | 0 | 5 | 0 | 598 | 0/0 | 0 |

## Cobertura por familia declarada

| Familia | Tareas | Lectura humana | Mapas | Rango de mapas | Bloques | Script msgs | Inválidas |
|---|---:|---:|---:|---|---:|---:|---:|
| Campañas ROM | 100 | 40 | 263 | 3232–3494 | 4624 | 0 | 0 |

## Tareas con más incidencias

| Tarea | Aspecto | Mapa(s) | Bloques | >53 cols | >2 líneas | ¿/¡ | Comillas |
|---:|---|---|---:|---:|---:|---:|---:|
| 5815 | formato de caja y longitud de línea | 3264–3267 «Campañas ROM» | 90 | 82 | 0 | 0 | 0 |
| 5868 | variables, cantidades y nombres insertados | 3388–3391 «Campañas ROM» | 90 | 82 | 0 | 0 | 0 |
| 5802 | idioma, glosario y nombres propios | 3236–3238 «Campañas ROM» | 80 | 74 | 0 | 0 | 0 |
| 5855 | formato de caja y longitud de línea | 3355–3358 «Campañas ROM» | 79 | 71 | 0 | 2 | 0 |
| 5853 | variables, cantidades y nombres insertados | 3353–3355 «Campañas ROM» | 71 | 65 | 0 | 0 | 0 |
| 5813 | variables, cantidades y nombres insertados | 3262–3264 «Campañas ROM» | 72 | 64 | 0 | 0 | 0 |
| 5866 | signos de apertura, comillas y puntuación | 3386–3388 «Campañas ROM» | 66 | 60 | 0 | 0 | 0 |
| 5843 | variables, cantidades y nombres insertados | 3330–3332 «Campañas ROM» | 64 | 58 | 0 | 0 | 0 |
| 5837 | idioma, glosario y nombres propios | 3320–3322 «Campañas ROM» | 61 | 55 | 0 | 0 | 0 |
| 5825 | formato de caja y longitud de línea | 3289–3292 «Campañas ROM» | 59 | 51 | 0 | 0 | 0 |

## Muestras extraídas

- **Tarea 5800** (formato de caja y longitud de línea · Mapa 3232 «Liquid Crystal · Ruta 34 & Guardería (Sector 2)» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 5805** (formato de caja y longitud de línea · Mapa 3240 «Liquid Crystal · Ciudad Trigal (Goldenrod City)» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 5801** (signos de apertura, comillas y puntuación · Mapa 3235 «Liquid Crystal · Ruta 34 & Guardería (Sector 5)» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 5806** (signos de apertura, comillas y puntuación · Mapa 3243 «Liquid Crystal · Subterráneo de Trigal (Galería 1)» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 5802** (idioma, glosario y nombres propios · Mapa 3236 «Liquid Crystal · Ruta 34 & Guardería (Sector 6)» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 5807** (idioma, glosario y nombres propios · Mapa 3245 «Liquid Crystal · Subterráneo de Trigal (Galería 3)» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 5803** (variables, cantidades y nombres insertados · Mapa 3238 «Liquid Crystal · Ruta 34 & Guardería (Sector 8)» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 5808** (variables, cantidades y nombres insertados · Mapa 3247 «Liquid Crystal · Subterráneo de Trigal (Galería 5)» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 5804** (sentido, tono y lectura humana · Mapa 3239 «Liquid Crystal · Ruta 34 & Guardería (Sector 9)» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 5809** (sentido, tono y lectura humana · Mapa 3252 «Liquid Crystal · Subterráneo de Trigal (Galería 10)» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`

## Límite honesto

Los mapas auditados pertenecen a «Campañas ROM». Los de «Fire Ash original» están congelados por política del proyecto y las demás familias se auditan sin reescribir sus textos en esta tanda: la fase **muestra y mide** los diálogos, no modifica los `.rxdata`. Las métricas de formato, signos, glosario y variables quedan archivadas por tarea en el JSON de la fase; el juicio de sentido y tono permanece marcado como `manual_pending` y la ejecución interactiva en `Game.exe` como `runtime_pending`.
