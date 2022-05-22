/**
 * @typedef {Object} Config
 * @property {string} movesCounterId
 * @property {string} timerId
 * @property {string} tilesMatchedCounterId
 * @property {string} matchCombosCounterId
 * @property {string} chancesCounterId
 */

export class GameStatistics {
  /** @type {number} */
  #timer;
  /** @type {number} */
  #moveCount;
  /** @type {number} */
  #matchCount;
  /** @type {number} */
  #comboCount;
  /** @type {number} */
  #chanceCount;

  /** @type {HTMLElement} */
  #elemTimer;
  /** @type {HTMLElement} */
  #elemMovesCounter;
  /** @type {HTMLElement} */
  #elemMatchCounter;
  /** @type {HTMLElement} */
  #elemChanceCounter;
  /** @type {HTMLElement} */
  #elemMatchCombos;

  static #handler;

  /**
   * @param {Config} htmlMappings
   */
  constructor(htmlMappings) {
    this.reset();

    this.#initDom(htmlMappings);
  }

  /**
   * @param {Config} htmlMappings
   */
  #initDom({
    movesCounterId,
    timerId,
    tilesMatchedCounterId,
    matchCombosCounterId,
    chancesCounterId,
  }) {
    this.#elemTimer = document.getElementById(timerId);
    this.#elemMovesCounter = document.getElementById(movesCounterId);
    this.#elemChanceCounter = document.getElementById(chancesCounterId);
    this.#elemMatchCounter = document.getElementById(tilesMatchedCounterId);
    this.#elemMatchCombos = document.getElementById(matchCombosCounterId);
  }

  /**
   * @return {number}
   */
  get moveCount() {
    return this.#moveCount;
  }

  set moveCount(val) {
    this.#moveCount = val;
    Promise.resolve(val).then((v) => (this.#elemMovesCounter.textContent = v));
  }

  /**
   * @return {number}
   */
  get matchCount() {
    return this.#matchCount;
  }

  set matchCount(val) {
    this.#matchCount = val;
    Promise.resolve(val).then((v) => (this.#elemMatchCounter.textContent = v));
  }

  /**
   * @return {number}
   */
  get chanceCount() {
    return this.#chanceCount;
  }

  set chanceCount(val) {
    this.#chanceCount = val;
    Promise.resolve(val).then((v) => (this.#elemChanceCounter.textContent = v));
  }

  /**
   * @return {number}
   */
  get comboCount() {
    return this.#comboCount;
  }

  set comboCount(val) {
    this.#comboCount = val;
    Promise.resolve(val).then((v) => (this.#elemMatchCombos.textContent = v));
  }

  /**
   * @return {number}
   */
  get timer() {
    return this.#timer;
  }

  set timer(val) {
    this.#timer = val;
    Promise.resolve(val).then((v) => (this.#elemTimer.textContent = v));
  }

  reset() {
    this.#timer = 0;
    this.#moveCount = 0;
    this.#matchCount = 0;
    this.#comboCount = 0;
    this.#chanceCount = 0;
  }
}
