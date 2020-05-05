const util = require('util');
const config = require('config');
const Bull = require('bull');
const redis = require('redis');
const Request = require('../../lib/models/request');
const Response = require('../../lib/models/response');
const queueHandler = require('../../lib/handlers/queue-handler');
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
    ws: {
      send: () => {}
    }
  });
};

describe('get queues', () => {
  test('by defaults', () => {
    const request = generateRequest({
      method: 'GET',
      url: '/queues'
    });
    const response = generateResponse(request.id);

    jest.spyOn(response, 'json').mockImplementation((data, status) => {
      expect(data).toMatchSnapshot();
      expect(status).toBeUndefined();
    });

    queueHandler.getQueues(request, response);
    expect(response.json).toBeCalled();
  });
});
