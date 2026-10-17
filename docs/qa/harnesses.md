# Harnesses de instrumentación

## Alcance y límite

FASE 028 instala un protocolo común y un núcleo determinista para fixtures en
`tools/plan2700/harness_core.mjs`. El núcleo no finge ser Game.exe/RGSS: el
adaptador de runtime que se conecte después debe implementar las mismas
operaciones y devolver el mismo formato de traza. La salida estática marca
`indexed`, mientras que `exercised` sigue en `runtime_pending` hasta ejecutar el
juego real o un headless autorizado.

## Uso desde un clon

```bash
npm ci
npm run cobertura
npm run cobertura:plan
npm run cobertura:check
```

Los tres comandos escriben únicamente `content/cobertura.json`,
`content/lote6_fase028_instrumentacion.json` y `docs/plan_generado/`. El
verificador compara bytes, por lo que una segunda ejecución no cambia el
registro. La ficha completa de la tanda queda en
`docs/qa/lote6/fase_028_instrumentacion.md`.

## Contrato de replay

Un adaptador headless recibe:

```json
{
  "save": "copia-de-prueba.json",
  "map": 9901,
  "inputs": ["right", "action"],
  "seed": 0
}
```

Debe devolver estado final, traza determinista y cobertura. Debe cargar una
copia, nunca `Save*.rxdata` del jugador; el núcleo rechaza rutas fuera del
sandbox. Las entradas aceptadas son `up`, `down`, `left`, `right`, `action`,
`cancel`, `menu` y `run`. Un replay que falle debe incluir mapa, evento y
comando. Una excepción no puede dejar al orquestador bloqueado: el resultado
lleva `controlReturned: true` y el error se archiva.

## Adaptadores por familia

| Harness | Entrada | Evidencia mínima |
|---|---|---|
| Replay | partida de copia + secuencia de entradas | hash del estado, entradas y mapa |
| Bot caminante | mapa, entrada y función de colisión | celdas pisadas, inalcanzables, coordenadas de atasco |
| Ejecutor de eventos | páginas y condiciones ordenadas | evento, página, comando, excepción y salida |
| Oráculo de diálogos | texto renderizado y ancho de caja | vacío, tres líneas, overflow, inglés y signos |
| Inyector de estado | flags, variables, inventario y equipo | hash antes/después y combinación muestreada |
| Registro de cobertura | mapas/eventos/diálogos/combates | unión de conjuntos, versión y fecha externa |
| Comparador de fotogramas | buffers antes/después | píxel distinto y máscara de animación cíclica |
| Oráculo de estado | dos estados consecutivos | duplicados, contadores reiniciados y flags parciales |
| Rutas/escenas | grafo y muestras cronometradas | mapas inalcanzables y bloqueo > 8 s |
| Recursos | referencias de mapas/scripts | nombre exacto, mayúsculas, fallback documentado |
| Idempotencia | función/instalador y snapshot | hash antes, primera y segunda aplicación |

## Fallos y regresión

1. Reproducir con la misma semilla y guardar el JSON de entrada.
2. Clasificar: juego, mutador/adaptador o comportamiento aceptable.
3. Corregir solo la fuente; no editar el registro para borrar el fallo.
4. Ejecutar el caso negativo y uno sano.
5. Ejecutar el verificador de la familia y `npm run verify:all` si hubo una
   corrección tardía.

El fixture de esta fase siembra cinco defectos (warp, caja, flag, colisión y
recurso) y exige 5/5 detecciones sin falsos positivos. Eso valida el orquestador,
no sustituye la cobertura del juego completo.

## Paralelismo y reanudación

Cada worker debe recibir un rango de mapas y un directorio parcial distinto:
`content/cobertura/worker-<inicio>-<fin>.json`. Escribir primero a un archivo
`.tmp` dentro de la misma carpeta y renombrar al terminar; fundir con unión de
claves ordenadas. Un `manifest.json` debe guardar rango, versión, hash del
estado y semilla. Si un rango existe con el mismo hash, se reanuda sin repetir;
si cambia, se rechaza y se vuelve a ejecutar ese rango. Nunca se pisan dos
workers ni se mezclan partidas del usuario.

## Recursos y variantes

Los auditores distinguen nombres sensibles a mayúsculas, referencias de
personaje/battler/icono/BGM/SE y fallbacks documentados. Una referencia a un
fallback no es un «missing» silencioso: debe tener una entrada en el registro.
Las variantes de mapa (`Map341 2.rxdata`, `Map813b.rxdata`) se enumeran como
anomalías para decidir, no se renombrar automáticamente.

## CI y panel

`content/cobertura.json` es el artefacto legible por máquina y
`docs/plan_generado/cobertura.html` es un panel local sin dependencias externas.
El panel distingue índice automático de runtime humano y lista los defectos en
`docs/qa/defectos.md`; no muestra una cifra de cobertura 100 % si
`exercised` es cero.
