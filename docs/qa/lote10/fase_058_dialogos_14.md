# FASE 058 — Mostrar y comprobar diálogos (tramo 5700–5799)

## Reproducción

```bash
node tools/plan2700/lote10_fase058_dialogos_14.mjs
node tools/plan2700/lote10_fase058_dialogos_14.mjs --verify
```

## Resumen medido

- **Tareas procesadas**: 100 (40 con lectura humana de sentido explícita · 0 sin mapas localizables).
- **Mapas únicos cubiertos**: 268 (mapas 2135–3232) · familias declaradas: «Dimensional Nightmare», «Mapas nuevos del DLC», «Campañas ROM».
- **Suma por tarea** (los tramos se solapan): 3807 eventos con diálogo · 5125 bloques 101/401 · 26 mensajes de script.
- **Recuento sin duplicar por mapa** (268 mapas): 2322 eventos con diálogo · 3142 bloques 101/401 · 17 mensajes de script.
- **Formato de caja (sin duplicar)**: 2556 líneas superan las 53 columnas · 0 bloques pasan de 2 líneas.
- **Signos (sin duplicar)**: 6 interrogaciones sin «¿» · 11 exclamaciones sin «¡» · 0 comillas impares.
- **Idioma y glosario (sin duplicar)**: 492 bloques con marcas de inglés · 1756 aciertos de glosario.
- **Variables y cantidades (sin duplicar)**: \PN en 0 bloques · \v[n] en 5 ocasiones · 1281 bloques con cifras · **referencias inválidas: 0**.
- **Tareas con alguna incidencia de formato/signos**: 100/100. Estado: `static_measured_manual_reading_pending`.

## Cobertura por aspecto

| Aspecto | Tareas | Lectura humana | Mapas | Bloques 101/401 | Script msgs | >53 cols | >2 líneas | ¿/¡ ausentes | Comillas impares | Glosario | `\PN` / `\v[n]` | Inválidas |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| formato de caja y longitud de línea | 20 | 5 | 78 | 1075 | 8 | 904 | 0 | 6 | 0 | 642 | 0/0 | 0 |
| signos de apertura, comillas y puntuación | 20 | 5 | 67 | 996 | 4 | 827 | 0 | 10 | 0 | 603 | 0/4 | 0 |
| idioma, glosario y nombres propios | 20 | 5 | 68 | 1038 | 4 | 848 | 0 | 5 | 0 | 611 | 0/4 | 0 |
| variables, cantidades y nombres insertados | 20 | 5 | 85 | 1069 | 3 | 872 | 0 | 3 | 0 | 577 | 0/5 | 0 |
| sentido, tono y lectura humana | 20 | 20 | 68 | 947 | 7 | 799 | 0 | 1 | 0 | 573 | 0/1 | 0 |

## Cobertura por familia declarada

| Familia | Tareas | Lectura humana | Mapas | Rango de mapas | Bloques | Script msgs | Inválidas |
|---|---:|---:|---:|---|---:|---:|---:|
| Dimensional Nightmare | 23 | 8 | 58 | 2135–2192 | 1218 | 23 | 0 |
| Mapas nuevos del DLC | 13 | 7 | 52 | 2192–3003 | 738 | 3 | 0 |
| Campañas ROM | 64 | 25 | 160 | 3003–3232 | 3169 | 0 | 0 |

## Tareas con más incidencias

| Tarea | Aspecto | Mapa(s) | Bloques | >53 cols | >2 líneas | ¿/¡ | Comillas |
|---:|---|---|---:|---:|---:|---:|---:|
| 5758 | variables, cantidades y nombres insertados | 3058–3060 «Campañas ROM» | 140 | 134 | 0 | 0 | 0 |
| 5762 | idioma, glosario y nombres propios | 3060–3062 «Campañas ROM» | 127 | 121 | 0 | 0 | 0 |
| 5759 | sentido, tono y lectura humana | 3060 Glazed · Mt. Stratus (Cumbre Helada) | 111 | 109 | 0 | 0 | 0 |
| 5760 | formato de caja y longitud de línea | 3060 Glazed · Mt. Stratus (Cumbre Helada) | 111 | 109 | 0 | 0 | 0 |
| 5761 | signos de apertura, comillas y puntuación | 3060 Glazed · Mt. Stratus (Cumbre Helada) | 111 | 109 | 0 | 0 | 0 |
| 5700 | formato de caja y longitud de línea | 2135–2139 «Dimensional Nightmare» | 97 | 86 | 0 | 0 | 0 |
| 5755 | formato de caja y longitud de línea | 3054–3056 «Campañas ROM» | 86 | 79 | 0 | 0 | 0 |
| 5728 | variables, cantidades y nombres insertados | 2220–2230 «Mapas nuevos del DLC» | 102 | 68 | 0 | 0 | 0 |
| 5742 | idioma, glosario y nombres propios | 3021–3022 «Campañas ROM» | 68 | 64 | 0 | 0 | 0 |
| 5757 | idioma, glosario y nombres propios | 3056–3058 «Campañas ROM» | 71 | 64 | 0 | 0 | 0 |

