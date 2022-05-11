import { GameTile } from "./game-tile.js";
import { rangeGenerator } from "./utilities.js";

export class GameArena {
  /** @typ string */
  #canvasId;
  /** @type number */
  #rows;
  /** @type number */
  #cols;

  /** @type number */
  #timerId;
  /** @type number */
  #timerInterval;

  /** @type HTMLElement */
  #elemCanvas;

  /** @type GameTile[] */
  #elemCells;
  /** @type GameTile */
  #elemFirstTile;
  /** @type GameTile */
  #elemSecondTile;

  #tileTypeToClassMap;

  constructor({
    canvasId = "canvasId",
    rows = 7,
    cols = 7,
    timerInterval = 200,
  }) {
    this.#canvasId = canvasId;
    this.#timerInterval = timerInterval;

    this.#rows = rows;
    this.#cols = cols;
    this.#timerId = null;

    this.#tileTypeToClassMap = new Map([
      [1, "type-1"],
      [2, "type-2"],
      [3, "type-3"],
      [4, "type-4"],
      [5, "type-5"],
      [6, "type-6"],
      [7, "type-7"],
    ]);

    this.#initDOM();
    this.#resetCanvas();
    this.#resetCanvasLayout();
  }

  #initDOM() {
    this.#elemCanvas = document.getElementById("game-canvas");
  }

  #resetCanvas() {
    this.#resetCanvasLayout();
    this.#elemCells = this.#createBoard();
    this.#elemCanvas.replaceChildren(...this.#elemCells);
  }

  #resetCanvasLayout() {
    const { gridTemplateColumns } = window.getComputedStyle(this.#elemCanvas);
    const extractedColWidth = /\d+px/i.exec(gridTemplateColumns)[0];
    const newValue = `repeat(${this.#cols}, ${extractedColWidth})`;

    this.#elemCanvas.style.gridTemplateColumns = newValue;
  }

  #createBoard() {
    const resultCells = [];

    // const resultCells = [];
    // resultCells.push(this.#createTile(this.#getRandomTileKey(), 1));
    // let toAvoid = undefined;
    for (const k of rangeGenerator(this.#rows * this.#cols, 1)) {
      // let randomTileKey = this.#getRandomTileKey();

      // const prevTileType = resultCells[k - 1].dataset.tileType;

      // if (randomTileKey == prevTileType) {
      //   toAvoid = randomTileKey;

      //   do {
      //     randomTileKey = this.#getRandomTileKey();
      //   } while (toAvoid === randomTileKey);
      //   toAvoid = undefined;
      // }
      resultCells.push(this.#createTile(this.#getRandomTileKey(), k));
    }

    return resultCells;
  }

  #getRandomTileKey() {
    return Math.ceil(Math.random() * this.#tileTypeToClassMap.size);
  }

  #createTile(tileKey, id) {
    const type = this.#tileTypeToClassMap.get(tileKey);

    const cell = new GameTile({ type, worth: 1, leverage: 1.25 });
    cell.id = id;
    cell.dataset.tileType = tileKey;
    cell.onclick = this.#tileClickHandler.bind(this);

    return cell;
  }

  /**
   * @param  {Event & {target: GameTile}} {clickedTile}
   */
  #tileClickHandler({ target: clickedTile }) {
    // To guarantee, that only two, consequent tile can be clicked.
    // If not consequent then set update states, and "release" the second attempted tile.
    if (!this.#elemFirstTile) {
      this.#elemFirstTile = clickedTile;
      this.#elemFirstTile.setPicked();
    } else if (
      !this.#elemSecondTile &&
      this.#targetIsOnSide(this.#elemFirstTile, clickedTile)
    ) {
      this.#elemSecondTile = clickedTile;
      this.#elemSecondTile.setTarget();
    } else if (
      this.#elemFirstTile &&
      !this.#targetIsOnSide(this.#elemFirstTile, clickedTile)
    ) {
      this.#elemFirstTile.unSetPicked();
      this.#elemSecondTile?.unSetTarget();
      this.#elemFirstTile = clickedTile;
      this.#elemFirstTile.setPicked();
      this.#elemSecondTile = null;
    }
  }

  /**
   * @param  {GameTile} picked
   * @param  {GameTile} target
   */
  #targetIsOnSide({ id: pId }, { id: tId }) {
    switch (Math.abs(pId - tId)) {
      case 1:
      case this.#cols:
        return true;
      default:
        return false;
    }
  }
}
