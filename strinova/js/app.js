const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;
const AUDIO_EXTENSIONS = ["ogg", "mp3", "mp4"];

const factions = {
  scissors: { label: "The Scissors", key: "the-scissors", color: "red" },
  pus: { label: "P.U.S", key: "pus", color: "blue" },
  urbino: { label: "Cizallas", key: "urbino", color: "yellow" },
};

const characters = [
  ...["Ming", "Lawine", "Meredith", "Reiichi", "Kanami", "Eika", "Fragrans", "Mara"].map(name => ({ name, faction: "scissors" })),
  ...["Michele", "Nobunaga", "Kokona", "Yvette", "Flavia", "Yugiri", "Leona", "Chiyo"].map(name => ({ name, faction: "pus" })),
  ...["Celestia", "Audrey", "Maddelena", "Fuchsia", "Bai Mo", "Galatea", "Cielle"].map(name => ({ name, faction: "urbino" })),
];

const banTurns = [
  { type: "ban", team: "A", faction: "pus", text: "TEAM A bloquea un personaje de P.U.S" },
  { type: "ban", team: "B", faction: "scissors", text: "TEAM B bloquea un personaje de The Scissors" },
  { type: "ban", team: "A", faction: "urbino", text: "TEAM A bloquea un personaje de Cizallas" },
  { type: "ban", team: "B", faction: "urbino", text: "TEAM B bloquea un personaje de Cizallas" },
];

const pickGroups = [
  { team: "A", count: 1 },
  { team: "B", count: 2 },
  { team: "A", count: 2 },
  { team: "B", count: 2 },
  { team: "A", count: 2 },
  { team: "B", count: 1 },
];

const pickTurns = pickGroups.flatMap((group, groupId) => {
  return Array.from({ length: group.count }, (_, slot) => ({
    type: "pick",
    team: group.team,
    groupId,
    groupCount: group.count,
    groupSlot: slot,
  }));
});

const turns = [...banTurns, ...pickTurns];

const maps = (window.MAP_CONFIG?.maps?.length ? window.MAP_CONFIG.maps : [
  { name: "Mapa 1", image: "img/maps/map_1.png" },
  { name: "Mapa 2", image: "img/maps/map_2.png" },
  { name: "Mapa 3", image: "img/maps/map_3.png" },
  { name: "Mapa 4", image: "img/maps/map_4.png" },
]).map((map, index) => ({
  id: map.id || `map-${index + 1}`,
  name: map.name || `Mapa ${index + 1}`,
  image: map.image || `img/maps/map_${index + 1}.png`,
}));

const roles = {
  Audrey: "Centinela",
  Michele: "Centinela",
  Flavia: "Duelista",
  Cielle: "Duelista",
  Chiyo: "Duelista",
  Mara: "Duelista",
  Leona: "Centinela",
  Yugiri: "Controlador",
  Galatea: "Vanguardia",
  Fragrans: "Soporte",
  Ming: "Duelista",
  Maddelena: "Controlador",
  Yvette: "Controlador",
  Meredith: "Controlador",
  Celestia: "Soporte",
  Kokona: "Soporte",
  Lawine: "Vanguardia",
  Nobunaga: "Centinela",
  Reiichi: "Controlador",
  Fuchsia: "Duelista",
  Kanami: "Vanguardia",
  "Bai Mo": "Duelista",
  Eika: "Duelista",
};

const wideStageCharacters = new Set(["Audrey", "Celestia", "Chiyo", "Kanami", "Kokona", "Lawine", "Mara", "Meredith"]);
const wideSummaryCharacters = new Set(["Audrey", "Celestia", "Chiyo", "Kanami", "Kokona", "Lawine", "Mara", "Meredith", "Michele"]);

const externalLayoutConfig = window.CHARACTER_LAYOUT_CONFIG || {};

function characterLayoutConfig(name) {
  return externalLayoutConfig.characters?.[name] || {};
}

