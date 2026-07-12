# STRINOVA Draft System v3.4.2 by RPmods

Versión estable del sistema draft competitivo.

## Cambios principales v3.1

- Se añadió un mini lobby de configuración antes de iniciar el draft local.
- Se añadieron tamaños configurables de partida: 2v2, 3v3, 4v4 y 5v5.
- Se añadió opción para activar o desactivar la fase de bloqueos.
- Si la fase de bloqueos está desactivada, el draft inicia directamente en selección de personajes.
- El resumen final, slots, picks, reglas visibles y selección aleatoria se adaptan al tamaño elegido.
- El lobby online clásico sincroniza la configuración de tamaño de partida y fase de bloqueos mediante RPmods Services.
- Se añadió base visual en el lobby online para modo clásico / modo avanzado, dejando el modo avanzado 5v5 preparado para una actualización futura.
- Updates / Historial actualizado hasta v3.1.

## Hotfix v3.1

- El Modo avanzado ya no queda bloqueado visualmente en el lobby del host.
- La selección de Modo avanzado se puede combinar con 2v2, 3v3, 4v4 y 5v5.
- El video de fondo queda como reproducción local independiente por usuario; no se sincroniza por sala.
- La precarga crítica de recursos ahora se muestra justo después del aviso de F11 y antes de continuar con la intro/menú.
- Updates / Historial incluye la entrada del hotfix v3.1.

## Hotfix v3.1.2 Security

- Se registró la rotación de la RPmods Services Web API Key usada por la versión pública en GitHub Pages.
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

- La configuración web de RPmods Services ya no está escrita directamente en `js/firebase.js`.
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
  - sincroniza el resultado en RPmods Services.
- Los bots respetan personajes disponibles, facción de ban, picks válidos y no duplican seleccionados/baneados.
- Se añadió soporte i18n para el apartado de Testing Bots en los idiomas disponibles.


## v3.2.3 Hotfix Testing Bots

- Se corrigió el error al pulsar "Rellenar slots vacantes con bots" en modo avanzado.
- La causa era una actualización multi-ruta conflictiva en RPmods Services.
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


## v3.2.10 Hotfix Turn Banner + Ready Countdown

- Se redujo y recolocó el banner de turno propio/equipo para que tape menos al personaje.
- El turno enemigo vuelve a mostrarse como aviso grande centrado y opacante.
- Se redujo la caja de información del personaje en el panel inferior.
- BANEAR/SELECCIONAR y SELECCIÓN ALEATORIA ahora tienen el mismo ancho y están mejor apilados.
- El contador del ready check ahora se actualiza localmente cada 0.5 segundos, sin depender de cambios de RPmods Services, para evitar que se quede congelado en 28/27.


## v3.2.11 Hotfix Panel Buttons Alignment

- Se ajustó la grilla del panel inferior.
- La caja de información del personaje se movió más a la izquierda.
- La caja de información del personaje se redujo para liberar espacio.
- BANEAR/SELECCIONAR y SELECCIÓN ALEATORIA ahora tienen exactamente el mismo ancho.
- El botón de limpiar selección mantiene su columna propia sin empujar los otros botones.


## v3.2.12 Hotfix Equal Action Buttons

- Se corrigió el ancho real de los botones del panel inferior.
- BANEAR/SELECCIONAR y SELECCIÓN ALEATORIA ahora usan exactamente la misma anchura.
- La columna de acciones queda fija.
- La caja de información del personaje se redujo/movió para liberar espacio y alinear mejor los botones.


## v3.2.13 Hotfix Deep Equal Buttons

- Se corrigió a profundidad el ancho real del botón BANEAR/SELECCIONAR.
- El problema venía de reglas CSS antiguas que seguían aplicando `min-width: 176px` y padding al botón principal.
- Ahora BANEAR/SELECCIONAR y SELECCIÓN ALEATORIA usan la misma caja real con `width`, `min-width`, `max-width`, `inline-size`, `flex-basis` y `box-sizing` forzados.
- Se redujo el botón/texto de "esperando a los demás jugadores" en ready check.


