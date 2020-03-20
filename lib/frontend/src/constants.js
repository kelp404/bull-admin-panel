module.exports = {
  STORE_CHANGE: 'STORE_CHANGE_',
  jobStates: {
    WAITING: 'waiting',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    FAILED: 'failed',
    DELAYED: 'delayed'
  },
  eventTypes: {
    JOB_WAITING: 'job-waiting',
    JOB_ACTIVE: 'job-active',
    JOB_COMPLETED: 'job-completed',
    JOB_FAILED: 'job-failed',
    JOB_REMOVED: 'job-removed'
  }
};
