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
    this.#combo = args.filter((m) => m);
  }

  get allDomSorted() {
    return (this.#all ??= this.#allToSortedSet());
  }

  #allToSortedSet() {
    /** @type {GameTile[]} */
    const all = [...this._allCombiner()];

    all.sort(MatchInfoBase.domSortAsc);

    return new Set(all);
  }

  *_allCombiner() {
    for (const match of this.#combo) {
      yield* match._allCombiner();
    }
  }
}
