/*
  AJUSTE MANUAL DE PNG FULL
  ------------------------------------------------------------
  Este archivo es para editar a mano cómo se ven los PNG grandes.

  ZONAS IMPORTANTES:
  1) DRAFT / STAGE:
     Es la pantalla principal donde se bloquea y selecciona.
     Aquí se usan:
       stageSingle
       stageDouble
       stageOffset
       stageBox

  2) RESUMEN FINAL / SUMMARY:
     Es la pantalla final después del draft o del Random Selector.
     Aquí se usan:
       summary
       summaryOffset
       summaryBox

  DIRECCIONES:
  - stageOffset.x positivo     = mueve el PNG a la DERECHA dentro del draft.
  - stageOffset.x negativo     = mueve el PNG a la IZQUIERDA dentro del draft.
  - stageOffset.y negativo     = SUBE el PNG dentro del draft.
  - stageOffset.y positivo     = BAJA el PNG dentro del draft.

  - summaryOffset.x positivo   = mueve el PNG a la DERECHA en el resumen.
  - summaryOffset.x negativo   = mueve el PNG a la IZQUIERDA en el resumen.
  - summaryOffset.y negativo   = SUBE el PNG en el resumen.
  - summaryOffset.y positivo   = BAJA el PNG en el resumen.

  ESCALA / ZOOM:
  - stageSingle  = tamaño cuando aparece 1 solo personaje en el draft.
  - stageDouble  = tamaño cuando aparecen 2 personajes en el draft.
  - summary      = tamaño del personaje en el resumen final.

  CAJA:
  - stageBox / summaryBox = "standard" o "wide".
  - Usa "wide" si el personaje tiene armas, cabello o ropa muy ancha.

  MULTIPLICADORES GLOBALES:
  - stageScaleMultiplier   afecta a TODOS los personajes en el draft.
  - summaryScaleMultiplier afecta a TODOS los personajes en el resumen.
*/

window.CHARACTER_LAYOUT_CONFIG = {
  global: {
    stageScaleMultiplier: 0.80,
    summaryScaleMultiplier: 0.90,
  },
  characters: {
    "Audrey":    { stageSingle: 1.02, stageDouble: 0.98, summary: 1.05, stageOffset: { x: 0, y: -60 }, summaryOffset: { x: -4, y: -6 } },
    "Bai Mo":    { stageSingle: 1.02, stageDouble: 0.98, summary: 1.05, stageOffset: { x: 0, y: -60 }, summaryOffset: { x: -4, y: -6 } },
    "Celestia":  { stageSingle: 1.02, stageDouble: 0.98, summary: 1.05, stageOffset: { x: 0, y: -60 }, summaryOffset: { x: -4, y: -6 } },
    "Chiyo":     { stageSingle: 1.02, stageDouble: 0.98, summary: 1.05, stageOffset: { x: 0, y: -60 }, summaryOffset: { x: -4, y: -6 } },
    "Cielle":    { stageSingle: 1.02, stageDouble: 0.98, summary: 1.05, stageOffset: { x: 0, y: -60 }, summaryOffset: { x: -4, y: -6 } },
    "Eika":      { stageSingle: 1.02, stageDouble: 0.98, summary: 1.05, stageOffset: { x: 0, y: -60 }, summaryOffset: { x: -4, y: -6 } },
    "Flavia":    { stageSingle: 1.02, stageDouble: 0.98, summary: 1.05, stageOffset: { x: 0, y: -60 }, summaryOffset: { x: -4, y: -6 } },
    "Fragrans":  { stageSingle: 1.02, stageDouble: 0.98, summary: 1.05, stageOffset: { x: 0, y: -60 }, summaryOffset: { x: -4, y: -6 } },
    "Fuchsia":   { stageSingle: 1.02, stageDouble: 0.98, summary: 1.05, stageOffset: { x: 0, y: -60 }, summaryOffset: { x: -4, y: -6 } },
    "Galatea":   { stageSingle: 1.02, stageDouble: 0.98, summary: 1.05, stageOffset: { x: 0, y: -60 }, summaryOffset: { x: -4, y: -6 } },
    "Kanami":    { stageSingle: 1.02, stageDouble: 0.98, summary: 1.05, stageOffset: { x: 0, y: -60 }, summaryOffset: { x: -4, y: -6 } },
    "Kokona":    { stageSingle: 1.02, stageDouble: 0.98, summary: 1.05, stageOffset: { x: 0, y: -60 }, summaryOffset: { x: -4, y: -6 } },
    "Lawine":    { stageSingle: 1.02, stageDouble: 0.98, summary: 1.05, stageOffset: { x: 0, y: -60 }, summaryOffset: { x: -4, y: -6 } },
    "Leona":     { stageSingle: 1.02, stageDouble: 0.98, summary: 1.05, stageOffset: { x: 0, y: -60 }, summaryOffset: { x: -4, y: -6 } },
    "Maddelena": { stageSingle: 1.02, stageDouble: 0.98, summary: 1.05, stageOffset: { x: 0, y: -60 }, summaryOffset: { x: -4, y: -6 } },
    "Mara":      { stageSingle: 1.02, stageDouble: 0.98, summary: 1.05, stageOffset: { x: 0, y: -60 }, summaryOffset: { x: -4, y: -6 } },
    "Meredith":  { stageSingle: 1.02, stageDouble: 0.98, summary: 1.05, stageOffset: { x: 0, y: -60 }, summaryOffset: { x: -4, y: -6 } },
    "Michele":   { stageSingle: 1.02, stageDouble: 0.98, summary: 1.05, stageOffset: { x: 0, y: -60 }, summaryOffset: { x: -4, y: -6 } },
    "Ming":      { stageSingle: 1.02, stageDouble: 0.98, summary: 1.05, stageOffset: { x: 0, y: -60 }, summaryOffset: { x: -4, y: -6 } },
    "Nobunaga":  { stageSingle: 1.02, stageDouble: 0.98, summary: 1.05, stageOffset: { x: 0, y: -60 }, summaryOffset: { x: -4, y: -6 } },
    "Reiichi":   { stageSingle: 1.02, stageDouble: 0.98, summary: 1.05, stageOffset: { x: 0, y: -60 }, summaryOffset: { x: -4, y: -6 } },
    "Yugiri":    { stageSingle: 1.02, stageDouble: 0.98, summary: 1.05, stageOffset: { x: 0, y: -60 }, summaryOffset: { x: -4, y: -6 } },
    "Yvette":    { stageSingle: 1.02, stageDouble: 0.98, summary: 1.05, stageOffset: { x: 0, y: -60 }, summaryOffset: { x: -4, y: -6 } },
  }
};
