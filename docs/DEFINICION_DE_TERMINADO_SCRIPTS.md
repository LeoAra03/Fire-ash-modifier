# Definición de «terminado» para un script

> Fase 39 del backlog. Un script no está terminado porque «se ve bien» o porque
> un parche se aplicó sin error: está terminado cuando pasa las tres comprobaciones
> de abajo, con comandos reproducibles y resultado registrado.

Aplica a cada sección de `Data/Scripts.rxdata` y a cada archivo Ruby que un
instalador inyecta (`tools/apply_*.mjs`, `tools/lib/*.rb`).

## Las tres condiciones

### 1. Sin llamadas colgadas

Toda llamada `objeto.metodo` debe apuntar a un método que algún script define, o
a un método del núcleo de Ruby / de la lista blanca del motor. Si no, el juego
falla con `NoMethodError` la primera vez que se recorre ese camino (caso real:
Ball Breaker, `target.selfProtected?`).

```bash
node tools/qa/scripts_dangling_calls.mjs
```

Terminado = **exit 0** y la línea `Llamadas sin definición conocida: 0`.
Incluye también los patrones de campo peligrosos (R10: clima, terreno, `pbFlash`
en la Ruta de Dios, etc.).

### 2. Sintaxis Ruby válida

Cada sección debe compilar con `RubyVM::InstructionSequence.compile`. Un `SyntaxError`
en una sección impide cargarla, y el fallo aparece en mitad de una partida, no al
instalar.

```bash
npm ci                              # instala @ruby/3.3-wasm-wasi (solo la primera vez)
node tools/qa/ruby_syntax_check.mjs        # lista fija de secciones PokeMod
npm run verify:ruby:full                   # TODAS las secciones de los cuatro paquetes
```

Terminado = **exit 0 en los dos**. `ruby_syntax_check.mjs` revisa una **lista fija**
de secciones por paquete (`PokeMod_Dialogos`, `PokeMod_ZMenu`, `PokeMod_Graficos`,
`PokeMod_Atavios`, `PokeMod_BadgeRegions`, `PokeMod_CanonArceus`): es rápido y cubre
lo que el proyecto inyecta. Una sección que no esté en esa lista no queda cubierta
por él —así se escapó «Grandeur Club» (fase 39)—, y por eso desde la **fase 32**
`tools/qa/ruby_syntax_full_check.mjs` compila las 409 secciones completas de cada
paquete (1293 secciones no vacías en total) y los dos entran en `npm test`.

### 3. Probado en el arranque del juego

Dos niveles; el segundo es obligatorio antes de dar una sección por cerrada.

**3a. Verificación estática de arranque** (equivalente a lo que hace `load_data`):
todas las clases serializadas en los `.dat`/`.rxdata` deben existir en los Scripts.

```bash
node tools/validate_boot_classes.mjs
```

**3b. Arranque real en `Game.exe`**: iniciar partida nueva, cargar la partida de
prueba, entrar en el mapa afectado y ejercitar el camino modificado (diálogo,
combate, tienda, evento). Necesita Windows o Wine. El entorno de desarrollo de
este repositorio **no dispone de Wine**, así que esta prueba se hace a mano con la
checklist de `docs/QA_MANUAL_PLAYTEST.md` y se anota el resultado con fecha. Un
verificador estático no sustituye este paso.

## Regla práctica

```text
terminado(script) = (1) exit 0  AND  (2) exit 0  AND  (3a) exit 0  AND  (3b) anotado como OK
```

Si falta cualquiera de los cuatro, el estado es **«candidato aprobado
estáticamente»**, no «terminado». Esta es la misma distinción que usa
`docs/ESTRATEGIA_PULIDO_ATLAS.md` para los mapas Tier 1.

Un parche que deja una sección en error de sintaxis **no** puede marcarse como
terminado aunque el resto de verificadores pase.

## Estado actual

Comprobado el **2026-10-16** (fase 32) con `npm ci` y los comandos de arriba.

