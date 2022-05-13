export class MatchInfo {
  arrX;
  arrY;
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
   * @type {Set<GameTile>}
   */
  get all() {
    return (this.#all ??= this.#toSet());
  }

  #toSet() {
    return new Set([...(this.arrX ?? []), ...(this.arrY ?? [])]);
  }
}
