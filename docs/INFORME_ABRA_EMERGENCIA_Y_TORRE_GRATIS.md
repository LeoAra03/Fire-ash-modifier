# Informe: Abra de Emergencia, Resolución de Softlock y Torre Postgame a 0 Créditos

Fecha: 29 de septiembre de 2026  
Estado: Instalado y verificado en los datos compilados de Pokémon Fire Ash 3.7.1

---

## 1. La petición

El usuario solicitó resolver tres aspectos clave:
1. **Softlock al regresar de los contenidos agregados**: El NPC del asistente del profesor quedaba bloqueando el paso e impedía moverse. Modificar su comportamiento o permitir el libre movimiento.
2. **Objeto "Abra de emergencia"**: Crear un objeto que teletransporte de inmediato a la casa del protagonista en Kanto (Pueblo Paleta, Mapa 42), ubicado en la primera ubicación de las islas creadas (Isla Espejo - Atrio, Mapa 997) y/o donde se encuentra el NPC de Game Over (Archivo Cero, Mapa 999).
3. **Torre postgame (Grandeur Club) a 0 créditos**: En la torre postgame de Fire Ash (Salón Grandeur / Mapas 141, 151, 214), hacer que todas las cosas cuesten 0 créditos para evitar tener que repetir combates y farmear créditos una y otra vez.

---

## 2. Diagnóstico del softlock y resolución

### Causa técnica
- En `Map997.rxdata` (Isla Espejo - Atrio), el evento `Return Ferry` transportaba al jugador a Pueblo Paleta (`Map033.rxdata`) en las coordenadas `(39, 25)`.
- En `Map033.rxdata`, la coordenada `(39, 25)` en la capa 1 contenía el tile `1185` (valla de madera con máscara de colisión `b = 15`, intransitable en las 4 direcciones). El jugador aterrizaba directamente dentro de una casilla sólida.
- Directamente al norte, en `(39, 24)`, se ubicaba el evento 76 (`PokeMod: Aide Isla Espejo`, el asistente del profesor Oak) con `@through = false`.
- Al estar sobre una celda bloqueada, el motor RMXP no permite dar pasos, y hacia el norte el asistente actuaba como obstáculo sólido sin opciones de recolocación, dejando al jugador en un softlock permanente.

### Correcciones aplicadas
1. **Desembarco en césped abierto**: El evento de retorno del ferry en el mapa 997 ahora transporta a `(39, 23)` mirando al sur. Esa celda es césped transitable (`bits = 0`) al norte del asistente.
2. **Valla eliminada en `(39, 25)`**: Se limpió el tile de valla de la capa 1 en `(39, 25)` (`tableSet(table, 39, 25, 1, 0)`), de modo que incluso si un jugador carga una partida guardada previamente en `(39, 25)`, la celda ahora es césped completamente transitable en todas las direcciones (`bits = 0`).
3. **Ayudante con `@through = true` y menú de rescate**:
   - Se activó `@through = true` en el evento del Ayudante en Pueblo Paleta (`Map033`, evento 76) y en el sótano del laboratorio (`Map048`, evento 305). El jugador puede atravesarlo libremente si lo desea.
   - Si se interactúa con el Ayudante, entrega automáticamente el **Abra de emergencia** si el jugador no lo tiene aún en la Mochila.
   - Su diálogo ofrece tres opciones:
     - *Sail to Mirror Island* (Zarpar a Isla Espejo, mapa 997).
     - *Teleport to Ash's House* (Teletransportarse inmediatamente a la casa de Ash, mapa 42).
     - *Leave / Step aside* (Moverse libremente).

---

## 3. Objeto e interacción: "Abra de emergencia"

### Especificación técnica del objeto
- **ID y Símbolo**: `:ABRADEEMERGENCIA`, número `1031` en `items.dat`.
- **Tipo**: Objeto Clave (*Key Item*, bolsillo 8, `pocket = 8`).
- **Precio**: 0.
- **Uso de campo**: `field_use = 2` (usable directamente desde la Mochila en el mapa con usos infinitos).
- **Descripción**: *"Un Abra fiel entrenado para teletransportarte de inmediato a la casa de Ash en Pueblo Paleta, Kanto. Uso infinito."*
- **Icono gráfico**: Archivo PNG 48x48 instalado en `Graphics/Items/ABRADEEMERGENCIA.png`.

### Lógica de ejecución en scripts (`Scripts.rxdata`)
En la sección 248 (`Item_Effects`):
```ruby
def pbEmergencyAbraTeleport
  pbPlayDecisionSE
  pbMessage(_INTL("\\b¡El Abra de emergencia usó Teletransporte!"))
  pbFadeOutIn {
    $game_temp.player_new_map_id    = 42
    $game_temp.player_new_x         = 3
    $game_temp.player_new_y         = 8
    $game_temp.player_new_direction = 8
    pbCancelVehicles
    $scene.transfer_player if $scene.is_a?(Scene_Map)
    $game_map.autoplay
    $game_map.refresh
  }
end

ItemHandlers::UseInField.add(:ABRADEEMERGENCIA, proc { |item|
  pbEmergencyAbraTeleport
  next 1
})

ItemHandlers::UseFromBag.add(:ABRADEEMERGENCIA, proc { |item|
  pbEmergencyAbraTeleport
  next 2
})
```
- Al usar el objeto desde la Mochila (o el menú rápido/tecla F), se cierran los menús y el motor ejecuta la secuencia de teletransporte.
- Desmonta vehículos de forma segura (`pbCancelVehicles`).
- El destino es el mapa 42 (planta baja de la casa de Ash en Kanto, junto a la puerta de salida y a su madre que cura al equipo).