function numericLayoutValue(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function globalLayoutValue(key, fallback) {
  return numericLayoutValue(externalLayoutConfig.global?.[key], fallback);
}

function stageBoxClass(name) {
  const override = String(characterLayoutConfig(name).stageBox || "").toLowerCase();
  if (override === "wide") return "fullbody-box fullbody-box--wide";
  if (override === "standard") return "fullbody-box fullbody-box--standard";
  return wideStageCharacters.has(name) ? "fullbody-box fullbody-box--wide" : "fullbody-box fullbody-box--standard";
}

function summaryBoxClass(name) {
  const override = String(characterLayoutConfig(name).summaryBox || "").toLowerCase();
  if (override === "wide") return "summary-fullbody-box summary-fullbody-box--wide";
  if (override === "standard") return "summary-fullbody-box summary-fullbody-box--standard";
  return wideSummaryCharacters.has(name) ? "summary-fullbody-box summary-fullbody-box--wide" : "summary-fullbody-box summary-fullbody-box--standard";
}

const characterDisplayTweaks = {
  Audrey: { stageSingle: 0.91, stageDouble: 0.89, summary: 1.01 },
  "Bai Mo": { stageSingle: 1.01, stageDouble: 0.97, summary: 1.04 },
  Celestia: { stageSingle: 0.92, stageDouble: 0.90, summary: 1.02 },
  Chiyo: { stageSingle: 0.93, stageDouble: 0.91, summary: 1.03 },
  Cielle: { stageSingle: 0.95, stageDouble: 0.93, summary: 1.03 },
  Eika: { stageSingle: 1.02, stageDouble: 0.98, summary: 1.05 },
  Flavia: { stageSingle: 1.02, stageDouble: 0.98, summary: 1.06 },
  Fragrans: { stageSingle: 1.04, stageDouble: 1.00, summary: 1.09 },
  Fuchsia: { stageSingle: 0.95, stageDouble: 0.93, summary: 1.03 },
  Galatea: { stageSingle: 1.03, stageDouble: 0.99, summary: 1.07 },
  Kanami: { stageSingle: 0.94, stageDouble: 0.92, summary: 1.03 },
  Kokona: { stageSingle: 0.92, stageDouble: 0.90, summary: 1.02 },
  Lawine: { stageSingle: 0.93, stageDouble: 0.91, summary: 1.03 },
  Leona: { stageSingle: 1.02, stageDouble: 0.98, summary: 1.06 },
  Maddelena: { stageSingle: 1.04, stageDouble: 1.00, summary: 1.08 },
  Mara: { stageSingle: 0.89, stageDouble: 0.87, summary: 1.00 },
  Meredith: { stageSingle: 0.91, stageDouble: 0.89, summary: 1.01 },
  Michele: { stageSingle: 0.94, stageDouble: 0.92, summary: 1.03 },
  Ming: { stageSingle: 1.02, stageDouble: 0.98, summary: 1.06 },
  Nobunaga: { stageSingle: 1.00, stageDouble: 0.97, summary: 1.04 },
  Reiichi: { stageSingle: 1.02, stageDouble: 0.98, summary: 1.06 },
  Yugiri: { stageSingle: 1.02, stageDouble: 0.98, summary: 1.06 },
  Yvette: { stageSingle: 1.00, stageDouble: 0.97, summary: 1.04 },
};

const STAGE_SCALE_MULTIPLIER = 0.84;
const SUMMARY_SCALE_MULTIPLIER = 0.95;

const stageImageOffsets = {
  Audrey: { x: -10, y: -58 },
  "Bai Mo": { x: 8, y: -56 },
  Celestia: { x: -4, y: -62 },
  Chiyo: { x: 8, y: -56 },
  Cielle: { x: -2, y: -56 },
  Eika: { x: 0, y: -60 },
  Flavia: { x: 0, y: -60 },
  Fragrans: { x: 0, y: -64 },
  Fuchsia: { x: 0, y: -58 },
  Galatea: { x: 2, y: -56 },
  Kanami: { x: 10, y: -58 },
  Kokona: { x: 10, y: -58 },
  Lawine: { x: -8, y: -60 },
  Leona: { x: 0, y: -58 },
  Maddelena: { x: 8, y: -56 },
  Mara: { x: -6, y: -52 },
  Meredith: { x: -8, y: -58 },
  Michele: { x: -10, y: -58 },
  Ming: { x: 0, y: -60 },
  Nobunaga: { x: 0, y: -58 },
  Reiichi: { x: 0, y: -58 },
  Yugiri: { x: -6, y: -58 },
  Yvette: { x: 0, y: -58 },
};

const summaryImageOffsets = {
  Audrey: { x: -24, y: -8 },
  "Bai Mo": { x: 8, y: -4 },
  Celestia: { x: -2, y: -6 },
  Chiyo: { x: 10, y: -4 },
  Cielle: { x: -4, y: -4 },
  Eika: { x: 0, y: -6 },
  Flavia: { x: 0, y: -6 },
  Fragrans: { x: 0, y: -8 },
  Fuchsia: { x: 0, y: -4 },
  Galatea: { x: 2, y: -4 },
  Kanami: { x: 10, y: -6 },
  Kokona: { x: 10, y: -4 },
  Lawine: { x: -8, y: -6 },
  Leona: { x: 0, y: -4 },
  Maddelena: { x: 8, y: -4 },
  Mara: { x: -6, y: -4 },
  Meredith: { x: -8, y: -6 },
  Michele: { x: -10, y: -4 },
  Ming: { x: 0, y: -6 },
  Nobunaga: { x: 0, y: -4 },
  Reiichi: { x: 0, y: -4 },
  Yugiri: { x: -6, y: -4 },
  Yvette: { x: 0, y: -4 },
};

/*
  Ajuste visual de PNG FULL
  ------------------------------------------------------------
  mode = "stage"   => pantalla principal del draft.
  mode = "summary" => resumen final.

  Para editar a mano, usa js/character_layout_config.js.
  En ese archivo:
  - stageOffset.x positivo mueve a la derecha en el draft.
  - stageOffset.x negativo mueve a la izquierda en el draft.
  - stageOffset.y negativo sube el PNG en el draft.
  - stageOffset.y positivo baja el PNG en el draft.
  - summaryOffset hace lo mismo, pero SOLO en el resumen final.
*/
function createFullbodyImage(name, mode = "stage", groupSize = 1) {
  const img = makeImage([fullPath(name), thumbPath(name), legacyPath(name)], "fullbody-img", name);
  const defaultTweak = characterDisplayTweaks[name] || {};
  const customTweak = characterLayoutConfig(name);
  const tweak = { ...defaultTweak, ...customTweak };

  if (mode === "summary") {
    const summaryScale = numericLayoutValue(tweak.summary, 1.04) * globalLayoutValue("summaryScaleMultiplier", SUMMARY_SCALE_MULTIPLIER);
    const defaultOffset = summaryImageOffsets[name] || { x: 0, y: -4 };
    const customOffset = customTweak.summaryOffset || {};
    const offset = {
      x: numericLayoutValue(customOffset.x, defaultOffset.x),
      y: numericLayoutValue(customOffset.y, defaultOffset.y),
    };
    img.style.transform = `translate(${offset.x}px, ${offset.y}px) scale(${summaryScale})`;
    img.style.transformOrigin = "center top";
    return img;
  }

  const fallbackScale = groupSize > 1 ? 0.91 : 0.94;
  const baseScale = groupSize > 1
    ? numericLayoutValue(tweak.stageDouble, fallbackScale)
    : numericLayoutValue(tweak.stageSingle, fallbackScale);
  const scale = baseScale * globalLayoutValue("stageScaleMultiplier", STAGE_SCALE_MULTIPLIER);
  const defaultOffset = stageImageOffsets[name] || { x: 0, y: -56 };
  const customOffset = customTweak.stageOffset || {};
  const offset = {
    x: numericLayoutValue(customOffset.x, defaultOffset.x),
    y: numericLayoutValue(customOffset.y, defaultOffset.y),
  };
  img.style.transform = `translate(${offset.x}px, ${offset.y}px) scale(${scale})`;
  img.style.transformOrigin = "center top";
  return img;
}

const menuMusicPlaylist = [
  "audio/music/menu",
];

const draftMusicPlaylist = [
  "audio/music/track1",
];

const musicPlaylists = {
  menu: menuMusicPlaylist,
  draft: draftMusicPlaylist,
};

const sounds = {
  select: "audio/select.mp3",
  confirm: "audio/confirm.mp3",
  ban: "audio/ban.mp3",
  warning: "audio/timer_warning.mp3",
  roulette: "audio/roulette",
  mapRoulette: "audio/map_roulette",
  startDraft: "audio/ui/start_draft",
  backConfig: "audio/ui/back_config",
  banPhase: "audio/voice_ban_phase",
  pickPhase: "audio/voice_pick_phase",
  randomStart: "audio/random_start",
};

const systemDraftVoiceLines = {
  voice_ban_phase: {
    src: sounds.banPhase,
    text: "¡La fase de bloqueos de laminantes ha comenzado!",
  },
  voice_pick_phase: {
    src: sounds.pickPhase,
    text: "¡La fase de selección de laminantes ha comenzado!",
  },
  team_a_ban: {
    src: "audio/turns/team_a_ban",
    text: "Los atacantes están bloqueando un laminante.",
  },
  team_b_ban: {
    src: "audio/turns/team_b_ban",
    text: "Los defensores están bloqueando un laminante.",
  },
  team_a_ban_scissors: {
    src: "audio/turns/team_a_ban_scissors",
    text: "Los atacantes están bloqueando un laminante de las Cizallas.",
  },
  team_b_ban_scissors: {
    src: "audio/turns/team_b_ban_scissors",
    text: "Los defensores están bloqueando un laminante de las Cizallas.",
  },
  team_a_pick: {
    src: "audio/turns/team_a_pick",
    text: "Los atacantes están eligiendo un laminante.",
  },
  team_b_pick: {
    src: "audio/turns/team_b_pick",
    text: "Los defensores están eligiendo un laminante.",
  },
  random_start: {
    src: sounds.randomStart,
    text: "Tiempo agotado. Iniciando selección aleatoria.",
  },
};

const turnVoices = {
  A: {
    ban: systemDraftVoiceLines.team_a_ban.src,
    ban_scissors: systemDraftVoiceLines.team_a_ban_scissors.src,
    pick: systemDraftVoiceLines.team_a_pick.src,
  },
  B: {
    ban: systemDraftVoiceLines.team_b_ban.src,
    ban_scissors: systemDraftVoiceLines.team_b_ban_scissors.src,
    pick: systemDraftVoiceLines.team_b_pick.src,
  },
};

const state = {
  players: {
    A: ["Jugador A1", "Jugador A2", "Jugador A3", "Jugador A4", "Jugador A5"],
    B: ["Jugador B1", "Jugador B2", "Jugador B3", "Jugador B4", "Jugador B5"],
  },
  picks: { A: [], B: [] },
  bans: { A: [], B: [] },
  pickBatchSelections: {},
  turnIndex: 0,
  selected: null,
  preselectLocked: false,
  turnDuration: 20,
  timer: 20,
  timerId: null,
  lastWarningSecond: null,
  musicIndex: 0,
  musicMode: "menu",
  musicEnabled: true,
  musicAudio: null,
  activeSounds: [],
  musicErrorCount: 0,
  musicCandidateSources: [],
  musicCandidateIndex: 0,
  musicResumeHandlerBound: false,
  musicCurrentTrack: "",
  locked: false,
  flashBan: null,
  flashPick: null,
  banAnimation: null,
  pickAnimation: null,
  roulette: {
    active: false,
    highlightedName: null,
    finalName: null,
    previewCharacter: null,
  },
  selectedMap: null,
  mapRoulette: {
    active: false,
    highlightedId: null,
    finalId: null,
  },
  settings: {
    masterVolume: 1,
    musicVolume: 0.35,
    sfxVolume: 0.6,
    narrationVolume: 0.85,
    characterVoiceVolume: 1,
    language: "es",
    narrationEnabled: true,
    selectionAnimationEnabled: true,
    autoResolveEnabled: true,
    animationDuration: 1.6,
  },
  devSelectedCharacter: "Ming",
};

const $ = (selector) => document.querySelector(selector);
const setupA = $("#setup-team-a");
const setupB = $("#setup-team-b");
const setupScreen = $("#setup-screen");
const draftScreen = $("#draft-screen");
const summaryScreen = $("#summary-screen");
const mapScreen = $("#map-screen");
const characterGrid = $("#character-grid");
const mapGrid = $("#map-grid");
const randomizeMapButton = $("#randomize-map");
const selectedMapName = $("#selected-map-name");
const summaryMapCard = $("#summary-map-card");
const summaryMapName = $("#summary-map-name");
const timerCore = $(".timer-core");
const setupShell = document.querySelector(".setup-shell");
const simulateSummaryButton = $("#simulate-summary");
const randomPlayerNamesButton = $("#random-player-names");
const manualPlayerNamesButton = $("#manual-player-names");
const cancelDraftButton = $("#cancel-draft");
const turnTimeRange = $("#turn-time-range");
const turnTimeInput = $("#turn-time-input");
const turnTimeMinus = $("#turn-time-minus");
const turnTimePlus = $("#turn-time-plus");
const setupTurnTimeCopy = $("#setup-turn-time-copy");
const animationDurationRange = $("#animation-duration-range");
const animationDurationValue = $("#animation-duration-value");
const narrationToggle = $("#narration-toggle");
const selectionAnimationToggle = $("#selection-animation-toggle");
const autoResolveToggle = $("#auto-resolve-toggle");
const masterVolumeRange = $("#master-volume-range");
const musicVolumeRange = $("#music-volume-range");
const sfxVolumeRange = $("#sfx-volume-range");
const narrationVolumeRange = $("#narration-volume-range");
const characterVoiceVolumeRange = $("#character-voice-volume-range");
const masterVolumeValue = $("#master-volume-value");
const musicVolumeValue = $("#music-volume-value");
const sfxVolumeValue = $("#sfx-volume-value");
const narrationVolumeValue = $("#narration-volume-value");
const characterVoiceVolumeValue = $("#character-voice-volume-value");
const languageSelect = $("#language-select");


const i18nConfig = window.I18N_CONFIG || { defaultLanguage: "es", text: { es: {} } };
function currentLanguage() { return state?.settings?.language || i18nConfig.defaultLanguage || "es"; }
function t(key, vars = {}) {
  const lang = currentLanguage();
  const bundle = i18nConfig.text?.[lang] || i18nConfig.text?.es || {};
  const fallback = i18nConfig.text?.es || {};
  let value = bundle[key] ?? fallback[key] ?? key;
  Object.entries(vars).forEach(([name, replacement]) => { value = String(value).replaceAll(`{${name}}`, replacement); });
  return value;
}
function setText(selector, key, vars = {}) { const el = document.querySelector(selector); if (el) el.textContent = t(key, vars); }
function setAllText(selector, key, vars = {}) { document.querySelectorAll(selector).forEach(el => { el.textContent = t(key, vars); }); }
function updateSetupRulesText() {
  const rules = document.querySelectorAll(".setup-rules span");
  if (rules[0]) rules[0].innerHTML = t("setup_rules_1", { time: `<b id="setup-turn-time-copy">${state.turnDuration}</b>` });
  if (rules[1]) rules[1].textContent = t("setup_rules_2");
  if (rules[2]) rules[2].textContent = t("setup_rules_3");
}
function translateRoleLabel(label) {
  const map = { "Centinela":"role_sentinel", "Duelista":"role_duelist", "Controlador":"role_controller", "Vanguardia":"role_vanguard", "Soporte":"role_support", "Sin rol":"role_none" };
  return t(map[label] || "role_none");
}
function applyLanguage(lang = currentLanguage()) {
  state.settings.language = lang;
  document.documentElement.lang = lang;
  if (languageSelect) languageSelect.value = lang;
  setText('.setup-top .eyebrow','setup_eyebrow'); setText('.setup-top h1','setup_title'); setText('.setup-top p:last-child','setup_subtitle');
  setAllText('.setup-team-a .setup-team-heading span, .team-column-a .team-title span, .summary-team-a .summary-team-title span','team_a');
  setAllText('.setup-team-b .setup-team-heading span, .team-column-b .team-title span, .summary-team-b .summary-team-title span','team_b');
  setAllText('.setup-team-a .setup-team-heading strong, .team-column-a .team-title strong, .summary-team-a .summary-team-title strong','attackers');
  setAllText('.setup-team-b .setup-team-heading strong, .team-column-b .team-title strong, .summary-team-b .summary-team-title strong','defenders');
  setText('.versus-core','vs'); setText('.menu-panel-copy p','setup_copy'); updateSetupRulesText();
  setText('.player-name-mode-panel .subconfig-heading span','names_heading_small'); setText('.player-name-mode-panel .subconfig-heading strong','names_heading'); setText('#manual-player-names','manual_mode'); setText('#random-player-names','random_names'); setText('#start-draft','start_draft');
  const highlights=document.querySelectorAll('.menu-panel-highlights span'); if(highlights[0])highlights[0].textContent=t('highlight_1'); if(highlights[1])highlights[1].textContent=t('highlight_2'); if(highlights[2])highlights[2].textContent=t('highlight_3');
  document.querySelectorAll('.setup-top-tab').forEach(button=>{ const key={menu:'tab_menu',volumen:'tab_volume',configuracion:'tab_config',random:'tab_random',idioma:'tab_language',updates:'tab_updates',creditos:'tab_credits'}[button.dataset.tab]; if(key) button.textContent=t(key); });
  setText('[data-panel="volumen"] .subconfig-heading span','sound'); setText('[data-panel="volumen"] .subconfig-heading strong','volume');
  [['master_volume','master_volume_desc'],['music_volume','music_volume_desc'],['sfx_volume','sfx_volume_desc'],['narration_volume','narration_volume_desc'],['character_voice_volume','character_voice_volume_desc']].forEach((keys,i)=>{ const row=document.querySelectorAll('[data-panel="volumen"] .volume-row')[i]; if(!row)return; const sp=row.querySelector('.subconfig-copy span'); const sm=row.querySelector('.subconfig-copy small'); if(sp)sp.textContent=t(keys[0]); if(sm)sm.textContent=t(keys[1]); });
  setText('[data-panel="idioma"] .subconfig-heading span','language'); setText('[data-panel="idioma"] .subconfig-heading strong','interface_text');
  [['text_language','text_language_desc'],['narration_audio','audio_locked_desc'],['character_audio','audio_locked_desc']].forEach((keys,i)=>{ const row=document.querySelectorAll('[data-panel="idioma"] .language-row')[i]; if(!row)return; const sp=row.querySelector('.subconfig-copy span'); const sm=row.querySelector('.subconfig-copy small'); if(sp)sp.textContent=t(keys[0]); if(sm)sm.textContent=t(keys[1]); });
  document.querySelectorAll('.locked-language-select option').forEach(o=>{o.textContent=t('default')}); setText('.language-note-panel strong','audio_locked_title'); setText('.language-note-panel p','audio_locked_body');
  setText('[data-panel="random"] .subconfig-heading span','random_selector'); setText('[data-panel="random"] .subconfig-heading strong','random_summary'); setText('[data-panel="random"] .subconfig-copy span','random_summary_action'); setText('[data-panel="random"] .subconfig-copy small','random_summary_desc'); setText('#simulate-summary','simulate');
  setText('[data-panel="updates"] .subconfig-heading span','updates'); setText('[data-panel="updates"] .subconfig-heading strong','important_improvements'); document.querySelectorAll('.updates-history-panel li').forEach((li,i)=>{ li.textContent=t(`update_${i+1}`); });
  setText('[data-panel="creditos"] .subconfig-heading span','credits'); setText('[data-panel="creditos"] .subconfig-heading strong','voices'); setText('.credits-line strong','system_voice');
  setText('[data-panel="configuracion"] .subconfig-heading span','config'); setText('[data-panel="configuracion"] .subconfig-heading strong','game_settings');
  [['turn_time','turn_time_desc'],['animation_duration','animation_duration_desc'],['narration_toggle','narration_toggle_desc'],['selection_animation','selection_animation_desc'],['auto_resolve','auto_resolve_desc']].forEach((keys,i)=>{ const row=document.querySelectorAll('[data-panel="configuracion"] .subconfig-row, [data-panel="configuracion"] .toggle-row')[i]; if(!row)return; const sp=row.querySelector('.subconfig-copy span'); const sm=row.querySelector('.subconfig-copy small'); if(sp)sp.textContent=t(keys[0]); if(sm)sm.textContent=t(keys[1]); });
  setText('#cancel-draft','cancel'); setText('#confirm-action','confirm'); setText('.team-column-a .ban-stack > span','ban_stack_a'); setText('.team-column-b .ban-stack > span','ban_stack_b');
  const ribbons=document.querySelectorAll('.team-ribbon span'); if(ribbons[0])ribbons[0].textContent=`${t('team_a')} (${t('attackers')})`; if(ribbons[1])ribbons[1].textContent=`${t('team_b')} (${t('defenders')})`;
  setText('.map-header .eyebrow','map_completed'); setText('.map-header h1','map_selection'); setText('.map-header p:last-child','map_desc'); setText('.map-selected-copy span','selected_map'); setText('#randomize-map','randomize_map');
  setText('.summary-header .eyebrow','summary_finished'); setText('.summary-header h1','summary_title'); setText('.summary-map-copy span','selected_map_label'); setAllText('.summary-team h3','bans_done'); setText('#restart-draft','restart');
  updateSelectedMapCopy?.();
  if (document.querySelector('.draft-screen.active')) renderAll();
  if (document.querySelector('.map-screen.active')) renderMapGrid();
}

/*
  AJUSTE DIRECTO DE LA BOX DEL PNG FULL EN DRAFT
  ------------------------------------------------
  Cambia estos valores si quieres que la caja central sea más grande o más chica.

  stageWidth: ancho total del área donde viven los PNG full.
  stageHeight: altura total del área donde viven los PNG full.
  singleBoxWidth: ancho de la caja cuando se muestra 1 personaje.
  doubleBoxWidth: ancho de cada caja cuando se muestran 2 personajes.
  doubleGap: separación entre los 2 personajes cuando el turno permite 2 picks.
  statusBottom: posición vertical del panel FASE/TEAM, menor = más abajo, mayor = más arriba.

  Nota: los PNG quedan por detrás del HUD, laterales, panel de fase y selector inferior.
*/
const DRAFT_FULLBODY_BOX_CONFIG = {
  stageWidth: 1080,
  stageHeight: 585,
  singleBoxWidth: 600,
  doubleBoxWidth: 420,
  doubleGap: 110,
  statusBottom: 104,
};

function applyDraftFullbodyBoxLayout() {
  const cfg = DRAFT_FULLBODY_BOX_CONFIG;
  let style = document.getElementById("draft-fullbody-box-layout");
  if (!style) {
    style = document.createElement("style");
    style.id = "draft-fullbody-box-layout";
    document.head.appendChild(style);
  }

  style.textContent = `
    .game-hud { position: relative !important; z-index: 60 !important; }
    .battle-screen { position: relative !important; isolation: isolate !important; }
    .team-column { position: relative !important; z-index: 45 !important; }
    .character-dock { position: relative !important; z-index: 55 !important; }
    .phase-status-panel { bottom: ${cfg.statusBottom}px !important; z-index: 58 !important; }
    .hero-stage { position: relative !important; z-index: 2 !important; overflow: visible !important; }
    .hero-stage::before { z-index: 0 !important; }
    .turn-chip, .restriction-text { position: relative !important; z-index: 50 !important; }

    .stage-characters {
      position: relative !important;
      z-index: 6 !important;
      width: ${cfg.stageWidth}px !important;
      max-width: ${cfg.stageWidth}px !important;
      height: ${cfg.stageHeight}px !important;
      min-height: ${cfg.stageHeight}px !important;
      max-height: ${cfg.stageHeight}px !important;
      margin-top: -18px !important;
      padding-top: 0 !important;
      display: grid !important;
      align-items: start !important;
      justify-content: center !important;
      overflow: visible !important;
      pointer-events: none !important;
    }

    .stage-characters.is-single {
      grid-template-columns: ${cfg.singleBoxWidth}px !important;
      column-gap: 0 !important;
    }

    .stage-characters.is-double {
      grid-template-columns: ${cfg.doubleBoxWidth}px ${cfg.doubleBoxWidth}px !important;
      column-gap: ${cfg.doubleGap}px !important;
    }

    .stage-characters .fullbody-card,
    .stage-characters .fullbody-empty {
      width: 100% !important;
      min-width: 0 !important;
      height: ${cfg.stageHeight}px !important;
      min-height: ${cfg.stageHeight}px !important;
      max-height: ${cfg.stageHeight}px !important;
      overflow: visible !important;
      pointer-events: none !important;
    }

    .stage-characters .fullbody-box,
    .stage-characters .fullbody-frame {
      width: 100% !important;
      height: 100% !important;
      overflow: visible !important;
      align-items: flex-start !important;
      justify-content: center !important;
    }

    .stage-characters .fullbody-img {
      height: auto !important;
      min-height: 0 !important;
      max-height: none !important;
      object-fit: contain !important;
      object-position: center top !important;
    }

    .stage-characters .fullbody-card.locked-picked {
      animation: none !important;
    }
  `;
}
const devCharacterSelect = $("#dev-character-select");
const devStageSingleInput = $("#dev-stage-single");
const devStageDoubleInput = $("#dev-stage-double");
const devSummaryScaleInput = $("#dev-summary-scale");
const devStageXInput = $("#dev-stage-x");
const devStageYInput = $("#dev-stage-y");
const devSummaryXInput = $("#dev-summary-x");
const devSummaryYInput = $("#dev-summary-y");
const devStageBoxSelect = $("#dev-stage-box");
const devSummaryBoxSelect = $("#dev-summary-box");
const devGlobalStageInput = $("#dev-global-stage");
const devGlobalSummaryInput = $("#dev-global-summary");
const devResetCharacterButton = $("#dev-reset-character");
const devSaveLayoutButton = $("#dev-save-layout");
const devSaveStatus = $("#dev-save-status");
const devPreviewStageSingle = $("#dev-preview-stage-single");
const devPreviewStageDouble = $("#dev-preview-stage-double");
const devPreviewSummary = $("#dev-preview-summary");

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getBaseCharacterLayout(name) {
  const defaultTweak = characterDisplayTweaks[name] || {};
  const stageOffset = stageImageOffsets[name] || { x: 0, y: -56 };
  const summaryOffset = summaryImageOffsets[name] || { x: 0, y: -4 };
  return {
    stageSingle: Number(defaultTweak.stageSingle ?? 0.94),
    stageDouble: Number(defaultTweak.stageDouble ?? 0.91),
    summary: Number(defaultTweak.summary ?? 1.04),
    stageOffset: { x: Number(stageOffset.x ?? 0), y: Number(stageOffset.y ?? -56) },
    summaryOffset: { x: Number(summaryOffset.x ?? 0), y: Number(summaryOffset.y ?? -4) },
    stageBox: wideStageCharacters.has(name) ? "wide" : "standard",
    summaryBox: wideSummaryCharacters.has(name) ? "wide" : "standard",
  };
}

function ensureLayoutConfigShape() {
  if (!window.CHARACTER_LAYOUT_CONFIG || typeof window.CHARACTER_LAYOUT_CONFIG !== "object") {
    window.CHARACTER_LAYOUT_CONFIG = { global: {}, characters: {} };
  }
  if (!window.CHARACTER_LAYOUT_CONFIG.global) window.CHARACTER_LAYOUT_CONFIG.global = {};
  if (!window.CHARACTER_LAYOUT_CONFIG.characters) window.CHARACTER_LAYOUT_CONFIG.characters = {};
  return window.CHARACTER_LAYOUT_CONFIG;
}

function getEditableCharacterLayout(name) {
  const config = ensureLayoutConfigShape();
  if (!config.characters[name]) {
    config.characters[name] = getBaseCharacterLayout(name);
  }
  const target = config.characters[name];
  const fallback = getBaseCharacterLayout(name);
  target.stageSingle = numericLayoutValue(target.stageSingle, fallback.stageSingle);
  target.stageDouble = numericLayoutValue(target.stageDouble, fallback.stageDouble);
  target.summary = numericLayoutValue(target.summary, fallback.summary);
  target.stageOffset = target.stageOffset || {};
  target.summaryOffset = target.summaryOffset || {};
  target.stageOffset.x = numericLayoutValue(target.stageOffset.x, fallback.stageOffset.x);
  target.stageOffset.y = numericLayoutValue(target.stageOffset.y, fallback.stageOffset.y);
  target.summaryOffset.x = numericLayoutValue(target.summaryOffset.x, fallback.summaryOffset.x);
  target.summaryOffset.y = numericLayoutValue(target.summaryOffset.y, fallback.summaryOffset.y);
  target.stageBox = ["wide", "standard"].includes(target.stageBox) ? target.stageBox : fallback.stageBox;
  target.summaryBox = ["wide", "standard"].includes(target.summaryBox) ? target.summaryBox : fallback.summaryBox;
  return target;
}

function serializeCharacterLayoutConfig() {
  const config = ensureLayoutConfigShape();
  const orderedCharacters = {};
  characters.map(item => item.name).forEach(name => {
    orderedCharacters[name] = getEditableCharacterLayout(name);
  });
  const payload = {
    global: {
      stageScaleMultiplier: numericLayoutValue(config.global.stageScaleMultiplier, STAGE_SCALE_MULTIPLIER),
      summaryScaleMultiplier: numericLayoutValue(config.global.summaryScaleMultiplier, SUMMARY_SCALE_MULTIPLIER),
    },
    characters: orderedCharacters,
  };
  return `/* Configuración generada desde DEVELOPMENT. */\nwindow.CHARACTER_LAYOUT_CONFIG = ${JSON.stringify(payload, null, 2)};\n`;
}

function updateDevSaveStatus(message, isError = false) {
  if (!devSaveStatus) return;
  devSaveStatus.textContent = message;
  devSaveStatus.classList.toggle("is-error", Boolean(isError));
  devSaveStatus.classList.toggle("is-success", !isError);
}

function setDevelopmentFieldValues(name) {
  const config = ensureLayoutConfigShape();
  const item = getEditableCharacterLayout(name);
  state.devSelectedCharacter = name;
  if (devCharacterSelect) devCharacterSelect.value = name;
  if (devStageSingleInput) devStageSingleInput.value = item.stageSingle.toFixed(2);
  if (devStageDoubleInput) devStageDoubleInput.value = item.stageDouble.toFixed(2);
  if (devSummaryScaleInput) devSummaryScaleInput.value = item.summary.toFixed(2);
  if (devStageXInput) devStageXInput.value = String(Math.round(item.stageOffset.x));
  if (devStageYInput) devStageYInput.value = String(Math.round(item.stageOffset.y));
  if (devSummaryXInput) devSummaryXInput.value = String(Math.round(item.summaryOffset.x));
  if (devSummaryYInput) devSummaryYInput.value = String(Math.round(item.summaryOffset.y));
  if (devStageBoxSelect) devStageBoxSelect.value = item.stageBox;
  if (devSummaryBoxSelect) devSummaryBoxSelect.value = item.summaryBox;
  if (devGlobalStageInput) devGlobalStageInput.value = numericLayoutValue(config.global.stageScaleMultiplier, STAGE_SCALE_MULTIPLIER).toFixed(2);
  if (devGlobalSummaryInput) devGlobalSummaryInput.value = numericLayoutValue(config.global.summaryScaleMultiplier, SUMMARY_SCALE_MULTIPLIER).toFixed(2);
}

function applyDevelopmentInputsToConfig() {
  const config = ensureLayoutConfigShape();
  const name = state.devSelectedCharacter || characters[0].name;
  const item = getEditableCharacterLayout(name);
  item.stageSingle = numericLayoutValue(devStageSingleInput?.value, item.stageSingle);
  item.stageDouble = numericLayoutValue(devStageDoubleInput?.value, item.stageDouble);
  item.summary = numericLayoutValue(devSummaryScaleInput?.value, item.summary);
  item.stageOffset.x = numericLayoutValue(devStageXInput?.value, item.stageOffset.x);
  item.stageOffset.y = numericLayoutValue(devStageYInput?.value, item.stageOffset.y);
  item.summaryOffset.x = numericLayoutValue(devSummaryXInput?.value, item.summaryOffset.x);
  item.summaryOffset.y = numericLayoutValue(devSummaryYInput?.value, item.summaryOffset.y);
  item.stageBox = devStageBoxSelect?.value || item.stageBox;
  item.summaryBox = devSummaryBoxSelect?.value || item.summaryBox;
  config.global.stageScaleMultiplier = numericLayoutValue(devGlobalStageInput?.value, STAGE_SCALE_MULTIPLIER);
  config.global.summaryScaleMultiplier = numericLayoutValue(devGlobalSummaryInput?.value, SUMMARY_SCALE_MULTIPLIER);
}

function createDevelopmentPreviewCard(name, mode, groupSize = 1) {
  const card = document.createElement("div");
  card.className = groupSize > 1 ? "fullbody-card dual" : "fullbody-card single";
  const boxClass = mode === "summary" ? summaryBoxClass(name) : stageBoxClass(name);
  const box = document.createElement("div");
  box.className = boxClass;
  box.appendChild(createFullbodyImage(name, mode, groupSize));
  card.appendChild(box);
  return card;
}

function renderDevelopmentPreviews() {
  if (!devPreviewStageSingle || !devPreviewStageDouble || !devPreviewSummary) return;
  applyDevelopmentInputsToConfig();
  const name = state.devSelectedCharacter || characters[0].name;
  devPreviewStageSingle.innerHTML = "";
  devPreviewStageDouble.innerHTML = "";
  devPreviewSummary.innerHTML = "";

  devPreviewStageSingle.appendChild(createDevelopmentPreviewCard(name, "stage", 1));

  const dualWrap = document.createElement("div");
  dualWrap.className = "dev-dual-wrap";
  dualWrap.appendChild(createDevelopmentPreviewCard(name, "stage", 2));
  const ghost = createDevelopmentPreviewCard(name, "stage", 2);
  ghost.classList.add("dev-ghost-card");
  dualWrap.appendChild(ghost);
  devPreviewStageDouble.appendChild(dualWrap);

  const summaryWrap = document.createElement("div");
  summaryWrap.className = "summary-lineup-item";
  summaryWrap.appendChild(createDevelopmentPreviewCard(name, "summary", 1));
  devPreviewSummary.appendChild(summaryWrap);
}

async function saveDevelopmentConfigToFile() {
  applyDevelopmentInputsToConfig();
  const content = serializeCharacterLayoutConfig();
  if (window.draftSimulatorFiles?.saveCharacterLayoutConfig) {
    const result = await window.draftSimulatorFiles.saveCharacterLayoutConfig(content);
    if (result?.ok) {
      updateDevSaveStatus(`Guardado correctamente en: ${result.path}`);
      return;
    }
    updateDevSaveStatus(result?.message || "No se pudo guardar el archivo.", true);
    return;
  }

  const blob = new Blob([content], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "character_layout_config.js";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  updateDevSaveStatus("No se detectó Electron. Se descargó character_layout_config.js para reemplazarlo manualmente.");
}

function resetDevelopmentCharacter() {
  const name = state.devSelectedCharacter || characters[0].name;
  ensureLayoutConfigShape().characters[name] = getBaseCharacterLayout(name);
  setDevelopmentFieldValues(name);
  renderDevelopmentPreviews();
  updateDevSaveStatus(`Se restauró la configuración base de ${name}.`);
}

function setupDevelopmentTools() {
  if (!devCharacterSelect) return;
  ensureLayoutConfigShape();
  if (!Object.keys(ensureLayoutConfigShape().characters).length) {
    characters.forEach(item => { ensureLayoutConfigShape().characters[item.name] = getBaseCharacterLayout(item.name); });
  }

  devCharacterSelect.innerHTML = "";
  characters.forEach(item => {
    const option = document.createElement("option");
    option.value = item.name;
    option.textContent = `${item.name} · ${factions[item.faction].label}`;
    devCharacterSelect.appendChild(option);
  });

  const rerender = () => renderDevelopmentPreviews();
  const syncCharacter = () => {
    setDevelopmentFieldValues(devCharacterSelect.value);
    renderDevelopmentPreviews();
  };

  devCharacterSelect.addEventListener("change", syncCharacter);
  [devStageSingleInput, devStageDoubleInput, devSummaryScaleInput, devStageXInput, devStageYInput, devSummaryXInput, devSummaryYInput, devStageBoxSelect, devSummaryBoxSelect, devGlobalStageInput, devGlobalSummaryInput].forEach(control => {
    control?.addEventListener("input", rerender);
    control?.addEventListener("change", rerender);
  });
  devResetCharacterButton?.addEventListener("click", resetDevelopmentCharacter);
  devSaveLayoutButton?.addEventListener("click", saveDevelopmentConfigToFile);

  setDevelopmentFieldValues(state.devSelectedCharacter || characters[0].name);
  renderDevelopmentPreviews();
  updateDevSaveStatus("Editor listo. Ajusta y guarda.");
}

function resizeGameRoot() {
  const root = document.getElementById("game-root");
  if (!root) return;
  const scale = Math.min(window.innerWidth / BASE_WIDTH, window.innerHeight / BASE_HEIGHT);
  const left = Math.round((window.innerWidth - BASE_WIDTH * scale) / 2);
  const top = Math.round((window.innerHeight - BASE_HEIGHT * scale) / 2);
  root.style.transform = `translate(${left}px, ${top}px) scale(${scale})`;
}

function audioCandidates(src) {
  if (!src) return [];
  const match = src.match(/\.(mp3|ogg|mp4)$/i);
  if (!match) return AUDIO_EXTENSIONS.map(ext => `${src}.${ext}`);
  const base = src.slice(0, -match[0].length);
  const currentExt = match[1].toLowerCase();
  const ordered = [currentExt, ...AUDIO_EXTENSIONS.filter(ext => ext !== currentExt)];
  return ordered.map(ext => `${base}.${ext}`);
}

function setAudioElementSourceWithFallback(audio, sources, startIndex = 0) {
  audio.dataset.sources = JSON.stringify(sources);
  audio.dataset.sourceIndex = String(startIndex);
  audio.src = sources[startIndex] || "";
  try {
    audio.load();
  } catch (_) {
    // Algunos navegadores no necesitan load() manual para Audio().
  }
}

function slugName(name) {
  return name.replaceAll(" ", "_");
}

function thumbPath(name) {
  return `img/characters/thumbs/${slugName(name)}.png`;
}

function fullPath(name) {
  return `img/characters/full/${slugName(name)}.png`;
}

function legacyPath(name) {
  return `img/characters/${slugName(name)}.png`;
}

function playerAvatarPath(team, index) {
  return `img/players/${team}${index + 1}.png`;
}

function voicePath(name, type) {
  return `audio/voices/${type}/${slugName(name)}.mp3`;
}

function roleOf(name) {
  return translateRoleLabel(roles[name] || "Sin rol");
}

function initials(name) {
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function normalizedPercent(value) {
  return clamp01((Number(value) || 0) / 100);
}

function channelVolume(channel = "sfx") {
  const settings = state.settings || {};
  const master = clamp01(settings.masterVolume ?? 1);

  let channelValue = settings.sfxVolume ?? 1;
  if (channel === "music") channelValue = settings.musicVolume ?? 1;
  if (channel === "narration") channelValue = settings.narrationVolume ?? 1;
  if (channel === "characterVoice") channelValue = settings.characterVoiceVolume ?? 1;
  // Compatibilidad con versiones anteriores: si algo llama "voice", usa narración.
  if (channel === "voice") channelValue = settings.characterVoiceVolume ?? 1;

  return clamp01(master * clamp01(channelValue));
}

function updateMusicVolume() {
  if (!state.musicAudio) return;
  state.musicAudio.volume = Math.max(0, Math.min(1, 0.42 * channelVolume("music")));
}

function updateVolumeReadout(valueElement, rangeElement) {
  if (!valueElement || !rangeElement) return;
  valueElement.textContent = String(Math.round(Number(rangeElement.value) || 0));
}

function makeImage(srcList, className, altText) {
  const img = document.createElement("img");
  if (className) img.className = className;
  img.alt = altText || "";
  img.dataset.fallbackIndex = "0";
  img.dataset.sources = JSON.stringify(srcList);
  img.src = srcList[0];
  img.addEventListener("error", () => {
    const sources = JSON.parse(img.dataset.sources || "[]");
    const nextIndex = Number(img.dataset.fallbackIndex || "0") + 1;
    if (sources[nextIndex]) {
      img.dataset.fallbackIndex = String(nextIndex);
      img.src = sources[nextIndex];
      return;
    }
    img.style.display = "none";
  });
  return img;
}

function keepTransientAudioReference(audio) {
  if (!audio) return audio;
  if (!Array.isArray(state.activeSounds)) state.activeSounds = [];
  state.activeSounds.push(audio);

  const cleanup = () => {
    state.activeSounds = (state.activeSounds || []).filter(item => item !== audio);
  };

  audio.addEventListener("ended", cleanup, { once: true });
  window.setTimeout(cleanup, 18000);
  return audio;
}

function audioPlay(src, volume = 0.78, channel = "sfx") {
  const sources = audioCandidates(src);
  if (!sources.length) return null;

  const audio = new Audio();
  audio.preload = "auto";
  audio.volume = Math.max(0, Math.min(1, volume * channelVolume(channel)));

  const tryNext = () => {
    const allSources = JSON.parse(audio.dataset.sources || "[]");
    const nextIndex = Number(audio.dataset.sourceIndex || "0") + 1;
    if (!allSources[nextIndex]) {
      return;
    }
    setAudioElementSourceWithFallback(audio, allSources, nextIndex);
    audio.load?.();
    audio.play().catch(() => tryNext());
  };

  audio.addEventListener("error", tryNext);
  setAudioElementSourceWithFallback(audio, sources, 0);
  audio.load?.();
  keepTransientAudioReference(audio);
  audio.play().catch(() => tryNext());
  return audio;
}

function uiAudioCandidates(src) {
  if (!src) return [];
  const match = src.match(/\.(mp3|ogg|mp4)$/i);
  if (match) return audioCandidates(src);
  return ["mp3", "ogg", "mp4"].map(ext => `${src}.${ext}`);
}

async function resolveExistingAudioSource(src, mode = "normal") {
  const sources = mode === "ui" ? uiAudioCandidates(src) : audioCandidates(src);
  if (!sources.length) return "";
  for (const source of sources) {
    try {
      const response = await fetch(source, { method: "HEAD", cache: "no-store" });
      if (response.ok) return source;
    } catch (_) {
      // Si se abre localmente o el navegador bloquea HEAD, se usa el fallback normal.
    }
  }
  return sources[0];
}

async function playUiSound(src, volume = 1) {
  const resolved = await resolveExistingAudioSource(src, "ui");
  return audioPlay(resolved || src, volume, "sfx");
}

function audioLoopPlay(src, volume = 0.78, channel = "sfx") {
  const sources = audioCandidates(src);
  if (!sources.length) return null;

  const audio = new Audio();
  audio.loop = true;
  audio.volume = Math.max(0, Math.min(1, volume * channelVolume(channel)));

  const tryNext = () => {
    const allSources = JSON.parse(audio.dataset.sources || "[]");
    const nextIndex = Number(audio.dataset.sourceIndex || "0") + 1;
    if (!allSources[nextIndex]) return;
    setAudioElementSourceWithFallback(audio, allSources, nextIndex);
    audio.loop = true;
    audio.play().catch(() => tryNext());
  };

  audio.addEventListener("error", tryNext);
  setAudioElementSourceWithFallback(audio, sources, 0);
  audio.play().catch(() => tryNext());
  return audio;
}

function audioLoopStop(audio) {
  if (!audio) return;
  try {
    audio.pause();
    audio.currentTime = 0;
    audio.src = "";
    audio.load?.();
  } catch (_) {
    // El audio de roulette no es crítico.
  }
}

function speakFallback(text) {
  if (!text || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = { es: "es-ES", en: "en-US", ja: "ja-JP", ru: "ru-RU", zh: "zh-CN" }[currentLanguage()] || "es-ES";
    utterance.rate = 0.95;
    utterance.pitch = 0.92;
    utterance.volume = 0.95;
    window.speechSynthesis.speak(utterance);
  } catch (_) {
    // La narración por voz no es crítica para el flujo.
  }
}

function playNarration(src, fallbackText, volume = 0.92) {
  if (!state.settings.narrationEnabled) return null;
  const sources = audioCandidates(src);
  if (!sources.length) {
    if (fallbackText) speakFallback(fallbackText);
    return null;
  }

  const audio = new Audio();
  audio.volume = Math.max(0, Math.min(1, volume * channelVolume("narration")));
  let playedByAudio = false;

  const tryNext = () => {
    const allSources = JSON.parse(audio.dataset.sources || "[]");
    const nextIndex = Number(audio.dataset.sourceIndex || "0") + 1;
    if (!allSources[nextIndex]) {
      if (!playedByAudio && fallbackText) speakFallback(fallbackText);
      return;
    }
    setAudioElementSourceWithFallback(audio, allSources, nextIndex);
    audio.play().catch(() => tryNext());
  };

  audio.addEventListener("playing", () => {
    playedByAudio = true;
  }, { once: true });
  audio.addEventListener("error", tryNext);
  setAudioElementSourceWithFallback(audio, sources, 0);
  audio.play().catch(() => tryNext());
  return audio;
}

function playCharacterVoice(character, type) {
  if (!state.settings.narrationEnabled) return;
  audioPlay(voicePath(character.name, type), 0.95, "characterVoice");
}

function formatTimer(seconds) {
  return `00:${String(seconds).padStart(2, "0")}`;
}

function setupBackgroundVideo() {
  const video = $("#bg-video");
  if (!video) return;

  const applyVideoSettings = () => {
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute("muted", "");
    video.setAttribute("loop", "");
    video.setAttribute("autoplay", "");
    video.setAttribute("playsinline", "");
  };

  const playVideo = () => {
    applyVideoSettings();
    if (!video.currentSrc && video.querySelector("source")) {
      video.load();
    }
    const promise = video.play();
    if (promise) promise.catch(() => {});
  };

  if (video.dataset.initialized === "true") {
    playVideo();
    return;
  }
  video.dataset.initialized = "true";

  video.addEventListener("loadeddata", () => {
    document.body.classList.add("video-ready");
    playVideo();
  });
  video.addEventListener("canplay", playVideo);
  video.addEventListener("stalled", () => setTimeout(playVideo, 400));
  video.addEventListener("suspend", () => setTimeout(playVideo, 400));
  video.addEventListener("error", () => {
    document.body.classList.add("video-error");
  });

  document.addEventListener("pointerdown", playVideo, { passive: true });
  document.addEventListener("keydown", playVideo);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) playVideo();
  });

  applyVideoSettings();
  video.load();
  playVideo();
}


