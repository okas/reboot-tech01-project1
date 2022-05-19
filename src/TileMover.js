import { extendFromArrayIndexOf, sleep } from "./utilities.js";

export class TileMover {
  #rows;
  #cols;
  #elemTiles;
  #walker;
  #timerInterval;

  /**
   * @param {number} rows
   * @param {number} cols
   * @param {HTMLCollection & {Array<HTMLCollection>.indexOf(searchElement: HTMLCollection, fromIndex?: number): number}} tileElements
   * @param {BoardWalker} walker
   * @param {number} timerInterval
   */
  constructor(rows, cols, tileElements, walker, timerInterval) {
    this.#rows = rows;
    this.#cols = cols;
    this.#elemTiles = tileElements;
    this.#walker = walker;
    this.#timerInterval = timerInterval;

    extendFromArrayIndexOf(tileElements);
  }

  get #actionDelay() {
    return this.#timerInterval;
  }

  /**
   * Swap provided tiles in DOM.
   * @param {GameTile} tile1
   * @param {GameTile} tile2
   */
  swapTiles(tile1, tile2) {
    const idxInitialTile1 = this.#elemTiles.indexOf(tile1);

    if (
      tile1.compareDocumentPosition(tile2) & Node.DOCUMENT_POSITION_PRECEDING // left | up ?
    ) {
      tile2.after(tile1);
      this.#elemTiles.item(idxInitialTile1).after(tile2);
    } else {
      tile2.before(tile1);
      this.#elemTiles.item(idxInitialTile1).before(tile2);
    }
  }

  /**
   * @param {MatchInfoCombo} matchFixture
   * @returns {Promise<GameTile[]>}
   */
  async bubbleMatchToTopEdge(matchFixture) {
    // Copy "raw" match material, to provide isolation, because all "lighter" tiles
    // that are already bubbled up will be removed from set, hence the isolation is needed.
    const fixtureRaw = new Set(matchFixture.allDomSorted);

    const collapsedTiles = new Set();

    while (fixtureRaw.size) {
      for (const tileBubbling of fixtureRaw) {
        const idxMatchTile = this.#elemTiles.indexOf(tileBubbling);

        const tileFalling = this.#tryGetFallingTile(idxMatchTile);

        if (tileFalling) {
          collapsedTiles.add(tileFalling);
          this.swapTiles(tileBubbling, tileFalling);
        } else {
          fixtureRaw.delete(tileBubbling);
        }
      }

      await sleep(this.#actionDelay / 10);
    }

    return [...collapsedTiles];
  }

  /**
   * @param {number} indexMatchedTile
   * @returns {GameTile|null}
   */
  #tryGetFallingTile(indexMatchedTile) {
    if (this.#walker.detectEdgeUp(indexMatchedTile)) {
      return null;
    }
    /** @type {GameTile} */
    const tile = this.#elemTiles.item(
      this.#walker.getIndexToUp(indexMatchedTile)
    );

    // No point to drag "bubble", that has meet another "bubble",
    // through the layer of bubbles.
    return tile.isMatched ? null : tile;
  }
}
