const util = require('util');

exports.getTypes = (req, res) =>
  /*
  [socket] GET /types
  @response {Array<String>}
   */
  util.promisify(req.queue.types).bind(req.queue)().then(types => {
    res.json(types);
  });