function setupInputs() {
  setupA.innerHTML = "";
  setupB.innerHTML = "";

  for (let i = 0; i < 5; i += 1) {
    setupA.appendChild(createPlayerInput("A", i));
    setupB.appendChild(createPlayerInput("B", i));
  }
}

function createPlayerInput(team, index) {
  const row = document.createElement("label");
  row.className = "setup-player-row";

  const avatar = document.createElement("div");
  avatar.className = "setup-player-avatar";
  const fallback = document.createElement("span");
  fallback.textContent = "?";
  avatar.appendChild(fallback);
  avatar.appendChild(makeImage([playerAvatarPath(team, index)], "", `Jugador ${team}${index + 1}`));

  const input = document.createElement("input");
  input.className = "player-input";
  input.value = `Jugador ${team}${index + 1}`;
  input.placeholder = `Jugador ${team}${index + 1}`;
  input.dataset.team = team;
  input.dataset.index = String(index);

  if (team === "B") {
    row.appendChild(input);
    row.appendChild(avatar);
  } else {
    row.appendChild(avatar);
    row.appendChild(input);
  }

  return row;
}

function setPlayerInputValue(team, index, value) {
  const input = document.querySelector(`.player-input[data-team="${team}"][data-index="${index}"]`);
  if (input) input.value = value;
  state.players[team][index] = value;
}

