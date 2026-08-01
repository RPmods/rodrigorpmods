# Segunda revisión

## Cambios aplicados

1. **Versión visible sincronizada con Updates / Historial**
   - Se añadió una versión visible dentro del apartado `Updates / Historial`.
   - El título superior (`settings-brand`) y `document.title` ahora toman esa misma versión para evitar inconsistencias.

2. **Tournament Hub reducido solo a los 5 jugadores reales**
   - Se dejaron registrados únicamente los cinco jugadores reales del equipo `YO4HVNS`:
     - XLixusX
     - Brialブリッグス
     - iChitose02
     - itsZerOne
     - GantigunTTV
   - Se conservaron los dos suplentes vacíos del mismo equipo.
   - Se eliminaron del Tournament Hub los equipos y jugadores de ejemplo/demostración.
   - Los nombres eliminados del hub **no se borraron** de `player_names_config.js`, por lo que siguen disponibles para `NOMBRES ALEATORIOS`.

3. **Selector de chibi de selección de mapa**
   - Se retiró la visualización de rutas PNG dentro de Configuración.
   - Ahora aparece un selector de chibi disponible.
   - En esta revisión queda registrado un único set: `Chibi predeterminado`.
   - La selección queda preparada para ampliarse en el futuro sin volver a mostrar rutas técnicas.

## Archivos modificados

- `strinova/index.html`
- `strinova/css/styles.css`
- `strinova/js/draft_flow_v346.js`
- `strinova/data/tournament/players.json`
- `strinova/data/tournament/teams.json`
- `strinova/js/tournament_data.js` (regenerado)

## Nota

La versión visible actual queda tomada desde el atributo `data-current-version` del panel `Updates / Historial`.
Si deseas cambiar la versión mostrada arriba, basta con cambiar ese valor y el texto se sincronizará automáticamente al cargar la página.
