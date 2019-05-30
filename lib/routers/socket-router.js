const jobHandler = require('../handlers/job-handler');
const typeHandler = require('../handlers/type-handler');

module.exports = {
  'GET /jobs': jobHandler.getJobs,
  'GET /jobs/:jobId': jobHandler.getJob,
  'DELETE /jobs/:jobId': jobHandler.deleteJob,
  'POST /jobs/_count': jobHandler.countAllStateJobs,
  'GET /types': typeHandler.getTypes
};
