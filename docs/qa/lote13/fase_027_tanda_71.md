# FASE 027 — tanda 71 (líneas 7000–7099 de `tareas.txt`)

## Inventario reproducible

```bash
node tools/plan2700/fase_027_tanda_71.mjs
```

- Líneas procesadas: 7000–7099 (100 entradas).
- IDs literales en el archivo: 6996–7095.
- Tipos de trabajo:
- `Medir las esperas`: 29
- `Ejecutar los comandos de script`: 59
- `Ejecutar los comandos de script de el mapa 42 «Pallet House» «Fire Ash original» (parte) y capturar cualquier excepción con su mapa, evento y comando exactos.`: 1
- `Ejecutar los comandos de script de el mapa 162 «Game Corner» «Fire Ash original» (parte) y capturar cualquier excepción con su mapa, evento y comando exactos.`: 3
- `Ejecutar los comandos de script de el mapa 214 «STAGE» «Fire Ash original» (parte) y capturar cualquier excepción con su mapa, evento y comando exactos.`: 8

## Resultado y límite de ejecución

Se verificó que el tramo contiene exactamente 100 tareas consecutivas y se registró el tipo de comprobación solicitado en cada una. Las tareas de este tramo requieren ejecución interactiva o evaluación dinámica del juego (combates, esperas, ejecución de comandos de script y, en la última tanda, combinaciones de estado). El repositorio no proporciona un ejecutable de juego/runtime automatizable en este entorno; el inventario estático no demuestra esos comportamientos. Por tanto, la validación runtime queda **pendiente** y no se declara aprobado ningún comportamiento dinámico.
