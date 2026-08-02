# Octava revisión — v3.4.24

## Objetivo

Corrección conservadora de estabilidad para el sistema Draft offline y online, sin cambiar el diseño ni los datos visibles del Tournament Hub.

## Cambios aplicados

1. **Guardia de confirmación por turno**
   - Se añadió un bloqueo lógico por identidad de turno: sala, sesión, índice, equipo, tipo, grupo y slot.
   - Evita que un mismo turno pueda confirmarse dos veces por doble clic, watchdog, bot, timeout o latencia.

2. **Commit online con transacción**
   - En salas online se registra `draftState/rp3424TurnCommit` mediante `transaction()` antes de confirmar un pick/ban.
   - Si otro cliente ya reclamó el mismo turno, la segunda confirmación se descarta.

3. **Auto-resolución online más segura**
   - La selección automática por timeout queda limitada al host.
   - Si no existen laminantes válidos para resolver el turno, el sistema ya no salta silenciosamente al siguiente turno; muestra advertencia y desbloquea de forma controlada.

4. **Propuestas PEDIR validadas**
   - Una propuesta aceptada se aplica solo si coincide con la misma sesión, mismo `turnIndex`, mismo equipo y slot válido del turno actual.
   - Las propuestas tardías se descartan y se limpian de Firebase.

5. **Selección simultánea protegida**
   - Si falla la transacción de una selección simultánea, se restaura el estado visual y el bloqueo para evitar que el draft quede congelado.
   - Se añadió protección contra finalizadores simultáneos duplicados.

6. **Compatibilidad Firebase v8**
   - Se reemplazaron llamadas `roomRef.get()` por `roomRef.once("value")`, compatible con la API namespaced usada por los scripts Firebase 8.10.1.

7. **Ruta de avatar en PEDIR**
   - Se corrigió la ruta del avatar de propuesta para usar `img/characters/thumbs/<Nombre>.png`.

## Archivos modificados

- `strinova/js/app.js`
- `strinova/js/draft_flow_v346.js`
- `strinova/index.html`
- `strinova/package.json`
- `strinova/OCTAVA_REVISION.md`

## Notas

Esta revisión reduce los fallos más peligrosos detectados: doble confirmación, auto-resolución desde clientes no host, propuestas tardías y errores por `.get()` en Firebase v8. No elimina todavía todos los hotfixes históricos; esa limpieza debe hacerse en una futura versión de refactorización.
