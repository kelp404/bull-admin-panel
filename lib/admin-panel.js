const path = require('path');
const express = require('express');
const queryString = require('query-string');
const WebSocket = require('ws');
const errors = require('./models/errors');
const Request = require('./models/request');
const Response = require('./models/response');
const Notification = require('./models/notification');
const EventType = require('./models/constants/event-type');
const JobModel = require('./models/dto/job-model');
const socketRouter = require('./routers/socket-router');
const webRouter = require('./routers/web-router');

const _isDebug = process.env.BULL_ADMIN_PANEL_DEBUG;

module.exports = class AdminPanel {
  /**
   * @param {express.Router} expressRouter - The express router.
   * @param {string} basePath - The admin panel base uri.
   * @param {string|null} socketValidationPath - The default is basePath.
   *    It is for validation websocket path. The websocket just accepts to connect to this path.
   * @param {function(info: object, callback: function)} verifyClient - The authorization function.
   * @param {Array<Bull>} queues - Bull instances.
   * @param {http.Server} server - The http server.
   */
  constructor({expressRouter, basePath, socketValidationPath, verifyClient, queues, server}) {
    this.expressRouter = expressRouter;
    this.basePath = basePath;
    this.socketValidationPath = socketValidationPath || basePath;
    this.verifyClient = verifyClient;
    this.queues = queues;
    this.server = server;
    this.pool = {}; // The websocket connection pool.

    this.wss = new WebSocket.Server({noServer: true, verifyClient: this.verifyClient});
    this.wss.on('connection', this.onConnection.bind(this));
    this.server.on('upgrade', this.onUpgrade.bind(this));

    this.jobEventHandler.bind(this);
    this.listenQueuesEvents.bind(this)();

    this.expressRouter.use(
      '/assets',
      (req, res, next) => {
        if (/\.(js|css|svg)$/.test(req.path)) {
          res.set('Content-Encoding', 'gzip');
        }

        next();
      },
      express.static(path.join(__dirname, 'frontend', 'dist')),
    );
    this.expressRouter.use(
      (req, res, next) => {
        res.locals.bullAdminPanel = {
          assetsPath: _isDebug ? '//localhost:8001' : `${this.basePath}/assets`,
          basePath: this.basePath,
        };
        next();
      },
      webRouter,
    );
  }

  /**
   * The server upgrade event handler.
   * @param {http.IncomingMessage} request
   * @param {stream.Duplex} socket
   * @param {Buffer} head
   */
  onUpgrade(request, socket, head) {
    const {url} = queryString.parseUrl(request.url);

    if (url === this.socketValidationPath) {
      this.wss.handleUpgrade(request, socket, head, ws => {
        this.wss.emit('connection', ws, request);
      });
    }
  }

  /**
   * The websocket connect event handler.
   * @param {WebSocket} ws - The socket.
   */
  onConnection(ws) {
    ws.id = Math.random().toString(36);
    this.pool[ws.id] = ws;
    ws.on('message', message => {
      let request;
      let response;

      try {
        request = new Request({...JSON.parse(message), queues: this.queues});
        response = new Response({requestId: request.id, ws});
        const result = socketRouter.dispatch(request, response, () => {
          throw new errors.Http404(`Not found ${request.method} ${request.url}`);
        });

        if (result && typeof result.catch === 'function') {
          result.catch(error => {
            AdminPanel.returnError(response, error);
          });
        }
      } catch (error) {
        AdminPanel.returnError(response, error);
      }
    });
    ws.on('close', () => {
      delete this.pool[ws.id];
    });
  }

  /**
   * @param {string} eventType - The event type.
   * @param {Bull} queue - The queue.
   * @param {string} jobId - The job id.
   */
  async jobEventHandler(eventType, queue, jobId) {
    if (!Object.keys(this.pool).length) {
      return;
    }

    const data = {
      queueName: queue.name,
    };

    if (eventType === EventType.REMOVED) {
      data.job = {id: jobId};
    } else {
      const job = await queue.getJob(jobId);

      if (job == null) {
        // The job was deleted.
        return;
      }

      data.job = new JobModel(job);
    }

    Object.keys(this.pool).forEach(wsId => {
      const notification = new Notification({ws: this.pool[wsId]});

      notification.json(eventType, data);
    });
  }

  listenQueuesEvents() {
    this.queues.forEach(queue => {
      queue.on('global:waiting', jobId => {
        this.jobEventHandler(EventType.WAITING, queue, jobId);
      });
      queue.on('global:active', jobId => {
        this.jobEventHandler(EventType.ACTIVE, queue, jobId);
      });
      queue.on('global:completed', jobId => {
        this.jobEventHandler(EventType.COMPLETED, queue, jobId);
      });
      queue.on('global:failed', jobId => {
        this.jobEventHandler(EventType.FAILED, queue, jobId);
      });
      queue.on('removed', job => {
        // Todo: replace removed event with global:removed event.
        // The global:removed event is never triggered.
        // https://github.com/OptimalBits/bull/issues/1421#issuecomment-522110803
        this.jobEventHandler(EventType.REMOVED, queue, job.id);
      });
    });
  }

  static returnError(response, error) {
    if (!(error instanceof Error)) {
      error = new errors.Http500(error);
    }

    console.error(error);
    if (response) {
      response.json(
        {
          message: `${error}`,
          stack: _isDebug ? error.stack : undefined,
          extra: error.extra,
        },
        error.status || 500,
      );
    }
  }
};
