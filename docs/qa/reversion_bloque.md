# Prueba de reversión de un bloque de contenido

## Objetivo

Demostrar que un bloque se puede revertir sin arrastrar ni borrar los demás.
La prueba se hace sobre una copia temporal y nunca sobre una partida del
jugador. No se ejecuta `git reset --hard` ni se toca la rama operativa durante
la prueba.

## Procedimiento reproducible

1. Elegir un archivo de contenido pequeño y versionado, por ejemplo una copia
   de trabajo de `content/atlas_progress.json`, y registrar:

   ```bash
   git status --short
   git rev-parse HEAD
   cp content/atlas_progress.json /tmp/atlas_progress.before.json
   sha256sum content/atlas_progress.json
   ```

2. En una rama/copia temporal aplicar únicamente el commit del bloque que se
   quiere ensayar. El commit y el archivo elegido deben quedar anotados en el
   acta; no se mezclan cambios de otra fase.
3. Ejecutar el verificador del bloque y observar el cambio esperado.
4. Revertir solo ese commit en la copia temporal:

   ```bash
   git revert --no-edit <commit-del-bloque>
   sha256sum content/atlas_progress.json
   cmp content/atlas_progress.json /tmp/atlas_progress.before.json
   ```

5. Ejecutar de nuevo el verificador. La copia debe volver al resultado anterior
   y los archivos de fases ajenas deben conservar su hash.
6. Eliminar la copia temporal y confirmar que el árbol de la rama original no
   cambió:

   ```bash
   git status --short
   git diff --exit-code
   ```

## Acta de FASE 027

| Campo | Resultado |
|---|---|
| Bloque ensayado | pendiente de ejecutar en una copia Git aislada |
| Archivo de prueba | `content/atlas_progress.json` (candidato, no modificado) |
| Commit | se debe rellenar con el hash publicado |
| Verificador antes | `npm run verify:plan2700:mapas` |
| Verificador después | `npm run verify:plan2700:mapas` |
| Hash antes/después | se rellena con `sha256sum` |
| Archivos fuera del bloque | deben conservar sus hashes |
| Resultado | `pending_human_review` |

La auditoría estática de esta fase verifica que la receta, el archivo candidato
y los comandos existan. No declara realizada una reversión que requiere una
copia Git y una decisión humana sobre qué bloque probar.
