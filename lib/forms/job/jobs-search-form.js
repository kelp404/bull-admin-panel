const v = require('../');

module.exports = v.compile({
  index: {
    type: 'string',
    optional: true,
    empty: true,
    pattern: /^\d*$/
  },
  size: {
    type: 'string',
    optional: true,
    empty: true,
    pattern: /^\d*$/
  },
  state: {
    type: 'string',
    optional: true,
    empty: false,
    enum: ['waiting', 'active', 'completed', 'failed', 'delayed']
  }
});
