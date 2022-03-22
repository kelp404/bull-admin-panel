const Request = require('../../../lib/models/request');
const Response = require('../../../lib/models/response');
const queueHandler = require('../../../lib/handlers/queue-handler');
const {flushDbThenGenerateQueues} = require('../utils');
let queues;

beforeEach(async () => {
  queues = await flushDbThenGenerateQueues();
});

afterEach(() => {
  jest.restoreAllMocks();
  queues.forEach(queue => queue.close());
});

const generateRequest = ({method, url}) => new Request({
  id: Math.random().toString(36),
  queues,
  method,
  url,
});

const generateResponse = requestId => new Response({
  requestId,
  ws: {
    send() {},
  },
});

describe('get queues', () => {
  test('by defaults', () => {
    const request = generateRequest({
      method: 'GET',
      url: '/queues',
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
