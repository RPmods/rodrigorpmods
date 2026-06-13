# STRINOVA Draft System v3.2.9 by RPmods

Versión estable del sistema draft competitivo.

## Cambios principales v3.1

- Se añadió un mini lobby de configuración antes de iniciar el draft local.
- Se añadieron tamaños configurables de partida: 2v2, 3v3, 4v4 y 5v5.
- Se añadió opción para activar o desactivar la fase de bloqueos.
- Si la fase de bloqueos está desactivada, el draft inicia directamente en selección de personajes.
- El resumen final, slots, picks, reglas visibles y selección aleatoria se adaptan al tamaño elegido.
- El lobby online clásico sincroniza la configuración de tamaño de partida y fase de bloqueos mediante Firebase.
- Se añadió base visual en el lobby online para modo clásico / modo avanzado, dejando el modo avanzado 5v5 preparado para una actualización futura.
- Updates / Historial actualizado hasta v3.1.

## Hotfix v3.1

- El Modo avanzado ya no queda bloqueado visualmente en el lobby del host.
- La selección de Modo avanzado se puede combinar con 2v2, 3v3, 4v4 y 5v5.
- El video de fondo queda como reproducción local independiente por usuario; no se sincroniza por sala.
- La precarga crítica de recursos ahora se muestra justo después del aviso de F11 y antes de continuar con la intro/menú.
- Updates / Historial incluye la entrada del hotfix v3.1.

## Hotfix v3.1.2 Security

- Se registró la rotación de la Firebase Web API Key usada por la versión pública en GitHub Pages.
- Se retiró la referencia a la clave anterior expuesta y se actualizó la configuración web para usar la nueva clave restringida.
- Se documentó la recomendación de mantener restricciones por dominio y reglas de Realtime Database revisadas.
- Updates / Historial incluye la entrada v3.1.2 HOTFIX (Security).


## Hotfix v3.1.3 UI

- Corrección visual de selectores desplegables en Idioma, Audio de narración y mini-lobby online.
- Unificación visual de controles en el lobby de crear sala.


## Hotfix v3.1.4 Online Presence

- Se desactivó la restauración automática silenciosa de salas online al abrir la página.
- Abrir la web ya no debe crear ni reactivar nodos en `rooms` por sí solo.
- La reconexión queda como acción explícita usando código de sala y nombre.


## Hotfix v3.1.5 Env Config / GitHub Pages

- La configuración web de Firebase ya no está escrita directamente en `js/firebase.js`.
- `js/firebase.js` ahora lee `window.RPMODS_FIREBASE_CONFIG` desde `js/firebase-env.js`.
- `js/firebase-env.js` no debe subirse con valores reales al repo público; se genera en GitHub Actions desde Repository Secrets.
- Para local, copia `js/firebase-env.example.js` como `js/firebase-env.js` y rellena tus datos solamente en tu PC.

Secrets necesarios en GitHub Actions:

- `RPMODS_FIREBASE_API_KEY`
- `RPMODS_FIREBASE_AUTH_DOMAIN`
- `RPMODS_FIREBASE_DATABASE_URL`
- `RPMODS_FIREBASE_PROJECT_ID`
- `RPMODS_FIREBASE_STORAGE_BUCKET`
- `RPMODS_FIREBASE_MESSAGING_SENDER_ID`
- `RPMODS_FIREBASE_APP_ID`

Para publicar con este sistema, configura GitHub Pages para usar GitHub Actions como fuente de despliegue.


## Hotfix v3.1.6 GitHub Pages Env Path

- Paquete preparado para repositorios donde la app vive dentro de `strinova/`.
- El workflow debe estar en `.github/workflows/deploy-pages.yml` en la raíz del repositorio.
- GitHub Actions genera `strinova/js/firebase-env.js` usando Repository Secrets.
- No subir manualmente `strinova/js/firebase-env.js` con valores reales.


## v3.2.0 Modo Avanzado Online

- Se añadió modo avanzado online real para 2v2, 3v3, 4v4 y 5v5.
- El líder/host puede quedarse como espectador o asignarse a un slot de jugador.
- En modo avanzado los nombres de los slots se rellenan desde los usuarios conectados.
- Los bans avanzados se reparten entre capitán y subcapitán.
- Los picks avanzados son individuales por jugador/slot.
- Se añadieron avisos visuales diferenciados: tu turno, compañero actuando, rival actuando y espectador.
- Se corrigió el caso donde Updates / Historial podía mostrar claves internas como update_15.


## v3.2.1 Hotfix Advanced Voice/Text

- Se corrigieron los textos del modo avanzado para usar frases específicas:
  - TU EQUIPO ESTÁ BLOQUEANDO UN LAMINANTE.
  - TU EQUIPO ESTÁ BLOQUEANDO UN LAMINANTE DE LAS CIZALLAS.
  - TU EQUIPO ESTÁ SELECCIONANDO UN LAMINANTE.
  - POR FAVOR SELECCIONA UN LAMINANTE.
  - POR FAVOR BLOQUEA UN LAMINANTE.
  - POR FAVOR BLOQUEA UN LAMINANTE DE LAS CIZALLAS.
