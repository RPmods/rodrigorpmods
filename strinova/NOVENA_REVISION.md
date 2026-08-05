# Novena revisión — v3.4.25

## Corrección del Draft

Se corrigió un error introducido por el guard de estabilidad de v3.4.24:

- La confirmación marcaba el turno como pendiente antes de llamar a la función base.
- La función base volvía a consultar `canControlCurrentTurn()`.
- El propio estado pendiente hacía que esa consulta devolviera `false`.
- Como resultado, un jugador real podía preseleccionar, pero **SELECCIONAR** no completaba el pick/ban.
- La ruleta manual y la auto-resolución podían reproducir la animación sin confirmar el resultado.

La nueva implementación:

1. valida la propiedad del turno antes de crear el estado pendiente;
2. reclama el turno online mediante `draftState/rp3425TurnCommit`;
3. llama a la función base con autorización interna solo después de validar y reclamar;
4. marca el claim como `committed` cuando la acción comenzó realmente;
5. libera claims incompletos cuando ocurre un error;
6. permite que el mismo cliente recupere un claim incompleto, evitando bloqueos temporales.

## Gacha Lab

Se añadió un nuevo apartado **GACHA LAB** junto a Torneo.

Características de la primera versión:

- ingreso del resultado de la última tirada;
- selección visual de los colores del último aro;
- contador de tiradas restantes para Legendary y Epic o superior;
- simulación de una ventana de 12 tiradas;
- ruleta animada inspirada en la interfaz mostrada por el usuario;
- probabilidades base de calidad;
- guardado local de la configuración;
- no muestra ni predice recompensas concretas.

La simulación usa las tasas públicas de calidad del sistema Reconstruction:

- Legendary: 0.65%, garantía máxima 80;
- Epic: 5%, Epic o superior garantizado en 30;
- Rare: 24%;
- Refined: 70.4%.

Los colores de tiradas anteriores solo modifican la semilla visual y no se presentan como una forma de alterar las probabilidades reales.
