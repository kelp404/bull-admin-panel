module.exports = class PageList {
  /**
   * @param {number} index - The page index.
   * @param {number} size - The page size.
   * @param {number} total
   * @param {Array<Object>} items
   */
  constructor(index, size, total, items) {
    this.index = index;
    this.size = size;
    this.total = total;
    this.items = items;
  }
};
