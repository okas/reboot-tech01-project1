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
    // To protect form outside changes.
    this.arrX = [...(arrX ?? [])];
    this.arrY = [...(arrY ?? [])];
  }

  /**
   * Ordered by DOM position!
   * Ordering feels intuitive for usage predictability,
   * but is essential for matched tile bubbling control.
   */
  get allDomSorted() {
    this.#all ??= new Set([...this._allCombiner()]);

    return [...this.#all].sort(MatchInfoBase.domSortAsc);
  }

  *_allCombiner() {
    for (const tile of this.arrX) {
      yield tile;
    }
    for (const tile of this.arrY) {
      yield tile;
    }
  }
}
