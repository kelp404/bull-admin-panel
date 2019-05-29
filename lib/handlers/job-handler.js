const util = require('util');
const kue = require('kue');
const errors = require('../models/errors');
const JobModel = require('../models/dto/job-model');
const jobsSearchForm = require('../forms/job/jobs-search-form');

exports.countAllStateJobs = (req, res) => Promise.all([
  /*
  [socket] POST /jobs/_count
  @response {Object}
    inactive {Number}
    active {Number}
    complete {Number}
    failed {Number}
    delayed {Number}
   */
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

  const rangeByState = util.promisify(kue.Job.rangeByState);
  return util.promisify(req.queue[`${req.query.state}Count`])
    .bind(req.queue)()
    .then(quantity => rangeByState(req.query.state, 0, quantity - 1, 'desc'))
    .then(jobs => {
      res.json(jobs.map(x => new JobModel(x)));
    });
};
