const {Router} = require('capybara-router');
const history = require('history');
const {jobState} = require('./constants');
const api = require('./api');

const BASE_PATH = window.config.basePath;
const TITLE = 'Kue Admin Panel';

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
      uri: '?state?type?sort',
      resolve: {
        jobQuantity: api.job.countAllStateJobs,
        jobs: params => api.job.getJobs({
          state: params.state || jobState.ACTIVE,
          type: params.type,
          sort: params.sort
        })
      },
      onEnter: props => {
        const table = {
          [jobState.INACTIVE]: `Inactive - ${TITLE}`,
          [jobState.ACTIVE]: `Active - ${TITLE}`,
          [jobState.COMPLETE]: `Complete - ${TITLE}`,
          [jobState.FAILED]: `Failed - ${TITLE}`,
          [jobState.DELAYED]: `Delayed - ${TITLE}`
        };
        document.title = table[props.params.state];
      },
      component: require('./pages/jobs')
    },
    {
      name: 'web.jobs.details',
      uri: '/jobs/{jobId:\\d+}',
      onEnter: props => {
        document.title = `#${props.job.id} - ${TITLE}`;
      },
      resolve: {
        job: params => api.job.getJob(params.jobId)
      },
      component: require('./pages/job')
    },
    {
      name: 'not-found',
      uri: '.*',
      onEnter: () => {
        document.title = `Not found - ${TITLE}`;
      },
      component: require('./pages/shared/not-found')
    }
  ],
  errorComponent: require('./pages/shared/error-page')
});
