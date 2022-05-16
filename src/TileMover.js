import { extendFromArrayIndexOf } from "./utilities.js";

export class TileMover {
  #rows;
  #cols;
  #elemTiles;
  #walker;

  /**
   * @param {number} rows
   * @param {number} cols
   * @param {HTMLCollection & {Array<HTMLCollection>.indexOf(searchElement: HTMLCollection, fromIndex?: number): number}} tileElements
   * @param {BoardWalker} walker
   */
  constructor(rows, cols, tileElements, walker) {
    this.#rows = rows;
    this.#cols = cols;
    this.#elemTiles = tileElements;
    this.#walker = walker;
    extendFromArrayIndexOf(tileElements);
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
   * @param {ComboMatchInfo} matchFixture
   * @returns {GameTile[]}
   */
  bubbleMatchToTopEdge(matchFixture) {
    // TODO: this is on possibility to drive how bubbling takes place
    // TODO: and feed the animation.

    // TODO: Try hook-in stack snapshot **before** it's shape change here!
    // Proposition: try to get the shape of the bottom of stack at least.
    // OR: if there is situation of duplicates in collapsedTiles, is it solid indication?

    // Copy, because bubbling track will be tracked by removing tiles,
    // that are reached it's destination.
    const fixtureRaw = new Set(matchFixture.allDomSorted);

    const collapsedTiles = new Set();

    while (fixtureRaw.size) {
      fixtureRaw.forEach((tileBubbling) => {
        const idxMatchTile = this.#elemTiles.indexOf(tileBubbling);

        const tileFalling = this.#tryGetFallingTile(idxMatchTile);

        if (tileFalling) {
          collapsedTiles.add(tileFalling);
          this.swapTiles(tileBubbling, tileFalling);
        } else {
          fixtureRaw.delete(tileBubbling);
        }
      });
    }

    return collapsedTiles;
  }

  /**
   * @param {number} indexMatchedTile
   * @returns {GameTile}
   */
  #tryGetFallingTile(indexMatchedTile) {
    if (this.#walker.detectEdgeUp(indexMatchedTile)) {
      return null;
    }
    /** @type {GameTile} */
    const tile = this.#elemTiles.item(
      this.#walker.getIndexToUp(indexMatchedTile)
    );

    return tile.isMatched ? null : tile;
  }
}
