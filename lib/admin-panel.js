const path = require('path');
const dispatch = require('dispatch');
const express = require('express');
const queryString = require('query-string');
const WebSocket = require('ws');
const utils = require('./common/utils');
const errors = require('./models/errors');
const Request = require('./models/request');
const Response = require('./models/response');
const Notification = require('./models/notification');
const JobModel = require('./models/dto/job-model');
const socketRouter = require('./routers/socket-router');
const webRouter = require('./routers/web-router');

const _isDebug = process.env.KUE_ADMIN_PANEL_DEBUG;

module.exports = class AdminPanel {
  constructor(args = {}) {
    /*
    @param args {Object}
      basePath {String}
      expressRouter {express.Router}
      verifyClient {Function} (info, callback) =>
      queue {kue.Queue}
      server {http.Server}
     */
    this.basePath = args.basePath;
    this.expressRouter = args.expressRouter;
    this.verifyClient = args.verifyClient;
    this.queue = args.queue;
    this.server = args.server;
    this.pool = {};

    this.dispatcher = dispatch(socketRouter);
    this.wss = new WebSocket.Server({noServer: true, verifyClient: this.verifyClient});
    this.wss.on('connection', this.onConnection.bind(this));
    this.server.on('upgrade', this.onUpgrade.bind(this));

    this.jobEventHandler.bind(this);
    this.listenQueueEvents.bind(this)();

    this.expressRouter.use(
      '/assets',
      (req, res, next) => {
        if (/\.(js|css|svg)$/.test(req.path)) {
          res.set('Content-Encoding', 'gzip');
        }

        next();
      },
      express.static(path.join(__dirname, 'frontend', 'dist'))
    );
    this.expressRouter.use(
      (req, res, next) => {
        res.locals.kueAdminPanel = {
          assetsPath: _isDebug ? '//localhost:8001' : `${this.basePath}/assets`,
          basePath: this.basePath
        };
        next();
      },
      webRouter
    );
  }

  onUpgrade(request, socket, head) {
    /*
    The server upgrade event handler.
     */
    const {url} = queryString.parseUrl(request.url);
    if (url === this.basePath) {
      this.wss.handleUpgrade(request, socket, head, ws => {
        this.wss.emit('connection', ws, request);
      });
    }
  }

  onConnection(ws) {
    /*
    The websocket connect event handler.
     */
    ws.id = Math.random().toString(36).substr(2);
    this.pool[ws.id] = ws;
    ws.on('message', message => {
      let request;
      let response;
      let result;
      try {
        request = new Request({
          ...JSON.parse(message),
          queue: this.queue
        });
        response = new Response({
          requestId: request.id,
          ws: ws
        });
      } catch (error) {
        AdminPanel.returnError(response, error);
      }

      try {
        result = this.dispatcher(request, response, () => {
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

  jobEventHandler(eventType, jobId) {
    /*
    @param eventType {String}
    @param jobId {String}
     */
    if (eventType === Notification.eventTypes.JOB_REMOVE) {
      Object.keys(this.pool).forEach(wsId => {
        const notification = new Notification({ws: this.pool[wsId]});
        notification.json(eventType, {id: Number(jobId)});
      });
      return;
    }

    utils.getJob(jobId)
      .then(job => {
        const jobInfo = new JobModel({...job, isDetailResult: true});
        Object.keys(this.pool).forEach(wsId => {
          const notification = new Notification({ws: this.pool[wsId]});
          notification.json(eventType, jobInfo);
        });
      })
      .catch(() => {
        // The job was removed.
        // We need to send the notification let the job quantity on the frontend is right.
        const jobInfo = {
          id: Number(jobId),
          state: 'removed'
        };
        Object.keys(this.pool).forEach(wsId => {
          const notification = new Notification({ws: this.pool[wsId]});
          notification.json(eventType, jobInfo);
        });
      });
  }

  listenQueueEvents() {
    this.queue.on('job enqueue', jobId => {
      this.jobEventHandler(Notification.eventTypes.JOB_ENQUEUE, jobId);
    });
    this.queue.on('job start', jobId => {
      this.jobEventHandler(Notification.eventTypes.JOB_START, jobId);
    });
    this.queue.on('job complete', jobId => {
      this.jobEventHandler(Notification.eventTypes.JOB_COMPLETE, jobId);
    });
    this.queue.on('job remove', jobId => {
      this.jobEventHandler(Notification.eventTypes.JOB_REMOVE, jobId);
    });
    this.queue.on('job failed', jobId => {
      this.jobEventHandler(Notification.eventTypes.JOB_FAILED, jobId);
    });
    this.queue.on('job failed attempt', jobId => {
      this.jobEventHandler(Notification.eventTypes.JOB_FAILED, jobId);
    });
  }

  static returnError(response, error) {
    if (!(error instanceof Error)) {
      error = new errors.Http500(error);
    }

    console.error(error);
    response.json(
      {
        message: `${error}`,
        stack: _isDebug ? error.stack : undefined,
        extra: error.extra
      },
      error.status || 500
    );
  }
};
