import { GameTile } from "./game-tile.js";
import { rangeGenerator } from "./utilities.js";
import { MatchInfo } from "./match-info.js";

export class GameArena {
  /** @type {string} */
  #canvasId;
  /** @type {number} */
  #rows;
  /** @type {number} */
  #cols;

  /** @type {number} */
  #timerId;
  /** @type {number} */
  #timerInterval;

  /** @type {number} */
  #badSwapTimeout;

  /** @type {HTMLElement} */
  #elemCanvas;

  /** @type {HTMLCollection} */
  #elemTiles;
  /** @type {GameTile} */
  #elemPickedTile;
  /** @type {GameTile} */
  #elemTargetTile;

  constructor({
    canvasId = "canvasId",
    rows = 7,
    cols = 7,
    badSwapTimeout = 500,
    timerInterval = 200,
  }) {
    this.#canvasId = canvasId;
    this.#timerInterval = timerInterval;
    this.#badSwapTimeout = badSwapTimeout;

    this.#rows = rows;
    this.#cols = cols;
    this.#timerId = null;

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

  *#createBoard() {
    for (const k of rangeGenerator(this.#rows * this.#cols, 1)) {
      yield this.#createTile(this.#getRandomTileKey(), k);
    }
  }

  #getRandomTileKey() {
    return Math.ceil(Math.random() * GameTile.typeCount);
  }

  #createTile(tileKey, id) {
    const tile = new GameTile({ id, type: tileKey, worth: 1, leverage: 1.25 });
    tile.onclick = this.#tileClickHandler.bind(this);

    return tile;
  }

  /**
   * @param  {Event & {target: GameTile}} {clickedTile}
   */
  #tileClickHandler({ target: clickedTile }) {
    const intendedSwapDirection = this.#manageAndValidateSelection(clickedTile);
    console.debug(intendedSwapDirection);

    if (!intendedSwapDirection) {
      return;
    }

    this.#swapUserSelectedTiles();

    const matchInfo = this.#detectMatchXY();
    console.debug(matchInfo);

    if (!matchInfo) {
      this.#handleUserBadSelection();
    } else {
      this.#hideMatch(matchInfo);
      this.#resetUserSelection();
    }

    // TODO: ensure, that after successful it selection will be reset!
    // At least keep an eye on this nuance!
  }

  #handleUserBadSelection() {
    const id = setTimeout(() => {
      clearTimeout(id);
      this.#swapUserSelectedTiles();
      this.#resetUserSelection();
    }, this.#badSwapTimeout);
  }

  /**
   * @param {MatchInfo} matchInfo
   */
  #hideMatch(matchInfo) {
    matchInfo.all.forEach((tile) => tile.setHidden());
  }

  #swapUserSelectedTiles() {
    if (!this.#elemPickedTile || !this.#elemTargetTile) {
      throw new Error(
        "Developer error: tile swapping failed: at least one of the subjected tiles is not set."
      );
    }

    this.#swapTiles(this.#elemPickedTile, this.#elemTargetTile);
  }

  /**
   * Swap provided tiles in DOM.
   * @param {GameTile} tile1
   * @param {GameTile} tile2
   */
  #swapTiles(tile1, tile2) {
    const idxInitialTile1 = this.#elemTiles.indexOf(tile1);

    // TODO: comments!
    // Put 1st tile to 2nd tile's place; remove 2nd tile from DOM...
    const orphan = this.#elemCanvas.replaceChild(tile1, tile2);

    // ...and put temporarily orphaned 2nd tile to 1st tile's initial place.
    this.#elemCanvas.insertBefore(
      orphan,
      this.#elemTiles.item(idxInitialTile1)
    );
  }

  #detectMatchXY() {
    const mInfo = this.#obtainDirectionalMatchInfo();

    const matchX =
      mInfo.left?.length >= 1 || mInfo.right?.length >= 1
        ? [...mInfo.left, this.#elemPickedTile, ...mInfo.right]
        : null;

    const matchY =
      mInfo.up?.length >= 1 || mInfo.down?.length >= 1
        ? [...mInfo.up, this.#elemPickedTile, ...mInfo.down]
        : null;

    return matchX?.length >= 3 || matchY?.length >= 3
      ? new MatchInfo(matchX, matchY)
      : null;
  }

  #obtainDirectionalMatchInfo() {
    const pickedTileType = this.#elemPickedTile.type;
    const idxSeek = this.#elemTiles.indexOf(this.#elemPickedTile);

    return {
      left: [...this.#gatherSeekToLeft(pickedTileType, idxSeek)],
      right: [...this.#gatherSeekToRight(pickedTileType, idxSeek)],
      up: [...this.#gatherSeekToUp(pickedTileType, idxSeek)],
      down: [...this.#gatherSeekToDown(pickedTileType, idxSeek)],
    };
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
      const testTile = this.#elemTiles[(seekIndex += this.#rows)]; // step down!

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
      this.#resetUserSelection();
      this.#elemPickedTile = clickedTile;
      this.#elemPickedTile.setPicked();

      return x;
    }

    return undefined;
  }

  #resetUserSelection() {
    this.#elemPickedTile?.unSetPicked().unSetTarget();
    this.#elemTargetTile?.unSetPicked().unSetTarget();
    this.#elemPickedTile = this.#elemTargetTile = null;
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
