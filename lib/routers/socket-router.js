const jobHandler = require('../handlers/job-handler');
const typeHandler = require('../handlers/type-handler');

module.exports = {
  'POST /jobs/_count': jobHandler.countAllStateJobs,
  'GET /types': typeHandler.getTypes
};
