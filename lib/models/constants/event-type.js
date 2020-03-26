module.exports = {
  WAITING: 'job-waiting',
  ACTIVE: 'job-active',
  COMPLETED: 'job-completed',
  FAILED: 'job-failed',
  PAUSED: 'job-paused',
  REMOVED: 'job-removed',
  all() {
    return [
      this.WAITING,
      this.ACTIVE,
      this.COMPLETED,
      this.FAILED,
      this.PAUSED,
      this.REMOVED
    ];
  }
};