## v3.2.14 Hotfix Selected Button + Map Voice

- Se corrigió el estado visible del botón BANEAR/SELECCIONAR.
- Cuando el jugador selecciona un personaje y el botón aparece, ya no debe heredar el min-width antiguo.
- El botón BANEAR/SELECCIONAR y SELECCIÓN ALEATORIA quedan iguales también en estado seleccionado/.ban.
- Se corrigió la voz de selección de mapa para que no suene dos veces al pasar del draft a la selección de mapa online.


## v3.2.15 Update Online Sync + Animation Performance

- Se redujeron escrituras y reconstrucciones completas del modo online.
- El hover de personajes permanece local; la selección fijada usa una actualización pequeña.
- Las ruletas de personajes y mapas se sincronizan como una sola secuencia temporizada.
- Se eliminó el listener duplicado de la sala.
- El video de fondo ya no se recarga por pausas breves del hilo principal.
- Las animaciones de bloqueo y selección usan una sola implementación final, con menos filtros y sin reconstruir el grid de personajes.
- Las referencias visibles del servicio online usan el nombre RPmods Services.


## v3.2.16 Update Modern Draft Animations

- Se modernizaron las animaciones de confirmación de BAN y PICK con efectos visuales diferenciados.
- Las nuevas secuencias priorizan `transform` y `opacity` para reducir trabajo de pintura.
- Las casillas de jugadores mantienen nodos estables en lugar de reconstruirse completamente.
- Se añadieron estados visuales para slot vacío, turno activo, previsualización y selección confirmada.
- La animación de una selección confirmada no se reinicia por actualizaciones repetidas del modo online.
- Se añadió compatibilidad específica con `prefers-reduced-motion`.


## v3.2.17 Update Integrated Online Notices

- Los mensajes del modo online ya no utilizan cuadros nativos del navegador.
- RPmods Services muestra una tarjeta integrada y animada cuando no está disponible.
- La tarjeta incluye acciones de reintento y cierre.
- Los errores, advertencias e información restante aparecen como notificaciones no bloqueantes dentro de la página.
- Se mantiene intacta la conexión y la estructura de datos del servicio online.



## v3.2.19 Update Silent Multi-Intro Precache

- Se configuraron cinco parejas inseparables de video y música: `Intro_menu.mp4`/`music_intro.mp3` hasta las variantes `_5`.
- La pareja se elige al aceptar el aviso principal y no repite inmediatamente la usada en la ejecución anterior.
- El video y su audio se precargan con prioridad alta y permanecen en elementos multimedia persistentes para evitar una segunda inicialización al comenzar la intro.
- La precarga general comienza en paralelo sin mostrar la pantalla de progreso.
- Las otras cuatro parejas se procesan con prioridad baja, una por una y durante tiempo inactivo, para no competir con la reproducción actual.
- Si una variante no está disponible, el sistema vuelve de forma segura a la pareja original.

## v3.2.18 Update Online Connection Gate

- Crear sala, abrir el formulario para unirse y confirmar la entrada verifican primero la conexión real a RPmods Services.
- Durante la validación aparece el estado “Comprobando conexión a RPmods Services”.
- Si el servicio no responde, la acción queda pendiente y aparece el botón RECONECTAR.
- Al recuperar la conexión, la acción pendiente continúa automáticamente sin repetir los datos.
- La comprobación usa el estado `.info/connected` y no se limita a comprobar que el SDK esté cargado.


## v3.2.20 Hotfix Multi-Intro Selection

- Se separó el estado “todavía cargando” de un error multimedia real.
- Una variante ya no vuelve a `Intro_menu.mp4` solo por no alcanzar `canplaythrough` dentro del tiempo de precarga.
- La validez se confirma desde `loadedmetadata`, `loadeddata`, `canplay` o un error real del elemento multimedia.
- Se normalizaron las comparaciones de rutas para funcionar correctamente tanto en web como al abrir `index.html` localmente.
- El fallback a la pareja original se conserva, pero solo se activa cuando el MP4 o MP3 seleccionado reporta un error real.


