const v = require('../');
const JOB_STATE = require('../../models/constants/job-state');

module.exports = v.compile({
  index: {
    type: 'string',
    optional: true,
    empty: true,
    pattern: /^\d*$/,
  },
  size: {
    type: 'string',
    optional: true,
    empty: true,
    pattern: /^\d*$/,
  },
  state: {
    type: 'string',
    optional: true,
    empty: false,
    enum: Object.values(JOB_STATE),
  },
});
