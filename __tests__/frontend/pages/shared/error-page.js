const React = require('react');
const ReactTestRenderer = require('react-test-renderer');
const ErrorPage = require('../../../../lib/frontend/src/pages/shared/error-page');

afterEach(() => jest.restoreAllMocks());

test('render error page with error information', () => {
  const error = new Error('fake error');
  const render = ReactTestRenderer.create(<ErrorPage error={error}/>);

  expect(render.toJSON()).toMatchSnapshot();
});

test('render error page with string', () => {
  const error = 'fake error';
  const render = ReactTestRenderer.create(<ErrorPage error={error}/>);

  expect(render.toJSON()).toMatchSnapshot();
});
