# FASE 031 — fuzz adversario, límites, cortes e interferencias (IDs 3000–3099)

## Resultado reproducible

```bash
npm run audit:plan2700:fase031
npm run verify:plan2700:fase031
```

La corrida ejecuta 20.000 semillas de fuzz de eventos y 50.000 mutaciones de
celdas. Cada semilla se puede reproducir; el JSON conserva la política,
clasificación, fallos y digest del fixture. Se obtuvieron 0 fallos del contrato,
0 escrituras fuera del sandbox y 0 mutaciones no clasificadas.

La matriz de límites pasa 11/11 casos y la de cortes pasa 10/10 en el modelo
atómico. La matriz de interferencias contiene 11 invariantes explícitos, todos
marcados `runtime: manual_pending`.

## Alcance real

- `tools/plan2700/lote6_fase031_adversario.mjs` aísla estados y normaliza
  rangos antes de comparar invariantes;
- no toca `Save*.rxdata`, `Game.rxdata` ni el árbol del juego;
- los fallos, si aparecen, llevan `seed`, tipo y lista de invariantes;
- `sameSeed` debe ser verdadero antes de aceptar el registro;
- el contrato de entrega se cruza con el informe de FASE 027 para no permitir
  backups/partidas en paquetes.

## Pendiente humano

El fuzz no es un reemplazo de un runtime RPG Maker. Quedan pendientes el corte
real durante guardado/transferencia/cinemática/combate, Android/PC sin espacio,
la recuperación visual tras derrota, los nombres y cajas en pantalla y la
partida con menú/bicicleta/surf/teletransporte/atuendo/disfraz/Liga/barco. Se
comunican como `static_pass_runtime_pending`, no como «cero errores conocidos».
