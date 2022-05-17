export class MatchInfoBase {
  #elemTiles;

  /** @type {GameTile[]} */
  #all;

  /**
   *
   * @param {HTMLCollection & {Array<HTMLCollection>.indexOf(searchElement: HTMLCollection, fromIndex?: number): number}} elemTiles
   */
  constructor(elemTiles) {
    this.#elemTiles = elemTiles;
  }

  /**
   * Used HTML DOM Node api to compare
   * @param {Node} a The Node to evaluate against other node.
   * @param {Node} b A Reference node in relation other node is compared to.
   * @returns 1: `Node a` precedes `Node b`; -1 otherwise.
   * @see {@link [Node.compareDocumentPosition](https://developer.mozilla.org/en-US/docs/Web/API/Node/compareDocumentPosition)}
   */
  static domSortAsc(a, b) {
    return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING
      ? 1
      : -1;
  }

  get all() {
    return (this.#all ??= [...new Set(this._allCombiner())]);
  }

  /**
   * Ordered by DOM position!
   * Ordering feels intuitive for usage predictability,
   * but is essential for matched tile bubbling control.
   */
  get allDomSorted() {
    return [...this.all].sort(MatchInfoBase.domSortAsc);
  }

  *takeSnapShot() {
    const currentSorted = this.allDomSorted;
    for (let i = 1; i < this.all.size; i++) {
      yield this.#elemTiles.indexOf(currentSorted[i]) -
        this.#elemTiles.indexOf(currentSorted[i - 1]);
    }
  }

  /**
   * @param {number[]} snap1
   * @param {number[]} snap2
   * @returns `true`, if snapshot are with same length, and diff values are equal in the order of array's.
   */
  static compareSnapshots(snap1, snap2) {
    if (snap1?.length !== snap2?.length) {
      return false;
    }

    return snap1.every((diff, i) => diff === snap2[i]);
  }
}
