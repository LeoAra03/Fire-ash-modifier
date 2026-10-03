# Depuración visual de rótulos — Dimensional Nightmare

## Alcance de esta pasada

Se inventariaron los **151 mapas compilados** del Dimensional Nightmare, incluidas la antesala y las cámaras de la Liga. La revisión visual detectó cinco tarjetas de título incrustadas sobre la escena: Map2073–Map2077 (EP03). La herramienta actúa sólo en esas bandas confirmadas; los otros 146 mapas quedan sin cambios. No se extrapolan los bloques oscuros de otros mapas porque pueden ser vacíos o sombras intencionales.

| Mapa | Filas cubiertas | Tratamiento |
|---|---:|---|
| 2073 | 2 | Sustituir la cabecera por textura de las filas 2–3 |
| 2074 | 2 | Sustituir la cabecera por textura de las filas 2–3 |
| 2075 | 3 | Sustituir la cabecera por textura de las filas 3–5 |
| 2076 | 2 | Sustituir la cabecera por textura de las filas 2–3 |
| 2077 | 3 | Sustituir la cabecera por textura de las filas 3–5 |

En vez de borrar filas o mover el mapa, el proceso añade variantes de tiles al PNG exclusivo de cada mapa y cambia solamente las celdas de arte de la cabecera. Cada variante copia los **flags de pasabilidad, prioridad y terreno de la celda que reemplaza**. No cambia el tamaño del mapa, el tileset asignado, las demás capas, las coordenadas/eventos ni las conexiones.

## Pipeline reproducible

```bash
npm run dn:polish          # aplica a los datos del juego y al paquete QA; genera renders de inspección
npm run dn:polish:verify   # verifica inventario, arte, eventos, dimensiones y flags por celda
```

La planilla versionada `content/dimensional_nightmare_map_polish.json` registra el inventario, las cinco bandas y las huellas originales usadas por la verificación. Los renders de inspección se generan bajo `docs/dn_referencia/detalle/` (carpeta temporal ignorada por Git). El respaldo local previo se guarda bajo `pokemon_fire_ash/PokeModBackups/dn_map_banner_cleanup_originals/` y no contiene partidas.

## Límites

Esta corrección elimina rótulos que tapaban el arte; **no es una reconstrucción integral de las geometrías** ni cambia la red de rutas. Las decisiones de rediseño de cuevas/montañas deben ser una pasada separada, con revisión de pasabilidad y conexiones antes de tocar sus tiles o eventos.
