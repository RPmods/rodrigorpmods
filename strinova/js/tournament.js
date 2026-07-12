(() => {
  "use strict";

  const data = window.STRINOVA_TOURNAMENT_DATA || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const DIVISION_SCORE = { "V": 1, "IV": 2, "III": 3, "II": 4, "I": 5 };

  function esc(value) {
    return String(value ?? "").replace(/[&<>'"]/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[ch]));
  }

  function rankById(id) {
    return (data.ranks || []).find(rank => rank.id === id) || (data.ranks || [])[0] || null;
  }

  function rankIcon(id) {
    const rank = rankById(id);
    return rank ? rank.icon : "";
  }

  function rankBaseScore(id) {
    const rank = rankById(id);
    return rank ? Number(rank.order || 0) * 100 : 0;
  }

  function rankDivisionScore(label) {
    const roman = String(label || "").trim().split(/\s+/).pop();
    return DIVISION_SCORE[roman] || 0;
  }

  function playerRankScore(player) {
    if (!player || player.status === "empty") return -999;
    return rankBaseScore(player.currentRankId) + rankDivisionScore(player.currentRank);
  }

  function sortPlayersByRank(players) {
    return [...players].sort((a, b) => {
      const score = playerRankScore(b) - playerRankScore(a);
      if (score) return score;
      return String(a.nickname || "").localeCompare(String(b.nickname || ""), "es");
    });
  }

  function playerById(id) {
    return (data.players || []).find(player => player.id === id) || null;
  }

  function teamById(id) {
    return (data.teams || []).find(team => team.id === id) || null;
  }

  function teamName(id) {
    const team = teamById(id);
    return team ? team.name : "Sin equipo";
  }

  function teamPlayers(team, includeSubs = true) {
    const ids = includeSubs ? [...(team.players || []), ...(team.substitutes || [])] : [...(team.players || [])];
    const roster = ids.map(playerById).filter(Boolean);
    const active = sortPlayersByRank(roster.filter(player => player.status !== "empty"));
    const empty = roster.filter(player => player.status === "empty");
    return [...active, ...empty];
  }

  function characterThumb(player) {
    if (!player?.mainCharacterId) return "";
    return `img/characters/thumbs/${String(player.mainCharacterId).replaceAll(" ", "_")}.png`;
  }

  function statusLabel(value) {
    if (value === "confirmed") return "Confirmado";
    if (value === "demo") return "Ejemplo";
    return value || "Pendiente";
  }

  function renderRankCell(label, id) {
    const icon = rankIcon(id);
    return `<span class="tournament-rank-cell">${icon ? `<img class="tournament-rank-icon" src="${esc(icon)}" alt="">` : ""}<span>${esc(label)}</span></span>`;
  }

  function renderTeamCard(team, compact = false) {
    const roster = teamPlayers(team, true);
    const activePlayers = roster.filter(player => player.status !== "empty");
    const rows = roster.map(player => {
      const captainMark = player.id === team.captainId ? " is-captain" : player.id === team.subCaptainId ? " is-subcaptain" : "";
      const stateClass = player.status === "empty" ? " is-empty" : "";
      return `
        <article class="tournament-roster-member${stateClass}${captainMark}">
          <div class="tournament-member-topline">
            <span class="tournament-role-badge ${player.status === "empty" ? "empty" : ""}">${esc(player.role)}</span>
            <span class="tournament-member-character">${esc(player.mainCharacter)}</span>
          </div>
          <strong class="tournament-member-name">${esc(player.nickname)}</strong>
          ${player.gameId ? `<small class="tournament-member-id">ID:${esc(player.gameId)}</small>` : `<small class="tournament-member-id">Sin inscripción</small>`}
          <div class="tournament-member-ranks">
            <div><span>Actual</span>${renderRankCell(player.currentRank, player.currentRankId)}</div>
            <div><span>Máximo</span>${renderRankCell(player.peakRank, player.peakRankId)}</div>
          </div>
        </article>`;
    }).join("");
    return `
      <article class="tournament-team-card ${compact ? "is-featured" : ""}">
        <div class="tournament-team-emblem">
          <span>${esc(team.tag || "TEAM")}</span>
          <strong>${esc(team.name)}</strong>
          <em>${esc(statusLabel(team.status))}</em>
        </div>
        <div class="tournament-team-main">
          <div class="tournament-team-heading-row">
            <div>
              <span class="tournament-section-kicker">Equipo registrado</span>
              <h3>${esc(team.name)}</h3>
            </div>
            <span class="tournament-team-count">${activePlayers.length}/5 titulares</span>
          </div>
          <div class="tournament-team-meta">
            <span>Capitán: <b>${esc((playerById(team.captainId) || {}).nickname || "Pendiente")}</b></span>
            <span>Sub-capitán: <b>${esc((playerById(team.subCaptainId) || {}).nickname || "Pendiente")}</b></span>
            <span>Suplentes: <b>${(team.substitutes || []).filter(id => (playerById(id) || {}).status !== "empty").length}/2</b></span>
          </div>
          <div class="tournament-roster-list">${rows}</div>
          ${team.notes ? `<p class="tournament-team-note">${esc(team.notes)}</p>` : ""}
        </div>
      </article>`;
  }

  function allActivePlayers() {
    return sortPlayersByRank((data.players || []).filter(player => player.status !== "empty"));
  }

  function renderPlayerRows() {
    const players = allActivePlayers();
    return `
      <table class="tournament-player-table">
        <thead><tr><th>#</th><th>Jugador</th><th>Equipo</th><th>Rol</th><th>Rango actual</th><th>Máximo</th><th>Laminante</th></tr></thead>
        <tbody>
          ${players.map((player, index) => `
            <tr class="tournament-player-row ${index === 0 ? "is-selected" : ""}" data-player-id="${esc(player.id)}">
              <td>${index + 1}</td>
              <td><span class="player-name-strong">${esc(player.nickname)}</span>${player.gameId ? `<small>ID:${esc(player.gameId)}</small>` : ""}</td>
              <td>${esc(teamName(player.teamId))}</td>
              <td>${esc(player.role)}</td>
              <td>${renderRankCell(player.currentRank, player.currentRankId)}</td>
              <td>${renderRankCell(player.peakRank, player.peakRankId)}</td>
              <td>${esc(player.mainCharacter)}</td>
            </tr>`).join("")}
        </tbody>
      </table>`;
  }

  function renderPlayerDetail(player) {
    const detail = $("#tournament-player-detail");
    if (!detail || !player) return;
    const icon = rankIcon(player.currentRankId);
    const thumb = characterThumb(player);
    detail.innerHTML = `
      <div class="tournament-detail-header">
        <span>Perfil destacado</span>
        <h3>${esc(player.nickname)}</h3>
        <p class="tournament-detail-id">ID:${esc(player.gameId || "Sin inscripción")}</p>
      </div>
      <div class="rank-big">${icon ? `<img src="${esc(icon)}" alt="">` : ""}<strong>${esc(player.currentRank)}</strong></div>
      <div class="tournament-player-meta">
        <div><span>Equipo</span><b>${esc(teamName(player.teamId))}</b></div>
        <div><span>Rol</span><b>${esc(player.role)}</b></div>
        <div><span>Rango máximo</span><b>${esc(player.peakRank)}</b></div>
        <div><span>Laminante frecuente</span><b>${esc(player.mainCharacter)}</b></div>
      </div>
      ${thumb ? `<div class="tournament-character-preview"><img src="${esc(thumb)}" alt="${esc(player.mainCharacter)}" onerror="this.closest('.tournament-character-preview').remove()"><span>${esc(player.mainCharacter)}</span></div>` : ""}
      <p class="tournament-detail-note">Las estadísticas del perfil se cargarán manualmente. Esta ficha no consulta datos en tiempo real del juego.</p>`;
  }

  function renderMaps() {
    const grid = $("#tournament-map-grid");
    if (!grid) return;
    grid.innerHTML = (data.maps || []).map(map => `
      <article class="tournament-map-card ${map.rankedOfficial ? "is-ranked" : ""}">
        <strong>${esc(map.name)}</strong>
        <span>${map.rankedOfficial ? "Ranked oficial + torneo" : "Habilitado para torneo"}</span>
      </article>`).join("");
  }

  function renderSummary() {
    const featured = $("#tournament-featured-team");
    const teams = data.teams || [];
    if (!featured) return;
    const players = allActivePlayers();
    const teamCards = teams.slice(0, 6).map(team => {
      const roster = teamPlayers(team, false).filter(player => player.status !== "empty");
      const top = sortPlayersByRank(roster)[0];
      return `
        <article class="tournament-mini-team" data-team-id="${esc(team.id)}">
          <strong>${esc(team.tag || team.name)}</strong>
          <span>${esc(team.name)}</span>
          <em>${roster.length}/5 · ${esc(top ? top.currentRank : "Sin rango")}</em>
        </article>`;
    }).join("");
    const topRows = players.slice(0, 6).map((player, index) => `
      <tr>
        <td>${index + 1}</td>
        <td><span class="player-name-strong">${esc(player.nickname)}</span><small>${esc(teamName(player.teamId))}</small></td>
        <td>${renderRankCell(player.currentRank, player.currentRankId)}</td>
        <td>${esc(player.mainCharacter)}</td>
      </tr>`).join("");
    featured.innerHTML = `
      <div class="tournament-summary-showcase">
        <div class="tournament-showcase-main">
          <span class="tournament-section-kicker">Centro del torneo</span>
          <h3>${teams.length} equipos · ${players.length} jugadores</h3>
          <p>Gantigun Cup 2026 funciona como extensión del Draft System. La información se gestiona localmente y sirve para perfiles, equipos y preparación de partidas.</p>
        </div>
        <div class="tournament-mini-team-grid">${teamCards}</div>
      </div>
      <div class="tournament-summary-rank-strip">
        <div class="tournament-strip-heading">
          <span class="tournament-section-kicker">Jugadores destacados</span>
          <strong>Ordenados por rango de mayor a menor</strong>
        </div>
        <table class="tournament-player-table tournament-summary-table">
          <thead><tr><th>#</th><th>Jugador</th><th>Rango</th><th>Laminante</th></tr></thead>
          <tbody>${topRows}</tbody>
        </table>
      </div>`;
  }

  function setupTournamentTabs() {
    $$(".tournament-view-tab").forEach(button => {
      button.addEventListener("click", () => {
        const view = button.dataset.tournamentView;
        $$(".tournament-view-tab").forEach(item => item.classList.toggle("is-active", item === button));
        $$("[data-tournament-panel]").forEach(panel => panel.classList.toggle("is-active", panel.dataset.tournamentPanel === view));
        const root = $("#tournament-root");
        if (root) root.dataset.view = view;
      });
    });
  }

  function setupPlayerRows() {
    $$(".tournament-player-row").forEach(row => {
      row.addEventListener("click", () => {
        $$(".tournament-player-row").forEach(item => item.classList.remove("is-selected"));
        row.classList.add("is-selected");
        renderPlayerDetail(playerById(row.dataset.playerId));
      });
    });
  }

  function setupHudSafeArea() {
    const toggle = $("#hud-safe-area-toggle");
    const overlay = $("#hud-safe-area-overlay");
    if (!toggle || !overlay) return;
    const apply = () => {
      overlay.classList.toggle("hidden", !toggle.checked);
      overlay.setAttribute("aria-hidden", toggle.checked ? "false" : "true");
    };
    toggle.addEventListener("change", apply);
    apply();
  }


  function syncTournamentSurfaceState() {
    const shell = document.querySelector('.setup-shell');
    const setupScreen = document.getElementById('setup-screen');
    const activeTopTab = document.querySelector('.setup-top-tab.is-active, .settings-tab.is-active');
    const tournamentPanel = document.querySelector('[data-panel="tournament"]');
    const isSetupActive = Boolean(setupScreen && setupScreen.classList.contains('active'));
    const activeTabName = activeTopTab && activeTopTab.dataset ? activeTopTab.dataset.tab : '';
    const isTournament = Boolean(
      isSetupActive && (
        (shell && shell.classList.contains('view-tournament')) ||
        activeTabName === 'tournament' ||
        (tournamentPanel && tournamentPanel.classList.contains('is-active'))
      )
    );
    const useResponsiveSetup = Boolean(isSetupActive);

    const isMenu = Boolean(isSetupActive && (activeTabName === 'menu' || (!activeTabName && shell && shell.classList.contains('view-menu'))));

    document.documentElement.classList.toggle('setup-responsive-active', useResponsiveSetup);
    document.body.classList.toggle('setup-responsive-active', useResponsiveSetup);
    document.documentElement.classList.toggle('tournament-surface-active', isTournament);
    document.body.classList.toggle('tournament-surface-active', isTournament);
    document.documentElement.classList.toggle('menu-surface-active', isMenu);
    document.body.classList.toggle('menu-surface-active', isMenu);

    if (setupScreen) {
      setupScreen.classList.toggle('tournament-surface-active', isTournament);
      setupScreen.classList.toggle('menu-surface-active', isMenu);
    }
    if (shell) {
      shell.classList.toggle('view-tournament', isTournament);
      shell.classList.toggle('view-menu', isMenu);
      shell.dataset.activeSetupTab = activeTabName || 'menu';
    }
  }

  function watchTournamentSurfaceState() {
    const shell = document.querySelector('.setup-shell');
    const screen = document.getElementById('setup-screen');
    const observer = new MutationObserver(() => requestAnimationFrame(syncTournamentSurfaceState));
    if (shell) observer.observe(shell, { attributes: true, attributeFilter: ['class'] });
    if (screen) observer.observe(screen, { attributes: true, childList: true, subtree: true });

    document.addEventListener('click', event => {
      const setupTab = event.target && event.target.closest ? event.target.closest('[data-tab]') : null;
      const tournamentView = event.target && event.target.closest ? event.target.closest('[data-tournament-view]') : null;
      if (setupTab || tournamentView) {
        requestAnimationFrame(syncTournamentSurfaceState);
        setTimeout(syncTournamentSurfaceState, 80);
        if (setupTab) {
          setTimeout(() => {
            if (document.body.classList.contains('setup-responsive-active')) {
              window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
            }
          }, 120);
        }
      }
    }, true);

    window.addEventListener('resize', syncTournamentSurfaceState, { passive: true });
    syncTournamentSurfaceState();
  }

  function initTournamentHub() {
    const root = $("#tournament-root");
    if (!root) return;
    const config = data.config || {};
    const firstPlayer = allActivePlayers()[0];
    const setText = (selector, value) => { const node = $(selector); if (node) node.textContent = value; };
    setText("#tournament-title", config.name || "Gantigun Cup 2026");
    setText("#tournament-subtitle", config.subtitle || "Tournament Hub externo");
    setText("#tournament-status", config.status || "Preparación");
    setText("#tournament-organizer", config.organizer || "Gantigun");
    setText("#tournament-last-updated", `Última actualización: ${config.statsMeta?.display || "pendiente"}`);

    renderSummary();

    const teamGrid = $("#tournament-team-grid");
    if (teamGrid) teamGrid.innerHTML = (data.teams || []).map(team => renderTeamCard(team, false)).join("");

    const list = $("#tournament-player-list");
    if (list) list.innerHTML = renderPlayerRows();
    renderPlayerDetail(firstPlayer);
    renderMaps();
    setupTournamentTabs();
    setupPlayerRows();
    setupHudSafeArea();
    watchTournamentSurfaceState();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTournamentHub);
  } else {
    initTournamentHub();
  }
})();


// v3.3.10 — Fallback for invisible setup scroll.
// Some browsers do not route wheel movement to the hidden document scrollbar after the
// setup/tournament layout switches to a rail-less surface. This keeps the clean visual
// style while explicitly scrolling the active setup screen.
(function installSetupStealthScrollFallback() {
  if (window.__strinovaSetupStealthScrollFallbackInstalled) return;
  window.__strinovaSetupStealthScrollFallbackInstalled = true;

  function isEditableTarget(target) {
    if (!target || target === document) return false;
    const element = target.nodeType === Node.ELEMENT_NODE ? target : target.parentElement;
    if (!element) return false;
    return !!element.closest('input, textarea, select, [contenteditable="true"]');
  }

  function isSetupSurfaceActive() {
    return document.body.classList.contains('setup-responsive-active') ||
      document.documentElement.classList.contains('setup-responsive-active');
  }

  function getSetupScroller() {
    const setupScreen = document.getElementById('setup-screen');
    if (!setupScreen || !setupScreen.classList.contains('active')) return null;
    return setupScreen;
  }

  function findNestedVerticalScroller(start, setupScroller) {
    let node = start && start.nodeType === Node.ELEMENT_NODE ? start : start?.parentElement;
    while (node && node !== document.body && node !== document.documentElement) {
      if (node === setupScroller) return null;
      const style = window.getComputedStyle(node);
      const canScrollY = /(auto|scroll)/.test(style.overflowY || '') && node.scrollHeight > node.clientHeight + 2;
      if (canScrollY) return node;
      node = node.parentElement;
    }
    return null;
  }

  window.addEventListener('wheel', function onSetupWheel(event) {
    if (!isSetupSurfaceActive()) return;
    const setupScroller = getSetupScroller();
    if (!setupScroller || !setupScroller.contains(event.target)) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

    const nestedScroller = findNestedVerticalScroller(event.target, setupScroller);
    if (nestedScroller) return;

    const maxScroll = setupScroller.scrollHeight - setupScroller.clientHeight;
    if (maxScroll <= 2) return;

    const before = setupScroller.scrollTop;
    setupScroller.scrollTop = Math.max(0, Math.min(maxScroll, before + event.deltaY));
    if (setupScroller.scrollTop !== before) {
      event.preventDefault();
    }
  }, { passive: false });

  window.addEventListener('keydown', function onSetupKeyScroll(event) {
    if (!isSetupSurfaceActive() || isEditableTarget(event.target)) return;
    const setupScroller = getSetupScroller();
    if (!setupScroller) return;

    const maxScroll = setupScroller.scrollHeight - setupScroller.clientHeight;
    if (maxScroll <= 2) return;

    const step = Math.max(80, Math.round(setupScroller.clientHeight * 0.14));
    const page = Math.max(120, Math.round(setupScroller.clientHeight * 0.82));
    let delta = 0;

    if (event.key === 'ArrowDown') delta = step;
    else if (event.key === 'ArrowUp') delta = -step;
    else if (event.key === 'PageDown') delta = page;
    else if (event.key === 'PageUp') delta = -page;
    else if (event.key === 'Home') delta = -maxScroll;
    else if (event.key === 'End') delta = maxScroll;
    else return;

    const before = setupScroller.scrollTop;
    setupScroller.scrollTop = Math.max(0, Math.min(maxScroll, before + delta));
    if (setupScroller.scrollTop !== before) {
      event.preventDefault();
    }
  });
})();

// v3.3.11 — Menu Motion Polish.
// Adds a tiny motion state layer for setup/menu/tournament screens only. No draft logic is changed.
(function installSetupMotionPolish() {
  if (window.__strinovaSetupMotionPolishInstalled) return;
  window.__strinovaSetupMotionPolishInstalled = true;

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const html = document.documentElement;
  const body = document.body;

  function setMotionReady() {
    if (reduceMotion) {
      html.classList.add('setup-motion-reduced');
      body.classList.add('setup-motion-reduced');
      return;
    }
    requestAnimationFrame(() => {
      html.classList.add('setup-motion-ready');
      body.classList.add('setup-motion-ready');
    });
  }

  function pulseTabTransition() {
    if (reduceMotion) return;
    html.classList.add('setup-tab-transition');
    body.classList.add('setup-tab-transition');
    window.clearTimeout(window.__strinovaSetupMotionTimer);
    window.__strinovaSetupMotionTimer = window.setTimeout(() => {
      html.classList.remove('setup-tab-transition');
      body.classList.remove('setup-tab-transition');
    }, 320);
  }

  function install() {
    setMotionReady();
    document.addEventListener('click', event => {
      const tab = event.target && event.target.closest ? event.target.closest('[data-tab], [data-tournament-view]') : null;
      if (tab) pulseTabTransition();
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
