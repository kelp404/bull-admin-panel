const v = require('../');
const JobState = require('../../models/constants/job-state');

module.exports = v.compile({
  state: {
    type: 'string',
    optional: false,
    empty: false,
    enum: [JobState.FAILED, JobState.COMPLETED],
  },
});
