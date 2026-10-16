# Reparación del `end` sobrante de «Grandeur Club» (FASE 32)

> Cierra el **hallazgo bloqueante** que la fase 39 dejó escrito en
> [`docs/DEFINICION_DE_TERMINADO_SCRIPTS.md`](DEFINICION_DE_TERMINADO_SCRIPTS.md):
> la sección «Grandeur Club» de la copia de desarrollo no compilaba. Aquí están el
> defecto medido, la causa, la corrección, el verificador nuevo que impide que
> vuelva a pasar y cómo deshacerla.
>
> Medido el 2026-10-16 sobre HEAD base `e9a87880`.

---

## 1. El defecto, medido antes de tocar nada

| Copia | Caracteres de la sección | `end` sobrante | Compilaba (antes) |
|---|---:|---|---|
| `pokemon_fire_ash/Data/Scripts.rxdata` (desarrollo) | 56 837 | **sí**, línea 710 | **no** |
| `Scripts_corregido/Scripts.rxdata` (distribución) | 56 832 | no | sí |
| `Scripts_corregido/Paquete_directo/Data/Scripts.rxdata` | 56 832 | no | sí |
| `Scripts_corregido/Dimensional_Nightmare_QA/Data/Scripts.rxdata` | 56 832 | no | sí |

La diferencia entre la copia del juego y la de distribución era **exactamente cinco
caracteres**: `end\r\n`. El texto sobrante terminaba en CRLF (terminador del script
original) y estaba justo después del `end` con LF que cierra el método inyectado:

```text
      pbMessage(_INTL("\\CN\\bYou have no room in your Bag."))\n
    end\n          ← cierra el if interior del método inyectado
  end\n            ← cierra «if items > 0»
end\n              ← cierra «def grandeurItemExchange» (texto inyectado, LF)
end\r\n            ← SOBRANTE: cierre del método original (CRLF), línea 710
\r\n
def givePassive\r\n
```

Ruby lo decía así (Ruby WASM del repo, `RubyVM::InstructionSequence.compile`):

```text
✘ pokemon_fire_ash/Data/Scripts.rxdata · 322/323 secciones compilan
   · «Grandeur Club» línea 710: <compiled>:710: syntax error, unexpected `end'