function shuffleList(list) {
  return [...list].sort(() => Math.random() - 0.5);
}

function defaultPlayerName(team, index) {
  return `Jugador ${team}${index + 1}`;
}

function getConfiguredRandomNamePool(team) {
  const config = window.PLAYER_NAMES_CONFIG || {};
  const teamPool = Array.isArray(config[team]) ? config[team] : [];
  const genericPool = Array.isArray(config.names) ? config.names : [];
  const combined = [...teamPool, ...genericPool]
    .map(name => String(name || "").trim())
    .filter(Boolean);
  return combined.length ? combined : [
    "Wizz", "RPmods", "Laminante", "Striker", "Nova",
    "Raptor", "Zero", "Echo", "Valkyrie", "Pulse",
  ];
}

function applyManualPlayerNames() {
  for (let i = 0; i < 5; i += 1) {
    setPlayerInputValue("A", i, defaultPlayerName("A", i));
    setPlayerInputValue("B", i, defaultPlayerName("B", i));
  }
}

function applyRandomPlayerNames() {
  const used = new Set();
  const takeName = (team, index) => {
    const candidates = shuffleList(getConfiguredRandomNamePool(team));
    const chosen = candidates.find(name => !used.has(name)) || `${candidates[0] || "Jugador"} ${team}${index + 1}`;
    used.add(chosen);
    return chosen;
  };

  for (let i = 0; i < 5; i += 1) {
    setPlayerInputValue("A", i, takeName("A", i));
    setPlayerInputValue("B", i, takeName("B", i));
  }
}

