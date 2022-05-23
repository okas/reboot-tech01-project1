import { GameArena } from "./GameArena.js";
import { GameStatistics } from "./GameStatistics.js";
import { GameUI } from "./GameUI.js";

const rows = 7;
const cols = 7;

const gameUI = new GameUI("game-canvas");

// Let's build dependencies.
const gameStatistics = new GameStatistics({
  movesCounterId: "view-game-arena-moves",
  timerId: "view-game-arena-timer",
  tilesMatchedCounterId: "view-game-arena-matched",
  matchCombosCounterId: "view-game-arena-combos-counter",
  chancesCounterId: "view-game-arena-chances",
});

// Game bootstrapping
const game = new GameArena(
  { rows, cols, initialDuration: 60 },
  gameUI,
  gameStatistics
);

game.star();
