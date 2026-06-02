# Draft Simulator

Prototipo de draft competitivo con interfaz estilo selección de personajes de videojuego.

Esta versión usa un **canvas interno fijo de 1920x1080**. La app calcula automáticamente la escala para la resolución real de la pantalla, así el HUD, los laterales, el dock inferior y el resumen no deberían moverse ni cortarse en distintas resoluciones.

## Probar en VS Code

Abre la carpeta `DraftSimulator` y ejecuta con Live Server, o usa Electron:

```bash
npm install
npm start
```

## Generar ejecutable

```bash
npm install
npm run build
```

El build está preparado para generar `DraftSimulator.exe`.

---

# Video de fondo

Coloca tu video aquí:

```text
video/background.mp4
```

La pantalla usa el video como capa real de fondo con:

- autoplay
- muted
- loop
- playsinline
- pantalla completa
- reintento al hacer clic, presionar tecla o volver a la ventana

Recomendación: usa MP4 con codec H.264. Algunos archivos pueden llamarse `.mp4`, pero usar un codec no compatible con Chromium/Electron.

---

# Sistema de sonido

La app acepta **MP3, OGG y MP4** para los sonidos.

Para cada sonido, el sistema intenta primero la ruta escrita en el código. Si no existe o falla, intenta la otra extensión automáticamente.

Ejemplo:

```text
Si el código busca: audio/select.mp3
También intentará: audio/select.ogg
Y luego: audio/select.mp4
```

Esto sirve para:

- música de fondo
- efectos globales
- voces de fase
- voces por turno
- voces por personaje

## 1. Música de fondo

Carpeta:

```text
audio/music/
```

Archivos admitidos:

```text
audio/music/track1.mp3
audio/music/track2.mp3
audio/music/track3.mp3
audio/music/track4.mp3
```

También puedes usar:

```text
audio/music/track1.mp4
audio/music/track2.mp4
audio/music/track3.mp4
audio/music/track4.mp4
```

Orden automático:

```text
track1 -> track2 -> track3 -> track4 -> track1
```

Funcionamiento:

- cuando termina una pista, pasa a la siguiente
- si `track1.mp3` falla, prueba `track1.mp4`
- si una pista no existe, intenta pasar a la siguiente
- el botón `♫ ON / OFF` pausa o activa la música

## 2. Efectos globales

Coloca los archivos en:

```text
audio/
```

Rutas principales:

```text
audio/select.mp3              sonido al preseleccionar personaje
audio/confirm.mp3             sonido al confirmar selección
audio/ban.mp3                 sonido al confirmar bloqueo
audio/timer_warning.mp3       aviso cuando quedan 5, 4, 3, 2 y 1 segundos
audio/voice_ban_phase.mp3     voz al iniciar fase de bloqueos
audio/voice_pick_phase.mp3    voz al iniciar fase de selección
```

Alternativas válidas en MP4:

```text
audio/select.mp4
audio/confirm.mp4
audio/ban.mp4
audio/timer_warning.mp4
audio/voice_ban_phase.mp4
audio/voice_pick_phase.mp4
```

## 3. Voces por turno

Carpeta:

```text
audio/turns/
```

Rutas principales:

```text
audio/turns/team_a_ban.mp3
audio/turns/team_b_ban.mp3
audio/turns/team_a_pick.mp3
audio/turns/team_b_pick.mp3
```

También puedes usar:

```text
audio/turns/team_a_ban.ogg
audio/turns/team_b_ban.ogg
audio/turns/team_a_pick.ogg
audio/turns/team_b_pick.ogg
```

O en MP4:

```text
audio/turns/team_a_ban.mp4
audio/turns/team_b_ban.mp4
audio/turns/team_a_pick.mp4
audio/turns/team_b_pick.mp4
```

Estas voces se reproducen al comenzar cada turno.

Si tú ya tienes las 4 líneas de voz tipo:

- `team A is banning`
- `team B is banning`
- `team A is picking`
- `team B is picking`

renómbralas exactamente así y colócalas en `audio/turns/`:

```text
team_a_ban.mp3   o team_a_ban.ogg
team_b_ban.mp3   o team_b_ban.ogg
team_a_pick.mp3  o team_a_pick.ogg
team_b_pick.mp3  o team_b_pick.ogg
```

Textos de respaldo si no existe el archivo:

```text
El equipo A está bloqueando un laminante.
El equipo B está bloqueando un laminante.
El equipo A está eligiendo un laminante.
El equipo B está eligiendo un laminante.
```

Si el audio no existe o falla, el sistema intenta usar voz automática del navegador como respaldo.

## 4. Voces por personaje

Cada personaje puede tener dos líneas: una para selección y otra para baneo.

Carpetas:

```text
audio/voices/pick/
audio/voices/ban/
```

Formato principal:

```text
audio/voices/pick/Nombre.mp3
audio/voices/ban/Nombre.mp3
```

Formato alternativo:

```text
audio/voices/pick/Nombre.ogg
audio/voices/ban/Nombre.ogg
```

O en MP4:

