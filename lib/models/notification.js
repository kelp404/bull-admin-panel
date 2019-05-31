module.exports = class Notification {
  static get eventTypes() {
    return {
      JOB_ENQUEUE: 'job-enqueue',
      JOB_START: 'job-start',
      JOB_COMPLETE: 'job-complete',
      JOB_FAILED: 'job-failed',
      JOB_REMOVE: 'job-remove'
    };
  }

  constructor(args = {}) {
    this.ws = args.ws;
  }

  json(eventType, data) {
    this.ws.send(JSON.stringify({
      type: 'notification',
      event: eventType,
      body: data
    }));
  }
};
