# Métrica de éxito del plan: las cuatro condiciones de cada mundo

Fase 2/46199 (tarea 36). Define **qué cuenta como mundo terminado** en el plan de expansión y
lo mide de verdad contra los datos compilados del juego, no contra la promesa de los documentos.

- **Registro de mundos**: [`content/metrica_dimensiones.json`](../../content/metrica_dimensiones.json).
- **Comprobación**: `npm run verify:metrica` (dentro de `npm test`) y `npm run verify:metrica:profundo`
  para re-ejecutar además los verificadores de cada mundo.
- **Registro de corridas**: [`docs/qa/partidas/2026-10-15_corridas.txt`](partidas/2026-10-15_corridas.txt).

## Qué mide

**Cada mundo del plan tiene que cumplir cuatro condiciones.** Si una falla, el mundo no está
terminado, por mucho que su contenido exista.

| # | Condición | Definición operativa (lo que comprueba el verificador) |
|---|---|---|
| 1 | **Jefe final** | El mundo declara mapa, evento instalado y la llamada de combate exacta que lo cierra. Se lee el `Map*.rxdata`, se busca el evento por nombre y se exige que una de sus páginas contenga esa llamada. Si el mundo promete un premio (medalla o insignia), se comprueba que se entregue en algún evento del mundo. |
| 2 | **Retorno libre** | El mundo declara al menos una salida instalada y se exige que exista una página **sin condición de switch ni de variable** que transfiera fuera del mundo. Ganar no obliga a quedarse y perder no encierra: la salida no puede depender del progreso. |
| 3 | **Verificador propio** | El mundo declara al menos un script que existe en `package.json` y que comprueba **su** contenido (no el del proyecto entero). Con `--profundo` la métrica lo ejecuta y exige salida limpia. |
| 4 | **Partida de prueba registrada** | El mundo declara una corrida con fecha, comando y la **cita literal** que aparece en el registro de corridas; la cita se verifica leyendo el archivo. La partida manual se registra aparte y se mide como porcentaje propio. |

## Alcance: 23 mundos

| Familia | Mundos | Por qué está dentro |
|---|---|---|
| Dimensiones invitadas | 6 | Glazed (2200/2201), Light Platinum (2210/2211), Liquid Crystal (2240/2241), TFOH (2242/2243), Factory Adventure (2244/2245) y la dimensión Team Rocket (2220/2221). Se entra, se juega y se vuelve. |
| Emisiones del Monte Silver | 7 | Mapas 2023–2029, las siete historias con jefe, sello propio y salida a la gruta. |
| Mundos creepypasta | 10 | EP01–EP06 y el segundo anillo W7–W9 (con jefe) más la Liga Oscura (2141/2142), que cierra el arco. |

**Quién queda fuera y por qué.** El **Nexo de Ruptura** (2136–2140) no es un mundo con jefe: es el
cierre del arco, y su contenido se mide con los mundos que lo alimentan. El **Atlas Mil** tampoco
entra: no es una dimensión visitable sino una región con su propia jerarquía (40 anclas · 120 rutas ·
840 ecos) y sus propios verificadores por lote. Ambas exclusiones están escritas para que ninguna
fase futura las descubra por su cuenta: el verificador **falla** si el registro pierde un mundo que
el contenido sí tiene, y también si inventa uno que no existe.

## Resultado medido (2026-10-15)

```text
métrica: 23/23 mundos con las cuatro condiciones (100 %) · partida manual registrada en 0/23 mundos (0 %)
```

Los cuatro criterios están cubiertos en la **capa automática**: 23 jefes verificados contra los
mapas compilados (incluidos los tres que no usan `pbTrainerBattle` clásico: el espejo de EP05, la
secuencia final de KINGGUS y el duelo de Mad Pikachu), 31 salidas sin condición, 11 verificadores
propios distintos y 23 corridas citadas de un registro con 19 comandos ejecutados hoy.

El verificador también se somete a **autoprueba negativa**: con una cita falsificada a propósito y un mundo
quitado del registro falla por las dos vías (`EXIT=1`), y al restaurar el registro vuelve a `EXIT=0`. Las
tres corridas —normal, profunda y negativa— están en el registro de corridas.

