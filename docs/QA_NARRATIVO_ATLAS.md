# QA narrativo de Atlas Mil

## Estado del ciclo

- Clasificación y schema: **completados**.
- Linter anti-procedural y de compatibilidad de combate: **operativo**.
- Blueprints Tier 1: **30 aprobados / 0 rechazados**.
- Compilación RMXP: **30 episodios instalados**.
- Region Builder: **40/40 sectores válidos**, 126 especies compatibles y 10 anclas futuras señaladas.
- Modelo de autoría inspirado en Pokémon Studio 2.11.0: **40/40 registros íntegros**.
- Compuerta técnica de estilo Fire Ash: **40/40 mapas aprobados**.
- Revisión artística: **40/40 pendientes**, porque conservan geometría heredada y requieren una pasada visual humana.
- Prueba visual en `Game.exe`: pendiente por ausencia de Wine.

## Jerarquía

```text
40 mapas Tier 1
120 mapas Tier 2
840 mapas Tier 3/Ecos
```

## Episodios compilados

### Sellos 01–05

1. **Santuario de la Última Campana** — mapa 1021. Memoria, duelo y voces reconstruidas.
2. **La Copa del Huevo Vacío** — mapa 1046. Mérito, consentimiento y renuncia.
3. **El Campeón de Fecha Imposible** — mapa 1071. Un mito político anterior a la Liga.
4. **El Gremio de la Camilla Vacía** — mapa 1096. Encargos enviados desde un futuro evitable.
5. **Operación Rescate Demasiado Perfecto** — mapa 1121. Autonomía ecológica después de una evacuación.

### Sellos 06–10

6. **La Sombra que Eligió Quedarse** — mapa 1146. Rehabilitación oscura sin borrar afectos.
7. **El Jardín de los Dos Juramentos** — mapa 1171. Clanes con mitades incompatibles de una promesa.
8. **La Persona Fuera del Encuadre** — mapa 1196. Una guía nacida de fotografías y recuerdos prestados.
9. **El Festival que Olvidó su Motivo** — mapa 1221. Una celebración que debe despedirse o aceptar otro propósito.
10. **La Carta que Recuerda a su Jugador** — mapa 1246. Intimidad, consentimiento y un duelo ritual de cartas.

### Sellos 11–15

11. **El Compañero del Minuto Cero** — mapa 1271. Una pareja compi de una línea descartada elige su continuidad.
12. **El Punto que Nadie Quiso Marcar** — mapa 1296. Un deporte enfrenta cuidado y obsesión por puntuarlo.
13. **La Señal Hecha de Ausencias** — mapa 1321. Investigación comunitaria y rutas seguras.
14. **La Ciudad a la que Dieron Cuerda** — mapa 1346. Juguetes conscientes rechazan ser copias.
15. **El Mosaico de los Nombres Imposibles** — mapa 1371. Resolver información no equivale a autorizarla.

### Fase A — Sellos 16–20

16. **La Receta que Lloraba por Otros** — mapa 1396. Un café debe separar cuidado comunitario de duelo apropiado.
17. **El Caso de las Cuatro Mediasnoches** — mapa 1421. Testigos sinceros describen capas temporales incompatibles.
18. **El Museo de lo Todavía No Perdido** — mapa 1446. Objetos futuros dejan de tratarse como órdenes.
19. **El Arrecife que Llegó Después** — mapa 1471. Restauración paradójica con límites ecológicos reversibles.
20. **Los Dos Nombres del Cometa** — mapa 1496. Una identidad fusionada conserva dos nombres y opciones futuras.

### Fase B — Sellos 21–25

21. **La Central de las Cenizas Vivas** — mapa 1521. Una central limpia reconoce el costo desplazado y residuos conscientes.
22. **La Profecía Escrita Después** — mapa 1546. Una facción fabrica augurios para reclutar personas aisladas.
23. **La Ciudad que Pagaba con Recuerdos** — mapa 1571. La reconstrucción deja de consumir biografías vecinales.
24. **Las Cartas de una Familia Incompatible** — mapa 1596. Futuros posibles dejan de gobernar una familia presente.
25. **El Mercado de los Umbrales Pequeños** — mapa 1621. Portales clandestinos hacen visible el costo del otro lado.

### Fase C — Sellos 26–30

26. **La Estatua que Ensayaba Ciudades** — mapa 1646. Arqueología futura, planificación pública y disidencia visible.
27. **La Mina de las Decisiones Sólidas** — mapa 1671. Una economía deja de fabricar renuncias irreversibles.
28. **El Peaje de los Sueños Prestados** — mapa 1696. Rutas oníricas dejan de consumir descanso y recuerdos.
29. **El Campeón de las Dos Banderas** — mapa 1721. Diplomacia entre ligas sin apropiarse de una persona.
30. **La Academia del Error Permitido** — mapa 1746. Dificultad transparente, pistas opcionales y contrajuego justo.

