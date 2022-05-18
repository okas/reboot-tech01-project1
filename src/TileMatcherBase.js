export class TileMatcherBase {
  #elemTiles;
  #walker;

  /** @type {Map<string, [Function, Function]>} */
  seekHelperMap;

  static #directions;

  /**
   * @param {BoardWalker} walker
   */
  constructor(walker) {
    this.#walker = walker;

    this.#setupMatchDirectionalActions();
  }

  static {
    TileMatcherBase.#directions = ["left", "up", "right", "down"];
  }

  static get directions() {
    return TileMatcherBase.#directions;
  }

  #setupMatchDirectionalActions() {
    this.seekHelperMap = new Map([
      [
        "left",
        [
          this.#walker.detectEdgeLeft.bind(this.#walker),
          this.#walker.getIndexToLeft.bind(this.#walker),
        ],
      ],
      [
        "up",
        [
          this.#walker.detectEdgeUp.bind(this.#walker),
          this.#walker.getIndexToUp.bind(this.#walker),
        ],
      ],
      [
        "right",
        [
          this.#walker.detectEdgeRight.bind(this.#walker),
          this.#walker.getIndexToRight.bind(this.#walker),
        ],
      ],
      [
        "down",
        [
          this.#walker.detectEdgeDown.bind(this.#walker),
          this.#walker.getIndexToDown.bind(this.#walker),
        ],
      ],
    ]);
  }
}
