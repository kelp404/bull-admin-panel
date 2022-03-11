const queryString = require('query-string');
const store = require('./store');
const {eventTypes} = require('./constants');

const socket = {
  url: null,
  pool: {},
  backgroundPool: {},
  ws: null,

  /**
   * Connect to the server via websocket.
   * @param {string|null} url - This is just work for the first connect.
   */
  connect(url) {
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
      Object.keys(socket.backgroundPool).forEach(requestId => {
        socket.send(requestId);
      });
    };

    socket.ws.onmessage = message => {
      const content = JSON.parse(message.data);
      if (content.type === 'response') {
        // The server return the message for the request.
        if (content.status >= 200 && content.status < 300) {
          if (socket.pool[content.id]) {
            socket.pool[content.id].deferred.resolve(content);
          } else if (socket.backgroundPool[content.id]) {
            socket.backgroundPool[content.id].deferred.resolve(content);
          }
        } else {
          const error = new Error(content && content.body && content.body.message);

          if (socket.pool[content.id]) {
            Object.assign(error, content);
            socket.pool[content.id].deferred.reject(error);
          } else if (socket.backgroundPool[content.id]) {
            Object.assign(error, content);
            socket.backgroundPool[content.id].deferred.reject(error);
          }
        }
      } else if (content.type === 'notification') {
        // The server push the message.
        const subscriptions = module.exports.subscriptions[content.event];
        Object.keys(subscriptions).forEach(key => {
          subscriptions[key](content);
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

  /**
   * If the args is string, it will send the content from @socket.pool.
   * @param {string|{method: string, url: string, body: Object, isBackground: boolean}} args
   * @returns {Promise<{type: string, status: number, id: string, body: {Object}}>}
   */
  send(args = {}) {
    const pool = args.isBackground ? socket.backgroundPool : socket.pool;
    let socketContent;

    if (typeof args === 'string') {
      socketContent = socket.pool[args] || socket.backgroundPool[args];
    } else {
      socketContent = {
        id: Math.random().toString(36),
        method: args.method.toUpperCase(),
        url: args.url,
        body: args.body,
        deferred: {},
      };
      const promise = new Promise((resolve, reject) => {
        socketContent.deferred.resolve = resolve;
        socketContent.deferred.reject = reject;
      });

      pool[socketContent.id] = socketContent;
      promise
        .then(result => {
          delete pool[socketContent.id];
          return result;
        })
        .catch(error => {
          delete pool[socketContent.id];
          throw error;
        })
        .finally(socket.updateApiStatus);
      socketContent.deferred.promise = promise;
      socket.updateApiStatus();
    }

    if (socket.ws.readyState === socket.ws.OPEN) {
      socket.ws.send(JSON.stringify({
        id: socketContent.id,
        method: socketContent.method,
        url: socketContent.url,
        body: socketContent.body,
      }));
      setTimeout(() => {
        // Timeout 60s.
        if (pool[socketContent.id]) {
          socketContent.deferred.reject(new Error('Timeout 60s.'));
        }
      }, 60000);
    }

    return socketContent.deferred.promise;
  },

  /**
   * Update store.$isApiProcessing.
   * @returns {undefined}
   */
  updateApiStatus() {
    if (Object.keys(socket.pool).length) {
      if (!store.get('$isApiProcessing')) {
        store.set('$isApiProcessing', true);
      }
    } else if (store.get('$isApiProcessing')) {
      store.set('$isApiProcessing', false);
    }
  },
};

module.exports = {
  socket,
  eventTypes,
  subscriptions: {
    [eventTypes.WAITING]: {},
    [eventTypes.ACTIVE]: {},
    [eventTypes.COMPLETED]: {},
    [eventTypes.FAILED]: {},
    [eventTypes.REMOVED]: {},
  },

  /**
   * Subscribe notifications from the server.
   * @param {string} eventType
   * @param {function({type: string, event: string, body: Object})} func
   * @returns {function()} - Unsubscribe.
   */
  subscribe(eventType, func) {
    const token = Math.random().toString(36);
    this.subscriptions[eventType][token] = func;
    return () => {
      delete this.subscriptions[eventType][token];
    };
  },
  job: {
    countAllStateJobs: (queueName, options) => socket.send({
      ...options,
      method: 'post',
      url: `/queues/${queueName}/jobs/_count`,
    }),
    cleanJobs: (queueName, state, options) => socket.send({
      ...options,
      method: 'post',
      url: `/queues/${queueName}/jobs/_clean?${queryString.stringify({state})}`,
    }),
    getJobs: (queueName, {state, index, size} = {}, options = {}) => socket.send({
      ...options,
      method: 'get',
      url: `/queues/${queueName}/jobs?${queryString.stringify({state, index, size})}`,
    }),
    getJob: (queueName, jobId, options) => socket.send({
      ...options,
      method: 'get',
      url: `/queues/${queueName}/jobs/${jobId}`,
    }),
    retryJob: (queueName, jobId, options) => socket.send({
      ...options,
      method: 'post',
      url: `/queues/${queueName}/jobs/${jobId}/_retry`,
    }),
    deleteJob: (queueName, jobId, options) => socket.send({
      ...options,
      method: 'delete',
      url: `/queues/${queueName}/jobs/${jobId}`,
    }),
  },
  queue: {
    getQueues: options => socket.send({
      ...options,
      method: 'get',
      url: '/queues',
    }),
  },
};
