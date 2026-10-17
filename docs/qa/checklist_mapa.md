# Checklist de mapa impecable — FASE 019

El evaluador `tools/plan2700/checklist_mapa.mjs` lee el mapa compilado y
entrega los diez puntos siguientes por mapa. No escribe `Data/`; el informe
queda en `content/plan2700_checklist.json`.

| # | Punto | Evidencia automática | Límite |
|---:|---|---|---|
| 1 | sin simetría axial deliberada | se marca `manual` | requiere lectura visual |
| 2 | recodo antes de 12 celdas rectas | se marca `manual` | depende de la ruta jugable |
| 3 | celdas transitables alcanzables | BFS del componente desde la primera celda abierta | la entrada real puede ser distinta |
| 4 | warp válido | `tools/plan2700/audit_warps.mjs` | no sustituye probar el destino |
| 5 | tileset/autotile | tileset válido; salida de `verify:atlas:tiles` donde aplica | costura necesita render |
| 6 | música existente | nombre de BGM y archivo cuando está explícito | herencia intencional queda en review |
| 7 | motivo decorativo | siempre `manual/review` | no se deduce por contar NPC |
| 8 | contenido mínimo | presencia de eventos; perfiles requieren lectura | umbral de diseño no se inventa |
| 9 | control al entrar | autorun/paralelo con salida estructural | duración y sensación son manuales |
| 10 | salida clara/redundante | transferencias presentes | mazmorra exige revisión de perfil |

## Corrida completa

```text
npm run audit:plan2700:mapas
npm run audit:plan2700:warps
```

Resultado de la corrida del lote 019: **3465 mapas**, 19064 transferencias,
**0 warps con destino o coordenada inválidos**. El informe completo conserva el
resultado por mapa y los estados `pass`, `review` y `manual`.

La división del informe es deliberadamente conservadora: no convierte un
heurístico de tiles en una aprobación visual. Un punto se cierra solo después
de repetir el evaluador y, cuando es `manual`, después de una partida/render
humano.