## v3.2.21 Update Dedicated Intro Media Structure

- Las cinco parejas de intro se migraron a una ruta dedicada: `media/intro-menu/intro-01` hasta `intro-05`.
- Cada carpeta utiliza exactamente dos nombres: `video.mp4` y `music.mp3`.
- La aplicación intenta primero la nueva estructura y conserva las rutas antiguas como fallback temporal.
- El video y su música se resuelven como una pareja completa para evitar combinaciones incorrectas.
- Se añadieron carpetas preparadas dentro del paquete para colocar los recursos locales.

Estructura recomendada:

```text
media/intro-menu/
├── intro-01/
│   ├── video.mp4
│   └── music.mp3
├── intro-02/
│   ├── video.mp4
│   └── music.mp3
├── intro-03/
│   ├── video.mp4
│   └── music.mp3
├── intro-04/
│   ├── video.mp4
│   └── music.mp3
└── intro-05/
    ├── video.mp4
    └── music.mp3
```


## v3.2.22 Update Intro Selection Settings

- Nuevo apartado de intro dentro de Configuración.
- La selección aleatoria permanece activada de forma predeterminada.
- Al desactivarla, puede elegirse manualmente INTRO 01 a INTRO 05.
- La preferencia se guarda en la configuración local.
- El modo manual y el aleatorio utilizan la misma precarga silenciosa por parejas.
- El modo aleatorio continúa evitando repetir inmediatamente el conjunto anterior.


## v3.2.23 Update Named Intro Sets

Los conjuntos muestran estos nombres en Configuración:

1. `Strinova Season 9 (26sp3)`
2. `Strinova Season 6 (Michelle Skin)`
3. `Strinova Season 7 (p2)`
4. `Strinova Season 7`
5. `Kanami [Be Shining] - Strinova`

Los nombres están centralizados en `INTRO_MENU_SETS`. No se modificaron las rutas, el modo aleatorio, la selección manual ni la asociación de cada `video.mp4` con su `music.mp3`.


## v3.2.26 Hotfix Stable Flow Restore

- Se restauró `js/app.js` desde la base estable v3.2.23 para recuperar el modo online, el inicio del draft local y los botones de retorno/cancelación.
- Se mantiene la estructura original de rutas para `img/`, `audio/`, `video/`, `media/` y `js/firebase-env.js`.
- Este parche no debe reemplazar recursos privados ni carpetas pesadas; solo corrige código y metadatos visibles.
- Se actualizó Updates / Historial a v3.2.27.

## v3.2.27 Hotfix Bot Phase Guard

- Se corrigió la lógica de Testing Bots para que no empiecen a preseleccionar durante el anuncio de transición entre la fase de bloqueos y la fase de selección.
- Los bots ahora respetan `turnStartedAt`, `turnDeadlineAt`, `phase-announcing`, `overlay-lock` y el estado `locked` antes de pensar, preseleccionar o confirmar.
- Se limpia cualquier temporizador pendiente de bot al abrir un anuncio de fase para evitar acciones atrasadas durante la transición.
- Se actualizó Updates / Historial a v3.2.27.


## v3.3.0 Gantigun Cup 2026 Tournament Hub Base

- Se añadió la primera extensión visual de torneo sin reemplazar el Draft System.
- Nuevo apartado `TORNEO` en el menú principal.
- Se agregó el equipo `YO4HVNS` con capitán, sub-capitán, titulares y suplentes pendientes.
- Se añadieron datos locales en `data/tournament/` y `data/game/`.
- Se integraron iconos de rangos en `img/ranks/`.
- Las estadísticas muestran aviso de que no se actualizan en tiempo real y la fecha/hora de última actualización manual.
- El map pool del torneo queda personalizado y puede incluir todos los mapas, aunque algunos no estén en ranked oficial.
- Se retiró el botón visible `Development · No disp.` del menú superior.
- Se añadió `Configuración → Ajustar HUD` con guía de zoom y opción de zona segura visual.

