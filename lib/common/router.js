const {match} = require('path-to-regexp');

module.exports = class Route {
  constructor() {
    this.stack = [];
  }

  /**
   * @param {string} path
   * @param {function(req, res)} handler
   */
  get(path, handler) {
    this.registerHandler('GET', path, handler);
  }

  /**
   * @param {string} path
   * @param {function(req, res)} handler
   */
  post(path, handler) {
    this.registerHandler('POST', path, handler);
  }

  /**
   * @param {string} path
   * @param {function(req, res)} handler
   */
  put(path, handler) {
    this.registerHandler('PUT', path, handler);
  }

  /**
   * @param {string} path
   * @param {function(req, res)} handler
   */
  delete(path, handler) {
    this.registerHandler('DELETE', path, handler);
  }

  registerHandler(method, path, handler) {
    this.stack.push({
      method,
      match: match(path),
      handler,
    });
  }

  dispatch(req, res, notFoundHandler) {
    for (let index = 0; index < this.stack.length; index += 1) {
      const {method, match, handler} = this.stack[index];

      if (req.method !== method) {
        continue;
      }

      const matchResult = match(req.url);
      if (!matchResult) {
        continue;
      }

      req.params = matchResult.params;
      return handler(req, res);
    }

    return notFoundHandler(req, res);
  }
};
