# FASE 024 — rendimiento, peso y compatibilidad estática (IDs 2300–2399)

## Auditoría reproducible

```text
node tools/plan2700/lote5_fase024_performance.mjs
node tools/plan2700/lote5_fase024_performance.mjs --verify
python3 tools/kirin_check.py pokemon_fire_ash
```

La corrida registra **3465 mapas**, **36 149 eventos**, **55 501 páginas**,
**12 páginas paralelas**, **2260 automáticas** y **772 referencias de audio**.
El inventario mide 109 912 019 bytes de `Data`, 87 545 954 bytes de
`Graphics` y 471 932 397 bytes de `Audio`; no encontró audios de cero bytes.
Los mapas con más eventos y procesos paralelos quedan en el JSON para decidir
el presupuesto por perfil sin recortar contenido útil automáticamente.

La comprobación estática de paquetes encontró entradas legibles y no detectó
backups, partidas, `content/` ni `tools/` dentro de los ZIP de entrega. Los
archivos fuente comprimidos de terceros se distinguen de los entregables.

## Hallazgos que no se ocultan

Cuatro referencias históricas de audio no tienen archivo homónimo en el
checkout (`secrettitan`, `Thunder8`, `002-Battle02` y `Team Rocket OW`). Se
conservan en `audio.missing` con mapa y número de referencias para reparación
con una pista autorizada; no se inventa música ni se copia una pista por
parecido.

Kirin terminó con **0 errores y 3 avisos**: 40 MIDIs pueden no sonar en
Android, falta la carpeta PBS esperable de un juego extraído y existen 14 rutas
que solo difieren en mayúsculas. Son advertencias de compatibilidad, no una
falsa aprobación de Android.

## Pendiente de runtime

La medición de FPS, memoria, tiempo de arranque/carga, cuatro horas de partida,
volumen/bucle audible, Android/Kirin real, tarjetas llenas, guardados
corruptos y permisos SAF necesita el binario y un dispositivo/entorno humano.
La auditoría queda en `static_pass_manual_runtime_pending`; no se fabrican
benchmarks.

El protocolo de recuperación de partida está en
`docs/qa/lote5/recuperacion_partida.md`.
