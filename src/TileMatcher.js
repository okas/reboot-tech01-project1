import { TileMatcherBase } from "./TileMatcherBase.js";
import { extendFromArrayIndexOf } from "./utilities.js";
import { MatchInfo } from "./MatchInfo.js";

export class TileMatcher extends TileMatcherBase {
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
    super(walker);
    this.#rows = rows;
    this.#cols = cols;
    this.#elemTiles = tileElements;
    this.#walker = walker;

    extendFromArrayIndexOf(tileElements);
  }

  /**
   * Conducts analysis by X and Y axes around provided tile.
   * @param {GameTile} tileToAnalyze
   * @returns {MatchInfo} Analyzed tile is included in every or either axe.
   */
  tryCaptureMatch(tileToAnalyze) {
    const raw = this.#obtainDirectionalMatchInfo(tileToAnalyze);

    const matchX = [...(raw.left ?? []), tileToAnalyze, ...(raw.right ?? [])];

    const matchY = [...(raw.up ?? []), tileToAnalyze, ...(raw.down ?? [])];

    return matchX?.length >= 3 || matchY?.length >= 3
      ? new MatchInfo(this.#elemTiles, matchX, matchY)
      : null;
  }

  #obtainDirectionalMatchInfo(tileToAnalyze) {
    const pickedTileType = tileToAnalyze.type;
    const idxSeek = this.#elemTiles.indexOf(tileToAnalyze);

    return TileMatcherBase.directions.reduce((acc, dir) => {
      acc[dir] = [...this.#seekInDirection(dir, pickedTileType, idxSeek)];
      return acc;
    }, {});
  }

  /**
   * @param {string} direction `left` | `up` |`right` |`down`
   * @param {number} pickedTileType
   * @param {number} seekIndex
   */
  *#seekInDirection(direction, pickedTileType, seekIndex) {
    const [edgeDetectOnDirectionFn, indexToDirectionFn] =
      this.seekHelperMap.get(direction);

    // Detect edge on given direction, proceed, if not on the edge yet.
    while (!edgeDetectOnDirectionFn(seekIndex)) {
      // Move seek index to given direction.
      seekIndex = indexToDirectionFn(seekIndex);

      /** @type {GameTile} */
      const testTile = this.#elemTiles[seekIndex];

      // Validate gainst match conditions.
      if (this.#isInMatch(testTile, pickedTileType)) {
        yield testTile;
      } else {
        return;
      }
    }
  }

  /**
   * Validates whether seeked element can be included in match.
   * @param {GameTile} testTile
   * @param {number} pickedTileType
   */
  #isInMatch({ isMatched, type }, pickedTileType) {
    return !isMatched && type === pickedTileType;
  }
}
