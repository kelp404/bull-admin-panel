const utils = require('../common/utils');

exports.baseView = (req, res) => {
  res.send(utils.getBaseTemplate()({config: res.locals.bullAdminPanel}));
};
