# Scripts.rxdata corregido

Descarga [`Scripts.rxdata`](Scripts.rxdata) desde esta carpeta (en GitHub: abre el archivo y pulsa **Download raw file**). Es el archivo completo de scripts del juego, listo para sustituir `pokemon_fire_ash/Data/Scripts.rxdata` en tu copia de Fire Ash. **No** es un archivo `.rb` para pegar como una sección nueva.

Antes de sustituirlo, cierra el juego y haz una copia de seguridad de tu `Data/Scripts.rxdata` actual. Usa esta versión solo con los datos de este repositorio: sustituir los scripts de otra versión podría sobrescribir cambios propios. No es necesario tocar `Scripts_bak.rxdata` ni tus partidas.

## Cambios incluidos

- **Colisiones de sprites:** los eventos con `character_name` ya no se pueden atravesar, aunque la página esté marcada como `Through`. Esto cubre los personajes, entrenadores, NPCs, objetos y sprites de los eventos añadidos, sin tener que editar mapa por mapa. Los eventos sin gráfico conservan su comportamiento normal.
- **Grandeur Club:** se eliminó el `end` sobrante antes de `givePassive` en la sección **Grandeur Club** (línea 710 del código Ruby descomprimido).

Las otras secciones y sus nombres e identificadores permanecen intactos. El archivo original en `pokemon_fire_ash/Data/` se deja sin cambios para que puedas conservarlo como referencia.

## Instalación rápida

1. Cierra Fire Ash/Kirin.
2. Haz una copia de seguridad de `Data/Scripts.rxdata`.
3. Copia este `Scripts_corregido/Scripts.rxdata` sobre `Data/Scripts.rxdata` de tu carpeta original del juego.
4. Inicia el juego y carga tu partida normalmente.

El parche se aplica al iniciar los mapas y no altera las partidas guardadas. Si usas una versión distinta de Fire Ash, conserva tu copia original: este archivo corresponde a la versión de los datos de este repositorio.
