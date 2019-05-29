const PubSub = require('pubsub-js');
const constants = require('./constants');

const _data = {};

module.exports = {
  unsubscribe: token => PubSub.unsubscribe(token),
  subscribe: (key, func) =>
    PubSub.subscribe(`${constants.STORE_CHANGE}${key}`, (msg, data) => func(msg, data)),
  set: (key, value) => {
    _data[key] = value;
    return PubSub.publish(`${constants.STORE_CHANGE}${key}`, value);
  },
  get: key => _data[key]
};