| Comprobación | Copia del juego | Resultado |
|---|---|---|
| 1. `scripts_dangling_calls.mjs` | `pokemon_fire_ash/Data/Scripts.rxdata` (409 secciones) | OK · 0 llamadas colgadas · 0 patrones R10 |
| 2. `ruby_syntax_check.mjs` (lista fija) | 18 secciones de la lista fija en 4 paquetes | OK · sin errores |
| 2. `verify:ruby:full` (todas las secciones) | `pokemon_fire_ash/Data/Scripts.rxdata` | **OK · 323/323** secciones no vacías compilan (409 en total) |
| 2. `verify:ruby:full` (todas las secciones) | `Scripts_corregido/Scripts.rxdata` | OK · 323/323 (409 en total) |
| 2. `verify:ruby:full` (todas las secciones) | `Scripts_corregido/Paquete_directo/Data/Scripts.rxdata` | OK · 323/323 (409 en total) |
| 2. `verify:ruby:full` (todas las secciones) | `Scripts_corregido/Dimensional_Nightmare_QA/Data/Scripts.rxdata` | OK · 324/324 (410 en total) |
| 2. Reparación de «Grandeur Club» | las cuatro copias | `npm run verify:grandeur:end` OK · sección idéntica (56 832 caracteres) y sin `end` sobrante |
| 3a. `validate_boot_classes.mjs` | los cuatro paquetes | OK · todas las clases definidas |
| 3b. Arranque en `Game.exe` | — | **Pendiente**: sin Wine en este entorno |

Medición anterior (2026-10-15, fase 39): la compilación completa **fallaba** en la
copia del juego —408/409, sección «Grandeur Club», línea 710, `syntax error,
unexpected 'end'`— mientras las tres copias de distribución compilaban. Cerrado en
la fase 32.

> `npm test` entero no sale 0 en este checkout por un fallo **ajeno a los scripts**:
> `verify:mapa_terminado` reporta el hallazgo `DN-SALVAJES-DECLARADOS` sin confirmar
> (15 mapas DN con salvajes frente a los 14 que declara `content/mapa_terminado.json`).
> Medido idéntico en un worktree limpio de `e9a87880`, es decir, anterior a esta fase.
> Los 37 pasos anteriores salen en verde y los dos posteriores
> (`verify:evento_terminado`, `test:atlas:master` · 76 258 pruebas) se ejecutaron por
> separado, también en verde.

### Hallazgo bloqueante: «Grandeur Club» — **cerrado en la fase 32**

En `pokemon_fire_ash/Data/Scripts.rxdata` la sección «Grandeur Club» tenía una `end`
sobrante justo después del cierre de `def grandeurItemExchange`. Origen:
`tools/apply_emergency_abra_and_free_tower.mjs` (línea 227) sustituía ese método con
una expresión regular que **contaba cuatro `end`** del original
(`\s+end\s+end\s+end\s+end`) y escribía un reemplazo con los suyos propios; cuando
las dos cuentas no coinciden, la diferencia se queda en la sección. Aquí sobrevivió
un `end` de nivel superior (5 caracteres, `end\r\n`).

**Estado: corregido el 2026-10-16.** La reparación, la causa raíz y el verificador
nuevo que impide que se repita están documentados y medidos en
[`docs/REPARACION_GRANDEUR_CLUB_END.md`](REPARACION_GRANDEUR_CLUB_END.md):

```bash
npm run verify:ruby:full             # todas las secciones de los cuatro paquetes
npm run verify:grandeur:end          # las cuatro copias sin `end` sobrante
npm run verify:grandeur:end:selftest # 8 reglas del parcheo estructural
npm run repair:grandeur:end          # repara la copia del juego (idempotente)
```

La sección reparada es **idéntica byte a byte** a la de
`Scripts_corregido/Scripts.rxdata`, que ya compilaba: la corrección dejó de ser una
diferencia entre la copia del juego y la de distribución.

## Cómo actualizar este documento

Cuando cambie un verificador o se corrija una sección, actualizar la tabla de
«Estado actual» con el resultado real del comando, no con el esperado.
