const PubSub = require('pubsub-js');
const constants = require('./constants');

const _data = {};

module.exports = {
  /**
   * @param {string} key - The store key.
   * @param {function(msg: string, data: any)} func - The callback function.
   * @returns {function()} - The unsubscribe function.
   */
  subscribe(key, func) {
    const token = PubSub.subscribe(`${constants.STORE_CHANGE}${key}`, func);
    return () => PubSub.unsubscribe(token);
  },
  set(key, value) {
    _data[key] = value;
    return PubSub.publishSync(`${constants.STORE_CHANGE}${key}`, value);
  },
  get: key => _data[key],
};
