module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
  },
  extends: [
    'xo',
    'xo-space',
    'xo-react/space',
  ],
  globals: {
    jest: 'readonly',
    test: 'readonly',
    describe: 'readonly',
    expect: 'readonly',
    beforeEach: 'readonly',
    afterEach: 'readonly',
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
  },
  plugins: [
    'react',
  ],
  rules: {
    'no-eq-null': 0,
    eqeqeq: ['error', 'allow-null'],
  },
};
