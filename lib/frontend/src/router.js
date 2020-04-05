const {Router} = require('capybara-router');
const history = require('history');
const {jobStates} = require('./constants');
const api = require('./api');

const BASE_PATH = window.config.basePath;
const TITLE = 'Bull Admin Panel';

module.exports = new Router({
  history: history.createBrowserHistory(),
  routes: [
    {
      isAbstract: true,
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
        jobs: ({queue, state}) => {
          if (!queue) {
            return Promise.resolve(null);
          }

          return api.job.getJobs(queue, {state: state || jobStates.ACTIVE});
        }
      },
      onEnter: ({params}) => {
        document.title = params.queue ? `${params.queue} - ${TITLE}` : TITLE;
      },
      component: require('./pages/jobs')
    },
    {
      name: 'web.jobs.details',
      uri: '/jobs/{jobId:\\d+}',
      dismissalDelay: 300,
      onEnter: ({params, job}) => {
        document.title = `#${job.id} - ${params.queue} - ${TITLE}`;
      },
      resolve: {
        job: ({queue, jobId}) => api.job.getJob(queue, jobId)
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
