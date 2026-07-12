/* STRINOVA Draft System v3.4.7
 * Stabilization layer over v3.4.6: robust map-first roulette,
 * safer bot logic, request-mode selection for players, and dock visibility.
 */
(function installDraftFlowV347() {
  "use strict";
  if (window.__rpmodsDraftFlowV347Installed) return;
  window.__rpmodsDraftFlowV347Installed = true;

  const VERSION = "3.4.7";
  const MAP_START_DELAY_MS = 650;
  const BOT_MIN_DELAY_MS = 900;
  const BOT_MAX_DELAY_MS = 1800;
  const ASSIST_TIMEOUT_MS = 10000;
  const CHIBI_VOICE_COUNT = 8;

  const flow = state.rp346 || (state.rp346 = {
    phase: "idle",
    mapContext: "predraft",
    mapToken: 0,
    mapEliminatedIds: [],
    simultaneous: {},
    assist: { requests: {}, proposals: {} },
    botKeys: {},
    botTimers: [],
  });

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
  function currentFlowPhase() {
    return flow.phase || (state.draftActive ? "draft" : "idle");
  }
  function setVersionLabels() {
    document.title = `STRINOVA Draft System v${VERSION} by RPmods`;
    document.querySelectorAll(".settings-brand").forEach(node => {
      node.textContent = `STRINOVA Draft System v${VERSION} by RPmods`;
    });
  }

  function advancedSlotKeyList(turn = currentTurn()) {
    return (turn?.slotKeys || [turn?.slotKey]).filter(Boolean);
  }
  function simultaneousKey(turn = currentTurn()) {
    return `${state.draftSessionId}:${state.turnIndex}:${turn?.team || "-"}:${turn?.groupId || "single"}`;
  }
  function simultaneousRecord(turn = currentTurn()) {
    const key = simultaneousKey(turn);
    if (!flow.simultaneous || typeof flow.simultaneous !== "object") flow.simultaneous = {};
    if (!flow.simultaneous[key]) flow.simultaneous[key] = {};
    return flow.simultaneous[key];
  }
  function ownAssignment() {
    if (!currentRoomCode) return null;
    try { return advancedAssignmentForClient(onlineClientId(), state.onlineSlots); }
    catch (_) { return null; }
  }
  function ownActiveSlot(turn = currentTurn()) {
    const own = ownAssignment();
    if (!own || !turn || own.team !== turn.team) return null;
    const slots = advancedSlotKeyList(turn);
    if (!slots.includes(own.slotKey)) return null;
    if (turn.simultaneous && simultaneousRecord(turn)[own.slotKey]) return null;
    return own;
  }
  function canRequestPick() {
    if (!currentRoomCode || currentRole !== "player" || currentFlowPhase() !== "draft" || !state.draftActive) return false;
    if (!isAdvancedDraftConfig()) return false;
    const turn = currentTurn();
    const own = ownAssignment();
    if (!turn || turn.type !== "pick" || turn.flowStage !== "leader-picks" || !own || own.team !== turn.team) return false;
    if (!/^player[3-5]$/.test(own.slotKey)) return false;
    if (advancedSlotKeyList(turn).includes(own.slotKey)) return false;
    if (state.picks?.[own.team]?.[advancedSlotIndex(own.slotKey)]) return false;
    const id = `${own.team}:${own.slotKey}`;
    return !flow.assist?.requests?.[id];
  }
  function canUseCharacterDock() {
    if (currentFlowPhase() !== "draft" || !state.draftActive || !currentTurn()) return false;
    if (!currentRoomCode) return true;
    if (currentRole !== "player") return false;
    return Boolean(ownActiveSlot(currentTurn())) || canRequestPick();
  }
  function updateDockVisibility() {
    const hidden = currentRoomCode && currentFlowPhase() === "draft" && state.draftActive && !canUseCharacterDock();
    document.body.classList.toggle("rp347-dock-hidden", Boolean(hidden));
    document.body.classList.toggle("rp347-request-mode", Boolean(canRequestPick()));
    const restriction = document.getElementById("current-restriction");
    if (restriction && hidden) {
      restriction.textContent = "Espera tu turno o pide un laminante cuando esté eligiendo un líder de tu equipo.";
    }
  }

  const baseCanControlCurrentTurnV347 = canControlCurrentTurn;
  canControlCurrentTurn = function canControlCurrentTurnV347() {
    if (baseCanControlCurrentTurnV347()) return true;
    if (!currentRoomCode || currentRole !== "player" || currentFlowPhase() !== "draft" || !state.draftActive) return false;
    return Boolean(ownActiveSlot(currentTurn()));
  };

  const basePreselectCharacterV347 = preselectCharacter;
  preselectCharacter = function preselectCharacterV347(character, options = {}) {
    if (baseCanControlCurrentTurnV347() || canControlCurrentTurn()) {
      return basePreselectCharacterV347(character, options);
    }
    if (!canRequestPick() || state.preselectLocked || !character || !isCharacterAvailable(character, currentTurn())) return;
    const previousName = state.selected?.name || null;
    if (previousName === character.name) return;
    state.selected = character;
    if (options.source === "touch" || options.source === "click") state.preselectLocked = true;
    audioPlay(sounds.select, options.source === "hover" ? 0.4 : 0.68, "sfx");
    renderCharacterSelectionLight();
    updateRequestButtonV347();
  };

  function normalizeAssist() {
    if (!flow.assist || typeof flow.assist !== "object") flow.assist = { requests: {}, proposals: {} };
    if (!flow.assist.requests || typeof flow.assist.requests !== "object") flow.assist.requests = {};
    if (!flow.assist.proposals || typeof flow.assist.proposals !== "object") flow.assist.proposals = {};
    return flow.assist;
  }
  function writeAssist(extra = {}) {
    normalizeAssist();
    if (currentRoomCode) {
      roomRefFor(currentRoomCode)?.child("draftState/rp346Assist").set(clone(flow.assist, { requests: {}, proposals: {} }));
    }
    renderAssistPublicUi();
    updateRequestButtonV347();
  }
  function createRequestV347(character) {
    const own = ownAssignment();
    const turn = currentTurn();
    if (!own || !turn || !character || !canRequestPick()) return;
    const id = `${own.team}:${own.slotKey}`;
    normalizeAssist().requests[id] = {
      id,
      status: "pending",
      team: own.team,
      slotKey: own.slotKey,
      slotIndex: advancedSlotIndex(own.slotKey),
      requesterClientId: onlineClientId(),
      requesterName: own.slot?.name || state.players?.[own.team]?.[advancedSlotIndex(own.slotKey)] || "Compañero",
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
  function updateRequestButtonV347() {
    const button = ensureRandomSelectionButton?.();
    if (!button) return;
    const requestMode = canRequestPick();
    button.dataset.rp347RequestMode = requestMode ? "1" : "0";
    if (requestMode) {
      button.classList.remove("hidden");
      button.textContent = "PEDIR";
      button.title = "Pedir el laminante seleccionado";
      button.setAttribute("aria-label", "Pedir el laminante seleccionado");
    } else if (button.dataset.rp346RequestMode !== "1") {
      button.textContent = t("random_selection_button");
      button.title = t("random_selection_button");
      button.setAttribute("aria-label", t("random_selection_button"));
    }
  }
  document.addEventListener("click", event => {
    const requestButton = event.target?.closest?.("#random-selection-action[data-rp347-request-mode='1']");
    if (!requestButton) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!state.selected || !isCharacterAvailable(state.selected, currentTurn())) {
      showAppNotice("Selecciona primero el laminante que quieres pedir.", { type: "warning" });
      return;
    }
    createRequestV347(state.selected);
  }, true);

  function slotElement(team, slotKey) {
    const index = advancedSlotIndex(slotKey);
    const root = team === "A" ? document.getElementById("team-a-slots") : document.getElementById("team-b-slots");
    return root?.children?.[index] || null;
  }
  function renderAssistPublicUi() {
    normalizeAssist();
    document.querySelectorAll(".rp347-request-note").forEach(node => node.remove());
    Object.values(flow.assist.requests).forEach(request => {
      if (!request || request.status !== "pending" || request.draftSessionId !== state.draftSessionId || request.turnIndex !== state.turnIndex) return;
      const anchor = slotElement(request.team, request.slotKey);
      if (!anchor || anchor.querySelector(".rp347-request-note")) return;
      const note = document.createElement("div");
      note.className = "rp347-request-note";
      note.innerHTML = `<span>PIDE LAMINANTE</span><strong>${escapeHtml(request.characterName || "")}</strong>`;
      anchor.appendChild(note);
    });
  }

  /* ------------------------------------------------------------------
   * Map roulette: robust independent pre-draft version
   * ---------------------------------------------------------------- */
  function setMapCopyV347() {
    const predraft = flow.mapContext === "predraft";
    const header = mapScreen?.querySelector(".map-header");
    if (!header) return;
    const eyebrow = header.querySelector(".eyebrow");
    const title = header.querySelector("h1");
    const copy = header.querySelector("p:last-child");
    if (eyebrow) eyebrow.textContent = predraft ? "FASE PREVIA" : "DRAFT COMPLETADO";
    if (title) title.textContent = "SELECCIÓN DE MAPA";
    if (copy) copy.textContent = predraft
      ? "El mapa se decidirá antes de iniciar los turnos del draft."
      : "El mapa se elegirá antes de mostrar el resumen final.";
  }
  function serializeMapStateV347() {
    return {
      active: Boolean(state.mapRoulette?.active),
      highlightedId: state.mapRoulette?.highlightedId || null,
      finalId: state.mapRoulette?.finalId || null,
      eliminatedIds: Array.isArray(flow.mapEliminatedIds) ? [...flow.mapEliminatedIds] : [],
    };
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
  function ensureChibiOverlayV347() {
    let overlay = document.getElementById("map-chibi-overlay-v346");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.id = "map-chibi-overlay-v346";
    overlay.className = "map-chibi-overlay-v346 hidden";
    overlay.innerHTML = `<img class="map-chibi-fall-v346" src="img/ui/map_chibi_fall.png" alt=""><img class="map-chibi-land-v346" src="img/ui/map_chibi_land.png" alt="">`;
    document.body.appendChild(overlay);
    return overlay;
  }
  function getChibiVoicePool() {
    const cache = window.__rpmodsChibiVoiceCache || (window.__rpmodsChibiVoiceCache = { ready: false, available: [] });
    if (!cache.started) {
      cache.started = true;
      Promise.all(Array.from({ length: CHIBI_VOICE_COUNT }, async (_, index) => {
        const src = `audio/map_vote_chibi_${index + 1}.ogg`;
        try {
          const response = await fetch(src, { method: "HEAD", cache: "no-store" });
          return response.ok ? src : "";
        } catch (_) { return ""; }
      })).then(list => {
        cache.available = list.filter(Boolean);
        cache.ready = true;
      }).catch(() => { cache.ready = true; });
    }
    return cache.ready && cache.available.length ? cache.available : ["audio/map_vote_chibi_1.ogg"];
  }
  function playChibiVoiceV347() {
    unlockMediaPlayback(true);
    const pool = getChibiVoicePool();
    const src = pool[Math.floor(Math.random() * pool.length)] || "audio/map_vote_chibi_1.ogg";
    audioPlay(src, 1, "sfx");
  }
  async function dropChibiV347(mapId, finalPause = false, runId = flow.mapRunId) {
    const card = Array.from(mapGrid?.querySelectorAll(".map-card") || []).find(item => item.dataset.mapId === mapId);
    if (!card || flow.phase !== "map" || flow.mapRunId !== runId) return true;
    if (finalPause) await delay(2000);
    if (flow.phase !== "map" || flow.mapRunId !== runId) return false;
    const overlay = ensureChibiOverlayV347();
    const rect = card.getBoundingClientRect();
    overlay.style.left = `${Math.round(rect.left + rect.width / 2)}px`;
    overlay.style.top = `${Math.round(rect.top + rect.height / 2 - 20)}px`;
    overlay.classList.remove("hidden", "dropping", "landed");
    void overlay.offsetWidth;
    overlay.classList.add("dropping");
    await delay(500);
    overlay.classList.remove("dropping");
    overlay.classList.add("landed");
    audioPlay(sounds.confirm, 0.72, "sfx");
    playChibiVoiceV347();
    await delay(240);
    overlay.classList.add("hidden");
    overlay.classList.remove("landed");
    return flow.phase === "map" && flow.mapRunId === runId;
  }
  function markMapEliminatedV347(mapId) {
    if (!Array.isArray(flow.mapEliminatedIds)) flow.mapEliminatedIds = [];
    if (!flow.mapEliminatedIds.includes(mapId)) flow.mapEliminatedIds.push(mapId);
    updateMapRouletteClasses();
  }
  function activateDraftAfterMapV347() {
    if (!state.selectedMap) return;
    flow.phase = "draft";
    flow.mapContext = "predraft-done";
    state.draftActive = true;
    state.onlinePhase = currentRoomCode ? "draft" : "local";
    state.turnIndex = 0;
    state.locked = false;
    state.turnStartedAt = null;
    state.turnDeadlineAt = null;
    try { prepareClockForTurnIndex(0, phaseOverlayDurationMs()); } catch (_) {}
    switchScreen(draftScreen);
    setupBackgroundVideo();
    startMusic("draft");
    if (currentRoomCode && currentRole === "host") {
      pushOnlineDraftState({
        force: true,
        phase: "draft",
        preDraftMap: false,
        turnIndex: 0,
        turnStartedAt: state.turnStartedAt,
        turnDeadlineAt: state.turnDeadlineAt,
        selectedMap: { id: state.selectedMap.id, name: state.selectedMap.name },
        rp346Flow: { phase: "draft", mapContext: "predraft-done" },
        rp346Simultaneous: {},
        rp346Assist: { requests: {}, proposals: {} },
      });
    }
    showPhaseOverlay(
      "SELECCIÓN INICIAL DE LÍDERES",
      systemDraftVoiceLines.voice_pick_phase?.src || "",
      systemDraftVoiceLines.voice_pick_phase?.text || "",
      startTurn,
    );
  }
  function finishMapPhaseV347(selected) {
    if (!selected || flow.phase !== "map") return;
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
        mapRoulette: serializeMapStateV347(),
        mapEvent: { id: uid("mapSelectedV347"), type: "mapSelectedV347", mapId: selected.id, byClientId: onlineClientId() },
      });
    }
    window.setTimeout(() => {
      if (flow.phase !== "map" || state.selectedMap?.id !== selected.id) return;
      if (flow.mapContext === "predraft") activateDraftAfterMapV347();
      else showSummaryIntro();
    }, 520);
  }
  runMapRoulette = async function runMapRouletteV347(options = {}) {
    if (flow.phase !== "map" || state.mapRoulette.active || !maps.length) return;
    const runId = uid("mapRunV347");
    flow.mapRunId = runId;
    flow.mapEliminatedIds = [];
    state.mapRoulette.active = true;
    state.mapRoulette.highlightedId = null;
    state.mapRoulette.finalId = null;
    setMapCopyV347();
    renderMapGrid();
    updateMapRouletteClasses();

    try {
      if (currentDraftConfig().mapRandomMode === "classic-random") {
        let selected = randomFrom(maps);
        for (let i = 0; i < 24; i += 1) {
          if (flow.phase !== "map" || flow.mapRunId !== runId) return;
          selected = randomFrom(maps);
          state.mapRoulette.highlightedId = selected.id;
          updateMapRouletteClasses();
          audioPlay(sounds.mapRoulette || sounds.roulette, 0.76, "sfx");
          await delay(55 + i * 8);
        }
        finishMapPhaseV347(selected);
        return;
      }

      const pool = [...maps];
      const plan = eliminationPlan(pool.length);
      for (let groupIndex = 0; groupIndex < plan.length; groupIndex += 1) {
        for (let step = 0; step < plan[groupIndex]; step += 1) {
          if (flow.phase !== "map" || flow.mapRunId !== runId || pool.length <= 1) break;
          const target = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
          const finalPause = groupIndex === plan.length - 1 && step === plan[groupIndex] - 1;
          state.mapRoulette.highlightedId = target.id;
          updateMapRouletteClasses();
          if (currentRoomCode && currentRole === "host") {
            pushOnlineDraftPatch({
              force: true,
              phase: "map",
              mapEvent: { id: uid("chibiDropV347"), type: "chibiDropV347", mapId: target.id, finalPause, byClientId: onlineClientId() },
              mapRoulette: serializeMapStateV347(),
            });
          }
          const ok = await dropChibiV347(target.id, finalPause, runId);
          if (!ok) return;
          markMapEliminatedV347(target.id);
          if (currentRoomCode && currentRole === "host") {
            pushOnlineDraftPatch({
              force: true,
              phase: "map",
              mapEvent: { id: uid("mapEliminatedV347"), type: "mapEliminatedV347", mapId: target.id, byClientId: onlineClientId() },
              mapRoulette: serializeMapStateV347(),
            });
          }
          await delay(220);
        }
      }
      finishMapPhaseV347(pool[0] || randomFrom(maps));
    } catch (error) {
      console.warn("RPmods v3.4.7: error en ruleta de mapa, usando fallback clásico.", error);
      finishMapPhaseV347(randomFrom(maps));
    }
  };

  const baseStartMapSelectionV347 = startMapSelection;
  startMapSelection = function startMapSelectionV347(options = {}) {
    baseStartMapSelectionV347(options);
    setMapCopyV347();
  };

  const baseRenderMapGridV347 = renderMapGrid;
  renderMapGrid = function renderMapGridV347() {
    baseRenderMapGridV347();
    mapGrid?.querySelectorAll(".map-card").forEach(card => {
      card.classList.toggle("map-eliminated-v346", Array.isArray(flow.mapEliminatedIds) && flow.mapEliminatedIds.includes(card.dataset.mapId));
    });
    setMapCopyV347();
  };

  const baseUpdateMapRouletteClassesV347 = updateMapRouletteClasses;
  updateMapRouletteClasses = function updateMapRouletteClassesV347() {
    baseUpdateMapRouletteClassesV347();
    mapGrid?.querySelectorAll(".map-card").forEach(card => {
      card.classList.toggle("map-eliminated-v346", Array.isArray(flow.mapEliminatedIds) && flow.mapEliminatedIds.includes(card.dataset.mapId));
    });
  };

  /* ------------------------------------------------------------------
   * Safer bot logic. Bots still test requests/proposals, but never block.
   * ---------------------------------------------------------------- */
  function isBotSlot(slot) {
    try { return Boolean(slot && isTestingBotParticipant(slot)); }
    catch (_) { return Boolean(slot?.isBot); }
  }
  function chooseBotCharacter(team) {
    const valid = getValidCharacters();
    if (!valid.length) return null;
    const usedRoles = new Set((state.picks?.[team] || []).map(character => roleOf(character.name)));
    const priority = ["Soporte", "Controlador", "Vanguardia", "Centinela", "Duelista"];
    const missing = priority.find(role => !usedRoles.has(role));
    const focused = missing ? valid.filter(character => roleOf(character.name) === missing) : [];
    const pool = focused.length ? focused : valid;
    return pool[Math.floor(Math.random() * pool.length)] || valid[0];
  }
  function swapSlotsV347(team, sourceKey, targetKey) {
    if (!team || !sourceKey || !targetKey || sourceKey === targetKey) return;
    if (currentRoomCode) {
      const slots = state.onlineSlots || {};
      if (!slots[team]) return;
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
    }
  }
  function acceptPendingRequestForBotActor(turn, slotKey) {
    normalizeAssist();
    const request = Object.values(flow.assist.requests).find(item => (
      item?.status === "pending" &&
      item.team === turn.team &&
      item.turnIndex === state.turnIndex &&
      item.draftSessionId === state.draftSessionId
    ));
    if (!request) return false;
    const character = characters.find(item => item.name === request.characterName);
    if (!character || !isCharacterAvailable(character, turn)) {
      delete flow.assist.requests[request.id];
      writeAssist();
      return true;
    }
    if (Math.random() > 0.86) {
      delete flow.assist.requests[request.id];
      writeAssist();
      return true;
    }
    swapSlotsV347(turn.team, slotKey, request.slotKey);
    delete flow.assist.requests[request.id];
    writeAssist();
    state.selected = character;
    confirmTurn(false, { onlineSystem: true, botSlotKey: slotKey, assistCommit: true });
    return true;
  }
  function processBotTargetProposals() {
    normalizeAssist();
    Object.values(flow.assist.proposals).forEach(proposal => {
      if (!proposal || proposal.status !== "pending" || !proposal.targetIsBot) return;
      const key = `rp347Proposal:${proposal.id}`;
      if (flow.botKeys?.[key]) return;
      flow.botKeys[key] = true;
      const timer = window.setTimeout(() => {
        const latest = flow.assist.proposals?.[proposal.id];
        if (!latest || latest.status !== "pending") return;
        const turn = currentTurn();
        const character = characters.find(item => item.name === latest.characterName);
        if (Math.random() < 0.82 && character && turn && isCharacterAvailable(character, turn)) {
          swapSlotsV347(latest.team, latest.sourceSlotKey, latest.targetSlotKey);
          delete flow.assist.proposals[latest.id];
          writeAssist();
          state.selected = character;
          confirmTurn(false, { onlineSystem: true, botSlotKey: latest.sourceSlotKey, assistCommit: true });
        } else {
          delete flow.assist.proposals[latest.id];
          writeAssist();
        }
      }, randomDelay(650, 1400));
      flow.botTimers?.push?.(timer);
    });
  }
  scheduleTestingBotTurn = function scheduleTestingBotTurnV347() {
    try { clearTestingBotTurnTimer(); } catch (_) {}
    processBotTargetProposals();
    if (!currentRoomCode || currentRole !== "host" || currentFlowPhase() !== "draft" || !state.draftActive || state.locked || state.roulette?.active) return;
    const turn = currentTurn();
    if (!turn) return;
    const slots = advancedSlotKeyList(turn);
    slots.forEach((slotKey, index) => {
      const slot = state.onlineSlots?.[turn.team]?.[slotKey];
      if (!isBotSlot(slot)) return;
      if (turn.simultaneous && simultaneousRecord(turn)[slotKey]) return;
      const turnIndexSnapshot = state.turnIndex;
      const sessionSnapshot = state.draftSessionId;
      const key = `rp347Bot:${sessionSnapshot}:${turnIndexSnapshot}:${slotKey}`;
      if (flow.botKeys?.[key]) return;
      flow.botKeys[key] = true;
      const timer = window.setTimeout(() => {
        if (currentFlowPhase() !== "draft" || !state.draftActive || state.turnIndex !== turnIndexSnapshot || state.draftSessionId !== sessionSnapshot) {
          return;
        }
        const liveTurn = currentTurn();
        if (!liveTurn || liveTurn.team !== turn.team || liveTurn.groupId !== turn.groupId) return;
        processBotTargetProposals();
        if (acceptPendingRequestForBotActor(liveTurn, slotKey)) return;
        const character = chooseBotCharacter(liveTurn.team);
        if (!character) return;
        state.selected = character;
        confirmTurn(true, { onlineSystem: true, botSlotKey: slotKey });
      }, randomDelay() + index * 260);
      flow.botTimers?.push?.(timer);
    });
  };

  const baseStartTurnV347 = startTurn;
  startTurn = function startTurnV347(options = {}) {
    baseStartTurnV347(options);
    updateDockVisibility();
    updateRequestButtonV347();
    processBotTargetProposals();
  };
  const baseRenderDraftStateLightV347 = renderDraftStateLight;
  renderDraftStateLight = function renderDraftStateLightV347(options = {}) {
    const result = baseRenderDraftStateLightV347(options);
    updateDockVisibility();
    updateRequestButtonV347();
    renderAssistPublicUi();
    return result;
  };
  const baseRenderAllV347 = renderAll;
  renderAll = function renderAllV347() {
    const result = baseRenderAllV347();
    updateDockVisibility();
    updateRequestButtonV347();
    renderAssistPublicUi();
    return result;
  };

  function boot() {
    setVersionLabels();
    getChibiVoicePool();
    updateDockVisibility();
    updateRequestButtonV347();
    window.setInterval(() => {
      setVersionLabels();
      updateDockVisibility();
      updateRequestButtonV347();
      renderAssistPublicUi();
      if (currentFlowPhase() === "map") setMapCopyV347();
      if (currentRole === "host") processBotTargetProposals();
    }, 450);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
