import { GameTile } from "./game-tile.js";
import { rangeGenerator } from "./utilities.js";

export class GameArena {
  #canvasId;
  #rows;
  #cols;

  #timerId;
  #timerInterval;

  #elemCanvas;
  #elemCells;

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
    this.#elemCanvas = document.getElementById("view-game-arena--main");
  }

  #resetCanvas() {
    this.#resetCanvasLayout();
    this.#elemCells = this.#createBoard();
    this.#elemCanvas.replaceChildren(...this.#elemCells);
  }

  #resetCanvasLayout() {
    this.#elemCanvas.style.gridTemplateColumns = `repeat(${this.#cols}, 40px)`;
  }

  #createBoard() {
    let toAvoid = undefined;

    const resultCells = [];

    // resultCells.push(this.#createTile(this.#getRandomTileKey(), 1));

    [...rangeGenerator(this.#rows * this.#cols, 1)].forEach((k) => {
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
    });

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

    return cell;
  }
}
