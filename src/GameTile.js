/**
 * @typedef {Object} Config
 * @property {number} type
 * @property {number} worth
 * @property {number} leverage
 */

export class GameTile extends HTMLDivElement {
  #type;
  #worth;
  #leverage;

  static #tileClassMap = new Map([
    [1, "type-1"],
    [2, "type-2"],
    [3, "type-3"],
    [4, "type-4"],
    [5, "type-5"],
    [6, "type-6"],
    [7, "type-7"],
  ]);

  static get typeCount() {
    return GameTile.#tileClassMap.size;
  }

  /**
   * @param {Config}
   */
  constructor({ id, type, worth, leverage }) {
    super();

    this.id = id;
    this.#type = type;
    this.#worth = worth;
    this.#leverage = leverage;
    this.dataset.tileType = type;
  }

  get type() {
    return this.#type;
  }

  get worth() {
    return this.#worth;
  }

  get leverage() {
    return this.#leverage;
  }

  get isPicked() {
    return this.classList.contains("picked");
  }

  get isTarget() {
    return this.classList.contains("target");
  }

  get isMatched() {
    return this.classList.contains("hidden");
  }

  get isCollapsed() {
    return this.classList.contains("collapsed");
  }

  setPicked() {
    this.classList.add("picked");
    return this;
  }

  unSetPicked() {
    this.classList.remove("picked");
    return this;
  }

  setTarget() {
    this.classList.add("target");
    return this;
  }

  unSetTarget() {
    this.classList.remove("target");
    return this;
  }

  setMatched() {
    this.classList.add("hidden");
    return this;
  }

  unSetMatched() {
    this.classList.remove("hidden");
    return this;
  }

  setCollapsed() {
    this.classList.add("hidden");
    return this;
  }

  unSetCollapsed() {
    this.classList.remove("collapsed");
    return this;
  }

  connectedCallback() {
    this.classList.add(GameTile.#tileClassMap.get(this.#type));
  }
}

customElements.define("game-tile", GameTile, { extends: "div" });
