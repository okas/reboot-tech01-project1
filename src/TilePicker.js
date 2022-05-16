import { extendFromArrayIndexOf } from "./utilities.js";

export class TilePicker {
  /** @type {GameTile} */
  firstTile;
  /** @type {GameTile} */
  secondTile;

  #cols;
  #elemTiles;

  /**
   *
   * @param {number} cols
   * @param {HTMLCollection & {Array<HTMLCollection>.indexOf(searchElement: HTMLCollection, fromIndex?: number): number}} tileElements
   */
  constructor(cols, tileElements) {
    this.#cols = cols;
    this.#elemTiles = tileElements;
    extendFromArrayIndexOf(tileElements);
  }

  /**
   * @param  {GameTile} clickedTile
   */
  manageAndValidateSelection(clickedTile) {
    // To guarantee, that only two, consequent tile can be clicked.
    // If not consequent then set update states and "release" the second attempted tile.

    let x;

    if (this.firstTile === clickedTile) {
      // Click to same element, deactivate use selection.
      this.resetUserSelection();

      return undefined;
    }

    if (this.firstTile?.type === clickedTile?.type) {
      // User clicked to the element of same type -- reset "picked" to new tile.
      this.#resetUserSelectionWithNewPicked(clickedTile);

      return undefined;
    }

    if (
      this.firstTile &&
      !this.secondTile &&
      (x = this.#isSecondTileOnSide(clickedTile))
    ) {
      // Scenario of 2 consequent tiles: set the states and...
      this.secondTile = clickedTile;
      this.secondTile.setTarget();
      // ... start match evaluation

      return x;
    }

    if (!this.firstTile) {
      // First element will be picked
      this.firstTile = clickedTile;
      this.firstTile.setPicked();

      return undefined;
    }

    if (
      this.firstTile &&
      (this.secondTile || !(x = this.#isSecondTileOnSide(clickedTile)))
    ) {
      // Wrong 2nd tile clicked OR both already clicked: reset states and set new picked immediately.
      this.#resetUserSelectionWithNewPicked(clickedTile);

      return x;
    }

    return undefined;
  }

  resetUserSelection() {
    this.firstTile?.unSetPicked().unSetTarget();
    this.secondTile?.unSetPicked().unSetTarget();
    this.firstTile = this.secondTile = null;
  }

  #resetUserSelectionWithNewPicked(pickedTile) {
    this.resetUserSelection();
    this.firstTile = pickedTile;
    this.firstTile.setPicked();
  }

  /**
   * @param  {GameTile} target
   */
  #isSecondTileOnSide(target) {
    const x = this.#elemTiles.indexOf(target);
    const y = this.#elemTiles.indexOf(this.firstTile);

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
