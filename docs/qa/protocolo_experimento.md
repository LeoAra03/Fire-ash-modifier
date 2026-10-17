# Protocolo de experimento de juego (FASE 034)

Este protocolo distingue **verificar estructura** de **probar una hipótesis**.
No se cambia diseño porque una persona prefiera algo: antes de cambiar se
escribe qué se espera observar, cómo se medirá y qué decisión se tomará con
cada resultado.

## Reglas obligatorias

1. Escribir la hipótesis antes de tocar el mapa, texto, jefe, menú, sonido o
   recompensa.
2. Registrar una medición inicial y otra posterior con la misma versión,
   estado inicial, configuración y objetivo.
3. No pedir a la persona que pruebe el juego “bien”: se observa a una persona
   nueva y se registra dónde se atasca, qué recuerda y cuándo abandona.
4. Cinco participantes son una señal de diseño, no una validación estadística.
   Los resultados se describen como indicativos y deben repetirse con otro
   grupo independiente antes de convertirlos en regla.
5. La prueba puede hacerse sin conexión y no debe recoger nombre, correo,
   audio, vídeo ni identificadores del jugador. Solo se guarda una ficha
   anónima con observaciones del juego.
6. Se prueba el juego, no a la persona. El consentimiento debe decirlo antes
   de empezar y ofrecer abandonar sin consecuencias.
7. Un resultado negativo también es evidencia. Si el cambio no se replica, se
   revierte y se documentan la reversión y la regresión.
8. No se presentan capturas, duración, comprensión, miedo, satisfacción o tasa
   de descubrimiento que no se hayan observado realmente.

## Medidas

| Medida | Unidad | Definición |
|---|---|---|
| tiempo | segundos | Desde la instrucción hasta completar el objetivo; guardar mediana y rango. |
| atasco | eventos | Más de 120 segundos sin progreso ni decisión. |
| derrotas | cantidad | Derrotas contra el mismo jefe desde el mismo estado inicial. |
| abandono | mapa/minuto | Punto donde la persona deja de jugar o dice que no continuará. |
| comprensión | rúbrica 0–3 | Cinco minutos después: 0 nada, 1 detalle, 2 idea correcta, 3 objetivo y consecuencia correctos. |
| descubrimiento | cantidad | Hallazgos opcionales sin guía. |
| satisfacción | rúbrica 1–5 | Valoración acompañada siempre de un porqué, nunca aislada. |

## Ficha anónima

```text
Experimento y versión:
Hipótesis:
Estado inicial y mapa:
Configuración (PC/Android, resolución, mando/teclado):
Consentimiento leído: sí/no
Participante anónimo: P01/P02/...
Instrucción exacta:
Medición inicial:
Observaciones sin interpretar:
Medición final:
Respuesta de comprensión cinco minutos después:
Incidencias/abandono:
Decisión: mantener | cambiar | revertir | repetir
Regresión requerida:
```

## Consentimiento simple

> Esta prueba evalúa el juego, no a ti. Puedes parar cuando quieras. No
> guardaremos tu nombre ni datos personales; solo observaremos tiempos,
> atascos, derrotas, abandono y lo que recuerdes del juego. ¿Aceptas probarlo?

## Diseño de las 25 pruebas

El registro reproducible está en
`content/lote7_fase034_experimentos.json`. Incluye hipótesis, medidas,
muestra, decisión, resultado vacío y evidencia vacía para cada experimento:
dificultad, arranque del postgame, Atlas, identidad regional, emisiones, Team
Rocket, finales, progreso, economía, ritmo, exploración, puzles, noche,
menús, recompensas, diálogos, objetos, mochila, niveles, rejugabilidad, Liga,
requisito de entrada, mapas generados, dos escenas y dos curvas de dificultad.

La segunda ronda independiente y el cuadro antes/después se cierran en la fase
siguiente. Hasta que existan fichas observadas, el estado correcto es
`manual_pending`.

## Límites de plataforma

La paridad PC/Android/Kirin, mandos, lectura de pantalla, resolución, offline,
permisos y una sesión prolongada requieren el binario y el entorno. El
protocolo los prepara, pero no los certifica.

## Comandos

```bash
node tools/plan2700/lote7_fase034_experimentos.mjs
node tools/plan2700/lote7_fase034_experimentos.mjs --verify
```
