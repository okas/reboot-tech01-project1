import { MatchInfoBase } from "./MatchInfoBase.js";

export class MatchInfoCombo extends MatchInfoBase {
  /** @type {MatchInfo[]} */
  #combo;

  /**
   * @param {HTMLCollection & {Array<HTMLCollection>.indexOf(searchElement: HTMLCollection, fromIndex?: number): number}} elemTiles
   * @param {MatchInfo[]} args
   */
  constructor(elemTiles, ...args) {
    super(elemTiles);
    // To ensure non-null matches and also protects from outside changes
    this.#combo = args.filter((m) => m);
  }

  *_allCombiner() {
    for (const match of this.#combo) {
      yield* match._allCombiner();
    }
  }
}
