const path = require('path');

module.exports = {
  maxConcurrency: 1,
  maxWorkers: 1,
  testEnvironment: './test-environment.js',
  transform: {
    '\\.js$': ['babel-jest', {
      configFile: path.join(__dirname, 'babel.config.js'),
    }],
  },
  testPathIgnorePatterns: [
    '__tests__/backend/babel.config.js',
    '__tests__/backend/jest.config.js',
    '__tests__/backend/test-environment.js',
    '__tests__/backend/utils.js',
    '__tests__/frontend',
  ],
};
