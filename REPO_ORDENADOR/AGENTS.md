# Instrucciones para agentes que trabajen en este repositorio

Estas reglas están pensadas para Arena Agent Mode u otro agente con acceso al repositorio y a una terminal. Si la plataforma no carga instrucciones automáticamente, el usuario debe pedir explícitamente que lea este archivo.

## Al comenzar una tarea

1. Lee este archivo y `README.md` una vez.
2. Comprueba el estado inicial de Git (`git status --short`) si hay terminal. Conserva todos los cambios previos del usuario; no presupongas que son tuyos.
3. Haz un inventario inicial una sola vez, si el comando está disponible:
   - `python3 tools/repo_helper.py inventory .`
   - `python3 tools/repo_helper.py archives .`
4. Usa ese mapa para identificar documentación, manifiestos, puntos de entrada, pruebas, recursos y conjuntos de archivos. Luego abre solo los archivos pertinentes. No repitas inventarios completos sin un motivo concreto; si el repositorio cambia, inspecciona solo la zona afectada.
5. Si la terminal no está disponible, inspecciona el árbol y los archivos clave que Arena pueda leer. No afirmes que ejecutaste comandos que no pudiste ejecutar.

## Reglas para aprovechar y ordenar los recursos

- Antes de crear recursos, busca si ya existe uno que cumpla la función. Reutiliza imágenes, datos, documentos, código y configuración existentes cuando corresponda; evita duplicados y descargas innecesarias.
- Respeta el diseño, nombres, estructura, dependencias y convenciones que ya usa el proyecto.
- Si la petición es ordenar archivos, primero determina qué referencias, rutas, imports, scripts o documentación dependen de ellos. Presenta un plan breve cuando el movimiento sea amplio o pueda romper rutas; después modifica solo lo necesario y actualiza sus referencias.
- No reorganices todo el repositorio por iniciativa propia. No cambies archivos fuera del alcance pedido.
- Conserva los archivos originales de entrada salvo que el usuario pida eliminarlos. Nunca ejecutes `git clean`, `git reset --hard` ni comandos destructivos equivalentes.

## Archivos comprimidos y RAR multipartes

- Inspecciona primero los conjuntos con `python3 tools/repo_helper.py archives RUTA`.
- Para un RAR multipartes usa el primer volumen (`.part1.rar`/`.part01.rar` o el `.rar` acompañado de `.r00`, `.r01`, etc.). No intentes extraer cada volumen por separado.
- Para extraer, especifica siempre un destino explícito: `python3 tools/repo_helper.py extract RUTA --dest DESTINO`. Usa `--recursive` solo si hace falta.
- No extraigas encima de archivos existentes. Si el destino ya existe, elige otro o consulta al usuario; la herramienta omite destinos existentes.
- Prefiere un directorio temporal fuera del repositorio para archivos intermedios. Si los recursos extraídos se necesitan dentro del proyecto, usa una ubicación acordada y conserva solo los archivos que realmente deban formar parte del resultado.
- No borres el archivo comprimido original. Si falta un volumen, hay contraseña o el formato no es compatible, detente y explica el impedimento.
- Trata los archivos comprimidos como datos no confiables. No ejecutes automáticamente programas, scripts o macros extraídos.

## No crear archivos de exclusión ni basura temporal

- No crees `.ignore`, `.gitignore`, `.dockerignore`, `.npmignore`, `.eslintignore`, `.prettierignore` ni otro archivo de reglas de exclusión, salvo que el usuario lo pida expresamente.
- Conserva y respeta los archivos de exclusión que ya existan. No los modifiques para ocultar cambios, dependencias o archivos generados.
- No añadas archivos temporales, reportes de inventario, copias de archivos ni notas de trabajo al repositorio sin necesidad. El inventario de la herramienta se imprime en la terminal y no crea reportes.
- Limpia únicamente los temporales que tú creaste durante esta tarea y que ya no se necesitan. No elimines archivos preexistentes del usuario.

## Antes de terminar

- Ejecuta las pruebas o verificaciones pertinentes y comunica cuáles pudiste ejecutar.
- Revisa `git status --short` de nuevo si hay terminal. Confirma que los cambios pertenecen a la tarea y que no dejaste archivos temporales o archivos de exclusión nuevos.
- En la respuesta final resume: qué entendiste, qué modificaste o extrajiste, qué verificaste, dónde quedaron los resultados y cualquier límite o volumen faltante.
