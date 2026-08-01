"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const {
  buildTournamentData,
  serializeTournamentData,
  OUTPUT_FILE,
} = require("./build-tournament-data");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const errors = [];
const warnings = [];

function relative(filePath) {
  return path.relative(PROJECT_ROOT, filePath).replaceAll(path.sep, "/");
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    errors.push(`${relative(filePath)}: JSON inválido (${error.message})`);
    return null;
  }
}

function checkRequiredFiles() {
  const required = [
    "index.html",
    "css/styles.css",
    "js/app.js",
    "js/draft_flow_v346.js",
    "js/firebase.js",
    "js/tournament.js",
    "js/tournament_data.js",
    "main.js",
    "preload.js",
    "package.json",
  ];

  required.forEach(item => {
    if (!fs.existsSync(path.join(PROJECT_ROOT, item))) errors.push(`Falta el archivo obligatorio: ${item}`);
  });
}

function checkJsonFiles() {
  walk(path.join(PROJECT_ROOT, "data"))
    .filter(filePath => filePath.endsWith(".json"))
    .forEach(readJson);
}

function checkJavaScriptSyntax() {
  walk(PROJECT_ROOT)
    .filter(filePath => filePath.endsWith(".js"))
    .filter(filePath => !filePath.includes(`${path.sep}node_modules${path.sep}`))
    .forEach(filePath => {
      const result = spawnSync(process.execPath, ["--check", filePath], { encoding: "utf8" });
      if (result.status !== 0) {
        errors.push(`${relative(filePath)}: sintaxis JavaScript inválida\n${(result.stderr || result.stdout).trim()}`);
      }
    });
}

function checkHtmlIdsAndLocalReferences() {
  const htmlPath = path.join(PROJECT_ROOT, "index.html");
  if (!fs.existsSync(htmlPath)) return;
  const html = fs.readFileSync(htmlPath, "utf8");

  const ids = [...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)].map(match => match[1]);
  const seen = new Set();
  const duplicates = new Set();
  ids.forEach(id => {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  });
  if (duplicates.size) errors.push(`index.html contiene IDs duplicados: ${[...duplicates].join(", ")}`);

  const references = [
    ...html.matchAll(/<(?:script|link)\b[^>]+(?:src|href)\s*=\s*["']([^"']+)["']/gi),
  ].map(match => match[1]);

  references
    .filter(value => !/^(?:https?:|data:|#|\/\/)/i.test(value))
    .filter(value => value !== "js/firebase-env.js")
    .forEach(value => {
      const clean = value.split(/[?#]/, 1)[0];
      const target = path.resolve(PROJECT_ROOT, clean);
      if (!target.startsWith(PROJECT_ROOT + path.sep) || !fs.existsSync(target)) {
        errors.push(`index.html referencia un archivo inexistente: ${value}`);
      }
    });
}

function checkUniqueIds(items, label) {
  if (!Array.isArray(items)) {
    errors.push(`${label} debe ser una lista.`);
    return new Set();
  }
  const ids = new Set();
  items.forEach((item, index) => {
    const id = String(item?.id || "").trim();
    if (!id) errors.push(`${label}[${index}] no tiene id.`);
    else if (ids.has(id)) errors.push(`${label} contiene el id duplicado: ${id}`);
    else ids.add(id);
  });
  return ids;
}

function checkTournamentRelations() {
  let data;
  try {
    data = buildTournamentData();
  } catch (error) {
    errors.push(error.message);
    return;
  }

  const teamIds = checkUniqueIds(data.teams, "teams");
  const playerIds = checkUniqueIds(data.players, "players");
  checkUniqueIds(data.maps, "maps");
  checkUniqueIds(data.ranks, "ranks");
  checkUniqueIds(data.characters, "characters");

  data.players.forEach(player => {
    if (player.teamId && !teamIds.has(player.teamId)) {
      errors.push(`El jugador ${player.id} referencia un teamId inexistente: ${player.teamId}`);
    }
  });

  data.teams.forEach(team => {
    [team.captainId, team.subCaptainId, ...(team.players || []), ...(team.substitutes || [])]
      .filter(Boolean)
      .forEach(playerId => {
        if (!playerIds.has(playerId)) errors.push(`El equipo ${team.id} referencia un jugador inexistente: ${playerId}`);
      });
  });

  const expected = serializeTournamentData(data);
  const current = fs.existsSync(OUTPUT_FILE) ? fs.readFileSync(OUTPUT_FILE, "utf8") : "";
  if (expected !== current) {
    errors.push("js/tournament_data.js no está sincronizado con data/. Ejecuta npm run data:build.");
  }
}

function checkFirebaseEnvSafety() {
  const runtimeConfig = path.join(PROJECT_ROOT, "js", "firebase-env.js");
  if (fs.existsSync(runtimeConfig)) {
    warnings.push("Existe js/firebase-env.js. Confirma que no se incluya en commits ni ZIP públicos con claves reales.");
  }
}

function main() {
  checkRequiredFiles();
  checkJsonFiles();
  checkJavaScriptSyntax();
  checkHtmlIdsAndLocalReferences();
  checkTournamentRelations();
  checkFirebaseEnvSafety();

  warnings.forEach(message => console.warn(`ADVERTENCIA: ${message}`));
  if (errors.length) {
    errors.forEach(message => console.error(`ERROR: ${message}`));
    console.error(`\nValidación fallida: ${errors.length} error(es).`);
    process.exitCode = 1;
    return;
  }

  console.log("Validación completada sin errores.");
}

main();
