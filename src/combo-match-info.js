import { MatchInfoBase } from "./match-info-base.js";

export class ComboMatchInfo {
  /** @type {MatchInfo[]} */
  #combo;

  /** @type {Set<GameTile>} */
  #all;

  /**
   * @param {MatchInfo[]} args
   */
  constructor(...args) {
    // To ensure non-null matches and also protects from outside changes
    this.#combo = args.filter((m) => m);
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

  *_allCombiner() {
    for (const match of this.#combo) {
      yield* match._allCombiner();
    }
  }
}