Aplicación recomendada: copiar estos archivos sobre la carpeta real `strinova/` conservando tus recursos privados: `img/characters/`, `audio/`, `video/`, `media/` y `js/firebase-env.js`.


## v3.3.1 Tournament Layout + Teams Hotfix

- Se movió el apartado TORNEO junto a MENÚ en la barra superior.
- Se corrigió la vista de torneo para que no se superponga con los paneles del draft.
- Se centró el Tournament Hub y se mejoró la escala para evitar cortes al cambiar tamaño o zoom.
- Se añadieron tres equipos de ejemplo usando nombres existentes de `player_names_config.js`.
- Los jugadores se ordenan por rango de mayor a menor; Laminante/Superstring queda por encima de Quark, Electron, etc.
- Se mejoró la estética del Tournament Hub con tarjetas, paneles y tablas más cercanas al lenguaje visual de Strinova.


## v3.3.2 Tournament Wide Layout Hotfix

- Se amplió el Tournament Hub para aprovechar más espacio horizontal y vertical.
- Se retiraron las pestañas Mapas y Reglas de la vista principal del torneo.
- Se reforzó el layout responsivo para evitar que tablas, perfiles o paneles se salgan al cambiar tamaño/zoom.
- Se añadió una sección de jugadores destacados dentro de Resumen.
- Se mantienen intactos el Draft System, Firebase, assets, videos, audios y workflow de deploy.


## v3.3.3 Tournament Scroll + UI Polish Hotfix

- Corrige el recorte vertical del Tournament Hub y permite desplazamiento natural con rueda del mouse.
- Rediseña tarjetas de equipos para evitar nombres cortados y mejorar lectura en resoluciones variables.
- Refuerza el panel de jugadores con scroll estable y perfil destacado sin tapar contenido.
- Moderniza la barra superior del menú principal con estilo más cercano al Tournament Hub.
- No modifica la lógica del draft ni `js/app.js`.

## v3.3.5 Menu + Tournament Background Polish Hotfix

- Se modernizó el diseño del menú principal sin tocar la lógica del draft.
- Se corrigieron detalles visuales de la barra superior y se retiraron marcadores triangulares que podían verse como bugs.
- Se estabilizó el fondo del Tournament Hub para que al bajar con la rueda del mouse no aparezca el video de fondo detrás.
- Se ampliaron tarjetas y filas de jugadores/equipos para reducir nombres cortados.
- El Tournament Hub mantiene desplazamiento natural de página, pero con fondo fijo propio.
- No se modificó `js/app.js`, Firebase, assets, videos, audios ni el workflow de deploy.

## v3.3.5 Menu Layout + Tournament Real Scroll Hotfix

- Reorganiza el diseño del menú principal con paneles más compactos y estilo de interfaz competitiva.
- Corrige el desplazamiento real del Tournament Hub al usar la rueda del mouse.
- Evita que la barra superior cambie de tamaño al entrar en el apartado Torneo.
- No modifica la lógica del draft ni los listeners online/locales.


## v3.3.7 Verified Menu + Tournament Scroll Hotfix

- Paquete regenerado con cambios verificables en `index.html`, `styles.css`, `tournament.js`, `i18n_config.js`, `package.json` y `README.md`.
- Se reforzó el scroll real del apartado Torneo usando clase activa en `html`, `body`, `setup-screen` y `setup-shell`.
- La barra superior del apartado Torneo conserva ancho estable y ya no debe cambiar al entrar o salir del tab.
- El menú principal se reorganizó visualmente con un layout más limpio y moderno, sin tocar la lógica del draft ni `js/app.js`.
- Se mantiene intacto el workflow, Firebase y las carpetas de recursos privados.

## Hotfix v3.3.7 — Responsive Setup Layout

