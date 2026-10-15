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
node tools/qa/ruby_syntax_check.mjs
```

Terminado = **exit 0**. Advertencia: este verificador revisa una **lista fija** de
secciones por paquete (`PokeMod_Dialogos`, `PokeMod_ZMenu`, `PokeMod_Graficos`,
`PokeMod_Atavios`, `PokeMod_BadgeRegions`, `PokeMod_CanonArceus`). Una sección que no
esté en esa lista no queda cubierta. Para una revisión completa de un paquete hay
que compilar todas sus secciones (ver «Estado actual»).

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

Comprobado el 2026-10-15 con `npm ci` y los comandos de arriba.

| Comprobación | Copia del juego | Resultado |
|---|---|---|
| 1. `scripts_dangling_calls.mjs` | `pokemon_fire_ash/Data/Scripts.rxdata` (409 secciones) | OK · 0 llamadas colgadas · 0 patrones R10 |
| 2. `ruby_syntax_check.mjs` | 18 secciones de la lista fija en 4 paquetes | OK · sin errores |
| 2. Compilación completa de todas las secciones | `pokemon_fire_ash/Data/Scripts.rxdata` | **FALLA** · 408/409 · sección **«Grandeur Club»**, línea 710: `syntax error, unexpected 'end'` |
| 2. Compilación completa de todas las secciones | `Scripts_corregido/Scripts.rxdata` | OK · 409/409 |
| 2. Compilación completa de todas las secciones | `Scripts_corregido/Paquete_directo/Data/Scripts.rxdata` | OK · 409/409 |
| 2. Compilación completa de todas las secciones | `Scripts_corregido/Dimensional_Nightmare_QA/Data/Scripts.rxdata` | OK · 410/410 |
| 3a. `validate_boot_classes.mjs` | los cuatro paquetes | OK · todas las clases definidas |
| 3b. Arranque en `Game.exe` | — | **Pendiente**: sin Wine en este entorno |

### Hallazgo bloqueante: «Grandeur Club» en el juego de desarrollo

En `pokemon_fire_ash/Data/Scripts.rxdata` la sección «Grandeur Club» tiene una `end`
sobrante justo después del cierre de `def grandeurItemExchange`. Origen probable:
`tools/apply_emergency_abra_and_free_tower.mjs` (alrededor de la línea 201) sustituye
ese método por un texto que ya incluye su propio `end`, y el `end` original no se
elimina. Mientras no se corrija, esa sección **no está terminada** según la
definición de arriba, aunque `ruby_syntax_check.mjs` pase, porque no revisa esa
sección.

Corrección pendiente (fase aparte): quitar la `end` sobrante en la copia de
desarrollo, o sincronizar esa sección desde `Scripts_corregido/Scripts.rxdata`, que
sí compila. No se modifica en esta fase porque es un cambio de contenido de juego
y requiere reempaquetar el `.rxdata`.

## Cómo actualizar este documento

Cuando cambie un verificador o se corrija una sección, actualizar la tabla de
«Estado actual» con el resultado real del comando, no con el esperado.
