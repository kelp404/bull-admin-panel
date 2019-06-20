const PubSub = require('pubsub-js');
const constants = require('./constants');

const _data = {};

module.exports = {
  subscribe: (key, func) => {
    /*
    @param key {String}
    @param func {Function} (msg, data) =>
    @returns {Function} Unsubscribe.
     */
    const token = PubSub.subscribe(`${constants.STORE_CHANGE}${key}`, func);
    return () => PubSub.unsubscribe(token);
  },
  set: (key, value) => {
    _data[key] = value;
    return PubSub.publishSync(`${constants.STORE_CHANGE}${key}`, value);
  },
  get: key => _data[key]
};
