# FASE 033 — coherencia de mundo, narrativa, imagen y sonido (IDs 3200–3299)

## Auditoría reproducible

```bash
node tools/plan2700/lote7_fase033_coherencia.mjs
node tools/plan2700/lote7_fase033_coherencia.mjs --verify
```

El auditor enumera contratos de regiones, campañas, dimensiones, Atlas y Team
Rocket; recorre `MapInfos` y los mapas para contar eventos, páginas,
transferencias, nombres recurrentes, señales narrativas, BGM y destinos fuera
de rango; además separa los nombres de archivos gráficos/audio de la revisión
cromática, sonora y narrativa.

## Decisiones de alcance

Un nombre repetido de NPC es solo un **candidato** a personaje recurrente. No
prueba continuidad, arco ni simpatía. Del mismo modo, una paleta o un BGM
nombrado en un JSON no prueba que el jugador distinga dos regiones, que el
silencio funcione, que el peligro se anticipe con sonido o que una transición
geográfica sea creíble.

La auditoría conserva como contratos estáticos:

- siete grietas/regiones declaradas, cinco campañas, ocho gimnasios de Atlas y
  cinco dimensiones navegables;
- la identidad declarada de campañas, rutas, misiones, Arceus y Team Rocket;
- los destinos de transferencia existentes y dentro de las dimensiones del
  mapa;
- los nombres BGM por familia, los mapas sin BGM explícita y las colisiones de
  nombres para que se escuchen y se resuelvan manualmente;
- el documento de ausencias notables (`docs/qa/ausencias_personajes.md`) y sus
  decisiones, sin dejar personajes fuera por azar.

## Pendiente humano

La motivación del villano, la continuidad de NPC, la voz de Ash/Oak/Maxine, el
respeto al canon, la lectura de la introducción, la diferencia visual de
regiones, la música, el uso del silencio, el color, iluminación, bordes,
transiciones de bioma, nieve/agua/hora del día, secretos y epílogo requieren
Game.exe y revisión de una persona. El reporte usa `manual_pending` y no
convierte señales estáticas en validación narrativa.

## Artefacto de ausencias

Cada ausencia notable debe registrar personaje, expectativa razonable, decisión
(incluir, excluir o reservar), motivo canónico y prueba de que la ausencia no
es accidental. Si la decisión cambia la historia, debe enlazar una regresión.

## Resultado

El estado del JSON es `static_pass_manual_pending` cuando no hay destino
estructural roto. Los candidatos de coherencia no son una aprobación artesanal
ni una afirmación de que las siete regiones se distingan en una partida.
