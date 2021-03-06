import { TileMatcherBase } from "./TileMatcherBase.js";
import { extendFromArrayIndexOf } from "./utilities.js";

export class TileMatcherChance extends TileMatcherBase {
  #rows;
  #cols;
  #elemTiles;
  #walker;
  #totalTileCount;

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
    this.totalTileCount = rows * cols;
    this.#elemTiles = tileElements;
    this.#walker = walker;

    extendFromArrayIndexOf(tileElements);
  }

  chances1Count() {
    let chcCountX = 0;
    let chcCountY = 0;

    for (let i = 0; i < this.totalTileCount; i++) {
      // Tile that is the start of potential seq.
      const { type } = this.#elemTiles[i];

      const sequenceX = [i, ...this.#seekChance1Sequence(i, "right", type)];

      if (sequenceX.length >= 2) {
        // we have found sequence
        const auxesL = [
          ...this.#seekChance1Auxes(sequenceX[0], "left", "right", type),
        ];

        const auxesR = [
          ...this.#seekChance1Auxes(
            sequenceX[sequenceX.length - 1],
            "right",
            "left",
            type
          ),
        ];

        if (auxesL.length) {
          // We have found some auxes => we have chances!
          chcCountX++;
          console.log(
            `---> found ${chcCountX}-th chcX, LF : `,
            auxesL.map((a) => [a, ...sequenceX])
          );

          console.log("/");
        }

        if (auxesR.length) {
          // We have found some auxes => we have chances!
          chcCountX++;

          console.log(
            `  -> found ${chcCountX}-th chcX, RT: `,
            auxesR.map((a) => [a, ...sequenceX])
          );

          console.log("/");
        }
      }
    }

    for (let i = 0; i < this.totalTileCount; i++) {
      // Tile that is the start of potential seq.
      const { type } = this.#elemTiles[i];

      const sequenceY = [i, ...this.#seekChance1Sequence(i, "down", type)];
      if (sequenceY.length >= 2) {
        // we have found sequence
        const auxesU = [
          ...this.#seekChance1Auxes(sequenceY[0], "up", "down", type),
        ];

        const auxesD = [
          ...this.#seekChance1Auxes(
            sequenceY[sequenceY.length - 1],
            "down",
            "up",
            type
          ),
        ];

        if (auxesU.length) {
          // We have found some auxes => we have chances!
          chcCountY++;
          console.log(
            `---> found ${chcCountY}-th chcY, UP : `,
            auxesU.map((a) => [a, ...sequenceY])
          );

          // console.log("/");
        }

        if (auxesD.length) {
          // We have found some auxes => we have chances!
          chcCountY++;

          console.log(
            `  -> found ${chcCountY}-th chcY, DW: `,
            auxesD.map((a) => [a, ...sequenceY])
          );
          // console.log("/");
        }
      }
    }

    return { countX: chcCountX, countY: chcCountY };
  }

  chances2Count() {
    // By start going to "left", capture tile
    // make 2 steps to given direction to detect sequence with hole

    let chcCountX = 0;
    let chcCountY = 0;

    for (let i = 0; i < this.totalTileCount; i++) {
      const { type } = this.#elemTiles[i];
      const fixture = [i, ...this.#seekChance2(i, "right", "left", type)];

      if (fixture.length >= 3) {
        chcCountX++;
        console.log(" --> TYPE2 fixture on X: ", fixture);
      }
    }

    for (let i = 0; i < this.totalTileCount; i++) {
      const { type } = this.#elemTiles[i];
      const fixture = [i, ...this.#seekChance2(i, "down", "up", type)];

      if (fixture.length >= 3) {
        chcCountY++;
        console.log(" --> TYPE2 fixture on Y: ", fixture);
      }
    }

    return { countX: chcCountX, countY: chcCountY };
  }

  *#seekChance1Sequence(seekIndex, direction, seekType) {
    const [edgeDetectOnDirectionFn, indexToDirectionFn] =
      this.seekHelperMap.get(direction);

    // Detect edge on given direction, proceed, if not on the edge yet.
    while (!edgeDetectOnDirectionFn(seekIndex)) {
      // Move seek index to given direction.
      seekIndex = indexToDirectionFn(seekIndex);
      // Validate sequence existence: every next tile against start tile.
      // Stop on first mismatch.
      if (this.#elemTiles[seekIndex].type === seekType) {
        yield seekIndex;
      } else {
        return;
      }
    }
  }

  *#seekChance1Auxes(seqEndIndex, direction, excludedDirection, seekType) {
    // Retrieve helpers to check sequence own element position.
    const [detectEdgeOfSeqEndFn, getIndexToDirectionFn] =
      this.seekHelperMap.get(direction);
    // If seq. element is on the edge already, then quit early.
    if (detectEdgeOfSeqEndFn(seqEndIndex)) {
      return;
    }
    // Seq. not on the edge -- advance on step towards overall analyze direction.
    // This will be the index we want to look around on some directions!
    const idxLookAround = getIndexToDirectionFn(seqEndIndex);
    // Get auxilliar pieces possible locations, excluding some.

    // Iterate all possible auxiliary element positions around the "lookAround element"

    yield* this.#seekAuxes(
      idxLookAround,
      seekType,
      (d) => d !== excludedDirection
    );
  }

  *#seekChance2(seqStartIndex, direction, excludedDirection, seekType) {
    // Retrieve helpers to check sequence own element position.
    const [detectEdgeOfSeqEndFn, getIndexToDirectionFn] =
      this.seekHelperMap.get(direction);
    // If seq. element is on the edge already, then quit early.
    if (detectEdgeOfSeqEndFn(seqStartIndex)) {
      return;
    }
    // Seq. not on the edge -- advance on step towards overall analyze direction.
    // This will be the index we want to look around on some directions!
    const idxHole = getIndexToDirectionFn(seqStartIndex);

    // If "hole" index is on the edge, then it won't provide a chance -- quit.
    if (detectEdgeOfSeqEndFn(idxHole)) {
      return;
    }

    // If "hole" is of same type, then this is normal seq,
    //  a work work of for different -- quit.
    if (this.#elemTiles[idxHole].type === seekType) {
      return;
    }

    // Get the index, of the sequence, the other end of the "hole"
    const indexSeqEndIndex = getIndexToDirectionFn(idxHole);

    if (this.#elemTiles[indexSeqEndIndex].type === seekType) {
      yield indexSeqEndIndex;
    } else {
      return;
    }

    yield* this.#seekAuxes(
      idxHole,
      seekType,
      (d) => d !== excludedDirection && d !== direction
    );
  }

  *#seekAuxes(idxLookAround, seekType, directionFilterPredicate) {
    // Get auxilliar pieces possible locations, excluding some.
    const seekDirections = TileMatcherBase.directions.filter(
      directionFilterPredicate
    );
    // Iterate all possible auxiliary element positions around the "lookaround element"
    for (const dir of seekDirections) {
      // Retrieve helpers for given direction to seek for.
      const [detectEdgeFn, getIndexToDirectionFn] = this.seekHelperMap.get(dir);

      // If on given direction, "lookaround" element is on the edge,
      // it is impossible to advance to this direction.
      if (!detectEdgeFn(idxLookAround)) {
        // If it is possible to advance toward given direction,
        // then analyze type to conclude chance, by comparing auxillary
        // elements type to sequence type.
        const idxAux = getIndexToDirectionFn(idxLookAround);

        // If direction is different than heading than it is auxilliar -- chance possibility.
        if (this.#elemTiles[idxAux].type === seekType) {
          yield idxAux;
        }
      }
    }
  }
}
