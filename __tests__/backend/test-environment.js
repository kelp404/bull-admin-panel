const NodeEnvironment = require('jest-environment-node');

module.exports = class Environment extends NodeEnvironment {
  async setup() {
    await super.setup();
  }

  async teardown() {
    await super.teardown();
  }
};
