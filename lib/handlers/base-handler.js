const utils = require('../common/utils');

exports.getBaseTemplate = (req, res) => {
  res.send(utils.getBaseTemplate()({config: res.locals.bullAdminPanel}));
};
