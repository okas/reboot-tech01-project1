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
   * Ordering feels intuitive for usage predictability,
   * but is essential for matched tile bubbling control.
   * @type {Set<GameTile>}
   */
  get all() {
    return (this.#all ??= this.#toSortedSet());
  }

  /**
   * @returns {Set<GameTile>}
   */
  #toSortedSet() {
    /** @type Element[] */
    const all = [...(this.arrX ?? []), ...(this.arrY ?? [])];

    // Using DOM Node API here.
    all.sort((a, b) =>
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1
    );

    return new Set(all);
  }
}
