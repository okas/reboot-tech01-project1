import { MatchInfoBase } from "./match-info-base.js";

export class MatchInfo {
  arrX;
  arrY;

  /** @type {Set<GameTile>} */
  #all;

  /**
   * @param {GameTile[]|null} arrX
   * @param {GameTile[]|null} arrY
   */
  constructor(arrX, arrY) {
    this.arrX = arrX;
    this.arrY = arrY;
  }

  /**
   * Ordered by DOM position!
   * Ordering feels intuitive for usage predictability,
   * but is essential for matched tile bubbling control.
   */
  get allDomSorted() {
    return (this.#all ??= this.#allToSortedSet());
  }

  /**
   * @returns {Set<GameTile>}
   */
  #allToSortedSet() {
    /** @type {Node[]} */
    const all = [...this._allCombiner()];

    all.sort(MatchInfoBase.domSortAsc);

    return new Set(all);
  }

  *_allCombiner() {
    for (const tile of this.arrX ?? []) {
      yield tile;
    }
    for (const tile of this.arrY ?? []) {
      yield tile;
    }
  }
}
