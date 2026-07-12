/* STRINOVA Draft System v3.4.6
 * Rebuilt flow controller: independent map phase, official 5v5 order,
 * simultaneous picks, private teammate requests and bot simulation.
 */
(function installDraftFlowV346() {
  "use strict";
  if (window.__rpmodsDraftFlowV346Installed) return;
  window.__rpmodsDraftFlowV346Installed = true;

  const VERSION = "3.4.6";
  const MAP_START_DELAY_MS = 900;
  const ASSIST_TIMEOUT_MS = 10000;
  const BOT_MIN_DELAY_MS = 850;
  const BOT_MAX_DELAY_MS = 1700;
  const CHIBI_VOICE_COUNT = 8;

  const DEFAULT_FLOW_CONFIG = Object.freeze({
    mode: "advanced",
    teamSize: 5,
    bansEnabled: true,
    phaseOrder: "map-first",
    banMode: "full",
    pickPreset: "official",
    delegationMode: "captain_subcaptain",
    mapRandomMode: "chibi-elimination",
  });

  const flow = state.rp346 = {
    phase: "idle",                 // idle | map | draft | summary
    mapContext: "predraft",        // predraft | postdraft
    mapToken: 0,
    mapTimer: null,
    mapEliminatedIds: [],
    mapEventId: null,
    simultaneous: {},
    assist: { requests: {}, proposals: {} },
    assistTarget: null,
    botKeys: {},
    botTimers: [],
    hostMapStartedKey: "",
  };

  try { if (factions?.urbino) factions.urbino.label = "Urbino"; } catch (_) {}

  function now() {
    try { return currentRoomCode ? onlineNow() : Date.now(); }
    catch (_) { return Date.now(); }
  }

  function uid(prefix) {
    return `${prefix}_${now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function clone(value, fallback) {
    try { return JSON.parse(JSON.stringify(value)); }
    catch (_) { return fallback; }
  }

  function randomDelay(min = BOT_MIN_DELAY_MS, max = BOT_MAX_DELAY_MS) {
    return min + Math.round(Math.random() * Math.max(0, max - min));
  }

  function clearMapTimer() {
    if (flow.mapTimer) window.clearTimeout(flow.mapTimer);
    flow.mapTimer = null;
  }

  function clearBotTimers() {
    flow.botTimers.forEach(id => window.clearTimeout(id));
    flow.botTimers = [];
    try { clearTestingBotTurnTimer(); } catch (_) {}
  }

  function botTimeout(callback, milliseconds) {
    const id = window.setTimeout(() => {
      flow.botTimers = flow.botTimers.filter(item => item !== id);
      callback();
    }, milliseconds);
    flow.botTimers.push(id);
    return id;
  }

  function flowSessionAlive(sessionId, token) {
    return state.draftSessionId === sessionId && flow.mapToken === token && flow.phase === "map";
  }

  /* ------------------------------------------------------------------
   * Configuration and official order
   * ---------------------------------------------------------------- */
  const baseSanitizeDraftConfig = sanitizeDraftConfig;
  sanitizeDraftConfig = function sanitizeDraftConfigV346(config = {}) {
    const base = baseSanitizeDraftConfig(config || {});
    const phaseOrder = String(config.phaseOrder || DEFAULT_FLOW_CONFIG.phaseOrder) === "draft-first" ? "draft-first" : "map-first";
    const banRaw = String(config.banMode || (base.bansEnabled ? DEFAULT_FLOW_CONFIG.banMode : "none"));
    const banMode = ["full", "simple", "none"].includes(banRaw) ? banRaw : "full";
    const delegationRaw = String(config.delegationMode || DEFAULT_FLOW_CONFIG.delegationMode);
    const delegationMode = ["captain_only", "captain_subcaptain", "all_members", "none"].includes(delegationRaw)
      ? delegationRaw : DEFAULT_FLOW_CONFIG.delegationMode;
    const mapRaw = String(config.mapRandomMode || DEFAULT_FLOW_CONFIG.mapRandomMode);
    const mapRandomMode = ["chibi-elimination", "classic-random"].includes(mapRaw)
      ? mapRaw : DEFAULT_FLOW_CONFIG.mapRandomMode;
    return {
      ...base,
      mode: String(config.mode || DEFAULT_FLOW_CONFIG.mode) === "classic" ? "classic" : "advanced",
      bansEnabled: banMode !== "none",
      phaseOrder,
      banMode,
      pickPreset: "official",
      delegationMode,
      mapRandomMode,
    };
  };
  state.draftConfig = sanitizeDraftConfig({ ...DEFAULT_FLOW_CONFIG, ...(state.draftConfig || {}) });

  function makePickTurn(team, slotKeys, groupId, stage) {
    const keys = Array.isArray(slotKeys) ? slotKeys : [slotKeys];
    return {
      type: "pick",
      team,
      slotKey: keys[0],
      slotKeys: keys,
      slotIndex: advancedSlotIndex(keys[0]),
      slotIndices: keys.map(advancedSlotIndex),
      groupId,
      groupCount: keys.length,
      groupSlot: 0,
      simultaneous: keys.length > 1,
      advanced: true,
      flowStage: stage,
    };
  }

  function buildLeaderTurns(size) {
    if (size <= 1) return [];
    if (size === 2) {
      return [
        makePickTurn("A", "captain", "leader-a-captain", "leader-picks"),
        makePickTurn("B", "captain", "leader-b-captain", "leader-picks"),
      ];
    }
    return [
      makePickTurn("A", "captain", "leader-a-captain", "leader-picks"),
      makePickTurn("B", "captain", "leader-b-captain", "leader-picks"),
      makePickTurn("B", "subcaptain", "leader-b-sub", "leader-picks"),
      makePickTurn("A", "subcaptain", "leader-a-sub", "leader-picks"),
    ];
  }

  function buildOfficialBans(config) {
    if (!config.bansEnabled || config.banMode === "none") return [];
    const turns = [
      { type: "ban", team: "B", faction: "scissors", banIndex: 0, slotIndex: 0, slotKey: "captain", advanced: true, flowStage: "bans", text: "DEFENSA bloquea The Scissors" },
      { type: "ban", team: "A", faction: "pus", banIndex: 1, slotIndex: 0, slotKey: "captain", advanced: true, flowStage: "bans", text: "ATAQUE bloquea P.U.S." },
    ];
    if (config.banMode === "full") {
      turns.push(
        { type: "ban", team: "B", faction: "urbino", banIndex: 2, slotIndex: 1, slotKey: "subcaptain", advanced: true, flowStage: "bans", text: "DEFENSA bloquea Urbino" },
        { type: "ban", team: "A", faction: "urbino", banIndex: 3, slotIndex: 1, slotKey: "subcaptain", advanced: true, flowStage: "bans", text: "ATAQUE bloquea Urbino" },
      );
    }
    return turns;
  }

  function buildRemainingTurns(size) {
    if (size === 2) {
      return [
        makePickTurn("A", "subcaptain", "remaining-a-sub", "remaining-picks"),
        makePickTurn("B", "subcaptain", "remaining-b-sub", "remaining-picks"),
      ];
    }
    if (size === 3) {
      return [
        makePickTurn("A", "player3", "remaining-a-1", "remaining-picks"),
        makePickTurn("B", "player3", "remaining-b-1", "remaining-picks"),
      ];
    }
    if (size === 4) {
      return [
        makePickTurn("A", ["player3", "player4"], "remaining-a-2", "remaining-picks"),
        makePickTurn("B", ["player3", "player4"], "remaining-b-2", "remaining-picks"),
      ];
    }
    return [
      makePickTurn("A", ["player3", "player4"], "remaining-a-2", "remaining-picks"),
      makePickTurn("B", ["player3", "player4"], "remaining-b-2", "remaining-picks"),
      makePickTurn("A", "player5", "remaining-a-1", "remaining-picks"),
      makePickTurn("B", "player5", "remaining-b-1", "remaining-picks"),
    ];
  }

  buildBanTurns = function buildBanTurnsV346(config = currentDraftConfig()) {
    return buildOfficialBans(sanitizeDraftConfig(config));
  };
  buildPickTurns = function buildPickTurnsV346(config = currentDraftConfig()) {
    const normalized = sanitizeDraftConfig(config);
    return [...buildLeaderTurns(normalized.teamSize), ...buildRemainingTurns(normalized.teamSize)];
  };
  activeTurns = function activeTurnsV346(config = currentDraftConfig()) {
    const normalized = sanitizeDraftConfig(config);
    return [...buildLeaderTurns(normalized.teamSize), ...buildOfficialBans(normalized), ...buildRemainingTurns(normalized.teamSize)];
  };
  activeBanTurns = function activeBanTurnsV346(config = currentDraftConfig()) {
    return buildOfficialBans(sanitizeDraftConfig(config));
  };
  activePickTurns = function activePickTurnsV346(config = currentDraftConfig()) {
    const normalized = sanitizeDraftConfig(config);
    return [...buildLeaderTurns(normalized.teamSize), ...buildRemainingTurns(normalized.teamSize)];
  };
  activeBanTurnCount = function activeBanTurnCountV346(config = currentDraftConfig()) {
    return buildOfficialBans(sanitizeDraftConfig(config)).length;
  };

  function turnStage(turn = currentTurn()) {
    return turn?.flowStage || (turn?.type === "ban" ? "bans" : "remaining-picks");
  }
  function stageTitle(stage) {
    if (stage === "leader-picks") return "SELECCIÓN INICIAL DE LÍDERES";
    if (stage === "bans") return "FASE DE BLOQUEOS";
    if (stage === "remaining-picks") return "SELECCIONES RESTANTES";
    return "SELECCIÓN DE LAMINANTES";
  }
  function showStage(stage, callback) {
    const ban = stage === "bans";
    const line = ban ? systemDraftVoiceLines.voice_ban_phase : systemDraftVoiceLines.voice_pick_phase;
    showPhaseOverlay(stageTitle(stage), line?.src || "", line?.text || "", callback || startTurn);
  }

  const baseShowOnlinePhaseEvent = showOnlinePhaseEvent;
  showOnlinePhaseEvent = function showOnlinePhaseEventV346(event, fallbackKey = "") {
    const stage = String(event?.type || "").startsWith("stage-") ? String(event.type).slice(6) : "";
    if (stage && ["leader-picks", "bans", "remaining-picks"].includes(stage)) {
      const key = event?.id || `${stage}:${state.draftSessionId}:${state.turnIndex}`;
      if (!key || onlineLastPhaseEventId === key || event?.byClientId === onlineClientId()) return false;
      onlineLastPhaseEventId = key;
      if (!state.draftActive || !hasScreenActive(draftScreen)) return false;
      showStage(stage, startTurn);
      return true;
    }
    return baseShowOnlinePhaseEvent(event, fallbackKey);
  };

  const baseRenderTurnInfo = renderTurnInfo;
  renderTurnInfo = function renderTurnInfoV346() {
    baseRenderTurnInfo();
    const turn = currentTurn();
    if (!turn) return;
    const stage = turnStage(turn);
    const dockTitle = document.getElementById("dock-title");
    const batch = document.getElementById("batch-indicator");
    const status = document.getElementById("status-phase");
    if (dockTitle) dockTitle.textContent = stageTitle(stage);
    if (status) status.textContent = stageTitle(stage);
    if (turn.type === "ban") {
      const bans = activeTurns().filter(item => item.type === "ban");
      const current = bans.indexOf(turn) + 1;
      if (batch) batch.textContent = `BLOQUEO ${Math.max(1, current)} DE ${bans.length} · ${advancedSlotLabel(turn.slotKey)}`;
    } else if (turn.simultaneous) {
      const record = simultaneousRecord(turn);
      const done = turn.slotKeys.filter(key => record[key]).length;
      if (batch) batch.textContent = `SELECCIÓN SIMULTÁNEA · ${done}/${turn.slotKeys.length} CONFIRMADOS`;
    } else if (batch) {
      batch.textContent = `${advancedSlotLabel(turn.slotKey)} · ${turn.team === "A" ? "ATACANTES" : "DEFENSORES"}`;
    }
  };

  window.rpmodsDebugDraftOrder = function debugDraftOrder(config = currentDraftConfig()) {
    return activeTurns(config).map((turn, index) => ({
      index,
      stage: turnStage(turn),
      type: turn.type,
      team: turn.team,
      slotKeys: turn.slotKeys || [turn.slotKey],
      faction: turn.faction || null,
      simultaneous: Boolean(turn.simultaneous),
    }));
  };

  /* ------------------------------------------------------------------
   * Configuration UI
   * ---------------------------------------------------------------- */
  function makeSelectRow(id, label, choices) {
    const row = document.createElement("label");
    row.className = "draft-flow-select-row";
    row.htmlFor = id;
    const copy = document.createElement("div");
    copy.className = "draft-flow-select-copy";
    const strong = document.createElement("strong");
    strong.textContent = label;
    copy.appendChild(strong);
    const select = document.createElement("select");
    select.id = id;
    select.className = "draft-flow-select";
    choices.forEach(([value, text]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = text;
      select.appendChild(option);
    });
    row.append(copy, select);
    return row;
  }

  function ensureDraftConfigUi() {
    const localCard = document.querySelector("#local-config-modal .draft-config-card");
    if (localCard && !document.getElementById("local-phase-order-v346")) {
      localCard.querySelector("#local-bans-enabled")?.closest(".draft-config-toggle")?.classList.add("legacy-ban-toggle-hidden");
      const block = document.createElement("section");
      block.className = "draft-flow-config-block";
      block.innerHTML = `<div class="draft-flow-config-heading"><span>FLUJO DEL DRAFT</span><strong>Orden de fases</strong></div>`;
      block.append(
        makeSelectRow("local-phase-order-v346", "Orden de fases", [["map-first", "Selección de mapa primero"], ["draft-first", "Draft primero"]]),
        makeSelectRow("local-ban-mode-v346", "Modo de bloqueos", [["full", "Completo: rival + Urbino"], ["simple", "Simple: solo facción rival"], ["none", "Sin bloqueos"]]),
        makeSelectRow("local-map-mode-v346", "Selección aleatoria de mapa", [["chibi-elimination", "Eliminación chibi"], ["classic-random", "Aleatorio clásico"]]),
      );
      localCard.querySelector("#local-config-summary")?.insertAdjacentElement("beforebegin", block);
    }

    const roomPanel = document.querySelector(".room-draft-config-panel");
    if (roomPanel && !document.getElementById("room-phase-order-v346")) {
      roomPanel.querySelector("#room-bans-enabled")?.closest(".draft-config-toggle")?.classList.add("legacy-ban-toggle-hidden");
      const block = document.createElement("section");
      block.className = "draft-flow-config-block compact";
      block.innerHTML = `<div class="draft-flow-config-heading"><span>FLUJO AVANZADO</span><strong>Orden y permisos</strong></div>`;
      block.append(
        makeSelectRow("room-phase-order-v346", "Orden de fases", [["map-first", "Selección de mapa primero"], ["draft-first", "Draft primero"]]),
        makeSelectRow("room-ban-mode-v346", "Modo de bloqueos", [["full", "Completo: rival + Urbino"], ["simple", "Simple: solo facción rival"], ["none", "Sin bloqueos"]]),
        makeSelectRow("room-delegation-v346", "Quién puede elegir por compañeros", [["captain_subcaptain", "Capitán y subcapitán"], ["captain_only", "Solo capitán"], ["all_members", "Todos los integrantes"], ["none", "Nadie"]]),
        makeSelectRow("room-map-mode-v346", "Selección aleatoria de mapa", [["chibi-elimination", "Eliminación chibi"], ["classic-random", "Aleatorio clásico"]]),
      );
      roomPanel.appendChild(block);
    }
  }

  function configSummary(prefix) {
    const config = currentDraftConfig();
    const bans = config.banMode === "none" ? "Sin bloqueos" : config.banMode === "simple" ? "Bloqueos simples" : "Bloqueos completos";
    return `${prefix}: ${config.teamSize}v${config.teamSize} · ${config.phaseOrder === "map-first" ? "Mapa primero" : "Draft primero"} · ${bans}`;
  }

  function syncConfigUi() {
    ensureDraftConfigUi();
    const config = currentDraftConfig();
    const values = {
      "local-phase-order-v346": config.phaseOrder,
      "local-ban-mode-v346": config.banMode,
      "local-map-mode-v346": config.mapRandomMode,
      "room-phase-order-v346": config.phaseOrder,
      "room-ban-mode-v346": config.banMode,
      "room-delegation-v346": config.delegationMode,
      "room-map-mode-v346": config.mapRandomMode,
    };
    Object.entries(values).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.value = value;
    });
    const localSummary = document.getElementById("local-config-summary");
    if (localSummary) localSummary.textContent = configSummary("Configuración");
    const roomSummary = document.getElementById("room-draft-config-summary");
    if (roomSummary) roomSummary.textContent = configSummary("Configuración online");
  }

  function bindConfigControl(id, patch, online = false) {
    const element = document.getElementById(id);
    if (!element || element.dataset.flowBound === "1") return;
    element.dataset.flowBound = "1";
    element.addEventListener("change", () => {
      if (online && (currentRole !== "host" || state.draftActive || flow.phase === "map")) return;
      const value = element.value;
      const next = typeof patch === "function" ? patch(value) : { [patch]: value };
      applyDraftConfigPatch(next, { syncOnline: online });
      syncConfigUi();
      if (online) pushRoomLobbyConfig();
    });
  }

  function bootConfigUi() {
    ensureDraftConfigUi();
    bindConfigControl("local-phase-order-v346", "phaseOrder");
    bindConfigControl("local-ban-mode-v346", value => ({ banMode: value, bansEnabled: value !== "none" }));
    bindConfigControl("local-map-mode-v346", "mapRandomMode");
    bindConfigControl("room-phase-order-v346", "phaseOrder", true);
    bindConfigControl("room-ban-mode-v346", value => ({ banMode: value, bansEnabled: value !== "none" }), true);
    bindConfigControl("room-delegation-v346", "delegationMode", true);
    bindConfigControl("room-map-mode-v346", "mapRandomMode", true);

    const range = document.getElementById("map-chibi-size-range-v346");
    let saved = 150;
    try { saved = Number(localStorage.getItem("rpmods_map_chibi_size_v346") || 150); } catch (_) {}
    const applySize = value => {
      const size = Math.max(80, Math.min(220, Number(value) || 150));
      document.documentElement.style.setProperty("--rpmods-map-chibi-size", `${size}px`);
      if (range) range.value = String(size);
      const text = document.getElementById("map-chibi-size-value-v346");
      if (text) text.textContent = `${size}px`;
      try { localStorage.setItem("rpmods_map_chibi_size_v346", String(size)); } catch (_) {}
    };
    applySize(saved);
    if (range && range.dataset.flowBound !== "1") {
      range.dataset.flowBound = "1";
      range.addEventListener("input", () => applySize(range.value));
    }
    syncConfigUi();
  }

  const baseUpdateLocalConfigUI = updateLocalConfigUI;
  updateLocalConfigUI = function updateLocalConfigUIV346() {
    baseUpdateLocalConfigUI();
    syncConfigUi();
  };
  const baseUpdateRoomDraftConfigUI = updateRoomDraftConfigUI;
  updateRoomDraftConfigUI = function updateRoomDraftConfigUIV346() {
    baseUpdateRoomDraftConfigUI();
    syncConfigUi();
    ["room-phase-order-v346", "room-ban-mode-v346", "room-delegation-v346", "room-map-mode-v346"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.disabled = currentRole !== "host" || Boolean(state.draftActive) || flow.phase === "map";
    });
  };

  /* ------------------------------------------------------------------
   * Independent map phase
   * ---------------------------------------------------------------- */
  function setMapCopy(predraft) {
    const header = mapScreen?.querySelector(".map-header");
    if (!header) return;
    const eyebrow = header.querySelector(".eyebrow");
    const title = header.querySelector("h1");
    const copy = header.querySelector("p:last-child");
    if (eyebrow) eyebrow.textContent = predraft ? "FASE PREVIA" : "DRAFT COMPLETADO";
    if (title) title.textContent = "SELECCIÓN DE MAPA";
    if (copy) copy.textContent = predraft
      ? "El mapa se decidirá antes de iniciar los turnos del draft."
      : "El mapa se decidirá antes de mostrar el resumen final.";
  }

  function serializeMapState() {
    return {
      active: Boolean(state.mapRoulette?.active),
      highlightedId: state.mapRoulette?.highlightedId || null,
      finalId: state.mapRoulette?.finalId || null,
      eliminatedIds: [...flow.mapEliminatedIds],
    };
  }

  function enterMapPhase(context = "predraft", options = {}) {
    clearMapTimer();
    clearBotTimers();
    clearInterval(state.timerId);
    flow.phase = "map";
    flow.mapContext = context;
    flow.mapToken += 1;
    flow.mapEliminatedIds = [];
    state.onlinePhase = "map";
    state.turnStartedAt = null;
    state.turnDeadlineAt = null;
    state.locked = true;
    state.selected = null;
    state.preselectLocked = false;
    state.selectedMap = null;
    state.mapRoulette = { active: false, highlightedId: null, finalId: null };
    switchScreen(mapScreen);
    setMapCopy(context === "predraft");
    renderMapGrid();
    updateSelectedMapCopy();
    if (randomizeMapButton) randomizeMapButton.style.display = currentRoomCode ? "none" : "inline-flex";
    if (!options.silentNarration) playNarration(systemDraftVoiceLines.map_selector_voice.src, systemDraftVoiceLines.map_selector_voice.text, 0.92);

    const canRun = !currentRoomCode || currentRole === "host";
    if (canRun && options.auto !== false) {
      const sessionId = state.draftSessionId;
      const token = flow.mapToken;
      flow.mapTimer = window.setTimeout(() => {
        if (!flowSessionAlive(sessionId, token) || state.selectedMap || state.mapRoulette.active) return;
        void runMapRoulette({ flowToken: token, sessionId });
      }, MAP_START_DELAY_MS);
    }
  }

  function eliminationPlan(total) {
    if (total <= 1) return [];
    if (total === 9) return [3, 2, 2, 1];
    const plan = [];
    let remaining = total - 1;
    while (remaining > 0) {
      const next = !plan.length && remaining >= 3 ? 3 : remaining >= 2 ? 2 : 1;
      plan.push(next);
      remaining -= next;
    }
    return plan;
  }

  function ensureChibiOverlay() {
    let overlay = document.getElementById("map-chibi-overlay-v346");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "map-chibi-overlay-v346";
    overlay.className = "map-chibi-overlay-v346 hidden";
    overlay.innerHTML = `<img class="map-chibi-fall-v346" src="img/ui/map_chibi_fall.png" alt=""><img class="map-chibi-land-v346" src="img/ui/map_chibi_land.png" alt="">`;
    document.body.appendChild(overlay);
    return overlay;
  }

  function playChibiVoice() {
    const sources = Array.from({ length: CHIBI_VOICE_COUNT }, (_, index) => `audio/map_vote_chibi_${index + 1}.ogg`);
    for (let i = sources.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [sources[i], sources[j]] = [sources[j], sources[i]];
    }
    unlockMediaPlayback(true);
    audioPlayFromSourceList(sources, 1, "sfx");
  }

  async function dropChibi(mapId, finalPause, sessionId, token) {
    const card = mapGrid?.querySelector(`.map-card[data-map-id="${mapId}"]`);
    if (!card || !flowSessionAlive(sessionId, token)) return false;
    if (finalPause) await delay(2000);
    if (!flowSessionAlive(sessionId, token)) return false;
    const overlay = ensureChibiOverlay();
    const rect = card.getBoundingClientRect();
    overlay.style.left = `${Math.round(rect.left + rect.width / 2)}px`;
    overlay.style.top = `${Math.round(rect.top + rect.height / 2 - 12)}px`;
    overlay.classList.remove("hidden", "dropping", "landed");
    void overlay.offsetWidth;
    overlay.classList.add("dropping");
    await delay(520);
    if (!flowSessionAlive(sessionId, token)) return false;
    overlay.classList.remove("dropping");
    overlay.classList.add("landed");
    audioPlay(sounds.confirm, 0.78, "sfx");
    playChibiVoice();
    await delay(280);
    overlay.classList.add("hidden");
    overlay.classList.remove("landed");
    return flowSessionAlive(sessionId, token);
  }

  function finishMapPhase(selected, sessionId, token) {
    if (!selected || !flowSessionAlive(sessionId, token)) return;
    state.selectedMap = selected;
    state.mapRoulette.active = false;
    state.mapRoulette.highlightedId = selected.id;
    state.mapRoulette.finalId = selected.id;
    updateMapRouletteClasses();
    updateSelectedMapCopy();

    if (currentRoomCode && currentRole === "host") {
      pushOnlineDraftPatch({
        force: true,
        phase: "map",
        selectedMap: { id: selected.id, name: selected.name },
        mapRoulette: serializeMapState(),
        mapEvent: { id: uid("mapSelected"), type: "mapSelectedV346", mapId: selected.id, byClientId: onlineClientId() },
      });
    }

    window.setTimeout(() => {
      if (!flowSessionAlive(sessionId, token)) return;
      if (flow.mapContext === "predraft") activateDraftAfterMap();
      else enterSummary();
    }, 650);
  }

  runMapRoulette = async function runMapRouletteV346(options = {}) {
    const sessionId = Number(options.sessionId ?? state.draftSessionId);
    const token = Number(options.flowToken ?? flow.mapToken);
    if (!flowSessionAlive(sessionId, token) || state.mapRoulette.active || !maps.length) return;
    state.mapRoulette.active = true;
    state.mapRoulette.highlightedId = null;
    state.mapRoulette.finalId = null;
    flow.mapEliminatedIds = [];
    renderMapGrid();
    updateMapRouletteClasses();

    if (currentDraftConfig().mapRandomMode === "classic-random") {
      let selected = randomFrom(maps);
      for (let i = 0; i < 24; i += 1) {
        if (!flowSessionAlive(sessionId, token)) return;
        selected = randomFrom(maps);
        state.mapRoulette.highlightedId = selected.id;
        updateMapRouletteClasses();
        audioPlay(sounds.mapRoulette || sounds.roulette, 0.76, "sfx");
        await delay(55 + i * 8);
      }
      finishMapPhase(selected, sessionId, token);
      return;
    }

    const pool = [...maps];
    const plan = eliminationPlan(pool.length);
    for (let groupIndex = 0; groupIndex < plan.length; groupIndex += 1) {
      for (let index = 0; index < plan[groupIndex]; index += 1) {
        if (!flowSessionAlive(sessionId, token) || pool.length <= 1) return;
        const target = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
        state.mapRoulette.highlightedId = target.id;
        updateMapRouletteClasses();
        const finalPause = groupIndex === plan.length - 1 && index === plan[groupIndex] - 1;

        if (currentRoomCode && currentRole === "host") {
          pushOnlineDraftPatch({
            force: true,
            phase: "map",
            mapEvent: { id: uid("chibiDrop"), type: "chibiDropV346", mapId: target.id, finalPause, byClientId: onlineClientId() },
            mapRoulette: serializeMapState(),
          });
        }

        const completed = await dropChibi(target.id, finalPause, sessionId, token);
        if (!completed) return;
        flow.mapEliminatedIds.push(target.id);
        updateMapRouletteClasses();

        if (currentRoomCode && currentRole === "host") {
          pushOnlineDraftPatch({
            force: true,
            phase: "map",
            mapEvent: { id: uid("mapEliminated"), type: "mapEliminatedV346", mapId: target.id, byClientId: onlineClientId() },
            mapRoulette: serializeMapState(),
          });
        }
        await delay(240);
      }
    }
    finishMapPhase(pool[0] || randomFrom(maps), sessionId, token);
  };

  const baseRenderMapGrid = renderMapGrid;
  renderMapGrid = function renderMapGridV346() {
    baseRenderMapGrid();
    mapGrid?.querySelectorAll(".map-card").forEach(card => {
      card.classList.toggle("map-eliminated-v346", flow.mapEliminatedIds.includes(card.dataset.mapId));
    });
  };
  const baseUpdateMapRouletteClasses = updateMapRouletteClasses;
  updateMapRouletteClasses = function updateMapRouletteClassesV346() {
    baseUpdateMapRouletteClasses();
    mapGrid?.querySelectorAll(".map-card").forEach(card => {
      card.classList.toggle("map-eliminated-v346", flow.mapEliminatedIds.includes(card.dataset.mapId));
    });
  };

  startMapSelection = function startMapSelectionV346(options = {}) {
    if (flow.phase === "draft" && state.turnIndex >= activeTurnCount() && currentDraftConfig().phaseOrder === "map-first" && state.selectedMap) {
      enterSummary();
      return;
    }
    const context = options.predraft || (currentDraftConfig().phaseOrder === "map-first" && !state.selectedMap && state.turnIndex === 0)
      ? "predraft" : "postdraft";
    enterMapPhase(context, { auto: options.auto !== false, silentNarration: Boolean(options.silentNarration) });
    if (currentRoomCode && currentRole === "host" && !options.fromOnline) {
      pushOnlineDraftPatch({
        force: true,
        phase: "map",
        preDraftMap: context === "predraft",
        turnStartedAt: null,
        turnDeadlineAt: null,
        mapRoulette: serializeMapState(),
      });
    }
  };

  document.addEventListener("click", event => {
    const card = event.target?.closest?.("#map-grid .map-card");
    if (!card || flow.phase !== "map") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (state.mapRoulette.active || !canControlMapSelection()) return;
    const map = maps.find(item => item.id === card.dataset.mapId);
    if (!map) return;
    finishMapPhase(map, state.draftSessionId, flow.mapToken);
  }, true);

  /* ------------------------------------------------------------------
   * Draft turn engine and simultaneous picks
   * ---------------------------------------------------------------- */
  function simultaneousKey(turn = currentTurn()) {
    return `${state.draftSessionId}:${state.turnIndex}:${turn?.team || "-"}:${turn?.groupId || "single"}`;
  }
  function simultaneousRecord(turn = currentTurn()) {
    const key = simultaneousKey(turn);
    if (!flow.simultaneous[key]) flow.simultaneous[key] = {};
    return flow.simultaneous[key];
  }

  const baseIsCharacterAvailable = isCharacterAvailable;
  isCharacterAvailable = function isCharacterAvailableV346(character, turn = currentTurn()) {
    if (!baseIsCharacterAvailable(character, turn)) return false;
    const reserved = new Set();
    Object.values(flow.simultaneous || {}).forEach(record => Object.values(record || {}).forEach(name => { if (name) reserved.add(String(name)); }));
    Object.values(flow.assist?.requests || {}).forEach(item => { if (item?.status === "pending" && item.characterName) reserved.add(item.characterName); });
    Object.values(flow.assist?.proposals || {}).forEach(item => { if (item?.status === "pending" && item.characterName) reserved.add(item.characterName); });
    return !reserved.has(character?.name);
  };

  const baseGetValidCharacters = getValidCharacters;
  getValidCharacters = function getValidCharactersV346() {
    const source = typeof baseGetValidCharacters === "function" ? baseGetValidCharacters() : characters;
    return source.filter(character => isCharacterAvailable(character, currentTurn()));
  };

  const baseUpdatePlayerSlotElement = updatePlayerSlotElement;
  updatePlayerSlotElement = function updatePlayerSlotElementV346(slot, team, index, turn) {
    baseUpdatePlayerSlotElement(slot, team, index, turn);
    if (!turn?.simultaneous || turn.team !== team) return;
    const slotKey = (turn.slotKeys || []).find(key => advancedSlotIndex(key) === index);
    if (!slotKey) return;
    const reservedName = simultaneousRecord(turn)[slotKey];
    slot.classList.toggle("active-turn", !reservedName);
    slot.classList.toggle("slot-reserved-v346", Boolean(reservedName));
    slot.dataset.state = reservedName ? "reserved" : "active";
    if (reservedName) {
      const character = characters.find(item => item.name === reservedName) || null;
      const portrait = slot.querySelector(".slot-portrait");
      const characterName = slot.querySelector(".slot-character");
      if (portrait && character) updatePlayerSlotPortrait(portrait, null, character);
      if (characterName && character) characterName.textContent = `${character.name} · esperando al compañero`;
    }
  };

  function pendingSlotKeys(turn = currentTurn()) {
    if (!turn?.simultaneous) return [turn?.slotKey].filter(Boolean);
    const record = simultaneousRecord(turn);
    return (turn.slotKeys || []).filter(slotKey => !record[slotKey]);
  }
  function actorSlotKey(turn = currentTurn(), options = {}) {
    if (options.botSlotKey) return options.botSlotKey;
    if (currentRoomCode) return currentOnlineSlotKey();
    return pendingSlotKeys(turn)[0] || turn?.slotKey;
  }

  const baseAdvancedSlotForTurn = advancedSlotForTurn;
  advancedSlotForTurn = function advancedSlotForTurnV346(turn = currentTurn(), slots = state.onlineSlots) {
    if (turn?.simultaneous && currentRoomCode) {
      const own = advancedAssignmentForClient(onlineClientId(), slots);
      if (own?.team === turn.team && (turn.slotKeys || []).includes(own.slotKey)) return own.slot;
    }
    return baseAdvancedSlotForTurn(turn, slots);
  };

  canControlCurrentTurn = function canControlCurrentTurnV346() {
    if (flow.phase !== "draft" || !state.draftActive) return false;
    const turn = currentTurn();
    if (!turn) return false;
    if (!currentRoomCode) return true;
    if (currentRole !== "player") return false;
    if (state.turnStartedAt && onlineNow() < Number(state.turnStartedAt)) return false;
    if (isAdvancedDraftConfig()) {
      const own = advancedAssignmentForClient(onlineClientId(), state.onlineSlots);
      if (!own || own.team !== turn.team) return false;
      const allowed = turn.simultaneous ? turn.slotKeys : [turn.slotKey];
      return allowed.includes(own.slotKey) && !simultaneousRecord(turn)[own.slotKey];
    }
    return currentOnlineTeamLetter() === turn.team;
  };

  function resetActionVisuals() {
    state.flashBan = null;
    state.flashPick = null;
    state.banAnimation = null;
    state.pickAnimation = null;
    state.selected = null;
    state.preselectLocked = false;
    state.locked = false;
    state.roulette = { active: false, highlightedName: null, finalName: null, previewCharacter: null };
  }

  function prepareNextTurn(previousStage) {
    resetActionVisuals();
    onlineTurnAutoResolveKey = null;
    if (state.turnIndex >= activeTurnCount()) {
      if (currentDraftConfig().phaseOrder === "map-first" && state.selectedMap) enterSummary();
      else enterMapPhase("postdraft");
      return;
    }
    const nextStage = turnStage(currentTurn());
    if (currentRoomCode) {
      prepareClockForTurnIndex(state.turnIndex, previousStage !== nextStage ? phaseOverlayDurationMs() : 0);
      state.onlinePhase = "draft";
      pushOnlineDraftState({
        phase: "draft",
        turnIndex: state.turnIndex,
        turnStartedAt: state.turnStartedAt,
        turnDeadlineAt: state.turnDeadlineAt,
        phaseEvent: previousStage !== nextStage ? createOnlinePhaseEvent(`stage-${nextStage}`) : null,
        actionEvent: null,
      });
    }
    if (previousStage !== nextStage) showStage(nextStage, startTurn);
    else startTurn();
  }

  function commitSingleAction(turn, character, isAuto) {
    let wait = 360;
    let event = null;
    if (turn.type === "ban") {
      state.bans[turn.team].push(character);
      state.flashBan = character.name;
      state.banAnimation = { character, team: turn.team };
      event = createOnlineActionEvent("ban", turn.team, character, { isAuto });
      audioPlay(sounds.ban, 0.86, "sfx");
      playCharacterVoice(character, "ban");
      wait = confirmedActionAnimationDuration("ban", isAuto) + 150;
    } else {
      state.picks[turn.team].push(character);
      state.flashPick = character.name;
      state.pickBatchSelections[turn.groupId] = [...(state.pickBatchSelections[turn.groupId] || []), character];
      if (state.settings.selectionAnimationEnabled) {
        state.pickAnimation = { character, team: turn.team };
        wait = confirmedActionAnimationDuration("pick", isAuto) + 150;
      }
      event = createOnlineActionEvent("pick", turn.team, character, { isAuto, slotKey: turn.slotKey });
      audioPlay(sounds.confirm, 0.86, "sfx");
      playCharacterVoice(character, "pick");
    }
    syncDraftAnimationTiming();
    renderConfirmedActionState();
    pushOnlineDraftState({ phase: "draft", actionEvent: event });
    return wait;
  }

  function finalizeSimultaneousGroup(turn, isAuto = false) {
    const record = simultaneousRecord(turn);
    const charactersInOrder = turn.slotKeys.map(slotKey => characterFromOnlineValue(record[slotKey])).filter(Boolean);
    if (charactersInOrder.length !== turn.slotKeys.length) return false;
    charactersInOrder.forEach(character => state.picks[turn.team].push(character));
    state.pickBatchSelections[turn.groupId] = [...charactersInOrder];
    state.flashPick = charactersInOrder[charactersInOrder.length - 1]?.name || null;
    audioPlay(sounds.confirm, 0.86, "sfx");
    charactersInOrder.forEach(character => playCharacterVoice(character, "pick"));
    renderConfirmedActionState();
    const previousStage = turnStage(turn);
    const nextTurnIndex = state.turnIndex + 1;
    if (currentRoomCode) {
      pushOnlineDraftState({
        phase: "draft",
        rp346Simultaneous: clone(flow.simultaneous, {}),
        actionEvent: createOnlineActionEvent("pickGroup", turn.team, charactersInOrder[0], { isAuto, characters: charactersInOrder.map(item => item.name) }),
      });
    }
    window.setTimeout(() => {
      state.turnIndex = nextTurnIndex;
      prepareNextTurn(previousStage);
    }, confirmedActionAnimationDuration("pick", isAuto) + 130);
    return true;
  }

  async function registerSimultaneousSelection(turn, character, options = {}) {
    const slotKey = actorSlotKey(turn, options);
    if (!slotKey || !turn.slotKeys.includes(slotKey)) return false;
    const key = simultaneousKey(turn);
    const record = simultaneousRecord(turn);
    if (record[slotKey]) return false;

    if (currentRoomCode) {
      const roomRef = roomRefFor(currentRoomCode);
      if (!roomRef) return false;
      const path = `draftState/rp346Simultaneous/${encodeURIComponent(key)}/${slotKey}`;
      const result = await roomRef.child(path).transaction(existing => existing || character.name);
      if (!result?.committed) return false;
      record[slotKey] = character.name;
      pushOnlineDraftPatch({ force: true, rp346Simultaneous: clone(flow.simultaneous, {}) });
    } else {
      record[slotKey] = character.name;
    }

    state.pickBatchSelections[turn.groupId] = turn.slotKeys.map(keyName => characterFromOnlineValue(record[keyName])).filter(Boolean);
    state.selected = null;
    state.preselectLocked = false;
    state.locked = false;
    renderDraftStateLight({ refreshPreviewPanels: true });

    if (turn.slotKeys.every(keyName => Boolean(record[keyName]))) {
      if (!currentRoomCode || currentRole === "host") finalizeSimultaneousGroup(turn, Boolean(options.isAuto));
    } else {
      resetTimer();
      scheduleTestingBotTurn();
    }
    return true;
  }

  confirmTurn = function confirmTurnV346(isAuto = false, options = {}) {
    if (flow.phase !== "draft" || !state.draftActive) return;
    const allowSystem = Boolean(options.onlineSystem);
    if (!allowSystem && !canControlCurrentTurn()) return;
    const turn = currentTurn();
    if (!turn || state.locked || !state.selected || !isCharacterAvailable(state.selected, turn)) return;

    if (flow.assistTarget && turn.type === "pick" && !options.assistCommit) {
      const target = flow.assistTarget;
      flow.assistTarget = null;
      createProposal(target, state.selected);
      state.selected = null;
      state.preselectLocked = false;
      state.locked = false;
      renderDraftStateLight({ refreshPreviewPanels: true });
      return;
    }

    if (turn.simultaneous) {
      const selected = state.selected;
      state.locked = true;
      clearInterval(state.timerId);
      void registerSimultaneousSelection(turn, selected, { ...options, isAuto });
      return;
    }

    state.locked = true;
    clearInterval(state.timerId);
    timerCore?.classList.remove("timer-warning");
    const previousStage = turnStage(turn);
    const wait = commitSingleAction(turn, state.selected, isAuto);
    window.setTimeout(() => {
      state.turnIndex += 1;
      prepareNextTurn(previousStage);
    }, wait);
  };

  proceedAfterTurn = function proceedAfterTurnV346() {
    if (flow.phase !== "draft" || !state.draftActive) return;
    if (state.turnIndex >= activeTurnCount()) {
      if (currentDraftConfig().phaseOrder === "map-first" && state.selectedMap) enterSummary();
      else enterMapPhase("postdraft");
      return;
    }
    startTurn();
  };

  startTurn = function startTurnV346(options = {}) {
    if (flow.phase !== "draft" || !state.draftActive) return;
    state.selected = null;
    state.preselectLocked = false;
    state.locked = false;
    document.body.classList.remove("overlay-lock", "phase-announcing");
    if (characterGrid?.children?.length) renderDraftStateLight({ refreshPreviewPanels: true });
    else renderAll();
    renderAssistUi();
    if (!options.skipNarration) playTurnNarration(currentTurn());
    resetTimer();
    scheduleTestingBotTurn();
  };

  function activateDraftAfterMap() {
    if (!state.selectedMap) return;
    clearMapTimer();
    flow.phase = "draft";
    state.draftActive = true;
    state.onlinePhase = currentRoomCode ? "draft" : "local";
    state.turnIndex = 0;
    state.locked = false;
    state.turnStartedAt = null;
    state.turnDeadlineAt = null;
    prepareClockForTurnIndex(0, phaseOverlayDurationMs());
    switchScreen(draftScreen);
    setupBackgroundVideo();
    startMusic("draft");

    if (currentRoomCode && currentRole === "host") {
      onlineStartedForRoom = currentRoomCode;
      onlineRoomStartedState = true;
      pushOnlineDraftState({
        force: true,
        phase: "draft",
        preDraftMap: false,
        turnIndex: 0,
        turnStartedAt: state.turnStartedAt,
        turnDeadlineAt: state.turnDeadlineAt,
        selectedMap: { id: state.selectedMap.id, name: state.selectedMap.name },
        rp346Simultaneous: {},
        rp346Assist: { requests: {}, proposals: {} },
      });
    }
    showStage("leader-picks", startTurn);
  }

  function enterSummary() {
    clearBotTimers();
    flow.phase = "summary";
    state.onlinePhase = currentRoomCode ? "summary" : state.onlinePhase;
    if (currentRoomCode && currentRole === "host") {
      pushOnlineDraftState({ force: true, phase: "summary", audioEvent: createOnlineAudioEvent("finishDraft", { playForOrigin: false }) });
    }
    showSummaryIntro({ fromOnline: Boolean(currentRoomCode), skipNarration: Boolean(currentRoomCode) });
  }

  startDraft = async function startDraftV346() {
    if (state.startingDraft) return;
    state.startingDraft = true;
    setStartDraftLoading(true);
    await playUiSound(sounds.startDraft, 1);
    await delay(700);
    state.draftConfig = sanitizeDraftConfig({ ...state.draftConfig, mode: "advanced", pickPreset: "official" });
    resetDraftStateBeforeStart();
    clearDraftTimeouts();
    clearMapTimer();
    clearBotTimers();
    state.draftSessionId += 1;
    flow.phase = "idle";
    flow.simultaneous = {};
    flow.assist = { requests: {}, proposals: {} };
    flow.assistTarget = null;
    flow.botKeys = {};
    state.startingDraft = false;
    setStartDraftLoading(false);
    setupBackgroundVideo();
    startMusic("draft");

    if (currentDraftConfig().phaseOrder === "map-first") {
      state.draftActive = false;
      enterMapPhase("predraft");
      return;
    }
    flow.phase = "draft";
    state.draftActive = true;
    state.onlinePhase = "local";
    switchScreen(draftScreen);
    showStage("leader-picks", startTurn);
  };

  /* ------------------------------------------------------------------
   * PEDIR and selecting for a teammate
   * ---------------------------------------------------------------- */
  function normalizeAssist(value = {}) {
    return {
      requests: value?.requests && typeof value.requests === "object" ? { ...value.requests } : {},
      proposals: value?.proposals && typeof value.proposals === "object" ? { ...value.proposals } : {},
    };
  }

  function writeAssist() {
    flow.assist = normalizeAssist(flow.assist);
    if (currentRoomCode) {
      roomRefFor(currentRoomCode)?.child("draftState/rp346Assist").set(clone(flow.assist, { requests: {}, proposals: {} }));
    }
    renderAssistUi();
  }

  function ownAssignment() {
    return currentRoomCode ? advancedAssignmentForClient(onlineClientId(), state.onlineSlots) : null;
  }

  function canRequest() {
    if (!currentRoomCode || flow.phase !== "draft" || !state.draftActive || !isAdvancedDraftConfig()) return false;
    const turn = currentTurn();
    const own = ownAssignment();
    if (!turn || turn.type !== "pick" || !own || own.team !== turn.team) return false;
    if (!/^player[3-5]$/.test(own.slotKey) || (turn.slotKeys || [turn.slotKey]).includes(own.slotKey)) return false;
    return !state.picks[own.team]?.[advancedSlotIndex(own.slotKey)];
  }

  function canDelegate() {
    if (!currentRoomCode || !canControlCurrentTurn() || !isAdvancedDraftConfig()) return false;
    const own = ownAssignment();
    if (!own) return false;
    const mode = currentDraftConfig().delegationMode;
    if (mode === "none") return false;
    if (mode === "all_members") return true;
    if (mode === "captain_only") return own.slotKey === "captain";
    return own.slotKey === "captain" || own.slotKey === "subcaptain";
  }

  function createRequest(character) {
    const own = ownAssignment();
    const turn = currentTurn();
    if (!own || !turn || !character || !canRequest()) return;
    const id = `${own.team}:${own.slotKey}`;
    flow.assist.requests[id] = {
      id,
      status: "pending",
      team: own.team,
      slotKey: own.slotKey,
      slotIndex: advancedSlotIndex(own.slotKey),
      requesterClientId: onlineClientId(),
      requesterName: own.slot?.name || state.players[own.team][advancedSlotIndex(own.slotKey)],
      characterName: character.name,
      turnIndex: state.turnIndex,
      draftSessionId: state.draftSessionId,
      createdAt: now(),
      expiresAt: now() + 30000,
    };
    state.selected = null;
    state.preselectLocked = false;
    writeAssist();
    showAppNotice(`Solicitud enviada: ${character.name}.`, { type: "info" });
  }

  function swapSlots(team, sourceKey, targetKey) {
    if (!team || !sourceKey || !targetKey || sourceKey === targetKey) return;
    if (currentRoomCode) {
      const slots = state.onlineSlots;
      const temp = slots[team][sourceKey];
      slots[team][sourceKey] = slots[team][targetKey];
      slots[team][targetKey] = temp;
      applyAdvancedSlotsToPlayers(slots, currentDraftConfig());
      roomRefFor(currentRoomCode)?.update({
        slots: clone(slots, {}),
        "draftState/slots": clone(slots, {}),
        players: clone(state.players, {}),
        "draftState/players": clone(state.players, {}),
        updatedAt: onlineNow(),
      });
    } else {
      const sourceIndex = advancedSlotIndex(sourceKey);
      const targetIndex = advancedSlotIndex(targetKey);
      [state.players[team][sourceIndex], state.players[team][targetIndex]] = [state.players[team][targetIndex], state.players[team][sourceIndex]];
    }
  }

  function acceptRequest(id, options = {}) {
    const request = flow.assist.requests[id];
    const turn = currentTurn();
    if (!request || !turn || request.status !== "pending" || request.team !== turn.team) return;
    if (!options.botSystem && !canControlCurrentTurn()) return;
    const character = characters.find(item => item.name === request.characterName);
    if (!character || !baseIsCharacterAvailable(character, turn)) {
      delete flow.assist.requests[id];
      writeAssist();
      return;
    }
    const sourceKey = options.botSlotKey || actorSlotKey(turn, options);
    swapSlots(turn.team, sourceKey, request.slotKey);
    delete flow.assist.requests[id];
    writeAssist();
    state.selected = character;
    confirmTurn(false, { onlineSystem: Boolean(options.botSystem), botSlotKey: sourceKey, assistCommit: true });
  }

  function rejectRequest(id, options = {}) {
    const request = flow.assist.requests[id];
    if (!request) return;
    if (!options.botSystem && !canControlCurrentTurn()) return;
    delete flow.assist.requests[id];
    writeAssist();
  }

  function createProposal(target, character, options = {}) {
    const turn = currentTurn();
    if (!turn || !target || !character) return;
    const actor = options.actor || ownAssignment();
    if (!actor) return;
    const id = uid("proposal");
    flow.assist.proposals[id] = {
      id,
      status: "pending",
      team: turn.team,
      sourceSlotKey: actor.slotKey,
      initiatorClientId: actor.clientId || onlineClientId(),
      initiatorName: actor.slot?.name || actor.name || "Compañero",
      initiatorIsBot: Boolean(actor.isBot || actor.slot?.isBot),
      targetSlotKey: target.slotKey,
      targetClientId: target.clientId,
      targetName: target.name,
      targetIsBot: Boolean(target.isBot),
      characterName: character.name,
      turnIndex: state.turnIndex,
      draftSessionId: state.draftSessionId,
      createdAt: now(),
      expiresAt: now() + ASSIST_TIMEOUT_MS,
    };
    writeAssist();
    showAppNotice(`Esperando confirmación de ${target.name}...`, { type: "info", duration: ASSIST_TIMEOUT_MS });
    if (target.isBot && currentRole === "host") scheduleBotProposalDecision(id);
  }

  function acceptProposal(id, options = {}) {
    const proposal = flow.assist.proposals[id];
    const turn = currentTurn();
    if (!proposal || !turn || proposal.status !== "pending") return;
    const isRecipient = currentRoomCode && proposal.targetClientId === onlineClientId();
    if (!options.botSystem && !isRecipient) return;
    const character = characters.find(item => item.name === proposal.characterName);
    if (!character || !baseIsCharacterAvailable(character, turn)) {
      delete flow.assist.proposals[id];
      writeAssist();
      return;
    }
    swapSlots(proposal.team, proposal.sourceSlotKey, proposal.targetSlotKey);
    delete flow.assist.proposals[id];
    writeAssist();
    if (currentRoomCode && currentRole !== "host" && !options.botSystem) {
      roomRefFor(currentRoomCode)?.child("draftState/rp346AcceptedProposal").set({ ...proposal, acceptedAt: now(), acceptedBy: onlineClientId() });
      return;
    }
    state.selected = character;
    confirmTurn(false, { onlineSystem: true, botSlotKey: proposal.sourceSlotKey, assistCommit: true });
  }

  function resumeBotTurnAfterAssist(item) {
    if (!item?.initiatorIsBot) return;
    const key = `botTurn:${item.draftSessionId}:${item.turnIndex}:${item.sourceSlotKey}`;
    delete flow.botKeys[key];
    botTimeout(() => {
      if (flow.phase === "draft" && state.turnIndex === item.turnIndex) scheduleTestingBotTurn();
    }, 220);
  }

  function rejectProposal(id, options = {}) {
    const proposal = flow.assist.proposals[id];
    if (!proposal) return;
    const isRecipient = currentRoomCode && proposal.targetClientId === onlineClientId();
    if (!options.botSystem && !isRecipient) return;
    delete flow.assist.proposals[id];
    writeAssist();
    if (currentRoomCode && currentRole !== "host" && proposal.initiatorIsBot) {
      roomRefFor(currentRoomCode)?.child("draftState/rp346RejectedProposal").set({
        id: proposal.id,
        draftSessionId: proposal.draftSessionId,
        turnIndex: proposal.turnIndex,
        sourceSlotKey: proposal.sourceSlotKey,
        initiatorIsBot: true,
        rejectedAt: now(),
        rejectedBy: onlineClientId(),
      });
    }
    resumeBotTurnAfterAssist(proposal);
  }

  function cleanExpiredAssist() {
    const timestamp = now();
    let changed = false;
    Object.entries(flow.assist.requests).forEach(([id, item]) => {
      if (!item || item.draftSessionId !== state.draftSessionId || Number(item.expiresAt || 0) <= timestamp) {
        delete flow.assist.requests[id];
        changed = true;
      }
    });
    Object.entries(flow.assist.proposals).forEach(([id, item]) => {
      if (!item || item.draftSessionId !== state.draftSessionId || Number(item.expiresAt || 0) <= timestamp) {
        delete flow.assist.proposals[id];
        resumeBotTurnAfterAssist(item);
        changed = true;
      }
    });
    if (changed && currentRoomCode && currentRole === "host") writeAssist();
  }

  function slotElement(team, slotKey) {
    const index = advancedSlotIndex(slotKey);
    const root = team === "A" ? document.getElementById("team-a-slots") : document.getElementById("team-b-slots");
    return root?.children?.[index] || null;
  }

  function clampMenu(menu, anchor) {
    const rect = anchor.getBoundingClientRect();
    const width = 230;
    const left = Math.max(12, Math.min(window.innerWidth - width - 12, rect.left + rect.width / 2 - width / 2));
    const height = Math.max(96, menu.offsetHeight || 102);
    const top = Math.max(12, rect.top - height - 8);
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  }

  function showSlotMenu(anchor, target) {
    document.querySelectorAll(".rp346-slot-menu").forEach(node => node.remove());
    const menu = document.createElement("div");
    menu.className = "rp346-slot-menu";
    menu.innerHTML = `<strong>${target.name}</strong><button type="button" data-action="select">SELECCIONAR PJ</button><button type="button" data-action="cancel">CANCELAR</button>`;
    document.body.appendChild(menu);
    clampMenu(menu, anchor);
    menu.querySelector('[data-action="select"]')?.addEventListener("click", () => {
      flow.assistTarget = target;
      menu.remove();
      showAppNotice(`Selecciona el laminante para ${target.name}.`, { type: "info" });
    });
    menu.querySelector('[data-action="cancel"]')?.addEventListener("click", () => menu.remove());
  }

  function bindSlotMenus() {
    document.querySelectorAll("#team-a-slots > *, #team-b-slots > *").forEach(element => {
      element.classList.remove("rp346-delegatable-slot");
      delete element.dataset.rp346TargetTeam;
      delete element.dataset.rp346TargetSlot;
    });
    if (!canDelegate()) return;
    const turn = currentTurn();
    if (!turn) return;
    advancedSlotsForTeamSize(activeTeamSize()).forEach(slotKey => {
      if ((turn.slotKeys || [turn.slotKey]).includes(slotKey)) return;
      const slot = state.onlineSlots?.[turn.team]?.[slotKey];
      if (!slot?.clientId || state.picks[turn.team]?.[advancedSlotIndex(slotKey)]) return;
      const element = slotElement(turn.team, slotKey);
      if (!element) return;
      element.classList.add("rp346-delegatable-slot");
      element.dataset.rp346TargetTeam = turn.team;
      element.dataset.rp346TargetSlot = slotKey;
    });
  }

  document.addEventListener("click", event => {
    const element = event.target?.closest?.(".rp346-delegatable-slot[data-rp346-target-slot]");
    if (!element || !canDelegate()) return;
    const turn = currentTurn();
    const team = element.dataset.rp346TargetTeam;
    const slotKey = element.dataset.rp346TargetSlot;
    if (!turn || team !== turn.team || (turn.slotKeys || [turn.slotKey]).includes(slotKey)) return;
    const slot = state.onlineSlots?.[team]?.[slotKey];
    if (!slot?.clientId || state.picks[team]?.[advancedSlotIndex(slotKey)]) return;
    event.preventDefault();
    event.stopPropagation();
    showSlotMenu(element, { team, slotKey, clientId: slot.clientId, name: slot.name, isBot: isTestingBotParticipant(slot) });
  }, true);

  function renderRequestBubbles() {
    document.querySelectorAll(".rp346-request-bubble").forEach(node => node.remove());
    Object.values(flow.assist.requests).forEach(request => {
      if (request.status !== "pending" || request.turnIndex !== state.turnIndex) return;
      const anchor = slotElement(request.team, request.slotKey);
      if (!anchor) return;
      const bubble = document.createElement("div");
      bubble.className = "rp346-request-bubble";
      bubble.innerHTML = `<span>ESTÁ PIDIENDO</span><strong>${request.characterName}</strong>`;
      if (canControlCurrentTurn()) {
        const actions = document.createElement("div");
        actions.className = "rp346-request-actions";
        actions.innerHTML = `<button type="button" data-accept>ACEPTAR</button><button type="button" data-reject>RECHAZAR</button>`;
        actions.querySelector("[data-accept]")?.addEventListener("click", event => { event.stopPropagation(); acceptRequest(request.id); });
        actions.querySelector("[data-reject]")?.addEventListener("click", event => { event.stopPropagation(); rejectRequest(request.id); });
        bubble.appendChild(actions);
      }
      anchor.appendChild(bubble);
    });
  }

  function renderProposalModal() {
    document.querySelectorAll(".rp346-assist-modal").forEach(node => node.remove());
    const proposal = Object.values(flow.assist.proposals).find(item => item.status === "pending" && item.turnIndex === state.turnIndex && item.draftSessionId === state.draftSessionId);
    if (!proposal) return;
    const isRecipient = currentRoomCode && proposal.targetClientId === onlineClientId() && !proposal.targetIsBot;
    const isInitiator = currentRoomCode && proposal.initiatorClientId === onlineClientId();
    if (!isRecipient && !isInitiator) return;

    const modal = document.createElement("section");
    modal.className = `rp346-assist-modal ${isInitiator ? "waiting" : "decision"}`;
    const remaining = Math.max(0, Number(proposal.expiresAt) - now());
    modal.innerHTML = isRecipient
      ? `<div class="rp346-assist-avatar"><img src="img/characters/${proposal.characterName}/thumb.png" alt=""></div><div class="rp346-assist-content"><span>SOLICITUD DE ASIGNACIÓN</span><strong>${proposal.initiatorName} quiere asegurarte ${proposal.characterName}</strong><p>Al aceptar, ambos intercambiarán su orden de selección.</p><div class="rp346-assist-progress"><i></i></div></div><div class="rp346-assist-buttons"><button data-accept>ACEPTAR</button><button data-reject>RECHAZAR</button></div>`
      : `<div class="rp346-assist-content"><span>ASIGNACIÓN ENVIADA</span><strong>Esperando confirmación de ${proposal.targetName}</strong><p>${proposal.characterName}</p><div class="rp346-assist-progress"><i></i></div></div>`;
    document.body.appendChild(modal);
    const bar = modal.querySelector(".rp346-assist-progress i");
    if (bar) bar.style.animationDuration = `${remaining}ms`;
    modal.querySelector("[data-accept]")?.addEventListener("click", () => acceptProposal(proposal.id));
    modal.querySelector("[data-reject]")?.addEventListener("click", () => rejectProposal(proposal.id));
  }

  function updateRequestButton() {
    const button = ensureRandomSelectionButton();
    if (!button) return;
    const requestMode = canRequest();
    button.dataset.rp346RequestMode = requestMode ? "1" : "0";
    if (requestMode) {
      button.classList.remove("hidden");
      button.textContent = "PEDIR";
      button.title = "Pedir el laminante seleccionado";
    } else {
      button.textContent = t("random_selection_button");
      button.title = t("random_selection_button");
    }
  }

  function renderAssistUi() {
    cleanExpiredAssist();
    updateRequestButton();
    bindSlotMenus();
    renderRequestBubbles();
    renderProposalModal();
  }

  document.addEventListener("click", event => {
    const requestButton = event.target?.closest?.("#random-selection-action[data-rp346-request-mode='1']");
    if (!requestButton) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!state.selected || !baseIsCharacterAvailable(state.selected, currentTurn())) {
      showAppNotice("Selecciona primero el laminante que deseas pedir.", { type: "warning" });
      return;
    }
    createRequest(state.selected);
  }, true);

  /* ------------------------------------------------------------------
   * Bot behavior
   * ---------------------------------------------------------------- */
  function chooseBotCharacter(team) {
    const valid = getValidCharacters();
    if (!valid.length) return null;
    const usedRoles = new Set((state.picks[team] || []).map(character => roleOf(character.name)));
    const priority = ["Soporte", "Controlador", "Vanguardia", "Centinela", "Duelista"];
    const missing = priority.find(role => !usedRoles.has(role));
    const pool = missing ? valid.filter(character => roleOf(character.name) === missing) : valid;
    const choices = pool.length ? pool : valid;
    return choices[Math.floor(Math.random() * choices.length)];
  }

  function botSlotsForTurn(turn = currentTurn()) {
    if (!currentRoomCode || currentRole !== "host" || !turn || !isAdvancedDraftConfig()) return [];
    return (turn.slotKeys || [turn.slotKey])
      .map(slotKey => ({ slotKey, slot: state.onlineSlots?.[turn.team]?.[slotKey] }))
      .filter(item => item.slot && isTestingBotParticipant(item.slot));
  }

  function scheduleBotProposalDecision(id) {
    const key = `proposal:${id}`;
    if (flow.botKeys[key]) return;
    flow.botKeys[key] = true;
    botTimeout(() => {
      const proposal = flow.assist.proposals[id];
      if (!proposal || proposal.status !== "pending") return;
      if (Math.random() < 0.82) acceptProposal(id, { botSystem: true });
      else rejectProposal(id, { botSystem: true });
    }, randomDelay());
  }

  function botAssistTurnKey(turn = currentTurn()) {
    return `assistAction:${state.draftSessionId}:${state.turnIndex}:${turn?.team || "-"}`;
  }

  function scheduleBotMemberRequest(turn) {
    if (turnStage(turn) !== "leader-picks") return false;
    const assistKey = botAssistTurnKey(turn);
    if (flow.botKeys[assistKey]) return flow.botKeys[assistKey] === "request" || flow.botKeys[assistKey] === "scheduled-request";
    const members = ["player3", "player4", "player5"]
      .map(slotKey => ({ slotKey, slot: state.onlineSlots?.[turn.team]?.[slotKey] }))
      .filter(item => item.slot && isTestingBotParticipant(item.slot) && !state.picks[turn.team]?.[advancedSlotIndex(item.slotKey)]);
    const candidate = members.find(item => !flow.assist.requests[`${turn.team}:${item.slotKey}`]);
    if (!candidate || Math.random() > 0.3) return false;
    flow.botKeys[assistKey] = "scheduled-request";
    const turnIndexSnapshot = state.turnIndex;
    const sessionSnapshot = state.draftSessionId;
    botTimeout(() => {
      if (flow.phase !== "draft" || state.turnIndex !== turnIndexSnapshot || state.draftSessionId !== sessionSnapshot) return;
      const character = chooseBotCharacter(turn.team);
      if (!character) {
        delete flow.botKeys[assistKey];
        return;
      }
      const id = `${turn.team}:${candidate.slotKey}`;
      flow.assist.requests[id] = {
        id,
        status: "pending",
        team: turn.team,
        slotKey: candidate.slotKey,
        slotIndex: advancedSlotIndex(candidate.slotKey),
        requesterClientId: candidate.slot.clientId,
        requesterName: candidate.slot.name,
        characterName: character.name,
        turnIndex: state.turnIndex,
        draftSessionId: state.draftSessionId,
        createdAt: now(),
        expiresAt: now() + 30000,
        isBot: true,
      };
      flow.botKeys[assistKey] = "request";
      writeAssist();
    }, randomDelay(320, 620));
    return true;
  }

  function botCanDelegateFromSlot(slotKey) {
    const mode = currentDraftConfig().delegationMode;
    if (mode === "none") return false;
    if (mode === "all_members") return true;
    if (mode === "captain_only") return slotKey === "captain";
    return slotKey === "captain" || slotKey === "subcaptain";
  }

  function maybeCreateBotProposal(turn, slotKey, slot) {
    if (turn.type !== "pick" || turnStage(turn) !== "leader-picks" || !botCanDelegateFromSlot(slotKey) || Math.random() > 0.24) return false;
    const assistKey = botAssistTurnKey(turn);
    if (flow.botKeys[assistKey]) return false;
    const activeKeys = new Set(turn.slotKeys || [turn.slotKey]);
    const targets = advancedSlotsForTeamSize(activeTeamSize())
      .filter(targetKey => targetKey !== slotKey && !activeKeys.has(targetKey))
      .map(targetKey => ({ targetKey, target: state.onlineSlots?.[turn.team]?.[targetKey] }))
      .filter(item => item.target?.clientId && !state.picks[turn.team]?.[advancedSlotIndex(item.targetKey)]);
    if (!targets.length) return false;
    const picked = targets[Math.floor(Math.random() * targets.length)];
    const character = chooseBotCharacter(turn.team);
    if (!character) return false;
    flow.botKeys[assistKey] = "proposal";
    createProposal({
      team: turn.team,
      slotKey: picked.targetKey,
      clientId: picked.target.clientId,
      name: picked.target.name,
      isBot: isTestingBotParticipant(picked.target),
    }, character, {
      actor: { team: turn.team, slotKey, clientId: slot.clientId, name: slot.name, isBot: true, slot },
    });
    return true;
  }

  scheduleTestingBotTurn = function scheduleTestingBotTurnV346() {
    try { clearTestingBotTurnTimer(); } catch (_) {}
    if (!currentRoomCode || currentRole !== "host" || flow.phase !== "draft" || !state.draftActive || state.locked || state.roulette.active) return;
    const turn = currentTurn();
    if (!turn) return;
    const memberRequestScheduled = scheduleBotMemberRequest(turn);

    const actorBots = botSlotsForTurn(turn).filter(item => !simultaneousRecord(turn)[item.slotKey]);
    actorBots.forEach(({ slotKey, slot }, index) => {
      const key = `botTurn:${state.draftSessionId}:${state.turnIndex}:${slotKey}`;
      if (flow.botKeys[key]) return;
      flow.botKeys[key] = true;
      const turnIndexSnapshot = state.turnIndex;
      const sessionSnapshot = state.draftSessionId;
      botTimeout(() => {
        if (flow.phase !== "draft" || state.turnIndex !== turnIndexSnapshot || state.draftSessionId !== sessionSnapshot) return;
        const assistKey = botAssistTurnKey(turn);
        const pendingRequest = Object.values(flow.assist.requests).find(item => item.status === "pending" && item.team === turn.team && item.turnIndex === state.turnIndex);
        if (pendingRequest) {
          if (Math.random() < 0.8) acceptRequest(pendingRequest.id, { botSystem: true, botSlotKey: slotKey });
          else rejectRequest(pendingRequest.id, { botSystem: true });
          return;
        }
        if (memberRequestScheduled || flow.botKeys[assistKey] === "scheduled-request") {
          delete flow.botKeys[key];
          botTimeout(() => scheduleTestingBotTurn(), 260);
          return;
        }
        if (maybeCreateBotProposal(turn, slotKey, slot)) return;
        const character = chooseBotCharacter(turn.team);
        if (!character) return;
        state.selected = character;
        confirmTurn(true, { onlineSystem: true, botSlotKey: slotKey });
      }, randomDelay() + index * 280);
    });
  };

  /* ------------------------------------------------------------------
   * Online lifecycle
   * ---------------------------------------------------------------- */
  const baseCurrentOnlineDraftPayload = currentOnlineDraftPayload;
  currentOnlineDraftPayload = function currentOnlineDraftPayloadV346(extra = {}) {
    return baseCurrentOnlineDraftPayload({
      rp346Flow: { phase: flow.phase, mapContext: flow.mapContext },
      rp346Simultaneous: clone(flow.simultaneous, {}),
      rp346Assist: clone(flow.assist, { requests: {}, proposals: {} }),
      mapRoulette: serializeMapState(),
      ...extra,
    });
  };

  const baseBlankOnlineDraftState = blankOnlineDraftState;
  blankOnlineDraftState = function blankOnlineDraftStateV346(payload = {}) {
    return baseBlankOnlineDraftState({
      rp346Flow: { phase: "idle", mapContext: "predraft" },
      rp346Simultaneous: {},
      rp346Assist: { requests: {}, proposals: {} },
      ...payload,
    });
  };

  const baseSyncDraftStateFromRoom = syncDraftStateFromRoom;
  syncDraftStateFromRoom = function syncDraftStateFromRoomV346(data = {}) {
    const draftState = data.draftState || {};
    if (draftState.rp346Simultaneous && typeof draftState.rp346Simultaneous === "object") flow.simultaneous = clone(draftState.rp346Simultaneous, {});
    if (draftState.rp346Assist && typeof draftState.rp346Assist === "object") flow.assist = normalizeAssist(draftState.rp346Assist);
    if (Array.isArray(draftState.mapRoulette?.eliminatedIds)) flow.mapEliminatedIds = [...draftState.mapRoulette.eliminatedIds];

    const syncedTurn = currentTurn();
    if (syncedTurn?.simultaneous) {
      const record = simultaneousRecord(syncedTurn);
      state.pickBatchSelections[syncedTurn.groupId] = syncedTurn.slotKeys.map(key => characterFromOnlineValue(record[key])).filter(Boolean);
    }
    if (currentRole === "host") {
      Object.values(flow.assist.proposals).forEach(item => {
        if (item?.status === "pending" && item.targetIsBot) scheduleBotProposalDecision(item.id);
      });
    }

    const accepted = draftState.rp346AcceptedProposal;
    if (accepted && currentRole === "host" && accepted.acceptedAt && flow.botKeys[`accepted:${accepted.id}`] !== true) {
      flow.botKeys[`accepted:${accepted.id}`] = true;
      const character = characters.find(item => item.name === accepted.characterName);
      if (character) {
        state.selected = character;
        confirmTurn(false, { onlineSystem: true, botSlotKey: accepted.sourceSlotKey, assistCommit: true });
      }
      roomRefFor(currentRoomCode)?.child("draftState/rp346AcceptedProposal").remove();
    }
    const rejected = draftState.rp346RejectedProposal;
    if (rejected && currentRole === "host" && rejected.rejectedAt && flow.botKeys[`rejected:${rejected.id}`] !== true) {
      flow.botKeys[`rejected:${rejected.id}`] = true;
      resumeBotTurnAfterAssist(rejected);
      roomRefFor(currentRoomCode)?.child("draftState/rp346RejectedProposal").remove();
    }

    const result = baseSyncDraftStateFromRoom(data);
    renderAssistUi();
    if (currentRole === "host" && currentTurn()?.simultaneous) {
      const turn = currentTurn();
      const record = simultaneousRecord(turn);
      if (turn.slotKeys.every(key => Boolean(record[key])) && !state.locked) finalizeSimultaneousGroup(turn);
    }
    return result;
  };

  const baseStartOnlineDraftNow = startOnlineDraftNow;
  startOnlineDraftNow = async function startOnlineDraftNowV346(roomRef, roomData = {}) {
    const prepared = prepareOnlineDraftStart(roomData);
    const config = sanitizeDraftConfig({ ...prepared.draftConfig, mode: "advanced", pickPreset: "official" });
    if (config.phaseOrder !== "map-first") {
      state.draftConfig = config;
      return baseStartOnlineDraftNow(roomRef, { ...roomData, draftConfig: config });
    }
    const { assignments, slots, players, captainA, captainB } = prepared;
    resetDraftStateBeforeStart();
    state.draftConfig = config;
    state.onlineSlots = slots;
    state.players = players;
    state.draftSessionId += 1;
    state.draftActive = false;
    flow.phase = "map";
    flow.mapContext = "predraft";
    flow.simultaneous = {};
    flow.assist = { requests: {}, proposals: {} };
    const payload = blankOnlineDraftState({
      phase: "map",
      preDraftMap: true,
      draftSessionId: state.draftSessionId,
      draftConfig: config,
      players,
      slots,
      captainAssignments: assignments,
      turnIndex: 0,
      turnStartedAt: null,
      turnDeadlineAt: null,
      rp346Flow: { phase: "map", mapContext: "predraft" },
    });
    await roomRef.update({
      started: true,
      startedAt: onlineNow(),
      updatedAt: onlineNow(),
      readyCheck: null,
      players,
      turnDuration: state.turnDuration,
      draftConfig: config,
      slots,
      captainAssignments: assignments,
      teamA: captainA ? { clientId: assignments.A, name: captainA.name, connected: captainA.connected, isBot: Boolean(captainA.isBot), role: "CAPITÁN_ATACANTES", lastSeen: captainA.lastSeen || onlineNow() } : null,
      teamB: captainB ? { clientId: assignments.B, name: captainB.name, connected: captainB.connected, isBot: Boolean(captainB.isBot), role: "CAPITÁN_DEFENSORES", lastSeen: captainB.lastSeen || onlineNow() } : null,
      draftState: payload,
    });
  };

  const baseStartOnlineDraftFromRoom = startOnlineDraftFromRoom;
  startOnlineDraftFromRoom = function startOnlineDraftFromRoomV346(data = {}) {
    if (!currentRoomCode) return;
    onlineLatestRoomData = data || {};
    const draftState = data.draftState || {};
    const config = sanitizeDraftConfig(data.draftConfig || draftState.draftConfig || currentDraftConfig());
    const phase = draftState.phase || "draft";

    if (phase === "map" && config.phaseOrder === "map-first") {
      applyOnlineSettingsFromRoom(data);
      state.draftConfig = config;
      state.draftSessionId = Number(draftState.draftSessionId || state.draftSessionId);
      state.onlineSlots = advancedSlotsFromRoom(data, config);
      applyAdvancedSlotsToPlayers(state.onlineSlots, config);
      state.draftActive = false;
      flow.phase = "map";
      flow.mapContext = "predraft";
      state.onlinePhase = "map";
      onlineRoomStartedState = true;
      const selected = mapFromOnlineValue(draftState.selectedMap);
      state.selectedMap = selected || null;
      state.mapRoulette = {
        active: Boolean(draftState.mapRoulette?.active),
        highlightedId: draftState.mapRoulette?.highlightedId || selected?.id || null,
        finalId: draftState.mapRoulette?.finalId || selected?.id || null,
      };
      if (Array.isArray(draftState.mapRoulette?.eliminatedIds)) flow.mapEliminatedIds = [...draftState.mapRoulette.eliminatedIds];
      if (!hasScreenActive(mapScreen)) enterMapPhase("predraft", { auto: false, silentNarration: false });
      state.selectedMap = selected || state.selectedMap;
      if (selected) {
        state.mapRoulette.active = false;
        state.mapRoulette.highlightedId = selected.id;
        state.mapRoulette.finalId = selected.id;
      }
      renderMapGrid();
      updateMapRouletteClasses();
      updateSelectedMapCopy();

      const event = draftState.mapEvent;
      if (event?.id && event.id !== flow.mapEventId && event.byClientId !== onlineClientId()) {
        flow.mapEventId = event.id;
        if (event.type === "chibiDropV346") void dropChibi(event.mapId, Boolean(event.finalPause), state.draftSessionId, flow.mapToken);
        if (event.type === "mapEliminatedV346") {
          flow.mapEliminatedIds = Array.from(new Set([...flow.mapEliminatedIds, event.mapId]));
          updateMapRouletteClasses();
        }
      }

      if (!selected && currentRole === "host" && !state.mapRoulette.active) {
        const key = `${currentRoomCode}:${state.draftSessionId}`;
        if (flow.hostMapStartedKey !== key) {
          flow.hostMapStartedKey = key;
          const token = flow.mapToken;
          const sessionId = state.draftSessionId;
          flow.mapTimer = window.setTimeout(() => {
            if (flowSessionAlive(sessionId, token)) void runMapRoulette({ sessionId, flowToken: token });
          }, MAP_START_DELAY_MS);
        }
      }
      return;
    }

    if (phase === "draft") {
      flow.phase = "draft";
      state.draftActive = true;
      if (currentRole === "host" && onlineStartedForRoom === currentRoomCode) {
        syncDraftStateFromRoom(data);
        return;
      }
      return baseStartOnlineDraftFromRoom(data);
    }
    if (phase === "summary") flow.phase = "summary";
    return baseStartOnlineDraftFromRoom(data);
  };

  const baseTurnVoiceKey = turnVoiceKey;
  turnVoiceKey = function turnVoiceKeyV346(turn) {
    if (turn?.type === "ban" && turn.faction === "urbino") return "ban_scissors";
    return baseTurnVoiceKey(turn);
  };
  try {
    systemDraftVoiceLines.team_a_ban_scissors.text = "Los atacantes están bloqueando un laminante de Urbino.";
    systemDraftVoiceLines.team_b_ban_scissors.text = "Los defensores están bloqueando un laminante de Urbino.";
    systemDraftVoiceLines.advanced_team_ban_scissors_laminant.text = "Tu equipo está bloqueando un laminante de Urbino.";
    systemDraftVoiceLines.advanced_please_ban_scissors_laminant.text = "Por favor bloquea un laminante de Urbino.";
  } catch (_) {}

  /* ------------------------------------------------------------------
   * Boot
   * ---------------------------------------------------------------- */
  function updateVersionLabels() {
    document.title = `STRINOVA Draft System v${VERSION} by RPmods`;
    document.querySelectorAll(".settings-brand").forEach(node => { node.textContent = `STRINOVA Draft System v${VERSION} by RPmods`; });
  }

  function boot() {
    updateVersionLabels();
    bootConfigUi();
    window.setInterval(() => {
      if (flow.phase === "draft") renderAssistUi();
    }, 500);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
