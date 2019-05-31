module.exports = class Notification {
  static get eventTypes() {
    return {
      JOB_ENQUEUE: 'job-enqueue'
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
