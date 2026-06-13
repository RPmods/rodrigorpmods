# STRINOVA Draft System v3.2.3 by RPmods

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