```

**Reproducir el "antes"** (sin modificar el árbol): en un worktree limpio de la
base, `node tools/qa/ruby_syntax_full_check.mjs pokemon_fire_ash/Data/Scripts.rxdata`
sale 1 con ese mismo mensaje. Medido así en `e9a87880`.

**A quién afectaba.** A la copia de desarrollo (`pokemon_fire_ash/`), que es la que
usa quien abre el juego desde el repositorio. RGSS compila las secciones de
`Scripts.rxdata` al arrancar, así que el error no esperaba a la torre: la sección no
se podía cargar. Las tres copias de distribución ya llevaban la corrección —el
`README.md` la anunciaba como «la corrección del `end` sobrante de **Grandeur
Club**»—, de modo que ningún jugador instalado la sufría. El defecto era del
banco de trabajo, no del paquete.

---

## 2. Causa: contar `end` con una expresión regular

`tools/apply_emergency_abra_and_free_tower.mjs` sustituía `grandeurItemExchange`
por la versión de 0 créditos con este patrón (línea 227 antes de esta fase):

```js
gc.code.replace(
  /def grandeurItemExchange\(item,itemprice\)[\s\S]*?pbMessage\(_INTL\("\\\\CN\\\\bYou have no room in your Bag\."\)\)\s+end\s+end\s+end\s+end/m,
  newExchange   // ← termina con sus propios tres `end`
);
```

Dos decisiones frágiles en la misma línea:

1. **El número de cierres está escrito a mano.** El patrón exige cuatro `end`
   consecutivos y el reemplazo aporta los suyos. Cuando la cuenta del original y la
   del reemplazo no coinciden, la diferencia se queda en la sección: aquí sobrevivió
   un `end` de nivel superior del texto original, y la sección dejó de compilar.
   Con la cuenta inversa el resultado habría sido un `end` **faltante**, igual de
   roto y más difícil de ver.
2. **El anclaje es un mensaje de texto.** `[\s\S]*?` avanza hasta la primera
   aparición de «You have no room in your Bag.». Ese mensaje aparece más de una vez
   en la sección (también en `grandeurCodeExchange`), así que el intervalo sustituido
   depende de cuántas ramas tenga el método, no de dónde termina.

Hubo un tercer factor, de proceso: `tools/qa/ruby_syntax_check.mjs` sólo compila una
**lista fija** de seis secciones PokeMod por paquete (18 en total). «Grandeur Club»
no estaba en la lista, así que `npm test` salía en verde con la sección rota. Y el
`verify()` del propio instalador sólo exigía la corrección a la copia distribuible,
con este comentario explícito:

```js
// La copia del juego puede conservar el script original; la copia que se
// distribuye para instalar debe ser la que no contiene el `end` sobrante.
```

Es decir: el defecto no se coló por descuido, se **toleró por escrito**. Esta fase
quita esa tolerancia.

---

## 3. Qué se cambió

| # | Archivo | Cambio |
|---:|---|---|
| 1 | `pokemon_fire_ash/Data/Scripts.rxdata` | Reparado: fuera el `end\r\n` de la línea 710. 1 162 815 → 1 162 814 bytes; 56 837 → 56 832 caracteres en la sección. **Ninguna otra sección cambia.** |
| 2 | `tools/lib/ruby_method_patch.mjs` | **Nuevo.** Sustitución estructural de métodos: un `def` de nivel superior termina en el primer `end` en columna 0. Sin cuentas de `end`, sin anclajes de texto. |
| 3 | `tools/repair_grandeur_club_end.mjs` | **Nuevo.** Repara la copia del juego (con copia previa), `--verify` de las cuatro copias y `--selftest` de 8 reglas. Idempotente. |
| 4 | `tools/apply_emergency_abra_and_free_tower.mjs` | Causa raíz: instala con `reemplazarMetodo` en vez del regex que contaba `end`. Su `verify()` ahora exige las **dos** copias limpias e idénticas. |
| 5 | `tools/qa/ruby_syntax_full_check.mjs` | **Nuevo verificador.** Compila **todas** las secciones de los cuatro paquetes (1293 secciones no vacías), no una lista fija. |
| 6 | `tools/external_authoring.test.mjs` | La divergencia juego↔descargable pasa de 9 a 8 secciones: «Grandeur Club» ya no diverge. Se afirma que la sección es idéntica en las dos copias y que ninguna lleva `end` extra. |
| 7 | `tools/apply_canon_arceus.mjs` | El mensaje «mismas **nueve** correcciones de estabilidad» dejaba de ser cierto; ya no escribe un número que se mide en otra parte. |
| 8 | `package.json` | Cuatro scripts nuevos (`verify:ruby:full`, `repair:grandeur:end`, `verify:grandeur:end`, `verify:grandeur:end:selftest`); los tres verificadores entran en `npm test` justo después de `verify:ruby`. |
| 9 | docs | Este documento, la tabla de estado de la fase 39, `docs/qa/rollback.md` (carpeta de respaldo nueva), `docs/CANON_ARCEUS.md`, `docs/RECONSTRUCCION_CANONICA.md` y `README.md`. |

Regla de oro respetada: no se edita contenido original de Fire Ash. Lo único que se
quita de «Grandeur Club» es el residuo que dejó un parche propio del proyecto; el
método original ya había sido sustituido por el instalador en su momento y su copia
previa viaja en `PokeModBackups/`.

---

## 4. Verificación (medida, con los comandos)

| Comprobación | Comando | Resultado |
|---|---|---|
| Compilación completa de secciones | `npm run verify:ruby:full` | **exit 0** · 1293 secciones en 4 paquetes · 323/323, 323/323, 323/323, 324/324 |
| Reparación de las cuatro copias | `npm run verify:grandeur:end` | **exit 0** · sección idéntica en las cuatro (56 832 caracteres), método en líneas 688–709 |
| Reglas del parcheo estructural | `npm run verify:grandeur:end:selftest` | **exit 0** · 8/8 reglas |
| Instalador de Abra/Torre | `npm run verify:abra:tower` | **exit 0** · ahora exige también la copia del juego |
| Lista fija de secciones PokeMod | `npm run verify:ruby` | **exit 0** · 18 secciones |
| Suite maestra del Atlas | `npm run test:atlas:master` | **exit 0** · 76 258 pruebas |
| Autoría externa (contiene las aserciones de Grandeur Club) | `node tools/external_authoring.test.mjs` | **exit 0** · 110 OK, 0 fallos |

**Fidelidad del volcado Marshal.** Reescribir un `.rxdata` entero es el riesgo real
de esta fase, así que `--verify` lo comprueba contra la copia previa: 409 secciones
antes y después, ids y títulos intactos, **una sola** sección con bytes distintos
(«Grandeur Club»). Si el volcado tocara cualquier otra sección, la comprobación
falla.

### `npm test` completo: verde hasta el rojo preexistente

`npm test` encadena 40 pasos con `&&`. Los 37 primeros salen en verde, incluidos los
tres nuevos de esta fase. El paso 38, `npm run verify:mapa_terminado`, **sale 1**:

```text
hallazgo DN-SALVAJES-DECLARADOS: sin_confirmar — 15 mapas del sueño declaran
salvajes en las fichas (el registro lista 14) y 15 los tienen implementados
(el registro dice 0)
FALLO hallazgo: DN-SALVAJES-DECLARADOS no se pudo confirmar con los datos instalados
```

Ese fallo **no es de esta fase**: se midió idéntico en un worktree limpio de
`e9a87880` (HEAD base, sin ninguno de estos cambios), donde `npm test` se detiene en
el mismo sitio y por el mismo motivo. Es una deriva entre
`content/mapa_terminado.json` y los mapas DN instalados (15 mapas con salvajes
frente a los 14 que declara el registro), y pertenece a la fase que toque ese
registro. Los dos pasos que quedan detrás (39 y 40) se ejecutaron por separado para
no dejar nada sin medir: `verify:evento_terminado` **exit 0** y
`test:atlas:master` **exit 0** (76 258 pruebas).

---

## 5. Cómo deshacerla

```bash
# Capa 1: la copia previa que hizo la propia herramienta (fuera de Git)
cp -f pokemon_fire_ash/PokeModBackups/grandeur_club_end_originals/Scripts.rxdata \
      pokemon_fire_ash/Data/Scripts.rxdata

