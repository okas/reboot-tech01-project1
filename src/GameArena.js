import { GameTile } from "./GameTile.js";
import { TilePicker } from "./TilePicker.js";
import { BoardWalker } from "./BoardWalker.js";
import { TileMatcher } from "./TileMatcher.js";
import { TileMover } from "./TileMover.js";
import { extendFromArrayIndexOf, rangeGenerator } from "./utilities.js";
import { MatchInfoCombo } from "./MatchInfoCombo.js";

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

    this.#initDOM();
    this.#resetCanvas();
    this.#resetCanvasLayout();
  }

  #initDOM() {
    this.#elemCanvas = document.getElementById("game-canvas");
  }

  #resetCanvas() {
    this.#resetCanvasLayout();
    this.#elemCanvas.replaceChildren(...this.#createBoard());
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

  *#createBoard() {
    for (const k of rangeGenerator(this.#rows * this.#cols, 1)) {
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
      this.#walker
    );
  }

  /**
   * @param  {Event & {target: GameTile}} {clickedTile}
   */
  #tileClickHandler({ target: clickedTile }) {
    const intendedSwapDirection =
      this.#picker.manageAndValidateSelection(clickedTile);
    console.debug(intendedSwapDirection);

    if (!intendedSwapDirection) {
      return;
    }

    this.#swapUserSelectedTiles();

    const matchFixture = this.#calculateMatchByUserSelection();
    console.debug(matchFixture);

    if (matchFixture) {
      this.#handleUserSuccessSelection(matchFixture);

      // TODO: reset stack, if cycle is done!
      // TODO: reset match, if cycle is done!
    } else {
      this.#handleUserBadSelection();
    }
  }

  #calculateMatchByUserSelection() {
    const matchInfo1 = this.#matcher.detectMatchXY(this.#picker.firstTile);
    const matchInfo2 = this.#matcher.detectMatchXY(this.#picker.secondTile);

    return matchInfo1 || matchInfo2
      ? new MatchInfoCombo(this.#elemTiles, matchInfo1, matchInfo2)
      : null;
  }

  /**
   * @param {MatchInfoCombo} matchInfo
   */
  #handleUserSuccessSelection(matchInfo) {
    // TODO needs refactor!
    this.#picker.resetUserSelection();

    this.#markMatchedTiles(matchInfo);

    const preBubbleSnap = [...matchInfo.takeSnapShot()];
    console.debug("before: ", preBubbleSnap);

    const collapsedStack = this.#mover.bubbleMatchToTopEdge(matchInfo);

    this.#markCollapsedTiles(collapsedStack);

    const postBubbleSnap = [...matchInfo.takeSnapShot()];
    console.debug("after: ", postBubbleSnap);

    // BUG: current match data snapshot do not reveal always the change in stack!
    // TODO: Will turn off snapshot comparison for now, needs reiteration.
    // if (!MatchInfoBase.compareSnapshots(preBubbleSnap, postBubbleSnap)) {

    // }

    const newMatchesAfterCollapse = this.#tryFindNewMatches(collapsedStack);

    if (newMatchesAfterCollapse) {
      const result = this.#handleUserSuccessSelection(newMatchesAfterCollapse);
      result.matches.push(matchInfo);
      result.collapses.push(collapsedStack);

      return result;
    }

    return {
      matches: [matchInfo],
      collapses: [collapsedStack],
    };
  }

  /**
   * @param {GameTile[]} tilesToAnalyze
   */
  #tryFindNewMatches(tilesToAnalyze) {
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
  #markMatchedTiles(matchInfo) {
    matchInfo.allDomSorted.forEach((tile) => tile.setMatched());
  }

  /**
   * @param {GameTile[]} collapsedStack
   */
  #markCollapsedTiles(collapsedStack) {
    collapsedStack.forEach((tile) => tile.setCollapsed());
  }

  #handleUserBadSelection() {
    const id = setTimeout(() => {
      clearTimeout(id);
      this.#swapUserSelectedTiles();
      this.#picker.resetUserSelection();
    }, this.#badSwapTimeout);
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
