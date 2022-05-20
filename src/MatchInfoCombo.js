import { MatchInfoBase } from "./MatchInfoBase.js";

export class MatchInfoCombo extends MatchInfoBase {
  /** @type {MatchInfo[]} */
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

  *_allCombiner() {
    for (const match of this.collection) {
      yield* match._allCombiner();
    }
  }
}
