module.exports = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed',
  DELAYED: 'delayed',
  PAUSED: 'paused',
  all() {
    return [
      this.WAITING,
      this.ACTIVE,
      this.COMPLETED,
      this.FAILED,
      this.DELAYED,
      this.PAUSED
    ];
  }
};
