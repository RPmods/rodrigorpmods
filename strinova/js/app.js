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

const TEAM_SIZE_OPTIONS = [2, 3, 4, 5];
const DEFAULT_DRAFT_CONFIG = {
  mode: "classic",
  teamSize: 5,
  bansEnabled: true,
};

const baseBanTurns = [
  { type: "ban", team: "A", faction: "pus", text: "TEAM A bloquea un personaje de P.U.S", banIndex: 0, slotIndex: 0, advancedSlotKey: "captain" },
  { type: "ban", team: "B", faction: "scissors", text: "TEAM B bloquea un personaje de The Scissors", banIndex: 1, slotIndex: 0, advancedSlotKey: "captain" },
  { type: "ban", team: "A", faction: "urbino", text: "TEAM A bloquea un personaje de Cizallas", banIndex: 2, slotIndex: 1, advancedSlotKey: "subcaptain" },
  { type: "ban", team: "B", faction: "urbino", text: "TEAM B bloquea un personaje de Cizallas", banIndex: 3, slotIndex: 1, advancedSlotKey: "subcaptain" },
];

const ADVANCED_SLOT_KEYS = ["captain", "subcaptain", "player3", "player4", "player5"];

function advancedSlotsForTeamSize(teamSize = DEFAULT_DRAFT_CONFIG.teamSize) {
  const size = TEAM_SIZE_OPTIONS.includes(Number(teamSize)) ? Number(teamSize) : DEFAULT_DRAFT_CONFIG.teamSize;
  return ADVANCED_SLOT_KEYS.slice(0, size);
}

function advancedSlotIndex(slotKey) {
  const index = ADVANCED_SLOT_KEYS.indexOf(slotKey);
  return index >= 0 ? index : 0;
}

function advancedSlotLabel(slotKey) {
  if (slotKey === "captain") return "Capitán";
  if (slotKey === "subcaptain") return "Subcapitán";
  const match = String(slotKey || "").match(/player(\d+)/i);
  return match ? `Jugador ${match[1]}` : "Jugador";
}

function advancedSlotLabelLong(team, slotKey) {
  const teamText = team === "B" ? "TEAM B · DEFENSORES" : "TEAM A · ATACANTES";
  return `${advancedSlotLabel(slotKey)} · ${teamText}`;
}

function isAdvancedDraftConfig(config = currentDraftConfig()) {
  return sanitizeDraftConfig(config).mode === "advanced";
}

function emptyAdvancedSlots(teamSize = DEFAULT_DRAFT_CONFIG.teamSize) {
  const slots = { A: {}, B: {} };
  advancedSlotsForTeamSize(teamSize).forEach(slotKey => {
    slots.A[slotKey] = null;
    slots.B[slotKey] = null;
  });
  return slots;
}

function sanitizeDraftConfig(config = {}) {
  const requestedSize = Number(config.teamSize);
  const teamSize = TEAM_SIZE_OPTIONS.includes(requestedSize) ? requestedSize : DEFAULT_DRAFT_CONFIG.teamSize;
  const mode = String(config.mode || DEFAULT_DRAFT_CONFIG.mode).toLowerCase() === "advanced" ? "advanced" : "classic";
  return {
    mode,
    teamSize,
    bansEnabled: typeof config.bansEnabled === "boolean" ? config.bansEnabled : DEFAULT_DRAFT_CONFIG.bansEnabled,
  };
}

function pickGroupsForTeamSize(teamSize = DEFAULT_DRAFT_CONFIG.teamSize) {
  const size = TEAM_SIZE_OPTIONS.includes(Number(teamSize)) ? Number(teamSize) : DEFAULT_DRAFT_CONFIG.teamSize;
  if (size === 2) return [
    { team: "A", count: 1 },
    { team: "B", count: 2 },
    { team: "A", count: 1 },
  ];
  if (size === 3) return [
    { team: "A", count: 1 },
    { team: "B", count: 2 },
    { team: "A", count: 2 },
    { team: "B", count: 1 },
  ];
  if (size === 4) return [
    { team: "A", count: 1 },
    { team: "B", count: 2 },
    { team: "A", count: 2 },
    { team: "B", count: 2 },
    { team: "A", count: 1 },
  ];
  return [
    { team: "A", count: 1 },
    { team: "B", count: 2 },
    { team: "A", count: 2 },
    { team: "B", count: 2 },
    { team: "A", count: 2 },
    { team: "B", count: 1 },
  ];
}

function buildBanTurns(config = DEFAULT_DRAFT_CONFIG) {
  const normalized = sanitizeDraftConfig(config);
  if (!normalized.bansEnabled) return [];
  return baseBanTurns.map(turn => ({
    ...turn,
    slotKey: normalized.mode === "advanced" ? turn.advancedSlotKey : null,
    advanced: normalized.mode === "advanced",
  }));
}

function buildPickTurns(config = DEFAULT_DRAFT_CONFIG) {
  const normalized = sanitizeDraftConfig(config);

  if (normalized.mode === "advanced") {
    const slotKeys = advancedSlotsForTeamSize(normalized.teamSize);
    return slotKeys.flatMap((slotKey, index) => ([
      { type: "pick", team: "A", groupId: index, groupCount: 1, groupSlot: 0, slotIndex: index, slotKey, advanced: true },
      { type: "pick", team: "B", groupId: index, groupCount: 1, groupSlot: 0, slotIndex: index, slotKey, advanced: true },
    ]));
  }

  const counters = { A: 0, B: 0 };
  return pickGroupsForTeamSize(normalized.teamSize).flatMap((group, groupId) => {
    return Array.from({ length: group.count }, (_, slot) => {
      const slotIndex = counters[group.team];
      counters[group.team] += 1;
      return {
        type: "pick",
        team: group.team,
        groupId,
        groupCount: group.count,
        groupSlot: slot,
        slotIndex,
        slotKey: null,
        advanced: false,
      };
    });
  });
}

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


const narrationVoiceSystemOptions = {
  amberly_graves: {
    label: "Voz ES(LA) Amberly Graves - diálogos completos (predeterminado)",
    folder: "Amberly_Graves",
    type: "recorded",
    language: "es",
    disabled: false,
    publicAvailable: true,
    complete: true,
  },
  wizzsv: {
    label: "Voz ES(LA) Wizz - diálogos incompletos",
    folder: "wizzsv",
    type: "recorded",
    language: "es",
    disabled: false,
    publicAvailable: true,
    complete: false,
  },
  bot_es: {
    label: "Voz ES(ES) Lectura de bot (Español)",
    type: "tts",
    speechLang: "es-ES",
    language: "es",
    disabled: false,
    publicAvailable: true,
    complete: true,
  },
  bot_en: {
    label: "Voz EN(US) Bot reading (English)",
    type: "tts",
    speechLang: "en-US",
    language: "en",
    disabled: false,
    publicAvailable: true,
    complete: true,
  },
  bot_pt: {
    label: "Voz PT(PT) Lectura de bot (Portugués)",
    type: "tts",
    speechLang: "pt-PT",
    language: "pt",
    disabled: false,
    publicAvailable: true,
    complete: true,
  },
  bot_ja: {
    label: "Voz JA(JP) ボット読み上げ (日本語)",
    type: "tts",
    speechLang: "ja-JP",
    language: "ja",
    disabled: false,
    publicAvailable: true,
    complete: true,
  },
  bot_ru: {
    label: "Voz RU(RU) Чтение ботом (Русский)",
    type: "tts",
    speechLang: "ru-RU",
    language: "ru",
    disabled: false,
    publicAvailable: true,
    complete: true,
  },
  bot_zh: {
    label: "Voz ZH(CN) 机器人朗读 (中文)",
    type: "tts",
    speechLang: "zh-CN",
    language: "zh",
    disabled: false,
    publicAvailable: true,
    complete: true,
  },
  rodrigorpmods_es: {
    label: "Voz ES(LA) RodrigoRPmods - no disponible en la versión pública",
    folder: "RodrigoRPmods_ESLA",
    type: "recorded",
    language: "es",
    disabled: true,
    publicAvailable: false,
    complete: false,
  },
  rodrigorpmods_en: {
    label: "Voz EN(ENG) RodrigoRPmods - no disponible en la versión pública",
    folder: "RodrigoRPmods_ENG",
    type: "recorded",
    language: "en",
    disabled: true,
    publicAvailable: false,
    complete: false,
  },
  rodrigorpmods_ja: {
    label: "Voz JA(JAP) RodrigoRPmods - no disponible en la versión pública",
    folder: "RodrigoRPmods_JAP",
    type: "recorded",
    language: "ja",
    disabled: true,
    publicAvailable: false,
    complete: false,
  },
};

const narrationDefaultVoiceByLanguage = {
  es: "amberly_graves",
  en: "bot_en",
  pt: "bot_pt",
  ja: "bot_ja",
  ru: "bot_ru",
  zh: "bot_zh",
};

function recommendedNarrationVoiceForLanguage(lang = "es") {
  return narrationDefaultVoiceByLanguage[lang] || "bot_en";
}

function isNarrationVoiceAvailable(key) {
  const option = narrationVoiceSystemOptions[key];
  return Boolean(option && !option.disabled);
}

function currentNarrationVoiceSystemKey() {
  const key = state?.settings?.narrationVoiceSystem || recommendedNarrationVoiceForLanguage(state?.settings?.language || "es");
  if (!isNarrationVoiceAvailable(key)) return recommendedNarrationVoiceForLanguage(state?.settings?.language || "es");
  return key;
}

function currentNarrationVoiceSystem() {
  return narrationVoiceSystemOptions[currentNarrationVoiceSystemKey()] || narrationVoiceSystemOptions.amberly_graves;
}

function isBotNarrationVoice(key = currentNarrationVoiceSystemKey()) {
  return narrationVoiceSystemOptions[key]?.type === "tts";
}

function applyRecommendedNarrationVoiceForLanguage(lang = currentLanguage?.() || state?.settings?.language || "es") {
  const key = recommendedNarrationVoiceForLanguage(lang);
  if (isNarrationVoiceAvailable(key)) state.settings.narrationVoiceSystem = key;
}

function systemVoiceSrc(fileName) {
  const voiceSystem = currentNarrationVoiceSystem();
  if (!voiceSystem || voiceSystem.type === "tts" || !voiceSystem.folder) return "";
  return `audio/voicesystem/${voiceSystem.folder}/${fileName}`;
}

function makeSystemVoiceLine(fileName, textKey, fallbackText = "") {
  return {
    fileName,
    textKey,
    fallbackText,
    get text() {
      return typeof t === "function" ? t(textKey) : (fallbackText || textKey);
    },
    get src() {
      return systemVoiceSrc(fileName);
    },
  };
}

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
  mapSelectorVoice: "audio/map_selector_voice",
  finishDraftVoice: "audio/voice_finish_draft",
};

const systemDraftVoiceLines = {
  voice_ban_phase: makeSystemVoiceLine("voice_ban_phase", "voice_ban_phase_text", "¡La fase de bloqueos de laminantes ha comenzado!"),
  voice_pick_phase: makeSystemVoiceLine("voice_pick_phase", "voice_pick_phase_text", "¡La fase de selección de laminantes ha comenzado!"),
  team_a_ban: makeSystemVoiceLine("team_a_ban", "voice_team_a_ban", "Los atacantes están bloqueando un laminante."),
  team_b_ban: makeSystemVoiceLine("team_b_ban", "voice_team_b_ban", "Los defensores están bloqueando un laminante."),
  team_a_ban_scissors: makeSystemVoiceLine("team_a_ban_scissors", "voice_team_a_ban_scissors", "Los atacantes están bloqueando un laminante de las Cizallas."),
  team_b_ban_scissors: makeSystemVoiceLine("team_b_ban_scissors", "voice_team_b_ban_scissors", "Los defensores están bloqueando un laminante de las Cizallas."),
  team_a_pick: makeSystemVoiceLine("team_a_pick", "voice_team_a_pick", "Los atacantes están eligiendo un laminante."),
  team_b_pick: makeSystemVoiceLine("team_b_pick", "voice_team_b_pick", "Los defensores están eligiendo un laminante."),
  advanced_team_ban_laminant: makeSystemVoiceLine("advanced_team_ban_laminant", "voice_advanced_team_ban_laminant", "Tu equipo está bloqueando un laminante."),
  advanced_team_ban_scissors_laminant: makeSystemVoiceLine("advanced_team_ban_scissors_laminant", "voice_advanced_team_ban_scissors_laminant", "Tu equipo está bloqueando un laminante de las Cizallas."),
  advanced_team_pick_laminant: makeSystemVoiceLine("advanced_team_pick_laminant", "voice_advanced_team_pick_laminant", "Tu equipo está seleccionando un laminante."),
  advanced_please_pick_laminant: makeSystemVoiceLine("advanced_please_pick_laminant", "voice_advanced_please_pick_laminant", "Por favor selecciona un laminante."),
  advanced_please_ban_laminant: makeSystemVoiceLine("advanced_please_ban_laminant", "voice_advanced_please_ban_laminant", "Por favor bloquea un laminante."),
  advanced_please_ban_scissors_laminant: makeSystemVoiceLine("advanced_please_ban_scissors_laminant", "voice_advanced_please_ban_scissors_laminant", "Por favor bloquea un laminante de las Cizallas."),
  random_start: makeSystemVoiceLine("random_start", "voice_random_start", "Tiempo agotado. Iniciando selección aleatoria."),
  manual_random_start: makeSystemVoiceLine("manual_random_start", "voice_manual_random_start", "El jugador inició la selección aleatoria."),
  map_selector_voice: makeSystemVoiceLine("map_selector_voice", "voice_map_selector", "Iniciando selección aleatoria de mapa."),
  voice_finish_draft: makeSystemVoiceLine("voice_finish_draft", "voice_finish_draft_text", "El sistema draft ha concluido, mostrando resultados."),
};

const turnVoices = {
  A: {
    get ban() { return systemDraftVoiceLines.team_a_ban.src; },
    get ban_scissors() { return systemDraftVoiceLines.team_a_ban_scissors.src; },
    get pick() { return systemDraftVoiceLines.team_a_pick.src; },
  },
  B: {
    get ban() { return systemDraftVoiceLines.team_b_ban.src; },
    get ban_scissors() { return systemDraftVoiceLines.team_b_ban_scissors.src; },
    get pick() { return systemDraftVoiceLines.team_b_pick.src; },
  },
};

let currentRoomCode = null;
let currentRole = null;
let playerTeam = null;
let onlineLatestRoomData = null;
let testingBotTurnKey = null;
let testingBotTimerId = null;
let onlineSummaryIntroShownKey = null;
let hostNameSaveTimer = null;
let onlineReadyTimeoutTimerId = null;
let onlineReadyTimeoutKey = null;
let onlineReadyCountdownIntervalId = null;
let onlineReadyCountdownData = null;
const ONLINE_READY_TIMEOUT_MS = 30000;
let onlineReadyStartKey = null;
const testingBotReadyTimers = new Map();
let onlineRoomListenerCode = null;
let onlineRoomDeletionListenerCode = null;
let onlineStartedForRoom = null;
let onlineRoomStartedState = false;
let onlineLastActionEventId = null;
let onlineLastPhaseEventId = null;
let onlineLastMapEventId = null;
let onlineLastRouletteEventId = null;
let onlineLastAudioEventId = null;
let onlineTurnAutoResolveKey = null;
let onlineMapAutoResolveKey = null;
let mediaUnlockDone = false;
let onlineServerTimeOffset = 0;
let onlineClockSyncStarted = false;
let suppressOnlinePush = false;
let roomPlayerNameSaveTimer = null;
let currentOnlinePlayerName = null;
let pendingJoinRoomCode = null;

const ONLINE_CLIENT_STORAGE_KEY = "rpmods_online_client_id_v2";
const ONLINE_SESSION_STORAGE_KEY = "rpmods_online_session_v2";
const ONLINE_PLAYER_NAME_STORAGE_KEY = "rpmods_online_player_name_v1";

function onlineNow() {
  return Date.now() + (Number(onlineServerTimeOffset) || 0);
}

function startOnlineClockSync() {
  if (onlineClockSyncStarted) return;
  const database = getRealtimeDatabase();
  if (!database) return;
  onlineClockSyncStarted = true;
  try {
    database.ref(".info/serverTimeOffset").on("value", (snapshot) => {
      const value = Number(snapshot.val());
      onlineServerTimeOffset = Number.isFinite(value) ? value : 0;
    });
  } catch (error) {
    onlineClockSyncStarted = false;
    console.warn("No se pudo sincronizar el reloj online.", error);
  }
}

function onlineClientId() {
  try {
    let id = localStorage.getItem(ONLINE_CLIENT_STORAGE_KEY);
    if (!id) {
      id = `client_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(ONLINE_CLIENT_STORAGE_KEY, id);
    }
    return id;
  } catch (_) {
    if (!window.__rpmodsOnlineClientId) {
      window.__rpmodsOnlineClientId = `client_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    }
    return window.__rpmodsOnlineClientId;
  }
}

const state = {
  draftConfig: { ...DEFAULT_DRAFT_CONFIG },
  players: {
    A: ["Jugador A1", "Jugador A2", "Jugador A3", "Jugador A4", "Jugador A5"],
    B: ["Jugador B1", "Jugador B2", "Jugador B3", "Jugador B4", "Jugador B5"],
  },
  picks: { A: [], B: [] },
  bans: { A: [], B: [] },
  pickBatchSelections: {},
  turnIndex: 0,
  draftActive: false,
  draftSessionId: 0,
  draftTimeouts: [],
  selected: null,
  preselectLocked: false,
  turnDuration: 20,
  timer: 20,
  timerId: null,
  turnStartedAt: null,
  turnDeadlineAt: null,
  onlinePhase: "lobby",
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
    musicVolume: 0.4,
    sfxVolume: 0.6,
    narrationVolume: 1,
    characterVoiceVolume: 0.85,
    language: "es",
    narrationVoiceSystem: "amberly_graves",
    narrationEnabled: true,
    selectionAnimationEnabled: true,
    autoResolveEnabled: true,
    animationDuration: 1.6,
  },
  devSelectedCharacter: "Ming",
  intro: {
    active: true,
    completed: false,
    overlay: null,
    logoVideo: null,
    menuVideo: null,
    loadingVideo: null,
    musicAudio: null,
    logoAudio: null,
    logoAudioSource: "",
    logoAudioPrimed: false,
    introVoiceAudio: null,
    introVoiceSource: "",
    introVoicePrimed: false,
    clicked: false,
    voicePlayed: false,
  },
  resourcePreload: {
    started: false,
    completed: false,
    promise: null,
    secondaryStarted: false,
    progress: 0,
  },
  onlineSlots: emptyAdvancedSlots(DEFAULT_DRAFT_CONFIG.teamSize),
};

const SETTINGS_STORAGE_KEY = "rpmods_draft_settings_v1";
const SETTINGS_SAVE_DELAY = 140;
let settingsSaveTimer = null;
let settingsRestoring = false;

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function sanitizeStoredSettings(rawSettings = {}) {
  const defaults = state.settings || {};
  const sanitized = { ...defaults };
  sanitized.masterVolume = clampNumber(rawSettings.masterVolume, 0, 1, defaults.masterVolume);
  sanitized.musicVolume = clampNumber(rawSettings.musicVolume, 0, 1, defaults.musicVolume);
  sanitized.sfxVolume = clampNumber(rawSettings.sfxVolume, 0, 1, defaults.sfxVolume);
  sanitized.narrationVolume = clampNumber(rawSettings.narrationVolume, 0, 1, defaults.narrationVolume);
  sanitized.characterVoiceVolume = clampNumber(rawSettings.characterVoiceVolume, 0, 1, defaults.characterVoiceVolume);
  sanitized.language = String(rawSettings.language || defaults.language || "es");
  sanitized.narrationVoiceSystem = String(rawSettings.narrationVoiceSystem || recommendedNarrationVoiceForLanguage(sanitized.language));
  if (!isNarrationVoiceAvailable(sanitized.narrationVoiceSystem)) sanitized.narrationVoiceSystem = recommendedNarrationVoiceForLanguage(sanitized.language);
  sanitized.narrationEnabled = typeof rawSettings.narrationEnabled === "boolean" ? rawSettings.narrationEnabled : defaults.narrationEnabled;
  sanitized.selectionAnimationEnabled = typeof rawSettings.selectionAnimationEnabled === "boolean" ? rawSettings.selectionAnimationEnabled : defaults.selectionAnimationEnabled;
  sanitized.autoResolveEnabled = typeof rawSettings.autoResolveEnabled === "boolean" ? rawSettings.autoResolveEnabled : defaults.autoResolveEnabled;
  sanitized.animationDuration = clampNumber(rawSettings.animationDuration, 0.6, 1.8, defaults.animationDuration);
  return sanitized;
}

function loadStoredSettings() {
  try {
    const payload = window.localStorage?.getItem(SETTINGS_STORAGE_KEY);
    if (!payload) return;
    const parsed = JSON.parse(payload);
    state.settings = sanitizeStoredSettings(parsed.settings || parsed);
    if (parsed.draftConfig) state.draftConfig = sanitizeDraftConfig(parsed.draftConfig);
    if (parsed.turnDuration != null) state.turnDuration = clampTurnDuration?.(parsed.turnDuration) || clampNumber(parsed.turnDuration, 10, 50, state.turnDuration);
    state.timer = state.turnDuration;
    if (typeof parsed.musicEnabled === "boolean") state.musicEnabled = parsed.musicEnabled;
  } catch (error) {
    console.warn("No se pudo cargar la configuración guardada.", error);
  }
}

function persistSettingsNow() {
  try {
    const payload = {
      version: 1,
      settings: sanitizeStoredSettings(state.settings),
      draftConfig: currentDraftConfig(),
      turnDuration: state.turnDuration,
      musicEnabled: state.musicEnabled,
    };
    window.localStorage?.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("No se pudo guardar la configuración.", error);
  }
}

function scheduleSettingsSave() {
  if (settingsRestoring) return;
  window.clearTimeout(settingsSaveTimer);
  settingsSaveTimer = window.setTimeout(persistSettingsNow, SETTINGS_SAVE_DELAY);
}

loadStoredSettings();

const $ = (selector) => document.querySelector(selector);
const setupA = $("#setup-team-a");
const setupB = $("#setup-team-b");
const setupScreen = $("#setup-screen");
const draftScreen = $("#draft-screen");
const summaryScreen = $("#summary-screen");
const roomScreen = document.getElementById("room-screen");
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
const roomPlayerConfig = $("#room-player-config");
const roomTeamAInputs = $("#room-team-a-inputs");
const roomTeamBInputs = $("#room-team-b-inputs");
const captainTurnBanner = $("#captain-turn-banner");


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
  const config = currentDraftConfig();
  const rules = document.querySelectorAll(".setup-rules span");
  if (rules[0]) rules[0].innerHTML = t("setup_rules_1", { time: `<b id="setup-turn-time-copy">${state.turnDuration}</b>` });
  if (rules[1]) rules[1].textContent = config.bansEnabled ? t("setup_rules_bans_enabled") : t("setup_rules_bans_disabled");
  if (rules[2]) rules[2].textContent = t("setup_rules_picks", { count: config.teamSize });
}
function translateRoleLabel(label) {
  const map = { "Centinela":"role_sentinel", "Duelista":"role_duelist", "Controlador":"role_controller", "Vanguardia":"role_vanguard", "Soporte":"role_support", "Sin rol":"role_none" };
  return t(map[label] || "role_none");
}


function updateOnlineStaticTexts() {
  setText('#create-room', 'online_create_room');
  setText('#join-room', 'online_join_room');
  const roomInput = document.getElementById('room-input');
  if (roomInput) roomInput.placeholder = t('room_code_placeholder');
  setText('.room-top .eyebrow', 'online_mode');
  setText('.room-top h1', 'online_room_title');
  setText('.room-top p:last-child', 'online_room_desc');
  setText('.room-card-label', 'online_room_code');
  setText('#copy-room-code', 'copy_code');
  const codeDisplay = document.getElementById('room-code-display');
  const toggle = document.getElementById('toggle-room-code');
  if (toggle) toggle.textContent = codeDisplay?.dataset.hidden === '0' ? t('hide_code') : t('show_code');
  setText('.room-config-heading span', 'room_config_small');
  setText('.room-config-heading strong', 'room_config_title');
  setText('.room-config-copy', 'room_config_copy');
  setText('#room-random-player-names', 'random_names');
  const captainLabels = document.querySelectorAll('.room-captain-select-row span');
  if (captainLabels[0]) captainLabels[0].textContent = t('captain_team_a_select');
  if (captainLabels[1]) captainLabels[1].textContent = t('captain_team_b_select');
  setText('.room-participant-panel > span', 'users_in_room');
  setText('#start-online-draft', 'start_draft');
  setText('#disconnect-room-btn', 'disconnect_room');
  setText('#close-room-btn', 'close_room');
  const roomTeamLabels = document.querySelectorAll('.room-player-team > span');
  if (roomTeamLabels[0]) roomTeamLabels[0].textContent = `${t('team_a')} · ${t('attackers')}`;
  if (roomTeamLabels[1]) roomTeamLabels[1].textContent = `${t('team_b')} · ${t('defenders')}`;
  setText('.join-name-kicker', 'join_modal_kicker');
  setText('#join-name-title', 'join_modal_title');
  const joinCopy = document.querySelector('.join-name-copy');
  const code = document.getElementById('join-room-code-preview')?.textContent || '------';
  if (joinCopy) joinCopy.innerHTML = t('join_modal_copy', { code: `<strong id="join-room-code-preview">${code}</strong>` });
  setText('.join-name-field span', 'join_name_label');
  const joinNameInput = document.getElementById('join-player-name');
  if (joinNameInput) joinNameInput.placeholder = t('join_name_placeholder');
  setText('#join-name-confirm', 'enter_room');
  setText('#join-name-cancel', 'cancel');
}

function updateCreditsPanel() {
  const panel = document.querySelector('[data-panel="creditos"]');
  if (!panel) return;

  const heading = panel.querySelector('.subconfig-heading');
  if (heading) {
    const headingSmall = heading.querySelector('span');
    const headingStrong = heading.querySelector('strong');
    if (headingSmall) headingSmall.textContent = 'Créditos';
    if (headingStrong) headingStrong.textContent = 'Sistema Draft';
  }

  let creditsPanel = panel.querySelector('.credits-panel');
  if (!creditsPanel) {
    creditsPanel = document.createElement('div');
    creditsPanel.className = 'credits-panel credits-detailed-panel';
    panel.appendChild(creditsPanel);
  }

  creditsPanel.classList.add('credits-detailed-panel');
  creditsPanel.innerHTML = `
    <section class="credits-section credits-section-main">
      <span class="credits-section-label">Desarrollo de interfaz y idea conceptual</span>
      <strong>RodrigoRPmods</strong>
    </section>

    <section class="credits-section">
      <span class="credits-section-label">Voces</span>
      <div class="credits-group-title">(SISTEM VOICE)</div>
      <div class="credits-name-list">
        <div><b>@WizzSV</b><small>Español Latinoamérica ESP(LA)</small></div>
        <div><b>@Amberly_Graves</b><small>Español Latinoamérica ESP(LA)</small></div>
      </div>
    </section>

    <section class="credits-section">
      <span class="credits-section-label">Ayudantes / Testers</span>
      <div class="credits-tester-list">
        <span>Jeremy wo Tabetai</span>
        <span>Nozomidol (twitch)</span>
        <span>Fersaqui</span>
        <span>wizzsv</span>
      </div>
    </section>
  `;
}

