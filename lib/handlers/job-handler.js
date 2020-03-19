const util = require('util');
const utils = require('../common/utils');
const errors = require('../models/errors');
const JobModel = require('../models/dto/job-model');
const jobsSearchForm = require('../forms/job/jobs-search-form');

/**
 * [SOCKET] POST /jobs/_count
 * @param {Object} req - The socket request object.
 * @param {Object} res - The socket response object.
 * @returns {Promise<*>}
 *  200: {
 *    waiting: number,
 *    active: number,
 *    completed: number,
 *    failed: number,
 *    delayed: number
 *  }
 */
exports.countAllStateJobs = (req, res) => Promise.all([
  util.promisify(req.queue.inactiveCount).bind(req.queue)(),
  util.promisify(req.queue.activeCount).bind(req.queue)(),
  util.promisify(req.queue.completeCount).bind(req.queue)(),
  util.promisify(req.queue.failedCount).bind(req.queue)(),
  util.promisify(req.queue.delayedCount).bind(req.queue)()
]).then(([inactive, active, complete, failed, delayed]) => {
  res.json({
    inactive: inactive,
    active: active,
    complete: complete,
    failed: failed,
    delayed: delayed
  });
});

exports.getJobs = (req, res) => {
  /*
  [socket] GET /jobs
  @response {Array<dto.JobModel>}
   */
  const checkResult = jobsSearchForm(req.query);
  if (checkResult !== true) {
    throw new errors.Http400('form validation failed.', checkResult);
  }

  const count = util.promisify(req.queue[`${req.query.state}Count`]).bind(req.queue);
  const rangeByState = util.promisify(() => {});
  const rangeByType = util.promisify(() => {});
  if (req.query.type) {
    return count(req.query.type)
      .then(quantity => rangeByType(req.query.type, req.query.state, 0, quantity - 1, req.query.sort || 'desc'))
      .then(jobs => {
        res.json(jobs.map(x => new JobModel(x)));
      });
  }

  return count()
    .then(quantity => rangeByState(req.query.state, 0, quantity - 1, req.query.sort || 'desc'))
    .then(jobs => {
      res.json(jobs.map(x => new JobModel(x)));
    });
};

exports.getJob = (req, res, _, jobId) => {
  /*
  [socket] GET /jobs/:jobId
  @response {dto.JobModel}
   */
  return utils.getJob(jobId).then(result => {
    res.json(new JobModel({...result, isDetailResult: true}));
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
