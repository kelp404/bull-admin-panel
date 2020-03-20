const jobHandler = require('../handlers/job-handler');
const queueHandler = require('../handlers/queue-handler');

module.exports = {
  'GET /queues/:queueName/jobs': jobHandler.getJobs,
  'GET /jobs/:jobId': jobHandler.getJob,
  'DELETE /jobs/:jobId': jobHandler.deleteJob,
  'POST /jobs/:jobId/_restart': jobHandler.restartJob,
  'POST /queues/:queueName/jobs/_count': jobHandler.countAllStateJobs,
  'GET /queues': queueHandler.getQueues
};
