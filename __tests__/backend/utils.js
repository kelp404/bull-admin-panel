const redis = require('redis');
const config = require('config');
const Bull = require('bull');

exports.flushDbThenGenerateQueues = async () => {
  const {BULL} = config;
  const client = redis.createClient({url: BULL.REDIS_URL});

  await client.connect();
  await client.flushDb();
  await client.quit();
  return [new Bull('test', BULL.REDIS_URL)];
};
