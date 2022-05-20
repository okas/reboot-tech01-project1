import { GameArena } from "./GameArena.js";
import { GameStatistics } from "./GameStatistics.js";

// Let's build dependencies.
const gameStatistics = new GameStatistics({
  movesCounterId: "view-game-arena-moves",
  timerId: "view-game-arena-timer",
  tilesMatchedCounterId: "view-game-arena-matched",
  matchCombosCounterId: "view-game-arena-combos-counter",
  chancesCounterId: "view-game-arena-chances",
});

// Game bootstrapping
// eslint-disable-next-line no-unused-vars
const game = new GameArena({ rows: 7, cols: 7 }, gameStatistics);
