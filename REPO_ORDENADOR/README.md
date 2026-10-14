# Arena Repo Helper

Kit de instrucciones y herramientas para que un agente con acceso a un repositorio —por ejemplo, Arena Agent Mode— pueda entenderlo una vez, localizar sus recursos, revisar archivos comprimidos y trabajar con menos exploraciones repetidas.

**Esto no es un plugin que Arena detecte o instale automáticamente.** Coloca estos archivos en la raíz del repositorio de GitHub y, al abrir ese repo con Arena, usa el texto de `PROMPT_ARENA_ES.md` para indicarle que lea `AGENTS.md` y utilice la herramienta. Si Arena no tiene terminal en esa sesión, el prompt le pide que inspeccione los archivos disponibles y no finja haber ejecutado comandos.

El kit no incluye ningún archivo `.ignore` ni crea archivos de exclusión.

## Contenido

- `AGENTS.md`: reglas persistentes para el agente: inventariar una vez, reutilizar recursos, preservar cambios del usuario y evitar temporales y archivos `.ignore`.
- `PROMPT_ARENA_ES.md`: prompt listo para copiar y pegar en Arena Agent Mode.
- `tools/repo_helper.py`: utilidad de línea de comandos, sin dependencias de Python externas, para inventariar el proyecto, localizar archivos comprimidos y extraer ZIP/RAR/7z de forma explícita.
- `tests/test_repo_helper.py`: pruebas de detección y extracción segura de ZIP.

## Requisitos

- Python 3.10 o posterior para inventario y ZIP.
- Para abrir RAR o 7z, además se requiere `unrar`, `rar`, `7zz` o `7z` instalado en el sistema. El programa detecta el comando disponible; no incorpora un extractor propietario.
- ZIP simple se puede extraer con la biblioteca estándar de Python. ZIP multipartes requiere 7-Zip.

En Debian/Ubuntu, los nombres de paquetes varían según la versión. Algunos sistemas ofrecen `python3` y `p7zip-full`; otros, `7zip`/`7zz` o `unrar`.

## Uso desde una terminal

Desde la raíz del repositorio:

```bash
# Mapa breve del proyecto: estructura, archivos clave, extensiones y archivos comprimidos
python3 tools/repo_helper.py inventory .

# Buscar archivos comprimidos y agrupar volúmenes relacionados
python3 tools/repo_helper.py archives .

# Extraer todos los conjuntos de una carpeta en carpetas separadas
python3 tools/repo_helper.py extract ./descargas --dest /tmp/extraidos --recursive

# Extraer un conjunto RAR concreto: indica el primer volumen
python3 tools/repo_helper.py extract ./descargas/manual.part01.rar --dest /tmp/extraidos
```

Para guardar la extracción dentro del repositorio, elige deliberadamente un destino como `./recursos/extraidos`. La herramienta no sobrescribe un destino existente y conserva los archivos comprimidos originales. En caso de error, revisa la carpeta de salida parcial y el mensaje del extractor antes de volver a intentarlo.

La herramienta **no reorganiza ni mueve automáticamente el código del repositorio**: entrega un mapa y una extracción segura para que el agente aplique solo la organización solicitada, respetando referencias y convenciones del proyecto.

## Pruebas

```bash
python3 -m unittest discover -s tests -v
```

## En GitHub y Arena

1. Añade `AGENTS.md`, `README.md`, `PROMPT_ARENA_ES.md`, `tools/` y `tests/` a la raíz del repositorio.
2. Abre o conecta ese repositorio en Arena Agent Mode.
3. Copia el prompt de `PROMPT_ARENA_ES.md` y completa el objetivo concreto.

La disponibilidad de terminal y el acceso a un repo dependen de la sesión y de las herramientas habilitadas en Arena. Si Arena no puede ejecutar la utilidad, las instrucciones siguen sirviendo como lista de verificación, pero el agente deberá inspeccionar los archivos mediante las herramientas que tenga disponibles.
