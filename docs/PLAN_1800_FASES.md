901. Abrir el carril de construcción masiva: cada fase de este bloque escribe contenido real en mapas, no auditoría.
902. Unificar el motor de construcción en `tools/lib/region_builder.mjs` y `tools/lib/dimension_builder.mjs` para que ninguna región se genere a mano alzada.
903. Validar los esquemas `content/schemas/region_builder_v1.schema.json` y `content/schemas/tier1_map.schema.json` antes de aceptar cualquier lote.
904. Fijar la unidad de trabajo "lote de 63 mapas" heredada de los macrobloques Tier 1 y usarla en todas las dimensiones grandes.
905. Ampliar `docs/AUTORIA_REGION_BUILDER_STUDIO.md` con la receta completa de autoría de una región en un solo documento.
906. Escribir el catálogo de perfiles de mapa: ciudad, ruta, cueva, bosque, costa, gimnasio, interior de casa, laboratorio, tienda, centro y mazmorra.
907. Crear `content/plan2700_perfiles.json` con el mínimo obligatorio de contenido de cada perfil de mapa.
908. Prohibir en todo mapa nuevo la simetría axial deliberada: bordes rotos, esquinas ciegas y asimetría con propósito.
909. Prohibir las arenas cuadradas de relleno y las rutas principales rectas de más de doce celdas consecutivas.
910. Exigir un desnivel legible cada veinte celdas de camino exterior: escalera, cornisa o rampa con sombra coherente.
911. Exigir al menos dos recodos y un espacio secundario con propósito en cada mapa de ruta.
912. Exigir que cada mapa tenga un motivo decorativo propio de cuatro a seis detalles antes de tocar su layout.
913. Prohibir que un mapa se resuelva como pasillo de un solo carril sin alternativa de cruce.
914. Verificar que todo destino obligatorio de un mapa sea alcanzable desde cualquier entrada con el caminante automático.
915. Añadir a `tools/lib/dimension_builder.mjs` el test de topología que detecta áreas inalcanzables antes de publicar un lote.
916. Añadir al mismo test la detección de simetría exacta por reflexión horizontal y vertical.
917. Añadir la detección de rutas principales rectas y de habitaciones de relleno sin contenido.
918. Rechazar automáticamente cualquier mapa que no supere los tres tests anteriores.
919. Decidir explícitamente en cada ciudad si el centro Pokémon, la tienda o ambos entran en el mapa o quedan en interiores.
920. Verificar que ninguna ciudad quede sin punto de curación accesible a menos de dos mapas de distancia.
921. Verificar que ninguna ciudad quede sin tienda de objetos básicos si su narrativa lo permite.
922. Prohibir que un gimnasio ocupe el mapa completo: debe tener antesala, sala de líder y salida clara.
923. Exigir puzle propio en cada gimnasio: interruptores, placas, empujones de roca o giros de teletransporte.
924. Verificar que el puzle del gimnasio se pueda resolver sin reiniciar el mapa.
925. Exigir ruta de retorno corta después de cada puzle resuelto.
926. Escribir el catálogo de interiores artesanales en `content/plan2700_interiores.json` con doce plantas base.
927. Prohibir interiores generados como plano automático en ciudades: cada edificio visitable tiene muebles y NPC con voz.
928. Exigir que cada interior tenga al menos un objeto examinable que aporte algo al mundo.
929. Exigir que cada interior tenga su propio ancho y alto, sin calcar la misma habitación en toda una región.
930. Verificar que ningún interior tenga más de un warp de entrada duplicado que confunda al jugador.
931. Fijar el contenido mínimo de un mapa de ruta: encuentros, cartel, dos NPC o uno y un objeto, y un secreto.
932. Fijar el contenido mínimo de un mapa de cueva: bifurcación real, objeto oculto y salida redundante.
933. Fijar el contenido mínimo de un mapa de ciudad: curación, comercio, dos NPC informativos y un rumor del capítulo activo.
934. Fijar el contenido mínimo de un mapa de gimnasio: antesala, puzle, líder, medalla y texto de despedida.
935. Fijar el contenido mínimo de un mapa de guarida: entrada vigilada, tres salas con función y jefe final.
936. Verificar que cada mapa cumpla el mínimo de su perfil antes de entrar en el lote.
937. Medir la densidad real de cada mapa nuevo en eventos, páginas y comandos y guardarla en `content/plan2700_densidad.json`.
938. Fijar el umbral de calidad: ninguna ruta nueva por debajo de 12 eventos, 18 páginas y 120 comandos.
939. Fijar el umbral de calidad: ninguna ciudad nueva por debajo de 20 eventos, 30 páginas y 250 comandos.
940. Fijar el umbral de calidad: ningún gimnasio nuevo por debajo de 8 eventos, 12 páginas y 90 comandos.
941. Fijar el umbral de calidad: ningún interior visitable por debajo de 2 eventos y 6 comandos.
942. Comparar cada umbral con el estándar medido de Fire Ash original y de Horizontes antes de aprobarlo.
943. Publicar el cuadro de umbrales en `docs/qa/umbrales_densidad.md` para que cualquier autor lo consulte.
944. Crear `tools/plan2700/medir_densidad.mjs` que recorra un lote y devuelva el cuadro por mapa.
945. Añadir ese medidor al flujo de CI para que ningún lote por debajo del umbral se pueda fusionar.
946. Crear el tablero de avance de regiones en `content/plan2700_avance.json` con una entrada por mapa.
947. Exigir que cada mapa declarado en ese tablero tenga autor, fecha, perfil y verificador.
948. Prohibir marcar un mapa como terminado sin su verificador en verde.
949. Definir la semilla determinista por lote para que dos ejecuciones produzcan el mismo mapa.
950. Documentar la semilla usada por cada lote en el propio JSON del lote.
951. Verificar que regenerar un lote con su semilla no modifique ni una celda.
952. Exigir backup automático de cada mapa antes de escribirlo, en `PokeModBackups/plan2700_<lote>`.
953. Verificar que ningún lote escriba más de 63 mapas sin checkpoint intermedio.
954. Escribir cada mapa con archivo temporal y renombrado final para que un fallo no deje medio mapa.
955. Verificar la integridad zlib de cada mapa escrito antes de continuar con el siguiente.
956. Ejecutar `npm run verify:mapas` al terminar cada lote y detener la cadena si falla.
957. Ejecutar `npm run verify:event-collision` y `npm run verify:save-path` al terminar cada lote.
958. Registrar en el acta del lote los mapas escritos, el espacio libre restante y el hash de cada archivo.
959. Prohibir que un lote toque mapas fuera de su rango asignado.
960. Prohibir que un lote reutilice un ID de tileset sin registrarlo antes en `Tilesets.rxdata`.
961. Verificar que cada tileset nuevo del lote tenga su gráfico presente y su nombre legible.
962. Verificar que cada mapa del lote tenga `@tileset_id` válido y autotiles sin costuras.
963. Verificar que cada mapa del lote tenga música asignada y que la pista exista en `Audio/BGM`.
964. Verificar que cada mapa exterior del lote tenga clima declarado o justificación escrita de su ausencia.
965. Verificar que cada mapa del lote tenga paso de encuentros coherente con su perfil.
966. Verificar que cada warp del lote apunte a coordenada transitable y con dirección válida.
967. Verificar que cada warp del lote tenga su vuelta registrada en el mapa de destino.
968. Prohibir warps de sentido único que atrapen al jugador en el mapa de llegada.
969. Verificar que ninguna transferencia del lote cruce a un mapa fuera del rango del lote sin declararlo.
970. Verificar que cada mapa del lote declare su nombre en `MapInfos.rxdata` y en `map_metadata.dat`.
971. Verificar que `map_metadata.dat` reciba el nombre, el clima y el tipo de terreno correctos de cada mapa nuevo.
972. Verificar que `MapInfos.rxdata` conserve el árbol de padres sin corrimiento de índices.
973. Verificar que el mapa padre de cada mapa nuevo exista y tenga sentido geográfico.
974. Prohibir que un mapa nuevo cuelgue del árbol de una región original de Fire Ash sin justificación.
975. Auditar la lista de mapas sin padre al cerrar cada lote y asignarles uno o documentar por qué no lo tienen.
976. Verificar que cada mapa nuevo aparezca en el mapa del mundo solo si su región lo exige.
977. Verificar que las posiciones regionales no se pisen entre mapas nuevos.
978. Prohibir que un mapa nuevo herede el nombre de otro mapa ya existente.
979. Verificar que los nombres de mapa usen el idioma y el estilo del juego sin anglicismos.
980. Verificar que cada mapa del lote tenga al menos una entrada y una salida verificadas con el caminante automático.
981. Verificar que el caminante automático recorra cada mapa del lote sin quedarse atascado.
982. Verificar que ningún mapa del lote tenga celdas sólidas huérfanas rodeadas de transitable.
983. Verificar que ninguna celda de hierba alta quede dentro de una pared o inalcanzable.
984. Verificar que las zonas de agua de cada mapa del lote sean navegables si tienen tabla de encuentros de surf.
985. Verificar que cada mapa con escaleras tenga su colisión alineada con el dibujo.
986. Verificar que ninguna puerta del lote quede sin sonido de apertura.
987. Verificar que ningún cartel del lote apunte a un mapa o a un texto equivocado.
988. Verificar que ningún objeto oculto del lote esté en una celda intransitable.
989. Verificar que ningún objeto oculto del lote se pueda recoger dos veces.
990. Verificar que ningún objeto oculto del lote entregue un objeto inexistente en `items.dat`.
991. Ejecutar `npm run verify:regiones` al cerrar cada lote y archivar la salida con el número de lote.
992. Escribir el acta de lote en `docs/qa/lotes/lote_<NN>.md` con el resumen de la puerta de calidad.
993. Revisar el acta anterior antes de abrir el lote siguiente y corregir cualquier desviación repetida.
994. Fijar el tiempo máximo por lote de 63 mapas antes de repartirlo en dos ejecuciones.
995. Prohibir lotes de más de 63 mapas aunque la memoria lo permita: la revisión humana se degrada.
996. Exigir revisión humana del 100 % de los mapas de ciudad y gimnasio, y del 20 % del resto del lote.
997. Registrar en el acta qué mapas pasaron revisión humana y cuáles solo automática.
998. Prohibir cerrar un lote con mapas rechazados en revisión humana sin reescribirlos.
999. Crear la plantilla de ficha visual de mapa en `docs/qa/ficha_visual_mapa.md` y usarla en todo mapa revisado.
1000. Fijar el punto de control del kilómetro mil de este plan: todos los lotes anteriores con acta cerrada.
1001. Abrir el carril de interiores artesanales de ciudad con una tabla de edificios por ciudad nueva.
1002. Escribir doce plantas base de interior y prohibir su uso literal: cada uso debe variar muebles y tamaño.
1003. Definir los tipos de interior obligatorios por ciudad: curación, tienda, casa del líder, casa de vecino y edificio singular.
1004. Verificar que cada interior tenga iluminación coherente con su tileset y sin zonas ciegas.
1005. Verificar que ningún interior tenga paredes de un solo tile de grosor sin remate superior.
1006. Verificar que las alfombras y los muebles no tapen la salida ni el warp de entrada.
1007. Verificar que los NPC de interior no bloqueen el paso al jugador en pasillos de una celda.
1008. Verificar que cada interior tenga su música propia o la del edificio al que pertenece.
1009. Verificar que ningún interior herede los encuentros salvajes del mapa exterior.
1010. Verificar que ningún interior tenga clima activo declarado.
1011. Verificar que las escaleras de interior conecten plantas reales y no bucles.
1012. Verificar que los edificios de dos plantas tengan su planta alta alcanzable y con contenido.
1013. Verificar que ninguna planta alta quede como habitación vacía de relleno.
1014. Verificar que cada edificio singular de una ciudad tenga una función narrativa declarada.
1015. Verificar que los interiores de las cinco campañas ROM sigan la misma regla artesanal.
1016. Crear `tools/plan2700/generar_lote.mjs` que componga un lote completo desde su JSON de autoría.
1017. Crear `tools/plan2700/verificar_lote.mjs` que agrupe todas las puertas de calidad de este bloque.
1018. Añadir `npm run plan2700:lote` y `npm run plan2700:verify` al `package.json`.
1019. Verificar que ambos comandos funcionen sobre un lote vacío sin escribir nada.
1020. Verificar que ambos comandos funcionen sobre un lote completo sin tocar mapas originales.
1021. Probar el pipeline completo sobre un lote de prueba de tres mapas descartables fuera del juego.
1022. Probar la restauración desde backup de ese lote y comprobar que el juego queda idéntico al estado previo.
1023. Documentar la prueba de restauración en `docs/qa/rollback_lote.md` con los hashes antes y después.
1024. Medir el tiempo real de construcción y verificación de un lote de 63 mapas.
1025. Fijar el presupuesto de tiempo por lote y ajustar la composición si se excede.
1026. Medir el tamaño en disco añadido por cada lote de 63 mapas.
1027. Verificar que el peso añadido por lote no comprometa el tamaño del paquete final.
1028. Registrar en el acta de lote el peso antes y después de cada escritura.
1029. Auditar que los mapas nuevos no dupliquen el mismo `@data` exacto entre sí.
1030. Auditar que ningún mapa nuevo sea copia literal de un mapa original de Fire Ash.
1031. Auditar que ningún mapa nuevo sea copia literal de otro mapa nuevo salvo variantes declaradas.
1032. Verificar que las variantes declaradas de un mismo plano tengan al menos un 30 % de diferencia real.
1033. Verificar que las zonas de hierba de cada ruta nueva tengan forma irregular y no rectangular.
1034. Verificar que los lagos y ríos de cada mapa nuevo tengan contorno natural y no rectangular.
1035. Verificar que los acantilados de cada mapa nuevo tengan remate superior y sombra coherente.
1036. Verificar que las cuevas nuevas tengan techos de tres tiles y no paredes de un tile pegadas al techo.
1037. Verificar que los mapas de nieve y hielo no mezclen tilesets de otras estaciones.
1038. Verificar que los mapas de costa usen la orilla animada correcta del tileset de la región.
1039. Verificar que los mapas de ciudad tengan suelos variados y aceras sin líneas rectas infinitas.
1040. Verificar que ninguna calle de ciudad atraviese un edificio por error de composición.
1041. Verificar que las vallas y los postes de un mapa no bloqueen pasos obligatorios.
1042. Verificar que ningún árbol tapado por otro cree una celda intransitable invisible.
1043. Verificar que los puentes de los mapas nuevos tengan barandas y colisión correcta.
1044. Verificar que los puentes permitan el paso por agua debajo si la región lo exige.
1045. Verificar que los mapas con niebla tengan su capa por encima de los personajes y sin tapar la interfaz.
1046. Verificar que el clima de cada mapa nuevo se apague al salir y no se arrastre a otro mapa.
1047. Verificar que el tono de pantalla de cada mapa nuevo se restaure al volver al mundo.
1048. Verificar que ninguna cinemática de mapa nuevo se dispare antes de que el jugador pueda moverse.
1049. Verificar que cada mapa nuevo se abra sin bloquear el control más de lo necesario.
1050. Verificar que el jugador conserve el control al cruzar todos los mapas nuevos de un lote.
1051. Auditar la lista completa de acciones mecánicas permitidas en un mapa nuevo y prohibir las demás.
1052. Prohibir cambios de tileset en vivo durante el juego salvo justificación escrita.
1053. Prohibir teletransportes sin aviso al jugador.
1054. Prohibir bloqueos de salida sin alternativa documentada.
1055. Prohibir eventos automáticos que se reejecuten al reentrar en el mapa.
1056. Prohibir procesos paralelos que consuman el turno de movimiento del jugador.
1057. Prohibir combates automáticos sin diálogo previo.
1058. Prohibir retirada de objetos sin mensaje de texto.
1059. Prohibir mensajes en pantalla sin caja de diálogo configurada.
1060. Prohibir cualquier texto que no pase por el ancho estándar de la caja del juego.
1061. Fijar la convención de nombres de eventos nuevos: `PokeMod <bloque> <acción>`.
1062. Fijar la convención de nombres de switches nuevos: `POKEMOD 2700 <bloque> <acción>`.
1063. Fijar la convención de nombres de variables nuevas: `POKEMOD 2700 <bloque> <contador>`.
1064. Verificar que ninguna convención nueva colisione con las convenciones de los bloques 1–900.
1065. Verificar que el rango reservado siga libre antes de consumir cualquier ID nuevo.
1066. Reservar ahora, por escrito, el bloque de IDs que consumirán los lotes de este plan.
1067. Documentar la reserva en `docs/qa/reserva_ids_2700.md` con rango, uso y fecha.
1068. Verificar con `node tools/inventario_congelado.mjs --verify` que la reserva no pise nada existente.
1069. Añadir a `tools/plan2700/verificar_lote.mjs` la comprobación de que ningún ID fuera de la reserva se use.
1070. Añadir la comprobación de que ningún ID reservado quede a medias entre dos lotes.
1071. Auditar al cerrar cada lote cuántos IDs de la reserva se consumieron realmente.
1072. Ajustar la reserva si el consumo real se desvía más de un veinte por ciento.
1073. Verificar que cada switch nuevo tenga un lector declarado antes de crearlo.
1074. Verificar que cada variable nueva tenga un escritor y un lector declarados antes de crearla.
1075. Prohibir switches de un solo uso sin guarda de idempotencia.
1076. Prohibir contadores que puedan volver a cero al recargar la partida.
1077. Verificar que ningún contador nuevo escriba en el contador de emisiones `v[264]`.
1078. Verificar que ningún switch nuevo escriba en el rango canónico de Arceus 868–875.
1079. Verificar que ningún switch nuevo escriba en el rango de sellos de emisión 940–947.
1080. Cerrar el carril de motor de contenido con `npm run plan2700:verify` en verde sobre el lote de prueba.
1081. Abrir Glazed como región real: hoy son 111 mapas (3000–3110) y una bahía más un gimnasio.
1082. Levantar el inventario de los 111 mapas de Glazed y clasificar cada uno por perfil antes de ampliar.
1083. Auditar los 345 NPC actuales de Glazed y anotar cuántos tienen diálogo propio y cuántos son andamiaje.
1084. Auditar las 1,07 páginas por evento de Glazed y elevarlas al estándar de un mapa de ruta real.
1085. Fijar el mapa de la región Glazed: cuántas ciudades, cuántas rutas, cuántas cuevas y cuántos interiores necesita.
1086. Declarar la meta de Glazed: ocho gimnasios, cuatro ciudades, doce rutas y una mazmorra final.
1087. Reservar los IDs nuevos de Glazed a continuación del 3110 sin invadir el rango de Light Platinum.
1088. Verificar que el rango 3000–3110 esté completo antes de abrir los IDs nuevos.
1089. Abrir el capítulo 1 de Glazed: llegada, laboratorio de Willow y primera ciudad.
1090. Escribir el guion del capítulo 1 con una decisión que cambie el diálogo del resto del capítulo.
1091. Verificar que el laboratorio de Willow (3000) tenga su escena de presentación completa y no un saludo seco.
1092. Abrir el capítulo 2 de Glazed: primera ruta con lagos y el primer gimnasio real.
1093. Escribir el líder del primer gimnasio de Glazed con equipo coherente con la fauna local.
1094. Abrir el capítulo 3 de Glazed: ciudad que recuerda dos líneas temporales, con vecinos que se contradicen.
1095. Escribir la mecánica narrativa de la doble memoria de la ciudad: diálogos distintos según la hora o el progreso.
1096. Verificar que los dos conjuntos de diálogo no se puedan leer a la vez ni mezclarse en una misma visita.
1097. Abrir el capítulo 4 de Glazed: cueva de escarcha con bifurcación real y un santuario interior.
1098. Escribir el santuario de la cueva con un objeto único y una inscripción que aporte al mito de la región.
1099. Abrir el capítulo 5 de Glazed: travesía por el lago congelado y giro argumental del rival.
1100. Escribir al rival de Glazed con tres apariciones y un desenlace que no lo humille.
1101. Abrir el capítulo 6 de Glazed: ascenso final, mazmorra y campeón de la región.
1102. Escribir al campeón de Glazed con equipo de seis y discurso propio que mencione la Ruta de Dios.
1103. Verificar que el campeón de Glazed no repita el discurso de ningún otro campeón del proyecto.
1104. Escribir los diálogos de ambiente de Glazed por capítulo: cada ciudad cambia su rumor al avanzar.
1105. Verificar que ningún rumor de ciudad se repita dos capítulos seguidos.
1106. Escribir las cuatro ciudades de Glazed como mapas de 20 eventos o más.
1107. Verificar que cada ciudad de Glazed tenga centro, tienda, dos casas visitables y un edificio singular.
1108. Escribir el edificio singular de cada ciudad con una función narrativa distinta.
1109. Escribir las doce rutas de Glazed con el mínimo de ruta del bloque: encuentros, cartel, secreto y dos NPC.
1110. Verificar que ninguna ruta de Glazed supere las dos pantallas de longitud sin un recodo con contenido.
1111. Escribir la mazmorra final de Glazed con tres salas y su jefe propio.
1112. Verificar que la mazmorra final de Glazed tenga salida redundante y no atrape al jugador.
1113. Escribir los ocho gimnasios de Glazed con puzle propio y líder distinto.
1114. Verificar que ningún puzle de gimnasio de Glazed repita la mecánica de otro gimnasio del proyecto.
1115. Escribir la medalla de cada gimnasio de Glazed y su texto de entrega.
1116. Verificar que la medalla de Glazed no reutilice el icono de una medalla de Kanto.
1117. Escribir los interiores artesanales de las cuatro ciudades de Glazed.
1118. Verificar que ningún interior de Glazed sea copia de otro con distinto cartel.
1119. Escribir los NPC de interior de Glazed con rutinas simples y frases por capítulo.
1120. Escribir las tiendas de Glazed con stock coherente con el nivel de la región.
1121. Verificar que el stock de las tiendas no venda objetos de nivel de Kanto a precio de Kanto.
1122. Escribir las tablas de encuentros de las doce rutas de Glazed en `content/glazed_wild_encounters.json`.
1123. Verificar que la fauna de Glazed tenga coherencia de escarcha y lago y no mezcle desierto.
1124. Escribir los jefes de ruta de Glazed, al menos uno por capítulo.
1125. Verificar que ningún jefe de ruta de Glazed use un Pokémon fuera de `species.dat`.
1126. Escribir las seis sidequests opcionales de Glazed con recompensa única.
1127. Verificar que ninguna sidequest de Glazed entregue un objeto ya entregado por otra dimensión.
1128. Escribir los objetos ocultos de Glazed y su tabla de posiciones.
1129. Verificar que ningún objeto oculto de Glazed quede en celda intransitable.
1130. Escribir la música de cada zona de Glazed y su rotación por capítulo.
1131. Verificar que la música de Glazed use pistas existentes en `Audio/BGM` o se añada con licencia clara.
1132. Escribir el clima de las rutas de Glazed: niebla en el lago, ventisca ligera en la cueva.
1133. Verificar que el clima de Glazed se apague al entrar en interiores y al salir de la región.
1134. Escribir el sistema de progreso de Glazed sobre la variable 350 y el switch de cierre 990.
1135. Verificar que la variable 350 no se reinicie al cambiar de dimensión.
1136. Verificar que el switch 990 se escriba una sola vez, al derrotar al campeón de Glazed.
1137. Escribir el epílogo de Glazed: qué cambia en la región después de vencer al campeón.
1138. Verificar que el epílogo de Glazed se refleje en al menos tres NPC distintos.
1139. Escribir la conexión de Glazed con el lobby 2200 y el capitán del barco.
1140. Verificar que el barco no pueda zarpar hacia Glazed antes de la Ruta de Dios.
1141. Verificar que el capitán de Glazed explique la regla propia de la región antes de zarpar.
1142. Escribir las reglas propias de Glazed que el jugador debe conocer antes de entrar.
1143. Verificar que esas reglas se cumplan de verdad dentro de la región y no sean solo texto.
1144. Escribir el retorno libre de Glazed por tierra y por barco.
1145. Verificar que el retorno de Glazed no dependa de un único warp frágil.
1146. Verificar que ninguna misión de Glazed deje al jugador sin poder volver al mundo.
1147. Escribir los avisos de guardado seguro dentro de Glazed antes de cada jefe.
1148. Verificar que el jugador pueda guardar en cualquier mapa de Glazed.
1149. Verificar que guardar dentro de un gimnasio de Glazed no rompa la posición del puzle.
1150. Escribir el registro de progreso de Glazed visible desde el hub de Oak.
1151. Verificar que el hub de Oak muestre el capítulo actual de Glazed y lo que falta.
1152. Verificar que la entrada de Glazed (3000) tenga una escena de llegada distinta de la de Light Platinum.
1153. Verificar que las 111 entradas actuales de Glazed sigan funcionando después de la ampliación.
1154. Verificar que los warps nuevos de Glazed no pisen los 5061 warps ya declarados del proyecto.
1155. Revisar el contrato visual de Glazed: escarcha, lagos y ciudades que recuerdan dos líneas temporales.
1156. Verificar que las doce rutas nuevas de Glazed respeten ese contrato y no introduzcan otro clima.
1157. Verificar que los mapas nuevos de Glazed tengan la paleta del contrato y ninguna mezcla de tilesets.
1158. Medir la densidad final de cada mapa de Glazed y compararla con el umbral de su perfil.
1159. Reescribir cualquier mapa de Glazed por debajo del umbral antes de cerrar la región.
1160. Escribir la ficha visual de las cuatro ciudades de Glazed en `docs/qa/fichas/glazed_ciudades.md`.
1161. Escribir la ficha visual de los ocho gimnasios de Glazed en `docs/qa/fichas/glazed_gimnasios.md`.
1162. Verificar que las fichas visuales se correspondan con lo instalado y no con lo planeado.
1163. Ejecutar `npm run verify:glazed` al terminar la región y resolver cada aviso.
1164. Ejecutar `npm run verify:lideres` y confirmar los ocho líderes nuevos de Glazed en `content/campanas_lideres.json`.
1165. Verificar que los líderes de Glazed estén en `trainers.dat` con tipo de entrenador válido.
1166. Verificar que los equipos de los ocho líderes de Glazed escalen de forma ascendente.
1167. Verificar que ningún líder de Glazed tenga dos Pokémon del mismo tipo sin cobertura.
1168. Verificar que el campeón de Glazed esté por encima del octavo líder en nivel y estrategia.
1169. Recorrer Glazed de punta a punta con el caminante automático y registrar los atascos.
1170. Corregir cada atasco detectado en el recorrido automático de Glazed.
1171. Recorrer Glazed en partida real y anotar los problemas que no ve el caminante automático.
1172. Corregir los problemas de ritmo detectados en la partida real de Glazed.
1173. Verificar que Glazed se pueda jugar sin visitar ninguna otra dimensión antes.
1174. Verificar que Glazed se pueda abandonar a mitad de capítulo y retomar después.
1175. Verificar que abandonar Glazed a mitad de capítulo no deje ningún switch a medias.
1176. Verificar que la ampliación de Glazed no haya tocado ningún mapa original de Fire Ash.
1177. Verificar con `node tools/inventario_congelado.mjs --verify` que solo cambiaron los archivos esperados.
1178. Empaquetar el lote de Glazed en `PokeModBackups/plan2700_glazed` con sus originales.
1179. Escribir el acta de la región Glazed en `docs/qa/regiones/glazed.md` con conteos y verificadores.
1180. Cerrar el bloque de Glazed con la región jugable de punta a punta y sus ocho medallas.
1181. Abrir Light Platinum como región real: hoy son 19 mapas (3120–3138) y un solo gimnasio.
1182. Levantar el inventario de los 19 mapas de Light Platinum y clasificar cada uno por perfil.
1183. Auditar los 54 NPC actuales de Light Platinum y anotar cuántos tienen voz propia.
1184. Declarar la meta de Light Platinum: seis ciudades, nueve rutas, dos cuevas y ocho gimnasios.
1185. Reservar los IDs nuevos de Light Platinum después del rango de Glazed y antes del de Liquid Crystal.
1186. Escribir el capítulo 1 de Light Platinum: llegada a la costa y presentación del conflicto propio.
1187. Escribir el conflicto propio de Light Platinum sin copiar el de Glazed ni el de Liquid Crystal.
1188. Escribir el capítulo 2 de Light Platinum: la capital de la región y su mercado.
1189. Verificar que la capital de Light Platinum tenga al menos 25 eventos y un edificio singular.
1190. Escribir el capítulo 3 de Light Platinum: las tres primeras rutas y el primer gimnasio.
1191. Escribir el capítulo 4 de Light Platinum: la cueva de la marea con puzle de agua.
1192. Verificar que el puzle de la cueva de la marea no dependa de un movimiento de campo que el jugador no tenga.
1193. Escribir el capítulo 5 de Light Platinum: la ciudad de las dos banderas y su dilema moral.
1194. Escribir las dos resoluciones del dilema de la ciudad de las dos banderas.
1195. Verificar que ambas resoluciones dejen el contenido postgame accesible.
1196. Escribir el capítulo 6 de Light Platinum: la mazmorra del faro y su guardián.
1197. Escribir el capítulo 7 de Light Platinum: la liga de la región y su campeón.
1198. Escribir los ocho gimnasios de Light Platinum con puzle y líder propios.
1199. Verificar que ningún líder de Light Platinum repita especialidad con los de Glazed.
1200. Escribir la medalla de cada gimnasio de Light Platinum y su iconografía propia.
1201. Escribir las nueve rutas de Light Platinum con el mínimo de ruta del bloque.
1202. Verificar que las rutas de Light Platinum alternen terreno y no sean todas de costa.
1203. Escribir las dos cuevas de Light Platinum con bifurcación real y objeto oculto.
1204. Escribir los interiores artesanales de las seis ciudades de Light Platinum.
1205. Verificar que ningún interior de Light Platinum supere las tres salas sin necesidad narrativa.
1206. Escribir las tablas de encuentros de Light Platinum en `content/light_platinum_wild_encounters.json`.
1207. Verificar que la fauna de Light Platinum sea costera y distinta de la de Glazed.
1208. Escribir las cuatro sidequests de Light Platinum con recompensa única.
1209. Verificar que las sidequests de Light Platinum no dependan de objetos de otra dimensión.
1210. Escribir los objetos ocultos de Light Platinum y verificar su transitabilidad.
1211. Escribir la música de Light Platinum por zona y su rotación.
1212. Escribir el clima de Light Platinum: brisa en costa, niebla en el faro.
1213. Verificar que el clima de Light Platinum se apague al entrar en interiores.
1214. Escribir el progreso de Light Platinum sobre la variable 351 y el switch de cierre 991.
1215. Verificar que el switch 991 se escriba una sola vez, al vencer al campeón de la región.
1216. Escribir el epílogo de Light Platinum y su reflejo en tres NPC distintos.
1217. Escribir la conexión de Light Platinum con el lobby 2210 y su capitán.
1218. Verificar que zarpar a Light Platinum requiera la misma puerta de postgame que Glazed.
1219. Escribir las reglas propias de Light Platinum y verificar que se cumplan dentro de la región.
1220. Escribir el retorno libre de Light Platinum por tierra y por barco.
1221. Verificar que ninguna misión de Light Platinum deje al jugador sin retorno.
1222. Escribir el registro de progreso de Light Platinum visible desde el hub de Oak.
1223. Verificar que la entrada de Light Platinum (3120) tenga una llegada distinta de la de Glazed.
1224. Verificar que los 19 mapas actuales de Light Platinum sigan funcionando después de la ampliación.
1225. Revisar el contrato visual de Light Platinum y aplicarlo a todos los mapas nuevos.
1226. Medir la densidad final de cada mapa de Light Platinum contra el umbral de su perfil.
1227. Reescribir cualquier mapa de Light Platinum por debajo del umbral.
1228. Escribir las fichas visuales de Light Platinum en `docs/qa/fichas/light_platinum.md`.
1229. Ejecutar `npm run verify:light_platinum` y `node tools/apply_light_platinum_native_lore.mjs --verify`.
1230. Recorrer Light Platinum de punta a punta con el caminante automático y corregir atascos.
1231. Recorrer Light Platinum en partida real y corregir los problemas de ritmo.
1232. Verificar que Light Platinum se pueda jugar sin depender de Glazed.
1233. Verificar que Light Platinum se pueda abandonar y retomar sin switches a medias.
1234. Verificar que la ampliación de Light Platinum no tocó ningún mapa original de Fire Ash.
1235. Empaquetar el lote de Light Platinum en `PokeModBackups/plan2700_light_platinum`.
1236. Escribir el acta de Light Platinum en `docs/qa/regiones/light_platinum.md`.
1237. Verificar que el conjunto Glazed más Light Platinum cubra las dos dimensiones del barco sin huecos.
1238. Verificar que el barco de Puerto Horizonte (1001) anuncie el estado de cada región.
1239. Verificar que el barco no permita viajar a una región con su capitán ausente.
1240. Verificar que el viaje de ida y vuelta no consuma objetos ni dinero.
1241. Verificar que las dos regiones tengan dificultad comparable para que el orden sea libre.
1242. Verificar que ninguna de las dos regiones regale niveles que rompan la otra.
1243. Verificar que las recompensas de las dos regiones no se solapen.
1244. Verificar que las dos regiones compartan el mismo estándar de densidad y de QA.
1245. Verificar que las dos regiones tengan su propio tema musical de llegada.
1246. Verificar que las dos regiones tengan su propio tema de gimnasio.
1247. Verificar que las dos regiones tengan su propio tema de campeón.
1248. Verificar que las dos regiones tengan su epílogo escrito y visible en el mundo.
1249. Verificar que las dos regiones aparezcan correctamente en el resumen de progreso del hub.
1250. Actualizar `docs/CAMPANAS_ROM_COMPLETAS.md` con el estado real de las dos regiones.
1251. Actualizar `docs/PLAN_FUSION_3_JUEGOS.md` con lo que quedó cerrado del pilar de dimensiones.
1252. Verificar que el plan de fusión de tres juegos no contradiga lo construido.
1253. Auditar que las dos regiones nuevas no copien mapas, textos ni audio de los fangames originales.
1254. Verificar que la política de adaptación estructural declarada en el JSON se cumpla en las dos regiones.
1255. Documentar en `docs/qa/politica_regiones.md` qué se adaptó y qué se construyó de cero.
1256. Verificar que ningún archivo nuevo de las dos regiones supere el tamaño razonable de mapa RMXP.
1257. Verificar que ningún mapa de las dos regiones tenga más de 60 eventos sin justificación escrita.
1258. Verificar que ningún mapa de las dos regiones ralentice el juego en Kirin.
1259. Verificar que las dos regiones se puedan desinstalar restaurando solo su carpeta de backup.
1260. Cerrar el bloque de las dos dimensiones del barco con `npm run verify:glazed` y `npm run verify:light_platinum` en verde.
1261. Abrir Liquid Crystal como región real: hoy son 432 mapas (3200–3631) sin identidad narrativa verificada.
1262. Levantar el inventario de los 432 mapas de Liquid Crystal y clasificar cada uno por perfil.
1263. Auditar los 1203 NPC actuales de Liquid Crystal y separar los que tienen voz de los de relleno.
1264. Verificar que Liquid Crystal no esté reutilizando la fauna de Kanto: auditar su tabla de encuentros.
1265. Verificar que Liquid Crystal no esté reutilizando mapas de Johto ni nombres de ciudad ajenos.
1266. Declarar la identidad propia de Liquid Crystal: cristal líquido, memoria que se derrite y reflejos que mienten.
1267. Escribir el documento de identidad de la región en `docs/qa/regiones/liquid_crystal.md`.
1268. Verificar que la identidad declarada se pueda ver en el mapa en menos de dos minutos de juego.
1269. Declarar la meta de Liquid Crystal: ocho gimnasios, cinco ciudades, catorce rutas y tres cuevas.
1270. Reservar los IDs nuevos de Liquid Crystal a continuación del 3631 sin invadir el rango de TFOH.
1271. Verificar que el rango 3200–3631 esté completo antes de abrir IDs nuevos.
1272. Escribir el capítulo 1 de Liquid Crystal: la costa que refleja y el pueblo que no recuerda su nombre.
1273. Escribir el capítulo 2 de Liquid Crystal: la primera ciudad y su mercado de espejos.
1274. Escribir el capítulo 3 de Liquid Crystal: la ruta del cristal y su primera aparición del antagonista.
1275. Escribir el capítulo 4 de Liquid Crystal: la cueva de la memoria derretida.
1276. Escribir el capítulo 5 de Liquid Crystal: la ciudad sumergida y su gente que respira bajo el agua.
1277. Verificar que la ciudad sumergida tenga su propia lógica de acceso y salida sin sofocar al jugador.
1278. Escribir el capítulo 6 de Liquid Crystal: la traición del aliado y su motivo entendible.
1279. Escribir el capítulo 7 de Liquid Crystal: el ascenso al cristal madre.
1280. Escribir el capítulo 8 de Liquid Crystal: la liga de la región y su campeón que refleja a Ash.
1281. Verificar que el campeón de Liquid Crystal no sea un calco del de otra región del proyecto.
1282. Escribir los ocho gimnasios de Liquid Crystal con puzle de reflejos y líder propio.
1283. Verificar que el puzle de reflejos no dependa de un fallo del motor para resolverse.
1284. Escribir la medalla de cada gimnasio de Liquid Crystal y su texto de entrega.
1285. Escribir las cinco ciudades de Liquid Crystal con el mínimo de ciudad del bloque.
1286. Verificar que ninguna ciudad de Liquid Crystal esté sin curación ni comercio.
1287. Escribir las catorce rutas de Liquid Crystal con el mínimo de ruta del bloque.
1288. Verificar que las rutas de Liquid Crystal varíen de bioma y no repitan la misma costa.
1289. Escribir las tres cuevas de Liquid Crystal con bifurcación, objeto oculto y salida redundante.
1290. Escribir los interiores artesanales de las cinco ciudades de Liquid Crystal.
1291. Verificar que los interiores de Liquid Crystal no reutilicen las plantas de otra región sin variar muebles.
1292. Escribir los NPC de interior de Liquid Crystal con rutinas y frases por capítulo.
1293. Escribir las tablas de encuentros de Liquid Crystal en `content/liquid_crystal_wild_encounters.json`.
1294. Verificar que la fauna de Liquid Crystal sea acuática y de cristal y no herede la de Kanto.
1295. Escribir los jefes de ruta de Liquid Crystal, al menos uno por capítulo.
1296. Verificar que ningún jefe de Liquid Crystal use un Pokémon fuera de `species.dat`.
1297. Escribir las ocho sidequests de Liquid Crystal con recompensa única.
1298. Verificar que ninguna sidequest de Liquid Crystal entregue un objeto duplicado de otra región.
1299. Escribir los objetos ocultos de Liquid Crystal y verificar su transitabilidad.
1300. Escribir la música de Liquid Crystal por zona y su rotación por capítulo.
1301. Verificar que la música de Liquid Crystal no sea la misma que la de Glazed o Light Platinum.
1302. Escribir el clima de Liquid Crystal: lluvia de cristal y neblina húmeda en la ciudad sumergida.
1303. Verificar que el clima de Liquid Crystal se apague al entrar en interiores y al salir de la región.
1304. Escribir el progreso de Liquid Crystal sobre la variable 352 y el switch de cierre 992.
1305. Verificar que el switch 992 se escriba una sola vez, al vencer al campeón de la región.
1306. Escribir el epílogo de Liquid Crystal y su reflejo en al menos tres NPC distintos.
1307. Escribir la conexión de Liquid Crystal con su puerta de acceso desde el barco o desde un Gate.
1308. Verificar que la puerta de Liquid Crystal no pueda abrirse antes de la Ruta de Dios.
1309. Escribir las reglas propias de Liquid Crystal y verificar que se cumplan dentro de la región.
1310. Escribir el retorno libre de Liquid Crystal por dos rutas distintas.
1311. Verificar que ninguna misión de Liquid Crystal deje al jugador sin retorno.
1312. Escribir el registro de progreso de Liquid Crystal visible desde el hub de Oak.
1313. Verificar que la llegada a Liquid Crystal sea distinguible de la de las otras dos regiones.
1314. Verificar que los 432 mapas actuales sigan funcionando después de la ampliación.
1315. Revisar el contrato visual de Liquid Crystal y aplicarlo a todos los mapas nuevos.
1316. Medir la densidad final de cada mapa de Liquid Crystal contra el umbral de su perfil.
1317. Reescribir cualquier mapa de Liquid Crystal por debajo del umbral.
1318. Auditar los 432 mapas y marcar los que hoy tienen menos de cuatro eventos.
1319. Reconstruir los mapas marcados con el pipeline de lote del bloque 901–1080.
1320. Verificar que ningún mapa de Liquid Crystal quede con una sola fila de estilo visual.
1321. Auditar los interiores de Liquid Crystal y sustituir los planos automáticos por artesanales.
1322. Verificar que ningún interior de Liquid Crystal tenga más de un warp de entrada.
1323. Escribir las fichas visuales de Liquid Crystal en `docs/qa/fichas/liquid_crystal.md`.
1324. Ejecutar `npm run verify:liquid_crystal` y `node tools/apply_liquid_crystal_native_lore.mjs --verify`.
1325. Recorrer Liquid Crystal con el caminante automático y corregir cada atasco.
1326. Recorrer Liquid Crystal en partida real y corregir los problemas de ritmo.
1327. Verificar que Liquid Crystal se pueda jugar sin depender de las otras dos regiones.
1328. Verificar que Liquid Crystal se pueda abandonar y retomar sin switches a medias.
1329. Verificar que la ampliación de Liquid Crystal no tocó ningún mapa original de Fire Ash.
1330. Empaquetar el lote de Liquid Crystal en `PokeModBackups/plan2700_liquid_crystal`.
1331. Escribir el acta de Liquid Crystal en `docs/qa/regiones/liquid_crystal.md`.
1332. Verificar que las tres regiones del barco compartan dificultad comparable y orden libre.
1333. Verificar que las tres regiones no regalen niveles que rompan a las otras.
1334. Verificar que las recompensas de las tres regiones no se solapen entre sí.
1335. Verificar que las tres regiones tengan su propio tema de llegada, gimnasio y campeón.
1336. Verificar que las tres regiones tengan su epílogo escrito y visible en el mundo.
1337. Verificar que las tres regiones aparezcan con su estado real en el resumen del hub.
1338. Verificar que ninguna de las tres regiones consuma IDs reservados por otra.
1339. Verificar que los tres lotes de región se puedan aplicar en cualquier orden sin conflicto.
1340. Verificar que aplicar un lote no reescriba el archivo de otro lote.
1341. Verificar que los tres verificadores de región se puedan correr juntos sin interferencia.
1342. Añadir `npm run verify:regiones:barco` que agrupe las tres verificaciones.
1343. Verificar que ese comando falle si una sola de las tres regiones está incompleta.
1344. Auditar el total de mapas de las tres regiones frente al total declarado en su JSON.
1345. Actualizar `content/rom_campaigns_complete.json` con los conteos reales de las tres regiones.
1346. Verificar que el JSON actualizado siga siendo válido contra su esquema.
1347. Escribir el resumen comparado de las tres regiones en `docs/qa/regiones/comparado.md`.
1348. Verificar que el resumen comparado incluya densidad, jefes, medallas y tiempo estimado de juego.
1349. Medir el tiempo estimado de juego de cada región con un recorrido cronometrado.
1350. Publicar el tiempo estimado de las tres regiones en `docs/INSTALAR_Y_JUGAR.md`.
1351. Abrir TFOH como cuarta región: hoy son 245 mapas (3700–3944) sin hilo narrativo propio.
1352. Levantar el inventario de los 245 mapas de TFOH y clasificar cada uno por perfil.
1353. Auditar los 705 NPC actuales de TFOH y anotar cuántos tienen voz propia.
1354. Declarar la identidad de TFOH dentro del multiverso: qué la hace distinta de las otras cuatro.
1355. Escribir la ficha de identidad de TFOH en `docs/qa/regiones/tfoh.md`.
1356. Reservar los IDs nuevos de TFOH a continuación del 3944 sin invadir el rango de Unbound.
1357. Verificar que el rango 3700–3944 esté completo antes de abrir IDs nuevos.
1358. Escribir el hilo narrativo mínimo de TFOH conectado al Fragmento de Arceus.
1359. Verificar que el hilo de TFOH no contradiga el canon de Arceus ni el de los siete mundos.
1360. Escribir el capítulo 1 de TFOH con la llegada y el motivo por el que Ash entra.
1361. Escribir el capítulo 2 de TFOH con su primer jefe y su primera consecuencia visible.
1362. Escribir el capítulo 3 de TFOH con la ciudad principal y su conflicto interno.
1363. Escribir el capítulo 4 de TFOH con la mazmorra de cierre y su guardián.
1364. Verificar que la mazmorra de TFOH tenga tres salas con función y una salida clara.
1365. Escribir los gimnasios de TFOH que su estructura permita y documentar los que no se abran.
1366. Verificar que cada gimnasio de TFOH tenga líder, puzle y medalla propia.
1367. Escribir las rutas principales de TFOH con el mínimo de ruta del bloque.
1368. Verificar que ninguna ruta de TFOH sea un pasillo sin desvío.
1369. Escribir los interiores artesanales de las ciudades de TFOH.
1370. Verificar que los interiores de TFOH no sean planos automáticos.
1371. Escribir la tabla de encuentros de TFOH o su justificación documentada si no la lleva.
1372. Verificar que la fauna de TFOH no repita la de las otras cuatro campañas.
1373. Escribir la música de TFOH por zona y verificar que no repita la de otra región.
1374. Escribir el clima de TFOH y verificar que se apague al entrar en interiores.
1375. Escribir el progreso de TFOH sobre la variable 353 y el switch de cierre 993.
1376. Verificar que el switch 993 se escriba una sola vez, al cerrar el hilo principal de TFOH.
1377. Escribir el epílogo de TFOH y su reflejo en al menos dos NPC del mundo.
1378. Verificar que TFOH tenga entrada y salida libres y no un callejón sin salida.
1379. Verificar que TFOH no dependa de otra campaña para poder terminarse.
1380. Medir la densidad final de cada mapa de TFOH contra el umbral de su perfil.
1381. Reescribir cualquier mapa de TFOH por debajo del umbral.
1382. Verificar que ningún mapa de TFOH quede con una sola fila de estilo visual.
1383. Escribir la ficha visual de TFOH en `docs/qa/fichas/tfoh.md`.
1384. Auditar la cifra de 245 mapas y confirmar que todos sean alcanzables desde el primero.
1385. Corregir los mapas huérfanos de TFOH que no tengan warp de entrada.
1386. Recorrer TFOH con el caminante automático y corregir cada atasco.
1387. Recorrer TFOH en partida real y corregir los problemas de ritmo.
1388. Verificar que TFOH se pueda abandonar y retomar sin switches a medias.
1389. Verificar que la ampliación de TFOH no tocó ningún mapa original de Fire Ash.
1390. Empaquetar el lote de TFOH en `PokeModBackups/plan2700_tfoh`.
1391. Escribir el acta de TFOH en `docs/qa/regiones/tfoh.md`.
1392. Verificar que TFOH aparezca en el hub de Oak con su estado real.
1393. Verificar que TFOH tenga un resumen de progreso propio y no herede el de otra región.
1394. Verificar que TFOH tenga su propia recompensa final única.
1395. Verificar que la recompensa final de TFOH no se solape con la de las otras campañas.
1396. Verificar que TFOH no rompa la economía del postgame con su botín.
1397. Verificar que TFOH tenga al menos un momento memorable documentado en su ficha.
1398. Cerrar el hilo narrativo de TFOH con un final escrito y no con un corte abrupto.
1399. Verificar que el final de TFOH no cierre ninguna puerta de las otras dimensiones.
1400. Ejecutar el verificador de campañas sobre TFOH y resolver cada aviso emitido.
1401. Abrir el carril de coherencia entre las cuatro regiones invitadas y Unbound.
1402. Verificar que las cinco campañas compartan el mismo estándar de densidad y verificación.
1403. Verificar que ninguna campaña escriba switches de otra.
1404. Verificar que ninguna campaña dependa del orden de visita de otra.
1405. Verificar que las cinco campañas se puedan visitar en cualquier orden.
1406. Verificar que las cinco campañas se puedan abandonar y retomar sin pérdida.
1407. Verificar que las cinco campañas tengan retorno libre por al menos dos vías.
1408. Verificar que las cinco campañas tengan curación accesible y guardado libre.
1409. Verificar que ninguna campaña deje al jugador sin poder guardar.
1410. Verificar que las cinco campañas tengan su música, su clima y su contrato visual propios.
1411. Verificar que las cinco campañas tengan epílogo propio visible en el mundo.
1412. Verificar que las cinco campañas tengan su entrada al hub de progreso del laboratorio de Oak.
1413. Verificar que el hub de Oak muestre las cinco campañas con su estado real.
1414. Verificar que el hub de Oak no revele campañas antes de que el jugador las descubra.
1415. Escribir el texto del hub de Oak para el estado mixto: dos campañas abiertas y tres sin empezar.
1416. Verificar que ese texto no se rompa con ninguna combinación de estados.
1417. Probar las treinta y dos combinaciones de estado de las cinco campañas.
1418. Corregir cualquier combinación que muestre un texto incoherente.
1419. Escribir el cuadro de combinaciones probadas en `docs/qa/regiones/combinaciones.md`.
1420. Verificar que el progreso de las cinco campañas se guarde y se recupere tras cargar partida.
1421. Verificar que perder un combate dentro de una campaña no reinicie su progreso.
1422. Verificar que salir de una campaña a mitad de un capítulo no pierda el capítulo.
1423. Verificar que el jugador pueda saber en qué punto de cada campaña está.
1424. Escribir la pantalla de resumen de campañas y su acceso desde el menú.
1425. Verificar que la pantalla de resumen no tape la interfaz original en pantallas pequeñas.
1426. Escribir las medallas de las cinco campañas en una sola bandeja visual.
1427. Verificar que la bandeja de medallas muestre cuarenta medallas sin huecos ni solapes.
1428. Verificar que ninguna medalla de campaña se pueda obtener dos veces.
1429. Verificar que la bandeja se actualice al instante al ganar una medalla.
1430. Verificar que la bandeja se restaure correctamente al cargar una partida guardada.
1431. Escribir el resumen final de las cinco campañas para el epílogo del juego.
1432. Verificar que el epílogo mencione solo las campañas realmente completadas.
1433. Verificar que el epílogo no prometa contenido que no exista.
1434. Revisar el contrato visual de las cinco campañas contra `content/rom_campaigns_complete.json`.
1435. Actualizar el JSON con los conteos y los switches reales tras la ampliación.
1436. Verificar que el JSON actualizado pase su verificación de esquema y de integridad.
1437. Ejecutar `npm run verify:rom:campaigns` y `npm run verify:rom:campaigns:plan` en verde.
1438. Ejecutar `npm run verify:rom:nativo` y confirmar que la ampliación no rompió la extracción nativa.
1439. Ejecutar `npm run verify:rom:nativo:sprites` y confirmar los 667 sprites de personaje intactos.
1440. Cerrar el bloque de regiones invitadas con cinco campañas jugables de punta a punta.
1441. Abrir Unbound como quinta región: son 420 mapas (4000–4419) con la dificultad más alta del paquete.
1442. Levantar el inventario de los 420 mapas de Unbound y clasificar cada uno por perfil.
1443. Auditar los 1318 NPC actuales de Unbound y separar los que tienen voz de los de relleno.
1444. Declarar la identidad de Unbound: exigencia alta, decisiones duras y mundo que no da tregua.
1445. Escribir la ficha de identidad de Unbound en `docs/qa/regiones/unbound.md`.
1446. Verificar que la dificultad declarada se pueda medir y no sea una etiqueta.
1447. Fijar los indicadores de dificultad de Unbound: niveles, objetos equipados y cobertura de los jefes.
1448. Verificar que ningún jefe de Unbound repita especialidad con los de las otras cuatro campañas.
1449. Escribir el capítulo 1 de Unbound con la llegada y las reglas duras de la región.
1450. Verificar que las reglas duras se expliquen al jugador antes de que las sufra.
1451. Escribir el capítulo 2 de Unbound con su primer gimnasio de dificultad alta.
1452. Escribir el capítulo 3 de Unbound con la ciudad central y su mercado de trueque.
1453. Verificar que el trueque de Unbound no permita romper la economía del juego.
1454. Escribir el capítulo 4 de Unbound con la ruta de ceniza y su emboscada.
1455. Escribir el capítulo 5 de Unbound con la cueva de las decisiones y su bifurcación real.
1456. Verificar que las dos ramas de la cueva de las decisiones lleven al mismo desenlace por caminos distintos.
1457. Escribir el capítulo 6 de Unbound con la torre de los veteranos.
1458. Escribir el capítulo 7 de Unbound con la liga de la región y su campeón exigente.
1459. Verificar que el campeón de Unbound tenga equipo de seis con cobertura real.
1460. Verificar que el campeón de Unbound se pueda vencer sin objetos infinitos.
1461. Escribir los gimnasios de Unbound con puzle propio y líder distinto.
1462. Verificar que cada gimnasio de Unbound tenga su medalla y su texto de entrega.
1463. Escribir las rutas de Unbound con el mínimo de ruta del bloque y un jefe de ruta por tramo.
1464. Verificar que las rutas de Unbound no sean todas del mismo bioma.
1465. Escribir las cuevas de Unbound con bifurcación y objeto oculto.
1466. Escribir los interiores artesanales de las ciudades de Unbound.
1467. Verificar que los interiores de Unbound no sean planos automáticos.
1468. Escribir la tabla de encuentros de Unbound o su justificación documentada.
1469. Verificar que la fauna de Unbound sea la más dura del paquete y esté por encima del nivel 80.
1470. Escribir la música de Unbound por zona y verificar que no repita la de otra región.
1471. Escribir el clima de Unbound y verificar que se apague al entrar en interiores.
1472. Escribir el progreso de Unbound sobre la variable 354 y el switch de cierre 994.
1473. Verificar que el switch 994 se escriba una sola vez, al vencer al campeón de la región.
1474. Escribir el epílogo de Unbound y su reflejo en el mundo.
1475. Verificar que el atavío `ash_outfit_unbound.png` se use durante el recorrido de Unbound.
1476. Verificar que el atavío de Unbound provenga de `ash_pokemon_unbound.jpg` sin halos verdes.
1477. Verificar que el charset de Unbound tenga sus cuatro direcciones y sus pasos completos.
1478. Verificar que el atavío de Unbound no se pueda activar antes de entrar en la región.
1479. Verificar que el atavío de Unbound se pueda desactivar y volver al atavío base.
1480. Medir la densidad final de cada mapa de Unbound contra el umbral de su perfil.
1481. Reescribir cualquier mapa de Unbound por debajo del umbral.
1482. Verificar que ningún mapa de Unbound quede con una sola fila de estilo visual.
1483. Escribir la ficha visual de Unbound en `docs/qa/fichas/unbound.md`.
1484. Auditar los 420 mapas y confirmar que todos sean alcanzables desde el primero.
1485. Corregir los mapas huérfanos de Unbound sin warp de entrada.
1486. Recorrer Unbound con el caminante automático y corregir cada atasco.
1487. Recorrer Unbound en partida real y corregir los problemas de ritmo y de dificultad injusta.
1488. Verificar que Unbound se pueda abandonar y retomar sin switches a medias.
1489. Verificar que la ampliación de Unbound no tocó ningún mapa original de Fire Ash.
1490. Empaquetar el lote de Unbound en `PokeModBackups/plan2700_unbound`.
1491. Escribir el acta de Unbound en `docs/qa/regiones/unbound.md`.
1492. Verificar que Unbound aparezca en el hub de Oak con su estado real.
1493. Verificar que Unbound tenga su propia recompensa final única.
1494. Verificar que la recompensa final de Unbound no se solape con la de las otras campañas.
1495. Verificar que Unbound no rompa la economía del postgame con su botín.
1496. Verificar que Unbound tenga al menos tres momentos memorables documentados.
1497. Verificar que Unbound no cierre ninguna puerta de las otras dimensiones con su final.
1498. Ejecutar `npm run verify:ash:unbound` y `node tools/apply_ash_unbound.mjs --verify`.
1499. Verificar que la curva completa de las cinco campañas sea ascendente y sin saltos.
1500. Publicar la curva de las cinco campañas en `docs/qa/regiones/curva_campanas.md`.
1501. Verificar que un jugador pueda recorrer las cinco campañas seguidas sin farmear.
1502. Verificar que un jugador pueda recorrer las cinco campañas salteadas sin romperse.
1503. Verificar que las cinco campañas compartan la puerta de postgame y no tengan accesos alternativos.
1504. Verificar que ninguna campaña sea alcanzable antes de la Ruta de Dios por ningún camino.
1505. Auditar cada warp de entrada a las cinco campañas y su condición de postgame.
1506. Verificar que los cinco switches de cierre (990–994) estén libres de colisión y documentados.
1507. Verificar que las cinco variables de progreso (350–354) tengan lector y escritor declarados.
1508. Verificar que ningún contador de campaña se pueda desbordar con valores absurdos.
1509. Verificar que el progreso de las cinco campañas entre en el resumen del hub sin truncarse.
1510. Verificar que las cinco campañas tengan su propio verificador en `npm test` o en `verify:all`.
1511. Añadir `npm run verify:campanas` que agrupe las cinco verificaciones de campaña.
1512. Verificar que `verify:campanas` falle si una campaña queda incompleta.
1513. Documentar el mapa completo de las cinco campañas en `docs/CAMPANAS_ROM_COMPLETAS.md`.
1514. Verificar que ese documento no contradiga los conteos reales del JSON.
1515. Actualizar `docs/ROM_INVITADO_EXTRACCION.md` con lo aprendido en las ampliaciones.
1516. Actualizar `docs/ROMS_POKEMON_FORENSE.md` con los rangos de mapa reservados a cada campaña.
1517. Verificar que el rango 3000–4419 no tenga huecos sin documentar.
1518. Documentar cada hueco del rango como reserva futura con su motivo.
1519. Verificar que ningún hueco del rango se rellene con mapas de otra campaña.
1520. Cerrar el bloque de las cinco regiones con las 1 227 fichas convertidas en regiones jugables.
1521. Abrir la infiltración de Team Rocket en serio: la base 2220 (106×72) tiene hoy 21 eventos y el núcleo 2221 (72×72) tiene 4.
1522. Elevar la base 2220 a cuatro plantas con función propia antes de escribir las misiones.
1523. Escribir la planta de acceso de la base: control de identidad, disfraz obligatorio y cola de reclutas.
1524. Escribir la planta de entrenamiento de la base: simulacros, sala de combate y instructor con carácter.
1525. Escribir la planta de cautiverio de la base: celdas, heridos y el dilema central del arco.
1526. Escribir la planta de mando de la base: despachos, archivos y el primer atisbo del Jefe Supremo.
1527. Verificar que las cuatro plantas de la base se conecten con ascensores o escaleras claras.
1528. Verificar que ninguna planta de la base quede como pasillo sin función narrativa.
1529. Elevar el núcleo 2221 a sala de mando, celda de heridos y sala de máquinas.
1530. Verificar que la sala de máquinas del núcleo tenga un puzle propio y consecuencias visibles.
1531. Escribir la Misión 1 (Recluta) mapa por mapa: cada NPC, cada orden y cada consecuencia.
1532. Verificar que la Misión 1 enseñe las reglas de la base sin castigar al jugador por no saberlas.
1533. Escribir la Misión 2 (Agente) con sabotaje sin daño a los trabajadores y su texto de culpa.
1534. Escribir la decisión de la Misión 2 y sus dos resoluciones válidas.
1535. Verificar que la decisión de la Misión 2 se refleje en al menos dos NPC después.
1536. Escribir la Misión 3 (Oficial) con el convoy de heridos y la confianza ganada con el rival.
1537. Verificar que la Misión 3 tenga un combate obligatorio y uno evitable.
1538. Escribir la Misión 4 (Teniente) con la orden cruel desobedecida y el rastro cubierto.
1539. Verificar que la Misión 4 tenga consecuencias permanentes si el rastro no se cubre.
1540. Escribir la Misión 5 (Comandante) con la toma del núcleo para el bien de los habitantes.
1541. Verificar que la Misión 5 se pueda perder y reintentar sin reiniciar el arco.
1542. Verificar que cada una de las cinco misiones tenga al menos un combate, una decisión y una consecuencia.
1543. Verificar que cada misión dure entre diez y veinte minutos de juego real.
1544. Escribir el escalafón de seis rangos con su escena de ascenso propia.
1545. Verificar que ascender de rango no se pueda saltar ninguna misión.
1546. Verificar que el rango se guarde en su variable propia y no en un switch compartido.
1547. Escribir el contador de heridos y su lectura en el epílogo del arco.
1548. Verificar que ningún herido se pueda contar dos veces.
1549. Verificar que la curación en la celda de heridos esté disponible en todas las misiones.
1550. Escribir al rival de la infiltración con sus tres apariciones y su desenlace propio.
1551. Verificar que el rival se pueda vencer sin humillarlo ni eliminarlo.
1552. Verificar que el rival tenga una línea distinta en cada una de sus tres apariciones.
1553. Escribir los NPC de la base con frases por rango y no una sola frase fija.
1554. Verificar que ningún NPC de la base repita la misma línea en las cinco misiones.
1555. Verificar que el disfraz cambie los diálogos de los NPC de la base.
1556. Verificar que quitarse el disfraz dentro de la base alerte a los guardias.
1557. Verificar que la alerta de la base se pueda desactivar sin reiniciar el mapa.
1558. Verificar que el disfraz no funcione en la Liga Oscura ni en Monte Silver.
1559. Verificar que el disfraz no cambie el nombre del jugador ni sus banderas de identidad.
1560. Escribir la medalla de Team Rocket y su entrega al cerrar la Misión 5.
1561. Verificar que la medalla de Team Rocket tenga iconografía propia y no prestada.
1562. Verificar que la medalla se pueda ver en el visor con `npm run verify:visor`.
1563. Escribir el final del arco: la base en manos de los habitantes y sus consecuencias en el mundo.
1564. Verificar que el final del arco se refleje en al menos cuatro NPC fuera de la base.
1565. Verificar que el final del arco no interfiera con la Liga Oscura ni con las emisiones.
1566. Verificar que el switch de cierre de Team Rocket sea único y esté documentado.
1567. Verificar que las cinco misiones se puedan abandonar y retomar sin perder progreso.
1568. Verificar que ninguna misión se pueda completar dos veces.
1569. Verificar que las recompensas de las misiones no se puedan duplicar.
1570. Verificar que el jefe supremo tenga combate con dos fases si la estructura lo permite.
1571. Verificar que la derrota contra el jefe supremo no castigue de forma permanente.
1572. Verificar que perder contra el jefe supremo no borre ningún herido salvado.
1573. Escribir el guion completo de las cinco misiones en `docs/qa/team_rocket_guion.md`.
1574. Verificar que el guion escrito y lo instalado coincidan línea por línea en los textos clave.
1575. Escribir las fichas visuales de las cuatro plantas de la base en `docs/qa/fichas/rocket_base.md`.
1576. Verificar que la base tenga música propia y que cambie por planta.
1577. Verificar que la base tenga encuentros temáticos de tipo cueva donde su terreno lo permita.
1578. Verificar que la base tenga al menos tres entradas y salidas lógicas.
1579. Verificar que ninguna salida de la base quede bloqueada por un NPC tras una misión.
1580. Verificar que los ascensores de la base no puedan dejar al jugador en una planta sin salida.
1581. Recorrer las cuatro plantas de la base con el caminante automático y corregir atascos.
1582. Recorrer las cinco misiones en partida real en una sola sesión y anotar hallazgos.
1583. Corregir los problemas de ritmo detectados en el recorrido real de las misiones.
1584. Verificar que ninguna misión deje un cartel o un diálogo desactualizado después.
1585. Verificar que todas las medallas de la infiltración se muestren en la bandeja de medallas.
1586. Ejecutar `npm run verify:rocket` y `npm run verify:disfraz` en verde.
1587. Empaquetar el lote de Team Rocket en `PokeModBackups/plan2700_rocket`.
1588. Escribir el acta de Team Rocket en `docs/qa/regiones/team_rocket.md`.
1589. Actualizar `docs/PLAN_FUSION_3_JUEGOS.md` con el estado final del pilar de Team Rocket.
1590. Cerrar Team Rocket con las cinco misiones completas y la base en manos de los habitantes.
1591. Abrir la Liga Oscura (2141–2142) con sus dos mapas y elevarlos a recinto de liga completo.
1592. Escribir la antesala de la Liga Oscura con el control de las siete emisiones purgadas.
1593. Verificar que la Liga Oscura no se pueda iniciar con sellos falsos o incompletos.
1594. Escribir la sala de las catorce medallas con su exposición y su texto de entrada.
1595. Verificar que las catorce medallas se muestren sin huecos ni solapes.
1596. Escribir los combates previos de la Liga Oscura con dificultad ascendente.
1597. Verificar que cada combate previo permita perder y reintentar.
1598. Escribir el jefe final de la Liga Oscura con dos fases y su discurso propio.
1599. Verificar que el jefe final marque el switch 948 al ser derrotado.
1600. Verificar con `npm run verify:diplomas` que el Diploma de la Liga Oscura sea conseguible.
1601. Verificar que el Diploma se registre en el menú de diplomas del jugador.
1602. Escribir el texto del Diploma de la Liga Oscura y su referencia a las siete emisiones.
1603. Verificar que el Diploma no se pueda obtener dos veces.
1604. Escribir el epílogo de la Liga Oscura y su reflejo en el mundo.
1605. Verificar que el epílogo no prometa contenido inexistente.
1606. Escribir la música de la Liga Oscura y su cambio en la fase final.
1607. Verificar que la música del jefe final no se solape con la de Arceus.
1608. Escribir la iluminación y el tono de pantalla del recinto y verificar que se restaure al salir.
1609. Verificar que la Liga Oscura tenga retorno libre y guardado disponible.
1610. Verificar que la Liga Oscura no se pueda alcanzar antes de purgar las siete emisiones.
1611. Auditar la condición exacta de apertura de la Liga Oscura y documentarla en `docs/qa/liga_oscura.md`.
1612. Verificar que ese documento coincida con la condición real implementada.
1613. Escribir la ficha visual de la Liga Oscura en `docs/qa/fichas/liga_oscura.md`.
1614. Recorrer la Liga Oscura con el caminante automático y corregir atascos.
1615. Recorrer la Liga Oscura en partida real con los siete sellos completos y anotar hallazgos.
1616. Verificar que ninguno de los combates de la Liga Oscura deje el estado a medias.
1617. Verificar que perder contra el jefe final no borre ningún sello ni medalla.
1618. Empaquetar el lote de la Liga Oscura en `PokeModBackups/plan2700_liga_oscura`.
1619. Escribir el acta de la Liga Oscura en `docs/qa/regiones/liga_oscura.md`.
1620. Cerrar la Liga Oscura con su Diploma obtenible y su epílogo instalado.
1621. Abrir la densidad de los siete mundos creepypasta: hoy son siete mapas de 25×25 con 8 eventos cada uno.
1622. Elevar cada emisión a una pequeña región de dos o tres mapas con un puzzle ambiental propio.
1623. Escribir la segunda planta de La Torre que Escuchaba con sus grabaciones y su puzle de sonido.
1624. Escribir la segunda sala de La Partida Perdida con su círculo en la nieve y su puzle de rastro.
1625. Escribir la galería profunda de La Fosa del Enterrado con su puzle de linterna y excavación.
1626. Escribir el cuarto de la cinta de La Cinta Carmesí con su puzle de rebobinado.
1627. Escribir los dos distritos nuevos de Ciudad Glitch con su puzle de datos desbordados.
1628. Escribir la cámara del eco de El Eco que Jugó Contigo con su puzle de reflejo retardado.
1629. Escribir la trastienda de La Consola de 1996 con su puzle de partida guardada.
1630. Verificar que cada puzle nuevo de las emisiones se pueda resolver sin reiniciar el mapa.
1631. Verificar que cada puzle tenga su pista diegética y no exija adivinar.
1632. Verificar que ninguna emisión supere los tres mapas: el ritmo importa más que el tamaño.
1633. Escribir el guardián intermedio de cada emisión y su combate opcional.
1634. Verificar que el guardián intermedio deje una pista del guardián final.
1635. Escribir los NPC perdidos de cada emisión y su rescate opcional.
1636. Verificar que rescatar a un perdido no sea obligatorio para purgar la emisión.
1637. Verificar que rescatar a un perdido deje una recompensa menor y no un objeto único.
1638. Escribir el objeto oculto de cada emisión en su celda más escondida y transitable.
1639. Verificar que ningún objeto oculto de emisión esté en celda intransitable.
1640. Escribir el texto de atmósfera de cada emisión con su señal propia y sin gore gratuito.
1641. Verificar que ningún texto de emisión copie líneas de su cuento de origen.
1642. Verificar que cada emisión conserve su esencia con voz propia del proyecto.
1643. Escribir la degradación sonora de cada emisión por páginas de evento y no por bucle infinito.
1644. Verificar que la degradación sonora se detenga al salir de la emisión.
1645. Escribir el retorno de cada emisión por su grieta original y por menú.
1646. Verificar que ninguna grieta deje al jugador en una celda sólida al volver.
1647. Verificar que el sello de cada emisión se escriba solo al derrotar al guardián final.
1648. Verificar que el contador `v[264]` quede parcheado frente a dobles sellos.
1649. Escribir el punto de colapso de la Torre Pokémon 1F y su texto de aparición con las siete purgadas.
1650. Verificar que el punto de colapso no aparezca antes de la séptima purga.
1651. Escribir la subida a la falda del Monte Silver y la bajada al mundo.
1652. Verificar que la falda y la cumbre sigan intactas tras la ampliación de las emisiones.
1653. Escalar la densidad de la falda 2021 y la cumbre 2022 al estándar de mapa de ciudad.
1654. Verificar que Red siga aguardando en la cumbre y solo hable con batallas.
1655. Escribir la reacción del Archivero Prohibido a cada purga nueva.
1656. Verificar que el Archivero tenga siete respuestas distintas y no un contador seco.
1657. Escribir la fauna nueva de cada emisión ampliada en `content/wild_zones.json`.
1658. Verificar que la fauna de las emisiones no se salga del tono de cada cuento.
1659. Verificar que ninguna tabla de encuentros de emisión pise una tabla original.
1660. Verificar que los niveles de la fauna de emisión se mantengan entre 70 y 108.
1661. Recorrer las siete emisiones completas con el caminante automático y corregir atascos.
1662. Recorrer las siete emisiones en partida real, una por sesión, y anotar hallazgos.
1663. Verificar que las siete emisiones se puedan purgar en cualquier orden tras la ampliación.
1664. Verificar que la Liga Oscura reconozca las siete purgas hechas con la nueva estructura.
1665. Cerrar el bloque creepypasta con las siete emisiones ampliadas y sus sellos intactos.
1666. Abrir la densidad de La Ruta de Dios: hoy son siete pisos de 40×40 con siete u ocho eventos cada uno.
1667. Elevar cada piso a un mapa de perfil de mazmorra con al menos quince eventos.
1668. Escribir los NPC testigos de cada piso con su comentario del ascenso.
1669. Verificar que ningún testigo repita el texto de otro piso.
1670. Escribir los objetos ocultos de cada piso y verificar sus siete celdas.
1671. Verificar que los siete objetos ocultos sigan siendo únicos y no duplicables.
1672. Escribir los combates opcionales de cada piso y su recompensa menor.
1673. Verificar que ningún combate opcional bloquee el paso del ascenso.
1674. Verificar que los cuatro combates obligatorios conserven sus niveles 130 a 145.
1675. Escribir el altar de cada piso como punto de curación narrativo.
1676. Verificar que el altar cure sin abrir menú de tienda ni objetos infinitos.
1677. Escribir los diálogos de Maya, Jericor, Quinoa y Cintia con voz propia.
1678. Verificar que ningún campeón repita el discurso de otro campeón del proyecto.
1679. Escribir la aproximación 2038 con sus santuarios laterales ampliados y sus hitos.
1680. Verificar que la aproximación conserve su avenida de cinco casillas y sus cuatro niveles.
1681. Verificar que el portal de Puntaneva siga mandando a la aproximación y no al primer piso.
1682. Escribir el combate contra Volus y su epílogo sin tocar el canon de Arceus.
1683. Verificar que el duelo de Arceus conserve sus veinticinco dobles coreografiados.
1684. Verificar que los sprites ARCEUS_F1 a ARCEUS_F5 y la Forma Origen sigan asignados a sus fases.
1685. Escribir la escena del Fragmento y la aparición del Rotom del Tiempo con más detalle.
1686. Verificar que la escena del Fragmento no se pueda saltar con un warp directo.
1687. Escribir la captura de Arceus y su aparición junto a Oak y antes de Mad Pikachu.
1688. Verificar que capturar Arceus no rompa las banderas del duelo.
1689. Verificar que perder contra Arceus permita reintentar sin castigo.
1690. Escribir la Guía de los Testigos (2030) y su función narrativa tras el duelo.
1691. Verificar que la gruta de testigos no sea alcanzable antes del duelo.
1692. Escalar la densidad de la gruta al estándar de mapa de ciudad con contenido propio.
1693. Verificar que la gruta conserve su retorno a Puntaneva.
1694. Escribir las reacciones del mundo tras el duelo de Arceus en al menos cinco mapas originales por vía aditiva.
1695. Verificar que esas reacciones se añadan como eventos nuevos sin editar los originales.
1696. Verificar que ninguna reacción del mundo se dispare antes del duelo.
1697. Recorrer la Ruta de Dios completa con el caminante automático y corregir atascos.
1698. Recorrer la Ruta de Dios en partida real de punta a punta y anotar hallazgos.
1699. Verificar que el ascenso se pueda abandonar a mitad y retomar por el portal.
1700. Verificar que el ascenso no deje ningún switch de piso a medias al abandonarlo.
1701. Empaquetar el lote de la Ruta de Dios en `PokeModBackups/plan2700_ruta_de_dios`.
1702. Escribir el acta de La Ruta de Dios en `docs/qa/regiones/ruta_de_dios.md`.
1703. Verificar que `npm run verify:ruta_de_dios` y `npm run rebuild:ruta_de_dios` sigan en verde.
1704. Verificar que `npm run verify:arceus:cinematics` no se rompa con las escenas nuevas.
1705. Actualizar `docs/INFORME_LA_RUTA_DE_DIOS.md` con la densidad nueva de los siete pisos.
1706. Verificar que el informe actualizado coincida con lo instalado.
1707. Verificar que la extensión de la Ruta de Dios no haya tocado mapas originales fuera de los IDs nuevos.
1708. Verificar con `node tools/inventario_congelado.mjs --verify` el alcance real de los cambios.
1709. Verificar que el rango 2030–2038 quede documentado como cerrado y no se reutilice.
1710. Cerrar el bloque de La Ruta de Dios con su densidad elevada y su canon intacto.
1711. Abrir el contenido de Atlas Mil: hoy son 1000 mapas (1021–2020) con 6,62 eventos de media.
1712. Elevar los 1000 mapas al estándar del sector 01 usando el pipeline de lotes de sesenta y tres.
1713. Trabajar Atlas en dieciséis lotes de sesenta y tres mapas y un lote final de cuarenta.
1714. Escribir la ficha visual de cada lote antes de tocar sus mapas.
1715. Verificar que cada lote cierre con acta y con `npm run verify:atlas` en verde.
1716. Escribir los jefes intermedios de Atlas, uno por cada cuatro mapas de ruta.
1717. Verificar que ningún jefe intermedio sea un entrenador genérico sin nombre ni sprite.
1718. Escribir las ciudades de servicio de Atlas y su función en el circuito.
1719. Verificar que cada ciudad de servicio tenga curación, tienda y rumor del circuito activo.
1720. Escribir los secretos de Atlas: al menos un objeto oculto por cada diez mapas.
1721. Verificar que ningún secreto de Atlas quede fuera de alcance del caminante.
1722. Escribir la fauna de cada franja de Atlas y verificar su coherencia con el bioma.
1723. Verificar que ninguna franja de Atlas tenga niveles planos en todos sus mapas.
1724. Escribir el clima de cada franja de Atlas y su rotación por avance del circuito.
1725. Verificar que el clima de Atlas se apague al entrar en interiores y ciudades.
1726. Escribir la música de cada franja de Atlas y su variación con las medallas ganadas.
1727. Verificar que la música de Atlas no se reinicie al cambiar de mapa dentro de la misma franja.
1728. Escribir los ocho gimnasios de Atlas con su puzle propio y su líder ya instalados.
1729. Verificar que los ocho puzles de Atlas sean distintos entre sí y de los de las otras regiones.
1730. Verificar que los ocho líderes de Atlas tengan equipo ascendente y cobertura propia.
1731. Escribir las medallas de Atlas y su iconografía propia y no prestada.
1732. Verificar que las ocho medallas de Atlas se vean en el visor.
1733. Escribir la Avenida del Circuito (2230) como hub real de la región con servicios.
1734. Verificar que la avenida tenga movimiento constante y no sea un decorado.
1735. Verificar que la avenida anuncie el estado del circuito y la medalla siguiente.
1736. Escribir las 40 anclas Tier 1 como picos narrativos y no solo como marcadores de switch.
1737. Verificar que cada ancla tenga su narración propia y su recompensa temática.
1738. Verificar que ningún ancla repita la estructura literal de otra.
1739. Verificar que los switches 708–747 sigan disparándose exactamente una vez cada uno.
1740. Escribir las rutas Tier 2 macro04 a macro07 con su contenido completo.
1741. Verificar que cada macro de Tier 2 tenga su acta de QA en `content/atlas_tier2_qa_macroNN.json`.
1742. Verificar que las reglas Tier 3 se cumplan en los mapas nuevos.
1743. Verificar que ningún mapa de Atlas quede con celdas sin metatile asignado.
1744. Verificar que ningún mapa de Atlas tenga pasillo de una celda sin alternativa.
1745. Verificar que ninguna ciudad de Atlas quede sin salida clara al circuito.
1746. Recorrer tres franjas completas de Atlas con el caminante automático y corregir atascos.
1747. Recorrer dos franjas completas de Atlas en partida real y anotar hallazgos.
1748. Corregir los problemas de ritmo detectados en el recorrido real de Atlas.
1749. Verificar que Atlas se pueda abandonar en cualquier mapa y volver por el portal.
1750. Verificar que el portal de Atlas no pueda abrirse antes de la Ruta de Dios.
1751. Empaquetar cada lote de Atlas en `PokeModBackups/plan2700_atlas_lote<NN>`.
1752. Escribir el acta de cada lote de Atlas en `docs/qa/lotes/atlas_<NN>.md`.
1753. Escribir el acta maestra de Atlas en `docs/qa/regiones/atlas_mil.md`.
1754. Verificar que la densidad media de Atlas suba al estándar medido de sus primeras franjas.
1755. Verificar que el aumento de densidad de Atlas no ralentice el juego.
1756. Verificar que ningún mapa de Atlas supere los sesenta eventos sin justificación escrita.
1757. Verificar que la ampliación de Atlas no toque ningún mapa original de Fire Ash.
1758. Verificar con `node tools/inventario_congelado.mjs --verify` el alcance de cada lote de Atlas.
1759. Verificar que los 40 verificadores parciales de Atlas se puedan correr todos juntos.
1760. Verificar que `npm run verify:atlas` siga siendo la puerta única de la región.
1761. Escribir el resumen narrativo de Atlas con sus personajes recurrentes y su conflicto propio.
1762. Verificar que Atlas tenga al menos tres personajes que reaparezcan en varias franjas.
1763. Verificar que esos tres personajes tengan arco y no solo apariciones sueltas.
1764. Escribir el enemigo principal de Atlas y su motivación dentro del multiverso.
1765. Verificar que el enemigo de Atlas no sea un calco del de otra dimensión.
1766. Escribir el final de Atlas y su recompensa única de región.
1767. Verificar que la recompensa final de Atlas no se solape con la de otra dimensión.
1768. Verificar que el final de Atlas no cierre puertas de otras dimensiones.
1769. Actualizar `docs/ATLAS_MIL_TRES_AVENTURAS.md` y `docs/500_EVENTOS_Y_PELEAS_ATLAS_MIL.md` con la densidad nueva.
1770. Cerrar el bloque de Atlas con los 1000 mapas al estándar del sector 01 y su acta maestra.
1771. Abrir el contenido de Dimensional Nightmare: hoy son 151 mapas con 9,04 eventos de media.
1772. Elevar los mapas del ciclo del Nightmare al estándar de mazmorra del bloque.
1773. Escribir el hub 2040 con sus eventos pendientes y su función de centro de operaciones.
1774. Verificar que el hub 2040 conecte con todas las entradas del ciclo.
1775. Escribir los seis jefes del Nightmare con su texto de entrada y su despedida.
1776. Verificar que los seis jefes permitan perder y reintentar.
1777. Escribir las setenta y siete anomalías con su comportamiento verificable.
1778. Verificar que ninguna anomalía se pueda disparar dos veces sin reinicio.
1779. Escribir los ochenta NPC del Nightmare con voz propia y rutina.
1780. Verificar que ningún NPC del Nightmare quede bloqueando un pasillo crítico.
1781. Escribir el arte de prioridad alta del Nightmare pendiente según su plan de cierre.
1782. Verificar que el arte nuevo del Nightmare pase `npm run dn:art:verify`.
1783. Verificar que el audio del Nightmare pase `npm run dn:audio:verify`.
1784. Verificar que los mapas del Nightmare pasen `npm run dn:maps:verify` y `dn:polish:verify`.
1785. Verificar que las medallas del Nightmare pasen `npm run dn:medals:verify`.
1786. Verificar que la liga del Nightmare pase `npm run dn:liga:verify`.
1787. Verificar que las sensaciones del Nightmare pasen `npm run dn:sens:verify`.
1788. Verificar que los flags del Nightmare pasen `npm run dn:flags:verify`.
1789. Verificar que la historia del Nightmare pase `npm run dn:story:verify`.
1790. Verificar que el segundo anillo W7–W9 mantenga sus 48 mapas y sus jefes.
1791. Verificar que los episodios EP01 a EP06 mantengan su contenido tras la ampliación.
1792. Recorrer el ciclo completo del Nightmare con el caminante automático y corregir atascos.
1793. Recorrer dos episodios del Nightmare en partida real y anotar hallazgos.
1794. Verificar que el Nightmare no escriba nunca en el contador de emisiones `v[264]`.
1795. Verificar que el Nightmare no altere `docs/AUDITORIA_TOTAL_FLAGS.md` ni `docs/qa_render/`.
1796. Empaquetar el lote del Nightmare en `PokeModBackups/plan2700_nightmare`.
1797. Escribir el acta del Nightmare en `docs/qa/regiones/dimensional_nightmare.md`.
1798. Actualizar `docs/DIMENSIONAL_NIGHTMARE/13_PLAN_DE_CIERRE.md` con lo cerrado en esta pasada.
1799. Ejecutar `npm run dn:verify:all` completo y resolver cada aviso restante.
1800. Cerrar el bloque de contenido real con las siete regiones, las cinco campañas y las seis dimensiones escritas de verdad.
