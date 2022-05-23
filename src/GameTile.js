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
  #elemImg;

  static #tileClassMap = new Map([
    [1, "tile-jon"],
    [2, "tile-tere"],
    [3, "tile-brenda"],
    [4, "tile-adrian"],
    [5, "tile-yeray"],
    [6, "tile-lauri"],
    [7, "tile-lara"],
  ]);

  static get typeCount() {
    return GameTile.#tileClassMap.size;
  }

  static get cviSphereConf() {
    return {
      size: 80,
      shine: 55,
      color: "0000ff",
      color2: "00ffff",
      shade: 100,
    };
  }

  /**
   * @param {Config}
   */
  constructor({ id, type, worth, leverage }) {
    super();

    this.id = `t_${id}`;
    this.#type = type;
    this.#worth = worth;
    this.#leverage = leverage;
    this.dataset.tileType = type;

    this.#createImage();
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
    this.classList.add("collapsed");
    return this;
  }

  unSetCollapsed() {
    this.classList.remove("collapsed");
    return this;
  }

  connectedCallback() {
    this.classList.add("tile", GameTile.#tileClassMap.get(this.#type));

    // eslint-disable-next-line no-undef, camelcase
    cvi_sphere.add(this.#elemImg, GameTile.cviSphereConf);
  }

  #createImage() {
    const img = document.createElement("img");
    this.#elemImg = img;

    img.id = `t_img_${this.id}`;

    img.className = "tile-face";
    img.src = `assets/tiles/${GameTile.#tileClassMap.get(this.#type)}.png`;

    this.append(img);
  }
}

customElements.define("game-tile", GameTile, { extends: "div" });
