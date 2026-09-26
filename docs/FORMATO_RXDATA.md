# 📄 Formato rxdata (notas técnicas)

Referencia de lo que implementa PokeMod (`web/js/marshal.js`, `rmxp.js`,
`render.js`). Verificado contra **mkxp** (motor abierto compatible con RGSS,
base de la familia JoiPlay/Kirin) y la especificación de Ruby Marshal.

## Ruby Marshal 4.8

- Cabecera `04 08`. Tipos: `0` nil, `T/F` bool, `i` fixnum, `f` float (texto),
  `"` string, `:` símbolo, `;` symlink, `@` link, `[` array, `{`/`}` hash,
  `o` object, `u` userdef, `U` usermarshal, `S` struct, `/` regexp, `l` bignum,
  `c/m/M` class/module, `e` extended, `C` uclass, `I` ivar, `d` data.
- Enteros ("long"): `0`→0; `1..4`→N bytes LE (positivo); `5..127`→byte−5;
  `0xFC..0xFF`→N bytes de negativo (crudo−256^N); resto→byte−251.
- Los símbolos van a su propia tabla (`;`); el resto de objetos heap a la de
  links (`@`). Los contenedores se registran ANTES de sus hijos (ciclos OK).
- RGSS = Ruby 1.8: los strings no traen ivar de encoding; igual soportamos `I`.

## Table (clase RGSS, via UserDef "Table")

```
int32 dim, x, y, z, size   (little-endian)
int16LE[size] data          (size == x*y*z)
```

Índice: `x + X*(y + Y*z)`. (Fuente: `Table::serialize` de mkxp.)

## Tiles (`Data/MapXXX.rxdata` → `RPG::Map`, `@data` Table de 3 capas)

- IDs `0..47`: vacío (mkxp los salta).
- IDs `48..383`: autotiles. Autotile `id/48 − 1` (0..6), patrón `id%48`.
  Cada patrón = 4 piezas 16×16 según la tabla `autotileRects` de mkxp
  (`src/autotiles.cpp`, orden TL/TR/BL/BR), frame 0 del PNG (96×128).
- IDs `384+`: tileset normal, rejilla de 8 columnas de 32×32:
  `sx=(i%8)*32`, `sy=(i/8)*32` con `i=id−384`.
- Prioridades (`RPG::Tileset @priorities`, indexadas por ID completo):
  `0` = debajo de eventos, `>0` = encima.

## Eventos

`RPG::Event`: `@id @name @x @y @pages[]`.
`RPG::Event::Page`: `@condition @graphic @move_type @move_speed @move_frequency
@move_route @walk_anime @step_anime @direction_fix @through @always_on_top
@trigger @list[]`.
`RPG::EventCommand`: `@code @indent @parameters[]`.
Códigos RMXP principales: 101/401 texto, 102/402/403/404 opciones, 103 número,
105 botón, 106 espera, 108/408 comentario, 111/411/412 condición, 112/413 bucle,
113 romper, 115 salir, 116 borrar, 117 evento común, 118/119 etiquetas,
121 switches, 122 variables, 123 self-switch, 124 timer, 125 oro, 126–128
ítems/armas/armaduras, 129 equipo, 201 teletransporte, 202 posicionar,
209 ruta, 231–235 imágenes, 236 clima, 241–249 audio, 301 batalla, 302 tienda,
303 nombre, 311–322 héroe, 331–340 enemigos, 351/352 menú/guardado, 353/354 fin,
355/655 script, 0 fin. Ver `COMMANDS` en `rmxp.js` (español).

## System / Tilesets / MapInfos / Scripts

- `System.rxdata`: `RPG::System` (`@switches/@variables`: arrays 1..5000,
  `@start_map_id/@start_x/@start_y`, etc.).
- `Tilesets.rxdata`: array `[nil, set1, …]`; `@passages/@priorities/@terrain_tags`
  son Tables 1-D de `384+N`.
- `MapInfos.rxdata`: Hash `id → RPG::MapInfo (@name @parent_id @order …)`.
- `Scripts.rxdata`: array `[id, nombre, código_zlib]`; el código es
  `Zlib.deflate` (se lee con `DecompressionStream('deflate')`).

## PBS (Essentials v19)

INI con secciones `[ID]` y `Clave = Valor`. PokeMod preserva orden, comentarios
y líneas multilínea; `pbsSet` solo toca la línea editada. Esquemas de
formulario en `pbs.js` (`PBS_SCHEMAS`).

## Partidas (protegidas, no se editan)

Essentials guarda `Save<N>.rxdata` (+ `Game.rxdata` heredado) en la raíz.
PokeMod los detecta para respaldarlos y bloquea cualquier escritura/borrado
sobre ellos (`PROTECTED` en `fs.js` + chequeo en `pmDelete`).

## Créditos de formato

- Lógica de tiles/autotiles/prioridades: proyecto **mkxp** (Ancurio, GPL-2.0).
  Solo se reutilizó la *tabla de rectángulos* y las reglas (hechos del formato),
  reimplementadas en JS.
- Estructuras `RPG::*`: RPG Maker XP (Enterbrain) + Pokémon Essentials.
