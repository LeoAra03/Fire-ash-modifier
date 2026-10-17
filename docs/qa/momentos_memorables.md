# Momentos memorables — contrato de autoría (FASE 032)

## Definición operativa

Un **momento memorable** es una escena, decisión, espacio o combate que una
persona pueda recordar y describir en una frase sin spoilers, sin consultar una
guía y sin depender de leer un cartel opcional. Debe tener una acción o una
consecuencia visible; una caja de texto aislada, un cambio cosmético o una
estadística no bastan por sí solos.

La definición evita confundir volumen con calidad. El auditor puede enumerar
candidatos por señales textuales, pero no puede decidir si una escena se
recuerda diez minutos después: esa parte queda en revisión humana.

## Metas del bloque 3100–3199

- cinco momentos documentados y verificables por cada una de las siete
  regiones;
- tres por cada una de las cinco campañas;
- al menos un puzle o combate recordable por gimnasio;
- una idea central distinta y explicable en una frase por puzle;
- una respuesta propia de cada jefe a la estrategia dominante;
- una decisión de camino con consecuencia visible en cada ruta que hoy sea
  lineal;
- un suceso de ambiente no repetido en cada ciudad que hoy sea estática;
- un coste o recurso escaso en cada mazmorra plana;
- al menos un secreto por cada diez mapas que lo necesiten, descubrible sin
  guía y no obligatorio para terminar.

Estas son metas de revisión, no PASS automático. Un registro válido debe
conservar: ID de mapa/evento, frase sin spoilers, qué hace el jugador, qué
cambia, cómo se detectó, resultado de la prueba y regresión asociada.

## Plantilla de registro

```text
ID:
Región/campaña:
Mapa/evento:
Frase sin spoilers:
Acción del jugador:
Consecuencia visible:
Por qué no depende de cartel opcional/guía:
Prueba humana y fecha:
Resultado:
Regresión:
Estado: pendiente | aceptado | rediseñar
```

`tools/plan2700/lote7_fase032_resistencia.mjs` publica candidatos para iniciar
la revisión. Los candidatos no se cuentan como momentos aceptados.

## Límites de esta tanda

El checkout no contiene Game.exe, un dispositivo Android/Kirin, un mando ni
participantes nuevos. Por tanto, las ocho horas, mil transiciones, cien
combates, legibilidad, economía percibida, ritmo, curva de dificultad y
memoria siguen `manual_pending`. No se inventan tasas de descubrimiento,
capturas, duración ni opiniones de jugadores.

## Reproducción

```bash
node tools/plan2700/lote7_fase032_resistencia.mjs
node tools/plan2700/lote7_fase032_resistencia.mjs --verify
```
