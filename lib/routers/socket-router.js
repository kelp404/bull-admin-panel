const jobHandler = require('../handlers/job-handler');
const queueHandler = require('../handlers/queue-handler');

module.exports = {
  'GET /queues/:queueName/jobs': jobHandler.getJobs,
  'GET /queues/:queueName/jobs/:jobId': jobHandler.getJob,
  'DELETE /queues/:queueName/jobs/:jobId': jobHandler.deleteJob,
  'POST /queues/:queueName/jobs/:jobId/_retry': jobHandler.retryJob,
  'POST /queues/:queueName/jobs/_count': jobHandler.countAllStateJobs,
  'GET /queues': queueHandler.getQueues
};
