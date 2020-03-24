const errors = require('../models/errors');
const PageList = require('../models/page-list');
const JobModel = require('../models/dto/job-model');
const jobsSearchForm = require('../forms/job/jobs-search-form');

/**
 * [SOCKET] POST /queues/:queueName/jobs/_count
 * @param {Object} req - The socket request object.
 * @param {Object} res - The socket response object.
 * @param {function} _ - The next function.
 * @param {string} queueName - The queue name.
 * @returns {Promise<*>}
 *  200: {
 *    waiting: number,
 *    active: number,
 *    completed: number,
 *    failed: number,
 *    delayed: number
 *    paused: number
 *  }
 */
exports.countAllStateJobs = (req, res, _, queueName) => {
  const queue = req.queues.find(x => x.name === queueName);
  if (!queue) {
    throw new errors.Http404();
  }

  return Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
    queue.getPausedCount()
  ])
    .then(([waitingCount, activeCount, completedCount, failedCount, delayedCount, pausedCount]) => {
      res.json({
        waiting: waitingCount,
        active: activeCount,
        completed: completedCount,
        failed: failedCount,
        delayed: delayedCount,
        paused: pausedCount
      });
    });
};

/**
 * [SOCKET] GET /queues/:queueName/jobs
 * @param {Object} req - The socket request object.
 * @param {Object} res - The socket response object.
 * @param {function} _ - The next function.
 * @param {string} queueName - The queue name.
 * @returns {Promise<*>}
 *  200: {PageList<Job>}
 */
exports.getJobs = (req, res, _, queueName) => {
  const checkResult = jobsSearchForm(req.query);
  if (checkResult !== true) {
    throw new errors.Http400('form validation failed.', checkResult);
  }

  const queue = req.queues.find(x => x.name === queueName);
  if (!queue) {
    throw new errors.Http404();
  }

  const index = Number(req.query.index || 0);
  const size = Number(req.query.size || 20);
  let types = ['waiting', 'active', 'completed', 'failed', 'delayed'];
  if (req.query.state) {
    types = [req.query.state];
  }

  return Promise.all([
    queue.getJobs(types, index * size, ((index + 1) * size) - 1),
    queue.getJobCounts()
  ])
    .then(([jobs, count]) => {
      let total;
      if (req.query.state) {
        // Get single state jobs.
        total = count[req.query.state];
      } else {
        // Get all state jobs.
        total = count.waiting + count.active + count.completed + count.failed + count.delayed;
      }

      res.json(new PageList(index, size, total, jobs.map(x => new JobModel(x))));
    });
};

/**
 * [SOCKET] GET /queues/:queueName/jobs/:jobId
 * @param {Object} req - The socket request object.
 * @param {Object} res - The socket response object.
 * @param {function} _ - The next function.
 * @param {string} queueName - The queue name.
 * @param {string} jobId - The job id.
 * @returns {Promise<*>}
 *  200: {Job}
 */
exports.getJob = (req, res, _, queueName, jobId) => {
  const queue = req.queues.find(x => x.name === queueName);
  if (!queue) {
    throw new errors.Http404();
  }

  return queue.getJob(jobId)
    .then(job => {
      if (!job) {
        throw new errors.Http404();
      }

      return Promise.all([job, job.getState()]);
    })
    .then(([job, state]) => {
      res.json(new JobModel({...job, state}));
    });
};

/**
 * [SOCKET] DELETE /queues/:queueName/jobs/:jobId
 * @param {Object} req - The socket request object.
 * @param {Object} res - The socket response object.
 * @param {function} _ - The next function.
 * @param {string} queueName - The queue name.
 * @param {string} jobId - The job id.
 * @returns {Promise<*>}
 *  204
 */
exports.deleteJob = (req, res, _, queueName, jobId) => {
  const queue = req.queues.find(x => x.name === queueName);
  if (!queue) {
    throw new errors.Http404();
  }

  return queue.getJob(jobId)
    .then(job => {
      if (!job) {
        throw new errors.Http404();
      }

      return job.remove();
    })
    .then(() => res.json({}, 204));
};
