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
    this.classList.add(this.#type);
  }
}

customElements.define("game-tile", GameTile, { extends: "div" });