## Muestras extraídas

- **Tarea 5700** (formato de caja y longitud de línea · Mapa 2135 «DN 2135 · Cámara de KINGGUS» · Ev 2 `NPC_KINGGUS`, pág. 1, 94 cols): `KINGGUS: «El código se dobla alrededor del nombre de Ash, pero no consigue escribirlo por él.»`
- **Tarea 5705** (formato de caja y longitud de línea · Mapa 2147 «DN 2147 · Strangled Red — Cocina Fría» · Ev 3 `NPC_Cocinera_Sin_Fuego`, pág. 1, 110 cols): `Cocinera Sin Fuego: Las cintas del jardín no sujetan a nadie. Marcan los sitios donde alguien solía detenerse.`
- **Tarea 5701** (signos de apertura, comillas y puntuación · Mapa 2139 «DN 2139 · Nexo — Pasillo de Código» · Ev 4 `DN_MAP_MEMORY`, pág. 1, 360 cols): `Rotom — Registro de campo: Nexo — Pasillo de Código (Costura entre realidades — Nexo — Pasillo de Código). La señal local es «el pasillo de`
- **Tarea 5706** (signos de apertura, comillas y puntuación · Mapa 2150 «DN 2150 · Strangled Red — Torre de las Cintas» · Ev 3 `NPC_La_Tejedora_de_Cintas`, pág. 1, 113 cols): `La Tejedora de Cintas: Las cintas del jardín no sujetan a nadie. Marcan los sitios donde alguien solía detenerse.`
- **Tarea 5702** (idioma, glosario y nombres propios · Mapa 2142 «DN 2142 · Liga Oscura — Coliseo del Vínculo» · Ev 1 `LIGA_ENTRADA_COLISEO`, pág. 1, 75 cols): `Coliseo del Vínculo. El suelo tiembla al ritmo de algo que corre sin parar.`
- **Tarea 5707** (idioma, glosario y nombres propios · Mapa 2153 «DN 2153 · Strangled Red — Plaza Sin Gente» · Ev 3 `NPC_El_Vecino_Que_No_Mira`, pág. 1, 113 cols): `El Vecino Que No Mira: Las cintas del jardín no sujetan a nadie. Marcan los sitios donde alguien solía detenerse.`
- **Tarea 5703** (variables, cantidades y nombres insertados · Mapa 2143 «DN 2143 · Strangled Red — Patio de la Casa Rota» · Ev 3 `NPC_El_Sepulturero_del_Patio`, pág. 1, 116 cols): `El Sepulturero del Patio: Las cintas del jardín no sujetan a nadie. Marcan los sitios donde alguien solía detenerse.`
- **Tarea 5708** (variables, cantidades y nombres insertados · Mapa 2155 «DN 2155 · Strangled Red — Capilla del Nudo» · Ev 3 `NPC_Los_Cuatro_Anudados_01`, pág. 1, 96 cols): `Los Cuatro Anudados 1: El árbol repite el mismo gesto cada noche. Yo dejé de llamarlo una orden.`
- **Tarea 5704** (sentido, tono y lectura humana · Mapa 2145 «DN 2145 · Strangled Red — Pasillo de Trofeos» · Ev 3 `NPC_El_Ni_o_del_Trofeo`, pág. 1, 93 cols): `El Niño del Trofeo: El árbol repite el mismo gesto cada noche. Yo dejé de llamarlo una orden.`
- **Tarea 5709** (sentido, tono y lectura humana · Mapa 2158 «DN 2158 · Strangled Red — Árbol del Ajuste» · Ev 2 `ANOM_A12`, pág. 1, 127 cols): `[A12] EL ÁRBOL QUE RESPIRA Map2158 — (12,20). Fase ≥7. La corteza sube y baja; la silueta de R1 aparece tras el tronco. ''' ---`

## Límite honesto

Los mapas auditados pertenecen a «Dimensional Nightmare», «Mapas nuevos del DLC» y «Campañas ROM». Los de «Fire Ash original» están congelados por política del proyecto y las demás familias se auditan sin reescribir sus textos en esta tanda: la fase **muestra y mide** los diálogos, no modifica los `.rxdata`. Las métricas de formato, signos, glosario y variables quedan archivadas por tarea en el JSON de la fase; el juicio de sentido y tono permanece marcado como `manual_pending` y la ejecución interactiva en `Game.exe` como `runtime_pending`.
