const util = require('util');
const config = require('config');
const Bull = require('bull');
const redis = require('redis');
const baseHandler = require('../../lib/handlers/base-handler');
let queues;

beforeEach(() => {
  const client = redis.createClient(config.bull.redis);
  const flushDB = util.promisify(client.flushdb).bind(client);

  return flushDB()
    .then(() => client.end(true))
    .then(() => {
      queues = [new Bull('test', config.bull)];
    });
});

afterEach(() => {
  jest.restoreAllMocks();
  queues.forEach(queue => queue.close());
});

describe('get base template', () => {
  test('by defaults', () => {
    const req = {};
    const res = {
      locals: {
        bullAdminPanel: {
          assetsPath: '/assets',
          basePath: '/bull',
        },
      },
      send: jest.fn(html => expect(html).toMatchSnapshot()),
    };

    baseHandler.getBaseTemplate(req, res);
    expect(res.send).toBeCalled();
  });
});
