import { MatchInfoBase } from "./match-info-base.js";

export class ComboMatchInfo extends MatchInfoBase {
  /** @type {MatchInfo[]} */
  #combo;

  /** @type {Set<GameTile>} */
  #all;

  /**
   * @param {MatchInfo[]} args
   */
  constructor(...args) {
    super();
    // To ensure non-null matches and also protects from outside changes
    this.#combo = args.filter((m) => m);
  }

  *_allCombiner() {
    for (const match of this.#combo) {
      yield* match._allCombiner();
    }
  }
}
