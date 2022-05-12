import { GameTile } from "./game-tile.js";
import { rangeGenerator } from "./utilities.js";

export class GameArena {
  /** @typ string */
  #canvasId;
  /** @type number */
  #rows;
  /** @type number */
  #cols;

  /** @type number */
  #timerId;
  /** @type number */
  #timerInterval;

  /** @type HTMLElement */
  #elemCanvas;

  /** @type HTMLCollection */
  #elemTiles;
  /** @type GameTile */
  #elemPickedTile;
  /** @type GameTile */
  #elemTargetTile;

  #tileTypeToClassMap;

  constructor({
    canvasId = "canvasId",
    rows = 7,
    cols = 7,
    timerInterval = 200,
  }) {
    this.#canvasId = canvasId;
    this.#timerInterval = timerInterval;

    this.#rows = rows;
    this.#cols = cols;
    this.#timerId = null;

    this.#tileTypeToClassMap = new Map([
      [1, "type-1"],
      [2, "type-2"],
      [3, "type-3"],
      [4, "type-4"],
      [5, "type-5"],
      [6, "type-6"],
      [7, "type-7"],
    ]);

    this.#initDOM();
    this.#resetCanvas();
    this.#resetCanvasLayout();
  }

  #initDOM() {
    this.#elemCanvas = document.getElementById("game-canvas");
  }

  #resetCanvas() {
    this.#resetCanvasLayout();
    this.#elemCanvas.replaceChildren(...this.#createBoard());
    this.#elemTiles = this.#elemCanvas.children;
    this.#elemTiles.indexOf = Array.prototype.indexOf;
  }

  #resetCanvasLayout() {
    const { gridTemplateColumns } = window.getComputedStyle(this.#elemCanvas);
    const extractedColWidth = /\d+px/i.exec(gridTemplateColumns)[0];
    const newValue = `repeat(${this.#cols}, ${extractedColWidth})`;

    this.#elemCanvas.style.gridTemplateColumns = newValue;
  }

  #createBoard() {
    const resultCells = [];

    // const resultCells = [];
    // resultCells.push(this.#createTile(this.#getRandomTileKey(), 1));
    // let toAvoid = undefined;
    for (const k of rangeGenerator(this.#rows * this.#cols, 1)) {
      // let randomTileKey = this.#getRandomTileKey();

      // const prevTileType = resultCells[k - 1].dataset.tileType;

      // if (randomTileKey == prevTileType) {
      //   toAvoid = randomTileKey;

      //   do {
      //     randomTileKey = this.#getRandomTileKey();
      //   } while (toAvoid === randomTileKey);
      //   toAvoid = undefined;
      // }
      resultCells.push(this.#createTile(this.#getRandomTileKey(), k));
    }

    return resultCells;
  }

  #getRandomTileKey() {
    return Math.ceil(Math.random() * this.#tileTypeToClassMap.size);
  }

  #createTile(tileKey, id) {
    const type = this.#tileTypeToClassMap.get(tileKey);

    const cell = new GameTile({ type, worth: 1, leverage: 1.25 });
    cell.id = id;
    cell.dataset.tileType = tileKey;
    cell.onclick = this.#tileClickHandler.bind(this);

    return cell;
  }

  /**
   * @param  {Event & {target: GameTile}} {clickedTile}
   */
  #tileClickHandler({ target: clickedTile }) {
    const startMatchSeeking = this.#manageAndValidateSelection(clickedTile);
    console.log(startMatchSeeking);

    if (startMatchSeeking) {
      const fullMatch = this.#detectMatchXY();

      console.log(fullMatch);
    }
  }

  /**
   * Performs tile swapping in DOM. Uses fields `#elemPickedTile` and
   * `#elemTargetTile` to determine swap positions.
   * @param  {string} direction `left` | `up` | `right` | `down`
   */
  #swapSelectedTiles(direction) {
    // TODO, set up timer, to swap back, if no mach found.

    const idxPicked = this.#elemTiles.indexOf(this.#elemPickedTile);
    const idxTarget = this.#elemTiles.indexOf(this.#elemTargetTile);

    if (!idxPicked || !idxTarget) {
      throw new Error(
        "Tile swapping failed: at least one of the subjected tiles is not selected."
      );
    }

    console.debug("before swapping: ", idxPicked, idxTarget);

    // Put picked tile to target tile's place; remove target tile...
    const orphan = this.#elemCanvas.replaceChild(
      this.#elemPickedTile,
      this.#elemTargetTile
    );
    // ...and put temporarily orphaned target tile to picked tiles place.
    this.#elemCanvas.insertBefore(orphan, this.#elemTiles.item(idxPicked));
  }

  #detectMatchXY() {
    const pickedTileType = this.#elemPickedTile.type;
    // TODO: WARN: need to pay attention to index selection, if tile-swap has been done already!
    const seekIndex = this.#elemTiles.indexOf(this.#elemTargetTile);

    const matchesOnAxes = [
      [
        ...this.#gatherSeekToLeft(pickedTileType, seekIndex),
        ...this.#gatherSeekToRight(pickedTileType, seekIndex),
      ],
      [
        ...this.#gatherSeekToUp(pickedTileType, seekIndex),
        ...this.#gatherSeekToDown(pickedTileType, seekIndex),
      ],
    ];

    // TODO: Pay attention to swapping operation order!
    // TODO: If it is done, then condition be different!
    const hasMatchOnX = matchesOnAxes[0].length >= 2;
    const hasMatchOnY = matchesOnAxes[1].length >= 2;

    return hasMatchOnX || hasMatchOnY
      ? { hasMatchOnX, hasMatchOnY, matchesOnAxes }
      : null;
  }

  *#gatherSeekToLeft(pickedTileType, seekIndex) {
    while (!this.#detectEdgeLeft(seekIndex)) {
      const testTile = this.#elemTiles[--seekIndex]; // step left!

      if (testTile.type !== pickedTileType) {
        return;
      }

      yield testTile;
    }
  }

  *#gatherSeekToUp(pickedTileType, seekIndex) {
    while (!this.#detectEdgeUp(seekIndex)) {
      const testTile = this.#elemTiles[(seekIndex -= this.#rows)]; // step up!

      if (testTile.type !== pickedTileType) {
        return;
      }

      yield testTile;
    }
  }

  *#gatherSeekToRight(pickedTileType, seekIndex) {
    while (!this.#detectEdgeRight(seekIndex)) {
      const testTile = this.#elemTiles[++seekIndex]; // step right!

      if (testTile.type !== pickedTileType) {
        return;
      }

      yield testTile;
    }
  }

  *#gatherSeekToDown(pickedTileType, seekIndex) {
    while (!this.#detectEdgeDown(seekIndex)) {
      const testTile = this.#elemTiles[(seekIndex += this.#rows)]; // step up!

      if (testTile.type !== pickedTileType) {
        return;
      }

      yield testTile;
    }
  }

  #detectEdgeLeft(seekIndex) {
    return !((seekIndex / this.#cols) % 1);
  }

  #detectEdgeUp(seekIndex) {
    return seekIndex < this.#cols;
  }

  #detectEdgeRight(seekIndex) {
    return !(((seekIndex + 1) / this.#cols) % 1);
  }

  #detectEdgeDown(seekIndex) {
    return seekIndex >= this.#rows * this.#cols - this.#rows;
  }

  /**
   * @param  {GameTile} clickedTile
   */
  #manageAndValidateSelection(clickedTile) {
    // To guarantee, that only two, consequent tile can be clicked.
    // If not consequent then set update states and "release" the second attempted tile.

    let x;

    if (
      this.#elemPickedTile &&
      !this.#elemTargetTile &&
      (x = this.#isSecondTileOnSide(clickedTile))
    ) {
      // Scenario of 2 consequent tiles: set the states and...
      this.#elemTargetTile = clickedTile;
      this.#elemTargetTile.setTarget();
      // ... start match evaluation

      return x;
    }

    if (!this.#elemPickedTile) {
      // First element will be picked
      this.#elemPickedTile = clickedTile;
      this.#elemPickedTile.setPicked();

      return undefined;
    }

    if (
      this.#elemPickedTile &&
      (this.#elemTargetTile || !(x = this.#isSecondTileOnSide(clickedTile)))
    ) {
      // Wrong 2nd tile clicked OR both already clicked: reset states and set new picked immediately.
      this.#elemPickedTile.unSetPicked();
      this.#elemTargetTile?.unSetTarget();
      this.#elemPickedTile = clickedTile;
      this.#elemPickedTile.setPicked();
      this.#elemTargetTile = null;

      return x;
    }

    return undefined;
  }

  /**
   * @param  {GameTile} target
   */
  #isSecondTileOnSide(target) {
    const x = this.#elemTiles.indexOf(target);
    const y = this.#elemTiles.indexOf(this.#elemPickedTile);

    switch (x - y) {
      case -1:
        return "left";
      case -this.#cols:
        return "up";
      case +this.#cols:
        return "down";
      case 1:
        return "right";
    }
  }
}
