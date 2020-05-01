const utils = require('../../lib/common/utils');

afterEach(() => jest.restoreAllMocks());

test('renders base html', () => {
  const template = utils.getBaseTemplate();
  const config = {
    assetsPath: '/bull/assets',
    basePath: '/bull'
  };

  expect(template({config})).toMatchSnapshot();
});
