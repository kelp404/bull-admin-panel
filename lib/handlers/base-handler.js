const utils = require('../common/utils');

exports.baseView = (req, res) => {
  const result = utils.getBaseTemplate()({config: res.locals.kueAdminPanel});
  res.send(result);
};
