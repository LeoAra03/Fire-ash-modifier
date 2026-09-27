# Guía: análisis total y packs de contenido nuevo

Pestaña **Crear**, secciones **6. Análisis total del juego** y **7. Packs de contenido nuevo**.

Todo lo que sigue trabaja sobre **tu copia extraída del juego**. La app nunca
redistribuye archivos del juego ni toca tus partidas guardadas: solo lee y
escribe `Data/` y `PBS/`, siempre con backup previo.

## 1. Análisis total del juego (sección 6)

Pulsa **Analizar juego**. La app escanea todos los mapas y PBS y muestra un
tablero con totales: mapas, eventos, NPCs, textos, switches, variables,
objetos, especies, batallas de entrenador y salidas. No modifica nada.

Vistas disponibles (con filtro de texto y salto al mapa/evento):

- **Diálogos**: cada mensaje, elección y script con su mapa, evento y página.
- **NPCs**: nombre, sprite, posición y mapa.
- **Flags**: cada switch y variable con sus usos (quién lo lee y quién lo escribe).
- **Objetos / Especies / Entrenadores**: dónde se usa cada objeto y especie
  (batallas salvajes, regalos, tiendas, item balls) y cada batalla de
  entrenador con su ubicación exacta.
- **Mapas y colisiones**: tamaño, tileset, porcentaje bloqueado/parcial
  (calculado con la tabla de pasajes del tileset) y etiquetas de terreno;
  más la lista de salidas (a qué mapa llevan o si son dinámicas).
- **Islas y regiones**: mapas agrupados por región del mapamundi según
  `metadata.txt` + `townmap.txt`, con sus coordenadas; y mapas sin posición.

**Exportar JSON** descarga el índice completo para consultarlo o procesarlo.

### Cómo se calcula cada cosa

- Flags: comandos 111 (ramas), 121/122/123 (switches, variables, self),
  103/105 (entrada numérica, botones) y condiciones de página.
- Entrenadores: llamadas `pbTrainerBattle(...)` en scripts.
- Objetos: `pbItemBall`, `pbReceiveItem`, `pbPokemonMart` y plantillas de objeto.
- Especies: `pbWildBattle`, `pbDoubleWildBattle`, `pbAddPokemon`.
- Salidas: comandos 201 (directas y por variables).
- Colisiones: tabla de pasajes del tileset sobre las 3 capas de cada casilla.

## 2. Packs de contenido nuevo (sección 7)

Un pack añade **jefes/entrenadores, una isla (mapa hub) y una puerta** sin
tocar nada existente: 100% aditivo. Instalar un pack:

1. **Revisar e instalar**: la app valida el JSON (posiciones, equipos,
   especies y objetos contra tu juego) y muestra errores, avisos e info.
2. **Reasignar**: para cada jefe eliges un **tipo de entrenador existente**
   en tu juego (define sprite de batalla y música) y un **sprite** (la app
   avisa si el sugerido no está en tu proyecto para que elijas uno parecido).
3. Eliges **tileset del hub**, **mapa y casilla de la puerta**, y **región +
   coordenadas del mapamundi** (se sugiere la primera casilla libre).
4. **Instalar pack**: backup automático, creación del hub, puerta,
   entrenadores PBS, metadatos, punto del mapamundi y manifiesto.

El **manifiesto** (`PokeModBackups/packs/`) registra todo lo instalado para
**desinstalar** limpiamente después: borra el hub, la puerta, los
entrenadores, los metadatos y el punto, con backup previo.

### Reglas de seguridad

- Backup automático antes de instalar y antes de desinstalar.
- Las partidas guardadas nunca se tocan (solo se respaldan).
- Para desinstalar: sal del hub en tu partida antes de pulsar Desinstalar.
- Si algo sale mal, restaura el backup desde la pestaña de backups.

## 3. Pack incluido: Isla Espejo

`Isla Espejo: jefes del multiverso` — una isla post-juego estilo Frente de
Batalla con 8 jefes de otras líneas temporales (manga, spin-offs y errores
del código), curandera, cartel de bienvenida y cofre con Restaurar Todo x2:

| Jefe | Equipo | Nivel |
|---|---|---|
| Miror B. | 4 Ludicolo, Electrode, Sudowoodo | 58–62 |
| Azul | Charizard, Golbat, Scyther, Machamp, Porygon, Ninetales | 62–70 |
| Yellow | Pikachu, Raticate, Dodrio, Golem, Omastar, Butterfree (con motes) | 60–65 |
| Gonzap | Skarmory, Shiftry, Crawdaunt, Pinsir, Hariyama, Machamp | 62–66 |
| Cintia | Garchomp, Spiritomb, Togekiss, Lucario, Milotic, Roserade | 70–75 |
| Rojo | Pikachu, Venusaur, Poliwrath, Aerodactyl, Snorlax, Gyarados (con motes) | 72–75 |
| Coleccionista | 6 variocolor: Gyarados, Haxorus, Metagross, Charizard, Rayquaza, Umbreon | 64–70 |
| El Fin del Juego | Yveltal, Darkrai, Spiritomb, Gengar, Dusclops, Absol | 73–78 |

Los combates son amistosos (puedes perder sin consecuencias) y repetibles.
Los tipos y sprites se adaptan a tu juego en la pantalla de instalación.

## 4. Crear tus propios packs

Un pack es un JSON con esta estructura (ver `web/packs/isla_espejo.json`
como ejemplo completo):

```json
{
  "pack": "mi_isla",
  "title": "Mi isla",
  "hub": { "name": "Mi Isla", "width": 30, "height": 22, "spawn": { "x": 15, "y": 19 } },
  "door": { "name": "Puerta", "text": "¿Entrar?" },
  "bosses": [
    {
      "id": "jefe1", "name": "Jefe",
      "suggestedType": "CAMPER", "suggestedSprite": "Jefe",
      "x": 10, "y": 8, "loseText": "Perdí.",
      "intro": ["¡A luchar!"], "after": ["Buen combate."],
      "team": [{ "species": "PIKACHU", "level": 50 }]
    }
  ],
  "extras": [{ "kind": "healer", "x": 8, "y": 9 }]
}
```

- `bosses`: hasta 40. Cada miembro del equipo admite `species`, `level`,
  `moves`, `item`, `nick`, `shiny`, `gender`, `iv`, `ball`.
- `extras`: `healer`, `sign`, `item` (`item`, `qty`), `mart` (`stock`),
  `gift` (`species`, `level`).
- El regreso del hub aparece solo al sur de la puerta: deja esa casilla libre.

Impórtalo con **Importar pack (JSON)**.

## 5. Sobre gráficos y diálogos externos

Si tienes sprites u otros recursos en un archivo ZIP (por ejemplo, de
internet), extráelo en tu PC o celular y copia los PNG de personajes a
`Graphics/Characters/` de tu copia del juego: la app los lista
automáticamente en el selector de sprites. Los diálogos del pack se editan
directamente en el JSON antes de importarlo.
