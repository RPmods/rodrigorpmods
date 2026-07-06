(() => {
  "use strict";

  const data = window.STRINOVA_TOURNAMENT_DATA || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

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

  function playerById(id) {
    return (data.players || []).find(player => player.id === id) || null;
  }

  function teamPlayers(team) {
    const ids = [...(team.players || []), ...(team.substitutes || [])];
    return ids.map(playerById).filter(Boolean);
  }

  function characterThumb(player) {
    if (!player?.mainCharacterId) return "";
    return `img/characters/thumbs/${String(player.mainCharacterId).replaceAll(" ", "_")}.png`;
  }

  function renderRankCell(label, id) {
    const icon = rankIcon(id);
    return `<span class="tournament-rank-cell">${icon ? `<img class="tournament-rank-icon" src="${esc(icon)}" alt="">` : ""}<span>${esc(label)}</span></span>`;
  }

  function renderTeamCard(team, compact = false) {
    const roster = teamPlayers(team);
    const rows = roster.map(player => `
      <tr>
        <td><span class="tournament-role-badge ${player.status === "empty" ? "empty" : ""}">${esc(player.role)}</span></td>
        <td>${esc(player.nickname)}${player.gameId ? `<small> ID:${esc(player.gameId)}</small>` : ""}</td>
        <td>${renderRankCell(player.currentRank, player.currentRankId)}</td>
        <td>${renderRankCell(player.peakRank, player.peakRankId)}</td>
        <td><span class="tournament-character-chip">${esc(player.mainCharacter)}</span></td>
      </tr>`).join("");
    return `
      <article class="tournament-team-card">
        <div class="tournament-team-emblem"><strong>${esc(team.tag || team.name)}</strong></div>
        <div class="tournament-team-main">
          <h3>${esc(team.name)}</h3>
          <div class="tournament-team-meta">
            <span>Estado: <b>${esc(team.status || "pendiente")}</b></span>
            <span>Titulares: <b>${(team.players || []).length}/5</b></span>
            <span>Suplentes: <b>${(team.substitutes || []).filter(id => (playerById(id) || {}).status !== "empty").length}/2</b></span>
          </div>
          <table class="tournament-roster-table">
            <thead><tr><th>Rol</th><th>Jugador</th><th>Rango actual</th><th>Rango máximo</th><th>Laminante</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </article>`;
  }

  function renderPlayerRows() {
    const players = (data.players || []).filter(player => player.status !== "empty");
    return `
      <table class="tournament-player-table">
        <thead><tr><th>Jugador</th><th>Rol</th><th>Rango actual</th><th>Máximo</th><th>Laminante</th></tr></thead>
        <tbody>
          ${players.map((player, index) => `
            <tr class="tournament-player-row ${index === 0 ? "is-selected" : ""}" data-player-id="${esc(player.id)}">
              <td>${esc(player.nickname)}<small> ID:${esc(player.gameId)}</small></td>
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
      <h3>${esc(player.nickname)}</h3>
      <p class="tournament-detail-id">ID:${esc(player.gameId || "Sin inscripción")}</p>
      <div class="rank-big">${icon ? `<img src="${esc(icon)}" alt="">` : ""}<strong>${esc(player.currentRank)}</strong></div>
      <div class="tournament-player-meta">
        <div><span>Rol</span><b>${esc(player.role)}</b></div>
        <div><span>Rango máximo</span><b>${esc(player.peakRank)}</b></div>
        <div><span>Laminante frecuente</span><b>${esc(player.mainCharacter)}</b></div>
        <div><span>Equipo</span><b>YO4HVNS</b></div>
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
    const firstTeam = (data.teams || [])[0];
    const firstPlayer = (data.players || []).find(player => player.status !== "empty");
    const setText = (selector, value) => { const node = $(selector); if (node) node.textContent = value; };
    setText("#tournament-title", config.name || "Gantigun Cup 2026");
    setText("#tournament-subtitle", config.subtitle || "STRINOVA Tournament Hub");
    setText("#tournament-status", config.status || "Preparación");
    setText("#tournament-organizer", config.organizer || "Gantigun");
    setText("#tournament-last-updated", `Última actualización: ${config.statsMeta?.display || "pendiente"}`);
    if (firstTeam) {
      const featured = $("#tournament-featured-team");
      const teamGrid = $("#tournament-team-grid");
      if (featured) featured.innerHTML = renderTeamCard(firstTeam, true);
      if (teamGrid) teamGrid.innerHTML = renderTeamCard(firstTeam, false);
    }
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
