import { GameTile } from "./game-tile.js";
import { TilePicker } from "./tile-picker.js";
import { BoardWalker } from "./board-walker.js";
import { MatchMaker } from "./match-maker.js";
import { extendFromArrayIndexOf, rangeGenerator } from "./utilities.js";
import { ComboMatchInfo } from "./combo-match-info.js";

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
  /** @type {MatchMaker} */
  #matcher;

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
    this.#matcher = new MatchMaker(
      this.#rows,
      this.#cols,
      this.#elemTiles,
      this.#walker
    );
    this.#picker = new TilePicker(this.#cols, this.#elemTiles);
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
    } else {
      this.#handleUserBadSelection();
    }
  }

  /**
   * @param {ComboMatchInfo} matchInfo
   */
  #handleUserSuccessSelection(matchInfo) {
    this.#picker.resetUserSelection();
    this.#hideMatch(matchInfo);
    this.#bubbleMatchToTopEdge(matchInfo);
  }

  /**
   * @param {ComboMatchInfo} matchFixture
   */
  #bubbleMatchToTopEdge(matchFixture) {
    // TODO: this is on possibility to drive how bubbling takes place
    // TODO: and feed the animation.

    // Copy, because bubbling track will be tracked by removing tiles,
    // that are reached it's destination.
    const fixtureRaw = new Set(matchFixture.domSortedTiles);

    while (fixtureRaw.size) {
      fixtureRaw.forEach((tileBubbling) => {
        // TODO: duplicate find of index; swapping does the same!
        const idxMatchTile = this.#elemTiles.indexOf(tileBubbling);

        const tileFalling = this.#tryGetFallingTile(idxMatchTile);

        if (tileFalling) {
          this.#swapTiles(tileBubbling, tileFalling);
        } else {
          fixtureRaw.delete(tileBubbling);
        }
      });
    }
  }

  /**
   * @param {number} indexMatchedTile
   */
  #tryGetFallingTile(indexMatchedTile) {
    if (this.#walker.detectEdgeUp(indexMatchedTile)) {
      return null;
    }
    /** @type {GameTile} */
    const tile = this.#elemTiles.item(
      this.#walker.getIndexToUp(indexMatchedTile)
    );

    return tile.isHidden ? null : tile;
  }

  #handleUserBadSelection() {
    const id = setTimeout(() => {
      clearTimeout(id);
      this.#swapUserSelectedTiles();
      this.#picker.resetUserSelection();
    }, this.#badSwapTimeout);
  }

  /**
   * @param {ComboMatchInfo} matchInfo
   */
  #hideMatch(matchInfo) {
    matchInfo.domSortedTiles.forEach((tile) => tile.setHidden());
  }

  #swapUserSelectedTiles() {
    if (!this.#picker.firstTile || !this.#picker.secondTile) {
      throw new Error(
        "Developer error: tile swapping failed: at least one of the subjected tiles is not set."
      );
    }

    this.#swapTiles(this.#picker.firstTile, this.#picker.secondTile);
  }

  /**
   * Swap provided tiles in DOM.
   * @param {GameTile} tile1
   * @param {GameTile} tile2
   */
  #swapTiles(tile1, tile2) {
    const idxInitialTile1 = this.#elemTiles.indexOf(tile1);

    if (
      tile1.compareDocumentPosition(tile2) & Node.DOCUMENT_POSITION_PRECEDING // left | up ?
    ) {
      tile2.after(tile1);
      this.#elemTiles.item(idxInitialTile1).after(tile2);
    } else {
      tile2.before(tile1);
      this.#elemTiles.item(idxInitialTile1).before(tile2);
    }
  }

  #calculateMatchByUserSelection() {
    const matchInfo1 = this.#matcher.detectMatchXY(this.#picker.firstTile);
    const matchInfo2 = this.#matcher.detectMatchXY(this.#picker.secondTile);

    return matchInfo1 || matchInfo2
      ? new ComboMatchInfo(matchInfo1, matchInfo2)
      : null;
  }
}
