module.exports = class Response {
  /**
   * @param {string} requestId - The request id.
   * @param {WebSocket} ws - The websocket connection.
   * @property {string} requestId - The request id.
   * @property {WebSocket} ws - The websocket connection.
   * @property {boolean} isDidResponse - True: The response was sent.
   */
  constructor({requestId, ws}) {
    this.requestId = requestId;
    this.ws = ws;
    this.isDidResponse = false;
  }

  /**
   * @param {Object} data - The response body.
   * @param {number|undefined} status - The response status. Default is 200.
   */
  json(data, status = 200) {
    if (this.isDidResponse) {
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'response',
      id: this.requestId,
      status,
      body: data,
    }));
    this.end();
  }

  end() {
    this.isDidResponse = true;
  }
};
