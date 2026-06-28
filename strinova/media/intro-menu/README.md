# Recursos de introducción del menú

Coloca cada video y su música dentro de la misma carpeta.

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

Los nombres `video.mp4` y `music.mp3` deben respetarse exactamente.

Durante la migración, la aplicación todavía puede usar las rutas antiguas como respaldo:

- `video/introV/Intro_menu.mp4` hasta `Intro_menu_5.mp4`
- `audio/music_intro.mp3` hasta `music_intro_5.mp3`

La nueva ruta siempre tiene prioridad.


## Nombres mostrados en Configuración

- `intro-01`: Strinova Season 9 (26sp3)
- `intro-02`: Strinova Season 6 (Michelle Skin)
- `intro-03`: Strinova Season 7 (p2)
- `intro-04`: Strinova Season 7
- `intro-05`: Kanami [Be Shining] - Strinova
