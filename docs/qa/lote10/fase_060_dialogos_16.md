# FASE 060 — Mostrar y comprobar diálogos (tramo 5900–5999)

## Reproducción

```bash
node tools/plan2700/lote10_fase060_dialogos_16.mjs
node tools/plan2700/lote10_fase060_dialogos_16.mjs --verify
```

## Resumen medido

- **Tareas procesadas**: 100 (40 con lectura humana de sentido explícita · 0 sin mapas localizables).
- **Mapas únicos cubiertos**: 235 (mapas 3494–3796) · familias declaradas: «Campañas ROM».
- **Suma por tarea** (los tramos se solapan): 3615 eventos con diálogo · 4587 bloques 101/401 · 0 mensajes de script.
- **Recuento sin duplicar por mapa** (235 mapas): 2403 eventos con diálogo · 3065 bloques 101/401 · 0 mensajes de script.
- **Formato de caja (sin duplicar)**: 2512 líneas superan las 53 columnas · 0 bloques pasan de 2 líneas.
- **Signos (sin duplicar)**: 11 interrogaciones sin «¿» · 40 exclamaciones sin «¡» · 0 comillas impares.
- **Idioma y glosario (sin duplicar)**: 278 bloques con marcas de inglés · 1802 aciertos de glosario.
- **Variables y cantidades (sin duplicar)**: \PN en 0 bloques · \v[n] en 0 ocasiones · 1431 bloques con cifras · **referencias inválidas: 0**.
- **Tareas con alguna incidencia de formato/signos**: 100/100. Estado: `static_measured_manual_reading_pending`.

## Cobertura por aspecto

| Aspecto | Tareas | Lectura humana | Mapas | Bloques 101/401 | Script msgs | >53 cols | >2 líneas | ¿/¡ ausentes | Comillas impares | Glosario | `\PN` / `\v[n]` | Inválidas |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| formato de caja y longitud de línea | 20 | 5 | 62 | 889 | 0 | 739 | 0 | 13 | 0 | 535 | 0/0 | 0 |
| signos de apertura, comillas y puntuación | 20 | 5 | 68 | 989 | 0 | 823 | 0 | 19 | 0 | 580 | 0/0 | 0 |
| idioma, glosario y nombres propios | 20 | 5 | 67 | 953 | 0 | 790 | 0 | 13 | 0 | 572 | 0/0 | 0 |
| variables, cantidades y nombres insertados | 20 | 5 | 67 | 841 | 0 | 682 | 0 | 14 | 0 | 502 | 0/0 | 0 |
| sentido, tono y lectura humana | 20 | 20 | 69 | 915 | 0 | 761 | 0 | 17 | 0 | 574 | 0/0 | 0 |

## Cobertura por familia declarada

| Familia | Tareas | Lectura humana | Mapas | Rango de mapas | Bloques | Script msgs | Inválidas |
|---|---:|---:|---:|---|---:|---:|---:|
| Campañas ROM | 100 | 40 | 235 | 3494–3796 | 4587 | 0 | 0 |

## Tareas con más incidencias

| Tarea | Aspecto | Mapa(s) | Bloques | >53 cols | >2 líneas | ¿/¡ | Comillas |
|---:|---|---|---:|---:|---:|---:|---:|
| 5906 | signos de apertura, comillas y puntuación | 3512–3516 «Campañas ROM» | 81 | 71 | 0 | 2 | 0 |
| 5904 | sentido, tono y lectura humana | 3511–3512 «Campañas ROM» | 64 | 60 | 0 | 3 | 0 |
| 5987 | idioma, glosario y nombres propios | 3763–3765 «Campañas ROM» | 73 | 61 | 0 | 0 | 0 |
| 5956 | signos de apertura, comillas y puntuación | 3629–3631 «Campañas ROM» | 60 | 54 | 0 | 4 | 0 |
| 5919 | sentido, tono y lectura humana | 3548–3550 «Campañas ROM» | 60 | 55 | 0 | 1 | 0 |
| 5922 | idioma, glosario y nombres propios | 3553–3555 «Campañas ROM» | 62 | 56 | 0 | 0 | 0 |
| 5926 | signos de apertura, comillas y puntuación | 3562–3565 «Campañas ROM» | 63 | 55 | 0 | 1 | 0 |
| 5917 | idioma, glosario y nombres propios | 3544–3547 «Campañas ROM» | 60 | 52 | 0 | 0 | 0 |
| 5905 | formato de caja y longitud de línea | 3512 Liquid Crystal · Meseta Añil & Liga Pokémon (Sala 13) | 53 | 51 | 0 | 0 | 0 |
| 5972 | idioma, glosario y nombres propios | 3732–3734 «Campañas ROM» | 61 | 49 | 0 | 2 | 0 |

## Muestras extraídas

- **Tarea 5900** (formato de caja y longitud de línea · Mapa 3494 «Liquid Crystal · Calle Victoria de Johto (Nivel 15)» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 5905** (formato de caja y longitud de línea · Mapa 3512 «Liquid Crystal · Meseta Añil & Liga Pokémon (Sala 13)» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 5901** (signos de apertura, comillas y puntuación · Mapa 3497 «Liquid Crystal · Calle Victoria de Johto (Nivel 18)» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 5906** (signos de apertura, comillas y puntuación · Mapa 3512 «Liquid Crystal · Meseta Añil & Liga Pokémon (Sala 13)» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 5902** (idioma, glosario y nombres propios · Mapa 3500 «Liquid Crystal · Meseta Añil & Liga Pokémon (Sala 1)» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 5907** (idioma, glosario y nombres propios · Mapa 3517 «Liquid Crystal · Meseta Añil & Liga Pokémon (Sala 18)» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 5903** (variables, cantidades y nombres insertados · Mapa 3506 «Liquid Crystal · Meseta Añil & Liga Pokémon (Sala 7)» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 5908** (variables, cantidades y nombres insertados · Mapa 3521 «Liquid Crystal · Kanto · Puerto Carmín & Muelle S.S. Aqua (2)» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 5904** (sentido, tono y lectura humana · Mapa 3511 «Liquid Crystal · Meseta Añil & Liga Pokémon (Sala 12)» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 5909** (sentido, tono y lectura humana · Mapa 3524 «Liquid Crystal · Kanto · Puerto Carmín & Muelle S.S. Aqua (5)» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`

## Límite honesto

Los mapas auditados pertenecen a «Campañas ROM». Los de «Fire Ash original» están congelados por política del proyecto y las demás familias se auditan sin reescribir sus textos en esta tanda: la fase **muestra y mide** los diálogos, no modifica los `.rxdata`. Las métricas de formato, signos, glosario y variables quedan archivadas por tarea en el JSON de la fase; el juicio de sentido y tono permanece marcado como `manual_pending` y la ejecución interactiva en `Game.exe` como `runtime_pending`.
