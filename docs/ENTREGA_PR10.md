# Entrega del PR #10

## Alcance completado

- 15 mosaicos de Atlas Mil (1.000 mapas) y un mosaico de 22 mapas complementarios.
- Informe con 1.022 fichas y ZIP referencial con 17 archivos.
- Monte Silver conserva Falda Map2021, Gruta Map2030 y Cumbre Map2022.
- La Ruta de Dios usa Map2038 para la aproximación y Map2031–Map2037 para los pisos.
- Paquete directo con 30 archivos, incluido LEEME.txt; ZIP verificado contra la carpeta de distribución.
- Sincronización de todos los datos y recursos del paquete contra sus orígenes, no solo existencia de archivos. Scripts.rxdata se compara con la versión corregida, conservando las reparaciones de distribución.
- Informe verificado contra mapas y catálogos actuales. La fecha no invalida el informe al día siguiente.
- Si se regenera un archivo referencial ausente, también se reconstruye su ZIP para no conservar una copia desactualizada.
- CI usa npm ci y ejecuta la suite completa antes de construir la APK; admite pushes a ramas arena y cambios de datos/paquetes/dependencias.

## Validación local (2026-10-01)

```bash
npm ci
npm run verify:all
node tools/atlas_narrative_pipeline.mjs --qa content/atlas_tier1_blueprints_approved.json
unzip -t Scripts_corregido/Fire_Ash_Paquete_Directo.zip
unzip -t Scripts_corregido/Mapas_PNG_y_Informe_Referencial.zip
```

Todos estos comandos pasaron. También se comprobó la sintaxis de los módulos y `git diff --check`. El pipeline narrativo regenera sus informes; su ejecución puede dejar cambios de fecha en content/.

## Qué instalar

1. Cierra el juego y Kirin; haz una copia de seguridad de tu instalación y partidas.
2. Descarga `Scripts_corregido/Fire_Ash_Paquete_Directo.zip` para instalar **La Ruta de Dios y las correcciones distribuidas**. Extrae Data/, Graphics/ y Audio/ directamente en la raíz de tu copia compatible de Fire Ash. Consulta `Scripts_corregido/LEEME.md`.
3. No reemplaces ni borres archivos de partida.
4. `Scripts_corregido/Mapas_PNG_y_Informe_Referencial.zip` es documentación visual: no se instala sobre Data/ y no añade los 1.022 mapas al juego. El paquete directo tampoco es un instalador de toda la expansión Atlas Mil.
5. Para usar el editor Android, descarga el artefacto `PokeMod-Studio-FireAsh-APK` de la ejecución exitosa de Actions correspondiente al PR/commit deseado. El APK es el editor, no el juego.

## Pendiente de comprobación en ejecución

No se ejecutó Game.exe ni Kirin en esta sesión. Antes de considerar certificada la jugabilidad:

- Cargar una partida existente, cambiar de mapa y guardar sin errores de tono/transición/ruta de guardado.
- Hablar con Volus en Hojaverde; entrar al portal de Puntaneva; recorrer Map2038 y los siete pisos, comprobando retornos.
- Ejecutar los combates automáticos previos y las seis fases de Arceus, pseudo-PC, rendición y captura final.
- En una instalación de la expansión completa, recorrer Falda → Gruta → Cumbre de Monte Silver y sus siete puertas Unown.
- Seguir `docs/QA_MANUAL_PLAYTEST.md` para el muestreo del resto de la expansión.

No marcar estos pasos como realizados sin una prueba real. El roadmap del editor es trabajo futuro y no forma parte del alcance del PR #10.
