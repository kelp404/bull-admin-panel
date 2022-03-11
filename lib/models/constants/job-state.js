module.exports = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed',
  all() {
    return [
      this.WAITING,
      this.ACTIVE,
      this.COMPLETED,
      this.FAILED,
    ];
  },
};
