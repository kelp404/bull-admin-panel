module.exports = class Notification {
  constructor({ws}) {
    this.ws = ws;
  }

  json(eventType, data) {
    this.ws.send(JSON.stringify({
      type: 'notification',
      event: eventType,
      body: data,
    }));
  }
};
