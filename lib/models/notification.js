module.exports = class Notification {
  static get eventTypes() {
    return {
      JOB_WAITING: 'job-waiting',
      JOB_ACTIVE: 'job-active',
      JOB_COMPLETED: 'job-completed',
      JOB_FAILED: 'job-failed',
      JOB_REMOVED: 'job-removed'
    };
  }

  constructor({ws}) {
    this.ws = ws;
  }

  json(eventType, data) {
    this.ws.send(JSON.stringify({
      type: 'notification',
      event: eventType,
      body: data
    }));
  }
};