```text
audio/voices/pick/Nombre.mp4
audio/voices/ban/Nombre.mp4
```

Ejemplos:

```text
audio/voices/pick/Celestia.mp3
audio/voices/ban/Celestia.mp3

audio/voices/pick/Celestia.mp4
audio/voices/ban/Celestia.mp4
```

Para nombres con espacios usa guion bajo:

```text
Bai Mo -> Bai_Mo
```

Ejemplo:

```text
audio/voices/pick/Bai_Mo.mp3
audio/voices/ban/Bai_Mo.mp3
```

O:

```text
audio/voices/pick/Bai_Mo.mp4
audio/voices/ban/Bai_Mo.mp4
```

---

# Imágenes de personajes

Cada personaje usa dos tipos de imagen.

## 1. Thumb / cuadro pequeño

Carpeta:

```text
img/characters/thumbs/
```

Ejemplo:

```text
img/characters/thumbs/Celestia.png
img/characters/thumbs/Bai_Mo.png
```

Recomendación visual:

```text
256x144 px
PNG
```

## 2. Full / modelo grande

Carpeta:

```text
img/characters/full/
```

Ejemplo:

```text
img/characters/full/Celestia.png
img/characters/full/Bai_Mo.png
```

Recomendación:

```text
PNG transparente
personaje recortado sin fondo
altura visual consistente entre personajes
```

Esta versión ya incluye una normalización para que los modelos se vean con altura consistente dentro del draft. En el resumen final, los personajes usan boxes invisibles para que entren los 5 por equipo y se vea más torso/rostro.

---

# PNG de jugadores en configuración

Opcionalmente puedes colocar retratos de jugadores:

```text
img/players/A1.png
img/players/A2.png
img/players/A3.png
img/players/A4.png
img/players/A5.png
img/players/B1.png
img/players/B2.png
img/players/B3.png
img/players/B4.png
img/players/B5.png
```

---

# Flujo del draft

## Bloqueos

1. TEAM A bloquea P.U.S
2. TEAM B bloquea The Scissors
3. TEAM A bloquea Urbino
4. TEAM B bloquea Urbino

## Selección

```text
A = 1 personaje
B = 2 personajes
A = 2 personajes
B = 2 personajes
A = 2 personajes
B = 1 personaje
```

Cuando una ronda exige 2 personajes, el centro muestra el primer personaje confirmado y el segundo personaje preseleccionado.

---

# Personajes y roles

## The Scissors

```text
Ming       - Duelista
Lawine     - Vanguardia
Meredith   - Controlador
Reiichi    - Controlador
Kanami     - Vanguardia
Eika       - Duelista
Fragrans   - Soporte
Mara       - Duelista
```

## P.U.S

```text
Michele    - Centinela
Nobunaga   - Centinela
Kokona     - Soporte
Yvette     - Controlador
Flavia     - Duelista
Yugiri     - Controlador
Leona      - Centinela
Chiyo      - Duelista
```

## Urbino

```text
Celestia   - Soporte
Audrey     - Centinela
Maddelena  - Controlador
Fuchsia    - Duelista
Bai Mo     - Duelista
Galatea    - Vanguardia
Cielle     - Duelista
```

---

# Ajuste automático de resolución

La interfaz no funciona como una web común. Usa un lienzo interno fijo:

```text
1920x1080
```

Luego JavaScript calcula la escala según la pantalla real:

```text
escala = menor valor entre anchoPantalla/1920 y altoPantalla/1080
```

Esto evita que:

- el dock inferior se corte
- los laterales cambien de posición
- la preselección empuje la galería
- el resumen se desordene
- la interfaz se vea diferente en otras resoluciones

En pantallas que no sean 16:9 pueden aparecer bordes negros, pero la interfaz mantiene sus proporciones.


## Ajuste manual de PNG FULL

Ahora el proyecto incluye este archivo:

```text
js/character_layout_config.js
```

Ahí puedes corregir manualmente cómo se ve cada PNG grande en:

- la pantalla de draft
- el resumen final

Puedes editar por personaje:

```text
stageSingle   escala cuando aparece solo en draft
stageDouble   escala cuando aparece acompañado en draft
summary       escala en resumen final

stageOffset.x
stageOffset.y
summaryOffset.x
summaryOffset.y

stageBox = standard o wide
```

Ejemplo:

```javascript
"Audrey": {
  stageBox: "wide",
  stageSingle: 0.91,
  stageDouble: 0.89,
  summary: 1.01,
  stageOffset: { x: -10, y: -58 },
  summaryOffset: { x: -24, y: -8 }
}
```

Guía rápida:

- `x` positivo = mueve a la derecha
- `x` negativo = mueve a la izquierda
- `y` negativo = sube
- `y` positivo = baja
- `summary` más grande = más zoom en el resumen
- `stageSingle` más grande = más zoom cuando el personaje sale solo en draft
- `stageDouble` más grande = más zoom cuando salen 2 a la vez

También puedes tocar las escalas globales:

