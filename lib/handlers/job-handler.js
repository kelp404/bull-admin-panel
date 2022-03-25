const errors = require('../models/errors');
const PageList = require('../models/page-list');
const JobModel = require('../models/dto/job-model');
const JOB_STATE = require('../models/constants/job-state');
const cleanJobsForm = require('../forms/jobs/clean-jobs-form');
const jobsSearchForm = require('../forms/jobs/jobs-search-form');

/**
 * [SOCKET] POST /queues/:queueName/jobs/_count
 * @param {Object} req - The socket request object.
 * @param {Object} res - The socket response object.
 * @returns {Promise<*>}
 *  200: {
 *    waiting: number,
 *    active: number,
 *    completed: number,
 *    failed: number,
 *  }
 */
exports.countAllStateJobs = (req, res) => {
  const {queueName} = req.params;
  const queue = req.queues.find(x => x.name === queueName);
  if (!queue) {
    throw new errors.Http404(`not found queue ${queueName}`);
  }

  return Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
  ])
    .then(([waitingCount, activeCount, completedCount, failedCount]) => {
      res.json({
        waiting: waitingCount,
        active: activeCount,
        completed: completedCount,
        failed: failedCount,
      });
    });
};

/**
 * [SOCKET] GET /queues/:queueName/jobs
 * @param {Object} req - The socket request object.
 * @param {Object} res - The socket response object.
 * @returns {Promise<*>}
 *  200: {PageList<Job>}
 */
exports.getJobs = (req, res) => {
  const {queueName} = req.params;
  const checkResult = jobsSearchForm(req.query);
  if (checkResult !== true) {
    throw new errors.Http400('form validation failed.', checkResult);
  }

  const queue = req.queues.find(x => x.name === queueName);
  if (!queue) {
    throw new errors.Http404(`not found queue ${queueName}`);
  }

  const index = Number(req.query.index || 0);
  const size = Number(req.query.size || 20);
  const types = req.query.state
    ? [req.query.state]
    : Object.values(JOB_STATE);

  return Promise.all([
    queue.getJobs(types, index * size, ((index + 1) * size) - 1),
    queue.getJobCounts(),
  ])
    .then(([jobs, count]) => {
      let total;
      if (req.query.state) {
        // Get single state jobs.
        total = count[req.query.state];
      } else {
        // Get all state jobs.
        total = count.waiting + count.active + count.completed + count.failed;
      }

      res.json(
        new PageList(index, size, total, jobs.filter(x => x).map(x => new JobModel(x))),
      );
    });
};

/**
 * [SOCKET] POST /queues/:queueName/jobs/_clean
 * @param {Object} req - The socket request object.
 * @param {Object} res - The socket response object.
 * @returns {Promise<*>}
 *  204
 */
exports.cleanJobs = (req, res) => {
  const {queueName} = req.params;
  const checkResult = cleanJobsForm(req.query);
  if (checkResult !== true) {
    throw new errors.Http400('form validation failed.', checkResult);
  }

  const queue = req.queues.find(x => x.name === queueName);
  if (!queue) {
    throw new errors.Http404(`not found queue ${queueName}`);
  }

  return queue.clean(0, req.query.state)
    .then(() => {
      res.json({}, 204);
    });
};

/**
 * [SOCKET] GET /queues/:queueName/jobs/:jobId
 * @param {Object} req - The socket request object.
 * @param {Object} res - The socket response object.
 * @returns {Promise<*>}
 *  200: {Job}
 */
exports.getJob = (req, res) => {
  const {queueName, jobId} = req.params;
  const queue = req.queues.find(x => x.name === queueName);
  if (!queue) {
    throw new errors.Http404(`not found queue ${queueName}`);
  }

  return queue.getJob(jobId)
    .then(job => {
      if (!job) {
        throw new errors.Http404(`not found job ${jobId}`);
      }

      return Promise.all([job, job.getState()]);
    })
    .then(([job, state]) => {
      res.json(new JobModel({...job, state}));
    });
};

/**
 * [SOCKET] POST /queues/:queueName/jobs/:jobId/_retry
 * @param {Object} req - The socket request object.
 * @param {Object} res - The socket response object.
 * @returns {Promise<*>}
 *  204
 */
exports.retryJob = (req, res) => {
  const {queueName, jobId} = req.params;
  const queue = req.queues.find(x => x.name === queueName);
  if (!queue) {
    throw new errors.Http404(`not found queue ${queueName}`);
  }

  return queue.getJob(jobId)
    .then(job => {
      if (!job) {
        throw new errors.Http404(`not found job ${jobId}`);
      }

      return Promise.all([job, job.isFailed()]);
    }).then(([job, isFailed]) => {
      if (!isFailed) {
        // Just allow retry failed job.
        throw new errors.Http404(`not found failed job ${jobId}`);
      }

      return job.retry();
    })
    .then(() => res.json({}, 204));
};

/**
 * [SOCKET] DELETE /queues/:queueName/jobs/:jobId
 * @param {Object} req - The socket request object.
 * @param {Object} res - The socket response object.
 * @returns {Promise<*>}
 *  204
 */
exports.deleteJob = (req, res) => {
  const {queueName, jobId} = req.params;
  const queue = req.queues.find(x => x.name === queueName);
  if (!queue) {
    throw new errors.Http404(`not found queue ${queueName}`);
  }

  return queue.getJob(jobId)
    .then(job => {
      if (!job) {
        throw new errors.Http404(`not found job ${jobId}`);
      }

      return job.remove();
    })
    .then(() => res.json({}, 204));
};
