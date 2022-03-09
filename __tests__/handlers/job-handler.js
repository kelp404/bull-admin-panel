const util = require('util');
const config = require('config');
const Bull = require('bull');
const queryString = require('query-string');
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

const generateRequest = ({method, url, params}) => {
  const request = new Request({
    id: Math.random().toString(36),
    queues,
    method,
    url,
  });

  request.params = params;
  return request;
};

const generateResponse = requestId => new Response({
  requestId,
  ws: {
    send() {},
  },
});

describe('count all state jobs', () => {
  test('with failed queue name', () => {
    const request = generateRequest({
      method: 'POST',
      url: '/queues/not-found/jobs/_count',
      params: {
        queueName: 'not-found',
      },
    });
    const response = generateResponse(request.id);
    const fn = () => jobHandler.countAllStateJobs(request, response);

    expect(fn).toThrowError(errors.Http404);
  });

  test('by defaults', () => {
    const request = generateRequest({
      method: 'POST',
      url: '/queues/test/jobs/_count',
      params: {
        queueName: 'test',
      },
    });
    const response = generateResponse(request.id);

    jest.spyOn(queues[0], 'getWaitingCount');
    jest.spyOn(queues[0], 'getActiveCount');
    jest.spyOn(queues[0], 'getCompletedCount');
    jest.spyOn(queues[0], 'getFailedCount');
    jest.spyOn(queues[0], 'getDelayedCount');
    jest.spyOn(queues[0], 'getPausedCount');
    jest.spyOn(response, 'json').mockImplementation((data, status) => {
      expect(data).toMatchSnapshot();
      expect(status).toBeUndefined();
    });

    return jobHandler.countAllStateJobs(request, response)
      .then(() => {
        expect(response.json).toBeCalled();
      });
  });
});

describe('get jobs', () => {
  test('by failed queries', () => {
    const query = {index: 'a', size: 'b', state: 'c'};
    const request = generateRequest({
      method: 'GET',
      url: `/queues/test/jobs?${queryString.stringify(query)}`,
      params: {
        queueName: 'test',
      },
    });
    const response = generateResponse(request.id);
    const fn = () => jobHandler.getJobs(request, response);

    jest.spyOn(errors, 'Http400').mockImplementation((message, extra) => {
      expect(message).toMatchSnapshot('message');
      expect(extra).toMatchSnapshot('extra');
    });

    expect(fn).toThrowError(errors.Http400);
    expect(errors.Http400).toBeCalled();
  });

  test('with failed queue name', () => {
    const request = generateRequest({
      method: 'GET',
      url: '/queues/not-found/jobs',
      params: {
        queueName: 'not-found',
      },
    });
    const response = generateResponse(request.id);
    const fn = () => jobHandler.getJobs(request, response);

    expect(fn).toThrowError(errors.Http404);
  });

  test('by defaults', () => {
    const request = generateRequest({
      method: 'GET',
      url: '/queues/test/jobs',
      params: {
        queueName: 'test',
      },
    });
    const response = generateResponse(request.id);

    jest.spyOn(queues[0], 'getJobs');
    jest.spyOn(queues[0], 'getJobCounts');
    jest.spyOn(response, 'json').mockImplementation((data, status) => {
      expect(data).toMatchSnapshot({
        items: [
          {
            opts: {
              timestamp: expect.any(Number),
            },
            timestamp: expect.any(Number),
          },
        ],
      });
      expect(status).toBeUndefined();
    });

    return queues[0].add({data: 1})
      .then(() => jobHandler.getJobs(request, response))
      .then(() => {
        expect(queues[0].getJobs).toBeCalledWith(JobState.all(), 0, 19);
        expect(queues[0].getJobCounts).toBeCalled();
        expect(response.json).toBeCalled();
      });
  });

  test('that are waiting', () => {
    const query = {state: JobState.WAITING};
    const request = generateRequest({
      method: 'GET',
      url: `/queues/test/jobs?${queryString.stringify(query)}`,
      params: {
        queueName: 'test',
      },
    });
    const response = generateResponse(request.id);

    jest.spyOn(queues[0], 'getJobs');
    jest.spyOn(queues[0], 'getJobCounts');
    jest.spyOn(response, 'json').mockImplementation((data, status) => {
      expect(data).toMatchSnapshot({
        items: [
          {
            opts: {
              timestamp: expect.any(Number),
            },
            timestamp: expect.any(Number),
          },
        ],
      });
      expect(status).toBeUndefined();
    });

    return queues[0].add({data: 1})
      .then(() => jobHandler.getJobs(request, response))
      .then(() => {
        expect(queues[0].getJobs).toBeCalledWith([JobState.WAITING], 0, 19);
        expect(queues[0].getJobCounts).toBeCalled();
        expect(response.json).toBeCalled();
      });
  });
});

