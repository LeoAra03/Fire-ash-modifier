# Estado verificable de contenido y prompts

> Este informe separa contenido instalado, contenido artesanal, infraestructura y trabajo visual. Un mapa copiado con retorno seguro cuenta como infraestructura, no como mapa visual final.

## Resumen ejecutivo

- Mapas añadidos: **1024** (3 Isla Espejo + 21 Bosque/Horizontes + 1000 Atlas).
- Unidades diferenciadas instaladas: **1177**.
- Atlas Tier 1 artesanal: **40/40 (100%)**.
- Prompts Tier 1 ya escritos: **40/40**; faltan ejecutar **0**.
- Atlas Tier 2 artesanal: **120/120** rutas; faltan **0**.
- Infraestructura Atlas con baliza y retorno: **1000/1000** mapas.
- Convergencia final: requiere **39 sellos previos**; no bloquea la ruta de retorno.
- Anclas con composición visual propia: **40/40**; composición estática pendiente: **0/40**.
- Lotes completados: **41/41** (9 narrativos + 8 visuales + 24 Tier 2).
- Quedan **0 lotes pequeños**, agrupables en **0 prompts** de hasta 5 lotes.

## Contenido instalado

| Bloque | Cantidad | Estado |
|---|---:|---|
| Isla Espejo | 3 mapas, 16 jefes, 32 combates inicial/revancha | Instalado |
| Bosque Susurrante + Horizontes | 21 mapas, misión Hypno y 500 aventuras | Instalado |
| Atlas base | 1000 mapas, 500 eventos/peleas y 40 sectores | Instalado |
| Atlas Tier 1 artesanal | 40 episodios, 120 NPCs, 40 jefes y 40 decisiones | Instalado |
| Atlas Tier 2 artesanal | 120 rutas, 240 NPCs, 120 decisiones y 120 recompensas únicas | Instalado |
| Total de unidades diferenciadas | 1177 | No confundir con mapas |

## Qué falta

| Frente | Unidades | Unidades por lote | Lotes pequeños restantes |
|---|---:|---:|---:|
| Tier 1 narrativo | 0 | 5 | 0 |
| Pulido visual de anclas | 0 | 5 | 0 |
| Tier 2 artesanal | 0 | 5 | 0 |
| Reglas faltantes Tier 3 | 0 | 20 | 0 |
| **Pulido completo por capas** | **0** | — | **0** |
| **Prompts agrupando cinco lotes** | — | 5 lotes por prompt | **0** |

## Tier 1 narrativo completo

Los 40 prompts Tier 1 fueron ejecutados, aprobados y compilados. No queda autoría narrativa ni composición visual estática Tier 1 pendiente; siguen siendo obligatorias las pruebas manuales.

## Tres respuestas posibles a “cuántos prompts faltan”

1. **Para terminar solo las 40 historias Tier 1:** no queda ningún prompt narrativo pendiente.
2. **Para dejar las 40 anclas como candidatas estáticas, incluida composición visual:** **0 ejecuciones por lotes**.
3. **Para pulir las tres capas de los 1.000 mapas:** quedan **0 lotes pequeños**, equivalentes a 0 unidades de trabajo y agrupables en **0 prompts** de hasta cinco lotes.

Además siguen pendientes 40 pruebas manuales en `Game.exe`. No se cuentan como prompts.

## Criterio de honestidad

- Los 1.000 mapas Atlas existen y son transitables. 40 anclas tienen ya una composición de piso propia; los demás mapas conservan geometría heredada en distintos grados.
- Los 500 desafíos Atlas y las 500 aventuras de Horizontes están instalados, pero no equivalen a 1.000 episodios artesanales.
- Tier 1 sí dispone de blueprint, reparto, decisión, jefe narrativo, curación y retorno.
- Tier 2 tiene 120/120 rutas de autoría dedicada; faltan 0.
- Tier 3 cubre 840/840 Ecos con regla local (420 desafíos Atlas + 420 reglas reversibles de `content/atlas_tier3_rules.json`); faltan 0.
- La certificación final requiere `Game.exe`; ningún linter puede validar ritmo, clipping o sensación de juego.

## Diseño en curso (no instalado)

| Frente | Estado | Documento |
|---|---|---|
| **Dimensional Nightmare** (6 universos + Nexo, Map2040–2140, 101 mapas, 105 eventos) | **Mapas recreados e instalados (101/101, hub incluido) y eventos/NPCs/jefes instalados en los 100 mapas de ficha (E4)**; arte de jefes y textos de QA pendientes. Catálogo en `content/dimensional_nightmare.json` | `docs/DIMENSIONAL_NIGHTMARE/00_MASTER_GDD.md` · `docs/DIMENSIONAL_NIGHTMARE/12_PLAN_DE_RECREACION_DE_MAPAS.md` |
| **Recreación de mapas desde los 7 mosaicos de referencia** | **Plan aprobable**: pipeline E0–E6, lotes de 5 mapas, checklist de aceptación; fase 1 ya tiene herramienta probada (`tools/dn_ingest_reference.mjs`) | `docs/DIMENSIONAL_NIGHTMARE/12_PLAN_DE_RECREACION_DE_MAPAS.md` |

> El Nightmare es una capa de diseño: describe qué construir y con qué flags (switches 882–902,
> variables 265–276, verificados libres). No hay mapas, eventos ni batallas instalados todavía;
> no entra en los conteos de arriba hasta que existan `create`/`apply`/`verify` y sus pruebas.
