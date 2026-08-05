(() => {
  "use strict";

  const root = document.getElementById("gacha-lab");
  if (!root) return;

  const STORAGE_KEY = "rpmods_gacha_sim_v2";
  const QUALITY_CYCLE = ["refined", "rare", "epic", "legendary"];
  const QUALITY = Object.freeze({
    legendary: Object.freeze({ label: "Legendary", color: "#e64a4a", base: 0.65, general: 1.7, short: "L" }),
    epic: Object.freeze({ label: "Epic", color: "#e7b94c", base: 5.0, general: 5.8, short: "E" }),
    rare: Object.freeze({ label: "Rare", color: "#9d61ff", base: 24.0, general: 24.3, short: "R" }),
    refined: Object.freeze({ label: "Fine", color: "#57b8ff", base: 70.4, general: 68.2, short: "F" }),
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
    recentSlots: ["refined", "rare", "refined", "epic", "refined", "rare", "refined", "refined", "epic", "rare"],
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
      if (!parsed || typeof parsed !== "object") return defaultState();
      const base = defaultState();
      const recent = Array.isArray(parsed.recentSlots)
        ? parsed.recentSlots.slice(0, 10).map(item => sanitizeQuality(item))
        : base.recentSlots.slice();
      while (recent.length < 10) recent.push(base.recentSlots[recent.length] || "refined");
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

  function usedHistorySlots() {
    return state.recentSlots.slice(0, state.historyCount);
  }

  function simulateForecast() {
    const seedInput = [
      state.historyCount,
      state.sequenceCount,
      state.legendaryRemaining,
      state.epicRemaining,
      usedHistorySlots().join("|"),
    ].join(":");
    const random = mulberry32(hashSeed(seedInput));
    const forecast = [];
    let legendaryRemaining = state.legendaryRemaining;
    let epicRemaining = state.epicRemaining;

    for (let index = 0; index < state.sequenceCount; index += 1) {
      const probabilities = nextPullProbabilities(legendaryRemaining, epicRemaining);
      const quality = pickWeighted(random, probabilities);
      forecast.push({
        index: index + 1,
        quality,
        probabilities,
      });

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

    return {
      forecast,
      nextLegendaryRemaining: legendaryRemaining,
      nextEpicRemaining: epicRemaining,
    };
  }

  function wheelGradient(items) {
    if (!items.length) {
      return "conic-gradient(from -15deg, #57b8ff, #9d61ff, #e7b94c, #e64a4a, #57b8ff)";
    }
    const gap = 3.4;
    const sweep = 360 / items.length;
    const parts = [];
    items.forEach((item, index) => {
      const start = index * sweep;
      const end = start + sweep - gap;
      parts.push(`${QUALITY[item.quality].color} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`);
      parts.push(`rgba(6, 13, 24, .94) ${end.toFixed(2)}deg ${(start + sweep).toFixed(2)}deg`);
    });
    return `conic-gradient(from -12deg, ${parts.join(", ")})`;
  }

  function renderProbabilityCards() {
    const probabilities = nextPullProbabilities(state.legendaryRemaining, state.epicRemaining);
    Object.entries(els.probability).forEach(([key, node]) => {
      if (!node) return;
      const value = probabilities[key] || 0;
      node.textContent = `${value.toFixed(value >= 10 ? 1 : 2)}%`;
    });
  }

  function recentSlotMarkup(index, quality) {
    return `<span>${index + 1}</span><b>${QUALITY[quality].short}</b>`;
  }

  function renderRecentSlots() {
    if (!els.recentSlots) return;
    els.recentSlots.replaceChildren();
    for (let index = 0; index < state.historyCount; index += 1) {
      const quality = sanitizeQuality(state.recentSlots[index]);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `gacha-recent-slot quality-${quality}`;
      button.dataset.index = String(index);
      button.dataset.quality = quality;
      button.title = `Casillero ${index + 1}: ${QUALITY[quality].label}`;
      button.setAttribute("aria-label", `Casillero ${index + 1}: ${QUALITY[quality].label}`);
      button.innerHTML = recentSlotMarkup(index, quality);
      button.addEventListener("click", () => {
        const currentIndex = QUALITY_CYCLE.indexOf(state.recentSlots[index]);
        state.recentSlots[index] = QUALITY_CYCLE[(currentIndex + 1) % QUALITY_CYCLE.length];
        saveState();
        renderRecentSlots();
        renderForecast({ animate: false });
      });
      els.recentSlots.appendChild(button);
    }
  }

  function summaryForForecast(items) {
    const counts = { legendary: 0, epic: 0, rare: 0, refined: 0 };
    items.forEach(item => { counts[item.quality] += 1; });
    const pieces = [];
    if (counts.legendary) pieces.push(`${counts.legendary} legendary`);
    if (counts.epic) pieces.push(`${counts.epic} epic`);
    if (counts.rare) pieces.push(`${counts.rare} rare`);
    if (counts.refined) pieces.push(`${counts.refined} fine`);
    return pieces.length ? pieces.join(" · ") : "Sin resultados";
  }

  function renderStrip(items, animate = false) {
    if (!els.strip) return;
    els.strip.replaceChildren();
    items.forEach((item, index) => {
      const cell = document.createElement("div");
      cell.className = `gacha-forecast-cell quality-${item.quality}`;
      if (animate) cell.classList.add("is-pending");
      cell.title = `Secuencia ${item.index}: ${QUALITY[item.quality].label}`;
      cell.innerHTML = `<span>${item.index}</span><b>${QUALITY[item.quality].label}</b>`;
      els.strip.appendChild(cell);
      if (animate) {
        window.setTimeout(() => cell.classList.remove("is-pending"), 110 + (index * 135));
      }
    });
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

  function renderForecast({ animate = true } = {}) {
    syncStateFromControls();
    renderRecentSlots();
    renderProbabilityCards();

    const simulation = simulateForecast();
    const items = simulation.forecast;
    if (els.wheel) {
      els.wheel.style.setProperty("--gacha-wheel-gradient", wheelGradient(items));
      if (animate) {
        els.wheel.classList.remove("is-spinning");
        void els.wheel.offsetWidth;
        els.wheel.classList.add("is-spinning");
      }
    }

    renderStrip(items, animate);

    const firstLegendary = items.find(item => item.quality === "legendary");
    const firstEpic = items.find(item => item.quality === "epic");
    if (els.title) {
      if (firstLegendary) els.title.textContent = `LEGENDARY SIGNAL · SEQ ${firstLegendary.index}`;
      else if (firstEpic) els.title.textContent = `EPIC SIGNAL · SEQ ${firstEpic.index}`;
      else els.title.textContent = `FINE / RARE WINDOW · ${items.length} SEQ`;
    }
    if (els.summary) {
      els.summary.textContent = `${summaryForForecast(items)} · siguiente pity L ${simulation.nextLegendaryRemaining} · E ${simulation.nextEpicRemaining}`;
    }
  }

  function applyStateToControls() {
    if (els.historyCount) els.historyCount.value = String(state.historyCount);
    if (els.sequenceCount) els.sequenceCount.value = String(state.sequenceCount);
    if (els.legendaryRemaining) els.legendaryRemaining.value = String(state.legendaryRemaining);
    if (els.epicRemaining) els.epicRemaining.value = String(state.epicRemaining);
  }

  function reset() {
    state = defaultState();
    applyStateToControls();
    saveState();
    renderForecast({ animate: false });
  }

  [els.historyCount, els.sequenceCount, els.legendaryRemaining, els.epicRemaining]
    .filter(Boolean)
    .forEach(input => input.addEventListener("change", () => renderForecast({ animate: false })));

  els.generate?.addEventListener("click", () => renderForecast({ animate: true }));
  els.quick?.addEventListener("click", () => renderForecast({ animate: false }));
  els.reset?.addEventListener("click", reset);

  applyStateToControls();
  renderForecast({ animate: false });
})();