- Se reestructuró el layout del menú y del Tournament Hub para salir del canvas fijo 1920x1080 mientras se está en la pantalla de configuración.
- El menú y el torneo ahora usan scroll real del documento, mejor centrado y barra superior estable en pantalla completa y modo ventana.
- Se mantuvo intacta la lógica del draft; este parche no modifica `js/app.js`.


## v3.3.8 UI Foundation — Menu & Tournament Rewrite

- Reestructura visual de la pantalla de inicio para usar un layout responsivo real y más estable en pantalla completa o ventana normal.
- La barra superior usa ancho estable, mantiene todos los apartados visibles y evita cambios bruscos entre Menú y Torneo.
- El Tournament Hub vuelve a usar scroll natural de documento y deja de depender del panel central VS del draft.
- Se corrige el duplicado accidental del panel de resumen del torneo en `index.html`.
- Se incluye `js/tournament_data.js` dentro del parche para evitar referencias faltantes en instalaciones incompletas.
- Se mantiene intacta la lógica del draft: este parche no modifica `js/app.js`.




## v3.3.12 Refined Motion System

- Se refinó el sistema de animaciones del menú principal, Tournament Hub y apartados de configuración.
- Se eliminaron efectos de blur y filtros animados que podían hacer que las tarjetas se vieran borrosas.
- Se redujo el desplazamiento de las transiciones para evitar el “tick” o salto visual al cambiar de apartado.
- Las animaciones ahora usan principalmente `opacity` y `transform`, con curvas más estables y menor coste de repintado.
- Se desactivó la animación continua del fondo en setup para evitar micro-stutter en equipos o navegadores sensibles.
- Se mantuvo intacta la lógica del draft; este parche no modifica `js/app.js`.

## v3.3.11 Menu Motion Polish

- Se añadieron microanimaciones ligeras de entrada para la pantalla de Menú y Tournament Hub.
- Se mejoraron los hover de botones, tarjetas, pestañas, equipos y perfiles usando transform/opacity para no cargar la UI.
- Se añadió brillo sutil en títulos y paneles principales, inspirado en la estética competitiva de Strinova.
- Se añadieron transiciones cortas entre apartados de configuración sin alterar el sistema draft.
- Se respeta `prefers-reduced-motion` para desactivar animaciones en equipos o usuarios que prefieren menos movimiento.
- Se mantiene el sistema de scroll invisible corregido en v3.3.10.

## v3.3.10 Stealth Scroll System

- Se ocultaron las barras de desplazamiento visibles de Menú, Torneo y apartados de configuración sin desactivar el scroll real.
- El comportamiento se alineó con las pantallas online: rueda del mouse, trackpad y teclado siguen funcionando, pero la barra visual no distrae ni cambia el ancho aparente de la interfaz.
- Se reforzó el modo responsivo de setup/tournament para evitar barras dobles, rieles laterales y desplazamientos visibles del navegador.
- No se modificó `js/app.js`; la lógica del draft permanece intacta.


## v3.3.10 Invisible Scroll Wheel Restore

- Fixed invisible-scroll behavior after v3.3.9 so Menu, Tournament and setup pages keep the clean rail-less look while mouse wheel, trackpad and keyboard scrolling remain active.
- The active setup screen is now the real scroll container instead of relying on the hidden document rail.
- Added a small fallback in `js/tournament.js` that routes wheel/keyboard scrolling to the active setup screen only while setup/tournament surfaces are active.
- Draft logic remains untouched.


## Hotfix v3.4.2 Tournament Isolation + Button Recovery

- Se aisló el Tournament Hub para que no aparezca en Menú, Configuración, Idioma, Random Selector ni otros apartados después de visitarlo.
- Se añadió recuperación de navegación para limpiar correctamente `view-tournament`, `tournament-surface-active` y el panel activo.
- Se añadieron capturas de seguridad para los botones críticos: Iniciar Draft Local, Crear Sala Online y Unirse a Sala.
- Se mantiene el flujo avanzado v3.4.x con selección de mapa previa, bans configurables y ruleta chibi de mapas.
