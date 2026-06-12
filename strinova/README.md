# STRINOVA Draft System v3.1.6 by RPmods

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
