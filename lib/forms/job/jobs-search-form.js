const v = require('../');

module.exports = v.compile({
  state: {
    type: 'enum',
    empty: false,
    values: ['inactive', 'active', 'complete', 'failed', 'delayed']
  }
});
