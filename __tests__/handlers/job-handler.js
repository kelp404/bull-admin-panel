const util = require('util');
const config = require('config');
const Bull = require('bull');
const redis = require('redis');
const errors = require('../../lib/models/errors');
const Request = require('../../lib/models/request');
const Response = require('../../lib/models/response');
const JobState = require('../../lib/models/constants/job-state');
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
    ws: {
      send: () => {}
    }
  });
};

describe('clean jobs', () => {
  test('can not clean waiting jobs', () => {
    const request = generateRequest({
      method: 'POST',
      url: `/queues/test/jobs/_clean?state=${JobState.WAITING}`
    });
    const response = generateResponse(request.id);
    const fn = () => jobHandler.cleanJobs(request, response, () => {}, 'test');

    expect(fn).toThrowErrorMatchingSnapshot();
  });

  test('can not clean active jobs', () => {
    const request = generateRequest({
      method: 'POST',
      url: `/queues/test/jobs/_clean?state=${JobState.ACTIVE}`
    });
    const response = generateResponse(request.id);
    const fn = () => jobHandler.cleanJobs(request, response, () => {}, 'test');

    expect(fn).toThrowErrorMatchingSnapshot();
  });

  test('can not clean delayed jobs', () => {
    const request = generateRequest({
      method: 'POST',
      url: `/queues/test/jobs/_clean?state=${JobState.DELAYED}`
    });
    const response = generateResponse(request.id);
    const fn = () => jobHandler.cleanJobs(request, response, () => {}, 'test');

    expect(fn).toThrowErrorMatchingSnapshot();
  });

  test('can not clean paused jobs', () => {
    const request = generateRequest({
      method: 'POST',
      url: `/queues/test/jobs/_clean?state=${JobState.PAUSED}`
    });
    const response = generateResponse(request.id);
    const fn = () => jobHandler.cleanJobs(request, response, () => {}, 'test');

    expect(fn).toThrowErrorMatchingSnapshot();
  });

  test('clean jobs with failed queue name', () => {
    const request = generateRequest({
      method: 'POST',
      url: `/queues/test/jobs/_clean?state=${JobState.COMPLETED}`
    });
    const response = generateResponse(request.id);
    const fn = () => jobHandler.cleanJobs(request, response, () => {}, 'not-found');

    expect(fn).toThrowError(errors.Http404);
  });

  test('clean completed jobs', () => {
    const request = generateRequest({
      method: 'POST',
      url: `/queues/test/jobs/_clean?state=${JobState.COMPLETED}`
    });
    const response = generateResponse(request.id);

    jest.spyOn(queues[0], 'clean');
    jest.spyOn(response, 'json');

    return jobHandler.cleanJobs(request, response, () => {}, 'test')
      .then(() => {
        expect(queues[0].clean).toBeCalledWith(0, JobState.COMPLETED);
        expect(response.json).toBeCalledWith({}, 204);
      });
  });

  test('clean failed jobs', () => {
    const request = generateRequest({
      method: 'POST',
      url: `/queues/test/jobs/_clean?state=${JobState.FAILED}`
    });
    const response = generateResponse(request.id);

    jest.spyOn(queues[0], 'clean');
    jest.spyOn(response, 'json');

    return jobHandler.cleanJobs(request, response, () => {}, 'test')
      .then(() => {
        expect(queues[0].clean).toBeCalledWith(0, JobState.FAILED);
        expect(response.json).toBeCalledWith({}, 204);
      });
  });
});

describe('get job', () => {
  test('get a job with failed queue name', () => {
    const request = generateRequest({
      method: 'GET',
      url: '/queues/test/jobs/1'
    });
    const response = generateResponse(request.id);

    return queues[0].add({data: 1})
      .then(() => {
        const fn = () => jobHandler.getJob(request, response, () => {}, 'not-found', '1');
        expect(fn).toThrow(errors.Http404);
      });
  });

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
        expect(response.json).toBeCalled();
      });
  });

  test('get a job by failed id', () => {
    const request = generateRequest({
      method: 'GET',
      url: '/queues/test/jobs/2'
    });
    const response = generateResponse(request.id);

    return queues[0].add({data: 1}) // Add test job.
      .then(() => jobHandler.getJob(request, response, () => {}, 'test', '2'))
      .catch(error => {
        expect(error).toBeInstanceOf(errors.Http404);
      });
  });
});
