import { MatchInfo } from "./match-info.js";

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
    return (this.#all ??= this.#sortSetsByFirstNode());
  }

  #sortSetsByFirstNode() {
    /** @type {GameTile[]} */
    const temp = [...this.#test()].sort(MatchInfo.domSortAsc);

    return new Set(temp);
  }

  *#test() {
    for (const { arrX, arrY } of this.#combo) {
      for (const tile of arrX ?? []) {
        yield tile;
      }
      for (const tile of arrY ?? []) {
        yield tile;
      }
    }
  }
}
