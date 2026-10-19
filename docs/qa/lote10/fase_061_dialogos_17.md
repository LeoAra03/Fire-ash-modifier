# FASE 061 — Mostrar y comprobar diálogos (tramo 6000–6099)

## Reproducción

```bash
node tools/plan2700/lote10_fase061_dialogos_17.mjs
node tools/plan2700/lote10_fase061_dialogos_17.mjs --verify
```

## Resumen medido

- **Tareas procesadas**: 100 (40 con lectura humana de sentido explícita · 0 sin mapas localizables).
- **Mapas únicos cubiertos**: 285 (mapas 3796–4135) · familias declaradas: «Campañas ROM».
- **Suma por tarea** (los tramos se solapan): 3696 eventos con diálogo · 4387 bloques 101/401 · 0 mensajes de script.
- **Recuento sin duplicar por mapa** (285 mapas): 2559 eventos con diálogo · 3046 bloques 101/401 · 0 mensajes de script.
- **Formato de caja (sin duplicar)**: 2384 líneas superan las 53 columnas · 0 bloques pasan de 2 líneas.
- **Signos (sin duplicar)**: 27 interrogaciones sin «¿» · 28 exclamaciones sin «¡» · 0 comillas impares.
- **Idioma y glosario (sin duplicar)**: 560 bloques con marcas de inglés · 1710 aciertos de glosario.
- **Variables y cantidades (sin duplicar)**: \PN en 0 bloques · \v[n] en 0 ocasiones · 1487 bloques con cifras · **referencias inválidas: 0**.
- **Tareas con alguna incidencia de formato/signos**: 100/100. Estado: `static_measured_manual_reading_pending`.

## Cobertura por aspecto

| Aspecto | Tareas | Lectura humana | Mapas | Bloques 101/401 | Script msgs | >53 cols | >2 líneas | ¿/¡ ausentes | Comillas impares | Glosario | `\PN` / `\v[n]` | Inválidas |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| formato de caja y longitud de línea | 20 | 5 | 76 | 856 | 0 | 670 | 0 | 17 | 0 | 478 | 0/0 | 0 |
| signos de apertura, comillas y puntuación | 20 | 5 | 76 | 855 | 0 | 676 | 0 | 18 | 0 | 505 | 0/0 | 0 |
| idioma, glosario y nombres propios | 20 | 5 | 77 | 901 | 0 | 723 | 0 | 13 | 0 | 542 | 0/0 | 0 |
| variables, cantidades y nombres insertados | 20 | 5 | 75 | 881 | 0 | 716 | 0 | 15 | 0 | 536 | 0/0 | 0 |
| sentido, tono y lectura humana | 20 | 20 | 77 | 894 | 0 | 716 | 0 | 19 | 0 | 510 | 0/0 | 0 |

## Cobertura por familia declarada

| Familia | Tareas | Lectura humana | Mapas | Rango de mapas | Bloques | Script msgs | Inválidas |
|---|---:|---:|---:|---|---:|---:|---:|
| Campañas ROM | 100 | 40 | 285 | 3796–4135 | 4387 | 0 | 0 |

## Tareas con más incidencias

| Tarea | Aspecto | Mapa(s) | Bloques | >53 cols | >2 líneas | ¿/¡ | Comillas |
|---:|---|---|---:|---:|---:|---:|---:|
| 6073 | variables, cantidades y nombres insertados | 4059–4060 «Campañas ROM» | 84 | 80 | 0 | 1 | 0 |
| 6071 | signos de apertura, comillas y puntuación | 4058–4059 «Campañas ROM» | 82 | 78 | 0 | 1 | 0 |
| 6012 | idioma, glosario y nombres propios | 3841–3844 «Campañas ROM» | 76 | 66 | 0 | 0 | 0 |
| 6072 | idioma, glosario y nombres propios | 4059 Pokémon Unbound · Capítulo 05 · bosque 060 | 67 | 65 | 0 | 1 | 0 |
| 6093 | variables, cantidades y nombres insertados | 4123–4125 «Campañas ROM» | 66 | 60 | 0 | 2 | 0 |
| 6075 | formato de caja y longitud de línea | 4062–4064 «Campañas ROM» | 57 | 51 | 0 | 2 | 0 |
| 6089 | sentido, tono y lectura humana | 4112–4115 «Campañas ROM» | 57 | 49 | 0 | 4 | 0 |
| 6061 | signos de apertura, comillas y puntuación | 4029–4031 «Campañas ROM» | 58 | 52 | 0 | 0 | 0 |
| 6014 | sentido, tono y lectura humana | 3845–3848 «Campañas ROM» | 58 | 50 | 0 | 0 | 0 |
| 6097 | idioma, glosario y nombres propios | 4129–4132 «Campañas ROM» | 57 | 49 | 0 | 0 | 0 |

## Muestras extraídas

- **Tarea 6000** (formato de caja y longitud de línea · Mapa 3796 «TFOH · Capítulo 09 · poblado 097» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 6005** (formato de caja y longitud de línea · Mapa 3812 «TFOH · Capítulo 10 · instalación 113» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 6001** (signos de apertura, comillas y puntuación · Mapa 3799 «TFOH · Capítulo 09 · cueva 100» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 6006** (signos de apertura, comillas y puntuación · Mapa 3816 «TFOH · Capítulo 10 · santuario 117» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 6002** (idioma, glosario y nombres propios · Mapa 3803 «TFOH · Capítulo 09 · meseta 104» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 6007** (idioma, glosario y nombres propios · Mapa 3820 «TFOH · Capítulo 11 · instalación 121» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 6003** (variables, cantidades y nombres insertados · Mapa 3805 «TFOH · Capítulo 09 · ruta 106» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 6008** (variables, cantidades y nombres insertados · Mapa 3827 «TFOH · Capítulo 11 · meseta 128» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 6004** (sentido, tono y lectura humana · Mapa 3808 «TFOH · Capítulo 10 · costa 109» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 6009** (sentido, tono y lectura humana · Mapa 3834 «TFOH · Capítulo 12 · instalación 135» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`

## Límite honesto

Los mapas auditados pertenecen a «Campañas ROM». Los de «Fire Ash original» están congelados por política del proyecto y las demás familias se auditan sin reescribir sus textos en esta tanda: la fase **muestra y mide** los diálogos, no modifica los `.rxdata`. Las métricas de formato, signos, glosario y variables quedan archivadas por tarea en el JSON de la fase; el juicio de sentido y tono permanece marcado como `manual_pending` y la ejecución interactiva en `Game.exe` como `runtime_pending`.
