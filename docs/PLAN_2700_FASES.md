1801. Abrir la pasada impecable: pulir los 3 468 mapas del proyecto con una misma vara de calidad.
1802. Escribir el checklist de diez puntos de mapa impecable en `docs/qa/checklist_mapa.md`.
1803. Punto uno: el mapa no tiene simetría axial deliberada ni habitaciones de relleno cuadradas.
1804. Punto dos: ninguna ruta principal es recta durante más de doce celdas.
1805. Punto tres: toda celda transitable es alcanzable desde la entrada principal.
1806. Punto cuatro: ningún warp apunta a celda sólida ni a coordenada fuera de rango.
1807. Punto cinco: ningún tileset del mapa deja costuras ni autotiles rotos.
1808. Punto seis: el mapa tiene música asignada y existente.
1809. Punto siete: el mapa tiene al menos un motivo decorativo propio.
1810. Punto ocho: el mapa tiene contenido mínimo de su perfil.
1811. Punto nueve: el mapa no bloquea el control del jugador al entrar.
1812. Punto diez: el mapa tiene salida clara y redundante.
1813. Crear `tools/plan2700/checklist_mapa.mjs` que evalúe los diez puntos sobre un rango de mapas.
1814. Hacer que el evaluador devuelva un informe por mapa con el punto exacto que falla.
1815. Hacer que el evaluador permita excluir mapas originales de Fire Ash de la escritura pero no de la lectura.
1816. Correr el evaluador sobre los 3 468 mapas y guardar el informe en `content/plan2700_checklist.json`.
1817. Contar cuántos mapas fallan cada punto y ordenar el trabajo por impacto.
1818. Fijar que ningún punto se considere cerrado sin volver a correr el evaluador.
1819. Empezar por el punto cinco, el de costuras y autotiles, por ser el más visible al jugador.
1820. Corregir las costuras detectadas en los mapas del rango 2195–2300.
1821. Corregir las costuras detectadas en los mapas del rango 2040–2190.
1822. Corregir las costuras detectadas en los mapas del rango 1021–2020 por franjas de sesenta y tres.
1823. Corregir las costuras detectadas en los mapas del rango 3000–4419 por campaña.
1824. Verificar que ninguna corrección de costura haya movido colisión ni encuentros.
1825. Seguir por el punto cuatro, el de warps, con un auditor propio `tools/plan2700/audit_warps.mjs`.
1826. Corregir cada warp que apunte a celda sólida en los rangos nuevos.
1827. Corregir cada warp sin vuelta registrada en el mapa de destino.
1828. Corregir cada warp con dirección inválida o fuera de rango.
1829. Verificar que ninguna corrección de warp haya roto una ruta principal.
1830. Seguir por el punto tres, el de celdas inalcanzables, con el caminante automático.
1831. Corregir las celdas inalcanzables de los mapas de ciudad de las cinco campañas.
1832. Corregir las celdas inalcanzables de los mapas de gimnasio de todo el proyecto.
1833. Corregir las celdas inalcanzables de los mapas de mazmorra del Nightmare y de la Ruta de Dios.
1834. Verificar que ninguna corrección de alcance haya abierto un atajo no deseado.
1835. Seguir por el punto uno, el de simetría, con el detector de reflexión exacta.
1836. Reescribir los mapas simétricos detectados en el rango 1021–2020.
1837. Reescribir los mapas simétricos detectados en las cinco campañas.
1838. Verificar que ningún mapa reescrito haya perdido su contenido narrativo.
1839. Seguir por el punto dos, el de rutas rectas, con el detector de longitud recta máxima.
1840. Introducir recodos con contenido en cada ruta que supere el umbral.
1841. Verificar que ningún recodo nuevo deje la ruta sin salida ni alargue el viaje en exceso.
1842. Seguir por el punto diez, el de salidas, revisando mapa por mapa los callejones sin salida.
1843. Corregir los callejones sin salida detectados en los interiores del proyecto.
1844. Verificar que ninguna corrección de salida haya duplicado un warp existente.
1845. Seguir por el punto seis, el de música, completando los mapas sin BGM asignado.
1846. Verificar que ningún mapa quede sonando con la música del mapa anterior por herencia.
1847. Seguir por el punto siete, el de motivo decorativo, añadiendo detalles a los mapas planos.
1848. Verificar que los detalles nuevos no bloqueen pasos ni cambien colisión.
1849. Seguir por el punto ocho, el de contenido mínimo, con el medidor de densidad del bloque 901.
1850. Anotar en el informe los mapas que no puedan llegar al mínimo de su perfil y su motivo.
1851. Decidir por escrito qué se hace con cada mapa que no pueda llegar al mínimo.
1852. Seguir por el punto nueve, el de bloqueo de control, revisando cinemáticas al entrar.
1853. Recortar cualquier cinemática de entrada que supere los ocho segundos sin interacción.
1854. Seguir por el punto diez de nuevo, esta vez sobre la redundancia de salidas en mazmorras.
1855. Añadir segunda salida a toda mazmorra que dependa de un único warp.
1856. Verificar que la segunda salida no permita saltarse el jefe de la mazmorra.
1857. Cerrar el punto cuatro con el auditor de warps en verde sobre los 3 468 mapas.
1858. Cerrar el punto cinco con el auditor de costuras en verde sobre los 3 468 mapas.
1859. Cerrar el punto tres con el caminante automático en verde sobre los 3 468 mapas.
1860. Repetir el checklist completo después de los cuatro cierres y comparar el antes y el después.
1861. Publicar el antes y el después en `docs/qa/pulido_universal.md` con conteos por rango.
1862. Pulir la legibilidad de los mapas de noche: ninguna zona debe quedar ilegible por el tinte.
1863. Pulir la legibilidad de los mapas de niebla: la interfaz debe leerse por encima del clima.
1864. Pulir la legibilidad de los mapas de nieve: el contraste de la hierba nevada debe ser claro.
1865. Pulir la legibilidad de los interiores oscuros: ninguna trampa debe ser invisible.
1866. Verificar que ninguna trampa del juego sea invisible o injusta.
1867. Verificar que ninguna trampa reste vida sin aviso previo.
1868. Pulir los mapas de agua: la orilla debe estar animada y la entrada al agua legible.
1869. Pulir los mapas de cueva: el techo debe distinguirse del suelo a primera vista.
1870. Pulir los mapas de ciudad: las calles deben tener jerarquía visual clara.
1871. Pulir los mapas de bosque: los pasillos deben leerse sin perderse.
1872. Pulir los mapas de desierto y playa si existen y su transición hacia la hierba.
1873. Pulir los mapas de montaña: los desniveles deben leerse sin confundir con paredes.
1874. Pulir los mapas de nieve profunda: el paso lento debe estar señalizado.
1875. Pulir los mapas de gimnasio: el puzle debe verse desde la entrada.
1876. Pulir los mapas de guarida: la vigilancia debe notarse antes de entrar.
1877. Pulir los mapas de liga: la escalada debe sentirse en la decoración.
1878. Pulir los mapas de santuario: el altar debe ser el punto más visible.
1879. Pulir los mapas de hub: los servicios deben estar a la vista al llegar.
1880. Verificar que ningún hub obligue a buscar la curación más de quince segundos.
1881. Verificar que ninguna tienda esté detrás de un NPC con texto largo.
1882. Verificar que ningún cartel tape una entrada.
1883. Verificar que ningún árbol o roca tape un warp.
1884. Verificar que ningún warp esté detrás de un objeto oculto.
1885. Verificar que ningún objeto oculto esté debajo de un personaje inmóvil.
1886. Verificar que ningún NPC inmóvil esté en una celda de paso obligado.
1887. Verificar que ningún NPC en movimiento pueda empujar al jugador fuera del mapa.
1888. Verificar que ningún evento se mueva sobre una celda de warp.
1889. Verificar que ningún evento se mueva sobre una celda de encuentro de agua.
1890. Verificar que ningún evento automático se reejecute al reentrar en el mapa.
1891. Verificar que ningún evento paralelo consuma más de lo razonable por fotograma.
1892. Contar los procesos paralelos por mapa y fijar un techo por perfil.
1893. Reducir los procesos paralelos que superen el techo sin perder su función.
1894. Verificar que la reducción no rompa ninguna escena que dependa de ese proceso.
1895. Pulir los tiempos de espera de los eventos automáticos para que no se sientan lentos.
1896. Verificar que ninguna escena tenga más de tres esperas encadenadas sin acción del jugador.
1897. Pulir los fundidos para que ninguno se corte a mitad.
1898. Verificar con `npm run verify:transition-safety` que los fundidos en cascada siguen protegidos.
1899. Pulir las transiciones de mapa para que ninguna muestre un fotograma en negro de más.
1900. Verificar que ninguna transición deje el control bloqueado al llegar.
1901. Pulir el ritmo de las escenas largas partiéndolas en tramos con movimiento del jugador entre medias.
1902. Verificar que ningún tramo de escena supere los treinta segundos sin control.
1903. Pulir los mensajes de sistema para que no interrumpan una escena tensa.
1904. Verificar que ningún mensaje de sistema aparezca durante un combate de historia.
1905. Pulir la posición de los eventos respecto a la cámara para que nada quede fuera de pantalla.
1906. Verificar que ningún objeto interactuable quede fuera del encuadre al llegar.
1907. Pulir los títulos de mapa para que aparezcan una sola vez por entrada.
1908. Verificar que ningún título de mapa se muestre dos veces seguidas.
1909. Pulir los nombres de los mapas para que todos sean legibles y coherentes en idioma.
1910. Verificar que ningún mapa quede sin nombre visible al entrar.
1911. Pulir las posiciones iniciales del jugador en cada mapa para que mire hacia un punto con sentido.
1912. Verificar que ninguna llegada deje al jugador mirando a una pared.
1913. Verificar que ninguna llegada coloque al jugador sobre un evento inmóvil.
1914. Verificar que ninguna llegada dispare un combate sin aviso.
1915. Pulir la ubicación de los jefes para que se vean antes del combate.
1916. Verificar que ningún jefe ataque desde fuera del encuadre.
1917. Pulir la ubicación de las recompensas para que se vean antes de recogerlas.
1918. Verificar que ninguna recompensa quede oculta detrás de un objeto opaco por error.
1919. Pulir los carteles de ruta para que indiquen el destino correcto.
1920. Verificar que ningún cartel indique un destino que no existe.
1921. Pulir los carteles de ciudad para que indiquen sus servicios.
1922. Verificar que ningún cartel prometa un servicio que la ciudad no tenga.
1923. Pulir las señales de las guaridas para que avisen del riesgo.
1924. Verificar que ninguna señal de guarida oculte la entrada.
1925. Pulir los textos de ambiente de los NPC inmóviles para que aporten algo.
1926. Verificar que ningún NPC inmóvil repita el texto de otro del mismo mapa.
1927. Pulir las rutinas de los NPC móviles para que no se salgan de su zona.
1928. Verificar que ninguna rutina atraviese una pared o un warp.
1929. Verificar que ninguna rutina se quede atascada contra un objeto.
1930. Verificar que ninguna rutina haga desaparecer a un NPC de su mapa.
1931. Pulir la velocidad de los NPC para que ninguno sea más rápido que el jugador sin motivo.
1932. Verificar que ningún NPC corra en interiores.
1933. Pulir la densidad de NPC por mapa para que ninguna ciudad quede desierta ni saturada.
1934. Fijar el rango sano de NPC por tipo de mapa en `docs/qa/npc_por_mapa.md`.
1935. Verificar que ninguna ciudad nueva quede por debajo del rango sano.
1936. Verificar que ninguna ciudad supere el rango sano sin justificación escrita.
1937. Pulir la distribución de la hierba alta para que los encuentros no sean inevitables sin querer.
1938. Verificar que ninguna salida de ciudad desemboque directamente en hierba sin aviso.
1939. Pulir la distribución de los entrenadores de ruta para que el jugador pueda elegir evitarlos.
1940. Verificar que ningún entrenador de ruta bloquee el paso obligatorio.
1941. Verificar que ningún entrenador de ruta ataque por la espalda sin aviso.
1942. Pulir las recompensas de los entrenadores de ruta para que no rompan la economía.
1943. Verificar que ningún entrenador entregue un objeto único dos veces.
1944. Pulir la dificultad de los entrenadores de ruta para que acompañen la curva.
1945. Verificar que ningún tramo de ruta tenga un salto de nivel injustificado.
1946. Pulir el reparto de objetos curativos en el mundo para evitar la escasez frustrante.
1947. Verificar que ninguna zona de jefe quede sin curación a menos de un mapa.
1948. Pulir el acceso a las tiendas en el postgame para que nunca sobre dinero sin uso.
1949. Verificar que ningún objeto vendible se pueda vender por más de lo que cuesta.
1950. Cerrar la pasada universal con el checklist de diez puntos aprobado en los 3 468 mapas.
1951. Abrir el carril de arte propio: dejar de reutilizar caras conocidas en los NPC del DLC.
1952. Contar cuántos NPC del DLC usan hoy un sprite genérico reutilizado y listarlos en `content/plan2700_arte_faltante.json`.
1953. Agrupar los sprites faltantes por bloque: bases de Team Rocket, ciudades de campañas, gimnasios, ligas y hubs.
1954. Definir el estilo de los personajes nuevos: proporciones del juego, contorno y cuatro tonos por sprite.
1955. Escribir la guía de estilo de personajes nuevos en `docs/qa/estilo_personajes.md`.
1956. Producir el primer lote de sprites nuevos para la base de Team Rocket en sus cuatro plantas.
1957. Verificar que los sprites nuevos de la base se distingan entre rangos y entre funciones.
1958. Verificar que los sprites nuevos tengan sus cuatro direcciones y sus pasos completos.
1959. Producir el segundo lote de sprites para las ciudades de las cinco campañas.
1960. Verificar que ninguna ciudad de campaña reutilice el sprite de un personaje con nombre propio.
1961. Producir el tercer lote de sprites para los ocho gimnasios de Atlas y sus ayudantes.
1962. Producir el cuarto lote de sprites para los líderes de las cinco campañas.
1963. Producir el quinto lote de sprites para los campeones de las siete regiones nuevas.
1964. Verificar que ningún campeón comparta sprite con otro campeón del proyecto.
1965. Producir el sexto lote de sprites para las ciudades de Atlas y sus servicios.
1966. Producir el séptimo lote de sprites para los hubs y sus asistentes.
1967. Producir el octavo lote de sprites para los catorce medallistas de la Liga Oscura.
1968. Verificar que ningún NPC del DLC quede sin sprite propio al cerrar los ocho lotes.
1969. Verificar que cada sprite nuevo tenga su archivo en `Graphics/Characters` con nombre en mayúsculas consistente.
1970. Verificar que ningún sprite nuevo pise el nombre de un archivo original.
1971. Verificar que cada sprite nuevo pese lo razonable y no multiplique el peso del paquete.
1972. Producir la iconografía de las ocho medallas de Atlas con su paleta propia.
1973. Producir la iconografía de la medalla de Team Rocket y sus rangos.
1974. Producir la iconografía de las cuarenta medallas de las cinco campañas.
1975. Verificar que ninguna medalla nueva reutilice el dibujo de otra.
1976. Verificar que las medallas nuevas se vean bien a tamaño de visor y a tamaño reducido.
1977. Verificar con `node tools/apply_badge_viewer.mjs --verify` que el visor muestra todas.
1978. Producir los iconos de los objetos nuevos del DLC y verificar su tamaño estándar.
1979. Verificar que ningún objeto nuevo use el icono de otro objeto.
1980. Producir los iconos de Pokémon de las formas nuevas y de los Pokégods.
1981. Verificar que los iconos de Pokégods se vean correctos en el equipo y en la caja del PC.
1982. Producir los battlers front y back que falten para jefes del DLC.
1983. Verificar que todos los battlers usados en combate existan con el nombre exacto.
1984. Verificar que ningún battler nuevo esté a una escala distinta del resto.
1985. Producir los retratos de diálogo si el juego los usa y verificar su coherencia de estilo.
1986. Verificar que ningún retrato nuevo aparezca con fondo blanco o recortado a medias.
1987. Producir los tilesets propios que falten para las regiones nuevas.
1988. Verificar que cada tileset nuevo tenga su entrada completa en `Tilesets.rxdata`.
1989. Verificar que ningún tileset nuevo se solape en id con uno existente.
1990. Verificar que las autotiles de los tilesets nuevos no dejen costuras en los mapas que las usan.
1991. Producir los fondos de batalla de las dimensiones que no tengan uno propio.
1992. Verificar que ningún fondo de batalla nuevo tape la interfaz de combate.
1993. Producir las láminas de referencia visual de cada región para documentación.
1994. Verificar que las láminas de referencia no se suban al repositorio si superan el tamaño permitido.
1995. Producir el atavío de Ash para cada una de las siete regiones nuevas si falta alguno.
1996. Verificar que cada atavío tenga sus cuatro direcciones, sus pasos y su versión de batalla.
1997. Verificar que ningún atavío se pueda activar antes de su desbloqueo narrativo.
1998. Verificar que el atavío secreto solo se active al completar todo el contenido extra.
1999. Producir el atavío de campeón de la Ruta de Dios y verificar su charset.
2000. Verificar que el atavío de campeón se vea distinto del atavío base en el overworld.
2001. Verificar que todos los atavíos se apliquen con `npm run apply:atavios` y `npm run verify:atavios`.
2002. Verificar que ningún atavío rompa las animaciones de surf, buceo o pesca.
2003. Verificar que el cambio de atavío se vea reflejado en la pantalla de estado.
2004. Verificar que ningún atavío antiguo se pierda al añadir los nuevos.
2005. Escribir el inventario de arte del DLC en `content/plan2700_arte.json` con hash y fase de cada archivo.
2006. Verificar que ese inventario cubra el 100 % de los archivos de arte añadidos por este plan.
2007. Verificar que ningún archivo del inventario sea un duplicado exacto de otro.
2008. Eliminar los duplicados exactos detectados y actualizar las referencias.
2009. Verificar que ninguna referencia quede rota tras eliminar duplicados.
2010. Auditar la atribución de todo el arte que provenga de referencias externas.
2011. Escribir el archivo de créditos del proyecto con la atribución completa.
2012. Verificar que ningún arte de fangame ajeno se distribuya sin permiso.
2013. Verificar que los sprites de las ROM invitadas se usen solo como referencia estructural.
2014. Verificar que los mapas de las campañas se construyan con recursos propios de Fire Ash.
2015. Verificar que la política de adaptación estructural se declare en cada documento de región.
2016. Verificar que ningún plano automático se presente como recreación verificada de un fangame.
2017. Producir el arte de la Liga Oscura: sala de medallas, altar y trono del jefe final.
2018. Verificar que el arte de la Liga Oscura no reutilice el de la Cima del Génesis.
2019. Producir el arte de la gruta de testigos y su altar narrativo.
2020. Producir el arte del punto de colapso de la Torre Pokémon y verificar su animación.
2021. Verificar que el punto de colapso se vea desde lejos y no se confunda con un objeto de mapa.
2022. Producir el arte del barco que conecta dimensiones y verificar su coherencia con las tres regiones.
2023. Verificar que el barco no tape ningún warp al atracar.
2024. Producir el arte del portal de Atlas y verificar su animación de entrada.
2025. Verificar que el portal de Atlas se distinga del portal de Arceus.
2026. Producir el arte de los ocho gimnasios de Atlas y verificar su identidad visual diferenciada.
2027. Verificar que ningún gimnasio de Atlas se confunda con otro a primera vista.
2028. Producir el arte de las cuatro plantas de la base de Team Rocket.
2029. Verificar que cada planta de la base tenga identidad visual propia.
2030. Producir el arte de los interiores artesanales que aún usen planta base sin variar.
2031. Verificar que ningún interior visitable quede con muebles idénticos a otro de otra región.
2032. Producir el arte de los santuarios laterales de la aproximación celestial.
2033. Producir el arte de los altares de los siete pisos de la Ruta de Dios.
2034. Verificar que los siete altares sean distinguibles entre sí.
2035. Producir el arte de los hubs de las cinco campañas y verificar su coherencia.
2036. Producir el arte de las ciudades principales de las cinco campañas.
2037. Verificar que las ciudades principales tengan silueta propia y reconocible.
2038. Producir el arte de los interiores singulares de cada región.
2039. Verificar que ningún interior singular sea una copia con distinto cartel.
2040. Producir el arte de las máquinas del Nightmare y verificar su coherencia con su trama.
2041. Producir el arte de las anomalías del Nightmare y verificar su legibilidad.
2042. Verificar que ninguna anomalía del Nightmare se confunda con un objeto decorativo.
2043. Producir el arte de los seis jefes del Nightmare si falta alguno.
2044. Verificar que los seis jefes del Nightmare tengan presencia visual distinta.
2045. Producir el arte de los siete guardianes de creepypasta si falta alguno.
2046. Verificar que ningún guardián use el sprite de un personaje con nombre del juego original.
2047. Producir el arte de la fauna especial de las emisiones si hace falta.
2048. Verificar que ninguna especie nueva del DLC quede sin sprite front, back e icono.
2049. Producir el arte de los Pokégods que aún usen sprite prestado.
2050. Verificar que los 19 Pokégods tengan Front, Back, Icon y Character propios.
2051. Verificar que las formas ALFA, BETA y OMEGA se distingan a simple vista.
2052. Producir el arte de los diplomas y verificar su legibilidad en pantalla.
2053. Producir el arte de las pantallas nuevas del menú y verificar su estilo.
2054. Verificar que ninguna pantalla nueva tape la interfaz original en resoluciones pequeñas.
2055. Producir el arte de las cajas de diálogo si el DLC necesita alguna variante.
2056. Verificar que las cajas nuevas respeten el ancho estándar de texto del juego.
2057. Producir el arte de las transiciones de batalla temáticas por dimensión.
2058. Verificar que las transiciones nuevas no afecten a los combates originales.
2059. Producir el arte de los iconos de estado nuevos si el DLC añade alguno.
2060. Verificar que ningún icono de estado nuevo se confunda con uno existente.
2061. Verificar que todo el arte nuevo pase `npm run verify:graficos`.
2062. Verificar que todo el arte nuevo tenga su fase de este plan asociada en el inventario.
2063. Verificar que ninguna fase de arte quede sin cerrar su inventario.
2064. Verificar que el peso total del arte añadido sea razonable para un juego RMXP.
2065. Comprimir sin pérdida el arte que lo permita y verificar la identidad pixel a pixel.
2066. Verificar que ninguna compresión haya alterado los sprites.
2067. Publicar el resumen de arte del plan en `docs/qa/arte_total.md`.
2068. Verificar que ese resumen coincida con `content/plan2700_arte.json`.
2069. Marcar como cerrado el carril de arte con el inventario completo y sin recursos huérfanos.
2070. Verificar que ningún recurso del inventario quede referenciado por ningún mapa o evento.
2071. Abrir el carril de diálogos impecables sobre los 2 741 eventos del DLC.
2072. Volcar todos los textos del DLC a `content/plan2700_dialogos.json` con mapa, evento y página.
2073. Contar los textos volcados y comparar con lo esperado por bloque.
2074. Auditar que ningún texto supere las dos líneas de la caja estándar.
2075. Auditar que ningún texto corte una palabra a la mitad al ajustar la caja.
2076. Auditar que ninguna caja quede vacía o con solo espacios.
2077. Auditar los signos de apertura en español en todo el DLC.
2078. Auditar que ningún texto mezcle idiomas ni quede en inglés sin traducir.
2079. Auditar los 759 diálogos importados de las ROM invitadas uno por uno.
2080. Reescribir cualquier diálogo importado que sea andamiaje y no voz propia.
2081. Verificar que ningún diálogo importado describa mecánicas del motor.
2082. Auditar los nombres propios y su ortografía constante en todo el DLC.
2083. Auditar el uso de variables insertadas en texto y verificar que ninguna quede vacía.
2084. Auditar los nombres de Pokémon, movimientos y objetos citados en los diálogos.
2085. Verificar que ningún diálogo cite un Pokémon que no exista en `species.dat`.
2086. Verificar que ningún diálogo cite un objeto que no exista en `items.dat`.
2087. Auditar la longitud media de diálogo por mapa y marcar los que cansen.
2088. Reescribir los bloques de texto largos repartiéndolos en páginas con acción entre medias.
2089. Verificar que ninguna conversación supere las ocho cajas seguidas sin interacción.
2090. Auditar los textos repetidos literalmente en más de un mapa y reescribirlos.
2091. Verificar que cada dimensión tenga al menos una frase memorable propia.
2092. Auditar el tono de cada bloque y compararlo con el canon del proyecto.
2093. Verificar que ningún texto de Arceus caiga en prosa de deidad benévola.
2094. Verificar con `npm run verify:canon:arceus` que el canon se mantiene tras las reescrituras.
2095. Verificar con `npm run verify:tone-safety` que ninguna reescritura rompió el tono.
2096. Auditar los textos de derrota de los jefes y verificar que no humillen a nadie.
2097. Auditar los textos de los heridos de Team Rocket y verificar que tengan dignidad.
2098. Auditar los textos de los siete mundos y verificar que conserven su esencia con voz propia.
2099. Verificar que ningún texto de creepypasta copie líneas de su cuento de origen.
2100. Verificar que ningún texto de creepypasta caiga en gore gratuito o parodia.
2101. Auditar los textos de la Liga Oscura y verificar su coherencia con las catorce medallas.
2102. Auditar los textos de los ocho campeones y verificar que ninguno repita discurso.
2103. Auditar los textos de los cuarenta líderes de gimnasio del DLC.
2104. Verificar que cada líder presente su especialidad y su carácter en su primera línea.
2105. Auditar los textos de los NPC de ciudad por capítulo y verificar su actualización.
2106. Verificar que ningún NPC diga algo que ya no es cierto tras avanzar la historia.
2107. Auditar los textos de los carteles y verificar que coincidan con el destino real.
2108. Auditar los textos de los objetos examinables y verificar que aporten algo.
2109. Reescribir los objetos examinables que solo digan que no hay nada.
2110. Auditar los textos de los menús nuevos y verificar su estilo.
2111. Auditar los textos de los avisos de guardado y verificar que no alarmen sin motivo.
2112. Auditar los textos de las recompensas y verificar que no se disparen dos veces.
2113. Verificar que ningún texto prometa algo que el juego no cumpla.
2114. Auditar las promesas narrativas abiertas y cerrarlas en el epílogo.
2115. Verificar que el epílogo mencione solo las dimensiones realmente completadas.
2116. Auditar el glosario del proyecto y verificar que los términos se usen siempre igual.
2117. Reescribir cualquier texto que use un término distinto para el mismo concepto.
2118. Auditar los nombres de las medallas y diplomas contra los documentos.
2119. Verificar que los nombres coincidan también en el visor y en el menú.
2120. Auditar los textos de los NPC del hub de Oak por estado de progreso.
2121. Verificar que el hub de Oak tenga respuesta para cada combinación de estado.
2122. Auditar los textos de los asistentes de los hubs de campaña.
2123. Verificar que ningún asistente repita el texto de otro hub.
2124. Auditar los textos de los guardias y verificadores de acceso.
2125. Verificar que ningún guardia bloquee el paso sin explicar el motivo.
2126. Auditar los textos de los transportadores y verificar que avisen antes de mover al jugador.
2127. Verificar que ningún transportador mueva al jugador sin confirmación.
2128. Auditar los textos de los jefes antes del combate en las siete regiones nuevas.
2129. Verificar que cada jefe diga algo distinto según si el jugador ya lo venció.
2130. Verificar que ningún jefe repita su discurso de entrada en una revancha.
2131. Verificar que ningún jefe repita su texto de derrota en una revancha.
2132. Auditar los textos de las siete emisiones y su degradación progresiva.
2133. Verificar que ningún texto de emisión se muestre fuera de su emisión.
2134. Auditar los textos de los sellos y verificar que se anuncien una sola vez.
2135. Auditar los textos de las anclas de Atlas y verificar que ninguno repita estructura.
2136. Reescribir las anclas que compartan plantilla literal con otra.
2137. Auditar los textos de las 500 aventuras de Horizontes y verificar que ninguna repita plantilla.
2138. Reescribir las aventuras que repitan estructura de forma evidente.
2139. Auditar los textos de las cinco misiones de Team Rocket y su progresión moral.
2140. Verificar que el arco de las misiones se lea completo en orden.
2141. Auditar los textos de la infiltración y verificar que el disfraz se note en los diálogos.
2142. Auditar los textos de los rangos y verificar que el ascenso se celebre en escena.
2143. Auditar los textos del final del arco de Team Rocket y su efecto en los habitantes.
2144. Verificar que el final del arco se lea sin haber jugado otra dimensión antes.
2145. Auditar los textos de las cinco campañas y su coherencia con su identidad declarada.
2146. Verificar que ninguna campaña use el conflicto de otra con otro nombre.
2147. Auditar los textos de los rivales de cada región y verificar que ninguno sea un clon.
2148. Auditar los textos de los profesores e investigadores del DLC.
2149. Verificar que ningún investigador explique lo mismo que otro con otras palabras.
2150. Auditar los textos de los heridos de la base y verificar que cada uno tenga nombre y voz.
2151. Verificar que ningún herido se repita como personaje en dos celdas distintas.
2152. Auditar los textos de los testigos de la Ruta de Dios y verificar que no repitan.
2153. Auditar los textos de la gruta de testigos y su función narrativa.
2154. Verificar que la gruta de testigos no contradiga el canon de Arceus.
2155. Auditar los textos del Rotom del Tiempo y su explicación del multiverso.
2156. Verificar que la explicación del multiverso no confunda fragmento con dimensión.
2157. Auditar los textos de Oak en su hub y verificar que su información sea correcta.
2158. Verificar que Oak no anime a un jugador que ya completó todo.
2159. Auditar los textos de Maxine en ciudad Teckel y verificar su tono.
2160. Verificar que ningún texto de Teckel quede como plantilla sin terminar.
2161. Auditar los textos de la Isla Espejo y de sus dieciséis jefes.
2162. Verificar que ningún jefe de Isla Espejo repita el texto de otro.
2163. Auditar los textos de los Pokégods y su presentación en combate.
2164. Verificar que las formas ALFA, BETA y OMEGA se anuncien con texto distinto.
2165. Auditar los textos de los diplomas y verificar su condiciones.
2166. Verificar que la entrega del Diploma de la Liga Oscura esté en el texto y en el switch.
2167. Auditar los textos de la batalla final y verificar su peso dramático.
2168. Verificar que el texto final no prometa una secuela inexistente.
2169. Auditar los textos de los créditos y verificar las atribuciones.
2170. Verificar que ninguna atribución falte o esté mal escrita.
2171. Auditar los textos de las pantallas de error del editor y su tono.
2172. Verificar que los textos del editor no usen jerga interna del motor.
2173. Verificar con `npm run verify:dialogos:queue` que no queden cajas mal formadas.
2174. Ejecutar `node tools/apply_cajas_dialogo.mjs --verify` y resolver cada aviso.
2175. Recontar los textos tras las reescrituras y actualizar `content/plan2700_dialogos.json`.
2176. Verificar que el conteo final de textos sea coherente con el número de eventos.
2177. Publicar el informe de diálogos en `docs/qa/dialogos_informe.md` con conteos y hallazgos.
2178. Verificar que el informe liste cada texto reescrito y su motivo.
2179. Verificar que ninguna reescritura haya cambiado el sentido de una escena clave.
2180. Verificar que las escenas clave hayan sido releídas por completo tras las reescrituras.
2181. Marcar como cerrado el carril de diálogos con el volcado revisado y sin cajas vacías.
2182. Verificar que ningún texto del DLC quede sin revisar en el volcado.
2183. Verificar que el volcado se pueda regenerar después de cualquier cambio futuro.
2184. Añadir el volcado de diálogos al flujo de CI como comprobación de formato.
2185. Verificar que ese control no ralentice la suite más de lo aceptable.
2186. Verificar que el control detecte cajas de una sola línea por error de relleno.
2187. Verificar que el control detecte signos de apertura ausentes.
2188. Verificar que el control detecte comillas y guiones mal usados.
2189. Verificar que el control detecte variables insertadas inexistentes.
2190. Cerrar el carril de diálogos con el control en CI y el informe publicado.
2191. Abrir el carril de playtest real: nadie ha jugado el DLC de punta a punta todavía.
2192. Escribir el guion de playtest con cuota de cobertura por sesión: celdas visitadas, eventos ejecutados y diálogos mostrados, no solo "jugar".
2193. Definir la ficha de sesión: fecha, versión, duración, hallazgos y capturas.
2194. Crear `docs/qa/playtest/` y una carpeta por sesión.
2195. Sesión 1: arranque en frío, menú principal y primera partida.
2196. Sesión 2: partida guardada anterior al duelo de Arceus y su comportamiento.
2197. Sesión 3: duelo de Arceus completo, seis fases, sin guardado intermedio.
2198. Sesión 4: captura de Arceus y aparición junto a Oak.
2199. Sesión 5: entrada al postgame y primer contacto con el hub de Oak.
2200. Sesión 6: las siete grietas de creepypasta y su aviso de Entrar o Retirarse.
2201. Sesión 7: las siete emisiones en orden natural y su purga.
2202. Sesión 8: las siete emisiones en orden inverso y su purga.
2203. Sesión 9: punto de colapso y subida a la falda del Monte Silver.
2204. Sesión 10: cumbre, Red y su combate.
2205. Sesión 11: Liga Oscura con los siete sellos y su Diploma.
2206. Sesión 12: entrada a Atlas y primer lote de franjas.
2207. Sesión 13: los ocho gimnasios de Atlas y sus puzles.
2208. Sesión 14: anclas Tier 1 y su narración.
2209. Sesión 15: ciudad Teckel y la escena de Maxine.
2210. Sesión 16: Isla Espejo y la captura de un Pokégod por forma.
2211. Sesión 17: barco a Glazed y primera ciudad.
2212. Sesión 18: Glazed de punta a punta y su campeón.
2213. Sesión 19: barco a Light Platinum y su capital.
2214. Sesión 20: Light Platinum de punta a punta y su campeón.
2215. Sesión 21: Liquid Crystal de punta a punta y su campeón.
2216. Sesión 22: TFOH de punta a punta y su cierre narrativo.
2217. Sesión 23: Unbound de punta a punta y su campeón exigente.
2218. Sesión 24: las cinco misiones de Team Rocket en una sola partida.
2219. Sesión 25: disfraz puesto y quitado dentro de la base.
2220. Sesión 26: movimientos de campo sin medallas en las siete regiones.
2221. Sesión 27: mochila libre en combate en cada tipo de combate.
2222. Sesión 28: menú Z y menú de estado tras cada desbloqueo.
2223. Sesión 29: guardar y cargar dentro de cada dimensión.
2224. Sesión 30: perder contra cada jefe final y reintentar.
2225. Sesión 31: abandonar cada región a mitad y retomar después.
2226. Sesión 32: el DLC completo sin usar ninguna guía externa.
2227. Registrar cada sesión con su ficha, sus hallazgos numerados y la tasa de descubrimiento (hallazgos por hora), que debe bajar ronda a ronda.
2228. Clasificar cada hallazgo por gravedad: bloqueante, grave, leve o cosmético.
2229. Corregir los hallazgos bloqueantes en el mismo día de la sesión.
2230. Corregir los graves antes de la sesión siguiente.
2231. Agrupar los leves y cosméticos por bloque para corregirlos en lote.
2232. Verificar que ninguna corrección de playtest rompa un verificador existente.
2233. Reejecutar `npm run verify:all` después de cada tanda de correcciones.
2234. Escribir la prueba de regresión de cada hallazgo grave corregido.
2235. Añadir esas pruebas de regresión a la suite del proyecto.
2236. Verificar que la suite siga pasando después de cada añadido.
2237. Medir el tiempo de cada sesión de playtest y su cobertura de contenido.
2238. Verificar que entre todas las sesiones se cubra el 100 % del contenido del DLC.
2239. Llevar el registro de cobertura en `docs/qa/playtest_cobertura.md`.
2240. Marcar cada mapa visitado en el registro de cobertura.
2241. Verificar que ningún mapa del DLC quede sin visitar en playtest.
2242. Verificar que ningún jefe del DLC quede sin combatir en playtest.
2243. Verificar que ninguna medalla quede sin obtener en playtest.
2244. Verificar que ningún diálogo del DLC quede sin mostrarse en playtest.
2245. Verificar que ninguna ruta quede sin recorrer en playtest.
2246. Revisar la cobertura por dimensión y completar las que falten.
2247. Sesión 33: prueba en ventana pequeña de escritorio.
2248. Sesión 34: prueba a pantalla completa de escritorio.
2249. Sesión 35: prueba con mando.
2250. Sesión 36: prueba con teclado.
2251. Sesión 37: prueba en Android con Kirin.
2252. Sesión 38: prueba con la APK de PokeMod Studio como editor en paralelo.
2253. Verificar que el editor no escriba en las partidas durante toda la sesión.
2254. Sesión 39: deshacer y rehacer en el editor sobre un mapa del DLC.
2255. Sesión 40: auditoría del editor sobre el contenido nuevo.
2256. Sesión 41: exportación ZIP desde el editor y su reimportación.
2257. Sesión 42: modo lectura sin permisos de escritura.
2258. Verificar que la exportación ZIP preserve todos los archivos nuevos.
2259. Verificar que la reimportación no duplique archivos ni eventos.
2260. Verificar que el editor abra los mapas nuevos sin errores.
2261. Verificar que el editor muestre los nombres de mapa nuevos correctamente.
2262. Verificar que el editor permita editar eventos del DLC sin romper su formato.
2263. Verificar que los cambios hechos con el editor pasen `npm run verify:mapas`.
2264. Verificar que los cambios hechos con el editor no rompan los verificadores de región.
2265. Sesión 43: partida larga de cuatro horas seguidas sin reiniciar.
2266. Verificar que ninguna fuga de memoria arruine una partida larga.
2267. Verificar que el guardado siga funcionando tras cuatro horas de juego.
2268. Verificar que la música no se desincronice tras cuatro horas.
2269. Verificar que ningún evento quede en estado raro tras muchas transiciones.
2270. Sesión 44: partida con un guardado muy antiguo del juego original.
2271. Verificar que un guardado antiguo cargue sin corromperse.
2272. Verificar que un guardado antiguo pueda acceder al postgame si cumple las condiciones.
2273. Verificar que un guardado antiguo no rompa los contadores nuevos.
2274. Sesión 45: partida nueva hasta el postgame sin usar atajos.
2275. Medir el tiempo total de esa partida y publicarlo.
2276. Verificar que el tiempo sea razonable para un DLC de esta escala.
2277. Sesión 46: prueba de estrés de apertura y cierre de menús en todas las dimensiones.
2278. Verificar que ningún menú quede colgado en ninguna dimensión.
2279. Sesión 47: prueba de estrés de surf y buceo en cada cuerpo de agua nuevo.
2280. Verificar que el surf funcione en todos los mapas con agua nueva.
2281. Verificar que ningún mapa con agua nueva deje al jugador atrapado al desmontar.
2282. Sesión 48: prueba de pesca en los mapas nuevos con agua.
2283. Verificar que la pesca nueva no rompa ninguna tabla de encuentros.
2284. Sesión 49: prueba de vuelo y teletransporte a los mapas nuevos si el juego lo permite.
2285. Verificar que ningún mapa nuevo rompa el mapa de vuelo.
2286. Verificar que ningún punto de teletransporte nuevo deje al jugador en celda sólida.
2287. Sesión 50: prueba del día y noche en las ciudades nuevas.
2288. Verificar que el ciclo no rompa escenas que dependan de la hora.
2289. Verificar que ninguna escena nueva sea imposible de ver por la hora.
2290. Sesión 51: prueba de clima extremo y su efecto en el rendimiento.
2291. Verificar que la ventisca no baje la tasa de refresco por debajo del umbral fijado.
2292. Sesión 52: prueba de la niebla en interiores y exteriores.
2293. Verificar que la niebla no tape la interfaz de combate.
2294. Sesión 53: prueba de la restauración del tono de pantalla tras cada cinemática.
2295. Verificar que ninguna cinemática deje la pantalla teñida al salir.
2296. Sesión 54: prueba de las transiciones de batalla nuevas.
2297. Verificar que ninguna transición nueva deje un fotograma negro de más.
2298. Sesión 55: prueba de las animaciones de los jefes nuevos.
2299. Verificar que ninguna animación de jefe deje al jugador sin control.
2300. Sesión 56: prueba de las recompensas únicas en una partida ya completada.
2301. Verificar que ninguna recompensa se pueda duplicar en una segunda visita.
2302. Sesión 57: prueba de revancha contra todos los jefes con revancha disponible.
2303. Verificar que ninguna revancha sea obligatoria ni se dispare sola.
2304. Sesión 58: prueba de derrota contra todos los jefes con combate obligatorio.
2305. Verificar que perder nunca deje un estado imposible de recuperar.
2306. Sesión 59: prueba de huida y captura en los combates especiales.
2307. Verificar que la huida imposible esté declarada y avisada.
2308. Sesión 60: partida de cierre completa desde el arranque hasta el último diploma.
2309. Cronometrar la partida de cierre y publicar su duración real.
2310. Firmar el acta de playtest completo en `docs/qa/playtest_acta.md`.
2311. Abrir el carril de rendimiento con la medición de arranque del juego con todo el DLC instalado.
2312. Registrar el tiempo de arranque en `docs/qa/rendimiento.md` con la máquina y la versión usadas.
2313. Medir el tiempo de carga de cada una de las siete regiones nuevas.
2314. Corregir cualquier región que tarde más de lo razonable en cargar su primer mapa.
2315. Medir el uso de memoria en los mapas con más eventos del proyecto.
2316. Reducir los eventos innecesarios en los mapas que superen el techo de memoria.
2317. Verificar que la reducción no quite contenido útil.
2318. Medir la tasa de refresco en Android con Kirin en los mapas más cargados.
2319. Verificar que la tasa se mantenga por encima del umbral fijado en todos los mapas.
2320. Corregir las ralentizaciones causadas por clima, parallax o eventos animados.
2321. Verificar que el parallax de la Cima del Génesis no baje la tasa de refresco.
2322. Verificar que el clima de ventisca no baje la tasa de refresco en Monte Silver.
2323. Verificar que el ciclo de día y noche no baje la tasa de refresco en las ciudades nuevas.
2324. Verificar que las rutinas de NPC móviles no bajen la tasa de refresco en los hubs.
2325. Verificar que las animaciones de autotiles no bajen la tasa de refresco en mapas de agua.
2326. Fijar el presupuesto de eventos por mapa por perfil y hacerlo cumplir en CI.
2327. Fijar el presupuesto de procesos paralelos por mapa y hacerlo cumplir en CI.
2328. Verificar que ningún mapa supere su presupuesto sin justificación escrita.
2329. Auditar los mapas que hoy superan el presupuesto y decidir si se recortan o se justifican.
2330. Recortar los procesos paralelos redundantes detectados en la auditoría.
2331. Verificar que ningún recorte haya roto una escena automática.
2332. Medir el peso final de la carpeta `Data` y compararla con la inicial del plan.
2333. Medir el peso final de `Graphics` y compararlo con la inicial del plan.
2334. Medir el peso final de `Audio` y compararlo con la inicial del plan.
2335. Eliminar los duplicados exactos de audio detectados.
2336. Verificar que ninguna eliminación de audio rompa una referencia de mapa.
2337. Verificar que ningún archivo de audio del DLC esté corrupto o a cero bytes.
2338. Verificar que ninguna pista nueva tenga un bucle con salto audible.
2339. Verificar que el volumen relativo de las pistas nuevas esté equilibrado con las originales.
2340. Verificar que ningún sonido nuevo sature al reproducirse junto a otro.
2341. Medir el peso del paquete final y compararlo con el presupuesto del proyecto.
2342. Verificar que el paquete final no supere el límite acordado sin justificación.
2343. Verificar que el ZIP raíz se pueda construir desde cero de forma reproducible.
2344. Verificar que el ZIP raíz contenga todos los archivos nuevos del plan.
2345. Verificar que el ZIP raíz no contenga archivos de partida ni backups.
2346. Verificar que el ZIP raíz no contenga los archivos de análisis pesados.
2347. Verificar que `.gitignore` cubra todo lo que no debe subir al repositorio.
2348. Verificar que ningún archivo de más de veinte megabytes entre en el repositorio.
2349. Verificar que los archivos grandes se gestionen por paquete y no por commit.
2350. Verificar que las descargas del juego sigan funcionando tras los cambios.
2351. Ejecutar `python tools/kirin_check.py game` sobre la carpeta final.
2352. Corregir cada aviso de Kirin relativo a mayúsculas y minúsculas.
2353. Corregir cada aviso de Kirin relativo a `.rgssad`.
2354. Corregir cada aviso de Kirin relativo a audio ausente o mal nombrado.
2355. Verificar que el juego arranque en Kirin tras cada corrección.
2356. Verificar que el juego arranque en PC tras cada corrección.
2357. Verificar que el juego arranque sin conexión a internet.
2358. Verificar que el juego no escriba nada en la carpeta del sistema.
2359. Verificar que el juego no pida permisos innecesarios en Android.
2360. Verificar que el juego funcione con la pantalla en vertical y en horizontal si lo permite.
2361. Verificar que la interfaz sea legible en pantallas pequeñas.
2362. Verificar que los textos largos no se corten en pantallas pequeñas.
2363. Verificar que la caja de diálogo se adapte sin deformarse.
2364. Verificar que el menú Z sea usable con una sola mano.
2365. Verificar que los atajos del editor no interfieran con el juego.
2366. Verificar que el guardado automático no exista salvo donde el juego lo tenga.
2367. Verificar que el guardado manual funcione en cualquier dimensión nueva.
2368. Verificar que el guardado no crezca sin control por culpa de contadores nuevos.
2369. Verificar que el tamaño del archivo de partida no aumente más allá de lo razonable.
2370. Verificar que las partidas antiguas sigan cargando tras añadir contadores.
2371. Verificar que ninguna partida quede inutilizable tras la actualización.
2372. Verificar que el juego no cree archivos temporales en la carpeta del usuario.
2373. Verificar que el juego no escriba registros de error en la carpeta del juego.
2374. Verificar que cualquier error se muestre con un mensaje claro.
2375. Verificar que el juego no se cierre sin guardar si el guardado falla.
2376. Verificar que el juego avise si el guardado falla.
2377. Verificar que el juego no pierda la partida si se queda sin espacio.
2378. Verificar que el juego maneje correctamente una tarjeta de memoria llena.
2379. Verificar que el juego maneje correctamente un archivo de partida corrupto.
2380. Escribir el protocolo de recuperación de partida en `docs/qa/recuperacion_partida.md`.
2381. Verificar que ese protocolo se pueda seguir sin conocimientos técnicos.
2382. Verificar que existan los backups necesarios para aplicarlo.
2383. Verificar que el editor no bloquee las partidas al abrirlas en modo lectura.
2384. Verificar que el editor avise antes de escribir sobre la carpeta del juego.
2385. Verificar que el editor haga backup antes de cada escritura.
2386. Verificar que el editor pueda restaurar desde su propio backup.
2387. Verificar que el editor no toque ningún archivo fuera de `Data` y `Graphics`.
2388. Verificar que el editor no toque `Game.ini` ni `mkxp.json` sin avisar.
2389. Verificar que el editor muestre el progreso del DLC nuevo correctamente.
2390. Verificar que el editor pueda buscar usos de un switch nuevo del plan.
2391. Verificar que el editor liste los NPC nuevos con su sprite correcto.
2392. Verificar que el editor muestre los mapas nuevos en su árbol.
2393. Verificar que el editor no se bloquee con los 3 468 mapas cargados.
2394. Verificar que el editor tarde lo razonable en abrir la carpeta completa.
2395. Verificar que el editor funcione en Android con permisos SAF.
2396. Verificar que el editor exporte el ZIP completo con los archivos nuevos.
2397. Verificar que el ZIP exportado se pueda aplicar sobre el juego sin romperlo.
2398. Verificar que el ZIP exportado no incluya backups ni partidas.
2399. Verificar que el ZIP exportado conserve las mayúsculas y minúsculas correctas.
2400. Verificar que el ZIP exportado mantenga la estructura de carpetas del juego.
2401. Verificar que todos los recursos nuevos estén con su nombre correcto en el ZIP.
2402. Verificar que ningún recurso nuevo quede fuera del ZIP por error de ruta.
2403. Verificar que el juego cargue los recursos nuevos desde el ZIP exportado.
2404. Verificar que el rendimiento del juego no empeore con el ZIP exportado.
2405. Publicar el informe de rendimiento final en `docs/qa/rendimiento.md`.
2406. Verificar que el informe incluya arranque, carga por región, memoria y tasa de refresco.
2407. Verificar que el informe incluya la comparación con el estado inicial del plan.
2408. Verificar que ninguna regresión de rendimiento quede sin explicar.
2409. Marcar como cerrado el carril de rendimiento con el informe publicado.
2410. Verificar que el juego se sienta igual de fluido que antes del plan.
2411. Abrir el carril de idioma y pulido final del texto visible.
2412. Verificar que todo el texto visible del DLC esté en español.
2413. Verificar que ningún texto visible conserve restos en inglés.
2414. Verificar que los nombres de los Pokémon coincidan con los del juego base.
2415. Verificar que los nombres de los movimientos coincidan con los del juego base.
2416. Verificar que los nombres de los objetos coincidan con los del juego base.
2417. Verificar que los nombres de las medallas coincidan con los documentos.
2418. Verificar que los nombres de los mapas sean legibles y sin abreviaturas raras.
2419. Verificar que los nombres de los NPC tengan sentido y no sean códigos internos.
2420. Verificar que ningún nombre visible contenga guiones bajos ni identificadores.
2421. Verificar que ninguna pantalla muestre rutas de archivo al jugador.
2422. Verificar que ningún mensaje de error muestre detalles técnicos al jugador.
2423. Verificar que las mayúsculas de los títulos sean consistentes en todo el DLC.
2424. Verificar que la puntuación de los diálogos siga el estilo del juego base.
2425. Verificar que los números de los contadores se muestren en el formato correcto.
2426. Verificar que las cantidades de objetos se muestren con el formato del juego base.
2427. Verificar que los textos de opción quepan completos en el menú de elección.
2428. Verificar que las opciones de elección tengan un máximo de cuatro salidas claras.
2429. Verificar que ninguna elección pueda quedar sin salida válida.
2430. Verificar que ninguna elección se pueda cerrar accidentalmente sin elegir.
2431. Verificar que los textos de confirmación sean inequívocos.
2432. Verificar que el texto de guardado no se confunda con el de salida.
2433. Verificar que los avisos de riesgo avisen de verdad del riesgo.
2434. Escribir la guía de estilo de texto del proyecto en `docs/qa/estilo_texto.md`.
2435. Verificar que la guía recoja las decisiones tomadas en las reescrituras.
2436. Verificar que la guía incluya ejemplos correctos y prohibidos.
2437. Añadir a la guía la lista de términos del glosario con su uso.
2438. Verificar que el glosario y la guía no se contradigan.
2439. Verificar que todo texto nuevo del plan cumpla la guía.
2440. Verificar que la guía se aplique también a los textos del editor.
2441. Preparar la revisión externa del texto por una persona ajena al proyecto.
2442. Escribir la hoja de revisión externa con los criterios a evaluar.
2443. Recoger los hallazgos de la revisión externa en `docs/qa/revision_externa.md`.
2444. Corregir los hallazgos de claridad señalados por la revisión externa.
2445. Verificar que las correcciones no rompan el tono del proyecto.
2446. Verificar que las correcciones no rompan ninguna condición de evento.
2447. Repetir la revisión externa sobre los bloques corregidos.
2448. Verificar que la segunda revisión no repita los mismos hallazgos.
2449. Publicar el resumen de la revisión externa en el informe de entrega.
2450. Verificar que los créditos reconozcan la revisión externa si corresponde.
2451. Preparar la revisión externa del juego completo por un jugador nuevo.
2452. Escribir el guion de esa revisión con el mismo recorrido del playtest maestro.
2453. Recoger sus hallazgos sin filtrarlos por lo que el equipo ya sabe.
2454. Clasificar los hallazgos del jugador nuevo por gravedad.
2455. Corregir los hallazgos de confusión antes que los cosméticos.
2456. Verificar que la curva de dificultad no se rompa con esas correcciones.
2457. Repetir el recorrido del jugador nuevo tras las correcciones.
2458. Verificar que las confusiones señaladas hayan desaparecido.
2459. Publicar el acta de la revisión externa en `docs/qa/acta_revision_externa.md`.
2460. Verificar que el acta liste cada hallazgo con su resolución.
2461. Revisar la accesibilidad del texto para lectores con dificultades visuales.
2462. Verificar el contraste de la caja de diálogo sobre fondos claros.
2463. Verificar el contraste del menú nuevo sobre fondos oscuros.
2464. Verificar el tamaño de fuente de los textos nuevos frente al original.
2465. Verificar que ningún texto nuevo use solo color para transmitir información.
2466. Verificar que los iconos nuevos se entiendan sin texto.
2467. Verificar que las medallas se distingan sin depender del color.
2468. Verificar que los estados de progreso se distingan sin depender del color.
2469. Verificar que los avisos de riesgo usen icono y texto.
2470. Verificar que los puzles se puedan resolver sin audición si el juego lo permite.
2471. Verificar que ninguna pista clave sea solo sonora.
2472. Verificar que ninguna pista clave sea solo visual y efímera.
2473. Verificar que las pistas duren en pantalla lo suficiente para leerse.
2474. Verificar que ninguna pista aparezca y desaparezca en menos de un segundo.
2475. Verificar que el jugador pueda repetir cualquier pista perdida.
2476. Verificar que los NPC repitan su información clave si se les vuelve a hablar.
2477. Verificar que los carteles se puedan releer cuantas veces haga falta.
2478. Verificar que los diarios o resúmenes del juego recojan las pistas importantes.
2479. Verificar que el resumen de progreso sea suficiente para no perderse.
2480. Verificar que el resumen de progreso no destripe contenido no visto.
2481. Verificar que el resumen de progreso se actualice al instante.
2482. Verificar que el resumen de progreso funcione tras cargar partida.
2483. Verificar que el resumen de progreso no ocupe más de una pantalla.
2484. Verificar que el resumen de progreso se lea bien en pantalla pequeña.
2485. Verificar que el resumen de progreso esté accesible desde el menú Z.
2486. Verificar que el acceso al resumen no esté detrás de un objeto.
2487. Verificar que el resumen no rompa ninguna escena si se abre a mitad de evento.
2488. Verificar que el resumen se pueda cerrar con el mismo botón que lo abre.
2489. Verificar que el resumen no consuma recursos mientras está cerrado.
2490. Marcar como cerrado el carril de idioma y accesibilidad con el acta publicada.
2491. Abrir el carril de entrega: reconstruir el paquete completo desde el estado verificado.
2492. Ejecutar `npm run build:package` y `npm run verify:package` antes de cualquier otra cosa.
2493. Reconstruir el ZIP de scripts corregidos con `npm run build:corregido:zip`.
2494. Verificar el ZIP con `npm run verify:corregido:zip`.
2495. Reconstruir el paquete de QA del Nightmare con `npm run build:dn:qa`.
2496. Verificar con `npm run verify:dn:qa`.
2497. Sincronizar el paquete de La Ruta de Dios con `npm run sync:ruta_de_dios:package`.
2498. Verificar con `npm run verify:ruta_de_dios:package`.
2499. Reconstruir el paquete de expansión con `npm run build:expansion:package`.
2500. Verificar con `npm run verify:expansion:package`.
2501. Regenerar el paquete de referencia de mapas con `npm run create:map-reference`.
2502. Verificar con `npm run verify:map-reference`.
2503. Regenerar las referencias visuales de Atlas y de los macrobloques Tier 2.
2504. Verificar que las referencias visuales nuevas muestren la mejora real.
2505. Verificar que el paquete final incluya todo lo generado por este plan.
2506. Verificar que el paquete final no incluya artefactos temporales.
2507. Verificar que el paquete final no incluya backups ni partidas.
2508. Verificar que el paquete final se pueda instalar sobre una copia limpia del juego.
2509. Instalar el paquete sobre una copia limpia y arrancar el juego.
2510. Recorrer el contenido nuevo desde esa copia limpia.
2511. Verificar que ninguna dependencia del entorno de desarrollo haga falta para jugar.
2512. Verificar que el paquete funcione en un equipo distinto del que lo construyó.
2513. Verificar que el paquete funcione en Android desde cero.
2514. Verificar que el paquete se pueda desinstalar dejando el juego original intacto.
2515. Verificar que la desinstalación use solo los originales de `PokeModBackups`.
2516. Verificar que los originales de `PokeModBackups` estén completos y sin corromper.
2517. Verificar que cualquier instalador pueda repetirse sobre sí mismo sin efectos dobles.
2518. Verificar que repetir un instalador no duplique eventos ni switches.
2519. Verificar que repetir un instalador no duplique objetos ni entrenadores.
2520. Verificar que repetir un instalador no duplique medallas ni recompensas.
2521. Verificar que repetir un instalador no duplique mapas ni entradas de `MapInfos`.
2522. Verificar que repetir un instalador no duplique entradas de `trainers.dat`.
2523. Verificar que repetir un instalador no duplique entradas de `items.dat`.
2524. Verificar que repetir un instalador no duplique tablas de `encounters.dat`.
2525. Verificar que repetir un instalador no altere el orden de los datos originales.
2526. Verificar que cualquier instalador del plan declare su versión y su fecha.
2527. Verificar que cualquier instalador del plan pueda informar de si ya se aplicó.
2528. Verificar que `npm run verify:all` pase completo sobre el estado final.
2529. Verificar que cada verificador del proyecto siga teniendo su par de instalador.
2530. Verificar que ningún instalador haya quedado sin verificador tras el plan.
2531. Verificar que ningún verificador haya quedado sin datos que comprobar.
2532. Ejecutar la suite completa y archivar su salida en `docs/qa/cierre_verify_all.txt`.
2533. Ejecutar `npm test` y archivar su salida en `docs/qa/cierre_npm_test.txt`.
2534. Ejecutar `npm run test:ui` y archivar su salida.
2535. Ejecutar los verificadores de las siete regiones y archivarlos juntos.
2536. Ejecutar los verificadores de las cinco campañas y archivarlos juntos.
2537. Ejecutar los verificadores del Nightmare y archivarlos juntos.
2538. Ejecutar los verificadores de Arceus y archivarlos juntos.
2539. Ejecutar los verificadores de Atlas y archivarlos juntos.
2540. Verificar que ningún archivo de cierre de verificación tenga errores sin resolver.
2541. Contar los verificadores del proyecto y comparar con el conteo inicial del plan.
2542. Publicar el cuadro de verificadores final en `docs/qa/verificadores_final.md`.
2543. Actualizar `docs/ESTADO_CONGELADO.md` con el inventario final y los hashes.
2544. Regenerar `node tools/inventario_congelado.mjs` y confirmar el conteo final de archivos.
2545. Verificar con `node tools/inventario_congelado.mjs --verify` que el estado final es estable.
2546. Verificar que la porción no asignada del rango reservado siga documentada al día.
2547. Verificar que no existan colisiones de IDs en el estado final.
2548. Verificar que no existan switches huérfanos en el estado final.
2549. Verificar que no existan variables sin lector en el estado final.
2550. Verificar que no existan mapas sin nombre en el estado final.
2551. Verificar que no existan mapas sin música en el estado final.
2552. Verificar que no existan warps a celdas sólidas en el estado final.
2553. Verificar que no existan recursos referenciados y ausentes en el estado final.
2554. Verificar que no existan diálogos vacíos en el estado final.
2555. Verificar que no existan llamadas de script colgantes en el estado final.
2556. Verificar que no existan bucles sin condición de salida en el estado final.
2557. Verificar que no existan eventos automáticos reejecutables en el estado final.
2558. Publicar el cuadro de cero errores conocidos en `docs/qa/cero_errores.md`.
2559. Actualizar `docs/PROMPT_MAESTRO_Y_ESTADO.md` con el estado final medido.
2560. Actualizar `docs/DLC_TOTAL.md` con los seis pilares al nivel declarado.
2561. Actualizar `docs/ENTREGA_PROYECTO.md` con la entrega de las 2 700 fases.
2562. Actualizar `docs/ENTREGA_DLC_COMPLETO.md` con las siete regiones y las cinco campañas.
2563. Actualizar `docs/INSTALAR_Y_JUGAR.md` con la ruta completa y los tiempos reales.
2564. Actualizar `docs/QA_MANUAL_PLAYTEST.md` con el guion de sesiones del plan.
2565. Actualizar `docs/CAMPANAS_ROM_COMPLETAS.md` con el estado final de las cinco campañas.
2566. Actualizar `docs/MULTIVERSO_CREEPYPASTA.md` con las siete emisiones ampliadas.
2567. Actualizar `docs/INFORME_LA_RUTA_DE_DIOS.md` con la densidad final de los pisos.
2568. Actualizar `docs/INFORME_FIRE_ASH_ISLA_ESPEJO.md` con el estado final.
2569. Actualizar `docs/INFORME_HORIZONTES_500.md` con el estado final.
2570. Actualizar `docs/ATLAS_MIL_TRES_AVENTURAS.md` y los documentos de Tier con la densidad nueva.
2571. Actualizar `docs/DIMENSIONAL_NIGHTMARE/13_PLAN_DE_CIERRE.md` con lo cerrado.
2572. Actualizar `docs/AUDITORIA_TOTAL_FLAGS.md` con el consumo final de IDs.
2573. Actualizar `docs/PLAN_FUSION_3_JUEGOS.md` con el resultado de cada pilar.
2574. Actualizar `docs/PLAN_SWARM_161.md` con lo que se ejecutó de forma efectiva.
2575. Escribir el documento de cierre del plan en `docs/CIERRE_2700_FASES.md`.
2576. Verificar que ese documento enlace las tres partes del plan.
2577. Verificar que el documento de cierre liste los conteos por bloque.
2578. Verificar que el documento de cierre liste los verificadores en verde.
2579. Verificar que el documento de cierre declare lo que queda fuera de alcance y por qué.
2580. Escribir el changelog del plan agrupado por bloques.
2581. Verificar que el changelog no liste cambios que no existan en el repositorio.
2582. Verificar que el changelog sea legible por alguien ajeno al proyecto.
2583. Escribir el acta de entrega con fecha, versión y firmas de verificación.
2584. Verificar que el acta incluya el hash del paquete entregado.
2585. Verificar que el acta incluya la lista de archivos del paquete.
2586. Verificar que el acta incluya el procedimiento de instalación en cinco minutos.
2587. Verificar que el acta incluya el procedimiento de desinstalación.
2588. Verificar que el acta incluya el protocolo de reporte de errores.
2589. Escribir la plantilla de reporte de errores para el jugador.
2590. Verificar que la plantilla pida lo mínimo necesario para reproducir un fallo.
2591. Verificar que la plantilla no pida datos personales.
2592. Verificar que la plantilla se pueda rellenar sin conocimientos técnicos.
2593. Publicar la entrega en el repositorio con su paquete y sus informes.
2594. Verificar que la entrega se pueda descargar completa.
2595. Verificar que la entrega descargada se pueda instalar sin pasos extra.
2596. Verificar que la entrega incluya la guía de instalación en su raíz.
2597. Verificar que la entrega incluya los créditos y las atribuciones.
2598. Verificar que la entrega no incluya material no redistribuible.
2599. Verificar que la entrega no incluya arte de fangames ajenos.
2600. Verificar que la entrega no incluya los mosaicos derivados de ROM invitada.
2601. Verificar que la entrega no incluya partidas de prueba ni backups personales.
2602. Ejecutar una última instalación limpia desde la entrega descargada.
2603. Jugarla hasta el primer gimnasio nuevo sin usar ninguna herramienta de desarrollo.
2604. Verificar que esa partida no produzca ningún error en el registro.
2605. Verificar que esa partida no produzca ningún cuelgue.
2606. Verificar que esa partida no produzca ningún texto ilegible.
2607. Continuar esa partida hasta el postgame.
2608. Verificar que el acceso al postgame funcione desde una partida limpia.
2609. Continuar hasta la Liga Oscura y obtener su Diploma.
2610. Continuar hasta el campeón de cada una de las siete regiones.
2611. Verificar que el tiempo total de esa partida sea el publicado en la guía.
2612. Verificar que ninguna dimensión se haya quedado sin visitar en esa partida.
2613. Verificar que ningún contenido prometido haya quedado fuera de alcance.
2614. Firmar el acta final de la partida de cierre.
2615. Sustituir la reserva fija por un ciclo con criterio de salida: defecto detectado, reproducido, corregido con regresión y reverificado.
2616. Documentar que ningún plan puede prever todos los defectos de un juego de esta escala.
2617. Repetir el ciclo con una ronda completa de juego hasta que la tasa de descubrimiento sea cero en tres sesiones consecutivas.
2618. Prohibir cerrar el plan con un solo defecto abierto, aunque sea cosmético, y prohibir declararlo "conocido" para saltarlo.
2619. Documentar el procedimiento de priorización de defectos durante esos cierres.
2620. Cerrar cada defecto con su prueba de regresión antes de darlo por resuelto.
2621. Verificar que ningún defecto se cierre sin reproducirlo antes.
2622. Verificar que ningún defecto se cierre sin comprobar que no afecta a otra dimensión.
2623. Verificar que ninguna corrección tardía rompa un verificador en verde.
2624. Ejecutar `npm run verify:all` después de cada corrección tardía.
2625. Mantener el registro de defectos en `docs/qa/defectos.md` con su estado.
2626. Verificar que ese registro no tenga entradas sin cerrar al final del plan.
2627. Documentar los defectos conocidos que se decidan no corregir y su motivo.
2628. Verificar que ninguno de esos defectos impida terminar el juego.
2629. Verificar que ninguno de esos defectos afecte a una partida guardada.
2630. Verificar que el jugador esté informado de cualquier limitación conocida.
2631. Escribir la sección de limitaciones conocidas en la guía de instalación.
2632. Verificar que la sección de limitaciones no ahuyente sin motivo.
2633. Verificar que la sección de limitaciones sea honesta y concreta.
2634. Publicar la versión final del paquete con las limitaciones documentadas.
2635. Congelar el repositorio con la etiqueta de la entrega final.
2636. Verificar que la etiqueta apunte al commit correcto.
2637. Verificar que el commit final pase la CI completa.
2638. Verificar que la CI incluya los verificadores de las siete regiones.
2639. Verificar que la CI incluya los verificadores de las cinco campañas.
2640. Verificar que la CI incluya el control de formato de diálogos.
2641. Verificar que la CI incluya el control de densidad de mapas.
2642. Verificar que la CI incluya el control del checklist de diez puntos.
2643. Verificar que el tiempo total de la CI sea razonable para el proyecto.
2644. Verificar que la CI falle si se rompe cualquiera de esos controles.
2645. Escribir la guía de mantenimiento del proyecto tras la entrega.
2646. Verificar que la guía explique cómo añadir un mapa nuevo sin romper nada.
2647. Verificar que la guía explique cómo añadir una región nueva siguiendo el pipeline.
2648. Verificar que la guía explique qué IDs quedan libres para el futuro.
2649. Verificar que la guía explique cómo se ejecutan los verificadores por bloque.
2650. Verificar que la guía explique cómo restaurar cualquier cambio desde backup.
2651. Verificar que la guía esté escrita para alguien que nunca ha tocado el proyecto.
2652. Verificar que la guía incluya un ejemplo completo de contenido nuevo de punta a punta.
2653. Verificar que el ejemplo se pueda copiar y ejecutar tal cual.
2654. Verificar que el ejemplo no escriba nada fuera de su carpeta de prueba.
2655. Verificar que el ejemplo deje el árbol como estaba al terminar.
2656. Escribir el mapa de conocimiento del proyecto: qué documento responde a qué pregunta.
2657. Verificar que ese mapa enlace cada hueco conocido con su documento.
2658. Verificar que ningún documento del proyecto quede sin enlazar desde el mapa.
2659. Verificar que ningún documento del proyecto contradiga a otro.
2660. Auditar los documentos contradictorios y fijar la versión correcta.
2661. Verificar que la documentación describa el proyecto real y no una versión soñada.
2662. Verificar que ninguna cifra de la documentación sea una estimación sin marcar.
2663. Verificar que todas las cifras publicadas se puedan regenerar con una herramienta.
2664. Verificar que cada cifra publicada tenga su comando de regeneración al lado.
2665. Verificar que los comandos de regeneración funcionen en un clon limpio.
2666. Verificar que el clon limpio pueda reconstruir el paquete completo desde cero.
2667. Medir el tiempo de reconstrucción completa en un clon limpio.
2668. Verificar que ese tiempo sea compatible con el flujo de trabajo del proyecto.
2669. Verificar que la reconstrucción no dependa de archivos fuera del repositorio.
2670. Verificar que la reconstrucción no dependa de las ROMs invitadas.
2671. Documentar qué partes del proyecto sí dependen de las ROMs y por qué.
2672. Verificar que esas partes queden desactivadas por defecto si faltan las ROMs.
2673. Verificar que el juego siga completo y jugable sin las ROMs.
2674. Verificar que el postgame entero funcione sin las ROMs presentes.
2675. Verificar que las cinco campañas funcionen sin las ROMs presentes.
2676. Verificar que las siete regiones funcionen sin las ROMs presentes.
2677. Verificar que el editor funcione sin las ROMs presentes.
2678. Verificar que los verificadores funcionen sin las ROMs presentes.
2679. Verificar que la documentación avise de qué se pierde sin las ROMs.
2680. Verificar que nada del juego dependa de archivos generados en la sesión.
2681. Revisar el árbol de trabajo y vaciar cualquier archivo temporal.
2682. Verificar que el repositorio quede limpio y solo con lo entregable.
2683. Revisar el tamaño del repositorio tras el plan.
2684. Verificar que ningún archivo grande se haya colado en el historial reciente.
2685. Verificar que los paquetes pesados se gestionen por enlaces o por carpeta externa.
2686. Revisar el historial de commits del plan y su legibilidad.
2687. Verificar que cada commit del plan tenga un mensaje que describa su bloque.
2688. Verificar que el historial permita revertir un bloque sin revertir los demás.
2689. Probar la reversión de un bloque de contenido y restaurar después.
2690. Documentar la prueba de reversión en `docs/qa/reversion_bloque.md`.
2691. Verificar que la entrega final esté firmada por los verificadores en verde.
2692. Verificar que la entrega final esté firmada por el playtest completo.
2693. Verificar que la entrega final esté firmada por la revisión externa.
2694. Verificar que la entrega final declare el alcance exacto de lo entregado.
2695. Verificar que la entrega final declare lo que queda abierto para versiones futuras.
2696. Redactar el párrafo de cierre del proyecto con los seis pilares al nivel declarado.
2697. Verificar que ese párrafo no exagere nada de lo realmente entregado.
2698. Publicar la entrega final y comunicar el cierre del plan de 2 700 fases.
2699. Hacer una última partida de punta a punta sobre la entrega publicada y firmarla.
2700. Cerrar las 2 700 fases con siete regiones, cinco campañas, seis dimensiones, cero errores conocidos y el juego entero jugado de principio a fin.
