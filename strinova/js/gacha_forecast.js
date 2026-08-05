(() => {
  "use strict";

  const root = document.getElementById("gacha-lab");
  if (!root) return;

  const STORAGE_KEY = "rpmods_gacha_sim_v3";
  const TOTAL_WHEEL_SLOTS = 24;
  const QUALITY_CYCLE = ["refined", "rare", "epic", "legendary"];
  const QUALITY = Object.freeze({
    legendary: Object.freeze({ label: "Legendario", color: "#e65454", base: 0.65, general: 1.7, short: "L" }),
    epic: Object.freeze({ label: "Épico", color: "#e1bc4c", base: 5.0, general: 5.8, short: "E" }),
    rare: Object.freeze({ label: "Raro", color: "#935dff", base: 24.0, general: 24.3, short: "R" }),
    refined: Object.freeze({ label: "Fino", color: "#62b0ff", base: 70.4, general: 68.2, short: "F" }),
  });

  const els = {
    historyCount: document.getElementById("gacha-history-count"),
    sequenceCount: document.getElementById("gacha-sequence-count"),
    legendaryRemaining: document.getElementById("gacha-legendary-remaining"),
    epicRemaining: document.getElementById("gacha-epic-remaining"),
    recentSlots: document.getElementById("gacha-recent-slots"),
    generate: document.getElementById("gacha-generate"),
    quick: document.getElementById("gacha-quick"),
    reset: document.getElementById("gacha-reset"),
    wheel: document.getElementById("gacha-wheel"),
    title: document.getElementById("gacha-wheel-title"),
    summary: document.getElementById("gacha-result-summary"),
    strip: document.getElementById("gacha-forecast-strip"),
    probability: {
      legendary: document.getElementById("gacha-prob-legendary"),
      epic: document.getElementById("gacha-prob-epic"),
      rare: document.getElementById("gacha-prob-rare"),
      refined: document.getElementById("gacha-prob-refined"),
    },
  };

  const defaultState = () => ({
    historyCount: 10,
    sequenceCount: 10,
    legendaryRemaining: 80,
    epicRemaining: 30,
    recentSlots: Array.from({ length: TOTAL_WHEEL_SLOTS }, () => "refined"),
  });

  function clampInteger(value, min, max, fallback) {
    const number = Number.parseInt(value, 10);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(min, Math.min(max, number));
  }

  function sanitizeQuality(value, fallback = "refined") {
    return Object.prototype.hasOwnProperty.call(QUALITY, value) ? value : fallback;
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      const base = defaultState();
      if (!parsed || typeof parsed !== "object") return base;
      const recent = Array.isArray(parsed.recentSlots)
        ? parsed.recentSlots.slice(0, TOTAL_WHEEL_SLOTS).map(item => sanitizeQuality(item))
        : [];
      while (recent.length < TOTAL_WHEEL_SLOTS) recent.push("refined");
      return {
        historyCount: clampInteger(parsed.historyCount, 1, 10, base.historyCount),
        sequenceCount: clampInteger(parsed.sequenceCount, 1, 10, base.sequenceCount),
        legendaryRemaining: clampInteger(parsed.legendaryRemaining, 1, 80, base.legendaryRemaining),
        epicRemaining: clampInteger(parsed.epicRemaining, 1, 30, base.epicRemaining),
        recentSlots: recent,
      };
    } catch (_) {
      return defaultState();
    }
  }

  let state = loadState();

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  function hashSeed(value) {
    const text = String(value || "");
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function mulberry32(seed) {
    let value = seed >>> 0;
    return () => {
      value += 0x6D2B79F5;
      let output = value;
      output = Math.imul(output ^ (output >>> 15), output | 1);
      output ^= output + Math.imul(output ^ (output >>> 7), output | 61);
      return ((output ^ (output >>> 14)) >>> 0) / 4294967296;
    };
  }

  function nextPullProbabilities(legendaryRemaining, epicRemaining) {
    if (legendaryRemaining <= 1) {
      return { legendary: 100, epic: 0, rare: 0, refined: 0 };
    }
    if (epicRemaining <= 1) {
      return { legendary: QUALITY.legendary.base, epic: 100 - QUALITY.legendary.base, rare: 0, refined: 0 };
    }
    return {
      legendary: QUALITY.legendary.base,
      epic: QUALITY.epic.base,
      rare: QUALITY.rare.base,
      refined: QUALITY.refined.base,
    };
  }

  function pickWeighted(random, probabilities) {
    const order = ["legendary", "epic", "rare", "refined"];
    let cursor = random() * 100;
    for (const key of order) {
      cursor -= probabilities[key] || 0;
      if (cursor <= 0) return key;
    }
    return "refined";
  }

  function syncStateFromControls() {
    state.historyCount = clampInteger(els.historyCount?.value, 1, 10, state.historyCount);
    state.sequenceCount = clampInteger(els.sequenceCount?.value, 1, 10, state.sequenceCount);
    state.legendaryRemaining = clampInteger(els.legendaryRemaining?.value, 1, 80, state.legendaryRemaining);
    state.epicRemaining = clampInteger(els.epicRemaining?.value, 1, 30, state.epicRemaining);

    if (els.historyCount) els.historyCount.value = String(state.historyCount);
    if (els.sequenceCount) els.sequenceCount.value = String(state.sequenceCount);
    if (els.legendaryRemaining) els.legendaryRemaining.value = String(state.legendaryRemaining);
    if (els.epicRemaining) els.epicRemaining.value = String(state.epicRemaining);
    saveState();
  }

  function renderProbabilityCards() {
    const probabilities = nextPullProbabilities(state.legendaryRemaining, state.epicRemaining);
    Object.entries(els.probability).forEach(([key, node]) => {
      if (!node) return;
      const value = probabilities[key] || 0;
      node.textContent = `${value.toFixed(value >= 10 ? 1 : 2)}%`;
    });
  }

  function setButtonQuality(node, quality, index, showIndex = true) {
    node.className = `gacha-slot quality-${quality}`;
    node.dataset.quality = quality;
    node.style.setProperty("--slot-color", QUALITY[quality].color);
    node.title = `Casillero ${index + 1}: ${QUALITY[quality].label}`;
    node.setAttribute("aria-label", `Casillero ${index + 1}: ${QUALITY[quality].label}`);
    node.innerHTML = `
      <span class="slot-short">${QUALITY[quality].short}</span>
      ${showIndex ? `<small>${index + 1}</small>` : ""}
    `;
  }

  function renderRecentSlots() {
    if (!els.recentSlots) return;
    els.recentSlots.replaceChildren();

    const orbit = document.createElement("div");
    orbit.className = "gacha-orbit-board gacha-orbit-board--input";
    const center = document.createElement("div");
    center.className = "gacha-orbit-center";
    center.innerHTML = `<strong>RUEDA ANTERIOR</strong><span>${state.historyCount} secuencias usadas</span>`;
    orbit.appendChild(center);

    for (let index = 0; index < TOTAL_WHEEL_SLOTS; index += 1) {
      const quality = sanitizeQuality(state.recentSlots[index]);
      const button = document.createElement("button");
      button.type = "button";
      button.style.setProperty("--slot-index", String(index));
      button.style.setProperty("--slot-count", String(TOTAL_WHEEL_SLOTS));
      button.className = "gacha-slot";
      setButtonQuality(button, quality, index, true);
      button.addEventListener("click", () => {
        const currentIndex = QUALITY_CYCLE.indexOf(state.recentSlots[index]);
        state.recentSlots[index] = QUALITY_CYCLE[(currentIndex + 1) % QUALITY_CYCLE.length];
        saveState();
        renderForecast({ animate: false });
      });
      orbit.appendChild(button);
    }

    els.recentSlots.appendChild(orbit);
  }

  function summarize(items) {
    const counts = { legendary: 0, epic: 0, rare: 0, refined: 0 };
    items.forEach(item => { counts[item.quality] += 1; });
    const parts = [];
    if (counts.legendary) parts.push(`${counts.legendary} legendario`);
    if (counts.epic) parts.push(`${counts.epic} épico`);
    if (counts.rare) parts.push(`${counts.rare} raro`);
    if (counts.refined) parts.push(`${counts.refined} fino`);
    return parts.length ? parts.join(" · ") : "Sin resultados";
  }

  function simulateForecast() {
    const seedInput = [
      state.historyCount,
      state.sequenceCount,
      state.legendaryRemaining,
      state.epicRemaining,
      state.recentSlots.join("|"),
    ].join(":");

    const randomForRewards = mulberry32(hashSeed(`reward:${seedInput}`));
    const randomForWheel = mulberry32(hashSeed(`wheel:${seedInput}`));

    const rewards = [];
    const wheelSlots = [];
    let legendaryRemaining = state.legendaryRemaining;
    let epicRemaining = state.epicRemaining;

    for (let index = 0; index < state.sequenceCount; index += 1) {
      const probabilities = nextPullProbabilities(legendaryRemaining, epicRemaining);
      const quality = pickWeighted(randomForRewards, probabilities);
      rewards.push({ index: index + 1, quality, probabilities });

      if (quality === "legendary") {
        legendaryRemaining = 80;
        epicRemaining = 30;
      } else if (quality === "epic") {
        legendaryRemaining = Math.max(1, legendaryRemaining - 1);
        epicRemaining = 30;
      } else {
        legendaryRemaining = Math.max(1, legendaryRemaining - 1);
        epicRemaining = Math.max(1, epicRemaining - 1);
      }
    }

    const wheelProbabilities = nextPullProbabilities(state.legendaryRemaining, state.epicRemaining);
    for (let i = 0; i < TOTAL_WHEEL_SLOTS; i += 1) {
      wheelSlots.push({ index: i + 1, quality: pickWeighted(randomForWheel, wheelProbabilities) });
    }

    return {
      rewards,
      wheelSlots,
      nextLegendaryRemaining: legendaryRemaining,
      nextEpicRemaining: epicRemaining,
    };
  }

  function renderWheel(items, animate = false) {
    if (!els.wheel) return;
    els.wheel.replaceChildren();
    els.wheel.classList.remove("is-spinning");

    const orbit = document.createElement("div");
    orbit.className = "gacha-orbit-board gacha-orbit-board--output";

    const center = document.createElement("div");
    center.className = "gacha-orbit-center gacha-orbit-center--output";
    center.innerHTML = `<strong>24 CASILLEROS</strong><span>Predicción visual</span>`;
    orbit.appendChild(center);

    items.forEach((item, index) => {
      const slot = document.createElement("div");
      slot.style.setProperty("--slot-index", String(index));
      slot.style.setProperty("--slot-count", String(TOTAL_WHEEL_SLOTS));
      setButtonQuality(slot, item.quality, index, false);
      orbit.appendChild(slot);
    });

    els.wheel.appendChild(orbit);
    if (animate) {
      requestAnimationFrame(() => {
        els.wheel.classList.add("is-spinning");
      });
    }
  }

  function renderStrip(items, animate = false) {
    if (!els.strip) return;
    els.strip.replaceChildren();
    items.forEach((item, index) => {
      const cell = document.createElement("div");
      cell.className = `gacha-forecast-cell quality-${item.quality}`;
      cell.style.setProperty("--slot-color", QUALITY[item.quality].color);
      if (animate) cell.classList.add("is-pending");
      cell.title = `Secuencia ${item.index}: ${QUALITY[item.quality].label}`;
      cell.innerHTML = `<span>${item.index}</span><b>${QUALITY[item.quality].label}</b>`;
      els.strip.appendChild(cell);
      if (animate) window.setTimeout(() => cell.classList.remove("is-pending"), 100 + (index * 120));
    });
  }

  function renderForecast({ animate = true } = {}) {
    syncStateFromControls();
    renderProbabilityCards();
    renderRecentSlots();

    const simulation = simulateForecast();
    renderWheel(simulation.wheelSlots, animate);
    renderStrip(simulation.rewards, animate);

    const firstLegendary = simulation.rewards.find(item => item.quality === "legendary");
    const firstEpic = simulation.rewards.find(item => item.quality === "epic");

    if (els.title) {
      if (firstLegendary) els.title.textContent = `SEÑAL LEGENDARIA · SEC ${firstLegendary.index}`;
      else if (firstEpic) els.title.textContent = `SEÑAL ÉPICA · SEC ${firstEpic.index}`;
      else els.title.textContent = `VENTANA FINA / RARA · ${state.sequenceCount} SEC.`;
    }

    if (els.summary) {
      els.summary.textContent = `${summarize(simulation.rewards)} · siguiente pity L ${simulation.nextLegendaryRemaining} · E ${simulation.nextEpicRemaining}`;
    }
  }

  function reset() {
    state = defaultState();
    if (els.historyCount) els.historyCount.value = String(state.historyCount);
    if (els.sequenceCount) els.sequenceCount.value = String(state.sequenceCount);
    if (els.legendaryRemaining) els.legendaryRemaining.value = String(state.legendaryRemaining);
    if (els.epicRemaining) els.epicRemaining.value = String(state.epicRemaining);
    saveState();
    renderForecast({ animate: false });
  }

  [els.historyCount, els.sequenceCount, els.legendaryRemaining, els.epicRemaining]
    .filter(Boolean)
    .forEach(input => {
      input.addEventListener("change", () => renderForecast({ animate: false }));
      input.addEventListener("input", () => renderForecast({ animate: false }));
    });

  els.generate?.addEventListener("click", () => renderForecast({ animate: true }));
  els.quick?.addEventListener("click", (event) => {
    event.preventDefault();
    renderForecast({ animate: false });
  });
  els.reset?.addEventListener("click", reset);

  renderForecast({ animate: false });
})();
