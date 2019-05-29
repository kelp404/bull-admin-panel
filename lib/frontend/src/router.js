const {Router} = require('capybara-router');
const history = require('history');
const api = require('./api');

const BASE_PATH = window.config.basePath;

module.exports = new Router({
  history: history.createBrowserHistory(),
  routes: [
    {
      isAbstract: true,
      name: 'web',
      uri: `${BASE_PATH}`,
      resolve: {
        types: api.type.getTypes
      },
      component: require('./pages/shared/layout')
    },
    {
      name: 'web.jobs',
      uri: '',
      component: require('./pages/jobs')
    },
    {
      name: 'error',
      uri: `${BASE_PATH}`,
      component: require('./pages/shared/error-page')
    },
    {
      name: 'not-found',
      uri: '.*',
      onEnter: () => {
        document.title = 'Not found - Kue Admin Panel';
      },
      component: require('./pages/shared/not-found')
    }
  ],
  errorComponent: require('./pages/shared/error-page')
});
