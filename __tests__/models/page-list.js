const PageList = require('../../lib/models/page-list');

afterEach(() => jest.restoreAllMocks());

test('initial page list', () => {
  const pageList = new PageList(0, 2, 100, [{id: 1}, {id: 2}]);

  expect(pageList).toMatchSnapshot();
});
