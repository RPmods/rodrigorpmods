# Décima revisión — v3.4.36

## Corrección definitiva de ancho en Gacha Sim

- Se identificó una regla genérica con mayor especificidad que aplicaba `width: min(1180px, 100%)` a todas las vistas excepto Menú y Torneo.
- Gacha Sim ahora queda excluido explícitamente de esa regla.
- Se añadió el estado aislado `gacha-surface-active` para proteger el layout sin afectar otras pestañas ni el Draft.
- Se mantiene el diseño de dos columnas en pantallas amplias y una columna en pantallas menores.
- Se añadió una validación automática de regresión para el ancho, los 24 casilleros y los botones Sortear, Resultado rápido y Reiniciar.

## Archivos modificados

- `strinova/css/styles.css`
- `strinova/js/tournament.js`
- `strinova/index.html`
- `strinova/js/draft_flow_v346.js`
- `strinova/package.json`
- `strinova/scripts/validate-gacha-layout.js`