describe('clean jobs', () => {
  test('that are waiting', () => {
    const request = generateRequest({
      method: 'POST',
      url: `/queues/test/jobs/_clean?state=${JobState.WAITING}`,
      params: {
        queueName: 'test',
      },
    });
    const response = generateResponse(request.id);
    const fn = () => jobHandler.cleanJobs(request, response);

    expect(fn).toThrowErrorMatchingSnapshot();
  });

  test('that are active', () => {
    const request = generateRequest({
      method: 'POST',
      url: `/queues/test/jobs/_clean?state=${JobState.ACTIVE}`,
      params: {
        queueName: 'test',
      },
    });
    const response = generateResponse(request.id);
    const fn = () => jobHandler.cleanJobs(request, response);

    expect(fn).toThrowErrorMatchingSnapshot();
  });

  test('that are delayed', () => {
    const request = generateRequest({
      method: 'POST',
      url: `/queues/test/jobs/_clean?state=${JobState.DELAYED}`,
      params: {
        queueName: 'test',
      },
    });
    const response = generateResponse(request.id);
    const fn = () => jobHandler.cleanJobs(request, response);

    expect(fn).toThrowErrorMatchingSnapshot();
  });

  test('that are paused', () => {
    const request = generateRequest({
      method: 'POST',
      url: `/queues/test/jobs/_clean?state=${JobState.PAUSED}`,
      params: {
        queueName: 'test',
      },
    });
    const response = generateResponse(request.id);
    const fn = () => jobHandler.cleanJobs(request, response);

    expect(fn).toThrowErrorMatchingSnapshot();
  });

  test('with failed queue name', () => {
    const request = generateRequest({
      method: 'POST',
      url: `/queues/not-found/jobs/_clean?state=${JobState.COMPLETED}`,
      params: {
        queueName: 'not-found',
      },
    });
    const response = generateResponse(request.id);
    const fn = () => jobHandler.cleanJobs(request, response);

    expect(fn).toThrowError(errors.Http404);
  });

  test('that are completed', () => {
    const request = generateRequest({
      method: 'POST',
      url: `/queues/test/jobs/_clean?state=${JobState.COMPLETED}`,
      params: {
        queueName: 'test',
      },
    });
    const response = generateResponse(request.id);

    jest.spyOn(queues[0], 'clean');
    jest.spyOn(response, 'json');

    return jobHandler.cleanJobs(request, response)
      .then(() => {
        expect(queues[0].clean).toBeCalledWith(0, JobState.COMPLETED);
        expect(response.json).toBeCalledWith({}, 204);
      });
  });

  test('that are failed', () => {
    const request = generateRequest({
      method: 'POST',
      url: `/queues/test/jobs/_clean?state=${JobState.FAILED}`,
      params: {
        queueName: 'test',
      },
    });
    const response = generateResponse(request.id);

    jest.spyOn(queues[0], 'clean');
    jest.spyOn(response, 'json');

    return jobHandler.cleanJobs(request, response)
      .then(() => {
        expect(queues[0].clean).toBeCalledWith(0, JobState.FAILED);
        expect(response.json).toBeCalledWith({}, 204);
      });
  });
});

describe('get job', () => {
  test('with failed queue name', () => {
    const request = generateRequest({
      method: 'GET',
      url: '/queues/not-found/jobs/1',
      params: {
        queueName: 'not-found',
        jobId: '1',
      },
    });
    const response = generateResponse(request.id);

    return queues[0].add({data: 1})
      .then(() => {
        const fn = () => jobHandler.getJob(request, response);
        expect(fn).toThrowError(errors.Http404);
      });
  });

  test('by id', () => {
    const request = generateRequest({
      method: 'GET',
      url: '/queues/test/jobs/1',
      params: {
        queueName: 'test',
        jobId: '1',
      },
    });
    const response = generateResponse(request.id);

    jest.spyOn(queues[0], 'getJob');
    jest.spyOn(response, 'json').mockImplementation((data, status) => {
      expect(data).toMatchSnapshot({
        opts: {
          timestamp: expect.any(Number),
        },
        timestamp: expect.any(Number),
      });
      expect(status).toBeUndefined();
    });

    return queues[0].add({data: 1}) // Add test job.
      .then(() => jobHandler.getJob(request, response))
      .then(() => {
        expect(queues[0].getJob).toBeCalledWith('1');
        expect(response.json).toBeCalled();
      });
  });

  test('by failed id', () => {
    const request = generateRequest({
      method: 'GET',
      url: '/queues/test/jobs/2',
      params: {
        queueName: 'test',
        jobId: '2',
      },
    });
    const response = generateResponse(request.id);

    return queues[0].add({data: 1}) // Add test job.
      .then(() => jobHandler.getJob(request, response))
      .catch(error => {
        expect(error).toBeInstanceOf(errors.Http404);
      });
  });
});

