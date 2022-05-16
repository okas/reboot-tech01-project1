import { GameTile } from "./GameTile.js";
import { TilePicker } from "./TilePicker.js";
import { BoardWalker } from "./BoardWalker.js";
import { TileMatcher } from "./TileMatcher.js";
import { TileMover } from "./TileMover.js";
import { extendFromArrayIndexOf, rangeGenerator, sleep } from "./utilities.js";
import { MatchInfoCombo } from "./MatchInfoCombo.js";
import { MatchInfoBase } from "./MatchInfoBase.js";

export class GameArena {
  /** @type {string} */
  #canvasId;
  /** @type {number} */
  #rows;
  /** @type {number} */
  #cols;

  /** @type {number} */
  #timerId;
  /** @type {number} */
  #timerInterval;

  /** @type {number} */
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
  /** @type {TileMover} */
  #mover;
  /** @type {number} */
  #tileCounter;

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
    this.#timerId = null;

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

    extendFromArrayIndexOf(this.#elemTiles);

    this.#initTools();
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
    const tile = new GameTile({ id, type: tileKey, worth: 1, leverage: 1.25 });
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
   * @param  {Event & {target: GameTile}} {clickedTile}
   */
  async #tileClickHandler({ target: clickedTile }) {
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
    console.debug("Done with matching series!");
  }

  /**
   * @param {MatchInfoCombo} matchInfo
   * @return {Promise<MatchInfoCombo[]}>}
   */
  async #startMainRecursive(matchInfo) {
    const bubbledMatches = await this.#matchCollapseRecursive(matchInfo);

    const newTiles = await this.#generateNewTiles(bubbledMatches);
    const matchInfoOfNewTiles = this.#tryFindMatches(...newTiles);

    if (matchInfoOfNewTiles) {
      console.debug("New tiles generates matches, working them through now...");
      await this.#startMainRecursive(matchInfoOfNewTiles);
    }
  }

  /**
   * @param {MatchInfoCombo} matchInfo
   * @return {Promise< MatchInfoCombo[]}>}
   */
  async #matchCollapseRecursive(matchInfo) {
    await this.#markMatchedTiles(matchInfo);
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
   * @param {GameTile[]} tilesToAnalyze
   */
  #tryFindMatches(...tilesToAnalyze) {
    const matches = [...tilesToAnalyze]
      .map((tile) => this.#matcher.detectMatchXY(tile))
      .filter((m) => m);

    return matches?.length
      ? new MatchInfoCombo(this.#elemTiles, ...matches)
      : null;
  }

  /**
   * @param {MatchInfoCombo} matchInfo
   */
  async #markMatchedTiles(matchInfo) {
    for await (const tile of matchInfo.allDomSorted) {
      tile.setMatched();
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
   * Generate tiles and replace, thy replace matched tiles, that are now bubbled up.
   * @param {MatchInfoCombo[]} allMatchesData
   * @return {Promise<GameTile[]>}
   */
  async #generateNewTiles(allMatchesData) {
    const allFlatMatchTiles = allMatchesData
      .flatMap(({ allDomSorted }) => allDomSorted)
      .sort(MatchInfoBase.domSortAsc);

    const newTileGen = this.#tileFactory(allFlatMatchTiles.length);

    const result = [];

    for await (const oldTile of allFlatMatchTiles) {
      const newTile = newTileGen.next().value;
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
}
