# Guía de creación con PokeMod Studio

La pestaña **Crear** fabrica contenido nuevo con la misma estructura que usa el
juego base (Pokémon Essentials v19.1, la versión de Fire Ash): entrenadores que
detectan, exclaman y recuerdan derrotas, objetos recogibles, tiendas, curanderas,
mapas, encuentros, puntos de mapamundi y conexiones.

Todo se genera en forma **expandida y lista para jugar**: en Android/Kirin no hay
RPG Maker que "auto-convierta" eventos, así que cada plantilla ya trae sus páginas,
condiciones y scripts tal como los espera el juego.

## 1. Evento nuevo en un mapa

Elige el mapa y la casilla X/Y, luego una plantilla:

| Plantilla | Qué genera |
|---|---|
| NPC hablador | Personaje con diálogo. |
| Entrenador de ruta | Evento `Trainer(X)` con disparo al tocar: música de intro, exclamación y acercamiento (`pbTrainerIntro` + `pbNoticePlayer`), texto, batalla condicional (`pbTrainerBattle`) y self-switch A; segunda página con el texto post-batalla. Puede crear su entrada en `trainers.txt` con el equipo que definas. |
| Objeto visible | Estructura expandida de item ball: condicional `pbItemBall` + self-switch A + página 2 en blanco. |
| Objeto oculto | Igual, pero invisible y atravesable, con `HiddenItem` en el nombre (lo necesita el Buscaobjetos). |
| Regalo Pokémon | NPC que entrega un Pokémon (`pbAddPokemon`) con textos de antes/después/equipo lleno. |
| Curandera | Fija el punto de retorno (`pbSetPokemonCenter`), pregunta Sí/No y cura con el comando Recuperar todo. |
| Tienda | Dependiente con `pbPokemonMart` y la mercancía que listes. |
| Cartel | Texto sin gráfico. |
| Salida / puerta | Teletransporte al pisar (atravesable). |
| Salvaje guionado | Batalla única contra un salvaje (`pbWildBattle`) con variable de resultado. |

La vista previa muestra cada página con sus comandos antes de crear. Si un ID
(especie, objeto, tipo) no existe en los PBS, verás un aviso (puedes crearlo igual
y añadir el dato después, o corregirlo antes).

## 2. Mapa nuevo

- **Mapa vacío**: nombre, tamaño, tileset y tile de relleno. Nace sin eventos;
  añade los tuyos con la sección 1.
- **Duplicar mapa**: copia un mapa existente con otro nombre e id, y opcionalmente
  copia sus encuentros y metadatos. Los teletransportes internos siguen apuntando
  a los mapas originales: pásale la Auditoría después.

El mapa se registra en el árbol (`MapInfos.rxdata`) bajo el padre que elijas.

## 3. Datos PBS

Formularios que escriben en los PBS con el formato exacto de v19.1:

- **Entrenador** (`trainers.txt`): `[TIPO,Nombre]` o `[TIPO,Nombre,Versión]`,
  frase de derrota, objetos y equipo (especie, nivel, movimientos, objeto…).
- **Encuentros** (`encounters.txt`): bloques por tipo (`Land`, `Water`, `Cave`,
  cañas, `RockSmash`, `HeadbuttLow/High`, `BugContest`…) con densidad y filas
  `probabilidad,ESPECIE,min,max`. Cada tipo debe sumar 100 (hay botón Normalizar).
- **Metadatos** (`metadata.txt`): nombre mostrado, exterior, bici, `MapPosition`
  (región,x,y del mapamundi), `HealingSpot` y fondo de batalla.
- **Punto de mapamundi** (`townmap.txt`): casilla, nombre, punto de interés,
  destino de vuelo (mapa,x,y) y switch. Siempre 8 valores con 7 comas.
- **Conexión** (`connections.txt`): une bordes `mapa,borde,desfase,mapa,borde,desfase`
  para caminar entre mapas sin cortes.

Nota de versiones: Fire Ash (v19.1) usa `metadata.txt`, `townmap.txt` y
`connections.txt`. Si tu proyecto trajera los nombres de v20+ (`map_metadata.txt`,
`town_map.txt`), el editor los detecta igual.

## 4. Editor de mapamundi

Editor visual al estilo del `townmapgen.html` oficial:

1. Elige la región. Se carga su imagen (`Graphics/Pictures/...`, 480x320 con
   casillas de 16x16). Si falta la imagen, verás la cuadrícula vacía.
2. Toca una casilla: blanco = punto, cian = destino de vuelo, amarillo = selección.
3. Rellena nombre, punto de interés, vuelo y switch; guarda el punto.
4. **Guardar en PBS** escribe todos los puntos de la región.

Consejo: no marques dos casillas adyacentes como destino de vuelo (los iconos se
solapan en el juego).

## 5. Auditoría

Revisa que lo creado (y lo existente) encaje como en el juego base:

**Solo PBS (rápido):**
- Secciones que apuntan a mapas inexistentes (metadatos, encuentros).
- Puntos duplicados, vuelos a mapas inexistentes, coordenadas fuera del 30x20.
- Encuentros en formato antiguo (v18) o probabilidades que no suman 100.
- Entrenadores sin Pokémon, con más de 6, o con especies/objetos/tipos inexistentes.
- Conexiones mal escritas o a mapas inexistentes.
- Imágenes de región ausentes en `Graphics/Pictures`.

**Completa (todos los mapas):**
- Batallas contra entrenadores que no están en `trainers.txt`.
- Especies/objetos de scripts que no están en `pokemon.txt`/`items.txt`.
- Teletransportes a mapas inexistentes o casillas fuera de rango.
- Sprites de eventos ausentes en `Graphics/Characters` (incluye mayúsculas).
- Eventos `Trainer(X)` sin disparo al tocar, y eventos `Item:`/`HiddenItem:` sin
  estructura expandida (no funcionarían en Kirin).

Cada aviso indica dónde está y el botón **Ir** te lleva al mapa/evento.

## Referencias

Estructuras verificadas contra la documentación de Pokémon Essentials (wiki
oficial, era v19), el código v19 real (Chasm Engine), los PBS de ejemplo de
Essentials y el editor oficial `townmapgen.html`. La idea del pintor de regiones
también bebe de herramientas comunitarias como PkmnRegions (felker.dev).
