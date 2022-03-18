const util = require('util');
const redis = require('redis');
const config = require('config');
const Bull = require('bull');

exports.flushDbThenGenerateQueues = () => {
  const client = redis.createClient(config.bull.redis);
  const flushDB = util.promisify(client.flushdb).bind(client);

  return flushDB()
    .then(() => client.end(true))
    .then(() => [new Bull('test', config.bull)]);
};
