# Acta de entrega del plan 2700

Version/commit de construcción: `0e65dfa0` (FASE 026).

## Paquetes

- `Fire-Ash-Scripts-Corregidos.zip`
- `Scripts_corregido/Fire_Ash_Paquete_Directo.zip`
- `Scripts_corregido/Dimensional_Nightmare_QA.zip`
- `Scripts_corregido/Mapas_PNG_y_Informe_Referencial.zip`
- `Scripts_corregido/Fire_Ash_Expansion_Multiversal.zip` (artefacto generado,
  respetando `.gitignore`)

Los hashes y tamaños se regeneran con
`node tools/plan2700/lote5_fase026_entrega.mjs` y quedan en
`content/lote5_fase026_entrega.json`.

## Instalación en cinco minutos

1. Hacer una copia completa del juego original.
2. Extraer el paquete directo sobre esa copia, conservando mayúsculas.
3. Si se usa un bloque de QA, extraerlo en una copia separada.
4. Arrancar `Game.exe` y verificar la primera pantalla.
5. Guardar el commit y el hash del ZIP usado para cualquier reporte.

## Desinstalación

Restaurar la copia original o los archivos correspondientes desde
`pokemon_fire_ash/PokeModBackups/`; no borrar a mano una partida del usuario.

## Estado de aceptación

Las pruebas automáticas archivadas están en `docs/qa/verificadores_final.md`.
La aceptación humana de playtest, Android, revisión externa, instalación limpia
y descarga todavía debe firmarse en una actualización de esta acta.
