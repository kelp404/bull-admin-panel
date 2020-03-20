const util = require('util');
const utils = require('../common/utils');
const errors = require('../models/errors');
const PageList = require('../models/page-list');
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
    queue.getDelayedCount()
  ])
    .then(([waitingCount, activeCount, completedCount, failedCount, delayedCount]) => {
      res.json({
        waiting: waitingCount,
        active: activeCount,
        completed: completedCount,
        failed: failedCount,
        delayed: delayedCount
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

  const index = req.query.index || 0;
  const size = req.query.size || 20;
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

      res.json(new PageList(index, size, total, jobs));
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

  return queue.getJob(jobId).then(job => {
    if (!job) {
      throw new errors.Http404();
    }

    res.json(job);
  });
};

exports.restartJob = (req, res, next, jobId) => {
  /*
  [socket] POST /jobs/:jobId/_restart
  @response {dto.JobModel}
   */
  return utils.getJob(jobId)
    .then(job => util.promisify(job.inactive).bind(job)())
    .then(() => exports.getJob(req, res, next, jobId));
};

exports.deleteJob = (req, res, _, jobId) => {
  /*
  [socket] DELETE /jobs/:jobId
   */
  return utils.getJob(jobId)
    .then(job => util.promisify(job.remove).bind(job)())
    .then(() => {
      res.json({});
    });
};
