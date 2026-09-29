# Scripts.rxdata corregido

Descarga [`Scripts.rxdata`](Scripts.rxdata) desde esta carpeta (en GitHub: abre el archivo y pulsa **Download raw file**). Es el archivo completo de scripts del juego, listo para sustituir `pokemon_fire_ash/Data/Scripts.rxdata` en tu copia de Fire Ash. **No** es un archivo `.rb` para pegar como una sección nueva.

Antes de sustituirlo, cierra el juego y haz una copia de seguridad de tu `Data/Scripts.rxdata` actual. Usa esta versión solo con los datos de este repositorio: sustituir los scripts de otra versión podría sobrescribir cambios propios. No es necesario tocar `Scripts_bak.rxdata` ni tus partidas.

Corrección: se eliminó un único `end` sobrante después de `grandeurItemExchange` en la sección **Grandeur Club** (línea 710 del código Ruby descomprimido). Las otras 402 secciones y sus nombres e identificadores permanecen intactos. El archivo original en `pokemon_fire_ash/Data/` se dejó sin cambios para que puedas descargar el corregido por separado.
