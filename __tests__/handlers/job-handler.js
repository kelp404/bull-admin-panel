const util = require('util');
const config = require('config');
const Bull = require('bull');
const redis = require('redis');
const Request = require('../../lib/models/request');
const Response = require('../../lib/models/response');
const jobHandler = require('../../lib/handlers/job-handler');
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

const generateRequest = ({method, url}) => {
  return new Request({
    id: Math.random().toString(36).substr(2),
    queues,
    method,
    url
  });
};

const generateResponse = requestId => {
  return new Response({
    requestId,
    ws: {}
  });
};

describe('get job', () => {
  test('get a waiting job by id', () => {
    const request = generateRequest({
      method: 'GET',
      url: '/queues/test/jobs/1'
    });
    const response = generateResponse(request.id);

    jest.spyOn(response, 'json').mockImplementation((data, status) => {
      expect(data).toMatchSnapshot({
        opts: {
          timestamp: expect.any(Number)
        },
        timestamp: expect.any(Number)
      });
      expect(status).toBeUndefined();
      return true;
    });

    return queues[0].add({data: 1}) // Add test job.
      .then(() => jobHandler.getJob(request, response, () => {}, 'test', '1'))
      .then(() => {
        expect(response.json).toBeCalledWith(expect.any(Object));
      });
  });
});
