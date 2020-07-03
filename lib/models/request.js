const queryString = require('query-string');

module.exports = class Request {
  /**
   * @param {Array<Bull>} queues - Bull instances.
   * @param {string} id - The request id.
   * @param {string} method - The request method.
   * @param {string} url - The url.
   *
   * @property {Array<Bull>} queues
   * @property {string} id
   * @property {string} method - The request method in upper case.
   * @property {string} url - The url without query string.
   * @property {Object} query
   * @property {Object} params
   */
  constructor({queues, id, method, url}) {
    this.queues = queues;
    this.id = id;
    this.method = method.toUpperCase();
    const qs = queryString.parseUrl(url);
    this.url = qs.url;
    this.query = qs.query;
    this.params = {};
  }
};