function readPlayers() {
  document.querySelectorAll(".player-input").forEach(input => {
    const team = input.dataset.team;
    const index = Number(input.dataset.index);
    state.players[team][index] = input.value.trim() || input.placeholder;
  });
}

function clampTurnDuration(value) {
  return Math.max(10, Math.min(50, Number(value) || 20));
}

function applyTurnDuration(value) {
  const duration = clampTurnDuration(value);
  state.turnDuration = duration;
  if (turnTimeRange) turnTimeRange.value = String(duration);
  if (turnTimeInput) turnTimeInput.value = String(duration);
  if (setupTurnTimeCopy) setupTurnTimeCopy.textContent = String(duration);
}

function activateSetupTab(tabName) {
  document.querySelectorAll(".setup-top-tab").forEach(button => {
    button.classList.toggle("is-active", button.dataset.tab === tabName);
  });
  document.querySelectorAll(".setup-panel").forEach(panel => {
    panel.classList.toggle("is-active", panel.dataset.panel === tabName);
  });
  if (setupShell) {
    setupShell.classList.remove("view-menu", "view-volumen", "view-configuracion", "view-development", "view-random", "view-idioma", "view-creditos", "view-updates");
    setupShell.classList.add(`view-${tabName}`);
  }
}

function setupConfigControls() {
  applyTurnDuration(state.turnDuration);

  if (turnTimeRange) turnTimeRange.addEventListener("input", (event) => applyTurnDuration(event.target.value));
  if (turnTimeInput) {
    turnTimeInput.addEventListener("input", (event) => applyTurnDuration(event.target.value));
    turnTimeInput.addEventListener("blur", () => applyTurnDuration(turnTimeInput.value));
  }
  if (turnTimeMinus) turnTimeMinus.addEventListener("click", () => applyTurnDuration(state.turnDuration - 1));
  if (turnTimePlus) turnTimePlus.addEventListener("click", () => applyTurnDuration(state.turnDuration + 1));

  const bindVolumeRange = (range, valueEl, key) => {
    if (!range) return;
    const applyValue = () => {
      state.settings[key] = normalizedPercent(range.value);
      updateVolumeReadout(valueEl, range);
      updateMusicVolume();
    };
    range.addEventListener("input", applyValue);
    applyValue();
  };

  bindVolumeRange(masterVolumeRange, masterVolumeValue, "masterVolume");
  bindVolumeRange(musicVolumeRange, musicVolumeValue, "musicVolume");
  bindVolumeRange(sfxVolumeRange, sfxVolumeValue, "sfxVolume");
  bindVolumeRange(narrationVolumeRange, narrationVolumeValue, "narrationVolume");
  bindVolumeRange(characterVoiceVolumeRange, characterVoiceVolumeValue, "characterVoiceVolume");

  if (languageSelect) {
    languageSelect.value = state.settings.language;
    languageSelect.addEventListener("change", () => applyLanguage(languageSelect.value));
  }

  const animationApply = () => {
    const raw = Math.max(60, Math.min(180, Number(animationDurationRange?.value) || 100));
    state.settings.animationDuration = raw / 100;
    if (animationDurationValue) animationDurationValue.textContent = `${state.settings.animationDuration.toFixed(2)}x`;
  };
  if (animationDurationRange) {
    animationDurationRange.addEventListener("input", animationApply);
    animationApply();
  }

  if (narrationToggle) {
    narrationToggle.checked = state.settings.narrationEnabled;
    narrationToggle.addEventListener("change", () => {
      state.settings.narrationEnabled = narrationToggle.checked;
    });
  }
  if (selectionAnimationToggle) {
    selectionAnimationToggle.checked = state.settings.selectionAnimationEnabled;
    selectionAnimationToggle.addEventListener("change", () => {
      state.settings.selectionAnimationEnabled = selectionAnimationToggle.checked;
    });
  }
  if (autoResolveToggle) {
    autoResolveToggle.checked = state.settings.autoResolveEnabled;
    autoResolveToggle.addEventListener("change", () => {
      state.settings.autoResolveEnabled = autoResolveToggle.checked;
    });
  }

  document.querySelectorAll(".setup-top-tab").forEach(button => {
    if (button.disabled) return;
    button.addEventListener("click", () => activateSetupTab(button.dataset.tab));
  });
  activateSetupTab("menu");
}

function switchScreen(screen) {
  [setupScreen, draftScreen, mapScreen, summaryScreen].filter(Boolean).forEach(item => item.classList.remove("active"));
  screen?.classList.add("active");

  if (screen === setupScreen) {
    startMusic("menu");
  } else if (screen === draftScreen || screen === mapScreen || screen === summaryScreen) {
    startMusic("draft");
  }
}

function currentMusicPlaylist() {
  return musicPlaylists[state.musicMode] || draftMusicPlaylist;
}

function ensureMusicAudio() {
  if (state.musicAudio) return state.musicAudio;

  state.musicAudio = new Audio();
  state.musicAudio.preload = "auto";
  state.musicAudio.loop = true;
  state.musicAudio.volume = 0.42;
  state.musicAudio.addEventListener("ended", restartCurrentMusicLoop);
  state.musicAudio.addEventListener("error", playNextMusicCandidate);
  state.musicAudio.addEventListener("stalled", () => setTimeout(resumeMusicIfNeeded, 350));
  state.musicAudio.addEventListener("suspend", () => setTimeout(resumeMusicIfNeeded, 350));
  state.musicAudio.addEventListener("pause", () => {
    if (state.musicEnabled && !document.hidden) setTimeout(resumeMusicIfNeeded, 350);
  });

  if (!state.musicResumeHandlerBound) {
    state.musicResumeHandlerBound = true;
    document.addEventListener("pointerdown", resumeMusicIfNeeded, { passive: true });
    document.addEventListener("keydown", resumeMusicIfNeeded);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) resumeMusicIfNeeded();
    });
  }

  return state.musicAudio;
}

function prepareMusicTrack(force = false) {
  const playlist = currentMusicPlaylist();
  if (!playlist.length) return;

  const audio = ensureMusicAudio();
  const track = playlist[state.musicIndex % playlist.length];

  if (!force && state.musicCurrentTrack === track && audio.src) {
    updateMusicVolume();
    audio.loop = true;
    return;
  }

  state.musicCurrentTrack = track;
  state.musicCandidateSources = audioCandidates(track);
  state.musicCandidateIndex = 0;
  audio.loop = true;
  setAudioElementSourceWithFallback(audio, state.musicCandidateSources, 0);
  updateMusicVolume();
  audio.load();
}

function playNextMusicCandidate() {
  if (!state.musicAudio || !state.musicEnabled) return;

  const nextIndex = state.musicCandidateIndex + 1;
  if (state.musicCandidateSources[nextIndex]) {
    state.musicCandidateIndex = nextIndex;
    setAudioElementSourceWithFallback(state.musicAudio, state.musicCandidateSources, nextIndex);
    state.musicAudio.loop = true;
    state.musicAudio.load();
    state.musicAudio.play().catch(() => {});
    return;
  }

  const playlist = currentMusicPlaylist();
  if (!playlist.length) return;

  // Si fallan todas las extensiones del track actual, probamos otro track de la lista.
  state.musicErrorCount += 1;
  if (state.musicErrorCount < playlist.length) {
    playNextTrack();
    return;
  }

  // Evita que la música muera para siempre: reinicia el contador después de un pequeño descanso.
  setTimeout(() => {
    state.musicErrorCount = 0;
    if (state.musicEnabled) startMusic(state.musicMode);
  }, 1200);
}

function restartCurrentMusicLoop() {
  if (!state.musicAudio || !state.musicEnabled) return;
  try {
    state.musicAudio.currentTime = 0;
  } catch (_) {
    // Algunos navegadores no permiten mover currentTime hasta cargar metadatos.
  }
  state.musicAudio.loop = true;
  state.musicAudio.play().catch(() => {});
}

function startMusic(mode = state.musicMode || "menu") {
  if (!state.musicEnabled) return;

  const normalizedMode = musicPlaylists[mode] ? mode : "draft";
  const modeChanged = state.musicMode !== normalizedMode;
  state.musicMode = normalizedMode;

  if (modeChanged) {
    state.musicIndex = 0;
    state.musicErrorCount = 0;
    state.musicCurrentTrack = "";
  }

  if (!state.musicAudio || !state.musicAudio.src || modeChanged) prepareMusicTrack(true);
  else prepareMusicTrack(false);

  resumeMusicIfNeeded();
}

function resumeMusicIfNeeded() {
  if (!state.musicEnabled || !state.musicAudio) return;
  updateMusicVolume();
  state.musicAudio.loop = true;
  state.musicAudio.play().catch(() => {});
}

function playNextTrack() {
  if (!state.musicEnabled) return;

  const playlist = currentMusicPlaylist();
  if (!playlist.length) return;

  state.musicIndex = (state.musicIndex + 1) % playlist.length;
  state.musicCurrentTrack = "";
  prepareMusicTrack(true);
  resumeMusicIfNeeded();
}

function toggleMusic() {
  state.musicEnabled = !state.musicEnabled;
  const button = $("#music-toggle");
  if (state.musicEnabled) {
    button.textContent = "♫ ON";
    state.musicErrorCount = 0;
    startMusic(state.musicMode || "menu");
  } else {
    button.textContent = "♫ OFF";
    state.musicAudio?.pause();
  }
}

function showPhaseOverlay(text, voiceSrc, subtitle, callback) {
  const overlay = $("#phase-overlay");
  const title = $("#phase-title");
  const subtitleElement = $("#phase-subtitle");
  const kicker = $("#phase-kicker");

  state.locked = true;
  document.body.classList.add("overlay-lock");

  title.textContent = text;
  subtitleElement.textContent = subtitle || t("phase_preparing");
  kicker.textContent = text.includes("RESUMEN") || text.includes("SUMMARY") ? t("phase_result") : text.includes("BLOQUEO") || text.includes("BAN") ? t("phase_ban") : t("phase_selection");

  overlay.classList.remove("hidden", "animate");
  void overlay.offsetWidth;
  overlay.classList.add("animate");
  if (voiceSrc) playNarration(voiceSrc, subtitle || text, 0.92);

  const overlayDuration = Math.round(2200 + (state.settings.animationDuration * 1000));
  window.setTimeout(() => {
    overlay.classList.add("hidden");
    overlay.classList.remove("animate");
    callback?.();
  }, overlayDuration);
}

function currentTurn() {
  return turns[state.turnIndex];
}

function pickedNames() {
  return [...state.picks.A, ...state.picks.B].map(item => item.name);
}

function pickedTeamForCharacter(name) {
  if (state.picks.A.some(item => item.name === name)) return "A";
  if (state.picks.B.some(item => item.name === name)) return "B";
  return null;
}

function currentTeamClass(turn = currentTurn()) {
  return turn?.team === "B" ? "team-b" : "team-a";
}

function bannedNames() {
  return [...state.bans.A, ...state.bans.B].map(item => item.name);
}

function getAllowedFactionKeysForPick(team) {
  if (team === "A") return ["scissors", "urbino"];
  return ["pus", "urbino"];
}

function isCharacterAvailable(character, turn = currentTurn()) {
  if (!turn) return false;
  if (pickedNames().includes(character.name) || bannedNames().includes(character.name)) return false;

  if (turn.type === "ban") {
    return character.faction === turn.faction;
  }

  return getAllowedFactionKeysForPick(turn.team).includes(character.faction);
}

function renderSlots() {
  renderTeamSlots("A", $("#team-a-slots"));
  renderTeamSlots("B", $("#team-b-slots"));
}

function renderTeamSlots(team, container) {
  const turn = currentTurn();
  container.innerHTML = "";

  for (let i = 0; i < 5; i += 1) {
    const pick = state.picks[team][i];
    const slot = document.createElement("article");
    slot.className = "player-slot";

    const isActivePickSlot = turn?.type === "pick" && turn.team === team && i === state.picks[team].length;
    const previewPick = isActivePickSlot ? currentRoulettePreviewCharacter(turn) : null;
    if (isActivePickSlot) slot.classList.add("active-turn");
    if (previewPick) slot.classList.add("roulette-preview-slot");
    if (pick && state.flashPick === pick.name) slot.classList.add("pick-flash");

    const portrait = document.createElement("div");
    portrait.className = "slot-portrait";
    if (pick) {
      portrait.appendChild(makeImage([thumbPath(pick.name), legacyPath(pick.name)], "", pick.name));
    } else if (previewPick) {
      portrait.appendChild(makeImage([thumbPath(previewPick.name), legacyPath(previewPick.name)], "", previewPick.name));
    } else {
      const placeholder = document.createElement("span");
      placeholder.className = "slot-placeholder";
      placeholder.textContent = "?";
      portrait.appendChild(placeholder);
    }

    const details = document.createElement("div");
    details.className = "slot-details";
    const playerName = document.createElement("p");
    playerName.className = "slot-name";
    playerName.textContent = state.players[team][i];
    const characterName = document.createElement("p");
    characterName.className = "slot-character";
    characterName.textContent = pick
      ? `${pick.name} · ${factions[pick.faction].label}`
      : previewPick
        ? `${previewPick.name} · ${factions[previewPick.faction].label}`
        : t("not_selected");
    details.appendChild(playerName);
    details.appendChild(characterName);

    if (team === "B") {
      slot.appendChild(details);
      slot.appendChild(portrait);
    } else {
      slot.appendChild(portrait);
      slot.appendChild(details);
    }

    container.appendChild(slot);
  }
}