function applyLanguage(lang = currentLanguage(), options = {}) {
  state.settings.language = lang;
  if (options.syncNarrationVoice) applyRecommendedNarrationVoiceForLanguage(lang);
  document.documentElement.lang = lang;
  if (languageSelect) {
    if (!languageSelect.dataset.dynamicOptionsBuilt) {
      languageSelect.innerHTML = "";
      Object.entries(i18nConfig.languages || {}).forEach(([code, label]) => {
        const option = document.createElement("option");
        option.value = code;
        option.textContent = label;
        languageSelect.appendChild(option);
      });
      languageSelect.dataset.dynamicOptionsBuilt = "1";
    }
    languageSelect.value = lang;
  }
  setText('.setup-top .eyebrow','setup_eyebrow'); setText('.setup-top h1','setup_title'); setText('.setup-top p:last-child','setup_subtitle');
  setAllText('.setup-team-a .setup-team-heading span, .team-column-a .team-title span, .summary-team-a .summary-team-title span','team_a');
  setAllText('.setup-team-b .setup-team-heading span, .team-column-b .team-title span, .summary-team-b .summary-team-title span','team_b');
  setAllText('.setup-team-a .setup-team-heading strong, .team-column-a .team-title strong, .summary-team-a .summary-team-title strong','attackers');
  setAllText('.setup-team-b .setup-team-heading strong, .team-column-b .team-title strong, .summary-team-b .summary-team-title strong','defenders');
  setText('.versus-core','vs'); setText('.menu-panel-copy p','setup_copy'); updateSetupRulesText();
  setText('.player-name-mode-panel .subconfig-heading span','names_heading_small'); setText('.player-name-mode-panel .subconfig-heading strong','names_heading'); setText('#manual-player-names','manual_mode'); setText('#random-player-names','random_names'); setText('#start-draft','setup_start_local');
  const highlights=document.querySelectorAll('.menu-panel-highlights span'); if(highlights[0])highlights[0].textContent=t('highlight_1'); if(highlights[1])highlights[1].textContent=t('highlight_2'); if(highlights[2])highlights[2].textContent=t('highlight_3');
  document.querySelectorAll('.setup-top-tab').forEach(button=>{ const key={menu:'tab_menu',volumen:'tab_volume',configuracion:'tab_config',random:'tab_random',idioma:'tab_language',updates:'tab_updates',creditos:'tab_credits'}[button.dataset.tab]; if(key) button.textContent=t(key); });
  setText('[data-panel="volumen"] .subconfig-heading span','sound'); setText('[data-panel="volumen"] .subconfig-heading strong','volume');
  [['master_volume','master_volume_desc'],['music_volume','music_volume_desc'],['sfx_volume','sfx_volume_desc'],['narration_volume','narration_volume_desc'],['character_voice_volume','character_voice_volume_desc']].forEach((keys,i)=>{ const row=document.querySelectorAll('[data-panel="volumen"] .volume-row')[i]; if(!row)return; const sp=row.querySelector('.subconfig-copy span'); const sm=row.querySelector('.subconfig-copy small'); if(sp)sp.textContent=t(keys[0]); if(sm)sm.textContent=t(keys[1]); });
  setText('[data-panel="idioma"] .subconfig-heading span','language'); setText('[data-panel="idioma"] .subconfig-heading strong','interface_text');
  [['text_language','text_language_desc'],['narration_audio','narration_audio_desc'],['character_audio','character_audio_desc']].forEach((keys,i)=>{ const row=document.querySelectorAll('[data-panel="idioma"] .language-row')[i]; if(!row)return; const sp=row.querySelector('.subconfig-copy span'); const sm=row.querySelector('.subconfig-copy small'); if(sp)sp.textContent=t(keys[0]); if(sm)sm.textContent=t(keys[1]); });
  document.querySelectorAll('.locked-language-select option').forEach(o=>{o.textContent=t('default')}); setText('.language-note-panel strong','voice_system_title'); setText('.language-note-panel p','voice_system_complete_body');
  setText('[data-panel="random"] .subconfig-heading span','random_selector'); setText('[data-panel="random"] .subconfig-heading strong','random_summary'); setText('[data-panel="random"] .subconfig-copy span','random_summary_action'); setText('[data-panel="random"] .subconfig-copy small','random_summary_desc'); setText('#simulate-summary','simulate');
  setText('[data-panel="updates"] .subconfig-heading span','updates'); setText('[data-panel="updates"] .subconfig-heading strong','important_improvements'); document.querySelectorAll('.updates-history-panel li').forEach((li,i)=>{
    const key = `update_${i+1}`;
    const value = t(key);
    li.textContent = value === key ? "" : value;
    li.style.display = value === key ? "none" : "";
  });
  setText('[data-panel="creditos"] .subconfig-heading span','credits'); setText('[data-panel="creditos"] .subconfig-heading strong','voices'); setText('.credits-line strong','system_voice'); updateCreditsPanel();
  setText('[data-panel="configuracion"] .subconfig-heading span','config'); setText('[data-panel="configuracion"] .subconfig-heading strong','game_settings');
  [['turn_time','turn_time_desc'],['animation_duration','animation_duration_desc'],['narration_toggle','narration_toggle_desc'],['selection_animation','selection_animation_desc'],['auto_resolve','auto_resolve_desc']].forEach((keys,i)=>{ const row=document.querySelectorAll('[data-panel="configuracion"] .subconfig-row, [data-panel="configuracion"] .toggle-row')[i]; if(!row)return; const sp=row.querySelector('.subconfig-copy span'); const sm=row.querySelector('.subconfig-copy small'); if(sp)sp.textContent=t(keys[0]); if(sm)sm.textContent=t(keys[1]); });
  updateOnlineStaticTexts();
  setText('#local-config-title','local_config_title');
  setText('#local-config-modal .join-name-copy','local_config_copy');
  setText('#local-config-modal .draft-config-block .draft-config-label','match_size');
  const localToggle = document.querySelector('#local-config-modal .draft-config-toggle');
  if (localToggle) { const strong = localToggle.querySelector('strong'); const small = localToggle.querySelector('small'); if (strong) strong.textContent = t('ban_phase'); if (small) small.textContent = t('ban_phase_desc'); }
  setText('#local-config-start','start_local_draft');
  setText('#local-config-cancel','back');
  const roomDraftPanel = document.querySelector('.room-draft-config-panel');
  if (roomDraftPanel) {
    const labels = roomDraftPanel.querySelectorAll('.draft-config-label');
    if (labels[0]) labels[0].textContent = t('draft_mode');
    if (labels[1]) labels[1].textContent = t('match_size');
    const cards = roomDraftPanel.querySelectorAll('.room-mode-card');
    if (cards[0]) { const st = cards[0].querySelector('strong'); const sp = cards[0].querySelector('span'); if (st) st.textContent = t('mode_classic'); if (sp) sp.textContent = t('mode_classic_desc'); }
    if (cards[1]) { const st = cards[1].querySelector('strong'); const sp = cards[1].querySelector('span'); if (st) st.textContent = t('mode_advanced'); if (sp) sp.textContent = t('mode_advanced_desc'); }
    const toggle = roomDraftPanel.querySelector('.draft-config-toggle');
    if (toggle) { const st = toggle.querySelector('strong'); const sp = toggle.querySelector('small'); if (st) st.textContent = t('ban_phase'); if (sp) sp.textContent = t('ban_phase_desc'); }
  }
  updateDraftConfigVisibility();
  setText('#cancel-draft','cancel'); setText('#confirm-action','confirm'); setText('.team-column-a .ban-stack > span','ban_stack_a'); setText('.team-column-b .ban-stack > span','ban_stack_b');
  const ribbons=document.querySelectorAll('.team-ribbon span'); if(ribbons[0])ribbons[0].textContent=`${t('team_a')} (${t('attackers')})`; if(ribbons[1])ribbons[1].textContent=`${t('team_b')} (${t('defenders')})`;
  setText('.map-header .eyebrow','map_completed'); setText('.map-header h1','map_selection'); setText('.map-header p:last-child','map_desc'); setText('.map-selected-copy span','selected_map'); setText('#randomize-map','randomize_map');
  setText('.summary-header .eyebrow','summary_finished'); setText('.summary-header h1','summary_title'); setText('.summary-map-copy span','selected_map_label'); setAllText('.summary-team h3','bans_done'); setText('#restart-draft','restart');
  updateSelectedMapCopy?.();
  updateNarrationVoiceSystemUI();
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

const MEDIA_UNLOCK_SILENCE = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQQAAAAAAA==";

function unlockMediaPlayback(force = false) {
  if (mediaUnlockDone && !force) return;
  mediaUnlockDone = true;

  try {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (AudioContextCtor) {
      if (!state.mediaAudioContext) state.mediaAudioContext = new AudioContextCtor();
      state.mediaAudioContext.resume?.().catch?.(() => {});
    }
  } catch (_) {}

  try {
    const audio = new Audio(MEDIA_UNLOCK_SILENCE);
    // No se marca como muted: algunos navegadores solo desbloquean Audio()
    // si el primer play viene de una interacción real y no está muteado.
    audio.muted = false;
    audio.volume = 0;
    audio.preload = "auto";
    audio.play().then(() => {
      try { audio.pause(); audio.src = ""; } catch (_) {}
    }).catch(() => {});
  } catch (_) {}

  try { resumeMusicIfNeeded?.(); } catch (_) {}
}

function setupMediaUnlockHandlers() {
  if (document.body?.dataset.mediaUnlockHandlers === "true") return;
  if (document.body) document.body.dataset.mediaUnlockHandlers = "true";
  const unlock = () => unlockMediaPlayback(false);
  document.addEventListener("pointerdown", unlock, { passive: true });
  document.addEventListener("click", unlock, { passive: true });
  document.addEventListener("keydown", unlock);
  document.addEventListener("touchstart", unlock, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) unlockMediaPlayback(true);
  });
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

const RESOURCE_PRELOAD_MIN_VISIBLE_MS = 720;
const RESOURCE_PRELOAD_ITEM_TIMEOUT_MS = 5200;
const RESOURCE_PRELOAD_CONCURRENCY = 6;

function uniqueResourceGroups(groups) {
  const seen = new Set();
  return (groups || [])
    .map(group => ({ ...group, sources: (group.sources || []).filter(Boolean) }))
    .filter(group => {
      if (!group.sources.length) return false;
      const key = group.sources.join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function resourcePreloadGroups({ secondary = false } = {}) {
  const groups = [];
  const add = (sources, label = "Recurso", type = "generic") => groups.push({ sources: Array.isArray(sources) ? sources : [sources], label, type });
  const addAudio = (src, label = "Audio") => add(audioCandidates(src), label, "audio");
  const addImage = (sources, label = "Imagen") => add(sources, label, "image");

  if (!secondary) {
    add("video/background.mp4", "Video de fondo", "video");
    add(INTRO_ASSETS?.loadingVideo, "Pantalla de carga", "video");
    add(INTRO_ASSETS?.menuVideo, "Video del menú", "video");
    add(INTRO_ASSETS?.overlayLogo, "Overlay del menú", "video");

    [
      sounds.select,
      sounds.confirm,
      sounds.ban,
      sounds.warning,
      sounds.roulette,
      sounds.mapRoulette,
      sounds.startDraft,
      sounds.backConfig,
    ].forEach(src => addAudio(src, "Sonido del draft"));

    Object.values(systemDraftVoiceLines || {}).forEach(line => addAudio(line.src, "Voz del sistema"));
    characters.forEach(character => addImage([thumbPath(character.name), legacyPath(character.name)], `Icono ${character.name}`, "image"));
    maps.forEach(map => addImage(mapImagePath(map), `Mapa ${map.name}`, "image"));
    return uniqueResourceGroups(groups);
  }

  characters.forEach(character => {
    addImage([fullPath(character.name), thumbPath(character.name), legacyPath(character.name)], `Fullbody ${character.name}`, "image");
    addAudio(voicePath(character.name, "pick"), `Voz pick ${character.name}`);
    addAudio(voicePath(character.name, "ban"), `Voz ban ${character.name}`);
  });
  maps.forEach(map => addImage(mapImagePath(map), `Mapa ${map.name}`, "image"));
  return uniqueResourceGroups(groups);
}

function createResourcePreloadOverlay() {
  let overlay = document.getElementById("resource-preload-overlay");
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.id = "resource-preload-overlay";
  overlay.className = "resource-preload-overlay hidden";
  overlay.innerHTML = `
    <div class="resource-preload-card">
      <span class="resource-preload-kicker">RPmods</span>
      <strong>${t("preload_loading_resources")}</strong>
      <p id="resource-preload-label">${t("preload_preparing_resources")}</p>
      <div class="resource-preload-bar" aria-hidden="true"><span id="resource-preload-fill"></span></div>
      <small id="resource-preload-percent">0%</small>
    </div>
  `;
  document.body.appendChild(overlay);
  return overlay;
}

function updateResourcePreloadOverlay(progress, label = t("preload_loading_generic")) {
  const overlay = createResourcePreloadOverlay();
  const percent = Math.max(0, Math.min(100, Math.round(progress)));
  const fill = overlay.querySelector("#resource-preload-fill");
  const percentText = overlay.querySelector("#resource-preload-percent");
  const labelText = overlay.querySelector("#resource-preload-label");
  if (fill) fill.style.width = `${percent}%`;
  if (percentText) percentText.textContent = `${percent}%`;
  if (labelText) labelText.textContent = label;
}

function fetchWithTimeout(url, timeoutMs = RESOURCE_PRELOAD_ITEM_TIMEOUT_MS) {
  if (!url || typeof fetch !== "function") return Promise.reject(new Error("fetch unavailable"));
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller ? window.setTimeout(() => controller.abort(), timeoutMs) : null;
  return fetch(url, { cache: "force-cache", signal: controller?.signal })
    .finally(() => { if (timer) window.clearTimeout(timer); });
}

function preloadImageCandidate(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = window.setTimeout(() => { cleanup(); reject(new Error("image timeout")); }, RESOURCE_PRELOAD_ITEM_TIMEOUT_MS);
    const cleanup = () => {
      window.clearTimeout(timer);
      img.onload = null;
      img.onerror = null;
    };
    img.onload = () => { cleanup(); resolve(url); };
    img.onerror = () => { cleanup(); reject(new Error("image error")); };
    img.decoding = "async";
    img.src = url;
  });
}

function preloadAudioCandidate(url) {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const timer = window.setTimeout(() => { cleanup(); reject(new Error("audio timeout")); }, RESOURCE_PRELOAD_ITEM_TIMEOUT_MS);
    const cleanup = () => {
      window.clearTimeout(timer);
      audio.oncanplaythrough = null;
      audio.onloadeddata = null;
      audio.onerror = null;
      try { audio.pause(); audio.removeAttribute("src"); audio.load?.(); } catch (_) {}
    };
    audio.preload = "auto";
    audio.oncanplaythrough = () => { cleanup(); resolve(url); };
    audio.onloadeddata = () => { cleanup(); resolve(url); };
    audio.onerror = () => { cleanup(); reject(new Error("audio error")); };
    audio.src = url;
    try { audio.load?.(); } catch (_) {}
  });
}

function preloadVideoCandidate(url) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const timer = window.setTimeout(() => { cleanup(); reject(new Error("video timeout")); }, RESOURCE_PRELOAD_ITEM_TIMEOUT_MS);
    const cleanup = () => {
      window.clearTimeout(timer);
      video.onloadeddata = null;
      video.oncanplay = null;
      video.onerror = null;
      try { video.pause(); video.removeAttribute("src"); video.load?.(); } catch (_) {}
    };
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.onloadeddata = () => { cleanup(); resolve(url); };
    video.oncanplay = () => { cleanup(); resolve(url); };
    video.onerror = () => { cleanup(); reject(new Error("video error")); };
    video.src = url;
    try { video.load?.(); } catch (_) {}
  });
}

function fetchResourceCandidate(url) {
  return fetchWithTimeout(url).then(async response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    // Consumir el body ayuda a que GitHub Pages / el navegador dejen el recurso en caché.
    try { await response.blob(); } catch (_) {}
    return url;
  });
}

function preloadOneCandidate(url, type = "generic") {
  if (!url) return Promise.reject(new Error("empty resource"));
  if (type === "image") return preloadImageCandidate(url).catch(() => fetchResourceCandidate(url));
  if (type === "audio") return preloadAudioCandidate(url).catch(() => fetchResourceCandidate(url));
  if (type === "video") return preloadVideoCandidate(url).catch(() => fetchResourceCandidate(url));
  return fetchResourceCandidate(url);
}

async function preloadFirstAvailable(group) {
  const sources = group?.sources || [];
  for (const source of sources) {
    try {
      await preloadOneCandidate(source, group.type);
      return { ok: true, source };
    } catch (_) {
      // Prueba el siguiente candidato, por ejemplo .ogg -> .mp3 -> .mp4.
    }
  }
  return { ok: false, source: sources[0] || "" };
}

async function runResourcePreloadQueue(groups, onProgress) {
  const list = uniqueResourceGroups(groups);
  if (!list.length) return;
  let done = 0;
  let index = 0;

  const worker = async () => {
    while (index < list.length) {
      const group = list[index++];
      await preloadFirstAvailable(group);
      done += 1;
      onProgress?.(done, list.length, group);
    }
  };

  await Promise.all(Array.from({ length: Math.min(RESOURCE_PRELOAD_CONCURRENCY, list.length) }, worker));
}

function scheduleSecondaryResourcePreload() {
  if (state.resourcePreload.secondaryStarted) return;
  state.resourcePreload.secondaryStarted = true;
  window.setTimeout(() => {
    runResourcePreloadQueue(resourcePreloadGroups({ secondary: true })).catch(() => {});
  }, 900);
}

function preloadCriticalResources({ showOverlay = true } = {}) {
  if (state.resourcePreload.completed) {
    scheduleSecondaryResourcePreload();
    return Promise.resolve();
  }
  if (state.resourcePreload.promise) return state.resourcePreload.promise;

  state.resourcePreload.started = true;
  const startedAt = performance.now();
  const overlay = showOverlay ? createResourcePreloadOverlay() : null;
  if (overlay) {
    overlay.classList.remove("hidden", "is-done");
    updateResourcePreloadOverlay(2, t("preload_preparing_resources"));
  }

  state.resourcePreload.promise = runResourcePreloadQueue(resourcePreloadGroups(), (done, total, group) => {
    const progress = total ? (done / total) * 100 : 100;
    state.resourcePreload.progress = progress;
    if (overlay) updateResourcePreloadOverlay(progress, t("preload_resource_ready", { resource: group?.label || t("resource") }));
  }).catch(error => {
    console.warn("Precarga de recursos incompleta; se continuará igualmente.", error);
  }).then(async () => {
    const elapsed = performance.now() - startedAt;
    if (elapsed < RESOURCE_PRELOAD_MIN_VISIBLE_MS) await waitMs(RESOURCE_PRELOAD_MIN_VISIBLE_MS - elapsed);
    state.resourcePreload.completed = true;
    if (overlay) {
      updateResourcePreloadOverlay(100, "Recursos principales listos");
      overlay.classList.add("is-done");
      window.setTimeout(() => overlay.classList.add("hidden"), 280);
    }
    scheduleSecondaryResourcePreload();
  });

  return state.resourcePreload.promise;
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

function audioPlayFromSourceList(sources, volume = 0.78, channel = "sfx") {
  if (!sources?.length) return null;

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
  audio.play().catch((error) => {
    if (String(error?.name || "").includes("NotAllowed")) {
      unlockMediaPlayback(true);
      return;
    }
    tryNext();
  });
  return audio;
}

function audioPlay(src, volume = 0.78, channel = "sfx") {
  return audioPlayFromSourceList(audioCandidates(src), volume, channel);
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
  // Importante: no hacemos fetch/HEAD antes de reproducir.
  // Ese await puede consumir el gesto del usuario y Chrome/Opera bloquean el audio.
  unlockMediaPlayback(true);
  return audioPlayFromSourceList(uiAudioCandidates(src), volume, "sfx");
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

function currentSpeechLang() {
  const selectedVoice = currentNarrationVoiceSystem?.();
  if (selectedVoice?.type === "tts" && selectedVoice.speechLang) return selectedVoice.speechLang;
  return { es: "es-ES", en: "en-US", pt: "pt-PT", ja: "ja-JP", ru: "ru-RU", zh: "zh-CN" }[currentLanguage()] || "en-US";
}

function findSpeechSynthesisVoice(langCode = currentSpeechLang()) {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices?.() || [];
  if (!voices.length) return null;
  const normalized = String(langCode || "").toLowerCase();
  const base = normalized.split("-")[0];
  return voices.find(voice => String(voice.lang || "").toLowerCase() === normalized)
    || voices.find(voice => String(voice.lang || "").toLowerCase().startsWith(`${base}-`))
    || voices.find(voice => String(voice.lang || "").toLowerCase().startsWith(base))
    || null;
}

function speakFallback(text, volume = 0.92) {
  if (!text || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const lang = currentSpeechLang();
    utterance.lang = lang;
    const browserVoice = findSpeechSynthesisVoice(lang);
    if (browserVoice) utterance.voice = browserVoice;
    utterance.rate = 0.95;
    utterance.pitch = 0.92;
    utterance.volume = Math.max(0, Math.min(1, volume * channelVolume("narration")));
    window.speechSynthesis.speak(utterance);
  } catch (_) {
    // La narración por voz no es crítica para el flujo.
  }
}

function playNarration(src, fallbackText, volume = 0.92) {
  if (!state.settings.narrationEnabled) return null;
  const text = String(fallbackText || "").trim();
  if (isBotNarrationVoice()) {
    if (text) speakFallback(text, volume);
    return null;
  }

  const sources = audioCandidates(src);
  if (!sources.length) {
    if (text) speakFallback(text, volume);
    return null;
  }

  const audio = new Audio();
  audio.volume = Math.max(0, Math.min(1, volume * channelVolume("narration")));
  let playedByAudio = false;

  const tryNext = () => {
    const allSources = JSON.parse(audio.dataset.sources || "[]");
    const nextIndex = Number(audio.dataset.sourceIndex || "0") + 1;
    if (!allSources[nextIndex]) {
      if (!playedByAudio && text) speakFallback(text, volume);
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
  keepTransientAudioReference(audio);
  audio.play().catch((error) => {
    if (String(error?.name || "").includes("NotAllowed")) {
      unlockMediaPlayback(true);
      if (text && isBotNarrationVoice()) speakFallback(text, volume);
      return;
    }
    tryNext();
  });
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
    video.setAttribute("webkit-playsinline", "");
  };

  const playVideo = () => {
    applyVideoSettings();
    if (!video.currentSrc && video.querySelector("source")) {
      video.load();
    }
    const promise = video.play();
    if (promise) promise.catch(() => {});
  };

  const recoverFrozenVideo = (hard = false) => {
    applyVideoSettings();
    try {
      if (Number.isFinite(video.duration) && video.duration > 1) {
        const nextTime = Math.min(Math.max(0.05, (Number(video.currentTime) || 0) + 0.08), video.duration - 0.08);
        video.currentTime = nextTime;
      }
    } catch (_) {}

    if (hard) {
      try { video.pause(); } catch (_) {}
      try { video.load(); } catch (_) {}
    }

    playVideo();
  };

  if (video.dataset.initialized === "true") {
    playVideo();
    return;
  }
  video.dataset.initialized = "true";

  video.addEventListener("loadedmetadata", () => {
    // El video de fondo es local e independiente por cliente; no se sincroniza con Firebase.
    // Un pequeño offset evita que todos los navegadores intenten reproducir exactamente el mismo frame.
    if (video.dataset.localOffsetApplied === "true") return;
    video.dataset.localOffsetApplied = "true";
    try {
      if (Number.isFinite(video.duration) && video.duration > 8) {
        const seed = (Date.now() + Math.floor(Math.random() * 100000)) % Math.floor(video.duration * 1000);
        video.currentTime = Math.max(0.2, Math.min(video.duration - 0.3, seed / 1000));
      }
    } catch (_) {}
  });

  video.addEventListener("loadeddata", () => {
    document.body.classList.add("video-ready");
    document.body.classList.remove("video-error");
    playVideo();
  });
  video.addEventListener("playing", () => {
    video.dataset.stallTicks = "0";
    video.dataset.hardRecoveries = "0";
    document.body.classList.add("video-ready");
    document.body.classList.remove("video-error");
  });
  video.addEventListener("timeupdate", () => {
    video.dataset.lastTimeUpdateAt = String(Date.now());
  });
  video.addEventListener("canplay", playVideo);
  video.addEventListener("waiting", () => setTimeout(() => recoverFrozenVideo(false), 350));
  video.addEventListener("stalled", () => setTimeout(() => recoverFrozenVideo(false), 350));
  video.addEventListener("suspend", () => setTimeout(() => recoverFrozenVideo(false), 500));
  video.addEventListener("error", () => {
    document.body.classList.add("video-error");
    setTimeout(() => recoverFrozenVideo(true), 900);
  });

  document.addEventListener("pointerdown", playVideo, { passive: true });
  document.addEventListener("keydown", playVideo);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) recoverFrozenVideo(false);
  });
  window.addEventListener("focus", () => recoverFrozenVideo(false));
  window.addEventListener("pageshow", () => recoverFrozenVideo(false));

  if (video.dataset.watchdog !== "true") {
    video.dataset.watchdog = "true";
    window.setInterval(() => {
      if (document.hidden) return;
      applyVideoSettings();
      const current = Number(video.currentTime || 0);
      const previous = Number(video.dataset.lastTime || -1);
      const stallTicks = Number(video.dataset.stallTicks || 0);
      const lastUpdateAt = Number(video.dataset.lastTimeUpdateAt || 0);
      const timeUpdateIsOld = lastUpdateAt && Date.now() - lastUpdateAt > 2800;
      const seemsFrozen = !video.paused && video.readyState >= 2 && Math.abs(current - previous) < 0.025;
      video.dataset.lastTime = String(current);
      const nextStallTicks = (seemsFrozen || timeUpdateIsOld || video.paused || video.readyState < 2) ? stallTicks + 1 : 0;
      video.dataset.stallTicks = String(nextStallTicks);
      if (nextStallTicks >= 2) {
        video.dataset.stallTicks = "0";
        const hardRecoveries = Number(video.dataset.hardRecoveries || 0) + 1;
        video.dataset.hardRecoveries = String(hardRecoveries);
        recoverFrozenVideo(hardRecoveries % 3 === 0);
      } else if (video.paused) {
        playVideo();
      }
    }, 1200);
  }

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
  updateDraftConfigVisibility();
}

function localConfigModal() {
  return document.getElementById("local-config-modal");
}

function updateDraftConfigVisibility() {
  const size = activeTeamSize();
  document.querySelectorAll(".player-input, .room-player-input").forEach(input => {
    const index = Number(input.dataset.index);
    const row = input.closest(".setup-player-row") || input;
    row.classList.toggle("draft-slot-disabled", index >= size);
    row.style.display = index < size ? "" : "none";
  });
  document.body.classList.toggle("bans-disabled", !currentDraftConfig().bansEnabled);
  updateSetupRulesText();
  updateLocalConfigUI();
  updateRoomDraftConfigUI();
}

function applyDraftConfigPatch(patch = {}, options = {}) {
  const previousConfig = currentDraftConfig();
  state.draftConfig = sanitizeDraftConfig({ ...previousConfig, ...patch });
  if (state.draftConfig.mode === "advanced") {
    const currentSlots = state.onlineSlots || emptyAdvancedSlots(state.draftConfig.teamSize);
    const normalizedSlots = emptyAdvancedSlots(state.draftConfig.teamSize);
    ["A", "B"].forEach(team => {
      advancedSlotsForTeamSize(state.draftConfig.teamSize).forEach(slotKey => {
        normalizedSlots[team][slotKey] = currentSlots?.[team]?.[slotKey] || null;
      });
    });
    state.onlineSlots = normalizedSlots;
    applyAdvancedSlotsToPlayers(state.onlineSlots, state.draftConfig);
  }
  state.players.A = Array.from({ length: 5 }, (_, index) => state.players.A[index] || defaultPlayerName("A", index));
  state.players.B = Array.from({ length: 5 }, (_, index) => state.players.B[index] || defaultPlayerName("B", index));
  updateDraftConfigVisibility();
  if (options.persist !== false) scheduleSettingsSave();
  if (options.syncOnline && currentRoomCode && currentRole === "host" && !state.draftActive) scheduleRoomPlayerConfigSave();
}

function updateLocalConfigUI() {
  const config = currentDraftConfig();
  document.querySelectorAll("[data-local-team-size]").forEach(button => {
    button.classList.toggle("is-active", Number(button.dataset.localTeamSize) === config.teamSize);
  });
  const localBans = document.getElementById("local-bans-enabled");
  if (localBans) localBans.checked = Boolean(config.bansEnabled);
  const localSummary = document.getElementById("local-config-summary");
  if (localSummary) {
    localSummary.textContent = t("local_config_summary", {
      size: `${config.teamSize}v${config.teamSize}`,
      bans: config.bansEnabled ? t("bans_enabled") : t("bans_disabled"),
    });
  }
}

function updateRoomDraftConfigUI() {
  const config = currentDraftConfig();
  document.querySelectorAll("[data-room-team-size]").forEach(button => {
    button.classList.toggle("is-active", Number(button.dataset.roomTeamSize) === config.teamSize);
    button.disabled = currentRole !== "host" || Boolean(state.draftActive);
  });
  document.querySelectorAll("[data-room-draft-mode]").forEach(button => {
    button.classList.toggle("is-active", button.dataset.roomDraftMode === config.mode);
    button.disabled = currentRole !== "host" || Boolean(state.draftActive);
  });
  const roomBans = document.getElementById("room-bans-enabled");
  if (roomBans) {
    roomBans.checked = Boolean(config.bansEnabled);
    roomBans.disabled = currentRole !== "host" || Boolean(state.draftActive);
  }
  document.body.classList.toggle("room-mode-classic-selected", config.mode === "classic");
  document.body.classList.toggle("room-mode-advanced-selected", config.mode === "advanced");

  const onlineSummary = document.getElementById("room-draft-config-summary");
  if (onlineSummary) {
    onlineSummary.textContent = t("room_draft_config_summary", {
      mode: config.mode === "advanced" ? t("mode_advanced") : t("mode_classic"),
      size: `${config.teamSize}v${config.teamSize}`,
      bans: config.bansEnabled ? t("bans_enabled") : t("bans_disabled"),
    });
  }
}

