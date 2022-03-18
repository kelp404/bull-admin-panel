const baseHandler = require('../../../lib/handlers/base-handler');
const {flushDbThenGenerateQueues} = require('../utils');
let queues;

beforeEach(async () => {
  queues = await flushDbThenGenerateQueues();
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