function renderBans() {
  renderBanList("A", $("#team-a-bans"));
  renderBanList("B", $("#team-b-bans"));
}

function renderBanList(team, container) {
  container.innerHTML = "";
  const turn = currentTurn();
  for (let i = 0; i < 2; i += 1) {
    const character = state.bans[team][i] || null;
    const isActiveBanSlot = turn?.type === "ban" && turn.team === team && i === state.bans[team].length;
    const previewBan = isActiveBanSlot ? currentRoulettePreviewCharacter(turn) : null;
    const slot = document.createElement("div");
    slot.className = `ban-slot ${character ? "filled" : "empty"}`;
    if (previewBan) slot.classList.add("roulette-preview-slot");
    if (character && state.flashBan === character.name) slot.classList.add("ban-flash");

    const thumb = document.createElement("div");
    thumb.className = "ban-thumb";

    if (character) {
      thumb.appendChild(makeImage([thumbPath(character.name), legacyPath(character.name)], "", character.name));
    } else if (previewBan) {
      thumb.appendChild(makeImage([thumbPath(previewBan.name), legacyPath(previewBan.name)], "", previewBan.name));
    } else {
      const placeholder = document.createElement("span");
      placeholder.className = "ban-thumb-placeholder";
      placeholder.textContent = "?";
      thumb.appendChild(placeholder);
    }

    const label = document.createElement("div");
    label.className = "ban-slot-label";
    label.textContent = character ? character.name : previewBan ? previewBan.name : t("empty");

    slot.appendChild(thumb);
    slot.appendChild(label);
    container.appendChild(slot);
  }
}

function createCharacterMenuCard(character, turn) {
  const faction = factions[character.faction];
  const card = document.createElement("button");
  card.type = "button";
  card.className = `character-card faction-${faction.key}`;
  card.dataset.name = character.name;

  const pickedTeam = pickedTeamForCharacter(character.name);

  if (!isCharacterAvailable(character, turn)) card.classList.add("disabled");
  if (state.selected?.name === character.name) {
    card.classList.add("selected", `selected-${currentTeamClass(turn)}`);
    if (state.preselectLocked) card.classList.add("preselect-locked");
  }
  if (bannedNames().includes(character.name)) card.classList.add("banned");
  if (pickedTeam) card.classList.add("picked", `picked-team-${pickedTeam.toLowerCase()}`);
  if (state.flashBan === character.name) card.classList.add("ban-flash");
  if (state.flashPick === character.name) card.classList.add("pick-flash");
  if (state.roulette.active && state.roulette.highlightedName === character.name) card.classList.add("roulette-highlight");
  if (state.roulette.finalName === character.name) card.classList.add("roulette-winner");

  const thumbWrap = document.createElement("div");
  thumbWrap.className = "thumb-wrap";
  const fallback = document.createElement("div");
  fallback.className = "thumb-fallback";
  fallback.textContent = initials(character.name);
  thumbWrap.appendChild(fallback);
  thumbWrap.appendChild(makeImage([thumbPath(character.name), legacyPath(character.name)], "", character.name));

  const name = document.createElement("div");
  name.className = "character-name";
  name.textContent = character.name;

  const strip = document.createElement("div");
  strip.className = `faction-strip strip-${faction.key}`;

  const slash = document.createElement("div");
  slash.className = "ban-slash";

  card.appendChild(thumbWrap);
  card.appendChild(name);
  card.appendChild(strip);
  card.appendChild(slash);
  const triggerPreselect = (eventSource = "hover") => {
    if (state.roulette.active || state.locked) return;
    // Si el usuario ya fijó un personaje con click, no permitir cambiar
    // ni por hover ni por click hasta presionar la X.
    if (state.preselectLocked) return;
    preselectCharacter(character, { source: eventSource });
  };

  card.addEventListener("mouseenter", () => triggerPreselect("hover"));
  card.addEventListener("focus", () => triggerPreselect("focus"));
  card.addEventListener("click", () => {
    if (state.roulette.active || state.locked) return;
    if (!isCharacterAvailable(character)) return;

    // Si ya hay un personaje fijado, el click en otros iconos queda bloqueado.
    // Para cambiar, primero se debe presionar la X roja.
    if (state.preselectLocked) return;

    // En PC: si estaba en hover sobre este personaje, el click solo lo fija.
    // En móvil/touch: el click preselecciona y fija a la vez.
    const isTouchLike = window.matchMedia && window.matchMedia("(hover: none)").matches;
    if (!state.selected || state.selected.name !== character.name) {
      preselectCharacter(character, { source: isTouchLike ? "touch" : "click" });
    }

    state.preselectLocked = true;
    audioPlay(sounds.select, 0.72, "sfx");
    renderAll();
  });
  return card;
}

function renderCharacterGrid() {
  const turn = currentTurn();
  characterGrid.innerHTML = "";

  const rows = [
    { key: "scissors", label: "The Scissors" },
    { key: "urbino", label: "Cizallas" },
    { key: "pus", label: "P.U.S" },
  ];

  rows.forEach(rowConfig => {
    const row = document.createElement("section");
    row.className = `faction-row faction-row-${rowConfig.key}`;

    const label = document.createElement("div");
    label.className = `faction-row-label label-${rowConfig.key}`;
    label.textContent = rowConfig.label;

    const cards = document.createElement("div");
    cards.className = `faction-row-cards cards-${rowConfig.key}`;

    characters
      .filter(character => character.faction === rowConfig.key)
      .forEach(character => cards.appendChild(createCharacterMenuCard(character, turn)));

    row.appendChild(label);
    row.appendChild(cards);
    characterGrid.appendChild(row);
  });
}

function updateCharacterRouletteClasses() {
  const selectedName = state.selected?.name || null;
  const teamClass = `selected-${currentTeamClass(currentTurn())}`;
  document.querySelectorAll(".character-card").forEach(card => {
    const name = card.dataset.name;
    card.classList.toggle("roulette-highlight", state.roulette.active && state.roulette.highlightedName === name);
    card.classList.toggle("roulette-winner", Boolean(state.roulette.finalName) && state.roulette.finalName === name);
    card.classList.remove("selected-team-a", "selected-team-b", "preselect-locked");
    const isSelected = Boolean(selectedName) && selectedName === name;
    card.classList.toggle("selected", isSelected);
    if (isSelected) {
      card.classList.add(teamClass);
      if (state.preselectLocked) card.classList.add("preselect-locked");
    }
  });
}

function clearCharacterRouletteVisuals() {
  state.roulette.highlightedName = null;
  state.roulette.finalName = null;
  state.roulette.previewCharacter = null;
  updateCharacterRouletteClasses();
}

function currentRoulettePreviewCharacter(turn = currentTurn()) {
  const preview = state.roulette.active ? state.roulette.previewCharacter : null;
  if (!preview || !turn) return null;
  return isCharacterAvailable(preview, turn) ? preview : null;
}

function appendStageActionBadge(card, turn, isConfirmed = false) {
  if (!card || !turn) return;
  card.classList.add("turn-action-card", `turn-${turn.type}`, `team-${turn.team.toLowerCase()}`);
  if (isConfirmed) card.classList.add("action-confirmed");

  const badge = document.createElement("div");
  badge.className = `fullbody-action-badge action-${turn.type} team-${turn.team.toLowerCase()}`;

  const main = document.createElement("span");
  main.className = "badge-main";
  main.textContent = turn.type === "ban" ? "BAN" : "PICK";

  const sub = document.createElement("span");
  sub.className = "badge-sub";
  sub.textContent = turn.type === "ban" ? "BLOQUEADO" : "SELECCIONADO";

  badge.appendChild(main);
  badge.appendChild(sub);
  card.appendChild(badge);
}

function renderStageCharacters() {
  const stage = $("#stage-characters");
  const turn = currentTurn();
  stage.innerHTML = "";
  stage.classList.remove("is-single", "is-double");

  if (state.banAnimation?.character) {
    stage.classList.add("is-single");
    const character = state.banAnimation.character;
    const card = document.createElement("figure");
    card.className = "fullbody-card single banishing";

    const box = document.createElement("div");
    box.className = stageBoxClass(character.name);

    const frame = document.createElement("div");
    frame.className = "fullbody-frame";
    frame.appendChild(createFullbodyImage(character.name, "stage", 1));

    box.appendChild(frame);
    card.appendChild(box);
    appendStageActionBadge(card, turn || currentTurn());
    stage.appendChild(card);
    return;
  }

  if (state.pickAnimation?.character) {
    stage.classList.add("is-single");
    const character = state.pickAnimation.character;
    const card = document.createElement("figure");
    card.className = "fullbody-card single selecting selection-burst";

    const box = document.createElement("div");
    box.className = stageBoxClass(character.name);

    const frame = document.createElement("div");
    frame.className = "fullbody-frame";
    frame.appendChild(createFullbodyImage(character.name, "stage", 1));

    box.appendChild(frame);
    card.appendChild(box);
    appendStageActionBadge(card, turn || currentTurn());
    stage.appendChild(card);
    return;
  }

  if (!turn) return;

  const capacity = turn.type === "pick" ? turn.groupCount : 1;
  stage.classList.add(capacity === 2 ? "is-double" : "is-single");
  let shownCharacters = [];
  const groupPicks = turn.type === "pick" ? (state.pickBatchSelections[turn.groupId] || []) : [];

  const roulettePreview = currentRoulettePreviewCharacter(turn);

  if (turn.type === "pick") {
    shownCharacters = [...groupPicks];
    if (roulettePreview) {
      shownCharacters.push(roulettePreview);
    } else if (state.selected && isCharacterAvailable(state.selected, turn)) {
      shownCharacters.push(state.selected);
    }
  } else if (roulettePreview) {
    shownCharacters = [roulettePreview];
  } else if (state.selected && isCharacterAvailable(state.selected, turn)) {
    shownCharacters = [state.selected];
  }

  for (let i = 0; i < capacity; i += 1) {
    const character = shownCharacters[i];
    if (!character) {
      const empty = document.createElement("div");
      empty.className = "fullbody-empty";
      empty.dataset.stageSlot = String(i);
      empty.textContent = "";
      stage.appendChild(empty);
      continue;
    }

    const card = document.createElement("figure");
    card.className = `fullbody-card ${capacity === 1 ? "single" : "double"} idle-fullbody`;
    card.dataset.stageSlot = String(i);

    const isAlreadyConfirmedInThisBatch = groupPicks.some(pick => pick.name === character.name);
    if (isAlreadyConfirmedInThisBatch) card.classList.add("locked-picked");
    if (roulettePreview && character.name === roulettePreview.name) card.classList.add("roulette-preview-fullbody");

    const box = document.createElement("div");
    box.className = stageBoxClass(character.name);

    const frame = document.createElement("div");
    frame.className = "fullbody-frame";
    frame.appendChild(
      createFullbodyImage(character.name, "stage", capacity),
    );

    box.appendChild(frame);
    card.appendChild(box);
    appendStageActionBadge(card, turn, isAlreadyConfirmedInThisBatch);
    stage.appendChild(card);
  }
}

function ensureClearPreselectionButton() {
  const confirmButton = $("#confirm-action");
  if (!confirmButton) return null;

  let button = document.getElementById("clear-preselection");
  if (!button) {
    button = document.createElement("button");
    button.id = "clear-preselection";
    button.type = "button";
    button.className = "clear-preselection-button hidden";
    button.textContent = "×";
    button.title = "Deseleccionar personaje";
    button.setAttribute("aria-label", "Deseleccionar personaje");
    button.addEventListener("click", () => clearPreselection());
    confirmButton.insertAdjacentElement("afterend", button);
  }
  return button;
}

function clearPreselection() {
  if (state.locked || state.roulette.active) return;
  state.selected = null;
  state.preselectLocked = false;
  audioPlay(sounds.select, 0.52, "sfx");
  renderAll();
}

function renderSelected() {
  const button = $("#confirm-action");
  const turn = currentTurn();
  const statusName = $("#status-character-name");
  const statusFaction = $("#status-character-faction");

  if (!button || !turn) return;
  const clearButton = ensureClearPreselectionButton();

  const selectedCharacter = state.selected && isCharacterAvailable(state.selected, turn) ? state.selected : null;

  if (statusName) statusName.textContent = selectedCharacter ? selectedCharacter.name.toUpperCase() : t("none");
  if (statusFaction) statusFaction.textContent = selectedCharacter ? `${factions[selectedCharacter.faction].label} · ${roleOf(selectedCharacter.name)}` : t("no_selection");

  if (!selectedCharacter) {
    button.classList.add("hidden");
    if (clearButton) clearButton.classList.add("hidden");
    return;
  }

  button.classList.remove("hidden", "ban");
  if (clearButton) clearButton.classList.toggle("hidden", !state.preselectLocked);

  if (turn.type === "ban") {
    button.textContent = t("ban");
    button.classList.add("ban");
  } else {
    button.textContent = t("select");
  }
}

