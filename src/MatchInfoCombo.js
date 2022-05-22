import { MatchInfoBase } from "./MatchInfoBase.js";

export class MatchInfoCombo extends MatchInfoBase {
  /** @type {number} */
  #allMatchesCount;

  /** @type {MatchInfo[]} collection Collection of single match info instances. */
  collection;

  /**
   * @param {HTMLCollection & {Array<HTMLCollection>.indexOf(searchElement: HTMLCollection, fromIndex?: number): number}} elemTiles
   * @param {MatchInfo[]} args
   */
  constructor(elemTiles, ...args) {
    super(elemTiles);
    // To ensure non-null matches and also protects from outside changes
    this.collection = args.filter((m) => m);
  }

  get allMatchesCount() {
    return (this.#allMatchesCount ??= this.#calculateTotalMatchesCount());
  }

  *_allCombiner() {
    for (const match of this.collection) {
      yield* match._allCombiner();
    }
  }

  #calculateTotalMatchesCount() {
    return this.collection.reduce((acc, cur) => {
      acc += cur.arrX.length >= 3 ? 1 : 0;
      acc += cur.arrY.length >= 3 ? 1 : 0;

      return acc;
    }, 0);
  }
}
