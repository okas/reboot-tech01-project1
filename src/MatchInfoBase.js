export class MatchInfoBase {
  /** @type {Set<GameTile>} */
  #all;

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

  /**
   * Ordered by DOM position!
   * Ordering feels intuitive for usage predictability,
   * but is essential for matched tile bubbling control.
   */
  get allDomSorted() {
    this.#all ??= new Set([...this._allCombiner()]);

    return [...this.#all].sort(MatchInfoBase.domSortAsc);
  }
}