function renderTurnInfo() {
  const turn = currentTurn();
  const phaseLabel = $("#phase-label");
  const turnLabel = $("#turn-label");
  const restriction = $("#current-restriction");
  const batchIndicator = $("#batch-indicator");
  const dockTitle = $("#dock-title");
  const scoreA = $("#score-a");
  const scoreB = $("#score-b");
  const statusPhase = $("#status-phase");
  const statusTurn = $("#status-turn");
  const statusPanel = $("#phase-status-panel");
  const redRibbon = document.querySelector('.red-ribbon');
  const blueRibbon = document.querySelector('.blue-ribbon');
  const teamColumnA = document.querySelector('.team-column-a');
  const teamColumnB = document.querySelector('.team-column-b');

  scoreA.textContent = String(state.picks.A.length).padStart(2, "0");
  scoreB.textContent = String(state.picks.B.length).padStart(2, "0");

  turnLabel.classList.remove("team-a-active", "team-b-active");
  redRibbon?.classList.remove("active-team");
  blueRibbon?.classList.remove("active-team");
  teamColumnA?.classList.remove("team-panel-active", "team-panel-inactive", "team-panel-active-a", "team-panel-active-b");
  teamColumnB?.classList.remove("team-panel-active", "team-panel-inactive", "team-panel-active-a", "team-panel-active-b");
  statusPanel?.classList.remove("status-team-a", "status-team-b");

  if (!turn) return;

  turnLabel.classList.add(turn.team === "A" ? "team-a-active" : "team-b-active");
  if (turn.team === "A") {
    redRibbon?.classList.add("active-team");
    teamColumnA?.classList.add("team-panel-active", "team-panel-active-a");
    teamColumnB?.classList.add("team-panel-inactive");
    statusPanel?.classList.add("status-team-a");
  } else {
    blueRibbon?.classList.add("active-team");
    teamColumnB?.classList.add("team-panel-active", "team-panel-active-b");
    teamColumnA?.classList.add("team-panel-inactive");
    statusPanel?.classList.add("status-team-b");
  }

  if (turn.type === "ban") {
    const roundText = t("ban_round", { current: state.turnIndex + 1, total: banTurns.length });
    phaseLabel.textContent = t("block_character");
    turnLabel.textContent = t("team_blocks", { team: turn.team });
    restriction.textContent = `${t("team_blocks", { team: turn.team })}: ${factions[turn.faction].label}.`;
    batchIndicator.textContent = roundText;
    dockTitle.textContent = "";
    if (statusPhase) statusPhase.textContent = `${t("phase_ban")} · ${roundText}`;
    if (statusTurn) statusTurn.textContent = t("team_blocks", { team: turn.team });
  } else {
    const pickNumber = state.picks[turn.team].length + 1;
    const playerName = state.players[turn.team][pickNumber - 1];
    const roundText = t("pick_round", { team: turn.team, current: turn.groupSlot + 1, total: turn.groupCount });
    phaseLabel.textContent = t("pick_character");
    turnLabel.textContent = t("team_picks_player", { team: turn.team, player: playerName });
    restriction.textContent = t("team_can_pick", { team: turn.team, factions: getAllowedFactionKeysForPick(turn.team).map(key => factions[key].label).join(t("and_or")) });
    batchIndicator.textContent = roundText;
    dockTitle.textContent = "";
    if (statusPhase) statusPhase.textContent = `${t("phase_pick")} · ${roundText}`;
    if (statusTurn) statusTurn.textContent = t("team_picks", { team: turn.team });
  }
}

function renderAll() {
  renderTurnInfo();
  renderSlots();
  renderBans();
  renderStageCharacters();
  renderCharacterGrid();
  renderSelected();
}

function preselectCharacter(character, options = {}) {
  if (state.locked) return;
  if (!isCharacterAvailable(character)) return;

  const source = options.source || "hover";
  if (state.preselectLocked) return;

  const previousName = state.selected?.name || null;
  if (previousName === character.name) return;

  state.selected = character;
  if (source === "touch" || source === "click") state.preselectLocked = true;

  const hoverVolume = source === "hover" ? 0.45 : 0.7;
  audioPlay(sounds.select, hoverVolume, "sfx");
  renderAll();
}

function resetTimer() {
  clearInterval(state.timerId);
  state.timer = state.turnDuration;
  state.lastWarningSecond = null;
  $("#timer").textContent = formatTimer(state.timer);
  timerCore.classList.remove("timer-warning");

  state.timerId = setInterval(() => {
    state.timer -= 1;
    $("#timer").textContent = formatTimer(state.timer);

    if (state.timer <= 5 && state.timer > 0) {
      timerCore.classList.add("timer-warning");
      if (state.lastWarningSecond !== state.timer) {
        state.lastWarningSecond = state.timer;
        audioPlay(sounds.warning, 0.72, "sfx");
      }
    }

    if (state.timer <= 0) {
      clearInterval(state.timerId);
      timerCore.classList.remove("timer-warning");
      if (state.settings.autoResolveEnabled) {
        autoResolveTurn();
      } else {
        const valid = getValidCharacters();
        if ((!state.selected || !isCharacterAvailable(state.selected)) && valid.length) {
          state.selected = valid[Math.floor(Math.random() * valid.length)];
        }
        const restriction = $("#current-restriction");
        if (restriction) restriction.textContent = t("time_over_manual");
        renderAll();
      }
    }
  }, 1000);
}

function getValidCharacters() {
  return characters.filter(character => isCharacterAvailable(character));
}

