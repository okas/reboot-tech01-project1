export class GameTile extends HTMLDivElement {
  #type;
  #worth;
  #leverage;

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

  connectedCallback() {
    this.classList.add(this.#type);
  }
}

customElements.define("game-tile", GameTile, { extends: "div" });
