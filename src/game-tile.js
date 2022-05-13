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
    return this.className === "picked";
  }

  get isTarget() {
    return this.className === "target";
  }

  get isHidden() {
    return this.className === "hidden";
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

  setHidden() {
    this.classList.add("hidden");
    return this;
  }

  unSetHidden() {
    this.classList.remove("hidden");
    return this;
  }

  connectedCallback() {
    this.classList.add(GameTile.#tileClassMap.get(this.#type));
  }
}

customElements.define("game-tile", GameTile, { extends: "div" });