La **capa manual está a 0 %** y no se disimula: el entorno de la fase no tiene `Game.exe`, ni Kirin,
ni Wine, así que ninguna persona ha jugado estos mundos. La checklist existe y está sin marcar
([`docs/QA_MANUAL_PLAYTEST.md`](../QA_MANUAL_PLAYTEST.md)); cada mundo apunta a ella en
`partida.manual`. Esta es la deuda que cierra el plan, y por eso la métrica publica los dos
porcentajes en lugar de uno.

## Escalera de cierre del plan

| Estado | Qué exige | Hoy |
|---|---|---|
| **Pendiente** | Falta contenido: algún mundo sin jefe, sin salida o sin verificador. | 0 mundos |
| **Verificado** | Las cuatro condiciones con corrida automática registrada. | **23 mundos** |
| **Certificado** | Además, una persona juega el mundo y lo marca en la checklist manual. | 0 mundos |

El plan se considera **cerrado** cuando la tabla está entera en «Certificado». El paso de
«Verificado» a «Certificado» no lo puede dar ningún agente: lo da quien juega. Lo que sí puede hacer
un agente —y hace esta métrica— es garantizar que, cuando esa persona juegue, no encuentre un mundo
sin jefe, sin salida o sin forma de comprobarlo.

## Hallazgos y deudas registrados

La métrica incluye lo que encuentra y no le toca arreglar aquí:

- **COLISION-SW768 (confirmado).** Los switches **768–774** están usados dos veces: son las siete
  puertas Unown de la Gruta de los Testigos (Map2030: T, E, S, T, I, G, O) y, a la vez, están
  nombrados `POKEMOD ATLAS T2 ROUTE 21…27` en `System.rxdata`. El verificador lo confirma leyendo el
  mapa y el registro de nombres; la consecuencia práctica es que cerrar la ruta Tier 2 21 abre la
  puerta 1 de la Gruta sin haber sellado nada. Arreglarlo exige renumerar un lado y re-ejecutar su
  instalador: queda como hallazgo abierto, con las dos fuentes citadas.
- **PARTIDA-MANUAL.** Las 23 partidas manuales están pendientes (motivo arriba).
- **DN-MAPS-VERIFY-PRERREQUISITO.** `dn:maps:verify` falla con `ENOENT` de
  `content/dimensional_nightmare_tiles_2x.json`, un artefacto ignorado por Git: hay que correr
  `npm run dn:preparar` antes. Los demás verificadores de DN sí corren y están en verde.
- **ROM-NATIVO-11-FALLOS.** `verify:rom:nativo` reporta 11 fallos preexistentes en mapas de campaña
  (diez mapas con una celda que no coincide con el ROM y un evento solapado en Map3120); dos de esos
  mapas (3839, 3874) están en el rango de la campaña TFOH. No toca a la dimensión 2242/2243, que
  verifica en verde, pero se declara.

## Cómo se mantiene

1. **Mundo nuevo.** Se añade al contenido y, en el mismo commit, una entrada en
   `content/metrica_dimensiones.json` con sus cuatro campos. Si el mundo nuevo falta, el verificador
   de cobertura lo delata porque el contenido ya lo tiene y el registro no.
2. **Corrida nueva.** Se ejecuta el verificador del mundo y su salida se registra en
   `docs/qa/partidas/<fecha>_corridas.txt`; después se actualiza la cita (`evidencia.busca`) del
   mundo. La cita tiene que existir de verdad: la métrica la lee.
3. **Partida manual jugada.** Se marca el ítem correspondiente en `docs/QA_MANUAL_PLAYTEST.md` y se
   cambia `partida.manual.estado` a `hecha` añadiendo la evidencia; el porcentaje manual sube solo.
4. **Antes de dar un mundo por bueno:** `npm run verify:metrica:profundo`, que además ejecuta los
   verificadores declarados (necesita `npm install`).

## Qué no prueba esta métrica

- No prueba que el jefe sea **divertido** ni que el ritmo funcione: eso es la capa manual.
- No prueba que la salida esté **bien señalizada** en pantalla, sólo que existe y no tiene condición.
- No prueba que el mundo se pueda terminar **sin bloqueos raros** (celdas aisladas, eventos
  apilados): de eso se ocupan `dn:audit`, `verify:mapas` y los verificadores de cada familia.
- No sustituye a `npm test`: lo complementa con la pregunta «¿está terminado **este** mundo?».
