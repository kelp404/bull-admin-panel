const util = require('util');

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