```javascript
global: {
  stageScaleMultiplier: 0.84,
  summaryScaleMultiplier: 0.95
}
```


## Development editor manual

Se agregó una nueva categoría superior en la pantalla inicial:

```text
DEVELOPMENT
```

Desde ahí puedes ajustar visualmente los PNG full sin entrar al draft principal.

Funciones disponibles:

- elegir personaje
- editar escala de draft solo
- editar escala de draft doble
- editar escala de resumen
- mover posición X/Y para draft
- mover posición X/Y para resumen
- elegir box `standard` o `wide` para draft y resumen
- editar multiplicadores globales
- resetear un personaje
- guardar cambios directamente en `js/character_layout_config.js`

### Guardado directo

En Electron, el botón **GUARDAR CAMBIOS** escribe directamente en:

```text
js/character_layout_config.js
```

Si lo abres solo como HTML en navegador, en lugar de escritura directa se descargará una copia del archivo para que la reemplaces manualmente.


## Cancelar draft actual

Dentro de la pantalla de draft existe un botón:

```text
CANCELAR
```

Este botón cancela el draft actual, limpia selecciones/bloqueos temporales y vuelve al menú sin tener que recargar la página.


## Development deshabilitado

La pestaña DEVELOPMENT queda deshabilitada visualmente. Para ajustar los PNG full, edita manualmente:

```text
js/character_layout_config.js
```

Ese archivo ahora explica claramente qué valores afectan al draft y cuáles afectan al resumen final.


### Voces de turno sin voz default

Las líneas de turno deben ir en:

```text
audio/turns/
```

Nombres esperados:

```text
team_a_ban.ogg   o team_a_ban.mp3
team_b_ban.ogg   o team_b_ban.mp3
team_a_pick.ogg  o team_a_pick.mp3
team_b_pick.ogg  o team_b_pick.mp3
```

El código busca primero `.ogg`, luego `.mp3` y luego `.mp4` cuando la ruta no tiene extensión.

Para estas cuatro voces de turno ya no se usa la voz default del navegador. Si falta un archivo, simplemente no sonará esa línea, en vez de decir el texto automático.


## Ajuste de caja fullbody del draft

La caja central donde aparecen los PNG full del draft se controla desde:

```text
js/app.js
```

Busca este bloque:

```javascript
const DRAFT_FULLBODY_BOX_CONFIG = {
  stageWidth: 1080,
  stageHeight: 585,
  singleBoxWidth: 600,
  doubleBoxWidth: 420,
  doubleGap: 110,
  statusBottom: 104,
};
```

Qué hace cada valor:

- `stageWidth`: ancho total del área de PNG full.
- `stageHeight`: altura total del área de PNG full.
- `singleBoxWidth`: ancho cuando aparece 1 personaje.
- `doubleBoxWidth`: ancho de cada caja cuando aparecen 2 personajes.
- `doubleGap`: separación entre los 2 personajes.
- `statusBottom`: baja o sube el panel de fase. Menor = más abajo, mayor = más arriba.

Los PNG full quedan por detrás del HUD, laterales, paneles y selector inferior.


## V3.27: movimiento, roulette arcade y selección de mapa

### Movimiento leve de PNG full en draft
Los personajes grandes dentro del draft tienen una animación suave de flotación.  
Está en `css/styles.css`, sección:

```text
AJUSTES V3.27 - movimiento, roulette, mapa y resumen animado
```

Si quieres quitarlo, elimina o comenta:

```css
.fullbody-card.idle-fullbody .fullbody-frame {
  animation: draftFullbodyFloat 5.6s ease-in-out infinite;
}
```

### Sonido del roulette arcade
Cuando el tiempo llega a 0, las casillas del menú de personajes empiezan a pasar aleatoriamente hasta elegir un personaje.

Coloca el sonido en:

```text
audio/roulette.ogg
```

También acepta:

```text
audio/roulette.mp3
audio/roulette.mp4
```

Para el roulette de mapas puedes usar otro sonido:

```text
audio/map_roulette.ogg
audio/map_roulette.mp3
audio/map_roulette.mp4
```

Si no colocas `map_roulette`, puedes copiar el mismo audio y renombrarlo como `map_roulette`.

### Selección de mapa
Después del draft aparece una pantalla de selección de mapa antes del resumen.

Los mapas se configuran aquí:

```text
js/map_config.js
```

Ejemplo:

```javascript
window.MAP_CONFIG = {
  maps: [
    { name: "Área 88", image: "img/maps/area_88.png" },
    { name: "Distrito Sakura", image: "img/maps/distrito_sakura.png" }
  ]
};
```

Las imágenes de mapas deben colocarse en:

```text
img/maps/
```

Recomendado:

```text
640x360
1280x720
formato 16:9
PNG, JPG o WebP
```

Cuando el mapa se elige, el resumen final lo muestra en un recuadro pequeño con imagen y nombre.

### Intro del resumen
Antes de mostrar el resumen final, aparece una intro con el overlay de `RESUMEN FINAL`.  
Luego el resumen entra con una animación suave en lugar de aparecer bruscamente.