## Contenido acumulado

- 90 NPCs con páginas anteriores y posteriores.
- 30 conductores de escena.
- 30 decisiones persistentes.
- 30 jefes de seis Pokémon.
- 30 equipos con función narrativa por integrante.
- 30 puntos de curación.
- 30 recompensas narrativas de una sola obtención.
- Revanchas sin premios duplicados.
- Mochila habilitada y `canLose=true`.
- Retorno a Puerto Horizonte preservado.

## Flags

```text
708–737 = Sellos narrativos 01–30
Variable 103 = Total de sellos narrativos
Variables 104–133 = Decisiones de los episodios 01–30
```

Auditoría actual:

```text
737 slots de switch
675 switches con nombre
662 switches con uso literal
133 variables
124 variables con nombre
94 variables con uso literal
0 conflictos PokeMod
```

El auditor obtiene ahora los sellos esperados directamente del catálogo acumulativo aprobado. Ya no requiere mantener manualmente una segunda lista de episodios.

## QA automático

```text
Blueprints evaluados: 30
Aprobados: 30
Rechazados: 0

Verificación RMXP:
30 episodios Tier 1
90 NPCs
30 jefes narrativos
decisiones persistentes
retorno libre
```

El compilador genérico ahora actualiza entrenadores ya existentes durante una revisión y verifica especie, nivel, movimientos y objeto de cada integrante. El linter también rechaza Assault Vest combinado con movimientos de estado. Este ciclo corrigió tres incompatibilidades detectadas durante el pulido.

El análisis global mantiene exactamente las 45 incidencias heredadas del juego base: 7 errores y 38 warnings. No apareció ninguna incidencia nueva.

```text
marshal.js: 51 OK, 0 fallos
integración: 114 OK, 0 fallos
UI con jsdom: 22 OK, 0 fallos
```

La idempotencia por hashes fue confirmada para las fases A, B y C después de normalizar `trainers.dat` al nuevo formato de actualización.

El límite global es ahora **150**. La fase C inaugura la progresión extendida con jefes de nivel 100–112; las seis curvas de experiencia fueron verificadas como enteras y estrictamente crecientes.

## Archivos de esta fase

```text
content/atlas_tier1_blueprints_batch05.json
content/atlas_tier1_blueprints_batch06.json
content/atlas_tier1_blueprints_batch07.json
tools/create_tier1_batch05.mjs
tools/create_tier1_batch06.mjs
tools/create_tier1_batch07.mjs
tools/apply_extended_level_cap.mjs
tools/tier1_blueprint_helpers.mjs
```

Backups:

```text
pokemon_fire_ash/PokeModBackups/tier1_batch05_originals/
pokemon_fire_ash/PokeModBackups/tier1_batch06_originals/
pokemon_fire_ash/PokeModBackups/tier1_batch07_originals/
pokemon_fire_ash/PokeModBackups/extended_level_cap_originals/
```

## Próximas fases

### Fase D — Sellos 31–35

Mapas **1771, 1796, 1821, 1846 y 1871**: horror sonoro opcional, leyendas que piden no ser reconstruidas, victorias fantasma, arqueología falsa y rescate en la nieve.

### Fase E — Sellos 36–40 y convergencia

Mapas **1896, 1921, 1946, 1971 y 1996**: datos corruptos, acertijos manipulados, recuerdos implantados, memoria segura y final coral de los cuarenta sellos.

La referencia conceptual criticable de la Ancla 26 está en `docs/referencia_visual_atlas_ancla26.png`; su alcance y limitaciones están documentados en `docs/REFERENCIA_VISUAL_ANCLA26.md`.

### Herramientas externas de autoría

```text
content/atlas_mil_region.pkregion
content/atlas_region_design.json
content/atlas_studio_reference.json
content/atlas_style_baseline.json
docs/referencia_region_atlas_mil.png
tools/region_builder_adapter.mjs
tools/pokemon_studio_adapter.mjs
tools/setup_pokemon_studio.mjs
tools/atlas_style_gate.mjs
tools/render_region_builder_reference.mjs
tools/external_authoring.test.mjs
```

El pipeline narrativo ahora consume obligatoriamente el plano importado de Region Builder, un registro estable por ancla inspirado en Pokémon Studio y las métricas del mapa fuente real. Ninguno de esos formatos escribe directamente sobre `Data/*.rxdata`.

La nueva suite de autoría externa pasa **25/25** pruebas. La compuerta confirma recursos, pasabilidad, dimensiones, eventos artesanales y retorno, pero también informa que las 40 anclas usan aún geometría fuente exacta. Esto impide presentarlas como arte visual definitivo.

Antes de certificar los episodios como finales sigue siendo necesaria una pasada artesanal de mapa y una prueba visual dentro de `Game.exe`.
