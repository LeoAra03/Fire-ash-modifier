# Toolkit e inventario del repositorio

El estado completo está en [`INDICE_HERRAMIENTAS.json`](INDICE_HERRAMIENTAS.json); la auditoría humana de todas las carpetas, paquetes, datos y bloqueos está en [`docs/AUDITORIA_REPOSITORIO_Y_RECURSOS.md`](../docs/AUDITORIA_REPOSITORIO_Y_RECURSOS.md).

## Qué hay realmente en este clon

- Los **11 ZIP** del repositorio pasaron `unzip -t`; dentro de ninguno se encontraron entradas con extensiones de ROM/parche conocidas (`.gba`, `.gb`, `.gbc`, `.nds`, `.ips`, `.ups`, `.bps`, `.xdelta`).
- Siete ZIP de fuentes de herramientas y un ZIP de scripts corregidos Fire Ash siguen en la raíz/`agents/`. No se mantienen copias extraídas aquí: la extracción local es una caché ignorada por Git y no está presente en el checkout persistido.
- Los RAR multipartes de Tiled y Porymap están presentes, pero no se pudieron inspeccionar/extraer sin `unrar`, `unar`, `7z` o `bsdtar`. No concatenar los volúmenes con `cat`.
- No se detectaron ROMs `.gba`, `.gb` o `.gbc` fuera ni dentro de los ZIP. `reference/roms_invitadas/` y `roms pokemon/` no existen en este checkout.
- La carpeta del juego es `pokemon_fire_ash/` y el contenido del mod está en `Scripts_corregido/`; no hace falta duplicarlos bajo `toolkit/`.

El código fuente local extraído, si se necesita para una tarea concreta, debe regenerarse desde sus ZIP y quedarse fuera de Git. El índice distingue explícitamente **paquete existente**, **código extraído**, **programa ejecutable**, **ROM presente** y **contenido jugable**.
