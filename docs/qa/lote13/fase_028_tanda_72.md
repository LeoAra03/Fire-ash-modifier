# FASE 028 — tanda 72 (líneas 7100–7199 de `tareas.txt`)

## Inventario reproducible

```bash
node tools/plan2700/fase_028_tanda_72.mjs
```

- Líneas procesadas: 7100–7199 (100 entradas).
- IDs literales en el archivo: 7096–7195.
- Tipos de trabajo:
- `Ejecutar los comandos de script`: 85
- `Ejecutar los comandos de script de el mapa 881 «Driftveil Battle House» «Fire Ash original» (parte) y capturar cualquier excepción con su mapa, evento y comando exactos.`: 1
- `Ejecutar los comandos de script de el mapa 971 «Pokémon Mart» «Fire Ash original» (parte) y capturar cualquier excepción con su mapa, evento y comando exactos.`: 14

## Resultado y límite de ejecución

Se verificó que el tramo contiene exactamente 100 tareas consecutivas y se registró el tipo de comprobación solicitado en cada una. Las tareas de este tramo requieren ejecución interactiva o evaluación dinámica del juego (combates, esperas, ejecución de comandos de script y, en la última tanda, combinaciones de estado). El repositorio no proporciona un ejecutable de juego/runtime automatizable en este entorno; el inventario estático no demuestra esos comportamientos. Por tanto, la validación runtime queda **pendiente** y no se declara aprobado ningún comportamiento dinámico.
