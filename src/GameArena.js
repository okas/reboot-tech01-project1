import { GameTile } from "./GameTile.js";
import { TilePicker } from "./TilePicker.js";
import { BoardWalker } from "./BoardWalker.js";
import { TileMatcher } from "./TileMatcher.js";
import { TileMover } from "./TileMover.js";
import { extendFromArrayIndexOf, rangeGenerator, sleep } from "./utilities.js";
import { MatchInfoCombo } from "./MatchInfoCombo.js";
import { MatchInfoBase } from "./MatchInfoBase.js";
import { TileMatcherChance } from "./TileMatcherChance.js";

/**
 * @typedef {Object} Config
 * @property {string} canvasId
 * @property {number} rows
 * @property {number} cols
 * @property {number} badSwapTimeout Allows to control timing when to switch back user bar selection.
 * @property {number} timerInterval Main interval of cycle in game.
 *                    Various places in program use own coefficient, to be relates to this value.
 */

export class GameArena {
  #canvasId;
  #rows;
  #cols;
  #timerInterval;
  #badSwapTimeout;

  /** @type {HTMLElement} */
  #elemCanvas;
  /** @type {HTMLCollection & {Array<HTMLCollection>.indexOf(searchElement: HTMLCollection, fromIndex?: number): number}} */
  #elemTiles;

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
  /** @type {number} */
  #tileCounter;

  /**
   * @param {Config}
   */
  constructor({
    canvasId = "canvasId",
    rows = 7,
    cols = 7,
    badSwapTimeout = 500,
    timerInterval = 200,
  }) {
    this.#canvasId = canvasId;
    this.#timerInterval = timerInterval;
    this.#badSwapTimeout = badSwapTimeout;

    this.#rows = rows;
    this.#cols = cols;

    this.#tileCounter = 0;

    this.#initDOM();
    this.#resetCanvas();
    this.#resetCanvasLayout();
  }

  get #actionDelay() {
    return this.#timerInterval;
  }

  #initDOM() {
    this.#elemCanvas = document.getElementById("game-canvas");
  }

  #resetCanvas() {
    this.#resetCanvasLayout();
    this.#elemCanvas.replaceChildren(
      ...this.#tileFactory(this.#rows * this.#cols)
    );
    this.#elemTiles = this.#elemCanvas.children;

    this.#elemTiles = extendFromArrayIndexOf(this.#elemTiles);

    this.#initTools();

    this.#countChances();
  }

  #resetCanvasLayout() {
    const { gridTemplateColumns } = window.getComputedStyle(this.#elemCanvas);
    const extractedColWidth = /\d+.?\d*px/i.exec(gridTemplateColumns)[0];
    const newValue = `repeat(${this.#cols}, ${extractedColWidth})`;

    this.#elemCanvas.style.gridTemplateColumns = newValue;
  }

  /**
   * @param {number} amount
   */
  *#tileFactory(amount) {
    for (const k of rangeGenerator(
      this.#tileCounter + amount,
      ++this.#tileCounter
    )) {
      this.#tileCounter = k;
      yield this.#createTile(this.#getRandomTileKey(), k);
    }
  }

  #getRandomTileKey() {
    return Math.ceil(Math.random() * GameTile.typeCount);
  }

  #createTile(tileKey, id) {
    const tile = new GameTile({
      id: id - 1,
      type: tileKey,
      worth: 1,
      leverage: 1.25,
    });
    tile.onclick = this.#tileClickHandler.bind(this);

    return tile;
  }

  #initTools() {
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
    this.#disableCanvas();
    this.#performGameMove(event.currentTarget);
    this.#enableCanvas();
  }

  /**
   * Main vector for user to react with game.
   * @param {GameTile} clickedTile
   */
  #performGameMove(clickedTile) {
    const intendedSwapDirection = this.#picker.analyzeSelection(clickedTile);

    if (!intendedSwapDirection) {
      return;
    }

    console.debug(
      `User picked and put tile to ${intendedSwapDirection} direction.`
    );

    this.#swapUserSelectedTiles();

    const matchFixture = this.#tryFindMatchesByUserSelection();

    if (matchFixture) {
      this.#handleUserSuccessSelection(matchFixture);
    } else {
      this.#handleUserBadSelection();
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
    await this.#startMainRecursive(matchInfo);

    console.debug("Done with matching series!\n   ..--=/=--..\n");
  }

  /**
   * @param {MatchInfoCombo} matchInfo
   * @return {Promise<MatchInfoCombo[]>}
   */
  async #startMainRecursive(matchInfo) {
    const bubbledMatches = await this.#matchCollapseRecursive(matchInfo);

    const flattened = this.#flattenDomSortedExhaustedMatches(bubbledMatches);
    const newTiles = await this.#generateNewTiles(flattened);
    const matchInfoOfNewTiles = this.#tryFindMatches(...newTiles);

    if (!matchInfoOfNewTiles) {
      console.log(this.#isGameOver());
    } else {
      console.debug(
        " -> New tiles generated matches, working them through now..."
      );
      await this.#startMainRecursive(matchInfoOfNewTiles);
    }
  }

  /**
   * @param {MatchInfoCombo} matchInfo
   * @return {Promise<MatchInfoCombo[]>}
   */
  async #matchCollapseRecursive(matchInfo) {
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

  #isGameOver() {
    this.#countChances();
  }

  #countChances() {
    const count1 = this.#chancer1.chances1Count();
    const count2 = this.#chancer1.chances2Count();
    console.log(" --> TYPE1 chances count: ", count1);
    console.log(" --> TYPE2 chances count: ", count2);
    console.log(
      " --> TOTAL chances count: ",
      [
        ...Object.entries(count1).map(([, val]) => val),
        ...Object.entries(count2).map(([, val]) => val),
      ].reduce((acc, val) => (acc += val))
    );
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
        match.all.forEach((m) => checkBag.add(m));
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
    for await (const tile of matchInfo.all) {
      tile.setMatched().onclick = null;
      await sleep(this.#actionDelay / 6);
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
      .flatMap(({ all }) => all)
      .sort(MatchInfoBase.domSortAsc);
  }

  /**
   * Generate tiles and replace matched tiles, that are now bubbled up.
   * @param {GameTile[]} allMatchesData
   */
  async #generateNewTiles(allMatchesData) {
    const newTileGenerator = this.#tileFactory(allMatchesData.length);

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

  #enableCanvas() {
    this.#elemCanvas.style.pointerEvents = "auto";
  }

  #disableCanvas() {
    this.#elemCanvas.style.pointerEvents = "none";
  }
}