- Se añadieron claves de voz nuevas para que puedas agregar archivos de audio correspondientes.
- Se agregó soporte i18n para los idiomas disponibles.


## v3.2.2 Testing Bots

- Se añadió un apartado de Testing Bots en el lobby online para el host.
- En modo clásico, el host puede rellenar capitanes vacantes con bots.
- En modo avanzado, el host puede rellenar slots vacantes con bots.
- Los bots aparecen como participantes de sala y pueden ser eliminados antes de iniciar.
- Durante el draft, si el turno pertenece a un bot, el host ejecuta automáticamente la simulación:
  - el bot preselecciona un personaje válido;
  - confirma ban o pick;
  - sincroniza el resultado en Firebase.
- Los bots respetan personajes disponibles, facción de ban, picks válidos y no duplican seleccionados/baneados.
- Se añadió soporte i18n para el apartado de Testing Bots en los idiomas disponibles.


## v3.2.3 Hotfix Testing Bots

- Se corrigió el error al pulsar "Rellenar slots vacantes con bots" en modo avanzado.
- La causa era una actualización multi-ruta conflictiva en Firebase Realtime Database.
- Ahora el sistema guarda los slots avanzados de bots sin mezclar rutas padre e hijas dentro del mismo update.
- Se mantiene el soporte para bots en modo clásico y avanzado.


## v3.2.4 Hotfix Online Finish + Host Name

- Se restauró el anuncio/voz online de finalización del draft.
- El final online vuelve a usar `voice_finish_draft` / `voice_finish_draft.ogg|mp3|mp4`.
- Los espectadores/jugadores remotos ahora reciben el overlay de finalización antes del resumen.
- Se añadió un apartado "Nombre del líder" en el lobby del host.
- Si el host se asigna como capitán, subcapitán o jugador, su nombre se usa automáticamente en el slot y en el draft.
- El nombre del host se guarda localmente para reutilizarlo en salas futuras.


## v3.2.5 Hotfix Bot Thinking Delay

- Los bots ya no confirman casi de inmediato.
- Cuando llega el turno de un bot, simula estar pensando entre 3 y 6 segundos.
- Durante ese tiempo hace varias preselecciones aleatorias de laminantes válidos.
- Al final confirma el ban o pick con una pequeña pausa final.
- Aplica tanto para modo clásico como para modo avanzado.


## v3.2.7 Ready Check + Visual Turn UI

- Se redujo y se movió más arriba el cuadro de anuncio online de turno.
- Se ocultó visualmente el panel antiguo que quedaba detrás del aviso de turno en online.
- El botón de confirmar se conserva y aparece separado cuando corresponde.
- Al presionar "Iniciar draft" en online, ahora se abre una fase de listo antes de iniciar el draft.
- Cada jugador asignado ve una caja con su nombre.
- La caja pasa de gris oscura a más brillante cuando el jugador marca LISTO.
- El botón LISTO es grande, centrado y rojo; al pulsarlo cambia a "Esperando a los demás jugadores".
- Cuando todos están listos, se muestra la transición con `video/introV/Loading.mp4` antes de entrar al draft.
- Los bots participan en el ready check automáticamente.
- Los bots ya no usan nombres tipo BOT; toman nombres aleatorios desde `player_names_config.js`.


## v3.2.8 Hotfix Random Button + Ready Polish

- Se reposicionó el botón de selección aleatoria dentro del panel inferior del draft.
- El botón ya no queda flotando ni encima del área de personajes.
- El layout del panel inferior ahora reserva columnas para: estado, personaje, selección aleatoria, confirmar y limpiar.
- Se pulió la animación de entrada del ready check online:
  - overlay con fade inicial;
  - tarjeta central con entrada cinematográfica;
  - cajas de jugadores con animación de caída/enganche;
  - cajas listas con brillo/pulso;
  - estado loading con pulso visual.
- Se actualizó Updates / Historial con v3.2.8.


## v3.2.9 Hotfix UI Alignment + Ready Timeout + Map Polish

- Se reajustó el cuadro grande de turno para que quede centrado, más compacto y un poco más abajo de la barra de tiempo.
- Se reorganizó el panel inferior del draft para que SELECCIONAR/BANEAR y SELECCIÓN ALEATORIA puedan convivir sin romper el selector.
- Se cambió el texto de rival avanzado para evitar que TEAM A / TEAM B salga gigante fuera del cuadro.
- En ready check:
  - se retiraron las líneas que sostenían visualmente las tarjetas;
  - los nombres ahora viven dentro de una caja interna uniforme;
  - los nombres largos se ajustan dentro de la tarjeta;
  - la animación de listo deja de reiniciar todas las tarjetas;
  - se añadió timeout de 30 segundos para confirmar listo.
- Si el ready check vence o un jugador requerido se desconecta antes de estar listo, se cancela y vuelve al lobby.
- La ruleta de mapas ahora usa borde dorado/brillo sin reconstruir tarjetas ni provocar parpadeos visuales fuertes.
- Los jugadores pueden retirarse al terminar el draft usando un botón de salida en el resumen.
