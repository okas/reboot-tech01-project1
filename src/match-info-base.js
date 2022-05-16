export class MatchInfoBase {
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
}
