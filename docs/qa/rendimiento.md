# Rendimiento — cierre estático disponible

La medición reproducible está en `content/lote5_fase024_performance.json` y se
genera con:

```text
node tools/plan2700/lote5_fase024_performance.mjs --verify
python3 tools/kirin_check.py pokemon_fire_ash
```

Valores del checkout auditado: 3465 mapas, 36 149 eventos, 55 501 páginas,
12 páginas paralelas, 2260 automáticas, 109 912 019 bytes de Data,
87 545 954 bytes de Graphics y 471 932 397 bytes de Audio. No hay audio de
cero bytes. El paquete y ZIP raíz pasan sus verificadores.

Esto no es un benchmark de FPS. Quedan pendientes de entorno humano: Android,
memoria, arranque/cargas por región, cuatro horas de partida, mezcla/bucle de
audio, guardados dañados y permisos SAF. Los 4 nombres de audio sin archivo
homónimo están listados en el JSON y no se ocultan.
