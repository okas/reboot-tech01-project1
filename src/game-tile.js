/**
 * @typedef {Object} Config
 * @property {string} type
 * @property {number} worth
 * @property {number} leverage
 */

export class GameTile extends HTMLDivElement {
  #type;
  #worth;
  #leverage;

  /**
   * @param {Config}
   */
  constructor({ type, worth, leverage }) {
    super();

    this.#type = type;
    this.#worth = worth;
    this.#leverage = leverage;
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

  setPicked() {
    this.classList.add("picked");
  }

  unSetPicked() {
    this.classList.remove("picked");
  }

  setTarget() {
    this.classList.add("target");
  }

  unSetTarget() {
    this.classList.remove("target");
  }

  connectedCallback() {
    this.classList.add(this.#type);
  }
}

customElements.define("game-tile", GameTile, { extends: "div" });
