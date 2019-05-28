exports.Http500 = class Http500 extends Error {
  constructor(args) {
    super(args);
    this.status = 500;
  }
};
