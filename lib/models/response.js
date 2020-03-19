module.exports = class Response {
  /**
   * @param {string} requestId - The request id.
   * @param {ws} ws - The websocket connection.
   */
  constructor({requestId, ws}) {
    this.requestId = requestId;
    this.ws = ws;
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
