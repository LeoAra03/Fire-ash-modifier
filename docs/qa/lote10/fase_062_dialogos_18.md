# FASE 062 — Mostrar y comprobar diálogos (tramo 6100–6199)

## Reproducción

```bash
node tools/plan2700/lote10_fase062_dialogos_18.mjs
node tools/plan2700/lote10_fase062_dialogos_18.mjs --verify
```

## Resumen medido

- **Tareas procesadas**: 100 (40 con lectura humana de sentido explícita · 0 sin mapas localizables).
- **Mapas únicos cubiertos**: 231 (mapas 4135–4365) · familias declaradas: «Campañas ROM».
- **Suma por tarea** (los tramos se solapan): 3983 eventos con diálogo · 4802 bloques 101/401 · 0 mensajes de script.
- **Recuento sin duplicar por mapa** (231 mapas): 2490 eventos con diálogo · 3024 bloques 101/401 · 0 mensajes de script.
- **Formato de caja (sin duplicar)**: 2559 líneas superan las 53 columnas · 0 bloques pasan de 2 líneas.
- **Signos (sin duplicar)**: 39 interrogaciones sin «¿» · 41 exclamaciones sin «¡» · 0 comillas impares.
- **Idioma y glosario (sin duplicar)**: 929 bloques con marcas de inglés · 1949 aciertos de glosario.
- **Variables y cantidades (sin duplicar)**: \PN en 0 bloques · \v[n] en 0 ocasiones · 1499 bloques con cifras · **referencias inválidas: 0**.
- **Tareas con alguna incidencia de formato/signos**: 100/100. Estado: `static_measured_manual_reading_pending`.

## Cobertura por aspecto

| Aspecto | Tareas | Lectura humana | Mapas | Bloques 101/401 | Script msgs | >53 cols | >2 líneas | ¿/¡ ausentes | Comillas impares | Glosario | `\PN` / `\v[n]` | Inválidas |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| formato de caja y longitud de línea | 20 | 5 | 67 | 961 | 0 | 827 | 0 | 23 | 0 | 643 | 0/0 | 0 |
| signos de apertura, comillas y puntuación | 20 | 5 | 64 | 1004 | 0 | 876 | 0 | 15 | 0 | 709 | 0/0 | 0 |
| idioma, glosario y nombres propios | 20 | 5 | 67 | 1002 | 0 | 868 | 0 | 19 | 0 | 682 | 0/0 | 0 |
| variables, cantidades y nombres insertados | 20 | 5 | 63 | 926 | 0 | 799 | 0 | 23 | 0 | 627 | 0/0 | 0 |
| sentido, tono y lectura humana | 20 | 20 | 67 | 909 | 0 | 773 | 0 | 41 | 0 | 574 | 0/0 | 0 |

## Cobertura por familia declarada

| Familia | Tareas | Lectura humana | Mapas | Rango de mapas | Bloques | Script msgs | Inválidas |
|---|---:|---:|---:|---|---:|---:|---:|
| Campañas ROM | 100 | 40 | 231 | 4135–4365 | 4802 | 0 | 0 |

## Tareas con más incidencias

| Tarea | Aspecto | Mapa(s) | Bloques | >53 cols | >2 líneas | ¿/¡ | Comillas |
|---:|---|---|---:|---:|---:|---:|---:|
| 6142 | idioma, glosario y nombres propios | 4234–4236 «Campañas ROM» | 95 | 89 | 0 | 1 | 0 |
| 6105 | formato de caja y longitud de línea | 4148–4150 «Campañas ROM» | 87 | 81 | 0 | 3 | 0 |
| 6184 | sentido, tono y lectura humana | 4332–4334 «Campañas ROM» | 87 | 81 | 0 | 3 | 0 |
| 6107 | idioma, glosario y nombres propios | 4150–4151 «Campañas ROM» | 80 | 76 | 0 | 1 | 0 |
| 6140 | formato de caja y longitud de línea | 4233–4234 «Campañas ROM» | 78 | 74 | 0 | 3 | 0 |
| 6186 | signos de apertura, comillas y puntuación | 4334–4335 «Campañas ROM» | 80 | 76 | 0 | 1 | 0 |
| 6156 | signos de apertura, comillas y puntuación | 4274–4277 «Campañas ROM» | 79 | 71 | 0 | 0 | 0 |
| 6106 | signos de apertura, comillas y puntuación | 4150 Pokémon Unbound · Capítulo 13 · poblado 151 | 67 | 65 | 0 | 1 | 0 |
| 6141 | signos de apertura, comillas y puntuación | 4234 Pokémon Unbound · Capítulo 20 · costa 235 | 67 | 65 | 0 | 1 | 0 |
| 6158 | variables, cantidades y nombres insertados | 4277–4279 «Campañas ROM» | 71 | 65 | 0 | 1 | 0 |

## Muestras extraídas

- **Tarea 6100** (formato de caja y longitud de línea · Mapa 4135 «Pokémon Unbound · Capítulo 12 · meseta 136» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 6105** (formato de caja y longitud de línea · Mapa 4148 «Pokémon Unbound · Capítulo 13 · instalación 149» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 6101** (signos de apertura, comillas y puntuación · Mapa 4138 «Pokémon Unbound · Capítulo 12 · costa 139» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 6106** (signos de apertura, comillas y puntuación · Mapa 4150 «Pokémon Unbound · Capítulo 13 · poblado 151» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 6102** (idioma, glosario y nombres propios · Mapa 4141 «Pokémon Unbound · Capítulo 12 · meseta 142» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 6107** (idioma, glosario y nombres propios · Mapa 4150 «Pokémon Unbound · Capítulo 13 · poblado 151» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 6103** (variables, cantidades y nombres insertados · Mapa 4143 «Pokémon Unbound · Capítulo 12 · meseta 144» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 6108** (variables, cantidades y nombres insertados · Mapa 4151 «Pokémon Unbound · Capítulo 13 · ruta 152» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 6104** (sentido, tono y lectura humana · Mapa 4145 «Pokémon Unbound · Capítulo 13 · ruta 146» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`
- **Tarea 6109** (sentido, tono y lectura humana · Mapa 4153 «Pokémon Unbound · Capítulo 13 · cueva 154» · Ev 1 `PokeMod Campaña ROM: Retorno libre`, pág. 1, 64 cols): `Regresar a Puerto Horizonte. El retorno nunca está condicionado.`

## Límite honesto

Los mapas auditados pertenecen a «Campañas ROM». Los de «Fire Ash original» están congelados por política del proyecto y las demás familias se auditan sin reescribir sus textos en esta tanda: la fase **muestra y mide** los diálogos, no modifica los `.rxdata`. Las métricas de formato, signos, glosario y variables quedan archivadas por tarea en el JSON de la fase; el juicio de sentido y tono permanece marcado como `manual_pending` y la ejecución interactiva en `Game.exe` como `runtime_pending`.
