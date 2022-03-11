module.exports = {
  WAITING: 'job-waiting',
  ACTIVE: 'job-active',
  COMPLETED: 'job-completed',
  FAILED: 'job-failed',
  REMOVED: 'job-removed',
  all() {
    return [
      this.WAITING,
      this.ACTIVE,
      this.COMPLETED,
      this.FAILED,
      this.REMOVED,
    ];
  },
};
