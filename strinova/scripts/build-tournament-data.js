"use strict";

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUTPUT_FILE = path.join(PROJECT_ROOT, "js", "tournament_data.js");

function readJson(relativePath) {
  const filePath = path.join(PROJECT_ROOT, relativePath);
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`No se pudo leer ${relativePath}: ${error.message}`);
  }
}

function buildTournamentData() {
  return {
    config: readJson("data/tournament/config.json"),
    teams: readJson("data/tournament/teams.json").teams,
    players: readJson("data/tournament/players.json").players,
    ranks: readJson("data/game/ranks.json").ranks,
    maps: readJson("data/game/maps.json").maps,
    rankedRules: readJson("data/game/ranked-rules.json"),
    characters: readJson("data/game/characters.json").characters,
  };
}

function serializeTournamentData(data) {
  return [
    "// AUTO-GENERATED FILE. Edit the JSON files in data/ and run npm run data:build.",
    `window.STRINOVA_TOURNAMENT_DATA = ${JSON.stringify(data, null, 2)};`,
    "",
  ].join("\n");
}

function main() {
  const expected = serializeTournamentData(buildTournamentData());
  const checkOnly = process.argv.includes("--check");

  if (checkOnly) {
    const current = fs.existsSync(OUTPUT_FILE) ? fs.readFileSync(OUTPUT_FILE, "utf8") : "";
    if (current !== expected) {
      console.error("tournament_data.js no coincide con los JSON de data/. Ejecuta: npm run data:build");
      process.exitCode = 1;
      return;
    }
    console.log("tournament_data.js está sincronizado con data/.");
    return;
  }

  fs.writeFileSync(OUTPUT_FILE, expected, "utf8");
  console.log(`Generado: ${path.relative(PROJECT_ROOT, OUTPUT_FILE)}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  buildTournamentData,
  serializeTournamentData,
  OUTPUT_FILE,
};