# Capa 2: Git (en un clon nuevo no existe PokeModBackups/, que está en .gitignore)
git restore pokemon_fire_ash/Data/Scripts.rxdata
```

Tras cualquiera de las dos, `npm run verify:grandeur:end` y `npm run verify:ruby:full`
vuelven a salir 1: es lo esperado, confirman que la sección otra vez no compila.
El mapa completo de carpetas de respaldo está en [`docs/qa/rollback.md`](qa/rollback.md).

---

## 6. Lo que esta fase **no** hace

- **No toca las copias de distribución.** Ya compilaban; reescribirlas habría
  cambiado el paquete directo, el ZIP de la raíz y el presupuesto del artefacto sin
  motivo. Medido: `npm run verify:corregido:zip` y `npm run verify:presupuesto`
  siguen en verde y el ZIP no se regenera (la reparación vive sólo en
  `pokemon_fire_ash/`).
- **No arregla `buyBuff` (sección «Sygna Buffs»).** El mismo instalador recorta ese
  método con un regex que termina en mitad del cuerpo
  (`…pbSet\(80,pbGet\(80\) - buff\.cost\)`) y confía su cierre al texto sobrante. Es
  la misma familia de riesgo. Hoy la sección compila —lo cubre el verificador nuevo—
  y reescribirla cambiaría contenido instalado fuera del alcance de esta fase. Queda
  anotado como deuda y vigilado por `npm run verify:ruby:full`.
- **No regenera `tools/inventario_congelado.json`.** Ese verificador ya estaba en
  rojo **antes** de esta fase: `node tools/inventario_congelado.mjs --verify`
  reporta 30 hashes distintos (paquete DN QA, `Tilesets.rxdata`, …) en `e9a87880`.
  Regenerarlo aquí habría absorbido deriva de otras fases y reescrito
  `docs/ESTADO_CONGELADO.md` como si esta fase la hubiera producido. Esta fase suma
  a esa lista un archivo cambiado (`pokemon_fire_ash/Data/Scripts.rxdata`) y tres
  herramientas nuevas. Quien cierre la deriva: `node tools/inventario_congelado.mjs`
  y después `--verify`, en su propia fase y con su propio motivo.
- **No ejecuta `Game.exe`.** No hay Wine en este entorno: la condición 3b de la
  definición de terminado sigue pendiente y se prueba a mano con
  [`docs/QA_MANUAL_PLAYTEST.md`](QA_MANUAL_PLAYTEST.md). La torre del Grandeur Club
  (mapas 141/151/214) es el camino que hay que ejercitar: máquina expendedora del
  mapa 151, evento 72, canje de objetos a 0 créditos y hasta 99 unidades.

---

## 7. Invariante que queda escrita

**La sección «Grandeur Club» es la misma en la copia del juego y en las tres de
distribución.** Lo afirman dos comprobaciones que corren en `npm test`
(`verify:grandeur:end` y `tools/external_authoring.test.mjs`) y el `verify()` del
instalador. Si una fase futura necesita que diverjan, debe cambiar las tres
comprobaciones en el mismo commit y explicar aquí por qué.
