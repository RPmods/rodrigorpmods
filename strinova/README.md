DraftSimulator_v3_69_replacement_files

Reemplazar:
- js/app.js

Cambios V3.69:
- Música separada por pantalla:
  - Menú / configuración: audio/music/menu.ogg, audio/music/menu.mp3 o audio/music/menu.mp4
  - Draft / selección de mapa / resumen: audio/music/track1.ogg, audio/music/track1.mp3 o audio/music/track1.mp4
- Se reforzó el bucle de música:
  - El audio queda en loop.
  - Si termina, reinicia el mismo track.
  - Si el navegador pausa o suspende el audio, intenta reanudarlo.
  - Si falla una extensión, prueba ogg/mp3/mp4 automáticamente.
- Nuevo efecto de sonido al presionar Iniciar Draft:
  - audio/ui/start_draft.ogg, audio/ui/start_draft.mp3 o audio/ui/start_draft.mp4
- Nuevo efecto de sonido al volver/cancelar hacia configuración:
  - audio/ui/back_config.ogg, audio/ui/back_config.mp3 o audio/ui/back_config.mp4

Rutas recomendadas:
audio/
  music/
    menu.ogg
    track1.ogg
  ui/
    start_draft.ogg
    back_config.ogg

Notas:
- Puedes usar .ogg, .mp3 o .mp4. El sistema intentará esas extensiones automáticamente.
- track1 sigue siendo la música del draft.
- menu es la música exclusiva del menú/configuración.
