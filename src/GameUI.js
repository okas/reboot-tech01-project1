import { rangeGenerator, sleep } from "./utilities.js";
import { GameTile } from "./GameTile.js";

export class GameUI {
  /** @type {number} */
  #tileCounter;

  /** @type {HTMLElement} */
  #elemCanvas;

  static #cssValRegEx;

  /**
   * @param {string} canvasId HTML element ID, where game will be "mounted".
   */
  constructor(canvasId) {
    this.#elemCanvas = document.getElementById(canvasId);
  }

  /**
   * @param {number} rows Rows count.
   * @param {number} cols Column count.
   * @param {Function} clickHandlerFn Click handler function for created tiles.
   */
  createBoard(rows, cols, clickHandlerFn) {
    this.#tileCounter = 0;

    this.#resetCanvasLayout(rows, cols);

    this.#elemCanvas.replaceChildren(
      ...this.tileFactory(rows * cols, clickHandlerFn)
    );

    return this.#elemCanvas.children;
  }

  enableCanvas() {
    this.#elemCanvas.style.pointerEvents = "auto";
  }

  disableCanvas() {
    this.#elemCanvas.style.pointerEvents = "none";
  }

  /**
   * Hides tile from board (visually) and clears it's click event handler.
   * @param {GameTile} tile
   * @param {number} speed Speed of action interval for visual effect.
   */
  async sanitizeTile(tile, speed) {
    tile.setMatched().onclick = null;
    await sleep(speed);
  }

  /**
   * @param {number} amount
   * @param {Function} handlerFn
   */
  *tileFactory(amount, handlerFn) {
    for (const k of rangeGenerator(
      this.#tileCounter + amount,
      ++this.#tileCounter
    )) {
      this.#tileCounter = k;
      yield this.#createTile(this.#getRandomTileKey(), k, handlerFn);
    }
  }

  #getRandomTileKey() {
    return Math.ceil(Math.random() * GameTile.typeCount);
  }

  /**
   * @param  {number} tileKey
   * @param  {number} id
   * @param  {Function} handlerFn
   */
  #createTile(tileKey, id, handlerFn) {
    const tile = new GameTile({
      id: id - 1,
      type: tileKey,
      worth: 1,
      leverage: 1.25,
    });
    tile.onclick = handlerFn;

    return tile;
  }

  static {
    this.#cssValRegEx = /\d+.?\d*px/i;
  }

  /**
   * @param {number} quantifierVal
   * @param {string} searchVal
   */
  static #createNewGridPropVal(quantifierVal, searchVal) {
    return `repeat(${quantifierVal}, ${
      GameUI.#cssValRegEx.exec(searchVal)[0]
    })`;
  }

  /**
   * @param {number} cols Column count.
   */
  #resetCanvasLayout(rows, cols) {
    const { gridTemplateRows, gridTemplateColumns } = window.getComputedStyle(
      this.#elemCanvas
    );

    this.#elemCanvas.style.gridTemplateRows = GameUI.#createNewGridPropVal(
      rows,
      gridTemplateRows
    );

    this.#elemCanvas.style.gridTemplateColumns = GameUI.#createNewGridPropVal(
      cols,
      gridTemplateColumns
    );
  }
}
