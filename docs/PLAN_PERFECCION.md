# Plan de Perfección — fases 2701–3600

> **Qué es este documento.** Las tres partes anteriores (`PLAN_900_FASES.md`,
> `PLAN_1800_FASES.md`, `PLAN_2700_FASES.md`) planifican el trabajo. Este documento
> planifica **la garantía**: qué tiene que ser verdad, medido, para poder decir que el
> proyecto está cerrado. Y corrige, sobre las tres anteriores, los tres puntos débiles
> que se detectaron al medir: los umbrales de densidad como proxy de autoría, el
> playtest como trámite y la reserva fija de fases para defectos imprevistos.

---

## 1. "Perfecto" no se declara: se define

Un plan no puede prometer un juego perfecto. Sí puede fijar **cinco condiciones
medibles** y no cerrar hasta cumplirlas todas:

| # | Condición | Cómo se mide | Umbral |
|---|---|---|---|
| C1 | **Cobertura total** | unidades cubiertas / unidades censadas | **100 %** |
| C2 | **Cero defectos abiertos** | `docs/qa/defectos.md` | **0**, incluidos cosméticos |
| C3 | **Adversario limpio** | fuzz + límites + guardado interrumpido | **0 fallos** |
| C4 | **Juicio humano** | rondas de playtest ciego | **3 rondas con tasa de descubrimiento decreciente y la última en 0** |
| C5 | **Cero regresiones** | `npm run verify:all` tras cada corrección | **verde siempre** |

C1 es aritmética. C2 y C3 son ingeniería. **C4 es la única que no se puede automatizar**,
y por eso es la que decide si el proyecto está listo o solo está documentado como listo.

## 2. Cuántas fases son de verdad (medido, no estimado)

`node tools/plan900/cobertura.mjs` censa el proyecto y deriva el número:

```
CENSO  mapas 3.465 · eventos 36.147 · páginas 55.499 · comandos 444.284 · celdas 5.493.642
       switches 874 · variables 240 · gráficos 1.726 · BGM 105
       tablas de encuentro 340 con 3.329 slots

TOTAL 6.283.152 unidades de cobertura · 35.831 exigen ojo humano
1 fase = 150 unidades  →  ~41.888 fases de cobertura
con el coste del juicio humano  →  ~42.844 fases reales
```

**Conclusión honesta:** no son 500 000 fases ni 2 700. Son **~42 800**, y ese número no
lo elijo yo: sale del contenido y se recalcula solo cada vez que el contenido crece.

La razón de que no sean medio millón es que **una fase no es una comprobación**, es la
unidad de trabajo que **produce y archiva** ~150 comprobaciones. Las 6,28 millones de
comprobaciones son assertions que ejecutan los harnesses de las fases 2701–2820.

### Las 900 fases de este documento son las que se escriben a mano

Las otras ~39 000 son **derivadas**: el mismo comando emite la lista completa, una línea
por fase, en el formato de los tres documentos anteriores, cuando se le pide:

```bash
npm run cobertura          # censo, familias y total de fases — ya funciona
npm run cobertura:plan     # reescribe el listado completo de fases (42 633 líneas)
```

La emisión de las 42 633 líneas numeradas (una fase por cada 150 unidades de cobertura, en
el mismo formato de los tres documentos anteriores) es la **fase 2765** de este documento y
ya está construida: su salida vive en `docs/PLAN_COBERTURA_FASES.md`.

Por eso "no importa cuántas sean": el plan se **autoextiende** con el contenido. Lo que
hay que escribir a mano son los **sistemas** que hacen posible esa cobertura, y esos son
los seis bloques de abajo.

## 3. Hallazgo del propio medidor (defecto real, detectado al medir)

El censo encontró **3 archivos de mapa fuera de norma** en `Data/`:

- `Map341 2.rxdata` — **duplicado suelto con un espacio en el nombre** (copia de `Map341`).
- `Map813b.rxdata` — variante con sufijo no numérico.
- `MapInfos.rxdata` — no es un mapa (correcto, pero aparecía en el recuento bruto).

El juego los ignora, pero rompen cualquier herramienta que asuma `Map<dígitos>.rxdata`.
La fase 2837 los atiende. Que esto apareciera en la primera medición es el argumento
central de este documento: **lo que no se mide, no se sabe.**

## 4. Los seis bloques de este tramo

| Fases | Bloque | Para qué |
|---|---|---|
| 2701–2820 | 120 | Instrumentación | que la cobertura sea medible y archivada |
| 2821–3000 | 180 | Cobertura por unidad | las 6,28 M de comprobaciones, por familia |
| 3001–3140 | 140 | Fuzz, límites y adversario | romperlo a propósito antes que el jugador |
| 3141–3300 | 160 | Autoresía y juicio | que "denso" llegue a ser "bueno" |
| 3301–3480 | 180 | Experimentación de diseño | probar mecánicas, no solo verificarlas |
| 3481–3600 | 120 | Cierre por criterio | C1–C5 o no se cierra |

