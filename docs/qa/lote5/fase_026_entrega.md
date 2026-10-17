# FASE 026 — entrega y cierre verificable (IDs 2500–2599)

## Construcción ejecutada

Se ejecutaron y verificaron:

```text
npm run build:package
npm run verify:package
npm run build:corregido:zip
npm run verify:corregido:zip
npm run build:dn:qa
npm run verify:dn:qa
npm run sync:ruta_de_dios:package
npm run verify:ruta_de_dios:package
npm run build:expansion:package
npm run verify:expansion:package
npm run create:map-reference
npm run verify:map-reference
node tools/inventario_congelado.mjs
node tools/inventario_congelado.mjs --verify
```

Resultados principales:

- paquete directo: 2616 archivos, verificado;
- ZIP raíz corregido: 2616 archivos, 46,6 MiB, verificado;
- QA Nightmare: 487 archivos, 12,7 MiB, verificado;
- expansión: 193 archivos del juego + LEEME, 194 entradas, verificada;
- referencias visuales: 1000 mapas Atlas + 45 complementarios, 17 entradas,
  verificados;
- inventario congelado: 3465 mapas, 409 secciones Ruby, 9197 pares ID,
  0 colisiones.

`tools/package_release.sh` ahora excluye también `Data/*.BAK` y su prueba sobre
una copia completa no incluyó backups, partidas ni `Game.rxdata`. Los audios
cuyo nombre contiene “save” son sonidos de interfaz, no partidas.

## Auditorías archivadas

- `docs/qa/cierre_npm_test.txt`: `npm test` completo, 0 fallos;
- `docs/qa/cierre_test_ui.txt`: UI, 29 OK y 0 fallos;
- `docs/qa/cierre_verify_all.txt`: salida completa de `npm run verify:all`;
- `content/lote5_fase026_entrega.json`: hashes, tamaños, entradas de ZIP y
  búsqueda de backups/partidas;
- `docs/qa/verificadores_final.md`: cuadro de comandos y resultado;
- `docs/qa/cero_errores.md`: distingue verde automático de pendientes reales.

## Límite honesto del cierre

`npm run verify:all` no termina en verde porque `dn:plan:check` detecta los
recortes fuente ausentes de Dimensional Nightmare (`reference/dimensional_nightmare/slices/...`),
una dependencia de referencia que no se debe reemplazar con PNG sintético.
Además, la matriz final conserva pendientes manuales de Game.exe/Kirin,
Android, revisión externa y descarga/instalación desde una máquina limpia.

El render de comparación Atlas macro02 no se pudo regenerar porque falta su
backup original `pokemon_fire_ash/PokeModBackups/atlas_visual_macro02_originals`;
las referencias existentes sí pasan `npm run verify:map-reference`. No se
presenta esa regeneración como realizada.
