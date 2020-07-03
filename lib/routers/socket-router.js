const jobHandler = require('../handlers/job-handler');
const queueHandler = require('../handlers/queue-handler');
const Router = require('../common/router');
const router = new Router();

module.exports = router;
router.get('/queues/:queueName/jobs', jobHandler.getJobs);
router.get('/queues/:queueName/jobs/:jobId', jobHandler.getJob);
router.delete('/queues/:queueName/jobs/:jobId', jobHandler.deleteJob);
router.post('/queues/:queueName/jobs/:jobId/_retry', jobHandler.retryJob);
router.post('/queues/:queueName/jobs/_count', jobHandler.countAllStateJobs);
router.post('/queues/:queueName/jobs/_clean', jobHandler.cleanJobs);
router.get('/queues', queueHandler.getQueues);
