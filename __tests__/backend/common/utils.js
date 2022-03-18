const fs = require('fs');
const utils = require('../../../lib/common/utils');

afterEach(() => jest.restoreAllMocks());

test('renders base html', () => {
  const template = utils.getBaseTemplate();
  const config = {
    assetsPath: '/bull/assets',
    basePath: '/bull',
  };

  expect(template({config})).toMatchSnapshot();
  delete utils.baseTemplate;
});

test('get render from cache', () => {
  jest.spyOn(fs, 'readFileSync');

  const templateA = utils.getBaseTemplate();
  const templateB = utils.getBaseTemplate();

  expect(fs.readFileSync).toBeCalledTimes(1);
  expect(templateA).toBe(templateB);
  delete utils.baseTemplate;
});
