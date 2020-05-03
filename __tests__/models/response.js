const Response = require('../../lib/models/response');

afterEach(() => jest.restoreAllMocks());

test('initial response with request id and ws', () => {
  const response = new Response({
    requestId: 'id',
    ws: {id: 1}
  });

  expect(response).toMatchSnapshot();
});

test('call end() will set isDidResponse as true', () => {
  const response = new Response({
    requestId: Math.random().toString(36).substr(2),
    ws: {}
  });

  expect(response.isDidResponse).toBeFalsy();
  response.end();
  expect(response.isDidResponse).toBeTruthy();
});

test('can not send data twice', () => {
  const data = {url: 'http://example.com'};
  const response = new Response({
    requestId: Math.random().toString(36).substr(2),
    ws: {
      send: jest.fn()
    }
  });

  response.json(data);
  response.json(data);
  expect(response.ws.send).toBeCalledTimes(1);
});

test('send success json response', () => {
  const data = {url: 'http://example.com'};
  const response = new Response({
    requestId: 'lb11ge3aa0f',
    ws: {
      send: jest.fn(message => expect(message).toMatchSnapshot())
    }
  });

  jest.spyOn(response, 'end');

  response.json(data);
  expect(response.ws.send).toBeCalled();
  expect(response.end).toBeCalled();
});

test('send failed json response', () => {
  const data = {url: 'http://example.com'};
  const response = new Response({
    requestId: 'lb11ge3aa0f',
    ws: {
      send: jest.fn(message => expect(message).toMatchSnapshot())
    }
  });

  jest.spyOn(response, 'end');

  response.json(data, 500);
  expect(response.ws.send).toBeCalled();
  expect(response.end).toBeCalled();
});
