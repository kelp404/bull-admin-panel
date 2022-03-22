const path = require('path');

module.exports = {
  testEnvironment: './test-environment.js',
  transformIgnorePatterns: ['node_modules/(?!(pupa|escape-goat)/)'],
  transform: {
    '\\.js$': ['babel-jest', {
      configFile: path.join(__dirname, 'babel.config.js'),
    }],
  },
  testPathIgnorePatterns: [
    '__tests__/backend',
    '__tests__/frontend/babel.config.js',
    '__tests__/frontend/jest.config.js',
    '__tests__/frontend/test-environment.js',
  ],
};