---
2701. Construir el harness de replay: un proceso headless que arranca el juego, carga una partida y ejecuta una secuencia de entradas sin ventana.
2702. Verificar que el harness de replay arranque en menos de lo que arranca el juego normal.
2703. Verificar que el harness de replay no escriba en las partidas reales del jugador.
2704. Verificar que el harness de replay pueda cargar partidas de cualquier punto del DLC.
2705. Construir el bot caminante con cuota: recorre el mapa entero y marca cada celda pisada.
2706. Verificar que el bot caminante cubra el 100 % de las celdas transitables de un mapa de prueba.
2707. Verificar que el bot caminante registre las celdas que no pudo alcanzar y su motivo.
2708. Verificar que el bot caminante detecte atascos y los reporte con coordenadas.
2709. Construir el ejecutor de eventos: activa cada evento según su disparador y comprueba que termina.
2710. Verificar que el ejecutor de eventos capture cualquier excepción con el mapa, el evento y el comando exacto.
2711. Verificar que el ejecutor de eventos no deje el juego bloqueado al fallar un evento.
2712. Verificar que el ejecutor de eventos recorra las páginas en orden de condición.
2713. Construir el oráculo de diálogos: compara cada texto contra el formato de caja del juego.
2714. Verificar que el oráculo de diálogos detecte caja vacía, tres líneas y desbordamiento.
2715. Verificar que el oráculo de diálogos detecte palabras cortadas y signos de apertura ausentes.
2716. Verificar que el oráculo de diálogos detecte cadenas en inglés sin traducir.
2717. Construir el inyector de estado: coloca la partida en cualquier combinación de progreso del DLC.
2718. Verificar que el inyector de estado funcione con las 2^18 combinaciones teóricas de progreso, muestreadas.
2719. Verificar que el inyector de estado no corrompa la partida al escribir los flags.
2720. Verificar que el inyector de estado permita probar cada final sin jugar las 40 horas previas.
2721. Construir el registro de cobertura: acumula qué celdas, eventos, diálogos y combates se han ejercitado.
2722. Verificar que el registro de cobertura se pueda fundir entre sesiones sin perder datos.
2723. Verificar que el registro de cobertura se pueda consultar por mapa, por región y por familia.
2724. Verificar que el registro de cobertura genere un informe legible de una página por región.
2725. Construir el comparador de fotogramas: captura pantalla por celda y detecta diferencias tras un cambio.
2726. Verificar que el comparador de fotogramas detecte una diferencia de un solo píxel.
2727. Verificar que el comparador de fotogramas no dé falsos positivos por animaciones cíclicas.
2728. Verificar que el comparador de fotogramas sirva para demostrar que un cambio no alteró nada más.
2729. Construir el oráculo de estado de partida: comprueba flags, contadores, objetos y equipo tras cada acción.
2730. Verificar que el oráculo de estado detecte objetos duplicados y medallas repetidas.
2731. Verificar que el oráculo de estado detecte contadores que se reinician sin motivo.
2732. Verificar que el oráculo de estado detecte flags a medio escribir tras una derrota.
2733. Construir el generador de rutas de entrada: produce secuencias de teclas para llegar a cualquier mapa.
2734. Verificar que el generador de rutas llegue a los 3 465 mapas desde el punto de partida del postgame.
2735. Verificar que el generador de rutas detecte mapas inalcanzables y los liste como defecto.
2736. Verificar que el generador de rutas no dependa de atajos de desarrollo ausentes en la entrega.
2737. Construir el medidor de escenas: cronometra cada escena y avisa de las que bloquean el control.
2738. Verificar que el medidor de escenas marque cualquier bloqueo superior a ocho segundos.
2739. Verificar que el medidor de escenas mida también las escenas de derrota y de victoria.
2740. Verificar que el medidor de escenas detecte bucles de espera encadenados.
2741. Construir el auditor de rendimiento por mapa: fotogramas por segundo, memoria y tiempo de carga.
2742. Verificar que el auditor de rendimiento registre cada mapa de la entrega en condiciones comparables.
2743. Verificar que el auditor de rendimiento marque los mapas por encima del presupuesto.
2744. Verificar que el auditor de rendimiento funcione también en Android con Kirin.
2745. Construir el capturador de excepciones del motor: registra cada error con su pila y su contexto.
2746. Verificar que el capturador registre el mapa, el evento y el comando de cada excepción.
2747. Verificar que el capturador no altere el comportamiento del juego al activarse.
2748. Verificar que el capturador permita reproducir exactamente el fallo registrado.
2749. Construir el comparador de partidas: detecta qué cambió entre dos guardados equivalentes.
2750. Verificar que el comparador de partidas detecte un objeto de más o una bandera de menos.
2751. Verificar que el comparador de partidas sirva para demostrar que dos rutas equivalentes dan el mismo estado.
2752. Verificar que el comparador de partidas detecte corrupción silenciosa del archivo.
2753. Construir el verificador de idempotencia: aplica dos veces cada instalador y compara.
2754. Verificar que ningún instalador del proyecto cambie nada en su segunda aplicación.
2755. Verificar que el verificador de idempotencia cubra los 171 scripts de herramientas del repositorio.
2756. Verificar que el verificador de idempotencia archive el antes y el después de cada prueba.
2757. Construir el detector de archivos fuera de norma en `Data/` y sus variantes.
2758. Verificar que el detector liste `Map341 2.rxdata`, `Map813b.rxdata` y cualquier variante futura.
2759. Verificar que el detector compruebe que cada `Map<dígitos>.rxdata` tenga su entrada en `MapInfos`.
2760. Verificar que el detector compruebe que cada entrada de `MapInfos` tenga su archivo.
2761. Construir el auditor de recursos referenciados y ausentes en todas las familias.
2762. Verificar que el auditor cubra gráficos de personaje, battlers, iconos, BGM y SE.
2763. Verificar que el auditor cubra también las referencias desde scripts y no solo desde mapas.
2764. Verificar que el auditor ignore los recursos que el juego resuelve por fallback documentado.
2765. Construir el emisor de fases de cobertura: convierte el censo en la lista numerada de fases.
2766. Verificar que el emisor produzca el mismo listado en dos ejecuciones consecutivas.
2767. Verificar que el emisor numere desde la última fase publicada sin repetir ni saltar.
2768. Verificar que el emisor marque cada fase con su familia, su unidad y su verificador.
2769. Verificar que el emisor pueda filtrar por región para trabajar solo un bloque.
2770. Verificar que el emisor pueda marcar las fases ya cumplidas leyendo el registro de cobertura.
2771. Verificar que el emisor reduzca el listado a las fases pendientes sin perder la numeración.
2772. Verificar que el emisor estime el tiempo restante con el ritmo real medido.
2773. Añadir `npm run cobertura` al `package.json` para consultar el estado en un comando.
2774. Añadir `npm run cobertura:plan` para regenerar el listado completo.
2775. Añadir `npm run cobertura:check` para fallar si la cobertura baja respecto al último registro.
2776. Verificar que los tres comandos funcionen en un clon limpio sin el juego descargado.
2777. Verificar que los tres comandos no escriban nada fuera de `docs/plan_generado/` y `content/`.
2778. Añadir el registro de cobertura a la CI con umbral mínimo creciente por bloque.
2779. Verificar que la CI falle si un bloque baja de su umbral de cobertura.
2780. Verificar que la CI publique el informe de cobertura como artefacto descargable.
2781. Construir el panel local de cobertura: una página que muestra el avance por familia y región.
2782. Verificar que el panel se lea sin conexión y sin dependencias externas.
2783. Verificar que el panel muestre las cifras del último registro y su fecha.
2784. Verificar que el panel distinga cobertura automática de cobertura con juicio humano.
2785. Verificar que el panel liste los diez mapas con menos cobertura para atacarlos primero.
2786. Verificar que el panel liste los diez defectos abiertos más antiguos.
2787. Verificar que el panel quepa en una página sin desplazamiento en pantalla pequeña.
2788. Escribir la guía de uso de la instrumentación en `docs/qa/harnesses.md`.
2789. Verificar que la guía permita a alguien ajeno ejecutar un harness sin ayuda.
2790. Verificar que la guía explique qué hacer con cada tipo de fallo que reporta cada harness.
2791. Verificar que la guía incluya un ejemplo completo de fallo encontrado y corregido.
2792. Verificar que la guía no dependa de conocimiento previo del proyecto.
2793. Probar la instrumentación completa sobre un mapa de prueba descartable.
2794. Verificar que la instrumentación detecte un fallo sembrado a propósito en el mapa de prueba.
2795. Sembrar cinco fallos distintos: warp roto, caja vacía, flag sin lector, colisión mal puesta y recurso ausente.
2796. Verificar que la instrumentación detecte los cinco fallos sembrados sin falsos positivos.
2797. Verificar que la instrumentación no reporte ningún fallo en un mapa sano de control.
2798. Documentar la prueba de detección en `docs/qa/harnesses_prueba.md` con los cinco casos.
2799. Medir el coste de ejecutar la instrumentación completa sobre los 3 465 mapas.
2800. Verificar que ese coste quepa en una noche de ejecución desatendida.
2801. Verificar que la instrumentación se pueda reanudar tras un corte sin repetir trabajo.
2802. Verificar que la instrumentación guarde su progreso de forma atómica.
2803. Verificar que la instrumentación pueda correr en paralelo sin pisarse archivos.
2804. Verificar que la instrumentación no consuma más memoria de la disponible en el contenedor.
2805. Dividir el trabajo por rangos de mapa para que nunca se pierda todo por un fallo.
2806. Verificar que cada rango de mapa deje su propio registro parcial.
2807. Verificar que los registros parciales se fundan en un registro único al terminar.
2808. Verificar que el registro único sea reproducible desde los parciales.
2809. Verificar que el registro no crezca sin control cuando se repita la ejecución.
2810. Verificar que el registro se pueda versionar en Git sin superar el tamaño permitido.
2811. Verificar que el registro no incluya datos personales ni rutas del equipo.
2812. Verificar que el registro no incluya archivos de partida ni contenido del jugador.
2813. Verificar que el registro se pueda publicar como evidencia del cierre.
2814. Verificar que el registro incluya la fecha, la versión y el hash del estado medido.
2815. Verificar que el registro sirva para demostrar que la cobertura no bajó entre versiones.
2816. Verificar que la instrumentación sobreviva a un mapa corrupto sin abortar el resto.
2817. Verificar que la instrumentación reporte el mapa corrupto como defecto en lugar de ignorarlo.
2818. Verificar que la instrumentación funcione con el juego completo y con el paquete exportado.
2819. Verificar que la instrumentación funcione sin las ROMs invitadas presentes.
2820. Cerrar el bloque de instrumentación con la cobertura siendo una cifra que cualquiera puede recalcular.
2821. Cubrir el checklist de diez puntos en los 3 465 mapas: 34 650 comprobaciones archivadas.
2822. Verificar que la cobertura del checklist llegue al 100 % y no a una muestra.
2823. Verificar que cada fallo del checklist quede con su mapa, su punto y su coordenada.
2824. Cubrir la ejecución del evento en su página inicial en los 36 147 eventos.
2825. Cubrir la ejecución del evento en su página final, con el estado ya avanzado.
2826. Verificar que las 36 147 ejecuciones no dejen ni un evento sin ejercitar.
2827. Verificar que ningún evento deje el juego en un estado distinto al de partida entre visitas.
2828. Cubrir la salida garantizada de cada evento: toda rama acaba con control devuelto.
2829. Verificar que ningún evento pueda dejar el control bloqueado por una rama no prevista.
2830. Verificar que ningún evento automático se vuelva a disparar al reentrar en el mapa.
2831. Verificar que ningún evento paralelo escriba un flag mientras otro evento lo lee.
2832. Cubrir los 143 085 comandos de diálogo: mostrados, medidos y comparados con el formato.
2833. Verificar que ningún diálogo quede sin mostrar en la cobertura.
2834. Verificar que ningún diálogo se muestre fuera de su contexto previsto.
2835. Verificar que ningún diálogo se trunque por longitud en ninguna resolución soportada.
2836. Verificar que ningún diálogo dependa de una variable que pueda estar vacía.
2837. Atender los 3 archivos de mapa fuera de norma detectados por el censo.
2838. Decidir y documentar el destino de `Map341 2.rxdata`, `Map813b.rxdata` y sus hermanos futuros.
2839. Verificar que retirarlos no rompa ninguna referencia en `MapInfos` ni en `map_metadata`.
2840. Verificar que el recuento bruto y el recuento real de mapas coincidan después de la limpieza.
2841. Cubrir las 10 416 elecciones con cada rama tomada al menos una vez.
2842. Verificar que ninguna elección tenga una rama inalcanzable.
2843. Verificar que ninguna elección pueda quedar sin resolver y bloquear el evento.
2844. Verificar que ninguna elección tenga más opciones de las que caben en pantalla.
2845. Cubrir las 33 862 condiciones en verdadero y en falso.
2846. Verificar que ninguna condición sea siempre verdadera o siempre falsa por error de dato.
2847. Verificar que ninguna condición dependa de un switch que nunca se escribe.
2848. Verificar que ninguna condición dependa de una variable sin escritor.
2849. Cubrir los 874 switches en sus dos estados, con y sin partida avanzada.
2850. Verificar que ningún switch quede sin escribir en ninguna ruta de juego.
2851. Verificar que ningún switch quede sin leer en ningún punto del juego.
2852. Verificar que ningún switch se pueda quedar encendido de una dimensión al volver al mundo.
2853. Verificar que ningún switch del DLC se apague por cargar una partida guardada.
2854. Cubrir las 240 variables en sus valores límite: cero, típico y máximo.
2855. Verificar que ninguna variable pueda desbordar su rango previsto.
2856. Verificar que ninguna variable pueda tomar un valor que rompa una comparación.
2857. Verificar que ningún contador se reinicie al morir el jugador.
2858. Verificar que ningún contador se reinicie al cambiar de mapa.
2859. Cubrir los 16 968 self-switches en sus dos estados por evento y letra.
2860. Verificar que ningún self-switch se use como bandera global.
2861. Verificar que ningún self-switch quede activado de forma permanente por error.
2862. Verificar que ninguna página dependa de un self-switch que ningún evento escribe.
2863. Cubrir las 38 128 transferencias en ambos sentidos, comprobando la celda de llegada.
2864. Verificar que las 19 064 transferencias tengan su vuelta declarada.
2865. Verificar que ninguna celda de llegada sea sólida, con techo o fuera de rango.
2866. Verificar que ninguna transferencia cruce a un mapa fuera de la reserva declarada.
2867. Verificar que ninguna transferencia deje al jugador mirando a una pared.
2868. Verificar que ninguna transferencia dispare un combate sin diálogo previo.
2869. Cubrir los 680 combates de evento con su equipo, su derrota y su recompensa.
2870. Verificar que cada combate declarado tenga su entrenador existente en `trainers.dat`.
2871. Verificar que cada combate de jefe permita perder y reintentar.
2872. Verificar que cada combate de jefe no borre progreso al perder.
2873. Verificar que cada combate con recompensa entregue el objeto una sola vez.
2874. Verificar que ningún combate use una especie fuera de `species.dat`.
2875. Cubrir las 8 444 rutinas de movimiento hasta su completitud.
2876. Verificar que ninguna rutina atraviese una pared, un warp o un borde de mapa.
2877. Verificar que ninguna rutina se quede atascada contra un obstáculo.
2878. Verificar que ninguna rutina pueda empujar al jugador a una celda no prevista.
2879. Cubrir las 7 838 esperas midiendo su duración real y su efecto en el control.
2880. Verificar que ninguna espera encadenada supere el presupuesto de escena.
2881. Verificar que ninguna espera se pueda quedar colgada si el evento se interrumpe.
2882. Verificar que ninguna espera dependa de un fotograma que nunca llega.
2883. Cubrir los 38 996 comandos de script de evento ejecutándolos y capturando excepciones.
2884. Verificar que ninguna llamada de script apunte a un método que no existe.
2885. Verificar que ninguna llamada de script escriba fuera de su ámbito previsto.
2886. Verificar que ninguna llamada de script dependa de un objeto que pueda ser nulo.
2887. Verificar que ninguna llamada de script se ejecute antes de que el juego esté listo.
2888. Cubrir las 5 493 642 celdas comprobando transitabilidad, altura y autotile.
2889. Verificar que ninguna celda transitable sea inalcanzable desde la entrada del mapa.
2890. Verificar que ninguna celda sólida aislada quede rodeada de transitable.
2891. Verificar que ninguna celda de hierba alta quede inalcanzable o dentro de una pared.
2892. Verificar que ninguna celda de agua navegable quede sin salida a tierra.
2893. Verificar que ninguna celda con escalera tenga la colisión desalineada del dibujo.
2894. Verificar que ninguna celda tenga un autotile que no exista en su tileset.
2895. Verificar que ninguna celda use un tile de un tileset distinto al declarado en el mapa.
2896. Cubrir las 340 tablas de encuentro y sus 3 329 slots.
2897. Verificar que cada slot de encuentro tenga una especie válida y un nivel dentro de rango.
2898. Verificar que ninguna tabla de encuentro del DLC pise una tabla original.
2899. Verificar que ninguna tabla quede sin usar por un mapa sin terreno compatible.
2900. Verificar que ninguna tabla tenga probabilidades que no sumen lo previsto.
2901. Cubrir los 1 726 gráficos de personaje referenciados, comprobando que existen.
2902. Verificar que ningún gráfico referenciado tenga el nombre con mayúsculas incorrectas.
2903. Verificar que ningún gráfico referenciado tenga un tamaño distinto al estándar de su uso.
2904. Verificar que ningún charset referenciado tenga transparencia falsa.
2905. Cubrir las 105 pistas de música referenciadas, comprobando que existen y suenan.
2906. Verificar que ninguna pista referenciada esté corrupta o a cero bytes.
2907. Verificar que ninguna pista se corte en seco al cambiar de mapa.
2908. Verificar que ninguna pista se reinicie al reentrar en el mismo mapa.
2909. Cubrir los recursos de batalla: battlers, iconos, fondos y transiciones.
2910. Verificar que cada battler referenciado exista con su nombre exacto.
2911. Verificar que cada icono de objeto referenciado sea el correcto y no otro prestado.
2912. Verificar que cada fondo de batalla referenciado se dibuje sin tapar la interfaz.
2913. Cubrir los textos de interfaz: menús, avisos, confirmaciones y errores.
2914. Verificar que ningún texto de interfaz muestre identificadores internos.
2915. Verificar que ningún texto de interfaz se salga de su caja.
2916. Verificar que ningún texto de interfaz quede en otro idioma.
2917. Cubrir las pantallas nuevas del DLC una por una en cada resolución soportada.
2918. Verificar que ninguna pantalla nueva tape información necesaria en pantalla pequeña.
2919. Verificar que ninguna pantalla nueva se pueda abrir durante un combate.
2920. Verificar que ninguna pantalla nueva deje el juego en pausa permanente al cerrarse.
2921. Cubrir el mapa de vuelo y los puntos de teletransporte nuevos.
2922. Verificar que ningún destino de vuelo caiga en celda sólida.
2923. Verificar que ningún mapa nuevo rompa la lista de destinos de vuelo.
2924. Verificar que ningún destino nuevo esté disponible antes de ser visitado.
2925. Cubrir los movimientos de campo en cada región nueva: corte, surf, fuerza, destello y los demás.
2926. Verificar que cada movimiento de campo funcione sin medallas donde el DLC lo permita.
2927. Verificar que ningún movimiento de campo permita salir de los límites del mapa.
2928. Verificar que ningún movimiento de campo rompa una colisión al usarse sobre un warp.
2929. Cubrir la pesca en cada cuerpo de agua nuevo.
2930. Verificar que la pesca nueva use la tabla de encuentros correcta.
2931. Verificar que la pesca no se pueda usar donde no hay agua navegable.
2932. Verificar que la pesca no rompa la animación del jugador al cancelar.
2933. Cubrir el ciclo de día y noche en cada ciudad nueva.
2934. Verificar que ninguna escena nueva sea imposible de ver por culpa de la hora.
2935. Verificar que el ciclo se desactive en interiores y en las dimensiones que no lo llevan.
2936. Verificar que el ciclo no afecte a los mapas originales de Fire Ash.
2937. Cubrir el clima de cada mapa nuevo y su restauración al salir.
2938. Verificar que ningún clima se arrastre de un mapa a otro.
2939. Verificar que ningún clima tape la interfaz ni la caja de diálogo.
2940. Verificar que ningún clima se quede activo tras una derrota.
2941. Cubrir las cinemáticas nuevas una por una, con su tono y su restauración.
2942. Verificar que ninguna cinemática deje la pantalla teñida al terminar.
2943. Verificar que ninguna cinemática deje el control bloqueado al terminar.
2944. Verificar que ninguna cinemática se pueda disparar dos veces seguidas.
2945. Cubrir las escenas de derrota de cada jefe del DLC.
2946. Verificar que ninguna derrota deje al jugador en un mapa sin salida.
2947. Verificar que ninguna derrota borre objetos, medallas o contadores.
2948. Verificar que ninguna derrota escriba un flag que debía escribirse solo al ganar.
2949. Cubrir las escenas de victoria de cada jefe del DLC.
2950. Verificar que ninguna victoria entregue la recompensa antes de terminar el diálogo.
2951. Verificar que ninguna victoria se pueda interrumpir dejando el flag a medias.
2952. Verificar que ninguna victoria deje la música del combate sonando.
2953. Cubrir los finales: el de cada región, el de cada campaña y el del juego.
2954. Verificar que cada final se pueda alcanzar desde el estado previsto.
2955. Verificar que ningún final deje el juego en un estado sin retorno.
2956. Verificar que ningún final prometa contenido inexistente.
2957. Cubrir los treinta y dos estados del resumen de progreso del hub.
2958. Verificar que cada estado muestre un texto coherente y no una plantilla rota.
2959. Verificar que el resumen se actualice al instante tras cada hito.
2960. Verificar que el resumen se restaure correctamente al cargar cualquier partida.
2961. Cubrir la bandeja de medallas con las cuarenta y ocho medallas del DLC.
2962. Verificar que ninguna medalla se muestre duplicada ni con hueco.
2963. Verificar que ninguna medalla se pueda obtener dos veces.
2964. Verificar que la bandeja se lea bien en pantalla pequeña.
2965. Cubrir los diplomas con sus condiciones exactas de entrega.
2966. Verificar que ningún diploma se pueda obtener sin cumplir su condición.
2967. Verificar que ningún diploma se pueda obtener dos veces.
2968. Verificar que los diplomas se registren en el menú del jugador.
2969. Cubrir los atavíos de Ash con su desbloqueo, su uso y su reversión.
2970. Verificar que ningún atavío se pueda activar antes de su desbloqueo.
2971. Verificar que ningún atavío rompa surf, buceo, pesca ni batalla.
2972. Verificar que el atavío secreto exija el 100 % del contenido extra.
2973. Cubrir los Pokégods y sus tres formas con su captura y su huida.
2974. Verificar que la forma BETA no permita huir y que eso esté avisado.
2975. Verificar que la forma OMEGA sea shiny y se distinga del resto.
2976. Verificar que ninguna forma se pueda obtener antes del postgame.
2977. Cubrir los objetos ocultos del DLC con su celda y su unicidad.
2978. Verificar que ningún objeto oculto esté en celda intransitable.
2979. Verificar que ningún objeto oculto se pueda recoger dos veces.
2980. Verificar que ningún objeto oculto entregue un objeto inexistente.
2981. Cubrir las tiendas nuevas con su stock y sus precios.
2982. Verificar que ningún stock venda objetos de otra etapa a precio erróneo.
2983. Verificar que ningún objeto se pueda vender por más de lo que cuesta.
2984. Verificar que ninguna tienda quede inaccesible tras un cambio de historia.
2985. Cubrir la economía: dinero máximo, objetos vendidos y compras masivas.
2986. Verificar que el jugador no pueda quedar sin dinero para progresar.
2987. Verificar que ningún jefe exija un objeto comprable que no esté disponible.
2988. Verificar que ninguna misión se pueda bloquear por falta de dinero.
2989. Cubrir los servicios de curación de cada hub y de cada región nueva.
2990. Verificar que ningún jefe quede a más de un mapa de una curación.
2991. Verificar que la curación no se pueda usar durante un combate de historia.
2992. Verificar que la curación restaure también el estado de los Pokémon acompañantes.
2993. Cubrir el guardado en cada mapa del DLC.
2994. Verificar que se pueda guardar en el 100 % de los mapas nuevos.
2995. Verificar que el guardado no crezca sin control por los contadores nuevos.
2996. Verificar que ninguna partida guardada quede ilegible tras una actualización.
2997. Verificar que el tamaño del archivo de partida se mantenga en un rango previsible.
2998. Verificar que el guardado funcione igual en PC, en Android y desde el paquete exportado.
2999. Verificar que el registro de cobertura demuestre el 100 % de las familias anteriores.
3000. Cerrar el bloque de cobertura por unidad con las 6,28 M de comprobaciones ejercitadas y archivadas.
3001. Abrir el bloque del adversario: romper el juego a propósito antes de que lo haga un jugador.
3002. Definir el modelo de caos del proyecto: qué se muta, con qué semilla y qué invariantes deben sobrevivir.
3003. Escribir los invariantes intocables: ninguna mutación puede dejar una partida inutilizable.
3004. Escribir los invariantes intocables: ninguna mutación puede corromper un guardado real.
3005. Escribir los invariantes intocables: ninguna mutación puede escribir fuera de la copia de prueba.
3006. Montar una copia de trabajo aislada para el fuzz y verificar que el original no se toca.
3007. Verificar que la copia aislada se pueda reconstruir desde el original en un minuto.
3008. Fuzzing 1: mutar la tabla de tiles de un mapa y comprobar que el juego no se cuelga.
3009. Fuzzing 2: mutar un warp a una celda sólida y comprobar que el juego reporta y sigue.
3010. Fuzzing 3: mutar un identificador de recurso gráfico y comprobar el comportamiento previsto.
3011. Fuzzing 4: mutar un identificador de música y comprobar que el juego avisa y no se cae.
3012. Fuzzing 5: mutar el nombre de un entrenador y comprobar el comportamiento previsto.
3013. Fuzzing 6: truncar un archivo de mapa y comprobar que el juego no arranca roto en silencio.
3014. Fuzzing 7: duplicar un evento en la misma celda y comprobar el comportamiento previsto.
3015. Fuzzing 8: borrar un evento referenciado por otro y comprobar el comportamiento previsto.
3016. Fuzzing 9: mutar una condición a un switch inexistente y comprobar el comportamiento previsto.
3017. Fuzzing 10: mutar una variable a un valor imposible y comprobar el comportamiento previsto.
3018. Ejecutar 20 000 semillas de fuzz de eventos y verificar que ninguna deja el juego colgado.
3019. Ejecutar 50 000 mutaciones de celdas y verificar que ninguna rompe los invariantes.
3020. Registrar cada mutación que provoque un fallo con su semilla exacta para reproducirla.
3021. Clasificar cada fallo de fuzz: fallo del juego, fallo del mutador o comportamiento aceptable.
3022. Corregir los fallos del juego que el fuzz haya encontrado.
3023. Corregir los fallos del mutador que produzcan falsos positivos.
3024. Documentar los comportamientos aceptables del fuzz para no volver a investigarlos.
3025. Verificar que el fuzz no encuentre ningún fallo nuevo tras las correcciones.
3026. Repetir el fuzz con una semilla distinta para confirmar que no fue suerte.
3027. Repetir el fuzz con la misma semilla y verificar que dé exactamente el mismo resultado.
3028. Guardar el registro del fuzz como evidencia del cierre.
3029. Abrir las pruebas de límite: mochila llena al máximo.
3030. Verificar que el juego se comporte correctamente con la mochila al límite.
3031. Abrir las pruebas de límite: caja de Pokémon llena al máximo.
3032. Verificar que capturar con la caja llena no rompa la escena de captura.
3033. Abrir las pruebas de límite: equipo de seis Pokémon y captura con equipo lleno.
3034. Verificar que el juego ofrezca la opción correcta y no pierda al Pokémon capturado en silencio.
3035. Abrir las pruebas de límite: dinero en el máximo representable.
3036. Verificar que ninguna compra o venta desborde el contador de dinero.
3037. Abrir las pruebas de límite: 999 unidades del mismo objeto.
3038. Verificar que usar o vender ese objeto no descuadre el inventario.
3039. Abrir las pruebas de límite: nivel máximo permitido por el juego.
3040. Verificar que un Pokémon al nivel máximo siga ganando experiencia sin desbordar.
3041. Abrir las pruebas de límite: nombre del jugador vacío.
3042. Verificar que el juego no muestre un nombre vacío en los diálogos.
3043. Abrir las pruebas de límite: nombre del jugador con la longitud máxima.
3044. Verificar que el nombre largo no desborde ninguna caja de diálogo ni menú.
3045. Abrir las pruebas de límite: nombre del jugador con caracteres especiales.
3046. Verificar que los caracteres especiales no rompan el guardado ni el render.
3047. Abrir las pruebas de límite: nombre de un Pokémon con longitud máxima.
3048. Verificar que el apodo largo no rompa las cajas del combate.
3049. Abrir las pruebas de límite: cero Pokémon sanos en el equipo.
3050. Verificar que el juego despierte al jugador en el lugar correcto cada vez.
3051. Verificar que despertar tras una derrota no lo deje en un mapa del DLC sin salida.
3052. Verificar que despertar no le haga perder progreso del DLC ya hecho.
3053. Abrir las pruebas de corte: cerrar el juego durante un guardado.
3054. Ejecutar 500 puntos de corte distintos durante el guardado y verificar que siempre quede una partida válida.
3055. Verificar que el juego avise si el guardado anterior quedó dañado.
3056. Verificar que exista una segunda copia del guardado anterior en el peor caso.
3057. Abrir las pruebas de corte: cerrar el juego durante una transferencia de mapa.
3058. Verificar que al reabrir el jugador no aparezca en una celda sólida.
3059. Abrir las pruebas de corte: cerrar el juego durante una cinemática.
3060. Verificar que reabrir no deje el control bloqueado ni el tono de pantalla teñido.
3061. Abrir las pruebas de corte: cerrar el juego durante un combate de historia.
3062. Verificar que reabrir coloque al jugador antes del combate y no a mitad.
3063. Abrir las pruebas de corte: apagar el equipo durante un guardado.
3064. Verificar que el guardado sea atómico y no deje un archivo a medias.
3065. Abrir las pruebas de corte: quedarse sin espacio en disco al guardar.
3066. Verificar que el juego avise y no borre el guardado anterior.
3067. Abrir las pruebas de corte: tarjeta de memoria retirada durante el guardado.
3068. Verificar el mismo comportamiento que sin espacio, sin mensajes confusos.
3069. Abrir las pruebas de corte: archivo de partida corrupto a propósito.
3070. Verificar que el juego lo detecte y ofrezca la copia anterior.
3071. Abrir las pruebas de corte: archivo de partida de una versión anterior.
3072. Verificar que cargue y se adapte sin perder el progreso reconocible.
3073. Abrir las pruebas de corte: archivo de partida de una versión futura.
3074. Verificar que el juego avise en lugar de intentar cargarlo y romperse.
3075. Verificar que el jugador pueda recuperar su partida siguiendo el protocolo documentado.
3076. Abrir las pruebas de interferencia: abrir el menú durante una cinemática.
3077. Verificar que el menú se bloquee donde debe y se permita donde debe.
3078. Abrir las pruebas de interferencia: abrir el menú durante un combate.
3079. Verificar que la mochila en combate funcione con la libertad declarada y sin efectos raros.
3080. Abrir las pruebas de interferencia: usar un movimiento de campo sobre una celda de warp.
3081. Verificar que el warp no se dispare en un momento incorrecto.
3082. Abrir las pruebas de interferencia: hablar con un NPC mientras otro evento corre.
3083. Verificar que dos eventos no escriban el mismo flag a la vez.
3084. Abrir las pruebas de interferencia: montar y desmontar la bicicleta en un mapa nuevo.
3085. Verificar que la velocidad y las animaciones se restauren correctamente.
3086. Abrir las pruebas de interferencia: surfear hasta un borde de mapa.
3087. Verificar que el jugador no pueda salir del mapa ni quedar atrapado en el borde.
3088. Abrir las pruebas de interferencia: usar teletransporte a un mapa del DLC.
3089. Verificar que el mapa de destino exista y la celda sea válida.
3090. Abrir las pruebas de interferencia: cambiar de atavío a mitad de una misión.
3091. Verificar que la misión no dependa del atavío puesto en ese instante.
3092. Abrir las pruebas de interferencia: quitarse el disfraz dentro de la base de Rocket.
3093. Verificar que la alerta resultante se pueda resolver sin reiniciar el juego.
3094. Abrir las pruebas de interferencia: entrar en una emisión con el disfraz puesto.
3095. Verificar que el disfraz no tenga efecto fuera de su contexto.
3096. Abrir las pruebas de interferencia: intentar entrar en la Liga Oscura con sellos incompletos.
3097. Verificar que la entrada se bloquee con un mensaje que diga qué falta.
3098. Abrir las pruebas de interferencia: intentar zarpar sin haber activado el postgame.
3099. Verificar que el barco no mueva al jugador y explique el motivo.
3100. Abrir las pruebas de interferencia: usar el portal de Arceus sin las Tablas.
3101. Verificar que el portal se comporte según el canon documentado y no de forma ambigua.
3102. Abrir las pruebas de estrés: ocho horas de juego continuo sin reiniciar.
3103. Verificar que no haya fuga de memoria apreciable en ocho horas.
3104. Verificar que la música siga sincronizada tras ocho horas.
3105. Verificar que el guardado siga funcionando tras ocho horas.
3106. Verificar que las transiciones no se degraden con el uso prolongado.
3107. Abrir las pruebas de estrés: mil transiciones de mapa seguidas.
3108. Verificar que mil transiciones no dejen recursos acumulados sin liberar.
3109. Abrir las pruebas de estrés: cien combates seguidos.
3110. Verificar que cien combates no ralenticen el juego de forma acumulativa.
3111. Abrir las pruebas de estrés: entrar y salir cien veces de la misma emisión.
3112. Verificar que los sellos y contadores no se dupliquen con las entradas repetidas.
3113. Abrir las pruebas de estrés: recorrer las siete regiones seguidas sin guardar.
3114. Verificar que el estado se mantenga coherente en todo el recorrido.
3115. Abrir las pruebas de estrés: completar el DLC en una sola sesión sin reiniciar.
3116. Verificar que el juego llegue al final sin degradarse.
3117. Abrir las pruebas de hardware: equipo con recursos limitados.
3118. Verificar que el juego sea jugable por encima del umbral mínimo declarado.
3119. Abrir las pruebas de hardware: Android antiguo dentro del soporte declarado.
3120. Verificar que el juego arranque y funcione sin código nativo.
3121. Abrir las pruebas de hardware: pantalla de baja resolución.
3122. Verificar que la interfaz siga siendo legible y usable.
3123. Abrir las pruebas de hardware: pantalla de alta resolución.
3124. Verificar que el juego no se vea diminuto ni ampliado de forma incorrecta.
3125. Abrir las pruebas de hardware: mando de distintas marcas.
3126. Verificar la asignación de botones y su coherencia con el teclado.
3127. Abrir las pruebas de hardware: teclado sin teclas especiales.
3128. Verificar que el juego no dependa de una tecla poco común.
3129. Abrir las pruebas de hardware: sin conexión a internet durante toda la sesión.
3130. Verificar que nada del juego intente conectarse.
3131. Verificar que el juego no escriba nada en la carpeta del sistema.
3132. Verificar que el juego no pida permisos innecesarios en Android.
3133. Verificar que el juego funcione con la carpeta del juego en solo lectura.
3134. Verificar que el juego avise correctamente si no puede escribir el guardado.
3135. Abrir las pruebas de localización: caracteres acentuados en todos los textos visibles.
3136. Verificar que ningún acento se renderice como símbolo extraño.
3137. Abrir las pruebas de localización: textos largos en pantallas estrechas.
3138. Verificar los cortes de línea en todas las cajas del DLC.
3139. Verificar que no quede ningún texto en inglés en el DLC.
3140. Verificar que el glosario del proyecto se respete en los textos nuevos.
3141. Abrir el bloque de autoresía: subir de "denso y correcto" a "vale la pena".
3142. Definir qué cuenta como momento memorable y escribirlo en `docs/qa/momentos_memorables.md`.
3143. Fijar la meta por región: al menos cinco momentos memorables documentados y verificables.
3144. Fijar la meta por campaña: al menos tres momentos memorables documentados y verificables.
3145. Fijar la meta por gimnasio: al menos un puzle o combate que se recuerde.
3146. Auditar las siete regiones nuevas y contar sus momentos memorables reales.
3147. Auditar las cinco campañas y contar sus momentos memorables reales.
3148. Reescribir o rediseñar donde no llegue la meta, escena por escena.
3149. Verificar que cada momento memorable se pueda describir en una frase sin spoilers.
3150. Verificar que ningún momento memorable dependa de que el jugador lea un cartel opcional.
3151. Auditar los cuarenta gimnasios del DLC y su puzle: ¿se recuerda a los diez minutos?
3152. Rediseñar los puzles que se resuelvan pulsando avanzar sin pensar.
3153. Verificar que cada puzle tenga una idea central distinta y explicable en una frase.
3154. Auditar los jefes del DLC y su patrón: ¿obliga a cambiar de estrategia?
3155. Reescribir los jefes que se ganen con el mismo Pokémon de siempre.
3156. Verificar que cada jefe tenga una respuesta propia a la estrategia dominante del jugador.
3157. Auditar las rutas y su recorrido: ¿hay una decisión de camino o solo una línea recta?
3158. Añadir una decisión real de camino en cada ruta que hoy sea lineal.
3159. Verificar que la decisión de camino tenga consecuencias visibles y no cosméticas.
3160. Auditar las ciudades y su vida: ¿pasa algo si el jugador se queda quieto cinco minutos?
3161. Añadir al menos un suceso de ambiente a cada ciudad que hoy sea estática.
3162. Verificar que el suceso de ambiente no se repita en la misma visita.
3163. Auditar las mazmorras y su tensión: ¿hay riesgo o solo pasillo decorado?
3164. Añadir un recurso escaso o una decisión de coste a cada mazmorra plana.
3165. Verificar que la tensión no dependa de infligir daño injusto.
3166. Auditar los secretos: ¿hay algo que recompense mirar dos veces un mapa?
3167. Añadir al menos un secreto por cada diez mapas donde falte.
3168. Verificar que los secretos no sean obligatorios para terminar.
3169. Verificar que los secretos se puedan descubrir sin guía externa.
3170. Auditar la curva de dificultad por región con un gráfico publicado.
3171. Aplanar los saltos injustificados de dificultad detectados en el gráfico.
3172. Verificar que la curva no se vuelva trivial tras el primer tercio.
3173. Auditar la economía por región: ¿sobra dinero o falta curación en algún tramo?
3174. Corregir los tramos con economía rota y documentar cada ajuste.
3175. Verificar que ningún ajuste económico rompa a los tramos que ya funcionaban.
3176. Auditar el ritmo de las misiones de Team Rocket en tiempo real.
3177. Recortar los tramos de misión que se hagan lentos sin motivo.
3178. Verificar que ninguna misión pierda su dilema moral al acortarla.
3179. Auditar el ritmo de las siete emisiones: ¿dan miedo o solo incomodidad?
3180. Reescribir las emisiones que no consigan su efecto en los primeros dos minutos.
3181. Verificar que el efecto se logre sin gore ni sustos gratuitos.
3182. Auditar la Liga Oscura: ¿se siente como un final o como un trámite?
3183. Rediseñar lo que haga falta para que la llegada se sienta merecida.
3184. Verificar que la Liga Oscura no se pueda completar sin haber purgado las siete emisiones.
3185. Auditar el hub de Oak: ¿el jugador sabe qué hacer sin salir del juego?
3186. Reescribir el hub para que diga siempre el siguiente paso posible.
3187. Verificar que el hub no destripe contenido no descubierto.
3188. Auditar el arranque del postgame: ¿el primer minuto engancha?
3189. Reescribir la llegada al postgame si el primer minuto se pierde en texto.
3190. Verificar que el jugador pueda moverse y decidir en el primer minuto.
3191. Auditar la primera hora de cada región nueva.
3192. Reescribir la primera hora de la región que arranque más lenta.
3193. Verificar que cada región tenga su gancho en los primeros diez minutos.
3194. Auditar la última hora de cada región: ¿el final paga lo que prometió?
3195. Reescribir los cierres que queden por debajo de su promesa.
3196. Verificar que ningún final se sienta cortado por falta de tiempo.
3197. Auditar el reparto de recompensas: ¿hay algo que apetezca conseguir?
3198. Añadir recompensas deseables y no solo estadísticas en los hitos aburridos.
3199. Verificar que ninguna recompensa rompa el equilibrio del combate.
3200. Auditar los NPC recurrentes: ¿alguno cae bien o todos son funcionales?
3201. Escribir al menos tres personajes con continuidad entre regiones.
3202. Verificar que esos personajes tengan arco y no solo apariciones.
3203. Auditar el villano principal del DLC y su motivación.
3204. Reescribir la motivación si no se sostiene en una frase.
3205. Verificar que el villano no sea un calco del de otra dimensión.
3206. Auditar el trato al jugador: ¿el juego explica lo que necesita sin tratarlo de tonto?
3207. Reescribir los tutoriales que expliquen lo obvio y los que no expliquen lo necesario.
3208. Verificar que un jugador nuevo entienda el postgame sin leer documentación externa.
3209. Auditar el texto de la introducción del postgame.
3210. Reescribirla para que explique el Fragmento, las dimensiones y el porqué de todo.
3211. Verificar que esa explicación no contradiga el canon de Arceus.
3212. Auditar el nombre y la identidad de cada región.
3213. Verificar que las siete regiones se distingan entre sí en una frase cada una.
3214. Renombrar lo que se confunda con otra dimensión o con un lugar del juego base.
3215. Auditar la iconografía del DLC y su coherencia.
3216. Verificar que cada región tenga un símbolo propio y reconocible.
3217. Auditar la paleta de cada región y su diferencia con las demás.
3218. Verificar que ninguna región se confunda con otra por color.
3219. Auditar la música de cada región y su identidad.
3220. Verificar que ninguna región comparta tema principal con otra.
3221. Auditar el silencio como recurso en las escenas clave.
3222. Verificar que al menos una escena use silencio deliberado y funcione.
3223. Auditar el uso del sonido para anticipar peligro.
3224. Verificar que el jugador pueda oír venir un peligro antes de verlo.
3225. Auditar el uso del color para guiar sin texto.
3226. Verificar que los caminos principales se lean por color y forma.
3227. Auditar la iluminación de los interiores.
3228. Verificar que ningún interior sea tan oscuro que obligue a usar un objeto.
3229. Auditar las señales del mundo: carteles, flechas y luces.
3230. Verificar que ninguna señal contradiga el mapa real.
3231. Auditar la simetría de los mapas de ciudad.
3232. Romper la simetría de las ciudades donde el trazado se sienta artificial.
3233. Verificar que la ciudad siga siendo legible tras romper la simetría.
3234. Auditar los bordes de mapa: qué ve el jugador cuando llega al límite.
3235. Verificar que ningún borde muestre un corte brusco de tileset.
3236. Auditar los mapas de transición entre biomas.
3237. Verificar que el cambio de bioma tenga una franja intermedia creíble.
3238. Auditar el uso de vallas y objetos de bloqueo.
3239. Verificar que ningún bloqueo se sienta arbitrario sin justificación visual.
3240. Auditar la colocación de objetos ocultos.
3241. Verificar que estén donde el jugador quiera mirar, no en un rincón absurdo.
3242. Auditar la dificultad de encontrar los secretos.
3243. Verificar que encontrarlos sea satisfactorio y no tedioso.
3244. Auditar la calidad de los diálogos de victoria de los jefes.
3245. Reescribir los que suenen a plantilla.
3246. Verificar que cada victoria se sienta distinta de las demás.
3247. Auditar los diálogos de derrota del jugador.
3248. Verificar que ninguna derrota se sienta humillante.
3249. Auditar los diálogos de los entrenadores comunes.
3250. Verificar que ninguno sea de relleno puro y que al menos la mitad diga algo.
3251. Auditar las cartas, notas y diarios del DLC.
3252. Verificar que cada texto escrito del mundo aporte información útil o ambiente real.
3253. Auditar las descripciones de los objetos nuevos.
3254. Verificar que las descripciones expliquen para qué sirve cada objeto.
3255. Auditar las descripciones de las medallas y diplomas.
3256. Verificar que digan qué representan y de dónde vienen.
3257. Auditar el nombre de cada mapa nuevo.
3258. Verificar que el nombre describa el lugar y no sea un código interno.
3259. Auditar la coherencia geográfica entre mapas conectados.
3260. Verificar que el bioma de un mapa no cambie sin transición al cruzar el borde.
3261. Auditar la coherencia temporal entre mapas conectados.
3262. Verificar que la hora del día sea la misma en mapas contiguos.
3263. Auditar la coherencia de escala entre mapas conectados.
3264. Verificar que la distancia entre puntos no contradiga el mapa del mundo.
3265. Auditar la coherencia de la nieve y el hielo entre mapas de la misma región.
3266. Verificar que la nieve no aparezca y desaparezca sin motivo geográfico.
3267. Auditar la coherencia del agua: ríos que salen y entran donde deben.
3268. Verificar que ningún río nazca o muera en mitad de un mapa sin explicación.
3269. Auditar la coherencia de los caminos: que las rutas lleven a alguna parte.
3270. Verificar que ningún camino acabe en un callejón sin recompensa.
3271. Auditar la presencia de la historia en el mapa: ¿se ve o solo se lee?
3272. Verificar que al menos un elemento físico del mapa cuente la historia de su región.
3273. Auditar el uso de los NPC como coro de la historia.
3274. Verificar que la opinión del mundo cambie al avanzar la trama.
3275. Auditar los cambios del mundo tras cada hito importante.
3276. Verificar que al menos cinco mapas cambien visiblemente tras un hito.
3277. Auditar el epílogo del mundo: ¿se nota que se terminó?
3278. Verificar que el epílogo se vea en el mundo y no solo en un mensaje.
3279. Auditar el trato a los Pokémon como personajes.
3280. Verificar que al menos un Pokémon del DLC tenga arco propio.
3281. Auditar el uso del nombre de Ash y su lugar en la historia.
3282. Verificar que Ash sea agente externo en las siete emisiones y protagonista en la suya.
3283. Auditar el papel de Oak, de Maxine y de los aliados nuevos.
3284. Verificar que ningún aliado prometa ayuda y luego desaparezca sin explicación.
3285. Auditar las ausencias: qué personaje del juego base debería aparecer y no aparece.
3286. Decidir y documentar cada ausencia notable en lugar de dejarla al azar.
3287. Auditar el respeto a la obra original de Fire Ash.
3288. Verificar que ningún cambio del DLC contradiga lo que el juego base cuenta.
3289. Auditar el respeto al canon de Pokémon en lo que el proyecto decide tocar.
3290. Verificar que las licencias creativas del proyecto estén documentadas como tales.
3291. Auditar la coherencia del multiverso: reglas del Fragmento y de los fragmentos de dimensión.
3292. Verificar que las reglas del multiverso se apliquen igual en las siete regiones.
3293. Auditar las excepciones a esas reglas y documentarlas si son deliberadas.
3294. Verificar que ninguna excepción se lea como un error.
3295. Auditar la coherencia del Arceus del proyecto con el Arceus de la Ruta de Dios.
3296. Verificar que su tono no se ablande en los textos nuevos.
3297. Auditar la coherencia de la Liga Oscura con las siete emisiones.
3298. Verificar que la Liga Oscura cierre lo que las emisiones abrieron.
3299. Auditar la coherencia de Team Rocket con su propio arco.
3300. Verificar que el arco se lea completo en orden y sin huecos narrativos.
3301. Abrir el bloque de experimentación: verificar no es lo mismo que probar en el sentido científico.
3302. Escribir el protocolo de experimento en `docs/qa/protocolo_experimento.md`: hipótesis, medida y decisión.
3303. Prohibir cualquier cambio de diseño sin una hipótesis escrita antes de aplicarlo.
3304. Prohibir declarar bueno un cambio sin una medida antes y otra después.
3305. Definir las medidas de juego que el proyecto va a usar: tiempo, atascos, derrotas, abandonos y comprensión.
3306. Definir la medida de atasco: dónde se queda parado un jugador nuevo más de dos minutos.
3307. Definir la medida de derrota justa: cuántas veces muere un jugador nuevo contra cada jefe.
3308. Definir la medida de abandono: en qué mapa deja de jugar alguien que no conoce el proyecto.
3309. Definir la medida de comprensión: qué recuerda un jugador nuevo cinco minutos después de una escena.
3310. Construir la hoja de recogida de esas medidas para uso manual.
3311. Experimento 1: dificultad del primer jefe de cada región nueva con cinco jugadores distintos.
3312. Medir cuántas derrotas necesita cada uno y ajustar la dificultad por región.
3313. Verificar el ajuste con otro grupo distinto y publicar el resultado.
3314. Experimento 2: comprensión del arranque del postgame.
3315. Pedir a cinco jugadores nuevos que expliquen qué tienen que hacer después de la primera escena.
3316. Reescribir el arranque hasta que los cinco acierten sin ayuda.
3317. Experimento 3: orientación dentro de Atlas Mil.
3318. Medir si un jugador nuevo se pierde en las primeras veinte franjas.
3319. Añadir las señales necesarias donde se pierda y repetir la medida.
3320. Experimento 4: identidad de las siete regiones.
3321. Mostrar capturas de cada región y pedir que las distingan.
3322. Reescribir la identidad visual de la región que se confunda con otra.
3323. Experimento 5: miedo real en las emisiones de creepypasta.
3324. Medir la reacción de cinco jugadores en los primeros dos minutos de cada emisión.
3325. Ajustar el ritmo, el sonido o la luz de la emisión que no provoque nada.
3326. Verificar que el ajuste no dependa de un susto barato.
3327. Experimento 6: comprensión del arco de Team Rocket.
3328. Pedir a un jugador nuevo que resuma el arco al terminarlo.
3329. Corregir las escenas que el jugador no recuerde o interprete al revés.
3330. Experimento 7: satisfacción del final de cada región.
3331. Preguntar al jugador si el final le pareció suficiente y por qué.
3332. Reescribir los finales señalados como flojos y volver a medir.
3333. Experimento 8: utilidad del resumen de progreso.
3334. Medir si el jugador sabe qué le falta sin salir del juego.
3335. Añadir la información que falte y repetir la medida.
3336. Experimento 9: economía percibida.
3337. Medir si al jugador le sobra o le falta dinero en cada tercio del DLC.
3338. Ajustar precios y recompensas hasta que el resultado sea neutro.
3339. Experimento 10: ritmo de las misiones de Rocket.
3340. Medir cuánto tarda cada misión y si el jugador quiere terminarla.
3341. Recortar lo que alargue sin aportar y volver a medir.
3342. Experimento 11: exploración en las cuevas nuevas.
3343. Medir si el jugador explora o va en línea recta a la salida.
3344. Añadir bifurcaciones con recompensa donde el jugador no explore.
3345. Experimento 12: uso de los puzles de gimnasio.
3346. Medir cuánto tarda cada puzle y si el jugador lo resuelve pensando o probando al azar.
3347. Rediseñar los puzles que se resuelvan por prueba y error puro.
3348. Experimento 13: legibilidad de los mapas de noche.
3349. Medir si el jugador distingue camino y pared en las ciudades nuevas de noche.
3350. Ajustar el tinte hasta que se distinga sin perder la atmósfera.
3351. Experimento 14: carga cognitiva de los menús nuevos.
3352. Medir si el jugador encuentra las funciones nuevas sin explicación.
3353. Reorganizar lo que nadie encuentre y volver a medir.
3354. Experimento 15: valor percibido de las recompensas.
3355. Medir qué recompensa recuerda el jugador al terminar.
3356. Sustituir las recompensas olvidadas por otras con efecto visible.
3357. Experimento 16: peso de los diálogos.
3358. Medir si algún jugador salta texto con regularidad y en qué mapas.
3359. Recortar el texto en los mapas donde el salto sea sistemático.
3360. Verificar que el recorte no elimine información necesaria.
3361. Experimento 17: confusión entre objetos parecidos.
3362. Medir si el jugador confunde dos objetos por nombre o icono.
3363. Renombrar o redibujar lo que se confunda.
3364. Experimento 18: carga de la mochila en combate.
3365. Medir si la libertad de mochila hace los combates triviales.
3366. Ajustar la dificultad de los jefes si el resultado es trivialidad.
3367. Experimento 19: curva de niveles percibida.
3368. Medir si el jugador llega a los jefes por encima o por debajo del nivel previsto.
3369. Ajustar los niveles del contenido de camino si el desvío es grande.
3370. Experimento 20: rejugabilidad.
3371. Medir si un jugador quiere volver a una región acabada.
3372. Añadir, donde no haya motivo, un contenido opcional que justifique la vuelta.
3373. Verificar que el contenido opcional no sea obligatorio para el 100 %.
3374. Experimento 21: dificultad del jefe final de la Liga Oscura.
3375. Medir derrotas necesarias en cinco jugadores y compararlo con su expectativa.
3376. Ajustar para que el final no frustre ni aburra.
3377. Experimento 22: claridad del requisito de entrar en la Liga Oscura.
3378. Medir si el jugador sabe qué le falta sin consultar nada.
3379. Reescribir el aviso hasta que quede claro.
3380. Experimento 23: valor del contenido generado por constructor.
3381. Comparar a ciegas un mapa generado mejorado con un mapa original de Fire Ash.
3382. Pedir a cinco jugadores que digan cuál parece hecho a mano y por qué.
3383. Escribir el resultado sin maquillarlo, aunque sea incómodo.
3384. Decidir por escrito qué se hace con esa diferencia: aceptarla, mejorarla o reducir su alcance.
3385. Si se decide mejorar, fijar el conjunto de mapas que se reescriben a mano y su orden.
3386. Si se decide aceptarla, documentarla en la guía y en la descripción de la entrega.
3387. Prohibir presentar como artesanal lo que no lo sea.
3388. Verificar que la decisión quede escrita y no solo hablada.
3389. Experimento 24: comparación de dos versiones de la misma escena.
3390. Escribir dos versiones alternativas de una escena clave y probarlas con el mismo grupo.
3391. Quedarse con la que mejor se recuerde y documentar la decisión.
3392. Aplicar el criterio aprendido a las escenas equivalentes del resto del DLC.
3393. Experimento 25: comparación de dos curvas de dificultad en una región.
3394. Probar una región con dos ajustes distintos y medir derrotas y abandono.
3395. Adoptar la curva con mejor resultado y revisar que no rompa las regiones vecinas.
3396. Escribir el aprendizaje de cada experimento en una línea dentro del registro.
3397. Verificar que ningún experimento quede sin conclusión escrita.
3398. Verificar que ninguna conclusión se base en una sola persona.
3399. Verificar que ningún experimento haya durado tanto que el proyecto se quedara parado.
3400. Fijar un límite de tiempo por experimento y respetarlo.
3401. Repetir los veinticinco experimentos con un segundo grupo independiente.
3402. Verificar que las conclusiones se sostengan con el segundo grupo.
3403. Revertir cualquier cambio cuyo resultado no se replicara.
3404. Documentar las reversiones y su motivo.
3405. Verificar que ninguna reversión deje un mapa a medio cambiar.
3406. Verificar que ninguna reversión deje un texto contradictorio.
3407. Verificar con `npm run verify:all` tras cada tanda de experimentos.
3408. Verificar que los experimentos no hayan tocado ningún archivo original de Fire Ash.
3409. Verificar el alcance real de los cambios con el inventario de hashes.
3410. Medir el efecto de todos los cambios de diseño juntos sobre el tiempo de juego.
3411. Verificar que el tiempo de juego final siga siendo razonable y publicable.
3412. Medir el efecto de todos los cambios sobre la dificultad media.
3413. Verificar que la dificultad media no se haya vuelto trivial ni injusta.
3414. Medir el efecto de todos los cambios sobre la comprensión de la historia.
3415. Verificar que la historia se entienda sin documentación externa.
3416. Publicar el informe de experimentos en `docs/qa/experimentos.md`.
3417. Verificar que el informe liste hipótesis, medida, decisión y evidencia de cada uno.
3418. Verificar que el informe incluya los experimentos con resultado negativo.
3419. Verificar que el informe sea legible por alguien ajeno al proyecto.
3420. Verificar que ninguna decisión de diseño quede sin su evidencia.
3421. Convertir los aprendizajes estables en reglas del proyecto.
3422. Añadir esas reglas a `docs/qa/estilo_texto.md` y a la guía de autoría.
3423. Verificar que las reglas no se contradigan entre documentos.
3424. Verificar que las reglas se apliquen al contenido que ya estaba hecho.
3425. Revisar el contenido antiguo contra las reglas nuevas y anotar desviaciones.
3426. Corregir las desviaciones que afecten a la comprensión o al ritmo.
3427. Documentar las desviaciones que se decidan mantener y su motivo.
3428. Verificar que ninguna desviación mantenida rompa una regla de accesibilidad.
3429. Verificar que ninguna desviación mantenida confunda a un jugador nuevo.
3430. Repetir una ronda de playtest ciego tras aplicar todas las reglas.
3431. Medir de nuevo las cinco medidas de juego y compararlas con las primeras.
3432. Verificar que todas las medidas hayan mejorado o se mantengan.
3433. Verificar que ninguna medida haya empeorado sin una razón documentada.
3434. Escribir el cuadro comparativo de medidas en `docs/qa/medidas_juego.md`.
3435. Verificar que el cuadro incluya la primera medición y la última.
3436. Verificar que el cuadro sea reproducible con el mismo protocolo.
3437. Verificar que el protocolo de medidas se pueda aplicar a contenido futuro.
3438. Añadir el protocolo al manual de mantenimiento del proyecto.
3439. Verificar que el manual explique cómo medir sin depender de una persona concreta.
3440. Verificar que el manual incluya las plantillas de recogida de datos.
3441. Verificar que las plantillas se puedan rellenar en papel y en digital.
3442. Verificar que los datos recogidos no incluyan información personal de los jugadores.
3443. Verificar que los jugadores sepan para qué se recogen los datos.
3444. Escribir el consentimiento simple que se lee a cada jugador antes de la prueba.
3445. Verificar que el consentimiento explique que se prueba el juego, no a la persona.
3446. Verificar que ningún dato de las pruebas se publique asociado a una persona.
3447. Verificar que las pruebas se puedan hacer sin conexión y sin herramientas externas.
3448. Verificar que las pruebas se puedan hacer en Android y en PC por igual.
3449. Verificar que las pruebas se puedan hacer con una sola persona disponible.
3450. Verificar que los resultados con pocos participantes queden marcados como indicativos.
3451. Prohibir presentar una prueba con tres personas como una validación estadística.
3452. Escribir con honestidad qué se puede y qué no se puede concluir de las pruebas.
3453. Verificar que esa honestidad aparezca en el informe de cierre.
3454. Fijar la siguiente ronda de experimentos solo si las medidas lo piden.
3455. Prohibir experimentar por experimentar una vez las medidas están en rango.
3456. Verificar que ningún experimento posterior sirva para justificar un retraso.
3457. Verificar que ningún experimento posterior cambie el alcance del proyecto.
3458. Verificar que el alcance del proyecto quede congelado tras la última ronda.
3459. Congelar el diseño: a partir de aquí solo se corrigen defectos, no se rediseña.
3460. Documentar la congelación de diseño con su fecha y su motivo.
3461. Verificar que ningún cambio posterior altere el diseño aprobado.
3462. Verificar que las correcciones posteriores sean mínimas y verificables.
3463. Verificar que cada corrección posterior tenga su prueba de regresión.
3464. Verificar que ninguna corrección posterior reabra una discusión de diseño.
3465. Verificar que la congelación no impida corregir un defecto bloqueante.
3466. Verificar que un defecto bloqueante se pueda corregir incluso en congelación.
3467. Verificar que la excepción quede registrada con su motivo.
3468. Verificar que ninguna excepción se use dos veces seguidas sin revisión.
3469. Verificar que el equipo sepa distinguir defecto de preferencia.
3470. Verificar que ninguna preferencia personal se cierre como defecto.
3471. Verificar que ningún defecto real se cierre como preferencia.
3472. Escribir la regla de decisión para clasificar ambos casos.
3473. Aplicarla a las discusiones abiertas del proyecto.
3474. Verificar que ninguna discusión quede abierta al cerrar el bloque.
3475. Verificar que las decisiones tomadas queden escritas con su motivo.
3476. Verificar que las decisiones se puedan revisar dentro de un año.
3477. Verificar que el proyecto no dependa de la memoria de nadie para entenderse.
3478. Verificar que cualquier decisión se pueda rastrear hasta su experimento o su regla.
3479. Cerrar el bloque de experimentación con las medidas de juego en rango y publicadas.
3480. Cerrar el bloque de experimentación sin haber cambiado el alcance del proyecto.
3481. Abrir el cierre por criterio: el proyecto no se cierra por cansancio ni por fecha.
3482. Verificar C1: la cobertura del registro es del 100 % sobre las 6 283 152 unidades censadas.
3483. Verificar C1 por familia y no solo en total, para que ninguna quede sin justificar.
3484. Verificar C1 con el comando de cobertura en dos ejecuciones consecutivas.
3485. Verificar C1 sin las ROMs invitadas presentes, para que el cierre no dependa de ellas.
3486. Verificar C2: `docs/qa/defectos.md` está vacío.
3487. Verificar C2 con búsqueda automática de entradas abiertas en el registro.
3488. Verificar C2 revisando además los reportes de las sesiones de playtest.
3489. Verificar C2 revisando los comentarios y avisos de los verificadores.
3490. Verificar C2 revisando los avisos cosméticos que se decidieron aplazar.
3491. Verificar que ninguno de esos avisos cosméticos siga aplazado en el cierre.
3492. Verificar C3: la campaña de fuzz termina sin fallos nuevos tras dos semillas distintas.
3493. Verificar C3 con las 20 000 semillas de eventos y las 50 000 mutaciones de celdas.
3494. Verificar C3 con las 500 pruebas de guardado interrumpido.
3495. Verificar C3 con las pruebas de límite del sistema una por una.
3496. Verificar C4: tres rondas de playtest ciego con la tasa de descubrimiento en descenso.
3497. Verificar que la tercera ronda termine con tasa de descubrimiento cero.
3498. Verificar que las tres rondas hayan sido con jugadores que no conocían el proyecto.
3499. Verificar que las tres rondas hayan cubierto el 100 % del contenido visitable.
3500. Verificar que las tres rondas hayan cubierto los cuarenta y ocho jefes y sus finales.
3501. Verificar que las tres rondas hayan cubierto los siete finales de región.
3502. Verificar que las tres rondas hayan cubierto el final de las cinco campañas.
3503. Verificar que las tres rondas hayan cubierto el final de las seis dimensiones.
3504. Verificar que las tres rondas hayan cubierto el Diploma de la Liga Oscura.
3505. Verificar que las tres rondas hayan cubierto la captura de Arceus y su escena.
3506. Verificar que las tres rondas hayan cubierto las formas ALFA, BETA y OMEGA.
3507. Verificar que las tres rondas hayan cubierto todos los atavíos de Ash obtenibles.
3508. Verificar que las tres rondas hayan cubierto los estados del resumen de progreso.
3509. Verificar C5: `npm run verify:all` en verde en la última ejecución.
3510. Verificar C5 con la CI completa en verde sobre el commit final.
3511. Verificar C5 ejecutando la suite desde un clon limpio y sin cachés.
3512. Verificar C5 en un equipo distinto del que desarrolló el proyecto.
3513. Verificar que los cinco criterios se cumplan simultáneamente y no por separado.
3514. Verificar que ningún criterio se cumpla por haber desactivado un verificador.
3515. Verificar que ningún verificador se haya relajado para pasar.
3516. Verificar que ningún umbral se haya bajado para aprobar.
3517. Auditar el historial de cambios de los umbrales y de los verificadores.
3518. Revertir cualquier relajación que se encuentre y volver a verificar.
3519. Verificar que ningún verificador se haya marcado como omitido.
3520. Verificar que ningún test se haya desactivado por intermitencia.
3521. Corregir la intermitencia en lugar de desactivar el test.
3522. Verificar que la suite sea determinista ejecutándola tres veces seguidas.
3523. Verificar que las tres ejecuciones den exactamente el mismo resultado.
3524. Verificar que la suite no dependa de la hora del sistema ni del orden de archivos.
3525. Verificar que la suite no dependa de la conexión a internet.
3526. Verificar que la suite no dependa de las ROMs invitadas.
3527. Verificar que la suite no escriba en el juego durante su ejecución.
3528. Verificar que la suite deje el árbol exactamente como estaba.
3529. Verificar que la suite se pueda ejecutar sin privilegios de administrador.
3530. Verificar que la suite termine en un tiempo compatible con el desarrollo diario.
3531. Verificar el antiinflacionismo del plan: que ninguna fase de este documento sea decorativa.
3532. Auditar las 3 600 fases publicadas y marcar las que no produzcan evidencia verificable.
3533. Reescribir o retirar las fases que no produzcan evidencia.
3534. Verificar que ninguna fase del plan se pueda dar por cumplida sin un artefacto que lo pruebe.
3535. Verificar que cada fase cumplida tenga su artefacto enlazado en el registro.
3536. Verificar que el registro de fases cumplidas se pueda auditar sin confiar en nadie.
3537. Verificar que el registro no se pueda rellenar hacia atrás sin darse cuenta.
3538. Verificar que cualquier fase marcada como cumplida sea reproducible por un tercero.
3539. Verificar que el plan no crezca durante el cierre: la cifra queda congelada.
3540. Prohibir añadir fases nuevas después del cierre salvo defecto bloqueante documentado.
3541. Verificar que las fases añadidas por excepción queden marcadas como tales.
3542. Verificar que las excepciones no superen el cinco por ciento del total.
3543. Verificar que el alcance entregado coincida con el alcance prometido.
3544. Verificar que ninguna promesa pública del proyecto quede sin cumplir.
3545. Escribir la lista de lo que el proyecto NO incluye y por qué.
3546. Verificar que esa lista sea honesta y concreta.
3547. Verificar que esa lista no incluya nada que sí exista.
3548. Verificar que la descripción de la entrega no exagere la calidad artesanal del contenido generado.
3549. Verificar que la descripción no describa como terminado nada que sea esqueleto.
3550. Verificar que la descripción distinga contenido adaptado de contenido creado.
3551. Verificar que la descripción mencione el trabajo de revisión externa y sus límites.
3552. Verificar que la descripción mencione que el proyecto es un fangame no oficial.
3553. Verificar que la descripción respete la obra original de Fire Ash y sus autores.
3554. Verificar que los créditos estén completos y correctos.
3555. Verificar que los créditos incluyan a quien aportó arte, pruebas y revisión.
3556. Verificar que los créditos no atribuyan a nadie trabajo ajeno.
3557. Verificar que los créditos se muestren también dentro del juego.
3558. Verificar que el aviso legal y de atribución aparezca en el paquete.
3559. Escribir el acta final de cierre con los cinco criterios y su evidencia.
3560. Verificar que el acta final pueda leerla alguien ajeno y entender el estado exacto.
3561. Verificar que el acta final incluya la fecha, la versión y el hash del paquete.
3562. Verificar que el acta final incluya las cifras del censo y de la cobertura.
3563. Verificar que el acta final incluya el resultado de las tres rondas humanas.
3564. Verificar que el acta final incluya la lista de lo que queda fuera.
3565. Verificar que el acta final no use la palabra perfecto sin definirla.
3566. Verificar que cada uso de la palabra perfecto en el proyecto esté respaldado por C1 a C5.
3567. Sustituir cualquier promesa de perfección por la definición operativa de este documento.
3568. Verificar que la documentación del proyecto remita a esta definición y no a una promesa.
3569. Verificar que el juego no prometa nada dentro de sí mismo que no exista.
3570. Verificar que ningún texto del juego diga "próximamente" sin contenido detrás.
3571. Verificar que ninguna pantalla muestre un contenido bloqueado para siempre.
3572. Verificar que todo contenido mostrado como bloqueado se pueda desbloquear.
3573. Verificar que ningún desbloqueo quede inalcanzable por una condición imposible.
3574. Verificar que la condición de cada desbloqueo esté documentada.
3575. Verificar que ninguna condición de desbloqueo dependa de contenido eliminado.
3576. Congelar el paquete final y calcular su hash.
3577. Verificar el hash del paquete contra la copia publicada.
3578. Instalar el paquete congelado en una máquina limpia.
3579. Jugar la partida de cierre completa sobre el paquete congelado.
3580. Verificar que la partida de cierre termine sin un solo error registrado.
3581. Verificar que la partida de cierre cubra el 100 % del contenido visitable.
3582. Firmar la partida de cierre con fecha y versión.
3583. Verificar que la partida de cierre se pueda repetir por un tercero con el mismo resultado.
3584. Publicar el paquete congelado con su documentación y sus actas.
3585. Verificar que la publicación incluya el registro de cobertura completo.
3586. Verificar que la publicación incluya el registro de defectos con su cierre.
3587. Verificar que la publicación incluya el informe de experimentos y sus medidas.
3588. Verificar que la publicación incluya la lista de lo que queda fuera.
3589. Verificar que la publicación no incluya material no redistribuible.
3590. Verificar que la publicación esté accesible sin coste ni registro.
3591. Anunciar el cierre con un resumen honesto de lo entregado.
3592. Verificar que el anuncio no prometa nada que el acta no respalde.
3593. Abrir el canal de reporte de defectos para los jugadores.
3594. Verificar que el canal funcione y esté descrito en la guía.
3595. Comprometerse por escrito a un número de rondas de corrección posterior.
3596. Verificar que ese compromiso sea sostenible y no una promesa vacía.
3597. Documentar que cualquier juego de esta escala seguirá teniendo defectos tras el cierre.
3598. Documentar que el cierre significa que no queda ningún defecto conocido abierto, no que no exista ninguno.
3599. Ejecutar una última verificación completa de los cinco criterios y firmarla.
3600. Cerrar el plan de perfección declarando C1 a C5 cumplidos con su evidencia y nada más que eso.
