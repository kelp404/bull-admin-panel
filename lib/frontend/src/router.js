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
        types: api.type.getTypes,
        jobQuantity: api.job.countAllStateJobs
      },
      component: require('./pages/shared/layout')
    },
    {
      name: 'web.jobs',
      uri: '?state?type?sort',
      resolve: {
        jobs: params => api.job.getJobs({
          state: params.state || 'active',
          type: params.type,
          sort: params.sort
        })
      },
      onEnter: () => {
        document.title = 'Kue Admin Panel';
      },
      component: require('./pages/jobs')
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
