# Paletas de las dimensiones invitadas: declarado contra medido

> Generado por `node tools/audit_campaign_palettes.mjs` (comprobar sin reescribir:
> `npm run verify:campanas:paletas`). **No se edita a mano.**

Cada dimensión invitada (las cinco campañas ROM) declara una paleta narrativa en
`content/rom_campaigns_complete.json`. Aquí se compara esa declaración con la
**paleta GBC real** del arte nativo ya extraído de esa dimensión: los tilesets
`ROMN_<índice>_p<n>.png` y las hojas de personaje `$ROMN_<índice>_g<id>.png`.

La paleta GBC de una dimensión se reduce a **cuatro tonos** por cuantiles de
luminancia (oscuro → claro), el mismo formato que la paleta verde de la dimensión
creepypasta declarada en `content/dimensional_nightmare_visual_contract.json`
(#0f380f · #306230 · #8bac0f · #9bbc0f). Ninguna dimensión invitada puede haber quedado
teñida con ese verde: se comprueba y falla si pasa.

**Cómo se cruza la declaración.** Los términos de la frase se buscan en una tabla
de expectativas (`PALABRAS`) que dice qué familia de tono nombra cada palabra
(escarcha → cian/azul; lagos, lluvia, cristales → azul/cian/verde; costas luminosas
→ luz; ruinas → neutro; caminos, frontera, refugios, ciudades → naranja/amarillo/
verde) y qué temperatura o brillo implica. Un término con la familia presente y su
umbral cumplido es **coincide**; si el color está pero el brillo o la temperatura
no cuadran, **parcial**; si nombra una familia que no aparece en el arte,
**no coincide** y la verificación falla.

## Resumen

| Dimensión | Archivos | Colores | Paleta GBC (4 tonos) | Lum. · Sat. | Frío / cálido / neutro | Términos ✓ · ~ · ✗ |
|---|---|---|---|---|---|---|
| `glazed` · Glazed | 151 | 1133 | #352a2a #716859 #9a9e85 #d5d6be | 0.503 · 0.361 | 23.8 % / 34.4 % / 41.9 % | 3 · 0 · 0 |
| `light_platinum` · Light Platinum | 47 | 452 | #322d35 #6d5f73 #8b9577 #cccab3 | 0.478 · 0.395 | 35.7 % / 32.4 % / 31.9 % | 3 · 0 · 0 |
| `liquid_crystal` · Liquid Crystal | 175 | 1169 | #3b3338 #7c6c66 #9da97c #d5d7c5 | 0.526 · 0.342 | 24.3 % / 33.4 % / 42.3 % | 4 · 0 · 0 |
| `tfoh` · TFOH | 254 | 1988 | #332d31 #736a5e #9ca37c #d0dcb4 | 0.512 · 0.378 | 22.5 % / 33.8 % / 43.7 % | 3 · 0 · 0 |
| `unbound` · Pokémon Unbound | 268 | 2541 | #292530 #626163 #889781 #c6d4b5 | 0.476 · 0.401 | 24.6 % / 34.5 % / 41.0 % | 2 · 0 · 0 |

Totales: 5 dimensiones · 895 archivos · 7283 colores distintos ·
15 términos confirmados, 0 parciales, 0 sin respaldo · 3 avisos.

## Síntesis de las cinco dimensiones

- Las 5 dimensiones invitadas comparten una base cromática: azul, verde aparecen en el top-4 de tono de todas y los neutros oscilan entre el 31.9 % y el 43.7 %.
- El reparto frío va del 22.5 % (tfoh) al 35.7 % (light_platinum); la luminancia media, del 0.476 (unbound) al 0.526 (liquid_crystal).
- Con esa horquilla, la paleta declarada describe la **intención narrativa** de cada dimensión más que una firma cromática exclusiva: las cinco se apoyan en los mismos materiales de GBA/GBC (hierba, agua, tierra y piedra) y se distinguen por matices.
- Las familias que sí separan a unas dimensiones de otras son amarillo, rojo.

| Familia de tono | Máximo | Mínimo | En el top-4 de |
|---|---|---|---|
| azul | 33.3 % (light_platinum) | 18.1 % (glazed) | 5/5 dimensiones |
| naranja | 20.0 % (unbound) | 11.7 % (tfoh) | 3/5 dimensiones |
| verde | 19.1 % (unbound) | 11.3 % (glazed) | 5/5 dimensiones |
| amarillo | 15.6 % (tfoh) | 5.3 % (light_platinum) | 2/5 dimensiones |
| rojo | 8.2 % (unbound) | 6.1 % (liquid_crystal) | 0/5 dimensiones |
| cian | 5.3 % (glazed) | 1.1 % (liquid_crystal) | 0/5 dimensiones |
| rosa | 2.3 % (light_platinum) | 0.9 % (liquid_crystal) | 0/5 dimensiones |
| violeta | 1.3 % (tfoh) | 0.1 % (light_platinum) | 0/5 dimensiones |

Distancias entre las paletas GBC medidas (media por canal entre los cuatro tonos):
la más parecida es **glazed ↔ tfoh** (4.833)
y la más distinta **liquid_crystal ↔ unbound** (13.167).

| Par | Distancia media |
|---|---|
| glazed ↔ tfoh | 4.833 |
| liquid_crystal ↔ tfoh | 6.167 |
| light_platinum ↔ unbound | 7 |
| glazed ↔ liquid_crystal | 7.333 |
| light_platinum ↔ tfoh | 8.5 |
| tfoh ↔ unbound | 8.833 |
| glazed ↔ unbound | 9.167 |
| glazed ↔ light_platinum | 10.5 |
| light_platinum ↔ liquid_crystal | 11.833 |
| liquid_crystal ↔ unbound | 13.167 |

## Avisos

- unbound: «decisiones difíciles» no tiene expectativa de color medible
- glazed: declara frío pero es la 4.ª de 5 en azules/cianes (23.8 %); la más fría es light_platinum
- light_platinum: declara luminosidad pero su luminancia media (0.478) es la 4.ª de 5

## Detalle por dimensión

### Glazed (`glazed`)

- **Declarado** (`content/rom_campaigns_complete.json` → `campaigns[glazed].palette`): «postgame A: escarcha, lagos y ciudades que recuerdan dos líneas temporales»
- **Medido** en el arte nativo de la dimensión (índice 0, 34 tilesets y 117 hojas de personaje; 1133 colores, 10889024 píxeles opacos)
- **Paleta GBC de cuatro tonos** (cuantiles de luminancia): #352a2a · #716859 · #9a9e85 · #d5d6be
- **Reparto de tono**: neutro 29.1 % · naranja 18.4 % · azul 18.1 % · verde 11.3 %
- **Luminancia media** 0.503 · **saturación media** 0.361 · **frío / cálido / neutro** 23.8 % / 34.4 % / 41.9 %

| Término declarado | Medido | Veredicto |
|---|---|---|
| «escarcha» | cian+azul 23.3 % (≥ 4.0 %); temperatura 23.8 % (≥ 18.0 %) | **coincide** |
| «lagos» | azul+cian+verde 34.7 % (≥ 4.0 %) | **coincide** |
| «ciudades que recuerdan dos líneas temporales» | naranja+amarillo+verde 39.1 % (≥ 4.0 %) | **coincide** |

Avisos:
- declara frío pero es la 4.ª de 5 en azules/cianes (23.8 %); la más fría es light_platinum

### Light Platinum (`light_platinum`)

- **Declarado** (`content/rom_campaigns_complete.json` → `campaigns[light_platinum].palette`): «postgame A: costas luminosas, rutas largas y plazas de una liga viajera»
- **Medido** en el arte nativo de la dimensión (índice 1, 7 tilesets y 40 hojas de personaje; 452 colores, 3309592 píxeles opacos)
- **Paleta GBC de cuatro tonos** (cuantiles de luminancia): #322d35 · #6d5f73 · #8b9577 · #cccab3
- **Reparto de tono**: azul 33.3 % · naranja 19.8 % · neutro 16.0 % · verde 13.6 %
- **Luminancia media** 0.478 · **saturación media** 0.395 · **frío / cálido / neutro** 35.7 % / 32.4 % / 31.9 %

| Término declarado | Medido | Veredicto |
|---|---|---|
| «costas luminosas» | azul+cian+verde 49.1 % (≥ 4.0 %); luminancia 0.478 (≥ 0.45) | **coincide** |
| «rutas largas» | naranja+amarillo+verde 38.7 % (≥ 4.0 %) | **coincide** |
| «plazas de una liga viajera» | naranja+amarillo+verde 38.7 % (≥ 4.0 %) | **coincide** |

Avisos:
- declara luminosidad pero su luminancia media (0.478) es la 4.ª de 5

### Liquid Crystal (`liquid_crystal`)

- **Declarado** (`content/rom_campaigns_complete.json` → `campaigns[liquid_crystal].palette`): «postgame A: lluvia de Johto, ruinas, faros y cristal vivo»
- **Medido** en el arte nativo de la dimensión (índice 2, 51 tilesets y 124 hojas de personaje; 1169 colores, 19461572 píxeles opacos)
- **Paleta GBC de cuatro tonos** (cuantiles de luminancia): #3b3338 · #7c6c66 · #9da97c · #d5d7c5
- **Reparto de tono**: azul 22.6 % · neutro 22.5 % · verde 18.9 % · amarillo 15.5 %
- **Luminancia media** 0.526 · **saturación media** 0.342 · **frío / cálido / neutro** 24.3 % / 33.4 % / 42.3 %

| Término declarado | Medido | Veredicto |
|---|---|---|
| «lluvia de Johto» | azul+cian+verde 42.6 % (≥ 4.0 %) | **coincide** |
| «ruinas» | verde+naranja+amarillo 46.2 % (≥ 4.0 %); temperatura 42.3 % (≥ 25.0 %) | **coincide** |
| «faros» | azul+cian+verde 42.6 % (≥ 4.0 %) | **coincide** |
| «cristal vivo» | azul+cian+verde 42.6 % (≥ 4.0 %) | **coincide** |

### TFOH (`tfoh`)

- **Declarado** (`content/rom_campaigns_complete.json` → `campaigns[tfoh].palette`): «postgame A: frontera, archipiélagos y caminos de una aventura que siguió creciendo»
- **Medido** en el arte nativo de la dimensión (índice 3, 55 tilesets y 199 hojas de personaje; 1988 colores, 20807812 píxeles opacos)
- **Paleta GBC de cuatro tonos** (cuantiles de luminancia): #332d31 · #736a5e · #9ca37c · #d0dcb4
- **Reparto de tono**: neutro 24.1 % · azul 19.7 % · verde 17.5 % · amarillo 15.6 %
- **Luminancia media** 0.512 · **saturación media** 0.378 · **frío / cálido / neutro** 22.5 % / 33.8 % / 43.7 %

| Término declarado | Medido | Veredicto |
|---|---|---|
| «frontera» | naranja+amarillo+verde 44.9 % (≥ 4.0 %) | **coincide** |
| «archipiélagos» | azul+cian+verde 38.8 % (≥ 4.0 %) | **coincide** |
| «caminos de una aventura que siguió creciendo» | naranja+amarillo+verde 44.9 % (≥ 4.0 %) | **coincide** |

### Pokémon Unbound (`unbound`)

- **Declarado** (`content/rom_campaigns_complete.json` → `campaigns[unbound].palette`): «postgame A: caminos de frontera, decisiones difíciles y refugios construidos en equipo»
- **Medido** en el arte nativo de la dimensión (índice 4, 65 tilesets y 203 hojas de personaje; 2541 colores, 22304624 píxeles opacos)
- **Paleta GBC de cuatro tonos** (cuantiles de luminancia): #292530 · #626163 · #889781 · #c6d4b5
- **Reparto de tono**: neutro 20.0 % · naranja 20.0 % · verde 19.1 % · azul 18.8 %
- **Luminancia media** 0.476 · **saturación media** 0.401 · **frío / cálido / neutro** 24.6 % / 34.5 % / 41.0 %

| Término declarado | Medido | Veredicto |
|---|---|---|
| «caminos de frontera» | naranja+amarillo+verde 45.4 % (≥ 4.0 %) | **coincide** |
| «decisiones difíciles» | — | **sin expectativa** |
| «refugios construidos en equipo» | naranja+amarillo+verde 45.4 % (≥ 4.0 %) | **coincide** |

## Cómo se reproduce

```bash
npm run audit:campanas:paletas     # mide el arte y reescribe este informe
npm run verify:campanas:paletas    # recalcula y comprueba que no cambió
npm run selftest:campanas:paletas  # comprobaciones sintéticas de las métricas
```
