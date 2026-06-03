# Draft Simulator Strinova

Prototipo de draft competitivo con interfaz estilo selección de personajes de videojuego, hecho y diseñado por rodrigorpmods (soporte y ajustes con chat gpt)

## Ajustes v3.41

- Se corrigió el panel lateral de **TEAM B / Defensores** dentro del draft para que quede pegado al lateral derecho y no desborde nombres largos.
- Los nombres largos del TEAM B ahora usan recorte con `...` para evitar que se desacomoden.
- Se reforzó la animación de selección en:
  - PNG full central
  - cuadro del jugador seleccionado
- Se reforzó la animación de baneo en:
  - PNG full central
  - cuadro de bloqueo



## V3.42

- La ruleta aleatoria de personajes ahora también muestra el personaje en el PNG full central mientras va cambiando la casilla.
- Durante la ruleta, el casillero activo del equipo/bloqueo también previsualiza el personaje que va pasando.
- Valores por defecto actualizados:
  - Duración de animaciones: 1.60x
  - Volumen de música: 35
  - Volumen de efectos: 60
  - Volumen de líneas de narración: 85
- Nueva categoría superior: `UPDATES/HISTORIAL`.


## Idioma / traducción de texto

Se agregó la categoría superior **IDIOMA**.

Idiomas de texto incluidos:

```text
Español
English
日本語
Русский
中文
```

Esto cambia únicamente los textos visibles de la interfaz.

### Audio de narración y audio de personajes

Dentro de **IDIOMA**, las opciones:

```text
Audio de narración
Audio de personajes
```

quedan bloqueadas en:

```text
Default
```

Por ahora no están disponibles para cambiarse por idioma. Las configuraciones de audio se mantienen por defecto y los archivos de audio actuales siguen usando las mismas rutas existentes.
