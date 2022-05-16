import { MatchInfoBase } from "./MatchInfoBase.js";

export class MatchInfo extends MatchInfoBase {
  arrX;
  arrY;

  /**
   * @param {HTMLCollection & {Array<HTMLCollection>.indexOf(searchElement: HTMLCollection, fromIndex?: number): number}} elemTiles
   * @param {GameTile[]|null} arrX
   * @param {GameTile[]|null} arrY
   */
  constructor(elemTiles, arrX, arrY) {
    super(elemTiles);
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
