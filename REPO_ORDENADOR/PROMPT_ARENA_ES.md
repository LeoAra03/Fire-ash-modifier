# Prompt reutilizable para Arena Agent Mode

Copia este prompt en Arena y reemplaza `[OBJETIVO CONCRETO]` por tu solicitud:

```text
Trabaja sobre el repositorio GitHub que está abierto o adjunto en esta sesión.

Antes de actuar, lee AGENTS.md y README.md. Sigue sus reglas. Si no puedes acceder a esos archivos o a la terminal, indícalo y usa solo las herramientas disponibles; no afirmes haber ejecutado comandos que no ejecutaste.

Haz una sola inspección inicial para entender el proyecto. Si tienes terminal, ejecuta desde la raíz:
1) python3 tools/repo_helper.py inventory .
2) python3 tools/repo_helper.py archives .
Resume brevemente el propósito del repo, sus puntos de entrada, documentación/manifiestos, recursos reutilizables y archivos comprimidos. Usa ese mapa y abre después solo los archivos pertinentes; evita volver a recorrer todo el repositorio sin una razón.

Objetivo concreto: [OBJETIVO CONCRETO]

Si el objetivo implica extraer archivos, usa el primer volumen de cada conjunto multipartes y un destino explícito; no extraigas encima de datos existentes ni borres los archivos originales. No ejecutes automáticamente scripts o programas encontrados dentro de archivos comprimidos.

Si implica ordenar el repositorio, inspecciona primero las referencias, imports, rutas y convenciones afectadas. Haz cambios mínimos, conserva recursos existentes y actualiza las referencias necesarias. No muevas ni renombres el repositorio completo sin explicarlo.

No crees archivos .ignore, .gitignore, .dockerignore ni otros archivos de exclusión salvo que yo lo pida expresamente. No dejes reportes, copias o archivos temporales en el repositorio. No borres cambios que ya existían.

Al terminar, informa: qué cambiaste o extrajiste, rutas de los resultados, verificaciones/pruebas ejecutadas, limitaciones (por ejemplo, volúmenes faltantes o falta de 7z/unrar) y confirma si quedaron temporales o archivos de exclusión nuevos.
```

## Ejemplos de objetivo concreto

- `Extrae el manual multipartes de ./recursos, revisa los documentos y prepara un resumen en español. Deja el contenido extraído en ./recursos/extraidos/manual solo si no existe ya.`
- `Ordena las imágenes existentes para la página de inicio. Primero identifica cuáles ya se usan; no dupliques ni renombres recursos sin actualizar sus referencias.`
- `Revisa la estructura del proyecto, usa los recursos disponibles y corrige el flujo de importación. Mantén intactos los cambios no relacionados.`