### NPCs Abra en las islas
Se crearon eventos físicos de Abra (con sprite overworld `ABRA`) en las ubicaciones clave:
1. **Isla Espejo - Atrio (Mapa 997, evento 10, coordenadas 12, 10)**: La primera ubicación de las islas creadas.
2. **Isla Espejo - Archivo Cero (Mapa 999, evento 10, coordenadas 19, 11)**: Junto al jefe "Game Over" (evento 9 en 18, 11).
3. **Ayudante en Pueblo Paleta (Mapa 033, evento 76)**: También entrega el objeto si el jugador habla con él.

Al hablar con cualquiera de los Abra:
- Si el jugador no tiene el objeto, se lo entrega de forma permanente.
- Ofrece la opción de teletransportar inmediatamente a la casa de Ash en Kanto con un fundido a negro y sonido de teletransporte.

---

## 4. Torre postgame (Grandeur Club) a 0 créditos

Se eliminó cualquier requisito de farmeo o gasto de créditos en el contenido de la torre del Grandeur Club:

### 4.1 Máquina Expendedora del Salón (`Map151.rxdata`, Evento 72)
- Todas las condiciones de créditos (`Var 80 >= N`) se fijaron en `Var 80 >= 0`.
- Todas las deducciones de créditos (`Var 80 -= N`) se cambiaron a restar `0`.
- Las llamadas a `grandeurItemExchange` se configuraron con precio `0`.
- Opciones a 0 créditos:
  - **Code: Luck**: 0 créditos.
  - **VIP Backstage Pass**: 0 créditos (requisito para ver combates especiales).
  - **Grandeur Club Staff Pass**: 0 créditos (antes 500 créditos).
  - **Mejoras (Tónicos y Sueros de Intensidad/Vigor)**: 0 créditos.
  - **Códigos ADN (Breath, Grim, Wall, Storm, Dome, Shine)**: 0 créditos.
  - **Lounge BGM Pack**: 0 créditos (antes 10 créditos).

### 4.2 Eventos Comunes de Objetos de Combate (`CommonEvents.rxdata`, CE 26..32)
- **CE 26 (Gem Purchase)**: Comprobación `Var 80 >= 0`, llamada `grandeurItemExchange(item, 0)`.
- **CE 27 (GC 1C)**: Objetos de 1 crédito ahora a coste 0.
- **CE 28 (GC 2C)**: Objetos de 2 créditos ahora a coste 0.
- **CE 29 (GC 3C)**: Objetos de 3 créditos ahora a coste 0.
- **CE 30 (GC 5C)**: Objetos de 5 créditos ahora a coste 0.
- **CE 31 (GC 8C)**: Objetos de 8 créditos ahora a coste 0.
- **CE 32 (GC 10C)**: Objetos Choice (Cinta Elegida, Gafas Elegidas, Pañuelo Elegido) a coste 0.

### 4.3 Scripts del motor (`Scripts.rxdata`)
- **Sección 392 (`Grandeur Club`)**:
  - `grandeurItemExchange(item, itemprice=0)`:
    - Fuerza `itemprice = 0`.
    - Permite elegir hasta 99 unidades a la vez (`maxitems = 99`).
    - No divide por cero ni resta saldo de créditos.
    - Otorga 99.999 créditos a `Var 80` automáticamente si el jugador tuviera menos, como salvaguarda visual y de comprobación.
- **Sección 393 (`Sygna Buffs`)**:
  - La clase `SygnaBuff` inicializa `@cost = 0`.
  - `showShopBuffs` muestra todos los buffs con `0 GC Credits`.
  - `buyBuff` entrega el buff seleccionado inmediatamente sin comprobar saldo insuficiente ni descontar créditos.

---

## 5. Herramienta de automatización y verificación

Se implementó el instalador y verificador idempotente:
```bash
node tools/apply_emergency_abra_and_free_tower.mjs
node tools/apply_emergency_abra_and_free_tower.mjs --verify
```
También disponible mediante npm:
```bash
npm run verify:abra:tower
```

### Resultados de las pruebas
```text
> npm run verify:abra:tower
Verificación OK: Abra de emergencia funcional (Mochila e islas), softlock resuelto
(valla abierta, Ayudante through) y torre Grandeur a 0 créditos.

> node tools/apply_isla_espejo_expansion.mjs --verify
Verificación OK: 3 mapas, 16 jefes, 32 combates y retorno libre.

> npm test
marshal.js: 51 OK, 0 fallos
integración: 114 OK, 0 fallos
External authoring: 67 OK, 0 fallos.
TOTAL: 232 pruebas superadas.
```
