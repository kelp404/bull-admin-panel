const queryString = require('query-string');
const store = require('./store');
const {eventTypes} = require('./constants');

const socket = {
  url: null,
  pool: {},
  ws: null,

  connect(url) {
    /*
    Connect to the server via websocket.
    @param url {String|null} This is just work for the first connect.
     */
    if (!socket.url) {
      socket.url = url;
    }

    if (socket.ws) {
      socket.ws.onclose = null;
      socket.ws.close();
    }

    socket.ws = new WebSocket(socket.url);
    socket.ws.onopen = () => {
      // Send queued data.
      Object.keys(socket.pool).forEach(requestId => {
        socket.send(requestId);
      });
    };

    socket.ws.onmessage = message => {
      const content = JSON.parse(message.data);
      if (content.type === 'response') {
        // The server return the message for the request.
        if (content.status >= 200 && content.status < 300) {
          if (socket.pool[content.id]) {
            socket.pool[content.id].deferred.resolve(content.body);
          }
        } else if (socket.pool[content.id]) {
          socket.pool[content.id].deferred.reject(content.body);
        }
      } else if (content.type === 'notification') {
        // The server push the message.
        const subscriptions = module.exports.subscriptions[content.event];
        Object.keys(subscriptions).forEach(key => {
          subscriptions[key](content.body);
        });
      }
    };

    socket.ws.onclose = () => {
      setTimeout(() => {
        // Re-connect after 3 seconds.
        socket.connect();
      }, 3000);
    };
  },

  send(args = {}) {
    /*
    If the args is string, it will send the content from @socket.pool.
    @param args {String|Object}
      disableErrorMessage {Boolean}
      method {String}
      url {String}
      body {Object}
     */
    let socketContent;
    if (typeof args === 'string') {
      socketContent = socket.pool[args];
    } else {
      socketContent = {
        id: Math.random().toString(36).substr(2),
        method: args.method.toUpperCase(),
        url: args.url,
        body: args.body,
        deferred: {}
      };
      socket.pool[socketContent.id] = socketContent;
      const promise = new Promise((resolve, reject) => {
        socketContent.deferred.resolve = resolve;
        socketContent.deferred.reject = reject;
      });
      promise.then(result => {
        delete socket.pool[socketContent.id];
        return result;
      });
      promise.catch(error => {
        delete socket.pool[socketContent.id];
        throw error;
      });
      promise.finally(socket.updateApiStatus);
      socketContent.deferred.promise = promise;
      socket.updateApiStatus();
    }

    if (socket.ws.readyState === socket.ws.OPEN) {
      socket.ws.send(JSON.stringify({
        id: socketContent.id,
        method: socketContent.method,
        url: socketContent.url,
        body: socketContent.body
      }));
      setTimeout(() => {
        // Timeout 60s.
        if (socket.pool[socketContent.id]) {
          socketContent.deferred.reject(new Error('Timeout 60s.'));
        }
      }, 60000);
    }

    return socketContent.deferred.promise;
  },

  updateApiStatus() {
    /*
    Update store.$isApiProcessing.
     */
    if (Object.keys(socket.pool).length) {
      if (!store.get('$isApiProcessing')) {
        store.set('$isApiProcessing', true);
      }
    } else if (store.get('$isApiProcessing')) {
      store.set('$isApiProcessing', false);
    }
  }
};

module.exports = {
  socket: socket,
  eventTypes: eventTypes,
  subscriptions: {
    [eventTypes.JOB_WAITING]: {},
    [eventTypes.JOB_ACTIVE]: {},
    [eventTypes.JOB_COMPLETED]: {},
    [eventTypes.JOB_FAILED]: {},
    [eventTypes.JOB_PAUSED]: {},
    [eventTypes.JOB_REMOVED]: {}
  },
  subscribe(eventType, func) {
    /*
    Subscribe notifications from the server.
    @param eventType {String}
    @param func {Function} (data) =>
    @returns {Function} Unsubscribe
     */
    const token = Math.random().toString(36).substr(2);
    this.subscriptions[eventType][token] = func;
    return () => {
      delete this.subscriptions[eventType][token];
    };
  },
  job: {
    countAllStateJobs: queueName => socket.send({
      method: 'post',
      url: `/queues/${queueName}/jobs/_count`
    }),
    getJobs: (queueName, {state, index, size} = {}) => socket.send({
      method: 'get',
      url: `/queues/${queueName}/jobs?${queryString.stringify({state, index, size})}`
    }),
    getJob: (queueName, jobId) => socket.send({
      method: 'get',
      url: `/queues/${queueName}/jobs/${jobId}`
    }),
    retryJob: (queueName, jobId) => socket.send({
      method: 'post',
      url: `/queues/${queueName}/jobs/${jobId}/_retry`
    }),
    deleteJob: (queueName, jobId) => socket.send({
      method: 'delete',
      url: `/queues/${queueName}/jobs/${jobId}`
    })
  },
  queue: {
    getQueues: () => socket.send({
      method: 'get',
      url: '/queues'
    })
  }
};
