import { GameTile } from "./game-tile.js";
import { TilePicker } from "./tile-picker.js";
import { BoardWalker } from "./board-walker.js";
import { MatchMaker } from "./match-maker.js";
import { TileMover } from "./tile-mover.js";
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
    this.#matcher = new MatchMaker(
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
    } else {
      this.#handleUserBadSelection();
    }
  }

  #calculateMatchByUserSelection() {
    const matchInfo1 = this.#matcher.detectMatchXY(this.#picker.firstTile);
    const matchInfo2 = this.#matcher.detectMatchXY(this.#picker.secondTile);

    return matchInfo1 || matchInfo2
      ? new ComboMatchInfo(matchInfo1, matchInfo2)
      : null;
  }

  /**
   * @param {ComboMatchInfo} matchInfo
   */
  #handleUserSuccessSelection(matchInfo) {
    this.#picker.resetUserSelection();
    this.#hideMatch(matchInfo);
    this.#mover.bubbleMatchToTopEdge(matchInfo);
  }

  /**
   * @param {ComboMatchInfo} matchInfo
   */
  #hideMatch(matchInfo) {
    matchInfo.domSortedTiles.forEach((tile) => tile.setHidden());
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
