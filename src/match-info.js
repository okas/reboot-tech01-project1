import { MatchInfoBase } from "./match-info-base.js";

export class MatchInfo extends MatchInfoBase {
  arrX;
  arrY;

  /** @type {Set<GameTile>} */
  #all;

  /**
   * @param {GameTile[]|null} arrX
   * @param {GameTile[]|null} arrY
   */
  constructor(arrX, arrY) {
    super();
    // To protect form outside changes.
    this.arrX = [...(arrX ?? [])];
    this.arrY = [...(arrY ?? [])];
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
