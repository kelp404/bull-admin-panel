module.exports = class Response {
  constructor(args = {}) {
    this.requestId = args.requestId;
    this.ws = args.ws;
    this.isDidResponse = false;
  }

  json(data, status = 200) {
    if (this.isDidResponse) {
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'response',
      id: this.requestId,
      status: status,
      body: data
    }));
    this.end();
  }

  end() {
    this.isDidResponse = true;
  }
};
