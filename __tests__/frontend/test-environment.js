const JSDOMEnvironment = require('jest-environment-jsdom');

module.exports = class Environment extends JSDOMEnvironment {
  async setup() {
    await super.setup();

    this.global.window.config = {
      assetsPath: '//localhost:8001',
      basePath: '/',
    };
    this.global.window.error = null;
  }

  async teardown() {
    await super.teardown();
  }
};
