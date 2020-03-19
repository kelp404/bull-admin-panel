const queryString = require('query-string');

module.exports = class Request {
  /**
   * @param {Array<Bull>} queues - Bull instances.
   * @param {string} id - The request id.
   * @param {string} method - The request method.
   * @param {string} url - The url.
   */
  constructor({queues, id, method, url}) {
    this.queues = queues;
    this.id = id;
    this.method = method;
    const qs = queryString.parseUrl(url);
    this.url = qs.url;
    this.query = qs.query;
  }
};
