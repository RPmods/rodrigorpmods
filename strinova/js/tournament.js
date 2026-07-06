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
      return `
        <tr class="${player.status === "empty" ? "is-empty" : ""}${captainMark}">
          <td><span class="tournament-role-badge ${player.status === "empty" ? "empty" : ""}">${esc(player.role)}</span></td>
          <td><span class="player-name-strong">${esc(player.nickname)}</span>${player.gameId ? `<small>ID:${esc(player.gameId)}</small>` : ""}</td>
          <td>${renderRankCell(player.currentRank, player.currentRankId)}</td>
          <td>${renderRankCell(player.peakRank, player.peakRankId)}</td>
          <td><span class="tournament-character-chip">${esc(player.mainCharacter)}</span></td>
        </tr>`;
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
          <table class="tournament-roster-table">
            <thead><tr><th>Rol</th><th>Jugador</th><th>Rango actual</th><th>Rango máximo</th><th>Laminante</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
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
    const teamCards = teams.slice(0, 4).map(team => `
      <article class="tournament-mini-team" data-team-id="${esc(team.id)}">
        <strong>${esc(team.tag || team.name)}</strong>
        <span>${esc(team.name)}</span>
        <em>${teamPlayers(team, false).filter(player => player.status !== "empty").length}/5</em>
      </article>`).join("");
    featured.innerHTML = `
      <div class="tournament-summary-showcase">
        <div class="tournament-showcase-main">
          <span class="tournament-section-kicker">Equipos inscritos</span>
          <h3>${teams.length} equipos cargados</h3>
          <p>El torneo funciona como extensión del Draft System. Los datos son locales/manuales y pueden vincularse después a partidas, bracket y resultados.</p>
        </div>
        <div class="tournament-mini-team-grid">${teamCards}</div>
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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTournamentHub);
  } else {
    initTournamentHub();
  }
})();
