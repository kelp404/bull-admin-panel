const typeHandler = require('../handlers/type-handler');

module.exports = {
  '/types': typeHandler.getTypes
};
