export class MatchInfo {
  arrX;
  arrY;
  #all;

  /**
   * @param  {GameTile[]|null} arrX
   * @param  {GameTile[]|null} arrY
   */
  constructor(arrX, arrY) {
    this.arrX = arrX;
    this.arrY = arrY;
  }

  /**
   * @type GameTile[]
   */
  get all() {
    return (this.#all ??= [...(this.arrX ?? []), ...(this.arrY ?? [])]);
  }
}
