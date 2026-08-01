# Primera revisión técnica — STRINOVA Draft System

Esta revisión aplica correcciones conservadoras sin cambiar el diseño, las reglas del draft ni la estructura actual de Firebase Realtime Database.

## Cambios aplicados

### 1. Datos del torneo sincronizados desde JSON

- Los archivos de `data/` pasan a ser la fuente editable para los datos estáticos del torneo.
- Se añadió `scripts/build-tournament-data.js`.
- `js/tournament_data.js` ahora se genera automáticamente con:

```bash
npm run data:build
```

- Antes de compilar Electron también se regeneran y validan los datos.

### 2. Validación automática del proyecto

Se añadió `scripts/validate-project.js`, que comprueba:

- Sintaxis de todos los archivos JavaScript.
- Validez de todos los JSON de `data/`.
- Archivos esenciales del proyecto.
- IDs HTML duplicados.
- Referencias locales de CSS y JavaScript en `index.html`.
- IDs duplicados de equipos, jugadores, mapas, rangos y personajes.
- Relaciones entre equipos y jugadores.
- Sincronización entre `data/` y `js/tournament_data.js`.

Ejecutar con:

```bash
npm run validate
```

Para regenerar y validar en un solo paso:

```bash
npm run check
```

### 3. GitHub Pages

El workflow `.github/workflows/deploy-pages.yml` ahora:

1. Prepara Node.js.
2. Regenera `tournament_data.js` desde los JSON.
3. Valida el proyecto.
4. Genera la configuración de Firebase desde GitHub Secrets.
5. Publica únicamente si las comprobaciones anteriores finalizan correctamente.

### 4. Protección de datos recibidos desde Firebase

- Se normalizan y limitan los nombres online antes de mostrarlos o reutilizarlos.
- Se eliminan caracteres de control y los caracteres `<` y `>` de nombres externos.
- Los nombres de participantes, host, slots y ready check pasan por la misma normalización.
- Las solicitudes de personajes y los modales de asignación ya no insertan datos externos directamente mediante `innerHTML`.
- Los personajes recibidos en solicitudes se validan contra el catálogo local antes de mostrarse.

### 5. Guardado de configuración en Electron

- El IPC de guardado solo acepta solicitudes procedentes de la ventana local de Electron.
- Se valida el tipo, tamaño y formato del contenido antes de escribirlo.
- Se crea una copia de respaldo `character_layout_config.js.bak` antes de sobrescribir la configuración.
- Los errores de escritura se devuelven a la interfaz en lugar de provocar un fallo silencioso.
- Se bloquean ventanas emergentes y navegación externa dentro de la ventana principal.

## Elementos que no fueron modificados

- Diseño visual y CSS.
- Orden y reglas del draft.
- Estructura de salas en Firebase.
- Rutas de imágenes, audio o video.
- `draft_flow_v347.js`.
- Configuración real de Firebase y sus reglas de seguridad.
- Versión visible `3.4.18`.

## Comprobaciones realizadas

- `npm run check`: correcto.
- Sintaxis JavaScript: correcta.
- JSON: correctos.
- Workflow YAML: válido.
- Relaciones entre equipos y jugadores: correctas.
- `tournament_data.js`: sincronizado con `data/`.

## Nota sobre recursos multimedia

Los recursos `.jpg`, `.png`, `.mp3`, `.ogg` y `.mp4` no estaban en el ZIP recibido. No se modificaron sus rutas ni se eliminaron referencias, por lo que al copiar nuevamente esos recursos en sus ubicaciones originales deberían continuar funcionando.