describe('retry job', () => {
  test('with failed queue name', () => {
    const request = generateRequest({
      method: 'POST',
      url: '/queues/not-found/jobs/1/_retry',
      params: {
        queueName: 'not-found',
        jobId: '1',
      },
    });
    const response = generateResponse(request.id);
    const fn = () => jobHandler.retryJob(request, response);

    expect(fn).toThrowError(errors.Http404);
  });

  test('with failed job id', () => {
    const request = generateRequest({
      method: 'POST',
      url: '/queues/test/jobs/2/_retry',
      params: {
        queueName: 'test',
        jobId: '2',
      },
    });
    const response = generateResponse(request.id);

    jest.spyOn(queues[0], 'getJob');

    return queues[0].add({data: 1})
      .then(() => jobHandler.retryJob(request, response))
      .catch(error => {
        expect(queues[0].getJob).toBeCalledWith('2');
        expect(error).toBeInstanceOf(errors.Http404);
      });
  });

  test('that is not failed', () => {
    const request = generateRequest({
      method: 'POST',
      url: '/queues/test/jobs/1/_retry',
      params: {
        queueName: 'test',
        jobId: '1',
      },
    });
    const response = generateResponse(request.id);

    jest.spyOn(queues[0], 'getJob');
    jest.spyOn(Bull.Job.prototype, 'isFailed');

    return queues[0].add({data: 1})
      .then(() => jobHandler.retryJob(request, response))
      .catch(error => {
        expect(queues[0].getJob).toBeCalledWith('1');
        expect(Bull.Job.prototype.isFailed).toBeCalled();
        expect(error).toBeInstanceOf(errors.Http404);
      });
  });

  test('by id', () => {
    const request = generateRequest({
      method: 'POST',
      url: '/queues/test/jobs/1/_retry',
      params: {
        queueName: 'test',
        jobId: '1',
      },
    });
    const response = generateResponse(request.id);

    jest.spyOn(queues[0], 'getJob');
    jest.spyOn(Bull.Job.prototype, 'isFailed');
    jest.spyOn(Bull.Job.prototype, 'retry');
    jest.spyOn(response, 'json').mockImplementation((data, status) => {
      expect(data).toMatchSnapshot();
      expect(status).toBe(204);
    });

    return queues[0].add({data: 1})
      .then(job => job.moveToFailed(new Error('for test'), true))
      .then(() => jobHandler.retryJob(request, response))
      .then(() => {
        expect(queues[0].getJob).toBeCalledWith('1');
        expect(Bull.Job.prototype.isFailed).toBeCalled();
        expect(Bull.Job.prototype.retry).toBeCalled();
        expect(response.json).toBeCalled();
      });
  });
});

describe('delete job', () => {
  test('with failed queue name', () => {
    const request = generateRequest({
      method: 'DELETE',
      url: '/queues/not-found/jobs/1',
      params: {
        queueName: 'not-found',
        jobId: '1',
      },
    });
    const response = generateResponse(request.id);
    const fn = () => jobHandler.deleteJob(request, response);

    expect(fn).toThrowError(errors.Http404);
  });

  test('with failed job id', () => {
    const request = generateRequest({
      method: 'DELETE',
      url: '/queues/test/jobs/2',
      params: {
        queueName: 'test',
        jobId: '2',
      },
    });
    const response = generateResponse(request.id);

    jest.spyOn(queues[0], 'getJob');

    return queues[0].add({data: 1})
      .then(() => jobHandler.deleteJob(request, response))
      .catch(error => {
        expect(queues[0].getJob).toBeCalledWith('2');
        expect(error).toBeInstanceOf(errors.Http404);
      });
  });

  test('by id', () => {
    const request = generateRequest({
      method: 'DELETE',
      url: '/queues/test/jobs/1',
      params: {
        queueName: 'test',
        jobId: '1',
      },
    });
    const response = generateResponse(request.id);

    jest.spyOn(queues[0], 'getJob');
    jest.spyOn(Bull.Job.prototype, 'remove');
    jest.spyOn(response, 'json').mockImplementation((data, status) => {
      expect(data).toMatchSnapshot();
      expect(status).toBe(204);
    });

    return queues[0].add({data: 1})
      .then(() => jobHandler.deleteJob(request, response))
      .then(() => {
        expect(queues[0].getJob).toBeCalledWith('1');
        expect(Bull.Job.prototype.remove).toBeCalled();
        expect(response.json).toBeCalled();
      });
  });
});
