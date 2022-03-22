const redis = require('redis');
const config = require('config');
const Bull = require('bull');

exports.flushDbThenGenerateQueues = async () => {
  const client = redis.createClient({url: config.bull.redisUrl});

  await client.connect();
  await client.flushDb();
  await client.quit();
  return [new Bull('test', config.bull.redisUrl)];
};