function openLocalDraftConfig() {
  readPlayers();
  updateLocalConfigUI();
  const modal = localConfigModal();
  if (!modal) {
    void startDraft();
    return;
  }
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeLocalDraftConfig() {
  const modal = localConfigModal();
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
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
  const roomInput = document.querySelector(`.room-player-input[data-team="${team}"][data-index="${index}"]`);
  if (roomInput) roomInput.value = value;
  state.players[team][index] = value;
  if (currentRoomCode && currentRole === "host" && !state.draftActive) scheduleRoomPlayerConfigSave();
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

function applyTurnDuration(value, persist = true) {
  const duration = clampTurnDuration(value);
  state.turnDuration = duration;
  if (!state.draftActive) state.timer = duration;
  if (turnTimeRange) turnTimeRange.value = String(duration);
  if (turnTimeInput) turnTimeInput.value = String(duration);
  if (setupTurnTimeCopy) setupTurnTimeCopy.textContent = String(duration);
  if (persist) scheduleSettingsSave();
  if (persist && currentRoomCode && currentRole === "host" && !state.draftActive) scheduleRoomPlayerConfigSave();
}


function narrationVoiceSystemSelect() {
  return document.getElementById("narration-voice-system-select");
}

function updateNarrationVoiceSystemUI() {
  const idiomaPanel = document.querySelector('[data-panel="idioma"]');
  if (!idiomaPanel) return;

  const rows = idiomaPanel.querySelectorAll(".language-row");
  const narrationRow = rows[1];
  const characterRow = rows[2];

  if (narrationRow) {
    narrationRow.classList.remove("locked-language-row");
    narrationRow.classList.add("narration-voice-row");
    const title = narrationRow.querySelector(".subconfig-copy span");
    const desc = narrationRow.querySelector(".subconfig-copy small");
    if (title) title.textContent = t("narration_audio");
    if (desc) desc.textContent = t("narration_audio_desc");

    let select = narrationVoiceSystemSelect();
    const oldSelect = narrationRow.querySelector("select");
    if (!select) {
      select = document.createElement("select");
      select.id = "narration-voice-system-select";
      select.className = "language-select narration-voice-system-select";

      if (oldSelect) {
        oldSelect.replaceWith(select);
      } else {
        narrationRow.appendChild(select);
      }

      select.addEventListener("change", () => {
        const option = narrationVoiceSystemOptions[select.value];
        if (!option || option.disabled) {
          select.value = currentNarrationVoiceSystemKey();
          return;
        }
        state.settings.narrationVoiceSystem = select.value;
        scheduleSettingsSave();
        updateNarrationVoiceSystemUI();
      });
    }

    select.disabled = false;
    select.classList.remove("locked-language-select");
    select.innerHTML = "";
    Object.entries(narrationVoiceSystemOptions).forEach(([key, option]) => {
      const item = document.createElement("option");
      item.value = key;
      item.textContent = option.label;
      item.disabled = Boolean(option.disabled);
      select.appendChild(item);
    });
    select.value = currentNarrationVoiceSystemKey();
  }

  if (characterRow) {
    characterRow.classList.add("locked-language-row");
    const title = characterRow.querySelector(".subconfig-copy span");
    const desc = characterRow.querySelector(".subconfig-copy small");
    if (title) title.textContent = t("character_audio");
    if (desc) desc.textContent = t("character_audio_desc");
  }

  const noteTitle = idiomaPanel.querySelector(".language-note-panel strong");
  const noteBody = idiomaPanel.querySelector(".language-note-panel p");
  if (noteTitle) noteTitle.textContent = t("voice_system_title");
  if (noteBody) {
    const voice = currentNarrationVoiceSystem();
    if (voice.type === "tts") {
      noteBody.textContent = t("voice_system_bot_body", { voice: voice.label });
    } else {
      noteBody.textContent = voice.complete ? t("voice_system_complete_body") : t("voice_system_incomplete_body");
    }
  }
}

function setupNarrationVoiceSystemSelect() {
  updateNarrationVoiceSystemUI();
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
  settingsRestoring = true;
  applyTurnDuration(state.turnDuration, false);

  if (turnTimeRange) turnTimeRange.addEventListener("input", (event) => applyTurnDuration(event.target.value));
  if (turnTimeInput) {
    turnTimeInput.addEventListener("input", (event) => applyTurnDuration(event.target.value));
    turnTimeInput.addEventListener("blur", () => applyTurnDuration(turnTimeInput.value));
  }
  if (turnTimeMinus) turnTimeMinus.addEventListener("click", () => applyTurnDuration(state.turnDuration - 1));
  if (turnTimePlus) turnTimePlus.addEventListener("click", () => applyTurnDuration(state.turnDuration + 1));

  // Valores iniciales: se restauran desde localStorage si existen; si no, usa defaults.
  const percentValue = (key, fallback) => String(Math.round(clamp01(state.settings[key] ?? fallback) * 100));
  if (masterVolumeRange) masterVolumeRange.value = percentValue("masterVolume", 1);
  if (musicVolumeRange) musicVolumeRange.value = percentValue("musicVolume", 0.4);
  if (sfxVolumeRange) sfxVolumeRange.value = percentValue("sfxVolume", 0.6);
  if (narrationVolumeRange) narrationVolumeRange.value = percentValue("narrationVolume", 1);
  if (characterVoiceVolumeRange) characterVoiceVolumeRange.value = percentValue("characterVoiceVolume", 0.85);

  const bindVolumeRange = (range, valueEl, key) => {
    if (!range) return;
    const applyValue = () => {
      state.settings[key] = normalizedPercent(range.value);
      updateVolumeReadout(valueEl, range);
      updateMusicVolume();
      scheduleSettingsSave();
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
    languageSelect.addEventListener("change", () => {
      applyLanguage(languageSelect.value, { syncNarrationVoice: true });
      scheduleSettingsSave();
    });
  }

  setupNarrationVoiceSystemSelect();

  const animationApply = () => {
    const raw = Math.max(60, Math.min(180, Number(animationDurationRange?.value) || 100));
    state.settings.animationDuration = raw / 100;
    if (animationDurationValue) animationDurationValue.textContent = `${state.settings.animationDuration.toFixed(2)}x`;
    scheduleSettingsSave();
  };
  if (animationDurationRange) {
    animationDurationRange.value = String(Math.round(clampNumber(state.settings.animationDuration, 0.6, 1.8, 1.6) * 100));
    animationDurationRange.addEventListener("input", animationApply);
    animationApply();
  }

  if (narrationToggle) {
    narrationToggle.checked = state.settings.narrationEnabled;
    narrationToggle.addEventListener("change", () => {
      state.settings.narrationEnabled = narrationToggle.checked;
      scheduleSettingsSave();
    });
  }
  if (selectionAnimationToggle) {
    selectionAnimationToggle.checked = state.settings.selectionAnimationEnabled;
    selectionAnimationToggle.addEventListener("change", () => {
      state.settings.selectionAnimationEnabled = selectionAnimationToggle.checked;
      scheduleSettingsSave();
    });
  }
  if (autoResolveToggle) {
    autoResolveToggle.checked = state.settings.autoResolveEnabled;
    autoResolveToggle.addEventListener("change", () => {
      state.settings.autoResolveEnabled = autoResolveToggle.checked;
      scheduleSettingsSave();
    });
  }

  document.querySelectorAll(".setup-top-tab").forEach(button => {
    if (button.disabled) return;
    button.addEventListener("click", () => activateSetupTab(button.dataset.tab));
  });
  activateSetupTab("menu");
  updateCreditsPanel();
  settingsRestoring = false;
}


const INTRO_ASSETS = {
  // GitHub Pages es sensible a mayúsculas/minúsculas.
  // Se prueban varias variantes para evitar que logo.mp4 se salte si el archivo fue subido como Logo.mp4.
  logoVideo: [
    "video/introV/logo.mp4",
    "video/introV/Logo.mp4",
    "video/introV/LOGO.mp4",
  ],
  logoAudio: [
    "audio/intro/logo_audio.mp3",
    "audio/logo_audio.mp3",
    "logo_audio.mp3",
  ],
  overlayLogo: "video/overlays/logo_loop.webm",
  menuVideo: "video/introV/Intro_menu.mp4",
  loadingVideo: "video/introV/Loading.mp4",
  introMusic: "audio/music_intro.mp3",
  finishSound: "audio/finish_menu.mp3",
  voices: [
    "audio/intro/Celestia_intro.ogg",
    "audio/intro/Flavia_intro.ogg",
    "audio/intro/Kanami_intro.ogg",
    "audio/intro/Lawine_intro.ogg",
    "audio/intro/Mara_intro.ogg",
  ],
};

function waitMs(ms) {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

function createIntroOverlay() {
  let overlay = document.getElementById("intro-sequence-overlay");
  if (overlay) return overlay;

  overlay = document.createElement("section");
  overlay.id = "intro-sequence-overlay";
  overlay.className = "intro-sequence-overlay intro-logo-phase";
  overlay.setAttribute("aria-label", t("intro_aria"));

  const video = document.createElement("video");
  video.className = "intro-video";

  const logoOverlay = document.createElement("video");
  logoOverlay.id = "intro-logo-loop-overlay";
  logoOverlay.className = "intro-logo-loop-overlay";
  logoOverlay.playsInline = true;
  logoOverlay.muted = true;
  logoOverlay.loop = true;
  logoOverlay.preload = "auto";
  video.playsInline = true;
  video.muted = true;
  video.preload = "auto";
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");

  const black = document.createElement("div");
  black.className = "intro-black-screen";

  const prompt = document.createElement("div");
  prompt.className = "intro-continue-text";
  prompt.textContent = t("intro_continue");

  const notice = document.createElement("div");
  notice.className = "intro-notice-card";
  notice.innerHTML = `<p>${t("intro_notice_html")}</p>`;

  const acceptButton = document.createElement("button");
  acceptButton.type = "button";
  acceptButton.className = "intro-accept-button";
  acceptButton.textContent = t("intro_accept");

  const fullscreenHint = document.createElement("div");
  fullscreenHint.className = "intro-fullscreen-hint";
  fullscreenHint.textContent = t("intro_fullscreen_hint");

  overlay.appendChild(video);
  overlay.appendChild(logoOverlay);
  overlay.appendChild(black);
  overlay.appendChild(prompt);
  overlay.appendChild(notice);
  overlay.appendChild(acceptButton);
  overlay.appendChild(fullscreenHint);
  document.body.appendChild(overlay);
  return overlay;
}

function introVideoElement() {
  const overlay = createIntroOverlay();
  return overlay.querySelector(".intro-video");
}

function playIntroVideo(src, { loop = false, muted = true, startAt = 0, requireGestureOnBlock = false } = {}) {
  return new Promise(resolve => {
    const overlay = createIntroOverlay();
    const video = introVideoElement();
    video.pause();
    video.removeAttribute("src");
    video.load?.();

    let resolved = false;
    let unlockBound = false;

    const cleanup = () => {
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("error", onError);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      overlay.removeEventListener("click", unlockAndPlay);
      window.removeEventListener("keydown", keyUnlockAndPlay);
      overlay.classList.remove("intro-audio-unlock");
    };

    const done = (result) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve(result);
    };

    const onEnded = () => {
      if (loop) return;
      done("ended");
    };

    const onError = () => {
      done("error");
    };

    const onLoadedMetadata = () => {
      if (startAt > 0) {
        try { video.currentTime = startAt; } catch (_) {}
      }
    };

    const keyUnlockAndPlay = (event) => {
      if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") unlockAndPlay();
    };

    const unlockAndPlay = () => {
      overlay.classList.remove("intro-audio-unlock");
      showIntroPrompt(false);
      video.muted = muted;
      video.volume = muted ? 0 : 1;
      video.play().catch(() => {
        // Último fallback: si el navegador aún bloquea el sonido del logo,
        // reproduce el video sin audio para no congelar la intro.
        if (!muted) {
          video.muted = true;
          video.volume = 0;
          video.play().catch(() => {
            if (!loop) window.setTimeout(() => done("blocked"), 900);
          });
        } else if (!loop) {
          window.setTimeout(() => done("blocked"), 900);
        }
      });
    };

    video.addEventListener("ended", onEnded);
    video.addEventListener("error", onError);
    video.addEventListener("loadedmetadata", onLoadedMetadata);

    video.loop = loop;
    video.muted = muted;
    video.volume = muted ? 0 : 1;
    video.src = src;
    video.load?.();

    const playPromise = video.play();
    if (playPromise?.catch) playPromise.catch(() => {
      // IMPORTANTE:
      // Los navegadores suelen bloquear audio automático al cargar/refrescar.
      // No mostramos el texto durante el logo, pero dejamos el logo corriendo
      // y preparamos un desbloqueo invisible: si el usuario hace click/tecla
      // mientras el logo está en pantalla, el video se reinicia con sonido.
      if (!muted) {
        const tryUnlockLogoAudio = () => {
          if (resolved || video.src.indexOf(src) === -1) return;
          try {
            video.muted = false;
            video.volume = 1;
            video.currentTime = 0;
          } catch (_) {}
          video.play().catch(() => {});
        };

        window.addEventListener("pointerdown", tryUnlockLogoAudio, { once: true });
        window.addEventListener("keydown", tryUnlockLogoAudio, { once: true });

        video.muted = true;
        video.volume = 0;
        video.play().catch(() => {
          if (!loop) window.setTimeout(() => done("blocked"), 900);
        });
        return;
      }

      // Si el autoplay del navegador bloquea un video muteado,
      // continuamos para no dejar la pantalla congelada.
      if (!loop) window.setTimeout(() => done("blocked"), 900);
    });
  });
}


async function resolveFirstExistingSource(sources) {
  const list = Array.isArray(sources) ? sources : [sources];
  for (const source of list.filter(Boolean)) {
    try {
      const response = await fetch(source, { method: "HEAD", cache: "no-store" });
      if (response.ok) return source;
    } catch (_) {
      // En local o algunos hosts HEAD puede fallar; se usa el primer candidato.
      break;
    }
  }
  return list.filter(Boolean)[0] || "";
}

function defaultLogoAudioSource() {
  return (Array.isArray(INTRO_ASSETS.logoAudio) ? INTRO_ASSETS.logoAudio[0] : INTRO_ASSETS.logoAudio) || "";
}

function prepareLogoIntroAudioSource() {
  state.intro.logoAudioSource = state.intro.logoAudioSource || defaultLogoAudioSource();
  resolveFirstExistingSource(INTRO_ASSETS.logoAudio).then(source => {
    if (source) state.intro.logoAudioSource = source;
  }).catch(() => {});
}

function createLogoIntroAudioElement() {
  const source = state.intro.logoAudioSource || defaultLogoAudioSource();
  if (!source) return null;

  const audio = new Audio(source);
  audio.preload = "auto";
  audio.loop = false;
  audio.volume = 1;
  state.intro.logoAudio = audio;
  keepTransientAudioReference(audio);
  return audio;
}

/*
  Se llama directamente dentro del click en ACEPTAR.
  Esto desbloquea el audio en Chrome/Edge porque ocurre durante una interacción real.
  Luego, al terminar el aviso F11, se reinicia el mismo elemento y se reproduce junto al logo.
*/
function primeLogoIntroAudio() {
  if (state.intro.logoAudioPrimed) return;
  stopLogoIntroAudio(false);

  const audio = createLogoIntroAudioElement();
  if (!audio) return;

  state.intro.logoAudioPrimed = true;
  audio.volume = 0;

  const primePromise = audio.play();
  if (primePromise?.then) {
    primePromise.then(() => {
      window.setTimeout(() => {
        if (state.intro?.logoAudio !== audio) return;
        try {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = 1;
        } catch (_) {}
      }, 90);
    }).catch(() => {
      // Si falla, se mantiene el elemento cargado y se reintenta al reproducir el logo.
      try { audio.volume = 1; } catch (_) {}
    });
  }
}

async function playLogoIntroAudio() {
  let audio = state.intro?.logoAudio;

  if (!audio) {
    audio = createLogoIntroAudioElement();
  }

  if (!audio) return null;

  try {
    audio.volume = 1;
    audio.currentTime = 0;
  } catch (_) {}

  const playPromise = audio.play();
  if (playPromise?.catch) {
    playPromise.catch(() => {
      // Último reintento silencioso. Si el navegador lo bloquea aquí,
      // normalmente significa que el prime no ocurrió dentro del click.
      audio.play().catch(() => {});
    });
  }

  return audio;
}

function stopLogoIntroAudio(clearSource = true) {
  const audio = state.intro?.logoAudio;
  if (!audio) return;
  try {
    audio.pause();
    audio.currentTime = 0;
    if (clearSource) audio.src = "";
  } catch (_) {}
  if (clearSource) {
    state.intro.logoAudio = null;
    state.intro.logoAudioPrimed = false;
  }
}

function playIntroMusic() {
  stopIntroMusic(false);

  const audio = new Audio(INTRO_ASSETS.introMusic);
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = Math.max(0, Math.min(1, 0.62 * channelVolume("music")));
  state.intro.musicAudio = audio;
  keepTransientAudioReference(audio);

  const resumeIntroMusic = () => {
    if (!state.intro?.musicAudio || state.intro.musicAudio !== audio) return;
    audio.play().catch(() => {});
  };

  const cleanupResume = () => {
    window.removeEventListener("pointerdown", resumeIntroMusic);
    window.removeEventListener("keydown", resumeIntroMusic);
  };

  audio.addEventListener("playing", cleanupResume, { once: true });
  audio.play().catch(() => {
    // Al refrescar con F5 algunos navegadores bloquean audio sin gesto.
    // Se reintenta en el primer click/tecla del usuario.
    window.addEventListener("pointerdown", resumeIntroMusic, { once: true });
    window.addEventListener("keydown", resumeIntroMusic, { once: true });
  });
  return audio;
}

function stopIntroMusic(immediate = false) {
  const audio = state.intro?.musicAudio;
  if (!audio) return;

  if (immediate) {
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.src = "";
    } catch (_) {}
    state.intro.musicAudio = null;
  }
}

function fadeOutIntroMusic(duration = 1600) {
  const audio = state.intro?.musicAudio;
  if (!audio) return Promise.resolve();

  const startVolume = audio.volume || 0;
  const startTime = performance.now();

  return new Promise(resolve => {
    const step = (now) => {
      const progress = Math.min(1, (now - startTime) / duration);
      audio.volume = Math.max(0, startVolume * (1 - progress));
      if (progress < 1) {
        requestAnimationFrame(step);
        return;
      }
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (_) {}
      state.intro.musicAudio = null;
      resolve();
    };
    requestAnimationFrame(step);
  });
}

function randomIntroVoiceSource() {
  if (state.intro.introVoiceSource) return state.intro.introVoiceSource;

  const voices = INTRO_ASSETS.voices.filter(Boolean);
  if (!voices.length) return "";

  state.intro.introVoiceSource = voices[Math.floor(Math.random() * voices.length)];
  return state.intro.introVoiceSource;
}

function createIntroVoiceAudioElement() {
  const source = randomIntroVoiceSource();
  if (!source) return null;

  const audio = new Audio();
  audio.preload = "auto";
  audio.loop = false;
  audio.volume = Math.max(0, Math.min(1, 1 * channelVolume("characterVoice")));

  const sources = audioCandidates(source);
  const tryNext = () => {
    const allSources = JSON.parse(audio.dataset.sources || "[]");
    const nextIndex = Number(audio.dataset.sourceIndex || "0") + 1;
    if (!allSources[nextIndex]) return;
    setAudioElementSourceWithFallback(audio, allSources, nextIndex);
    audio.play().catch(() => tryNext());
  };

  audio.addEventListener("error", tryNext);
  setAudioElementSourceWithFallback(audio, sources, 0);

  state.intro.introVoiceAudio = audio;
  keepTransientAudioReference(audio);
  return audio;
}

/*
  Se ejecuta dentro del click de ACEPTAR para que el navegador permita
  reproducir esta voz más adelante, cuando empiece Intro_menu.mp4.
*/
function primeRandomIntroVoiceAudio() {
  if (state.intro.introVoicePrimed) return;

  const audio = state.intro.introVoiceAudio || createIntroVoiceAudioElement();
  if (!audio) return;

  state.intro.introVoicePrimed = true;

  try {
    audio.volume = 0;
    audio.currentTime = 0;
  } catch (_) {}

  const primePromise = audio.play();
  if (primePromise?.then) {
    primePromise.then(() => {
      window.setTimeout(() => {
        if (state.intro?.introVoiceAudio !== audio) return;
        try {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = Math.max(0, Math.min(1, channelVolume("characterVoice")));
        } catch (_) {}
      }, 90);
    }).catch(() => {
      try {
        audio.volume = Math.max(0, Math.min(1, channelVolume("characterVoice")));
      } catch (_) {}
    });
  }
}

function playRandomIntroVoice() {
  if (state.intro.voicePlayed) return;
  state.intro.voicePlayed = true;

  const source = randomIntroVoiceSource();
  if (!source) return;

  const audio = state.intro.introVoiceAudio || createIntroVoiceAudioElement();
  if (!audio) {
    audioPlay(source, 1, "characterVoice");
    return;
  }

  let actuallyStarted = false;
  const markStarted = () => { actuallyStarted = true; };
  audio.addEventListener("playing", markStarted, { once: true });

  try {
    audio.volume = Math.max(0, Math.min(1, channelVolume("characterVoice")));
    audio.currentTime = 0;
  } catch (_) {}

  const playPromise = audio.play();
  if (playPromise?.catch) {
    playPromise.catch(() => {
      // Reintento corto. Si el audio primed no pudo dispararse,
      // se usa el sistema normal como fallback.
      window.setTimeout(() => {
        audio.play().catch(() => audioPlay(source, 1, "characterVoice"));
      }, 90);
    });
  }

  // Si por timing el play() no dispara "playing", se fuerza un fallback.
  window.setTimeout(() => {
    if (actuallyStarted) return;
    if (!audio.paused && audio.currentTime > 0) return;
    audioPlay(source, 1, "characterVoice");
  }, 220);
}

function showIntroPrompt(show = true) {
  const overlay = createIntroOverlay();
  overlay.classList.toggle("intro-can-continue", Boolean(show));
}

async function runLoadingIntroVideo() {
  const overlay = createIntroOverlay();
  const video = introVideoElement();

  overlay.classList.remove("intro-menu-phase", "intro-logo-phase", "intro-black-phase");
  overlay.classList.add("intro-loading-phase");
  showIntroPrompt(false);

  video.pause();
  video.removeAttribute("src");
  video.load?.();

  await new Promise(resolve => {
    let resolved = false;
    const finish = () => {
      if (resolved) return;
      resolved = true;
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("error", finish);
      video.removeEventListener("ended", finish);
      resolve();
    };

    const onTimeUpdate = () => {
      if (video.currentTime >= 7) finish();
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("error", finish);
    video.addEventListener("ended", finish);
    video.addEventListener("loadedmetadata", () => {
      try { video.currentTime = 3; } catch (_) {}
    }, { once: true });

    video.loop = false;
    video.muted = true;
    video.src = INTRO_ASSETS.loadingVideo;
    video.load?.();
    video.play().catch(() => waitMs(4000).then(finish));
    window.setTimeout(finish, 4700);
  });
}

function finishIntroSequence() {
  const overlay = createIntroOverlay();
  const video = introVideoElement();

  try {
    video.pause();
    video.removeAttribute("src");
    video.load?.();
  } catch (_) {}

  overlay.classList.add("intro-exit");
  document.getElementById("intro-logo-loop-overlay")?.remove();
  state.intro.completed = true;
  state.intro.active = false;
  window.setTimeout(() => {
    overlay.remove();
  }, 220);

  switchScreen(setupScreen);
  scheduleSecondaryResourcePreload();
}

async function continueIntroFromMenu() {
  if (state.intro.clicked || state.intro.completed) return;
  state.intro.clicked = true;

  const logoOverlay = document.getElementById("intro-logo-loop-overlay");
  if (logoOverlay) {
    try { logoOverlay.pause?.(); } catch (_) {}
    logoOverlay.remove();
  }

  showIntroPrompt(false);
  audioPlay(INTRO_ASSETS.finishSound, 1, "sfx");
  const fadePromise = fadeOutIntroMusic(1700);

  const preloadPromise = preloadCriticalResources({ showOverlay: true });
  await runLoadingIntroVideo();
  await Promise.all([fadePromise, preloadPromise]);
  finishIntroSequence();
}


function resetIntroGateClasses(overlay) {
  overlay.classList.remove(
    "intro-notice-phase",
    "intro-notice-button-ready",
    "intro-notice-exit",
    "intro-fullscreen-phase",
    "intro-fullscreen-exit"
  );
}

function waitForIntroAccept() {
  const overlay = createIntroOverlay();
  const acceptButton = overlay.querySelector(".intro-accept-button");

  return new Promise(resolve => {
    const onAccept = () => {
      acceptButton?.removeEventListener("click", onAccept);
      window.removeEventListener("keydown", onKey);
      primeLogoIntroAudio();
      primeRandomIntroVoiceAudio();
      resolve();
    };

    const onKey = (event) => {
      if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
        onAccept();
      }
    };

    acceptButton?.addEventListener("click", onAccept);
    window.addEventListener("keydown", onKey);
  });
}

async function runIntroConsentGate() {
  const overlay = createIntroOverlay();
  const video = introVideoElement();

  try {
    video.pause();
    video.removeAttribute("src");
    video.load?.();
  } catch (_) {}

  overlay.classList.remove(
    "intro-logo-phase",
    "intro-menu-phase",
    "intro-loading-phase",
    "intro-can-continue",
    "intro-audio-unlock",
    "intro-black-phase"
  );
  resetIntroGateClasses(overlay);

  prepareLogoIntroAudioSource();

  overlay.classList.add("intro-notice-phase");
  showIntroPrompt(false);

  await waitMs(3000);
  overlay.classList.add("intro-notice-button-ready");

  await waitForIntroAccept();

  overlay.classList.add("intro-notice-exit");
  await waitMs(720);

  resetIntroGateClasses(overlay);
  overlay.classList.add("intro-fullscreen-phase");
  await waitMs(7000);

  overlay.classList.remove("intro-fullscreen-phase");
  overlay.classList.add("intro-post-hint-black", "intro-black-phase");
  await waitMs(1000);

  resetIntroGateClasses(overlay);
  overlay.classList.remove("intro-post-hint-black", "intro-black-phase");
}


async function startIntroSequence() {
  if (state.intro.completed) {
    switchScreen(setupScreen);
    return;
  }

  const overlay = createIntroOverlay();
  const video = introVideoElement();

  await runIntroConsentGate();

  // V3.1 hotfix: la precarga crítica aparece una sola vez justo después del aviso F11,
  // antes de mostrar el menú/intro principal. Así sonidos, videos e imágenes llegan listos antes del lobby.
  await preloadCriticalResources({ showOverlay: true });

  overlay.classList.remove("intro-exit", "intro-menu-phase", "intro-loading-phase", "intro-can-continue", "intro-audio-unlock");
  overlay.classList.add("intro-logo-phase");
  showIntroPrompt(false);
  video.classList.remove("hidden");

  playLogoIntroAudio();
  const logoVideoSource = await resolveFirstExistingSource(INTRO_ASSETS.logoVideo);
  await playIntroVideo(logoVideoSource, { loop: false, muted: true });
  stopLogoIntroAudio(true);

  showIntroPrompt(false);
  overlay.classList.remove("intro-logo-phase");
  overlay.classList.add("intro-black-phase");
  playIntroMusic();

  const logoOverlay = document.getElementById("intro-logo-loop-overlay");
  if (logoOverlay) {
    logoOverlay.src = INTRO_ASSETS.overlayLogo;
    logoOverlay.classList.add("visible");
    logoOverlay.play().catch(() => {});
  }

  await waitMs(3000);

  overlay.classList.remove("intro-black-phase");
  overlay.classList.add("intro-menu-phase");
  showIntroPrompt(true);

  playIntroVideo(INTRO_ASSETS.menuVideo, { loop: true, muted: true });
  window.setTimeout(playRandomIntroVoice, 90);

  const clickHandler = () => {
    overlay.removeEventListener("click", clickHandler);
    window.removeEventListener("keydown", keyHandler);
    continueIntroFromMenu();
  };
  const keyHandler = (event) => {
    if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") clickHandler();
  };

  overlay.addEventListener("click", clickHandler);
  window.addEventListener("keydown", keyHandler);
}

function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let code = "";

  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
}

function switchScreen(screen) {
  [setupScreen, draftScreen, mapScreen, summaryScreen, roomScreen].filter(Boolean).forEach(item => item.classList.remove("active"));
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

function updateMusicToggleButton() {
  const button = document.getElementById("music-toggle");
  if (button) button.textContent = state.musicEnabled ? t("music_on") : t("music_off");
}

function toggleMusic() {
  state.musicEnabled = !state.musicEnabled;
  const button = $("#music-toggle");
  if (state.musicEnabled) {
    if (button) button.textContent = t("music_on");
    state.musicErrorCount = 0;
    startMusic(state.musicMode || "menu");
  } else {
    if (button) button.textContent = t("music_off");
    state.musicAudio?.pause();
  }
  scheduleSettingsSave();
}

function showPhaseOverlay(text, voiceSrc, subtitle, callback) {
  const overlay = $("#phase-overlay");
  const title = $("#phase-title");
  const subtitleElement = $("#phase-subtitle");
  const kicker = $("#phase-kicker");

  state.locked = true;
  document.body.classList.add("overlay-lock", "phase-announcing");

  title.textContent = text;
  subtitleElement.textContent = subtitle || t("phase_preparing");
  kicker.textContent = text.includes("RESUMEN") || text.includes("SUMMARY") || text === t("voice_finish_draft_text") ? t("phase_result") : text.includes("BLOQUEO") || text.includes("BAN") ? t("phase_ban") : t("phase_selection");

  overlay.classList.remove("hidden", "animate");
  void overlay.offsetWidth;
  overlay.classList.add("animate");
  if (voiceSrc) playNarration(voiceSrc, subtitle || text, 0.92);

  const overlayDuration = Math.round(2200 + (state.settings.animationDuration * 1000));
  scheduleDraftTimeout(() => {
    overlay.classList.add("hidden");
    overlay.classList.remove("animate");
    document.body.classList.remove("phase-announcing");
    callback?.();
  }, overlayDuration);
}

function currentDraftConfig() {
  return sanitizeDraftConfig(state.draftConfig || DEFAULT_DRAFT_CONFIG);
}

function activeBanTurns(config = currentDraftConfig()) {
  return buildBanTurns(config);
}

function activePickTurns(config = currentDraftConfig()) {
  return buildPickTurns(config);
}

function activeTurns(config = currentDraftConfig()) {
  return [...activeBanTurns(config), ...activePickTurns(config)];
}

function activeBanTurnCount(config = currentDraftConfig()) {
  return activeBanTurns(config).length;
}

function activeTurnCount(config = currentDraftConfig()) {
  return activeTurns(config).length;
}

function activeTeamSize(config = currentDraftConfig()) {
  return sanitizeDraftConfig(config).teamSize;
}

function currentTurn() {
  return activeTurns()[state.turnIndex];
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

function currentOnlineTeamLetter() {
  if (playerTeam === "teamA") return "A";
  if (playerTeam === "teamB") return "B";
  const advancedAssignment = advancedAssignmentForClient(onlineClientId(), state.onlineSlots);
  if (advancedAssignment?.team) return advancedAssignment.team;
  return null;
}

function currentOnlineSlotKey() {
  return advancedAssignmentForClient(onlineClientId(), state.onlineSlots)?.slotKey || null;
}

function isOnlineMode() {
  return Boolean(currentRoomCode);
}

function canManageOnlineRoom() {
  return Boolean(currentRoomCode && currentRole === "host");
}

function canControlCurrentTurn() {
  if (!currentRoomCode) return true;
  const turn = currentTurn();
  if (!turn) return false;

  if (isAdvancedDraftConfig()) {
    const assignedSlot = advancedSlotForTurn(turn);
    if (!assignedSlot?.clientId || assignedSlot.clientId !== onlineClientId()) return false;
  } else {
    if (currentRole !== "player") return false;
    if (currentOnlineTeamLetter() !== turn.team) return false;
  }

  if (state.turnStartedAt && onlineNow() < Number(state.turnStartedAt)) return false;
  return true;
}

function canControlMapSelection() {
  return !currentRoomCode || currentRole === "host";
}

function canShowHostDraftActions() {
  return !currentRoomCode || currentRole === "host";
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

  const teamSize = activeTeamSize();
  for (let i = 0; i < teamSize; i += 1) {
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
  const maxBans = activeBanTurns().filter(item => item.team === team).length;
  if (!maxBans) {
    const empty = document.createElement("div");
    empty.className = "ban-slot empty ban-slot-disabled";
    const label = document.createElement("div");
    label.className = "ban-slot-label";
    label.textContent = t("bans_skipped_short");
    empty.appendChild(label);
    container.appendChild(empty);
    return;
  }
  for (let i = 0; i < maxBans; i += 1) {
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
    if (state.roulette.active || state.locked || !canControlCurrentTurn()) return;
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
    pushOnlineDraftState({ reason: "lock-preselection" });
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


function ensureRandomSelectionButton() {
  const confirmButton = $("#confirm-action");
  if (!confirmButton) return null;

  let button = document.getElementById("random-selection-action");
  if (!button) {
    button = document.createElement("button");
    button.id = "random-selection-action";
    button.type = "button";
    button.className = "random-selection-button hidden";
    button.addEventListener("click", () => startManualRandomSelection());
    confirmButton.insertAdjacentElement("afterend", button);
  }
  button.textContent = t("random_selection_button");
  button.title = t("random_selection_button");
  button.setAttribute("aria-label", t("random_selection_button"));
  return button;
}

async function startManualRandomSelection() {
  const turn = currentTurn();
  const turnIndexSnapshot = state.turnIndex;
  const sessionId = state.draftSessionId;
  if (!turn || !isDraftSessionActive(sessionId) || state.locked || state.roulette.active || !canControlCurrentTurn()) return;
  const valid = getValidCharacters();
  if (!valid.length) return;

  state.locked = true;
  renderAll();
  const audioEvent = currentRoomCode ? createOnlineAudioEvent("manualRandomStart") : null;
  if (currentRoomCode) pushOnlineDraftState({ phase: "draft", audioEvent });
  playNarration(systemDraftVoiceLines.manual_random_start.src, systemDraftVoiceLines.manual_random_start.text, 0.9);
  await delay(320);
  if (!isDraftSessionActive(sessionId) || state.turnIndex !== turnIndexSnapshot) {
    state.locked = false;
    renderAll();
    return;
  }

  const selected = await runCharacterRoulette(valid);
  if (!isDraftSessionActive(sessionId) || state.turnIndex !== turnIndexSnapshot) return;
  if (!selected) {
    state.locked = false;
    renderAll();
    return;
  }

  state.locked = false;
  state.selected = selected;
  confirmTurn(true);
}

function clearPreselection() {
  if (state.locked || state.roulette.active || !canControlCurrentTurn()) return;
  state.selected = null;
  state.preselectLocked = false;
  audioPlay(sounds.select, 0.52, "sfx");
  pushOnlineDraftState({ reason: "clear-preselection" });
  renderAll();
}

function renderSelected() {
  const button = $("#confirm-action");
  const turn = currentTurn();
  const statusName = $("#status-character-name");
  const statusFaction = $("#status-character-faction");

  if (!button || !turn) return;
  if (state.selected && !isCharacterAvailable(state.selected, turn)) {
    state.selected = null;
    state.preselectLocked = false;
  }
  const clearButton = ensureClearPreselectionButton();
  const randomButton = ensureRandomSelectionButton();

  if (!canControlCurrentTurn()) {
    const viewerSelected = state.selected && isCharacterAvailable(state.selected, turn) ? state.selected : null;
    button.classList.add("hidden");
    if (clearButton) clearButton.classList.add("hidden");
    if (randomButton) randomButton.classList.add("hidden");
    if (statusName) statusName.textContent = viewerSelected ? viewerSelected.name.toUpperCase() : t("none");
    const waitingText = isAdvancedDraftConfig()
      ? (currentOnlineTeamLetter() === turn.team ? "Esperando a tu compañero del turno..." : "Esperando al jugador rival del turno...")
      : "Esperando al capitán del turno...";
    if (statusFaction) statusFaction.textContent = viewerSelected ? `${factions[viewerSelected.faction].label} · ${roleOf(viewerSelected.name)}` : waitingText;
    return;
  }

  const selectedCharacter = state.selected && isCharacterAvailable(state.selected, turn) ? state.selected : null;

  if (statusName) statusName.textContent = selectedCharacter ? selectedCharacter.name.toUpperCase() : t("none");
  if (statusFaction) statusFaction.textContent = selectedCharacter ? `${factions[selectedCharacter.faction].label} · ${roleOf(selectedCharacter.name)}` : t("no_selection");

  if (!selectedCharacter) {
    button.classList.add("hidden");
    if (clearButton) clearButton.classList.add("hidden");
    if (randomButton) randomButton.classList.toggle("hidden", state.locked || state.roulette.active || !getValidCharacters().length);
    return;
  }

  button.classList.remove("hidden", "ban");
  if (clearButton) clearButton.classList.toggle("hidden", !state.preselectLocked);
  if (randomButton) randomButton.classList.toggle("hidden", state.locked || state.roulette.active || !getValidCharacters().length);

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
    const roundText = t("ban_round", { current: state.turnIndex + 1, total: activeBanTurnCount() });
    const actorName = isAdvancedDraftConfig() ? advancedTurnPlayerName(turn) : "";
    phaseLabel.textContent = t("block_character");
    turnLabel.textContent = actorName
      ? `${actorName} · ${t("team_blocks", { team: turn.team })}`
      : t("team_blocks", { team: turn.team });
    restriction.textContent = `${t("team_blocks", { team: turn.team })}: ${factions[turn.faction].label}.`;
    batchIndicator.textContent = isAdvancedDraftConfig() && turn.slotKey ? `${roundText} · ${advancedSlotLabel(turn.slotKey)}` : roundText;
    dockTitle.textContent = "";
    if (statusPhase) statusPhase.textContent = `${t("phase_ban")} · ${roundText}`;
    if (statusTurn) statusTurn.textContent = actorName ? `${actorName} · ${t("team_blocks", { team: turn.team })}` : t("team_blocks", { team: turn.team });
  } else {
    const pickNumber = state.picks[turn.team].length + 1;
    const playerName = isAdvancedDraftConfig() ? advancedTurnPlayerName(turn) : state.players[turn.team][pickNumber - 1];
    const roundText = t("pick_round", { team: turn.team, current: turn.groupSlot + 1, total: turn.groupCount });
    phaseLabel.textContent = t("pick_character");
    turnLabel.textContent = t("team_picks_player", { team: turn.team, player: playerName });
    restriction.textContent = t("team_can_pick", { team: turn.team, factions: getAllowedFactionKeysForPick(turn.team).map(key => factions[key].label).join(t("and_or")) });
    batchIndicator.textContent = isAdvancedDraftConfig() && turn.slotKey ? `${advancedSlotLabel(turn.slotKey)} · ${playerName}` : roundText;
    dockTitle.textContent = "";
    if (statusPhase) statusPhase.textContent = `${t("phase_pick")} · ${roundText}`;
    if (statusTurn) statusTurn.textContent = t("team_picks", { team: turn.team });
  }
}

function onlineTeamLabel(team) {
  return team === "A" ? t("online_team_a_label") : t("online_team_b_label");
}

function onlineActionLabel(turn) {
  if (!turn) return t("online_action_pick");
  return turn.type === "ban" ? t("online_action_ban") : t("online_action_pick");
}

function updateOnlineBodyClasses() {
  document.body.classList.toggle("online-role-host", Boolean(currentRoomCode && currentRole === "host"));
  document.body.classList.toggle("online-role-player", Boolean(currentRoomCode && currentRole === "player" || (currentRoomCode && currentRole === "host" && currentOnlineTeamLetter())));
  document.body.classList.toggle("online-role-spectator", Boolean(currentRoomCode && currentRole === "host" && !currentOnlineTeamLetter()));
  const turn = currentTurn();
  const ownTeam = currentOnlineTeamLetter();
  const turnSlot = isAdvancedDraftConfig() ? advancedSlotForTurn(turn) : null;
  const isMyAdvancedTurn = Boolean(turnSlot?.clientId && turnSlot.clientId === onlineClientId());
  document.body.classList.toggle("own-team-turn", Boolean(currentRoomCode && turn && ((isAdvancedDraftConfig() && isMyAdvancedTurn) || (!isAdvancedDraftConfig() && currentRole === "player" && ownTeam === turn.team))));
  document.body.classList.toggle("same-team-turn", Boolean(currentRoomCode && isAdvancedDraftConfig() && turn && ownTeam === turn.team && !isMyAdvancedTurn));
  document.body.classList.toggle("other-team-turn", Boolean(currentRoomCode && turn && ownTeam && ownTeam !== turn.team));
  if (cancelDraftButton) {
    cancelDraftButton.style.display = (!currentRoomCode || currentRole === "host") ? "inline-flex" : "none";
    cancelDraftButton.textContent = currentRoomCode ? t("close_room") : t("cancel");
    cancelDraftButton.title = currentRoomCode ? t("close_room_title") : t("cancel_draft_title");
  }
  const restartButton = document.getElementById("restart-draft");
  if (restartButton) {
    restartButton.style.display = (!currentRoomCode || currentRole === "host") ? "inline-flex" : "none";
    restartButton.textContent = currentRoomCode ? t("close_room") : t("restart");
    restartButton.dataset.defaultText = t("restart");
  }
}

function advancedTurnTargetKey(turn = currentTurn()) {
  if (!turn) return "pick_laminant";
  if (turn.type === "pick") return "pick_laminant";
  return turn.faction === "urbino" || Number(turn.banIndex) >= 2 ? "ban_scissors_laminant" : "ban_laminant";
}

function advancedTurnPhraseKey(prefix, turn = currentTurn()) {
  const target = advancedTurnTargetKey(turn);
  if (prefix === "please") {
    if (target === "pick_laminant") return "online_please_pick_laminant";
    if (target === "ban_scissors_laminant") return "online_please_ban_scissors_laminant";
    return "online_please_ban_laminant";
  }
  if (prefix === "team") {
    if (target === "pick_laminant") return "online_team_pick_laminant";
    if (target === "ban_scissors_laminant") return "online_team_ban_scissors_laminant";
    return "online_team_ban_laminant";
  }
  if (prefix === "rival") {
    if (target === "pick_laminant") return "online_rival_pick_laminant";
    if (target === "ban_scissors_laminant") return "online_rival_ban_scissors_laminant";
    return "online_rival_ban_laminant";
  }
  return "online_team_pick_laminant";
}

function renderCaptainTurnBanner() {
  updateOnlineBodyClasses();
  if (!captainTurnBanner) return;
  const turn = currentTurn();
  if (!currentRoomCode || !turn || (currentRole !== "player" && currentRole !== "host")) {
    captainTurnBanner.classList.add("hidden");
    captainTurnBanner.textContent = "";
    return;
  }

  const ownTeam = currentOnlineTeamLetter();
  const isAdvanced = isAdvancedDraftConfig();
  const assignedSlot = isAdvanced ? advancedSlotForTurn(turn) : null;
  const actorName = isAdvanced ? (assignedSlot?.name || advancedTurnPlayerName(turn)) : onlineTeamLabel(turn.team);
  const isMine = isAdvanced && assignedSlot?.clientId === onlineClientId();
  const isHostSpectator = currentRole === "host" && !ownTeam;
  const isHostPlaying = currentRole === "host" && Boolean(ownTeam);
  const isOwnTurn = isAdvanced ? isMine : currentRole === "player" && ownTeam === turn.team;
  const isTeammateTurn = isAdvanced && !isMine && ownTeam && ownTeam === turn.team;
  const isOpponentTurn = ownTeam && ownTeam !== turn.team;
  const isSpectatorTurn = isHostSpectator || (currentRole === "host" && !isHostPlaying);
  const action = onlineActionLabel(turn);
  const actionUpper = turn.type === "ban" ? t("online_action_ban_upper") : t("online_action_pick_upper");

  captainTurnBanner.classList.remove(
    "hidden",
    "turn-a",
    "turn-b",
    "is-own-turn",
    "is-opponent-turn",
    "is-spectator-turn",
    "is-teammate-turn",
  );
  captainTurnBanner.classList.add(turn.team === "A" ? "turn-a" : "turn-b");

  let kicker = t("online_kicker_waiting_assignment");
  let main = onlineTeamLabel(turn.team);
  let detail = t("online_is_doing_action", { action });
  let extra = actionUpper;

  if (isOwnTurn) {
    captainTurnBanner.classList.add("is-own-turn");
    kicker = t("online_kicker_own_turn");
    main = t(advancedTurnPhraseKey("please", turn));
    detail = isAdvanced ? `${advancedSlotLabel(turn.slotKey)} · ${actorName}` : t("online_your_turn_main");
  } else if (isTeammateTurn) {
    captainTurnBanner.classList.add("is-teammate-turn");
    kicker = t("online_kicker_teammate_turn");
    main = t(advancedTurnPhraseKey("team", turn));
    detail = t("online_teammate_actor_detail", { player: actorName });
  } else if (isOpponentTurn) {
    captainTurnBanner.classList.add("is-opponent-turn");
    kicker = t("online_kicker_rival_turn");
    main = isAdvanced ? t(advancedTurnPhraseKey("rival", turn)) : onlineTeamLabel(turn.team);
    detail = isAdvanced
      ? `${actorName} · ${onlineTeamLabel(turn.team)}`
      : t("online_is_doing_action", { action });
  } else {
    captainTurnBanner.classList.add("is-spectator-turn");
    kicker = t("online_kicker_spectator");
    main = isAdvanced ? `${actorName} · ${onlineTeamLabel(turn.team)}` : onlineTeamLabel(turn.team);
    detail = isAdvanced ? t(advancedTurnPhraseKey("rival", turn)) : (turn.type === "ban"
      ? t("online_spectator_ban_detail", { faction: "laminante" })
      : t("online_spectator_pick_detail"));
  }

  captainTurnBanner.innerHTML = `
    <span class="banner-kicker">${escapeHtml(kicker)}</span>
    <strong>${escapeHtml(main)}</strong>
    <span>${escapeHtml(detail)}</span>
    <em>${escapeHtml(extra)}</em>
  `;
}

function renderAll(options = {}) {
  renderTurnInfo();
  renderSlots();
  renderBans();
  renderCaptainTurnBanner();
  renderStageCharacters();
  if (!options.skipGrid) renderCharacterGrid();
  else updateCharacterRouletteClasses();
  renderSelected();
}

function renderDraftStateLight() {
  renderAll({ skipGrid: true });
}

function preselectCharacter(character, options = {}) {
  if (state.locked || !canControlCurrentTurn()) return;
  if (!isCharacterAvailable(character)) return;

  const source = options.source || "hover";
  if (state.preselectLocked) return;

  const previousName = state.selected?.name || null;
  if (previousName === character.name) return;

  state.selected = character;
  if (source === "touch" || source === "click") state.preselectLocked = true;

  const hoverVolume = source === "hover" ? 0.45 : 0.7;
  audioPlay(sounds.select, hoverVolume, "sfx");
  const actionEvent = currentRoomCode
    ? createOnlineActionEvent("preselect", currentTurn()?.team || null, character, { source })
    : null;
  pushOnlineDraftState({ reason: "preselection", actionEvent });
  renderAll();
}

function updateTimerDisplay(seconds) {
  const safeSeconds = Math.max(0, Math.min(state.turnDuration, Number(seconds) || 0));
  state.timer = safeSeconds;
  const timerElement = $("#timer");
  if (timerElement) timerElement.textContent = formatTimer(safeSeconds);
  if (!timerCore) return;
  if (safeSeconds <= 5 && safeSeconds > 0) timerCore.classList.add("timer-warning");
  else timerCore.classList.remove("timer-warning");
}

function onlineRemainingSeconds() {
  if (!state.turnDeadlineAt) return state.turnDuration;
  const remaining = Math.ceil((Number(state.turnDeadlineAt) - onlineNow()) / 1000);
  return Math.max(0, Math.min(state.turnDuration, remaining));
}

function onlineTurnKey() {
  return `${currentRoomCode || "local"}:${state.draftSessionId}:${state.turnIndex}:${state.turnDeadlineAt || 0}`;
}

async function tryClaimOnlineAutoResolve(turnKey = onlineTurnKey()) {
  if (!currentRoomCode || !state.settings.autoResolveEnabled || !isDraftSessionActive()) return false;
  const turn = currentTurn();
  if (!turn || state.locked || state.roulette.active || state.turnIndex >= activeTurnCount()) return false;

  const roomRef = roomRefFor(currentRoomCode);
  if (!roomRef) return false;

  try {
    const claimRef = roomRef.child("draftState/autoResolveClaim");
    const result = await claimRef.transaction((claim) => {
      const claimAt = Number(claim?.at || 0);
      const claimIsFresh = claimAt && Math.abs(onlineNow() - claimAt) < 8000;
      if (claim && claim.turnKey === turnKey && claimIsFresh) return;
      return {
        turnKey,
        clientId: onlineClientId(),
        role: currentRole || "unknown",
        team: playerTeam || null,
        at: onlineNow(),
      };
    });

    if (!result?.committed) return false;
    await autoResolveTurn({ onlineSystem: true, claimKey: turnKey });
    return true;
  } catch (error) {
    console.warn("No se pudo reclamar la selección aleatoria online.", error);
    return false;
  }
}

function resetTimer() {
  clearInterval(state.timerId);
  state.lastWarningSecond = null;
  onlineTurnAutoResolveKey = null;

  const useOnlineClock = Boolean(currentRoomCode && state.turnDeadlineAt);
  updateTimerDisplay(useOnlineClock ? onlineRemainingSeconds() : state.turnDuration);

  state.timerId = setInterval(() => {
    const nextValue = useOnlineClock ? onlineRemainingSeconds() : Math.max(0, state.timer - 1);
    updateTimerDisplay(nextValue);

    if (state.timer <= 5 && state.timer > 0 && state.lastWarningSecond !== state.timer) {
      state.lastWarningSecond = state.timer;
      audioPlay(sounds.warning, 0.72, "sfx");
    }

    if (state.timer <= 0) {
      clearInterval(state.timerId);
      timerCore?.classList.remove("timer-warning");

      if (currentRoomCode) {
        const turnKey = onlineTurnKey();
        if (onlineTurnAutoResolveKey === turnKey) return;
        onlineTurnAutoResolveKey = turnKey;
        if (state.settings.autoResolveEnabled && !state.locked && !state.roulette.active) {
          void tryClaimOnlineAutoResolve(turnKey).then((claimed) => {
            if (claimed) return;
            scheduleDraftTimeout(() => {
              if (onlineTurnKey() !== turnKey || state.locked || state.roulette.active || state.timer > 0) return;
              onlineTurnAutoResolveKey = null;
              void tryClaimOnlineAutoResolve(turnKey);
            }, 2200);
          });
        }
        return;
      }

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
  }, currentRoomCode ? 250 : 1000);
}

function getValidCharacters() {
  return characters.filter(character => isCharacterAvailable(character));
}

function delay(ms) {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

function clearDraftTimeouts() {
  (state.draftTimeouts || []).forEach(id => clearTimeout(id));
  state.draftTimeouts = [];
}

function isDraftSessionActive(sessionId = state.draftSessionId) {
  return Boolean(state.draftActive) && state.draftSessionId === sessionId;
}

function scheduleDraftTimeout(callback, milliseconds) {
  const sessionId = state.draftSessionId;
  const id = window.setTimeout(() => {
    state.draftTimeouts = (state.draftTimeouts || []).filter(item => item !== id);
    if (!isDraftSessionActive(sessionId)) return;
    callback?.();
  }, milliseconds);
  if (!Array.isArray(state.draftTimeouts)) state.draftTimeouts = [];
  state.draftTimeouts.push(id);
  return id;
}

function stopTransientDraftAudio() {
  try {
    window.speechSynthesis?.cancel?.();
  } catch (_) {}

  (state.activeSounds || []).forEach(audio => {
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.src = "";
    } catch (_) {}
  });
  state.activeSounds = [];
}

function hideDraftOverlays() {
  const phaseOverlay = document.getElementById("phase-overlay");
  if (phaseOverlay) {
    phaseOverlay.classList.add("hidden");
    phaseOverlay.classList.remove("animate");
  }
  document.body.classList.remove("overlay-lock", "phase-announcing");
}

function abortDraftRuntime() {
  state.draftActive = false;
  state.draftSessionId += 1;
  clearDraftTimeouts();
  clearInterval(state.timerId);
  state.timerId = null;
  stopTransientDraftAudio();

  state.locked = false;
  state.selected = null;
  state.preselectLocked = false;
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
  hideDraftOverlays();

  try {
    timerCore?.classList?.remove("timer-warning");
    clearCharacterRouletteVisuals?.();
    clearMapRouletteVisuals?.();
  } catch (_) {}
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

function getRealtimeDatabase() {
  try {
    return window.db || (typeof db !== "undefined" ? db : null);
  } catch (_) {
    return null;
  }
}

function onlineUnavailableMessage() {
  return "Firebase no está disponible. Revisa tu conexión o abre la app con internet para usar el modo online.";
}

function roomRefFor(roomCode) {
  const database = getRealtimeDatabase();
  if (!database || !roomCode) return null;
  return database.ref("rooms/" + roomCode);
}

function characterFromOnlineValue(value) {
  if (!value) return null;
  const name = typeof value === "string" ? value : value.name;
  return characters.find(character => character.name === name) || null;
}

function characterListFromOnlineValue(value) {
  if (!value) return [];
  const source = Array.isArray(value) ? value : Object.values(value);
  return source.map(characterFromOnlineValue).filter(Boolean);
}

function mapFromOnlineValue(value) {
  if (!value) return null;
  const id = typeof value === "string" ? value : value.id;
  const name = typeof value === "string" ? value : value.name;
  return maps.find(map => map.id === id || map.name === name) || null;
}

function serializeCharacterListForOnline(list = []) {
  return list.filter(Boolean).map(character => character.name);
}

function serializeCharacterForOnline(character) {
  return character ? character.name : null;
}

function serializePickBatchSelectionsForOnline(batchSelections = {}) {
  return Object.fromEntries(Object.entries(batchSelections || {}).map(([key, list]) => [key, serializeCharacterListForOnline(list)]));
}

function pickBatchSelectionsFromOnlineValue(value = {}) {
  const output = {};
  Object.entries(value || {}).forEach(([key, list]) => {
    output[key] = characterListFromOnlineValue(list);
  });
  return output;
}

function onlineCharacterAnimationFromValue(value) {
  if (!value) return null;
  const character = characterFromOnlineValue(value.character || value.characterName || value.name);
  if (!character) return null;
  return { character, team: value.team || currentTurn()?.team || "A" };
}

function serializeAnimationForOnline(animation) {
  if (!animation?.character) return null;
  return {
    character: animation.character.name,
    team: animation.team || currentTurn()?.team || null,
  };
}

function serializeRouletteForOnline(roulette = {}) {
  return {
    active: Boolean(roulette.active),
    highlightedName: roulette.highlightedName || null,
    finalName: roulette.finalName || null,
    previewCharacter: serializeCharacterForOnline(roulette.previewCharacter),
  };
}

function rouletteFromOnlineValue(value = {}) {
  return {
    active: Boolean(value.active),
    highlightedName: value.highlightedName || null,
    finalName: value.finalName || null,
    previewCharacter: characterFromOnlineValue(value.previewCharacter) || null,
  };
}

function serializeMapRouletteForOnline(value = {}) {
  return {
    active: Boolean(value.active),
    highlightedId: value.highlightedId || null,
    finalId: value.finalId || null,
  };
}

function inferOnlinePhase() {
  if (document.querySelector(".summary-screen.active")) return "summary";
  if (document.querySelector(".map-screen.active")) return "map";
  if (state.draftActive) return "draft";
  return state.onlinePhase || "lobby";
}

function createOnlineActionEvent(type, team, character, extra = {}) {
  return {
    id: `${onlineNow()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    team,
    character: character?.name || null,
    at: onlineNow(),
    byClientId: onlineClientId(),
    ...extra,
  };
}

function createOnlinePhaseEvent(type, extra = {}) {
  return {
    id: `${type}_${onlineNow()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    at: onlineNow(),
    byClientId: onlineClientId(),
    ...extra,
  };
}

function createOnlineAudioEvent(type, extra = {}) {
  return {
    id: `${type}_${onlineNow()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    at: onlineNow(),
    byClientId: onlineClientId(),
    ...extra,
  };
}

function playOnlineAudioEvent(event) {
  if (!event?.type) return;
  unlockMediaPlayback(true);

  if (event.type === "randomStart") {
    playNarration(systemDraftVoiceLines.random_start.src, systemDraftVoiceLines.random_start.text, 0.9);
  } else if (event.type === "manualRandomStart") {
    playNarration(systemDraftVoiceLines.manual_random_start.src, systemDraftVoiceLines.manual_random_start.text, 0.9);
  } else if (event.type === "mapSelector") {
    playNarration(systemDraftVoiceLines.map_selector_voice.src, systemDraftVoiceLines.map_selector_voice.text, 0.92);
  } else if (event.type === "finishDraft") {
    playNarration(systemDraftVoiceLines.voice_finish_draft.src, systemDraftVoiceLines.voice_finish_draft.text, 0.92);
  } else if (event.type === "turnNarration") {
    const turn = activeTurns()[Number(event.turnIndex)] || currentTurn();
    playTurnNarration(turn);
  } else if (event.type === "phaseBan") {
    playNarration(systemDraftVoiceLines.voice_ban_phase.src, systemDraftVoiceLines.voice_ban_phase.text, 0.92);
  } else if (event.type === "phasePick") {
    playNarration(systemDraftVoiceLines.voice_pick_phase.src, systemDraftVoiceLines.voice_pick_phase.text, 0.92);
  }
}

function handleOnlineAudioEvent(event) {
  if (!event?.id || event.id === onlineLastAudioEventId) return;
  onlineLastAudioEventId = event.id;
  if (event.byClientId === onlineClientId() && !event.playForOrigin) return;
  playOnlineAudioEvent(event);
}

function handleOnlineRouletteEvent(event) {
  if (!event?.id || event.id === onlineLastRouletteEventId) return;
  onlineLastRouletteEventId = event.id;
  if (event.byClientId === onlineClientId()) return;
  if (event.type === "rouletteTick") audioPlay(sounds.roulette, 0.82, "sfx");
  else if (event.type === "rouletteSelected") audioPlay(sounds.select, 0.7, "sfx");
}

function handleOnlineMapEvent(event) {
  if (!event?.id || event.id === onlineLastMapEventId) return;
  onlineLastMapEventId = event.id;
  if (event.byClientId === onlineClientId()) return;
  if (event.type === "mapTick") audioPlay(sounds.mapRoulette || sounds.roulette, 0.82, "sfx");
  else if (event.type === "mapSelected") audioPlay(sounds.confirm, 0.86, "sfx");
}

function roomPlayersPayload() {
  readPlayers();
  return {
    A: [...state.players.A],
    B: [...state.players.B],
  };
}

function normalizeAdvancedSlotValue(value, data = {}) {
  if (!value || typeof value !== "object" || !value.clientId) return null;
  const participant = participantByClientId(data, value.clientId);
  return {
    clientId: String(value.clientId),
    name: String(participant?.name || value.name || `Usuario ${String(value.clientId).slice(-4)}`),
    connected: participant ? Boolean(participant.connected) : Boolean(value.connected),
    ready: Boolean(value.ready),
    isBot: Boolean(value.isBot),
    assignedAt: Number(value.assignedAt || 0),
  };
}

function advancedSlotsFromRoom(data = {}, config = currentDraftConfig()) {
  const normalized = sanitizeDraftConfig(config);
  const raw = data.draftState?.slots || data.slots || {};
  const slots = emptyAdvancedSlots(normalized.teamSize);
  ["A", "B"].forEach(team => {
    advancedSlotsForTeamSize(normalized.teamSize).forEach(slotKey => {
      slots[team][slotKey] = normalizeAdvancedSlotValue(raw?.[team]?.[slotKey], data);
    });
  });
  return slots;
}

function allAdvancedAssignedClientIds(slots = state.onlineSlots) {
  const ids = new Set();
  ["A", "B"].forEach(team => {
    Object.values(slots?.[team] || {}).forEach(slot => {
      if (slot?.clientId) ids.add(slot.clientId);
    });
  });
  return ids;
}

function advancedAssignmentForClient(clientId = onlineClientId(), slots = state.onlineSlots) {
  if (!clientId) return null;
  for (const team of ["A", "B"]) {
    for (const slotKey of ADVANCED_SLOT_KEYS) {
      const slot = slots?.[team]?.[slotKey];
      if (slot?.clientId === clientId) {
        return { team, slotKey, slot };
      }
    }
  }
  return null;
}

function advancedSlotForTurn(turn = currentTurn(), slots = state.onlineSlots) {
  if (!turn?.team || !turn?.slotKey) return null;
  return slots?.[turn.team]?.[turn.slotKey] || null;
}

function advancedTurnPlayerName(turn = currentTurn()) {
  const slot = advancedSlotForTurn(turn);
  if (slot?.name) return slot.name;
  if (turn?.team && turn?.slotKey) return advancedSlotLabel(turn.slotKey);
  return "";
}

function playersPayloadFromAdvancedSlots(slots = state.onlineSlots, config = currentDraftConfig()) {
  const normalized = sanitizeDraftConfig(config);
  const players = { A: [], B: [] };
  ["A", "B"].forEach(team => {
    advancedSlotsForTeamSize(normalized.teamSize).forEach((slotKey, index) => {
      const fallback = `Jugador ${team}${index + 1}`;
      players[team][index] = String(slots?.[team]?.[slotKey]?.name || fallback);
    });
    for (let i = players[team].length; i < 5; i += 1) players[team][i] = `Jugador ${team}${i + 1}`;
  });
  return players;
}

function applyAdvancedSlotsToPlayers(slots = state.onlineSlots, config = currentDraftConfig()) {
  if (!isAdvancedDraftConfig(config)) return;
  const players = playersPayloadFromAdvancedSlots(slots, config);
  state.players = players;
  updateLocalPlayerInputsFromState();
}

function areAdvancedSlotsComplete(slots = state.onlineSlots, config = currentDraftConfig()) {
  const normalized = sanitizeDraftConfig(config);
  return ["A", "B"].every(team => {
    return advancedSlotsForTeamSize(normalized.teamSize).every(slotKey => Boolean(slots?.[team]?.[slotKey]?.clientId));
  });
}

function currentOnlineDraftPayload(extra = {}) {
  return {
    phase: state.onlinePhase || inferOnlinePhase(),
    draftSessionId: state.draftSessionId,
    turnIndex: state.turnIndex,
    turnDuration: state.turnDuration,
    turnStartedAt: state.turnStartedAt || null,
    turnDeadlineAt: state.turnDeadlineAt || null,
    timer: state.timer,
    draftConfig: currentDraftConfig(),
    players: {
      A: [...state.players.A],
      B: [...state.players.B],
    },
    slots: state.onlineSlots || emptyAdvancedSlots(activeTeamSize()),
    picks: {
      A: serializeCharacterListForOnline(state.picks.A),
      B: serializeCharacterListForOnline(state.picks.B),
    },
    bans: {
      A: serializeCharacterListForOnline(state.bans.A),
      B: serializeCharacterListForOnline(state.bans.B),
    },
    pickBatchSelections: serializePickBatchSelectionsForOnline(state.pickBatchSelections),
    selected: serializeCharacterForOnline(state.selected),
    preselectLocked: Boolean(state.preselectLocked),
    locked: Boolean(state.locked),
    flashBan: state.flashBan || null,
    flashPick: state.flashPick || null,
    banAnimation: serializeAnimationForOnline(state.banAnimation),
    pickAnimation: serializeAnimationForOnline(state.pickAnimation),
    roulette: serializeRouletteForOnline(state.roulette),
    selectedMap: state.selectedMap ? { id: state.selectedMap.id, name: state.selectedMap.name } : null,
    mapRoulette: serializeMapRouletteForOnline(state.mapRoulette),
    updatedAt: onlineNow(),
    ...extra,
  };
}

function pushOnlineDraftState(extra = {}) {
  if (suppressOnlinePush || !currentRoomCode) return;
  if (!state.draftActive && !extra.phase && !extra.force) return;
  const roomRef = roomRefFor(currentRoomCode);
  if (!roomRef) return;
  roomRef.child("draftState").update(currentOnlineDraftPayload(extra)).catch(error => {
    console.warn("No se pudo sincronizar el estado online.", error);
  });
}

function updateLocalPlayerInputsFromState() {
  ["A", "B"].forEach(team => {
    state.players[team].forEach((value, index) => {
      const selectors = [
        `.player-input[data-team="${team}"][data-index="${index}"]`,
        `.room-player-input[data-team="${team}"][data-index="${index}"]`,
      ];
      selectors.forEach(selector => {
        const input = document.querySelector(selector);
        if (input && input.value !== value) input.value = value;
      });
    });
  });
}

function applyOnlinePlayers(players = {}) {
  let changed = false;
  ["A", "B"].forEach(team => {
    const list = Array.isArray(players?.[team]) ? players[team] : null;
    if (!list) return;
    state.players[team] = Array.from({ length: 5 }, (_, index) => String(list[index] || `Jugador ${team}${index + 1}`));
    changed = true;
  });
  if (changed) updateLocalPlayerInputsFromState();
}

function applyOnlineSettingsFromRoom(data = {}) {
  const draftState = data.draftState || {};
  const duration = data.turnDuration ?? draftState.turnDuration;
  const draftConfig = draftState.draftConfig || data.draftConfig;
  const normalizedConfig = draftConfig ? sanitizeDraftConfig(draftConfig) : currentDraftConfig();
  if (draftConfig) applyDraftConfigPatch(draftConfig, { persist: false, syncOnline: false });
  if (duration != null) applyTurnDuration(duration, false);

  if (normalizedConfig.mode === "advanced") {
    state.onlineSlots = advancedSlotsFromRoom(data, normalizedConfig);
    applyAdvancedSlotsToPlayers(state.onlineSlots, normalizedConfig);
  } else {
    if (data.players) applyOnlinePlayers(data.players);
    if (draftState.players) applyOnlinePlayers(draftState.players);
  }
}

function onlineParticipantsFromRoom(data = {}) {
  const raw = data.participants || {};
  return Object.entries(raw).map(([clientId, value]) => ({
    clientId,
    name: String(value?.name || value?.displayName || `Usuario ${clientId.slice(-4)}`),
    connected: Boolean(value?.connected),
    joinedAt: Number(value?.joinedAt || 0),
    lastSeen: Number(value?.lastSeen || 0),
    isBot: Boolean(value?.isBot),
  })).sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0) || a.name.localeCompare(b.name));
}

function onlineAssignableUsersFromRoom(data = {}) {
  const users = [];
  const hostId = data.host?.clientId;
  if (hostId) {
    users.push({
      clientId: hostId,
      name: String(data.host?.name || currentOnlinePlayerName || "Líder / Host"),
      connected: Boolean(data.host?.connected),
      joinedAt: Number(data.createdAt || 0),
      lastSeen: Number(data.host?.lastSeen || 0),
      isHost: true,
      isBot: false,
    });
  }
  onlineParticipantsFromRoom(data).forEach(participant => {
    if (!users.some(user => user.clientId === participant.clientId)) users.push(participant);
  });
  return users;
}

function captainAssignmentsFromRoom(data = {}) {
  const assignments = data.captainAssignments || {};
  return {
    A: assignments.A || data.teamA?.clientId || null,
    B: assignments.B || data.teamB?.clientId || null,
  };
}

function participantByClientId(data = {}, clientId) {
  if (!clientId) return null;
  if (data.host?.clientId === clientId) {
    return {
      clientId,
      name: String(data.host.name || currentOnlinePlayerName || "Líder / Host"),
      connected: Boolean(data.host.connected),
      joinedAt: Number(data.createdAt || 0),
      lastSeen: Number(data.host.lastSeen || 0),
      isHost: true,
      isBot: false,
    };
  }
  const participant = data.participants?.[clientId];
  if (participant) return {
    clientId,
    name: String(participant.name || participant.displayName || `Usuario ${clientId.slice(-4)}`),
    connected: Boolean(participant.connected),
    joinedAt: Number(participant.joinedAt || 0),
    lastSeen: Number(participant.lastSeen || 0),
    isBot: Boolean(participant.isBot),
  };
  if (data.teamA?.clientId === clientId) return { clientId, name: data.teamA.name || "Capitán Atacantes", connected: Boolean(data.teamA.connected), isBot: Boolean(data.teamA.isBot) };
  if (data.teamB?.clientId === clientId) return { clientId, name: data.teamB.name || "Capitán Defensores", connected: Boolean(data.teamB.connected), isBot: Boolean(data.teamB.isBot) };
  return null;
}

function setCurrentOnlineAssignmentFromRoom(data = {}) {
  const clientId = onlineClientId();
  const config = sanitizeDraftConfig(data.draftConfig || data.draftState?.draftConfig || currentDraftConfig());
  let advancedAssignment = null;

  if (config.mode === "advanced") {
    state.onlineSlots = advancedSlotsFromRoom(data, config);
    applyAdvancedSlotsToPlayers(state.onlineSlots, config);
    advancedAssignment = advancedAssignmentForClient(clientId, state.onlineSlots);
    if (advancedAssignment?.team === "A") playerTeam = "teamA";
    else if (advancedAssignment?.team === "B") playerTeam = "teamB";
    else playerTeam = null;
  } else {
    const assignments = captainAssignmentsFromRoom(data);
    if (assignments.A === clientId) playerTeam = "teamA";
    else if (assignments.B === clientId) playerTeam = "teamB";
    else playerTeam = null;
  }

  const participant = participantByClientId(data, clientId);
  if (participant?.name) currentOnlinePlayerName = participant.name;

  if (config.mode === "advanced" && advancedAssignment) {
    const slotText = advancedSlotLabel(advancedAssignment.slotKey);
    const teamText = advancedAssignment.team === "A" ? t("attackers") : t("defenders");
    setRoomRoleDisplay(`${slotText} · ${teamText}${currentOnlinePlayerName ? ` · ${currentOnlinePlayerName}` : ""}`);
  } else if (playerTeam === "teamA") setRoomRoleDisplay(`${t("role_captain_attackers")}${currentOnlinePlayerName ? ` · ${currentOnlinePlayerName}` : ""}`);
  else if (playerTeam === "teamB") setRoomRoleDisplay(`${t("role_captain_defenders")}${currentOnlinePlayerName ? ` · ${currentOnlinePlayerName}` : ""}`);
  else if (currentRole === "host") setRoomRoleDisplay(t("leader_spectator"));
  else setRoomRoleDisplay(`${t("role_in_room_waiting")}${currentOnlinePlayerName ? ` · ${currentOnlinePlayerName}` : ""}`);
  saveOnlineSession();
}

function captainStatusText(data = {}, team) {
  const assignments = captainAssignmentsFromRoom(data);
  const participant = participantByClientId(data, assignments[team]);
  if (!participant) return t("captain_vacant");
  return `${participant.name} · ${participant.connected ? t("connected") : t("disconnected")}`;
}

function advancedAssignedLabelForClient(data = {}, clientId) {
  const config = sanitizeDraftConfig(data.draftConfig || data.draftState?.draftConfig || currentDraftConfig());
  const slots = advancedSlotsFromRoom(data, config);
  const assignment = advancedAssignmentForClient(clientId, slots);
  if (!assignment) return t("no_assignment");
  const teamLabel = assignment.team === "A" ? t("attackers") : t("defenders");
  return `${advancedSlotLabel(assignment.slotKey)} · ${teamLabel}`;
}

function renderParticipantList(data = {}) {
  const list = document.getElementById("room-participant-list");
  if (!list) return;
  const config = sanitizeDraftConfig(data.draftConfig || data.draftState?.draftConfig || currentDraftConfig());
  const participants = config.mode === "advanced" ? onlineAssignableUsersFromRoom(data) : onlineParticipantsFromRoom(data);
  const assignments = captainAssignmentsFromRoom(data);
  if (!participants.length) {
    list.innerHTML = `<p class="room-empty-list">${t("waiting_users")}</p>`;
    return;
  }
  list.innerHTML = participants.map(participant => {
    const assigned = config.mode === "advanced"
      ? advancedAssignedLabelForClient(data, participant.clientId)
      : assignments.A === participant.clientId
        ? t("captain_attackers")
        : assignments.B === participant.clientId
          ? t("captain_defenders")
          : t("no_assignment");
    const hostTag = participant.isHost ? " · HOST" : "";
    return `<p><strong>${escapeHtml(participant.name)}${hostTag}</strong><span>${escapeHtml(assigned)} · ${participant.connected ? t("connected") : t("disconnected")}</span></p>`;
  }).join("");
}

function populateCaptainSelect(select, team, data = {}) {
  if (!select) return;
  const assignments = captainAssignmentsFromRoom(data);
  const participants = onlineAssignableUsersFromRoom(data);
  const previousValue = select.value;
  select.innerHTML = `<option value="">${t("no_assignment")}</option>`;
  participants.forEach(participant => {
    const option = document.createElement("option");
    option.value = participant.clientId;
    option.textContent = `${participant.name}${participant.isHost ? " · HOST" : ""}${participant.connected ? "" : ` (${t("disconnected")})`}`;
    select.appendChild(option);
  });
  select.value = assignments[team] || previousValue || "";
  if (select.value && ![...select.options].some(option => option.value === select.value)) select.value = "";
  select.disabled = currentRole !== "host" || Boolean(data.started);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function ensureAdvancedSlotPanel() {
  let panel = document.getElementById("room-advanced-slot-panel");
  if (panel) return panel;

  panel = document.createElement("section");
  panel.id = "room-advanced-slot-panel";
  panel.className = "room-advanced-slot-panel hidden";
  panel.innerHTML = `
    <div class="room-config-heading">
      <span>MODO AVANZADO</span>
      <strong>Asignación por jugador</strong>
    </div>
    <p class="room-config-copy">
      En modo avanzado los nombres se toman de los usuarios conectados. Asigna cada persona a su slot; durante el draft cada jugador elegirá su propio personaje.
    </p>
    <div id="room-advanced-slot-grid" class="room-advanced-slot-grid"></div>
    <p id="room-advanced-slot-summary" class="draft-config-summary">Asigna todos los slots para iniciar.</p>
  `;

  const participantPanel = document.querySelector(".room-participant-panel");
  if (participantPanel?.parentNode) participantPanel.parentNode.insertBefore(panel, participantPanel.nextSibling);
  else roomPlayerConfig?.appendChild(panel);
  return panel;
}

function populateAdvancedSlotSelect(select, data = {}, team = "A", slotKey = "captain") {
  if (!select) return;
  const config = sanitizeDraftConfig(data.draftConfig || data.draftState?.draftConfig || currentDraftConfig());
  const slots = advancedSlotsFromRoom(data, config);
  const users = onlineAssignableUsersFromRoom(data);
  const selected = slots?.[team]?.[slotKey]?.clientId || "";
  const usedIds = allAdvancedAssignedClientIds(slots);

  select.innerHTML = `<option value="">Vacante</option>`;
  users.forEach(user => {
    const option = document.createElement("option");
    option.value = user.clientId;
    option.textContent = `${user.name}${user.isHost ? " · HOST" : ""}${user.connected ? "" : ` (${t("disconnected")})`}`;
    option.disabled = usedIds.has(user.clientId) && user.clientId !== selected;
    select.appendChild(option);
  });
  select.value = selected;
  select.disabled = currentRole !== "host" || Boolean(data.started);
}

function renderAdvancedSlotPanel(data = {}) {
  const panel = ensureAdvancedSlotPanel();
  const grid = document.getElementById("room-advanced-slot-grid");
  const summary = document.getElementById("room-advanced-slot-summary");
  const config = sanitizeDraftConfig(data.draftConfig || data.draftState?.draftConfig || currentDraftConfig());
  const isAdvanced = config.mode === "advanced";
  panel.classList.toggle("hidden", !isAdvanced || currentRole !== "host" || Boolean(data.started));
  if (!grid) return;

  if (!isAdvanced) {
    grid.innerHTML = "";
    return;
  }

  const slots = advancedSlotsFromRoom(data, config);
  state.onlineSlots = slots;
  const slotKeys = advancedSlotsForTeamSize(config.teamSize);
  const buildTeam = (team) => `
    <div class="room-advanced-team room-advanced-team-${team.toLowerCase()}">
      <span>${team === "A" ? "TEAM A · ATACANTES" : "TEAM B · DEFENSORES"}</span>
      ${slotKeys.map(slotKey => `
        <label class="room-advanced-slot-row">
          <strong>${advancedSlotLabel(slotKey)}</strong>
          <select class="room-captain-select room-advanced-slot-select" data-advanced-team="${team}" data-advanced-slot="${slotKey}"></select>
        </label>
      `).join("")}
    </div>
  `;
  grid.innerHTML = `${buildTeam("A")}${buildTeam("B")}`;
  grid.querySelectorAll(".room-advanced-slot-select").forEach(select => {
    const team = select.dataset.advancedTeam;
    const slotKey = select.dataset.advancedSlot;
    populateAdvancedSlotSelect(select, data, team, slotKey);
    select.addEventListener("change", () => assignAdvancedSlot(team, slotKey, select.value || null));
  });

  const assigned = ["A", "B"].reduce((total, team) => {
    return total + slotKeys.filter(slotKey => Boolean(slots?.[team]?.[slotKey]?.clientId)).length;
  }, 0);
  const needed = slotKeys.length * 2;
  if (summary) summary.textContent = `Modo avanzado: ${assigned}/${needed} jugadores asignados · ${config.teamSize}v${config.teamSize}`;
}

function advancedSlotsToRoomPlayers(slots, config = currentDraftConfig()) {
  return playersPayloadFromAdvancedSlots(slots, config);
}

async function assignAdvancedSlot(team, slotKey, clientId) {
  if (!currentRoomCode || currentRole !== "host") return;
  const roomRef = roomRefFor(currentRoomCode);
  if (!roomRef) return;
  const normalizedTeam = team === "B" ? "B" : "A";
  const normalizedSlot = ADVANCED_SLOT_KEYS.includes(slotKey) ? slotKey : "captain";

  try {
    const snapshot = await roomRef.get();
    const data = snapshot.val() || {};
    if (data.started) return;
    const config = sanitizeDraftConfig(data.draftConfig || currentDraftConfig());
    const slots = advancedSlotsFromRoom(data, config);
    const updates = { updatedAt: onlineNow() };

    ["A", "B"].forEach(tKey => {
      ADVANCED_SLOT_KEYS.forEach(sKey => {
        if (slots?.[tKey]?.[sKey]?.clientId === clientId && clientId) {
          updates[`slots/${tKey}/${sKey}`] = null;
          updates[`draftState/slots/${tKey}/${sKey}`] = null;
        }
      });
    });

    const participant = clientId ? participantByClientId(data, clientId) : null;
    const value = participant ? {
      clientId,
      name: participant.name,
      connected: participant.connected,
      assignedAt: onlineNow(),
      role: advancedSlotLabel(normalizedSlot).toUpperCase(),
    } : null;

    updates[`slots/${normalizedTeam}/${normalizedSlot}`] = value;
    updates[`draftState/slots/${normalizedTeam}/${normalizedSlot}`] = value;

    const nextSlots = advancedSlotsFromRoom({ ...data, slots: data.slots || {} }, config);
    if (value) nextSlots[normalizedTeam][normalizedSlot] = value;
    else nextSlots[normalizedTeam][normalizedSlot] = null;
    ["A", "B"].forEach(tKey => {
      ADVANCED_SLOT_KEYS.forEach(sKey => {
        if (tKey !== normalizedTeam || sKey !== normalizedSlot) {
          if (clientId && nextSlots?.[tKey]?.[sKey]?.clientId === clientId) nextSlots[tKey][sKey] = null;
        }
      });
    });

    const players = advancedSlotsToRoomPlayers(nextSlots, config);
    updates.players = players;
    updates["draftState/players"] = players;

    const captainA = nextSlots.A?.captain || null;
    const captainB = nextSlots.B?.captain || null;
    updates["captainAssignments/A"] = captainA?.clientId || null;
    updates["captainAssignments/B"] = captainB?.clientId || null;
    updates.teamA = captainA ? { clientId: captainA.clientId, name: captainA.name, connected: captainA.connected, role: "CAPITÁN_ATACANTES", lastSeen: onlineNow() } : null;
    updates.teamB = captainB ? { clientId: captainB.clientId, name: captainB.name, connected: captainB.connected, role: "CAPITÁN_DEFENSORES", lastSeen: onlineNow() } : null;

    await roomRef.update(updates);
  } catch (error) {
    console.warn("No se pudo asignar el slot avanzado.", error);
    alert("No se pudo asignar el jugador. Intenta de nuevo.");
  }
}


function testingBotSafeKey(value) {
  return String(value || "bot").toLowerCase().replace(/[^a-z0-9_-]/g, "_").slice(0, 48);
}

function testingBotClientId(team, slotKey = "captain") {
  return `bot_${testingBotSafeKey(currentRoomCode || "room")}_${testingBotSafeKey(team)}_${testingBotSafeKey(slotKey)}`;
}

function testingBotNameSeed(team, slotKey = "captain") {
  const value = `${currentRoomCode || "room"}:${team}:${slotKey}`;
  return [...value].reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 3), 0);
}

function testingBotName(team, slotKey = "captain") {
  const pool = getConfiguredRandomNamePool(team).filter(name => !/^bot\b/i.test(String(name || "").trim()));
  const fallback = ["Rukioto", "Shennae", "XLixusX", "Andercito007", "EmikoAi", "AVega"];
  const candidates = pool.length ? pool : fallback;
  const seed = testingBotNameSeed(team, slotKey);
  const chosen = candidates[seed % candidates.length] || `Jugador ${team}`;
  return String(chosen).slice(0, 24);
}

function testingBotPayload(team, slotKey = "captain") {
  return {
    name: testingBotName(team, slotKey),
    displayName: testingBotName(team, slotKey),
    connected: true,
    isBot: true,
    role: advancedSlotLabel(slotKey).toUpperCase(),
    joinedAt: onlineNow(),
    lastSeen: onlineNow(),
  };
}

function isTestingBotParticipant(participant) {
  return Boolean(participant?.isBot || String(participant?.clientId || "").startsWith("bot_"));
}

function botClientIdForCurrentTurn(data = onlineLatestRoomData || {}, turn = currentTurn()) {
  if (!currentRoomCode || !turn) return null;
  const config = sanitizeDraftConfig(data.draftConfig || data.draftState?.draftConfig || currentDraftConfig());

  if (config.mode === "advanced") {
    const slots = advancedSlotsFromRoom(data, config);
    const slot = slots?.[turn.team]?.[turn.slotKey];
    return isTestingBotParticipant(slot) ? slot.clientId : null;
  }

  const assignments = captainAssignmentsFromRoom(data);
  const clientId = assignments?.[turn.team];
  const participant = participantByClientId(data, clientId);
  return isTestingBotParticipant(participant) ? clientId : null;
}

function testingBotPickCharacter(turn = currentTurn()) {
  if (!turn) return null;
  const allowedFactions = turn.type === "pick"
    ? getAllowedFactionKeysForPick(turn.team)
    : [turn.faction];
  const available = characters.filter(character => {
    if (!allowedFactions.includes(character.faction)) return false;
    return isCharacterAvailable(character, turn);
  });
  if (!available.length) return null;

  if (turn.type === "pick") {
    const teamRoles = state.picks[turn.team].map(character => roleOf(character.name));
    const balanced = available.filter(character => !teamRoles.includes(roleOf(character.name)));
    if (balanced.length) return balanced[Math.floor(Math.random() * balanced.length)];
  }

  return available[Math.floor(Math.random() * available.length)];
}

function clearTestingBotTurnTimer() {
  if (testingBotTimerId) {
    clearTimeout(testingBotTimerId);
    testingBotTimerId = null;
  }
}

function testingBotThinkingDurationMs() {
  return 3000 + Math.round(Math.random() * 3000);
}

function testingBotPreselectDelayMs() {
  return 520 + Math.round(Math.random() * 680);
}

function testingBotApplyPreselection(character, botClientId, source = "testing-bot-thinking") {
  const turn = currentTurn();
  if (!character || !turn || !isCharacterAvailable(character, turn)) return false;

  state.selected = character;
  state.preselectLocked = false;
  renderAll();
  pushOnlineDraftState({
    reason: source,
    actionEvent: createOnlineActionEvent("preselect", turn.team, character, { source, botClientId }),
  });
  return true;
}

async function claimAndRunTestingBotTurn(turnKey, botClientId) {
  if (!currentRoomCode || !botClientId || currentRole !== "host") return;
  const roomRef = roomRefFor(currentRoomCode);
  if (!roomRef) return;

  try {
    const claimRef = roomRef.child("draftState/testingBotClaim");
    const result = await claimRef.transaction((claim) => {
      if (claim?.key === turnKey) return claim;
      return {
        key: turnKey,
        botClientId,
        byClientId: onlineClientId(),
        at: onlineNow(),
      };
    });

    if (!result.committed) return;
    const latestSnapshot = await roomRef.get();
    const latestData = latestSnapshot.val() || {};
    onlineLatestRoomData = latestData;
    syncDraftStateFromRoom(latestData);

    const turn = currentTurn();
    const activeBot = botClientIdForCurrentTurn(latestData, turn);
    if (!turn || activeBot !== botClientId || state.locked || state.roulette.active) return;

    const startedAt = Date.now();
    const thinkingDuration = testingBotThinkingDurationMs();

    const thinkStep = () => {
      if (!isDraftSessionActive()) return;
      const current = currentTurn();
      const stillBot = botClientIdForCurrentTurn(onlineLatestRoomData || {}, current);
      if (!current || stillBot !== botClientId || state.locked || state.roulette.active) return;

      const elapsed = Date.now() - startedAt;
      const character = testingBotPickCharacter(current);
      if (character) {
        testingBotApplyPreselection(character, botClientId, elapsed >= thinkingDuration ? "testing-bot-final-preselect" : "testing-bot-thinking");
      }

      if (elapsed >= thinkingDuration) {
        state.preselectLocked = true;
        renderAll();
        scheduleDraftTimeout(() => {
          if (!isDraftSessionActive()) return;
          const finalTurn = currentTurn();
          const finalBot = botClientIdForCurrentTurn(onlineLatestRoomData || {}, finalTurn);
          if (!finalTurn || finalBot !== botClientId || state.locked || state.roulette.active) return;

          if (!state.selected || !isCharacterAvailable(state.selected, finalTurn)) {
            const fallback = testingBotPickCharacter(finalTurn);
            if (!fallback) return;
            state.selected = fallback;
          }

          confirmTurn(true, { onlineSystem: true, testingBot: true });
        }, 280 + Math.round(Math.random() * 320));
        return;
      }

      scheduleDraftTimeout(thinkStep, testingBotPreselectDelayMs());
    };

    scheduleDraftTimeout(thinkStep, testingBotPreselectDelayMs());
  } catch (error) {
    console.warn("No se pudo ejecutar el turno del bot de testing.", error);
  }
}

function scheduleTestingBotTurn() {
  if (!currentRoomCode || currentRole !== "host" || !state.draftActive || state.onlinePhase !== "draft") return;
  const turn = currentTurn();
  if (!turn || state.locked || state.roulette.active || state.turnIndex >= activeTurnCount()) return;

  const botClientId = botClientIdForCurrentTurn(onlineLatestRoomData || {}, turn);
  if (!botClientId) return;

  const turnKey = `${currentRoomCode}:${state.draftSessionId}:${state.turnIndex}:${state.turnDeadlineAt || 0}:${botClientId}`;
  if (testingBotTurnKey === turnKey) return;
  testingBotTurnKey = turnKey;
  clearTestingBotTurnTimer();

  const delayMs = 350 + Math.round(Math.random() * 650);
  testingBotTimerId = setTimeout(() => {
    void claimAndRunTestingBotTurn(turnKey, botClientId);
  }, delayMs);
}


function hostDisplayNameFromRoom(data = {}) {
  const fromRoom = String(data.host?.name || "").trim();
  if (fromRoom) return fromRoom;
  if (currentOnlinePlayerName) return currentOnlinePlayerName;
  try {
    const stored = String(localStorage.getItem(ONLINE_PLAYER_NAME_STORAGE_KEY) || "").trim();
    if (stored) return stored;
  } catch (_) {}
  return "Líder / Host";
}

function sanitizeOnlineDisplayName(name, fallback = "Líder / Host") {
  const value = String(name || "").trim().replace(/\s+/g, " ").slice(0, 24);
  return value || fallback;
}

function ensureHostNamePanel() {
  let panel = document.getElementById("room-host-name-panel");
  if (panel) return panel;

  panel = document.createElement("section");
  panel.id = "room-host-name-panel";
  panel.className = "room-host-name-panel hidden";
  panel.innerHTML = `
    <div class="room-config-heading">
      <span>${escapeHtml(t("host_name_label"))}</span>
      <strong>${escapeHtml(t("host_name_title"))}</strong>
    </div>
    <p class="room-config-copy">${escapeHtml(t("host_name_desc"))}</p>
    <label class="room-host-name-row">
      <span>${escapeHtml(t("host_name_field"))}</span>
      <input id="room-host-name-input" class="room-input" type="text" maxlength="24" autocomplete="nickname" />
    </label>
    <div class="room-host-name-actions">
      <button id="room-host-name-save" class="secondary-button room-code-button" type="button">${escapeHtml(t("host_name_save"))}</button>
    </div>
  `;

  const draftPanel = document.querySelector(".room-draft-config-panel");
  if (draftPanel?.parentNode) draftPanel.parentNode.insertBefore(panel, draftPanel.nextSibling);
  else roomPlayerConfig?.prepend(panel);
  return panel;
}

async function updateHostOnlineName(name) {
  if (!currentRoomCode || currentRole !== "host") return;
  const roomRef = roomRefFor(currentRoomCode);
  if (!roomRef) return;

  const safeName = sanitizeOnlineDisplayName(name);
  currentOnlinePlayerName = safeName;
  try { localStorage.setItem(ONLINE_PLAYER_NAME_STORAGE_KEY, safeName); } catch (_) {}
  setRoomRoleDisplay(`${t("leader_spectator")} · ${safeName}`);

  try {
    const snapshot = await roomRef.get();
    const data = snapshot.val() || {};
    if (data.started) return;

    const hostId = data.host?.clientId || onlineClientId();
    const config = sanitizeDraftConfig(data.draftConfig || data.draftState?.draftConfig || currentDraftConfig());
    const updates = {
      "host/name": safeName,
      "host/lastSeen": onlineNow(),
      updatedAt: onlineNow(),
    };

    const assignments = captainAssignmentsFromRoom(data);
    if (assignments.A === hostId) updates["teamA/name"] = safeName;
    if (assignments.B === hostId) updates["teamB/name"] = safeName;

    const slots = advancedSlotsFromRoom(data, config);
    ["A", "B"].forEach(team => {
      ADVANCED_SLOT_KEYS.forEach(slotKey => {
        if (slots?.[team]?.[slotKey]?.clientId === hostId) {
          updates[`slots/${team}/${slotKey}/name`] = safeName;
          updates[`draftState/slots/${team}/${slotKey}/name`] = safeName;
        }
      });
    });

    await roomRef.update(updates);
  } catch (error) {
    console.warn("No se pudo actualizar el nombre del líder.", error);
    alert(t("host_name_error"));
  }
}

function scheduleHostNameSave(name) {
  if (hostNameSaveTimer) clearTimeout(hostNameSaveTimer);
  hostNameSaveTimer = setTimeout(() => {
    void updateHostOnlineName(name);
  }, 450);
}

function renderHostNamePanel(data = {}) {
  const panel = ensureHostNamePanel();
  const isHostLobby = currentRole === "host" && !Boolean(data.started);
  panel.classList.toggle("hidden", !isHostLobby);

  const input = document.getElementById("room-host-name-input");
  const save = document.getElementById("room-host-name-save");
  if (!input) return;

  const value = hostDisplayNameFromRoom(data);
  if (document.activeElement !== input && input.value !== value) input.value = value;

  if (!input.dataset.boundHostName) {
    input.dataset.boundHostName = "1";
    input.addEventListener("input", () => {
      const nextName = sanitizeOnlineDisplayName(input.value, "");
      if (nextName) {
        currentOnlinePlayerName = nextName;
        scheduleHostNameSave(nextName);
      }
    });
    input.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        void updateHostOnlineName(input.value);
      }
    });
  }

  if (save && !save.dataset.boundHostName) {
    save.dataset.boundHostName = "1";
    save.addEventListener("click", () => {
      void updateHostOnlineName(input.value);
    });
  }
}

function ensureTestingBotsPanel() {
  let panel = document.getElementById("room-testing-bots-panel");
  if (panel) return panel;

  panel = document.createElement("section");
  panel.id = "room-testing-bots-panel";
  panel.className = "room-testing-bots-panel hidden";
  panel.innerHTML = `
    <div class="room-config-heading">
      <span>${escapeHtml(t("testing_bots_label"))}</span>
      <strong>${escapeHtml(t("testing_bots_title"))}</strong>
    </div>
    <p class="room-config-copy">${escapeHtml(t("testing_bots_desc"))}</p>
    <div class="room-testing-bots-actions">
      <button id="testing-bots-fill-classic" class="secondary-button room-code-button" type="button">${escapeHtml(t("testing_bots_fill_classic"))}</button>
      <button id="testing-bots-fill-advanced" class="secondary-button room-code-button" type="button">${escapeHtml(t("testing_bots_fill_advanced"))}</button>
      <button id="testing-bots-remove" class="secondary-button danger-button" type="button">${escapeHtml(t("testing_bots_remove"))}</button>
    </div>
    <p id="testing-bots-summary" class="draft-config-summary">${escapeHtml(t("testing_bots_note"))}</p>
  `;

  const advancedPanel = document.getElementById("room-advanced-slot-panel");
  const participantPanel = document.querySelector(".room-participant-panel");
  if (advancedPanel?.parentNode) advancedPanel.parentNode.insertBefore(panel, advancedPanel.nextSibling);
  else if (participantPanel?.parentNode) participantPanel.parentNode.insertBefore(panel, participantPanel.nextSibling);
  else roomPlayerConfig?.appendChild(panel);
  return panel;
}

function renderTestingBotsPanel(data = {}) {
  const panel = ensureTestingBotsPanel();
  const config = sanitizeDraftConfig(data.draftConfig || data.draftState?.draftConfig || currentDraftConfig());
  const isHostLobby = currentRole === "host" && !Boolean(data.started);
  panel.classList.toggle("hidden", !isHostLobby);

  const classicButton = document.getElementById("testing-bots-fill-classic");
  const advancedButton = document.getElementById("testing-bots-fill-advanced");
  const removeButton = document.getElementById("testing-bots-remove");
  const summary = document.getElementById("testing-bots-summary");

  if (classicButton) {
    classicButton.style.display = config.mode === "classic" ? "inline-flex" : "none";
    classicButton.onclick = () => fillClassicTestingBots();
  }
  if (advancedButton) {
    advancedButton.style.display = config.mode === "advanced" ? "inline-flex" : "none";
    advancedButton.onclick = () => fillAdvancedTestingBots();
  }
  if (removeButton) removeButton.onclick = () => removeTestingBots();

  if (summary) {
    const participants = onlineParticipantsFromRoom(data);
    const botCount = participants.filter(isTestingBotParticipant).length;
    summary.textContent = t("testing_bots_summary", { count: botCount });
  }
}

async function fillClassicTestingBots() {
  if (!currentRoomCode || currentRole !== "host") return;
  const roomRef = roomRefFor(currentRoomCode);
  if (!roomRef) return;

  try {
    const snapshot = await roomRef.get();
    const data = snapshot.val() || {};
    if (data.started) return;
    const config = sanitizeDraftConfig(data.draftConfig || currentDraftConfig());
    if (config.mode !== "classic") return;

    const assignments = captainAssignmentsFromRoom(data);
    const updates = { updatedAt: onlineNow() };

    ["A", "B"].forEach(team => {
      const assignedId = assignments[team];
      const assignedParticipant = participantByClientId(data, assignedId);
      if (assignedId && !isTestingBotParticipant(assignedParticipant)) return;

      const botId = testingBotClientId(team, "captain");
      const botPayload = testingBotPayload(team, "captain");
      const teamPath = team === "A" ? "teamA" : "teamB";

      updates[`participants/${botId}`] = botPayload;
      updates[`captainAssignments/${team}`] = botId;
      updates[teamPath] = {
        clientId: botId,
        name: botPayload.name,
        connected: true,
        isBot: true,
        role: team === "A" ? "CAPITÁN_ATACANTES" : "CAPITÁN_DEFENSORES",
        lastSeen: onlineNow(),
      };
    });

    await roomRef.update(updates);
  } catch (error) {
    console.warn("No se pudieron crear bots clásicos.", error);
    alert(t("testing_bots_error"));
  }
}

async function fillAdvancedTestingBots() {
  if (!currentRoomCode || currentRole !== "host") return;
  const roomRef = roomRefFor(currentRoomCode);
  if (!roomRef) return;

  try {
    const snapshot = await roomRef.get();
    const data = snapshot.val() || {};
    if (data.started) return;
    const config = sanitizeDraftConfig(data.draftConfig || currentDraftConfig());
    if (config.mode !== "advanced") return;

    const slots = advancedSlotsFromRoom(data, config);
    const updates = { updatedAt: onlineNow() };

    ["A", "B"].forEach(team => {
      advancedSlotsForTeamSize(config.teamSize).forEach(slotKey => {
        if (slots?.[team]?.[slotKey]?.clientId) return;
        const botId = testingBotClientId(team, slotKey);
        const botPayload = testingBotPayload(team, slotKey);
        const slotValue = {
          clientId: botId,
          name: botPayload.name,
          connected: true,
          isBot: true,
          assignedAt: onlineNow(),
          role: advancedSlotLabel(slotKey).toUpperCase(),
        };
        slots[team][slotKey] = slotValue;
        updates[`participants/${botId}`] = botPayload;
        updates[`slots/${team}/${slotKey}`] = slotValue;
      });
    });

    const players = playersPayloadFromAdvancedSlots(slots, config);
    const captainA = slots.A?.captain || null;
    const captainB = slots.B?.captain || null;

    updates.players = players;
    updates["draftState/players"] = players;
    updates["draftState/slots"] = slots;
    updates["captainAssignments/A"] = captainA?.clientId || null;
    updates["captainAssignments/B"] = captainB?.clientId || null;
    updates.teamA = captainA ? { clientId: captainA.clientId, name: captainA.name, connected: true, isBot: Boolean(captainA.isBot), role: "CAPITÁN_ATACANTES", lastSeen: onlineNow() } : null;
    updates.teamB = captainB ? { clientId: captainB.clientId, name: captainB.name, connected: true, isBot: Boolean(captainB.isBot), role: "CAPITÁN_DEFENSORES", lastSeen: onlineNow() } : null;

    await roomRef.update(updates);
  } catch (error) {
    console.warn("No se pudieron crear bots avanzados.", error);
    alert(t("testing_bots_error"));
  }
}

async function removeTestingBots() {
  if (!currentRoomCode || currentRole !== "host") return;
  const roomRef = roomRefFor(currentRoomCode);
  if (!roomRef) return;

  try {
    const snapshot = await roomRef.get();
    const data = snapshot.val() || {};
    if (data.started) return;
    const config = sanitizeDraftConfig(data.draftConfig || currentDraftConfig());
    const participants = data.participants || {};
    const botIds = Object.entries(participants)
      .filter(([, value]) => isTestingBotParticipant(value))
      .map(([clientId]) => clientId);

    const updates = { updatedAt: onlineNow() };
    botIds.forEach(botId => {
      updates[`participants/${botId}`] = null;
    });

    const assignments = captainAssignmentsFromRoom(data);
    ["A", "B"].forEach(team => {
      if (botIds.includes(assignments[team])) {
        updates[`captainAssignments/${team}`] = null;
        updates[team === "A" ? "teamA" : "teamB"] = null;
      }
    });

    const slots = advancedSlotsFromRoom(data, config);
    ["A", "B"].forEach(team => {
      ADVANCED_SLOT_KEYS.forEach(slotKey => {
        const slot = slots?.[team]?.[slotKey];
        if (slot?.clientId && botIds.includes(slot.clientId)) {
          slots[team][slotKey] = null;
          updates[`slots/${team}/${slotKey}`] = null;
        }
      });
    });

    if (config.mode === "advanced") {
      const players = playersPayloadFromAdvancedSlots(slots, config);
      updates.players = players;
      updates["draftState/players"] = players;
      updates["draftState/slots"] = slots;
      const captainA = slots.A?.captain || null;
      const captainB = slots.B?.captain || null;
      updates["captainAssignments/A"] = captainA?.clientId || null;
      updates["captainAssignments/B"] = captainB?.clientId || null;
      updates.teamA = captainA ? { clientId: captainA.clientId, name: captainA.name, connected: captainA.connected, isBot: Boolean(captainA.isBot), role: "CAPITÁN_ATACANTES", lastSeen: onlineNow() } : null;
      updates.teamB = captainB ? { clientId: captainB.clientId, name: captainB.name, connected: captainB.connected, isBot: Boolean(captainB.isBot), role: "CAPITÁN_DEFENSORES", lastSeen: onlineNow() } : null;
    }

    await roomRef.update(updates);
  } catch (error) {
    console.warn("No se pudieron quitar bots.", error);
    alert(t("testing_bots_error"));
  }
}

function updateRoomLobby(data = {}) {
  applyOnlineSettingsFromRoom(data);
  setCurrentOnlineAssignmentFromRoom(data);
  renderParticipantList(data);

  const status = document.getElementById("room-status");
  const config = sanitizeDraftConfig(data.draftConfig || data.draftState?.draftConfig || currentDraftConfig());
  const assignments = captainAssignmentsFromRoom(data);
  const slots = advancedSlotsFromRoom(data, config);
  const bothCaptainsAssigned = Boolean(assignments.A && assignments.B && assignments.A !== assignments.B);
  const advancedComplete = config.mode === "advanced" && areAdvancedSlotsComplete(slots, config);

  if (status) {
    const hostText = data.host?.connected ? t("connected") : t("reconnecting");
    if (config.mode === "advanced") {
      const required = advancedSlotsForTeamSize(config.teamSize).length * 2;
      const assigned = ["A", "B"].reduce((total, team) => total + advancedSlotsForTeamSize(config.teamSize).filter(slotKey => Boolean(slots?.[team]?.[slotKey]?.clientId)).length, 0);
      status.innerHTML = `
        <p>${t("host_leader_spectator")}: ${hostText}</p>
        <p>Modo avanzado: ${assigned}/${required} jugadores</p>
        <p>${config.teamSize}v${config.teamSize} · ${config.bansEnabled ? t("bans_enabled") : t("bans_disabled")}</p>
      `;
    } else {
      status.innerHTML = `
        <p>${t("host_leader_spectator")}: ${hostText}</p>
        <p>${t("captain_attackers")}: ${escapeHtml(captainStatusText(data, "A"))}</p>
        <p>${t("captain_defenders")}: ${escapeHtml(captainStatusText(data, "B"))}</p>
      `;
    }
  }

  populateCaptainSelect(document.getElementById("captain-a-select"), "A", data);
  populateCaptainSelect(document.getElementById("captain-b-select"), "B", data);
  renderHostNamePanel(data);
  renderAdvancedSlotPanel(data);
  renderTestingBotsPanel(data);

  const startButton = document.getElementById("start-online-draft");
  if (startButton) {
    const isHost = currentRole === "host";
    const canStart = config.mode === "advanced" ? advancedComplete : bothCaptainsAssigned;
    const readyCheck = onlineReadyCheckFromRoom(data);
    startButton.style.display = isHost ? "inline-flex" : "none";
    startButton.disabled = Boolean(data.started) || Boolean(readyCheck?.active) || !canStart;
    if (data.started) startButton.textContent = t("draft_started");
    else if (readyCheck?.active) startButton.textContent = t("ready_check_starting");
    else startButton.textContent = canStart ? t("start_draft") : (config.mode === "advanced" ? t("assign_all_players") : t("assign_captains"));
  }

  const closeButton = document.getElementById("close-room-btn");
  if (closeButton) closeButton.style.display = currentRole === "host" ? "inline-flex" : "none";

  const disconnectButton = document.getElementById("disconnect-room-btn");
  if (disconnectButton) disconnectButton.style.display = currentRole === "player" ? "inline-flex" : "none";

  const randomRoomNamesButton = document.getElementById("room-random-player-names");
  if (randomRoomNamesButton) {
    randomRoomNamesButton.disabled = currentRole !== "host" || Boolean(data.started) || config.mode === "advanced";
    randomRoomNamesButton.style.display = config.mode === "advanced" ? "none" : "inline-flex";
  }

  const classicCaptainAssignment = document.querySelector(".room-captain-assignment");
  if (classicCaptainAssignment) classicCaptainAssignment.classList.toggle("hidden", config.mode === "advanced");
  const manualPlayerGrid = document.querySelector(".room-player-config-grid");
  if (manualPlayerGrid) manualPlayerGrid.classList.toggle("hidden", config.mode === "advanced");

  if (roomPlayerConfig) roomPlayerConfig.classList.toggle("hidden", currentRole !== "host" || Boolean(data.started));
  updateRoomDraftConfigUI();
}

function showOnlinePhaseEvent(event, fallbackKey = "") {
  const key = event?.id || fallbackKey;
  if (!key || onlineLastPhaseEventId === key) return false;
  onlineLastPhaseEventId = key;

  if (event?.byClientId && event.byClientId === onlineClientId()) return false;
  if (!state.draftActive || !hasScreenActive(draftScreen)) return false;

  if (event?.type === "banPhase" || fallbackKey.startsWith("banPhase")) {
    showPhaseOverlay(
      t("phase_ban"),
      systemDraftVoiceLines.voice_ban_phase.src,
      systemDraftVoiceLines.voice_ban_phase.text,
      startTurn,
    );
    return true;
  }

  if (event?.type === "pickPhase" || fallbackKey.startsWith("pickPhase")) {
    showPhaseOverlay(
      t("phase_pick"),
      systemDraftVoiceLines.voice_pick_phase.src,
      systemDraftVoiceLines.voice_pick_phase.text,
      startTurn,
    );
    return true;
  }

  return false;
}

function handleOnlineActionEvent(event) {
  if (!event?.id || event.id === onlineLastActionEventId) return;
  onlineLastActionEventId = event.id;
  if (event.byClientId === onlineClientId()) return;
  unlockMediaPlayback(true);
  const character = characterFromOnlineValue(event.character);
  if (!character) return;
  if (event.type === "ban") {
    audioPlay(sounds.ban, 0.86, "sfx");
    playCharacterVoice(character, "ban");
  } else if (event.type === "pick") {
    audioPlay(sounds.confirm, 0.86, "sfx");
    playCharacterVoice(character, "pick");
  } else if (event.type === "preselect") {
    audioPlay(sounds.select, 0.38, "sfx");
  }
}

function hasScreenActive(screen) {
  return Boolean(screen && screen.classList.contains("active"));
}

function applyOnlineScreenForPhase(phase) {
  if (!currentRoomCode || !state.draftActive) return;
  if (phase === "summary") {
    if (!hasScreenActive(summaryScreen)) {
      showSummaryIntro({ fromOnline: true, skipNarration: true });
    }
    return;
  }
  if (phase === "map") {
    if (!hasScreenActive(mapScreen)) {
      startMapSelection({ fromOnline: true });
    } else {
      renderMapGrid();
      updateSelectedMapCopy();
      scheduleOnlineMapAutoStart(700);
    }
    return;
  }
  if (phase === "draft") {
    if (!hasScreenActive(draftScreen)) switchScreen(draftScreen);
  }
}

function onlinePicksBansKey() {
  const names = list => (list || []).map(item => item?.name || String(item || "")).join("|");
  return [
    names(state.picks.A),
    names(state.picks.B),
    names(state.bans.A),
    names(state.bans.B),
  ].join("::");
}

function syncDraftStateFromRoom(data = {}) {
  applyOnlineSettingsFromRoom(data);
  const draftState = data.draftState || {};
  const previousTurnIndex = state.turnIndex;
  const previousDraftSessionId = state.draftSessionId;
  const previousDeadlineAt = state.turnDeadlineAt;
  const previousPhase = state.onlinePhase;
  const previousPicksBansKey = onlinePicksBansKey();
  let hasRemoteDraftState = false;

  suppressOnlinePush = true;
  try {
    if (draftState.phase) {
      state.onlinePhase = draftState.phase;
      hasRemoteDraftState = true;
    }
    if (Number.isFinite(Number(draftState.draftSessionId))) state.draftSessionId = Number(draftState.draftSessionId);
    if (Number.isFinite(Number(draftState.turnIndex))) {
      hasRemoteDraftState = true;
      state.turnIndex = Math.max(0, Math.min(activeTurnCount(), Number(draftState.turnIndex)));
    }
    if (Number.isFinite(Number(draftState.turnStartedAt))) state.turnStartedAt = Number(draftState.turnStartedAt);
    if (Number.isFinite(Number(draftState.turnDeadlineAt))) state.turnDeadlineAt = Number(draftState.turnDeadlineAt);
    if (!state.turnDeadlineAt && Number.isFinite(Number(draftState.timer))) state.timer = Math.max(0, Number(draftState.timer));

    if (draftState.picks) {
      hasRemoteDraftState = true;
      state.picks = {
        A: characterListFromOnlineValue(draftState.picks.A),
        B: characterListFromOnlineValue(draftState.picks.B),
      };
    }

    if (draftState.bans) {
      hasRemoteDraftState = true;
      state.bans = {
        A: characterListFromOnlineValue(draftState.bans.A),
        B: characterListFromOnlineValue(draftState.bans.B),
      };
    }

    if (draftState.pickBatchSelections) {
      state.pickBatchSelections = pickBatchSelectionsFromOnlineValue(draftState.pickBatchSelections);
    }

    if (Object.prototype.hasOwnProperty.call(draftState, "selected")) {
      state.selected = characterFromOnlineValue(draftState.selected);
      if (state.selected && !isCharacterAvailable(state.selected, currentTurn())) {
        state.selected = null;
      }
    }
    if (Object.prototype.hasOwnProperty.call(draftState, "preselectLocked")) state.preselectLocked = Boolean(draftState.preselectLocked);
    if (Object.prototype.hasOwnProperty.call(draftState, "locked")) state.locked = Boolean(draftState.locked);
    state.flashBan = draftState.flashBan || null;
    state.flashPick = draftState.flashPick || null;
    state.banAnimation = onlineCharacterAnimationFromValue(draftState.banAnimation);
    state.pickAnimation = onlineCharacterAnimationFromValue(draftState.pickAnimation);
    if (draftState.roulette) {
      state.roulette = rouletteFromOnlineValue(draftState.roulette);
      if (state.roulette.previewCharacter && !isCharacterAvailable(state.roulette.previewCharacter, currentTurn())) {
        state.roulette.previewCharacter = null;
        state.roulette.highlightedName = null;
        state.roulette.finalName = null;
      }
    }

    if (Object.prototype.hasOwnProperty.call(draftState, "selectedMap")) {
      state.selectedMap = mapFromOnlineValue(draftState.selectedMap);
      hasRemoteDraftState = true;
    }
    if (draftState.mapRoulette) {
      state.mapRoulette = {
        active: Boolean(draftState.mapRoulette.active),
        highlightedId: draftState.mapRoulette.highlightedId || null,
        finalId: draftState.mapRoulette.finalId || null,
      };
    }
  } finally {
    suppressOnlinePush = false;
  }

  handleOnlineActionEvent(draftState.actionEvent);
  handleOnlineAudioEvent(draftState.audioEvent);
  handleOnlineRouletteEvent(draftState.rouletteEvent);
  handleOnlineMapEvent(draftState.mapEvent);
  applyOnlineScreenForPhase(state.onlinePhase);

  const draftScreenActive = document.querySelector(".draft-screen.active");
  const remoteAudioTurnNarration = draftState.audioEvent?.type === "turnNarration" && draftState.audioEvent?.byClientId !== onlineClientId();
  const localPhaseEventPending = draftState.phaseEvent?.byClientId === onlineClientId();
  const enteredPickPhase = previousTurnIndex < activeBanTurnCount() && state.turnIndex >= activeBanTurnCount() && currentTurn()?.type === "pick";
  const handledPhaseEvent = showOnlinePhaseEvent(draftState.phaseEvent, enteredPickPhase ? `pickPhase:${state.draftSessionId}:${state.turnIndex}` : "");
  const remoteTurnChanged = hasRemoteDraftState && data.started && state.draftActive && previousTurnIndex !== state.turnIndex;
  const remoteSessionChanged = previousDraftSessionId !== state.draftSessionId;
  const remoteClockChanged = previousDeadlineAt !== state.turnDeadlineAt || remoteSessionChanged || remoteTurnChanged;
  const picksBansChanged = previousPicksBansKey !== onlinePicksBansKey();

  if (remoteTurnChanged) {
    onlineTurnAutoResolveKey = null;
    state.lastWarningSecond = null;
    if (draftScreenActive && currentTurn() && !handledPhaseEvent && !localPhaseEventPending) {
      if (!remoteAudioTurnNarration) playTurnNarration(currentTurn());
      if (!state.locked && !state.roulette.active) resetTimer();
    }
    if (state.turnIndex >= activeTurnCount() && state.onlinePhase !== "map" && state.onlinePhase !== "summary") {
      startMapSelection();
      return;
    }
  } else if (data.started && state.draftActive && draftScreenActive && currentTurn()) {
    if (remoteClockChanged && !state.locked && !state.roulette.active) {
      resetTimer();
    } else if (currentRoomCode && state.turnDeadlineAt) {
      updateTimerDisplay(onlineRemainingSeconds());
    }
  }

  if (previousPhase !== state.onlinePhase) {
    if (state.onlinePhase === "map") {
      renderMapGrid();
      updateSelectedMapCopy();
    }
    if (state.onlinePhase === "summary") renderSummaryMap();
  }

  if (draftScreenActive) {
    if (remoteTurnChanged || remoteSessionChanged || picksBansChanged || !characterGrid?.children?.length) renderAll();
    else renderDraftStateLight();
  }
  if (document.querySelector(".map-screen.active")) {
    renderMapGrid();
    updateSelectedMapCopy();
  }
  if (document.querySelector(".summary-screen.active")) {
    renderSummaryLineup("A", $("#summary-lineup-a"));
    renderSummaryLineup("B", $("#summary-lineup-b"));
    renderSummaryTeam("A", $("#summary-team-a"));
    renderSummaryTeam("B", $("#summary-team-b"));
    renderSummaryBans("A", $("#summary-bans-a"));
    renderSummaryBans("B", $("#summary-bans-b"));
    renderSummaryMap();
  }

  scheduleTestingBotTurn();
}

function startOnlineDraftFromRoom(data = {}) {
  if (!currentRoomCode) return;
  if (onlineStartedForRoom === currentRoomCode) {
    syncDraftStateFromRoom(data);
    return;
  }
  onlineStartedForRoom = currentRoomCode;
  onlineRoomStartedState = true;
  resetDraftStateBeforeStart();
  syncDraftStateFromRoom(data);
  clearDraftTimeouts();
  state.draftActive = true;
  state.locked = false;
  setupBackgroundVideo();
  startMusic("draft");

  const phase = data.draftState?.phase || "draft";
  if (phase === "map") {
    switchScreen(mapScreen);
    renderMapGrid();
    updateSelectedMapCopy();
    resetTimer();
    return;
  }
  if (phase === "summary") {
    finishDraft({ force: true, silentOnline: true });
    return;
  }

  switchScreen(draftScreen);
  const startedRecently = onlineNow() - Number(data.startedAt || 0) < 4500 && Number(data.draftState?.turnIndex || 0) === 0;
  if (startedRecently) {
    const initialTurn = currentTurn();
    const isBanPhase = initialTurn?.type === "ban";
    showPhaseOverlay(
      isBanPhase ? t("phase_ban") : t("phase_pick"),
      isBanPhase ? systemDraftVoiceLines.voice_ban_phase.src : systemDraftVoiceLines.voice_pick_phase.src,
      isBanPhase ? systemDraftVoiceLines.voice_ban_phase.text : systemDraftVoiceLines.voice_pick_phase.text,
      startTurn,
    );
  } else {
    startTurn({ skipNarration: true });
  }
}

function updateDraftUI(data = {}) {
  onlineLatestRoomData = data || {};
  updateRoomLobby(data);
  renderOnlineReadyCheck(data);
  maybeAdvanceOnlineReadyCheck(data);
  if (data.closed) {
    handleRoomClosed(currentRoomCode);
    return;
  }
  if (data.started) startOnlineDraftFromRoom(data);
  else syncDraftStateFromRoom(data);
}

function listenRoomChanges(roomCode) {
  const roomRef = roomRefFor(roomCode);
  if (!roomRef) {
    alert(onlineUnavailableMessage());
    return;
  }

  if (onlineRoomListenerCode === roomCode) return;
  if (onlineRoomListenerCode) {
    roomRefFor(onlineRoomListenerCode)?.off("value");
  }
  onlineRoomListenerCode = roomCode;

  roomRef.on("value", (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      handleRoomClosed(roomCode);
      return;
    }
    updateDraftUI(data);
  }, (error) => {
    console.error("No se pudo escuchar la sala online.", error);
  });
}

function saveOnlineSession() {
  try {
    if (!currentRoomCode || !currentRole) return;
    localStorage.setItem(ONLINE_SESSION_STORAGE_KEY, JSON.stringify({
      roomCode: currentRoomCode,
      role: currentRole,
      playerTeam,
      playerName: currentOnlinePlayerName,
      clientId: onlineClientId(),
      savedAt: onlineNow(),
    }));
  } catch (_) {}
}

function clearOnlineSession() {
  try { localStorage.removeItem(ONLINE_SESSION_STORAGE_KEY); } catch (_) {}
}

function clearPassiveOnlineSessionOnBoot() {
  // Limpieza local solamente. No consulta ni escribe Firebase.
  // Evita que sesiones antiguas de host/lobby queden listas para reactivarse accidentalmente.
  try {
    const saved = JSON.parse(localStorage.getItem(ONLINE_SESSION_STORAGE_KEY) || "null");
    if (!saved?.roomCode) return;
    const age = onlineNow() - Number(saved.savedAt || 0);
    const maxPassiveAge = 1000 * 60 * 60 * 12;
    if (saved.role === "host" || age > maxPassiveAge) {
      localStorage.removeItem(ONLINE_SESSION_STORAGE_KEY);
    }
  } catch (_) {}
}

function setRoomCodeDisplay(roomCode, hide = true) {
  const codeDisplay = document.getElementById("room-code-display");
  const toggle = document.getElementById("toggle-room-code");
  if (!codeDisplay) return;
  codeDisplay.dataset.hidden = hide ? "1" : "0";
  codeDisplay.textContent = hide ? "••••••" : (roomCode || "----");
  if (toggle) toggle.textContent = hide ? t("show_code") : t("hide_code");
}

function setRoomRoleDisplay(text) {
  const roleDisplay = document.getElementById("room-role-display");
  if (roleDisplay) roleDisplay.textContent = text;
}

function rolePathForCurrentClient() {
  if (currentRole === "host") return "host";
  if (currentRole === "player") return `participants/${onlineClientId()}`;
  return null;
}

function setupPresenceForCurrentRoom() {
  const roomRef = roomRefFor(currentRoomCode);
  const path = rolePathForCurrentClient();
  if (!roomRef || !path) return;
  const seatRef = roomRef.child(path);
  const payload = { connected: true, clientId: onlineClientId(), lastSeen: onlineNow() };
  if (currentRole === "player" && currentOnlinePlayerName) payload.name = currentOnlinePlayerName;
  if (currentRole === "host" && currentOnlinePlayerName) payload.name = currentOnlinePlayerName;
  if (currentRole === "host" && !payload.name) payload.name = "Líder / Host";
  seatRef.update(payload).catch(() => {});
  try {
    seatRef.child("connected").onDisconnect().set(false);
    seatRef.child("lastSeen").onDisconnect().set(onlineNow());
  } catch (_) {}
}

function attachCurrentRoom(roomCode, role, team = null) {
  startOnlineClockSync();
  currentRoomCode = roomCode;
  currentRole = role;
  playerTeam = team;
  onlineStartedForRoom = null;
  setRoomCodeDisplay(roomCode, true);
  if (role === "host") setRoomRoleDisplay(t("leader_spectator"));
  else if (team === "teamA") setRoomRoleDisplay(`${t("role_captain_attackers")}${currentOnlinePlayerName ? ` · ${currentOnlinePlayerName}` : ""}`);
  else if (team === "teamB") setRoomRoleDisplay(`${t("role_captain_defenders")}${currentOnlinePlayerName ? ` · ${currentOnlinePlayerName}` : ""}`);
  else setRoomRoleDisplay(`${t("role_in_room_waiting")}${currentOnlinePlayerName ? ` · ${currentOnlinePlayerName}` : ""}`);
  saveOnlineSession();
  setupPresenceForCurrentRoom();
  switchScreen(roomScreen);
  showHostControls(role === "host");
  updateOnlineBodyClasses();
  listenRoomChanges(roomCode);
  watchRoomDeletion(roomCode);
}

function canClaimSeat(seat) {
  if (!seat) return true;
  if (seat.clientId && seat.clientId === onlineClientId()) return true;
  return seat.connected === false;
}

function blankOnlineDraftState(startPayload = {}) {
  return {
    phase: "lobby",
    draftSessionId: state.draftSessionId,
    turnIndex: 0,
    turnDuration: state.turnDuration,
    turnStartedAt: null,
    turnDeadlineAt: null,
    draftConfig: currentDraftConfig(),
    players: roomPlayersPayload(),
    slots: state.onlineSlots || emptyAdvancedSlots(activeTeamSize()),
    picks: { A: [], B: [] },
    bans: { A: [], B: [] },
    pickBatchSelections: {},
    selected: null,
    preselectLocked: false,
    locked: false,
    flashBan: null,
    flashPick: null,
    banAnimation: null,
    pickAnimation: null,
    roulette: { active: false, highlightedName: null, finalName: null, previewCharacter: null },
    phaseEvent: null,
    captainAssignments: { A: null, B: null },
    selectedMap: null,
    mapRoulette: { active: false, highlightedId: null, finalId: null },
    updatedAt: onlineNow(),
    ...startPayload,
  };
}

async function createOnlineRoom() {
  const database = getRealtimeDatabase();
  if (!database) {
    alert(onlineUnavailableMessage());
    return;
  }
  startOnlineClockSync();

  readPlayers();
  try {
    const storedHostName = String(localStorage.getItem(ONLINE_PLAYER_NAME_STORAGE_KEY) || "").trim();
    currentOnlinePlayerName = sanitizeOnlineDisplayName(currentOnlinePlayerName || storedHostName || "Líder / Host");
  } catch (_) {
    currentOnlinePlayerName = sanitizeOnlineDisplayName(currentOnlinePlayerName || "Líder / Host");
  }

  const roomCode = generateRoomCode();
  const roomRef = database.ref("rooms/" + roomCode);
  state.onlinePhase = "lobby";

  const initialConfig = currentDraftConfig();
  state.onlineSlots = emptyAdvancedSlots(initialConfig.teamSize);
  await roomRef.set({
    createdAt: onlineNow(),
    updatedAt: onlineNow(),
    started: false,
    closed: false,
    turnDuration: state.turnDuration,
    draftConfig: initialConfig,
    players: initialConfig.mode === "advanced" ? playersPayloadFromAdvancedSlots(state.onlineSlots, initialConfig) : roomPlayersPayload(),
    host: { connected: true, clientId: onlineClientId(), name: currentOnlinePlayerName || "Líder / Host", role: "LÍDER_ESPECTADOR", lastSeen: onlineNow() },
    participants: {},
    captainAssignments: { A: null, B: null },
    slots: state.onlineSlots,
    teamA: null,
    teamB: null,
    draftState: blankOnlineDraftState({ slots: state.onlineSlots }),
  });

  attachCurrentRoom(roomCode, "host", null);
}

function normalizeRoomCode(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

function showJoinNameModal(roomCode) {
  pendingJoinRoomCode = normalizeRoomCode(roomCode);
  const modal = document.getElementById("join-name-modal");
  const preview = document.getElementById("join-room-code-preview");
  const input = document.getElementById("join-player-name");
  if (!pendingJoinRoomCode) {
    alert(t("enter_room_code_alert"));
    return;
  }
  if (preview) preview.textContent = pendingJoinRoomCode;
  if (input && !input.value) {
    try { input.value = localStorage.getItem(ONLINE_PLAYER_NAME_STORAGE_KEY) || ""; } catch (_) {}
  }
  if (modal) {
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
  }
  window.setTimeout(() => input?.focus(), 40);
}

function hideJoinNameModal() {
  const modal = document.getElementById("join-name-modal");
  if (modal) {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  }
}

async function joinOnlineRoom(options = {}) {
  const input = document.getElementById("room-input");
  const nameInput = document.getElementById("join-player-name");
  const roomCode = normalizeRoomCode(options.roomCode || pendingJoinRoomCode || input?.value);
  const hasProvidedName = Object.prototype.hasOwnProperty.call(options, "nameOverride");
  const playerName = String(hasProvidedName ? options.nameOverride : "").trim();
  if (!roomCode) return alert("Ingresa un código de sala");

  // Primer click en UNIRSE: solo abre la interfaz de nombre.
  // La conexión real a Firebase empieza recién al confirmar el nombre.
  if (!hasProvidedName) {
    showJoinNameModal(roomCode);
    return;
  }

  if (!playerName) {
    showJoinNameModal(roomCode);
    alert("Ingresa tu nombre para que el líder pueda asignarte como capitán.");
    nameInput?.focus();
    return;
  }

  const database = getRealtimeDatabase();
  if (!database) {
    alert(onlineUnavailableMessage());
    return;
  }
  startOnlineClockSync();

  try { localStorage.setItem(ONLINE_PLAYER_NAME_STORAGE_KEY, playerName); } catch (_) {}
  currentOnlinePlayerName = playerName;

  const roomRef = database.ref("rooms/" + roomCode);
  const snapshot = await roomRef.get();

  if (!snapshot.exists()) {
    alert("La sala no existe");
    return;
  }

  const roomData = snapshot.val() || {};
  if (roomData.closed) {
    alert("La sala ya fue cerrada");
    return;
  }

  const clientId = onlineClientId();
  const alreadyInRoom = Boolean(roomData.participants?.[clientId]);
  if (roomData.started && !alreadyInRoom) {
    alert("El draft ya fue iniciado. Solo pueden reconectar los usuarios que ya estaban en la sala.");
    return;
  }

  await roomRef.child(`participants/${clientId}`).update({
    name: playerName,
    connected: true,
    clientId,
    role: "PARTICIPANTE",
    joinedAt: roomData.participants?.[clientId]?.joinedAt || onlineNow(),
    lastSeen: onlineNow(),
  });

  const assignments = captainAssignmentsFromRoom(roomData);
  let assignedTeam = null;
  if (assignments.A === clientId) assignedTeam = "teamA";
  else if (assignments.B === clientId) assignedTeam = "teamB";

  hideJoinNameModal();
  pendingJoinRoomCode = null;
  attachCurrentRoom(roomCode, "player", assignedTeam);
}

async function runCharacterRoulette(validCharacters) {
  const sessionId = state.draftSessionId;
  if (!isDraftSessionActive(sessionId)) return null;

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
    if (currentRoomCode) pushOnlineDraftState({
      phase: "draft",
      rouletteEvent: { id: `rouletteTick_${onlineNow()}_${step}_${selected.name}`, type: "rouletteTick", character: selected.name, byClientId: onlineClientId() },
    });
    await delay(weightedRandomDelay(step, totalSteps));
    if (!isDraftSessionActive(sessionId)) return null;
  }

  if (!isDraftSessionActive(sessionId)) return null;
  audioPlay(sounds.select, 0.7, "sfx");

  state.roulette.highlightedName = selected.name;
  state.roulette.finalName = selected.name;
  state.selected = selected;
  updateCharacterRoulettePreview(selected);
  if (currentRoomCode) pushOnlineDraftState({
    phase: "draft",
    rouletteEvent: { id: `rouletteSelected_${onlineNow()}_${selected.name}`, type: "rouletteSelected", character: selected.name, byClientId: onlineClientId() },
  });
  await delay(520);
  if (!isDraftSessionActive(sessionId)) return null;

  state.roulette.active = false;
  clearCharacterRouletteVisuals();
  renderStageCharacters();
  renderSlots();
  renderBans();
  renderSelected();
  return selected;
}

async function autoResolveTurn(options = {}) {
  const sessionId = state.draftSessionId;
  const allowOnlineSystem = Boolean(options.onlineSystem);
  if (!isDraftSessionActive(sessionId) || state.locked || state.roulette.active || (!allowOnlineSystem && !canControlCurrentTurn())) return;
  const valid = getValidCharacters();

  // Primero se reproduce la línea "Tiempo agotado".
  // Después de 2 segundos empieza la ruleta visual + audio roulette.
  state.locked = true;
  pushOnlineDraftState({ phase: "draft", audioEvent: createOnlineAudioEvent("randomStart") });
  playNarration(systemDraftVoiceLines.random_start.src, systemDraftVoiceLines.random_start.text, 0.9);
  await delay(2000);
  if (!isDraftSessionActive(sessionId)) return;

  const selected = await runCharacterRoulette(valid);
  if (!isDraftSessionActive(sessionId)) return;
  if (!selected) {
    state.turnIndex += 1;
    state.locked = false;
    startTurn();
    return;
  }

  state.locked = false;
  state.selected = selected;
  confirmTurn(true, { onlineSystem: allowOnlineSystem });
}

function proceedAfterTurn() {
  if (!isDraftSessionActive()) return;
  if (state.turnIndex >= activeTurnCount()) {
    startMapSelection();
    return;
  }

  const nextTurn = currentTurn();
  const justEnteredPickPhase = activeBanTurnCount() > 0 && state.turnIndex === activeBanTurnCount();
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

function phaseOverlayDurationMs() {
  return Math.round(2200 + (state.settings.animationDuration * 1000));
}

function prepareClockForTurnIndex(turnIndex, delayMs = 0) {
  const startAt = (currentRoomCode ? onlineNow() : Date.now()) + Math.max(0, delayMs);
  state.turnStartedAt = startAt;
  state.turnDeadlineAt = startAt + (state.turnDuration * 1000);
}

function confirmTurn(isAuto = false, options = {}) {
  const allowOnlineSystem = Boolean(options.onlineSystem);
  if (!isDraftSessionActive() || (!allowOnlineSystem && !canControlCurrentTurn())) return;
  const turn = currentTurn();
  if (!turn || state.locked) return;
  if (!state.selected || !isCharacterAvailable(state.selected, turn)) return;

  state.locked = true;
  clearInterval(state.timerId);
  timerCore.classList.remove("timer-warning");

  const confirmedCharacter = state.selected;
  let wait = isAuto ? 650 : 520;
  let actionEvent = null;

  if (turn.type === "ban") {
    state.bans[turn.team].push(confirmedCharacter);
    state.flashBan = confirmedCharacter.name;
    state.banAnimation = { character: confirmedCharacter, team: turn.team };
    actionEvent = createOnlineActionEvent("ban", turn.team, confirmedCharacter, { isAuto });
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
    actionEvent = createOnlineActionEvent("pick", turn.team, confirmedCharacter, { isAuto });
    audioPlay(sounds.confirm, 0.86, "sfx");
    playCharacterVoice(confirmedCharacter, "pick");
    wait = isAuto ? 1250 : 1400;
  }

  wait = Math.round(wait * (state.settings.animationDuration || 1));
  renderAll();
  pushOnlineDraftState({ actionEvent, phase: "draft" });

  scheduleDraftTimeout(() => {
    state.flashBan = null;
    state.flashPick = null;
    state.banAnimation = null;
    state.pickAnimation = null;
    state.selected = null;
    state.preselectLocked = false;
    state.locked = false;
    state.roulette = { active: false, highlightedName: null, finalName: null, previewCharacter: null };
    state.turnIndex += 1;
    onlineTurnAutoResolveKey = null;

    if (currentRoomCode) {
      if (state.turnIndex >= activeTurnCount()) {
        state.onlinePhase = "map";
        state.turnStartedAt = null;
        state.turnDeadlineAt = null;
        pushOnlineDraftState({ phase: "map", actionEvent: null, audioEvent: createOnlineAudioEvent("mapSelector", { playForOrigin: true }) });
      } else {
        const nextTurn = currentTurn();
        const justEnteredPickPhase = activeBanTurnCount() > 0 && state.turnIndex === activeBanTurnCount() && nextTurn?.type === "pick";
        prepareClockForTurnIndex(state.turnIndex, justEnteredPickPhase ? phaseOverlayDurationMs() : 0);
        state.onlinePhase = "draft";
        const phaseEvent = justEnteredPickPhase ? createOnlinePhaseEvent("pickPhase") : null;
        if (phaseEvent) onlineLastPhaseEventId = phaseEvent.id;
        const audioEvent = justEnteredPickPhase ? null : createOnlineAudioEvent("turnNarration", { turnIndex: state.turnIndex });
        pushOnlineDraftState({ phase: "draft", actionEvent: null, phaseEvent, audioEvent });
      }
    } else {
      pushOnlineDraftState();
    }

    proceedAfterTurn();
  }, wait);
}

function turnVoiceKey(turn) {
  if (!turn) return "";
  if (turn.type === "pick") return "pick";

  if (turn.type === "ban") {
    const banIndex = (Number.isFinite(Number(turn.banIndex)) ? Number(turn.banIndex) : 0);
    // Orden solicitado:
    // Bloqueo 1: TEAM A => team_a_ban
    // Bloqueo 2: TEAM B => team_b_ban
    // Bloqueo 3: TEAM A => team_a_ban_scissors
    // Bloqueo 4: TEAM B => team_b_ban_scissors
    return banIndex >= 2 ? "ban_scissors" : "ban";
  }

  return "ban";
}

function advancedTurnVoiceLineForViewer(turn) {
  if (!turn || !isAdvancedDraftConfig()) return null;
  const ownTeam = currentOnlineTeamLetter();
  const assignedSlot = advancedSlotForTurn(turn);
  const isMine = Boolean(assignedSlot?.clientId && assignedSlot.clientId === onlineClientId());
  const sameTeam = Boolean(ownTeam && ownTeam === turn.team);
  const target = advancedTurnTargetKey(turn);

  if (isMine) {
    if (target === "pick_laminant") return systemDraftVoiceLines.advanced_please_pick_laminant;
    if (target === "ban_scissors_laminant") return systemDraftVoiceLines.advanced_please_ban_scissors_laminant;
    return systemDraftVoiceLines.advanced_please_ban_laminant;
  }

  if (sameTeam) {
    if (target === "pick_laminant") return systemDraftVoiceLines.advanced_team_pick_laminant;
    if (target === "ban_scissors_laminant") return systemDraftVoiceLines.advanced_team_ban_scissors_laminant;
    return systemDraftVoiceLines.advanced_team_ban_laminant;
  }

  return null;
}

function turnNarrationVoiceLine(turn) {
  const advancedVoiceLine = advancedTurnVoiceLineForViewer(turn);
  if (advancedVoiceLine) return advancedVoiceLine;

  const key = turnVoiceKey(turn);
  if (turn?.team === "A" && key === "ban_scissors") return systemDraftVoiceLines.team_a_ban_scissors;
  if (turn?.team === "B" && key === "ban_scissors") return systemDraftVoiceLines.team_b_ban_scissors;
  if (turn?.team === "A" && key === "ban") return systemDraftVoiceLines.team_a_ban;
  if (turn?.team === "B" && key === "ban") return systemDraftVoiceLines.team_b_ban;
  if (turn?.team === "A" && key === "pick") return systemDraftVoiceLines.team_a_pick;
  if (turn?.team === "B" && key === "pick") return systemDraftVoiceLines.team_b_pick;
  return null;
}

function turnNarrationText(turn) {
  return turnNarrationVoiceLine(turn)?.text || "";
}

function playTurnNarration(turn) {
  if (!turn) return;
  const voiceLine = turnNarrationVoiceLine(turn);
  // Si hay voz grabada se reproduce desde archivos locales; si la voz elegida es lectura de bot,
  // el navegador lee el texto traducido del turno.
  playNarration(voiceLine?.src, voiceLine?.text || "", 0.88);
}

function startTurn(options = {}) {
  if (!isDraftSessionActive()) return;
  state.selected = null;
  state.preselectLocked = false;
  state.locked = false;
  document.body.classList.remove("overlay-lock", "phase-announcing");
  renderAll();
  if (!options.skipNarration) playTurnNarration(currentTurn());
  resetTimer();
  scheduleTestingBotTurn();
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
    button.textContent = t("starting");
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
  state.turnStartedAt = null;
  state.turnDeadlineAt = null;
  onlineSummaryIntroShownKey = null;
  state.onlinePhase = currentRoomCode ? "draft" : "local";
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
  clearDraftTimeouts();
  state.draftSessionId += 1;
  state.draftActive = true;
  setStartDraftLoading(false);
  state.startingDraft = false;

  switchScreen(draftScreen);
  setupBackgroundVideo();
  startMusic("draft");
  const initialTurn = currentTurn();
  const isBanPhase = initialTurn?.type === "ban";
  showPhaseOverlay(
    isBanPhase ? t("phase_ban") : t("phase_pick"),
    isBanPhase ? systemDraftVoiceLines.voice_ban_phase.src : systemDraftVoiceLines.voice_pick_phase.src,
    isBanPhase ? systemDraftVoiceLines.voice_ban_phase.text : systemDraftVoiceLines.voice_pick_phase.text,
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
  abortDraftRuntime();
  readPlayers();
  state.draftSessionId += 1;
  state.draftActive = true;
  state.locked = false;
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

  if (currentDraftConfig().bansEnabled) {
    const aBan1 = takeOne(c => c.faction === "pus"); if (aBan1) bansA.push(aBan1);
    const bBan1 = takeOne(c => c.faction === "scissors"); if (bBan1) bansB.push(bBan1);
    const aBan2 = takeOne(c => c.faction === "urbino"); if (aBan2) bansA.push(aBan2);
    const bBan2 = takeOne(c => c.faction === "urbino"); if (bBan2) bansB.push(bBan2);
  }

  const pickForA = () => takeOne(c => c.faction === "scissors" || c.faction === "urbino");
  const pickForB = () => takeOne(c => c.faction === "pus" || c.faction === "urbino");

  const teamSize = activeTeamSize();
  while (picksA.length < teamSize) { const c = pickForA(); if (!c) break; picksA.push(c); }
  while (picksB.length < teamSize) { const c = pickForB(); if (!c) break; picksB.push(c); }

  state.bans.A = bansA;
  state.bans.B = bansB;
  state.picks.A = picksA;
  state.picks.B = picksB;
  state.selectedMap = randomFrom(maps);
  startMusic("draft");
  finishDraft({ force: true });
}

async function cancelDraft() {
  if (currentRoomCode) {
    if (currentRole !== "host") return;
    await closeCurrentRoom();
    return;
  }

  if (state.returningToConfig) return;
  state.returningToConfig = true;

  // Cierre real del sistema draft:
  // cancela timers, ruletas, overlays, callbacks pendientes y audios de narración/personajes.
  abortDraftRuntime();

  await playUiSound(sounds.backConfig, 1);

  // Pequeña espera para que el sonido de volver no se corte con el cambio de pantalla.
  await waitForUiSoundAndContinue(420);

  activateSetupTab("menu");
  switchScreen(setupScreen);
  startMusic("menu");
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
  mapGrid.dataset.mapCount = String(maps.length);
  mapGrid.classList.toggle("map-grid-many", maps.length > 6);
  mapGrid.classList.toggle("map-grid-xl", maps.length > 9);

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
      if (state.mapRoulette.active || !canControlMapSelection()) return;
      state.selectedMap = map;
      state.mapRoulette.finalId = map.id;
      pushOnlineDraftState();
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

function onlineMapAutoKey() {
  return `${currentRoomCode || "local"}:${state.draftSessionId}:map:${state.onlinePhase}`;
}

function canAutoRunOnlineMapRoulette() {
  // La ruleta de mapa es del sistema, no una acción manual del capitán.
  // Cualquier cliente de la sala puede reclamarla con transacción para evitar
  // que se quede esperando si el host/navegador queda en pausa.
  return Boolean(currentRoomCode && (currentRole === "host" || currentRole === "player") && state.onlinePhase === "map" && !state.selectedMap && !state.mapRoulette.active);
}

function scheduleOnlineMapAutoStart(delayMs = 900) {
  if (!canAutoRunOnlineMapRoulette()) return;
  const key = onlineMapAutoKey();
  if (onlineMapAutoResolveKey === key) return;
  onlineMapAutoResolveKey = key;
  scheduleDraftTimeout(() => {
    if (onlineMapAutoKey() !== key || !canAutoRunOnlineMapRoulette()) return;
    void tryClaimOnlineMapRoulette(key);
  }, delayMs);
}

async function tryClaimOnlineMapRoulette(key = onlineMapAutoKey()) {
  if (!canAutoRunOnlineMapRoulette()) return false;
  const roomRef = roomRefFor(currentRoomCode);
  if (!roomRef) return false;
  try {
    const claimRef = roomRef.child("draftState/mapResolveClaim");
    const result = await claimRef.transaction((claim) => {
      const claimAt = Number(claim?.at || 0);
      const claimIsFresh = claimAt && Math.abs(onlineNow() - claimAt) < 12000;
      if (claim && claim.key === key && claimIsFresh) return;
      return { key, clientId: onlineClientId(), at: onlineNow() };
    });
    if (!result?.committed) return false;
    if (!canAutoRunOnlineMapRoulette()) return false;
    await runMapRoulette({ onlineSystem: true });
    return true;
  } catch (error) {
    console.warn("No se pudo reclamar la ruleta automática de mapa.", error);
    onlineMapAutoResolveKey = null;
    return false;
  }
}

async function runMapRoulette(options = {}) {
  const sessionId = state.draftSessionId;
  if (!isDraftSessionActive(sessionId) || state.mapRoulette.active || !maps.length) return;
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
    if (currentRoomCode) pushOnlineDraftState({
      phase: "map",
      mapEvent: { id: `mapTick_${onlineNow()}_${step}_${selected.id}`, type: "mapTick", mapId: selected.id, byClientId: onlineClientId() },
    });
    await delay(weightedRandomDelay(step, totalSteps));
    if (!isDraftSessionActive(sessionId)) return;
  }

  if (!isDraftSessionActive(sessionId)) return;
  audioPlay(sounds.confirm, 0.86, "sfx");

  state.selectedMap = selected;
  state.mapRoulette.highlightedId = selected.id;
  state.mapRoulette.finalId = selected.id;
  pushOnlineDraftState({
    phase: "map",
    mapEvent: { id: `mapSelected_${onlineNow()}_${selected.id}`, type: "mapSelected", mapId: selected.id, byClientId: onlineClientId() },
  });
  updateMapRouletteClasses();
  updateSelectedMapCopy();
  await delay(980);
  if (!isDraftSessionActive(sessionId)) return;

  state.mapRoulette.active = false;
  clearMapRouletteVisuals();
  showSummaryIntro();
}

function startMapSelection(options = {}) {
  if (!isDraftSessionActive()) return;
  clearInterval(state.timerId);
  state.onlinePhase = currentRoomCode ? "map" : state.onlinePhase;
  state.locked = true;
  state.selected = null;
  state.flashBan = null;
  state.flashPick = null;
  state.banAnimation = null;
  state.pickAnimation = null;
  state.roulette = { active: false, highlightedName: null, finalName: null, previewCharacter: null };
  state.mapRoulette = state.mapRoulette || { active: false, highlightedId: null, finalId: null };
  switchScreen(mapScreen);
  mapScreen?.classList.remove("map-enter");
  void mapScreen?.offsetWidth;
  mapScreen?.classList.add("map-enter");
  renderMapGrid();
  updateSelectedMapCopy();

  const onlineMode = Boolean(currentRoomCode);
  if (randomizeMapButton) randomizeMapButton.style.display = onlineMode ? "none" : "inline-flex";

  if (onlineMode) {
    if (canControlMapSelection()) {
      pushOnlineDraftState({ phase: "map" });
      if (!options.fromOnline) {
        pushOnlineDraftState({ phase: "map", audioEvent: createOnlineAudioEvent("mapSelector") });
        playNarration(systemDraftVoiceLines.map_selector_voice.src, systemDraftVoiceLines.map_selector_voice.text, 0.92);
      }
    } else if (selectedMapName) {
      selectedMapName.textContent = t("map_waiting_auto");
    }
    scheduleOnlineMapAutoStart(canControlMapSelection() ? 850 : 1200);
    return;
  }

  playNarration(systemDraftVoiceLines.map_selector_voice.src, systemDraftVoiceLines.map_selector_voice.text, 0.92);
  scheduleDraftTimeout(() => runMapRoulette(), 900);
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

function showSummaryIntro(options = {}) {
  if (!isDraftSessionActive()) return;

  const key = `${currentRoomCode || "local"}:${state.draftSessionId}:summary`;
  if (onlineSummaryIntroShownKey === key && !options.force) return;
  onlineSummaryIntroShownKey = key;

  const shouldPushOnline = Boolean(currentRoomCode && !options.fromOnline);
  const shouldPlayNarration = !options.skipNarration;

  if (shouldPushOnline) {
    pushOnlineDraftState({
      phase: "summary",
      audioEvent: createOnlineAudioEvent("finishDraft", { playForOrigin: false }),
    });
  }

  if (shouldPlayNarration) {
    playNarration(systemDraftVoiceLines.voice_finish_draft.src, systemDraftVoiceLines.voice_finish_draft.text, 0.92);
  }

  showPhaseOverlay(
    t("draft_finished_title"),
    "",
    t("draft_finished_subtitle"),
    finishDraft,
  );
}


function ensureOnlineLeaveButton() {
  let button = document.getElementById("online-leave-floating");
  if (button) return button;
  button = document.createElement("button");
  button.id = "online-leave-floating";
  button.type = "button";
  button.className = "online-leave-floating hidden";
  button.textContent = t("disconnect_room");
  button.addEventListener("click", () => {
    if (currentRole === "player" && currentRoomCode) disconnectCurrentRoom();
  });
  document.body.appendChild(button);
  return button;
}

function updateOnlineLeaveButtonVisibility() {
  const button = ensureOnlineLeaveButton();
  button.textContent = t("disconnect_room");
  const canShow = Boolean(currentRoomCode && currentRole === "player" && (hasScreenActive(summaryScreen) || state.onlinePhase === "summary"));
  button.classList.toggle("hidden", !canShow);
}

function finishDraft(options = {}) {
  const force = Boolean(options.force);
  if (!force && !isDraftSessionActive()) return;
  state.draftActive = false;
  state.onlinePhase = currentRoomCode ? "summary" : state.onlinePhase;
  clearDraftTimeouts();
  clearInterval(state.timerId);
  state.locked = false;
  document.body.classList.remove("overlay-lock", "phase-announcing");
  if (currentRoomCode && !options.silentOnline) pushOnlineDraftState({ phase: "summary" });
  renderSummaryLineup("A", $("#summary-lineup-a"));
  renderSummaryLineup("B", $("#summary-lineup-b"));
  renderSummaryTeam("A", $("#summary-team-a"));
  renderSummaryTeam("B", $("#summary-team-b"));
  renderSummaryBans("A", $("#summary-bans-a"));
  renderSummaryBans("B", $("#summary-bans-b"));
  renderSummaryMap();
  switchScreen(summaryScreen);
  updateOnlineLeaveButtonVisibility();
  summaryScreen?.classList.remove("summary-enter");
  void summaryScreen?.offsetWidth;
  summaryScreen?.classList.add("summary-enter");
}

async function restartDraft() {
  if (currentRoomCode) {
    if (currentRole === "host") await closeCurrentRoom();
    return;
  }
  if (state.returningToConfig) return;
  state.returningToConfig = true;
  await playUiSound(sounds.backConfig, 1);
  await waitForUiSoundAndContinue(420);

  abortDraftRuntime();
  state.locked = false;
  state.banAnimation = null;
  state.pickAnimation = null;
  state.roulette = { active: false, highlightedName: null, finalName: null, previewCharacter: null };
  state.mapRoulette = { active: false, highlightedId: null, finalId: null };
  state.selectedMap = null;
  document.body.classList.remove("overlay-lock", "phase-announcing");
  activateSetupTab("menu");
  switchScreen(setupScreen);
  startMusic("menu");
  state.returningToConfig = false;
}

function init() {
  applyDraftFullbodyBoxLayout();
  resizeGameRoot();
  window.addEventListener("resize", resizeGameRoot);
  setupInputs();
  setupRoomPlayerInputs();
  setupConfigControls();
  applyLanguage(state.settings.language);
  setupDevelopmentTools();
  setupBackgroundVideo();
  setupMediaUnlockHandlers();
  updateMusicToggleButton();
  renderAll();
  startIntroSequence();
  $("#start-draft").addEventListener("click", openLocalDraftConfig);
  $("#create-room").addEventListener("click",createOnlineRoom);
  $("#join-room").addEventListener("click", joinOnlineRoom);
  $("#confirm-action").addEventListener("click", () => confirmTurn(false));
  $("#music-toggle").addEventListener("click", toggleMusic);
  cancelDraftButton?.addEventListener("click", cancelDraft);
  $("#restart-draft").addEventListener("click", restartDraft);
  simulateSummaryButton?.addEventListener("click", simulateRandomSummary);
  randomPlayerNamesButton?.addEventListener("click", applyRandomPlayerNames);
  manualPlayerNamesButton?.addEventListener("click", applyManualPlayerNames);
  setupJoinNameModal();
  setupOnlineControls();
  setupLocalConfigControls();
  clearPassiveOnlineSessionOnBoot();
  // v3.1.4: No restaurar sesiones online automáticamente al cargar la página.
  // Evita que solo abrir la web escriba presencia o reactive salas antiguas en Firebase.
  // La reconexión debe hacerse de forma explícita usando el código de sala.
  // setTimeout(() => { void tryRestoreOnlineSession(); }, 850);
  randomizeMapButton?.addEventListener("click", () => {
    if (!isDraftSessionActive() || !canControlMapSelection()) return;
    playNarration(systemDraftVoiceLines.map_selector_voice.src, systemDraftVoiceLines.map_selector_voice.text, 0.92);
    scheduleDraftTimeout(() => runMapRoulette(), 180);
  });
}

init();


function setupRoomPlayerInputs() {
  const build = (team, container) => {
    if (!container) return;
    container.innerHTML = "";
    for (let i = 0; i < 5; i += 1) {
      const input = document.createElement("input");
      input.className = "room-player-input";
      input.type = "text";
      input.dataset.team = team;
      input.dataset.index = String(i);
      input.value = state.players[team][i] || defaultPlayerName(team, i);
      input.placeholder = defaultPlayerName(team, i);
      input.addEventListener("input", () => {
        state.players[team][i] = input.value.trim() || input.placeholder;
        const setupInput = document.querySelector(`.player-input[data-team="${team}"][data-index="${i}"]`);
        if (setupInput && setupInput.value !== input.value) setupInput.value = input.value;
        scheduleRoomPlayerConfigSave();
      });
      container.appendChild(input);
    }
  };

  build("A", roomTeamAInputs);
  build("B", roomTeamBInputs);
  updateDraftConfigVisibility();
}

function scheduleRoomPlayerConfigSave() {
  if (!currentRoomCode || currentRole !== "host") return;
  clearTimeout(roomPlayerNameSaveTimer);
  roomPlayerNameSaveTimer = setTimeout(pushRoomLobbyConfig, 180);
}

function pushRoomLobbyConfig() {
  if (!currentRoomCode || currentRole !== "host") return;
  const roomRef = roomRefFor(currentRoomCode);
  if (!roomRef) return;
  const draftConfig = currentDraftConfig();
  let players;

  if (draftConfig.mode === "advanced") {
    players = playersPayloadFromAdvancedSlots(state.onlineSlots, draftConfig);
  } else {
    readPlayers();
    players = { A: [...state.players.A], B: [...state.players.B] };
  }

  roomRef.update({
    players,
    turnDuration: state.turnDuration,
    draftConfig,
    updatedAt: onlineNow(),
    "draftState/players": players,
    "draftState/turnDuration": state.turnDuration,
    "draftState/draftConfig": draftConfig,
    "draftState/slots": state.onlineSlots || emptyAdvancedSlots(draftConfig.teamSize),
  }).catch(error => console.warn("No se pudo sincronizar la configuración de sala.", error));
}

async function assignOnlineCaptain(team, clientId) {
  if (!currentRoomCode || currentRole !== "host") return;
  const normalizedTeam = team === "B" ? "B" : "A";
  const otherTeam = normalizedTeam === "A" ? "B" : "A";
  const roomRef = roomRefFor(currentRoomCode);
  if (!roomRef) return;

  try {
    const snapshot = await roomRef.get();
    const data = snapshot.val() || {};
    if (data.started) return;
    const participant = clientId ? participantByClientId(data, clientId) : null;
    const teamPath = normalizedTeam === "A" ? "teamA" : "teamB";
    const otherPath = otherTeam === "A" ? "teamA" : "teamB";
    const updates = {
      [`captainAssignments/${normalizedTeam}`]: clientId || null,
      [teamPath]: participant ? {
        clientId,
        name: participant.name,
        connected: participant.connected,
        role: normalizedTeam === "A" ? "CAPITÁN_ATACANTES" : "CAPITÁN_DEFENSORES",
        lastSeen: participant.lastSeen || onlineNow(),
      } : null,
      updatedAt: onlineNow(),
    };

    const assignments = captainAssignmentsFromRoom(data);
    if (clientId && assignments[otherTeam] === clientId) {
      updates[`captainAssignments/${otherTeam}`] = null;
      updates[otherPath] = null;
    }

    await roomRef.update(updates);
  } catch (error) {
    console.warn("No se pudo asignar el capitán online.", error);
    alert("No se pudo asignar el capitán. Intenta de nuevo.");
  }
}

function setupLocalConfigControls() {
  document.querySelectorAll("[data-local-team-size]").forEach(button => {
    button.addEventListener("click", () => {
      applyDraftConfigPatch({ teamSize: Number(button.dataset.localTeamSize) });
    });
  });
  document.getElementById("local-bans-enabled")?.addEventListener("change", (event) => {
    applyDraftConfigPatch({ bansEnabled: Boolean(event.currentTarget.checked) });
  });
  document.getElementById("local-config-start")?.addEventListener("click", () => {
    closeLocalDraftConfig();
    void startDraft();
  });
  document.getElementById("local-config-cancel")?.addEventListener("click", closeLocalDraftConfig);
  document.querySelectorAll("[data-close-local-config]").forEach(target => {
    target.addEventListener("click", closeLocalDraftConfig);
  });
}

function setupJoinNameModal() {
  const modal = document.getElementById("join-name-modal");
  const confirm = document.getElementById("join-name-confirm");
  const cancel = document.getElementById("join-name-cancel");
  const input = document.getElementById("join-player-name");
  const closeTargets = modal?.querySelectorAll("[data-close-join-name]") || [];

  const close = () => {
    hideJoinNameModal();
    pendingJoinRoomCode = null;
  };

  confirm?.addEventListener("click", () => {
    const playerName = String(input?.value || "").trim();
    void joinOnlineRoom({ roomCode: pendingJoinRoomCode, nameOverride: playerName });
  });
  cancel?.addEventListener("click", close);
  closeTargets.forEach(target => target.addEventListener("click", close));
  input?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const playerName = String(input.value || "").trim();
      void joinOnlineRoom({ roomCode: pendingJoinRoomCode, nameOverride: playerName });
    }
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  });
}


function onlineReadyCheckFromRoom(data = {}) {
  return data.readyCheck || data.draftState?.readyCheck || null;
}

function onlineRequiredReadyUsersFromPrepared(roomData = {}, prepared = null) {
  const draftConfig = prepared?.draftConfig || sanitizeDraftConfig(roomData.draftConfig || currentDraftConfig());
  const users = [];
  const pushUnique = (entry = {}) => {
    if (!entry.clientId || users.some(user => user.clientId === entry.clientId)) return;
    users.push({
      clientId: entry.clientId,
      name: String(entry.name || `Usuario ${String(entry.clientId).slice(-4)}`),
      team: entry.team || null,
      slotKey: entry.slotKey || null,
      slotLabel: entry.slotLabel || "",
      isBot: Boolean(entry.isBot),
      order: users.length,
    });
  };

  if (draftConfig.mode === "advanced") {
    const slots = prepared?.slots || advancedSlotsFromRoom(roomData, draftConfig);
    ["A", "B"].forEach(team => {
      advancedSlotsForTeamSize(draftConfig.teamSize).forEach(slotKey => {
        const slot = slots?.[team]?.[slotKey];
        if (!slot?.clientId) return;
        pushUnique({
          clientId: slot.clientId,
          name: slot.name,
          team,
          slotKey,
          slotLabel: advancedSlotLabel(slotKey),
          isBot: isTestingBotParticipant(slot),
        });
      });
    });
  } else {
    const assignments = prepared?.assignments || captainAssignmentsFromRoom(roomData);
    ["A", "B"].forEach(team => {
      const participant = participantByClientId(roomData, assignments?.[team]);
      if (!participant?.clientId) return;
      pushUnique({
        clientId: participant.clientId,
        name: participant.name,
        team,
        slotKey: "captain",
        slotLabel: team === "A" ? t("captain_attackers") : t("captain_defenders"),
        isBot: isTestingBotParticipant(participant),
      });
    });
  }

  return users;
}

function onlineRequiredReadyUsersFromRoom(data = {}) {
  const readyCheck = onlineReadyCheckFromRoom(data);
  if (readyCheck?.required && typeof readyCheck.required === "object") {
    return Object.entries(readyCheck.required)
      .map(([clientId, value]) => ({
        clientId,
        name: String(value?.name || `Usuario ${clientId.slice(-4)}`),
        team: value?.team || null,
        slotKey: value?.slotKey || null,
        slotLabel: value?.slotLabel || "",
        isBot: Boolean(value?.isBot),
        order: Number(value?.order || 0),
      }))
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  }
  return onlineRequiredReadyUsersFromPrepared(data);
}

function onlineReadyRequiredObject(users = []) {
  return users.reduce((acc, user, index) => {
    acc[user.clientId] = {
      name: user.name,
      team: user.team || null,
      slotKey: user.slotKey || null,
      slotLabel: user.slotLabel || "",
      isBot: Boolean(user.isBot),
      order: index,
    };
    return acc;
  }, {});
}

function currentClientReadyRequirement(data = {}) {
  const clientId = onlineClientId();
  return onlineRequiredReadyUsersFromRoom(data).find(user => user.clientId === clientId) || null;
}

function isReadyUserMarked(data = {}, clientId) {
  const ready = onlineReadyCheckFromRoom(data)?.ready || {};
  return Boolean(ready?.[clientId]?.ready);
}

function allReadyUsersMarked(data = {}) {
  const users = onlineRequiredReadyUsersFromRoom(data);
  if (!users.length) return false;
  return users.every(user => isReadyUserMarked(data, user.clientId));
}

function ensureOnlineReadyOverlay() {
  let overlay = document.getElementById("online-ready-overlay");
  if (overlay) return overlay;

  overlay = document.createElement("div");
  overlay.id = "online-ready-overlay";
  overlay.className = "online-ready-overlay hidden";
  overlay.innerHTML = `
    <video id="online-ready-loading-video" class="online-ready-loading-video" muted playsinline loop preload="auto">
      <source src="video/introV/Loading.mp4" type="video/mp4" />
    </video>
    <section class="online-ready-card" role="dialog" aria-modal="true" aria-live="polite">
      <p class="online-ready-kicker">${escapeHtml(t("ready_check_kicker"))}</p>
      <h2 id="online-ready-title">${escapeHtml(t("ready_check_title"))}</h2>
      <p id="online-ready-copy" class="online-ready-copy">${escapeHtml(t("ready_check_copy"))}</p>
      <div id="online-ready-grid" class="online-ready-grid"></div>
      <button id="online-ready-button" class="online-ready-button" type="button">${escapeHtml(t("ready_check_button"))}</button>
      <p id="online-ready-status" class="online-ready-status">${escapeHtml(t("ready_check_waiting"))}</p>
    </section>
  `;
  document.body.appendChild(overlay);
  return overlay;
}

function updateOnlineReadyOverlayLanguage() {
  const overlay = document.getElementById("online-ready-overlay");
  if (!overlay) return;
  const kicker = overlay.querySelector(".online-ready-kicker");
  if (kicker) kicker.textContent = t("ready_check_kicker");
}


function readyCheckSecondsLeft(readyCheck = {}) {
  return Math.max(0, Math.ceil((Number(readyCheck.deadlineAt || 0) - onlineNow()) / 1000));
}

function renderOnlineReadyStatusText(data = {}) {
  const readyCheck = onlineReadyCheckFromRoom(data);
  const status = document.getElementById("online-ready-status");
  if (!status || !readyCheck?.active || readyCheck.status !== "waiting") return;
  const required = currentClientReadyRequirement(data);
  const myReady = required ? isReadyUserMarked(data, required.clientId) : false;
  const secondsLeft = readyCheckSecondsLeft(readyCheck);
  status.innerHTML = required
    ? (myReady ? escapeHtml(t("ready_check_waiting_others")) : `${escapeHtml(t("ready_check_player_prompt"))} · ${t("ready_check_timeout", { seconds: `<strong>${secondsLeft}</strong>` })}`)
    : `${escapeHtml(t("ready_check_spectator_status"))} · ${t("ready_check_timeout", { seconds: `<strong>${secondsLeft}</strong>` })}`;
}

function stopOnlineReadyCountdownInterval() {
  if (onlineReadyCountdownIntervalId) {
    clearInterval(onlineReadyCountdownIntervalId);
    onlineReadyCountdownIntervalId = null;
  }
  onlineReadyCountdownData = null;
}

function startOnlineReadyCountdownInterval(data = {}) {
  const readyCheck = onlineReadyCheckFromRoom(data);
  if (!readyCheck?.active || readyCheck.status !== "waiting") {
    stopOnlineReadyCountdownInterval();
    return;
  }

  const key = `${currentRoomCode || "local"}:${readyCheck.requestedAt || 0}:${readyCheck.deadlineAt || 0}`;
  onlineReadyCountdownData = data;
  if (onlineReadyCountdownIntervalId && document.getElementById("online-ready-overlay")?.dataset.countdownKey === key) {
    renderOnlineReadyStatusText(data);
    return;
  }

  stopOnlineReadyCountdownInterval();
  const overlay = document.getElementById("online-ready-overlay");
  if (overlay) overlay.dataset.countdownKey = key;
  renderOnlineReadyStatusText(data);
  onlineReadyCountdownIntervalId = setInterval(() => {
    if (!onlineReadyCountdownData) {
      stopOnlineReadyCountdownInterval();
      return;
    }
    const latestReady = onlineReadyCheckFromRoom(onlineReadyCountdownData);
    if (!latestReady?.active || latestReady.status !== "waiting") {
      stopOnlineReadyCountdownInterval();
      return;
    }
    renderOnlineReadyStatusText(onlineReadyCountdownData);
  }, 500);
}

function renderOnlineReadyCheck(data = {}) {
  const readyCheck = onlineReadyCheckFromRoom(data);
  const overlay = ensureOnlineReadyOverlay();
  const video = document.getElementById("online-ready-loading-video");
  const title = document.getElementById("online-ready-title");
  const copy = document.getElementById("online-ready-copy");
  const grid = document.getElementById("online-ready-grid");
  const button = document.getElementById("online-ready-button");
  const status = document.getElementById("online-ready-status");

  if (!readyCheck?.active || data.started) {
    stopOnlineReadyCountdownInterval();
    overlay.classList.add("hidden");
    overlay.classList.remove("is-loading");
    try { video?.pause(); } catch (_) {}
    return;
  }

  const users = onlineRequiredReadyUsersFromRoom(data);
  const required = currentClientReadyRequirement(data);
  const myReady = required ? isReadyUserMarked(data, required.clientId) : false;
  const isLoading = readyCheck.status === "loading";
  const secondsLeft = readyCheckSecondsLeft(readyCheck);

  overlay.classList.remove("hidden");
  overlay.classList.toggle("is-loading", isLoading);

  if (isLoading) {
    stopOnlineReadyCountdownInterval();
    if (title) title.textContent = t("ready_check_loading_title");
    if (copy) copy.textContent = t("ready_check_loading_copy");
    if (button) button.classList.add("hidden");
    if (status) status.textContent = t("ready_check_loading_status");
    try {
      video.currentTime = 0;
      void video.play();
    } catch (_) {}
  } else {
    if (title) title.textContent = t("ready_check_title");
    if (copy) copy.textContent = t("ready_check_copy");
    if (button) {
      button.classList.toggle("hidden", !required);
      button.disabled = myReady;
      button.classList.toggle("is-ready", myReady);
      button.textContent = myReady ? t("ready_check_button_waiting") : t("ready_check_button");
      button.onclick = () => markCurrentPlayerReady();
    }
    renderOnlineReadyStatusText(data);
    startOnlineReadyCountdownInterval(data);
    try { video?.pause(); } catch (_) {}
  }

  if (grid) {
    const signature = users.map(user => `${user.clientId}:${user.name}:${user.team}:${user.slotLabel}`).join("|");
    if (grid.dataset.readySignature !== signature) {
      grid.dataset.readySignature = signature;
      grid.innerHTML = users.map(user => {
        const teamClass = user.team === "B" ? "team-b" : "team-a";
        const slot = user.slotLabel || (user.team === "B" ? t("captain_defenders") : t("captain_attackers"));
        return `
          <article class="online-ready-player ${teamClass}" data-ready-client-id="${escapeHtml(user.clientId)}">
            <div class="online-ready-namebox"><strong>${escapeHtml(user.name)}</strong></div>
            <span>${escapeHtml(slot)}</span>
            <em>${escapeHtml(t("ready_check_pending"))}</em>
          </article>
        `;
      }).join("");
    }

    users.forEach(user => {
      const card = grid.querySelector(`[data-ready-client-id="${CSS.escape(user.clientId)}"]`);
      if (!card) return;
      const ready = isReadyUserMarked(data, user.clientId);
      card.classList.toggle("is-ready", ready);
      const status = card.querySelector("em");
      if (status) status.textContent = ready ? t("ready_check_ready") : t("ready_check_pending");
    });
  }
}

async function markCurrentPlayerReady() {
  if (!currentRoomCode) return;
  const roomRef = roomRefFor(currentRoomCode);
  if (!roomRef) return;
  try {
    const snapshot = await roomRef.get();
    const data = snapshot.val() || {};
    const required = currentClientReadyRequirement(data);
    const readyCheck = onlineReadyCheckFromRoom(data);
    if (!readyCheck?.active || readyCheck.status !== "waiting" || !required) return;
    await roomRef.update({
      [`readyCheck/ready/${required.clientId}`]: {
        ready: true,
        name: required.name,
        at: onlineNow(),
        byClientId: onlineClientId(),
      },
      updatedAt: onlineNow(),
    });
    audioPlay(sounds.startDraft, 0.94, "sfx");
  } catch (error) {
    console.warn("No se pudo marcar listo.", error);
    alert(t("ready_check_error"));
  }
}

function clearTestingBotReadyTimers() {
  testingBotReadyTimers.forEach(timerId => clearTimeout(timerId));
  testingBotReadyTimers.clear();
}

function scheduleTestingBotReadySimulation(data = {}) {
  if (currentRole !== "host" || !currentRoomCode) return;
  const readyCheck = onlineReadyCheckFromRoom(data);
  if (!readyCheck?.active || readyCheck.status !== "waiting" || data.started) return;
  const roomRef = roomRefFor(currentRoomCode);
  if (!roomRef) return;

  onlineRequiredReadyUsersFromRoom(data)
    .filter(user => user.isBot && !isReadyUserMarked(data, user.clientId))
    .forEach(user => {
      const key = `${currentRoomCode}:${readyCheck.requestedAt || 0}:${user.clientId}`;
      if (testingBotReadyTimers.has(key)) return;
      const timerId = setTimeout(() => {
        testingBotReadyTimers.delete(key);
        roomRef.update({
          [`readyCheck/ready/${user.clientId}`]: {
            ready: true,
            name: user.name,
            at: onlineNow(),
            byClientId: onlineClientId(),
            isBot: true,
          },
          updatedAt: onlineNow(),
        }).catch(error => console.warn("No se pudo marcar bot listo.", error));
      }, 700 + Math.round(Math.random() * 1800));
      testingBotReadyTimers.set(key, timerId);
    });
}

function prepareOnlineDraftStart(roomData = {}) {
  const draftConfig = sanitizeDraftConfig(roomData.draftConfig || currentDraftConfig());
  let assignments = captainAssignmentsFromRoom(roomData);
  let slots = advancedSlotsFromRoom(roomData, draftConfig);
  let players;
  let captainA;
  let captainB;

  if (draftConfig.mode === "advanced") {
    if (!areAdvancedSlotsComplete(slots, draftConfig)) {
      throw new Error("advanced_slots_missing");
    }
    assignments = {
      A: slots.A?.captain?.clientId || null,
      B: slots.B?.captain?.clientId || null,
    };
    captainA = slots.A?.captain;
    captainB = slots.B?.captain;
    players = playersPayloadFromAdvancedSlots(slots, draftConfig);
  } else {
    if (!assignments.A || !assignments.B || assignments.A === assignments.B) {
      throw new Error("captains_missing");
    }
    captainA = participantByClientId(roomData, assignments.A);
    captainB = participantByClientId(roomData, assignments.B);
    if (!captainA || !captainB) {
      throw new Error("captains_unavailable");
    }
    readPlayers();
    players = { A: [...state.players.A], B: [...state.players.B] };
  }

  return { draftConfig, assignments, slots, players, captainA, captainB };
}

async function requestOnlineReadyCheck(roomRef, roomData = {}) {
  const prepared = prepareOnlineDraftStart(roomData);
  const requiredUsers = onlineRequiredReadyUsersFromPrepared(roomData, prepared);
  if (!requiredUsers.length) throw new Error("ready_users_missing");

  await roomRef.update({
    readyCheck: {
      active: true,
      status: "waiting",
      requestedAt: onlineNow(),
      deadlineAt: onlineNow() + ONLINE_READY_TIMEOUT_MS,
      requestedBy: onlineClientId(),
      required: onlineReadyRequiredObject(requiredUsers),
      ready: {},
    },
    updatedAt: onlineNow(),
  });
}

async function startOnlineDraftNow(roomRef, roomData = {}) {
  const prepared = prepareOnlineDraftStart(roomData);
  const { draftConfig, assignments, slots, players, captainA, captainB } = prepared;

  resetDraftStateBeforeStart();
  if (draftConfig.mode === "advanced") {
    state.onlineSlots = slots;
    state.players = players;
  }
  state.draftConfig = draftConfig;
  state.draftSessionId += 1;
  state.onlinePhase = "draft";
  prepareClockForTurnIndex(0, phaseOverlayDurationMs());
  const initialTurn = currentTurn();
  const initialPhaseEventType = initialTurn?.type === "ban" ? "banPhase" : "pickPhase";
  const draftPayload = blankOnlineDraftState({
    phase: "draft",
    draftSessionId: state.draftSessionId,
    turnIndex: 0,
    turnDuration: state.turnDuration,
    turnStartedAt: state.turnStartedAt,
    turnDeadlineAt: state.turnDeadlineAt,
    draftConfig,
    players,
    slots,
    captainAssignments: assignments,
    phaseEvent: createOnlinePhaseEvent(initialPhaseEventType),
  });

  await roomRef.update({
    started: true,
    startedAt: onlineNow(),
    updatedAt: onlineNow(),
    readyCheck: null,
    players,
    turnDuration: state.turnDuration,
    draftConfig,
    slots,
    captainAssignments: assignments,
    teamA: captainA ? { clientId: assignments.A, name: captainA.name, connected: captainA.connected, isBot: Boolean(captainA.isBot), role: "CAPITÁN_ATACANTES", lastSeen: captainA.lastSeen || onlineNow() } : null,
    teamB: captainB ? { clientId: assignments.B, name: captainB.name, connected: captainB.connected, isBot: Boolean(captainB.isBot), role: "CAPITÁN_DEFENSORES", lastSeen: captainB.lastSeen || onlineNow() } : null,
    draftState: draftPayload,
  });
}


function readyCheckHasDisconnectedUser(data = {}) {
  const readyCheck = onlineReadyCheckFromRoom(data);
  if (!readyCheck?.active || readyCheck.status !== "waiting") return false;
  return onlineRequiredReadyUsersFromRoom(data).some(user => {
    if (user.isBot) return false;
    const participant = participantByClientId(data, user.clientId);
    if (!participant) return true;
    return participant.connected === false;
  });
}

function cancelOnlineReadyCheck(roomRef, reason = "timeout") {
  if (!roomRef) return Promise.resolve();
  clearTestingBotReadyTimers();
  if (onlineReadyTimeoutTimerId) {
    clearTimeout(onlineReadyTimeoutTimerId);
    onlineReadyTimeoutTimerId = null;
  }
  stopOnlineReadyCountdownInterval();
  onlineReadyTimeoutKey = null;
  onlineReadyStartKey = null;
  return roomRef.update({
    readyCheck: null,
    started: false,
    updatedAt: onlineNow(),
    readyCancelReason: reason,
  });
}

function scheduleOnlineReadyTimeout(roomRef, readyCheck = {}) {
  if (!roomRef || !readyCheck?.active || readyCheck.status !== "waiting") return;
  const deadline = Number(readyCheck.deadlineAt || 0);
  if (!deadline) return;
  const key = `${currentRoomCode}:${readyCheck.requestedAt || 0}:${deadline}`;
  if (onlineReadyTimeoutKey === key) return;
  if (onlineReadyTimeoutTimerId) clearTimeout(onlineReadyTimeoutTimerId);
  onlineReadyTimeoutKey = key;
  onlineReadyTimeoutTimerId = setTimeout(async () => {
    try {
      const snapshot = await roomRef.get();
      const latest = snapshot.val() || {};
      const latestReady = onlineReadyCheckFromRoom(latest);
      if (!latestReady?.active || latestReady.status !== "waiting" || latest.started) return;
      if (allReadyUsersMarked(latest)) return;
      await cancelOnlineReadyCheck(roomRef, "timeout");
    } catch (error) {
      console.warn("No se pudo cancelar el ready check por timeout.", error);
    }
  }, Math.max(300, deadline - onlineNow()));
}

function maybeAdvanceOnlineReadyCheck(data = {}) {
  if (currentRole !== "host" || !currentRoomCode || data.started) return;
  const readyCheck = onlineReadyCheckFromRoom(data);
  if (!readyCheck?.active) return;
  const roomRef = roomRefFor(currentRoomCode);
  if (!roomRef) return;

  scheduleTestingBotReadySimulation(data);
  scheduleOnlineReadyTimeout(roomRef, readyCheck);

  if (readyCheck.status === "waiting" && readyCheckHasDisconnectedUser(data) && !allReadyUsersMarked(data)) {
    const key = `${currentRoomCode}:${readyCheck.requestedAt || 0}:disconnected`;
    if (onlineReadyStartKey === key) return;
    onlineReadyStartKey = key;
    cancelOnlineReadyCheck(roomRef, "disconnected").catch(error => {
      console.warn("No se pudo cancelar el ready check por desconexión.", error);
      onlineReadyStartKey = null;
    });
    return;
  }

  if (readyCheck.status === "waiting" && Number(readyCheck.deadlineAt || 0) && onlineNow() >= Number(readyCheck.deadlineAt || 0) && !allReadyUsersMarked(data)) {
    const key = `${currentRoomCode}:${readyCheck.requestedAt || 0}:timeout`;
    if (onlineReadyStartKey === key) return;
    onlineReadyStartKey = key;
    cancelOnlineReadyCheck(roomRef, "timeout").then(() => {
      onlineReadyStartKey = null;
    }).catch(error => {
      console.warn("No se pudo cancelar el ready check por timeout.", error);
      onlineReadyStartKey = null;
    });
    return;
  }

  if (readyCheck.status === "waiting" && allReadyUsersMarked(data)) {
    const key = `${currentRoomCode}:${readyCheck.requestedAt || 0}:loading`;
    if (onlineReadyStartKey === key) return;
    onlineReadyStartKey = key;
    roomRef.update({
      "readyCheck/status": "loading",
      "readyCheck/loadingStartedAt": onlineNow(),
      updatedAt: onlineNow(),
    }).catch(error => {
      console.warn("No se pudo iniciar la carga del ready check.", error);
      onlineReadyStartKey = null;
    });
    return;
  }

  if (readyCheck.status === "loading") {
    if (onlineReadyTimeoutTimerId) {
      clearTimeout(onlineReadyTimeoutTimerId);
      onlineReadyTimeoutTimerId = null;
      onlineReadyTimeoutKey = null;
    }
    const key = `${currentRoomCode}:${readyCheck.requestedAt || 0}:${readyCheck.loadingStartedAt || 0}:start`;
    if (onlineReadyStartKey === key) return;
    onlineReadyStartKey = key;
    const elapsed = Math.max(0, onlineNow() - Number(readyCheck.loadingStartedAt || onlineNow()));
    const delayMs = Math.max(1200, 4200 - elapsed);
    setTimeout(async () => {
      try {
        const snapshot = await roomRef.get();
        const latest = snapshot.val() || {};
        const latestReady = onlineReadyCheckFromRoom(latest);
        if (!latestReady?.active || latestReady.status !== "loading" || latest.started) return;
        if (!allReadyUsersMarked(latest)) return;
        await startOnlineDraftNow(roomRef, latest);
      } catch (error) {
        console.error(error);
        onlineReadyStartKey = null;
        alert(t("online_start_error"));
      }
    }, delayMs);
  }
}

function setupOnlineControls() {
  const toggle = document.getElementById("toggle-room-code");
  const copy = document.getElementById("copy-room-code");
  const close = document.getElementById("close-room-btn");
  const disconnect = document.getElementById("disconnect-room-btn");
  const randomRoomNames = document.getElementById("room-random-player-names");
  const onlineStartBtn = document.getElementById("start-online-draft");
  const captainASelect = document.getElementById("captain-a-select");
  const captainBSelect = document.getElementById("captain-b-select");
  const roomCodeInput = document.getElementById("room-input");
  const roomBansEnabled = document.getElementById("room-bans-enabled");

  document.querySelectorAll("[data-room-team-size]").forEach(button => {
    button.addEventListener("click", () => {
      if (currentRole !== "host" || state.draftActive) return;
      applyDraftConfigPatch({ teamSize: Number(button.dataset.roomTeamSize) }, { syncOnline: true });
      pushRoomLobbyConfig();
    });
  });

  document.querySelectorAll("[data-room-draft-mode]").forEach(button => {
    button.addEventListener("click", () => {
      if (currentRole !== "host" || state.draftActive) return;
      const mode = button.dataset.roomDraftMode === "advanced" ? "advanced" : "classic";
      applyDraftConfigPatch({ mode }, { syncOnline: true });
      pushRoomLobbyConfig();
    });
  });

  roomBansEnabled?.addEventListener("change", (event) => {
    if (currentRole !== "host" || state.draftActive) return;
    applyDraftConfigPatch({ bansEnabled: Boolean(event.currentTarget.checked) }, { syncOnline: true });
    pushRoomLobbyConfig();
  });

  roomCodeInput?.addEventListener("input", () => {
    const normalized = normalizeRoomCode(roomCodeInput.value);
    if (roomCodeInput.value !== normalized) roomCodeInput.value = normalized;
  });
  roomCodeInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void joinOnlineRoom();
    }
  });

  if (captainASelect) captainASelect.addEventListener("change", () => assignOnlineCaptain("A", captainASelect.value || null));
  if (captainBSelect) captainBSelect.addEventListener("change", () => assignOnlineCaptain("B", captainBSelect.value || null));

  if (toggle) toggle.addEventListener("click", () => {
    const el = document.getElementById("room-code-display");
    if (!el) return;
    const shouldShow = el.dataset.hidden === "1";
    setRoomCodeDisplay(currentRoomCode || "----", !shouldShow);
  });

  if (copy) copy.addEventListener("click", async () => {
    if (!currentRoomCode) return;
    try {
      await navigator.clipboard?.writeText(currentRoomCode);
      copy.textContent = t("copied");
      setTimeout(() => { copy.textContent = t("copy_code"); }, 1200);
    } catch (_) {
      alert(`Código de sala: ${currentRoomCode}`);
    }
  });

  if (close) close.addEventListener("click", async () => {
    if (currentRole !== "host" || !currentRoomCode) return;
    await closeCurrentRoom();
  });

  if (disconnect) disconnect.addEventListener("click", async () => {
    if (currentRole !== "player" || !currentRoomCode) return;
    await disconnectCurrentRoom();
  });

  if (randomRoomNames) randomRoomNames.addEventListener("click", () => {
    if (currentRole !== "host" || !currentRoomCode || state.draftActive) return;
    applyRandomPlayerNames();
    pushRoomLobbyConfig();
  });

  if (onlineStartBtn) {
    onlineStartBtn.addEventListener("click", async () => {
      if (!currentRoomCode || currentRole !== "host") return;
      const roomRef = roomRefFor(currentRoomCode);
      if (!roomRef) {
        alert(onlineUnavailableMessage());
        return;
      }
      try {
        onlineStartBtn.disabled = true;
        const snapshot = await roomRef.get();
        const roomData = snapshot.val() || {};
        if (roomData.readyCheck?.active) return;
        await requestOnlineReadyCheck(roomRef, roomData);
      } catch (error) {
        onlineStartBtn.disabled = false;
        console.error(error);
        if (error?.message === "advanced_slots_missing") alert(t("ready_check_missing_players"));
        else if (error?.message === "captains_missing") alert(t("lobby_alert_assign_captains"));
        else if (error?.message === "captains_unavailable") alert(t("lobby_alert_missing_captains"));
        else alert(t("online_start_error"));
      }
    });
  }
}

async function closeCurrentRoom() {
  if (!currentRoomCode) return;
  const roomCode = currentRoomCode;
  try {
    const roomRef = roomRefFor(roomCode);
    const path = rolePathForCurrentClient();
    if (roomRef && path) {
      try { await roomRef.child(path).onDisconnect().cancel(); } catch (_) {}
    }
    await roomRef?.update({ closed: true, closedAt: onlineNow() }).catch(() => {});
    await roomRef?.remove();
  } catch (error) {
    console.error(error);
  } finally {
    handleRoomClosed(roomCode, { silent: true });
  }
}

async function disconnectCurrentRoom() {
  if (!currentRoomCode) return;
  const roomCode = currentRoomCode;
  const role = currentRole;
  const clientId = onlineClientId();
  try {
    const roomRef = roomRefFor(roomCode);
    if (roomRef && role === "player") {
      try { await roomRef.child(`participants/${clientId}`).onDisconnect().cancel(); } catch (_) {}
      const snapshot = await roomRef.get();
      const data = snapshot.val() || {};
      const assignments = captainAssignmentsFromRoom(data);
      const updates = { updatedAt: onlineNow() };

      if (data.started) {
        updates[`participants/${clientId}/connected`] = false;
        updates[`participants/${clientId}/lastSeen`] = onlineNow();
      } else {
        updates[`participants/${clientId}`] = null;
        if (assignments.A === clientId) {
          updates["captainAssignments/A"] = null;
          updates.teamA = null;
        }
        if (assignments.B === clientId) {
          updates["captainAssignments/B"] = null;
          updates.teamB = null;
        }
        const config = sanitizeDraftConfig(data.draftConfig || currentDraftConfig());
        const slots = advancedSlotsFromRoom(data, config);
        ["A", "B"].forEach(team => {
          ADVANCED_SLOT_KEYS.forEach(slotKey => {
            if (slots?.[team]?.[slotKey]?.clientId === clientId) {
              updates[`slots/${team}/${slotKey}`] = null;
                }
          });
        });
      }

      await roomRef.update(updates).catch(() => {});
    }
  } catch (error) {
    console.warn("No se pudo desconectar limpiamente de la sala.", error);
  } finally {
    handleRoomClosed(roomCode, { silent: true });
  }
}

function handleRoomClosed(roomCode, options = {}) {
  if (roomCode && currentRoomCode && roomCode !== currentRoomCode) return;
  try {
    if (onlineRoomListenerCode) roomRefFor(onlineRoomListenerCode)?.off("value");
    if (onlineRoomDeletionListenerCode) roomRefFor(onlineRoomDeletionListenerCode)?.off("value");
  } catch (_) {}
  onlineRoomListenerCode = null;
  onlineRoomDeletionListenerCode = null;
  onlineLatestRoomData = null;
  testingBotTurnKey = null;
  onlineSummaryIntroShownKey = null;
  if (hostNameSaveTimer) {
    clearTimeout(hostNameSaveTimer);
    hostNameSaveTimer = null;
  }
  clearTestingBotTurnTimer();
  clearTestingBotReadyTimers();
  if (onlineReadyTimeoutTimerId) {
    clearTimeout(onlineReadyTimeoutTimerId);
    onlineReadyTimeoutTimerId = null;
  }
  onlineReadyTimeoutKey = null;
  onlineReadyStartKey = null;
  const readyOverlay = document.getElementById("online-ready-overlay");
  if (readyOverlay) readyOverlay.classList.add("hidden");
  abortDraftRuntime();
  currentRoomCode = null;
  currentRole = null;
  playerTeam = null;
  onlineStartedForRoom = null;
  onlineRoomStartedState = false;
  clearOnlineSession();
  updateOnlineBodyClasses();
  updateOnlineLeaveButtonVisibility();
  activateSetupTab("menu");
  switchScreen(setupScreen);
  startMusic("menu");
  if (!options.silent) alert("El líder de la sala ha cerrado la sala.");
}

function watchRoomDeletion(roomCode) {
  const roomRef = roomRefFor(roomCode);
  if (!roomRef || onlineRoomDeletionListenerCode === roomCode) return;
  if (onlineRoomDeletionListenerCode) roomRefFor(onlineRoomDeletionListenerCode)?.off("value");
  onlineRoomDeletionListenerCode = roomCode;
  roomRef.on("value", (snap) => {
    if (!snap.exists() && currentRoomCode === roomCode) handleRoomClosed(roomCode);
  });
}

function showHostControls(isHost) {
  const closeRoomBtn = document.getElementById("close-room-btn");
  if (closeRoomBtn) closeRoomBtn.style.display = isHost ? "inline-flex" : "none";
  const disconnectRoomBtn = document.getElementById("disconnect-room-btn");
  if (disconnectRoomBtn) disconnectRoomBtn.style.display = !isHost && currentRole === "player" ? "inline-flex" : "none";
  if (roomPlayerConfig) roomPlayerConfig.classList.toggle("hidden", !isHost);
  const startButton = document.getElementById("start-online-draft");
  if (startButton) startButton.style.display = isHost ? "inline-flex" : "none";
}

async function tryRestoreOnlineSession() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(ONLINE_SESSION_STORAGE_KEY) || "null");
  } catch (_) {}
  const savedName = saved?.playerName || (() => { try { return localStorage.getItem(ONLINE_PLAYER_NAME_STORAGE_KEY); } catch (_) { return null; } })();
  if (savedName) currentOnlinePlayerName = savedName;
  const nameInput = document.getElementById("join-player-name");
  if (nameInput && savedName && !nameInput.value) nameInput.value = savedName;

  if (!saved?.roomCode || saved.clientId !== onlineClientId()) return;
  const roomRef = roomRefFor(saved.roomCode);
  if (!roomRef) return;
  try {
    const snapshot = await roomRef.get();
    if (!snapshot.exists()) {
      clearOnlineSession();
      return;
    }
    const data = snapshot.val() || {};
    if (data.closed) {
      clearOnlineSession();
      return;
    }

    if (saved.role === "host" && data.host?.clientId === onlineClientId()) {
      attachCurrentRoom(saved.roomCode, "host", null);
      return;
    }

    if (saved.role === "player" && data.participants?.[onlineClientId()]) {
      const assignments = captainAssignmentsFromRoom(data);
      let restoredTeam = null;
      if (assignments.A === onlineClientId()) restoredTeam = "teamA";
      else if (assignments.B === onlineClientId()) restoredTeam = "teamB";
      currentOnlinePlayerName = data.participants?.[onlineClientId()]?.name || currentOnlinePlayerName;
      attachCurrentRoom(saved.roomCode, "player", restoredTeam);
      return;
    }

    if (saved.role === "player" && saved.playerTeam === "teamA" && data.teamA?.clientId === onlineClientId()) {
      currentOnlinePlayerName = data.teamA?.name || currentOnlinePlayerName;
      attachCurrentRoom(saved.roomCode, "player", "teamA");
      return;
    }

    if (saved.role === "player" && saved.playerTeam === "teamB" && data.teamB?.clientId === onlineClientId()) {
      currentOnlinePlayerName = data.teamB?.name || currentOnlinePlayerName;
      attachCurrentRoom(saved.roomCode, "player", "teamB");
      return;
    }

    clearOnlineSession();
  } catch (error) {
    console.warn("No se pudo restaurar la sesión online.", error);
  }
}
