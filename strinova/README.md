DraftSimulator_v3_97_replacement_files

Reemplazar:
- js/app.js

Cambios V3.97:
- Fix para GitHub Pages cuando logo.mp4 se salta y pasa directo a Intro_menu.mp4.
- GitHub Pages diferencia mayúsculas/minúsculas en rutas.
- Ahora el sistema intenta estas rutas:
  1. video/introV/logo.mp4
  2. video/introV/Logo.mp4
  3. video/introV/LOGO.mp4
- Antes de reproducir el logo, el sistema hace una comprobación HEAD y usa la primera ruta existente.
- Si en local funcionaba y en GitHub Pages no, lo más probable era diferencia de nombre/ruta.

Recomendación:
- Lo ideal es dejar el archivo exactamente como:
  video/introV/logo.mp4
  todo en minúsculas.
