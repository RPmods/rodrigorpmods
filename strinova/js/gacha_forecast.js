(() => {
  "use strict";

  const root = document.getElementById("gacha-lab");
  if (!root) return;

  const STORAGE_KEY = "rpmods_gacha_lab_v1";
  const QUALITY_ORDER = ["refined", "rare", "epic", "legendary"];
  const QUALITY = Object.freeze({
    legendary: Object.freeze({ label: "Legendary", color: "#ffb13d", base: 0.65 }),
    epic: Object.freeze({ label: "Epic", color: "#c653ff", base: 5 }),
    rare: Object.freeze({ label: "Rare", color: "#37c6ff", base: 24 }),
    refined: Object.freeze({ label: "Refined", color: "#c9d3df", base: 70.4 }),
  });

  const els = {
    lastResult: document.getElementById("gacha-last-result"),
    legendaryRemaining: document.getElementById("gacha-legendary-remaining"),
    epicRemaining: document.getElementById("gacha-epic-remaining"),
    recentSlots: document.getElementById("gacha-recent-slots"),
    generate: document.getElementById("gacha-generate"),
    reset: document.getElementById("gacha-reset"),
    wheel: document.getElementById("gacha-wheel"),
    title: document.getElementById("gacha-wheel-title"),
    strip: document.getElementById("gacha-forecast-strip"),
    probability: {
      legendary: document.getElementById("gacha-prob-legendary"),
      epic: document.getElementById("gacha-prob-epic"),
      rare: document.getElementById("gacha-prob-rare"),
      refined: document.getElementById("gacha-prob-refined"),
    },
  };

  const defaultState = () => ({
    lastResult: "refined",
    legendaryRemaining: 80,
    epicRemaining: 30,
    recentSlots: ["refined", "rare", "refined", "epic", "rare", "refined", "refined", "rare", "refined", "epic", "refined", "rare"],
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
      const recent = Array.isArray(parsed.recentSlots) ? parsed.recentSlots.slice(0, 12).map(item => sanitizeQuality(item)) : [];
      while (recent.length < 12) recent.push(defaultState().recentSlots[recent.length]);
      return {
        lastResult: sanitizeQuality(parsed.lastResult),
        legendaryRemaining: clampInteger(parsed.legendaryRemaining, 1, 80, 80),
        epicRemaining: clampInteger(parsed.epicRemaining, 1, 30, 30),
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
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
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

  function normalizedBaseProbabilities() {
    const total = Object.values(QUALITY).reduce((sum, quality) => sum + quality.base, 0);
    return Object.fromEntries(Object.entries(QUALITY).map(([key, quality]) => [key, (quality.base / total) * 100]));
  }

  function nextPullProbabilities(legendaryRemaining, epicRemaining) {
    if (legendaryRemaining <= 1) {
      return { legendary: 100, epic: 0, rare: 0, refined: 0 };
    }
    if (epicRemaining <= 1) {
      const legendary = QUALITY.legendary.base;
      return { legendary, epic: 100 - legendary, rare: 0, refined: 0 };
    }
    return normalizedBaseProbabilities();
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

  function simulateForecast() {
    const seedInput = [
      state.lastResult,
      state.legendaryRemaining,
      state.epicRemaining,
      state.recentSlots.join("|"),
    ].join(":");
    const random = mulberry32(hashSeed(seedInput));
    const forecast = [];
    let legendaryRemaining = state.legendaryRemaining;
    let epicRemaining = state.epicRemaining;

    for (let index = 0; index < 12; index += 1) {
      const probabilities = nextPullProbabilities(legendaryRemaining, epicRemaining);
      const quality = pickWeighted(random, probabilities);
      forecast.push(quality);

      if (quality === "legendary") {
        legendaryRemaining = 80;
        epicRemaining = 30;
      } else {
        legendaryRemaining = Math.max(1, legendaryRemaining - 1);
        if (quality === "epic") epicRemaining = 30;
        else epicRemaining = Math.max(1, epicRemaining - 1);
      }
    }

    return forecast;
  }

  function wheelGradient(forecast) {
    const gap = 3.2;
    const arc = (360 / forecast.length) - gap;
    const parts = [];
    forecast.forEach((quality, index) => {
      const start = index * (360 / forecast.length);
      const end = start + arc;
      parts.push(`${QUALITY[quality].color} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`);
      parts.push(`rgba(7, 13, 23, .92) ${end.toFixed(2)}deg ${(start + arc + gap).toFixed(2)}deg`);
    });
    return `conic-gradient(from -15deg, ${parts.join(", ")})`;
  }

  function renderRecentSlots() {
    if (!els.recentSlots) return;
    els.recentSlots.replaceChildren();
    state.recentSlots.forEach((quality, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `gacha-recent-slot quality-${quality}`;
      button.dataset.index = String(index);
      button.dataset.quality = quality;
      button.title = `${index + 1}: ${QUALITY[quality].label}`;
      button.setAttribute("aria-label", `Casillero ${index + 1}: ${QUALITY[quality].label}`);
      button.innerHTML = `<span>${index + 1}</span>`;
      button.addEventListener("click", () => {
        const currentIndex = QUALITY_ORDER.indexOf(state.recentSlots[index]);
        state.recentSlots[index] = QUALITY_ORDER[(currentIndex + 1) % QUALITY_ORDER.length];
        saveState();
        renderRecentSlots();
        renderForecast({ animate: false });
      });
      els.recentSlots.appendChild(button);
    });
  }

  function renderProbabilityCards() {
    const probabilities = nextPullProbabilities(state.legendaryRemaining, state.epicRemaining);
    Object.entries(els.probability).forEach(([key, element]) => {
      if (!element) return;
      const value = probabilities[key] || 0;
      element.textContent = `${value.toFixed(value >= 10 ? 1 : 2)}%`;
    });
  }

  function renderStrip(forecast) {
    if (!els.strip) return;
    els.strip.replaceChildren();
    forecast.forEach((quality, index) => {
      const item = document.createElement("div");
      item.className = `gacha-forecast-cell quality-${quality}`;
      item.title = `Tirada ${index + 1}: ${QUALITY[quality].label}`;
      item.innerHTML = `<span>${index + 1}</span><b>${QUALITY[quality].label}</b>`;
      els.strip.appendChild(item);
    });
  }

  function renderForecast({ animate = true } = {}) {
    state.legendaryRemaining = clampInteger(els.legendaryRemaining?.value, 1, 80, state.legendaryRemaining);
    state.epicRemaining = clampInteger(els.epicRemaining?.value, 1, 30, state.epicRemaining);
    state.lastResult = sanitizeQuality(els.lastResult?.value, state.lastResult);
    if (els.legendaryRemaining) els.legendaryRemaining.value = String(state.legendaryRemaining);
    if (els.epicRemaining) els.epicRemaining.value = String(state.epicRemaining);
    if (els.lastResult) els.lastResult.value = state.lastResult;
    saveState();

    const forecast = simulateForecast();
    if (els.wheel) {
      els.wheel.style.setProperty("--gacha-wheel-gradient", wheelGradient(forecast));
      if (animate) {
        els.wheel.classList.remove("is-spinning");
        void els.wheel.offsetWidth;
        els.wheel.classList.add("is-spinning");
      }
    }
    renderStrip(forecast);
    renderProbabilityCards();

    const legendaryIndex = forecast.indexOf("legendary");
    const epicIndex = forecast.indexOf("epic");
    if (els.title) {
      if (legendaryIndex >= 0) els.title.textContent = `LEGENDARY WINDOW · PULL ${legendaryIndex + 1}`;
      else if (epicIndex >= 0) els.title.textContent = `EPIC SIGNAL · PULL ${epicIndex + 1}`;
      else els.title.textContent = "STANDARD QUALITY WINDOW";
    }
  }

  function applyStateToControls() {
    if (els.lastResult) els.lastResult.value = state.lastResult;
    if (els.legendaryRemaining) els.legendaryRemaining.value = String(state.legendaryRemaining);
    if (els.epicRemaining) els.epicRemaining.value = String(state.epicRemaining);
  }

  function reset() {
    state = defaultState();
    applyStateToControls();
    saveState();
    renderRecentSlots();
    renderForecast({ animate: true });
  }

  els.generate?.addEventListener("click", () => renderForecast({ animate: true }));
  els.reset?.addEventListener("click", reset);
  [els.lastResult, els.legendaryRemaining, els.epicRemaining].filter(Boolean).forEach(element => {
    element.addEventListener("change", () => renderForecast({ animate: false }));
  });

  applyStateToControls();
  renderRecentSlots();
  renderForecast({ animate: false });
})();
