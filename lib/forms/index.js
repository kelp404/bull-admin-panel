const Validator = require('fastest-validator');

module.exports = new Validator({
  useNewCustomCheckerFunction: true,
});
