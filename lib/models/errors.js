exports.Http400 = class Http400 extends Error {
  constructor(message, extra) {
    super(message);
    this.status = 400;
    this.extra = extra;
  }
};

exports.Http404 = class Http404 extends Error {
  constructor(message, extra) {
    super(message);
    this.status = 404;
    this.extra = extra;
  }
};

exports.Http500 = class Http500 extends Error {
  constructor(message, extra) {
    super(message);
    this.status = 500;
    this.extra = extra;
  }
};
