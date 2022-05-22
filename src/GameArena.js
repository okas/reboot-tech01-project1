import { TilePicker } from "./TilePicker.js";
import { BoardWalker } from "./BoardWalker.js";
import { TileMatcher } from "./TileMatcher.js";
import { TileMover } from "./TileMover.js";
import { extendFromArrayIndexOf, sleep } from "./utilities.js";
import { MatchInfoCombo } from "./MatchInfoCombo.js";
import { MatchInfoBase } from "./MatchInfoBase.js";
import { TileMatcherChance } from "./TileMatcherChance.js";

/**
 * @typedef {Object} Config
 * @property {number} rows
 * @property {number} cols
 * @property {number} badSwapTimeout Allows to control timing when to switch back user bar selection.
 * @property {number} timerInterval Main interval of cycle in game.
 *                    Various places in program use own coefficient, to be relates to this value.
 */

export class GameArena {
  /** @type {number} */
  #gameTimerId;

  #rows;
  #cols;
  #timerInterval;
  #badSwapTimeout;

  /** @type {HTMLCollection & {Array<HTMLCollection>.indexOf(searchElement: HTMLCollection, fromIndex?: number): number}} */
  #elemTiles;

  #ui;
  #stats;

  /** @type {TilePicker} */
  #picker;
  /** @type {BoardWalker} */
  #walker;
  /** @type {TileMatcher} */
  #matcher;
  /** @type {TileMatcherChance} */
  #chancer1;
  /** @type {TileMover} */
  #mover;

  /**
   * @param {Config}
   * @param {GameUI} gameUI
   * @param {GameStatistics} gameStatistics
   */
  constructor(
    { rows, cols, badSwapTimeout = 500, timerInterval = 200 },
    gameUI,
    gameStatistics
  ) {
    this.#timerInterval = timerInterval;
    this.#badSwapTimeout = badSwapTimeout;

    this.#rows = rows;
    this.#cols = cols;

    this.#ui = gameUI;
    this.#stats = gameStatistics;
  }

