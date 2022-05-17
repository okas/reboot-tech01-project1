/**
 * Generates array of numbers
 * @param {number} end
 * @param {number=} start
 * @param {number=} step
 * @see {@link [Source](https://www.30secondsofcode.org/articles/s/javascript-range-generator)}
 */
export function rangeGenerator(end, start = 0, step = 1) {
  function* generateRange() {
    let x = start - step;
    while (x <= end - step) yield (x += step);
  }
  return {
    [Symbol.iterator]: generateRange,
  };
}

/**
 *
 * @param {any} obj
 * @returns {{} & {Array<any>.indexOf(searchElement: any, fromIndex?: number): number}}
 */
export function extendFromArrayIndexOf(obj) {
  obj.indexOf ??= Array.prototype.indexOf;

  return obj;
}

/**
 * Non-blocking sleep. Using with await can give synchronous programing style, if preferred.
 * @param {number} ms Time in ms to wait.

 * @see {@link [Source](https://stackoverflow.com/a/39914235/876902)}
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
