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
      name: 'web',
      uri: `${BASE_PATH}`,
      resolve: {
        queues: api.queue.getQueues
      },
      component: require('./pages/shared/layout')
    },
    {
      name: 'web.jobs',
      uri: '?queue?state',
      resolve: {
        jobQuantity: () => {},
        jobs: ({queue, state}) => {}
      },
      onEnter: props => {
        const table = {
          [jobState.INACTIVE]: `Inactive - ${TITLE}`,
          [jobState.ACTIVE]: `Active - ${TITLE}`,
          [jobState.COMPLETE]: `Complete - ${TITLE}`,
          [jobState.FAILED]: `Failed - ${TITLE}`,
          [jobState.DELAYED]: `Delayed - ${TITLE}`
        };
        document.title = table[props.params.state || jobState.ACTIVE];
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
