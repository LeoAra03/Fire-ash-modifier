# Guía de mantenimiento para una persona nueva

Esta guía describe el proyecto real, no una instalación idealizada. El juego
compilado está en `pokemon_fire_ash/`; los datos RPG Maker XP están en
`pokemon_fire_ash/Data/`, los gráficos en `Graphics/`, el audio en `Audio/` y
el código Ruby compilado en `Data/Scripts.rxdata`. Los planes declarativos
viven en `content/` y las herramientas reproducibles en `tools/`.

## 1. Preparar un clon sin tocar el original

```bash
git clone <URL-del-repositorio> fire-ash-modifier
cd fire-ash-modifier
npm ci
node tools/plan2700/lote6_fase027_cierre.mjs --verify
```

Las ROM invitadas y los backups locales no son requisitos del arranque normal.
No se copian ROMs al repositorio ni a los paquetes. Si se usa una herramienta
de extracción nativa, la fuente debe estar en una carpeta local ignorada y el
comando debe declarar esa carpeta explícitamente.

Antes de modificar:

```bash
git status --short
node tools/inventario_congelado.mjs --verify
```

No se trabaja sobre una partida del jugador. Para probar una instalación, se
usa una copia descartable del juego y se conserva `Save*.rxdata` aparte.

## 2. Añadir un mapa nuevo sin romper nada

1. Elige un ID libre consultando `docs/qa/politica_ids.md` y el inventario:

   ```bash
   node tools/inventario_congelado.mjs --verify
   ```

2. Añade el mapa y su entrada a `MapInfos.rxdata` mediante el editor o un
   generador existente; no edites el binario con un script ad hoc.
3. Declara entrada, salida, música, encuentros y límites en el catálogo de la
   familia correspondiente (`content/` o una ficha en `docs/qa/regiones/`).
4. Haz que cada llegada caiga en una celda transitable y comprueba autotiles,
   altura, colisión y eventos:

   ```bash
   npm run verify:mapas
   npm run verify:mapa_terminado:censo
   npm run verify:evento_terminado:censo
   ```

5. Si cambia una flag o variable, actualiza su nombre y la documentación de
   alcance; no reutilices un ID reservado de otra región.
6. Ejecuta los verificadores de la familia y después las pruebas generales.
7. Regenera el paquete solo al final. Los ZIP son salidas, no fuentes:

   ```bash
   npm run build:package
   npm run build:corregido:zip
   npm run verify:package
   npm run verify:corregido:zip
   ```

## 3. Añadir una región siguiendo el pipeline

Una región nueva necesita, como mínimo:

- rango de mapas y política de IDs;
- catálogo de mapas, entradas/salidas y tilesets;
- encuentros y especies válidas;
- entrenadores, jefes, recompensas y switches nombrados;
- diálogos revisados con el ancho de caja real;
- assets con nombres exactos y licencia/origen documentados;
- una ficha de revisión humana y un registro de pendientes.

El orden recomendado es **plan → contenido → auditoría estática → paquete →
playtest**. No se marca una región como terminada porque tenga mapas: el
verificador de mapas también exige entradas, salidas, música y la política de
encuentros. Después de instalar una región, ejecuta el bloque de comandos de
`docs/qa/mapa_conocimiento.md` y anota el resultado allí.

## 4. IDs libres y límites

Los rangos reservados y las solapaduras intencionadas están en
`tools/inventario_congelado.mjs` (`RANGES` y `RESERVED`). La fuente de verdad se
regenera con:

```bash
node tools/inventario_congelado.mjs
node tools/inventario_congelado.mjs --verify
```

No se adivina un ID libre mirando solo el nombre del archivo: `MapInfos`, el
rango de la región y el inventario congelado deben coincidir. Si se amplía un
rango, cambia primero la política y el verificador en el mismo commit.

## 5. Verificadores por bloque

| Bloque | Comandos principales |
|---|---|
| Salud del juego | `npm run verify:salud`, `npm run verify:boot`, `npm run verify:ruby:full` |
| Mapas/eventos | `npm run verify:mapas`, `npm run verify:mapa_terminado:censo`, `npm run verify:evento_terminado:censo` |
| Texto | `npm run verify:dialogos:queue`, `npm run verify:glosario`, `npm run verify:tone-safety` |
| Entrega | `npm run verify:package`, `npm run verify:corregido:zip`, `npm run verify:presupuesto` |
| Inventario | `node tools/inventario_congelado.mjs --verify` |
| FASE 027 | `npm run verify:plan2700:fase027` |
| Suite general | `npm test`, `npm run test:ui`, `npm run verify:all` |

La suite general puede requerir recortes DN no redistribuibles. Ese resultado
se documenta como pendiente; no se reemplaza la fuente ausente por un PNG
sintético.

## 6. Medir un cambio de diseño

Antes de rediseñar un mapa, texto, jefe, menú o recompensa escribe la hipótesis
y usa `docs/qa/protocolo_experimento.md`. Registra una medida antes y otra
después en `docs/qa/medidas_juego.md`; no presentes cinco participantes como
validación estadística y conserva también los resultados negativos. Si un
cambio no se replica, revierte el cambio y anota la regresión. La medición no
autoriza a ampliar el alcance ni a convertir una preferencia en defecto.

## 7. Restaurar cambios desde backup

Primero identifica si el daño es no commiteado, puntual o total:

```bash
git status --short
git restore pokemon_fire_ash/Data       # solo cambios no commiteados y conocidos
```

Para un instalador concreto sigue `docs/qa/rollback.md`: cada carpeta de
`PokeModBackups/` es local y contiene el estado anterior de los archivos que
ese instalador tocó. Para un snapshot completo, inspecciona y prueba el ZIP
antes de extraerlo a una carpeta temporal. Nunca copies una partida ni
`Game.rxdata` desde un backup al paquete de entrega. Después del rollback,
re-sincroniza y ejecuta el verificador del instalador.

## 8. Ejemplo completo, copiable y aislado

Este ejemplo no toca `pokemon_fire_ash/`, no modifica Git y deja su carpeta de
prueba como estaba. Crea una especificación mínima, la valida y la elimina:

```bash
set -eu
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/region-demo/content"
cat > "$TMP/region-demo/content/map.json" <<'JSON'
{"id":9901,"name":"Mapa de prueba","entrance":[1,1],"exit":{"map":9902,"cell":[1,1]},"tileset":"Demo"}
JSON
node -e 'const fs=require("fs"); const p=process.argv[1]; const x=JSON.parse(fs.readFileSync(p)); if(x.id!==9901||x.entrance.length!==2||x.exit.map!==9902) process.exit(1); console.log("demo OK")' "$TMP/region-demo/content/map.json"
test -f "$TMP/region-demo/content/map.json"
```

El comando demuestra el patrón seguro: una carpeta temporal, una entrada
válida, una verificación y limpieza por `trap`. No es una sustitución del
verificador del juego; es un ejemplo de autoría que se puede copiar sin
escribir fuera de la carpeta de prueba.

## 8. Cambios, regresión y publicación

Cada corrección debe tener un commit independiente, una prueba que fallaba
antes y un resultado después. Usa `docs/qa/defectos.md` para enlazar el ciclo.
Al publicar paquetes, ejecuta `node tools/plan2700/lote6_fase027_cierre.mjs`
y conserva el JSON generado junto al commit. El cierre humano (instalación,
playtest, Android/Kirin y revisión externa) se firma aparte; las herramientas
no pueden inventar esa firma.
