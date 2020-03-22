const {Router} = require('capybara-router');
const history = require('history');
const {jobStates} = require('./constants');
const api = require('./api');

const BASE_PATH = window.config.basePath;
const TITLE = 'Kue Admin Panel';

module.exports = new Router({
  history: history.createBrowserHistory(),
  routes: [
    {
      isAbstract: true,
      name: 'web',
      uri: `${BASE_PATH}?queue`,
      resolve: {
        queues: api.queue.getQueues
      },
      component: require('./pages/shared/layout')
    },
    {
      name: 'web.jobs',
      uri: '?state',
      resolve: {
        jobCounts: ({queue}) => {
          if (!queue) {
            return null;
          }

          return api.job.countAllStateJobs(queue);
        },
        jobs: ({queue, state}) => {
          if (!queue) {
            return null;
          }

          return api.job.getJobs(queue, {state: state || jobStates.ACTIVE});
        }
      },
      onEnter: props => {
        const table = {
          [jobStates.WAITING]: `Waiting - ${TITLE}`,
          [jobStates.ACTIVE]: `Active - ${TITLE}`,
          [jobStates.COMPLETED]: `Completed - ${TITLE}`,
          [jobStates.FAILED]: `Failed - ${TITLE}`,
          [jobStates.DELAYED]: `Delayed - ${TITLE}`
        };
        document.title = table[props.params.state || jobStates.ACTIVE];
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
