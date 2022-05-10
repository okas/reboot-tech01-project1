export class GameArena {
  #canvasId;
  #rows;
  #cols;

  #timerId;
  #timerInterval;

  #elemCanvas;
  #elemCells;

  constructor({ canvasId = "canvasId", timerInterval = 200 }) {
    this.#canvasId = canvasId;
    this.#timerInterval = timerInterval;

    this.#rows = 7;
    this.#cols = 7;
    this.#timerId = null;

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
    const totalCells = this.#rows * this.#cols;

    return [...Array(totalCells).keys()].map((k) => {
      const cell = document.createElement("div");
      cell.id = `${k}`;
      // Currently only for DOM debugging purposes
      const p1Index = k + 1;
      cell.dataset.row = Math.ceil(p1Index / this.#cols) || 1;
      cell.dataset.col = Math.ceil(p1Index / this.#rows) || 1;
      cell.textContent = p1Index;
      return cell;
    });
  }
}