function delay(ms) {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

function weightedRandomDelay(step, total) {
  const progress = step / Math.max(1, total - 1);
  return 42 + Math.round(165 * progress * progress);
}

function updateCharacterRoulettePreview(character) {
  state.roulette.previewCharacter = character || null;
  updateCharacterRouletteClasses();
  renderStageCharacters();
  renderSlots();
  renderBans();
  renderSelected();
}

async function runCharacterRoulette(validCharacters) {
  const valid = validCharacters.filter(Boolean);
  if (!valid.length) return null;

  state.roulette.active = true;
  state.roulette.finalName = null;
  state.roulette.highlightedName = null;
  state.roulette.previewCharacter = null;
  state.locked = true;

  // Evita el “tick” visual: durante la ruleta ya no se re-renderiza todo el draft.
  // Solo se actualizan clases del grid existente para que las imágenes no se recarguen ni salten.
  updateCharacterRouletteClasses();

  const totalSteps = 28 + Math.floor(Math.random() * 9);
  let selected = randomFrom(valid);
  for (let step = 0; step < totalSteps; step += 1) {
    selected = randomFrom(valid);
    state.roulette.highlightedName = selected.name;
    audioPlay(sounds.roulette, 0.82, "sfx");
    updateCharacterRoulettePreview(selected);
    await delay(weightedRandomDelay(step, totalSteps));
  }

  audioPlay(sounds.select, 0.7, "sfx");

  state.roulette.highlightedName = selected.name;
  state.roulette.finalName = selected.name;
  state.selected = selected;
  updateCharacterRoulettePreview(selected);
  await delay(520);

  state.roulette.active = false;
  clearCharacterRouletteVisuals();
  renderStageCharacters();
  renderSlots();
  renderBans();
  renderSelected();
  return selected;
}

async function autoResolveTurn() {
  if (state.locked || state.roulette.active) return;
  const valid = getValidCharacters();

  // Primero se reproduce la línea "Tiempo agotado".
  // Después de 2 segundos empieza la ruleta visual + audio roulette.
  state.locked = true;
  playNarration(systemDraftVoiceLines.random_start.src, "", 0.9);
  await delay(2000);

  const selected = await runCharacterRoulette(valid);
  if (!selected) {
    state.turnIndex += 1;
    state.locked = false;
    startTurn();
    return;
  }

  state.locked = false;
  state.selected = selected;
  confirmTurn(true);
}

function proceedAfterTurn() {
  if (state.turnIndex >= turns.length) {
    startMapSelection();
    return;
  }

  const nextTurn = currentTurn();
  const justEnteredPickPhase = state.turnIndex === banTurns.length;
  if (justEnteredPickPhase && nextTurn.type === "pick") {
    showPhaseOverlay(
      t("phase_pick"),
      systemDraftVoiceLines.voice_pick_phase.src,
      systemDraftVoiceLines.voice_pick_phase.text,
      startTurn,
    );
  } else {
    startTurn();
  }
}

function confirmTurn(isAuto = false) {
  const turn = currentTurn();
  if (!turn || state.locked) return;
  if (!state.selected || !isCharacterAvailable(state.selected, turn)) return;

  state.locked = true;
  clearInterval(state.timerId);
  timerCore.classList.remove("timer-warning");

  const confirmedCharacter = state.selected;
  let wait = isAuto ? 650 : 520;

  if (turn.type === "ban") {
    state.bans[turn.team].push(confirmedCharacter);
    state.flashBan = confirmedCharacter.name;
    state.banAnimation = { character: confirmedCharacter, team: turn.team };
    audioPlay(sounds.ban, 0.86, "sfx");
    playCharacterVoice(confirmedCharacter, "ban");
    wait = isAuto ? 1350 : 1500;
  } else {
    state.picks[turn.team].push(confirmedCharacter);
    state.flashPick = confirmedCharacter.name;
    if (!state.pickBatchSelections[turn.groupId]) state.pickBatchSelections[turn.groupId] = [];
    state.pickBatchSelections[turn.groupId].push(confirmedCharacter);
    if (state.settings.selectionAnimationEnabled) {
      state.pickAnimation = { character: confirmedCharacter, team: turn.team };
    }
    audioPlay(sounds.confirm, 0.86, "sfx");
    playCharacterVoice(confirmedCharacter, "pick");
    wait = isAuto ? 1250 : 1400;
  }

  wait = Math.round(wait * (state.settings.animationDuration || 1));
  renderAll();

  window.setTimeout(() => {
    state.flashBan = null;
    state.flashPick = null;
    state.banAnimation = null;
    state.pickAnimation = null;
    state.selected = null;
    state.preselectLocked = false;
    state.turnIndex += 1;
    proceedAfterTurn();
  }, wait);
}

function turnVoiceKey(turn) {
  if (!turn) return "";
  if (turn.type === "pick") return "pick";

  if (turn.type === "ban") {
    const banIndex = banTurns.indexOf(turn);
    // Orden solicitado:
    // Bloqueo 1: TEAM A => team_a_ban
    // Bloqueo 2: TEAM B => team_b_ban
    // Bloqueo 3: TEAM A => team_a_ban_scissors
    // Bloqueo 4: TEAM B => team_b_ban_scissors
    return banIndex >= 2 ? "ban_scissors" : "ban";
  }

  return "ban";
}

function turnNarrationText(turn) {
  if (!turn) return "";
  const key = turnVoiceKey(turn);
  if (turn.team === "A" && key === "ban_scissors") return systemDraftVoiceLines.team_a_ban_scissors.text;
  if (turn.team === "B" && key === "ban_scissors") return systemDraftVoiceLines.team_b_ban_scissors.text;
  if (turn.team === "A" && key === "ban") return systemDraftVoiceLines.team_a_ban.text;
  if (turn.team === "B" && key === "ban") return systemDraftVoiceLines.team_b_ban.text;
  if (turn.team === "A" && key === "pick") return systemDraftVoiceLines.team_a_pick.text;
  if (turn.team === "B" && key === "pick") return systemDraftVoiceLines.team_b_pick.text;
  return "";
}

function playTurnNarration(turn) {
  if (!turn) return;
  const key = turnVoiceKey(turn);
  const src = turnVoices[turn.team]?.[key];
  // Las voces de turno deben reproducir archivos reales en audio/turns/.
  // No usamos speechSynthesis aquí para evitar que suene la voz default si falta el audio.
  playNarration(src, "", 0.88);
}

function startTurn() {
  state.selected = null;
  state.preselectLocked = false;
  state.locked = false;
  document.body.classList.remove("overlay-lock");
  renderAll();
  playTurnNarration(currentTurn());
  resetTimer();
}

function ensureDraftStartStyle() {
  if (document.getElementById("draft-start-style")) return;
  const style = document.createElement("style");
  style.id = "draft-start-style";
  style.textContent = `
    #start-draft.starting-draft {
      color: #fff !important;
      background: linear-gradient(135deg, #ff6878 0%, #d4223d 48%, #650914 100%) !important;
      border-color: rgba(255, 126, 142, 0.72) !important;
      box-shadow:
        0 0 0 1px rgba(255,255,255,0.14) inset,
        0 0 28px rgba(255, 74, 95, 0.42),
        0 18px 42px rgba(0,0,0,0.36) !important;
      text-shadow: 0 0 12px rgba(255,255,255,0.32) !important;
      animation: startingDraftPulse 0.85s ease-in-out infinite alternate !important;
      pointer-events: none !important;
      opacity: 1 !important;
    }
    @keyframes startingDraftPulse {
      from { filter: brightness(1); transform: translateY(0) scale(1); }
      to { filter: brightness(1.16); transform: translateY(-1px) scale(1.012); }
    }
  `;
  document.head.appendChild(style);
}

function setStartDraftLoading(isLoading) {
  const button = $("#start-draft");
  if (!button) return;
  ensureDraftStartStyle();
  if (isLoading) {
    if (!button.dataset.originalText) button.dataset.originalText = button.textContent || t("start_draft");
    button.textContent = "INICIANDO";
    button.classList.add("starting-draft");
    button.disabled = true;
  } else {
    button.classList.remove("starting-draft");
    button.disabled = false;
    button.textContent = button.dataset.originalText || t("start_draft");
  }
}

function resetDraftStateBeforeStart() {
  readPlayers();
  state.picks = { A: [], B: [] };
  state.bans = { A: [], B: [] };
  state.pickBatchSelections = {};
  state.turnIndex = 0;
  state.selected = null;
  state.preselectLocked = false;
  state.locked = false;
  state.flashBan = null;
  state.flashPick = null;
  state.banAnimation = null;
  state.pickAnimation = null;
  state.roulette = { active: false, highlightedName: null, finalName: null, previewCharacter: null };
  state.selectedMap = null;
  state.mapRoulette = { active: false, highlightedId: null, finalId: null };
}

async function waitForUiSoundAndContinue(milliseconds = 250) {
  await delay(milliseconds);
}

async function startDraft() {
  if (state.startingDraft) return;
  state.startingDraft = true;

  setStartDraftLoading(true);
  await playUiSound(sounds.startDraft, 1);

  // Mantiene el menú visible unos segundos para que el efecto de sonido se escuche
  // y la transición no se sienta brusca.
  await delay(5000);

  resetDraftStateBeforeStart();
  setStartDraftLoading(false);
  state.startingDraft = false;

  switchScreen(draftScreen);
  setupBackgroundVideo();
  startMusic("draft");
  showPhaseOverlay(
    t("phase_ban"),
    systemDraftVoiceLines.voice_ban_phase.src,
    systemDraftVoiceLines.voice_ban_phase.text,
    startTurn,
  );
}

function renderSummaryLineup(team, container) {
  container.innerHTML = "";
  state.picks[team].forEach(character => {
    const item = document.createElement("div");
    item.className = `summary-fullbody summary-${slugName(character.name).toLowerCase()}`;
    item.appendChild(createFullbodyImage(character.name, "summary"));
    container.appendChild(item);
  });
}

function renderSummaryTeam(team, container) {
  container.innerHTML = "";
  state.picks[team].forEach((character, index) => {
    const item = document.createElement("div");
    item.className = "summary-pick";

    const thumb = document.createElement("div");
    thumb.className = "summary-thumb";
    thumb.appendChild(makeImage([thumbPath(character.name), legacyPath(character.name)], "", character.name));

    const details = document.createElement("div");
    const player = document.createElement("strong");
    player.textContent = state.players[team][index];
    const pick = document.createElement("span");
    pick.textContent = `${character.name} · ${factions[character.faction].label} · ${roleOf(character.name)}`;
    details.appendChild(player);
    details.appendChild(pick);

    if (team === "B") {
      item.appendChild(details);
      item.appendChild(thumb);
    } else {
      item.appendChild(thumb);
      item.appendChild(details);
    }

    container.appendChild(item);
  });
}

function renderSummaryBans(team, container) {
  container.innerHTML = "";
  state.bans[team].forEach(character => {
    const pill = document.createElement("span");
    pill.className = `ban-pill faction-${character.faction}`;

    const swatch = document.createElement("span");
    swatch.className = `ban-faction-swatch faction-${character.faction}`;

    const thumb = document.createElement("span");
    thumb.className = "ban-thumb";
    thumb.appendChild(makeImage([thumbPath(character.name), legacyPath(character.name)], "", character.name));

    const label = document.createElement("span");
    label.textContent = `${character.name} · ${factions[character.faction].label}`;

    pill.appendChild(swatch);
    pill.appendChild(thumb);
    pill.appendChild(label);
    container.appendChild(pill);
  });
}

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function shuffle(list) {
  return [...list].sort(() => Math.random() - 0.5);
}

function simulateRandomSummary() {
  const available = [...characters];
  const takeOne = (predicate) => {
    const choices = available.filter(predicate);
    if (!choices.length) return null;
    const chosen = randomFrom(choices);
    const index = available.findIndex(item => item.name === chosen.name);
    if (index >= 0) available.splice(index, 1);
    return chosen;
  };

  const bansA = [];
  const bansB = [];
  const picksA = [];
  const picksB = [];

  const aBan1 = takeOne(c => c.faction === "pus"); if (aBan1) bansA.push(aBan1);
  const bBan1 = takeOne(c => c.faction === "scissors"); if (bBan1) bansB.push(bBan1);
  const aBan2 = takeOne(c => c.faction === "urbino"); if (aBan2) bansA.push(aBan2);
  const bBan2 = takeOne(c => c.faction === "urbino"); if (bBan2) bansB.push(bBan2);

  const pickForA = () => takeOne(c => c.faction === "scissors" || c.faction === "urbino");
  const pickForB = () => takeOne(c => c.faction === "pus" || c.faction === "urbino");

  while (picksA.length < 5) { const c = pickForA(); if (!c) break; picksA.push(c); }
  while (picksB.length < 5) { const c = pickForB(); if (!c) break; picksB.push(c); }

  state.bans.A = bansA;
  state.bans.B = bansB;
  state.picks.A = picksA;
  state.picks.B = picksB;
  state.selectedMap = randomFrom(maps);
  finishDraft();
}

async function cancelDraft() {
  if (state.returningToConfig) return;
  state.returningToConfig = true;
  await playUiSound(sounds.backConfig, 1);

  // Pequeña espera para que el sonido de volver no se corte con el cambio de pantalla.
  await waitForUiSoundAndContinue(420);

  clearInterval(state.timerId);
  state.locked = false;
  state.selected = null;
  state.flashBan = null;
  state.flashPick = null;
  state.banAnimation = null;
  state.pickAnimation = null;
  state.roulette = { active: false, highlightedName: null, finalName: null, previewCharacter: null };
  state.mapRoulette = { active: false, highlightedId: null, finalId: null };
  state.selectedMap = null;
  state.pickBatchSelections = {};
  state.picks = { A: [], B: [] };
  state.bans = { A: [], B: [] };
  state.turnIndex = 0;
  state.timer = state.turnDuration;
  state.lastWarningSecond = null;
  document.body.classList.remove("overlay-lock");
  activateSetupTab("menu");
  switchScreen(setupScreen);
  renderAll();
  state.returningToConfig = false;
}

function mapImagePath(map) {
  return map?.image || "img/maps/map_1.png";
}

function updateMapRouletteClasses() {
  if (!mapGrid) return;
  mapGrid.querySelectorAll(".map-card").forEach(card => {
    const id = card.dataset.mapId;
    card.classList.toggle("map-roulette-highlight", state.mapRoulette.active && state.mapRoulette.highlightedId === id);
    card.classList.toggle("map-selected", state.mapRoulette.finalId === id || state.selectedMap?.id === id);
  });
}

function clearMapRouletteVisuals() {
  state.mapRoulette.highlightedId = null;
  updateMapRouletteClasses();
}

function renderMapGrid() {
  if (!mapGrid) return;
  mapGrid.innerHTML = "";

  maps.forEach(map => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "map-card";
    card.dataset.mapId = map.id;

    if (state.mapRoulette.active && state.mapRoulette.highlightedId === map.id) card.classList.add("map-roulette-highlight");
    if (state.mapRoulette.finalId === map.id || state.selectedMap?.id === map.id) card.classList.add("map-selected");

    const image = document.createElement("div");
    image.className = "map-card-image";
    image.appendChild(makeImage([mapImagePath(map)], "", map.name));
    const imageFallback = document.createElement("span");
    imageFallback.textContent = t("map");
    image.appendChild(imageFallback);

    const name = document.createElement("strong");
    name.textContent = map.name;

    card.appendChild(image);
    card.appendChild(name);
    card.addEventListener("click", () => {
      if (state.mapRoulette.active) return;
      state.selectedMap = map;
      state.mapRoulette.finalId = map.id;
      audioPlay(sounds.confirm, 0.86, "sfx");
      renderMapGrid();
      updateSelectedMapCopy();
      showSummaryIntro();
    });
    mapGrid.appendChild(card);
  });
}

function updateSelectedMapCopy() {
  if (selectedMapName) selectedMapName.textContent = state.selectedMap?.name || t("waiting_selection");
}

async function runMapRoulette() {
  if (state.mapRoulette.active || !maps.length) return;
  state.mapRoulette.active = true;
  state.mapRoulette.finalId = null;
  state.mapRoulette.highlightedId = null;

  // Evita el tick visual de mapas: no se reconstruye el grid en cada paso.
  // Solo se cambia la clase del mapa resaltado.
  updateMapRouletteClasses();

  const totalSteps = 24 + Math.floor(Math.random() * 8);
  let selected = randomFrom(maps);
  for (let step = 0; step < totalSteps; step += 1) {
    selected = randomFrom(maps);
    state.mapRoulette.highlightedId = selected.id;
    audioPlay(sounds.mapRoulette || sounds.roulette, 0.82, "sfx");
    updateMapRouletteClasses();
    await delay(weightedRandomDelay(step, totalSteps));
  }

  audioPlay(sounds.confirm, 0.86, "sfx");

  state.selectedMap = selected;
  state.mapRoulette.highlightedId = selected.id;
  state.mapRoulette.finalId = selected.id;
  updateMapRouletteClasses();
  updateSelectedMapCopy();
  await delay(980);

  state.mapRoulette.active = false;
  clearMapRouletteVisuals();
  showSummaryIntro();
}

function startMapSelection() {
  clearInterval(state.timerId);
  state.locked = true;
  state.selected = null;
  state.flashBan = null;
  state.flashPick = null;
  state.banAnimation = null;
  state.pickAnimation = null;
  state.roulette = { active: false, highlightedName: null, finalName: null, previewCharacter: null };
  state.mapRoulette = { active: false, highlightedId: null, finalId: null };
  switchScreen(mapScreen);
  mapScreen?.classList.remove("map-enter");
  void mapScreen?.offsetWidth;
  mapScreen?.classList.add("map-enter");
  renderMapGrid();
  updateSelectedMapCopy();
  window.setTimeout(() => runMapRoulette(), 900);
}

function renderSummaryMap() {
  if (!summaryMapCard) return;
  const map = state.selectedMap;
  summaryMapCard.classList.toggle("has-map", Boolean(map));
  const imageBox = summaryMapCard.querySelector(".summary-map-image");
  if (imageBox) {
    imageBox.innerHTML = "";
    if (map) {
      imageBox.appendChild(makeImage([mapImagePath(map)], "", map.name));
      const fallback = document.createElement("span");
      fallback.textContent = t("map");
      imageBox.appendChild(fallback);
    } else {
      const fallback = document.createElement("span");
      fallback.textContent = t("map");
      imageBox.appendChild(fallback);
    }
  }
  if (summaryMapName) summaryMapName.textContent = map?.name || t("no_map");
}

function showSummaryIntro() {
  showPhaseOverlay(
    t("summary_final"),
    "",
    state.selectedMap ? t("summary_map_selected", { map: state.selectedMap.name }) : t("summary_prepare"),
    finishDraft,
  );
}

function finishDraft() {
  clearInterval(state.timerId);
  state.locked = false;
  document.body.classList.remove("overlay-lock");
  renderSummaryLineup("A", $("#summary-lineup-a"));
  renderSummaryLineup("B", $("#summary-lineup-b"));
  renderSummaryTeam("A", $("#summary-team-a"));
  renderSummaryTeam("B", $("#summary-team-b"));
  renderSummaryBans("A", $("#summary-bans-a"));
  renderSummaryBans("B", $("#summary-bans-b"));
  renderSummaryMap();
  switchScreen(summaryScreen);
  summaryScreen?.classList.remove("summary-enter");
  void summaryScreen?.offsetWidth;
  summaryScreen?.classList.add("summary-enter");
}

async function restartDraft() {
  if (state.returningToConfig) return;
  state.returningToConfig = true;
  await playUiSound(sounds.backConfig, 1);
  await waitForUiSoundAndContinue(420);

  clearInterval(state.timerId);
  state.locked = false;
  state.banAnimation = null;
  state.pickAnimation = null;
  state.roulette = { active: false, highlightedName: null, finalName: null, previewCharacter: null };
  state.mapRoulette = { active: false, highlightedId: null, finalId: null };
  state.selectedMap = null;
  document.body.classList.remove("overlay-lock");
  activateSetupTab("menu");
  switchScreen(setupScreen);
  state.returningToConfig = false;
}

function init() {
  applyDraftFullbodyBoxLayout();
  resizeGameRoot();
  window.addEventListener("resize", resizeGameRoot);
  setupInputs();
  setupConfigControls();
  applyLanguage(state.settings.language);
  setupDevelopmentTools();
  setupBackgroundVideo();
  startMusic("menu");
  renderAll();
  $("#start-draft").addEventListener("click", startDraft);
  $("#confirm-action").addEventListener("click", () => confirmTurn(false));
  $("#music-toggle").addEventListener("click", toggleMusic);
  cancelDraftButton?.addEventListener("click", cancelDraft);
  $("#restart-draft").addEventListener("click", restartDraft);
  simulateSummaryButton?.addEventListener("click", simulateRandomSummary);
  randomPlayerNamesButton?.addEventListener("click", applyRandomPlayerNames);
  manualPlayerNamesButton?.addEventListener("click", applyManualPlayerNames);
  randomizeMapButton?.addEventListener("click", runMapRoulette);
}

init();
