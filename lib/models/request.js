const queryString = require('query-string');

module.exports = class Request {
  constructor(args = {}) {
    if (!args.method) {
      throw new Error('Miss "method".');
    }

    if (!args.url) {
      throw new Error('Miss "url".');
    }

    this.queue = args.queue;

    this.method = args.method;
    const qs = queryString.parseUrl(args.url);
    this.url = qs.url;
    this.query = qs.query;
  }
};