  get #actionDelay() {
    return this.#timerInterval;
  }

  star() {
    this.#initTools();

    this.#countChances();

    this.#ui.enableCanvas();

    this.#stats.timer = 60;

    this.#gameTimerId = setInterval(this.#ticker.bind(this), 1000);
  }

  #ticker() {
    if (this.#stats.timer > 0) {
      this.#stats.timer--;
    } else {
      clearInterval(this.#gameTimerId);
      // TODO: Shout GO!
    }
  }

  #updateStatsMatch(matches) {
    this.#stats.timer += matches;
    this.#stats.matchCount += matches;
  }

  #updateStatsCombo(combos) {
    this.#stats.timer += combos * 2;
    this.#stats.comboCount += combos;
  }

  #initTools() {
    this.#elemTiles = this.#ui.createBoard(
      this.#rows,
      this.#cols,
      this.#tileClickHandler.bind(this)
    );

    this.#elemTiles = extendFromArrayIndexOf(this.#elemTiles);

    this.#walker = new BoardWalker(this.#rows, this.#cols);

    this.#matcher = new TileMatcher(
      this.#rows,
      this.#cols,
      this.#elemTiles,
      this.#walker
    );

    this.#chancer1 = new TileMatcherChance(
      this.#rows,
      this.#cols,
      this.#elemTiles,
      this.#walker
    );
    this.#picker = new TilePicker(this.#cols, this.#elemTiles);

    this.#mover = new TileMover(
      this.#rows,
      this.#cols,
      this.#elemTiles,
      this.#walker,
      this.#actionDelay
    );
  }

  /**
   * @param  {Event }
   */
  async #tileClickHandler(event) {
    event.stopPropagation();

    const intendedSwapDirection = this.#picker.analyzeSelection(
      event.currentTarget
    );

    if (intendedSwapDirection) {
      console.debug(
        `User picked and put tile to ${intendedSwapDirection} direction.`
      );
    } else {
      return;
    }

    this.#ui.disableCanvas();

    const needToCheckGO = await this.#tryPerformGameMove(event.currentTarget);

    if (!needToCheckGO || this.#canContinue()) {
      this.#ui.enableCanvas();
    } else {
      this.#handleGameOver();
    }
  }

  /**
   * Main vector for user to react with game.
   * @param {GameTile} clickedTile
   */
  async #tryPerformGameMove(clickedTile) {
    this.#swapUserSelectedTiles();

    const matchFixture = this.#tryFindMatchesByUserSelection();

    if (matchFixture) {
      this.#stats.moveCount++;
      await this.#handleUserSuccessSelection(matchFixture);
      return true;
    } else {
      this.#handleUserBadSelection();
      return false;
    }
  }

  #tryFindMatchesByUserSelection() {
    return this.#tryFindMatches(
      this.#picker.firstTile,
      this.#picker.secondTile
    );
  }

  /**
   * @param {MatchInfoCombo} matchInfo
   */
  async #handleUserSuccessSelection(matchInfo) {
    console.debug("User have selected matching tiles.");

    await sleep(this.#actionDelay);
    this.#picker.resetUserSelection();

    const regenerations = await this.#startMainRecursive(matchInfo);
    console.debug(regenerations);

    console.debug("Done with matching series!\n   ..--=/=--..\n");
  }

  /**
   * @param {MatchInfoCombo} matchInfo
   * @param {number} cyclesSoFar
   * @return {Promise<number>} Number of cycles of regeneration of tiles, that resulted new automatic matches.
   */
  async #startMainRecursive(matchInfo, cyclesSoFar = 0) {
    // Start cycle.
    const bubbledMatches = await this.#matchCollapseRecursive(matchInfo);
    // => Cycle done.

    cyclesSoFar++;

    const comboCount = this.#calculateComboCount(bubbledMatches);

    if (cyclesSoFar === 1) {
      this.#updateStatsCombo(comboCount > 1 ? comboCount : 0);
    } else {
      this.#updateStatsCombo(comboCount);
    }

    // Prepare next cycle, if it is possible.
    const flattened = this.#flattenDomSortedExhaustedMatches(bubbledMatches);
    const newTiles = await this.#generateNewTiles(flattened);
    const matchInfoOfNewTiles = this.#tryFindMatches(...newTiles);

    // Base case.
    if (!matchInfoOfNewTiles) {
      return cyclesSoFar;
    }

    console.debug(
      " -> New tiles generated matches, working them through now..."
    );

    // 2nd cycle is confirmed: fix combo count.

    if (cyclesSoFar === 1 && comboCount === 1) {
      this.#updateStatsCombo(1);
    }

    return await this.#startMainRecursive(matchInfoOfNewTiles, cyclesSoFar);
  }

  /**
   * @param {MatchInfoCombo} matchInfo
   * @return {Promise<MatchInfoCombo[]>}
   */
  async #matchCollapseRecursive(matchInfo) {
    this.#updateStatsMatch(matchInfo.allTiles.length);

    await this.#sanitizeMatchedTiles(matchInfo);

    await sleep(this.#actionDelay / 1.6);

    const collapsedStack = await this.#mover.bubbleMatchToTopEdge(matchInfo);

    // This marking is beneficial to detect stack movements and for fine matching within it.
    this.#markCollapsedTiles(collapsedStack);
    const newMatchesAfterCollapse = this.#tryFindMatches(...collapsedStack);
    this.#clearCollapsedTiles(collapsedStack);

    if (!newMatchesAfterCollapse) {
      return [matchInfo];
    }

    const result = await this.#matchCollapseRecursive(newMatchesAfterCollapse);
    result.push(matchInfo);

    return result;
  }

  /**
   * @param {MatchInfoCombo} matchInfo
   * @return {number} Sum of individual matches.
   */
  #calculateComboCount(matches) {
    return matches.reduce((acc, cur) => (acc += cur.allMatchesCount), 0);
  }

  /**
   * @returns {number}
   */
  #countChances() {
    const count1 = this.#chancer1.chances1Count();
    const count2 = this.#chancer1.chances2Count();

    const totalCount = [count1, count2]
      .flatMap((x) => Object.entries(x).map(([, count]) => count))
      .reduce((acc, val) => (acc += val));

    console.debug(" --> TYPE1 chances count: ", count1);
    console.debug(" --> TYPE2 chances count: ", count2);

    this.#stats.chanceCount = totalCount;

    return totalCount;
  }

  /**
   * Tries to get matches for a given set of files.
   * Has check to exclude already matched tiles from re-analyze.
   * @param {GameTile[]} tilesToAnalyze
   */
  #tryFindMatches(...tilesToAnalyze) {
    const checkBag = new Set();
    const matches = [];

    for (const tile of tilesToAnalyze) {
      if (checkBag.has(tile)) {
        continue;
      }

      const match = this.#matcher.tryCaptureMatch(tile);

      if (match) {
        matches.push(match);
        match.allTiles.forEach((m) => checkBag.add(m));
      }
    }

    return matches?.length
      ? new MatchInfoCombo(this.#elemTiles, ...matches)
      : null;
  }

  /**
   * @param {MatchInfoCombo} matchInfo
   */
  async #sanitizeMatchedTiles(matchInfo) {
    for await (const tile of matchInfo.allTiles) {
      await this.#ui.sanitizeTile(tile, this.#actionDelay / 6);
    }
  }

  /**
   * @param {GameTile[]} collapsedStack
   */
  #markCollapsedTiles(collapsedStack) {
    collapsedStack.forEach((tile) => tile.setCollapsed());
  }

  /**
   * @param {GameTile[]} collapsedStack
   */
  #clearCollapsedTiles(collapsedStack) {
    collapsedStack.forEach((tile) => tile.unSetCollapsed());
  }

  /**
   * @param {MatchInfoCombo[]} allMatchesData
   * @returns {GameTile[]}
   */
  #flattenDomSortedExhaustedMatches(allMatchesData) {
    return allMatchesData
      .flatMap(({ allTiles: all }) => all)
      .sort(MatchInfoBase.domSortAsc);
  }

  /**
   * Generate tiles and replace matched tiles, that are now bubbled up.
   * @param {GameTile[]} allMatchesData
   */
  async #generateNewTiles(allMatchesData) {
    const newTileGenerator = this.#ui.tileFactory(
      allMatchesData.length,
      this.#tileClickHandler.bind(this)
    );

    const result = [];

    for await (const oldTile of allMatchesData) {
      /** @type {GameTile} */
      const newTile = newTileGenerator.next().value;
      oldTile.replaceWith(newTile);
      result.push(newTile);
      await sleep(this.#actionDelay / 6);
    }

    return result;
  }

  async #handleUserBadSelection() {
    console.debug("User selection did not encounter matches.");
    await sleep(this.#badSwapTimeout);
    this.#swapUserSelectedTiles();
    this.#picker.resetUserSelection();
  }

  #swapUserSelectedTiles() {
    if (!this.#picker.firstTile || !this.#picker.secondTile) {
      throw new Error(
        "Developer error: tile swapping failed: at least one of the subjected tiles is not set."
      );
    }

    this.#mover.swapTiles(this.#picker.firstTile, this.#picker.secondTile);
  }

  /**
   * @returns {boolean} `true`, if game continuation conditions are met.
   */
  #canContinue() {
    return !!this.#countChances();
  }

  #handleGameOver() {
    console.debug("`Game over` conditions met!");
    Promise.resolve().then(() => {
      window.confirm("No chances left 😭\nWould you like to try again?") &&
        this.#restartGame();
    });
  }

  async #restartGame() {
    console.debug("Restarting the game.");

    this.#stats.reset();

    for (const tile of this.#elemTiles) {
      await this.#ui.sanitizeTile(tile, this.#actionDelay / 20);
    }

    this.star();
  }
}
