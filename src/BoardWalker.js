export class BoardWalker {
  /** @type {number} */
  #rows;
  /** @type {number} */
  #cols;

  constructor(rows, cols) {
    this.#rows = rows;
    this.#cols = cols;
  }

  getIndexToLeft(indexReference) {
    return --indexReference;
  }

  getIndexToUp(indexReference) {
    return indexReference - this.#rows;
  }

  getIndexToRight(indexReference) {
    return ++indexReference;
  }

  getIndexToDown(indexReference) {
    return indexReference + this.#rows;
  }

  detectEdgeLeft(seekIndex) {
    return !((seekIndex / this.#cols) % 1);
  }

  detectEdgeUp(seekIndex) {
    return seekIndex < this.#cols;
  }

  detectEdgeRight(seekIndex) {
    return !(((seekIndex + 1) / this.#cols) % 1);
  }

  detectEdgeDown(seekIndex) {
    return seekIndex >= this.#rows * this.#cols - this.#rows;
  }
}
